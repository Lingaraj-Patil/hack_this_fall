// Configuration
const API_URL = 'http://localhost:5001/api';
let activeSessionId = null;
let blockedSites = [];
let isSessionActive = false;
let lastPauseReason = null;

// Load session state from storage on startup
chrome.storage.local.get(['isSessionActive', 'activeSessionId', 'blockedSites'], (result) => {
  isSessionActive = result.isSessionActive || false;
  activeSessionId = result.activeSessionId || null;
  blockedSites = result.blockedSites || [];
  console.log('Extension initialized:', { isSessionActive, activeSessionId, blockedSites });
});

// Helper function to check if a URL is blocked
function isUrlBlocked(url, blockedSitesList) {
  if (!url || !blockedSitesList || blockedSitesList.length === 0) return false;
  
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();
    
    return blockedSitesList.some(site => {
      if (!site) return false;
      
      let siteUrl = (site.url || site).toLowerCase().trim();
      // Remove protocol if present
      siteUrl = siteUrl.replace(/^https?:\/\//, '');
      // Remove path, query, and fragment
      siteUrl = siteUrl.split('/')[0].split('?')[0].split('#')[0];
      // Remove www. prefix
      const siteDomain = siteUrl.replace(/^www\./, '');
      const hostnameNoWww = hostname.replace(/^www\./, '');
      
      // Extract base domain (e.g., "youtube" from "youtube.com")
      const siteBase = siteDomain.split('.')[0];
      const hostnameBase = hostnameNoWww.split('.')[0];
      
      // Multiple matching strategies
      const matches = 
        // Exact match
        hostname === siteUrl ||
        hostnameNoWww === siteDomain ||
        // Base domain match (youtube matches youtube.com, www.youtube.com)
        (siteBase.length > 2 && hostnameBase === siteBase) ||
        // Subdomain match (www.youtube.com matches youtube.com)
        hostnameNoWww.endsWith('.' + siteDomain) ||
        // Contains match (youtube.com matches m.youtube.com)
        hostnameNoWww.includes('.' + siteDomain + '.') ||
        hostnameNoWww === siteDomain + '.' ||
        hostnameNoWww.endsWith('.' + siteDomain);
      
      return matches;
    });
  } catch (e) {
    return false;
  }
}

// Block navigation using webNavigation API - intercepts ALL navigation (most reliable)
chrome.webNavigation.onBeforeNavigate.addListener(async (details) => {
  if (details.frameId !== 0) return; // Only block main frame, not iframes
  if (details.url.startsWith('chrome://') || details.url.startsWith('chrome-extension://') || details.url.startsWith('about:')) return;
  
  const storage = await chrome.storage.local.get(['isSessionActive', 'blockedSites', 'activeSessionId']);
  const sessionActive = storage.isSessionActive || isSessionActive;
  const currentBlockedSites = storage.blockedSites || blockedSites;
  
  if (!sessionActive || !currentBlockedSites || currentBlockedSites.length === 0) return;
  
  if (isUrlBlocked(details.url, currentBlockedSites)) {
    console.log('🚫 BLOCKING navigation to:', details.url);
    
    // Record blocked attempt
    try {
      const token = await getAuthToken();
      const sessionId = storage.activeSessionId || activeSessionId;
      if (token && sessionId) {
        fetch(`${API_URL}/sessions/${sessionId}/blocked-attempt`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ site: new URL(details.url).hostname })
        }).catch(err => console.error('Failed to record blocked attempt:', err));
      }
    } catch (error) {
      console.error('Error recording blocked attempt:', error);
    }
    
    // Cancel navigation and redirect - use chrome.tabs.update
    chrome.tabs.update(details.tabId, {
      url: chrome.runtime.getURL('blocked.html') + '?site=' + encodeURIComponent(new URL(details.url).hostname)
    }).catch(err => {
      console.debug('Could not update tab (may have closed):', err);
    });
  }
}, { url: [{ schemes: ['http', 'https'] }] });

// Also listen for tab creation - block new tabs immediately
chrome.tabs.onCreated.addListener(async (tab) => {
  // New tabs start with chrome://newtab or about:blank, wait for URL to load
  if (!tab.url || tab.url === 'chrome://newtab/' || tab.url === 'about:blank') {
    // Wait for tab to load URL, then check
    const checkTab = async (tabId) => {
      try {
        const updatedTab = await chrome.tabs.get(tabId);
        if (updatedTab.url && updatedTab.url !== 'chrome://newtab/' && updatedTab.url !== 'about:blank') {
          await checkAndBlockTab(updatedTab);
        }
      } catch (err) {
        // Tab closed, ignore
      }
    };
    
    // Check after a short delay
    setTimeout(() => checkTab(tab.id), 500);
    return;
  }
  
  await checkAndBlockTab(tab);
});

// Helper function to check and block a tab
async function checkAndBlockTab(tab) {
  if (!tab.url || tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://')) return;
  
  const storage = await chrome.storage.local.get(['isSessionActive', 'blockedSites', 'activeSessionId']);
  const sessionActive = storage.isSessionActive || isSessionActive;
  const currentBlockedSites = storage.blockedSites || blockedSites;
  
  if (!sessionActive || !currentBlockedSites || currentBlockedSites.length === 0) return;
  
  if (isUrlBlocked(tab.url, currentBlockedSites)) {
    console.log('🚫 BLOCKED tab:', tab.url);
    
    // Record blocked attempt
    try {
      const token = await getAuthToken();
      const sessionId = storage.activeSessionId || activeSessionId;
      if (token && sessionId) {
        fetch(`${API_URL}/sessions/${sessionId}/blocked-attempt`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ site: new URL(tab.url).hostname })
        }).catch(err => console.error('Failed to record blocked attempt:', err));
      }
    } catch (error) {
      console.error('Error recording blocked attempt:', error);
    }
    
    // Redirect immediately
    try {
      await chrome.tabs.update(tab.id, {
        url: chrome.runtime.getURL('blocked.html') + '?site=' + encodeURIComponent(new URL(tab.url).hostname)
      });
    } catch (err) {
      console.debug('Could not update tab (may have closed):', err);
    }
  }
}

// Also listen for tab updates as fallback (catches cases webNavigation might miss)
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  // Only check when URL changes or page starts loading
  if ((changeInfo.status !== 'loading' && changeInfo.url === undefined) || !tab.url) return;
  if (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://') || tab.url.startsWith('about:')) return;
  
  const storage = await chrome.storage.local.get(['isSessionActive', 'blockedSites', 'activeSessionId']);
  const sessionActive = storage.isSessionActive || isSessionActive;
  const currentBlockedSites = storage.blockedSites || blockedSites;
  
  if (!sessionActive || !currentBlockedSites || currentBlockedSites.length === 0) return;
  
  // Check if URL is blocked
  if (isUrlBlocked(tab.url, currentBlockedSites)) {
    console.log('🚫 BLOCKING tab update to:', tab.url);
    
    // Record blocked attempt
    try {
      const token = await getAuthToken();
      const sessionId = storage.activeSessionId || activeSessionId;
      if (token && sessionId) {
        fetch(`${API_URL}/sessions/${sessionId}/blocked-attempt`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ site: new URL(tab.url).hostname })
        }).catch(err => console.error('Failed to record blocked attempt:', err));
      }
    } catch (error) {
      console.error('Error recording blocked attempt:', error);
    }
    
    // Redirect to blocked page
    chrome.tabs.update(tabId, {
      url: chrome.runtime.getURL('blocked.html') + '?site=' + encodeURIComponent(new URL(tab.url).hostname)
    }).catch(err => {
      console.debug('Could not update tab:', err);
    });
    return;
  }
  
  if (isUrlBlocked(tab.url, currentBlockedSites)) {
    console.log('🚫 BLOCKED (fallback):', tab.url);
    
    // Redirect to blocked page
    chrome.tabs.update(tabId, {
      url: chrome.runtime.getURL('blocked.html') + '?site=' + encodeURIComponent(new URL(tab.url).hostname)
    });
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
    
    // Normalize blocked sites - ensure they're in the right format
    blockedSites = blockedSites.map(site => {
      if (typeof site === 'string') {
        return site.toLowerCase().trim();
      }
      return (site.url || site).toLowerCase().trim();
    }).filter(Boolean);
    
    // Store in local storage
    chrome.storage.local.set({
      isSessionActive: true,
      activeSessionId: message.sessionId,
      blockedSites: blockedSites
    });

    console.log('✅ Session started:', activeSessionId);
    console.log('🚫 Blocked sites:', blockedSites);
    
    // Also check current tabs and block if needed
    chrome.tabs.query({}, (tabs) => {
      tabs.forEach(tab => {
        if (tab.url && !tab.url.startsWith('chrome://') && !tab.url.startsWith('chrome-extension://')) {
          const url = new URL(tab.url);
          const hostname = url.hostname.toLowerCase();
          const shouldBlock = blockedSites.some(site => {
            const siteDomain = (site.url || site).toLowerCase().replace(/^https?:\/\//, '').split('/')[0].replace(/^www\./, '');
            const hostnameNoWww = hostname.replace(/^www\./, '');
            return hostnameNoWww === siteDomain || hostnameNoWww.includes('.' + siteDomain) || hostnameNoWww.endsWith('.' + siteDomain);
          });
          
          if (shouldBlock) {
            chrome.tabs.update(tab.id, {
              url: chrome.runtime.getURL('blocked.html') + '?site=' + encodeURIComponent(hostname)
            });
          }
        }
      });
    });
    
    sendResponse({ success: true, message: 'Session tracking started' });
  } 
  else if (message.type === 'SESSION_ENDED') {
    isSessionActive = false;
    activeSessionId = null;
    blockedSites = [];
    // capture optional reason
    lastPauseReason = message.reason || message.pauseReason || null;

    // Persist storage
    chrome.storage.local.set({
      isSessionActive: false,
      activeSessionId: null,
      blockedSites: [],
      lastPauseReason: lastPauseReason
    });

    console.log('⏹️ Session ended', lastPauseReason ? `reason=${lastPauseReason}` : '')
    
    sendResponse({ success: true, message: 'Session tracking stopped', reason: lastPauseReason });
  }
  else if (message.type === 'UPDATE_BLOCKED_SITES') {
    blockedSites = message.blockedSites || [];
    chrome.storage.local.set({ blockedSites });
    
    console.log('🔄 Updated blocked sites:', blockedSites);
    
    sendResponse({ success: true, message: 'Blocked sites updated' });
  }
  else if (message.type === 'GET_STATUS') {
    // Get fresh data from storage
    chrome.storage.local.get(['isSessionActive', 'activeSessionId', 'blockedSites', 'lastPauseReason'], (data) => {
      sendResponse({ 
        isSessionActive: data.isSessionActive || false, 
        activeSessionId: data.activeSessionId || null, 
        blockedSites: data.blockedSites || [],
        lastPauseReason: data.lastPauseReason || null
      });
    });
    return true; // Keep message channel open for async response
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