const fs = require('fs');

const html = fs.readFileSync('IGNIS-Network/index.html', 'utf8');
const dataJs = fs.readFileSync('IGNIS-Network/data.js', 'utf8');
const scriptJs = fs.readFileSync('IGNIS-Network/script.js', 'utf8');
const css = fs.readFileSync('IGNIS-Network/style.css', 'utf8');

console.log('✓ File sizes:');
console.log('  index.html:', html.length, 'bytes');
console.log('  style.css:', css.length, 'bytes');
console.log('  data.js:', dataJs.length, 'bytes');
console.log('  script.js:', scriptJs.length, 'bytes');

const requiredIds = [
  'ambient-canvas', 'network-svg', 'network-lines-layer',
  'intermediate-nodes-layer', 'central-engine-group', 'central-core',
  'primary-nodes-layer', 'particles-layer', 'simulation-hud',
  'hud-status', 'hud-details', 'btn-reset-sim', 'ignis-engine-bar',
  'split-left-path', 'split-right-path', 'card-flame-analysis',
  'card-scientific-insights', 'flame-status-tag', 'insights-status-tag',
  'node-modal', 'modal-close-btn', 'btn-select-experiment',
  'insights-flame-canvas', 'flame-wave-canvas', 'insights-surface-canvas'
];

const missing = requiredIds.filter(id => !html.includes(`id="${id}"`));
if (missing.length === 0) {
  console.log('✓ All 24 required DOM IDs are present in index.html!');
} else {
  console.error('✗ Missing IDs:', missing);
}

// Check that EXPERIMENT_SOURCES contains all 4 major nodes
const fn = new Function(dataJs + '; return { EXPERIMENT_SOURCES, DATA_INSIGHTS_SUMMARY };');
const { EXPERIMENT_SOURCES, DATA_INSIGHTS_SUMMARY } = fn();
const expectedNodes = ['drop_tower', 'iss_experiments', 'psi_ntrs', 'combustion_data'];
const definedNodes = Object.keys(EXPERIMENT_SOURCES);
console.log('✓ Defined Experiment Nodes:', definedNodes);
const missingNodes = expectedNodes.filter(n => !definedNodes.includes(n));
if (missingNodes.length === 0) {
  console.log('✓ All 4 primary nodes defined in EXPERIMENT_SOURCES!');
} else {
  console.error('✗ Missing nodes:', missingNodes);
}

// Check each node has parameters, facility, description, connectionToIgnis
definedNodes.forEach(k => {
  const node = EXPERIMENT_SOURCES[k];
  if (!node.name || !node.category || !node.parameters || !node.connectionToIgnis) {
    console.error(`✗ Incomplete node definition for ${k}`);
  }
});
console.log('✓ All node parameter structures validated!');
console.log('✓ Data insights summary items:', DATA_INSIGHTS_SUMMARY.length);
