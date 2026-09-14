/**
 * Thunai Background Service Worker (Manifest V3)
 * Manages sidePanel opening on action click and routes messages between UI & Content Scripts.
 */

// Configure Chrome Side Panel to open automatically when user clicks extension toolbar icon
if (typeof chrome !== 'undefined' && chrome.sidePanel && chrome.sidePanel.setPanelBehavior) {
  chrome.sidePanel
    .setPanelBehavior({ openPanelOnActionClick: true })
    .catch((error) => console.warn("SidePanel API configuration fallback:", error));
}

// Global Message Hub for Cross-Context Communication
if (typeof chrome !== 'undefined' && chrome.runtime) {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    // Relay inspection or highlight requests to the active tab
    if (message.target === 'CONTENT_SCRIPT') {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs && tabs[0] && tabs[0].id) {
          chrome.tabs.sendMessage(tabs[0].id, message, (response) => {
            sendResponse(response || { success: true });
          });
        } else {
          sendResponse({ success: false, reason: "No active tab found" });
        }
      });
      return true; // Keep message channel open for async response
    }

    if (message.type === 'TRANSLITERATE') {
      const word = (message.word || '').trim();

      if (!word) {
        sendResponse({ success: true, result: [] });
        return;
      }

      fetch(
        `https://api.varnamproject.com/tl/ml/${encodeURIComponent(word)}`
      )
        .then((response) => {
          if (!response.ok) {
            throw new Error(`Varnam HTTP ${response.status}`);
          }
          return response.json();
        })
        .then((data) => {
          const results = Array.isArray(data.result)
            ? data.result
            : [];

          const cleanedResults = results
            .map((item) => {
              if (typeof item === 'string') return item;

              if (item && typeof item === 'object') {
                return item.word || item.text || item.value || '';
              }

              return '';
            })
            .filter(Boolean);

          sendResponse({
            success: true,
            result: cleanedResults
          });
        })
        .catch((error) => {
          console.warn('Varnam transliteration error:', error);
          sendResponse({
            success: false,
            result: []
          });
        });

      return true;
    }

    if (message.type === 'PING') {
      sendResponse({ status: 'PONG', version: '1.0.0' });
    }
  });
}
