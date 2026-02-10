// ==========================================
// WORKSHOP ENGINE
// Handles workshop grid rendering & updates
// ==========================================

/**
 * Creates a single grid slot and renders items if present
 */
function createSlot(container, location, index, cols) {
    const slot = document.createElement('div');
    slot.classList.add('grid-slot');
    slot.dataset.location = location;
    slot.dataset.index = index;
    slot.dataset.cols = cols;

    slot.addEventListener('dragover', (e) => {
        e.preventDefault();
        try { if (e.dataTransfer) e.dataTransfer.dropEffect = 'move'; } catch (err) {}
    });
    slot.addEventListener('dragenter', (e) => {
        slot.classList.add('drag-over');
    });
    slot.addEventListener('dragleave', (e) => {
        slot.classList.remove('drag-over');
    });
    slot.addEventListener('drop', handleDropInSlot);
    // Hover target to improve drag responsiveness
    slot.addEventListener('mouseenter', () => {
        if (draggedItem) {
            draggedItem.hoverTarget = { location, index };
            try { queueRenderWorkshopGrids(); } catch (err) { renderWorkshopGrids(); }
        }
    });
    slot.addEventListener('mouseleave', () => {
        if (draggedItem && draggedItem.hoverTarget && draggedItem.hoverTarget.location === location && draggedItem.hoverTarget.index === index) {
            delete draggedItem.hoverTarget;
            try { queueRenderWorkshopGrids(); } catch (err) { renderWorkshopGrids(); }
        }
    });

    // Stelle sicher, dass das Grid existiert
    if (!gameData[location]) {
        gameData[location] = {};
    }

    const grid = gameData[location];
    const cell = grid[index];

    // Falls Slot leer oder kein Anker (Root), nur leeren Slot rendern
    if (!cell) {
        container.appendChild(slot);
        return;
    }
    if (!cell.root) {
        console.log('⏭️  SKIP RENDER (no root) at index=' + index + ', cell has itemId=' + cell.itemId + ', instanceId=' + cell.instanceId);
        container.appendChild(slot);
        return;
    }

    const item = getItemById(cell.itemId);
    if (!item) {
        container.appendChild(slot);
        return;
    }

    // Use the stored shape from the grid cell (which may be rotated), fallback to item.body
    const shape = cell.shape || item.body || item.shape || [[1]];
    if (!shape || !Array.isArray(shape) || shape.length === 0) {
        container.appendChild(slot);
        return;
    }

    const rows = shape.length;
    const colsShape = shape[0] ? shape[0].length : 1;

    const itemEl = document.createElement('div');
    itemEl.classList.add('item', item.rarity);
    itemEl.draggable = false;
    // expose metadata for pointer-based drag
    itemEl.dataset.itemId = item.id;
    itemEl.dataset.fromLocation = location;
    itemEl.dataset.fromIndex = index;

    // Dimensionen berechnen (64px Slot + 8px Gap)
    itemEl.style.width = ((colsShape * 64) + ((colsShape - 1) * 8)) + "px";
    itemEl.style.height = ((rows * 64) + ((rows - 1) * 8)) + "px";
    itemEl.style.display = "grid";
    itemEl.style.gridTemplateColumns = `repeat(${colsShape}, 64px)`;
    itemEl.style.gridTemplateRows = `repeat(${rows}, 64px)`;
    itemEl.style.gap = "8px";
    itemEl.style.zIndex = "100";

    shape.forEach((row, r) => {
        if (!Array.isArray(row)) return;
        row.forEach((cellValue, c) => {
            const pixel = document.createElement('div');
            pixel.dataset.offsetX = c;
            pixel.dataset.offsetY = r;
            
            // WICHTIG: Hier wird die Klasse für den Glow vergeben
            if (cellValue === 1) {
                pixel.classList.add('shape-block', item.rarity);
            } else {
                pixel.classList.add('shape-empty');
            }
            itemEl.appendChild(pixel);
        });
    });

    const icon = document.createElement('div');
    icon.classList.add('item-icon-overlay');
    icon.innerText = item.icon;
    icon.style.pointerEvents = "none";
    itemEl.appendChild(icon);

    // Pointer-based drag start (uses customDrag.startCustomDrag)
    itemEl.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        const rect = itemEl.getBoundingClientRect();
        const tileW = 64 + 8;
        const tileH = 64 + 8;
        const cx = (e.clientX && e.clientX !== 0) ? e.clientX : (rect.left + rect.width / 2);
        const cy = (e.clientY && e.clientY !== 0) ? e.clientY : (rect.top + rect.height / 2);
        let relX = cx - rect.left;
        let relY = cy - rect.top;
        let calcOffsetX = Math.floor(relX / tileW);
        let calcOffsetY = Math.floor(relY / tileH);
        if (isNaN(calcOffsetX) || calcOffsetX < 0) calcOffsetX = 0;
        if (isNaN(calcOffsetY) || calcOffsetY < 0) calcOffsetY = 0;
        calcOffsetX = Math.min(calcOffsetX, colsShape - 1);
        calcOffsetY = Math.min(calcOffsetY, rows - 1);

        // Start the custom pointer drag with instanceId from grid cell
        if (typeof window.startCustomDrag === 'function') {
            // Pass a COPY of the shape to avoid modifying the grid cell during rotation
            const shapeCopy = shape.map(r => [...r]);
            window.startCustomDrag(item, location, index, calcOffsetX, calcOffsetY, shapeCopy, itemEl, e, cell.instanceId);
        }
    });

    slot.appendChild(itemEl);
    container.appendChild(slot);
}
