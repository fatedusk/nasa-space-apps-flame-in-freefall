import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PAGES_CONFIG, getPageByPath, getPageById, DEFAULT_PAGE_PATH } from '../src/config/pages.js';
import { parseHash } from '../src/utils/router.js';
import {
  VERIFIED_PSI_RUNS,
  generateTrainingCSV,
  calculateFlammabilityPrediction,
} from '../src/utils/predictorEngine.js';
import { PredictionInput } from '../src/types/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

describe('Unified Platform: Welcome & Flame Simulator Hub Verification', () => {
  describe('1. 7-Webpage Master Configuration & Default Entry', () => {
    test('default page path is /welcome', () => {
      assert.equal(DEFAULT_PAGE_PATH, '/welcome');
    });

    test('defines the 7 required pages in order', () => {
      const ids = PAGES_CONFIG.map((p) => p.id);
      assert.deepEqual(ids, ['welcome', 'simulator', 'vault', 'hardware', 'network', 'science', 'sentence-search']);

      const labels = PAGES_CONFIG.map((p) => p.navLabel);
      assert.deepEqual(labels, [
        'Welcome',
        'Flame Simulator',
        'PSI & NTRS Vault',
        'Hardware Explorer',
        'IGNIS Data Network',
        'Combustion Science Brief',
        'PSI Sentence Search',
      ]);
    });

    test('backward compatibility gracefully maps /predictor to /simulator?tab=prediction', () => {
      const page = getPageByPath('/predictor');
      assert.equal(page.id, 'simulator');

      const route = parseHash('#/predictor');
      assert.equal(route.path, '/simulator');
      assert.equal(route.params.tab, 'prediction');
    });

    test('root entry resolves to /welcome', () => {
      const rootPage = getPageByPath('/');
      assert.equal(rootPage.id, 'welcome');

      const emptyRoute = parseHash('');
      assert.equal(emptyRoute.path, '/welcome');
    });
  });

  describe('2. Migrated ML Predictor & 48 PSI Flight Runs Invariants', () => {
    test('VERIFIED_PSI_RUNS contains exactly 48 verified flight test runs', () => {
      assert.equal(VERIFIED_PSI_RUNS.length, 48, 'Expected exactly 48 verified PSI flight runs');
      for (const run of VERIFIED_PSI_RUNS) {
        assert.ok(run.run_id, 'Run must have run_id');
        assert.ok(run.psi_study, 'Run must reference authentic psi_study');
        assert.ok(run.material, 'Run must specify material');
        assert.ok(typeof run.spread_rate_mms === 'number', 'spread_rate_mms must be numeric');
        assert.ok(['No spread', 'Marginal spread', 'Sustained spread'].includes(run.regime));
      }
    });

    test('generateTrainingCSV exports all 48 runs with complete header', () => {
      const csv = generateTrainingCSV();
      const lines = csv.trim().split('\n');
      assert.equal(lines.length, 49, 'Expected 1 header line + 48 data rows');
      assert.ok(lines[0].includes('run_id'));
      assert.ok(lines[0].includes('material'));
      assert.ok(lines[0].includes('spread_rate_mms'));
    });

    test('calculateFlammabilityPrediction outputs physical regime and metrics', () => {
      const highO2Input: PredictionInput = {
        gravity: '0g',
        material: 'sibal',
        gasMix: 'normal',
        oxygenPct: 35.0,
        pressureKpa: 101.3,
        airflowCms: 25.0,
        flowDirection: 'concurrent',
      };

      const highO2Result = calculateFlammabilityPrediction(highO2Input);
      assert.equal(highO2Result.regime, 'Sustained spread');
      assert.ok(highO2Result.spreadRate > 0);
      assert.ok(highO2Result.confidence >= 0 && highO2Result.confidence <= 100);

      const inertInput: PredictionInput = {
        gravity: '0g',
        material: 'sibal',
        gasMix: 'normal',
        oxygenPct: 12.0,
        pressureKpa: 101.3,
        airflowCms: 0.0,
        flowDirection: 'concurrent',
      };

      const inertResult = calculateFlammabilityPrediction(inertInput);
      assert.equal(inertResult.regime, 'No spread');
      assert.equal(inertResult.spreadRate, 0);
    });
  });

  describe('3. NASA Reference Visual Assets & Video Provenance', () => {
    const publicAssetsDir = path.join(ROOT_DIR, 'public', 'assets', 'nasa');

    test('all 6 NASA YouTube video thumbnail assets exist locally with valid file size', () => {
      const ytThumbnails = [
        'yt_W1oXykoz9zg.jpg',
        'yt_BxxqCLxxY3M.jpg',
        'yt_qQQ1OHW1_F4.jpg',
        'yt_CE7Nz78rkfQ.jpg',
        'yt_q7p9yXVgeNw.jpg',
        'yt_fhgh7XV0O1Y.jpg',
      ];

      for (const thumb of ytThumbnails) {
        const fullPath = path.join(publicAssetsDir, thumb);
        assert.ok(fs.existsSync(fullPath), `Thumbnail ${thumb} must exist in ${publicAssetsDir}`);
        const stat = fs.statSync(fullPath);
        assert.ok(stat.size > 1000, `Thumbnail ${thumb} must not be empty (was ${stat.size} bytes)`);
      }
    });

    test('all 6 NASA historical comparison photographic assets exist locally with valid file size', () => {
      const compPhotos = [
        'candle_comparison_grc.jpg',
        'candle_microgravity_sts50.jpg',
        'bass_flame_iss.jpg',
        'saffire_fabric_burn.jpg',
        'saffire_pmma_burn.jpg',
        'cir_hardware_iss.jpg',
      ];

      for (const photo of compPhotos) {
        const fullPath = path.join(publicAssetsDir, photo);
        assert.ok(fs.existsSync(fullPath), `Comparison photo ${photo} must exist in ${publicAssetsDir}`);
        const stat = fs.statSync(fullPath);
        assert.ok(stat.size > 5000, `Photo ${photo} must be a high-res asset (was ${stat.size} bytes)`);
      }
    });
  });
});
