// =====================================
// GRID RENDERER (Gridrenderer.js)
// Rendert Slots + Items sauber aus Grid
// ================================

function createSlot(container, location, index, cols) {
    const slot = document.createElement('div');
    slot.classList.add('grid-slot');
    slot.dataset.location = location;
    slot.dataset.index = index;
    slot.dataset.cols = cols;

    slot.addEventListener('dragover', e => e.preventDefault());
    slot.addEventListener('drop', handleDropInSlot);

    const grid = gameData[location];
    const cell = grid[index];

    // Falls Slot leer oder kein Anker (Root), nur leeren Slot rendern
    if (!cell || !cell.root) {
        container.appendChild(slot);
        return;
    }

    const item = getItemById(cell.itemId);
    if (!item) {
        container.appendChild(slot);
        return;
    }

    const rotationIndex = typeof cell.rotationIndex === 'number' ? cell.rotationIndex : 0;
    const shape = (typeof getItemBodyMatrix === 'function')
        ? getItemBodyMatrix(item, rotationIndex)
        : item.body; // Wir nutzen 'body' laut aktuellem Stand
    const rows = shape.length;
    const colsShape = shape[0].length;

    const itemEl = document.createElement('div');
    itemEl.classList.add('item', item.rarity);
    itemEl.draggable = true;

    // Dimensionen berechnen (64px Slot + 8px Gap)
    itemEl.style.width = ((colsShape * 64) + ((colsShape - 1) * 8)) + "px";
    itemEl.style.height = ((rows * 64) + ((rows - 1) * 8)) + "px";
    itemEl.style.display = "grid";
    itemEl.style.gridTemplateColumns = `repeat(${colsShape}, 64px)`;
    itemEl.style.gridTemplateRows = `repeat(${rows}, 64px)`;
    itemEl.style.gap = "8px";
    itemEl.style.zIndex = "100";

    shape.forEach((row, r) => {
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
    icon.style.pointerEvents = "none"; // Damit das Icon den Drag nicht blockiert
    itemEl.appendChild(icon);

    // ===== AURA OVERLAY (Hidden by default) =====
    const auraOverlay = document.createElement('div');
    auraOverlay.classList.add('aura-overlay', item.rarity);
    auraOverlay.style.position = 'absolute';
    auraOverlay.style.opacity = '0';
    auraOverlay.style.transition = 'opacity 0.15s ease';
    auraOverlay.style.pointerEvents = 'none';
    auraOverlay.style.zIndex = '50';
    
    // Render die Aura-Zellen (item.aura oder standard 3x3)
    let aura = (typeof getItemAuraMatrix === 'function') ? getItemAuraMatrix(item, rotationIndex) : null;
    let useBodyBoundsForAura = true;
    if (!aura) {
        aura = item.aura || [[1,1,1], [1,0,1], [1,1,1]]; // Default aura wenn nicht definiert
        if (!item.aura) useBodyBoundsForAura = false;
    }
    const auraRows = aura.length;
    const auraColsShape = aura[0].length;
    
    auraOverlay.style.width = ((auraColsShape * 64) + ((auraColsShape - 1) * 8)) + "px";
    auraOverlay.style.height = ((auraRows * 64) + ((auraRows - 1) * 8)) + "px";
    auraOverlay.style.display = "grid";
    auraOverlay.style.gridTemplateColumns = `repeat(${auraColsShape}, 64px)`;
    auraOverlay.style.gridTemplateRows = `repeat(${auraRows}, 64px)`;
    auraOverlay.style.gap = "8px";
    
    const bodyBounds = (typeof getItemBodyBounds === 'function')
        ? getItemBodyBounds(item, rotationIndex)
        : { minR: 0, minC: 0 };
    const tileSize = 64 + 8;
    if (useBodyBoundsForAura) {
        auraOverlay.style.left = (-bodyBounds.minC * tileSize) + "px";
        auraOverlay.style.top = (-bodyBounds.minR * tileSize) + "px";
    } else {
        const offsetX = (colsShape - auraColsShape) / 2 * tileSize;
        const offsetY = (rows - auraRows) / 2 * tileSize;
        auraOverlay.style.left = offsetX + "px";
        auraOverlay.style.top = offsetY + "px";
    }
    
    aura.forEach((row, r) => {
        row.forEach((cellValue, c) => {
            const auraCell = document.createElement('div');
            if (cellValue === 1) {
                auraCell.classList.add('aura-cell', 'active');
                auraCell.style.backgroundColor = 'rgba(100, 200, 255, 0.3)';
                auraCell.style.border = '2px solid rgba(100, 200, 255, 0.6)';
            } else {
                auraCell.classList.add('aura-cell', 'empty');
                auraCell.style.backgroundColor = 'transparent';
            }
            auraCell.style.borderRadius = '4px';
            auraOverlay.appendChild(auraCell);
        });
    });
    
    itemEl.appendChild(auraOverlay);
    itemEl.style.position = 'relative';

    // ===== EVENT LISTENER FÜR AURA DISPLAY =====
    itemEl.addEventListener('mouseenter', () => {
        if (!window.altKeyPressed) { // Nur bei Hover wenn Alt nicht bereits aktiv
            auraOverlay.style.opacity = '1';
        }
    });
    
    itemEl.addEventListener('mouseleave', () => {
        if (!window.altKeyPressed) { // Ausblenden nur wenn Alt nicht aktiv
            auraOverlay.style.opacity = '0';
        }
    });

    itemEl.addEventListener('dragstart', (e) => {
        // Welchen Teil des Items haben wir gegriffen?
        const p = e.target.closest('.shape-block, .shape-empty');
        
        draggedItem = {
            item: item,
            fromLocation: location,
            fromIndex: index,
            offsetX: p ? parseInt(p.dataset.offsetX) : 0,
            offsetY: p ? parseInt(p.dataset.offsetY) : 0,
            previewShape: (shape || [[1]]).map(r => [...r]), // Kopie der Matrix für Rotation
            auraOverlay: auraOverlay,  // Store reference für späteren Drag-Access
            instanceId: cell.instanceId,
            rotatedAura: aura,
            rotationIndex: rotationIndex
        };

        // Item während des Drags aus dem Grid "löschen", damit es nicht mit sich selbst kollidiert
        clearItemFromGrid(gameData[location], item.id);
        
        // Aura während Drag sichtbar machen
        auraOverlay.style.opacity = '1';
        
        // Timeout damit das Element nicht sofort verschwindet bevor der Browser den Drag-Ghost erstellt
        setTimeout(() => renderWorkshopGrids(), 10);
    });

    slot.appendChild(itemEl);
    container.appendChild(slot);
}

// Hilfsfunktion, falls noch nicht in Itemsengine.js vorhanden:
function getItemById(id) {
    return ALL_ITEMS.find(i => i.id === id);
}