import { gridOneSize, gridTwoSize, labelsForGridOne, labelsForGridTwo } from '../config/constants.js';
import { carveMazeUsingRecursiveBacktracker, addExtraConnectionsToMaze } from '/algo/maze.js';

// Nouvelle fonction pour charger les données de terrain Kaamelott
let kaamelottData = null;

async function loadKaamelottData() {
  if (!kaamelottData) {
    try {
      const response = await fetch('/JSON/kaamelott.json');
      kaamelottData = await response.json();
    } catch (error) {
      console.error('Erreur lors du chargement des données Kaamelott:', error);
      kaamelottData = null;
    }
  }
  return kaamelottData;
}

// Fonction pour convertir les coordonnées de grille en coordonnées hexagonales Kaamelott
function gridToKaamelottCoords(x, y, gridSize) {
  // Conversion approximative basée sur la taille de la grille (24x24) vers les coordonnées hex
  const maxQ = 23; // q va de 0 à 23
  const maxR = 14; // r va de 0 à 14
  
  const q = Math.floor((x / gridSize) * (maxQ + 1));
  const r = Math.floor((y / gridSize) * (maxR + 1));
  
  return { q: Math.min(q, maxQ), r: Math.min(r, maxR) };
}

// Fonction pour vérifier si une position est dans l'eau
function isWaterPosition(x, y, gridSize, kaamelottData) {
  if (!kaamelottData || !kaamelottData.hexes) {
    console.log('Pas de données Kaamelott disponibles');
    return false;
  }
  
  const { q, r } = gridToKaamelottCoords(x, y, gridSize);
  const hexKey = `q${q}_r${r}`;
  const hex = kaamelottData.hexes[hexKey];
  
  const isWater = hex && hex.terrain === 'water';
  
  if (isWater) {
    console.log(`Position (${x},${y}) -> hex (${q},${r}) -> ${hexKey} est de l'eau`);
  }
  
  return isWater;
}

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

export function pickDoorPosition(state) {
  // Position fixe pour la clé aux coordonnées (56, 15)
  state.doorPosition = { x: 56, y: 12 };
}

// Fonction modifiée pour créer une matrice avec les zones d'eau comme murs
export async function createKaamelottWalkableMatrix(matrixSize) {
  const matrix = createEmptyWalkableMatrix(matrixSize);
  const kaamelottData = await loadKaamelottData();
  
  if (kaamelottData) {
    // Marquer les zones d'eau comme non-marchables
    for (let y = 0; y < matrixSize; y++) {
      for (let x = 0; x < matrixSize; x++) {
        if (isWaterPosition(x, y, matrixSize, kaamelottData)) {
          matrix[y][x] = false; // L'eau devient un mur
        }
      }
    }
  }
  
  return matrix;
}

// Fonction pour vérifier si une position est dans les zones interdites (bordures)
function isInForbiddenBorderArea(x, y, matrixSize) {
  // Exclure les 2 premières colonnes (x = 0, 1)
  if (x < 2) return true;
  
  // Exclure les 3 dernières colonnes (x >= matrixSize - 3)
  if (x >= matrixSize - 3) return true;
  
  // Exclure les 4 premières lignes (y = 0, 1, 2, 3)
  if (y < 4) return true;
  
  // Exclure les 4 dernières lignes (y >= matrixSize - 4)
  if (y >= matrixSize - 4) return true;
  
  return false;
}

// Fonction modifiée pour obtenir une position marchable qui évite l'eau et les bordures
export async function getRandomWalkablePositionKaamelott(walkableMatrix, exclusionSet, gridSize) {
  console.log('Début de getRandomWalkablePositionKaamelott, gridSize:', gridSize);
  
  const kaamelottData = await loadKaamelottData();
  const matrixSize = walkableMatrix.length;
  
  console.log('Données Kaamelott chargées:', !!kaamelottData);
  console.log('Taille de la matrice:', matrixSize);
  
  let attempts = 0;
  const maxAttempts = 1000;
  
  while (attempts < maxAttempts) {
    const randomX = Math.floor(Math.random() * matrixSize);
    const randomY = Math.floor(Math.random() * matrixSize);
    const key = randomX + ':' + randomY;
    
    // Vérifications étape par étape pour déboguer
    const isWalkable = walkableMatrix[randomY][randomX];
    const isExcluded = exclusionSet.has(key);
    const isWater = isWaterPosition(randomX, randomY, gridSize, kaamelottData);
    const isInForbiddenArea = isInForbiddenBorderArea(randomX, randomY, matrixSize);
    
    if (attempts < 5) { // Log les 5 premiers essais
      console.log(`Essai ${attempts}: (${randomX},${randomY}) - walkable:${isWalkable}, excluded:${isExcluded}, water:${isWater}, forbiddenArea:${isInForbiddenArea}`);
    }
    
    // Vérifier toutes les conditions : marchable, pas exclu, pas dans l'eau, pas dans les bordures interdites
    if (isWalkable && !isExcluded && !isWater && !isInForbiddenArea) {
      console.log(`Position trouvée après ${attempts} essais: (${randomX},${randomY})`);
      return { x: randomX, y: randomY };
    }
    attempts++;
  }
  
  console.log('Aucune position trouvée, utilisation du fallback');
  // Fallback: utiliser la fonction originale si aucune position valide n'est trouvée
  return getRandomWalkablePosition(walkableMatrix, exclusionSet);
}

export async function initializeGridOne(state) {
  // Utiliser la nouvelle matrice qui prend en compte l'eau
  const walkableMatrix = await createKaamelottWalkableMatrix(gridOneSize);
  
  resetStateBase(state, {
    gridType: 'grid1',
    gridSize: gridOneSize,
    matrixFactory: () => walkableMatrix, // Utiliser la matrice pré-calculée
    startPosition: { x: 14, y: 30 },
    exitPosition: null,
  });

  const exclusionSet = new Set();
  exclusionSet.add('14:30'); // Corriger pour exclure la vraie position de départ
  
  // Utiliser la nouvelle fonction pour générer les checkpoints
  await generateCheckpointsKaamelott(state, 3, exclusionSet);
}

// Nouvelle fonction pour générer les checkpoints en évitant l'eau
export async function generateCheckpointsKaamelott(state, count, exclusionSet) {
  for (let i = 0; i < count; i++) {
    const cp = await getRandomWalkablePositionKaamelott(state.walkableMatrix, exclusionSet, state.gridSize);
    state.checkpointsList.push(cp);
    exclusionSet.add(cp.x + ':' + cp.y);
  }
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

  // Le trésor est TOUJOURS le 3ème checkpoint (index 2)
  state.treasureCheckpointIndex = 2;
}