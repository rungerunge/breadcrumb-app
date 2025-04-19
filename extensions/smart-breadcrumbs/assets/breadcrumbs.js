class SmartBreadcrumbs {
  constructor() {
    this.init();
  }

  init() {
    this.container = document.querySelector('.smart-breadcrumbs');
    if (!this.container) return;

    this.settings = this.getSettings();
    this.currentPath = window.location.pathname;
    this.menuHandles = this.settings.menu_handles.split(',').map(h => h.trim());

    this.buildBreadcrumbs();
  }

  getSettings() {
    const container = this.container;
    return {
      mobile_slider: container.dataset.mobileSlider === 'true',
      menu_handles: container.dataset.menuHandles || 'main-menu',
      separator: container.querySelector('.breadcrumb-separator')?.textContent || '›'
    };
  }

  async buildBreadcrumbs() {
    try {
      const menuData = await this.fetchMenus();
      const breadcrumbPath = this.findBreadcrumbPath(menuData);
      
      if (breadcrumbPath.length > 0) {
        this.renderBreadcrumbs(breadcrumbPath);
      } else {
        this.renderDefaultBreadcrumbs();
      }
    } catch (error) {
      console.error('Error building breadcrumbs:', error);
      this.renderDefaultBreadcrumbs();
    }
  }

  async fetchMenus() {
    const menuData = {};
    
    for (const handle of this.menuHandles) {
      if (handle === '*') {
        // Fetch all available menus
        const response = await fetch('/menus.json');
        const data = await response.json();
        Object.assign(menuData, data.menus);
      } else {
        // Fetch specific menu
        const response = await fetch(`/menus/${handle}.json`);
        const data = await response.json();
        menuData[handle] = data.menu;
      }
    }
    
    return menuData;
  }

  findBreadcrumbPath(menuData) {
    let bestPath = [];
    
    for (const menu of Object.values(menuData)) {
      const path = this.findPathInMenu(menu.items, this.currentPath);
      if (path.length > bestPath.length) {
        bestPath = path;
      }
    }
    
    return bestPath;
  }

  findPathInMenu(items, targetPath, currentPath = []) {
    for (const item of items) {
      const newPath = [...currentPath, item];
      
      if (item.url === targetPath) {
        return newPath;
      }
      
      if (item.items?.length > 0) {
        const foundPath = this.findPathInMenu(item.items, targetPath, newPath);
        if (foundPath.length > 0) {
          return foundPath;
        }
      }
    }
    
    return [];
  }

  renderBreadcrumbs(path) {
    const list = this.container.querySelector('.breadcrumb-list');
    list.innerHTML = '';

    // Add home link
    list.appendChild(this.createBreadcrumbItem('Home', '/'));

    // Add path items
    path.forEach((item, index) => {
      list.appendChild(this.createSeparator());
      list.appendChild(
        this.createBreadcrumbItem(
          item.title,
          item.url,
          index === path.length - 1
        )
      );
    });
  }

  renderDefaultBreadcrumbs() {
    const list = this.container.querySelector('.breadcrumb-list');
    list.innerHTML = '';

    // Add home link
    list.appendChild(this.createBreadcrumbItem('Home', '/'));

    // Add collection if present
    const collectionElement = document.querySelector('meta[property="og:type"][content="collection"]');
    if (collectionElement) {
      const collectionTitle = document.querySelector('h1')?.textContent;
      const collectionUrl = window.location.pathname;
      
      list.appendChild(this.createSeparator());
      list.appendChild(
        this.createBreadcrumbItem(collectionTitle, collectionUrl)
      );
    }

    // Add product if present
    const productElement = document.querySelector('meta[property="og:type"][content="product"]');
    if (productElement) {
      const productTitle = document.querySelector('h1')?.textContent;
      
      list.appendChild(this.createSeparator());
      list.appendChild(
        this.createBreadcrumbItem(productTitle, null, true)
      );
    }
  }

  createBreadcrumbItem(text, url, isCurrent = false) {
    const li = document.createElement('li');
    li.className = 'breadcrumb-item' + (isCurrent ? ' current' : '');

    if (isCurrent || !url) {
      const span = document.createElement('span');
      span.textContent = text;
      li.appendChild(span);
    } else {
      const a = document.createElement('a');
      a.href = url;
      a.title = text;
      a.textContent = text;
      li.appendChild(a);
    }

    return li;
  }

  createSeparator() {
    const li = document.createElement('li');
    li.className = 'breadcrumb-separator';
    li.textContent = this.settings.separator;
    return li;
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new SmartBreadcrumbs();
});

// Re-initialize on Shopify section load
document.addEventListener('shopify:section:load', () => {
  new SmartBreadcrumbs();
}); 