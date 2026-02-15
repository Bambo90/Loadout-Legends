/* AFFIX DEFINITIONS
 * Central affix/tier source for PoE-inspired item rolling.
 */

const AFFIX_DEFS = Object.freeze([
    {
        id: "implicit_guarded_slash",
        group: "implicit",
        statPath: "armor.slash",
        type: "flat",
        tiers: Object.freeze([
            Object.freeze({ tier: 1, min: 2, max: 4, requiredIlvl: 1 }),
            Object.freeze({ tier: 2, min: 5, max: 8, requiredIlvl: 8 }),
            Object.freeze({ tier: 3, min: 9, max: 14, requiredIlvl: 16 })
        ])
    },
    {
        id: "implicit_precise_crit",
        group: "implicit",
        statPath: "critChance",
        type: "flat",
        tiers: Object.freeze([
            Object.freeze({ tier: 1, min: 0.01, max: 0.015, requiredIlvl: 1 }),
            Object.freeze({ tier: 2, min: 0.016, max: 0.024, requiredIlvl: 10 }),
            Object.freeze({ tier: 3, min: 0.025, max: 0.035, requiredIlvl: 20 })
        ])
    },
    {
        id: "prefix_honed_slash",
        group: "prefix",
        statPath: "damage.slash.min",
        type: "flat",
        tiers: Object.freeze([
            Object.freeze({ tier: 1, min: 2, max: 4, requiredIlvl: 1 }),
            Object.freeze({ tier: 2, min: 5, max: 8, requiredIlvl: 8 }),
            Object.freeze({ tier: 3, min: 9, max: 13, requiredIlvl: 16 })
        ])
    },
    {
        id: "prefix_crushing_blunt",
        group: "prefix",
        statPath: "damage.blunt.max",
        type: "flat",
        tiers: Object.freeze([
            Object.freeze({ tier: 1, min: 2, max: 5, requiredIlvl: 1 }),
            Object.freeze({ tier: 2, min: 6, max: 10, requiredIlvl: 10 }),
            Object.freeze({ tier: 3, min: 11, max: 16, requiredIlvl: 20 })
        ])
    },
    {
        id: "prefix_reinforced_armor",
        group: "prefix",
        statPath: "armor.blunt",
        type: "flat",
        tiers: Object.freeze([
            Object.freeze({ tier: 1, min: 3, max: 6, requiredIlvl: 1 }),
            Object.freeze({ tier: 2, min: 7, max: 11, requiredIlvl: 9 }),
            Object.freeze({ tier: 3, min: 12, max: 18, requiredIlvl: 18 })
        ])
    },
    {
        id: "suffix_of_swiftness",
        group: "suffix",
        statPath: "attackSpeed",
        type: "percent",
        tiers: Object.freeze([
            Object.freeze({ tier: 1, min: 0.03, max: 0.05, requiredIlvl: 1 }),
            Object.freeze({ tier: 2, min: 0.06, max: 0.09, requiredIlvl: 10 }),
            Object.freeze({ tier: 3, min: 0.10, max: 0.14, requiredIlvl: 20 })
        ])
    },
    {
        id: "suffix_of_vitality",
        group: "suffix",
        statPath: "life",
        type: "flat",
        tiers: Object.freeze([
            Object.freeze({ tier: 1, min: 8, max: 14, requiredIlvl: 1 }),
            Object.freeze({ tier: 2, min: 15, max: 24, requiredIlvl: 10 }),
            Object.freeze({ tier: 3, min: 25, max: 38, requiredIlvl: 20 })
        ])
    },
    {
        id: "suffix_of_learning",
        group: "suffix",
        statPath: "xpGainMultiplier",
        type: "percent",
        tiers: Object.freeze([
            Object.freeze({ tier: 1, min: 0.03, max: 0.06, requiredIlvl: 1 }),
            Object.freeze({ tier: 2, min: 0.07, max: 0.10, requiredIlvl: 10 }),
            Object.freeze({ tier: 3, min: 0.11, max: 0.16, requiredIlvl: 20 })
        ])
    }
]);

const _AFFIX_INDEX = Object.freeze(
    AFFIX_DEFS.reduce((acc, def) => {
        if (!def || !def.id) return acc;
        acc[def.id] = def;
        return acc;
    }, {})
);

function getAllAffixDefs() {
    return AFFIX_DEFS;
}

function getAffixDefById(affixId) {
    if (!affixId) return null;
    return _AFFIX_INDEX[affixId] || null;
}

function getAffixDefsByGroup(group) {
    if (!group) return [];
    return AFFIX_DEFS.filter((def) => def.group === group);
}

function getEligibleAffixTiers(affixDef, itemLevel) {
    if (!affixDef || !Array.isArray(affixDef.tiers)) return [];
    const ilvl = Math.max(1, Math.floor(Number.isFinite(itemLevel) ? itemLevel : 1));
    return affixDef.tiers
        .filter((tier) => tier && Number.isFinite(tier.requiredIlvl) && tier.requiredIlvl <= ilvl)
        .sort((a, b) => a.tier - b.tier);
}

if (typeof window !== "undefined") {
    window.AFFIX_DEFS = AFFIX_DEFS;
    window.getAllAffixDefs = getAllAffixDefs;
    window.getAffixDefById = getAffixDefById;
    window.getAffixDefsByGroup = getAffixDefsByGroup;
    window.getEligibleAffixTiers = getEligibleAffixTiers;
}

if (typeof module !== "undefined" && module.exports) {
    module.exports = {
        AFFIX_DEFS,
        getAllAffixDefs,
        getAffixDefById,
        getAffixDefsByGroup,
        getEligibleAffixTiers
    };
}
