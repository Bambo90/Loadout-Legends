// ==========================================
// LOADOUT LEGENDS – CORE INIT SCRIPT (V3)
// Zentraler Hub - Hält alle Engines zusammen
// ==========================================

let gameData = {
    gold: 500,
    // Legacy mirrors are kept for compatibility; source of truth is character.base.
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
    monsterDefeats: {},
    itemInstances: {},
    character: (typeof createDefaultCharacterState === "function")
        ? createDefaultCharacterState()
        : null
};

const BANK_SLOTS = 200;
const GRID_SIZE = 10;
const GRID_ROWS = 10;
const FOCUS_DURATION = 60 * 60 * 1000;

let currentWorkshop = null;
let lastMonsterAttack = Date.now();
let tooltip = null;
let characterHubActiveSetup = 'farm';

// Resolve static item values via centralized item definitions.
function getItemDefinition(itemId, cell) {
    if (cell && typeof getRuntimeItemDefinition === "function") {
        const runtimeItem = getRuntimeItemDefinition(gameData, itemId, cell);
        if (runtimeItem) return runtimeItem;
    }
    if (typeof getItemDefById === 'function') {
        const def = getItemDefById(itemId);
        if (def) return def;
    }
    if (typeof getItemById === 'function') {
        return getItemById(itemId);
    }
    return null;
}

function getDerivedCharacterStats(gridKey = 'farmGrid') {
    if (typeof ensureCharacterModelOnGameData === 'function') {
        ensureCharacterModelOnGameData(gameData);
    }
    if (typeof getCharacterDerivedStats === 'function') {
        return getCharacterDerivedStats(gameData, {
            gridKey,
            resolver: (itemId, cell) => getItemDefinition(itemId, cell)
        });
    }
    return null;
}

function markCharacterDirty() {
    if (typeof markCharacterStatsDirty === 'function') {
        markCharacterStatsDirty(gameData);
    }
}

function awardCharacterXP(amount, gridKey = 'farmGrid') {
    const xpAmount = Number.isFinite(amount) ? amount : 0;
    if (xpAmount <= 0) return { levelsGained: 0, leveledUp: false };

    if (typeof grantCharacterXP === 'function') {
        return grantCharacterXP(gameData, xpAmount, {
            gridKey,
            resolver: getItemDefinition
        });
    }

    gameData.xp += xpAmount;
    if (gameData.xp >= gameData.xpNextLevel) {
        gameData.xp -= gameData.xpNextLevel;
        gameData.level += 1;
        gameData.maxHp = calculateMaxHp(gameData.level);
        gameData.hp = gameData.maxHp;
        gameData.xpNextLevel = calculateNextLevelXpRequirement(gameData.level);
        return { levelsGained: 1, leveledUp: true };
    }
    return { levelsGained: 0, leveledUp: false };
}

function getWorkshopGridKey(workshopType) {
    if (workshopType === 'pve') return 'pveGrid';
    if (workshopType === 'pvp') return 'pvpGrid';
    return 'farmGrid';
}

function getCharacterHubGridKey() {
    return getWorkshopGridKey(characterHubActiveSetup);
}

function buildCharacterPanelPayload(gridKey) {
    if (!gameData || typeof gameData !== 'object') return null;
    if (typeof ensureCharacterModelOnGameData === 'function') {
        ensureCharacterModelOnGameData(gameData);
    }

    const key = (typeof gridKey === 'string' && gridKey) ? gridKey : 'farmGrid';
    const base = gameData.character && gameData.character.base ? gameData.character.base : null;
    if (!base) return null;

    if (key === 'farmGrid') {
        const derived = (gameData.character && gameData.character.derived) || getDerivedCharacterStats('farmGrid');
        return { gridKey: key, base, derived };
    }

    if (typeof computeCharacterStats === 'function' && typeof collectEquippedItemEntries === 'function') {
        const equippedGrid = gameData[key] && typeof gameData[key] === 'object' ? gameData[key] : {};
        const equippedItemEntries = collectEquippedItemEntries(equippedGrid, (itemId, cell) => getItemDefinition(itemId, cell));
        const derived = computeCharacterStats({
            base,
            equippedItemEntries
        });
        return { gridKey: key, base, derived };
    }

    return { gridKey: key, base, derived: null };
}

function mountCharacterPanels() {
    if (typeof CharacterPanel === 'undefined' || typeof CharacterPanel.mountPanel !== 'function') return;

    CharacterPanel.mountPanel('#workshop-character-panel-host', {
        panelId: 'workshop-character-panel',
        mode: 'compact',
        title: 'Charakter',
        getGridKey: () => getWorkshopGridKey(currentWorkshop),
        getPayload: ({ gridKey }) => buildCharacterPanelPayload(gridKey)
    });

    CharacterPanel.mountPanel('#character-tab-panel-host', {
        panelId: 'character-overview-panel',
        mode: 'full',
        title: 'Charakter Overview',
        getGridKey: () => getCharacterHubGridKey(),
        getPayload: ({ gridKey }) => buildCharacterPanelPayload(gridKey)
    });
}

function refreshCharacterPanels() {
    if (typeof CharacterPanel !== 'undefined' && typeof CharacterPanel.refreshAll === 'function') {
        CharacterPanel.refreshAll();
    }
}

function syncCharacterHubSetupButtons() {
    const buttons = document.querySelectorAll('.character-setup-btn');
    buttons.forEach((btn) => {
        const setup = btn.dataset && btn.dataset.setup ? btn.dataset.setup : '';
        btn.classList.toggle('active', setup === characterHubActiveSetup);
    });
}

function renderCharacterHubGrid() {
    const gridContainer = document.getElementById('character-setup-grid');
    if (!gridContainer) return;
    
    const gridKey = getCharacterHubGridKey();
    
    // Stelle sicher, dass Grids existieren
    if (!gameData[gridKey]) gameData[gridKey] = {};
    
    // Clear und render das Equipment-Grid (kein Storage/Bank)
    gridContainer.innerHTML = '';
    gridContainer.style.overflow = 'hidden';
    
    const totalSlots = GRID_SIZE * GRID_ROWS;
    for (let i = 0; i < totalSlots; i++) {
        createSlot(gridContainer, gridKey, i, GRID_SIZE);
    }
    
    // Render drag preview
    renderDragPreviewForGrid(gridContainer, gridKey, GRID_SIZE, totalSlots);
}

function setCharacterHubSetup(setupType) {
    if (!['farm', 'pve', 'pvp'].includes(setupType)) return;
    
    characterHubActiveSetup = setupType;
    
    // Sync button states
    syncCharacterHubSetupButtons();
    
    // Render grid für neues Setup
    renderCharacterHubGrid();
    
    // Update character panel
    refreshCharacterPanels();
    
    // Dispatch event für externe Systeme
    dispatchCharacterStatsUpdated(getCharacterHubGridKey());
}

function dispatchCharacterStatsUpdated(gridKey) {
    if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function' && typeof CustomEvent === 'function') {
        const payload = buildCharacterPanelPayload(gridKey || getCharacterHubGridKey());
        window.dispatchEvent(new CustomEvent('character:stats-updated', {
            detail: payload || { gridKey: (gridKey || getCharacterHubGridKey()) }
        }));
    }
}

function _formatStatLabel(statPath) {
    if (typeof statPath !== 'string') return '';
    return statPath.replace(/\./g, ' ').toUpperCase();
}

function _formatMutatorValue(entry) {
    const parts = [];
    if (_isFiniteNumber(entry.flat)) {
        const formatted = (entry.flat > 0 ? '+' : '') + entry.flat.toFixed(2);
        parts.push(formatted.replace(/\+?-0\.00/, '0.00'));
    }
    if (_isFiniteNumber(entry.percent)) {
        const percent = entry.percent * 100;
        const sign = percent > 0 ? '+' : '';
        parts.push(`${sign}${percent.toFixed(2)}%`);
    }
    if (parts.length === 0) {
        return '0';
    }
    return parts.join(' / ');
}

function _getMutatorValueClass(entry) {
    const flat = _isFiniteNumber(entry && entry.flat) ? entry.flat : 0;
    const percent = _isFiniteNumber(entry && entry.percent) ? entry.percent : 0;
    const epsilon = 0.000001;

    if (Math.abs(flat) <= epsilon && Math.abs(percent) <= epsilon) {
        return 'stat-zero';
    }

    if ((flat > epsilon && percent >= -epsilon) || (percent > epsilon && flat >= -epsilon)) {
        return 'stat-pos';
    }

    if ((flat < -epsilon && percent <= epsilon) || (percent < -epsilon && flat <= epsilon)) {
        return 'stat-neg';
    }

    return 'stat-zero';
}

function collectActiveItemModifierTotals(workshopType) {
    if (!gameData || typeof gameData !== 'object') return [];
    ensureCharacterModelOnGameData(gameData);
    const base = gameData.character && gameData.character.base ? gameData.character.base : null;
    if (!base) return [];

    const normalizedBase = normalizeCharacterBase(base);
    const attributeModifiers = _buildAttributeModifiers(normalizedBase.baseAttributes);
    const levelModifiers = _buildLevelModifiers(normalizedBase.level);
    const progressionModifiers = [...attributeModifiers, ...levelModifiers];

    const activationPreview = _createRuntimeStatsFromBase(normalizedBase);
    const activationSplit = _splitModifiersByType(progressionModifiers);
    _applyModifierPhases(activationPreview, activationSplit.flatModifiers, activationSplit.percentModifiers);
    activationPreview.weightLimit = Math.max(
        1,
        _num(activationPreview.weightLimit, _calculateWeightLimitFromStrength(normalizedBase.baseAttributes.str))
    );

    const gridKey = getWorkshopGridKey(workshopType);
    const grid = (gridKey && typeof gameData[gridKey] === 'object') ? gameData[gridKey] : {};
    const equippedEntries = collectEquippedItemEntries(grid, (itemId, cell) => getItemDefinition(itemId, cell));
    const weightClass = _classifyWeightActivation(equippedEntries, activationPreview.weightLimit);
    const totals = new Map();

    weightClass.active.forEach((entry) => {
        extractItemModifiers(entry.item).forEach((modifier) => {
            if (!modifier || typeof modifier.statPath !== 'string' || !CHARACTER_MODIFIER_TYPES.includes(modifier.type)) return;
            const record = totals.get(modifier.statPath) || { statPath: modifier.statPath, flat: 0, percent: 0 };
            record[modifier.type] += modifier.value;
            totals.set(modifier.statPath, record);
        });
    });

    return Array.from(totals.values()).sort((a, b) => {
        const aScore = Math.abs(a.flat) + Math.abs(a.percent) * 100;
        const bScore = Math.abs(b.flat) + Math.abs(b.percent) * 100;
        if (bScore !== aScore) return bScore - aScore;
        return a.statPath.localeCompare(b.statPath);
    });
}

function renderItemMutatorSummary(workshopType) {
    const host = document.getElementById('item-mutator-summary-host');
    if (!host) return;

    const totals = collectActiveItemModifierTotals(workshopType);
    const rows = totals.map((entry) => (
        `<div class="workshop-summary-row">` +
            `<span class="workshop-summary-key">${_formatStatLabel(entry.statPath)}</span>` +
            `<span class="workshop-summary-value ${_getMutatorValueClass(entry)}">${_formatMutatorValue(entry)}</span>` +
        `</div>`
    )).join('');

    host.innerHTML = rows || '<div class="workshop-summary-empty">Keine Item-Mods aktiv</div>';
}

// ===== ALT-KEY TRACKING FOR AURA VISIBILITY =====
window.altKeyPressed = false;

document.addEventListener('keydown', (e) => {
    if (e.altKey) {
        window.altKeyPressed = true;
        // Zeige alle aura-overlays wenn Alt gedrückt wird
        document.querySelectorAll('.aura-overlay').forEach(aura => {
            aura.style.opacity = '1';
        });
    }
    // R-Taste für Rotation (bereits in anderen Engines implementiert)
});

document.addEventListener('keyup', (e) => {
    if (!e.altKey) {
        window.altKeyPressed = false;
        // Verstecke aura-overlays wenn Alt losgelassen wird (wenn nicht gehover)
        document.querySelectorAll('.aura-overlay').forEach(aura => {
            const itemEl = aura.closest('.item');
            if (itemEl && !itemEl.matches(':hover')) {
                aura.style.opacity = '0';
            }
        });
    }
});

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

    if (tabId === 'equipment') {
        renderEquipmentHub();
        openWorkshop('farm');
    }
    if (tabId === 'character') {
        syncCharacterHubSetupButtons();
        renderCharacterHubGrid();
        refreshCharacterPanels();
    }
}

let _worldViewBackup = null;

function restoreWorldView() {
    const grindTab = document.getElementById('tab-grind');
    if (!grindTab || _worldViewBackup === null) return;
    grindTab.innerHTML = _worldViewBackup;
    grindTab.style.backgroundImage = '';
    grindTab.style.backgroundSize = '';
    grindTab.style.backgroundPosition = '';
    grindTab.style.backgroundRepeat = '';
    grindTab.classList.remove('world-view');
    grindTab.classList.remove('zone-view');
    _worldViewBackup = null;
}

function renderWorldView() {
    const grindTab = document.getElementById('tab-grind');
    if (!grindTab || typeof WORLD_DATA === 'undefined') return;

    if (_worldViewBackup === null) {
        _worldViewBackup = grindTab.innerHTML;
    }

    grindTab.innerHTML = '';
    grindTab.style.backgroundImage = "url('./Media/Images/World/Welt_A.png')";
    grindTab.style.backgroundSize = 'cover';
    grindTab.style.backgroundPosition = 'center';
    grindTab.style.backgroundRepeat = 'no-repeat';
    grindTab.style.position = 'relative';
    grindTab.classList.add('world-view');
    grindTab.classList.remove('zone-view');

    const header = document.createElement('div');
    header.classList.add('hub-header');
    const title = document.createElement('h3');
    title.classList.add('world-title');
    title.textContent = 'Welt';
    const subtitle = document.createElement('p');
    subtitle.classList.add('world-subtitle');
    subtitle.textContent = 'Wähle eine Zone für die Reise.';
    header.appendChild(title);
    header.appendChild(subtitle);

    const backWrap = document.createElement('div');
    backWrap.style.position = 'absolute';
    backWrap.style.top = '16px';
    backWrap.style.left = '16px';
    const backBtn = document.createElement('button');
    backBtn.classList.add('dropdown-item');
    backBtn.classList.add('world-back-btn');
    backBtn.style.width = 'auto';
    backBtn.style.padding = '8px 12px';
    backBtn.style.fontSize = '0.95rem';
    backBtn.textContent = '← Zurück';
    backBtn.addEventListener('click', restoreWorldView);
    backWrap.appendChild(backBtn);

    const actsContainer = document.createElement('div');
    actsContainer.classList.add('adventure-hub');

    WORLD_DATA.acts.forEach((act) => {
        const actSection = document.createElement('div');
        actSection.classList.add('adventure-card');

        const actTitle = document.createElement('h4');
        actTitle.classList.add('world-act-title');
        actTitle.textContent = act.name;
        actSection.appendChild(actTitle);

        if (act.unlocked) {
            act.zones.forEach((zone) => {
                const zoneCard = document.createElement('div');
                zoneCard.classList.add('adventure-card');
                zoneCard.style.cursor = 'pointer';
                zoneCard.addEventListener('click', () => renderZoneView(zone.id));

                const zoneTitle = document.createElement('h4');
                zoneTitle.classList.add('world-zone-title');
                zoneTitle.textContent = zone.name;
                const zoneDesc = document.createElement('p');
                zoneDesc.classList.add('card-desc');
                zoneDesc.classList.add('world-zone-desc');
                zoneDesc.textContent = zone.description;

                zoneCard.appendChild(zoneTitle);
                zoneCard.appendChild(zoneDesc);
                actSection.appendChild(zoneCard);
            });
        } else {
            actSection.classList.add('disabled');
            const comingSoon = document.createElement('p');
            comingSoon.classList.add('card-desc');
            comingSoon.classList.add('world-zone-desc');
            comingSoon.textContent = 'Coming Soon';
            actSection.appendChild(comingSoon);
        }

        actsContainer.appendChild(actSection);
    });

    grindTab.appendChild(header);
    grindTab.appendChild(backWrap);
    grindTab.appendChild(actsContainer);
}

function renderZoneView(zoneId) {
    const grindTab = document.getElementById('tab-grind');
    if (!grindTab) return;

    if (zoneId !== 'coast') {
        alert('Coming Soon');
        return;
    }

    if (_worldViewBackup === null) {
        _worldViewBackup = grindTab.innerHTML;
    }

    grindTab.innerHTML = '';
    grindTab.style.backgroundImage = "url('./Media/Images/World/Kuestenpfad_A.png')";
    grindTab.style.backgroundSize = 'cover';
    grindTab.style.backgroundPosition = 'center';
    grindTab.style.backgroundRepeat = 'no-repeat';
    grindTab.style.position = 'relative';
    grindTab.classList.add('world-view');
    grindTab.classList.add('zone-view');

    const backWrap = document.createElement('div');
    backWrap.style.position = 'absolute';
    backWrap.style.top = '16px';
    backWrap.style.left = '16px';
    const backBtn = document.createElement('button');
    backBtn.classList.add('dropdown-item');
    backBtn.classList.add('world-back-btn');
    backBtn.style.width = 'auto';
    backBtn.style.padding = '8px 12px';
    backBtn.style.fontSize = '0.95rem';
    backBtn.textContent = '← Zurück';
    backBtn.addEventListener('click', renderWorldView);
    backWrap.appendChild(backBtn);

    const header = document.createElement('div');
    header.classList.add('hub-header');
    const title = document.createElement('h3');
    title.classList.add('world-title');
    title.textContent = 'Küstenpfad';
    const subtitle = document.createElement('p');
    subtitle.classList.add('world-subtitle');
    subtitle.textContent = 'Erstes Gefecht im Backpack Battles Stil (PvE).';
    header.appendChild(title);
    header.appendChild(subtitle);

    const monsterSection = document.createElement('div');
    monsterSection.classList.add('zone-monster');

    const monsterCard = document.createElement('div');
    monsterCard.classList.add('zone-monster-card');

    const monsterPortrait = document.createElement('div');
    monsterPortrait.classList.add('zone-monster-portrait');

    const monsterName = document.createElement('div');
    monsterName.classList.add('world-zone-title');
    monsterName.textContent = 'Unbekanntes Monster';

    const monsterDetails = document.createElement('div');
    monsterDetails.classList.add('zone-monster-details');
    monsterDetails.innerHTML = '<div>Typ: ???</div><div>Resistenzen: ???</div><div>Fähigkeiten: ???</div>';

    monsterCard.appendChild(monsterPortrait);
    monsterCard.appendChild(monsterName);
    monsterCard.appendChild(monsterDetails);
    monsterSection.appendChild(monsterCard);

    const infoGrid = document.createElement('div');
    infoGrid.classList.add('zone-info-grid');

    const logPanel = document.createElement('div');
    logPanel.classList.add('zone-panel');
    const logTitle = document.createElement('h4');
    logTitle.classList.add('world-act-title');
    logTitle.textContent = 'Kampf-Log';
    const logBody = document.createElement('div');
    logBody.classList.add('zone-log');
    logBody.textContent = 'Log erscheint hier, sobald der Kampf startet.';
    logPanel.appendChild(logTitle);
    logPanel.appendChild(logBody);

    const statsPanel = document.createElement('div');
    statsPanel.classList.add('zone-panel');
    statsPanel.classList.add('zone-stats-panel');
    const statsTitle = document.createElement('h4');
    statsTitle.classList.add('world-act-title');
    statsTitle.textContent = 'Monster-Stats';
    const statsList = document.createElement('div');
    statsList.classList.add('zone-stats');
    statsList.innerHTML = '<div>HP: ???</div><div>DMG: ???</div><div>SPD: ???</div><div>Armor: ???</div>';
    statsPanel.appendChild(statsTitle);
    statsPanel.appendChild(statsList);

    monsterSection.appendChild(statsPanel);
    infoGrid.appendChild(logPanel);

    const startBtn = document.createElement('button');
    startBtn.classList.add('dropdown-item');
    startBtn.classList.add('zone-start-btn');
    startBtn.textContent = 'Kampf starten';

    const zoneMonsterPool = (typeof MONSTERS !== 'undefined' && Array.isArray(MONSTERS))
        ? MONSTERS.filter((m) => Array.isArray(m.tags) && m.tags.includes(zoneId))
        : [];
    const pickZoneMonster = () => {
        if (!zoneMonsterPool.length) return null;
        return zoneMonsterPool[Math.floor(Math.random() * zoneMonsterPool.length)];
    };

    startBtn.addEventListener('click', () => {
        const monster = pickZoneMonster();
        if (!monster) {
            logBody.textContent = 'Keine Monster fuer diese Zone definiert.';
            return;
        }

        monsterPortrait.innerHTML = '';
        if (monster.sprite) {
            const img = document.createElement('img');
            img.src = monster.sprite;
            img.alt = monster.name || '';
            img.style.width = '100%';
            img.style.height = '100%';
            img.style.objectFit = 'contain';
            img.style.pointerEvents = 'none';
            monsterPortrait.appendChild(img);
        } else {
            monsterPortrait.textContent = monster.icon || '❔';
        }
        monsterName.textContent = monster.name || 'Unbekanntes Monster';
        statsList.innerHTML =
            `<div>HP: ${monster.hp ?? '??'}</div>` +
            `<div>DMG: ${monster.damage ?? '??'}</div>` +
            `<div>SPD: ${monster.attackSpeed ?? '??'} ms</div>` +
            `<div>Level: ${monster.level ?? '??'}</div>`;
        monsterDetails.innerHTML =
            `<div>Lebensraum: Kuestenpfad</div>` +
            `<div>Beute: ${monster.goldMin ?? '??'}-${monster.goldMax ?? '??'} Gold</div>` +
            `<div>XP: ${monster.xp ?? '??'}</div>`;
        logBody.textContent = `Ein ${monster.name} erscheint...`;
    });

    grindTab.appendChild(header);
    grindTab.appendChild(backWrap);
    grindTab.appendChild(monsterSection);
    grindTab.appendChild(infoGrid);
    grindTab.appendChild(startBtn);
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
    
    // Prevent aura overflow from creating scrollbars - clip aura at grid edges
    container.style.overflow = 'hidden';
    
    // Vorschau-Grids sind jetzt 10x10 in der Anzeige
    const totalSlots = gridKey === 'bank' ? BANK_SLOTS : (GRID_SIZE * GRID_ROWS);
    for (let i = 0; i < totalSlots; i++) {
        const slot = document.createElement('div');
        slot.classList.add('grid-slot');
        
        const cellData = gameData[gridKey][i];
        // FIX: Wir prüfen auf cellData.itemId, falls 'root' mal fehlt
        if (cellData && cellData.itemId) {
            // Wir rendern in der Vorschau nur das Root/Anchor-Symbol
            if (cellData.root || i === 0) {
                const item = getItemDefinition(cellData.itemId);
                if (item) {
                    const itemEl = document.createElement('div');
                    itemEl.classList.add('item', item.rarity);
                    itemEl.style.display = 'flex';
                    itemEl.style.alignItems = 'center';
                    itemEl.style.justifyContent = 'center';

                    // Get rotation angle from cellData
                    const rotationIndex = (typeof cellData.rotationIndex === 'number') ? cellData.rotationIndex : 0;
                    const rotationDeg = rotationIndex * 90;

                    // Prefer sprite image for preview if available
                    if (item.sprite) {
                        const img = document.createElement('img');
                        img.src = item.sprite;
                        img.alt = item.name || '';
                        if (rotationIndex % 2 === 0) {
                            img.style.width = '100%';
                            img.style.height = 'auto';
                        } else {
                            img.style.width = 'auto';
                            img.style.height = '100%';
                        }
                        img.style.pointerEvents = 'none';
                        img.style.transform = `rotate(${rotationDeg}deg)`;
                        itemEl.appendChild(img);
                    } else {
                        const txt = document.createElement('div');
                        txt.innerText = item.icon || '?';
                        txt.style.fontSize = '1rem';
                        txt.style.transform = `rotate(${rotationDeg}deg)`;
                        itemEl.appendChild(txt);
                    }

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
        overlay.classList.remove('workshop-farm', 'workshop-pve', 'workshop-pvp', 'workshop-storage');
        overlay.classList.add(`workshop-${type}`);
        overlay.classList.remove('hidden');
        overlay.style.display = 'flex';
        const title = document.getElementById('workshop-title');
        if (title) title.innerText = type === 'storage' ? "STORAGE" : type.toUpperCase() + " WORKSHOP";
        
        // Hide grid name in storage mode
        const gridName = document.getElementById('grid-name');
        if (gridName) {
            gridName.style.display = type === 'storage' ? 'none' : 'block';
        }
        
        // Toggle storage mode class
        const workshopContent = overlay.querySelector('.workshop-content');
        if (workshopContent) {
            if (type === 'storage') {
                workshopContent.classList.add('storage-mode');
            } else {
                workshopContent.classList.remove('storage-mode');
            }
        }
    }
    
    // Ruft die Funktion aus der Workshopengine.js auf
    setTimeout(() => {
        if (typeof renderWorkshopGrids === 'function') {
            try { queueRenderWorkshopGrids(); } catch (err) { renderWorkshopGrids(); }
        } else {
            console.error("renderWorkshopGrids nicht gefunden! Prüfe index.html Ladereihenfolge.");
        }
        refreshCharacterPanels();
    }, 10);
}

function closeWorkshop() {
    currentWorkshop = null;
    const overlay = document.getElementById('workshop-overlay');
    if (overlay) {
        overlay.classList.add('hidden');
        overlay.classList.remove('workshop-farm', 'workshop-pve', 'workshop-pvp', 'workshop-storage');
    }
    
    if (typeof saveGame === 'function') saveGame();
    renderEquipmentHub();
    refreshCharacterPanels();
}

// ==========================================
// GAME ENGINE & SHOP
// ==========================================

function buyItem(itemId) {
    const item = getItemDefinition(itemId);
    if (!item || gameData.gold < item.price) return;

    // Freien Slot in der Bank suchen
    for (let i = 0; i < BANK_SLOTS; i++) {
        if (!gameData.bank[i]) {
            gameData.gold -= item.price;
            // Nutzt die Gridengine.js (pass a copy of item.body)
            if (typeof placeItemIntoGrid === 'function') {
                const baseBody = (typeof getItemBodyMatrix === 'function')
                    ? getItemBodyMatrix(item, 0)
                    : (item.body || [[1]]);
                const bodyCopy = baseBody.map(r => [...r]);
                const instanceId = placeItemIntoGrid(gameData.bank, i, item, bodyCopy, getBankCols(), null, null, null, 0);
                if (instanceId && typeof registerItemInstance === 'function') {
                    registerItemInstance(gameData, instanceId, item.id, Math.max(1, gameData.level), { source: 'shop' });
                }
            }
            if (typeof renderWorkshopGrids === 'function') { try { queueRenderWorkshopGrids(); } catch (err) { renderWorkshopGrids(); } }
            updateUI();
            if (typeof saveGame === 'function') saveGame();
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

    const characterStats = getDerivedCharacterStats('farmGrid');

    if (characterStats && gameData.character && gameData.character.base) {
        const base = gameData.character.base;
        const lifeRegen = (typeof characterStats.lifeRegen === 'number') ? characterStats.lifeRegen : gameData.hpRegen;
        if (typeof base.currentLife !== 'number') {
            base.currentLife = characterStats.life;
        }
        if (base.currentLife < characterStats.life) {
            base.currentLife = Math.min(characterStats.life, base.currentLife + (lifeRegen * dt));
        }
        if (typeof syncLegacyCharacterFields === 'function') {
            syncLegacyCharacterFields(gameData, characterStats);
        }
    } else if (gameData.hp < gameData.maxHp) {
        gameData.hp = Math.min(gameData.maxHp, gameData.hp + gameData.hpRegen * dt);
    }

    const focusMultiplier = (now < gameData.focusUntil) ? 1.3 : 1.0;
    const speedBonus = characterStats ? characterStats.attackSpeed : calculateEquipmentBonus('farmGrid', 'speed');
    const baseWorkRate = 50 * focusMultiplier * speedBonus;
    
    gameData.workProgress += baseWorkRate * dt;

    if (gameData.workProgress >= 1000) {
        gameData.workProgress = 0;
        
        // Base rewards
        const goldReward = 10;
        const xpReward = 50;
        const xpBonus = characterStats ? characterStats.xpGainMultiplier : calculateEquipmentBonus('farmGrid', 'xp');
        
        gameData.gold += goldReward;
        gameData.totalGold += goldReward;
        const gainedBaseXp = xpReward * xpBonus;
        awardCharacterXP(gainedBaseXp, 'farmGrid');
        gameData.totalXP += gainedBaseXp;
        
        // Monster damage
        if (gameData.currentMonster) {
            const equipped = getEquippedItems('farmGrid');
            const damage = characterStats
                ? calculateCharacterDamageValue(characterStats)
                : calculatePlayerDamageWithEquipment(gameData.level, equipped);
            gameData.currentMonster.hp -= damage;
            
            if (gameData.currentMonster.hp <= 0) {
                // Monster defeated
                const goldBonus = calculateLootReward(gameData.currentMonster.goldMin, gameData.currentMonster.goldMax);
                gameData.gold += goldBonus;
                gameData.totalGold += goldBonus;
                const gainedMonsterXp = gameData.currentMonster.xp * xpBonus;
                awardCharacterXP(gainedMonsterXp, 'farmGrid');
                gameData.totalXP += gainedMonsterXp;
                gameData.monsterDefeats[gameData.currentMonster.id]++;
                
                // Roll for item drop
                if (gameData.currentMonster.dropTable && gameData.currentMonster.dropTable.length > 0) {
                    const dropChance = 0.15; // 15% chance per drop item
                    gameData.currentMonster.dropTable.forEach(itemId => {
                        if (Math.random() < dropChance) {
                            addItemToBank(itemId, gameData.currentMonster.level || gameData.level);
                        }
                    });
                }
                
                spawnMonster(gameData.currentMonsterIndex);
            }
        }
    }
}

function updateUI() {
    const setT = (id, val) => { const el = document.getElementById(id); if (el) el.innerText = val; };
    const setW = (id, val) => { const el = document.getElementById(id); if (el) el.style.width = val + "%"; };
    const characterStats = getDerivedCharacterStats('farmGrid');

    setT('gold-display', Math.floor(gameData.gold).toLocaleString());
    setT('level-display', gameData.level);
    setT('stat-gps', (gameData.workProgress / 1000 * 50).toFixed(1));
    setT('stat-total-gold', Math.floor(gameData.totalGold).toLocaleString());
    setT('stat-total-xp', Math.floor(gameData.totalXP).toLocaleString());
    setW('work-fill', (gameData.workProgress / 1000) * 100);
    setW('hp-fill-header', (gameData.hp / gameData.maxHp) * 100);
    setW('xp-fill-header', (gameData.xp / gameData.xpNextLevel) * 100);
    
    // Update bonus display
    const speedBonus = characterStats
        ? characterStats.attackSpeed
        : calculateEquipmentBonusValue(getEquippedItems('farmGrid'), 'speed');
    const xpBonus = characterStats
        ? characterStats.xpGainMultiplier
        : calculateEquipmentBonusValue(getEquippedItems('farmGrid'), 'xp');
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
    const unlocked = [];
    for (let i = 0; i < MONSTERS.length; i++) {
        if (isMonsterUnlocked(gameData.level, MONSTERS[i].level)) {
            unlocked.push(MONSTERS[i]);
        }
    }
    return unlocked;
}

function getNextMonsterIndex() {
    return getHighestUnlockedMonsterIndex(gameData.level, MONSTERS);
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

function addItemToBank(itemId, itemLevel) {
    const item = getItemDefinition(itemId);
    if (!item) return false;
    
    // Find first empty slot
    for (let i = 0; i < BANK_SLOTS; i++) {
        if (!gameData.bank[i]) {
            if (typeof placeItemIntoGrid === 'function') {
                const baseBody = (typeof getItemBodyMatrix === 'function')
                    ? getItemBodyMatrix(item, 0)
                    : (item.body || [[1]]);
                const bodyCopy = baseBody.map(r => [...r]);
                const instanceId = placeItemIntoGrid(gameData.bank, i, item, bodyCopy, getBankCols(), null, null, null, 0);
                if (instanceId && typeof registerItemInstance === 'function') {
                    const ilvl = Number.isFinite(itemLevel) ? itemLevel : Math.max(1, gameData.level);
                    registerItemInstance(gameData, instanceId, item.id, ilvl, { source: 'drop' });
                }
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
        
        const iconHtml = item.sprite ? `<img src="${item.sprite}" alt="${item.name}" class="shop-item-sprite" style="width:56px;height:56px;object-fit:contain;">` : `<div class="shop-item-icon">${item.icon}</div>`;

        card.innerHTML = `
            ${iconHtml}
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
 * Preview shows BODY only; aura is shown on hover elsewhere.
 */
function renderDragPreviewForGrid(container, location, cols, totalSlots) {
    const draggedItem = DragSystem.getDraggedItem();
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
        const geo = getCellGeometry(container, cols);
        const cellW = geo.cellW;
        const cellH = geo.cellH;
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

    // Use the rotated preview shape for body placement/preview
    const bodyShape = draggedItem.previewShape || draggedItem.item?.body || [[1]];
    const maxRows = Math.ceil(totalSlots / cols);

    // Placement validity is computed once using BODY ONLY (aura can extend outside)
    const placementValid = canPlaceItem(gameData[location], originIndex, bodyShape, cols, maxRows);

    // Render preview for body only
    for (let r = 0; r < bodyShape.length; r++) {
        for (let c = 0; c < bodyShape[0].length; c++) {
            if (!bodyShape[r][c]) continue;
            const tx = originX + c;
            const ty = originY + r;
            const tidx = ty * cols + tx;

            const slotEl = container.querySelector(`.grid-slot[data-index="${tidx}"]`);
            if (slotEl) {
                const prev = document.createElement('div');
                prev.classList.add('preview-block');
                if (!placementValid) prev.classList.add('invalid');
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
    
    // Prevent aura overflow from creating scrollbars - clip aura at grid edges
    bankGrid.style.overflow = 'hidden';
    activeGrid.style.overflow = 'hidden';
    
    // Stelle sicher, dass Grids existieren
    if (!gameData.bank) gameData.bank = {};
    if (!gameData.farmGrid) gameData.farmGrid = {};
    if (!gameData.pveGrid) gameData.pveGrid = {};
    
    console.log("Rendering workshop grids for:", currentWorkshop);
    
    // Bank Grid - always use centralized bank columns (storage-mode or compact)
    const bankCols = getBankCols();
    bankGrid.innerHTML = '';
    // Keep CSS width aligned with runtime column count
    try { bankGrid.style.setProperty('--bank-cols', bankCols); } catch (err) {}
    for (let i = 0; i < BANK_SLOTS; i++) {
        createSlot(bankGrid, 'bank', i, bankCols);
    }
    // Ensure bank grid CSS columns match runtime cols (keeps storage appearance consistent)
    try { bankGrid.style.gridTemplateColumns = `repeat(${bankCols}, var(--slot-size))`; } catch (err) {}
    // Render drag preview for bank
    renderDragPreviewForGrid(bankGrid, 'bank', bankCols, BANK_SLOTS);
    
    // Active Grid (Farm or PvE)
    activeGrid.innerHTML = '';
    const gridType = currentWorkshop === 'farm' ? 'farmGrid' : 
                    currentWorkshop === 'pve' ? 'pveGrid' :
                    currentWorkshop === 'pvp' ? 'pvpGrid' : 'farmGrid';
    
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
            const draggedItem = DragSystem.getDraggedItem();
            if (draggedItem) {
                console.log('💰 SELL ATTEMPT', { itemId: draggedItem.item.id, instanceId: draggedItem.instanceId, fromLocation: draggedItem.fromLocation, item: draggedItem.item });
                const item = draggedItem.item;
                const sellPrice = Math.floor(item.price * 0.5);
                console.log('  Price:', item.price, '→ Sell for:', sellPrice);
                gameData.gold += sellPrice;
                console.log('  Gold now:', gameData.gold);
                console.log('  Clearing from grid:', gameData[draggedItem.fromLocation]);
                clearItemFromGrid(gameData[draggedItem.fromLocation], draggedItem.instanceId);
                DragSystem.clearDraggedItem();
                    try { queueRenderWorkshopGrids(); } catch (err) { renderWorkshopGrids(); }
                updateUI();
                saveGame();
                console.log('  ✅ SELL COMPLETE');
            } else {
                console.log('⚠️ SELL DROP but no draggedItem!');
            }
        });
    }
    
    // Apply storage filters after rendering (if in storage mode)
    if (typeof applyStorageFilters === 'function') {
        applyStorageFilters();
    }

    renderItemMutatorSummary(currentWorkshop);
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
            // Runtime stats are always resolved from static item definitions by itemId.
            const item = getItemDefinition(cell.itemId, cell);
            if (item) equipped.push(item);
        }
    });
    
    return equipped;
}

function calculateEquipmentBonus(gridType, bonusType) {
    if (gridType === 'farmGrid') {
        const characterStats = getDerivedCharacterStats(gridType);
        if (characterStats) {
            if (bonusType === 'speed') return characterStats.attackSpeed;
            if (bonusType === 'xp') return characterStats.xpGainMultiplier;
            if (bonusType === 'damage') return calculateCharacterDamageValue(characterStats);
        }
    }
    const equipped = getEquippedItems(gridType);
    return calculateEquipmentBonusValue(equipped, bonusType);
}

function calculatePlayerDamage() {
    const characterStats = getDerivedCharacterStats('farmGrid');
    if (characterStats) {
        return calculateCharacterDamageValue(characterStats);
    }
    const equipped = getEquippedItems('farmGrid');
    return calculatePlayerDamageWithEquipment(gameData.level, equipped);
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
    
    // 2. Initialize item registry BEFORE rendering shop (supports tools, swords, bows, armor, shields, accessories)
    if (typeof initializeItemRegistry === 'function') {
        initializeItemRegistry();
    }

    if (typeof ensureCharacterModelOnGameData === 'function') {
        ensureCharacterModelOnGameData(gameData);
    }
    markCharacterDirty();
    getDerivedCharacterStats('farmGrid');
    mountCharacterPanels();
    
    // 3. Initiales UI Rendering
    spawnMonster(0);
    renderShop();
    renderEquipmentHub();
    
    // 4. Global event listeners
    if (typeof initGlobalDragListeners === 'function') {
        initGlobalDragListeners();
    }
    
    initTooltipListeners();
    
    // 5. Start-Tab setzen
    switchTab('grind');
    
    // 6. Final UI update
    updateUI();
    refreshCharacterPanels();
    
    console.log("Loadout Legends ready!");
};

