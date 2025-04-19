// SmartBreadcrumbs - Direct Implementation
// Version 3.3.0 - JS-free approach

document.addEventListener('DOMContentLoaded', () => {
  console.log('Smart Breadcrumbs: Using direct implementation');
  
  // Log breadcrumb state for debugging
  const breadcrumbElement = document.querySelector('[data-breadcrumb-component]');
  if (breadcrumbElement) {
    console.log('Breadcrumb element found:', breadcrumbElement);
    
    // Make breadcrumbs more visible for debugging
    breadcrumbElement.style.border = '2px solid blue';
    breadcrumbElement.style.padding = '10px';
    breadcrumbElement.style.background = '#f0f8ff';
    breadcrumbElement.style.display = 'block';
    breadcrumbElement.style.margin = '10px 0';
  } else {
    console.error('Breadcrumb element not found in DOM. The snippet may not be included in the theme.');
    
    // Create a visual indicator that the breadcrumb element is missing
    const header = document.querySelector('header');
    if (header) {
      const missingAlert = document.createElement('div');
      missingAlert.innerHTML = `
        <div style="background: #ffe0e0; color: #d00; padding: 10px; margin: 10px 0; border: 1px solid #d00; text-align: center;">
          Breadcrumb component not found. Make sure to include the snippet in your theme.
        </div>
      `;
      header.parentNode.insertBefore(missingAlert, header.nextSibling);
    }
  }
});

// Diagnostic logging for page information
console.log('Page path:', window.location.pathname);
console.log('Page template:', document.documentElement.getAttribute('data-template'));

// No class implementation - using pure HTML approach 