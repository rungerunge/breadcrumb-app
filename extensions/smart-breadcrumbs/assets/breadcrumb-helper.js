/**
 * Smart Breadcrumbs Helper v2.0
 * Enhanced collection detection with navigation hierarchy support
 */

(function() {
  // Configuration
  const CONFIG = {
    debug: true,
    selectors: {
      breadcrumb: '.smart-breadcrumbs',
      debugPanel: '.breadcrumb-debug',
      navigationJson: '#navigation-json',
      productJson: '#product-json',
      mainNav: ['.main-menu', 'nav.navigation', 'header nav', 'nav'],
      collectionLinks: 'a[href*="/collections/"]'
    },
    classes: {
      link: 'smart-breadcrumbs__link',
      separator: 'smart-breadcrumbs__separator',
      current: 'smart-breadcrumbs__current',
      debugRow: 'breadcrumb-debug-row',
      debugLabel: 'breadcrumb-debug-label',
      debugValue: 'breadcrumb-debug-value'
    }
  };

  /**
   * Logs a message to the console if debug is enabled
   * @param {string} message - Message to log
   * @param {string} type - Log type (log, warn, error, info)
   */
  function log(message, type = 'log') {
    if (!CONFIG.debug) return;
    
    const prefix = 'Smart Breadcrumbs:';
    
    switch (type) {
      case 'error':
        console.error(`${prefix} ${message}`);
        break;
      case 'warn':
        console.warn(`${prefix} ${message}`);
        break;
      case 'info':
        console.info(`${prefix} ${message}`);
        break;
      default:
        console.log(`${prefix} ${message}`);
    }
  }
  
  /**
   * Builds a navigation hierarchy map from menu data
   * @param {Object} menuData - Navigation menu data
   * @returns {Object} - Hierarchy map of collections
   */
  function buildNavigationHierarchy(menuData) {
    const hierarchy = {};
    
    function processMenuItems(items, parentPath = '') {
      if (!items || !Array.isArray(items)) return;
      
      items.forEach(item => {
        // Skip non-collection links
        if (!item.url || !item.url.includes('/collections/')) return;
        
        const collectionHandle = item.url.split('/collections/')[1].split('/')[0];
        
        // Store this collection's path information
        hierarchy[collectionHandle] = {
          title: item.title,
          url: item.url,
          parentPath: parentPath
        };
        
        // Process any child items (for mega menus/dropdown navigation)
        if (item.links && item.links.length > 0) {
          processMenuItems(item.links, parentPath ? `${parentPath} > ${item.title}` : item.title);
        }
      });
    }
    
    try {
      if (menuData && menuData.links) {
        processMenuItems(menuData.links);
      }
    } catch (e) {
      log(`Error building navigation hierarchy: ${e.message}`, 'error');
    }
    
    return hierarchy;
  }

  /**
   * Determines the best collection match from navigation hierarchy
   * @param {Object} product - Product data
   * @param {Object} navigationHierarchy - Navigation hierarchy map
   * @param {string} currentUrl - Current page URL
   * @returns {Object|null} - Best collection match or null
   */
  function findBestCollectionMatch(product, navigationHierarchy, currentUrl) {
    try {
      // First check if we're already in a collection context from the URL
      const urlMatch = currentUrl.match(/\/collections\/([^/]+)/);
      const urlCollectionHandle = urlMatch ? urlMatch[1] : null;
      
      if (urlCollectionHandle && navigationHierarchy[urlCollectionHandle]) {
        return {
          handle: urlCollectionHandle,
          title: navigationHierarchy[urlCollectionHandle].title,
          url: `/collections/${urlCollectionHandle}`,
          parentPath: navigationHierarchy[urlCollectionHandle].parentPath
        };
      }
      
      // If product has collections data, check against the navigation hierarchy
      if (product && product.collections && Array.isArray(product.collections)) {
        // Find the most prominent collection (highest in navigation)
        let bestMatch = null;
        let shortestPath = Infinity;
        
        product.collections.forEach(collection => {
          if (navigationHierarchy[collection.handle]) {
            const pathDepth = navigationHierarchy[collection.handle].parentPath.split('>').length;
            
            if (pathDepth < shortestPath) {
              shortestPath = pathDepth;
              bestMatch = {
                handle: collection.handle,
                title: navigationHierarchy[collection.handle].title,
                url: `/collections/${collection.handle}`,
                parentPath: navigationHierarchy[collection.handle].parentPath
              };
            }
          }
        });
        
        if (bestMatch) return bestMatch;
        
        // Fallback to first collection
        if (product.collections.length > 0) {
          return {
            handle: product.collections[0].handle,
            title: product.collections[0].title,
            url: `/collections/${product.collections[0].handle}`,
            parentPath: ''
          };
        }
      }
    } catch (e) {
      log(`Error finding best collection match: ${e.message}`, 'error');
    }
    
    return null;
  }

  /**
   * Extracts product data from the page
   * @returns {Object|null} - Product data or null
   */
  function extractProductData() {
    try {
      // Try to find product JSON
      const productJSON = document.getElementById(CONFIG.selectors.productJson.substring(1)) || 
                          document.getElementById('ProductJson-product-template') || 
                          document.getElementById('ProductJson-template') ||
                          document.querySelector('[id^="ProductJson-"]');
                          
      if (productJSON) {
        return JSON.parse(productJSON.textContent);
      }
      
      log('Product JSON not found, attempting alternative extraction', 'warn');
      
      // Alternative: extract from meta tags
      const productHandle = window.location.pathname.match(/\/products\/([^\/]+)/)?.[1];
      if (!productHandle) {
        log('Unable to extract product handle from URL', 'warn');
        return null;
      }
      
      const productTitle = document.querySelector('meta[property="og:title"]')?.content ||
                          document.title.split(' – ')[0] ||
                          document.querySelector('h1')?.textContent;
      
      // Try to find collections from meta tags or links
      const collections = [];
      const collectionLinks = document.querySelectorAll(CONFIG.selectors.collectionLinks);
      
      collectionLinks.forEach(link => {
        const href = link.getAttribute('href');
        const match = href.match(/\/collections\/([^\/]+)/);
        
        if (match && match[1] && !href.includes('/products/')) {
          // Avoid duplicates
          if (!collections.some(c => c.handle === match[1])) {
            collections.push({
              handle: match[1],
              title: link.textContent.trim(),
              url: href
            });
          }
        }
      });
      
      return {
        handle: productHandle,
        title: productTitle,
        collections: collections
      };
    } catch (e) {
      log(`Error extracting product data: ${e.message}`, 'error');
      return null;
    }
  }

  /**
   * Extracts navigation data from the page
   * @returns {Object|null} - Navigation data or null
   */
  function extractNavigationData() {
    try {
      // Try to find navigation JSON
      const navigationJSON = document.getElementById(CONFIG.selectors.navigationJson.substring(1));
      if (navigationJSON) {
        return JSON.parse(navigationJSON.textContent);
      }
      
      log('Navigation JSON not found, attempting alternative extraction', 'warn');
      
      // Alternative: build from navigation elements
      let mainNav = null;
      for (const selector of CONFIG.selectors.mainNav) {
        mainNav = document.querySelector(selector);
        if (mainNav) break;
      }
                      
      if (!mainNav) {
        log('Main navigation not found in DOM', 'warn');
        return null;
      }
      
      const links = Array.from(mainNav.querySelectorAll('a')).map(a => ({
        title: a.textContent.trim(),
        url: a.getAttribute('href')
      }));
      
      return { links };
    } catch (e) {
      log(`Error extracting navigation data: ${e.message}`, 'error');
      return null;
    }
  }

  /**
   * Creates a collection link element
   * @param {Object} collection - Collection data
   * @returns {Array} - Array of DOM elements [separator, link]
   */
  function createCollectionElements(collection) {
    try {
      // Create collection link element
      const collectionLink = document.createElement('a');
      collectionLink.href = collection.url;
      collectionLink.className = CONFIG.classes.link;
      collectionLink.textContent = collection.title;
      
      // Create separator
      const separator = document.createElement('span');
      separator.className = CONFIG.classes.separator;
      separator.textContent = '/';
      
      return [separator, collectionLink];
    } catch (e) {
      log(`Error creating collection elements: ${e.message}`, 'error');
      return null;
    }
  }

  /**
   * Adds debug information to the page
   * @param {Object} info - Debug information
   */
  function addDebugInfo(info) {
    try {
      const debugPanel = document.querySelector(CONFIG.selectors.debugPanel);
      if (!debugPanel) return;
      
      const fixesInfo = document.createElement('div');
      fixesInfo.className = CONFIG.classes.debugRow;
      
      const label = document.createElement('span');
      label.className = CONFIG.classes.debugLabel;
      label.textContent = 'JS Helper:';
      
      const value = document.createElement('span');
      value.className = CONFIG.classes.debugValue;
      value.textContent = 'Active - Enhanced navigation-based collection detection';
      
      fixesInfo.appendChild(label);
      fixesInfo.appendChild(value);
      debugPanel.appendChild(fixesInfo);
      
      // Add detailed info
      if (info) {
        Object.entries(info).forEach(([key, val]) => {
          if (val === null || val === undefined) return;
          
          const row = document.createElement('div');
          row.className = CONFIG.classes.debugRow;
          
          const rowLabel = document.createElement('span');
          rowLabel.className = CONFIG.classes.debugLabel;
          rowLabel.textContent = `${key}:`;
          
          const rowValue = document.createElement('span');
          rowValue.className = CONFIG.classes.debugValue;
          rowValue.textContent = typeof val === 'object' ? JSON.stringify(val) : val;
          
          row.appendChild(rowLabel);
          row.appendChild(rowValue);
          debugPanel.appendChild(row);
        });
      }
    } catch (e) {
      log(`Error adding debug info: ${e.message}`, 'error');
    }
  }

  // Main execution starts here
  document.addEventListener('DOMContentLoaded', function() {
    try {
      // Check if we're on a product page
      const isProductPage = window.location.pathname.includes('/products/');
      
      if (!isProductPage) {
        log('Not a product page, exiting', 'info');
        return;
      }
      
      // Try to find breadcrumb element
      const breadcrumb = document.querySelector(CONFIG.selectors.breadcrumb);
      if (!breadcrumb) {
        log('Breadcrumb element not found', 'warn');
        return;
      }
      
      // Check if collection is missing (only home and product)
      const separators = breadcrumb.querySelectorAll(`.${CONFIG.classes.separator}`);
      if (separators.length >= 2) {
        log('Breadcrumb already has collection link, no fix needed', 'info');
        addDebugInfo({ status: 'Breadcrumb already complete' });
        return;
      }
      
      log('Collection appears to be missing, attempting to add it', 'info');
      
      // ENHANCED APPROACH: Use navigation hierarchy
      const productData = extractProductData();
      const navigationData = extractNavigationData();
      
      let debugInfo = {
        method: 'Navigation-based detection',
        productFound: !!productData,
        navFound: !!navigationData
      };
      
      if (productData && navigationData) {
        // Build navigation hierarchy
        const navHierarchy = buildNavigationHierarchy(navigationData);
        debugInfo.hierarchySize = Object.keys(navHierarchy).length;
        
        // Find best collection match
        const bestCollection = findBestCollectionMatch(
          productData,
          navHierarchy,
          window.location.pathname
        );
        
        if (bestCollection) {
          debugInfo.collectionFound = bestCollection.handle;
          debugInfo.collectionTitle = bestCollection.title;
          
          // Create collection elements
          const [separator, collectionLink] = createCollectionElements(bestCollection);
          
          // Get home link (first link in breadcrumb)
          const homeLink = breadcrumb.querySelector(`.${CONFIG.classes.link}`);
          
          // Insert collection after home link
          if (homeLink) {
            homeLink.insertAdjacentElement('afterend', separator);
            separator.insertAdjacentElement('afterend', collectionLink);
            log('Successfully added collection from navigation hierarchy', 'info');
            debugInfo.status = 'Success - Collection added';
            addDebugInfo(debugInfo);
            return; // Skip fallback methods if we successfully added from navigation
          }
        } else {
          debugInfo.error = 'No matching collection found in navigation';
        }
      } else {
        debugInfo.error = 'Missing product or navigation data';
      }
      
      // FALLBACK METHOD: Look for collection in URL or meta tags
      debugInfo.method = 'URL-based fallback';
      
      // Try to get collection from URL
      const path = window.location.pathname;
      let collectionHandle = null;
      
      // Check if URL contains collection info
      if (path.includes('/collections/')) {
        const matches = path.match(/\/collections\/([^\/]+)/);
        if (matches && matches[1]) {
          collectionHandle = matches[1];
          debugInfo.collectionFound = collectionHandle;
        }
      }
      
      // Check if we can find collection info in the page
      if (!collectionHandle) {
        // Look for collection data in meta tags
        const metaTags = document.querySelectorAll('meta[property^="og:"]');
        metaTags.forEach(tag => {
          const content = tag.getAttribute('content');
          if (content && content.includes('/collections/')) {
            const matches = content.match(/\/collections\/([^\/]+)/);
            if (matches && matches[1]) {
              collectionHandle = matches[1];
              debugInfo.collectionFound = collectionHandle;
              debugInfo.source = 'Meta tags';
            }
          }
        });
      }
      
      // If we found a collection, inject it into the breadcrumb
      if (collectionHandle) {
        const collectionName = collectionHandle.replace(/-/g, ' ');
        const formattedName = collectionName
          .split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
          
        const collectionUrl = `/collections/${collectionHandle}`;
        
        // Create collection link element
        const collectionLink = document.createElement('a');
        collectionLink.href = collectionUrl;
        collectionLink.className = CONFIG.classes.link;
        collectionLink.textContent = formattedName;
        
        // Create separator
        const separator = document.createElement('span');
        separator.className = CONFIG.classes.separator;
        separator.textContent = '/';
        
        // Get home link (first link in breadcrumb)
        const homeLink = breadcrumb.querySelector(`.${CONFIG.classes.link}`);
        
        // Insert collection after home link
        if (homeLink) {
          homeLink.insertAdjacentElement('afterend', separator);
          separator.insertAdjacentElement('afterend', collectionLink);
          log('Successfully added missing collection from URL', 'info');
          debugInfo.status = 'Success - Collection added from URL';
          addDebugInfo(debugInfo);
        } else {
          debugInfo.error = 'Home link not found';
          addDebugInfo(debugInfo);
        }
      } else {
        debugInfo.error = 'No collection information found';
        addDebugInfo(debugInfo);
      }
    } catch (e) {
      log(`Main execution error: ${e.message}`, 'error');
      addDebugInfo({ error: e.message, stack: e.stack });
    }
  });
})(); 