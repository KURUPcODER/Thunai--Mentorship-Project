/**
 * Thunai Sidebar App Controller
 * Orchestrates views: Scan Page FIRST, Dyslexia Friendly Mode, Keyword Search, Listen, Translate.
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
import { scanPage, getLatestScan } from '../services/scanService.js';

class ThunaiApp {
  constructor() {
    this.navRoot = document.getElementById('nav-root');
    this.viewRoot = document.getElementById('view-root');

    // Tab & Page Identity Tracking for Dynamic Synchronization
    this.currentTabId = null;
    this.currentTabUrl = null;
    this.scanRequestId = 0;

    // Global State
    this.state = {
      currentView: 'launcher',
      currentLang: 'ml', // 'ml' (Malayalam) or 'en' (English)
      history: [],
      // Translation State
      isTranslating: false,
      hasTranslated: false,
      isSimplified: false,
      translatedData: null,
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
    this.refreshActiveTabState = this.refreshActiveTabState.bind(this);

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
      this.render();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  goBack() {
    if (this.state.history.length > 0) {
      const prevView = this.state.history.pop();
      this.state.currentView = prevView;
      this.render();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      this.state.currentView = 'launcher';
      this.render();
    }
  }

  /**
   * Dynamically refreshes sidebar state when user navigates pages or switches tabs
   */
  async refreshActiveTabState() {
    if (typeof chrome === 'undefined' || !chrome.tabs || !chrome.tabs.query) {
      return;
    }

    try {
      const tabs = await new Promise((resolve) => {
        chrome.tabs.query({ active: true, currentWindow: true }, resolve);
      });

      if (!tabs || !tabs[0]) return;

      const activeTab = tabs[0];
      const tabId = activeTab.id;
      const url = activeTab.url || '';

      // Skip non-web extension internal pages (e.g. chrome://, about:blank)
      if (url.startsWith('chrome://') || url.startsWith('chrome-extension://') || url.startsWith('about:')) {
        return;
      }

      // Deduplication: Skip scan if tab ID & URL have not changed and valid scan exists
      if (tabId === this.currentTabId && url === this.currentTabUrl && this.state.scanReport && this.state.scanReport.url === url) {
        return;
      }

      // Record active tab identity
      this.currentTabId = tabId;
      this.currentTabUrl = url;

      // Increment request ID for race condition protection
      const requestId = ++this.scanRequestId;

      // Invalidate stale page-specific state
      this.state.scanReport = null;
      this.state.isScanning = true;
      this.state.translatedData = null;
      this.state.hasTranslated = false;
      this.state.isTranslating = false;

      // Render updated loading state
      this.render();

      // Retrieve fresh scan using existing scanPage service
      const freshReport = await scanPage();

      // Guard against stale async results (race condition protection)
      if (requestId === this.scanRequestId && freshReport && (freshReport.url === url || !url || url === this.currentTabUrl)) {
        this.state.scanReport = freshReport;
        this.state.isScanning = false;
        this.render();
      }
    } catch (err) {
      console.warn("Sidebar tab refresh error:", err);
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

    // Register Chrome extension event listeners for dynamic page & tab synchronization
    if (typeof chrome !== 'undefined' && chrome.tabs) {
      chrome.tabs.onActivated.addListener(() => {
        this.refreshActiveTabState();
      });

      chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
        if (changeInfo.status === 'complete' || changeInfo.url) {
          chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs && tabs[0] && tabs[0].id === tabId) {
              this.refreshActiveTabState();
            }
          });
        }
      });
    }

    // Hydrate cached scan initially if offline/preview
    try {
      const cachedScan = await getLatestScan();
      if (cachedScan && !this.state.scanReport) {
        this.state.scanReport = cachedScan;
      }
    } catch(err) {
      console.warn("Could not hydrate cached scan:", err);
    }

    // Perform initial active tab sync
    await this.refreshActiveTabState();

    this.render();
  }
}

// Initialize on DOM Ready
document.addEventListener('DOMContentLoaded', () => {
  window.ThunaiInstance = new ThunaiApp();
});
