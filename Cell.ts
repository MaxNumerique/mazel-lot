// Cell.ts
export class Cell {
  public x: number;
  public y: number;
  public isStart: boolean;
  public isEnd: boolean;
  public isCheckpoint: boolean;
  public isVisited: boolean;
  public isWall: boolean;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
    this.isStart = false;
    this.isEnd = false;
    this.isCheckpoint = false;
    this.isVisited = false;
    this.isWall = false;
  }
}
