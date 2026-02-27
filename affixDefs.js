/* AFFIX DEFINITIONS
 * Central affix/tier source for PoE-inspired item rolling.
 */

const _AFFIX_DEFS_SEED = Object.freeze([
    {
        id: "implicit_precise_crit",
        category: "weapon",
        group: "implicit",
        statPath: "critChance",
        type: "flat",
        tiers: Object.freeze([
            Object.freeze({ tier: 1, min: 0.004, max: 0.008, requiredIlvl: 1 }),
            Object.freeze({ tier: 2, min: 0.009, max: 0.014, requiredIlvl: 10 }),
            Object.freeze({ tier: 3, min: 0.015, max: 0.022, requiredIlvl: 20 })
        ])
    },
    {
        id: "implicit_weapon_honed_edge",
        category: "weapon",
        group: "implicit",
        statPath: "damageFlat",
        type: "flat",
        tiers: Object.freeze([
            Object.freeze({ tier: 1, min: 1, max: 2, requiredIlvl: 1 }),
            Object.freeze({ tier: 2, min: 2, max: 4, requiredIlvl: 10 }),
            Object.freeze({ tier: 3, min: 4, max: 6, requiredIlvl: 20 })
        ])
    },
    {
        id: "implicit_weapon_weighted_edge",
        category: "weapon",
        group: "implicit",
        statPath: "damageFlat",
        type: "flat",
        tiers: Object.freeze([
            Object.freeze({ tier: 1, min: 1, max: 3, requiredIlvl: 1 }),
            Object.freeze({ tier: 2, min: 3, max: 5, requiredIlvl: 10 }),
            Object.freeze({ tier: 3, min: 5, max: 8, requiredIlvl: 20 })
        ])
    },
    {
        id: "prefix_honed_slash",
        category: "weapon",
        group: "prefix",
        statPath: "damageFlat",
        type: "flat",
        tiers: Object.freeze([
            Object.freeze({ tier: 1, min: 1, max: 3, requiredIlvl: 1 }),
            Object.freeze({ tier: 2, min: 3, max: 6, requiredIlvl: 10 }),
            Object.freeze({ tier: 3, min: 6, max: 10, requiredIlvl: 20 })
        ])
    },
    {
        id: "prefix_crushing_blunt",
        category: "weapon",
        group: "prefix",
        statPath: "damageFlat",
        type: "flat",
        tiers: Object.freeze([
            Object.freeze({ tier: 1, min: 1, max: 3, requiredIlvl: 1 }),
            Object.freeze({ tier: 2, min: 3, max: 5, requiredIlvl: 10 }),
            Object.freeze({ tier: 3, min: 5, max: 9, requiredIlvl: 20 })
        ])
    },
    {
        id: "prefix_weapon_barbed_pierce",
        category: "weapon",
        group: "prefix",
        statPath: "damageFlat",
        type: "flat",
        tiers: Object.freeze([
            Object.freeze({ tier: 1, min: 1, max: 2, requiredIlvl: 1 }),
            Object.freeze({ tier: 2, min: 2, max: 4, requiredIlvl: 10 }),
            Object.freeze({ tier: 3, min: 4, max: 7, requiredIlvl: 20 })
        ])
    },
    {
        id: "prefix_weapon_tempered_slash",
        category: "weapon",
        group: "prefix",
        statPath: "damageFlat",
        type: "percent",
        tiers: Object.freeze([
            Object.freeze({ tier: 1, min: 0.03, max: 0.05, requiredIlvl: 1 }),
            Object.freeze({ tier: 2, min: 0.06, max: 0.09, requiredIlvl: 10 }),
            Object.freeze({ tier: 3, min: 0.1, max: 0.14, requiredIlvl: 20 })
        ])
    },
    {
        id: "prefix_weapon_heavy_blunt",
        category: "weapon",
        group: "prefix",
        statPath: "damageFlat",
        type: "flat",
        tiers: Object.freeze([
            Object.freeze({ tier: 1, min: 1, max: 2, requiredIlvl: 1 }),
            Object.freeze({ tier: 2, min: 2, max: 4, requiredIlvl: 10 }),
            Object.freeze({ tier: 3, min: 4, max: 7, requiredIlvl: 20 })
        ])
    },
    {
        id: "suffix_of_swiftness",
        category: "weapon",
        group: "suffix",
        statPath: "attackCooldownMs",
        type: "percent",
        tiers: Object.freeze([
            Object.freeze({ tier: 1, min: 0.03, max: 0.05, requiredIlvl: 1 }),
            Object.freeze({ tier: 2, min: 0.06, max: 0.09, requiredIlvl: 10 }),
            Object.freeze({ tier: 3, min: 0.1, max: 0.12, requiredIlvl: 20 })
        ])
    },
    {
        id: "suffix_weapon_precision",
        category: "weapon",
        group: "suffix",
        statPath: "critChance",
        type: "flat",
        tiers: Object.freeze([
            Object.freeze({ tier: 1, min: 0.005, max: 0.01, requiredIlvl: 1 }),
            Object.freeze({ tier: 2, min: 0.011, max: 0.017, requiredIlvl: 10 }),
            Object.freeze({ tier: 3, min: 0.018, max: 0.026, requiredIlvl: 20 })
        ])
    },
    {
        id: "suffix_weapon_stamina_flow",
        category: "weapon",
        group: "suffix",
        statPath: "staminaCost",
        type: "flat",
        tiers: Object.freeze([
            Object.freeze({ tier: 1, min: -1.5, max: -0.5, requiredIlvl: 1 }),
            Object.freeze({ tier: 2, min: -2.5, max: -1.2, requiredIlvl: 10 }),
            Object.freeze({ tier: 3, min: -3.5, max: -2.2, requiredIlvl: 20 })
        ])
    },
    {
        id: "suffix_weapon_learning",
        category: "weapon",
        group: "suffix",
        statPath: "staminaCost",
        type: "percent",
        tiers: Object.freeze([
            Object.freeze({ tier: 1, min: -0.06, max: -0.03, requiredIlvl: 1 }),
            Object.freeze({ tier: 2, min: -0.1, max: -0.06, requiredIlvl: 10 }),
            Object.freeze({ tier: 3, min: -0.14, max: -0.09, requiredIlvl: 20 })
        ])
    },
    {
        id: "implicit_guarded_slash",
        category: "armor",
        group: "implicit",
        statPath: "armor.slash",
        type: "flat",
        tiers: Object.freeze([
            Object.freeze({ tier: 1, min: 1, max: 3, requiredIlvl: 1 }),
            Object.freeze({ tier: 2, min: 3, max: 6, requiredIlvl: 10 }),
            Object.freeze({ tier: 3, min: 6, max: 10, requiredIlvl: 20 })
        ])
    },
    {
        id: "implicit_armor_guarded_pierce",
        category: "armor",
        group: "implicit",
        statPath: "armor.pierce",
        type: "flat",
        tiers: Object.freeze([
            Object.freeze({ tier: 1, min: 1, max: 3, requiredIlvl: 1 }),
            Object.freeze({ tier: 2, min: 3, max: 6, requiredIlvl: 10 }),
            Object.freeze({ tier: 3, min: 6, max: 10, requiredIlvl: 20 })
        ])
    },
    {
        id: "implicit_armor_guarded_blunt",
        category: "armor",
        group: "implicit",
        statPath: "armor.blunt",
        type: "flat",
        tiers: Object.freeze([
            Object.freeze({ tier: 1, min: 1, max: 3, requiredIlvl: 1 }),
            Object.freeze({ tier: 2, min: 3, max: 6, requiredIlvl: 10 }),
            Object.freeze({ tier: 3, min: 6, max: 10, requiredIlvl: 20 })
        ])
    },
    {
        id: "prefix_reinforced_armor",
        category: "armor",
        group: "prefix",
        statPath: "armor.blunt",
        type: "flat",
        tiers: Object.freeze([
            Object.freeze({ tier: 1, min: 2, max: 4, requiredIlvl: 1 }),
            Object.freeze({ tier: 2, min: 5, max: 8, requiredIlvl: 10 }),
            Object.freeze({ tier: 3, min: 9, max: 13, requiredIlvl: 20 })
        ])
    },
    {
        id: "prefix_armor_reinforced_slash",
        category: "armor",
        group: "prefix",
        statPath: "armor.slash",
        type: "flat",
        tiers: Object.freeze([
            Object.freeze({ tier: 1, min: 2, max: 4, requiredIlvl: 1 }),
            Object.freeze({ tier: 2, min: 5, max: 8, requiredIlvl: 10 }),
            Object.freeze({ tier: 3, min: 9, max: 13, requiredIlvl: 20 })
        ])
    },
    {
        id: "prefix_armor_reinforced_pierce",
        category: "armor",
        group: "prefix",
        statPath: "armor.pierce",
        type: "flat",
        tiers: Object.freeze([
            Object.freeze({ tier: 1, min: 2, max: 4, requiredIlvl: 1 }),
            Object.freeze({ tier: 2, min: 5, max: 8, requiredIlvl: 10 }),
            Object.freeze({ tier: 3, min: 9, max: 13, requiredIlvl: 20 })
        ])
    },
    {
        id: "prefix_armor_vital_plating",
        category: "armor",
        group: "prefix",
        statPath: "life",
        type: "flat",
        tiers: Object.freeze([
            Object.freeze({ tier: 1, min: 6, max: 12, requiredIlvl: 1 }),
            Object.freeze({ tier: 2, min: 13, max: 21, requiredIlvl: 10 }),
            Object.freeze({ tier: 3, min: 22, max: 34, requiredIlvl: 20 })
        ])
    },
    {
        id: "prefix_armor_enduring_core",
        category: "armor",
        group: "prefix",
        statPath: "stamina",
        type: "flat",
        tiers: Object.freeze([
            Object.freeze({ tier: 1, min: 4, max: 8, requiredIlvl: 1 }),
            Object.freeze({ tier: 2, min: 9, max: 14, requiredIlvl: 10 }),
            Object.freeze({ tier: 3, min: 15, max: 23, requiredIlvl: 20 })
        ])
    },
    {
        id: "suffix_armor_stamina_flow",
        category: "armor",
        group: "suffix",
        statPath: "staminaRegen",
        type: "flat",
        tiers: Object.freeze([
            Object.freeze({ tier: 1, min: 0.08, max: 0.16, requiredIlvl: 1 }),
            Object.freeze({ tier: 2, min: 0.17, max: 0.3, requiredIlvl: 10 }),
            Object.freeze({ tier: 3, min: 0.31, max: 0.48, requiredIlvl: 20 })
        ])
    },
    {
        id: "suffix_armor_weight_training",
        category: "armor",
        group: "suffix",
        statPath: "stamina",
        type: "percent",
        tiers: Object.freeze([
            Object.freeze({ tier: 1, min: 0.03, max: 0.05, requiredIlvl: 1 }),
            Object.freeze({ tier: 2, min: 0.06, max: 0.09, requiredIlvl: 10 }),
            Object.freeze({ tier: 3, min: 0.1, max: 0.13, requiredIlvl: 20 })
        ])
    },
    {
        id: "suffix_armor_burdenless",
        category: "armor",
        group: "suffix",
        statPath: "life",
        type: "percent",
        tiers: Object.freeze([
            Object.freeze({ tier: 1, min: 0.03, max: 0.05, requiredIlvl: 1 }),
            Object.freeze({ tier: 2, min: 0.06, max: 0.09, requiredIlvl: 10 }),
            Object.freeze({ tier: 3, min: 0.1, max: 0.14, requiredIlvl: 20 })
        ])
    },
    {
        id: "suffix_armor_mana_lining",
        category: "armor",
        group: "suffix",
        statPath: "mana",
        type: "flat",
        tiers: Object.freeze([
            Object.freeze({ tier: 1, min: 4, max: 8, requiredIlvl: 1 }),
            Object.freeze({ tier: 2, min: 9, max: 14, requiredIlvl: 10 }),
            Object.freeze({ tier: 3, min: 15, max: 23, requiredIlvl: 20 })
        ])
    },
    {
        id: "implicit_jewelry_vitality",
        category: "jewelry",
        group: "implicit",
        statPath: "life",
        type: "flat",
        tiers: Object.freeze([
            Object.freeze({ tier: 1, min: 5, max: 9, requiredIlvl: 1 }),
            Object.freeze({ tier: 2, min: 10, max: 16, requiredIlvl: 10 }),
            Object.freeze({ tier: 3, min: 17, max: 26, requiredIlvl: 20 })
        ])
    },
    {
        id: "implicit_jewelry_focus",
        category: "jewelry",
        group: "implicit",
        statPath: "mana",
        type: "flat",
        tiers: Object.freeze([
            Object.freeze({ tier: 1, min: 4, max: 8, requiredIlvl: 1 }),
            Object.freeze({ tier: 2, min: 9, max: 14, requiredIlvl: 10 }),
            Object.freeze({ tier: 3, min: 15, max: 23, requiredIlvl: 20 })
        ])
    },
    {
        id: "implicit_jewelry_endurance",
        category: "jewelry",
        group: "implicit",
        statPath: "stamina",
        type: "flat",
        tiers: Object.freeze([
            Object.freeze({ tier: 1, min: 4, max: 8, requiredIlvl: 1 }),
            Object.freeze({ tier: 2, min: 9, max: 14, requiredIlvl: 10 }),
            Object.freeze({ tier: 3, min: 15, max: 23, requiredIlvl: 20 })
        ])
    },
    {
        id: "prefix_jewelry_vitality",
        category: "jewelry",
        group: "prefix",
        statPath: "life",
        type: "flat",
        tiers: Object.freeze([
            Object.freeze({ tier: 1, min: 6, max: 12, requiredIlvl: 1 }),
            Object.freeze({ tier: 2, min: 13, max: 21, requiredIlvl: 10 }),
            Object.freeze({ tier: 3, min: 22, max: 34, requiredIlvl: 20 })
        ])
    },
    {
        id: "prefix_jewelry_focus",
        category: "jewelry",
        group: "prefix",
        statPath: "mana",
        type: "flat",
        tiers: Object.freeze([
            Object.freeze({ tier: 1, min: 5, max: 10, requiredIlvl: 1 }),
            Object.freeze({ tier: 2, min: 11, max: 18, requiredIlvl: 10 }),
            Object.freeze({ tier: 3, min: 19, max: 29, requiredIlvl: 20 })
        ])
    },
    {
        id: "prefix_jewelry_endurance",
        category: "jewelry",
        group: "prefix",
        statPath: "stamina",
        type: "flat",
        tiers: Object.freeze([
            Object.freeze({ tier: 1, min: 5, max: 9, requiredIlvl: 1 }),
            Object.freeze({ tier: 2, min: 10, max: 16, requiredIlvl: 10 }),
            Object.freeze({ tier: 3, min: 17, max: 25, requiredIlvl: 20 })
        ])
    },
    {
        id: "prefix_jewelry_critcraft",
        category: "jewelry",
        group: "prefix",
        statPath: "critChance",
        type: "flat",
        tiers: Object.freeze([
            Object.freeze({ tier: 1, min: 0.005, max: 0.01, requiredIlvl: 1 }),
            Object.freeze({ tier: 2, min: 0.011, max: 0.017, requiredIlvl: 10 }),
            Object.freeze({ tier: 3, min: 0.018, max: 0.026, requiredIlvl: 20 })
        ])
    },
    {
        id: "suffix_of_vitality",
        category: "jewelry",
        group: "suffix",
        statPath: "life",
        type: "percent",
        tiers: Object.freeze([
            Object.freeze({ tier: 1, min: 0.03, max: 0.05, requiredIlvl: 1 }),
            Object.freeze({ tier: 2, min: 0.06, max: 0.09, requiredIlvl: 10 }),
            Object.freeze({ tier: 3, min: 0.1, max: 0.14, requiredIlvl: 20 })
        ])
    },
    {
        id: "suffix_of_learning",
        category: "jewelry",
        group: "suffix",
        statPath: "mana",
        type: "percent",
        tiers: Object.freeze([
            Object.freeze({ tier: 1, min: 0.03, max: 0.05, requiredIlvl: 1 }),
            Object.freeze({ tier: 2, min: 0.06, max: 0.09, requiredIlvl: 10 }),
            Object.freeze({ tier: 3, min: 0.1, max: 0.14, requiredIlvl: 20 })
        ])
    },
    {
        id: "suffix_jewelry_swiftness",
        category: "jewelry",
        group: "suffix",
        statPath: "critChance",
        type: "flat",
        tiers: Object.freeze([
            Object.freeze({ tier: 1, min: 0.004, max: 0.008, requiredIlvl: 1 }),
            Object.freeze({ tier: 2, min: 0.009, max: 0.014, requiredIlvl: 10 }),
            Object.freeze({ tier: 3, min: 0.015, max: 0.022, requiredIlvl: 20 })
        ])
    },
    {
        id: "suffix_jewelry_stamina_flow",
        category: "jewelry",
        group: "suffix",
        statPath: "staminaRegen",
        type: "flat",
        tiers: Object.freeze([
            Object.freeze({ tier: 1, min: 0.08, max: 0.16, requiredIlvl: 1 }),
            Object.freeze({ tier: 2, min: 0.17, max: 0.3, requiredIlvl: 10 }),
            Object.freeze({ tier: 3, min: 0.31, max: 0.48, requiredIlvl: 20 })
        ])
    },
    {
        id: "suffix_jewelry_capacity",
        category: "jewelry",
        group: "suffix",
        statPath: "weightLimit",
        type: "flat",
        tiers: Object.freeze([
            Object.freeze({ tier: 1, min: 1, max: 2, requiredIlvl: 1 }),
            Object.freeze({ tier: 2, min: 2, max: 3, requiredIlvl: 10 }),
            Object.freeze({ tier: 3, min: 3, max: 5, requiredIlvl: 20 })
        ])
    }
]);

const _AFFIX_TIER_TARGET_COUNT = 12;
const _AFFIX_TIER_REQUIRED_ILVL_BY_TIER = Object.freeze([60, 50, 45, 40, 35, 30, 25, 20, 15, 10, 5, 1]);
const _AFFIX_TIER_GAMMA_PERCENT = 1.35;
const _AFFIX_TIER_GAMMA_FLAT = 1.6;

function _roundTierBound(value) {
    if (!Number.isFinite(value)) return 0;
    const precision = Math.abs(value) <= 1 ? 4 : 2;
    return Number(value.toFixed(precision));
}

function _normalizeSeedTiers(seedTiers) {
    if (!Array.isArray(seedTiers)) return [];
    return seedTiers
        .map((tier) => {
            if (!tier || typeof tier !== "object") return null;
            const min = Number(tier.min);
            const max = Number(tier.max);
            const requiredIlvl = Number(tier.requiredIlvl);
            if (!Number.isFinite(min) || !Number.isFinite(max) || !Number.isFinite(requiredIlvl)) return null;
            return {
                tier: Number.isFinite(tier.tier) ? Math.max(1, Math.floor(tier.tier)) : null,
                min: Math.min(min, max),
                max: Math.max(min, max),
                requiredIlvl: Math.max(1, Math.floor(requiredIlvl))
            };
        })
        .filter(Boolean)
        .sort((a, b) => a.requiredIlvl - b.requiredIlvl);
}

function _resolveTierGamma(seedTiers) {
    const normalizedSeed = _normalizeSeedTiers(seedTiers);
    if (normalizedSeed.length === 0) return _AFFIX_TIER_GAMMA_FLAT;
    const bestSeed = normalizedSeed[normalizedSeed.length - 1];
    const worstSeed = normalizedSeed[0];
    const magnitude = Math.max(
        Math.abs(bestSeed.min),
        Math.abs(bestSeed.max),
        Math.abs(worstSeed.min),
        Math.abs(worstSeed.max)
    );
    return magnitude <= 1 ? _AFFIX_TIER_GAMMA_PERCENT : _AFFIX_TIER_GAMMA_FLAT;
}

function _buildExpandedTiersFromSeed(seedTiers) {
    const normalizedSeed = _normalizeSeedTiers(seedTiers);
    if (normalizedSeed.length === 0) return Object.freeze([]);

    const worstSeed = normalizedSeed[0];
    const bestSeed = normalizedSeed[normalizedSeed.length - 1];
    const gamma = _resolveTierGamma(seedTiers);

    const output = [];
    for (let tierNumber = 1; tierNumber <= _AFFIX_TIER_TARGET_COUNT; tierNumber += 1) {
        const qualityLinear = (_AFFIX_TIER_TARGET_COUNT === 1)
            ? 1
            : (_AFFIX_TIER_TARGET_COUNT - tierNumber) / (_AFFIX_TIER_TARGET_COUNT - 1);
        const quality = Math.pow(qualityLinear, gamma);
        const interpolatedMin = worstSeed.min + ((bestSeed.min - worstSeed.min) * quality);
        const interpolatedMax = worstSeed.max + ((bestSeed.max - worstSeed.max) * quality);
        const requiredIlvl = _AFFIX_TIER_REQUIRED_ILVL_BY_TIER[tierNumber - 1] || 1;
        output.push(Object.freeze({
            tier: tierNumber,
            min: _roundTierBound(interpolatedMin),
            max: _roundTierBound(interpolatedMax),
            requiredIlvl: Math.max(1, Math.floor(requiredIlvl))
        }));
    }
    return Object.freeze(output);
}

const AFFIX_DEFS = Object.freeze(
    _AFFIX_DEFS_SEED.map((def) => {
        if (!def || typeof def !== "object") return def;
        return Object.freeze({
            ...def,
            tiers: _buildExpandedTiersFromSeed(def.tiers)
        });
    })
);

const AFFIX_CATEGORY_POOLS = Object.freeze({
    weapon: Object.freeze({
        implicit: Object.freeze([
            Object.freeze({ affixId: "implicit_precise_crit", weight: 2 }),
            Object.freeze({ affixId: "implicit_weapon_honed_edge", weight: 4 }),
            Object.freeze({ affixId: "implicit_weapon_weighted_edge", weight: 4 })
        ]),
        prefix: Object.freeze([
            Object.freeze({ affixId: "prefix_honed_slash", weight: 4 }),
            Object.freeze({ affixId: "prefix_crushing_blunt", weight: 3 }),
            Object.freeze({ affixId: "prefix_weapon_barbed_pierce", weight: 3 }),
            Object.freeze({ affixId: "prefix_weapon_tempered_slash", weight: 2 }),
            Object.freeze({ affixId: "prefix_weapon_heavy_blunt", weight: 3 })
        ]),
        suffix: Object.freeze([
            Object.freeze({ affixId: "suffix_of_swiftness", weight: 4 }),
            Object.freeze({ affixId: "suffix_weapon_precision", weight: 3 }),
            Object.freeze({ affixId: "suffix_weapon_stamina_flow", weight: 3 }),
            Object.freeze({ affixId: "suffix_weapon_learning", weight: 2 })
        ])
    }),
    armor: Object.freeze({
        implicit: Object.freeze([
            Object.freeze({ affixId: "implicit_guarded_slash", weight: 3 }),
            Object.freeze({ affixId: "implicit_armor_guarded_pierce", weight: 3 }),
            Object.freeze({ affixId: "implicit_armor_guarded_blunt", weight: 3 })
        ]),
        prefix: Object.freeze([
            Object.freeze({ affixId: "prefix_reinforced_armor", weight: 3 }),
            Object.freeze({ affixId: "prefix_armor_reinforced_slash", weight: 3 }),
            Object.freeze({ affixId: "prefix_armor_reinforced_pierce", weight: 3 }),
            Object.freeze({ affixId: "prefix_armor_vital_plating", weight: 3 }),
            Object.freeze({ affixId: "prefix_armor_enduring_core", weight: 2 })
        ]),
        suffix: Object.freeze([
            Object.freeze({ affixId: "suffix_armor_stamina_flow", weight: 3 }),
            Object.freeze({ affixId: "suffix_armor_weight_training", weight: 3 }),
            Object.freeze({ affixId: "suffix_armor_burdenless", weight: 2 }),
            Object.freeze({ affixId: "suffix_armor_mana_lining", weight: 3 })
        ])
    }),
    jewelry: Object.freeze({
        implicit: Object.freeze([
            Object.freeze({ affixId: "implicit_jewelry_vitality", weight: 3 }),
            Object.freeze({ affixId: "implicit_jewelry_focus", weight: 3 }),
            Object.freeze({ affixId: "implicit_jewelry_endurance", weight: 3 })
        ]),
        prefix: Object.freeze([
            Object.freeze({ affixId: "prefix_jewelry_vitality", weight: 3 }),
            Object.freeze({ affixId: "prefix_jewelry_focus", weight: 3 }),
            Object.freeze({ affixId: "prefix_jewelry_endurance", weight: 3 }),
            Object.freeze({ affixId: "prefix_jewelry_critcraft", weight: 2 })
        ]),
        suffix: Object.freeze([
            Object.freeze({ affixId: "suffix_of_vitality", weight: 3 }),
            Object.freeze({ affixId: "suffix_of_learning", weight: 3 }),
            Object.freeze({ affixId: "suffix_jewelry_swiftness", weight: 2 }),
            Object.freeze({ affixId: "suffix_jewelry_stamina_flow", weight: 3 }),
            Object.freeze({ affixId: "suffix_jewelry_capacity", weight: 2 })
        ])
    })
});

const _AFFIX_INDEX = Object.freeze(
    AFFIX_DEFS.reduce((acc, def) => {
        if (!def || !def.id) return acc;
        acc[def.id] = def;
        return acc;
    }, {})
);

function _normalizeAffixCategory(category) {
    if (typeof category !== "string") return null;
    const value = category.trim().toLowerCase();
    if (value === "weapon" || value === "armor" || value === "jewelry") return value;
    if (value === "accessory") return "jewelry";
    return null;
}

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

function getAffixDefsByCategory(category) {
    const normalizedCategory = _normalizeAffixCategory(category);
    if (!normalizedCategory) return [];
    return AFFIX_DEFS.filter((def) => def.category === normalizedCategory);
}

function getAffixDefsByCategoryGroup(category, group) {
    const normalizedCategory = _normalizeAffixCategory(category);
    if (!normalizedCategory || !group) return [];
    return AFFIX_DEFS.filter((def) => def.category === normalizedCategory && def.group === group);
}

function getAffixPoolByCategoryGroup(category, group) {
    const normalizedCategory = _normalizeAffixCategory(category);
    if (!normalizedCategory || !group) return [];
    const byCategory = AFFIX_CATEGORY_POOLS[normalizedCategory];
    if (!byCategory || !Array.isArray(byCategory[group])) return [];
    return byCategory[group];
}

function getAffixCategoryPools() {
    return AFFIX_CATEGORY_POOLS;
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
    window.AFFIX_CATEGORY_POOLS = AFFIX_CATEGORY_POOLS;
    window.getAllAffixDefs = getAllAffixDefs;
    window.getAffixDefById = getAffixDefById;
    window.getAffixDefsByGroup = getAffixDefsByGroup;
    window.getAffixDefsByCategory = getAffixDefsByCategory;
    window.getAffixDefsByCategoryGroup = getAffixDefsByCategoryGroup;
    window.getAffixPoolByCategoryGroup = getAffixPoolByCategoryGroup;
    window.getAffixCategoryPools = getAffixCategoryPools;
    window.getEligibleAffixTiers = getEligibleAffixTiers;
}

if (typeof module !== "undefined" && module.exports) {
    module.exports = {
        AFFIX_DEFS,
        AFFIX_CATEGORY_POOLS,
        getAllAffixDefs,
        getAffixDefById,
        getAffixDefsByGroup,
        getAffixDefsByCategory,
        getAffixDefsByCategoryGroup,
        getAffixPoolByCategoryGroup,
        getAffixCategoryPools,
        getEligibleAffixTiers
    };
}
