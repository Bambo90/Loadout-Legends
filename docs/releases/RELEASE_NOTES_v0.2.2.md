# Release Notes v0.2.2

- Date: 2026-02-12
- Type: stabilization refactor
- Status at release time: production-ready baseline for drag architecture

## Scope

This release focused on internal drag/runtime architecture quality without changing intended gameplay behavior.

## Key Changes

- Consolidated drag handling into `customDrag.js`.
- Exposed explicit drag API via `window.DragSystem`.
- Removed deprecated/unused drag code (`dragEngine.js`, dead state paths).
- Fixed script load order so drag consumers initialize correctly.
- Reduced debug-noise logging in normal runtime.

## Performance Direction

- Moved drag updates to transform-based rendering path.
- Used requestAnimationFrame synchronization for pointer update flow.
- Reduced avoidable layout work in drag interactions.

## Compatibility

- No intentional gameplay-breaking changes in this release.
- Existing save behavior remained compatible with then-current migration path.

## Verification

- Checklist: [`../verification/VERIFICATION_v0.2.2.md`](../verification/VERIFICATION_v0.2.2.md)
- Summary changelog entry: [`../../CHANGELOG.md`](../../CHANGELOG.md)
