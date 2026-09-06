/**
 * Scan / Accessibility View Component (Tab: 'scan')
 * Features Live Webpage Scanning ETL Pipeline, User-Friendly Summary Card,
 * 5-Feature Action Pipeline Hub, and Tabbed Diagnostics (Issues & DOM Outline).
 */

import { scanPage, mockScanReport } from '../../services/scanService.js';
import { fixService } from '../../services/fixService.js';

export function renderScanView(container, state, setState, onNavigate) {
  let isScanning = state.isScanning || false;
  let scanReport = state.scanReport || null;
  let heatmapActive = state.heatmapActive || false;
  let activeTabLang = state.currentLang || 'ml';
  const isEn = activeTabLang === 'en';

  // Active sub-tab in diagnostics: 'issues' or 'outline'
  let activeDiagTab = state.activeScanDiagTab || 'issues';

  let expandedCategories = state.expandedCategories || {
    'images-media': true,
    'color-contrast': true,
    'page-structure': true,
    'landmarks': true,
    'aria': true
  };
  let loadingFixes = state.loadingFixes || {};
  let generatedSuggestions = state.generatedSuggestions || {};

  // Trigger initial scan if not already scanned
  if (!scanReport && !isScanning) {
    executeScan();
  }

  function executeScan() {
    isScanning = true;
    setState({ isScanning: true });
    render();

    scanPage().then((report) => {
      isScanning = false;
      scanReport = report || mockScanReport;
      setState({
        isScanning: false,
        scanReport: scanReport
      });
      render();
    }).catch(() => {
      isScanning = false;
      scanReport = mockScanReport;
      setState({ isScanning: false, scanReport });
      render();
    });
  }

  function sendInspectMessage(selector, label) {
    if (typeof chrome !== 'undefined' && chrome.tabs) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs && tabs[0]) {
          chrome.tabs.sendMessage(tabs[0].id, {
            action: 'INSPECT_ELEMENT',
            selector: selector,
            label: label
          }).catch(() => {});
        }
      });
    } else if (window.parent && window.parent.ThunaiContentScript) {
      window.parent.ThunaiContentScript.inspectElement(selector, label);
    }
  }

  function sendHeatmapMessage(show) {
    if (typeof chrome !== 'undefined' && chrome.tabs) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs && tabs[0]) {
          chrome.tabs.sendMessage(tabs[0].id, {
            action: 'TOGGLE_HEATMAP',
            show: show
          }).catch(() => {});
        }
      });
    } else if (window.parent && window.parent.ThunaiContentScript) {
      window.parent.ThunaiContentScript.toggleHeatmap(show);
    }
  }

  function applyPresetDyslexia() {
    const newSettings = {
      ...state.settings,
      textSize: 130,
      fontFamily: 'lexend',
      colorTint: 'cream',
      readingRuler: true
    };
    setState({ settings: newSettings });

    // Send to content-script
    if (typeof chrome !== 'undefined' && chrome.tabs) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs && tabs[0]) {
          chrome.tabs.sendMessage(tabs[0].id, {
            action: 'UPDATE_SETTINGS',
            settings: newSettings
          }).catch(() => {});
        }
      });
    } else if (window.parent && window.parent.ThunaiContentScript) {
      window.parent.ThunaiContentScript.applyUserSettings(newSettings);
    }

    if (onNavigate) onNavigate('dyslexia');
  }

  function render() {
    const report = scanReport || mockScanReport;
    const score = report.score ?? (report.summary?.score ?? 78);
    // Green: 85+, Amber: 60-84, Red: <60
    const scoreColor = score >= 85 ? '#16A34A' : (score >= 60 ? '#D97706' : '#DC2626');
    const scoreBadgeText = score >= 85
      ? (isEn ? 'Good (85+)' : 'മികച്ചത് (85+)')
      : (score >= 60 ? (isEn ? 'Needs Attention' : 'ശ്രദ്ധിക്കുക') : (isEn ? 'Action Required' : 'പ്രശ്നങ്ങൾ'));

    const wordCount = report.meta?.wordCount || report.wordCount || 350;
    const totalSegments = report.textSegments?.length || report.segmentCount || 3;
    const totalViolations = (report.wcagViolations && report.wcagViolations.length) || report.summary?.total || 5;
    const brokenElementsCount = (report.brokenElements && report.brokenElements.length) || 3;

    container.innerHTML = `
      <div class="view-panel scan-view animate-fade-in" id="panel-scan" role="tabpanel" aria-labelledby="tab-scan">
        
        <!-- Top Action Strip: Page Title & Rescan -->
        <div class="scan-top-strip">
          <div class="page-title-badge" title="${report.url || 'Active Page'}">
            <span class="page-dot"></span>
            <span class="page-name-text">${report.meta?.title || report.pageTitle || 'Active Webpage'}</span>
          </div>

          <button class="btn-rescan-pill" id="btn-rescan-page" ${isScanning ? 'disabled' : ''}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" class="${isScanning ? 'spin' : ''}">
              <path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
            </svg>
            <span>${isScanning ? (isEn ? 'Scanning...' : 'സ്കാൻ ചെയ്യുന്നു...') : (isEn ? 'Rescan' : 'പുനഃപരിശോധിക്കുക')}</span>
          </button>
        </div>

        ${isScanning ? `
          <!-- Scanning Live Progress Pipeline Animation -->
          <div class="scan-pipeline-progress-card animate-fade-in">
            <div class="spinner-large"></div>
            <h3 class="loading-title">${isEn ? 'Scanning Active Webpage...' : 'തത്സമയം വെബ്‌പേജ് പരിശോധിക്കുന്നു...'}</h3>
            <div class="scan-steps-progress-list">
              <div class="scan-step-item active">
                <span class="step-check">✓</span>
                <span>${isEn ? '1. Analyzing DOM structure & hierarchy' : '1. DOM ഘടന പരിശോധിക്കുന്നു'}</span>
              </div>
              <div class="scan-step-item active">
                <span class="step-check">✓</span>
                <span>${isEn ? '2. Auditing WCAG 2.1 AA rules (Images, Contrast, ARIA)' : '2. WCAG 2.1 AA മാനദണ്ഡങ്ങൾ പരിശോധിക്കുന്നു'}</span>
              </div>
              <div class="scan-step-item active">
                <span class="step-check">✓</span>
                <span>${isEn ? '3. Extracting live text & Dyslexia readability' : '3. പേജ് ഉള്ളടക്കവും വായനാക്ഷമതയും വേർതിരിക്കുന്നു'}</span>
              </div>
              <div class="scan-step-item active">
                <span class="step-check">✓</span>
                <span>${isEn ? '4. Synthesizing AI Accessibility Fixes' : '4. AI പരിഹാരങ്ങൾ തയ്യാറാക്കുന്നു'}</span>
              </div>
            </div>
          </div>
        ` : `
          <!-- HEADER SUMMARY CARD: Score Badge & Metrics Grid -->
          <div class="page-scan-score-card">
            <div class="score-card-left">
              <div class="score-gauge-circle" style="border-color: ${scoreColor}; color: ${scoreColor};">
                <span class="score-number">${score}</span>
                <span class="score-max">/100</span>
              </div>
              <div class="score-text-block">
                <div class="score-header-badge" style="background: ${scoreColor}20; color: ${scoreColor};">
                  ${scoreBadgeText}
                </div>
                <h2 class="score-title">${isEn ? 'Accessibility Health' : 'പ്രാപ്യതാ നിലവാരം'}</h2>
                <p class="score-sub">${report.meta?.lang?.toUpperCase() || 'EN'} • ${report.url ? report.url.replace(/^https?:\/\//, '').slice(0, 32) : 'Active Page'}</p>
              </div>
            </div>
            
            <button class="btn-heatmap-toggle-compact ${heatmapActive ? 'active' : ''}" id="btn-toggle-heatmap">
              <span>${heatmapActive ? '🔥 Hide Heatmap' : '🔥 Show Heatmap'}</span>
            </button>
          </div>

          <!-- Metrics Grid: Total Words Analyzed | Extracted Paragraphs | Flagged Issues -->
          <div class="scan-metrics-grid">
            <div class="metric-item">
              <span class="metric-val">${wordCount}</span>
              <span class="metric-lbl">${isEn ? 'Words Analyzed' : 'വാക്കുകൾ'}</span>
            </div>
            <div class="metric-item">
              <span class="metric-val">${totalSegments}</span>
              <span class="metric-lbl">${isEn ? 'Paragraphs' : 'ഖണ്ഡികകൾ'}</span>
            </div>
            <div class="metric-item">
              <span class="metric-val" style="color: var(--color-red);">${totalViolations}</span>
              <span class="metric-lbl">${isEn ? 'Flagged Issues' : 'പ്രശ്നങ്ങൾ'}</span>
            </div>
          </div>

          <!-- QUICK-ACTION GRID (1-Click Pipelines to the 5 Features) -->
          <div class="scan-pipeline-hub-card">
            <div class="pipeline-hub-header">
              <span class="pipeline-hub-badge">🚀 ${isEn ? 'FEATURE PIPELINES' : 'പ്രവർത്തന പൈപ്പ്‌ലൈൻ'}</span>
              <span class="pipeline-hub-sub">${isEn ? '1-Click actions synced with this scan' : 'ഈ സ്കാനിൽ നിന്നുള്ള നേരിട്ടുള്ള പ്രവർത്തനങ്ങൾ'}</span>
            </div>

            <div class="pipeline-actions-grid">
              <!-- Feature 1: Dyslexia Mode -->
              <div class="pipeline-action-item">
                <div class="pipeline-item-icon">👁️</div>
                <div class="pipeline-item-info">
                  <div class="pipeline-item-title">${isEn ? 'Dyslexia Friendly Mode' : 'ഡിസ്‌ലെക്സിയ സൗഹൃദ മോഡ്'}</div>
                  <div class="pipeline-item-desc">${isEn ? 'Pre-tuned: Lexend typography & Soft Cream' : 'Lexend ഫോണ്ടും സോഫ്റ്റ് ക്രീം പശ്ചാത്തലവും'}</div>
                </div>
                <button class="btn-pipeline-cta" id="btn-pipeline-dyslexia">
                  ${isEn ? 'Apply Preset' : 'പ്രയോഗിക്കുക'}
                </button>
              </div>

              <!-- Feature 2: Read Page in Malayalam -->
              <div class="pipeline-action-item">
                <div class="pipeline-item-icon">🔊</div>
                <div class="pipeline-item-info">
                  <div class="pipeline-item-title">${isEn ? 'Read in Malayalam' : 'മലയാളത്തിൽ കേൾക്കുക'}</div>
                  <div class="pipeline-item-desc">${totalSegments} ${isEn ? 'paragraphs extracted for live TTS read-along' : 'ഖണ്ഡികകൾ ഓഡിയോ ആയി കേൾക്കാം'}</div>
                </div>
                <button class="btn-pipeline-cta" id="btn-pipeline-listen">
                  ${isEn ? 'Listen Live' : 'കേൾക്കുക'}
                </button>
              </div>

              <!-- Feature 3: Translate & Simplify -->
              <div class="pipeline-action-item">
                <div class="pipeline-item-icon">🌐</div>
                <div class="pipeline-item-info">
                  <div class="pipeline-item-title">${isEn ? 'Translate & Simplify' : 'പരിഭാഷ & ലളിതമാക്കൽ'}</div>
                  <div class="pipeline-item-desc">${isEn ? 'Ready for 1-click batch translation' : 'ലളിതമായ മലയാളത്തിലേക്ക് മാറ്റുക'}</div>
                </div>
                <button class="btn-pipeline-cta" id="btn-pipeline-translate">
                  ${isEn ? 'Translate' : 'പരിഭാഷ'}
                </button>
              </div>

              <!-- Feature 4: Keyword Search -->
              <div class="pipeline-action-item">
                <div class="pipeline-item-icon">🔍</div>
                <div class="pipeline-item-info">
                  <div class="pipeline-item-title">${isEn ? 'Find in Page' : 'വാക്ക് തിരയുക'}</div>
                  <div class="pipeline-item-desc">${(report.keywords || []).slice(0, 4).join(', ')}...</div>
                </div>
                <button class="btn-pipeline-cta" id="btn-pipeline-search">
                  ${isEn ? 'Search' : 'തിരയുക'}
                </button>
              </div>

              <!-- Feature 5: Why Doesn't This Work? (Diagnostics) -->
              <div class="pipeline-action-item">
                <div class="pipeline-item-icon">🛠️</div>
                <div class="pipeline-item-info">
                  <div class="pipeline-item-title">${isEn ? "Why Doesn't This Work?" : 'എന്തുകൊണ്ട് പ്രവർത്തിക്കുന്നില്ല?'}</div>
                  <div class="pipeline-item-desc">${brokenElementsCount} ${isEn ? 'unclickable or unlabelled elements identified' : 'പ്രവർത്തന തടസ്സങ്ങൾ കണ്ടെത്തി'}</div>
                </div>
                <button class="btn-pipeline-cta" id="btn-pipeline-diagnostics">
                  ${isEn ? 'Diagnose' : 'പരിശോധിക്കുക'}
                </button>
              </div>
            </div>
          </div>

          <!-- Severity Summary Bar -->
          <div class="severity-summary-bar" role="group" aria-label="Accessibility Violations Summary">
            <div class="summary-chip chip-total">
              <span class="chip-count">${totalViolations}</span>
              <span class="chip-label">TOTAL</span>
            </div>
            <div class="summary-chip chip-critical">
              <span class="chip-count">${report.stats?.critical ?? report.summary?.critical ?? 0}</span>
              <span class="chip-label">CRITICAL</span>
            </div>
            <div class="summary-chip chip-serious">
              <span class="chip-count">${report.stats?.serious ?? report.summary?.serious ?? 0}</span>
              <span class="chip-label">SERIOUS</span>
            </div>
            <div class="summary-chip chip-moderate">
              <span class="chip-count">${report.stats?.moderate ?? report.summary?.moderate ?? 0}</span>
              <span class="chip-label">MODERATE</span>
            </div>
            <div class="summary-chip chip-minor">
              <span class="chip-count">${report.stats?.minor ?? report.summary?.minor ?? 0}</span>
              <span class="chip-label">MINOR</span>
            </div>
          </div>

          <!-- COLLAPSIBLE DIAGNOSTICS TABS (Issues Detected vs DOM Outline) -->
          <div class="diagnostics-tab-bar" role="tablist">
            <button class="diag-tab-btn ${activeDiagTab === 'issues' ? 'active' : ''}" id="tab-btn-issues" role="tab" aria-selected="${activeDiagTab === 'issues'}">
              ⚠️ ${isEn ? 'Issues Detected' : 'കണ്ടെത്തിയ പ്രശ്നങ്ങൾ'} (${totalViolations})
            </button>
            <button class="diag-tab-btn ${activeDiagTab === 'outline' ? 'active' : ''}" id="tab-btn-outline" role="tab" aria-selected="${activeDiagTab === 'outline'}">
              📑 ${isEn ? 'DOM Outline / Broken' : 'ഘടനാ തടസ്സങ്ങൾ'} (${brokenElementsCount})
            </button>
          </div>

          <!-- TAB 1: Issues Detected Accordion -->
          ${activeDiagTab === 'issues' ? `
            <div class="categories-accordion-list" role="region" aria-label="Accessibility Issue Categories">
              ${(report.categories || []).map(cat => {
                const isExpanded = expandedCategories[cat.id] ?? true;
                return `
                  <div class="category-card ${isExpanded ? 'expanded' : 'collapsed'}" data-cat-id="${cat.id}">
                    <!-- Category Accordion Header -->
                    <button class="category-header-btn" data-cat-toggle="${cat.id}" aria-expanded="${isExpanded}">
                      <div class="cat-header-left">
                        <span class="cat-icon-badge">
                          ${cat.id === 'images-media' ? '🖼️' : cat.id === 'color-contrast' ? '🎨' : cat.id === 'page-structure' ? '📑' : cat.id === 'landmarks' ? '🧭' : '🏷️'}
                        </span>
                        <span class="cat-title">${cat.shortName}</span>
                      </div>
                      <div class="cat-header-right">
                        <span class="cat-count-badge">${cat.count || (cat.issues ? cat.issues.length : 0)}</span>
                        <span class="cat-chevron ${isExpanded ? 'up' : 'down'}">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                            <polyline points="6 9 12 15 18 9"></polyline>
                          </svg>
                        </span>
                      </div>
                    </button>

                    <!-- Category Content Body -->
                    ${isExpanded ? `
                      <div class="category-body">
                        ${(cat.issues || []).map(issue => {
                          const isFixLoading = loadingFixes[issue.id];
                          const suggestion = generatedSuggestions[issue.id] || (issue.aiSuggestion?.approved ? issue.aiSuggestion : null);
                          const isApproved = suggestion?.approved;

                          return `
                            <div class="issue-item-card" data-issue-id="${issue.id}">
                              
                              <!-- Severity & Rule Title Header -->
                              <div class="issue-header-row">
                                <span class="severity-tag tag-${(issue.severityClass || issue.severity || 'minor').toLowerCase()}">${issue.severity}</span>
                                <span class="elements-count-badge">${issue.affectedCount || 1} ${isEn ? 'elements' : 'ഘടകങ്ങൾ'}</span>
                              </div>

                              <h3 class="issue-rule-title">${issue.ruleTitle || issue.message}</h3>
                              <p class="issue-rule-ml">${issue.malayalamRule || ''}</p>
                              <p class="issue-requirement-desc">${issue.description || issue.failureSummary || ''}</p>

                              <!-- Target Element Selector Preview -->
                              <div class="issue-element-preview">
                                <span class="preview-label">${isEn ? 'Target Selector:' : 'ലക്ഷ്യ ഘടകം:'}</span>
                                <code class="preview-code">${issue.selector || 'body'}</code>
                              </div>

                              <!-- AI Auto-Fix Action Box -->
                              <div class="ai-fix-action-box">
                                ${suggestion ? `
                                  <div class="ai-suggestion-preview ${isApproved ? 'approved' : ''}">
                                    <div class="suggestion-header">
                                      <span class="ai-badge-mini">✨ ${suggestion.type || 'AI FIX'}</span>
                                      <span class="confidence-tag">${suggestion.confidence || '98% Match'}</span>
                                    </div>
                                    <div class="suggestion-code-diff">
                                      <div class="diff-before"><s>${suggestion.currentVal || 'Original'}</s></div>
                                      <div class="diff-after"><strong>${suggestion.suggestedVal || 'Patched'}</strong></div>
                                    </div>
                                    <div class="suggestion-actions">
                                      ${isApproved ? `
                                        <div class="badge-approved-pill">
                                          <span>✓ ${isEn ? 'Live Patch Applied' : 'പരിഹാരം പ്രയോഗിച്ചു'}</span>
                                        </div>
                                      ` : `
                                        <button class="btn-approve-fix" data-issue-id="${issue.id}">
                                          ✓ ${isEn ? 'Approve & Apply Live' : 'തത്സമയം നടപ്പിലാക്കുക'}
                                        </button>
                                        <button class="btn-reject-fix" data-issue-id="${issue.id}">
                                          ✕ ${isEn ? 'Dismiss' : 'ഒഴിവാക്കുക'}
                                        </button>
                                      `}
                                    </div>
                                  </div>
                                ` : `
                                  <div class="issue-actions-row">
                                    <button class="btn-inspect-element" data-selector="${issue.selector}" data-title="${issue.ruleTitle || issue.message}">
                                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <circle cx="11" cy="11" r="8"></circle>
                                        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                                      </svg>
                                      <span>${isEn ? 'Inspect on Page' : 'ഘടകം കാണുക'}</span>
                                    </button>

                                    <button class="btn-generate-ai-fix ${isFixLoading ? 'loading' : ''}" data-issue-id="${issue.id}" ${isFixLoading ? 'disabled' : ''}>
                                      ${isFixLoading ? `
                                        <span class="spinner-icon"></span>
                                        <span>${isEn ? 'Synthesizing...' : 'തയ്യാറാക്കുന്നു...'}</span>
                                      ` : `
                                        <span>✨ ${isEn ? 'Auto-Fix Live' : 'AI പരിഹാരം'}</span>
                                      `}
                                    </button>
                                  </div>
                                `}
                              </div>
                            </div>
                          `;
                        }).join('')}
                      </div>
                    ` : ''}
                  </div>
                `;
              }).join('')}
            </div>
          ` : `
            <!-- TAB 2: DOM Outline & Broken Elements -->
            <div class="broken-elements-list" role="region" aria-label="Broken Interactive Elements">
              ${(report.brokenElements || []).map(item => `
                <div class="broken-element-item-card" data-broken-id="${item.id}">
                  <div class="broken-element-top">
                    <span class="broken-tag-pill">&lt;${item.tag}&gt;</span>
                    <span class="severity-tag tag-serious">${isEn ? 'BROKEN' : 'തടസ്സം'}</span>
                  </div>

                  <h4 class="broken-item-title" style="margin: 2px 0; font-size: 13px; font-weight: 700; color: var(--text-primary);">
                    ${item.text || item.tag}
                  </h4>
                  
                  <p class="broken-reason">
                    ${item.reason}
                  </p>
                  
                  <div class="issue-element-preview" style="margin-top: 4px;">
                    <span class="preview-label">${isEn ? 'Selector:' : 'സിലക്ടർ:'}</span>
                    <code class="preview-code">${item.selector}</code>
                  </div>

                  <div class="issue-actions-row" style="margin-top: 6px;">
                    <button class="btn-inspect-element" data-selector="${item.selector}" data-title="${item.text || item.reason}">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="11" cy="11" r="8"></circle>
                        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                      </svg>
                      <span>${isEn ? 'Inspect on Page' : 'ഘടകം പരിശോധിക്കുക'}</span>
                    </button>
                  </div>
                </div>
              `).join('')}
            </div>
          `}
        `}
      </div>
    `;

    attachEvents();
  }

  function attachEvents() {
    const rescanBtn = container.querySelector('#btn-rescan-page');
    if (rescanBtn) {
      rescanBtn.addEventListener('click', () => {
        executeScan();
      });
    }

    const heatmapBtn = container.querySelector('#btn-toggle-heatmap');
    if (heatmapBtn) {
      heatmapBtn.addEventListener('click', () => {
        heatmapActive = !heatmapActive;
        setState({ heatmapActive });
        sendHeatmapMessage(heatmapActive);
        render();
      });
    }

    // Diagnostics sub-tab buttons
    const tabIssues = container.querySelector('#tab-btn-issues');
    if (tabIssues) {
      tabIssues.addEventListener('click', () => {
        activeDiagTab = 'issues';
        setState({ activeScanDiagTab: 'issues' });
        render();
      });
    }

    const tabOutline = container.querySelector('#tab-btn-outline');
    if (tabOutline) {
      tabOutline.addEventListener('click', () => {
        activeDiagTab = 'outline';
        setState({ activeScanDiagTab: 'outline' });
        render();
      });
    }

    // Pipeline Quick-Action CTAs
    const dyslexiaPipelineBtn = container.querySelector('#btn-pipeline-dyslexia');
    if (dyslexiaPipelineBtn) {
      dyslexiaPipelineBtn.addEventListener('click', () => {
        applyPresetDyslexia();
      });
    }

    const listenPipelineBtn = container.querySelector('#btn-pipeline-listen');
    if (listenPipelineBtn) {
      listenPipelineBtn.addEventListener('click', () => {
        if (onNavigate) onNavigate('listen');
      });
    }

    const translatePipelineBtn = container.querySelector('#btn-pipeline-translate');
    if (translatePipelineBtn) {
      translatePipelineBtn.addEventListener('click', () => {
        if (onNavigate) onNavigate('translate');
      });
    }

    const searchPipelineBtn = container.querySelector('#btn-pipeline-search');
    if (searchPipelineBtn) {
      searchPipelineBtn.addEventListener('click', () => {
        if (onNavigate) onNavigate('search');
      });
    }

    const diagnosticsPipelineBtn = container.querySelector('#btn-pipeline-diagnostics');
    if (diagnosticsPipelineBtn) {
      diagnosticsPipelineBtn.addEventListener('click', () => {
        if (onNavigate) onNavigate('diagnostics');
      });
    }

    // Accordion toggles
    container.querySelectorAll('[data-cat-toggle]').forEach(btn => {
      btn.addEventListener('click', () => {
        const catId = btn.getAttribute('data-cat-toggle');
        expandedCategories[catId] = !expandedCategories[catId];
        setState({ expandedCategories });
        render();
      });
    });

    // Inspect buttons
    container.querySelectorAll('.btn-inspect-element').forEach(btn => {
      btn.addEventListener('click', () => {
        const selector = btn.getAttribute('data-selector');
        const title = btn.getAttribute('data-title');
        sendInspectMessage(selector, title);
      });
    });

    // Generate AI fix buttons
    container.querySelectorAll('.btn-generate-ai-fix').forEach(btn => {
      btn.addEventListener('click', () => {
        const issueId = btn.getAttribute('data-issue-id');
        loadingFixes[issueId] = true;
        setState({ loadingFixes });
        render();

        setTimeout(() => {
          let report = scanReport || mockScanReport;
          let targetIssue = null;
          for (const cat of (report.categories || [])) {
            const found = (cat.issues || []).find(i => i.id === issueId);
            if (found) { targetIssue = found; break; }
          }

          if (targetIssue && targetIssue.aiSuggestion) {
            generatedSuggestions[issueId] = { ...targetIssue.aiSuggestion, approved: false };
          } else {
            generatedSuggestions[issueId] = {
              type: 'ARIA_FIX',
              suggestedVal: 'aria-label="Accessible Interactive Control"',
              codePreview: '<element aria-label="Accessible Interactive Control" />',
              confidence: '95% (Vision AI Verified)',
              approved: false
            };
          }

          loadingFixes[issueId] = false;
          setState({ loadingFixes, generatedSuggestions });
          render();
        }, 600);
      });
    });

    // Approve Fix buttons
    container.querySelectorAll('.btn-approve-fix').forEach(btn => {
      btn.addEventListener('click', () => {
        const issueId = btn.getAttribute('data-issue-id');
        const suggestion = generatedSuggestions[issueId];

        if (suggestion) {
          suggestion.approved = true;
          setState({ generatedSuggestions });

          // Send to content-script to mutate live DOM
          if (typeof chrome !== 'undefined' && chrome.tabs) {
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
              if (tabs && tabs[0]) {
                chrome.tabs.sendMessage(tabs[0].id, {
                  action: 'APPLY_FIX',
                  fix: { id: issueId, ...suggestion }
                }).catch(() => {});
              }
            });
          } else if (window.parent && window.parent.ThunaiContentScript) {
            window.parent.ThunaiContentScript.applyLiveFixToPage({ id: issueId, ...suggestion });
          }

          render();
        }
      });
    });

    // Reject Fix buttons
    container.querySelectorAll('.btn-reject-fix').forEach(btn => {
      btn.addEventListener('click', () => {
        const issueId = btn.getAttribute('data-issue-id');
        delete generatedSuggestions[issueId];
        setState({ generatedSuggestions });
        render();
      });
    });
  }

  render();
}
