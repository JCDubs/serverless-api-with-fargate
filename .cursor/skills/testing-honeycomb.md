---
name: testing-honeycomb
description: Use when planning or reviewing test coverage for a service, adapter, API, event workflow, or feature.
---

# Testing Honeycomb

Build confidence primarily through service/component integration tests, supported by focused unit tests and a small E2E layer.

## Unit tests

Best for:

- domain rules
- calculations
- value objects
- policies
- edge cases
- error semantics

Avoid implementation-detail mocking.

## Integration/component tests

Best for:

- real persistence behavior
- adapters
- serialization
- messaging
- handler composition
- authorization boundaries
- infrastructure assumptions
- third-party client behavior through controlled test doubles/sandboxes

Favor realistic dependencies.

## Contract tests

Use for independently evolving:

- HTTP consumers/providers
- event producers/consumers
- message schemas

Ensure breaking contract changes fail before deployment.

## E2E tests

Keep these few and valuable.

Cover:

- critical business journeys
- essential deployment wiring
- high-value cross-system flows

Do not use E2E tests as the primary place for business-rule coverage.
