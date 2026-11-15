# IGNIS // FREEFALL — User & Evaluation Guide

Welcome to the **IGNIS // FREEFALL** platform. This guide provides step-by-step instructions for judges, teammates, and evaluators to run, test, and explore the entire application on any Windows computer.

---

## 1. System Requirements

| Requirement | Minimum Specification | Recommended Specification |
| :--- | :--- | :--- |
| **Operating System** | Windows 10 (64-bit) or Windows 11 | Windows 11 (64-bit) |
| **Processor** | Dual-core 2.0 GHz Intel/AMD | Quad-core 2.5 GHz+ |
| **RAM** | 4 GB | 8 GB or more |
| **Storage** | 500 MB free space | 1 GB free space |
| **Web Browser** | Any modern browser (Google Chrome, Microsoft Edge, Firefox, Brave) | Google Chrome / Microsoft Edge with hardware acceleration enabled |

---

## 2. Required Software & Runtime

- **Node.js (v18.0.0 or higher):**
  - Download from the official website: [https://nodejs.org/](https://nodejs.org/)
  - Select the **LTS (Long Term Support)** version.
  - During installation, keep the default settings (ensure "Add to PATH" is checked).
  - To verify installation, open Command Prompt (`cmd`) and run:
    ```cmd
    node -v
    npm -v
    ```
- *(Optional)* **Python 3.10+**: Only required if running the optional standalone scientific backend in `backend/app.py`. The primary web application runs entirely on Node.js and does not require Python.

---

## 3. How to Extract the Project

1. If you received `PROJECT_FINAL.zip`, right-click the file and select **Extract All...**.
2. Choose a destination folder (e.g., your Desktop or `C:\Users\%USERNAME%\Desktop\PROJECT_FINAL`).
3. Click **Extract**.
4. Open the extracted `PROJECT_FINAL` folder.

---

## 4. Environment Variables & API Keys (Optional)

The platform is designed to run **100% offline out-of-the-box**. All 48 ML calibration points, 21 NASA PSI flight investigations, 24 orbital network nodes, and combustion physics models are embedded directly within the application.

### If you want to use live Google Gemini AI features:
You can provide a Gemini API key in either of two easy ways:
- **Method A (Inside the Web UI — Recommended):**
  1. Open the website.
  2. Click the **"SI Settings"** button in the top navigation header.
  3. Enter your Gemini API key and click **Save Key**. The key is stored safely in your browser's local storage and never leaves your machine.
- **Method B (Via `.env` file):**
  1. In the project root, open `.env.example`.
  2. Save a copy named `.env`.
  3. Set `GEMINI_API_KEY="your-actual-api-key"`.

*If no API key is provided, the platform automatically uses built-in, pre-calibrated NASA physics models with zero errors.*

---

## 5. One-Click Launch (`START_WEBSITE.bat`)

To start the entire platform:

1. In the project folder, locate **`START_WEBSITE.bat`**.
2. **Double-click `START_WEBSITE.bat`**.
3. The launcher will automatically:
   - Check for Node.js and npm.
   - Install dependencies (`npm install`) if running for the first time.
   - Verify the production build (`server.js` and `dist/`).
   - Start the local Express & Vite server on port `3000`.
   - Wait until the server is fully initialized.
   - **Automatically open your default web browser** to `http://localhost:3000`.
4. Keep the Command Prompt window open while using the website.

---

## 6. Website Walkthrough & Internal Navigation

The platform operates as **one cohesive web application** containing **seven internal pages**. 

### How to Navigate:
- **Main Navigation Drawer Button:** Click the **"Main navigation drawer [07]"** button on the top right of the header to open the centered directory card.
- **Quick Stepping:** Use the `<` and `>` arrows in the top header to flip sequentially between pages.
- **Top Brand:** Click the glowing flame beacon or `IGNIS // FREEFALL` title to return to the Welcome page.
- **Aether-SI Companion:** Press <kbd>Ctrl</kbd> + <kbd>K</kbd> anywhere on any page to toggle the flight assistant.

---

## 7. Major Features & Expected Interactions

### Page 01: Welcome & Mission Overview (`#/welcome`)
- **What it does:** Introduces microgravity combustion physics, visualizes the orbital flight regime at 400 km altitude, contrasts Earth buoyancy vs orbital diffusion, and provides a quick launchpad to all platform modules.
- **Key Interactions:**
  - Click **"Launch Flame Simulator"** to jump into the 3D chamber.
  - Click any row in the **Main navigation drawer** directory card to open that internal page.

### Page 02: Flame Simulator Hub (`#/simulator`)
- **What it does:** The central scientific simulation and prediction hub, featuring 4 internal sub-tabs:
  1. **3D Combustion Chamber (`tab=chamber`):** Interactive WebGL chamber with Three.js. Test variable gravity regimes: Earth ($1.0\text{ g}$), Moon ($0.16\text{ g}$), Mars ($0.38\text{ g}$), and ISS ($0\text{ g}$), and Saffire spacecraft atmosphere mixtures.
  2. **ML Flammability Predictor (`tab=prediction`):** Configure material (Sibal, PMMA, Nomex, Ultem), oxygen percentage ($12\text{--}40\%$), airflow velocity ($0\text{--}40\text{ cm/s}$), and gravity. View instant predicted spread rate ($\text{mm/s}$), flammability regime, Damköhler number ($Da$), and interactive 2D phase map.
  3. **NASA Comparative Science (`tab=science`):** Side-by-side photographic comparisons of Earth flames vs microgravity flames from NASA Glenn Research Center experiments.
  4. **NASA Flight Video Archive (`tab=footage`):** Curated authentic NASA microgravity combustion videos with modal player.

### Page 03: NASA PSI & NTRS Vault (`#/vault`)
- **What it does:** Comprehensive research vault housing 21 NASA flight investigations across BASS, Saffire, FLEX, and ACME programs.
- **Key Interactions:**
  - Search by acronym (e.g., `SLICE`, `BASS`, `FLEX`) or keyword (e.g., `flame liftoff`, `extinction`).
  - Filter by research category (Solid Fuels, Droplet Combustion, Gaseous Diffusion, Partial Gravity).
  - Click **"Inspect Technical Dossier"** to open full experimental parameters, flight hardware, and research objectives.
  - Click **"Load into Predictor"** inside any dossier to automatically populate the ML predictor with that study's exact flight conditions.

### Page 04: Hardware & Earth Applications Explorer (`#/hardware`)
- **What it does:** Spaceflight combustion hardware discovery platform documenting CIR, Saffire flow ducts, MOXIE, and Apollo PLSS.
- **Key Interactions:**
  - Search hardware by name or subsystem.
  - View multi-image NASA hardware galleries.
  - Review documented **Earth Spinoff Transfers** (e.g., how Saffire flow duct ventilation inspired commercial mine and tunnel fire safety air curtains).

### Page 05: IGNIS Data Network (`#/network`)
- **What it does:** Interactive 2D orbital canvas connecting 24 NASA microgravity combustion experiments from Skylab (1974) to modern ISS missions.
- **Key Interactions:**
  - Watch real-time animated orbital telemetry pulses.
  - Filter experiments by program, facility, or fuel type.
  - Click any experiment node to open detailed telemetry and flight timeline records.

### Page 06: Combustion Science Brief (`#/science`)
- **What it does:** Rich, illustrated scientific breakdown of buoyancy suppression, spherical flame chemiluminescence, $d^2$-law droplet evaporation, and spacecraft habitat survival protocols.
- **Key Interactions:**
  - Jump directly between sections: Physics Fundamentals, Spherical Flames, NASA Flight Experiments, Life Safety.
  - Review illustrated SVG flame envelopes and governing transport equations.

### Page 07: PSI Sentence Search (`#/sentence-search`)
- **What it does:** Sentence-level precision research search across NASA PSI records.
- **Key Interactions:**
  - Enter queries like `cool flame`, `soot suppression`, `extinction limit`.
  - Adjust priority weighting sliders for **Crew Safety**, **Numerical Modeling**, and **Atmosphere Control**.
  - Review highlighted exact sentence matches and copy results as formatted CSV.

### Aether-SI Scientific Companion (<kbd>Ctrl</kbd> + <kbd>K</kbd>)
- **What it does:** Flight assistant trained on NASA Technical Standards (`NASA-STD-6001B`) and microgravity combustion kinetics.
- **Key Interactions:**
  - Press <kbd>Ctrl</kbd> + <kbd>K</kbd> anywhere or click **Aether-SI** in the header.
  - Ask questions about any study, flammability prediction, or emergency fire safety protocol.

---

## 8. Troubleshooting Common Issues

### Issue 1: "Node.js is not recognized as an internal or external command"
- **Solution:** Node.js is not installed or not in your system PATH. Download and install Node.js (LTS) from [https://nodejs.org/](https://nodejs.org/). Make sure to restart your command prompt or terminal after installing.

### Issue 2: "Port 3000 is already in use"
- **Solution:** Another process is using port 3000. `START_WEBSITE.bat` will detect this and launch your browser to `http://localhost:3000`. If you wish to kill the existing process, open Command Prompt as Administrator and run:
  ```cmd
  netstat -ano | findstr :3000
  taskkill /PID <PID_NUMBER> /F
  ```
  Or change the port in `.env` (e.g., `PORT=3001`).

### Issue 3: Browser does not open automatically
- **Solution:** Open your preferred browser manually and navigate to:
  ```
  http://localhost:3000
  ```

### Issue 4: Visuals or 3D canvas appear slow
- **Solution:** Ensure hardware acceleration is enabled in your browser settings (Settings -> System -> "Use graphics acceleration when available").

---

## 9. How to Stop the Server

1. Switch to the Command Prompt window opened by `START_WEBSITE.bat`.
2. Press <kbd>Ctrl</kbd> + <kbd>C</kbd>.
3. When prompted `Terminate batch job (Y/N)?`, type `Y` and press <kbd>Enter</kbd>.
4. Or simply close the Command Prompt window.

---

## 10. Running the Test Suite (For Evaluators)

To verify all unit and integration tests:
1. Open Command Prompt in the project folder.
2. Run:
   ```cmd
   npm test
   ```
3. **Expected result:** 136 tests passing across 39 test suites with 0 failures.
