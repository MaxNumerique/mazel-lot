import {
  gridOneBackgroundColor,
  gridTwoBackgroundColor,
  wallCellColor,
  openCellColor,
  pathColor,
  currentPositionColor,
  checkpointColor,
  treasureColor,
  doorColor,
  exitColor,
  gridLineColor,
  fontFamily,
} from '../config/constants.js';

// Helpers textures et effets
let wallPattern = null;
let floorPattern = null;
let lastPatternKey = '';

function createNoisePattern(ctx, baseColor, tileSize, speckleDensity = 0.15, whiteAlpha = 0.04, blackAlpha = 0.04) {
  const tile = document.createElement('canvas');
  tile.width = tileSize;
  tile.height = tileSize;
  const tctx = tile.getContext('2d');

  // Fond de base
  tctx.fillStyle = baseColor;
  tctx.fillRect(0, 0, tileSize, tileSize);

  // Petites “impuretés” blanches/noires semi-transparentes
  const speckles = Math.floor(tileSize * tileSize * speckleDensity);
  tctx.globalAlpha = 1.0;
  for (let i = 0; i < speckles; i++) {
    const x = (Math.random() * tileSize) | 0;
    const y = (Math.random() * tileSize) | 0;
    tctx.fillStyle = Math.random() < 0.5 ? `rgba(255,255,255,${whiteAlpha})` : `rgba(0,0,0,${blackAlpha})`;
    tctx.fillRect(x, y, 1, 1);
  }

  return ctx.createPattern(tile, 'repeat');
}

function ensurePatterns(ctx, cellSize) {
  // Taille du tile: proportionnelle à la taille de cellule (limité pour éviter bruit trop gros/petit)
  const tileSize = Math.max(12, Math.min(48, Math.floor(cellSize * 2)));
  const key = String(tileSize);
  if (lastPatternKey !== key) {
    wallPattern = createNoisePattern(ctx, wallCellColor, tileSize, 0.2, 0.05, 0.05);
    floorPattern = createNoisePattern(ctx, openCellColor, tileSize, 0.12, 0.03, 0.03);
    lastPatternKey = key;
  }
}

function drawWallBevels(ctx, state, cellSize) {
  const M = state.walkableMatrix;
  const N = state.gridSize;
  const lw = Math.max(1, Math.floor(cellSize * 0.08));
  ctx.lineWidth = lw;

  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      if (M[y][x]) continue; // mur = false (non walkable)
      // Arêtes adjacentes à des cases ouvertes => liseré sombre
      ctx.strokeStyle = 'rgba(0,0,0,0.25)';

      // Haut
      if (y > 0 && M[y - 1][x]) {
        ctx.beginPath();
        ctx.moveTo(x * cellSize, y * cellSize + lw / 2);
        ctx.lineTo((x + 1) * cellSize, y * cellSize + lw / 2);
        ctx.stroke();
      }
      // Bas
      if (y < N - 1 && M[y + 1][x]) {
        ctx.beginPath();
        ctx.moveTo(x * cellSize, (y + 1) * cellSize - lw / 2);
        ctx.lineTo((x + 1) * cellSize, (y + 1) * cellSize - lw / 2);
        ctx.stroke();
      }
      // Gauche
      if (x > 0 && M[y][x - 1]) {
        ctx.beginPath();
        ctx.moveTo(x * cellSize + lw / 2, y * cellSize);
        ctx.lineTo(x * cellSize + lw / 2, (y + 1) * cellSize);
        ctx.stroke();
      }
      // Droite
      if (x < N - 1 && M[y][x + 1]) {
        ctx.beginPath();
        ctx.moveTo((x + 1) * cellSize - lw / 2, y * cellSize);
        ctx.lineTo((x + 1) * cellSize - lw / 2, (y + 1) * cellSize);
        ctx.stroke();
      }
    }
  }
}

// === Icônes vectorielles pour objectifs ===
function drawRoundedRectPath(ctx, x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

function drawCheckpointIcon(ctx, cx, cy, size, color, label, font) {
  const w = size, h = size;
  const x = cx - w / 2, y = cy - h / 2;

  const grad = ctx.createLinearGradient(x, y, x, y + h);
  grad.addColorStop(0, color);
  grad.addColorStop(1, 'rgba(0,0,0,0.15)');

  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.35)';
  ctx.shadowBlur = Math.max(4, Math.floor(size * 0.25));

  // Fond arrondi
  drawRoundedRectPath(ctx, x, y, w, h, Math.max(6, Math.floor(size * 0.2)));
  ctx.fillStyle = grad;
  ctx.fill();

  // Bord
  ctx.lineWidth = Math.max(2, Math.floor(size * 0.08));
  ctx.strokeStyle = 'rgba(0,0,0,0.4)';
  ctx.stroke();

  // Lettre
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#0b0f1a';
  ctx.strokeStyle = 'rgba(0,0,0,0.6)';
  ctx.lineWidth = 3;
  ctx.font = font;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.strokeText(label, cx, cy);
  ctx.fillText(label, cx, cy);

  ctx.restore();
}

function drawTreasureIcon(ctx, cx, cy, size) {
  const w = size, h = size * 0.75;
  const x = cx - w / 2, y = cy - h / 2;

  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.35)';
  ctx.shadowBlur = Math.max(4, Math.floor(size * 0.25));

  // Base du coffre
  ctx.fillStyle = '#8a4b2f';
  drawRoundedRectPath(ctx, x, y + h * 0.2, w, h * 0.8, Math.max(4, Math.floor(size * 0.12)));
  ctx.fill();

  // Couvercle
  ctx.fillStyle = '#7a3f27';
  drawRoundedRectPath(ctx, x, y, w, h * 0.35, Math.max(4, Math.floor(size * 0.12)));
  ctx.fill();

  // Cerclages métalliques
  ctx.strokeStyle = '#3a2a1d';
  ctx.lineWidth = Math.max(2, Math.floor(size * 0.06));
  ctx.strokeRect(x + w * 0.08, y + h * 0.28, w * 0.84, h * 0.48);

  // Verrou doré
  ctx.fillStyle = '#d4af37';
  ctx.fillRect(x + w * 0.44, y + h * 0.45, w * 0.12, h * 0.2);
  ctx.beginPath();
  ctx.arc(x + w * 0.5, y + h * 0.55, Math.max(2, Math.floor(size * 0.06)), 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawKeyIcon(ctx, cx, cy, size) {
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.35)';
  ctx.shadowBlur = Math.max(4, Math.floor(size * 0.25));
  ctx.strokeStyle = '#c0a96b';
  ctx.lineWidth = Math.max(3, Math.floor(size * 0.12));

  // Anneau
  ctx.beginPath();
  ctx.arc(cx - size * 0.15, cy, size * 0.25, 0, Math.PI * 2);
  ctx.stroke();

  // Tige
  ctx.beginPath();
  ctx.moveTo(cx - size * 0.0, cy);
  ctx.lineTo(cx + size * 0.35, cy);
  ctx.stroke();

  // Dents
  ctx.lineWidth = Math.max(2, Math.floor(size * 0.08));
  ctx.beginPath();
  ctx.moveTo(cx + size * 0.25, cy);
  ctx.lineTo(cx + size * 0.25, cy + size * 0.18);
  ctx.moveTo(cx + size * 0.32, cy);
  ctx.lineTo(cx + size * 0.32, cy + size * 0.12);
  ctx.stroke();

  ctx.restore();
}

function drawExitIcon(ctx, cx, cy, size, color) {
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.35)';
  ctx.shadowBlur = Math.max(4, Math.floor(size * 0.25));

  // Arche
  const w = size, h = size;
  const x = cx - w / 2, y = cy - h / 2;

  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x, y + h);
  ctx.lineTo(x, y + h * 0.45);
  ctx.arc(cx, y + h * 0.45, w / 2, Math.PI, 0);
  ctx.lineTo(x + w, y + h);
  ctx.closePath();
  ctx.fill();

  // Joints/briques subtils
  ctx.strokeStyle = 'rgba(0,0,0,0.25)';
  ctx.lineWidth = Math.max(1, Math.floor(size * 0.06));
  for (let i = 1; i < 4; i++) {
    const yy = y + h * (0.45 + i * 0.12);
    ctx.beginPath();
    ctx.moveTo(x + w * 0.15, yy);
    ctx.lineTo(x + w * 0.85, yy);
    ctx.stroke();
  }

  ctx.restore();
}

// Rendu par couches: fond → labyrinthes/sol → grille → chemin → points/porte/sortie → position actuelle.
export function drawGrid(state, gridCanvas, gridCanvasContext) {
  const gridSize = state.gridSize;
  const cellSize = Math.floor(Math.min(gridCanvas.width, gridCanvas.height) / gridSize);
  const backgroundColor = state.currentGridType === 'grid1' ? gridOneBackgroundColor : gridTwoBackgroundColor;
  const isMazeGrid = state.currentGridType === 'grid2';

  gridCanvasContext.clearRect(0, 0, gridCanvas.width, gridCanvas.height);
  gridCanvasContext.fillStyle = backgroundColor;
  gridCanvasContext.fillRect(0, 0, gridCanvas.width, gridCanvas.height);

  // Textures (uniquement pour la grille labyrinthe)
  if (isMazeGrid) {
    ensurePatterns(gridCanvasContext, cellSize);
  }

  for (let y = 0; y < gridSize; y++) {
    for (let x = 0; x < gridSize; x++) {
      if (isMazeGrid) {
        gridCanvasContext.fillStyle = state.walkableMatrix[y][x] ? (floorPattern || openCellColor) : (wallPattern || wallCellColor);
        gridCanvasContext.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
      }
    }
  }

  // Liserés/biseaux sur les murs pour relief
  if (isMazeGrid) {
    drawWallBevels(gridCanvasContext, state, cellSize);
  }

  // Grille (plus discrète)
  gridCanvasContext.save();
  gridCanvasContext.strokeStyle = gridLineColor;
  gridCanvasContext.globalAlpha = 0.25;
  gridCanvasContext.lineWidth = 1;
  for (let i = 0; i <= gridSize; i++) {
    gridCanvasContext.beginPath();
    gridCanvasContext.moveTo(0, i * cellSize + 0.5);
    gridCanvasContext.lineTo(gridSize * cellSize, i * cellSize + 0.5);
    gridCanvasContext.stroke();

    gridCanvasContext.beginPath();
    gridCanvasContext.moveTo(i * cellSize + 0.5, 0);
    gridCanvasContext.lineTo(i * cellSize + 0.5, gridSize * cellSize);
    gridCanvasContext.stroke();
  }
  gridCanvasContext.restore();

  // Chemin: halo + trait principal
  if (state.lastComputedPath && state.lastComputedPath.length > 0) {
    const firstPoint = state.lastComputedPath[0];

    // Halo
    gridCanvasContext.save();
    gridCanvasContext.strokeStyle = pathColor;
    gridCanvasContext.globalAlpha = 0.5;
    gridCanvasContext.lineWidth = Math.max(2, Math.floor(cellSize * 0.35));
    gridCanvasContext.lineCap = 'round';
    gridCanvasContext.shadowColor = pathColor;
    gridCanvasContext.shadowBlur = Math.max(6, Math.floor(cellSize * 0.6));
    gridCanvasContext.beginPath();
    gridCanvasContext.moveTo(firstPoint.x * cellSize + cellSize / 2, firstPoint.y * cellSize + cellSize / 2);
    for (let i = 1; i < state.lastComputedPath.length; i++) {
      const p = state.lastComputedPath[i];
      gridCanvasContext.lineTo(p.x * cellSize + cellSize / 2, p.y * cellSize + cellSize / 2);
    }
    gridCanvasContext.stroke();
    gridCanvasContext.restore();

    // Trait principal
    gridCanvasContext.save();
    gridCanvasContext.strokeStyle = pathColor;
    gridCanvasContext.lineWidth = Math.max(2, Math.floor(cellSize * 0.22));
    gridCanvasContext.lineCap = 'round';
    gridCanvasContext.beginPath();
    gridCanvasContext.moveTo(firstPoint.x * cellSize + cellSize / 2, firstPoint.y * cellSize + cellSize / 2);
    for (let i = 1; i < state.lastComputedPath.length; i++) {
      const p = state.lastComputedPath[i];
      gridCanvasContext.lineTo(p.x * cellSize + cellSize / 2, p.y * cellSize + cellSize / 2);
    }
    gridCanvasContext.stroke();
    gridCanvasContext.restore();
  }

  // Checkpoints (+ trésor)
  for (let i = 0; i < state.checkpointsList.length; i++) {
    const checkpoint = state.checkpointsList[i];
    const isTreasure = state.currentGridType === 'grid2' && i === state.treasureCheckpointIndex;

    const cx = checkpoint.x * cellSize + cellSize / 2;
    const cy = checkpoint.y * cellSize + cellSize / 2;
    const iconSize = Math.max(18, Math.floor(cellSize * 0.75));

    if (isTreasure) {
      // Trésor (coffre)
      drawTreasureIcon(gridCanvasContext, cx, cy, iconSize);
    } else {
      // Médaillon A/B/C — palette légère par index
      const labelText = state.currentGridType === 'grid1'
        ? state.labelsForGridOne[i]
        : state.labelsForGridTwo[i];

      const palette = ['#60a5fa', '#f59e0b', '#22c55e']; // bleu, ambre, vert
      const baseColor = palette[i % palette.length];

      drawMedalCheckpointIcon(gridCanvasContext, cx, cy, iconSize, baseColor, labelText, fontFamily);
    }
  }

  // Porte (grille 1) — clé stylisée
  if (state.currentGridType === 'grid1' && state.doorPosition) {
    const cx = state.doorPosition.x * cellSize + cellSize / 2;
    const cy = state.doorPosition.y * cellSize + cellSize / 2;
    const iconSize = Math.max(18, Math.floor(cellSize * 0.9));
    drawKeyIcon(gridCanvasContext, cx, cy, iconSize);
  }

  // Sortie (grille 2) — arche
  if (state.currentGridType === 'grid2' && state.exitPosition) {
    const cx = state.exitPosition.x * cellSize + cellSize / 2;
    const cy = state.exitPosition.y * cellSize + cellSize / 2;
    const iconSize = Math.max(18, Math.floor(cellSize * 0.8));
    drawExitIcon(gridCanvasContext, cx, cy, iconSize, exitColor);
  }

  // Position actuelle (on garde le carré simple pour la lisibilité)
  gridCanvasContext.save();
  gridCanvasContext.shadowColor = 'rgba(0,0,0,0.35)';
  gridCanvasContext.shadowBlur = Math.max(4, Math.floor(cellSize * 0.25));
  gridCanvasContext.fillStyle = currentPositionColor;
  gridCanvasContext.fillRect(
    state.currentPosition.x * cellSize + cellSize * 0.2,
    state.currentPosition.y * cellSize + cellSize * 0.2,
    cellSize * 0.6,
    cellSize * 0.6
  );
  gridCanvasContext.restore();

  // Vignette (assombrit les bords)
  const cx = gridCanvas.width / 2;
  const cy = gridCanvas.height / 2;
  const radius = Math.hypot(gridCanvas.width, gridCanvas.height) / 1.1;
  const vignette = gridCanvasContext.createRadialGradient(cx, cy, 0, cx, cy, radius);
  vignette.addColorStop(0, 'rgba(0,0,0,0)');
  vignette.addColorStop(1, 'rgba(0,0,0,0.45)');
  gridCanvasContext.fillStyle = vignette;
  gridCanvasContext.fillRect(0, 0, gridCanvas.width, gridCanvas.height);
}

// Nouveau: médaillon circulaire avec anneau métallique et pastille brillante
function drawMedalCheckpointIcon(ctx, cx, cy, size, baseColor, label, font) {
  const radius = size / 2;
  const ringWidth = Math.max(3, Math.floor(size * 0.12));
  const innerRadius = radius - ringWidth;

  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.35)';
  ctx.shadowBlur = Math.max(4, Math.floor(size * 0.25));

  // Anneau métallique (léger dégradé)
  const ringGrad = ctx.createLinearGradient(cx, cy - radius, cx, cy + radius);
  ringGrad.addColorStop(0, 'rgba(200,200,200,0.6)');
  ringGrad.addColorStop(1, 'rgba(120,120,120,0.6)');
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.strokeStyle = ringGrad;
  ctx.lineWidth = ringWidth;
  ctx.stroke();

  // Pastille interne (gloss)
  const gloss = ctx.createRadialGradient(cx - innerRadius * 0.35, cy - innerRadius * 0.35, innerRadius * 0.1, cx, cy, innerRadius);
  gloss.addColorStop(0, baseColor);
  gloss.addColorStop(1, 'rgba(0,0,0,0.15)');
  ctx.beginPath();
  ctx.arc(cx, cy, innerRadius, 0, Math.PI * 2);
  ctx.fillStyle = gloss;
  ctx.fill();

  // Lettre centrée
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#0b0f1a';
  ctx.strokeStyle = 'rgba(0,0,0,0.6)';
  ctx.lineWidth = Math.max(2, Math.floor(size * 0.1));
  ctx.font = font;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.strokeText(label, cx, cy);
  ctx.fillText(label, cx, cy);

  ctx.restore();
}