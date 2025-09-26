var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { Outdoor } from "./Outdoor.js";
// Récupère le canvas HTML
const canvas = document.getElementById("mazeCanvas");
// Récupère le contexte 2D pour dessiner
const ctx = canvas.getContext("2d");
// Crée un labyrinthe de 35x35 cellules
const outdoor = new Outdoor(35, 35);
// Calcul de la taille de chaque cellule pour que le labyrinthe remplisse le canvas
const cellSize = canvas.width / outdoor.width;
// Fonction principale asynchrone pour la génération et l'affichage
(() => __awaiter(void 0, void 0, void 0, function* () {
    // Génération animée du labyrinthe (DFS)
    yield outdoor.generateMazeAnimated(ctx, cellSize, 20);
    // Exploration animée du BFS pour trouver le chemin le plus court et le mettre en surbrillance
    yield outdoor.visualizeBFS(ctx, cellSize, 30);
}))();
//# sourceMappingURL=demo.js.map