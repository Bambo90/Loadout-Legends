// ================================
// DRAG & DROP ENGINE (Dragdropengine.js)
// Drop handling + placement validation
// ================================

function renderAllActiveGrids() {
    try { queueRenderWorkshopGrids(); } catch (err) { renderWorkshopGrids(); }
    const tabCharacter = document.getElementById('tab-character');
    if (tabCharacter && tabCharacter.classList.contains('active')) {
        if (typeof renderCharacterHubGrid === 'function') {
            renderCharacterHubGrid();
        }
    }
}

function postDropRender() {
    renderAllActiveGrids();
}

function _hasBodyOverlapWithGrid(bodyShape, originX, originY, cols, maxRows) {
    const bodyW = bodyShape[0] ? bodyShape[0].length : 1;
    const bodyH = bodyShape.length;
    for (let r = 0; r < bodyH; r++) {
        for (let c = 0; c < bodyW; c++) {
            if (!bodyShape[r][c]) continue;
            const x = originX + c;
            const y = originY + r;
            if (x >= 0 && x < cols && y >= 0 && y < maxRows) return true;
        }
    }
    return false;
}

function _findNearestValidOriginIndex(grid, desiredOriginX, desiredOriginY, bodyShape, cols, maxRows, radius) {
    for (let d = 0; d <= radius; d++) {
        for (let dx = -radius; dx <= radius; dx++) {
            for (let dy = -radius; dy <= radius; dy++) {
                if (Math.abs(dx) > d && Math.abs(dy) > d) continue;
                const ox = desiredOriginX + dx;
                const oy = desiredOriginY + dy;
                if (!_hasBodyOverlapWithGrid(bodyShape, ox, oy, cols, maxRows)) continue;
                const oidx = (oy * cols) + ox;
                if (canPlaceItem(grid, oidx, bodyShape, cols, maxRows)) {
                    return oidx;
                }
            }
        }
    }
    return null;
}

function resolveDropPlacementPlan(config) {
    const draggedItem = config && config.draggedItem;
    const location = config && config.location;
    const targetIndex = Number(config && config.targetIndex);
    const cols = Number(config && config.cols);
    const maxRows = Number(config && config.maxRows);
    const grid = config && config.grid;
    const searchRadius = Number.isFinite(Number(config && config.searchRadius))
        ? Math.max(0, Math.floor(Number(config.searchRadius)))
        : 2;
    const allowRadiusSearch = config && config.allowRadiusSearch !== false;

    if (!draggedItem || !grid || !Number.isFinite(targetIndex) || !Number.isFinite(cols) || cols <= 0 || !Number.isFinite(maxRows) || maxRows <= 0) {
        return { ok: false, reason: 'invalid_input', location, targetIndex, cols, maxRows };
    }

    const bodyShape = draggedItem.previewShape;
    if (!Array.isArray(bodyShape) || bodyShape.length === 0) {
        return { ok: false, reason: 'missing_body_shape', location, targetIndex, cols, maxRows };
    }

    const bodyW = bodyShape[0] ? bodyShape[0].length : 1;
    const bodyH = bodyShape.length;
    const hoverX = targetIndex % cols;
    const hoverY = Math.floor(targetIndex / cols);
    const offsetX = Number.isFinite(Number(draggedItem.offsetX)) ? Math.floor(Number(draggedItem.offsetX)) : 0;
    const offsetY = Number.isFinite(Number(draggedItem.offsetY)) ? Math.floor(Number(draggedItem.offsetY)) : 0;
    const originX = hoverX - offsetX;
    const originY = hoverY - offsetY;
    const originIndex = (originY * cols) + originX;
    const hasOverlap = _hasBodyOverlapWithGrid(bodyShape, originX, originY, cols, maxRows);

    if (!hasOverlap) {
        return {
            ok: true,
            reason: 'no_overlap',
            location,
            targetIndex,
            cols,
            maxRows,
            bodyShape,
            bodyW,
            bodyH,
            offsetX,
            offsetY,
            originX,
            originY,
            originIndex,
            chosenIndex: originIndex,
            canPlaceDirect: false,
            canPlace: false,
            hasOverlap,
            usedRadiusSearch: false,
            searchRadius
        };
    }

    const canPlaceDirect = canPlaceItem(grid, originIndex, bodyShape, cols, maxRows);
    if (canPlaceDirect) {
        return {
            ok: true,
            reason: 'direct_valid',
            location,
            targetIndex,
            cols,
            maxRows,
            bodyShape,
            bodyW,
            bodyH,
            offsetX,
            offsetY,
            originX,
            originY,
            originIndex,
            chosenIndex: originIndex,
            canPlaceDirect: true,
            canPlace: true,
            hasOverlap,
            usedRadiusSearch: false,
            searchRadius
        };
    }

    if (!allowRadiusSearch) {
        return {
            ok: true,
            reason: 'direct_invalid_no_search',
            location,
            targetIndex,
            cols,
            maxRows,
            bodyShape,
            bodyW,
            bodyH,
            offsetX,
            offsetY,
            originX,
            originY,
            originIndex,
            chosenIndex: originIndex,
            canPlaceDirect: false,
            canPlace: false,
            hasOverlap,
            usedRadiusSearch: false,
            searchRadius
        };
    }

    const found = _findNearestValidOriginIndex(grid, originX, originY, bodyShape, cols, maxRows, searchRadius);
    return {
        ok: true,
        reason: found !== null ? 'radius_found' : 'radius_not_found',
        location,
        targetIndex,
        cols,
        maxRows,
        bodyShape,
        bodyW,
        bodyH,
        offsetX,
        offsetY,
        originX,
        originY,
        originIndex,
        chosenIndex: found !== null ? found : originIndex,
        canPlaceDirect: false,
        canPlace: found !== null,
        hasOverlap,
        usedRadiusSearch: true,
        searchRadius
    };
}

function _matchesStoredPreviewPlan(draggedItem, location, cols) {
    if (!draggedItem || !draggedItem.lastPreviewPlan) return false;
    const entry = draggedItem.lastPreviewPlan;
    if (entry.location !== location) return false;
    if (entry.cols !== cols) return false;
    if (entry.rotationIndex !== draggedItem.rotationIndex) return false;
    if (entry.offsetX !== draggedItem.offsetX || entry.offsetY !== draggedItem.offsetY) return false;
    return !!entry.plan;
}

function _restoreDraggedItemFromSource() {
    if (!DragSystem || typeof DragSystem.restoreDraggedItemToSource !== 'function') return false;
    return !!DragSystem.restoreDraggedItemToSource();
}

function handleDropInSlot(e) {
    e.preventDefault();
    const draggedItem = DragSystem.getDraggedItem();
    if (!draggedItem) return;

    const slot = e.currentTarget;
    const location = slot.dataset.location;
    const targetIndex = parseInt(slot.dataset.index, 10);
    const cols = parseInt(slot.dataset.cols, 10);
    const maxRows = location === 'bank' ? Math.ceil(BANK_SLOTS / cols) : GRID_ROWS;
    const grid = gameData[location];
    const debugPlacement = (typeof window !== 'undefined' && window.DEBUG_PLACEMENT === true);

    if (!grid) {
        if (debugPlacement) console.debug('❌ Drop failed: missing target grid', { location });
        _restoreDraggedItemFromSource();
        postDropRender();
        return;
    }

    const searchRadius = location !== draggedItem.fromLocation ? 4 : 2;
    const plan = _matchesStoredPreviewPlan(draggedItem, location, cols)
        ? draggedItem.lastPreviewPlan.plan
        : resolveDropPlacementPlan({
            draggedItem,
            location,
            targetIndex,
            cols,
            maxRows,
            grid,
            searchRadius,
            allowRadiusSearch: true
        });

    if (!plan || !plan.ok) {
        if (debugPlacement) console.debug('❌ Drop failed: invalid plan', { location, targetIndex, cols });
        _restoreDraggedItemFromSource();
        postDropRender();
        return;
    }

    if (!plan.hasOverlap || !plan.canPlace) {
        if (debugPlacement) console.debug('❌ Drop rejected by plan', {
            reason: plan.reason,
            hasOverlap: plan.hasOverlap,
            canPlace: plan.canPlace
        });
        _restoreDraggedItemFromSource();
        postDropRender();
        return;
    }

    const tx = tryPlaceItemTransactional(grid, draggedItem.item, draggedItem.previewShape, plan.chosenIndex, cols, {
        instanceId: draggedItem.instanceId,
        maxRows,
        rotatedAura: draggedItem.rotatedAura || null,
        rotationIndex: draggedItem.rotationIndex
    });

    if (!tx.ok) {
        if (debugPlacement) console.debug('❌ Drop commit failed', tx);
        _restoreDraggedItemFromSource();
        postDropRender();
        return;
    }

    DragSystem.clearDraggedItem();
    postDropRender();
    if (typeof saveGame === 'function') {
        saveGame();
    }
}

if (typeof window !== 'undefined') {
    window.resolveDropPlacementPlan = resolveDropPlacementPlan;
}
