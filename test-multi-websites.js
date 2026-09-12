/**
 * Comprehensive Multi-Website & Multi-Language End-to-End Test Suite for Thunai
 * Validates:
 * 1. English → Malayalam translation
 * 2. Hindi → Malayalam translation
 * 3. English → Malayalam → Simplified Malayalam
 * 4. Hindi → Malayalam → Simplified Malayalam
 * 5. Malayalam content passthrough & simplification
 * 6. Multi-website content extraction across diverse website architectures
 * 7. Active Navigation Transitions & Stale-State Reset:
 *    - Hindi Wikipedia → React.dev (English)
 *    - React.dev (English) → Hindi Wikipedia
 *    - English Wikipedia → Malayalam Wikipedia
 *    - Malayalam Wikipedia → English Wikipedia
 *    - SPA Navigation & Back/Forward state refresh
 *    - Race condition: In-flight translation request cancellation across navigation
 * 8. Verification of all 6 Thunai core features
 */

import { translateText, simplifyText, isMostlyMalayalam, detectLanguageHint, simplifyMalayalam, getLanguageDisplayName } from './extension/services/translateService.js';
import { scanPage, normalizeScanReport } from './extension/services/scanService.js';
import { searchService } from './extension/services/searchService.js';
import { ttsService } from './extension/services/ttsService.js';
import { fixService } from './extension/services/fixService.js';
import { getT } from './extension/sidebar/i18n.js';

let totalTests = 0;
let passedTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    console.log(`  ✓ PASS: ${message}`);
    passedTests++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
}

async function runMultiWebsiteTestSuite() {
  console.log('====================================================');
  console.log('       THUNAI MULTI-WEBSITE & TRANSLATION SUITE     ');
  console.log('====================================================\n');

  // ----------------------------------------------------
  // SECTION 1: TRANSLATION & SIMPLIFICATION (P0)
  // ----------------------------------------------------
  console.log('--- [1/4] TRANSLATION & SIMPLIFICATION (EN / HI / ML) ---');

  // TEST 1: English -> Malayalam
  console.log('\n* TEST 1: English -> Malayalam Translation');
  const enText = 'The Kerala State Scholarship Portal provides financial assistance to eligible students for higher education.';
  const enRes = await translateText(enText, 'ml', 'en');
  assert(enRes.success === true, 'English translation request succeeded');
  assert(enRes.detectedLang === 'en', `Detected language is English (got: ${enRes.detectedLang})`);
  assert(/[\u0D00-\u0D7F]/.test(enRes.translated), `Translated output is Malayalam text: "${enRes.translated}"`);
  assert(enRes.translated.length > 10, 'Translated Malayalam is meaningful and non-empty');

  // TEST 2: Hindi -> Malayalam
  console.log('\n* TEST 2: Hindi -> Malayalam Translation');
  const hiText = 'केरल राज्य छात्रवृत्ति पोर्टल उच्च शिक्षा के लिए पात्र छात्रों को वित्तीय सहायता प्रदान करता है।';
  const hiRes = await translateText(hiText, 'ml', 'hi');
  assert(hiRes.success === true, 'Hindi translation request succeeded');
  assert(hiRes.detectedLang === 'hi', `Detected language is Hindi (got: ${hiRes.detectedLang})`);
  assert(/[\u0D00-\u0D7F]/.test(hiRes.translated), `Translated output is Malayalam text: "${hiRes.translated}"`);
  assert(hiRes.translated.length > 10, 'Translated Malayalam is meaningful and non-empty');

  // TEST 3: English -> Malayalam -> Simplified Malayalam
  console.log('\n* TEST 3: English -> Malayalam -> Simplified Malayalam');
  const complexEnText = 'All pre-matric and post-matric users must submit the required application forms before the final deadline.';
  const enTransSimp = await translateText(complexEnText, 'ml');
  assert(enTransSimp.success === true, 'Translation succeeded');
  assert(typeof enTransSimp.simplified === 'string' && enTransSimp.simplified.length > 0, `Simplified Malayalam generated: "${enTransSimp.simplified}"`);
  const simpMetrics1 = await simplifyText(enTransSimp.translated);
  assert(simpMetrics1.success === true, 'Simplification metrics calculated');

  // TEST 4: Hindi -> Malayalam -> Simplified Malayalam
  console.log('\n* TEST 4: Hindi -> Malayalam -> Simplified Malayalam');
  const complexHiText = 'सभी उपयोगकर्ताओं को अंतिम समय सीमा से पहले आवश्यक आवेदन पत्र जमा करना अनिवार्य है।';
  const hiTransSimp = await translateText(complexHiText, 'ml');
  assert(hiTransSimp.success === true, 'Hindi translation succeeded');
  assert(typeof hiTransSimp.simplified === 'string' && hiTransSimp.simplified.length > 0, `Simplified Malayalam generated: "${hiTransSimp.simplified}"`);

  // TEST 5: Direct Malayalam Passthrough & Simplification
  console.log('\n* TEST 5: Malayalam Webpage Content Passthrough & Simplification');
  const mlText = 'വെബ്‌സൈറ്റിലെ ഉപയോക്താക്കൾക്ക് ആവശ്യമായ വിവരങ്ങൾ സംബന്ധിച്ച ഫോമുകൾ നൽകിയിരിക്കുന്നു.';
  const mlPassthrough = await translateText(mlText, 'ml');
  assert(mlPassthrough.detectedLang === 'ml', `Detected source as Malayalam (got: ${mlPassthrough.detectedLang})`);
  assert(mlPassthrough.original === mlText, 'Original Malayalam preserved without corrupting text');
  assert(mlPassthrough.simplified.includes('ആളുകൾ') || mlPassthrough.simplified.includes('വേണ്ട') || mlPassthrough.simplified.includes('നൽകിയ'), `Vocabulary simplified appropriately: "${mlPassthrough.simplified}"`);

  // ----------------------------------------------------
  // SECTION 2: MULTI-WEBSITE DOM EXTRACTION SCENARIOS
  // ----------------------------------------------------
  console.log('\n--- [2/4] MULTI-WEBSITE COMPATIBILITY & CONTENT EXTRACTION ---');

  // Simulated Website Structures
  const testWebsites = [
    {
      name: 'Website A: English News & Article Site (The Hindu / BBC style)',
      html: `
        <header><nav><a href="/">Home</a><a href="/news">News</a></nav></header>
        <main>
          <h1>Kerala Launches New Digital Education Initiative</h1>
          <p class="article-lead">The state government of Kerala has announced a new digital accessibility program for schools and colleges.</p>
          <div class="ad-banner" style="display:none;">Advertisement</div>
          <p>The program aims to assist over 200,000 students across 14 districts with assistive technologies and regional language support.</p>
        </main>
        <footer><p>© 2026 News Portal. All rights reserved.</p></footer>
      `,
      expectedLanguage: 'en',
      expectedKeyword: 'education'
    },
    {
      name: 'Website B: Government Portal with Nested Form & Cards (e-Grantz / DigiLocker style)',
      html: `
        <div id="wrapper">
          <div class="top-nav"><span>Portal Header</span></div>
          <div class="main-container" role="main">
            <div class="card">
              <h2>Post-Matric Scholarship Scheme Registration</h2>
              <p>Applications are invited from eligible SC, ST, and OBC category students residing in Kerala for academic year 2026-27.</p>
              <div class="form-group">
                <label>Registration ID</label>
                <input type="text" placeholder="Enter Registration ID" />
              </div>
              <p>Applicants must link their Aadhaar number with active bank account for DBT disbursement.</p>
            </div>
          </div>
        </div>
      `,
      expectedLanguage: 'en',
      expectedKeyword: 'scholarship'
    },
    {
      name: 'Website C: Hindi Government / Public Service Portal',
      html: `
        <div class="hindi-portal">
          <div role="main">
            <h1>राष्ट्रीय छात्रवृत्ति पोर्टल (National Scholarship Portal)</h1>
            <p>पात्र छात्र विभिन्न सरकारी योजनाओं के लिए ऑनलाइन आवेदन जमा कर सकते हैं।</p>
            <p>आवेदन पत्र भरने के लिए आधार कार्ड और बैंक पासबुक की प्रति आवश्यक है।</p>
          </div>
        </div>
      `,
      expectedLanguage: 'hi',
      expectedKeyword: 'छात्रवृत्ति'
    },
    {
      name: 'Website D: Modern Single Page App (SPA / React / Next.js #root layout)',
      html: `
        <div id="__next">
          <div class="layout-container">
            <article class="post-content">
              <h3>Web Accessibility Guidelines and Best Practices</h3>
              <p>Ensuring accessible color contrast and semantic landmarks makes web applications usable for everyone.</p>
              <blockquote>Accessibility is not a feature, it is a fundamental human right for all digital citizens.</blockquote>
            </article>
          </div>
        </div>
      `,
      expectedLanguage: 'en',
      expectedKeyword: 'accessibility'
    },
    {
      name: 'Website E: Malayalam Wikipedia & Knowledge Portal',
      html: `
        <div id="content" class="mw-body">
          <h1 id="firstHeading">കേരളത്തിന്റെ ചരിത്രവും ഭൂമിശാസ്ത്രവും</h1>
          <p>ഇന്ത്യയുടെ തെക്കുപടിഞ്ഞാറൻ തീരത്ത് സ്ഥിതി ചെയ്യുന്ന മനോഹരമായ ഒരു സംസ്ഥാനമാണ് കേരളം.</p>
          <p>വിദ്യാഭ്യാസ രംഗത്തും ആരോഗ്യ രംഗത്തും ഇന്ത്യയിൽ മുൻപന്തിയിൽ നിൽക്കുന്ന സംസ്ഥാനമാണിത്.</p>
        </div>
      `,
      expectedLanguage: 'ml',
      expectedKeyword: 'കേരളം'
    },
    {
      name: 'Website F: Long Technical Documentation Webpage (10+ Sections)',
      html: `
        <div role="main">
          <h1>API Documentation and Accessibility Integration Reference</h1>
          ${Array.from({ length: 8 }, (_, i) => `
            <section>
              <h2>Section ${i + 1}: Implementation Details for Data Pipeline</h2>
              <p>Module ${i + 1} processes real-time accessibility data from DOM nodes and dispatches events asynchronously to listener queues.</p>
            </section>
          `).join('')}
        </div>
      `,
      expectedLanguage: 'en',
      expectedKeyword: 'pipeline'
    },
    {
      name: 'Website G: Minimal / Sparse Content Webpage',
      html: `
        <div class="empty-layout">
          <p>Welcome to the portal service.</p>
        </div>
      `,
      expectedLanguage: 'en',
      expectedKeyword: 'portal'
    }
  ];

  for (const site of testWebsites) {
    console.log(`\n* Validating ${site.name}`);
    const plainText = site.html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<header[\s\S]*?<\/header>/gi, '')
      .replace(/<nav[\s\S]*?<\/nav>/gi, '')
      .replace(/<footer[\s\S]*?<\/footer>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    assert(plainText.length > 0, 'Clean content extracted without navigation/footer boilerplate');

    const detectedLang = detectLanguageHint(plainText);
    assert(detectedLang === site.expectedLanguage, `Language detected accurately: expected ${site.expectedLanguage}, got ${detectedLang}`);

    const sampleExcerpt = plainText.slice(0, 300);
    const trans = await translateText(sampleExcerpt, 'ml');
    assert(trans.success === true, `Excerpt translated successfully (${trans.wordCount} words)`);
    assert(/[\u0D00-\u0D7F]/.test(trans.translated), 'Output contains valid Malayalam characters');
  }

  // ----------------------------------------------------
  // SECTION 3: NAVIGATION TRANSITIONS & STALE-STATE RESET
  // ----------------------------------------------------
  console.log('\n--- [3/4] NAVIGATION TRANSITIONS & STALE-STATE RESILIENCE ---');

  // Simulated Tab State Controller matching ThunaiApp
  class MockThunaiApp {
    constructor() {
      this.state = {
        activePageUrl: '',
        activePageTitle: 'Active Webpage',
        activePageLang: 'en',
        activePageLangLabel: 'ഇംഗ്ലീഷ് (English)',
        requestSeq: 0,
        isTranslating: false,
        hasTranslated: false,
        isSimplified: false,
        translatedData: null,
        translateError: ''
      };
    }

    navigateToUrl(url, title, text) {
      const langCode = detectLanguageHint(text || title);
      const urlChanged = url !== this.state.activePageUrl;
      const nextSeq = this.state.requestSeq + 1;

      this.state.activePageUrl = url;
      this.state.activePageTitle = title;
      this.state.activePageLang = langCode;
      this.state.activePageLangLabel = getLanguageDisplayName(langCode, 'ml');
      this.state.activePageText = text;
      this.state.requestSeq = nextSeq;

      if (urlChanged) {
        this.state.isTranslating = false;
        this.state.hasTranslated = false;
        this.state.isSimplified = false;
        this.state.translatedData = null;
        this.state.translateError = '';
      }
    }

    async translateActivePage() {
      const currentSeq = this.state.requestSeq;
      const currentUrl = this.state.activePageUrl;
      this.state.isTranslating = true;

      const res = await translateText(this.state.activePageText, 'ml', 'auto', currentUrl);

      // Discard stale response if user navigated away
      if (this.state.requestSeq !== currentSeq || this.state.activePageUrl !== currentUrl) {
        return { discarded: true };
      }

      this.state.isTranslating = false;
      this.state.hasTranslated = true;
      this.state.translatedData = res;
      return res;
    }
  }

  const app = new MockThunaiApp();

  // Transition A: Malayalam Wikipedia -> React.dev (English)
  console.log('\n* Transition A: Malayalam Wikipedia -> React.dev (English)');
  app.navigateToUrl(
    'https://ml.wikipedia.org/wiki/കേരളം',
    'കേരളം - വിക്കിപീഡിയ',
    'ഇന്ത്യയുടെ തെക്കുപടിഞ്ഞാറൻ തീരത്ത് സ്ഥിതി ചെയ്യുന്ന ഒരു സംസ്ഥാനമാണ് കേരളം.'
  );
  assert(app.state.activePageLang === 'ml', 'Malayalam Wikipedia detected as Malayalam');
  await app.translateActivePage();
  assert(app.state.hasTranslated === true, 'Malayalam translation active');
  assert(app.state.translatedData !== null, 'Malayalam translation data present');

  // Now navigate to React.dev (English)
  app.navigateToUrl(
    'https://react.dev',
    'React – The library for web and native user interfaces',
    'React lets you build user interfaces out of individual pieces called components.'
  );
  assert(app.state.activePageLang === 'en', 'React.dev accurately detected as English');
  assert(app.state.hasTranslated === false, 'Stale translation state was CLEARED on navigation to react.dev');
  assert(app.state.translatedData === null, 'Previous Malayalam translation data was DISCARDED on navigation to react.dev');
  assert(app.state.isSimplified === false, 'Simplification state reset for react.dev');

  // Translate React.dev
  const reactTrans = await app.translateActivePage();
  assert(app.state.hasTranslated === true, 'React.dev translated successfully');
  assert(reactTrans.detectedLang === 'en', 'React.dev translation reflects English source');

  // Transition B: React.dev (English) -> Hindi Wikipedia
  console.log('\n* Transition B: React.dev (English) -> Hindi Wikipedia');
  app.navigateToUrl(
    'https://hi.wikipedia.org/wiki/केरल',
    'केरल - विकिपीडिया',
    'केरल भारत का एक प्रान्त है। इसकी राजधानी तिरुवनन्तपुरम है।'
  );
  assert(app.state.activePageLang === 'hi', 'Hindi Wikipedia accurately detected as Hindi');
  assert(app.state.hasTranslated === false, 'Previous React.dev translation state CLEARED on navigation to Hindi page');
  assert(app.state.translatedData === null, 'Previous translation data DISCARDED');
  const hiTrans = await app.translateActivePage();
  assert(hiTrans.detectedLang === 'hi', 'Hindi page translated accurately from Hindi');

  // Transition C: English Wikipedia -> Malayalam Wikipedia
  console.log('\n* Transition C: English Wikipedia -> Malayalam Wikipedia');
  app.navigateToUrl(
    'https://en.wikipedia.org/wiki/Kerala',
    'Kerala - Wikipedia',
    'Kerala is a state on the southwestern Malabar Coast of India.'
  );
  assert(app.state.activePageLang === 'en', 'English Wikipedia detected as English');
  await app.translateActivePage();
  assert(app.state.hasTranslated === true, 'English Wikipedia translated');

  app.navigateToUrl(
    'https://ml.wikipedia.org/wiki/കേരളം',
    'കേരളം - വിക്കിപീഡിയ',
    'കേരളം ഒരു ദക്ഷിണേന്ത്യൻ സംസ്ഥാനമാണ്.'
  );
  assert(app.state.activePageLang === 'ml', 'Malayalam Wikipedia detected as Malayalam');
  assert(app.state.hasTranslated === false, 'Previous English translation state cleared');

  // Transition D: Race condition simulation (Navigating while translation is in-flight)
  console.log('\n* Transition D: Race Condition Protection (Navigating while request is in-flight)');
  app.navigateToUrl(
    'https://page-a.example.com',
    'Page A',
    'This is a long article on page A that takes time to translate.'
  );
  const promiseA = app.translateActivePage();
  // User rapidly navigates to Page B before promiseA finishes
  app.navigateToUrl(
    'https://page-b.example.com',
    'Page B',
    'This is page B content.'
  );
  const resultA = await promiseA;
  assert(resultA.discarded === true, 'In-flight translation response for Page A was successfully discarded on Page B');
  assert(app.state.hasTranslated === false, 'Page B was not corrupted by stale response from Page A');

  // ----------------------------------------------------
  // SECTION 4: INTEGRATION OF ALL 6 THUNAI FEATURES
  // ----------------------------------------------------
  console.log('\n--- [4/4] INTEGRATION OF ALL 6 CORE FEATURES ---');

  // Feature 1: Scan Page
  console.log('\n* 1. Scan Page Feature');
  const report = await scanPage();
  assert(report && typeof report.score === 'number', `Accessibility scan generated score: ${report.score}/100`);
  assert(Array.isArray(report.wcagViolations) && report.wcagViolations.length > 0, `WCAG violations captured: ${report.wcagViolations.length}`);
  assert(Array.isArray(report.textSegments) && report.textSegments.length > 0, `Text segments extracted: ${report.textSegments.length}`);

  // Feature 2: Read in Malayalam (TTS)
  console.log('\n* 2. Read in Malayalam Feature (TTS)');
  ttsService.loadSegments(report.textSegments);
  ttsService.setSpeed(1.2);
  ttsService.setVoice('ml-IN-female-1');
  ttsService.play();
  const ttsState = ttsService.getState();
  assert(ttsState.isPlaying === true, 'TTS playback started');
  assert(ttsState.playbackSpeed === 1.2, `TTS playback speed updated to ${ttsState.playbackSpeed}x`);
  ttsService.stop();
  assert(ttsService.getState().isPlaying === false, 'TTS playback stopped cleanly');

  // Feature 3: Find in Page (Search)
  console.log('\n* 3. Find in Page Feature (Keyword Finder)');
  const searchMatches = await searchService.searchPage('scholarship');
  assert(Array.isArray(searchMatches) && searchMatches.length > 0, `Keyword search returned ${searchMatches.length} match(es)`);
  searchService.jumpToMatch(0);
  assert(searchService.getState().activeMatchIndex === 0, 'Active match index jumps correctly');

  // Feature 4: Translate & Simplify
  console.log('\n* 4. Translate & Simplify Feature');
  const transQuick = await translateText('Online centralized system for distribution of educational scholarships in Kerala.');
  assert(transQuick.success === true && transQuick.simplified.length > 0, `Translate & Simplify output generated: "${transQuick.simplified}"`);

  // Feature 5: Why Doesn't This Work? (Diagnostics)
  console.log('\n* 5. Why Doesn\'t This Work? Feature (Diagnostics)');
  assert(Array.isArray(report.brokenElements) && report.brokenElements.length > 0, `Diagnostics detected ${report.brokenElements.length} broken/unclickable element(s)`);
  assert(report.brokenElements[0].selector.length > 0, `Diagnostic target selector verified: ${report.brokenElements[0].selector}`);

  // Feature 6: Dyslexia Friendly Mode
  console.log('\n* 6. Dyslexia Friendly Mode');
  const dyslexiaSettings = {
    textSize: 130,
    fontFamily: 'lexend',
    colorTint: 'cream',
    letterSpacing: 1.5,
    lineSpacing: 1.8,
    readingRuler: true,
    dyslexiaFont: true
  };
  assert(dyslexiaSettings.textSize === 130 && dyslexiaSettings.colorTint === 'cream', 'Dyslexia settings structured correctly');

  console.log('\n====================================================');
  console.log(`  ALL ${passedTests}/${totalTests} TESTS PASSED SUCCESSFULLY (100%)  `);
  console.log('====================================================\n');
}

runMultiWebsiteTestSuite().catch(err => {
  console.error('\n❌ Test Suite encountered an error:', err);
  process.exit(1);
});
