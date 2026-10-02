---
name: implement-feature
description: Use when implementing or changing production behavior in this repository.
---

# Implement Feature

Follow this sequence.

## 1. Discover

Read:

- `AGENTS.md`
- relevant `.cursor/rules/`
- nearby production code
- nearby tests
- relevant architecture docs

Determine:

- affected domain behavior
- inbound adapter
- use case/application service
- required outbound ports
- concrete adapters
- AWS resources involved
- existing repository conventions

## 2. Define behavior

Express the requirement as observable behavior.

Identify:

- success behavior
- validation behavior
- domain failures
- infrastructure failures
- retries/duplicates
- security implications
- telemetry expectations

## 3. RED

Write the smallest failing behavioral test first.

Prefer:

- domain unit test for business rules
- application test using fakes at ports
- integration test for adapter/infrastructure behavior
- contract test for API/event changes

Run it and confirm the expected failure.

## 4. GREEN

Implement the minimum code required.

Maintain dependency direction:

`adapter -> application -> domain`

Do not introduce infrastructure dependencies into the domain/application layers.

## 5. REFACTOR

Improve:

- names
- cohesion
- duplication
- boundaries
- types
- error semantics

Keep tests green.

## 6. Integration confidence

If a boundary changed, add or update realistic integration tests.

If a public API/event contract changed, update contract tests.

## 7. AWS review

Check:

- least privilege
- idempotency
- timeouts/retries
- DLQ/failure handling
- concurrency/backpressure
- observability
- encryption/secrets
- cost implications
- IaC

## 8. Convention review

Do not introduce a new configuration mechanism when repository structure or naming can express the behavior.

Match established file placement and naming.

## 9. Finish

Run relevant checks and summarize:

- behavior changed
- tests added/updated
- commands run
- architectural decisions
- AWS implications
- known risks
