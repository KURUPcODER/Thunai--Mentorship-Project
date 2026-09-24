const fs = require('fs');
let code = fs.readFileSync('extension/content-script.js', 'utf8');

const targetStr = `  function scanLivePageDOM() {
    const pageTitle = document.title || 'Active Webpage';
    const rawUrl = window.location.href;
    const bodyText = document.body ? document.body.innerText : '';
    const rawWords = bodyText.trim().split(/\\s+/).filter(w => w.length > 0);
    const wordCount = rawWords.length;
        wordFreqMap[clean] = (wordFreqMap[clean] || 0) + 1;
      }
    });`;

if (code.includes(targetStr)) {
  const replacement = `  function scanLivePageDOM() {
    const pageTitle = document.title || 'Active Webpage';
    const rawUrl = window.location.href;
    const bodyText = document.body ? document.body.innerText : '';
    const rawWords = bodyText.trim().split(/\\s+/).filter(w => w.length > 0);
    const wordCount = rawWords.length;

    // Detect primary language
    const hasMalayalam = /[\\u0D00-\\u0D7F]/.test(bodyText);
    const hasHindi = /[\\u0900-\\u097F]/.test(bodyText);
    const detectedLang = hasMalayalam ? 'Malayalam (മലയാളം)' : (hasHindi ? 'Hindi (हिन्दी)' : 'English');
    const detectedLangCode = hasMalayalam ? 'ml' : (hasHindi ? 'hi' : 'en');

    // 1. Text Extraction & Segmentation
    const extractedData = extractRealPageContent();
    const textSegments = extractedData.segments.map((seg, idx) => ({
      id: seg.id || \`seg-\${idx}\`,
      selector: seg.selector || \`[data-thunai-seg="seg-\${idx}"]\`,
      text: seg.text || '',
      mlText: seg.mlText || '',
      type: seg.type || 'PARAGRAPH',
      tag: seg.tag || pageTitle,
      durationMs: seg.durationMs || 3500
    }));

    // 2. Keyword Indexing: Top 15 key terms by frequency excluding stopwords
    const wordFreqMap = {};
    rawWords.forEach(w => {
      const clean = w.toLowerCase().replace(/[^a-zA-Z\\u0D00-\\u0D7F\\u0900-\\u097F]/g, '');
      if (clean.length > 3 && !STOP_WORDS.has(clean) && !/^\\d+$/.test(clean)) {
        wordFreqMap[clean] = (wordFreqMap[clean] || 0) + 1;
      }
    });`;
  
  code = code.replace(targetStr, replacement);
  fs.writeFileSync('extension/content-script.js', code);
  console.log('Successfully repaired file.');
} else {
  console.log('Target string not found, falling back to regex repair.');
  // More robust fallback: find indices
  const startIdx = code.indexOf('  function scanLivePageDOM() {');
  const sortKeysIdx = code.indexOf('    const sortedKeywords = Object.entries(wordFreqMap)');
  if (startIdx !== -1 && sortKeysIdx !== -1) {
    const replacement = `  function scanLivePageDOM() {
    const pageTitle = document.title || 'Active Webpage';
    const rawUrl = window.location.href;
    const bodyText = document.body ? document.body.innerText : '';
    const rawWords = bodyText.trim().split(/\\s+/).filter(w => w.length > 0);
    const wordCount = rawWords.length;

    // Detect primary language
    const hasMalayalam = /[\\u0D00-\\u0D7F]/.test(bodyText);
    const hasHindi = /[\\u0900-\\u097F]/.test(bodyText);
    const detectedLang = hasMalayalam ? 'Malayalam (മലയാളം)' : (hasHindi ? 'Hindi (हिन्दी)' : 'English');
    const detectedLangCode = hasMalayalam ? 'ml' : (hasHindi ? 'hi' : 'en');

    // 1. Text Extraction & Segmentation
    const extractedData = extractRealPageContent();
    const textSegments = extractedData.segments.map((seg, idx) => ({
      id: seg.id || \`seg-\${idx}\`,
      selector: seg.selector || \`[data-thunai-seg="seg-\${idx}"]\`,
      text: seg.text || '',
      mlText: seg.mlText || '',
      type: seg.type || 'PARAGRAPH',
      tag: seg.tag || pageTitle,
      durationMs: seg.durationMs || 3500
    }));

    // 2. Keyword Indexing: Top 15 key terms by frequency excluding stopwords
    const wordFreqMap = {};
    rawWords.forEach(w => {
      const clean = w.toLowerCase().replace(/[^a-zA-Z\\u0D00-\\u0D7F\\u0900-\\u097F]/g, '');
      if (clean.length > 3 && !STOP_WORDS.has(clean) && !/^\\d+$/.test(clean)) {
        wordFreqMap[clean] = (wordFreqMap[clean] || 0) + 1;
      }
    });

`;
    code = code.substring(0, startIdx) + replacement + code.substring(sortKeysIdx);
    fs.writeFileSync('extension/content-script.js', code);
    console.log('Successfully repaired file using fallback.');
  } else {
    console.log('Could not find boundaries for fallback repair!');
  }
}
