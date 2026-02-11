/* ITEM DEFINITION - SWORDS (Melee Weapons with all 4 Rotations) */

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

        rotations: {
            0: { grid: [['A','A','A'], ['A','B','A'], ['A','B','A'], ['A','B','A']] },
            1: { grid: [['A','A','A','A'], ['B','B','B','0'], ['0','0','0','A']] },
            2: { grid: [['A','B','A'], ['A','B','A'], ['A','B','A'], ['A','A','A']] },
            3: { grid: [['A','0','0','0'], ['B','B','B','A'], ['A','A','A','A']] }
        }
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

        rotations: {
            0: { grid: [['A','A','A'], ['A','B','A'], ['A','B','A'], ['A','B','A'], ['A','B','A']] },
            1: { grid: [['A','A','A','A','A'], ['B','B','B','B','A'], ['0','0','0','0','A'], ['0','0','0','0','A'], ['0','0','0','0','A']] },
            2: { grid: [['A','B','A'], ['A','B','A'], ['A','B','A'], ['A','B','A'], ['A','A','A']] },
            3: { grid: [['A','0','0','0','0'], ['A','0','0','0','0'], ['A','0','0','0','0'], ['A','0','0','0','0'], ['A','B','B','B','B']] }
        }
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

        rotations: {
            0: { grid: [['A','A','A'], ['A','B','A'], ['A','B','A'], ['A','B','A'], ['A','B','A'], ['A','B','A']] },
            1: { grid: [['A','A','A','A','A','A'], ['B','B','B','B','B','A'], ['0','0','0','0','0','A'], ['0','0','0','0','0','A'], ['0','0','0','0','0','A'], ['0','0','0','0','0','A']] },
            2: { grid: [['A','B','A'], ['A','B','A'], ['A','B','A'], ['A','B','A'], ['A','B','A'], ['A','A','A']] },
            3: { grid: [['A','0','0','0','0','0'], ['A','0','0','0','0','0'], ['A','0','0','0','0','0'], ['A','0','0','0','0','0'], ['A','0','0','0','0','0'], ['A','B','B','B','B','B']] }
        }
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

        rotations: {
            0: { grid: [['A','A','A','A','A'], ['A','B','B','0','A'], ['A','0','B','0','A'], ['A','0','B','0','A'], ['A','0','B','0','A'], ['A','0','0','0','A']] },
            1: { grid: [['A','A','A','A','A','A'], ['B','0','0','0','0','A'], ['B','B','B','B','0','A'], ['0','0','0','0','0','A'], ['0','0','0','0','0','A']] },
            2: { grid: [['A','0','0','0','A'], ['A','0','B','0','A'], ['A','0','B','0','A'], ['A','0','B','0','A'], ['A','B','B','0','A'], ['A','A','A','A','A']] },
            3: { grid: [['A','0','0','0','0','0'], ['A','0','0','0','0','0'], ['A','0','0','0','0','B'], ['A','B','B','B','B','B'], ['A','A','A','A','A','A']] }
        }
    },

    { 
        id: "sword_new_5",
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

        rotations: {
            0: { grid: [['A','A','A','A','A','A'], ['A','B','B','0','0','A'], ['A','0','B','0','0','A'], ['A','0','B','0','0','A'], ['A','0','B','0','0','A'], ['A','0','B','0','0','A'], ['A','0','0','0','0','A']] },
            1: { grid: [['A','A','A','A','A','A','A'], ['B','0','0','0','0','0','A'], ['B','B','B','B','B','0','A'], ['0','0','0','0','0','0','A'], ['0','0','0','0','0','0','A'], ['0','0','0','0','0','0','A']] },
            2: { grid: [['A','0','0','0','0','A'], ['A','0','B','0','0','A'], ['A','0','B','0','0','A'], ['A','0','B','0','0','A'], ['A','0','B','0','0','A'], ['A','B','B','0','0','A'], ['A','A','A','A','A','A']] },
            3: { grid: [['A','0','0','0','0','0','0'], ['A','0','0','0','0','0','0'], ['A','0','0','0','0','0','B'], ['A','0','0','0','0','0','B'], ['A','0','0','0','0','B','B'], ['A','B','B','B','B','B','0'], ['A','A','A','A','A','A','A']] }
        }
    }
];
