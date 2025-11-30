// Open dashboard
document.getElementById('openDashboard').addEventListener('click', () => {
  chrome.tabs.create({ url: 'http://localhost:3000' });
});

// Refresh status
document.getElementById('refreshStatus').addEventListener('click', () => {
  updateStatus();
});

// Update status display
async function updateStatus() {
  chrome.runtime.sendMessage({ type: 'GET_STATUS' }, (response) => {
    const statusDot = document.getElementById('statusDot');
    const statusText = document.getElementById('statusText');
    const sessionInfo = document.getElementById('sessionInfo');
    const blockedSites = document.getElementById('blockedSites');
    const blockedCount = document.getElementById('blockedCount');

    if (response && response.isSessionActive) {
      // Active session
      statusDot.className = 'status-dot active';
      statusText.textContent = 'Session Active ✓';
      sessionInfo.textContent = `Session ID: ${response.activeSessionId.substring(0, 8)}...`;
      
      if (response.blockedSites && response.blockedSites.length > 0) {
        blockedSites.style.display = 'block';
        blockedCount.textContent = response.blockedSites.length;
      } else {
        blockedSites.style.display = 'none';
      }
    } else {
      // Inactive session
      statusDot.className = 'status-dot inactive';
      statusText.textContent = 'Session Inactive';
      sessionInfo.textContent = 'Start a session in the web app to begin tracking';
      blockedSites.style.display = 'none';
    }
  });
}

// Update status on popup open
updateStatus();

// Listen for storage changes
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'local' && (changes.isSessionActive || changes.blockedSites)) {
    updateStatus();
  }
});