/**
 * Smart Breadcrumbs - Settings Manager
 * Handles customization options for breadcrumbs
 * v1.0.0
 */

class SmartBreadcrumbsSettings {
  constructor() {
    this.defaultSettings = {
      showBreadcrumbs: true,
      useSlider: false,
      fontFamily: '',
      fontSize: '14',
      textColor: '#555555',
      hoverColor: '#000000',
      separatorColor: '#999999',
      currentColor: '#333333',
      backgroundColor: 'rgba(240, 240, 240, 0.5)',
      homeText: 'Home',
      alignment: 'left',
      marginTop: '10',
      marginRight: '0',
      marginBottom: '10',
      marginLeft: '0',
      useUppercase: false,
      customCSS: '',
      lastItemCSS: 'font-weight: 500;',
      hoverCSS: 'text-decoration: underline;',
      maxLevels: 5
    };
    
    this.settings = Object.assign({}, this.defaultSettings);
    this.debugMode = window.location.search.includes('debug=true');
    this.applyFromMetafields();
  }
  
  /**
   * Apply settings from metafields
   */
  applyFromMetafields() {
    try {
      // Look for settings in a meta tag
      const metaTag = document.querySelector('meta[name="breadcrumb-settings"]');
      if (metaTag && metaTag.content) {
        const metaSettings = JSON.parse(decodeURIComponent(metaTag.content));
        this.settings = Object.assign({}, this.defaultSettings, metaSettings);
        this.log('Applied settings from metafields:', this.settings);
      } else {
        this.log('No metafield settings found, using defaults');
      }
    } catch (e) {
      this.log('Error applying settings from metafields:', e);
    }
  }
  
  /**
   * Generate CSS style rules based on settings
   * @returns {string} CSS style rules
   */
  generateCSS() {
    const { 
      fontSize, textColor, hoverColor, separatorColor, currentColor, backgroundColor,
      fontFamily, alignment, marginTop, marginRight, marginBottom, marginLeft,
      customCSS, lastItemCSS, hoverCSS, useUppercase
    } = this.settings;
    
    let css = `
      .smart-breadcrumbs-container {
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        font-size: ${fontSize}px;
        line-height: 1.4;
        margin: ${marginTop}px ${marginRight}px ${marginBottom}px ${marginLeft}px;
        padding: 8px 12px;
        background-color: ${backgroundColor};
        border-radius: 4px;
        text-align: ${alignment};
        ${fontFamily ? `font-family: ${fontFamily};` : ''}
        ${useUppercase ? 'text-transform: uppercase;' : ''}
      }
      
      .smart-breadcrumbs-list {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        padding: 0;
        margin: 0;
        list-style: none;
        ${alignment === 'center' ? 'justify-content: center;' : ''}
        ${alignment === 'right' ? 'justify-content: flex-end;' : ''}
      }
      
      .smart-breadcrumbs-item {
        display: inline-flex;
        align-items: center;
      }
      
      .smart-breadcrumbs-link {
        color: ${textColor};
        text-decoration: none;
        transition: color 0.2s ease;
      }
      
      .smart-breadcrumbs-link:hover {
        color: ${hoverColor};
        ${hoverCSS}
      }
      
      .smart-breadcrumbs-separator {
        margin: 0 8px;
        color: ${separatorColor};
      }
      
      .smart-breadcrumbs-current {
        color: ${currentColor};
        ${lastItemCSS}
      }
      
      @media (max-width: 480px) {
        .smart-breadcrumbs-container {
          font-size: ${Math.max(parseInt(fontSize) - 2, 10)}px;
          padding: 6px 10px;
          ${this.settings.useSlider ? `
            overflow-x: auto;
            white-space: nowrap;
            -webkit-overflow-scrolling: touch;
            scrollbar-width: none;
          ` : ''}
        }
        
        ${this.settings.useSlider ? `
          .smart-breadcrumbs-container::-webkit-scrollbar {
            display: none;
          }
        ` : ''}
        
        .smart-breadcrumbs-separator {
          margin: 0 6px;
        }
      }
      
      ${customCSS}
    `;
    
    return css;
  }
  
  /**
   * Apply CSS styles to the page
   */
  applyStyles() {
    // Create or update style element
    let styleElement = document.getElementById('smart-breadcrumbs-styles');
    if (!styleElement) {
      styleElement = document.createElement('style');
      styleElement.id = 'smart-breadcrumbs-styles';
      document.head.appendChild(styleElement);
    }
    
    styleElement.textContent = this.generateCSS();
    this.log('Applied breadcrumb styles');
  }
  
  /**
   * Log debug messages
   * @param {...any} args - Arguments to log
   */
  log(...args) {
    if (this.debugMode) {
      console.log('[SmartBreadcrumbsSettings]', ...args);
    }
  }
}

// Create global instance
window.smartBreadcrumbsSettings = window.smartBreadcrumbsSettings || new SmartBreadcrumbsSettings(); 