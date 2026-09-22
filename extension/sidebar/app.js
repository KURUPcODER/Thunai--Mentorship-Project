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

function normalizeUrl(url) {
  if (!url || typeof url !== 'string') return '';
  try {
    const parsed = new URL(url);
    let pathname = parsed.pathname;
    if (pathname.length > 1 && pathname.endsWith('/')) {
      pathname = pathname.slice(0, -1);
    }
    return `${parsed.protocol}//${parsed.host}${pathname}${parsed.search}`.toLowerCase();
  } catch (e) {
    return url.split('#')[0].replace(/\/+$/, '').trim().toLowerCase();
  }
}

function isSamePageUrl(url1, url2) {
  if (!url1 || !url2) return false;
  return normalizeUrl(url1) === normalizeUrl(url2);
}

async function ensureContentScript(tabId, url) {
  if (!tabId || !url || typeof url !== 'string') {
    return false;
  }

  // Only attempt injection for normal http:// and https:// pages
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return false;
  }

  // Do not inject into chrome://, chrome-extension://, about:, or other restricted URLs
  if (url.startsWith('chrome://') || url.startsWith('chrome-extension://') || url.startsWith('about:')) {
    return false;
  }

  if (typeof chrome === 'undefined' || !chrome.tabs || !chrome.tabs.sendMessage) {
    return false;
  }

  // 1. Send PING to check if content script is already alive
  const isAlive = await new Promise((resolve) => {
    try {
      chrome.tabs.sendMessage(tabId, { action: 'PING' }, (res) => {
        if (chrome.runtime && chrome.runtime.lastError) {
          resolve(false);
        } else if (res && res.pong) {
          resolve(true);
        } else {
          resolve(false);
        }
      });
    } catch (err) {
      resolve(false);
    }
  });

  if (isAlive) {
    return true;
  }

  // 2. If PING fails, programmatically inject content-script.js using chrome.scripting
  if (typeof chrome === 'undefined' || !chrome.scripting || !chrome.scripting.executeScript) {
    console.warn("chrome.scripting API not available to inject content script into tab:", tabId);
    return false;
  }

  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ['content-script.js']
    });
    // Brief delay to allow content script to register its message listener
    await new Promise((r) => setTimeout(r, 80));
    return true;
  } catch (err) {
    console.warn("Could not inject content script into tab:", tabId, err);
    return false;
  }
}


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
      translateError: '',
      selectedAreaId: 'all',
      activePageAreas: [],
      activePageLang: 'en',
      activePageLangLabel: '',
      activePageLangLabelEn: '',
      activePageText: '',
      activePageTitle: '',
      activePageUrl: '',
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
    this.refreshActiveView = this.refreshActiveView.bind(this);

    this.init();
  }

  refreshActiveView(view) {
    const targetView = view || this.state.currentView;
    if (targetView === 'translate') {
      this.setState({
        isTranslating: false,
        hasTranslated: false,
        isSimplified: false,
        translatedData: null,
        translateError: '',
        selectedAreaId: 'all'
      });
    }
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
      if (tabId === this.currentTabId && url === this.currentTabUrl && this.state.scanReport && isSamePageUrl(this.state.scanReport.url, url)) {
        return;
      }

      // Ensure content script is alive or injected before scanning
      await ensureContentScript(tabId, url);

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
      this.state.isSimplified = false;
      this.state.translateError = '';
      this.state.selectedAreaId = 'all';
      this.state.activePageAreas = [];
      this.state.activePageUrl = url;

      // Render updated loading state
      this.render();

      // Retrieve fresh scan using existing scanPage service
      const freshReport = await scanPage();

      // Guard against stale async results (race condition protection)
      if (requestId === this.scanRequestId) {
        if (freshReport && (isSamePageUrl(freshReport.url, url) || !url)) {
          this.state.scanReport = freshReport;
        }
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

    // 1. Identify active tab first
    let activeUrl = '';
    let activeTabId = null;
    if (typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.query) {
      try {
        const tabs = await new Promise((resolve) => {
          chrome.tabs.query({ active: true, currentWindow: true }, resolve);
        });
        if (tabs && tabs[0]) {
          activeTabId = tabs[0].id;
          activeUrl = tabs[0].url || '';
          await ensureContentScript(activeTabId, activeUrl);
        }
      } catch (err) {
        console.warn("Could not query active tab during init:", err);
      }
    }

    // 2. Validate and hydrate cached scan ONLY if it matches the current active tab
    try {
      const cachedScan = await getLatestScan();
      if (cachedScan && !this.state.scanReport) {
        if (activeUrl && isSamePageUrl(cachedScan.url, activeUrl)) {
          this.state.scanReport = cachedScan;
          this.currentTabId = activeTabId;
          this.currentTabUrl = activeUrl;
        } else if (!activeUrl && (typeof chrome === 'undefined' || !chrome.tabs)) {
          // Preview/standalone mock fallback when chrome.tabs is unavailable
          this.state.scanReport = cachedScan;
        } else {
          // Cached scan belongs to a different URL; keep UI in scanning state
          this.state.isScanning = true;
        }
      }
    } catch(err) {
      console.warn("Could not hydrate cached scan:", err);
    }

    // 3. Perform active tab sync
    await this.refreshActiveTabState();

    this.render();
  }
}

// Initialize on DOM Ready
document.addEventListener('DOMContentLoaded', () => {
  window.ThunaiInstance = new ThunaiApp();
});
