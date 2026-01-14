# Admin Template Manager - Edit Functionality

## Overview

The admin template manager now supports **editing templates** after they've been saved! You can update template names, URLs, categories, and category images without having to delete and recreate templates.

## How to Access

Navigate to: `http://localhost:8787/admin/templates`

## Features

### ✅ What You Can Edit

- **Template Name**: Change the display name
- **Canva URL**: Update the template link
- **Category**: Move template to a different category
- **Category Image URL**: Add or update the category banner image

### 🎨 New UI Elements

1. **Edit Button**: Each template now has a yellow "✏️ Edit" button
2. **Edit Form**: Clicking edit shows a pre-populated form with current values
3. **Category Image Indicator**: Templates with category images show a "📷 Has category image" badge
4. **Cancel Button**: Easily cancel editing and return to the add form

## Usage Instructions

### Editing a Template

1. **Open Admin Page**: Go to `http://localhost:8787/admin/templates`
2. **Find Template**: Scroll to the template you want to edit
3. **Click Edit**: Click the "✏️ Edit" button
4. **Update Fields**: Modify any fields you want to change
5. **Enter Admin Token**: Provide your admin token
6. **Save**: Click "💾 Save Changes"

### Adding Category Images

When editing a template, you can add a category image URL:

```
Category Image URL: https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=400&h=120&fit=crop
```

**Note**: Only one template per category needs a category image. All templates in that category will share the same image.

### Canceling an Edit

- Click the "Cancel" button to return to the add form
- Your changes won't be saved

## API Endpoints

### Update Template

```http
PUT /api/admin/canva-templates/:id
Headers:
  Content-Type: application/json
  X-Admin-Token: your-admin-token

Body:
{
  "name": "Updated Name",
  "url": "https://www.canva.com/design/...",
  "category": "Updated Category",
  "categoryImage": "https://example.com/image.jpg" // optional
}
```

### Example with curl

```bash
curl -X PUT http://localhost:8787/api/admin/canva-templates/1768333031594 \
  -H "Content-Type: application/json" \
  -H "X-Admin-Token: secret123" \
  -d '{
    "name": "Updated Brochure",
    "url": "https://www.canva.com/design/...",
    "category": "Marketing",
    "categoryImage": "https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=400&h=120&fit=crop"
  }'
```

## Visual Changes

### Before

- Only "🗑️" delete button
- No way to edit without deleting

### After

- "✏️ Edit" button (yellow/orange)
- "🗑️ Delete" button (red)
- Buttons grouped together
- Category image indicator

## Workflow Example

### Scenario: Adding a Category Image to Existing Templates

1. **Edit First Template in Category**:
   - Click "✏️ Edit" on "Luggage Tags"
   - Add category image URL: `https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=400&h=120&fit=crop`
   - Save changes

2. **Result**:
   - "Travel" category now has an image
   - All "Travel" templates benefit from this image
   - Template shows "📷 Has category image" badge

3. **Optional**: Edit other templates in the same category to add the same image URL for consistency (though not required)

## Security

- All edit operations require admin token authentication
- Same security as create and delete operations
- Token is validated on the server side

## Error Handling

### Common Errors

**"Template not found"**

- The template ID doesn't exist
- Check that the template hasn't been deleted

**"Unauthorized"**

- Invalid admin token
- Check your `.env` file for the correct `ADMIN_TOKEN`

**"Failed: Missing required fields"**

- Name, URL, or Category is empty
- All three fields are required

## Tips

✅ **Best Practice**: Add category images to one template per category
✅ **Image URLs**: Use reliable CDN or image hosting (Unsplash, Cloudinary, etc.)
✅ **Dimensions**: 400x120px or similar 10:3 aspect ratio works best
✅ **Testing**: Edit a template and verify changes appear in the Canva app

## Troubleshooting

### Edit form doesn't appear

- Check browser console for JavaScript errors
- Refresh the page and try again

### Changes don't save

- Verify admin token is correct
- Check backend logs for errors
- Ensure all required fields are filled

### Category image doesn't show in app

- Verify the image URL is accessible
- Check that it's a valid image format (JPG, PNG)
- Ensure the URL uses HTTPS

## Next Steps

After editing templates:

1. Refresh your Canva app to see changes
2. Verify category images appear correctly
3. Test template selection to ensure URLs work

---

**Need Help?** Check the backend logs at the terminal where you ran `npm run dev`
