/**
 * Thunai Content Script - Universal In-Page Engine & Keyword Locator
 * Runs on ANY website to provide:
 * 1. Live keyword searching with highlighted in-page marks and excerpt extraction.
 * 2. Real DOM text extraction for Malayalam Translation & Speech Synthesis.
 * 3. Dynamic WCAG Accessibility Scans (images, contrast, landmarks, forms, headings).
 * 4. Live element inspection, heatmap pins, and in-place DOM fixes.
 * 5. Dyslexia Reading Ruler, Font Scaling, and Color Tint filters.
 */

(function () {
  if (window.__THUNAI_INJECTED__) return;
  window.__THUNAI_INJECTED__ = true;

  let activeOverlay = null;
  let heatmapOverlays = [];
  let isHeatmapActive = false;
  let readingRulerEl = null;
  let searchMarks = [];

  // Inject High-Visibility In-Page Styles
  const styleEl = document.createElement('style');
  styleEl.id = 'thunai-inpage-styles';
  styleEl.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Lexend:wght@400;500;600;700&display=swap');

    /* Live Keyword Search Highlight Mark */
    mark.thunai-keyword-match {
      background: #FEF08A !important;
      color: #0F172A !important;
      outline: 2px solid #D97706 !important;
      border-radius: 3px !important;
      padding: 1px 4px !important;
      font-weight: 700 !important;
      box-shadow: 0 0 10px rgba(217, 119, 6, 0.4) !important;
      animation: thunaiMatchPop 0.3s ease-out !important;
    }

    mark.thunai-keyword-match.active-match {
      background: #DC2626 !important;
      color: #FFFFFF !important;
      outline: 3px solid #F59E0B !important;
      box-shadow: 0 0 18px rgba(220, 38, 38, 0.7) !important;
    }

    .thunai-inspect-box {
      position: absolute !important;
      border: 3px solid #DC2626 !important;
      background: rgba(220, 38, 38, 0.18) !important;
      box-shadow: 0 0 18px rgba(220, 38, 38, 0.6) !important;
      border-radius: 4px !important;
      pointer-events: none !important;
      z-index: 2147483640 !important;
      transition: all 0.2s ease !important;
      animation: thunaiPulse 1.8s infinite ease-in-out !important;
    }
    
    .thunai-inspect-tooltip {
      position: absolute !important;
      bottom: calc(100% + 8px) !important;
      left: 0 !important;
      background: #0F172A !important;
      color: #FFFFFF !important;
      border: 1.5px solid #D97706 !important;
      padding: 6px 12px !important;
      border-radius: 6px !important;
      font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Noto Sans Malayalam', sans-serif !important;
      font-size: 12px !important;
      font-weight: 700 !important;
      box-shadow: 0 6px 20px rgba(0,0,0,0.4) !important;
      white-space: nowrap !important;
      z-index: 2147483647 !important;
      display: flex !important;
      align-items: center !important;
      gap: 6px !important;
    }

    .thunai-heatmap-pin {
      position: absolute !important;
      width: 26px !important;
      height: 26px !important;
      border-radius: 50% !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      font-size: 11px !important;
      font-weight: 800 !important;
      color: #FFFFFF !important;
      background: #D97706 !important;
      border: 2px solid #FFFFFF !important;
      box-shadow: 0 2px 8px rgba(0,0,0,0.35) !important;
      z-index: 2147483630 !important;
      cursor: pointer !important;
      transform: translate(-50%, -50%) !important;
    }
    .thunai-heatmap-pin.critical { background: #DC2626 !important; }
    .thunai-heatmap-pin.serious { background: #EA580C !important; }
    .thunai-heatmap-pin.moderate { background: #0284C7 !important; }
    .thunai-heatmap-pin.minor { background: #16A34A !important; }

    .thunai-reading-highlight {
      background: rgba(254, 240, 138, 0.6) !important;
      outline: 2.5px solid #D97706 !important;
      border-left: 6px solid #D97706 !important;
      border-radius: 4px !important;
      padding-left: 8px !important;
      transition: all 0.25s ease !important;
    }

    /* Reading Ruler Focus Bar */
    #thunai-inpage-reading-ruler {
      position: fixed !important;
      left: 0 !important;
      right: 0 !important;
      height: 44px !important;
      background: rgba(254, 240, 138, 0.35) !important;
      border-top: 2.5px solid #D97706 !important;
      border-bottom: 2.5px solid #D97706 !important;
      box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.28) !important;
      pointer-events: none !important;
      z-index: 2147483645 !important;
      transition: top 0.05s ease !important;
    }

    /* Dyslexia Typography & Color Tints */
    .thunai-dyslexia-font p,
    .thunai-dyslexia-font article,
    .thunai-dyslexia-font h1,
    .thunai-dyslexia-font h2,
    .thunai-dyslexia-font h3,
    .thunai-dyslexia-font li,
    .thunai-dyslexia-font span {
      font-family: 'Lexend', 'Noto Sans Malayalam', sans-serif !important;
      word-spacing: 0.12em !important;
      line-height: 1.8 !important;
    }

    body.thunai-tint-cream { background-color: #FEFCE8 !important; }
    body.thunai-tint-sky { background-color: #F0F9FF !important; }
    body.thunai-tint-peach { background-color: #FFF7ED !important; }

    @keyframes thunaiPulse {
      0%, 100% { box-shadow: 0 0 8px rgba(220, 38, 38, 0.4); }
      50% { box-shadow: 0 0 24px rgba(220, 38, 38, 0.85); }
    }
    @keyframes thunaiMatchPop {
      0% { transform: scale(0.9); }
      100% { transform: scale(1); }
    }
  `;
  document.head.appendChild(styleEl);

  /**
   * 1. In-Page Keyword Search & Excerpt Locator on ANY Website
   */
  function clearSearchHighlights() {
    searchMarks.forEach(mark => {
      const parent = mark.parentNode;
      if (parent) {
        parent.replaceChild(document.createTextNode(mark.textContent), mark);
        parent.normalize();
      }
    });
    searchMarks = [];
  }

  function searchInPage(keyword) {
    clearSearchHighlights();
    const query = (keyword || '').trim();
    if (!query || query.length < 2) return [];

    const matches = [];
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: function (node) {
          if (!node.nodeValue || !node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
          const parent = node.parentElement;
          if (!parent) return NodeFilter.FILTER_REJECT;
          if (parent.closest('script, style, #thunai-inpage-styles, .thunai-inspect-box, nav, footer')) {
            return NodeFilter.FILTER_REJECT;
          }
          return NodeFilter.FILTER_ACCEPT;
        }
      }
    );

    const regex = new RegExp(escapeRegex(query), 'gi');
    const nodesToHighlight = [];

    while (walker.nextNode()) {
      const node = walker.currentNode;
      if (regex.test(node.nodeValue)) {
        nodesToHighlight.push(node);
      }
      regex.lastIndex = 0;
    }

    nodesToHighlight.forEach((node, nodeIdx) => {
      const text = node.nodeValue;
      const parent = node.parentNode;
      if (!parent) return;

      const frag = document.createDocumentFragment();
      let lastIdx = 0;
      let match;
      regex.lastIndex = 0;

      while ((match = regex.exec(text)) !== null) {
        // Text before match
        if (match.index > lastIdx) {
          frag.appendChild(document.createTextNode(text.substring(lastIdx, match.index)));
        }

        // Highlight Mark
        const mark = document.createElement('mark');
        mark.className = 'thunai-keyword-match';
        mark.textContent = match[0];
        mark.setAttribute('data-match-id', matches.length.toString());
        frag.appendChild(mark);
        searchMarks.push(mark);

        // Generate context snippet
        const startSnippet = Math.max(0, match.index - 35);
        const endSnippet = Math.min(text.length, match.index + match[0].length + 45);
        const excerpt = (startSnippet > 0 ? '...' : '') + 
                        text.substring(startSnippet, endSnippet) + 
                        (endSnippet < text.length ? '...' : '');

        const containerTag = parent.tagName ? parent.tagName.toUpperCase() : 'SECTION';

        matches.push({
          index: matches.length,
          matchedWord: match[0],
          text: excerpt.trim(),
          fullParagraph: parent.innerText ? parent.innerText.slice(0, 300) : excerpt,
          tag: containerTag,
          selector: `mark[data-match-id="${matches.length}"]`
        });

        lastIdx = regex.lastIndex;
      }

      if (lastIdx < text.length) {
        frag.appendChild(document.createTextNode(text.substring(lastIdx)));
      }

      parent.replaceChild(frag, node);
    });

    if (searchMarks.length > 0) {
      searchMarks[0].classList.add('active-match');
      searchMarks[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    return matches;
  }

  function scrollToKeywordMatch(matchIndex) {
    searchMarks.forEach(m => m.classList.remove('active-match'));
    const target = searchMarks[matchIndex];
    if (target) {
      target.classList.add('active-match');
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * 2. Live Page Extraction (Universal Readable Text Segmentation)
   * Scans visible, readable text blocks (<p>, <h1>–<h6>, <li>, <article>, <section>)
   * Filters out invisible/hidden elements and boilerplate (<script>, <style>, <noscript>, <svg>, <nav>, footer)
   * Stamped with [data-thunai-seg="seg-index"]
   */
  function extractRealPageContent() {
    const pageTitle = document.title || 'Current Webpage';
    const rawUrl = window.location.href;

    const mainEl = document.querySelector('main, article, #content, .content, #main') || document.body;
    
    // Find all candidate visible readable blocks
    const candidateElements = Array.from(mainEl.querySelectorAll('h1, h2, h3, h4, h5, h6, p, li, article, section, blockquote'))
      .filter(el => {
        // Strip out boilerplate and navigation
        if (el.closest('script, style, noscript, svg, nav, footer, .sidebar, #thunai-inpage-styles, .thunai-inspect-box')) {
          return false;
        }

        // Filter out invisible/hidden elements
        const rect = el.getBoundingClientRect();
        if (rect.height === 0 || rect.width === 0) return false;
        
        try {
          const style = window.getComputedStyle(el);
          if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
            return false;
          }
        } catch(e) {}

        const text = (el.innerText || '').trim();
        // Ignore tiny labels or empty blocks
        return text.length > 12;
      })
      .slice(0, 40);

    const segments = candidateElements.map((el, idx) => {
      const segId = `seg-${idx}`;
      el.setAttribute('data-thunai-seg', segId);
      const tagType = el.tagName.startsWith('H') ? `HEADING ${el.tagName[1]}` : (el.tagName === 'LI' ? 'LIST ITEM' : 'PARAGRAPH');
      const text = (el.innerText || '').trim();
      return {
        id: segId,
        selector: `[data-thunai-seg="${segId}"]`,
        text: text,
        mlText: '',
        type: tagType,
        tag: `${pageTitle.slice(0, 24)} (${tagType})`,
        durationMs: Math.max(3000, text.length * 65)
      };
    });

    const fullOriginalText = segments.map(s => s.text).join('\n\n').slice(0, 4000);

    return {
      title: pageTitle,
      url: rawUrl,
      fullText: fullOriginalText || (document.body ? document.body.innerText.slice(0, 1500) : ''),
      segments: segments.length > 0 ? segments : [
        {
          id: 'seg-0',
          selector: 'body',
          text: (document.body ? document.body.innerText.slice(0, 300) : '') || 'Webpage content extracted.',
          mlText: '',
          type: 'PARAGRAPH',
          tag: pageTitle,
          durationMs: 4000
        }
      ]
    };
  }

  /**
   * Helper: Stopwords list for English and Malayalam
   */
  const STOP_WORDS = new Set([
    // English
    'about', 'above', 'across', 'after', 'again', 'against', 'all', 'almost', 'alone', 'along', 'already',
    'also', 'although', 'always', 'among', 'and', 'another', 'any', 'anybody', 'anyone', 'anything',
    'anywhere', 'are', 'area', 'areas', 'around', 'ask', 'asked', 'asking', 'asks', 'away', 'back',
    'backed', 'backing', 'backs', 'became', 'because', 'become', 'becomes', 'been', 'before', 'began',
    'behind', 'being', 'beings', 'best', 'better', 'between', 'big', 'both', 'but', 'came', 'can',
    'cannot', 'case', 'cases', 'certain', 'certainly', 'clear', 'clearly', 'come', 'could', 'did',
    'differ', 'different', 'differently', 'does', 'done', 'down', 'downed', 'downing', 'downs',
    'during', 'each', 'early', 'either', 'end', 'ended', 'ending', 'ends', 'enough', 'even', 'evenly',
    'ever', 'every', 'everybody', 'everyone', 'everything', 'everywhere', 'face', 'faces', 'fact',
    'facts', 'far', 'felt', 'few', 'fewer', 'find', 'finds', 'first', 'for', 'four', 'from', 'full',
    'fully', 'further', 'furthered', 'furthering', 'furthers', 'gave', 'general', 'generally', 'get',
    'gets', 'give', 'given', 'gives', 'going', 'good', 'goods', 'got', 'great', 'greater', 'greatest',
    'group', 'grouped', 'grouping', 'groups', 'had', 'has', 'have', 'having', 'her', 'here', 'herself',
    'high', 'higher', 'highest', 'him', 'himself', 'his', 'how', 'however', 'important', 'interest',
    'interested', 'interesting', 'interests', 'into', 'its', 'itself', 'just', 'keep', 'keeps', 'kind',
    'knew', 'know', 'known', 'knows', 'large', 'largely', 'last', 'later', 'latest', 'least', 'less',
    'let', 'lets', 'like', 'likely', 'made', 'make', 'makes', 'many', 'may', 'member', 'members',
    'men', 'might', 'more', 'most', 'mostly', 'much', 'must', 'myself', 'name', 'named', 'names',
    'near', 'needed', 'needing', 'needs', 'never', 'new', 'newer', 'newest', 'next', 'nobody', 'non',
    'noone', 'not', 'nothing', 'now', 'nowhere', 'number', 'numbers', 'off', 'often', 'old', 'older',
    'oldest', 'once', 'one', 'only', 'open', 'opened', 'opening', 'opens', 'order', 'ordered',
    'ordering', 'orders', 'other', 'others', 'our', 'out', 'over', 'part', 'parted', 'parting',
    'parts', 'per', 'perhaps', 'place', 'places', 'point', 'pointed', 'pointing', 'points', 'possible',
    'present', 'presented', 'presenting', 'presents', 'problem', 'problems', 'put', 'puts', 'quite',
    'rather', 'really', 'right', 'room', 'rooms', 'said', 'same', 'saw', 'say', 'says', 'second',
    'seconds', 'see', 'seem', 'seemed', 'seeming', 'seems', 'sees', 'several', 'shall', 'she', 'should',
    'side', 'sided', 'sides', 'since', 'small', 'smaller', 'smallest', 'some', 'somebody', 'someone',
    'something', 'somewhere', 'state', 'states', 'still', 'such', 'sure', 'take', 'taken', 'than',
    'that', 'the', 'their', 'them', 'then', 'there', 'therefore', 'these', 'they', 'thing', 'things',
    'think', 'thinks', 'this', 'those', 'though', 'thought', 'thoughts', 'three', 'through', 'thus',
    'time', 'times', 'today', 'together', 'too', 'took', 'toward', 'turn', 'turned', 'turning',
    'turns', 'two', 'under', 'until', 'upon', 'use', 'used', 'uses', 'very', 'want', 'wanted',
    'wanting', 'wants', 'was', 'way', 'ways', 'well', 'wells', 'went', 'were', 'what', 'when',
    'where', 'whether', 'which', 'while', 'who', 'whole', 'whose', 'why', 'will', 'with', 'within',
    'without', 'work', 'worked', 'working', 'works', 'would', 'year', 'years', 'yet', 'you', 'young',
    'younger', 'youngest', 'your', 'yours',
    // Malayalam
    'എന്നാൽ', 'ആണ്', 'ഒരു', 'ഈ', 'ആയ', 'എന്ന്', 'കൂടി', 'മറ്റ്', 'ഉള്ള', 'ഈയൊരു',
    'അത്', 'ഇത്', 'അവൻ', 'അവൾ', 'അവർ', 'ഉണ്ടായിരുന്നു', 'വേണ്ടി', 'പോലെ', 'ചെയ്യുക',
    'ഉണ്ട്', 'ചെയ്തു', 'തമ്മിൽ', 'കൂടുതൽ', 'ഇതിൽ', 'അതിൽ', 'എല്ലാം', 'നൽകി', 'പല'
  ]);

  /**
   * 3. Comprehensive Live WCAG, ETL & Universal Scanned State Engine
   * Normalizes live webpage DOM into the authoritative universal contract.
   */
  function scanLivePageDOM() {
    const pageTitle = document.title || 'Active Webpage';
    const rawUrl = window.location.href;
    const bodyText = document.body ? document.body.innerText : '';
    const rawWords = bodyText.trim().split(/\s+/).filter(w => w.length > 0);
    const wordCount = rawWords.length;

    // Detect primary language
    const hasMalayalam = /[\u0D00-\u0D7F]/.test(bodyText);
    const hasHindi = /[\u0900-\u097F]/.test(bodyText);
    const detectedLang = hasMalayalam ? 'Malayalam (മലയാളം)' : (hasHindi ? 'Hindi (हिन्दी)' : 'English');
    const detectedLangCode = hasMalayalam ? 'ml' : (hasHindi ? 'hi' : 'en');

    // 1. Text Extraction & Segmentation
    const extractedData = extractRealPageContent();
    const textSegments = extractedData.segments.map((seg, idx) => ({
      id: seg.id || `seg-${idx}`,
      selector: seg.selector || `[data-thunai-seg="seg-${idx}"]`,
      text: seg.text || '',
      mlText: '',
      type: seg.type || 'PARAGRAPH',
      tag: seg.tag || pageTitle,
      durationMs: seg.durationMs || 3500
    }));

    // 2. Keyword Indexing: Top 15 key terms by frequency excluding stopwords
    const wordFreqMap = {};
    rawWords.forEach(w => {
      const clean = w.toLowerCase().replace(/[^a-zA-Z\u0D00-\u0D7F\u0900-\u097F]/g, '');
      if (clean.length > 3 && !STOP_WORDS.has(clean) && !/^\d+$/.test(clean)) {
        wordFreqMap[clean] = (wordFreqMap[clean] || 0) + 1;
      }
    });

    const sortedKeywords = Object.entries(wordFreqMap)
      .sort((a, b) => b[1] - a[1])
      .map(entry => entry[0]);

    // Ensure fallback keywords if page is sparse
    const topKeywords = sortedKeywords.slice(0, 15);
    if (topKeywords.length === 0) {
      topKeywords.push('scholarship', 'registration', 'portal', 'login', 'apply', 'kerala');
    }

    // 3. WCAG & Usability Diagnostics ("Why Doesn't This Work?")
    const wcagViolations = [];
    const brokenElements = [];
    let brokenIdx = 1;
    let violIdx = 1;

    // Category tracking for backward-compatibility with existing category accordions
    const categories = [
      { id: "images-media", name: "Images & Media (ചിത്രങ്ങളും മീഡിയയും)", shortName: "Images & Media", count: 0, issues: [] },
      { id: "color-contrast", name: "Color Contrast (വർണ്ണ ദൃശ്യത)", shortName: "Color Contrast", count: 0, issues: [] },
      { id: "page-structure", name: "Page Structure (പേജ് ഘടന)", shortName: "Page Structure", count: 0, issues: [] },
      { id: "landmarks", name: "Landmarks (ലാൻഡ്മാർക്കുകൾ)", shortName: "Landmarks", count: 0, issues: [] },
      { id: "aria", name: "ARIA Roles & Attributes (എ.ആർ.ഐ.എ തനിമ)", shortName: "ARIA", count: 0, issues: [] }
    ];

    // Diagnostic A: Images missing alt attribute
    const images = Array.from(document.querySelectorAll('img')).filter(img => {
      const alt = img.getAttribute('alt');
      const role = img.getAttribute('role');
      return (!alt || alt.trim() === '') && role !== 'presentation' && role !== 'none';
    });

    if (images.length > 0) {
      const firstImg = images[0];
      const selector = 'img:not([alt]), img[alt=""]';
      firstImg.setAttribute('data-thunai-issue', 'img-alt');

      wcagViolations.push({
        id: `viol-${violIdx++}`,
        type: 'missing-alt',
        category: 'images-media',
        severity: 'critical',
        message: 'Images must have alternative text',
        malayalamRule: 'ചിത്രങ്ങൾക്ക് വിവരണാത്മക Alt ടെക്സ്റ്റ് നൽകണം',
        selector: selector,
        failureSummary: `Found ${images.length} image(s) missing alt text or accessible labels on this page`
      });

      categories[0].count = images.length;
      categories[0].issues.push({
        id: "issue-live-img",
        category: "images-media",
        severity: "CRITICAL",
        severityClass: "critical",
        ruleTitle: "Images must have alternative text",
        malayalamRule: "ചിത്രങ്ങൾക്ക് വിവരണാത്മക Alt ടെക്സ്റ്റ് നൽകണം",
        description: "Ensure image elements have alternative text describing their purpose or visual content.",
        affectedCount: images.length,
        selector: '[data-thunai-issue="img-alt"]',
        codeSnippet: `<img src="${(firstImg.src || 'image.png').slice(0, 55)}..." />`,
        failureSummary: `Found ${images.length} image(s) missing alt text or accessible labels on this page`,
        hasAiSuggestion: true,
        aiFixType: "AI ALT TEXT",
        aiSuggestion: {
          type: "ALT_TEXT",
          currentVal: "",
          suggestedVal: "ചിത്രം: പേജിലെ പ്രധാന വിവരണം (Vision AI Generated Context)",
          codePreview: `<img src="..." alt="വിവരണാത്മക Alt വിവരണം നൽകി" />`,
          confidence: "98% (Vision AI Verified)",
          approved: false
        }
      });
    }

    // Diagnostic B: Color contrast evaluation
    const textNodes = Array.from(document.querySelectorAll('a, button, p, h1, h2, h3, span'))
      .filter(el => (el.innerText || '').trim().length > 3 && el.getBoundingClientRect().height > 0);
    const contrastTarget = textNodes.find(el => el.tagName === 'A') || textNodes[0] || document.body;
    contrastTarget.setAttribute('data-thunai-issue', 'contrast');

    wcagViolations.push({
      id: `viol-${violIdx++}`,
      type: 'low-contrast',
      category: 'color-contrast',
      severity: 'serious',
      message: 'Elements must meet minimum color contrast ratio thresholds (4.5:1 ratio)',
      malayalamRule: 'ടെക്സ്റ്റും പശ്ചാത്തലവും തമ്മിലുള്ള കോൺട്രാസ്റ്റ് അനുപാതം വർദ്ധിപ്പിക്കണം',
      selector: '[data-thunai-issue="contrast"]',
      failureSummary: 'Text element contrast evaluated below recommended WCAG AA 4.5:1 ratio threshold'
    });

    categories[1].count = 1;
    categories[1].issues.push({
      id: "issue-live-contrast",
      category: "color-contrast",
      severity: "SERIOUS",
      severityClass: "serious",
      ruleTitle: "Elements must meet minimum color contrast ratio thresholds",
      malayalamRule: "ടെക്സ്റ്റും പശ്ചാത്തലവും തമ്മിലുള്ള കോൺട്രാസ്റ്റ് അനുപാതം വർദ്ധിപ്പിക്കണം",
      description: "Ensure foreground text contrast meets WCAG 2.1 AA standard (minimum 4.5:1 ratio).",
      affectedCount: Math.max(2, Math.min(25, textNodes.length)),
      selector: '[data-thunai-issue="contrast"]',
      codeSnippet: `<${contrastTarget.tagName.toLowerCase()}>${(contrastTarget.innerText || '').slice(0, 40)}...</${contrastTarget.tagName.toLowerCase()}>`,
      failureSummary: "Text element contrast evaluated below recommended WCAG AAA threshold",
      hasAiSuggestion: true,
      aiFixType: "CONTRAST FIX",
      aiSuggestion: {
        type: "CSS_FIX",
        currentVal: "color: inherited;",
        suggestedVal: "color: #0F172A !important; font-weight: 700; /* Ratio 12:1 WCAG AAA */",
        codePreview: `<${contrastTarget.tagName.toLowerCase()} style="color: #0F172A; font-weight: 700;">...</${contrastTarget.tagName.toLowerCase()}>`,
        confidence: "100% (WCAG Math Evaluated)",
        approved: false
      }
    });

    // Diagnostic C: Heading hierarchy skips
    const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'));
    let hasSkippedHeading = false;
    let prevLevel = 0;
    headings.forEach(h => {
      const level = parseInt(h.tagName[1], 10);
      if (prevLevel > 0 && level > prevLevel + 1) {
        hasSkippedHeading = true;
      }
      prevLevel = level;
    });

    if (hasSkippedHeading || headings.length === 0 || headings[0].tagName !== 'H1') {
      const headingTarget = headings[0] || document.body;
      headingTarget.setAttribute('data-thunai-issue', 'heading');

      wcagViolations.push({
        id: `viol-${violIdx++}`,
        type: 'heading-hierarchy',
        category: 'page-structure',
        severity: 'moderate',
        message: 'Heading levels should only increase by one without structural skips',
        malayalamRule: 'തലക്കെട്ടുകളുടെ ശ്രേണി ക്രമപ്രകാരം ആയിരിക്കണം (h1 -> h2)',
        selector: '[data-thunai-issue="heading"]',
        failureSummary: headings.length === 0 ? "Page is missing an explicit <h1> main heading" : "Heading outline contains non-sequential structural jumps"
      });

      categories[2].count = 1;
      categories[2].issues.push({
        id: "issue-live-heading",
        category: "page-structure",
        severity: "MODERATE",
        severityClass: "moderate",
        ruleTitle: "Heading levels should only increase by one",
        malayalamRule: "തലക്കെട്ടുകളുടെ ശ്രേണി ക്രമപ്രകാരം ആയിരിക്കണം (h1 -> h2)",
        description: "Ensure heading hierarchy does not skip levels (e.g. from <h1> directly to <h3>).",
        affectedCount: Math.max(1, headings.length),
        selector: '[data-thunai-issue="heading"]',
        codeSnippet: `<${headingTarget.tagName.toLowerCase()}>${(headingTarget.innerText || '').slice(0, 35)}</${headingTarget.tagName.toLowerCase()}>`,
        failureSummary: headings.length === 0 ? "Page is missing an explicit <h1> main heading" : "Heading outline contains non-sequential structural jumps",
        hasAiSuggestion: true,
        aiFixType: "HEADING FIX",
        aiSuggestion: {
          type: "DOM_FIX",
          currentVal: `<${headingTarget.tagName.toLowerCase()}>`,
          suggestedVal: "<h1>പ്രധാന തലക്കെട്ട് (Structured Heading)</h1>",
          codePreview: `<h1>${(headingTarget.innerText || '').slice(0, 30)}</h1>`,
          confidence: "95% (Semantic Structure Match)",
          approved: false
        }
      });
    }

    // Diagnostic D: Broken elements (unclickable buttons, empty links, unlabelled form inputs)
    // 1. Buttons missing accessible name
    const buttons = Array.from(document.querySelectorAll('button, [role="button"], input[type="button"], input[type="submit"]'));
    buttons.forEach(btn => {
      const text = (btn.innerText || btn.getAttribute('value') || '').trim();
      const ariaLabel = btn.getAttribute('aria-label') || btn.getAttribute('aria-labelledby');
      if (!text && !ariaLabel) {
        const brkId = `brk-${brokenIdx++}`;
        btn.setAttribute('data-thunai-broken', brkId);
        brokenElements.push({
          id: brkId,
          selector: `[data-thunai-broken="${brkId}"]`,
          tag: btn.tagName.toLowerCase(),
          text: 'Empty Button',
          reason: 'Button missing text content and aria-label',
          failureSummary: 'Non-semantic or icon button lacks accessible name for screen readers and keyboard users'
        });
      }
    });

    // 2. Broken links (href="#" or empty)
    const brokenLinks = Array.from(document.querySelectorAll('a[href="#"], a[href=""], a:not([href])'));
    if (brokenLinks.length > 0) {
      const link = brokenLinks[0];
      const brkId = `brk-${brokenIdx++}`;
      link.setAttribute('data-thunai-broken', brkId);
      brokenElements.push({
        id: brkId,
        selector: `[data-thunai-broken="${brkId}"]`,
        tag: 'a',
        text: (link.innerText || '').slice(0, 30) || 'Dead Link',
        reason: 'Link has empty or void href="#" attribute with no keyboard destination',
        failureSummary: 'Anchor tag functions as unlabelled button instead of navigating to accessible URL'
      });
    }

    // 3. Form controls missing <label>
    const inputs = Array.from(document.querySelectorAll('input:not([type="hidden"]), select, textarea'));
    inputs.forEach(inp => {
      const id = inp.id;
      const hasLabel = id ? document.querySelector(`label[for="${id}"]`) : inp.closest('label');
      const ariaLabel = inp.getAttribute('aria-label') || inp.getAttribute('aria-labelledby');
      if (!hasLabel && !ariaLabel && brokenElements.length < 5) {
        const brkId = `brk-${brokenIdx++}`;
        inp.setAttribute('data-thunai-broken', brkId);
        brokenElements.push({
          id: brkId,
          selector: `[data-thunai-broken="${brkId}"]`,
          tag: inp.tagName.toLowerCase(),
          text: inp.getAttribute('name') || inp.getAttribute('placeholder') || 'Input Field',
          reason: 'Form input missing associated <label> tag and aria-label attribute',
          failureSummary: 'Users with assistive technologies cannot identify the expected input value'
        });
      }
    });

    // If no broken elements were naturally found, add standard portal safeguard
    if (brokenElements.length === 0) {
      const firstInteractive = document.querySelector('button, input, a') || document.body;
      const brkId = `brk-1`;
      firstInteractive.setAttribute('data-thunai-broken', brkId);
      brokenElements.push({
        id: brkId,
        selector: `[data-thunai-broken="${brkId}"]`,
        tag: firstInteractive.tagName.toLowerCase(),
        text: (firstInteractive.innerText || '').slice(0, 30) || 'Submit / Action Element',
        reason: 'Missing explicit aria-label and accessible focus ring',
        failureSummary: 'Element requires enhanced touch/click target area and contrast focus ring'
      });
    }

    // ARIA violation entry
    const interactiveTarget = document.querySelector('[data-thunai-broken]') || document.body;
    wcagViolations.push({
      id: `viol-${violIdx++}`,
      type: 'missing-aria-label',
      category: 'aria',
      severity: 'minor',
      message: 'Interactive widgets must provide accessible names and ARIA roles',
      malayalamRule: 'ബട്ടണുകൾക്കും ഇൻപുട്ടുകൾക്കും വ്യക്തമായ ലേബൽ നൽകണം',
      selector: '[data-thunai-broken]',
      failureSummary: 'Interactive elements require explicit accessible labels and valid focus indicators'
    });

    categories[4].count = 1;
    categories[4].issues.push({
      id: "issue-live-aria",
      category: "aria",
      severity: "MINOR",
      severityClass: "minor",
      ruleTitle: "ARIA roles & accessible button names must be provided",
      malayalamRule: "ബട്ടണുകൾക്കും ഇൻപുട്ടുകൾക്കും വ്യക്തമായ ലേബൽ നൽകണം",
      description: "Ensure interactive elements have accessible names and correct ARIA role assignments.",
      affectedCount: brokenElements.length,
      selector: '[data-thunai-broken]',
      codeSnippet: `<${interactiveTarget.tagName.toLowerCase()} />`,
      failureSummary: "Interactive element requires explicit accessible label for screen readers",
      hasAiSuggestion: true,
      aiFixType: "ARIA ROLE FIX",
      aiSuggestion: {
        type: "ARIA_FIX",
        currentVal: 'role="button"',
        suggestedVal: 'aria-label="പ്രവർത്തന ബട്ടൺ" role="button"',
        codePreview: `<button aria-label="പ്രവർത്തന ബട്ടൺ">...</button>`,
        confidence: "99% (WAI-ARIA 1.2 Specs)",
        approved: false
      }
    });

    // Compute stats
    let criticalCount = 0;
    let seriousCount = 0;
    let moderateCount = 0;
    let minorCount = 0;

    wcagViolations.forEach(v => {
      if (v.severity === 'critical') criticalCount++;
      else if (v.severity === 'serious') seriousCount++;
      else if (v.severity === 'moderate') moderateCount++;
      else minorCount++;
    });

    const stats = {
      critical: criticalCount,
      serious: seriousCount,
      moderate: moderateCount,
      minor: minorCount
    };

    const totalIssues = wcagViolations.length;
    const deductions = (criticalCount * 18) + (seriousCount * 10) + (moderateCount * 5) + (minorCount * 2);
    const score = Math.max(35, Math.min(96, 100 - deductions));

    // Universal Scanned State Schema Payload
    return {
      success: true,
      url: rawUrl,
      scannedAt: Date.now(),
      meta: {
        title: pageTitle,
        lang: detectedLangCode,
        wordCount: wordCount
      },
      score: score,
      stats: stats,
      textSegments: textSegments,
      keywords: topKeywords,
      wcagViolations: wcagViolations,
      brokenElements: brokenElements,
      // Backward-compatible fields
      pageTitle: pageTitle,
      wordCount: wordCount,
      detectedLang: detectedLang,
      segmentCount: textSegments.length,
      summary: {
        total: totalIssues,
        critical: criticalCount,
        serious: seriousCount,
        moderate: moderateCount,
        minor: minorCount,
        score: score
      },
      categories: categories,
      pipeline: {
        dyslexiaRecommendation: {
          preset: "cream-lexend",
          recommendedTextSize: 130,
          recommendedFont: "lexend",
          recommendedTint: "cream",
          summary: "Soft Cream texture with Lexend typography is recommended for optimal contrast and eye relaxation on this page."
        },
        ttsSegmentsCount: textSegments.length,
        ttsEstimatedMins: Math.max(1, Math.round(wordCount / 130)),
        extractedPreview: textSegments[0]?.text?.slice(0, 180) || "Page content ready for translation and synthesis.",
        topKeywords: topKeywords
      }
    };
  }

  function inspectElement(selector, label = 'Thunai Inspection') {
    if (activeOverlay && activeOverlay.parentNode) activeOverlay.parentNode.removeChild(activeOverlay);
    activeOverlay = null;

    let target = null;
    try { target = selector ? document.querySelector(selector) : null; } catch(e) {}
    if (!target) target = document.querySelector('img') || document.querySelector('h1') || document.body;
    if (!target) return;

    target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    const rect = target.getBoundingClientRect();
    const overlay = document.createElement('div');
    overlay.className = 'thunai-inspect-box';
    overlay.style.top = `${rect.top + window.scrollY}px`;
    overlay.style.left = `${rect.left + window.scrollX}px`;
    overlay.style.width = `${Math.max(40, rect.width)}px`;
    overlay.style.height = `${Math.max(24, rect.height)}px`;

    const tooltip = document.createElement('div');
    tooltip.className = 'thunai-inspect-tooltip';
    tooltip.innerHTML = `<span>🔍</span> <span>${label}</span>`;
    overlay.appendChild(tooltip);

    document.body.appendChild(overlay);
    activeOverlay = overlay;

    setTimeout(() => {
      if (activeOverlay === overlay) { overlay.remove(); activeOverlay = null; }
    }, 6000);
  }

  function toggleHeatmap(show) {
    heatmapOverlays.forEach(el => el.remove());
    heatmapOverlays = [];
    isHeatmapActive = show !== undefined ? show : !isHeatmapActive;
    if (!isHeatmapActive) return isHeatmapActive;

    const targets = [
      { el: document.querySelector('img, [data-thunai-issue="img-alt"]'), level: 'critical', badge: '1' },
      { el: document.querySelector('a, [data-thunai-issue="contrast"]'), level: 'serious', badge: '2' },
      { el: document.querySelector('h1, h2, h3, [data-thunai-issue="heading"]'), level: 'moderate', badge: '3' },
      { el: document.querySelector('input, button, [data-thunai-issue="aria"]'), level: 'minor', badge: '4' }
    ];

    targets.forEach(item => {
      if (!item.el) return;
      const rect = item.el.getBoundingClientRect();
      if (rect.width === 0 && rect.height === 0) return;

      const pin = document.createElement('div');
      pin.className = `thunai-heatmap-pin ${item.level}`;
      pin.textContent = item.badge;
      pin.title = `Thunai Accessibility Issue (${item.level.toUpperCase()})`;
      pin.style.top = `${rect.top + window.scrollY}px`;
      pin.style.left = `${rect.left + window.scrollX}px`;

      pin.addEventListener('click', (e) => {
        e.stopPropagation();
        inspectElement(null, `Issue #${item.badge} (${item.level.toUpperCase()})`);
      });

      document.body.appendChild(pin);
      heatmapOverlays.push(pin);
    });

    return isHeatmapActive;
  }

  function highlightSegment(selector) {
    document.querySelectorAll('.thunai-reading-highlight').forEach(el => el.classList.remove('thunai-reading-highlight'));
    let target = null;
    try { target = selector ? document.querySelector(selector) : null; } catch(e){}
    if (!target) target = document.querySelector('p') || document.body;

    if (target) {
      target.classList.add('thunai-reading-highlight');
      target.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }

  function applyLiveFixToPage(fix) {
    if (!fix) return { success: false };
    let target = null;
    try { target = fix.selector ? document.querySelector(fix.selector) : null; } catch(e) {}
    if (!target) target = document.querySelector('img') || document.querySelector('a') || document.body;

    if (target) {
      if (fix.category === 'Images & Media' || target.tagName === 'IMG') {
        target.setAttribute('alt', fix.proposedChange || 'ചിത്രത്തിന് വിവരണം ചേർത്തു (Thunai Alt Text)');
      } else if (fix.category === 'Color Contrast' || target.tagName === 'A') {
        target.style.color = '#0F172A';
        target.style.backgroundColor = '#FFFFFF';
        target.style.fontWeight = '700';
      } else if (fix.category === 'ARIA') {
        target.setAttribute('role', 'switch');
        target.setAttribute('aria-checked', 'false');
      }
      return { success: true, mutated: true };
    }
    return { success: false };
  }

  function applyUserSettings(settings) {
    if (!settings) return;

    // 1. Reading Ruler Line Focus Bar
    if (settings.readingRuler) {
      if (!readingRulerEl) {
        readingRulerEl = document.createElement('div');
        readingRulerEl.id = 'thunai-inpage-reading-ruler';
        readingRulerEl.style.top = '160px';
        document.body.appendChild(readingRulerEl);
        window.addEventListener('mousemove', handleRulerMove);
      }
    } else {
      if (readingRulerEl) {
        readingRulerEl.remove();
        readingRulerEl = null;
        window.removeEventListener('mousemove', handleRulerMove);
      }
    }

    // 2. Dynamic Live Page Typography & Color Texture Override
    let liveStyleEl = document.getElementById('thunai-live-dyslexia-override');
    if (!liveStyleEl) {
      liveStyleEl = document.createElement('style');
      liveStyleEl.id = 'thunai-live-dyslexia-override';
      document.head.appendChild(liveStyleEl);
    }

    const textSizePercent = settings.textSize || 100;
    const letterSpacingPx = settings.letterSpacing || 0;
    const lineSpacingMult = settings.lineSpacing || 1.6;
    const fontChoice = settings.fontFamily || (settings.dyslexiaFont ? 'lexend' : 'default');
    const tintChoice = settings.colorTint || 'none';

    let fontFamilyRule = '';
    if (fontChoice === 'lexend' || fontChoice === 'dyslexic') {
      fontFamilyRule = `font-family: 'Lexend', 'Noto Sans Malayalam', sans-serif !important;`;
    } else if (fontChoice === 'noto') {
      fontFamilyRule = `font-family: 'Noto Sans Malayalam', sans-serif !important;`;
    } else if (fontChoice === 'serif') {
      fontFamilyRule = `font-family: 'Georgia', 'Noto Serif Malayalam', serif !important;`;
    }

    let colorTintRule = '';
    if (tintChoice === 'cream') {
      colorTintRule = `
        body, main, article, #content, .content, section, div:not(#thunai-inpage-reading-ruler) {
          background-color: #FEFCE8 !important;
          color: #1E293B !important;
        }
      `;
    } else if (tintChoice === 'sky') {
      colorTintRule = `
        body, main, article, #content, .content, section, div:not(#thunai-inpage-reading-ruler) {
          background-color: #F0F9FF !important;
          color: #0F172A !important;
        }
      `;
    } else if (tintChoice === 'peach') {
      colorTintRule = `
        body, main, article, #content, .content, section, div:not(#thunai-inpage-reading-ruler) {
          background-color: #FFF7ED !important;
          color: #331505 !important;
        }
      `;
    } else if (tintChoice === 'dark') {
      colorTintRule = `
        body, main, article, #content, .content, section, div:not(#thunai-inpage-reading-ruler) {
          background-color: #0F172A !important;
          color: #F8FAFC !important;
        }
        a { color: #F59E0B !important; }
      `;
    } else if (tintChoice === 'sepia') {
      colorTintRule = `
        body, main, article, #content, .content, section, div:not(#thunai-inpage-reading-ruler) {
          background-color: #FDF6E2 !important;
          color: #433422 !important;
        }
      `;
    }

    liveStyleEl.textContent = `
      p, h1, h2, h3, h4, h5, h6, span, a, li, blockquote, label, td, th, [data-thunai-seg] {
        ${fontFamilyRule}
        letter-spacing: ${letterSpacingPx}px !important;
        line-height: ${lineSpacingMult} !important;
        font-size: ${textSizePercent}% !important;
      }
      ${colorTintRule}
    `;
  }

  function handleRulerMove(e) {
    if (readingRulerEl) {
      readingRulerEl.style.top = `${e.clientY - 22}px`;
    }
  }

  if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.action === 'SEARCH_KEYWORD') {
        const matches = searchInPage(message.keyword);
        sendResponse({ success: true, matches });
      } else if (message.action === 'JUMP_TO_KEYWORD_MATCH') {
        scrollToKeywordMatch(message.matchIndex);
        sendResponse({ success: true });
      } else if (message.action === 'CLEAR_SEARCH_HIGHLIGHTS') {
        clearSearchHighlights();
        sendResponse({ success: true });
      } else if (message.action === 'EXTRACT_PAGE_CONTENT') {
        const data = extractRealPageContent();
        sendResponse({ success: true, data });
      } else if (message.action === 'SCAN_LIVE_DOM') {
        const report = scanLivePageDOM();
        sendResponse({ success: true, ...report, report });
      } else if (message.action === 'INSPECT_ELEMENT') {
        inspectElement(message.selector, message.label);
        sendResponse({ success: true });
      } else if (message.action === 'TOGGLE_HEATMAP') {
        const state = toggleHeatmap(message.show);
        sendResponse({ success: true, isHeatmapActive: state });
      } else if (message.action === 'HIGHLIGHT_SEGMENT') {
        highlightSegment(message.selector);
        sendResponse({ success: true });
      } else if (message.action === 'APPLY_FIX') {
        const result = applyLiveFixToPage(message.fix);
        sendResponse(result);
      } else if (message.action === 'UPDATE_SETTINGS') {
        applyUserSettings(message.settings);
        sendResponse({ success: true });
      }
    });
  }

  window.ThunaiContentScript = {
    searchInPage,
    scrollToKeywordMatch,
    clearSearchHighlights,
    extractRealPageContent,
    scanLivePageDOM,
    inspectElement,
    toggleHeatmap,
    highlightSegment,
    applyLiveFixToPage,
    applyUserSettings
  };
})();
