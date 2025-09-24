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
  
  // Dessiner le chemin
  if (state.lastComputedPath && state.lastComputedPath.length > 0) {
    drawPath(container, state.lastComputedPath);
  }
}

function addSpecialElements(cell, x, y, state) {
  // Position actuelle
  if (state.currentPosition.x === x && state.currentPosition.y === y) {
    const currentMarker = document.createElement('div');
    currentMarker.className = 'current-position';
    cell.appendChild(currentMarker);
  }
  
  // Checkpoints
  state.checkpointsList.forEach((checkpoint, index) => {
    if (checkpoint.x === x && checkpoint.y === y) {
      const isTreasure = state.currentGridType === 'grid2' && index === state.treasureCheckpointIndex;
      const marker = document.createElement('div');
      
      if (isTreasure) {
        marker.className = 'treasure';
        marker.innerHTML = '💰';
      } else {
        marker.className = 'checkpoint';
        const label = state.currentGridType === 'grid1' 
          ? state.labelsForGridOne[index] 
          : state.labelsForGridTwo[index];
        marker.textContent = label;
      }
      
      cell.appendChild(marker);
    }
  });
  
  // Porte (grille 1)
  if (state.currentGridType === 'grid1' && state.doorPosition && 
      state.doorPosition.x === x && state.doorPosition.y === y) {
    const door = document.createElement('div');
    door.className = 'door';
    door.innerHTML = '🗝️';
    cell.appendChild(door);
  }
  
  // Sortie (grille 2)
  if (state.currentGridType === 'grid2' && state.exitPosition && 
      state.exitPosition.x === x && state.exitPosition.y === y) {
    const exit = document.createElement('div');
    exit.className = 'exit';
    exit.innerHTML = '🚪';
    cell.appendChild(exit);
  }
}

function drawPath(container, path) {
  path.forEach((point, index) => {
    const cell = container.querySelector(`[data-x="${point.x}"][data-y="${point.y}"]`);
    if (cell) {
      cell.classList.add('path');
      if (index === 0) cell.classList.add('path-start');
      if (index === path.length - 1) cell.classList.add('path-end');
    }
  });
}