// ================================
// DRAG ENGINE (DragEngine.js)
// Rotation + Drag State Management
// ================================

let draggedItem = null;
let _lastClientX = 0;
let _lastClientY = 0;
let _lastDropState = null; // 'allowed' | 'invalid' | null
let _lastWheelRotate = 0;

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

function applyRotation(dir) {
    // dir: +1 = CW 90deg, -1 = CCW 90deg
    if (!draggedItem) return;
    
    // capture OLD shape dimensions BEFORE rotation
    const oldShape = draggedItem.previewShape;
    const oldH = oldShape.length;
    const oldW = oldShape[0].length;
    const oldX = draggedItem.offsetX;
    const oldY = draggedItem.offsetY;
    
    if (dir === 1) {
        // CW rotation: offset formula uses OLD dimensions
        draggedItem.previewShape = rotateMatrixCW(oldShape);
        draggedItem.offsetX = (oldH - 1) - oldY;
        draggedItem.offsetY = oldX;
    } else if (dir === -1) {
        // CCW rotation: offset formula uses OLD dimensions
        draggedItem.previewShape = rotateMatrixCCW(oldShape);
        draggedItem.offsetX = oldY;
        draggedItem.offsetY = (oldW - 1) - oldX;
    }
    // Note: Skip visual follow-element update to avoid DOM jitter
    // The shape and offsets are updated correctly at drop time
    try { queueRenderWorkshopGrids(); } catch (err) { renderWorkshopGrids(); }
}

function initGlobalDragListeners() {
    // Rotation via 'R' Taste (R = CW, Shift+R = CCW)
    window.addEventListener('keydown', (e) => {
        if (!draggedItem) return;
        if (e.key.toLowerCase() !== 'r') return;
        e.preventDefault();
        const dir = e.shiftKey ? -1 : 1;
        applyRotation(dir);
    });

    // Mausrad-Rotation (wheel up/down -> CCW/CW). Debounced to avoid repeated rotations.
    window.addEventListener('wheel', (e) => {
        if (!draggedItem) return;
        const now = Date.now();
        if (now - _lastWheelRotate < 120) return; // ignore rapid repeats
        _lastWheelRotate = now;
        // deltaY < 0 => wheel up; map wheel up to CCW (-1), wheel down to CW (+1)
        const dir = (e.deltaY < 0) ? -1 : 1;
        e.preventDefault();
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