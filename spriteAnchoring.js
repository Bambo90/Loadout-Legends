// ==========================================
// SPRITE ANCHORING HELPERS (shared)
// Full-grid anchored sprite layout for placed + drag renderers.
// ==========================================

(function initSpriteAnchoring(globalScope) {
    if (!globalScope) return;

    function normalizeRotationIndex(value) {
        const numeric = Number(value);
        if (!Number.isFinite(numeric)) return 0;
        const truncated = Math.trunc(numeric);
        return ((truncated % 4) + 4) % 4;
    }

    function readNumeric(value, fallback) {
        const numeric = Number(value);
        return Number.isFinite(numeric) ? numeric : fallback;
    }

    function readOffsetPair(value) {
        if (!value || typeof value !== 'object') return { x: 0, y: 0 };
        return {
            x: readNumeric(value.x, 0),
            y: readNumeric(value.y, 0)
        };
    }

    function hasAnchoredSpriteMeta(itemDef) {
        if (!itemDef || typeof itemDef !== 'object') return false;
        return !!(itemDef.spriteAnchorCell && typeof itemDef.spriteAnchorCell === 'object');
    }

    function getRotationGrid(itemDef, rotationIndex) {
        if (!itemDef || typeof itemDef !== 'object') return null;
        const rot = normalizeRotationIndex(rotationIndex);
        if (rot === 0 && Array.isArray(itemDef.grid)) return itemDef.grid;
        const rotDef = itemDef.rotations && itemDef.rotations[rot];
        if (Array.isArray(rotDef)) return rotDef;
        if (rotDef && Array.isArray(rotDef.grid)) return rotDef.grid;
        return null;
    }

    function getRotationGridDimensions(itemDef, rotationIndex) {
        const rotGrid = getRotationGrid(itemDef, rotationIndex);
        if (
            Array.isArray(rotGrid) &&
            rotGrid.length > 0 &&
            Array.isArray(rotGrid[0]) &&
            rotGrid[0].length > 0
        ) {
            return { wCells: rotGrid[0].length, hCells: rotGrid.length };
        }
        return null;
    }

    function computeBodyBoundsInFullGrid(rotGrid) {
        if (!Array.isArray(rotGrid) || rotGrid.length === 0) {
            return { minR: 0, minC: 0, maxR: 0, maxC: 0, hasBody: false };
        }
        let minR = Infinity;
        let minC = Infinity;
        let maxR = -1;
        let maxC = -1;
        for (let r = 0; r < rotGrid.length; r++) {
            const row = rotGrid[r];
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
        if (maxR < 0 || maxC < 0) {
            return { minR: 0, minC: 0, maxR: 0, maxC: 0, hasBody: false };
        }
        return { minR, minC, maxR, maxC, hasBody: true };
    }

    function getFullRotationGridExtents(itemDef, rotationIndex) {
        const dims = getRotationGridDimensions(itemDef, rotationIndex);
        if (dims && Number.isFinite(dims.wCells) && Number.isFinite(dims.hCells) && dims.wCells > 0 && dims.hCells > 0) {
            return dims;
        }
        if (typeof getItemBodyBounds === 'function') {
            const bounds = getItemBodyBounds(itemDef, normalizeRotationIndex(rotationIndex));
            const wCells = Number(bounds.maxC) - Number(bounds.minC) + 1;
            const hCells = Number(bounds.maxR) - Number(bounds.minR) + 1;
            if (Number.isFinite(wCells) && Number.isFinite(hCells) && wCells > 0 && hCells > 0) {
                return { wCells, hCells };
            }
        }
        return { wCells: 1, hCells: 1 };
    }

    function computeItemSquareBoxCells(itemDef) {
        let boxCellsItem = 0;
        for (let rot = 0; rot < 4; rot++) {
            const rotGrid = getRotationGrid(itemDef, rot);
            const bounds = computeBodyBoundsInFullGrid(rotGrid);
            if (!bounds.hasBody) continue;
            const bodyW = Number(bounds.maxC) - Number(bounds.minC) + 1;
            const bodyH = Number(bounds.maxR) - Number(bounds.minR) + 1;
            if (!Number.isFinite(bodyW) || !Number.isFinite(bodyH) || bodyW <= 0 || bodyH <= 0) continue;
            const boxCellsRot = Math.max(bodyW, bodyH);
            if (boxCellsRot > boxCellsItem) boxCellsItem = boxCellsRot;
        }
        if (boxCellsItem > 0) return boxCellsItem;
        const extents0 = getFullRotationGridExtents(itemDef, 0);
        return Math.max(1, Number(extents0.wCells) || 1, Number(extents0.hCells) || 1);
    }

    function rotateCellFromRot0(anchor0, rot, rot0W, rot0H) {
        const x0 = Number(anchor0 && anchor0.x);
        const y0 = Number(anchor0 && anchor0.y);
        const w0 = Number(rot0W);
        const h0 = Number(rot0H);
        if (!Number.isFinite(x0) || !Number.isFinite(y0)) return null;
        if (!Number.isFinite(w0) || !Number.isFinite(h0) || w0 <= 0 || h0 <= 0) return { x: x0, y: y0 };

        const rotation = normalizeRotationIndex(rot);
        if (rotation === 0) return { x: x0, y: y0 };
        if (rotation === 1) return { x: (h0 - 1) - y0, y: x0 };
        if (rotation === 2) return { x: (w0 - 1) - x0, y: (h0 - 1) - y0 };
        return { x: y0, y: (w0 - 1) - x0 };
    }

    function rotateOffsetByRot(dx, dy, rot) {
        const rotation = normalizeRotationIndex(rot);
        if (rotation === 0) return { x: dx, y: dy };
        if (rotation === 1) return { x: -dy, y: dx };
        if (rotation === 2) return { x: -dx, y: -dy };
        return { x: dy, y: -dx };
    }

    function resolveGeometry(input) {
        if (!input || typeof input !== 'object') return null;
        const geometry = (input.geometry && typeof input.geometry === 'object')
            ? input.geometry
            : input;
        const cellSizePx = readNumeric(
            geometry.cellSizePx !== undefined ? geometry.cellSizePx : geometry.slotSizePx,
            NaN
        );
        if (!Number.isFinite(cellSizePx) || cellSizePx <= 0) return null;
        const stepCandidate = readNumeric(geometry.stepPx, NaN);
        const gapCandidate = readNumeric(geometry.gapPx, NaN);
        const hasStep = Number.isFinite(stepCandidate) && stepCandidate > 0;
        const hasGap = Number.isFinite(gapCandidate) && gapCandidate >= 0;
        const stepPx = hasStep ? stepCandidate : (cellSizePx + (hasGap ? gapCandidate : 0));
        const gapPx = hasGap ? gapCandidate : Math.max(0, stepPx - cellSizePx);
        return { cellSizePx, stepPx, gapPx };
    }

    function resolveItemDef(config) {
        if (!config || typeof config !== 'object') return null;
        if (config.itemDef && typeof config.itemDef === 'object') return config.itemDef;
        if (config.item && typeof config.item === 'object') return config.item; // Backward compat
        return null;
    }

    function computeAnchoredSpriteLayerLayout(config) {
        if (!config || typeof config !== 'object') return null;
        const itemDef = resolveItemDef(config);
        if (!itemDef) return null;
        const geometry = resolveGeometry(config);
        if (!geometry) return null;
        const rot = normalizeRotationIndex(config.rot);
        const extents = getFullRotationGridExtents(itemDef, rot);
        const fullGridWCells = Number(extents && extents.wCells);
        const fullGridHCells = Number(extents && extents.hCells);
        if (!Number.isFinite(fullGridWCells) || !Number.isFinite(fullGridHCells) || fullGridWCells <= 0 || fullGridHCells <= 0) {
            return null;
        }

        const rotGrid = getRotationGrid(itemDef, rot);
        const derivedBounds = computeBodyBoundsInFullGrid(rotGrid);
        const fallbackBounds = (config.bodyBounds && typeof config.bodyBounds === 'object') ? config.bodyBounds : null;
        const minC = derivedBounds.hasBody ? Number(derivedBounds.minC) : readNumeric(fallbackBounds && fallbackBounds.minC, 0);
        const minR = derivedBounds.hasBody ? Number(derivedBounds.minR) : readNumeric(fallbackBounds && fallbackBounds.minR, 0);
        const safeMinC = Number.isFinite(minC) ? minC : 0;
        const safeMinR = Number.isFinite(minR) ? minR : 0;

        const fullGridWidthPx = ((fullGridWCells - 1) * geometry.stepPx) + geometry.cellSizePx;
        const fullGridHeightPx = ((fullGridHCells - 1) * geometry.stepPx) + geometry.cellSizePx;
        const bodyBoundsInFullGrid = {
            minR: safeMinR,
            minC: safeMinC,
            maxR: derivedBounds.hasBody ? Number(derivedBounds.maxR) : safeMinR,
            maxC: derivedBounds.hasBody ? Number(derivedBounds.maxC) : safeMinC,
            hasBody: !!derivedBounds.hasBody
        };

        return {
            fullGridWCells,
            fullGridHCells,
            stepPx: geometry.stepPx,
            fullGridWidthPx,
            fullGridHeightPx,
            layerTranslatePx: {
                x: -(safeMinC * geometry.stepPx),
                y: -(safeMinR * geometry.stepPx)
            },
            bodyBoundsInFullGrid
        };
    }

    function computeAnchoredSpriteStyle(config) {
        if (!config || typeof config !== 'object') return null;
        const itemDef = resolveItemDef(config);
        if (!itemDef) return null;
        const geometry = resolveGeometry(config);
        if (!geometry) return null;
        const rot = normalizeRotationIndex(config.rot);
        const anchor0 = itemDef.spriteAnchorCell;
        if (!anchor0 || typeof anchor0 !== 'object') return null;

        const rot0Dims = getRotationGridDimensions(itemDef, 0) || getFullRotationGridExtents(itemDef, 0);
        const rotatedAnchor = rotateCellFromRot0(anchor0, rot, rot0Dims && rot0Dims.wCells, rot0Dims && rot0Dims.hCells) || anchor0;
        const anchorTargetX = Number(rotatedAnchor.x);
        const anchorTargetY = Number(rotatedAnchor.y);
        if (!Number.isFinite(anchorTargetX) || !Number.isFinite(anchorTargetY)) return null;

        const boxCells = computeItemSquareBoxCells(itemDef);
        if (!Number.isFinite(boxCells) || boxCells <= 0) return null;
        const spriteScale = Math.max(0.0001, readNumeric(itemDef.spriteScale, 1));

        const bounds = computeBodyBoundsInFullGrid(getRotationGrid(itemDef, rot));
        const minC = bounds.hasBody ? Number(bounds.minC) : 0;
        const minR = bounds.hasBody ? Number(bounds.minR) : 0;
        const anchorInBoxX = anchorTargetX - minC;
        const anchorInBoxY = anchorTargetY - minR;

        const targetAnchorPxX = (anchorTargetX * geometry.stepPx) + (geometry.cellSizePx / 2);
        const targetAnchorPxY = (anchorTargetY * geometry.stepPx) + (geometry.cellSizePx / 2);
        const anchorInSpritePxX = ((anchorInBoxX * geometry.stepPx) + (geometry.cellSizePx / 2)) * spriteScale;
        const anchorInSpritePxY = ((anchorInBoxY * geometry.stepPx) + (geometry.cellSizePx / 2)) * spriteScale;

        let tx = targetAnchorPxX - anchorInSpritePxX;
        let ty = targetAnchorPxY - anchorInSpritePxY;

        const offsetItemPx = readOffsetPair(itemDef.spriteAnchorOffsetItemPx);
        const rotatedOffsetItemPx = rotateOffsetByRot(offsetItemPx.x, offsetItemPx.y, rot);
        tx += rotatedOffsetItemPx.x;
        ty += rotatedOffsetItemPx.y;

        const transform = `translate(${tx}px, ${ty}px) rotate(${rot * 90}deg)`;

        return {
            widthPx: boxCells * geometry.stepPx * spriteScale,
            heightPx: boxCells * geometry.stepPx * spriteScale,
            transformOrigin: `${anchorInSpritePxX}px ${anchorInSpritePxY}px`,
            transform,
            translatePx: { x: tx, y: ty },
            stepPx: geometry.stepPx
        };
    }

    globalScope.SpriteAnchoring = {
        hasAnchoredSpriteMeta,
        computeAnchoredSpriteLayerLayout,
        computeAnchoredSpriteStyle
    };
})(typeof window !== 'undefined' ? window : null);

