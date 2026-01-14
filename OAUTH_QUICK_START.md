# Quick Start: Canva OAuth Setup

This guide will help you set up OAuth authentication for the Voom-Printssistant app in **5 minutes**.

## Prerequisites

- Canva account (organization account recommended)
- Access to [Canva Developer Portal](https://www.canva.com/developers/apps)
- Backend server running

## Step 1: Get Canva Credentials (2 minutes)

1. Go to [Canva Developer Portal](https://www.canva.com/developers/apps)
2. Sign in with your Canva account
3. Click "Create an app" or select existing app
4. Note these values:
   - **App ID**: `AAxxxxxxxxx` (example)
   - **Client ID**: `OC-xxxxxxxxxxxxx` (example)
   - **Client Secret**: `cnvca...` (example - will be a long string)

## Step 2: Configure Redirect URI (1 minute)

In the Canva Developer Portal:

1. Go to your app settings
2. Find "OAuth redirect URIs"
3. Add: `http://localhost:8787/auth/callback`
4. Save changes

For production, also add your production domain:

- `https://yourdomain.com/auth/callback`

## Step 3: Update Environment Variables (1 minute)

Edit `backend/.env`:

```bash
# Canva Connect API OAuth Credentials
CANVA_CLIENT_ID=your_client_id_here
CANVA_CLIENT_SECRET=your_client_secret_here
CANVA_REDIRECT_URI=http://localhost:8787/auth/callback

# Security (generate random values)
SESSION_SECRET=your_random_32_character_string_here
TOKEN_ENCRYPTION_KEY=your_random_32_character_key_here
ADMIN_TOKEN=your_admin_password_here
```

**Generate random secrets:**

```bash
# On macOS/Linux
openssl rand -base64 32

# On Windows (PowerShell)
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

## Step 4: Start the Backend (30 seconds)

```bash
cd backend
npm run dev
```

You should see:

```
[backend] listening on http://localhost:8787
```

## Step 5: Complete OAuth Flow (30 seconds)

1. Open your browser
2. Navigate to: `http://localhost:8787/auth/canva`
3. Click "Authorize" on the Canva page
4. You'll see: "✓ Successfully connected to Canva!"

## Step 6: Verify Authentication (30 seconds)

Check authentication status:

**Option 1: Browser**

- Navigate to: `http://localhost:8787/auth/status`

**Option 2: Command Line**

```bash
curl http://localhost:8787/auth/status
```

**Expected Response:**

```json
{
  "authenticated": true,
  "userId": "...",
  "expiresAt": 1234567890,
  "isExpired": false
}
```

## ✅ Done!

Your app is now authenticated with Canva. You can now:

- Browse folders: `http://localhost:8787/api/folders`
- List templates: `http://localhost:8787/api/folders/:folderId/templates`
- Copy templates: `POST http://localhost:8787/api/templates/:templateId/copy`

## Next Steps

### 1. Organize Templates in Canva

Create folders and add templates:

```
📁 Print Products
  ├── 📄 Business Cards
  ├── 📄 Flyers
  └── 📄 Brochures

📁 Marketing
  ├── 📄 Social Media Posts
  └── 📄 Email Headers
```

### 2. Share Templates Publicly

For each template:

1. Open in Canva
2. Click "Share"
3. Select "Anyone with the link"
4. Set permission to "Can view"

### 3. Test the Frontend

```bash
cd printssistant
npm start
```

Open the app in Canva and browse templates!

## Troubleshooting

### "Organization not authenticated" Error

**Cause:** OAuth not completed or tokens expired

**Solution:**

1. Navigate to `http://localhost:8787/auth/canva`
2. Complete authorization again
3. Verify with `/auth/status`

### "Invalid client credentials" Error

**Cause:** Wrong Client ID or Client Secret

**Solution:**

1. Double-check values in `.env`
2. Verify in Canva Developer Portal
3. Restart backend server

### "Redirect URI mismatch" Error

**Cause:** Redirect URI not configured in Canva

**Solution:**

1. Go to Canva Developer Portal
2. Add `http://localhost:8787/auth/callback` to OAuth redirect URIs
3. Save and try again

### Backend Won't Start

**Cause:** Port 8787 already in use

**Solution:**

```bash
# Change port in .env
PORT=8788

# Or kill existing process
# Windows
netstat -ano | findstr :8787
taskkill /PID <PID> /F

# macOS/Linux
lsof -ti:8787 | xargs kill
```

## Security Checklist

Before going to production:

- [ ] Use HTTPS (not HTTP)
- [ ] Change all default secrets
- [ ] Use strong random values for `SESSION_SECRET` and `TOKEN_ENCRYPTION_KEY`
- [ ] Never commit `.env` file
- [ ] Set `NODE_ENV=production`
- [ ] Use production redirect URI
- [ ] Enable rate limiting
- [ ] Set up error monitoring

## Quick Reference

### Environment Variables

| Variable               | Example                               | Purpose             |
| ---------------------- | ------------------------------------- | ------------------- |
| `CANVA_CLIENT_ID`      | `OC-AZsyXVs-0Ajc`                     | OAuth client ID     |
| `CANVA_CLIENT_SECRET`  | `cnvca0I9P7Qm...`                     | OAuth client secret |
| `CANVA_REDIRECT_URI`   | `http://localhost:8787/auth/callback` | OAuth redirect      |
| `SESSION_SECRET`       | Random 32+ chars                      | Session encryption  |
| `TOKEN_ENCRYPTION_KEY` | Random 32 chars                       | Token encryption    |
| `ADMIN_TOKEN`          | Your password                         | Admin access        |

### OAuth Endpoints

| Endpoint         | Method | Purpose           |
| ---------------- | ------ | ----------------- |
| `/auth/canva`    | GET    | Start OAuth flow  |
| `/auth/callback` | GET    | OAuth callback    |
| `/auth/status`   | GET    | Check auth status |
| `/auth/logout`   | POST   | Clear tokens      |

### API Endpoints

| Endpoint                     | Method | Purpose        |
| ---------------------------- | ------ | -------------- |
| `/api/folders`               | GET    | List folders   |
| `/api/folders/:id/templates` | GET    | List templates |
| `/api/templates/:id/copy`    | POST   | Copy template  |

## Need More Help?

- **Full Documentation**: See `TEMPLATE_INTEGRATION.md`
- **Implementation Details**: See `IMPLEMENTATION_SUMMARY.md`
- **Canva Docs**: https://www.canva.com/developers/docs/connect-api/
- **OAuth Spec**: https://oauth.net/2/

---

**Estimated Setup Time:** 5 minutes  
**Difficulty:** Easy  
**Prerequisites:** Canva account, Node.js installed
