# Architecture priorities

Design and implement this solution using AWS Well-Architected principles.

The architecture must optimize across:

- Operational Excellence
- Security
- Reliability
- Performance Efficiency
- Cost Optimization
- Sustainability

Cost matters, but it must not override appropriate security, reliability, maintainability, or operational practices.

Do not optimize purely for the cheapest possible infrastructure.

Prefer a production-grade architecture with sensible defaults and documented trade-offs.

# Serverless-first architecture

This organization follows a:

> serverless-first, but not serverless-only

architecture strategy.

"Serverless-first" means:

Before introducing servers, containers, clusters, persistent compute, self-managed databases, brokers, or other always-running infrastructure, first evaluate whether an AWS serverless or fully managed service can satisfy the requirement.

Prefer managed/serverless AWS services when they provide the required functionality, reliability, security, performance, and operational characteristics.

Examples include:

- AWS Lambda
- Amazon API Gateway
- Amazon EventBridge
- Amazon SQS
- Amazon SNS
- AWS Step Functions
- Amazon DynamoDB
- Amazon S3
- Amazon CloudFront
- Amazon Cognito
- AWS Secrets Manager
- AWS Systems Manager Parameter Store
- Amazon CloudWatch
- AWS X-Ray
- AWS WAF

Do not introduce a containerized service when Lambda or another serverless compute service would satisfy the requirements cleanly.

Do not introduce RDS when DynamoDB or another serverless data technology satisfies the access patterns.

Do not introduce custom message brokers when EventBridge, SQS, or SNS satisfies the messaging requirements.

Do not implement custom workflow orchestration when Step Functions provides the required orchestration semantics.

AWS serverless design guidance should influence the architecture, including:

- stateless compute
- event-driven integration
- loose coupling
- idempotency
- explicit failure handling
- asynchronous communication where appropriate
- durable external state
- managed orchestration rather than custom orchestration code

# Fargate exception

The Orders application itself is intentionally being implemented using ECS Fargate.

Treat this as an explicit architecture decision rather than a signal that supporting components should also use containers.

Fargate should contain the long-running Orders application process.

Supporting capabilities should remain serverless or managed wherever practical.

For example:

```text
Internet
   |
   v
Application Load Balancer
   |
   v
ECS Fargate
Orders Service
   |
   +------> DynamoDB
   |
   +------> EventBridge
   |
   +------> SQS
   |
   +------> S3
   |
   +------> Secrets Manager
   |
   +------> CloudWatch
```

Do not create additional ECS services where Lambda, Step Functions, EventBridge, SQS, or another serverless service is better suited.

# Networking

Use AWS networking best practices.

The ECS/Fargate service must run in private subnets.

Fargate tasks must:

- NOT receive public IP addresses
- NOT be directly reachable from the public Internet
- be deployed across multiple Availability Zones
- use security groups with least-privilege rules

Use public subnets only for resources that genuinely require public Internet connectivity, such as an Internet-facing Application Load Balancer and NAT Gateways.

The expected topology is approximately:

```text
                         Internet
                            |
                            v
                   Internet Gateway
                            |
             +--------------+--------------+
             |                             |
             v                             v
      Public Subnet AZ-A            Public Subnet AZ-B

      Application Load              Application Load
        Balancer                      Balancer

      NAT Gateway                  NAT Gateway
             |                             |
             +--------------+--------------+
                            |
             +--------------+--------------+
             |                             |
             v                             v
      Private Subnet AZ-A           Private Subnet AZ-B

        ECS Fargate                    ECS Fargate
        Orders Task                    Orders Task
```

Do not expose ECS tasks directly to the Internet.

# High availability

Production infrastructure should span at least two Availability Zones where supported.

Avoid introducing a single-AZ dependency into an otherwise highly available application.

For production environments consider:

- multiple ECS tasks
- multiple private subnets
- multiple public subnets
- multi-AZ load balancing
- resilient outbound connectivity
- multi-AZ managed services

For NAT Gateway architecture, prefer one NAT Gateway per Availability Zone for production resilience unless there is an explicitly documented reason to accept the availability trade-off of a shared NAT Gateway.

Non-production environments may intentionally use a reduced topology when appropriate, but the difference should be explicit and convention-driven.

# VPC design

Create a VPC with:

```text
VPC
|
+-- Public Subnet AZ-A
|     +-- ALB
|     +-- NAT Gateway
|
+-- Public Subnet AZ-B
|     +-- ALB
|     +-- NAT Gateway
|
+-- Private Application Subnet AZ-A
|     +-- ECS/Fargate
|
+-- Private Application Subnet AZ-B
      +-- ECS/Fargate
```

Do not create database subnets unless a database requiring them is introduced.

Do not add unnecessary network tiers.

Use route tables explicitly and predictably.

Follow convention over configuration when generating network resources.

# Security groups

Use security groups as explicit trust boundaries.

Expected traffic should approximately follow:

```text
Internet
   |
 HTTPS :443
   |
   v
ALB Security Group
   |
application port only
   |
   v
ECS Security Group
```

The ECS security group should allow inbound traffic only from the ALB security group.

Do not permit:

```text
0.0.0.0/0 -> ECS application port
```

Do not expose:

- SSH
- debugging ports
- container management ports
- administrative endpoints

Use security-group references instead of broad CIDR rules where possible.

# Application Load Balancer

Use an Application Load Balancer for inbound HTTP/HTTPS traffic unless repository architecture already provides an appropriate alternative.

Use:

- HTTPS
- ACM-managed certificates
- HTTP-to-HTTPS redirect where appropriate
- appropriate TLS policies
- health checks
- access logging if required by operational/security standards

The ALB should route traffic to private Fargate tasks.

Do not expose the tasks themselves publicly.

# VPC endpoints

Evaluate VPC endpoints for AWS services accessed by the Fargate application.

Consider gateway endpoints for services such as:

- S3
- DynamoDB

Consider interface endpoints where they materially improve:

- security
- reliability
- network architecture
- traffic isolation

Do not create every possible VPC endpoint automatically.

Only introduce endpoints required by the workload or justified by architectural considerations.

Document the reasoning.

# Internet egress

Fargate tasks may require outbound Internet access for legitimate integrations.

Outbound traffic from private tasks should flow through the appropriate NAT Gateway unless a VPC endpoint or other private service integration removes that need.

Do not assign public IP addresses to ECS tasks simply to obtain outbound connectivity.

Review outbound requirements explicitly.

Do not assume unrestricted Internet egress is necessary.

# IAM

Apply least privilege throughout.

Separate:

- ECS task execution role
- application task role

The execution role should contain only permissions required by ECS/runtime infrastructure, such as:

- pulling images
- writing required logs
- retrieving deployment-time secrets where appropriate

The application task role should contain only permissions required by the Orders application.

Examples might include:

- specific DynamoDB table actions
- publishing to a specific EventBridge bus
- sending to specific SQS queues
- reading specific secrets

Avoid:

```text
Action: "*"
Resource: "*"
```

unless there is a documented AWS API limitation requiring it.

# Persistence

Prefer DynamoDB for Orders unless requirements demonstrate that another persistence model is materially better.

This is consistent with the serverless-first strategy.

Design DynamoDB from access patterns.

Potential access patterns include:

- create order
- retrieve order by ID
- list orders for a customer
- update order lifecycle state
- enforce optimistic concurrency

Avoid table scans for normal application behavior.

Use:

- conditional writes where appropriate
- optimistic locking/versioning where concurrent mutation is possible
- encryption
- point-in-time recovery for production where appropriate
- appropriate backup policies
- TTL for genuinely temporary data

Do not introduce RDS simply because relational persistence is familiar.

If relational semantics are genuinely required, document why DynamoDB is unsuitable before selecting Aurora/RDS.

# Event-driven architecture

Prefer events for cross-domain integration when synchronous coupling is unnecessary.

For example:

```text
Orders Service
     |
     | OrderCreated
     | OrderConfirmed
     | OrderCancelled
     v
 EventBridge
     |
     +-----------> Inventory
     |
     +-----------> Fulfilment
     |
     +-----------> Notifications
```

The Orders service must not need to know which downstream consumers exist.

Use explicit event schemas.

Treat events as contracts.

Design event consumers for:

- duplicate delivery
- retries
- partial failure
- eventual consistency
- out-of-order delivery where relevant

AWS's Serverless Lens explicitly recommends event-driven transactions and designing operations for failures and duplicate delivery.

# Messaging

Use SQS when durable queue semantics, backpressure, retries, buffering, or workload decoupling are required.

Use EventBridge when business events need routing to potentially multiple independent consumers.

Use SNS when its publish/subscribe semantics are specifically appropriate.

Do not treat these services as interchangeable.

Choose based on communication semantics.

For queues:

- configure DLQs where appropriate
- set sensible visibility timeouts
- configure redrive policies
- make consumers idempotent
- make failures observable

# Workflow orchestration

Prefer AWS Step Functions for distributed workflows requiring:

- retries
- waiting
- branching
- compensation
- parallel processing
- workflow state
- long-running orchestration

Do not implement custom distributed workflow state machines inside the Orders service when Step Functions would express the workflow more safely and clearly.

AWS's serverless guidance specifically recommends state-machine orchestration rather than chaining functions or building tightly coupled orchestration logic.

# Secrets

Do not store secrets in:

- source code
- Docker images
- committed `.env` files
- CDK source
- plain CloudFormation parameters

Use:

- AWS Secrets Manager for credentials/secrets
- Parameter Store for appropriate configuration

Use IAM-based authentication instead of stored credentials whenever an AWS service supports it.

Prefer temporary AWS credentials through IAM roles.

# Encryption

Use encryption at rest and in transit.

Use AWS-managed encryption by default unless requirements justify customer-managed KMS keys.

Do not introduce custom KMS keys automatically if an AWS-managed key adequately satisfies the requirements.

Use TLS for external and service-facing communications.

# Observability

Observability must be designed into the service.

Use:

- structured logging
- CloudWatch Logs
- CloudWatch Metrics
- CloudWatch alarms
- distributed tracing where useful
- correlation IDs
- ECS service/task metrics
- ALB metrics
- application/business metrics

Record sufficient context to diagnose failures without leaking secrets or unnecessary customer information.

Examples of useful fields:

- correlation ID
- request ID
- order ID
- operation
- outcome
- latency
- error category

# Reliability

Assume distributed systems fail.

Design explicitly for:

- duplicate messages
- duplicate requests
- container replacement
- partial failures
- downstream outages
- retries
- timeout exhaustion
- concurrent updates
- network interruptions
- throttling
- unavailable dependencies

Mutation handlers should be idempotent where practical.

Retries should:

- be bounded
- use exponential backoff
- use jitter where appropriate
- only apply to retryable failures

Use queues and DLQs where asynchronous processing benefits from durable retry semantics.

# Autoscaling

Configure ECS Service Auto Scaling based on workload characteristics.

Potential signals include:

- CPU utilization
- memory utilization
- request count
- ALB request metrics
- queue depth for worker workloads

Do not select scaling values arbitrarily.

Choose conservative defaults and make them observable.

Maintain an appropriate production minimum task count for availability.

# Container engineering

Build production-quality containers.

Use:

- multi-stage Docker builds
- minimal runtime images
- non-root users
- deterministic dependency installation
- dependency vulnerability scanning
- immutable application images
- explicit health checks

Do not install unnecessary tools in production images.

Do not embed secrets.

Handle SIGTERM and graceful shutdown correctly so ECS can drain requests during deployment or scale-in.

# Infrastructure as Code

All AWS resources must be provisioned through the repository-standard Infrastructure as Code system.

If no standard exists, prefer AWS CDK with TypeScript for this TypeScript/AWS project.

Infrastructure must be:

- repeatable
- testable
- reviewable
- environment-aware
- secure by default
- observable by default

Use reusable constructs only where they encode a meaningful architectural convention.

Avoid creating extremely configurable generic constructs.

Prefer opinionated constructs with sensible defaults.

# Convention over configuration

The architecture must remain convention-driven.

There should be an obvious standard way to create:

- an ECS service
- a Lambda
- a DynamoDB table
- a queue
- an event
- an IAM role
- an alarm
- a port
- an adapter
- a use case
- a test

Prefer repository conventions and reusable patterns over repeated configuration.

Do not expose dozens of configuration options merely because CDK makes them possible.

# Architecture decision hierarchy

When choosing AWS technology, follow this sequence:

```text
Can an AWS managed/serverless service solve it?
                 |
              YES
                 |
                 v
        Prefer serverless/managed
                 |
                NO
                 |
                 v
       Is Fargate appropriate?
                 |
              YES
                 |
                 v
             Fargate
                 |
                NO
                 |
                 v
 Evaluate another AWS compute model
```

Technology selection must follow workload requirements rather than preference.

# Final architecture review

Before declaring the project complete, perform an AWS Well-Architected review covering:

## Operational Excellence

- deployment automation
- Infrastructure as Code
- observability
- operational procedures
- rollback
- failure diagnosis

## Security

- IAM
- networking
- authentication
- authorization
- secrets
- encryption
- dependency/container security

## Reliability

- multi-AZ design
- failure modes
- retries
- idempotency
- recovery
- backups
- concurrency

## Performance Efficiency

- Fargate sizing
- autoscaling
- DynamoDB access patterns
- asynchronous processing
- latency

## Cost Optimization

- right-sizing
- unnecessary resources
- log retention
- storage lifecycle
- service selection

## Sustainability

- managed services
- resource utilization
- autoscaling
- unnecessary persistent compute

Document significant trade-offs rather than silently selecting defaults.

# Target architectural direction

The expected architecture should resemble:

```text
                            Internet
                               |
                               v
                     +------------------+
                     |      Route53     |
                     +--------+---------+
                              |
                              v
                     +------------------+
                     |       ALB        |
                     | Public Subnets   |
                     +--------+---------+
                              |
                              v
                +---------------------------+
                |      ECS Fargate          |
                |     Orders Service        |
                |                           |
                |     Private Subnets       |
                +-------------+-------------+
                              |
              +---------------+----------------+
              |               |                |
              v               v                v
         DynamoDB        EventBridge       CloudWatch
                             |
                         +---+---+
                         |       |
                         v       v
                        SQS    Lambda
                                |
                          Serverless
                          consumers
```

Supporting capabilities should remain serverless unless there is a clear reason otherwise.

# Definition of Done

The implementation is not complete until:

- ECS tasks run in private subnets
- ECS tasks have no public IP addresses
- ingress is controlled through the intended entry point
- least-privilege security groups are used
- least-privilege IAM is used
- production architecture supports multiple Availability Zones
- serverless services are preferred for supporting capabilities
- TDD has been followed
- Ports and Adapters boundaries are maintained
- Testing Honeycomb is followed
- infrastructure is defined as code
- telemetry is implemented
- failure behavior is designed and tested
- architecture follows repository conventions
- relevant AWS Well-Architected considerations have been reviewed
- significant architectural decisions and trade-offs are documented
