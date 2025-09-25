// Cell.ts
export class Cell {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.isStart = false;
        this.isEnd = false;
        this.isCheckpoint = false;
        this.isVisited = false;
        this.isWall = false;
    }
}
