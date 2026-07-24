# Implementation Plan

## Architecture

A modular NestJS REST API backed by PostgreSQL and TypeORM. Each feature exposes HTTP controllers and application services; TypeORM repositories provide persistence.

## Modules

- `crew-leads`: seeded administrator identities and authorization guard.
- `passengers`: passenger lifecycle and tier changes.
- `resources`: provisioning and decommissioning.
- `access`: access policy, immutable usage records, and reports.

## Key Decisions

- A numeric tier-rank function makes inheritance explicit and independently testable.
- Denials are stored before returning the access decision, so audit history is complete.
- Audit records snapshot names and tiers so later membership changes do not rewrite history.
- Passenger self-service identity is taken from a header rather than a path parameter.
- Access attempts return a decision object instead of using HTTP 403 for membership denial; denial is a valid business outcome, not an API failure.
- A reviewed migration creates schema, indexes, seed inventory, and database audit protections.
- Database synchronization defaults to false.

## Verification

- Unit tests: tier policy, services, authorization guards, error mapping, and reports.
- End-to-end tests: validation, authorization, lifecycle, decisions, and reports.
- Database checks: migration execution, seed inventory, and immutable audit trigger.
- Static checks: strict TypeScript, ESLint, Prettier, backend/frontend builds, and CI.
