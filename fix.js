const fs = require('fs');
let code = fs.readFileSync('extension/content-script.js', 'utf8');

const brokenTarget = `    const wordCount = rawWords.length;
        wordFreqMap[clean] = (wordFreqMap[clean] || 0) + 1;
      }
    });`;

const replacement = `    const wordCount = rawWords.length;

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

if (code.includes(brokenTarget)) {
  code = code.replace(brokenTarget, replacement);
  fs.writeFileSync('extension/content-script.js', code);
  console.log("Fix applied successfully.");
} else {
  console.log("Target not found!");
}
