---
name: aws-architecture-review
description: Use when selecting or reviewing AWS services, deployment architecture, scalability, reliability, security, observability, or cost.
---

# AWS Architecture Review

Evaluate architecture using:

- Operational Excellence
- Security
- Reliability
- Performance Efficiency
- Cost Optimization
- Sustainability

## Serverless-first check

First evaluate managed/serverless options.

Do not force them when workload requirements make another service a better fit.

## Workload questions

Determine:

- request/event volume
- burstiness
- execution duration
- latency requirements
- throughput requirements
- state requirements
- consistency requirements
- connection behavior
- data access patterns
- resilience objectives
- compliance/security constraints
- cost sensitivity

## Distributed-systems review

Check:

- duplicate delivery
- idempotency
- ordering
- retries
- timeout budgets
- backpressure
- throttling
- poison messages
- partial failure
- dead-letter handling
- recovery/replay

## Security review

Check:

- least privilege
- trust boundaries
- encryption
- secrets
- network exposure
- authentication
- authorization
- auditability

## Operations review

Check:

- structured logging
- metrics
- tracing
- alarms
- runbooks
- failure visibility
- deployment rollback
- IaC
- ownership

## Decision record

For meaningful architectural choices document:

- context
- chosen approach
- alternatives
- trade-offs
- consequences
- conditions that would cause reconsideration
