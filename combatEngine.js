/**
 * Combat Engine - pure and reusable combat/stat calculations.
 * Runtime state should be provided by callers.
 */

function calculateCharacterDamageValue(characterStats) {
    if (characterStats && typeof getCharacterDamageValueFromDerived === "function") {
        return getCharacterDamageValueFromDerived(characterStats);
    }

    if (!characterStats || !characterStats.finalDamage || typeof characterStats.finalDamage !== "object") {
        return 0;
    }

    let totalAverage = 0;
    Object.keys(characterStats.finalDamage).forEach((damageType) => {
        const bucket = characterStats.finalDamage[damageType] || {};
        const min = typeof bucket.min === "number" ? bucket.min : 0;
        const max = typeof bucket.max === "number" ? bucket.max : 0;
        totalAverage += (min + max) / 2;
    });
    return Math.max(0, totalAverage);
}

/**
 * Legacy-compatible wrapper.
 * Preferred call path is to pass `characterStats` and consume derived stats.
 */
function calculatePlayerDamageWithEquipment(playerLevel, equippedItems, characterStats) {
    if (characterStats && characterStats.finalDamage) {
        return calculateCharacterDamageValue(characterStats);
    }

    // Legacy fallback formula
    const baseDamage = 2 + (playerLevel * 0.5);
    let damageBonus = 1.0;

    if (equippedItems && Array.isArray(equippedItems)) {
        equippedItems.forEach((item) => {
            if (item && item.damage) {
                damageBonus += item.damage * 0.1;
            }
        });
    }

    return baseDamage * damageBonus;
}

/**
 * Generic equipment bonus getter.
 * If `characterStats` is passed, it consumes final derived values.
 */
function calculateEquipmentBonusValue(equippedItems, bonusType, characterStats) {
    if (characterStats && typeof characterStats === "object") {
        if (bonusType === "speed") return Number.isFinite(characterStats.attackSpeed) ? characterStats.attackSpeed : 1.0;
        if (bonusType === "xp") return Math.max(0.1, characterStats.xpGainMultiplier || 1.0);
        if (bonusType === "damage") return Math.max(0, calculateCharacterDamageValue(characterStats));
        return 1.0;
    }

    // Legacy fallback formula
    let bonus = 1.0;

    if (!equippedItems || !Array.isArray(equippedItems)) {
        return bonus;
    }

    equippedItems.forEach((item) => {
        if (!item) return;

        if (bonusType === "damage" && item.damage) {
            bonus += item.damage * 0.1;
        } else if (bonusType === "speed" && item.speedBonus) {
            bonus *= item.speedBonus;
        } else if (bonusType === "xp" && item.xpBonus) {
            bonus *= item.xpBonus;
        }
    });

    return bonus;
}

/**
 * Exponential XP requirement.
 * Uses central character config when available.
 */
function calculateNextLevelXpRequirement(currentLevel) {
    if (typeof calculateXpToNextLevel === "function") {
        return calculateXpToNextLevel(currentLevel);
    }
    return Math.floor(500 * Math.pow(1.4, currentLevel - 1));
}

function calculateLootReward(goldMin, goldMax) {
    return Math.floor(Math.random() * (goldMax - goldMin + 1)) + goldMin;
}

function isMonsterUnlocked(playerLevel, monsterLevel) {
    return playerLevel >= monsterLevel;
}

function getHighestUnlockedMonsterIndex(playerLevel, allMonsters) {
    if (!allMonsters || allMonsters.length === 0) {
        return 0;
    }

    const unlockedIndices = [];
    for (let i = 0; i < allMonsters.length; i++) {
        if (isMonsterUnlocked(playerLevel, allMonsters[i].level)) {
            unlockedIndices.push(i);
        }
    }

    if (unlockedIndices.length === 0) {
        return 0;
    }

    return unlockedIndices[unlockedIndices.length - 1];
}

function calculateMonsterBaseDamage(monsterDamage) {
    return monsterDamage;
}

function calculateMaxHp(level) {
    return 100 + (level * 10);
}
