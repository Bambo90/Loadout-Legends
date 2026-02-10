// ==========================================
// LOADOUT LEGENDS – CORE INIT SCRIPT (V3)
// Zentraler Hub - Hält alle Engines zusammen
// ==========================================

let gameData = {
    gold: 500,
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
    currentMonster: null,
    currentMonsterIndex: 0,
    monsterDefeats: {}
};

const BANK_SLOTS = 30;
const GRID_SIZE = 5;
const GRID_ROWS = 5;
const FOCUS_DURATION = 60 * 60 * 1000;

let currentWorkshop = null;
let lastMonsterAttack = Date.now();
let tooltip = null;

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
        overlay.style.display = 'flex';
        const title = document.getElementById('workshop-title');
        if (title) title.innerText = type.toUpperCase() + (type === 'storage' ? " STORAGE" : " WORKSHOP");
    }
    
    // Ruft die Funktion aus der Workshopengine.js auf
    setTimeout(() => {
        if (typeof renderWorkshopGrids === 'function') {
            try { queueRenderWorkshopGrids(); } catch (err) { renderWorkshopGrids(); }
        } else {
            console.error("renderWorkshopGrids nicht gefunden! Prüfe index.html Ladereihenfolge.");
        }
    }, 10);
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
            // Nutzt die Gridengine.js (pass a copy of item.body)
            if (typeof placeItemIntoGrid === 'function') {
                const bodyCopy = (item.body || [[1]]).map(r => [...r]);
                placeItemIntoGrid(gameData.bank, i, item, bodyCopy, 6);
            }
            if (typeof renderWorkshopGrids === 'function') { try { queueRenderWorkshopGrids(); } catch (err) { renderWorkshopGrids(); } }
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
    const speedBonus = calculateEquipmentBonus('farmGrid', 'speed');
    const baseWorkRate = 50 * focusMultiplier * speedBonus;
    
    gameData.workProgress += baseWorkRate * dt;

    if (gameData.workProgress >= 1000) {
        gameData.workProgress = 0;
        
        // Base rewards
        const goldReward = 10;
        const xpReward = 50;
        const xpBonus = calculateEquipmentBonus('farmGrid', 'xp');
        
        gameData.gold += goldReward;
        gameData.totalGold += goldReward;
        gameData.xp += xpReward * xpBonus;
        gameData.totalXP += xpReward * xpBonus;
        
        // Monster damage
        if (gameData.currentMonster) {
            const damage = calculatePlayerDamage();
            gameData.currentMonster.hp -= damage;
            
            if (gameData.currentMonster.hp <= 0) {
                // Monster defeated
                const goldBonus = Math.floor(Math.random() * (gameData.currentMonster.goldMax - gameData.currentMonster.goldMin + 1)) + gameData.currentMonster.goldMin;
                gameData.gold += goldBonus;
                gameData.totalGold += goldBonus;
                gameData.xp += gameData.currentMonster.xp * xpBonus;
                gameData.totalXP += gameData.currentMonster.xp * xpBonus;
                gameData.monsterDefeats[gameData.currentMonster.id]++;
                
                // Roll for item drop
                if (gameData.currentMonster.dropTable && gameData.currentMonster.dropTable.length > 0) {
                    const dropChance = 0.15; // 15% chance per drop item
                    gameData.currentMonster.dropTable.forEach(itemId => {
                        if (Math.random() < dropChance) {
                            addItemToBank(itemId);
                        }
                    });
                }
                
                spawnMonster(gameData.currentMonsterIndex);
            }
        }
        
        // Level up check
        if (gameData.xp >= gameData.xpNextLevel) {
            gameData.xp -= gameData.xpNextLevel;
            gameData.level++;
            gameData.maxHp = 100 + (gameData.level * 10);
            gameData.hp = gameData.maxHp;
            gameData.xpNextLevel = Math.floor(500 * Math.pow(1.4, gameData.level - 1));
        }
    }
}

function updateUI() {
    const setT = (id, val) => { const el = document.getElementById(id); if (el) el.innerText = val; };
    const setW = (id, val) => { const el = document.getElementById(id); if (el) el.style.width = val + "%"; };

    setT('gold-display', Math.floor(gameData.gold).toLocaleString());
    setT('level-display', gameData.level);
    setT('stat-gps', (gameData.workProgress / 1000 * 50).toFixed(1));
    setT('stat-total-gold', Math.floor(gameData.totalGold).toLocaleString());
    setT('stat-total-xp', Math.floor(gameData.totalXP).toLocaleString());
    setW('work-fill', (gameData.workProgress / 1000) * 100);
    setW('hp-fill-header', (gameData.hp / gameData.maxHp) * 100);
    setW('xp-fill-header', (gameData.xp / gameData.xpNextLevel) * 100);
    
    // Update bonus display
    const speedBonus = calculateEquipmentBonus('farmGrid', 'speed');
    const xpBonus = calculateEquipmentBonus('farmGrid', 'xp');
    const combinedBonus = speedBonus * xpBonus;
    setT('bonus-display', combinedBonus.toFixed(2) + 'x');
    
    if (gameData.currentMonster) {
        setW('monster-hp-fill', (gameData.currentMonster.hp / gameData.currentMonster.maxHp) * 100);
        setT('monster-hp-text', `HP: ${Math.ceil(gameData.currentMonster.hp)} / ${gameData.currentMonster.maxHp}`);
    }
}

// ==========================================
// MONSTER & SPAWNING SYSTEM
// ==========================================

function getUnlockedMonsters() {
    return MONSTERS.filter(m => gameData.level >= m.level);
}

function getNextMonsterIndex() {
    const unlocked = getUnlockedMonsters();
    if (unlocked.length === 0) return 0;
    return MONSTERS.indexOf(unlocked[unlocked.length - 1]);
}

function spawnMonster(monsterIndex) {
    if (monsterIndex < 0 || monsterIndex >= MONSTERS.length) {
        monsterIndex = getNextMonsterIndex();
    }
    
    const template = MONSTERS[monsterIndex];
    gameData.currentMonsterIndex = monsterIndex;
    gameData.currentMonster = {
        id: template.id,
        name: template.name,
        hp: template.hp,
        maxHp: template.hp,
        damage: template.damage,
        attackSpeed: template.attackSpeed,
        goldMin: template.goldMin,
        goldMax: template.goldMax,
        xp: template.xp,
        icon: template.icon,
        level: template.level,
        dropTable: template.dropTable || []
    };
    
    const card = document.getElementById('monster-card');
    if (card) {
        document.getElementById('monster-icon').innerText = template.icon;
        document.getElementById('monster-name').innerText = template.name;
    }
    
    gameData.monsterDefeats[template.id] = (gameData.monsterDefeats[template.id] || 0);
}

function changeMonster(direction) {
    let newIndex = gameData.currentMonsterIndex + direction;
    const unlocked = getUnlockedMonsters();
    
    // Clamp to unlocked range
    const minIndex = MONSTERS.indexOf(unlocked[0]);
    const maxIndex = MONSTERS.indexOf(unlocked[unlocked.length - 1]);
    
    newIndex = Math.max(minIndex, Math.min(maxIndex, newIndex));
    
    if (newIndex >= 0 && newIndex < MONSTERS.length) {
        spawnMonster(newIndex);
    }
}

// ==========================================
// INVENTORY MANAGEMENT
// ==========================================

function addItemToBank(itemId) {
    const item = getItemById(itemId);
    if (!item) return false;
    
    // Find first empty slot
    for (let i = 0; i < BANK_SLOTS; i++) {
        if (!gameData.bank[i]) {
            if (typeof placeItemIntoGrid === 'function') {
                const bodyCopy = (item.body || [[1]]).map(r => [...r]);
                placeItemIntoGrid(gameData.bank, i, item, bodyCopy, 6);
                return true;
            }
        }
    }
    
    return false; // Bank full
}

function renderShop() {
    const container = document.getElementById('shop-container');
    if (!container) return;
    
    container.innerHTML = '';
    const shopItems = getShopItems();
    
    shopItems.forEach(item => {
        const card = document.createElement('div');
        card.classList.add('shop-item-card', item.rarity);
        
        const canBuy = gameData.gold >= item.price && (!item.req || gameData.level >= item.req);
        if (!canBuy) card.style.opacity = '0.6';
        
        const statText = [];
        if (item.damage) statText.push(`+${item.damage} DMG`);
        if (item.speedBonus) statText.push(`+${Math.floor((item.speedBonus - 1) * 100)}% Speed`);
        if (item.xpBonus) statText.push(`+${Math.floor((item.xpBonus - 1) * 100)}% XP`);
        
        card.innerHTML = `
            <div class="shop-item-icon">${item.icon}</div>
            <h4 style="margin: 10px 0;">${item.name}</h4>
            <p style="font-size: 0.8rem; color: #aaa; margin: 5px 0;">${item.desc || ''}</p>
            ${statText.length > 0 ? `<p style="font-size: 0.75rem; color: var(--accent-gold); margin: 5px 0;">${statText.join(' | ')}</p>` : ''}
            <p style="font-size: 0.8rem; color: #888; margin: 5px 0;">Lvl ${item.req || 1}</p>
            <p style="font-weight: bold; color: var(--accent-gold); margin: 10px 0;">${item.price} Gold</p>
            <button class="buy-btn" onclick="buyItem('${item.id}')" ${canBuy ? '' : 'disabled'}>
                ${canBuy ? 'Kaufen' : 'Zu teuer / Level'}
            </button>
        `;
        
        card.addEventListener('mouseenter', (e) => showTooltip(e, item));
        card.addEventListener('mouseleave', hideTooltip);
        
        container.appendChild(card);
    });
}

// ==========================================
// WORKSHOP & GRID RENDERING
// ==========================================

/**
 * Renders visual preview of dragged item on a specific grid container.
 * Only body cells (previewShape) are validated for placement; aura may extend.
 */
function renderDragPreviewForGrid(container, location, cols, totalSlots) {
    if (!draggedItem) return;

    // Determine whether the mouse is over THIS container. Prefer explicit hoverTarget
    // when it points into this location; otherwise use last known mouse position
    // and only snap if that position is inside the container rect.
    let hoverIndex = null;
    const rect = container.getBoundingClientRect();
    const lastPos = window._dragLastPos || null;

    if (draggedItem.hoverTarget && draggedItem.hoverTarget.location === location) {
        hoverIndex = draggedItem.hoverTarget.index;
    } else if (lastPos && lastPos.x >= rect.left && lastPos.x <= rect.right && lastPos.y >= rect.top && lastPos.y <= rect.bottom) {
        const cellW = 64 + 8;
        const cellH = 64 + 8;
        const relX = lastPos.x - rect.left;
        const relY = lastPos.y - rect.top;
        const col = Math.floor(relX / cellW);
        const row = Math.floor(relY / cellH);
        const clampedCol = Math.max(0, Math.min(cols - 1, col));
        const maxRows = Math.ceil(totalSlots / cols);
        const clampedRow = Math.max(0, Math.min(maxRows - 1, row));
        hoverIndex = clampedRow * cols + clampedCol;
        console.log('preview snap fallback ->', location, 'col', clampedCol, 'row', clampedRow, 'index', hoverIndex);
    } else {
        // Mouse not over this container and no matching hoverTarget — don't render previews here
        return;
    }

    const hoverX = hoverIndex % cols;
    const hoverY = Math.floor(hoverIndex / cols);
    const originX = hoverX - draggedItem.offsetX;
    const originY = hoverY - draggedItem.offsetY;
    const originIndex = originY * cols + originX;

    const shape = draggedItem.previewShape || [[1]];
    // For each cell in shape, compute target slot and append preview element
    for (let r = 0; r < shape.length; r++) {
        for (let c = 0; c < shape[0].length; c++) {
            if (!shape[r][c]) continue;
            const tx = originX + c;
            const ty = originY + r;
            const tidx = ty * cols + tx;

            const slotEl = container.querySelector(`.grid-slot[data-index="${tidx}"]`);
            const valid = (tx >= 0 && tx < cols && ty >= 0 && tidx >= 0 && tidx < totalSlots && canPlaceItem(gameData[location], originIndex, shape, cols, Math.ceil(totalSlots/cols)));

            if (slotEl) {
                const prev = document.createElement('div');
                prev.classList.add('preview-block');
                if (!valid) prev.classList.add('invalid');
                // color by rarity if available
                const rarity = draggedItem.item?.rarity || 'common';
                prev.classList.add(`preview-${rarity}`);
                slotEl.appendChild(prev);
            }
        }
    }
}

function renderWorkshopGrids() {
    if (!currentWorkshop) return;
    
    const overlay = document.getElementById('workshop-overlay');
    if (!overlay) {
        console.error("Workshop overlay nicht gefunden!");
        return;
    }
    
    const bankGrid = document.getElementById('bank-grid');
    const activeGrid = document.getElementById('active-setup-grid');
    
    if (!bankGrid || !activeGrid) {
        console.error("Bank oder Active Grid nicht gefunden!");
        return;
    }
    
    // Stelle sicher, dass Grids existieren
    if (!gameData.bank) gameData.bank = {};
    if (!gameData.farmGrid) gameData.farmGrid = {};
    if (!gameData.pveGrid) gameData.pveGrid = {};
    
    console.log("Rendering workshop grids for:", currentWorkshop);
    
    // Bank Grid
    bankGrid.innerHTML = '';
    for (let i = 0; i < BANK_SLOTS; i++) {
        createSlot(bankGrid, 'bank', i, 6);
    }
    // Render drag preview for bank
    renderDragPreviewForGrid(bankGrid, 'bank', 6, BANK_SLOTS);
    
    // Active Grid (Farm or PvE)
    activeGrid.innerHTML = '';
    const gridType = currentWorkshop === 'farm' ? 'farmGrid' : 
                    currentWorkshop === 'pve' ? 'pveGrid' : 'farmGrid';
    
    const totalSlots = GRID_SIZE * GRID_ROWS;
    for (let i = 0; i < totalSlots; i++) {
        createSlot(activeGrid, gridType, i, GRID_SIZE);
    }
    // Render drag preview for active grid
    renderDragPreviewForGrid(activeGrid, gridType, GRID_SIZE, totalSlots);
    
    // Sell zone handlers
    const sellZone = document.getElementById('sell-zone');
    if (sellZone) {
        sellZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            sellZone.classList.add('drag-over');
        });
        
        sellZone.addEventListener('dragleave', () => {
            sellZone.classList.remove('drag-over');
        });
        
        sellZone.addEventListener('drop', (e) => {
            e.preventDefault();
            sellZone.classList.remove('drag-over');
            if (draggedItem) {
                console.log('💰 SELL ATTEMPT', { itemId: draggedItem.item.id, instanceId: draggedItem.instanceId, fromLocation: draggedItem.fromLocation, item: draggedItem.item });
                const item = draggedItem.item;
                const sellPrice = Math.floor(item.price * 0.5);
                console.log('  Price:', item.price, '→ Sell for:', sellPrice);
                gameData.gold += sellPrice;
                console.log('  Gold now:', gameData.gold);
                console.log('  Clearing from grid:', gameData[draggedItem.fromLocation]);
                clearItemFromGrid(gameData[draggedItem.fromLocation], draggedItem.instanceId);
                draggedItem = null;
                    try { queueRenderWorkshopGrids(); } catch (err) { renderWorkshopGrids(); }
                updateUI();
                saveGame();
                console.log('  ✅ SELL COMPLETE');
            } else {
                console.log('⚠️ SELL DROP but no draggedItem!');
            }
        });
    }
}

// Queueing render to avoid re-render storms during drag operations
let _renderQueued = false;
function queueRenderWorkshopGrids() {
    if (_renderQueued) return;
    _renderQueued = true;
    requestAnimationFrame(() => {
        _renderQueued = false;
        try { renderWorkshopGrids(); } catch (err) { console.error('renderWorkshop error', err); }
    });
}

// ==========================================
// TOOLTIP SYSTEM
// ==========================================

function showTooltip(e, item) {
    const tooltipEl = document.getElementById('tooltip');
    if (!tooltipEl) return;
    
    let content = `<strong>${item.name}</strong>`;
    content += `<br>Rarity: ${item.rarity}`;
    content += `<br>Price: ${item.price} Gold`;
    
    if (item.damage) content += `<br>Damage: +${item.damage}`;
    if (item.speedBonus) content += `<br>Speed: +${Math.floor((item.speedBonus - 1) * 100)}%`;
    if (item.xpBonus) content += `<br>XP: +${Math.floor((item.xpBonus - 1) * 100)}%`;
    
    content += `<br><br>${item.desc || ''}`;
    
    tooltipEl.innerHTML = content;
    tooltipEl.classList.remove('hidden');
    
    const rect = e.currentTarget.getBoundingClientRect();
    tooltipEl.style.left = (rect.right + 10) + 'px';
    tooltipEl.style.top = rect.top + 'px';
}

function hideTooltip() {
    const tooltipEl = document.getElementById('tooltip');
    if (tooltipEl) tooltipEl.classList.add('hidden');
}

function initTooltipListeners() {
    // Tooltips for items will be added dynamically when rendered
}

// ==========================================
// EQUIPMENT & BONUSES
// ==========================================

function getEquippedItems(gridType) {
    const grid = gameData[gridType];
    const equipped = [];
    
    Object.keys(grid).forEach(key => {
        const cell = grid[key];
        if (cell && cell.root) {
            const item = getItemById(cell.itemId);
            if (item) equipped.push(item);
        }
    });
    
    return equipped;
}

function calculateEquipmentBonus(gridType, bonusType) {
    const equipped = getEquippedItems(gridType);
    let bonus = 1.0;
    
    equipped.forEach(item => {
        if (bonusType === 'damage' && item.damage) {
            bonus += item.damage * 0.1;
        } else if (bonusType === 'speed' && item.speedBonus) {
            bonus *= item.speedBonus;
        } else if (bonusType === 'xp' && item.xpBonus) {
            bonus *= item.xpBonus;
        }
    });
    
    return bonus;
}

function calculatePlayerDamage() {
    const baseDamage = 2 + (gameData.level * 0.5);
    const equipmentBonus = calculateEquipmentBonus('farmGrid', 'damage');
    return baseDamage * equipmentBonus;
}

// ==========================================
// INITIALISIERUNG
// ==========================================

setInterval(() => { updateLogic(); updateUI(); }, 50);

window.onload = () => {
    console.log("Loadout Legends initializing...");
    
    // 1. Laden (aus Saveengine.js)
    if (typeof loadGame === 'function') {
        loadGame();
    } else {
        console.warn("loadGame not found - using default game state");
    }
    
    // 2. Initiales UI Rendering
    spawnMonster(0);
    renderShop();
    renderEquipmentHub();
    
    // 3. Global event listeners
    if (typeof initGlobalDragListeners === 'function') {
        initGlobalDragListeners();
    }
    
    initTooltipListeners();
    
    // 4. Start-Tab setzen
    switchTab('grind');
    
    // 5. Final UI update
    updateUI();
    
    console.log("Loadout Legends ready!");
};