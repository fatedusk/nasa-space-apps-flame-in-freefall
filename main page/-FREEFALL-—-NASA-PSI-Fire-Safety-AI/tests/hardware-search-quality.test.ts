import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  classifyHardwareQuery,
  scoreCuratedHardwareRelevance,
  searchCuratedHardware,
  searchHardwareWithMetadata,
  calculatePaperRelevance,
} from '../server.js';
import { CURATED_HARDWARE_REGISTRY } from '../src/data/hardwareRegistry.js';

describe('PHASE 17.2: Hardware Search Intelligence, Gibberish Detection & Relevance Test Suite', () => {
  describe('1. Legitimate Scientific Queries Accepted (No Allowlist Restriction)', () => {
    test('Accepts known and specialized NASA acronyms in uppercase, lowercase, and mixed-case', () => {
      const acronyms = [
        'SLICE',
        'slice',
        'BASS',
        'FLEX',
        'Saffire',
        'MOXIE',
        'SHERLOC',
        'NICMOS',
        'CheMin',
        'CAL',
        'SAM',
        'CIR',
        'ISS',
      ];

      for (const query of acronyms) {
        const result = classifyHardwareQuery(query);
        assert.equal(
          result.classification,
          'VALID_QUERY',
          `Acronym "${query}" should be classified as VALID_QUERY`
        );
        assert.equal(result.valid, true);
      }
    });

    test('Accepts NASA mission names, spacecraft, and hyphenated identifiers', () => {
      const missions = [
        'Apollo 11',
        'Apollo-11',
        'Perseverance',
        'Hubble',
        'Curiosity',
        'James-Webb',
        'Voyager 1',
        'Artemis II',
      ];

      for (const query of missions) {
        const result = classifyHardwareQuery(query);
        assert.equal(
          result.classification,
          'VALID_QUERY',
          `Mission "${query}" should be classified as VALID_QUERY`
        );
        assert.equal(result.valid, true);
      }
    });

    test('Accepts broad and specialized scientific terminology across disciplines', () => {
      const terms = [
        'Water',
        'Combustion',
        'Thermal control',
        'Spectrometer',
        'Raman spectroscopy',
        'Microgravity',
        'Cryogenic systems',
      ];

      for (const query of terms) {
        const result = classifyHardwareQuery(query);
        assert.equal(
          result.classification,
          'VALID_QUERY',
          `Scientific term "${query}" should be classified as VALID_QUERY`
        );
        assert.equal(result.valid, true);
      }
    });

    test('Accepts previously unseen / unfamiliar advanced scientific terms without allowlist', () => {
      const unseenTerms = [
        'Magnetoplasmadynamic thruster',
        'Laser interferometer space antenna',
        'Stirling radioisotope generator',
        'Silicon drift detector',
        'Toroidal magnetic containment',
      ];

      for (const query of unseenTerms) {
        const result = classifyHardwareQuery(query);
        assert.equal(
          result.classification,
          'VALID_QUERY',
          `Unseen term "${query}" should be accepted as VALID_QUERY without an allowlist`
        );
        assert.equal(result.valid, true);
      }
    });
  });

  describe('2. Multi-Signal Gibberish & Malformed Input Detection', () => {
    test('Identifies keyboard walks as OBVIOUS_GIBBERISH', () => {
      const walks = ['asdfghjk', 'qwertyuiop', 'zxcvbnm', 'lkjhgfdsa', 'poiuytrewq'];

      for (const bad of walks) {
        const result = classifyHardwareQuery(bad);
        assert.equal(
          result.classification,
          'OBVIOUS_GIBBERISH',
          `Keyboard walk "${bad}" must be OBVIOUS_GIBBERISH`
        );
        assert.equal(result.valid, false);
      }
    });

    test('Identifies repeated characters as OBVIOUS_GIBBERISH', () => {
      const repeated = [
        'zzzzzzzzz',
        'aaaaaaaaa',
        'hhhhhhhhh',
        'xxxxxxxxx',
        '11111111',
      ];

      for (const bad of repeated) {
        const result = classifyHardwareQuery(bad);
        assert.equal(
          result.classification,
          'OBVIOUS_GIBBERISH',
          `Repeated characters "${bad}" must be OBVIOUS_GIBBERISH`
        );
        assert.equal(result.valid, false);
      }
    });

    test('Identifies alternating or cyclic repetitions as OBVIOUS_GIBBERISH', () => {
      const cyclic = ['asdasdasd', 'abababab', 'abcabcabc'];

      for (const bad of cyclic) {
        const result = classifyHardwareQuery(bad);
        assert.equal(
          result.classification,
          'OBVIOUS_GIBBERISH',
          `Cyclic repetition "${bad}" must be OBVIOUS_GIBBERISH`
        );
        assert.equal(result.valid, false);
      }
    });

    test('Identifies vowelless nonsense strings as OBVIOUS_GIBBERISH', () => {
      const vowelless = ['qwrtypsdfg', 'bcdfghjklmnp'];

      for (const bad of vowelless) {
        const result = classifyHardwareQuery(bad);
        assert.equal(
          result.classification,
          'OBVIOUS_GIBBERISH',
          `Vowelless nonsense "${bad}" must be OBVIOUS_GIBBERISH`
        );
        assert.equal(result.valid, false);
      }
    });

    test('Identifies empty, whitespace-only, and excessively long inputs as INVALID_INPUT', () => {
      const emptyResult = classifyHardwareQuery('');
      assert.equal(emptyResult.classification, 'INVALID_INPUT');
      assert.equal(emptyResult.valid, false);

      const whitespaceResult = classifyHardwareQuery('     ');
      assert.equal(whitespaceResult.classification, 'INVALID_INPUT');
      assert.equal(whitespaceResult.valid, false);

      const longString = 'A'.repeat(260);
      const longResult = classifyHardwareQuery(longString);
      assert.equal(longResult.classification, 'INVALID_INPUT');
      assert.equal(longResult.valid, false);
    });

    test('Identifies injection and malformed characters as INVALID_INPUT', () => {
      const injections = [
        '<script>alert(1)</script>',
        'CIR \x00 NULL',
        'apollo\u0007bell',
      ];

      for (const bad of injections) {
        const result = classifyHardwareQuery(bad);
        assert.equal(
          result.classification,
          'INVALID_INPUT',
          `Malicious input "${bad}" must be classified as INVALID_INPUT`
        );
        assert.equal(result.valid, false);
      }
    });
  });

  describe('3. Relevance Scoring & False-Positive Elimination', () => {
    test('Saffire query matches Saffire Flow Duct and does NOT match Apollo 11 PLSS', () => {
      const saffireHw = CURATED_HARDWARE_REGISTRY.find((h) => h.id === 'HW-SAF-01')!;
      const apolloHw = CURATED_HARDWARE_REGISTRY.find((h) => h.id === 'HW-AP11-ECS')!;

      const saffireScore = scoreCuratedHardwareRelevance(saffireHw, 'saffire');
      const apolloScore = scoreCuratedHardwareRelevance(apolloHw, 'saffire');

      assert.ok(saffireScore >= 100, `Saffire score should be high (was ${saffireScore})`);
      assert.equal(apolloScore, 0, `Apollo score on "saffire" must be 0`);
    });

    test('CIR query matches Combustion Integrated Rack and does NOT match MOXIE', () => {
      const cirHw = CURATED_HARDWARE_REGISTRY.find((h) => h.id === 'HW-CIR-01')!;
      const moxieHw = CURATED_HARDWARE_REGISTRY.find((h) => h.id === 'HW-M20-MOXIE')!;

      const cirScore = scoreCuratedHardwareRelevance(cirHw, 'cir');
      const moxieScore = scoreCuratedHardwareRelevance(moxieHw, 'cir');

      assert.ok(cirScore >= 100, `CIR score should be high (was ${cirScore})`);
      assert.equal(moxieScore, 0, `MOXIE score on "cir" must be 0`);
    });

    test('CheMin query matches CheMin and does NOT match Hubble FGS', () => {
      const cheminHw = CURATED_HARDWARE_REGISTRY.find((h) => h.id === 'HW-MSL-CHEMIN')!;
      const hubbleHw = CURATED_HARDWARE_REGISTRY.find((h) => h.id === 'HW-HST-FGS')!;

      const cheminScore = scoreCuratedHardwareRelevance(cheminHw, 'chemin');
      const hubbleScore = scoreCuratedHardwareRelevance(hubbleHw, 'chemin');

      assert.ok(cheminScore >= 100, `CheMin score should be high (was ${cheminScore})`);
      assert.equal(hubbleScore, 0, `Hubble score on "chemin" must be 0`);
    });

    test('searchCuratedHardware returns empty list for gibberish queries', () => {
      const gibberishQueries = [
        'asdfghjk',
        'qwertyuiop',
        'zzzzzzzzz',
        'aaaaaaaaa',
        'hhhhhhhhh',
        'qwrtypsdfg',
        'asdasdasd',
      ];

      for (const bad of gibberishQueries) {
        const results = searchCuratedHardware(bad);
        assert.equal(
          results.length,
          0,
          `searchCuratedHardware must return 0 results for "${bad}", got ${results.length}`
        );
      }
    });

    test('searchCuratedHardware returns accurate matching hardware for valid queries', () => {
      const cirResults = searchCuratedHardware('CIR');
      assert.ok(cirResults.length > 0);
      assert.ok(cirResults.some((h) => h.id === 'HW-CIR-01'));

      const saffireResults = searchCuratedHardware('Saffire');
      assert.ok(saffireResults.length > 0);
      assert.ok(saffireResults.some((h) => h.id === 'HW-SAF-01'));

      const apolloResults = searchCuratedHardware('Apollo 11');
      assert.ok(apolloResults.length > 0);
      assert.ok(apolloResults.some((h) => h.id === 'HW-AP11-ECS'));
    });
  });

  describe('4. Technical Documentation Relevance Scoring', () => {
    test('calculatePaperRelevance assigns high score to matching titles', () => {
      const paper = {
        title: 'Development of the MOXIE Instrument for Mars 2020 Perseverance Rover',
        abstract: 'An overview of solid oxide electrolysis for oxygen generation on Mars.',
      };

      const moxieScore = calculatePaperRelevance(paper, 'MOXIE');
      assert.ok(moxieScore >= 60, `MOXIE paper score should be high (was ${moxieScore})`);

      const roverScore = calculatePaperRelevance(paper, 'Perseverance');
      assert.ok(roverScore >= 50, `Perseverance score should be high (was ${roverScore})`);
    });

    test('calculatePaperRelevance assigns zero or failing score to unrelated papers', () => {
      const paper = {
        title: 'Microgravity Droplet Combustion Studies in the CIR Facility',
        abstract: 'Analysis of soot-free cool flames in hydrocarbon fuels.',
      };

      const unrelatedScore = calculatePaperRelevance(paper, 'Hubble Space Telescope');
      assert.ok(
        unrelatedScore < 25,
        `Unrelated paper score should be < 25 (was ${unrelatedScore})`
      );
    });
  });

  describe('5. User-Facing Search Status Messages (Section 7 Compliance)', () => {
    test('Empty input returns exact required message', async () => {
      const response = await searchHardwareWithMetadata('');
      assert.equal(response.status, 'EMPTY_QUERY');
      assert.equal(
        response.message,
        'Enter a NASA mission, experiment, instrument or hardware name.'
      );
      assert.equal(response.results.length, 0);
    });

    test('Obvious gibberish returns exact required message', async () => {
      const response = await searchHardwareWithMetadata('asdfghjk');
      assert.equal(response.status, 'GIBBERISH');
      assert.equal(
        response.message,
        "That doesn't appear to be a meaningful search query. Try entering a mission, experiment, instrument or scientific term."
      );
      assert.equal(response.results.length, 0);
    });

    test('Obvious repeated characters returns exact required message', async () => {
      const response = await searchHardwareWithMetadata('zzzzzzzzz');
      assert.equal(response.status, 'GIBBERISH');
      assert.equal(
        response.message,
        "That doesn't appear to be a meaningful search query. Try entering a mission, experiment, instrument or scientific term."
      );
      assert.equal(response.results.length, 0);
    });

    test('Valid query with no matching hardware returns exact required message', async () => {
      // Query is a valid scientific phrase, but no hardware matches
      const response = await searchHardwareWithMetadata('xenon ion electrostatic accelerator 9999');
      assert.equal(response.classification, 'VALID_QUERY');
      assert.equal(response.status, 'NO_RECORDS');
      assert.equal(
        response.message,
        'No relevant hardware records were found for this search. Try a mission name, instrument acronym or technical keyword.'
      );
      assert.equal(response.results.length, 0);
    });
  });

  describe('6. Image Independence & Hardware Provenance Invariants', () => {
    test('Hardware items must possess verified technical documentation or curated lineage', () => {
      for (const item of CURATED_HARDWARE_REGISTRY) {
        assert.ok(item.name.length > 0, `Hardware ${item.id} must have a name`);
        assert.ok(item.mission.length > 0, `Hardware ${item.id} must be tied to a mission`);
        assert.ok(
          item.technicalDocumentation && item.technicalDocumentation.length > 0,
          `Hardware ${item.id} must have technical documentation`
        );
      }
    });

    test('Images attached to hardware have explicit confidence ratings', () => {
      const allowedConfidence = [
        'EXACT_HARDWARE_IMAGE',
        'HARDWARE_DETAIL_IMAGE',
        'MISSION_INTEGRATION_IMAGE',
        'MISSION_RELATED_IMAGE',
        'ILLUSTRATIVE_IMAGE',
        'EXTERNAL_RESEARCH_IMAGE',
        'UNAVAILABLE',
      ];
      for (const item of CURATED_HARDWARE_REGISTRY) {
        if (item.image && item.image.confidence) {
          assert.ok(
            allowedConfidence.includes(item.image.confidence),
            `Image in ${item.id} has valid confidence ${item.image.confidence}`
          );
        }
        if (item.images && Array.isArray(item.images)) {
          for (const img of item.images) {
            if (img.confidence) {
              assert.ok(
                allowedConfidence.includes(img.confidence),
                `Gallery image in ${item.id} has valid confidence ${img.confidence}`
              );
            }
          }
        }
      }
    });
  });
});
