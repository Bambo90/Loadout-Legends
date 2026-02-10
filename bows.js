/* ITEM DEFINITION - BOWS (Ranged Weapons) */

const BOW_ITEMS = [
    { 
        id: "bow_new_1",
        name: "Langbogen", 
        type: "bow",
        rarity: "common", 
        icon: "🏹", 
        price: 45, 
        inShop: true,  
        req: 2, 
        damage: 6,
        attackSpeed: 1.8,
        accuracy: 0.85,
        desc: "Ein klassischer Holzbogen mit anständiger Reichweite.",

        body: [
            [1, 0],
            [1, 1],
            [1, 0]
        ],

        aura: [
            [1, 1, 1],
            [1, 0, 1],
            [1, 1, 1],
            [1, 0, 1]
        ]
    },

    { 
        id: "bow_new_2",
        name: "Kompositbogen", 
        type: "bow",
        rarity: "magic", 
        icon: "🏹", 
        price: 180, 
        inShop: true,
        req: 6, 
        damage: 14,
        attackSpeed: 1.6,
        accuracy: 0.92,
        piercing: 0.2,
        desc: "Mehrschichtig aufgebaut für bessere Pfeil-Penetration.",

        body: [
            [1, 0],
            [1, 1],
            [1, 0],
            [1, 0]
        ],

        aura: [
            [1, 1, 1, 1],
            [1, 0, 0, 1],
            [1, 1, 1, 1],
            [1, 0, 0, 1],
            [1, 0, 0, 1]
        ]
    },

    { 
        id: "bow_new_3",
        name: "Drachenarmbruster", 
        type: "bow",
        rarity: "rare", 
        icon: "🏹", 
        price: 1200, 
        inShop: true,
        req: 12, 
        damage: 28,
        attackSpeed: 1.2,
        accuracy: 0.95,
        armorIgnore: 0.3,
        desc: "Eine massive Waffe, die Rüstungen durchdringt wie Papier.",

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
        id: "bow_new_4",
        name: "Eissturmbogen", 
        type: "bow",
        rarity: "unique", 
        icon: "❄️", 
        price: 4000, 
        inShop: false, 
        dropSources: ["frost_mage"],
        dropChance: 0.07,
        req: 14, 
        damage: 22,
        attackSpeed: 2.2,
        accuracy: 0.98,
        coldBonus: 1.4,
        desc: "Pfeile, die bei jedem Schuss Eis hinterlassen.",

        body: [
            [1, 0],
            [1, 1],
            [1, 0],
            [1, 1]
        ],

        aura: [
            [1, 1, 1, 1, 1],
            [1, 0, 0, 0, 1],
            [1, 1, 1, 1, 1],
            [1, 0, 0, 0, 1],
            [1, 0, 0, 0, 1]
        ]
    },

    { 
        id: "bow_new_5",
        name: "Zeitloses Präzisions-Langbogen", 
        type: "bow",
        rarity: "legendary", 
        icon: "✨", 
        price: 18000, 
        inShop: false, 
        dropSources: ["time_keeper"],
        dropChance: 0.01,
        req: 22, 
        damage: 45,
        attackSpeed: 2.8,
        accuracy: 1.0,
        critMulti: 3.0,
        desc: "Jeden Schuss präzise platziert, als ob die Zeit steht.",

        body: [
            [1, 0],
            [1, 1],
            [1, 0],
            [1, 1],
            [1, 0]
        ],

        aura: [
            [1, 1, 1, 1, 1, 1, 1],
            [1, 0, 0, 0, 0, 0, 1],
            [1, 1, 1, 1, 1, 1, 1],
            [1, 0, 0, 0, 0, 0, 1],
            [1, 0, 0, 0, 0, 0, 1]
        ]
    }
];
