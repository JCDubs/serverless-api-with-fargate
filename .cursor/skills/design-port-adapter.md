---
name: design-port-adapter
description: Use when designing a new use case, integration, repository, API, event consumer, or external dependency.
---

# Design a Port and Adapter

## Start from the use case

Define the business/application capability before choosing AWS services or libraries.

Describe:

- actor
- input
- output
- domain behavior
- failure modes
- transactional needs
- consistency needs

## Identify ports

Create only ports needed by the use case.

Ports should:

- use domain/application language
- expose narrow capabilities
- avoid vendor types
- avoid leaking transport/storage details

## Choose adapters

Select adapters after the port contract is clear.

Examples:

- DynamoDB adapter
- EventBridge adapter
- REST/HTTP adapter
- SQS adapter
- PostgreSQL adapter

## Composition

Wire dependencies at a composition root.

Keep construction/configuration out of domain/application code.

## Testing

- unit-test domain behavior
- application-test with fakes at ports
- integration-test adapters against realistic dependencies
- contract-test public APIs/events

## Convention

Place files according to repository conventions.

Do not introduce configurable adapter registries or dynamic plugin mechanisms unless the requirements genuinely demand runtime substitution.
