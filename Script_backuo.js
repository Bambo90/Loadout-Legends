// ==========================================
// 1. INITIALISIERUNG
// ==========================================

localStorage.removeItem("LoadoutLegendsSave");

let gameData = {
    gold: 50, level: 1, xp: 0, xpNextLevel: 500,
    hp: 100, maxHp: 100, hpRegen: 1,
    workProgress: 0, pendingGold: 0, focusUntil: 0,
    lastUpdate: Date.now(),
    bank: {}, farmGrid: {}, pveGrid: {}, pvpGrid: {},
    totalGold: 0, totalXP: 0, currentMonster: null
};

const ALL_ITEMS = [...TOOL_ITEMS, ...JEWELRY_ITEMS, ...WEAPON_ITEMS];
const BANK_SLOTS = 30;
const GRID_SIZE = 5;
const WORK_GOAL = 1000;
const GOLD_PER_BAR = 10;
const XP_PER_BAR = 50;
const FOCUS_DURATION = 60 * 60 * 1000;

function getItemById(id) {
    return ALL_ITEMS.find(i => i.id === id);
}

function clearItemFromGrid(grid, itemId) {
    Object.keys(grid).forEach(k => {
        if (grid[k]?.itemId === itemId) {
            delete grid[k];
        }
    });
}

function placeItemInGrid(grid, item, originIndex, cols, shape) {
    const originX = originIndex % cols;
    const originY = Math.floor(originIndex / cols);

    shape.forEach((row, r) => {
        row.forEach((cell, c) => {
            if (!cell) return;

            const idx = (originY + r) * cols + (originX + c);

            grid[idx] = {
                itemId: item.id,
                root: (r === 0 && c === 0)
            };
        });
    });
}

let draggedItem = null;
let currentWorkshop = null;
let lastMonsterAttack = Date.now();

// Baut aus "Startslot → Item" eine echte Slot-Belegungsmap
function buildOccupancyMap(gridKey, cols) {
    const map = {};
    const grid = gameData[gridKey];

    for (let index in grid) {
        const item = grid[index];
        if (!item) continue;

        const baseShape = item.body || item.shape;
        const startIndex = parseInt(index);
        const startX = startIndex % cols;
        const startY = Math.floor(startIndex / cols);

        baseShape.forEach((row, r) => {
            row.forEach((cell, c) => {
                if (cell !== 1) return;

                const x = startX + c;
                const y = startY + r;
                const slotIndex = y * cols + x;

                map[slotIndex] = {
                    item,
                    originIndex: startIndex
                };
            });
        });
    }

    return map;
}

function clearItemFromGrid(grid, itemId) {
    Object.keys(grid).forEach(k => {
        if (grid[k]?.itemId === itemId) {
            delete grid[k];
        }
    });
}

function canPlaceItem(grid, originIndex, cols, shape) {
    const originX = originIndex % cols;
    const originY = Math.floor(originIndex / cols);

    for (let y = 0; y < shape.length; y++) {
        for (let x = 0; x < shape[0].length; x++) {
            if (!shape[y][x]) continue;

            const idx = (originY + y) * cols + (originX + x);
            if (grid[idx]) return false;
        }
    }
    return true;
}

// ==========================================
// 2. LOAD & SAVE
// ==========================================
function loadGame() {
    const saved = localStorage.getItem("LoadoutLegendsSave");
    if (saved) {
        try {
            const loaded = JSON.parse(saved);
            gameData = { ...gameData, ...loaded };
            if (!gameData.bank) gameData.bank = {};
            if (!gameData.farmGrid) gameData.farmGrid = {};
            if (!gameData.pveGrid) gameData.pveGrid = {};
            if (!gameData.pvpGrid) gameData.pvpGrid = {};
        } catch (e) { console.error("Savegame Error:", e); }
    }
    spawnMonster(0);
    renderShop();
    initTooltipListeners();
    initGlobalDragListeners();
    updateUI();
}

function saveGame() {
    localStorage.setItem("LoadoutLegendsSave", JSON.stringify(gameData));
}

function spawnMonster(index) {
    if (typeof MONSTERS !== 'undefined' && MONSTERS[index]) {
        gameData.currentMonster = { ...MONSTERS[index], hp: MONSTERS[index].maxHp };
    }
}

// ==========================================
// 3. NAVIGATION
// ==========================================
function switchTab(tabId) {
    hideTooltip();
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
        setTimeout(() => { if (!tab.classList.contains('active')) tab.style.display = 'none'; }, 300);
    });
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));

    const target = document.getElementById('tab-' + tabId);
    if (target) {
        target.style.display = 'block';
        setTimeout(() => { target.classList.add('active'); }, 50);
    }

    const navBtns = document.querySelectorAll('.nav-btn');
    for (let btn of navBtns) {
        if (btn.innerText.toLowerCase().includes(tabId === 'equipment' ? 'ausrüstung' : tabId)) {
            btn.classList.add('active');
        }
    }
    if (tabId === 'equipment') renderEquipmentHub();
}

// ==========================================
// 4. WORKSHOP & GRIDS
// ==========================================
{
    function renderEquipmentHub() {
        renderPreviewGrid('preview-farm', 'farmGrid');
        renderPreviewGrid('preview-pve', 'pveGrid');
        renderPreviewGrid('preview-bank-small', 'bank');
    }

    function renderPreviewGrid(containerId, gridKey) {
        const container = document.getElementById(containerId);
        if (!container) return;
        container.innerHTML = '';

        for (let i = 0; i < 25; i++) {
            const slot = document.createElement('div');
            slot.classList.add('grid-slot');
            let item = (gridKey === 'bank') ? gameData.bank[i] : gameData[gridKey][i];

            if (item) {
                const itemEl = document.createElement('div');
                itemEl.classList.add('item', item.rarity);
                itemEl.innerText = item.icon;
                slot.appendChild(itemEl);
            }
            container.appendChild(slot);
        }
    }

    function openWorkshop(type) {
        hideTooltip();
        currentWorkshop = type;
        const overlay = document.getElementById('workshop-overlay');
        const content = document.querySelector('.workshop-content');
        const bankHeader = document.getElementById('bank-header');
        const gridNameHeader = document.getElementById('grid-name');

        overlay.classList.remove('hidden');

        if (type === 'storage') {
            document.getElementById('workshop-title').innerText = "📦 STORAGE";
            if (bankHeader) bankHeader.style.display = 'none';
            if (gridNameHeader) gridNameHeader.style.display = 'none';
            content.classList.add('storage-mode');
        } else {
            document.getElementById('workshop-title').innerText = type.toUpperCase() + " WORKSHOP";
            if (gridNameHeader) {
                gridNameHeader.style.display = 'block';
                gridNameHeader.innerText = "ACTIVE " + type.toUpperCase() + " GRID";
            }
            if (bankHeader) {
                bankHeader.style.display = 'block';
                bankHeader.innerText = "Storage";
            }
            content.classList.remove('storage-mode');
        }

        renderWorkshopGrids();
        initSellZone();
    }

    function closeWorkshop() {
        hideTooltip();
        currentWorkshop = null;
        document.getElementById('workshop-overlay').classList.add('hidden');
        document.querySelector('.workshop-content').classList.remove('storage-mode');
        saveGame();
        updateUI();
        renderEquipmentHub();
    }

    function renderWorkshopGrids() {
        const bankCont = document.getElementById('bank-grid');
        const activeCont = document.getElementById('active-setup-grid');
        if (!bankCont) return;

        bankCont.innerHTML = '';
        const slotsBank = (currentWorkshop === 'storage') ? 60 : BANK_SLOTS;
        const colsBank = (currentWorkshop === 'storage') ? 10 : 6;

        for (let i = 0; i < slotsBank; i++) createSlot(bankCont, 'bank', i, colsBank);

        if (currentWorkshop !== 'storage' && activeCont) {
            activeCont.innerHTML = '';
            for (let i = 0; i < GRID_SIZE * GRID_SIZE; i++) {
                createSlot(activeCont, currentWorkshop + "Grid", i, GRID_SIZE);
            }
        }
    }
// ================= STORAGE GRID ENGINE =================

    function isPlacementValid(shape, originX, originY, gridCols, location) {
        if (!shape) return true;

        const shapeRows = shape.length;
        const shapeCols = shape[0].length;

        let maxRows = 5;
        if (location === 'bank' && currentWorkshop === 'storage') maxRows = 6;

        if (originX < 0 || originY < 0) return false;
        if (originX + shapeCols > gridCols) return false;
        if (originY + shapeRows > maxRows) return false;

        return true;
    }
}

// ==========================================
// 5. ENGINE & UTILS
// ==========================================
function rotateMatrixCW(matrix) {
    const h = matrix.length;
    const w = matrix[0].length;
    const res = Array.from({ length: w }, () => Array(h).fill(0));
    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            res[x][h - 1 - y] = matrix[y][x];
        }
    }
    return res;
}

function updateLogic() {
    const now = Date.now();
    const deltaTime = (now - gameData.lastUpdate) / 1000;
    gameData.lastUpdate = now;

    if (gameData.currentMonster && gameData.currentMonster.hp > 0) {
        if (now - lastMonsterAttack > gameData.currentMonster.attackSpeed) {
            gameData.hp -= gameData.currentMonster.damage;
            lastMonsterAttack = now;
            if (gameData.hp <= 0) {
                gameData.hp = 0; 
                gameData.gold = Math.floor(gameData.gold * 0.9);
                gameData.hp = gameData.maxHp; 
                saveGame();
                alert("Besiegt! Du verlierst 10% Gold.");
            }
        }
    }
    if (gameData.hp < gameData.maxHp) gameData.hp = Math.min(gameData.maxHp, gameData.hp + gameData.hpRegen * deltaTime);

    let speedMod = 1.0; let xpMod = 1.0;
    for (let slot in gameData.farmGrid) {
        const item = gameData.farmGrid[slot];
        if (item.speedBonus) speedMod *= item.speedBonus;
        if (item.xpBonus) xpMod *= item.xpBonus;
    }

    const speed = 50 * speedMod * (now < gameData.focusUntil ? 1.3 : 1.0);
    gameData.workProgress += speed * deltaTime;
    gameData.pendingGold = (gameData.workProgress / WORK_GOAL) * GOLD_PER_BAR;

    if (gameData.workProgress >= WORK_GOAL) {
        gameData.workProgress %= WORK_GOAL;
        gameData.gold += GOLD_PER_BAR;
        gameData.totalGold += GOLD_PER_BAR;
        gameData.xp += XP_PER_BAR * xpMod;
        gameData.totalXP += XP_PER_BAR * xpMod;
        dealDamageToMonster();
        checkLevelUp();
    }
}

function dealDamageToMonster() {
    if (!gameData.currentMonster || gameData.currentMonster.hp <= 0) return;
    let dmg = 5;
    for (let slot in gameData.pveGrid) { if (gameData.pveGrid[slot].damage) dmg += gameData.pveGrid[slot].damage; }
    gameData.currentMonster.hp -= dmg;
    if (gameData.currentMonster.hp <= 0) { gameData.gold += 15; spawnMonster(0); }
}

function updateUI() {
    const now = Date.now();
    const setTxt = (id, val) => { const el = document.getElementById(id); if(el) el.innerText = val; };
    const setW = (id, val) => { const el = document.getElementById(id); if(el) el.style.width = val + "%"; };

    setTxt('gold-display', Math.floor(gameData.gold).toLocaleString());
    setTxt('level-display', gameData.level);
    setW('hp-fill-header', (gameData.hp / gameData.maxHp * 100));
    setTxt('hp-text-header', `HP: ${Math.ceil(gameData.hp)} / ${gameData.maxHp}`);
    setW('xp-fill-header', (gameData.xp / gameData.xpNextLevel * 100));
    setTxt('xp-text-header', `XP: ${Math.floor(gameData.xp)} / ${gameData.xpNextLevel}`);
    
    if (gameData.currentMonster) {
        setW('monster-hp-fill', (gameData.currentMonster.hp / gameData.currentMonster.maxHp * 100));
        setTxt('monster-hp-text', `HP: ${Math.ceil(gameData.currentMonster.hp)} / ${gameData.currentMonster.maxHp}`);
    }

    setW('work-fill', (gameData.workProgress / WORK_GOAL * 100));
    setTxt('work-text', `+${gameData.pendingGold.toFixed(1)} Gold`);

    const btn = document.getElementById('action-button');
    if (btn) {
        if (now < gameData.focusUntil) {
            btn.innerText = `Fokussiert (${Math.ceil((gameData.focusUntil - now) / 60000)}m)`;
            btn.style.backgroundColor = "#2196F3";
        } else {
            btn.innerText = "Fokus auffrischen";
            btn.style.backgroundColor = "#4CAF50";
        }
    }
    
    const gpsStat = document.getElementById('stat-gps');
    if(gpsStat) {
        let sm = 1.0;
        for (let s in gameData.farmGrid) { if (gameData.farmGrid[s].speedBonus) sm *= gameData.farmGrid[s].speedBonus; }
        gpsStat.innerText = (( (50 * sm * (now < gameData.focusUntil ? 1.3 : 1.0)) / WORK_GOAL ) * GOLD_PER_BAR).toFixed(2);
    }
    const tgStat = document.getElementById('stat-total-gold');
    if(tgStat) tgStat.innerText = Math.floor(gameData.totalGold).toLocaleString();
    const txStat = document.getElementById('stat-total-xp');
    if(txStat) txStat.innerText = Math.floor(gameData.totalXP).toLocaleString();
}

function renderShop() {
    const sc = document.getElementById('shop-container'); if (!sc) return; sc.innerHTML = '';
    ALL_ITEMS.forEach(item => {
        if (item.inShop === false) return; 

        const card = document.createElement('div'); card.classList.add('shop-item-card', item.rarity);
        card.innerHTML = `<span class="shop-item-icon">${item.icon}</span><h4>${item.name}</h4><button class="buy-btn" onclick="buyItem('${item.id}')">${item.price} G</button>`;
        sc.appendChild(card);
    });
}
function buyItem(itemId) {
    const item = getItemById(itemId);
    if (!item || gameData.gold < item.price) return;

    const grid = gameData.bank;
    const cols = 6; // Bank cols

    for (let i = 0; i < BANK_SLOTS; i++) {
        if (!grid[i]) {
            gameData.gold -= item.price;

            placeItemInGrid(
                grid,
                item,
                i,
                cols,
                item.body
            );

            renderWorkshopGrids();
            updateUI();
            return;
        }
    }
}


function showItemTooltip(item) {
    let bonus = item.speedBonus ? `+${Math.round((item.speedBonus-1)*100)}% Tempo` : (item.xpBonus ? `+${Math.round((item.xpBonus-1)*100)}% XP` : (item.damage ? `Schaden: ${item.damage}` : ""));
    showTooltip(`<div class="tooltip-title ${item.rarity}">${item.name}</div><div class="tooltip-mod">${bonus}</div>`);
}
function initTooltipListeners() {
    const tt = document.getElementById('tooltip');
    document.addEventListener('mousemove', (e) => { if (tt && !tt.classList.contains('hidden')) { tt.style.left = (e.clientX + 15) + 'px'; tt.style.top = (e.clientY + 15) + 'px'; } });
}
function showTooltip(c) { const tt = document.getElementById('tooltip'); if(tt) { tt.innerHTML = c; tt.classList.remove('hidden'); } }
function hideTooltip() { const tt = document.getElementById('tooltip'); if(tt) tt.classList.add('hidden'); }
function checkLevelUp() { while (gameData.xp >= gameData.xpNextLevel) { gameData.xp -= gameData.xpNextLevel; gameData.level++; gameData.xpNextLevel = Math.floor(500 * Math.pow(1.4, gameData.level - 1)); } }
function handleWorkClick() { gameData.focusUntil = Date.now() + FOCUS_DURATION; updateUI(); }

function initSellZone() {
    const sz = document.getElementById('sell-zone');
    if(!sz) return;
    sz.classList.remove('hidden'); 
    
    const newSz = sz.cloneNode(true);
    sz.parentNode.replaceChild(newSz, sz);
    
    newSz.addEventListener('dragover', e => { e.preventDefault(); newSz.classList.add('drag-over'); });
    newSz.addEventListener('dragleave', () => newSz.classList.remove('drag-over'));
    newSz.addEventListener('drop', e => {
        e.preventDefault(); 
        newSz.classList.remove('drag-over');
        if (draggedItem) {
            gameData.gold += Math.floor(draggedItem.item.price * 0.5);
            delete gameData[draggedItem.fromLocation][draggedItem.fromIndex];
            draggedItem = null; 
            renderWorkshopGrids(); 
            updateUI();
        }
    });
}

setInterval(() => { updateLogic(); updateUI(); }, 30);
setInterval(saveGame, 10000);
window.onload = loadGame;