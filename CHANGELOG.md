# Changelog

All notable changes to Loadout Legends are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed

- Reorganized project docs for maintainability.
- Added `CODEX_CONTEXT.md` as canonical AI/human context entry point.
- Added `NEXT.md` as short execution roadmap.
- Moved long-form release/verification/progress/worklog material into `docs/`.

## [0.2.2] - 2026-02-12

### Changed

- Consolidated drag runtime around `customDrag.js` and `window.DragSystem`.
- Removed deprecated drag code paths and cleaned related dead code.
- Fixed script load order for drag consumers.

### Performance

- Improved drag update path with transform-based movement and RAF synchronization.

### Notes

- Detailed release notes: [`docs/releases/RELEASE_NOTES_v0.2.2.md`](docs/releases/RELEASE_NOTES_v0.2.2.md)
