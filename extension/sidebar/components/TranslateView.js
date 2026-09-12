/**
 * Translate View Component (Tab: 'translate')
 * Provides bilingual page translation (English/Hindi -> Malayalam), text simplification toggle,
 * audio playback bridge, and dynamic language detection with i18n support.
 */

import { translateText } from '../../services/translateService.js';
import { ttsService } from '../../services/ttsService.js';
import { getT } from '../i18n.js';

export function renderTranslateView(container, state, setState, onNavigate) {
  let isTranslating = state.isTranslating || false;
  let hasTranslated = state.hasTranslated || false;
  let isSimplified = state.isSimplified || false;
  let translatedData = state.translatedData || null;
  let translateError = state.translateError || '';
  const currentLang = state.currentLang || 'ml';
  const t = getT(currentLang);

  const escapeHTML = (value) => String(value || '').replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[character]);

  const detectedLabelText = translatedData?.detectedLangLabel
    ? (currentLang === 'ml' ? `കണ്ടെത്തിയത്: ${translatedData.detectedLangLabel}` : `Detected: ${translatedData.detectedLangLabelEn || translatedData.detectedLangLabel}`)
    : t.detectedLabel;

  function render() {
    container.innerHTML = `
      <div class="view-panel translate-view animate-fade-in" id="panel-translate" role="tabpanel" aria-labelledby="tab-translate">
        
        <!-- Detected Language Bar -->
        <div class="meta-strip">
          <div class="detected-lang-pill">
            <span class="dot-indicator"></span>
            <span class="lang-text">${detectedLabelText}</span>
          </div>
          <span class="domain-tag" title="${state.scanReport?.url || ''}">${state.scanReport?.meta?.title || 'Active Webpage'}</span>
        </div>

        <!-- Section Title -->
        <div class="section-title-group">
          <h2 class="view-heading-ml">${t.translateHeading}</h2>
          <p class="view-subheading-en">${t.translateSubheading}</p>
        </div>

        <!-- Primary Action Button -->
        <div class="cta-container">
          <button class="btn-primary-cta ${isTranslating ? 'loading' : ''}" id="btn-trigger-translate" ${isTranslating ? 'disabled' : ''}>
            ${isTranslating ? `
              <span class="spinner-icon"></span>
              <span>${t.translatingText}</span>
            ` : `
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M5 8l6 6M4 14l6-6 3 3M2 5h12M7 2h1M22 22l-5-10-5 10M14 18h6"></path>
              </svg>
              <span>${t.btnTranslate}</span>
            `}
          </button>
        </div>

        <!-- Translation Content Output Panel -->
        <div class="translation-output-card ${hasTranslated ? 'has-content' : 'is-empty'}">
          <div class="output-card-header">
            <div class="output-header-left">
              <span class="output-badge">${isSimplified ? t.simplifiedBadge : t.fullBadge}</span>
              ${hasTranslated ? `<span class="word-count-badge">${isSimplified ? (translatedData?.simplified || '').split(/\s+/).filter(Boolean).length : translatedData?.wordCount || 0} words</span>` : ''}
            </div>

            <!-- Inline Simplify Toggle Switch -->
            ${hasTranslated ? `
              <div class="simplify-toggle-wrapper">
                <label class="toggle-switch-label" for="switch-simplify">
                  <span class="toggle-text">${t.simplifyToggle}</span>
                  <div class="switch-ui">
                    <input type="checkbox" id="switch-simplify" ${isSimplified ? 'checked' : ''} aria-label="Toggle simplified language">
                    <span class="slider-round"></span>
                  </div>
                </label>
              </div>
            ` : ''}
          </div>

          <div class="output-card-body" id="translate-content-body">
            ${isTranslating ? `
              <div class="skeleton-loader-group">
                <div class="skeleton-line full"></div>
                <div class="skeleton-line long"></div>
                <div class="skeleton-line medium"></div>
                <div class="skeleton-line short"></div>
              </div>
            ` : hasTranslated ? `
              <p class="translated-text-content ${isSimplified ? 'simplified-mode' : ''}" lang="ml">
                ${escapeHTML(isSimplified ? translatedData?.simplified : translatedData?.translated)}
              </p>
            ` : translateError ? `
              <div class="placeholder-state" role="alert">
                <p class="placeholder-text-en">${escapeHTML(translateError)}</p>
              </div>
            ` : `
              <div class="placeholder-state">
                <div class="placeholder-icon-wrap">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#64748B" stroke-width="1.5">
                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
                  </svg>
                </div>
                <p class="placeholder-text-ml">${t.placeholderMl}</p>
                <p class="placeholder-text-en">${t.placeholderEn}</p>
              </div>
            `}
          </div>

          <!-- Bottom Action Buttons when translated -->
          ${hasTranslated ? `
            <div class="output-actions-bar">
              <button class="btn-action-small" id="btn-quick-listen" title="Listen with TTS">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                  <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                </svg>
                <span>${t.btnListen}</span>
              </button>
              
              <button class="btn-action-small secondary" id="btn-copy-translation" title="Copy text to clipboard">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
                <span id="copy-label">${t.btnCopy}</span>
              </button>
            </div>
          ` : ''}
        </div>
      </div>
    `;

    attachEvents();
  }

  function attachEvents() {
    const translateBtn = container.querySelector('#btn-trigger-translate');
    if (translateBtn) {
      translateBtn.addEventListener('click', async () => {
        isTranslating = true;
        translateError = '';
        setState({ isTranslating: true, translateError: '' });
        render();

        try {
          const segments = state.scanReport?.textSegments;
          const sourceText = (segments && segments.length > 0)
            ? segments.map(s => s.text).filter(Boolean).join('\n\n')
            : '';
          const res = await translateText(sourceText);
          if (!res?.success || !res.translated || !res.simplified) throw new Error('No translated text was returned.');
          isTranslating = false;
          hasTranslated = true;
          translatedData = res;
          setState({ isTranslating: false, hasTranslated: true, translatedData: res, translateError: '' });
          render();
        } catch (e) {
          isTranslating = false;
          hasTranslated = false;
          translateError = e?.userMessage || e?.message || 'Translation could not be completed. Please try again.';
          setState({ isTranslating: false, hasTranslated: false, translatedData: null, translateError });
          render();
        }
      });
    }

    const simplifyToggle = container.querySelector('#switch-simplify');
    if (simplifyToggle) {
      simplifyToggle.addEventListener('change', (e) => {
        isSimplified = e.target.checked;
        setState({ isSimplified });
        render();
      });
    }

    const quickListenBtn = container.querySelector('#btn-quick-listen');
    if (quickListenBtn) {
      quickListenBtn.addEventListener('click', () => {
        const textToListen = isSimplified ? (translatedData?.simplified || translatedData?.translated) : (translatedData?.translated || translatedData?.simplified);
        if (textToListen) {
          const lines = textToListen.split('\n').map(s => s.trim()).filter(Boolean);
          const ttsSegs = lines.map((sent, idx) => ({
            id: `trans-seg-${idx}`,
            type: 'PARAGRAPH',
            tag: `പരിഭാഷ (${idx + 1})`,
            malayalamText: sent,
            englishText: sent,
            selector: `[data-thunai-seg="seg-${idx}"]`,
            durationMs: Math.max(3000, sent.length * 65)
          }));
          ttsService.loadSegments(ttsSegs);
        }
        if (onNavigate) onNavigate('listen');
      });
    }

    const copyBtn = container.querySelector('#btn-copy-translation');
    if (copyBtn) {
      copyBtn.addEventListener('click', () => {
        const textToCopy = isSimplified ? translatedData?.simplified : translatedData?.translated;
        navigator.clipboard?.writeText(textToCopy);
        const label = copyBtn.querySelector('#copy-label');
        if (label) {
          label.textContent = t.copiedText;
          setTimeout(() => {
            if (label) label.textContent = t.btnCopy;
          }, 2000);
        }
      });
    }
  }

  render();
}
