/**
 * Thunai - Why Doesn't This Work?
 * Three focused tools:
 * 1) Webpage Checker
 * 2) Button Diagnoser
 * 3) Website Content Chatbot
 *
 * All tools operate on the CURRENT active tab and provide English + Malayalam.
 */
import { diagnosticsService } from '../../services/diagnosticsService.js';
import { ttsService } from '../../services/ttsService.js';

export function renderDiagnosticsView(container, state, setState, onNavigate) {
  let activeTool = state.diagnosticsSubTab === 'buttons' ? 'buttons'
    : state.diagnosticsSubTab === 'chatbot' ? 'chatbot' : 'checker';
  let checkerResult = state.diagCheckerResult || null;
  let buttonAudit = state.diagButtonAudit || null;
  let pageContent = state.diagPageContent || null;
  let chatMessages = Array.isArray(state.chatMessages) ? state.chatMessages : [];
  let busy = { checker: false, buttons: false, chat: false, content: false };

  const esc = (value) => String(value ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
  const nl = (value) => esc(value).replace(/\n/g, '<br>');

  function setTool(tool) {
    activeTool = tool;
    setState({ diagnosticsSubTab: tool });
    render();
  }

  async function checkCurrentPage() {
    busy.checker = true;
    render();
    try {
      checkerResult = await diagnosticsService.scanPageFunctionalities();
      setState({ diagCheckerResult: checkerResult });
    } catch (error) {
      checkerResult = { success: false, error: error?.message || 'Unable to check the current webpage.', barriers: [], totalIssues: 0 };
      setState({ diagCheckerResult: checkerResult });
    }
    busy.checker = false;
    render();
  }

  async function checkButtons() {
    busy.buttons = true;
    render();
    try {
      buttonAudit = await diagnosticsService.auditPageButtons();
      setState({ diagButtonAudit: buttonAudit });
    } catch (error) {
      buttonAudit = { success: false, error: error?.message || 'Unable to check buttons.', buttons: [], totalButtons: 0, brokenCount: 0, workingCount: 0 };
      setState({ diagButtonAudit: buttonAudit });
    }
    busy.buttons = false;
    render();
  }

  async function retrieveCurrentContent() {
    busy.content = true;
    render();
    try {
      pageContent = await diagnosticsService.retrievePageContents();
      setState({ diagPageContent: pageContent });
    } catch (error) {
      pageContent = { success: false, error: error?.message || 'Unable to retrieve the current webpage.' };
      setState({ diagPageContent: pageContent });
    }
    busy.content = false;
    render();
    return pageContent;
  }

  async function refreshAll() {
    checkerResult = null;
    buttonAudit = null;
    pageContent = null;
    chatMessages = [];
    setState({
      diagnosticsSubTab: activeTool,
      diagCheckerResult: null,
      diagButtonAudit: null,
      diagPageContent: null,
      chatMessages: []
    });
    try {
      await diagnosticsService.clearPageOverlays();
    } catch (_) {}
    if (activeTool === 'checker') await checkCurrentPage();
    else if (activeTool === 'buttons') await checkButtons();
    else {
      await retrieveCurrentContent();
      render();
    }
  }

  async function point(item) {
    if (!item?.selector) return;
    await diagnosticsService.pointToElementOnPage(
      item.selector,
      item.text || item.titleEn || 'Problematic element',
      item.reasonEn || item.reason || item.errorDetails || '',
      item.fixEn || item.solutionEn || item.fix || '',
      {
        feature: item.feature || item.featureMl || '',
        functionality: item.functionality || item.functionalityMl || '',
        purpose: item.purpose || item.purposeMl || '',
        isFunctioning: item.isFunctioning,
        errorDetails: item.errorDetails || item.errorDetailsMl || ''
      }
    );
  }

  async function submitChat(query) {
    const q = String(query || '').trim();
    if (!q) return;
    busy.chat = true;
    chatMessages.push({ sender: 'user', text: q });
    render();
    if (!pageContent?.wordCount || pageContent.wordCount <= 0) {
      pageContent = await retrieveCurrentContent();
    }
    try {
      const response = await diagnosticsService.askChatbot({
        query: q,
        pageContext: {
          title: pageContent?.title,
          url: pageContent?.url,
          pageContent
        },
        lang: 'ml'
      });
      chatMessages.push({ sender: 'assistant', textEn: response.textEn, textMl: response.textMl, text: response.text });
    } catch (error) {
      chatMessages.push({
        sender: 'assistant',
        textEn: `I could not answer from the current webpage. ${error?.message || 'Please refresh the page and try again.'}`,
        textMl: `നിലവിലെ വെബ്‌പേജിലെ ഉള്ളടക്കത്തിൽ നിന്ന് മറുപടി നൽകാൻ കഴിഞ്ഞില്ല. ${error?.message || 'പേജ് റീഫ്രഷ് ചെയ്ത് വീണ്ടും ശ്രമിക്കുക.'}`
      });
    }
    busy.chat = false;
    setState({ chatMessages, diagPageContent: pageContent });
    render();
    const feed = container.querySelector('#thunai-chat-feed');
    if (feed) feed.scrollTop = feed.scrollHeight;
  }

  function renderProblem(item, index) {
    const titleEn = item.titleEn || item.title || 'Webpage problem';
    const titleMl = item.title || item.titleMl || 'വെബ്‌പേജിലെ പ്രശ്നം';
    const reasonEn = item.reasonEn || item.errorDetails || 'A problem was detected.';
    const reasonMl = item.reason || item.errorDetailsMl || 'ഒരു പ്രശ്നം കണ്ടെത്തി.';
    const fixEn = item.fixEn || item.solutionEn || item.fix || 'Review the element and try again.';
    const fixMl = item.fixMl || item.solution || item.fix || 'ഘടകം പരിശോധിച്ച് വീണ്ടും ശ്രമിക്കുക.';
    return `
      <article class="thunai-diag-card">
        <div class="thunai-diag-title">⚠️ ${esc(titleEn)}</div>
        <div class="thunai-diag-ml">${esc(titleMl)}</div>
        <div class="thunai-two-col">
          <div><strong>What is wrong?</strong><p>${nl(reasonEn)}</p></div>
          <div><strong>എന്താണ് പ്രശ്നം?</strong><p>${nl(reasonMl)}</p></div>
        </div>
        <div class="thunai-two-col">
          <div><strong>What to do</strong><p>${nl(fixEn)}</p></div>
          <div><strong>എങ്ങനെ പരിഹരിക്കാം</strong><p>${nl(fixMl)}</p></div>
        </div>
        ${item.selector ? `<button class="thunai-point" data-problem-index="${index}">📍 Point on Page / പേജിൽ കാണിക്കുക</button>` : '<div class="thunai-no-point">Exact element could not be identified, so Point on Page is unavailable.</div>'}
      </article>`;
  }

  function renderChecker() {
    if (!checkerResult) return `<div class="thunai-empty">Press <b>Check Webpage</b> to inspect the current page.</div>`;
    if (checkerResult.success === false) return `<div class="thunai-error">⚠️ ${esc(checkerResult.error || 'Could not inspect the current webpage.')}</div>`;
    const problems = checkerResult.barriers || [];
    const clean = checkerResult.everythingFunctionsProperly && problems.length === 0;
    return `
      <div class="thunai-result-banner ${clean ? 'good' : 'bad'}">
        <div class="thunai-result-main">${clean ? '✅ Webpage is accurate' : `⚠️ ${problems.length} problem${problems.length === 1 ? '' : 's'} detected`}</div>
        <div>${clean ? 'വെബ്പേജ് ശരിയാണ്' : 'വെബ്‌പേജിൽ ചില പ്രശ്നങ്ങൾ കണ്ടെത്തി'}</div>
        <small>Checked: ${esc(checkerResult.pageTitle || 'Current webpage')}</small>
      </div>
      ${problems.length ? problems.map(renderProblem).join('') : '<div class="thunai-clean-note">No detectable interaction or structure errors were found. / കണ്ടെത്താനായ പ്രവർത്തന/ഘടനാ പ്രശ്നങ്ങളൊന്നുമില്ല.</div>'}`;
  }

  function renderButtons() {
    if (!buttonAudit) return `<div class="thunai-empty">Press <b>Check All Buttons</b> to inspect every button on the current page.</div>`;
    if (buttonAudit.success === false) return `<div class="thunai-error">⚠️ ${esc(buttonAudit.error || 'Could not inspect buttons.')}</div>`;
    const buttons = buttonAudit.buttons || [];
    return `
      <div class="thunai-result-banner ${buttonAudit.brokenCount ? 'bad' : 'good'}">
        <div class="thunai-result-main">${buttonAudit.brokenCount ? `⚠️ ${buttonAudit.brokenCount} button issue${buttonAudit.brokenCount === 1 ? '' : 's'}` : '✅ Buttons checked'}</div>
        <div>ആകെ ${buttonAudit.totalButtons || 0} ബട്ടണുകൾ • ${buttonAudit.workingCount || 0} പ്രവർത്തിക്കുന്നു • ${buttonAudit.brokenCount || 0} പ്രശ്നം</div>
      </div>
      ${buttons.length ? buttons.map((b, i) => `
        <article class="thunai-button-card ${b.isBroken ? 'problem' : 'working'}">
          <div class="thunai-button-name">${b.isBroken ? '⚠️' : '✅'} ${esc(b.text || 'Unnamed button')}</div>
          <div class="thunai-two-col">
            <div><strong>Function</strong><p>${nl(b.functionality || b.purpose || 'Interactive action')}</p></div>
            <div><strong>പ്രവർത്തനം</strong><p>${nl(b.functionalityMl || b.purposeMl || 'പേജിലെ ഒരു പ്രവർത്തനം നടത്തുന്നു.')}</p></div>
          </div>
          ${b.isBroken ? `<div class="thunai-two-col"><div><strong>Why it may not work</strong><p>${nl(b.reasonEn || b.errorDetails)}</p><strong>Suggestion</strong><p>${nl(b.fixEn || b.fix)}</p></div><div><strong>എന്തുകൊണ്ട് പ്രവർത്തിക്കില്ല</strong><p>${nl(b.reasonMl || b.errorDetailsMl)}</p><strong>നിർദ്ദേശം</strong><p>${nl(b.fixMl || b.fix)}</p></div></div>` : `<div class="thunai-working">Working / പ്രവർത്തിക്കുന്നു</div>`}
          ${b.selector ? `<button class="thunai-point" data-button-index="${i}">📍 Point on Page / പേജിൽ കാണിക്കുക</button>` : ''}
        </article>`).join('') : '<div class="thunai-empty">No buttons or button-like controls were found on this page. / ഈ പേജിൽ ബട്ടണുകൾ കണ്ടെത്തിയില്ല.</div>'}`;
  }

  function renderChat() {
    return `
      <div class="thunai-chat-intro">
        <strong>Ask About This Website / ഈ വെബ്സൈറ്റിനെക്കുറിച്ച് ചോദിക്കൂ</strong>
        <p>Answers are based on the content of the current webpage. / നിലവിലെ വെബ്‌പേജിലെ ഉള്ളടക്കത്തെ അടിസ്ഥാനമാക്കിയാണ് മറുപടി.</p>
        <button id="thunai-chat-refresh" class="thunai-secondary">↻ Refresh Content / ഉള്ളടക്കം പുതുക്കുക</button>
      </div>
      <div id="thunai-chat-feed" class="thunai-chat-feed">
        ${chatMessages.length ? chatMessages.map(m => `<div class="thunai-chat-msg ${m.sender}">${m.sender === 'user' ? `<strong>You / നിങ്ങൾ:</strong><p>${nl(m.text)}</p>` : `<strong>Thunai:</strong><div><b>English</b><p>${nl(m.textEn || m.text)}</p><b>മലയാളം</b><p>${nl(m.textMl || m.text)}</p></div>`}</div>`).join('') : '<div class="thunai-empty">Retrieve the current page and ask a question. / നിലവിലെ പേജ് വായിച്ച ശേഷം ചോദ്യം ചോദിക്കൂ.</div>'}
      </div>
      <form id="thunai-chat-form" class="thunai-chat-form">
        <input id="thunai-chat-input" placeholder="Ask about this page / ഈ പേജിനെക്കുറിച്ച് ചോദിക്കൂ" autocomplete="off">
        <button type="submit">Send / അയയ്ക്കുക</button>
      </form>`;
  }

  function render() {
    const title = pageContent?.title || checkerResult?.pageTitle || 'Current Webpage';
    container.innerHTML = `
      <section class="thunai-why-work" aria-label="Why Doesn't This Work">
        <div class="thunai-why-header">
          <div><div class="thunai-kicker">EXPLAINABILITY</div><h2>Why Doesn't This Work?</h2><p>Check the current webpage, its buttons, and ask questions about its content.</p><div class="thunai-page-name">🌐 ${esc(title)}</div></div>
          <button id="thunai-refresh-all" class="thunai-secondary">↻ Refresh / പുതുക്കുക</button>
        </div>
        <nav class="thunai-tool-tabs">
          <button class="${activeTool === 'checker' ? 'active' : ''}" data-tool="checker">🔎 Check Webpage<br><small>വെബ്പേജ് പരിശോധിക്കുക</small></button>
          <button class="${activeTool === 'buttons' ? 'active' : ''}" data-tool="buttons">🔘 Check All Buttons<br><small>എല്ലാ ബട്ടണുകളും പരിശോധിക്കുക</small></button>
          <button class="${activeTool === 'chatbot' ? 'active' : ''}" data-tool="chatbot">💬 Ask About Website<br><small>വെബ്സൈറ്റിനെക്കുറിച്ച് ചോദിക്കുക</small></button>
        </nav>
        <div class="thunai-tool-panel">
          ${activeTool === 'checker' ? `<div class="thunai-tool-head"><div><h3>Webpage Checker / വെബ്പേജ് പരിശോധന</h3><p>Checks detectable structure and interaction problems on the current page.</p></div><button id="thunai-check-page" class="thunai-primary">${busy.checker ? 'Checking… / പരിശോധിക്കുന്നു…' : 'Check Webpage / പരിശോധിക്കുക'}</button></div>${renderChecker()}` : ''}
          ${activeTool === 'buttons' ? `<div class="thunai-tool-head"><div><h3>Button Diagnoser / ബട്ടൺ പരിശോധന</h3><p>Checks buttons and button-like controls and explains detected problems.</p></div><button id="thunai-check-buttons" class="thunai-primary">${busy.buttons ? 'Checking… / പരിശോധിക്കുന്നു…' : 'Check All Buttons / പരിശോധിക്കുക'}</button></div>${renderButtons()}` : ''}
          ${activeTool === 'chatbot' ? renderChat() : ''}
        </div>
      </section>`;
    attachEvents();
  }

  function attachEvents() {
    container.querySelectorAll('[data-tool]').forEach(btn => btn.addEventListener('click', () => setTool(btn.getAttribute('data-tool'))));
    const refresh = container.querySelector('#thunai-refresh-all');
    if (refresh) refresh.addEventListener('click', refreshAll);
    const check = container.querySelector('#thunai-check-page');
    if (check) check.addEventListener('click', checkCurrentPage);
    const buttons = container.querySelector('#thunai-check-buttons');
    if (buttons) buttons.addEventListener('click', checkButtons);
    container.querySelectorAll('[data-problem-index]').forEach(btn => btn.addEventListener('click', () => point((checkerResult?.barriers || [])[Number(btn.dataset.problemIndex)])));
    container.querySelectorAll('[data-button-index]').forEach(btn => btn.addEventListener('click', () => point((buttonAudit?.buttons || [])[Number(btn.dataset.buttonIndex)])));
    const cr = container.querySelector('#thunai-chat-refresh');
    if (cr) cr.addEventListener('click', retrieveCurrentContent);
    const form = container.querySelector('#thunai-chat-form');
    if (form) form.addEventListener('submit', e => {
      e.preventDefault();
      const input = container.querySelector('#thunai-chat-input');
      if (input?.value.trim()) { const q = input.value.trim(); input.value = ''; submitChat(q); }
    });
  }

  // Minimal scoped styling keeps this redesigned feature independent of the old diagnostics UI.
  if (!document.getElementById('thunai-why-work-style')) {
    const style = document.createElement('style');
    style.id = 'thunai-why-work-style';
    style.textContent = `
      .thunai-why-work{padding:12px;font-family:inherit;color:#172033}.thunai-why-header{display:flex;justify-content:space-between;gap:10px;align-items:flex-start;margin-bottom:12px}.thunai-kicker{font-size:10px;font-weight:800;letter-spacing:.08em;color:#64748b}.thunai-why-header h2{margin:2px 0 4px;font-size:22px}.thunai-why-header p{margin:0;color:#64748b;font-size:12px;line-height:1.45}.thunai-page-name{margin-top:8px;font-size:11px;color:#475569;word-break:break-word}.thunai-tool-tabs{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-bottom:10px}.thunai-tool-tabs button,.thunai-primary,.thunai-secondary,.thunai-point{border:1px solid #cbd5e1;background:#fff;border-radius:8px;padding:8px;cursor:pointer;font-weight:700}.thunai-tool-tabs button.active{background:#e0f2fe;border-color:#38bdf8}.thunai-tool-tabs small{font-weight:500}.thunai-primary{background:#0f766e;color:#fff;border-color:#0f766e}.thunai-secondary{font-size:11px}.thunai-tool-head{display:flex;justify-content:space-between;gap:8px;align-items:center;margin-bottom:10px}.thunai-tool-head h3{margin:0;font-size:16px}.thunai-tool-head p{margin:3px 0;color:#64748b;font-size:11px}.thunai-result-banner{padding:12px;border-radius:10px;margin-bottom:10px;border:1px solid #cbd5e1}.thunai-result-banner.good{background:#ecfdf5;border-color:#86efac}.thunai-result-banner.bad{background:#fff7ed;border-color:#fdba74}.thunai-result-main{font-weight:800;font-size:15px}.thunai-result-banner small{display:block;margin-top:4px;color:#64748b}.thunai-diag-card,.thunai-button-card{border:1px solid #dbe2ea;border-radius:10px;padding:10px;margin:8px 0;background:#fff}.thunai-diag-title,.thunai-button-name{font-weight:800}.thunai-diag-ml{font-weight:700;color:#475569;margin:3px 0 8px}.thunai-two-col{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:7px 0}.thunai-two-col p{margin:3px 0;font-size:12px;line-height:1.45}.thunai-point{margin-top:5px;background:#f8fafc}.thunai-no-point,.thunai-empty,.thunai-clean-note{padding:10px;color:#64748b;font-size:12px}.thunai-working{color:#15803d;font-weight:700;padding:5px 0}.thunai-button-card.problem{border-left:4px solid #ef4444}.thunai-button-card.working{border-left:4px solid #22c55e}.thunai-error{padding:10px;border-radius:8px;background:#fef2f2;color:#991b1b}.thunai-chat-intro{padding:10px;border:1px solid #dbe2ea;border-radius:10px;margin-bottom:8px}.thunai-chat-intro p{font-size:12px;color:#64748b}.thunai-chat-feed{max-height:430px;overflow:auto;padding:4px}.thunai-chat-msg{padding:9px;border-radius:9px;margin:7px 0;font-size:12px;line-height:1.5}.thunai-chat-msg.user{background:#e0f2fe;margin-left:18%}.thunai-chat-msg.assistant{background:#f8fafc;border:1px solid #e2e8f0}.thunai-chat-msg p{white-space:pre-wrap;margin:4px 0}.thunai-chat-form{display:flex;gap:6px;margin-top:8px}.thunai-chat-form input{flex:1;min-width:0;padding:9px;border:1px solid #cbd5e1;border-radius:8px}.thunai-chat-form button{border:0;border-radius:8px;padding:8px 10px;background:#0f766e;color:#fff;font-weight:700}.thunai-why-work button:focus-visible{outline:3px solid #38bdf8;outline-offset:2px}@media(max-width:500px){.thunai-two-col{grid-template-columns:1fr}.thunai-tool-head{align-items:stretch;flex-direction:column}.thunai-tool-tabs{grid-template-columns:1fr}.thunai-why-header{flex-direction:column}}
    `;
    document.head.appendChild(style);
  }

  render();
  // Do not use stale cached results on first open. Check the actual active page.
  if (!checkerResult) checkCurrentPage();
}
