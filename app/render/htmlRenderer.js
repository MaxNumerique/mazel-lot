import {
  gridOneBackgroundColor,
  gridTwoBackgroundColor,
  wallCellColor,
  openCellColor,
  pathColor,
  currentPositionColor,
  exitColor,
} from '../config/constants.js';

export function createGridContainer() {
  const container = document.createElement('div');
  container.id = 'gridContainer';
  container.className = 'grid-container';
  return container;
}

export function renderGrid(state, container) {
  // Nettoyer le contenu existant
  container.innerHTML = '';
  
  const gridSize = state.gridSize;
  const isMazeGrid = state.currentGridType === 'grid2';
  
  // Configurer la grille CSS
  container.style.setProperty('--grid-size', gridSize);
  container.style.setProperty('--grid-bg', 
    state.currentGridType === 'grid1' ? gridOneBackgroundColor : gridTwoBackgroundColor
  );
  
  // Créer les cellules
  for (let y = 0; y < gridSize; y++) {
    for (let x = 0; x < gridSize; x++) {
      const cell = document.createElement('div');
      cell.className = 'grid-cell';
      cell.dataset.x = x;
      cell.dataset.y = y;
      
      // Style de base selon le type de grille
      if (isMazeGrid) {
        cell.classList.add(state.walkableMatrix[y][x] ? 'walkable' : 'wall');
      } else {
        cell.classList.add('walkable');
      }
      
      // Ajouter les éléments spéciaux
      addSpecialElements(cell, x, y, state);
      
      container.appendChild(cell);
    }
  }
  
  // Dessiner le chemin avec des traits fins
  if (state.lastComputedPath && state.lastComputedPath.length > 0) {
    drawPath(container, state.lastComputedPath, gridSize);
  }
}

// Fonction helper pour créer une icône avec fallback
function createIcon(iconName, className, fallbackText = '?') {
  // Vérifier si Iconify est disponible
  if (typeof window !== 'undefined' && window.customElements && window.customElements.get('iconify-icon')) {
    const icon = document.createElement('iconify-icon');
    icon.setAttribute('icon', iconName);
    icon.className = className;
    
    // Ajouter un fallback en cas d'échec de chargement
    icon.addEventListener('error', () => {
      console.warn(`Icône ${iconName} non trouvée, utilisation du fallback`);
      icon.textContent = fallbackText;
      icon.style.fontFamily = 'monospace';
      icon.style.fontWeight = 'bold';
    });
    
    return icon;
  } else {
    // Fallback si Iconify n'est pas disponible
    const fallback = document.createElement('div');
    fallback.className = className + ' icon-fallback';
    fallback.textContent = fallbackText;
    fallback.style.fontFamily = 'monospace';
    fallback.style.fontWeight = 'bold';
    fallback.style.display = 'flex';
    fallback.style.alignItems = 'center';
    fallback.style.justifyContent = 'center';
    return fallback;
  }
}

function addSpecialElements(cell, x, y, state) {
  // Vérifier si le joueur est sur cette case
  const isPlayerHere = state.currentPosition.x === x && state.currentPosition.y === y;
  
  // Si le joueur est ici, on affiche SEULEMENT le joueur
  if (isPlayerHere) {
    const currentMarker = createIcon('mdi:account-circle', 'current-position-icon', '●');
    cell.appendChild(currentMarker);
    return; // On sort de la fonction, rien d'autre ne s'affiche
  }
  
  // Sinon, on affiche les autres éléments normalement
  
  // Checkpoints
  state.checkpointsList.forEach((checkpoint, index) => {
    if (checkpoint.x === x && checkpoint.y === y) {
      const isTreasure = state.currentGridType === 'grid2' && index === state.treasureCheckpointIndex;
      
      if (isTreasure) {
        const marker = createIcon('mdi:treasure-chest', 'treasure-icon', '💰');
        cell.appendChild(marker);
      } else {
        // Utiliser différentes icônes pour les waypoints
        const waypointIcons = [
          'mdi:alpha-a-circle',
          'mdi:alpha-b-circle', 
          'mdi:alpha-c-circle'
        ];
        const fallbackLabels = ['A', 'B', 'C'];
        const marker = createIcon(
          waypointIcons[index] || 'mdi:map-marker', 
          'checkpoint-icon',
          fallbackLabels[index] || '?'
        );
        cell.appendChild(marker);
      }
    }
  });
  
  // Clé (grille 1)
  if (state.currentGridType === 'grid1' && state.doorPosition && 
      state.doorPosition.x === x && state.doorPosition.y === y) {
    const key = createIcon('mdi:key', 'key-icon', '🗝️');
    cell.appendChild(key);
  }
  
  // Sortie (grille 2)
  if (state.currentGridType === 'grid2' && state.exitPosition && 
      state.exitPosition.x === x && state.exitPosition.y === y) {
    const exit = createIcon('mdi:door-open', 'exit-icon', '🚪');
    cell.appendChild(exit);
  }
}

function drawPath(container, path, gridSize) {
  if (path.length < 2) return;
  
  // Créer un SVG overlay pour dessiner les traits
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.classList.add('path-overlay');
  svg.style.position = 'absolute';
  svg.style.top = '0';
  svg.style.left = '0';
  svg.style.width = '100%';
  svg.style.height = '100%';
  svg.style.pointerEvents = 'none';
  svg.style.zIndex = '1';
  
  // Créer un groupe pour les effets
  const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
  
  // Définir le filtre pour l'effet néon
  const filter = document.createElementNS('http://www.w3.org/2000/svg', 'filter');
  filter.setAttribute('id', 'neon-glow');
  filter.setAttribute('x', '-50%');
  filter.setAttribute('y', '-50%');
  filter.setAttribute('width', '200%');
  filter.setAttribute('height', '200%');
  
  // Effet de flou gaussien
  const feGaussianBlur = document.createElementNS('http://www.w3.org/2000/svg', 'feGaussianBlur');
  feGaussianBlur.setAttribute('stdDeviation', '3');
  feGaussianBlur.setAttribute('result', 'coloredBlur');
  
  // Fusionner l'original avec le flou
  const feMerge = document.createElementNS('http://www.w3.org/2000/svg', 'feMerge');
  const feMergeNode1 = document.createElementNS('http://www.w3.org/2000/svg', 'feMergeNode');
  feMergeNode1.setAttribute('in', 'coloredBlur');
  const feMergeNode2 = document.createElementNS('http://www.w3.org/2000/svg', 'feMergeNode');
  feMergeNode2.setAttribute('in', 'SourceGraphic');
  
  feMerge.appendChild(feMergeNode1);
  feMerge.appendChild(feMergeNode2);
  filter.appendChild(feGaussianBlur);
  filter.appendChild(feMerge);
  defs.appendChild(filter);
  svg.appendChild(defs);
  
  // Calculer la taille d'une cellule en pourcentage
  const cellSize = 100 / gridSize;
  
  // Dessiner les segments du chemin
  for (let i = 0; i < path.length - 1; i++) {
    const current = path[i];
    const next = path[i + 1];
    
    // Calculer les positions en pourcentage (centre des cellules)
    const x1 = (current.x + 0.5) * cellSize;
    const y1 = (current.y + 0.5) * cellSize;
    const x2 = (next.x + 0.5) * cellSize;
    const y2 = (next.y + 0.5) * cellSize;
    
    // Créer la ligne principale (plus épaisse pour l'effet néon)
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', `${x1}%`);
    line.setAttribute('y1', `${y1}%`);
    line.setAttribute('x2', `${x2}%`);
    line.setAttribute('y2', `${y2}%`);
    line.setAttribute('stroke', '#00d4ff');
    line.setAttribute('stroke-width', '3');
    line.setAttribute('stroke-linecap', 'round');
    line.setAttribute('filter', 'url(#neon-glow)');
    line.classList.add('path-line');
    
    svg.appendChild(line);
  }
  
  // Ajouter des points spéciaux pour le début et la fin
  if (path.length > 0) {
    // Point de départ
    const startPoint = path[0];
    const startX = (startPoint.x + 0.5) * cellSize;
    const startY = (startPoint.y + 0.5) * cellSize;
    
    const startCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    startCircle.setAttribute('cx', `${startX}%`);
    startCircle.setAttribute('cy', `${startY}%`);
    startCircle.setAttribute('r', '4');
    startCircle.setAttribute('fill', '#00ff88');
    startCircle.setAttribute('filter', 'url(#neon-glow)');
    startCircle.classList.add('path-start-point');
    
    svg.appendChild(startCircle);
    
    // Point d'arrivée
    const endPoint = path[path.length - 1];
    const endX = (endPoint.x + 0.5) * cellSize;
    const endY = (endPoint.y + 0.5) * cellSize;
    
    const endCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    endCircle.setAttribute('cx', `${endX}%`);
    endCircle.setAttribute('cy', `${endY}%`);
    endCircle.setAttribute('r', '4');
    endCircle.setAttribute('fill', '#ff4444');
    endCircle.setAttribute('filter', 'url(#neon-glow)');
    endCircle.classList.add('path-end-point');
    
    svg.appendChild(endCircle);
  }
  
  container.appendChild(svg);
}