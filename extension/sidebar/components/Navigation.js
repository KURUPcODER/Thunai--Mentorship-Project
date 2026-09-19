/**
 * Navigation Component with 5 Persistent Tabs (Translate, Listen, Find, Scan, Settings)
 * and 1-Click Bilingual Language Toggle (EN ↔ മലയാളം).
 */

import { getT } from '../i18n.js';

export function renderTopNavigation(container, currentView, currentLang, onNavigate, onBack, onToggleLang, onRefresh) {
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

        <div class="header-actions-right" style="display: flex; align-items: center; gap: 6px;">
          <!-- Universal Feature Refresh Button -->
          <button class="btn-nav-refresh" id="nav-btn-refresh" title="${t.refreshTooltip || 'Reset current feature to fresh state'}" aria-label="Refresh current feature to fresh state">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3">
              <path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
            </svg>
            <span class="nav-refresh-text">${t.refreshBtn ? t.refreshBtn.split(' ')[0] : 'റീഫ്രഷ്'}</span>
          </button>

          <!-- 1-Click Language Switcher Button -->
          <button class="btn-lang-toggle" id="nav-btn-toggle-lang" title="Switch Language (മലയാളം / English)" aria-label="Switch interface language">
            <span class="lang-globe-icon">🌐</span>
            <span class="lang-btn-text">${t.toggleLabel}</span>
          </button>
        </div>
      </div>

      <!-- Persistent 5 Top Tabs -->
      <nav class="persistent-tabs-bar" role="tablist" aria-label="Main Navigation Tabs">
        
        <!-- Tab 1: Translate -->
        <button class="nav-tab ${currentView === 'translate' ? 'active' : ''}" 
                role="tab" 
                id="tab-translate" 
                data-tab="translate"
                title="${currentLang === 'ml' ? 'വിവർത്തനം (Translate)' : 'Translate (വിവർത്തനം)'}"
                aria-selected="${currentView === 'translate'}" 
                aria-controls="panel-translate">
          <span class="nav-tab-icon" aria-hidden="true">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M5 8l6 6M4 14l6-6 3 3M2 5h12M7 2h1M22 22l-5-10-5 10M14 18h6"></path>
            </svg>
          </span>
          <div class="nav-tab-text">
            <span class="tab-label-ml">${t.tabTranslate}</span>
            <span class="tab-label-en">${t.tabTranslateSub}</span>
          </div>
        </button>

        <!-- Tab 2: Listen -->
        <button class="nav-tab ${currentView === 'listen' ? 'active' : ''}" 
                role="tab" 
                id="tab-listen" 
                data-tab="listen"
                title="${currentLang === 'ml' ? 'വായിച്ചു കേൾക്കുക (Listen Aloud)' : 'Listen Aloud (വായിച്ചു കേൾക്കുക)'}"
                aria-selected="${currentView === 'listen'}" 
                aria-controls="panel-listen">
          <span class="nav-tab-icon" aria-hidden="true">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
              <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
            </svg>
          </span>
          <div class="nav-tab-text">
            <span class="tab-label-ml">${t.tabListen}</span>
            <span class="tab-label-en">${t.tabListenSub}</span>
          </div>
        </button>

        <!-- Tab 3: Find / Search in Page -->
        <button class="nav-tab ${currentView === 'search' ? 'active' : ''}" 
                role="tab" 
                id="tab-search" 
                data-tab="search"
                title="${currentLang === 'ml' ? 'വാക്ക് തിരയുക (Find in Page)' : 'Find in Page (വാക്ക് തിരയുക)'}"
                aria-selected="${currentView === 'search'}" 
                aria-controls="panel-search">
          <span class="nav-tab-icon" aria-hidden="true">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </span>
          <div class="nav-tab-text">
            <span class="tab-label-ml">${t.tabSearch}</span>
            <span class="tab-label-en">${t.tabSearchSub}</span>
          </div>
        </button>

        <!-- Tab 4: Scan -->
        <button class="nav-tab ${currentView === 'scan' ? 'active' : ''}" 
                role="tab" 
                id="tab-scan" 
                data-tab="scan"
                title="${currentLang === 'ml' ? 'സഹായി & പരിശോധന (Scan & Guide)' : 'Scan & Guide (സഹായി & പരിശോധന)'}"
                aria-selected="${currentView === 'scan'}" 
                aria-controls="panel-scan">
          <span class="nav-tab-icon" aria-hidden="true">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
            </svg>
          </span>
          <div class="nav-tab-text">
            <span class="tab-label-ml">${t.tabScan}</span>
            <span class="tab-label-en">${t.tabScanSub}</span>
          </div>
        </button>

        <!-- Tab 5: Settings / Fix -->
        <button class="nav-tab ${currentView === 'settings' || currentView === 'fixes' ? 'active' : ''}" 
                role="tab" 
                id="tab-settings" 
                data-tab="settings"
                title="${currentLang === 'ml' ? 'ക്രമീകരണം (Preferences & Fixes)' : 'Settings & Fixes (ക്രമീകരണം)'}"
                aria-selected="${currentView === 'settings' || currentView === 'fixes'}" 
                aria-controls="panel-settings">
          <span class="nav-tab-icon" aria-hidden="true">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="3"></circle>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
            </svg>
          </span>
          <div class="nav-tab-text">
            <span class="tab-label-ml">${t.tabSettings}</span>
            <span class="tab-label-en">${t.tabSettingsSub}</span>
          </div>
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

  // Attach universal refresh button
  const refreshBtn = container.querySelector('#nav-btn-refresh');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => {
      const svg = refreshBtn.querySelector('svg');
      if (svg) svg.classList.add('spin-once');
      setTimeout(() => {
        if (svg) svg.classList.remove('spin-once');
      }, 600);
      if (onRefresh) onRefresh();
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
