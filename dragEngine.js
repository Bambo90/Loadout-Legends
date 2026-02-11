// ================================
// DRAG ENGINE (DragEngine.js)
// Rotation + Drag State Management
// ================================

let draggedItem = null;
let _lastClientX = 0;
let _lastClientY = 0;
let _lastDropState = null; // 'allowed' | 'invalid' | null
let _lastWheelRotate = 0;
let _lastKeyRotate = 0;
let _rotationCount = 0;

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
    console.log('  normalizeShape bounds minR=' + minR + ' minC=' + minC + ' maxR=' + maxR + ' maxC=' + maxC + ' | output:', JSON.stringify(trimmed));
    return { shape: trimmed, minR, minC };
}

function applyRotation(dir) {
    // dir: +1 = CW 90deg, -1 = CCW 90deg
    console.log('🔄 applyRotation called: dir=' + dir + ' draggedItem=' + (draggedItem ? draggedItem.item.id : 'NULL'));
    if (!draggedItem || !draggedItem.item) {
        console.warn('⚠️ applyRotation ABORT: draggedItem is null or no item');
        return;
    }

    _rotationCount++;

    const item = draggedItem.item;
    const currentRotIndex = draggedItem.rotationIndex || 0;
    const nextRotIndex = dir === 1
        ? (currentRotIndex + 1) % 4
        : ((currentRotIndex - 1) + 4) % 4;

    const rotationGrid = (typeof getItemRotationGrid === 'function')
        ? getItemRotationGrid(item, nextRotIndex)
        : null;
    if (rotationGrid) {
        draggedItem.rotationIndex = nextRotIndex;
        draggedItem.previewShape = getItemBodyMatrix(item, nextRotIndex).map(r => [...r]);
        const aura = getItemAuraMatrix(item, nextRotIndex);
        draggedItem.rotatedAura = aura ? aura.map(r => [...r]) : null;
        console.log('✅ Rotation updated: rotIndex=' + nextRotIndex + ' shape=' + JSON.stringify(draggedItem.previewShape) + ' aura=' + JSON.stringify(draggedItem.rotatedAura));

        if (typeof window._updateFollowElement === 'function') {
            window._updateFollowElement();
        }
        if (typeof window._updateFollowElementPosition === 'function' && window._dragLastPos) {
            window._updateFollowElementPosition(window._dragLastPos.x, window._dragLastPos.y);
        }
        try { queueRenderWorkshopGrids(); } catch (err) { renderWorkshopGrids(); }
        return;
    }

    applyRotationCanonical(dir);
}

function applyRotationCanonical(dir) {
    // Legacy rotation code (for items without rotations)
    if (!draggedItem) return;
    
    _rotationCount++;
    
    // capture OLD shape dimensions BEFORE rotation
    const oldShape = draggedItem.previewShape;
    const oldH = oldShape.length;
    const oldW = oldShape[0] ? oldShape[0].length : 1;
    const oldX = draggedItem.offsetX;
    const oldY = draggedItem.offsetY;
    
    console.log('🔄 ROTATION #' + _rotationCount + ' START', { 
        dir: dir === 1 ? 'CW' : 'CCW', 
        oldShape: JSON.stringify(oldShape),
        oldDim: { h: oldH, w: oldW },
        oldOffset: { x: oldX, y: oldY }
    });
    
    if (dir === 1) {
        // CW rotation: offset formula uses OLD dimensions
        const rotated = rotateMatrixCW(oldShape);
        console.log('  Pre-normalize rotated:', JSON.stringify(rotated));
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
            console.log('  🔄 Aura rotated CW:', JSON.stringify(draggedItem.rotatedAura));
        }
        console.log('🔄 CW ROTATION #' + _rotationCount + ' DONE', { 
            newShape: JSON.stringify(norm.shape),
            newDim: { h: newH, w: newW },
            newOffset: { x: draggedItem.offsetX, y: draggedItem.offsetY },
            normTrim: { minR: norm.minR, minC: norm.minC },
            offsetCalc: { preNormX: (oldH - 1) - oldY, preNormY: oldX }
        });
        
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
        console.log('  Pre-normalize rotated:', JSON.stringify(rotated));
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
            console.log('  🔄 Aura rotated CCW:', JSON.stringify(draggedItem.rotatedAura));
        }
        console.log('🔄 CCW ROTATION #' + _rotationCount + ' DONE', { 
            newShape: JSON.stringify(norm.shape),
            newDim: { h: newH, w: newW },
            newOffset: { x: draggedItem.offsetX, y: draggedItem.offsetY },
            normTrim: { minR: norm.minR, minC: norm.minC },
            offsetCalc: { preNormX: oldY, preNormY: (oldW - 1) - oldX }
        });
        
        // Update follow element visuals and position
        if (typeof window._updateFollowElement === 'function') {
            window._updateFollowElement();
        }
        if (typeof window._updateFollowElementPosition === 'function' && window._dragLastPos) {
            window._updateFollowElementPosition(window._dragLastPos.x, window._dragLastPos.y);
        }
    }
    // Update grid preview to show new rotation
    try { queueRenderWorkshopGrids(); } catch (err) { renderWorkshopGrids(); }
}

function initGlobalDragListeners() {
    // Rotation via 'R' Taste (R = CW, Shift+R = CCW)
    window.addEventListener('keydown', (e) => {
        console.log('⌨️ keydown:', e.key, 'draggedItem:', draggedItem ? draggedItem.item.id : 'null');
        if (!draggedItem) return;
        if (e.key.toLowerCase() !== 'r') return;
        const now = Date.now();
        if (now - _lastKeyRotate < 150) return; // debounce: ignore rapid repeats
        _lastKeyRotate = now;
        e.preventDefault();
        console.log('🔑 R key detected, applying rotation');
        const dir = e.shiftKey ? -1 : 1;
        applyRotation(dir);
    });

    // Mausrad-Rotation (wheel up/down -> CCW/CW). Debounced to avoid repeated rotations.
    window.addEventListener('wheel', (e) => {
        console.log('🎡 wheel event, draggedItem:', draggedItem ? draggedItem.item.id : 'null', 'deltaY:', e.deltaY);
        if (!draggedItem) return;
        const now = Date.now();
        if (now - _lastWheelRotate < 120) return; // ignore rapid repeats
        _lastWheelRotate = now;
        // deltaY < 0 => wheel up; map wheel up to CCW (-1), wheel down to CW (+1)
        const dir = (e.deltaY < 0) ? -1 : 1;
        e.preventDefault();
        console.log('🎡 Wheel rotation applied: dir=' + dir);
        applyRotation(dir);
    }, { passive: false });

    // Track last mouse position as a fallback when drag events provide 0 coords
    window.addEventListener('mousemove', (m) => {
        _lastClientX = m.clientX;
        _lastClientY = m.clientY;
        // Expose a simple global fallback for other modules
        try { window._dragLastPos = { x: _lastClientX, y: _lastClientY }; } catch (err) {}
        // If we're currently dragging an item, attempt to resolve the slot under the cursor
        if (draggedItem) {
            try {
                const elems = document.elementsFromPoint(_lastClientX, _lastClientY);
                const slot = elems && elems.find(el => el.classList && el.classList.contains('grid-slot')) || null;
                if (slot) {
                    const location = slot.dataset.location;
                    const index = parseInt(slot.dataset.index);
                    if (!draggedItem.hoverTarget || draggedItem.hoverTarget.location !== location || draggedItem.hoverTarget.index !== index) {
                        draggedItem.hoverTarget = { location, index };
                        try { queueRenderWorkshopGrids(); } catch (err) { renderWorkshopGrids(); }
                    }
                } else if (draggedItem.hoverTarget) {
                    delete draggedItem.hoverTarget;
                    try { queueRenderWorkshopGrids(); } catch (err) { renderWorkshopGrids(); }
                }
                // Set body cursor state: mark allowed only when hoverTarget exists and placement is valid
                try {
                    if (draggedItem && draggedItem.hoverTarget) {
                        const loc = draggedItem.hoverTarget.location;
                        const idx = draggedItem.hoverTarget.index;
                        const slotEl = document.querySelector(`.grid-slot[data-location="${loc}"][data-index="${idx}"]`);
                        if (slotEl) {
                            const cols = parseInt(slotEl.dataset.cols) || (loc === 'bank' ? 6 : GRID_SIZE);
                            const grid = gameData[loc] || {};
                            const mouseX = idx % cols;
                            const mouseY = Math.floor(idx / cols);
                            const originX = mouseX - draggedItem.offsetX;
                            const originY = mouseY - draggedItem.offsetY;
                            const originIndex = originY * cols + originX;
                            const maxRows = loc === 'bank' ? Math.ceil(BANK_SLOTS / cols) : GRID_ROWS;
                            const ok = (originIndex >= 0) && canPlaceItem(grid, originIndex, draggedItem.previewShape, cols, maxRows);
                            document.body.classList.add('dragging');
                            const newState = ok ? 'allowed' : 'invalid';
                            if (newState !== _lastDropState) {
                                _lastDropState = newState;
                                if (ok) {
                                    document.body.classList.add('drop-allowed');
                                    document.body.classList.remove('drop-invalid');
                                } else {
                                    document.body.classList.add('drop-invalid');
                                    document.body.classList.remove('drop-allowed');
                                }
                            }
                        }
                    } else if (draggedItem) {
                        document.body.classList.add('dragging');
                        if (_lastDropState !== 'allowed') {
                            _lastDropState = 'allowed';
                            document.body.classList.add('drop-allowed');
                            document.body.classList.remove('drop-invalid');
                        }
                    } else {
                        document.body.classList.remove('dragging');
                        document.body.classList.remove('drop-invalid');
                        document.body.classList.remove('drop-allowed');
                        _lastDropState = null;
                    }
                } catch (err) {
                    // ignore
                }
            } catch (err) {
                // ignore errors from elementsFromPoint
            }
        }
    });

    // Global dragover to update hover target based on pointer position (improves responsiveness)
    window.addEventListener('dragover', (e) => {
        if (!draggedItem) return;
        // allow drops
        if (e.preventDefault) e.preventDefault();
        const cx = (e.clientX && e.clientX !== 0) ? e.clientX : _lastClientX;
        const cy = (e.clientY && e.clientY !== 0) ? e.clientY : _lastClientY;
        try { window._dragLastPos = { x: cx, y: cy }; } catch (err) {}
        const elems = document.elementsFromPoint(cx, cy);
        if (!elems || elems.length === 0) return;
        const slot = elems.find(el => el.classList && el.classList.contains('grid-slot')) || null;
            if (slot) {
            const location = slot.dataset.location;
            const index = parseInt(slot.dataset.index);
            if (!draggedItem.hoverTarget || draggedItem.hoverTarget.location !== location || draggedItem.hoverTarget.index !== index) {
                draggedItem.hoverTarget = { location, index };
                console.log('hoverTarget ->', location, index);
                    try { queueRenderWorkshopGrids(); } catch (err) { renderWorkshopGrids(); }
            }
            try { if (e.dataTransfer) e.dataTransfer.dropEffect = 'move'; } catch (err) {}
        } else if (draggedItem.hoverTarget) {
            delete draggedItem.hoverTarget;
            try { queueRenderWorkshopGrids(); } catch (err) { renderWorkshopGrids(); }
        }
    }, { passive: false });

    // 'drag' events fire during the drag operation; use them to keep preview in sync
    window.addEventListener('drag', (e) => {
        if (!draggedItem) return;
        const cx2 = (e.clientX && e.clientX !== 0) ? e.clientX : _lastClientX;
        const cy2 = (e.clientY && e.clientY !== 0) ? e.clientY : _lastClientY;
        try { window._dragLastPos = { x: cx2, y: cy2 }; } catch (err) {}
        const elems = document.elementsFromPoint(cx2, cy2);
        if (!elems || elems.length === 0) return;
        const slot = elems.find(el => el.classList && el.classList.contains('grid-slot')) || null;
            if (slot) {
            const location = slot.dataset.location;
            const index = parseInt(slot.dataset.index);
            if (!draggedItem.hoverTarget || draggedItem.hoverTarget.location !== location || draggedItem.hoverTarget.index !== index) {
                draggedItem.hoverTarget = { location, index };
                console.log('hoverTarget ->', location, index);
                try { queueRenderWorkshopGrids(); } catch (err) { renderWorkshopGrids(); }
            }
        } else if (draggedItem.hoverTarget) {
            delete draggedItem.hoverTarget;
            try { queueRenderWorkshopGrids(); } catch (err) { renderWorkshopGrids(); }
        }
    });
}