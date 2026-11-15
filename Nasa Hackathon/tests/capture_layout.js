const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const tempProfile = path.join(process.env.TEMP, 'chrome_test_profile_' + Date.now());

const chrome = spawn(chromePath, [
  '--headless=new',
  '--remote-debugging-port=9226',
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

async function run() {
  let targets = null;
  for (let i = 0; i < 20; i++) {
    await sleep(400);
    try {
      targets = await getJson('http://127.0.0.1:9226/json/list');
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

  await sendCmd('Runtime.enable');
  await sendCmd('Page.enable');
  await sendCmd('DOM.enable');

  // Set viewport to 1600x950 to capture desktop layout
  await sendCmd('Emulation.setDeviceMetricsOverride', {
    width: 1600,
    height: 950,
    deviceScaleFactor: 1,
    mobile: false
  });

  await sendCmd('Page.reload');
  await sleep(1500);

  // Take screenshot
  const screenshot = await sendCmd('Page.captureScreenshot', { format: 'png' });
  if (screenshot && screenshot.result && screenshot.result.data) {
    const buffer = Buffer.from(screenshot.result.data, 'base64');
    const outPath = path.join(__dirname, 'ignis_exact_layout.png');
    fs.writeFileSync(outPath, buffer);
    console.log('✓ Captured layout screenshot to:', outPath);
  }

  // Test hover on Drop Tower node (dispatch mouseenter & mousemove)
  const hoverResult = await sendCmd('Runtime.evaluate', {
    expression: `(() => {
      const node = document.getElementById("node-group-drop_tower");
      node.dispatchEvent(new MouseEvent("mouseenter", {bubbles: true}));
      const circle = node.querySelector(".node-circle-body");
      return {
        r: circle.getAttribute("r"),
        transform: node.getAttribute("transform"),
        computedStyleTransform: window.getComputedStyle(node).transform
      };
    })()`,
    returnByValue: true
  });
  console.log('✓ Hover Test Diagnostic:', hoverResult.result.result.value);

  ws.close();
  chrome.kill();
  process.exit(0);
}

run().catch(e => {
  console.error(e);
  chrome.kill();
  process.exit(1);
});
