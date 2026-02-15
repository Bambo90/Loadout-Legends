# Drag and Drop Placement Architecture

Last Updated: 2026-02-13
Status: Stable core flow, ready for synergy layer expansion.

---

## Core principle

Placement separates `body` and `aura`:
- `body` = collision and occupied grid cells
- `aura` = effect radius or visual overlay

Only body cells are used for collision and grid writes.

---

## Runtime ownership

- `customDrag.js`
  - Owns private drag state
  - Exposes `window.DragSystem`
  - Handles rotation (`applyRotation` / canonical rotation path)
- `dragdropengine.js`
  - Validates drop targets
  - Applies nearest-valid fallback search
- `gridEngine.js`
  - Validates bounds/collision and writes grid cells
- `workshopEngine.js` and `script.js`
  - Render previews and trigger drag interactions

---

## Public API surface

```javascript
window.DragSystem = {
  getDraggedItem,
  clearDraggedItem,
  startCustomDrag,
  enablePerf,
  disablePerf,
}
```

No external code should mutate drag internals directly.

---

## Placement state flow

1. Pointer down on item slot:
   - `startCustomDrag(...)` stores item, preview shape, offsets and rotation context.

2. Pointer move:
   - Follow element position updates via transform.
   - Preview shape is rendered against candidate target grid.

3. Rotation input (R / Shift+R / wheel):
   - Rotation is applied in `customDrag.js`.
   - Shape is normalized after rotation.
   - Offset is clamped to rotated bounds.
   - Preview rerenders.

4. Pointer up (drop):
   - `dragdropengine.js` resolves slot target.
   - Validate overlap and bounds with body shape.
   - If invalid, search nearby valid positions.
   - On success: write through `placeItemIntoGrid(...)`.
   - On failure: snap back or restore source.

---

## Key rules

- Placement checks are body-only, never aura-only.
- Root cell logic remains single-render origin for each instance.
- Save/load normalization must rehydrate from canonical item definitions.
- Rotation index and rotated aura data are preserved through drag and save path.

---

## Debugging hooks

- `window.DEBUG_PLACEMENT = true` for detailed placement checks.
- `DragSystem.enablePerf()` / `DragSystem.disablePerf()` for drag performance logs.

---

## Common regression checks

- Rotated item can still place near edges.
- Cross-grid movement (bank <-> setup) keeps instance integrity.
- Invalid drops do not duplicate items.
- Aura visuals follow rotation state while dragging and after placement.
- No console errors during drag, rotate, drop cycle.

---

## File map

| File | Responsibility |
|---|---|
| `customDrag.js` | Drag lifecycle, rotation, follow element, DragSystem API |
| `dragdropengine.js` | Drop validation and fallback search |
| `gridEngine.js` | Bounds/collision checks and grid writes |
| `workshopEngine.js` | Slot rendering and drag start hooks |
| `script.js` | UI orchestration and preview integration |
| `saveengine.js` | Save/load normalization |

---

## Next layer

- Aura overlap detection for gameplay effects
- Buff calculation snapshot at combat start
- Clear visual indicator for active synergies
