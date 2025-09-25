// Outdoor.ts
import { Cell } from "./Cell.js";
// On importe la classe Cell qui représente chaque case de la grille
export class Outdoor {
  // Références vers la cellule de départ et d'arrivée
  // null signifie qu'elles ne sont pas encore définies
  constructor(width, height) {
    // Largeur et hauteur de la grille
    this.startCell = null;
    this.endCell = null;
    this.width = width;
    this.height = height;
    this.grid = []; // Initialisation du tableau principal
    // Création de la grille avec des objets Cell
    for (let y = 0; y < height; y++) {
      const row = []; // Nouvelle ligne
      for (let x = 0; x < width; x++) {
        row.push(new Cell(x, y));
        // On crée une cellule pour chaque position (x, y)
      }
      this.grid.push(row);
      // On ajoute la ligne complète à la grille
    }
  }
  isInside(x, y) {
    // Vérifie si les coordonnées sont à l'intérieur de la grille
    return x >= 0 && x < this.width && y >= 0 && y < this.height;
  }
  getGrid() {
    return this.grid;
    // Renvoie la grille complète
  }
  setStart(x, y) {
    if (!this.isInside(x, y)) return;
    // On ne fait rien si les coordonnées sont hors grille
    if (this.startCell) this.startCell.isStart = false;
    // Si une cellule de départ existait, on la "désactive"
    const cell = this.grid[y][x];
    if (!cell.isWall) {
      // On ne peut pas définir le départ sur un mur
      cell.isStart = true;
      this.startCell = cell;
      // On mémorise la nouvelle cellule de départ
    }
  }
  setEnd(x, y) {
    if (!this.isInside(x, y)) return;
    // On ne fait rien si hors grille
    if (this.endCell) this.endCell.isEnd = false;
    // Si une cellule d'arrivée existait, on la "désactive"
    const cell = this.grid[y][x];
    if (!cell.isWall) {
      // On ne peut pas mettre l'arrivée sur un mur
      cell.isEnd = true;
      this.endCell = cell;
      // On mémorise la nouvelle cellule d'arrivée
    }
  }
  addCheckpoint(x, y) {
    if (this.isInside(x, y)) {
      const cell = this.grid[y][x];
      if (!cell.isWall && !cell.isStart && !cell.isEnd) {
        // On ajoute un checkpoint seulement sur une cellule libre
        cell.isCheckpoint = true;
      }
    }
  }
  addWall(x, y) {
    if (this.isInside(x, y)) {
      const cell = this.grid[y][x];
      if (!cell.isStart && !cell.isEnd) {
        // On ne transforme pas le départ ou l'arrivée en mur
        cell.isWall = true;
      }
    }
  }
  generateMaze() {
    // Réinitialise toute la grille
    for (let row of this.grid) {
      for (let cell of row) {
        cell.isWall = true; // Tout devient mur
        cell.isVisited = false; // Marque non visitée pour l'algorithme DFS
        cell.isStart = false;
        cell.isEnd = false;
        cell.isCheckpoint = false;
      }
    }
    const stack = [];
    // Pile pour DFS, permet de revenir en arrière
    const start = this.grid[0][0];
    // On commence à la cellule en haut à gauche
    start.isWall = false; // Passage libre
    start.isVisited = true; // Marquée comme visitée
    this.startCell = start;
    start.isStart = true;
    stack.push(start);
    // On empile la cellule de départ pour commencer l'algorithme
    const directions = [
      [0, -1], // haut
      [1, 0], // droite
      [0, 1], // bas
      [-1, 0], // gauche
    ];
    // Les directions possibles pour se déplacer
    while (stack.length > 0) {
      const current = stack[stack.length - 1];
      // On regarde la cellule en haut de la pile (DFS)
      const neighbors = [];
      // On va collecter les voisins accessibles
      for (let [dx, dy] of directions) {
        const nx = current.x + dx * 2;
        const ny = current.y + dy * 2;
        // On saute 2 cellules pour laisser un mur entre les passages
        if (this.isInside(nx, ny) && !this.grid[ny][nx].isVisited) {
          neighbors.push(this.grid[ny][nx]);
          // On ajoute le voisin non visité
        }
      }
      if (neighbors.length > 0) {
        const next = neighbors[Math.floor(Math.random() * neighbors.length)];
        // On choisit un voisin aléatoire
        const wallX = current.x + (next.x - current.x) / 2;
        const wallY = current.y + (next.y - current.y) / 2;
        this.grid[wallY][wallX].isWall = false;
        // On supprime le mur entre current et next
        next.isWall = false; // Le voisin devient passage
        next.isVisited = true; // Marqué comme visité
        stack.push(next); // On avance dans ce voisin
      } else {
        stack.pop();
        // Si pas de voisins disponibles, on revient en arrière
      }
    }
    // Définir l'arrivée
    const end = this.grid[this.height - 1][this.width - 1];
    end.isEnd = true;
    end.isWall = false;
    this.endCell = end;
  }
  render() {
    // Affiche la grille dans la console
    for (let y = 0; y < this.height; y++) {
      let row = "";
      for (let x = 0; x < this.width; x++) {
        const cell = this.grid[y][x];
        if (cell.isStart) row += "S "; // Départ
        else if (cell.isEnd) row += "E "; // Arrivée
        else if (cell.isCheckpoint) row += "C "; // Checkpoint
        else if (cell.isWall) row += "# "; // Mur
        else row += ". "; // Passage libre
      }
      console.log(row); // Affiche la ligne
    }
  }
}
