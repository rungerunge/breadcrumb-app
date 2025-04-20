/**
 * Smart Breadcrumbs - Disabled JavaScript
 * 
 * All JavaScript functionality has been disabled to prevent errors.
 * The breadcrumb navigation now works purely with Liquid templates.
 * 
 * v5.0.0
 */

// Intentionally empty to prevent errors
console.log('Smart Breadcrumbs: JavaScript functionality disabled');

// Override any existing functions to prevent errors
window.SmartBreadcrumbs = {
  fetchMenus: function() { return null; },
  buildBreadcrumbs: function() { return null; },
  init: function() { return null; }
};

// Prevent any potential postMessage errors
window.addEventListener('message', function(event) {
  // Ignore all messages to prevent errors
}, false); 