import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { CURATED_HARDWARE_REGISTRY } from '../src/data/hardwareRegistry.js';
import {
  searchCuratedHardware,
  searchHardware,
  validateSearchInput,
} from '../server.js';
import { HardwareItem } from '../src/types/hardware.js';

describe('NASA Hardware Explorer & Earth Applications Test Suite (Phase 17 Verification)', () => {
  describe('1. Search Input Validation & Safety Invariants', () => {
    test('Allows safe alphanumeric queries, acronyms, and mission names', () => {
      const validQueries = [
        'CIR',
        'Combustion Integrated Rack',
        'MSG',
        'Microgravity Science Glovebox',
        'Saffire',
        'Cold Atom Laboratory',
        'CAL',
        'Apollo 11',
        'Curiosity Rover',
        'Mars Perseverance',
        'James Webb Space Telescope',
        'Hubble',
      ];

      for (const q of validQueries) {
        const result = validateSearchInput(q);
        assert.equal(result.valid, true, `Query "${q}" should be accepted`);
        assert.equal(result.sanitized, q);
      }
    });

    test('Rejects malicious script injection, HTML tags, and control characters', () => {
      const malicious = [
        '<script>alert("hack")</script>',
        '<img src=x onerror=alert(1)>',
        'javascript:void(0)',
        'CIR -- DROP TABLE hardware',
        'Apollo"""11',
        'Apollo\x0011',
      ];

      for (const bad of malicious) {
        const result = validateSearchInput(bad);
        assert.equal(result.valid, false, `Malicious query "${bad}" must be rejected`);
      }
    });

    test('Rejects query longer than 250 characters', () => {
      const longQuery = 'A'.repeat(251);
      const result = validateSearchInput(longQuery);
      assert.equal(result.valid, false);
      assert.match(result.reason || '', /too long/i);
    });
  });

  describe('2. Curated Hardware Discovery & Multi-Field Ranking', () => {
    test('Acronym search "CIR" ranks Combustion Integrated Rack #1', () => {
      const results = searchCuratedHardware('CIR');
      assert.ok(results.length > 0);
      assert.equal(results[0].id, 'HW-CIR-01');
      assert.equal(results[0].acronym, 'CIR');
    });

    test('Acronym search "MSG" ranks Microgravity Science Glovebox #1', () => {
      const results = searchCuratedHardware('MSG');
      assert.ok(results.length > 0);
      assert.equal(results[0].id, 'HW-MSG-01');
      assert.equal(results[0].acronym, 'MSG');
    });

    test('Mission search "Apollo 11" ranks Apollo 11 ECS / OPA #1', () => {
      const results = searchCuratedHardware('Apollo 11');
      assert.ok(results.length > 0);
      assert.equal(results[0].id, 'HW-AP11-ECS');
      assert.ok(results[0].mission.includes('Apollo 11'));
    });

    test('Project name "Saffire" discovers Saffire Flow Duct', () => {
      const results = searchCuratedHardware('Saffire');
      assert.ok(results.length > 0);
      assert.equal(results[0].id, 'HW-SAF-01');
      assert.ok(results[0].name.includes('Saffire'));
    });

    test('Scientific term "Cold Atom" discovers Cold Atom Laboratory (CAL)', () => {
      const results = searchCuratedHardware('Cold Atom');
      assert.ok(results.length > 0);
      assert.equal(results[0].id, 'HW-CAL-01');
      assert.equal(results[0].acronym, 'CAL');
    });

    test('Rover search "Curiosity" ranks Sample Analysis at Mars (SAM) #1', () => {
      const results = searchCuratedHardware('Curiosity');
      assert.ok(results.length > 0);
      assert.equal(results[0].id, 'HW-MSL-SAM');
      assert.ok(results[0].name.includes('Sample Analysis at Mars'));
    });

    test('Empty query returns all curated hardware items in full', () => {
      const results = searchCuratedHardware('');
      assert.equal(results.length, CURATED_HARDWARE_REGISTRY.length);
    });
  });

  describe('3. Dynamic Online Discovery Outside Static Registry (Phase 17)', () => {
    test('Online discovery returns valid hardware array for mission queries', async () => {
      const results = await searchHardware('Apollo 11');
      assert.ok(Array.isArray(results));
      assert.ok(results.length >= 1, 'Must return at least one Apollo 11 hardware item');
      assert.equal(results[0].id, 'HW-AP11-ECS');
      assert.equal(results[0].recordState, 'CURATED_REFERENCE');
    });

    test('Zero-Synthetic Hardware Invariant: unknown nonsense term returns empty array', async () => {
      const unknownTerm = 'xyznonexistenthardware999';
      const results = await searchHardware(unknownTerm);
      assert.ok(Array.isArray(results));
      assert.equal(results.length, 0, 'Must NOT invent fake hardware when none exists');
    });

    test('Record states are cleanly assigned (CURATED_REFERENCE or LIVE_DATA)', async () => {
      const cirResults = await searchHardware('CIR');
      assert.ok(cirResults.length > 0);
      assert.equal(cirResults[0].recordState, 'CURATED_REFERENCE');
    });
  });

  describe('4. Hardware Profile Schema & Required Section Invariants', () => {
    test('Every curated hardware item conforms to the strict 7-section HardwareItem schema', () => {
      for (const hw of CURATED_HARDWARE_REGISTRY) {
        assert.ok(hw.id, `Item must have an ID: ${JSON.stringify(hw)}`);
        assert.ok(hw.name, `Item ${hw.id} must have a name`);
        assert.ok(hw.category, `Item ${hw.id} must have a category`);
        assert.ok(hw.mission, `Item ${hw.id} must have a mission`);
        assert.ok(hw.briefFunction, `Item ${hw.id} must have a briefFunction`);
        assert.equal(hw.recordState, 'CURATED_REFERENCE');

        // Key Specifications
        assert.ok(hw.specs, `Item ${hw.id} must have specs`);
        assert.ok(hw.specs.environment, `Item ${hw.id} must specify environment`);

        // 3 Core Sections
        assert.ok(hw.whatIsIt.purpose, `Item ${hw.id} must have whatIsIt.purpose`);
        assert.ok(Array.isArray(hw.whatIsIt.mainComponents) && hw.whatIsIt.mainComponents.length > 0);
        assert.ok(hw.whatIsIt.problemSolved, `Item ${hw.id} must have whatIsIt.problemSolved`);
        assert.ok(hw.whatIsIt.scientificPrinciple, `Item ${hw.id} must have whatIsIt.scientificPrinciple`);

        assert.ok(hw.missionUsage.role, `Item ${hw.id} must have missionUsage.role`);
        assert.ok(hw.missionUsage.location, `Item ${hw.id} must have missionUsage.location`);
        assert.ok(hw.missionUsage.measurements, `Item ${hw.id} must have missionUsage.measurements`);
        assert.ok(hw.missionUsage.scientificContribution, `Item ${hw.id} must have scientificContribution`);

        assert.ok(hw.howItWorks.operatingPrinciple, `Item ${hw.id} must have operatingPrinciple`);
        assert.ok(hw.howItWorks.mechanism, `Item ${hw.id} must have mechanism`);

        // Field-level Provenance
        assert.ok(Array.isArray(hw.provenance), `Item ${hw.id} must have provenance array`);
        assert.ok(hw.provenance.length > 0, `Item ${hw.id} must have at least one field-level source`);

        // Earth Applications Deck
        assert.ok(hw.earthApplications.underlyingCapability, `Item ${hw.id} must have underlyingCapability`);
        assert.ok(hw.earthApplications.howItWorksOnEarth, `Item ${hw.id} must have howItWorksOnEarth`);
        assert.ok(Array.isArray(hw.earthApplications.documentedTransfers));
        assert.ok(Array.isArray(hw.earthApplications.potentialApplications));
        assert.ok(Array.isArray(hw.earthApplications.targetIndustries));
        assert.ok(hw.earthApplications.targetIndustries.length > 0);
      }
    });
  });

  describe('5. Earth Applications & Audited NASA Spinoff Provenance', () => {
    test('Apollo 11 retains verified commercial SCBA spinoff with authentic documentation', () => {
      const apollo = CURATED_HARDWARE_REGISTRY.find((h) => h.id === 'HW-AP11-ECS');
      assert.ok(apollo);
      assert.equal(apollo.earthApplications.evidenceStatus, 'VERIFIED');
      const scbaSpinoff = apollo.earthApplications.documentedTransfers[0];
      assert.ok(scbaSpinoff);
      assert.equal(scbaSpinoff.isSpinoff, true);
      assert.ok(scbaSpinoff.title.includes('Firefighter'));
      assert.ok(scbaSpinoff.partner?.includes('Scott Aviation'));
      assert.ok(scbaSpinoff.sourceUrl?.includes('spinoff.nasa.gov'));
    });

    test('CIR, MSG, Saffire, CAL, and SAM have synthetic case IDs removed and are classified as RESEARCH_APPLICATION', () => {
      const auditedIds = ['HW-CIR-01', 'HW-MSG-01', 'HW-SAF-01', 'HW-CAL-01', 'HW-MSL-SAM'];
      for (const id of auditedIds) {
        const item = CURATED_HARDWARE_REGISTRY.find((h) => h.id === id);
        assert.ok(item, `Item ${id} must exist in curated registry`);
        assert.equal(
          item.earthApplications.evidenceStatus,
          'RESEARCH_APPLICATION',
          `Item ${id} must be honestly classified as RESEARCH_APPLICATION`
        );
        assert.equal(
          item.earthApplications.documentedTransfers.length,
          0,
          `Item ${id} must not claim unverified commercial spinoff cases`
        );
        assert.ok(
          item.earthApplications.researchApplications && item.earthApplications.researchApplications.length > 0,
          `Item ${id} must provide research applications`
        );
      }
    });

    test('Potential applications include problem addressed, adaptation needed, and disclaimer', () => {
      for (const hw of CURATED_HARDWARE_REGISTRY) {
        if (hw.earthApplications.potentialApplications.length > 0) {
          for (const pot of hw.earthApplications.potentialApplications) {
            assert.ok(pot.field, 'Potential application must have field');
            assert.ok(pot.description, 'Potential application must have description');
            assert.ok(pot.problemAddressed, 'Potential application must describe problem addressed on Earth');
            assert.ok(pot.adaptationNeeded, 'Potential application must describe engineering adaptation needed');
          }
        }
      }
    });
  });

  describe('6. Authentic Image Metadata & Confidence Invariants', () => {
    test('All curated items have authentic NASA image IDs, source URLs, and EXACT confidence', () => {
      for (const hw of CURATED_HARDWARE_REGISTRY) {
        assert.ok(hw.image, `Hardware ${hw.id} must have image metadata`);
        assert.ok(hw.image.nasaId, `Hardware ${hw.id} must have a valid NASA ID`);
        assert.ok(hw.image.thumbnailUrl, `Hardware ${hw.id} must have a valid image URL`);
        assert.ok(hw.image.credit, `Hardware ${hw.id} must attribute credit`);
        assert.ok(hw.image.sourceUrl?.includes('nasa.gov'), `Source must link to official NASA domain`);
        assert.equal(hw.image.confidence, 'EXACT_HARDWARE_IMAGE');
      }
    });
  });

  describe('7. Phase 17.1 Scientific Accuracy, Citation Audits & Image Invariants', () => {
    test('Apollo 11 PLSS/OPA uses authentic astronaut photo and cites SCAMP lineage', () => {
      const plss = CURATED_HARDWARE_REGISTRY.find((h) => h.id === 'HW-AP11-ECS');
      assert.ok(plss, 'Must find Apollo 11 PLSS item');
      assert.equal(plss.image?.nasaId, 'AS11-40-5886', 'Must use AS11-40-5886 rather than launch photo');
      assert.ok(plss.earthApplications.howItWorksOnEarth.includes('SCAMP'), 'Must cite SCAMP lineage');
      assert.ok(plss.earthApplications.documentedTransfers[0].sourceUrl?.includes('10197'), 'Must cite spinoff 10197');
    });

    test('Apollo 11 PSEP is registered with NTRS 19700065553 and image AS11-40-5947', () => {
      const psep = CURATED_HARDWARE_REGISTRY.find((h) => h.id === 'HW-AP11-PSEP');
      assert.ok(psep, 'Must find Apollo 11 PSEP item');
      assert.equal(psep.image?.nasaId, 'AS11-40-5947', 'Must use authentic lunar deployment photo');
      assert.ok(
        psep.technicalDocumentation.some((doc) => doc.id === '19700065553'),
        'Must cite NTRS 19700065553'
      );
      assert.ok(
        psep.earthApplications.howItWorksOnEarth.includes('SEISMOLOGICAL DISTINCTION'),
        'Must contrast lunar vs terrestrial seismology'
      );
    });

    test('Perseverance MOXIE cites TechPort 96183 and clarifies carbon-capture limitations', () => {
      const moxie = CURATED_HARDWARE_REGISTRY.find((h) => h.id === 'HW-M20-MOXIE');
      assert.ok(moxie, 'Must find MOXIE item');
      assert.ok(
        moxie.technicalDocumentation.some((doc) => doc.id === '96183'),
        'Must cite NASA TechPort 96183'
      );
      assert.ok(
        moxie.earthApplications.howItWorksOnEarth.includes('CRITICAL SCIENTIFIC ACCURACY & BOUNDARY NOTE'),
        'Must clarify ambient vs flue-gas SOEC boundary'
      );
    });

    test('Perseverance SHERLOC tags NTRS 20230007030 as SUBSYSTEM_DOCUMENTATION', () => {
      const sherloc = CURATED_HARDWARE_REGISTRY.find((h) => h.id === 'HW-M20-SHERLOC');
      assert.ok(sherloc, 'Must find SHERLOC item');
      const doc = sherloc.technicalDocumentation.find((d) => d.id === '20230007030');
      assert.ok(doc, 'Must cite NTRS 20230007030');
      assert.equal(doc.classification, 'SUBSYSTEM_DOCUMENTATION');
    });

    test('Hubble NICMOS tags NTRS 20140017805 as SUBSYSTEM_DOCUMENTATION and cites cooler 20020070802', () => {
      const nicmos = CURATED_HARDWARE_REGISTRY.find((h) => h.id === 'HW-HST-NICMOS');
      assert.ok(nicmos, 'Must find NICMOS item');
      const radDoc = nicmos.technicalDocumentation.find((d) => d.id === '20140017805');
      assert.ok(radDoc, 'Must cite NTRS 20140017805');
      assert.equal(radDoc.classification, 'SUBSYSTEM_DOCUMENTATION');
      assert.ok(
        nicmos.technicalDocumentation.some((d) => d.id === '20020070802'),
        'Must cite NICMOS cooler 20020070802'
      );
    });

    test('Hubble FGS cites NTRS 19940031774', () => {
      const fgs = CURATED_HARDWARE_REGISTRY.find((h) => h.id === 'HW-HST-FGS');
      assert.ok(fgs, 'Must find HST FGS item');
      assert.ok(
        fgs.technicalDocumentation.some((d) => d.id === '19940031774'),
        'Must cite NTRS 19940031774'
      );
    });

    test('Curiosity SAM tags vacuum pump paper 20150004080 as SUBSYSTEM_DOCUMENTATION and cites complete suite 20120014603', () => {
      const sam = CURATED_HARDWARE_REGISTRY.find((h) => h.id === 'HW-MSL-SAM');
      assert.ok(sam, 'Must find Curiosity SAM item');
      const pumpDoc = sam.technicalDocumentation.find((d) => d.id === '20150004080');
      assert.ok(pumpDoc, 'Must cite pump paper 20150004080');
      assert.equal(pumpDoc.classification, 'SUBSYSTEM_DOCUMENTATION');
      assert.ok(
        sam.technicalDocumentation.some((d) => d.id === '20120014603'),
        'Must cite complete SAM suite 20120014603'
      );
    });

    test('Curiosity CheMin cites NTRS 20140017288 and verified Terra portable XRD spinoff', () => {
      const chemin = CURATED_HARDWARE_REGISTRY.find((h) => h.id === 'HW-MSL-CHEMIN');
      assert.ok(chemin, 'Must find CheMin item');
      assert.ok(
        chemin.technicalDocumentation.some((d) => d.id === '20140017288'),
        'Must cite NTRS 20140017288'
      );
      assert.ok(
        chemin.earthApplications.documentedTransfers.some((t) => t.isSpinoff && t.title.includes('Terra')),
        'Must document Terra / Olympus XRD commercial spinoff'
      );
    });

    test('Saffire Flow Duct clarifies experimental investigation rig and does not claim commercial extinguisher', () => {
      const saffire = CURATED_HARDWARE_REGISTRY.find((h) => h.id === 'HW-SAF-01');
      assert.ok(saffire, 'Must find Saffire item');
      assert.ok(
        saffire.earthApplications.howItWorksOnEarth.includes('not an off-the-shelf commercial extinguisher product'),
        'Must explicitly clarify experimental rig nature'
      );
    });

    test('Multi-image galleries contain valid metadata and appropriate confidence classifications', () => {
      const multiImageItems = CURATED_HARDWARE_REGISTRY.filter((h) => h.images && h.images.length > 1);
      assert.ok(multiImageItems.length >= 3, 'Must have at least 3 curated items with multi-image galleries');
      for (const item of multiImageItems) {
        for (const img of item.images!) {
          assert.ok(img.title, 'Gallery image must have title');
          assert.ok(img.thumbnailUrl, 'Gallery image must have thumbnail');
          assert.ok(img.confidence, 'Gallery image must have confidence tag');
        }
      }
    });
  });
});
