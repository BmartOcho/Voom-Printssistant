# Quick Start Guide: Testing Category Browser

## What Changed?

Your template browser now has **category-based navigation** instead of a long list of templates!

## Visual Preview

### Before:

- Long scrolling list of all templates
- Hard to find specific template types

### After:

- **Step 1**: Choose a category (Travel, Brochures, Yard Signs, etc.)
- **Step 2**: Select a template within that category
- Categories can have images for visual appeal

## How to Test

### 1. Start the Backend

```bash
cd backend
npm run dev
```

### 2. Start the Canva App

```bash
cd printssistant
npm start
```

### 3. Open in Canva

- Go to your Canva Developer Portal
- Open your app in the Canva editor
- Click "Get Started"
- You should see the category selection screen!

## Adding Category Images (Optional)

### Quick Method: Edit templates.json

Open `backend/templates.json` and add `categoryImage` to any template:

```json
{
  "name": "Luggage Tags",
  "category": "Travel",
  "categoryImage": "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=400&h=120&fit=crop",
  "url": "...",
  ...
}
```

**Note**: Only ONE template per category needs the `categoryImage` field. All templates in that category will use the same image.

### Example Image URLs (Free to Use)

You can use these Unsplash URLs for testing:

- **Travel**: `https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=400&h=120&fit=crop`
- **Brochures**: `https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=400&h=120&fit=crop`
- **Yard Signs**: `https://images.unsplash.com/photo-1582407947304-fd86f028f716?w=400&h=120&fit=crop`
- **Name Badges**: `https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=400&h=120&fit=crop`
- **Business**: `https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=400&h=120&fit=crop`

## Example: Updated templates.json

See `backend/templates-example-with-images.json` for a complete example with category images.

## Features

✅ **Automatic Grouping**: Templates are automatically organized by category
✅ **Template Count**: Shows how many templates are in each category
✅ **Optional Images**: Categories work with or without images
✅ **Easy Navigation**: Back button to return to categories
✅ **Keyboard Support**: Navigate with Enter/Space keys
✅ **Responsive**: Adapts to different screen sizes

## Troubleshooting

### Categories not showing?

- Make sure templates have a `category` field
- Check that the backend is running
- Verify templates.json has valid JSON

### Images not loading?

- Ensure `categoryImage` URLs are accessible
- Use HTTPS URLs (not HTTP)
- Check browser console for CORS errors
- Try using Unsplash URLs as shown above

### Templates not appearing in category?

- Verify the template's `category` field matches exactly
- Category names are case-sensitive

## Next Steps

1. **Test the basic functionality** without images first
2. **Add category images** to make it more visual
3. **Organize your templates** by creating meaningful categories
4. **Share with users** and get feedback!

## Need Help?

Check these files for more details:

- `CATEGORY_IMAGES_GUIDE.md` - Complete guide on category images
- `CATEGORY_BROWSER_IMPLEMENTATION.md` - Technical implementation details
