// This script runs on all web pages
// Can be used for additional tracking or features

console.log('Study Monitor extension active on this page');

// Listen for messages from the extension
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'PAGE_INFO_REQUEST') {
    sendResponse({
      url: window.location.href,
      title: document.title,
      visible: document.visibilityState === 'visible'
    });
  }
  return true;
});

// Bridge: listen for window.postMessage from the web app and forward to the extension background
window.addEventListener('message', (event) => {
  // Only accept messages from same window
  if (event.source !== window) return;
  const msg = event.data;
  if (!msg || typeof msg !== 'object') return;

  // Our protocol: { __study_monitor: true, payload: { type: 'SESSION_STARTED', ... } }
  if (msg.__study_monitor && msg.payload) {
    try {
      chrome.runtime.sendMessage(msg.payload, (resp) => {
        // forward background response back to page if needed
        window.postMessage({ __study_monitor_response: true, payload: resp }, '*');
      });
    } catch (err) {
      console.error('Failed to forward message to extension background:', err);
    }
  }
});

// Also listen for messages from the extension and forward to the page
chrome.runtime.onMessage.addListener((message) => {
  try {
    window.postMessage({ __study_monitor_from_ext: true, payload: message }, '*');
  } catch (err) {
    // ignore
  }
});