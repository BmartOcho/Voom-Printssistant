# Template Integration Guide

This document explains how the Printssistant app integrates with Canva templates using the **Canva Connect API**.

## Overview

The Printssistant app now uses **live Canva Connect API** to fetch and manage templates. All template data comes directly from your Canva organization account via OAuth 2.0 authentication.

### Key Features

- ✅ **Live API Integration** - Templates fetched from Canva in real-time
- ✅ **OAuth 2.0 Authentication** - Secure token-based authentication with PKCE
- ✅ **Automatic Token Refresh** - Tokens are refreshed automatically when expired
- ✅ **Folder-Based Organization** - Templates organized by Canva folders
- ✅ **Template Copying** - Create new designs from templates via API
- ✅ **Public Sharing Filter** - Only shows templates shared with "Anyone with the link"

## Prerequisites

### 1. Canva Developer Account

1. Go to [Canva Developers](https://www.canva.com/developers/apps)
2. Create a new app or use an existing app
3. Note your **App ID**, **Client ID**, and **Client Secret**

### 2. Configure OAuth Redirect URI

In the Canva Developer Portal:

- Add redirect URI: `http://localhost:8787/auth/callback` (development)
- For production, use your production domain

### 3. Set Environment Variables

Create a `.env` file in the `backend` directory (use `.env.sample` as template):

```bash
# Canva Connect API OAuth Credentials
CANVA_CLIENT_ID=your_client_id_here
CANVA_CLIENT_SECRET=your_client_secret_here
CANVA_REDIRECT_URI=http://localhost:8787/auth/callback

# Security
SESSION_SECRET=your_random_session_secret
TOKEN_ENCRYPTION_KEY=your_32_character_encryption_key
ADMIN_TOKEN=your_admin_token
```

## OAuth Setup (One-Time)

### Step 1: Start the Backend

```bash
cd backend
npm run dev
```

### Step 2: Complete OAuth Flow

1. Navigate to: `http://localhost:8787/auth/canva`
2. Sign in with your Canva account
3. Authorize the app to access your organization
4. You'll be redirected back with a success message

### Step 3: Verify Authentication

Check authentication status:

```bash
curl http://localhost:8787/auth/status
```

Expected response:

```json
{
  "authenticated": true,
  "userId": "...",
  "expiresAt": 1234567890,
  "isExpired": false
}
```

## How It Works

### Architecture

```
┌─────────────────┐
│  Canva App UI   │
│ (React/TypeScript)
└────────┬────────┘
         │
         │ HTTP Requests
         │
┌────────▼────────┐
│  Backend API    │
│  (Node/Express) │
└────────┬────────┘
         │
         │ OAuth 2.0 + API Calls
         │
┌────────▼────────┐
│  Canva Connect  │
│      API        │
└─────────────────┘
```

### API Endpoints

#### Authentication

- `GET /auth/canva` - Initiate OAuth flow
- `GET /auth/callback` - OAuth callback handler
- `GET /auth/status` - Check authentication status
- `POST /auth/logout` - Clear stored tokens

#### Folders & Templates (Live API)

- `GET /api/folders` - List organization folders from Canva
- `GET /api/folders/:folderId/templates` - List templates in a folder
- `POST /api/templates/:templateId/copy` - Copy a template to create new design

### Frontend Flow

1. **User opens Template Browser**
   - `TemplateBrowser.tsx` component loads
   - Fetches folders from `/api/folders`

2. **User selects a folder**
   - Fetches templates from `/api/folders/:folderId/templates`
   - Only publicly shared templates are shown

3. **User selects a template**
   - Calls `/api/templates/:templateId/copy`
   - Backend creates a new design from the template
   - Returns `designId` and `editUrl`
   - Opens the new design in Canva editor

### Backend Flow

1. **Folder Listing** (`GET /api/folders`)
   - Checks if organization is authenticated
   - Calls Canva API `/rest/v1/folders`
   - Returns list of folders

2. **Template Listing** (`GET /api/folders/:folderId/templates`)
   - Fetches designs from folder via Canva API
   - Filters to only include publicly shared designs
   - Returns templates with metadata (name, thumbnail, dimensions)

3. **Template Copying** (`POST /api/templates/:templateId/copy`)
   - Calls Canva API `/rest/v1/brand-templates/:templateId/dataset`
   - Creates a new design from the template
   - Returns design ID and edit URL

## Required OAuth Scopes

The following scopes are requested during OAuth:

- `folder:read` - List folders
- `folder:permission:read` - Read folder permissions
- `design:meta:read` - Read design metadata
- `design:content:read` - Read design content
- `design:content:write` - Create/copy designs
- `asset:read` - Read assets
- `brandtemplate:meta:read` - Read brand template metadata
- `brandtemplate:content:read` - Read brand template content

## Template Organization

### Recommended Structure

Organize your templates in Canva folders:

```
📁 Print Products
  ├── 📄 Business Cards Template
  ├── 📄 Flyer Template
  └── 📄 Brochure Template

📁 Marketing Materials
  ├── 📄 Social Media Post
  └── 📄 Email Header

📁 Luggage Tags
  └── 📄 Standard Luggage Tag
```

### Sharing Requirements

**Important:** Templates must be shared with "Anyone with the link" to appear in the app.

To share a template:

1. Open the design in Canva
2. Click "Share" button
3. Select "Anyone with the link"
4. Set permission to "Can view"

## Token Management

### Storage

Tokens are stored securely:

- Encrypted at rest using AES-256-GCM
- Stored in `backend/data/tokens/` directory
- Never committed to version control

### Refresh Logic

Tokens are automatically refreshed:

- Checked before each API call
- Refreshed if expiring within 5 minutes
- New tokens stored securely

## Error Handling

### Common Errors

| Error Code | Meaning             | Solution                             |
| ---------- | ------------------- | ------------------------------------ |
| 503        | Not authenticated   | Complete OAuth flow at `/auth/canva` |
| 401        | Invalid token       | Re-authenticate                      |
| 403        | Missing permissions | Check OAuth scopes                   |
| 404        | Resource not found  | Verify folder/template ID            |
| 429        | Rate limit exceeded | Wait and retry                       |

### User-Friendly Messages

The app provides clear error messages:

- **Not Authenticated**: "Organization Canva account not authenticated. Please contact your administrator to complete OAuth setup."
- **No Templates**: "No publicly shared templates found in this folder. Make sure templates are shared with 'Anyone with the link'."
- **Copy Failed**: "Failed to copy template: [error details]"

## Testing

### Manual Testing Checklist

- [ ] Complete OAuth flow successfully
- [ ] List folders from Canva
- [ ] Select a folder and view templates
- [ ] Copy a template
- [ ] Verify new design opens in Canva
- [ ] Test with unauthenticated state
- [ ] Test with empty folders
- [ ] Test with non-public templates

### API Testing

Test authentication:

```bash
curl http://localhost:8787/auth/status
```

Test folder listing:

```bash
curl http://localhost:8787/api/folders
```

Test template listing:

```bash
curl http://localhost:8787/api/folders/FOLDER_ID/templates
```

Test template copying:

```bash
curl -X POST http://localhost:8787/api/templates/TEMPLATE_ID/copy \
  -H "Content-Type: application/json"
```

## Troubleshooting

### "Organization not authenticated" Error

**Solution:**

1. Navigate to `http://localhost:8787/auth/canva`
2. Complete OAuth flow
3. Verify with `/auth/status`

### "No folders found" Error

**Possible causes:**

- No folders exist in Canva account
- OAuth scopes missing `folder:read`

**Solution:**

- Create folders in Canva
- Re-authenticate with correct scopes

### "No templates found" Error

**Possible causes:**

- Folder is empty
- Templates not shared publicly

**Solution:**

- Add templates to the folder
- Share templates with "Anyone with the link"

### Token Refresh Failures

**Possible causes:**

- Refresh token expired
- Client secret changed

**Solution:**

- Re-authenticate via `/auth/canva`
- Verify `CANVA_CLIENT_SECRET` in `.env`

## Security Best Practices

### Environment Variables

- ✅ Never commit `.env` file
- ✅ Use strong random values for secrets
- ✅ Rotate secrets regularly
- ✅ Use different secrets for production

### Token Security

- ✅ Tokens encrypted at rest
- ✅ Tokens never logged or exposed
- ✅ HTTPS only in production
- ✅ httpOnly cookies for sessions

### OAuth Security

- ✅ PKCE (Proof Key for Code Exchange) enabled
- ✅ State parameter for CSRF protection
- ✅ Redirect URI validation
- ✅ Secure session management

## Related Files

- **Backend API**: `backend/src/index.ts`
- **OAuth Logic**: `backend/src/canva-auth.ts`
- **API Client**: `backend/src/canva-api.ts`
- **Token Storage**: `backend/src/token-storage.ts`
- **Frontend Component**: `printssistant/src/components/TemplateBrowser.tsx`
- **Shared Types**: `shared/src/index.ts`

## References

- [Canva Apps SDK Documentation](https://www.canva.dev/docs/apps/)
- [Canva Connect API](https://www.canva.dev/docs/connect/)
- [Folders API](https://www.canva.dev/docs/connect/api-reference/folders/)
- [Brand Templates API](https://www.canva.dev/docs/connect/api-reference/brand-templates/)
- [OAuth 2.0 with PKCE](https://oauth.net/2/pkce/)
