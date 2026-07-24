# Requirement traceability

This matrix maps the original Everest Engineering brief to implementation and verification evidence.

| Assignment requirement                    | Implementation                                              | Verification                                                  |
| ----------------------------------------- | ----------------------------------------------------------- | ------------------------------------------------------------- |
| Exactly three Crew Leads                  | Fixed, deeply frozen manifest and administrative guard      | Crew Lead service/guard unit tests; authorization e2e         |
| Manage passenger profiles                 | Passenger controller and service                            | Validation, normalization, duplication, and authorization e2e |
| Upgrade or downgrade membership           | `PATCH /api/passengers/{id}/tier`                           | Passenger service unit test                                   |
| Provision/decommission resources          | Resource controller and service                             | Resource service unit tests; lifecycle e2e                    |
| Minimum membership per resource           | `SpaceshipResource.minimumTier`                             | Access policy and discovery tests                             |
| Base ship inventory                       | Initial migration seeds seven resources from the brief      | Migration-backed e2e asserts inventory                        |
| Passenger resource discovery              | `GET /api/passenger/resources`                              | Silver/Platinum inheritance and active filtering e2e          |
| Higher tiers inherit lower access         | Central `meetsMinimumTier` policy                           | Full tier matrix unit tests                                   |
| Validate access before use                | Passenger access endpoint and `AccessPolicyService`         | Allowed, insufficient-tier, and inactive-resource tests       |
| Record every allowed/denied valid attempt | `UsageRecord` snapshot persisted before response            | Decision e2e and access service unit tests                    |
| Passenger personal history                | Header-scoped `GET /api/passenger/history`                  | Cross-passenger isolation e2e                                 |
| Crew Lead activity oversight              | Crew history and latest-activity report                     | Guard and report e2e                                          |
| Reports grouped by passenger level        | `GET /api/access/reports/tiers`                             | Numeric totals and all-tier output tests                      |
| High-demand resource analytics            | Resource usage and most-popular reports                     | Access report unit tests and e2e                              |
| Immutable audit history                   | No mutation API plus PostgreSQL mutation-prevention trigger | Direct database deletion rejection e2e                        |

## Evaluation-quality evidence

- Strict TypeScript and ESLint
- Domain services, policies, and guards held above a 90% coverage threshold
- Real PostgreSQL e2e suite using the reviewed migration
- Backend and frontend CI jobs
- Multi-stage, non-root Docker image
- Environment-based configuration and explicit CORS allow-list
- Swagger/OpenAPI interactive documentation
- Stable 400/401/404/409 behavior for tested failure paths
