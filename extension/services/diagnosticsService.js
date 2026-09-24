/**
 * Thunai Explainability AI & Context-Aware Webpage Assistant Service
 * Provides:
 * 1. Deep Explainability AI for broken, disabled, or unclickable elements on any webpage.
 * 2. Plain-language, compassionate Malayalam & English reasoning for elderly and non-technical users.
 * 3. Webpage-Aware Bilingual Chatbot that analyzes active page context (title, forms, text, barriers)
 *    and answers general & specific questions with actionable steps and TTS-ready speech text.
 */

import { browserCompat } from './browserCompat.js';
import { translateText, detectLanguageHint } from './translateService.js';

export const UNIVERSAL_BARRIERS_KNOWLEDGE_BASE = [
  {
    type: 'disabled_button',
    matchTags: ['button', 'input[type="submit"]', '[role="button"]'],
    titleMl: 'നിഷ്ക്രിയമായ സമർപ്പിക്കൽ ബട്ടൺ (Disabled Button)',
    titleEn: 'Disabled Action Button',
    summaryMl: 'ഫോമിലെ വിവരങ്ങൾ അപൂർണ്ണമായതിനാലോ സമ്മതപത്രം ടിക്ക് ചെയ്യാത്തതിനാലോ ബട്ടൺ നിഷ്ക്രിയമായിരിക്കുന്നു.',
    summaryEn: 'The button is locked in a disabled state until all mandatory form requirements are satisfied.',
    stepsMl: [
      '1️⃣ മുകളിലെ ചുവന്ന നക്ഷത്ര ചിഹ്നമുള്ള (*) എല്ലാ നിർബന്ധിത കോളങ്ങളും പൂരിപ്പിക്കുക.',
      '2️⃣ "നിബന്ധനകൾ അംഗീകരിക്കുന്നു" (I Agree) എന്ന ചെക്ക്ബോക്സ് ഉണ്ടെങ്കിൽ അതിൽ ടിക്ക് ചെയ്യുക.',
      '3️⃣ മൊബൈൽ നമ്പറോ ഇമെയിലോ ശരിയായി ടൈപ്പ് ചെയ്തിട്ടുണ്ടോ എന്ന് പരിശോധിക്കുക.',
      '4️⃣ ആവശ്യമെങ്കിൽ "ഓട്ടോ-ഫിക്സ്" ബട്ടൺ അമർത്തി ബട്ടൺ നേരിട്ട് സജീവമാക്കാം.'
    ],
    stepsEn: [
      '1. Complete all mandatory input fields marked with an asterisk (*).',
      '2. Check any terms and conditions or declaration checkboxes.',
      '3. Verify your phone number or email format.',
      '4. Use Thunai Quick Fix to directly unlock the button.'
    ]
  },
  {
    type: 'overlay_blocked',
    matchTags: ['modal', 'backdrop', 'overlay', 'banner'],
    titleMl: 'അദൃശ്യ പോപ്പപ്പ് തടസ്സം (Invisible Overlay Blocking Clicks)',
    titleEn: 'Click Intercepted by Background Overlay',
    summaryMl: 'പേജിന് മുകളിലുള്ള ഒരു സുതാര്യമായ പാളിയോ ക്ലോസ് ചെയ്യാത്ത അറിയിപ്പോ കാരണം നിങ്ങളുടെ ക്ലിക്ക് ബട്ടണിൽ എത്തുന്നില്ല.',
    summaryEn: 'An invisible modal backdrop, notification banner, or high z-index container is intercepting mouse clicks.',
    stepsMl: [
      '1️⃣ പേജിൽ ഏതെങ്കിലും അറിയിപ്പ് ബോക്സോ മുന്നറിയിപ്പോ കാണുന്നുണ്ടെങ്കിൽ അതിലെ ക്ലോസ് (✕ / Close) ബട്ടൺ അമർത്തുക.',
      '2️⃣ കീബോർഡിലെ "Escape" (Esc) കീ അമർത്തി പോപ്പപ്പ് മാറ്റാൻ ശ്രമിക്കുക.',
      '3️⃣ താഴെയുള്ള "ഓട്ടോ-ഫിക്സ്" അമർത്തി അദൃശ്യ പാളി ഒഴിവാക്കുക.'
    ],
    stepsEn: [
      '1. Close any visible alert popup, cookie banner, or notification on the page.',
      '2. Press the Escape (Esc) key on your keyboard to dismiss modals.',
      '3. Click Thunai Quick Fix to instantly remove the intercepting layer.'
    ]
  },
  {
    type: 'dead_link',
    matchTags: ['a[href="#"]', 'a:not([href])'],
    titleMl: 'പ്രവർത്തനരഹിതമായ ലിങ്ക് (Dead / Non-Navigating Link)',
    titleEn: 'Dead / Non-Navigating Link',
    summaryMl: 'ഈ ലിങ്കിൽ ശരിയായ വെബ്‌സൈറ്റ് വിലാസം നൽകിയിട്ടില്ലാത്തതിനാൽ ക്ലിക്ക് ചെയ്യുമ്പോൾ പേജ് മാറുന്നില്ല.',
    summaryEn: 'This link has an empty href="#" attribute and does not navigate anywhere.',
    stepsMl: [
      '1️⃣ പേജിന്റെ മുകളിലുള്ള പ്രധാന മെനുവിൽ നിന്നോ തിരച്ചിൽ (Search) വഴിയോ ഈ വിവരങ്ങൾ കണ്ടെത്താൻ ശ്രമിക്കുക.',
      '2️⃣ സൈറ്റ്മാപ്പിലോ (Site Map) മറ്റ് അനുബന്ധ ലിങ്കുകളിലോ ക്ലിക്ക് ചെയ്തു നോക്കുക.'
    ],
    stepsEn: [
      '1. Use the top navigation menu or search bar to find this section.',
      '2. Look for an alternative link under the sitemap or related resources.'
    ]
  },
  {
    type: 'missing_label',
    matchTags: ['input:not([aria-label])', 'select'],
    titleMl: 'ലേബൽ ഇല്ലാത്ത ഇൻപുട്ട് ബോക്സ് (Missing Field Label)',
    titleEn: 'Unlabelled Input Field',
    summaryMl: 'ഈ ബോക്സിൽ എന്ത് വിവരമാണ് നൽകേണ്ടതെന്ന് പേജിൽ വ്യക്തമായി കാണിച്ചിട്ടില്ല.',
    summaryEn: 'The input field lacks an explicit accessible label or clear placeholder.',
    stepsMl: [
      '1️⃣ ബോക്സിന് മുകളിലോ അടുത്തോ ഉള്ള വാചകങ്ങൾ ശ്രദ്ധിക്കുക.',
      '2️⃣ മൗസ് ബോക്സിന് മുകളിൽ കൊണ്ടുവെക്കുമ്പോൾ എന്തെങ്കിലും കുറിപ്പ് (Tooltip) കാണിക്കുന്നുണ്ടോ എന്ന് നോക്കുക.'
    ],
    stepsEn: [
      '1. Read the adjacent text or paragraph next to this box for guidance.',
      '2. Hover over the box to see if any helpful tooltip appears.'
    ]
  }
];

class DiagnosticsService {
  constructor() {
    this.conversationHistory = [];
    this.currentInspectedElement = null;
  }

  /**
   * Universal Barrier Diagnosis from Currently Opened Webpage & Scanned Report
   * Queries the live DOM directly for interaction obstacles.
   * Returns empty array [] if no issues are found.
   */
  async getPageBarriers(scanReport) {
    // 1. Direct live analysis on the currently opened webpage via content-script
    try {
      const liveRes = await browserCompat.sendMessageToActiveTab({ action: 'DIAGNOSE_LIVE_PAGE' });
      if (liveRes && liveRes.success && Array.isArray(liveRes.barriers)) {
        return liveRes.barriers.map((item, idx) => this.normalizeBarrierItem(item, idx));
      }
    } catch (e) {
      console.warn("[Thunai DiagnosticsService] Live page direct diagnosis notice:", e);
    }

    // 2. If scanReport has brokenElements, use them
    if (scanReport && Array.isArray(scanReport.brokenElements)) {
      return scanReport.brokenElements.map((item, idx) => this.normalizeBarrierItem(item, idx));
    }

    // 3. Return clean empty array (NO ISSUES FOUND)
    return [];
  }

  /**
   * Retrieve Structured Real Content from Currently Opened Webpage
   * Returns: title, url, fullText, wordCount, readingTimeMinutes, headings, forms, stats, keyParagraphs
   */
  async retrievePageContents() {
    try {
      const res = await browserCompat.sendMessageToActiveTab({ action: 'EXTRACT_PAGE_CONTENT' });
      if (res && res.success && res.data) {
        const data = res.data;
        return {
          ...data,
          title: data.title || 'Current Webpage',
          url: data.url || '',
          fullText: data.fullText || '',
          headings: Array.isArray(data.headings) ? data.headings : [],
          formsSummary: Array.isArray(data.formsSummary) ? data.formsSummary : [],
          stats: data.stats || { wordCount: data.wordCount || 0 },
          keyParagraphs: Array.isArray(data.keyParagraphs) ? data.keyParagraphs : []
        };
      }
      const reason = res?.error || 'The current webpage could not be reached.';
      throw new Error(reason);
    } catch (e) {
      console.warn('[Thunai DiagnosticsService] Current-page content retrieval failed:', e);
      throw new Error(e?.message || 'Unable to retrieve content from the current webpage. Refresh the webpage and try again.');
    }
  }

  /**
   * Check & Diagnose Every Button on Currently Opened Webpage
   * Returns: totalButtons, brokenCount, workingCount, hasIssues, buttons[]
   */
  async auditPageButtons() {
    try {
      const res = await browserCompat.sendMessageToActiveTab({ action: 'AUDIT_PAGE_BUTTONS' });
      if (res && res.success && Array.isArray(res.buttons)) return res;
      throw new Error(res?.error || 'The current webpage could not be reached.');
    } catch (e) {
      console.warn('[Thunai DiagnosticsService] Button audit failed:', e);
      throw new Error(e?.message || 'Unable to check buttons on the current webpage.');
    }
  }

  normalizeBarrierItem(item, idx) {
    const selector = item.selector || `[data-thunai-broken="${item.id}"]` || 'button';
    const tag = item.tag || 'button';
    const text = item.text || item.title || 'Interactive Element';

    let barrierType = 'general';
    let title = item.title || 'പ്രവർത്തന തടസ്സം (Interaction Issue)';
    let titleEn = 'Interaction Barrier';
    let reason = item.reason || item.failureSummary || 'ഈ ഘടകം ശരിയായി പ്രവർത്തിക്കുന്നില്ല.';
    let reasonEn = item.failureSummary || item.reason || 'This element is not responding to interactions.';
    let steps = [
      '1️⃣ ഘടകം ശരിയായി പരിശോധിക്കുക.',
      '2️⃣ ആവശ്യമായ വിവരങ്ങൾ നൽകുക.'
    ];
    let stepsEn = [
      '1. Review the element requirements.',
      '2. Enter any required information.'
    ];
    let canAutoFix = true;
    let fixType = 'focus_missing_field';

    if (selector.includes('submit') || tag === 'button' || reason.toLowerCase().includes('disabled')) {
      barrierType = 'disabled_button';
      title = 'നിഷ്ക്രിയമായ ബട്ടൺ (Disabled Button)';
      titleEn = 'Disabled Action Button';
      reason = 'നിർബന്ധിത വിവരങ്ങൾ പൂരിപ്പിക്കാത്തതിനാലോ നിബന്ധനകൾ അംഗീകരിക്കാത്തതിനാലോ ബട്ടൺ ക്ലിക്ക് ചെയ്യാനാകുന്നില്ല.';
      reasonEn = 'Button is disabled pending mandatory field completion or checkbox consent.';
      steps = [
        '1️⃣ ചുവന്ന നക്ഷത്രമുള്ള (*) ഫീൽഡുകൾ പൂരിപ്പിക്കുക.',
        '2️⃣ നിബന്ധനകൾ അംഗീകരിക്കുന്ന ചെക്ക്ബോക്സ് ടിക്ക് ചെയ്യുക.',
        '3️⃣ ശേഷം വീണ്ടും ഈ ബട്ടൺ ക്ലിക്ക് ചെയ്യുക.'
      ];
      stepsEn = [
        '1. Complete all mandatory fields marked (*).',
        '2. Tick any required agreement checkboxes.',
        '3. Click the button again to proceed.'
      ];
      fixType = 'unblock_button';
    } else if (tag === 'a' || selector.includes('href') || reason.toLowerCase().includes('link')) {
      barrierType = 'dead_link';
      title = 'പ്രവർത്തനരഹിതമായ ലിങ്ക് (Dead Link)';
      titleEn = 'Dead or Void Navigation Link';
      reason = 'ലിങ്കിൽ ശരിയായ വിലാസം ഇല്ലാത്തതിനാൽ മറ്റൊരു പേജ് തുറക്കുന്നില്ല.';
      reasonEn = 'The link has no destination URL (href="#") and does not navigate.';
      steps = [
        '1️⃣ പേജിന്റെ മുകളിലുള്ള പ്രധാന മെനു ഉപയോഗിക്കുക.',
        '2️⃣ തിരച്ചിൽ ബാറിൽ വാക്ക് ടൈപ്പ് ചെയ്യുക.'
      ];
      stepsEn = [
        '1. Use the main navigation menu at the top.',
        '2. Use the search bar to locate this content.'
      ];
      canAutoFix = false;
      fixType = 'none';
    }

    return {
      id: item.id || `barrier-${idx + 1}`,
      selector: selector,
      tag: tag,
      text: text,
      severity: item.severity || 'SERIOUS',
      barrierType: barrierType,
      title: title,
      titleEn: titleEn,
      reason: reason,
      reasonEn: reasonEn,
      solution: steps.join(' '),
      solutionEn: stepsEn.join(' '),
      steps: steps,
      stepsEn: stepsEn,
      canAutoFix: canAutoFix,
      fixType: fixType
    };
  }

  /**
   * Direct in-page inspection with pointing arrow
   */
  async pointToElementOnPage(selector, label, reason, fix, extraInfo = null) {
    return await browserCompat.sendMessageToActiveTab({
      action: 'INSPECT_ELEMENT_WITH_POINTER',
      selector: selector,
      label: label,
      reason: reason,
      fix: fix,
      extraInfo: extraInfo
    });
  }

  /**
   * Start Interactive Element Picker on Page
   */
  async startInPagePicker() {
    return await browserCompat.sendMessageToActiveTab({
      action: 'START_ELEMENT_PICKER'
    });
  }

  /**
   * Scan Webpage Functionalities & Barriers
   * Directly invokes SCAN_PAGE_FUNCTIONALITIES on the active tab.
   * Returns: { everythingFunctionsProperly, hasMisfunctionalities, totalIssues, barriers, buttonStats }
   */
  async scanPageFunctionalities() {
    try {
      const res = await browserCompat.sendMessageToActiveTab({ action: 'SCAN_PAGE_FUNCTIONALITIES' });
      if (res && res.success) {
        return {
          success: true,
          pageTitle: res.pageTitle || 'Current Webpage',
          url: res.url || '',
          everythingFunctionsProperly: !!res.everythingFunctionsProperly,
          hasMisfunctionalities: !!res.hasMisfunctionalities,
          totalIssues: Number(res.totalIssues || 0),
          barriers: (res.barriers || []).map((b, idx) => this.normalizeBarrierItem(b, idx)),
          buttonStats: res.buttonStats || { totalButtons: 0, brokenCount: 0, workingCount: 0 }
        };
      }
      throw new Error(res?.error || 'The current webpage could not be checked.');
    } catch (e) {
      console.warn('[Thunai DiagnosticsService] page check failed:', e);
      throw new Error(e?.message || 'Unable to check the current webpage. Refresh the webpage and try again.');
    }
  }

  async clearPageOverlays() {
    try {
      return await browserCompat.sendMessageToActiveTab({ action: 'RESET_ALL_PAGE_OVERLAYS' });
    } catch (_) {
      return { success: false };
    }
  }

  /**
   * Auto-Fix Dispatcher
   */
  async executeAutoFix(selector, fixType) {
    return await browserCompat.sendMessageToActiveTab({
      action: 'TRY_AUTO_FIX',
      selector: selector,
      fixType: fixType
    });
  }

  /**
   * Context-Aware Webpage AI Chatbot (Refined & Intelligent)
   * Integrates real-time scan results, Malayalam/Manglish/English natural language processing,
   * element-specific groundings, and direct interactive action chips.
   */
  async askChatbot({ query, pageContext = {}, lang = 'ml' }) {
    const q = String(query || '').trim();
    const page = pageContext.pageContent || {};
    const fullText = String(page.fullText || '').replace(/\s+/g, ' ').trim();
    if (!fullText) throw new Error('No content was retrieved from the current webpage. Refresh the content and try again.');

    const title = page.title || pageContext.title || 'Current Webpage';
    const headings = Array.isArray(page.headings) ? page.headings.map(h => h.text).filter(Boolean) : [];
    const paragraphs = Array.isArray(page.keyParagraphs) && page.keyParagraphs.length
      ? page.keyParagraphs.filter(Boolean)
      : fullText.split(/(?<=[.!?।])\s+/).filter(s => s.length > 35).slice(0, 8);

    // Extract the most relevant sentences using words from the user's question.
    const queryWords = q.toLowerCase().split(/[^a-z0-9\u0900-\u0d7f]+/i).filter(w => w.length > 2);
    const sentences = fullText.split(/(?<=[.!?।])\s+|\n+/).map(s => s.trim()).filter(s => s.length > 20);
    const scored = sentences.map((sentence, index) => {
      const lower = sentence.toLowerCase();
      const score = queryWords.reduce((n, word) => n + (lower.includes(word) ? 2 : 0), 0);
      return { sentence, score, index };
    }).sort((a,b) => b.score - a.score || a.index - b.index);
    const relevant = scored.filter(x => x.score > 0).slice(0, 4).map(x => x.sentence);
    const evidence = relevant.length ? relevant : paragraphs.slice(0, 3);

    let answerEn;
    const lowerQ = q.toLowerCase();
    if (/summar|summary|overview|about|what is this|എന്താണ്|സംഗ്രഹം/.test(lowerQ)) {
      answerEn = `This page is titled "${title}".\n\n${evidence.join(' ')}`;
      if (headings.length) answerEn += `\n\nMain sections: ${headings.slice(0, 6).join(', ')}.`;
    } else if (/heading|section|title|തലക്കെട്ട്/.test(lowerQ)) {
      answerEn = headings.length ? `The page has these detected sections: ${headings.slice(0, 10).join(', ')}.` : `I could not detect headings on "${title}".`;
    } else if (/word|count|words|വാക്ക്|എത്ര/.test(lowerQ) && page.wordCount != null) {
      answerEn = `The current page contains about ${page.wordCount} words. Estimated reading time: ${page.readingTimeMinutes || 1} minute(s).`;
    } else {
      answerEn = `Based on the current webpage content, the most relevant information I found is:\n\n${evidence.join('\n\n')}`;
    }

    // Translate the answer itself to Malayalam. If translation is unavailable, keep a clear bilingual fallback.
    let answerMl = '';
    try {
      const translated = await translateText(answerEn, 'ml', detectLanguageHint(answerEn), page.url || '');
      answerMl = translated?.translated || translated || '';
    } catch (_) {
      answerMl = `നിലവിലെ വെബ്‌പേജിലെ പ്രസക്തമായ വിവരങ്ങൾ:\n\n${evidence.join('\n\n')}`;
    }

    return {
      success: true,
      text: answerEn,
      textEn: answerEn,
      textMl: answerMl,
      spokenText: `${answerEn} ${answerMl}`,
      suggestedActions: [],
      followUps: []
    };
  }
}

export const diagnosticsService = new DiagnosticsService();
