import { createInitialState, initializeGridOne } from './model/state.js';
import { createGridContainer, renderGrid } from './render/htmlRenderer.js';
import { updateStatusLabels, computeNextSegmentPath, confirmSegmentAndAdvance, resetAll } from './ui/uiController.js';

const gridContainer = document.getElementById('gridContainer') || createGridContainer();
if (!document.getElementById('gridContainer')) {
  document.querySelector('.canvasPanel').appendChild(gridContainer);
}

const computeSegmentButton = document.getElementById('computeSegmentButton');
const confirmSegmentButton = document.getElementById('confirmSegmentButton');
const resetAllButton = document.getElementById('resetAllButton');

const gridTypeLabel = document.getElementById('gridTypeLabel');
const stepLabel = document.getElementById('stepLabel');
const targetLabel = document.getElementById('targetLabel');

const domRefs = { gridTypeLabel, stepLabel, targetLabel };

const state = createInitialState();

// Initialisation asynchrone
async function initializeApp() {
  await initializeGridOne(state);
  renderGrid(state, gridContainer);
  updateStatusLabels(state, domRefs);
}

initializeApp();

computeSegmentButton.addEventListener('click', () => {
  computeNextSegmentPath(state, gridContainer, null, domRefs);
});
confirmSegmentButton.addEventListener('click', () => {
  confirmSegmentAndAdvance(state, gridContainer, null, domRefs);
});
resetAllButton.addEventListener('click', async () => { 
  await resetAll(state, gridContainer, null, domRefs);
});

window.gameState = state;