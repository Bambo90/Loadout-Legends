/* ITEM DEFINITION - ACCESSORIES (Jewelry & Talismans with all 4 Rotations) */

const ACCESSORY_ITEMS = [
    { 
        id: "acc_new_ring_1",
        name: "Kupferring des Vertrauens", 
        type: "accessory",
        rarity: "common", 
        icon: "💍", 
        price: 35, 
        inShop: true,  
        req: 1, 
        life: 10,
        desc: "Ein einfacher Kupferring mit lebenssteigernden Eigenschaften.",

        rotations: {
            0: { grid: [['AB', 'AB', 'A'], ['AB', 'B', 'A'], ['A', 'A', 'A']] },
            1: { grid: [['AB', 'AB', 'A'], ['AB', 'B', 'A'], ['A', 'A', 'A']] },
            2: { grid: [['AB', 'AB', 'A'], ['AB', 'B', 'A'], ['A', 'A', 'A']] },
            3: { grid: [['AB', 'AB', 'A'], ['AB', 'B', 'A'], ['A', 'A', 'A']] }
        }
    },

    { 
        id: "acc_new_ring_2",
        name: "Silberring der Weisheit", 
        type: "accessory",
        rarity: "magic", 
        icon: "💍", 
        price: 140, 
        inShop: true,
        req: 4, 
        mana: 15,
        magicBonus: 1.12,
        desc: "Ein feiner Silberring mit mystischen Eigenschaften.",

        rotations: {
            0: { grid: [['AB', 'AB', 'A'], ['AB', 'B', 'A'], ['A', 'A', 'A']] },
            1: { grid: [['AB', 'AB', 'A'], ['AB', 'B', 'A'], ['A', 'A', 'A']] },
            2: { grid: [['AB', 'AB', 'A'], ['AB', 'B', 'A'], ['A', 'A', 'A']] },
            3: { grid: [['AB', 'AB', 'A'], ['AB', 'B', 'A'], ['A', 'A', 'A']] }
        }
    },

    { 
        id: "acc_new_ring_3",
        name: "Goldring der Macht", 
        type: "accessory",
        rarity: "rare", 
        icon: "💍", 
        price: 600, 
        inShop: true,
        req: 7, 
        life: 30,
        mana: 25,
        damageBonus: 1.15,
        desc: "Ein prächtiger Goldring voller Kraft.",

        rotations: {
            0: { grid: [['AB', 'AB', 'A'], ['AB', 'B', 'A'], ['A', 'A', 'A']] },
            1: { grid: [['AB', 'AB', 'A'], ['AB', 'B', 'A'], ['A', 'A', 'A']] },
            2: { grid: [['AB', 'AB', 'A'], ['AB', 'B', 'A'], ['A', 'A', 'A']] },
            3: { grid: [['AB', 'AB', 'A'], ['AB', 'B', 'A'], ['A', 'A', 'A']] }
        }
    },

    { 
        id: "acc_new_brooch_1",
        name: "Einfache Schließe", 
        type: "accessory",
        rarity: "common", 
        icon: "🔌", 
        price: 25, 
        inShop: true,  
        req: 1, 
        defense: 3,
        desc: "Eine verstärkte Schließe für jede Robe.",

        rotations: {
            0: { grid: [['A', 'A', 'A'], ['A', 'B', 'A'], ['A', 'A', 'A']] },
            1: { grid: [['A', '0', 'A'], ['A', 'B', 'A'], ['A', 'A', 'A']] },
            2: { grid: [['A', 'A', 'A'], ['A', 'B', 'A'], ['A', '0', 'A']] },
            3: { grid: [['A', 'A', 'A'], ['A', 'B', 'A'], ['A', '0', 'A']] }
        }
    },

    { 
        id: "acc_new_brooch_2",
        name: "Verzierte Schließe", 
        type: "accessory",
        rarity: "magic", 
        icon: "🔌", 
        price: 120, 
        inShop: true,
        req: 5, 
        defense: 6,
        evasion: 0.1,
        desc: "Eine kunstvoll gestaltete Schließe.",

        rotations: {
            0: { grid: [['A', 'A', 'A'], ['A', 'B', 'A'], ['A', 'A', 'A']] },
            1: { grid: [['A', '0', 'A'], ['A', 'B', 'A'], ['A', 'A', 'A']] },
            2: { grid: [['A', 'A', 'A'], ['A', 'B', 'A'], ['A', '0', 'A']] },
            3: { grid: [['A', 'A', 'A'], ['A', 'B', 'A'], ['A', '0', 'A']] }
        }
    }
];
