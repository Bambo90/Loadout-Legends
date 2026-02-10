/* ITEM DEFINITION - SHIELDS (Blocking/Defense) */

const SHIELD_ITEMS = [
    { 
        id: "shield_new_1" 
        name: "Holzschild", 
        type: "shield",
        rarity: "common", 
        icon: "🛡️", 
        price: 40, 
        inShop: true,  
        req: 2, 
        blockChance: 0.15,
        blockValue: 8,
        desc: "Ein einfacher Schild, der einige Treffer abhält.",

        body: [
            [1, 1],
            [1, 1],
            [1, 1]
        ],

        aura: [
            [1, 1, 1, 1],
            [1, 0, 0, 1],
            [1, 0, 0, 1],
            [1, 0, 0, 1],
            [0, 1, 1, 0]
        ]
    },

    { 
        id: "shield_new_2" 
        name: "Eisenschild", 
        type: "shield",
        rarity: "magic", 
        icon: "🛡️", 
        price: 160, 
        inShop: true,
        req: 5, 
        blockChance: 0.22,
        blockValue: 16,
        lifeRegenBlock: 0.05,
        desc: "Verstärkter Eisenschild mit Lebensregeneration beim Blocken.",

        body: [
            [1, 1],
            [1, 1],
            [1, 1],
            [1, 1]
        ],

        aura: [
            [1, 1, 1, 1, 1],
            [1, 0, 0, 0, 1],
            [1, 0, 0, 0, 1],
            [1, 0, 0, 0, 1],
            [1, 0, 0, 0, 1],
            [0, 1, 1, 1, 0]
        ]
    },

    { 
        id: "shield_new_3" 
        name: "Kriegsschild des Erbauers", 
        type: "shield",
        rarity: "rare", 
        icon: "🛡️", 
        price: 900, 
        inShop: true,
        req: 9, 
        blockChance: 0.30,
        blockValue: 32,
        counterAttack: 0.1,
        desc: "Massiver Schild mit Gegenschlag-Chance.",

        body: [
            [1],
            [1],
            [1],
            [1],
            [1]
        ],

        aura: [
            [1, 1, 1, 1],
            [1, 0, 0, 1],
            [1, 0, 0, 1],
            [1, 0, 0, 1],
            [1, 0, 0, 1],
            [1, 0, 0, 1],
            [0, 1, 1, 0]
        ]
    },

    { 
        id: "shield_new_4" 
        name: "Mondkristall-Schutzschild", 
        type: "shield",
        rarity: "unique", 
        icon: "🌙", 
        price: 3500, 
        inShop: false, 
        dropSources: ["lunar_guardian"],
        dropChance: 0.05,
        req: 13, 
        blockChance: 0.35,
        blockValue: 24,
        magicAbsorption: 0.15,
        desc: "Ein Schild, der Mondenergie in Schutz umwandelt.",

        body: [
            [1, 1],
            [1, 1],
            [1, 1],
            [1, 1],
            [1, 1]
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
        id: "shield_new_5" 
        name: "Unzerstörbarer Wall Guardian", 
        type: "shield",
        rarity: "legendary", 
        icon: "⚔️", 
        price: 25000, 
        inShop: false, 
        dropSources: ["immortal_sentinel"],
        dropChance: 0.01,
        req: 26, 
        blockChance: 0.50,
        blockValue: 60,
        counterAttack: 0.3,
        allDamageReduction: 0.1,
        desc: "Der legendäre Schild, der mit jedem Block stärker wird.",

        body: [
            [1, 1],
            [1, 1],
            [1, 1],
            [1, 1],
            [1, 1],
            [1, 1]
        ],

        aura: [
            [1, 1, 1, 1, 1, 1, 1],
            [1, 0, 0, 0, 0, 0, 1],
            [1, 0, 0, 0, 0, 0, 1],
            [1, 0, 0, 0, 0, 0, 1],
            [1, 0, 0, 0, 0, 0, 1],
            [1, 0, 0, 0, 0, 0, 1],
            [1, 0, 0, 0, 0, 0, 1],
            [0, 1, 1, 1, 1, 1, 0]
        ]
    }
];
