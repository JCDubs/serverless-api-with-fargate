# ADR 0001: Orders compute and persistence

## Status

Accepted

## Context

This repository is a serverless-first platform. The Orders application is an explicit exception that must run as a long-lived ECS Fargate process behind a private network boundary. Supporting capabilities should remain managed/serverless.

The GitHub repository description mentions PostgreSQL. The architecture standard in `docs/ARCHITECTURE.md` prefers DynamoDB unless relational semantics are required.

## Decision

- Run the Orders API as an ECS Fargate service in private subnets.
- Expose the service only through an internet-facing Application Load Balancer.
- Persist orders in a single-table DynamoDB design keyed by access patterns.
- Publish `OrderCreated`, `OrderConfirmed`, and `OrderCancelled` facts to a custom EventBridge bus.
- Authenticate callers with Amazon Cognito JWTs.
- Use HTTP on the ALB in environments without an ACM certificate. Production should supply `certificateArn` for HTTPS.

## Consequences

- Tasks have no public IP addresses and accept traffic only from the ALB security group.
- DynamoDB and EventBridge keep supporting infrastructure serverless.
- Downstream inventory, fulfilment, and notification consumers can subscribe to EventBridge without coupling to the Orders process.
- Non-production environments use a single NAT Gateway as an explicit cost/availability trade-off.
- PostgreSQL is not introduced because current access patterns do not require relational queries or transactions beyond optimistic concurrency.
