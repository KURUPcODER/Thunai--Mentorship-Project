import fs from 'fs';
import jsdom from 'jsdom';
const { JSDOM } = jsdom;

async function runDiagnostic() {
  console.log('Fetching Malayalam Wikipedia page...');
  const res = await fetch('https://ml.wikipedia.org/wiki/%E0%B4%95%E0%B5%87%E0%B4%B0%E0%B4%B3%E0%B4%82');
  const html = await res.text();
  console.log(`Fetched HTML size: ${(html.length / 1024).toFixed(1)} KB`);

  const dom = new JSDOM(html, {
    url: 'https://ml.wikipedia.org/wiki/%E0%B4%95%E0%B5%87%E0%B4%B0%E0%B4%B3%E0%B4%82'
  });

  global.window = dom.window;
  global.document = dom.window.document;
  Object.defineProperty(global, 'navigator', { value: dom.window.navigator, configurable: true });

  const report = {};

  // Stage 1: Raw DOM candidates inside container
  const mainEl = document.querySelector('.mw-parser-output, #mw-content-text, main, article, [role="main"], #content, .content, #main') || document.body;
  const rawCandidates = Array.from(mainEl.querySelectorAll('h1, h2, h3, h4, h5, h6, p, li, blockquote'));
  
  const stage1Items = rawCandidates.map((el, i) => ({
    idx: i + 1,
    tag: el.tagName,
    text: (el.innerText || el.textContent || '').trim()
  }));

  report.stage1 = {
    name: '1. Raw DOM Candidates',
    count: stage1Items.length,
    charCount: stage1Items.reduce((acc, item) => acc + item.text.length, 0),
    first3: stage1Items.slice(0, 3),
    last3: stage1Items.slice(-3)
  };

  // Stage 2: Candidate Selection / Filtering in extractRealPageContent()
  const candidateElements = rawCandidates.filter(el => {
    if (el.closest('script, style, noscript, svg, nav, footer, header, .sidebar, .infobox, .toc, .navbox, .catlinks, #siteNotice, .mw-empty-elt, .mw-editsection, .reflist, .reference, .citation, .thumbcaption, #thunai-inpage-styles, .thunai-inspect-box')) {
      return false;
    }
    if (el.hidden || el.getAttribute('aria-hidden') === 'true') return false;
    const text = (el.innerText || el.textContent || '').trim();
    return text.length > 15;
  });

  const stage2Items = candidateElements.map((el, i) => ({
    idx: i + 1,
    tag: el.tagName,
    text: (el.innerText || el.textContent || '').trim()
  }));

  report.stage2 = {
    name: '2. Candidate Filtering',
    count: stage2Items.length,
    charCount: stage2Items.reduce((acc, item) => acc + item.text.length, 0),
    first3: stage2Items.slice(0, 3),
    last3: stage2Items.slice(-3)
  };

  // Stage 3: Text Cleaning / Normalization (extractRealPageContent mapping)
  const isMalayalamPage = true;
  const pageTitle = document.title || 'Current Webpage';
  const stage3Segments = candidateElements.map((el, idx) => {
    const segId = `seg-${idx}`;
    const tagType = el.tagName.startsWith('H') ? `HEADING ${el.tagName[1]}` : (el.tagName === 'LI' ? 'LIST ITEM' : 'PARAGRAPH');
    const text = (el.innerText || el.textContent || '').trim();
    return {
      id: segId,
      selector: `[data-thunai-seg="${segId}"]`,
      text: text,
      mlText: isMalayalamPage ? text : '',
      enText: !isMalayalamPage ? text : '',
      type: tagType,
      tag: `${pageTitle.slice(0, 24)} (${tagType})`,
      durationMs: Math.max(3000, text.length * 65)
    };
  });

  report.stage3 = {
    name: '3. Text Cleaning / Segment Mapping',
    count: stage3Segments.length,
    charCount: stage3Segments.reduce((acc, item) => acc + item.text.length, 0),
    first3: stage3Segments.slice(0, 3).map(s => ({ id: s.id, text: s.text.slice(0, 80) })),
    last3: stage3Segments.slice(-3).map(s => ({ id: s.id, text: s.text.slice(0, 80) }))
  };

  // Stage 4: Deduplication (none explicitly in extractRealPageContent currently)
  report.stage4 = {
    name: '4. Deduplication Stage',
    count: stage3Segments.length,
    charCount: stage3Segments.reduce((acc, item) => acc + item.text.length, 0),
    first3: stage3Segments.slice(0, 3).map(s => ({ id: s.id, text: s.text.slice(0, 80) })),
    last3: stage3Segments.slice(-3).map(s => ({ id: s.id, text: s.text.slice(0, 80) }))
  };

  // Stage 5: Sentence / Segment Splitting
  report.stage5 = {
    name: '5. Segment Splitting Stage',
    count: stage3Segments.length,
    charCount: stage3Segments.reduce((acc, item) => acc + item.text.length, 0),
    first3: stage3Segments.slice(0, 3).map(s => ({ id: s.id, text: s.text.slice(0, 80) })),
    last3: stage3Segments.slice(-3).map(s => ({ id: s.id, text: s.text.slice(0, 80) }))
  };

  // Stage 6: EXTRACT_PAGE_CONTENT response
  const extractResponse = {
    title: pageTitle,
    url: 'https://ml.wikipedia.org/wiki/%E0%B4%95%E0%B5%87%E0%B4%B0%E0%B4%B3%E0%B4%82',
    langCode: 'ml',
    fullText: stage3Segments.map(s => s.text).join('\n\n').slice(0, 8000),
    segments: stage3Segments
  };

  report.stage6 = {
    name: '6. EXTRACT_PAGE_CONTENT Response',
    count: extractResponse.segments.length,
    charCount: extractResponse.segments.reduce((acc, item) => acc + item.text.length, 0),
    first3: extractResponse.segments.slice(0, 3).map(s => ({ id: s.id, text: s.text.slice(0, 80) })),
    last3: extractResponse.segments.slice(-3).map(s => ({ id: s.id, text: s.text.slice(0, 80) }))
  };

  // Stage 7: ttsService.loadSegments() or initRealPageSegments()
  const { ttsService } = await import('./extension/services/ttsService.js');
  ttsService.loadSegments(extractResponse.segments);

  const ttsStateSegments = ttsService.getState().segments;

  report.stage7 = {
    name: '7. ttsService.loadSegments()',
    count: ttsStateSegments.length,
    charCount: ttsStateSegments.reduce((acc, item) => acc + (item.text || item.malayalamText || '').length, 0),
    first3: ttsStateSegments.slice(0, 3).map(s => ({ id: s.id, text: (s.text || s.malayalamText || '').slice(0, 80) })),
    last3: ttsStateSegments.slice(-3).map(s => ({ id: s.id, text: (s.text || s.malayalamText || '').slice(0, 80) }))
  };

  // Stage 8: Final ttsService.getState().segments (UI rendering)
  const finalState = ttsService.getState();

  report.stage8 = {
    name: '8. Final ttsService.getState().segments',
    count: finalState.segments.length,
    charCount: finalState.segments.reduce((acc, item) => acc + (item.text || item.malayalamText || '').length, 0),
    first3: finalState.segments.slice(0, 3).map(s => ({ id: s.id, text: (s.text || s.malayalamText || '').slice(0, 80) })),
    last3: finalState.segments.slice(-3).map(s => ({ id: s.id, text: (s.text || s.malayalamText || '').slice(0, 80) }))
  };

  // Now let's also check scanLivePageDOM (scanReport)!
  const scanReportRaw = {
    textSegments: stage3Segments
  };

  fs.writeFileSync('pipeline_report.json', JSON.stringify(report, null, 2));
  console.log('Pipeline trace completed successfully!');
}

runDiagnostic().catch(err => {
  console.error('Error running pipeline trace:', err);
});
