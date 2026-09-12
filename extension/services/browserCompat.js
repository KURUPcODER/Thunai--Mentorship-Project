/**
 * Thunai Cross-Platform Browser Compatibility Layer
 * Normalizes WebExtension APIs across all modern browsers & operating systems:
 * Chrome, Firefox, Microsoft Edge, Safari, Opera, Brave, Vivaldi, Kiwi (Android), Orion (iOS/macOS).
 * Supports both Promise-based and Callback-based environments, with resilient fallback for iframe previews.
 */

class BrowserCompat {
  constructor() {
    this.isBrowser = typeof window !== 'undefined';
    this.extApi = this.resolveExtensionApi();
    this.isMobile = this.detectMobile();
    this.isFirefox = typeof navigator !== 'undefined' && /firefox/i.test(navigator.userAgent);
    this.isSafari = typeof navigator !== 'undefined' && /safari/i.test(navigator.userAgent) && !/chrome/i.test(navigator.userAgent);
  }

  resolveExtensionApi() {
    if (typeof browser !== 'undefined' && browser.runtime) {
      return browser; // W3C / Firefox / Safari WebExtensions
    }
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      return chrome; // Chromium / Edge / Opera / Brave / Kiwi
    }
    return null;
  }

  detectMobile() {
    if (typeof navigator === 'undefined') return false;
    return /android|iphone|ipad|ipod|mobile/i.test(navigator.userAgent);
  }

  /**
   * Universal Tabs Query across all browsers
   */
  async getActiveTab() {
    if (this.extApi && this.extApi.tabs && this.extApi.tabs.query) {
      try {
        if (typeof browser !== 'undefined' && browser.tabs && browser.tabs.query) {
          const tabs = await browser.tabs.query({ active: true, currentWindow: true });
          if (tabs && tabs[0]) return tabs[0];
        } else {
          return await new Promise((resolve) => {
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
              if (chrome.runtime && chrome.runtime.lastError) {
                resolve(null);
              } else {
                resolve((tabs && tabs[0]) ? tabs[0] : null);
              }
            });
          });
        }
      } catch (err) {
        console.warn("[Thunai BrowserCompat] Error querying active tab:", err);
      }
    }

    // Preview / Iframe fallback: Mock active tab referencing parent window
    if (typeof window !== 'undefined' && window.parent && window.parent !== window) {
      return {
        id: 'mock-preview-tab',
        title: window.parent.document ? window.parent.document.title : 'Preview Webpage',
        url: window.parent.location ? window.parent.location.href : 'https://preview.thunai.local'
      };
    }

    return null;
  }

  /**
   * Universal Tab Message Dispatcher
   */
  async sendMessageToActiveTab(message) {
    const tab = await this.getActiveTab();
    if (!tab) {
      return this.dispatchToIframe(message);
    }

    if (tab.id === 'mock-preview-tab') {
      return this.dispatchToIframe(message);
    }

    if (this.extApi && this.extApi.tabs && this.extApi.tabs.sendMessage) {
      try {
        if (typeof browser !== 'undefined' && browser.tabs && browser.tabs.sendMessage) {
          return await browser.tabs.sendMessage(tab.id, message);
        } else {
          return await new Promise((resolve) => {
            chrome.tabs.sendMessage(tab.id, message, (response) => {
              if (chrome.runtime && chrome.runtime.lastError) {
                resolve({ success: false, error: chrome.runtime.lastError.message });
              } else {
                resolve(response || { success: true });
              }
            });
          });
        }
      } catch (e) {
        // Fallback to iframe bridge if tab communication fails
        return this.dispatchToIframe(message);
      }
    }

    return this.dispatchToIframe(message);
  }

  /**
   * Fallback for simulated preview environments (e.g. preview.html with iframe)
   */
  dispatchToIframe(message) {
    if (typeof window !== 'undefined' && window.parent && window.parent.ThunaiContentScript) {
      const script = window.parent.ThunaiContentScript;
      switch (message.action) {
        case 'INSPECT_ELEMENT':
        case 'INSPECT_ELEMENT_WITH_POINTER':
          if (script.inspectElementWithPointer) {
            script.inspectElementWithPointer(message.selector, message.label, message.reason, message.fix);
          } else if (script.inspectElement) {
            script.inspectElement(message.selector, message.label);
          }
          return { success: true };

        case 'START_ELEMENT_PICKER':
          if (script.startElementPicker) {
            script.startElementPicker((picked) => {
              if (window.ThunaiOnElementPicked) {
                window.ThunaiOnElementPicked(picked);
              }
            });
          }
          return { success: true };

        case 'STOP_ELEMENT_PICKER':
          if (script.stopElementPicker) script.stopElementPicker();
          return { success: true };

        case 'DIAGNOSE_LIVE_PAGE':
          if (script.diagnoseLivePageBarriers) {
            return script.diagnoseLivePageBarriers();
          }
          return { success: true, barriers: [], totalIssues: 0 };

        case 'AUDIT_PAGE_BUTTONS':
          if (script.auditAllButtonsDOM) {
            return script.auditAllButtonsDOM();
          }
          return { success: true, buttons: [], totalButtons: 0, brokenCount: 0, workingCount: 0, hasIssues: false };

        case 'TRY_AUTO_FIX':
          if (script.tryAutoFixElement) {
            return script.tryAutoFixElement(message.selector, message.fixType);
          }
          return { success: true };

        case 'EXTRACT_PAGE_CONTENT':
          if (script.extractRealPageContent) {
            return { success: true, data: script.extractRealPageContent() };
          }
          break;

        case 'SCAN_LIVE_DOM':
          if (script.scanLivePageDOM) {
            const report = script.scanLivePageDOM();
            return { success: true, ...report, report };
          }
          break;
      }
    }
    return { success: false, fallback: true };
  }

  /**
   * Universal Storage with localStorage fallback
   */
  async getStorage(keys) {
    if (this.extApi && this.extApi.storage && this.extApi.storage.local) {
      try {
        if (typeof browser !== 'undefined' && browser.storage && browser.storage.local.get) {
          return await browser.storage.local.get(keys);
        } else {
          return await new Promise((resolve) => {
            chrome.storage.local.get(keys, (items) => {
              resolve(items || {});
            });
          });
        }
      } catch (e) {
        console.warn("[Thunai BrowserCompat] Storage get failed, using localStorage:", e);
      }
    }

    // Fallback: localStorage
    try {
      if (typeof localStorage !== 'undefined') {
        if (typeof keys === 'string') {
          const val = localStorage.getItem(`thunai_${keys}`);
          return val ? { [keys]: JSON.parse(val) } : {};
        }
      }
    } catch(e) {}

    return {};
  }

  async setStorage(items) {
    if (this.extApi && this.extApi.storage && this.extApi.storage.local) {
      try {
        if (typeof browser !== 'undefined' && browser.storage && browser.storage.local.set) {
          return await browser.storage.local.set(items);
        } else {
          return await new Promise((resolve) => {
            chrome.storage.local.set(items, () => resolve(true));
          });
        }
      } catch (e) {
        console.warn("[Thunai BrowserCompat] Storage set failed, using localStorage:", e);
      }
    }

    // Fallback: localStorage
    try {
      if (typeof localStorage !== 'undefined') {
        Object.keys(items).forEach(k => {
          localStorage.setItem(`thunai_${k}`, JSON.stringify(items[k]));
        });
      }
    } catch(e) {}
    return true;
  }
}

export const browserCompat = new BrowserCompat();
