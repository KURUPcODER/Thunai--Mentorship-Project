/**
 * Search View Component (Tab: 'search')
 * Allows users to search any keyword across the scanned webpage with live in-page highlighting,
 * instant location jumping, and per-section Malayalam TTS & Translation.
 */

import { searchService } from '../../services/searchService.js';
import { ttsService } from '../../services/ttsService.js';
import { getT } from '../i18n.js';

export function renderSearchView(container, state, setState, onNavigate) {
  let searchState = searchService.getState();
  const currentLang = state.currentLang || 'ml';
  const t = getT(currentLang);

  // Pull dynamic keywords from scanReport or fallback
  const scanKeywords = state.scanReport?.keywords;
  const quickKeywords = (scanKeywords && scanKeywords.length > 0)
    ? scanKeywords.slice(0, 7).map(k => ({ label: k, val: k }))
    : [
      { label: 'അപേക്ഷ (Application)', val: 'അപേക്ഷ' },
      { label: 'ഫീസ് (Fee)', val: 'fee' },
      { label: 'ലോഗിൻ (Login)', val: 'login' },
      { label: 'തീയതി (Date)', val: 'date' },
      { label: 'ഫോം (Form)', val: 'form' }
    ];

  function render() {
    searchState = searchService.getState();

    container.innerHTML = `
      <div class="view-panel search-view animate-fade-in" id="panel-search" role="tabpanel" aria-labelledby="tab-search">
        
        <!-- Header Strip -->
        <div class="search-header-box" style="display: flex; align-items: flex-start; justify-content: space-between;">
          <div>
            <h2 class="view-heading-ml">${t.searchTitle}</h2>
            <p class="view-subheading-en">${t.searchSub}</p>
          </div>
          <button class="btn-refresh-pill" id="btn-refresh-search" title="${t.refreshTooltip || 'Reset search to fresh state'}">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3">
              <path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
            </svg>
            <span>${t.refreshBtn ? t.refreshBtn.split(' ')[0] : 'റീഫ്രഷ്'}</span>
          </button>
        </div>

        <!-- Search Input Bar -->
        <div class="search-input-wrapper">
          <div class="search-icon-box" aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </div>
          <input type="text" 
                 id="input-page-keyword" 
                 class="search-text-input" 
                 placeholder="${t.searchPlaceholder}" 
                 value="${searchState.query}"
                 autocomplete="off"
                 aria-label="${t.searchPlaceholder}">
          ${searchState.query ? `
            <button class="btn-clear-search" id="btn-clear-query" title="Clear search" aria-label="Clear search">✕</button>
          ` : ''}
        </div>

        <!-- Quick Filter Suggestion Chips -->
        <div class="quick-keyword-chips-row">
          ${quickKeywords.map(k => `
            <button class="chip-keyword-tag" data-kw="${k.val}">${k.label}</button>
          `).join('')}
        </div>

        <!-- Search Results Count Banner -->
        ${searchState.query ? `
          <div class="search-summary-banner" style="display: flex; flex-direction: column; gap: 6px; background: rgba(217, 119, 6, 0.1); border: 1.5px solid #D97706; padding: 10px 14px; border-radius: 10px; margin-bottom: 12px;">
            <div style="display: flex; align-items: center; justify-content: space-between; width: 100%;">
              <span class="found-text" style="font-size: 13px; color: #1E293B; display: flex; align-items: center; gap: 6px;">
                <strong>${t.totalOccurrences || 'Total occurrences on webpage:'}</strong> 
                <span class="total-matches-count-badge" style="background: #D97706; color: #ffffff; padding: 2px 10px; border-radius: 9999px; font-weight: 800; font-size: 13px; box-shadow: 0 2px 6px rgba(217, 119, 6, 0.4);">${searchState.totalMatches}</span>
              </span>
              ${searchState.totalMatches > 1 ? `
                <div class="search-nav-controls" style="display: flex; align-items: center; gap: 6px;">
                  <button class="btn-match-nav" id="btn-prev-match" title="Previous match">▲</button>
                  <span class="match-index-tag" style="font-weight: 700; font-size: 12px; color: #334155;">${searchState.activeMatchIndex + 1} / ${searchState.totalMatches}</span>
                  <button class="btn-match-nav" id="btn-next-match" title="Next match">▼</button>
                </div>
              ` : ''}
            </div>
          </div>
        ` : ''}

        <!-- Results List -->
        <div class="search-results-list" role="list">
          ${!searchState.query ? `
            <div class="search-idle-box">
              <div class="search-idle-icon">🔍</div>
              <p class="search-idle-title">${t.searchHint}</p>
            </div>
          ` : searchState.totalMatches === 0 ? `
            <div class="search-empty-box">
              <span class="empty-icon">⚠️</span>
              <p class="empty-text">${t.noMatches}</p>
            </div>
          ` : searchState.results.map((match, idx) => {
            const isActive = idx === searchState.activeMatchIndex;

            return `
              <div class="search-match-card ${isActive ? 'is-active-match' : ''}" data-match-idx="${idx}" role="listitem">
                <div class="match-card-header">
                  <span class="match-tag-pill">${match.tag || 'PARAGRAPH'}</span>
                  <span class="match-num-pill">#${idx + 1} of ${searchState.totalMatches}</span>
                </div>

                <p class="match-excerpt-text">${highlightQueryInText(match.text, searchState.query)}</p>

                <div class="match-actions-footer" style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap; margin-top: 8px;">
                  <button class="btn-match-action point-on-page" data-point-idx="${idx}" title="Point on page to this exact word occurrence" style="background: #D97706; color: #ffffff; border: none; padding: 6px 12px; border-radius: 6px; font-weight: 700; cursor: pointer; display: inline-flex; align-items: center; gap: 4px; font-size: 11.5px; box-shadow: 0 2px 6px rgba(217, 119, 6, 0.3);">
                    <span style="font-size: 13px;">👉</span>
                    <span>${t.pointOnPageMatch || 'Point on Page'}</span>
                  </button>

                  <button class="btn-match-action locate" data-locate-idx="${idx}" title="Scroll to and highlight on webpage">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <circle cx="12" cy="12" r="10"></circle>
                      <polygon points="12 8 8 12 12 16 12 8"></polygon>
                    </svg>
                    <span>${t.inspectMatch}</span>
                  </button>

                  <button class="btn-match-action listen" data-listen-idx="${idx}" title="Listen to this section in Malayalam TTS">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                      <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                    </svg>
                    <span>${t.listenMatch}</span>
                  </button>
                </div>
              </div>
            `;
          }).join('')}
        </div>

      </div>
    `;

    attachEvents();
  }

  function highlightQueryInText(text, query) {
    if (!query) return text;
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return parts.map(p => p.toLowerCase() === query.toLowerCase() ? `<mark class="snippet-highlight">${p}</mark>` : p).join('');
  }

  function attachEvents() {
    const input = container.querySelector('#input-page-keyword');
    if (input) {
      input.addEventListener('input', async (e) => {
        await searchService.searchPage(e.target.value);
        render();
        // keep focus in input
        const reInput = container.querySelector('#input-page-keyword');
        if (reInput) {
          reInput.focus();
          reInput.setSelectionRange(reInput.value.length, reInput.value.length);
        }
      });
    }

    const clearBtn = container.querySelector('#btn-clear-query');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        searchService.searchPage('');
        render();
      });
    }

    const refreshBtn = container.querySelector('#btn-refresh-search');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => {
        searchService.clear();
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
        render();
      });
    }

    // Quick chip buttons
    container.querySelectorAll('.chip-keyword-tag').forEach(chip => {
      chip.addEventListener('click', async () => {
        const kw = chip.getAttribute('data-kw');
        await searchService.searchPage(kw);
        render();
      });
    });

    // Jump navigation
    const prevBtn = container.querySelector('#btn-prev-match');
    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        searchService.jumpToMatch(searchState.activeMatchIndex - 1);
        render();
      });
    }

    const nextBtn = container.querySelector('#btn-next-match');
    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        searchService.jumpToMatch(searchState.activeMatchIndex + 1);
        render();
      });
    }

    // Point on Page Click
    container.querySelectorAll('[data-point-idx]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const idx = parseInt(btn.getAttribute('data-point-idx'), 10);
        searchService.pointToMatch(idx);
        render();
      });
    });

    // Card Locate Click
    container.querySelectorAll('[data-locate-idx]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const idx = parseInt(btn.getAttribute('data-locate-idx'), 10);
        searchService.jumpToMatch(idx);
        render();
      });
    });

    // Card Listen Click
    container.querySelectorAll('[data-listen-idx]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const idx = parseInt(btn.getAttribute('data-listen-idx'), 10);
        const match = searchState.results[idx];
        if (match) {
          ttsService.stop();
          if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(match.fullParagraph || match.text);
            window.speechSynthesis.speak(utterance);
          }
          searchService.pointToMatch(idx);
        }
      });
    });
  }

  render();
}
