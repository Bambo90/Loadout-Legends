// ==========================================
// SAVE ENGINE (saveengine.js)
// Handhabt LocalStorage und Daten-Integrität
// ==========================================

const SAVE_KEY = "LoadoutLegends_v1";
const SAVE_VERSION = 5;

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
    if (typeof ensureBankPageData === "function") {
        ensureBankPageData(gameData);
    }
    if (!gameData.settings || typeof gameData.settings !== "object" || Array.isArray(gameData.settings)) {
        gameData.settings = {};
    }
    if (typeof gameData.settings.itemTooltipsEnabled !== "boolean") {
        gameData.settings.itemTooltipsEnabled = true;
    }
    if (typeof ensureItemInstanceIntegrity === "function") {
        ensureItemInstanceIntegrity(gameData);
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
            if (!gameData.sortGrid) gameData.sortGrid = {};
            if (!gameData.monsterDefeats) gameData.monsterDefeats = {};
            if (!gameData.currentMonsterIndex) gameData.currentMonsterIndex = 0;
            if (!gameData.settings || typeof gameData.settings !== "object" || Array.isArray(gameData.settings)) {
                gameData.settings = {};
            }
            if (typeof gameData.settings.itemTooltipsEnabled !== "boolean") {
                gameData.settings.itemTooltipsEnabled = true;
            }
            if (typeof ensureBankPageData === "function") {
                ensureBankPageData(gameData);
            }

            // Sync instance ID counter from loaded grids
            if (typeof syncInstanceIdCounterFromGrids === 'function') {
                const bankGrids = Array.isArray(gameData.bankPages) ? gameData.bankPages : [gameData.bank];
                syncInstanceIdCounterFromGrids([...bankGrids, gameData.farmGrid, gameData.pveGrid, gameData.pvpGrid, gameData.sortGrid]);
            }
            if (typeof ensureItemInstanceIntegrity === "function") {
                ensureItemInstanceIntegrity(gameData);
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
        gameData.sortGrid = {};
        gameData.monsterDefeats = {};
        if (typeof ensureBankPageData === "function") {
            ensureBankPageData(gameData);
        }
        if (!gameData.settings || typeof gameData.settings !== "object" || Array.isArray(gameData.settings)) {
            gameData.settings = {};
        }
        if (typeof gameData.settings.itemTooltipsEnabled !== "boolean") {
            gameData.settings.itemTooltipsEnabled = true;
        }
        if (typeof ensureItemInstanceIntegrity === "function") {
            ensureItemInstanceIntegrity(gameData);
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
