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

function _pickTierAndRoll(affixDef, itemLevel, rng) {
    if (!affixDef) return null;
    const eligibleTiers = (typeof getEligibleAffixTiers === "function")
        ? getEligibleAffixTiers(affixDef, itemLevel)
        : [];
    if (!Array.isArray(eligibleTiers) || eligibleTiers.length === 0) return null;

    const chosenTier = eligibleTiers[_rngIntInclusive(0, eligibleTiers.length - 1, rng)];
    const roll = chosenTier.min + (_rngFloat(rng) * (chosenTier.max - chosenTier.min));
    const precision = chosenTier.max <= 1 ? 4 : 2;
    const roundedRoll = Number(roll.toFixed(precision));
    return {
        affixId: affixDef.id,
        tier: chosenTier.tier,
        roll: roundedRoll
    };
}

function _buildGroupPool(baseItem, group) {
    const key = group + "Pool";
    if (Array.isArray(baseItem[key]) && baseItem[key].length > 0) {
        return baseItem[key];
    }
    if (typeof getAffixDefsByGroup === "function") {
        return getAffixDefsByGroup(group).map((affixDef) => affixDef.id);
    }
    return [];
}

function _rollAffixGroup(baseItem, group, maxSlots, itemLevel, rng) {
    const slots = Math.max(0, Math.floor(Number.isFinite(maxSlots) ? maxSlots : 0));
    if (slots <= 0) return [];

    const pool = _buildGroupPool(baseItem, group);
    if (!Array.isArray(pool) || pool.length === 0) return [];

    const count = _rngIntInclusive(0, slots, rng);
    if (count <= 0) return [];

    const picked = [];
    const usedIds = new Set();
    let guard = 0;
    while (picked.length < count && guard < 100) {
        guard += 1;
        const affixId = _pickWeighted(pool, rng);
        if (!affixId || usedIds.has(affixId)) continue;
        const affixDef = typeof getAffixDefById === "function" ? getAffixDefById(affixId) : null;
        if (!affixDef || affixDef.group !== group) continue;
        const roll = _pickTierAndRoll(affixDef, itemLevel, rng);
        if (!roll) continue;
        usedIds.add(affixId);
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

    let implicits = [];
    if (Array.isArray(baseItem.implicitPool) && baseItem.implicitPool.length > 0) {
        const implicitChance = Number.isFinite(opts.implicitChance) ? opts.implicitChance : 0.65;
        if (_rngFloat(rng) <= implicitChance) {
            const implicitAffixId = _pickWeighted(baseItem.implicitPool, rng);
            const implicitDef = typeof getAffixDefById === "function" ? getAffixDefById(implicitAffixId) : null;
            const implicitRoll = _pickTierAndRoll(implicitDef, ilvl, rng);
            if (implicitRoll) implicits = [implicitRoll];
        }
    }

    const prefixes = _rollAffixGroup(baseItem, "prefix", baseItem.prefixSlots, ilvl, rng);
    const suffixes = _rollAffixGroup(baseItem, "suffix", baseItem.suffixSlots, ilvl, rng);

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
}

if (typeof module !== "undefined" && module.exports) {
    module.exports = {
        generateItem
    };
}
