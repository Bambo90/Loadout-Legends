/* ITEM FILE: Armor Index
 * Aggregates concrete armor item defs from prefix files.
 * ilvl/tier/roll ranges are handled upstream by affix/generator systems.
 */

const ITEMS_ARMOR_ALL = [
    ...(typeof ITEMS_ARMOR_HELMETS !== "undefined" ? ITEMS_ARMOR_HELMETS : []),
    ...(typeof ITEMS_ARMOR_BODY !== "undefined" ? ITEMS_ARMOR_BODY : []),
    ...(typeof ITEMS_ARMOR_GLOVES !== "undefined" ? ITEMS_ARMOR_GLOVES : []),
    ...(typeof ITEMS_ARMOR_BOOTS !== "undefined" ? ITEMS_ARMOR_BOOTS : [])
];

if (typeof window !== "undefined") {
    window.ITEMS_ARMOR_ALL = ITEMS_ARMOR_ALL;
}
