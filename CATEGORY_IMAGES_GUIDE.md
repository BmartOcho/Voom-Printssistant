# Adding Category Images to Templates

## Overview

The Template Browser now supports category-based navigation with optional images for each category. This makes it easier for users to browse templates by organizing them into visual categories.

## How It Works

### Category Organization

- Templates are automatically grouped by their `category` field
- Each category shows:
  - An optional image (if provided)
  - The category name
  - The number of templates in that category

### Adding Category Images

To add an image to a category, include the `categoryImage` field when creating or updating a template:

```json
{
  "name": "Luggage Tags",
  "url": "https://www.canva.com/design/...",
  "category": "Travel",
  "categoryImage": "https://example.com/images/travel-category.jpg"
}
```

**Important Notes:**

- The `categoryImage` field is optional
- If multiple templates share the same category, only one needs to have the `categoryImage` set
- The first template with a `categoryImage` in each category will be used
- Images should be hosted externally (e.g., on a CDN or image hosting service)
- Recommended image dimensions: 400x120px (or similar aspect ratio)

### Example: Adding a Category Image via API

Using the template creation endpoint:

```bash
curl -X POST http://localhost:8787/api/canva-templates \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Business Card",
    "url": "https://www.canva.com/design/...",
    "category": "Business",
    "categoryImage": "https://example.com/images/business-category.jpg"
  }'
```

### Updating Existing Templates

You can update existing templates to add category images:

```bash
curl -X PUT http://localhost:8787/api/canva-templates/{template-id} \
  -H "Content-Type: application/json" \
  -d '{
    "categoryImage": "https://example.com/images/category.jpg"
  }'
```

## User Experience

1. **Category Selection**: Users first see a list of categories with images
2. **Template Selection**: Clicking a category shows all templates within that category
3. **Navigation**: Users can go back to categories or exit the browser

## Image Recommendations

- **Format**: JPG or PNG
- **Size**: Keep under 200KB for fast loading
- **Dimensions**: 400x120px or similar 10:3 aspect ratio
- **Content**: Use representative images that clearly indicate the category purpose
- **Hosting**: Use a reliable CDN or image hosting service

## Example Categories with Images

```json
[
  {
    "name": "Travel Luggage Tag",
    "category": "Travel",
    "categoryImage": "https://images.unsplash.com/photo-1488646953014-85cb44e25828",
    "url": "..."
  },
  {
    "name": "Business Card - Standard",
    "category": "Business Cards",
    "categoryImage": "https://images.unsplash.com/photo-1589829545856-d10d557cf95f",
    "url": "..."
  }
]
```

## Fallback Behavior

If no `categoryImage` is provided:

- The category button will still display
- Only the category name and template count will be shown
- The layout will automatically adjust to not show an image section
