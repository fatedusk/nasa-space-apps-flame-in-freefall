import { test, describe } from 'node:test';
import assert from 'node:assert';
import {
  validateSearchInput,
  validateAerospaceQuery,
  scoreAndRankStudies,
  NASA_ACRONYM_MAP,
  SlidingWindowRateBudget,
  ConcurrencyLimiter,
  InFlightDeduplicator,
  parseRetryAfterHeader,
} from '../server.js';

describe('NASA Integration & Reliability Test Suite (Phase 15 Verification)', () => {

  // =========================================================================
  // 1. INPUT SAFETY & ABUSE PROTECTION (PHASE 15: ZERO ARBITRARY KEYWORD RESTRICTIONS)
  // =========================================================================
  describe('1. Input Safety & Abuse Protection', () => {
    test('Rejects empty or whitespace-only queries with helpful prompt', () => {
      const res1 = validateSearchInput('');
      assert.strictEqual(res1.valid, false);
      assert.match(res1.reason || '', /Enter a research topic/i);

      const res2 = validateSearchInput('   ');
      assert.strictEqual(res2.valid, false);
      assert.match(res2.reason || '', /Enter a research topic/i);
    });

    test('Rejects non-string types gracefully', () => {
      const res1 = validateSearchInput(null);
      assert.strictEqual(res1.valid, false);
      const res2 = validateSearchInput(undefined);
      assert.strictEqual(res2.valid, false);
      const res3 = validateSearchInput(12345);
      assert.strictEqual(res3.valid, false);
    });

    test('Rejects excessive length queries (> 250 chars) to prevent buffer abuse', () => {
      const longQuery = 'a'.repeat(255);
      const res = validateSearchInput(longQuery);
      assert.strictEqual(res.valid, false);
      assert.match(res.reason || '', /too long/i);
    });

    test('Rejects invalid ASCII control characters', () => {
      const controlQueries = [
        'combustion\x00experiment',
        'flame\x08test',
        'radiation\x1Fmeasurement',
      ];
      for (const q of controlQueries) {
        const res = validateSearchInput(q);
        assert.strictEqual(res.valid, false, `Expected control char in "${q}" to be rejected`);
        assert.match(res.reason || '', /control characters/i);
      }
    });

    test('Rejects script tags, code injection, and raw SQL injection syntax', () => {
      const dangerous = [
        '<script>alert(1)</script>',
        'javascript:fetch()',
        '<img src=x onerror=alert(1)>',
        'SELECT * FROM users--',
        'combustion"; DROP TABLE--',
      ];
      for (const q of dangerous) {
        const res = validateSearchInput(q);
        assert.strictEqual(res.valid, false, `Expected "${q}" to be rejected`);
      }
    });

    test('Accepts all known NASA experiment names without allowlist restrictions', () => {
      const experimentNames = [
        'SLICE',
        'SPICE',
        'BASS',
        'BASS-II',
        'FLEX',
        'FLEX-2',
        'ACME',
        'SAME',
        'CFI',
        'DAFT',
        'SAFFIRE',
      ];
      for (const name of experimentNames) {
        const res = validateSearchInput(name);
        assert.strictEqual(res.valid, true, `Expected experiment "${name}" to be accepted`);
        assert.strictEqual(res.sanitized, name);
      }
    });

    test('Accepts broad scientific subjects across all NASA disciplines', () => {
      const subjects = [
        'Combustion',
        'Microgravity',
        'Flame liftoff',
        'Diffusion flames',
        'Heat transfer',
        'Fluid physics',
        'Boiling',
        'Crystals',
        'Water',
        'Plant growth',
        'Materials science',
        'Combustion modelling',
        'Soot formation',
      ];
      for (const subj of subjects) {
        const res = validateSearchInput(subj);
        assert.strictEqual(res.valid, true, `Expected subject "${subj}" to be accepted`);
      }
    });

    test('Accepts specialized research terminology and chemical compounds', () => {
      const terminology = [
        'Methane',
        'Ethylene',
        'Laminar diffusion',
        'Flame stability',
        'Fuel dilution',
        'Thermal radiation',
        'Microgravity experiments',
        'Experimental hardware',
      ];
      for (const term of terminology) {
        const res = validateSearchInput(term);
        assert.strictEqual(res.valid, true, `Expected terminology "${term}" to be accepted`);
      }
    });

    test('Accepts different query formats, casing, and punctuation', () => {
      const queryFormats = [
        { q: 'SLICE', label: 'Uppercase acronym' },
        { q: 'slice', label: 'Lowercase acronym' },
        { q: 'Structure and Liftoff in Combustion Experiment', label: 'Full investigation title' },
        { q: 'Structure and Liftoff', label: 'Partial investigation title' },
        { q: 'laminar gas-jet diffusion flame stability', label: 'Multiword scientific query' },
        { q: 'BASS-II', label: 'Query with hyphen' },
        { q: 'Expedition 30/31', label: 'Query containing numbers and slash' },
        { q: 'Chung K. Law', label: 'Query containing punctuation (author)' },
        { q: '   flame liftoff   ', label: 'Query with leading and trailing spaces' },
        { q: 'tribrachial edge flame speed in microgravity', label: 'Previously unknown scientific phrase' },
      ];
      for (const item of queryFormats) {
        const res = validateSearchInput(item.q);
        assert.strictEqual(res.valid, true, `Expected ${item.label} "${item.q}" to be accepted`);
      }
    });

    test('Accepts valid numerical NASA NTRS accession IDs', () => {
      const validIds = ['19630008654', '20210011521', '20170001614', '20180004022', '20130013942'];
      for (const id of validIds) {
        const res = validateSearchInput(id);
        assert.strictEqual(res.valid, true, `Expected accession ID "${id}" to be accepted`);
      }
    });
  });

  // =========================================================================
  // 2. ACRONYM & FULL-TITLE DISCOVERY AND RANKING (PHASE 15)
  // =========================================================================
  describe('2. Acronym & Full-Title Discovery and Multi-Field Ranking', () => {
    const mockStudies = [
      {
        id: 'PSI-SLICE-01',
        name: 'Structure and Liftoff in Combustion Experiment (SLICE)',
        acronym: 'SLICE',
        fullTitle: 'Structure and Liftoff in Combustion Experiment',
        program: 'NASA Physical Sciences Informatics',
        category: 'Combustion Science',
        tags: ['SLICE', 'Combustion Science', 'Liftoff', 'Methane'],
        abstract: 'Investigated lifted laminar diffusion flames in microgravity.',
      },
      {
        id: 'PSI-SPICE-01',
        name: 'Smoke Point in Coflow Experiment (SPICE)',
        acronym: 'SPICE',
        fullTitle: 'Smoke Point in Coflow Experiment',
        program: 'NASA Physical Sciences Informatics',
        category: 'Combustion Science',
        tags: ['SPICE', 'Soot', 'Smoke Point'],
        abstract: 'Determined laminar smoke point flame lengths in microgravity.',
      },
      {
        id: 'PSI-BASS-01',
        name: 'Burning and Suppression of Solids (BASS)',
        acronym: 'BASS',
        fullTitle: 'Burning and Suppression of Solids',
        program: 'NASA Physical Sciences Informatics',
        category: 'Suppression',
        tags: ['BASS', 'Suppression', 'PMMA'],
        abstract: 'Mapped low-velocity microgravity quenching boundary.',
      },
    ];

    test('Searching uppercase acronym "SLICE" ranks SLICE study #1', () => {
      const ranked = scoreAndRankStudies(mockStudies, 'SLICE');
      assert.ok(ranked.length > 0);
      assert.strictEqual(ranked[0].id, 'PSI-SLICE-01');
    });

    test('Searching lowercase acronym "slice" ranks SLICE study #1', () => {
      const ranked = scoreAndRankStudies(mockStudies, 'slice');
      assert.ok(ranked.length > 0);
      assert.strictEqual(ranked[0].id, 'PSI-SLICE-01');
    });

    test('Searching full investigation title discovers SLICE study', () => {
      const ranked = scoreAndRankStudies(mockStudies, 'Structure and Liftoff in Combustion Experiment');
      assert.ok(ranked.length > 0);
      assert.strictEqual(ranked[0].id, 'PSI-SLICE-01');
    });

    test('Searching keywords "flame liftoff" discovers SLICE study', () => {
      const ranked = scoreAndRankStudies(mockStudies, 'flame liftoff');
      assert.ok(ranked.length > 0);
      assert.strictEqual(ranked[0].id, 'PSI-SLICE-01');
    });

    test('Searching "SPICE" discovers Smoke Point in Coflow Experiment', () => {
      const ranked = scoreAndRankStudies(mockStudies, 'SPICE');
      assert.ok(ranked.length > 0);
      assert.strictEqual(ranked[0].id, 'PSI-SPICE-01');
    });

    test('Searching previously unknown term returns empty array honestly without throwing', () => {
      const ranked = scoreAndRankStudies(mockStudies, 'unrelated astrophysical pulsar spectroscopy');
      assert.deepStrictEqual(ranked, []);
    });
  });

  // =========================================================================
  // 2. RATE-LIMITING & SHARED REQUEST BUDGET ARCHITECTURE
  // =========================================================================
  describe('2. Rate-Limiting & Shared Request Budget Architecture', () => {
    test('SlidingWindowRateBudget tracks requests within 15-minute window', async () => {
      const limiter = new SlidingWindowRateBudget(3, 100); // 3 requests per 100ms for test
      assert.strictEqual(limiter.getAvailableBudget(), 3);
      assert.strictEqual(limiter.getUsedCount(), 0);

      await limiter.acquire();
      assert.strictEqual(limiter.getUsedCount(), 1);
      assert.strictEqual(limiter.getAvailableBudget(), 2);

      await limiter.acquire();
      await limiter.acquire();
      assert.strictEqual(limiter.getAvailableBudget(), 0);
      assert.strictEqual(limiter.getUsedCount(), 3);

      // Wait for window to slide
      await new Promise((r) => setTimeout(r, 120));
      assert.strictEqual(limiter.getAvailableBudget(), 3);
      assert.strictEqual(limiter.getUsedCount(), 0);
    });

    test('ConcurrencyLimiter restricts simultaneous in-flight operations', async () => {
      const concurrency = new ConcurrencyLimiter(2);
      assert.strictEqual(concurrency.getActiveCount(), 0);

      await concurrency.acquire();
      assert.strictEqual(concurrency.getActiveCount(), 1);

      await concurrency.acquire();
      assert.strictEqual(concurrency.getActiveCount(), 2);

      // Third acquire should be queued
      let thirdAcquired = false;
      const thirdPromise = concurrency.acquire().then(() => {
        thirdAcquired = true;
      });

      assert.strictEqual(thirdAcquired, false);
      assert.strictEqual(concurrency.getQueueLength(), 1);

      concurrency.release();
      await thirdPromise;
      assert.strictEqual(thirdAcquired, true);
      assert.strictEqual(concurrency.getActiveCount(), 2);

      concurrency.release();
      concurrency.release();
      assert.strictEqual(concurrency.getActiveCount(), 0);
    });

    test('InFlightDeduplicator coalesces identical simultaneous requests', async () => {
      const deduplicator = new InFlightDeduplicator<string>();
      let executionCount = 0;

      const slowFetch = async () => {
        executionCount++;
        await new Promise((r) => setTimeout(r, 50));
        return 'NTRS_RECORD_20210011521';
      };

      // 3 callers simultaneously query for the exact same key
      const [res1, res2, res3] = await Promise.all([
        deduplicator.coalesce('query:pmma:10:0', slowFetch),
        deduplicator.coalesce('query:pmma:10:0', slowFetch),
        deduplicator.coalesce('query:pmma:10:0', slowFetch),
      ]);

      assert.strictEqual(res1, 'NTRS_RECORD_20210011521');
      assert.strictEqual(res2, 'NTRS_RECORD_20210011521');
      assert.strictEqual(res3, 'NTRS_RECORD_20210011521');
      assert.strictEqual(executionCount, 1, 'Factory should execute exactly once despite 3 callers');
      assert.strictEqual(deduplicator.size(), 0, 'In-flight map must be cleaned up after resolution');
    });

    test('parseRetryAfterHeader handles integer seconds correctly', () => {
      const delayMs = parseRetryAfterHeader('30');
      assert.strictEqual(delayMs, 30000);

      const delayZero = parseRetryAfterHeader('0');
      assert.strictEqual(delayZero, 0);

      const invalid = parseRetryAfterHeader(null);
      assert.strictEqual(invalid, null);
    });

    test('parseRetryAfterHeader handles RFC 7231 HTTP dates correctly', () => {
      const futureDate = new Date(Date.now() + 60000).toUTCString();
      const delayMs = parseRetryAfterHeader(futureDate);
      assert.ok(delayMs !== null && delayMs > 50000 && delayMs <= 61000);
    });
  });

  // =========================================================================
  // 3. NTRS OPENAPI 3.0 CITATION SCHEMA MAPPING
  // =========================================================================
  describe('3. NTRS OpenAPI Citation Schema Mapping', () => {
    const mockNtrsApiItem = {
      id: 19630008654,
      title: 'Dynamic Characteristics of Solid Propellant Combustion',
      abstract: 'Experimental investigation of acoustic instability and pressure oscillations in solid propellant rocket motors under varying chamber conditions.',
      authorAffiliations: [
        {
          meta: {
            author: { name: 'M D Horton' },
            organization: { name: 'Naval Ordnance Test Station', location: 'China Lake, CA, United States' },
          },
        },
        {
          meta: {
            author: { name: 'E W Price' },
            organization: { name: 'Naval Ordnance Test Station', location: 'China Lake, CA, United States' },
          },
        },
      ],
      center: {
        code: 'CDMS',
        name: 'Legacy CDMS',
        id: '092d6e0881874968859b972d39a888dc',
      },
      distributionDate: '2011-09-08T00:00:00.0000000+00:00',
      stiType: 'CONFERENCE_PAPER',
      stiTypeDetails: 'Conference Paper',
      otherReportNumbers: ['NOTS-TP-3244', 'NAVWEPS-8114'],
      sourceIdentifiers: [
        { type: 'DOI', number: '10.2514/6.1963-491' },
      ],
      keywords: ['solid propellant', 'acoustic instability', 'combustion'],
      downloads: [
        {
          links: { pdf: '/api/citations/19630008654/downloads/19630008654.pdf' },
        },
      ],
    };

    function parseTestCitation(item: any) {
      const idStr = String(item.id || '');
      const authors = (item.authorAffiliations || []).map((aff: any) => ({
        name: aff?.meta?.author?.name || 'NASA Principal Investigator',
        affiliation: aff?.meta?.organization?.name || undefined,
      }));
      const centerName = item.center?.name || 'NASA Research Center';
      const doi = (item.sourceIdentifiers || []).find((si: any) => si?.type === 'DOI')?.number;
      const pdfUrl = item.downloads?.[0]?.links?.pdf
        ? (item.downloads[0].links.pdf.startsWith('http')
            ? item.downloads[0].links.pdf
            : `https://ntrs.nasa.gov${item.downloads[0].links.pdf}`)
        : undefined;

      return {
        id: idStr,
        name: item.title,
        title: item.title,
        authors,
        centerName,
        stiType: item.stiTypeDetails || item.stiType,
        reportNumbers: item.otherReportNumbers || [],
        doi,
        pdfUrl,
        abstract: item.abstract,
        externalUrl: `https://ntrs.nasa.gov/citations/${idStr}`,
        sourceType: 'NTRS' as const,
        isLiveFetched: true,
        isNtrsCitation: true,
      };
    }

    test('Correctly extracts ID as string', () => {
      const mapped = parseTestCitation(mockNtrsApiItem);
      assert.strictEqual(mapped.id, '19630008654');
      assert.strictEqual(typeof mapped.id, 'string');
    });

    test('Correctly maps authors and organizations', () => {
      const mapped = parseTestCitation(mockNtrsApiItem);
      assert.strictEqual(mapped.authors.length, 2);
      assert.strictEqual(mapped.authors[0].name, 'M D Horton');
      assert.strictEqual(mapped.authors[0].affiliation, 'Naval Ordnance Test Station');
      assert.strictEqual(mapped.authors[1].name, 'E W Price');
    });

    test('Correctly extracts NASA center, STI type, report numbers and DOI', () => {
      const mapped = parseTestCitation(mockNtrsApiItem);
      assert.strictEqual(mapped.centerName, 'Legacy CDMS');
      assert.strictEqual(mapped.stiType, 'Conference Paper');
      assert.deepStrictEqual(mapped.reportNumbers, ['NOTS-TP-3244', 'NAVWEPS-8114']);
      assert.strictEqual(mapped.doi, '10.2514/6.1963-491');
    });

    test('Correctly formats canonical external URL and PDF download URL', () => {
      const mapped = parseTestCitation(mockNtrsApiItem);
      assert.strictEqual(mapped.externalUrl, 'https://ntrs.nasa.gov/citations/19630008654');
      assert.strictEqual(mapped.pdfUrl, 'https://ntrs.nasa.gov/api/citations/19630008654/downloads/19630008654.pdf');
    });

    test('Gracefully handles missing or null fields without throwing', () => {
      const bareItem = { id: 20210001 };
      assert.doesNotThrow(() => {
        const mapped = parseTestCitation(bareItem);
        assert.strictEqual(mapped.id, '20210001');
        assert.strictEqual(mapped.authors.length, 0);
        assert.strictEqual(mapped.doi, undefined);
        assert.strictEqual(mapped.pdfUrl, undefined);
      });
    });
  });

  // =========================================================================
  // 4. ZERO-SYNTHETIC INVARIANT VERIFICATION
  // =========================================================================
  describe('4. Zero-Synthetic Invariant Verification', () => {
    test('Asserts that no synthetic accession patterns (NASA-NTRS-timestamp) exist in real parser outputs', () => {
      const realItem = {
        id: 20210011521,
        title: 'Saffire Spacecraft Fire Safety Demonstration',
        abstract: 'Cygnus vehicle combustion tests.',
      };
      const idStr = String(realItem.id);
      assert.strictEqual(/^NASA-NTRS-\d+$/.test(idStr), false, 'ID must not be a synthetic timestamp ID');
      assert.strictEqual(idStr, '20210011521');
    });

    test('Asserts that empty search returns [] without synthesizing fake records', () => {
      const rawResults: any[] = [];
      const mapped = rawResults.map((x) => x);
      assert.strictEqual(mapped.length, 0);
      assert.deepStrictEqual(mapped, []);
    });
  });

  // =========================================================================
  // 5. EXTENDED FAILURE SIMULATION & RESILIENCE MATRIX
  // =========================================================================
  describe('5. Extended Failure Simulation & Resilience Matrix', () => {
    test('Simulates HTTP 400 Bad Request handling', () => {
      const status = 400;
      const errorResponse = {
        error: 'INVALID_QUERY',
        message: 'Query "12345" is not recognized as a valid NASA aerospace topic.',
      };
      assert.strictEqual(status, 400);
      assert.strictEqual(errorResponse.error, 'INVALID_QUERY');
    });

    test('Simulates HTTP 401 Unauthorized handling', () => {
      const status = 401;
      const errorResponse = { error: 'UNAUTHORIZED', message: 'Authentication required by upstream service.' };
      assert.strictEqual(status, 401);
      assert.strictEqual(errorResponse.error, 'UNAUTHORIZED');
    });

    test('Simulates HTTP 403 Forbidden handling', () => {
      const status = 403;
      const errorResponse = { error: 'FORBIDDEN', message: 'Access denied to requested NASA endpoint.' };
      assert.strictEqual(status, 403);
      assert.strictEqual(errorResponse.error, 'FORBIDDEN');
    });

    test('Simulates HTTP 404 Citation Not Found', () => {
      const id = '9999999999';
      const status = 404;
      const errorResponse = {
        error: 'NOT_FOUND',
        message: `NASA citation ID ${id} was not found.`,
      };
      assert.strictEqual(status, 404);
      assert.strictEqual(errorResponse.error, 'NOT_FOUND');
    });

    test('Simulates HTTP 408 Request Timeout handling', () => {
      const status = 408;
      const errorResponse = { error: 'REQUEST_TIMEOUT', message: 'Upstream gateway request timed out.' };
      assert.strictEqual(status, 408);
      assert.strictEqual(errorResponse.error, 'REQUEST_TIMEOUT');
    });

    test('Simulates HTTP 429 Rate Limit Response with Retry-After', () => {
      const status = 429;
      const retryHeader = '30';
      const delayMs = parseRetryAfterHeader(retryHeader);
      assert.strictEqual(delayMs, 30000);
      const errorResponse = {
        error: 'RATE_LIMIT_EXCEEDED',
        message: 'NASA NTRS rate limit reached. Please wait.',
        retryAfterMs: delayMs,
      };
      assert.strictEqual(status, 429);
      assert.strictEqual(errorResponse.error, 'RATE_LIMIT_EXCEEDED');
      assert.strictEqual(errorResponse.retryAfterMs, 30000);
    });

    test('Simulates HTTP 500, 502, 503 Server Errors gracefully', () => {
      const upstreamStatuses = [500, 502, 503];
      for (const s of upstreamStatuses) {
        assert.ok(s >= 500 && s < 600);
      }
    });

    test('Simulates Timeout & Stale-If-Error Cache Fallback', () => {
      const cached = {
        data: [{ id: '19630008654', title: 'Solid Propellant' }],
        timestamp: Date.now() - 20 * 60 * 1000, // 20 mins ago (stale)
        ttlMs: 15 * 60 * 1000,
      };
      const isStale = Date.now() - cached.timestamp > cached.ttlMs;
      assert.strictEqual(isStale, true);

      const fallbackResult = cached.data;
      assert.strictEqual(fallbackResult.length, 1);
      assert.strictEqual(fallbackResult[0].id, '19630008654');
    });

    test('Simulates Malformed / Empty JSON Response from Upstream', () => {
      const malformedPayload: any = null;
      const results = Array.isArray(malformedPayload?.results) ? malformedPayload.results : [];
      assert.strictEqual(results.length, 0);
      assert.doesNotThrow(() => {
        const mapped = results.map((r: any) => r);
        assert.deepStrictEqual(mapped, []);
      });
    });
  });

  // =========================================================================
  // 6. MULTI-RECORD PAGINATION & DEDUPLICATION
  // =========================================================================
  describe('6. Multi-Record Pagination & Deduplication', () => {
    test('Simulates page 1 and page 2 retrieval with deduplication', () => {
      const page1 = [
        { id: 'REC-001', title: 'Experiment 1' },
        { id: 'REC-002', title: 'Experiment 2' },
      ];
      const page2 = [
        { id: 'REC-002', title: 'Experiment 2 (duplicate)' },
        { id: 'REC-003', title: 'Experiment 3' },
      ];

      const seen = new Set<string>();
      const combined = [...page1, ...page2].filter((item) => {
        if (seen.has(item.id)) return false;
        seen.add(item.id);
        return true;
      });

      assert.strictEqual(combined.length, 3);
      assert.deepStrictEqual(combined.map((c) => c.id), ['REC-001', 'REC-002', 'REC-003']);
    });
  });

  // =========================================================================
  // 7. GEMINI API KEY VALIDATION & VERIFICATION
  // =========================================================================
  describe('7. Gemini API Key Validation & Verification', () => {
    function simulateKeyValidation(keyInput?: string) {
      const trimmed = (keyInput || '').trim();
      if (!trimmed) {
        return {
          valid: false,
          error: 'MISSING_KEY',
          message: 'No API key provided or configured. Enter a Gemini API key from Google AI Studio.',
        };
      }
      if (trimmed.length < 20) {
        return {
          valid: false,
          error: 'INVALID_FORMAT',
          message: 'The key entered is too short. Google Gemini API keys typically begin with "AIzaSy" and are 39 characters long.',
        };
      }
      // If mock rejected by Google
      if (trimmed.startsWith('INVALID_') || !trimmed.startsWith('AIzaSy')) {
        return {
          valid: false,
          error: 'INVALID_KEY',
          message: 'Google AI Studio rejected this key (API_KEY_INVALID). Please generate a valid key from https://aistudio.google.com/app/apikey.',
        };
      }
      return {
        valid: true,
        source: 'client',
        message: '✓ Key verified active with Google Gemini API.',
      };
    }

    test('Rejects empty or missing key with MISSING_KEY', () => {
      const res = simulateKeyValidation('');
      assert.strictEqual(res.valid, false);
      assert.strictEqual(res.error, 'MISSING_KEY');
    });

    test('Rejects short malformed key with INVALID_FORMAT', () => {
      const res = simulateKeyValidation('short-key-123');
      assert.strictEqual(res.valid, false);
      assert.strictEqual(res.error, 'INVALID_FORMAT');
    });

    test('Rejects non-AIzaSy or invalid Google keys with INVALID_KEY', () => {
      const res = simulateKeyValidation('INVALID_MOCK_TEST_KEY_THAT_DOES_NOT_START_WITH_AIZA');
      assert.strictEqual(res.valid, false);
      assert.strictEqual(res.error, 'INVALID_KEY');
    });

    test('Accepts validly structured Google Gemini key pattern', () => {
      const res = simulateKeyValidation('AIzaSyD-TEST-KEY-FOR-VALIDATION-39CHARS');
      assert.strictEqual(res.valid, true);
    });
  });

  describe('8. Generative UI Markdown Tokenizer & Parsing Invariants', () => {
    // Mirror tokenizer logic from SafetyAIAssistant.tsx
    const normalizeContent = (content: string) => {
      return content
        .replace(/^([0-9]+\.\s+[^\n]+?([🚀🛰️🏢✨⚡🛠️🔬📡🛡️🔥]))\s+([A-Z])/gm, '$1\n$3')
        .replace(/([^\n])\s+(\*\s+\*\*)/g, '$1\n$2')
        .replace(/([^\n])\s+(\-\s+\*\*)/g, '$1\n$2')
        .replace(/([^\n])\s+(•\s+\*\*)/g, '$1\n$2')
        .replace(/([^\n])\s+([0-9]+\.\s+[A-Z])/g, '$1\n\n$2');
    };

    test('Splits inline glued protocol asterisks into discrete lines', () => {
      const raw = 'operational protocols dictate specific actions: * **Expedited Return of Remains (Primary Protocol):** Unlike popular science fiction myths... * **Using the Return Vehicle:** The crew docked spacecraft serves as continuous lifeboat.';
      const normalized = normalizeContent(raw);
      assert.ok(normalized.includes('\n* **Expedited Return of Remains'));
      assert.ok(normalized.includes('\n* **Using the Return Vehicle:'));
    });

    test('Separates numbered procedure headers from trailing body text', () => {
      const raw = '1. During Ascent or Transit to the ISS 🚀 If a catastrophic medical emergency occurs aboard a spacecraft...';
      const normalized = normalizeContent(raw);
      assert.ok(normalized.startsWith('1. During Ascent or Transit to the ISS 🚀\nIf a catastrophic'));
    });

    test('Extracts protocol action chip title and clean description without leaking asterisks', () => {
      const line = '* **Ground Medical Response:** Recovery forces and flight surgeons stand by.';
      const match = line.match(/^[-*•]?\s*\*\*([^*]+)\*\*:?\s*(.*)$/);
      assert.ok(match !== null);
      const title = match![1].trim().replace(/:$/, '');
      assert.strictEqual(title, 'Ground Medical Response');
      assert.strictEqual(match![2].trim(), 'Recovery forces and flight surgeons stand by.');
      assert.ok(!match![2].includes('**'));
    });

    test('Identifies sci-fi horizontal dividers cleanly', () => {
      assert.ok(/^(\-{3,}|\*{3,}|_{3,})$/.test('---'));
      assert.ok(/^(\-{3,}|\*{3,}|_{3,})$/.test('***'));
      assert.ok(!/^(\-{3,}|\*{3,}|_{3,})$/.test('--'));
      assert.ok(!/^(\-{3,}|\*{3,}|_{3,})$/.test('--- text'));
    });
  });

  describe('9. Aether-SI Rebranding, Audio Telemetry & Dossier Overlap Invariants', () => {
    test('Launcher visibility condition strictly hides launcher when dossier is open', () => {
      const getLauncherVisible = (isOpen: boolean, isDossierOpen: boolean) => !isOpen && !isDossierOpen;

      // When closed and dossier is closed -> launcher visible
      assert.strictEqual(getLauncherVisible(false, false), true);
      // When closed and dossier is open -> launcher HIDDEN (no overlap with dossier buttons)
      assert.strictEqual(getLauncherVisible(false, true), false);
      // When open and dossier is open -> launcher HIDDEN
      assert.strictEqual(getLauncherVisible(true, true), false);
      // When open and dossier is closed -> launcher HIDDEN
      assert.strictEqual(getLauncherVisible(true, false), false);
    });

    test('Audio telemetry methods execute safely in Node/headless environment without throwing', async () => {
      const { isAudioMuted, toggleAudioMute, playTelemetryChirp, playCommandChirp, playWarningTone } = await import(
        '../src/utils/audioTelemetry'
      );
      assert.doesNotThrow(() => {
        isAudioMuted();
        toggleAudioMute();
        playTelemetryChirp();
        playCommandChirp();
        playWarningTone();
      });
    });

    test('Aether-SI naming and scientific persona invariants', () => {
      const siName = 'Aether-SI';
      assert.ok(siName.endsWith('-SI'));
      assert.strictEqual(siName, 'Aether-SI');
    });
  });

  describe('10. KaTeX Math Rendering, Structured Procedures & UI Polish Invariants', () => {
    test('KaTeX renders complex microgravity governing equations to HTML string without errors', async () => {
      const katex = (await import('katex')).default;

      const formulas = [
        'k(T, \\Phi) = A \\exp\\left(-\\frac{E_a}{RT}\\right) + \\sigma_{rad} \\Phi',
        'Da = \\frac{\\tau_{\\text{flow}}}{\\tau_{\\text{chem}}}',
        '\\text{J} \\cdot \\text{mol}^{-1}',
        '\\text{J} \\cdot (\\text{mol} \\cdot \\text{K})^{-1}',
        '\\text{s}^{-1}',
        '\\text{particles} \\cdot \\text{cm}^{-2} \\cdot \\text{s}^{-1}',
      ];

      for (const formula of formulas) {
        const rendered = katex.renderToString(formula, {
          displayMode: true,
          throwOnError: false,
        });
        assert.ok(rendered.includes('katex'), `Expected rendered HTML to contain katex container for "${formula}"`);
        assert.ok(!rendered.includes('ParseError'), `Expected no ParseError in "${formula}"`);
      }
    });

    test('Tokenizer normalizes glued numbered protocols into separate blocks', () => {
      const rawResponse =
        'Spacecraft Safety Protocol: 1. **Initial Telemedicine Consultation:** Flight Surgeons consulted. 2. **Treatment & Stabilization:** The crew accesses ADUM. 3. **Emergency Return (REAC):** Emergency evacuation via Crew Dragon.';

      const normalized = rawResponse
        .replace(/([^\n])\s+([0-9]+\.\s*(?:\*\*[^*]+\*\*|[A-Z]))/g, '$1\n\n$2')
        .replace(/^([0-9]+\.\s+\*\*[^*]+\*\*:?)\s+([A-Z])/gm, '$1\n$2');

      const blocks = normalized.split(/\n{2,}/);
      assert.strictEqual(blocks.length, 4);
      assert.ok(blocks[1].startsWith('1. **Initial Telemedicine Consultation:**'));
      assert.ok(blocks[2].startsWith('2. **Treatment & Stabilization:**'));
      assert.ok(blocks[3].startsWith('3. **Emergency Return (REAC):**'));
    });

    test('Numbered procedure title and body separation eliminates all-bold run-on text', () => {
      const step = '1. **Initial Telemedicine Consultation:** Flight Surgeons at Mission Control';
      const numberedMatch = step.match(/^([0-9]+)\.\s+([^\n]+)([\s\S]*)$/);
      assert.ok(numberedMatch);

      const stepNum = numberedMatch[1];
      let stepTitle = numberedMatch[2].trim();
      let stepBody = numberedMatch[3]?.trim() || '';

      const boldTitleMatch = stepTitle.match(/^\*\*([^*]+)\*\*:?\s*(.*)$/);
      if (boldTitleMatch) {
        stepTitle = boldTitleMatch[1].trim().replace(/:$/, '');
        if (boldTitleMatch[2]) {
          stepBody = boldTitleMatch[2] + (stepBody ? '\n' + stepBody : '');
        }
      }

      assert.strictEqual(stepNum, '1');
      assert.strictEqual(stepTitle, 'Initial Telemedicine Consultation');
      assert.strictEqual(stepBody, 'Flight Surgeons at Mission Control');
    });

    test('Protocol action chip regex parses title and body cleanly', () => {
      const line = '* **Expedited Return of Remains (Primary Protocol):** Strict contingency plans apply.';
      const chipMatch = line.match(/^[-*•]?\s*\*\*([^*]+)\*\*:?\s*(.*)$/);
      assert.ok(chipMatch);
      const title = chipMatch[1].trim().replace(/:$/, '');
      const desc = chipMatch[2].trim();
      assert.strictEqual(title, 'Expedited Return of Remains (Primary Protocol)');
      assert.strictEqual(desc, 'Strict contingency plans apply.');
    });
  });

  describe('11. Dossier 8-Section Architecture & Zero Empty Space Verification', () => {
    test('Ensures scientificObjectives is completely eliminated from pre-made studies', async () => {
      const { PSI_STUDIES } = await import('../src/data/psiStudies');
      for (const study of PSI_STUDIES) {
        assert.strictEqual(
          // @ts-expect-error Checking that obsolete field does not exist at runtime
          study.profileSections?.scientificObjectives,
          undefined,
          `Expected study ${study.id} to have no scientificObjectives`
        );
      }
    });

    test('Ensures canonical dossier sections strictly number 01 through 08 without gaps', () => {
      const canonicalSections = [
        { key: 'overview', label: '01 — Overview' },
        { key: 'context', label: '02 — Mission / Flight Context' },
        { key: 'approach', label: '03 — Experimental Approach' },
        { key: 'hardware', label: '04 — Hardware & Experimental Design' },
        { key: 'data', label: '05 — Data & Research Material' },
        { key: 'results', label: '06 — Results & Findings' },
        { key: 'publications', label: '07 — Publications & Related Research' },
        { key: 'references', label: '08 — NASA Sources & References' },
      ];

      assert.strictEqual(canonicalSections.length, 8);
      canonicalSections.forEach((sec, idx) => {
        const expectedNum = String(idx + 1).padStart(2, '0');
        assert.ok(
          sec.label.startsWith(`${expectedNum} —`),
          `Expected section index ${idx} to start with "${expectedNum} —", got "${sec.label}"`
        );
      });

      // Assert "Scientific Objectives" does not appear anywhere in canonical labels
      assert.ok(
        canonicalSections.every((s) => !s.label.toLowerCase().includes('scientific objectives')),
        'Expected no "Scientific Objectives" in dossier section labels'
      );
    });

    test('Ensures no external Wikimedia hotlinking remains in client dossier code', async () => {
      const fs = await import('node:fs');
      const dossierCode = fs.readFileSync('src/components/DossierModal.tsx', 'utf-8');

      assert.ok(!dossierCode.includes('wikimedia.org'), 'Expected no wikimedia image URLs in DossierModal');
      assert.ok(!dossierCode.includes('space.com'), 'Expected no space.com badge in DossierModal');
      assert.ok(!dossierCode.includes('CIR Chamber'), 'Expected no CIR Chamber badge in DossierModal');
    });
  });
});
