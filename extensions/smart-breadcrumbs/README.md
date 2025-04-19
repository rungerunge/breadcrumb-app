# Smart Breadcrumbs

Smart Breadcrumbs is a powerful, easy-to-use breadcrumb navigation system for Shopify themes that uses your site's menu structure to create SEO-friendly breadcrumbs.

## Features

- **Menu-Based Navigation**: Automatically generates breadcrumbs based on your site's menu structure
- **SEO Optimization**: Includes proper JSON-LD structured data for better search visibility
- **Mobile-Friendly**: Option for horizontal scrolling on mobile devices instead of wrapping
- **Multiple Levels**: Supports up to 5 levels of breadcrumb depth
- **Fully Customizable**: Extensive styling options including colors, fonts, spacing, and more
- **No Manual Setup**: Works automatically with your existing menu structure
- **Debugging Tools**: Built-in debug mode to help troubleshoot issues

## Installation

### Option 1: Use the Block

The easiest way to use Smart Breadcrumbs is by adding the block to your theme:

1. In your Shopify admin, go to **Online Store > Themes**
2. Click **Customize** on your active theme
3. On the page editor, click **Add Section**
4. Select **Smart Breadcrumbs** from the list
5. Customize the appearance using the settings panel

### Option 2: Add the Snippet

For more control over placement, you can add the snippet directly to your theme:

1. Edit the theme file where you want breadcrumbs to appear
2. Add the following code where you want breadcrumbs to show:
   ```liquid
   {% render 'smart-breadcrumbs' %}
   ```

## Configuration

Smart Breadcrumbs offers extensive customization through the theme settings:

1. In your Shopify admin, go to **Online Store > Themes**
2. Click **Customize** on your active theme
3. Click on **Theme Settings**
4. Find the **Breadcrumb Settings** section

### Main Settings

- **Use menu-based breadcrumbs**: Enables the advanced menu-based breadcrumb generation
- **Show breadcrumbs**: Toggle breadcrumbs on/off
- **Use slider for mobile**: Enable horizontal scrolling on mobile devices

### Appearance Settings

- **Background color**: Set the background color of the breadcrumb container
- **Alignment**: Choose between left, center, or right alignment
- **Font size**: Adjust the text size
- **Font family**: Set a custom font family (leave blank to use theme default)
- **Home text**: Customize the text for the Home link

### Color Settings

- **Text color**: Set the color for breadcrumb links
- **Hover color**: Set the color for links on hover
- **Separator color**: Set the color for the separator between items
- **Current item color**: Set the color for the current/active page

### Advanced Settings

- **Use uppercase text**: Convert all breadcrumb text to uppercase
- **Custom CSS**: Add custom CSS for advanced styling
- **Last item CSS**: Add custom CSS for the current/last breadcrumb item
- **Hover CSS**: Add custom CSS for link hover state

## Setting Up Collection Hierarchy

For product pages, Smart Breadcrumbs will automatically use the product's collection. To create parent-child relationships between collections:

1. Go to **Navigation** in your Shopify admin
2. Create a menu with a hierarchy that matches your desired breadcrumb structure
3. Make sure your products are assigned to the correct collections

## Troubleshooting

If your breadcrumbs aren't appearing correctly:

1. Enable debug mode by adding `?debug=true` to the end of your page URL
2. Check that your menu structure is set up correctly
3. Verify that the Smart Breadcrumbs block or snippet is properly added to your theme
4. Make sure breadcrumbs are enabled in the settings

## Support

For help with Smart Breadcrumbs, please contact support@example.com. 