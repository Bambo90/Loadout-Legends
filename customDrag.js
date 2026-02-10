// customDrag.js
// Pointer-based drag & drop replacement to avoid native drag inconsistencies.

let _customFollowEl = null;
let _customPointerMove = null;
let _customPointerUp = null;

function startCustomDrag(item, fromLocation, fromIndex, offsetX, offsetY, previewShape, sourceElem, startEvent) {
    if (!item) return;
    // Ensure any existing drag cleaned
    if (draggedItem) return;

    draggedItem = {
        item: item,
        fromLocation: fromLocation,
        fromIndex: fromIndex,
        offsetX: offsetX || 0,
        offsetY: offsetY || 0,
        previewShape: previewShape.map(r => [...r])
    };

    // remove item from grid for preview
    clearItemFromGrid(gameData[fromLocation], item.id);
    try { queueRenderWorkshopGrids(); } catch (err) { renderWorkshopGrids(); }

    // create follow element
    _customFollowEl = document.createElement('div');
    _customFollowEl.className = 'item follow-item ' + (item.rarity || 'common');
    _customFollowEl.style.position = 'fixed';
    _customFollowEl.style.pointerEvents = 'none';
    _customFollowEl.style.zIndex = 99999;

    const shape = draggedItem.previewShape || [[1]];
    const rows = shape.length;
    const cols = shape[0] ? shape[0].length : 1;
    _customFollowEl.style.width = ((cols * 64) + ((cols - 1) * 8)) + 'px';
    _customFollowEl.style.height = ((rows * 64) + ((rows - 1) * 8)) + 'px';
    _customFollowEl.style.display = 'grid';
    _customFollowEl.style.gridTemplateColumns = `repeat(${cols}, 64px)`;
    _customFollowEl.style.gridTemplateRows = `repeat(${rows}, 64px)`;
    _customFollowEl.style.gap = '8px';
    _customFollowEl.style.opacity = '0.95';

    // fill visual squares similar to item
    shape.forEach((row, r) => {
        row.forEach((cell, c) => {
            const pixel = document.createElement('div');
            if (cell) {
                pixel.className = 'shape-block ' + (item.rarity || 'common');
            } else {
                pixel.className = 'shape-empty';
            }
            _customFollowEl.appendChild(pixel);
        });
    });
    const icon = document.createElement('div');
    icon.className = 'item-icon-overlay';
    icon.innerText = item.icon;
    _customFollowEl.appendChild(icon);

    document.body.appendChild(_customFollowEl);

    // Function to rebuild follow element visuals when shape changes (e.g., rotation)
    window._updateFollowElement = function() {
        if (!draggedItem || !_customFollowEl) return;
        const shape = draggedItem.previewShape || [[1]];
        const rows = shape.length;
        const cols = shape[0] ? shape[0].length : 1;
        _customFollowEl.style.width = ((cols * 64) + ((cols - 1) * 8)) + 'px';
        _customFollowEl.style.height = ((rows * 64) + ((rows - 1) * 8)) + 'px';
        _customFollowEl.style.gridTemplateColumns = `repeat(${cols}, 64px)`;
        _customFollowEl.style.gridTemplateRows = `repeat(${rows}, 64px)`;
        // clear old shapes
        while (_customFollowEl.firstChild) _customFollowEl.removeChild(_customFollowEl.firstChild);
        // redraw shapes
        shape.forEach((row, r) => {
            row.forEach((cell, c) => {
                const pixel = document.createElement('div');
                if (cell) {
                    pixel.className = 'shape-block ' + (draggedItem.item.rarity || 'common');
                } else {
                    pixel.className = 'shape-empty';
                }
                _customFollowEl.appendChild(pixel);
            });
        });
        const icon = document.createElement('div');
        icon.className = 'item-icon-overlay';
        icon.innerText = draggedItem.item.icon;
        _customFollowEl.appendChild(icon);
    };

    // capture initial offsets locally to avoid race when draggedItem becomes null during cleanup
    const _localOffsetX = draggedItem.offsetX;
    const _localOffsetY = draggedItem.offsetY;
    // position (use current draggedItem offsets if available so rotations update follow position)
    const updatePos = (clientX, clientY) => {
        window._dragLastPos = { x: clientX, y: clientY };
        const curOffsetX = (draggedItem && typeof draggedItem.offsetX === 'number') ? draggedItem.offsetX : _localOffsetX;
        const curOffsetY = (draggedItem && typeof draggedItem.offsetY === 'number') ? draggedItem.offsetY : _localOffsetY;
        const px = clientX - (curOffsetX * (64 + 8));
        const py = clientY - (curOffsetY * (64 + 8));
        if (_customFollowEl) {
            _customFollowEl.style.left = px + 'px';
            _customFollowEl.style.top = py + 'px';
        }
    };

    // initial position
    const initX = (startEvent && startEvent.clientX) || (window._dragLastPos && window._dragLastPos.x) || (window.innerWidth/2);
    const initY = (startEvent && startEvent.clientY) || (window._dragLastPos && window._dragLastPos.y) || (window.innerHeight/2);
    updatePos(initX, initY);

    // pointer move/up handlers
    _customPointerMove = (ev) => {
        if (!draggedItem) return;
        ev.preventDefault();
        updatePos(ev.clientX, ev.clientY);
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
                    try { queueRenderWorkshopGrids(); } catch (err) { renderWorkshopGrids(); }
                }
            } else if (draggedItem.hoverTarget) {
                delete draggedItem.hoverTarget;
                try { queueRenderWorkshopGrids(); } catch (err) { renderWorkshopGrids(); }
            }
        } catch (err) {
            // ignore
        }
    };

    _customPointerUp = (ev) => {
        ev.preventDefault();
        try {
            // debug: log current offsets and shape at drop
            console.log('drop - draggedItem offsets/shape', draggedItem && { offsetX: draggedItem.offsetX, offsetY: draggedItem.offsetY, shape: (draggedItem.previewShape || []).map(r=>r.length) });
            // hide follow element briefly so elementsFromPoint hits underlying slots
            if (_customFollowEl) _customFollowEl.style.display = 'none';
            const elems = document.elementsFromPoint(ev.clientX, ev.clientY);
            const slot = elems && elems.find(el => el.classList && el.classList.contains('grid-slot')) || null;
            console.log('custom drop coords', ev.clientX, ev.clientY, 'found slot', !!slot, 'hoverTarget', draggedItem && draggedItem.hoverTarget);
            
            if (slot) {
                // call drop handler
                handleDropInSlot({ preventDefault: () => {}, currentTarget: slot });
            } else if (draggedItem && draggedItem._lastValidSlot) {
                // fallback: use last valid slot stored during pointermove
                console.log('custom drop using lastValidSlot fallback');
                handleDropInSlot({ preventDefault: () => {}, currentTarget: draggedItem._lastValidSlot });
            } else if (draggedItem && draggedItem.hoverTarget) {
                // secondary fallback: try hoverTarget selector
                const selector = `.grid-slot[data-location="${draggedItem.hoverTarget.location}"][data-index="${draggedItem.hoverTarget.index}"]`;
                const slot2 = document.querySelector(selector);
                console.log('custom drop fallback selector', selector, 'found', !!slot2);
                if (slot2) handleDropInSlot({ preventDefault: () => {}, currentTarget: slot2 });
            }
        } catch (err) {
            console.warn('custom drop failed', err);
        }

        // cleanup follow element after a short timeout to allow placement to clear draggedItem
        setTimeout(() => {
            if (_customFollowEl && _customFollowEl.parentNode) _customFollowEl.parentNode.removeChild(_customFollowEl);
            _customFollowEl = null;
            window.removeEventListener('pointermove', _customPointerMove);
            window.removeEventListener('pointerup', _customPointerUp);
            _customPointerMove = null;
            _customPointerUp = null;
            // if draggedItem still exists (drop failed), restore
            if (draggedItem) {
                if (gameData[draggedItem.fromLocation]) {
                    const fromCols = draggedItem.fromLocation === 'bank' ? 6 : GRID_SIZE;
                    placeItemIntoGrid(gameData[draggedItem.fromLocation], draggedItem.fromIndex, draggedItem.item, draggedItem.previewShape, fromCols);
                }
                draggedItem = null;
                try { queueRenderWorkshopGrids(); } catch (err) { renderWorkshopGrids(); }
            }
            document.body.classList.remove('dragging','drop-allowed','drop-invalid');
            _lastDropState = null;
        }, 10);
    };

    window.addEventListener('pointermove', _customPointerMove);
    window.addEventListener('pointerup', _customPointerUp, { once: true });
}

// Expose startCustomDrag globally so workshopEngine can call it
window.startCustomDrag = startCustomDrag;
