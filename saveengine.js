// ==========================================
// SAVE ENGINE (Saveengine.js)
// Handhabt LocalStorage und Daten-Integrität
// ==========================================

const SAVE_KEY = "LoadoutLegends_v1";

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