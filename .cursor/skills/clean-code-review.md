---
name: clean-code-review
description: Use when reviewing or refactoring code for maintainability, SOLID, clarity, and architectural integrity.
---

# Clean Code Review

Review in this order:

## Correctness

Does the code satisfy observable behavior and preserve invariants?

## Architecture

- Are dependencies inward?
- Are vendor details isolated in adapters?
- Are ports narrow?
- Is business logic outside handlers/controllers?

## Cohesion

Does each module have one coherent responsibility?

## Naming

Do names communicate business intent rather than implementation mechanics?

## Complexity

Reduce:

- nested conditions
- long functions
- duplicated rules
- excessive indirection
- hidden state
- unnecessary abstractions

## Interfaces

Use interfaces at meaningful boundaries.

Avoid interface-per-class ceremony.

## Configuration

Ask whether configuration can be eliminated through convention, types, structure, or defaults.

## Tests

Ensure tests assert behavior and support safe refactoring.
