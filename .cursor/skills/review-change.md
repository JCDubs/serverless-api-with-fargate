---
name: review-change
description: Use before considering a code change complete.
---

# Review Change

Check the change against all of the following.

## Behavior

- Requirement is satisfied.
- Edge/failure behavior is understood.

## TDD

- Tests preceded implementation where applicable.
- Tests were not weakened.
- Tests cover observable behavior.

## Architecture

- Ports/adapters boundaries are preserved.
- Dependencies point inward.
- No vendor/framework types leak into domain logic.

## Clean code

- Names are clear.
- Responsibilities are cohesive.
- Complexity and duplication are reasonable.

## Testing honeycomb

- Domain logic has focused unit coverage.
- Changed boundaries have integration coverage.
- Changed contracts have contract coverage.
- E2E coverage remains focused.

## AWS

- Least privilege.
- Idempotency/retries/timeouts.
- Failure handling.
- Concurrency/backpressure.
- Observability.
- Security.
- Cost.
- IaC.

## Convention

- Existing structure/naming was followed.
- New configuration was not added unnecessarily.
- No competing convention was introduced.

## Definition of done

Run all applicable checks and report any unresolved risks.
