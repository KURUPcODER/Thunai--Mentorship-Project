const fs = require('fs');
const jsdom = require('jsdom');
const { JSDOM } = jsdom;

const html = fs.readFileSync('news18_test.html', 'utf8').replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '').replace(/<link[^>]*rel="stylesheet"[^>]*>/gi, '');
const scriptSource = fs.readFileSync('extension/content-script.js', 'utf8');

const dom = new JSDOM(html, { runScripts: "outside-only" });
const window = dom.window;

// Execute the content script in the JSDOM context
window.eval(scriptSource);

// Run the extractor
const result = window.eval('extractRealPageContent()');

console.log('--- EXTRACTION TEST RESULT ---');
console.log('Title:', result.title);
console.log('Language Code:', result.langCode);
console.log('Total Segments Extracted:', result.segments.length);

const malayalamSegments = result.segments.filter(s => s.mlText.length > 30);
console.log('Segments with >30 chars of mlText:', malayalamSegments.length);

if (malayalamSegments.length > 0) {
  console.log('Sample Malayalam mlText:');
  console.log(malayalamSegments[0].mlText.substring(0, 80) + '...');
} else {
  console.log('FAILURE: No Malayalam text found in mlText.');
}

console.log('\n--- FIRST 5 SEGMENTS OVERVIEW ---');
result.segments.slice(0, 5).forEach((s, idx) => {
  console.log(`[${idx}] Type: ${s.type} | Length: ${s.text.length} | mlText: ${s.mlText ? 'Yes' : 'No'} | enText: ${s.enText ? 'Yes' : 'No'}`);
});
