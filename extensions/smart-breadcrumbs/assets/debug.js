// Smart Breadcrumbs Debug v1.0
console.log('✅ Smart Breadcrumbs debug.js loaded successfully');

document.addEventListener('DOMContentLoaded', function() {
  console.log('🔍 Smart Breadcrumbs DOM loaded');
  
  // Check if our breadcrumb element exists
  const breadcrumb = document.querySelector('.smart-breadcrumb-container');
  console.log('🍞 Breadcrumb container found:', !!breadcrumb);
  if (breadcrumb) {
    console.log('📏 Breadcrumb dimensions:', {
      width: breadcrumb.offsetWidth,
      height: breadcrumb.offsetHeight,
      visible: breadcrumb.offsetParent !== null
    });
    console.log('🔧 Breadcrumb HTML:', breadcrumb.outerHTML);
  }
  
  // Log page variables
  console.log('📄 Page template:', Shopify?.template || 'Unknown');
  console.log('🔗 Page URL:', window.location.href);
  
  // Create visual debug overlay
  const debugButton = document.createElement('button');
  debugButton.textContent = '🐞 Debug Breadcrumbs';
  debugButton.style.position = 'fixed';
  debugButton.style.bottom = '10px';
  debugButton.style.right = '10px';
  debugButton.style.zIndex = '9999';
  debugButton.style.padding = '5px 10px';
  debugButton.style.background = '#ff5500';
  debugButton.style.color = 'white';
  debugButton.style.border = 'none';
  debugButton.style.borderRadius = '4px';
  debugButton.style.cursor = 'pointer';
  
  debugButton.addEventListener('click', function() {
    alert(
      'Smart Breadcrumbs Debug Info:\n' +
      '- App Block Version: 2.1.0\n' +
      '- Breadcrumb Found: ' + !!breadcrumb + '\n' +
      '- Page Template: ' + (Shopify?.template || 'Unknown') + '\n' +
      '- Current Path: ' + window.location.pathname + '\n' +
      (breadcrumb ? '- Breadcrumb Visible: ' + (breadcrumb.offsetParent !== null) : '')
    );
  });
  
  document.body.appendChild(debugButton);
}); 