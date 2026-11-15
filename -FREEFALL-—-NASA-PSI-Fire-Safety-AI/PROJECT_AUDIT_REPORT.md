# Comprehensive Technical Audit Report: NASA Data Integration & System Reliability

**Project**: FLAME // FREEFALL — NASA PSI Fire Safety AI  
**Audit Conducted**: 2026-11-14  
**Auditor**: Senior Full-Stack Software Engineer, API Integration Specialist & QA Engineer  
**Baseline Status**: Partial implementation with functional UI and predictor; critical vulnerabilities identified in NASA data fetching, data provenance, and synthetic fallback generation.

---

## 1. Executive Summary

This comprehensive audit evaluated the existing codebase for data integrity, API integration accuracy, error handling, security, performance, and architecture. 

The application provides an interactive 3D microgravity flame simulator, an AI safety assistant ("Astro Alex"), and a research dossier vault ("NASA PSI & NTRS Research Gateway"). While the core physics simulation engine and frontend presentation are visually refined, the data pipeline suffered from **critical vulnerabilities**:
1. When external NASA APIs timed out or returned zero hits, the application silently fabricated fake NASA flight research papers (generating synthetic accession numbers like `NASA-NTRS-123456`, fabricated publication titles, and artificial telemetry).
2. The NASA Technical Reports Server (NTRS) and NASA Physical Sciences Informatics (PSI) data sources were conflated into a single handler, corrupting data provenance.
3. Critical NTRS bibliographic metadata (author affiliations, NASA research centers, STI publication types, report numbers, DOIs, and PDF download links) was discarded during mapping.
4. No automated testing or error simulation harness was configured in the repository.

All confirmed issues have been cataloged with root cause analyses, severity ratings, and concrete remediation paths.

---

## 2. Project Inventory & Baseline Environment

### 2.1 Technology Stack
- **Frontend Framework**: React 19.0.1 with TypeScript 5.8 / 7.0
- **Build Tool & Bundler**: Vite 8.3.0 (`@vitejs/plugin-react` 6.1.1)
- **Styling**: Tailwind CSS 4.3.3 (`@tailwindcss/vite`)
- **Backend Framework**: Express 4.21.2 executed via `tsx server.ts` (dev) / `node server.js` (prod)
- **AI Integration**: Google GenAI SDK (`@google/genai ^2.4.0`)
- **3D Graphics**: Three.js 0.187.0 with `@types/three`
- **Animation & Icons**: Motion 12.23.24, Lucide React 0.546.0

### 2.2 Entry Points & Routing
- Frontend Root: `index.html` -> `src/main.tsx` -> `src/App.tsx`
- Backend Root: `server.ts`
- Routes:
  - `GET /api/nasa/ntrs`: NTRS scientific literature citations
  - `GET /api/nasa/ntrs/:id`: Single citation retrieval
  - `GET /api/nasa/psi`: PSI physical microgravity combustion investigations
  - `POST /api/safety-assistant/chat`: AI astronaut advisor ("Astro Alex")
  - Static fallback: Express serving `dist/` or Vite dev middleware

### 2.3 Verified Empirical Data Assets
- `nasa_data.json`: 48 verified empirical microgravity runs from NASA Glenn Research Center and ISS CIR/MDCA (BASS `OSD-903`, BASS-II `OSD-904`, Saffire I-V `NTRS-20170001614` to `NTRS-20210011521`).
- `src/data/psiStudies.ts`: 540 lines of verified NASA investigations (Saffire, BASS, FLEX, ACME, SOFE, Apollo 1, Apollo 13, Mir 1997, and Spinoffs).

---

## 3. Severity-Based Issue Register

### CRITICAL Severity

#### CRIT-01: Synthetic Data Generation Disguised as NASA Research
- **Affected Files**: `server.ts` (function `synthesizeDeepNasaDossiers`, lines 822-950) and `src/utils/predictorEngine.ts` (function `synthesizeClientNasaDossiers`, lines 700-765).
- **Exact Problem**: When NTRS or PSI queries returned empty results or timed out, the backend and frontend generated artificial papers with random IDs (`NASA-NTRS-${timestamp}`), fabricated titles (`NASA Flight Report: ${query} in Microgravity Combustion`), and synthetic abstracts.
- **Why It Happens**: Intended as a visual "fallback" so the search card would never appear blank.
- **Impact**: Severe violation of NASA scientific data integrity; misleads users and researchers with non-existent citations and fabricated DOIs.
- **Remediation**: Completely eliminate `synthesizeDeepNasaDossiers` and `synthesizeClientNasaDossiers`. Replace with authentic NASA empty states, caching, and verified curated catalog matches.

#### CRIT-02: Conflation of Scientific Literature (NTRS) and Physical Science Experiments (PSI)
- **Affected Files**: `server.ts` (lines 605-606), `src/utils/predictorEngine.ts`, `src/types/index.ts`.
- **Exact Problem**: Both `/api/nasa/ntrs` and `/api/nasa/psi` were wired to the exact same handler (`handleNasaFetch`). NTRS publications were stamped with `sourceType: 'PSI'` and forced into experimental physics schemas (e.g. assigning artificial chamber pressure or fuel types to theoretical survey papers).
- **Why It Happens**: Lack of separate data models for bibliographic citations vs. experimental runs.
- **Impact**: Distorts scientific provenance; displays theoretical review papers as physical ISS laboratory hardware runs.
- **Remediation**: Separate into distinct endpoints (`/api/nasa/ntrs` and `/api/nasa/psi`) and distinct TypeScript data models (`NTRSCitationRecord` vs. `PSIPhysicalStudy`).

---

### HIGH Severity

#### HIGH-01: Direct Unreliable Client-Side External API Calls
- **Affected Files**: `src/utils/predictorEngine.ts` (lines 448-472).
- **Exact Problem**: Client code attempted direct browser fetches to `https://ntrs.nasa.gov/api/citations/search` when the backend timed out, swallowing errors and falling back to synthetic records.
- **Why It Happens**: Fragile client-side fallback architecture.
- **Impact**: Unpredictable CORS failures, inability to inspect error codes in the UI, and silent degradation.
- **Remediation**: Channel all NASA communications through backend proxy endpoints with structured error responses (400, 404, 429, 500, 503).

#### HIGH-02: Incomplete NTRS OpenAPI Schema Mapping
- **Affected Files**: `server.ts`, `src/components/DossierModal.tsx`, `src/types/index.ts`.
- **Exact Problem**: Response mapping from NTRS discarded `authorAffiliations` (author names, research institutions), `center` (NASA Center code/name), `stiType` (Conference Paper, Technical Report), `otherReportNumbers`, `doi`, and `downloads`.
- **Why It Happens**: Ad-hoc JSON mapping rather than OpenAPI-specification-based mapping.
- **Impact**: Users could not verify the primary authors, publication venue, NASA research center, or download the original technical report PDF.
- **Remediation**: Implement official OpenAPI 3.0 schema mapping for NTRS citations extracting all available bibliographic fields.

#### HIGH-03: Misrepresentation of NASA PSI API Capabilities
- **Affected Files**: `server.ts`, `src/components/VaultView.tsx`.
- **Exact Problem**: The UI claimed to perform live search on NASA PSI, but NASA PSI does not expose a public machine-readable REST API (confirmed via 404 on `/api/studies` and `/physci/api/search`).
- **Why It Happens**: The application attempted to query non-existent or internal endpoints.
- **Impact**: Broken links, user confusion, and unverified scraping attempts.
- **Remediation**: Implement an explicit PSI Source Availability Adapter. Mark PSI records as "Verified PSI Physical Science Catalog", deep-link directly to `https://psi.nasa.gov/physci/repo/search?q=...`, and document the exact limitation.

---

### MEDIUM Severity

#### MED-01: Absence of Automated Testing & Error Simulation Harness
- **Affected Files**: `package.json`, project root.
- **Exact Problem**: No automated test runner or test scripts existed in `package.json`.
- **Why It Happens**: Project was developed without an automated CI/test workflow.
- **Impact**: Inability to verify regressions, error status code handling (400, 401, 403, 404, 408, 429, 500), or schema validations.
- **Remediation**: Implement a zero-dependency automated test suite using Node.js native test runner (`tsx --test tests/api-reliability.test.ts`) covering all status code simulations and zero-synthetic data assertions.

#### MED-02: Unbounded In-Memory Cache Without TTL or Eviction
- **Affected Files**: `server.ts` (`ntrsDossierCache`).
- **Exact Problem**: `ntrsDossierCache` was a bare JavaScript `Map` that retained entries indefinitely with no TTL expiration and no maximum size limit.
- **Why It Happens**: Simplistic initial caching implementation.
- **Impact**: Potential memory leak under sustained query volume; stale data persisted across server lifetime.
- **Remediation**: Implement an LRU cache with strict TTL (15 min for search, 60 min for citations) and maximum size bounds.

---

### LOW Severity

#### LOW-01: API Key Transmission in URL Query Parameters
- **Affected Files**: `server.ts` (line 403), `src/utils/predictorEngine.ts` (line 428).
- **Exact Problem**: Gemini API keys were accepted via `?userClientKey=...` query parameters.
- **Why It Happens**: Convenience in client URL construction.
- **Impact**: Exposes API keys in server access logs and browser history.
- **Remediation**: Enforce HTTP header transport (`x-gemini-key`).

---

## 4. Completed Remediations Summary

1. **Synthetic Data Elimination**: Completely removed `synthesizeDeepNasaDossiers` and `synthesizeClientNasaDossiers`. Zero fake records can be generated.
2. **Official NTRS OpenAPI Connector**: Built schema-compliant parser supporting search, individual citation retrieval, download links, and author/center extraction.
3. **PSI Source Availability Adapter**: Explicit UI provenance state, deep-links to official PSI portal, and verified empirical catalog.
4. **Reliability Layer**: Added 4.5s timeouts, token-bucket rate limiting, exponential backoff with jitter on 429/503, and bounded LRU caching with `stale-if-error`.
5. **Security Hardening**: Header-based credential transport, strict query validation, and SSRF domain whitelisting.
6. **Automated Test Suite**: Added `tests/api-reliability.test.ts` running via `npm test`.
