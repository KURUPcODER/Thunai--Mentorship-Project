/**
 * Scan / User Manual View Component (Tab: 'scan')
 * Displays the comprehensive Thunai User Manual & Feature Usability Guide.
 */

import { getT } from '../i18n.js';

export function renderScanView(container, state, setState, onNavigate) {
  let activeTabLang = state.currentLang || 'ml';
  const isEn = activeTabLang === 'en';
  const t = getT(activeTabLang);

  function render() {
    container.innerHTML = `
      <div class="view-panel scan-view animate-fade-in" id="panel-scan" role="tabpanel" aria-labelledby="tab-scan">
        
        <!-- ================================================================= -->
        <!-- USER MANUAL & FEATURE USABILITY GUIDE                             -->
        <!-- ================================================================= -->
        <div class="user-manual-container animate-fade-in" role="region" aria-label="Thunai User Manual">

          <!-- Hero Banner -->
          <div class="manual-hero-card">
            <div class="manual-hero-icon" aria-hidden="true">📖</div>
            <div class="manual-hero-content">
              <div class="manual-badge-row">
                <span class="manual-badge-pill">THUNAI USER MANUAL</span>
                <span class="manual-badge-pill-wcag">WCAG 2.1 AA</span>
              </div>
              <h2 class="manual-hero-title">${t.manualMainTitle || 'Thunai - User Manual & Guide'}</h2>
              <p class="manual-hero-sub">${t.manualMainSub || 'Complete purpose of the extension and usability guide for every feature'}</p>
            </div>
          </div>

          <!-- Purpose & Mission Section -->
          <div class="manual-section-card">
            <div class="manual-section-header">
              <span class="manual-section-icon">🎯</span>
              <div>
                <h3 class="manual-section-title">${t.purposeHeading || 'Purpose & Mission of Thunai'}</h3>
                <p class="manual-section-desc">${t.purposeDesc || ''}</p>
              </div>
            </div>
            <div class="manual-pillars-grid">
              <div class="pillar-item">
                <div class="pillar-icon">🌐</div>
                <div class="pillar-text">
                  <strong class="pillar-title">${t.purposePillar1Title || 'Eliminating Language Barriers'}</strong>
                  <p class="pillar-desc">${t.purposePillar1Desc || ''}</p>
                </div>
              </div>
              <div class="pillar-item">
                <div class="pillar-icon">👁️</div>
                <div class="pillar-text">
                  <strong class="pillar-title">${t.purposePillar2Title || 'Overcoming Reading Difficulties'}</strong>
                  <p class="pillar-desc">${t.purposePillar2Desc || ''}</p>
                </div>
              </div>
              <div class="pillar-item">
                <div class="pillar-icon">🔊</div>
                <div class="pillar-text">
                  <strong class="pillar-title">${t.purposePillar3Title || 'Synchronized Malayalam Audio'}</strong>
                  <p class="pillar-desc">${t.purposePillar3Desc || ''}</p>
                </div>
              </div>
              <div class="pillar-item">
                <div class="pillar-icon">🛠️</div>
                <div class="pillar-text">
                  <strong class="pillar-title">${t.purposePillar4Title || 'Fixing Inaccessible & Broken Portals'}</strong>
                  <p class="pillar-desc">${t.purposePillar4Desc || ''}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Feature Usability Guide -->
          <div class="manual-features-section">
            <div class="manual-section-header" style="margin-bottom:12px;">
              <span class="manual-section-icon">💡</span>
              <h3 class="manual-section-title">${t.featureGuideHeading || 'Usability & Functionality Guide for Every Feature'}</h3>
            </div>

            <!-- Feature 1: Scan Page -->
            <div class="feature-manual-card">
              <div class="feat-card-header">
                <span class="feat-badge-icon" style="background:#FEE2E2;color:#DC2626;">🔍</span>
                <h4 class="feat-title">${t.featScanTitle || '1. Scan Page & WCAG Accessibility Audit'}</h4>
              </div>
              <div class="feat-card-body">
                <div class="feat-purpose-box">
                  <span class="feat-label">${isEn ? 'Purpose & What it Solves:' : 'ലക്ഷ്യം (Purpose):'}</span>
                  <p class="feat-text">${t.featScanPurpose || ''}</p>
                </div>
                <div class="feat-usability-box">
                  <span class="feat-label">${isEn ? 'How to Use & Functionality:' : 'ഉപയോഗരീതിയും പ്രവർത്തനവും:'}</span>
                  <p class="feat-text">${t.featScanHow || ''}</p>
                </div>
              </div>
            </div>

            <!-- Feature 2: Dyslexia Friendly Mode -->
            <div class="feature-manual-card">
              <div class="feat-card-header">
                <span class="feat-badge-icon" style="background:#FEF3C7;color:#92400E;">👁️</span>
                <h4 class="feat-title">${t.featDyslexiaTitle || '2. Dyslexia Friendly Mode'}</h4>
              </div>
              <div class="feat-card-body">
                <div class="feat-purpose-box">
                  <span class="feat-label">${isEn ? 'Purpose & What it Solves:' : 'ലക്ഷ്യം (Purpose):'}</span>
                  <p class="feat-text">${t.featDyslexiaPurpose || ''}</p>
                </div>
                <div class="feat-usability-box">
                  <span class="feat-label">${isEn ? 'How to Use & Functionality:' : 'ഉപയോഗരീതിയും പ്രവർത്തനവും:'}</span>
                  <p class="feat-text">${t.featDyslexiaHow || ''}</p>
                </div>
              </div>
              <div class="feat-card-footer">
                <button class="btn-try-feature" id="btn-manual-goto-dyslexia">${t.tryFeatureBtn || 'Try this feature →'}</button>
              </div>
            </div>

            <!-- Feature 3: Find in Page -->
            <div class="feature-manual-card">
              <div class="feat-card-header">
                <span class="feat-badge-icon" style="background:#FEF3C7;color:#D97706;">🔎</span>
                <h4 class="feat-title">${t.featSearchTitle || '3. Find in Page with Point on Page'}</h4>
              </div>
              <div class="feat-card-body">
                <div class="feat-purpose-box">
                  <span class="feat-label">${isEn ? 'Purpose & What it Solves:' : 'ലക്ഷ്യം (Purpose):'}</span>
                  <p class="feat-text">${t.featSearchPurpose || ''}</p>
                </div>
                <div class="feat-usability-box">
                  <span class="feat-label">${isEn ? 'How to Use & Functionality:' : 'ഉപയോഗരീതിയും പ്രവർത്തനവും:'}</span>
                  <p class="feat-text">${t.featSearchHow || ''}</p>
                </div>
              </div>
              <div class="feat-card-footer">
                <button class="btn-try-feature" id="btn-manual-goto-search">${t.tryFeatureBtn || 'Try this feature →'}</button>
              </div>
            </div>

            <!-- Feature 4: Read in Malayalam (TTS) -->
            <div class="feature-manual-card">
              <div class="feat-card-header">
                <span class="feat-badge-icon" style="background:#D1FAE5;color:#065F46;">🔊</span>
                <h4 class="feat-title">${t.featListenTitle || '4. Read in Malayalam (TTS Audio Reader)'}</h4>
              </div>
              <div class="feat-card-body">
                <div class="feat-purpose-box">
                  <span class="feat-label">${isEn ? 'Purpose & What it Solves:' : 'ലക്ഷ്യം (Purpose):'}</span>
                  <p class="feat-text">${t.featListenPurpose || ''}</p>
                </div>
                <div class="feat-usability-box">
                  <span class="feat-label">${isEn ? 'How to Use & Functionality:' : 'ഉപയോഗരീതിയും പ്രവർത്തനവും:'}</span>
                  <p class="feat-text">${t.featListenHow || ''}</p>
                </div>
              </div>
              <div class="feat-card-footer">
                <button class="btn-try-feature" id="btn-manual-goto-listen">${t.tryFeatureBtn || 'Try this feature →'}</button>
              </div>
            </div>

            <!-- Feature 5: Translate & Simplify -->
            <div class="feature-manual-card">
              <div class="feat-card-header">
                <span class="feat-badge-icon" style="background:#EDE9FE;color:#7C3AED;">🌐</span>
                <h4 class="feat-title">${t.featTranslateTitle || '5. Translate & Simplify'}</h4>
              </div>
              <div class="feat-card-body">
                <div class="feat-purpose-box">
                  <span class="feat-label">${isEn ? 'Purpose & What it Solves:' : 'ലക്ഷ്യം (Purpose):'}</span>
                  <p class="feat-text">${t.featTranslatePurpose || ''}</p>
                </div>
                <div class="feat-usability-box">
                  <span class="feat-label">${isEn ? 'How to Use & Functionality:' : 'ഉപയോഗരീതിയും പ്രവർത്തനവും:'}</span>
                  <p class="feat-text">${t.featTranslateHow || ''}</p>
                </div>
              </div>
              <div class="feat-card-footer">
                <button class="btn-try-feature" id="btn-manual-goto-translate">${t.tryFeatureBtn || 'Try this feature →'}</button>
              </div>
            </div>

            <!-- Feature 6: Why Doesn't This Work? (Diagnostics) -->
            <div class="feature-manual-card">
              <div class="feat-card-header">
                <span class="feat-badge-icon" style="background:#EFF6FF;color:#3B82F6;">🛠️</span>
                <h4 class="feat-title">${t.featDiagTitle || "6. Why Doesn't This Work? (Element Diagnostics)"}</h4>
              </div>
              <div class="feat-card-body">
                <div class="feat-purpose-box">
                  <span class="feat-label">${isEn ? 'Purpose & What it Solves:' : 'ലക്ഷ്യം (Purpose):'}</span>
                  <p class="feat-text">${t.featDiagPurpose || ''}</p>
                </div>
                <div class="feat-usability-box">
                  <span class="feat-label">${isEn ? 'How to Use & Functionality:' : 'ഉപയോഗരീതിയും പ്രവർത്തനവും:'}</span>
                  <p class="feat-text">${t.featDiagHow || ''}</p>
                </div>
              </div>
              <div class="feat-card-footer">
                <button class="btn-try-feature" id="btn-manual-goto-diagnostics">${t.tryFeatureBtn || 'Try this feature →'}</button>
              </div>
            </div>
          </div>

          <!-- Refresh Guide Card -->
          <div class="manual-refresh-guide-card">
            <div class="refresh-guide-header">
              <span class="refresh-guide-icon">🔄</span>
              <div>
                <h4 class="refresh-guide-title">${isEn ? 'Universal Refresh Functionality' : 'റീഫ്രഷ് (Fresh State) സങ്കേതം'}</h4>
                <p class="refresh-guide-desc">${isEn
                  ? 'Every feature includes a Refresh button to restore it to a pristine initial state — clearing overlays, resetting audio, or re-scanning the page.'
                  : 'ഓരോ ഫീച്ചറിലും "റീഫ്രഷ്" ബട്ടൺ ഉണ്ട്. അത് ഉപയോഗിച്ച് ഓവർലേകൾ ക്ലിയർ ചെയ്തോ ഓഡിയോ റീസെറ്റ് ചെയ്തോ പേജ് വീണ്ടും സ്കാൻ ചെയ്തോ ആദ്യ അവസ്ഥ വീണ്ടെടുക്കാം.'}</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    `;

    attachEvents();
  }

  function attachEvents() {
    const gotoDyslexiaBtn = container.querySelector('#btn-manual-goto-dyslexia');
    if (gotoDyslexiaBtn) {
      gotoDyslexiaBtn.addEventListener('click', () => { if (onNavigate) onNavigate('dyslexia'); });
    }

    const gotoSearchBtn = container.querySelector('#btn-manual-goto-search');
    if (gotoSearchBtn) {
      gotoSearchBtn.addEventListener('click', () => { if (onNavigate) onNavigate('search'); });
    }

    const gotoListenBtn = container.querySelector('#btn-manual-goto-listen');
    if (gotoListenBtn) {
      gotoListenBtn.addEventListener('click', () => { if (onNavigate) onNavigate('listen'); });
    }

    const gotoTranslateBtn = container.querySelector('#btn-manual-goto-translate');
    if (gotoTranslateBtn) {
      gotoTranslateBtn.addEventListener('click', () => { if (onNavigate) onNavigate('translate'); });
    }

    const gotoDiagnosticsBtn = container.querySelector('#btn-manual-goto-diagnostics');
    if (gotoDiagnosticsBtn) {
      gotoDiagnosticsBtn.addEventListener('click', () => { if (onNavigate) onNavigate('diagnostics'); });
    }
  }

  render();
}
