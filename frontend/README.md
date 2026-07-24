# Spaceship X26 Mission Dashboard

A responsive operations dashboard using the shadcn `b3Zheoix4U` preset: the Sera component style,
stone neutrals, emerald actions, cyan charts, Geist headings, and Oxanium interface text. It gives
Crew Leads one place to manage passengers and resources, simulate access decisions, and inspect
live usage and audit activity.

## What is functional

- Mission overview with passenger, resource, access, and denial metrics
- Passenger manifest with search, onboarding, and inline tier changes
- Resource catalogue with search, provisioning, access testing, and decommissioning
- Access simulator that explains allowed and denied decisions
- Resource demand, membership composition, tier analytics, and immutable activity views
- Responsive sidebar/navigation and mobile administration actions
- Stateful demo data for instant evaluation, plus a configurable live API mode

## Run it

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). Demo mode works immediately and keeps its state
for the current page session.

To use PostgreSQL-backed data, start the API from the repository root, open the dashboard connection
settings, select **Live API**, and enter `http://localhost:3000`.

## API modes

- **Demo API** is the default and makes the deployed interface interactive without requiring backend infrastructure.
- **Live API** accepts a backend origin in the settings dialog and calls the production routes
  without changing their payloads. The fixed Crew Lead Alpha identity is sent through the
  assignment's `x-crew-lead-id` header.

The local Vite server proxies `/api` to `http://localhost:3000`. A remotely hosted frontend requires
the backend to permit its origin.

## Verify it

```bash
cd frontend
npm run lint
npm test
npm run build
```

The API abstraction has automated coverage for inherited access, denial reasons, audit recording,
passenger management, resource lifecycle, and both usage-report shapes.

## Cloudflare Pages

- Root directory: `frontend`
- Build command: `npm run build`
- Output directory: `dist`
- Node version: `22`

The frontend is isolated in this directory, so it can be released, scaled, and replaced
independently from the backend.

## Design reference

The dashboard structure was initially adapted for the Spaceship X26 domain from
[satnaing/shadcn-admin](https://github.com/satnaing/shadcn-admin), which is distributed under the
MIT License. Its final theme and component styling are generated from the shadcn preset stored in
`components.json`. The business workflows, API integration, demo state, and content are
project-specific.
