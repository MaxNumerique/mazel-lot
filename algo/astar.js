function isPositionInsideMatrix(x, y, matrixSize) {
  return x >= 0 && y >= 0 && x < matrixSize && y < matrixSize;
}

function getManhattanDistance(ax, ay, bx, by) {
  return Math.abs(ax - bx) + Math.abs(ay - by);
}

// Retourne les 4 voisins (haut/bas/gauche/droite) accessibles.
function getPathNeighbors(x, y, walkableMatrix) {
  const neighborList = [];
  const matrixSize = walkableMatrix.length;
  const directions = [
    { dx: 1, dy: 0 },
    { dx: -1, dy: 0 },
    { dx: 0, dy: 1 },
    { dx: 0, dy: -1 },
  ];
  for (const dir of directions) {
    const nx = x + dir.dx;
    const ny = y + dir.dy;
    if (isPositionInsideMatrix(nx, ny, matrixSize) && walkableMatrix[ny][nx]) {
      neighborList.push({ x: nx, y: ny });
    }
  }
  return neighborList;
}

// Reconstruit le chemin depuis la cible via le parentKey de chaque noeud.
function reconstructPath(cameFromMap, endKey) {
  const finalPath = [];
  let currentKey = endKey;
  while (cameFromMap.has(currentKey)) {
    const node = cameFromMap.get(currentKey);
    finalPath.push({ x: node.x, y: node.y });
    currentKey = node.parentKey;
  }
  finalPath.reverse();
  return finalPath;
}

// A* avec open-set ordonné par f, gScore et heuristique Manhattan.
export function performAStarSearch(walkableMatrix, startPosition, targetPosition) {
  const startKey = startPosition.x + ':' + startPosition.y;
  const targetKey = targetPosition.x + ':' + targetPosition.y;

  const openSetMap = new Map();
  const openSetQueue = [];
  const closedSetMap = new Map();
  const cameFromMap = new Map();

  const gScoreMap = new Map();
  const fScoreMap = new Map();

  gScoreMap.set(startKey, 0);
  fScoreMap.set(startKey, getManhattanDistance(startPosition.x, startPosition.y, targetPosition.x, targetPosition.y));

  openSetMap.set(startKey, { x: startPosition.x, y: startPosition.y, key: startKey });

  openSetQueue.push({
    key: startKey,
    x: startPosition.x,
    y: startPosition.y,
    f: fScoreMap.get(startKey),
  });

  function pushToQueue(node) {
    openSetQueue.push(node);
    let index = openSetQueue.length - 1;
    while (index > 0 && openSetQueue[index - 1].f > node.f) {
      const tmp = openSetQueue[index - 1];
      openSetQueue[index - 1] = openSetQueue[index];
      openSetQueue[index] = tmp;
      index--;
    }
  }

  function popMinFromQueue() {
    return openSetQueue.shift();
  }

  while (openSetQueue.length > 0) {
    const current = popMinFromQueue();
    openSetMap.delete(current.key);

    const currentKey = current.key;
    if (currentKey === targetKey) {
      return reconstructPath(cameFromMap, currentKey);
    }

    closedSetMap.set(currentKey, true);

    const neighbors = getPathNeighbors(current.x, current.y, walkableMatrix);
    for (const neighbor of neighbors) {
      const neighborKey = neighbor.x + ':' + neighbor.y;
      if (closedSetMap.has(neighborKey)) {
        continue;
      }

      const tentativeGScore = (gScoreMap.get(currentKey) ?? Infinity) + 1;

      const existingOpen = openSetMap.get(neighborKey);
      if (!existingOpen || tentativeGScore < (gScoreMap.get(neighborKey) ?? Infinity)) {
        cameFromMap.set(neighborKey, { x: neighbor.x, y: neighbor.y, parentKey: currentKey });
        gScoreMap.set(neighborKey, tentativeGScore);
        const heuristicScore = getManhattanDistance(neighbor.x, neighbor.y, targetPosition.x, targetPosition.y);
        const fScore = tentativeGScore + heuristicScore;
        fScoreMap.set(neighborKey, fScore);

        if (!existingOpen) {
          openSetMap.set(neighborKey, { x: neighbor.x, y: neighbor.y, key: neighborKey });
          pushToQueue({ key: neighborKey, x: neighbor.x, y: neighbor.y, f: fScore });
        } else {
          for (let i = 0; i < openSetQueue.length; i++) {
            if (openSetQueue[i].key === neighborKey) {
              openSetQueue.splice(i, 1);
              break;
            }
          }
          pushToQueue({ key: neighborKey, x: neighbor.x, y: neighbor.y, f: fScore });
        }
      }
    }
  }
  return [];
}