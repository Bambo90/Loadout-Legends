/* ITEM FILE: Armor Gloves
 * Contains concrete item defs (body/aura, optional dropWeight).
 * ilvl/tier/roll ranges are handled upstream by affix/generator systems.
 */

const ITEMS_GLOVES_DEFAULT_ROTATIONS = {
    0: { grid: [["A", "A", "A", "A"], ["A", "B", "B", "A"], ["A", "B", "B", "A"], ["A", "A", "A", "A"]] },
    1: { grid: [["A", "A", "A", "A"], ["A", "B", "B", "A"], ["A", "B", "B", "A"], ["A", "A", "A", "A"]] },
    2: { grid: [["A", "A", "A", "A"], ["A", "B", "B", "A"], ["A", "B", "B", "A"], ["A", "A", "A", "A"]] },
    3: { grid: [["A", "A", "A", "A"], ["A", "B", "B", "A"], ["A", "B", "B", "A"], ["A", "A", "A", "A"]] }
};

const ITEMS_ARMOR_GLOVES = [
    {
        id: "glove_A",
        name: "Lederhandschuhe",
        type: "armor",
        rarity: "common",
        icon: "🧤",
        price: 20,
        inShop: true,
        req: 1,
        tags: ["armor", "gloves"],
        armour: 2,
        evasion: 0,
        auraShield: 0,
        desc: "Einfache Handschuhe aus Leder.",
        sprite: "Media/Images/Items/Gloves/Leather_Gloves_A.png",
        spriteAnchorCell: null,
        spriteOffsetX: 0,
        spriteOffsetY: 0,
        spriteAnchorOffsetItemPx: null
    },
    {
        id: "glove_B",
        name: "Bronzehandschuhe",
        type: "armor",
        rarity: "magic",
        icon: "🧤",
        price: 90,
        inShop: true,
        req: 4,
        tags: ["armor", "gloves"],
        armour: 6,
        evasion: 2,
        auraShield: 0,
        desc: "Handschutz aus Bronze mit stabilen Nähten.",
        sprite: null,
        spriteAnchorCell: null,
        spriteOffsetX: 0,
        spriteOffsetY: 0,
        spriteAnchorOffsetItemPx: null
    },
    {
        id: "glove_C",
        name: "Stahlfäustlinge",
        type: "armor",
        rarity: "rare",
        icon: "🧤",
        price: 360,
        inShop: true,
        req: 8,
        tags: ["armor", "gloves"],
        armour: 11,
        evasion: 5,
        auraShield: 0,
        desc: "Verstärkte Fäustlinge gegen harte Treffer.",
        sprite: null,
        spriteAnchorCell: null,
        spriteOffsetX: 0,
        spriteOffsetY: 0,
        spriteAnchorOffsetItemPx: null
    },
    {
        id: "glove_D",
        name: "Runenhandschuhe",
        type: "armor",
        rarity: "unique",
        icon: "🧤",
        price: 1600,
        inShop: false,
        dropSources: ["archmage", "void_weaver"],
        dropChance: 0.06,
        req: 12,
        tags: ["armor", "gloves"],
        armour: 14,
        evasion: 8,
        auraShield: 13,
        desc: "Arkan bestickte Handschuhe mit Runenfäden.",
        sprite: null,
        spriteAnchorCell: null,
        spriteOffsetX: 0,
        spriteOffsetY: 0,
        spriteAnchorOffsetItemPx: null
    },
    {
        id: "glove_E",
        name: "Titanengriff",
        type: "armor",
        rarity: "legendary",
        icon: "🧤",
        price: 8800,
        inShop: false,
        dropSources: ["titanic_golem"],
        dropChance: 0.03,
        req: 20,
        tags: ["armor", "gloves"],
        armour: 24,
        evasion: 7,
        auraShield: 0,
        desc: "Legendäre Handschuhe aus titanischer Legierung.",
        sprite: null,
        spriteAnchorCell: null,
        spriteOffsetX: 0,
        spriteOffsetY: 0,
        spriteAnchorOffsetItemPx: null
    }
];

ITEMS_ARMOR_GLOVES.forEach((item) => {
    if (!item.rotations) {
        item.rotations = JSON.parse(JSON.stringify(ITEMS_GLOVES_DEFAULT_ROTATIONS));
    }
});

if (typeof window !== "undefined") {
    window.ITEMS_ARMOR_GLOVES = ITEMS_ARMOR_GLOVES;
}
