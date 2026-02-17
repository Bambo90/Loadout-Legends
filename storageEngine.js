// ==========================================
// STORAGE ENGINE (storageEngine.js)
// Storage pages + filter/sell controls
// ==========================================

const STORAGE_PAGE_COLS = 10;
const STORAGE_PAGE_ROWS = 10;
const STORAGE_PAGE_SLOTS = STORAGE_PAGE_COLS * STORAGE_PAGE_ROWS;
const STORAGE_TOTAL_PAGES = 8;
const STORAGE_DEFAULT_UNLOCKED_PAGES = 3;
const STORAGE_UNLOCK_BASE_COST = 1000;
const STORAGE_PAGE_DEFAULT_COLOR = "#252525";

const STORAGE_PAGE_COLOR_PALETTE = [
    STORAGE_PAGE_DEFAULT_COLOR,
    "#2a5298",
    "#3b7a57",
    "#8a6d1f",
    "#7a3b3b",
    "#5b3f8a",
    "#2e6f8a"
];

const storageState = {
    activeFilter: "all",
    searchQuery: "",
    bulkSellMode: false,
    selectedItems: new Set(),
    lockedItems: new Set(),
    sortOrder: "default",
    escListenerBound: false,
    pageSelectorBound: false,
    pageEditorBound: false,
    bulkSellBtnBound: false,
    pageEditorOpen: false,
    pageEditColor: null
};

const STORAGE_ITEM_CATEGORIES = {
    weapon: ["sword", "bow", "weapon"],
    armor: ["armor", "shield"],
    accessory: ["accessory", "jewelry"],
    tool: ["tool"],
    material: ["material", "consumable"]
};

const RARITY_ORDER = {
    legendary: 5,
    unique: 4,
    rare: 3,
    magic: 2,
    common: 1
};

function _isFiniteNumber(value) {
    return typeof value === "number" && Number.isFinite(value);
}

function _cloneGrid(grid) {
    if (!grid || typeof grid !== "object" || Array.isArray(grid)) return {};
    return { ...grid };
}

function getStoragePageUnlockCost(pageIndex) {
    const step = Math.max(0, Number.isFinite(pageIndex) ? pageIndex - (STORAGE_DEFAULT_UNLOCKED_PAGES - 1) : 0);
    return Math.floor(STORAGE_UNLOCK_BASE_COST * Math.pow(1.85, step));
}

function _buildDefaultPageMeta(pageIndex) {
    return {
        name: `Page ${pageIndex + 1}`,
        color: STORAGE_PAGE_DEFAULT_COLOR,
        unlocked: pageIndex < STORAGE_DEFAULT_UNLOCKED_PAGES
    };
}

function _normalizePageMeta(meta, pageIndex) {
    const fallback = _buildDefaultPageMeta(pageIndex);
    const input = (meta && typeof meta === "object") ? meta : {};
    return {
        name: (typeof input.name === "string" && input.name.trim()) ? input.name.trim() : fallback.name,
        color: (typeof input.color === "string" && input.color.trim()) ? input.color.trim() : fallback.color,
        unlocked: typeof input.unlocked === "boolean" ? input.unlocked : fallback.unlocked
    };
}

function ensureBankPageData(data) {
    if (!data || typeof data !== "object") return null;

    const legacyBank = (data.bank && typeof data.bank === "object" && !Array.isArray(data.bank)) ? data.bank : {};
    if (!Array.isArray(data.bankPages) || data.bankPages.length === 0) {
        data.bankPages = Array.from({ length: STORAGE_TOTAL_PAGES }, (_, idx) => (
            idx === 0 ? _cloneGrid(legacyBank) : {}
        ));
    }

    while (data.bankPages.length < STORAGE_TOTAL_PAGES) {
        data.bankPages.push({});
    }

    if (!Array.isArray(data.pageMeta)) {
        data.pageMeta = [];
    }
    for (let i = 0; i < STORAGE_TOTAL_PAGES; i++) {
        data.pageMeta[i] = _normalizePageMeta(data.pageMeta[i], i);
    }

    for (let i = 0; i < STORAGE_DEFAULT_UNLOCKED_PAGES; i++) {
        data.pageMeta[i].unlocked = true;
    }

    if (!data.bankMeta || typeof data.bankMeta !== "object" || Array.isArray(data.bankMeta)) {
        data.bankMeta = {};
    }

    let activePage = Number.isInteger(data.bankMeta.activePage) ? data.bankMeta.activePage : 0;
    if (activePage < 0 || activePage >= STORAGE_TOTAL_PAGES) activePage = 0;
    if (!data.pageMeta[activePage] || !data.pageMeta[activePage].unlocked) {
        activePage = data.pageMeta.findIndex((page) => page && page.unlocked);
        if (activePage < 0) activePage = 0;
    }

    data.bankMeta.activePage = activePage;
    data.bankMeta.pageCols = STORAGE_PAGE_COLS;
    data.bankMeta.pageRows = STORAGE_PAGE_ROWS;
    data.bankMeta.totalPages = STORAGE_TOTAL_PAGES;

    if (!data.bankPages[activePage] || typeof data.bankPages[activePage] !== "object") {
        data.bankPages[activePage] = {};
    }

    data.bank = data.bankPages[activePage];
    return data;
}

function getActiveBankPageIndex() {
    ensureBankPageData(gameData);
    return gameData.bankMeta.activePage;
}

function getActiveBankGrid() {
    ensureBankPageData(gameData);
    return gameData.bank;
}

function setActiveBankPage(pageIndex) {
    ensureBankPageData(gameData);
    const nextIndex = Number.isFinite(pageIndex) ? Math.floor(pageIndex) : -1;
    if (nextIndex < 0 || nextIndex >= STORAGE_TOTAL_PAGES) return false;

    const meta = gameData.pageMeta[nextIndex];
    if (!meta || !meta.unlocked) return false;

    gameData.bankMeta.activePage = nextIndex;
    gameData.bank = gameData.bankPages[nextIndex];
    storageState.selectedItems.clear();

    renderStoragePageTabs();
    updateStorageUI();
    return true;
}

function _showStorageToast(message) {
    if (!message) return;
    let toast = document.getElementById("storage-toast");
    if (!toast) {
        toast = document.createElement("div");
        toast.id = "storage-toast";
        toast.className = "storage-toast";
        document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add("show");
    if (toast._hideTimer) {
        clearTimeout(toast._hideTimer);
    }
    toast._hideTimer = setTimeout(() => {
        toast.classList.remove("show");
    }, 1400);
}

function unlockStoragePage(pageIndex) {
    ensureBankPageData(gameData);
    const idx = Number.isFinite(pageIndex) ? Math.floor(pageIndex) : -1;
    if (idx < 0 || idx >= STORAGE_TOTAL_PAGES) return false;

    const meta = gameData.pageMeta[idx];
    if (!meta) return false;
    if (meta.unlocked) {
        return setActiveBankPage(idx);
    }

    const unlockCost = getStoragePageUnlockCost(idx);
    if (!_isFiniteNumber(gameData.gold) || gameData.gold < unlockCost) {
        _showStorageToast(`Need ${unlockCost} gold to unlock`);
        return false;
    }

    gameData.gold -= unlockCost;
    meta.unlocked = true;
    setActiveBankPage(idx);
    updateUI();
    if (typeof saveGame === "function") saveGame();
    _showStorageToast(`Unlocked ${meta.name}`);
    return true;
}

function renameStoragePage(pageIndex) {
    ensureBankPageData(gameData);
    const idx = Number.isFinite(pageIndex) ? Math.floor(pageIndex) : -1;
    if (idx < 0 || idx >= STORAGE_TOTAL_PAGES) return;

    const meta = gameData.pageMeta[idx];
    if (!meta || !meta.unlocked) return;

    const fallback = `Page ${idx + 1}`;
    meta.name = (typeof meta.name === "string" && meta.name.trim()) ? meta.name.trim() : fallback;
    renderStoragePageTabs();
    if (typeof saveGame === "function") saveGame();
}

function setActiveStoragePageColor(color) {
    ensureBankPageData(gameData);
    const idx = getActiveBankPageIndex();
    const meta = gameData.pageMeta[idx];
    if (!meta || !meta.unlocked) return;
    if (typeof color !== "string" || !color.trim()) return;

    meta.color = color.trim();
    renderStoragePageTabs();
    if (typeof saveGame === "function") saveGame();
}

function _getStoragePageLabel(meta, index) {
    const fallback = _buildDefaultPageMeta(index);
    const pageName = (meta && typeof meta.name === "string" && meta.name.trim())
        ? meta.name.trim()
        : fallback.name;
    if (meta && meta.unlocked) {
        return `${index + 1}. ${pageName}`;
    }
    const cost = getStoragePageUnlockCost(index);
    return `LOCKED - ${pageName} (${cost}g)`;
}

function _onStoragePageSelectChange(event) {
    ensureBankPageData(gameData);
    const selected = parseInt(event && event.target ? event.target.value : "", 10);
    if (!Number.isFinite(selected)) return;

    const meta = gameData.pageMeta[selected];
    if (meta && meta.unlocked) {
        if (setActiveBankPage(selected) && typeof saveGame === "function") {
            saveGame();
        }
        return;
    }

    const unlocked = unlockStoragePage(selected);
    if (!unlocked && event && event.target) {
        event.target.value = String(getActiveBankPageIndex());
    }
}

function _renderStoragePageEditorPalette(activeColor) {
    const paletteHost = document.getElementById("storage-page-editor-palette");
    if (!paletteHost) return;
    paletteHost.innerHTML = "";

    STORAGE_PAGE_COLOR_PALETTE.forEach((color) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "storage-page-editor-color";
        button.style.backgroundColor = color;
        if (activeColor === color) {
            button.classList.add("active");
        }
        button.addEventListener("click", () => {
            storageState.pageEditColor = color;
            _renderStoragePageEditorPalette(color);
        });
        paletteHost.appendChild(button);
    });
}

function _colorToRgba(color, alpha) {
    const a = Math.min(1, Math.max(0, Number.isFinite(alpha) ? alpha : 1));
    if (typeof color !== "string") return `rgba(37, 37, 37, ${a})`;
    const trimmed = color.trim();
    const hexMatch = trimmed.match(/^#([0-9a-fA-F]{6})$/);
    if (hexMatch) {
        const hex = hexMatch[1];
        const r = parseInt(hex.slice(0, 2), 16);
        const g = parseInt(hex.slice(2, 4), 16);
        const b = parseInt(hex.slice(4, 6), 16);
        return `rgba(${r}, ${g}, ${b}, ${a})`;
    }
    return trimmed;
}

function _bindStoragePageControls() {
    const selector = document.getElementById("storage-page-select");
    if (selector && !storageState.pageSelectorBound) {
        selector.addEventListener("change", _onStoragePageSelectChange);
        storageState.pageSelectorBound = true;
    }

    const editor = document.getElementById("storage-page-editor");
    if (editor && !storageState.pageEditorBound) {
        editor.addEventListener("click", (event) => {
            if (event.target === editor) {
                closeStoragePageEditor();
            }
        });
        storageState.pageEditorBound = true;
    }

    const bulkSellBtn = document.getElementById("bulk-sell-btn");
    if (bulkSellBtn && !storageState.bulkSellBtnBound) {
        bulkSellBtn.type = "button";
        bulkSellBtn.removeAttribute("onclick");
        bulkSellBtn.addEventListener("click", (event) => {
            event.preventDefault();
            toggleBulkSellMode();
        });
        storageState.bulkSellBtnBound = true;
    }
}

function renderStoragePageTabs() {
    ensureBankPageData(gameData);
    _bindStoragePageControls();
    const selector = document.getElementById("storage-page-select");
    if (!selector) return;
    const editBtn = document.getElementById("storage-page-edit-btn");

    const activePage = getActiveBankPageIndex();
    selector.innerHTML = "";
    for (let i = 0; i < STORAGE_TOTAL_PAGES; i++) {
        const meta = gameData.pageMeta[i];
        const option = document.createElement("option");
        option.value = String(i);
        option.textContent = _getStoragePageLabel(meta, i);
        option.selected = i === activePage;
        selector.appendChild(option);
    }
    selector.value = String(activePage);

    const activeMeta = gameData.pageMeta[activePage];
    const activeColor = (activeMeta && typeof activeMeta.color === "string" && activeMeta.color.trim())
        ? activeMeta.color.trim()
        : STORAGE_PAGE_DEFAULT_COLOR;
    selector.style.borderColor = activeColor;
    selector.style.background = `linear-gradient(135deg, ${_colorToRgba(activeColor, 0.38)} 0%, #252525 100%)`;

    if (editBtn) {
        editBtn.disabled = !(activeMeta && activeMeta.unlocked);
        editBtn.style.borderColor = activeColor;
    }

    if (storageState.pageEditorOpen) {
        const nameInput = document.getElementById("storage-page-name-input");
        if (nameInput && activeMeta && activeMeta.unlocked) {
            nameInput.value = activeMeta.name || `Page ${activePage + 1}`;
        }
        const editorColor = storageState.pageEditColor || (activeMeta ? activeMeta.color : STORAGE_PAGE_COLOR_PALETTE[0]);
        _renderStoragePageEditorPalette(editorColor);
    }
}

function openStoragePageEditor() {
    ensureBankPageData(gameData);
    const activeIndex = getActiveBankPageIndex();
    const meta = gameData.pageMeta[activeIndex];
    if (!meta || !meta.unlocked) return;

    const editor = document.getElementById("storage-page-editor");
    const nameInput = document.getElementById("storage-page-name-input");
    if (!editor || !nameInput) return;

    storageState.pageEditorOpen = true;
    storageState.pageEditColor = (typeof meta.color === "string" && meta.color.trim())
        ? meta.color.trim()
        : STORAGE_PAGE_COLOR_PALETTE[0];

    nameInput.value = meta.name || `Page ${activeIndex + 1}`;
    _renderStoragePageEditorPalette(storageState.pageEditColor);

    editor.classList.remove("hidden");
    nameInput.focus();
    nameInput.select();
}

function closeStoragePageEditor() {
    storageState.pageEditorOpen = false;
    const editor = document.getElementById("storage-page-editor");
    if (editor) {
        editor.classList.add("hidden");
    }
}

function saveStoragePageEditor() {
    ensureBankPageData(gameData);
    const activeIndex = getActiveBankPageIndex();
    const meta = gameData.pageMeta[activeIndex];
    if (!meta || !meta.unlocked) {
        closeStoragePageEditor();
        return;
    }

    const nameInput = document.getElementById("storage-page-name-input");
    const nextName = nameInput && typeof nameInput.value === "string"
        ? nameInput.value.trim()
        : "";
    if (nextName) {
        meta.name = nextName;
    }

    if (typeof storageState.pageEditColor === "string" && storageState.pageEditColor.trim()) {
        meta.color = storageState.pageEditColor.trim();
    }

    closeStoragePageEditor();
    renderStoragePageTabs();
    if (typeof saveGame === "function") saveGame();
}

function getItemCategory(itemType) {
    for (const [category, types] of Object.entries(STORAGE_ITEM_CATEGORIES)) {
        if (types.includes(itemType)) return category;
    }
    return "material";
}

function getFilteredStorageItems(grid) {
    if (!grid) return [];

    const items = [];
    for (const [index, cell] of Object.entries(grid)) {
        if (!cell || !cell.root || !cell.itemId) continue;
        const item = getItemById(cell.itemId);
        if (!item) continue;

        items.push({
            index: parseInt(index, 10),
            cell,
            item
        });
    }

    let filtered = items;
    if (storageState.activeFilter !== "all") {
        filtered = filtered.filter((entry) => getItemCategory(entry.item.type) === storageState.activeFilter);
    }

    if (storageState.searchQuery) {
        const query = storageState.searchQuery.toLowerCase();
        filtered = filtered.filter((entry) => (
            entry.item.name.toLowerCase().includes(query) ||
            entry.item.type.toLowerCase().includes(query)
        ));
    }

    return filtered;
}

function autoSortStorage(gridKey) {
    const targetKey = (typeof gridKey === "string" && gridKey) ? gridKey : "bank";
    const grid = targetKey === "bank" ? getActiveBankGrid() : gameData[targetKey];
    if (!grid) return;

    const items = [];
    for (const [index, cell] of Object.entries(grid)) {
        if (!cell || !cell.root || !cell.itemId) continue;
        const item = getItemById(cell.itemId);
        if (!item) continue;

        items.push({
            index: parseInt(index, 10),
            cell,
            item,
            locked: storageState.lockedItems.has(cell.instanceId)
        });
    }

    items.sort((a, b) => {
        if (a.locked !== b.locked) return a.locked ? -1 : 1;

        const catA = getItemCategory(a.item.type);
        const catB = getItemCategory(b.item.type);
        const catOrder = ["weapon", "armor", "accessory", "tool", "material"];
        const catCompare = catOrder.indexOf(catA) - catOrder.indexOf(catB);
        if (catCompare !== 0) return catCompare;

        const rarityA = RARITY_ORDER[a.item.rarity] || 0;
        const rarityB = RARITY_ORDER[b.item.rarity] || 0;
        if (rarityA !== rarityB) return rarityB - rarityA;

        const powerA = a.item.damage || a.item.defense || a.item.speedBonus || 0;
        const powerB = b.item.damage || b.item.defense || b.item.speedBonus || 0;
        if (powerA !== powerB) return powerB - powerA;

        return a.item.name.localeCompare(b.item.name);
    });

    const cols = targetKey === "bank" ? STORAGE_PAGE_COLS : GRID_SIZE;
    Object.keys(grid).forEach((key) => delete grid[key]);

    let currentIndex = 0;
    for (const entry of items) {
        const bodyShape = getItemBodyMatrix(entry.item, entry.cell.rotationIndex || 0);
        const bodyCopy = bodyShape.map((r) => [...r]);
        const rotatedAura = entry.cell.rotatedAura || null;

        placeItemIntoGrid(
            grid,
            currentIndex,
            entry.item,
            bodyCopy,
            cols,
            entry.cell.instanceId,
            null,
            rotatedAura,
            entry.cell.rotationIndex || 0
        );

        currentIndex++;
        while (grid[currentIndex] && !grid[currentIndex].root) {
            currentIndex++;
        }
    }

    if (typeof saveGame === "function") saveGame();
    if (typeof renderWorkshopGrids === "function") {
        try { queueRenderWorkshopGrids(); } catch (err) { renderWorkshopGrids(); }
    }
}

function toggleItemLock(instanceId) {
    if (!instanceId) return;

    if (storageState.lockedItems.has(instanceId)) {
        storageState.lockedItems.delete(instanceId);
    } else {
        storageState.lockedItems.add(instanceId);
    }

    if (typeof renderWorkshopGrids === "function") {
        try { queueRenderWorkshopGrids(); } catch (err) { renderWorkshopGrids(); }
    }
}

function cancelBulkSellMode() {
    storageState.bulkSellMode = false;
    storageState.selectedItems.clear();
    updateStorageUI();
}

function _getCurrentWorkshopType() {
    if (typeof currentWorkshop !== "undefined") {
        return currentWorkshop;
    }
    if (typeof window !== "undefined" && typeof window.currentWorkshop !== "undefined") {
        return window.currentWorkshop;
    }
    return null;
}

function _isStorageModeActive() {
    const overlay = document.getElementById("workshop-overlay");
    const workshopVisible = !!(overlay && !overlay.classList.contains("hidden"));
    const hasBankGrid = !!document.getElementById("bank-grid");
    if (workshopVisible && hasBankGrid) return true;
    return _getCurrentWorkshopType() === "storage";
}

function toggleBulkSellMode() {
    if (!_isStorageModeActive()) return;
    storageState.bulkSellMode = !storageState.bulkSellMode;
    storageState.selectedItems.clear();
    updateStorageUI();
}

function toggleItemSelection(instanceId) {
    if (!storageState.bulkSellMode || !instanceId) return;

    const grid = getActiveBankGrid();
    const existsInCurrentPage = Object.values(grid).some((cell) => (
        cell && cell.root && cell.instanceId === instanceId
    ));
    if (!existsInCurrentPage) return;

    if (storageState.lockedItems.has(instanceId)) return;

    if (storageState.selectedItems.has(instanceId)) {
        storageState.selectedItems.delete(instanceId);
    } else {
        storageState.selectedItems.add(instanceId);
    }

    updateStorageUI();
}

function _getSellPriceForCell(cell) {
    if (!cell || !cell.itemId) return 0;
    const item = getItemById(cell.itemId);
    if (!item) return 0;

    const baseValue = _isFiniteNumber(item.price)
        ? item.price
        : (_isFiniteNumber(item.baseValue) ? item.baseValue : 1);

    let itemLevel = 1;
    if (typeof getItemInstanceData === "function" && cell.instanceId) {
        const record = getItemInstanceData(gameData, cell.instanceId);
        if (record && _isFiniteNumber(record.itemLevel)) {
            itemLevel = Math.max(1, Math.floor(record.itemLevel));
        }
    }
    if (!_isFiniteNumber(itemLevel) || itemLevel < 1) itemLevel = 1;

    return Math.max(1, Math.floor(baseValue * itemLevel * 0.3));
}

function _getSelectedSellTotalGold() {
    const grid = getActiveBankGrid();
    if (!grid || !storageState.bulkSellMode || storageState.selectedItems.size === 0) return 0;

    let totalGold = 0;
    Object.keys(grid).forEach((slotKey) => {
        const cell = grid[slotKey];
        if (!cell || !cell.root || !cell.instanceId) return;
        if (!storageState.selectedItems.has(cell.instanceId)) return;
        totalGold += _getSellPriceForCell(cell);
    });
    return Math.max(0, Math.floor(totalGold));
}

function executeBulkSell() {
    if (!storageState.bulkSellMode || storageState.selectedItems.size === 0) return;

    const grid = getActiveBankGrid();
    if (!grid) return;

    let totalGold = 0;
    const soldIds = [];

    Object.keys(grid).forEach((slotKey) => {
        const cell = grid[slotKey];
        if (!cell || !cell.root || !cell.instanceId) return;
        if (!storageState.selectedItems.has(cell.instanceId)) return;

        const sellPrice = _getSellPriceForCell(cell);
        if (sellPrice <= 0) return;

        totalGold += sellPrice;
        soldIds.push(cell.instanceId);
    });

    if (soldIds.length === 0) return;

    soldIds.forEach((instanceId) => {
        clearItemFromGrid(grid, instanceId);
        if (typeof removeItemInstanceData === "function") {
            removeItemInstanceData(gameData, instanceId);
        }
    });

    gameData.gold += totalGold;
    storageState.selectedItems.clear();

    if (typeof saveGame === "function") saveGame();
    if (typeof updateUI === "function") updateUI();
    if (typeof renderWorkshopGrids === "function") {
        try { queueRenderWorkshopGrids(); } catch (err) { renderWorkshopGrids(); }
    }

    if (typeof playUISound === "function") {
        playUISound("itemSold");
    }

    _showStorageToast(`Sold ${soldIds.length} item(s) for ${totalGold} gold`);
    updateStorageUI();
}

function updateStorageUI() {
    ensureBankPageData(gameData);
    const workshopType = _getCurrentWorkshopType();
    const storageModeActive = _isStorageModeActive();

    const bulkBtn = document.getElementById("bulk-sell-btn");
    if (bulkBtn) {
        bulkBtn.textContent = "SELL";
        bulkBtn.classList.toggle("active", storageState.bulkSellMode);
        bulkBtn.disabled = !storageModeActive;
    }

    const actionsPanel = document.getElementById("bulk-sell-actions");
    if (actionsPanel) {
        actionsPanel.style.display = (storageState.bulkSellMode && storageModeActive) ? "flex" : "none";
    }

    const executeBtn = document.getElementById("execute-bulk-sell");
    if (executeBtn) {
        const totalGold = _getSelectedSellTotalGold();
        executeBtn.textContent = `Sell ${totalGold} Gold`;
        executeBtn.disabled = totalGold <= 0;
    }

    const categoryFilter = document.getElementById("category-filter");
    if (categoryFilter) {
        categoryFilter.value = storageState.activeFilter;
    }

    renderStoragePageTabs();

    if (typeof renderWorkshopGrids === "function" && (workshopType || storageModeActive)) {
        try { queueRenderWorkshopGrids(); } catch (err) { renderWorkshopGrids(); }
    }
}

function setStorageFilter(category) {
    storageState.activeFilter = category;
    updateStorageUI();
}

function setStorageSearch(query) {
    storageState.searchQuery = query;
    updateStorageUI();
}

function applyStorageFilters() {
    const bankGrid = document.getElementById("bank-grid");
    const activeGrid = getActiveBankGrid();
    if (!bankGrid || !activeGrid) return;

    const itemElements = bankGrid.querySelectorAll(".item");

    itemElements.forEach((itemEl) => {
        const fromIndex = parseInt(itemEl.dataset.fromIndex, 10);
        const cell = activeGrid[fromIndex];

        if (!cell || !cell.instanceId) {
            itemEl.style.visibility = "visible";
            itemEl.style.pointerEvents = "auto";
            return;
        }

        const item = getItemById(cell.itemId);
        if (!item) {
            itemEl.style.visibility = "hidden";
            itemEl.style.pointerEvents = "none";
            return;
        }

        let shouldShow = true;

        if (storageState.activeFilter !== "all") {
            const itemCategory = getItemCategory(item.type);
            if (itemCategory !== storageState.activeFilter) {
                shouldShow = false;
            }
        }

        if (storageState.searchQuery && shouldShow) {
            const query = storageState.searchQuery.toLowerCase();
            const nameMatch = item.name.toLowerCase().includes(query);
            const rarityMatch = item.rarity.toLowerCase().includes(query);
            const typeMatch = item.type.toLowerCase().includes(query);
            if (!nameMatch && !rarityMatch && !typeMatch) {
                shouldShow = false;
            }
        }

        const slot = itemEl.closest(".grid-slot");
        if (slot) {
            slot.style.visibility = "visible";
            slot.style.pointerEvents = shouldShow ? "auto" : "none";
        }
        itemEl.style.visibility = shouldShow ? "visible" : "hidden";
        itemEl.style.pointerEvents = shouldShow ? "auto" : "none";
    });
}

function _onStorageGlobalKeyDown(event) {
    if (!event || event.key !== "Escape") return;
    if (storageState.pageEditorOpen) {
        closeStoragePageEditor();
        return;
    }
    if (!storageState.bulkSellMode) return;
    cancelBulkSellMode();
}

function initStorageSystem() {
    if (storageState.escListenerBound) return;
    storageState.escListenerBound = true;
    document.addEventListener("keydown", _onStorageGlobalKeyDown, true);
    _bindStoragePageControls();
}

initStorageSystem();

if (typeof window !== "undefined") {
    window.storageState = storageState;
    window.STORAGE_PAGE_SLOTS = STORAGE_PAGE_SLOTS;
    window.STORAGE_TOTAL_PAGES = STORAGE_TOTAL_PAGES;
    window.ensureBankPageData = ensureBankPageData;
    window.getActiveBankPageIndex = getActiveBankPageIndex;
    window.getActiveBankGrid = getActiveBankGrid;
    window.setActiveBankPage = setActiveBankPage;
    window.unlockStoragePage = unlockStoragePage;
    window.renderStoragePageTabs = renderStoragePageTabs;
    window.openStoragePageEditor = openStoragePageEditor;
    window.closeStoragePageEditor = closeStoragePageEditor;
    window.saveStoragePageEditor = saveStoragePageEditor;
    window.toggleBulkSellMode = toggleBulkSellMode;
    window.cancelBulkSellMode = cancelBulkSellMode;
    window.toggleItemSelection = toggleItemSelection;
    window.executeBulkSell = executeBulkSell;
    window.updateStorageUI = updateStorageUI;
    window.showStorageToast = _showStorageToast;
    window.setStorageFilter = setStorageFilter;
    window.setStorageSearch = setStorageSearch;
    window.applyStorageFilters = applyStorageFilters;
    window.autoSortStorage = autoSortStorage;
    window.toggleItemLock = toggleItemLock;
}

console.log("Storage Engine loaded");
