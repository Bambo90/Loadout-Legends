// ==========================================
// PVP RANKED SYSTEM
// Asynchronous player battle snapshots
// ==========================================

const PVP_SAVE_KEY = "LoadoutLegends_PVP";

/**
 * Creates a snapshot of player's current state for PvP
 */
function createPlayerSnapshot() {
    return {
        name: `Player_${gameData.level}`,
        level: gameData.level,
        timestamp: Date.now(),
        farmGridSnapshot: JSON.parse(JSON.stringify(gameData.farmGrid)),
        pveGridSnapshot: JSON.parse(JSON.stringify(gameData.pveGrid)),
        stats: {
            totalGold: gameData.totalGold,
            totalXP: gameData.totalXP,
            defeatedMonsters: {...gameData.monsterDefeats}
        }
    };
}

/**
 * Saves a snapshot for other players to battle against
 */
function savePlayerSnapshot() {
    const snapshot = createPlayerSnapshot();
    const snapshots = getPVPSnapshots();
    
    // Remove old snapshot for this player (keep only latest)
    const cleaned = snapshots.filter(s => s.timestamp < Date.now() - 7 * 24 * 60 * 60 * 1000);
    cleaned.push(snapshot);
    
    localStorage.setItem(PVP_SAVE_KEY, JSON.stringify(cleaned));
    console.log("Player snapshot saved for PvP!");
}

/**
 * Gets all available PvP opponent snapshots
 */
function getPVPSnapshots() {
    const saved = localStorage.getItem(PVP_SAVE_KEY);
    if (!saved) return [];
    
    try {
        return JSON.parse(saved);
    } catch (e) {
        console.error("Error loading PvP snapshots:", e);
        return [];
    }
}

/**
 * Simulates battle against a player snapshot
 */
function simulatePVPBattle(opponentSnapshot) {
    const playerDamage = calculatePlayerDamage();
    const opponentDamage = 5 + (opponentSnapshot.level * 0.5);
    
    let playerHP = gameData.hp;
    let opponentHP = 100 + (opponentSnapshot.level * 10);
    
    let rounds = 0;
    const maxRounds = 100;
    
    while (playerHP > 0 && opponentHP > 0 && rounds < maxRounds) {
        // Player attack
        opponentHP -= playerDamage;
        
        if (opponentHP <= 0) {
            return {
                won: true,
                message: `Victory! Defeated ${opponentSnapshot.name}!`,
                goldReward: Math.floor(opponentSnapshot.stats.totalGold * 0.1),
                xpReward: Math.floor(opponentSnapshot.stats.totalXP * 0.05)
            };
        }
        
        // Opponent counter attack
        playerHP -= opponentDamage;
        rounds++;
    }
    
    return {
        won: false,
        message: `Defeat! Lost to ${opponentSnapshot.name}...`,
        goldReward: 0,
        xpReward: 0
    };
}

/**
 * Challenges a player snapshot and applies rewards
 */
function challengePlayer(opponentIndex) {
    const snapshots = getPVPSnapshots();
    if (opponentIndex < 0 || opponentIndex >= snapshots.length) return;
    
    const opponent = snapshots[opponentIndex];
    const result = simulatePVPBattle(opponent);
    
    if (result.won) {
        gameData.gold += result.goldReward;
        gameData.xp += result.xpReward;
        gameData.totalGold += result.goldReward;
        gameData.totalXP += result.xpReward;
    }
    
    alert(result.message + `\nGold: +${result.goldReward}\nXP: +${result.xpReward}`);
    saveGame();
    updateUI();
}
