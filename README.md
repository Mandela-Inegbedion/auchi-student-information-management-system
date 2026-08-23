# Auchi Polytechnic Student Information Management System

This repository contains the React frontend and Express backend as npm workspaces. Both applications can be installed and started from the project root.

## Requirements

- Node.js 20 or newer
- npm
- A PostgreSQL database hosted on Supabase

## First-time setup

1. Open a terminal in the project root.
2. Install all frontend, backend, and root dependencies:

   ```powershell
   npm install
   ```

3. Copy `management_backend/.env.example` to `management_backend/.env` and enter the Supabase connection string, JWT secret, frontend URL, and seed credentials.
4. Copy `management_frontend/.env.example` to `management_frontend/.env` and set the backend API URL.
5. Prepare the database:

   ```powershell
   npm run prisma:generate
   npm run prisma:migrate
   npm run prisma:seed
   npm run prisma:verify
   ```

The seed command is required only when preparing a new database or deliberately restoring the sample data.

## Start the complete application

Run this one command from the project root:

```powershell
npm run dev
```

It starts:

- Frontend: http://127.0.0.1:5173
- Backend: http://localhost:4000
- Health check: http://localhost:4000/api/health

Press `Ctrl+C` once to stop both applications.

## Production build

```powershell
npm run build
```

This builds both the backend and frontend.
