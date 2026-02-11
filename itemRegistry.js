/* CENTRAL ITEM REGISTRY - All game items organized by category */

// Import all item arrays (these files must be loaded BEFORE this file in index.html)
// Files: tools.js, swords.js, bows.js, armor.js, shields.js, accessories.js

/**
 * Master dictionary of all items by ID for quick lookup
 */
const ALL_ITEMS = {};

/**
 * Build a single combined grid with flags: B=Body, A=Aura, 0=Empty
 * Future: Bs=Body with socket
 */
function _buildCombinedGrid(body, aura) {
    const bodyRows = body ? body.length : 0;
    const bodyCols = (body && body[0]) ? body[0].length : 0;
    const auraRows = aura ? aura.length : 0;
    const auraCols = (aura && aura[0]) ? aura[0].length : 0;
    const rows = Math.max(bodyRows, auraRows, 1);
    const cols = Math.max(bodyCols, auraCols, 1);

    const grid = Array.from({ length: rows }, () => Array(cols).fill('0'));
    const bodyOffR = Math.floor((rows - bodyRows) / 2);
    const bodyOffC = Math.floor((cols - bodyCols) / 2);
    const auraOffR = Math.floor((rows - auraRows) / 2);
    const auraOffC = Math.floor((cols - auraCols) / 2);

    // Build combined grid: B for body, A for aura
    if (body) {
        for (let r = 0; r < bodyRows; r++) {
            for (let c = 0; c < bodyCols; c++) {
                if (!body[r][c]) continue;
                const rr = r + bodyOffR;
                const cc = c + bodyOffC;
                if (grid[rr][cc] === '0') {
                    grid[rr][cc] = 'B';
                } else if (grid[rr][cc] === 'A') {
                    grid[rr][cc] = 'AB';
                }
            }
        }
    }
    if (aura) {
        for (let r = 0; r < auraRows; r++) {
            for (let c = 0; c < auraCols; c++) {
                if (!aura[r][c]) continue;
                const rr = r + auraOffR;
                const cc = c + auraOffC;
                if (grid[rr][cc] === '0') {
                    grid[rr][cc] = 'A';
                } else if (grid[rr][cc] === 'B') {
                    grid[rr][cc] = 'AB';
                }
            }
        }
    }
    return grid;
}

/**
 * Initialize item registry - call this AFTER all item files are loaded
 * This function consolidates all item arrays into a searchable dictionary
 */
function initializeItemRegistry() {
    const allArrays = [];
    if (typeof TOOL_ITEMS !== 'undefined') allArrays.push(TOOL_ITEMS);
    if (typeof SWORD_ITEMS !== 'undefined') allArrays.push(SWORD_ITEMS);
    if (typeof BOW_ITEMS !== 'undefined') allArrays.push(BOW_ITEMS);
    if (typeof ARMOR_ITEMS !== 'undefined') allArrays.push(ARMOR_ITEMS);
    if (typeof SHIELD_ITEMS !== 'undefined') allArrays.push(SHIELD_ITEMS);
    if (typeof ACCESSORY_ITEMS !== 'undefined') allArrays.push(ACCESSORY_ITEMS);
    // Legacy arrays for backward compatibility
    if (typeof WEAPON_ITEMS !== 'undefined') allArrays.push(WEAPON_ITEMS);
    if (typeof JEWELRY_ITEMS !== 'undefined') allArrays.push(JEWELRY_ITEMS);
    
    allArrays.forEach(itemArray => {
        if (!itemArray) {
            console.warn('Warning: Item array not found - check if all item files are loaded');
            return;
        }
        itemArray.forEach(item => {
            if (ALL_ITEMS[item.id]) {
                console.warn('Duplicate item ID:', item.id, '- skipping');
                return;
            }
            if (item && item.rotations) {
                Object.keys(item.rotations).forEach(key => {
                    const rot = item.rotations[key];
                    if (!rot || rot.grid || (!rot.body && !rot.aura)) return;
                    rot.grid = _buildCombinedGrid(rot.body || [[1]], rot.aura || null);
                });
            } else if (item && (item.body || item.aura) && !item.grid) {
                item.grid = _buildCombinedGrid(item.body || [[1]], item.aura || null);
            }
            ALL_ITEMS[item.id] = item;
        });
    });
    
    console.log('✅ Item registry initialized. Total items:', Object.keys(ALL_ITEMS).length);
}

/**
 * Get item by ID from the master registry
 * @param {string} itemId - The item ID to look up
 * @returns {object|null} - The item object or null if not found
 */
function getItemById(itemId) {
    return ALL_ITEMS[itemId] || null;
}

/**
 * Get all items of a specific type
 * @param {string} type - The item type (tool, sword, bow, armor, shield, accessory)
 * @returns {array} - Array of items matching the type
 */
function getItemsByType(type) {
    return Object.values(ALL_ITEMS).filter(item => item.type === type);
}

/**
 * Get all items of a specific rarity
 * @param {string} rarity - The rarity level (common, magic, rare, unique, legendary)
 * @returns {array} - Array of items matching the rarity
 */
function getItemsByRarity(rarity) {
    return Object.values(ALL_ITEMS).filter(item => item.rarity === rarity);
}

/**
 * Get all items available in shop (inShop: true)
 * @returns {array} - Array of shop items
 */
function getShopItems() {
    return Object.values(ALL_ITEMS).filter(item => item.inShop === true);
}

/**
 * Get all items by specified criteria
 * @param {object} criteria - Filter criteria (e.g., {rarity: 'rare', type: 'sword'})
 * @returns {array} - Matching items
 */
function getItemsByCriteria(criteria) {
    return Object.values(ALL_ITEMS).filter(item => {
        return Object.keys(criteria).every(key => item[key] === criteria[key]);
    });
}

/**
 * Item categories metadata for easy reference
 */
const ITEM_CATEGORIES = {
    tools: {
        name: 'Werkzeuge',
        icon: '⛏️',
        description: 'Werkzeuge für Ressourcen-Abbau'
    },
    swords: {
        name: 'Schwerter',
        icon: '🗡️',
        description: 'Nahkampfwaffen mit Schadensbonus'
    },
    bows: {
        name: 'Bögen',
        icon: '🏹',
        description: 'Fernkampfwaffen mit Genauigkeit'
    },
    armor: {
        name: 'Rüstungen',
        icon: '🥾',
        description: 'Defensive Ausrüstung für Schutz'
    },
    shields: {
        name: 'Schilde',
        icon: '🛡️',
        description: 'Blockbare Waffen für Passive Defense'
    },
    accessories: {
        name: 'Accessoires',
        icon: '💍',
        description: 'Schmuck und Talismane mit Boni'
    }
};

/**
 * Rarity levels with color/styling hints for future UI enhancement
 */
const RARITY_LEVELS = {
    common: {
        name: 'Gewöhnlich',
        color: '#888888',
        dropChance: 0.50
    },
    magic: {
        name: 'Magisch',
        color: '#4488FF',
        dropChance: 0.30
    },
    rare: {
        name: 'Selten',
        color: '#FFDD00',
        dropChance: 0.15
    },
    unique: {
        name: 'Unikat',
        color: '#FF8800',
        dropChance: 0.04
    },
    legendary: {
        name: 'Legendär',
        color: '#FF0000',
        dropChance: 0.01
    }
};

// Initialize on startup if all item files are loaded
// Note: This should be called from script.js after DOM is ready
// Call: initializeItemRegistry();
