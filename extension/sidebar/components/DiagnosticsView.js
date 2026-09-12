/**
 * Diagnostics & Explainability AI Component (View: 'diagnostics')
 * "Why Doesn't This Work? (എന്തുകൊണ്ട് പ്രവർത്തിക്കുന്നില്ല?)"
 * Features:
 * 1. Auto-Scan on Webpage Opened: Audits current page live and returns if any problems exist.
 *    If no issues exist, prominently returns "No Problem Exists (പ്രശ്നങ്ങളൊന്നും കണ്ടെത്തിയില്ല)".
 * 2. Option to Scan Webpage (🔍 സ്കാൻ ചെയ്യുക): Interactive live barrier scan with in-page pointing spotlight.
 * 3. Option to Retrieve Contents (📄 ഉള്ളടക്കം എടുക്കുക): Structured extraction of page text, headings, forms & stats with TTS audio.
 * 4. Option to Check & Diagnose Buttons (🔘 ബട്ടണുകൾ പരിശോധിക്കുക): Comprehensive health audit of every button on the page.
 * 5. Webpage-Aware Bilingual AI Chatbot: Answers questions in Malayalam & English with elderly zoom.
 */

import { getT } from '../i18n.js';
import { diagnosticsService } from '../../services/diagnosticsService.js';
import { ttsService } from '../../services/ttsService.js';
import { scanPage } from '../../services/scanService.js';

export function renderDiagnosticsView(container, state, setState, onNavigate) {
  const currentLang = state.currentLang || 'ml';
  const t = getT(currentLang);
  const isEn = currentLang === 'en';

  // Sub-tabs: 'inspector' (Scan), 'contents' (Retrieve), 'buttons' (Diagnose Buttons), 'chatbot' (AI Assistant)
  let activeSubTab = state.diagnosticsSubTab || 'inspector';
  let isPickingElement = false;
  let activeInspectedItem = state.currentInspectedElement || null;
  let isSpeaking = false;
  let isCopied = false;
  let chatTextZoom = state.chatTextZoom || 100; // 100%, 125%, 150%

  // Active Webpage Context
  const activePageTitle = (typeof document !== 'undefined' && window.parent && window.parent.document && window.parent.document.title)
    ? window.parent.document.title
    : (state.scanReport?.meta?.title || 'Active Webpage');
  const activePageUrl = (typeof window !== 'undefined' && window.parent && window.parent.location)
    ? window.parent.location.href
    : (state.scanReport?.url || 'https://kerala.gov.in');

  const pageContext = {
    title: activePageTitle,
    url: activePageUrl,
    wordCount: state.scanReport?.meta?.wordCount || 380,
    brokenCount: state.scanReport?.brokenElements?.length || 0
  };

  // State caches
  let barriers = [];
  let isScanningPage = false;
  let pageContent = state.diagPageContent || null;
  let isLoadingContent = false;
  let buttonAudit = state.diagButtonAudit || null;
  let isLoadingButtons = false;

  // Chat conversation history
  let chatMessages = state.chatMessages || [
    {
      sender: 'assistant',
      textMl: `നമസ്കാരം! ഞാൻ നിങ്ങളുടെ തുണ (Thunai) വെബ്സഹായിയാണ്. നിലവിൽ "${activePageTitle}" എന്ന പേജിലെ വിവരങ്ങളും തടസ്സങ്ങളും ഞാൻ നിരീക്ഷിക്കുന്നുണ്ട്.\n\nഏതെങ്കിലും ബട്ടൺ ക്ലിക്ക് ചെയ്യാനാകുന്നില്ലെങ്കിലോ, ഫോം പൂരിപ്പിക്കാൻ സഹായം വേണമെങ്കിലോ എന്നോട് ചോദിക്കാം.`,
      textEn: `Hello! I am your Thunai Web Assistant. I am actively analyzing "${activePageTitle}".\n\nIf any button is not working, or if you need step-by-step help filling forms on this page, please ask!`,
      timestamp: Date.now()
    }
  ];

  // 1. Comprehensive Live Functionality & Barrier Scanner
  async function loadBarriers() {
    isScanningPage = true;
    render();
    try {
      const scanRes = await diagnosticsService.scanPageFunctionalities();
      if (scanRes && Array.isArray(scanRes.barriers)) {
        barriers = scanRes.barriers;
        buttonAudit = {
          success: true,
          totalButtons: scanRes.buttonStats.totalButtons,
          brokenCount: scanRes.buttonStats.brokenCount,
          workingCount: scanRes.buttonStats.workingCount,
          hasIssues: scanRes.hasMisfunctionalities,
          buttons: scanRes.barriers
        };
      } else {
        barriers = await diagnosticsService.getPageBarriers(state.scanReport);
      }
    } catch (e) {
      console.warn("Scan page notice:", e);
      barriers = await diagnosticsService.getPageBarriers(state.scanReport);
    }
    isScanningPage = false;
    if (barriers.length === 0) {
      activeInspectedItem = null;
    } else if (!activeInspectedItem) {
      activeInspectedItem = barriers[0];
    }
    render();
  }

  // 2. Retrieve Page Contents
  async function loadContents() {
    isLoadingContent = true;
    render();
    pageContent = await diagnosticsService.retrievePageContents();
    isLoadingContent = false;
    setState({ diagPageContent: pageContent });
    render();
  }

  // 3. Audit All Buttons on Page
  async function loadButtonAudit() {
    isLoadingButtons = true;
    render();
    buttonAudit = await diagnosticsService.auditPageButtons();
    isLoadingButtons = false;
    setState({ diagButtonAudit: buttonAudit });
    render();
  }

  // Cross-Platform Global Element Picked Listener
  if (typeof window !== 'undefined') {
    window.ThunaiOnElementPicked = (pickedDiag) => {
      if (pickedDiag) {
        activeInspectedItem = pickedDiag;
        const exists = barriers.find(b => b.selector === pickedDiag.selector);
        if (!exists) {
          barriers.unshift(pickedDiag);
        }
        activeSubTab = 'inspector';
        render();
      }
    };
  }

  // Runtime message listener for picked elements
  if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
    try {
      chrome.runtime.onMessage.addListener((msg) => {
        if (msg.action === 'ELEMENT_PICKED_DIAGNOSIS' && msg.elementInfo) {
          window.ThunaiOnElementPicked(msg.elementInfo);
        }
      });
    } catch(e) {}
  }

  function handleSpeak(text) {
    if (isSpeaking) {
      ttsService.stopCustomText();
      isSpeaking = false;
      render();
      return;
    }

    isSpeaking = true;
    render();
    const langCode = isEn ? 'en-IN' : 'ml-IN';
    ttsService.speakCustomText(text, langCode, () => {
      isSpeaking = false;
      render();
    });
  }

  async function handleChatSubmit(userQuery) {
    if (!userQuery || !userQuery.trim()) return;

    chatMessages.push({
      sender: 'user',
      text: userQuery.trim(),
      timestamp: Date.now()
    });
    setState({ chatMessages: chatMessages });
    render();

    setTimeout(() => {
      const feed = container.querySelector('#diag-chat-feed');
      if (feed) feed.scrollTop = feed.scrollHeight;
    }, 50);

    const chatContext = {
      ...pageContext,
      barriers: barriers,
      buttonStats: buttonAudit || { totalButtons: 8, brokenCount: barriers.length, workingCount: Math.max(0, 8 - barriers.length) },
      totalButtons: buttonAudit?.totalButtons || 8
    };

    const botResponse = await diagnosticsService.askChatbot({
      query: userQuery,
      pageContext: chatContext,
      activeElement: activeInspectedItem,
      lang: currentLang
    });

    chatMessages.push({
      sender: 'assistant',
      textMl: botResponse.textMl,
      textEn: botResponse.textEn,
      text: botResponse.text,
      spokenText: botResponse.spokenText,
      suggestedActions: botResponse.suggestedActions,
      followUps: botResponse.followUps,
      timestamp: Date.now()
    });
    setState({ chatMessages: chatMessages });
    render();

    setTimeout(() => {
      const feed = container.querySelector('#diag-chat-feed');
      if (feed) feed.scrollTop = feed.scrollHeight;
    }, 50);
  }

  function render() {
    container.innerHTML = `
      <div class="view-panel diagnostics-master-view animate-fade-in" id="panel-diagnostics" role="region" aria-label="Why Doesn't This Work Explainability Diagnostics">
        
        <!-- Top Header Strip with Universal Engine Badge -->
        <header class="diag-header-box">
          <div class="diag-header-top-row">
            <div class="diag-badge-pill">
              <span class="diag-icon">🛠️</span>
              <span>EXPLAINABILITY AI</span>
            </div>
            <span class="diag-platform-pill" title="${t.diagPlatformBadge}">🌐 Universal Engine</span>
          </div>

          <h2 class="view-heading-ml">${t.diagTitle}</h2>
          <p class="view-subheading-en">${t.diagSub}</p>

          <!-- Active Page Context Pill -->
          <div class="diag-page-context-bar" title="${activePageUrl}">
            <span class="diag-pulse-dot"></span>
            <span class="diag-context-label">${isEn ? 'Auditing:' : 'പേജ്:'}</span>
            <span class="diag-context-title">${activePageTitle}</span>
          </div>
        </header>

        <!-- Hero Primary "Scan Webpage" Action Button -->
        <div class="diag-scan-hero-strip">
          <button class="btn-scan-webpage-hero ${isScanningPage ? 'is-scanning' : ''}" id="btn-hero-scan-webpage" aria-label="${t.scanWebpageHero}">
            <div class="hero-scan-left">
              <div class="hero-scan-icon-bubble">
                <svg class="scan-radar-svg ${isScanningPage ? 'anim-radar-spin' : ''}" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <path d="M12 2a10 10 0 0 1 10 10"></path>
                  <circle cx="12" cy="12" r="4"></circle>
                </svg>
              </div>
              <div class="hero-scan-copy">
                <span class="hero-scan-title">${t.scanWebpageHero}</span>
                <span class="hero-scan-sub">${isScanningPage ? t.scanInProgress : t.scanWebpageHeroSub}</span>
              </div>
            </div>
            <div class="hero-scan-badge-cta">
              <span>${isScanningPage ? (isEn ? 'Scanning...' : 'സ്കാൻ ചെയ്യുന്നു...') : (isEn ? 'Scan Webpage' : 'സ്കാൻ ചെയ്യുക')}</span>
              <span class="cta-arrow-icon">▶</span>
            </div>
          </button>
        </div>

        <!-- 4 Core Navigation Options: Scan Webpage, Retrieve Contents, Diagnose Buttons, AI Chatbot -->
        <nav class="diag-subtab-nav" role="tablist" aria-label="Diagnostics Core Options">
          <button class="diag-subtab-btn ${activeSubTab === 'inspector' ? 'active' : ''}" id="btn-subtab-inspect" role="tab" aria-selected="${activeSubTab === 'inspector'}" title="${t.diagOptScanSub}">
            <span class="subtab-icon">🔍</span>
            <span class="subtab-title">${t.diagOptScan}</span>
            ${barriers.length > 0 ? `<span class="subtab-badge">${barriers.length}</span>` : `<span class="subtab-badge-clean" title="${t.everythingFunctionsProperlyTitle}">✓</span>`}
          </button>

          <button class="diag-subtab-btn ${activeSubTab === 'contents' ? 'active' : ''}" id="btn-subtab-contents" role="tab" aria-selected="${activeSubTab === 'contents'}" title="${t.diagOptContentsSub}">
            <span class="subtab-icon">📄</span>
            <span class="subtab-title">${t.diagOptContents}</span>
          </button>

          <button class="diag-subtab-btn ${activeSubTab === 'buttons' ? 'active' : ''}" id="btn-subtab-buttons" role="tab" aria-selected="${activeSubTab === 'buttons'}" title="${t.diagOptButtonsSub}">
            <span class="subtab-icon">🔘</span>
            <span class="subtab-title">${t.diagOptButtons}</span>
            ${buttonAudit && buttonAudit.brokenCount > 0 ? `<span class="subtab-badge">${buttonAudit.brokenCount}</span>` : (buttonAudit ? `<span class="subtab-badge-clean">✓</span>` : '')}
          </button>
          
          <button class="diag-subtab-btn ${activeSubTab === 'chatbot' ? 'active' : ''}" id="btn-subtab-chat" role="tab" aria-selected="${activeSubTab === 'chatbot'}" title="${t.diagOptChatSub}">
            <span class="subtab-icon">💬</span>
            <span class="subtab-title">${t.diagOptChat}</span>
            <span class="subtab-badge-ai">AI</span>
          </button>
        </nav>

        <!-- SUB-VIEW 1: SCAN WEBPAGE & EXPLAINABILITY BARRIERS -->
        ${activeSubTab === 'inspector' ? `
          <div class="diag-tab-content animate-fade-in" id="diag-subtab-panel-inspect">
            
            ${isScanningPage ? `
              <div class="diag-loading-state">
                <div class="diag-spinner-circle"></div>
                <p class="diag-loading-text">${t.scanInProgress}</p>
              </div>
            ` : (barriers.length === 0 && !activeInspectedItem ? `
              <!-- CLEAN EVERYTHING FUNCTIONS PROPERLY STATE -->
              <div class="diag-no-issues-panel everything-functions-properly-card animate-fade-in" id="diag-no-issues-card">
                <div class="no-issues-badge-icon">
                  <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" fill="#ECFDF5"></path>
                    <polyline points="9 12 11 14 15 10"></polyline>
                  </svg>
                </div>

                <div class="everything-working-pill">🟢 100% FUNCTIONAL</div>
                <h3 class="no-issues-title">${t.everythingFunctionsProperlyTitle}</h3>
                <p class="no-issues-desc">${t.everythingFunctionsProperlyDesc}</p>

                <div class="no-issues-checklist">
                  <div class="checklist-row">
                    <span class="checklist-check">✅</span>
                    <span class="checklist-label">${isEn ? 'All buttons and interactive triggers are functioning normally' : 'എല്ലാ ബട്ടണുകളും സജീവവും സാധാരണ രീതിയിൽ പ്രവർത്തിക്കുന്നതുമാണ്'}</span>
                  </div>
                  <div class="checklist-row">
                    <span class="checklist-check">✅</span>
                    <span class="checklist-label">${isEn ? 'Form input fields accessible with zero validation barriers' : 'ഫോം കോളങ്ങൾ പൂർണ്ണമായും ലഭ്യമാണ്'}</span>
                  </div>
                  <div class="checklist-row">
                    <span class="checklist-check">✅</span>
                    <span class="checklist-label">${isEn ? 'No intercepting overlays, modal popups, or dead links' : 'തടസ്സപ്പെടുത്തുന്ന പോപ്പപ്പുകളോ പ്രവർത്തനരഹിതമായ ലിങ്കുകളോ ഇല്ല'}</span>
                  </div>
                </div>

                <!-- Focused Action Buttons -->
                <div class="no-issues-actions-group">
                  <button class="btn-clean-action btn-clean-recheck" id="btn-recheck-clean" title="${t.diagRecheckBtn}">
                    <span class="action-icon">🔄</span>
                    <span>${isEn ? 'Rescan Webpage' : 'വീണ്ടും സ്കാൻ ചെയ്യുക'}</span>
                  </button>
                  <button class="btn-clean-action btn-clean-contents" id="btn-goto-contents-clean" title="${t.diagOptContents}">
                    <span class="action-icon">📄</span>
                    <span>${t.diagOptContents}</span>
                  </button>
                  <button class="btn-clean-action btn-clean-buttons" id="btn-goto-buttons-clean" title="${t.diagOptButtons}">
                    <span class="action-icon">🔘</span>
                    <span>${t.diagOptButtons}</span>
                  </button>
                  <button class="btn-clean-action btn-clean-pick" id="btn-trigger-picker-clean" title="${t.diagNoIssuesPick}">
                    <span class="action-icon">🎯</span>
                    <span>${t.diagNoIssuesPick}</span>
                  </button>
                  <button class="btn-clean-action btn-clean-chat" id="btn-goto-chat-clean" title="${t.diagNoIssuesAsk}">
                    <span class="action-icon">💬</span>
                    <span>${t.diagNoIssuesAsk}</span>
                  </button>
                </div>
              </div>
            ` : `
              <!-- Misfunctionalities Alert Strip when issues exist -->
              ${barriers.length > 0 ? `
                <div class="misfunctionalities-alert-strip">
                  <div class="alert-strip-left">
                    <span class="alert-strip-icon">⚠️</span>
                    <div class="alert-strip-text">
                      <div class="alert-strip-title">${t.misfunctionalitiesFoundTitle} (${barriers.length})</div>
                      <div class="alert-strip-sub">${t.misfunctionalitiesFoundSub}</div>
                    </div>
                  </div>
                  <button class="btn-strip-rescan" id="btn-recheck-alert" title="${t.diagRecheckBtn}">
                    <span>🔄</span>
                    <span>${isEn ? 'Rescan' : 'പുനഃപരിശോധിക്കുക'}</span>
                  </button>
                </div>
              ` : ''}

              <!-- Hero Interactive Pointer Action CTA -->
              <div class="diag-hero-pointer-cta">
                <button class="btn-hero-picker ${isPickingElement ? 'picking-active' : ''}" id="btn-trigger-picker" aria-label="${t.diagPickBtn}">
                  <div class="picker-icon-ring">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                      <circle cx="12" cy="12" r="10"></circle>
                      <circle cx="12" cy="12" r="6"></circle>
                      <line x1="12" y1="2" x2="12" y2="4"></line>
                      <line x1="12" y1="20" x2="12" y2="22"></line>
                      <line x1="2" y1="12" x2="4" y2="12"></line>
                      <line x1="20" y1="12" x2="22" y2="12"></line>
                    </svg>
                  </div>
                  <div class="picker-text-wrap">
                    <div class="picker-title-main">${t.diagPickBtn}</div>
                    <div class="picker-desc-sub">${t.diagPickHelp}</div>
                  </div>
                  <div class="picker-arrow-sign">👉</div>
                </button>
              </div>

              <!-- Active Pointed / Inspected Element Spotlight Card -->
              ${activeInspectedItem ? `
                <div class="diag-active-spotlight-card">
                  <div class="spotlight-header-row">
                    <span class="spotlight-pointer-badge">👉 ${isEn ? 'CURRENT FOCUS' : 'നിലവിലെ ശ്രദ്ധാകേന്ദ്രം'}</span>
                    <span class="severity-pill severity-${(activeInspectedItem.severity || 'serious').toLowerCase()}">${activeInspectedItem.severity || 'SERIOUS'}</span>
                  </div>

                  <div class="spotlight-element-tag">&lt;${activeInspectedItem.tag}&gt; ${activeInspectedItem.text || activeInspectedItem.selector}</div>

                  <div class="spotlight-section-box section-why">
                    <div class="section-label-row">
                      <span class="section-emoji">❓</span>
                      <strong class="section-title">${t.diagWhyTitle}</strong>
                    </div>
                    <p class="section-body-text">${isEn ? (activeInspectedItem.reasonEn || activeInspectedItem.reason) : activeInspectedItem.reason}</p>
                  </div>

                  <div class="spotlight-section-box section-solution">
                    <div class="section-label-row">
                      <span class="section-emoji">💡</span>
                      <strong class="section-title">${t.diagFixTitle}</strong>
                    </div>
                    <div class="section-steps-list">
                      ${(isEn ? (activeInspectedItem.stepsEn || activeInspectedItem.steps) : activeInspectedItem.steps || [activeInspectedItem.solution]).map(step => `
                        <div class="step-item-pill">${step}</div>
                      `).join('')}
                    </div>
                  </div>

                  <!-- Primary Action Buttons for Active Element -->
                  <div class="spotlight-actions-toolbar">
                    <button class="btn-spotlight-action btn-point-on-page" 
                            data-selector="${activeInspectedItem.selector}"
                            data-title="${activeInspectedItem.title}"
                            data-reason="${activeInspectedItem.reason}"
                            data-fix="${activeInspectedItem.solution || activeInspectedItem.fix}">
                      <span class="btn-act-icon">👉</span>
                      <span>${t.diagPointBtn}</span>
                    </button>

                    <button class="btn-spotlight-action btn-listen-explanation"
                            data-text="${isEn ? (activeInspectedItem.reasonEn + '. ' + (activeInspectedItem.stepsEn ? activeInspectedItem.stepsEn.join('. ') : '')) : (activeInspectedItem.reason + '. ' + (activeInspectedItem.steps ? activeInspectedItem.steps.join('. ') : ''))}">
                      <span class="btn-act-icon">${isSpeaking ? '⏹️' : '🔊'}</span>
                      <span>${isSpeaking ? (isEn ? 'Stop' : 'നിർത്തുക') : t.diagListenBtn}</span>
                    </button>

                    ${activeInspectedItem.canAutoFix ? `
                      <button class="btn-spotlight-action btn-autofix-diag" 
                              data-selector="${activeInspectedItem.selector}"
                              data-type="${activeInspectedItem.fixType}">
                        <span class="btn-act-icon">⚡</span>
                        <span>${t.diagAutoFixBtn}</span>
                      </button>
                    ` : ''}

                    <button class="btn-spotlight-action btn-ask-chatbot-focus" 
                            data-title="${activeInspectedItem.text || activeInspectedItem.title}">
                      <span class="btn-act-icon">💬</span>
                      <span>${t.diagAskChatBtn}</span>
                    </button>
                  </div>
                </div>
              ` : ''}

              <!-- All Diagnosed Barriers List -->
              ${barriers.length > 0 ? `
                <div class="diag-findings-container">
                  <div class="findings-header-strip">
                    <span class="findings-count-pill">${barriers.length} ${t.diagFound}</span>
                    <button class="btn-recheck-diag" id="btn-recheck-diag" title="${t.diagRecheckBtn}">
                      <span>🔄</span>
                      <span>${t.diagRecheckBtn}</span>
                    </button>
                  </div>

                  <div class="barriers-cards-grid">
                    ${barriers.map((item, idx) => `
                      <div class="barrier-item-card ${activeInspectedItem && activeInspectedItem.selector === item.selector ? 'item-selected' : ''}" data-idx="${idx}">
                        <div class="barrier-card-top">
                          <span class="severity-mini-badge tag-${item.severity.toLowerCase()}">${item.severity}</span>
                          <span class="barrier-tag-name">&lt;${item.tag}&gt; ${item.selector}</span>
                        </div>

                        <h3 class="barrier-card-title">${isEn ? (item.titleEn || item.title) : item.title}</h3>
                        <p class="barrier-card-snippet">${item.text}</p>
                        <p class="barrier-card-reason">${isEn ? (item.reasonEn || item.reason) : item.reason}</p>

                        <div class="barrier-card-actions-row">
                          <button class="btn-card-point" data-selector="${item.selector}" data-title="${item.title}" data-reason="${item.reason}" data-fix="${item.solution}">
                            <span>👉</span>
                            <span>${t.diagPointBtn}</span>
                          </button>
                          <button class="btn-card-select" data-idx="${idx}">
                            <span>🔍 ${isEn ? 'View Reason' : 'വിശദമായി കാണുക'}</span>
                          </button>
                        </div>
                      </div>
                    `).join('')}
                  </div>
                </div>
              ` : ''}
            `)}

          </div>
        ` : ''}

        <!-- SUB-VIEW 2: RETRIEVE WEBPAGE CONTENTS -->
        ${activeSubTab === 'contents' ? `
          <div class="diag-tab-content animate-fade-in" id="diag-subtab-panel-contents">
            
            ${isLoadingContent ? `
              <div class="diag-loading-state">
                <div class="diag-spinner-circle"></div>
                <p class="diag-loading-text">${isEn ? 'Extracting readable webpage contents...' : 'പേജിലെ വിവരങ്ങൾ ശേഖരിക്കുന്നു...'}</p>
              </div>
            ` : `
              <!-- Content Overview Statistics Card -->
              <div class="content-stats-grid">
                <div class="content-stat-card">
                  <span class="stat-icon">📝</span>
                  <span class="stat-val">${pageContent?.wordCount || 0}</span>
                  <span class="stat-label">${isEn ? 'Words' : 'വാക്കുകൾ'}</span>
                </div>
                <div class="content-stat-card">
                  <span class="stat-icon">⏱️</span>
                  <span class="stat-val">~${pageContent?.readingTimeMinutes || 1}m</span>
                  <span class="stat-label">${isEn ? 'Read Time' : 'വായന'}</span>
                </div>
                <div class="content-stat-card">
                  <span class="stat-icon">📑</span>
                  <span class="stat-val">${pageContent?.stats?.headingsCount || pageContent?.headings?.length || 0}</span>
                  <span class="stat-label">${isEn ? 'Headings' : 'തലക്കെട്ടുകൾ'}</span>
                </div>
                <div class="content-stat-card">
                  <span class="stat-icon">📋</span>
                  <span class="stat-val">${pageContent?.stats?.formsCount || pageContent?.formsSummary?.length || 0}</span>
                  <span class="stat-label">${isEn ? 'Forms' : 'ഫോമുകൾ'}</span>
                </div>
                <div class="content-stat-card">
                  <span class="stat-icon">🔘</span>
                  <span class="stat-val">${pageContent?.stats?.buttonsCount || 0}</span>
                  <span class="stat-label">${isEn ? 'Buttons' : 'ബട്ടണുകൾ'}</span>
                </div>
                <div class="content-stat-card">
                  <span class="stat-icon">🔗</span>
                  <span class="stat-val">${pageContent?.stats?.linksCount || 0}</span>
                  <span class="stat-label">${isEn ? 'Links' : 'ലിങ്കുകൾ'}</span>
                </div>
              </div>

              <!-- Quick Action Toolbar for Retrieved Content -->
              <div class="content-actions-bar">
                <button class="btn-content-action btn-content-read" id="btn-content-read-aloud">
                  <span>${isSpeaking ? '⏹️' : '🔊'}</span>
                  <span>${isSpeaking ? t.contentStopRead : t.contentReadAloud}</span>
                </button>
                <button class="btn-content-action btn-content-copy" id="btn-content-copy-text">
                  <span>${isCopied ? '✓' : '📋'}</span>
                  <span>${isCopied ? t.contentCopied : t.contentCopyBtn}</span>
                </button>
                <button class="btn-content-action btn-content-refresh" id="btn-content-refresh">
                  <span>🔄</span>
                  <span>${isEn ? 'Refresh Content' : 'പുതുക്കുക'}</span>
                </button>
              </div>

              <!-- Section 1: Page Headings Structure -->
              ${(pageContent?.headings && pageContent.headings.length > 0) ? `
                <div class="content-section-box">
                  <div class="section-box-header">
                    <span class="section-box-icon">📑</span>
                    <h4 class="section-box-title">${t.contentHeadings}</h4>
                  </div>
                  <div class="headings-chips-list">
                    ${pageContent.headings.map(h => `
                      <div class="heading-chip-item tag-${h.tag.toLowerCase()}">
                        <span class="heading-tag-pill">${h.tag}</span>
                        <span class="heading-text-val">${h.text}</span>
                      </div>
                    `).join('')}
                  </div>
                </div>
              ` : ''}

              <!-- Section 2: Detected Forms & Inputs Summary -->
              ${(pageContent?.formsSummary && pageContent.formsSummary.length > 0) ? `
                <div class="content-section-box">
                  <div class="section-box-header">
                    <span class="section-box-icon">📋</span>
                    <h4 class="section-box-title">${t.contentForms}</h4>
                  </div>
                  <div class="forms-summary-list">
                    ${pageContent.formsSummary.map((f, fIdx) => `
                      <div class="form-summary-card">
                        <div class="form-summary-top">
                          <span class="form-id-badge">Form #${fIdx + 1}: ${f.id}</span>
                          <span class="form-inputs-count">${f.inputCount} ${isEn ? 'fields' : 'കോളങ്ങൾ'}</span>
                        </div>
                        <div class="form-fields-pills">
                          ${f.inputs.map(inp => `<span class="field-pill">${inp}</span>`).join('')}
                          ${f.hasSubmit ? `<span class="field-pill pill-submit">Submit Button</span>` : ''}
                        </div>
                      </div>
                    `).join('')}
                  </div>
                </div>
              ` : ''}

              <!-- Section 3: Extracted Readable Text -->
              <div class="content-section-box">
                <div class="section-box-header">
                  <span class="section-box-icon">📄</span>
                  <h4 class="section-box-title">${t.contentParagraphs}</h4>
                </div>
                <div class="extracted-text-body">
                  ${(pageContent?.keyParagraphs && pageContent.keyParagraphs.length > 0) 
                    ? pageContent.keyParagraphs.map((p, idx) => `<p class="extracted-para">${idx + 1}. ${p}</p>`).join('')
                    : `<p class="extracted-para">${pageContent?.fullText || (isEn ? 'No readable paragraphs detected.' : 'വായിക്കാവുന്ന ഉള്ളടക്കമില്ല.')}</p>`
                  }
                </div>
              </div>
            `}

          </div>
        ` : ''}

        <!-- SUB-VIEW 3: CHECK AND DIAGNOSE BUTTONS -->
        ${activeSubTab === 'buttons' ? `
          <div class="diag-tab-content animate-fade-in" id="diag-subtab-panel-buttons">
            
            ${isLoadingButtons ? `
              <div class="diag-loading-state">
                <div class="diag-spinner-circle"></div>
                <p class="diag-loading-text">${isEn ? 'Auditing all webpage buttons & action triggers...' : 'പേജിലെ എല്ലാ ബട്ടണുകളും പരിശോധിക്കുന്നു...'}</p>
              </div>
            ` : `
              <!-- Button Audit Overview Strip -->
              <div class="btn-audit-summary-strip">
                <div class="audit-summary-stat">
                  <span class="stat-num">${buttonAudit?.totalButtons || 0}</span>
                  <span class="stat-name">${isEn ? 'Total' : 'ആകെ'}</span>
                </div>
                <div class="audit-summary-stat stat-working">
                  <span class="stat-num">${buttonAudit?.workingCount || 0}</span>
                  <span class="stat-name">${isEn ? 'Working' : 'സജീവം'}</span>
                </div>
                <div class="audit-summary-stat stat-broken">
                  <span class="stat-num">${buttonAudit?.brokenCount || 0}</span>
                  <span class="stat-name">${isEn ? 'Barriers' : 'തടസ്സങ്ങൾ'}</span>
                </div>
                <button class="btn-reaudit-action" id="btn-reaudit-buttons" title="Re-Audit Buttons">
                  <span>🔄</span>
                  <span>${isEn ? 'Re-Audit' : 'പുനഃപരിശോധന'}</span>
                </button>
              </div>

              <!-- Success Card if 0 broken buttons -->
              ${buttonAudit && buttonAudit.brokenCount === 0 ? `
                <div class="btn-audit-all-good-card animate-fade-in">
                  <span class="all-good-icon">✅</span>
                  <div class="all-good-text">
                    <strong>${isEn ? 'All Buttons Are Working Normally' : 'എല്ലാ ബട്ടണുകളും ശരിയായി പ്രവർത്തിക്കുന്നു'}</strong>
                    <p>${t.btnAuditAllWorking}</p>
                  </div>
                </div>
              ` : ''}

              <!-- Buttons Cards Grid -->
              <div class="btn-audit-cards-grid">
                ${(buttonAudit?.buttons || []).map((btn, idx) => `
                  <div class="button-audit-card card-status-${btn.status}" data-btn-idx="${idx}">
                    <div class="btn-card-top-row">
                      <span class="btn-status-pill pill-${btn.status}">
                        ${btn.status === 'working' ? '🟢' : '🔴'} ${isEn ? btn.statusTextEn : btn.statusTextMl}
                      </span>
                      <span class="btn-tag-code">&lt;${btn.tag}&gt; ${btn.selector}</span>
                    </div>

                    <h4 class="btn-label-title">"${btn.text}"</h4>

                    <div class="btn-reason-box">
                      <span class="reason-icon">❓</span>
                      <p class="reason-text">${isEn ? btn.reasonEn : btn.reasonMl}</p>
                    </div>

                    <div class="btn-solution-box">
                      <span class="solution-icon">💡</span>
                      <p class="solution-text">${isEn ? btn.fixEn : btn.fixMl}</p>
                    </div>

                    <!-- Action buttons toolbar -->
                    <div class="btn-card-actions-toolbar">
                      <button class="btn-action-trigger btn-point-btn" 
                              data-selector="${btn.selector}" 
                              data-title="${btn.text}" 
                              data-reason="${isEn ? btn.reasonEn : btn.reasonMl}" 
                              data-fix="${isEn ? btn.fixEn : btn.fixMl}">
                        <span>👉</span>
                        <span>${t.diagPointBtn}</span>
                      </button>

                      ${btn.canAutoFix ? `
                        <button class="btn-action-trigger btn-autofix-btn" 
                                data-selector="${btn.selector}" 
                                data-type="${btn.fixType}">
                          <span>⚡</span>
                          <span>${t.diagAutoFixBtn}</span>
                        </button>
                      ` : ''}

                      <button class="btn-action-trigger btn-listen-btn" 
                              data-text="${isEn ? (btn.reasonEn + '. ' + btn.fixEn) : (btn.reasonMl + '. ' + btn.fixMl)}">
                        <span>🔊</span>
                        <span>${t.diagListenBtn}</span>
                      </button>
                    </div>
                  </div>
                `).join('')}
              </div>
            `}

          </div>
        ` : ''}

        <!-- SUB-VIEW 4: CONTEXT-AWARE WEBPAGE AI CHATBOT -->
        ${activeSubTab === 'chatbot' ? `
          <div class="diag-tab-content animate-fade-in" id="diag-subtab-panel-chat">
            
            <!-- Chat Header & Elderly Text Zoom Controls -->
            <div class="chat-controls-bar">
              <div class="chat-context-info">
                <span class="chat-assistant-avatar">🤖</span>
                <div class="chat-assistant-meta">
                  <span class="chat-assistant-name">${t.chatHeading}</span>
                  <span class="chat-assistant-sub ${barriers.length === 0 ? 'status-text-clean' : 'status-text-issues'}">
                    ${barriers.length === 0 ? `🟢 ${t.chatStatusClean}` : `⚠️ ${barriers.length} ${t.chatStatusIssues}`}
                  </span>
                </div>
              </div>

              <!-- Top Actions: Clear Chat & Text Zoom for Elderly Users -->
              <div class="chat-top-actions">
                <button class="btn-clear-chat" id="btn-clear-chat" title="${t.clearChat}">
                  <span>🗑️</span>
                  <span>${t.clearChat}</span>
                </button>
                <div class="chat-zoom-controls" title="Elderly Text Size Adjustment">
                  <span class="zoom-label">${t.chatZoomLabel}</span>
                  <button class="btn-zoom ${chatTextZoom === 100 ? 'zoom-active' : ''}" data-zoom="100">A</button>
                  <button class="btn-zoom ${chatTextZoom === 125 ? 'zoom-active' : ''}" data-zoom="125">A+</button>
                  <button class="btn-zoom ${chatTextZoom === 150 ? 'zoom-active' : ''}" data-zoom="150">A++</button>
                </div>
              </div>
            </div>

            <!-- Quick Question Chips for Easy 1-Click Questions (Dynamic) -->
            <div class="chat-quick-chips-wrapper">
              <span class="quick-chips-title">${t.chatQuickPrompts}</span>
              <div class="quick-chips-scroll">
                ${barriers.length > 0 ? `
                  <button class="chat-chip-btn" data-query="${isEn ? "Why doesn't this button click?" : 'ഈ ബട്ടൺ എന്തുകൊണ്ട് പ്രവർത്തിക്കുന്നില്ല?'}">
                    <span>⚠️</span> ${isEn ? "Why doesn't this button work?" : 'ഈ ബട്ടൺ എന്തുകൊണ്ട് പ്രവർത്തിക്കുന്നില്ല?'}
                  </button>
                  <button class="chat-chip-btn" data-query="${isEn ? "How to fix the issues on this page?" : 'തകരാർ എങ്ങനെ പരിഹരിക്കാം?'}">
                    <span>⚡</span> ${isEn ? 'How to fix the issues?' : 'തകരാർ എങ്ങനെ പരിഹരിക്കാം?'}
                  </button>
                  <button class="chat-chip-btn" data-query="${isEn ? "How to submit this form?" : 'ഈ ഫോം എങ്ങനെ പൂരിപ്പിക്കണം?'}">
                    <span>📝</span> ${isEn ? 'How to submit form?' : 'ഫോം എങ്ങനെ പൂരിപ്പിക്കണം?'}
                  </button>
                  <button class="chat-chip-btn" data-query="${isEn ? "Summarize this webpage" : 'ഈ പേജിലെ വിവരങ്ങൾ ചുരുക്കി പറയുക'}">
                    <span>📄</span> ${isEn ? 'Summarize webpage' : 'പേജിലെ വിവരങ്ങൾ പറയുക'}
                  </button>
                ` : `
                  <button class="chat-chip-btn" data-query="${isEn ? "Does everything on this page function properly?" : 'എല്ലാ പ്രവർത്തനങ്ങളും ശരിയായി നടക്കുന്നുണ്ടോ?'}">
                    <span>✅</span> ${isEn ? 'Does everything work properly?' : 'എല്ലാ പ്രവർത്തനങ്ങളും ശരിയാണോ?'}
                  </button>
                  <button class="chat-chip-btn" data-query="${isEn ? "How to fill and submit this form?" : 'ഈ ഫോം എങ്ങനെ പൂരിപ്പിക്കണം?'}">
                    <span>📝</span> ${isEn ? 'How to submit form?' : 'ഫോം എങ്ങനെ പൂരിപ്പിക്കണം?'}
                  </button>
                  <button class="chat-chip-btn" data-query="${isEn ? "Summarize this webpage" : 'ഈ പേജിലെ വിവരങ്ങൾ ചുരുക്കി പറയുക'}">
                    <span>📄</span> ${isEn ? 'Summarize webpage' : 'പേജിലെ വിവരങ്ങൾ പറയുക'}
                  </button>
                  <button class="chat-chip-btn" data-query="${isEn ? "What are the fees or last date?" : 'അപേക്ഷാ ഫീസോ അവസാന തീയതിയോ ഉണ്ടോ?'}">
                    <span>📅</span> ${isEn ? 'Fees or last date?' : 'ഫീസോ തീയതിയോ ഉണ്ടോ?'}
                  </button>
                `}
              </div>
            </div>

            <!-- Conversational Messages Feed -->
            <div class="chat-messages-feed" id="diag-chat-feed" style="font-size: ${chatTextZoom}%;">
              ${chatMessages.map(msg => `
                <div class="chat-message-row msg-${msg.sender}">
                  ${msg.sender === 'assistant' ? `
                    <div class="msg-avatar-icon">തു</div>
                  ` : ''}
                  
                  <div class="msg-bubble">
                    <div class="msg-bubble-content">
                      ${(msg.text || (isEn ? msg.textEn : msg.textMl) || '').replace(/\n/g, '<br>')}
                    </div>

                    ${msg.sender === 'assistant' ? `
                      <div class="msg-bubble-footer">
                        <button class="btn-msg-listen" data-text="${msg.spokenText || msg.text || (isEn ? msg.textEn : msg.textMl)}">
                          <span>🔊</span>
                          <span>${t.chatVoiceListenBtn}</span>
                        </button>
                        
                        ${(msg.suggestedActions || []).map(act => `
                          <button class="btn-msg-action" 
                                  data-action="${act.action}" 
                                  data-selector="${act.selector || ''}"
                                  data-title="${act.title || ''}"
                                  data-reason="${act.reason || ''}"
                                  data-fix="${act.fix || ''}"
                                  data-type="${act.fixType || ''}">
                            <span>${act.label}</span>
                          </button>
                        `).join('')}
                      </div>
                    ` : ''}
                  </div>
                </div>
              `).join('')}
            </div>

            <!-- Chat Input Bar -->
            <div class="chat-input-container">
              <form class="chat-input-form" id="diag-chat-form">
                <input type="text" 
                       class="chat-text-input" 
                       id="diag-chat-input" 
                       placeholder="${t.chatPlaceholder}" 
                       autocomplete="off">
                <button type="submit" class="btn-chat-send" id="btn-chat-submit" aria-label="${t.chatSend}">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <line x1="22" y1="2" x2="11" y2="13"></line>
                    <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                  </svg>
                  <span>${t.chatSend}</span>
                </button>
              </form>
            </div>

          </div>
        ` : ''}

      </div>
    `;

    attachEvents();
  }

  function attachEvents() {
    // 1. Subtab Switchers
    const inspectTabBtn = container.querySelector('#btn-subtab-inspect');
    const contentsTabBtn = container.querySelector('#btn-subtab-contents');
    const buttonsTabBtn = container.querySelector('#btn-subtab-buttons');
    const chatTabBtn = container.querySelector('#btn-subtab-chat');

    if (inspectTabBtn) {
      inspectTabBtn.addEventListener('click', () => {
        activeSubTab = 'inspector';
        setState({ diagnosticsSubTab: 'inspector' });
        render();
      });
    }
    if (contentsTabBtn) {
      contentsTabBtn.addEventListener('click', () => {
        activeSubTab = 'contents';
        setState({ diagnosticsSubTab: 'contents' });
        if (!pageContent) {
          loadContents();
        } else {
          render();
        }
      });
    }
    if (buttonsTabBtn) {
      buttonsTabBtn.addEventListener('click', () => {
        activeSubTab = 'buttons';
        setState({ diagnosticsSubTab: 'buttons' });
        if (!buttonAudit) {
          loadButtonAudit();
        } else {
          render();
        }
      });
    }
    if (chatTabBtn) {
      chatTabBtn.addEventListener('click', () => {
        activeSubTab = 'chatbot';
        setState({ diagnosticsSubTab: 'chatbot' });
        render();
      });
    }

    // 2. Trigger In-Page Element Picker
    const pickerBtn = container.querySelector('#btn-trigger-picker');
    if (pickerBtn) {
      pickerBtn.addEventListener('click', async () => {
        isPickingElement = true;
        render();
        await diagnosticsService.startInPagePicker();
      });
    }

    // 3. Point on Page from Spotlight Card
    const pointBtn = container.querySelector('.btn-point-on-page');
    if (pointBtn) {
      pointBtn.addEventListener('click', async () => {
        const selector = pointBtn.getAttribute('data-selector');
        const title = pointBtn.getAttribute('data-title');
        const reason = pointBtn.getAttribute('data-reason');
        const fix = pointBtn.getAttribute('data-fix');
        await diagnosticsService.pointToElementOnPage(selector, title, reason, fix);
      });
    }

    // 4. Point on Page from Barriers List
    container.querySelectorAll('.btn-card-point').forEach(btn => {
      btn.addEventListener('click', async () => {
        const selector = btn.getAttribute('data-selector');
        const title = btn.getAttribute('data-title');
        const reason = btn.getAttribute('data-reason');
        const fix = btn.getAttribute('data-fix');
        await diagnosticsService.pointToElementOnPage(selector, title, reason, fix);
      });
    });

    // 5. Select Card for Spotlight
    container.querySelectorAll('.btn-card-select').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.getAttribute('data-idx'), 10);
        if (barriers[idx]) {
          activeInspectedItem = barriers[idx];
          setState({ currentInspectedElement: activeInspectedItem });
          render();
        }
      });
    });

    // 6. Listen Explanation (TTS)
    const listenBtn = container.querySelector('.btn-listen-explanation');
    if (listenBtn) {
      listenBtn.addEventListener('click', () => {
        const text = listenBtn.getAttribute('data-text');
        handleSpeak(text);
      });
    }

    // 7. Auto-Fix Button
    const autoFixBtn = container.querySelector('.btn-autofix-diag');
    if (autoFixBtn) {
      autoFixBtn.addEventListener('click', async () => {
        const selector = autoFixBtn.getAttribute('data-selector');
        const type = autoFixBtn.getAttribute('data-type');
        autoFixBtn.textContent = isEn ? 'Applying Fix...' : 'മാറ്റം വരുത്തുന്നു...';
        await diagnosticsService.executeAutoFix(selector, type);
        setTimeout(() => {
          autoFixBtn.textContent = isEn ? '✓ Fixed' : '✓ മാറ്റം വരുത്തി';
        }, 600);
      });
    }

    // 8. Hero Scan Webpage & Recheck Handlers
    const heroScanBtn = container.querySelector('#btn-hero-scan-webpage');
    if (heroScanBtn) {
      heroScanBtn.addEventListener('click', async () => {
        activeSubTab = 'inspector';
        setState({ diagnosticsSubTab: 'inspector' });
        await loadBarriers();
      });
    }

    const recheckBtn = container.querySelector('#btn-recheck-diag');
    if (recheckBtn) {
      recheckBtn.addEventListener('click', async () => {
        recheckBtn.classList.add('spinning');
        await loadBarriers();
      });
    }

    const alertRecheckBtn = container.querySelector('#btn-recheck-alert');
    if (alertRecheckBtn) {
      alertRecheckBtn.addEventListener('click', async () => {
        alertRecheckBtn.classList.add('spinning');
        await loadBarriers();
      });
    }

    // 8b. Clean No Issues State Action Buttons
    const cleanRecheckBtn = container.querySelector('#btn-recheck-clean');
    if (cleanRecheckBtn) {
      cleanRecheckBtn.addEventListener('click', async () => {
        cleanRecheckBtn.classList.add('spinning');
        await loadBarriers();
      });
    }

    const cleanContentsBtn = container.querySelector('#btn-goto-contents-clean');
    if (cleanContentsBtn) {
      cleanContentsBtn.addEventListener('click', () => {
        activeSubTab = 'contents';
        setState({ diagnosticsSubTab: 'contents' });
        loadContents();
      });
    }

    const cleanButtonsBtn = container.querySelector('#btn-goto-buttons-clean');
    if (cleanButtonsBtn) {
      cleanButtonsBtn.addEventListener('click', () => {
        activeSubTab = 'buttons';
        setState({ diagnosticsSubTab: 'buttons' });
        loadButtonAudit();
      });
    }

    const cleanPickBtn = container.querySelector('#btn-trigger-picker-clean');
    if (cleanPickBtn) {
      cleanPickBtn.addEventListener('click', async () => {
        isPickingElement = true;
        render();
        await diagnosticsService.startInPagePicker();
      });
    }

    const cleanChatBtn = container.querySelector('#btn-goto-chat-clean');
    if (cleanChatBtn) {
      cleanChatBtn.addEventListener('click', () => {
        activeSubTab = 'chatbot';
        setState({ diagnosticsSubTab: 'chatbot' });
        render();
      });
    }

    // 9. Retrieved Contents Actions
    const contentReadBtn = container.querySelector('#btn-content-read-aloud');
    if (contentReadBtn) {
      contentReadBtn.addEventListener('click', () => {
        const textToSpeak = pageContent?.fullText || pageContent?.keyParagraphs?.join('. ') || activePageTitle;
        handleSpeak(textToSpeak);
      });
    }

    const contentCopyBtn = container.querySelector('#btn-content-copy-text');
    if (contentCopyBtn) {
      contentCopyBtn.addEventListener('click', () => {
        const textToCopy = pageContent?.fullText || '';
        navigator.clipboard.writeText(textToCopy).then(() => {
          isCopied = true;
          render();
          setTimeout(() => {
            isCopied = false;
            render();
          }, 2000);
        });
      });
    }

    const contentRefreshBtn = container.querySelector('#btn-content-refresh');
    if (contentRefreshBtn) {
      contentRefreshBtn.addEventListener('click', () => {
        loadContents();
      });
    }

    // 10. Buttons Audit Actions
    const reauditBtn = container.querySelector('#btn-reaudit-buttons');
    if (reauditBtn) {
      reauditBtn.addEventListener('click', () => {
        loadButtonAudit();
      });
    }

    container.querySelectorAll('.btn-point-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const selector = btn.getAttribute('data-selector');
        const title = btn.getAttribute('data-title');
        const reason = btn.getAttribute('data-reason');
        const fix = btn.getAttribute('data-fix');
        await diagnosticsService.pointToElementOnPage(selector, title, reason, fix);
      });
    });

    container.querySelectorAll('.btn-autofix-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const selector = btn.getAttribute('data-selector');
        const type = btn.getAttribute('data-type');
        btn.textContent = isEn ? 'Fixing...' : 'മാറ്റുന്നു...';
        await diagnosticsService.executeAutoFix(selector, type);
        setTimeout(async () => {
          btn.textContent = isEn ? '✓ Fixed' : '✓ ശരിയാക്കി';
          await loadButtonAudit();
        }, 500);
      });
    });

    container.querySelectorAll('.btn-listen-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const text = btn.getAttribute('data-text');
        handleSpeak(text);
      });
    });

    // 11. Switch to Chatbot with Focus
    const askChatFocusBtn = container.querySelector('.btn-ask-chatbot-focus');
    if (askChatFocusBtn) {
      askChatFocusBtn.addEventListener('click', () => {
        activeSubTab = 'chatbot';
        setState({ diagnosticsSubTab: 'chatbot' });
        render();
        const initialQ = isEn
          ? `Why doesn't the button "${activeInspectedItem?.text || 'Submit'}" work?`
          : `എന്തുകൊണ്ടാണ് "${activeInspectedItem?.text || 'ഈ ബട്ടൺ'}" പ്രവർത്തിക്കാത്തത്?`;
        handleChatSubmit(initialQ);
      });
    }

    // 11b. Clear Chat Button
    const clearChatBtn = container.querySelector('#btn-clear-chat');
    if (clearChatBtn) {
      clearChatBtn.addEventListener('click', () => {
        chatMessages = [
          {
            sender: 'assistant',
            textMl: `നമസ്കാരം! ഞാൻ നിങ്ങളുടെ തുണ (Thunai) വെബ്സഹായിയാണ്. "${activePageTitle}" എന്ന പേജ് ഞാൻ വീണ്ടും പരിശോധിക്കാൻ തയ്യാറാണ്. എന്തെങ്കിലും സംശയങ്ങളുണ്ടെങ്കിൽ ചോദിക്കാം!`,
            textEn: `Hello! I am your Thunai Web Assistant. Ready to help you on "${activePageTitle}". Feel free to ask any questions!`,
            timestamp: Date.now()
          }
        ];
        setState({ chatMessages: chatMessages });
        render();
      });
    }

    // 12. Chat Zoom Controls for Elderly Users
    container.querySelectorAll('.btn-zoom').forEach(btn => {
      btn.addEventListener('click', () => {
        const zoom = parseInt(btn.getAttribute('data-zoom'), 10);
        chatTextZoom = zoom;
        setState({ chatTextZoom: zoom });
        render();
      });
    });

    // 13. Quick Question Chips
    container.querySelectorAll('.chat-chip-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const query = btn.getAttribute('data-query');
        handleChatSubmit(query);
      });
    });

    // 14. Chat Form Submit
    const chatForm = container.querySelector('#diag-chat-form');
    if (chatForm) {
      chatForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const input = container.querySelector('#diag-chat-input');
        if (input && input.value.trim()) {
          const val = input.value.trim();
          input.value = '';
          handleChatSubmit(val);
        }
      });
    }

    // 15. Read Aloud on Chat Messages
    container.querySelectorAll('.btn-msg-listen').forEach(btn => {
      btn.addEventListener('click', () => {
        const text = btn.getAttribute('data-text');
        handleSpeak(text);
      });
    });

    // 16. Action buttons inside Assistant chat messages
    container.querySelectorAll('.btn-msg-action').forEach(btn => {
      btn.addEventListener('click', async () => {
        const action = btn.getAttribute('data-action');
        if (action === 'POINT_TO_ELEMENT') {
          const selector = btn.getAttribute('data-selector');
          const title = btn.getAttribute('data-title');
          const reason = btn.getAttribute('data-reason');
          const fix = btn.getAttribute('data-fix');
          await diagnosticsService.pointToElementOnPage(selector, title, reason, fix);
        } else if (action === 'EXECUTE_AUTO_FIX') {
          const selector = btn.getAttribute('data-selector');
          const type = btn.getAttribute('data-type');
          await diagnosticsService.executeAutoFix(selector, type);
        } else if (action === 'NAVIGATE_SUBTAB') {
          const sub = btn.getAttribute('data-subtab') || 'inspector';
          activeSubTab = sub;
          setState({ diagnosticsSubTab: sub });
          if (sub === 'contents' && !pageContent) loadContents();
          else if (sub === 'buttons' && !buttonAudit) loadButtonAudit();
          else render();
        }
      });
    });
  }

  // Initial load: Automatically audit active webpage live
  loadBarriers();
}
