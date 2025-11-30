// Get blocked site from URL parameter
const params = new URLSearchParams(window.location.search);
const site = params.get('site');
if (site) {
  document.getElementById('siteName').textContent = decodeURIComponent(site);
}

// Function to search the web for the blocked site
function searchWeb() {
  const params = new URLSearchParams(window.location.search);
  const site = params.get('site');
  if (site) {
    const decodedSite = decodeURIComponent(site);
    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(decodedSite)}`;
    window.location.href = searchUrl;
  } else {
    // Fallback: open Google search home
    window.location.href = 'https://www.google.com';
  }
}

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', function() {
  const searchBtn = document.getElementById('searchBtn');
  if (searchBtn) {
    // Click handler
    searchBtn.addEventListener('click', searchWeb);
    
    // Keyboard support
    searchBtn.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        searchWeb();
      }
    });
  }
});
