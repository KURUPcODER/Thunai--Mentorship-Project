/**
 * Thunai Page Keyword Search & Semantic Locator Service
 * Searches the real active webpage and preserves the existing SearchView
 * result/navigation architecture.
 *
 * Find-in-Page supports:
 *   - English
 *   - Malayalam Unicode
 *   - Manglish / Romanized Malayalam via Varnam
 *
 * The content script remains responsible for finding/highlighting actual
 * DOM occurrences. This service only builds the candidate search terms.
 */

class SearchService {
  constructor() {
    this.currentQuery = '';
    this.searchResults = [];
    this.activeMatchIndex = 0;
    this.listeners = new Set();
    this.searchRequestId = 0;
    this.transliterationCache = new Map();
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

  normalizeRomanMalayalam(text) {
    let result = text
      .replace(/ā/gi, 'aa')
      .replace(/ī/gi, 'ii')
      .replace(/ū/gi, 'uu')
      .replace(/ḷ/gi, 'l')
      .replace(/ḻ/gi, 'zh')
      .replace(/ṇ/gi, 'n')
      .replace(/ṅ/gi, 'ng')
      .replace(/ñ/gi, 'nj')
      .replace(/ṭ/gi, 't')
      .replace(/ḍ/gi, 'd')
      .replace(/ṟ/gi, 'r')
      .replace(/ṛ/gi, 'r')
      .replace(/ś/gi, 'sh')
      .replace(/ṣ/gi, 'sh')
      .replace(/[ṁṃ]/gi, 'm');

    return result
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .normalize('NFC');
  }

  async transliterateManglish(word) {
    const cacheKey = word.toLowerCase();

    if (this.transliterationCache.has(cacheKey)) {
      return this.transliterationCache.get(cacheKey);
    }

    const response = await new Promise((resolve, reject) => {
      if (typeof chrome === 'undefined' || !chrome.runtime) {
        reject(new Error('Chrome runtime is unavailable'));
        return;
      }

      chrome.runtime.sendMessage(
        { type: 'TRANSLITERATE', word },
        (result) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
            return;
          }
          resolve(result);
        }
      );
    });

    if (response && response.success) {
      this.transliterationCache.set(cacheKey, response);
    }

    return response;
  }

  async getSearchTerms(query, requestId) {
    const terms = [query];
    const hasMalayalam = /[\u0D00-\u0D7F]/.test(query);

    if (hasMalayalam) {
      return terms;
    }

    // Preserve the working Romanized-Malayalam normalization from the
    // standalone Find-in-Page implementation.
    const normalized = this.normalizeRomanMalayalam(query);
    if (normalized !== query) {
      terms.push(normalized);
    }

    // Only Roman/Romanized input is sent to Varnam.
    const looksRomanized = /^[a-zA-Z\s'-]+$/.test(normalized);
    if (!looksRomanized || normalized.length < 2) {
      return terms;
    }

    try {
      const data = await this.transliterateManglish(normalized);

      // Do not let an older Varnam response overwrite a newer query.
      if (requestId !== this.searchRequestId) {
        return null;
      }

      if (data && data.success && Array.isArray(data.result)) {
        for (const candidate of data.result) {
          if (typeof candidate === 'string' && candidate.trim()) {
            terms.push(candidate.trim());
          }
        }
      }
    } catch (error) {
      // Exact English/Roman matches are still searched if Varnam fails.
      console.warn('Thunai Manglish transliteration fallback:', error);
    }

    return [...new Set(terms)];
  }

  async searchPage(keyword) {
    const requestId = ++this.searchRequestId;

    this.currentQuery = (keyword || '').trim();
    this.activeMatchIndex = 0;

    if (!this.currentQuery) {
      this.searchResults = [];
      this.clearPageHighlights();
      this.notify();
      return [];
    }

    const terms = await this.getSearchTerms(this.currentQuery, requestId);

    if (requestId !== this.searchRequestId) {
      return [];
    }

    if (!terms) {
      return [];
    }

    // Search all candidate terms in ONE content-script pass. This keeps
    // the result set tied to real DOM matches and prevents one candidate
    // from clearing the highlights produced by another candidate.
    if (typeof chrome !== 'undefined' && chrome.tabs) {
      try {
        const tabs = await chrome.tabs.query({
          active: true,
          currentWindow: true
        });

        if (tabs && tabs[0] && tabs[0].id) {
          const res = await chrome.tabs.sendMessage(tabs[0].id, {
            action: 'SEARCH_KEYWORD',
            keyword: this.currentQuery,
            keywords: terms
          });

          if (requestId !== this.searchRequestId) {
            return [];
          }

          if (res && res.success && Array.isArray(res.matches)) {
            this.searchResults = res.matches;
            this.activeMatchIndex = res.matches.length > 0 ? 0 : 0;
            this.notify();
            return this.searchResults;
          }
        }
      } catch (e) {
        console.warn('Live page keyword search:', e);
      }
    }

    const bridge = this.getContentScriptBridge();
    if (bridge && bridge.searchInPage) {
      const matches = bridge.searchInPage(
        terms,
        this.currentQuery
      );

      if (requestId !== this.searchRequestId) {
        return [];
      }

      if (Array.isArray(matches)) {
        this.searchResults = matches;
        this.activeMatchIndex = matches.length > 0 ? 0 : 0;
        this.notify();
        return this.searchResults;
      }
    }

    this.searchResults = [];
    this.activeMatchIndex = 0;
    this.notify();
    return [];
  }

  getContentScriptBridge() {
    if (typeof window === 'undefined') return null;
    try {
      if (window.parent && window.parent.ThunaiContentScript) {
        return window.parent.ThunaiContentScript;
      }
      if (window.top && window.top.ThunaiContentScript) {
        return window.top.ThunaiContentScript;
      }
    } catch (_) {}
    if (window.ThunaiContentScript) {
      return window.ThunaiContentScript;
    }
    return null;
  }

  jumpToMatch(index) {
    if (this.searchResults.length === 0) return;

    this.activeMatchIndex = Math.max(
      0,
      Math.min(this.searchResults.length - 1, index)
    );
    this.notify();

    if (typeof chrome !== 'undefined' && chrome.tabs) {
      chrome.tabs.query(
        { active: true, currentWindow: true },
        (tabs) => {
          if (tabs && tabs[0] && tabs[0].id) {
            chrome.tabs.sendMessage(
              tabs[0].id,
              {
                action: 'JUMP_TO_KEYWORD_MATCH',
                matchIndex: this.activeMatchIndex
              },
              () => {
                if (chrome.runtime.lastError) return;
              }
            );
          }
        }
      );
    } else {
      const bridge = this.getContentScriptBridge();
      if (bridge && bridge.scrollToKeywordMatch) {
        bridge.scrollToKeywordMatch(this.activeMatchIndex, false);
      }
    }
  }

  pointToMatch(index) {
    if (this.searchResults.length === 0) return;

    this.activeMatchIndex = Math.max(
      0,
      Math.min(this.searchResults.length - 1, index)
    );
    this.notify();

    if (typeof chrome !== 'undefined' && chrome.tabs) {
      chrome.tabs.query(
        { active: true, currentWindow: true },
        (tabs) => {
          if (tabs && tabs[0] && tabs[0].id) {
            chrome.tabs.sendMessage(
              tabs[0].id,
              {
                action: 'POINT_TO_KEYWORD_MATCH',
                matchIndex: this.activeMatchIndex
              },
              () => {
                if (chrome.runtime.lastError) return;
              }
            );
          }
        }
      );
    } else {
      const bridge = this.getContentScriptBridge();
      if (bridge && bridge.scrollToKeywordMatch) {
        bridge.scrollToKeywordMatch(this.activeMatchIndex, true);
      }
    }
  }

  clearPageHighlights() {
    if (typeof chrome !== 'undefined' && chrome.tabs) {
      chrome.tabs.query(
        { active: true, currentWindow: true },
        (tabs) => {
          if (tabs && tabs[0] && tabs[0].id) {
            chrome.tabs.sendMessage(
              tabs[0].id,
              { action: 'CLEAR_SEARCH_HIGHLIGHTS' },
              () => {
                if (chrome.runtime.lastError) return;
              }
            );
          }
        }
      );
    } else {
      const bridge = this.getContentScriptBridge();
      if (bridge && bridge.clearSearchHighlights) {
        bridge.clearSearchHighlights();
      }
    }
  }

  clear() {
    this.currentQuery = '';
    this.searchResults = [];
    this.activeMatchIndex = 0;
    this.clearPageHighlights();
    this.notify();
    return [];
  }
}

export const searchService = new SearchService();
