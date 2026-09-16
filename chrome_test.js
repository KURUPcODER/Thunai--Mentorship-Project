const puppeteer = require('puppeteer');
const fs = require('fs');

async function testExtraction() {
  const rawContent = fs.readFileSync('extension/content-script.js', 'utf8');
  let scriptContent = `window.chrome = { runtime: { onMessage: { addListener: function(){} }, sendMessage: function(){} } };\n` + rawContent;
  scriptContent = scriptContent.replace('function extractRealPageContent() {', 'window.extractRealPageContent = function() {');

  // But wait, content-script doesn't execute anything globally disruptive on load in a headless context.
  
  const browser = await puppeteer.launch({ headless: 'new' });

  const urls = [
    { name: 'Wikipedia Malayalam', url: 'https://ml.wikipedia.org/wiki/%E0%B4%95%E0%B5%87%E0%B4%B0%E0%B4%B3%E0%B4%82' },
    { name: 'News18 Malayalam', url: 'https://malayalam.news18.com/news/world/los-angeles-news-helicopter-crash-three-dead-while-covering-fatal-bus-collision-in-chatsworth-rv-788989.html' },
    { name: 'Wikipedia English', url: 'https://en.wikipedia.org/wiki/Kerala' }
  ];

  for (const t of urls) {
    try {
      const page = await browser.newPage();
      await page.goto(t.url, { waitUntil: 'networkidle2', timeout: 30000 });
      
      await page.addScriptTag({ content: scriptContent });
      
      // Run extraction
      const result = await page.evaluate(() => {
        return window.extractRealPageContent();
      });

      const malayalamSegments = result.segments.filter(s => s.mlText && s.mlText.length > 30);
      const englishSegments = result.segments.filter(s => s.enText && s.enText.length > 30);

      console.log(`\n--- ${t.name} ---`);
      console.log(`Total Extracted Segments: ${result.segments.length}`);
      console.log(`Meaningful Malayalam Segments (>30 chars): ${malayalamSegments.length}`);
      console.log(`Meaningful English Segments (>30 chars): ${englishSegments.length}`);
      
      if (t.name.includes('News18') && malayalamSegments.length === 0) {
        console.log('--- LIVE DOM DIAGNOSTIC ---');
        const diag = await page.evaluate(() => {
           const ps = Array.from(document.querySelectorAll('div, p, h1, h2')).filter(el => /[\u0D00-\u0D7F]/.test(el.innerText || '') && (el.innerText || '').length > 50);
           const reasons = ps.map(el => {
             const html = el.outerHTML.substring(0, 50);
             if (el.closest('script, style, noscript, svg, nav, footer, header, .sidebar, .infobox, .toc, .navbox, .catlinks, #siteNotice, .mw-empty-elt, .mw-editsection, .reflist, .reference, .citation, .thumbcaption, #thunai-inpage-styles, .thunai-inspect-box')) {
               const closestBad = el.closest('script, style, noscript, svg, nav, footer, header, .sidebar, .infobox, .toc, .navbox, .catlinks, #siteNotice, .mw-empty-elt, .mw-editsection, .reflist, .reference, .citation, .thumbcaption, #thunai-inpage-styles, .thunai-inspect-box');
               return `REJECTED BY CLOSEST: ${closestBad.tagName} ${closestBad.className}`;
             }
             if (el.hidden || el.getAttribute('aria-hidden') === 'true') return `HIDDEN ATTRIBUTE`;
             return `ACCEPTED BUT NOT EXTRACTED? (tagName: ${el.tagName})`;
           });
           return { psFound: ps.length, reasons: reasons.slice(0, 10) };
        });
        console.log(diag);
      }

    } catch (e) {
      console.error(`Error on ${t.name}:`, e.message);
    }
  }

  await browser.close();
}

testExtraction();
