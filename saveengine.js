// ==========================================
// SAVE ENGINE (saveengine.js)
// Handhabt LocalStorage und Daten-Integrität
// ==========================================

const SAVE_KEY = "LoadoutLegends_v1";
const SAVE_VERSION = 2;

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
                ['bank', 'farmGrid', 'pveGrid', 'pvpGrid'].forEach((gridKey) => {
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
        placeItemIntoGrid(newGrid, k, item, shapeCopy, cols, instanceId, null, rotatedAura, rotationIndex);
    });

    return newGrid;
}

function saveGame() {
    const storage = getStorageAdapter();
    if (typeof ensureCharacterModelOnGameData === "function") {
        ensureCharacterModelOnGameData(gameData);
    }
    if (typeof markCharacterStatsDirty === "function") {
        markCharacterStatsDirty(gameData);
    }
    if (typeof getCharacterDerivedStats === "function") {
        getCharacterDerivedStats(gameData, { gridKey: "farmGrid" });
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
            if (!gameData.monsterDefeats) gameData.monsterDefeats = {};
            if (!gameData.currentMonsterIndex) gameData.currentMonsterIndex = 0;

            // Sync instance ID counter from loaded grids
            if (typeof syncInstanceIdCounterFromGrids === 'function') {
                syncInstanceIdCounterFromGrids([gameData.bank, gameData.farmGrid, gameData.pveGrid, gameData.pvpGrid]);
            }

            if (typeof ensureCharacterModelOnGameData === "function") {
                ensureCharacterModelOnGameData(gameData);
            }
            if (typeof markCharacterStatsDirty === "function") {
                markCharacterStatsDirty(gameData);
            }
            if (typeof getCharacterDerivedStats === "function") {
                getCharacterDerivedStats(gameData, { gridKey: "farmGrid" });
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
        gameData.monsterDefeats = {};
        if (typeof ensureCharacterModelOnGameData === "function") {
            ensureCharacterModelOnGameData(gameData);
        }
        if (typeof markCharacterStatsDirty === "function") {
            markCharacterStatsDirty(gameData);
        }
        if (typeof getCharacterDerivedStats === "function") {
            getCharacterDerivedStats(gameData, { gridKey: "farmGrid" });
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
