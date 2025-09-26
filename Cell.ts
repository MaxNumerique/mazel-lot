// Classe représentant une cellule de la grille
export class Cell {
    public x: number; // coordonnée x dans la grille
    public y: number; // coordonnée y dans la grille
    public isStart: boolean; // vrai si la cellule est le départ
    public isEnd: boolean; // vrai si la cellule est l'arrivée
    public isCheckpoint: boolean; // vrai si la cellule est un checkpoint
    public isVisited: boolean; // vrai si la cellule a été visitée par l'algorithme
    public isWall: boolean; // vrai si la cellule est un mur

    constructor(x: number, y: number) {
        this.x = x; // initialisation de la coordonnée x
        this.y = y; // initialisation de la coordonnée y
        this.isStart = false; // par défaut, pas départ
        this.isEnd = false; // par défaut, pas arrivée
        this.isCheckpoint = false; // par défaut, pas checkpoint
        this.isVisited = false; // par défaut, non visitée
        this.isWall = false; // par défaut, non mur
    }
}
