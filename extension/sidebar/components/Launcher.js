/**
 * Launcher / Home Component (View: 'launcher')
 * Features Spacious Hero 'Scan Page' Master Action (larger size, breadth & thickness)
 * with generously padded, centered feature boxes below it covering the viewport.
 */

import { getT } from '../i18n.js';
import { searchService } from '../../services/searchService.js';

export function renderLauncher(container, currentLang, onNavigate, onToggleLang) {
  const t = getT(currentLang);
  const isEn = currentLang === 'en';
  const activeTitle = (typeof document !== 'undefined' && window.parent && window.parent.document && window.parent.document.title) 
    ? window.parent.document.title.slice(0, 32) 
    : 'Active Webpage';

  container.innerHTML = `
    <div class="launcher-view animate-fade-in" role="region" aria-label="Thunai Launcher Home">
      
      <!-- Top Header Row (Logo, Title, Language Switcher) -->
      <header class="launcher-header-compact">
        <div class="launcher-top-brand-bar">
          <div class="brand-badge-compact">
            <div class="brand-icon-mini" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.3">
                <circle cx="12" cy="12" r="10" stroke="#D97706"></circle>
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" stroke="#DC2626"></path>
                <path d="M2 12h20" stroke="#D97706"></path>
              </svg>
            </div>
            <div class="brand-text-compact">
              <h1 class="brand-title-compact">
                <span class="brand-name-en">Thunai</span> 
                <span class="brand-divider">/</span> 
                <span class="brand-name-ml">തുണ</span>
              </h1>
              <span class="badge-subtitle-compact">${t.brandSub}</span>
            </div>
          </div>

          <!-- 1-Click Language Switcher -->
          <button class="btn-lang-toggle launcher-lang-toggle-compact" id="launcher-btn-toggle-lang" title="Switch Language" aria-label="Switch interface language">
            <span class="lang-globe-icon">🌐</span>
            <span class="lang-btn-text">${t.toggleLabel}</span>
          </button>
        </div>

        <!-- Sleek Search & Active Context Bar -->
        <div class="launcher-search-row-compact">
          <div class="search-input-wrapper-compact">
            <div class="search-icon-box-compact" aria-hidden="true">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </div>
            <input type="text" 
                   id="launcher-quick-search-input" 
                   class="search-text-input-compact" 
                   placeholder="${t.searchPlaceholder}">
          </div>
          <div class="page-context-pill-compact" title="${activeTitle}">
            <span class="pulse-indicator-compact"></span>
            <span class="context-title-compact">${activeTitle}</span>
          </div>
        </div>
      </header>

      <!-- HERO PRIMARY ACTION: SCAN PAGE (Larger Size, Breadth & Thickness) -->
      <button class="hero-scan-master-card" id="btn-action-scan" data-target="scan" aria-label="${t.actionScanTitle}">
        <div class="hero-scan-icon-container">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            <path d="M11 7v8M7 11h8"></path>
          </svg>
        </div>
        <div class="hero-scan-text-container">
          <div class="hero-scan-title-row">
            <span class="hero-scan-title-main">${t.actionScanTitle}</span>
            <span class="hero-scan-title-sub">${t.actionScanSub}</span>
            <span class="hero-scan-badge">${isEn ? 'LIVE SCAN' : 'തത്സമയ സ്കാൻ'}</span>
          </div>
          <p class="hero-scan-desc">${isEn ? 'Scan active webpage live for WCAG issues, text & AI fixes' : 'നിലവിലെ വെബ്‌പേജ് തത്സമയം സ്കാൻ ചെയ്ത് പ്രശ്നങ്ങളും AI പരിഹാരങ്ങളും കണ്ടെത്തുക'}</p>
        </div>
        <div class="hero-scan-arrow" aria-hidden="true">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <path d="M5 12h14M12 5l7 7-7 7"></path>
          </svg>
        </div>
      </button>

      <!-- SECONDARY FEATURES LIST (Generously padded, centered below Scan Page) -->
      <nav class="action-cards-grid-compact" aria-label="Accessibility feature tools">
        
        <!-- Feature 1: Dyslexia Friendly Mode -->
        <button class="action-card-compact dyslexia-highlight-card" id="btn-action-dyslexia" data-target="dyslexia" aria-label="${t.actionDyslexiaTitle}">
          <div class="card-icon-container-compact dyslexia-icon-accent">
            <span style="font-size: 19px;">👁️</span>
          </div>
          <div class="card-text-container-compact">
            <div class="card-title-row-compact">
              <span class="card-title-main" style="color: #92400E;">${t.actionDyslexiaTitle}</span>
              <span class="card-title-sub">${t.actionDyslexiaSub}</span>
            </div>
            <p class="card-desc-compact">${t.actionDyslexiaDesc}</p>
          </div>
          <div class="card-arrow-compact" aria-hidden="true">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3">
              <path d="M5 12h14M12 5l7 7-7 7"></path>
            </svg>
          </div>
        </button>

        <!-- Feature 2: Find in Page -->
        <button class="action-card-compact" id="btn-action-search" data-target="search" aria-label="${t.actionSearchTitle}">
          <div class="card-icon-container-compact search-icon-accent">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              <line x1="11" y1="8" x2="11" y2="14"></line>
              <line x1="8" y1="11" x2="14" y2="11"></line>
            </svg>
          </div>
          <div class="card-text-container-compact">
            <div class="card-title-row-compact">
              <span class="card-title-main">${t.actionSearchTitle}</span>
              <span class="card-title-sub">${t.actionSearchSub}</span>
            </div>
            <p class="card-desc-compact">${t.actionSearchDesc}</p>
          </div>
          <div class="card-arrow-compact" aria-hidden="true">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3">
              <path d="M5 12h14M12 5l7 7-7 7"></path>
            </svg>
          </div>
        </button>

        <!-- Feature 3: Read in Malayalam (TTS) -->
        <button class="action-card-compact" id="btn-action-listen" data-target="listen" aria-label="${t.actionListenTitle}">
          <div class="card-icon-container-compact listen-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
            </svg>
          </div>
          <div class="card-text-container-compact">
            <div class="card-title-row-compact">
              <span class="card-title-main">${t.actionListenTitle}</span>
              <span class="card-title-sub">${t.actionListenSub}</span>
            </div>
            <p class="card-desc-compact">${t.actionListenDesc}</p>
          </div>
          <div class="card-arrow-compact" aria-hidden="true">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3">
              <path d="M5 12h14M12 5l7 7-7 7"></path>
            </svg>
          </div>
        </button>

        <!-- Feature 4: Simplify / Translate -->
        <button class="action-card-compact" id="btn-action-translate" data-target="translate" aria-label="${t.actionTranslateTitle}">
          <div class="card-icon-container-compact translate-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3">
              <path d="M5 8l6 6M4 14l6-6 3 3M2 5h12M7 2h1M22 22l-5-10-5 10M14 18h6"></path>
            </svg>
          </div>
          <div class="card-text-container-compact">
            <div class="card-title-row-compact">
              <span class="card-title-main">${t.actionTranslateTitle}</span>
              <span class="card-title-sub">${t.actionTranslateSub}</span>
            </div>
            <p class="card-desc-compact">${t.actionTranslateDesc}</p>
          </div>
          <div class="card-arrow-compact" aria-hidden="true">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3">
              <path d="M5 12h14M12 5l7 7-7 7"></path>
            </svg>
          </div>
        </button>

        <!-- Feature 5: Why Doesn't This Work? (Diagnostics) -->
        <button class="action-card-compact" id="btn-action-diagnose" data-target="diagnostics" aria-label="${t.actionDiagTitle}">
          <div class="card-icon-container-compact diagnose-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3">
              <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>
            </svg>
          </div>
          <div class="card-text-container-compact">
            <div class="card-title-row-compact">
              <span class="card-title-main">${t.actionDiagTitle}</span>
              <span class="card-title-sub">${t.actionDiagSub}</span>
            </div>
            <p class="card-desc-compact">${t.actionDiagDesc}</p>
          </div>
          <div class="card-arrow-compact" aria-hidden="true">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3">
              <path d="M5 12h14M12 5l7 7-7 7"></path>
            </svg>
          </div>
        </button>
      </nav>

      <!-- Footer Badges Row -->
      <footer class="launcher-badges-row-compact" aria-label="Supported Accessibility Standards">
        <span class="tech-pill-compact badge-wcag">${t.badgeWcag}</span>
        <span class="tech-pill-compact badge-axe">${t.badgeAxe}</span>
        <span class="tech-pill-compact badge-tts">${t.badgeTts}</span>
        <span class="tech-pill-compact badge-ai">${t.badgeAi}</span>
      </footer>
    </div>
  `;

  // Attach navigation events
  container.querySelectorAll('#btn-action-scan, .action-card-compact').forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.getAttribute('data-target');
      if (onNavigate) onNavigate(target);
    });
  });

  // Attach language toggle
  const langBtn = container.querySelector('#launcher-btn-toggle-lang');
  if (langBtn) {
    langBtn.addEventListener('click', () => {
      if (onToggleLang) onToggleLang();
    });
  }

  // Attach quick search input
  const searchInput = container.querySelector('#launcher-quick-search-input');
  if (searchInput) {
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        searchService.searchPage(searchInput.value);
        if (onNavigate) onNavigate('search');
      }
    });
  }
}
