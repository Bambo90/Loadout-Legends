/* ITEM DEFINITION - SWORDS (Melee Weapons) */

const SWORD_ITEMS = [
    { 
        id: "sword_new_1", 
        name: "Kurzschert", 
        type: "sword",
        rarity: "common", 
        icon: "🗡️", 
        price: 50, 
        inShop: true,  
        req: 1, 
        damage: 8,
        attackSpeed: 1.4,
        desc: "Ein einfaches, aber zuverlässiges Schert für den Anfang.",

        body: [
            [1, 1],
            [0, 1],
            [0, 1]
        ],

        aura: [
            [1, 1, 1],
            [1, 0, 1],
            [1, 0, 1],
            [1, 0, 1]
        ]
    },

    { 
        id: "sword_new_2", 
        name: "Stahlschwert", 
        type: "sword",
        rarity: "magic", 
        icon: "🗡️", 
        price: 200, 
        inShop: true,
        req: 5, 
        damage: 18,
        attackSpeed: 1.3,
        lifeLeech: 0.05,
        desc: "Qualitativ hochwertiger Stahl mit Lebensraub-Eigenschaften.",

        body: [
            [1, 1],
            [0, 1],
            [0, 1],
            [0, 1]
        ],

        aura: [
            [1, 1, 1, 1],
            [1, 0, 0, 1],
            [1, 0, 0, 1],
            [1, 0, 0, 1],
            [1, 0, 0, 1]
        ]
    },

    { 
        id: "sword_new_3", 
        name: "Großschwert des Kriegers", 
        type: "sword",
        rarity: "rare", 
        icon: "🗡️", 
        price: 800, 
        inShop: true,
        req: 10, 
        damage: 35,
        attackSpeed: 0.9,
        physicalBonus: 1.25,
        desc: "Ein massives Zweihänder mit enormem Schaden, aber langsamer.",

        body: [
            [1],
            [1],
            [1],
            [1],
            [1]
        ],

        aura: [
            [1, 1, 1],
            [1, 0, 1],
            [1, 0, 1],
            [1, 0, 1],
            [1, 0, 1],
            [1, 0, 1]
        ]
    },

    { 
        id: "sword_new_4", 
        name: "Flammenzunge", 
        type: "sword",
        rarity: "unique", 
        icon: "🔥", 
        price: 3000, 
        inShop: false, 
        dropSources: ["fire_elementalist"],
        dropChance: 0.08,
        req: 15, 
        damage: 45,
        attackSpeed: 1.2,
        fireBonus: 1.5,
        desc: "Ein legendäres Schwert, das in Flammen lodert.",

        body: [
            [1, 1],
            [0, 1],
            [0, 1],
            [0, 1]
        ],

        aura: [
            [1, 1, 1, 1, 1],
            [1, 0, 0, 0, 1],
            [1, 0, 0, 0, 1],
            [1, 0, 0, 0, 1],
            [1, 0, 0, 0, 1],
            [1, 0, 0, 0, 1]
        ]
    },

    { 
        id: "sword_new_5" 
        name: "Weltensegler", 
        type: "sword",
        rarity: "legendary", 
        icon: "⚡", 
        price: 15000, 
        inShop: false, 
        dropSources: ["void_overlord"],
        dropChance: 0.02,
        req: 25, 
        damage: 80,
        attackSpeed: 1.5,
        chainBonus: 2.0,
        desc: "Ein Schwert, das die Grenzen zwischen Welten durchschneidet.",

        body: [
            [1, 1],
            [0, 1],
            [0, 1],
            [0, 1],
            [0, 1]
        ],

        aura: [
            [1, 1, 1, 1, 1, 1],
            [1, 0, 0, 0, 0, 1],
            [1, 0, 0, 0, 0, 1],
            [1, 0, 0, 0, 0, 1],
            [1, 0, 0, 0, 0, 1],
            [1, 0, 0, 0, 0, 1],
            [1, 0, 0, 0, 0, 1]
        ]
    }
];
