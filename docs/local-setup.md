# Local Development Setup Guide

## Prerequisites

- **Node.js**: `v20.x` or higher (verified on Node `v22.x`)
- **npm**: `v10.x` or higher
- **Git**

## Quick Start

1. **Install Dependencies across Monorepo Workspaces:**
   ```bash
   npm install
   ```

2. **Configure Environment Variables:**
   * Backend:
     ```bash
     cp backend/.env.example backend/.env
     ```
   * Frontend:
     ```bash
     cp frontend/.env.example frontend/.env
     ```

3. **Start Development Servers:**
   * Run Frontend:
     ```bash
     npm run dev:frontend
     ```
     Frontend URL: `http://localhost:5173`
   * Run Backend:
     ```bash
     npm run dev:backend
     ```
     Backend URL: `http://localhost:5000`

4. **Verify Verification Checks:**
   ```bash
   # Run type checks across all workspaces
   npm run typecheck

   # Run linters across all workspaces
   npm run lint

   # Run automated test suites
   npm run test

   # Run production build validation
   npm run build
   ```

## Diagnostics

* Check health endpoint:
  ```bash
  curl http://localhost:5000/api/v1/health
  ```
* Check database readiness:
  ```bash
  curl http://localhost:5000/api/v1/health/ready
  ```
