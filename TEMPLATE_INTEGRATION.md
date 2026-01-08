# Template Integration Feature

This document describes the template browsing and selection feature implemented for GitHub Issue #4.

## Overview

The template integration feature allows users to:

1. Browse organization Canva folders
2. View available templates within each folder
3. Select a template to copy and edit
4. Seamlessly transition to the print preparation workflow

## Architecture

### Backend (`backend/src/index.ts`)

Added three new API endpoints:

- **`GET /api/folders`** - List all organization folders
- **`GET /api/folders/:folderId/templates`** - List templates in a specific folder
- **`GET /api/templates/:templateId`** - Get details of a specific template

Currently returns mock data. In production, these should integrate with Canva Connect APIs.

### Shared Types (`shared/src/index.ts`)

Added TypeScript types and Zod schemas:

- **`CanvaFolder`** - Represents a folder containing templates
- **`CanvaTemplate`** - Represents a template/design that can be copied

### Frontend Components

#### `TemplateBrowser.tsx`

A two-level browsing interface:

1. **Folder view** - Displays all available folders with item counts
2. **Template view** - Shows templates within the selected folder with thumbnails

Features:

- Loading states
- Error handling
- Responsive keyboard navigation
- Internationalized text

#### Hook: `useTemplateOperations.ts`

Manages template operations:

- `copyAndOpenTemplate()` - Opens a template in the Canva editor
- Error and loading state management

**Note**: Currently opens templates in read mode. Full copy functionality requires Canva Connect API integration.

### App Integration (`app.tsx`)

Added new view state:

- **`template-browse`** - Template browsing view (accessed after welcome screen)
- Users can skip template selection to go directly to job selection

## User Flow

```
Welcome Screen
     ↓
Template Browser
  - Browse folders
  - View templates
  - Select template
     ↓
Main Analysis View
  - Job automatically created from template dimensions
  - DPI checks
  - Preflight verification
```

**Note**: The separate job/size selection step has been removed. Template dimensions are automatically converted to a print job (assuming 72 DPI), with standard bleed (0.125") and safe margin (0.125") applied.

## Current Limitations & Production Considerations

### 1. Mock Data

The backend currently returns hardcoded mock data. For production:

```typescript
// Replace mock implementation with Canva Connect API calls
const response = await fetch(
  "https://api.canva.com/rest/v1/folders/{folderId}/items",
  {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  }
);
```

### 2. Template Copying

Currently uses `requestOpenDesign()` which opens in read mode. For automatic copying:

```typescript
// Backend endpoint to copy via Canva Connect API
POST /api/templates/:templateId/copy
// Returns new design ID
// Then use requestOpenDesign({ designId: newDesignId })
```

### 3. Authentication

Template browsing requires:

- Canva Connect API authentication (OAuth 2.0)
- Proper scopes: `folder:read`, `design:read`, `design:write`
- Enterprise organization membership

### 4. Permissions

Users must have access to organization folders. Implement:

- Permission checks in backend
- Proper error messages for insufficient permissions
- User-friendly fallback for users without access

## API Integration Guide

### Canva Connect API Setup

1. **Enable API Access**
   - Register your app in Canva Developer Portal
   - Request Enterprise API access
   - Configure OAuth callbacks

2. **Required Scopes**

   ```
   folder:read
   design:read
   design:write
   asset:read
   ```

3. **Folders API**

   ```
   GET https://api.canva.com/rest/v1/folders/{folderId}/items
   ```

4. **Brand Templates API**
   ```
   GET https://api.canva.com/rest/v1/brand-templates
   POST https://api.canva.com/rest/v1/brand-templates/{templateId}/copy
   ```

### Implementation Steps

1. **Add OAuth flow** to backend
2. **Store access tokens** securely
3. **Replace mock endpoints** with real API calls
4. **Implement token refresh** logic
5. **Add error handling** for API failures
6. **Cache folder/template data** to reduce API calls

## Testing

### Manual Testing

1. Start the backend: `npm start` (in backend directory)
2. Start the frontend: `npm start` (in printssistant directory)
3. Open app in Canva editor
4. Click "Get Started" on welcome screen
5. Browse folders and select a template
6. Verify template opens or shows appropriate error

### Future Automated Tests

```typescript
// Test folder fetching
test('fetches and displays folders', async () => {
  render(<TemplateBrowser {...props} />);
  await waitFor(() => {
    expect(screen.getByText('Print Templates')).toBeInTheDocument();
  });
});

// Test template selection
test('opens template when selected', async () => {
  const mockTemplate = { id: '123', name: 'Test' };
  render(<TemplateBrowser {...props} />);
  // ... test implementation
});
```

## Environment Variables

No new environment variables required for MVP. For production:

```env
CANVA_CLIENT_ID=your_client_id
CANVA_CLIENT_SECRET=your_client_secret
CANVA_REDIRECT_URI=https://yourapp.com/auth/callback
```

## Related Files

- Backend: `backend/src/index.ts` (lines 179-265)
- Types: `shared/src/index.ts` (lines 33-63)
- Component: `printssistant/src/components/TemplateBrowser.tsx`
- Hook: `printssistant/src/hooks/useTemplateOperations.ts`
- App: `printssistant/src/intents/design_editor/app.tsx`

## References

- [Canva Apps SDK Documentation](https://www.canva.dev/docs/apps/)
- [Canva Connect API](https://www.canva.dev/docs/connect/)
- [Folders API](https://www.canva.dev/docs/connect/api-reference/folders/)
- [Brand Templates API](https://www.canva.dev/docs/connect/api-reference/brand-templates/)
