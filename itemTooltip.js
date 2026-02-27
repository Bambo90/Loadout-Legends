/* ITEM TOOLTIP SYSTEM
 * Global tooltip renderer for all item UI instances.
 */
(function () {
    "use strict";

    const ITEM_TOOLTIP_TOGGLE_STORAGE_KEY = "LoadoutLegends.itemTooltipEnabled";
    const ITEM_TOOLTIP_DEFAULT_ENABLED = true;

    const ITEM_TOOLTIP_LABELS = Object.freeze({
        baseType: "BaseType",
        itemLevel: "ilvl",
        weight: "Weight",
        baseStats: "BaseStats",
        implicit: "Implicit",
        prefixes: "Prefixes",
        suffixes: "Suffixes",
        effective: "Wirksame Modifier",
        legacy: "Legacy/Converted",
        empty: "-",
        tier: "T",
        range: "Range",
        roll: "Roll"
    });

    const ITEM_TOOLTIP_STAT_LABELS = Object.freeze({
        "damage.slash.min": "Slash Damage Min",
        "damage.slash.max": "Slash Damage Max",
        "damage.pierce.min": "Pierce Damage Min",
        "damage.pierce.max": "Pierce Damage Max",
        "damage.blunt.min": "Blunt Damage Min",
        "damage.blunt.max": "Blunt Damage Max",
        "damageFlat": "Damage",
        "damageMin": "Damage Min",
        "damageMax": "Damage Max",
        "armor.slash": "Slash Armor",
        "armor.pierce": "Pierce Armor",
        "armor.blunt": "Blunt Armor",
        "attackCooldownMs": "Attack Cooldown",
        "attackIntervalMs": "Attack Interval (ms)",
        "attackSpeed": "Attack Speed",
        "xpGainMultiplier": "XP Gain",
        "critChance": "Crit Chance",
        "life": "Life",
        "mana": "Mana",
        "stamina": "Stamina",
        "staminaRegen": "Stamina Regen",
        "manaRegen": "Mana Regen",
        "staminaCost": "Stamina Cost",
        "weightLimit": "Weight Limit"
    });

    let _initialized = false;
    let _enabled = ITEM_TOOLTIP_DEFAULT_ENABLED;
    let _tooltipEl = null;
    let _currentAnchor = null;

    function _num(value, fallbackValue) {
        return Number.isFinite(value) ? value : fallbackValue;
    }

    function _isFiniteNumber(value) {
        return typeof value === "number" && Number.isFinite(value);
    }

    function _getStorageAdapter() {
        if (typeof window !== "undefined" && window.PlatformBridge && window.PlatformBridge.storage) {
            return window.PlatformBridge.storage;
        }
        return {
            getItem(key) {
                try { return localStorage.getItem(key); } catch (err) { return null; }
            },
            setItem(key, value) {
                try {
                    localStorage.setItem(key, value);
                    return true;
                } catch (err) {
                    return false;
                }
            }
        };
    }

    function _ensureGameSettings() {
        if (typeof gameData === "undefined" || !gameData || typeof gameData !== "object") return null;
        if (!gameData.settings || typeof gameData.settings !== "object" || Array.isArray(gameData.settings)) {
            gameData.settings = {};
        }
        return gameData.settings;
    }

    function _parseBoolish(raw) {
        if (typeof raw === "boolean") return raw;
        if (typeof raw === "string") {
            const normalized = raw.trim().toLowerCase();
            if (normalized === "1" || normalized === "true") return true;
            if (normalized === "0" || normalized === "false") return false;
        }
        return null;
    }

    function _readInitialEnabledState() {
        const storage = _getStorageAdapter();
        const persisted = _parseBoolish(storage.getItem(ITEM_TOOLTIP_TOGGLE_STORAGE_KEY));
        if (typeof persisted === "boolean") return persisted;

        const settings = _ensureGameSettings();
        if (settings && typeof settings.itemTooltipsEnabled === "boolean") {
            return settings.itemTooltipsEnabled;
        }

        return ITEM_TOOLTIP_DEFAULT_ENABLED;
    }

    function _persistEnabledState(enabled) {
        const normalized = !!enabled;
        const settings = _ensureGameSettings();
        if (settings) {
            settings.itemTooltipsEnabled = normalized;
        }
        const storage = _getStorageAdapter();
        storage.setItem(ITEM_TOOLTIP_TOGGLE_STORAGE_KEY, normalized ? "1" : "0");
    }

    function _escapeHtml(value) {
        return String(value == null ? "" : value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function _label(key) {
        return ITEM_TOOLTIP_LABELS[key] || key;
    }

    function _formatStatLabel(statPath) {
        if (typeof statPath !== "string" || !statPath) return "";
        if (ITEM_TOOLTIP_STAT_LABELS[statPath]) return ITEM_TOOLTIP_STAT_LABELS[statPath];
        return statPath
            .replace(/\./g, " ")
            .replace(/([a-z])([A-Z])/g, "$1 $2")
            .replace(/\s+/g, " ")
            .trim();
    }

    function _formatNumber(value) {
        if (!Number.isFinite(value)) return "0";
        const rounded = Number(value.toFixed(2));
        if (Number.isInteger(rounded)) return String(rounded);
        return rounded.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
    }

    function _isIntegerLikeStatPath(statPath) {
        if (typeof statPath !== "string" || !statPath) return false;
        if (statPath === "life" || statPath === "mana" || statPath === "stamina" || statPath === "weightLimit" || statPath === "staminaCost") return true;
        if (statPath === "damageFlat" || statPath === "damageMin" || statPath === "damageMax") return true;
        if (statPath.startsWith("armor.")) return true;
        if (statPath.startsWith("damage.")) return true;
        return false;
    }

    function _normalizeModifier(rawModifier) {
        if (!rawModifier || typeof rawModifier !== "object") return null;
        if (typeof rawModifier.statPath !== "string" || !rawModifier.statPath) return null;
        if (rawModifier.type !== "flat" && rawModifier.type !== "percent") return null;
        if (!_isFiniteNumber(rawModifier.value)) return null;
        return {
            statPath: rawModifier.statPath,
            type: rawModifier.type,
            value: rawModifier.value
        };
    }

    function _formatModifierValue(modifier) {
        const normalized = _normalizeModifier(modifier);
        if (!normalized) return "0";
        let value = normalized.value;
        if (normalized.statPath === "attackCooldownMs" && normalized.type === "percent") {
            value = -value;
        }
        if (normalized.type === "percent") {
            const percent = value * 100;
            const sign = percent > 0 ? "+" : "";
            return `${sign}${_formatNumber(percent)}%`;
        }
        const sign = value > 0 ? "+" : "";
        const valueText = _isIntegerLikeStatPath(normalized.statPath)
            ? String(Math.round(value))
            : _formatNumber(value);
        return `${sign}${valueText}`;
    }

    function _modifierKey(modifier) {
        const normalized = _normalizeModifier(modifier);
        if (!normalized) return "";
        return `${normalized.statPath}|${normalized.type}|${normalized.value.toFixed(6)}`;
    }

    function _resolveRuntimeItem(context) {
        const ctx = context && typeof context === "object" ? context : {};
        const cell = ctx.cell && typeof ctx.cell === "object" ? ctx.cell : null;

        if (ctx.itemInstance && typeof ctx.itemInstance === "object") return ctx.itemInstance;

        if (cell && cell.itemId) {
            if (typeof getItemDefinition === "function") {
                const runtimeFromCell = getItemDefinition(cell.itemId, cell);
                if (runtimeFromCell) return runtimeFromCell;
            }
            if (typeof getRuntimeItemDefinition === "function" && typeof gameData !== "undefined") {
                const runtime = getRuntimeItemDefinition(gameData, cell.itemId, cell);
                if (runtime) return runtime;
            }
            if (typeof getItemDefById === "function") {
                const base = getItemDefById(cell.itemId);
                if (base) return base;
            }
        }

        if (ctx.item && typeof ctx.item === "object") return ctx.item;
        if (ctx.itemDef && typeof ctx.itemDef === "object") return ctx.itemDef;

        if (typeof ctx.itemId === "string" && ctx.itemId) {
            if (typeof getItemDefById === "function") {
                const byDef = getItemDefById(ctx.itemId);
                if (byDef) return byDef;
            }
            if (typeof getItemById === "function") {
                const byLegacy = getItemById(ctx.itemId);
                if (byLegacy) return byLegacy;
            }
        }

        return null;
    }

    function _resolveBaseItem(runtimeItem) {
        if (!runtimeItem || typeof runtimeItem !== "object") return null;
        const baseId = runtimeItem.id || runtimeItem.itemId || runtimeItem.baseId || null;
        if (!baseId) return runtimeItem;
        if (typeof getItemDefById === "function") {
            const base = getItemDefById(baseId);
            if (base) return base;
        }
        if (typeof getItemById === "function") {
            const legacyBase = getItemById(baseId);
            if (legacyBase) return legacyBase;
        }
        return runtimeItem;
    }

    function _resolveItemLevel(runtimeItem, context) {
        if (_isFiniteNumber(runtimeItem && runtimeItem.itemLevel)) {
            return Math.max(1, Math.floor(runtimeItem.itemLevel));
        }

        const ctx = context && typeof context === "object" ? context : {};
        const cell = ctx.cell && typeof ctx.cell === "object" ? ctx.cell : null;

        if (cell && cell.instanceId && typeof getItemInstanceData === "function" && typeof gameData !== "undefined") {
            const record = getItemInstanceData(gameData, cell.instanceId);
            if (record && _isFiniteNumber(record.itemLevel)) {
                return Math.max(1, Math.floor(record.itemLevel));
            }
        }

        if (_isFiniteNumber(ctx.itemLevel)) return Math.max(1, Math.floor(ctx.itemLevel));
        if (_isFiniteNumber(cell && cell.itemLevel)) return Math.max(1, Math.floor(cell.itemLevel));

        if (typeof gameData !== "undefined" && gameData && typeof gameData === "object") {
            const characterLevel = gameData.character &&
                gameData.character.base &&
                _isFiniteNumber(gameData.character.base.level)
                ? gameData.character.base.level
                : null;
            if (_isFiniteNumber(characterLevel)) return Math.max(1, Math.floor(characterLevel));
            if (_isFiniteNumber(gameData.level)) return Math.max(1, Math.floor(gameData.level));
        }
        return 1;
    }

    function _findAffixTier(affixDef, tierValue) {
        if (!affixDef || !Array.isArray(affixDef.tiers)) return null;
        return affixDef.tiers.find((tierEntry) => tierEntry && tierEntry.tier === tierValue) || null;
    }

    function _isRollWithinTierBounds(rollValue, tierDef) {
        if (!_isFiniteNumber(rollValue) || !tierDef) return false;
        const min = Number.isFinite(tierDef.min) ? Math.min(tierDef.min, tierDef.max) : null;
        const max = Number.isFinite(tierDef.max) ? Math.max(tierDef.min, tierDef.max) : null;
        if (!Number.isFinite(min) || !Number.isFinite(max)) return false;
        const epsilon = 0.0001;
        return rollValue >= (min - epsilon) && rollValue <= (max + epsilon);
    }

    function _resolveAffixTierForRoll(affixDef, rollEntry) {
        if (!affixDef || !Array.isArray(affixDef.tiers)) return null;
        const rollValue = Number(rollEntry && rollEntry.roll);
        const storedTier = _isFiniteNumber(rollEntry && rollEntry.tier) ? Math.max(1, Math.floor(rollEntry.tier)) : null;
        let tierDef = storedTier ? _findAffixTier(affixDef, storedTier) : null;
        if (tierDef && _isFiniteNumber(rollValue) && !_isRollWithinTierBounds(rollValue, tierDef)) {
            tierDef = null;
        }
        if (!tierDef && _isFiniteNumber(rollValue)) {
            tierDef = affixDef.tiers.find((candidate) => _isRollWithinTierBounds(rollValue, candidate)) || null;
        }
        return tierDef;
    }

    function _mapTierToDisplayRank(affixDef, actualTier) {
        if (!affixDef || !Array.isArray(affixDef.tiers) || !_isFiniteNumber(actualTier)) return actualTier;
        const orderedByTier = affixDef.tiers
            .filter(Boolean)
            .slice()
            .sort((a, b) => (Number(a.tier) || 0) - (Number(b.tier) || 0));
        const alreadyT1Best = orderedByTier.length > 1 && orderedByTier.every((entry, idx) => {
            if (idx === 0) return true;
            const prevReq = Number(orderedByTier[idx - 1].requiredIlvl);
            const currReq = Number(entry.requiredIlvl);
            return Number.isFinite(prevReq) && Number.isFinite(currReq) && prevReq >= currReq;
        });
        if (alreadyT1Best) return actualTier;
        const ranked = affixDef.tiers
            .filter(Boolean)
            .slice()
            .sort((a, b) => {
                const ai = Number.isFinite(a.requiredIlvl) ? a.requiredIlvl : 0;
                const bi = Number.isFinite(b.requiredIlvl) ? b.requiredIlvl : 0;
                if (bi !== ai) return bi - ai;
                const at = Number.isFinite(a.tier) ? a.tier : 0;
                const bt = Number.isFinite(b.tier) ? b.tier : 0;
                return bt - at;
            });
        const idx = ranked.findIndex((entry) => entry && entry.tier === actualTier);
        return idx >= 0 ? (idx + 1) : actualTier;
    }

    function _formatAffixName(affixId, affixDef) {
        if (affixDef && typeof affixDef.displayName === "string" && affixDef.displayName) return affixDef.displayName;
        if (affixDef && typeof affixDef.name === "string" && affixDef.name) return affixDef.name;
        const raw = typeof affixId === "string" ? affixId : "";
        if (!raw) return "Affix";
        return raw
            .replace(/^(implicit_|prefix_|suffix_)/, "")
            .replace(/^(weapon_|armor_|jewelry_)/, "")
            .replace(/^of_/, "")
            .replace(/_/g, " ")
            .replace(/\b\w/g, (char) => char.toUpperCase());
    }

    function _formatAffixEffectText(modifier) {
        const normalized = _normalizeModifier(modifier);
        if (!normalized) return "";
        return `${_formatStatLabel(normalized.statPath)} ${_formatModifierValue(normalized)}`;
    }

    function _buildAffixRows(rollList) {
        if (!Array.isArray(rollList)) return [];
        return rollList
            .map((rollEntry) => {
                if (!rollEntry || typeof rollEntry !== "object") return null;
                if (typeof rollEntry.affixId !== "string" || !rollEntry.affixId) return null;
                if (!_isFiniteNumber(rollEntry.roll)) return null;
                const affixDef = (typeof getAffixDefById === "function")
                    ? getAffixDefById(rollEntry.affixId)
                    : null;
                if (!affixDef) return null;
                const modifier = _normalizeModifier({
                    statPath: affixDef.statPath,
                    type: affixDef.type,
                    value: rollEntry.roll
                });
                if (!modifier) return null;
                const tierDef = _resolveAffixTierForRoll(affixDef, rollEntry);
                const tierActual = (tierDef && _isFiniteNumber(tierDef.tier))
                    ? Math.max(1, Math.floor(tierDef.tier))
                    : (_isFiniteNumber(rollEntry.tier) ? Math.max(1, Math.floor(rollEntry.tier)) : 1);
                const tierDisplay = _mapTierToDisplayRank(affixDef, tierActual);
                return {
                    affixId: rollEntry.affixId,
                    name: _formatAffixName(rollEntry.affixId, affixDef),
                    tier: tierDisplay,
                    tierActual,
                    min: tierDef && _isFiniteNumber(tierDef.min) ? tierDef.min : null,
                    max: tierDef && _isFiniteNumber(tierDef.max) ? tierDef.max : null,
                    roll: rollEntry.roll,
                    modifier,
                    key: _modifierKey(modifier)
                };
            })
            .filter(Boolean);
    }

    function _toSlotCount(value) {
        if (!_isFiniteNumber(value)) return 0;
        return Math.max(0, Math.floor(value));
    }

    function _hasAffixPool(item, key) {
        return !!(item && Array.isArray(item[key]) && item[key].length > 0);
    }

    function _isAffixCapableItem(runtimeItem, baseItem) {
        if ((runtimeItem && (runtimeItem.affixCapable === false || runtimeItem.disableAffixes === true))
            || (baseItem && (baseItem.affixCapable === false || baseItem.disableAffixes === true))) {
            return false;
        }
        return (
            _hasAffixPool(runtimeItem, "implicitPool") ||
            _hasAffixPool(runtimeItem, "prefixPool") ||
            _hasAffixPool(runtimeItem, "suffixPool") ||
            _hasAffixPool(baseItem, "implicitPool") ||
            _hasAffixPool(baseItem, "prefixPool") ||
            _hasAffixPool(baseItem, "suffixPool")
        );
    }

    function _resolveAffixSlotSummary(runtimeItem, baseItem, implicitRows, prefixRows, suffixRows) {
        const affixCapable = _isAffixCapableItem(runtimeItem, baseItem);
        const prefixSlots = affixCapable
            ? _toSlotCount(_isFiniteNumber(runtimeItem && runtimeItem.prefixSlots) ? runtimeItem.prefixSlots : (baseItem && baseItem.prefixSlots))
            : 0;
        const suffixSlots = affixCapable
            ? _toSlotCount(_isFiniteNumber(runtimeItem && runtimeItem.suffixSlots) ? runtimeItem.suffixSlots : (baseItem && baseItem.suffixSlots))
            : 0;
        const implicitSlots = affixCapable ? 1 : 0;
        const implicitFilled = implicitRows.length > 0 ? 1 : 0;
        return {
            affixCapable,
            implicitFilled,
            implicitSlots,
            prefixFilled: prefixRows.length,
            prefixSlots,
            suffixFilled: suffixRows.length,
            suffixSlots
        };
    }

    function _renderModifierRows(modifiers, sourceByKey) {
        if (!Array.isArray(modifiers) || modifiers.length === 0) {
            return `<div class="item-tooltip-empty">${_escapeHtml(_label("empty"))}</div>`;
        }
        return modifiers
            .map((modifier) => {
                const normalized = _normalizeModifier(modifier);
                if (!normalized) return "";
                const key = _modifierKey(normalized);
                const source = sourceByKey && sourceByKey[key] ? ` <span class="item-tooltip-source">(${_escapeHtml(sourceByKey[key])})</span>` : "";
                return (
                    `<div class="item-tooltip-row">` +
                        `<span class="item-tooltip-stat">${_escapeHtml(_formatStatLabel(normalized.statPath))}${source}</span>` +
                        `<span class="item-tooltip-value">${_escapeHtml(_formatModifierValue(normalized))}</span>` +
                    `</div>`
                );
            })
            .join("");
    }

    function _isAffixDetailsEnabled() {
        if (typeof isAffixDetailsEnabled === "function") {
            return !!isAffixDetailsEnabled();
        }
        const settings = _ensureGameSettings();
        return !!(settings && settings.affixDetailsEnabled === true);
    }

    function _renderAffixRows(rows) {
        if (!Array.isArray(rows) || rows.length === 0) {
            return `<div class="item-tooltip-empty">${_escapeHtml(_label("empty"))}</div>`;
        }
        const showDetails = _isAffixDetailsEnabled();
        return rows.map((entry) => {
            const effectText = _formatAffixEffectText(entry.modifier);
            const rangeText = (Number.isFinite(entry.min) && Number.isFinite(entry.max))
                ? `${_label("range")} ${_formatModifierValue({ statPath: entry.modifier.statPath, type: entry.modifier.type, value: entry.min })}–${_formatModifierValue({ statPath: entry.modifier.statPath, type: entry.modifier.type, value: entry.max })}`
                : `${_label("range")} -`;
            const tierText = `${_label("tier")}${entry.tier}`;
            const detailsHtml = showDetails
                ? `<div class="item-tooltip-row"><span class="item-tooltip-stat"><span class="item-tooltip-source">${_escapeHtml(`${tierText} (${rangeText})`)}</span></span><span class="item-tooltip-value"></span></div>`
                : "";
            return (
                `<div class="item-tooltip-row">` +
                    `<span class="item-tooltip-stat">${_escapeHtml(effectText)}</span>` +
                    `<span class="item-tooltip-value">${_escapeHtml(entry.name)}</span>` +
                `</div>` +
                detailsHtml
            );
        }).join("");
    }

    function _renderSection(title, bodyHtml) {
        return (
            `<section class="item-tooltip-section">` +
                `<div class="item-tooltip-section-title">${_escapeHtml(title)}</div>` +
                `<div class="item-tooltip-section-body">${bodyHtml}</div>` +
            `</section>`
        );
    }

    function _buildTooltipHtml(context) {
        const runtimeItem = _resolveRuntimeItem(context);
        if (!runtimeItem) return "";
        const baseItem = _resolveBaseItem(runtimeItem) || runtimeItem;

        const name = runtimeItem.name || baseItem.name || "Unknown Item";
        const baseType = runtimeItem.baseType || baseItem.baseType || runtimeItem.type || baseItem.type || "misc";
        const itemLevel = _resolveItemLevel(runtimeItem, context);

        let weight = null;
        if (_isFiniteNumber(runtimeItem.weight)) weight = Math.max(0, runtimeItem.weight);
        if (!_isFiniteNumber(weight) && _isFiniteNumber(baseItem.weight)) weight = Math.max(0, baseItem.weight);
        if (!_isFiniteNumber(weight) && typeof getItemWeight === "function") {
            weight = Math.max(0, _num(getItemWeight(runtimeItem), 0));
        }
        if (!_isFiniteNumber(weight)) weight = 0;

        const baseStats = Array.isArray(baseItem.baseStats)
            ? baseItem.baseStats.map(_normalizeModifier).filter(Boolean)
            : [];
        const implicitRows = _buildAffixRows(runtimeItem.implicits);
        const prefixRows = _buildAffixRows(runtimeItem.prefixes);
        const suffixRows = _buildAffixRows(runtimeItem.suffixes);
        const slotSummary = _resolveAffixSlotSummary(runtimeItem, baseItem, implicitRows, prefixRows, suffixRows);

        const effectiveModifiers = (typeof extractItemModifiers === "function")
            ? extractItemModifiers(runtimeItem).map(_normalizeModifier).filter(Boolean)
            : [];

        const baseKeys = new Set(baseStats.map(_modifierKey));
        const implicitKeys = new Set(implicitRows.map((entry) => entry.key));
        const prefixKeys = new Set(prefixRows.map((entry) => entry.key));
        const suffixKeys = new Set(suffixRows.map((entry) => entry.key));

        const sourceByKey = {};
        baseKeys.forEach((key) => { sourceByKey[key] = _label("baseStats"); });
        implicitKeys.forEach((key) => { sourceByKey[key] = _label("implicit"); });
        prefixKeys.forEach((key) => { sourceByKey[key] = "Prefix"; });
        suffixKeys.forEach((key) => { sourceByKey[key] = "Suffix"; });

        const legacyModifiers = effectiveModifiers.filter((modifier) => {
            const key = _modifierKey(modifier);
            return !baseKeys.has(key) && !implicitKeys.has(key) && !prefixKeys.has(key) && !suffixKeys.has(key);
        });

        const rarityClass = `item-tooltip-rarity-${_escapeHtml(runtimeItem.rarity || baseItem.rarity || "common")}`;

        const header = (
            `<header class="item-tooltip-header ${rarityClass}">` +
                `<div class="item-tooltip-name">${_escapeHtml(name)}</div>` +
                `<div class="item-tooltip-subline">${_escapeHtml(_label("baseType"))}: ${_escapeHtml(baseType)}</div>` +
                `<div class="item-tooltip-meta">` +
                    `<span>${_escapeHtml(_label("itemLevel"))}: ${_escapeHtml(String(itemLevel))}</span>` +
                    `<span>${_escapeHtml(_label("weight"))}: ${_escapeHtml(_formatNumber(weight))}</span>` +
                `</div>` +
            `</header>`
        );

        const sections = [
            _renderSection(_label("baseStats"), _renderModifierRows(baseStats)),
            _renderSection(`${_label("implicit")} (${slotSummary.implicitFilled}/${slotSummary.implicitSlots})`, _renderAffixRows(implicitRows)),
            _renderSection(`${_label("prefixes")} (${slotSummary.prefixFilled}/${slotSummary.prefixSlots})`, _renderAffixRows(prefixRows)),
            _renderSection(`${_label("suffixes")} (${slotSummary.suffixFilled}/${slotSummary.suffixSlots})`, _renderAffixRows(suffixRows))
        ];

        if (legacyModifiers.length > 0) {
            sections.push(_renderSection(_label("legacy"), _renderModifierRows(legacyModifiers)));
        }
        const devModeEnabled = (typeof isDevModeEnabled === "function")
            ? isDevModeEnabled()
            : !!(typeof gameData !== "undefined" && gameData && gameData.settings && gameData.settings.devMode === true);
        if (devModeEnabled) {
            const ctx = context && typeof context === "object" ? context : {};
            const cell = ctx.cell && typeof ctx.cell === "object" ? ctx.cell : null;
            const debugItemId = runtimeItem.id || runtimeItem.itemId || baseItem.id || baseItem.itemId || ctx.itemId || "--";
            const debugInstanceId = (cell && cell.instanceId) ? cell.instanceId : "--";
            const affixCount =
                (Array.isArray(runtimeItem.implicits) ? runtimeItem.implicits.length : 0) +
                (Array.isArray(runtimeItem.prefixes) ? runtimeItem.prefixes.length : 0) +
                (Array.isArray(runtimeItem.suffixes) ? runtimeItem.suffixes.length : 0);
            sections.push(`<section class="item-tooltip-section"><div class="item-tooltip-section-title">Debug</div><div class="item-tooltip-section-body"><div class="item-tooltip-row"><span class="item-tooltip-stat">${_escapeHtml(`id=${debugItemId} | inst=${debugInstanceId} | affixes=${affixCount}`)}</span><span class="item-tooltip-value"></span></div></div></section>`);
        }

        return (
            `<article class="item-tooltip-card">` +
                `${header}` +
                `${sections.join("")}` +
            `</article>`
        );
    }

    function _ensureTooltipEl() {
        if (_tooltipEl && document.body.contains(_tooltipEl)) return _tooltipEl;
        _tooltipEl = document.getElementById("tooltip");
        if (_tooltipEl) {
            _tooltipEl.classList.add("item-tooltip-root");
        }
        return _tooltipEl;
    }

    function _positionTooltip(event, anchorElement) {
        if (!_tooltipEl) return;
        const margin = 12;
        const viewportW = window.innerWidth || document.documentElement.clientWidth || 0;
        const viewportH = window.innerHeight || document.documentElement.clientHeight || 0;

        let left = margin;
        let top = margin;
        if (event && Number.isFinite(event.clientX) && Number.isFinite(event.clientY)) {
            left = event.clientX + 16;
            top = event.clientY + 16;
        } else if (anchorElement && typeof anchorElement.getBoundingClientRect === "function") {
            const rect = anchorElement.getBoundingClientRect();
            left = rect.right + 12;
            top = rect.top + 8;
        }

        const rect = _tooltipEl.getBoundingClientRect();
        if (left + rect.width + margin > viewportW) {
            left = Math.max(margin, viewportW - rect.width - margin);
        }
        if (top + rect.height + margin > viewportH) {
            top = Math.max(margin, viewportH - rect.height - margin);
        }

        _tooltipEl.style.left = `${left}px`;
        _tooltipEl.style.top = `${top}px`;
    }

    function hide() {
        _currentAnchor = null;
        if (!_tooltipEl) _ensureTooltipEl();
        if (_tooltipEl) {
            _tooltipEl.classList.add("hidden");
            _tooltipEl.innerHTML = "";
        }
    }

    function showForContext(anchorElement, context, event) {
        if (!_initialized) init();
        if (!_enabled) {
            hide();
            return;
        }
        const tooltipEl = _ensureTooltipEl();
        if (!tooltipEl || !anchorElement) return;

        const html = _buildTooltipHtml(context);
        if (!html) {
            hide();
            return;
        }

        _currentAnchor = anchorElement;
        tooltipEl.innerHTML = html;
        tooltipEl.classList.remove("hidden");
        _positionTooltip(event, anchorElement);
        requestAnimationFrame(() => {
            if (_currentAnchor === anchorElement) {
                _positionTooltip(event, anchorElement);
            }
        });
    }

    function bindItemElement(element, contextOrProvider) {
        if (!element || typeof element.addEventListener !== "function") return;
        if (element.__itemTooltipBound) return;

        const provider = (typeof contextOrProvider === "function")
            ? contextOrProvider
            : (() => contextOrProvider || {});

        const onEnter = (event) => {
            if (!_enabled) return;
            const context = provider(event) || {};
            showForContext(element, context, event);
        };
        const onMove = (event) => {
            if (_currentAnchor !== element || !_tooltipEl || _tooltipEl.classList.contains("hidden")) return;
            _positionTooltip(event, element);
        };
        const onLeave = () => {
            if (_currentAnchor === element) hide();
        };
        const onPointerDown = () => {
            if (_currentAnchor === element) hide();
        };

        element.__itemTooltipBound = { onEnter, onMove, onLeave, onPointerDown };
        element.addEventListener("mouseenter", onEnter);
        element.addEventListener("mousemove", onMove);
        element.addEventListener("mouseleave", onLeave);
        element.addEventListener("pointerdown", onPointerDown);
    }

    function setEnabled(nextState, options) {
        const opts = options && typeof options === "object" ? options : {};
        _enabled = !!nextState;
        if (opts.persist !== false) {
            _persistEnabledState(_enabled);
        }
        if (!_enabled) {
            hide();
        }
        if (opts.emit !== false && typeof window !== "undefined" && typeof window.dispatchEvent === "function" && typeof CustomEvent === "function") {
            window.dispatchEvent(new CustomEvent("item-tooltip:toggle", {
                detail: { enabled: _enabled }
            }));
        }
    }

    function toggleEnabled(options) {
        setEnabled(!_enabled, options);
        return _enabled;
    }

    function isEnabled() {
        return !!_enabled;
    }

    function _onGlobalKeyDown(event) {
        if (!event || event.repeat) return;
        if (typeof window.isKeybindCaptureActive === "function" && window.isKeybindCaptureActive()) return;
        const target = event.target;
        const isTextInput = !!(target && (
            target.tagName === "INPUT" ||
            target.tagName === "TEXTAREA" ||
            target.tagName === "SELECT" ||
            target.isContentEditable
        ));
        const isDetailsToggleKey = (typeof window.matchesActionKeybinding === "function")
            ? window.matchesActionKeybinding("toggleAffixDetails", event)
            : (event.code === "KeyA" || (typeof event.key === "string" && event.key.toLowerCase() === "a"));
        if (isDetailsToggleKey && !isTextInput) {
            const nextValue = !_isAffixDetailsEnabled();
            if (typeof setAffixDetailsSetting === "function") {
                setAffixDetailsSetting(nextValue);
            } else {
                const settings = _ensureGameSettings();
                if (settings) settings.affixDetailsEnabled = nextValue;
            }
            event.preventDefault();
            return;
        }
        const isToggleKey = (typeof window.matchesActionKeybinding === "function")
            ? window.matchesActionKeybinding("toggleTooltips", event)
            : event.key === "Alt";
        if (!isToggleKey) return;
        // Toggle only once per key press (no hold behavior).
        toggleEnabled({ persist: true, emit: true });
        event.preventDefault();
    }

    function init() {
        if (_initialized) return;
        _initialized = true;

        if (typeof window.altKeyPressed !== "boolean") {
            window.altKeyPressed = false;
        }

        _ensureTooltipEl();
        _enabled = _readInitialEnabledState();
        _persistEnabledState(_enabled);
        if (!_enabled) hide();

        document.addEventListener("keydown", _onGlobalKeyDown, true);
        document.addEventListener("pointerdown", () => {
            if (_currentAnchor) hide();
        }, true);
    }

    if (typeof window !== "undefined") {
        window.ITEM_TOOLTIP_LABELS = ITEM_TOOLTIP_LABELS;
        window.ItemTooltip = {
            init,
            bindItemElement,
            showForContext,
            hide,
            setEnabled,
            toggleEnabled,
            isEnabled
        };
    }
})();
