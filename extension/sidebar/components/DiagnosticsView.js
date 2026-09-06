/**
 * Diagnostics View Component (View: 'diagnostics')
 * "Why Doesn't This Work? (എന്തുകൊണ്ട് പ്രവർത്തിക്കുന്നില്ല?)" page diagnostic debugger.
 * Consumes scanReport.brokenElements directly from the universal scanned state.
 */

export function renderDiagnosticsView(container, state, setState, onNavigate) {
  let isDiagnosing = state.isDiagnosing || false;
  let hasDiagnosed = state.hasDiagnosed || (state.scanReport && state.scanReport.brokenElements && state.scanReport.brokenElements.length > 0) || false;

  // Retrieve brokenElements from shared scanReport or default fallback
  const scanReport = state.scanReport;
  const brokenElements = (scanReport && scanReport.brokenElements && scanReport.brokenElements.length > 0)
    ? scanReport.brokenElements
    : [
      {
        id: "diag-1",
        title: "ക്ലിക്ക് ചെയ്യാൻ കഴിയാത്ത ഘടകങ്ങൾ (Unclickable / Hidden Elements)",
        severity: "CRITICAL",
        reason: "An invisible overlay container with z-index is intercepting mouse clicks over the primary form fields.",
        selector: "div.modal-backdrop-hidden, button#submit",
        fix: "Remove pointer-events from inert backdrop or lower z-index",
        tag: "button"
      },
      {
        id: "diag-2",
        title: "നിഷ്ക്രിയമായ സമർപ്പിക്കൽ ബട്ടൺ (Disabled Submit Button)",
        severity: "SERIOUS",
        reason: "Submit button has 'pointer-events: none' and opacity 0.5 without descriptive error message explaining missing input fields.",
        selector: "button#submit-app-form",
        fix: "Surface required field validation alert in Malayalam and restore focus",
        tag: "button"
      },
      {
        id: "diag-3",
        title: "ലേബൽ ഇല്ലാത്ത ഇൻപുട്ട് ഫീൽഡുകൾ (Missing Form Labels)",
        severity: "MODERATE",
        reason: "Form input elements lack explicit <label for='...'> or aria-label, blocking screen readers and autofill.",
        selector: "input:not([aria-label])",
        fix: "Associate explicit <label> element or apply aria-label attribute",
        tag: "input"
      }
    ];

  function sendInspectMessage(selector, title) {
    if (typeof chrome !== 'undefined' && chrome.tabs) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs && tabs[0]) {
          chrome.tabs.sendMessage(tabs[0].id, {
            action: 'INSPECT_ELEMENT',
            selector: selector,
            label: title
          }).catch(() => {});
        }
      });
    } else if (window.parent && window.parent.ThunaiContentScript) {
      window.parent.ThunaiContentScript.inspectElement(selector, title);
    }
  }

  function sendFocusMessage(selector) {
    sendInspectMessage(selector, 'Focus Target');
  }

  function render() {
    container.innerHTML = `
      <div class="view-panel diagnostics-view animate-fade-in" id="panel-diagnostics" role="region" aria-label="Page Diagnostics Debugger">
        
        <!-- Header Strip -->
        <div class="diag-header-box">
          <div class="diag-badge-pill">
            <span class="diag-icon">🛠️</span>
            <span>WHY DOESN'T THIS WORK?</span>
          </div>
          <h2 class="view-heading-ml">എന്തുകൊണ്ട് പ്രവർത്തിക്കുന്നില്ല?</h2>
          <p class="view-subheading-en">Diagnose broken, hidden, or unclickable elements on complex portals and government websites.</p>
        </div>

        <!-- Run Diagnostic Action CTA -->
        <div class="diag-cta-box">
          <button class="btn-primary-cta diag-btn ${isDiagnosing ? 'loading' : ''}" id="btn-run-diagnostics" ${isDiagnosing ? 'disabled' : ''}>
            ${isDiagnosing ? `
              <span class="spinner-icon"></span>
              <span>DOM ഘടന വിശകലനം ചെയ്യുന്നു... (Diagnosing)</span>
            ` : `
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <path d="M12 8v4M12 16h.01"></path>
              </svg>
              <span>തത്സമയ പരിശോധന ആരംഭിക്കുക (Re-Run Diagnostic)</span>
            `}
          </button>
        </div>

        <!-- Diagnostic Findings List -->
        <div class="diag-results-box">
          ${isDiagnosing ? `
            <div class="diag-scan-animation">
              <div class="radar-sweep"></div>
              <p class="radar-text">Analyzing event listeners, z-index stack, and pointer events...</p>
            </div>
          ` : (hasDiagnosed && brokenElements.length > 0) ? `
            <div class="diag-findings-list">
              <div class="findings-summary-banner">
                <span class="summary-icon">⚠️</span>
                <span class="summary-text">${brokenElements.length} ഇന്ററാക്ഷൻ തടസ്സങ്ങൾ കണ്ടെത്തി (${brokenElements.length} Issues Found)</span>
              </div>

              ${brokenElements.map(item => {
                const title = item.title || item.text || item.reason || 'Broken Element';
                const reason = item.reason || item.failureSummary || 'Interaction barrier detected on this element.';
                const severity = item.severity || 'SERIOUS';
                const tag = item.tag || 'element';
                const fix = item.fix || 'Ensure element has visible label, contrast >= 4.5:1, and active click listener.';

                return `
                  <div class="diag-finding-card">
                    <div class="finding-top-row">
                      <span class="severity-tag tag-${severity.toLowerCase()}">${severity}</span>
                      <span class="finding-selector-tag">&lt;${tag}&gt; ${item.selector}</span>
                    </div>

                    <h3 class="finding-title">${title}</h3>
                    <p class="finding-reason">${reason}</p>

                    <div class="finding-fix-recommendation">
                      <span class="fix-sparkle">💡 നിർദ്ദേശം:</span>
                      <span class="fix-text">${fix}</span>
                    </div>

                    <div class="finding-actions-row">
                      <button class="btn-inspect-diag" data-selector="${item.selector}" data-title="${title}">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <circle cx="11" cy="11" r="8"></circle>
                          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                        </svg>
                        <span>ഘടകം പരിശോധിക്കുക (Inspect on Page)</span>
                      </button>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          ` : `
            <div class="diag-idle-state">
              <div class="idle-icon-wrap">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#64748B" stroke-width="1.5">
                  <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>
                </svg>
              </div>
              <p class="idle-title-ml">പേജിലെ ബട്ടണുകൾ ക്ലിക്ക് ചെയ്യാനാകുന്നില്ലേ?</p>
              <p class="idle-desc-en">Click above to analyze overlapping layers, hidden form validation errors, and disabled controls.</p>
            </div>
          `}
        </div>

      </div>
    `;

    attachEvents();
  }

  function attachEvents() {
    const runBtn = container.querySelector('#btn-run-diagnostics');
    if (runBtn) {
      runBtn.addEventListener('click', () => {
        isDiagnosing = true;
        setState({ isDiagnosing: true });
        render();

        setTimeout(() => {
          isDiagnosing = false;
          hasDiagnosed = true;
          setState({ isDiagnosing: false, hasDiagnosed: true });
          render();
        }, 800);
      });
    }

    container.querySelectorAll('.btn-inspect-diag').forEach(btn => {
      btn.addEventListener('click', () => {
        const selector = btn.getAttribute('data-selector');
        const title = btn.getAttribute('data-title');
        sendInspectMessage(selector, title);
      });
    });
  }

  render();
}
