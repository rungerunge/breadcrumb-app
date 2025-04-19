/**
 * Smart Breadcrumbs - Main Script
 * Bundling all breadcrumb JavaScript functionality
 * v1.0.0
 */

// This file is the main entry point for the breadcrumbs JavaScript
// It loads all required components in the correct order

(function() {
  // Determine asset URLs
  const scripts = document.getElementsByTagName('script');
  const currentScript = scripts[scripts.length - 1];
  const scriptSrc = currentScript.src;
  const basePath = scriptSrc.substring(0, scriptSrc.lastIndexOf('/') + 1);
  
  // Define script loading order
  const requiredScripts = [
    'breadcrumb-settings.js',
    'menu-parser.js',
    'breadcrumb-client.js'
  ];
  
  // Load scripts in sequence
  function loadScripts(index) {
    if (index >= requiredScripts.length) {
      console.log('[SmartBreadcrumbs] All scripts loaded');
      return;
    }
    
    const scriptName = requiredScripts[index];
    const scriptUrl = basePath + scriptName;
    
    // Skip if already loaded
    if (
      (scriptName === 'breadcrumb-settings.js' && window.smartBreadcrumbsSettings) ||
      (scriptName === 'menu-parser.js' && window.smartBreadcrumbs) ||
      (scriptName === 'breadcrumb-client.js' && window.smartBreadcrumbsClient)
    ) {
      loadScripts(index + 1);
      return;
    }
    
    // Load script
    const script = document.createElement('script');
    script.src = scriptUrl;
    script.onload = function() {
      loadScripts(index + 1);
    };
    script.onerror = function() {
      console.error(`[SmartBreadcrumbs] Failed to load ${scriptName}`);
      loadScripts(index + 1);
    };
    document.head.appendChild(script);
  }
  
  // Start loading scripts
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      loadScripts(0);
    });
  } else {
    loadScripts(0);
  }
})(); 