/* ITEM FILE: Armor Boots
 * Contains concrete item defs (body/aura, optional dropWeight).
 * ilvl/tier/roll ranges are handled upstream by affix/generator systems.
 */

const ITEMS_BOOTS_DEFAULT_ROTATIONS = {
    0: { grid: [["A", "A", "A", "A"], ["A", "A", "B", "A"], ["A", "B", "B", "A"], ["A", "A", "A", "A"]] },
    1: { grid: [["A", "A", "A", "A"], ["A", "B", "A", "A"], ["A", "B", "B", "A"], ["A", "A", "A", "A"]] },
    2: { grid: [["A", "A", "A", "A"], ["A", "B", "B", "A"], ["A", "B", "A", "A"], ["A", "A", "A", "A"]] },
    3: { grid: [["A", "A", "A", "A"], ["A", "B", "B", "A"], ["A", "A", "B", "A"], ["A", "A", "A", "A"]] }
};

const ITEMS_ARMOR_BOOTS = [
    {
        id: "boots_new_1",
        name: "Leinenstiefel",
        type: "armor",
        rarity: "common",
        icon: "🥾",
        price: 20,
        inShop: true,
        req: 1,
        tags: ["armor", "boots"],
        armour: 2,
        evasion: 0,
        auraShield: 0,
        desc: "Einfache Stiefel aus Leinen und Leder.",
        sprite: "Media/Images/Items/Boots/Boots_Leather_A.png",
        spriteAnchorCell: null,
        spriteOffsetX: 0,
        spriteOffsetY: 0,
        spriteAnchorOffsetItemPx: null
    },
    {
        id: "boots_new_2",
        name: "Bronzestiefel",
        type: "armor",
        rarity: "magic",
        icon: "🥾",
        price: 90,
        inShop: true,
        req: 4,
        tags: ["armor", "boots"],
        armour: 6,
        evasion: 2,
        auraShield: 0,
        desc: "Solide Bronzestiefel mit verstarkten Kappen.",
        sprite: null,
        spriteAnchorCell: null,
        spriteOffsetX: 20,
        spriteOffsetY: 0,
        spriteAnchorOffsetItemPx: null
    },
    {
        id: "boots_new_3",
        name: "Stahlgreifer",
        type: "armor",
        rarity: "rare",
        icon: "🥾",
        price: 360,
        inShop: true,
        req: 8,
        tags: ["armor", "boots"],
        armour: 11,
        evasion: 5,
        auraShield: 0,
        desc: "Verstarkte Stiefel fur harte Gefechte.",
        sprite: null,
        spriteAnchorCell: null,
        spriteOffsetX: 0,
        spriteOffsetY: 0,
        spriteAnchorOffsetItemPx: null
    },
    {
        id: "boots_new_4",
        name: "Runenstiefel",
        type: "armor",
        rarity: "unique",
        icon: "🥾",
        price: 1600,
        inShop: true,
        dropSources: ["archmage", "void_weaver"],
        dropChance: 0.06,
        req: 12,
        tags: ["armor", "boots"],
        armour: 14,
        evasion: 8,
        auraShield: 13,
        desc: "Arkan gewebte Stiefel mit Runenschutz.",
        sprite: null,
        spriteAnchorCell: null,
        spriteOffsetX: 0,
        spriteOffsetY: 0,
        spriteAnchorOffsetItemPx: null
    },
    {
        id: "boots_new_5",
        name: "Titanenschritt",
        type: "armor",
        rarity: "legendary",
        icon: "🥾",
        price: 8800,
        inShop: true,
        dropSources: ["titanic_golem"],
        dropChance: 0.03,
        req: 20,
        tags: ["armor", "boots"],
        armour: 24,
        evasion: 7,
        auraShield: 0,
        desc: "Legendare Stiefel aus titanischer Legierung.",
        sprite: null,
        spriteAnchorCell: null,
        spriteOffsetX: 0,
        spriteOffsetY: 0,
        spriteAnchorOffsetItemPx: null
    }
];

ITEMS_ARMOR_BOOTS.forEach((item) => {
    if (!item.rotations) {
        item.rotations = JSON.parse(JSON.stringify(ITEMS_BOOTS_DEFAULT_ROTATIONS));
    }
});

if (typeof window !== "undefined") {
    window.ITEMS_ARMOR_BOOTS = ITEMS_ARMOR_BOOTS;
}
