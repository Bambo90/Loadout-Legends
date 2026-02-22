# Loadout Legends

Grid-based idle progression and loadout combat prototype inspired by Melvor Idle and Backpack Battles.

## Golden Rules

1. Simulation is pure logic.
2. Item instances are serializable.
3. UI renders state and should not own gameplay logic.

## Quickstart

### Web

```bash
npm install
npm run start
```

Open `http://localhost:8080`.

### Electron

```bash
npm run electron:dev
```

## Current Snapshot

- Status: `Pre-Alpha Prototype`
- Playable core: coast zone combat, inventory/workshop drag+rotate, shop, saves, character panel, options.
- Reference context: see `CODEX_CONTEXT.md`.

## Structure (Key Files)

- `index.html`: app shell and script loading
- `script.js`: runtime orchestration
- `character.js`: character and derived stats
- `itemDefs.js`, `affixDefs.js`, `generator.js`: item and affix systems
- `customDrag.js`, `dragdropengine.js`, `gridEngine.js`: inventory mechanics
- `saveengine.js`: save/load and migrations
- `worldData.js`, `monsters.js`, `lootPools.js`: world/content data

## Documentation

- `CODEX_CONTEXT.md`: canonical AI/human project context
- `NEXT.md`: short active roadmap
- `RELEASING.md`: release process
- `CHANGELOG.md`: notable changes
- `docs/releases/`: detailed release notes
- `docs/verification/`: release verification checklists
- `docs/archive/` and `docs/worklog/`: historical logs

## License

TBD
