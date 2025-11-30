// Configuration
const API_URL = 'http://localhost:5001/api';
let activeSessionId = null;
let blockedSites = [];
let isSessionActive = false;

// Listen for tab updates - Block sites during active session
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === 'loading' && tab.url && isSessionActive) {
    const url = new URL(tab.url);
    const hostname = url.hostname;

    console.log('Checking URL:', hostname);

    // Check if site is blocked
    const isBlocked = blockedSites.some(site => {
      const siteUrl = site.url || site;
      return hostname.includes(siteUrl);
    });

    if (isBlocked) {
      console.log('🚫 BLOCKED:', hostname);
      
      // Send blocked attempt to backend
      try {
        const token = await getAuthToken();
        if (token && activeSessionId) {
          await fetch(`${API_URL}/sessions/${activeSessionId}/blocked-attempt`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ site: hostname })
          }).catch(err => console.error('Failed to record blocked attempt:', err));
        }
      } catch (error) {
        console.error('Error recording blocked attempt:', error);
      }

      // Redirect to blocked page
      chrome.tabs.update(tabId, {
        url: chrome.runtime.getURL('blocked.html') + '?site=' + encodeURIComponent(hostname)
      });
    }
  }
});

// Helper function to get auth token from storage
async function getAuthToken() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['authToken'], (result) => {
      resolve(result.authToken || null);
    });
  });
}

// Helper function to get blocked sites from storage
async function getBlockedSites() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['blockedSites'], (result) => {
      resolve(result.blockedSites || []);
    });
  });
}

// Listen for messages from popup or web app
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Received message:', message);

  if (message.type === 'SESSION_STARTED') {
    isSessionActive = true;
    activeSessionId = message.sessionId;
    blockedSites = message.blockedSites || [];
    
    // Store in local storage
    chrome.storage.local.set({
      isSessionActive: true,
      activeSessionId: message.sessionId,
      blockedSites: blockedSites
    });

    console.log('✅ Session started:', activeSessionId);
    console.log('🚫 Blocked sites:', blockedSites);
    
    sendResponse({ success: true, message: 'Session tracking started' });
  } 
  else if (message.type === 'SESSION_ENDED') {
    isSessionActive = false;
    activeSessionId = null;
    blockedSites = [];

    // Clear storage
    chrome.storage.local.set({
      isSessionActive: false,
      activeSessionId: null,
      blockedSites: []
    });

    console.log('⏹️ Session ended');
    
    sendResponse({ success: true, message: 'Session tracking stopped' });
  }
  else if (message.type === 'UPDATE_BLOCKED_SITES') {
    blockedSites = message.blockedSites || [];
    chrome.storage.local.set({ blockedSites });
    
    console.log('🔄 Updated blocked sites:', blockedSites);
    
    sendResponse({ success: true, message: 'Blocked sites updated' });
  }
  else if (message.type === 'GET_STATUS') {
    sendResponse({ 
      isSessionActive, 
      activeSessionId, 
      blockedSites 
    });
  }

  return true; // Keep message channel open for async response
});

// On extension install/update
chrome.runtime.onInstalled.addListener(() => {
  console.log('Study Monitor Extension installed!');
  
  // Initialize storage
  chrome.storage.local.set({
    isSessionActive: false,
    activeSessionId: null,
    blockedSites: []
  });
});

// On browser startup, restore session state
chrome.runtime.onStartup.addListener(async () => {
  const data = await chrome.storage.local.get(['isSessionActive', 'activeSessionId', 'blockedSites']);
  
  isSessionActive = data.isSessionActive || false;
  activeSessionId = data.activeSessionId || null;
  blockedSites = data.blockedSites || [];

  console.log('Extension started. Active session:', isSessionActive);
});