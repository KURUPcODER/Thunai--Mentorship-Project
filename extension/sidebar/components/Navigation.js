/**
 * Navigation Component with 5 Persistent Tabs (Translate, Listen, Find, Scan, Settings)
 * and 1-Click Bilingual Language Toggle (EN ↔ മലയാളം).
 */

import { getT } from '../i18n.js';

export function renderTopNavigation(container, currentView, currentLang, onNavigate, onBack, onToggleLang) {
  const isHome = currentView === 'launcher';

  if (isHome) {
    container.innerHTML = '';
    container.style.display = 'none';
    return;
  }

  const t = getT(currentLang);

  container.style.display = 'block';
  container.innerHTML = `
    <header class="app-top-header" role="banner">
      <div class="top-header-row">
        <!-- Back Button -->
        <button class="btn-back" id="nav-btn-back" aria-label="${t.back}">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          <span class="back-text">${t.back}</span>
        </button>

        <!-- Centered Brand Info -->
        <div class="header-brand-info">
          <span class="brand-logo-symbol">തു</span>
          <span class="header-brand-name">${t.brandName}</span>
          <span class="header-status-badge">${t.online}</span>
        </div>

        <!-- 1-Click Language Switcher Button -->
        <button class="btn-lang-toggle" id="nav-btn-toggle-lang" title="Switch Language (മലയാളം / English)" aria-label="Switch interface language">
          <span class="lang-globe-icon">🌐</span>
          <span class="lang-btn-text">${t.toggleLabel}</span>
        </button>
      </div>

      <!-- Persistent 5 Top Tabs -->
      <nav class="persistent-tabs-bar" role="tablist" aria-label="Main Navigation Tabs">
        
        <!-- Tab 1: Translate -->
        <button class="nav-tab ${currentView === 'translate' ? 'active' : ''}" 
                role="tab" 
                id="tab-translate" 
                data-tab="translate"
                aria-selected="${currentView === 'translate'}" 
                aria-controls="panel-translate">
          <span class="tab-label-ml">${t.tabTranslate}</span>
          <span class="tab-label-en">${t.tabTranslateSub}</span>
        </button>

        <!-- Tab 2: Listen -->
        <button class="nav-tab ${currentView === 'listen' ? 'active' : ''}" 
                role="tab" 
                id="tab-listen" 
                data-tab="listen"
                aria-selected="${currentView === 'listen'}" 
                aria-controls="panel-listen">
          <span class="tab-label-ml">${t.tabListen}</span>
          <span class="tab-label-en">${t.tabListenSub}</span>
        </button>

        <!-- Tab 3: Find / Search in Page -->
        <button class="nav-tab ${currentView === 'search' ? 'active' : ''}" 
                role="tab" 
                id="tab-search" 
                data-tab="search"
                aria-selected="${currentView === 'search'}" 
                aria-controls="panel-search">
          <span class="tab-label-ml">${t.tabSearch}</span>
          <span class="tab-label-en">${t.tabSearchSub}</span>
        </button>

        <!-- Tab 4: Scan -->
        <button class="nav-tab ${currentView === 'scan' ? 'active' : ''}" 
                role="tab" 
                id="tab-scan" 
                data-tab="scan"
                aria-selected="${currentView === 'scan'}" 
                aria-controls="panel-scan">
          <span class="tab-label-ml">${t.tabScan}</span>
          <span class="tab-label-en">${t.tabScanSub}</span>
        </button>

        <!-- Tab 5: Settings / Fix -->
        <button class="nav-tab ${currentView === 'settings' || currentView === 'fixes' ? 'active' : ''}" 
                role="tab" 
                id="tab-settings" 
                data-tab="settings"
                aria-selected="${currentView === 'settings' || currentView === 'fixes'}" 
                aria-controls="panel-settings">
          <span class="tab-label-ml">${t.tabSettings}</span>
          <span class="tab-label-en">${t.tabSettingsSub}</span>
        </button>
      </nav>
    </header>
  `;

  // Attach tab switch events
  container.querySelectorAll('.nav-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const targetTab = tab.getAttribute('data-tab');
      if (onNavigate) onNavigate(targetTab);
    });
  });

  // Attach back button
  const backBtn = container.querySelector('#nav-btn-back');
  if (backBtn) {
    backBtn.addEventListener('click', () => {
      if (onBack) onBack();
    });
  }

  // Attach 1-Click Language Switcher
  const langBtn = container.querySelector('#nav-btn-toggle-lang');
  if (langBtn) {
    langBtn.addEventListener('click', () => {
      if (onToggleLang) onToggleLang();
    });
  }
}
