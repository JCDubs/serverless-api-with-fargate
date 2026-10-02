# Architecture and Engineering Conventions

This document complements `AGENTS.md` and is intended as a durable reference for contributors and agents.

## Architectural model

Use Ports and Adapters with inward dependency direction.

```text
Inbound Adapter
      |
      v
Application / Use Case
      |
      v
    Domain

Application -> Outbound Port <- Outbound Adapter
```

Infrastructure and delivery mechanisms are replaceable details.

## Suggested source layout

```text
src/
  domain/
    entities/
    value-objects/
    services/
    errors/
  application/
    use-cases/
    ports/
  adapters/
    inbound/
      http/
      events/
      queues/
    outbound/
      persistence/
      messaging/
      external-services/
  infrastructure/
  composition/
```

Feature-oriented layouts are acceptable when they preserve the same dependency rules.

## Suggested test layout

```text
tests/
  unit/
  integration/
  contract/
  e2e/
```

Co-located tests are also acceptable if that is the established repository convention.

## Convention rules

Prefer one obvious location for each concern.

Prefer one naming scheme for each concept.

Prefer code and types over configuration for stable decisions.

Configuration should express deployment/runtime variation, not architecture.

## Serverless first

Evaluate managed and serverless AWS services first.

Select non-serverless services when workload needs justify them.

The expected outcome is not "all serverless"; it is "lowest justified operational burden with sound trade-offs."

## Decision records

Create an ADR or equivalent for significant decisions that:

- introduce a new platform/service category
- establish a new cross-cutting convention
- intentionally violate a normal architectural rule
- create an irreversible or expensive migration path
