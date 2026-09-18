import { translateText, detectLanguageHint } from '../extension/services/translateService.js';

async function runValidation() {
  console.log('==============================================');
  console.log('  HINDI -> MALAYALAM TRANSLATION VERIFICATION  ');
  console.log('==============================================\n');

  // Test 1: English
  console.log('--- TEST 1: ENGLISH -> MALAYALAM ---');
  const enInput = 'Kerala is a state in India.';
  const enDetected = detectLanguageHint(enInput);
  console.log('Input:', enInput);
  console.log('Detected Language:', enDetected);
  const enRes = await translateText(enInput, 'ml', 'auto');
  console.log('Translated Output:', enRes.translated);
  console.log('Simplified Output:', enRes.simplified);
  console.log('Success:', enRes.success, '| Has Malayalam:', /[\u0D00-\u0D7F]/.test(enRes.translated));

  // Test 2: Hindi
  console.log('\n--- TEST 2: HINDI -> MALAYALAM ---');
  const hiInput = 'केरल भारत का एक राज्य है। इसकी राजधानी तिरुवनंतपुरम है। केरल में मलयालम बोली जाती है।';
  const hiDetected = detectLanguageHint(hiInput);
  console.log('Input:', hiInput);
  console.log('Detected Language:', hiDetected);
  const hiRes = await translateText(hiInput, 'ml', 'auto');
  console.log('Translated Output:', hiRes.translated);
  console.log('Simplified Output:', hiRes.simplified);
  console.log('Success:', hiRes.success, '| Has Malayalam:', /[\u0D00-\u0D7F]/.test(hiRes.translated));

  // Test 3: Mixed English + Hindi
  console.log('\n--- TEST 3: MIXED ENGLISH + HINDI -> MALAYALAM ---');
  const mixedInput = 'The state of Kerala (केरल) provides scholarships for eligible students.';
  const mixedDetected = detectLanguageHint(mixedInput);
  console.log('Input:', mixedInput);
  console.log('Detected Language:', mixedDetected);
  const mixedRes = await translateText(mixedInput, 'ml', 'auto');
  console.log('Translated Output:', mixedRes.translated);
  console.log('Simplified Output:', mixedRes.simplified);
  console.log('Success:', mixedRes.success, '| Has Malayalam:', /[\u0D00-\u0D7F]/.test(mixedRes.translated));

  console.log('\n==============================================');
  console.log('  ALL TRANSLATION TESTS COMPLETED             ');
  console.log('==============================================');
}

runValidation();
