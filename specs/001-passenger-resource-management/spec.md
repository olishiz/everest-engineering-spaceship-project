# Feature Specification: Passenger Resource Management

## Goal

Manage passengers and spaceship resources while enforcing membership-based access and retaining a complete usage audit trail.

## Actors

- **Crew Lead:** one of exactly three administrators who manages passengers and resources and views reports.
- **Passenger:** a Silver, Gold, or Platinum member who attempts to use resources.

## User Stories

### US1 — Manage passengers (P1)

A Crew Lead can create a passenger, inspect passengers, and upgrade or downgrade membership.

**Acceptance criteria**

- A passenger has a unique email and one membership tier.
- Silver, Gold, and Platinum form an ordered hierarchy.
- Invalid or duplicate passenger data is rejected.

### US2 — Manage resources (P1)

A Crew Lead can provision a resource with a minimum tier and later decommission it.

**Acceptance criteria**

- A resource has a unique name, minimum tier, and active state.
- Decommissioning is idempotent and does not erase history.

### US3 — Access a resource (P1)

A passenger can discover and use active resources when their tier meets or exceeds the resource
minimum.

**Acceptance criteria**

- Discovery returns only active resources available through tier inheritance.
- Passenger identity scopes discovery, access, and history to the caller.
- Eligible access is allowed.
- Insufficient membership or an inactive resource is denied.
- Every allowed or denied attempt creates an immutable audit record with a reason.

### US4 — Review personal usage (P2)

A passenger can review their own access history without selecting another passenger by path.

**Acceptance criteria**

- History is chronological and includes denied attempts.
- One passenger cannot retrieve another passenger's self-service history.

### US5 — Review operational usage (P2)

A Crew Lead can view recent activity, passenger history, usage grouped by passenger tier or
resource, and the most popular resource.

**Acceptance criteria**

- Tier reports include total, allowed, and denied attempts for all three tiers.
- Popularity counts successful access only.
- A tie is resolved deterministically by resource name.

## System Invariants

- Exactly three seeded Crew Leads exist; runtime creation of a fourth is unsupported.
- Tier rank is `SILVER < GOLD < PLATINUM`.
- Audit records snapshot relevant names and tiers and cannot be updated or deleted in PostgreSQL.

## Assumptions

- Authentication is represented by a required `x-crew-lead-id` header for administrative endpoints; production identity-provider integration is outside the exercise.
- Passenger identity is represented by a required `x-passenger-id` header for self-service
  endpoints.
- Crew Leads are seeded from deterministic IDs at startup.
- Reports count successful access unless explicitly requesting full history.
