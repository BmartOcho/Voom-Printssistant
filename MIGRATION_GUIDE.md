# Migration Guide: From Mock Data to Live Canva API

This guide helps you migrate from the file-based template system (`templates.json`) to the live Canva Connect API.

## Why Migrate?

### Benefits of Live API

- ✅ **Real-time data** - Templates always up-to-date
- ✅ **No manual updates** - Changes in Canva reflect immediately
- ✅ **Better organization** - Use Canva's folder system
- ✅ **Automatic thumbnails** - Canva provides template previews
- ✅ **Template copying** - Create new designs via API
- ✅ **Secure** - OAuth 2.0 with token encryption

### Old System Limitations

- ❌ Manual updates required
- ❌ Stale data
- ❌ No automatic thumbnails
- ❌ Limited to URL opening (no copying)
- ❌ Requires admin UI for management

## Migration Overview

```
┌─────────────────────┐
│   Old System        │
│  (templates.json)   │
└──────────┬──────────┘
           │
           │ Migration
           │
┌──────────▼──────────┐
│   New System        │
│  (Canva API)        │
└─────────────────────┘
```

**Estimated Time:** 30 minutes  
**Difficulty:** Easy  
**Downtime:** None (backward compatible)

---

## Step 1: Understand What's Changing

### Before (Old System)

**Data Source:**

- `backend/templates.json` file
- Manually managed via `/admin/templates` UI

**Endpoints:**

- `GET /api/canva-templates` - List all templates
- `GET /api/canva-templates/categories` - List categories

**Frontend:**

- Categories based on `category` field
- Templates grouped by category
- Opens template URL directly

### After (New System)

**Data Source:**

- Live Canva API
- Organized by Canva folders

**Endpoints:**

- `GET /api/folders` - List Canva folders
- `GET /api/folders/:folderId/templates` - List templates in folder
- `POST /api/templates/:templateId/copy` - Copy template

**Frontend:**

- Folders from Canva
- Templates within folders
- Copies template via API, opens new design

---

## Step 2: Set Up OAuth (One-Time)

### 2.1 Get Canva Credentials

1. Go to [Canva Developer Portal](https://www.canva.com/developers/apps)
2. Sign in with your Canva account
3. Create or select your app
4. Note **Client ID** and **Client Secret**

### 2.2 Configure Redirect URI

In Canva Developer Portal:

- Add redirect URI: `http://localhost:8787/auth/callback`
- For production: `https://yourdomain.com/auth/callback`

### 2.3 Update Environment Variables

Edit `backend/.env`:

```bash
CANVA_CLIENT_ID=your_client_id_here
CANVA_CLIENT_SECRET=your_client_secret_here
CANVA_REDIRECT_URI=http://localhost:8787/auth/callback
```

### 2.4 Complete OAuth Flow

1. Start backend: `npm run dev -w backend`
2. Navigate to: `http://localhost:8787/auth/canva`
3. Authorize the app
4. Verify: `http://localhost:8787/auth/status`

**Expected Response:**

```json
{
  "authenticated": true,
  "userId": "...",
  "expiresAt": 1234567890,
  "isExpired": false
}
```

---

## Step 3: Migrate Your Templates

### 3.1 Map Old Categories to New Folders

**Old Structure (templates.json):**

```json
[
  {
    "name": "Luggage Tags",
    "category": "Travel",
    "url": "https://www.canva.com/design/..."
  },
  {
    "name": "Business Card",
    "category": "Business",
    "url": "https://www.canva.com/design/..."
  }
]
```

**New Structure (Canva Folders):**

```
📁 Travel
  └── 📄 Luggage Tags

📁 Business
  └── 📄 Business Card
```

### 3.2 Create Folders in Canva

1. Open Canva
2. Go to "Your projects"
3. Create folders matching your old categories:
   - Travel
   - Business
   - Marketing
   - etc.

### 3.3 Move Templates to Folders

For each template in `templates.json`:

1. Open the template URL in Canva
2. Click "Move to folder"
3. Select the appropriate folder
4. Repeat for all templates

### 3.4 Share Templates Publicly

**Important:** Templates must be shared publicly to appear in the app.

For each template:

1. Open in Canva
2. Click "Share" button
3. Select "Anyone with the link"
4. Set permission to "Can view"
5. Save

---

## Step 4: Test the New System

### 4.1 Test API Endpoints

```bash
# List folders
curl http://localhost:8787/api/folders

# List templates in a folder
curl http://localhost:8787/api/folders/FOLDER_ID/templates

# Copy a template
curl -X POST http://localhost:8787/api/templates/TEMPLATE_ID/copy \
  -H "Content-Type: application/json"
```

### 4.2 Test Frontend

1. Start frontend: `npm start -w printssistant`
2. Open app in Canva
3. Navigate to Template Browser
4. Verify folders appear
5. Select a folder
6. Verify templates appear
7. Copy a template
8. Verify new design opens

---

## Step 5: Verify Migration

### Checklist

- [ ] OAuth authentication complete
- [ ] All folders created in Canva
- [ ] All templates moved to folders
- [ ] All templates shared publicly
- [ ] API endpoints return data
- [ ] Frontend shows folders
- [ ] Frontend shows templates
- [ ] Template copying works
- [ ] New designs open correctly

### Comparison Test

**Old System:**

```bash
curl http://localhost:8787/api/canva-templates
```

**New System:**

```bash
curl http://localhost:8787/api/folders
```

Both should return similar data (folders/categories and templates).

---

## Step 6: Clean Up (Optional)

### After Successful Migration

Once you've verified everything works:

1. **Backup old data:**

   ```bash
   cp backend/templates.json backend/templates.json.backup
   ```

2. **Remove old file (optional):**

   ```bash
   # Only if you're confident everything works
   rm backend/templates.json
   ```

3. **Update admin UI (optional):**
   - Add migration notice to `/admin/templates`
   - Redirect to new folder management

### Keep for Backward Compatibility

You can keep the old system running alongside the new one:

- `templates.json` still works
- Admin UI still functional
- No breaking changes

---

## Troubleshooting Migration

### Issue: "No folders found"

**Cause:** No folders in Canva or OAuth not complete

**Solution:**

1. Verify OAuth: `http://localhost:8787/auth/status`
2. Create folders in Canva
3. Refresh API call

### Issue: "No templates found"

**Cause:** Templates not in folder or not shared publicly

**Solution:**

1. Move templates to folders in Canva
2. Share templates with "Anyone with the link"
3. Refresh API call

### Issue: "Template copy fails"

**Cause:** Missing OAuth scopes or permissions

**Solution:**

1. Re-authenticate at `/auth/canva`
2. Verify scopes include `design:write`
3. Check template permissions

### Issue: "Old categories don't match new folders"

**Cause:** Different naming between old categories and new folders

**Solution:**

1. Rename folders in Canva to match old categories
2. Or update frontend to use new folder names
3. Or create a mapping in backend

---

## Rollback Plan

If you need to revert to the old system:

### 1. Restore Old Frontend

```bash
cd printssistant/src/components
git checkout HEAD~1 TemplateBrowser.tsx
```

### 2. Restore templates.json

```bash
cd backend
cp templates.json.backup templates.json
```

### 3. Restart Services

```bash
npm run dev -w backend
npm start -w printssistant
```

The old system will work again.

---

## Migration Checklist

### Pre-Migration

- [ ] Backup `templates.json`
- [ ] Document current template structure
- [ ] Set up Canva developer account
- [ ] Get OAuth credentials

### Migration

- [ ] Complete OAuth setup
- [ ] Create folders in Canva
- [ ] Move templates to folders
- [ ] Share templates publicly
- [ ] Test API endpoints
- [ ] Test frontend

### Post-Migration

- [ ] Verify all templates accessible
- [ ] Test template copying
- [ ] Update documentation
- [ ] Train users on new system
- [ ] (Optional) Remove old files

---

## Benefits After Migration

### For Administrators

- ✅ No manual template updates
- ✅ Use Canva's native organization
- ✅ Automatic thumbnails and metadata
- ✅ Real-time changes

### For Users

- ✅ Always up-to-date templates
- ✅ Better browsing experience
- ✅ Faster template access
- ✅ Automatic design creation

### For Developers

- ✅ No file management
- ✅ Scalable architecture
- ✅ Better error handling
- ✅ OAuth security

---

## Support

### Documentation

- **Quick Start**: `OAUTH_QUICK_START.md`
- **Full Guide**: `TEMPLATE_INTEGRATION.md`
- **Checklist**: `COMPLETION_CHECKLIST.md`

### Help

- Check backend console logs
- Verify OAuth status
- Review Canva API documentation
- Open GitHub issue

---

## FAQ

### Q: Do I have to migrate?

**A:** No, the old system still works. Migration is recommended for better functionality.

### Q: Will this break existing workflows?

**A:** No, the migration is backward compatible. Old endpoints still work.

### Q: How long does migration take?

**A:** About 30 minutes for OAuth setup and template organization.

### Q: Can I migrate gradually?

**A:** Yes, you can keep both systems running and migrate templates over time.

### Q: What if I have hundreds of templates?

**A:** Use Canva's bulk operations to move templates to folders efficiently.

### Q: Do users need to do anything?

**A:** No, the migration is transparent to end users.

---

**Migration Status:** Ready  
**Estimated Time:** 30 minutes  
**Difficulty:** Easy  
**Support:** See documentation or open an issue
