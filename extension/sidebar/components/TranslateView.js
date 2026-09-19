/**
 * Translate View Component (Tab: 'translate')
 * Provides bilingual page translation (English/Hindi -> Malayalam), text simplification toggle,
 * audio playback bridge, live language detection per active URL, and race-condition protection.
 */

import { translateText, getActivePageInfo, spotlightArea, clearAreaSpotlight } from '../../services/translateService.js';
import { ttsService } from '../../services/ttsService.js';
import { getT } from '../i18n.js';

export function extractSentenceSegments(translatedText, originalText = '', pageTitle = 'പരിഭാഷ') {
  if (!translatedText) return [];
  const transSentences = translatedText
    .split(/(?<=[.!?।])(?!\d)(?:\s+|\n+)|(?<=[.!?।])(?=[\u0D00-\u0D7F\u0900-\u097FA-Z])|\n+/)
    .map(s => s.trim())
    .filter(s => s.length > 0);

  const origSentences = (originalText || '')
    .split(/(?<=[.!?।])(?!\d)(?:\s+|\n+)|(?<=[.!?।])(?=[\u0D00-\u0D7F\u0900-\u097FA-Z])|\n+/)
    .map(s => s.trim())
    .filter(s => s.length > 0);

  return transSentences.map((sent, idx) => ({
    id: `trans-seg-${idx}`,
    type: 'PARAGRAPH',
    tag: `${pageTitle} (${idx + 1})`,
    malayalamText: sent,
    englishText: origSentences[idx] || sent,
    text: sent,
    selector: `[data-thunai-seg="seg-${idx}"]`,
    durationMs: Math.max(3000, sent.length * 65)
  }));
}

export function renderTranslateView(container, state, setState, onNavigate) {
  let isTranslating = state.isTranslating || false;
  let hasTranslated = state.hasTranslated || false;
  let isSimplified = state.isSimplified || false;
  let translatedData = state.translatedData || null;
  let translateError = state.translateError || '';
  let selectedAreaId = state.selectedAreaId || 'all';
  let areas = Array.isArray(state.activePageAreas) && state.activePageAreas.length > 0
    ? state.activePageAreas
    : (Array.isArray(state.areas) ? state.areas : []);
  const currentLang = state.currentLang || 'ml';
  const t = getT(currentLang);

  // Background hydration of areas if not yet present in state
  if (areas.length === 0 && !state._areasHydrated) {
    getActivePageInfo().then(info => {
      if (info && Array.isArray(info.areas) && info.areas.length > 0) {
        areas = info.areas;
        setState({ activePageAreas: info.areas, _areasHydrated: true });
        render();
      } else {
        setState({ _areasHydrated: true });
      }
    }).catch(() => {});
  }

  const escapeHTML = (value) => String(value || '').replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[character]);

  const detectedLabelText = (hasTranslated && translatedData?.detectedLangLabel)
    ? (currentLang === 'ml' ? `കണ്ടെത്തിയത്: ${translatedData.detectedLangLabel}` : `Detected: ${translatedData.detectedLangLabelEn || translatedData.detectedLangLabel}`)
    : (state.activePageLangLabel
        ? (currentLang === 'ml' ? `കണ്ടെത്തിയത്: ${state.activePageLangLabel}` : `Detected: ${state.activePageLangLabelEn}`)
        : t.detectedLabel);

  const pageTitleDisplay = state.activePageTitle || state.scanReport?.meta?.title || 'Active Webpage';

  function render() {
    const selectedArea = areas.find(a => a.id === selectedAreaId) || areas[0] || null;

    container.innerHTML = `
      <div class="view-panel translate-view animate-fade-in" id="panel-translate" role="tabpanel" aria-labelledby="tab-translate">
        
        <!-- Detected Language Bar -->
        <div class="meta-strip">
          <div class="detected-lang-pill">
            <span class="dot-indicator"></span>
            <span class="lang-text">${detectedLabelText}</span>
          </div>
          <div style="display: flex; align-items: center; gap: 6px;">
            <span class="domain-tag" title="${state.activePageUrl || state.scanReport?.url || ''}">${escapeHTML(pageTitleDisplay)}</span>
            <button class="btn-refresh-pill" id="btn-refresh-translate" title="${t.refreshTooltip || 'Reset translation to fresh state'}">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3">
                <path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
              </svg>
              <span>${t.refreshBtn ? t.refreshBtn.split(' ')[0] : 'റീഫ്രഷ്'}</span>
            </button>
          </div>
        </div>

        <!-- Section Title -->
        <div class="section-title-group">
          <h2 class="view-heading-ml">${t.translateHeading}</h2>
          <p class="view-subheading-en">${t.translateSubheading}</p>
        </div>

        <!-- Multi-Area Selection Panel (shown only if multiple areas are detected) -->
        ${areas.length > 1 ? `
          <div class="translate-area-selector-card" id="translate-area-card">
            <div class="area-card-header">
              <div class="area-card-title-group">
                <span class="area-card-icon">🎯</span>
                <label for="select-translate-area" class="area-card-title">${t.selectAreaTitle}</label>
              </div>
              <span class="area-count-pill">${areas.length - 1} ${t.areasDetected}</span>
            </div>

            <div class="area-dropdown-row">
              <select id="select-translate-area" class="area-select-input" aria-label="${t.selectAreaTitle}">
                ${areas.map(area => `
                  <option value="${area.id}" ${area.id === selectedAreaId ? 'selected' : ''}>
                    ${area.id === 'all' 
                      ? (currentLang === 'ml' ? t.wholePageOption : '🌐 Whole Webpage') 
                      : (currentLang === 'ml' ? escapeHTML(area.name) : escapeHTML(area.nameEn || area.name))} (${area.wordCount} ${currentLang === 'ml' ? 'വാക്കുകൾ' : 'words'})
                  </option>
                `).join('')}
              </select>
            </div>

            <div class="area-action-row">
              <button type="button" class="btn-point-area" id="btn-point-area" title="${t.showAreaOnPage}" aria-label="${t.showAreaOnPage}">
                <span class="point-icon">👉</span>
                <span class="point-text">${(t.showAreaOnPage || 'പേജിൽ കാണിക്കുക').replace(/^[👉\s]+/, '')}</span>
              </button>
            </div>

            <!-- Area Preview Snippet -->
            <div class="area-preview-snippet" id="area-preview-snippet">
              <span class="preview-label">${t.areaPreviewLabel}</span>
              <span class="preview-text">${escapeHTML(selectedArea?.snippet || selectedArea?.text?.slice(0, 140) || '')}</span>
            </div>
          </div>
        ` : ''}

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
              <span>${(selectedArea && selectedArea.id !== 'all') ? `${t.btnTranslate} (${currentLang === 'ml' ? selectedArea.name : (selectedArea.nameEn || selectedArea.name)})` : t.btnTranslate}</span>
            `}
          </button>
        </div>

        <!-- Translation Content Output Panel -->
        <div class="translation-output-card ${hasTranslated ? 'has-content' : 'is-empty'}">
          <div class="output-card-header">
            <div class="output-header-left">
              <span class="output-badge">${isSimplified ? t.simplifiedBadge : t.fullBadge}</span>
              ${hasTranslated ? `<span class="word-count-badge">${isSimplified ? (translatedData?.simplified || '').split(/\s+/).filter(Boolean).length : translatedData?.wordCount || 0} words</span>` : ''}
              ${(hasTranslated && translatedData?.areaId && translatedData.areaId !== 'all') ? `
                <span class="translated-area-pill" title="${t.translatedAreaLabel}">
                  🎯 ${escapeHTML(currentLang === 'ml' ? translatedData.areaName : (translatedData.areaNameEn || translatedData.areaName))}
                </span>
              ` : ''}
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
              <div class="translated-text-container" lang="ml">
                ${(isSimplified ? (translatedData?.simplified || '') : (translatedData?.translated || ''))
                  .split('\n\n')
                  .filter(Boolean)
                  .map(para => `<p class="translated-text-content ${isSimplified ? 'simplified-mode' : ''}">${escapeHTML(para)}</p>`)
                  .join('') || `<p class="translated-text-content">${escapeHTML(translatedData?.translated || '')}</p>`}
              </div>
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

              ${(translatedData?.areaSelector && translatedData.areaId !== 'all') ? `
                <button class="btn-action-small btn-resoptlight-area" id="btn-re-spotlight-area" title="${t.showAreaOnPage}">
                  <span>👉</span>
                  <span>${t.showAreaOnPage}</span>
                </button>
              ` : ''}
              
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
    const _normUrl = (u) => {
      if (!u) return '';
      const fn = window.ThunaiInstance?.normalizeUrl?.bind(window.ThunaiInstance);
      if (fn) return fn(u);
      try {
        const p = new URL(u);
        return `${p.protocol}//${p.host}${p.pathname.replace(/\/+$/, '') || '/'}${p.search}`.toLowerCase();
      } catch (_) {
        return String(u).trim().replace(/\/+$/, '').toLowerCase();
      }
    };

    const isStaleNavigation = (startedUrl) => {
      const liveState = window.ThunaiInstance?.state || state;
      const currentUrl = liveState.activePageUrl || '';
      return Boolean(startedUrl && currentUrl && _normUrl(startedUrl) !== _normUrl(currentUrl));
    };

    // Area Selection Dropdown Change
    const areaSelect = container.querySelector('#select-translate-area');
    if (areaSelect) {
      areaSelect.addEventListener('change', (e) => {
        selectedAreaId = e.target.value;
        setState({ selectedAreaId });
        render();
      });
    }

    // "👉 Show on Page / പേജിൽ കാണിക്കുക" Visual Spotlight
    const pointAreaBtn = container.querySelector('#btn-point-area');
    if (pointAreaBtn) {
      pointAreaBtn.addEventListener('click', async () => {
        const targetArea = areas.find(a => a.id === selectedAreaId) || areas[0];
        if (!targetArea) return;

        const displayName = currentLang === 'ml' 
          ? (targetArea.name || 'തിരഞ്ഞെടുത്ത ഭാഗം') 
          : (targetArea.nameEn || targetArea.name || 'Selected Content Area');

        await spotlightArea(targetArea.selector, displayName);

        pointAreaBtn.classList.add('spotlight-active');
        const origText = pointAreaBtn.innerHTML;
        pointAreaBtn.innerHTML = `<span>📍</span> <span>${t.areaSpotlightActive || 'പേജിൽ കാണിച്ചു'}</span>`;
        setTimeout(() => {
          if (pointAreaBtn) {
            pointAreaBtn.classList.remove('spotlight-active');
            pointAreaBtn.innerHTML = origText;
          }
        }, 2200);
      });
    }

    // Re-spotlight area from output card button
    const reSpotlightBtn = container.querySelector('#btn-re-spotlight-area');
    if (reSpotlightBtn) {
      reSpotlightBtn.addEventListener('click', async () => {
        if (translatedData?.areaSelector) {
          const name = currentLang === 'ml' ? (translatedData.areaName || 'പരിഭാഷാ ഭാഗം') : (translatedData.areaNameEn || 'Translated Area');
          await spotlightArea(translatedData.areaSelector, name);
        }
      });
    }

    // Primary Translation Button
    const translateBtn = container.querySelector('#btn-trigger-translate');
    if (translateBtn) {
      translateBtn.addEventListener('click', async () => {
        let startedUrl = state.activePageUrl || window.ThunaiInstance?.state?.activePageUrl || '';

        isTranslating = true;
        translateError = '';
        setState({ isTranslating: true, translateError: '' });
        render();

        try {
          // Explicitly extract fresh page content from active tab
          const pageInfo = await getActivePageInfo();
          startedUrl = pageInfo?.url || startedUrl;

          if (Array.isArray(pageInfo?.areas) && pageInfo.areas.length > 0) {
            areas = pageInfo.areas;
          }

          let sourceText = pageInfo?.fullText || state.activePageText || '';
          let currentTargetArea = null;

          if (selectedAreaId && selectedAreaId !== 'all') {
            currentTargetArea = areas.find(a => a.id === selectedAreaId);
            if (currentTargetArea && currentTargetArea.text) {
              sourceText = currentTargetArea.text;
            }
          }

          console.log('[Thunai Translate] selectedAreaId:', selectedAreaId);
          console.log('[Thunai Translate] source length:', sourceText.length);
          console.log('[Thunai Translate] source preview:', sourceText.slice(0, 300));
          console.log('[Thunai Translate] source URL:', startedUrl);
          console.log('[Thunai Translate] page langCode:', pageInfo?.langCode);

          const explicitSourceLang = (pageInfo?.langCode === 'hi') ? 'hi' : 'auto';
          console.log('[Thunai Translate] explicitSourceLang:', explicitSourceLang);

          const res = await translateText(sourceText, 'ml', explicitSourceLang, startedUrl);

          console.log('[Thunai Translate] translated length:', res.translated?.length);
          console.log('[Thunai Translate] translated preview:', res.translated?.slice(0, 300));
          console.log('[Thunai Translate] detectedLang:', res.detectedLang);

          // Stale response / Race condition protection: Discard ONLY if user navigated to a different page URL
          if (isStaleNavigation(startedUrl)) {
            console.warn('[Thunai Translate] Discarded stale translation response because active page URL changed from', startedUrl, 'to', window.ThunaiInstance?.state?.activePageUrl);
            return;
          }

          if (!res?.success || !res.translated || !res.simplified) throw new Error('No translated text was returned.');
          isTranslating = false;
          hasTranslated = true;

          // Stamp target area metadata onto translatedData
          if (currentTargetArea) {
            res.areaId = currentTargetArea.id;
            res.areaName = currentTargetArea.name;
            res.areaNameEn = currentTargetArea.nameEn || currentTargetArea.name;
            res.areaSelector = currentTargetArea.selector;
          } else {
            res.areaId = 'all';
            res.areaName = currentLang === 'ml' ? t.wholePageOption : 'Whole Webpage';
            res.areaNameEn = 'Whole Webpage';
            res.areaSelector = 'body';
          }
          translatedData = res;

          // Prime translated sentence segments into TTS service
          const transSegs = extractSentenceSegments(res.translated, res.original, (currentTargetArea ? currentTargetArea.name : pageTitleDisplay) || 'പരിഭാഷ');
          if (transSegs.length > 0) {
            ttsService.loadSegments(transSegs);
            console.log('[Thunai TTS] totalSegments:', ttsService.getState().totalSegments);
          }

          setState({
            isTranslating: false,
            hasTranslated: true,
            translatedData: res,
            translateError: '',
            activePageAreas: areas,
            selectedAreaId,
            activePageLang: res.detectedLang,
            activePageLangLabel: res.detectedLangLabel,
            activePageLangLabelEn: res.detectedLangLabelEn
          });
          render();
        } catch (e) {
          if (isStaleNavigation(startedUrl)) {
            return;
          }
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
          const ttsSegs = extractSentenceSegments(textToListen, translatedData?.original, pageTitleDisplay || 'പരിഭാഷ');
          if (ttsSegs.length > 0) {
            ttsService.loadSegments(ttsSegs);
          }
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

    const refreshTranslateBtn = container.querySelector('#btn-refresh-translate');
    if (refreshTranslateBtn) {
      refreshTranslateBtn.addEventListener('click', async () => {
        isTranslating = false;
        hasTranslated = false;
        isSimplified = false;
        translatedData = null;
        translateError = '';
        selectedAreaId = 'all';

        try {
          await clearAreaSpotlight();
        } catch (_) {}

        setState({
          isTranslating: false,
          hasTranslated: false,
          isSimplified: false,
          translatedData: null,
          translateError: '',
          selectedAreaId: 'all'
        });
        render();
      });
    }
  }

  render();
}
