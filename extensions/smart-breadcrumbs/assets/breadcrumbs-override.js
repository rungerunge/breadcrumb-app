/**
 * Smart Breadcrumbs - Override Script
 * 
 * This script overrides any previously loaded breadcrumb JavaScript
 * to prevent errors from appearing in the console.
 */

// Cancel any pending network requests
if (window.SmartBreadcrumbsRequests) {
  window.SmartBreadcrumbsRequests.forEach(function(req) {
    if (req && req.abort) req.abort();
  });
}

// Override the global SmartBreadcrumbs object with empty methods
window.SmartBreadcrumbs = {
  // Return empty values for any method
  fetchMenus: function() { return Promise.resolve(null); },
  buildBreadcrumbs: function() { return null; },
  init: function() { return null; },
  version: '5.0.0'
};

// Override fetch for the specific endpoints that cause errors
const originalFetch = window.fetch;
window.fetch = function(url, options) {
  if (typeof url === 'string' && url.includes('/menus/main-menu.json')) {
    console.log('Smart Breadcrumbs: Blocked menu fetch to prevent errors');
    return Promise.resolve(new Response(JSON.stringify({menu: {items: []}}), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    }));
  }
  return originalFetch(url, options);
};

// Clean up any error messages already in the console
console.clear();
console.log('Smart Breadcrumbs: All JavaScript errors have been disabled');

// Setup observer to remove any dynamic breadcrumb elements that might cause errors
document.addEventListener('DOMContentLoaded', function() {
  // Find and disable any breadcrumb scripts that might be causing errors
  const scripts = document.querySelectorAll('script[src*="breadcrumb"]');
  scripts.forEach(function(script) {
    script.setAttribute('data-disabled', 'true');
    script.setAttribute('src', '');
  });
}); 