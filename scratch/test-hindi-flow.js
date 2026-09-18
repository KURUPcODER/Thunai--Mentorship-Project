import {
  detectLanguageHint,
  getLanguageDisplayName,
  isMostlyMalayalam,
  simplifyMalayalam,
  translateText
} from '../extension/services/translateService.js';

const testText = "केरल भारत का एक राज्य है। इसकी राजधानी तिरुवनंतपुरम है। केरल में मलयालम बोली जाती है।";

async function run() {
  console.log("=== 1. TEST TEXT ===");
  console.log("Source Text:", testText);

  console.log("\n=== 2. LANGUAGE DETECTION ===");
  const detected = detectLanguageHint(testText);
  console.log("detectLanguageHint:", detected);
  console.log("isMostlyMalayalam:", isMostlyMalayalam(testText));
  console.log("getLanguageDisplayName(ml):", getLanguageDisplayName(detected, 'ml'));
  console.log("getLanguageDisplayName(en):", getLanguageDisplayName(detected, 'en'));

  console.log("\n=== 3. DIRECT TRANSLATE TEXT ===");
  try {
    const res = await translateText(testText, 'ml', 'auto', 'https://example.com/hindi-page');
    console.log("Result:", JSON.stringify(res, null, 2));
  } catch (err) {
    console.error("translateText error:", err);
  }
}

run();
