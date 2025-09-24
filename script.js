// Fonction d'entrée utilisée par l'interface pour démarrer la partie
// Elle cache l'écran d'introduction et lance la génération du labyrinthe.
export function startGame() {
  // Cacher l'élément HTML d'introduction (id="intro-screen")
  document.getElementById("intro-screen").style.display = "none";
  // Appel de la fonction qui déclenche la génération et l'affichage du labyrinthe
  generateMaze(); // Lance directement la génération du labyrinthe
}

// Classe responsable de la génération et du placement des éléments du labyrinthe
export class MazeGenerator {
  // Constructeur: reçoit la largeur et la hauteur en nombre de cellules
  constructor(width, height) {
    this.width = width; // largeur (nombre de colonnes)
    this.height = height; // hauteur (nombre de lignes)
    this.maze = []; // matrice 2D représentant le labyrinthe (chaque cellule a un type)
    this.treasurePos = null; // position du trésor (sera [x,y])
    this.waypoints = []; // liste des points de passage (indices/hints)
    this.optimalPath = []; // chemin optimal (aller au trésor puis à la sortie)
    this.exitPos = null; // position de la sortie
    this.init(); // initialise la grille (transforme this.maze en matrice)
  }

  // Crée la grille initiale: chaque cellule est un mur non visité
  init() {
    // Crée un tableau de 'height' lignes, chaque ligne étant un tableau de 'width' cellules
    this.maze = Array(this.height)
      .fill()
      .map(
        () =>
          Array(this.width)
            .fill()
            .map(() => ({ type: "wall", visited: false })) // cellule: { type, visited }
      );
  }

  // Génère le labyrinthe via un backtracker itératif (pile)
  generate() {
    const stack = []; // pile pour l'algorithme de backtracking
    const startX = 1; // position de départ nominale (évite les bords)
    const startY = 1;

    // Marque la cellule de départ comme chemin et visitée
    this.maze[startY][startX] = { type: "path", visited: true };
    stack.push([startX, startY]); // empile la position de départ

    // Tant que la pile n'est pas vide, on creuse
    while (stack.length > 0) {
      const [x, y] = stack[stack.length - 1]; // sommet de la pile
      const neighbors = this.getUnvisitedNeighbors(x, y); // voisins non visités à 2 pas

      if (neighbors.length > 0) {
        // Choisir un voisin aléatoire non visité
        const [nx, ny] =
          neighbors[Math.floor(Math.random() * neighbors.length)];
        // calculer la position du mur intermédiaire (à mi-chemin)
        const wallX = x + (nx - x) / 2;
        const wallY = y + (ny - y) / 2;

        // Creuser la cellule cible et le mur intermédiaire (les rendre praticables)
        this.maze[ny][nx] = { type: "path", visited: true };
        this.maze[wallY][wallX] = { type: "path", visited: true };
        // Avancer: empiler la nouvelle cellule
        stack.push([nx, ny]);
      } else {
        // Aucun voisin non visité: backtrack (retirer le sommet)
        stack.pop();
      }
    }

    // Après génération du squelette, ajouter obstacles/éléments spéciaux et calculer le chemin optimal
    this.addObstacles();
    this.addSpecialElements();
    this.calculateOptimalPath();
  }

  // Retourne les voisins non visités à 2 cases de distance (utilisé pour creuser)
  getUnvisitedNeighbors(x, y) {
    const neighbors = [];
    // Déplacements en 'sauts' de 2 pour franchir la structure mur/chemin
    const directions = [
      [0, -2],
      [2, 0],
      [0, 2],
      [-2, 0],
    ];

    for (const [dx, dy] of directions) {
      const nx = x + dx; // coordonnée candidate
      const ny = y + dy;

      // S'assurer que c'est dans l'intérieur de la grille et non visité
      if (
        nx > 0 &&
        nx < this.width - 1 &&
        ny > 0 &&
        ny < this.height - 1 &&
        !this.maze[ny][nx].visited
      ) {
        neighbors.push([nx, ny]); // ajouter aux voisins possibles
      }
    }
    return neighbors;
  }

  // Emplacement prévu pour ajouter des obstacles (arbres, rochers...) si souhaité
  addObstacles() {
    // Fonction conservée pour futurs obstacles
  }

  // Place le trésor, la sortie et marque la cellule de départ
  addSpecialElements() {
    const pathCells = []; // toutes les cellules praticables (type === 'path')

    // Collecte des cellules praticables internes (on évite les bords)
    for (let y = 1; y < this.height - 1; y++) {
      for (let x = 1; x < this.width - 1; x++) {
        if (this.maze[y][x].type === "path") {
          pathCells.push([x, y]);
        }
      }
    }

    // Si trop peu de chemins, on abandonne (labyrinthe trop petit)
    if (pathCells.length < 5) return;

    // Trouver une position éloignée du départ pour le trésor (heuristique: distance Manhattan)
    const start = [1, 1];
    let treasurePos = null;
    let maxDist = 0;

    for (const cell of pathCells) {
      const dist = Math.abs(cell[0] - start[0]) + Math.abs(cell[1] - start[1]);
      if (dist > maxDist) {
        maxDist = dist;
        treasurePos = cell; // conserver la cellule la plus éloignée
      }
    }

    // Enregistrer et marquer le trésor (état caché)
    this.treasurePos = treasurePos;
    this.maze[treasurePos[1]][treasurePos[0]].type = "treasure-hidden";

    // Déterminer une sortie proche du coin bas-droit en cherchant dans une zone près du bord
    const exitCandidates = [];
    for (let y = Math.max(1, this.height - 6); y < this.height - 1; y++) {
      for (let x = Math.max(1, this.width - 6); x < this.width - 1; x++) {
        if (this.maze[y][x].type === "path") {
          exitCandidates.push([x, y]);
        }
      }
    }

    if (exitCandidates.length > 0) {
      // Choisir le candidat le plus proche du coin (heuristique: plus petite somme des distances aux bords)
      let bestExit = exitCandidates[0];
      let minDistToCorner =
        this.width - 1 - bestExit[0] + (this.height - 1 - bestExit[1]);

      for (const candidate of exitCandidates) {
        const distToCorner =
          this.width - 1 - candidate[0] + (this.height - 1 - candidate[1]);
        if (distToCorner < minDistToCorner) {
          minDistToCorner = distToCorner;
          bestExit = candidate;
        }
      }

      this.exitPos = bestExit; // position choisie pour la sortie
      this.maze[bestExit[1]][bestExit[0]].type = "exit"; // marquer la cellule comme sortie
    }

    // Marquer explicitement la cellule de départ
    this.maze[1][1].type = "start";
  }

  // Calcule le chemin optimal: départ -> trésor -> sortie, puis place des waypoints
  calculateOptimalPath() {
    const solver = new AStar(this.maze); // instance de pathfinding
    const start = [1, 1];
    const treasure = this.treasurePos;

    // Trouver chemin vers le trésor puis vers la sortie
    const pathToTreasure = solver.findPath(start, treasure);
    const pathToExit = solver.findPath(treasure, this.exitPos);

    if (pathToTreasure && pathToExit) {
      const fullPath = pathToTreasure.concat(pathToExit.slice(1)); // concat sans dupliquer le trésor
      this.optimalPath = fullPath; // sauvegarde du chemin optimal

      // Placer 3 waypoints utiles sur le bon chemin, et 2 leurres ailleurs
      this.placeGoodwaypoints(fullPath);
      this.placeBadwaypoints(fullPath);
    }
  }

  // Place 3 waypoints 'bons' le long du chemin optimal
  placeGoodwaypoints(fullPath) {
    const pathLength = fullPath.length; // longueur du chemin optimal
    const waypointPositions = [];

    // Calculer trois indices espacés le long du chemin
    for (let i = 1; i <= 3; i++) {
      const index = Math.floor((pathLength * i) / 4); // diviser en 4 segments donne 3 points
      if (index < pathLength && index > 0) {
        waypointPositions.push(index);
      }
    }

    // Pour chaque index calculé, marquer la cellule et ajouter le waypoint avec son hint
    for (let i = 0; i < waypointPositions.length; i++) {
      const index = waypointPositions[i];
      const [x, y] = fullPath[index];

      if (this.maze[y][x].type === "path") {
        this.maze[y][x].type = "waypoint"; // style visuel

        let hint = this.getGoodDirectionHint(fullPath, index); // indice utile aléatoire

        this.waypoints.push({
          pos: [x, y], // position du waypoint
          hint: hint, // texte de l'indice
          used: false, // état si déjà consulté
          isGood: true, // marqueur logique pour savoir si c'est un bon chemin
        });
      }
    }
  }

  // Place 2 waypoints 'mauvais' (leurres) en dehors du chemin optimal
  placeBadwaypoints(fullPath) {
    const pathCells = [];
    // Collecte des cellules praticables qui ne font pas partie du chemin optimal
    for (let y = 1; y < this.height - 1; y++) {
      for (let x = 1; x < this.width - 1; x++) {
        if (this.maze[y][x].type === "path") {
          const isOnOptimalPath = fullPath.some(
            (pos) => pos[0] === x && pos[1] === y
          );
          if (!isOnOptimalPath) {
            pathCells.push([x, y]);
          }
        }
      }
    }

    // Placer jusqu'à 2 waypoints leurres choisis aléatoirement
    for (let i = 0; i < 2 && pathCells.length > 0; i++) {
      const randomIndex = Math.floor(Math.random() * pathCells.length);
      const [x, y] = pathCells[randomIndex];
      pathCells.splice(randomIndex, 1); // retirer pour éviter doublons

      this.maze[y][x].type = "waypoint"; // marquer visuellement

      let badHint = this.getBadDirectionHint(); // indice trompeur

      this.waypoints.push({
        pos: [x, y],
        hint: badHint,
        used: false,
        isGood: false, // marqueur indiquant que ce waypoint est trompeur
      });
    }
  }

  // Retourne un indice 'utile' choisi aléatoirement (ton médiéval humoristique)
  getGoodDirectionHint(path, currentIndex) {
    const goodHints = [
      "Morbleu ! Même un bourrin irait par là, continue !",
      "Par ma barbe crasseuse ! Ton instinct de bouseux ne ment pas !",
      "Le trésor roupille pas loin, marche donc, maraudeur !",
      "Ma foi ! T’es sur le bon fumier, vas-y avant qu’ça refroidisse !",
      "Ventrebleu ! Mes orteils moisis tressaillent, le trésor n'est plus loin !",
      "Ma parole, tu avances presque comme quelqu’un d’intelligent.",
      "Continue par là, et tâche de ne pas tout gâcher. Comme d’habitude.",
      "Le trésor est peut-être au bout… ou peut-être pas. Mais au moins, c’est le bon côté.",
      "Tu es sur la bonne voie. Étonnant, non ?",
      "Ce chemin mène quelque part… ce qui est déjà mieux que toi.",
      "Incroyable ! Tu n’as pas encore fait fausse route. Savoure l’instant.",
    ];

    return goodHints[Math.floor(Math.random() * goodHints.length)];
  }

  // Retourne un indice trompeur / humoristique pour les mauvais chemins
  getBadDirectionHint() {
    const badHints = [
      "Brillant. Tu t’engouffres dans un cul-de-sac avec toute la grâce d’une chèvre ivre.",
      "Ce chemin ? Oui, parfait… si tu voulais mourir idiot et oublié.",
      "Ah, l’art de se tromper avec assurance. Magnifique démonstration.",
      "Par là ? Certainement, si tu rêves de contempler des murs.",
      "Ce passage ne mène nulle part. Comme tes ambitions.",
      "Tu insistes… Voilà qui prouve que l’entêtement n’est pas du courage.",
      "Ce sentier est aussi prometteur qu’une dîme non payée.",
      "Encore une erreur. On devrait inscrire ton nom sur la carte comme avertissement.",
      "Va donc, champion du faux pas, il n’y a que la honte au bout.",
      "Sublime ! Tu explores le néant avec un enthousiasme admirable.",
    ];

    return badHints[Math.floor(Math.random() * badHints.length)];
  }

  // Méthode wrapper: pour compatibilité, renvoie un indice utile
  getDirectionHint(path, currentIndex) {
    return this.getGoodDirectionHint(path, currentIndex);
  }

  // Renvoie la matrice du labyrinthe (lecture seule recommandée)
  getMaze() {
    return this.maze;
  }
}

// Classe A* (recherche de chemin) utilisée pour trouver des chemins dans la grille
class AStar {
  constructor(maze) {
    this.maze = maze; // référence à la matrice du labyrinthe
    this.width = maze[0].length; // largeur
    this.height = maze.length; // hauteur
  }

  // Heuristique Manhattan pour A* (sans diagonales)
  heuristic(a, b) {
    return Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]);
  }

  // Renvoie les voisins praticables (path, start, treasure-hidden, waypoint, exit)
  getNeighbors(x, y) {
    const neighbors = [];
    const directions = [
      [0, 1],
      [1, 0],
      [0, -1],
      [-1, 0],
    ];

    for (const [dx, dy] of directions) {
      const nx = x + dx;
      const ny = y + dy;

      if (nx >= 0 && nx < this.width && ny >= 0 && ny < this.height) {
        const cellType = this.maze[ny][nx].type;
        if (
          cellType === "path" ||
          cellType === "start" ||
          cellType === "treasure-hidden" ||
          cellType === "waypoint" ||
          cellType === "exit"
        ) {
          neighbors.push([nx, ny]);
        }
      }
    }
    return neighbors;
  }

  // Implémentation simple d'A* pour retourner un chemin de 'start' à 'goal' (ou null)
  findPath(start, goal) {
    const openSet = [start]; // ensemble ouvert (liste)
    const cameFrom = new Map(); // pour reconstruire le chemin
    const gScore = new Map(); // coût du départ jusqu'à ce nœud
    const fScore = new Map(); // gScore + heuristique
    const key = (pos) => `${pos[0]},${pos[1]}`; // clé string pour les maps

    gScore.set(key(start), 0);
    fScore.set(key(start), this.heuristic(start, goal));

    while (openSet.length > 0) {
      let current = openSet[0];
      let currentIndex = 0;

      // Trouver le nœud avec le plus petit fScore dans openSet
      for (let i = 1; i < openSet.length; i++) {
        if (fScore.get(key(openSet[i])) < fScore.get(key(current))) {
          current = openSet[i];
          currentIndex = i;
        }
      }

      // Si on est arrivé à la cible, reconstruire le chemin
      if (current[0] === goal[0] && current[1] === goal[1]) {
        const path = [];
        let temp = current;

        while (temp) {
          path.unshift(temp); // insère en tête pour reconstruire du départ vers l'arrivée
          temp = cameFrom.get(key(temp));
        }

        return path;
      }

      // Retirer current de openSet
      openSet.splice(currentIndex, 1);
      const neighbors = this.getNeighbors(current[0], current[1]);

      for (const neighbor of neighbors) {
        const tentativeGScore = gScore.get(key(current)) + 1; // coût uniforme = 1

        if (
          !gScore.has(key(neighbor)) ||
          tentativeGScore < gScore.get(key(neighbor))
        ) {
          // Meilleur chemin trouvé vers 'neighbor'
          cameFrom.set(key(neighbor), current);
          gScore.set(key(neighbor), tentativeGScore);
          fScore.set(
            key(neighbor),
            tentativeGScore + this.heuristic(neighbor, goal)
          );

          // Ajouter neighbor à openSet s'il n'y est pas déjà
          if (
            !openSet.some(
              (pos) => pos[0] === neighbor[0] && pos[1] === neighbor[1]
            )
          ) {
            openSet.push(neighbor);
          }
        }
      }
    }

    // Pas de chemin trouvé
    return null;
  }
}

// Classe de gestion de la partie : rendu, état du joueur et interactions
class MazeGame {
  constructor() {
    this.maze = null; // référence à la grille actuelle
    this.generator = null; // instance de MazeGenerator utilisée
    this.playerPos = [1, 1]; // position du joueur
    this.steps = 0; // compteur de pas
    this.waypointsCrossed = 0; // nombre de waypoints visités
    this.hasTreasure = false; // drapeau si le trésor a été pris
    this.gameWon = false; // drapeau de victoire
    this.visitedCells = new Set(); // ensemble des cellules visitées (clé 'x,y')
  }

  // Initialise et génère un labyrinthe à partir des valeurs du DOM
  generateMaze() {
    const width = parseInt(document.getElementById("width").value);
    const height = parseInt(document.getElementById("height").value);

    // Forcer dimensions impaires pour garder la structure murs/chemins
    const actualWidth = width % 2 === 0 ? width + 1 : width;
    const actualHeight = height % 2 === 0 ? height + 1 : height;

    this.generator = new MazeGenerator(actualWidth, actualHeight);
    this.generator.generate(); // exécute l'algorithme de génération
    this.maze = this.generator.getMaze(); // récupère la matrice générée

    // Réinitialiser état joueur et rendre le labyrinthe
    this.resetGame();
    this.renderMaze();
    this.updateStats();
  }

  // Met à jour les éléments d'interface affichant l'état du joueur
  updateStats() {
    const posEl = document.getElementById("position");
    if (posEl)
      posEl.textContent = `(${this.playerPos[0]}, ${this.playerPos[1]})`;
    const stepsEl = document.getElementById("steps");
    if (stepsEl) stepsEl.textContent = this.steps; // nombre de pas
    const waypointsEl = document.getElementById("waypoints");
    if (waypointsEl) waypointsEl.textContent = this.waypointsCrossed;
    // statut du trésor : texte différent selon hasTreasure
    document.getElementById("treasure-status").textContent = this.hasTreasure
      ? "Récupéré, par ma foi !"
      : "Toujours planqué";
    // statut général de la partie
    document.getElementById("status").textContent = this.gameWon
      ? "Mission accomplie !"
      : "En galère";
  }

  // Dessine la grille dans le DOM (élément #maze)
  renderMaze() {
    const mazeDiv = document.getElementById("maze");
    mazeDiv.innerHTML = ""; // vider le conteneur
    // définir le nombre de colonnes CSS grid en fonction de la largeur
    mazeDiv.style.gridTemplateColumns = `repeat(${this.maze[0].length}, 25px)`;

    for (let y = 0; y < this.maze.length; y++) {
      for (let x = 0; x < this.maze[0].length; x++) {
        const cell = document.createElement("div");
        cell.className = `cell ${this.maze[y][x].type}`; // classes CSS : cell + type
        cell.dataset.x = x; // stocker coordonnée pour sélecteurs
        cell.dataset.y = y;

        // Affichage d'icônes pour quelques types spéciaux
        if (this.maze[y][x].type === "start") {
          cell.textContent = "🏰"; // symbole du départ
        } else if (this.maze[y][x].type === "exit") {
          cell.textContent = "🚪"; // symbole de sortie
        } else if (this.maze[y][x].type === "treasure-found") {
          cell.textContent = "💰"; // trésor récupéré
        }

        // Si le joueur est sur cette cellule, afficher le joueur
        if (x === this.playerPos[0] && y === this.playerPos[1]) {
          cell.classList.add("player");
          cell.textContent = "👑"; // icône du joueur
        }

        // Marquer visuellement les cellules déjà visitées
        if (this.visitedCells.has(`${x},${y}`)) {
          cell.classList.add("visited");
        }

        // Cliquer sur une cellule tente de déplacer le joueur vers elle (si adjacente)
        cell.addEventListener("click", () => this.movePlayer(x, y));
        mazeDiv.appendChild(cell);
      }
    }
  }

  // Tentative de déplacement initiée par un clic (ou autre)
  movePlayer(targetX, targetY) {
    const dx = Math.abs(targetX - this.playerPos[0]);
    const dy = Math.abs(targetY - this.playerPos[1]);

    // Autoriser uniquement les déplacements orthogonaux d'une case
    if ((dx === 1 && dy === 0) || (dx === 0 && dy === 1)) {
      this.attemptMove(targetX, targetY);
    }
  }

  // Effectue réellement le déplacement si la cellule est praticable
  attemptMove(x, y) {
    const cellType = this.maze[y][x].type; // type de la cellule cible

    // Les murs bloquent le passage
    if (cellType === "wall") {
      return;
    }

    // Mettre à jour la position du joueur et marquer la visite
    this.playerPos = [x, y];
    this.steps++;
    this.visitedCells.add(`${x},${y}`);

    // Si c'est un waypoint, trouver l'objet waypoint correspondant et appliquer l'effet
    if (cellType === "waypoint") {
      const waypoint = this.generator.waypoints.find(
        (b) => b.pos[0] === x && b.pos[1] === y && !b.used
      );

      if (waypoint) {
        waypoint.used = true; // marquer comme consulté
        this.waypointsCrossed++;
        this.showMessage(waypoint.hint); // afficher le texte de l'indice
      }
    }

    // Si c'est le trésor caché, déclencher la routine de ramassage
    if (cellType === "treasure-hidden" && !this.hasTreasure) {
      this.showTreasureFound(x, y);
      return; // on arrête le flot normal (le trésor a son propre flow)
    }

    // Si c'est la sortie et que le joueur a le trésor, victoire
    if (cellType === "exit" && this.hasTreasure) {
      this.gameWon = true;
      this.showExitMessage();
      return;
    }

    // Redessiner et mettre à jour l'UI
    this.renderMaze();
    this.updateStats();
  }

  // Gère la collecte du trésor: change l'état et affiche une confirmation
  showTreasureFound(x, y) {
    this.maze[y][x].type = "treasure-found"; // marquer visuellement le trésor ramassé
    this.renderMaze();

    // Demander confirmation à l'utilisateur via confirm browser
    if (
      confirm("💰 Maugrebleu ! Le trésor ! Cliquez pour l'empocher, maroufle !")
    ) {
      this.hasTreasure = true;
      this.showMessage(
        "✅ Trésor empoché ! Filez vers la sortie avant qu'on vous pende ! 🚪"
      );
      this.updateStats();
    }
  }

  // Message de victoire et transition vers l'écran de fin
  showExitMessage() {
    this.showMessage(
      "🎉 Par tous les saints ! Vous avez échappé à ce cloaque ! Mission accomplie, maraud !"
    );
    // Afficher l'écran de fin après un court délai
    setTimeout(() => {
      this.showGameOver();
    }, 1500);
  }

  // Affiche un message temporaire flottant sur l'écran
  showMessage(message) {
    const existingMsg = document.getElementById("temp-message");
    if (existingMsg) {
      existingMsg.remove(); // supprimer l'ancien message s'il existe
    }

    const msgDiv = document.createElement("div");
    msgDiv.id = "temp-message";
    // Styles inline pour le panneau de message (thème médiéval)
    msgDiv.style.cssText = `
                    position: fixed;
                    top: 20px;
                    left: 50%;
                    transform: translateX(-50%);
                    background: linear-gradient(45deg, #3e2723, #654321, #8b4513);
                    color: #d2b48c;
                    padding: 15px 30px;
                    border-radius: 15px;
                    font-weight: bold;
                    font-family: 'Uncial Antiqua', cursive;
                    z-index: 1000;
                    box-shadow: 0 8px 25px rgba(0,0,0,0.7);
                    border: 2px solid #8b4513;
                    max-width: 80%;
                    text-align: center;
                `;
    msgDiv.textContent = message; // texte du message
    document.body.appendChild(msgDiv);

    // Supprimer le message après 4 secondes
    setTimeout(() => {
      if (msgDiv) msgDiv.remove();
    }, 4000);
  }

  // Gestion des flèches du clavier pour déplacer le joueur
  handleKeyPress(event) {
    if (this.gameWon) return; // bloquer les entrées si la partie est terminée

    let newX = this.playerPos[0];
    let newY = this.playerPos[1];

    switch (event.key) {
      case "ArrowUp":
        newY--;
        break;
      case "ArrowDown":
        newY++;
        break;
      case "ArrowLeft":
        newX--;
        break;
      case "ArrowRight":
        newX++;
        break;
      default:
        return; // ignorer les autres touches
    }

    event.preventDefault(); // empêcher le scroll de la page

    // Vérifier que la nouvelle position est à l'intérieur de la grille
    if (
      newX >= 0 &&
      newX < this.maze[0].length &&
      newY >= 0 &&
      newY < this.maze.length
    ) {
      this.attemptMove(newX, newY);
    }
  }

  // Met en évidence le chemin optimal dans l'UI (teinte rose)
  showOptimalPath() {
    if (!this.generator || !this.generator.optimalPath) return;

    const pathCells = document.querySelectorAll(".optimal-path");
    pathCells.forEach((cell) => cell.classList.remove("optimal-path")); // nettoyer anciens marquages

    this.generator.optimalPath.forEach((pos) => {
      const cell = document.querySelector(
        `[data-x="${pos[0]}"][data-y="${pos[1]}"]`
      );
      if (cell) {
        cell.style.background = "rgba(255, 105, 180, 0.6)"; // appliquer teinte
      }
    });
  }

  // Réinitialise l'état de la partie (sans régénérer le labyrinthe)
  resetGame() {
    this.playerPos = [1, 1];
    this.steps = 0;
    this.waypointsCrossed = 0;
    this.hasTreasure = false;
    this.gameWon = false;
    this.visitedCells.clear();

    // Nettoyer l'affichage (suppression des surlignages)
    const pathCells = document.querySelectorAll(".cell");
    pathCells.forEach((cell) => {
      cell.style.background = "";
      cell.classList.remove("optimal-path");
    });
  }

  // Affiche l'écran de fin avec les statistiques
  showGameOver() {
    document.getElementById("final-steps").textContent = this.steps;
    const finalWaypoints = document.getElementById("final-waypoints");
    if (finalWaypoints) finalWaypoints.textContent = this.waypointsCrossed;
    document.getElementById("gameOver").style.display = "block"; // montrer la modal/fenêtre de fin
  }

  // Ferme la fenêtre de fin de partie
  closeGameOver() {
    document.getElementById("gameOver").style.display = "none";
  }
}

// Instance globale du gestionnaire de jeu
const game = new MazeGame();

// Fonctions utilitaires d'interface qui délèguent à l'instance 'game'
function generateMaze() {
  game.generateMaze();
}

function showOptimalPath() {
  game.showOptimalPath();
}

function resetGame() {
  game.resetGame();
  game.renderMaze();
  game.updateStats();
}

function closeGameOver() {
  game.closeGameOver();
}

// Liaison d'événement: touches du clavier -> contrôle du joueur
document.addEventListener("keydown", (e) => game.handleKeyPress(e));
// Au chargement de la page, générer automatiquement un labyrinthe
window.onload = () => {
  initLeaflet();
  // ne pas appeler generateMaze() automatiquement ; startGame() le fera quand l'utilisateur clique
};

// Coordonnées par défaut pour Kamelott (remplacez par vos coordonnées souhaitées)
const KAMELOTT_CENTER = [48.8566, 2.3522]; // lat, lng (ex : Paris - changez)

// génère n points aléatoires autour d'un centre (rayon en degrés (~0.01 ≈ 1km))
function randPointsAround(center, radiusDeg, n) {
  const pts = [];
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = Math.sqrt(Math.random()) * radiusDeg;
    const lat = center[0] + r * Math.cos(a);
    const lng = center[1] + r * Math.sin(a);
    pts.push([lat, lng]);
  }
  return pts;
}

function initLeaflet() {
  // créer la carte et la couche tuiles
  const map = L.map("map").setView(KAMELOTT_CENTER, 13);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "© OpenStreetMap contributors",
  }).addTo(map);

  // Marker Kamelott
  L.marker(KAMELOTT_CENTER)
    .addTo(map)
    .bindPopup("<b>Kamelott</b><br>Royaume des gueux")
    .openPopup();

  // 3 points de passage aléatoires + hints rustiques oui/non
  const points = randPointsAround(KAMELOTT_CENTER, 0.02, 3); // ~2km rayon
  const yes = [
    "Le tavernier dit oui.",
    "Un berger hoche la tête : oui.",
    "Par la barbe du roi : oui.",
  ];
  const no = [
    "Le corbeau ricane : non.",
    "Une vieille dit non.",
    "Le forgeron gronde : non.",
  ];
  points.forEach((p, i) => {
    const positive = Math.random() < 0.5;
    const hint = positive
      ? yes[Math.floor(Math.random() * yes.length)]
      : no[Math.floor(Math.random() * no.length)];
    L.marker(p)
      .addTo(map)
      .bindPopup(
        `<b>Point de passage ${i + 1}</b><br>${hint} (${
          positive ? "oui" : "non"
        })`
      );
  });

  // Marker 'Entrée du labyrinthe Maze'Lot' (exemple : légèrement au sud-est du centre)
  const entry = [KAMELOTT_CENTER[0] - 0.01, KAMELOTT_CENTER[1] + 0.01];
  L.marker(entry)
    .addTo(map)
    .bindPopup(
      "<b>Entrée du labyrinthe Maze'Lot</b><br>Fort crasseux, bonne chance !"
    );
}

// Exposer certaines fonctions globalement pour que les attributs onclick inline dans
// `index.html` fonctionnent même si ce fichier est chargé comme module.
window.startGame = startGame;
window.generateMaze = generateMaze;
window.showOptimalPath = showOptimalPath;
window.resetGame = resetGame;
window.closeGameOver = closeGameOver;
