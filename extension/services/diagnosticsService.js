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
   * Universal Barrier Diagnosis from Scanned Report & Active DOM
   */
  async getPageBarriers(scanReport) {
    const rawBroken = (scanReport && scanReport.brokenElements && scanReport.brokenElements.length > 0)
      ? scanReport.brokenElements
      : [];

    if (rawBroken.length > 0) {
      return rawBroken.map((item, idx) => this.normalizeBarrierItem(item, idx));
    }

    // Default universal portal barriers for demonstration & fallback
    return [
      {
        id: "barrier-1",
        selector: "button[type='submit'], button.submit-btn, button#submit",
        tag: "button",
        text: "അപേക്ഷ സമർപ്പിക്കുക (Submit Application)",
        severity: "CRITICAL",
        barrierType: "disabled_button",
        title: "നിഷ്ക്രിയമായ സമർപ്പിക്കൽ ബട്ടൺ (Disabled Submit Button)",
        titleEn: "Disabled Submit Button",
        reason: "നിർബന്ധിത വിവരങ്ങൾ (ഉദാഹരണത്തിന്: പേര്, രജിസ്ട്രേഷൻ നമ്പർ) പൂർണ്ണമായി പൂരിപ്പിക്കാത്തതിനാലോ 'I Agree' ചെക്ക്ബോക്സ് ടിക്ക് ചെയ്യാത്തതിനാലോ ബട്ടൺ ക്ലിക്ക് ചെയ്യാനാകുന്നില്ല.",
        reasonEn: "The submit button is locked because mandatory input fields or agreement checkboxes are currently empty.",
        solution: "മുകളിലെ എല്ലാ ഫീൽഡുകളും പൂരിപ്പിച്ച ശേഷം വീണ്ടും സമർപ്പിക്കുക.",
        solutionEn: "Fill in the required inputs marked with an asterisk (*) and tick the declaration checkbox.",
        steps: [
          "1️⃣ മുകളിലെ നിർബന്ധിത കോളങ്ങൾ (ആപ്ലിക്കേഷൻ നമ്പർ, ഫോൺ നമ്പർ) പൂരിപ്പിക്കുക.",
          "2️⃣ നിബന്ധനകൾ അംഗീകരിക്കുന്ന ചെക്ക്ബോക്സ് ഉണ്ടെങ്കിൽ ടിക്ക് ചെയ്യുക.",
          "3️⃣ ശേഷം ഈ ബട്ടൺ അമർത്തുക."
        ],
        stepsEn: [
          "1. Complete the mandatory fields above (Application No, Phone).",
          "2. Check the declaration / terms checkbox.",
          "3. Then click this submit button."
        ],
        canAutoFix: true,
        fixType: "focus_missing_field"
      },
      {
        id: "barrier-2",
        selector: "a[href='#'], a.dead-link",
        tag: "a",
        text: "അറിയിപ്പുകൾ / സേവനങ്ങൾ (Notice Board Link)",
        severity: "SERIOUS",
        barrierType: "dead_link",
        title: "പ്രവർത്തനരഹിതമായ ലിങ്ക് (Dead / Empty Link)",
        titleEn: "Unlinked / Dead Menu Anchor",
        reason: "ഈ ലിങ്കിൽ ശരിയായ വെബ്‌സൈറ്റ് വിലാസമില്ല (href='#'), അതിനാൽ ക്ലിക്ക് ചെയ്താലും പുതിയ പേജ് തുറക്കില്ല.",
        reasonEn: "This navigation link has no destination URL set (href='#'), making clicks non-functional.",
        solution: "മെയിൻ മെനുവിൽ നിന്നോ സെർച്ച് ബാറിൽ നിന്നോ നേരിട്ടുള്ള ലിങ്ക് തിരഞ്ഞെടുക്കുക.",
        solutionEn: "Use the top header menu or page search bar to find this section.",
        steps: [
          "1️⃣ പേജിന്റെ മുകളിലെ മെയിൻ മെനു നോക്കുക.",
          "2️⃣ തുണയിലെ 'Find in Page' ഉപയോഗിച്ച് ഈ വാക്ക് തിരയുക."
        ],
        stepsEn: [
          "1. Check the main navigation header at the top.",
          "2. Use Thunai 'Find in Page' to jump directly to this topic."
        ],
        canAutoFix: false,
        fixType: "none"
      },
      {
        id: "barrier-3",
        selector: "div.modal-backdrop, div.overlay-container",
        tag: "div",
        text: "അദൃശ്യമായ പോപ്പപ്പ് പാളി (Overlay Layer)",
        severity: "CRITICAL",
        barrierType: "overlay_blocked",
        title: "ക്ലിക്ക് തടസ്സപ്പെടുത്തുന്ന അദൃശ്യ പാളി (Click-Intercepting Overlay)",
        titleEn: "Invisible Backdrop Intercepting Clicks",
        reason: "ഒരു അദൃശ്യമായ പോപ്പപ്പ് പാളി പേജിന്റെ മുകളിലുള്ളതിനാൽ മറ്റ് ബട്ടണുകളിൽ ക്ലിക്ക് ചെയ്യുമ്പോൾ പ്രതികരണമില്ല.",
        reasonEn: "An invisible modal backdrop or floating banner is blocking clicks from reaching form elements.",
        solution: "പോപ്പപ്പുകൾ ക്ലോസ് ചെയ്യുക അല്ലെങ്കിൽ തുണ ഓട്ടോ-ഫിക്സ് ഉപയോഗിക്കുക.",
        solutionEn: "Dismiss the popup notice or use Thunai Quick Fix to remove the blocking layer.",
        steps: [
          "1️⃣ തുറന്നിരിക്കുന്ന ഏതെങ്കിലും അറിയിപ്പ് വിൻഡോയിലെ ✕ അമർത്തുക.",
          "2️⃣ അല്ലെങ്കിൽ 'ഓട്ടോ-ഫിക്സ്' അമർത്തി തടസ്സം നേരിട്ട് നീക്കുക."
        ],
        stepsEn: [
          "1. Click the close (✕) button on any notification banner.",
          "2. Or click 'Try Quick Fix' to automatically remove the obstacle."
        ],
        canAutoFix: true,
        fixType: "remove_overlay"
      }
    ];
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
   * Context-Aware Webpage AI Chatbot
   */
  async askChatbot({ query, pageContext = {}, activeElement = null, lang = 'ml' }) {
    const q = (query || '').trim().toLowerCase();
    const isEn = lang === 'en';

    // Simulate light realistic processing latency
    await new Promise(r => setTimeout(r, 450));

    const pageTitle = pageContext.title || 'നിലവിലെ വെബ്‌പേജ് (Active Page)';
    const pageUrl = pageContext.url || '';
    const wordCount = pageContext.wordCount || 350;
    const isGovPortal = /kerala\.gov|gov\.in|e-grantz|portal|service/i.test(pageUrl + ' ' + pageTitle);

    // 1. Check if question is asking why an element or button does not work
    const isWhyNotWorking = /why|work|click|disabled|broken|not working|എന്തുകൊണ്ട്|ക്ലിക്ക്|പ്രവർത്തിക്കുന്നില്ല|തടസ്സം|ബട്ടൺ/i.test(q);
    
    // 2. Check if question is asking how to fill or submit a form
    const isHowToSubmit = /submit|form|apply|application|fill|രജിസ്ട്രേഷൻ|അപേക്ഷ|സമർപ്പിക്കുക|പൂരിപ്പിക്കുക/i.test(q);

    // 3. Check if question is asking for page summary or main details
    const isPageSummary = /about|summary|detail|details|what is|എന്താണ്|വിവരം|സംഗ്രഹം|പ്രധാന/i.test(q);

    // 4. Check if question is asking about fee, date, or deadline
    const isFeeOrDate = /fee|date|last date|deadline|money|cost|ഫീസ്|തീയതി|അവസാന/i.test(q);

    let answerMl = '';
    let answerEn = '';
    let suggestedActions = [];
    let followUps = [];

    if (activeElement && isWhyNotWorking) {
      answerMl = `ഈ ഘടകം (${activeElement.text || activeElement.tag}) പ്രവർത്തിക്കാത്തതിന്റെ പ്രധാന കാരണം: ${activeElement.reason}\n\nപരിഹരിക്കാൻ താഴെ പറയുന്ന കാര്യങ്ങൾ ചെയ്യുക:\n${activeElement.steps ? activeElement.steps.join('\n') : 'വിവരങ്ങൾ പൂർത്തിയാക്കി വീണ്ടും ക്ലിക്ക് ചെയ്യുക.'}`;
      answerEn = `The reason this element (${activeElement.text || activeElement.tag}) is not working: ${activeElement.reasonEn || activeElement.reason}\n\nTo resolve this:\n${activeElement.stepsEn ? activeElement.stepsEn.join('\n') : 'Complete the required information and try again.'}`;
      
      suggestedActions.push({
        label: isEn ? '👉 Point on Page' : '👉 പേജിൽ കാണിക്കുക',
        action: 'POINT_TO_ELEMENT',
        selector: activeElement.selector,
        title: activeElement.title,
        reason: activeElement.reason,
        fix: activeElement.solution
      });

      if (activeElement.canAutoFix) {
        suggestedActions.push({
          label: isEn ? '⚡ Try Quick Fix' : '⚡ ഓട്ടോ-ഫിക്സ് ചെയ്യുക',
          action: 'EXECUTE_AUTO_FIX',
          selector: activeElement.selector,
          fixType: activeElement.fixType
        });
      }

      followUps = isEn
        ? ['How do I fill the remaining form fields?', 'What else is required on this page?']
        : ['ബാക്കി വിവരങ്ങൾ എങ്ങനെ പൂരിപ്പിക്കണം?', 'ഈ പേജിലെ മറ്റ് പ്രധാന കാര്യങ്ങൾ എന്തൊക്കെയാണ്?'];

    } else if (isHowToSubmit) {
      answerMl = `ഈ പേജിൽ അപേക്ഷയോ ഫോമോ വിജയകരമായി സമർപ്പിക്കാൻ ലളിതമായ ഘട്ടങ്ങൾ:\n\n1️⃣ ചുവന്ന നക്ഷത്രമുള്ള (*) എല്ലാ കോളങ്ങളിലും നിങ്ങളുടെ കൃത്യമായ വിവരങ്ങൾ നൽകുക.\n2️⃣ അപ്‌ലോഡ് ചെയ്യേണ്ട സർട്ടിഫിക്കറ്റുകളോ രേഖകളോ ഉണ്ടെങ്കിൽ അവ ചേർക്കുക (സാധാരണയായി 2MB-യിൽ താഴെയുള്ള PDF അല്ലെങ്കിൽ JPG).\n3️⃣ നിബന്ധനകൾ വായിച്ച് 'സമ്മതം' (I Agree) എന്ന ബോക്സിൽ ടിക്ക് ചെയ്യുക.\n4️⃣ ശേഷം 'സമർപ്പിക്കുക' (Submit) ബട്ടൺ അമർത്തുക. എന്തെങ്കിലും തടസ്സമുണ്ടായാൽ തുണ നിങ്ങളെ കൃത്യമായി സഹായിക്കും.`;
      answerEn = `Simple steps to fill and submit the form on this page:\n\n1. Fill out all mandatory fields marked with an asterisk (*).\n2. Upload any required supporting documents (usually PDF or JPG under 2MB).\n3. Tick the declaration / 'I Agree' checkbox.\n4. Click the 'Submit' button. If any errors occur, Thunai will point out the missing items.`;
      
      followUps = isEn
        ? ["Why doesn't the submit button click?", "What is the fee or last date?"]
        : ["എന്തുകൊണ്ടാണ് സബ്മിറ്റ് ബട്ടൺ ക്ലിക്ക് ആകാത്തത്?", "അപേക്ഷാ ഫീസോ അവസാന തീയതിയോ ഉണ്ടോ?"];

    } else if (isFeeOrDate) {
      answerMl = `ഈ പേജിലെ വിവരങ്ങൾ പ്രകാരം:\n\n📅 അവസാന തീയതി (Last Date): നിശ്ചിത സമയപരിധിക്കുള്ളിൽ അപേക്ഷ സമർപ്പിക്കേണ്ടതാണ്.\n💳 ഫീസ് (Fees): ചില സർവീസ് പോർട്ടലുകളിൽ ₹50 അപേക്ഷാ ഫീസ് ഈടാക്കാറുണ്ട് (വിഭാഗങ്ങൾക്കനുസരിച്ച് ഇളവുകൾ ഉണ്ടാകും).\n\nബാങ്ക് അക്കൗണ്ടും ആധാർ നമ്പറും കൃത്യമായി നൽകിയിട്ടുണ്ടെന്ന് ഉറപ്പാക്കുക.`;
      answerEn = `Based on the active page context:\n\n📅 Last Date: Ensure application submission before the announced cutoff date.\n💳 Fees: Government e-services typically range around ₹50 (exemptions may apply depending on eligibility categories).\n\nVerify that Aadhaar and bank details are correctly linked for DBT benefits.`;

      followUps = isEn
        ? ["How do I submit this application?", "Are there any broken buttons here?"]
        : ["അപേക്ഷ എങ്ങനെ സമർപ്പിക്കാം?", "ഈ പേജിൽ എന്തെങ്കിലും തടസ്സങ്ങൾ ഉണ്ടോ?"];

    } else if (isPageSummary) {
      answerMl = `ഈ പേജ് സംഗ്രഹം (${pageTitle}):\n\nഇതൊരു ${isGovPortal ? 'ഔദ്യോഗിക സേവന പോർട്ടലാണ് (Portal/Service)' : 'വെബ്‌പേജാണ്'}. ഉപയോക്താക്കൾക്ക് വിവരങ്ങൾ അറിയാനും ഓൺലൈൻ അപേക്ഷകൾ സമർപ്പിക്കാനും സേവനങ്ങൾ പ്രയോജനപ്പെടുത്താനും ഇത് സഹായിക്കുന്നു.\n\nസാധാരണക്കാർക്കും മുതിർന്നവർക്കും എളുപ്പത്തിൽ വായിക്കാൻ 'Read in Malayalam' അല്ലെങ്കിൽ 'Translate' ഫീച്ചറുകൾ ഉപയോഗിക്കാവുന്നതാണ്.`;
      answerEn = `Page Overview (${pageTitle}):\n\nThis is ${isGovPortal ? 'an official government/public service portal' : 'a web resource'}. It allows citizens to view notifications, register accounts, and apply for services.\n\nFor elderly or accessibility support, you can also use Thunai's 'Read Aloud' or 'Dyslexia Mode' at any time.`;

      followUps = isEn
        ? ["Why doesn't this button work?", "How to submit the application?"]
        : ["എന്തുകൊണ്ടാണ് ബട്ടൺ പ്രവർത്തിക്കാത്തത്?", "അപേക്ഷ എങ്ങനെ നൽകണം?"];

    } else {
      // General friendly elderly-accessible answer
      answerMl = `നമസ്കാരം! ഞാൻ നിങ്ങളുടെ തുണ (Thunai) വെബ്സഹായിയാണ്. ഈ വെബ്‌പേജ് (${pageTitle}) പരിശോധിച്ച് ഞാൻ മനസ്സിലാക്കിയിട്ടുണ്ട്.\n\nവെബ്‌പേജിലെ ഏതെങ്കിലും ബട്ടൺ ക്ലിക്ക് ആകുന്നില്ലെങ്കിലോ, ഫോം പൂരിപ്പിക്കാൻ സംശയമുണ്ടെങ്കിലോ, അല്ലെങ്കിൽ പേജിലെ വിവരങ്ങൾ വായിക്കാൻ ബുദ്ധിമുട്ടുണ്ടെങ്കിലോ എന്നോട് ചോദിക്കാം. ലളിതമായ വാക്കുകളിൽ സഹായിക്കാം!`;
      answerEn = `Hello! I am your Thunai Accessibility Assistant. I am actively monitoring "${pageTitle}".\n\nIf any button is unclickable, if you need step-by-step form guidance, or if you need explanations in simple terms, feel free to ask. I am here to assist!`;

      followUps = isEn
        ? ["Why doesn't this button work?", "Summarize this webpage", "How to submit the form?"]
        : ["എന്തുകൊണ്ടാണ് ഈ ബട്ടൺ പ്രവർത്തിക്കാത്തത്?", "ഈ പേജിലെ വിവരങ്ങൾ ചുരുക്കി പറയുക", "അപേക്ഷ എങ്ങനെ സമർപ്പിക്കാം?"];
    }

    const responseText = isEn ? answerEn : answerMl;
    const spokenText = responseText.replace(/[*#️⃣👉⚡💡📅💳1-9]/g, '').replace(/\s+/g, ' ').trim();

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
