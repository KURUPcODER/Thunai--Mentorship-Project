/**
 * Diagnostics & Explainability AI Component (View: 'diagnostics')
 * "Why Doesn't This Work? (എന്തുകൊണ്ട് പ്രവർത്തിക്കുന്നില്ല?)"
 * Features:
 * 1. Live Webpage Element Inspector with Pointing Spotlight & Arrow on the active webpage.
 * 2. Deep Explainability AI translating web barriers into compassionate, plain Malayalam & English.
 * 3. Context-Aware Bilingual AI Chatbot with page analysis, elderly text zoom, and TTS speech.
 * 4. Cross-platform universal compatibility (Chrome, Firefox, Edge, Safari, Kiwi, Orion, Android, iOS).
 */

import { getT } from '../i18n.js';
import { diagnosticsService } from '../../services/diagnosticsService.js';
import { ttsService } from '../../services/ttsService.js';
import { scanPage } from '../../services/scanService.js';

export function renderDiagnosticsView(container, state, setState, onNavigate) {
  const currentLang = state.currentLang || 'ml';
  const t = getT(currentLang);
  const isEn = currentLang === 'en';

  // Sub-tab: 'inspector' or 'chatbot'
  let activeSubTab = state.diagnosticsSubTab || 'inspector';
  let isDiagnosing = state.isDiagnosing || false;
  let hasDiagnosed = state.hasDiagnosed || true;
  let isPickingElement = false;
  let activeInspectedItem = state.currentInspectedElement || null;
  let isSpeaking = false;
  let chatTextZoom = state.chatTextZoom || 100; // 100%, 120%, 140%

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
    brokenCount: state.scanReport?.brokenElements?.length || 3
  };

  // Chat conversation history
  let chatMessages = state.chatMessages || [
    {
      sender: 'assistant',
      textMl: `നമസ്കാരം! ഞാൻ നിങ്ങളുടെ തുണ (Thunai) വെബ്സഹായിയാണ്. നിലവിൽ "${activePageTitle}" എന്ന പേജിലെ വിവരങ്ങളും തടസ്സങ്ങളും ഞാൻ നിരീക്ഷിക്കുന്നുണ്ട്.\n\nഏതെങ്കിലും ബട്ടൺ ക്ലിക്ക് ചെയ്യാനാകുന്നില്ലെങ്കിലോ, ഫോം പൂരിപ്പിക്കാൻ സഹായം വേണമെങ്കിലോ എന്നോട് ചോദിക്കാം.`,
      textEn: `Hello! I am your Thunai Web Assistant. I am actively analyzing "${activePageTitle}".\n\nIf any button is not working, or if you need step-by-step help filling forms on this page, please ask!`,
      timestamp: Date.now()
    }
  ];

  // Retrieved barriers from diagnosticsService
  let barriers = [];

  async function loadBarriers() {
    barriers = await diagnosticsService.getPageBarriers(state.scanReport);
    if (!activeInspectedItem && barriers.length > 0) {
      activeInspectedItem = barriers[0];
    }
    render();
  }

  // Cross-Platform Global Element Picked Listener
  if (typeof window !== 'undefined') {
    window.ThunaiOnElementPicked = (pickedDiag) => {
      if (pickedDiag) {
        activeInspectedItem = pickedDiag;
        // Prepend to barriers if not already present
        const exists = barriers.find(b => b.selector === pickedDiag.selector);
        if (!exists) {
          barriers.unshift(pickedDiag);
        }
        activeSubTab = 'inspector';
        render();
      }
    };
  }

  // Listen for runtime messages in extension mode
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

    // Add user message
    chatMessages.push({
      sender: 'user',
      text: userQuery.trim(),
      timestamp: Date.now()
    });
    setState({ chatMessages: chatMessages });
    render();

    // Scroll to bottom of chat feed
    setTimeout(() => {
      const feed = container.querySelector('#diag-chat-feed');
      if (feed) feed.scrollTop = feed.scrollHeight;
    }, 50);

    // Call Diagnostics AI Chatbot
    const botResponse = await diagnosticsService.askChatbot({
      query: userQuery,
      pageContext: pageContext,
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
        
        <!-- Header Strip with Universal Cross-Platform Badge -->
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

        <!-- Mode Switcher Navigation (Inspector vs Chatbot) -->
        <nav class="diag-subtab-nav" role="tablist" aria-label="Diagnostics Sub-navigation">
          <button class="diag-subtab-btn ${activeSubTab === 'inspector' ? 'active' : ''}" id="btn-subtab-inspect" role="tab" aria-selected="${activeSubTab === 'inspector'}">
            <span class="subtab-icon">🔍</span>
            <span class="subtab-title">${t.diagTabInspect}</span>
            ${barriers.length > 0 ? `<span class="subtab-badge">${barriers.length}</span>` : ''}
          </button>
          
          <button class="diag-subtab-btn ${activeSubTab === 'chatbot' ? 'active' : ''}" id="btn-subtab-chat" role="tab" aria-selected="${activeSubTab === 'chatbot'}">
            <span class="subtab-icon">💬</span>
            <span class="subtab-title">${t.diagTabChat}</span>
            <span class="subtab-badge-ai">AI</span>
          </button>
        </nav>

        <!-- SUB-VIEW 1: ELEMENT INSPECTOR & EXPLAINABILITY REASONS -->
        ${activeSubTab === 'inspector' ? `
          <div class="diag-tab-content animate-fade-in" id="diag-subtab-panel-inspect">
            
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
            <div class="diag-findings-container">
              <div class="findings-header-strip">
                <span class="findings-count-pill">${barriers.length} ${t.diagFound}</span>
                <button class="btn-recheck-diag" id="btn-recheck-diag" title="Re-check page">
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

          </div>
        ` : `
          <!-- SUB-VIEW 2: CONTEXT-AWARE WEBPAGE AI CHATBOT -->
          <div class="diag-tab-content animate-fade-in" id="diag-subtab-panel-chat">
            
            <!-- Chat Header & Elderly Text Zoom Controls -->
            <div class="chat-controls-bar">
              <div class="chat-context-info">
                <span class="chat-assistant-avatar">🤖</span>
                <div class="chat-assistant-meta">
                  <span class="chat-assistant-name">${t.chatHeading}</span>
                  <span class="chat-assistant-sub">${isEn ? 'Aware of current webpage content' : 'ഈ പേജ് പഠിച്ച സഹായി'}</span>
                </div>
              </div>

              <!-- Text Zoom Controls for Elderly Users -->
              <div class="chat-zoom-controls" title="Elderly Text Size Adjustment">
                <span class="zoom-label">${t.chatZoomLabel}</span>
                <button class="btn-zoom ${chatTextZoom === 100 ? 'zoom-active' : ''}" data-zoom="100">A</button>
                <button class="btn-zoom ${chatTextZoom === 125 ? 'zoom-active' : ''}" data-zoom="125">A+</button>
                <button class="btn-zoom ${chatTextZoom === 150 ? 'zoom-active' : ''}" data-zoom="150">A++</button>
              </div>
            </div>

            <!-- Quick Question Chips for Easy 1-Click Questions -->
            <div class="chat-quick-chips-wrapper">
              <span class="quick-chips-title">${t.chatQuickPrompts}</span>
              <div class="quick-chips-scroll">
                <button class="chat-chip-btn" data-query="${isEn ? t.chatQuickChip1 : 'ഈ ബട്ടൺ എന്തുകൊണ്ട് ക്ലിക്ക് ആകുന്നില്ല?'}">
                  <span>❓</span> ${isEn ? t.chatQuickChip1 : 'ഈ ബട്ടൺ എന്തുകൊണ്ട് പ്രവർത്തിക്കുന്നില്ല?'}
                </button>
                <button class="chat-chip-btn" data-query="${isEn ? t.chatQuickChip2 : 'ഈ ഫോം എങ്ങനെ പൂരിപ്പിക്കണം?'}">
                  <span>📝</span> ${isEn ? t.chatQuickChip2 : 'ഫോം എങ്ങനെ പൂരിപ്പിക്കണം?'}
                </button>
                <button class="chat-chip-btn" data-query="${isEn ? t.chatQuickChip3 : 'ഈ പേജിലെ വിവരങ്ങൾ ചുരുക്കി പറയുക'}">
                  <span>📄</span> ${isEn ? t.chatQuickChip3 : 'പേജിലെ വിവരങ്ങൾ ചുരുക്കി പറയുക'}
                </button>
                <button class="chat-chip-btn" data-query="${isEn ? t.chatQuickChip4 : 'അപേക്ഷാ ഫീസോ അവസാന തീയതിയോ ഉണ്ടോ?'}">
                  <span>📅</span> ${isEn ? t.chatQuickChip4 : 'ഫീസോ തീയതിയോ ഉണ്ടോ?'}
                </button>
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
        `}

      </div>
    `;

    attachEvents();
  }

  function attachEvents() {
    // 1. Subtab switcher (Inspector vs Chatbot)
    const inspectTabBtn = container.querySelector('#btn-subtab-inspect');
    const chatTabBtn = container.querySelector('#btn-subtab-chat');
    if (inspectTabBtn) {
      inspectTabBtn.addEventListener('click', () => {
        activeSubTab = 'inspector';
        setState({ diagnosticsSubTab: 'inspector' });
        render();
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

    // 4. Point on Page from Cards
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

    // 8. Re-Check Page Button
    const recheckBtn = container.querySelector('#btn-recheck-diag');
    if (recheckBtn) {
      recheckBtn.addEventListener('click', async () => {
        recheckBtn.classList.add('spinning');
        const newReport = await scanPage();
        setState({ scanReport: newReport });
        await loadBarriers();
      });
    }

    // 9. Switch to Chatbot with Focus
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

    // 10. Chat Zoom Controls for Elderly Users
    container.querySelectorAll('.btn-zoom').forEach(btn => {
      btn.addEventListener('click', () => {
        const zoom = parseInt(btn.getAttribute('data-zoom'), 10);
        chatTextZoom = zoom;
        setState({ chatTextZoom: zoom });
        render();
      });
    });

    // 11. Quick Question Chips
    container.querySelectorAll('.chat-chip-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const query = btn.getAttribute('data-query');
        handleChatSubmit(query);
      });
    });

    // 12. Chat Form Submit
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

    // 13. Read Aloud on Chat Messages
    container.querySelectorAll('.btn-msg-listen').forEach(btn => {
      btn.addEventListener('click', () => {
        const text = btn.getAttribute('data-text');
        handleSpeak(text);
      });
    });

    // 14. Action buttons inside Assistant chat messages
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
        }
      });
    });
  }

  // Initial load
  loadBarriers();
}
