/**
 * Dyslexia Friendly Mode Component (View: 'dyslexia' / 'settings')
 * Completely bilingual (English in English mode, Malayalam in Malayalam mode).
 * Allows users to adjust text size, font style, background color texture/tint,
 * letter spacing, line height, and line-focus reading ruler on ANY scanned webpage.
 */

import { getT } from '../i18n.js';

export function renderDyslexiaModeView(container, state, setState, onNavigate) {
  const currentLang = state.currentLang || 'ml';
  const t = getT(currentLang);
  const isEn = currentLang === 'en';

  const settings = state.settings || {
    textSize: 120,
    fontFamily: 'lexend',
    colorTint: 'cream',
    letterSpacing: 1,
    lineSpacing: 1.8,
    readingRuler: true,
    dyslexiaFont: true
  };

  const fontOptions = [
    { 
      id: 'lexend', 
      name: isEn ? 'Lexend (Dyslexia-Optimized)' : 'ലെക്സെൻഡ് (Lexend)', 
      desc: isEn ? 'Weighted bottom letters reduce letter flipping & confusion' : 'അക്ഷരങ്ങൾ കീഴ്മേൽ മറിയുന്നത് തടയാൻ സഹായിക്കുന്ന ഫോണ്ട്' 
    },
    { 
      id: 'noto', 
      name: isEn ? 'Noto Sans Malayalam' : 'നോട്ടോ സാൻസ് മലയാളം (Noto Sans)', 
      desc: isEn ? 'Crisp, high-legibility Malayalam typography' : 'വ്യക്തതയുള്ള വലിയ മലയാളം അക്ഷര ശൈലി' 
    },
    { 
      id: 'serif', 
      name: isEn ? 'High-Contrast Serif' : 'ഹൈ-കോൺട്രാസ്റ്റ് സെരിഫ് (Serif)', 
      desc: isEn ? 'Distinct strokes for improved word tracking' : 'വരികൾ കൃത്യമായി പിന്തുടരാൻ സഹായിക്കുന്ന സ്ട്രോക്കുകൾ' 
    },
    { 
      id: 'default', 
      name: isEn ? 'System Default' : 'സിസ്റ്റം സാധാരണ ഫോണ്ട് (Default)', 
      desc: isEn ? 'Standard browser default font family' : 'ബ്രൗസറിന്റെ യഥാർത്ഥ ഫോണ്ട് ഘടന' 
    }
  ];

  const colorTints = [
    { id: 'cream', name: isEn ? 'Soft Cream' : 'ക്രീം നിറം', hex: '#FEFCE8', border: '#FDE047', text: '#1E293B' },
    { id: 'sky', name: isEn ? 'Sky Blue' : 'മൃദു നീല', hex: '#F0F9FF', border: '#BAE6FD', text: '#0F172A' },
    { id: 'peach', name: isEn ? 'Soft Peach' : 'പീച്ച് നിറം', hex: '#FFF7ED', border: '#FED7AA', text: '#331505' },
    { id: 'sepia', name: isEn ? 'Warm Sepia' : 'സെപിയ നിറം', hex: '#FDF6E2', border: '#E9D5A1', text: '#433422' },
    { id: 'dark', name: isEn ? 'Contrast Dark' : 'ഡാർക്ക് മോഡ്', hex: '#0F172A', border: '#334155', text: '#F8FAFC' },
    { id: 'white', name: isEn ? 'Paper White' : 'ശുദ്ധ വെളുപ്പ്', hex: '#FFFFFF', border: '#E2E8F0', text: '#000000' }
  ];

  function render() {
    container.innerHTML = `
      <div class="view-panel dyslexia-mode-view animate-fade-in" id="panel-dyslexia" role="region" aria-label="Dyslexia Friendly Mode">
        
        <!-- Header Strip -->
        <div class="dyslexia-header-box">
          <div class="dyslexia-badge-pill">
            <span>👁️ ${isEn ? 'Dyslexia & Reading Assistant' : 'ഡിസ്‌ലെക്സിയ & വായനാ സഹായി'}</span>
          </div>
          <h2 class="view-heading-ml">${isEn ? 'Dyslexia Friendly Mode' : 'ഡിസ്‌ലെക്സിയ സൗഹൃദ മോഡ്'}</h2>
          <p class="view-subheading-en">${isEn ? 'Adjust text size, font style, and color textures across the scanned webpage in real time.' : 'സ്കാൻ ചെയ്ത പേജിലെ അക്ഷര വലിപ്പം, ഫോണ്ട്, പശ്ചാത്തല വർണ്ണം എന്നിവ തത്സമയം മാറ്റുക.'}</p>
        </div>

        <!-- 1. Text Size Scaling on Scanned Webpage -->
        <div class="setting-card">
          <div class="setting-header-row">
            <div class="setting-title-box">
              <span class="setting-icon">🔍</span>
              <div>
                <h3 class="setting-title">${isEn ? 'Page Text Size' : 'അക്ഷര വലിപ്പം (Page Text Size)'}</h3>
                <p class="setting-desc">${isEn ? 'Scale font size across the active webpage live' : 'പേജിലെ അക്ഷരങ്ങളുടെ വലിപ്പം തത്സമയം കൂട്ടുകയോ കുറയ്ക്കുകയോ ചെയ്യാം'}</p>
              </div>
            </div>
            <span class="value-readout-pill" id="label-text-size">${settings.textSize || 100}%</span>
          </div>

          <div class="range-control-row">
            <button class="btn-step-size" id="btn-dec-size" title="Decrease font size">-</button>
            <input type="range" 
                   id="slider-text-size" 
                   class="custom-range-slider" 
                   min="80" 
                   max="220" 
                   step="5" 
                   value="${settings.textSize || 100}">
            <button class="btn-step-size" id="btn-inc-size" title="Increase font size">+</button>
          </div>

          <div class="preset-size-chips">
            <button class="chip-size-preset ${settings.textSize === 100 ? 'active' : ''}" data-size="100">100% (${isEn ? 'Normal' : 'സാധാരണ'})</button>
            <button class="chip-size-preset ${settings.textSize === 125 ? 'active' : ''}" data-size="125">125% (${isEn ? 'Medium' : 'ഇടത്തരം'})</button>
            <button class="chip-size-preset ${settings.textSize === 150 ? 'active' : ''}" data-size="150">150% (${isEn ? 'Large' : 'വലുത്'})</button>
            <button class="chip-size-preset ${settings.textSize === 180 ? 'active' : ''}" data-size="180">180% (${isEn ? 'Extra Large' : 'ഏറ്റവും വലുത്'})</button>
          </div>
        </div>

        <!-- 2. Font Style Selection -->
        <div class="setting-card">
          <div class="setting-header-row">
            <div class="setting-title-box">
              <span class="setting-icon">🔤</span>
              <div>
                <h3 class="setting-title">${isEn ? 'Font Style' : 'ഫോണ്ട് ശൈലി (Font Style)'}</h3>
                <p class="setting-desc">${isEn ? 'Specialized fonts engineered for clear character distinction' : 'അക്ഷരങ്ങൾ തിരിച്ചറിയാൻ സഹായിക്കുന്ന പ്രത്യേക ഫോണ്ടുകൾ'}</p>
              </div>
            </div>
          </div>

          <div class="font-options-list">
            ${fontOptions.map(f => {
              const isSelected = (settings.fontFamily || 'lexend') === f.id;
              return `
                <div class="font-option-card ${isSelected ? 'is-selected' : ''}" data-font-id="${f.id}">
                  <div class="font-radio-indicator"></div>
                  <div class="font-info">
                    <span class="font-name" style="font-family: ${f.id === 'lexend' ? "'Lexend', sans-serif" : f.id === 'noto' ? "'Noto Sans Malayalam', sans-serif" : f.id === 'serif' ? 'serif' : 'sans-serif'};">${f.name}</span>
                    <span class="font-desc">${f.desc}</span>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <!-- 3. Color Texture & Background Tint -->
        <div class="setting-card">
          <div class="setting-header-row">
            <div class="setting-title-box">
              <span class="setting-icon">🎨</span>
              <div>
                <h3 class="setting-title">${isEn ? 'Page Color Texture & Tint' : 'പേജ് പശ്ചാത്തല നിറം (Color Texture)'}</h3>
                <p class="setting-desc">${isEn ? 'Soothing color tints to eliminate glare and visual stress' : 'കണ്ണിലെ ആയാസവും ഗ്ലെയറും ഒഴിവാക്കാനുള്ള മൃദുവായ വർണ്ണങ്ങൾ'}</p>
              </div>
            </div>
          </div>

          <div class="color-texture-grid">
            ${colorTints.map(tint => {
              const isSelected = (settings.colorTint || 'cream') === tint.id;
              return `
                <button class="color-texture-card ${isSelected ? 'active-tint' : ''}" 
                        data-tint-id="${tint.id}" 
                        style="background: ${tint.hex}; border-color: ${tint.border}; color: ${tint.text};">
                  <div class="swatch-circle" style="background: ${tint.hex}; border: 1.5px solid ${tint.border};"></div>
                  <span class="tint-name">${tint.name}</span>
                </button>
              `;
            }).join('')}
          </div>
        </div>

        <!-- 4. Reading Ruler (Line-Focus Guide Bar) -->
        <div class="setting-card">
          <div class="setting-header-row">
            <div class="setting-title-box">
              <span class="setting-icon">📏</span>
              <div>
                <h3 class="setting-title">${isEn ? 'Reading Ruler Overlay' : 'റീഡിംഗ് റൂളർ (Reading Ruler Overlay)'}</h3>
                <p class="setting-desc">${isEn ? 'Line-focus guide bar that dims surrounding text to keep focus' : 'വായിക്കുന്ന വരിയിൽ മാത്രം ശ്രദ്ധ കേന്ദ്രീകരിക്കാനുള്ള ലൈൻ ഫോക്കസ് ബാർ'}</p>
              </div>
            </div>

            <label class="toggle-switch-label" for="toggle-ruler-live">
              <div class="switch-ui">
                <input type="checkbox" id="toggle-ruler-live" ${settings.readingRuler ? 'checked' : ''}>
                <span class="slider-round"></span>
              </div>
            </label>
          </div>
        </div>

        <!-- 5. Letter & Line Spacing -->
        <div class="setting-card">
          <div class="setting-header-row">
            <div class="setting-title-box">
              <span class="setting-icon">↔️</span>
              <div>
                <h3 class="setting-title">${isEn ? 'Letter & Line Spacing' : 'അക്ഷരങ്ങളും വരികളും തമ്മിലുള്ള അകലം (Spacing)'}</h3>
                <p class="setting-desc">${isEn ? 'Increase character and line spacing for easier tracking' : 'വായനാ സൗകര്യത്തിനായി അക്ഷരങ്ങളുടെയും വരികളുടെയും അകലം കൂട്ടുക'}</p>
              </div>
            </div>
          </div>

          <!-- Letter Spacing -->
          <div class="sub-slider-box">
            <div class="sub-slider-header">
              <span class="sub-slider-label">${isEn ? 'Letter Spacing:' : 'അക്ഷര അകലം:'}</span>
              <span class="sub-slider-value" id="label-letter-spacing">${settings.letterSpacing || 0}px</span>
            </div>
            <input type="range" 
                   id="slider-letter-spacing" 
                   class="custom-range-slider" 
                   min="0" 
                   max="6" 
                   step="0.5" 
                   value="${settings.letterSpacing || 0}">
          </div>

          <!-- Line Spacing -->
          <div class="sub-slider-box" style="margin-top: 10px;">
            <div class="sub-slider-header">
              <span class="sub-slider-label">${isEn ? 'Line Spacing:' : 'വരികളുടെ അകലം:'}</span>
              <span class="sub-slider-value" id="label-line-spacing">${settings.lineSpacing || 1.6}x</span>
            </div>
            <input type="range" 
                   id="slider-line-spacing" 
                   class="custom-range-slider" 
                   min="1.2" 
                   max="2.4" 
                   step="0.1" 
                   value="${settings.lineSpacing || 1.6}">
          </div>
        </div>

        <!-- Reset Button -->
        <div class="settings-footer-box">
          <button class="btn-secondary-full" id="btn-reset-dyslexia">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="1 4 1 10 7 10"></polyline>
              <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path>
            </svg>
            <span>${isEn ? 'Reset to Defaults' : 'സാധാരണ രീതിയിലേക്ക് പുനഃസ്ഥാപിക്കുക'}</span>
          </button>
        </div>

      </div>
    `;

    attachEvents();
  }

  function dispatchSettings(updatedSettings) {
    setState({ settings: updatedSettings });

    // Send update to active tab in Chrome
    if (typeof chrome !== 'undefined' && chrome.tabs) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs && tabs[0] && tabs[0].id) {
          chrome.tabs.sendMessage(tabs[0].id, {
            action: 'UPDATE_SETTINGS',
            settings: updatedSettings
          }).catch(() => {});
        }
      });
    } else if (typeof window !== 'undefined' && window.parent && window.parent.ThunaiContentScript) {
      window.parent.ThunaiContentScript.applyUserSettings(updatedSettings);
    }
  }

  function attachEvents() {
    // Text Size Slider
    const sizeSlider = container.querySelector('#slider-text-size');
    const sizeLabel = container.querySelector('#label-text-size');
    if (sizeSlider) {
      sizeSlider.addEventListener('input', (e) => {
        const val = parseInt(e.target.value, 10);
        settings.textSize = val;
        if (sizeLabel) sizeLabel.textContent = `${val}%`;
        dispatchSettings(settings);
      });
    }

    // Step - / + Buttons
    const decBtn = container.querySelector('#btn-dec-size');
    if (decBtn) {
      decBtn.addEventListener('click', () => {
        settings.textSize = Math.max(80, (settings.textSize || 100) - 10);
        if (sizeSlider) sizeSlider.value = settings.textSize;
        if (sizeLabel) sizeLabel.textContent = `${settings.textSize}%`;
        dispatchSettings(settings);
        render();
      });
    }

    const incBtn = container.querySelector('#btn-inc-size');
    if (incBtn) {
      incBtn.addEventListener('click', () => {
        settings.textSize = Math.min(220, (settings.textSize || 100) + 10);
        if (sizeSlider) sizeSlider.value = settings.textSize;
        if (sizeLabel) sizeLabel.textContent = `${settings.textSize}%`;
        dispatchSettings(settings);
        render();
      });
    }

    // Size Preset Chips
    container.querySelectorAll('.chip-size-preset').forEach(chip => {
      chip.addEventListener('click', () => {
        const size = parseInt(chip.getAttribute('data-size'), 10);
        settings.textSize = size;
        dispatchSettings(settings);
        render();
      });
    });

    // Font Options
    container.querySelectorAll('.font-option-card').forEach(card => {
      card.addEventListener('click', () => {
        const fontId = card.getAttribute('data-font-id');
        settings.fontFamily = fontId;
        settings.dyslexiaFont = (fontId === 'lexend' || fontId === 'dyslexic');
        dispatchSettings(settings);
        render();
      });
    });

    // Color Texture Swatches
    container.querySelectorAll('.color-texture-card').forEach(card => {
      card.addEventListener('click', () => {
        const tintId = card.getAttribute('data-tint-id');
        settings.colorTint = tintId;
        dispatchSettings(settings);
        render();
      });
    });

    // Reading Ruler Toggle
    const rulerToggle = container.querySelector('#toggle-ruler-live');
    if (rulerToggle) {
      rulerToggle.addEventListener('change', (e) => {
        settings.readingRuler = e.target.checked;
        dispatchSettings(settings);
      });
    }

    // Letter Spacing Slider
    const letterSlider = container.querySelector('#slider-letter-spacing');
    const letterLabel = container.querySelector('#label-letter-spacing');
    if (letterSlider) {
      letterSlider.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        settings.letterSpacing = val;
        if (letterLabel) letterLabel.textContent = `${val}px`;
        dispatchSettings(settings);
      });
    }

    // Line Spacing Slider
    const lineSlider = container.querySelector('#slider-line-spacing');
    const lineLabel = container.querySelector('#label-line-spacing');
    if (lineSlider) {
      lineSlider.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        settings.lineSpacing = val;
        if (lineLabel) lineLabel.textContent = `${val}x`;
        dispatchSettings(settings);
      });
    }

    // Reset Button
    const resetBtn = container.querySelector('#btn-reset-dyslexia');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        settings.textSize = 100;
        settings.fontFamily = 'default';
        settings.dyslexiaFont = false;
        settings.colorTint = 'none';
        settings.letterSpacing = 0;
        settings.lineSpacing = 1.6;
        settings.readingRuler = false;
        dispatchSettings(settings);
        render();
      });
    }
  }

  render();
}
