/* ITEM DEFINITION - ARMOR (Defense) */

const ARMOR_ITEMS = [
    { 
        id: "armor_1", 
        name: "Leinenpanzer", 
        type: "armor",
        rarity: "common", 
        icon: "🥾", 
        price: 30, 
        inShop: true,  
        req: 1, 
        defense: 5,
        evasion: 0.1,
        desc: "Einfache Leinenkleidung, bietet minimalen Schutz.",

        body: [
            [1, 1, 1],
            [1, 1, 1],
            [0, 1, 0]
        ],

        aura: [
            [1, 1, 1, 1, 1],
            [1, 0, 0, 0, 1],
            [1, 0, 0, 0, 1],
            [1, 0, 0, 0, 1],
            [0, 1, 0, 1, 0]
        ]
    },

    { 
        id: "armor_2", 
        name: "Lederwams", 
        type: "armor",
        rarity: "magic", 
        icon: "🥾", 
        price: 120, 
        inShop: true,
        req: 4, 
        defense: 12,
        evasion: 0.15,
        durability: 1.1,
        desc: "Hochwertiges Leder mit guter Bewegungsfreihheit.",

        body: [
            [1, 1, 1],
            [1, 1, 1],
            [1, 1, 1],
            [0, 1, 0]
        ],

        aura: [
            [1, 1, 1, 1, 1, 1],
            [1, 0, 0, 0, 0, 1],
            [1, 0, 0, 0, 0, 1],
            [1, 0, 0, 0, 0, 1],
            [1, 0, 0, 0, 0, 1],
            [0, 1, 0, 0, 1, 0]
        ]
    },

    { 
        id: "armor_3", 
        name: "Stahlplatten-Brünne", 
        type: "armor",
        rarity: "rare", 
        icon: "🛡️", 
        price: 600, 
        inShop: true,
        req: 8, 
        defense: 28,
        evasion: -0.05,
        physicalReduction: 0.15,
        desc: "Schwere Stahlplattenrüstung, opfert Beweglichkeit für Schutz.",

        body: [
            [1, 1, 1],
            [1, 1, 1],
            [1, 1, 1],
            [1, 1, 1],
            [0, 1, 0]
        ],

        aura: [
            [1, 1, 1, 1, 1, 1],
            [1, 0, 0, 0, 0, 1],
            [1, 0, 0, 0, 0, 1],
            [1, 0, 0, 0, 0, 1],
            [1, 0, 0, 0, 0, 1],
            [1, 0, 0, 0, 0, 1],
            [0, 1, 1, 1, 1, 0]
        ]
    },

    { 
        id: "armor_4", 
        name: "Feenrobe der Undurchdringlichkeit", 
        type: "armor",
        rarity: "unique", 
        icon: "👻", 
        price: 2500, 
        inShop: false, 
        dropSources: ["shadow_lord"],
        dropChance: 0.06,
        req: 11, 
        defense: 18,
        evasion: 0.35,
        spectralDefense: 0.2,
        desc: "Eine mystische Robe, die zwischen Welten flüstert.",

        body: [
            [1, 1, 1],
            [1, 1, 1],
            [1, 1, 1],
            [0, 1, 0],
            [0, 1, 0]
        ],

        aura: [
            [1, 1, 1, 1, 1, 1, 1],
            [1, 0, 0, 0, 0, 0, 1],
            [1, 0, 0, 0, 0, 0, 1],
            [1, 0, 0, 0, 0, 0, 1],
            [0, 1, 0, 0, 0, 1, 0],
            [0, 1, 0, 0, 0, 1, 0],
            [0, 0, 0, 1, 0, 0, 0]
        ]
    },

    { 
        id: "armor_5", 
        name: "Titanium-Gottpanzer", 
        type: "armor",
        rarity: "legendary", 
        icon: "💎", 
        price: 20000, 
        inShop: false, 
        dropSources: ["ancient_titan"],
        dropChance: 0.01,
        req: 24, 
        defense: 65,
        evasion: 0.05,
        physicalReduction: 0.4,
        magicReduction: 0.2,
        desc: "Unvergleichliche Rüstung aus dem Zeitalter der Götter.",

        body: [
            [1, 1, 1],
            [1, 1, 1],
            [1, 1, 1],
            [1, 1, 1],
            [1, 1, 1],
            [0, 1, 0]
        ],

        aura: [
            [1, 1, 1, 1, 1, 1, 1, 1],
            [1, 0, 0, 0, 0, 0, 0, 1],
            [1, 0, 0, 0, 0, 0, 0, 1],
            [1, 0, 0, 0, 0, 0, 0, 1],
            [1, 0, 0, 0, 0, 0, 0, 1],
            [1, 0, 0, 0, 0, 0, 0, 1],
            [1, 0, 0, 0, 0, 0, 0, 1],
            [0, 1, 1, 1, 1, 1, 1, 0]
        ]
    }
];
