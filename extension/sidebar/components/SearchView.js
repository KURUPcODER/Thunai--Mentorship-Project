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
        <div class="search-header-box">
          <h2 class="view-heading-ml">${t.searchTitle}</h2>
          <p class="view-subheading-en">${t.searchSub}</p>
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
          <div class="search-summary-banner">
            <span class="found-text">
              <strong>${t.searchFound}</strong> ${searchState.totalMatches} ${t.matchesText}
            </span>
            ${searchState.totalMatches > 1 ? `
              <div class="search-nav-controls">
                <button class="btn-match-nav" id="btn-prev-match" title="Previous match">▲</button>
                <span class="match-index-tag">${searchState.activeMatchIndex + 1} / ${searchState.totalMatches}</span>
                <button class="btn-match-nav" id="btn-next-match" title="Next match">▼</button>
              </div>
            ` : ''}
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
                  <span class="match-num-pill">#${idx + 1}</span>
                </div>

                <p class="match-excerpt-text">${highlightQueryInText(match.text, searchState.query)}</p>

                <div class="match-actions-footer">
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
          searchService.jumpToMatch(idx);
        }
      });
    });
  }

  render();
}
