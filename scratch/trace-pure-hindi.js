import { translateText, detectLanguageHint } from '../extension/services/translateService.js';

const tests = [
  {
    id: 'TEST A',
    text: 'केरल भारत का एक राज्य है। इसकी राजधानी तिरुवनंतपुरम है। केरल में मलयालम बोली जाती है।'
  },
  {
    id: 'TEST B',
    text: 'भारत एक विविधताओं वाला देश है। यहां कई भाषाएं बोली जाती हैं।'
  },
  {
    id: 'TEST C',
    text: 'केरल भारत के दक्षिण-पश्चिमी भाग में स्थित एक राज्य है। इसकी राजधानी तिरुवनंतपुरम है।'
  }
];

async function runPureHindiTrace() {
  console.log('====================================================');
  console.log('       PURE HINDI -> MALAYALAM COMPLETE TRACE       ');
  console.log('====================================================\n');

  for (const t of tests) {
    console.log(`----------------------------------------------------`);
    console.log(`[${t.id}]`);
    console.log(`Input Text:\n${t.text}\n`);

    // 1. Language Detection
    const detected = detectLanguageHint(t.text);
    console.log(`1. Language Detection: ${detected}`);

    // 2. Direct API Request
    const googleUrl = new URL('https://translate.googleapis.com/translate_a/single');
    googleUrl.searchParams.set('client', 'dict-chrome-ex');
    googleUrl.searchParams.set('sl', detected);
    googleUrl.searchParams.set('tl', 'ml');
    googleUrl.searchParams.set('dt', 't');
    googleUrl.searchParams.set('q', t.text);
    console.log(`2. API Request URL: ${googleUrl.toString()}`);
    console.log(`   Source Lang: ${detected}, Target Lang: ml`);

    const httpRes = await fetch(googleUrl.toString(), {
      headers: { 'Accept': 'application/json, text/plain, */*' }
    });
    console.log(`3. HTTP Status: ${httpRes.status}`);

    const rawJson = await httpRes.json();
    console.log(`4. Raw JSON:\n${JSON.stringify(rawJson)}\n`);

    const parsedText = rawJson?.[0]?.map(part => part?.[0] || '').join('').trim();
    console.log(`5. Parsed API Output:\n${parsedText}\n`);

    // 3. translateText Full Pipeline
    const pipelineRes = await translateText(t.text, 'ml', 'auto');
    console.log(`6. translateText() Result:\n${pipelineRes.translated}\n`);
    console.log(`7. Simplified Result:\n${pipelineRes.simplified}\n`);

    const hasDevanagari = /[\u0900-\u097F]/.test(pipelineRes.translated);
    const hasMalayalam = /[\u0900-\u097F]/.test(pipelineRes.translated) === false && /[\u0D00-\u0D7F]/.test(pipelineRes.translated);

    console.log(`8. Devanagari Remaining: ${hasDevanagari ? 'YES (FAIL)' : 'NO (CLEAN)'}`);
    console.log(`9. Contains Malayalam: ${hasMalayalam ? 'YES (PASS)' : 'NO (FAIL)'}`);
    console.log(`10. Verdict: ${hasMalayalam && !hasDevanagari ? 'PASS ✓' : 'FAIL ✗'}\n`);
  }
}

runPureHindiTrace();
