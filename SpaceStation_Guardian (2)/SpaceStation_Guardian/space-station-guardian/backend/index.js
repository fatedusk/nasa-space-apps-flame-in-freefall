// backend/index.js
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// Serve static assets from frontend public folder
app.use('/audio', express.static(path.join(__dirname, '..', 'frontend', 'public', 'audio')));
app.use('/textures', express.static(path.join(__dirname, '..', 'frontend', 'public', 'textures')));
app.use('/models', express.static(path.join(__dirname, '..', 'frontend', 'public', 'models')));

// In-memory simulation state (Digital Twin)
let currentSpeed = 1;
let currentScenario = 'impact';
let currentSeverity = 8;
let selectedModule = 'destiny';
let activeEvent = null;
let eventLogs = [];

// Physics formula for live telemetry
function computeTelemetry(elapsed, scenario = currentScenario, severity = currentSeverity) {
  const s = severity / 10;
  const pressureLoss = scenario === 'pressure' || scenario === 'impact' || scenario === 'combined';
  const fire = scenario === 'fire' || scenario === 'combined';
  const electrical = scenario === 'power' || scenario === 'combined';

  const pressure = pressureLoss ? Math.max(0, 101.3 * Math.exp(-(0.0012 + 0.0035 * s) * elapsed)) : 101.3;
  const temperature = 22 + (fire ? Math.min(65, (3.5 + 4.2 * s) * Math.log1p(elapsed / 14)) : 0) + (electrical ? Math.min(18, 2.8 * Math.log1p(elapsed / 20)) : 0);
  const oxygen = Math.max(0, pressure * 0.2095);
  const power = electrical || scenario === 'impact' ? Math.max(8, 100 - (5.5 + 6.5 * s) * Math.log1p(elapsed / 6)) : 100;
  const hullIntegrity = Math.max(0, 100 - (s * 8.5 * Math.log1p(elapsed / 4)));

  return {
    pressure: +pressure.toFixed(1),
    temperature: +temperature.toFixed(1),
    oxygen: +oxygen.toFixed(1),
    power: +power.toFixed(0),
    hullIntegrity: +hullIntegrity.toFixed(1),
    status: pressure < 60 ? 'CRITICAL' : pressure < 90 || temperature > 42 ? 'WARNING' : 'NOMINAL'
  };
}

// 1. Health & Connection Ping API
app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    service: 'SpaceStation Guardian Digital Twin Core',
    status: 'ONLINE',
    port: PORT,
    uptime: +process.uptime().toFixed(1),
    timestamp: new Date().toISOString()
  });
});

// 2. Telemetry API (Get or compute live readings)
app.get('/api/telemetry', (req, res) => {
  const elapsed = parseFloat(req.query.elapsed || 0);
  const telemetry = computeTelemetry(elapsed);
  res.json({ ok: true, telemetry, scenario: currentScenario, severity: currentSeverity });
});

app.post('/api/telemetry', (req, res) => {
  const { elapsed = 0, scenario = currentScenario, severity = currentSeverity } = req.body;
  const telemetry = computeTelemetry(elapsed, scenario, severity);
  res.json({ ok: true, telemetry });
});

// 3. Speed API
app.get('/api/speed', (req, res) => {
  res.json({ ok: true, speed: currentSpeed });
});

app.post('/api/speed', (req, res) => {
  const { speed } = req.body;
  if (typeof speed === 'number' && speed > 0) {
    currentSpeed = speed;
    return res.json({ ok: true, speed: currentSpeed });
  }
  res.status(400).json({ ok: false, error: 'Invalid speed value' });
});

// 4. Detonation & Disaster Event API
app.post('/api/detonate', (req, res) => {
  const { scenario = 'impact', severity = 8, module = 'destiny' } = req.body;
  currentScenario = scenario;
  currentSeverity = severity;
  selectedModule = module;

  const eventRecord = {
    id: 'EVENT-' + Date.now().toString(36).toUpperCase(),
    timestamp: new Date().toISOString(),
    scenario,
    severity,
    epicenter: module,
    telemetryAtDetonation: computeTelemetry(0, scenario, severity)
  };

  activeEvent = eventRecord;
  eventLogs.unshift(eventRecord);
  if (eventLogs.length > 25) eventLogs.pop();

  console.log(`[ALERT] Detonation logged: ${eventRecord.id} | Scenario: ${scenario} | Target: ${module} | Force: ${severity}/10`);
  res.json({ ok: true, event: eventRecord });
});

// 5. Get recent disaster event logs
app.get('/api/events', (req, res) => {
  res.json({ ok: true, activeEvent, logs: eventLogs });
});

// 6. Reset disaster state
app.post('/api/reset', (req, res) => {
  activeEvent = null;
  res.json({ ok: true, message: 'Simulation state reset to nominal' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`=======================================================`);
  console.log(`SpaceStation Guardian Backend Core listening on port ${PORT}`);
  console.log(`API Health: http://localhost:${PORT}/api/health`);
  console.log(`=======================================================`);
});
