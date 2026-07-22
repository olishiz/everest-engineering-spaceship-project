# Spaceship X26 — Passenger Resource Management

A production-minded REST API for managing spaceship passengers, membership-gated resources, and auditable access attempts. Built as the Everest Engineering coding exercise using TypeScript, NestJS, PostgreSQL, TypeORM, Jest, and Swagger.

## What it demonstrates

- Explicit domain modelling and SOLID service boundaries
- Silver → Gold → Platinum access inheritance
- Exactly three fixed Crew Lead administrators
- Passenger membership upgrades and downgrades
- Resource provisioning and idempotent decommissioning
- Immutable audit records for allowed **and denied** access
- Passenger history, per-resource usage, and most-popular-resource reports
- Strict validation, stable error semantics, tests, Docker, and CI

## Quick start

Prerequisites: Node.js 22+, npm, and Docker.

```bash
cp .env.example .env
docker compose up -d postgres
npm install
npm run start:dev
```

Open Swagger at [http://localhost:3000/docs](http://localhost:3000/docs). API routes use the `/api` prefix.

Administrative endpoints require one of these `x-crew-lead-id` values:

```text
00000000-0000-4000-8000-000000000001
00000000-0000-4000-8000-000000000002
00000000-0000-4000-8000-000000000003
```

## Example workflow

1. Create a passenger with `POST /api/passengers`.
2. Provision a resource with `POST /api/resources`.
3. Attempt access with `POST /api/access/attempts`.
4. View audit history at `GET /api/access/passengers/{id}/history`.
5. View demand at `GET /api/access/reports/resources`.

Swagger contains request schemas and provides an interactive client.

## Access decision

```text
resource is active AND passenger tier >= minimum resource tier
  => ALLOWED / TIER_ELIGIBLE
otherwise
  => DENIED / RESOURCE_INACTIVE or INSUFFICIENT_TIER
```

The API returns denied access as a normal business decision rather than an HTTP authorization error. It first persists the decision, which guarantees a complete audit trail.

## Quality checks

```bash
npm run lint
npm test
npm run test:cov
npm run build
```

GitHub Actions runs lint, tests, and build on every push and pull request.

## Specification

This repository follows a lightweight GitHub Spec Kit structure:

- [Constitution](.specify/memory/constitution.md)
- [Feature specification](specs/001-passenger-resource-management/spec.md)
- [Implementation plan](specs/001-passenger-resource-management/plan.md)
- [Task breakdown](specs/001-passenger-resource-management/tasks.md)

## Assumptions and trade-offs

- A required Crew Lead header stands in for authentication. An identity provider, tokens, and permissions would be the next production integration.
- Crew Leads are a fixed manifest because the assignment requires exactly three. No API can create a fourth.
- Audit records snapshot names so reports remain intelligible after domain data changes.
- Successful attempts define resource popularity; denied attempts remain visible in passenger history.
- Equal popularity is resolved by resource name, making results deterministic.
- TypeORM synchronization defaults to true for easy evaluation. Production deployments should use reviewed migrations and set `DATABASE_SYNCHRONIZE=false`.

## AI usage disclosure

AI assistance was used to structure the specification, scaffold repetitive framework code, and identify test cases. The implementation was manually reviewed against the business rules, compiled under strict TypeScript, linted, and tested. Architectural choices, assumptions, naming, and error behaviour remain deliberate engineering decisions that can be explained and defended.
