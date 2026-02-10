# Drag-Drop & Placement Architecture (Backpack Battles Model)

**Last Updated**: 2026-02-10  
**Status**: ✅ Core system working, ready for synergy/buff layer

---

## Core Principles

This system separates **Body** (physical placement) from **Aura** (effect/synergy zones) to match Backpack Battles inventory management.

### Body (Occupied Space)
- Defines which grid cells the item occupies
- Blocks other items (collision detection)
- Must be **fully inside grid** to place
- Stored in grid as `grid[index] = { itemId, instanceId, shape, root }`
- Defined in item files as `item.body` (2D array)

### Aura (Effect Zones / Synergies)
- Defines "synergy radius" around item (upcoming feature)
- Can extend outside grid boundaries
- Used for effect triggers (e.g., "adjacent Food" items boost Frying Pan damage)
- Defined in item files as `item.aura` (optional, 2D array)
- NOT stored in grid, shown on-hover only

---

## Placement Logic (State Machine)

```
User drops item at grid position
     ↓
Calculate desired origin from mouse offset + shape dimensions
     ↓
Check: Does body have ANY overlap with grid?
  └─ NO → Snap back to Storage immediately
  └─ YES → Continue
     ↓
Check: Is body fully inside grid + no collisions?
  └─ YES → Place directly ✅
  └─ NO → Continue
     ↓
Search nearby positions (radius 2-4) for valid placement
  └─ Found → Place at nearest valid
  └─ Not found → Snap back to Storage
```

### Key Functions

**`hasBodyOverlapWithGrid(bodyShape, originX, originY, cols, maxRows)`**
- Returns true if at least 1 body cell touches grid
- Used in `dragdropengine.js` line ~100

**`canPlaceItem(grid, originIndex, shape, cols, maxRows)`**
- **MUST be called with bodyShape only**, never full shape
- Returns true if:
  - All body cells within bounds (0 ≤ x < cols, 0 ≤ y < maxRows)
  - All body cells unoccupied
- In `gridEngine.js` (lines 46-65)

**`tryFindNearestValid(grid, originX, originY, bodyShape, cols, maxRows, radius)`**
- Searches outward from desired position
- Skips candidates with no body overlap (optimizes search)
- Inline in `dragdropengine.js` (lines 110-124)

---

## Data Flow

### Dragging
1. **startCustomDrag** (`customDrag.js:52`)
   - Receives `previewShape` from Workshop renderer
   - Currently: `previewShape = item.body` (will support rotation)
   - Stores as `draggedItem.previewShape` (mutable during rotation)

2. **applyRotation** (`dragEngine.js:67`)
   - Rotates matrix (CW/CCW via R key or mousewheel)
   - Normalizes to remove padding
   - **Clamps offset to stay within rotated bounds** (critical!)
   - Updates `draggedItem.previewShape` + `draggedItem.offsetX/Y`
   - Triggers `renderWorkshopGrids()` to update preview

3. **renderDragPreviewForGrid** (`script.js:382`)
   - Uses `draggedItem.previewShape` (includes rotation)
   - Calculates origin = `mouseCell - offset`
   - Renders preview blocks for body only
   - Colors block red if placement invalid

### Dropping
1. **customDrag.js:_customPointerUp** (line ~240)
   - Detects drop slot via `elementsFromPoint` or fallback rect calculation
   - Calls `handleDropInSlot()`

2. **handleDropInSlot** (`dragdropengine.js:5`)
   - Calculates origin from mouse offset
   - Calls `hasBodyOverlapWithGrid()` → snap back if no overlap
   - Calls `canPlaceItem()` with **bodyShape** → place if valid
   - Otherwise searches radius for valid position
   - Calls `placeItemIntoGrid(grid, index, item, bodyShape, cols, instanceId)`

3. **placeItemIntoGrid** (`gridEngine.js:105`)
   - Writes only **in-bounds body cells** to grid
   - Marks first occupied cell as root
   - Other cells marked with same `instanceId` (no root flag)
   - On render: Only cells with `root: true` are rendered

### Loading (Save/Load Cycle)
1. **normalizeGridInstances** (`saveengine.js:8`)
   - Called at load time
   - **Always uses `item.body`** (ignores stale `cell.shape` from old saves)
   - Re-places all items, auto-recalculating root cells

---

## Critical Implementation Details

### Offset Calculation
```javascript
// In handleDropInSlot:
const mouseX = targetIndex % cols;
const mouseY = Math.floor(targetIndex / cols);
const originX = mouseX - adjustedOffsetX;
const originY = mouseY - adjustedOffsetY;
const finalOriginIndex = originY * cols + originX;
```
- `offsetX/Y` = grab point within item (pixels / tilesize)
- Cross-grid resets to `Math.floor(width/2)` (center anchor)
- Same-grid preserves offset

### Root Cell Logic
```javascript
// In placeItemIntoGrid:
let rootPlaced = false;
shape.forEach((row, r) => {
  row.forEach((cell, c) => {
    if (!cell) return;
    const x = originX + c;
    const y = originY + r;
    if (x < 0 || x >= cols || y < 0 || y >= maxRows) continue; // Skip out-of-bounds
    const isRoot = !rootPlaced; // First occupied in-bounds cell
    grid[y * cols + x] = { itemId, instanceId, shape, root: isRoot };
    rootPlaced = true;
  });
});
```
- Only **in-bounds cells** are written to grid
- First occupied in-bounds cell gets `root: true`
- Non-root cells allow `SKIP RENDER` optimization

### Rendering Non-Root Cells
```javascript
// In createSlot (workshopEngine.js:55):
if (!cell.root) {
  console.log('⏭️  SKIP RENDER (no root)...' );
  return; // Don't re-render this cell
}
```
- Only root cell renders the item visual
- Prevents duplicate visuals in grid

---

## Debugging

### Enable Placement Logs
```javascript
window.DEBUG_PLACEMENT = true
```
Shows: `canPlaceItem()` checks, exact cell blocking reasons, out-of-bounds warnings

### Check Current Drag State
```javascript
console.log(draggedItem)
// Shows: offsetX, offsetY, previewShape, instanceId, location, fromIndex
```

### Verify Grid State
```javascript
console.log(gameData.farmGrid)
// Shows: all placed items with instanceIds, root flags
```

---

## Next Layer: Synergies & Buffs

Once this placement layer is solid, add:

1. **Aura Overlap Detection**
   ```javascript
   function getItemsInAura(grid, itemInstance) {
     // Get item's aura shape
     // Find all grid cells in aura zone
     // Return overlapping item instances
   }
   ```

2. **Buff Application** (during combat)
   - At battle start: snapshot grid layout
   - Iterate items with buff logic (e.g., "Frying Pan")
   - Check: Do my aura cells overlap any Food items?
   - If yes: Apply modifier (+dmg per food)

3. **Visual Synergy Indicator**
   - On item mouseover: Show aura as semi-transparent overlay
   - Highlight overlapping items
   - Show buff preview tooltip

---

## Common Bugs & Fixes

| Issue | Cause | Fix |
|-------|-------|-----|
| Rotated item snaps back | Offset not clamped after rotation | `draggedItem.offsetX = Math.min(..., newW-1)` |
| Body escapes grid | Aura stored in grid as body | Always use `item.body` in `normalizeGridInstances` |
| Preview doesn't rotate | Using stale `item.body` instead of `previewShape` | Preview uses `draggedItem.previewShape` |
| Items place twice | Root cell logic broken | First in-bounds cell gets `root: true`, rest skipped |
| Console spam | Out-of-bounds logs during preview | Wrap in `if (window.DEBUG_PLACEMENT)` |

---

## File Map

| File | Role | Key Functions |
|------|------|---|
| `dragEngine.js` | Rotation state machine | `applyRotation()`, offset clamping |
| `customDrag.js` | Pointer tracking | `startCustomDrag()`, `_getGridSlotFromPoint()` |
| `dragdropengine.js` | Drop validation | `handleDropInSlot()`, `hasBodyOverlapWithGrid()` |
| `gridEngine.js` | Grid persistence | `canPlaceItem()`, `placeItemIntoGrid()` |
| `script.js` | UI/Preview | `renderDragPreviewForGrid()` |
| `saveengine.js` | Load/Save | `normalizeGridInstances()` |
| `workshopEngine.js` | Shop/Grid render | `createSlot()` |
