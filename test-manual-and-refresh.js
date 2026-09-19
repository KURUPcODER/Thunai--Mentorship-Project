/**
 * User Manual & Refresh Functionality Verification Test
 */

import { getT, translations } from './extension/sidebar/i18n.js';
import { searchService } from './extension/services/searchService.js';
import { ttsService } from './extension/services/ttsService.js';
import { scanPage } from './extension/services/scanService.js';

async function runManualAndRefreshTests() {
  console.log('=== TEST: USER MANUAL & UNIVERSAL REFRESH ===\n');

  // 1. Verify User Manual Translations in Malayalam
  const tMl = getT('ml');
  if (!tMl.manualTabBtn || !tMl.purposeHeading || !tMl.featScanTitle || !tMl.featDyslexiaTitle || !tMl.featSearchTitle || !tMl.featListenTitle || !tMl.featTranslateTitle || !tMl.featDiagTitle) {
    throw new Error('Malayalam User Manual keys are missing');
  }
  console.log('✓ Malayalam User Manual keys verified');
  console.log('    Title:', tMl.manualMainTitle);
  console.log('    Purpose:', tMl.purposeHeading);

  // 2. Verify User Manual Translations in English
  const tEn = getT('en');
  if (!tEn.manualTabBtn || !tEn.purposeHeading || !tEn.featScanTitle || !tEn.featDyslexiaTitle || !tEn.featSearchTitle || !tEn.featListenTitle || !tEn.featTranslateTitle || !tEn.featDiagTitle) {
    throw new Error('English User Manual keys are missing');
  }
  console.log('✓ English User Manual keys verified');
  console.log('    Title:', tEn.manualMainTitle);
  console.log('    Purpose:', tEn.purposeHeading);

  // 3. Verify Refresh keys in both languages
  if (!tMl.refreshBtn || !tMl.refreshFeatureBtn || !tEn.refreshBtn || !tEn.refreshFeatureBtn) {
    throw new Error('Refresh button keys are missing');
  }
  console.log('✓ Refresh button keys verified in ML and EN');

  // 4. Test Search Refresh
  await searchService.searchPage('test');
  searchService.clear();
  const searchState = searchService.getState();
  if (searchState.query !== '' || searchState.totalMatches !== 0) {
    throw new Error('searchService.clear() did not reset state');
  }
  console.log('✓ Search Service: clear() restores query="" and totalMatches=0');

  // 5. Test TTS Refresh
  ttsService.play();
  ttsService.setSpeed(1.5);
  ttsService.stop();
  ttsService.setSpeed(1.0);
  const ttsState = ttsService.getState();
  if (ttsState.isPlaying || ttsState.playbackSpeed !== 1.0) {
    throw new Error('ttsService refresh did not reset playing or speed');
  }
  console.log('✓ TTS Service: stop() and setSpeed(1.0) restores fresh audio state');

  // 6. Test Live Scan Page integration
  const scanReport = await scanPage();
  if (!scanReport || !scanReport.categories) {
    throw new Error('Scan Page did not return valid report');
  }
  console.log('✓ Live Scan Engine: Returns', scanReport.categories.length, 'categories for live scan mode');

  console.log('\n=== ALL USER MANUAL & REFRESH TESTS PASSED (100%) ===');
}

runManualAndRefreshTests();
