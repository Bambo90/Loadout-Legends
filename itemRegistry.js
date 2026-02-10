/* CENTRAL ITEM REGISTRY - All game items organized by category */

// Import all item arrays (these files must be loaded BEFORE this file in index.html)
// Files: tools.js, swords.js, bows.js, armor.js, shields.js, accessories.js

/**
 * Master dictionary of all items by ID for quick lookup
 */
const ALL_ITEMS = {};

/**
 * Initialize item registry - call this AFTER all item files are loaded
 * This function consolidates all item arrays into a searchable dictionary
 */
function initializeItemRegistry() {
    const allArrays = [
        TOOL_ITEMS,
        SWORD_ITEMS,
        BOW_ITEMS,
        ARMOR_ITEMS,
        SHIELD_ITEMS,
        ACCESSORY_ITEMS
    ];
    
    allArrays.forEach(itemArray => {
        if (!itemArray) {
            console.warn('Warning: Item array not found - check if all item files are loaded');
            return;
        }
        itemArray.forEach(item => {
            if (ALL_ITEMS[item.id]) {
                console.error('Duplicate item ID:', item.id);
                return;
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
