import { ttsService } from '../../services/ttsService.js';

function getSegmentPreview(text) {
  if (!text) return '';
  const words = text.trim().split(/\s+/);
  if (words.length <= 10) return text.trim();
  return words.slice(0, 10).join(' ') + '...';
}

export function renderListenView(container, state, setState, activeTabId = 'default') {
  if (state.currentLang) {
    ttsService.setLanguage(state.currentLang);
  }

  // Enforce precise active URL matching before rendering TTS content
  let currentTtsState = ttsService.getState();
  let isPageMismatch = currentTtsState.pageSessionUrl !== state.pageSessionUrl;

  if (isPageMismatch && state.scanReport?.textSegments) {
    // If TTS holds another page's text (or defaults), force-feed fresh real data.
    ttsService.loadSegments(state.scanReport.textSegments, activeTabId, state.pageSessionUrl);
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
      window.parent.ThunaiContentScript.highlightSegment(selector);
    }
  }

  // Render initial tab HTML once
  function buildInitialDOM() {
    ttsState = ttsService.getState();
    const isStateMismatch = ttsState.pageSessionUrl !== state.pageSessionUrl;

    if (state.isScanning) {
      container.innerHTML = `
        <div class="view-panel listen-view" id="panel-listen" style="display: flex; align-items: center; justify-content: center; height: 100%;">
          <div style="text-align: center; color: #94A3B8;">
            <div class="spinner" style="margin-bottom: 12px;"></div>
            <p style="font-weight: 500; font-size: 15px;">Extracting current page...</p>
          </div>
        </div>
      `;
      return;
    }

    if (isStateMismatch || !ttsState.segments || ttsState.segments.length === 0) {
      container.innerHTML = `
        <div class="view-panel listen-view" id="panel-listen" style="display: flex; align-items: center; justify-content: center; height: 100%;">
          <p style="text-align: center; color: #94A3B8; font-weight: 500; font-size: 15px;">No page content extracted yet.</p>
        </div>
      `;
      return;
    }

    const segmentsList = (ttsState && ttsState.segments && Array.isArray(ttsState.segments)) ? ttsState.segments : [];
    const seg = ttsState.currentSegment || segmentsList[0];
    const actionText = ttsState.currentLang === 'en' ? 'Speak' : 'കേൾക്കുക';

    container.innerHTML = `
      <div class="view-panel listen-view animate-fade-in" id="panel-listen" role="tabpanel" aria-labelledby="tab-listen">
        
        <!-- Active Page Breadcrumb / Page Title -->
        <div class="listen-page-header">
          <div class="page-source-pill">
            <span class="source-icon">📄</span>
            <span class="source-title" id="listen-source-title" title="${seg?.tag || 'കേരളം - വിക്കിപീഡിയ'}">${seg?.tag || 'കേരളം - വിക്കിപീഡിയ'}</span>
          </div>
          <div class="sync-indicator ${ttsState.isPlaying ? 'active' : ''}" id="listen-sync-indicator" title="Current sentence is synced with page highlight">
            <span class="sync-dot"></span>
            <span class="sync-text">Live Sync</span>
          </div>
        </div>

        <!-- Extracted Content Preview List Section -->
        <div class="extracted-content-card" id="listen-extracted-card">
          <div class="extracted-content-header">
            <span class="extracted-content-title">Extracted content</span>
            <span class="extracted-content-count" id="listen-extracted-count">${segmentsList.length} segments</span>
          </div>
          <div class="extracted-content-list" id="listen-extracted-list">
            ${segmentsList.map((s, idx) => {
              if (!s) return '';
              const segText = typeof s === 'string' ? s : (s.malayalamText || s.text || s.englishText || '');
              const preview = getSegmentPreview(segText) || `Segment ${idx + 1}`;
              const isActive = idx + 1 === ttsState.currentSegmentIndex;
              return `<div class="extracted-preview-item ${isActive ? 'active-seg' : ''}" data-seg-index="${idx + 1}">
                <span class="preview-num">${idx + 1}.</span>
                <span class="preview-text">${preview}</span>
              </div>`;
            }).join('')}
          </div>
        </div>

        <!-- Current Paragraph Display Box -->
        <div class="reading-segment-card ${ttsState.isPlaying ? 'is-playing' : ''}" id="listen-segment-card">
          <div class="segment-meta-header">
            <span class="segment-type-tag" id="listen-seg-type">
              <span class="tag-square"></span>
              ${seg.type || 'PARAGRAPH'}
            </span>
            <span class="segment-position-tag" id="listen-seg-pos">${ttsState.currentSegmentIndex} of ${segmentsList.length || 5}</span>
          </div>

          <p class="segment-malayalam-text" id="listen-seg-ml" lang="ml">
            ${seg.malayalamText}
          </p>

          <p class="segment-english-subtext" id="listen-seg-en" lang="en">
            ${seg.englishText}
          </p>
        </div>

        <!-- Equalizer Visualizer & Segment Counter -->
        <div class="player-status-strip">
          <div class="segment-counter">
            <span class="counter-number" id="listen-counter-num">${ttsState.currentSegmentIndex} / ${ttsState.totalSegments}</span>
            <span class="counter-label">segments</span>
          </div>

          <!-- Soundwave Animation -->
          <div class="audio-equalizer ${ttsState.isPlaying ? 'animating' : ''}" id="listen-equalizer" aria-hidden="true">
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

            <!-- Main Play / Pause Circle (Gold Accent) - Speak / കേൾക്കുക -->
            <button class="btn-ctrl-primary-play ${ttsState.isPlaying ? 'playing' : ''}" id="btn-toggle-play" title="${ttsState.isPlaying ? 'Pause' : actionText}" aria-label="${ttsState.isPlaying ? 'Pause' : actionText}">
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

  // Smooth targeted DOM updates without destroying/re-creating container.innerHTML
  function updateUI() {
    ttsState = ttsService.getState();
    const isStateMismatch = ttsState.pageSessionUrl !== state.pageSessionUrl;

    if (state.isScanning || isStateMismatch || !ttsState.segments || ttsState.segments.length === 0) {
      buildInitialDOM(); // Re-render simple text strings entirely covering edge cases
      return;
    }

    const seg = ttsState.currentSegment || {};
    const actionText = ttsState.currentLang === 'en' ? 'Speak' : 'കേൾക്കുക';

    const playBtn = container.querySelector('#btn-toggle-play');
    if (playBtn) {
      if (ttsState.isPlaying) {
        playBtn.classList.add('playing');
        playBtn.setAttribute('aria-label', 'Pause');
        playBtn.setAttribute('title', 'Pause');
        playBtn.innerHTML = `
          <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor">
            <rect x="6" y="4" width="4" height="16" rx="1"></rect>
            <rect x="14" y="4" width="4" height="16" rx="1"></rect>
          </svg>`;
      } else {
        playBtn.classList.remove('playing');
        playBtn.setAttribute('aria-label', actionText);
        playBtn.setAttribute('title', actionText);
        playBtn.innerHTML = `
          <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor" style="transform: translateX(2px);">
            <polygon points="5 3 19 12 5 21 5 3"></polygon>
          </svg>`;
      }
    }

    const listEl = container.querySelector('#listen-extracted-list');
    if (listEl) {
      const items = listEl.querySelectorAll('.extracted-preview-item');
      items.forEach(item => {
        const segIdx = parseInt(item.getAttribute('data-seg-index'), 10);
        if (segIdx === ttsState.currentSegmentIndex) {
          item.classList.add('active-seg');
        } else {
          item.classList.remove('active-seg');
        }
      });
    }

    const card = container.querySelector('#listen-segment-card');
    if (card) {
      if (ttsState.isPlaying) card.classList.add('is-playing');
      else card.classList.remove('is-playing');
    }

    const syncInd = container.querySelector('#listen-sync-indicator');
    if (syncInd) {
      if (ttsState.isPlaying) syncInd.classList.add('active');
      else syncInd.classList.remove('active');
    }

    const eq = container.querySelector('#listen-equalizer');
    if (eq) {
      if (ttsState.isPlaying) eq.classList.add('animating');
      else eq.classList.remove('animating');
    }

    const segTypeEl = container.querySelector('#listen-seg-type');
    if (segTypeEl) {
      segTypeEl.innerHTML = `<span class="tag-square"></span> ${seg.type || 'PARAGRAPH'}`;
    }

    const segPosEl = container.querySelector('#listen-seg-pos');
    if (segPosEl) {
      segPosEl.textContent = `${ttsState.currentSegmentIndex} of ${ttsState.totalSegments}`;
    }

    const segMlEl = container.querySelector('#listen-seg-ml');
    if (segMlEl) {
      segMlEl.textContent = seg.malayalamText || seg.text || '';
    }

    const segEnEl = container.querySelector('#listen-seg-en');
    if (segEnEl) {
      segEnEl.textContent = seg.englishText || '';
    }

    const counterNumEl = container.querySelector('#listen-counter-num');
    if (counterNumEl) {
      counterNumEl.textContent = `${ttsState.currentSegmentIndex} / ${ttsState.totalSegments}`;
    }

    const sourceTitleEl = container.querySelector('#listen-source-title');
    if (sourceTitleEl && seg.tag) {
      sourceTitleEl.textContent = seg.tag;
      sourceTitleEl.title = seg.tag;
    }

    if (ttsState.isPlaying && seg.selector) {
      triggerInPageHighlight(seg.selector);
    }
  }

  function attachEvents() {
    const playBtn = container.querySelector('#btn-toggle-play');
    if (playBtn) {
      playBtn.addEventListener('click', () => {
        if (ttsState.isPlaying) {
          ttsService.pause();
        } else {
          ttsService.play(state.currentLang);
        }
      });
    }

    const stopBtn = container.querySelector('#btn-stop-playback');
    if (stopBtn) {
      stopBtn.addEventListener('click', () => {
        ttsService.stop();
      });
    }

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

    const speedSlider = container.querySelector('#input-tts-speed');
    if (speedSlider) {
      speedSlider.addEventListener('input', (e) => {
        const val = e.target.value;
        const readout = container.querySelector('#speed-val-readout');
        if (readout) readout.textContent = `${parseFloat(val).toFixed(1)}x`;
        ttsService.setSpeed(val);
      });
    }
  }

  buildInitialDOM();

  // Subscribe to service state changes with smooth targeted updates
  const unsubscribe = ttsService.subscribe(() => {
    if (!container || !container.querySelector('#panel-listen')) {
      if (typeof unsubscribe === 'function') unsubscribe();
      return;
    }
    updateUI();
  });
}
