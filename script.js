// ==========================================
// LOADOUT LEGENDS – CORE INIT SCRIPT (V2)
// Zentraler Hub - Hält alle Engines zusammen
// ==========================================

let gameData = {
    gold: 50,
    level: 1,
    xp: 0,
    xpNextLevel: 500,
    hp: 100,
    maxHp: 100,
    hpRegen: 1,
    workProgress: 0,
    pendingGold: 0,
    focusUntil: 0,
    lastUpdate: Date.now(),
    bank: {},
    farmGrid: {},
    pveGrid: {},
    pvpGrid: {},
    totalGold: 0,
    totalXP: 0,
    currentMonster: null
};

const BANK_SLOTS = 30;
const GRID_SIZE = 5;
const FOCUS_DURATION = 60 * 60 * 1000;

let currentWorkshop = null;
let lastMonsterAttack = Date.now();

// ==========================================
// NAVIGATION & EQUIPMENT HUB (VORSCHAU-FIX)
// ==========================================

function switchTab(tabId) {
    if (typeof hideTooltip === 'function') hideTooltip();
    
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
        tab.style.display = 'none';
    });
    
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));

    const target = document.getElementById('tab-' + tabId);
    if (target) {
        target.style.display = 'block';
        setTimeout(() => target.classList.add('active'), 50);
    }
    
    // UI-Bridge: Markiere den aktiven Button
    const activeBtn = Array.from(document.querySelectorAll('.nav-btn'))
        .find(btn => btn.getAttribute('onclick')?.includes(tabId));
    if (activeBtn) activeBtn.classList.add('active');

    if (tabId === 'equipment') renderEquipmentHub();
}

function renderEquipmentHub() {
    renderPreviewGrid('preview-farm', 'farmGrid');
    renderPreviewGrid('preview-pve', 'pveGrid');
    renderPreviewGrid('preview-bank-small', 'bank');
}

function renderPreviewGrid(containerId, gridKey) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';
    
    // Vorschau-Grids sind immer 5x5 in der Anzeige
    for (let i = 0; i < 25; i++) {
        const slot = document.createElement('div');
        slot.classList.add('grid-slot');
        
        const cellData = gameData[gridKey][i];
        // FIX: Wir prüfen auf cellData.itemId, falls 'root' mal fehlt
        if (cellData && cellData.itemId) {
            // Wir rendern in der Vorschau nur das Icon am Ankerpunkt
            if (cellData.root || i === 0) { 
                const item = getItemById(cellData.itemId);
                if (item) {
                    const itemEl = document.createElement('div');
                    itemEl.classList.add('item', item.rarity);
                    itemEl.innerText = item.icon;
                    // Mini-Skalierung für Vorschau
                    itemEl.style.fontSize = "1rem";
                    slot.appendChild(itemEl);
                }
            }
        }
        container.appendChild(slot);
    }
}

// ==========================================
// WORKSHOP & OVERLAY (KLICK-FIX)
// ==========================================

function openWorkshop(type) {
    currentWorkshop = type;
    const overlay = document.getElementById('workshop-overlay');
    if (overlay) {
        overlay.classList.remove('hidden');
        const title = document.getElementById('workshop-title');
        if (title) title.innerText = type.toUpperCase() + (type === 'storage' ? " STORAGE" : " WORKSHOP");
    }
    
    // Ruft die Funktion aus der Gridrenderer.js / Workshopengine.js auf
    if (typeof renderWorkshopGrids === 'function') {
        renderWorkshopGrids();
    } else {
        console.error("renderWorkshopGrids nicht gefunden! Prüfe index.html Ladereihenfolge.");
    }
}

function closeWorkshop() {
    currentWorkshop = null;
    const overlay = document.getElementById('workshop-overlay');
    if (overlay) overlay.classList.add('hidden');
    
    if (typeof saveGame === 'function') saveGame();
    renderEquipmentHub();
}

// ==========================================
// GAME ENGINE & SHOP
// ==========================================

function buyItem(itemId) {
    const item = getItemById(itemId);
    if (!item || gameData.gold < item.price) return;

    // Freien Slot in der Bank suchen
    for (let i = 0; i < BANK_SLOTS; i++) {
        if (!gameData.bank[i]) {
            gameData.gold -= item.price;
            // Nutzt die Gridengine.js
            if (typeof placeItemIntoGrid === 'function') {
                placeItemIntoGrid(gameData.bank, i, item, item.body, 6);
            }
            if (typeof renderWorkshopGrids === 'function') renderWorkshopGrids();
            updateUI();
            return;
        }
    }
}

function handleWorkClick() {
    gameData.focusUntil = Date.now() + FOCUS_DURATION;
    updateUI();
}

function updateLogic() {
    const now = Date.now();
    const dt = (now - gameData.lastUpdate) / 1000;
    gameData.lastUpdate = now;

    if (gameData.hp < gameData.maxHp) {
        gameData.hp = Math.min(gameData.maxHp, gameData.hp + gameData.hpRegen * dt);
    }

    const focusMultiplier = (now < gameData.focusUntil) ? 1.3 : 1.0;
    gameData.workProgress += 50 * focusMultiplier * dt;

    if (gameData.workProgress >= 1000) {
        gameData.workProgress = 0;
        gameData.gold += 10;
        gameData.xp += 50;
        // Monster-Dmg Logik
        if (gameData.currentMonster) {
            gameData.currentMonster.hp -= 5;
            if (gameData.currentMonster.hp <= 0) {
                gameData.gold += 15;
                spawnMonster(0);
            }
        }
        // checkLevelUp() Check
        if (gameData.xp >= gameData.xpNextLevel) {
            gameData.xp -= gameData.xpNextLevel;
            gameData.level++;
            gameData.xpNextLevel = Math.floor(500 * Math.pow(1.4, gameData.level - 1));
        }
    }
}

function updateUI() {
    const setT = (id, val) => { const el = document.getElementById(id); if (el) el.innerText = val; };
    const setW = (id, val) => { const el = document.getElementById(id); if (el) el.style.width = val + "%"; };

    setT('gold-display', Math.floor(gameData.gold).toLocaleString());
    setT('level-display', gameData.level);
    setW('work-fill', (gameData.workProgress / 1000) * 100);
    setW('hp-fill-header', (gameData.hp / gameData.maxHp) * 100);
    setW('xp-fill-header', (gameData.xp / gameData.xpNextLevel) * 100);
    if (gameData.currentMonster) setW('monster-hp-fill', (gameData.currentMonster.hp / gameData.currentMonster.maxHp) * 100);
}

// ==========================================
// INITIALISIERUNG
// ==========================================

setInterval(() => { updateLogic(); updateUI(); }, 50);

window.onload = () => {
    // 1. Laden (aus Saveengine.js)
    if (typeof loadGame === 'function') loadGame();
    
    // 2. Initiales UI Rendering
    spawnMonster(0);
    renderShop();
    
    // 3. Global Drag Listeners (aus Dragengine.js)
    if (typeof initGlobalDragListeners === 'function') initGlobalDragListeners();

    // 4. Start-Tab setzen
    switchTab('grind');
};