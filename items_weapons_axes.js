/* ITEM FILE: Weapons Axes
 * Contains concrete item defs (body/aura, optional dropWeight).
 * ilvl/tier/roll ranges are handled upstream by affix/generator systems.
 */

const ITEMS_WEAPONS_AXES = [
    {
        id: "axe_1",
        name: "Kupfer-Axt",
        type: "weapon",
        rarity: "rare",
        icon: "🪓",
        price: 800,
        inShop: false,
        req: 10,
        damage: 15,
        damageMin: 15,
        damageMax: 15,
        attackCooldownMs: 5000,
        staminaCost: 16,
        tags: ["weapon", "axe", "twohand"],
        desc: "Schwer aber verheerend.",
        rotations: {
            0: { grid: [["A", "AB", "AB", "AB", "A"], ["0", "A", "AB", "A", "0"], ["0", "A", "B", "A", "0"], ["0", "A", "0", "A", "0"]] },
            1: { grid: [["0", "A", "AB", "A"], ["AB", "AB", "B", "A"], ["AB", "A", "0", "A"], ["A", "A", "A", "0"]] },
            2: { grid: [["0", "A", "B", "A", "0"], ["0", "A", "B", "A", "0"], ["0", "AB", "AB", "AB", "0"], ["A", "A", "A", "A", "A"]] },
            3: { grid: [["B", "A", "A", "A"], ["AB", "B", "AB", "A"], ["A", "0", "AB", "A"], ["A", "A", "A", "0"]] }
        }
    }
];

if (typeof window !== "undefined") {
    window.ITEMS_WEAPONS_AXES = ITEMS_WEAPONS_AXES;
}
