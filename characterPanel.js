// ==========================================
// CHARACTER PANEL
// UI-only module for compact and full character stat views.
// Consumes computed stats payloads, never mutates game state.
// ==========================================

(function () {
    const _panels = new Map();

    function _num(value, fallback) {
        return (typeof value === "number" && Number.isFinite(value)) ? value : fallback;
    }

    function _fmtNumber(value, digits) {
        const safe = _num(value, 0);
        const useDigits = Number.isInteger(digits) ? digits : 0;
        return safe.toLocaleString("de-DE", {
            minimumFractionDigits: useDigits,
            maximumFractionDigits: useDigits
        });
    }

    function _fmtPercent(value, digits) {
        return _fmtNumber((_num(value, 0) * 100), Number.isInteger(digits) ? digits : 1) + "%";
    }

    function _fmtDamageBucket(bucket) {
        const min = _fmtNumber(_num(bucket && bucket.min, 0), 2);
        const max = _fmtNumber(_num(bucket && bucket.max, 0), 2);
        return min + " - " + max;
    }

    function _toObjectRows(obj, valueFormatter) {
        if (!obj || typeof obj !== "object") return "";
        const keys = Object.keys(obj);
        if (keys.length === 0) return "";

        return keys
            .sort((a, b) => String(a).localeCompare(String(b)))
            .map((key) => {
                const value = valueFormatter ? valueFormatter(obj[key], key) : obj[key];
                return (
                    '<div class="cp-row">' +
                    '<span class="cp-key">' + String(key).toUpperCase() + "</span>" +
                    '<span class="cp-val">' + String(value) + "</span>" +
                    "</div>"
                );
            })
            .join("");
    }

    function _renderPanelContent(panelEl, payload, options) {
        const mode = options.mode === "full" ? "full" : "compact";
        const title = options.title || "Charakter";

        if (!payload || !payload.base || !payload.derived) {
            panelEl.innerHTML =
                '<div class="character-panel-inner character-panel-inner--' + mode + '">' +
                '<div class="cp-header"><h3>' + title + '</h3><span class="cp-subtle">Keine Daten</span></div>' +
                "</div>";
            return;
        }

        const base = payload.base;
        const derived = payload.derived;
        const level = Math.max(1, Math.floor(_num(base.level, 1)));
        const xp = Math.max(0, _num(base.xp, 0));
        const xpToNext = Math.max(1, _num(derived.xpToNextLevel, 1));
        const xpProgress = Math.max(0, Math.min(100, (xp / xpToNext) * 100));

        const life = _fmtNumber(_num(derived.life, 0), 0);
        const mana = _fmtNumber(_num(derived.mana, 0), 0);
        const stamina = _fmtNumber(_num(derived.stamina, 0), 0);
        const dmgAvg = _fmtNumber(_num(derived.damageAverage, 0), 2);
        const atkSpeed = _fmtNumber(_num(derived.attackSpeed, 1), 2);
        const crit = _fmtPercent(_num(derived.critChance, 0), 2);
        const weightCurrent = _fmtNumber(_num(derived.currentWeight, 0), 2);
        const weightLimit = _fmtNumber(_num(derived.weightLimit, 0), 2);

        const damageRows = _toObjectRows(derived.finalDamage, (bucket) => _fmtDamageBucket(bucket));
        const defenseRows = _toObjectRows(derived.finalArmor, (value) => _fmtNumber(_num(value, 0), 2));
        const attributeRows = _toObjectRows(base.baseAttributes, (value) => _fmtNumber(_num(value, 0), 0));
        const weightRows =
            '<div class="cp-row"><span class="cp-key">GEWICHT</span><span class="cp-val">' + weightCurrent + " / " + weightLimit + "</span></div>" +
            '<div class="cp-row"><span class="cp-key">HARD CAP</span><span class="cp-val">' + (derived.hardCapExceeded ? "Aktiv" : "OK") + "</span></div>" +
            '<div class="cp-row"><span class="cp-key">STAMINA-KOSTEN</span><span class="cp-val">' + _fmtNumber(_num(derived.staminaCostMultiplier, 1), 2) + "x</span></div>";

        panelEl.innerHTML =
            '<div class="character-panel-inner character-panel-inner--' + mode + '">' +
                '<div class="cp-header">' +
                    "<h3>" + title + "</h3>" +
                    '<span class="cp-subtle">Setup: ' + String(payload.gridKey || "farmGrid").replace("Grid", "").toUpperCase() + "</span>" +
                "</div>" +
                '<div class="cp-compact">' +
                    '<div class="cp-kpi"><span class="cp-kpi-label">Level</span><span class="cp-kpi-value">' + _fmtNumber(level, 0) + "</span></div>" +
                    '<div class="cp-kpi cp-kpi--wide">' +
                        '<span class="cp-kpi-label">XP ' + _fmtNumber(xp, 0) + " / " + _fmtNumber(xpToNext, 0) + "</span>" +
                        '<div class="cp-progress"><div class="cp-progress-fill" style="width:' + xpProgress.toFixed(2) + '%"></div></div>' +
                    "</div>" +
                    '<div class="cp-kpi"><span class="cp-kpi-label">Life</span><span class="cp-kpi-value">' + life + "</span></div>" +
                    '<div class="cp-kpi"><span class="cp-kpi-label">Mana</span><span class="cp-kpi-value">' + mana + "</span></div>" +
                    '<div class="cp-kpi"><span class="cp-kpi-label">Stamina</span><span class="cp-kpi-value">' + stamina + "</span></div>" +
                    '<div class="cp-kpi"><span class="cp-kpi-label">Avg DMG</span><span class="cp-kpi-value">' + dmgAvg + "</span></div>" +
                    '<div class="cp-kpi"><span class="cp-kpi-label">Atk Speed</span><span class="cp-kpi-value">' + atkSpeed + "</span></div>" +
                    '<div class="cp-kpi"><span class="cp-kpi-label">Crit</span><span class="cp-kpi-value">' + crit + "</span></div>" +
                    '<div class="cp-kpi cp-kpi--wide"><span class="cp-kpi-label">Weight</span><span class="cp-kpi-value">' + weightCurrent + " / " + weightLimit + "</span></div>" +
                "</div>" +
                '<div class="cp-breakdown">' +
                    '<details class="cp-details"><summary>Damage</summary><div class="cp-details-body">' + (damageRows || '<div class="cp-empty">Keine Daten</div>') + "</div></details>" +
                    '<details class="cp-details"><summary>Defense</summary><div class="cp-details-body">' + (defenseRows || '<div class="cp-empty">Keine Daten</div>') + "</div></details>" +
                    '<details class="cp-details"><summary>Attributes</summary><div class="cp-details-body">' + (attributeRows || '<div class="cp-empty">Keine Daten</div>') + "</div></details>" +
                    '<details class="cp-details"><summary>Weight</summary><div class="cp-details-body">' + weightRows + "</div></details>" +
                "</div>" +
            "</div>";
    }

    function _resolvePayload(record) {
        if (!record || !record.options) return null;
        const options = record.options;
        const gridKey = (typeof options.getGridKey === "function")
            ? options.getGridKey()
            : (options.gridKey || "farmGrid");

        if (typeof options.getPayload === "function") {
            const payload = options.getPayload({ gridKey, panelId: record.id });
            if (payload && !payload.gridKey) payload.gridKey = gridKey;
            return payload || null;
        }
        return null;
    }

    function mountPanel(hostOrSelector, options) {
        const host = (typeof hostOrSelector === "string")
            ? document.querySelector(hostOrSelector)
            : hostOrSelector;
        if (!host) return null;

        const opts = options && typeof options === "object" ? options : {};
        const id = opts.panelId || ("panel_" + String(Date.now()) + "_" + String(Math.floor(Math.random() * 10000)));

        if (_panels.has(id)) {
            unmountPanel(id);
        }

        host.innerHTML = "";
        const panelEl = document.createElement("section");
        panelEl.className = "character-panel character-panel--" + (opts.mode === "full" ? "full" : "compact");
        host.appendChild(panelEl);

        const record = { id, host, panelEl, options: opts };
        _panels.set(id, record);

        const payload = _resolvePayload(record);
        _renderPanelContent(panelEl, payload, opts);
        return id;
    }

    function unmountPanel(panelId) {
        if (!_panels.has(panelId)) return;
        const record = _panels.get(panelId);
        if (record && record.panelEl && record.panelEl.parentNode) {
            record.panelEl.parentNode.removeChild(record.panelEl);
        }
        _panels.delete(panelId);
    }

    function refreshPanel(panelId) {
        if (!_panels.has(panelId)) return;
        const record = _panels.get(panelId);
        const payload = _resolvePayload(record);
        _renderPanelContent(record.panelEl, payload, record.options);
    }

    function refreshAll() {
        _panels.forEach((record, panelId) => {
            refreshPanel(panelId);
        });
    }

    if (typeof window !== "undefined") {
        window.addEventListener("character:stats-updated", () => {
            refreshAll();
        });
    }

    const api = {
        mountPanel,
        unmountPanel,
        refreshPanel,
        refreshAll
    };

    if (typeof window !== "undefined") {
        window.CharacterPanel = api;
    }
})();
