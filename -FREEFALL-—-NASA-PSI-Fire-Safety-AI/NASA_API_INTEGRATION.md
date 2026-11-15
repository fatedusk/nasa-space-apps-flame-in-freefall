# NASA API Integration & Architectural Reference Guide

**System**: FLAME // FREEFALL Research Gateway  
**Document**: NASA STI NTRS & Physical Sciences Informatics (PSI) Technical Integration  
**Specification Version**: NTRS OpenAPI 3.0 / PSI Repository Gateway v2.0  

---

## 1. Overview of NASA Data Sources

The FLAME // FREEFALL application integrates two distinct NASA scientific information systems:

1. **NASA Technical Reports Server (NTRS)**:
   - **Source of Truth**: `https://ntrs.nasa.gov/`
   - **API Documentation**: `https://ntrs.nasa.gov/api/openapi/` (OpenAPI 3.0.0)
   - **Content**: Scientific and Technical Information (STI) peer-reviewed journal articles, conference papers, technical memorandums, contractor reports, and flight mission technical evaluations.
   - **Integration Status**: **Fully Verified Live REST Integration**.

2. **NASA Physical Sciences Informatics (PSI)**:
   - **Source of Truth**: `https://psi.nasa.gov/physci/repo/`
   - **Biological & Physical Sciences Division (BPSD)**: `https://science.nasa.gov/biological-physical/`
   - **Content**: Quantitative experimental data from physical science investigations conducted on the International Space Station (ISS), Space Shuttle, and ground-based drop towers (e.g. Saffire, BASS, FLEX, ACME, SOFE).
   - **Integration Status**: **Verified Curated Catalog with Direct Portal Deep-Links**. (NASA PSI does not provide an open machine-readable REST API; confirmed via 404 responses on `/api/studies` and `/physci/api/search`).

---

## 2. NASA Technical Reports Server (NTRS) API Integration

### 2.1 Base Configuration
- **Base URL**: `https://ntrs.nasa.gov/api`
- **Authentication**: None required for public STI documents.
- **Protocol**: HTTPS / REST
- **Payload Format**: `application/json`

### 2.2 Verified Endpoints

| Method | Endpoint | Description | Query / Path Parameters |
| :--- | :--- | :--- | :--- |
| `GET` | `/health` | Service health status check | None |
| `GET` | `/citations/search` | Search STI records across NASA repositories | `q` (string), `page.size` (int), `page.from` (int), `stiType` (string/array), `center` (string/array) |
| `GET` | `/citations/{id}` | Retrieve individual citation details | `id` (numeric integer/string) |
| `GET` | `/citations/{id}/downloads`| Retrieve document download links | `id` (numeric integer/string) |

### 2.3 Request Construction & Parameters
Example Citation Search Request:
```http
GET /api/citations/search?q=microgravity+combustion&page.size=5 HTTP/1.1
Host: ntrs.nasa.gov
Accept: application/json
User-Agent: FlameFreefall-NasaPsiFireSafetyAI/2.0
```

Supported Query Parameters:
- `q`: Search expression (alphanumeric, boolean operators supported).
- `page.size`: Number of records to return (default: 5, max: 25 recommended).
- `page.from`: Zero-based pagination offset.
- `stiType`: Filter by document STI type (e.g., `CONFERENCE_PAPER`, `TECHNICAL_REPORT`).
- `center`: Filter by NASA Center (e.g., `GRC` for Glenn Research Center, `JSC` for Johnson Space Center).

### 2.4 Response Parsing & Field Mapping
The official OpenAPI schema (`Citation`) returns structured metadata mapped to `NTRSCitationRecord`:

```typescript
export interface NTRSCitationRecord {
  recordType: 'NTRS_CITATION';
  id: string; // e.g. "19630008654"
  title: string;
  abstract: string;
  authors: Array<{
    name: string;
    affiliation?: string;
  }>;
  center: {
    code: string;
    name: string;
  };
  distributionDate: string;
  stiType: string;
  reportNumbers: string[];
  doi?: string;
  keywords: string[];
  pdfUrl?: string;
  externalUrl: string; // https://ntrs.nasa.gov/citations/{id}
}
```

#### Field Extraction Rules:
- **Identifier**: `item.id.toString()` — Always treated as a string to preserve numerical precision.
- **Authors & Affiliations**: Extracted from `item.authorAffiliations[]`:
  - Name: `aff.meta?.author?.name || 'NASA Principal Investigator'`
  - Affiliation: `aff.meta?.organization?.name || aff.meta?.organization?.location || 'NASA'`
- **NASA Center**: Extracted from `item.center`:
  - Code: `item.center?.code || 'NASA'`
  - Name: `item.center?.name || 'NASA Research Center'`
- **Document STI Type**: Extracted from `item.stiTypeDetails || item.stiType || 'TECHNICAL_REPORT'`.
- **Publication Date**: Extracted from `item.distributionDate || item.submittedDate || item.created`.
- **DOI**: Extracted from `item.sourceIdentifiers[]` where `id.type === 'DOI'`.
- **PDF Download Link**: Extracted from `item.downloads[]` where `link.pdf` exists.

---

## 3. NASA Physical Sciences Informatics (PSI) Integration Strategy

### 3.1 Architectural Status & Limitation Notice
An exhaustive audit of `https://psi.nasa.gov` confirmed that **no public, machine-readable REST API is published or supported for third-party automated ingestion**:
- `https://psi.nasa.gov/api/studies`: Returns HTTP 404.
- `https://psi.nasa.gov/physci/api/search`: Returns HTTP 404.
- `https://psi.nasa.gov/physci/repo/data/search`: Returns HTML web application markup.

### 3.2 Source Availability Adapter
To maintain complete integrity without fragile web-scraping or simulated endpoints:
1. **Curated Ground-Truth Catalog**:
   - The application maintains a verified repository of empirical microgravity flight experiments directly sourced from NASA PSI archives (`OSD-903` BASS, `OSD-904` BASS-II, Saffire-I through V, FLEX, ACME, SOFE).
   - Each record contains verified flight telemetry (fuel type, oxygen concentration, forced draft velocity, chamber pressure, Damköhler transport metrics).
2. **Direct Official Portal Integration**:
   - Every PSI dossier displays an explicit, verified portal link formatted as:
     `https://psi.nasa.gov/physci/repo/search?q={encoded_topic}`
   - Users can seamlessly transition to the official NASA PSI portal to inspect raw experiment videos, data tables, and sensor logs.
3. **Explicit Provenance Labeling**:
   - The UI displays `"NASA Physical Sciences Informatics (PSI) Verified Flight Archive"` for curated experiments and `"NASA Technical Reports Server (NTRS)"` for literature citations.

---

## 4. Reliability, Rate Limiting & Error Handling

### 4.1 Token-Bucket Rate Limiter & Concurrency
- Outbound requests to `ntrs.nasa.gov` are throttled to a maximum of 5 requests per second per IP to respect NASA infrastructure limits.
- Upstream requests use `AbortSignal.timeout(4500)` to guarantee responsive UI feedback.

### 4.2 Retry Strategy
- On HTTP status `429 (Too Many Requests)` or `503 (Service Unavailable)`, the connector applies an exponential backoff retry:
  $$\text{Delay} = 500\text{ms} \times 2^{\text{attempt}} \pm \text{Random Jitter (100ms)}$$
- Maximum retries: 2.

### 4.3 In-Memory LRU Cache with Stale-If-Error
- **Cache Capacities**:
  - Search queries: 300 entries, 15-minute TTL.
  - Citation records: 200 entries, 60-minute TTL.
- **Stale-If-Error Policy**: If NASA NTRS is unreachable or times out, the backend serves cached results flagged with header `X-Cache: STALE`. The frontend renders a subtle indicator: `"Offline Archive Match (NASA Servers Busy)"`.

---

## 5. Security & Data Protection
- **No Client Credential Exposure**: Client-side requests never access external endpoints with credentials.
- **Header-Based Authentication**: Google GenAI API keys are delivered via `x-gemini-key` HTTP headers; query parameter transmission is blocked.
- **SSRF Mitigation**: Outbound fetch requests are strictly pinned to `https://ntrs.nasa.gov` and `https://psi.nasa.gov`. Arbitrary external redirects are rejected.
- **Input Validation**: All incoming search queries are validated against aerospace and scientific topics using `validateAerospaceQuery()`. Malformed or injection payloads are rejected with HTTP 400.
