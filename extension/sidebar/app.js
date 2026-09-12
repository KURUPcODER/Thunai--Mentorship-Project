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
import { getLatestScan } from '../services/scanService.js';

class ThunaiApp {
  constructor() {
    this.navRoot = document.getElementById('nav-root');
    this.viewRoot = document.getElementById('view-root');

    this.tabStates = new Map();
    this.activeTabId = 'default';
    this.state = this.createDefaultState();

    this.navigate = this.navigate.bind(this);
    this.goBack = this.goBack.bind(this);
    this.setState = this.setState.bind(this);
    this.toggleLanguage = this.toggleLanguage.bind(this);
    this.switchToTab = this.switchToTab.bind(this);

    this.init();
  }

  createDefaultState(url = 'unknown') {
    return {
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
      pageSessionUrl: url,
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
  }

  setState(partialState) {
    this.state = { ...this.state, ...partialState };
    this.tabStates.set(this.activeTabId, this.state);
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

      // Active Scan Trigger on navigation to demanding views
      if (newView === 'listen' || newView === 'scan' || newView === 'diagnostics') {
        const tabId = this.activeTabId;
        const currentUrl = this.state.pageSessionUrl;

        if (!this.state.scanReport || this.state.scanReport.url !== currentUrl) {
          this.state.scanReport = null;
          this.state.isScanning = true;
          this.render();
          
          import('../services/scanService.js').then(module => {
            module.scanPage(tabId).then(freshReport => {
              const st = this.tabStates.get(tabId);
              if (st && st.pageSessionUrl === currentUrl) {
                st.scanReport = freshReport;
                st.isScanning = false;
                
                import('../services/ttsService.js').then(tts => {
                   tts.ttsService.loadSegments(freshReport?.textSegments || [], tabId, currentUrl);
                });
                
                if (this.activeTabId === tabId) {
                  this.state = st;
                  this.render();
                }
              }
            });
          });
        }
      }
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
        renderListenView(this.viewRoot, this.state, this.setState, this.activeTabId);
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

  async switchToTab(tabId, newUrl = 'unknown') {
    this.activeTabId = tabId;
    let actualUrl = newUrl;

    if (typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.get) {
      try {
        const tab = await new Promise(r => chrome.tabs.get(tabId, r));
        if (tab && tab.url) {
          actualUrl = tab.url;
        }
      } catch (e) {}
    }

    const existingState = this.tabStates.get(tabId);
    if (!existingState || existingState.pageSessionUrl !== actualUrl) {
      this.tabStates.set(tabId, this.createDefaultState(actualUrl));
    }
    
    this.state = this.tabStates.get(tabId);
    
    if (!this.state.scanReport && this.state.pageSessionUrl !== 'unknown') {
      try {
        const cachedScan = await getLatestScan(tabId);
        if (cachedScan && cachedScan.url === this.state.pageSessionUrl) {
          this.state.scanReport = cachedScan;
        }
      } catch(e) {}
    }

    this.render();
  }

  async init() {
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.state.currentView !== 'launcher') {
        this.goBack();
      }
    });

    if (typeof chrome !== 'undefined') {
      if (chrome.tabs) {
        // Handle Active Tab Switching
        chrome.tabs.onActivated.addListener(activeInfo => {
          this.switchToTab(activeInfo.tabId);
        });

        // Initialize first active tab
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          if (tabs && tabs[0]) {
            this.switchToTab(tabs[0].id, tabs[0].url);
          }
        });
      }

      // Handle Cross-Tab Page Navigations / SPA routing
      if (chrome.runtime && chrome.runtime.onMessage) {
        chrome.runtime.onMessage.addListener(async (msg, sender) => {
          if (msg.action === 'PAGE_NAVIGATED') {
            const senderTabId = sender.tab ? sender.tab.id : this.activeTabId;
            const newUrl = msg.url || 'unknown';
            
            const existingState = this.tabStates.get(senderTabId) || this.createDefaultState();
            
            // Invalidate state if URL effectively changed contexts
            if (existingState.pageSessionUrl !== newUrl) {
              const freshState = this.createDefaultState(newUrl);
              
              // Maintain UX if user had the app open
              if (existingState.currentView !== 'launcher') {
                freshState.currentView = existingState.currentView === 'diagnostics' ? 'scan' : existingState.currentView;
              }

              this.tabStates.set(senderTabId, freshState);
              
              if (this.activeTabId === senderTabId) {
                this.state = freshState;
                this.render();
              }
              
              // Re-extract data entirely if they were actively using the toolkit
              if (freshState.currentView !== 'launcher') {
                freshState.isScanning = true;
                this.tabStates.set(senderTabId, freshState);
                if (this.activeTabId === senderTabId) this.render();
                
                // Let the frontend visually catch up then re-scan
                setTimeout(() => {
                  import('../services/scanService.js').then(module => {
                    module.scanPage(senderTabId).then(newReport => {
                       const st = this.tabStates.get(senderTabId);
                       if (st && st.pageSessionUrl === newUrl) {
                         st.scanReport = newReport;
                         st.isScanning = false;
                         this.tabStates.set(senderTabId, st);
                         
                         // Actively push fresh URL-validated extraction into TTS context immediately 
                         import('../services/ttsService.js').then(tts => {
                            tts.ttsService.loadSegments(newReport.textSegments, senderTabId, newUrl);
                         });

                         if (this.activeTabId === senderTabId) {
                           this.state = st;
                           this.render();
                         }
                       }
                    });
                  });
                }, 300);
              }
            }
          }
        });
      }
    }
    this.render();
  }
}

// Initialize on DOM Ready
document.addEventListener('DOMContentLoaded', () => {
  window.ThunaiInstance = new ThunaiApp();
});
