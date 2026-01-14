# Voom Printssistant

Voom Printssistant is a comprehensive solution for managing print operations, integrating a Canva App for design and a dedicated backend for processing with **live Canva Connect API integration**.

## Project Structure

This repository is organized as a monorepo with the following workspaces:

- **`backend`**: Express.js server with TypeScript, handling business logic, storage, API endpoints, and Canva Connect API integration.
- **`printssistant`**: React-based Canva App using Vite and the Canva Apps SDK.
- **`shared`**: Shared TypeScript types and utilities used by both the backend and the app.

## Features

- ✅ **Live Canva API Integration** - Fetch templates and folders from Canva in real-time
- ✅ **OAuth 2.0 Authentication** - Secure token-based authentication with PKCE
- ✅ **Template Browser** - Browse organization folders and copy templates
- ✅ **Print Readiness Checks** - Automated checks for print quality and specifications
- ✅ **PDF Export** - Generate print-ready PDFs with bleed and crop marks
- ✅ **Job Management** - Track print jobs and exports

## Getting Started

### Prerequisites

- Node.js (v18 or higher recommended)
- npm
- Canva Developer Account (for OAuth setup)

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/BmartOcho/Voom-Printssistant.git
   cd Voom-Printssistant
   ```

2. Install dependencies for all workspaces:

   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cd backend
   cp .env.sample .env
   # Edit .env with your Canva API credentials
   ```

### Canva OAuth Setup (Required)

Before running the app, you need to set up OAuth authentication with Canva:

1. **Create a Canva App:**
   - Go to [Canva Developers](https://www.canva.com/developers/apps)
   - Create a new app or use existing app
   - Note your **Client ID** and **Client Secret**

2. **Configure Redirect URI:**
   - In Canva Developer Portal, add redirect URI: `http://localhost:8787/auth/callback`

3. **Update `.env` file:**

   ```bash
   CANVA_CLIENT_ID=your_client_id_here
   CANVA_CLIENT_SECRET=your_client_secret_here
   CANVA_REDIRECT_URI=http://localhost:8787/auth/callback
   SESSION_SECRET=your_random_session_secret
   TOKEN_ENCRYPTION_KEY=your_32_character_encryption_key
   ADMIN_TOKEN=your_admin_token
   ```

4. **Complete OAuth Flow:**
   - Start the backend (see below)
   - Navigate to `http://localhost:8787/auth/canva`
   - Authorize the app with your Canva account
   - Verify authentication: `http://localhost:8787/auth/status`

### Running the Application

This project uses npm workspaces. You can run scripts for specific workspaces from the root.

#### Backend

To start the backend development server:

```bash
npm run dev -w backend
```

This will start the server on port 8787 (default).

**Important:** Complete the OAuth setup (above) before using template features.

#### Canva App

To start the Canva App development server:

```bash
npm start -w printssistant
```

This will start the Vite development server.

#### Shared Library

The shared library is a dependency for both the backend and the app. If you make changes to it, you may need to rebuild it:

```bash
npm run build -w @printssistant/shared
```

## API Endpoints

### Authentication

- `GET /auth/canva` - Initiate OAuth flow
- `GET /auth/callback` - OAuth callback handler
- `GET /auth/status` - Check authentication status
- `POST /auth/logout` - Clear tokens

### Folders & Templates (Live Canva API)

- `GET /api/folders` - List organization folders
- `GET /api/folders/:folderId/templates` - List templates in folder
- `POST /api/templates/:templateId/copy` - Copy template

### Jobs & Exports

- `POST /api/jobs` - Create a print job
- `GET /api/jobs` - List jobs
- `GET /api/jobs/:jobId` - Get job details
- `POST /api/exports` - Submit export
- `GET /api/exports` - List exports

### Admin

- `GET /admin` - Admin dashboard for product rules
- `GET /admin/templates` - Template management UI
- `GET /jobs` - Jobs dashboard

## Documentation

- **[TEMPLATE_INTEGRATION.md](./TEMPLATE_INTEGRATION.md)** - Complete guide to Canva Connect API integration
- **[CANVA_API_INTEGRATION_PLAN.md](./CANVA_API_INTEGRATION_PLAN.md)** - Implementation plan and migration strategy
- **[DATA_CONNECTOR_IMPLEMENTATION.md](./DATA_CONNECTOR_IMPLEMENTATION.md)** - Data connector feature documentation

## Security

- ✅ OAuth 2.0 with PKCE for secure authentication
- ✅ Tokens encrypted at rest using AES-256-GCM
- ✅ Environment variables for all secrets
- ✅ CSRF protection with state parameter
- ✅ httpOnly cookies for session management

**Important:** Never commit `.env` files or expose secrets in code.

## Troubleshooting

### "Organization not authenticated" Error

Complete the OAuth setup:

1. Navigate to `http://localhost:8787/auth/canva`
2. Authorize the app
3. Verify with `http://localhost:8787/auth/status`

### "No templates found" Error

Ensure templates are shared publicly:

1. Open design in Canva
2. Click "Share" → "Anyone with the link"
3. Set permission to "Can view"

### More Help

See [TEMPLATE_INTEGRATION.md](./TEMPLATE_INTEGRATION.md) for detailed troubleshooting.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

[Add your license here]

## Support

For issues or questions:

- Check the documentation in this repository
- Review [Canva Connect API Documentation](https://www.canva.com/developers/docs/connect-api/)
- Open an issue on GitHub
