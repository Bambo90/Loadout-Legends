<!-- Copilot / AI agent instructions for working productively in this repo -->
# Loadout Legends — Copilot instructions

This project is a single-page web/electron game assembled from many small JS engines and item definition files. Use these notes to get productive quickly.

- **Big picture**: `index.html` loads many item definition scripts first, then the central registry and engines, and finally `script.js` which composes runtime state (`gameData`) and mounts UI hooks. Engines are small, focused modules (item registry, generator, combat, drag/drop, grid/workshop/storage). See `index.html` for exact load order.

- **Critical files (quick links)**
  - Project entry: [index.html](index.html)
  - App orchestrator: [script.js](script.js)
  - Item registry: [itemRegistry.js](itemRegistry.js)
  - Legacy items compatibility: [itemsEngine.js](itemsEngine.js)
  - Item generator: [generator.js](generator.js)
  - Combat & stats helpers: [combatEngine.js](combatEngine.js)
  - Drag & drop runtime: [customDrag.js](customDrag.js) and [dragdropengine.js](dragdropengine.js)
  - Workshop/storage UI: [workshopEngine.js](workshopEngine.js), [storageEngine.js](storageEngine.js)
  - Electron hooks: [electron-main.js](electron-main.js), [preload.js](preload.js), [platformBridge.js](platformBridge.js)

- **Loading order & why it matters**
  - `index.html` intentionally includes all `items_*.js` before `itemRegistry.js` so `initializeItemRegistry()` can collect arrays like `SWORD_ITEMS` into `ALL_ITEMS`. Do not re-order unless you also update registry initialization.
  - `generator.js` expects affix/affix-def helpers to exist (`getAffixDefById`, `getAffixDefsByGroup`) — check `affixDefs.js` load and definitions.

- **Global runtime surface**
  - `script.js` exposes a single `gameData` object as the runtime state (serializable). Many engines read/modify `gameData` directly.
  - Registry/API functions commonly used across engines: `getItemById`, `ALL_ITEMS`, `initializeItemRegistry`, `generateItem`, `getItemRotationGrid`.
  - Events: listen for `character:stats-updated` (dispatched from `script.js`) to react to character/stat changes.
  - Drag system: `window.DragSystem` provided by `customDrag.js`.

- **Project-specific conventions & patterns**
  - Backwards-compatibility pattern: functions check for optional overrides (e.g., `if (typeof getRuntimeItemDefinition === 'function')`) — prefer implementing new behavior by adding functions rather than editing core engine files when possible.
  - Item instances: use `baseId` on instances; `itemsEngine.resolveItemData()` merges instance with base. Don't mutate base templates in `ALL_ITEMS`.
  - Item grids: combined grids use flags `'B'`, `'A'`, `'AB'` (body / aura). Use `getItemRotationGrid` and `_buildCombinedGrid` helpers.
  - RNG helpers: `generator.js` accepts an optional RNG function; prefer deterministic tests by injecting an RNG function.
  - Serializability: `gameData` must be serializable (see rules in `README.md`), tests and save/load assume plain objects.

- **Common developer workflows**
  - Quick local server (web):

    ```bash
    cd "c:\Users\bbs2e\Desktop\Loadout Legends"
    npx http-server . -p 8080
    # open http://localhost:8080
    ```

  - Electron dev (desktop):

    ```bash
    npm install
    npm run electron:dev
    ```

  - Registry initialization: guarantee `initializeItemRegistry()` runs after all `items_*.js` are loaded; `script.js` expects that registry to be ready.

- **Integration points to be mindful of**
  - `platformBridge.js` and `preload.js` bridge web runtime to Electron — updates here affect desktop behavior.
  - `saveengine.js` and `storageEngine.js` define save/load and bank formats used throughout; keep changes backward-compatible to preserve serialized saves.

- **How to add or override behavior safely**
  - Add optional override functions (checked via `typeof foo === 'function'`) instead of editing engine core when possible. Example: provide `getRuntimeItemDefinition(gameData, itemId, cell)` to change runtime item values without touching `itemsEngine.js`.
  - When introducing new global symbols, prefer namespaced properties on `window` (e.g., `window.MyFeature`) to avoid accidental conflicts.

- **Examples**
  - Resolve an item instance for display: `const resolved = resolveItemData(instance);` (see `itemsEngine.js`)
  - Generate a random item with deterministic RNG for tests:

    ```js
    const rng = () => 0.42; // replace with seeded generator
    const payload = generateItem('sword_basic', 3, { rng });
    ```

- **What not to change casually**
  - The load order in `index.html` and the shape of `gameData` — many modules rely on those implicit contracts.

If any of the runtime assumptions above are unclear or you'd like more examples (tests, small harness, or a deterministic RNG helper), tell me which area to expand and I will update this doc.
