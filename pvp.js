// ==========================================
// PVP RANKED SYSTEM
// Asynchronous player battle snapshots
// ==========================================

const PVP_SAVE_KEY = "LoadoutLegends_PVP";

function getPVPStorageAdapter() {
    if (typeof window !== "undefined" && window.PlatformBridge && window.PlatformBridge.storage) {
        return window.PlatformBridge.storage;
    }

    return {
        getItem(key) {
            try { return localStorage.getItem(key); } catch (err) { return null; }
        },
        setItem(key, value) {
            try { localStorage.setItem(key, value); return true; } catch (err) { return false; }
        }
    };
}

/**
 * Creates a snapshot of player's current state for PvP
 */
function createPlayerSnapshot() {
    const snapshotLevel = (gameData.character && gameData.character.base)
        ? gameData.character.base.level
        : gameData.level;
    return {
        name: `Player_${snapshotLevel}`,
        level: snapshotLevel,
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
    const storage = getPVPStorageAdapter();
    const snapshot = createPlayerSnapshot();
    const snapshots = getPVPSnapshots();
    
    // Remove old snapshot for this player (keep only latest)
    const cleaned = snapshots.filter(s => s.timestamp < Date.now() - 7 * 24 * 60 * 60 * 1000);
    cleaned.push(snapshot);
    
    storage.setItem(PVP_SAVE_KEY, JSON.stringify(cleaned));
    console.log("Player snapshot saved for PvP!");
}

/**
 * Gets all available PvP opponent snapshots
 */
function getPVPSnapshots() {
    const storage = getPVPStorageAdapter();
    const saved = storage.getItem(PVP_SAVE_KEY);
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
    
    let playerHP = (gameData.character && gameData.character.base && typeof gameData.character.base.currentLife === 'number')
        ? gameData.character.base.currentLife
        : gameData.hp;
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
        if (typeof addGold === 'function') {
            addGold(result.goldReward, 'pvp_win');
        } else if (typeof grantCurrency === 'function') {
            grantCurrency('gold', result.goldReward, {
                bypassDebugGate: true,
                trackTotalGold: true,
                refreshUI: false,
                refreshWallet: false,
                save: false
            });
        } else {
            gameData.gold += result.goldReward;
            gameData.totalGold += result.goldReward;
        }
        if (typeof grantXP === 'function') {
            grantXP(result.xpReward, 'pvp_win', 'farmGrid');
        } else if (typeof grantCharacterXP === 'function') {
            grantCharacterXP(gameData, result.xpReward, { gridKey: 'farmGrid' });
            gameData.totalXP += result.xpReward;
        } else {
            gameData.xp += result.xpReward;
            gameData.totalXP += result.xpReward;
        }
    }
    
    alert(result.message + `\nGold: +${result.goldReward}\nXP: +${result.xpReward}`);
    saveGame();
    updateUI();
}
