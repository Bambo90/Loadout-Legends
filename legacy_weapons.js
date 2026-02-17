/* ITEM DEFINITION - WEAPONS (Legacy Weapons with all 4 Rotations) */

const WEAPON_ITEMS = [
    { 
        id: "sword_1", 
        name: "Stumpfes Kurzschwert", 
        type: "weapon",
        rarity: "common", 
        icon: "🗡️", 
        price: 100, 
        req: 2, 
        damage: 5, 
        desc: "Besser als nichts im Kampf.",
        rotations: {
            0: { grid: [['AB', 'AB', 'A'], ['0', 'AB', 'A'], ['0', 'AB', '0'], ['0', 'A', '0']] },
            1: { grid: [['A', 'A', '0'], ['AB', '0', 'A'], ['AB', 'AB', 'AB'], ['0', 'A', 'A']] },
            2: { grid: [['AB', '0', 'A'], ['AB', 'A', '0'], ['AB', 'AB', 'A'], ['A', 'A', '0']] },
            3: { grid: [['A', 'A', '0'], ['AB', 'AB', 'AB'], ['0', 'A', 'AB'], ['0', 'A', 'A']] }
        }
    },
    { 
        id: "bow_1", 
        name: "Verwitterter Langbogen", 
        type: "weapon",
        rarity: "magic", 
        icon: "🏹", 
        price: 450, 
        req: 6, 
        damage: 12, 
        desc: "Hält gerade noch so zusammen.",
        rotations: {
            0: { grid: [['A', 'AB', 'A'], ['0', 'AB', '0'], ['0', 'AB', '0'], ['0', 'AB', '0'], ['0', 'A', '0']] },
            1: { grid: [['0', 'A', 'A', 'A'], ['AB', 'AB', 'B', 'AB'], ['0', 'A', 'A', 'A'], ['0', 'A', 'A', 'A']] },
            2: { grid: [['0', 'AB', '0'], ['0', 'AB', '0'], ['0', 'AB', '0'], ['A', 'AB', 'A']] },
            3: { grid: [['A', 'A', 'A', '0'], ['AB', 'B', 'AB', 'AB'], ['A', 'A', 'A', '0'], ['A', 'A', 'A', '0']] }
        }
    },
    { 
        id: "sword_2", 
        name: "Eisernes Schwert", 
        type: "weapon",
        rarity: "magic", 
        icon: "🗡️", 
        price: 300, 
        req: 5, 
        damage: 8, 
        desc: "Solider Stahl mit guter Balance.",
        rotations: {
            0: { grid: [['AB', 'AB', 'A'], ['0', 'AB', 'A'], ['0', 'AB', '0'], ['0', 'A', '0']] },
            1: { grid: [['A', 'A', '0'], ['AB', '0', 'A'], ['AB', 'AB', 'AB'], ['0', 'A', 'A']] },
            2: { grid: [['AB', '0', 'A'], ['AB', 'A', '0'], ['AB', 'AB', 'A'], ['A', 'A', '0']] },
            3: { grid: [['A', 'A', '0'], ['AB', 'AB', 'AB'], ['0', 'A', 'AB'], ['0', 'A', 'A']] }
        }
    },
    { 
        id: "axe_1", 
        name: "Kupfer-Axt", 
        type: "weapon",
        rarity: "rare", 
        icon: "🪓", 
        price: 800, 
        req: 10, 
        damage: 15, 
        desc: "Schwer aber verheerend.",
        rotations: {
            0: { grid: [['A', 'AB', 'AB', 'AB', 'A'], ['0', 'A', 'AB', 'A', '0'], ['0', 'A', 'B', 'A', '0'], ['0', 'A', '0', 'A', '0']] },
            1: { grid: [['0', 'A', 'AB', 'A'], ['AB', 'AB', 'B', 'A'], ['AB', 'A', '0', 'A'], ['A', 'A', 'A', '0']] },
            2: { grid: [['0', 'A', 'B', 'A', '0'], ['0', 'A', 'B', 'A', '0'], ['0', 'AB', 'AB', 'AB', '0'], ['A', 'A', 'A', 'A', 'A']] },
            3: { grid: [['B', 'A', 'A', 'A'], ['AB', 'B', 'AB', 'A'], ['A', '0', 'AB', 'A'], ['A', 'A', 'A', '0']] }
        }
    }
];