// ================================
// ITEMS ENGINE (Itemsengine.js)
// Zentrale Zugriffsstelle auf ALLE Items
// ================================

// Wir erstellen eine statische Liste beim Laden, 
// damit wir nicht bei jedem Zugriff ein neues Array erzeugen müssen.
const ALL_ITEMS = [
    ...TOOL_ITEMS,
    ...WEAPON_ITEMS,
    ...JEWELRY_ITEMS,
];

/**
 * Findet ein Item-Template anhand seiner ID
 */
function getItemById(id) {
    const item = ALL_ITEMS.find(i => i.id === id);
    if (!item) {
        console.warn(`Item mit ID ${id} nicht gefunden!`);
        return null;
    }
    return item;
}

/**
 * Gibt die Matrix (Grid-Form) eines Items zurück.
 * Priorisiert 'body', nutzt 'shape' als Fallback.
 */
function getItemShape(item) {
    if (!item) return [[1]]; // Fallback 1x1
    return item.body || item.shape || [[1]];
}

/**
 * Filtert alle Items, die im Shop kaufbar sein sollen.
 */
function getShopItems() {
    return ALL_ITEMS.filter(item => item.inShop !== false);
}