/** Translation and Malayalam simplification without client-side API keys. */

const MAX_INPUT_CHARS = 20000;
const REQUEST_CHUNK_CHARS = 4200;

function userFacingError(message) {
  const error = new Error(message);
  error.userMessage = message;
  return error;
}

function normaliseText(text) {
  return String(text || '').replace(/\s+/g, ' ').replace(/\u00ad/g, '').trim();
}

function splitIntoChunks(text) {
  const chunks = [];
  let remaining = text;
  while (remaining.length > REQUEST_CHUNK_CHARS) {
    let boundary = Math.max(
      remaining.lastIndexOf('. ', REQUEST_CHUNK_CHARS), remaining.lastIndexOf('? ', REQUEST_CHUNK_CHARS),
      remaining.lastIndexOf('! ', REQUEST_CHUNK_CHARS), remaining.lastIndexOf('। ', REQUEST_CHUNK_CHARS)
    );
    if (boundary < REQUEST_CHUNK_CHARS * 0.5) boundary = remaining.lastIndexOf(' ', REQUEST_CHUNK_CHARS);
    if (boundary < 1) boundary = REQUEST_CHUNK_CHARS;
    chunks.push(remaining.slice(0, boundary + 1).trim());
    remaining = remaining.slice(boundary + 1).trim();
  }
  if (remaining) chunks.push(remaining);
  return chunks;
}

function isMostlyMalayalam(text) {
  const letters = text.match(/[A-Za-z\u0D00-\u0D7F]/g) || [];
  const malayalam = text.match(/[\u0D00-\u0D7F]/g) || [];
  return letters.length > 0 && malayalam.length / letters.length > 0.75;
}

async function extractActivePageText() {
  if (typeof chrome !== 'undefined' && chrome.tabs) {
    try {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      const response = await chrome.tabs.sendMessage(tabs?.[0]?.id, { action: 'EXTRACT_PAGE_CONTENT' });
      if (response?.success) return response.data?.fullText || '';
    } catch (_) {
      // The page may not permit content scripts (for example chrome:// pages).
    }
  }
  if (typeof window !== 'undefined' && window.parent?.ThunaiContentScript) {
    return window.parent.ThunaiContentScript.extractRealPageContent()?.fullText || '';
  }
  return '';
}

async function translateChunk(chunk, targetLang) {
  const url = new URL('https://translate.googleapis.com/translate_a/single');
  url.searchParams.set('client', 'gtx');
  url.searchParams.set('sl', 'auto');
  url.searchParams.set('tl', targetLang);
  url.searchParams.set('dt', 't');
  url.searchParams.set('q', chunk);
  let response;
  try { response = await fetch(url); }
  catch (_) { throw userFacingError('Translation service could not be reached. Please check your connection and try again.'); }
  if (!response.ok) throw userFacingError('Translation service is temporarily unavailable. Please try again shortly.');
  let payload;
  try { payload = await response.json(); }
  catch (_) { throw userFacingError('The translation service returned an invalid response. Please try again.'); }
  const translated = payload?.[0]?.map((part) => part?.[0] || '').join('').trim();
  if (!translated) throw userFacingError('No translated text was returned. Please try again.');
  return { translated, detectedLang: payload?.[2] || 'unknown' };
}

/** Simplifies only unambiguous Malayalam wording and existing sentence boundaries. */
export function simplifyMalayalam(text) {
  const replacements = [
    [/ഉപയോക്താക്കൾ/g, 'ആളുകൾ'], [/സംബന്ധിച്ച/g, 'കുറിച്ചുള്ള'],
    [/നൽകിയിരിക്കുന്ന/g, 'നൽകിയ'], [/ലഭ്യമാക്കുന്നു/g, 'നൽകുന്നു'],
    [/ആവശ്യമായ/g, 'വേണ്ട'], [/ഉപയോഗപ്പെടുത്തുക/g, 'ഉപയോഗിക്കുക']
  ];
  let simplified = normaliseText(text);
  replacements.forEach(([from, to]) => { simplified = simplified.replace(from, to); });
  return simplified.replace(/([,;:])\s+/g, '$1\n').replace(/([.!?।])\s+/g, '$1\n').replace(/\n{2,}/g, '\n').trim();
}

export async function translateText(sourceText = '', targetLang = 'ml') {
  let textToTranslate = normaliseText(sourceText);
  if (!textToTranslate) textToTranslate = normaliseText(await extractActivePageText());
  if (!textToTranslate) throw userFacingError('No readable text was found on this page. Try scanning the page or select a page with text.');
  if (textToTranslate.length > MAX_INPUT_CHARS) {
    throw userFacingError(`This page has too much text to translate at once. Please scan or select a shorter section (up to ${MAX_INPUT_CHARS.toLocaleString()} characters).`);
  }
  let translated;
  let detectedLang = 'ml';
  if (targetLang === 'ml' && isMostlyMalayalam(textToTranslate)) {
    translated = textToTranslate;
  } else {
    const results = [];
    for (const chunk of splitIntoChunks(textToTranslate)) results.push(await translateChunk(chunk, targetLang));
    translated = results.map((result) => result.translated).join('\n\n');
    detectedLang = results[0]?.detectedLang || 'unknown';
  }
  return {
    success: true, original: textToTranslate, translated, simplified: simplifyMalayalam(translated), detectedLang,
    wordCount: translated.split(/\s+/).filter(Boolean).length, timestamp: new Date().toISOString()
  };
}

export async function simplifyText(malayalamText) {
  const source = normaliseText(malayalamText);
  if (!source) throw userFacingError('There is no Malayalam text available to simplify.');
  const simplified = simplifyMalayalam(source);
  const originalWords = source.split(/\s+/).filter(Boolean).length;
  const simpleWords = simplified.split(/\s+/).filter(Boolean).length;
  return { success: true, simplified, reductionPercent: Math.max(0, Math.round((1 - simpleWords / originalWords) * 100)), readabilityScore: 'Easy to read' };
}
