# serverless-api-with-fargate

Turborepo workspace with a TypeScript AWS CDK infra app and a web app.

## Layout

- `apps/web` — web app
- `apps/infra` — AWS CDK TypeScript app
- `.env.example` — copy to `.env` for local variables (`.env` is gitignored)
- `biome.json` — format and lint
- `lefthook.yml` — git hooks
- `turbo.json` — task pipeline

## Setup

```bash
pnpm install
cp .env.example .env
```

`pnpm install` installs Lefthook hooks.

## Commands

```bash
pnpm lint
pnpm format
pnpm exec turbo run lint
pnpm --filter infra exec cdk --version
```
