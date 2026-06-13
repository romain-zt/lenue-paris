<!--
  Project Config Template
  Location: .cursor/templates/project/project.config.template.md
  Usage: copy to docs/project.config.md and fill per project.
  Purpose: the ONLY place project-specific names live. Rules and skills read
           from here so the .cursor/** workflow stays project-agnostic.
-->

# Project Config

> The reusable `.cursor/**` workflow reads project-specific values from this file.
> Keep `.cursor/**` generic; put names, bands, and stack overrides here.

## Identity

- **Project name:** <!-- e.g. Zedos -->
- **One-line product:** <!-- what it is, for whom -->
- **Repo root layout:** <!-- monorepo | single-app -->

## Stack (overrides to `40-architecture-baseline.mdc`)

State only deviations from the baseline (monorepo · next-forge · Payload i18n+S3 · Postgres · MinIO local).

| Concern | Baseline | This project |
|---------|----------|--------------|
| Framework |  next-forge / Next.js | <!-- same | deviation + reason --> |
| CMS/data | Payload (Postgres) | |
| Media | S3 (MinIO local) | |
| i18n | on | |

## Priority bands

Used by `execution-loop` to assign `Priority` to Feature Areas / Scope Slices.
List each Feature Area under its band. Bands run `P0` (highest) → `P4`.

| Band | Feature Areas (FA-<kebab>) |
|------|----------------------------|
| **P0** | <!-- FA-... --> |
| **P1** | |
| **P2** | |
| **P3** | |
| **P4** | |

Scope Slices inherit their parent Feature Area's band.

## v0 boundary (exclusions)

Surfaces explicitly deferred out of v0. A Scope Slice / Spec / Task touching any
of these must be marked `deferred` with a reference here.

- <!-- e.g. multi-user collaboration / roles -->
- <!-- e.g. subscription billing -->

## Implementation phase

- **Implementation governance enabled:** <!-- yes | no -->
- **Governing decision:** <!-- docs/product-decisions/PD-NNN-implementation-phase.md -->
- **Forbidden-paths default when locked:** <!-- e.g. none (impl allowed) | src/**, app/** -->
