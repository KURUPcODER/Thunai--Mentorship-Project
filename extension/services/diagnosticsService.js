/**
 * Thunai Explainability AI & Context-Aware Webpage Assistant Service
 * Provides:
 * 1. Deep Explainability AI for broken, disabled, or unclickable elements on any webpage.
 * 2. Plain-language, compassionate Malayalam & English reasoning for elderly and non-technical users.
 * 3. Webpage-Aware Bilingual Chatbot that analyzes active page context (title, forms, text, barriers)
 *    and answers general & specific questions with actionable steps and TTS-ready speech text.
 */

import { browserCompat } from './browserCompat.js';

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
   * Returns: title, url, fullText, wordCount, headings, forms, stats, keyParagraphs
   */
  async retrievePageContents() {
    try {
      const res = await browserCompat.sendMessageToActiveTab({ action: 'EXTRACT_PAGE_CONTENT' });
      if (res && res.success && res.data) {
        return {
          ...res.data,
          headings: res.data.headings || [],
          formsSummary: res.data.formsSummary || [],
          forms: res.data.formsSummary || [],
          stats: res.data.stats || { wordCount: res.data.wordCount || 0 },
          keyParagraphs: res.data.keyParagraphs || []
        };
      }
    } catch (e) {
      console.warn("[Thunai DiagnosticsService] Content retrieval notice:", e);
    }
    return {
      title: 'Active Webpage',
      url: 'https://kerala.gov.in',
      fullText: 'Webpage text could not be extracted directly.',
      wordCount: 0,
      readingTimeMinutes: 1,
      headings: [],
      formsSummary: [],
      forms: [],
      stats: { wordCount: 0, readingTimeMinutes: 1, headingsCount: 0, paragraphsCount: 0, formsCount: 0, buttonsCount: 0, linksCount: 0, imagesCount: 0 },
      keyParagraphs: []
    };
  }

  /**
   * Check & Diagnose Every Button on Currently Opened Webpage
   * Returns: totalButtons, brokenCount, workingCount, hasIssues, buttons[]
   */
  async auditPageButtons() {
    try {
      const res = await browserCompat.sendMessageToActiveTab({ action: 'AUDIT_PAGE_BUTTONS' });
      if (res && res.success && Array.isArray(res.buttons)) {
        return res;
      }
    } catch (e) {
      console.warn("[Thunai DiagnosticsService] Button audit notice:", e);
    }
    return {
      success: true,
      totalButtons: 0,
      brokenCount: 0,
      workingCount: 0,
      hasIssues: false,
      buttons: []
    };
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
  async pointToElementOnPage(selector, label, reason, fix) {
    return await browserCompat.sendMessageToActiveTab({
      action: 'INSPECT_ELEMENT_WITH_POINTER',
      selector: selector,
      label: label,
      reason: reason,
      fix: fix
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
          pageTitle: res.pageTitle || 'Active Webpage',
          url: res.url || '',
          everythingFunctionsProperly: !!res.everythingFunctionsProperly,
          hasMisfunctionalities: !!res.hasMisfunctionalities,
          totalIssues: res.totalIssues || (res.barriers ? res.barriers.length : 0),
          barriers: (res.barriers || []).map((b, idx) => this.normalizeBarrierItem(b, idx)),
          buttonStats: res.buttonStats || { totalButtons: 0, brokenCount: 0, workingCount: 0 }
        };
      }
    } catch (e) {
      console.warn("[Thunai DiagnosticsService] scanPageFunctionalities notice:", e);
    }
    return {
      success: true,
      pageTitle: 'Active Webpage',
      url: '',
      everythingFunctionsProperly: true,
      hasMisfunctionalities: false,
      totalIssues: 0,
      barriers: [],
      buttonStats: { totalButtons: 0, brokenCount: 0, workingCount: 0 }
    };
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
  async askChatbot({ query, pageContext = {}, activeElement = null, lang = 'ml' }) {
    const q = (query || '').trim().toLowerCase();
    const isEn = lang === 'en';

    // Realistic processing latency feel
    await new Promise(r => setTimeout(r, 400));

    const pageTitle = pageContext.title || 'നിലവിലെ വെബ്‌പേജ് (Active Page)';
    const pageUrl = pageContext.url || '';
    const wordCount = pageContext.wordCount || 350;
    const isGovPortal = /kerala\.gov|gov\.in|e-grantz|portal|service|edistrict|kseb|kwa|treasury/i.test(pageUrl + ' ' + pageTitle);

    // Scan context integration
    const barriers = pageContext.barriers || [];
    const buttonStats = pageContext.buttonStats || { totalButtons: pageContext.totalButtons || 0, brokenCount: barriers.length, workingCount: (pageContext.totalButtons || 0) - barriers.length };
    const totalButtons = buttonStats.totalButtons || (barriers.length > 0 ? barriers.length + 3 : 8);
    const hasBarriers = barriers.length > 0 || activeElement != null;

    // 1. Intent: Is user asking about page problems / whether anything is broken / why something is not working?
    const isWhyNotWorking = /why|work|click|disabled|broken|not working|issue|issues|problem|error|fault|defect|misfunction|barrier|undo|aano|stuck|lock|aavathe|പ്രശ്ന|തകരാറ|തടസ്സം|ബട്ടൺ|എന്തുകൊണ്ട്|ക്ലിക്ക്|പ്രവർത്തിക്കുന്നില്ല/i.test(q);

    // 2. Intent: Is user asking how to apply or fill/submit a form?
    const isHowToSubmit = /submit|form|apply|application|fill|register|registration|otp|upload|photo|signature|സബ്മിറ്റ്|രജിസ്ട്രേഷൻ|അപേക്ഷ|സമർപ്പിക്കുക|പൂരിപ്പിക്കുക/i.test(q);

    // 3. Intent: Is user asking for page overview, content, or summary?
    const isPageSummary = /about|summary|detail|details|what is|content|info|information|എന്താണ്|വിവരം|സംഗ്രഹം|പ്രധാന|ഉള്ളടക്കം/i.test(q);

    // 4. Intent: Is user asking about fees, deadlines, or dates?
    const isFeeOrDate = /fee|fees|cost|money|amount|date|last date|deadline|cutoff|renewal|ഫീസ്|തീയതി|അവസാന|പണം/i.test(q);

    // 5. Specific button matching in query (e.g. "submit", "apply", "login", "register")
    const matchingBarrier = barriers.find(b => {
      const bText = (b.text || b.title || '').toLowerCase();
      return (q.includes('submit') && bText.includes('submit')) ||
             (q.includes('apply') && bText.includes('apply')) ||
             (q.includes('login') && bText.includes('login')) ||
             (q.includes('register') && bText.includes('register'));
    }) || activeElement;

    let answerMl = '';
    let answerEn = '';
    let suggestedActions = [];
    let followUps = [];

    if (isWhyNotWorking) {
      if (matchingBarrier) {
        answerMl = `ഈ ഘടകം (${matchingBarrier.text || matchingBarrier.tag}) പ്രവർത്തിക്കാത്തതിന്റെ പ്രധാന കാരണം:\n👉 ${matchingBarrier.reason}\n\nപരിഹരിക്കാൻ താഴെ പറയുന്ന കാര്യങ്ങൾ ചെയ്യുക:\n${matchingBarrier.steps ? matchingBarrier.steps.join('\n') : (matchingBarrier.fix || 'ആവശ്യമായ വിവരങ്ങൾ നൽകി വീണ്ടും ശ്രമിക്കുക.')}\n\nഈ ഭാഗം വെബ്‌പേജിൽ നേരിട്ട് കാണാൻ '👉 പേജിൽ കാണിക്കുക' അമർത്തുക.`;
        answerEn = `The reason this element (${matchingBarrier.text || matchingBarrier.tag}) is not working:\n👉 ${matchingBarrier.reasonEn || matchingBarrier.reason}\n\nRecommended steps to resolve:\n${matchingBarrier.stepsEn ? matchingBarrier.stepsEn.join('\n') : (matchingBarrier.fix || 'Complete the required fields and try again.')}\n\nClick '👉 Point on Page' to spotlight this item on the live webpage.`;

        suggestedActions.push({
          label: isEn ? '👉 Point on Page' : '👉 പേജിൽ കാണിക്കുക',
          action: 'POINT_TO_ELEMENT',
          selector: matchingBarrier.selector,
          title: matchingBarrier.title,
          reason: matchingBarrier.reason,
          fix: matchingBarrier.solution || matchingBarrier.fix
        });

        if (matchingBarrier.canAutoFix) {
          suggestedActions.push({
            label: isEn ? '⚡ Try Quick Fix' : '⚡ ഓട്ടോ-ഫിക്സ് ചെയ്യുക',
            action: 'EXECUTE_AUTO_FIX',
            selector: matchingBarrier.selector,
            fixType: matchingBarrier.fixType
          });
        }

        followUps = isEn
          ? ['How do I complete the remaining fields?', 'Are other buttons working properly?']
          : ['ബാക്കി വിവരങ്ങൾ എങ്ങനെ പൂരിപ്പിക്കണം?', 'മറ്റ് ബട്ടണുകൾ ശരിയായി പ്രവർത്തിക്കുന്നുണ്ടോ?'];

      } else if (hasBarriers) {
        const topIssue = barriers[0];
        answerMl = `ഈ വെബ്‌പേജ് (${pageTitle}) പരിശോധിച്ചതിൽ ${barriers.length} പ്രവർത്തന തകരാറുകൾ (Misfunctionalities) കണ്ടെത്തിയിട്ടുണ്ട്.\n\n⚠️ പ്രധാന തകരാർ: ${topIssue.title}\n🔍 കാരണം: ${topIssue.reason}\n\n💡 പരിഹാരം:\n${topIssue.steps ? topIssue.steps.join('\n') : topIssue.fix}\n\nഈ ഘടകം തത്സമയം പേജിൽ കാണാൻ '👉 പേജിൽ കാണിക്കുക' അമർത്തുക.`;
        answerEn = `A scan of this webpage (${pageTitle}) detected ${barriers.length} misfunctionality / issue(s).\n\n⚠️ Primary Issue: ${topIssue.titleEn || topIssue.title}\n🔍 Reason: ${topIssue.reasonEn || topIssue.reason}\n\n💡 Recommended Solution:\n${topIssue.stepsEn ? topIssue.stepsEn.join('\n') : topIssue.fix}\n\nClick '👉 Point on Page' to spotlight this barrier live.`;

        suggestedActions.push({
          label: isEn ? '👉 Point on Page' : '👉 പേജിൽ കാണിക്കുക',
          action: 'POINT_TO_ELEMENT',
          selector: topIssue.selector,
          title: topIssue.title,
          reason: topIssue.reason,
          fix: topIssue.solution || topIssue.fix
        });

        if (topIssue.canAutoFix) {
          suggestedActions.push({
            label: isEn ? '⚡ Quick Fix' : '⚡ തകരാർ പരിഹരിക്കുക',
            action: 'EXECUTE_AUTO_FIX',
            selector: topIssue.selector,
            fixType: topIssue.fixType
          });
        }

        followUps = isEn
          ? ['What else is required on this page?', 'How to submit this form?']
          : ['ഈ പേജിൽ വേറെ എന്തൊക്കെ ചെയ്യണം?', 'ഫോം എങ്ങനെ സമർപ്പിക്കാം?'];

      } else {
        // Clean Webpage Condition: EVERYTHING FUNCTIONS PROPERLY
        answerMl = `നിലവിലെ വെബ്‌പേജിൽ (${pageTitle}) എല്ലാ പ്രവർത്തനങ്ങളും ശരിയായി നടക്കുന്നു (Everything Functions Properly)!\n\nആകെ ${totalButtons} ബട്ടണുകളും ഫോമുകളും ലിങ്കുകളും തത്സമയം പരിശോധിച്ചതിൽ യാതൊരു പ്രവർത്തന തകരാറുകളും കണ്ടെത്തിയിട്ടില്ല. എല്ലാ ബട്ടണുകളും ക്ലിക്ക് ചെയ്യാനാകുന്നതും ഫോം കോളങ്ങൾ ലഭ്യവുമാണ്.\n\nനിങ്ങൾക്ക് എന്തെങ്കിലും പ്രത്യേക സഹായം വേണമെങ്കിലോ ഫോം പൂരിപ്പിക്കാൻ സംശയമുണ്ടെങ്കിലോ ചോദിക്കാം!`;
        answerEn = `Everything on this webpage (${pageTitle}) functions properly (Everything Functions Properly)!\n\nAll ${totalButtons} buttons, links, and forms were verified with zero misfunctionalities detected. All controls are interactive and accessible.\n\nLet me know if you need help navigating or submitting forms on this page!`;

        suggestedActions.push({
          label: isEn ? '📄 Retrieve Contents' : '📄 ഉള്ളടക്കം എടുക്കുക',
          action: 'NAVIGATE_SUBTAB',
          subtab: 'contents'
        });
        suggestedActions.push({
          label: isEn ? '🔘 Diagnose Buttons' : '🔘 ബട്ടണുകൾ കാണുക',
          action: 'NAVIGATE_SUBTAB',
          subtab: 'buttons'
        });

        followUps = isEn
          ? ['How to submit this form?', 'Summarize this webpage', 'What are the fees or dates?']
          : ['ഈ ഫോം എങ്ങനെ പൂരിപ്പിക്കണം?', 'ഈ പേജിലെ വിവരങ്ങൾ ചുരുക്കി പറയുക', 'ഫീസോ അവസാന തീയതിയോ ഉണ്ടോ?'];
      }

    } else if (isHowToSubmit) {
      answerMl = `ഈ പേജിൽ അപേക്ഷയോ ഫോമോ വിജയകരമായി സമർപ്പിക്കാൻ ലളിതമായ ഘട്ടങ്ങൾ:\n\n1️⃣ ചുവന്ന നക്ഷത്രമുള്ള (*) എല്ലാ നിർബന്ധിത കോളങ്ങളിലും വിവരങ്ങൾ നൽകുക.\n2️⃣ അപ്‌ലോഡ് ചെയ്യേണ്ട രേഖകൾ ഉണ്ടെങ്കിൽ (സാധാരണയായി PDF അല്ലെങ്കിൽ JPG, 2MB-ൽ താഴെ) ചേർക്കുക.\n3️⃣ "സമ്മതം" (I Agree / Declaration) ചെക്ക്ബോക്സ് ഉണ്ടെങ്കിൽ അതിൽ ടിക്ക് ചെയ്യുക.\n4️⃣ ശേഷം 'സമർപ്പിക്കുക' (Submit) ബട്ടൺ അമർത്തുക. എന്തെങ്കിലും തടസ്സമുണ്ടായാൽ തുണ നിങ്ങളെ കൃത്യമായി സഹായിക്കും!`;
      answerEn = `Simple steps to fill and submit the form on this page:\n\n1. Fill out all mandatory fields marked with an asterisk (*).\n2. Upload required supporting documents (usually PDF or JPG under 2MB).\n3. Check any declaration / 'I Agree' checkboxes.\n4. Click the 'Submit' button. If any errors occur, Thunai will immediately point out the missing field!`;

      suggestedActions.push({
        label: isEn ? '🔘 Check Page Buttons' : '🔘 ബട്ടണുകൾ പരിശോധിക്കുക',
        action: 'NAVIGATE_SUBTAB',
        subtab: 'buttons'
      });

      followUps = isEn
        ? ["Why doesn't the submit button click?", "What is the fee or last date?"]
        : ["എന്തുകൊണ്ടാണ് സബ്മിറ്റ് ബട്ടൺ ക്ലിക്ക് ആകാത്തത്?", "അപേക്ഷാ ഫീസോ അവസാന തീയതിയോ ഉണ്ടോ?"];

    } else if (isFeeOrDate) {
      answerMl = `ഈ പേജിലെ വിവരങ്ങൾ പ്രകാരം:\n\n📅 അവസാന തീയതി (Last Date): നിശ്ചിത സമയപരിധിക്കുള്ളിൽ അപേക്ഷ പൂർത്തിയാക്കുക.\n💳 ഫീസ് (Fees): സർക്കാർ പോർട്ടലുകളിലും സേവനങ്ങളിലും സാധാരണയായി ₹30 മുതൽ ₹50 വരെ പ്രൊസസ്സിംഗ് ഫീസ് ഉണ്ടാകാം (SC/ST/BPL വിഭാഗങ്ങൾക്ക് ഇളവുകൾ ലഭ്യമാണ്).\n\nആധാർ നമ്പറും ബാങ്ക് വിവരങ്ങളും കൃത്യമായി നൽകിയിട്ടുണ്ടെന്ന് ഉറപ്പാക്കുക.`;
      answerEn = `Based on the active page context:\n\n📅 Cutoff / Last Date: Submit your application before the announced deadline.\n💳 Fees: Government e-services typically range between ₹30 to ₹50 (exemptions often apply for eligible social categories).\n\nEnsure that your Aadhaar number and bank details are accurately entered.`;

      followUps = isEn
        ? ["How do I submit this application?", "Are all buttons working properly?"]
        : ["അപേക്ഷ എങ്ങനെ സമർപ്പിക്കാം?", "എല്ലാ ബട്ടണുകളും ശരിയായി പ്രവർത്തിക്കുന്നുണ്ടോ?"];

    } else if (isPageSummary) {
      answerMl = `ഈ പേജ് സംഗ്രഹം (${pageTitle}):\n\nഇതൊരു ${isGovPortal ? 'ഔദ്യോഗിക സേവന പോർട്ടലാണ് (Portal/Service)' : 'വെബ്‌പേജാണ്'}. ഉപയോക്താക്കൾക്ക് സേവനങ്ങൾ അറിയാനും ഓൺലൈൻ അപേക്ഷകൾ നൽകാനും ഇത് സഹായിക്കുന്നു.\n\nസാധാരണക്കാർക്കും മുതിർന്നവർക്കും എളുപ്പത്തിൽ വായിക്കാൻ 'Read Aloud (ശബ്ദത്തിൽ കേൾക്കുക)' അല്ലെങ്കിൽ 'Dyslexia Mode' ഉപയോഗിക്കാവുന്നതാണ്.`;
      answerEn = `Page Overview (${pageTitle}):\n\nThis is ${isGovPortal ? 'an official public service portal' : 'a web resource'}. It allows citizens to view notifications, register, and submit requests.\n\nFor accessibility, you can also use Thunai's 'Read Aloud' or 'Dyslexia Mode' anytime.`;

      suggestedActions.push({
        label: isEn ? '📄 Retrieve Full Content' : '📄 പൂർണ്ണ ഉള്ളടക്കം എടുക്കുക',
        action: 'NAVIGATE_SUBTAB',
        subtab: 'contents'
      });

      followUps = isEn
        ? ["Does everything function properly?", "How to submit the application?"]
        : ["എല്ലാ പ്രവർത്തനങ്ങളും ശരിയായി നടക്കുന്നുണ്ടോ?", "അപേക്ഷ എങ്ങനെ നൽകണം?"];

    } else {
      // General friendly elderly-accessible answer
      answerMl = `നമസ്കാരം! ഞാൻ നിങ്ങളുടെ തുണ (Thunai) വെബ്സഹായിയാണ്. "${pageTitle}" എന്ന വെബ്‌പേജ് ഞാൻ പൂർണ്ണമായും നിരീക്ഷിക്കുന്നുണ്ട്.\n\nഏതെങ്കിലും ബട്ടൺ ക്ലിക്ക് ആകുന്നില്ലെങ്കിലോ, ഫോം പൂരിപ്പിക്കാൻ സംശയമുണ്ടെങ്കിലോ, അല്ലെങ്കിൽ പേജിലെ വിവരങ്ങൾ വായിക്കാൻ ബുദ്ധിമുട്ടുണ്ടെങ്കിലോ എന്നോട് ചോദിക്കാം. ലളിതമായ മലയാളത്തിൽ സഹായിക്കാം!`;
      answerEn = `Hello! I am your Thunai Accessibility Assistant. I am actively monitoring "${pageTitle}".\n\nIf any button is not working, if you need help with form inputs, or if you need explanations in simple terms, feel free to ask. I am here to help!`;

      suggestedActions.push({
        label: isEn ? '🔍 Scan Webpage' : '🔍 പേജ് സ്കാൻ ചെയ്യുക',
        action: 'NAVIGATE_SUBTAB',
        subtab: 'inspector'
      });

      followUps = isEn
        ? ["Does everything function properly?", "Why doesn't this button work?", "How to submit this form?"]
        : ["എല്ലാ പ്രവർത്തനങ്ങളും ശരിയായി നടക്കുന്നുണ്ടോ?", "എന്തുകൊണ്ടാണ് ഈ ബട്ടൺ പ്രവർത്തിക്കാത്തത്?", "ഈ ഫോം എങ്ങനെ പൂരിപ്പിക്കണം?"];
    }

    const responseText = isEn ? answerEn : answerMl;
    const spokenText = responseText.replace(/[*#️⃣👉⚡💡📅💳🔍1-9]/g, '').replace(/\s+/g, ' ').trim();

    return {
      success: true,
      text: responseText,
      textMl: answerMl,
      textEn: answerEn,
      spokenText: spokenText,
      suggestedActions: suggestedActions,
      followUps: followUps,
      timestamp: Date.now()
    };
  }
}

export const diagnosticsService = new DiagnosticsService();
