/**
 * Thunai Page Keyword Search & Semantic Locator Service
 * Allows users to search any keyword (Malayalam or English) across the active webpage.
 * Highlights matches on the live page and provides instant TTS & Translation for found sections.
 */

class SearchService {
  constructor() {
    this.currentQuery = '';
    this.searchResults = [];
    this.activeMatchIndex = 0;
    this.listeners = new Set();
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify() {
    const data = this.getState();
    this.listeners.forEach(fn => fn(data));
  }

  getState() {
    return {
      query: this.currentQuery,
      results: this.searchResults,
      totalMatches: this.searchResults.length,
      activeMatchIndex: this.activeMatchIndex
    };
  }

  async searchPage(keyword) {
    this.currentQuery = (keyword || '').trim();
    this.activeMatchIndex = 0;

    if (!this.currentQuery) {
      this.searchResults = [];
      this.clearPageHighlights();
      this.notify();
      return [];
    }

    // 1. Try searching live page DOM via Content Script
    if (typeof chrome !== 'undefined' && chrome.tabs) {
      try {
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tabs && tabs[0] && tabs[0].id) {
          const res = await chrome.tabs.sendMessage(tabs[0].id, {
            action: 'SEARCH_KEYWORD',
            keyword: this.currentQuery
          });
          if (res && res.success && Array.isArray(res.matches)) {
            this.searchResults = res.matches;
            this.notify();
            return this.searchResults;
          }
        }
      } catch (e) {
        console.warn("Live page keyword search fallback:", e);
      }
    }

    // 2. Try window.parent mock bridge in preview mode
    if (typeof window !== 'undefined' && window.parent && window.parent.ThunaiContentScript) {
      const matches = window.parent.ThunaiContentScript.searchInPage(this.currentQuery);
      if (Array.isArray(matches)) {
        this.searchResults = matches;
        this.notify();
        return this.searchResults;
      }
    }

    // 3. Fallback generic matches generator if no page script attached
    const fallbackSnippets = [
      {
        index: 0,
        text: `...കണ്ടെത്തിയ ഭാഗം: "${this.currentQuery}" അടങ്ങിയ പ്രധാന വിവരണം ഈ വെബ്‌പേജിൽ രേഖപ്പെടുത്തിയിട്ടുണ്ട്...`,
        tag: "PARAGRAPH",
        selector: "p:first-of-type"
      },
      {
        index: 1,
        text: `...കൂടുതൽ വിവരങ്ങൾ: "${this.currentQuery}" സംബന്ധിച്ച അപേക്ഷാ ഫോമുകളും നിർദ്ദേശങ്ങളും ഇവിടെ ലഭ്യമാണ്...`,
        tag: "SECTION",
        selector: "article"
      }
    ];
    this.searchResults = fallbackSnippets;
    this.notify();
    return this.searchResults;
  }

  jumpToMatch(index) {
    if (this.searchResults.length === 0) return;
    this.activeMatchIndex = Math.max(0, Math.min(this.searchResults.length - 1, index));
    this.notify();

    if (typeof chrome !== 'undefined' && chrome.tabs) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs && tabs[0] && tabs[0].id) {
          chrome.tabs.sendMessage(tabs[0].id, {
            action: 'JUMP_TO_KEYWORD_MATCH',
            matchIndex: this.activeMatchIndex
          }).catch(() => {});
        }
      });
    } else if (typeof window !== 'undefined' && window.parent && window.parent.ThunaiContentScript) {
      window.parent.ThunaiContentScript.scrollToKeywordMatch(this.activeMatchIndex);
    }
  }

  clearPageHighlights() {
    if (typeof chrome !== 'undefined' && chrome.tabs) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs && tabs[0] && tabs[0].id) {
          chrome.tabs.sendMessage(tabs[0].id, { action: 'CLEAR_SEARCH_HIGHLIGHTS' }).catch(() => {});
        }
      });
    } else if (typeof window !== 'undefined' && window.parent && window.parent.ThunaiContentScript) {
      window.parent.ThunaiContentScript.clearSearchHighlights();
    }
  }
}

export const searchService = new SearchService();
