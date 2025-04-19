/**
 * Smart Breadcrumbs Helper v1.0
 * Lightweight detection script for collections context
 */

(function() {
  // Wait for DOM to be ready
  document.addEventListener('DOMContentLoaded', function() {
    // Check if we're on a product page
    const isProductPage = window.location.pathname.includes('/products/');
    
    if (!isProductPage) return;
    
    // Try to find breadcrumb element
    const breadcrumb = document.querySelector('.smart-breadcrumbs');
    if (!breadcrumb) {
      console.warn('Smart Breadcrumbs: Breadcrumb element not found');
      return;
    }
    
    // Check if collection is missing (only home and product)
    const separators = breadcrumb.querySelectorAll('.smart-breadcrumbs__separator');
    if (separators.length < 2) {
      console.log('Smart Breadcrumbs: Collection appears to be missing, attempting to add it');
      
      // Try to get collection from URL
      const path = window.location.pathname;
      let collectionHandle = null;
      
      // Check if URL contains collection info
      if (path.includes('/collections/')) {
        const matches = path.match(/\/collections\/([^\/]+)/);
        if (matches && matches[1]) {
          collectionHandle = matches[1];
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
        collectionLink.className = 'smart-breadcrumbs__link';
        collectionLink.textContent = formattedName;
        
        // Create separator
        const separator = document.createElement('span');
        separator.className = 'smart-breadcrumbs__separator';
        separator.textContent = '/';
        
        // Get home link (first link in breadcrumb)
        const homeLink = breadcrumb.querySelector('.smart-breadcrumbs__link');
        
        // Insert collection after home link
        if (homeLink) {
          homeLink.insertAdjacentElement('afterend', separator);
          separator.insertAdjacentElement('afterend', collectionLink);
          console.log('Smart Breadcrumbs: Successfully added missing collection to breadcrumb');
        }
      }
    }
    
    // Enhance debugger if present
    const debugPanel = document.querySelector('.breadcrumb-debug');
    if (debugPanel) {
      const fixesInfo = document.createElement('div');
      fixesInfo.className = 'breadcrumb-debug-row';
      
      const label = document.createElement('span');
      label.className = 'breadcrumb-debug-label';
      label.textContent = 'JS Helper:';
      
      const value = document.createElement('span');
      value.className = 'breadcrumb-debug-value';
      value.textContent = 'Active - Collection detection enabled';
      
      fixesInfo.appendChild(label);
      fixesInfo.appendChild(value);
      debugPanel.appendChild(fixesInfo);
    }
  });
})(); 