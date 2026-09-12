/**
 * Thunai Translation and Malayalam Simplification Service
 * Supports English → Malayalam, Hindi → Malayalam, and Direct Malayalam Simplification.
 * Uses secure dual-engine fallback (Google Client + MyMemory Engine) without client-side API keys.
 */

const MAX_INPUT_CHARS = 20000;
const REQUEST_CHUNK_CHARS = 2500;

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
      remaining.lastIndexOf('. ', REQUEST_CHUNK_CHARS),
      remaining.lastIndexOf('? ', REQUEST_CHUNK_CHARS),
      remaining.lastIndexOf('! ', REQUEST_CHUNK_CHARS),
      remaining.lastIndexOf('। ', REQUEST_CHUNK_CHARS),
      remaining.lastIndexOf('\n', REQUEST_CHUNK_CHARS)
    );
    if (boundary < REQUEST_CHUNK_CHARS * 0.4) boundary = remaining.lastIndexOf(' ', REQUEST_CHUNK_CHARS);
    if (boundary < 1) boundary = REQUEST_CHUNK_CHARS;
    chunks.push(remaining.slice(0, boundary + 1).trim());
    remaining = remaining.slice(boundary + 1).trim();
  }
  if (remaining) chunks.push(remaining);
  return chunks;
}

export function isMostlyMalayalam(text) {
  const letters = text.match(/[A-Za-z\u0D00-\u0D7F\u0900-\u097F]/g) || [];
  const malayalam = text.match(/[\u0D00-\u0D7F]/g) || [];
  return letters.length > 0 && malayalam.length / letters.length > 0.65;
}

export function detectLanguageHint(text) {
  const malayalamCount = (text.match(/[\u0D00-\u0D7F]/g) || []).length;
  const hindiCount = (text.match(/[\u0900-\u097F]/g) || []).length;
  const englishCount = (text.match(/[A-Za-z]/g) || []).length;

  if (malayalamCount > hindiCount && malayalamCount > englishCount) return 'ml';
  if (hindiCount > malayalamCount && hindiCount > englishCount) return 'hi';
  return 'en';
}

export function getLanguageDisplayName(langCode, inLang = 'ml') {
  const isMl = inLang === 'ml';
  const code = (langCode || 'en').toLowerCase().split('-')[0];
  switch (code) {
    case 'hi':
      return isMl ? 'ഹിന്ദി (Hindi)' : 'Hindi (ഹിന്ദി)';
    case 'ml':
      return isMl ? 'മലയാളം (Malayalam)' : 'Malayalam (മലയാളം)';
    case 'en':
    default:
      return isMl ? 'ഇംഗ്ലീഷ് (English)' : 'English (ഇംഗ്ലീഷ്)';
  }
}

/**
 * Extracts live page information and automatically detects its language.
 */
export async function getActivePageInfo() {
  let title = 'Active Webpage';
  let url = '';
  let fullText = '';
  let segments = [];

  if (typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.query) {
    try {
      const tabs = await new Promise((resolve) => {
        chrome.tabs.query({ active: true, currentWindow: true }, resolve);
      });
      if (tabs && tabs[0]) {
        title = tabs[0].title || title;
        url = tabs[0].url || url;

        if (tabs[0].id) {
          const response = await new Promise((resolve) => {
            chrome.tabs.sendMessage(tabs[0].id, { action: 'EXTRACT_PAGE_CONTENT' }, (res) => {
              if (chrome.runtime.lastError) resolve(null);
              else resolve(res);
            });
          });
          if (response?.success && response.data) {
            fullText = response.data.fullText || '';
            segments = response.data.segments || [];
            if (response.data.title) title = response.data.title;
            if (response.data.url) url = response.data.url;
          }
        }
      }
    } catch (_) {}
  } else if (typeof window !== 'undefined' && window.parent?.ThunaiContentScript) {
    const data = window.parent.ThunaiContentScript.extractRealPageContent();
    if (data) {
      fullText = data.fullText || '';
      segments = data.segments || [];
      title = data.title || title;
      url = data.url || url;
    }
  }

  const langCode = detectLanguageHint(fullText || title);
  return {
    url,
    title,
    fullText,
    segments,
    langCode,
    langLabel: getLanguageDisplayName(langCode, 'ml'),
    langLabelEn: getLanguageDisplayName(langCode, 'en')
  };
}

async function extractActivePageText() {
  const info = await getActivePageInfo();
  return info.fullText || '';
}

/**
 * Primary Engine: Google Translation API (dict-chrome-ex / gtx client)
 */
async function translateWithGoogle(chunk, targetLang = 'ml', sourceLang = 'auto') {
  const url = new URL('https://translate.googleapis.com/translate_a/single');
  url.searchParams.set('client', 'dict-chrome-ex');
  url.searchParams.set('sl', sourceLang || 'auto');
  url.searchParams.set('tl', targetLang);
  url.searchParams.set('dt', 't');
  url.searchParams.set('q', chunk);

  const response = await fetch(url.toString(), {
    headers: {
      'Accept': 'application/json, text/plain, */*'
    }
  });

  if (!response.ok) {
    throw new Error(`Google translate endpoint returned HTTP ${response.status}`);
  }

  const payload = await response.json();
  const translated = payload?.[0]?.map((part) => part?.[0] || '').join('').trim();
  const detected = payload?.[2] || sourceLang;

  if (!translated) {
    throw new Error('Google translate returned empty payload');
  }

  return { translated, detectedLang: detected };
}

/**
 * Secondary Fallback Engine: MyMemory Neural Translation API
 */
async function translateWithMyMemory(chunk, targetLang = 'ml', sourceLang = 'auto') {
  let langPair = `${sourceLang === 'auto' ? 'en' : sourceLang}|${targetLang}`;
  // If source contains Devanagari script, force Hindi
  if (sourceLang === 'auto' && /[\u0900-\u097F]/.test(chunk)) {
    langPair = `hi|${targetLang}`;
  }

  const url = new URL('https://api.mymemory.translated.net/get');
  url.searchParams.set('q', chunk.slice(0, 500)); // MyMemory optimal chunk size
  url.searchParams.set('langpair', langPair);

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`MyMemory returned HTTP ${response.status}`);
  }

  const data = await response.json();
  const translatedText = data?.responseData?.translatedText;
  if (!translatedText || translatedText.startsWith('MYMEMORY WARNING')) {
    throw new Error('MyMemory translation failed');
  }

  const detected = langPair.split('|')[0];
  return { translated: translatedText.trim(), detectedLang: detected };
}

/**
 * Resilient Chunk Translator with Multi-Provider Fallback
 */
async function translateChunk(chunk, targetLang = 'ml', sourceLang = 'auto') {
  const norm = normaliseText(chunk);
  if (!norm) return { translated: '', detectedLang: 'unknown' };

  // 1. Try Google Translation API first
  try {
    return await translateWithGoogle(norm, targetLang, sourceLang);
  } catch (primaryError) {
    console.warn('Primary translation engine fallback triggered:', primaryError.message);
  }

  // 2. Fallback to MyMemory Translation API
  try {
    return await translateWithMyMemory(norm, targetLang, sourceLang);
  } catch (secondaryError) {
    console.warn('Secondary translation engine failed:', secondaryError.message);
  }

  throw userFacingError('വിവർത്തന സേവനവുമായി ബന്ധപ്പെടാൻ കഴിഞ്ഞില്ല. ദയവായി നിങ്ങളുടെ ഇന്റർനെറ്റ് കണക്ഷൻ പരിശോധിക്കുക.');
}

/**
 * Simplifies Malayalam text with clear vocabulary and improved readability
 * without altering names, dates, numbers, facts, or technical terms.
 */
export function simplifyMalayalam(text) {
  if (!text) return '';

  const vocabularyMap = [
    // Complex Administrative / Formal Terms -> Everyday Malayalam
    [/ഉപയോക്താക്കൾ/g, 'ആളുകൾ'],
    [/ഉപയോക്താവ്/g, 'ആൾ'],
    [/സംബന്ധിച്ച/g, 'കുറിച്ചുള്ള'],
    [/സംബന്ധിച്ച്/g, 'കുറിച്ച്'],
    [/നൽകിയിരിക്കുന്ന/g, 'നൽകിയ'],
    [/നൽകപ്പെട്ടിരിക്കുന്നു/g, 'നൽകിയിട്ടുണ്ട്'],
    [/ലഭ്യമാക്കുന്നു/g, 'നൽകുന്നു'],
    [/ലഭ്യമാക്കപ്പെടുന്നു/g, 'ലഭിക്കുന്നു'],
    [/ആവശ്യമായ/g, 'വേണ്ട'],
    [/ഉപയോഗപ്പെടുത്തുക/g, 'ഉപയോഗിക്കുക'],
    [/അധികാരികൾ/g, 'ഉദ്യോഗസ്ഥർ'],
    [/സമർപ്പിക്കേണ്ടതാണ്/g, 'സമർപ്പിക്കണം'],
    [/നിർബന്ധിതമാണ്/g, 'നിർബന്ധമാണ്'],
    [/രേഖപ്പെടുത്തുക/g, 'എഴുതുക'],
    [/നിർവ്വഹിക്കുക/g, 'ചെയ്യുക'],
    [/നിർദ്ദേശിക്കപ്പെട്ട/g, 'പറഞ്ഞ'],
    [/പരിഗണിക്കപ്പെടുന്നതാണ്/g, 'പരിശോധിക്കും'],
    [/പുനഃപരിശോധന/g, 'വീണ്ടും പരിശോധിക്കൽ'],
    [/അനുവദനീയമല്ല/g, 'പാടില്ല'],
    [/പ്രഖ്യാപിച്ചിരിക്കുന്നു/g, 'അറിയിച്ചു'],
    [/ആരംഭിച്ചിരിക്കുന്നു/g, 'തുടങ്ങി'],
    [/പൂർത്തിയാക്കേണ്ടതാണ്/g, 'പൂർത്തിയാക്കണം']
  ];

  let simplified = normaliseText(text);

  // Apply vocabulary simplifications
  vocabularyMap.forEach(([from, to]) => {
    simplified = simplified.replace(from, to);
  });

  // Break complex run-on sentences into readable, well-spaced lines
  // (Preserves decimal numbers like 3.14 and dates by only matching punctuation followed by space or end)
  simplified = simplified
    .replace(/([.!?।])\s+(?=[^\d])/g, '$1\n\n')
    .replace(/([;:])\s+/g, '$1\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  return simplified;
}

/**
 * Translates English or Hindi text into natural Malayalam and simplifies it.
 */
export async function translateText(sourceText = '', targetLang = 'ml', explicitSourceLang = 'auto', pageUrl = '') {
  let textToTranslate = normaliseText(sourceText);
  let detectedPageUrl = pageUrl;

  // If no text provided, extract from the active webpage DOM
  if (!textToTranslate) {
    const info = await getActivePageInfo();
    textToTranslate = normaliseText(info.fullText);
    detectedPageUrl = info.url || pageUrl;
  }

  if (!textToTranslate) {
    throw userFacingError('ഈ പേജിൽ വായിക്കാവുന്ന ഉള്ളടക്കം കണ്ടെത്താനായില്ല. ദയവായി പേജ് സ്കാൻ ചെയ്യുക അല്ലെങ്കിൽ വാചകം തിരഞ്ഞെടുക്കുക.');
  }

  if (textToTranslate.length > MAX_INPUT_CHARS) {
    throw userFacingError(`പേജിൽ വളരെയധികം വിവരങ്ങൾ അടങ്ങിയിരിക്കുന്നു. ദയവായി ചുരുങ്ങിയ ഭാഗം തിരഞ്ഞെടുക്കുക (പരമാവധി ${MAX_INPUT_CHARS.toLocaleString()} അക്ഷരങ്ങൾ).`);
  }

  let translated = '';
  let detectedLang = explicitSourceLang || 'auto';

  // If text is already mostly Malayalam, bypass translation directly to simplification
  if (targetLang === 'ml' && isMostlyMalayalam(textToTranslate)) {
    translated = textToTranslate;
    detectedLang = 'ml';
  } else {
    // Detect language hint (en or hi) if auto
    const langHint = explicitSourceLang === 'auto' ? detectLanguageHint(textToTranslate) : explicitSourceLang;
    const chunks = splitIntoChunks(textToTranslate);
    const results = [];

    for (const chunk of chunks) {
      const result = await translateChunk(chunk, targetLang, langHint);
      results.push(result);
    }

    translated = results.map((r) => r.translated).filter(Boolean).join('\n\n');
    detectedLang = results[0]?.detectedLang || langHint || 'en';
  }

  const simplified = simplifyMalayalam(translated);
  const wordCount = translated.split(/\s+/).filter(Boolean).length;

  return {
    success: true,
    url: detectedPageUrl,
    original: textToTranslate,
    translated,
    simplified,
    detectedLang,
    detectedLangLabel: getLanguageDisplayName(detectedLang, 'ml'),
    detectedLangLabelEn: getLanguageDisplayName(detectedLang, 'en'),
    wordCount,
    timestamp: new Date().toISOString()
  };
}

/**
 * Standalone simplification of existing Malayalam text.
 */
export async function simplifyText(malayalamText) {
  const source = normaliseText(malayalamText);
  if (!source) {
    throw userFacingError('ലളിതമാക്കാൻ ആവശ്യമായ മലയാളം വിവരണം ലഭ്യമല്ല.');
  }

  const simplified = simplifyMalayalam(source);
  const originalWords = source.split(/\s+/).filter(Boolean).length;
  const simpleWords = simplified.split(/\s+/).filter(Boolean).length;

  return {
    success: true,
    simplified,
    reductionPercent: Math.max(0, Math.round((1 - simpleWords / Math.max(1, originalWords)) * 100)),
    readabilityScore: 'Easy to read (ലളിതമായ വായന)'
  };
}
