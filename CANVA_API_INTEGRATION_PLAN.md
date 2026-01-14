# Canva Connect API Integration Plan

## Overview

This document outlines the implementation plan for replacing all mock data with live Canva Connect API integrations.

## Current State

### ✅ Already Implemented

- OAuth 2.0 flow with PKCE (`canva-auth.ts`)
- Token storage with encryption (`token-storage.ts`)
- Canva API client with automatic token refresh (`canva-api.ts`)
- Backend endpoints for folders and templates
- Environment variable configuration

### ❌ Still Using Mock Data

- Template browser frontend (`TemplateBrowser.tsx`) - uses `/api/canva-templates` endpoint
- Template manager (`template-manager.ts`) - stores templates in `templates.json` file
- No integration between frontend template browser and live Canva API

## Implementation Tasks

### 1. Update Template Browser to Use Live Canva API ✅

**Files to modify:**

- `printssistant/src/components/TemplateBrowser.tsx`

**Changes:**

- Replace `/api/canva-templates` endpoint with `/api/folders` to list Canva folders
- Update UI to show folders first, then templates within selected folder
- Use `/api/folders/:folderId/templates` to fetch templates
- Update template copy logic to use `/api/templates/:templateId/copy`
- Add proper loading states and error handling
- Show authentication status and prompt admin to authenticate if needed

### 2. Deprecate File-Based Template Manager

**Files to modify:**

- `backend/src/index.ts` - Keep admin template endpoints for backward compatibility but mark as deprecated
- `backend/src/template-manager.ts` - Add deprecation notice

**Rationale:**

- The file-based template system (`templates.json`) is now redundant
- All templates should come from Canva API via folders
- Keep admin endpoints for now to avoid breaking existing admin UI

### 3. Update Documentation

**Files to update:**

- `TEMPLATE_INTEGRATION.md` - Document live API usage
- `DATA_CONNECTOR_IMPLEMENTATION.md` - Update with current API integration status
- `README.md` - Add OAuth setup instructions

### 4. Add Comprehensive Error Handling

**Backend (`backend/src/index.ts`):**

- ✅ Already has error handling for unauthenticated state (503 errors)
- ✅ Already has error handling for API failures
- Add more detailed logging for debugging

**Frontend (`TemplateBrowser.tsx`):**

- Show user-friendly error messages
- Handle 503 errors (not authenticated) with clear instructions
- Handle 401/403 errors (permission issues)
- Handle network errors gracefully

### 5. Environment & Security

**Files:**

- ✅ `.env.sample` created with all required variables
- `.gitignore` - Ensure `.env` is ignored (already done)

**Security checklist:**

- ✅ Tokens encrypted at rest
- ✅ Environment variables for all secrets
- ✅ PKCE for OAuth flow
- ✅ Session security (httpOnly cookies)
- ✅ CSRF protection (state parameter)

### 6. Testing & Validation

**Manual testing:**

1. Complete OAuth flow (`/auth/canva`)
2. List folders (`/api/folders`)
3. List templates in folder (`/api/folders/:folderId/templates`)
4. Copy template (`/api/templates/:templateId/copy`)
5. Verify frontend template browser works end-to-end

**Integration tests needed:**

- OAuth token exchange
- Token refresh logic
- API error handling
- Template copying workflow

## API Endpoints Summary

### Authentication

- `GET /auth/canva` - Initiate OAuth flow
- `GET /auth/callback` - OAuth callback handler
- `GET /auth/status` - Check authentication status
- `POST /auth/logout` - Clear tokens

### Folders & Templates (Live Canva API)

- `GET /api/folders` - List organization folders
- `GET /api/folders/:folderId/templates` - List templates in folder (publicly shared only)
- `POST /api/templates/:templateId/copy` - Copy a template
- `GET /api/brand-templates` - List brand templates (test endpoint)

### Legacy Template Management (File-based - Deprecated)

- `GET /api/canva-templates` - List templates from templates.json
- `GET /api/canva-templates/categories` - Get categories
- `POST /api/admin/canva-templates` - Create template (admin)
- `PUT /api/admin/canva-templates/:id` - Update template (admin)
- `DELETE /api/admin/canva-templates/:id` - Delete template (admin)

## Migration Strategy

### Phase 1: Update Frontend (Current)

- Modify `TemplateBrowser.tsx` to use live API endpoints
- Test with authenticated Canva account
- Ensure backward compatibility

### Phase 2: Deprecate File-Based System

- Add deprecation warnings to file-based endpoints
- Update admin UI to show migration notice
- Keep endpoints functional for transition period

### Phase 3: Complete Migration

- Remove file-based template system entirely
- Remove `templates.json`
- Remove `template-manager.ts`
- Update all documentation

## OAuth Setup Instructions

### For Administrators

1. **Create Canva App:**
   - Go to https://www.canva.com/developers/apps
   - Create a new app or use existing app
   - Note the App ID, Client ID, and Client Secret

2. **Configure OAuth Redirect:**
   - In Canva Developer Portal, add redirect URI: `http://localhost:8787/auth/callback`
   - For production, use your production domain

3. **Set Environment Variables:**

   ```bash
   CANVA_CLIENT_ID=your_client_id
   CANVA_CLIENT_SECRET=your_client_secret
   CANVA_REDIRECT_URI=http://localhost:8787/auth/callback
   ```

4. **Complete OAuth Flow:**
   - Navigate to `http://localhost:8787/auth/canva`
   - Authorize the app with your Canva account
   - Tokens will be stored securely

5. **Verify Authentication:**
   - Check `http://localhost:8787/auth/status`
   - Should show `authenticated: true`

## Required Scopes

The following OAuth scopes are requested:

- `folder:read` - List folders
- `folder:permission:read` - Read folder permissions
- `design:meta:read` - Read design metadata
- `design:content:read` - Read design content
- `design:content:write` - Create/copy designs
- `asset:read` - Read assets
- `brandtemplate:meta:read` - Read brand template metadata
- `brandtemplate:content:read` - Read brand template content

## Success Criteria

- ✅ OAuth flow completes successfully
- ✅ Tokens are stored and refreshed automatically
- ✅ Frontend template browser shows live Canva folders
- ✅ Templates can be copied via API
- ✅ Error handling provides clear user feedback
- ✅ All secrets are in environment variables
- ✅ Documentation is updated

## Next Steps

1. Update `TemplateBrowser.tsx` to use live API
2. Test end-to-end workflow
3. Add integration tests
4. Update documentation
5. Plan deprecation of file-based system
