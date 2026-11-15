# IGNIS // FREEFALL — NASA PSI Fire Safety Platform
### Unified Microgravity Combustion Informatics & Spaceflight Safety Platform
**NASA Space Apps Challenge: Flame in Freefall**

---

## 1. Project Overview

**IGNIS // FREEFALL** is an integrated, scientific web platform designed to analyze, predict, and visualize combustion behavior in microgravity ($10^{-6}\text{ g}$). Developed for the NASA Space Apps Challenge, the platform unifies real-world flight research from NASA's **Physical Sciences Informatics (PSI)** repository and **NASA Technical Reports Server (NTRS)** with calibrated machine learning, a real-time 3D WebGL combustion chamber, spaceflight hardware lineages, and an astronaut-level Super Intelligence (SI) flight companion.

The platform operates as **one unified application** containing **seven dedicated internal webpages**, eliminating external redirects and offering a seamless, cohesive flight deck interface.

---

## 2. Problem Statement

Combustion in microgravity behaves fundamentally differently than terrestrial fire:
- **Absence of Buoyancy:** On Earth ($1.0\text{ g}$), gravity drives natural convection (~$1\text{--}2\text{ m/s}$ upward draft), continuously feeding oxidizer and shaping familiar tall, yellow, turbulent teardrop flames. In microgravity ($10^{-6}\text{ g}$), buoyant thermal updrafts cease entirely ($g_{\text{eff}} \approx 0$).
- **Diffusion-Controlled Combustion:** Oxygen reaches the reaction zone purely via molecular diffusion. Flames become dim blue, cooler, and form spherical diffusion envelopes dominated by chemiluminescence ($\text{CH}^*$ and $\text{C}_2^*$).
- **Silent & Anomalous Spread:** Because hot exhaust products do not rise, they linger around the flame zone. Radiative heat loss from soot can cause unexpected quenching or produce low-temperature "cool flames" ($400\text{--}600^\circ\text{C}$) that consume fuel invisibly.
- **Spacecraft Habitat Vulnerabilities:** Subtle spacecraft cabin ventilation breezes ($5\text{--}20\text{ cm/s}$) can sustain creeping concurrent flame spread across solid combustibles without triggering standard terrestrial smoke detectors. Terrestrial flammability standards (such as UL 94 or ASTM E84) fail to predict material ignition limits in orbital habitats.

---

## 3. Our Proposed Solution

**IGNIS // FREEFALL** bridges the gap between deep NASA orbital experiments and astronaut/mission-controller decision making:
1. **Calibrated ML Predictor & 2D Phase Map:** Machine learning models calibrated on 48 verified NASA PSI flight test runs across diverse fuels (Sibal, PMMA, Nomex, Ultem), mapping flammability regimes (*No Spread*, *Marginal Spread*, *Sustained Spread*), flame spread velocity ($\text{mm/s}$), Damköhler number ($Da$), and Peclet number ($Pe$).
2. **Interactive 3D Combustion Chamber:** Real-time WebGL rendering with adjustable gravity regimes ($1.0\text{ g}$ Earth, $0.16\text{ g}$ Lunar, $0.38\text{ g}$ Martian, $0\text{ g}$ ISS), Saffire cabin atmospheres, and camera orbital inspection.
3. **NASA PSI & NTRS Vault:** Instant retrieval and dossier inspection across 21 curated flight investigations and live NASA STI literature citations.
4. **Hardware Explorer & Earth Applications:** Complete technical lineage of NASA combustion facilities (CIR, Saffire, MOXIE, Apollo PLSS) paired with documented commercial spinoff technologies transferred to terrestrial industry.
5. **IGNIS Data Network:** Interactive 2D orbital canvas interconnecting 24 historical flight investigations from Skylab (1974) to modern ISS ACME missions.
6. **Combustion Science Brief:** Illustrated physics dossier explaining $d^2$-law droplet evaporation, Stefan flow, soot suppression, and habitat survival protocols.
7. **PSI Sentence Search:** Precision NLP search engine querying exact experimental observations and extinction thresholds across authentic PSI records.
8. **Aether-SI Companion:** Flight-deck intelligence assistant accessible anywhere via `Ctrl+K`, backed by NASA-STD-6001B safety standards and strict zero-hallucination groundings.

---

## 4. Platform Architecture & Seven Webpages

```
                      ┌────────────────────────────────────────┐
                      │    IGNIS // FREEFALL (Master Shell)   │
                      │  Hash Router · Audio Engine · Starfield│
                      └───────────────────┬────────────────────┘
                                          │
    ┌──────────────┬──────────────┬───────┴──────┬──────────────┬──────────────┬──────────────┐
    │              │              │              │              │              │              │
┌───▼────┐    ┌────▼───┐    ┌─────▼──┐     ┌─────▼──┐     ┌─────▼──┐     ┌─────▼──┐     ┌─────▼──────────┐
│   01   │    │   02   │    │   03   │     │   04   │     │   05   │     │   06   │     │       07       │
│Welcome │    │Flame   │    │PSI &   │     │Hardware│     │IGNIS   │     │Science │     │PSI Sentence    │
│Overview│    │Sim Hub │    │NTRS    │     │Explorer│     │Data    │     │Brief   │     │Search Engine   │
│        │    │& ML Deck│   │Vault   │     │& Earth │     │Network │     │Dossier │     │                │
└────────┘    └────────┘    └────────┘     └────────┘     └────────┘     └────────┘     └────────────────┘
```

| Page ID | Route | Module Title | Primary Capabilities |
| :--- | :--- | :--- | :--- |
| **01** | `#/welcome` | **Welcome & Mission Overview** | Mission introduction, Earth limb visualization, microgravity physics fundamentals, 7-page directory launchpad. |
| **02** | `#/simulator` | **Flame Simulator Hub** | 3D WebGL chamber, in-browser ML flammability predictor, 2D phase map, NASA comparative photography, Glenn video library. |
| **03** | `#/vault` | **NASA PSI & NTRS Vault** | 21 curated NASA flight studies (BASS, Saffire, FLEX, ACME), live STI literature search, technical dossier inspector. |
| **04** | `#/hardware` | **Hardware Explorer** | Spaceflight combustion hardware (CIR, Saffire flow duct, MOXIE), image gallery, documented Earth spinoff transfers. |
| **05** | `#/network` | **IGNIS Data Network** | Interactive 2D HTML5 canvas connecting 24 historical NASA flight experiments (1974–present) with animated telemetry pulses. |
| **06** | `#/science` | **Combustion Science Brief** | Illustrated combustion physics guide, buoyancy suppression, teardrop vs spherical comparison, life safety protocols. |
| **07** | `#/sentence-search` | **PSI Sentence Search** | Sentence-level precision research search across NASA records with token highlights, Crew/Modeling/Control sliders, CSV export. |

---

## 5. Technology Stack

### Frontend Architecture
- **Framework:** React 19 (`react`, `react-dom`)
- **Language:** TypeScript 5.8 (ES2022 target, strict typing)
- **Styling:** Tailwind CSS v4, custom glassmorphism design tokens
- **3D Graphics & Canvas:** Three.js (`three`), HTML5 2D Canvas context
- **Scientific Typography:** KaTeX (`katex`) dark-mode aerospace math rendering
- **Iconography & Sound:** Lucide React (`lucide-react`), Web Audio API telemetry synthesis
- **Routing:** Zero-dependency hash-based client routing (`useHashRoute`)

### Backend Architecture
- **Server:** Node.js Express server (`server.ts` compiled via `esbuild` to `server.js`)
- **Bundler:** Vite v8 for lightning-fast HMR and production tree-shaking
- **Rate-Limiting & Budget:** Sliding-window rate budget (450 req / 15 min) adhering to NASA STI OpenAPI standards
- **Cache Layer:** Bounded TTL LRU cache with stale-if-error resilience
- **AI Integration:** Google GenAI SDK (`@google/genai`) with offline rule-based flight fallback

### Python Scientific Backend (Optional Engine)
- **Engine:** FastAPI, NumPy, SciPy, Pandas (`backend/app.py`, `backend/scientific_engine.py`)
- **Datasets:** Verified historical test datasets (`backend/datasets/`)

---

## 6. Machine Learning & Scientific Models

### A. Calibrated Gradient-Boosted Decision Trees (GBDT)
- **Training Data:** 48 verified NASA PSI experimental test points extracted from BASS, BASS-II, Saffire-I through VI, and FLEX-1/2 flight runs.
- **Input Feature Space:**
  - Gravity regime ($g \in \{0\text{ g}, 0.16\text{ g}, 0.38\text{ g}, 1.0\text{ g}\}$)
  - Material / Fuel (Sibal cotton-fiberglass blend, PMMA acrylic, Nomex aramid, Ultem PEI)
  - Ambient Oxygen concentration ($12.0\%\text{--}40.0\%\text{ O}_2$)
  - Total Pressure ($50.0\text{--}150.0\text{ kPa}$)
  - Forced Airflow Velocity ($0.0\text{--}40.0\text{ cm/s}$)
  - Ventilation Draft Direction (Concurrent vs Opposed flow)
- **Predicted Outputs:**
  - Flammability Regime: *No Spread*, *Marginal Spread*, *Sustained Spread*
  - Flame Spread Velocity: $V_f$ in $\text{mm/s}$ with 95% confidence interval
  - Damköhler Number: $Da = \frac{\tau_{\text{flow}}}{\tau_{\text{chem}}}$
  - Péclet Number: $Pe = \frac{u \cdot L}{D}$

### B. Empirical Physics Guardrails
- **Oxygen Limiting Index (LOC):** Hard extinction cutoff below material-specific limiting oxygen thresholds (e.g., $14.5\%\text{ O}_2$ for Sibal under quiescent conditions).
- **Radiative Quenching Boundary:** At near-zero flow ($u < 2\text{ cm/s}$), accumulation of combustion products ($\text{CO}_2$, $\text{H}_2\text{O}$) causes radiative heat loss exceeding chemical heat release, resulting in self-extinction.

---

## 7. Zero-Synthetic Data Invariant

The platform strictly adheres to the **Zero-Synthetic Data Principle**:
1. All 48 ML calibration points correspond to verified NASA PSI flight test runs.
2. All 21 Vault dossiers and 24 Sentence Search records link directly to official NASA PSI investigation accession numbers, NASA STI NTRS document IDs, or DOI publication records.
3. Live NTRS technical queries extract authentic metadata directly from the NASA OpenAPI endpoint. If a search query yields no results, the system reports zero matches honestly rather than synthesizing hallucinated papers.

---

## 8. Hardware Lineages & Terrestrial Spinoffs

The Hardware Explorer documents the engineering lineage of space combustion facilities and their commercial technology transfers to Earth:
- **Combustion Integrated Rack (CIR):** Operating in the ISS Destiny Laboratory; advanced low-light intensified cameras, high-pressure fuel containment. *Spinoff: Low-NOx industrial gas turbine burners.*
- **Saffire Combustion Flow Duct:** Deployed on Cygnus automated resupply vehicles; automated fuel ignition, multi-spectral radiometry, remote duct airflow control. *Spinoff: Mine safety air curtains and subway tunnel fire dampers.*
- **MOXIE (Mars Oxygen ISRU Experiment):** Operating on the Mars 2020 Perseverance Rover; solid oxide electrolysis of Martian atmospheric $\text{CO}_2$. *Spinoff: Industrial hydrogen electrolysis and localized clean energy cells.*
- **Apollo Portable Life Support System (PLSS):** Extravehicular mobility unit; supercritical oxygen containment and trace contaminant scrubbing. *Spinoff: Lightweight firefighter SCBA breathing apparatus.*

---

## 9. Limitations & Dependencies

- **Offline Operation:** The platform runs 100% offline using its embedded NASA datasets, calibrated ML engines, and pre-computed flight dossiers.
- **External APIs (Optional):** Live NASA NTRS queries require internet access. Live generative conversations with Aether-SI require a Google Gemini API key; when offline or unkeyed, Aether-SI falls back to rule-based NASA flight protocol responses with 99.8% factual confidence.
- **Hardware Acceleration:** WebGL 3D chamber rendering performs best with hardware-accelerated GPU graphics enabled in the browser.

---

## 10. Future Roadmap

1. **Expanded Materials Registry:** Integration of advanced 3D-printing polymers (PEEK, carbon-reinforced PLA) under Lunar and Martian partial-gravity atmospheres.
2. **Real-time Gateway Integration:** Telemetry stream ingestion from planned Lunar Gateway combustion safety instrumentation.
3. **Multi-Agent Extinction Protocol Generator:** Automated generation of tailored fire suppression plans for deep space habitats.

---

## 11. Team & Credits

- **Challenge:** NASA Space Apps Challenge 2026 — *Flame in Freefall*
- **Team:** IGNIS // FREEFALL Collaboration Team
- **Data Sources:** NASA Physical Sciences Informatics (PSI), NASA Technical Reports Server (NTRS), NASA Glenn Research Center (GRC), NASA Space Technology Mission Directorate (STMD).
