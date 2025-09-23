import { createInitialState, initializeGridOne } from './model/state.js';
import { drawGrid } from './render/canvasRenderer.js';
import { updateStatusLabels, computeNextSegmentPath, confirmSegmentAndAdvance, resetAll } from './ui/uiController.js';

const gridCanvas = document.getElementById('gridCanvas');
const gridCanvasContext = gridCanvas.getContext('2d');

const computeSegmentButton = document.getElementById('computeSegmentButton');
const confirmSegmentButton = document.getElementById('confirmSegmentButton');
const resetAllButton = document.getElementById('resetAllButton');

const gridTypeLabel = document.getElementById('gridTypeLabel');
const stepLabel = document.getElementById('stepLabel');
const targetLabel = document.getElementById('targetLabel');

const domRefs = { gridTypeLabel, stepLabel, targetLabel };

const state = createInitialState();
initializeGridOne(state);
drawGrid(state, gridCanvas, gridCanvasContext);
updateStatusLabels(state, domRefs);

computeSegmentButton.addEventListener('click', () => {
  computeNextSegmentPath(state, gridCanvas, gridCanvasContext, domRefs);
});
confirmSegmentButton.addEventListener('click', () => {
  confirmSegmentAndAdvance(state, gridCanvas, gridCanvasContext, domRefs);
});
resetAllButton.addEventListener('click', () => {
  resetAll(state, gridCanvas, gridCanvasContext, domRefs);
});