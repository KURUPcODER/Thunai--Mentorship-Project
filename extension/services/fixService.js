/**
 * Thunai AI Fix Review Service
 * Manages human-in-the-loop repair proposals and applies approved fixes directly onto the active webpage.
 */

class FixService {
  constructor() {
    this.fixes = [
      {
        id: "fix-img-1",
        issueId: "issue-img-alt-1",
        category: "Images & Media",
        title: "Missing Alt Text on Page Image",
        selector: "img",
        rule: "WCAG 1.1.1 Non-text Content",
        proposedChange: "Add descriptive Malayalam alt text: 'ചിത്രം: പേജിലെ ഉള്ളടക്കം വ്യക്തമാക്കുന്ന വിവരണം'",
        codeSnippet: `<img src="..." alt="ചിത്രം: പേജിലെ ഉള്ളടക്കം വ്യക്തമാക്കുന്ന വിവരണം" />`,
        status: "pending",
        generatedAt: "Just now",
        confidence: "98%"
      },
      {
        id: "fix-contrast-1",
        issueId: "issue-contrast-1",
        category: "Color Contrast",
        title: "Fix Insufficient Link Text Contrast",
        selector: "a",
        rule: "WCAG 1.4.3 Contrast (Minimum)",
        proposedChange: "Update text color to high-contrast #0F172A",
        codeSnippet: `color: #0F172A !important; font-weight: 700;`,
        status: "pending",
        generatedAt: "Just now",
        confidence: "100%"
      }
    ];

    this.listeners = new Set();
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify() {
    const data = this.getAllFixes();
    this.listeners.forEach(fn => fn(data));
  }

  getAllFixes() {
    return JSON.parse(JSON.stringify(this.fixes));
  }

  getPendingFixes() {
    return this.fixes.filter(f => f.status === 'pending');
  }

  async generateFixSuggestion(issueId) {
    await new Promise((resolve) => setTimeout(resolve, 600));
    const fix = this.fixes.find(f => f.issueId === issueId);
    if (fix) {
      this.notify();
      return fix;
    }
    const newFix = {
      id: `fix-${Date.now()}`,
      issueId: issueId,
      category: "General Accessibility",
      title: "AI Accessibility DOM Repair",
      selector: `[data-thunai-issue="${issueId}"]`,
      rule: "WCAG 2.1 AA Compliance",
      proposedChange: "Automatically generate semantic ARIA structure and labels",
      codeSnippet: `aria-label="വിവരണം ചേർത്തു" role="region"`,
      status: "pending",
      generatedAt: "Just now",
      confidence: "96%"
    };
    this.fixes.unshift(newFix);
    this.notify();
    return newFix;
  }

  approveFix(fixId) {
    const fix = this.fixes.find(f => f.id === fixId);
    if (fix) {
      fix.status = 'applied';
      this.notify();
      this.dispatchFixToLivePage(fix);
      return true;
    }
    return false;
  }

  rejectFix(fixId) {
    const fix = this.fixes.find(f => f.id === fixId);
    if (fix) {
      fix.status = 'rejected';
      this.notify();
      return true;
    }
    return false;
  }

  approveAll() {
    this.fixes.forEach(f => {
      if (f.status === 'pending') {
        f.status = 'applied';
        this.dispatchFixToLivePage(f);
      }
    });
    this.notify();
    return true;
  }

  dispatchFixToLivePage(fix) {
    if (typeof chrome !== 'undefined' && chrome.tabs) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs && tabs[0] && tabs[0].id) {
          chrome.tabs.sendMessage(tabs[0].id, {
            action: 'APPLY_FIX',
            fix: fix
          }).catch(() => {});
        }
      });
    } else if (typeof window !== 'undefined' && window.parent && window.parent.ThunaiContentScript) {
      window.parent.ThunaiContentScript.applyLiveFixToPage(fix);
    }
  }
}

export const fixService = new FixService();
