# Engineering Agent Instructions

## Purpose

This repository is developed using disciplined engineering practices. All human- and AI-generated changes must optimize for correctness, maintainability, testability, security, operability, simplicity, and predictable conventions.

The default engineering approach is:

- Test-Driven Development (TDD)
- Clean Code
- SOLID principles
- Coding through interfaces at meaningful architectural boundaries
- Hexagonal Architecture / Ports and Adapters
- Testing Honeycomb
- AWS Well-Architected principles
- Serverless-first architecture, but not serverless-only
- Convention over configuration
- Infrastructure as Code
- Small, reviewable, reversible changes

These are working constraints, not suggestions.

---

## 1. Required development workflow

For every non-trivial behavior change:

1. Understand the requirement and existing behavior.
2. Identify the domain behavior and affected architectural boundaries.
3. Inspect existing tests before changing production code.
4. Write or modify a failing test first.
5. Run the smallest relevant test and confirm the expected failure.
6. Implement the minimum code necessary to make the test pass.
7. Run the test and confirm it passes.
8. Refactor while keeping tests green.
9. Add or update integration and contract tests where boundaries are affected.
10. Run type checking, linting, formatting, static analysis, and security checks.
11. Run the broader relevant test suite.
12. Review architecture, security, reliability, observability, cost, performance, and operational implications.
13. Summarize the change, tests executed, design decisions, and remaining risks.

Do not skip the failing-test step unless the change cannot reasonably be represented by a behavioral test, such as pure documentation or mechanical configuration changes.

If TDD is impractical, state why in the task summary.

Never weaken, delete, skip, or rewrite a valid test merely to make implementation code pass.

---

## 2. Architecture: Ports and Adapters

Use Hexagonal Architecture / Ports and Adapters.

### Domain layer

The domain contains business concepts, rules, policies, entities, value objects, and domain services.

The domain:

- MUST NOT import AWS SDK packages.
- MUST NOT import web frameworks.
- MUST NOT depend on databases, queues, HTTP, Lambda, API Gateway, file systems, or vendor-specific infrastructure.
- MUST NOT depend on concrete adapter implementations.
- SHOULD use domain-specific types instead of primitive obsession.
- SHOULD enforce invariants close to the domain model.
- SHOULD remain deterministic where practical.

### Application layer

The application layer coordinates use cases.

The application layer:

- Defines use cases and application services.
- Defines outbound ports required by use cases.
- Depends on domain abstractions.
- MUST NOT depend on concrete infrastructure adapters.
- SHOULD coordinate transactions, authorization decisions, orchestration, and domain interactions.
- SHOULD keep infrastructure concerns outside application logic.

### Ports

Ports are explicit interfaces representing capabilities required by or offered by the application.

Examples:

- `OrderRepository`
- `PaymentGateway`
- `EventPublisher`
- `Clock`
- `IdGenerator`
- `InventoryService`
- `CreateOrderUseCase`

Prefer narrow, capability-focused interfaces.

Do not create interfaces mechanically for every class. Introduce an interface when it:

- represents an architectural boundary
- supports substitution
- protects the domain/application from infrastructure concerns
- materially improves testability
- expresses a stable capability or contract

### Adapters

Adapters connect ports to external systems.

Examples:

- DynamoDB repository
- PostgreSQL repository
- EventBridge publisher
- SQS consumer
- API Gateway/Lambda HTTP handler
- Step Functions integration
- third-party API client

Adapters MAY depend on vendor libraries. Domain and application code MUST NOT.

### Dependency direction

Dependencies point inward:

`delivery/infrastructure -> application -> domain`

Concrete adapters implement ports defined toward the inside of the architecture.

Composition roots may know about both abstractions and implementations in order to wire dependencies.

---

## 3. Convention over configuration

Prefer conventions that make the correct implementation obvious and reduce per-feature configuration.

Architecture, code organization, tests, deployment structure, and dependency wiring SHOULD be discoverable from repository structure and naming.

Configuration MUST NOT be used to hide architectural decisions that can be expressed in code, types, module boundaries, naming, or directory conventions.

### Configuration is appropriate for

- environment-specific values
- resource identifiers
- endpoints
- feature flags
- capacity limits
- deployment parameters
- external integration settings
- secrets references
- operational thresholds

### Configuration is NOT a substitute for

- dependency direction
- architectural boundaries
- naming standards
- test placement
- code organization
- service responsibilities
- domain behavior
- API contracts
- coding conventions

### Default repository conventions

Unless the existing repository has an established equivalent convention, prefer:

```text
src/
  domain/
  application/
    ports/
    use-cases/
  adapters/
    inbound/
    outbound/
  infrastructure/
  composition/
tests/
  unit/
  integration/
  contract/
  e2e/
```

For feature-oriented repositories, the same layers may exist inside each bounded context or feature.

Prefer predictable naming:

- `*.port.ts` for ports
- `*.adapter.ts` for adapter implementations when the suffix adds clarity
- `*.repository.ts` for repository ports or abstractions
- `*.handler.ts` for delivery handlers
- `*.use-case.ts` for application use cases
- `*.spec.ts` or the repository-standard equivalent for tests

Do not introduce parallel conventions for the same concept.

Prefer defaults that require no configuration over configurable mechanisms with many options.

When adding a new component, follow the dominant repository convention before inventing a new one.

---

## 4. Serverless-first, not serverless-only

Prefer serverless and managed AWS services when they satisfy the workload's functional and non-functional requirements with acceptable complexity and cost.

Default candidates include:

- AWS Lambda
- API Gateway
- EventBridge
- SQS
- SNS
- Step Functions
- DynamoDB
- S3
- CloudFront
- Cognito
- managed observability and security services

Do NOT force a serverless service when workload characteristics make another model more appropriate.

Consider ECS/Fargate, EKS, EC2, RDS/Aurora, OpenSearch, streaming platforms, or other services when justified by factors such as:

- sustained compute utilization
- long-running processes
- specialized runtime or OS requirements
- low-latency connection-oriented workloads
- high-throughput stateful processing
- database/query requirements not suited to serverless data stores
- predictable workloads where alternate compute is materially simpler or more economical
- vendor/application constraints

Architecture decisions MUST be based on requirements and trade-offs rather than ideology.

For significant service-selection decisions, document:

- workload characteristics
- alternatives considered
- reliability implications
- security implications
- operational complexity
- performance implications
- cost implications
- reversibility and migration path

---

## 5. AWS engineering expectations

Apply AWS Well-Architected principles:

- Operational Excellence
- Security
- Reliability
- Performance Efficiency
- Cost Optimization
- Sustainability

Additionally:

- Use least-privilege IAM.
- Prefer short-lived credentials and IAM roles.
- Encrypt data in transit and at rest where supported.
- Store secrets in an appropriate managed secret/configuration service; never hard-code secrets.
- Treat retries and duplicate delivery as normal distributed-system behavior.
- Design event consumers and mutation handlers to be idempotent where duplicate invocation is possible.
- Configure explicit timeouts.
- Use bounded retries with backoff/jitter where appropriate.
- Use DLQs or failure destinations where asynchronous failure needs isolation and recovery.
- Emit structured logs.
- Propagate correlation or trace identifiers.
- Publish meaningful metrics.
- Define actionable alarms for production-critical behavior.
- Prefer managed services where they reduce undifferentiated operational work.
- Prefer asynchronous decoupling where eventual consistency is acceptable.
- Avoid distributed monoliths made of tightly coupled synchronous services.
- Use Infrastructure as Code for cloud resources.
- Do not manually create production infrastructure as part of normal delivery.
- Validate IAM, networking, encryption, retention, backup, restore, and failure behavior.
- Consider quotas, throttling, concurrency, backpressure, and downstream capacity.
- Tag resources consistently for ownership, environment, product, and cost allocation.
- Prefer secure defaults.
- Prefer private networking only when required; do not add VPC complexity by habit.
- Keep Lambda handlers thin and delegate business behavior inward.
- Reuse SDK clients and expensive resources across Lambda invocations where safe.
- Avoid relying on in-memory state between Lambda invocations.
- Use Step Functions when orchestration, retries, branching, or long-running workflow state would otherwise become custom control-flow infrastructure.

---

## 6. Clean Code

Code should communicate intent clearly.

Requirements:

- Use meaningful names.
- Keep functions small and cohesive.
- Keep classes/modules focused on one reason to change.
- Avoid hidden side effects.
- Prefer explicit dependencies.
- Prefer immutable data when practical.
- Avoid boolean parameters that obscure behavior.
- Avoid deeply nested control flow.
- Avoid duplicated business logic.
- Avoid speculative abstractions.
- Avoid premature optimization.
- Prefer composition over inheritance.
- Make illegal states difficult or impossible to represent.
- Treat comments as explanations of why, not substitutes for clear code.
- Remove dead code rather than commenting it out.

Follow the Boy Scout Rule: leave touched code at least as understandable as you found it, without turning a focused change into an unrelated rewrite.

---

## 7. SOLID and interfaces

Follow SOLID pragmatically.

- Single Responsibility: modules should have a cohesive purpose.
- Open/Closed: prefer extension through stable abstractions over repeated conditional modification.
- Liskov Substitution: implementations must preserve interface contracts.
- Interface Segregation: consumers should depend only on capabilities they use.
- Dependency Inversion: domain/application policies depend on abstractions, not infrastructure details.

Code against ports at architectural boundaries.

Do not introduce an interface solely to satisfy a stylistic rule when there is no meaningful boundary or substitutable capability.

---

## 8. Testing strategy: Testing Honeycomb

Use a testing honeycomb rather than a testing pyramid for service-oriented and serverless systems.

The preferred confidence distribution is:

1. Strong integration/component coverage around service and adapter boundaries.
2. Focused unit tests for domain logic and edge cases.
3. Contract tests where independently evolving services or APIs interact.
4. A small number of end-to-end tests for critical journeys.

### Unit tests

Use unit tests heavily for:

- domain rules
- value objects
- calculations
- policies
- transformations
- complex branching
- error semantics

Unit tests SHOULD:

- be fast
- be deterministic
- test behavior rather than implementation details
- avoid unnecessary mocks
- use fakes/stubs at architectural ports where appropriate

### Integration/component tests

Integration tests are a first-class part of the test suite.

Use them to test:

- adapters against realistic dependencies
- serialization/deserialization
- persistence behavior
- event schemas
- infrastructure configuration assumptions
- service entry points with real composition
- authorization and security-sensitive boundaries

Prefer high-fidelity local or ephemeral test environments where practical.

Do not mock the component under test's most important integration boundary if doing so removes meaningful confidence.

### Contract tests

Use consumer/provider or schema contract tests when independently deployable components exchange:

- HTTP APIs
- events
- messages
- shared schemas

Contract tests must detect incompatible changes before production deployment.

### End-to-end tests

Keep E2E tests focused on critical user/business journeys.

Do not attempt to cover all logic with E2E tests.

---

## 9. Test quality

Tests MUST:

- have meaningful names
- use Arrange/Act/Assert or Given/When/Then structure where it improves readability
- test observable behavior
- cover happy paths, important edge cases, and failure paths
- avoid dependence on execution order
- avoid arbitrary sleeps
- avoid external shared state where practical

A passing test suite with weak assertions is not acceptable.

---

## 10. Observability

Observability is part of design, not an afterthought.

For production paths:

- use structured logging
- avoid logging secrets, credentials, tokens, or unnecessary personal data
- use correlation IDs where requests/events cross boundaries
- emit business and technical metrics where meaningful
- instrument traces across service boundaries where useful
- make failures diagnosable from telemetry
- create alarms around user-impacting symptoms and service objectives
- ensure asynchronous failures are observable and recoverable

---

## 11. Error handling

- Use domain-specific/application-specific error types where useful.
- Do not swallow errors silently.
- Translate infrastructure errors at adapter boundaries.
- Do not leak vendor-specific errors into domain logic.
- Distinguish retryable from non-retryable failure where appropriate.
- Avoid exception-driven control flow for expected domain outcomes.
- Preserve enough context for diagnosis without exposing secrets.

---

## 12. API and event design

- Prefer explicit schemas.
- Treat public APIs and event schemas as contracts.
- Make backward compatibility an explicit decision.
- Validate input at inbound boundaries.
- Keep domain models separate from transport DTOs when coupling would be harmful.
- Version contracts only when required; prefer compatible evolution.
- Design events as facts that have happened, not imperative RPC messages, unless request/reply semantics are intentional.

---

## 13. Infrastructure as Code

Cloud resources MUST be defined using the repository-standard IaC tooling.

Infrastructure changes should:

- be reviewable
- be repeatable
- be environment-independent except for explicit parameters
- use stable naming/tagging conventions
- apply least privilege
- include logging/monitoring defaults
- avoid unnecessary customization
- use shared constructs/modules only where they encode a meaningful organizational convention

Prefer convention-driven reusable constructs over large configuration matrices.

---

## 14. Definition of Done

A change is not complete until:

- behavior is implemented
- relevant tests were written first where applicable
- tests pass
- relevant integration/contract tests pass
- static checks pass
- architecture boundaries are preserved
- naming and structure follow repository conventions
- configuration has not replaced a code/architecture convention unnecessarily
- security implications were considered
- reliability/failure behavior was considered
- observability is adequate
- infrastructure changes are represented as code
- documentation is updated where behavior, architecture, or operating procedure changed
- no unexplained dead code, TODOs, disabled tests, or temporary workarounds remain

---

## 15. Agent behavior

Before introducing a new abstraction, framework, dependency, AWS service, configuration mechanism, or architectural pattern:

1. Search the repository for the established convention.
2. Reuse the existing convention if it is suitable.
3. Prefer the simplest solution that preserves architecture.
4. Add a new convention only when the existing approach is materially insufficient.
5. If a significant new convention is introduced, document it.

When uncertain, optimize for:

1. correctness
2. simplicity
3. clarity
4. testability
5. operability
6. security
7. maintainability
8. performance
9. cost

Do not optimize for cleverness.
