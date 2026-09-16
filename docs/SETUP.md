# Setup Guide

Detailed instructions for setting up and running the Hermes Dashboard locally.

## Prerequisites

- **Node.js 18+** — [Install Node.js](https://nodejs.org/)
- **npm 9+** — Comes with Node.js (verify with `npm --version`)
- **Hermes Agent** running on the target machine with the dashboard backend enabled (port 9119)

### Verify Prerequisites

```bash
node --version    # Should be v18.0.0 or higher
npm --version     # Should be 9.0.0 or higher
```

### Hermes Backend Requirement

The dashboard communicates with the Hermes Agent backend, which must be running and accessible. Start it with:

```bash
hermes dashboard
```

This launches the Hermes backend server on **port 9119** by default. The dashboard proxies all API calls through its own server to this backend.

## Step-by-Step Installation

### 1. Clone the Repository

```bash
git clone https://github.com/your-org/notabita-hermes-dashboard.git
cd notabita-hermes-dashboard
```

### 2. Install Dependencies

```bash
npm install
```

This installs all packages listed in `package.json`, including Next.js, React, shadcn/ui components, and development tools.

### 3. Configure Environment Variables

Create a `.env.local` file in the project root:

```bash
HERMES_BACKEND_URL=http://localhost:9119
HERMES_SESSION_TOKEN=your-session-token-here
```

See [Getting the Session Token](#getting-the-session-token) below for how to obtain the token.

### 4. Start the Development Server

```bash
npm run dev
```

The dashboard will be available at [http://localhost:3000](http://localhost:3000).

## Getting the Session Token

The Hermes backend requires a session token for authentication. Here's how to obtain it:

### Method: Browser DevTools

1. **Start the Hermes dashboard backend:**
   ```bash
   hermes dashboard
   ```

2. **Open the Hermes dashboard in your browser** — typically at `http://localhost:9119`

3. **Open Developer Tools:**
   - Chrome/Edge: `F12` or `Ctrl+Shift+I` (Windows/Linux) / `Cmd+Option+I` (macOS)
   - Firefox: `F12` or `Ctrl+Shift+K`

4. **Go to the Console tab** and run:
   ```javascript
   window.__HERMES_SESSION_TOKEN__
   ```

5. **Copy the output** — this is your session token. Paste it into your `.env.local` file:
   ```bash
   HERMES_SESSION_TOKEN=<paste-token-here>
   ```

> **Note:** Session tokens are temporary and expire when the Hermes backend restarts. You'll need to obtain a new token after restarting the backend.

## Production Build

For production deployment:

```bash
# Build the application
npm run build

# Start the production server
npm start
```

The production server runs on port 3000 by default. Set the `PORT` environment variable to change it:

```bash
PORT=8080 npm start
```

## Troubleshooting

### CORS Errors

**Symptom:** Browser console shows CORS-related errors when making API requests.

**Cause:** The browser is trying to reach the Hermes backend directly, bypassing the Next.js proxy.

**Solution:** This shouldn't happen in normal operation — the dashboard routes all API calls through `/api/hermes/*` (same origin). If you see CORS errors:
- Verify the proxy route exists: check `src/app/api/hermes/[...path]/route.ts`
- Ensure you're accessing the dashboard via `localhost:3000`, not directly hitting port 9119
- Clear browser cache and restart the dev server

### 401 Unauthorized Errors

**Symptom:** API requests return 401 status codes.

**Cause:** Invalid or expired session token.

**Solution:**
1. Obtain a fresh session token (see [Getting the Session Token](#getting-the-session-token))
2. Update `HERMES_SESSION_TOKEN` in `.env.local`
3. Restart the development server (`Ctrl+C`, then `npm run dev`)

### Backend Unreachable (502)

**Symptom:** Dashboard shows "Backend unreachable" errors or 502 status codes.

**Cause:** The Hermes backend is not running or not accessible at the configured URL.

**Solution:**
1. Verify the Hermes backend is running:
   ```bash
   curl http://localhost:9119/api/status
   ```
2. If it fails, restart the backend:
   ```bash
   hermes dashboard
   ```
3. Check `HERMES_BACKEND_URL` in `.env.local` matches the actual backend address
4. Ensure no firewall or network rules block the connection

### Module Not Found Errors

**Symptom:** `npm run dev` fails with "Module not found" errors.

**Solution:**
```bash
# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Port Already in Use

**Symptom:** `Error: listen EADDRINUSE: address already in use :::3000`

**Solution:**
```bash
# Use a different port
PORT=3001 npm run dev

# Or find and kill the process using port 3000
lsof -ti:3000 | xargs kill -9   # macOS/Linux
```

## Environment-Specific Notes

### WSL (Windows Subsystem for Linux)

If running Hermes on WSL and accessing from Windows:
- The dashboard should work natively inside WSL
- Access it from Windows browser at `http://localhost:3000` (WSL ports forward automatically)
- If the backend runs on Windows, set `HERMES_BACKEND_URL=http://host.docker.internal:9119` or the Windows host IP

### Remote Machine

To use the dashboard with a remote Hermes backend:
```bash
HERMES_BACKEND_URL=http://remote-machine-ip:9119
HERMES_SESSION_TOKEN=<token-from-remote-machine>
```

Ensure port 9119 is accessible from the machine running the dashboard (firewall rules, SSH tunnel, etc.).

### SSH Tunnel (Recommended for Remote)

```bash
# On the machine running the dashboard:
ssh -L 9119:localhost:9119 user@remote-machine
```

Then use `HERMES_BACKEND_URL=http://localhost:9119` as if the backend were local.
