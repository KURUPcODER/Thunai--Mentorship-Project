# Thunai--Mentorship-Project

# Thunai (തുണ)

**A Malayalam-First AI Accessibility Assistant**

Thunai is a cross-browser extension that makes the web accessible in Malayalam — combining AI-powered accessibility repair, Malayalam translation & text-to-speech, and text simplification into a single tool.

> "Thunai" (തുണ) means *companion / support* in Malayalam.

---

## Table of Contents

- [The Problem](#the-problem)
- [What Thunai Does](#what-thunai-does)
- [Key Features](#key-features)
- [How It Works](#how-it-works)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Roadmap](#roadmap)
- [Known Limitations](#known-limitations)
- [Team](#team)
- [License](#license)

---

## The Problem

Kerala has one of India's highest literacy rates, with Malayalam as the primary language of daily life. Yet:

- Elderly citizens, people with low vision, individuals with dyslexia, and Malayalam-first speakers struggle to use everyday websites and **central government e-service portals**, most of which are built only in Hindi and English.
- Existing accessibility tools — screen readers, TTS engines, simplification tools — are overwhelmingly **English-first**, leaving Malayalam support as an afterthought at best.
- Malayalam TTS, text simplification, and AI-based accessibility remediation all exist as separate research efforts, but **no practical tool unifies them** for real users on real websites.

Thunai exists to close that gap.

---

## What Thunai Does

Point Thunai at any webpage and it will:

1. **Scan** the page for common accessibility issues (missing alt text, poor contrast, broken heading structure).
2. **Suggest AI-generated fixes** for each issue — flagged for your review, never auto-applied.
3. **Translate** English/Hindi content into natural Malayalam.
4. **Simplify** the Malayalam text into shorter sentences and plainer vocabulary, on request.
5. **Read it aloud** in Malayalam text-to-speech, with the spoken sentence highlighted live on the page (read-along).

All from a single sidebar panel, on any website — with a special focus on central government portals.

---

## Key Features

### Core
- ✅ Rule-based accessibility scanner (contrast, alt text, heading hierarchy) powered by `axe-core`
- ✅ AI-suggested accessibility fixes with **one-click human approval** — nothing is changed on the page without user consent
- ✅ English/Hindi → Malayalam translation
- ✅ Malayalam text-to-speech with live read-along highlighting
- ✅ One-click Malayalam text simplification
- ✅ Unified sidebar UI — accessibility report, translation, simplify, and playback controls in one place

### Differentiators
- 🏛️ **Government portal mode** — tuned and tested against real central government e-service portals (UIDAI, Income Tax e-filing, DigiLocker)
- 👁️ **Dyslexia-friendly reading mode** — accessible font, adjusted spacing, line-focus overlay
- ▶️ Playback speed control, pause/resume, and sentence navigation

### On the roadmap (not yet implemented)
- 📄 PDF/document upload support
- 💾 Offline caching for frequently visited government forms
- 🗣️ Expansion to other Indian regional languages (Tamil, Telugu, Kannada, Bengali, etc.)
- 🌐 Standalone web app and mobile app versions

---

## How It Works

```
User opens a webpage
        │
        ▼
 Thunai sidebar opens
        │
        ├─► Accessibility scan runs automatically (axe-core)
        │        └─► AI suggests fixes → user approves/rejects each
        │
        ├─► User triggers translation (EN/HI → Malayalam)
        │
        ├─► User optionally simplifies the Malayalam text
        │
        └─► User clicks "Listen"
                 └─► Malayalam TTS plays, with live sentence
                     highlighting on the page (read-along)
```

A defining design choice: **AI-generated fixes are never applied silently.** Every suggestion — accessibility fix or otherwise — is surfaced for explicit human approval first. This keeps Thunai trustworthy on accessibility-critical content where AI hallucination risk matters.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Extension | JavaScript, Manifest V3 (Chrome / Edge / Firefox) |
| Accessibility scanning | [axe-core](https://github.com/dequelabs/axe-core) |
| Translation & Malayalam TTS | [Bhashini](https://bhashini.gov.in) (National Language Translation Mission, Govt. of India) |
| Fallback translation/TTS | Google Cloud Translate & Text-to-Speech |
| Text simplification & fix suggestions | LLM API (Claude / Gemini) |
| Backend | Node.js (Express) or Python (FastAPI) — stateless API proxy |
| Backend hosting | Render / Railway (free tier) |

---

## Architecture

```
┌─────────────────────────────┐
│   Browser Extension          │
│  ┌────────────┐ ┌──────────┐ │
│  │ Content     │ │ Sidebar  │ │
│  │ Script      │ │ / Popup  │ │
│  │ (DOM read/  │ │ UI       │ │
│  │  patch,     │ │          │ │
│  │  highlight) │ │          │ │
│  └─────┬──────┘ └────┬─────┘ │
│        └──────┬───────┘       │
│         Background Worker     │
└───────────────┬───────────────┘
                │  API calls
                ▼
┌───────────────────────────────┐
│   Backend (API proxy)          │
│  /translateAndSpeak            │
│  /simplify                     │
│  /suggestFixes                 │
└───┬─────────────┬──────────────┘
    │             │
    ▼             ▼
 Bhashini    LLM (simplify +
 (translate  fix suggestions)
  + TTS)     │
    │        
    ▼        
 Google Cloud (fallback
 translate/TTS if Bhashini
 is slow/unavailable)
```

---

## Getting Started

> ⚠️ Setup instructions will be filled in as the build progresses. Skeleton below.

### Prerequisites
- Node.js ≥ 18
- A Chromium-based browser (Chrome/Edge) or Firefox for testing
- API keys:
  - Bhashini/ULCA developer key ([bhashini.gov.in](https://bhashini.gov.in))
  - LLM API key (Claude or Gemini)
  - (Optional fallback) Google Cloud Translate & TTS credentials

### Installation

```bash
# Clone the repo
git clone https://github.com/<your-org>/thunai.git
cd thunai

# Install backend dependencies
cd backend
npm install

# Add your API keys
cp .env.example .env
# then fill in .env with your keys

# Run the backend
npm run dev
```

### Load the extension locally

1. Go to `chrome://extensions` (or `about:debugging` on Firefox)
2. Enable **Developer mode**
3. Click **Load unpacked** and select the `/extension` folder
4. Open any webpage and click the Thunai icon

---

## Project Structure

```
thunai/
├── extension/
│   ├── manifest.json
│   ├── content-script.js
│   ├── sidebar/
│   └── background.js
├── backend/
│   ├── src/
│   │   ├── routes/
│   │   ├── services/
│   │   │   ├── bhashini.js
│   │   │   ├── googleFallback.js
│   │   │   └── llm.js
│   │   └── server.js
│   └── .env.example
└── README.md
```

---

## Roadmap

- [x] Core MVP: scan, translate, simplify, speak, read-along
- [x] Government portal preset mode
- [x] Dyslexia-friendly reading mode
- [ ] PDF/document upload support
- [ ] Offline caching for repeat visits
- [ ] Expansion to Tamil, Telugu, Kannada, and other Indian languages
- [ ] Standalone web app / mobile app

---

## Known Limitations

- Bhashini's public APIs are officially intended for **proof-of-concept** use, not guaranteed production-grade reliability — Thunai mitigates this with a Google Cloud fallback, but latency/uptime can vary.
- The current build targets general websites and a small set of real central government portals; it is not yet a fully hardened production deployment.
- PDF support, offline mode, and additional languages are on the roadmap but not yet implemented.

---

## Team

| Name | Role |
|---|---|
| — | Extension shell & UI |
| — | Backend & API integration |
| — | Accessibility engine |
| — | Integration, QA & demo |

---

## License

*(Add your chosen license here — e.g., MIT)*
