# serverless-api-with-fargate

Portable TypeScript Orders API on AWS ECS Fargate, with private networking, DynamoDB, EventBridge, Cognito, and ECS Exec.

The Orders process is the documented Fargate exception. Supporting capabilities stay serverless.

## Layout

- `apps/orders` — hexagonal Orders HTTP API
- `apps/infra` — AWS CDK Auth, Stateful, and Stateless stacks
- `apps/web` — frontend placeholder
- `docs/ARCHITECTURE.md` — target AWS architecture
- `docs/adr/` — architecture decisions

## Local development

```bash
pnpm install
cp .env.example .env
pnpm --filter orders dev
```

The local API uses an in-memory repository and event publisher. Auth is disabled unless `AUTH_DISABLED=false`.

```bash
curl http://localhost:3000/health
curl -X POST http://localhost:3000/orders \
  -H 'content-type: application/json' \
  -H 'x-correlation-id: local-1' \
  -d '{"customerId":"customer-1","branchId":"branch-1","orderLines":[{"productId":"sku-1","productName":"Coffee","quantity":2,"price":4.5}]}'
```

## API

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/health` | Public health check |
| `POST` | `/orders` | Create an order (`Idempotency-Key` supported) |
| `GET` | `/orders` | List orders (`customerId`, `limit`, `cursor`) |
| `GET` | `/orders/:id` | Get an order |
| `PUT` | `/orders/:id` | Update comments, lines, or lifecycle status |
| `DELETE` | `/orders/:id?version=` | Cancel an order |

Lifecycle: `PENDING` → `CONFIRMED` → `SHIPPED` → `DELIVERED`. `PENDING` and `CONFIRMED` can move to `CANCELLED`.

## Commands

```bash
pnpm check
pnpm test
pnpm lint
pnpm --filter infra exec cdk synth --context env=dev --context skipImageBuild=true
pnpm --filter infra exec cdk deploy --all --context env=prod --context certificateArn=arn:aws:acm:...
```

## Deployed architecture

```text
Internet → ALB (public subnets)
        → ECS Fargate Orders tasks (private subnets, no public IPs)
        → DynamoDB + EventBridge + CloudWatch
Cognito authenticates API callers
```

Non-production uses one NAT Gateway. Production uses one NAT Gateway per AZ, two tasks minimum, and DynamoDB PITR.
