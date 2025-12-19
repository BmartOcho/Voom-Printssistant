# Voom Printssistant

Voom Printssistant is a comprehensive solution for managing print operations, integrating a Canva App for design and a dedicated backend for processing.

## Project Structure

This repository is organized as a monorepo with the following workspaces:

- **`backend`**: Express.js server with TypeScript, handling business logic, storage, and API endpoints.
- **`canva-app`**: React-based Canva App using Vite and the Canva Apps SDK.
- **`shared`**: Shared TypeScript types and utilities used by both the backend and the app.

## Getting Started

### Prerequisites

- Node.js (v18 or higher recommended)
- npm

### Installation

1.  Clone the repository:

    ```bash
    git clone https://github.com/BmartOcho/Voom-Printssistant.git
    cd Voom-Printssistant
    ```

2.  Install dependencies for all workspaces:
    ```bash
    npm install
    ```

### Running the Application

This project uses npm workspaces. You can run scripts for specific workspaces from the root.

#### Backend

To start the backend development server:

```bash
npm run dev -w backend
```

This will start the server on the configured port (default is usually 3000 or 8080, check `.env` if available).

#### Canva App

To start the Canva App development server:

```bash
npm run dev -w canva-app
```

This will start the Vite development server, typically on `http://localhost:5173`.

#### Shared Library

The shared library is a dependency for both the backend and the app. If you make changes to it, you may need to rebuild it:

```bash
npm run build -w @printssistant/shared
```

## Features

- **Print Readiness Checks**: Automated checks for print quality and specifications.
- **Canva Integration**: Seamlessly works within the Canva editor.
- **PDF Export**: Generate print-ready PDFs.
