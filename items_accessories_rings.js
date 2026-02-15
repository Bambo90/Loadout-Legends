/* ITEM FILE: Accessories Rings
 * Contains concrete item defs (body/aura, optional dropWeight).
 * ilvl/tier/roll ranges are handled upstream by affix/generator systems.
 */

const ITEMS_ACCESSORIES_RINGS = [
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
            0: { grid: [["AB", "AB", "A"], ["AB", "B", "A"], ["A", "A", "A"]] },
            1: { grid: [["AB", "AB", "A"], ["AB", "B", "A"], ["A", "A", "A"]] },
            2: { grid: [["AB", "AB", "A"], ["AB", "B", "A"], ["A", "A", "A"]] },
            3: { grid: [["AB", "AB", "A"], ["AB", "B", "A"], ["A", "A", "A"]] }
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
            0: { grid: [["AB", "AB", "A"], ["AB", "B", "A"], ["A", "A", "A"]] },
            1: { grid: [["AB", "AB", "A"], ["AB", "B", "A"], ["A", "A", "A"]] },
            2: { grid: [["AB", "AB", "A"], ["AB", "B", "A"], ["A", "A", "A"]] },
            3: { grid: [["AB", "AB", "A"], ["AB", "B", "A"], ["A", "A", "A"]] }
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
            0: { grid: [["AB", "AB", "A"], ["AB", "B", "A"], ["A", "A", "A"]] },
            1: { grid: [["AB", "AB", "A"], ["AB", "B", "A"], ["A", "A", "A"]] },
            2: { grid: [["AB", "AB", "A"], ["AB", "B", "A"], ["A", "A", "A"]] },
            3: { grid: [["AB", "AB", "A"], ["AB", "B", "A"], ["A", "A", "A"]] }
        }
    },
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
            0: { grid: [["AB", "AB", "A"], ["AB", "B", "A"], ["A", "A", "A"]] },
            1: { grid: [["AB", "AB", "A"], ["AB", "B", "A"], ["A", "A", "A"]] },
            2: { grid: [["AB", "AB", "A"], ["AB", "B", "A"], ["A", "A", "A"]] },
            3: { grid: [["AB", "AB", "A"], ["AB", "B", "A"], ["A", "A", "A"]] }
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
            0: { grid: [["AB", "AB", "A"], ["AB", "B", "A"], ["A", "A", "A"]] },
            1: { grid: [["AB", "AB", "A"], ["AB", "B", "A"], ["A", "A", "A"]] },
            2: { grid: [["AB", "AB", "A"], ["AB", "B", "A"], ["A", "A", "A"]] },
            3: { grid: [["AB", "AB", "A"], ["AB", "B", "A"], ["A", "A", "A"]] }
        }
    }
];

if (typeof window !== "undefined") {
    window.ITEMS_ACCESSORIES_RINGS = ITEMS_ACCESSORIES_RINGS;
}
