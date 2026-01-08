# Template Management System - Implementation Guide

## ✅ What's Done

1. **Created `backend/src/template-manager.ts`** - CRUD operations for templates
2. **Created `backend/templates.json`** - Template storage
3. **Added imports to `backend/src/index.ts`** - TemplateManager import and instance
4. **Created `TEMPLATE_ENDPOINTS.txt`** - API endpoint code

## 🔧 What You Need To Do

### Step 1: Add API Endpoints to `backend/src/index.ts`

Open `backend/src/index.ts` and find line ~542 where it says:

```typescript
app.get("/api/admin/rules", adminAuth, (req, res) => {
```

**BEFORE** that line, paste the entire contents of `TEMPLATE_ENDPOINTS.txt`

This adds these endpoints:

- `GET /api/templates` - List all templates (public)
- `GET /api/templates/categories` - List categories (public)
- `POST /api/admin/templates` - Create template (admin)
- `PUT /api/admin/templates/:id` - Update template (admin)
- `DELETE /api/admin/templates/:id` - Delete template (admin)

### Step 2: Create Admin UI

I'll create the admin template manager UI in the next file...

## 📝 Template Format

```json
{
  "id": "1704825600000",
  "name": "Luggage Tags",
  "url": "https://www.canva.com/design/DAGPQ1Ic0tA/...",
  "category": "Travel",
  "createdAt": "2026-01-08T20:00:00.000Z",
  "updatedAt": "2026-01-08T20:00:00.000Z"
}
```

## 🔑 Admin Auth

All admin endpoints require `X-Admin-Token` header with value from `.env` file:

```
X-Admin-Token: your-admin-token-here
```

## 🚀 Next Steps

After adding the endpoints, I'll create:

1. Admin UI HTML page at `/admin/templates`
2. Update frontend to use `/api/templates` instead of brand templates API
3. Add category filtering in TemplateBrowser

Continue? I'll create the admin UI HTML next!
