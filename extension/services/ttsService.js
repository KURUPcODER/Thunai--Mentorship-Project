/**
 * Thunai Text-To-Speech (TTS) Service
 * Manages segment queue, extracts live page paragraphs, and synchronizes highlights on ANY website.
 * English TTS: Handled client-side via browser window.speechSynthesis.
 * Malayalam TTS: Handled via Thunai Backend -> Sarvam AI (bulbul:v3).
 */

export const defaultMockSegments = [
  {
    id: 1,
    type: "HEADING 1",
    tag: "കേരളം - വിക്കിപീഡിയ",
    malayalamText: "കേരളം - വിക്കിപീഡിയ സംക്ഷിപ്ത വിവരണം",
    englishText: "Kerala - Wikipedia overview",
    selector: "h1#firstHeading, h1",
    durationMs: 3200
  },
  {
    id: 2,
    type: "PARAGRAPH",
    tag: "ഖണ്ഡിക 1",
    malayalamText: "ഇന്ത്യയുടെ തെക്കുപടിഞ്ഞാറൻ മലബാർ തീരത്ത് സ്ഥിതി ചെയ്യുന്ന ഒരു സംസ്ഥാനമാണ് കേരളം.",
    englishText: "Kerala is a state on the southwestern Malabar Coast of India.",
    selector: "p:nth-of-type(1), p",
    durationMs: 4500
  },
  {
    id: 3,
    type: "PARAGRAPH",
    tag: "ഖണ്ഡിക 2",
    malayalamText: "1956 നവംബർ 1-നാണ് സംസ്ഥാന പുനഃസംഘടനാ നിയമപ്രകാരം ഇത് രൂപീകൃതമായത്.",
    englishText: "It was formed on 1 November 1956 following the States Reorganisation Act.",
    selector: "p:nth-of-type(2), p",
    durationMs: 4200
  }
];

export const mockVoices = [
  { id: "ml-IN-female-1", name: "Malayalam Female (Sarvam AI)", lang: "ml-IN", gender: "female" },
  { id: "en-IN-female-1", name: "English Female (Browser Web Speech)", lang: "en-IN", gender: "female" }
];

const BACKEND_TTS_URL = "http://localhost:3000/api/tts";

function containsMalayalamText(text) {
  if (!text || typeof text !== 'string') return false;
  return /[\u0D00-\u0D7F]/.test(text);
}

class TTSService {
  constructor() {
    this.tabContexts = new Map();
    this.activeTabId = 'default';
    this.listeners = new Set();

    if (typeof chrome !== 'undefined' && chrome.tabs) {
      chrome.tabs.onActivated.addListener(activeInfo => {
        this.switchToTab(activeInfo.tabId);
      });
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs && tabs[0]) this.switchToTab(tabs[0].id);
      });
    }

    this.initRealPageSegments();
  }

  createDefaultContext() {
    return {
      isPlaying: false,
      isPaused: false,
      currentSegmentIndex: 0,
      totalSegments: 0,
      segments: [],
      playbackSpeed: 1.0,
      selectedVoice: mockVoices[0].id,
      currentLang: 'ml', // 'ml' or 'en'
      timer: null,
      audioElement: null,
      audioCache: new Map(), // Cache key: segment identifier -> { audioUrl, audioElement }
      pageSessionUrl: 'unknown'
    };
  }

  getActiveContext() {
    if (!this.tabContexts.has(this.activeTabId)) {
      this.tabContexts.set(this.activeTabId, this.createDefaultContext());
    }
    return this.tabContexts.get(this.activeTabId);
  }

  switchToTab(tabId) {
    if (this.activeTabId === tabId) return;

    // Forcefully pause current audio before switching context
    const currentCtx = this.tabContexts.get(this.activeTabId);
    if (currentCtx && currentCtx.isPlaying) {
      currentCtx.isPaused = true;
      currentCtx.isPlaying = false;
      if (currentCtx.audioElement) {
        try { currentCtx.audioElement.pause(); } catch(e) {}
      }
      if (currentCtx.currentLang === 'en' && typeof window !== 'undefined' && window.speechSynthesis) {
        try { window.speechSynthesis.pause(); } catch(e) {}
      }
    }

    this.activeTabId = tabId;
    this.notify();
  }

  _clearAudioCache(ctx = this.getActiveContext()) {
    ctx.audioCache.forEach(item => {
      try {
        if (item.audioElement) item.audioElement.pause();
        if (item.audioUrl) URL.revokeObjectURL(item.audioUrl);
      } catch(e) {}
    });
    ctx.audioCache.clear();
  }

  async initRealPageSegments() {
    let data = null;
    if (typeof chrome !== 'undefined' && chrome.tabs) {
      try {
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tabs && tabs[0] && tabs[0].id) {
          const res = await chrome.tabs.sendMessage(tabs[0].id, { action: 'EXTRACT_PAGE_CONTENT' });
          if (res && res.success && res.data) {
            data = res.data;
          }
        }
      } catch(e) {}
    } else if (typeof window !== 'undefined' && window.parent && window.parent.ThunaiContentScript) {
      data = window.parent.ThunaiContentScript.extractRealPageContent();
    }

    if (data && data.segments && data.segments.length > 0) {
      const ctx = this.getActiveContext();
      this._clearAudioCache(ctx);
      if (data.langCode) {
        ctx.currentLang = data.langCode;
      }
      ctx.segments = data.segments.map(s => ({
        id: s.id,
        type: s.type,
        tag: s.tag,
        malayalamText: s.mlText || (/[\u0D00-\u0D7F]/.test(s.text) ? s.text : ''),
        englishText: s.enText || (!/[\u0D00-\u0D7F]/.test(s.text) ? s.text : ''),
        text: s.text,
        selector: s.selector,
        durationMs: s.durationMs
      }));
      ctx.totalSegments = ctx.segments.length;
      ctx.currentSegmentIndex = 0;
      this.notify();
    }
  }

  loadSegments(textSegments, targetTabId = null, pageSessionUrl = 'unknown') {
    if (!textSegments || textSegments.length === 0) return;
    if (targetTabId && !this.tabContexts.has(targetTabId)) {
      this.tabContexts.set(targetTabId, this.createDefaultContext());
    }
    const ctx = targetTabId ? this.tabContexts.get(targetTabId) : this.getActiveContext();

    // Race protection check: reject late extraction if page already navigated again
    if (ctx.pageSessionUrl !== 'unknown' && pageSessionUrl !== 'unknown' && ctx.pageSessionUrl !== pageSessionUrl) {
         // Reject late delivery of old segments
         console.warn(`TTS Race Protection: Rejected segments intended for ${pageSessionUrl}. Current TTS state is already committed to ${ctx.pageSessionUrl}`);
         return;
    }

    this._clearAudioCache(ctx);
    ctx.pageSessionUrl = pageSessionUrl;

    ctx.segments = textSegments.map((s, idx) => ({
      id: s.id || idx + 1,
      type: s.type || 'PARAGRAPH',
      tag: s.tag || `ഖണ്ഡിക ${idx + 1}`,
      malayalamText: s.mlText || s.text || '',
      englishText: s.text || '',
      text: s.text || '',
      selector: s.selector || `[data-thunai-seg="${s.id || 'seg-' + idx}"]`,
      durationMs: s.durationMs || Math.max(3000, (s.text || '').length * 65)
    }));
    ctx.totalSegments = ctx.segments.length;
    ctx.currentSegmentIndex = 0;
    
    if (!targetTabId || targetTabId === this.activeTabId) {
      this.notify();
    }
  }

  setLanguage(lang) {
    const ctx = this.getActiveContext();
    if (lang === 'en' || lang === 'ml') {
      ctx.currentLang = lang;
    }
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify() {
    const state = this.getState();
    this.listeners.forEach(fn => fn(state));
  }

  getState() {
    const ctx = this.getActiveContext();
    const currentSeg = ctx.segments.length > 0 ? (ctx.segments[ctx.currentSegmentIndex % ctx.segments.length] || null) : null;
    return {
      isPlaying: ctx.isPlaying,
      isPaused: ctx.isPaused,
      currentSegmentIndex: ctx.segments.length > 0 ? ctx.currentSegmentIndex + 1 : 0,
      totalSegments: ctx.totalSegments,
      currentSegment: currentSeg,
      segments: ctx.segments,
      playbackSpeed: ctx.playbackSpeed,
      selectedVoice: ctx.selectedVoice,
      voices: mockVoices,
      currentLang: ctx.currentLang,
      pageSessionUrl: ctx.pageSessionUrl
    };
  }

  setSpeed(speed) {
    const ctx = this.getActiveContext();
    ctx.playbackSpeed = parseFloat(speed);
    if (ctx.audioElement) {
      ctx.audioElement.playbackRate = ctx.playbackSpeed;
    }
    this.notify();
  }

  setVoice(voiceId) {
    const ctx = this.getActiveContext();
    ctx.selectedVoice = voiceId;
    this.notify();
  }

  _stopCurrentAudio(ctx = this.getActiveContext()) {
    if (ctx.audioElement) {
      try {
        ctx.audioElement.pause();
        ctx.audioElement.currentTime = 0;
      } catch(e) {}
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try { window.speechSynthesis.cancel(); } catch(e) {}
    }
    if (ctx.timer) {
      clearInterval(ctx.timer);
      ctx.timer = null;
    }
  }

  _getSegmentCacheKey(seg) {
    if (!seg) return 'seg_default';
    const textSnippet = (seg.text || seg.malayalamText || seg.englishText || '').slice(0, 64);
    return `${seg.id}_${textSnippet}`;
  }

  async play(lang) {
    const ctx = this.getActiveContext();
    
    if (lang) {
      this.setLanguage(lang);
    }
    
    if (!ctx.segments || ctx.segments.length === 0) return;

    const current = ctx.segments[ctx.currentSegmentIndex % ctx.segments.length];
    if (!current) return;

    // CASE A: Resuming from Paused state on the same active segment
    if (ctx.isPaused && ctx.audioElement && ctx.currentLang === 'ml') {
      try {
        ctx.isPlaying = true;
        ctx.isPaused = false;
        ctx.audioElement.playbackRate = ctx.playbackSpeed;
        await ctx.audioElement.play();
        this.notify();
        return;
      } catch(e) {
        console.warn("Resume playback error, re-initializing segment:", e);
      }
    }

    if (ctx.isPaused && ctx.currentLang === 'en' && typeof window !== 'undefined' && 'speechSynthesis' in window && window.speechSynthesis.paused) {
      try {
        ctx.isPlaying = true;
        ctx.isPaused = false;
        window.speechSynthesis.resume();
        this.notify();
        return;
      } catch(e) {}
    }

    // Stop active audio playback before starting new/re-cached segment
    this._stopCurrentAudio(ctx);
    ctx.isPlaying = true;
    ctx.isPaused = false;
    this.notify();

    if (ctx.currentLang === 'en') {
      // English TTS: Web Speech API (client-side)
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        const textToSpeak = current.englishText || current.text || current.malayalamText || '';
        const utterance = new SpeechSynthesisUtterance(textToSpeak);
        utterance.rate = ctx.playbackSpeed;
        utterance.lang = 'en-US';

        utterance.onend = () => {
          if (ctx.isPlaying && !ctx.isPaused) {
            this.nextSegment();
          }
        };

        utterance.onerror = () => {
          if (ctx.isPlaying && !ctx.isPaused) {
            this.nextSegment();
          }
        };

        try {
          window.speechSynthesis.speak(utterance);
        } catch (e) {}
      } else {
        // Fallback timer if speech synthesis is unavailable
        ctx.timer = setInterval(() => {
          if (ctx.isPlaying && !ctx.isPaused) {
            this.nextSegment();
          }
        }, Math.max(3000, current.durationMs / ctx.playbackSpeed));
      }
    } else {
      // Malayalam TTS: Sarvam AI Backend with segment-level caching
      const mlText = current.malayalamText || current.text || '';
      const isGenuineMalayalam = containsMalayalamText(mlText);
      const cacheKey = this._getSegmentCacheKey(current);

      // Check if audio for this segment is already cached
      if (ctx.audioCache.has(cacheKey)) {
        const cachedItem = ctx.audioCache.get(cacheKey);
        ctx.audioElement = cachedItem.audioElement;
        ctx.audioElement.playbackRate = ctx.playbackSpeed;
        try {
          await ctx.audioElement.play();
          return;
        } catch(e) {
          // Fall through to fetch if cached audio playback failed
        }
      }

      if (isGenuineMalayalam) {
        try {
          const response = await fetch(BACKEND_TTS_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              text: mlText,
              language: 'ml'
            })
          });

          if (!response.ok) {
            throw new Error(`Backend TTS responded with status ${response.status}`);
          }

          const blob = await response.blob();
          if (!ctx.isPlaying) return;

          const audioUrl = URL.createObjectURL(blob);
          const newAudio = new Audio(audioUrl);
          newAudio.playbackRate = ctx.playbackSpeed;

          newAudio.onended = () => {
            if (ctx.isPlaying && !ctx.isPaused) {
              this.nextSegment();
            }
          };

          newAudio.onerror = () => {
            if (ctx.isPlaying && !ctx.isPaused) {
              this.nextSegment();
            }
          };

          // Cache the generated audio element for this segment
          ctx.audioCache.set(cacheKey, { audioUrl, audioElement: newAudio });
          ctx.audioElement = newAudio;

          await ctx.audioElement.play();
        } catch (err) {
          console.warn("Malayalam TTS playback error:", err);
          if (ctx.isPlaying && !ctx.isPaused) {
            ctx.timer = setInterval(() => {
              if (ctx.isPlaying && !ctx.isPaused) {
                this.nextSegment();
              }
            }, Math.max(3000, current.durationMs / ctx.playbackSpeed));
          }
        }
      } else {
        // Fallback for non-Malayalam text segment
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
          const utterance = new SpeechSynthesisUtterance(mlText);
          utterance.rate = ctx.playbackSpeed;
          utterance.onend = () => {
            if (ctx.isPlaying && !ctx.isPaused) {
              this.nextSegment();
            }
          };
          try { window.speechSynthesis.speak(utterance); } catch (e) {}
        } else {
          ctx.timer = setInterval(() => {
            if (ctx.isPlaying && !ctx.isPaused) {
              this.nextSegment();
            }
          }, Math.max(3000, current.durationMs / ctx.playbackSpeed));
        }
      }
    }
  }

  pause() {
    const ctx = this.getActiveContext();
    ctx.isPaused = true;
    ctx.isPlaying = false;
    if (ctx.audioElement) {
      try { ctx.audioElement.pause(); } catch(e) {}
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try { window.speechSynthesis.pause(); } catch(e) {}
    }
    if (ctx.timer) {
      clearInterval(ctx.timer);
      ctx.timer = null;
    }
    this.notify();
  }

  stop() {
    const ctx = this.getActiveContext();
    this._stopCurrentAudio(ctx);
    if (ctx.audioElement) {
      try { ctx.audioElement.currentTime = 0; } catch(e) {}
    }
    ctx.isPlaying = false;
    ctx.isPaused = false;
    this.notify();
  }

  nextSegment() {
    const ctx = this.getActiveContext();
    if (!ctx.segments || ctx.segments.length === 0) return this.getState();

    const wasPlaying = ctx.isPlaying;
    this._stopCurrentAudio(ctx);
    ctx.currentSegmentIndex = (ctx.currentSegmentIndex + 1) % ctx.segments.length;
    this.notify();
    if (wasPlaying) {
      this.play();
    }
    return this.getState();
  }

  prevSegment() {
    const ctx = this.getActiveContext();
    if (!ctx.segments || ctx.segments.length === 0) return this.getState();

    const wasPlaying = ctx.isPlaying;
    this._stopCurrentAudio(ctx);
    ctx.currentSegmentIndex = (ctx.currentSegmentIndex - 1 + ctx.segments.length) % ctx.segments.length;
    this.notify();
    if (wasPlaying) {
      this.play();
    }
    return this.getState();
  }
}

export const ttsService = new TTSService();
