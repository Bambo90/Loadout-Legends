/* ITEM DEFINITION - ARMOR (Defense with all 4 Rotations) */

const ARMOR_ITEMS = [
    { 
        id: "armor_new_1",
        name: "Leinenpanzer", 
        type: "armor",
        rarity: "common", 
        icon: "🥾", 
        price: 30, 
        inShop: true,  
        req: 1, 
        defense: 5,
        evasion: 0.1,
        desc: "Einfache Leinenkleidung, bietet minimalen Schutz.",

        rotations: {
            0: { grid: [['A', 'A', 'A', 'A', 'A'], ['A', 'B', 'B', 'B', 'A'], ['A', 'B', 'B', 'B', 'A'], ['A', '0', 'B', '0', 'A'], ['0', 'A', '0', 'A', '0']] },
            1: { grid: [['0', 'A', 'A', 'A', '0'], ['A', '0', 'B', 'B', 'A'], ['A', 'B', 'B', 'B', 'A'], ['A', '0', 'B', '0', 'A'], ['0', 'A', '0', 'A', '0']] },
            2: { grid: [['0', 'A', '0', 'A', '0'], ['A', '0', 'B', '0', 'A'], ['A', 'B', 'B', 'B', 'A'], ['A', 'B', 'B', 'B', 'A'], ['A', 'A', 'A', 'A', 'A']] },
            3: { grid: [['0', 'A', '0', 'A', '0'], ['A', '0', 'B', '0', 'A'], ['A', 'B', 'B', 'B', 'A'], ['A', 'B', 'B', '0', 'A'], ['0', 'A', 'A', 'A', 'A']] }
        }
    },

    { 
        id: "armor_new_2",
        name: "Bronzerüstung", 
        type: "armor",
        rarity: "magic", 
        icon: "🥾", 
        price: 120, 
        inShop: true,
        req: 4, 
        defense: 12,
        evasion: 0.15,
        durability: 1.1,
        desc: "Schwere Bronzerüstung, robust und zuverlässig.",
        sprite: "Media/Images/Items/Armours/Bronze_A.png",

        /*
         * Define rotations as a 5x4 combined grid (5 cols x 4 rows).
         * The body is a centered 3x2 block (columns 1-3, rows 1-2).
         */
        rotations: {
            0: { grid: [['A','A','A','A'], ['A','B','B','A'], ['A','B','B','A'], ['A','B','B','A'], ['A','A','A','A']] },
            1: { grid: [['A','A','A','A'], ['A','B','B','A'], ['A','B','B','A'], ['A','B','B','A'], ['A','A','A','A']] },
            2: { grid: [['A','A','A','A'], ['A','B','B','A'], ['A','B','B','A'], ['A','B','B','A'], ['A','A','A','A']] },
            3: { grid: [['A','A','A','A'], ['A','B','B','A'], ['A','B','B','A'], ['A','B','B','A'], ['A','A','A','A']] }
        }
    },

    { 
        id: "armor_new_3",
        name: "Mantelpanzer", 
        type: "armor",
        rarity: "rare", 
        icon: "🥾", 
        price: 500, 
        inShop: true,
        req: 8, 
        defense: 22,
        evasion: 0.25,
        magicReduction: 0.15,
        desc: "Elegante Plattenkombination aus feinem Mithril.",

        rotations: {
            0: { grid: [['A', 'A', 'AB', 'AB', 'AB', 'A', 'A'], ['A', '0', 'B', 'B', 'B', '0', 'A'], ['A', '0', 'B', 'B', 'B', '0', 'A'], ['A', '0', '0', 'B', '0', '0', 'A'], ['0', 'A', '0', 'B', '0', 'A', '0'], ['0', 'A', '0', '0', '0', 'A', '0']] },
            1: { grid: [['0', 'A', 'A', 'A', 'A', 'A', '0'], ['A', '0', '0', '0', '0', '0', 'A'], ['A', '0', 'B', 'B', 'B', '0', 'A'], ['A', 'B', 'B', 'B', 'B', '0', 'A'], ['A', '0', '0', '0', '0', '0', 'A'], ['0', 'A', 'A', 'A', 'A', 'A', '0']] },
            2: { grid: [['0', 'A', '0', 'B', '0', 'A', '0'], ['0', 'A', '0', 'B', '0', 'A', '0'], ['A', '0', 'B', 'B', 'B', '0', 'A'], ['A', '0', 'B', 'B', 'B', '0', 'A'], ['A', '0', 'B', 'B', 'B', '0', 'A'], ['A', 'A', 'A', 'A', 'A', 'A', 'A']] },
            3: { grid: [['0', 'A', 'A', 'A', 'A', 'A', '0'], ['A', '0', '0', '0', '0', '0', 'A'], ['A', '0', 'B', 'B', 'B', 'B', 'A'], ['A', '0', 'B', 'B', 'B', '0', 'A'], ['A', '0', '0', '0', '0', '0', 'A'], ['0', 'A', 'A', 'A', 'A', 'A', '0']] }
        }
    },

    { 
        id: "armor_new_4",
        name: "Mystische Robe", 
        type: "armor",
        rarity: "unique", 
        icon: "👘", 
        price: 2200, 
        inShop: false,
        dropSources: ["archmage", "void_weaver"],
        dropChance: 0.06,
        req: 11, 
        defense: 18,
        evasion: 0.35,
        spectralDefense: 0.2,
        desc: "Eine mystische Robe, die zwischen Welten flüstert.",

        rotations: {
            0: { grid: [['A', 'A', 'AB', 'AB', 'AB', 'A', 'A'], ['A', '0', 'B', 'B', 'B', '0', 'A'], ['A', '0', 'B', 'B', 'B', '0', 'A'], ['A', '0', '0', 'B', '0', '0', 'A'], ['0', 'A', '0', 'B', '0', 'A', '0'], ['0', 'A', '0', '0', '0', 'A', '0']] },
            1: { grid: [['0', 'A', 'A', 'A', 'A', 'A', '0'], ['A', '0', '0', '0', '0', '0', 'A'], ['A', '0', 'B', 'B', 'B', '0', 'A'], ['A', 'B', 'B', 'B', 'B', '0', 'A'], ['A', '0', '0', '0', '0', '0', 'A'], ['0', 'A', 'A', 'A', 'A', 'A', '0']] },
            2: { grid: [['0', 'A', '0', 'B', '0', 'A', '0'], ['0', 'A', '0', 'B', '0', 'A', '0'], ['A', '0', 'B', 'B', 'B', '0', 'A'], ['A', '0', 'B', 'B', 'B', '0', 'A'], ['A', '0', 'B', 'B', 'B', '0', 'A'], ['A', 'A', 'A', 'A', 'A', 'A', 'A']] },
            3: { grid: [['0', 'A', 'A', 'A', 'A', 'A', '0'], ['A', '0', '0', '0', '0', '0', 'A'], ['A', '0', 'B', 'B', 'B', 'B', 'A'], ['A', '0', 'B', 'B', 'B', '0', 'A'], ['A', '0', '0', '0', '0', '0', 'A'], ['0', 'A', 'A', 'A', 'A', 'A', '0']] }
        }
    },

    { 
        id: "armor_new_5",
        name: "Der Titane Kampfanzug", 
        type: "armor",
        rarity: "legendary", 
        icon: "🛡️", 
        price: 12000, 
        inShop: false,
        dropSources: ["titanic_golem"],
        dropChance: 0.03,
        req: 20, 
        defense: 45,
        evasion: -0.05,
        physicalReduction: 0.3,
        desc: "Die ultimative Rüstung, geschmiedet im Mithril-Hochofen.",

        rotations: {
            0: { grid: [['A', 'A', 'AB', 'AB', 'AB', 'A', 'A', 'A'], ['A', '0', 'B', 'B', 'B', '0', '0', 'A'], ['A', '0', 'B', 'B', 'B', '0', '0', 'A'], ['A', '0', 'B', 'B', 'B', '0', '0', 'A'], ['A', '0', '0', 'B', '0', '0', '0', 'A'], ['0', 'A', '0', '0', '0', '0', 'A', '0']] },
            1: { grid: [['0', 'A', 'A', 'A', 'A', 'A', 'A', '0'], ['A', '0', '0', '0', '0', '0', '0', 'A'], ['A', '0', 'B', 'B', 'B', 'B', '0', 'A'], ['A', 'B', 'B', 'B', 'B', '0', '0', 'A'], ['A', '0', '0', '0', '0', '0', '0', 'A'], ['0', 'A', 'A', 'A', 'A', 'A', 'A', '0']] },
            2: { grid: [['0', 'A', '0', 'B', '0', '0', 'A', '0'], ['A', '0', 'B', 'B', 'B', '0', '0', 'A'], ['A', '0', 'B', 'B', 'B', '0', '0', 'A'], ['A', '0', 'B', 'B', 'B', '0', '0', 'A'], ['A', '0', 'B', 'B', 'B', '0', '0', 'A'], ['A', 'A', 'A', 'A', 'A', 'A', 'A', 'A']] },
            3: { grid: [['0', 'A', 'A', 'A', 'A', 'A', 'A', '0'], ['A', '0', '0', '0', '0', '0', '0', 'A'], ['A', '0', 'B', 'B', 'B', 'B', '0', 'A'], ['A', 'B', 'B', 'B', 'B', '0', '0', 'A'], ['A', '0', '0', '0', '0', '0', '0', 'A'], ['0', 'A', 'A', 'A', 'A', 'A', 'A', '0']] }
        }
    }
];
