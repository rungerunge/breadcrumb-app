# Smart Breadcrumbs for Shopify

A powerful and flexible breadcrumb navigation app for Shopify themes that automatically generates breadcrumbs based on your store's navigation structure.

## Features

- 🎯 Dynamic breadcrumb generation based on navigation menus
- 📱 Mobile-friendly with optional horizontal slider
- 🎨 Extensive customization options
- 🔄 Global settings override capability
- 🎯 Automatic fallback to default hierarchy
- 💅 Custom CSS support for all viewports
- 📚 Comprehensive documentation and support

## Installation

1. Install the app from the Shopify App Store
2. Add the breadcrumb block to your product and collection templates:
   ```liquid
   {% render 'smart-breadcrumbs' %}
   ```
3. Configure your settings in the app admin

## Configuration

### Theme Editor Settings

- Font Size
- Margin Top & Bottom
- Breadcrumb Separator
- Mobile Slider Toggle
- Custom CSS fields for different states and viewports

### Global Settings

Access the app admin to configure global settings that can override individual block settings:

1. Navigate to Apps > Smart Breadcrumbs
2. Configure your preferred settings
3. Enable "Global Override" to apply settings across all instances

### Menu Configuration

The app uses your store's navigation menus to generate breadcrumbs. To specify which menus to use:

1. Go to the app settings
2. Enter menu handles in the "Menu Handles" field
3. Separate multiple handles with commas
4. Use * as a wildcard to include all menus

Example: `main-menu, footer, collection-menu`

## Customization

### Custom CSS

You can add custom CSS for different scenarios:

- Desktop/Tablet specific styles
- Mobile specific styles
- All breadcrumbs styles
- Last breadcrumb styles
- Hover state styles

Example:
```css
/* Desktop styles */
.breadcrumb-item {
  font-weight: 500;
  color: #333;
}

/* Mobile styles */
@media screen and (max-width: 768px) {
  .breadcrumb-item {
    font-size: 14px;
  }
}
```

## Support

- 📧 Email: support@smartbreadcrumbs.com
- 📚 Documentation: [docs.smartbreadcrumbs.com](https://docs.smartbreadcrumbs.com)
- 📹 Tutorial Video: [Watch on YouTube](https://youtube.com/watch?v=your-tutorial-video-id)

## FAQ

### How are breadcrumbs generated?

The app looks for the current page in your specified navigation menus and builds the breadcrumb path based on the menu structure. If no matching path is found, it falls back to the default hierarchy: Home > Collection > Product.

### Can I customize the appearance?

Yes! You can customize:
- Font size
- Margins
- Separator
- Colors and styles through custom CSS
- Mobile layout
- And more through the app settings

### How do I update the breadcrumb structure?

Simply update your navigation menus in Shopify admin, and the breadcrumbs will automatically reflect the changes.

## Development

### Local Development

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up your .env file:
   ```
   SHOPIFY_API_KEY=your_api_key
   SHOPIFY_API_SECRET=your_api_secret
   HOST=your_host
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```

### Building for Production

```bash
npm run build
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contributing

We welcome contributions! Please read our [Contributing Guide](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests. 