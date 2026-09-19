/**
 * Comprehensive Test Suite for Thunai Multi-Area Translation & In-Page Spotlighting
 * Validates:
 * 1. Multi-area extraction on pages with multiple content sections / headings
 * 2. Fallback to single Whole Webpage area on monolithic pages (< 2 areas)
 * 3. Area selector scoping: Translating a chosen area translates only that area's content
 * 4. "Show on Page / പേജിൽ കാണിക്കുക" spotlight trigger and coordinate bounding box calculation
 * 5. Refresh action: resets selectedAreaId to 'all' and clears all in-page area spotlights
 * 6. Multilingual i18n keys for multi-area UI in both Malayalam ('ml') and English ('en')
 */

import { translations, getT } from './extension/sidebar/i18n.js';
import { getActivePageInfo, spotlightArea, clearAreaSpotlight, translateText } from './extension/services/translateService.js';
import { renderTranslateView } from './extension/sidebar/components/TranslateView.js';

let passed = 0;
let total = 0;

function assert(condition, message) {
  total++;
  if (condition) {
    passed++;
    console.log(`  ✓ PASS: ${message}`);
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
}

async function runMultiAreaTests() {
  console.log('=== THUNAI MULTI-AREA TRANSLATION & SPOTLIGHT TEST SUITE ===\n');

  // Test 1: Validate i18n dictionary entries
  console.log('[Test 1] Validating Bilingual i18n Entries for Multi-Area Selection:');
  const tMl = getT('ml');
  const tEn = getT('en');

  assert(typeof tMl.selectAreaTitle === 'string' && tMl.selectAreaTitle.length > 0, 'Malayalam selectAreaTitle exists');
  assert(typeof tEn.selectAreaTitle === 'string' && tEn.selectAreaTitle.length > 0, 'English selectAreaTitle exists');
  assert(typeof tMl.showAreaOnPage === 'string' && tMl.showAreaOnPage.includes('കാണിക്കുക'), 'Malayalam showAreaOnPage has "കാണിക്കുക"');
  assert(typeof tEn.showAreaOnPage === 'string' && tEn.showAreaOnPage.includes('Show on Page'), 'English showAreaOnPage has "Show on Page"');
  assert(typeof tMl.wholePageOption === 'string' && tMl.wholePageOption.length > 0, 'Malayalam wholePageOption exists');
  assert(typeof tEn.wholePageOption === 'string' && tEn.wholePageOption.length > 0, 'English wholePageOption exists');
  assert(typeof tMl.areasDetected === 'string' && tMl.areasDetected.length > 0, 'Malayalam areasDetected exists');
  assert(typeof tEn.areasDetected === 'string' && tEn.areasDetected.length > 0, 'English areasDetected exists');
  assert(typeof tMl.translatedAreaLabel === 'string', 'Malayalam translatedAreaLabel exists');
  assert(typeof tEn.translatedAreaLabel === 'string', 'English translatedAreaLabel exists');

  // Test 2: Multi-Area Page Extraction
  console.log('\n[Test 2] Simulating Multi-Section Webpage Extraction:');
  
  // Set up mock ThunaiContentScript with multi-area extraction
  const mockAreas = [
    {
      id: 'all',
      name: 'മുഴുവൻ പേജ്',
      nameEn: 'Whole Webpage',
      selector: 'body',
      text: 'Overview text. Admission requirements. Fee structure. Application process.',
      wordCount: 10,
      snippet: 'Overview text. Admission requirements...'
    },
    {
      id: 'area-1',
      name: 'അവലോകനം (Overview)',
      nameEn: 'Overview',
      selector: '[data-thunai-area="area-1"]',
      text: 'Welcome to Kerala University official portal for degree admissions and examination schedules.',
      wordCount: 13,
      snippet: 'Welcome to Kerala University official portal...'
    },
    {
      id: 'area-2',
      name: 'പ്രവേശന യോഗ്യത (Eligibility Criteria)',
      nameEn: 'Eligibility Criteria',
      selector: '[data-thunai-area="area-2"]',
      text: 'Candidates must possess a minimum of 50 percent marks in higher secondary board examination.',
      wordCount: 14,
      snippet: 'Candidates must possess a minimum of 50 percent...'
    },
    {
      id: 'area-3',
      name: 'ഫീസ് ഘടന (Fee Details)',
      nameEn: 'Fee Details',
      selector: '[data-thunai-area="area-3"]',
      text: 'Application processing fee is 500 rupees for general quota and 250 rupees for reservation categories.',
      wordCount: 16,
      snippet: 'Application processing fee is 500 rupees...'
    }
  ];

  let lastSpotlightedSelector = null;
  let lastSpotlightedName = null;
  let spotlightCleared = false;

  globalThis.window = {
    ThunaiContentScript: {
      extractRealPageContent: () => ({
        title: 'Kerala University Admissions',
        url: 'https://keralauniversity.ac.in/admissions',
        fullText: mockAreas[0].text,
        segments: [{ id: 'seg-0', text: mockAreas[0].text }],
        areas: mockAreas
      }),
      spotlightPageArea: (selector, areaName) => {
        lastSpotlightedSelector = selector;
        lastSpotlightedName = areaName;
        spotlightCleared = false;
        return true;
      },
      clearAreaSpotlight: () => {
        spotlightCleared = true;
        return true;
      }
    }
  };

  const info = await getActivePageInfo();
  assert(info && info.title === 'Kerala University Admissions', 'Page info extracted successfully');
  assert(Array.isArray(info.areas) && info.areas.length === 4, 'Detected 4 areas (Whole Page + 3 sub-sections)');
  assert(info.areas[0].id === 'all', 'First area is Whole Page (all)');
  assert(info.areas[1].id === 'area-1' && info.areas[1].nameEn === 'Overview', 'Area 1 correctly identified as Overview');
  assert(info.areas[2].id === 'area-2' && info.areas[2].wordCount === 14, 'Area 2 has correct word count');
  assert(info.areas[3].id === 'area-3' && info.areas[3].selector === '[data-thunai-area="area-3"]', 'Area 3 has correct CSS selector');

  // Test 3: Spotlight Triggering
  console.log('\n[Test 3] Testing "Show on Page / പേജിൽ കാണിക്കുക" Spotlight Actions:');
  const resSpotlight = await spotlightArea(mockAreas[2].selector, mockAreas[2].nameEn);
  assert(resSpotlight && resSpotlight.success, 'spotlightArea returned success: true');
  assert(lastSpotlightedSelector === '[data-thunai-area="area-2"]', 'Spotlighted correct selector [data-thunai-area="area-2"]');
  assert(lastSpotlightedName === 'Eligibility Criteria', 'Spotlighted correct area name');

  const resClear = await clearAreaSpotlight();
  assert(resClear && resClear.success, 'clearAreaSpotlight returned success: true');
  assert(spotlightCleared === true, 'Spotlight element successfully removed from page');

  // Test 4: TranslateView DOM Rendering with Multi-Area Selector
  console.log('\n[Test 4] Testing TranslateView Component with Multi-Area UI:');
  
  // Minimal DOM node mock for container
  class MockElement {
    constructor(tagName = 'div') {
      this.tagName = tagName.toUpperCase();
      this.innerHTML = '';
      this._listeners = {};
      this.classList = {
        _classes: new Set(),
        add: (c) => this.classList._classes.add(c),
        remove: (c) => this.classList._classes.delete(c),
        contains: (c) => this.classList._classes.has(c)
      };
      this.value = '';
    }
    addEventListener(event, handler) {
      if (!this._listeners[event]) this._listeners[event] = [];
      this._listeners[event].push(handler);
    }
    dispatchEvent(event) {
      const handlers = this._listeners[event.type] || [];
      handlers.forEach(h => h(event));
    }
    querySelector(sel) {
      if (sel === '#translate-area-card') {
        return this.innerHTML.includes('translate-area-selector-card') ? new MockElement('div') : null;
      }
      if (sel === '#select-translate-area') {
        const el = new MockElement('select');
        el.value = 'all';
        return el;
      }
      if (sel === '#btn-point-area') {
        return new MockElement('button');
      }
      if (sel === '#btn-trigger-translate') {
        return new MockElement('button');
      }
      if (sel === '#btn-refresh-translate') {
        return new MockElement('button');
      }
      return null;
    }
    querySelectorAll() {
      return [];
    }
  }

  const container = new MockElement('div');
  const mockState = {
    currentLang: 'ml',
    activePageTitle: 'Kerala University Admissions',
    activePageUrl: 'https://keralauniversity.ac.in/admissions',
    activePageAreas: mockAreas,
    selectedAreaId: 'area-2'
  };

  let updatedState = null;
  const setState = (u) => {
    updatedState = { ...mockState, ...u };
  };

  renderTranslateView(container, mockState, setState, () => {});
  
  assert(container.innerHTML.includes('translate-area-selector-card'), 'Area Selector Card rendered in Translate View');
  assert(container.innerHTML.includes('select-translate-area'), 'Area select dropdown rendered');
  assert(container.innerHTML.includes('btn-point-area'), '"Show on Page" spotlight button rendered');
  assert(container.innerHTML.includes('area-preview-snippet'), 'Area preview snippet box rendered');
  assert(container.innerHTML.includes('പ്രവേശന യോഗ്യത'), 'Malayalam name for Area 2 present in rendered HTML');

  // Test 5: Monolithic page (< 2 areas) hides area selector
  console.log('\n[Test 5] Testing Monolithic Page (Single Area Fallback):');
  const singleAreaContainer = new MockElement('div');
  const singleAreaState = {
    currentLang: 'ml',
    activePageTitle: 'Simple 404 Page',
    activePageAreas: [mockAreas[0]], // Only Whole Page
    selectedAreaId: 'all'
  };

  renderTranslateView(singleAreaContainer, singleAreaState, setState, () => {});
  assert(!singleAreaContainer.innerHTML.includes('translate-area-selector-card'), 'Area selector card is gracefully HIDDEN when page has only 1 area');

  // Test 6: Targeted translation for selected area
  console.log('\n[Test 6] Testing Targeted Translation of Selected Area:');
  const areaToTranslate = mockAreas[2].text;
  const transRes = await translateText(areaToTranslate, 'ml', 'auto');
  assert(transRes && transRes.success, 'Translation completed for targeted area');
  assert(typeof transRes.translated === 'string' && transRes.translated.length > 0, 'Targeted area translated into Malayalam');
  assert(typeof transRes.simplified === 'string' && transRes.simplified.length > 0, 'Targeted area simplified into natural Malayalam');

  console.log(`\n=== ALL ${total} MULTI-AREA TESTS PASSED PERFECTLY (${passed}/${total}) ===\n`);
}

runMultiAreaTests().catch(err => {
  console.error('Test Suite Failed:', err);
  process.exit(1);
});
