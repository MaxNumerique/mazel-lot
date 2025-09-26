var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { Cell } from "./Cell.js"; // On importe la classe Cell
// Classe représentant le labyrinthe complet
export class Outdoor {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.grid = []; // initialisation du tableau
        this.startCell = null;
        this.endCell = null;
        // Création de toutes les cellules
        for (let y = 0; y < height; y++) {
            const row = []; // nouvelle ligne
            for (let x = 0; x < width; x++) {
                row.push(new Cell(x, y)); // création d'une cellule
            }
            this.grid.push(row); // ajout de la ligne à la grille
        }
    }
    // Vérifie si les coordonnées sont dans la grille
    isInside(x, y) {
        return x >= 0 && x < this.width && y >= 0 && y < this.height;
    }
    // Définit la cellule de départ
    setStart(x, y) {
        if (!this.isInside(x, y))
            return; // ignore si hors grille
        if (this.startCell)
            this.startCell.isStart = false; // désactive ancien départ
        const cell = this.grid[y][x];
        if (!cell.isWall) {
            // ne peut pas être un mur
            cell.isStart = true; // marque comme départ
            this.startCell = cell; // mémorise
        }
    }
    // Définit la cellule d'arrivée
    setEnd(x, y) {
        if (!this.isInside(x, y))
            return;
        if (this.endCell)
            this.endCell.isEnd = false; // désactive ancien end
        const cell = this.grid[y][x];
        if (!cell.isWall) {
            cell.isEnd = true;
            this.endCell = cell;
        }
    }
    // Ajoute un checkpoint
    addCheckpoint(x, y) {
        if (this.isInside(x, y)) {
            const cell = this.grid[y][x];
            if (!cell.isWall && !cell.isStart && !cell.isEnd) {
                cell.isCheckpoint = true;
            }
        }
    }
    // Transforme une cellule en mur
    addWall(x, y) {
        if (this.isInside(x, y)) {
            const cell = this.grid[y][x];
            if (!cell.isStart && !cell.isEnd) {
                cell.isWall = true;
            }
        }
    }
    // Dessine une cellule sur le canvas
    drawCell(ctx, cell, size) {
        ctx.clearRect(cell.x * size, cell.y * size, size, size); // efface la cellule
        // Sol
        if (!cell.isWall) {
            const gradient = ctx.createLinearGradient(cell.x * size, cell.y * size, (cell.x + 1) * size, (cell.y + 1) * size);
            gradient.addColorStop(0, "#0a0a10");
            gradient.addColorStop(1, "#1a1a2e");
            ctx.fillStyle = gradient;
            ctx.fillRect(cell.x * size, cell.y * size, size, size);
        }
        // Mur
        if (cell.isWall) {
            const gradient = ctx.createLinearGradient(cell.x * size, cell.y * size, (cell.x + 1) * size, (cell.y + 1) * size);
            gradient.addColorStop(0, "#444");
            gradient.addColorStop(1, "#222");
            ctx.fillStyle = gradient;
            ctx.fillRect(cell.x * size, cell.y * size, size, size);
            ctx.strokeStyle = "#000"; // contour noir
            ctx.lineWidth = 1;
            ctx.strokeRect(cell.x * size, cell.y * size, size, size);
        }
        // Départ vert
        if (cell.isStart) {
            ctx.fillStyle = "#00ff44";
            ctx.shadowColor = "#0f0";
            ctx.shadowBlur = 15;
            ctx.fillRect(cell.x * size, cell.y * size, size, size);
            ctx.shadowBlur = 0;
        }
        // Arrivée rouge
        if (cell.isEnd) {
            ctx.fillStyle = "#ff4444";
            ctx.shadowColor = "#f00";
            ctx.shadowBlur = 20;
            ctx.fillRect(cell.x * size, cell.y * size, size, size);
            ctx.shadowBlur = 0;
        }
        // Checkpoint
        if (cell.isCheckpoint) {
            ctx.fillStyle = "#ffaa00";
            ctx.shadowColor = "#fa0";
            ctx.shadowBlur = 12;
            ctx.fillRect(cell.x * size, cell.y * size, size, size);
            ctx.shadowBlur = 0;
        }
    }
    // Génération animée du labyrinthe (DFS)
    generateMazeAnimated(ctx_1, cellSize_1) {
        return __awaiter(this, arguments, void 0, function* (ctx, cellSize, delay = 20) {
            // Met toutes les cellules en mur et non visitées
            for (let row of this.grid) {
                for (let cell of row) {
                    cell.isWall = true;
                    cell.isVisited = false;
                    cell.isStart = false;
                    cell.isEnd = false;
                    cell.isCheckpoint = false;
                }
            }
            const stack = [];
            const start = this.grid[0][0]; // départ
            start.isWall = false;
            start.isVisited = true;
            start.isStart = true;
            this.startCell = start;
            stack.push(start);
            const directions = [
                [0, -1],
                [1, 0],
                [0, 1],
                [-1, 0], // haut, droite, bas, gauche
            ];
            return new Promise((resolve) => {
                const step = () => {
                    if (stack.length === 0) {
                        // Définir la cellule d'arrivée
                        const end = this.grid[this.height - 1][this.width - 1];
                        end.isEnd = true;
                        end.isWall = false;
                        this.endCell = end;
                        resolve(); // génération finie
                        return;
                    }
                    const current = stack[stack.length - 1];
                    const neighbors = [];
                    // Cherche voisins non visités 2 cases plus loin
                    for (let [dx, dy] of directions) {
                        const nx = current.x + dx * 2;
                        const ny = current.y + dy * 2;
                        if (this.isInside(nx, ny) && !this.grid[ny][nx].isVisited) {
                            neighbors.push(this.grid[ny][nx]);
                        }
                    }
                    if (neighbors.length > 0) {
                        const next = neighbors[Math.floor(Math.random() * neighbors.length)];
                        const wallX = current.x + (next.x - current.x) / 2;
                        const wallY = current.y + (next.y - current.y) / 2;
                        this.grid[wallY][wallX].isWall = false; // supprime mur intermédiaire
                        next.isWall = false;
                        next.isVisited = true;
                        stack.push(next);
                    }
                    else
                        stack.pop(); // backtrack
                    // Dessin de toute la grille
                    for (let row of this.grid) {
                        for (let cell of row)
                            this.drawCell(ctx, cell, cellSize);
                    }
                    setTimeout(step, delay); // animation
                };
                step();
            });
        });
    }
    // BFS animé pour explorer et surligner le chemin
    // BFS animé pour trouver le chemin le plus court avec rectangles fins
    visualizeBFS(ctx_1, cellSize_1) {
        return __awaiter(this, arguments, void 0, function* (ctx, cellSize, delay = 30) {
            if (!this.startCell || !this.endCell)
                return;
            const queue = [
                { cell: this.startCell, parent: null },
            ];
            const visited = new Set();
            const parentMap = new Map();
            visited.add(this.startCell);
            parentMap.set(this.startCell, null);
            const directions = [
                [0, -1], // haut
                [1, 0], // droite
                [0, 1], // bas
                [-1, 0], // gauche
            ];
            const padding = cellSize * 0.2; // 20% de marge pour BFS plus fin
            return new Promise((resolve) => {
                const step = () => {
                    if (queue.length === 0) {
                        // Reconstruire le chemin final
                        const path = [];
                        let current = this.endCell;
                        while (current) {
                            path.push(current);
                            current = parentMap.get(current) || null;
                        }
                        path.reverse();
                        let i = 0;
                        const drawPath = () => {
                            if (i >= path.length) {
                                resolve();
                                return;
                            }
                            const cell = path[i];
                            if (!cell.isStart && !cell.isEnd) {
                                // Tracé final du chemin en cyan avec marge
                                ctx.fillStyle = "cyan";
                                ctx.fillRect(cell.x * cellSize + padding / 2, cell.y * cellSize + padding / 2, cellSize - padding, cellSize - padding);
                            }
                            i++;
                            setTimeout(drawPath, delay);
                        };
                        drawPath();
                        return;
                    }
                    const currentLevel = queue.length;
                    for (let i = 0; i < currentLevel; i++) {
                        const { cell } = queue.shift();
                        for (let [dx, dy] of directions) {
                            const nx = cell.x + dx;
                            const ny = cell.y + dy;
                            if (this.isInside(nx, ny)) {
                                const neighbor = this.grid[ny][nx];
                                if (!neighbor.isWall && !visited.has(neighbor)) {
                                    visited.add(neighbor);
                                    parentMap.set(neighbor, cell);
                                    queue.push({ cell: neighbor, parent: cell });
                                    if (!neighbor.isStart && !neighbor.isEnd) {
                                        // Exploration BFS plus fine
                                        ctx.fillStyle = "#222";
                                        ctx.fillRect(neighbor.x * cellSize + padding / 2, neighbor.y * cellSize + padding / 2, cellSize - padding, cellSize - padding);
                                    }
                                }
                            }
                        }
                    }
                    setTimeout(step, delay);
                };
                step();
            });
        });
    }
}
//# sourceMappingURL=Outdoor.js.map