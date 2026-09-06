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

    // Hydrate latest scan from chrome.storage.local
    try {
      const cachedScan = await getLatestScan();
      if (cachedScan && !this.state.scanReport) {
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
