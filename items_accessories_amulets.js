/* ITEM FILE: Accessories Amulets
 * Contains concrete item defs (body/aura, optional dropWeight).
 * ilvl/tier/roll ranges are handled upstream by affix/generator systems.
 */

const ITEMS_ACCESSORIES_AMULETS = [
    {
        id: "acc_new_brooch_1",
        name: "Einfache Schließe",
        type: "accessory",
        rarity: "common",
        icon: "🔌",
        price: 25,
        inShop: true,
        req: 1,
        defense: 3,
        desc: "Eine verstärkte Schließe für jede Robe.",
        rotations: {
            0: { grid: [["A", "A", "A"], ["A", "B", "A"], ["A", "A", "A"]] },
            1: { grid: [["A", "0", "A"], ["A", "B", "A"], ["A", "A", "A"]] },
            2: { grid: [["A", "A", "A"], ["A", "B", "A"], ["A", "0", "A"]] },
            3: { grid: [["A", "A", "A"], ["A", "B", "A"], ["A", "0", "A"]] }
        }
    },
    {
        id: "acc_new_brooch_2",
        name: "Verzierte Schließe",
        type: "accessory",
        rarity: "magic",
        icon: "🔌",
        price: 120,
        inShop: true,
        req: 5,
        defense: 6,
        evasion: 0.1,
        desc: "Eine kunstvoll gestaltete Schließe.",
        rotations: {
            0: { grid: [["A", "A", "A"], ["A", "B", "A"], ["A", "A", "A"]] },
            1: { grid: [["A", "0", "A"], ["A", "B", "A"], ["A", "A", "A"]] },
            2: { grid: [["A", "A", "A"], ["A", "B", "A"], ["A", "0", "A"]] },
            3: { grid: [["A", "A", "A"], ["A", "B", "A"], ["A", "0", "A"]] }
        }
    },
    {
        id: "jew_new_3",
        name: "Goldkette",
        type: "jewelry",
        rarity: "rare",
        icon: "⛓️",
        price: 800,
        inShop: true,
        req: 9,
        life: 50,
        mana: 30,
        allResist: 0.08,
        desc: "Eine edle Goldkette mit ausgewogener Kraft.",
        rotations: {
            0: { grid: [["AB", "AB", "A"], ["AB", "B", "A"], ["A", "A", "A"]] },
            1: { grid: [["AB", "AB", "A"], ["AB", "B", "A"], ["A", "A", "A"]] },
            2: { grid: [["AB", "AB", "A"], ["AB", "B", "A"], ["A", "A", "A"]] },
            3: { grid: [["AB", "AB", "A"], ["AB", "B", "A"], ["A", "A", "A"]] }
        }
    },
    {
        id: "jew_new_4",
        name: "Sternenamulett",
        type: "jewelry",
        rarity: "unique",
        icon: "⭐",
        price: 3200,
        inShop: false,
        dropSources: ["celestial_being"],
        dropChance: 0.05,
        req: 12,
        life: 50,
        mana: 40,
        allResist: 0.12,
        critChance: 0.05,
        desc: "Ein glanzvoles Amulett, das Sternenlicht in Kraft umwandelt.",
        rotations: {
            0: { grid: [["A", "A", "A", "A", "A", "A"], ["A", "0", "B", "0", "0", "A"], ["A", "B", "B", "B", "0", "A"], ["A", "0", "B", "0", "0", "A"], ["0", "A", "B", "0", "A", "0"], ["0", "A", "0", "0", "A", "0"]] },
            1: { grid: [["0", "A", "A", "A", "A", "0"], ["A", "0", "0", "0", "0", "A"], ["A", "0", "B", "B", "B", "A"], ["A", "B", "B", "0", "0", "A"], ["A", "0", "0", "0", "0", "A"], ["0", "A", "A", "A", "A", "0"]] },
            2: { grid: [["0", "A", "0", "0", "A", "0"], ["0", "A", "B", "0", "A", "0"], ["A", "0", "B", "0", "0", "A"], ["A", "B", "B", "B", "0", "A"], ["A", "0", "B", "0", "0", "A"], ["A", "A", "A", "A", "A", "A"]] },
            3: { grid: [["0", "A", "A", "A", "A", "0"], ["A", "0", "0", "0", "0", "A"], ["A", "0", "0", "B", "B", "A"], ["A", "B", "B", "0", "0", "A"], ["A", "0", "0", "0", "0", "A"], ["0", "A", "A", "A", "A", "0"]] }
        }
    }
];

if (typeof window !== "undefined") {
    window.ITEMS_ACCESSORIES_AMULETS = ITEMS_ACCESSORIES_AMULETS;
}
