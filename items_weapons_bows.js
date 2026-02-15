/* ITEM FILE: Weapons Bows
 * Contains concrete item defs (body/aura, optional dropWeight).
 * ilvl/tier/roll ranges are handled upstream by affix/generator systems.
 */

const ITEMS_WEAPONS_BOWS = [
    {
        id: "bow_new_1",
        name: "Langbogen",
        type: "bow",
        rarity: "common",
        icon: "🏹",
        price: 45,
        inShop: true,
        req: 2,
        damage: 6,
        attackSpeed: 1.8,
        accuracy: 0.85,
        desc: "Ein klassischer Holzbogen mit anständiger Reichweite.",
        rotations: {
            0: { grid: [["AB", "A", "A"], ["AB", "B", "A"], ["AB", "A", "A"], ["A", "0", "A"]] },
            1: { grid: [["A", "A", "A", "A"], ["0", "AB", "0", "A"], ["0", "A", "0", "A"]] },
            2: { grid: [["A", "B", "A"], ["AB", "AB", "A"], ["A", "B", "A"], ["A", "A", "A"]] },
            3: { grid: [["A", "B", "A", "0"], ["AB", "B", "AB", "0"], ["A", "A", "A", "A"]] }
        }
    },
    {
        id: "bow_new_2",
        name: "Kompositbogen",
        type: "bow",
        rarity: "magic",
        icon: "🏹",
        price: 180,
        inShop: true,
        req: 5,
        damage: 13,
        attackSpeed: 1.5,
        accuracy: 0.92,
        piercing: 0.15,
        desc: "Ein moderner Bogen aus Laminate, sehr präzise.",
        rotations: {
            0: { grid: [["AB", "AB", "A", "A"], ["AB", "B", "B", "AB"], ["A", "0", "0", "A"], ["AB", "AB", "AB", "AB"], ["AB", "AB", "A", "A"]] },
            1: { grid: [["A", "A", "A", "AB", "A"], ["AB", "AB", "AB", "AB", "AB"], ["0", "0", "0", "0", "A"], ["0", "0", "0", "0", "A"], ["0", "AB", "AB", "AB", "AB"]] },
            2: { grid: [["A", "A", "A", "A"], ["AB", "B", "B", "AB"], ["A", "0", "0", "A"], ["AB", "AB", "AB", "AB"], ["AB", "AB", "A", "A"]] },
            3: { grid: [["A", "AB", "AB", "AB", "AB"], ["AB", "AB", "AB", "AB", "A"], ["0", "0", "0", "0", "A"], ["0", "0", "0", "0", "A"], ["0", "AB", "AB", "AB", "AB"]] }
        }
    },
    {
        id: "bow_new_3",
        name: "Eismondbogen",
        type: "bow",
        rarity: "rare",
        icon: "🏹",
        price: 850,
        inShop: true,
        req: 9,
        damage: 25,
        attackSpeed: 1.2,
        accuracy: 0.95,
        coldBonus: 1.2,
        armorIgnore: 0.2,
        desc: "Ein frostiger Bogen aus Eismithril.",
        rotations: {
            0: { grid: [["AB", "AB", "A", "A", "A"], ["AB", "B", "B", "B", "AB"], ["A", "0", "0", "0", "A"], ["A", "0", "0", "0", "A"], ["AB", "B", "B", "B", "AB"], ["AB", "AB", "A", "A", "A"]] },
            1: { grid: [["A", "A", "A", "A", "A", "A"], ["AB", "AB", "AB", "AB", "AB", "A"], ["0", "0", "0", "0", "0", "A"], ["0", "0", "0", "0", "0", "A"], ["0", "0", "0", "0", "0", "A"], ["0", "AB", "AB", "AB", "AB", "A"]] },
            2: { grid: [["A", "A", "A", "A", "A"], ["AB", "B", "B", "B", "AB"], ["A", "0", "0", "0", "A"], ["A", "0", "0", "0", "A"], ["AB", "B", "B", "B", "AB"], ["AB", "AB", "A", "A", "A"]] },
            3: { grid: [["A", "AB", "AB", "AB", "AB", "A"], ["AB", "AB", "AB", "AB", "AB", "A"], ["0", "0", "0", "0", "0", "A"], ["0", "0", "0", "0", "0", "A"], ["0", "0", "0", "0", "0", "A"], ["0", "AB", "AB", "AB", "AB", "A"]] }
        }
    },
    {
        id: "bow_new_4",
        name: "Flammenfeuer",
        type: "bow",
        rarity: "unique",
        icon: "🔥",
        price: 3500,
        inShop: false,
        dropSources: ["phoenix", "fire_dragon"],
        dropChance: 0.07,
        req: 14,
        damage: 38,
        attackSpeed: 1.4,
        fireBonus: 1.8,
        desc: "Ein Bogen aus Phoenixholz, der Pfeile in Flammen verwandelt.",
        rotations: {
            0: { grid: [["A", "A", "A", "A", "A"], ["AB", "AB", "B", "B", "AB"], ["A", "0", "0", "0", "A"], ["A", "0", "0", "0", "A"], ["AB", "AB", "B", "B", "AB"], ["A", "A", "A", "A", "A"]] },
            1: { grid: [["A", "A", "A", "A", "A", "A"], ["AB", "AB", "AB", "AB", "AB", "A"], ["0", "0", "0", "0", "0", "A"], ["0", "0", "0", "0", "0", "A"], ["0", "0", "0", "0", "0", "A"], ["0", "AB", "AB", "AB", "AB", "A"]] },
            2: { grid: [["A", "A", "A", "A", "A"], ["A", "B", "B", "B", "AB"], ["A", "0", "0", "0", "A"], ["A", "0", "0", "0", "A"], ["AB", "AB", "B", "B", "AB"], ["A", "A", "A", "A", "A"]] },
            3: { grid: [["A", "AB", "AB", "AB", "AB", "A"], ["AB", "AB", "AB", "AB", "AB", "A"], ["0", "0", "0", "0", "0", "A"], ["0", "0", "0", "0", "0", "A"], ["0", "0", "0", "0", "0", "A"], ["0", "AB", "AB", "AB", "AB", "A"]] }
        }
    },
    {
        id: "bow_new_5",
        name: "Dimensionriss",
        type: "bow",
        rarity: "legendary",
        icon: "⚡",
        price: 18000,
        inShop: false,
        dropSources: ["void_archer"],
        dropChance: 0.01,
        req: 26,
        damage: 60,
        attackSpeed: 1.6,
        chainBonus: 2.1,
        desc: "Ein rätselhafter Bogen, der zwischen Dimensionen reht.",
        rotations: {
            0: { grid: [["A", "A", "A", "A", "A", "A"], ["AB", "AB", "B", "B", "0", "AB"], ["A", "0", "0", "0", "0", "A"], ["A", "0", "0", "0", "0", "A"], ["AB", "AB", "B", "B", "0", "AB"], ["AB", "A", "B", "B", "0", "A"], ["AB", "A", "B", "B", "0", "A"]] },
            1: { grid: [["A", "A", "A", "A", "A", "A", "A"], ["AB", "AB", "AB", "AB", "AB", "AB", "A"], ["0", "0", "0", "0", "0", "0", "A"], ["0", "0", "0", "0", "0", "0", "A"], ["0", "0", "0", "0", "0", "0", "A"], ["0", "0", "0", "0", "0", "0", "A"], ["0", "AB", "AB", "AB", "AB", "AB", "A"]] },
            2: { grid: [["A", "A", "A", "A", "A", "A"], ["A", "B", "B", "B", "0", "AB"], ["A", "0", "0", "0", "0", "A"], ["A", "0", "0", "0", "0", "A"], ["AB", "AB", "B", "B", "0", "AB"], ["AB", "A", "B", "B", "0", "A"], ["AB", "A", "B", "B", "0", "A"]] },
            3: { grid: [["A", "AB", "AB", "AB", "AB", "AB", "A"], ["AB", "AB", "AB", "AB", "AB", "AB", "A"], ["0", "0", "0", "0", "0", "0", "A"], ["0", "0", "0", "0", "0", "0", "A"], ["0", "0", "0", "0", "0", "0", "A"], ["0", "0", "0", "0", "0", "0", "A"], ["0", "AB", "AB", "AB", "AB", "AB", "A"]] }
        }
    },
    {
        id: "bow_1",
        name: "Verwitterter Langbogen",
        type: "weapon",
        rarity: "magic",
        icon: "🏹",
        price: 450,
        req: 6,
        damage: 12,
        desc: "Hält gerade noch so zusammen.",
        rotations: {
            0: { grid: [["A", "AB", "A"], ["0", "AB", "0"], ["0", "AB", "0"], ["0", "AB", "0"], ["0", "A", "0"]] },
            1: { grid: [["0", "A", "A", "A"], ["AB", "AB", "B", "AB"], ["0", "A", "A", "A"], ["0", "A", "A", "A"]] },
            2: { grid: [["0", "AB", "0"], ["0", "AB", "0"], ["0", "AB", "0"], ["A", "AB", "A"]] },
            3: { grid: [["A", "A", "A", "0"], ["AB", "B", "AB", "AB"], ["A", "A", "A", "0"], ["A", "A", "A", "0"]] }
        }
    }
];

if (typeof window !== "undefined") {
    window.ITEMS_WEAPONS_BOWS = ITEMS_WEAPONS_BOWS;
}
