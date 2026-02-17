/* CENTRAL ITEM REGISTRY
 * Consumes aggregated item defs from item_index.js and builds lookup APIs.
 */

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
                if (grid[rr][cc] === "0") {
                    grid[rr][cc] = "B";
                } else if (grid[rr][cc] === "A") {
                    grid[rr][cc] = "AB";
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
                if (grid[rr][cc] === "0") {
                    grid[rr][cc] = "A";
                } else if (grid[rr][cc] === "B") {
                    grid[rr][cc] = "AB";
                }
            }
        }
    }

    return grid;
}

function initializeItemRegistry() {
    Object.keys(ALL_ITEMS).forEach((key) => delete ALL_ITEMS[key]);

    const source = (typeof ITEMS_ALL_DEFS !== "undefined" && Array.isArray(ITEMS_ALL_DEFS))
        ? ITEMS_ALL_DEFS
        : [];

    source.forEach((item) => {
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
    window.ALL_ITEMS = ALL_ITEMS;
    window.initializeItemRegistry = initializeItemRegistry;
    window.getItemById = getItemById;
    window.getItemsByType = getItemsByType;
    window.getItemsByRarity = getItemsByRarity;
    window.getShopItems = getShopItems;
    window.getItemsByCriteria = getItemsByCriteria;
}