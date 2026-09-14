/**
 * Listen / Reader View Component (Tab: 'listen')
 * Provides segment-by-segment Malayalam TTS playback, speech speed slider, voice picker,
 * audio equalizer animation, and live page highlight synchronization.
 */

import { ttsService } from '../../services/ttsService.js';

export function renderListenView(container, state, setState) {
  // Hydrate segment-by-segment playback from universal scanReport
  if (state.scanReport?.textSegments && state.scanReport.textSegments.length > 0) {
    ttsService.loadSegments(state.scanReport.textSegments);
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
    } else if (window.parent && window.parent.ThunaiContentScript) {
      // Standalone preview testbed fallback
      window.parent.ThunaiContentScript.highlightSegment(selector);
    }
  }

  function render() {
    ttsState = ttsService.getState();
    const seg = ttsState.currentSegment || {
      tag: "കേരളം - വിക്കിപീഡിയ",
      type: "PARAGRAPH",
      malayalamText: "ഇന്ത്യയുടെ തെക്കുപടിഞ്ഞാറൻ മലബാർ തീരത്ത് സ്ഥിതി ചെയ്യുന്ന ഒരു സംസ്ഥാനമാണ് കേരളം.",
      englishText: "Kerala is a state on the southwestern Malabar Coast of India.",
      selector: "p:nth-of-type(1)"
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
          <div class="sync-indicator ${ttsState.isPlaying ? 'active' : ''}" title="Current sentence is synced with page highlight">
            <span class="sync-dot"></span>
            <span class="sync-text">Live Sync</span>
          </div>
        </div>

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
            ${seg.malayalamText}
          </p>

          <p class="segment-english-subtext" lang="en">
            ${seg.englishText}
          </p>
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
  }

  // Subscribe to service state changes
  const unsubscribe = ttsService.subscribe(() => {
    render();
  });

  render();
}
