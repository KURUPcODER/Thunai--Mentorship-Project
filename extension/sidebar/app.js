/**
 * Thunai Sidebar App Controller
 * Orchestrates views: Scan Page FIRST, Dyslexia Friendly Mode, Keyword Search, Listen, Translate.
 * Manages active tab synchronization, navigation change detection, and stale state cleanup.
 */

import { renderLauncher } from './components/Launcher.js';
import { renderTopNavigation } from './components/Navigation.js';
import { renderTranslateView } from './components/TranslateView.js';
import { renderListenView } from './components/ListenView.js';
import { renderScanView } from './components/ScanView.js';
import { renderSearchView } from './components/SearchView.js';
import { renderDyslexiaModeView } from './components/DyslexiaModeView.js';
import { renderFixReviewView } from './components/FixReviewView.js';
import { renderDiagnosticsView } from './components/DiagnosticsView.js';
import { renderGovPortalView } from './components/GovPortalView.js';
import { getLatestScan } from '../services/scanService.js';
import { getActivePageInfo } from '../services/translateService.js';

class ThunaiApp {
  constructor() {
    this.navRoot = document.getElementById('nav-root');
    this.viewRoot = document.getElementById('view-root');

    // Global State
    this.state = {
      currentView: 'launcher',
      currentLang: 'ml', // 'ml' (Malayalam) or 'en' (English)
      history: [],
      // Active Tab & Navigation Tracking
      activePageUrl: '',
      activePageTitle: 'Active Webpage',
      activePageLang: 'en',
      activePageLangLabel: 'ഇംഗ്ലീഷ് (English)',
      activePageLangLabelEn: 'English (ഇംഗ്ലീഷ്)',
      activePageText: '',
      requestSeq: 0,
      // Translation State
      isTranslating: false,
      hasTranslated: false,
      isSimplified: false,
      translatedData: null,
      translateError: '',
      // Scan State
      isScanning: false,
      scanReport: null,
      heatmapActive: false,
      expandedCategories: { 'images-media': true, 'color-contrast': true, 'aria': true },
      loadingFixes: {},
      generatedSuggestions: {},
      // Diagnostics State
      isDiagnosing: false,
      hasDiagnosed: false,
      // User Settings (Dyslexia & Typography)
      settings: {
        textSize: 120,
        lineSpacing: 1.8,
        letterSpacing: 1,
        fontFamily: 'lexend',
        colorTint: 'cream',
        highContrast: false,
        dyslexiaFont: true,
        readingRuler: true,
        defaultVoice: "ml-IN-female-1",
        defaultSpeed: 1.0,
        preferredLang: "ml"
      }
    };

    this.navigate = this.navigate.bind(this);
    this.goBack = this.goBack.bind(this);
    this.setState = this.setState.bind(this);
    this.toggleLanguage = this.toggleLanguage.bind(this);
    this.syncActiveTab = this.syncActiveTab.bind(this);
    this.refreshActiveView = this.refreshActiveView.bind(this);

    this.init();
  }

  async refreshActiveView() {
    // 1. Notify content script to reset active in-page overlays & styles
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

    // 2. View-specific state reset to pristine fresh state
    const view = this.state.currentView;
    if (view === 'search') {
      const { searchService } = await import('../services/searchService.js');
      searchService.clear();
    } else if (view === 'translate') {
      this.setState({
        isTranslating: false,
        hasTranslated: false,
        isSimplified: false,
        translatedData: null,
        translateError: '',
        selectedAreaId: 'all'
      });
    } else if (view === 'listen') {
      const { ttsService } = await import('../services/ttsService.js');
      ttsService.stop();
      ttsService.setSpeed(1.0);
    } else if (view === 'dyslexia' || view === 'settings') {
      const resetSettings = {
        ...this.state.settings,
        textSize: 100,
        fontFamily: 'default',
        dyslexiaFont: false,
        colorTint: 'none',
        letterSpacing: 0,
        lineSpacing: 1.6,
        readingRuler: false
      };
      this.setState({ settings: resetSettings });
      if (typeof chrome !== 'undefined' && chrome.tabs) {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          if (tabs && tabs[0]) {
            chrome.tabs.sendMessage(tabs[0].id, { action: 'UPDATE_SETTINGS', settings: resetSettings }).catch(() => {});
          }
        });
      }
    } else if (view === 'diagnostics') {
      this.setState({
        currentInspectedElement: null,
        diagPageContent: null,
        diagButtonAudit: null,
        chatMessages: [
          {
            sender: 'assistant',
            textMl: `നമസ്കാരം! ഞാൻ നിങ്ങളുടെ തുണ (Thunai) വെബ്സഹായിയാണ്. നിലവിൽ "${this.state.activePageTitle}" എന്ന പേജിലെ വിവരങ്ങളും തടസ്സങ്ങളും ഞാൻ നിരീക്ഷിക്കുന്നുണ്ട്.\n\nഏതെങ്കിലും ബട്ടൺ ക്ലിക്ക് ചെയ്യാനാകുന്നില്ലെങ്കിലോ, ഫോം പൂരിപ്പിക്കാൻ സഹായം വേണമെങ്കിലോ എന്നോട് ചോദിക്കാം.`,
            textEn: `Hello! I am your Thunai Web Assistant. I am actively analyzing "${this.state.activePageTitle}".\n\nIf any button is not working, or if you need step-by-step help filling forms on this page, please ask!`,
            timestamp: Date.now()
          }
        ]
      });
    } else if (view === 'scan') {
      this.setState({
        scanReport: null,
        isScanning: false,
        heatmapActive: false,
        loadingFixes: {},
        generatedSuggestions: {}
      });
    }

    // 3. Re-render the active view cleanly
    this.render();
  }

  setState(partialState) {
    this.state = { ...this.state, ...partialState };
  }

  toggleLanguage() {
    const nextLang = this.state.currentLang === 'ml' ? 'en' : 'ml';
    this.state.currentLang = nextLang;
    this.state.settings.preferredLang = nextLang;
    this.render();
  }

  navigate(newView) {
    if (this.state.currentView !== newView) {
      this.state.history.push(this.state.currentView);
      this.state.currentView = newView;
      this.syncActiveTab();
      this.render();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  goBack() {
    if (this.state.history.length > 0) {
      const prevView = this.state.history.pop();
      this.state.currentView = prevView;
      this.syncActiveTab();
      this.render();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      this.state.currentView = 'launcher';
      this.render();
    }
  }

  normalizeUrl(url) {
    if (!url) return '';
    try {
      const parsed = new URL(url);
      const path = parsed.pathname.replace(/\/+$/, '') || '/';
      return `${parsed.protocol}//${parsed.host}${path}${parsed.search}`.toLowerCase();
    } catch (_) {
      return String(url).trim().replace(/\/+$/, '').toLowerCase();
    }
  }

  async syncActiveTab(forced = false) {
    try {
      const info = await getActivePageInfo();
      if (!info) return;

      const currentNorm = this.normalizeUrl(this.state.activePageUrl);
      const newNorm = this.normalizeUrl(info.url);
      const urlChanged = Boolean(currentNorm && newNorm && currentNorm !== newNorm);
      const initialLoad = !currentNorm;

      if (urlChanged || forced || initialLoad) {
        const nextReqSeq = (this.state.requestSeq || 0) + 1;

        const stateUpdates = {
          activePageUrl: info.url || this.state.activePageUrl,
          activePageTitle: info.title || this.state.activePageTitle || 'Active Webpage',
          activePageLang: info.langCode || this.state.activePageLang || 'en',
          activePageLangLabel: info.langLabel || this.state.activePageLangLabel || 'ഇംഗ്ലീഷ് (English)',
          activePageLangLabelEn: info.langLabelEn || this.state.activePageLangLabelEn || 'English (ഇംഗ്ലീഷ്)',
          activePageText: info.fullText || this.state.activePageText || '',
          activePageAreas: info.areas || this.state.activePageAreas || [],
          requestSeq: nextReqSeq
        };

        // Reset per-page state ONLY when the active tab has genuinely navigated to a different URL
        if (urlChanged) {
          stateUpdates.isTranslating = false;
          stateUpdates.hasTranslated = false;
          stateUpdates.isSimplified = false;
          stateUpdates.translatedData = null;
          stateUpdates.translateError = '';
          stateUpdates.selectedAreaId = 'all';

          // Reset scan report if it belonged to another URL
          if (this.state.scanReport && this.normalizeUrl(this.state.scanReport.url) !== newNorm) {
            stateUpdates.scanReport = null;
          }
        }

        this.setState(stateUpdates);
        this.render();
      }
    } catch (err) {
      console.warn("Active tab sync error:", err);
    }
  }

  render() {
    const { currentView, currentLang } = this.state;

    // 1. Render Top Header & Tabs (if not on launcher)
    renderTopNavigation(
      this.navRoot, 
      currentView, 
      currentLang, 
      this.navigate, 
      this.goBack, 
      this.toggleLanguage,
      this.refreshActiveView
    );

    // 2. Render Active View Body
    this.viewRoot.innerHTML = '';

    switch (currentView) {
      case 'launcher':
        renderLauncher(this.viewRoot, currentLang, this.navigate, this.toggleLanguage);
        break;

      case 'scan':
        renderScanView(this.viewRoot, this.state, this.setState, this.navigate);
        break;

      case 'dyslexia':
      case 'settings':
        renderDyslexiaModeView(this.viewRoot, this.state, this.setState, this.navigate);
        break;

      case 'translate':
        renderTranslateView(this.viewRoot, this.state, this.setState, this.navigate);
        break;

      case 'listen':
        renderListenView(this.viewRoot, this.state, this.setState);
        break;

      case 'search':
        renderSearchView(this.viewRoot, this.state, this.setState, this.navigate);
        break;

      case 'fixes':
        renderFixReviewView(this.viewRoot, this.state, this.setState, this.navigate);
        break;

      case 'diagnostics':
        renderDiagnosticsView(this.viewRoot, this.state, this.setState, this.navigate);
        break;

      case 'portal':
        renderGovPortalView(this.viewRoot, this.state, this.setState, this.navigate);
        break;

      default:
        renderLauncher(this.viewRoot, currentLang, this.navigate, this.toggleLanguage);
        break;
    }
  }

  async init() {
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.state.currentView !== 'launcher') {
        this.goBack();
      }
    });

    // Listen for tab navigation, tab activation, and SPA transitions
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
      chrome.runtime.onMessage.addListener((message) => {
        if (message.type === 'TAB_NAVIGATED' || message.type === 'TAB_CHANGED' || message.type === 'SPA_NAVIGATED') {
          this.syncActiveTab();
        }
      });
    }

    // Window focus & visibility change hooks for tab sync
    window.addEventListener('focus', () => this.syncActiveTab());
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) this.syncActiveTab();
    });

    // Initial Active Tab Sync & Language Detection
    await this.syncActiveTab(true);

    // Hydrate latest scan if matching current URL
    try {
      const cachedScan = await getLatestScan();
      if (cachedScan && !this.state.scanReport && (!this.state.activePageUrl || cachedScan.url === this.state.activePageUrl)) {
        this.state.scanReport = cachedScan;
      }
    } catch(err) {
      console.warn("Could not hydrate cached scan:", err);
    }

    this.render();
  }
}

// Initialize on DOM Ready
document.addEventListener('DOMContentLoaded', () => {
  window.ThunaiInstance = new ThunaiApp();
});
