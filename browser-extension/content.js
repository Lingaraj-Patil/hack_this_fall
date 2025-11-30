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