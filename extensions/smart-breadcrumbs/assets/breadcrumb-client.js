/**
 * Smart Breadcrumbs - Client Script
 * Renders breadcrumbs dynamically based on menu structure
 * v1.0.0
 */

class SmartBreadcrumbsClient {
  constructor() {
    this.initialized = false;
    this.debugMode = window.location.search.includes('debug=true');
    
    // Wait for dependencies
    this.waitForDependencies()
      .then(() => {
        this.initialize();
      })
      .catch(err => {
        console.error('[SmartBreadcrumbs] Error initializing:', err);
      });
  }
  
  /**
   * Wait for required dependencies to load
   * @returns {Promise} Promise that resolves when dependencies are loaded
   */
  waitForDependencies() {
    return new Promise((resolve, reject) => {
      let attempts = 0;
      const maxAttempts = 20;
      const checkInterval = 200;
      
      const check = () => {
        attempts++;
        if (window.smartBreadcrumbs && window.smartBreadcrumbsSettings) {
          this.log('Dependencies loaded');
          resolve();
          return;
        }
        
        if (attempts >= maxAttempts) {
          reject(new Error('Timed out waiting for dependencies'));
          return;
        }
        
        setTimeout(check, checkInterval);
      };
      
      check();
    });
  }
  
  /**
   * Initialize the breadcrumb client
   */
  initialize() {
    if (this.initialized) return;
    
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.setup());
    } else {
      this.setup();
    }
    
    this.initialized = true;
  }
  
  /**
   * Set up the breadcrumb client
   */
  setup() {
    this.log('Setting up breadcrumb client');
    
    // Apply CSS from settings
    window.smartBreadcrumbsSettings.applyStyles();
    
    // Find all breadcrumb containers
    const containers = document.querySelectorAll('[data-smart-breadcrumbs]');
    
    if (containers.length === 0) {
      this.log('No breadcrumb containers found, creating a default one');
      // Create default container if none exists
      this.insertDefaultContainer();
    } else {
      containers.forEach(container => this.renderBreadcrumbs(container));
    }
  }
  
  /**
   * Insert a default breadcrumb container
   */
  insertDefaultContainer() {
    // Find a good place to insert the breadcrumbs (after header, before main content)
    let targetElement = document.querySelector('main, #MainContent, .main-content');
    
    if (!targetElement) {
      // Try to find another suitable element
      targetElement = document.querySelector('.page-container, #shopify-section-main, body > div:not(header):not(footer)');
    }
    
    if (!targetElement) {
      this.log('Could not find a suitable place to insert breadcrumbs');
      return;
    }
    
    // Create container element
    const container = document.createElement('div');
    container.setAttribute('data-smart-breadcrumbs', '');
    container.id = 'smart-breadcrumbs-container';
    
    // Insert at beginning of target element
    targetElement.insertBefore(container, targetElement.firstChild);
    
    // Render breadcrumbs in the new container
    this.renderBreadcrumbs(container);
  }
  
  /**
   * Render breadcrumbs in a container
   * @param {HTMLElement} container - Container element
   */
  renderBreadcrumbs(container) {
    // Skip if breadcrumbs are disabled
    if (!window.smartBreadcrumbsSettings.settings.showBreadcrumbs) {
      this.log('Breadcrumbs are disabled');
      return;
    }
    
    // Get breadcrumbs data from menu parser
    const breadcrumbs = window.smartBreadcrumbs.getBreadcrumbsForCurrentPath();
    
    if (!breadcrumbs || breadcrumbs.length === 0) {
      this.log('No breadcrumbs data available');
      return;
    }
    
    // Generate breadcrumbs HTML
    const html = this.generateBreadcrumbsHTML(breadcrumbs);
    
    // Insert into container
    container.innerHTML = html;
    
    // Add JSON-LD schema to head
    this.addJsonLdSchema(breadcrumbs);
  }
  
  /**
   * Generate HTML for breadcrumbs
   * @param {Array} breadcrumbs - Breadcrumb items
   * @returns {string} HTML string
   */
  generateBreadcrumbsHTML(breadcrumbs) {
    // Start with container
    let html = `<nav class="smart-breadcrumbs-container" aria-label="breadcrumbs">
      <ol class="smart-breadcrumbs-list" itemscope itemtype="https://schema.org/BreadcrumbList">`;
    
    // Add breadcrumb items
    breadcrumbs.forEach((item, index) => {
      const isLast = index === breadcrumbs.length - 1;
      const homeText = window.smartBreadcrumbsSettings.settings.homeText;
      
      // Customize Home text if needed
      const itemText = index === 0 && homeText ? homeText : item.title;
      
      html += `<li class="smart-breadcrumbs-item" itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem">`;
      
      if (isLast) {
        // Current page (no link)
        html += `<span class="smart-breadcrumbs-current" itemprop="name">${itemText}</span>`;
      } else {
        // Link to another page
        html += `<a class="smart-breadcrumbs-link" href="${item.path}" itemprop="item">
          <span itemprop="name">${itemText}</span>
        </a>`;
      }
      
      html += `<meta itemprop="position" content="${item.position}" />`;
      
      // Add separator if not the last item
      if (!isLast) {
        html += `<span class="smart-breadcrumbs-separator" aria-hidden="true">/</span>`;
      }
      
      html += `</li>`;
    });
    
    // Close container
    html += `</ol></nav>`;
    
    // Add debug info if enabled
    if (this.debugMode) {
      html += this.generateDebugInfo(breadcrumbs);
    }
    
    return html;
  }
  
  /**
   * Generate debug information HTML
   * @param {Array} breadcrumbs - Breadcrumb items
   * @returns {string} HTML string
   */
  generateDebugInfo(breadcrumbs) {
    let html = `<div style="font-size: 12px; color: #777; background: #f7f7f7; padding: 10px; margin-top: 10px; border-radius: 4px;">
      <p style="margin: 0 0 5px 0;"><strong>Smart Breadcrumbs Debug Info:</strong></p>
      <p style="margin: 0 0 5px 0;">Page Path: ${window.location.pathname}</p>
      <p style="margin: 0 0 5px 0;">Breadcrumb Items: ${breadcrumbs.length}</p>
      <p style="margin: 0 0 5px 0;">Breadcrumb Hierarchy:</p>
      <ul style="margin: 0; padding-left: 20px;">`;
    
    breadcrumbs.forEach((item, index) => {
      html += `<li>${index + 1}. ${item.title} (${item.path})</li>`;
    });
    
    html += `</ul>`;
    
    // Include settings info
    html += `<p style="margin: 5px 0 0 0;">Settings:</p>
      <ul style="margin: 0; padding-left: 20px;">`;
    
    Object.entries(window.smartBreadcrumbsSettings.settings).forEach(([key, value]) => {
      if (typeof value !== 'object' && typeof value !== 'function') {
        html += `<li>${key}: ${value}</li>`;
      }
    });
    
    html += `</ul></div>`;
    
    return html;
  }
  
  /**
   * Add JSON-LD schema to the page
   * @param {Array} breadcrumbs - Breadcrumb items
   */
  addJsonLdSchema(breadcrumbs) {
    // Generate schema
    const schema = window.smartBreadcrumbs.generateJsonLdSchema(breadcrumbs);
    
    // Find or create script element
    let scriptElement = document.getElementById('smart-breadcrumbs-jsonld');
    if (!scriptElement) {
      scriptElement = document.createElement('script');
      scriptElement.id = 'smart-breadcrumbs-jsonld';
      scriptElement.type = 'application/ld+json';
      document.head.appendChild(scriptElement);
    }
    
    // Set content
    scriptElement.textContent = JSON.stringify(schema);
    this.log('Added JSON-LD schema to head');
  }
  
  /**
   * Log debug messages
   * @param {...any} args - Arguments to log
   */
  log(...args) {
    if (this.debugMode) {
      console.log('[SmartBreadcrumbsClient]', ...args);
    }
  }
}

// Initialize client
window.smartBreadcrumbsClient = new SmartBreadcrumbsClient(); 