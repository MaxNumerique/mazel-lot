import { gridOneSize, gridTwoSize, labelsForGridOne, labelsForGridTwo } from '../config/constants.js';
import { carveMazeUsingRecursiveBacktracker, addExtraConnectionsToMaze } from '/algo/maze.js';

export function createEmptyWalkableMatrix(matrixSize) {
  const walkableMatrix = new Array(matrixSize);
  for (let rowIndex = 0; rowIndex < matrixSize; rowIndex++) {
    walkableMatrix[rowIndex] = new Array(matrixSize).fill(true);
  }
  return walkableMatrix;
}

export function createWallsMatrix(matrixSize) {
  const walkableMatrix = new Array(matrixSize);
  for (let rowIndex = 0; rowIndex < matrixSize; rowIndex++) {
    walkableMatrix[rowIndex] = new Array(matrixSize).fill(false);
  }
  return walkableMatrix;
}

export function isPositionInsideMatrix(x, y, matrixSize) {
  return x >= 0 && y >= 0 && x < matrixSize && y < matrixSize;
}

export function getRandomInteger(minInclusive, maxInclusive) {
  return Math.floor(Math.random() * (maxInclusive - minInclusive + 1)) + minInclusive;
}

export function getRandomWalkablePosition(walkableMatrix, exclusionSet) {
  const matrixSize = walkableMatrix.length;
  while (true) {
    const randomX = Math.floor(Math.random() * matrixSize);
    const randomY = Math.floor(Math.random() * matrixSize);
    const key = randomX + ':' + randomY;
    if (walkableMatrix[randomY][randomX] && !exclusionSet.has(key)) {
      return { x: randomX, y: randomY };
    }
  }
}

export function createInitialState() {
  return {
    currentGridType: 'grid1',
    gridSize: gridOneSize,
    walkableMatrix: createEmptyWalkableMatrix(gridOneSize),
    currentPosition: { x: 0, y: 0 },
    checkpointsList: [],
    treasureCheckpointIndex: null,
    doorPosition: null,
    exitPosition: null,
    nextTargetIndex: 0,
    lastComputedPath: [],
    lastComputedTargetType: null,
    labelsForGridOne,
    labelsForGridTwo,
  };
}

// Helper: initialise en une fois les champs communs d'état pour une grille donnée.
export function resetStateBase(state, { gridType, gridSize, matrixFactory, startPosition, exitPosition = null }) {
  state.currentGridType = gridType;
  state.gridSize = gridSize;
  state.walkableMatrix = matrixFactory(gridSize);
  state.currentPosition = startPosition;
  state.checkpointsList = [];
  state.treasureCheckpointIndex = null;
  state.doorPosition = null;
  state.exitPosition = exitPosition;
  state.nextTargetIndex = 0;
  state.lastComputedPath = [];
  state.lastComputedTargetType = null;
}

// Helper: génère N checkpoints aléatoires en respectant un set d'exclusion.
export function generateCheckpoints(state, count, exclusionSet) {
  for (let i = 0; i < count; i++) {
    const cp = getRandomWalkablePosition(state.walkableMatrix, exclusionSet);
    state.checkpointsList.push(cp);
    exclusionSet.add(cp.x + ':' + cp.y);
  }
}

// Helper: détermine la porte (grille 1) en évitant checkpoints et position courante.
export function pickDoorPosition(state) {
  const exclusionSet = new Set(state.checkpointsList.map(p => p.x + ':' + p.y));
  exclusionSet.add(state.currentPosition.x + ':' + state.currentPosition.y);
  state.doorPosition = getRandomWalkablePosition(state.walkableMatrix, exclusionSet);
}

export function initializeGridOne(state) {
  resetStateBase(state, {
    gridType: 'grid1',
    gridSize: gridOneSize,
    matrixFactory: createEmptyWalkableMatrix,
    startPosition: { x: 0, y: 0 },
    exitPosition: null,
  });

  const exclusionSet = new Set();
  exclusionSet.add('0:0');
  generateCheckpoints(state, 3, exclusionSet);
}

export function initializeGridTwo(state) {
  // ajoute des ouvertures aléatoires, place 3 waypoints, choisit lequel est le trésor, et fixe la sortie.
  resetStateBase(state, {
    gridType: 'grid2',
    gridSize: gridTwoSize,
    matrixFactory: createWallsMatrix,
    startPosition: { x: 1, y: 1 },
    exitPosition: { x: gridTwoSize - 2, y: gridTwoSize - 2 },
  });

  // Carve le labyrinthe en partant de (1,1), en ouvrant des cellules tous les 2 pas.
  carveMazeUsingRecursiveBacktracker(state.walkableMatrix);
  // Ajoute quelques connexions supplémentaires pour créer des boucles.
  addExtraConnectionsToMaze(state.walkableMatrix, 0.08);

  const exclusionSet = new Set();
  exclusionSet.add(state.currentPosition.x + ':' + state.currentPosition.y);
  exclusionSet.add(state.exitPosition.x + ':' + state.exitPosition.y);
  generateCheckpoints(state, 3, exclusionSet);

  state.treasureCheckpointIndex = getRandomInteger(0, 2);
}