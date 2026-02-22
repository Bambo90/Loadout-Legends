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

const _GENERATOR_WEAPON_AFFIX_TYPES = Object.freeze({
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

function _resolveAffixCategory(baseItem) {
    if (!baseItem || typeof baseItem !== "object") return null;
    const tags = Array.isArray(baseItem.tags) ? baseItem.tags : [];
    if (tags.includes("weapon")) return "weapon";
    if (tags.includes("armor")) return "armor";
    if (tags.includes("jewelry")) return "jewelry";
    if (tags.includes("accessory")) return "jewelry";

    const baseType = (typeof baseItem.baseType === "string" && baseItem.baseType)
        ? baseItem.baseType
        : (typeof baseItem.type === "string" ? baseItem.type : "");
    if (_GENERATOR_WEAPON_AFFIX_TYPES[baseType]) return "weapon";
    if (baseType === "armor") return "armor";
    if (baseType === "jewelry" || baseType === "accessory") return "jewelry";
    return null;
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

    const normalizedTiers = eligibleTiers
        .map((tier) => {
            if (!tier || typeof tier !== "object") return null;
            const weight = Number.isFinite(tier.weight) && tier.weight > 0
                ? tier.weight
                : Math.max(1, Math.round(Math.pow(Math.max(1, Number(tier.tier) || 1), 1.8)));
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

function _rollAffixGroup(baseItem, category, group, maxSlots, itemLevel, rng) {
    if (!category) return [];
    const slots = Math.max(0, Math.floor(Number.isFinite(maxSlots) ? maxSlots : 0));
    if (slots <= 0) return [];

    const pool = _buildGroupPool(baseItem, category, group);
    if (!Array.isArray(pool) || pool.length === 0) return [];

    const count = _rngIntInclusive(1, slots, rng);
    if (count <= 0) return [];

    const picked = [];
    const usedIds = new Set();
    let guard = 0;
    while (picked.length < count && guard < 100) {
        guard += 1;
        const affixId = _pickWeighted(pool, rng);
        if (!affixId || usedIds.has(affixId)) continue;
        const affixDef = typeof getAffixDefById === "function" ? getAffixDefById(affixId) : null;
        if (!affixDef || affixDef.group !== group || affixDef.category !== category) continue;
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
    const category = _resolveAffixCategory(baseItem);

    let implicits = [];
    const implicitPool = _buildGroupPool(baseItem, category, "implicit");
    if (category && Array.isArray(implicitPool) && implicitPool.length > 0) {
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
}

if (typeof module !== "undefined" && module.exports) {
    module.exports = {
        generateItem
    };
}
