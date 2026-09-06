/**
 * Settings / Reading Preferences Component with Dedicated Dyslexia Toolkit
 */

import { getT } from '../i18n.js';

export function renderSettingsView(container, state, setState, onNavigate) {
  let settings = state.settings || {
    textSize: 100,
    lineSpacing: 1.6,
    letterSpacing: 0,
    dyslexiaFont: false,
    readingRuler: false,
    colorTint: 'none', // 'none' | 'cream' | 'sky' | 'peach'
    highContrast: false,
    defaultVoice: "ml-IN-female-1",
    defaultSpeed: 1.0,
    preferredLang: "ml"
  };

  const currentLang = state.currentLang || 'ml';
  const t = getT(currentLang);

  function updateSetting(key, value) {
    settings[key] = value;
    setState({ settings });
    applySettingsToDOM();
    sendSettingsToContentScript();
    render();
  }

  function applySettingsToDOM() {
    const root = document.documentElement;
    root.style.setProperty('--user-text-scale', `${settings.textSize}%`);
    root.style.setProperty('--user-line-height', `${settings.lineSpacing}`);
    root.style.setProperty('--user-letter-spacing', `${settings.letterSpacing}em`);
    
    // Dyslexia font toggle
    if (settings.dyslexiaFont) {
      document.body.classList.add('dyslexia-font-active');
    } else {
      document.body.classList.remove('dyslexia-font-active');
    }

    // Color Tint
    document.body.classList.remove('tint-cream-active', 'tint-sky-active', 'tint-peach-active');
    if (settings.colorTint === 'cream') document.body.classList.add('tint-cream-active');
    if (settings.colorTint === 'sky') document.body.classList.add('tint-sky-active');
    if (settings.colorTint === 'peach') document.body.classList.add('tint-peach-active');
  }

  function sendSettingsToContentScript() {
    if (typeof chrome !== 'undefined' && chrome.tabs) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs && tabs[0]) {
          chrome.tabs.sendMessage(tabs[0].id, {
            action: 'UPDATE_SETTINGS',
            settings: settings
          }).catch(() => {});
        }
      });
    } else if (window.parent && window.parent.ThunaiContentScript) {
      window.parent.ThunaiContentScript.applyUserSettings(settings);
    }
  }

  function render() {
    container.innerHTML = `
      <div class="view-panel settings-view animate-fade-in" id="panel-settings" role="tabpanel" aria-labelledby="tab-settings">
        
        <!-- Section Header -->
        <div class="settings-header-box">
          <h2 class="view-heading-ml">${t.settingsTitle}</h2>
          <p class="view-subheading-en">${t.settingsSub}</p>
        </div>

        <!-- SPECIAL DYSLEXIA TOOLKIT CARD -->
        <div class="settings-group-card dyslexia-toolkit-card">
          <h3 class="group-title highlight-gold">
            <span>${t.dyslexiaGroup}</span>
          </h3>

          <!-- 1. Dyslexia-Friendly Font (Lexend) -->
          <div class="setting-row-toggle">
            <div class="toggle-info">
              <span class="toggle-title">${t.dyslexiaFontTitle}</span>
              <span class="toggle-desc">${t.dyslexiaFontDesc}</span>
            </div>
            <label class="switch-ui" for="toggle-pref-dyslexia">
              <input type="checkbox" id="toggle-pref-dyslexia" ${settings.dyslexiaFont ? 'checked' : ''} aria-label="Toggle Dyslexia-friendly font">
              <span class="slider-round"></span>
            </label>
          </div>

          <!-- 2. Reading Ruler (Line Focus Overlay) -->
          <div class="setting-row-toggle">
            <div class="toggle-info">
              <span class="toggle-title">${t.readingRulerTitle}</span>
              <span class="toggle-desc">${t.readingRulerDesc}</span>
            </div>
            <label class="switch-ui" for="toggle-pref-ruler">
              <input type="checkbox" id="toggle-pref-ruler" ${settings.readingRuler ? 'checked' : ''} aria-label="Toggle Reading Ruler overlay">
              <span class="slider-round"></span>
            </label>
          </div>

          <!-- 3. Background Color Tint Swatches -->
          <div class="setting-row-tint">
            <div class="toggle-info" style="margin-bottom: 6px;">
              <span class="toggle-title">${t.tintTitle}</span>
              <span class="toggle-desc">${t.tintDesc}</span>
            </div>
            <div class="tint-picker-group">
              <button class="btn-tint-swatch swatch-white ${settings.colorTint === 'none' ? 'active' : ''}" data-tint="none">${t.tintNone}</button>
              <button class="btn-tint-swatch swatch-cream ${settings.colorTint === 'cream' ? 'active' : ''}" data-tint="cream">Cream</button>
              <button class="btn-tint-swatch swatch-sky ${settings.colorTint === 'sky' ? 'active' : ''}" data-tint="sky">Sky Blue</button>
              <button class="btn-tint-swatch swatch-peach ${settings.colorTint === 'peach' ? 'active' : ''}" data-tint="peach">Peach</button>
            </div>
          </div>

          <!-- 4. Letter Spacing Slider -->
          <div class="setting-row-slider">
            <div class="slider-info">
              <label for="input-pref-letter-spacing" class="setting-label">${t.letterSpacingTitle}</label>
              <span class="setting-val-tag" id="val-letter-spacing">${settings.letterSpacing.toFixed(2)}em</span>
            </div>
            <input type="range" id="input-pref-letter-spacing" min="0" max="0.25" step="0.02" value="${settings.letterSpacing}">
            <div class="slider-hints">
              <span>0em (Normal)</span>
              <span>0.12em (Wide)</span>
              <span>0.25em</span>
            </div>
          </div>
        </div>

        <!-- Live Typography & Dyslexia Preview Box -->
        <div class="typography-preview-card">
          <span class="preview-badge">${t.livePreview}</span>
          <p class="preview-text-sample ${settings.dyslexiaFont ? 'dyslexia-font-active' : ''}" 
             style="font-size: calc(14px * ${settings.textSize / 100}); line-height: ${settings.lineSpacing}; letter-spacing: ${settings.letterSpacing}em;">
            കേരളം — സ്വാഭാവിക പ്രകൃതി സൗന്ദര്യവും ഉയർന്ന സാക്ഷരതയുമുള്ള മനോഹരമായ ഒരു സംസ്ഥാനം.
          </p>
        </div>

        <!-- Visual Reading Adjustments Card -->
        <div class="settings-group-card">
          <h3 class="group-title">
            <span class="group-icon">👓</span>
            <span>${t.visualGroup}</span>
          </h3>

          <!-- Text Size Slider -->
          <div class="setting-row-slider">
            <div class="slider-info">
              <label for="input-pref-text-size" class="setting-label">${t.textSize}</label>
              <span class="setting-val-tag" id="val-text-size">${settings.textSize}%</span>
            </div>
            <input type="range" id="input-pref-text-size" min="80" max="160" step="5" value="${settings.textSize}">
            <div class="slider-hints">
              <span>80%</span>
              <span>100% (Default)</span>
              <span>160%</span>
            </div>
          </div>

          <!-- Line Spacing Slider -->
          <div class="setting-row-slider">
            <div class="slider-info">
              <label for="input-pref-line-spacing" class="setting-label">${t.lineSpacing}</label>
              <span class="setting-val-tag" id="val-line-spacing">${settings.lineSpacing.toFixed(1)}x</span>
            </div>
            <input type="range" id="input-pref-line-spacing" min="1.2" max="2.2" step="0.1" value="${settings.lineSpacing}">
            <div class="slider-hints">
              <span>1.2x</span>
              <span>1.6x</span>
              <span>2.2x</span>
            </div>
          </div>
        </div>

        <!-- Audio & Voice Defaults -->
        <div class="settings-group-card">
          <h3 class="group-title">
            <span class="group-icon">🎙️</span>
            <span>${t.audioGroup}</span>
          </h3>

          <div class="setting-row-select">
            <label for="select-default-voice" class="setting-label">${t.defaultVoice}</label>
            <select id="select-default-voice" class="custom-select">
              <option value="ml-IN-female-1" ${settings.defaultVoice === 'ml-IN-female-1' ? 'selected' : ''}>Malayalam Female (Bhashini - ഭാരതി)</option>
              <option value="ml-IN-male-1" ${settings.defaultVoice === 'ml-IN-male-1' ? 'selected' : ''}>Malayalam Male (Bhashini - കൃഷ്ണൻ)</option>
              <option value="en-IN-female-1" ${settings.defaultVoice === 'en-IN-female-1' ? 'selected' : ''}>Indian English Female</option>
            </select>
          </div>
        </div>

        <!-- Reset Button -->
        <div class="settings-footer-actions">
          <button class="btn-reset-settings" id="btn-reset-prefs">
            <span>${t.resetBtn}</span>
          </button>
        </div>

      </div>
    `;

    attachEvents();
  }

  function attachEvents() {
    // Dyslexia font toggle
    const dyslexiaToggle = container.querySelector('#toggle-pref-dyslexia');
    if (dyslexiaToggle) {
      dyslexiaToggle.addEventListener('change', (e) => {
        updateSetting('dyslexiaFont', e.target.checked);
      });
    }

    // Reading ruler toggle
    const rulerToggle = container.querySelector('#toggle-pref-ruler');
    if (rulerToggle) {
      rulerToggle.addEventListener('change', (e) => {
        updateSetting('readingRuler', e.target.checked);
      });
    }

    // Color Tint swatches
    container.querySelectorAll('.btn-tint-swatch').forEach(btn => {
      btn.addEventListener('click', () => {
        const tint = btn.getAttribute('data-tint');
        updateSetting('colorTint', tint);
      });
    });

    // Letter spacing slider
    const letterSlider = container.querySelector('#input-pref-letter-spacing');
    if (letterSlider) {
      letterSlider.addEventListener('input', (e) => {
        updateSetting('letterSpacing', parseFloat(e.target.value));
      });
    }

    // Text size slider
    const textSizeSlider = container.querySelector('#input-pref-text-size');
    if (textSizeSlider) {
      textSizeSlider.addEventListener('input', (e) => {
        updateSetting('textSize', parseInt(e.target.value, 10));
      });
    }

    // Line spacing slider
    const lineSpacingSlider = container.querySelector('#input-pref-line-spacing');
    if (lineSpacingSlider) {
      lineSpacingSlider.addEventListener('input', (e) => {
        updateSetting('lineSpacing', parseFloat(e.target.value));
      });
    }

    // Default voice select
    const voiceSelect = container.querySelector('#select-default-voice');
    if (voiceSelect) {
      voiceSelect.addEventListener('change', (e) => {
        updateSetting('defaultVoice', e.target.value);
      });
    }

    // Reset Defaults
    const resetBtn = container.querySelector('#btn-reset-prefs');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        settings = {
          textSize: 100,
          lineSpacing: 1.6,
          letterSpacing: 0,
          dyslexiaFont: false,
          readingRuler: false,
          colorTint: 'none',
          highContrast: false,
          defaultVoice: "ml-IN-female-1",
          defaultSpeed: 1.0,
          preferredLang: "ml"
        };
        setState({ settings });
        applySettingsToDOM();
        sendSettingsToContentScript();
        render();
      });
    }
  }

  applySettingsToDOM();
  render();
}
