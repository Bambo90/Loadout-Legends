# Verification v0.2.2

Short release verification checklist for `v0.2.2`.
Detailed narrative belongs in release notes: [`../releases/RELEASE_NOTES_v0.2.2.md`](../releases/RELEASE_NOTES_v0.2.2.md)

## Metadata

- Release: `v0.2.2`
- Date: `2026-02-12`

## Automated Checks

- [x] Version metadata updated (`package.json`, changelog, release notes)
- [x] Project lint/test commands executed in CI (non-blocking at this stage)
- [x] No release-blocking dependency/load-order issues found

## Manual Smoke Checks

- [x] App boots and tabs render
- [x] Workshop drag/drop/rotate works
- [x] Invalid placement snaps back correctly
- [x] Cross-grid interactions still work
- [x] Save/load basic flow works

## Architecture Checks

- [x] Drag API boundary is explicit (`window.DragSystem`)
- [x] Deprecated drag code path removed
- [x] Consumer script order aligned with provider

## Open Follow-Ups

- [ ] Promote minimal smoke tests to required CI gate in a future version
- [ ] Keep verification template short and versioned
