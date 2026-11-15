import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PAGES_CONFIG, getPageByPath, getPageById } from '../src/config/pages.js';
import { parseHash } from '../src/utils/router.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

describe('PHASE 18: IGNIS // FREEFALL Unified Platform Integration Test Suite', () => {
  describe('1. 7-Webpage Master Application Architecture', () => {
    test('defines all seven unified mission pages in correct order', () => {
      assert.equal(PAGES_CONFIG.length, 7, 'Expected exactly 7 registered mission pages');

      const expectedPages = [
        { id: 'welcome', path: '/welcome', navLabel: 'Welcome' },
        { id: 'simulator', path: '/simulator', navLabel: 'Flame Simulator' },
        { id: 'vault', path: '/vault', navLabel: 'PSI & NTRS Vault' },
        { id: 'hardware', path: '/hardware', navLabel: 'Hardware Explorer' },
        { id: 'network', path: '/network', navLabel: 'IGNIS Data Network' },
        { id: 'science', path: '/science', navLabel: 'Combustion Science Brief' },
        { id: 'sentence-search', path: '/sentence-search', navLabel: 'PSI Sentence Search' },
      ];

      for (let i = 0; i < expectedPages.length; i++) {
        const page = PAGES_CONFIG[i];
        assert.equal(page.id, expectedPages[i].id);
        assert.equal(page.path, expectedPages[i].path);
        assert.equal(page.navLabel, expectedPages[i].navLabel);
        assert.equal(page.enabled, true);
        assert.ok(typeof page.component === 'function', `Page ${page.id} must have a component`);
      }
    });

    test('hash router accurately parses /simulator and preserves query parameters', () => {
      const parsed = parseHash('#/simulator?gravity=0g&o2=25', '/predictor');
      assert.equal(parsed.path, '/simulator');
      assert.equal(parsed.params.gravity, '0g');
      assert.equal(parsed.params.o2, '25');
    });

    test('getPageByPath and getPageById resolve /simulator correctly', () => {
      const simPage = getPageByPath('/simulator');
      assert.ok(simPage);
      assert.equal(simPage.id, 'simulator');
      assert.equal(simPage.title, 'Flame Simulator');

      const simById = getPageById('simulator');
      assert.ok(simById);
      assert.equal(simById.path, '/simulator');
    });
  });

  describe('2. Friend Simulator Files & Asset Integrity', () => {
    const simHtmlPath = path.join(ROOT_DIR, 'public', 'ignis', 'ignis-simulator.html');

    test('public/ignis/ignis-simulator.html exists and is readable', () => {
      assert.ok(fs.existsSync(simHtmlPath), 'ignis-simulator.html must exist in public/ignis/');
      const stat = fs.statSync(simHtmlPath);
      assert.ok(stat.size > 20000, `Simulator HTML size should be substantial (was ${stat.size} bytes)`);
    });

    test('simulator contains required interactive elements and 3D canvas', () => {
      const html = fs.readFileSync(simHtmlPath, 'utf8');

      // 3D Canvas element
      assert.ok(html.includes('id="cv"'), 'Missing main 3D canvas element (#cv)');

      // Gravity preset controls
      assert.ok(html.includes('data-g="1"'), 'Missing Earth 1g gravity preset button');
      assert.ok(html.includes('data-g="0.16"'), 'Missing Moon 0.16g gravity preset button');
      assert.ok(html.includes('data-g="0.38"'), 'Missing Mars 0.38g gravity preset button');
      assert.ok(html.includes('data-g="0"'), 'Missing ISS 0g gravity preset button');

      // Atmosphere presets (Saffire tests)
      assert.ok(html.includes('Saffire-I cabin'), 'Missing Saffire-I preset');
      assert.ok(html.includes('Saffire-V cabin'), 'Missing Saffire-V preset');
      assert.ok(html.includes('Saffire-VI cabin'), 'Missing Saffire-VI preset');

      // Internal navigation sections
      assert.ok(html.includes('href="#sim"'), 'Missing internal jump to #sim');
      assert.ok(html.includes('href="#how"'), 'Missing internal jump to #how');
      assert.ok(html.includes('href="#refs"'), 'Missing internal jump to #refs');
      assert.ok(html.includes('href="#media-section"'), 'Missing internal jump to #media-section');
      assert.ok(html.includes('href="#sources"'), 'Missing internal jump to #sources');

      // Scientific disclaimer
      assert.ok(
        html.includes('Illustrative rendering driven by your inputs') ||
          html.includes('It is not a combustion simulation'),
        'Scientific illustrative rendering disclaimer must be preserved'
      );
    });

    test('all referenced NASA photographic and video thumbnail assets exist locally', () => {
      const requiredNasaAssets = [
        'bass_flame_iss.jpg',
        'candle-flames.gif',
        'candle_comparison_grc.jpg',
        'candle_microgravity_sts50.jpg',
        'cir_hardware_iss.jpg',
        'saffire_fabric_burn.jpg',
        'saffire_pmma_burn.jpg',
        'yt_BxxqCLxxY3M.jpg',
        'yt_CE7Nz78rkfQ.jpg',
        'yt_fhgh7XV0O1Y.jpg',
        'yt_q7p9yXVgeNw.jpg',
        'yt_qQQ1OHW1_F4.jpg',
        'yt_W1oXykoz9zg.jpg',
      ];

      for (const asset of requiredNasaAssets) {
        const assetPath = path.join(ROOT_DIR, 'public', 'ignis', 'assets', 'nasa', asset);
        assert.ok(fs.existsSync(assetPath), `Missing NASA asset: ${assetPath}`);
      }

      const requiredPlanetAssets = [
        'earth_disc.jpg',
        'iss_station.jpg',
        'mars_disc.jpg',
        'moon_disc.jpg',
        'orion_transit.jpg',
      ];

      for (const asset of requiredPlanetAssets) {
        const assetPath = path.join(ROOT_DIR, 'public', 'ignis', 'assets', 'planets', asset);
        assert.ok(fs.existsSync(assetPath), `Missing planet asset: ${assetPath}`);
      }
    });

    test('vendor scripts exist locally', () => {
      const threePath = path.join(ROOT_DIR, 'public', 'ignis', 'vendor', 'three.min.js');
      const controlsPath = path.join(ROOT_DIR, 'public', 'ignis', 'vendor', 'OrbitControls.js');
      assert.ok(fs.existsSync(threePath), 'Missing vendor three.min.js');
      assert.ok(fs.existsSync(controlsPath), 'Missing vendor OrbitControls.js');
    });
  });

  describe('3. Independent Python Scientific Backend Preservation', () => {
    test('backend directory exists with app.py and scientific_engine.py', () => {
      const appPath = path.join(ROOT_DIR, 'backend', 'app.py');
      const enginePath = path.join(ROOT_DIR, 'backend', 'scientific_engine.py');
      const genPath = path.join(ROOT_DIR, 'backend', 'generate_datasets.py');

      assert.ok(fs.existsSync(appPath), 'Missing backend/app.py');
      assert.ok(fs.existsSync(enginePath), 'Missing backend/scientific_engine.py');
      assert.ok(fs.existsSync(genPath), 'Missing backend/generate_datasets.py');
    });

    test('backend/datasets contains authentic combustion datasets', () => {
      const datasets = [
        'acme_iss_coflow.csv',
        'drop_tower_methane.csv',
        'flex_iss_droplet.csv',
        'ntrs_archive_index.json',
      ];

      for (const d of datasets) {
        const p = path.join(ROOT_DIR, 'backend', 'datasets', d);
        assert.ok(fs.existsSync(p), `Missing dataset: ${p}`);
        const stat = fs.statSync(p);
        assert.ok(stat.size > 100, `Dataset ${d} must not be empty`);
      }
    });
  });
});
