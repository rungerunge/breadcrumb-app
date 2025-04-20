# Smart Breadcrumbs Installation Guide

There are three ways to add breadcrumbs to your Shopify store. Choose the method that works best for you.

## Option 1: App Block (Recommended)

The app block method lets you add breadcrumbs through the theme customizer.

1. Go to your Shopify admin
2. Navigate to **Online Store > Themes**
3. Click **Customize** on your active theme
4. Click **Add section**
5. Select **Simple Breadcrumbs** (or Smart Breadcrumbs) from the list
6. Position it where you want the breadcrumbs to appear
7. Use the section settings to customize colors

## Option 2: Direct Theme Edit

For advanced users who prefer direct theme editing:

1. Go to your Shopify admin
2. Navigate to **Online Store > Themes**
3. Click **Actions > Edit code** on your active theme
4. Find your `theme.liquid` file 
5. Add this line just inside your main content area:

```liquid
{% render 'direct-breadcrumbs' %}
```

6. Save the file

## Option 3: Manual Installation

You can also manually add the breadcrumb code to specific template files:

1. Go to **Online Store > Themes > Edit code**
2. Open the template file where you want breadcrumbs (e.g., `product.liquid`, `collection.liquid`)
3. Add this code where you want the breadcrumbs to appear:

```liquid
<div class="direct-breadcrumbs" style="width:100%;padding:10px 0;margin-bottom:20px;background-color:#f6f6f6;">
  <div style="max-width:1200px;margin:0 auto;padding:0 15px;display:flex;flex-wrap:wrap;align-items:center;">
    <a href="/" style="color:#0066cc;text-decoration:none;font-size:14px;">Home</a>
    
    {% if template contains 'product' %}
      <span style="margin:0 8px;color:#999;font-size:14px;">/</span>
      {% if collection %}
        <a href="{{ collection.url }}" style="color:#0066cc;text-decoration:none;font-size:14px;">{{ collection.title }}</a>
      {% elsif product.collections.size > 0 %}
        {% for collection in product.collections limit:1 %}
          {% if collection.handle != 'all' %}
            <a href="{{ collection.url }}" style="color:#0066cc;text-decoration:none;font-size:14px;">{{ collection.title }}</a>
          {% endif %}
        {% endfor %}
      {% endif %}
      <span style="margin:0 8px;color:#999;font-size:14px;">/</span>
      <span style="color:#333;font-size:14px;font-weight:500;">{{ product.title }}</span>
    {% elsif template contains 'collection' %}
      <span style="margin:0 8px;color:#999;font-size:14px;">/</span>
      <span style="color:#333;font-size:14px;font-weight:500;">{{ collection.title }}</span>
    {% else %}
      <span style="margin:0 8px;color:#999;font-size:14px;">/</span>
      <span style="color:#333;font-size:14px;font-weight:500;">{{ page_title }}</span>
    {% endif %}
  </div>
</div>
```

## Troubleshooting

If breadcrumbs aren't displaying correctly:

1. **Add Debug Mode**: Add `?debug_breadcrumbs=true` to your URL to see debug information
2. **Check Console**: Look for any JavaScript errors in the browser console
3. **Theme Compatibility**: Some themes may require additional styling adjustments
4. **Clear Cache**: Try clearing your browser cache and Shopify theme cache
5. **Asset Files**: Make sure all required assets are properly loaded

Need more help? Check the complete documentation or contact support.

## Advanced Debug Mode

To activate advanced debugging:
1. Add `?debug_breadcrumbs=true` to any URL
2. Look for the debug panel at bottom of the breadcrumbs
3. Click the "🐞 Debug Breadcrumbs" button in the bottom right corner 