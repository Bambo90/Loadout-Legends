// ================================
// GRID ENGINE (Gridengine.js)
// Verwalten der Slot-Belegung
// ================================

// Global instance ID counter for unique item instances.
let _instanceIdCounter = 1000;

function generateInstanceId() {
    return `inst_${++_instanceIdCounter}`;
}

function _canonicalRotationIndex(value) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return 0;
    const truncated = Math.trunc(numeric);
    return ((truncated % 4) + 4) % 4;
}

function _resolveGridMaxRows(grid, cols, maxRowsOverride) {
    if (typeof maxRowsOverride !== 'undefined' && maxRowsOverride !== null) {
        const numeric = Number(maxRowsOverride);
        return Number.isFinite(numeric) && numeric > 0 ? Math.floor(numeric) : 0;
    }
    try {
        if (grid === gameData.bank) {
            return Math.ceil(BANK_SLOTS / cols);
        }
    } catch (err) {}
    return GRID_ROWS;
}

function _cloneShape(shape) {
    if (!Array.isArray(shape)) return [];
    return shape.map((row) => Array.isArray(row) ? row.map((cell) => (cell ? 1 : 0)) : []);
}

function _computeBodyPlacementCells(originIndex, shape, cols, maxRows) {
    const resolvedCols = Number(cols);
    const resolvedRows = Number(maxRows);
    if (!Array.isArray(shape) || shape.length === 0 || !Number.isFinite(resolvedCols) || resolvedCols <= 0 || !Number.isFinite(resolvedRows) || resolvedRows <= 0) {
        return { ok: false, reason: 'invalid_input', cells: [], originX: 0, originY: 0 };
    }

    const originX = originIndex % resolvedCols;
    const originY = Math.floor(originIndex / resolvedCols);
    const cells = [];
    let hasBody = false;

    for (let r = 0; r < shape.length; r++) {
        const row = Array.isArray(shape[r]) ? shape[r] : [];
        for (let c = 0; c < row.length; c++) {
            if (!row[c]) continue;
            hasBody = true;
            const x = originX + c;
            const y = originY + r;
            if (x < 0 || x >= resolvedCols || y < 0 || y >= resolvedRows) {
                return {
                    ok: false,
                    reason: 'out_of_bounds',
                    cells: [],
                    originX,
                    originY,
                    failedCell: { r, c, x, y }
                };
            }
            cells.push({
                idx: (y * resolvedCols) + x,
                x,
                y,
                r,
                c
            });
        }
    }

    if (!hasBody) {
        return { ok: false, reason: 'empty_shape', cells: [], originX, originY };
    }
    return { ok: true, reason: 'ok', cells, originX, originY };
}

function clearItemFromGrid(grid, idOrInstance) {
    if (!grid) return 0;
    const isInstance = typeof idOrInstance === 'string' && idOrInstance.startsWith('inst_');
    let removed = 0;
    Object.keys(grid).forEach((k) => {
        const cell = grid[k];
        if (!cell) return;
        if (isInstance && cell.instanceId === idOrInstance) {
            delete grid[k];
            removed++;
            return;
        }
        if (!isInstance && cell.itemId === idOrInstance) {
            delete grid[k];
            removed++;
        }
    });
    return removed;
}

function syncInstanceIdCounterFromGrids(grids) {
    let maxId = _instanceIdCounter;
    grids.forEach((grid) => {
        if (!grid) return;
        Object.keys(grid).forEach((k) => {
            const cell = grid[k];
            if (!cell || !cell.instanceId) return;
            const m = String(cell.instanceId).match(/inst_(\d+)/);
            if (m) {
                const num = parseInt(m[1], 10);
                if (!isNaN(num) && num > maxId) maxId = num;
            }
        });
    });
    _instanceIdCounter = maxId;
}

function canPlaceItem(grid, originIndex, shape, cols, maxRows) {
    const resolvedRows = _resolveGridMaxRows(grid, cols, maxRows);
    const placement = _computeBodyPlacementCells(originIndex, shape, cols, resolvedRows);
    if (!placement.ok) return false;
    for (let i = 0; i < placement.cells.length; i++) {
        const idx = placement.cells[i].idx;
        if (grid[idx]) return false;
    }
    return true;
}

function tryPlaceItemTransactional(grid, item, shape, originIndex, cols, opts) {
    const debugPlacement = (typeof window !== 'undefined' && window.DEBUG_PLACEMENT === true);
    if (!grid || !item || !item.id) {
        return { ok: false, reason: 'invalid_grid_or_item' };
    }

    const options = (opts && typeof opts === 'object') ? opts : {};
    const maxRows = _resolveGridMaxRows(grid, cols, options.maxRows);
    const instanceId = options.instanceId || generateInstanceId();
    const placement = _computeBodyPlacementCells(originIndex, shape, cols, maxRows);
    if (!placement.ok) {
        if (debugPlacement) console.debug('❌ TX_PLACE rejected before write', { reason: placement.reason, itemId: item.id, originIndex, cols, maxRows });
        return {
            ok: false,
            reason: placement.reason,
            itemId: item.id,
            instanceId,
            originIndex,
            cols,
            maxRows
        };
    }

    for (let i = 0; i < placement.cells.length; i++) {
        const idx = placement.cells[i].idx;
        const existing = grid[idx];
        if (!existing) continue;
        if (existing.instanceId === instanceId) continue;
        if (debugPlacement) console.debug('❌ TX_PLACE blocked by occupancy', { idx, by: existing.instanceId || existing.itemId, wantedInstance: instanceId });
        return {
            ok: false,
            reason: 'occupied',
            blockingIndex: idx,
            blockingCell: existing,
            itemId: item.id,
            instanceId,
            originIndex,
            cols,
            maxRows
        };
    }

    const shapeCopy = _cloneShape(shape);
    if (shapeCopy.length === 0) {
        return { ok: false, reason: 'empty_shape' };
    }

    clearItemFromGrid(grid, instanceId);

    const rootIdx = placement.cells[0].idx;
    for (let i = 0; i < placement.cells.length; i++) {
        const idx = placement.cells[i].idx;
        const isRoot = idx === rootIdx;
        grid[idx] = {
            itemId: item.id,
            instanceId,
            shape: shapeCopy,
            root: isRoot
        };
        if (isRoot && options.rotatedAura) {
            grid[idx].rotatedAura = _cloneShape(options.rotatedAura);
        }
        if (isRoot) {
            grid[idx].rotationIndex = _canonicalRotationIndex(options.rotationIndex);
        }
    }

    if (debugPlacement) {
        console.debug('✅ TX_PLACE committed', {
            itemId: item.id,
            instanceId,
            originIndex,
            cols,
            maxRows,
            cells: placement.cells.map((c) => c.idx),
            rootIdx
        });
    }
    return {
        ok: true,
        reason: 'placed',
        itemId: item.id,
        instanceId,
        originIndex,
        cols,
        maxRows,
        placedIndices: placement.cells.map((cell) => cell.idx),
        rootIndex: rootIdx
    };
}

function placeItemIntoGrid(grid, originIndex, item, shape, cols, instanceId, maxRowsOverride, rotatedAura, rotationIndex) {
    const result = tryPlaceItemTransactional(grid, item, shape, originIndex, cols, {
        instanceId,
        maxRows: maxRowsOverride,
        rotatedAura,
        rotationIndex
    });
    return result.ok ? result.instanceId : null;
}

function scanGridIntegrity(grid) {
    const report = {
        totalCells: 0,
        invalidCells: 0,
        missingRootCells: 0,
        missingInstanceCells: 0,
        multiRootInstances: 0,
        extraRootCells: 0,
        orphanKeys: [],
        missingRootKeys: [],
        missingInstanceKeys: [],
        extraRootKeys: []
    };
    if (!grid || typeof grid !== 'object') return report;

    const byInstance = new Map();
    Object.keys(grid).forEach((slotKey) => {
        report.totalCells++;
        const cell = grid[slotKey];
        if (!cell || typeof cell !== 'object' || !cell.itemId) {
            report.invalidCells++;
            report.orphanKeys.push(slotKey);
            return;
        }
        if (!cell.instanceId) {
            report.missingInstanceCells++;
            report.missingInstanceKeys.push(slotKey);
            return;
        }
        const entry = byInstance.get(cell.instanceId) || { keys: [], roots: [] };
        entry.keys.push(slotKey);
        if (cell.root) entry.roots.push(slotKey);
        byInstance.set(cell.instanceId, entry);
    });

    byInstance.forEach((entry) => {
        if (entry.roots.length === 0) {
            report.missingRootCells += entry.keys.length;
            report.missingRootKeys.push(...entry.keys);
        }
        if (entry.roots.length > 1) {
            report.multiRootInstances++;
            const extras = entry.roots.slice(1);
            report.extraRootCells += extras.length;
            report.extraRootKeys.push(...extras);
        }
    });

    return report;
}

function repairGridIntegrity(grid, opts) {
    const options = (opts && typeof opts === 'object') ? opts : {};
    const debug = options.debug === true;
    const report = scanGridIntegrity(grid);
    const clearedKeys = new Set();

    report.orphanKeys.forEach((key) => clearedKeys.add(key));
    report.missingInstanceKeys.forEach((key) => clearedKeys.add(key));
    report.missingRootKeys.forEach((key) => clearedKeys.add(key));

    clearedKeys.forEach((key) => {
        delete grid[key];
    });

    report.extraRootKeys.forEach((key) => {
        const cell = grid[key];
        if (cell && typeof cell === 'object') {
            cell.root = false;
        }
    });

    const summary = {
        ...report,
        clearedCells: clearedKeys.size
    };
    if (debug) console.debug('GRID_INTEGRITY_SWEEP', summary);
    return summary;
}

function runGridIntegritySweep(data, opts) {
    const options = (opts && typeof opts === 'object') ? opts : {};
    if (!data || typeof data !== 'object') return { scannedGrids: 0, clearedCells: 0, reports: [] };

    const reports = [];
    const pushReport = (grid, label) => {
        if (!grid || typeof grid !== 'object') return;
        const summary = repairGridIntegrity(grid, options);
        reports.push({ label, ...summary });
    };

    ['bank', 'farmGrid', 'pveGrid', 'pvpGrid', 'sortGrid'].forEach((key) => pushReport(data[key], key));
    if (Array.isArray(data.bankPages)) {
        data.bankPages.forEach((grid, idx) => pushReport(grid, `bankPages:${idx}`));
    }
    if (data.battlefield && typeof data.battlefield === 'object' && data.battlefield.pages && typeof data.battlefield.pages === 'object') {
        Object.keys(data.battlefield.pages).forEach((pageKey) => pushReport(data.battlefield.pages[pageKey], `battlefield:${pageKey}`));
    }

    const totalCleared = reports.reduce((sum, report) => sum + (report.clearedCells || 0), 0);
    if (options.debug === true && typeof console !== 'undefined' && typeof console.debug === 'function') {
        console.debug('GRID_INTEGRITY_SWEEP_TOTAL', { scannedGrids: reports.length, clearedCells: totalCleared });
    }
    return {
        scannedGrids: reports.length,
        clearedCells: totalCleared,
        reports
    };
}

if (typeof window !== 'undefined') {
    window.tryPlaceItemTransactional = tryPlaceItemTransactional;
    window.scanGridIntegrity = scanGridIntegrity;
    window.repairGridIntegrity = repairGridIntegrity;
    window.runGridIntegritySweep = runGridIntegritySweep;
}
