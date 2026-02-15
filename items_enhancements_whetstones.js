/* ITEM FILE: Enhancement Whetstones
 * Contains concrete item defs (body/aura, optional dropWeight).
 * ilvl/tier/roll ranges are handled upstream by affix/generator systems.
 */

const ITEMS_ENHANCEMENTS_WHETSTONES = [
    {
        id: "pick_1",
        name: "Rostige Hacke",
        type: "tool",
        rarity: "common",
        icon: "⛏️",
        price: 25,
        inShop: true,
        req: 1,
        speedBonus: 1.05,
        desc: "Besser als mit den Händen zu graben.",
        rotations: {
            0: { grid: [["A", "A", "A"], ["0", "B", "0"], ["0", "A", "0"]] },
            1: { grid: [["0", "0", "A"], ["A", "B", "A"], ["0", "0", "A"]] },
            2: { grid: [["0", "A", "0"], ["0", "B", "0"], ["A", "A", "A"]] },
            3: { grid: [["A", "0", "0"], ["A", "B", "A"], ["A", "0", "0"]] }
        }
    },
    {
        id: "pick_2",
        name: "Eisen-Hacke",
        type: "tool",
        rarity: "magic",
        icon: "⛏️",
        price: 150,
        inShop: true,
        req: 3,
        speedBonus: 1.2,
        desc: "Solider Stahl für ehrliche Arbeit.",
        rotations: {
            0: { grid: [["A", "A", "A"], ["0", "B", "0"], ["0", "A", "0"]] },
            1: { grid: [["0", "0", "A"], ["A", "B", "A"], ["0", "0", "A"]] },
            2: { grid: [["0", "A", "0"], ["0", "B", "0"], ["A", "A", "A"]] },
            3: { grid: [["A", "0", "0"], ["A", "B", "A"], ["A", "0", "0"]] }
        }
    },
    {
        id: "pick_3",
        name: "Stahl-Spitzhacke",
        type: "tool",
        rarity: "rare",
        icon: "⛏️",
        price: 500,
        inShop: true,
        req: 7,
        speedBonus: 1.45,
        desc: "Damit knackst du jeden Fels.",
        rotations: {
            0: { grid: [["A", "A", "A"], ["0", "B", "0"], ["0", "A", "0"]] },
            1: { grid: [["0", "0", "A"], ["A", "B", "A"], ["0", "0", "A"]] },
            2: { grid: [["0", "A", "0"], ["0", "B", "0"], ["A", "A", "A"]] },
            3: { grid: [["A", "0", "0"], ["A", "B", "A"], ["A", "0", "0"]] }
        }
    },
    {
        id: "pick_4",
        name: "Goldschürfer",
        type: "tool",
        rarity: "unique",
        icon: "⛏️",
        price: 2000,
        inShop: false,
        dropSources: ["gold_golem", "treasure_mimic"],
        dropChance: 0.05,
        req: 12,
        speedBonus: 1.8,
        desc: "Glänzt und arbeitet fast von allein.",
        rotations: {
            0: { grid: [["A", "A", "A"], ["0", "B", "0"], ["0", "A", "0"]] },
            1: { grid: [["0", "0", "A"], ["A", "B", "A"], ["0", "0", "A"]] },
            2: { grid: [["0", "A", "0"], ["0", "B", "0"], ["A", "A", "A"]] },
            3: { grid: [["A", "0", "0"], ["A", "B", "A"], ["A", "0", "0"]] }
        }
    },
    {
        id: "pick_5",
        name: "Obsidian-Zerstörer",
        type: "tool",
        rarity: "legendary",
        icon: "⛏️",
        price: 10000,
        inShop: false,
        dropSources: ["lava_dragon"],
        dropChance: 0.01,
        req: 20,
        speedBonus: 2.5,
        desc: "Ein Relikt aus alter Zeit.",
        rotations: {
            0: { grid: [["A", "A", "A"], ["0", "B", "0"], ["0", "A", "0"]] },
            1: { grid: [["0", "0", "A"], ["A", "B", "A"], ["0", "0", "A"]] },
            2: { grid: [["0", "A", "0"], ["0", "B", "0"], ["A", "A", "A"]] },
            3: { grid: [["A", "0", "0"], ["A", "B", "A"], ["A", "0", "0"]] }
        }
    }
];

if (typeof window !== "undefined") {
    window.ITEMS_ENHANCEMENTS_WHETSTONES = ITEMS_ENHANCEMENTS_WHETSTONES;
}
