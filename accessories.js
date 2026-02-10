/* ITEM DEFINITION - ACCESSORIES (Jewelry & Talismans) */

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

        body: [
            [1, 1],
            [1, 1]
        ],

        aura: [
            [1, 1, 1],
            [1, 0, 1],
            [1, 1, 1]
        ]
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
        mana: 25,
        willpower: 0.10,
        desc: "Ein kunstvoll gearbeiteter Silberring für magische Nutzer.",

        body: [
            [1, 1],
            [1, 1]
        ],

        aura: [
            [1, 1, 1, 1],
            [1, 0, 0, 1],
            [1, 0, 0, 1],
            [1, 1, 1, 1]
        ]
    },

    { 
        id: "acc_new_necklace_1",
        name: "Amberkette", 
        type: "accessory",
        rarity: "rare", 
        icon: "🔻", 
        price: 550, 
        inShop: true,
        req: 7, 
        allResist: 0.08,
        lifeRegen: 0.5,
        desc: "Eine alte Kette aus fossilem Bernstein mit Schutz und Regeneration.",

        body: [
            [0, 1, 0],
            [1, 1, 1],
            [0, 1, 0]
        ],

        aura: [
            [1, 1, 1, 1, 1],
            [1, 0, 0, 0, 1],
            [1, 0, 0, 0, 1],
            [1, 0, 0, 0, 1],
            [1, 1, 1, 1, 1]
        ]
    },

    { 
        id: "acc_new_amulet_1",
        name: "Amulett der Sternenhüter", 
        type: "accessory",
        rarity: "unique", 
        icon: "✨", 
        price: 2800, 
        inShop: false, 
        dropSources: ["celestial_oracle"],
        dropChance: 0.04,
        req: 10, 
        life: 50,
        mana: 40,
        allResist: 0.12,
        critChance: 0.05,
        desc: "Ein glanzvoles Amulett, das Sternenlicht in Kraft umwandelt.",

        body: [
            [0, 1, 0],
            [1, 1, 1],
            [0, 1, 0],
            [0, 1, 0]
        ],

        aura: [
            [1, 1, 1, 1, 1, 1],
            [1, 0, 0, 0, 0, 1],
            [1, 0, 0, 0, 0, 1],
            [1, 0, 0, 0, 0, 1],
            [0, 1, 0, 0, 1, 0],
            [0, 1, 0, 0, 1, 0]
        ]
    },

    { 
        id: "acc_new_crown_1",
        name: "Krone der Ewigkeit", 
        type: "accessory",
        rarity: "legendary", 
        icon: "👑", 
        price: 22000, 
        inShop: false, 
        dropSources: ["eternal_monarch"],
        dropChance: 0.01,
        req: 23, 
        life: 150,
        mana: 100,
        allResist: 0.25,
        damageBonus: 0.20,
        critMulti: 1.5,
        desc: "Die legendäre Krone, die jedem Träger unendliche Macht verleiht.",

        body: [
            [0, 1, 0],
            [1, 1, 1],
            [1, 0, 1],
            [1, 1, 1]
        ],

        aura: [
            [1, 1, 1, 1, 1, 1, 1],
            [1, 0, 0, 0, 0, 0, 1],
            [1, 0, 0, 0, 0, 0, 1],
            [1, 0, 0, 0, 0, 0, 1],
            [1, 0, 0, 0, 0, 0, 1],
            [1, 0, 0, 0, 0, 0, 1],
            [0, 1, 1, 1, 1, 1, 0]
        ]
    }
];
