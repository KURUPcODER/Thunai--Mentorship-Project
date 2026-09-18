import { translateText, detectLanguageHint } from '../extension/services/translateService.js';

const testCases = [
  {
    id: 'TEST 1 — ENGLISH',
    text: 'Kerala is a state in India. Its capital is Thiruvananthapuram.'
  },
  {
    id: 'TEST 2 — PURE HINDI',
    text: 'केरल भारत का एक राज्य है। इसकी राजधानी तिरुवनंतपुरम है। केरल में मलयालम बोली जाती है।'
  },
  {
    id: 'TEST 3 — ENGLISH + HINDI',
    text: 'The state of Kerala (केरल) provides scholarships for eligible students.'
  },
  {
    id: 'TEST 4 — MIXED HINDI + ENGLISH',
    text: 'Kerala (केरल) भारत का एक state है.'
  },
  {
    id: 'TEST 5 — MULTIPLE HINDI FRAGMENTS',
    text: 'Students from भारत can apply for scholarships in Kerala (केरल) and other states (राज्य).'
  },
  {
    id: 'TEST 6 — NORMAL ENGLISH WITH NUMBERS',
    text: 'Kerala has 14 districts and more than 600 km of coastline.'
  },
  {
    id: 'TEST 7 — LONGER HINDI TEXT',
    text: `केरल भारत का एक प्रान्त है। इसकी राजधानी तिरुवनन्तपुरम (त्रिवेन्द्रम) है। मलयालम (മലയാളം) यहाँ की मुख्य भाषा है।

यहाँ के प्रमुख नगर तिरुवनन्तपुरम, कोच्चि (कोचीन), कोझिकोड (कालीकट), और त्रिशूर हैं।

केरल में पर्यटन उद्योग बहुत विकसित है और इसे 'ईश्वर का अपना देश' भी कहा जाता है।`
  }
];

async function run() {
  console.log('===============================================================');
  console.log('  THUNAI TRANSLATION: FULL 7-CASE STRICT VERIFICATION SUITE    ');
  console.log('===============================================================\n');

  let allPassed = true;

  for (const tc of testCases) {
    console.log(`---------------------------------------------------------------`);
    console.log(`[${tc.id}]`);
    console.log(`Input Text:\n${tc.text}\n`);

    const langHint = detectLanguageHint(tc.text);
    const res = await translateText(tc.text, 'ml', 'auto');
    const hasDevanagari = /[\u0900-\u097F]/.test(res.translated);
    const hasMalayalam = /[\u0D00-\u0D7F]/.test(res.translated);
    const passed = res.success && hasMalayalam && !hasDevanagari;

    if (!passed) allPassed = false;

    console.log(`Detected Language: ${res.detectedLang} (hint: ${langHint})`);
    console.log(`Translated Output:\n${res.translated}\n`);
    console.log(`Simplified Output:\n${res.simplified}\n`);
    console.log(`Has Malayalam Characters: ${hasMalayalam}`);
    console.log(`Devanagari Remaining: ${hasDevanagari ? 'YES (FAIL)' : 'NO (CLEAN)'}`);
    console.log(`Verdict: ${passed ? 'PASS ✓' : 'FAIL ✗'}\n`);
  }

  console.log('===============================================================');
  console.log(`FINAL RESULT: ${allPassed ? 'ALL 7 TESTS PASSED SUCCESSFULLY (100%)' : 'SOME TESTS FAILED'}`);
  console.log('===============================================================');
}

run();
