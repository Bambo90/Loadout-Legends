/* ITEM GENERATOR
 * Generates item instances with implicit/prefix/suffix rolls.
 */

function _rngFloat(rng) {
    if (typeof rng === "function") {
        const value = rng();
        if (Number.isFinite(value)) return Math.max(0, Math.min(1, value));
    }
    return Math.random();
}

function _rngIntInclusive(min, max, rng) {
    const lo = Math.min(min, max);
    const hi = Math.max(min, max);
    return lo + Math.floor(_rngFloat(rng) * ((hi - lo) + 1));
}

const _TIER_WEIGHT_PROGRESS_MIN_ILVL = 1;
const _TIER_WEIGHT_PROGRESS_MAX_ILVL = 60;
const _TIER_WEIGHT_SHAPE_EXPONENT = 1.25;

let _cachedCategoryResolver = null;

function _resolveAffixCategory(baseItem) {
    if (typeof _cachedCategoryResolver === "function") {
        return _cachedCategoryResolver(baseItem);
    }

    if (typeof resolveAffixCategoryForItem === "function") {
        _cachedCategoryResolver = resolveAffixCategoryForItem;
        return _cachedCategoryResolver(baseItem);
    }

    if (typeof window !== "undefined" && typeof window.resolveAffixCategoryForItem === "function") {
        _cachedCategoryResolver = window.resolveAffixCategoryForItem;
        return _cachedCategoryResolver(baseItem);
    }

    if (typeof require === "function") {
        try {
            const itemDefs = require("./itemDefs.js");
            if (itemDefs && typeof itemDefs.resolveAffixCategoryForItem === "function") {
                _cachedCategoryResolver = itemDefs.resolveAffixCategoryForItem;
                return _cachedCategoryResolver(baseItem);
            }
        } catch (err) {
            // Ignore in browser/non-commonjs runtime.
        }
    }

    return null;
}

function _isCraftFirstRarity(baseItem) {
    const rarity = (baseItem && typeof baseItem.rarity === "string")
        ? baseItem.rarity.trim().toLowerCase()
        : "";
    return rarity !== "unique" && rarity !== "legendary";
}

function _pickWeighted(pool, rng) {
    if (!Array.isArray(pool) || pool.length === 0) return null;
    const normalized = pool
        .map((entry) => {
            if (typeof entry === "string") return { affixId: entry, weight: 1 };
            if (!entry || typeof entry !== "object" || !entry.affixId) return null;
            return {
                affixId: entry.affixId,
                weight: Number.isFinite(entry.weight) && entry.weight > 0 ? entry.weight : 1
            };
        })
        .filter(Boolean);

    if (normalized.length === 0) return null;
    const totalWeight = normalized.reduce((sum, entry) => sum + entry.weight, 0);
    if (totalWeight <= 0) return normalized[0].affixId;

    let ticket = _rngFloat(rng) * totalWeight;
    for (let i = 0; i < normalized.length; i++) {
        ticket -= normalized[i].weight;
        if (ticket <= 0) return normalized[i].affixId;
    }
    return normalized[normalized.length - 1].affixId;
}

function _resolveTierQualityProgress(itemLevel) {
    const ilvl = Math.max(1, Math.floor(Number.isFinite(itemLevel) ? itemLevel : 1));
    const minIlvl = _TIER_WEIGHT_PROGRESS_MIN_ILVL;
    const maxIlvl = _TIER_WEIGHT_PROGRESS_MAX_ILVL;
    if (maxIlvl <= minIlvl) return 1;
    const normalized = (ilvl - minIlvl) / (maxIlvl - minIlvl);
    return Math.max(0, Math.min(1, normalized));
}

function _resolveTierRollWeight(entry, index, orderedEligibleTiers, itemLevel) {
    if (!entry || !Array.isArray(orderedEligibleTiers) || orderedEligibleTiers.length === 0) return 1;
    const count = orderedEligibleTiers.length;
    const rankWorstToBest = Math.max(1, Math.min(count, index + 1));
    const progress = _resolveTierQualityProgress(itemLevel);
    const worstBiasWeight = Math.pow((count - rankWorstToBest) + 1, _TIER_WEIGHT_SHAPE_EXPONENT);
    const bestBiasWeight = Math.pow(rankWorstToBest, _TIER_WEIGHT_SHAPE_EXPONENT);
    const blended = worstBiasWeight + ((bestBiasWeight - worstBiasWeight) * progress);
    return Math.max(1, blended);
}

function _normalizeTierBand(tierBand) {
    if (!tierBand || typeof tierBand !== "object") return null;
    const minTier = Number(tierBand.minTier);
    const maxTier = Number(tierBand.maxTier);
    if (!Number.isFinite(minTier) || !Number.isFinite(maxTier)) return null;
    const lo = Math.max(1, Math.floor(Math.min(minTier, maxTier)));
    const hi = Math.max(lo, Math.floor(Math.max(minTier, maxTier)));
    return { minTier: lo, maxTier: hi };
}

function _filterEligibleTiersByBand(eligibleTiers, tierBand) {
    const band = _normalizeTierBand(tierBand);
    if (!band) return Array.isArray(eligibleTiers) ? eligibleTiers : [];
    return (Array.isArray(eligibleTiers) ? eligibleTiers : [])
        .filter((tier) => tier && Number.isFinite(tier.tier) && tier.tier >= band.minTier && tier.tier <= band.maxTier);
}

function _pickTierAndRoll(affixDef, itemLevel, rng, options) {
    const opts = options && typeof options === "object" ? options : {};
    if (!affixDef) return null;
    const eligibleTiers = (typeof getEligibleAffixTiers === "function")
        ? getEligibleAffixTiers(affixDef, itemLevel)
        : [];
    const tierPool = _filterEligibleTiersByBand(eligibleTiers, opts.tierBand);
    if (tierPool.length === 0) return null;

    const orderedEligibleTiers = tierPool
        .slice()
        .sort((a, b) => {
            const ai = Number.isFinite(a && a.requiredIlvl) ? a.requiredIlvl : 0;
            const bi = Number.isFinite(b && b.requiredIlvl) ? b.requiredIlvl : 0;
            if (ai !== bi) return ai - bi;
            const at = Number.isFinite(a && a.tier) ? a.tier : 0;
            const bt = Number.isFinite(b && b.tier) ? b.tier : 0;
            return bt - at;
        });

    const normalizedTiers = orderedEligibleTiers
        .map((tier, index) => {
            if (!tier || typeof tier !== "object") return null;
            const weight = _resolveTierRollWeight(tier, index, orderedEligibleTiers, itemLevel);
            return { tier, weight };
        })
        .filter(Boolean);
    if (normalizedTiers.length === 0) return null;
    const totalWeight = normalizedTiers.reduce((sum, entry) => sum + entry.weight, 0);
    let ticket = _rngFloat(rng) * (totalWeight > 0 ? totalWeight : 1);
    let chosenTier = normalizedTiers[normalizedTiers.length - 1].tier;
    for (let i = 0; i < normalizedTiers.length; i++) {
        ticket -= normalizedTiers[i].weight;
        if (ticket <= 0) {
            chosenTier = normalizedTiers[i].tier;
            break;
        }
    }
    const roll = chosenTier.min + (_rngFloat(rng) * (chosenTier.max - chosenTier.min));
    const precision = chosenTier.max <= 1 ? 4 : 2;
    const roundedRoll = Number(roll.toFixed(precision));
    return {
        affixId: affixDef.id,
        tier: chosenTier.tier,
        roll: roundedRoll
    };
}

function pickWeightedAffixIdFromPool(pool, options) {
    const opts = options && typeof options === "object" ? options : {};
    const exclude = opts.excludeAffixIds instanceof Set ? opts.excludeAffixIds : null;
    const filteredPool = (Array.isArray(pool) ? pool : []).filter((entry) => {
        const affixId = (typeof entry === "string") ? entry : (entry && entry.affixId);
        if (typeof affixId !== "string" || !affixId) return false;
        if (exclude && exclude.has(affixId)) return false;
        return true;
    });
    if (filteredPool.length === 0) return null;
    return _pickWeighted(filteredPool, opts.rng);
}

function rollAffixByIdForItemLevel(affixId, itemLevel, options) {
    if (typeof affixId !== "string" || !affixId) return null;
    const affixDef = typeof getAffixDefById === "function" ? getAffixDefById(affixId) : null;
    if (!affixDef) return null;
    const opts = options && typeof options === "object" ? options : {};
    const roll = _pickTierAndRoll(affixDef, itemLevel, opts.rng, { tierBand: opts.tierBand });
    if (!roll) return null;
    return {
        affixId: roll.affixId,
        tier: roll.tier,
        roll: roll.roll
    };
}

function _buildGroupPool(baseItem, category, group) {
    const key = group + "Pool";
    if (Array.isArray(baseItem[key]) && baseItem[key].length > 0) {
        return baseItem[key];
    }
    if (typeof getAffixPoolByCategoryGroup === "function") {
        const categoryPool = getAffixPoolByCategoryGroup(category, group);
        if (Array.isArray(categoryPool) && categoryPool.length > 0) return categoryPool;
    }
    return [];
}

function _pickAffixRollFromPool(pool, usedIds, category, group, itemLevel, rng) {
    let guard = 0;
    while (guard < 100) {
        guard += 1;
        const affixId = _pickWeighted(pool, rng);
        if (!affixId || usedIds.has(affixId)) continue;
        const affixDef = typeof getAffixDefById === "function" ? getAffixDefById(affixId) : null;
        if (!affixDef || affixDef.group !== group || affixDef.category !== category) continue;
        const roll = _pickTierAndRoll(affixDef, itemLevel, rng);
        if (!roll) continue;
        usedIds.add(affixId);
        return roll;
    }
    return null;
}

function _rollAffixGroup(baseItem, category, group, maxSlots, itemLevel, rng) {
    if (!category) return [];
    const slots = Math.max(0, Math.floor(Number.isFinite(maxSlots) ? maxSlots : 0));
    if (slots <= 0) return [];

    const pool = _buildGroupPool(baseItem, category, group);
    if (!Array.isArray(pool) || pool.length === 0) return [];

    const craftFirst = _isCraftFirstRarity(baseItem);
    const picked = [];
    const usedIds = new Set();

    if (craftFirst) {
        for (let slotIndex = 0; slotIndex < slots; slotIndex += 1) {
            if (_rngFloat(rng) > 0.5) continue;
            const roll = _pickAffixRollFromPool(pool, usedIds, category, group, itemLevel, rng);
            if (roll) picked.push(roll);
        }
        return picked;
    }

    const count = _rngIntInclusive(1, slots, rng);
    if (count <= 0) return [];
    while (picked.length < count) {
        const roll = _pickAffixRollFromPool(pool, usedIds, category, group, itemLevel, rng);
        if (!roll) break;
        picked.push(roll);
    }
    return picked;
}

function generateItem(baseItemId, itemLevel, options) {
    if (typeof getItemDefById !== "function") return null;
    const baseItem = getItemDefById(baseItemId);
    if (!baseItem) return null;

    const opts = options && typeof options === "object" ? options : {};
    const rng = typeof opts.rng === "function" ? opts.rng : null;
    const ilvl = Math.max(1, Math.floor(Number.isFinite(itemLevel) ? itemLevel : 1));
    const category = _resolveAffixCategory(baseItem);
    const craftFirst = _isCraftFirstRarity(baseItem);

    let implicits = [];
    const implicitPool = _buildGroupPool(baseItem, category, "implicit");
    if (category && Array.isArray(implicitPool) && implicitPool.length > 0) {
        if (craftFirst) {
            const implicitAffixId = _pickWeighted(implicitPool, rng);
            const implicitDef = typeof getAffixDefById === "function" ? getAffixDefById(implicitAffixId) : null;
            const implicitRoll = (implicitDef && implicitDef.group === "implicit" && implicitDef.category === category)
                ? _pickTierAndRoll(implicitDef, ilvl, rng)
                : null;
            if (implicitRoll) implicits = [implicitRoll];
        } else {
            const implicitChance = Number.isFinite(opts.implicitChance) ? opts.implicitChance : 0.65;
            if (_rngFloat(rng) <= implicitChance) {
                const implicitAffixId = _pickWeighted(implicitPool, rng);
                const implicitDef = typeof getAffixDefById === "function" ? getAffixDefById(implicitAffixId) : null;
                const implicitRoll = (implicitDef && implicitDef.group === "implicit" && implicitDef.category === category)
                    ? _pickTierAndRoll(implicitDef, ilvl, rng)
                    : null;
                if (implicitRoll) implicits = [implicitRoll];
            }
        }
    }

    const prefixes = _rollAffixGroup(baseItem, category, "prefix", baseItem.prefixSlots, ilvl, rng);
    const suffixes = _rollAffixGroup(baseItem, category, "suffix", baseItem.suffixSlots, ilvl, rng);

    return {
        itemId: baseItem.id,
        itemLevel: ilvl,
        implicits,
        prefixes,
        suffixes
    };
}

if (typeof window !== "undefined") {
    window.generateItem = generateItem;
    window.rollAffixByIdForItemLevel = rollAffixByIdForItemLevel;
    window.pickWeightedAffixIdFromPool = pickWeightedAffixIdFromPool;
}

if (typeof module !== "undefined" && module.exports) {
    module.exports = {
        generateItem,
        rollAffixByIdForItemLevel,
        pickWeightedAffixIdFromPool
    };
}
