/* ITEM DEFINITION - TOOLS (Body + Aura vorbereitet) */

const TOOL_ITEMS = [
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

        body: [
            [1, 1, 1],
            [0, 1, 0],
            [0, 1, 0]
        ],

        aura: [
            [1,1,1,1,1],
            [1,0,0,0,1],
            [1,0,0,0,1],
            [1,1,1,1,1]
        ]
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
        speedBonus: 1.20, 
        desc: "Solider Stahl für ehrliche Arbeit.",

        body: [
            [1, 1, 1],
            [0, 1, 0],
            [0, 1, 0]
        ],

        aura: [
            [1,1,1,1,1],
            [1,0,0,0,1],
            [1,0,0,0,1],
            [1,1,1,1,1]
        ]
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

        body: [
            [1, 1, 1],
            [0, 1, 0],
            [0, 1, 0]
        ],

        aura: [
            [1,1,1,1,1],
            [1,0,0,0,1],
            [1,0,0,0,1],
            [1,1,1,1,1]
        ]
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
        speedBonus: 1.80, 
        desc: "Glänzt und arbeitet fast von allein.",

        body: [
            [1, 1, 1],
            [0, 1, 0],
            [0, 1, 0]
        ],

        aura: [
            [1,1,1,1,1],
            [1,0,0,0,1],
            [1,0,0,0,1],
            [1,1,1,1,1]
        ]
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
        speedBonus: 2.50, 
        desc: "Ein Relikt aus alter Zeit.",

        body: [
            [1, 1, 1],
            [0, 1, 0],
            [0, 1, 0]
        ],

        aura: [
            [1,1,1,1,1],
            [1,0,0,0,1],
            [1,0,0,0,1],
            [1,1,1,1,1]
        ]
    }
];
