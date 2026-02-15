/* ITEM FILE: Global Item Index
 * Central aggregator/registry feeder for all concrete item defs.
 * ilvl/tier/roll ranges are handled upstream by affix/generator systems.
 */

const ITEMS_ALL_DEFS = [
    ...(typeof ITEMS_WEAPONS_ALL !== "undefined" ? ITEMS_WEAPONS_ALL : []),
    ...(typeof ITEMS_OFFHANDS_ALL !== "undefined" ? ITEMS_OFFHANDS_ALL : []),
    ...(typeof ITEMS_ARMOR_ALL !== "undefined" ? ITEMS_ARMOR_ALL : []),
    ...(typeof ITEMS_ACCESSORIES_ALL !== "undefined" ? ITEMS_ACCESSORIES_ALL : []),
    ...(typeof ITEMS_ENHANCEMENTS_ALL !== "undefined" ? ITEMS_ENHANCEMENTS_ALL : []),
    ...(typeof ITEMS_CONSUMABLES_ALL !== "undefined" ? ITEMS_CONSUMABLES_ALL : [])
];

// Backward-compat aliases so runtime/item systems continue to work without gameplay logic changes.
const SWORD_ITEMS = (typeof ITEMS_WEAPONS_SWORDS !== "undefined" ? ITEMS_WEAPONS_SWORDS : []);
const BOW_ITEMS = (typeof ITEMS_WEAPONS_BOWS !== "undefined" ? ITEMS_WEAPONS_BOWS : []);
const ARMOR_ITEMS = (typeof ITEMS_ARMOR_BODY !== "undefined" ? ITEMS_ARMOR_BODY : []);
const SHIELD_ITEMS = (typeof ITEMS_OFFHANDS_SHIELDS !== "undefined" ? ITEMS_OFFHANDS_SHIELDS : []);
const ACCESSORY_ITEMS = (typeof ITEMS_ACCESSORIES_ALL !== "undefined" ? ITEMS_ACCESSORIES_ALL : []);
const TOOL_ITEMS = (typeof ITEMS_ENHANCEMENTS_WHETSTONES !== "undefined" ? ITEMS_ENHANCEMENTS_WHETSTONES : []);

const WEAPON_ITEMS = [
    ...SWORD_ITEMS.filter((item) => item && item.type === "weapon"),
    ...(typeof ITEMS_WEAPONS_AXES !== "undefined" ? ITEMS_WEAPONS_AXES : []),
    ...BOW_ITEMS.filter((item) => item && item.type === "weapon")
];
const JEWELRY_ITEMS = ACCESSORY_ITEMS.filter((item) => item && item.type === "jewelry");

const ALL_ITEMS = {};

function _buildCombinedGrid(body, aura) {
    const bodyRows = body ? body.length : 0;
    const bodyCols = (body && body[0]) ? body[0].length : 0;
    const auraRows = aura ? aura.length : 0;
    const auraCols = (aura && aura[0]) ? aura[0].length : 0;
    const rows = Math.max(bodyRows, auraRows, 1);
    const cols = Math.max(bodyCols, auraCols, 1);

    const grid = Array.from({ length: rows }, () => Array(cols).fill("0"));
    const bodyOffR = Math.floor((rows - bodyRows) / 2);
    const bodyOffC = Math.floor((cols - bodyCols) / 2);
    const auraOffR = Math.floor((rows - auraRows) / 2);
    const auraOffC = Math.floor((cols - auraCols) / 2);

    if (body) {
        for (let r = 0; r < bodyRows; r++) {
            for (let c = 0; c < bodyCols; c++) {
                if (!body[r][c]) continue;
                const rr = r + bodyOffR;
                const cc = c + bodyOffC;
                if (grid[rr][cc] === "0") grid[rr][cc] = "B";
                else if (grid[rr][cc] === "A") grid[rr][cc] = "AB";
            }
        }
    }

    if (aura) {
        for (let r = 0; r < auraRows; r++) {
            for (let c = 0; c < auraCols; c++) {
                if (!aura[r][c]) continue;
                const rr = r + auraOffR;
                const cc = c + auraOffC;
                if (grid[rr][cc] === "0") grid[rr][cc] = "A";
                else if (grid[rr][cc] === "B") grid[rr][cc] = "AB";
            }
        }
    }

    return grid;
}

function initializeItemRegistry() {
    Object.keys(ALL_ITEMS).forEach((key) => delete ALL_ITEMS[key]);

    ITEMS_ALL_DEFS.forEach((item) => {
        if (!item || !item.id) return;
        if (ALL_ITEMS[item.id]) {
            console.warn("Duplicate item ID:", item.id, "- skipping");
            return;
        }

        if (item.rotations) {
            Object.keys(item.rotations).forEach((key) => {
                const rot = item.rotations[key];
                if (!rot || rot.grid || (!rot.body && !rot.aura)) return;
                rot.grid = _buildCombinedGrid(rot.body || [[1]], rot.aura || null);
            });
        } else if ((item.body || item.aura) && !item.grid) {
            item.grid = _buildCombinedGrid(item.body || [[1]], item.aura || null);
        }

        ALL_ITEMS[item.id] = item;
    });

    console.log("✅ Item registry initialized. Total items:", Object.keys(ALL_ITEMS).length);
}

function getItemById(itemId) {
    return ALL_ITEMS[itemId] || null;
}

function getItemsByType(type) {
    return Object.values(ALL_ITEMS).filter((item) => item.type === type);
}

function getItemsByRarity(rarity) {
    return Object.values(ALL_ITEMS).filter((item) => item.rarity === rarity);
}

function getShopItems() {
    return Object.values(ALL_ITEMS).filter((item) => item.inShop === true);
}

function getItemsByCriteria(criteria) {
    return Object.values(ALL_ITEMS).filter((item) => {
        return Object.keys(criteria).every((key) => item[key] === criteria[key]);
    });
}

if (typeof window !== "undefined") {
    window.ITEMS_ALL_DEFS = ITEMS_ALL_DEFS;

    window.SWORD_ITEMS = SWORD_ITEMS;
    window.BOW_ITEMS = BOW_ITEMS;
    window.ARMOR_ITEMS = ARMOR_ITEMS;
    window.SHIELD_ITEMS = SHIELD_ITEMS;
    window.ACCESSORY_ITEMS = ACCESSORY_ITEMS;
    window.TOOL_ITEMS = TOOL_ITEMS;
    window.WEAPON_ITEMS = WEAPON_ITEMS;
    window.JEWELRY_ITEMS = JEWELRY_ITEMS;

    window.ALL_ITEMS = ALL_ITEMS;
    window.initializeItemRegistry = initializeItemRegistry;
    window.getItemById = getItemById;
    window.getItemsByType = getItemsByType;
    window.getItemsByRarity = getItemsByRarity;
    window.getShopItems = getShopItems;
    window.getItemsByCriteria = getItemsByCriteria;
}
