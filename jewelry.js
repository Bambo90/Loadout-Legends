/* ITEM DEFINITION - JEWELRY (Accessories & Talismans with all 4 Rotations) */

const JEWELRY_ITEMS = [
    { 
        id: "jew_new_1",
        name: "Kupferring", 
        type: "jewelry",
        rarity: "common", 
        icon: "💍", 
        price: 50, 
        inShop: true,  
        req: 1, 
        life: 15,
        desc: "Ein einfacher Kupferring mit lebenssteigernden Eigenschaften.",

        rotations: {
            0: { grid: [['AB', 'AB', 'A'], ['AB', 'B', 'A'], ['A', 'A', 'A']] },
            1: { grid: [['AB', 'AB', 'A'], ['AB', 'B', 'A'], ['A', 'A', 'A']] },
            2: { grid: [['AB', 'AB', 'A'], ['AB', 'B', 'A'], ['A', 'A', 'A']] },
            3: { grid: [['AB', 'AB', 'A'], ['AB', 'B', 'A'], ['A', 'A', 'A']] }
        }
    },

    { 
        id: "jew_new_2",
        name: "Silberring", 
        type: "jewelry",
        rarity: "magic", 
        icon: "💍", 
        price: 200, 
        inShop: true,
        req: 5, 
        mana: 20,
        magicBonus: 1.1,
        desc: "Ein silberner Ring, der Magie verstärkt.",

        rotations: {
            0: { grid: [['AB', 'AB', 'A'], ['AB', 'B', 'A'], ['A', 'A', 'A']] },
            1: { grid: [['AB', 'AB', 'A'], ['AB', 'B', 'A'], ['A', 'A', 'A']] },
            2: { grid: [['AB', 'AB', 'A'], ['AB', 'B', 'A'], ['A', 'A', 'A']] },
            3: { grid: [['AB', 'AB', 'A'], ['AB', 'B', 'A'], ['A', 'A', 'A']] }
        }
    },

    { 
        id: "jew_new_3",
        name: "Goldkette", 
        type: "jewelry",
        rarity: "rare", 
        icon: "⛓️", 
        price: 800, 
        inShop: true,
        req: 9, 
        life: 50,
        mana: 30,
        allResist: 0.08,
        desc: "Eine edle Goldkette mit ausgewogener Kraft.",

        rotations: {
            0: { grid: [['AB', 'AB', 'A'], ['AB', 'B', 'A'], ['A', 'A', 'A']] },
            1: { grid: [['AB', 'AB', 'A'], ['AB', 'B', 'A'], ['A', 'A', 'A']] },
            2: { grid: [['AB', 'AB', 'A'], ['AB', 'B', 'A'], ['A', 'A', 'A']] },
            3: { grid: [['AB', 'AB', 'A'], ['AB', 'B', 'A'], ['A', 'A', 'A']] }
        }
    },

    { 
        id: "jew_new_4",
        name: "Sternenamulett", 
        type: "jewelry",
        rarity: "unique", 
        icon: "⭐", 
        price: 3200, 
        inShop: false,
        dropSources: ["celestial_being"],
        dropChance: 0.05,
        req: 12, 
        life: 50,
        mana: 40,
        allResist: 0.12,
        critChance: 0.05,
        desc: "Ein glanzvoles Amulett, das Sternenlicht in Kraft umwandelt.",

        rotations: {
            0: { grid: [['A', 'A', 'A', 'A', 'A', 'A'], ['A', '0', 'B', '0', '0', 'A'], ['A', 'B', 'B', 'B', '0', 'A'], ['A', '0', 'B', '0', '0', 'A'], ['0', 'A', 'B', '0', 'A', '0'], ['0', 'A', '0', '0', 'A', '0']] },
            1: { grid: [['0', 'A', 'A', 'A', 'A', '0'], ['A', '0', '0', '0', '0', 'A'], ['A', '0', 'B', 'B', 'B', 'A'], ['A', 'B', 'B', '0', '0', 'A'], ['A', '0', '0', '0', '0', 'A'], ['0', 'A', 'A', 'A', 'A', '0']] },
            2: { grid: [['0', 'A', '0', '0', 'A', '0'], ['0', 'A', 'B', '0', 'A', '0'], ['A', '0', 'B', '0', '0', 'A'], ['A', 'B', 'B', 'B', '0', 'A'], ['A', '0', 'B', '0', '0', 'A'], ['A', 'A', 'A', 'A', 'A', 'A']] },
            3: { grid: [['0', 'A', 'A', 'A', 'A', '0'], ['A', '0', '0', '0', '0', 'A'], ['A', '0', '0', 'B', 'B', 'A'], ['A', 'B', 'B', '0', '0', 'A'], ['A', '0', '0', '0', '0', 'A'], ['0', 'A', 'A', 'A', 'A', '0']] }
        }
    }
];