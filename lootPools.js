/* LOOT POOLS
 * Data-first loot definitions with a small roll helper surface.
 */

const LOOT_POOL_DEFAULTS = Object.freeze({
    rollsMin: 1,
    rollsMax: 1,
    perRollChance: 0.15
});

const LOOT_POOLS = Object.freeze({
    coast_common: Object.freeze({
        rollsMin: 1,
        rollsMax: 1,
        perRollChance: 0.25,
        entries: Object.freeze([
            Object.freeze({ itemId: "sword_new_1", weight: 5 }),
            Object.freeze({ itemId: "shield_new_1", weight: 4 }),
            Object.freeze({ itemId: "armor_new_1", weight: 4 }),
            Object.freeze({ itemId: "acc_new_ring_1", weight: 3 })
        ])
    }),
    coast_uncommon: Object.freeze({
        rollsMin: 1,
        rollsMax: 1,
        perRollChance: 0.12,
        entries: Object.freeze([
            Object.freeze({ itemId: "sword_new_2", weight: 3 }),
            Object.freeze({ itemId: "shield_new_2", weight: 3 }),
            Object.freeze({ itemId: "armor_new_2", weight: 2 }),
            Object.freeze({ itemId: "acc_new_ring_2", weight: 2 })
        ])
    })
});

function _lootNum(value, fallback) {
    return Number.isFinite(value) ? value : fallback;
}

function _clampLootChance(value, fallback) {
    const raw = _lootNum(value, fallback);
    return Math.max(0, Math.min(1, raw));
}

function _resolveLootRollCount(pool) {
    const minRolls = Math.max(0, Math.floor(_lootNum(pool && pool.rollsMin, LOOT_POOL_DEFAULTS.rollsMin)));
    const maxRollsRaw = Math.max(0, Math.floor(_lootNum(pool && pool.rollsMax, minRolls)));
    const maxRolls = Math.max(minRolls, maxRollsRaw);
    if (maxRolls <= minRolls) return minRolls;
    const spread = maxRolls - minRolls + 1;
    return minRolls + Math.floor(Math.random() * spread);
}

function _selectWeightedLootEntry(entries) {
    if (!Array.isArray(entries) || entries.length === 0) return null;
    let total = 0;
    const weighted = entries
        .map((entry) => {
            const weight = Math.max(0, _lootNum(entry && entry.weight, 1));
            if (weight <= 0) return null;
            total += weight;
            return { entry, weight };
        })
        .filter(Boolean);
    if (total <= 0 || weighted.length === 0) return null;

    let roll = Math.random() * total;
    for (let i = 0; i < weighted.length; i++) {
        roll -= weighted[i].weight;
        if (roll <= 0) {
            return weighted[i].entry;
        }
    }
    return weighted[weighted.length - 1].entry;
}

function _resolveLootEntryItemCandidates(entry) {
    if (!entry || typeof entry !== "object") return [];
    if (typeof entry.itemId === "string" && entry.itemId) return [entry.itemId];

    const baseType = typeof entry.baseType === "string" ? entry.baseType : null;
    const tag = typeof entry.tag === "string" ? entry.tag : null;
    if (!baseType && !tag) return [];
    if (typeof getAllItemDefs !== "function") return [];

    const defs = getAllItemDefs();
    if (!defs || typeof defs !== "object") return [];

    return Object.keys(defs).filter((itemId) => {
        const def = defs[itemId];
        if (!def || typeof def !== "object") return false;
        if (baseType) {
            const defBaseType = typeof def.baseType === "string" ? def.baseType : def.type;
            if (defBaseType !== baseType) return false;
        }
        if (tag) {
            const tagList = Array.isArray(def.tags) ? def.tags : [];
            if (!tagList.includes(tag)) return false;
        }
        return true;
    });
}

function getLootPoolById(poolId) {
    if (typeof poolId !== "string" || !poolId) return null;
    return LOOT_POOLS[poolId] || null;
}

function _rollItemsFromPool(poolId, pool, itemLevel) {
    if (!pool || typeof pool !== "object") return [];
    const entries = Array.isArray(pool.entries) ? pool.entries : [];
    if (entries.length === 0) return [];

    const rollCount = _resolveLootRollCount(pool);
    const perRollChance = _clampLootChance(pool.perRollChance, LOOT_POOL_DEFAULTS.perRollChance);
    const drops = [];

    for (let i = 0; i < rollCount; i++) {
        if (Math.random() > perRollChance) continue;
        const pickedEntry = _selectWeightedLootEntry(entries);
        if (!pickedEntry) continue;
        const candidates = _resolveLootEntryItemCandidates(pickedEntry);
        if (!candidates.length) continue;
        const chosenIndex = Math.floor(Math.random() * candidates.length);
        const itemId = candidates[chosenIndex];
        if (!itemId) continue;
        drops.push({
            itemId,
            itemLevel,
            sourcePoolId: poolId
        });
    }

    return drops;
}

function _buildLegacyDropTablePools(monster) {
    const table = Array.isArray(monster && monster.dropTable) ? monster.dropTable : [];
    return table
        .map((itemId, idx) => {
            if (typeof itemId !== "string" || !itemId) return null;
            return {
                id: `legacy_drop_${monster && monster.id ? monster.id : "monster"}_${idx}`,
                pool: {
                    rollsMin: 1,
                    rollsMax: 1,
                    perRollChance: LOOT_POOL_DEFAULTS.perRollChance,
                    entries: [{ itemId, weight: 1 }]
                }
            };
        })
        .filter(Boolean);
}

function rollLootForMonster(monster, options) {
    if (!monster || typeof monster !== "object") return [];
    const opts = options && typeof options === "object" ? options : {};
    const itemLevel = Math.max(1, Math.floor(_lootNum(opts.itemLevel, monster.level || 1)));

    const drops = [];
    const poolIds = Array.isArray(monster.lootPools)
        ? monster.lootPools.filter((id) => typeof id === "string" && id)
        : [];

    if (poolIds.length > 0) {
        poolIds.forEach((poolId) => {
            const pool = getLootPoolById(poolId);
            if (!pool) return;
            const rolled = _rollItemsFromPool(poolId, pool, itemLevel);
            if (rolled.length) drops.push(...rolled);
        });
        return drops;
    }

    const legacyPools = _buildLegacyDropTablePools(monster);
    legacyPools.forEach((entry) => {
        const rolled = _rollItemsFromPool(entry.id, entry.pool, itemLevel);
        if (rolled.length) drops.push(...rolled);
    });
    return drops;
}

if (typeof window !== "undefined") {
    window.LOOT_POOL_DEFAULTS = LOOT_POOL_DEFAULTS;
    window.LOOT_POOLS = LOOT_POOLS;
    window.getLootPoolById = getLootPoolById;
    window.rollLootForMonster = rollLootForMonster;
}
