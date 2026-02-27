// ==========================================
// LOADOUT LEGENDS – CORE INIT SCRIPT (V3)
// Zentraler Hub - Hält alle Engines zusammen
// ==========================================

let gameData = {
    gold: 500,
    // Legacy mirrors are kept for compatibility; source of truth is character.base.
    level: 1,
    xp: 0,
    xpNextLevel: 500,
    hp: 100,
    maxHp: 100,
    hpRegen: 1,
    workProgress: 0,
    pendingGold: 0,
    focusUntil: 0,
    lastUpdate: Date.now(),
    bank: {},
    farmGrid: {},
    pveGrid: {},
    pvpGrid: {},
    sortGrid: {},
    totalGold: 0,
    totalXP: 0,
    currentMonster: null,
    currentMonsterIndex: 0,
    monsterDefeats: {},
    bankPages: [],
    pageMeta: [],
    bankMeta: {},
    battlefield: {
        pages: { "1": {}, "2": {}, "3": {}, "4": {}, "5": {}, "6": {}, "7": {}, "8": {}, "9": {} },
        unlockedPages: 2,
        activePage: 1
    },
    itemInstances: {},
    settings: {
        itemTooltipsEnabled: true,
        devMode: false,
        affixDetailsEnabled: false
    },
    character: (typeof createDefaultCharacterState === "function")
        ? createDefaultCharacterState()
        : null
};

const BANK_SLOTS = 100;
const GRID_SIZE = 10;
const GRID_ROWS = 10;
const FOCUS_DURATION = 60 * 60 * 1000;
const UI_SOUND_PATHS = Object.freeze({
    back: './Sounds/Menu/Back_A.mp3',
    click: './Sounds/Menu/Click_A.mp3',
    itemBought: './Sounds/Menu/Item_Bought_A.mp3',
    itemSold: './Sounds/Menu/Item_Sold_A.mp3',
    menuHover: './Sounds/Menu/Mouse_Over_Menu_A.mp3'
});
const DEFAULT_KEYBINDS = Object.freeze({
    rotateItem: 'KeyR',
    toggleTooltips: 'Alt',
    toggleAffixDetails: 'KeyA',
    cancelAction: 'Escape'
});
const KEYBIND_DEFINITIONS = Object.freeze([
    { id: 'rotateItem', label: 'Item rotieren (Drag)' },
    { id: 'toggleTooltips', label: 'Tooltips umschalten' },
    { id: 'toggleAffixDetails', label: 'Affix Details umschalten' },
    { id: 'cancelAction', label: 'Abbrechen / Schließen' }
]);
const DEFAULT_AUDIO_SETTINGS = Object.freeze({
    menu: 80,
    music: 70,
    ambient: 70
});
const MUSIC_TRACKS = Object.freeze([
    './Sounds/Music/Loadout Legends V1.mp3',
    './Sounds/Music/LoadoutLegends _ Opening.mp3'
]);
const COAST_AMBIENT_TRACKS = Object.freeze([
    './Sounds/Ambient/Coast/Coast_Ambient.mp3',
    './Sounds/Ambient/Coast/Seagull_A.mp3',
    './Sounds/Ambient/Coast/Seagull_Lost.mp3'
]);
const ZONE_COMBAT_GRID_KEY = 'pveGrid';
const LEGACY_FALLBACK_TAG = 'LEGACY_FALLBACK_USED';
const ZONE_COMBAT_MIN_APS = 0.15;
const ZONE_COMBAT_MAX_APS = 6.0;
const ZONE_COMBAT_MIN_PLAYER_INTERVAL_MS = Math.round(1000 / ZONE_COMBAT_MAX_APS);
const ZONE_COMBAT_MAX_PLAYER_INTERVAL_MS = Math.round(1000 / ZONE_COMBAT_MIN_APS);
const ZONE_COMBAT_UNARMED_INTERVAL_MS = 5000;
const ZONE_COMBAT_TICK_MS = 50;
const ZONE_COMBAT_WEAPON_TYPES = Object.freeze({
    dagger: true,
    sword: true,
    axe: true,
    mace: true,
    spear: true,
    bow: true,
    crossbow: true,
    wand: true,
    staff: true,
    stave: true,
    weapon: true
});
const ZONE_DEFAULT_WEAPON_COOLDOWN_MS_BY_TYPE = Object.freeze({
    dagger: 900,
    sword: 1400,
    axe: 1800,
    mace: 1900,
    spear: 1700,
    bow: 1600,
    crossbow: 2300,
    wand: 1300,
    staff: 1800,
    stave: 1800,
    weapon: 1600
});
const ZONE_DEFAULT_WEAPON_STAMINA_COST = 10;
const BATTLEFIELD_PAGE_COLS = 8;
const BATTLEFIELD_PAGE_ROWS = 3;
const BATTLEFIELD_PAGE_SLOTS = BATTLEFIELD_PAGE_COLS * BATTLEFIELD_PAGE_ROWS;
const BATTLEFIELD_MAX_PAGES = 9;
const BATTLEFIELD_DEFAULT_UNLOCKED_PAGES = 2;
const BATTLEFIELD_SLOT_LAYOUT_VERSION = 1;
const MUSIC_GAP_MS = 60000;
const AMBIENT_GAP_MS = 40000;
const AUDIO_FADE_MS = 5000;
// Dev-only hotkey block for quick economy testing.
const DEV_MODE_GOLD_HOTKEY_CODE = 'KeyG';
const DEV_MODE_GOLD_GRANT_AMOUNT = 10000;
const DEV_MODE_LEVEL_HOTKEY_CODE = 'KeyL';
const SHOP_RARITY_SORT_ORDER = Object.freeze({
    common: 0,
    magic: 1,
    rare: 2,
    unique: 3,
    legendary: 4
});

function hasPrivilegedDevAccess() {
    if (typeof window === 'undefined') return false;
    const api = window.electronAPI;
    return !!(api && api.runtime === 'electron' && api.devToolsEnabled === true);
}
window.hasPrivilegedDevAccess = hasPrivilegedDevAccess;

let currentWorkshop = null;
let lastMonsterAttack = Date.now();
let characterHubActiveSetup = 'farm';
let _lastHoveredMenuButton = null;
let _lastMenuHoverSoundAt = 0;
let _pendingRebindAction = null;
const _uiSoundBases = Object.create(null);
const audioRuntime = {
    musicEl: null,
    ambientEl: null,
    musicGapTimer: null,
    ambientGapTimer: null,
    musicFadeOutTimer: null,
    ambientFadeOutTimer: null,
    musicRampTimer: null,
    ambientRampTimer: null,
    musicQueue: [],
    ambientQueue: [],
    coastActive: false,
    settingsReady: false,
    unlockListenerBound: false
};

function _resolveAssetUrl(path) {
    if (typeof path !== 'string' || !path.trim()) return '';
    const trimmed = path.trim();
    if (/^(?:https?:|data:|blob:|file:)/i.test(trimmed)) return trimmed;
    const normalized = (trimmed.startsWith('./') || trimmed.startsWith('../')) ? trimmed : `./${trimmed}`;
    try {
        if (typeof window !== 'undefined' && window.location && window.location.href) {
            return new URL(normalized, window.location.href).href;
        }
    } catch (err) {
        // Fall back to raw normalized path.
    }
    return normalized;
}
const zoneCombatState = {
    active: false,
    zoneId: null,
    poolIndices: [],
    playerLastHitAt: 0,
    monsterLastHitAt: 0,
    playerIntervalMs: 0,
    monsterIntervalMs: 0,
    monsterTimerMs: 0,
    itemActionRuntime: {},
    eventHistory: [],
    showGridOverlay: false,
    ui: null
};
const zoneBattlefieldState = {
    open: false,
    sellMode: false,
    selectedInstanceIds: new Set(),
    ui: null
};

if (typeof window !== 'undefined') {
    window.currentWorkshop = currentWorkshop;
}

function _clampPercent(value, fallbackValue = 100) {
    const raw = Number(value);
    if (!Number.isFinite(raw)) return Math.max(0, Math.min(100, fallbackValue));
    return Math.max(0, Math.min(100, Math.round(raw)));
}

function ensureSettingsDefaults() {
    if (!gameData || typeof gameData !== 'object') return null;
    if (!gameData.settings || typeof gameData.settings !== 'object' || Array.isArray(gameData.settings)) {
        gameData.settings = {};
    }
    if (typeof gameData.settings.itemTooltipsEnabled !== 'boolean') {
        gameData.settings.itemTooltipsEnabled = true;
    }
    if (typeof gameData.settings.devMode !== 'boolean') {
        gameData.settings.devMode = false;
    }
    if (!hasPrivilegedDevAccess()) {
        gameData.settings.devMode = false;
    }
    if (typeof gameData.settings.affixDetailsEnabled !== 'boolean') {
        gameData.settings.affixDetailsEnabled = false;
    }
    if (!gameData.settings.keybinds || typeof gameData.settings.keybinds !== 'object' || Array.isArray(gameData.settings.keybinds)) {
        gameData.settings.keybinds = {};
    }
    if (!gameData.settings.audio || typeof gameData.settings.audio !== 'object' || Array.isArray(gameData.settings.audio)) {
        gameData.settings.audio = {};
    }
    gameData.settings.audio.menu = _clampPercent(gameData.settings.audio.menu, DEFAULT_AUDIO_SETTINGS.menu);
    gameData.settings.audio.music = _clampPercent(gameData.settings.audio.music, DEFAULT_AUDIO_SETTINGS.music);
    gameData.settings.audio.ambient = _clampPercent(gameData.settings.audio.ambient, DEFAULT_AUDIO_SETTINGS.ambient);
    return gameData.settings;
}

function getAudioVolumePercent(channel) {
    const settings = ensureSettingsDefaults();
    if (!settings || !settings.audio) return 100;
    const fallback = Object.prototype.hasOwnProperty.call(DEFAULT_AUDIO_SETTINGS, channel)
        ? DEFAULT_AUDIO_SETTINGS[channel]
        : 100;
    return _clampPercent(settings.audio[channel], fallback);
}

function getAudioVolume(channel) {
    return getAudioVolumePercent(channel) / 100;
}

function isDevModeEnabled() {
    const settings = ensureSettingsDefaults();
    return !!(settings && settings.devMode === true && hasPrivilegedDevAccess());
}

function isDeveloperShopEnabled() {
    return hasPrivilegedDevAccess() && isDevModeEnabled();
}
window.isDeveloperShopEnabled = isDeveloperShopEnabled;

function _syncDevModeOptionToggle() {
    const checkbox = document.getElementById('option-dev-mode');
    if (!checkbox) return;
    const allowDevMode = hasPrivilegedDevAccess();
    checkbox.disabled = !allowDevMode;
    checkbox.checked = allowDevMode && isDevModeEnabled();
    const row = checkbox.closest('.options-toggle-row');
    if (row) row.style.display = allowDevMode ? '' : 'none';
}

function isAffixDetailsEnabled() {
    const settings = ensureSettingsDefaults();
    return !!(settings && settings.affixDetailsEnabled === true);
}
window.isAffixDetailsEnabled = isAffixDetailsEnabled;

function _syncAffixDetailsOptionToggle() {
    const checkbox = document.getElementById('option-affix-details');
    if (checkbox) checkbox.checked = isAffixDetailsEnabled();
}

function setDevModeSetting(enabled, options) {
    const opts = options && typeof options === 'object' ? options : {};
    ensureSettingsDefaults();
    gameData.settings.devMode = hasPrivilegedDevAccess() && !!enabled;
    _syncDevModeOptionToggle();
    renderShop();
    if (opts.save !== false && typeof saveGame === 'function') saveGame();
}
window.setDevModeSetting = setDevModeSetting;

function setAffixDetailsSetting(enabled, options) {
    const opts = options && typeof options === 'object' ? options : {};
    ensureSettingsDefaults();
    gameData.settings.affixDetailsEnabled = !!enabled;
    _syncAffixDetailsOptionToggle();
    if (opts.save !== false && typeof saveGame === 'function') saveGame();
}
window.setAffixDetailsSetting = setAffixDetailsSetting;

function getActiveKeybinding(actionId) {
    const settings = ensureSettingsDefaults();
    if (!settings || !settings.keybinds) return DEFAULT_KEYBINDS[actionId] || null;
    const custom = settings.keybinds[actionId];
    if (typeof custom === 'string' && custom.trim()) return custom.trim();
    return DEFAULT_KEYBINDS[actionId] || null;
}

function _normalizeBindingValue(binding) {
    if (typeof binding !== 'string') return null;
    const trimmed = binding.trim();
    return trimmed ? trimmed : null;
}

function _bindingFromEvent(event) {
    if (!event) return null;
    if (typeof event.code === 'string' && event.code) return event.code;
    if (typeof event.key === 'string' && event.key) return event.key;
    return null;
}

function _matchesBinding(event, binding) {
    if (!event || typeof binding !== 'string' || !binding) return false;
    if (binding === 'Alt') {
        return event.key === 'Alt' || event.code === 'AltLeft' || event.code === 'AltRight';
    }
    return event.code === binding || event.key === binding;
}

function matchesActionKeybinding(actionId, event) {
    const binding = getActiveKeybinding(actionId);
    return _matchesBinding(event, binding);
}

function _formatBindingLabel(binding) {
    if (!binding || typeof binding !== 'string') return '-';
    const map = {
        Escape: 'Esc',
        Space: 'Space',
        ArrowUp: 'Arrow Up',
        ArrowDown: 'Arrow Down',
        ArrowLeft: 'Arrow Left',
        ArrowRight: 'Arrow Right',
        Alt: 'Alt'
    };
    if (Object.prototype.hasOwnProperty.call(map, binding)) return map[binding];
    if (binding.startsWith('Key') && binding.length === 4) return binding.slice(3);
    if (binding.startsWith('Digit') && binding.length === 6) return binding.slice(5);
    if (binding.startsWith('Numpad')) return `Num ${binding.slice(6)}`;
    return binding;
}

function setActionKeybinding(actionId, binding, options) {
    const opts = options && typeof options === 'object' ? options : {};
    if (!Object.prototype.hasOwnProperty.call(DEFAULT_KEYBINDS, actionId)) return;
    const normalized = _normalizeBindingValue(binding);
    ensureSettingsDefaults();
    if (normalized) {
        gameData.settings.keybinds[actionId] = normalized;
    } else {
        delete gameData.settings.keybinds[actionId];
    }
    if (opts.save !== false && typeof saveGame === 'function') saveGame();
    renderOptionsTab();
}

function resetAllKeybinds(options) {
    const opts = options && typeof options === 'object' ? options : {};
    ensureSettingsDefaults();
    gameData.settings.keybinds = {};
    _pendingRebindAction = null;
    if (opts.save !== false && typeof saveGame === 'function') saveGame();
    renderOptionsTab();
}
window.resetAllKeybinds = resetAllKeybinds;

function isKeybindCaptureActive() {
    return !!_pendingRebindAction;
}
window.isKeybindCaptureActive = isKeybindCaptureActive;
window.matchesActionKeybinding = matchesActionKeybinding;

function _syncOptionVolumeValue(channel, value) {
    const output = document.getElementById(`option-volume-${channel}-value`);
    if (output) output.textContent = String(_clampPercent(value, 100));
}

function _syncAudioVolumeLabelsAndSliders() {
    ['menu', 'music', 'ambient'].forEach((channel) => {
        const value = getAudioVolumePercent(channel);
        const slider = document.getElementById(`option-volume-${channel}`);
        if (slider) slider.value = String(value);
        _syncOptionVolumeValue(channel, value);
    });
}

function _clearAudioTimer(timerKey) {
    if (!audioRuntime[timerKey]) return;
    clearTimeout(audioRuntime[timerKey]);
    audioRuntime[timerKey] = null;
}

function _clearAudioRamp(timerKey) {
    if (!audioRuntime[timerKey]) return;
    clearInterval(audioRuntime[timerKey]);
    audioRuntime[timerKey] = null;
}

function _startAudioRamp(channel, element, fromVolume, toVolume, onDone) {
    const key = channel === 'music' ? 'musicRampTimer' : 'ambientRampTimer';
    _clearAudioRamp(key);
    if (!element) {
        if (typeof onDone === 'function') onDone();
        return;
    }
    const startValue = Math.max(0, Math.min(1, Number(fromVolume) || 0));
    const endValue = Math.max(0, Math.min(1, Number(toVolume) || 0));
    if (Math.abs(startValue - endValue) <= 0.001) {
        element.volume = endValue;
        if (typeof onDone === 'function') onDone();
        return;
    }
    const startedAt = Date.now();
    element.volume = startValue;
    audioRuntime[key] = setInterval(() => {
        const elapsed = Date.now() - startedAt;
        const t = Math.max(0, Math.min(1, elapsed / AUDIO_FADE_MS));
        element.volume = startValue + ((endValue - startValue) * t);
        if (t >= 1) {
            _clearAudioRamp(key);
            if (typeof onDone === 'function') onDone();
        }
    }, 100);
}

function _shuffleAudioQueue(list) {
    const queue = list.slice();
    for (let i = queue.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const swap = queue[i];
        queue[i] = queue[j];
        queue[j] = swap;
    }
    return queue;
}

function _nextTrackFromQueue(queueKey, sourceList) {
    if (!Array.isArray(audioRuntime[queueKey]) || audioRuntime[queueKey].length === 0) {
        audioRuntime[queueKey] = _shuffleAudioQueue(sourceList);
    }
    return audioRuntime[queueKey].shift() || null;
}

function _scheduleFadeOut(channel, element) {
    const key = channel === 'music' ? 'musicFadeOutTimer' : 'ambientFadeOutTimer';
    _clearAudioTimer(key);
    const durationSec = Number(element && element.duration);
    if (!Number.isFinite(durationSec) || durationSec <= (AUDIO_FADE_MS / 1000)) return;
    const delayMs = Math.max(0, (durationSec * 1000) - AUDIO_FADE_MS);
    audioRuntime[key] = setTimeout(() => {
        if (channel === 'music' && audioRuntime.musicEl !== element) return;
        if (channel === 'ambient' && audioRuntime.ambientEl !== element) return;
        _startAudioRamp(channel, element, element.volume, 0);
    }, delayMs);
}

function _syncActiveAudioVolumes() {
    const musicTarget = getAudioVolume('music');
    const ambientTarget = getAudioVolume('ambient');
    if (audioRuntime.musicEl && !audioRuntime.musicRampTimer) {
        audioRuntime.musicEl.volume = musicTarget;
    }
    if (audioRuntime.ambientEl && !audioRuntime.ambientRampTimer) {
        audioRuntime.ambientEl.volume = ambientTarget;
    }
}

function _bindAudioUnlockListener() {
    if (audioRuntime.unlockListenerBound) return;
    audioRuntime.unlockListenerBound = true;
    const onUserInteract = () => {
        // Prevent autoplay with default volumes before save settings are loaded.
        if (!audioRuntime.settingsReady) return;
        _ensureMusicLoopRunning(true);
        _syncAmbientLoopState(true);
    };
    document.addEventListener('pointerdown', onUserInteract, true);
    document.addEventListener('keydown', onUserInteract, true);
}

function _scheduleNextMusic(delayMs) {
    _clearAudioTimer('musicGapTimer');
    audioRuntime.musicGapTimer = setTimeout(() => {
        _playNextMusicTrack();
    }, Math.max(0, Number(delayMs) || 0));
}

function _playNextMusicTrack() {
    _clearAudioTimer('musicGapTimer');
    if (audioRuntime.musicEl) {
        try { audioRuntime.musicEl.pause(); } catch (err) {}
        audioRuntime.musicEl = null;
    }
    const nextTrack = _nextTrackFromQueue('musicQueue', MUSIC_TRACKS);
    if (!nextTrack) {
        _scheduleNextMusic(MUSIC_GAP_MS);
        return;
    }

    const track = new Audio(_resolveAssetUrl(nextTrack));
    track.preload = 'auto';
    track.loop = false;
    track.volume = 0;
    audioRuntime.musicEl = track;
    _clearAudioTimer('musicFadeOutTimer');
    _clearAudioRamp('musicRampTimer');

    track.addEventListener('loadedmetadata', () => {
        _scheduleFadeOut('music', track);
    });
    track.addEventListener('ended', () => {
        if (audioRuntime.musicEl === track) {
            audioRuntime.musicEl = null;
            _clearAudioRamp('musicRampTimer');
            _clearAudioTimer('musicFadeOutTimer');
            _scheduleNextMusic(MUSIC_GAP_MS);
        }
    });
    track.addEventListener('error', () => {
        if (audioRuntime.musicEl === track) {
            audioRuntime.musicEl = null;
            _clearAudioRamp('musicRampTimer');
            _clearAudioTimer('musicFadeOutTimer');
            _scheduleNextMusic(MUSIC_GAP_MS);
        }
    });

    const playPromise = track.play();
    if (playPromise && typeof playPromise.catch === 'function') {
        playPromise.then(() => {
            _startAudioRamp('music', track, 0, getAudioVolume('music'));
        }).catch(() => {
            if (audioRuntime.musicEl === track) {
                audioRuntime.musicEl = null;
            }
            _bindAudioUnlockListener();
            _scheduleNextMusic(2000);
        });
    } else {
        _startAudioRamp('music', track, 0, getAudioVolume('music'));
    }
}

function _ensureMusicLoopRunning(forceRestart = false) {
    if (audioRuntime.musicEl) {
        if (forceRestart && audioRuntime.musicEl.paused) {
            const playPromise = audioRuntime.musicEl.play();
            if (playPromise && typeof playPromise.catch === 'function') {
                playPromise.catch(() => {});
            }
        }
        return;
    }
    if (!forceRestart && audioRuntime.musicGapTimer) return;
    if (forceRestart) {
        _clearAudioTimer('musicGapTimer');
    }
    _scheduleNextMusic(0);
}

function _stopAmbientPlayback() {
    _clearAudioTimer('ambientGapTimer');
    _clearAudioTimer('ambientFadeOutTimer');
    const current = audioRuntime.ambientEl;
    if (!current) return;
    _startAudioRamp('ambient', current, current.volume, 0, () => {
        if (audioRuntime.ambientEl === current) {
            current.pause();
            audioRuntime.ambientEl = null;
        }
    });
}

function _scheduleNextAmbient(delayMs) {
    _clearAudioTimer('ambientGapTimer');
    if (!audioRuntime.coastActive) return;
    audioRuntime.ambientGapTimer = setTimeout(() => {
        _playNextAmbientTrack();
    }, Math.max(0, Number(delayMs) || 0));
}

function _playNextAmbientTrack() {
    _clearAudioTimer('ambientGapTimer');
    if (!audioRuntime.coastActive) return;
    if (audioRuntime.ambientEl) {
        try { audioRuntime.ambientEl.pause(); } catch (err) {}
        audioRuntime.ambientEl = null;
    }

    const nextTrack = _nextTrackFromQueue('ambientQueue', COAST_AMBIENT_TRACKS);
    if (!nextTrack) {
        _scheduleNextAmbient(AMBIENT_GAP_MS);
        return;
    }

    const clip = new Audio(_resolveAssetUrl(nextTrack));
    clip.preload = 'auto';
    clip.loop = false;
    clip.volume = 0;
    audioRuntime.ambientEl = clip;
    _clearAudioTimer('ambientFadeOutTimer');
    _clearAudioRamp('ambientRampTimer');

    clip.addEventListener('loadedmetadata', () => {
        _scheduleFadeOut('ambient', clip);
    });
    clip.addEventListener('ended', () => {
        if (audioRuntime.ambientEl === clip) {
            audioRuntime.ambientEl = null;
            _clearAudioRamp('ambientRampTimer');
            _clearAudioTimer('ambientFadeOutTimer');
            _scheduleNextAmbient(AMBIENT_GAP_MS);
        }
    });
    clip.addEventListener('error', () => {
        if (audioRuntime.ambientEl === clip) {
            audioRuntime.ambientEl = null;
            _clearAudioRamp('ambientRampTimer');
            _clearAudioTimer('ambientFadeOutTimer');
            _scheduleNextAmbient(AMBIENT_GAP_MS);
        }
    });

    const playPromise = clip.play();
    if (playPromise && typeof playPromise.catch === 'function') {
        playPromise.then(() => {
            _startAudioRamp('ambient', clip, 0, getAudioVolume('ambient'));
        }).catch(() => {
            if (audioRuntime.ambientEl === clip) {
                audioRuntime.ambientEl = null;
            }
            _bindAudioUnlockListener();
            _scheduleNextAmbient(2000);
        });
    } else {
        _startAudioRamp('ambient', clip, 0, getAudioVolume('ambient'));
    }
}

function _isCoastZoneViewActive() {
    const grindTab = document.getElementById('tab-grind');
    if (!grindTab) return false;
    return zoneCombatState.zoneId === 'coast' &&
        grindTab.classList.contains('zone-view') &&
        grindTab.classList.contains('active');
}

function _syncAmbientLoopState(forceRestart = false) {
    const shouldBeActive = _isCoastZoneViewActive();
    if (!shouldBeActive) {
        audioRuntime.coastActive = false;
        _stopAmbientPlayback();
        return;
    }

    audioRuntime.coastActive = true;
    if (audioRuntime.ambientEl) {
        if (forceRestart && audioRuntime.ambientEl.paused) {
            const playPromise = audioRuntime.ambientEl.play();
            if (playPromise && typeof playPromise.catch === 'function') {
                playPromise.catch(() => {});
            }
        }
        return;
    }
    if (!forceRestart && audioRuntime.ambientGapTimer) return;
    if (forceRestart) {
        _clearAudioTimer('ambientGapTimer');
    }
    _scheduleNextAmbient(0);
}

function setAudioVolumeSetting(channel, value, options) {
    if (!Object.prototype.hasOwnProperty.call(DEFAULT_AUDIO_SETTINGS, channel)) return;
    const opts = options && typeof options === 'object' ? options : {};
    ensureSettingsDefaults();
    const nextValue = _clampPercent(value, DEFAULT_AUDIO_SETTINGS[channel]);
    gameData.settings.audio[channel] = nextValue;
    _syncOptionVolumeValue(channel, nextValue);
    _syncActiveAudioVolumes();
    if (opts.save !== false && typeof saveGame === 'function') saveGame();
}
window.setAudioVolumeSetting = setAudioVolumeSetting;

function _renderOptionsKeybindList() {
    const host = document.getElementById('options-keybind-list');
    if (!host) return;
    host.innerHTML = '';

    KEYBIND_DEFINITIONS.forEach((entry) => {
        const row = document.createElement('div');
        row.className = 'options-keybind-row';

        const label = document.createElement('span');
        label.className = 'options-keybind-label';
        label.textContent = entry.label;

        const value = document.createElement('span');
        value.className = 'options-keybind-value';
        value.textContent = _formatBindingLabel(getActiveKeybinding(entry.id));

        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'options-keybind-bind';
        if (_pendingRebindAction === entry.id) {
            button.classList.add('waiting');
            button.textContent = 'Taste drücken...';
        } else {
            button.textContent = 'Neu binden';
        }
        button.addEventListener('click', () => {
            _pendingRebindAction = entry.id;
            _renderOptionsKeybindList();
        });

        row.appendChild(label);
        row.appendChild(value);
        row.appendChild(button);
        host.appendChild(row);
    });
}

function renderOptionsTab() {
    _renderOptionsKeybindList();
    _syncAudioVolumeLabelsAndSliders();
    _syncDevModeOptionToggle();
    _syncAffixDetailsOptionToggle();
}
window.renderOptionsTab = renderOptionsTab;

function _onRebindKeyCapture(event) {
    if (!_pendingRebindAction) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    const binding = _bindingFromEvent(event);
    if (!binding) return;
    const actionId = _pendingRebindAction;
    _pendingRebindAction = null;
    setActionKeybinding(actionId, binding);
}

function _isTextInputTarget(target) {
    return !!(target && (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable
    ));
}

function _onDevModeGlobalKeyDown(event) {
    if (!event || event.repeat) return;
    if (!isDevModeEnabled()) return;
    if (typeof window.isKeybindCaptureActive === 'function' && window.isKeybindCaptureActive()) return;
    if (_isTextInputTarget(event.target)) return;

    const isGrantGoldKey = event.code === DEV_MODE_GOLD_HOTKEY_CODE
        || (typeof event.key === 'string' && event.key.toLowerCase() === 'g');
    const isGrantLevelKey = event.code === DEV_MODE_LEVEL_HOTKEY_CODE
        || (typeof event.key === 'string' && event.key.toLowerCase() === 'l');
    if (!isGrantGoldKey && !isGrantLevelKey) return;

    if (isGrantGoldKey) {
        const granted = (typeof addGold === 'function')
            ? addGold(DEV_MODE_GOLD_GRANT_AMOUNT, 'dev_mode_hotkey')
            : 0;
        if (granted <= 0) return;
        if (typeof updateUI === 'function') updateUI();
        if (typeof saveGame === 'function') saveGame();
        console.info(`[DEV] Granted ${granted} gold via ${DEV_MODE_GOLD_HOTKEY_CODE}.`);
        event.preventDefault();
        return;
    }

    if (typeof ensureCharacterModelOnGameData === 'function') {
        ensureCharacterModelOnGameData(gameData);
    }
    const base = (gameData.character && gameData.character.base) ? gameData.character.base : null;
    const currentLevel = Number.isFinite(base && base.level) ? Math.max(1, Math.floor(base.level)) : Math.max(1, Math.floor(gameData.level || 1));
    const currentXp = Number.isFinite(base && base.xp) ? Math.max(0, base.xp) : Math.max(0, Number(gameData.xp) || 0);
    const xpToNext = (typeof calculateXpToNextLevel === 'function')
        ? calculateXpToNextLevel(currentLevel)
        : Math.max(1, Math.floor(Number(gameData.xpNextLevel) || 1));
    const xpNeededForLevel = Math.max(1, Math.ceil(xpToNext - currentXp));
    const xpResult = (typeof grantXP === 'function')
        ? grantXP(xpNeededForLevel, 'dev_mode_hotkey_level', getActiveCombatGridKey())
        : { levelsGained: 0, gainedXP: 0 };
    if (!xpResult || xpResult.levelsGained < 1) return;

    console.info(`[DEV] Granted +1 level via ${DEV_MODE_LEVEL_HOTKEY_CODE} (${xpResult.gainedXP} XP).`);
    if (typeof updateUI === 'function') updateUI();
    if (typeof saveGame === 'function') saveGame();
    event.preventDefault();
}

if (typeof document !== 'undefined' && typeof document.addEventListener === 'function') {
    document.addEventListener('keydown', _onRebindKeyCapture, true);
    document.addEventListener('keydown', _onDevModeGlobalKeyDown, true);
}

ensureSettingsDefaults();
_bindAudioUnlockListener();

function _getUISoundBase(soundKey) {
    const path = UI_SOUND_PATHS[soundKey];
    if (!path) return null;
    if (_uiSoundBases[soundKey]) return _uiSoundBases[soundKey];

    const audio = new Audio(_resolveAssetUrl(path));
    audio.preload = 'auto';
    _uiSoundBases[soundKey] = audio;
    return audio;
}

function playUISound(soundKey) {
    try {
        const base = _getUISoundBase(soundKey);
        if (!base) return;

        const voice = base.cloneNode();
        voice.currentTime = 0;
        voice.volume = getAudioVolume('menu');
        const playPromise = voice.play();
        if (playPromise && typeof playPromise.catch === 'function') {
            playPromise.catch(() => {});
        }
    } catch (err) {
        // Audio failures must never block UI actions.
    }
}
window.playUISound = playUISound;

function playUISoundDeferred(soundKey) {
    setTimeout(() => {
        playUISound(soundKey);
    }, 0);
}

function _normalizeButtonLabel(value) {
    if (!value) return '';
    const raw = String(value).toLowerCase();
    const normalized = (typeof raw.normalize === 'function')
        ? raw.normalize('NFD')
        : raw;
    return normalized
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
}

function _isBackButton(button) {
    if (!button) return false;
    if (button.classList.contains('world-back-btn')) return true;

    const label = _normalizeButtonLabel(button.textContent);
    return label.includes('zuruck') || /\bback\b/.test(label);
}

function _isBuyButton(button) {
    if (!button) return false;
    if (button.classList.contains('buy-btn')) return true;
    const onClick = (button.getAttribute('onclick') || '').toLowerCase();
    return onClick.includes('buyitem(');
}

function _isSellCommitButton(button) {
    if (!button) return false;
    if (button.id === 'execute-bulk-sell') return true;
    const onClick = (button.getAttribute('onclick') || '').toLowerCase();
    return onClick.includes('executebulksell(');
}

function initUISoundBindings() {
    if (window.__uiSoundBindingsInitialized) return;
    window.__uiSoundBindingsInitialized = true;

    document.addEventListener('click', (event) => {
        const target = event.target;
        const button = target && typeof target.closest === 'function'
            ? target.closest('button')
            : null;
        if (!button || button.disabled) return;
        if (button.closest('#tooltip')) return;

        if (_isBackButton(button)) {
            playUISoundDeferred('back');
            return;
        }

        // Buy/Sell commit use dedicated SFX in the action handlers.
        if (_isBuyButton(button) || _isSellCommitButton(button)) {
            return;
        }

        playUISoundDeferred('click');
    });

    document.addEventListener('mouseover', (event) => {
        const target = event.target;
        const button = target && typeof target.closest === 'function'
            ? target.closest('button')
            : null;
        if (!button || button.disabled) return;
        if (button.closest('#tooltip')) return;

        const previous = event.relatedTarget;
        if (previous && typeof button.contains === 'function' && button.contains(previous)) {
            return;
        }

        if (_lastHoveredMenuButton === button) return;
        _lastHoveredMenuButton = button;

        const now = Date.now();
        if ((now - _lastMenuHoverSoundAt) < 65) return;
        _lastMenuHoverSoundAt = now;
        playUISoundDeferred('menuHover');
    });

    document.addEventListener('mouseout', (event) => {
        const target = event.target;
        const button = target && typeof target.closest === 'function'
            ? target.closest('button')
            : null;
        if (!button) return;

        const next = event.relatedTarget;
        if (next && typeof button.contains === 'function' && button.contains(next)) {
            return;
        }

        if (_lastHoveredMenuButton === button) {
            _lastHoveredMenuButton = null;
        }
    });
}

if (typeof ensureBankPageData === 'function') {
    ensureBankPageData(gameData);
}

function createDefaultBattlefieldState() {
    const pages = {};
    for (let i = 1; i <= BATTLEFIELD_MAX_PAGES; i++) {
        pages[String(i)] = {};
    }
    return {
        pages,
        unlockedPages: BATTLEFIELD_DEFAULT_UNLOCKED_PAGES,
        activePage: 1,
        slotLayoutVersion: BATTLEFIELD_SLOT_LAYOUT_VERSION
    };
}

function _isBattlefieldItemCell(cell) {
    return !!(cell && typeof cell === 'object' && typeof cell.itemId === 'string' && cell.itemId && cell.root !== false);
}

function _generateBattlefieldInstanceId() {
    if (typeof generateInstanceId === 'function') {
        return generateInstanceId();
    }
    return `inst_${Date.now()}${Math.floor(Math.random() * 1000)}`;
}

function _migrateBattlefieldToSingleSlotLayout(data, battlefield) {
    if (!battlefield || !battlefield.pages || typeof battlefield.pages !== 'object') return;

    const entries = [];
    const seenInstanceIds = new Set();

    for (let page = 1; page <= BATTLEFIELD_MAX_PAGES; page++) {
        const grid = battlefield.pages[String(page)];
        if (!grid || typeof grid !== 'object') continue;
        const keys = Object.keys(grid)
            .map((slotKey) => Number(slotKey))
            .filter((index) => Number.isFinite(index))
            .sort((a, b) => a - b);

        keys.forEach((index) => {
            const cell = grid[index];
            if (!_isBattlefieldItemCell(cell)) return;
            const instanceId = (typeof cell.instanceId === 'string' && cell.instanceId) ? cell.instanceId : null;
            if (instanceId && seenInstanceIds.has(instanceId)) return;
            if (instanceId) seenInstanceIds.add(instanceId);
            const itemLevel = Number(cell.itemLevel);
            entries.push({
                itemId: cell.itemId,
                instanceId,
                itemLevel: (Number.isFinite(itemLevel) && itemLevel > 0) ? Math.floor(itemLevel) : 1
            });
        });
    }

    for (let page = 1; page <= BATTLEFIELD_MAX_PAGES; page++) {
        battlefield.pages[String(page)] = {};
    }

    const maxSlots = BATTLEFIELD_MAX_PAGES * BATTLEFIELD_PAGE_SLOTS;
    const allowedCount = Math.max(0, Math.min(entries.length, maxSlots));
    for (let i = 0; i < allowedCount; i++) {
        const entry = entries[i];
        const targetPage = 1 + Math.floor(i / BATTLEFIELD_PAGE_SLOTS);
        const targetSlot = i % BATTLEFIELD_PAGE_SLOTS;
        const pageGrid = battlefield.pages[String(targetPage)] || (battlefield.pages[String(targetPage)] = {});

        const instanceId = entry.instanceId || _generateBattlefieldInstanceId();
        pageGrid[targetSlot] = {
            itemId: entry.itemId,
            instanceId,
            itemLevel: entry.itemLevel,
            root: true
        };

        if (typeof registerItemInstance === 'function') {
            const existing = (typeof getItemInstanceData === 'function') ? getItemInstanceData(data, instanceId) : null;
            if (!existing || existing.itemId !== entry.itemId) {
                registerItemInstance(data, instanceId, entry.itemId, entry.itemLevel, { source: 'battlefield_migrate' });
            }
        }
    }

    if (entries.length > allowedCount) {
        console.warn('BATTLEFIELD_MIGRATION_OVERFLOW', {
            droppedItems: entries.length - allowedCount,
            capacity: maxSlots
        });
    }
}

function ensureBattlefieldData(data = gameData) {
    if (!data || typeof data !== 'object') return null;
    if (!data.battlefield || typeof data.battlefield !== 'object' || Array.isArray(data.battlefield)) {
        data.battlefield = createDefaultBattlefieldState();
    }

    const battlefield = data.battlefield;
    if (!battlefield.pages || typeof battlefield.pages !== 'object' || Array.isArray(battlefield.pages)) {
        battlefield.pages = {};
    }
    for (let i = 1; i <= BATTLEFIELD_MAX_PAGES; i++) {
        const key = String(i);
        if (!battlefield.pages[key] || typeof battlefield.pages[key] !== 'object' || Array.isArray(battlefield.pages[key])) {
            battlefield.pages[key] = {};
        }
    }

    const unlocked = Number.isFinite(battlefield.unlockedPages) ? Math.floor(battlefield.unlockedPages) : BATTLEFIELD_DEFAULT_UNLOCKED_PAGES;
    battlefield.unlockedPages = Math.max(1, Math.min(BATTLEFIELD_MAX_PAGES, unlocked));
    const active = Number.isFinite(battlefield.activePage) ? Math.floor(battlefield.activePage) : 1;
    battlefield.activePage = Math.max(1, Math.min(battlefield.unlockedPages, active));

    if (battlefield.slotLayoutVersion !== BATTLEFIELD_SLOT_LAYOUT_VERSION) {
        _migrateBattlefieldToSingleSlotLayout(data, battlefield);
        battlefield.slotLayoutVersion = BATTLEFIELD_SLOT_LAYOUT_VERSION;
    }

    return battlefield;
}

if (typeof ensureBattlefieldDefaultsInData === 'function') {
    ensureBattlefieldDefaultsInData(gameData);
} else {
    ensureBattlefieldData(gameData);
}

function _getBattlefieldPageGrid(pageNumber) {
    const battlefield = ensureBattlefieldData(gameData);
    if (!battlefield) return {};
    const page = Number.isFinite(pageNumber) ? Math.floor(pageNumber) : battlefield.activePage;
    const clampedPage = Math.max(1, Math.min(BATTLEFIELD_MAX_PAGES, page));
    const key = String(clampedPage);
    if (!battlefield.pages[key] || typeof battlefield.pages[key] !== 'object') {
        battlefield.pages[key] = {};
    }
    return battlefield.pages[key];
}

function _getBattlefieldItemLevel(cell) {
    if (cell && cell.instanceId && typeof getItemInstanceData === 'function') {
        const instance = getItemInstanceData(gameData, cell.instanceId);
        if (instance && Number.isFinite(instance.itemLevel)) {
            return Math.max(1, Math.floor(instance.itemLevel));
        }
    }
    const raw = Number(cell && cell.itemLevel);
    if (Number.isFinite(raw) && raw > 0) return Math.max(1, Math.floor(raw));
    return Math.max(1, Math.floor(Number.isFinite(gameData.level) ? gameData.level : 1));
}

function _resolveBattlefieldRootEntryByInstanceId(instanceId) {
    if (typeof instanceId !== 'string' || !instanceId) return null;
    const battlefield = ensureBattlefieldData(gameData);
    if (!battlefield) return null;

    for (let page = 1; page <= battlefield.unlockedPages; page++) {
        const grid = _getBattlefieldPageGrid(page);
        const keys = Object.keys(grid);
        for (let i = 0; i < keys.length; i++) {
            const slotKey = keys[i];
            const cell = grid[slotKey];
            if (!_isBattlefieldItemCell(cell) || cell.instanceId !== instanceId) continue;
            const index = Number(slotKey);
            return {
                page,
                index: Number.isFinite(index) ? index : 0,
                grid,
                cell
            };
        }
    }
    return null;
}

function _collectBattlefieldRootEntries() {
    const battlefield = ensureBattlefieldData(gameData);
    if (!battlefield) return [];

    const entries = [];
    for (let page = 1; page <= battlefield.unlockedPages; page++) {
        const grid = _getBattlefieldPageGrid(page);
        Object.keys(grid).forEach((slotKey) => {
            const cell = grid[slotKey];
            const idx = Number(slotKey);
            if (!Number.isFinite(idx) || idx < 0 || idx >= BATTLEFIELD_PAGE_SLOTS) return;
            if (!_isBattlefieldItemCell(cell)) return;

            let instanceId = _resolveBattlefieldCellInstanceId(grid, idx);
            if (!instanceId) {
                instanceId = _generateBattlefieldInstanceId();
                cell.instanceId = instanceId;
                cell.root = true;
            }

            entries.push({
                page,
                index: idx,
                grid,
                cell
            });
        });
    }
    entries.sort((a, b) => {
        if (a.page !== b.page) return a.page - b.page;
        return a.index - b.index;
    });
    return entries;
}

function _countBattlefieldItems() {
    return _collectBattlefieldRootEntries().length;
}

// Resolve static item values via centralized item definitions.
function getItemDefinition(itemId, cell) {
    if (cell && typeof getRuntimeItemDefinition === "function") {
        const runtimeItem = getRuntimeItemDefinition(gameData, itemId, cell);
        if (runtimeItem) return runtimeItem;
    }
    if (typeof getItemDefById === 'function') {
        const def = getItemDefById(itemId);
        if (def) return def;
    }
    if (typeof getItemById === 'function') {
        return getItemById(itemId);
    }
    return null;
}

function getDerivedCharacterStats(gridKey = 'farmGrid') {
    if (typeof ensureCharacterModelOnGameData === 'function') {
        ensureCharacterModelOnGameData(gameData);
    }
    if (typeof getCharacterDerivedStats === 'function') {
        return getCharacterDerivedStats(gameData, {
            gridKey,
            resolver: (itemId, cell) => getItemDefinition(itemId, cell)
        });
    }
    return null;
}

function markCharacterDirty() {
    if (typeof markCharacterStatsDirty === 'function') {
        markCharacterStatsDirty(gameData);
    }
}

function awardCharacterXP(amount, gridKey = 'farmGrid') {
    const xpAmount = Number.isFinite(amount) ? amount : 0;
    if (xpAmount <= 0) return { levelsGained: 0, leveledUp: false };

    if (typeof grantCharacterXP === 'function') {
        return grantCharacterXP(gameData, xpAmount, {
            gridKey,
            resolver: getItemDefinition
        });
    }

    gameData.xp += xpAmount;
    if (gameData.xp >= gameData.xpNextLevel) {
        gameData.xp -= gameData.xpNextLevel;
        gameData.level += 1;
        gameData.maxHp = calculateMaxHp(gameData.level);
        gameData.hp = gameData.maxHp;
        gameData.xpNextLevel = calculateNextLevelXpRequirement(gameData.level);
        return { levelsGained: 1, leveledUp: true };
    }
    return { levelsGained: 0, leveledUp: false };
}

function addGold(amount, reason = 'unknown') {
    const delta = Number.isFinite(amount) ? amount : 0;
    if (delta === 0) return 0;

    const current = Number.isFinite(gameData.gold) ? gameData.gold : 0;
    const next = Math.max(0, current + delta);
    const applied = next - current;
    gameData.gold = next;

    if (applied > 0) {
        const total = Number.isFinite(gameData.totalGold) ? gameData.totalGold : 0;
        gameData.totalGold = total + applied;
    }

    return applied;
}

function grantXP(amount, reason = 'unknown', gridKey = 'farmGrid') {
    const xpAmount = Number.isFinite(amount) ? amount : 0;
    if (xpAmount <= 0) {
        return { gainedXP: 0, levelsGained: 0, leveledUp: false };
    }

    const result = awardCharacterXP(xpAmount, gridKey);
    const total = Number.isFinite(gameData.totalXP) ? gameData.totalXP : 0;
    gameData.totalXP = total + xpAmount;
    return {
        gainedXP: xpAmount,
        levelsGained: result.levelsGained || 0,
        leveledUp: !!result.leveledUp
    };
}

if (typeof window !== 'undefined') {
    window.addGold = addGold;
    window.grantXP = grantXP;
}

function getWorkshopGridKey(workshopType) {
    if (workshopType === 'pve') return 'pveGrid';
    if (workshopType === 'pvp') return 'pvpGrid';
    return 'farmGrid';
}

function getWorkshopOverlayGridKey(workshopType) {
    if (workshopType === 'pve') return 'pveGrid';
    if (workshopType === 'pvp') return 'pvpGrid';
    if (workshopType === 'sort') return 'sortGrid';
    return 'farmGrid';
}

function getCharacterHubGridKey() {
    return getWorkshopGridKey(characterHubActiveSetup);
}

function _getGridKeyForSetup(setupType) {
    if (setupType === 'pve') return 'pveGrid';
    if (setupType === 'pvp') return 'pvpGrid';
    return 'farmGrid';
}

function getActiveCombatGridKey() {
    const inZonePveContext = zoneCombatState.active || _isCoastZoneViewActive();
    if (inZonePveContext || currentWorkshop === 'pve') {
        return ZONE_COMBAT_GRID_KEY;
    }
    if (currentWorkshop === 'farm' || currentWorkshop === 'pvp') {
        return getWorkshopGridKey(currentWorkshop);
    }
    return _getGridKeyForSetup(characterHubActiveSetup);
}

function _getFreshDerivedCharacterStats(gridKey) {
    const resolvedGridKey = (typeof gridKey === 'string' && gridKey) ? gridKey : 'farmGrid';
    if (typeof ensureCharacterModelOnGameData === 'function') {
        ensureCharacterModelOnGameData(gameData);
    }

    if (
        typeof computeCharacterStats === 'function' &&
        typeof collectEquippedItemEntries === 'function' &&
        gameData &&
        gameData.character &&
        gameData.character.base
    ) {
        const equippedGrid = gameData[resolvedGridKey] && typeof gameData[resolvedGridKey] === 'object'
            ? gameData[resolvedGridKey]
            : {};
        const equippedItemEntries = collectEquippedItemEntries(equippedGrid, (itemId, cell) => getItemDefinition(itemId, cell));
        return computeCharacterStats({
            base: gameData.character.base,
            equippedItemEntries
        });
    }

    return getDerivedCharacterStats(resolvedGridKey);
}

function _resolveDerivedDamageRange(stats) {
    if (!stats || typeof stats !== 'object') return null;
    const minDirect = Number(stats.physicalDamageMin);
    const maxDirect = Number(stats.physicalDamageMax);
    if (Number.isFinite(minDirect) || Number.isFinite(maxDirect)) {
        const min = Math.max(0, Number.isFinite(minDirect) ? minDirect : 0);
        const max = Math.max(min, Number.isFinite(maxDirect) ? maxDirect : min);
        return { min, max };
    }
    if (!stats.finalDamage || typeof stats.finalDamage !== 'object') return null;
    const physical = stats.finalDamage.physical || {};
    const min = Number(physical.min);
    const max = Number(physical.max);
    if (!Number.isFinite(min) && !Number.isFinite(max)) return null;
    const safeMin = Math.max(0, Number.isFinite(min) ? min : 0);
    const safeMax = Math.max(safeMin, Number.isFinite(max) ? max : safeMin);
    return { min: safeMin, max: safeMax };
}

function _rollDamageInRange(range) {
    if (!range) return 0;
    const min = Number.isFinite(range.min) ? Math.max(0, range.min) : 0;
    const max = Number.isFinite(range.max) ? Math.max(min, range.max) : min;
    if (max <= min) return min;
    return min + (Math.random() * (max - min));
}

function _logLegacyFallback(reason, details = {}) {
    const payload = {
        tag: LEGACY_FALLBACK_TAG,
        reason,
        ...details
    };
    console.warn(LEGACY_FALLBACK_TAG, payload);
    _appendZoneCombatVerbose(`${LEGACY_FALLBACK_TAG}: ${reason}`);
}

function buildCharacterPanelPayload(gridKey) {
    if (!gameData || typeof gameData !== 'object') return null;
    if (typeof ensureCharacterModelOnGameData === 'function') {
        ensureCharacterModelOnGameData(gameData);
    }

    const key = (typeof gridKey === 'string' && gridKey) ? gridKey : 'farmGrid';
    const base = gameData.character && gameData.character.base ? gameData.character.base : null;
    if (!base) return null;

    if (key === 'farmGrid') {
        const derived = (gameData.character && gameData.character.derived) || getDerivedCharacterStats('farmGrid');
        return { gridKey: key, base, derived };
    }

    if (typeof computeCharacterStats === 'function' && typeof collectEquippedItemEntries === 'function') {
        const equippedGrid = gameData[key] && typeof gameData[key] === 'object' ? gameData[key] : {};
        const equippedItemEntries = collectEquippedItemEntries(equippedGrid, (itemId, cell) => getItemDefinition(itemId, cell));
        const derived = computeCharacterStats({
            base,
            equippedItemEntries
        });
        return { gridKey: key, base, derived };
    }

    return { gridKey: key, base, derived: null };
}

function mountCharacterPanels() {
    if (typeof CharacterPanel === 'undefined' || typeof CharacterPanel.mountPanel !== 'function') return;

    CharacterPanel.mountPanel('#workshop-character-panel-host', {
        panelId: 'workshop-character-panel',
        mode: 'compact',
        title: 'Charakter',
        getGridKey: () => getWorkshopGridKey(currentWorkshop),
        getPayload: ({ gridKey }) => buildCharacterPanelPayload(gridKey)
    });

    CharacterPanel.mountPanel('#character-tab-panel-host', {
        panelId: 'character-overview-panel',
        mode: 'full',
        title: 'Charakter Overview',
        getGridKey: () => getCharacterHubGridKey(),
        getPayload: ({ gridKey }) => buildCharacterPanelPayload(gridKey)
    });
}

function refreshCharacterPanels() {
    if (typeof CharacterPanel !== 'undefined' && typeof CharacterPanel.refreshAll === 'function') {
        CharacterPanel.refreshAll();
    }
}

function syncCharacterHubSetupButtons() {
    const buttons = document.querySelectorAll('.character-setup-btn');
    buttons.forEach((btn) => {
        const setup = btn.dataset && btn.dataset.setup ? btn.dataset.setup : '';
        btn.classList.toggle('active', setup === characterHubActiveSetup);
    });
}

function renderCharacterHubGrid() {
    const gridContainer = document.getElementById('character-setup-grid');
    if (!gridContainer) return;
    
    const gridKey = getCharacterHubGridKey();
    
    // Stelle sicher, dass Grids existieren
    if (!gameData[gridKey]) gameData[gridKey] = {};
    
    // Clear und render das Equipment-Grid (kein Storage/Bank)
    gridContainer.innerHTML = '';
    gridContainer.style.overflow = 'hidden';
    
    const totalSlots = GRID_SIZE * GRID_ROWS;
    for (let i = 0; i < totalSlots; i++) {
        createSlot(gridContainer, gridKey, i, GRID_SIZE);
    }
    
    // Render drag preview
    renderDragPreviewForGrid(gridContainer, gridKey, GRID_SIZE, totalSlots);
}

function setCharacterHubSetup(setupType) {
    if (!['farm', 'pve', 'pvp'].includes(setupType)) return;
    
    characterHubActiveSetup = setupType;
    
    // Sync button states
    syncCharacterHubSetupButtons();
    
    // Render grid für neues Setup
    renderCharacterHubGrid();
    
    // Update character panel
    refreshCharacterPanels();
    
    // Dispatch event für externe Systeme
    dispatchCharacterStatsUpdated(getCharacterHubGridKey());
}

function dispatchCharacterStatsUpdated(gridKey) {
    if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function' && typeof CustomEvent === 'function') {
        const payload = buildCharacterPanelPayload(gridKey || getCharacterHubGridKey());
        window.dispatchEvent(new CustomEvent('character:stats-updated', {
            detail: payload || { gridKey: (gridKey || getCharacterHubGridKey()) }
        }));
    }
}

function _formatStatLabel(statPath) {
    if (typeof statPath !== 'string') return '';
    return statPath.replace(/\./g, ' ').toUpperCase();
}

function _formatMutatorValue(entry) {
    const parts = [];
    if (_isFiniteNumber(entry.flat)) {
        const formatted = (entry.flat > 0 ? '+' : '') + entry.flat.toFixed(2);
        parts.push(formatted.replace(/\+?-0\.00/, '0.00'));
    }
    if (_isFiniteNumber(entry.percent)) {
        const percent = entry.percent * 100;
        const sign = percent > 0 ? '+' : '';
        parts.push(`${sign}${percent.toFixed(2)}%`);
    }
    if (parts.length === 0) {
        return '0';
    }
    return parts.join(' / ');
}

function _getMutatorValueClass(entry) {
    const flat = _isFiniteNumber(entry && entry.flat) ? entry.flat : 0;
    const percent = _isFiniteNumber(entry && entry.percent) ? entry.percent : 0;
    const epsilon = 0.000001;

    if (Math.abs(flat) <= epsilon && Math.abs(percent) <= epsilon) {
        return 'stat-zero';
    }

    if ((flat > epsilon && percent >= -epsilon) || (percent > epsilon && flat >= -epsilon)) {
        return 'stat-pos';
    }

    if ((flat < -epsilon && percent <= epsilon) || (percent < -epsilon && flat <= epsilon)) {
        return 'stat-neg';
    }

    return 'stat-zero';
}

function collectActiveItemModifierTotals(workshopType) {
    if (!gameData || typeof gameData !== 'object') return [];
    if (workshopType === 'sort') return [];
    ensureCharacterModelOnGameData(gameData);
    const base = gameData.character && gameData.character.base ? gameData.character.base : null;
    if (!base) return [];

    const normalizedBase = normalizeCharacterBase(base);
    const attributeModifiers = _buildAttributeModifiers(normalizedBase.baseAttributes);
    const levelModifiers = _buildLevelModifiers(normalizedBase.level);
    const progressionModifiers = [...attributeModifiers, ...levelModifiers];

    const activationPreview = _createRuntimeStatsFromBase(normalizedBase);
    const activationSplit = _splitModifiersByType(progressionModifiers);
    _applyModifierPhases(activationPreview, activationSplit.flatModifiers, activationSplit.percentModifiers);
    activationPreview.weightLimit = Math.max(
        1,
        _num(activationPreview.weightLimit, _calculateWeightLimitFromStrength(normalizedBase.baseAttributes.str))
    );

    const gridKey = getWorkshopGridKey(workshopType);
    const grid = (gridKey && typeof gameData[gridKey] === 'object') ? gameData[gridKey] : {};
    const equippedEntries = collectEquippedItemEntries(grid, (itemId, cell) => getItemDefinition(itemId, cell));
    const weightClass = _classifyWeightActivation(equippedEntries, activationPreview.weightLimit);
    const totals = new Map();

    weightClass.active.forEach((entry) => {
        extractItemModifiers(entry.item).forEach((modifier) => {
            if (!modifier || typeof modifier.statPath !== 'string' || !CHARACTER_MODIFIER_TYPES.includes(modifier.type)) return;
            const record = totals.get(modifier.statPath) || { statPath: modifier.statPath, flat: 0, percent: 0 };
            record[modifier.type] += modifier.value;
            totals.set(modifier.statPath, record);
        });
    });

    return Array.from(totals.values()).sort((a, b) => {
        const aScore = Math.abs(a.flat) + Math.abs(a.percent) * 100;
        const bScore = Math.abs(b.flat) + Math.abs(b.percent) * 100;
        if (bScore !== aScore) return bScore - aScore;
        return a.statPath.localeCompare(b.statPath);
    });
}

function renderItemMutatorSummary(workshopType) {
    const host = document.getElementById('item-mutator-summary-host');
    if (!host) return;

    const totals = collectActiveItemModifierTotals(workshopType);
    const rows = totals.map((entry) => (
        `<div class="workshop-summary-row">` +
            `<span class="workshop-summary-key">${_formatStatLabel(entry.statPath)}</span>` +
            `<span class="workshop-summary-value ${_getMutatorValueClass(entry)}">${_formatMutatorValue(entry)}</span>` +
        `</div>`
    )).join('');

    host.innerHTML = rows || '<div class="workshop-summary-empty">Keine Item-Mods aktiv</div>';
}

// ==========================================
// NAVIGATION & EQUIPMENT HUB (VORSCHAU-FIX)
// ==========================================

function switchTab(tabId) {
    if (typeof hideTooltip === 'function') hideTooltip();
    if (tabId !== 'options' && _pendingRebindAction) {
        _pendingRebindAction = null;
    }
    
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
        tab.style.display = 'none';
    });
    
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));

    const target = document.getElementById('tab-' + tabId);
    if (target) {
        target.style.display = 'block';
        setTimeout(() => {
            target.classList.add('active');
            _syncAmbientLoopState();
        }, 50);
    }
    
    // UI-Bridge: Markiere den aktiven Button
    const activeBtn = Array.from(document.querySelectorAll('.nav-btn'))
        .find(btn => btn.getAttribute('onclick')?.includes(tabId));
    if (activeBtn) activeBtn.classList.add('active');

    if (tabId !== 'grind') {
        stopZoneCombat('silent');
    }

    if (tabId === 'equipment') {
        renderEquipmentHub();
        openWorkshop('farm');
    }
    if (tabId === 'character') {
        syncCharacterHubSetupButtons();
        renderCharacterHubGrid();
        refreshCharacterPanels();
    }
    if (tabId === 'options') {
        renderOptionsTab();
    }
    if (tabId === 'shop') {
        renderShop();
    }
    _syncAmbientLoopState();
}

let _worldViewBackup = null;

function stopZoneCombat(reason = 'manual') {
    zoneCombatState.active = false;
    zoneCombatState.playerLastHitAt = 0;
    zoneCombatState.monsterLastHitAt = 0;
    zoneCombatState.playerIntervalMs = 0;
    zoneCombatState.monsterIntervalMs = 0;
    zoneCombatState.monsterTimerMs = 0;
    zoneCombatState.itemActionRuntime = {};
    zoneCombatState.eventHistory = [];
    zoneCombatState.showGridOverlay = false;
    if (zoneCombatState.ui && zoneCombatState.ui.toggleBtn) {
        zoneCombatState.ui.toggleBtn.textContent = 'Start Combat';
    }
    if (zoneCombatState.ui && zoneCombatState.ui.showGridBtn) {
        zoneCombatState.ui.showGridBtn.classList.remove('active');
        zoneCombatState.ui.showGridBtn.textContent = 'Show Grid';
    }
    if (reason !== 'silent' && zoneCombatState.ui && zoneCombatState.ui.logBody) {
        _appendZoneCombatLog('Combat stopped.');
    }
    _renderZoneCombatHud();
}

function _isZoneCombatUIAlive() {
    const ui = zoneCombatState.ui;
    if (!ui || !ui.monsterPortrait || !ui.monsterName || !ui.monsterDetails || !ui.statsList || !ui.hpFill || !ui.hpText || !ui.logBody || !ui.toggleBtn || !ui.playerHpText || !ui.playerCdFill || !ui.playerCdText || !ui.monsterHpText || !ui.monsterCdFill || !ui.monsterCdText || !ui.showGridBtn || !ui.gridOverlay || !ui.gridOverlayBody) return false;
    return document.body.contains(ui.monsterName);
}

function _clearZoneCombatLog() {
    if (!_isZoneCombatUIAlive()) return;
    zoneCombatState.ui.logBody.innerHTML = '';
}

function _appendZoneCombatLog(line) {
    if (!_isZoneCombatUIAlive() || typeof line !== 'string' || !line.trim()) return;
    const logBody = zoneCombatState.ui.logBody;
    const row = document.createElement('div');
    row.textContent = line;
    logBody.appendChild(row);
    while (logBody.childNodes.length > 60) {
        logBody.removeChild(logBody.firstChild);
    }
    logBody.scrollTop = logBody.scrollHeight;
}

function _appendZoneCombatVerbose(line) {
    if (!isDevModeEnabled()) return;
    _appendZoneCombatLog(line);
}

function _appendZoneCombatEvent(eventType, payload = {}) {
    const type = (typeof eventType === 'string' && eventType) ? eventType : 'event';
    const event = {
        type,
        atMs: Date.now(),
        ...payload
    };
    zoneCombatState.eventHistory.push(event);
    while (zoneCombatState.eventHistory.length > 120) {
        zoneCombatState.eventHistory.shift();
    }

    const itemName = payload.itemName || payload.itemId || 'Unknown';
    const itemId = payload.itemId ? ` [${payload.itemId}]` : '';
    const summary = payload.summary ? ` | ${payload.summary}` : '';
    const damage = Number(payload.damage);
    const damagePart = Number.isFinite(damage) ? ` | dmg ${Math.round(damage)}` : '';
    const stamina = Number(payload.remainingStamina);
    const mana = Number(payload.remainingMana);
    const resourcePart = (Number.isFinite(stamina) || Number.isFinite(mana))
        ? ` | STA ${Number.isFinite(stamina) ? stamina.toFixed(1) : '--'} | MANA ${Number.isFinite(mana) ? mana.toFixed(1) : '--'}`
        : '';
    _appendZoneCombatLog(`[${type}] ${itemName}${itemId}${damagePart}${summary}${resourcePart}`);
}

function _clampCooldownMs(value) {
    const raw = Number(value);
    if (!Number.isFinite(raw) || raw <= 0) return ZONE_COMBAT_UNARMED_INTERVAL_MS;
    return Math.max(ZONE_COMBAT_MIN_PLAYER_INTERVAL_MS, Math.min(15000, Math.round(raw)));
}

function _resolveItemType(item) {
    if (!item || typeof item !== 'object') return 'misc';
    const baseType = (typeof item.baseType === 'string' && item.baseType) ? item.baseType : null;
    return baseType || ((typeof item.type === 'string' && item.type) ? item.type : 'misc');
}

function _isCombatWeaponItem(item) {
    return !!ZONE_COMBAT_WEAPON_TYPES[_resolveItemType(item)];
}

function _readItemModifierTotals(item, statPath) {
    const output = { flat: 0, percent: 0 };
    const modifiers = Array.isArray(item && item.modifiers) ? item.modifiers : [];
    modifiers.forEach((modifier) => {
        if (!modifier || modifier.statPath !== statPath) return;
        const value = Number(modifier.value);
        if (!Number.isFinite(value)) return;
        if (modifier.type === 'flat') output.flat += value;
        if (modifier.type === 'percent') output.percent += value;
    });
    return output;
}

function _applyPercentDelta(base, delta) {
    const value = Number(base);
    const mod = Number(delta);
    if (!Number.isFinite(value)) return 0;
    if (!Number.isFinite(mod)) return value;
    return value * (1 + mod);
}

function _resolveWeaponActionCooldownMs(item) {
    if (!item || typeof item !== 'object') return ZONE_COMBAT_UNARMED_INTERVAL_MS;
    const apsModifiers = _readItemModifierTotals(item, 'attacksPerSecond');
    const hasApsFromModifiers = apsModifiers.flat !== 0 || apsModifiers.percent !== 0;
    const explicitAps = Number(item.attacksPerSecond);
    const byType = ZONE_DEFAULT_WEAPON_COOLDOWN_MS_BY_TYPE[_resolveItemType(item)];
    const explicitCooldown = Number(item.attackCooldownMs);
    const explicitInterval = Number(item.attackIntervalMs);
    let baseCooldown = Number.isFinite(explicitCooldown) && explicitCooldown > 0
        ? explicitCooldown
        : (Number.isFinite(explicitInterval) && explicitInterval > 0
            ? explicitInterval
            : (Number.isFinite(byType) ? byType : ZONE_COMBAT_UNARMED_INTERVAL_MS));
    let aps = hasApsFromModifiers
        ? 0
        : (Number.isFinite(explicitAps) && explicitAps > 0 ? explicitAps : (1000 / baseCooldown));
    aps += apsModifiers.flat;
    if (apsModifiers.percent !== 0) {
        aps *= (1 + apsModifiers.percent);
    }
    if (!Number.isFinite(aps) || aps <= 0) aps = 1000 / baseCooldown;
    return _clampCooldownMs(1000 / Math.max(0.05, aps));
}

function _resolveWeaponActionDamageBaseRange(item) {
    if (!item || typeof item !== 'object') return { min: 0, max: 0 };
    const damageMin = Number(item.physicalDamageMin);
    const damageMax = Number(item.physicalDamageMax);
    if (Number.isFinite(damageMin) && Number.isFinite(damageMax)) {
        const min = Math.max(0, Math.min(damageMin, damageMax));
        const max = Math.max(min, Math.max(damageMin, damageMax));
        return { min, max };
    }
    const fallbackMin = Number(item.damageMin);
    const fallbackMax = Number(item.damageMax);
    if (Number.isFinite(fallbackMin) && Number.isFinite(fallbackMax)) {
        const min = Math.max(0, Math.min(fallbackMin, fallbackMax));
        const max = Math.max(min, Math.max(fallbackMin, fallbackMax));
        return { min, max };
    }
    const fallbackFlat = Number(item.damageFlat);
    if (Number.isFinite(fallbackFlat)) {
        const value = Math.max(0, fallbackFlat);
        return { min: value, max: value };
    }
    return { min: 0, max: 0 };
}

function _resolveWeaponActionDamageRange(item) {
    const minMods = _readItemModifierTotals(item, 'physicalDamageMin');
    const maxMods = _readItemModifierTotals(item, 'physicalDamageMax');
    const hasModernDamageMods = (
        minMods.flat !== 0 || minMods.percent !== 0 ||
        maxMods.flat !== 0 || maxMods.percent !== 0
    );
    const baseRange = hasModernDamageMods
        ? { min: 0, max: 0 }
        : _resolveWeaponActionDamageBaseRange(item);
    let min = baseRange.min;
    let max = baseRange.max;
    min += minMods.flat;
    max += maxMods.flat;
    min = _applyPercentDelta(min, minMods.percent);
    max = _applyPercentDelta(max, maxMods.percent);
    min = Math.max(0, min);
    max = Math.max(min, max);
    return { min, max };
}

function _resolveWeaponActionDamageValue(effect) {
    if (!effect || typeof effect !== 'object') return 0;
    const damageMin = Number(effect.physicalDamageMin);
    const damageMax = Number(effect.physicalDamageMax);
    if (!Number.isFinite(damageMin) || !Number.isFinite(damageMax)) return 0;
    const min = Math.max(0, Math.min(damageMin, damageMax));
    const max = Math.max(min, Math.max(damageMin, damageMax));
    return (min + max) * 0.5;
}

function _resolveWeaponResourceCost(item) {
    const parsed = (item && item.resourceCost && typeof item.resourceCost === 'object')
        ? item.resourceCost
        : {};
    const itemStamina = Number(item && item.staminaCost);
    const itemMana = Number(item && item.manaCost);
    const objectStamina = Number(parsed.stamina);
    const objectMana = Number(parsed.mana);
    let staminaCost = Number.isFinite(objectStamina)
        ? objectStamina
        : (Number.isFinite(itemStamina) ? itemStamina : ZONE_DEFAULT_WEAPON_STAMINA_COST);
    const manaCost = Number.isFinite(objectMana)
        ? objectMana
        : (Number.isFinite(itemMana) ? itemMana : 0);
    const staminaModifiers = _readItemModifierTotals(item, 'staminaCost');
    staminaCost += staminaModifiers.flat;
    staminaCost = _applyPercentDelta(staminaCost, staminaModifiers.percent);
    return {
        stamina: Math.max(0, staminaCost),
        mana: Math.max(0, manaCost)
    };
}

function _readPlayerResourceSnapshot() {
    const base = (gameData.character && gameData.character.base) ? gameData.character.base : null;
    if (!base) {
        return { stamina: 0, mana: 0 };
    }
    return {
        stamina: Math.max(0, Number.isFinite(base.currentStamina) ? base.currentStamina : 0),
        mana: Math.max(0, Number.isFinite(base.currentMana) ? base.currentMana : 0)
    };
}

function _canPayResourceCost(cost, resources) {
    const safeCost = cost && typeof cost === 'object' ? cost : {};
    const safeResources = resources && typeof resources === 'object' ? resources : {};
    const staminaCost = Math.max(0, Number(safeCost.stamina) || 0);
    const manaCost = Math.max(0, Number(safeCost.mana) || 0);
    const stamina = Math.max(0, Number(safeResources.stamina) || 0);
    const mana = Math.max(0, Number(safeResources.mana) || 0);
    return stamina >= staminaCost && mana >= manaCost;
}

function _payResourceCost(cost) {
    const base = (gameData.character && gameData.character.base) ? gameData.character.base : null;
    if (!base) return;
    const staminaCost = Math.max(0, Number(cost && cost.stamina) || 0);
    const manaCost = Math.max(0, Number(cost && cost.mana) || 0);
    base.currentStamina = Math.max(0, (Number.isFinite(base.currentStamina) ? base.currentStamina : 0) - staminaCost);
    base.currentMana = Math.max(0, (Number.isFinite(base.currentMana) ? base.currentMana : 0) - manaCost);
}

function _resolveEquippedEntriesForCombat(activeGridKey) {
    const grid = (gameData && gameData[activeGridKey] && typeof gameData[activeGridKey] === 'object')
        ? gameData[activeGridKey]
        : {};
    if (typeof collectEquippedItemEntries !== 'function') return [];
    return collectEquippedItemEntries(grid, (itemId, cell) => getItemDefinition(itemId, cell));
}

function _resolveActionCooldownScale(stats, activeWeaponEntries) {
    const entries = Array.isArray(activeWeaponEntries) ? activeWeaponEntries : [];
    if (!entries.length) return 1;
    const firstBaseCooldown = _resolveWeaponActionCooldownMs(entries[0].item);
    const derivedInterval = Number(stats && stats.attackIntervalMs);
    if (!Number.isFinite(derivedInterval) || derivedInterval <= 0 || !Number.isFinite(firstBaseCooldown) || firstBaseCooldown <= 0) {
        return 1;
    }
    const scale = derivedInterval / firstBaseCooldown;
    return Math.max(0.1, Math.min(4, scale));
}

function _buildActionDescriptorsForEquippedItems(stats, activeGridKey) {
    const entries = _resolveEquippedEntriesForCombat(activeGridKey);
    const activeIds = new Set(Array.isArray(stats && stats.activeItemInstanceIds) ? stats.activeItemInstanceIds : []);
    const inactiveIds = new Set(Array.isArray(stats && stats.inactiveItemInstanceIds) ? stats.inactiveItemInstanceIds : []);
    const hasActivationData = activeIds.size > 0 || inactiveIds.size > 0;
    const activeEntries = entries.filter((entry) => {
        if (!hasActivationData) return true;
        if (!entry || !entry.instanceId) return true;
        return activeIds.has(entry.instanceId);
    });
    const activeWeapons = activeEntries.filter((entry) => _isCombatWeaponItem(entry.item));
    const cooldownScale = _resolveActionCooldownScale(stats, activeWeapons);
    const descriptors = [];

    activeEntries.forEach((entry, entryIdx) => {
        const item = entry && entry.item ? entry.item : null;
        if (!item) return;
        const instanceKey = entry.instanceId || `slot_${entry.index}`;

        if (Array.isArray(item.actions) && item.actions.length > 0) {
            item.actions.forEach((actionDef, actionIdx) => {
                if (!actionDef || typeof actionDef !== 'object') return;
                const baseCooldown = _clampCooldownMs(Number(actionDef.cooldownMs));
                const cooldownMs = _clampCooldownMs(baseCooldown * cooldownScale);
                const rawCost = actionDef.resourceCost && typeof actionDef.resourceCost === 'object' ? actionDef.resourceCost : {};
                descriptors.push({
                    key: `${instanceKey}::${actionDef.id || actionIdx}`,
                    instanceKey,
                    instanceId: entry.instanceId || null,
                    slotIndex: entry.index,
                    itemId: item.id || null,
                    itemName: item.name || item.id || 'Unknown',
                    icon: item.icon || '',
                    kind: 'effect',
                    actionId: actionDef.id || `action_${actionIdx}`,
                    cooldownMs,
                    resourceCost: {
                        stamina: Math.max(0, Number(rawCost.stamina) || 0),
                        mana: Math.max(0, Number(rawCost.mana) || 0)
                    },
                    effect: actionDef.effect || null,
                    order: (entryIdx * 10) + actionIdx
                });
            });
            return;
        }

        if (!_isCombatWeaponItem(item)) return;
        const baseCooldown = _resolveWeaponActionCooldownMs(item);
        const cooldownMs = _clampCooldownMs(baseCooldown * cooldownScale);
        const damageRange = _resolveWeaponActionDamageRange(item);
        descriptors.push({
            key: `${instanceKey}::weapon_attack`,
            instanceKey,
            instanceId: entry.instanceId || null,
            slotIndex: entry.index,
            itemId: item.id || null,
            itemName: item.name || item.id || 'Unknown',
            icon: item.icon || '',
            kind: 'weapon',
            actionId: 'weapon_attack',
            cooldownMs,
            resourceCost: _resolveWeaponResourceCost(item),
            effect: {
                type: 'weapon_attack',
                physicalDamageMin: damageRange.min,
                physicalDamageMax: damageRange.max
            },
            order: (entryIdx * 10)
        });
    });

    return descriptors;
}

function _syncZoneCombatActionRuntime(stats, activeGridKey) {
    const descriptors = _buildActionDescriptorsForEquippedItems(stats, activeGridKey);
    const previous = zoneCombatState.itemActionRuntime && typeof zoneCombatState.itemActionRuntime === 'object'
        ? zoneCombatState.itemActionRuntime
        : {};
    const next = {};

    descriptors.forEach((descriptor) => {
        const existing = previous[descriptor.key];
        const nextCooldown = _clampCooldownMs(descriptor.cooldownMs);
        const ratio = (existing && Number(existing.cooldownMs) > 0)
            ? Math.max(0, Math.min(1, Number(existing.timerMs) / Number(existing.cooldownMs)))
            : 1;
        const timerMs = (existing && Number.isFinite(existing.timerMs))
            ? Math.max(0, Math.round(nextCooldown * ratio))
            : nextCooldown;
        next[descriptor.key] = {
            ...descriptor,
            cooldownMs: nextCooldown,
            timerMs
        };
    });

    zoneCombatState.itemActionRuntime = next;
    const nextAction = Object.values(next).reduce((best, entry) => {
        if (!best) return entry;
        return entry.timerMs < best.timerMs ? entry : best;
    }, null);
    zoneCombatState.playerIntervalMs = nextAction ? nextAction.cooldownMs : 0;
    zoneCombatState.playerLastHitAt = 0;
}

function _getSortedActionRuntimeEntries() {
    const runtime = zoneCombatState.itemActionRuntime && typeof zoneCombatState.itemActionRuntime === 'object'
        ? zoneCombatState.itemActionRuntime
        : {};
    return Object.keys(runtime)
        .map((key) => runtime[key])
        .filter(Boolean)
        .sort((a, b) => {
            const orderA = Number.isFinite(a.order) ? a.order : 0;
            const orderB = Number.isFinite(b.order) ? b.order : 0;
            if (orderA !== orderB) return orderA - orderB;
            return String(a.key).localeCompare(String(b.key));
        });
}

function _resolveActionRuntimeForCell(cell, index) {
    const instanceKey = (cell && cell.instanceId) ? cell.instanceId : `slot_${index}`;
    const entries = _getSortedActionRuntimeEntries();
    for (let i = 0; i < entries.length; i++) {
        if (entries[i].instanceKey === instanceKey) return entries[i];
    }
    return null;
}

function _setZoneCombatGridOverlayOpen(shouldOpen) {
    zoneCombatState.showGridOverlay = !!shouldOpen;
    if (!_isZoneCombatUIAlive()) return;
    zoneCombatState.ui.showGridBtn.classList.toggle('active', zoneCombatState.showGridOverlay);
    zoneCombatState.ui.showGridBtn.textContent = zoneCombatState.showGridOverlay ? 'Hide Grid' : 'Show Grid';
    _renderZoneCombatGridOverlay();
}

function _renderZoneCombatGridOverlay() {
    if (!_isZoneCombatUIAlive()) return;
    const overlay = zoneCombatState.ui.gridOverlay;
    const body = zoneCombatState.ui.gridOverlayBody;
    const shouldOpen = !!zoneCombatState.showGridOverlay;
    overlay.classList.toggle('hidden', !shouldOpen);
    if (!shouldOpen) return;

    const gridKey = getActiveCombatGridKey();
    const grid = (gameData && gameData[gridKey] && typeof gameData[gridKey] === 'object') ? gameData[gridKey] : {};
    body.innerHTML = '';

    const totalSlots = GRID_SIZE * GRID_ROWS;
    for (let i = 0; i < totalSlots; i++) {
        const slot = document.createElement('div');
        slot.classList.add('zone-combat-grid-cell');
        const cell = grid[i];
        if (cell && cell.root && cell.itemId) {
            slot.classList.add('occupied');
            const item = getItemDefinition(cell.itemId, cell);
            const marker = document.createElement('div');
            marker.classList.add('zone-combat-grid-marker');
            marker.textContent = (item && item.icon) ? item.icon : '[]';
            marker.title = item && item.name ? item.name : (item && item.id ? item.id : 'item');
            slot.appendChild(marker);

            const actionRuntime = _resolveActionRuntimeForCell(cell, i);
            if (actionRuntime && Number(actionRuntime.cooldownMs) > 0) {
                const bar = document.createElement('div');
                bar.classList.add('zone-combat-grid-cd');
                const fill = document.createElement('div');
                fill.classList.add('zone-combat-grid-cd-fill');
                const ratio = Math.max(0, Math.min(1, Number(actionRuntime.timerMs) / Number(actionRuntime.cooldownMs)));
                fill.style.width = `${Math.round(ratio * 100)}%`;
                bar.appendChild(fill);
                slot.appendChild(bar);
            }
        }
        body.appendChild(slot);
    }
}

function _processZoneCombatItemActions(stepMs, stats, activeGridKey, monster) {
    const runtimeEntries = _getSortedActionRuntimeEntries();
    if (!runtimeEntries.length) return;

    runtimeEntries.forEach((entry) => {
        if (monster && Number(monster.hp) <= 0) return;
        const runtime = zoneCombatState.itemActionRuntime[entry.key];
        if (!runtime) return;
        runtime.timerMs = Math.max(0, Number(runtime.timerMs) - stepMs);
        if (runtime.timerMs > 0) return;

        const resources = _readPlayerResourceSnapshot();
        if (_canPayResourceCost(runtime.resourceCost, resources)) {
            _payResourceCost(runtime.resourceCost);
            const remaining = _readPlayerResourceSnapshot();
            if (runtime.kind === 'weapon') {
                const damage = _resolveWeaponActionDamageValue(runtime.effect);
                if (monster) {
                    monster.hp = Math.max(0, (Number.isFinite(monster.hp) ? monster.hp : 0) - damage);
                }
                _appendZoneCombatEvent('weapon_attack', {
                    itemId: runtime.itemId,
                    itemName: runtime.itemName,
                    damage,
                    summary: `cd ${Math.round(runtime.cooldownMs)}ms`,
                    remainingStamina: remaining.stamina,
                    remainingMana: remaining.mana
                });
                _appendZoneCombatEvent('effect_triggered', {
                    itemId: runtime.itemId,
                    itemName: runtime.itemName,
                    damage,
                    summary: 'effect=weapon_attack',
                    remainingStamina: remaining.stamina,
                    remainingMana: remaining.mana
                });
            } else {
                _appendZoneCombatEvent('effect_triggered', {
                    itemId: runtime.itemId,
                    itemName: runtime.itemName,
                    summary: runtime.actionId || 'custom_effect',
                    remainingStamina: remaining.stamina,
                    remainingMana: remaining.mana
                });
            }
        } else {
            const staminaNeed = Math.max(0, Number(runtime.resourceCost && runtime.resourceCost.stamina) || 0);
            const manaNeed = Math.max(0, Number(runtime.resourceCost && runtime.resourceCost.mana) || 0);
            const summary = `wasted need STA ${staminaNeed.toFixed(1)} / MANA ${manaNeed.toFixed(1)}`;
            const wastedType = runtime.kind === 'weapon' ? 'weapon_wasted' : 'effect_wasted';
            _appendZoneCombatEvent(wastedType, {
                itemId: runtime.itemId,
                itemName: runtime.itemName,
                summary,
                remainingStamina: resources.stamina,
                remainingMana: resources.mana
            });
            if (runtime.kind === 'weapon') {
                _appendZoneCombatEvent('effect_wasted', {
                    itemId: runtime.itemId,
                    itemName: runtime.itemName,
                    summary: 'effect=weapon_attack',
                    remainingStamina: resources.stamina,
                    remainingMana: resources.mana
                });
            }
        }

        runtime.timerMs = runtime.cooldownMs;
    });
}

function _processZoneCombatMonsterAttack(stepMs, monster, stats) {
    const intervalMs = _resolveMonsterAttackIntervalMs(monster);
    zoneCombatState.monsterIntervalMs = intervalMs;
    if (!Number.isFinite(zoneCombatState.monsterTimerMs) || zoneCombatState.monsterTimerMs <= 0) {
        zoneCombatState.monsterTimerMs = intervalMs;
    }
    zoneCombatState.monsterTimerMs = Math.max(0, zoneCombatState.monsterTimerMs - stepMs);
    if (zoneCombatState.monsterTimerMs > 0) return;

    const monsterDamage = Math.max(0, Math.floor(Number.isFinite(monster.damage) ? monster.damage : 0));
    const base = (gameData.character && gameData.character.base) ? gameData.character.base : null;
    if (base) {
        const maxLife = Number.isFinite(stats && stats.life) ? Math.max(1, stats.life) : Math.max(1, Number(base.baseLife) || 1);
        if (!Number.isFinite(base.currentLife)) {
            base.currentLife = maxLife;
        }
        base.currentLife = Math.max(0, base.currentLife - monsterDamage);
    } else if (Number.isFinite(gameData.hp)) {
        gameData.hp = Math.max(0, gameData.hp - monsterDamage);
    }
    _appendZoneCombatLog(`Monster dealt ${monsterDamage} dmg`);
    zoneCombatState.monsterTimerMs = intervalMs;
}

function _refreshZoneMonsterTiming(monster, resetTimer = false) {
    const intervalMs = _resolveMonsterAttackIntervalMs(monster);
    zoneCombatState.monsterIntervalMs = intervalMs;
    if (resetTimer || !Number.isFinite(zoneCombatState.monsterTimerMs) || zoneCombatState.monsterTimerMs <= 0) {
        zoneCombatState.monsterTimerMs = intervalMs;
    }
}

function _clampAps(value) {
    const raw = Number.isFinite(value) ? value : 1;
    return Math.max(ZONE_COMBAT_MIN_APS, Math.min(ZONE_COMBAT_MAX_APS, raw));
}

function _clampPlayerAttackIntervalMs(value) {
    const raw = Number.isFinite(value) ? value : ZONE_COMBAT_UNARMED_INTERVAL_MS;
    return Math.max(ZONE_COMBAT_MIN_PLAYER_INTERVAL_MS, Math.min(ZONE_COMBAT_MAX_PLAYER_INTERVAL_MS, raw));
}

function _apsToIntervalMs(aps) {
    return (1 / _clampAps(aps)) * 1000;
}

function _resolvePlayerAttackIntervalMs(stats, gridKey) {
    const attackIntervalMs = Number(stats && stats.attackIntervalMs);
    if (Number.isFinite(attackIntervalMs) && attackIntervalMs > 0) {
        const intervalMs = _clampPlayerAttackIntervalMs(attackIntervalMs);
        const aps = 1000 / intervalMs;
        return {
            intervalMs,
            aps,
            fallbackUsed: false,
            fallbackReason: null
        };
    }

    const equipped = getEquippedItems(gridKey || getActiveCombatGridKey());
    const legacySpeed = (typeof calculateEquipmentBonusValue === 'function')
        ? Number(calculateEquipmentBonusValue(equipped, 'speed'))
        : 1;
    const fallbackInterval = (Number.isFinite(legacySpeed) && legacySpeed > 0)
        ? (ZONE_COMBAT_UNARMED_INTERVAL_MS / legacySpeed)
        : ZONE_COMBAT_UNARMED_INTERVAL_MS;
    const intervalMs = _clampPlayerAttackIntervalMs(fallbackInterval);
    const fallbackAps = 1000 / intervalMs;
    return {
        intervalMs,
        aps: fallbackAps,
        fallbackUsed: true,
        fallbackReason: 'derived.attackIntervalMs_missing_or_invalid'
    };
}

function _resolveMonsterAttackIntervalMs(monster) {
    const raw = Number(monster && monster.attackSpeed);
    const aps = (Number.isFinite(raw) && raw > 10) ? (1000 / raw) : raw;
    return _apsToIntervalMs(aps);
}

function _resolvePlayerCombatDamage(stats, gridKey) {
    const damageRange = _resolveDerivedDamageRange(stats);
    if (damageRange) {
        return {
            damage: _rollDamageInRange(damageRange),
            fallbackUsed: false,
            fallbackReason: null,
            damageRange
        };
    }
    const damageFromAvg = Number(stats && stats.damageAverage);
    if (Number.isFinite(damageFromAvg) && damageFromAvg >= 0) {
        return {
            damage: damageFromAvg,
            fallbackUsed: false,
            fallbackReason: null,
            damageRange: { min: damageFromAvg, max: damageFromAvg }
        };
    }

    const equipped = getEquippedItems(gridKey || getActiveCombatGridKey());
    const fallback = (typeof calculatePlayerDamageWithEquipment === 'function')
        ? Number(calculatePlayerDamageWithEquipment(gameData.level, equipped))
        : 0;
    return {
        damage: Math.max(0, Number.isFinite(fallback) ? fallback : 0),
        fallbackUsed: true,
        fallbackReason: 'derived.damageAverage_and_finalDamage_missing_or_invalid',
        damageRange: null
    };
}

function _getMonsterSprite(monster) {
    if (monster && monster.sprite) return monster.sprite;
    if (!monster || !monster.id || typeof MONSTERS === 'undefined' || !Array.isArray(MONSTERS)) return null;
    const template = MONSTERS.find((entry) => entry && entry.id === monster.id);
    return template && template.sprite ? template.sprite : null;
}

function _renderZoneCombatHud() {
    if (!_isZoneCombatUIAlive()) return;
    const ui = zoneCombatState.ui;
    const hud = _getHudStats();
    ui.playerHpText.textContent = `HP: ${Math.ceil(hud.currentLife)} / ${Math.ceil(hud.maxLife)}`;

    const monster = gameData.currentMonster;
    if (monster) {
        const maxHp = Math.max(1, Math.ceil(monster.maxHp || monster.hp || 1));
        const curHp = Math.max(0, Math.ceil(monster.hp || 0));
        ui.monsterHpText.textContent = `HP: ${curHp} / ${maxHp}`;
    } else {
        ui.monsterHpText.textContent = 'HP: -- / --';
    }

    const playerEntries = _getSortedActionRuntimeEntries();
    const nextPlayerAction = playerEntries.length
        ? playerEntries.reduce((best, entry) => (!best || entry.timerMs < best.timerMs ? entry : best), null)
        : null;
    const playerInterval = Math.max(1, nextPlayerAction ? Number(nextPlayerAction.cooldownMs) : 1);
    const playerRemaining = zoneCombatState.active && nextPlayerAction ? Math.max(0, Number(nextPlayerAction.timerMs) || 0) : 0;
    const monsterInterval = Math.max(1, zoneCombatState.monsterIntervalMs || 1);
    const monsterRemaining = zoneCombatState.active ? Math.max(0, zoneCombatState.monsterTimerMs || 0) : 0;
    const playerCdPct = zoneCombatState.active && nextPlayerAction ? Math.max(0, Math.min(100, (playerRemaining / playerInterval) * 100)) : 0;
    const monsterCdPct = zoneCombatState.active ? Math.max(0, Math.min(100, (monsterRemaining / monsterInterval) * 100)) : 0;
    ui.playerCdFill.style.width = `${playerCdPct}%`;
    ui.monsterCdFill.style.width = `${monsterCdPct}%`;
    ui.playerCdText.textContent = (zoneCombatState.active && nextPlayerAction)
        ? `${(playerRemaining / 1000).toFixed(2)}s (${Math.ceil(playerRemaining)}ms)`
        : '--';
    ui.monsterCdText.textContent = zoneCombatState.active ? `${(monsterRemaining / 1000).toFixed(2)}s (${Math.ceil(monsterRemaining)}ms)` : '--';

    const resources = _readPlayerResourceSnapshot();
    const activeGridKey = getActiveCombatGridKey();
    const characterStats = getDerivedCharacterStats(activeGridKey);
    const staminaRegenPerSec = (characterStats && Number.isFinite(characterStats.staminaRegen))
        ? characterStats.staminaRegen
        : 0;
    if (ui.staminaText) {
        ui.staminaText.textContent = `Stamina: ${resources.stamina.toFixed(1)} | St-Reg/sek: ${staminaRegenPerSec.toFixed(2)}`;
    }
    if (ui.manaText) {
        ui.manaText.textContent = `Mana: ${resources.mana.toFixed(1)}`;
    }
    _renderZoneCombatGridOverlay();
}

function _renderZoneMonsterUI() {
    if (!_isZoneCombatUIAlive()) return;
    const ui = zoneCombatState.ui;
    const monster = gameData.currentMonster;
    if (!monster) return;

    ui.monsterPortrait.innerHTML = '';
    const spritePath = _getMonsterSprite(monster);
    if (spritePath) {
        const img = document.createElement('img');
        img.src = _resolveAssetUrl(spritePath);
        img.alt = monster.name || '';
        img.style.width = '100%';
        img.style.height = '100%';
        img.style.objectFit = 'contain';
        img.style.pointerEvents = 'none';
        ui.monsterPortrait.appendChild(img);
    } else {
        ui.monsterPortrait.textContent = monster.icon || '?';
    }

    ui.monsterName.textContent = monster.name || 'Unbekanntes Monster';
    const maxHp = Math.max(1, Math.ceil(monster.maxHp || monster.hp || 1));
    const curHp = Math.max(0, Math.ceil(monster.hp || 0));
    const hpPct = Math.max(0, Math.min(100, (curHp / maxHp) * 100));
    ui.hpFill.style.width = `${hpPct}%`;
    ui.hpText.textContent = `HP: ${curHp} / ${maxHp}`;
    ui.statsList.innerHTML =
        `<div>HP: ${curHp} / ${maxHp}</div>` +
        `<div>DMG: ${monster.damage ?? '??'}</div>` +
        `<div>SPD: ${monster.attackSpeed ?? '??'} ms</div>` +
        `<div>Level: ${monster.level ?? '??'}</div>`;
    ui.monsterDetails.innerHTML =
        `<div>Lebensraum: Kuestenpfad</div>` +
        `<div>Beute: ${monster.goldMin ?? '??'}-${monster.goldMax ?? '??'} Gold</div>` +
        `<div>XP: ${monster.xp ?? '??'}</div>`;
}

function _spawnZoneMonsterFromPool() {
    if (!Array.isArray(zoneCombatState.poolIndices) || zoneCombatState.poolIndices.length === 0) return null;
    const randomIdx = Math.floor(Math.random() * zoneCombatState.poolIndices.length);
    const monsterIndex = zoneCombatState.poolIndices[randomIdx];
    spawnMonster(monsterIndex);
    _refreshZoneMonsterTiming(gameData.currentMonster, true);
    return gameData.currentMonster;
}

function addItemToBattlefield(itemId, itemLevel) {
    ensureBattlefieldData(gameData);
    const item = getItemDefinition(itemId);
    if (!item) return { added: false, reason: 'invalid_item' };

    const ilvl = Math.max(1, Math.floor(Number.isFinite(itemLevel) ? itemLevel : (gameData.level || 1)));
    const battlefield = ensureBattlefieldData(gameData);

    for (let page = battlefield.activePage; page <= battlefield.unlockedPages; page++) {
        const pageGrid = _getBattlefieldPageGrid(page);
        for (let i = 0; i < BATTLEFIELD_PAGE_SLOTS; i++) {
            const existing = pageGrid[i];
            if (_isBattlefieldItemCell(existing)) continue;
            const instanceId = _generateBattlefieldInstanceId();
            pageGrid[i] = {
                itemId: item.id,
                instanceId,
                itemLevel: ilvl,
                root: true
            };
            if (typeof registerItemInstance === 'function') {
                registerItemInstance(gameData, instanceId, item.id, ilvl, { source: 'battlefield_drop' });
            }
            return { added: true, page, instanceId };
        }
    }

    return { added: false, reason: 'battlefield_full' };
}

function _resolveBattlefieldCellInstanceId(grid, index) {
    if (!grid || typeof grid !== 'object') return null;
    const cell = grid[index];
    if (!cell || !cell.itemId) return null;
    if (cell.instanceId) return cell.instanceId;

    const generated = _generateBattlefieldInstanceId();
    cell.instanceId = generated;
    cell.root = true;
    if (typeof registerItemInstance === 'function') {
        registerItemInstance(gameData, generated, cell.itemId, _getBattlefieldItemLevel(cell), { source: 'battlefield_backfill' });
    }
    return generated;
}

function _resolveBattlefieldBaseValue(item) {
    if (!item || typeof item !== 'object') return 0;
    const candidates = [
        Number(item.sellValue),
        Number(item.baseValue),
        Number(item.value),
        Number(item.price)
    ];
    for (let i = 0; i < candidates.length; i++) {
        if (Number.isFinite(candidates[i]) && candidates[i] > 0) return candidates[i];
    }
    return 1;
}

function _calculateBattlefieldSellValue(cell) {
    if (!cell || typeof cell !== 'object' || !cell.itemId) return 0;
    const item = getItemDefinition(cell.itemId, cell);
    const baseValue = _resolveBattlefieldBaseValue(item);
    const ilvl = _getBattlefieldItemLevel(cell);
    return Math.max(0, Math.floor(baseValue * ilvl * 0.3));
}

function _isZoneBattlefieldUIAlive() {
    const ui = zoneBattlefieldState.ui;
    if (!ui || !ui.panel || !ui.toggleBtn || !ui.grid || !ui.tabs || !ui.storeBtn || !ui.sellBtn || !ui.sellModeBtn || !ui.zoneRoot) {
        return false;
    }
    return document.body.contains(ui.panel);
}

function _refreshZoneBattlefieldToggleLabel() {
    if (!_isZoneBattlefieldUIAlive()) return;
    zoneBattlefieldState.ui.toggleBtn.textContent = `Schlachtfeld (${_countBattlefieldItems()})`;
}

function _renderZoneBattlefieldTabs() {
    if (!_isZoneBattlefieldUIAlive()) return;
    const battlefield = ensureBattlefieldData(gameData);
    const tabsHost = zoneBattlefieldState.ui.tabs;
    tabsHost.innerHTML = '';

    for (let page = 1; page <= BATTLEFIELD_MAX_PAGES; page++) {
        const tabBtn = document.createElement('button');
        tabBtn.type = 'button';
        tabBtn.classList.add('zone-battlefield-tab');
        tabBtn.textContent = String(page);
        if (page > battlefield.unlockedPages) {
            tabBtn.disabled = true;
            tabBtn.classList.add('locked');
        } else {
            if (page === battlefield.activePage) tabBtn.classList.add('active');
            tabBtn.addEventListener('click', () => {
                battlefield.activePage = page;
                zoneBattlefieldState.selectedInstanceIds.clear();
                _renderZoneBattlefieldPanel();
            });
        }
        tabsHost.appendChild(tabBtn);
    }
}

function _renderZoneBattlefieldGrid() {
    if (!_isZoneBattlefieldUIAlive()) return;
    const battlefield = ensureBattlefieldData(gameData);
    const activePage = battlefield.activePage;
    const pageGrid = _getBattlefieldPageGrid(activePage);
    const gridHost = zoneBattlefieldState.ui.grid;
    gridHost.innerHTML = '';

    for (let i = 0; i < BATTLEFIELD_PAGE_SLOTS; i++) {
        const slot = document.createElement('div');
        slot.classList.add('grid-slot', 'battlefield-slot');
        slot.dataset.index = String(i);

        const cell = pageGrid[i];
        const instanceId = _resolveBattlefieldCellInstanceId(pageGrid, i);
        if (_isBattlefieldItemCell(cell)) {
            slot.classList.add('occupied');
            if (instanceId && zoneBattlefieldState.selectedInstanceIds.has(instanceId)) {
                slot.classList.add('selected');
            }
            const item = getItemDefinition(cell.itemId, cell);
            const marker = document.createElement('div');
            marker.classList.add('battlefield-item-marker');
            if (item && item.rarity) marker.classList.add(item.rarity);
            if (item && item.sprite) {
                const img = document.createElement('img');
                img.src = _resolveAssetUrl(item.sprite);
                img.alt = item.name || '';
                marker.appendChild(img);
            } else {
                marker.textContent = item && item.icon ? item.icon : '?';
            }
            slot.appendChild(marker);

            if (window.ItemTooltip && typeof window.ItemTooltip.bindItemElement === 'function') {
                window.ItemTooltip.bindItemElement(slot, () => {
                    const liveGrid = _getBattlefieldPageGrid(activePage);
                    const liveCell = _isBattlefieldItemCell(liveGrid[i]) ? liveGrid[i] : cell;
                    const liveItem = liveCell ? getItemDefinition(liveCell.itemId, liveCell) : item;
                    return {
                        source: 'battlefield',
                        location: 'battlefield',
                        index: i,
                        cell: liveCell || cell,
                        itemDef: liveItem || item
                    };
                });
            }
        }

        slot.addEventListener('click', () => {
            if (!zoneBattlefieldState.sellMode) return;
            if (!instanceId) return;
            if (zoneBattlefieldState.selectedInstanceIds.has(instanceId)) {
                zoneBattlefieldState.selectedInstanceIds.delete(instanceId);
            } else {
                zoneBattlefieldState.selectedInstanceIds.add(instanceId);
            }
            _renderZoneBattlefieldPanel();
        });

        gridHost.appendChild(slot);
    }
}

function _renderZoneBattlefieldPanel() {
    if (!_isZoneBattlefieldUIAlive()) return;
    _renderZoneBattlefieldTabs();
    _renderZoneBattlefieldGrid();
    const selectedCount = zoneBattlefieldState.selectedInstanceIds.size;
    zoneBattlefieldState.ui.sellModeBtn.classList.toggle('active', zoneBattlefieldState.sellMode);
    zoneBattlefieldState.ui.sellModeBtn.textContent = zoneBattlefieldState.sellMode ? 'Sell mode: ON' : 'Sell mode: OFF';
    zoneBattlefieldState.ui.sellBtn.disabled = selectedCount <= 0;
    zoneBattlefieldState.ui.sellBtn.textContent = selectedCount > 0 ? `Sell (${selectedCount})` : 'Sell';
    _refreshZoneBattlefieldToggleLabel();
}

function _setZoneBattlefieldOpen(nextOpen) {
    if (!_isZoneBattlefieldUIAlive()) return;
    const shouldOpen = !!nextOpen;
    zoneBattlefieldState.open = shouldOpen;
    zoneBattlefieldState.ui.panel.classList.toggle('hidden', !shouldOpen);
    zoneBattlefieldState.ui.toggleBtn.classList.toggle('active', shouldOpen);
    zoneBattlefieldState.ui.zoneRoot.classList.toggle('battlefield-open', shouldOpen);
    if (shouldOpen) {
        _renderZoneBattlefieldPanel();
    }
}

function _toggleZoneBattlefieldSellMode() {
    zoneBattlefieldState.sellMode = !zoneBattlefieldState.sellMode;
    if (!zoneBattlefieldState.sellMode) {
        zoneBattlefieldState.selectedInstanceIds.clear();
    }
    _renderZoneBattlefieldPanel();
}

function _moveBattlefieldEntryToBank(entry) {
    if (!entry || !entry.cell || !entry.cell.itemId) return false;
    const ilvl = _getBattlefieldItemLevel(entry.cell);
    const instanceId = (typeof entry.cell.instanceId === 'string' && entry.cell.instanceId)
        ? entry.cell.instanceId
        : null;

    if (!instanceId) {
        return addItemToBank(entry.cell.itemId, ilvl);
    }

    if (typeof ensureBankPageData === 'function') {
        ensureBankPageData(gameData);
    }
    const bankGrid = gameData.bank;
    const bankCols = (typeof getBankCols === 'function') ? getBankCols() : 6;
    const bankRows = Math.ceil(BANK_SLOTS / bankCols);
    const item = getItemDefinition(entry.cell.itemId, entry.cell);
    if (!item || typeof canPlaceItem !== 'function' || typeof placeItemIntoGrid !== 'function') {
        return false;
    }

    const baseBody = (typeof getItemBodyMatrix === 'function')
        ? getItemBodyMatrix(item, 0)
        : (item.body || [[1]]);
    const shape = Array.isArray(baseBody) ? baseBody.map((row) => [...row]) : [[1]];

    for (let i = 0; i < BANK_SLOTS; i++) {
        if (!canPlaceItem(bankGrid, i, shape, bankCols, bankRows)) continue;
        const shapeCopy = shape.map((row) => [...row]);
        const tx = tryPlaceItemTransactional(bankGrid, item, shapeCopy, i, bankCols, {
            instanceId,
            maxRows: bankRows,
            rotationIndex: 0
        });
        if (tx.ok && typeof registerItemInstance === 'function') {
            const existing = (typeof getItemInstanceData === 'function')
                ? getItemInstanceData(gameData, tx.instanceId)
                : null;
            if (!existing || existing.itemId !== entry.cell.itemId) {
                registerItemInstance(gameData, tx.instanceId, entry.cell.itemId, ilvl, { source: 'battlefield_store' });
            }
        }
        if (tx.ok) return true;
    }

    return false;
}

function _storeBattlefieldItemsToBank() {
    const entries = _collectBattlefieldRootEntries();
    let stored = 0;
    entries.forEach((entry) => {
        const moved = _moveBattlefieldEntryToBank(entry);
        if (!moved) return;
        if (entry.cell.instanceId) {
            clearItemFromGrid(entry.grid, entry.cell.instanceId);
            zoneBattlefieldState.selectedInstanceIds.delete(entry.cell.instanceId);
        } else {
            delete entry.grid[entry.index];
        }
        stored += 1;
    });

    _appendZoneCombatLog(`Stored ${stored} items`);
    _renderZoneBattlefieldPanel();
    updateUI();
    if (stored > 0 && typeof saveGame === 'function') saveGame();
}

function _sellSelectedBattlefieldItems() {
    if (!zoneBattlefieldState.selectedInstanceIds.size) {
        _appendZoneCombatLog('Sold 0 items for 0 gold');
        _renderZoneBattlefieldPanel();
        return;
    }

    let sold = 0;
    let goldTotal = 0;
    Array.from(zoneBattlefieldState.selectedInstanceIds).forEach((instanceId) => {
        const entry = _resolveBattlefieldRootEntryByInstanceId(instanceId);
        if (!entry) {
            zoneBattlefieldState.selectedInstanceIds.delete(instanceId);
            return;
        }
        const sellValue = _calculateBattlefieldSellValue(entry.cell);
        goldTotal += sellValue;
        sold += 1;
        if (entry.cell.instanceId) {
            clearItemFromGrid(entry.grid, entry.cell.instanceId);
        } else {
            delete entry.grid[entry.index];
        }
        if (typeof removeItemInstanceData === 'function' && entry.cell.instanceId) {
            removeItemInstanceData(gameData, instanceId);
        }
        zoneBattlefieldState.selectedInstanceIds.delete(instanceId);
    });

    if (goldTotal > 0) {
        if (typeof addGold === 'function') {
            addGold(goldTotal, 'battlefield_sell');
        } else {
            gameData.gold = (Number.isFinite(gameData.gold) ? gameData.gold : 0) + goldTotal;
            gameData.totalGold = (Number.isFinite(gameData.totalGold) ? gameData.totalGold : 0) + goldTotal;
        }
    }

    _appendZoneCombatLog(`Sold ${sold} items for ${goldTotal} gold`);
    _renderZoneBattlefieldPanel();
    updateUI();
    if (sold > 0 && typeof saveGame === 'function') saveGame();
}

function _resetZoneBattlefieldState() {
    zoneBattlefieldState.open = false;
    zoneBattlefieldState.sellMode = false;
    zoneBattlefieldState.selectedInstanceIds.clear();
    zoneBattlefieldState.ui = null;
}

function _resolveMonsterLootDrops(monster) {
    if (!monster || typeof monster !== 'object') return [];
    const itemLevel = Math.max(1, Math.floor(Number.isFinite(monster.level) ? monster.level : gameData.level || 1));
    if (typeof rollLootForMonster === 'function') {
        const rolled = rollLootForMonster(monster, { itemLevel });
        return Array.isArray(rolled) ? rolled : [];
    }

    const legacyDrops = [];
    if (Array.isArray(monster.dropTable) && monster.dropTable.length > 0) {
        monster.dropTable.forEach((itemId) => {
            if (Math.random() < 0.15) {
                legacyDrops.push({ itemId, itemLevel, sourcePoolId: 'legacy_dropTable' });
            }
        });
    }
    return legacyDrops;
}

function _applyZoneMonsterLootDrops(monster) {
    const drops = _resolveMonsterLootDrops(monster);
    if (!Array.isArray(drops) || drops.length === 0) return;

    drops.forEach((drop) => {
        if (!drop || typeof drop.itemId !== 'string' || !drop.itemId) return;
        const ilvl = Math.max(1, Math.floor(Number.isFinite(drop.itemLevel) ? drop.itemLevel : (monster.level || gameData.level || 1)));
        const item = getItemDefinition(drop.itemId);
        const itemName = item && item.name ? item.name : drop.itemId;
        const result = addItemToBattlefield(drop.itemId, ilvl);
        if (result && result.added) {
            _appendZoneCombatLog(`Drop: ${itemName} (ilvl ${ilvl}) -> Schlachtfeld`);
            return;
        }
        _appendZoneCombatLog(`Drop discarded (Schlachtfeld voll): ${itemName} (ilvl ${ilvl})`);
    });

    _refreshZoneBattlefieldToggleLabel();
    if (_isZoneBattlefieldUIAlive() && zoneBattlefieldState.open) {
        _renderZoneBattlefieldPanel();
    }
}

function _tickZoneCombat(stepMs) {
    if (!zoneCombatState.active) return;
    if (!_isZoneCombatUIAlive()) {
        stopZoneCombat('silent');
        return;
    }

    const monster = gameData.currentMonster;
    if (!monster) return;

    const activeGridKey = getActiveCombatGridKey();
    const stats = _getFreshDerivedCharacterStats(activeGridKey);
    const fixedStep = Math.max(1, Number.isFinite(stepMs) ? stepMs : ZONE_COMBAT_TICK_MS);
    _syncZoneCombatActionRuntime(stats, activeGridKey);
    _processZoneCombatItemActions(fixedStep, stats, activeGridKey, monster);
    if (monster && Number(monster.hp) > 0) {
        _processZoneCombatMonsterAttack(fixedStep, monster, stats);
    }

    if (typeof syncLegacyCharacterFields === 'function') {
        syncLegacyCharacterFields(gameData, stats);
    }
    _renderZoneMonsterUI();
    _renderZoneCombatHud();

    if (monster.hp > 0) return;

    gameData.monsterDefeats[monster.id] = (gameData.monsterDefeats[monster.id] || 0) + 1;
    const goldReward = (typeof calculateLootReward === 'function')
        ? calculateLootReward(monster.goldMin || 0, monster.goldMax || monster.goldMin || 0)
        : Math.max(0, Math.floor(monster.goldMin || 0));
    const xpReward = Math.max(0, Math.floor(monster.xp || 0));

    if (typeof addGold === 'function') addGold(goldReward, 'combat_kill');
    if (typeof grantXP === 'function') grantXP(xpReward, 'combat_kill', activeGridKey);

    _applyZoneMonsterLootDrops(monster);

    _appendZoneCombatLog(`${monster.name} besiegt. +${goldReward} Gold, +${xpReward} XP`);
    updateUI();
    const spawned = _spawnZoneMonsterFromPool();
    if (spawned) {
        const nextStats = _getFreshDerivedCharacterStats(activeGridKey);
        _syncZoneCombatActionRuntime(nextStats, activeGridKey);
    }
    _renderZoneMonsterUI();
    _renderZoneCombatHud();
}

function restoreWorldView() {
    const grindTab = document.getElementById('tab-grind');
    stopZoneCombat('silent');
    _resetZoneBattlefieldState();
    if (!grindTab || _worldViewBackup === null) return;
    grindTab.innerHTML = _worldViewBackup;
    grindTab.style.backgroundImage = '';
    grindTab.style.backgroundSize = '';
    grindTab.style.backgroundPosition = '';
    grindTab.style.backgroundRepeat = '';
    grindTab.classList.remove('world-view');
    grindTab.classList.remove('zone-view');
    _worldViewBackup = null;
    _syncAmbientLoopState();
}

function renderWorldView() {
    const grindTab = document.getElementById('tab-grind');
    stopZoneCombat('silent');
    _resetZoneBattlefieldState();
    if (!grindTab || typeof WORLD_DATA === 'undefined') return;

    if (_worldViewBackup === null) {
        _worldViewBackup = grindTab.innerHTML;
    }

    grindTab.innerHTML = '';
    grindTab.style.backgroundImage = `url('${_resolveAssetUrl('Media/Images/World/Welt_A.png')}')`;
    grindTab.style.backgroundSize = 'cover';
    grindTab.style.backgroundPosition = 'center';
    grindTab.style.backgroundRepeat = 'no-repeat';
    grindTab.style.position = 'relative';
    grindTab.classList.add('world-view');
    grindTab.classList.remove('zone-view');

    const header = document.createElement('div');
    header.classList.add('hub-header');
    const title = document.createElement('h3');
    title.classList.add('world-title');
    title.textContent = 'Welt';
    const subtitle = document.createElement('p');
    subtitle.classList.add('world-subtitle');
    subtitle.textContent = 'Wähle eine Zone für die Reise.';
    header.appendChild(title);
    header.appendChild(subtitle);

    const backWrap = document.createElement('div');
    backWrap.style.position = 'absolute';
    backWrap.style.top = '16px';
    backWrap.style.left = '16px';
    const backBtn = document.createElement('button');
    backBtn.classList.add('dropdown-item');
    backBtn.classList.add('world-back-btn');
    backBtn.style.width = 'auto';
    backBtn.style.padding = '8px 12px';
    backBtn.style.fontSize = '0.95rem';
    backBtn.textContent = '← Zurück';
    backBtn.addEventListener('click', restoreWorldView);
    backWrap.appendChild(backBtn);

    const actsContainer = document.createElement('div');
    actsContainer.classList.add('adventure-hub');

    WORLD_DATA.acts.forEach((act) => {
        const actSection = document.createElement('div');
        actSection.classList.add('adventure-card');

        const actTitle = document.createElement('h4');
        actTitle.classList.add('world-act-title');
        actTitle.textContent = act.name;
        actSection.appendChild(actTitle);

        if (act.unlocked) {
            act.zones.forEach((zone) => {
                const zoneCard = document.createElement('div');
                zoneCard.classList.add('adventure-card');
                zoneCard.style.cursor = 'pointer';
                zoneCard.addEventListener('click', () => renderZoneView(zone.id));

                const zoneTitle = document.createElement('h4');
                zoneTitle.classList.add('world-zone-title');
                zoneTitle.textContent = zone.name;
                const zoneDesc = document.createElement('p');
                zoneDesc.classList.add('card-desc');
                zoneDesc.classList.add('world-zone-desc');
                zoneDesc.textContent = zone.description;

                zoneCard.appendChild(zoneTitle);
                zoneCard.appendChild(zoneDesc);
                actSection.appendChild(zoneCard);
            });
        } else {
            actSection.classList.add('disabled');
            const comingSoon = document.createElement('p');
            comingSoon.classList.add('card-desc');
            comingSoon.classList.add('world-zone-desc');
            comingSoon.textContent = 'Coming Soon';
            actSection.appendChild(comingSoon);
        }

        actsContainer.appendChild(actSection);
    });

    grindTab.appendChild(header);
    grindTab.appendChild(backWrap);
    grindTab.appendChild(actsContainer);
    _syncAmbientLoopState();
}

function renderZoneView(zoneId) {
    const grindTab = document.getElementById('tab-grind');
    stopZoneCombat('silent');
    _resetZoneBattlefieldState();
    if (!grindTab) return;
    ensureBattlefieldData(gameData);

    if (zoneId !== 'coast') {
        alert('Coming Soon');
        _syncAmbientLoopState();
        return;
    }

    if (_worldViewBackup === null) {
        _worldViewBackup = grindTab.innerHTML;
    }

    grindTab.innerHTML = '';
    grindTab.style.backgroundImage = `url('${_resolveAssetUrl('Media/Images/World/Kuestenpfad_A.png')}')`;
    grindTab.style.backgroundSize = 'cover';
    grindTab.style.backgroundPosition = 'center';
    grindTab.style.backgroundRepeat = 'no-repeat';
    grindTab.style.position = 'relative';
    grindTab.classList.add('world-view');
    grindTab.classList.add('zone-view');

    const backWrap = document.createElement('div');
    backWrap.style.position = 'absolute';
    backWrap.style.top = '16px';
    backWrap.style.left = '16px';
    const backBtn = document.createElement('button');
    backBtn.classList.add('dropdown-item');
    backBtn.classList.add('world-back-btn');
    backBtn.style.width = 'auto';
    backBtn.style.padding = '8px 12px';
    backBtn.style.fontSize = '0.95rem';
    backBtn.textContent = '← Zurück';
    backBtn.addEventListener('click', renderWorldView);
    backWrap.appendChild(backBtn);

    const header = document.createElement('div');
    header.classList.add('hub-header');
    const title = document.createElement('h3');
    title.classList.add('world-title');
    title.textContent = 'Küstenpfad';
    const subtitle = document.createElement('p');
    subtitle.classList.add('world-subtitle');
    subtitle.textContent = 'Die Reise beginnt....';
    header.appendChild(title);
    header.appendChild(subtitle);

    const monsterSection = document.createElement('div');
    monsterSection.classList.add('zone-monster');

    const monsterCard = document.createElement('div');
    monsterCard.classList.add('zone-monster-card');

    const monsterPortrait = document.createElement('div');
    monsterPortrait.classList.add('zone-monster-portrait');

    const monsterName = document.createElement('div');
    monsterName.classList.add('world-zone-title');
    monsterName.textContent = 'Unbekanntes Monster';

    const monsterDetails = document.createElement('div');
    monsterDetails.classList.add('zone-monster-details');
    monsterDetails.innerHTML = '<div>Typ: ???</div><div>Resistenzen: ???</div><div>Fähigkeiten: ???</div>';

    monsterCard.appendChild(monsterPortrait);
    monsterCard.appendChild(monsterName);
    monsterCard.appendChild(monsterDetails);
    monsterSection.appendChild(monsterCard);

    const infoGrid = document.createElement('div');
    infoGrid.classList.add('zone-info-grid');

    const logPanel = document.createElement('div');
    logPanel.classList.add('zone-panel');
    const logTitle = document.createElement('h4');
    logTitle.classList.add('world-act-title');
    logTitle.textContent = 'Kampf-Log';
    const logBody = document.createElement('div');
    logBody.classList.add('zone-log');
    const initialLog = document.createElement('div');
    initialLog.textContent = 'Log erscheint hier, sobald der Kampf startet.';
    logBody.appendChild(initialLog);
    logPanel.appendChild(logTitle);
    logPanel.appendChild(logBody);

    const statsPanel = document.createElement('div');
    statsPanel.classList.add('zone-panel');
    statsPanel.classList.add('zone-stats-panel');
    const statsTitle = document.createElement('h4');
    statsTitle.classList.add('world-act-title');
    statsTitle.textContent = 'Monster-Stats';
    const statsList = document.createElement('div');
    statsList.classList.add('zone-stats');
    statsList.innerHTML = '<div>HP: ???</div><div>DMG: ???</div><div>SPD: ???</div><div>Armor: ???</div>';
    const zoneHpBar = document.createElement('div');
    zoneHpBar.classList.add('monster-hp-bar');
    const zoneHpFill = document.createElement('div');
    zoneHpFill.style.height = '100%';
    zoneHpFill.style.background = 'var(--accent-red)';
    zoneHpFill.style.width = '0%';
    zoneHpFill.style.transition = 'width 0.15s';
    const zoneHpText = document.createElement('span');
    zoneHpText.style.position = 'absolute';
    zoneHpText.style.left = '50%';
    zoneHpText.style.top = '50%';
    zoneHpText.style.transform = 'translate(-50%, -50%)';
    zoneHpText.style.fontWeight = 'bold';
    zoneHpText.style.fontSize = '0.85rem';
    zoneHpText.style.pointerEvents = 'none';
    zoneHpText.textContent = 'HP: ---';
    zoneHpBar.appendChild(zoneHpFill);
    zoneHpBar.appendChild(zoneHpText);
    statsPanel.appendChild(statsTitle);
    statsPanel.appendChild(zoneHpBar);
    statsPanel.appendChild(statsList);

    monsterSection.appendChild(statsPanel);
    infoGrid.appendChild(logPanel);

    const combatHud = document.createElement('div');
    combatHud.classList.add('zone-combat-hud');
    const battlefieldToggleWrap = document.createElement('div');
    battlefieldToggleWrap.classList.add('zone-combat-toggle-wrap');
    const battlefieldToggleBtn = document.createElement('button');
    battlefieldToggleBtn.classList.add('dropdown-item');
    battlefieldToggleBtn.classList.add('zone-combat-toggle-btn');
    battlefieldToggleBtn.classList.add('zone-battlefield-toggle-btn');
    battlefieldToggleBtn.textContent = 'Schlachtfeld (0)';
    battlefieldToggleWrap.appendChild(battlefieldToggleBtn);
    const toggleCombatWrap = document.createElement('div');
    toggleCombatWrap.classList.add('zone-combat-toggle-wrap');
    const toggleCombatBtn = document.createElement('button');
    toggleCombatBtn.classList.add('dropdown-item');
    toggleCombatBtn.classList.add('zone-combat-toggle-btn');
    toggleCombatBtn.textContent = 'Start Combat';
    toggleCombatWrap.appendChild(toggleCombatBtn);
    const showGridWrap = document.createElement('div');
    showGridWrap.classList.add('zone-combat-toggle-wrap');
    const showGridBtn = document.createElement('button');
    showGridBtn.classList.add('dropdown-item');
    showGridBtn.classList.add('zone-combat-toggle-btn');
    showGridBtn.classList.add('zone-combat-grid-toggle-btn');
    showGridBtn.textContent = 'Show Grid';
    showGridWrap.appendChild(showGridBtn);

    const playerBlock = document.createElement('div');
    playerBlock.classList.add('zone-combat-hud-block');
    playerBlock.innerHTML =
        '<div class="zone-combat-hud-title">Player</div>' +
        '<div class="zone-combat-hud-row" id="zone-hud-player-hp">HP: -- / --</div>' +
        '<div class="zone-combat-hud-row zone-combat-cd-row"><span>ATK CD</span><span id="zone-hud-player-cd-text">--</span></div>';
    const playerCdBar = document.createElement('div');
    playerCdBar.classList.add('zone-combat-cd-bar');
    const playerCdFill = document.createElement('div');
    playerCdFill.classList.add('zone-combat-cd-fill', 'player');
    playerCdBar.appendChild(playerCdFill);
    playerBlock.appendChild(playerCdBar);
    const staminaRow = document.createElement('div');
    staminaRow.classList.add('zone-combat-hud-row', 'zone-combat-placeholder');
    staminaRow.textContent = 'Stamina: --';
    const manaRow = document.createElement('div');
    manaRow.classList.add('zone-combat-hud-row', 'zone-combat-placeholder');
    manaRow.textContent = 'Mana: --';
    playerBlock.appendChild(staminaRow);
    playerBlock.appendChild(manaRow);

    const monsterBlock = document.createElement('div');
    monsterBlock.classList.add('zone-combat-hud-block');
    monsterBlock.innerHTML =
        '<div class="zone-combat-hud-title">Monster</div>' +
        '<div class="zone-combat-hud-row" id="zone-hud-monster-hp">HP: -- / --</div>' +
        '<div class="zone-combat-hud-row zone-combat-cd-row"><span>ATK CD</span><span id="zone-hud-monster-cd-text">--</span></div>';
    const monsterCdBar = document.createElement('div');
    monsterCdBar.classList.add('zone-combat-cd-bar');
    const monsterCdFill = document.createElement('div');
    monsterCdFill.classList.add('zone-combat-cd-fill', 'monster');
    monsterCdBar.appendChild(monsterCdFill);
    monsterBlock.appendChild(monsterCdBar);

    combatHud.appendChild(battlefieldToggleWrap);
    combatHud.appendChild(toggleCombatWrap);
    combatHud.appendChild(showGridWrap);
    combatHud.appendChild(playerBlock);
    combatHud.appendChild(monsterBlock);

    const combatGridOverlay = document.createElement('div');
    combatGridOverlay.classList.add('zone-combat-grid-overlay', 'hidden');
    const combatGridTitle = document.createElement('div');
    combatGridTitle.classList.add('zone-combat-grid-title');
    combatGridTitle.textContent = 'PVE Setup Grid';
    const combatGridBody = document.createElement('div');
    combatGridBody.classList.add('zone-combat-grid-body');
    combatGridOverlay.appendChild(combatGridTitle);
    combatGridOverlay.appendChild(combatGridBody);

    const battlefieldPanel = document.createElement('div');
    battlefieldPanel.classList.add('zone-panel', 'zone-battlefield-panel', 'hidden');
    const battlefieldHeader = document.createElement('div');
    battlefieldHeader.classList.add('zone-battlefield-header');
    const battlefieldTitle = document.createElement('h4');
    battlefieldTitle.classList.add('world-act-title');
    battlefieldTitle.textContent = 'Schlachtfeld';
    const battlefieldTabs = document.createElement('div');
    battlefieldTabs.classList.add('zone-battlefield-tabs');
    const battlefieldGrid = document.createElement('div');
    battlefieldGrid.classList.add('zone-battlefield-grid');
    const battlefieldActions = document.createElement('div');
    battlefieldActions.classList.add('zone-battlefield-actions');
    const battlefieldStoreBtn = document.createElement('button');
    battlefieldStoreBtn.classList.add('dropdown-item', 'zone-battlefield-action-btn');
    battlefieldStoreBtn.textContent = 'Store';
    const battlefieldSellBtn = document.createElement('button');
    battlefieldSellBtn.classList.add('dropdown-item', 'zone-battlefield-action-btn');
    battlefieldSellBtn.textContent = 'Sell';
    const battlefieldSellModeBtn = document.createElement('button');
    battlefieldSellModeBtn.classList.add('dropdown-item', 'zone-battlefield-action-btn');
    battlefieldSellModeBtn.textContent = 'Sell mode: OFF';
    battlefieldActions.appendChild(battlefieldStoreBtn);
    battlefieldActions.appendChild(battlefieldSellBtn);
    battlefieldActions.appendChild(battlefieldSellModeBtn);
    battlefieldHeader.appendChild(battlefieldTitle);
    battlefieldHeader.appendChild(battlefieldActions);
    battlefieldPanel.appendChild(battlefieldHeader);
    battlefieldPanel.appendChild(battlefieldTabs);
    battlefieldPanel.appendChild(battlefieldGrid);

    const zoneMonsterIndices = (typeof MONSTERS !== 'undefined' && Array.isArray(MONSTERS))
        ? MONSTERS.map((m, idx) => ({ m, idx }))
            .filter((entry) => Array.isArray(entry.m.tags) && entry.m.tags.includes(zoneId))
            .map((entry) => entry.idx)
        : [];

    zoneCombatState.zoneId = zoneId;
    zoneCombatState.poolIndices = zoneMonsterIndices;
    zoneCombatState.playerLastHitAt = 0;
    zoneCombatState.monsterLastHitAt = 0;
    zoneCombatState.playerIntervalMs = 0;
    zoneCombatState.monsterIntervalMs = 0;
    zoneCombatState.monsterTimerMs = 0;
    zoneCombatState.itemActionRuntime = {};
    zoneCombatState.eventHistory = [];
    zoneCombatState.showGridOverlay = false;
    zoneCombatState.ui = {
        monsterPortrait,
        monsterName,
        monsterDetails,
        statsList,
        hpFill: zoneHpFill,
        hpText: zoneHpText,
        logBody,
        toggleBtn: toggleCombatBtn,
        playerHpText: playerBlock.querySelector('#zone-hud-player-hp'),
        playerCdFill,
        playerCdText: playerBlock.querySelector('#zone-hud-player-cd-text'),
        staminaText: staminaRow,
        manaText: manaRow,
        monsterHpText: monsterBlock.querySelector('#zone-hud-monster-hp'),
        monsterCdFill,
        monsterCdText: monsterBlock.querySelector('#zone-hud-monster-cd-text'),
        showGridBtn,
        gridOverlay: combatGridOverlay,
        gridOverlayBody: combatGridBody
    };
    zoneBattlefieldState.open = false;
    zoneBattlefieldState.sellMode = false;
    zoneBattlefieldState.selectedInstanceIds.clear();
    zoneBattlefieldState.ui = {
        zoneRoot: grindTab,
        panel: battlefieldPanel,
        tabs: battlefieldTabs,
        grid: battlefieldGrid,
        toggleBtn: battlefieldToggleBtn,
        storeBtn: battlefieldStoreBtn,
        sellBtn: battlefieldSellBtn,
        sellModeBtn: battlefieldSellModeBtn
    };

    battlefieldToggleBtn.addEventListener('click', () => {
        _setZoneBattlefieldOpen(!zoneBattlefieldState.open);
    });
    battlefieldStoreBtn.addEventListener('click', () => {
        _storeBattlefieldItemsToBank();
    });
    battlefieldSellBtn.addEventListener('click', () => {
        _sellSelectedBattlefieldItems();
    });
    battlefieldSellModeBtn.addEventListener('click', () => {
        _toggleZoneBattlefieldSellMode();
    });
    showGridBtn.addEventListener('click', () => {
        _setZoneCombatGridOverlayOpen(!zoneCombatState.showGridOverlay);
    });

    toggleCombatBtn.addEventListener('click', () => {
        if (zoneCombatState.active) {
            stopZoneCombat('manual');
            return;
        }
        if (!zoneCombatState.poolIndices.length) {
            _appendZoneCombatLog('Keine Monster fuer diese Zone definiert.');
            return;
        }
        zoneCombatState.active = true;
        toggleCombatBtn.textContent = 'Stop Combat';
        const spawned = _spawnZoneMonsterFromPool();
        if (!spawned) {
            stopZoneCombat('manual');
            _appendZoneCombatLog('Keine Monster verfuegbar.');
            return;
        }
        _clearZoneCombatLog();
        _appendZoneCombatLog(`Ein ${spawned.name} erscheint...`);
        const activeGridKey = getActiveCombatGridKey();
        const startStats = _getFreshDerivedCharacterStats(activeGridKey);
        _syncZoneCombatActionRuntime(startStats, activeGridKey);
        _refreshZoneMonsterTiming(spawned, true);
        const actionCount = _getSortedActionRuntimeEntries().length;
        _appendZoneCombatVerbose(`Combat start | actions=${actionCount} | tick=${ZONE_COMBAT_TICK_MS}ms`);
        const actionSummary = _getSortedActionRuntimeEntries()
            .map((entry) => `${entry.itemId || entry.actionId || 'item'}:${Math.round(Number(entry.cooldownMs) || 0)}ms`)
            .join(', ');
        _appendZoneCombatVerbose(`Combat actions | ${actionSummary || 'none'}`);
        _renderZoneMonsterUI();
        _renderZoneCombatHud();
    });

    grindTab.appendChild(header);
    grindTab.appendChild(backWrap);
    grindTab.appendChild(monsterSection);
    grindTab.appendChild(infoGrid);
    grindTab.appendChild(battlefieldPanel);
    grindTab.appendChild(combatGridOverlay);
    grindTab.appendChild(combatHud);
    _renderZoneBattlefieldPanel();
    _setZoneBattlefieldOpen(false);
    _setZoneCombatGridOverlayOpen(false);
    _renderZoneCombatHud();
    _syncAmbientLoopState();
}

function renderEquipmentHub() {
    renderPreviewGrid('preview-farm', 'farmGrid');
    renderPreviewGrid('preview-pve', 'pveGrid');
    renderPreviewGrid('preview-bank-small', 'bank');
}

function renderPreviewGrid(containerId, gridKey) {
    const container = document.getElementById(containerId);
    if (!container) return;
    if (gridKey === 'bank' && typeof ensureBankPageData === 'function') {
        ensureBankPageData(gameData);
    }
    container.innerHTML = '';
    
    // Prevent aura overflow from creating scrollbars - clip aura at grid edges
    container.style.overflow = 'hidden';
    
    // Vorschau-Grids sind jetzt 10x10 in der Anzeige
    const totalSlots = gridKey === 'bank' ? BANK_SLOTS : (GRID_SIZE * GRID_ROWS);
    for (let i = 0; i < totalSlots; i++) {
        const slot = document.createElement('div');
        slot.classList.add('grid-slot');
        
        const cellData = gameData[gridKey][i];
        // FIX: Wir prüfen auf cellData.itemId, falls 'root' mal fehlt
        if (cellData && cellData.itemId) {
            // Wir rendern in der Vorschau nur das Root/Anchor-Symbol
            if (cellData.root || i === 0) {
                const item = getItemDefinition(cellData.itemId);
                if (item) {
                    const itemEl = document.createElement('div');
                    itemEl.classList.add('item', item.rarity);
                    itemEl.style.display = 'flex';
                    itemEl.style.alignItems = 'center';
                    itemEl.style.justifyContent = 'center';

                    // Get rotation angle from cellData
                    const rotationIndex = (typeof cellData.rotationIndex === 'number') ? cellData.rotationIndex : 0;
                    const rotationDeg = rotationIndex * 90;

                    // Prefer sprite image for preview if available
                    if (item.sprite) {
                        const img = document.createElement('img');
                        img.src = _resolveAssetUrl(item.sprite);
                        img.alt = item.name || '';
                        if (rotationIndex % 2 === 0) {
                            img.style.width = '100%';
                            img.style.height = 'auto';
                        } else {
                            img.style.width = 'auto';
                            img.style.height = '100%';
                        }
                        img.style.pointerEvents = 'none';
                        img.style.transform = `rotate(${rotationDeg}deg)`;
                        itemEl.appendChild(img);
                    } else {
                        const txt = document.createElement('div');
                        txt.innerText = item.icon || '?';
                        txt.style.fontSize = '1rem';
                        txt.style.transform = `rotate(${rotationDeg}deg)`;
                        itemEl.appendChild(txt);
                    }

                    if (window.ItemTooltip && typeof window.ItemTooltip.bindItemElement === 'function') {
                        window.ItemTooltip.bindItemElement(itemEl, () => ({
                            source: 'preview',
                            gridKey,
                            index: i,
                            cell: gameData[gridKey] && gameData[gridKey][i] ? gameData[gridKey][i] : cellData,
                            itemDef: item
                        }));
                    }

                    slot.appendChild(itemEl);
                }
            }
        }
        container.appendChild(slot);
    }
}

// ==========================================
// WORKSHOP & OVERLAY (KLICK-FIX)
// ==========================================

function openWorkshop(type) {
    currentWorkshop = type;
    if (typeof window !== 'undefined') {
        window.currentWorkshop = currentWorkshop;
    }
    if (typeof closeStoragePageEditor === 'function') {
        closeStoragePageEditor();
    }
    if (typeof ensureBankPageData === 'function') {
        ensureBankPageData(gameData);
    }
    const overlay = document.getElementById('workshop-overlay');
    if (overlay) {
        overlay.classList.remove('workshop-farm', 'workshop-pve', 'workshop-pvp', 'workshop-sort', 'workshop-storage');
        overlay.classList.add(`workshop-${type}`);
        overlay.classList.remove('hidden');
        overlay.style.display = 'flex';
        const workshopBackgroundByType = {
            farm: 'Media/Images/World/Farm_Workshop_C.png',
            pve: 'Media/Images/World/PVE_Workshop.png'
        };
        const workshopBgPath = workshopBackgroundByType[type];
        if (workshopBgPath) {
            overlay.style.backgroundImage = `url('${_resolveAssetUrl(workshopBgPath)}')`;
            overlay.style.backgroundSize = 'cover';
            overlay.style.backgroundPosition = '50% 42%';
            overlay.style.backgroundRepeat = 'no-repeat';
        } else {
            overlay.style.backgroundImage = '';
            overlay.style.backgroundSize = '';
            overlay.style.backgroundPosition = '';
            overlay.style.backgroundRepeat = '';
        }
        const title = document.getElementById('workshop-title');
        if (title) title.innerText = type === 'storage' ? "STORAGE" : type.toUpperCase() + " WORKSHOP";
        
        // Hide grid name in storage mode
        const gridName = document.getElementById('grid-name');
        if (gridName) {
            gridName.style.display = type === 'storage' ? 'none' : 'block';
        }
        
        // Toggle storage mode class
        const workshopContent = overlay.querySelector('.workshop-content');
        if (workshopContent) {
            if (type === 'storage') {
                workshopContent.classList.add('storage-mode');
                if (typeof updateStorageUI === 'function') {
                    updateStorageUI();
                }
            } else {
                workshopContent.classList.remove('storage-mode');
                if (typeof cancelBulkSellMode === 'function') {
                    cancelBulkSellMode();
                }
            }
        }
        if (typeof renderStoragePageTabs === 'function') {
            renderStoragePageTabs();
        }
    }
    
    // Ruft die Funktion aus der Workshopengine.js auf
    setTimeout(() => {
        if (typeof renderWorkshopGrids === 'function') {
            try { queueRenderWorkshopGrids(); } catch (err) { renderWorkshopGrids(); }
        } else {
            console.error("renderWorkshopGrids nicht gefunden! Prüfe index.html Ladereihenfolge.");
        }
        refreshCharacterPanels();
    }, 10);
}

function closeWorkshop() {
    currentWorkshop = null;
    if (typeof window !== 'undefined') {
        window.currentWorkshop = currentWorkshop;
    }
    if (typeof closeStoragePageEditor === 'function') {
        closeStoragePageEditor();
    }
    if (typeof cancelBulkSellMode === 'function') {
        cancelBulkSellMode();
    }
    const overlay = document.getElementById('workshop-overlay');
    if (overlay) {
        overlay.classList.add('hidden');
        overlay.classList.remove('workshop-farm', 'workshop-pve', 'workshop-pvp', 'workshop-sort', 'workshop-storage');
        overlay.style.backgroundImage = '';
        overlay.style.backgroundSize = '';
        overlay.style.backgroundPosition = '';
        overlay.style.backgroundRepeat = '';
    }
    
    if (typeof saveGame === 'function') saveGame();
    renderEquipmentHub();
    refreshCharacterPanels();
}

// ==========================================
// GAME ENGINE & SHOP
// ==========================================

function buyItem(itemId) {
    const item = getItemDefinition(itemId);
    if (!item) return;
    const devShopEnabled = isDeveloperShopEnabled();
    const itemPrice = devShopEnabled ? 0 : Math.max(0, Math.floor(Number(item.price) || 0));
    const requiredLevel = Math.max(1, Math.floor(Number(item.req) || 1));
    if (!devShopEnabled && gameData.level < requiredLevel) return;
    if (!devShopEnabled && gameData.gold < itemPrice) return;
    if (typeof ensureBankPageData === 'function') {
        ensureBankPageData(gameData);
    }
    const bankGrid = gameData.bank;

    const bankCols = getBankCols();
    const bankRows = Math.ceil(BANK_SLOTS / bankCols);
    const baseBody = (typeof getItemBodyMatrix === 'function')
        ? getItemBodyMatrix(item, 0)
        : (item.body || [[1]]);
    const bodyCopy = baseBody.map((r) => [...r]);

    for (let i = 0; i < BANK_SLOTS; i++) {
        if (!canPlaceItem(bankGrid, i, bodyCopy, bankCols, bankRows)) continue;
        const tx = tryPlaceItemTransactional(bankGrid, item, bodyCopy, i, bankCols, {
            maxRows: bankRows,
            rotationIndex: 0
        });
        if (!tx.ok) continue;

        if (itemPrice > 0) {
            addGold(-itemPrice, 'shop_buy');
        }
        if (tx.instanceId && typeof registerItemInstance === 'function') {
            registerItemInstance(gameData, tx.instanceId, item.id, Math.max(1, gameData.level), { source: 'shop' });
        }
        if (typeof renderWorkshopGrids === 'function') { try { queueRenderWorkshopGrids(); } catch (err) { renderWorkshopGrids(); } }
        renderShop();
        updateUI();
        playUISound('itemBought');
        if (typeof saveGame === 'function') saveGame();
        return;
    }
}

function handleWorkClick() {
    gameData.focusUntil = Date.now() + FOCUS_DURATION;
    updateUI();
}

function updateLogic() {
    const now = Date.now();
    const dt = (now - gameData.lastUpdate) / 1000;
    const fixedStepSec = ZONE_COMBAT_TICK_MS / 1000;
    gameData.lastUpdate = now;

    const combatGridKey = getActiveCombatGridKey();
    const shouldUseCombatGridStats = zoneCombatState.active || _isCoastZoneViewActive();
    const characterStats = shouldUseCombatGridStats
        ? _getFreshDerivedCharacterStats(combatGridKey)
        : getDerivedCharacterStats('farmGrid');

    if (characterStats && gameData.character && gameData.character.base) {
        const base = gameData.character.base;
        const lifeRegen = (typeof characterStats.lifeRegen === 'number') ? characterStats.lifeRegen : gameData.hpRegen;
        const staminaRegen = (typeof characterStats.staminaRegen === 'number') ? characterStats.staminaRegen : 1;
        if (typeof base.currentLife !== 'number') {
            base.currentLife = characterStats.life;
        }
        if (typeof base.currentStamina !== 'number') {
            base.currentStamina = characterStats.stamina;
        }
        if (base.currentLife < characterStats.life) {
            base.currentLife = Math.min(characterStats.life, base.currentLife + (lifeRegen * dt));
        }
        if (base.currentStamina < characterStats.stamina) {
            base.currentStamina = Math.min(characterStats.stamina, base.currentStamina + (staminaRegen * fixedStepSec));
        }
        if (typeof syncLegacyCharacterFields === 'function') {
            syncLegacyCharacterFields(gameData, characterStats);
        }
    } else if (gameData.hp < gameData.maxHp) {
        gameData.hp = Math.min(gameData.maxHp, gameData.hp + gameData.hpRegen * dt);
    }

    _tickZoneCombat(ZONE_COMBAT_TICK_MS);

    // Legacy idle prototype is disabled.
    gameData.workProgress = 0;
    gameData.pendingGold = 0;
}

function _getHudStats() {
    if (typeof ensureCharacterModelOnGameData === 'function') {
        ensureCharacterModelOnGameData(gameData);
    }
    const base = (gameData.character && gameData.character.base) ? gameData.character.base : {};
    const derived = (gameData.character && gameData.character.derived) ? gameData.character.derived : {};

    const maxLife = Math.max(
        1,
        Number.isFinite(derived.maxLife) ? derived.maxLife
            : (Number.isFinite(derived.life) ? derived.life : (base.baseLife || gameData.maxHp || 1))
    );
    const currentLife = Math.max(
        0,
        Math.min(
            maxLife,
            Number.isFinite(base.currentLife) ? base.currentLife
                : (Number.isFinite(gameData.hp) ? gameData.hp : 0)
        )
    );
    const maxMana = Math.max(
        0,
        Number.isFinite(derived.maxMana) ? derived.maxMana
            : (Number.isFinite(derived.mana) ? derived.mana : (Number.isFinite(base.baseMana) ? base.baseMana : 0))
    );
    const currentMana = Math.max(
        0,
        Math.min(
            maxMana,
            Number.isFinite(base.currentMana) ? base.currentMana : 0
        )
    );
    const maxStamina = Math.max(
        1,
        Number.isFinite(derived.maxStamina) ? derived.maxStamina
            : (Number.isFinite(derived.stamina) ? derived.stamina : (Number.isFinite(base.baseStamina) ? base.baseStamina : 1))
    );
    const currentStamina = Math.max(
        0,
        Math.min(
            maxStamina,
            Number.isFinite(base.currentStamina) ? base.currentStamina : 0
        )
    );
    const xp = Number.isFinite(base.xp) ? base.xp
        : (Number.isFinite(gameData.xp) ? gameData.xp : 0);
    const xpToNextLevel = Number.isFinite(derived.xpToNextLevel)
        ? derived.xpToNextLevel
        : (Number.isFinite(gameData.xpNextLevel) ? gameData.xpNextLevel : calculateXpToNextLevel(gameData.level || base.level || 1));

    return {
        currentLife,
        maxLife,
        currentMana,
        maxMana,
        currentStamina,
        maxStamina,
        xp,
        xpToNextLevel
    };
}

function updateUI() {
    const setT = (id, val) => { const el = document.getElementById(id); if (el) el.innerText = val; };
    const setW = (id, val) => { const el = document.getElementById(id); if (el) el.style.width = val + "%"; };

    setT('gold-display', Math.floor(gameData.gold).toLocaleString());
    setT('level-display', gameData.level);
    setT('stat-gps', '-');
    setT('stat-total-gold', Math.floor(gameData.totalGold).toLocaleString());
    setT('stat-total-xp', Math.floor(gameData.totalXP).toLocaleString());
    setW('work-fill', 0);
    const hud = _getHudStats();
    const hpFillRaw = hud.maxLife > 0 ? (hud.currentLife / hud.maxLife) * 100 : 0;
    const staminaFillRaw = hud.maxStamina > 0 ? (hud.currentStamina / hud.maxStamina) * 100 : 0;
    const manaFillRaw = hud.maxMana > 0 ? (hud.currentMana / hud.maxMana) * 100 : 0;
    const xpFillRaw = hud.xpToNextLevel > 0 ? (hud.xp / hud.xpToNextLevel) * 100 : 0;
    const hpFill = Math.max(0, Math.min(100, hpFillRaw));
    const staminaFill = Math.max(0, Math.min(100, staminaFillRaw));
    const manaFill = Math.max(0, Math.min(100, manaFillRaw));
    const xpFill = Math.max(0, Math.min(100, xpFillRaw));
    setW('hp-fill-header', hpFill);
    setW('stamina-fill-header', staminaFill);
    setW('mana-fill-header', manaFill);
    setW('xp-fill-header', xpFill);
    setT('hp-text-header', `HP: ${Math.ceil(hud.currentLife)} / ${Math.ceil(hud.maxLife)}`);
    setT('stamina-text-header', `STA: ${Math.ceil(hud.currentStamina)} / ${Math.ceil(hud.maxStamina)}`);
    setT('mana-text-header', `MANA: ${Math.ceil(hud.currentMana)} / ${Math.ceil(hud.maxMana)}`);
    setT('xp-text-header', `XP: ${Math.floor(hud.xp)} / ${Math.floor(hud.xpToNextLevel)}`);
    
    if (gameData.currentMonster) {
        setW('monster-hp-fill', (gameData.currentMonster.hp / gameData.currentMonster.maxHp) * 100);
        setT('monster-hp-text', `HP: ${Math.ceil(gameData.currentMonster.hp)} / ${gameData.currentMonster.maxHp}`);
    }
}

// ==========================================
// MONSTER & SPAWNING SYSTEM
// ==========================================

function getUnlockedMonsters() {
    const unlocked = [];
    for (let i = 0; i < MONSTERS.length; i++) {
        if (isMonsterUnlocked(gameData.level, MONSTERS[i].level)) {
            unlocked.push(MONSTERS[i]);
        }
    }
    return unlocked;
}

function getNextMonsterIndex() {
    return getHighestUnlockedMonsterIndex(gameData.level, MONSTERS);
}

function spawnMonster(monsterIndex) {
    if (monsterIndex < 0 || monsterIndex >= MONSTERS.length) {
        monsterIndex = getNextMonsterIndex();
    }
    
    const template = MONSTERS[monsterIndex];
    gameData.currentMonsterIndex = monsterIndex;
    gameData.currentMonster = {
        id: template.id,
        name: template.name,
        hp: template.hp,
        maxHp: template.hp,
        damage: template.damage,
        attackSpeed: template.attackSpeed,
        goldMin: template.goldMin,
        goldMax: template.goldMax,
        xp: template.xp,
        icon: template.icon,
        level: template.level,
        lootPools: Array.isArray(template.lootPools) ? [...template.lootPools] : [],
        dropTable: template.dropTable || []
    };
    
    const card = document.getElementById('monster-card');
    if (card) {
        document.getElementById('monster-icon').innerText = template.icon;
        document.getElementById('monster-name').innerText = template.name;
    }
    
    gameData.monsterDefeats[template.id] = (gameData.monsterDefeats[template.id] || 0);
}

function changeMonster(direction) {
    let newIndex = gameData.currentMonsterIndex + direction;
    const unlocked = getUnlockedMonsters();
    
    // Clamp to unlocked range
    const minIndex = MONSTERS.indexOf(unlocked[0]);
    const maxIndex = MONSTERS.indexOf(unlocked[unlocked.length - 1]);
    
    newIndex = Math.max(minIndex, Math.min(maxIndex, newIndex));
    
    if (newIndex >= 0 && newIndex < MONSTERS.length) {
        spawnMonster(newIndex);
    }
}

// ==========================================
// INVENTORY MANAGEMENT
// ==========================================

function addItemToBank(itemId, itemLevel) {
    const item = getItemDefinition(itemId);
    if (!item) return false;
    if (typeof ensureBankPageData === 'function') {
        ensureBankPageData(gameData);
    }
    const bankGrid = gameData.bank;
    
    const bankCols = getBankCols();
    const bankRows = Math.ceil(BANK_SLOTS / bankCols);
    const baseBody = (typeof getItemBodyMatrix === 'function')
        ? getItemBodyMatrix(item, 0)
        : (item.body || [[1]]);
    const bodyCopy = baseBody.map((r) => [...r]);

    for (let i = 0; i < BANK_SLOTS; i++) {
        if (!canPlaceItem(bankGrid, i, bodyCopy, bankCols, bankRows)) continue;
        const tx = tryPlaceItemTransactional(bankGrid, item, bodyCopy, i, bankCols, {
            maxRows: bankRows,
            rotationIndex: 0
        });
        if (!tx.ok) continue;
        if (tx.instanceId && typeof registerItemInstance === 'function') {
            const ilvl = Number.isFinite(itemLevel) ? itemLevel : Math.max(1, gameData.level);
            registerItemInstance(gameData, tx.instanceId, item.id, ilvl, { source: 'drop' });
        }
        return true;
    }
    
    return false; // Bank full
}

function _getShopItemsForRender() {
    if (!isDeveloperShopEnabled()) {
        return getShopItems();
    }
    if (typeof getAllItemDefs !== 'function') {
        return getShopItems();
    }
    const allDefs = getAllItemDefs();
    if (!allDefs || typeof allDefs !== 'object') {
        return getShopItems();
    }
    return Object.values(allDefs);
}

function _sortShopItems(items) {
    if (!Array.isArray(items)) return [];
    return items.slice().sort((a, b) => {
        const reqA = Math.max(1, Math.floor(Number(a && a.req) || 1));
        const reqB = Math.max(1, Math.floor(Number(b && b.req) || 1));
        if (reqA !== reqB) return reqA - reqB;

        const rarityA = (a && typeof a.rarity === 'string') ? a.rarity : 'common';
        const rarityB = (b && typeof b.rarity === 'string') ? b.rarity : 'common';
        const rarityRankA = Object.prototype.hasOwnProperty.call(SHOP_RARITY_SORT_ORDER, rarityA) ? SHOP_RARITY_SORT_ORDER[rarityA] : 999;
        const rarityRankB = Object.prototype.hasOwnProperty.call(SHOP_RARITY_SORT_ORDER, rarityB) ? SHOP_RARITY_SORT_ORDER[rarityB] : 999;
        if (rarityRankA !== rarityRankB) return rarityRankA - rarityRankB;

        const nameA = (a && a.name) ? String(a.name) : '';
        const nameB = (b && b.name) ? String(b.name) : '';
        return nameA.localeCompare(nameB, 'de');
    });
}

function renderShop() {
    const container = document.getElementById('shop-container');
    if (!container) return;
    
    container.innerHTML = '';
    const devShopEnabled = isDeveloperShopEnabled();
    const shopItems = _sortShopItems(_getShopItemsForRender());

    if (devShopEnabled) {
        const hint = document.createElement('div');
        hint.className = 'shop-item-card';
        hint.style.gridColumn = '1 / -1';
        hint.style.borderColor = '#f97316';
        hint.style.boxShadow = '0 0 18px rgba(249,115,22,0.35)';
        hint.innerHTML = '<strong>Dev-Shop aktiv:</strong> Alle Items sichtbar, Kaufpreis 0 Gold.';
        container.appendChild(hint);
    }
    
    shopItems.forEach(item => {
        const card = document.createElement('div');
        card.classList.add('shop-item-card', item.rarity);
        
        const itemPrice = devShopEnabled ? 0 : Math.max(0, Math.floor(Number(item.price) || 0));
        const requiredLevel = Math.max(1, Math.floor(Number(item.req) || 1));
        const hasLevel = devShopEnabled ? true : gameData.level >= requiredLevel;
        const hasGold = devShopEnabled ? true : gameData.gold >= itemPrice;
        const canBuy = hasLevel && hasGold;
        if (!canBuy) card.style.opacity = '0.6';
        
        const statText = [];
        if (Number.isFinite(item.physicalDamageMin) || Number.isFinite(item.physicalDamageMax)) {
            const min = Math.max(0, Number.isFinite(item.physicalDamageMin) ? item.physicalDamageMin : 0);
            const max = Math.max(min, Number.isFinite(item.physicalDamageMax) ? item.physicalDamageMax : min);
            statText.push(`${Math.round(min)}-${Math.round(max)} Physical`);
        }
        if (Number.isFinite(item.attacksPerSecond)) statText.push(`${item.attacksPerSecond.toFixed(2)} APS`);
        if (Number.isFinite(item.armour) && item.armour > 0) statText.push(`+${Math.round(item.armour)} Armour`);
        if (Number.isFinite(item.evasion) && item.evasion > 0) statText.push(`+${Math.round(item.evasion)} Evasion`);
        if (Number.isFinite(item.auraShield) && item.auraShield > 0) statText.push(`+${Math.round(item.auraShield)} Aura Shield`);
        if (item.speedBonus) statText.push(`+${Math.floor((item.speedBonus - 1) * 100)}% Speed`);
        if (item.xpBonus) statText.push(`+${Math.floor((item.xpBonus - 1) * 100)}% XP`);
        
        const iconHtml = item.sprite ? `<img src="${item.sprite}" alt="${item.name}" class="shop-item-sprite" style="width:56px;height:56px;object-fit:contain;">` : `<div class="shop-item-icon">${item.icon}</div>`;

        card.innerHTML = `
            ${iconHtml}
            <h4 style="margin: 10px 0;">${item.name}</h4>
            <p style="font-size: 0.8rem; color: #aaa; margin: 5px 0;">${item.desc || ''}</p>
            ${statText.length > 0 ? `<p style="font-size: 0.75rem; color: var(--accent-gold); margin: 5px 0;">${statText.join(' | ')}</p>` : ''}
            <p style="font-size: 0.8rem; color: #888; margin: 5px 0;">Lvl ${requiredLevel}</p>
            <p style="font-weight: bold; color: var(--accent-gold); margin: 10px 0;">${itemPrice} Gold${devShopEnabled ? ' (Dev)' : ''}</p>
            <button class="buy-btn" onclick="buyItem('${item.id}')" ${canBuy ? '' : 'disabled'}>
                ${canBuy ? 'Kaufen' : (hasLevel ? 'Zu teuer' : 'Level zu niedrig')}
            </button>
        `;
        
        if (window.ItemTooltip && typeof window.ItemTooltip.bindItemElement === 'function') {
            window.ItemTooltip.bindItemElement(card, () => ({
                source: 'shop',
                itemDef: item,
                itemId: item.id,
                itemLevel: Math.max(1, Number.isFinite(gameData.level) ? gameData.level : 1)
            }));
        }
        
        container.appendChild(card);
    });
}

// ==========================================
// WORKSHOP & GRID RENDERING
// ==========================================

/**
 * Renders visual preview of dragged item on a specific grid container.
 * Preview shows BODY only; aura is shown on hover elsewhere.
 */
function renderDragPreviewForGrid(container, location, cols, totalSlots) {
    const draggedItem = DragSystem.getDraggedItem();
    if (!draggedItem) return;
    const maxRows = Math.ceil(totalSlots / cols);

    // Determine whether the mouse is over THIS container. Prefer explicit hoverTarget
    // when it points into this location; otherwise use last known mouse position
    // and only snap if that position is inside the container rect.
    let hoverIndex = null;
    const rect = container.getBoundingClientRect();
    const lastPos = window._dragLastPos || null;
    const pointerInsideThisGrid = !!(lastPos && lastPos.x >= rect.left && lastPos.x <= rect.right && lastPos.y >= rect.top && lastPos.y <= rect.bottom);

    if (draggedItem.hoverTarget && draggedItem.hoverTarget.location === location) {
        hoverIndex = draggedItem.hoverTarget.index;
    } else if (pointerInsideThisGrid) {
        const geo = getCellGeometry(container, cols);
        const cellW = geo.cellW;
        const cellH = geo.cellH;
        const relX = lastPos.x - rect.left;
        const relY = lastPos.y - rect.top;
        const col = Math.floor(relX / cellW);
        const row = Math.floor(relY / cellH);
        const clampedCol = Math.max(0, Math.min(cols - 1, col));
        const clampedRow = Math.max(0, Math.min(maxRows - 1, row));
        hoverIndex = clampedRow * cols + clampedCol;
    } else {
        // Mouse not over this container and no matching hoverTarget — don't render previews here
        return;
    }

    const bodyShape = draggedItem.previewShape || draggedItem.item?.body || [[1]];
    let placementValid = false;
    let previewOriginIndex = 0;
    let previewOriginX = 0;
    let previewOriginY = 0;
    let plan = null;

    if (typeof resolveDropPlacementPlan === 'function') {
        const searchRadius = location !== draggedItem.fromLocation ? 4 : 2;
        plan = resolveDropPlacementPlan({
            draggedItem,
            location,
            targetIndex: hoverIndex,
            cols,
            maxRows,
            grid: gameData[location],
            searchRadius,
            allowRadiusSearch: true
        });
    }

    if (plan && plan.ok) {
        previewOriginIndex = plan.canPlace ? plan.chosenIndex : plan.originIndex;
        placementValid = !!plan.canPlace;
        previewOriginX = previewOriginIndex % cols;
        previewOriginY = Math.floor(previewOriginIndex / cols);
        draggedItem.lastPreviewPlan = {
            location,
            targetIndex: hoverIndex,
            cols,
            rotationIndex: draggedItem.rotationIndex,
            offsetX: draggedItem.offsetX,
            offsetY: draggedItem.offsetY,
            plan
        };
    } else {
        const hoverX = hoverIndex % cols;
        const hoverY = Math.floor(hoverIndex / cols);
        previewOriginX = hoverX - draggedItem.offsetX;
        previewOriginY = hoverY - draggedItem.offsetY;
        previewOriginIndex = previewOriginY * cols + previewOriginX;
        placementValid = canPlaceItem(gameData[location], previewOriginIndex, bodyShape, cols, maxRows);
    }

    // Render preview for body only
    for (let r = 0; r < bodyShape.length; r++) {
        for (let c = 0; c < bodyShape[0].length; c++) {
            if (!bodyShape[r][c]) continue;
            const tx = previewOriginX + c;
            const ty = previewOriginY + r;
            const tidx = ty * cols + tx;

            const slotEl = container.querySelector(`.grid-slot[data-index="${tidx}"]`);
            if (slotEl) {
                const prev = document.createElement('div');
                prev.classList.add('preview-block');
                if (!placementValid) prev.classList.add('invalid');
                // color by rarity if available
                const rarity = draggedItem.item?.rarity || 'common';
                prev.classList.add(`preview-${rarity}`);
                slotEl.appendChild(prev);
            }
        }
    }
}

function renderWorkshopGrids() {
    if (!currentWorkshop) return;
    if (typeof ensureBankPageData === 'function') {
        ensureBankPageData(gameData);
    }
    
    const overlay = document.getElementById('workshop-overlay');
    if (!overlay) {
        console.error("Workshop overlay nicht gefunden!");
        return;
    }
    
    const bankGrid = document.getElementById('bank-grid');
    const activeGrid = document.getElementById('active-setup-grid');
    
    if (!bankGrid || !activeGrid) {
        console.error("Bank oder Active Grid nicht gefunden!");
        return;
    }
    
    // Prevent aura overflow from creating scrollbars - clip aura at grid edges
    bankGrid.style.overflow = 'hidden';
    activeGrid.style.overflow = 'hidden';
    
    // Stelle sicher, dass Grids existieren
    if (!gameData.bank) gameData.bank = {};
    if (!gameData.farmGrid) gameData.farmGrid = {};
    if (!gameData.pveGrid) gameData.pveGrid = {};
    if (!gameData.pvpGrid) gameData.pvpGrid = {};
    if (!gameData.sortGrid) gameData.sortGrid = {};
    
    if (typeof window !== 'undefined' && window.DEBUG_WORKSHOP_RENDER === true) {
        console.debug("Rendering workshop grids for:", currentWorkshop);
    }
    
    // Bank Grid - always use centralized bank columns (storage-mode or compact)
    const bankCols = getBankCols();
    bankGrid.innerHTML = '';
    // Keep CSS width aligned with runtime column count
    try { bankGrid.style.setProperty('--bank-cols', bankCols); } catch (err) {}
    for (let i = 0; i < BANK_SLOTS; i++) {
        createSlot(bankGrid, 'bank', i, bankCols);
    }
    // Ensure bank grid CSS columns match runtime cols (keeps storage appearance consistent)
    try { bankGrid.style.gridTemplateColumns = `repeat(${bankCols}, var(--slot-size))`; } catch (err) {}
    // Render drag preview for bank
    renderDragPreviewForGrid(bankGrid, 'bank', bankCols, BANK_SLOTS);
    
    // Active Grid (Farm or PvE)
    activeGrid.innerHTML = '';
    const gridType = getWorkshopOverlayGridKey(currentWorkshop);
    
    const totalSlots = GRID_SIZE * GRID_ROWS;
    for (let i = 0; i < totalSlots; i++) {
        createSlot(activeGrid, gridType, i, GRID_SIZE);
    }
    // Render drag preview for active grid
    renderDragPreviewForGrid(activeGrid, gridType, GRID_SIZE, totalSlots);
    
    if (typeof renderStoragePageTabs === 'function') {
        renderStoragePageTabs();
    }
    
    // Apply storage filters after rendering (if in storage mode)
    if (typeof applyStorageFilters === 'function') {
        applyStorageFilters();
    }

    renderItemMutatorSummary(currentWorkshop);
}

// Queueing render to avoid re-render storms during drag operations
let _renderQueued = false;
function queueRenderWorkshopGrids() {
    if (_renderQueued) return;
    _renderQueued = true;
    requestAnimationFrame(() => {
        _renderQueued = false;
        try { renderWorkshopGrids(); } catch (err) { console.error('renderWorkshop error', err); }
    });
}

// ==========================================
// TOOLTIP SYSTEM
// ==========================================

function showTooltip(e, item) {
    if (!window.ItemTooltip || typeof window.ItemTooltip.showForContext !== 'function') return;
    const anchor = e && e.currentTarget ? e.currentTarget : null;
    if (!anchor) return;
    window.ItemTooltip.showForContext(anchor, {
        source: 'legacy',
        itemDef: item,
        itemLevel: Math.max(1, Number.isFinite(gameData.level) ? gameData.level : 1)
    }, e || null);
}

function hideTooltip() {
    if (window.ItemTooltip && typeof window.ItemTooltip.hide === 'function') {
        window.ItemTooltip.hide();
    }
}

function initTooltipListeners() {
    if (window.ItemTooltip && typeof window.ItemTooltip.init === 'function') {
        window.ItemTooltip.init();
    }
}

// ==========================================
// EQUIPMENT & BONUSES
// ==========================================

function getEquippedItems(gridType) {
    const grid = gameData[gridType];
    const equipped = [];
    
    Object.keys(grid).forEach(key => {
        const cell = grid[key];
        if (cell && cell.root) {
            // Runtime stats are always resolved from static item definitions by itemId.
            const item = getItemDefinition(cell.itemId, cell);
            if (item) equipped.push(item);
        }
    });
    
    return equipped;
}

function calculateEquipmentBonus(gridType, bonusType) {
    if (gridType === 'farmGrid') {
        const characterStats = getDerivedCharacterStats(gridType);
        if (characterStats) {
            if (bonusType === 'speed') return Number.isFinite(characterStats.attacksPerSecond) ? characterStats.attacksPerSecond : characterStats.attackSpeed;
            if (bonusType === 'xp') return characterStats.xpGainMultiplier;
            if (bonusType === 'damage') return calculateCharacterDamageValue(characterStats);
        }
    }
    const equipped = getEquippedItems(gridType);
    return calculateEquipmentBonusValue(equipped, bonusType);
}

function calculatePlayerDamage() {
    const activeGridKey = getActiveCombatGridKey();
    const characterStats = _getFreshDerivedCharacterStats(activeGridKey);
    if (characterStats) {
        const resolved = _resolvePlayerCombatDamage(characterStats, activeGridKey);
        return resolved.damage;
    }
    const equipped = getEquippedItems(activeGridKey);
    return calculatePlayerDamageWithEquipment(gameData.level, equipped);
}

// ==========================================
// INITIALISIERUNG
// ==========================================

setInterval(() => { updateLogic(); updateUI(); }, ZONE_COMBAT_TICK_MS);

window.onload = () => {
    console.log("Loadout Legends initializing...");
    
    // 1. Laden (aus Saveengine.js)
    if (typeof loadGame === 'function') {
        loadGame();
    } else {
        console.warn("loadGame not found - using default game state");
    }
    
    // 2. Initialize item registry BEFORE rendering shop (supports tools, swords, bows, armor, shields, accessories)
    if (typeof initializeItemRegistry === 'function') {
        initializeItemRegistry();
    }

    if (typeof ensureCharacterModelOnGameData === 'function') {
        ensureCharacterModelOnGameData(gameData);
    }
    if (typeof ensureBattlefieldDefaultsInData === 'function') {
        ensureBattlefieldDefaultsInData(gameData);
    } else {
        ensureBattlefieldData(gameData);
    }
    ensureSettingsDefaults();
    audioRuntime.settingsReady = true;
    _syncAudioVolumeLabelsAndSliders();
    _syncDevModeOptionToggle();
    _syncAffixDetailsOptionToggle();
    _syncActiveAudioVolumes();
    _ensureMusicLoopRunning(true);
    markCharacterDirty();
    getDerivedCharacterStats('farmGrid');
    mountCharacterPanels();
    
    // 3. Initiales UI Rendering
    spawnMonster(0);
    renderShop();
    renderEquipmentHub();
    
    // 4. Global event listeners
    if (typeof initGlobalDragListeners === 'function') {
        initGlobalDragListeners();
    }
    initUISoundBindings();
    
    initTooltipListeners();
    
    // 5. Start-Tab setzen
    switchTab('grind');
    
    // 6. Final UI update
    updateUI();
    refreshCharacterPanels();
    _syncAmbientLoopState();
    
    console.log("Loadout Legends ready!");
};

if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
    window.addEventListener('character:stats-updated', () => {
        updateUI();
    });
}
