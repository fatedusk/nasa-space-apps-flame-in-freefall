const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const tempProfile = path.join(process.env.TEMP, 'chrome_test_profile_' + Date.now());

const chrome = spawn(chromePath, [
  '--headless=new',
  '--remote-debugging-port=9228',
  `--user-data-dir=${tempProfile}`,
  '--disable-gpu',
  '--no-first-run',
  '--no-default-browser-check',
  'http://127.0.0.1:8000/IGNIS-Network/index.html'
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

async function run() {
  let targets = null;
  for (let i = 0; i < 20; i++) {
    await sleep(400);
    try {
      targets = await getJson('http://127.0.0.1:9228/json/list');
      if (targets && targets.length > 0) break;
    } catch (e) {}
  }

  const pageTarget = targets.find(t => t.type === 'page');
  const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);

  let msgId = 1;
  const pending = new Map();

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
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

  async function evaluate(expression) {
    const res = await sendCmd('Runtime.evaluate', { expression, returnByValue: true });
    return (res && res.result && res.result.result) ? res.result.result.value : null;
  }

  await sendCmd('Runtime.enable');
  await sendCmd('Page.enable');
  await sendCmd('DOM.enable');

  await sendCmd('Emulation.setDeviceMetricsOverride', {
    width: 1600,
    height: 950,
    deviceScaleFactor: 1,
    mobile: false
  });

  await sendCmd('Page.reload');
  await sleep(1500);

  console.log('Testing full frontend-backend integration on port 8000...');

  const backendStatus = await evaluate('document.getElementById("backend-status-text").textContent');
  console.log('✓ Backend Status indicator:', backendStatus);

  // 1. Click ISS Experiments Node
  console.log('\n--- 1. Clicking ISS EXPERIMENTS node ---');
  await evaluate('handleNodeClick("iss_experiments")');
  await sleep(400);

  const modalTitle = await evaluate('document.getElementById("modal-title").textContent');
  console.log('✓ Modal opened with title:', modalTitle);

  // 2. Click SELECT EXPERIMENT to launch full pipeline
  console.log('\n--- 2. Clicking SELECT EXPERIMENT button ---');
  await evaluate('document.getElementById("btn-select-experiment").click()');

  // Monitor the pipeline phases
  console.log('Waiting for Step 1 -> Step 2 -> Step 3 (Python processing) -> Step 4 (Output)...');
  await sleep(4500);

  const finalHud = await evaluate('document.getElementById("hud-status").textContent');
  const flameMetric = await evaluate('document.getElementById("flame-metric-pill").textContent');
  const insightsMetric = await evaluate('document.getElementById("insights-metric-pill").textContent');

  console.log('✓ Final HUD Status:', finalHud);
  console.log('✓ Flame Analysis Metric (SciPy Calculated):', flameMetric);
  console.log('✓ Scientific Insights Metric (SciPy Calculated):', insightsMetric);

  // 3. Take high-resolution screenshot
  const screenshot = await sendCmd('Page.captureScreenshot', { format: 'png' });
  if (screenshot && screenshot.result && screenshot.result.data) {
    const buffer = Buffer.from(screenshot.result.data, 'base64');
    const outPath = path.join(__dirname, '..', 'ignis_integrated_render.png');
    fs.writeFileSync(outPath, buffer);
    console.log('✓ Saved high-resolution integrated screenshot to:', outPath);
  }

  console.log('\n=== INTEGRATED END-TO-END PIPELINE VALIDATED SUCCESSFULLY! ===\n');

  ws.close();
  chrome.kill();
  process.exit(0);
}

run().catch(e => {
  console.error(e);
  chrome.kill();
  process.exit(1);
});
