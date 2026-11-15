import { test, describe } from 'node:test';
import assert from 'node:assert';
import { parseHash } from '../src/utils/router';
import { PAGES_CONFIG, DEFAULT_PAGE_PATH, getPageByPath, getPageById } from '../src/config/pages';

describe('Hackathon Multi-Webpage Routing & Page Registry', () => {
  describe('Hash Parser (parseHash)', () => {
    test('parses empty hash to default fallback', () => {
      const parsed = parseHash('', '/predictor');
      assert.strictEqual(parsed.path, '/predictor');
      assert.deepStrictEqual(parsed.params, {});
    });

    test('parses plain route without parameters', () => {
      const parsed = parseHash('#/vault', '/predictor');
      assert.strictEqual(parsed.path, '/vault');
      assert.deepStrictEqual(parsed.params, {});
    });

    test('parses route with query parameters', () => {
      const parsed = parseHash('#/hardware?q=MOXIE&mission=Mars2020', '/predictor');
      assert.strictEqual(parsed.path, '/hardware');
      assert.strictEqual(parsed.params.q, 'MOXIE');
      assert.strictEqual(parsed.params.mission, 'Mars2020');
    });

    test('handles leading slash without hash', () => {
      const parsed = parseHash('/vault?study=PSI-SAF-01', '/predictor');
      assert.strictEqual(parsed.path, '/vault');
      assert.strictEqual(parsed.params.study, 'PSI-SAF-01');
    });

    test('strips trailing slashes from path', () => {
      const parsed = parseHash('#/hardware/', '/predictor');
      assert.strictEqual(parsed.path, '/hardware');
    });
  });

  describe('PAGES_CONFIG Registry Invariants', () => {
    test('defines all 7 unified mission pages (Phase 18 Integration)', () => {
      assert.strictEqual(PAGES_CONFIG.length, 7, 'Expected exactly 7 unified pages registered');
      const ids = PAGES_CONFIG.map((p) => p.id);
      assert.ok(ids.includes('welcome'), 'Missing welcome page');
      assert.ok(ids.includes('simulator'), 'Missing simulator page');
      assert.ok(ids.includes('vault'), 'Missing vault page');
      assert.ok(ids.includes('hardware'), 'Missing hardware page');
      assert.ok(ids.includes('network'), 'Missing network page');
      assert.ok(ids.includes('science'), 'Missing science page');
      assert.ok(ids.includes('sentence-search'), 'Missing sentence-search page');
    });

    test('backward compatibility maps legacy predictor route and id to simulator', () => {
      const pageByPath = getPageByPath('/predictor');
      assert.strictEqual(pageByPath.id, 'simulator');

      const pageById = getPageById('predictor');
      assert.strictEqual(pageById.id, 'simulator');

      const parsed = parseHash('#/predictor');
      assert.strictEqual(parsed.path, '/simulator');
      assert.strictEqual(parsed.params.tab, 'prediction');
    });

    test('every page has a unique id and unique path starting with slash', () => {
      const ids = new Set<string>();
      const paths = new Set<string>();

      for (const page of PAGES_CONFIG) {
        assert.ok(!ids.has(page.id), `Duplicate page ID: ${page.id}`);
        ids.add(page.id);

        assert.ok(page.path.startsWith('/'), `Path must start with slash: ${page.path}`);
        assert.ok(!paths.has(page.path), `Duplicate page path: ${page.path}`);
        paths.add(page.path);

        assert.ok(page.title.length > 0, `Page ${page.id} missing title`);
        assert.ok(page.navLabel.length > 0, `Page ${page.id} missing navLabel`);
        assert.ok(typeof page.component === 'function', `Page ${page.id} must have a component function`);
      }
    });

    test('DEFAULT_PAGE_PATH points to an enabled registered page', () => {
      const defaultPage = PAGES_CONFIG.find((p) => p.path === DEFAULT_PAGE_PATH);
      assert.ok(defaultPage, `DEFAULT_PAGE_PATH ${DEFAULT_PAGE_PATH} is not in PAGES_CONFIG`);
      assert.strictEqual(defaultPage.enabled, true, 'Default page must be enabled');
    });

    test('getPageByPath resolves registered paths and falls back to default for unknown paths', () => {
      const hardwarePage = getPageByPath('/hardware');
      assert.ok(hardwarePage);
      assert.strictEqual(hardwarePage.id, 'hardware');

      const simulatorPage = getPageByPath('/simulator');
      assert.ok(simulatorPage);
      assert.strictEqual(simulatorPage.id, 'simulator');

      const unknownPage = getPageByPath('/non-existent-module');
      assert.ok(unknownPage);
      assert.strictEqual(unknownPage.path, DEFAULT_PAGE_PATH);
    });

    test('getPageById resolves registered ids', () => {
      const vaultPage = getPageById('vault');
      assert.ok(vaultPage);
      assert.strictEqual(vaultPage.path, '/vault');

      const simPage = getPageById('simulator');
      assert.ok(simPage);
      assert.strictEqual(simPage.path, '/simulator');
    });
  });
});
