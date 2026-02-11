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
 * Build a single combined grid with flags: B=Body, A=Aura, 0=Empty
 * Future: Bs=Body with socket
 * @param {array} body - Body matrix (1 = solid)
 * @param {array} aura - Aura matrix (1 = active)
 * @returns {array} Single grid with string flags
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
                // Mark cell with 'B' (or upgrade 'A' to 'AB' if aura also present)
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
                // Mark cell with 'A' (or upgrade 'B' to 'AB' if body also present)
                if (grid[rr][cc] === '0') {
                    grid[rr][cc] = 'A';
                } else if (grid[rr][cc] === 'B') {
                    grid[rr][cc] = 'AB';
                }
                // If already 'AB', leave it as is
            }
        }
    }
    return grid;
}

function getItemRotationGrid(item, rotationIndex) {
    if (!item) return null;
    const idx = (typeof rotationIndex === 'number') ? rotationIndex : 0;
    console.log('  📋 getItemRotationGrid: item=' + (item.id || '?') + ' idx=' + idx + ' has rotations=' + (item.rotations ? 'yes' : 'no'));
    if (idx === 0 && Array.isArray(item.grid)) {
        console.log('    ✅ Found item.grid (idx=0)');
        return item.grid;
    }
    if (item.rotations && item.rotations[idx]) {
        const rot = item.rotations[idx];
        console.log('    Found item.rotations[' + idx + ']:', typeof rot, 'has grid=' + (rot && Array.isArray(rot.grid)));
        if (Array.isArray(rot)) {
            console.log('    ✅ rot is array');
            return rot;
        }
        if (rot && Array.isArray(rot.grid)) {
            console.log('    ✅ rot.grid exists, returning it');
            return rot.grid;
        }
        if (rot && (rot.body || rot.aura)) {
            console.log('    ✅ rot has body/aura, building grid');
            return _buildCombinedGrid(rot.body, rot.aura);
        }
    }
    if (item.body || item.aura) {
        console.log('    ✅ Using legacy body/aura');
        return _buildCombinedGrid(item.body || [[1]], item.aura || null);
    }
    console.log('    ❌ FAILED TO GET GRID');
    return null;
}

function getItemBodyMatrix(item, rotationIndex) {
    const grid = getItemRotationGrid(item, rotationIndex);
    if (grid) {
        const bounds = getItemBodyBounds(item, rotationIndex);
        const rows = bounds.maxR - bounds.minR + 1;
        const cols = bounds.maxC - bounds.minC + 1;
        const body = Array.from({ length: rows }, () => Array(cols).fill(0));
        for (let r = bounds.minR; r <= bounds.maxR; r++) {
            for (let c = bounds.minC; c <= bounds.maxC; c++) {
                const cell = grid[r] && grid[r][c];
                // B or AB both contain body part
                if (typeof cell === 'string' && (cell === 'B' || cell === 'AB' || cell.includes('B'))) {
                    body[r - bounds.minR][c - bounds.minC] = 1;
                }
            }
        }
        return body;
    }
    if (item && item.body) return item.body;
    if (item && item.rotations && item.rotations[rotationIndex] && item.rotations[rotationIndex].body) {
        return item.rotations[rotationIndex].body;
    }
    return [[1]];
}

function getItemAuraMatrix(item, rotationIndex) {
    const grid = getItemRotationGrid(item, rotationIndex);
    if (grid) {
        // Extract aura cells (A or AB) from the combined grid
        return grid.map(row => row.map(cell => {
            if (typeof cell === 'string' && (cell === 'A' || cell === 'AB' || cell.includes('A'))) {
                return 1;
            }
            return 0;
        }));
    }
    if (item && item.aura) return item.aura;
    if (item && item.rotations && item.rotations[rotationIndex] && item.rotations[rotationIndex].aura) {
        return item.rotations[rotationIndex].aura;
    }
    return null;
}

function getItemBodyBounds(item, rotationIndex) {
    const grid = getItemRotationGrid(item, rotationIndex);
    if (!grid) return { minR: 0, minC: 0, maxR: 0, maxC: 0 };
    let minR = Infinity;
    let minC = Infinity;
    let maxR = -1;
    let maxC = -1;
    for (let r = 0; r < grid.length; r++) {
        for (let c = 0; c < grid[r].length; c++) {
            const cell = grid[r][c];
            // B or AB both contain body part
            if (typeof cell === 'string' && (cell === 'B' || cell === 'AB' || cell.includes('B'))) {
                if (r < minR) minR = r;
                if (c < minC) minC = c;
                if (r > maxR) maxR = r;
                if (c > maxC) maxC = c;
            }
        }
    }
    if (maxR === -1 || maxC === -1) return { minR: 0, minC: 0, maxR: 0, maxC: 0 };
    return { minR, minC, maxR, maxC };
}

/**
 * Gibt die Matrix (Grid-Form) eines Items zurück.
 * Priorisiert 'body', nutzt 'shape' als Fallback.
 */
function getItemShape(item) {
    if (!item) return [[1]]; // Fallback 1x1
    return getItemBodyMatrix(item, 0) || [[1]];
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