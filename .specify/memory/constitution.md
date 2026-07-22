# Spaceship X26 Constitution

## Principles

1. **Business rules are explicit.** Access decisions and the three-Crew-Lead invariant live in domain services and are covered by tests.
2. **Tests guide delivery.** Every behaviour in the specification has a unit or API-level test.
3. **Simple boundaries.** Controllers translate HTTP, services coordinate use cases, repositories persist state, and entities protect domain state.
4. **Auditability is mandatory.** Every access attempt is immutable and records the decision and reason.
5. **Operational quality counts.** Inputs are validated, failures have stable HTTP semantics, configuration comes from the environment, and CI verifies every change.

## Engineering Standards

- TypeScript strict mode is required.
- Public APIs are documented with OpenAPI.
- Comments explain business intent or non-obvious trade-offs, not syntax.
- Historical records must remain meaningful after passengers or resources change.
- Changes must be small, reviewable, and use conventional commit messages.

## Governance

This constitution takes precedence over convenience. Any exception must be recorded in the README with its rationale and impact.

**Version:** 1.0.0  
**Ratified:** 2026-07-22
