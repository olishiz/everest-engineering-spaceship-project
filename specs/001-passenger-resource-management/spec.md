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

A passenger can use an active resource when their tier meets or exceeds the resource minimum.

**Acceptance criteria**

- Eligible access is allowed.
- Insufficient membership or an inactive resource is denied.
- Every allowed or denied attempt creates an immutable audit record with a reason.

### US4 — Review usage (P2)

A Crew Lead can view passenger history, usage grouped by resource, and the most popular resource.

**Acceptance criteria**

- History is chronological and includes denied attempts.
- Popularity counts successful access only.
- A tie is resolved deterministically by resource name.

## System Invariants

- Exactly three seeded Crew Leads exist; runtime creation of a fourth is unsupported.
- Tier rank is `SILVER < GOLD < PLATINUM`.
- Audit records are never updated or deleted by the application.

## Assumptions

- Authentication is represented by a required `x-crew-lead-id` header for administrative endpoints; production identity-provider integration is outside the exercise.
- Crew Leads are seeded from deterministic IDs at startup.
- Reports count successful access unless explicitly requesting full history.
