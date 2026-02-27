/* ITEM FILE: Armor Helmets
 * Contains concrete item defs (body/aura, optional dropWeight).
 * ilvl/tier/roll ranges are handled upstream by affix/generator systems.
 */

const ITEMS_HELMETS_DEFAULT_ROTATIONS = {
    0: { grid: [["A", "A", "A", "A"], ["A", "B", "B", "A"], ["A", "B", "B", "A"], ["A", "A", "A", "A"]] },
    1: { grid: [["A", "A", "A", "A"], ["A", "B", "B", "A"], ["A", "B", "B", "A"], ["A", "A", "A", "A"]] },
    2: { grid: [["A", "A", "A", "A"], ["A", "B", "B", "A"], ["A", "B", "B", "A"], ["A", "A", "A", "A"]] },
    3: { grid: [["A", "A", "A", "A"], ["A", "B", "B", "A"], ["A", "B", "B", "A"], ["A", "A", "A", "A"]] }
};

const ITEMS_ARMOR_HELMETS = [
    {
        id: "helmet_new_1",
        name: "Lederkappe",
        type: "armor",
        rarity: "common",
        icon: "🪖",
        price: 25,
        inShop: true,
        req: 1,
        tags: ["armor", "helmet"],
        armour: 3,
        evasion: 1,
        auraShield: 1000,
        desc: "Leichte Kappe mit einfacher Polsterung.",
        sprite: "Media/Images/Items/Helmets/Leather_Cap_A.png",
        spriteAnchorCell: null,
        spriteOffsetX: 0,
        spriteOffsetY: 0,
        spriteAnchorOffsetItemPx: null
    },
    {
        id: "helmet_new_2",
        name: "Bronzehelm",
        type: "armor",
        rarity: "magic",
        icon: "🪖",
        price: 100,
        inShop: true,
        req: 4,
        tags: ["armor", "helmet"],
        armour: 8,
        evasion: 4,
        auraShield: 0,
        desc: "Solider Helm aus Bronze.",
        sprite: "Media/Images/Items/Helmets/Iron_Helmet_A.png",
        spriteAnchorCell: null,
        spriteOffsetX: 0,
        spriteOffsetY: 0,
        spriteAnchorOffsetItemPx: null
    },
    {
        id: "helmet_new_3",
        name: "Stahlvisier",
        type: "armor",
        rarity: "rare",
        icon: "🪖",
        price: 420,
        inShop: true,
        req: 8,
        tags: ["armor", "helmet"],
        armour: 14,
        evasion: 8,
        auraShield: 0,
        desc: "Verstärktes Visier mit guter Schlagabwehr.",
        sprite: null,
        spriteAnchorCell: null,
        spriteOffsetX: 0,
        spriteOffsetY: 0,
        spriteAnchorOffsetItemPx: null
    },
    {
        id: "helmet_new_4",
        name: "Runenhaube",
        type: "armor",
        rarity: "unique",
        icon: "🪖",
        price: 1800,
        inShop: false,
        dropSources: ["archmage", "void_weaver"],
        dropChance: 0.06,
        req: 12,
        tags: ["armor", "helmet"],
        armour: 18,
        evasion: 13,
        auraShield: 20,
        desc: "Runenverstärkte Haube mit arkanem Schutz.",
        sprite: null,
        spriteAnchorCell: null,
        spriteOffsetX: 0,
        spriteOffsetY: 0,
        spriteAnchorOffsetItemPx: null
    },
    {
        id: "helmet_new_5",
        name: "Titanenkrone",
        type: "armor",
        rarity: "legendary",
        icon: "🪖",
        price: 9500,
        inShop: false,
        dropSources: ["titanic_golem"],
        dropChance: 0.03,
        req: 20,
        tags: ["armor", "helmet"],
        armour: 30,
        evasion: 11,
        auraShield: 0,
        desc: "Schwere Helmkrone aus uraltem Titanmetall.",
        sprite: null,
        spriteAnchorCell: null,
        spriteOffsetX: 0,
        spriteOffsetY: 0,
        spriteAnchorOffsetItemPx: null
    }
];

ITEMS_ARMOR_HELMETS.forEach((item) => {
    if (!item.rotations) {
        item.rotations = JSON.parse(JSON.stringify(ITEMS_HELMETS_DEFAULT_ROTATIONS));
    }
});

if (typeof window !== "undefined") {
    window.ITEMS_ARMOR_HELMETS = ITEMS_ARMOR_HELMETS;
}
