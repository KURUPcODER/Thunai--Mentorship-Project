/**
 * Listen / Reader View Component (Tab: 'listen')
 * Provides segment-by-segment Malayalam TTS playback, speech speed slider, voice picker,
 * audio equalizer animation, and live page highlight synchronization.
 */

import { ttsService } from '../../services/ttsService.js';
import { extractSentenceSegments } from './TranslateView.js';
import { translateText } from '../../services/translateService.js';
import { getT } from '../i18n.js';

export function renderListenView(container, state, setState) {
  const currentLang = state.currentLang || 'ml';
  const t = getT(currentLang);

  // Only render loading state if a scan is actively in-flight
  if (state.isScanning) {
    const isEn = currentLang === 'en';
    container.innerHTML = `
      <div class="view-panel listen-view animate-fade-in" id="panel-listen" role="tabpanel" aria-labelledby="tab-listen">
        <div class="scan-pipeline-progress-card animate-fade-in" style="margin: 30px auto; text-align: center;">
          <div class="spinner-large"></div>
          <h3 class="loading-title" style="margin-top: 14px;">${isEn ? 'Loading Page Audio...' : 'പേജ് ഉള്ളടക്കം ലഭ്യമാക്കുന്നു...'}</h3>
        </div>
      </div>
    `;
    return;
  }

  // If webpage has active Malayalam translation data, load ALL translated sentence segments for TTS!
  if (state.hasTranslated && state.translatedData && (state.translatedData.translated || state.translatedData.simplified)) {
    const textToRead = state.isSimplified 
      ? (state.translatedData.simplified || state.translatedData.translated)
      : (state.translatedData.translated || state.translatedData.simplified);
    const transSegs = extractSentenceSegments(textToRead, state.translatedData.original, state.activePageTitle || 'പരിഭാഷ');
    if (transSegs.length > 0) {
      const cur = ttsService.getState();
      const alreadyLoaded = cur.segments.length === transSegs.length && cur.segments[0]?.malayalamText === transSegs[0]?.malayalamText;
      if (!alreadyLoaded) {
        ttsService.loadSegments(transSegs);
      }
    }
  } else if (!state.hasTranslated && state.scanReport?.textSegments && state.scanReport.textSegments.length > 0) {
    // Otherwise hydrate segment-by-segment playback from universal scanReport ONLY if not translated
    const cur = ttsService.getState();
    if (cur.segments.length === 0) {
      ttsService.loadSegments(state.scanReport.textSegments);
    }
  } else {
    // Fallback: If neither translated nor scanned yet, hydrate from active page text or init
    const cur = ttsService.getState();
    if (cur.segments.length === 0) {
      if (state.activePageText) {
        const pageSegs = extractSentenceSegments(state.activePageText, state.activePageText, state.activePageTitle || 'പേജ് ഉള്ളടക്കം');
        if (pageSegs.length > 0) {
          ttsService.loadSegments(pageSegs);
        }
      } else {
        ttsService.initRealPageSegments();
      }
    }
  }

  // Auto-translate English/Hindi page text to natural Malayalam for reading if not already translated
  const isNonMalayalamPage = state.activePageText && !/[\u0D00-\u0D7F]/.test(state.activePageText);
  if (!state.hasTranslated && !state._isAudioTranslating && isNonMalayalamPage) {
    state._isAudioTranslating = true;
    translateText(state.activePageText, 'ml').then(res => {
      state._isAudioTranslating = false;
      if (res && res.translated) {
        setState({
          hasTranslated: true,
          translatedData: res,
          activePageLang: res.detectedLang,
          activePageLangLabel: res.detectedLangLabel,
          activePageLangLabelEn: res.detectedLangLabelEn
        });
        const transSegs = extractSentenceSegments(res.translated, res.original, state.activePageTitle || 'പരിഭാഷ');
        if (transSegs.length > 0) {
          ttsService.loadSegments(transSegs);
        }
        render();
      }
    }).catch(() => {
      state._isAudioTranslating = false;
    });
  }

  let ttsState = ttsService.getState();

  function triggerInPageHighlight(selector) {
    if (typeof chrome !== 'undefined' && chrome.tabs) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs && tabs[0]) {
          chrome.tabs.sendMessage(tabs[0].id, {
            action: 'HIGHLIGHT_SEGMENT',
            selector: selector
          }).catch(() => {});
        }
      });
    } else {
      try {
        if (typeof window !== 'undefined' && window.parent && window.parent.ThunaiContentScript) {
          window.parent.ThunaiContentScript.highlightSegment(selector);
        }
      } catch (_) {}
    }
  }

  function render() {
    const existingPanel = container.querySelector('#panel-listen');
    const savedScrollTop = existingPanel ? existingPanel.scrollTop : 0;
    const savedContainerScrollTop = container ? container.scrollTop : 0;

    ttsState = ttsService.getState();
    const activeTitle = state.activePageTitle ? state.activePageTitle.slice(0, 32) : "കേരളം - വിക്കിപീഡിയ";
    const seg = ttsState.currentSegment || (ttsState.segments && ttsState.segments[0]) || {
      tag: activeTitle,
      type: "PARAGRAPH",
      malayalamText: state.activePageText && /[\u0D00-\u0D7F]/.test(state.activePageText)
        ? state.activePageText.slice(0, 180)
        : "ഇന്ത്യയുടെ തെക്കുപടിഞ്ഞാറൻ മലബാർ തീരത്ത് സ്ഥിതി ചെയ്യുന്ന ഒരു സംസ്ഥാനമാണ് കേരളം.",
      englishText: state.activePageText && !/[\u0D00-\u0D7F]/.test(state.activePageText)
        ? state.activePageText.slice(0, 180)
        : "Kerala is a state on the southwestern Malabar Coast of India.",
      selector: "p:nth-of-type(1), p, body"
    };
    const segmentsList = ttsState.segments || [];

    container.innerHTML = `
      <div class="view-panel listen-view animate-fade-in" id="panel-listen" role="tabpanel" aria-labelledby="tab-listen">
        
        <!-- Active Page Breadcrumb / Page Title -->
        <div class="listen-page-header">
          <div class="page-source-pill">
            <span class="source-icon">📄</span>
            <span class="source-title" title="${seg.tag || 'കേരളം - വിക്കിപീഡിയ'}">${seg.tag || 'കേരളം - വിക്കിപീഡിയ'}</span>
          </div>
          <div style="display: flex; align-items: center; gap: 6px;">
            <button class="btn-refresh-pill" id="btn-refresh-listen" title="${t.refreshTooltip || 'Reset audio & sync to fresh state'}">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3">
                <path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
              </svg>
              <span>${t.refreshBtn ? t.refreshBtn.split(' ')[0] : 'റീഫ്രഷ്'}</span>
            </button>
            <div class="sync-indicator ${ttsState.isPlaying ? 'active' : ''}" title="Current sentence is synced with page highlight">
              <span class="sync-dot"></span>
              <span class="sync-text">Live Sync</span>
            </div>
          </div>
        </div>

        ${(isNonMalayalamPage || state.activePageLang === 'hi' || state.activePageLang === 'en') ? `
          <div class="reading-in-malayalam-banner animate-fade-in" style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; background: rgba(56, 189, 248, 0.08); border: 1px solid rgba(56, 189, 248, 0.25); border-radius: 8px; padding: 7px 12px; font-size: 11px; color: #38BDF8;">
            <div style="display: flex; align-items: center; gap: 6px;">
              <span>🌐</span>
              <span style="font-weight: 600;">${state.activePageLang === 'hi' ? 'ഹിന്ദി പേജ് മലയാളത്തിൽ വായിക്കുന്നു' : 'English Page Read in Malayalam'}</span>
            </div>
            <span style="font-weight: 700; background: #0284C7; color: white; border-radius: 4px; padding: 2px 7px; font-size: 10px; text-transform: uppercase;">Malayalam TTS</span>
          </div>
        ` : ''}

        <!-- Current Paragraph Display Box (with glowing highlighted left edge) -->
        <div class="reading-segment-card ${ttsState.isPlaying ? 'is-playing' : ''}">
          <div class="segment-meta-header">
            <span class="segment-type-tag">
              <span class="tag-square"></span>
              ${seg.type || 'PARAGRAPH'}
            </span>
            <span class="segment-position-tag">${ttsState.currentSegmentIndex} of ${segmentsList.length || 5}</span>
          </div>

          <p class="segment-malayalam-text" lang="ml">
            ${seg.malayalamText || (state._isAudioTranslating ? (t.translatingAudio || 'മലയാളത്തിൽ കേൾക്കാൻ പരിഭാഷപ്പെടുത്തുന്നു...') : (seg.text || ''))}
          </p>

          ${seg.englishText && seg.englishText !== seg.malayalamText ? `
            <div class="segment-original-box" style="margin-top: 10px; padding-top: 8px; border-top: 1px dashed rgba(255,255,255,0.12);">
              <span style="font-size: 10px; font-weight: 700; color: #94A3B8; text-transform: uppercase; letter-spacing: 0.5px; display: block; margin-bottom: 3px;">
                ${t.originalTextLabel || 'യഥാർത്ഥ ഉള്ളടക്കം (Original):'}
              </span>
              <p class="segment-english-subtext" lang="en" style="font-size: 12px; color: #94A3B8; line-height: 1.5; margin: 0;">
                ${seg.englishText}
              </p>
            </div>
          ` : ''}
        </div>

        <!-- Equalizer Visualizer & Segment Counter -->
        <div class="player-status-strip">
          <div class="segment-counter">
            <span class="counter-number">${ttsState.currentSegmentIndex} / ${ttsState.totalSegments}</span>
            <span class="counter-label">segments</span>
          </div>

          <!-- Soundwave Animation -->
          <div class="audio-equalizer ${ttsState.isPlaying ? 'animating' : ''}" aria-hidden="true">
            <span class="eq-bar bar-1"></span>
            <span class="eq-bar bar-2"></span>
            <span class="eq-bar bar-3"></span>
            <span class="eq-bar bar-4"></span>
            <span class="eq-bar bar-5"></span>
          </div>
        </div>

        <!-- Central Playback Controls Box -->
        <div class="playback-controls-box">
          <div class="controls-row">
            <!-- Prev Segment -->
            <button class="btn-ctrl-secondary" id="btn-prev-segment" title="Previous Segment" aria-label="Previous Segment">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="19 20 9 12 19 4 19 20"></polygon>
                <line x1="5" y1="19" x2="5" y2="5" stroke="currentColor" stroke-width="2"></line>
              </svg>
            </button>

            <!-- Main Play / Pause Circle (Gold Accent) -->
            <button class="btn-ctrl-primary-play ${ttsState.isPlaying ? 'playing' : ''}" id="btn-toggle-play" aria-label="${ttsState.isPlaying ? 'Pause' : 'Play'}">
              ${ttsState.isPlaying ? `
                <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="6" y="4" width="4" height="16" rx="1"></rect>
                  <rect x="14" y="4" width="4" height="16" rx="1"></rect>
                </svg>
              ` : `
                <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor" style="transform: translateX(2px);">
                  <polygon points="5 3 19 12 5 21 5 3"></polygon>
                </svg>
              `}
            </button>

            <!-- Stop Button -->
            <button class="btn-ctrl-secondary" id="btn-stop-playback" title="Stop Playback" aria-label="Stop Playback">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <rect x="5" y="5" width="14" height="14" rx="2"></rect>
              </svg>
            </button>

            <!-- Next Segment -->
            <button class="btn-ctrl-secondary" id="btn-next-segment" title="Next Segment" aria-label="Next Segment">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="5 4 15 12 5 20 5 4"></polygon>
                <line x1="19" y1="5" x2="19" y2="19" stroke="currentColor" stroke-width="2"></line>
              </svg>
            </button>
          </div>

          <!-- Speed Slider with Live Readout -->
          <div class="slider-control-group">
            <div class="slider-header-row">
              <span class="slider-label">വേഗത (Speed):</span>
              <span class="slider-value-display" id="speed-val-readout">${ttsState.playbackSpeed.toFixed(1)}x</span>
            </div>
            <div class="slider-wrapper">
              <input type="range" id="input-tts-speed" min="0.5" max="2.0" step="0.1" value="${ttsState.playbackSpeed}" aria-label="TTS Playback Speed Slider">
            </div>
            <div class="slider-ticks-row">
              <span>0.5x</span>
              <span>1.0x</span>
              <span>2.0x</span>
            </div>
          </div>
        </div>

        <!-- Voice Selection Dropdown -->
        <div class="voice-picker-card">
          <label class="voice-picker-label" for="select-tts-voice">
            <span class="label-ml">ശബ്ദം തിരഞ്ഞെടുക്കുക (Voice)</span>
          </label>
          <div class="custom-select-wrapper">
            <select id="select-tts-voice" class="custom-select" aria-label="Select Malayalam Speech Voice">
              ${ttsState.voices.map(v => `
                <option value="${v.id}" ${v.id === ttsState.selectedVoice ? 'selected' : ''}>
                  ${v.name}
                </option>
              `).join('')}
            </select>
          </div>
        </div>

        <!-- In-Page Sync Explanatory Note -->
        <div class="sync-info-footer">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#38BDF8" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="16" x2="12" y2="12"></line>
            <line x1="12" y1="8" x2="12.01" y2="8"></line>
          </svg>
          <span>വായനയ്ക്കൊപ്പം വെബ്‌പേജിലെ വരികൾ തത്സമയം ഹൈലൈറ്റ് ചെയ്യപ്പെടും.</span>
        </div>

      </div>
    `;

    attachEvents();

    const newPanel = container.querySelector('#panel-listen');
    if (newPanel && savedScrollTop > 0) {
      newPanel.scrollTop = savedScrollTop;
    }
    if (container && savedContainerScrollTop > 0) {
      container.scrollTop = savedContainerScrollTop;
    }

    if (ttsState.isPlaying) {
      triggerInPageHighlight(seg.selector);
    }
  }

  function attachEvents() {
    // Play/Pause
    const playBtn = container.querySelector('#btn-toggle-play');
    if (playBtn) {
      playBtn.addEventListener('click', () => {
        if (ttsState.isPlaying) {
          ttsService.pause();
        } else {
          ttsService.play();
        }
      });
    }

    // Stop
    const stopBtn = container.querySelector('#btn-stop-playback');
    if (stopBtn) {
      stopBtn.addEventListener('click', () => {
        ttsService.stop();
      });
    }

    // Prev / Next
    const prevBtn = container.querySelector('#btn-prev-segment');
    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        ttsService.prevSegment();
      });
    }
    const nextBtn = container.querySelector('#btn-next-segment');
    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        ttsService.nextSegment();
      });
    }

    // Speed Slider
    const speedSlider = container.querySelector('#input-tts-speed');
    if (speedSlider) {
      speedSlider.addEventListener('input', (e) => {
        const val = e.target.value;
        const readout = container.querySelector('#speed-val-readout');
        if (readout) readout.textContent = `${parseFloat(val).toFixed(1)}x`;
        ttsService.setSpeed(val);
      });
    }

    // Voice Selector
    const voiceSelect = container.querySelector('#select-tts-voice');
    if (voiceSelect) {
      voiceSelect.addEventListener('change', (e) => {
        ttsService.setVoice(e.target.value);
      });
    }

    // Refresh Audio Button
    const refreshListenBtn = container.querySelector('#btn-refresh-listen');
    if (refreshListenBtn) {
      refreshListenBtn.addEventListener('click', () => {
        ttsService.stop();
        ttsService.setSpeed(1.0);
        if (typeof chrome !== 'undefined' && chrome.tabs) {
          chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs && tabs[0]) {
              chrome.tabs.sendMessage(tabs[0].id, { action: 'RESET_ALL_PAGE_OVERLAYS' }).catch(() => {});
            }
          });
        } else {
          try {
            if (typeof window !== 'undefined' && window.parent && window.parent.ThunaiContentScript) {
              window.parent.ThunaiContentScript.resetAllPageOverlays();
            }
          } catch (_) {}
        }
        render();
      });
    }
  }

  // Subscribe to service state changes
  const unsubscribe = ttsService.subscribe(() => {
    render();
  });

  render();
}
