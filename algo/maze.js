function isPositionInsideMatrix(x, y, matrixSize) {
  return x >= 0 && y >= 0 && x < matrixSize && y < matrixSize;
}

// visite une cellule sur deux et on ouvre le mur entre les deux.
export function carveMazeUsingRecursiveBacktracker(walkableMatrix) {
  const matrixSize = walkableMatrix.length;

  function positionKey(x, y) {
    return x + ':' + y;
  }

  for (let row = 0; row < matrixSize; row++) {
    for (let col = 0; col < matrixSize; col++) {
      walkableMatrix[row][col] = false;
    }
  }

  const cellVisitedMap = new Map();
  const stackPositions = [];
  const startX = 1;
  const startY = 1;

  walkableMatrix[startY][startX] = true;
  stackPositions.push({ x: startX, y: startY });
  cellVisitedMap.set(positionKey(startX, startY), true);

  function getUnvisitedNeighborsTwoSteps(x, y) {
    const neighborList = [];
    const candidateDirections = [
      { dx: 0, dy: -2 },
      { dx: 0, dy: 2 },
      { dx: -2, dy: 0 },
      { dx: 2, dy: 0 },
    ];
    for (const direction of candidateDirections) {
      const targetX = x + direction.dx;
      const targetY = y + direction.dy;
      if (isPositionInsideMatrix(targetX, targetY, matrixSize) && !cellVisitedMap.has(positionKey(targetX, targetY))) {
        neighborList.push({ x: targetX, y: targetY, connectX: x + direction.dx / 2, connectY: y + direction.dy / 2 });
      }
    }
    return neighborList;
  }

  while (stackPositions.length > 0) {
    const currentCell = stackPositions[stackPositions.length - 1];
    const neighbors = getUnvisitedNeighborsTwoSteps(currentCell.x, currentCell.y);
    if (neighbors.length === 0) {
      stackPositions.pop();
    } else {
      const chosenNeighbor = neighbors[Math.floor(Math.random() * neighbors.length)];
      walkableMatrix[chosenNeighbor.connectY][chosenNeighbor.connectX] = true;
      walkableMatrix[chosenNeighbor.y][chosenNeighbor.x] = true;
      cellVisitedMap.set(positionKey(chosenNeighbor.x, chosenNeighbor.y), true);
      stackPositions.push({ x: chosenNeighbor.x, y: chosenNeighbor.y });
      cellVisitedMap.set(positionKey(chosenNeighbor.x, chosenNeighbor.y), true);
    }
  }
}

// Ajoute des ouvertures probabilistes pour créer des cycles.
export function addExtraConnectionsToMaze(walkableMatrix, extraOpenProbability) {
  const matrixSize = walkableMatrix.length;
  for (let y = 1; y < matrixSize - 1; y++) {
    for (let x = 1; x < matrixSize - 1; x++) {
      if (!walkableMatrix[y][x]) {
        if (Math.random() < extraOpenProbability) {
          walkableMatrix[y][x] = true;
        }
      }
    }
  }
}