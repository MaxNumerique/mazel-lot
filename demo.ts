import { Outdoor } from "./Outdoor.js";

// Récupère le canvas HTML
const canvas = document.getElementById("mazeCanvas") as HTMLCanvasElement;
// Récupère le contexte 2D pour dessiner
const ctx = canvas.getContext("2d")!;

// Crée un labyrinthe de 35x35 cellules
const outdoor = new Outdoor(35, 35);
// Calcul de la taille de chaque cellule pour que le labyrinthe remplisse le canvas
const cellSize = canvas.width / outdoor.width;

// Fonction principale asynchrone pour la génération et l'affichage
(async () => {
    // Génération animée du labyrinthe (DFS)
    await outdoor.generateMazeAnimated(ctx, cellSize, 20);

    // Exploration animée du BFS pour trouver le chemin le plus court et le mettre en surbrillance
    await outdoor.visualizeBFS(ctx, cellSize, 30);
})();
