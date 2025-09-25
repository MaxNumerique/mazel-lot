import { Outdoor } from "./Outdoor.js";
const outdoor = new Outdoor(25, 25);
outdoor.generateMaze(); // Génère le labyrinthe

const canvas = document.getElementById("mazeCanvas");
const ctx = canvas.getContext("2d");
if (!ctx) throw new Error("Canvas non supporté");
const cellSize = canvas.width / outdoor.width;
for (let y = 0; y < outdoor.height; y++) {
  let rowStr = ""; // pour le debug console
  for (let x = 0; x < outdoor.width; x++) {
    const cell = outdoor.grid[y][x];

    //Généraiton côté console
    if (cell.isWall) rowStr += "#";
    else if (cell.isStart) rowStr += "S";
    else if (cell.isEnd) rowStr += "E";
    else if (cell.isCheckpoint) rowStr += "C";
    else rowStr += ".";

    //Affichage sur le canvas
    if (cell.isWall) ctx.fillStyle = "black";
    else if (cell.isStart) ctx.fillStyle = "green";
    else if (cell.isEnd) ctx.fillStyle = "red";
    else if (cell.isCheckpoint) ctx.fillStyle = "gold";
    else ctx.fillStyle = "white";
    ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
  }
  console.log(rowStr); // affiche la ligne dans la console
}
