// ================================
// ITEMS ENGINE (Itemsengine.js)
// Legacy compatibility layer - uses itemRegistry.js
// ================================

// NOTE: ALL_ITEMS is now declared in itemRegistry.js
// This file provides backward-compatible functions

/**
 * Findet ein Item-Template anhand seiner ID
 * (Uses itemRegistry.js if available, falls back to legacy arrays)
 */
function getItemById(id) {
    // Prefer itemRegistry if available
    if (typeof ALL_ITEMS !== 'undefined') {
        const item = ALL_ITEMS[id];
        if (!item) {
            console.warn(`Item mit ID ${id} nicht gefunden!`);
            return null;
        }
        return item;
    }
    // Legacy fallback
    const legacyItems = [...(TOOL_ITEMS || []), ...(WEAPON_ITEMS || []), ...(JEWELRY_ITEMS || [])];
    return legacyItems.find(i => i.id === id) || null;
}

/**
 * Gibt die Matrix (Grid-Form) eines Items zurück.
 * Priorisiert 'body', nutzt 'shape' als Fallback.
 */
function getItemShape(item) {
    if (!item) return [[1]]; // Fallback 1x1
    // Always return body (aura is for synergies only, not placement)
    return item.body || [[1]];
}

/**
 * Filtert alle Items, die im Shop kaufbar sein sollen.
 * (Uses itemRegistry.js if available)
 */
function getShopItems() {
    if (typeof ALL_ITEMS !== 'undefined' && typeof ALL_ITEMS === 'object') {
        return Object.values(ALL_ITEMS).filter(item => item.inShop === true);
    }
    // Legacy fallback
    const legacyItems = [...(TOOL_ITEMS || []), ...(WEAPON_ITEMS || []), ...(JEWELRY_ITEMS || [])];
    return legacyItems.filter(item => item.inShop !== false);
}