/* CENTRAL ITEM DEFINITIONS
 * Single source of truth for static item values + runtime item instance resolution.
 */

const ITEM_STATIC_FIELDS = Object.freeze([
    // Identity / presentation
    "id", "name", "type", "icon", "sprite", "desc", "rarity", "inShop", "req",
    // Economy
    "price", "dropChance", "dropSources",
    // Legacy combat / bonus stats
    "damage", "damageFlat", "damageMin", "damageMax", "defense", "attackSpeed", "attackIntervalMs", "attackCooldownMs", "speedBonus", "xpBonus", "evasion",
    "life", "mana", "allResist", "lifeLeech", "damageBonus", "magicBonus",
    "magicReduction", "physicalBonus", "physicalReduction", "spectralDefense",
    "accuracy", "piercing", "armorIgnore", "fireBonus", "coldBonus", "chainBonus",
    "blockChance", "blockValue", "counterAttack", "magicAbsorption", "durability",
    "critChance", "critMulti",
    "actions", "resourceCost", "staminaCost", "manaCost",
    // PoE-style base schema
    "baseType", "weight", "baseStats", "tags", "implicitPool", "prefixSlots", "suffixSlots", "prefixPool", "suffixPool",
    // Affix runtime payload (must not be embedded in grid cells)
    "itemLevel", "implicits", "prefixes", "suffixes", "modifiers",
    // Shape / template data
    "body", "aura", "grid", "shape", "rotations", "statRanges"
]);

let _itemDefIndexCache = null;

const _DEFAULT_SLOT_BY_RARITY = Object.freeze({
    common: Object.freeze({ prefixSlots: 0, suffixSlots: 0 }),
    magic: Object.freeze({ prefixSlots: 1, suffixSlots: 1 }),
    rare: Object.freeze({ prefixSlots: 2, suffixSlots: 2 }),
    unique: Object.freeze({ prefixSlots: 1, suffixSlots: 2 }),
    legendary: Object.freeze({ prefixSlots: 2, suffixSlots: 2 })
});
const _DEFAULT_WEAPON_COOLDOWN_MS_BY_TYPE = Object.freeze({
    dagger: 2600,
    sword: 3200,
    axe: 5000,
    mace: 5200,
    spear: 3800,
    bow: 3400,
    crossbow: 5800,
    wand: 3000,
    staff: 4600,
    stave: 4600,
    weapon: 3600
});
const _WEAPON_AFFIX_TYPES = Object.freeze({
    dagger: true,
    sword: true,
    axe: true,
    mace: true,
    spear: true,
    bow: true,
    crossbow: true,
    wand: true,
    staff: true,
    stave: true,
    weapon: true
});

function _isFiniteNumber(value) {
    return typeof value === "number" && Number.isFinite(value);
}

function _normalizeModifier(rawModifier) {
    if (!rawModifier || typeof rawModifier !== "object") return null;
    if (typeof rawModifier.statPath !== "string" || !rawModifier.statPath) return null;
    if (rawModifier.type !== "flat" && rawModifier.type !== "percent") return null;
    if (!_isFiniteNumber(rawModifier.value)) return null;
    return {
        statPath: rawModifier.statPath,
        type: rawModifier.type,
        value: rawModifier.value
    };
}

function _deepClone(data) {
    if (!data || typeof data !== "object") return data;
    try {
        return JSON.parse(JSON.stringify(data));
    } catch (err) {
        if (Array.isArray(data)) return data.slice();
        return { ...data };
    }
}

function _countBodyCellsFromGrid(grid) {
    if (!Array.isArray(grid)) return 0;
    let count = 0;
    grid.forEach((row) => {
        if (!Array.isArray(row)) return;
        row.forEach((cell) => {
            if (cell === 1 || cell === "B" || cell === "AB" || (typeof cell === "string" && cell.includes("B"))) {
                count += 1;
            }
        });
    });
    return count;
}

function _countBodyCellsFromItem(item) {
    if (!item || typeof item !== "object") return 1;
    if (Array.isArray(item.body)) {
        return Math.max(1, _countBodyCellsFromGrid(item.body));
    }
    if (item.rotations && item.rotations[0] && Array.isArray(item.rotations[0].grid)) {
        return Math.max(1, _countBodyCellsFromGrid(item.rotations[0].grid));
    }
    if (Array.isArray(item.grid)) {
        return Math.max(1, _countBodyCellsFromGrid(item.grid));
    }
    return 1;
}

function _collectItemArrays() {
    const arrays = [];
    if (typeof ITEMS_ALL_DEFS !== "undefined" && Array.isArray(ITEMS_ALL_DEFS)) {
        arrays.push(ITEMS_ALL_DEFS);
        return arrays;
    }
    if (typeof ITEMS_WEAPONS_ALL !== "undefined") arrays.push(ITEMS_WEAPONS_ALL);
    if (typeof ITEMS_OFFHANDS_ALL !== "undefined") arrays.push(ITEMS_OFFHANDS_ALL);
    if (typeof ITEMS_ARMOR_ALL !== "undefined") arrays.push(ITEMS_ARMOR_ALL);
    if (typeof ITEMS_ACCESSORIES_ALL !== "undefined") arrays.push(ITEMS_ACCESSORIES_ALL);
    if (typeof ITEMS_ENHANCEMENTS_ALL !== "undefined") arrays.push(ITEMS_ENHANCEMENTS_ALL);
    if (typeof ITEMS_CONSUMABLES_ALL !== "undefined") arrays.push(ITEMS_CONSUMABLES_ALL);
    return arrays;
}

function _buildLegacyBaseStats(item) {
    if (!item || typeof item !== "object") return [];
    const output = [];
    const add = (modifier) => {
        const normalized = _normalizeModifier(modifier);
        if (normalized) output.push(normalized);
    };
    const addArmorAllTypes = (value) => {
        add({ statPath: "armor.slash", type: "flat", value });
        add({ statPath: "armor.pierce", type: "flat", value });
        add({ statPath: "armor.blunt", type: "flat", value });
    };
    const addDamagePercentAllTypes = (value) => {
        add({ statPath: "damage.slash.min", type: "percent", value });
        add({ statPath: "damage.slash.max", type: "percent", value });
        add({ statPath: "damage.pierce.min", type: "percent", value });
        add({ statPath: "damage.pierce.max", type: "percent", value });
        add({ statPath: "damage.blunt.min", type: "percent", value });
        add({ statPath: "damage.blunt.max", type: "percent", value });
    };

    const damageMin = Number(item.damageMin);
    const damageMax = Number(item.damageMax);
    if (_isFiniteNumber(damageMin) && _isFiniteNumber(damageMax)) {
        const min = Math.min(damageMin, damageMax);
        const max = Math.max(damageMin, damageMax);
        add({ statPath: "damage.slash.min", type: "flat", value: min });
        add({ statPath: "damage.slash.max", type: "flat", value: max });
    } else if (_isFiniteNumber(item.damageFlat)) {
        add({ statPath: "damage.slash.min", type: "flat", value: item.damageFlat });
        add({ statPath: "damage.slash.max", type: "flat", value: item.damageFlat });
    } else if (_isFiniteNumber(item.damage)) {
        add({ statPath: "damage.slash.min", type: "flat", value: item.damage });
        add({ statPath: "damage.slash.max", type: "flat", value: item.damage });
    }
    if (_isFiniteNumber(item.speedBonus)) {
        add({ statPath: "attackSpeed", type: "percent", value: item.speedBonus - 1 });
    }
    if (_isFiniteNumber(item.xpBonus)) {
        add({ statPath: "xpGainMultiplier", type: "percent", value: item.xpBonus - 1 });
    }
    if (_isFiniteNumber(item.defense)) {
        addArmorAllTypes(item.defense);
    }
    if (_isFiniteNumber(item.allResist)) {
        addArmorAllTypes(item.allResist);
    }
    if (_isFiniteNumber(item.critChance)) {
        add({ statPath: "critChance", type: "flat", value: item.critChance });
    }
    if (_isFiniteNumber(item.life)) {
        add({ statPath: "life", type: "flat", value: item.life });
    }
    if (_isFiniteNumber(item.mana)) {
        add({ statPath: "mana", type: "flat", value: item.mana });
    }
    if (_isFiniteNumber(item.stamina)) {
        add({ statPath: "stamina", type: "flat", value: item.stamina });
    }
    if (_isFiniteNumber(item.damageBonus)) {
        addDamagePercentAllTypes(item.damageBonus - 1);
    }
    if (_isFiniteNumber(item.physicalBonus)) {
        const value = item.physicalBonus - 1;
        add({ statPath: "damage.slash.min", type: "percent", value });
        add({ statPath: "damage.slash.max", type: "percent", value });
        add({ statPath: "damage.blunt.min", type: "percent", value });
        add({ statPath: "damage.blunt.max", type: "percent", value });
    }

    // Keep compatibility with defs that already declare a generic modifier array.
    if (output.length === 0 && Array.isArray(item.modifiers)) {
        item.modifiers.forEach((modifier) => add(modifier));
    }

    return output;
}

function _normalizeBaseStats(baseStats, item) {
    if (Array.isArray(baseStats)) {
        return baseStats
            .map(_normalizeModifier)
            .filter(Boolean);
    }
    if (baseStats && typeof baseStats === "object") {
        const output = [];
        Object.keys(baseStats).forEach((statPath) => {
            const descriptor = baseStats[statPath];
            if (descriptor && typeof descriptor === "object") {
                const normalized = _normalizeModifier({
                    statPath,
                    type: descriptor.type,
                    value: descriptor.value
                });
                if (normalized) output.push(normalized);
            }
        });
        return output;
    }
    return _buildLegacyBaseStats(item);
}

function _normalizeAffixPool(pool) {
    if (!Array.isArray(pool)) return [];
    return pool
        .map((entry) => {
            if (typeof entry === "string" && entry) {
                return { affixId: entry, weight: 1 };
            }
            if (!entry || typeof entry !== "object" || !entry.affixId) return null;
            return {
                affixId: entry.affixId,
                weight: _isFiniteNumber(entry.weight) && entry.weight > 0 ? entry.weight : 1
            };
        })
        .filter(Boolean);
}

function _normalizeSlotValue(rawValue, rarity, slotKey) {
    if (_isFiniteNumber(rawValue)) return Math.max(0, Math.floor(rawValue));
    const byRarity = _DEFAULT_SLOT_BY_RARITY[rarity] || _DEFAULT_SLOT_BY_RARITY.common;
    return byRarity[slotKey];
}

function _resolveItemTypeForCooldown(item) {
    if (!item || typeof item !== "object") return "misc";
    if (typeof item.baseType === "string" && item.baseType) return item.baseType;
    if (typeof item.type === "string" && item.type) return item.type;
    return "misc";
}

function _resolveAffixCategoryForItem(item) {
    if (!item || typeof item !== "object") return null;
    const tags = Array.isArray(item.tags) ? item.tags : [];
    if (tags.includes("weapon")) return "weapon";
    if (tags.includes("armor")) return "armor";
    if (tags.includes("jewelry")) return "jewelry";
    if (tags.includes("accessory")) return "jewelry";
    const baseType = _resolveItemTypeForCooldown(item);
    if (_WEAPON_AFFIX_TYPES[baseType]) return "weapon";
    if (baseType === "armor") return "armor";
    if (baseType === "accessory" || baseType === "jewelry") return "jewelry";
    return null;
}

function _resolveCategoryAffixPool(item, group) {
    const category = _resolveAffixCategoryForItem(item);
    if (!category || !group || typeof getAffixPoolByCategoryGroup !== "function") return [];
    return _normalizeAffixPool(getAffixPoolByCategoryGroup(category, group));
}

function _resolveAttackCooldownMs(item) {
    if (!item || typeof item !== "object") return null;
    const explicitCooldown = Number(item.attackCooldownMs);
    if (_isFiniteNumber(explicitCooldown) && explicitCooldown > 0) return explicitCooldown;
    const explicitInterval = Number(item.attackIntervalMs);
    if (_isFiniteNumber(explicitInterval) && explicitInterval > 0) return explicitInterval;
    const byType = _DEFAULT_WEAPON_COOLDOWN_MS_BY_TYPE[_resolveItemTypeForCooldown(item)];
    if (_isFiniteNumber(byType) && byType > 0) return byType;
    return null;
}

function _normalizeItemDefinition(rawItem) {
    if (!rawItem || typeof rawItem !== "object") return null;
    const item = { ...rawItem };
    item.baseType = item.baseType || item.type || "misc";
    const resolvedCooldown = _resolveAttackCooldownMs(item);
    if (_isFiniteNumber(resolvedCooldown) && resolvedCooldown > 0) {
        item.attackCooldownMs = resolvedCooldown;
    }
    if (!_isFiniteNumber(item.attackIntervalMs) && _isFiniteNumber(item.attackCooldownMs) && item.attackCooldownMs > 0) {
        item.attackIntervalMs = item.attackCooldownMs;
    }
    item.weight = _isFiniteNumber(item.weight) ? Math.max(0, item.weight) : _countBodyCellsFromItem(item);
    item.baseStats = _normalizeBaseStats(item.baseStats, item);
    item.prefixSlots = _normalizeSlotValue(item.prefixSlots, item.rarity, "prefixSlots");
    item.suffixSlots = _normalizeSlotValue(item.suffixSlots, item.rarity, "suffixSlots");
    const explicitImplicitPool = _normalizeAffixPool(item.implicitPool);
    const explicitPrefixPool = _normalizeAffixPool(item.prefixPool);
    const explicitSuffixPool = _normalizeAffixPool(item.suffixPool);
    item.implicitPool = explicitImplicitPool.length > 0 ? explicitImplicitPool : _resolveCategoryAffixPool(item, "implicit");
    item.prefixPool = explicitPrefixPool.length > 0 ? explicitPrefixPool : _resolveCategoryAffixPool(item, "prefix");
    item.suffixPool = explicitSuffixPool.length > 0 ? explicitSuffixPool : _resolveCategoryAffixPool(item, "suffix");
    return item;
}

function _buildItemDefIndex() {
    const index = {};
    _collectItemArrays().forEach((arr) => {
        if (!Array.isArray(arr)) return;
        arr.forEach((item) => {
            if (!item || !item.id) return;
            if (!index[item.id]) {
                const normalized = _normalizeItemDefinition(item);
                if (normalized) index[item.id] = normalized;
            }
        });
    });

    // Prefer registry entries when available (after initializeItemRegistry).
    if (typeof ALL_ITEMS !== "undefined" && ALL_ITEMS && typeof ALL_ITEMS === "object") {
        Object.keys(ALL_ITEMS).forEach((id) => {
            const normalized = _normalizeItemDefinition(ALL_ITEMS[id]);
            if (normalized) index[id] = normalized;
        });
    }

    return index;
}

function refreshItemDefIndex() {
    _itemDefIndexCache = _buildItemDefIndex();
    return _itemDefIndexCache;
}

function getAllItemDefs() {
    if (!_itemDefIndexCache) {
        refreshItemDefIndex();
    }
    return _itemDefIndexCache;
}

function getItemDefById(itemId) {
    if (!itemId) return null;
    const defs = getAllItemDefs();
    if (defs && defs[itemId]) return defs[itemId];

    // Final fallback for compatibility with existing call sites.
    if (typeof getItemById === "function") {
        const legacy = getItemById(itemId);
        return _normalizeItemDefinition(legacy);
    }
    return null;
}

function ensureItemInstanceStore(gameData) {
    if (!gameData || typeof gameData !== "object") return {};
    if (!gameData.itemInstances || typeof gameData.itemInstances !== "object" || Array.isArray(gameData.itemInstances)) {
        gameData.itemInstances = {};
    }
    return gameData.itemInstances;
}

function _sanitizeAffixRollEntry(entry) {
    if (!entry || typeof entry !== "object") return null;
    if (typeof entry.affixId !== "string" || !entry.affixId) return null;
    if (!_isFiniteNumber(entry.roll)) return null;
    const tier = _isFiniteNumber(entry.tier) ? Math.max(1, Math.floor(entry.tier)) : 1;
    return {
        affixId: entry.affixId,
        tier,
        roll: entry.roll
    };
}

function sanitizeItemInstanceRecord(record) {
    if (!record || typeof record !== "object" || Array.isArray(record)) return null;
    const itemId = record.itemId || record.baseId;
    if (typeof itemId !== "string" || !itemId) return null;
    const itemLevel = _isFiniteNumber(record.itemLevel) ? Math.max(1, Math.floor(record.itemLevel)) : 1;
    const sanitizeList = (list) => Array.isArray(list) ? list.map(_sanitizeAffixRollEntry).filter(Boolean) : [];
    return {
        itemId,
        itemLevel,
        implicits: sanitizeList(record.implicits),
        prefixes: sanitizeList(record.prefixes),
        suffixes: sanitizeList(record.suffixes)
    };
}

function sanitizeItemInstanceStore(store) {
    if (!store || typeof store !== "object" || Array.isArray(store)) return {};
    const sanitized = {};
    Object.keys(store).forEach((instanceId) => {
        const record = sanitizeItemInstanceRecord(store[instanceId]);
        if (record) sanitized[instanceId] = record;
    });
    return sanitized;
}

function getItemInstanceData(gameData, instanceId) {
    if (!gameData || typeof gameData !== "object" || !instanceId) return null;
    const store = ensureItemInstanceStore(gameData);
    return store[instanceId] || null;
}

function setItemInstanceData(gameData, instanceId, record) {
    if (!gameData || typeof gameData !== "object" || !instanceId) return null;
    const store = ensureItemInstanceStore(gameData);
    const sanitized = sanitizeItemInstanceRecord(record);
    if (!sanitized) return null;
    store[instanceId] = sanitized;
    return store[instanceId];
}

function removeItemInstanceData(gameData, instanceId) {
    if (!gameData || typeof gameData !== "object" || !instanceId) return false;
    const store = ensureItemInstanceStore(gameData);
    if (Object.prototype.hasOwnProperty.call(store, instanceId)) {
        delete store[instanceId];
        return true;
    }
    return false;
}

function registerItemInstance(gameData, instanceId, baseItemId, itemLevel, options) {
    if (!gameData || typeof gameData !== "object" || !instanceId || !baseItemId) return null;
    const store = ensureItemInstanceStore(gameData);
    if (store[instanceId] && store[instanceId].itemId === baseItemId) {
        const rawExisting = store[instanceId];
        const existing = sanitizeItemInstanceRecord(store[instanceId]);
        if (existing) {
            if (!_isFiniteNumber(rawExisting && rawExisting.itemLevel) || rawExisting.itemLevel < 1) {
                existing.itemLevel = Math.max(1, Math.floor(_isFiniteNumber(itemLevel) ? itemLevel : 1));
                store[instanceId] = existing;
            }
            return store[instanceId];
        }
    }

    let generated = null;
    if (typeof generateItem === "function") {
        generated = generateItem(baseItemId, itemLevel, options);
    }
    if (!generated) {
        generated = {
            itemId: baseItemId,
            itemLevel: Math.max(1, Math.floor(_isFiniteNumber(itemLevel) ? itemLevel : 1)),
            implicits: [],
            prefixes: [],
            suffixes: []
        };
    }
    return setItemInstanceData(gameData, instanceId, generated);
}

function _inferInstanceItemLevel(gameData, cell) {
    const charLevel = gameData &&
        gameData.character &&
        gameData.character.base &&
        _isFiniteNumber(gameData.character.base.level)
        ? gameData.character.base.level
        : null;
    const fallback = _isFiniteNumber(charLevel)
        ? charLevel
        : (_isFiniteNumber(gameData && gameData.level) ? gameData.level : 1);
    const candidates = [
        cell && cell.itemLevel,
        cell && cell.level,
        fallback
    ];
    for (let i = 0; i < candidates.length; i++) {
        const value = candidates[i];
        if (_isFiniteNumber(value)) return Math.max(1, Math.floor(value));
    }
    return 1;
}

function _forEachTrackedGrid(data, visitor) {
    if (!data || typeof data !== "object" || typeof visitor !== "function") return;
    ["bank", "farmGrid", "pveGrid", "pvpGrid", "sortGrid"].forEach((gridKey) => {
        const grid = data[gridKey];
        if (!grid || typeof grid !== "object") return;
        visitor(grid, gridKey);
    });
    if (Array.isArray(data.bankPages)) {
        data.bankPages.forEach((pageGrid, pageIndex) => {
            if (!pageGrid || typeof pageGrid !== "object") return;
            visitor(pageGrid, "bankPages", pageIndex);
        });
    }
    if (data.battlefield && typeof data.battlefield === "object" && data.battlefield.pages && typeof data.battlefield.pages === "object") {
        Object.keys(data.battlefield.pages).forEach((pageKey) => {
            const pageGrid = data.battlefield.pages[pageKey];
            if (!pageGrid || typeof pageGrid !== "object") return;
            visitor(pageGrid, "battlefieldPages", pageKey);
        });
    }
}

function ensureItemInstanceIntegrity(gameData) {
    if (!gameData || typeof gameData !== "object") return {};
    const store = ensureItemInstanceStore(gameData);

    _forEachTrackedGrid(gameData, (grid) => {
        Object.keys(grid).forEach((slotKey) => {
            const cell = grid[slotKey];
            if (!cell || typeof cell !== "object" || !cell.root || !cell.itemId || !cell.instanceId) return;

            const rawExisting = store[cell.instanceId];
            const existing = sanitizeItemInstanceRecord(rawExisting);
            const inferredLevel = _inferInstanceItemLevel(gameData, cell);
            if (!existing) {
                store[cell.instanceId] = {
                    itemId: cell.itemId,
                    itemLevel: inferredLevel,
                    implicits: [],
                    prefixes: [],
                    suffixes: []
                };
                return;
            }

            store[cell.instanceId] = {
                itemId: cell.itemId,
                itemLevel: _isFiniteNumber(rawExisting && rawExisting.itemLevel) && rawExisting.itemLevel >= 1
                    ? Math.floor(rawExisting.itemLevel)
                    : inferredLevel,
                implicits: Array.isArray(existing.implicits) ? existing.implicits : [],
                prefixes: Array.isArray(existing.prefixes) ? existing.prefixes : [],
                suffixes: Array.isArray(existing.suffixes) ? existing.suffixes : []
            };
        });
    });

    Object.keys(store).forEach((instanceId) => {
        const sanitized = sanitizeItemInstanceRecord(store[instanceId]);
        if (!sanitized) {
            delete store[instanceId];
            return;
        }
        if (!_isFiniteNumber(sanitized.itemLevel) || sanitized.itemLevel < 1) {
            sanitized.itemLevel = 1;
        }
        store[instanceId] = sanitized;
    });

    return store;
}

function _affixRollToModifier(rollEntry) {
    const sanitizedRoll = _sanitizeAffixRollEntry(rollEntry);
    if (!sanitizedRoll || typeof getAffixDefById !== "function") return null;
    const affixDef = getAffixDefById(sanitizedRoll.affixId);
    if (!affixDef) return null;
    return _normalizeModifier({
        statPath: affixDef.statPath,
        type: affixDef.type,
        value: sanitizedRoll.roll
    });
}

function _buildModifiersFromInstance(baseItem, instanceData) {
    const modifiers = [];
    if (baseItem && Array.isArray(baseItem.baseStats)) {
        baseItem.baseStats.forEach((modifier) => {
            const normalized = _normalizeModifier(modifier);
            if (normalized) modifiers.push(normalized);
        });
    }

    const pushAffixList = (list) => {
        if (!Array.isArray(list)) return;
        list.forEach((rollEntry) => {
            const mod = _affixRollToModifier(rollEntry);
            if (mod) modifiers.push(mod);
        });
    };

    if (instanceData) {
        pushAffixList(instanceData.implicits);
        pushAffixList(instanceData.prefixes);
        pushAffixList(instanceData.suffixes);
    }

    // Save compatibility fallback:
    // old items can still carry generic `modifiers` arrays.
    if (modifiers.length === 0 && baseItem && Array.isArray(baseItem.modifiers)) {
        baseItem.modifiers.forEach((modifier) => {
            const normalized = _normalizeModifier(modifier);
            if (normalized) modifiers.push(normalized);
        });
    }

    return modifiers;
}

function resolveRuntimeItemFromCell(gameData, cell) {
    if (!cell || typeof cell !== "object" || !cell.itemId) return null;
    const baseItem = getItemDefById(cell.itemId);
    if (!baseItem) return null;

    const instanceData = cell.instanceId ? getItemInstanceData(gameData, cell.instanceId) : null;
    const runtimeModifiers = _buildModifiersFromInstance(baseItem, instanceData);
    const runtimeItem = {
        ...baseItem,
        modifiers: runtimeModifiers
    };

    if (instanceData) {
        runtimeItem.itemLevel = instanceData.itemLevel;
        runtimeItem.implicits = instanceData.implicits;
        runtimeItem.prefixes = instanceData.prefixes;
        runtimeItem.suffixes = instanceData.suffixes;
    }

    return runtimeItem;
}

function getRuntimeItemDefinition(gameData, itemId, cellOrInstanceId) {
    if (cellOrInstanceId && typeof cellOrInstanceId === "object") {
        return resolveRuntimeItemFromCell(gameData, cellOrInstanceId);
    }
    if (typeof cellOrInstanceId === "string" && cellOrInstanceId) {
        return resolveRuntimeItemFromCell(gameData, { itemId, instanceId: cellOrInstanceId });
    }
    return getItemDefById(itemId);
}

function _sanitizeGridCell(cell) {
    if (!cell || typeof cell !== "object" || Array.isArray(cell)) return null;

    const sanitized = { ...cell };
    const inferredItemId = sanitized.itemId || sanitized.baseId || (sanitized.item && sanitized.item.id) || null;
    if (inferredItemId) sanitized.itemId = inferredItemId;

    // Remove embedded/duplicated static template payload from instance cells.
    delete sanitized.item;
    delete sanitized.baseId;
    ITEM_STATIC_FIELDS.forEach((field) => {
        if (field === "itemId" || field === "instanceId" || field === "rotationIndex" || field === "root") return;
        if (Object.prototype.hasOwnProperty.call(sanitized, field)) {
            delete sanitized[field];
        }
    });

    return sanitized.itemId ? sanitized : null;
}

function sanitizeGridForSave(grid) {
    if (!grid || typeof grid !== "object") return {};
    const output = {};
    Object.keys(grid).forEach((slotKey) => {
        const sanitizedCell = _sanitizeGridCell(grid[slotKey]);
        if (sanitizedCell) {
            output[slotKey] = sanitizedCell;
        }
    });
    return output;
}

function _collectGridInstanceIds(data) {
    const ids = new Set();
    _forEachTrackedGrid(data, (grid) => {
        Object.keys(grid).forEach((slotKey) => {
            const cell = grid[slotKey];
            if (!cell || typeof cell !== "object" || !cell.instanceId) return;
            ids.add(cell.instanceId);
        });
    });
    return ids;
}

function sanitizeSaveDataForPersistence(data) {
    const cloned = _deepClone(data);
    if (!cloned || typeof cloned !== "object" || Array.isArray(cloned)) return {};

    ["bank", "farmGrid", "pveGrid", "pvpGrid", "sortGrid"].forEach((gridKey) => {
        if (cloned[gridKey] && typeof cloned[gridKey] === "object") {
            cloned[gridKey] = sanitizeGridForSave(cloned[gridKey]);
        }
    });
    if (Array.isArray(cloned.bankPages)) {
        cloned.bankPages = cloned.bankPages.map((pageGrid) => (
            pageGrid && typeof pageGrid === "object" ? sanitizeGridForSave(pageGrid) : {}
        ));
        const activePage = cloned.bankMeta && Number.isInteger(cloned.bankMeta.activePage)
            ? cloned.bankMeta.activePage
            : 0;
        if (cloned.bankPages[activePage]) {
            cloned.bank = cloned.bankPages[activePage];
        }
    }
    if (cloned.battlefield && typeof cloned.battlefield === "object" && cloned.battlefield.pages && typeof cloned.battlefield.pages === "object") {
        const sanitizedPages = {};
        Object.keys(cloned.battlefield.pages).forEach((pageKey) => {
            const pageGrid = cloned.battlefield.pages[pageKey];
            sanitizedPages[pageKey] = (pageGrid && typeof pageGrid === "object")
                ? sanitizeGridForSave(pageGrid)
                : {};
        });
        cloned.battlefield.pages = sanitizedPages;
    }

    const activeIds = _collectGridInstanceIds(cloned);
    const sanitizedStore = sanitizeItemInstanceStore(cloned.itemInstances);
    const prunedStore = {};
    activeIds.forEach((instanceId) => {
        if (sanitizedStore[instanceId]) {
            prunedStore[instanceId] = sanitizedStore[instanceId];
        }
    });
    cloned.itemInstances = prunedStore;

    return cloned;
}

// Loading sanitizer currently mirrors persistence sanitizer.
// Keeping a dedicated function allows targeted load-time hotfixes later.
function sanitizeLoadedSaveData(data) {
    const sanitized = sanitizeSaveDataForPersistence(data);
    if (!sanitized.itemInstances) sanitized.itemInstances = {};
    ensureItemInstanceIntegrity(sanitized);
    return sanitized;
}

if (typeof window !== "undefined") {
    window.ITEM_STATIC_FIELDS = ITEM_STATIC_FIELDS;
    window.getAllItemDefs = getAllItemDefs;
    window.getItemDefById = getItemDefById;
    window.refreshItemDefIndex = refreshItemDefIndex;
    window.sanitizeGridForSave = sanitizeGridForSave;
    window.sanitizeSaveDataForPersistence = sanitizeSaveDataForPersistence;
    window.sanitizeLoadedSaveData = sanitizeLoadedSaveData;

    window.ensureItemInstanceStore = ensureItemInstanceStore;
    window.sanitizeItemInstanceRecord = sanitizeItemInstanceRecord;
    window.sanitizeItemInstanceStore = sanitizeItemInstanceStore;
    window.getItemInstanceData = getItemInstanceData;
    window.setItemInstanceData = setItemInstanceData;
    window.removeItemInstanceData = removeItemInstanceData;
    window.registerItemInstance = registerItemInstance;
    window.ensureItemInstanceIntegrity = ensureItemInstanceIntegrity;
    window.resolveRuntimeItemFromCell = resolveRuntimeItemFromCell;
    window.getRuntimeItemDefinition = getRuntimeItemDefinition;
}

if (typeof module !== "undefined" && module.exports) {
    module.exports = {
        ITEM_STATIC_FIELDS,
        getAllItemDefs,
        getItemDefById,
        refreshItemDefIndex,
        sanitizeGridForSave,
        sanitizeSaveDataForPersistence,
        sanitizeLoadedSaveData,
        ensureItemInstanceStore,
        sanitizeItemInstanceRecord,
        sanitizeItemInstanceStore,
        getItemInstanceData,
        setItemInstanceData,
        removeItemInstanceData,
        registerItemInstance,
        ensureItemInstanceIntegrity,
        resolveRuntimeItemFromCell,
        getRuntimeItemDefinition
    };
}
