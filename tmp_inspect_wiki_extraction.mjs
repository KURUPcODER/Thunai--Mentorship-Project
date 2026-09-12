import fs from 'fs';
import jsdom from 'jsdom';
const { JSDOM } = jsdom;

async function testPage(url, pageName) {
  console.log(`\n==================================================`);
  console.log(`TESTING EXTRACTION FOR: ${pageName}`);
  console.log(`URL: ${url}`);
  console.log(`==================================================`);

  const res = await fetch(url);
  const html = await res.text();

  const dom = new JSDOM(html, { url });
  global.window = dom.window;
  global.document = dom.window.document;
  Object.defineProperty(global, 'navigator', { value: dom.window.navigator, configurable: true });

  // 1. Root selection
  const mainEl = document.querySelector('.mw-parser-output, #mw-content-text, main, article, [role="main"], #content, .content, #main') || document.body;
  const rootDesc = `${mainEl.tagName}${mainEl.id ? '#' + mainEl.id : ''}${mainEl.className ? '.' + String(mainEl.className).replace(/\s+/g, '.') : ''}`;
  console.log(`1. Selected Extraction Root: ${rootDesc}`);

  // 2. Candidate elements
  const rawCandidates = Array.from(mainEl.querySelectorAll('h1, h2, h3, h4, h5, h6, p, li, blockquote'));
  console.log(`2. Raw Candidate Elements Count: ${rawCandidates.length}`);

  // 3. Filtering
  const candidateElements = rawCandidates.filter(el => {
    if (el.closest('script, style, noscript, svg, nav, footer, header, .sidebar, .infobox, .toc, .navbox, .catlinks, #siteNotice, .mw-empty-elt, .mw-editsection, .reflist, .reference, .citation, .thumbcaption, #thunai-inpage-styles, .thunai-inspect-box')) {
      return false;
    }
    if (el.hidden || el.getAttribute('aria-hidden') === 'true') return false;
    const text = (el.innerText || el.textContent || '').trim();
    return text.length > 5;
  });
  console.log(`3. Candidates After Filtering Count: ${candidateElements.length}`);

  // 4. Extracted Blocks & Chars
  const segments = candidateElements.map((el, idx) => {
    const text = (el.innerText || el.textContent || '').trim();
    return {
      idx: idx + 1,
      tag: el.tagName,
      text
    };
  });
  const totalChars = segments.reduce((acc, s) => acc + s.text.length, 0);

  console.log(`4. Final Extracted Blocks Count: ${segments.length}`);
  console.log(`5. Total Characters in Extracted Text: ${totalChars}`);

  // Headings overview to see which sections are extracted vs missing
  const allHeadingsOnPage = Array.from(document.body.querySelectorAll('h1, h2, h3, h4')).map(h => (h.innerText || h.textContent || '').trim()).filter(Boolean);
  const extractedHeadings = segments.filter(s => s.tag.startsWith('H')).map(s => s.text);

  console.log(`\n--- Headings Summary ---`);
  console.log(`Total Headings on Page: ${allHeadingsOnPage.length}`);
  console.log(`Extracted Headings: ${extractedHeadings.length}`);
  console.log(`First 5 Extracted Headings:`, extractedHeadings.slice(0, 5));
  console.log(`Last 5 Extracted Headings:`, extractedHeadings.slice(-5));

  // Compare against document.body.innerText / textContent total
  const bodyText = (document.body.innerText || document.body.textContent || '').trim();
  console.log(`\nDocument body total text length: ${bodyText.length} chars`);
  console.log(`Extracted text total length: ${totalChars} chars (${((totalChars / bodyText.length) * 100).toFixed(1)}% of body text)`);

  return {
    pageName,
    rootDesc,
    rawCount: rawCandidates.length,
    filteredCount: candidateElements.length,
    finalCount: segments.length,
    totalChars,
    allHeadingsCount: allHeadingsOnPage.length,
    extractedHeadingsCount: extractedHeadings.length,
    allHeadingsOnPage,
    extractedHeadings
  };
}

async function run() {
  const mlResult = await testPage('https://ml.wikipedia.org/wiki/%E0%B4%95%E0%B5%87%E0%B4%B0%E0%B4%B3%E0%B4%82', 'Malayalam Wikipedia (Kerala)');
  const enResult = await testPage('https://en.wikipedia.org/wiki/Kerala', 'English Wikipedia (Kerala)');

  fs.writeFileSync('wiki_extraction_audit.json', JSON.stringify({ mlResult, enResult }, null, 2));
}

run().catch(console.error);
