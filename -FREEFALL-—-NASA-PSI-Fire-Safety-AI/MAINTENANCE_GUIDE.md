# System Maintenance, Operations & Troubleshooting Guide

**System**: FLAME // FREEFALL — NASA PSI Fire Safety AI  
**Document**: Architecture, Operations & Maintenance Runbook  
**Target Audience**: Senior Full-Stack Engineers, DevOps & Research Integrators  

---

## 1. System Architecture Overview

FLAME // FREEFALL is composed of three interconnected tiers:

```
[ Client: React 19 + Three.js + Tailwind CSS ]
                     │  ▲
        JSON / HTTP  │  │  SSE / REST
                     ▼  │
[ Server: Express 4.21 + Token-Bucket Rate Limiter + LRU TTL Cache ]
                     │  ▲
       Upstream REST │  │  OpenAPI 3.0
                     ▼  │
     ┌───────────────────────────────┐
     │  NASA NTRS (api.nasa.gov)     │
     │  NASA PSI Repository Gateway  │
     │  Google GenAI (Astro Alex)    │
     └───────────────────────────────┘
```

1. **Frontend Presentation**:
   - `src/components/VaultView.tsx`: Research Gateway Console with search filtering, source tab separation, and batch isolation.
   - `src/components/DossierModal.tsx`: Comprehensive flight dossier modal displaying NTRS bibliographic citations (authors, institutions, NASA centers, STI types, DOIs, PDF links) and PSI experimental telemetry.
   - `src/components/SafetyAIAssistant.tsx`: "Astro Alex" astronaut advisor with anti-hallucination domain gating.
   - `src/components/PredictorView.tsx` & `FlameSimulatorCanvas.tsx`: Core microgravity physics simulator and 3D flame shader canvas (**Protected & Invariant**).

2. **Backend API Services (`server.ts`)**:
   - `/api/nasa/ntrs`: Official NTRS citation search connector.
   - `/api/nasa/ntrs/:id`: Individual NTRS citation retrieval.
   - `/api/nasa/psi`: NASA PSI source availability adapter querying verified ground-truth flight archives and live PSI publications.
   - `/api/safety-assistant/chat`: AI astronaut reasoning assistant.

---

## 2. Environment Configuration

Create a `.env` file in the project root (reference: `.env.example`):

```bash
# Server Port
PORT=3000

# Google Gemini API Key for Astro Alex and scientific literature enrichment
GEMINI_API_KEY=your_gemini_api_key_here

# Node Environment
NODE_ENV=development
```

---

## 3. Operations & Development Workflows

### 3.1 Running Development Server
```bash
npm run dev
# Starts backend server on http://localhost:3000 with Vite middleware
```

### 3.2 Executing Automated Tests
```bash
npm test
# Runs Node native test runner (tests/api-reliability.test.ts) via tsx
```

### 3.3 Running Production Build
```bash
npm run build
# Generates production distribution in dist/
```

### 3.4 Starting Production Server
```bash
npm start
# Runs compiled Express server in production mode serving dist/ assets
```

---

## 4. Modifying and Extending NASA Connectors

### 4.1 Adding New NTRS Filter Parameters
NTRS OpenAPI 3.0 supports additional query parameters in `handleNtrsSearch` in `server.ts`:
- To filter by specific NASA Center (e.g. `center=GRC`):
  Append `&center=${encodeURIComponent(center)}` to the upstream NTRS URL.
- To sort results by publication date:
  Append `&sort={"published":{"order":"desc"}}`.

### 4.2 Updating the Curated PSI Flight Catalog
To add new empirical microgravity test runs:
1. Open `src/data/psiStudies.ts`.
2. Append a new verified study adhering to the `PSIStudy` interface.
3. Include the official NASA accession ID (`ntrs_id` or `id`), flight facility (`hardware`), verified fuel sample, oxygen concentration range, flow velocity, and Damköhler analysis.
4. **Never generate synthetic placeholder IDs.** All records must trace to published flight results.

---

## 5. Troubleshooting & Failure Recovery

| Symptom | Probable Cause | Diagnostic & Resolution Steps |
| :--- | :--- | :--- |
| **Search returns 0 results for a valid topic** | Upstream NASA NTRS servers are slow or unreachable | Check `server.ts` console output. If NASA NTRS is returning 503 or timing out, the system will serve cached results with `X-Cache: STALE`. If no cache exists, the empty state is displayed honestly. |
| **HTTP 429 Rate Limit Exceeded** | Excessive search queries executed in a short duration | Upstream NTRS enforces IP rate limits. The built-in token-bucket rate limiter throttles outbound requests to 5 req/sec with exponential backoff. Wait 15 seconds for token replenishment. |
| **HTTP 400 INVALID_QUERY** | User entered an off-topic word or keyboard mash | Check query against `validateAerospaceQuery()`. The query must relate to aerospace, combustion, microgravity, spaceflight, or be a 6-12 digit NTRS accession ID. |
| **Astro Alex declines to answer** | Off-topic domain gate activated | Astro Alex is strictly configured to answer space exploration, astronaut life, microgravity combustion, and spacecraft fire safety questions. Everyday topics are politely rejected by design. |
| **Port 3000 in use** | A previous server instance was not terminated | Run `Get-Process -Name node, tsx | Stop-Process` on Windows PowerShell or specify a different `PORT` in `.env`. |

---

## 6. Non-Negotiable Operational Invariants
1. **Zero Synthetic Records**: Never resurrect synthetic generation functions (`synthesizeDeepNasaDossiers` or `synthesizeClientNasaDossiers`).
2. **Untouched Simulators**: Never modify `PredictorView.tsx` or `FlameSimulatorCanvas.tsx`.
3. **OpenAPI Compliance**: All NTRS queries and mappings must strictly follow the official specification published at `https://ntrs.nasa.gov/api/openapi/`.
