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

    if (message.type === 'PING') {
      sendResponse({ status: 'PONG', version: '1.0.0' });
    }
  });
}
