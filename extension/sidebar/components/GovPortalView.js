/**
 * Government Portal Mode Component (View: 'portal')
 * Specifically tuned for UIDAI, Income Tax, DigiLocker, Passport Seva, Parivahan.
 * Converts complex Hindi & English government instructions into simple Malayalam for elderly and dyslexic citizens.
 */

import { govPortalService } from '../../services/govPortalService.js';
import { ttsService } from '../../services/ttsService.js';
import { getT } from '../i18n.js';

export function renderGovPortalView(container, state, setState, onNavigate) {
  let selectedPortalId = state.selectedGovPortalId || "uidai";
  let isSimplified = state.isGovPortalSimplified || false;
  let hasConverted = state.hasConvertedGovPortal || true;
  let isConverting = state.isConvertingGovPortal || false;

  const currentLang = state.currentLang || 'ml';
  const t = getT(currentLang);
  const portal = govPortalService.getPortalById(selectedPortalId);
  const allPortals = govPortalService.getAllPortals();

  function render() {
    container.innerHTML = `
      <div class="view-panel gov-portal-view animate-fade-in" id="panel-gov-portal" role="region" aria-label="Government Portal Assistant">
        
        <!-- Header Strip -->
        <div class="gov-header-box">
          <div class="gov-badge-pill">
            <span>🏛️ കേന്ദ്ര സർക്കാർ ഇ-പോർട്ടൽ സഹായി</span>
          </div>
          <h2 class="view-heading-ml">സർക്കാർ പോർട്ടൽ മോഡ് (Gov Portal Mode)</h2>
          <p class="view-subheading-en">Translates complex Hindi & English government forms and jargon into simple Malayalam for senior citizens and dyslexic individuals.</p>
        </div>

        <!-- Portal Preset Selector Dropdown -->
        <div class="portal-selector-card">
          <label class="setting-label" for="select-gov-portal">പോർട്ടൽ തിരഞ്ഞെടുക്കുക (Select Portal):</label>
          <select id="select-gov-portal" class="custom-select portal-dropdown">
            ${allPortals.map(p => `
              <option value="${p.id}" ${p.id === selectedPortalId ? 'selected' : ''}>
                ${p.icon} ${p.name}
              </option>
            `).join('')}
          </select>
        </div>

        <!-- Official Portal Instructions (English / Hindi Source) -->
        <div class="source-gov-box">
          <div class="source-header-row">
            <span class="source-label">ഔദ്യോഗിക നിർദ്ദേശം (Official English / Hindi)</span>
            <span class="lang-tag">EN / HI</span>
          </div>
          <p class="source-text-en">${portal.sampleEnglish}</p>
        </div>

        <!-- Convert / Translate CTA -->
        <div class="gov-cta-row">
          <button class="btn-primary-cta ${isConverting ? 'loading' : ''}" id="btn-convert-gov-instructions">
            ${isConverting ? `
              <span class="spinner-icon"></span>
              <span>മലയാളത്തിലേക്ക് മാറ്റുന്നു...</span>
            ` : `
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M5 8l6 6M4 14l6-6 3 3M2 5h12M7 2h1M22 22l-5-10-5 10M14 18h6"></path>
              </svg>
              <span>സ്വാഭാവിക മലയാളത്തിലേക്ക് മാറ്റുക</span>
            `}
          </button>
        </div>

        <!-- Malayalam Translation Output Card with Simplification Toggle -->
        ${hasConverted ? `
          <div class="gov-result-card">
            <div class="result-top-bar">
              <span class="result-badge-pill">${isSimplified ? '✨ ലളിതമായ രൂപം (Simplified for Seniors)' : 'മലയാളം വിവരണം (Natural)'}</span>
              
              <!-- Simplify Toggle -->
              <label class="toggle-switch-label" for="toggle-simplify-gov">
                <span class="toggle-text">ലളിതമാക്കുക</span>
                <div class="switch-ui">
                  <input type="checkbox" id="toggle-simplify-gov" ${isSimplified ? 'checked' : ''}>
                  <span class="slider-round"></span>
                </div>
              </label>
            </div>

            <p class="gov-translated-text ${isSimplified ? 'simplified-highlight' : ''}" lang="ml">
              ${isSimplified ? portal.malayalamSimplified : portal.malayalamNatural}
            </p>

            <div class="gov-result-actions">
              <button class="btn-action-small" id="btn-listen-gov-tts">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                  <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                </svg>
                <span>മലയാളത്തിൽ കേൾക്കുക (Listen)</span>
              </button>

              <button class="btn-action-small secondary" id="btn-copy-gov-text">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
                <span id="gov-copy-label">പകർത്തുക</span>
              </button>
            </div>
          </div>
        ` : ''}

        <!-- Jargon Buster / Bureaucratic Terms Glossary -->
        <div class="jargon-glossary-card">
          <h3 class="jargon-title">
            <span>📚 സർക്കാർ പദാവലി ലളിത നിഘണ്ടു (Jargon Glossary)</span>
          </h3>
          <p class="jargon-subtitle">കഠിനമായ സാങ്കേതിക പദങ്ങളുടെ എളുപ്പമുള്ള അർത്ഥം:</p>

          <div class="jargon-terms-list">
            ${portal.jargonTerms.map(item => `
              <div class="jargon-term-row">
                <span class="jargon-term-en">${item.term}:</span>
                <span class="jargon-term-ml">${item.ml}</span>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Portal Accessibility Fixes -->
        <div class="gov-fixes-box">
          <h4 class="gov-fixes-title">🛡️ ഈ പോർട്ടലിലെ പ്രവേശനക്ഷമതാ പരിഹാരങ്ങൾ:</h4>
          <ul class="gov-fixes-list">
            ${portal.commonFixes.map(f => `
              <li><span class="check-green">✓</span> <span>${f}</span></li>
            `).join('')}
          </ul>
        </div>

      </div>
    `;

    attachEvents();
  }

  function attachEvents() {
    // Portal Selector
    const portalSelect = container.querySelector('#select-gov-portal');
    if (portalSelect) {
      portalSelect.addEventListener('change', (e) => {
        selectedPortalId = e.target.value;
        setState({ selectedGovPortalId: selectedPortalId });
        render();
      });
    }

    // Convert Button
    const convertBtn = container.querySelector('#btn-convert-gov-instructions');
    if (convertBtn) {
      convertBtn.addEventListener('click', async () => {
        isConverting = true;
        setState({ isConvertingGovPortal: true });
        render();

        await new Promise(r => setTimeout(r, 600));
        isConverting = false;
        hasConverted = true;
        setState({ isConvertingGovPortal: false, hasConvertedGovPortal: true });
        render();
      });
    }

    // Simplify Toggle
    const simplifyToggle = container.querySelector('#toggle-simplify-gov');
    if (simplifyToggle) {
      simplifyToggle.addEventListener('change', (e) => {
        isSimplified = e.target.checked;
        setState({ isGovPortalSimplified: isSimplified });
        render();
      });
    }

    // Listen Aloud TTS
    const listenBtn = container.querySelector('#btn-listen-gov-tts');
    if (listenBtn) {
      listenBtn.addEventListener('click', () => {
        const text = isSimplified ? portal.malayalamSimplified : portal.malayalamNatural;
        if ('speechSynthesis' in window) {
          window.speechSynthesis.cancel();
          const utterance = new SpeechSynthesisUtterance(text);
          utterance.rate = 0.9; // slightly slower for clarity for seniors
          window.speechSynthesis.speak(utterance);
        }
      });
    }

    // Copy Button
    const copyBtn = container.querySelector('#btn-copy-gov-text');
    if (copyBtn) {
      copyBtn.addEventListener('click', () => {
        const text = isSimplified ? portal.malayalamSimplified : portal.malayalamNatural;
        navigator.clipboard?.writeText(text);
        const label = copyBtn.querySelector('#gov-copy-label');
        if (label) {
          label.textContent = "✓ പകർത്തപ്പെട്ടു!";
          setTimeout(() => { if (label) label.textContent = "പകർത്തുക"; }, 1800);
        }
      });
    }
  }

  render();
}
