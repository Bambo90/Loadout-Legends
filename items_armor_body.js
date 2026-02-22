/* ITEM FILE: Armor Body
 * Contains concrete item defs (body/aura, optional dropWeight).
 * ilvl/tier/roll ranges are handled upstream by affix/generator systems.
 */

const ITEMS_ARMOR_DEFAULT_ROTATIONS = {
    0: { grid: [["A", "A", "A", "A"], ["A", "B", "B", "A"], ["A", "B", "B", "A"], ["A", "B", "B", "A"], ["A", "A", "A", "A"]] },
    1: { grid: [["A", "A", "A", "A", "A"], ["A", "B", "B", "B", "A"], ["A", "B", "B", "B", "A"], ["A", "A", "A", "A", "A"]] },
    2: { grid: [["A", "A", "A", "A"], ["A", "B", "B", "A"], ["A", "B", "B", "A"], ["A", "B", "B", "A"], ["A", "A", "A", "A"]] },
    3: { grid: [["A", "A", "A", "A", "A"], ["A", "B", "B", "B", "A"], ["A", "B", "B", "B", "A"], ["A", "A", "A", "A", "A"]] }
};

const ITEMS_ARMOR_BODY = [
    {
        id: "armor_new_1",
        name: "Leinenpanzer",
        type: "armor",
        rarity: "common",
        icon: "🥾",
        price: 30,
        inShop: true,
        req: 1,
        tags: ["armor", "body"],
        defense: 5,
        evasion: 0.1,
        desc: "Einfache Leinenkleidung, bietet minimalen Schutz."
    },
    {
        id: "armor_new_2",
        name: "Bronzerüstung",
        type: "armor",
        rarity: "magic",
        icon: "🥾",
        price: 120,
        inShop: true,
        req: 4,
        tags: ["armor", "body"],
        defense: 12,
        evasion: 0.15,
        durability: 1.1,
        desc: "Schwere Bronzerüstung, robust und zuverlässig.",
        sprite: "Media/Images/Items/Armours/Bronze_A.png"
    },
    {
        id: "armor_new_3",
        name: "Mantelpanzer",
        type: "armor",
        rarity: "rare",
        icon: "🥾",
        price: 500,
        inShop: true,
        req: 8,
        tags: ["armor", "body"],
        defense: 22,
        evasion: 0.25,
        magicReduction: 0.15,
        desc: "Elegante Plattenkombination aus feinem Mithril."
    },
    {
        id: "armor_new_4",
        name: "Mystische Robe",
        type: "armor",
        rarity: "unique",
        icon: "👘",
        price: 2200,
        inShop: false,
        dropSources: ["archmage", "void_weaver"],
        dropChance: 0.06,
        req: 11,
        tags: ["armor", "body"],
        defense: 18,
        evasion: 0.35,
        spectralDefense: 0.2,
        desc: "Eine mystische Robe, die zwischen Welten flüstert."
    },
    {
        id: "armor_new_5",
        name: "Der Titane Kampfanzug",
        type: "armor",
        rarity: "legendary",
        icon: "🛡️",
        price: 12000,
        inShop: false,
        dropSources: ["titanic_golem"],
        dropChance: 0.03,
        req: 20,
        tags: ["armor", "body"],
        defense: 45,
        evasion: -0.05,
        physicalReduction: 0.3,
        desc: "Die ultimative Rüstung, geschmiedet im Mithril-Hochofen."
    }
];

ITEMS_ARMOR_BODY.forEach((item) => {
    if (!item.rotations) {
        item.rotations = JSON.parse(JSON.stringify(ITEMS_ARMOR_DEFAULT_ROTATIONS));
    }
});

if (typeof window !== "undefined") {
    window.ITEMS_ARMOR_BODY = ITEMS_ARMOR_BODY;
}
