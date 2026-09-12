const JSDOM = require('jsdom').JSDOM;
const fs = require('fs');

async function getDOM(url) {
  const dom = await JSDOM.fromURL(url, { runScripts: "dangerously", resources: "usable" });
  Object.defineProperty(dom.window.HTMLElement.prototype, 'innerText', {
    get() { return this.textContent; }
  });
  return dom;
}

function runExtraction(dom, filterLength) {
  const window = dom.window;
  const document = window.document;

  const pageTitle = document.title || 'Current Webpage';
  const rawUrl = window.location ? window.location.href : '';
  const htmlLang = (document.documentElement.lang || document.body?.getAttribute('lang') || 'en').toLowerCase();
  let sampleText = document.body ? document.body.textContent.slice(0, 1200) : '';
  const isMalayalamPage = htmlLang.startsWith('ml') || /[\u0D00-\u0D7F]/.test(sampleText);
  const langCode = isMalayalamPage ? 'ml' : 'en';

  const mainEl = document.querySelector('.mw-parser-output, #mw-content-text, main, article, [role="main"], #content, .content, #main') || document.body;
  const rawCandidates = Array.from(mainEl.querySelectorAll('h1, h2, h3, h4, h5, h6, p, li, blockquote'));

  const candidateElements = rawCandidates.filter(el => {
    if (el.closest('script, style, noscript, svg, nav, footer, header, .sidebar, .infobox, .toc, .navbox, .catlinks, #siteNotice, .mw-empty-elt, .mw-editsection, .reflist, .reference, .citation, .thumbcaption, #thunai-inpage-styles, .thunai-inspect-box')) return false;
    if (el.hidden || el.getAttribute('aria-hidden') === 'true') return false;
    const text = (el.textContent || '').trim();
    return text.length > filterLength;
  });

  const segments = candidateElements.map((el, idx) => {
    return {
      text: (el.textContent || '').trim(),
      tag: el.tagName
    };
  });

  const fullOriginalText = segments.map(s => s.text).join('\n\n');
  return { segments, fullText: fullOriginalText, rawCount: rawCandidates.length };
}

async function run() {
  let log = "";
  const mlDOM = await getDOM('https://ml.wikipedia.org/wiki/%E0%B4%95%E0%B5%87%E0%B4%B0%E0%B4%B3%E0%B4%82');
  const enDOM = await getDOM('https://en.wikipedia.org/wiki/Kerala');

  for (let lang of ['ml', 'en']) {
    const dom = lang === 'ml' ? mlDOM : enDOM;
    const res15 = runExtraction(dom, 15);
    const res5 = runExtraction(dom, 5);

    log += `\n--- ${lang.toUpperCase()} ---\n`;
    log += `Raw Candidates: ${res15.rawCount}\n`;
    log += `Blocks lost under >15 vs >5: ${res5.segments.length - res15.segments.length}\n`;
    log += `Final Blocks (>5): ${res5.segments.length}\n`;
    log += `Final chars (>5): ${res5.fullText.length}\n`;

    const getPreview = segs => segs.map(s => s.text.substring(0, 30).replace(/\n/g, ' '));
    const first3 = getPreview(res5.segments.slice(0, 3));
    const midIdx = Math.floor(res5.segments.length / 2);
    const mid3 = getPreview(res5.segments.slice(midIdx, midIdx + 3));
    const last3 = getPreview(res5.segments.slice(-3));

    log += `First 3: ${JSON.stringify(first3)}\n`;
    log += `Middle 3: ${JSON.stringify(mid3)}\n`;
    log += `Last 3: ${JSON.stringify(last3)}\n`;
    log += `Total SegChars sum: ${res5.segments.reduce((acc, s) => acc + s.text.length, 0)}\n`;
  }
  fs.writeFileSync('eval-output.log', log, 'utf8');
}
run().catch(console.error);
