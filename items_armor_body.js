/* ITEM FILE: Armor Body
 * Contains concrete item defs (body/aura, optional dropWeight).
 * ilvl/tier/roll ranges are handled upstream by affix/generator systems.
 */

const ITEMS_ARMOR_DEFAULT_ROTATIONS = {
  // rot0: hochkant, fehlende Spalte RECHTS
  0: { grid: [
    ["A","A","A","A","0"],
    ["A","B","B","A","0"],
    ["A","B","B","A","0"],
    ["A","B","B","A","0"],
    ["A","A","A","A","0"],
  ]},

  // rot1: quer, fehlende Zeile UNTEN
  1: { grid: [
    ["A","A","A","A","A"],
    ["A","B","B","B","A"],
    ["A","B","B","B","A"],
    ["A","A","A","A","A"],
    ["0","0","0","0","0"],
  ]},

  // rot2: hochkant, fehlende Spalte LINKS (Spiegel von rot0)
  2: { grid: [
    ["0","A","A","A","A"],
    ["0","A","B","B","A"],
    ["0","A","B","B","A"],
    ["0","A","B","B","A"],
    ["0","A","A","A","A"],
  ]},

  // rot3: quer, fehlende Zeile OBEN (Spiegel von rot1)
  3: { grid: [
    ["0","0","0","0","0"],
    ["A","A","A","A","A"],
    ["A","B","B","B","A"],
    ["A","B","B","B","A"],
    ["A","A","A","A","A"],
  ]},
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
        armour: 5,
        evasion: 3,
        auraShield: 0,
        desc: "Einfache Leinenkleidung, bietet minimalen Schutz.",
        sprite: "Media/Images/Items/Armours/Bronze_A.png",
        spriteAnchorCell: null,
        spriteOffsetX: 0,
        spriteOffsetY: 0,
        spriteAnchorOffsetItemPx: { x: -30, y: 0 },
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
        armour: 12,
        evasion: 11,
        auraShield: 0,
        desc: "Schwere Bronzerüstung, robust und zuverlässig.",
        sprite: "Media/Images/Items/Armours/Bronze_A.png",
        spriteAnchorCell: null,
        spriteOffsetX: 0,
        spriteOffsetY: 0,
        spriteAnchorOffsetItemPx: { x: -30, y: 0 },
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
        armour: 22,
        evasion: 33,
        auraShield: 26,
        desc: "Elegante Plattenkombination aus feinem Mithril.",
         sprite: "Media/Images/Items/Armours/Bronze_A.png",
        spriteAnchorCell: null,
        spriteOffsetX: 0,
        spriteOffsetY: 0,
        spriteAnchorOffsetItemPx: { x: -30, y: 0 },
    },
    {
        id: "armor_new_4",
        name: "Mystische Robe",
        type: "armor",
        rarity: "unique",
        icon: "👘",
        price: 2200,
        inShop: true,
        dropSources: ["archmage", "void_weaver"],
        dropChance: 0.06,
        req: 11,
        tags: ["armor", "body"],
        armour: 18,
        evasion: 38,
        auraShield: 29,
        desc: "Eine mystische Robe, die zwischen Welten flüstert.",
        sprite: "Media/Images/Items/Armours/Bronze_A.png",
        spriteAnchorCell: null,
        spriteOffsetX: 0,
        spriteOffsetY: 0,
        spriteAnchorOffsetItemPx: { x: -30, y: 0 },
    },
    {
        id: "armor_new_5",
        name: "Der Titane Kampfanzug",
        type: "armor",
        rarity: "legendary",
        icon: "🛡️",
        price: 12000,
        inShop: true,
        dropSources: ["titanic_golem"],
        dropChance: 0.03,
        req: 20,
        tags: ["armor", "body"],
        armour: 45,
        evasion: 0,
        auraShield: 0,
        desc: "Die ultimative Rüstung, geschmiedet im Mithril-Hochofen.",
         sprite: "Media/Images/Items/Armours/Bronze_A.png",
        spriteAnchorCell: null,
        spriteOffsetX: 0,
        spriteOffsetY: 0,
        spriteAnchorOffsetItemPx: { x: -30, y: 0 },
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
