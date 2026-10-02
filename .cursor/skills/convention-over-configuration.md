---
name: convention-over-configuration
description: Use when introducing new architecture, folders, modules, infrastructure constructs, settings, configuration, or extension mechanisms.
---

# Convention Over Configuration

## 1. Find the existing convention

Search the repository for:

- equivalent feature
- equivalent adapter
- equivalent test
- equivalent infrastructure component
- naming convention
- folder placement
- dependency wiring

Use the established pattern when suitable.

## 2. Prefer a default

The common path should work with little or no configuration.

Prefer:

- predictable file placement
- predictable naming
- code-based wiring
- standard resource tags
- standard observability
- secure defaults
- default retries/timeouts appropriate to the workload

## 3. Challenge every config value

For each proposed configuration option ask:

- Does this really vary?
- Is this an architectural decision disguised as config?
- Can a type or interface express this better?
- Can a repository convention eliminate it?
- Does exposing this option create unsupported combinations?

Remove configuration that has no real variation requirement.

## 4. Avoid generic engines

Do not build generic rule engines, dynamic registries, configurable workflow frameworks, or plug-in systems for a single known use case.

Prefer direct code until variation is proven.

## 5. Document conventions

If a genuinely new convention is introduced, update `AGENTS.md` or the relevant architecture documentation.
