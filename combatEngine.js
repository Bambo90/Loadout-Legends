/**
 * Combat Engine - Pure combat calculations
 * No global access, no DOM, no state mutations
 * All data passed as parameters
 */

/**
 * Calculate total player damage from level and equipment
 * Pure function - no globals
 * @param {number} playerLevel - Current player level
 * @param {Array} equippedItems - Array of equipped items with damage property
 * @returns {number} Total damage value
 */
function calculatePlayerDamageWithEquipment(playerLevel, equippedItems) {
    const baseDamage = 2 + (playerLevel * 0.5);
    let damageBonus = 1.0;
    
    if (equippedItems && Array.isArray(equippedItems)) {
        equippedItems.forEach(item => {
            if (item && item.damage) {
                damageBonus += item.damage * 0.1;
            }
        });
    }
    
    return baseDamage * damageBonus;
}

/**
 * Calculate equipment bonus multiplier for a specific bonus type
 * Pure function - no globals
 * @param {Array} equippedItems - Array of equipped items
 * @param {string} bonusType - Type of bonus: 'damage', 'speed', 'xp'
 * @returns {number} Multiplier bonus (1.0 = no bonus)
 */
function calculateEquipmentBonusValue(equippedItems, bonusType) {
    let bonus = 1.0;
    
    if (!equippedItems || !Array.isArray(equippedItems)) {
        return bonus;
    }
    
    equippedItems.forEach(item => {
        if (!item) return;
        
        if (bonusType === 'damage' && item.damage) {
            bonus += item.damage * 0.1;
        } else if (bonusType === 'speed' && item.speedBonus) {
            bonus *= item.speedBonus;
        } else if (bonusType === 'xp' && item.xpBonus) {
            bonus *= item.xpBonus;
        }
    });
    
    return bonus;
}

/**
 * Calculate XP requirement for next level
 * Pure function - formula only
 * @param {number} currentLevel - Current player level (1-indexed)
 * @returns {number} XP needed to reach next level
 */
function calculateNextLevelXpRequirement(currentLevel) {
    return Math.floor(500 * Math.pow(1.4, currentLevel - 1));
}

/**
 * Calculate loot reward (gold) from defeating a monster
 * Uses Math.random() - note this is non-deterministic
 * TODO: Accept RNG parameter for seeded randomness
 * @param {number} goldMin - Minimum gold reward
 * @param {number} goldMax - Maximum gold reward (inclusive)
 * @returns {number} Gold reward amount
 */
function calculateLootReward(goldMin, goldMax) {
    return Math.floor(Math.random() * (goldMax - goldMin + 1)) + goldMin;
}

/**
 * Determine if a monster is unlocked for the player
 * Pure function - level comparison only
 * @param {number} playerLevel - Player's current level
 * @param {number} monsterLevel - Monster's required level
 * @returns {boolean} True if monster is unlocked
 */
function isMonsterUnlocked(playerLevel, monsterLevel) {
    return playerLevel >= monsterLevel;
}

/**
 * Find the highest unlocked monster index from a monster array
 * Pure function - no globals
 * @param {number} playerLevel - Player's current level
 * @param {Array} allMonsters - Array of all monster templates
 * @returns {number} Index of the highest unlocked monster (or 0 if none)
 */
function getHighestUnlockedMonsterIndex(playerLevel, allMonsters) {
    if (!allMonsters || allMonsters.length === 0) {
        return 0;
    }
    
    // Find all unlocked monsters
    const unlockedIndices = [];
    for (let i = 0; i < allMonsters.length; i++) {
        if (isMonsterUnlocked(playerLevel, allMonsters[i].level)) {
            unlockedIndices.push(i);
        }
    }
    
    // Return the highest unlocked, or 0 if none unlocked
    if (unlockedIndices.length === 0) {
        return 0;
    }
    
    return unlockedIndices[unlockedIndices.length - 1];
}

/**
 * Calculate base monster damage (without equipment scaling)
 * Pure function - formula only
 * @param {number} monsterDamage - Monster's base damage stat
 * @returns {number} Damage dealt
 */
function calculateMonsterBaseDamage(monsterDamage) {
    return monsterDamage;
}

/**
 * Calculate max HP for a player at a given level
 * Pure function - formula only
 * @param {number} level - Player level
 * @returns {number} Maximum HP
 */
function calculateMaxHp(level) {
    return 100 + (level * 10);
}
