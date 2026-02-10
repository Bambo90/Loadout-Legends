// ==========================================
// SAVE ENGINE (Saveengine.js)
// Handhabt LocalStorage und Daten-Integrität
// ==========================================

const SAVE_KEY = "LoadoutLegends_v1";

function normalizeGridInstances(grid, cols) {
    if (!grid) return {};
    if (typeof getItemById !== 'function' || typeof placeItemIntoGrid !== 'function') {
        return grid;
    }
    const newGrid = {};
    const keys = Object.keys(grid).map(k => parseInt(k, 10)).filter(n => !isNaN(n)).sort((a, b) => a - b);
    const roots = keys.filter(k => grid[k] && grid[k].root);
    const rootKeys = roots.length > 0 ? roots : keys;

    rootKeys.forEach(k => {
        const cell = grid[k];
        if (!cell || !cell.itemId) return;
        const item = getItemById(cell.itemId);
        if (!item) return;
        const shape = cell.shape || item.body || item.shape || [[1]];
        const shapeCopy = shape.map(r => [...r]);
        const instanceId = cell.instanceId;
        placeItemIntoGrid(newGrid, k, item, shapeCopy, cols, instanceId);
    });

    return newGrid;
}

function saveGame() {
    localStorage.setItem(SAVE_KEY, JSON.stringify(gameData));
    console.log("Spielstand automatisch gespeichert.");
}

function loadGame() {
    const saved = localStorage.getItem(SAVE_KEY);
    if (saved) {
        try {
            const loadedData = JSON.parse(saved);
            
            // Wir mergen die geladenen Daten vorsichtig in gameData
            // Das stellt sicher, dass neue Variablen (die es im alten Save nicht gab) existieren
            gameData = { ...gameData, ...loadedData };

            // Spezifischer Fix für die Grids: Falls sie fehlen, neu erstellen
            if (!gameData.bank) gameData.bank = {};
            if (!gameData.farmGrid) gameData.farmGrid = {};
            if (!gameData.pveGrid) gameData.pveGrid = {};
            if (!gameData.pvpGrid) gameData.pvpGrid = {};
            if (!gameData.monsterDefeats) gameData.monsterDefeats = {};
            if (!gameData.currentMonsterIndex) gameData.currentMonsterIndex = 0;

            // Normalize grids to ensure instanceIds exist and stale cells are cleaned
            const bankCols = 6;
            const gridCols = typeof GRID_SIZE === 'number' ? GRID_SIZE : 5;
            gameData.bank = normalizeGridInstances(gameData.bank, bankCols);
            gameData.farmGrid = normalizeGridInstances(gameData.farmGrid, gridCols);
            gameData.pveGrid = normalizeGridInstances(gameData.pveGrid, gridCols);
            gameData.pvpGrid = normalizeGridInstances(gameData.pvpGrid, gridCols);

            if (typeof syncInstanceIdCounterFromGrids === 'function') {
                syncInstanceIdCounterFromGrids([gameData.bank, gameData.farmGrid, gameData.pveGrid, gameData.pvpGrid]);
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
        localStorage.removeItem(SAVE_KEY);
        location.reload();
    }
}