# WORKLOG (Private notes for assistant)

This file is a concise, timestamped log meant for the assistant to update during development sessions. It is intended to capture important changes, decisions, and short next-steps so you don't have to re-explain context each time.

AI Automation Convention
- `AI_AUTOMATIC_UPDATE: true` — convention flag the assistant will look for to indicate it should update this file at session start/end when requested.

Session Close Checklist (what assistant will remind you to do besides saving):
- Commit your work: `git add . && git commit -m "WIP: <short summary>"`
- Push changes: `git push`
- Optionally run `npm run worklog "Session end: <short note>"` to append a final note and create a commit for the worklog.
- Close VS Code when ready.

---

## Entries

### 2026-02-10 12:00:00 (AI)
- **Summary**: Merged local repo with remote, resolved 14 add/add conflicts by keeping local versions. Pushed to GitHub. Created release v0.1.0 and CI workflow. Added `customDrag.js`, queued render fixes, and Electron scaffold.
- **Next**: Continue with game features (items/skills/monsters). The assistant will update this file at session boundaries if `AI_AUTOMATIC_UPDATE` is present.

### 2026-02-10 20:30:00 (AI) – Drag-Drop & Placement System Overhaul
**Session Length**: ~8 hours (intensive drag-drop debugging)

**Problem Context**:
- Backpack Battles-style inventory system required complete spatial placement redesign
- Items would escape grid boundaries, rotated items wouldn't place, offsets were unreliable
- 40+ failed patch attempts led to decision: **restart from architecture docs** provided by user

**Key Architecture Changes**:
1. **Body vs Aura Separation** (Critical!)
   - Body: Occupied space (blocks items, must be fully in grid)
   - Aura: Effect/synergy zone (visual, can extend outside grid)
   - Old system tried to place both → caused boundary/offset chaos
   - New: Only Body stored in grid, Aura optional visual overlay

2. **Placement Logic (Backpack Battles Model)**
   - Check: Does body have ANY grid overlap? → No? Snap back immediately
   - Check: Is body fully inside grid + no collisions? → Yes? Place directly
   - Fallback: Radius search for nearest valid position (radius=4 cross-grid, radius=2 same-grid)
   - Snap-back triggers only if NO valid position found in radius

3. **Rotation System Fixes**
   - Offset clamping: Rotation offset now clamped to valid shape bounds (prevents invalid origin)
   - PreviewShape: Now uses rotated form (not stale unrotated body)
   - Follow element: Updates visually during rotation via `_updateFollowElement()`

4. **Key Files Modified**:
   - `dragEngine.js` – Rotation offset clamping, shape normalization
   - `customDrag.js` – Body-only dragging, fallback slot detection via grid-rect calculation
   - `dragdropengine.js` – Body vs Aura validation, radius search logic
   - `gridEngine.js` – canPlaceItem now allows partial placement (body touches grid is enough)
   - `script.js` – Preview renders body only (not aura), matches placement mechanics
   - `saveengine.js` – Always restores body shape (fixed old-save aura bug)

**Critical Bug Fixed**:
- Old saves stored aura in `cell.shape` → on load, aura was re-placed as body → items escaped
- Fix: `normalizeGridInstances()` now always uses `item.body` from items.js, never `cell.shape`

**Console Spam Fix**:
- Out-of-bounds logs during preview near edges (noise)
- Fixed: Logs now only appear if `window.DEBUG_PLACEMENT = true` is set

**Current State (End of Session)**:
✅ Items place correctly (body fully in grid)
✅ Aura can extend outside grid
✅ Rotation works + items stay placed after rotation
✅ Cross-grid movement (Storage ↔ Ausrüstung) functional
✅ Boundary prevention working (no escapes)
⚠️ Rotation placement still slightly sensitive (minor offset recalc needed?)
✅ Preview matches placement visually

**Next Session Tasks**:
1. Fine-tune rotation offset formula if placement still finicky
2. Add Aura-on-hover visualization (show synergy zones on mouseover)
3. Implement synergy/buff system (check aura overlap with other items)
4. Balance item shapes/aurae for different item types (2x2 armor, etc.)
5. Replace emojis with proper sprites
6. **Test Data**: Use `window.DEBUG_PLACEMENT = true` to enable detailed placement logs

**Code Quality Notes**:
- `hasBodyOverlapWithGrid()` – Key function, inline in dragdropengine.js
- `canPlaceItem()` – Must be called with bodyShape, never full shape
- `placeItemIntoGrid()` – Stores ONLY body grid cells, auto-calcs root from first in-bounds cell
- Root cell logic: First occupied cell in shape (after in-bounds filtering)

**Git Status**: All changes staged, ready for commit

<!-- Add new AI or user entries below using the `npm run worklog "message"` helper or by manual edit. -->
