// ==========================================
// SAVE ENGINE (saveengine.js)
// Handhabt LocalStorage und Daten-Integrität
// ==========================================

const SAVE_KEY = "LoadoutLegends_v1";
const SAVE_VERSION = 7;
const ONE_TIME_RESET_MARKER_KEY = "LoadoutLegends_one_time_reset_2026_02_25";
const DEFAULT_SETTINGS_AUDIO = Object.freeze({
    menu: 80,
    music: 70,
    ambient: 70
});
const DEFAULT_SETTINGS_KEYBINDS = Object.freeze({
    rotateItem: "KeyR",
    toggleTooltips: "Alt",
    toggleAffixDetails: "KeyA",
    cancelAction: "Escape"
});
const DEFAULT_ACTIVE_GRID_KEY = "farmGrid";
const VALID_ACTIVE_GRID_KEYS = Object.freeze(["farmGrid", "pveGrid", "pvpGrid", "sortGrid"]);
const SAVEENGINE_BATTLEFIELD_MAX_PAGES = 9;
const SAVEENGINE_BATTLEFIELD_DEFAULT_UNLOCKED_PAGES = 2;

function _clampVolumePercent(value, fallbackValue) {
    const fallback = Number.isFinite(fallbackValue) ? fallbackValue : 100;
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return Math.max(0, Math.min(100, Math.round(fallback)));
    return Math.max(0, Math.min(100, Math.round(numeric)));
}

function ensureSettingsDefaultsInData(target) {
    if (!target || typeof target !== "object") return target;
    if (!target.settings || typeof target.settings !== "object" || Array.isArray(target.settings)) {
        target.settings = {};
    }
    if (typeof target.settings.itemTooltipsEnabled !== "boolean") {
        target.settings.itemTooltipsEnabled = true;
    }
    if (typeof target.settings.devMode !== "boolean") {
        target.settings.devMode = false;
    }
    if (typeof target.settings.activeGridKey !== "string" || !VALID_ACTIVE_GRID_KEYS.includes(target.settings.activeGridKey)) {
        target.settings.activeGridKey = DEFAULT_ACTIVE_GRID_KEY;
    }
    if (!target.settings.keybinds || typeof target.settings.keybinds !== "object" || Array.isArray(target.settings.keybinds)) {
        target.settings.keybinds = {};
    }
    Object.keys(DEFAULT_SETTINGS_KEYBINDS).forEach((actionId) => {
        const value = target.settings.keybinds[actionId];
        if (typeof value !== "string" || !value.trim()) {
            delete target.settings.keybinds[actionId];
        } else {
            target.settings.keybinds[actionId] = value.trim();
        }
    });
    if (!target.settings.audio || typeof target.settings.audio !== "object" || Array.isArray(target.settings.audio)) {
        target.settings.audio = {};
    }
    target.settings.audio.menu = _clampVolumePercent(target.settings.audio.menu, DEFAULT_SETTINGS_AUDIO.menu);
    target.settings.audio.music = _clampVolumePercent(target.settings.audio.music, DEFAULT_SETTINGS_AUDIO.music);
    target.settings.audio.ambient = _clampVolumePercent(target.settings.audio.ambient, DEFAULT_SETTINGS_AUDIO.ambient);
    return target;
}

function _resolveConfiguredActiveGridKeyFromData(target) {
    if (!target || typeof target !== "object") return DEFAULT_ACTIVE_GRID_KEY;
    const settings = target.settings && typeof target.settings === "object" ? target.settings : null;
    const configured = settings && typeof settings.activeGridKey === "string" ? settings.activeGridKey : DEFAULT_ACTIVE_GRID_KEY;
    return VALID_ACTIVE_GRID_KEYS.includes(configured) ? configured : DEFAULT_ACTIVE_GRID_KEY;
}

function ensureBattlefieldDefaultsInData(target) {
    if (!target || typeof target !== "object") return target;
    if (!target.battlefield || typeof target.battlefield !== "object" || Array.isArray(target.battlefield)) {
        target.battlefield = { pages: {}, unlockedPages: SAVEENGINE_BATTLEFIELD_DEFAULT_UNLOCKED_PAGES, activePage: 1 };
    }

    const battlefield = target.battlefield;
    if (!battlefield.pages || typeof battlefield.pages !== "object" || Array.isArray(battlefield.pages)) {
        battlefield.pages = {};
    }

    for (let i = 1; i <= SAVEENGINE_BATTLEFIELD_MAX_PAGES; i++) {
        const key = String(i);
        if (!battlefield.pages[key] || typeof battlefield.pages[key] !== "object" || Array.isArray(battlefield.pages[key])) {
            battlefield.pages[key] = {};
        }
    }

    const unlocked = Number.isFinite(battlefield.unlockedPages) ? Math.floor(battlefield.unlockedPages) : SAVEENGINE_BATTLEFIELD_DEFAULT_UNLOCKED_PAGES;
    battlefield.unlockedPages = Math.max(1, Math.min(SAVEENGINE_BATTLEFIELD_MAX_PAGES, unlocked));

    const active = Number.isFinite(battlefield.activePage) ? Math.floor(battlefield.activePage) : 1;
    battlefield.activePage = Math.max(1, Math.min(battlefield.unlockedPages, active));
    return target;
}

function getStorageAdapter() {
    if (typeof window !== "undefined" && window.PlatformBridge && window.PlatformBridge.storage) {
        return window.PlatformBridge.storage;
    }

    return {
        getItem(key) {
            try {
                return localStorage.getItem(key);
            } catch (err) {
                return null;
            }
        },
        setItem(key, value) {
            try {
                localStorage.setItem(key, value);
                return true;
            } catch (err) {
                return false;
            }
        },
        removeItem(key) {
            try {
                localStorage.removeItem(key);
                return true;
            } catch (err) {
                return false;
            }
        }
    };
}

function applyOneTimeForcedSaveReset(storage) {
    if (!storage || typeof storage.getItem !== "function" || typeof storage.setItem !== "function" || typeof storage.removeItem !== "function") {
        return;
    }
    const alreadyDone = storage.getItem(ONE_TIME_RESET_MARKER_KEY);
    if (alreadyDone === "1") return;
    storage.removeItem(SAVE_KEY);
    storage.setItem(ONE_TIME_RESET_MARKER_KEY, "1");
    console.warn("One-time save reset applied: existing save data was deleted.");
}

function cloneSaveData(data) {
    if (!data || typeof data !== "object" || Array.isArray(data)) return {};
    try {
        // Deep clone keeps migrations side-effect free.
        return JSON.parse(JSON.stringify(data));
    } catch (err) {
        // Fallback for unexpected non-serializable fields.
        return { ...data };
    }
}

function splitLegacyBankIntoPages(legacyBank, totalPages, pageSlots) {
    const pagesCount = Number.isInteger(totalPages) && totalPages > 0 ? totalPages : 8;
    const slotsPerPage = Number.isInteger(pageSlots) && pageSlots > 0 ? pageSlots : 100;
    const pages = Array.from({ length: pagesCount }, () => ({}));
    if (!legacyBank || typeof legacyBank !== "object" || Array.isArray(legacyBank)) return pages;

    const rootPageByInstanceId = {};
    Object.keys(legacyBank).forEach((slotKey) => {
        const slotIndex = parseInt(slotKey, 10);
        const cell = legacyBank[slotKey];
        if (!Number.isFinite(slotIndex) || !cell || typeof cell !== "object") return;
        if (!cell.root || !cell.instanceId) return;
        const pageIndex = Math.floor(slotIndex / slotsPerPage);
        if (pageIndex >= 0 && pageIndex < pagesCount) {
            rootPageByInstanceId[cell.instanceId] = pageIndex;
        }
    });

    Object.keys(legacyBank).forEach((slotKey) => {
        const slotIndex = parseInt(slotKey, 10);
        const cell = legacyBank[slotKey];
        if (!Number.isFinite(slotIndex) || !cell || typeof cell !== "object") return;

        const fallbackPage = Math.floor(slotIndex / slotsPerPage);
        const pageIndex = (cell.instanceId && Number.isInteger(rootPageByInstanceId[cell.instanceId]))
            ? rootPageByInstanceId[cell.instanceId]
            : fallbackPage;
        if (pageIndex < 0 || pageIndex >= pagesCount) return;

        const localIndex = slotIndex - (pageIndex * slotsPerPage);
        if (localIndex < 0 || localIndex >= slotsPerPage) return;
        pages[pageIndex][localIndex] = cloneSaveData(cell);
    });

    return pages;
}

/**
 * Migrate save data from older versions to SAVE_VERSION.
 * Migrations are applied sequentially.
 */
function migrateSave(data, version) {
    let migrated = cloneSaveData(data);
    let currentVersion = Number.isInteger(version) && version >= 0 ? version : 0;

    while (currentVersion < SAVE_VERSION) {
        switch (currentVersion) {
            case 0: {
                // v0 -> v1:
                // Move legacy top-level gold into currencies.gold.
                if (!migrated.currencies || typeof migrated.currencies !== "object" || Array.isArray(migrated.currencies)) {
                    migrated.currencies = {};
                }
                if (typeof migrated.gold === "number" && typeof migrated.currencies.gold !== "number") {
                    migrated.currencies.gold = migrated.gold;
                    delete migrated.gold;
                }

                // Legacy cell migration:
                // old saves may embed item objects or baseId instead of itemId.
                ['bank', 'farmGrid', 'pveGrid', 'pvpGrid', 'sortGrid'].forEach((gridKey) => {
                    const grid = migrated[gridKey];
                    if (!grid || typeof grid !== "object") return;
                    Object.keys(grid).forEach((slotKey) => {
                        const cell = grid[slotKey];
                        if (!cell || typeof cell !== "object") return;
                        if (!cell.itemId) {
                            const legacyItemId = cell.baseId || (cell.item && cell.item.id) || null;
                            if (legacyItemId) {
                                cell.itemId = legacyItemId;
                            }
                        }
                    });
                });
                currentVersion = 1;
                break;
            }
            case 1: {
                // v1 -> v2:
                // Migrate legacy top-level character fields into character.base.
                if (typeof migrateLegacyCharacterInSave === "function") {
                    migrated = migrateLegacyCharacterInSave(migrated);
                }
                currentVersion = 2;
                break;
            }
            case 2: {
                // v2 -> v3:
                // Add explicit settings container for global UI toggles (e.g. item tooltips).
                if (!migrated.settings || typeof migrated.settings !== "object" || Array.isArray(migrated.settings)) {
                    migrated.settings = {};
                }
                if (typeof migrated.settings.itemTooltipsEnabled !== "boolean") {
                    migrated.settings.itemTooltipsEnabled = true;
                }
                currentVersion = 3;
                break;
            }
            case 3: {
                // v3 -> v4:
                // Introduce paged storage: migrate legacy single bank into bankPages[0].
                const legacyBank = (migrated.bank && typeof migrated.bank === "object" && !Array.isArray(migrated.bank))
                    ? migrated.bank
                    : {};
                if (!Array.isArray(migrated.bankPages) || migrated.bankPages.length === 0) {
                    migrated.bankPages = splitLegacyBankIntoPages(legacyBank, 8, 100);
                } else if (!migrated.bankPages[0] || typeof migrated.bankPages[0] !== "object") {
                    migrated.bankPages[0] = cloneSaveData(legacyBank);
                }

                if (!Array.isArray(migrated.pageMeta)) {
                    migrated.pageMeta = [];
                }
                if (!migrated.bankMeta || typeof migrated.bankMeta !== "object" || Array.isArray(migrated.bankMeta)) {
                    migrated.bankMeta = {};
                }
                if (!Number.isInteger(migrated.bankMeta.activePage)) {
                    migrated.bankMeta.activePage = 0;
                }
                if (typeof ensureBankPageData === "function") {
                    ensureBankPageData(migrated);
                } else {
                    migrated.bank = migrated.bankPages[0] || {};
                }

                currentVersion = 4;
                break;
            }
            case 4: {
                // v4 -> v5:
                // Add non-combat staging grid for workshop sorting.
                if (!migrated.sortGrid || typeof migrated.sortGrid !== "object" || Array.isArray(migrated.sortGrid)) {
                    migrated.sortGrid = {};
                }
                currentVersion = 5;
                break;
            }
            case 5: {
                // v5 -> v6:
                // Add Optionen settings for keybinds and audio mixer channels.
                ensureSettingsDefaultsInData(migrated);
                currentVersion = 6;
                break;
            }
            case 6: {
                // v6 -> v7:
                // Add battlefield container pages for zone combat drops.
                ensureBattlefieldDefaultsInData(migrated);
                currentVersion = 7;
                break;
            }
            default: {
                console.warn(`Unbekannte Save-Version ${currentVersion}. Migration wird auf aktuelle Version gesetzt.`);
                currentVersion = SAVE_VERSION;
                break;
            }
        }
    }

    return { data: migrated, version: currentVersion };
}

function normalizeGridInstances(grid, cols) {
    if (!grid) return {};
    if (typeof placeItemIntoGrid !== 'function') {
        return grid;
    }
    if (typeof getItemDefById !== 'function' && typeof getItemById !== 'function') {
        return grid;
    }

    // Start with clean slate - no orphaned aura cells
    const newGrid = {};

    const keys = Object.keys(grid).map(k => parseInt(k, 10)).filter(n => !isNaN(n)).sort((a, b) => a - b);
    const roots = keys.filter(k => grid[k] && grid[k].root);
    const rootKeys = roots.length > 0 ? roots : keys;

    rootKeys.forEach(k => {
        const cell = grid[k];
        if (!cell || !cell.itemId) return;
        const item = (typeof getItemDefById === 'function')
            ? getItemDefById(cell.itemId)
            : getItemById(cell.itemId);
        if (!item) return;
        // Always use body shape (never aura) to ensure placement is valid
        const rotationIndex = typeof cell.rotationIndex === 'number' ? cell.rotationIndex : 0;
        const shape = (typeof getItemBodyMatrix === 'function')
            ? getItemBodyMatrix(item, rotationIndex)
            : (item.body || [[1]]);
        const shapeCopy = shape.map(r => [...r]);
        const instanceId = cell.instanceId;
        const rotatedAura = cell.rotatedAura || null; // Preserve rotated aura if it was stored
        const placed = placeItemIntoGrid(newGrid, k, item, shapeCopy, cols, instanceId, null, rotatedAura, rotationIndex);
        if (placed) return;
        const maxRows = (newGrid === gameData.bank) ? Math.ceil(BANK_SLOTS / cols) : GRID_ROWS;
        for (let i = 0; i < cols * maxRows; i++) {
            if (!canPlaceItem(newGrid, i, shapeCopy, cols, maxRows)) continue;
            const fallbackPlaced = placeItemIntoGrid(newGrid, i, item, shapeCopy, cols, instanceId, null, rotatedAura, rotationIndex);
            if (fallbackPlaced) return;
        }
        console.warn('normalizeGridInstances: failed to place item transactionally', {
            itemId: cell.itemId,
            instanceId,
            originalIndex: k
        });
    });

    return newGrid;
}

function saveGame() {
    const storage = getStorageAdapter();
    if (typeof ensureBankPageData === "function") {
        ensureBankPageData(gameData);
    }
    ensureBattlefieldDefaultsInData(gameData);
    ensureSettingsDefaultsInData(gameData);
    if (typeof ensureItemInstanceIntegrity === "function") {
        ensureItemInstanceIntegrity(gameData);
    }
    if (typeof ensureCharacterModelOnGameData === "function") {
        ensureCharacterModelOnGameData(gameData);
    }
    if (typeof markCharacterStatsDirty === "function") {
        markCharacterStatsDirty(gameData);
    }
    const activeGridKey = _resolveConfiguredActiveGridKeyFromData(gameData);
    if (typeof getCharacterDerivedStats === "function") {
        getCharacterDerivedStats(gameData, { gridKey: activeGridKey });
    }

    // Persist only dynamic instance data in saves. Static base values come from itemDefs by itemId.
    let dataForSave = (typeof sanitizeSaveDataForPersistence === 'function')
        ? sanitizeSaveDataForPersistence(gameData)
        : gameData;
    if (typeof sanitizeCharacterForSave === "function") {
        dataForSave = sanitizeCharacterForSave(dataForSave);
    }
    const payload = {
        saveVersion: SAVE_VERSION,
        data: dataForSave
    };
    const saved = storage.setItem(SAVE_KEY, JSON.stringify(payload));
    if (saved) {
        console.log("Spielstand automatisch gespeichert.");
    } else {
        console.error("Speichern fehlgeschlagen: Storage nicht verfügbar.");
    }
}

function loadGame() {
    const storage = getStorageAdapter();
    applyOneTimeForcedSaveReset(storage);
    const saved = storage.getItem(SAVE_KEY);
    if (saved) {
        try {
            const parsedSave = JSON.parse(saved);

            // Backward compatibility:
            // - New format: { saveVersion, data }
            // - Old format: raw gameData object without wrapper/version
            const wrappedFormat = parsedSave && typeof parsedSave === "object" && !Array.isArray(parsedSave) &&
                Object.prototype.hasOwnProperty.call(parsedSave, "data");
            const loadedVersion = wrappedFormat && typeof parsedSave.saveVersion === "number"
                ? parsedSave.saveVersion
                : 0;
            const rawLoadedData = wrappedFormat ? parsedSave.data : parsedSave;

            const migration = migrateSave(rawLoadedData, loadedVersion);
            const migratedData = (typeof sanitizeLoadedSaveData === 'function')
                ? sanitizeLoadedSaveData(migration.data)
                : migration.data;

            if (migration.version !== loadedVersion) {
                console.log(`Savegame migriert: v${loadedVersion} -> v${migration.version}`);
            }

            // Runtime bridge while game systems still read gameData.gold directly.
            if (migratedData.currencies &&
                typeof migratedData.currencies === "object" &&
                typeof migratedData.currencies.gold === "number" &&
                typeof migratedData.gold !== "number") {
                migratedData.gold = migratedData.currencies.gold;
            }

            // Wir mergen die geladenen Daten vorsichtig in gameData
            // Das stellt sicher, dass neue Variablen (die es im alten Save nicht gab) existieren
            gameData = { ...gameData, ...migratedData };

            // Spezifischer Fix für die Grids: Falls sie fehlen, neu erstellen
            if (!gameData.bank) gameData.bank = {};
            if (!gameData.farmGrid) gameData.farmGrid = {};
            if (!gameData.pveGrid) gameData.pveGrid = {};
            if (!gameData.pvpGrid) gameData.pvpGrid = {};
            if (!gameData.sortGrid) gameData.sortGrid = {};
            if (!gameData.monsterDefeats) gameData.monsterDefeats = {};
            if (!gameData.currentMonsterIndex) gameData.currentMonsterIndex = 0;
            ensureBattlefieldDefaultsInData(gameData);
            ensureSettingsDefaultsInData(gameData);
            if (typeof ensureBankPageData === "function") {
                ensureBankPageData(gameData);
            }

            // Sync instance ID counter from loaded grids
            if (typeof syncInstanceIdCounterFromGrids === 'function') {
                const bankGrids = Array.isArray(gameData.bankPages) ? gameData.bankPages : [gameData.bank];
                const battlefieldGrids = [];
                if (gameData.battlefield && gameData.battlefield.pages && typeof gameData.battlefield.pages === "object") {
                    Object.keys(gameData.battlefield.pages).forEach((pageKey) => {
                        battlefieldGrids.push(gameData.battlefield.pages[pageKey]);
                    });
                }
                syncInstanceIdCounterFromGrids([...bankGrids, gameData.farmGrid, gameData.pveGrid, gameData.pvpGrid, gameData.sortGrid, ...battlefieldGrids]);
            }
            if (typeof ensureItemInstanceIntegrity === "function") {
                ensureItemInstanceIntegrity(gameData);
            }
            if (typeof runGridIntegritySweep === 'function' && typeof window !== 'undefined' && window.DEBUG_GRID_INTEGRITY === true) {
                runGridIntegritySweep(gameData, { debug: true });
            }

            if (typeof ensureCharacterModelOnGameData === "function") {
                ensureCharacterModelOnGameData(gameData);
            }
            if (typeof markCharacterStatsDirty === "function") {
                markCharacterStatsDirty(gameData);
            }
            const activeGridKey = _resolveConfiguredActiveGridKeyFromData(gameData);
            if (typeof getCharacterDerivedStats === "function") {
                getCharacterDerivedStats(gameData, { gridKey: activeGridKey });
            }

            console.log("Spielstand erfolgreich geladen.");
        } catch (e) {
            console.error("Fehler beim Laden des Spielstands:", e);
        }
    } else {
        console.log("Kein Spielstand gefunden. Starte neues Spiel.");
        // Initialize grids as empty objects
        gameData.bank = {};
        gameData.farmGrid = {};
        gameData.pveGrid = {};
        gameData.pvpGrid = {};
        gameData.sortGrid = {};
        gameData.monsterDefeats = {};
        ensureBattlefieldDefaultsInData(gameData);
        if (typeof ensureBankPageData === "function") {
            ensureBankPageData(gameData);
        }
        ensureSettingsDefaultsInData(gameData);
        if (typeof ensureItemInstanceIntegrity === "function") {
            ensureItemInstanceIntegrity(gameData);
        }
        if (typeof runGridIntegritySweep === 'function' && typeof window !== 'undefined' && window.DEBUG_GRID_INTEGRITY === true) {
            runGridIntegritySweep(gameData, { debug: true });
        }
        if (typeof ensureCharacterModelOnGameData === "function") {
            ensureCharacterModelOnGameData(gameData);
        }
        if (typeof markCharacterStatsDirty === "function") {
            markCharacterStatsDirty(gameData);
        }
        const activeGridKey = _resolveConfiguredActiveGridKeyFromData(gameData);
        if (typeof getCharacterDerivedStats === "function") {
            getCharacterDerivedStats(gameData, { gridKey: activeGridKey });
        }
    }

    // Nach dem Laden UI initialisieren
    spawnMonster(0);
    renderShop();
    initTooltipListeners();
    if (typeof initGlobalDragListeners === 'function') {
        initGlobalDragListeners();
    }
    updateUI();
}

/**
 * Löscht den Spielstand (für Testzwecke)
 */
function resetGame() {
    if (confirm("Möchtest du wirklich alles löschen? Fortschritt geht verloren!")) {
        const storage = getStorageAdapter();
        storage.removeItem(SAVE_KEY);
        location.reload();
    }
}
