/**
 * Smart Breadcrumbs - Menu Parser
 * Parses the store's navigation menu to create breadcrumb data
 * v1.0.0
 */

class SmartBreadcrumbsMenuParser {
  constructor() {
    this.menuCache = {};
    this.hierarchyMap = {};
    this.initialized = false;
    this.debugMode = window.location.search.includes('debug=true');
  }

  /**
   * Initialize the parser and build the hierarchy map
   */
  init() {
    if (this.initialized) return;
    
    this.log('Initializing menu parser');
    this.parseNavigationMenu();
    this.initialized = true;
  }
  
  /**
   * Parse the store's main navigation menu
   */
  parseNavigationMenu() {
    // Find the main navigation menu
    const navElements = document.querySelectorAll('nav ul, .navigation, .menu, header ul');
    
    if (!navElements.length) {
      this.log('No navigation menus found');
      return;
    }
    
    // Find the most likely main navigation (the one with the most items)
    let mainNav = null;
    let maxItems = 0;
    
    navElements.forEach(nav => {
      const items = nav.querySelectorAll('a');
      if (items.length > maxItems) {
        maxItems = items.length;
        mainNav = nav;
      }
    });
    
    if (!mainNav) {
      this.log('Could not determine main navigation');
      return;
    }
    
    this.log(`Found main navigation with ${maxItems} items`);
    this.buildHierarchyFromMenu(mainNav);
  }
  
  /**
   * Build hierarchy map from the navigation menu
   * @param {HTMLElement} navElement - The navigation menu element
   */
  buildHierarchyFromMenu(navElement) {
    // Process top level items
    const topLevelItems = navElement.querySelectorAll(':scope > li > a');
    
    topLevelItems.forEach((item, index) => {
      const path = item.getAttribute('href');
      const title = item.textContent.trim();
      
      if (!path) return;
      
      // Add to hierarchy map
      this.hierarchyMap[this.normalizePath(path)] = {
        title,
        path,
        position: index + 1,
        parent: '/',
        isTopLevel: true
      };
      
      // Process child items (dropdowns)
      const parentLi = item.closest('li');
      if (parentLi) {
        const childMenu = parentLi.querySelector('ul');
        if (childMenu) {
          this.processChildMenu(childMenu, path, title, index + 1);
        }
      }
    });
    
    // Add home page
    this.hierarchyMap['/'] = {
      title: 'Home',
      path: '/',
      position: 0,
      isTopLevel: true
    };
    
    this.log('Hierarchy map built:', this.hierarchyMap);
  }
  
  /**
   * Process child menu items recursively
   * @param {HTMLElement} menuElement - The child menu element
   * @param {string} parentPath - The parent item's path
   * @param {string} parentTitle - The parent item's title
   * @param {number} parentPosition - The parent item's position
   * @param {number} level - Current nesting level (for depth tracking)
   */
  processChildMenu(menuElement, parentPath, parentTitle, parentPosition, level = 2) {
    if (level > 5) return; // Limit to 5 levels as advertised
    
    const items = menuElement.querySelectorAll(':scope > li > a');
    
    items.forEach((item, index) => {
      const path = item.getAttribute('href');
      const title = item.textContent.trim();
      
      if (!path) return;
      
      // Add to hierarchy map
      this.hierarchyMap[this.normalizePath(path)] = {
        title,
        path,
        position: index + 1,
        parent: parentPath,
        parentTitle,
        parentPosition,
        level
      };
      
      // Process next level
      const parentLi = item.closest('li');
      if (parentLi) {
        const childMenu = parentLi.querySelector('ul');
        if (childMenu) {
          this.processChildMenu(childMenu, path, title, index + 1, level + 1);
        }
      }
    });
  }
  
  /**
   * Get breadcrumb data for the current page
   * @returns {Array} Array of breadcrumb items
   */
  getBreadcrumbsForCurrentPath() {
    const currentPath = window.location.pathname;
    const normalizedPath = this.normalizePath(currentPath);
    
    // Check if we have this path in our hierarchy
    if (!this.hierarchyMap[normalizedPath]) {
      // Try to find a matching path
      this.log(`Path ${normalizedPath} not found in hierarchy, trying to find a match`);
      this.findMatchingPath(normalizedPath);
    }
    
    if (!this.hierarchyMap[normalizedPath]) {
      this.log(`No matching path found for ${normalizedPath}`);
      return this.buildBasicBreadcrumbs(currentPath);
    }
    
    return this.buildBreadcrumbTrail(normalizedPath);
  }
  
  /**
   * Build complete breadcrumb trail for a path
   * @param {string} path - The path to build breadcrumbs for
   * @returns {Array} Array of breadcrumb items
   */
  buildBreadcrumbTrail(path) {
    const breadcrumbs = [];
    let currentPath = path;
    const visited = new Set();
    
    // Add home page as first item
    breadcrumbs.push({
      title: 'Home',
      path: '/',
      position: 1
    });
    
    // Prevent infinite loops
    let safety = 0;
    const MAX_DEPTH = 5;
    
    while (currentPath && currentPath !== '/' && safety < MAX_DEPTH) {
      if (visited.has(currentPath)) break;
      visited.add(currentPath);
      
      const item = this.hierarchyMap[currentPath];
      if (!item) break;
      
      breadcrumbs.push({
        title: item.title,
        path: item.path,
        position: breadcrumbs.length + 1,
        isCurrent: currentPath === path
      });
      
      currentPath = item.parent;
      safety++;
    }
    
    // Reverse the array to get correct order (Home -> Category -> Subcategory -> etc)
    const orderedBreadcrumbs = [breadcrumbs[0]];
    for (let i = breadcrumbs.length - 1; i > 0; i--) {
      orderedBreadcrumbs.push(breadcrumbs[i]);
    }
    
    return orderedBreadcrumbs;
  }
  
  /**
   * Build basic breadcrumbs for paths not in the menu
   * @param {string} path - The path to build breadcrumbs for
   * @returns {Array} Array of breadcrumb items
   */
  buildBasicBreadcrumbs(path) {
    const pathParts = path.split('/').filter(Boolean);
    const breadcrumbs = [{
      title: 'Home',
      path: '/',
      position: 1
    }];
    
    let currentPath = '';
    pathParts.forEach((part, index) => {
      currentPath += `/${part}`;
      
      let title = part.split('-').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' ');
      
      // Check if this is a product or collection
      if (currentPath.includes('/products/')) {
        title = document.querySelector('h1')?.textContent.trim() || title;
      } else if (currentPath.includes('/collections/')) {
        title = document.querySelector('h1')?.textContent.trim() || title;
      }
      
      breadcrumbs.push({
        title,
        path: currentPath,
        position: index + 2,
        isCurrent: index === pathParts.length - 1
      });
    });
    
    return breadcrumbs;
  }
  
  /**
   * Try to find a matching path in the hierarchy
   * @param {string} path - The path to find a match for
   * @returns {string|null} The matching path or null
   */
  findMatchingPath(path) {
    // Handle product pages
    if (path.includes('/products/')) {
      const productHandle = path.split('/products/')[1].split('/')[0];
      
      // Try to find a collection this product belongs to
      const collectionLinks = document.querySelectorAll('a[href*="/collections/"]');
      if (collectionLinks.length) {
        const collectionPath = collectionLinks[0].getAttribute('href');
        if (collectionPath && this.hierarchyMap[this.normalizePath(collectionPath)]) {
          // Create a virtual path for this product
          const collectionData = this.hierarchyMap[this.normalizePath(collectionPath)];
          this.hierarchyMap[path] = {
            title: document.querySelector('h1')?.textContent.trim() || productHandle,
            path,
            parent: collectionPath,
            parentTitle: collectionData.title,
            parentPosition: collectionData.position,
            level: (collectionData.level || 1) + 1
          };
          return path;
        }
      }
    }
    
    return null;
  }
  
  /**
   * Normalize a path for consistent lookup
   * @param {string} path - The path to normalize
   * @returns {string} The normalized path
   */
  normalizePath(path) {
    // Remove query parameters and hash
    path = path.split('?')[0].split('#')[0];
    
    // Remove trailing slash if not root
    if (path !== '/' && path.endsWith('/')) {
      path = path.slice(0, -1);
    }
    
    // Handle relative paths
    if (!path.startsWith('/') && !path.startsWith('http')) {
      path = `/${path}`;
    }
    
    // For absolute URLs, extract the path
    if (path.startsWith('http')) {
      try {
        const url = new URL(path);
        path = url.pathname;
      } catch (e) {
        this.log('Error parsing URL:', e);
      }
    }
    
    return path;
  }
  
  /**
   * Generate JSON-LD schema for breadcrumbs
   * @param {Array} breadcrumbs - Array of breadcrumb items
   * @returns {Object} JSON-LD schema object
   */
  generateJsonLdSchema(breadcrumbs) {
    return {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": breadcrumbs.map(item => ({
        "@type": "ListItem",
        "position": item.position,
        "name": item.title,
        "item": `${window.location.origin}${item.path}`
      }))
    };
  }
  
  /**
   * Log debug messages
   * @param {...any} args - Arguments to log
   */
  log(...args) {
    if (this.debugMode) {
      console.log('[SmartBreadcrumbs]', ...args);
    }
  }
}

// Create global instance
window.smartBreadcrumbs = window.smartBreadcrumbs || new SmartBreadcrumbsMenuParser();

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.smartBreadcrumbs.init();
}); 