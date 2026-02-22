# CODEX_CONTEXT

Canonical context for AI agents and humans working in this repository.
Keep this file short, current, and factual.

## Project Status

- Status: `Pre-Alpha Prototype`
- Core loop currently playable:
  - Abenteuer -> Welt -> Kuestenpfad (`coast`) zone view
  - Start/Stop zone combat with monster spawning and kill rewards
  - Loot to battlefield container (`Schlachtfeld`) and transfer/sell flows
  - Inventory/workshop drag-drop with rotation and body/aura support
  - Shop buy flow, storage pages, bulk sell, character overview, options tab
- Not fully implemented yet:
  - Multi-act campaign progression (Act 2/3 placeholders)
  - Full asynchronous online PvP backend (current snapshot system is local)
  - Automated test suite

## Golden Rules

1. Simulation is pure logic.
2. Item instances are always serializable.
3. UI only renders state; UI does not own gameplay logic.
4. `gameData` is source of truth at runtime.
5. Save files must include explicit version and sequential migrations.
6. Do not spread gameplay values across random files; keep data-driven definitions centralized.
7. Prefer minimal, safe diffs over broad refactors.

## Save and Data Rules

- Persist dynamic data only (placements, instance IDs, player progress, settings).
- Do not persist static item definition payload in grid cells.
- Always run save normalization and migration during load.
- Backward compatibility matters: add migrations, do not silently break old saves.

## Architecture Snapshot

- `index.html`: page shell, tabs, script load order.
- `script.js`: main runtime orchestration (tabs, world/zone UI, combat loop glue, shop/workshop wiring).
- `character.js`: base + derived stat pipeline, XP progression, modifier application.
- `itemDefs.js`: static item definition normalization, runtime instance helpers.
- `affixDefs.js`: affix/tier definitions.
- `generator.js`: PoE-style implicit/prefix/suffix roll generation.
- `customDrag.js`: drag runtime (`window.DragSystem`), rotation interaction.
- `dragdropengine.js`: drop validation and placement fallback logic.
- `gridEngine.js`: grid placement checks and writes.
- `workshopEngine.js`: workshop and grid rendering integration.
- `storageEngine.js`: storage pages, filters, bulk sell mode.
- `saveengine.js`: save/load, migrations, normalization.
- `combatEngine.js`: reusable combat/stat calculation helpers.
- `pvp.js`: local async snapshot PvP scaffolding.
- `worldData.js`, `monsters.js`, `lootPools.js`: content and drop data.

## What Is True Today

- One production baseline exists around `v0.2.2` with additional local WIP commits on top.
- Zone combat loop is active in coast zone and uses character-derived stats.
- Battlefield loot container exists and integrates with storage/sell flows.
- Affix and generated item instance systems are integrated into runtime.
- CI exists but lint/tests are non-blocking and tests are currently placeholder.

## Priorities (Next 2-4 Weeks)

### P0 (must-have)

- Stabilize one complete vertical slice:
  - 1 zone progression loop
  - reliable save/load across updates
  - coherent combat pacing and reward pacing
- Remove high-risk regressions:
  - combat/resource sync
  - drag/drop edge cases
  - instance/save consistency
- Add minimal automated smoke checks for critical systems.

### P1 (should-have)

- Expand coast content depth (monster pool, loot tuning, progression milestones).
- Harden documentation and operational workflow for repeatable AI-assisted sessions.
- Refine tooltip/stat clarity for item decisions and min-maxing.

### P2 (nice-to-have)

- Prepare asynchronous PvP data model beyond local snapshots.
- Prepare Electron packaging polish for wider internal playtesting.

## Testing and Verification Approach

### Manual quick checks (every meaningful change)

- Load existing save and verify no migration errors.
- Enter coast zone, run combat, kill at least one monster.
- Verify rewards: gold, XP, drops, battlefield behavior.
- Open workshop/storage and validate drag/rotate/drop and sell flows.
- Buy one shop item and verify persistence after reload.

### Automated direction (incremental)

- Add Node-based smoke scripts for:
  - save migration
  - item generation validity
  - character stat derivation
- Add lint gate and at least one CI smoke job that must pass.

## Working Style Constraints

- Do not refactor large surfaces without explicit need.
- Keep edits local and reversible.
- Prefer doc updates that point to one canonical source instead of duplicating narrative.
- If uncertain, verify by reading the current code path before editing docs.

## Canonical Docs

- `README.md` -> short project overview and quickstart
- `NEXT.md` -> active execution list (short horizon)
- `CHANGELOG.md` -> public change summary
- `RELEASING.md` -> release procedure
- `docs/releases/` -> detailed release notes per version
- `docs/verification/` -> versioned verification checklists
- `docs/worklog/` and `docs/archive/` -> historical logs
