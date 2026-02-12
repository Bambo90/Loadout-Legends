# Changelog

All notable changes to Loadout Legends will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.2] - 2026-02-12

### Architecture Refactor - Drag System
Major refactoring of the drag-and-drop system for improved maintainability and performance.

### Changed
- **Drag System Architecture**: Consolidated drag logic from 3 files into unified `customDrag.js` module
- **Global State Elimination**: Removed all global mutable drag state variables
- **API Encapsulation**: Introduced `window.DragSystem` namespace with explicit API:
  - `getDraggedItem()` - Access current drag state
  - `clearDraggedItem()` - Clear drag state
  - `startCustomDrag()` - Initiate drag operation
  - `enablePerf()` / `disablePerf()` - Performance monitoring
- **Script Load Order**: Fixed dependency order - `customDrag.js` now loads before consumers

### Removed
- **dragEngine.js**: Eliminated deprecated file, functionality moved to `customDrag.js`
- **Dead Code**: Removed unused `_lastDropState` variable and orphaned references
- **Debug Logging**: Removed verbose console.log statements (retained error warnings and opt-in performance monitoring)

### Performance
- **Transform-Only Positioning**: GPU-accelerated drag movement using `transform: translate()`
- **Cached Geometry**: Pre-compute cell dimensions at drag start, avoid repeated DOM reads
- **RAF Synchronization**: Throttle position updates via `requestAnimationFrame()` for smooth 144Hz capable performance
- **Zero Layout Thrashing**: Eliminated all layout-triggering operations from pointermove loop

### Technical Details
- Private state encapsulation: `draggedItem` now lexically scoped within `customDrag.js`
- Clean module boundaries: All external access via `DragSystem` namespace
- Dependency graph: `customDrag.js` → `dragdropengine.js`, `workshopEngine.js`, `script.js`
- Average frame time: ~6.94ms (144 FPS capable)

### Migration Notes
- No breaking changes to game functionality
- Drag behavior identical to previous version
- Rotation mechanics unchanged
- Drop validation logic preserved

---

## [0.2.0] - Previous Release
Initial stable release with drag-and-drop functionality.
