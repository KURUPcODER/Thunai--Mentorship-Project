const JSDOM = require('jsdom').JSDOM;
const fs = require('fs');

let out = "";
function log(msg) {
  console.log(msg);
  out += msg + "\n";
}

async function testExtraction(url, label) {
  log(`\n============================`);
  log(`${label} (${url})`);
  const dom = await JSDOM.fromURL(url, {
    runScripts: "dangerously",
    resources: "usable"
  });

  const window = dom.window;
  const document = window.document;

  // Mock innerText with textContent because JSDOM doesn't support innerText
  Object.defineProperty(window.HTMLElement.prototype, 'innerText', {
    get() { return this.textContent; }
  });

  // Wait for load just in case (though fromURL waits for parsing)
  await new Promise(resolve => setTimeout(resolve, 3000));

  // Load content-script.js
  const scriptContent = fs.readFileSync('./extension/content-script.js', 'utf8');
  const scriptEl = document.createElement('script');
  scriptEl.textContent = scriptContent;
  document.body.appendChild(scriptEl);

  const extractor = window.ThunaiContentScript;
  if (!extractor) {
    log("ThunaiContentScript not found in window");
    return;
  }

  const result = extractor.extractRealPageContent();
  
  // Also run our own candidate query manually to count
  const htmlLang = (document.documentElement.lang || document.body?.getAttribute('lang') || 'en').toLowerCase();
  const mainEl = document.querySelector('.mw-parser-output, #mw-content-text, main, article, [role="main"], #content, .content, #main') || document.body;
  const rawCandidates = Array.from(mainEl.querySelectorAll('h1, h2, h3, h4, h5, h6, p, li, blockquote'));
  
  log(`lang: ${htmlLang}`);
  log(`root tag: ${mainEl.tagName}`);
  log(`root id: ${mainEl.id}`);
  log(`root class: ${mainEl.className}`);
  log(`root text chars: ${mainEl.innerText ? mainEl.innerText.length : document.body.textContent.length}`);
  log(`candidates: ${rawCandidates.length}`);
  log(`final blocks: ${result.segments.length}`);
  log(`final fullText chars: ${result.fullText.length}`);
  
  let totalSegChars = 0;
  result.segments.forEach(s => totalSegChars += s.text.length);
  log(`final blocks chars sum: ${totalSegChars}`);
}

async function runTests() {
  try {
    await testExtraction('https://en.wikipedia.org/wiki/Kerala', 'ENGLISH');
    await testExtraction('https://ml.wikipedia.org/wiki/%E0%B4%95%E0%B5%87%E0%B4%B0%E0%B4%B3%E0%B4%82', 'MALAYALAM');
  } catch (err) {
    log("Error: " + err.stack);
  }
  fs.writeFileSync('test-output.log', out, 'utf8');
  process.exit(0);
}

runTests();
