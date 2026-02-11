// ==========================================
// STORAGE ENGINE (storageEngine.js)
// Advanced inventory management system
// ==========================================

/**
 * STORAGE STATE
 * Holds filter, sort, and selection state
 */
const storageState = {
    activeFilter: 'all',           // Current category filter
    searchQuery: '',                // Text search query
    bulkSellMode: false,            // Bulk sell mode active
    selectedItems: new Set(),       // Item instances selected for bulk sell
    lockedItems: new Set(),         // Item instances marked as locked (favorites)
    sortOrder: 'default'            // Current sort order
};

/**
 * CATEGORY MAPPING
 * Maps item types to categories for filtering
 */
const ITEM_CATEGORIES = {
    weapon: ['sword', 'bow', 'weapon'],
    armor: ['armor', 'shield'],
    accessory: ['accessory', 'jewelry'],
    tool: ['tool'],
    material: ['material', 'consumable']
};

/**
 * RARITY HIERARCHY
 * Used for sorting by rarity (higher = better)
 */
const RARITY_ORDER = {
    legendary: 5,
    unique: 4,
    rare: 3,
    magic: 2,
    common: 1
};

/**
 * Get category for an item type
 */
function getItemCategory(itemType) {
    for (const [category, types] of Object.entries(ITEM_CATEGORIES)) {
        if (types.includes(itemType)) return category;
    }
    return 'material'; // Default fallback
}

/**
 * FILTER ITEMS
 * Returns filtered array based on current filter state
 * @param {Object} grid - The storage grid object
 * @returns {Array} - Array of {index, cell, item} objects
 */
function getFilteredStorageItems(grid) {
    if (!grid) return [];
    
    // Extract all root items from grid
    const items = [];
    for (const [index, cell] of Object.entries(grid)) {
        if (!cell || !cell.root || !cell.itemId) continue;
        const item = getItemById(cell.itemId);
        if (!item) continue;
        
        items.push({
            index: parseInt(index),
            cell: cell,
            item: item
        });
    }
    
    // Apply category filter
    let filtered = items;
    if (storageState.activeFilter !== 'all') {
        filtered = items.filter(entry => {
            const category = getItemCategory(entry.item.type);
            return category === storageState.activeFilter;
        });
    }
    
    // Apply text search
    if (storageState.searchQuery) {
        const query = storageState.searchQuery.toLowerCase();
        filtered = filtered.filter(entry => {
            return entry.item.name.toLowerCase().includes(query) ||
                   entry.item.type.toLowerCase().includes(query);
        });
    }
    
    return filtered;
}

/**
 * AUTO-SORT ITEMS
 * Sorts items by: Category > Rarity > Power > Name
 * Locked items always stay at top
 */
function autoSortStorage(gridKey) {
    const grid = gameData[gridKey];
    if (!grid) return;
    
    console.log('🧹 Auto-sorting storage:', gridKey);
    
    // Get all items
    const items = [];
    for (const [index, cell] of Object.entries(grid)) {
        if (!cell || !cell.root || !cell.itemId) continue;
        const item = getItemById(cell.itemId);
        if (!item) continue;
        
        items.push({
            index: parseInt(index),
            cell: cell,
            item: item,
            locked: storageState.lockedItems.has(cell.instanceId)
        });
    }
    
    // Sort algorithm
    items.sort((a, b) => {
        // 1. Locked items first
        if (a.locked !== b.locked) return a.locked ? -1 : 1;
        
        // 2. Category priority
        const catA = getItemCategory(a.item.type);
        const catB = getItemCategory(b.item.type);
        const catOrder = ['weapon', 'armor', 'accessory', 'tool', 'material'];
        const catCompare = catOrder.indexOf(catA) - catOrder.indexOf(catB);
        if (catCompare !== 0) return catCompare;
        
        // 3. Rarity (higher = better)
        const rarityA = RARITY_ORDER[a.item.rarity] || 0;
        const rarityB = RARITY_ORDER[b.item.rarity] || 0;
        if (rarityA !== rarityB) return rarityB - rarityA;
        
        // 4. Power (damage, defense, speedBonus, etc.)
        const powerA = a.item.damage || a.item.defense || a.item.speedBonus || 0;
        const powerB = b.item.damage || b.item.defense || b.item.speedBonus || 0;
        if (powerA !== powerB) return powerB - powerA;
        
        // 5. Alphabetical
        return a.item.name.localeCompare(b.item.name);
    });
    
    // Clear grid
    const cols = gridKey === 'bank' ? 6 : 10;
    for (const key of Object.keys(grid)) {
        delete grid[key];
    }
    
    // Re-place items in sorted order
    let currentIndex = 0;
    for (const entry of items) {
        const bodyShape = getItemBodyMatrix(entry.item, entry.cell.rotationIndex || 0);
        const bodyCopy = bodyShape.map(r => [...r]);
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
        
        // Move to next available slot
        currentIndex++;
        while (grid[currentIndex] && !grid[currentIndex].root) {
            currentIndex++;
        }
    }
    
    // Save and re-render
    saveGame();
    if (typeof renderWorkshopGrids === 'function') {
        try { queueRenderWorkshopGrids(); } catch(e) { renderWorkshopGrids(); }
    }
    
    console.log('✅ Auto-sort complete:', items.length, 'items sorted');
}

/**
 * TOGGLE ITEM LOCK
 * @param {string} instanceId - The instance ID to lock/unlock
 */
function toggleItemLock(instanceId) {
    if (storageState.lockedItems.has(instanceId)) {
        storageState.lockedItems.delete(instanceId);
        console.log('🔓 Unlocked:', instanceId);
    } else {
        storageState.lockedItems.add(instanceId);
        console.log('🔒 Locked:', instanceId);
    }
    
    // Re-render to show lock icon
    if (typeof renderWorkshopGrids === 'function') {
        try { queueRenderWorkshopGrids(); } catch(e) { renderWorkshopGrids(); }
    }
}

/**
 * TOGGLE BULK SELL MODE
 */
function toggleBulkSellMode() {
    storageState.bulkSellMode = !storageState.bulkSellMode;
    storageState.selectedItems.clear();
    
    console.log('💰 Bulk sell mode:', storageState.bulkSellMode ? 'ON' : 'OFF');
    
    // Update UI
    updateStorageUI();
}

/**
 * TOGGLE ITEM SELECTION (for bulk sell)
 */
function toggleItemSelection(instanceId) {
    if (!storageState.bulkSellMode) return;
    
    // Don't allow selecting locked items
    if (storageState.lockedItems.has(instanceId)) {
        console.log('❌ Cannot select locked item');
        return;
    }
    
    if (storageState.selectedItems.has(instanceId)) {
        storageState.selectedItems.delete(instanceId);
    } else {
        storageState.selectedItems.add(instanceId);
    }
    
    updateStorageUI();
}

/**
 * EXECUTE BULK SELL
 */
function executeBulkSell(gridKey) {
    if (storageState.selectedItems.size === 0) return;
    
    const grid = gameData[gridKey];
    if (!grid) return;
    
    let totalGold = 0;
    const soldItems = [];
    
    // Calculate total value and collect items
    for (const [index, cell] of Object.entries(grid)) {
        if (!cell || !cell.root || !cell.instanceId) continue;
        if (!storageState.selectedItems.has(cell.instanceId)) continue;
        
        const item = getItemById(cell.itemId);
        if (!item) continue;
        
        const sellPrice = Math.floor(item.price * 0.5); // 50% of buy price
        totalGold += sellPrice;
        soldItems.push({ instanceId: cell.instanceId, name: item.name, price: sellPrice });
    }
    
    if (soldItems.length === 0) return;
    
    // Confirm
    const confirmMsg = `Verkaufe ${soldItems.length} Items für ${totalGold} Gold?\n\n${soldItems.map(i => `• ${i.name} (${i.price}g)`).join('\n')}`;
    if (!confirm(confirmMsg)) return;
    
    // Remove items from grid
    const cols = gridKey === 'bank' ? 6 : 10;
    for (const sold of soldItems) {
        removeItemFromGrid(grid, sold.instanceId, cols);
    }
    
    // Add gold
    gameData.gold += totalGold;
    
    // Clear selection and save
    storageState.selectedItems.clear();
    saveGame();
    updateUI();
    
    if (typeof renderWorkshopGrids === 'function') {
        try { queueRenderWorkshopGrids(); } catch(e) { renderWorkshopGrids(); }
    }
    
    console.log('✅ Sold', soldItems.length, 'items for', totalGold, 'gold');
}

/**
 * UPDATE STORAGE UI
 * Updates buttons and visual states
 */
function updateStorageUI() {
    // Update bulk sell button
    const bulkBtn = document.getElementById('bulk-sell-btn');
    if (bulkBtn) {
        bulkBtn.textContent = storageState.bulkSellMode 
            ? `✅ Verkaufen (${storageState.selectedItems.size})`
            : '💰 Massenverkauf';
        bulkBtn.classList.toggle('active', storageState.bulkSellMode);
    }
    
    // Show/hide bulk sell actions panel
    const actionsPanel = document.getElementById('bulk-sell-actions');
    if (actionsPanel) {
        actionsPanel.style.display = storageState.bulkSellMode ? 'flex' : 'none';
    }
    
    // Update bulk sell action button text with selection count
    const executeBtn = document.getElementById('execute-bulk-sell');
    if (executeBtn) {
        const count = storageState.selectedItems.size;
        executeBtn.textContent = count > 0 
            ? `Verkaufe ${count} Item${count !== 1 ? 's' : ''}`
            : 'Keine Items ausgewählt';
        executeBtn.disabled = count === 0;
    }
    
    // Update category dropdown
    const categoryFilter = document.getElementById('category-filter');
    if (categoryFilter) {
        categoryFilter.value = storageState.activeFilter;
    }
    
    // Re-render grid with current filter
    if (typeof renderWorkshopGrids === 'function') {
        try { queueRenderWorkshopGrids(); } catch(e) { renderWorkshopGrids(); }
    }
}

/**
 * SET CATEGORY FILTER
 */
function setStorageFilter(category) {
    storageState.activeFilter = category;
    console.log('🔍 Filter set to:', category);
    updateStorageUI();
}

/**
 * SET SEARCH QUERY
 */
function setStorageSearch(query) {
    storageState.searchQuery = query;
    console.log('🔎 Search query:', query);
    updateStorageUI();
}

/**
 * APPLY STORAGE FILTERS TO RENDERED GRID
 * Hides items that don't match current filter/search
 * Called after renderWorkshopGrids() completes
 */
function applyStorageFilters() {
    // Only apply filters in storage mode
    if (typeof currentWorkshop === 'undefined' || currentWorkshop !== 'storage') {
        return;
    }
    
    const bankGrid = document.getElementById('bank-grid');
    if (!bankGrid || !gameData.bank) return;
    
    // Get all item elements in bank grid
    const itemElements = bankGrid.querySelectorAll('.item');
    
    itemElements.forEach(itemEl => {
        const fromIndex = parseInt(itemEl.dataset.fromIndex);
        const cell = gameData.bank[fromIndex];
        
        if (!cell || !cell.instanceId) {
            itemEl.style.display = 'block';
            return;
        }
        
        const item = getItemById(cell.itemId);
        if (!item) {
            itemEl.style.display = 'none';
            return;
        }
        
        let shouldShow = true;
        
        // Apply category filter
        if (storageState.activeFilter !== 'all') {
            const itemCategory = getItemCategory(item.type);
            if (itemCategory !== storageState.activeFilter) {
                shouldShow = false;
            }
        }
        
        // Apply search filter
        if (storageState.searchQuery && shouldShow) {
            const query = storageState.searchQuery.toLowerCase();
            const nameMatch = item.name.toLowerCase().includes(query);
            const rarityMatch = item.rarity.toLowerCase().includes(query);
            const typeMatch = item.type.toLowerCase().includes(query);
            
            if (!nameMatch && !rarityMatch && !typeMatch) {
                shouldShow = false;
            }
        }
        
        // Also hide the parent slot if item is hidden
        const slot = itemEl.closest('.grid-slot');
        if (slot) {
            slot.style.display = shouldShow ? 'block' : 'none';
        }
        
        itemEl.style.display = shouldShow ? 'block' : 'none';
    });
    
    console.log('🔍 Applied storage filters:', {
        filter: storageState.activeFilter,
        search: storageState.searchQuery,
        visibleItems: bankGrid.querySelectorAll('.item[style*="display: block"]').length
    });
}

console.log('✅ Storage Engine loaded');

