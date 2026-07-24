# Spaceship X26 - Passenger Resource Management

A production-minded Passenger Resource Management System for the Everest Engineering coding
exercise. It combines a NestJS REST API, PostgreSQL persistence, an optional React command deck,
interactive OpenAPI documentation, migrations, tests, Docker, and CI.

The system models three membership levels:

```text
SILVER < GOLD < PLATINUM
```

Higher tiers inherit access to lower-tier resources. Every valid resource-access attempt is stored
as an immutable audit decision, whether allowed or denied.

## Assignment coverage

- Exactly three fixed Crew Lead administrators
- Passenger creation, inspection, and tier upgrades/downgrades
- Resource provisioning, seeded base inventory, and idempotent decommissioning
- Passenger-facing discovery filtered by active resources and inherited tier access
- Real-time access validation with explicit decision reasons
- Passenger-owned history and Crew Lead audit access
- Reports by resource, by passenger tier, most-popular resource, and latest activity
- Database-enforced audit immutability

See [requirement traceability](docs/requirement-traceability.md) for the original assignment-to-code
and assignment-to-test mapping.

## Architecture

```text
React command deck / Swagger / HTTP client
                    |
             NestJS controllers
                    |
       guards -> application services
                    |
       access policy -> TypeORM repositories
                    |
                PostgreSQL
```

Feature modules keep transport, orchestration, policy, and persistence concerns separate:

- `crew-leads`: the fixed administrator manifest and administrative guard
- `passengers`: passenger profiles, membership changes, and passenger identity guard
- `resources`: inventory lifecycle and tier-filtered discovery
- `access`: policy decisions, immutable audit records, and usage reports

## Prerequisites

- Node.js 22+
- npm
- Docker with Compose

## Run locally

From the repository root:

```bash
cp .env.example .env
docker compose up -d postgres
npm ci
npm run db:migrate
npm run start:dev
```

Open Swagger at [http://localhost:3000/docs](http://localhost:3000/docs). API routes use the
`/api` prefix.

To run the optional command deck:

```bash
cd frontend
npm ci
npm run dev
```

Open [http://localhost:5173](http://localhost:5173), select **LIVE API**, and use
`http://localhost:3000` as the backend origin.

Alternatively, run the migrated production image and PostgreSQL together:

```bash
docker compose --profile full up --build
```

If you previously ran an older revision with `DATABASE_SYNCHRONIZE=true`, its local Docker volume
has no migration history. For disposable local data, run `docker compose down -v` once before the
commands above. That command deletes the local PostgreSQL volume; do not use it for data you need to
keep.

## Typical workflows

### Crew Lead administration

Administrative calls require one of the three fixed `x-crew-lead-id` values:

```text
00000000-0000-4000-8000-000000000001
00000000-0000-4000-8000-000000000002
00000000-0000-4000-8000-000000000003
```

1. Create a passenger with `POST /api/passengers`.
2. Provision a resource with `POST /api/resources`.
3. Change membership using `PATCH /api/passengers/{id}/tier`.
4. Decommission a resource using `PATCH /api/resources/{id}/decommission`.
5. Inspect tier, resource-demand, popularity, and latest-activity reports.

### Passenger self-service

Passenger calls require `x-passenger-id` containing that passenger's UUID:

1. Discover eligible active resources with `GET /api/passenger/resources`.
2. Attempt access with `POST /api/passenger/resources/{resourceId}/access`.
3. Review personal decisions with `GET /api/passenger/history`.

The header-based identities deliberately stand in for a real identity provider so the exercise
remains self-contained. In production, signed tokens would replace both identity headers.

### Access decision

```text
resource is active AND passenger tier >= minimum resource tier
  => ALLOWED / TIER_ELIGIBLE
resource is inactive
  => DENIED / RESOURCE_INACTIVE
otherwise
  => DENIED / INSUFFICIENT_TIER
```

A denial is a successful business decision rather than an HTTP authorization failure. The decision
is persisted before it is returned.

## Useful API routes

| Actor     | Method and route                            | Purpose                                 |
| --------- | ------------------------------------------- | --------------------------------------- |
| Crew Lead | `POST /api/passengers`                      | Create a passenger                      |
| Crew Lead | `PATCH /api/passengers/{id}/tier`           | Upgrade or downgrade membership         |
| Crew Lead | `POST /api/resources`                       | Provision a resource                    |
| Crew Lead | `PATCH /api/resources/{id}/decommission`    | Decommission without erasing history    |
| Passenger | `GET /api/passenger/resources`              | Discover inherited, active resources    |
| Passenger | `POST /api/passenger/resources/{id}/access` | Validate and record an attempt          |
| Passenger | `GET /api/passenger/history`                | View personal history                   |
| Crew Lead | `GET /api/access/reports/resources`         | Successful use by resource              |
| Crew Lead | `GET /api/access/reports/tiers`             | Allowed/denied totals by passenger tier |
| Crew Lead | `GET /api/access/reports/most-popular`      | Highest-demand resource                 |
| Crew Lead | `GET /api/access/reports/activity?limit=50` | Latest audit activity                   |

Swagger contains all request schemas and lets reviewers exercise these routes interactively.

## Quality checks

With PostgreSQL running:

```bash
npm run verify
```

Or run checks independently:

```bash
npm run lint
npm run test:cov
npm run test:e2e
npm run build

cd frontend
npm run lint
npm test
npm run build
```

The fast suite enforces 90% minimum coverage over domain services, policies, and guards. The e2e
suite creates a temporary PostgreSQL database, applies the real migration, and verifies HTTP
authorization, validation, lifecycle, access decisions, personal isolation, reports, seeded
inventory, and database audit immutability. GitHub Actions repeats backend and frontend verification
on every push and pull request.

## Engineering decisions and trade-offs

- Tier comparison lives in one independently tested domain function; enum string ordering is never
  relied on.
- Audit records snapshot passenger name, resource name, passenger tier, and required tier. Reports
  therefore remain historically correct after later profile or membership changes.
- Production configuration defaults `DATABASE_SYNCHRONIZE` to false. The initial reviewed migration
  creates schema, indexes, seed inventory, foreign keys, and an update/delete prevention trigger.
- Resource popularity counts successful access only. Denials remain visible in history and tier
  reports. Equal popularity is ordered by resource name for deterministic output.
- A REST latest-activity endpoint provides a current operational snapshot. A high-scale production
  version could add WebSockets or server-sent events without changing the audit model.
- Lists are intentionally unpaginated for the exercise's small ship manifest. Pagination would be
  needed for an unbounded production population.

## AI usage disclosure

AI assistance was used for specification structure, repetitive framework scaffolding, test-case
brainstorming, and review. Its output was checked against the original PDF, compiled under strict
TypeScript, linted, exercised against PostgreSQL, and reconciled with the documentation. Missing
passenger discovery, passenger-owned history, tier reporting, migration safety, CI, and test
coverage were identified during that review and then implemented and verified.

The architectural choices and trade-offs above are explicit so they can be discussed and defended
during review.
