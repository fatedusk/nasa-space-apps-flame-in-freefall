# 🚀 IGNIS // FREEFALL
### NASA Space Apps Challenge — Understanding Fire in Freefall
> **From Microgravity Physics to Deep Space Exploration Safety**

[![NASA Space Apps Challenge](https://img.shields.io/badge/NASA_Space_Apps-2024-0B3D91?style=for-the-badge&logo=nasa&logoColor=white)](https://www.spaceappschallenge.org/)
[![Node.js](https://img.shields.io/badge/Node.js-v20-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![React 19](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Render Deploy](https://img.shields.io/badge/Deploy_to-Render-46E3B7?style=for-the-badge&logo=render&logoColor=black)](https://render.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-ff2e7e?style=for-the-badge)](LICENSE)

---

## 🌟 The Human Story Behind IGNIS

When an open flame lights on Earth, hot gas rises. Gravity pulls denser, cold air downwards, feeding fresh oxygen into the base of the fire in a continuous convective draft. That is why Earth flames are tall, flickering, yellow teardrops.

**In orbit, everything changes.**

Without gravity ($g \approx 0$), buoyancy vanishes. Natural convection stops completely. Flame plumes don't rise—instead, they expand into silent, ghostly blue spheres governed purely by molecular diffusion. Oxygen creeps in from all directions, combustion products linger as a suffocating halo around the reaction zone, and extinguishing attempts using terrestrial instincts can actually spread smoldering embers through ventilation corridors.

As humanity prepares for long-duration missions aboard the Lunar Gateway, Artemis surface habitats, and multi-year transits to Mars, **fire remains one of the absolute greatest existential threats to astronaut survival.**

We built **IGNIS** during the NASA Space Apps Challenge to bridge authentic NASA microgravity flight telemetry with accessible, interactive digital tools—turning half a century of spaceflight experiments into practical safety intelligence for future explorers.

---

## 🛸 Core Modules & Platform Architecture

IGNIS integrates five interactive systems into one seamless mission control experience:

### 1. 🪐 Welcome & Freefall Physics Briefing
- **Atmospheric Transition:** Experience the visual shift from sea-level 1.0g buoyancy to orbital freefall (400 km altitude aboard the ISS).
- **Physical Contrasts:** Side-by-side breakdown comparing terrestrial teardrop flames with microgravity spherical diffusion flames, convective vs. diffusion-limited kinetics, and soot agglomeration.

### 2. 🔥 3D Interactive Flame Simulator
- Built with Three.js and WebGL.
- Simulates spherical flame cores, oxygen starvation zones, and radiation quenching under user-controlled oxygen concentrations, cabin pressures, and forced draft airflows.
- Real-time physics engine demonstrating why flames in space burn cooler, dimmer, and far longer than on Earth.

### 3. 🔍 PSI Sentence Search
- **Data Source:** Curated directly from 21+ NASA Physical Sciences Informatics (PSI) flight records, including the **BASS** (Burning and Suppression of Solids), **Saffire** (Spacecraft Fire Safety), and **FLEX** (Flame Extinguishment Experiment) flight investigations.
- Natural-language search engine mining exact sentence-level observations, ignition thresholds, and material flammability limits from real mission logs.

### 4. ⚙️ Spaceflight Hardware Explorer & Earth Spinoffs
- Deep-dive interactive dossiers on flight-proven combustion research racks:
  - **CIR (Combustion Integrated Rack):** 100-liter triple-barrier combustion chamber on the ISS.
  - **Saffire Wind Tunnel:** Large-scale material flammability tests in automated Cygnus spacecraft.
  - **MOXIE & Lunar PLSS:** Deep space oxygen extraction and life support systems.
- **Documented Earth Spinoffs:** Explores how NASA combustion research gave birth to **Project FIRES** (revolutionizing modern municipal firefighter gear), lightweight breathing apparatus, and advanced household flame retardants.

### 5. 🌐 IGNIS Historical Data Network
- Interactive visual constellation linking five decades of NASA combustion research (1974 Skylab experiments to modern ISS investigations).
- Explore mission timelines, principal investigators, and primary research papers.

### 6. 🚨 Blast & Decompression Simulator (Space Station Guardian)
- Multi-compartment orbital space station digital twin.
- Simulates rapid hull breach dynamics, blast shockwave propagation, automatic pressure hatch interlocks, and crew safe-haven evacuation routes.

### 7. 🛰️ Aether-SI Flight Intelligence Copilot
- Grounded spaceflight fire safety assistant powered by Google Gemini API.
- Quick keyboard access via `Ctrl + K`.
- Provides calibrated advice on material flammability, limiting oxygen concentrations (LOC), and cabin suppression protocols.

---

## 💻 Tech Stack

- **Frontend:** React 19, TypeScript, Tailwind CSS, Three.js, Lucide Icons, KaTeX (LaTeX math rendering).
- **Backend:** Node.js, Express, ESBuild.
- **AI Copilot:** Google Gemini API (`@google/genai`).
- **Data Sources:** NASA Physical Sciences Informatics (PSI / OSDR), NASA Technical Reports Server (NTRS).

---

## 🚀 Quick Start (Run Locally)

### Prerequisites
- [Node.js](https://nodejs.org/) (version 18 or higher recommended)
- `npm` (bundled with Node.js)

### 1. Clone the repository
```bash
git clone https://github.com/fatedusk/nasa-space-apps-flame-in-freefall.git
cd nasa-space-apps-flame-in-freefall
```

### 2. Install dependencies & build
```bash
npm run build
```

### 3. Start the server
```bash
npm start
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser!

*(Optional: If you want to use the Aether-SI Gemini Copilot, create a `.env` file inside `main page/-FREEFALL-—-NASA-PSI-Fire-Safety-AI` with `GEMINI_API_KEY=your_key_here`, or enter it directly in the in-app Settings modal).*

---

## ☁️ Deploying to Render (Step-by-Step Guide)

You can deploy IGNIS to [Render](https://render.com) in less than 3 minutes. Render provides free hosting for web services!

### Option A: Automatic Blueprint Deploy (Easiest)
Because this repository includes a [`render.yaml`](render.yaml) file, you can deploy it directly:
1. Push this repository to your GitHub account.
2. Log in to [Render Dashboard](https://dashboard.render.com/).
3. Click **New +** and select **Blueprint**.
4. Connect your GitHub repository (`nasa-space-apps-flame-in-freefall`).
5. Render will automatically read `render.yaml`, configure the build command (`npm run build`), start command (`npm start`), and deploy!

---

### Option B: Manual Web Service Deploy (Step-by-Step)
If you prefer configuring it manually:

1. **Sign in to Render:**
   - Go to [dashboard.render.com](https://dashboard.render.com/) and log in with your GitHub account.

2. **Create New Web Service:**
   - Click the **New +** button in the top right.
   - Select **Web Service**.
   - Choose **Build and deploy from a Git repository**.

3. **Connect Repository:**
   - Find and select `nasa-space-apps-flame-in-freefall` from your GitHub repository list.

4. **Fill In Settings:**
   - **Name:** `ignis-flame-in-freefall` (or any name you like)
   - **Region:** Any region close to you (e.g., *Oregon (US West)* or *Frankfurt (EU)*)
   - **Branch:** `main`
   - **Root Directory:** Leave blank (defaults to root `/`)
   - **Runtime:** `Node`
   - **Build Command:**
     ```bash
     npm run build
     ```
   - **Start Command:**
     ```bash
     npm start
     ```
   - **Plan:** Choose the **Free** plan.

5. **Set Environment Variables (Optional):**
   - Click on **Advanced** or navigate to the **Environment** tab:
     - `NODE_VERSION`: `20.10.0`
     - `GEMINI_API_KEY`: *(Optional)* Your Google Gemini API Key for Aether-SI.

6. **Deploy:**
   - Click **Deploy Web Service** at the bottom.
   - Render will build the Vite frontend, compile the Express server, and provide you with a live `https://your-app-name.onrender.com` URL!

---

## 👥 The Team — Team Infonic

Developed with heart, sleepless nights, and curiosity for the **NASA Space Apps Challenge**:

- **Shivansh Patel** — Lead Architecture, Microgravity Dynamics & Full-Stack Integration
- **Team Infonic** — Scientific Research, Hardware Curation & UI/UX Design

---

## 📜 Scientific References & Acknowledgments

- **NASA Physical Sciences Informatics (PSI):** Open Science Data Repository (OSDR) combustion datasets.
- **NASA Glenn Research Center (GRC):** Microgravity Combustion Science Branch, BASS & FLEX Flight Investigation teams.
- **NASA-STD-6001B:** *Flammability, Offgassing, and Compatibility Requirements for Materials in Environments that Support Combustion.*
- Special thanks to the International Space Station crew members whose careful observations made this science possible.

---
*“Somewhere, something incredible is waiting to be known.” — Carl Sagan*
