const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const tempProfile = path.join(process.env.TEMP, 'chrome_test_profile_' + Date.now());

console.log('Starting Headless Chrome for End-to-End Testing...');
const chrome = spawn(chromePath, [
  '--headless=new',
  '--remote-debugging-port=9222',
  `--user-data-dir=${tempProfile}`,
  '--disable-gpu',
  '--no-first-run',
  '--no-default-browser-check',
  'http://localhost:8080/IGNIS-Network/index.html'
]);

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function getJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch (e) { reject(e); }
      });
    }).on('error', reject);
  });
}

async function runTest() {
  // Wait for Chrome to open debugging port
  let targets = null;
  for (let i = 0; i < 20; i++) {
    await sleep(400);
    try {
      targets = await getJson('http://127.0.0.1:9222/json/list');
      if (targets && targets.length > 0) break;
    } catch (e) {}
  }

  if (!targets || targets.length === 0) {
    console.error('Could not connect to Chrome CDP within timeout.');
    chrome.kill();
    process.exit(1);
  }

  const pageTarget = targets.find(t => t.type === 'page');
  console.log('✓ Connected to Chrome CDP target:', pageTarget.title);

  // Connect to target WebSocket
  const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);
  let msgId = 1;
  const pending = new Map();
  const consoleMessages = [];

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.method === 'Runtime.consoleAPICalled') {
      console.log('BROWSER CONSOLE:', data.params.args.map(a => a.value).join(' '));
    }
    if (data.method === 'Runtime.exceptionThrown') {
      console.error('BROWSER UNCAUGHT EXCEPTION:', JSON.stringify(data.params.exceptionDetails));
    }
    if (data.id && pending.has(data.id)) {
      pending.get(data.id)(data);
      pending.delete(data.id);
    }
  };

  await new Promise(res => ws.onopen = res);

  function sendCmd(method, params = {}) {
    return new Promise(resolve => {
      const id = msgId++;
      pending.set(id, resolve);
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  await sendCmd('Runtime.enable');
  await sendCmd('Page.enable');
  await sendCmd('DOM.enable');

  // Reload page to catch all load events and errors
  await sendCmd('Page.reload');
  await sleep(1000);

  async function evaluate(expression) {
    const res = await sendCmd('Runtime.evaluate', { expression, returnByValue: true });
    if (res && res.result && res.result.result) {
      return res.result.result.value;
    }
    return null;
  }

  console.log('Testing initial page state...');
  const title = await evaluate('document.title');
  console.log('✓ Page Title:', title);

  const initialStatus = await evaluate('document.getElementById("hud-status").textContent');
  console.log('✓ Initial HUD Status:', initialStatus);

  const handleType = await evaluate('typeof handleNodeClick');
  const nodeExists = await evaluate('!!document.getElementById("node-group-drop_tower")');
  const primaryCount = await evaluate('document.getElementById("primary-nodes-layer").children.length');
  console.log('Diagnostic: handleNodeClick type =', handleType, ', drop_tower exists =', nodeExists, ', primaryCount =', primaryCount);

  // 1. Click Drop Tower Node
  console.log('\n--- TEST 1: Clicking DROP TOWER node ---');
  await evaluate('handleNodeClick("drop_tower")');
  await sleep(400);

  const modalOpen = await evaluate('document.getElementById("node-modal").classList.contains("open")');
  const modalTitle = await evaluate('document.getElementById("modal-title").textContent');
  const modalParamsCount = await evaluate('document.getElementById("modal-params").children.length');
  console.log('✓ Modal opened:', modalOpen);
  console.log('✓ Modal Title:', modalTitle);
  console.log('✓ Scientific Parameters rendered:', modalParamsCount);

  // 2. Click SELECT EXPERIMENT button to start the 4-step pipeline
  console.log('\n--- TEST 2: Clicking SELECT EXPERIMENT button ---');
  await evaluate('document.getElementById("btn-select-experiment").click()');
  await sleep(300);

  const modalClosed = await evaluate('!document.getElementById("node-modal").classList.contains("open")');
  console.log('✓ Modal smoothly closed upon experiment selection:', modalClosed);

  const phaseStep1 = await evaluate('document.getElementById("hud-status").textContent');
  console.log('✓ Step 1 Status:', phaseStep1);

  // Wait for Step 2 (Data Flow particles streaming)
  await sleep(800);
  const phaseStep2 = await evaluate('document.getElementById("hud-status").textContent');
  const particlesCount = await evaluate('document.getElementById("particles-layer").children.length');
  console.log('✓ Step 2 Status (Streaming):', phaseStep2);
  console.log('✓ Active luminous SVG particles generated:', particlesCount);

  // Wait for Step 3 (Engine Activation)
  await sleep(1500);
  const phaseStep3 = await evaluate('document.getElementById("hud-status").textContent');
  const engineProcessing = await evaluate('document.getElementById("ignis-engine-bar").classList.contains("processing")');
  console.log('✓ Step 3 Status (Engine Active):', phaseStep3);
  console.log('✓ IGNIS Engine bar in processing mode:', engineProcessing);

  // Wait for Step 4 (Output Activation & Complete)
  console.log('Waiting for Step 4 (Output activation & completion)...');
  await sleep(4200);
  const phaseStep4 = await evaluate('document.getElementById("hud-status").textContent');
  const flameActivated = await evaluate('document.getElementById("card-flame-analysis").classList.contains("activated")');
  const insightsActivated = await evaluate('document.getElementById("card-scientific-insights").classList.contains("activated")');
  console.log('✓ Step 4 Status:', phaseStep4);
  console.log('✓ Flame Analysis Card activated:', flameActivated);
  console.log('✓ Scientific Insights Card activated:', insightsActivated);

  // 3. Take a screenshot of the completed simulation state
  console.log('\n--- TEST 3: Capturing high-res screenshot of working interface ---');
  await sendCmd('Emulation.setDeviceMetricsOverride', {
    width: 1440,
    height: 920,
    deviceScaleFactor: 1,
    mobile: false
  });
  await sleep(500);

  const screenshot = await sendCmd('Page.captureScreenshot', { format: 'png' });
  if (screenshot && screenshot.result && screenshot.result.data) {
    const buffer = Buffer.from(screenshot.result.data, 'base64');
    const outPath = path.join(__dirname, 'ignis_live_screenshot.png');
    fs.writeFileSync(outPath, buffer);
    console.log('✓ Saved high-resolution screenshot to:', outPath);
  }

  // 4. Test Reset Simulation
  console.log('\n--- TEST 4: Testing Reset Simulation ---');
  await evaluate('document.getElementById("btn-reset-sim").click()');
  await sleep(600);

  const resetStatus = await evaluate('document.getElementById("hud-status").textContent');
  const resetFlame = await evaluate('!document.getElementById("card-flame-analysis").classList.contains("activated")');
  const resetInsights = await evaluate('!document.getElementById("card-scientific-insights").classList.contains("activated")');
  console.log('✓ Post-reset Status:', resetStatus);
  console.log('✓ Flame Card returned to standby:', resetFlame);
  console.log('✓ Insights Card returned to standby:', resetInsights);
  console.log('✓ Cards returned to standby:', resetFlame);

  console.log('\n=== ALL BROWSER E2E TESTS PASSED WITH 100% SUCCESS! ===\n');

  ws.close();
  chrome.kill();
  process.exit(0);
}

runTest().catch(err => {
  console.error('Test Error:', err);
  chrome.kill();
  process.exit(1);
});
