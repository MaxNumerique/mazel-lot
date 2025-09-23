import { gridTypeOneName, gridTypeTwoName } from '../config/constants.js';
import { performAStarSearch } from '/algo/astar.js';
import { initializeGridOne, initializeGridTwo, pickDoorPosition } from '../model/state.js';
import { drawGrid } from '../render/canvasRenderer.js';

// Cible suivante: check-points puis porte (grille 1), check-points puis sortie (grille 2).
export function getNextTargetAndType(state) {
  // D'abord les checkpoints (grille 1 et 2), puis porte (grille 1) ou sortie (grille 2)
  if (state.nextTargetIndex < state.checkpointsList.length) {
    return { target: state.checkpointsList[state.nextTargetIndex], type: 'checkpoint' };
  }
  if (state.currentGridType === 'grid1') {
    return state.doorPosition ? { target: state.doorPosition, type: 'door' } : { target: null, type: null };
  }
  return { target: state.exitPosition, type: 'exit' };
}

// Met à jour labels (grille, étape sur 3/4, cible) selon l’état courant.
export function updateStatusLabels(state, domRefs) {
  domRefs.gridTypeLabel.textContent = state.currentGridType === 'grid1' ? gridTypeOneName : gridTypeTwoName;

  const totalSegments =
    state.currentGridType === 'grid1'
      ? (state.doorPosition ? 4 : 3)
      : 4;

  const currentSegmentIndex =
    state.currentGridType === 'grid1'
      ? Math.min(state.nextTargetIndex + (state.doorPosition ? 1 : 0), totalSegments)
      : Math.min(state.nextTargetIndex + 1, totalSegments);

  domRefs.stepLabel.textContent = currentSegmentIndex + ' / ' + totalSegments;

  const nextTargetInfo = getNextTargetAndType(state);
  if (!nextTargetInfo.target) {
    domRefs.targetLabel.textContent = '-';
  } else {
    if (state.currentGridType === 'grid1') {
      if (nextTargetInfo.type === 'checkpoint') {
        domRefs.targetLabel.textContent = 'Point ' + state.labelsForGridOne[state.nextTargetIndex];
      } else if (nextTargetInfo.type === 'door') {
        domRefs.targetLabel.textContent = 'Porte';
      }
    } else {
      if (nextTargetInfo.type === 'checkpoint') {
        const isTreasure = state.nextTargetIndex === state.treasureCheckpointIndex;
        domRefs.targetLabel.textContent = isTreasure ? 'Trésor' : 'Point ' + state.labelsForGridTwo[state.nextTargetIndex];
      } else {
        domRefs.targetLabel.textContent = 'Sortie';
      }
    }
  }
}

// Calcule le segment A* vers la cible courante, stocke le chemin et rafraîchit l’affichage.
export function computeNextSegmentPath(state, gridCanvas, gridCanvasContext, domRefs) {
  const nextTargetInfo = getNextTargetAndType(state);
  if (!nextTargetInfo.target) {
    return;
  }
  const path = performAStarSearch(state.walkableMatrix, state.currentPosition, nextTargetInfo.target);
  state.lastComputedPath = path;
  state.lastComputedTargetType = nextTargetInfo.type;
  drawGrid(state, gridCanvas, gridCanvasContext);
  updateStatusLabels(state, domRefs);
}

// Valide le segment: avance la position, gère l’apparition de la porte, passage grille1→grille2, fin de grille2→grille1.
export function confirmSegmentAndAdvance(state, gridCanvas, gridCanvasContext, domRefs) {
  if (!state.lastComputedPath || state.lastComputedPath.length === 0) {
    return;
  }
  const finalPoint = state.lastComputedPath[state.lastComputedPath.length - 1];
  state.currentPosition = { x: finalPoint.x, y: finalPoint.y };

  if (state.currentGridType === 'grid1') {
    if (state.nextTargetIndex < state.checkpointsList.length) {
      state.nextTargetIndex += 1;
      if (state.nextTargetIndex === state.checkpointsList.length) {
        // Porte après le dernier checkpoint, avec exclusions.
        pickDoorPosition(state);
      }
    } else if (state.doorPosition) {
      if (finalPoint.x === state.doorPosition.x && finalPoint.y === state.doorPosition.y) {
        initializeGridTwo(state);
      }
    }
  } else {
    if (state.nextTargetIndex < state.checkpointsList.length) {
      state.nextTargetIndex += 1;
    } else {
      if (finalPoint.x === state.exitPosition.x && finalPoint.y === state.exitPosition.y) {
        initializeGridOne(state);
      }
    }
  }

  state.lastComputedPath = [];
  state.lastComputedTargetType = null;
  drawGrid(state, gridCanvas, gridCanvasContext);
  updateStatusLabels(state, domRefs);
}

// Réinitialise l’ensemble de la simulation sur la grille 1.
export function resetAll(state, gridCanvas, gridCanvasContext, domRefs) {
  initializeGridOne(state);
  drawGrid(state, gridCanvas, gridCanvasContext);
  updateStatusLabels(state, domRefs);
}