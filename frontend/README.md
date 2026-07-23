# Spaceship X26 Command Deck

An independently deployable React micro-frontend for the existing Spaceship X26 NestJS API.

## Run it

```bash
cd frontend
npm install
npm run dev
```

The Vite development server proxies `/api` to `http://localhost:3000`. Start the existing backend separately from the repository root.

## API modes

- **Demo API** is the default and makes the deployed interface interactive without requiring backend infrastructure.
- **Live API** accepts a public backend origin in the settings dialog and calls the existing routes without changing their payloads.

The live backend must permit requests from the deployed frontend origin. No backend source code is modified by this frontend.

## Cloudflare Pages

- Root directory: `frontend`
- Build command: `npm run build`
- Output directory: `dist`
- Node version: `22`

The frontend is intentionally isolated in this directory, so it can be released, scaled, and replaced independently from the backend.
