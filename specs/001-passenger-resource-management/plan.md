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
- Access attempts return a decision object instead of using HTTP 403 for membership denial; denial is a valid business outcome, not an API failure.
- Database synchronization is configuration-controlled for this exercise. Production would use reviewed migrations and set it to false.

## Verification

- Unit tests: tier policy and application services.
- End-to-end tests: validation, authorization, lifecycle, decisions, and reports.
- Static checks: strict TypeScript, ESLint, Prettier, and CI.
