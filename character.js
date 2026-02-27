// ==========================================
// CHARACTER SYSTEM
// Unified ARPG stat model
// ==========================================

const CHARACTER_DAMAGE_TYPES = Object.freeze(["physical"]);
const CHARACTER_MODIFIER_TYPES = Object.freeze(["flat", "percent"]);
const CHARACTER_UNARMED_ATTACKS_PER_SECOND = 1000 / 5000;
const CHARACTER_DEFAULT_WEAPON_INTERVAL_MS_BY_TYPE = Object.freeze({
    dagger: 900,
    sword: 1400,
    axe: 1800,
    mace: 1900,
    spear: 1700,
    bow: 1600,
    crossbow: 2300,
    wand: 1300,
    staff: 1800,
    stave: 1800,
    weapon: 1600
});

const CHARACTER_LEVELING_CONFIG = Object.freeze({
    baseXP: 500,
    growthFactor: 1.4
});

const CHARACTER_ATTRIBUTE_EFFECTS = Object.freeze({
    str: Object.freeze([
        Object.freeze({ statPath: "weightLimit", type: "flat", valuePerPoint: 2 }),
        Object.freeze({ statPath: "life", type: "flat", valuePerPoint: 2 }),
        Object.freeze({ statPath: "physicalDamageMin", type: "percent", valuePerPoint: 0.005 }),
        Object.freeze({ statPath: "physicalDamageMax", type: "percent", valuePerPoint: 0.005 })
    ]),
    dex: Object.freeze([
        Object.freeze({ statPath: "attacksPerSecond", type: "percent", valuePerPoint: 0.004 }),
        Object.freeze({ statPath: "critChance", type: "flat", valuePerPoint: 0.001 }),
        Object.freeze({ statPath: "staminaRegen", type: "percent", valuePerPoint: 0.006 })
    ]),
    int: Object.freeze([
        Object.freeze({ statPath: "mana", type: "flat", valuePerPoint: 3 }),
        Object.freeze({ statPath: "magicScaling", type: "percent", valuePerPoint: 0.005 })
    ])
});

const LEGACY_CHARACTER_SAVE_FIELDS = Object.freeze([
    "level",
    "xp",
    "xpNextLevel",
    "hp",
    "maxHp",
    "hpRegen",
    "baseAttributes",
    "baseLife",
    "baseMana",
    "baseStamina",
    "baseDamage",
    "weightLimit",
    "currentWeight"
]);

function _isFiniteNumber(value) {
    return typeof value === "number" && Number.isFinite(value);
}

function _num(value, fallback) {
    return _isFiniteNumber(value) ? value : fallback;
}

function _round2(value) {
    return Math.round(value * 100) / 100;
}

function _clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
}

function _createEmptyDamageMap() {
    return {
        physical: { min: 0, max: 0 }
    };
}

function _createEmptyDefenseMap() {
    return {
        armour: 0,
        evasion: 0,
        auraShield: 0
    };
}

function _countBodyCells(item) {
    if (!item || !Array.isArray(item.body)) return 1;
    let count = 0;
    item.body.forEach((row) => {
        if (!Array.isArray(row)) return;
        row.forEach((cell) => {
            if (cell) count += 1;
        });
    });
    return Math.max(1, count);
}

function _calculateWeightLimitFromStrength(strength) {
    return 20 + (_num(strength, 10) * 2);
}

function calculateXpToNextLevel(level, config) {
    const cfg = config || CHARACTER_LEVELING_CONFIG;
    const safeLevel = Math.max(1, Math.floor(_num(level, 1)));
    return Math.floor(cfg.baseXP * Math.pow(cfg.growthFactor, safeLevel - 1));
}

function _normalizeDamageBucket(sourceBucket) {
    const src = sourceBucket && typeof sourceBucket === "object" ? sourceBucket : {};
    const min = Math.max(0, _num(src.min, 0));
    const max = Math.max(min, _num(src.max, min));
    return { min, max };
}

function normalizeDamageMap(sourceMap) {
    const normalized = _createEmptyDamageMap();
    const src = sourceMap && typeof sourceMap === "object" ? sourceMap : {};

    if (src.physical && typeof src.physical === "object") {
        normalized.physical = _normalizeDamageBucket(src.physical);
        return normalized;
    }

    if (_isFiniteNumber(src.min) || _isFiniteNumber(src.max)) {
        normalized.physical = _normalizeDamageBucket(src);
        return normalized;
    }

    let aggregateMin = 0;
    let aggregateMax = 0;
    Object.keys(src).forEach((key) => {
        const bucket = src[key];
        if (!bucket || typeof bucket !== "object") return;
        const min = _num(bucket.min, null);
        const max = _num(bucket.max, null);
        if (!_isFiniteNumber(min) && !_isFiniteNumber(max)) return;
        const safeMin = Math.max(0, _isFiniteNumber(min) ? min : 0);
        const safeMax = Math.max(safeMin, _isFiniteNumber(max) ? max : safeMin);
        aggregateMin += safeMin;
        aggregateMax += safeMax;
    });
    normalized.physical = {
        min: Math.max(0, aggregateMin),
        max: Math.max(Math.max(0, aggregateMin), aggregateMax)
    };
    return normalized;
}

function normalizeArmorMap(sourceMap) {
    const normalized = _createEmptyDefenseMap();
    const src = sourceMap && typeof sourceMap === "object" ? sourceMap : {};

    if (_isFiniteNumber(src.armour) || _isFiniteNumber(src.evasion) || _isFiniteNumber(src.auraShield)) {
        normalized.armour = Math.max(0, _num(src.armour, 0));
        normalized.evasion = Math.max(0, _num(src.evasion, 0));
        normalized.auraShield = Math.max(0, _num(src.auraShield, 0));
        return normalized;
    }

    let legacySum = 0;
    Object.keys(src).forEach((key) => {
        const value = _num(src[key], null);
        if (!_isFiniteNumber(value)) return;
        legacySum += Math.max(0, value);
    });
    normalized.armour = Math.max(0, legacySum);
    return normalized;
}

function createDefaultCharacterBase() {
    const baseAttributes = { str: 10, dex: 10, int: 10 };
    const baseLife = 100;
    const baseMana = 60;
    const baseStamina = 100;
    return {
        level: 1,
        xp: 0,
        baseAttributes,
        baseLife,
        baseMana,
        baseStamina,
        baseDamage: {
            physical: { min: 4, max: 7 }
        },
        baseDefense: {
            armour: 0,
            evasion: 0,
            auraShield: 0
        },
        weightLimit: _calculateWeightLimitFromStrength(baseAttributes.str),
        currentWeight: 0,
        currentLife: baseLife,
        currentMana: baseMana,
        currentStamina: baseStamina
    };
}

function createDefaultCharacterState() {
    return {
        base: createDefaultCharacterBase(),
        derived: null,
        dirty: true
    };
}
function normalizeCharacterBase(rawBase) {
    const defaults = createDefaultCharacterBase();
    const base = rawBase && typeof rawBase === "object" ? rawBase : {};
    const baseAttributesSrc = base.baseAttributes && typeof base.baseAttributes === "object" ? base.baseAttributes : {};
    const baseAttributes = {
        str: Math.max(0, _num(baseAttributesSrc.str, defaults.baseAttributes.str)),
        dex: Math.max(0, _num(baseAttributesSrc.dex, defaults.baseAttributes.dex)),
        int: Math.max(0, _num(baseAttributesSrc.int, defaults.baseAttributes.int))
    };

    const weightLimit = Math.max(1, _num(base.weightLimit, _calculateWeightLimitFromStrength(baseAttributes.str)));

    return {
        level: Math.max(1, Math.floor(_num(base.level, defaults.level))),
        xp: Math.max(0, _num(base.xp, defaults.xp)),
        baseAttributes,
        baseLife: Math.max(1, _num(base.baseLife, defaults.baseLife)),
        baseMana: Math.max(0, _num(base.baseMana, defaults.baseMana)),
        baseStamina: Math.max(1, _num(base.baseStamina, defaults.baseStamina)),
        baseDamage: normalizeDamageMap(base.baseDamage || defaults.baseDamage),
        baseDefense: normalizeArmorMap(base.baseDefense || defaults.baseDefense),
        weightLimit,
        currentWeight: Math.max(0, _num(base.currentWeight, defaults.currentWeight)),
        currentLife: Math.max(0, _num(base.currentLife, base.baseLife)),
        currentMana: Math.max(0, _num(base.currentMana, base.baseMana)),
        currentStamina: Math.max(0, _num(base.currentStamina, base.baseStamina))
    };
}

function _buildCharacterBaseFromLegacyState(sourceData) {
    const defaults = createDefaultCharacterBase();
    const source = sourceData && typeof sourceData === "object" ? sourceData : {};

    const legacyBaseDamage = (() => {
        if (source.baseDamage && typeof source.baseDamage === "object") return normalizeDamageMap(source.baseDamage);
        const legacyLevel = Math.max(1, Math.floor(_num(source.level, defaults.level)));
        const baseMin = 2 + (legacyLevel * 0.5);
        return normalizeDamageMap({
            physical: { min: baseMin, max: baseMin + 2 }
        });
    })();

    const candidate = {
        level: _num(source.level, defaults.level),
        xp: _num(source.xp, defaults.xp),
        baseAttributes: source.baseAttributes,
        baseLife: _num(source.baseLife, _num(source.maxHp, defaults.baseLife)),
        baseMana: _num(source.baseMana, defaults.baseMana),
        baseStamina: _num(source.baseStamina, defaults.baseStamina),
        baseDamage: legacyBaseDamage,
        baseDefense: source.baseDefense,
        weightLimit: _num(source.weightLimit, undefined),
        currentWeight: _num(source.currentWeight, defaults.currentWeight),
        currentLife: _num(source.hp, _num(source.maxHp, defaults.baseLife)),
        currentMana: _num(source.currentMana, defaults.baseMana),
        currentStamina: _num(source.currentStamina, defaults.baseStamina)
    };

    return normalizeCharacterBase(candidate);
}

function _deleteLegacyCharacterFields(target) {
    if (!target || typeof target !== "object") return;
    LEGACY_CHARACTER_SAVE_FIELDS.forEach((field) => {
        if (Object.prototype.hasOwnProperty.call(target, field)) {
            delete target[field];
        }
    });
}

function migrateLegacyCharacterInSave(rawData) {
    const data = rawData && typeof rawData === "object" ? rawData : {};
    if (!data.character || typeof data.character !== "object") {
        data.character = { base: _buildCharacterBaseFromLegacyState(data) };
    } else if (!data.character.base || typeof data.character.base !== "object") {
        data.character.base = _buildCharacterBaseFromLegacyState(data);
    } else {
        data.character.base = normalizeCharacterBase(data.character.base);
    }

    delete data.character.derived;
    delete data.character.dirty;
    _deleteLegacyCharacterFields(data);
    return data;
}

function sanitizeCharacterForSave(rawData) {
    const data = rawData && typeof rawData === "object" ? rawData : {};
    migrateLegacyCharacterInSave(data);
    if (data.character && typeof data.character === "object") {
        delete data.character.derived;
        delete data.character.dirty;
    }
    _deleteLegacyCharacterFields(data);
    return data;
}

function _toPathParts(statPath) {
    if (typeof statPath !== "string") return [];
    return statPath.split(".").filter(Boolean);
}

function _readNumericPath(root, statPath, fallback) {
    const parts = _toPathParts(statPath);
    if (!parts.length) return fallback;
    let ptr = root;
    for (let i = 0; i < parts.length; i += 1) {
        const key = parts[i];
        if (!ptr || typeof ptr !== "object" || !Object.prototype.hasOwnProperty.call(ptr, key)) {
            return fallback;
        }
        ptr = ptr[key];
    }
    return _num(ptr, fallback);
}

function _writeNumericPath(root, statPath, value) {
    const parts = _toPathParts(statPath);
    if (!parts.length) return;
    let ptr = root;
    for (let i = 0; i < parts.length - 1; i += 1) {
        const key = parts[i];
        if (!ptr[key] || typeof ptr[key] !== "object") {
            ptr[key] = {};
        }
        ptr = ptr[key];
    }
    ptr[parts[parts.length - 1]] = value;
}

function _normalizeModifier(rawModifier) {
    if (!rawModifier || typeof rawModifier !== "object") return null;
    if (typeof rawModifier.statPath !== "string" || !rawModifier.statPath) return null;
    if (!CHARACTER_MODIFIER_TYPES.includes(rawModifier.type)) return null;
    if (!_isFiniteNumber(rawModifier.value)) return null;
    return {
        statPath: rawModifier.statPath,
        type: rawModifier.type,
        value: rawModifier.value
    };
}

function _buildLegacyItemModifierFactories() {
    return Object.freeze({
        physicalDamageMin: (value) => [{ statPath: "physicalDamageMin", type: "flat", value }],
        physicalDamageMax: (value) => [{ statPath: "physicalDamageMax", type: "flat", value }],
        attacksPerSecond: (value) => [{ statPath: "attacksPerSecond", type: "flat", value }],
        armour: (value) => [{ statPath: "armour", type: "flat", value }],
        evasion: (value) => [{ statPath: "evasion", type: "flat", value }],
        auraShield: (value) => [{ statPath: "auraShield", type: "flat", value }],
        damage: (value) => [
            { statPath: "physicalDamageMin", type: "flat", value },
            { statPath: "physicalDamageMax", type: "flat", value }
        ],
        damageMin: (value) => [{ statPath: "physicalDamageMin", type: "flat", value }],
        damageMax: (value) => [{ statPath: "physicalDamageMax", type: "flat", value }],
        damageFlat: (value) => [
            { statPath: "physicalDamageMin", type: "flat", value },
            { statPath: "physicalDamageMax", type: "flat", value }
        ],
        speedBonus: (value) => [{ statPath: "attacksPerSecond", type: "percent", value: value - 1 }],
        xpBonus: (value) => [{ statPath: "xpGainMultiplier", type: "percent", value: value - 1 }],
        defense: (value) => [{ statPath: "armour", type: "flat", value }],
        allResist: (value) => [{ statPath: "auraShield", type: "flat", value }],
        critChance: (value) => [{ statPath: "critChance", type: "flat", value }],
        life: (value) => [{ statPath: "life", type: "flat", value }],
        mana: (value) => [{ statPath: "mana", type: "flat", value }],
        stamina: (value) => [{ statPath: "stamina", type: "flat", value }],
        damageBonus: (value) => [
            { statPath: "physicalDamageMin", type: "percent", value: value - 1 },
            { statPath: "physicalDamageMax", type: "percent", value: value - 1 }
        ],
        physicalBonus: (value) => [
            { statPath: "physicalDamageMin", type: "percent", value: value - 1 },
            { statPath: "physicalDamageMax", type: "percent", value: value - 1 }
        ]
    });
}

const LEGACY_ITEM_MODIFIER_FACTORIES = _buildLegacyItemModifierFactories();

function extractItemModifiers(item) {
    if (!item || typeof item !== "object") return [];

    const directModifiers = Array.isArray(item.modifiers) ? item.modifiers : null;
    if (directModifiers) {
        return directModifiers
            .map(_normalizeModifier)
            .filter(Boolean);
    }

    const output = [];
    Object.keys(LEGACY_ITEM_MODIFIER_FACTORIES).forEach((key) => {
        const rawValue = item[key];
        if (!_isFiniteNumber(rawValue)) return;
        const factory = LEGACY_ITEM_MODIFIER_FACTORIES[key];
        const generated = Array.isArray(factory(rawValue)) ? factory(rawValue) : [];
        generated.forEach((modifier) => {
            const normalized = _normalizeModifier(modifier);
            if (normalized) output.push(normalized);
        });
    });

    return output;
}
function _buildAttributeModifiers(baseAttributes) {
    const modifiers = [];
    const attrs = baseAttributes && typeof baseAttributes === "object" ? baseAttributes : {};
    Object.keys(CHARACTER_ATTRIBUTE_EFFECTS).forEach((attributeKey) => {
        const points = Math.max(0, _num(attrs[attributeKey], 0));
        const effects = CHARACTER_ATTRIBUTE_EFFECTS[attributeKey] || [];
        effects.forEach((effect) => {
            const normalized = _normalizeModifier({
                statPath: effect.statPath,
                type: effect.type,
                value: points * effect.valuePerPoint
            });
            if (normalized) modifiers.push(normalized);
        });
    });
    return modifiers;
}

function _buildLevelModifiers(level) {
    const safeLevel = Math.max(1, Math.floor(_num(level, 1)));
    const gainedLevels = Math.max(0, safeLevel - 1);
    if (gainedLevels <= 0) return [];
    return [
        { statPath: "life", type: "flat", value: gainedLevels * 10 },
        { statPath: "mana", type: "flat", value: gainedLevels * 2 },
        { statPath: "stamina", type: "flat", value: gainedLevels * 2 },
        { statPath: "physicalDamageMin", type: "flat", value: gainedLevels * 0.35 },
        { statPath: "physicalDamageMax", type: "flat", value: gainedLevels * 0.55 }
    ].map(_normalizeModifier).filter(Boolean);
}

function getItemWeight(item) {
    if (_isFiniteNumber(item && item.weight)) {
        return Math.max(0, item.weight);
    }
    return Math.max(1, _countBodyCells(item));
}

function _resolveItemAttackType(item) {
    if (!item || typeof item !== "object") return "misc";
    const baseType = (typeof item.baseType === "string" && item.baseType) ? item.baseType : null;
    return baseType || ((typeof item.type === "string" && item.type) ? item.type : "misc");
}

function _isAttackWeaponType(type) {
    return Object.prototype.hasOwnProperty.call(CHARACTER_DEFAULT_WEAPON_INTERVAL_MS_BY_TYPE, type);
}

function _resolveWeaponBaseAttacksPerSecond(item) {
    if (!item || typeof item !== "object") return null;
    const explicitAps = Number(item.attacksPerSecond);
    if (Number.isFinite(explicitAps) && explicitAps > 0) return explicitAps;
    const explicitInterval = Number(item.attackIntervalMs);
    if (Number.isFinite(explicitInterval) && explicitInterval > 0) return 1000 / explicitInterval;
    const explicitCooldown = Number(item.attackCooldownMs);
    if (Number.isFinite(explicitCooldown) && explicitCooldown > 0) return 1000 / explicitCooldown;
    const legacyAttackSpeed = Number(item.attackSpeed);
    if (Number.isFinite(legacyAttackSpeed) && legacyAttackSpeed > 0) return legacyAttackSpeed;
    const attackType = _resolveItemAttackType(item);
    if (_isAttackWeaponType(attackType)) {
        return 1000 / CHARACTER_DEFAULT_WEAPON_INTERVAL_MS_BY_TYPE[attackType];
    }
    return null;
}

function _resolveActiveAttackBaseAps(activeEntries) {
    const entries = Array.isArray(activeEntries) ? activeEntries : [];
    for (let i = 0; i < entries.length; i += 1) {
        const item = entries[i] && entries[i].item ? entries[i].item : null;
        if (!item) continue;
        const attackType = _resolveItemAttackType(item);
        if (!_isAttackWeaponType(attackType)) continue;
        const resolved = _resolveWeaponBaseAttacksPerSecond(item);
        if (_isFiniteNumber(resolved) && resolved > 0) return resolved;
    }
    return CHARACTER_UNARMED_ATTACKS_PER_SECOND;
}

function _mapAttackTimingModifier(modifier) {
    const normalized = _normalizeModifier(modifier);
    if (!normalized) return null;
    if (normalized.statPath === "attackSpeed" && normalized.type === "percent") {
        return { statPath: "attacksPerSecond", type: "percent", value: normalized.value };
    }
    if (normalized.statPath === "attackCooldownMs" && normalized.type === "percent") {
        return { statPath: "attacksPerSecond", type: "percent", value: normalized.value };
    }
    if (normalized.statPath === "attackIntervalMs" && normalized.type === "percent") {
        return { statPath: "attacksPerSecond", type: "percent", value: -normalized.value };
    }
    return normalized;
}

function _applyModifierPhases(runtimeStats, flatModifiers, percentModifiers) {
    const applyOne = (modifier) => {
        const current = _readNumericPath(runtimeStats, modifier.statPath, 0);
        let nextValue = current;
        if (modifier.type === "flat") {
            nextValue = current + modifier.value;
        } else {
            let percentValue = modifier.value;
            if (modifier.statPath === "attacksPerSecond") {
                percentValue = _clamp(percentValue, -0.95, 5);
            }
            nextValue = current * (1 + percentValue);
        }
        _writeNumericPath(runtimeStats, modifier.statPath, nextValue);
    };
    flatModifiers.forEach(applyOne);
    percentModifiers.forEach(applyOne);
}

function _splitModifiersByType(modifiers) {
    const flatModifiers = [];
    const percentModifiers = [];
    if (!Array.isArray(modifiers)) return { flatModifiers, percentModifiers };
    modifiers.forEach((modifier) => {
        const normalized = _mapAttackTimingModifier(modifier);
        if (!normalized) return;
        if (normalized.type === "flat") flatModifiers.push(normalized);
        if (normalized.type === "percent") percentModifiers.push(normalized);
    });
    return { flatModifiers, percentModifiers };
}

function _resolveItemById(itemId) {
    if (!itemId) return null;
    if (typeof getItemDefById === "function") {
        const item = getItemDefById(itemId);
        if (item) return item;
    }
    if (typeof getItemById === "function") {
        return getItemById(itemId);
    }
    return null;
}

function collectEquippedItemEntries(grid, resolver) {
    if (!grid || typeof grid !== "object") return [];
    const resolveItem = typeof resolver === "function" ? resolver : _resolveItemById;
    return Object.keys(grid)
        .map((key) => ({ key, index: parseInt(key, 10), cell: grid[key] }))
        .filter((entry) => Number.isFinite(entry.index))
        .filter((entry) => entry.cell && entry.cell.root && entry.cell.itemId)
        .sort((a, b) => a.index - b.index)
        .map((entry) => {
            const item = resolveItem(entry.cell.itemId, entry.cell, entry.index);
            if (!item) return null;
            return {
                index: entry.index,
                instanceId: entry.cell.instanceId || null,
                item
            };
        })
        .filter(Boolean);
}

function _classifyWeightActivation(equippedEntries, weightLimit) {
    const entries = Array.isArray(equippedEntries) ? equippedEntries : [];
    const active = [];
    const inactive = [];
    let totalWeight = 0;
    let activeWeight = 0;

    entries.forEach((entry) => {
        const weight = getItemWeight(entry.item);
        totalWeight += weight;
        const withWeight = { ...entry, weight };
        if (activeWeight + weight <= weightLimit) {
            active.push(withWeight);
            activeWeight += weight;
        } else {
            inactive.push(withWeight);
        }
    });

    return {
        active,
        inactive,
        totalWeight: _round2(totalWeight),
        activeWeight: _round2(activeWeight)
    };
}

function _createRuntimeStatsFromBase(base) {
    const baseDamage = normalizeDamageMap(base.baseDamage);
    const baseDefense = normalizeArmorMap(base.baseDefense);
    return {
        physicalDamageMin: baseDamage.physical.min,
        physicalDamageMax: baseDamage.physical.max,
        armour: baseDefense.armour,
        evasion: baseDefense.evasion,
        auraShield: baseDefense.auraShield,
        life: base.baseLife,
        mana: base.baseMana,
        stamina: base.baseStamina,
        attacksPerSecond: 0,
        critChance: 0.05,
        staminaRegen: 1,
        staminaCostMultiplier: 1,
        xpGainMultiplier: 1,
        magicScaling: 1,
        weightLimit: base.weightLimit,
        currentWeight: base.currentWeight
    };
}
function getCharacterDamageValueFromDerived(derivedStats) {
    if (derivedStats && _isFiniteNumber(derivedStats.physicalDamageMin) && _isFiniteNumber(derivedStats.physicalDamageMax)) {
        const min = Math.max(0, derivedStats.physicalDamageMin);
        const max = Math.max(min, derivedStats.physicalDamageMax);
        return Math.max(0, (min + max) / 2);
    }
    if (!derivedStats || !derivedStats.finalDamage || !derivedStats.finalDamage.physical) return 0;
    const bucket = derivedStats.finalDamage.physical;
    const min = Math.max(0, _num(bucket.min, 0));
    const max = Math.max(min, _num(bucket.max, min));
    return Math.max(0, (min + max) / 2);
}

function computeCharacterStats(params) {
    const input = params && typeof params === "object" ? params : {};
    const base = normalizeCharacterBase(input.base);
    const equippedItemEntries = Array.isArray(input.equippedItemEntries) ? input.equippedItemEntries : [];

    const runtime = _createRuntimeStatsFromBase(base);

    const attributeModifiers = _buildAttributeModifiers(base.baseAttributes);
    const levelModifiers = _buildLevelModifiers(base.level);
    const progressionModifiers = [...attributeModifiers, ...levelModifiers];

    const activationPreview = _createRuntimeStatsFromBase(base);
    const activationSplit = _splitModifiersByType(progressionModifiers);
    _applyModifierPhases(activationPreview, activationSplit.flatModifiers, activationSplit.percentModifiers);
    activationPreview.weightLimit = Math.max(1, _num(activationPreview.weightLimit, _calculateWeightLimitFromStrength(base.baseAttributes.str)));

    const weightClass = _classifyWeightActivation(equippedItemEntries, activationPreview.weightLimit);
    const activeItemModifiers = [];
    weightClass.active.forEach((entry) => {
        extractItemModifiers(entry.item).forEach((modifier) => activeItemModifiers.push(modifier));
    });
    const hasApsItemModifier = activeItemModifiers.some((modifier) => (
        modifier && modifier.statPath === "attacksPerSecond"
    ));
    runtime.attacksPerSecond = hasApsItemModifier ? 0 : _resolveActiveAttackBaseAps(weightClass.active);

    const allModifiers = [...progressionModifiers, ...activeItemModifiers];
    const globalSplit = _splitModifiersByType(allModifiers);
    _applyModifierPhases(runtime, globalSplit.flatModifiers, globalSplit.percentModifiers);

    runtime.weightLimit = Math.max(1, _num(runtime.weightLimit, _calculateWeightLimitFromStrength(base.baseAttributes.str)));

    runtime.currentWeight = weightClass.totalWeight;
    const limit = Math.max(1, runtime.weightLimit);
    const ratio = runtime.currentWeight / limit;
    if (ratio > 1) {
        runtime.staminaCostMultiplier *= 1 + ((ratio - 1) * 0.8);
        runtime.staminaRegen *= Math.max(0.1, 1 - ((ratio - 1) * 0.5));
    } else if (ratio > 0.75) {
        runtime.staminaCostMultiplier *= 1 + ((ratio - 0.75) * 0.5);
        runtime.staminaRegen *= Math.max(0.4, 1 - ((ratio - 0.75) * 1.2));
    }

    const finalPhysicalMin = Math.max(0, _num(runtime.physicalDamageMin, 0));
    const finalPhysicalMax = Math.max(finalPhysicalMin, _num(runtime.physicalDamageMax, finalPhysicalMin));
    const finalArmor = normalizeArmorMap({
        armour: runtime.armour,
        evasion: runtime.evasion,
        auraShield: runtime.auraShield
    });
    const finalDamage = normalizeDamageMap({
        physical: { min: finalPhysicalMin, max: finalPhysicalMax }
    });

    const finalLife = Math.max(1, runtime.life);
    const finalMana = Math.max(0, runtime.mana);
    const finalStamina = Math.max(1, runtime.stamina);
    const currentLife = _clamp(_num(base.currentLife, finalLife), 0, finalLife);
    const currentMana = _clamp(_num(base.currentMana, finalMana), 0, finalMana);
    const currentStamina = _clamp(_num(base.currentStamina, finalStamina), 0, finalStamina);
    const attacksPerSecond = Math.max(0.1, _num(runtime.attacksPerSecond, CHARACTER_UNARMED_ATTACKS_PER_SECOND));
    const attackIntervalMs = 1000 / attacksPerSecond;
    const critChance = _clamp(runtime.critChance, 0, 1);
    const staminaRegen = Math.max(0, runtime.staminaRegen);
    const staminaCostMultiplier = Math.max(0.1, runtime.staminaCostMultiplier);
    const xpGainMultiplier = Math.max(0.1, runtime.xpGainMultiplier);

    return {
        finalDamage,
        finalArmor,
        physicalDamageMin: finalPhysicalMin,
        physicalDamageMax: finalPhysicalMax,
        armour: finalArmor.armour,
        evasion: finalArmor.evasion,
        auraShield: finalArmor.auraShield,
        attacksPerSecond,
        attackIntervalMs,
        attackSpeed: attacksPerSecond,
        critChance,
        staminaRegen,
        staminaCostMultiplier,
        xpGainMultiplier,
        magicScaling: Math.max(0.1, runtime.magicScaling),
        lifeRegen: 1,
        life: finalLife,
        mana: finalMana,
        stamina: finalStamina,
        maxLife: finalLife,
        maxMana: finalMana,
        maxStamina: finalStamina,
        currentLife,
        currentMana,
        currentStamina,
        weightLimit: _round2(runtime.weightLimit),
        currentWeight: _round2(runtime.currentWeight),
        hardCapExceeded: runtime.currentWeight > runtime.weightLimit,
        activeItemInstanceIds: weightClass.active.map((entry) => entry.instanceId).filter(Boolean),
        inactiveItemInstanceIds: weightClass.inactive.map((entry) => entry.instanceId).filter(Boolean),
        xpToNextLevel: calculateXpToNextLevel(base.level),
        damageAverage: _round2((finalPhysicalMin + finalPhysicalMax) / 2)
    };
}

function ensureCharacterModelOnGameData(gameData) {
    if (!gameData || typeof gameData !== "object") return;
    if (!gameData.character || typeof gameData.character !== "object") {
        gameData.character = createDefaultCharacterState();
    }
    gameData.character.base = normalizeCharacterBase(gameData.character.base || _buildCharacterBaseFromLegacyState(gameData));
    if (!gameData.character.derived || typeof gameData.character.derived !== "object") {
        gameData.character.derived = null;
    }
    if (typeof gameData.character.dirty !== "boolean") {
        gameData.character.dirty = true;
    }
}

function markCharacterStatsDirty(gameData) {
    ensureCharacterModelOnGameData(gameData);
    if (gameData && gameData.character) {
        gameData.character.dirty = true;
    }
}

function syncLegacyCharacterFields(gameData, derivedStats) {
    if (!gameData || typeof gameData !== "object") return;
    ensureCharacterModelOnGameData(gameData);
    const base = gameData.character.base;
    const derived = derivedStats && typeof derivedStats === "object"
        ? derivedStats
        : (gameData.character.derived || { xpToNextLevel: calculateXpToNextLevel(base.level), life: base.baseLife });

    const maxLife = Math.max(1, _num(derived.maxLife, _num(derived.life, base.baseLife)));
    const currentLife = _clamp(_num(base.currentLife, maxLife), 0, maxLife);

    gameData.level = base.level;
    gameData.xp = base.xp;
    gameData.xpNextLevel = _num(derived.xpToNextLevel, calculateXpToNextLevel(base.level));
    gameData.maxHp = maxLife;
    gameData.hp = currentLife;
    gameData.hpRegen = Math.max(0, _num(derived.lifeRegen, gameData.hpRegen || 1));
}

function recomputeCharacterDerivedStats(gameData, options) {
    ensureCharacterModelOnGameData(gameData);
    const opts = options && typeof options === "object" ? options : {};
    const gridKey = typeof opts.gridKey === "string" ? opts.gridKey : "farmGrid";
    const equippedGrid = gameData[gridKey] && typeof gameData[gridKey] === "object" ? gameData[gridKey] : {};
    const equippedItemEntries = collectEquippedItemEntries(equippedGrid, opts.resolver);
    const derived = computeCharacterStats({
        base: gameData.character.base,
        equippedItemEntries
    });

    gameData.character.derived = derived;
    gameData.character.dirty = false;
    syncLegacyCharacterFields(gameData, derived);

    if (typeof window !== "undefined" && typeof window.dispatchEvent === "function" && typeof CustomEvent === "function") {
        window.dispatchEvent(new CustomEvent("character:stats-updated", {
            detail: {
                gridKey,
                derived,
                base: gameData.character.base
            }
        }));
    }

    return derived;
}

function getCharacterDerivedStats(gameData, options) {
    ensureCharacterModelOnGameData(gameData);
    if (!gameData.character.dirty && gameData.character.derived) {
        syncLegacyCharacterFields(gameData, gameData.character.derived);
        return gameData.character.derived;
    }
    return recomputeCharacterDerivedStats(gameData, options);
}

function grantCharacterXP(gameData, xpAmount, options) {
    ensureCharacterModelOnGameData(gameData);
    const opts = options && typeof options === "object" ? options : {};
    const amount = Math.max(0, _num(xpAmount, 0));
    if (amount <= 0) {
        syncLegacyCharacterFields(gameData, gameData.character.derived);
        return { levelsGained: 0, leveledUp: false };
    }

    const base = gameData.character.base;
    base.xp += amount;

    let levelsGained = 0;
    let xpThreshold = calculateXpToNextLevel(base.level);
    while (base.xp >= xpThreshold) {
        base.xp -= xpThreshold;
        base.level += 1;
        levelsGained += 1;
        xpThreshold = calculateXpToNextLevel(base.level);
    }

    if (levelsGained > 0) {
        markCharacterStatsDirty(gameData);
        getCharacterDerivedStats(gameData, opts);
    } else {
        syncLegacyCharacterFields(gameData, gameData.character.derived);
    }

    return { levelsGained, leveledUp: levelsGained > 0 };
}
if (typeof window !== "undefined") {
    window.CHARACTER_DAMAGE_TYPES = CHARACTER_DAMAGE_TYPES;
    window.CHARACTER_LEVELING_CONFIG = CHARACTER_LEVELING_CONFIG;
    window.CHARACTER_ATTRIBUTE_EFFECTS = CHARACTER_ATTRIBUTE_EFFECTS;

    window.calculateXpToNextLevel = calculateXpToNextLevel;
    window.normalizeDamageMap = normalizeDamageMap;
    window.normalizeArmorMap = normalizeArmorMap;
    window.createDefaultCharacterBase = createDefaultCharacterBase;
    window.createDefaultCharacterState = createDefaultCharacterState;
    window.normalizeCharacterBase = normalizeCharacterBase;
    window.extractItemModifiers = extractItemModifiers;
    window.getItemWeight = getItemWeight;
    window.computeCharacterStats = computeCharacterStats;
    window.collectEquippedItemEntries = collectEquippedItemEntries;
    window.getCharacterDamageValueFromDerived = getCharacterDamageValueFromDerived;

    window.ensureCharacterModelOnGameData = ensureCharacterModelOnGameData;
    window.markCharacterStatsDirty = markCharacterStatsDirty;
    window.syncLegacyCharacterFields = syncLegacyCharacterFields;
    window.recomputeCharacterDerivedStats = recomputeCharacterDerivedStats;
    window.getCharacterDerivedStats = getCharacterDerivedStats;
    window.grantCharacterXP = grantCharacterXP;
    window.migrateLegacyCharacterInSave = migrateLegacyCharacterInSave;
    window.sanitizeCharacterForSave = sanitizeCharacterForSave;
}

if (typeof module !== "undefined" && module.exports) {
    module.exports = {
        CHARACTER_DAMAGE_TYPES,
        CHARACTER_LEVELING_CONFIG,
        CHARACTER_ATTRIBUTE_EFFECTS,
        calculateXpToNextLevel,
        createDefaultCharacterBase,
        createDefaultCharacterState,
        normalizeCharacterBase,
        normalizeDamageMap,
        normalizeArmorMap,
        extractItemModifiers,
        getItemWeight,
        computeCharacterStats,
        collectEquippedItemEntries,
        getCharacterDamageValueFromDerived,
        ensureCharacterModelOnGameData,
        markCharacterStatsDirty,
        syncLegacyCharacterFields,
        recomputeCharacterDerivedStats,
        getCharacterDerivedStats,
        grantCharacterXP,
        migrateLegacyCharacterInSave,
        sanitizeCharacterForSave
    };
}
