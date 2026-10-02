---
name: tdd
description: Use when implementing behavior with strict RED-GREEN-REFACTOR test-driven development.
---

# Test-Driven Development

## RED

Write one failing test representing the next behavior increment.

The failure should be:

- deterministic
- attributable to missing/incorrect behavior
- meaningful

Avoid writing many speculative tests before implementing anything.

## GREEN

Write the smallest production change that satisfies the test.

Do not optimize or generalize prematurely.

## REFACTOR

Once green:

- remove duplication
- improve names
- simplify control flow
- extract concepts only when justified
- improve boundaries and types

Do not change observable behavior during refactoring.

## Repeat

Implement behavior in small vertical increments.

When a test requires heavy mocking, reconsider the design:

- Is the unit too coupled?
- Is a port missing?
- Is this really an integration test?
- Can a fake replace implementation-detail mocks?

## Completion

A TDD cycle is incomplete until the relevant integration/contract confidence exists for affected boundaries.
