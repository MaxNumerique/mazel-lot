// Classe représentant une cellule de la grille
export class Cell {
    constructor(x, y) {
        this.x = x; // initialisation de la coordonnée x
        this.y = y; // initialisation de la coordonnée y
        this.isStart = false; // par défaut, pas départ
        this.isEnd = false; // par défaut, pas arrivée
        this.isCheckpoint = false; // par défaut, pas checkpoint
        this.isVisited = false; // par défaut, non visitée
        this.isWall = false; // par défaut, non mur
    }
}
//# sourceMappingURL=Cell.js.map