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

    this.init();
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

  async syncActiveTab(forced = false) {
    try {
      const info = await getActivePageInfo();
      if (!info) return;

      const urlChanged = info.url && info.url !== this.state.activePageUrl;
      const initialLoad = !this.state.activePageUrl;

      if (urlChanged || forced || initialLoad) {
        const nextReqSeq = (this.state.requestSeq || 0) + 1;

        const stateUpdates = {
          activePageUrl: info.url,
          activePageTitle: info.title || 'Active Webpage',
          activePageLang: info.langCode || 'en',
          activePageLangLabel: info.langLabel || 'ഇംഗ്ലീഷ് (English)',
          activePageLangLabelEn: info.langLabelEn || 'English (ഇംഗ്ലീഷ്)',
          activePageText: info.fullText || '',
          requestSeq: nextReqSeq
        };

        // Reset stale translation & per-page state when user navigates to a new page
        if (urlChanged) {
          stateUpdates.isTranslating = false;
          stateUpdates.hasTranslated = false;
          stateUpdates.isSimplified = false;
          stateUpdates.translatedData = null;
          stateUpdates.translateError = '';

          // Reset scan report if it belonged to another URL
          if (this.state.scanReport && this.state.scanReport.url !== info.url) {
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
      this.toggleLanguage
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
