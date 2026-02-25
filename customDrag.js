// customDrag.js
// Pointer-based drag & drop replacement to avoid native drag inconsistencies.
// Includes rotation logic for items during drag.
// Fully encapsulated drag system with explicit API (window.DragSystem).

// ===== PRIVATE STATE =====
let draggedItem = null; // Private drag state - only accessible via DragSystem API

let _customFollowEl = null;
let _customPointerMove = null;
let _customPointerUp = null;
let _customPointerCancel = null;
let _windowBlurHandler = null;
let _rotationKeyHandler = null;
let _rotationWheelHandler = null;
let _rotationCount = 0;
let _lastKeyRotate = 0;
let _lastWheelRotate = 0;
let _dragCursorRootEl = null;
let _dragCursorRootResolved = false;

// ===== PERFORMANCE MONITORING =====
let _perfFrameTimes = [];
let _perfLastFrameTime = 0;
let _perfEnabled = false; // Set to true to enable perf logging

function _readSpriteOffset(value) {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : 0;
}

function getCanonicalRot(value) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return 0;
    const truncated = Math.trunc(numeric);
    return ((truncated % 4) + 4) % 4;
}

function _normalizeRotationIndex(value) {
    return getCanonicalRot(value);
}

function _resolveSpriteMetaItemForDrag(itemLike) {
    const defId = itemLike && (itemLike.baseId || itemLike.id);
    const fromDef = (typeof getItemDefById === 'function')
        ? getItemDefById(defId)
        : (typeof getItemById === 'function' ? getItemById(defId) : null);
    if (fromDef && typeof fromDef === 'object') {
        return { item: fromDef, source: 'def' };
    }
    if (itemLike && typeof itemLike === 'object') {
        return { item: itemLike, source: 'instance' };
    }
    return { item: null, source: 'fallback' };
}

function _readOffsetPair(value) {
    if (!value || typeof value !== 'object') return { x: 0, y: 0 };
    const x = Number(value.x);
    const y = Number(value.y);
    return {
        x: Number.isFinite(x) ? x : 0,
        y: Number.isFinite(y) ? y : 0
    };
}

function _isFinitePoint(point) {
    return !!(point && Number.isFinite(Number(point.x)) && Number.isFinite(Number(point.y)));
}

function _parseTransformOriginPx(transformOrigin) {
    if (typeof transformOrigin !== 'string') return null;
    const match = transformOrigin.match(/(-?\d+(?:\.\d+)?)px\s+(-?\d+(?:\.\d+)?)px/i);
    if (!match) return null;
    const x = Number(match[1]);
    const y = Number(match[2]);
    if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
    return { x, y };
}

function _parseTranslatePx(transformValue) {
    if (typeof transformValue !== 'string') return null;
    const match = transformValue.match(/translate\(\s*(-?\d+(?:\.\d+)?)px\s*,\s*(-?\d+(?:\.\d+)?)px\s*\)/i);
    if (!match) return null;
    const x = Number(match[1]);
    const y = Number(match[2]);
    if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
    return { x, y };
}

function _computeAnchorLocalPxFromAnchoredStyle(anchoredStyle, spriteLayerLayout) {
    if (!anchoredStyle || !spriteLayerLayout) return null;
    const origin = _parseTransformOriginPx(anchoredStyle.transformOrigin);
    if (!origin) return null;

    const translateFromStyle = _isFinitePoint(anchoredStyle.translatePx)
        ? { x: Number(anchoredStyle.translatePx.x), y: Number(anchoredStyle.translatePx.y) }
        : _parseTranslatePx(anchoredStyle.transform);
    if (!translateFromStyle) return null;

    const layerTranslate = _isFinitePoint(spriteLayerLayout.layerTranslatePx)
        ? { x: Number(spriteLayerLayout.layerTranslatePx.x), y: Number(spriteLayerLayout.layerTranslatePx.y) }
        : { x: 0, y: 0 };

    return {
        x: layerTranslate.x + translateFromStyle.x + origin.x,
        y: layerTranslate.y + translateFromStyle.y + origin.y
    };
}

function _computeBodyBoundsFromGrid(grid) {
    if (!Array.isArray(grid) || grid.length === 0) return null;
    let minR = Infinity;
    let minC = Infinity;
    let maxR = -1;
    let maxC = -1;
    for (let r = 0; r < grid.length; r++) {
        const row = grid[r];
        if (!Array.isArray(row)) continue;
        for (let c = 0; c < row.length; c++) {
            const cell = row[c];
            if (typeof cell !== 'string') continue;
            if (!(cell === 'B' || cell === 'AB' || cell.includes('B'))) continue;
            if (r < minR) minR = r;
            if (c < minC) minC = c;
            if (r > maxR) maxR = r;
            if (c > maxC) maxC = c;
        }
    }
    if (maxR < 0 || maxC < 0) return null;
    return { minR, minC, maxR, maxC, hasBody: true };
}

function _computeBodyBoundsFromBodyMatrix(bodyMatrix) {
    if (!Array.isArray(bodyMatrix) || bodyMatrix.length === 0) return null;
    let minR = Infinity;
    let minC = Infinity;
    let maxR = -1;
    let maxC = -1;
    for (let r = 0; r < bodyMatrix.length; r++) {
        const row = bodyMatrix[r];
        if (!Array.isArray(row)) continue;
        for (let c = 0; c < row.length; c++) {
            if (!row[c]) continue;
            if (r < minR) minR = r;
            if (c < minC) minC = c;
            if (r > maxR) maxR = r;
            if (c > maxC) maxC = c;
        }
    }
    if (maxR < 0 || maxC < 0) return null;
    return { minR, minC, maxR, maxC, hasBody: true };
}

function _resolveBodyBoundsForDrag(itemLike, rotationIndex) {
    const rot = getCanonicalRot(rotationIndex);
    const rotGrid = (typeof getItemRotationGrid === 'function') ? getItemRotationGrid(itemLike, rot) : null;
    const fromGrid = _computeBodyBoundsFromGrid(rotGrid);
    if (fromGrid) return fromGrid;

    if (typeof getItemBodyBounds === 'function') {
        const bounds = getItemBodyBounds(itemLike, rot);
        if (bounds && Number.isFinite(Number(bounds.minR)) && Number.isFinite(Number(bounds.minC)) && Number.isFinite(Number(bounds.maxR)) && Number.isFinite(Number(bounds.maxC))) {
            return {
                minR: Number(bounds.minR),
                minC: Number(bounds.minC),
                maxR: Number(bounds.maxR),
                maxC: Number(bounds.maxC),
                hasBody: true
            };
        }
    }

    const bodyMatrix = (typeof getItemBodyMatrix === 'function')
        ? getItemBodyMatrix(itemLike, rot)
        : (itemLike && itemLike.body ? itemLike.body : null);
    const fromBody = _computeBodyBoundsFromBodyMatrix(bodyMatrix);
    if (fromBody) return fromBody;

    return { minR: 0, minC: 0, maxR: 0, maxC: 0, hasBody: false };
}

function _computeDefaultAnchorLocalPxFromBodyBounds(bodyBounds, geometry) {
    const safeGeometry = geometry && typeof geometry === 'object' ? geometry : {};
    const stepPx = Number(safeGeometry.stepPx);
    const cellSizePx = Number(safeGeometry.cellSizePx);
    if (!Number.isFinite(stepPx) || stepPx <= 0 || !Number.isFinite(cellSizePx) || cellSizePx <= 0) {
        return { x: 0, y: 0 };
    }

    const bounds = bodyBounds && typeof bodyBounds === 'object' ? bodyBounds : null;
    const minR = bounds ? Number(bounds.minR) : NaN;
    const minC = bounds ? Number(bounds.minC) : NaN;
    const maxR = bounds ? Number(bounds.maxR) : NaN;
    const maxC = bounds ? Number(bounds.maxC) : NaN;
    const hasFiniteBounds = Number.isFinite(minR) && Number.isFinite(minC) && Number.isFinite(maxR) && Number.isFinite(maxC) && maxR >= minR && maxC >= minC;
    if (!hasFiniteBounds) {
        return {
            x: cellSizePx / 2,
            y: cellSizePx / 2
        };
    }

    const centerXCell = (minC + maxC) / 2;
    const centerYCell = (minR + maxR) / 2;
    return {
        x: ((centerXCell - minC) * stepPx) + (cellSizePx / 2),
        y: ((centerYCell - minR) * stepPx) + (cellSizePx / 2)
    };
}

function _computeDefaultAnchorLocalPxFromBodyMatrix(bodyMatrix, geometry) {
    const bounds = _computeBodyBoundsFromBodyMatrix(bodyMatrix);
    return _computeDefaultAnchorLocalPxFromBodyBounds(bounds, geometry);
}

function _debugDragRotateEvent(itemId, rawRot, canonicalRot, rotForBody, rotForSprite, bodyBounds, anchorLocalPx) {
    if (typeof window === 'undefined' || window.DEBUG_DRAG_ROT !== true) return;
    const bounds = bodyBounds && typeof bodyBounds === 'object'
        ? `minR=${Number(bodyBounds.minR)},minC=${Number(bodyBounds.minC)},maxR=${Number(bodyBounds.maxR)},maxC=${Number(bodyBounds.maxC)}`
        : 'minR=0,minC=0,maxR=0,maxC=0';
    const anchor = _isFinitePoint(anchorLocalPx)
        ? `x=${Number(anchorLocalPx.x).toFixed(2)},y=${Number(anchorLocalPx.y).toFixed(2)}`
        : 'x=NaN,y=NaN';
    console.debug(
        `[DRAG_ROT] itemId=${itemId || ''} rawRot=${rawRot} canonicalRot=${canonicalRot} rotForBody=${rotForBody} rotForSprite=${rotForSprite} bodyBounds={${bounds}} anchorLocalPx={${anchor}}`
    );
}

function _debugDragAnchor(phase, rotationIndex, anchorLocalPx, mousePx) {
    if (typeof window === 'undefined' || window.DEBUG_DRAG_ANCHOR !== true) return;
    if (!_isFinitePoint(anchorLocalPx) || !_isFinitePoint(mousePx)) return;
    const ghostTopLeftPx = {
        x: Math.round(mousePx.x - Number(anchorLocalPx.x)),
        y: Math.round(mousePx.y - Number(anchorLocalPx.y))
    };
    console.debug(
        `[DRAG_ANCHOR][${phase}] rotationIndex=${rotationIndex} anchorLocalPx=(${Number(anchorLocalPx.x).toFixed(2)},${Number(anchorLocalPx.y).toFixed(2)}) mousePx=(${Number(mousePx.x).toFixed(2)},${Number(mousePx.y).toFixed(2)}) ghostTopLeftPx=(${ghostTopLeftPx.x},${ghostTopLeftPx.y})`
    );
}

function _ensureDragCursorStyle() {
    if (typeof document === 'undefined') return;
    if (document.getElementById('drag-cursor-style')) return;
    const style = document.createElement('style');
    style.id = 'drag-cursor-style';
    style.textContent = '.is-dragging-item { cursor: none !important; }';
    if (document.head) document.head.appendChild(style);
}

function _resolveDragCursorRoot(sourceElem) {
    if (_dragCursorRootResolved) return _dragCursorRootEl;
    let root = null;
    if (sourceElem && typeof sourceElem.closest === 'function') {
        root = sourceElem.closest('.workshop-content');
    }
    if (!root && typeof document !== 'undefined') {
        root = document.querySelector('.workshop-content')
            || document.getElementById('tab-workshop')
            || null;
    }
    _dragCursorRootEl = root;
    _dragCursorRootResolved = true;
    return _dragCursorRootEl;
}

function setDraggingCursorHidden(isHidden) {
    if (typeof document === 'undefined') return;
    const root = _resolveDragCursorRoot(null);
    if (!root || !root.classList) return;
    _ensureDragCursorStyle();
    if (isHidden) {
        root.classList.add('is-dragging-item');
    } else {
        root.classList.remove('is-dragging-item');
    }
}

function _restoreDragCursor() {
    setDraggingCursorHidden(false);
}

function _cleanupCustomDragArtifacts() {
    if (_customFollowEl && _customFollowEl.parentNode) _customFollowEl.parentNode.removeChild(_customFollowEl);
    _customFollowEl = null;
    if (_customPointerMove) window.removeEventListener('pointermove', _customPointerMove);
    if (_customPointerUp) window.removeEventListener('pointerup', _customPointerUp);
    if (_customPointerCancel) window.removeEventListener('pointercancel', _customPointerCancel);
    if (_windowBlurHandler) window.removeEventListener('blur', _windowBlurHandler);
    if (_rotationKeyHandler) window.removeEventListener('keydown', _rotationKeyHandler);
    if (_rotationWheelHandler) window.removeEventListener('wheel', _rotationWheelHandler);
    _customPointerMove = null;
    _customPointerUp = null;
    _customPointerCancel = null;
    _windowBlurHandler = null;
    _rotationKeyHandler = null;
    _rotationWheelHandler = null;
    _restoreDragCursor();
    if (typeof hideAllAuras === 'function') hideAllAuras();
    if (typeof document !== 'undefined' && document.body) {
        document.body.classList.remove('dragging', 'drop-allowed', 'drop-invalid');
    }
}

function _getGridRowsForLocation(location, cols) {
    if (location === 'bank') {
        return Math.ceil(BANK_SLOTS / cols);
    }
    return GRID_ROWS;
}

function _findNearestValidOriginIndex(grid, desiredOriginX, desiredOriginY, bodyShape, cols, maxRows, radius) {
    for (let d = 0; d <= radius; d++) {
        for (let dx = -radius; dx <= radius; dx++) {
            for (let dy = -radius; dy <= radius; dy++) {
                if (Math.abs(dx) > d && Math.abs(dy) > d) continue;
                const ox = desiredOriginX + dx;
                const oy = desiredOriginY + dy;
                const originIndex = (oy * cols) + ox;
                if (canPlaceItem(grid, originIndex, bodyShape, cols, maxRows)) {
                    return originIndex;
                }
            }
        }
    }
    return null;
}

function _findFirstValidOriginIndex(grid, bodyShape, cols, maxRows) {
    const total = cols * maxRows;
    for (let i = 0; i < total; i++) {
        if (canPlaceItem(grid, i, bodyShape, cols, maxRows)) return i;
    }
    return null;
}

function _findFirstBodyOffset(shape) {
    if (!Array.isArray(shape)) return { r: 0, c: 0 };
    for (let r = 0; r < shape.length; r++) {
        const row = Array.isArray(shape[r]) ? shape[r] : [];
        for (let c = 0; c < row.length; c++) {
            if (row[c]) return { r, c };
        }
    }
    return { r: 0, c: 0 };
}

function _restoreDraggedItemToSourceIfNeeded() {
    if (!draggedItem) return false;

    const snapshot = draggedItem.sourceSnapshot || {
        location: draggedItem.fromLocation,
        index: draggedItem.fromIndex,
        cols: draggedItem.fromCols,
        rotationIndex: draggedItem.rotationIndex,
        rotatedAura: draggedItem.rotatedAura || null
    };
    const sourceLocation = snapshot.location;
    const sourceGrid = sourceLocation ? gameData[sourceLocation] : null;
    if (!sourceGrid) return false;

    const fromCols = snapshot.cols || draggedItem.fromCols || (sourceLocation === 'bank' ? getBankCols() : GRID_SIZE);
    const maxRows = _getGridRowsForLocation(sourceLocation, fromCols);
    const rotationForRestore = getCanonicalRot(snapshot.rotationIndex);
    const restoreShape = (typeof getItemBodyMatrix === 'function')
        ? getItemBodyMatrix(draggedItem.item, rotationForRestore)
        : (draggedItem.item?.body || draggedItem.previewShape);
    const restoreAura = snapshot.rotatedAura || draggedItem.rotatedAura || null;

    let chosenIndex = Number.isFinite(Number(snapshot.index))
        ? Math.floor(Number(snapshot.index))
        : draggedItem.fromIndex;
    let tx = tryPlaceItemTransactional(sourceGrid, draggedItem.item, restoreShape, chosenIndex, fromCols, {
        instanceId: draggedItem.instanceId,
        maxRows,
        rotatedAura: restoreAura,
        rotationIndex: rotationForRestore
    });

    if (!tx.ok) {
        const originX = chosenIndex % fromCols;
        const originY = Math.floor(chosenIndex / fromCols);
        const near = _findNearestValidOriginIndex(sourceGrid, originX, originY, restoreShape, fromCols, maxRows, Math.max(fromCols, maxRows));
        if (near !== null) {
            chosenIndex = near;
            tx = tryPlaceItemTransactional(sourceGrid, draggedItem.item, restoreShape, chosenIndex, fromCols, {
                instanceId: draggedItem.instanceId,
                maxRows,
                rotatedAura: restoreAura,
                rotationIndex: rotationForRestore
            });
        }
    }

    if (!tx.ok) {
        const fallback = _findFirstValidOriginIndex(sourceGrid, restoreShape, fromCols, maxRows);
        if (fallback !== null) {
            chosenIndex = fallback;
            tx = tryPlaceItemTransactional(sourceGrid, draggedItem.item, restoreShape, chosenIndex, fromCols, {
                instanceId: draggedItem.instanceId,
                maxRows,
                rotatedAura: restoreAura,
                rotationIndex: rotationForRestore
            });
        }
    }

    if (!tx.ok) {
        console.error('Failed to restore dragged item to source grid transactionally', {
            instanceId: draggedItem.instanceId,
            location: sourceLocation,
            reason: tx.reason
        });
        return false;
    }

    draggedItem = null;
    renderAllActiveGrids();
    return true;
}

function _debugSpriteAnchorRotationGhost(item, instanceId, gridRotationIndex, rotGridLookupRot, spriteAnchoringRot, metaSource, metaItem) {
    if (typeof window === 'undefined' || window.DEBUG_SPRITE_ANCHOR !== true) return;
    if (!item || item.id !== 'armor_new_2') return;
    const offsetCells = _readOffsetPair(metaItem && metaItem.spriteAnchorOffsetCells);
    const offsetItemPx = _readOffsetPair(metaItem && metaItem.spriteAnchorOffsetItemPx);
    const offsetPx = _readOffsetPair(metaItem && metaItem.spriteAnchorOffsetPx);
    console.debug(
        `[SPRITE_ANCHOR][ghost] instanceId=${instanceId || ''} gridRotationIndex=${gridRotationIndex} rotGridLookupRot=${rotGridLookupRot} spriteAnchoringRot=${spriteAnchoringRot} metaSource=${metaSource} offsetCells=(${offsetCells.x},${offsetCells.y}) offsetItemPx=(${offsetItemPx.x},${offsetItemPx.y}) offsetPx=(${offsetPx.x},${offsetPx.y})`
    );
}

// ===== ROTATION UTILITIES =====
function rotateMatrixCW(matrix) {
    const h = matrix.length;
    const w = matrix[0].length;
    const res = Array.from({ length: w }, () => Array(h).fill(0));
    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            res[x][h - 1 - y] = matrix[y][x];
        }
    }
    return res;
}

function rotateMatrixCCW(matrix) {
    // rotate CCW by applying CW three times (simple and robust)
    let m = matrix;
    m = rotateMatrixCW(m);
    m = rotateMatrixCW(m);
    m = rotateMatrixCW(m);
    return m;
}

function normalizeShape(shape) {
    let minR = Infinity;
    let minC = Infinity;
    let maxR = -1;
    let maxC = -1;
    for (let r = 0; r < shape.length; r++) {
        for (let c = 0; c < shape[0].length; c++) {
            if (!shape[r][c]) continue;
            if (r < minR) minR = r;
            if (c < minC) minC = c;
            if (r > maxR) maxR = r;
            if (c > maxC) maxC = c;
        }
    }
    if (maxR === -1 || maxC === -1) {
        console.error('  ⚠️ EMPTY SHAPE! All cells zero:', JSON.stringify(shape));
        return { shape, minR: 0, minC: 0 };
    }
    const trimmed = [];
    for (let r = minR; r <= maxR; r++) {
        const row = [];
        for (let c = minC; c <= maxC; c++) {
            row.push(shape[r][c] ? 1 : 0);
        }
        trimmed.push(row);
    }
    return { shape: trimmed, minR, minC };
}

function applyRotation(dir) {
    // dir: +1 = CW 90deg, -1 = CCW 90deg
    if (!draggedItem || !draggedItem.item) {
        console.warn('⚠️ applyRotation ABORT: draggedItem is null or no item');
        return;
    }

    _rotationCount++;

    const item = draggedItem.item;
    const currentRotIndex = getCanonicalRot(draggedItem.rotationIndex);
    const rawNextRot = currentRotIndex + (dir === 1 ? 1 : -1);
    const nextRotIndex = getCanonicalRot(rawNextRot);

    const rotationGrid = (typeof getItemRotationGrid === 'function')
        ? getItemRotationGrid(item, nextRotIndex)
        : null;
    if (rotationGrid) {
        draggedItem.rotationIndex = nextRotIndex;
        draggedItem.previewShape = getItemBodyMatrix(item, nextRotIndex).map(r => [...r]);
        const aura = getItemAuraMatrix(item, nextRotIndex);
        draggedItem.rotatedAura = aura ? aura.map(r => [...r]) : null;

        if (typeof window._updateFollowElement === 'function') {
            window._updateFollowElement();
        }
        if (typeof window._updateFollowElementPosition === 'function' && window._dragLastPos) {
            window._updateFollowElementPosition(window._dragLastPos.x, window._dragLastPos.y);
        }
        const debugBodyBounds = _computeBodyBoundsFromBodyMatrix(draggedItem.previewShape) || _resolveBodyBoundsForDrag(item, nextRotIndex);
        _debugDragRotateEvent(
            item.id,
            rawNextRot,
            nextRotIndex,
            nextRotIndex,
            nextRotIndex,
            debugBodyBounds,
            draggedItem.pointerToAnchorOffsetPx
        );
        renderAllActiveGrids();
        return;
    }

    applyRotationCanonical(dir);
}

function applyRotationCanonical(dir) {
    // Legacy rotation code (for items without rotations)
    if (!draggedItem) return;
    
    _rotationCount++;
    const currentRotIndex = getCanonicalRot(draggedItem.rotationIndex);
    const rawNextRot = currentRotIndex + (dir === 1 ? 1 : -1);
    const nextRotIndex = getCanonicalRot(rawNextRot);
    draggedItem.rotationIndex = nextRotIndex;
    
    // capture OLD shape dimensions BEFORE rotation
    const oldShape = draggedItem.previewShape;
    const oldH = oldShape.length;
    const oldW = oldShape[0] ? oldShape[0].length : 1;
    const oldX = draggedItem.offsetX;
    const oldY = draggedItem.offsetY;
    
    if (dir === 1) {
        // CW rotation: offset formula uses OLD dimensions
        const rotated = rotateMatrixCW(oldShape);
        let newOffsetX = (oldH - 1) - oldY;
        let newOffsetY = oldX;
        const norm = normalizeShape(rotated);
        draggedItem.previewShape = norm.shape;
        // adjust offsets after trimming
        newOffsetX -= norm.minC;
        newOffsetY -= norm.minR;
        const newW = norm.shape[0] ? norm.shape[0].length : 1;
        const newH = norm.shape.length;
        // Clamp offsets inside new shape bounds
        draggedItem.offsetX = Math.min(Math.max(0, newOffsetX), newW - 1);
        draggedItem.offsetY = Math.min(Math.max(0, newOffsetY), newH - 1);
        
        // ROTATE AURA as well!
        if (draggedItem.item && draggedItem.item.aura) {
            const oldAura = draggedItem.rotatedAura || draggedItem.item.aura;
            const rotatedAura = rotateMatrixCW(oldAura);
            const normAura = normalizeShape(rotatedAura);
            draggedItem.rotatedAura = normAura.shape;
        }
        
        // Update follow element visuals and position
        if (typeof window._updateFollowElement === 'function') {
            window._updateFollowElement();
        }
        if (typeof window._updateFollowElementPosition === 'function' && window._dragLastPos) {
            window._updateFollowElementPosition(window._dragLastPos.x, window._dragLastPos.y);
        }
    } else if (dir === -1) {
        // CCW rotation: offset formula uses OLD dimensions
        const rotated = rotateMatrixCCW(oldShape);
        let newOffsetX = oldY;
        let newOffsetY = (oldW - 1) - oldX;
        const norm = normalizeShape(rotated);
        draggedItem.previewShape = norm.shape;
        // adjust offsets after trimming
        newOffsetX -= norm.minC;
        newOffsetY -= norm.minR;
        const newW = norm.shape[0] ? norm.shape[0].length : 1;
        const newH = norm.shape.length;
        // Clamp offsets inside new shape bounds
        draggedItem.offsetX = Math.min(Math.max(0, newOffsetX), newW - 1);
        draggedItem.offsetY = Math.min(Math.max(0, newOffsetY), newH - 1);
        
        // ROTATE AURA as well!
        if (draggedItem.item && draggedItem.item.aura) {
            const oldAura = draggedItem.rotatedAura || draggedItem.item.aura;
            const rotatedAura = rotateMatrixCCW(oldAura);
            const normAura = normalizeShape(rotatedAura);
            draggedItem.rotatedAura = normAura.shape;
        }
        
        // Update follow element visuals and position
        if (typeof window._updateFollowElement === 'function') {
            window._updateFollowElement();
        }
        if (typeof window._updateFollowElementPosition === 'function' && window._dragLastPos) {
            window._updateFollowElementPosition(window._dragLastPos.x, window._dragLastPos.y);
        }
    }
    const debugBodyBounds = _computeBodyBoundsFromBodyMatrix(draggedItem.previewShape) || _resolveBodyBoundsForDrag(draggedItem.item, nextRotIndex);
    _debugDragRotateEvent(
        draggedItem && draggedItem.item ? draggedItem.item.id : '',
        rawNextRot,
        nextRotIndex,
        nextRotIndex,
        nextRotIndex,
        debugBodyBounds,
        draggedItem.pointerToAnchorOffsetPx
    );
    // Update grid preview to show new rotation
    renderAllActiveGrids();
}

// ===== GRID UTILITIES =====
function _getGridSlotFromPoint(clientX, clientY) {
    const bankGrid = document.getElementById('bank-grid');
    const activeGrid = document.getElementById('active-setup-grid');
    if (!bankGrid || !activeGrid) return null;

    // Use runtime geometry so hit-testing matches actual grid CSS
    const activeGeo = activeGrid ? getCellGeometry(activeGrid, GRID_SIZE) : { cellW: 72, cellH: 72 };
    const bankColsForGeo = (typeof getBankCols === 'function') ? getBankCols() : 6;
    const bankGeo = bankGrid ? getCellGeometry(bankGrid, bankColsForGeo) : { cellW: 72, cellH: 72 };
    const cellW = activeGeo.cellW;
    const cellH = activeGeo.cellH;

    // Active grid (farm/pve)
    const activeRect = activeGrid.getBoundingClientRect();
    if (clientX >= activeRect.left && clientX <= activeRect.right && clientY >= activeRect.top && clientY <= activeRect.bottom) {
        const relX = clientX - activeRect.left;
        const relY = clientY - activeRect.top;
        const col = Math.floor(relX / cellW);
        const row = Math.floor(relY / cellH);
        const maxRows = GRID_ROWS;
        const clampedCol = Math.max(0, Math.min(GRID_SIZE - 1, col));
        const clampedRow = Math.max(0, Math.min(maxRows - 1, row));
        const index = clampedRow * GRID_SIZE + clampedCol;
        const location = (typeof getWorkshopOverlayGridKey === 'function')
            ? getWorkshopOverlayGridKey(currentWorkshop)
            : (currentWorkshop === 'pve' ? 'pveGrid' : (currentWorkshop === 'pvp' ? 'pvpGrid' : (currentWorkshop === 'sort' ? 'sortGrid' : 'farmGrid')));
        const selector = `.grid-slot[data-location="${location}"][data-index="${index}"]`;
        const el = document.querySelector(selector);
        return el ? { element: el, location, index, cols: GRID_SIZE } : null;
    }

    // Bank grid
    const bankRect = bankGrid.getBoundingClientRect();
    if (clientX >= bankRect.left && clientX <= bankRect.right && clientY >= bankRect.top && clientY <= bankRect.bottom) {
        const relX = clientX - bankRect.left;
        const relY = clientY - bankRect.top;
        const col = Math.floor(relX / bankGeo.cellW);
        const row = Math.floor(relY / bankGeo.cellH);
        // Determine bank columns based on current workshop/storage-mode
        const bankCols = (typeof getBankCols === 'function') ? getBankCols() : ((document.querySelector('.workshop-content') && document.querySelector('.workshop-content').classList.contains('storage-mode')) || currentWorkshop === 'storage' ? 10 : 6);
        const maxRows = Math.ceil(BANK_SLOTS / bankCols);
        const clampedCol = Math.max(0, Math.min(bankCols - 1, col));
        const clampedRow = Math.max(0, Math.min(maxRows - 1, row));
        const index = clampedRow * bankCols + clampedCol;
        const selector = `.grid-slot[data-location="bank"][data-index="${index}"]`;
        const el = document.querySelector(selector);
        return el ? { element: el, location: 'bank', index, cols: bankCols } : null;
    }

    return null;
}

// ===== HELPER: Show/Hide all aura overlays =====
function showAllAuras() {
    document.querySelectorAll('.aura-overlay').forEach(aura => {
        aura.style.opacity = '1';
    });
}
window.showAllAuras = showAllAuras;

function hideAllAuras() {
    if (window.altKeyPressed) return; // Don't hide if Alt is pressed
    document.querySelectorAll('.aura-overlay').forEach(aura => {
        aura.style.opacity = '0';
    });
}
window.hideAllAuras = hideAllAuras;

function startCustomDrag(item, fromLocation, fromIndex, offsetX, offsetY, previewShape, sourceElem, startEvent, instanceId, rotatedAura, rotationIndex) {
    if (!item) return;
    // Ensure any existing drag cleaned
    if (draggedItem) return;

    // CRITICAL: Always use item body, NEVER previewShape (which might contain aura)
    const initialRotationIndex = getCanonicalRot(rotationIndex);
    const baseShape = (typeof getItemBodyMatrix === 'function')
        ? getItemBodyMatrix(item, initialRotationIndex)
        : item.body;
    if (!baseShape) {
        console.error('❌ Item has no body shape!', item.id);
        return;
    }
    const fromCols = (fromLocation === 'bank')
        ? (typeof getBankCols === 'function' ? getBankCols() : 10)
        : GRID_SIZE;
    const initialAura = Array.isArray(rotatedAura)
        ? rotatedAura.map((row) => Array.isArray(row) ? [...row] : [])
        : ((typeof getItemAuraMatrix === 'function')
            ? getItemAuraMatrix(item, initialRotationIndex)
            : null);
    const firstBodyOffset = _findFirstBodyOffset(baseShape);
    const sourceOriginIndex = Number(fromIndex) - (firstBodyOffset.r * fromCols) - firstBodyOffset.c;
    draggedItem = {
        item: item,
        fromLocation: fromLocation,
        fromIndex: fromIndex,
        // store the originating grid column count so restores/drops use same geometry
        fromCols: fromCols,
        offsetX: offsetX || 0,
        offsetY: offsetY || 0,
        previewShape: baseShape.map(r => [...r]),
        rotatedAura: initialAura,
        rotationIndex: initialRotationIndex,
        instanceId: instanceId, // Store instance ID for tracking
        pointerToAnchorOffsetPx: null,
        sourceSnapshot: {
            location: fromLocation,
            index: sourceOriginIndex,
            cols: fromCols,
            rotationIndex: initialRotationIndex,
            rotatedAura: initialAura ? initialAura.map((row) => [...row]) : null
        },
        lastPreviewPlan: null
    };

    // Mark drag state for performance-friendly styling
    document.body.classList.add('dragging');
    _resolveDragCursorRoot(sourceElem);
    setDraggingCursorHidden(true);

    let _dragStartInitialized = false;
    try {
        // Show all auras during drag
        showAllAuras();

        // remove item from grid for preview
        clearItemFromGrid(gameData[fromLocation], instanceId);
        renderAllActiveGrids();

        // create follow element
        _customFollowEl = document.createElement('div');
        _customFollowEl.className = 'item follow-item ' + (item.rarity || 'common');
        _customFollowEl.style.position = 'fixed';
        _customFollowEl.style.pointerEvents = 'none';
        _customFollowEl.style.zIndex = 99999;
        _customFollowEl.style.willChange = 'transform'; // Compositor optimization

        const shape = draggedItem.previewShape || [[1]];
        const rows = shape.length;
        const cols = shape[0] ? shape[0].length : 1;
        const sourceGrid = (sourceElem && sourceElem.closest) ? sourceElem.closest('.inventory-grid') : document.getElementById('bank-grid');
        // Determine columns for source grid (bank vs active)
        let sourceGridCols = GRID_SIZE;
        try {
            if (sourceGrid && sourceGrid.id === 'bank-grid') sourceGridCols = (typeof getBankCols === 'function') ? getBankCols() : 6;
            else sourceGridCols = GRID_SIZE;
        } catch (e) { sourceGridCols = GRID_SIZE; }
        const geo = getCellGeometry(sourceGrid || document.body, sourceGridCols);
        const slotSize = geo.slotSize;
        const gap = geo.gap;
        const cellW2 = geo.cellW;
        const cellH2 = geo.cellH;
        // Compute total follow-element dimensions: rows/cols * slotSize with gaps between
        const followElWidth = cols * slotSize + (cols > 1 ? (cols - 1) * gap : 0);
        const followElHeight = rows * slotSize + (rows > 1 ? (rows - 1) * gap : 0);

        _customFollowEl.style.width = followElWidth + 'px';
        _customFollowEl.style.height = followElHeight + 'px';
    
        // CRITICAL: Use relative positioning to allow absolute children (aura, icon)
        _customFollowEl.style.position = 'fixed'; 
        _customFollowEl.style.display = 'block'; // Not grid! We'll use a wrapper for grid
        _customFollowEl.style.opacity = '0.9';
        _customFollowEl.style.transition = 'none';
    
    // Create grid wrapper for shape blocks
    const gridWrapper = document.createElement('div');
    gridWrapper.style.display = 'grid';
    gridWrapper.style.gridTemplateColumns = `repeat(${cols}, ${slotSize}px)`;
    gridWrapper.style.gridTemplateRows = `repeat(${rows}, ${slotSize}px)`;
    gridWrapper.style.gap = gap + 'px';
    gridWrapper.style.position = 'relative';
    gridWrapper.style.boxSizing = 'border-box';
    gridWrapper.style.width = followElWidth + 'px';
    gridWrapper.style.height = followElHeight + 'px';
    gridWrapper.style.alignItems = 'start';
    gridWrapper.style.justifyItems = 'start';

    // fill visual squares similar to item
    shape.forEach((row, r) => {
        row.forEach((cell, c) => {
            const pixel = document.createElement('div');
            pixel.style.boxSizing = 'border-box';
            pixel.style.width = slotSize + 'px';
            pixel.style.height = slotSize + 'px';
            if (cell) {
                pixel.className = 'shape-block ' + (item.rarity || 'common');
            } else {
                pixel.className = 'shape-empty';
            }
            gridWrapper.appendChild(pixel);
        });
    });
    
    _customFollowEl.appendChild(gridWrapper);
    
    const gridRotationIndex = draggedItem.rotationIndex;
    const canonicalRotationIndex = getCanonicalRot(gridRotationIndex);
    draggedItem.rotationIndex = canonicalRotationIndex;
    const rotGridLookupRot = canonicalRotationIndex;
    const spriteAnchoringRot = canonicalRotationIndex;
    const spriteMeta = _resolveSpriteMetaItemForDrag(item);
    const spriteMetaItem = spriteMeta.item || item;
    const spriteGeometry = {
        cellSizePx: slotSize,
        stepPx: cellW2,
        gapPx: gap
    };
    const bodyBoundsForFrame = _resolveBodyBoundsForDrag(item, rotGridLookupRot);
    const defaultAnchorLocalPx = _computeDefaultAnchorLocalPxFromBodyMatrix(shape, spriteGeometry);

    // ADD AURA OVERLAY FIRST (behind icon)
    // Use rotated aura if available (when picking up rotated item)
    const aura = (typeof getItemAuraMatrix === 'function')
        ? getItemAuraMatrix(item, rotGridLookupRot)
        : (draggedItem.rotatedAura || item.aura);
    if (aura) {
        const auraOverlay = document.createElement('div');
        auraOverlay.className = 'aura-overlay';
        auraOverlay.style.position = 'absolute';
        auraOverlay.style.top = '0';
        auraOverlay.style.left = '0';
        auraOverlay.style.opacity = '1';
        auraOverlay.style.pointerEvents = 'none';
        auraOverlay.style.zIndex = '1'; // Below icon
        auraOverlay.style.display = 'grid';
        
        const auraRows = aura.length;
        const auraCols = aura[0] ? aura[0].length : 1;
            auraOverlay.style.width = ((auraCols * slotSize) + ((auraCols - 1) * gap)) + 'px';
            auraOverlay.style.height = ((auraRows * slotSize) + ((auraRows - 1) * gap)) + 'px';
            auraOverlay.style.gridTemplateColumns = `repeat(${auraCols}, ${slotSize}px)`;
            auraOverlay.style.gridTemplateRows = `repeat(${auraRows}, ${slotSize}px)`;
            auraOverlay.style.gap = gap + 'px';
        
        // Align aura using body bounds inside the combined grid (use left/top for consistency)
        const bounds = bodyBoundsForFrame || { minR: 0, minC: 0 };
        const offsetX = -bounds.minC * cellW2;
        const offsetY = -bounds.minR * cellH2;
        auraOverlay.style.left = offsetX + 'px';
        auraOverlay.style.top = offsetY + 'px';
        
        aura.forEach((row, r) => {
            if (!Array.isArray(row)) return;
            row.forEach((cellValue, c) => {
                const auraCell = document.createElement('div');
                auraCell.style.width = slotSize + 'px';
                auraCell.style.height = slotSize + 'px';
                auraCell.style.boxSizing = 'border-box';
                if (cellValue === 1) {
                    auraCell.style.backgroundColor = 'rgba(100, 200, 255, 0.4)';
                    auraCell.style.border = '2px solid rgba(100, 200, 255, 0.7)';
                } else {
                    auraCell.style.backgroundColor = 'transparent';
                    auraCell.style.border = 'none';
                }
                auraCell.style.borderRadius = '4px';
                auraOverlay.appendChild(auraCell);
            });
        });
        
        _customFollowEl.appendChild(auraOverlay);
    }
    
    // ADD ICON / SPRITE LAST (on top)
    const rotationDeg = spriteAnchoringRot * 90;
    _debugSpriteAnchorRotationGhost(item, draggedItem.instanceId, gridRotationIndex, rotGridLookupRot, spriteAnchoringRot, spriteMeta.source, spriteMetaItem);
    if (spriteMetaItem && (spriteMetaItem.sprite || spriteMetaItem.image)) {
        const img = document.createElement('img');
        img.src = spriteMetaItem.sprite || spriteMetaItem.image;
        img.alt = item.name || '';
        img.className = 'item-sprite';

        const spriteAnchoring = (typeof window !== 'undefined' && window.SpriteAnchoring)
            ? window.SpriteAnchoring
            : null;
        const hasAnchorMeta = !!(spriteAnchoring && typeof spriteAnchoring.hasAnchoredSpriteMeta === 'function' && spriteAnchoring.hasAnchoredSpriteMeta(spriteMetaItem));
        const bodyBounds = _resolveBodyBoundsForDrag(spriteMetaItem, rotGridLookupRot);
        const spriteLayerLayout = (hasAnchorMeta && typeof spriteAnchoring.computeAnchoredSpriteLayerLayout === 'function')
            ? spriteAnchoring.computeAnchoredSpriteLayerLayout({
                itemDef: spriteMetaItem,
                rot: spriteAnchoringRot,
                geometry: spriteGeometry,
                bodyBounds
            })
            : null;
        const anchoredStyle = (hasAnchorMeta && spriteLayerLayout && typeof spriteAnchoring.computeAnchoredSpriteStyle === 'function')
            ? spriteAnchoring.computeAnchoredSpriteStyle({
                itemDef: spriteMetaItem,
                rot: spriteAnchoringRot,
                geometry: spriteGeometry,
                layerLayout: spriteLayerLayout
            })
            : null;

        if (anchoredStyle && spriteLayerLayout) {
            const spriteLayer = document.createElement('div');
            spriteLayer.style.position = 'absolute';
            spriteLayer.style.left = '0';
            spriteLayer.style.top = '0';
            spriteLayer.style.width = `${spriteLayerLayout.fullGridWidthPx}px`;
            spriteLayer.style.height = `${spriteLayerLayout.fullGridHeightPx}px`;
            spriteLayer.style.pointerEvents = 'none';
            spriteLayer.style.overflow = 'visible';
            spriteLayer.style.transform = `translate(${spriteLayerLayout.layerTranslatePx.x}px, ${spriteLayerLayout.layerTranslatePx.y}px)`;
            spriteLayer.style.zIndex = '100';

            img.style.position = 'absolute';
            img.style.left = '0';
            img.style.top = '0';
            img.style.display = 'block';
            img.style.objectFit = 'contain';
            img.style.width = `${anchoredStyle.widthPx}px`;
            img.style.height = `${anchoredStyle.heightPx}px`;
            img.style.transformOrigin = anchoredStyle.transformOrigin;
            img.style.transform = anchoredStyle.transform;

            spriteLayer.appendChild(img);
            _customFollowEl.appendChild(spriteLayer);
            const anchorLocalPx = _computeAnchorLocalPxFromAnchoredStyle(anchoredStyle, spriteLayerLayout);
            if (_isFinitePoint(anchorLocalPx)) {
                draggedItem.pointerToAnchorOffsetPx = {
                    x: Number(anchorLocalPx.x),
                    y: Number(anchorLocalPx.y)
                };
            } else {
                draggedItem.pointerToAnchorOffsetPx = {
                    x: Number(defaultAnchorLocalPx.x),
                    y: Number(defaultAnchorLocalPx.y)
                };
            }
        } else {
            const wrapper = document.createElement('div');
            wrapper.style.position = 'absolute';
            wrapper.style.top = '0';
            wrapper.style.left = '0';
            wrapper.style.width = '100%';
            wrapper.style.height = '100%';
            wrapper.style.pointerEvents = 'none';
            wrapper.style.zIndex = '100';

            const spriteOffsetX = _readSpriteOffset(spriteMetaItem.spriteOffsetX);
            const spriteOffsetY = _readSpriteOffset(spriteMetaItem.spriteOffsetY);
            wrapper.style.display = 'flex';
            wrapper.style.alignItems = 'center';
            wrapper.style.justifyContent = 'center';
            wrapper.style.transform = `translate(${spriteOffsetX}px, ${spriteOffsetY}px)`;
            const isEvenQuarterTurn = spriteAnchoringRot === 0 || spriteAnchoringRot === 2;
            if (isEvenQuarterTurn) {
                img.style.width = '100%';
                img.style.height = 'auto';
            } else {
                img.style.width = 'auto';
                img.style.height = '100%';
            }
            img.style.transform = `rotate(${rotationDeg}deg)`;
            img.style.transformOrigin = 'center';

            wrapper.appendChild(img);
            _customFollowEl.appendChild(wrapper);
            draggedItem.pointerToAnchorOffsetPx = {
                x: Number(defaultAnchorLocalPx.x),
                y: Number(defaultAnchorLocalPx.y)
            };
        }
    } else {
        const icon = document.createElement('div');
        icon.className = 'item-icon-overlay';
        icon.style.position = 'absolute';
        icon.style.top = '50%';
        icon.style.left = '50%';
        icon.style.transform = `translate(-50%, -50%) rotate(${rotationDeg}deg)`;
        icon.style.zIndex = '100'; // Above everything
        icon.style.pointerEvents = 'none';
        icon.style.fontSize = '2rem';
        icon.innerText = item.icon;
        _customFollowEl.appendChild(icon);
        draggedItem.pointerToAnchorOffsetPx = {
            x: Number(defaultAnchorLocalPx.x),
            y: Number(defaultAnchorLocalPx.y)
        };
    }

    document.body.appendChild(_customFollowEl);

    

    // Function to rebuild follow element visuals when shape changes (e.g., rotation)
    window._updateFollowElement = function() {
        if (!draggedItem || !_customFollowEl) return;
        const shape = draggedItem.previewShape || [[1]];
        const rows = shape.length;
        const cols = shape[0] ? shape[0].length : 1;
        
        // Update dimensions based on runtime cell geometry
        // Choose the grid element according to where the item was picked up (fromLocation)
        let gridEl = document.body;
        try {
            if (draggedItem && draggedItem.fromLocation === 'bank') {
                gridEl = document.getElementById('bank-grid') || document.querySelector('.workshop-content .bank-section .inventory-grid') || document.querySelector('.inventory-grid') || document.body;
            } else {
                // active grid (farm/pve)
                gridEl = document.getElementById('active-setup-grid') || document.querySelector('.workshop-content .active-section .inventory-grid') || document.querySelector('.inventory-grid') || document.body;
            }
        } catch (e) {
            gridEl = document.querySelector('.inventory-grid') || document.body;
        }
        // compute grid columns for gridEl when possible
        let gridColsLocal = GRID_SIZE;
        try {
            if (gridEl && gridEl.id === 'bank-grid') gridColsLocal = (typeof getBankCols === 'function') ? getBankCols() : 6;
            else gridColsLocal = GRID_SIZE;
        } catch (e) { gridColsLocal = GRID_SIZE; }
        const geo2 = getCellGeometry(gridEl, gridColsLocal);
        const slotSize2 = geo2.slotSize;
        const gap2 = geo2.gap;
        const cellWLocal = geo2.cellW;
        const cellHLocal = geo2.cellH;
        _customFollowEl.style.width = (cols * cellWLocal - gap2) + 'px';
        _customFollowEl.style.height = (rows * cellHLocal - gap2) + 'px';
        
        // Clear all children
        while (_customFollowEl.firstChild) _customFollowEl.removeChild(_customFollowEl.firstChild);
        
        // Create grid wrapper
        const gridWrapper = document.createElement('div');
        gridWrapper.style.display = 'grid';
        gridWrapper.style.gridTemplateColumns = `repeat(${cols}, ${slotSize2}px)`;
        gridWrapper.style.gridTemplateRows = `repeat(${rows}, ${slotSize2}px)`;
        gridWrapper.style.gap = gap2 + 'px';
        gridWrapper.style.position = 'relative';
        
        // Redraw shape blocks
        shape.forEach((row, r) => {
            row.forEach((cell, c) => {
                const pixel = document.createElement('div');
                if (cell) {
                    pixel.className = 'shape-block ' + (draggedItem.item.rarity || 'common');
                } else {
                    pixel.className = 'shape-empty';
                }
                gridWrapper.appendChild(pixel);
            });
        });
        
        _customFollowEl.appendChild(gridWrapper);
        
        const gridRotationIndex = draggedItem.rotationIndex;
        const canonicalRotationIndex = getCanonicalRot(gridRotationIndex);
        draggedItem.rotationIndex = canonicalRotationIndex;
        const rotGridLookupRot = canonicalRotationIndex;
        const spriteAnchoringRot = canonicalRotationIndex;
        const spriteMeta = _resolveSpriteMetaItemForDrag(draggedItem.item);
        const spriteMetaItem = spriteMeta.item || draggedItem.item;
        const spriteGeometry = {
            cellSizePx: slotSize2,
            stepPx: cellWLocal,
            gapPx: gap2
        };
        const bodyBoundsForFrame = _resolveBodyBoundsForDrag(draggedItem.item, rotGridLookupRot);
        const defaultAnchorLocalPx = _computeDefaultAnchorLocalPxFromBodyMatrix(shape, spriteGeometry);

        // ADD AURA OVERLAY (using rotated aura if available)
        const aura = (typeof getItemAuraMatrix === 'function')
            ? getItemAuraMatrix(draggedItem.item, rotGridLookupRot)
            : (draggedItem.rotatedAura || draggedItem.item.aura);
        if (aura) {
            const auraOverlay = document.createElement('div');
            auraOverlay.className = 'aura-overlay';
            auraOverlay.style.position = 'absolute';
            auraOverlay.style.top = '0';
            auraOverlay.style.left = '0';
            auraOverlay.style.opacity = '1';
            auraOverlay.style.pointerEvents = 'none';
            auraOverlay.style.zIndex = '1';
            auraOverlay.style.display = 'grid';
            
            const auraRows = aura.length;
            const auraCols = aura[0] ? aura[0].length : 1;
            auraOverlay.style.width = ((auraCols * slotSize2) + ((auraCols - 1) * gap2)) + 'px';
            auraOverlay.style.height = ((auraRows * slotSize2) + ((auraRows - 1) * gap2)) + 'px';
            auraOverlay.style.gridTemplateColumns = `repeat(${auraCols}, ${slotSize2}px)`;
            auraOverlay.style.gridTemplateRows = `repeat(${auraRows}, ${slotSize2}px)`;
            auraOverlay.style.gap = gap2 + 'px';

            // Align aura using body bounds inside the combined grid
            const bounds = bodyBoundsForFrame || { minR: 0, minC: 0 };
            const offsetX = -bounds.minC * cellWLocal;
            const offsetY = -bounds.minR * cellHLocal;
            auraOverlay.style.left = offsetX + 'px';
            auraOverlay.style.top = offsetY + 'px';
            
            aura.forEach((row, r) => {
                if (!Array.isArray(row)) return;
                row.forEach((cellValue, c) => {
                    const auraCell = document.createElement('div');
                    auraCell.style.width = slotSize2 + 'px';
                    auraCell.style.height = slotSize2 + 'px';
                    if (cellValue === 1) {
                        auraCell.style.backgroundColor = 'rgba(100, 200, 255, 0.4)';
                        auraCell.style.border = '2px solid rgba(100, 200, 255, 0.7)';
                    } else {
                        auraCell.style.backgroundColor = 'transparent';
                        auraCell.style.border = 'none';
                    }
                    auraCell.style.borderRadius = '4px';
                    auraOverlay.appendChild(auraCell);
                });
            });
            
            _customFollowEl.appendChild(auraOverlay);
        }
        
        // Update cached geometry after rotation changes dimensions
        if (typeof window._updateCachedGeometry === 'function') {
            window._updateCachedGeometry();
        }
        
        // ADD ICON / SPRITE (on top)
        const rotationDeg = spriteAnchoringRot * 90;
        _debugSpriteAnchorRotationGhost(draggedItem.item, draggedItem.instanceId, gridRotationIndex, rotGridLookupRot, spriteAnchoringRot, spriteMeta.source, spriteMetaItem);
        if (spriteMetaItem && (spriteMetaItem.sprite || spriteMetaItem.image)) {
            const img = document.createElement('img');
            img.src = spriteMetaItem.sprite || spriteMetaItem.image;
            img.alt = draggedItem.item.name || '';
            img.className = 'item-sprite';

            const spriteAnchoring = (typeof window !== 'undefined' && window.SpriteAnchoring)
                ? window.SpriteAnchoring
                : null;
            const hasAnchorMeta = !!(spriteAnchoring && typeof spriteAnchoring.hasAnchoredSpriteMeta === 'function' && spriteAnchoring.hasAnchoredSpriteMeta(spriteMetaItem));
            const bodyBounds = _resolveBodyBoundsForDrag(spriteMetaItem, rotGridLookupRot);
            const spriteLayerLayout = (hasAnchorMeta && typeof spriteAnchoring.computeAnchoredSpriteLayerLayout === 'function')
                ? spriteAnchoring.computeAnchoredSpriteLayerLayout({
                    itemDef: spriteMetaItem,
                    rot: spriteAnchoringRot,
                    geometry: spriteGeometry,
                    bodyBounds
                })
                : null;
            const anchoredStyle = (hasAnchorMeta && spriteLayerLayout && typeof spriteAnchoring.computeAnchoredSpriteStyle === 'function')
                ? spriteAnchoring.computeAnchoredSpriteStyle({
                    itemDef: spriteMetaItem,
                    rot: spriteAnchoringRot,
                    geometry: spriteGeometry,
                    layerLayout: spriteLayerLayout
                })
                : null;

            if (anchoredStyle && spriteLayerLayout) {
                const spriteLayer = document.createElement('div');
                spriteLayer.style.position = 'absolute';
                spriteLayer.style.left = '0';
                spriteLayer.style.top = '0';
                spriteLayer.style.width = `${spriteLayerLayout.fullGridWidthPx}px`;
                spriteLayer.style.height = `${spriteLayerLayout.fullGridHeightPx}px`;
                spriteLayer.style.pointerEvents = 'none';
                spriteLayer.style.overflow = 'visible';
                spriteLayer.style.transform = `translate(${spriteLayerLayout.layerTranslatePx.x}px, ${spriteLayerLayout.layerTranslatePx.y}px)`;
                spriteLayer.style.zIndex = '100';

                img.style.position = 'absolute';
                img.style.left = '0';
                img.style.top = '0';
                img.style.display = 'block';
                img.style.objectFit = 'contain';
                img.style.width = `${anchoredStyle.widthPx}px`;
                img.style.height = `${anchoredStyle.heightPx}px`;
                img.style.transformOrigin = anchoredStyle.transformOrigin;
                img.style.transform = anchoredStyle.transform;

                spriteLayer.appendChild(img);
                _customFollowEl.appendChild(spriteLayer);
                const anchorLocalPx = _computeAnchorLocalPxFromAnchoredStyle(anchoredStyle, spriteLayerLayout);
                if (_isFinitePoint(anchorLocalPx)) {
                    draggedItem.pointerToAnchorOffsetPx = {
                        x: Number(anchorLocalPx.x),
                        y: Number(anchorLocalPx.y)
                    };
                    if (window._dragLastPos && _isFinitePoint(window._dragLastPos)) {
                        _debugDragAnchor('rotate', draggedItem.rotationIndex, draggedItem.pointerToAnchorOffsetPx, window._dragLastPos);
                    }
                } else {
                    draggedItem.pointerToAnchorOffsetPx = {
                        x: Number(defaultAnchorLocalPx.x),
                        y: Number(defaultAnchorLocalPx.y)
                    };
                }
            } else {
                const wrapper = document.createElement('div');
                wrapper.style.position = 'absolute';
                wrapper.style.top = '0';
                wrapper.style.left = '0';
                wrapper.style.width = '100%';
                wrapper.style.height = '100%';
                wrapper.style.pointerEvents = 'none';
                wrapper.style.zIndex = '100';

                const spriteOffsetX = _readSpriteOffset(spriteMetaItem.spriteOffsetX);
                const spriteOffsetY = _readSpriteOffset(spriteMetaItem.spriteOffsetY);
                wrapper.style.display = 'flex';
                wrapper.style.alignItems = 'center';
                wrapper.style.justifyContent = 'center';
                wrapper.style.transform = `translate(${spriteOffsetX}px, ${spriteOffsetY}px)`;
                const isEvenQuarterTurn = spriteAnchoringRot === 0 || spriteAnchoringRot === 2;
                if (isEvenQuarterTurn) {
                    img.style.width = '100%';
                    img.style.height = 'auto';
                } else {
                    img.style.width = 'auto';
                    img.style.height = '100%';
                }
                img.style.transform = `rotate(${rotationDeg}deg)`;
                img.style.transformOrigin = 'center';

                wrapper.appendChild(img);
                _customFollowEl.appendChild(wrapper);
                draggedItem.pointerToAnchorOffsetPx = {
                    x: Number(defaultAnchorLocalPx.x),
                    y: Number(defaultAnchorLocalPx.y)
                };
            }
        } else {
            const icon = document.createElement('div');
            icon.className = 'item-icon-overlay';
            icon.style.position = 'absolute';
            icon.style.top = '50%';
            icon.style.left = '50%';
            icon.style.transform = `translate(-50%, -50%) rotate(${rotationDeg}deg)`;
            icon.style.zIndex = '100';
            icon.style.pointerEvents = 'none';
            icon.style.fontSize = '2rem';
            icon.innerText = draggedItem.item.icon;
            _customFollowEl.appendChild(icon);
            draggedItem.pointerToAnchorOffsetPx = {
                x: Number(defaultAnchorLocalPx.x),
                y: Number(defaultAnchorLocalPx.y)
            };
        }
    };

    // capture initial offsets locally to avoid race when draggedItem becomes null during cleanup
    const _localOffsetX = draggedItem.offsetX;
    const _localOffsetY = draggedItem.offsetY;

    // Cache geometry once on drag start to avoid repeated DOM reads in mousemove loop
    const _cachedGeo = { cellW: cellW2, cellH: cellH2 };
    
    // Update cached geometry when rotation changes shape
    window._updateCachedGeometry = () => {
        if (!draggedItem) return;
        const sourceGrid = (fromLocation === 'bank') ? document.getElementById('bank-grid') : document.getElementById('active-setup-grid');
        const sourceCols = (fromLocation === 'bank') ? getBankCols() : GRID_SIZE;
        const geo = getCellGeometry(sourceGrid || document.body, sourceCols);
        _cachedGeo.cellW = geo.cellW;
        _cachedGeo.cellH = geo.cellH;
    };

    // Throttled positioning: use requestAnimationFrame to avoid doing heavy layout math on every pointermove
    let _pendingRAF = false;
    let _rafX = 0;
    let _rafY = 0;

    const doUpdatePos = (clientX, clientY) => {
        // Performance monitoring (frame time delta)
        if (_perfEnabled) {
            const now = performance.now();
            if (_perfLastFrameTime > 0) {
                const delta = now - _perfLastFrameTime;
                _perfFrameTimes.push(delta);
            }
            _perfLastFrameTime = now;
        }
        
        window._dragLastPos = { x: clientX, y: clientY };
        const curOffsetX = (draggedItem && typeof draggedItem.offsetX === 'number') ? draggedItem.offsetX : _localOffsetX;
        const curOffsetY = (draggedItem && typeof draggedItem.offsetY === 'number') ? draggedItem.offsetY : _localOffsetY;
        const anchorOffset = (draggedItem && _isFinitePoint(draggedItem.pointerToAnchorOffsetPx))
            ? draggedItem.pointerToAnchorOffsetPx
            : null;
        const pointerToGhostOffsetX = anchorOffset ? Number(anchorOffset.x) : (curOffsetX * _cachedGeo.cellW);
        const pointerToGhostOffsetY = anchorOffset ? Number(anchorOffset.y) : (curOffsetY * _cachedGeo.cellH);
        
        // Use cached geometry for compositor-friendly transform positioning (no layout reads)
        const px = Math.round(clientX - pointerToGhostOffsetX);
        const py = Math.round(clientY - pointerToGhostOffsetY);
        
        if (_customFollowEl) {
            // Use transform for GPU-accelerated movement (no layout thrashing)
            _customFollowEl.style.transform = `translate(${px}px, ${py}px)`;
        }
    };

    // Expose direct updater for immediate repositioning (used after rotation)
    window._updateFollowElementPosition = (x, y) => { doUpdatePos(x, y); };

    // Throttled wrapper invoked on pointermove
    const updatePos = (clientX, clientY) => {
        _rafX = clientX;
        _rafY = clientY;
        if (_pendingRAF) return;
        _pendingRAF = true;
        requestAnimationFrame(() => {
            _pendingRAF = false;
            doUpdatePos(_rafX, _rafY);
        });
    };

    // initial position
    const initX = (startEvent && startEvent.clientX) || (window._dragLastPos && window._dragLastPos.x) || (window.innerWidth/2);
    const initY = (startEvent && startEvent.clientY) || (window._dragLastPos && window._dragLastPos.y) || (window.innerHeight/2);
    if (draggedItem && _isFinitePoint(draggedItem.pointerToAnchorOffsetPx)) {
        _debugDragAnchor('start', draggedItem.rotationIndex, draggedItem.pointerToAnchorOffsetPx, { x: initX, y: initY });
    }
    updatePos(initX, initY);

    // pointer move/up handlers
    const _hoverThrottleMs = 48;
    const _hoverMinMove = 4;
    let _lastHoverCheck = 0;
    let _lastHoverX = 0;
    let _lastHoverY = 0;

    _customPointerMove = (ev) => {
        if (!draggedItem) return;
        ev.preventDefault();
        updatePos(ev.clientX, ev.clientY);

        const now = performance.now();
        const dx = ev.clientX - _lastHoverX;
        const dy = ev.clientY - _lastHoverY;
        if (now - _lastHoverCheck < _hoverThrottleMs && (dx * dx + dy * dy) < (_hoverMinMove * _hoverMinMove)) {
            return;
        }
        _lastHoverCheck = now;
        _lastHoverX = ev.clientX;
        _lastHoverY = ev.clientY;

        // update hover target via elementsFromPoint
        try {
            const elems = document.elementsFromPoint(ev.clientX, ev.clientY);
            const slot = elems && elems.find(el => el.classList && el.classList.contains('grid-slot')) || null;
            if (slot) {
                const loc = slot.dataset.location;
                const idx = parseInt(slot.dataset.index);
                if (!draggedItem.hoverTarget || draggedItem.hoverTarget.location !== loc || draggedItem.hoverTarget.index !== idx) {
                    draggedItem.hoverTarget = { location: loc, index: idx };
                    draggedItem._lastValidSlot = slot; // store the actual slot for fallback at drop
                    renderAllActiveGrids();
                }
            } else if (draggedItem.hoverTarget) {
                delete draggedItem.hoverTarget;
                renderAllActiveGrids();
            }
        } catch (err) {
            // ignore
        }
    };

    _customPointerUp = (ev) => {
        ev.preventDefault();
        try {
            // Try to find slot BEFORE hiding the follow element
            const elemsBefore = document.elementsFromPoint(ev.clientX, ev.clientY);
            const slotBefore = elemsBefore && elemsBefore.find(el => el.classList && el.classList.contains('grid-slot')) || null;
            if (slotBefore && draggedItem) {
                draggedItem._dropSlot = slotBefore; // Store the drop slot for fallback
            }
            
            // hide follow element briefly so elementsFromPoint hits underlying slots
            if (_customFollowEl) _customFollowEl.style.display = 'none';
            const elems = document.elementsFromPoint(ev.clientX, ev.clientY);
            const slot = elems && elems.find(el => el.classList && el.classList.contains('grid-slot')) || null;
            
            let dropSlot = slot || draggedItem._dropSlot || draggedItem._lastValidSlot || null;
            if (!dropSlot) {
                const fallback = _getGridSlotFromPoint(ev.clientX, ev.clientY);
                if (fallback && fallback.element) dropSlot = fallback.element;
            }
            if (!dropSlot && window._dragLastPos) {
                const fallback = _getGridSlotFromPoint(window._dragLastPos.x, window._dragLastPos.y);
                if (fallback && fallback.element) dropSlot = fallback.element;
            }
            
            if (dropSlot) {
                handleDropInSlot({ preventDefault: () => {}, currentTarget: dropSlot });
            } else if (draggedItem && draggedItem.hoverTarget) {
                // final fallback: try hoverTarget selector
                const selector = `.grid-slot[data-location="${draggedItem.hoverTarget.location}"][data-index="${draggedItem.hoverTarget.index}"]`;
                const slot2 = document.querySelector(selector);
                if (slot2) handleDropInSlot({ preventDefault: () => {}, currentTarget: slot2 });
            }
        } catch (err) {
            console.warn('custom drop failed', err);
        }

        // Hide aura overlays when drag ends
        hideAllAuras();

        // cleanup follow element after a short timeout to allow placement to clear draggedItem
        setTimeout(() => {
            _cleanupCustomDragArtifacts();
            
            // Performance report
            if (_perfEnabled && _perfFrameTimes.length > 0) {
                const avg = _perfFrameTimes.reduce((a,b) => a+b, 0) / _perfFrameTimes.length;
                const min = Math.min(..._perfFrameTimes);
                const max = Math.max(..._perfFrameTimes);
                const fps = 1000 / avg;
                console.log(`📈 Drag Performance: avg=${avg.toFixed(2)}ms (${fps.toFixed(1)}fps), min=${min.toFixed(2)}ms, max=${max.toFixed(2)}ms, frames=${_perfFrameTimes.length}`);
                _perfFrameTimes = [];
                _perfLastFrameTime = 0;
            }
            
            // if draggedItem still exists (drop failed), restore
            if (draggedItem) {
                _restoreDraggedItemToSourceIfNeeded();
            }
        }, 10);
    };

    window.addEventListener('pointermove', _customPointerMove);
    window.addEventListener('pointerup', _customPointerUp, { once: true });
    _customPointerCancel = () => {
        if (!draggedItem) return;
        _restoreDraggedItemToSourceIfNeeded();
        _cleanupCustomDragArtifacts();
    };
    _windowBlurHandler = () => {
        if (!draggedItem) return;
        _restoreDraggedItemToSourceIfNeeded();
        _cleanupCustomDragArtifacts();
    };
    window.addEventListener('pointercancel', _customPointerCancel);
    window.addEventListener('blur', _windowBlurHandler);
    
    // Attach rotation listeners (active only during drag)
    _rotationKeyHandler = (e) => {
        if (!draggedItem) return;
        if (typeof window.isKeybindCaptureActive === 'function' && window.isKeybindCaptureActive()) return;
        const isCancelKey = (typeof window.matchesActionKeybinding === 'function')
            ? window.matchesActionKeybinding('cancelAction', e)
            : (!!e && e.key === 'Escape');
        if (isCancelKey) {
            e.preventDefault();
            _restoreDraggedItemToSourceIfNeeded();
            _cleanupCustomDragArtifacts();
            return;
        }
        const isRotateKey = (typeof window.matchesActionKeybinding === 'function')
            ? window.matchesActionKeybinding('rotateItem', e)
            : (!!e && typeof e.key === 'string' && e.key.toLowerCase() === 'r');
        if (!isRotateKey) return;
        const now = Date.now();
        if (now - _lastKeyRotate < 150) return; // debounce: ignore rapid repeats
        _lastKeyRotate = now;
        e.preventDefault();
        const dir = e.shiftKey ? -1 : 1;
        applyRotation(dir);
    };
    
    _rotationWheelHandler = (e) => {
        if (!draggedItem) return;
        const now = Date.now();
        if (now - _lastWheelRotate < 120) return; // ignore rapid repeats
        _lastWheelRotate = now;
        // deltaY < 0 => wheel up; map wheel up to CCW (-1), wheel down to CW (+1)
        const dir = (e.deltaY < 0) ? -1 : 1;
        e.preventDefault();
        applyRotation(dir);
    };
    
    window.addEventListener('keydown', _rotationKeyHandler);
    window.addEventListener('wheel', _rotationWheelHandler, { passive: false });
    _dragStartInitialized = true;
    } finally {
        if (!_dragStartInitialized) {
            draggedItem = null;
            _cleanupCustomDragArtifacts();
        }
    }
}

// ===== PUBLIC API =====
// Single namespace for all drag system interactions
window.DragSystem = {
    // Drag state access
    getDraggedItem: () => draggedItem,
    restoreDraggedItemToSource: () => _restoreDraggedItemToSourceIfNeeded(),
    clearDraggedItem: () => {
        draggedItem = null;
        _cleanupCustomDragArtifacts();
    },
    
    // Drag operations
    startCustomDrag: startCustomDrag,
    
    // Performance monitoring (for debugging)
    enablePerf: () => { _perfEnabled = true; console.log('🎯 Drag performance logging ENABLED'); },
    disablePerf: () => { _perfEnabled = false; console.log('🎯 Drag performance logging DISABLED'); }
};
