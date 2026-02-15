# Loadout Legends - Game Design and Project Guidelines

Central design reference for gameplay, UI direction, architecture and roadmap.

---

## Design Rules

Regel 1: Simulation ist immer rein logisch.
Regel 2: Item-Instanz ist immer serialisierbar.
Regel 3: UI darf nur anzeigen, nie rechnen.

---

## UI and Visual Direction

### Core colors
```css
--bg-dark: #0a0a0a
--bg-panel: #161616
--accent-gold: #ffd700
--accent-blue: #2196F3
--accent-red: #ff3b3b
--border-color: #333
```

### Layout notes
- Dense workshop UI with slot-based planning focus.
- Hover states should highlight, but avoid distracting horizontal movement on primary CTAs.
- World and zone scenes are full-screen tab views with minimal clutter.

---

## Core Mechanics

### Body and Aura system
- `body` defines collision and real occupied shape.
- `aura` defines visual or synergy zone and can extend outside visible grid bounds.
- Rotation is supported while dragging (keyboard and wheel) and persists across save/load.

### Grid system (current)
- Storage (`bank`): 10 columns, dynamic rows (currently 200 slots total).
- Equipment setups (`farmGrid`, `pveGrid`, `pvpGrid`): 10x10 each.
- Drag preview: valid = green, invalid = red.

### World and Adventure flow
- Adventure tab contains hub cards with expandable actions.
- World submenu renders acts and zones from `worldData.js`.
- Current world data includes:
  - Act 1 (unlocked)
  - Act 2 - Coming Soon (locked)
  - Act 3 - Coming Soon (locked)
- Zone view (for coast) includes monster card, hover stats panel and combat start CTA.

---

## Architecture (current)

### Core runtime files
- `script.js`: Main state orchestration, tab flow, world/zone rendering.
- `customDrag.js`: Encapsulated drag state and rotation logic (`window.DragSystem`).
- `dragdropengine.js`: Drop validation and placement fallback search.
- `gridEngine.js`: Placement validity and grid writes.
- `workshopEngine.js`: Grid slot rendering and drag pickup integration.
- `saveengine.js`: Save/load normalization and storage adapter.
- `worldData.js`: Act and zone definitions.
- `combatEngine.js`: Zone combat runtime scaffold.

### Item and data files
- `tools.js`, `swords.js`, `bows.js`, `armor.js`, `jewelry.js`, `shields.js`, `accessories.js`, `weapons.js`
- `itemRegistry.js` for central item lookup and initialization.

---

## Development Workflow

- Use feature branches for larger changes.
- Keep docs aligned with real runtime constants before release.
- Maintain `progress.md` as handover log during multi-session work.
- Before release:
  - Verify drag and rotation
  - Verify save/load normalization
  - Verify world and zone navigation paths
  - Verify no new console errors

---

## Roadmap Snapshot

### Done
- Drag architecture consolidation into `customDrag.js`.
- Adventure hub dropdown clipping fix.
- Zone CTA hover shift fix.
- Zone stats panel unfold to right edge with spacing.
- World submenu spacing refinements.
- Added Act 3 placeholder card.

### In progress
- Broader world/zone gameplay loop expansion.
- Final synergy and aura effect gameplay layer.
- Documentation and verification flow hardening.

### Planned
- Expanded monsters and encounters per zone.
- Additional acts and map progression.
- Deeper item synergy and buff visualization.

---

## Notes

- Keep UI behavior intentional: avoid accidental motion regressions.
- Prefer small, verifiable iterations with explicit doc updates.

---

**Last Updated**: 2026-02-13
**Maintainer**: Bambo90 + Codex
