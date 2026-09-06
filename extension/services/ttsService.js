/**
 * Thunai Text-To-Speech (TTS) Service
 * Manages segment queue, extracts live page paragraphs, and synchronizes highlights on ANY website.
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
  { id: "ml-IN-female-1", name: "Malayalam Female (Bhashini - ഭാരതി)", lang: "ml-IN", gender: "female" },
  { id: "ml-IN-male-1", name: "Malayalam Male (Bhashini - കൃഷ്ണൻ)", lang: "ml-IN", gender: "male" },
  { id: "en-IN-female-1", name: "Indian English Female (Google)", lang: "en-IN", gender: "female" }
];

class TTSService {
  constructor() {
    this.isPlaying = false;
    this.isPaused = false;
    this.currentSegmentIndex = 0;
    this.totalSegments = 1129;
    this.segments = defaultMockSegments;
    this.playbackSpeed = 1.0;
    this.selectedVoice = mockVoices[0].id;
    this.listeners = new Set();
    this.timer = null;

    this.initRealPageSegments();
  }

  async initRealPageSegments() {
    // Attempt live extraction from active tab
    if (typeof chrome !== 'undefined' && chrome.tabs) {
      try {
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tabs && tabs[0] && tabs[0].id) {
          const res = await chrome.tabs.sendMessage(tabs[0].id, { action: 'EXTRACT_PAGE_CONTENT' });
          if (res && res.success && res.data && res.data.segments.length > 0) {
            this.segments = res.data.segments.map(s => ({
              id: s.id,
              type: s.type,
              tag: s.tag,
              malayalamText: s.text,
              englishText: s.text,
              selector: s.selector,
              durationMs: s.durationMs
            }));
            this.totalSegments = this.segments.length;
            this.notify();
          }
        }
      } catch(e) {}
    } else if (typeof window !== 'undefined' && window.parent && window.parent.ThunaiContentScript) {
      const data = window.parent.ThunaiContentScript.extractRealPageContent();
      if (data && data.segments.length > 0) {
        this.segments = data.segments.map(s => ({
          id: s.id,
          type: s.type,
          tag: s.tag,
          malayalamText: s.text,
          englishText: s.text,
          selector: s.selector,
          durationMs: s.durationMs
        }));
        this.totalSegments = this.segments.length;
        this.notify();
      }
    }
  }

  loadSegments(textSegments) {
    if (!textSegments || textSegments.length === 0) return;
    this.segments = textSegments.map((s, idx) => ({
      id: s.id || idx + 1,
      type: s.type || 'PARAGRAPH',
      tag: s.tag || `ഖണ്ഡിക ${idx + 1}`,
      malayalamText: s.mlText || s.text || '',
      englishText: s.text || '',
      selector: s.selector || `[data-thunai-seg="${s.id || 'seg-' + idx}"]`,
      durationMs: s.durationMs || Math.max(3000, (s.text || '').length * 65)
    }));
    this.totalSegments = this.segments.length;
    this.notify();
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
    const currentSeg = this.segments[this.currentSegmentIndex % this.segments.length] || defaultMockSegments[0];
    return {
      isPlaying: this.isPlaying,
      isPaused: this.isPaused,
      currentSegmentIndex: this.currentSegmentIndex + 1,
      totalSegments: this.totalSegments,
      currentSegment: currentSeg,
      segments: this.segments,
      playbackSpeed: this.playbackSpeed,
      selectedVoice: this.selectedVoice,
      voices: mockVoices
    };
  }

  setSpeed(speed) {
    this.playbackSpeed = parseFloat(speed);
    this.notify();
  }

  setVoice(voiceId) {
    this.selectedVoice = voiceId;
    this.notify();
  }

  play() {
    this.isPlaying = true;
    this.isPaused = false;
    this.notify();

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const current = this.segments[this.currentSegmentIndex % this.segments.length];
      const utterance = new SpeechSynthesisUtterance(current.malayalamText || current.englishText);
      utterance.rate = this.playbackSpeed;
      try { window.speechSynthesis.speak(utterance); } catch (e) {}
    }

    clearInterval(this.timer);
    this.timer = setInterval(() => {
      if (this.isPlaying && !this.isPaused) {
        this.nextSegment();
      }
    }, 6000 / this.playbackSpeed);
  }

  pause() {
    this.isPaused = true;
    this.isPlaying = false;
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try { window.speechSynthesis.pause(); } catch(e){}
    }
    clearInterval(this.timer);
    this.notify();
  }

  stop() {
    this.isPlaying = false;
    this.isPaused = false;
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try { window.speechSynthesis.cancel(); } catch(e){}
    }
    clearInterval(this.timer);
    this.notify();
  }

  nextSegment() {
    this.currentSegmentIndex = (this.currentSegmentIndex + 1) % this.segments.length;
    this.notify();
    return this.getState();
  }

  prevSegment() {
    this.currentSegmentIndex = (this.currentSegmentIndex - 1 + this.segments.length) % this.segments.length;
    this.notify();
    return this.getState();
  }
}

export const ttsService = new TTSService();
