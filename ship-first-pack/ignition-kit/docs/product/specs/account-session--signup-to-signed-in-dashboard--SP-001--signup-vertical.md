# Spec: Signup vertical (ignition)

## Status

`ready-for-implementation`

## Parent User Story

[Sign up and land signed in](../user-stories/account-session--signup-to-signed-in-dashboard--US-001--signup.md)

## Implementation scope

Thin ignition spec — signup form, session cookie/JWT, redirect to dashboard placeholder. Match stack in `docs/project.config.md` and PRD technical baseline when Zedos fills it.

## Tasks

1. **Auth routes** — signup + session; AC: signup ends signed in.
2. **Dashboard shell** — signed-in landing page; AC: root shows dashboard when session valid.
