/* ITEM DEFINITION - SHIELDS (Defense with all 4 Rotations) */

const SHIELD_ITEMS = [
    { 
        id: "shield_new_1",
        name: "Holzschild", 
        type: "shield",
        rarity: "common", 
        icon: "🛡️", 
        price: 40, 
        inShop: true,  
        req: 2, 
        defense: 8,
        blockChance: 0.1,
        desc: "Ein verstärkter Holzschild für Anfänger.",

        rotations: {
            0: { grid: [['AB', 'AB', 'A'], ['AB', 'B', 'A'], ['A', 'A', 'A']] },
            1: { grid: [['AB', 'AB', 'A'], ['AB', 'B', 'A'], ['A', 'A', 'A']] },
            2: { grid: [['AB', 'AB', 'A'], ['AB', 'B', 'A'], ['A', 'A', 'A']] },
            3: { grid: [['AB', 'AB', 'A'], ['AB', 'B', 'A'], ['A', 'A', 'A']] }
        }
    },

    { 
        id: "shield_new_2",
        name: "Eisenschild", 
        type: "shield",
        rarity: "magic", 
        icon: "🛡️", 
        price: 160, 
        inShop: true,
        req: 4, 
        defense: 16,
        blockChance: 0.18,
        evasion: -0.05,
        desc: "Ein solider Schild aus Eisen.",

        rotations: {
            0: { grid: [['A', 'A', 'A', 'A', 'A'], ['A', 'B', 'B', 'B', 'A'], ['A', 'B', 'B', 'B', 'A'], ['A', 'A', 'A', 'A', 'A']] },
            1: { grid: [['A', 'A', 'A'], ['AB', 'B', 'A'], ['AB', 'B', 'A'], ['AB', 'B', 'A'], ['A', 'A', 'A']] },
            2: { grid: [['A', 'A', 'A', 'A', 'A'], ['A', 'B', 'B', 'B', 'A'], ['A', 'B', 'B', 'B', 'A'], ['A', 'A', 'A', 'A', 'A']] },
            3: { grid: [['A', 'A', 'A'], ['AB', 'B', 'A'], ['AB', 'B', 'A'], ['AB', 'B', 'A'], ['A', 'A', 'A']] }
        }
    },

    { 
        id: "shield_new_3",
        name: "Drachenschild", 
        type: "shield",
        rarity: "rare", 
        icon: "🛡️", 
        price: 900, 
        inShop: true,
        req: 10, 
        defense: 28,
        blockChance: 0.28,
        physicalReduction: 0.15,
        desc: "Ein prächtiger Schild aus Drachenpanzern.",

        rotations: {
            0: { grid: [['A', 'A', 'A', 'A', 'A', 'A', 'A'], ['A', '0', 'B', 'B', 'B', '0', 'A'], ['A', '0', 'B', 'B', 'B', '0', 'A'], ['A', '0', 'B', 'B', 'B', '0', 'A'], ['A', 'A', 'A', 'A', 'A', 'A', 'A']] },
            1: { grid: [['A', 'A', 'A', 'A', 'A', 'A', 'A'], ['A', '0', 'B', 'B', 'B', '0', 'A'], ['A', '0', 'B', 'B', 'B', '0', 'A'], ['A', '0', 'B', 'B', 'B', '0', 'A'], ['A', 'A', 'A', 'A', 'A', 'A', 'A']] },
            2: { grid: [['A', 'A', 'A', 'A', 'A', 'A', 'A'], ['A', '0', 'B', 'B', 'B', '0', 'A'], ['A', '0', 'B', 'B', 'B', '0', 'A'], ['A', '0', 'B', 'B', 'B', '0', 'A'], ['A', 'A', 'A', 'A', 'A', 'A', 'A']] },
            3: { grid: [['A', 'A', 'A', 'A', 'A', 'A', 'A'], ['A', '0', 'B', 'B', 'B', '0', 'A'], ['A', '0', 'B', 'B', 'B', '0', 'A'], ['A', '0', 'B', 'B', 'B', '0', 'A'], ['A', 'A', 'A', 'A', 'A', 'A', 'A']] }
        }
    },

    { 
        id: "shield_new_4",
        name: "Kristallschild", 
        type: "shield",
        rarity: "unique", 
        icon: "💎", 
        price: 4000, 
        inShop: false,
        dropSources: ["crystal_golem"],
        dropChance: 0.04,
        req: 13, 
        defense: 35,
        blockChance: 0.35,
        magicReduction: 0.2,
        desc: "Ein wunderschöner Schild aus reinem Kristall.",

        rotations: {
            0: { grid: [['A', 'A', 'A', 'A', 'A', 'A', 'A'], ['A', '0', 'B', 'B', 'B', '0', 'A'], ['A', '0', 'B', 'B', 'B', '0', 'A'], ['A', '0', 'B', 'B', 'B', '0', 'A'], ['A', '0', '0', 'B', '0', '0', 'A'], ['0', 'A', 'A', 'A', 'A', 'A', '0']] },
            1: { grid: [['A', 'A', 'A', 'A'], ['AB', 'B', 'B', 'A'], ['AB', 'B', 'B', 'A'], ['AB', 'B', 'B', 'A'], ['A', '0', '0', 'A'], ['0', 'A', 'A', 'A']] },
            2: { grid: [['0', 'A', 'A', 'A', 'A', 'A', '0'], ['A', '0', '0', 'B', '0', '0', 'A'], ['A', '0', 'B', 'B', 'B', '0', 'A'], ['A', '0', 'B', 'B', 'B', '0', 'A'], ['A', '0', 'B', 'B', 'B', '0', 'A'], ['A', 'A', 'A', 'A', 'A', 'A', 'A']] },
            3: { grid: [['A', 'A', 'A', 'A'], ['A', 'B', 'B', 'AB'], ['A', 'B', 'B', 'AB'], ['A', 'B', 'B', 'AB'], ['A', '0', '0', 'A'], ['A', 'A', 'A', 'A']] }
        }
    }
];
