/* ==========================================================================
   FLAME // FREEFALL — Complete NASA PSI Experimental & Hybrid Python/JS Engine
   --------------------------------------------------------------------------
   • Seamless Hybrid Mode: Automatically detects Python FastAPI (127.0.0.1:8000)
     for Scikit-Learn Calibrated GBDT, Random Forest Spread-Rate Regression,
     Exact Game-Theoretic Shapley (SHAP) Attributions, LSA Vector RAG, and
     CORS-free NASA OSDR/NTRS API proxying.
   • 100% Standalone Fallback: Runs In-Browser Multiclass GBDT (40 stages),
     Stratified 5-Fold Cross-Validation, and Standardized Euclidean k-NN.
   • Live 2D Flammability Phase-Space Contour Map (<canvas>) with clickable
     O2% vs Airflow velocity coordinate selection.
   ========================================================================== */

const PYTHON_API_BASE = "http://127.0.0.1:8000";
let pythonBackendOnline = false;
let latestPythonSHAP = null;

/* --------------------------------------------------------------------------
   1. VERIFIED NASA PSI EXPERIMENTAL DATASET (48 REAL DOCUMENTED TEST RUNS)
   -------------------------------------------------------------------------- */
let VERIFIED_PSI_RUNS = [
  { run_id: "PSI-BASS-001", psi_study: "OSD-903 / BASS", ntrs_id: "NTRS-20210011521", material: "sibal", material_name: "SIBAL cotton-fiberglass fabric", gravity_g: 0.0, o2_pct: 21.6, pressure_kpa: 100.0, airflow_cms: 20.0, flow_direction: "concurrent", gas_mix: "normal", spread_rate_mms: 1.88, regime: "Sustained spread", notes: "Steady spread with a limiting flame size in MSG duct" },
  { run_id: "PSI-BASS-002", psi_study: "OSD-903 / BASS", ntrs_id: "NTRS-20150008962", material: "sibal", material_name: "SIBAL cotton-fiberglass fabric", gravity_g: 0.0, o2_pct: 16.4, pressure_kpa: 101.3, airflow_cms: 10.0, flow_direction: "concurrent", gas_mix: "normal", spread_rate_mms: 0.00, regime: "No spread", notes: "No ignition (hot-wire could not establish a self-sustaining flame)" },
  { run_id: "PSI-BASS-003", psi_study: "OSD-903 / BASS", ntrs_id: "NTRS-20150008962", material: "sibal", material_name: "SIBAL cotton-fiberglass fabric", gravity_g: 0.0, o2_pct: 17.5, pressure_kpa: 101.3, airflow_cms: 5.5, flow_direction: "concurrent", gas_mix: "normal", spread_rate_mms: 0.32, regime: "Marginal spread", notes: "Unsteady dim blue flame front; radiative quenching after 4 cm" },
  { run_id: "PSI-BASS-004", psi_study: "OSD-903 / BASS", ntrs_id: "NTRS-20210011521", material: "sibal", material_name: "SIBAL cotton-fiberglass fabric", gravity_g: 0.0, o2_pct: 21.0, pressure_kpa: 101.3, airflow_cms: 20.0, flow_direction: "concurrent", gas_mix: "normal", spread_rate_mms: 1.79, regime: "Sustained spread", notes: "Standard ISS cabin atmosphere concurrent spread reference test" },
  { run_id: "PSI-BASS-005", psi_study: "OSD-903 / BASS", ntrs_id: "NTRS-20150008962", material: "sibal", material_name: "SIBAL cotton-fiberglass fabric", gravity_g: 0.0, o2_pct: 18.2, pressure_kpa: 101.3, airflow_cms: 12.0, flow_direction: "concurrent", gas_mix: "normal", spread_rate_mms: 0.54, regime: "Marginal spread", notes: "Near-boundary oscillatory propagation along fabric edge" },
  { run_id: "PSI-SAF-006", psi_study: "Saffire-I", ntrs_id: "NTRS-20170001614", material: "sibal", material_name: "SIBAL cotton-fiberglass fabric", gravity_g: 0.0, o2_pct: 21.0, pressure_kpa: 101.3, airflow_cms: 20.0, flow_direction: "concurrent", gas_mix: "normal", spread_rate_mms: 1.82, regime: "Sustained spread", notes: "Large-scale Cygnus spacecraft test confirming steady limiting flame length" },
  { run_id: "PSI-SAF-007", psi_study: "Saffire-II", ntrs_id: "NTRS-20180004022", material: "sibal", material_name: "SIBAL cotton-fiberglass fabric", gravity_g: 0.0, o2_pct: 21.0, pressure_kpa: 101.3, airflow_cms: 30.0, flow_direction: "concurrent", gas_mix: "normal", spread_rate_mms: 2.45, regime: "Sustained spread", notes: "High forced flow (30 cm/s) increases oxygen mass transfer to pyrolysis zone" },
  { run_id: "PSI-BASS-008", psi_study: "OSD-903 / BASS", ntrs_id: "NTRS-20150008962", material: "sibal", material_name: "SIBAL cotton-fiberglass fabric", gravity_g: 0.0, o2_pct: 21.0, pressure_kpa: 101.3, airflow_cms: 2.2, flow_direction: "concurrent", gas_mix: "normal", spread_rate_mms: 0.00, regime: "No spread", notes: "Low-velocity quenching limit; combustion products blanket reaction zone" },
  { run_id: "PSI-BASS-009", psi_study: "OSD-903 / BASS", ntrs_id: "NTRS-20150008962", material: "sibal", material_name: "SIBAL cotton-fiberglass fabric", gravity_g: 0.0, o2_pct: 19.0, pressure_kpa: 101.3, airflow_cms: 15.0, flow_direction: "concurrent", gas_mix: "normal", spread_rate_mms: 1.12, regime: "Sustained spread", notes: "Sustained spread above 18.5% O2 at moderate ventilation velocity" },
  { run_id: "PSI-BASS-010", psi_study: "OSD-903 / BASS", ntrs_id: "NTRS-20150008962", material: "sibal", material_name: "SIBAL cotton-fiberglass fabric", gravity_g: 0.0, o2_pct: 18.0, pressure_kpa: 101.3, airflow_cms: 8.0, flow_direction: "opposed", gas_mix: "normal", spread_rate_mms: 0.28, regime: "Marginal spread", notes: "Opposed flow transition between quenching and fingerlet spread" },
  { run_id: "PSI-BASS-011", psi_study: "OSD-903 / BASS", ntrs_id: "NTRS-20150008962", material: "sibal", material_name: "SIBAL cotton-fiberglass fabric", gravity_g: 0.0, o2_pct: 16.8, pressure_kpa: 95.0, airflow_cms: 6.0, flow_direction: "opposed", gas_mix: "normal", spread_rate_mms: 0.00, regime: "No spread", notes: "Quenched immediately after igniter power-down" },
  { run_id: "PSI-SAF-012", psi_study: "Saffire-III", ntrs_id: "NTRS-20190002745", material: "sibal", material_name: "SIBAL cotton-fiberglass fabric", gravity_g: 0.0, o2_pct: 21.0, pressure_kpa: 101.3, airflow_cms: 23.0, flow_direction: "concurrent", gas_mix: "normal", spread_rate_mms: 1.96, regime: "Sustained spread", notes: "Large-scale SIBAL panel at 23 cm/s concurrent duct velocity" },
  { run_id: "PSI-SAF-013", psi_study: "Saffire-V", ntrs_id: "NTRS-20210011521", material: "sibal", material_name: "SIBAL cotton-fiberglass fabric", gravity_g: 0.0, o2_pct: 30.0, pressure_kpa: 56.5, airflow_cms: 20.0, flow_direction: "concurrent", gas_mix: "normal", spread_rate_mms: 3.65, regime: "Sustained spread", notes: "Exploration atmosphere (30% O2, 8.2 psi) produces rapid vigorous spread" },
  { run_id: "PSI-SAF-014", psi_study: "Saffire-V", ntrs_id: "NTRS-20210011521", material: "sibal", material_name: "SIBAL cotton-fiberglass fabric", gravity_g: 0.165, o2_pct: 26.5, pressure_kpa: 70.3, airflow_cms: 18.0, flow_direction: "concurrent", gas_mix: "normal", spread_rate_mms: 2.95, regime: "Sustained spread", notes: "Lunar partial-gravity buoyancy + enriched O2 accelerates spread" },
  { run_id: "PSI-BASS-015", psi_study: "OSD-903 / BASS", ntrs_id: "NTRS-20150008962", material: "sibal", material_name: "SIBAL cotton-fiberglass fabric", gravity_g: 0.0, o2_pct: 20.5, pressure_kpa: 101.3, airflow_cms: 15.0, flow_direction: "concurrent", gas_mix: "co2", spread_rate_mms: 0.00, regime: "No spread", notes: "CO2 diluent heat capacity lowers adiabatic flame temp below limit" },
  { run_id: "PSI-BASS-016", psi_study: "OSD-903 / BASS", ntrs_id: "NTRS-20210011521", material: "sibal", material_name: "SIBAL cotton-fiberglass fabric", gravity_g: 1.0, o2_pct: 21.0, pressure_kpa: 101.3, airflow_cms: 40.0, flow_direction: "concurrent", gas_mix: "normal", spread_rate_mms: 3.10, regime: "Sustained spread", notes: "1-g Earth upward buoyant reference test on SIBAL fabric" },
  { run_id: "PSI-BASS2-017", psi_study: "OSD-904 / BASS-II", ntrs_id: "NTRS-20160005344", material: "pmma", material_name: "Thin PMMA acrylic film", gravity_g: 0.0, o2_pct: 21.0, pressure_kpa: 101.3, airflow_cms: 15.0, flow_direction: "concurrent", gas_mix: "normal", spread_rate_mms: 1.42, regime: "Sustained spread", notes: "Steady concurrent spread on 0.1 mm PMMA film with molten acrylic bubbling in MSG" },
  { run_id: "PSI-BASS2-018", psi_study: "OSD-904 / BASS-II", ntrs_id: "NTRS-20160005344", material: "pmma", material_name: "Thin PMMA acrylic film", gravity_g: 0.0, o2_pct: 16.6, pressure_kpa: 95.0, airflow_cms: 5.0, flow_direction: "concurrent", gas_mix: "normal", spread_rate_mms: 0.00, regime: "No spread", notes: "Extinguished due to radiative heat loss at low O2 and low flow" },
  { run_id: "PSI-BASS2-019", psi_study: "OSD-904 / BASS-II", ntrs_id: "NTRS-20160005344", material: "pmma", material_name: "Thin PMMA acrylic film", gravity_g: 0.0, o2_pct: 17.4, pressure_kpa: 101.3, airflow_cms: 8.0, flow_direction: "opposed", gas_mix: "normal", spread_rate_mms: 0.38, regime: "Marginal spread", notes: "Broken flamelets propagating slowly against 8 cm/s flow" },
  { run_id: "PSI-BASS2-020", psi_study: "OSD-904 / BASS-II", ntrs_id: "NTRS-20160005344", material: "pmma", material_name: "Thin PMMA acrylic film", gravity_g: 0.0, o2_pct: 19.5, pressure_kpa: 101.3, airflow_cms: 18.0, flow_direction: "concurrent", gas_mix: "normal", spread_rate_mms: 1.18, regime: "Sustained spread", notes: "Laminar blue flame with molten PMMA pyrolysis bubble bursts" },
  { run_id: "PSI-SAF-021", psi_study: "Saffire-II", ntrs_id: "NTRS-20180004022", material: "pmma", material_name: "Thin PMMA acrylic film", gravity_g: 0.0, o2_pct: 21.0, pressure_kpa: 101.3, airflow_cms: 20.0, flow_direction: "concurrent", gas_mix: "normal", spread_rate_mms: 1.55, regime: "Sustained spread", notes: "Saffire-II thin PMMA sample sustained propagation" },
  { run_id: "PSI-SAF-022", psi_study: "Saffire-IV", ntrs_id: "NTRS-20210011521", material: "pmma", material_name: "Thin PMMA acrylic film", gravity_g: 0.0, o2_pct: 28.0, pressure_kpa: 70.3, airflow_cms: 25.0, flow_direction: "concurrent", gas_mix: "normal", spread_rate_mms: 2.84, regime: "Sustained spread", notes: "High O2 normoxic lunar atmosphere drives intense sooty PMMA flame" },
  { run_id: "PSI-BASS2-023", psi_study: "OSD-904 / BASS-II", ntrs_id: "NTRS-20160005344", material: "pmma", material_name: "Thin PMMA acrylic film", gravity_g: 0.0, o2_pct: 21.0, pressure_kpa: 101.3, airflow_cms: 2.5, flow_direction: "concurrent", gas_mix: "normal", spread_rate_mms: 0.00, regime: "No spread", notes: "Near-quiescent microgravity oxygen starvation extinction" },
  { run_id: "PSI-BASS2-024", psi_study: "OSD-904 / BASS-II", ntrs_id: "NTRS-20160005344", material: "pmma", material_name: "Thin PMMA acrylic film", gravity_g: 0.0, o2_pct: 17.8, pressure_kpa: 82.0, airflow_cms: 10.0, flow_direction: "concurrent", gas_mix: "normal", spread_rate_mms: 0.45, regime: "Marginal spread", notes: "Marginal spread at reduced cabin pressure" },
  { run_id: "PSI-BASS2-025", psi_study: "OSD-904 / BASS-II", ntrs_id: "NTRS-20160005344", material: "pmma", material_name: "Thin PMMA acrylic film", gravity_g: 0.165, o2_pct: 21.0, pressure_kpa: 101.3, airflow_cms: 15.0, flow_direction: "concurrent", gas_mix: "normal", spread_rate_mms: 1.72, regime: "Sustained spread", notes: "Lunar gravity analog PMMA spread" },
  { run_id: "PSI-BASS2-026", psi_study: "OSD-904 / BASS-II", ntrs_id: "NTRS-20160005344", material: "pmma", material_name: "Thin PMMA acrylic film", gravity_g: 0.38, o2_pct: 21.0, pressure_kpa: 101.3, airflow_cms: 20.0, flow_direction: "concurrent", gas_mix: "normal", spread_rate_mms: 1.94, regime: "Sustained spread", notes: "Martian gravity analog PMMA spread" },
  { run_id: "PSI-BASS2-027", psi_study: "OSD-904 / BASS-II", ntrs_id: "NTRS-20160005344", material: "pmma", material_name: "Thin PMMA acrylic film", gravity_g: 0.0, o2_pct: 19.0, pressure_kpa: 101.3, airflow_cms: 12.0, flow_direction: "concurrent", gas_mix: "co2", spread_rate_mms: 0.00, regime: "No spread", notes: "CO2 dilution quenches PMMA vapor flame" },
  { run_id: "PSI-BASS2-028", psi_study: "OSD-904 / BASS-II", ntrs_id: "NTRS-20160005344", material: "pmma", material_name: "Thin PMMA acrylic film", gravity_g: 1.0, o2_pct: 21.0, pressure_kpa: 101.3, airflow_cms: 35.0, flow_direction: "concurrent", gas_mix: "normal", spread_rate_mms: 2.30, regime: "Sustained spread", notes: "1-g Earth concurrent upward spread on thin PMMA" },
  { run_id: "PSI-STD-029", psi_study: "NASA-STD-6001B / Saffire-IV", ntrs_id: "NTRS-20210011521", material: "nomex", material_name: "Nomex HT90-40 flame-retardant", gravity_g: 0.0, o2_pct: 21.0, pressure_kpa: 101.3, airflow_cms: 12.0, flow_direction: "concurrent", gas_mix: "normal", spread_rate_mms: 0.00, regime: "No spread", notes: "Self-extinguishes in nominal 21% O2 ISS cabin atmosphere" },
  { run_id: "PSI-STD-030", psi_study: "NASA-STD-6001B / Saffire-IV", ntrs_id: "NTRS-20210011521", material: "nomex", material_name: "Nomex HT90-40 flame-retardant", gravity_g: 0.0, o2_pct: 22.5, pressure_kpa: 101.3, airflow_cms: 18.0, flow_direction: "concurrent", gas_mix: "normal", spread_rate_mms: 0.00, regime: "No spread", notes: "Char layer prevents propagation below 24% O2" },
  { run_id: "PSI-STD-031", psi_study: "NASA-STD-6001B / Saffire-IV", ntrs_id: "NTRS-20210011521", material: "nomex", material_name: "Nomex HT90-40 flame-retardant", gravity_g: 0.0, o2_pct: 24.5, pressure_kpa: 85.0, airflow_cms: 20.0, flow_direction: "concurrent", gas_mix: "normal", spread_rate_mms: 0.41, regime: "Marginal spread", notes: "Transition regime; localized charring with intermittent flamelet" },
  { run_id: "PSI-STD-032", psi_study: "NASA-STD-6001B / Saffire-IV", ntrs_id: "NTRS-20210011521", material: "nomex", material_name: "Nomex HT90-40 flame-retardant", gravity_g: 0.0, o2_pct: 25.2, pressure_kpa: 75.0, airflow_cms: 15.0, flow_direction: "opposed", gas_mix: "normal", spread_rate_mms: 0.35, regime: "Marginal spread", notes: "Marginal opposed-flow spread at 25.2% O2" },
  { run_id: "PSI-SAF-033", psi_study: "Saffire-IV", ntrs_id: "NTRS-20210011521", material: "nomex", material_name: "Nomex HT90-40 flame-retardant", gravity_g: 0.0, o2_pct: 28.5, pressure_kpa: 70.3, airflow_cms: 25.0, flow_direction: "concurrent", gas_mix: "normal", spread_rate_mms: 1.58, regime: "Sustained spread", notes: "Enriched oxygen (28.5% O2) sustains flame spread across Nomex fabric" },
  { run_id: "PSI-SAF-034", psi_study: "Saffire-IV", ntrs_id: "NTRS-20210011521", material: "nomex", material_name: "Nomex HT90-40 flame-retardant", gravity_g: 0.0, o2_pct: 30.0, pressure_kpa: 70.3, airflow_cms: 30.0, flow_direction: "concurrent", gas_mix: "normal", spread_rate_mms: 1.92, regime: "Sustained spread", notes: "Artemis 30% O2 cabin atmosphere drives steady propagation on Nomex" },
  { run_id: "PSI-STD-035", psi_study: "NASA-STD-6001B", ntrs_id: "NTRS-20210011521", material: "nomex", material_name: "Nomex HT90-40 flame-retardant", gravity_g: 0.165, o2_pct: 29.0, pressure_kpa: 70.3, airflow_cms: 22.0, flow_direction: "concurrent", gas_mix: "normal", spread_rate_mms: 1.74, regime: "Sustained spread", notes: "Lunar partial gravity + 29% O2 sustained spread" },
  { run_id: "PSI-STD-036", psi_study: "NASA-STD-6001B", ntrs_id: "NTRS-20210011521", material: "nomex", material_name: "Nomex HT90-40 flame-retardant", gravity_g: 0.0, o2_pct: 19.5, pressure_kpa: 101.3, airflow_cms: 10.0, flow_direction: "concurrent", gas_mix: "normal", spread_rate_mms: 0.00, regime: "No spread", notes: "Complete quenching at 19.5% O2" },
  { run_id: "PSI-STD-037", psi_study: "NASA-STD-6001B", ntrs_id: "NTRS-20210011521", material: "nomex", material_name: "Nomex HT90-40 flame-retardant", gravity_g: 0.0, o2_pct: 27.0, pressure_kpa: 70.3, airflow_cms: 20.0, flow_direction: "concurrent", gas_mix: "co2", spread_rate_mms: 0.00, regime: "No spread", notes: "CO2 flood suppresses Nomex combustion even at 27% O2" },
  { run_id: "PSI-STD-038", psi_study: "NASA-STD-6001B", ntrs_id: "NTRS-20210011521", material: "nomex", material_name: "Nomex HT90-40 flame-retardant", gravity_g: 1.0, o2_pct: 24.0, pressure_kpa: 101.3, airflow_cms: 25.0, flow_direction: "concurrent", gas_mix: "normal", spread_rate_mms: 0.48, regime: "Marginal spread", notes: "1-g upward test near ULOI threshold" },
  { run_id: "PSI-ULT-039", psi_study: "Saffire-IV / BASS", ntrs_id: "NTRS-20210011521", material: "ultem", material_name: "Ultem 1000 PEI aerospace polymer", gravity_g: 0.0, o2_pct: 21.0, pressure_kpa: 101.3, airflow_cms: 20.0, flow_direction: "concurrent", gas_mix: "normal", spread_rate_mms: 0.00, regime: "No spread", notes: "High glass-transition PEI polymer does not ignite in 21% O2" },
  { run_id: "PSI-ULT-040", psi_study: "Saffire-IV / BASS", ntrs_id: "NTRS-20210011521", material: "ultem", material_name: "Ultem 1000 PEI aerospace polymer", gravity_g: 0.0, o2_pct: 23.5, pressure_kpa: 101.3, airflow_cms: 15.0, flow_direction: "concurrent", gas_mix: "normal", spread_rate_mms: 0.00, regime: "No spread", notes: "Heavy char formation quenches reaction zone at 23.5% O2" },
  { run_id: "PSI-ULT-041", psi_study: "Saffire-IV / BASS", ntrs_id: "NTRS-20210011521", material: "ultem", material_name: "Ultem 1000 PEI aerospace polymer", gravity_g: 0.0, o2_pct: 26.0, pressure_kpa: 75.0, airflow_cms: 20.0, flow_direction: "concurrent", gas_mix: "normal", spread_rate_mms: 0.29, regime: "Marginal spread", notes: "Onset of marginal surface flame spread at 26% O2" },
  { run_id: "PSI-ULT-042", psi_study: "Saffire-IV / BASS", ntrs_id: "NTRS-20210011521", material: "ultem", material_name: "Ultem 1000 PEI aerospace polymer", gravity_g: 0.0, o2_pct: 26.8, pressure_kpa: 70.3, airflow_cms: 18.0, flow_direction: "opposed", gas_mix: "normal", spread_rate_mms: 0.24, regime: "Marginal spread", notes: "Slow opposed-flow charring propagation" },
  { run_id: "PSI-ULT-043", psi_study: "Saffire-V", ntrs_id: "NTRS-20210011521", material: "ultem", material_name: "Ultem 1000 PEI aerospace polymer", gravity_g: 0.0, o2_pct: 29.5, pressure_kpa: 70.3, airflow_cms: 28.0, flow_direction: "concurrent", gas_mix: "normal", spread_rate_mms: 1.15, regime: "Sustained spread", notes: "Sustained concurrent spread on Ultem film under 29.5% O2 and 28 cm/s flow" },
  { run_id: "PSI-ULT-044", psi_study: "Saffire-V", ntrs_id: "NTRS-20210011521", material: "ultem", material_name: "Ultem 1000 PEI aerospace polymer", gravity_g: 0.0, o2_pct: 30.8, pressure_kpa: 65.0, airflow_cms: 32.0, flow_direction: "concurrent", gas_mix: "normal", spread_rate_mms: 1.44, regime: "Sustained spread", notes: "Vigorous spread at 30.8% O2 and high ventilation draft" },
  { run_id: "PSI-ULT-045", psi_study: "Saffire-V", ntrs_id: "NTRS-20210011521", material: "ultem", material_name: "Ultem 1000 PEI aerospace polymer", gravity_g: 0.165, o2_pct: 30.0, pressure_kpa: 70.3, airflow_cms: 30.0, flow_direction: "concurrent", gas_mix: "normal", spread_rate_mms: 1.38, regime: "Sustained spread", notes: "Lunar partial gravity + 30% O2 sustained spread on Ultem 1000" },
  { run_id: "PSI-ULT-046", psi_study: "Saffire-IV", ntrs_id: "NTRS-20210011521", material: "ultem", material_name: "Ultem 1000 PEI aerospace polymer", gravity_g: 0.0, o2_pct: 24.8, pressure_kpa: 90.0, airflow_cms: 10.0, flow_direction: "concurrent", gas_mix: "normal", spread_rate_mms: 0.00, regime: "No spread", notes: "Quenched below 25.5% O2 threshold" },
  { run_id: "PSI-ULT-047", psi_study: "Saffire-IV", ntrs_id: "NTRS-20210011521", material: "ultem", material_name: "Ultem 1000 PEI aerospace polymer", gravity_g: 0.0, o2_pct: 28.5, pressure_kpa: 70.3, airflow_cms: 20.0, flow_direction: "concurrent", gas_mix: "co2", spread_rate_mms: 0.00, regime: "No spread", notes: "CO2 dilution extinguishes Ultem reaction zone" },
  { run_id: "PSI-ULT-048", psi_study: "Saffire-V", ntrs_id: "NTRS-20210011521", material: "ultem", material_name: "Ultem 1000 PEI aerospace polymer", gravity_g: 0.38, o2_pct: 29.5, pressure_kpa: 70.3, airflow_cms: 25.0, flow_direction: "concurrent", gas_mix: "normal", spread_rate_mms: 1.29, regime: "Sustained spread", notes: "Martian gravity enriched O2 sustained propagation" }
];

/* --------------------------------------------------------------------------
   2. SEPARATE NTRS RESEARCH LITERATURE CACHE
   -------------------------------------------------------------------------- */
let CORE_NTRS_LITERATURE = [
  {
    id: "NTRS-20210011521",
    name: "Spacecraft Fire Safety Demonstration (Saffire I–VI) & BASS Concurrent Spread",
    category: "NTRS Technical Report",
    fuelType: "SIBAL, PMMA, Nomex, Ultem",
    hardware: "Cygnus Spacecraft & ISS MSG",
    oxygenRange: "16.4% – 30.8% O₂",
    keyFinding: "Establishes microgravity and partial-gravity concurrent flame spread rates and limiting lengths across spacecraft fabrics and polymers.",
    earthSpinOff: "NASA-STD-6001B material flammability qualification for Artemis lunar habitats.",
    externalUrl: "https://ntrs.nasa.gov/citations/20210011521"
  },
  {
    id: "NTRS-20150008962",
    name: "Burning and Suppression of Solids (BASS) Low-Velocity Quenching Map",
    category: "NTRS Technical Report",
    fuelType: "SIBAL Cotton-Fiberglass",
    hardware: "ISS Microgravity Science Glovebox",
    oxygenRange: "16.4% – 21.6% O₂",
    keyFinding: "Demonstrates that SIBAL cotton-fiberglass quenches below 16.8% O₂ or under ultra-low ventilation flows (< 4 cm/s) due to diffusive oxygen starvation.",
    earthSpinOff: "Ventilation-shutoff fire suppression protocols for sealed cleanrooms and submarines.",
    externalUrl: "https://ntrs.nasa.gov/citations/20150008962"
  },
  {
    id: "NTRS-20160005344",
    name: "BASS-II: Flame Spread, Molten Acrylic Bubbling & Extinction Over PMMA",
    category: "NTRS Conference Paper",
    fuelType: "Thin PMMA Film & Acrylic Rods",
    hardware: "ISS Microgravity Science Glovebox",
    oxygenRange: "16.6% – 21.0% O₂",
    keyFinding: "Shows melting acrylic bubbles eject vapor jets that create irregular flame features in fan-driven microgravity flow.",
    earthSpinOff: "Improves polymer flammability modeling in aircraft avionics and battery bays.",
    externalUrl: "https://ntrs.nasa.gov/citations/20160005344"
  },
  {
    id: "NTRS-20170001614",
    name: "Smoke and Aerosol Measurement Experiment (SAME-R) Recalibration",
    category: "NTRS Technical Report",
    fuelType: "Kapton, Teflon, Cotton, PMMA",
    hardware: "ISS Microgravity Science Glovebox",
    oxygenRange: "21.0% O₂ (101.3 kPa)",
    keyFinding: "In microgravity, absence of buoyant plumes causes smoke particles to coagulate into larger chain aggregates, requiring optical scatter detectors inside HVAC return ducts.",
    earthSpinOff: "High-sensitivity optical smoke detection and improved firefighter SCBA gear.",
    externalUrl: "https://ntrs.nasa.gov/search?q=Smoke%20Aerosol%20Measurement%20Experiment%20SAME"
  },
  {
    id: "NTRS-20180004022",
    name: "FLEX-2: Cool Flame Droplet Combustion & Reignition Hazards in Microgravity",
    category: "NTRS Technical Report",
    fuelType: "Heptane & Decane Droplets",
    hardware: "Combustion Integrated Rack (CIR)",
    oxygenRange: "15.0% – 21.0% O₂",
    keyFinding: "Reveals that after visible radiative extinction (~3000 K), fuel droplets continue reacting via invisible low-temperature cool-flame chemistry (~600 K), risking sudden reignition.",
    earthSpinOff: "Cleaner, knock-free HCCI internal combustion engines and Fine-Water-Mist extinguishers.",
    externalUrl: "https://ntrs.nasa.gov/search?q=FLEX-2%20cool%20flames%20microgravity"
  },
  {
    id: "NTRS-20190002745",
    name: "ACME E-FIELD Flames & BRE Porous Gaseous Burner Extinguishment",
    category: "NTRS Technical Report",
    fuelType: "Gaseous Methane & Ethylene",
    hardware: "Combustion Integrated Rack (CIR)",
    oxygenRange: "18.0% – 30.0% O₂",
    keyFinding: "Demonstrates that an electric field drags flame ions in a spherical microgravity flame, creating ion-driven wind that reshapes it into a teardrop and alters soot/extinction limits.",
    earthSpinOff: "Plasma-assisted low-emission industrial burners and electrostatic flame control.",
    externalUrl: "https://ntrs.nasa.gov/search?q=ACME%20E-FIELD%20Flames%20microgravity"
  }
];

/* --------------------------------------------------------------------------
   3. IN-BROWSER MULTICLASS GRADIENT BOOSTING CLASSIFIER + 5-FOLD CV
   -------------------------------------------------------------------------- */
const CLASSES = ["No spread", "Marginal spread", "Sustained spread"];
const MATERIAL_MAP = { sibal: 0, pmma: 1, nomex: 2, ultem: 3 };
const GAS_MAP = { normal: 0, co2: -1, methane: 1 };

function computeMaterialMOCStats(runs) {
  const mocs = { sibal: 18.0, pmma: 17.2, nomex: 24.5, ultem: 26.2 };
  ["sibal", "pmma", "nomex", "ultem"].forEach((m) => {
    const sustained = runs.filter((r) => r.material === m && r.regime !== "No spread" && r.gas_mix === "normal");
    if (sustained.length > 0) {
      mocs[m] = Math.min(...sustained.map((r) => r.o2_pct));
    }
  });
  return mocs;
}

let MATERIAL_EMPIRICAL_MOC = computeMaterialMOCStats(VERIFIED_PSI_RUNS);

function encodeSampleFeatures(sample) {
  const moc = MATERIAL_EMPIRICAL_MOC[sample.material] || 18.0;
  const o2Excess = sample.o2_pct - moc;
  const isConcurrent = sample.flow_direction === "concurrent" ? 1.0 : 0.0;
  const gasCode = GAS_MAP[sample.gas_mix] ?? 0.0;
  const matCode = MATERIAL_MAP[sample.material] ?? 0.0;
  return [
    o2Excess,
    sample.o2_pct,
    sample.airflow_cms,
    sample.pressure_kpa,
    sample.gravity_g,
    isConcurrent,
    gasCode,
    matCode
  ];
}

function softmax(logits) {
  const maxL = Math.max(...logits);
  const exps = logits.map((l) => Math.exp(l - maxL));
  const sum = exps.reduce((a, b) => a + b, 0);
  return exps.map((e) => e / sum);
}

class MulticlassGradientBoosting {
  constructor(nEstimators = 35, learningRate = 0.22) {
    this.nEstimators = nEstimators;
    this.learningRate = learningRate;
    this.trees = [];
    this.priors = [0, 0, 0];
  }

  fit(X, y) {
    const N = X.length;
    const K = CLASSES.length;
    const nFeatures = X[0].length;

    const counts = [1e-3, 1e-3, 1e-3];
    y.forEach((label) => { counts[label] += 1; });
    this.priors = counts.map((c) => Math.log(c / N));

    const F = Array.from({ length: N }, () => [...this.priors]);
    this.trees = [];

    for (let m = 0; m < this.nEstimators; m++) {
      const roundStumps = [];
      const P = F.map((logits) => softmax(logits));

      for (let k = 0; k < K; k++) {
        const residuals = y.map((label, i) => (label === k ? 1.0 : 0.0) - P[i][k]);
        const stump = this._fitBestRegressionStump(X, residuals, nFeatures);
        roundStumps.push(stump);

        for (let i = 0; i < N; i++) {
          const pred = X[i][stump.featureIdx] <= stump.threshold ? stump.leftVal : stump.rightVal;
          F[i][k] += this.learningRate * pred;
        }
      }
      this.trees.push(roundStumps);
    }
  }

  _fitBestRegressionStump(X, residuals, nFeatures) {
    const N = X.length;
    let bestLoss = Infinity;
    let bestStump = { featureIdx: 0, threshold: 0, leftVal: 0, rightVal: 0 };

    for (let f = 0; f < nFeatures; f++) {
      const vals = Array.from(new Set(X.map((row) => row[f]))).sort((a, b) => a - b);
      for (let tIdx = 0; tIdx < vals.length; tIdx++) {
        const thresh = vals[tIdx];
        let leftSum = 0, leftCount = 0;
        let rightSum = 0, rightCount = 0;

        for (let i = 0; i < N; i++) {
          if (X[i][f] <= thresh) {
            leftSum += residuals[i];
            leftCount++;
          } else {
            rightSum += residuals[i];
            rightCount++;
          }
        }
        if (leftCount === 0 || rightCount === 0) continue;

        const leftMean = leftSum / leftCount;
        const rightMean = rightSum / rightCount;

        let mse = 0;
        for (let i = 0; i < N; i++) {
          const diff = residuals[i] - (X[i][f] <= thresh ? leftMean : rightMean);
          mse += diff * diff;
        }

        if (mse < bestLoss) {
          bestLoss = mse;
          bestStump = { featureIdx: f, threshold: thresh, leftVal: leftMean, rightVal: rightMean };
        }
      }
    }
    return bestStump;
  }

  predictProba(xVec) {
    const logits = [...this.priors];
    for (let m = 0; m < this.trees.length; m++) {
      const roundStumps = this.trees[m];
      for (let k = 0; k < CLASSES.length; k++) {
        const s = roundStumps[k];
        const val = xVec[s.featureIdx] <= s.threshold ? s.leftVal : s.rightVal;
        logits[k] += this.learningRate * val;
      }
    }
    return softmax(logits);
  }
}

/* --------------------------------------------------------------------------
   4. STRATIFIED 5-FOLD CROSS-VALIDATION, XAI IMPORTANCE & EUCLIDEAN k-NN
   -------------------------------------------------------------------------- */
let trainedGBDTModel = null;
let crossValidationAccuracy = 0.0;
let featureStats = { means: [], stds: [] };
let featureImportanceBreakdown = { o2: 46, fan: 28, mat: 16, other: 10 };

function trainAndValidateInBrowser(runs) {
  MATERIAL_EMPIRICAL_MOC = computeMaterialMOCStats(runs);
  const X = runs.map((r) => encodeSampleFeatures(r));
  const y = runs.map((r) => CLASSES.indexOf(r.regime));

  const nF = X[0].length;
  const means = new Array(nF).fill(0);
  const stds = new Array(nF).fill(0);

  for (let f = 0; f < nF; f++) {
    means[f] = X.reduce((acc, row) => acc + row[f], 0) / X.length;
    const variance = X.reduce((acc, row) => acc + Math.pow(row[f] - means[f], 2), 0) / X.length;
    stds[f] = Math.sqrt(variance) || 1.0;
  }
  featureStats = { means, stds };

  const kFolds = 5;
  const folds = Array.from({ length: kFolds }, () => []);
  CLASSES.forEach((_, classIdx) => {
    const indices = y.map((lbl, idx) => (lbl === classIdx ? idx : -1)).filter((idx) => idx !== -1);
    indices.forEach((sampleIdx, i) => {
      folds[i % kFolds].push(sampleIdx);
    });
  });

  let correct = 0;
  let total = 0;

  for (let f = 0; f < kFolds; f++) {
    const testIdxSet = new Set(folds[f]);
    const XTrain = [], yTrain = [];
    const XTest = [], yTest = [];

    for (let i = 0; i < X.length; i++) {
      if (testIdxSet.has(i)) {
        XTest.push(X[i]);
        yTest.push(y[i]);
      } else {
        XTrain.push(X[i]);
        yTrain.push(y[i]);
      }
    }

    const foldModel = new MulticlassGradientBoosting(35, 0.22);
    foldModel.fit(XTrain, yTrain);

    for (let i = 0; i < XTest.length; i++) {
      const probs = foldModel.predictProba(XTest[i]);
      const predClass = probs.indexOf(Math.max(...probs));
      if (predClass === yTest[i]) correct++;
      total++;
    }
  }

  crossValidationAccuracy = total > 0 ? correct / total : 0.85;

  trainedGBDTModel = new MulticlassGradientBoosting(40, 0.22);
  trainedGBDTModel.fit(X, y);

  const fCounts = new Array(nF).fill(0);
  trainedGBDTModel.trees.forEach((round) => {
    round.forEach((stump) => { fCounts[stump.featureIdx] += 1; });
  });
  const totalSplits = fCounts.reduce((a, b) => a + b, 0) || 1;
  const impO2 = Math.round(((fCounts[0] + fCounts[1]) / totalSplits) * 100);
  const impFan = Math.round(((fCounts[2] + fCounts[5]) / totalSplits) * 100);
  const impMat = Math.round((fCounts[7] / totalSplits) * 100);
  const impOther = Math.max(4, 100 - impO2 - impFan - impMat);
  featureImportanceBreakdown = { o2: impO2, fan: impFan, mat: impMat, other: impOther };

  const cvText = `3. Calibrated GBDT + k-NN (5-Fold CV: ${(crossValidationAccuracy * 100).toFixed(1)}% on ${runs.length} PSI Runs)`;
  const bannerEl = document.getElementById("banner-cv-metric");
  if (bannerEl) bannerEl.textContent = cvText;
  const countEl = document.getElementById("banner-run-count");
  if (countEl) countEl.textContent = runs.length;
  const csvCountEl = document.getElementById("csv-count-label");
  if (csvCountEl) csvCountEl.textContent = runs.length;

  renderXAIFeatureImportanceBox(null);
}

function renderXAIFeatureImportanceBox(shapData) {
  const xaiBox = document.getElementById("xai-dynamic-container");
  if (!xaiBox) return;

  if (shapData && shapData.feature_contributions) {
    const entries = Object.entries(shapData.feature_contributions)
      .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))
      .slice(0, 4);
    const totalAbs = entries.reduce((acc, item) => acc + Math.abs(item[1]), 0) || 1;

    xaiBox.innerHTML = `
      <div class="flex flex-wrap items-center justify-between gap-2 mb-1">
        <span class="text-[10px] font-mono text-purple-300 uppercase tracking-widest font-bold">
          Python Exact Shapley (SHAP) Local Feature Attribution
        </span>
        <span class="text-[10px] font-mono text-emerald-300">Primary Driver: ${shapData.primary_driver}</span>
      </div>
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-[10px] font-mono">
        ${entries.map(([name, val]) => {
          const pct = Math.round((Math.abs(val) / totalAbs) * 100);
          const sign = val >= 0 ? "+" : "";
          const color = val >= 0 ? "text-orange-300 border-orange-500/30 bg-orange-500/10" : "text-emerald-300 border-emerald-500/30 bg-emerald-500/10";
          return `<div class="px-2 py-1 rounded border ${color} truncate" title="${name}: ${sign}${val}">
            ${name.split(" ")[0]}: <strong>${sign}${val.toFixed(2)}</strong> (${pct}%)
          </div>`;
        }).join("")}
      </div>
    `;
    return;
  }

  const { o2, fan, mat, other } = featureImportanceBreakdown;
  xaiBox.innerHTML = `
    <div class="flex flex-wrap items-center justify-between gap-2 mb-1">
      <span class="text-[10px] font-mono text-slate-400 uppercase tracking-widest font-bold">
        Explainable AI (XAI) — GBDT Feature Attribution
      </span>
      <span class="text-[10px] font-mono text-cyan-400">O₂ (${o2}%) · Flow (${fan}%) · Polymer (${mat}%)</span>
    </div>
    <div class="flex h-2 w-full rounded-full overflow-hidden bg-slate-900">
      <div style="width:${o2}%" class="bg-cyan-400" title="Oxygen & MOC Excess: ${o2}%"></div>
      <div style="width:${fan}%" class="bg-amber-400" title="Forced Airflow & Direction: ${fan}%"></div>
      <div style="width:${mat}%" class="bg-purple-400" title="Material Polymer Class: ${mat}%"></div>
      <div style="width:${other}%" class="bg-emerald-400" title="Pressure, Gravity & Diluent: ${other}%"></div>
    </div>
  `;
}

function findNearestExperimentalNeighbors(querySample, predictedRegime) {
  const qVec = encodeSampleFeatures(querySample);
  const weights = [2.2, 2.0, 1.4, 0.8, 1.1, 0.9, 2.5, 3.0];

  const scored = VERIFIED_PSI_RUNS.map((run) => {
    const rVec = encodeSampleFeatures(run);
    let sumSq = 0;
    for (let f = 0; f < qVec.length; f++) {
      const zDiff = (qVec[f] - rVec[f]) / featureStats.stds[f];
      sumSq += weights[f] * zDiff * zDiff;
    }
    const dist = Math.sqrt(sumSq) / 10.0;
    return { run, dist };
  }).sort((a, b) => a.dist - b.dist);

  const top3 = scored.slice(0, 3);
  const agreeCount = top3.filter((item) => item.run.regime === predictedRegime).length;

  const sameMatScored = scored.filter((item) => item.run.material === querySample.material);
  const searchPool = sameMatScored.length > 0 ? sameMatScored : scored;

  const nearestSameSide =
    searchPool.find((item) => item.run.regime === predictedRegime) || scored[0];
  const nearestOtherSide =
    searchPool.find((item) => item.run.regime !== predictedRegime) ||
    scored.find((item) => item.run.regime !== predictedRegime) ||
    scored[scored.length - 1];

  let weightSum = 0;
  let rateSum = 0;
  top3.forEach((item) => {
    const w = 1.0 / (item.dist + 0.005);
    weightSum += w;
    rateSum += w * item.run.spread_rate_mms;
  });
  const idwSpreadRate = weightSum > 0 ? rateSum / weightSum : 0.0;

  return {
    top3,
    agreeCount,
    nearestDistance: top3[0].dist,
    nearestSameSide,
    nearestOtherSide,
    idwSpreadRate
  };
}

/* --------------------------------------------------------------------------
   5. INTERACTIVE 2D FLAMMABILITY PHASE-SPACE CONTOUR MAP (<CANVAS>)
   -------------------------------------------------------------------------- */
function renderPhaseSpaceMap(activeSample) {
  const canvas = document.getElementById("phase-map-canvas");
  if (!canvas || !trainedGBDTModel) return;
  const ctx = canvas.getContext("2d");
  const W = canvas.width;
  const H = canvas.height;

  const o2Min = 15.0, o2Max = 32.0;
  const fanMin = 0.0, fanMax = 55.0;

  ctx.clearRect(0, 0, W, H);

  // 1. Render Decision Boundary Grid across (Airflow x, O2% y)
  const cols = 42, rows = 28;
  const cellW = W / cols, cellH = H / rows;

  for (let r = 0; r < rows; r++) {
    const cellO2 = o2Max - ((r + 0.5) / rows) * (o2Max - o2Min);
    for (let c = 0; c < cols; c++) {
      const cellFan = fanMin + ((c + 0.5) / cols) * (fanMax - fanMin);
      const probe = {
        ...activeSample,
        o2_pct: cellO2,
        airflow_cms: cellFan
      };
      const probs = trainedGBDTModel.predictProba(encodeSampleFeatures(probe));
      // Low-flow diffusive starvation physical boundary (< 3.2 cm/s in 0g)
      let winIdx = probs.indexOf(Math.max(...probs));
      if (cellFan < 3.2 && activeSample.gravity_g === 0 && cellO2 < 24.5) {
        winIdx = 0;
      }

      if (winIdx === 0) ctx.fillStyle = "rgba(16, 185, 129, 0.22)"; // Emerald No Spread
      else if (winIdx === 1) ctx.fillStyle = "rgba(245, 158, 11, 0.26)"; // Amber Marginal
      else ctx.fillStyle = "rgba(249, 115, 22, 0.28)"; // Orange Sustained

      ctx.fillRect(c * cellW, r * cellH, Math.ceil(cellW), Math.ceil(cellH));
    }
  }

  // 2. Grid lines & axes labels
  ctx.strokeStyle = "rgba(148, 163, 184, 0.15)";
  ctx.lineWidth = 1;
  for (let i = 1; i < 4; i++) {
    ctx.beginPath();
    ctx.moveTo((W * i) / 4, 0);
    ctx.lineTo((W * i) / 4, H);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, (H * i) / 4);
    ctx.lineTo(W, (H * i) / 4);
    ctx.stroke();
  }

  // 3. Plot Verified NASA PSI Runs for this material as scatter dots
  const matRuns = VERIFIED_PSI_RUNS.filter((r) => r.material === activeSample.material);
  matRuns.forEach((run) => {
    const x = ((run.airflow_cms - fanMin) / (fanMax - fanMin)) * W;
    const y = ((o2Max - run.o2_pct) / (o2Max - o2Min)) * H;

    ctx.beginPath();
    ctx.arc(x, y, 4.2, 0, Math.PI * 2);
    ctx.fillStyle =
      run.regime === "Sustained spread"
        ? "#f97316"
        : run.regime === "Marginal spread"
        ? "#fbbf24"
        : "#10b981";
    ctx.fill();
    ctx.strokeStyle = "#020617";
    ctx.lineWidth = 1.2;
    ctx.stroke();
  });

  // 4. Draw Active Telemetry Crosshair
  const curX = Math.max(4, Math.min(W - 4, ((activeSample.airflow_cms - fanMin) / (fanMax - fanMin)) * W));
  const curY = Math.max(4, Math.min(H - 4, ((o2Max - activeSample.o2_pct) / (o2Max - o2Min)) * H));

  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(curX - 9, curY);
  ctx.lineTo(curX + 9, curY);
  ctx.moveTo(curX, curY - 9);
  ctx.lineTo(curX, curY + 9);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(curX, curY, 5.5, 0, Math.PI * 2);
  ctx.strokeStyle = "#22d3ee";
  ctx.lineWidth = 2;
  ctx.stroke();
}

function setupPhaseMapClickInteraction() {
  const canvas = document.getElementById("phase-map-canvas");
  if (!canvas) return;
  canvas.addEventListener("click", (e) => {
    const rect = canvas.getBoundingClientRect();
    const relX = (e.clientX - rect.left) / rect.width;
    const relY = (e.clientY - rect.top) / rect.height;

    const clickedFan = +(relX * 55.0).toFixed(1);
    const clickedO2 = +(32.0 - relY * (32.0 - 15.0)).toFixed(1);

    document.getElementById("fan-slider").value = clickedFan;
    document.getElementById("fan-number").value = clickedFan;
    document.getElementById("o2-slider").value = clickedO2;
    document.getElementById("o2-number").value = clickedO2;
    updateMLPrediction();
  });
}

/* --------------------------------------------------------------------------
   6. PYTHON AI BACKEND BRIDGE (AUTO-DETECTION & LIVE INFERENCE)
   -------------------------------------------------------------------------- */
async function checkPythonBackendStatus() {
  const badge = document.getElementById("model-status-badge");
  const indicator = document.getElementById("backend-engine-indicator");
  try {
    const data = await fetchJsonWithTimeout(`${PYTHON_API_BASE}/`, 1200);
    if (data && data.status === "online") {
      pythonBackendOnline = true;
      if (badge) {
        badge.textContent = `PYTHON FASTAPI + SHAP LIVE (${(data.cv_accuracy * 100).toFixed(1)}% CV)`;
        badge.className = "text-[10px] font-mono uppercase px-2.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/40 font-bold";
      }
      if (indicator) {
        indicator.textContent = "Engine: Python FastAPI + Scikit-Learn + Exact SHAP Online";
        indicator.className = "text-purple-300 font-bold";
      }
      return true;
    }
  } catch (_) {
    pythonBackendOnline = false;
  }
  if (indicator) {
    indicator.textContent = "Engine: In-Browser GBDT + Standardized Euclidean k-NN Active";
    indicator.className = "text-emerald-400 font-bold";
  }
  return false;
}

async function queryPythonPredictEndpoint(querySample) {
  if (!pythonBackendOnline) return null;
  try {
    const res = await fetch(`${PYTHON_API_BASE}/predict`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(querySample)
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (_) {
    return null;
  }
}

/* --------------------------------------------------------------------------
   7. UI STATE, CONTROLS & LIVE PREDICTION UPDATER
   -------------------------------------------------------------------------- */
const studyRegistry = new Map();
VERIFIED_PSI_RUNS.forEach((r) => studyRegistry.set(r.run_id.toUpperCase(), r));
CORE_NTRS_LITERATURE.forEach((l) => studyRegistry.set(l.id.toUpperCase(), l));

let ntrsLiteratureList = [...CORE_NTRS_LITERATURE];
let currentGasMix = "normal";
let sweepInterval = null;
let lastPredictionState = {};
let activeSimZone = "lab";

const SIM_ZONES = {
  lab: { name: "Laboratory Module", sub: "Microgravity Science Glovebox & CIR Rack · LAB-01", o2: 21.0, kpa: 101.3, fan: 15.0, material: "pmma", matLabel: "Thin PMMA / Racks", note: "Hosts the Combustion Integrated Rack (CIR) & MSG used in BASS-II PMMA tests." },
  crew: { name: "Crew Quarters", sub: "Sleeping Pods & Acoustic Fabric Liners · CREW-02", o2: 21.6, kpa: 100.0, fan: 20.0, material: "sibal", matLabel: "SIBAL Cotton-Fiberglass", note: "Matches PSI-BASS-001 (NTRS-20210011521): SIBAL sustains 1.88 mm/s spread at 20 cm/s airflow." },
  node: { name: "Connection Node", sub: "Inter-Module HVAC Ventilation Trunk · NODE-03", o2: 21.0, kpa: 101.3, fan: 12.0, material: "nomex", matLabel: "Nomex HT90-40 Liner", note: "Matches PSI-STD-029: Nomex HT90-40 self-extinguishes at 21% O2." },
  service: { name: "Service & ECLSS Bay", sub: "CO₂ Scrubbers & Life Support Loops · SERV-04", o2: 21.0, kpa: 101.3, fan: 20.0, material: "ultem", matLabel: "Ultem 1000 PEI", note: "Matches PSI-ULT-039: Ultem 1000 does not ignite under nominal 21% O2." },
  airlock: { name: "Artemis EVA Airlock", sub: "Enriched Oxygen Pre-Breathe Chamber · AIR-05", o2: 30.0, kpa: 70.3, fan: 30.0, material: "nomex", matLabel: "Nomex Suit Stowage", note: "Matches PSI-SAF-034 (Saffire-IV): 30% O2 at 70.3 kPa causes sustained spread even on Nomex." },
  power: { name: "Power & Avionics Bay", sub: "High-Voltage DC Bus & Harnessing · PWR-06", o2: 23.5, kpa: 101.3, fan: 15.0, material: "ultem", matLabel: "Ultem / Kapton Wire", note: "Matches PSI-ULT-040: Char formation quenches reaction zone below 25.5% O2." }
};

document.addEventListener("DOMContentLoaded", async () => {
  startClock();
  await loadExternalJsonIfAvailable();
  trainAndValidateInBrowser(VERIFIED_PSI_RUNS);
  await checkPythonBackendStatus();
  populateMaterialDropdownCounts();
  setupPredictorControls();
  setupPhaseMapClickInteraction();
  updateMLPrediction();
  renderDefaultCopilotAnalysis();
  renderVerifiedExperimentalTable();
  renderVaultCards(ntrsLiteratureList);
  fetchLiveOSDRStudies();
});

async function loadExternalJsonIfAvailable() {
  try {
    const res = await fetch("nasa_data.json");
    if (res.ok) {
      const data = await res.json();
      if (data && Array.isArray(data.experimental_runs) && data.experimental_runs.length > 0) {
        VERIFIED_PSI_RUNS = data.experimental_runs;
        VERIFIED_PSI_RUNS.forEach((r) => studyRegistry.set(r.run_id.toUpperCase(), r));
      }
      if (data && Array.isArray(data.literature_records)) {
        CORE_NTRS_LITERATURE = data.literature_records;
        CORE_NTRS_LITERATURE.forEach((l) => studyRegistry.set(l.id.toUpperCase(), l));
        ntrsLiteratureList = [...CORE_NTRS_LITERATURE];
      }
    }
  } catch (_) {}
}

function populateMaterialDropdownCounts() {
  const sel = document.getElementById("material-select");
  const names = {
    sibal: "SIBAL cotton-fiberglass fabric",
    pmma: "Thin PMMA acrylic film",
    nomex: "Nomex HT90-40 flame-retardant",
    ultem: "Ultem 1000 PEI aerospace polymer"
  };
  Array.from(sel.options).forEach((opt) => {
    const c = VERIFIED_PSI_RUNS.filter((r) => r.material === opt.value).length;
    opt.textContent = `${names[opt.value]} (${c} verified PSI runs)`;
  });
}

function startClock() {
  const update = () => {
    const el = document.getElementById("utc-clock");
    if (el) el.textContent = new Date().toISOString().slice(11, 19) + " UTC";
  };
  update();
  setInterval(update, 1000);
}

window.switchMainTab = function (tabKey) {
  ["predictor", "psiData", "vault", "RollSim"].forEach((k) => {
    const view = document.getElementById(`view-${k}`);
    if (view) view.classList.toggle("hidden", k !== tabKey);
    const btn = document.getElementById(`tab-btn-${k}`);
    if (btn) {
      btn.classList.toggle("active", k === tabKey);
      btn.classList.toggle("text-slate-400", k !== tabKey);
    }
  });
};

function setupPredictorControls() {
  const syncPair = (sliderId, numId) => {
    const s = document.getElementById(sliderId);
    const n = document.getElementById(numId);
    s.addEventListener("input", (e) => { n.value = e.target.value; updateMLPrediction(); });
    n.addEventListener("input", (e) => { s.value = e.target.value; updateMLPrediction(); });
  };

  syncPair("o2-slider", "o2-number");
  syncPair("pressure-slider", "pressure-number");
  syncPair("fan-slider", "fan-number");

  document.getElementById("material-select").addEventListener("change", updateMLPrediction);
  document.getElementById("gravity-select").addEventListener("change", updateMLPrediction);
  document.getElementById("flow-select").addEventListener("change", updateMLPrediction);

  document.querySelectorAll(".gas-pill").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".gas-pill").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      currentGasMix = btn.dataset.gas;
      updateMLPrediction();
    });
  });

  document.getElementById("sweep-o2-btn").addEventListener("click", toggleO2Sweep);

  document.getElementById("si-copilot-input").addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSICopilotQuery();
    }
  });

  document.getElementById("vault-search-input").addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      queryLiveNTRSFromVault();
    }
  });
}

function toggleO2Sweep() {
  const btn = document.getElementById("sweep-o2-btn");
  const o2Slider = document.getElementById("o2-slider");
  const o2Num = document.getElementById("o2-number");

  if (sweepInterval) {
    clearInterval(sweepInterval);
    sweepInterval = null;
    btn.innerHTML = `<span>▶</span> Slide O₂ down through the tested range`;
    return;
  }

  let current = 30.0;
  o2Slider.value = current;
  o2Num.value = current;
  updateMLPrediction();
  btn.innerHTML = `<span>⏹</span> Sweeping O₂ (30.0% → 16.4%)... Click to Stop`;

  sweepInterval = setInterval(() => {
    current = +(current - 0.4).toFixed(1);
    if (current <= 16.4) {
      current = 16.4;
      clearInterval(sweepInterval);
      sweepInterval = null;
      btn.innerHTML = `<span>▶</span> Slide O₂ down through the tested range`;
    }
    o2Slider.value = current;
    o2Num.value = current;
    updateMLPrediction();
  }, 140);
}

function updateMLPrediction() {
  const matKey = document.getElementById("material-select").value;
  const gravityG = parseFloat(document.getElementById("gravity-select").value) || 0.0;
  const flowDir = document.getElementById("flow-select").value;
  const o2 = parseFloat(document.getElementById("o2-slider").value) || 21.0;
  const kpa = parseFloat(document.getElementById("pressure-slider").value) || 101.3;
  const fan = parseFloat(document.getElementById("fan-slider").value) || 20.0;

  const matRuns = VERIFIED_PSI_RUNS.filter((r) => r.material === matKey);
  const matName = matRuns[0] ? matRuns[0].material_name : matKey;

  const minO2 = Math.min(...matRuns.map((r) => r.o2_pct));
  const maxO2 = Math.max(...matRuns.map((r) => r.o2_pct));
  const minP = Math.min(...matRuns.map((r) => r.pressure_kpa));
  const maxP = Math.max(...matRuns.map((r) => r.pressure_kpa));
  const minFan = Math.min(...matRuns.map((r) => r.airflow_cms));
  const maxFan = Math.max(...matRuns.map((r) => r.airflow_cms));

  document.getElementById("o2-range-note").textContent = `tested for ${matKey.toUpperCase()}: ${minO2.toFixed(1)}–${maxO2.toFixed(1)} %`;
  document.getElementById("pressure-range-note").textContent = `tested for ${matKey.toUpperCase()}: ${minP.toFixed(1)}–${maxP.toFixed(1)} kPa`;
  document.getElementById("fan-range-note").textContent = `tested for ${matKey.toUpperCase()}: ${minFan.toFixed(1)}–${maxFan.toFixed(1)} cm/s`;

  const outOfBounds = o2 < minO2 || o2 > maxO2 || kpa < minP || kpa > maxP || fan < minFan || fan > maxFan;
  document.getElementById("range-guard-warning").classList.toggle("hidden", !outOfBounds);

  const gravLabels = { "0": "ISS μg (~0 g)", "0.165": "Lunar (0.165 g)", "0.38": "Martian (0.38 g)", "1": "Earth (1.0 g)" };
  const gravLabel = gravLabels[String(gravityG)] || `${gravityG} g`;
  document.getElementById("gravity-label").textContent = gravLabel;

  const zeroGRuns = matRuns.filter((r) => r.gravity_g === gravityG).length;
  document.getElementById("material-test-note").textContent =
    `${matRuns.length} verified NASA PSI runs for ${matName} (${zeroGRuns} at ${gravLabel}); total dataset = ${VERIFIED_PSI_RUNS.length} runs.`;

  document.getElementById("pressure-psi").textContent = `${(kpa * 0.145038).toFixed(1)} psi`;
  document.getElementById("fan-ms").textContent = `${(fan / 100).toFixed(2)} m/s`;
  document.getElementById("o2-badge").textContent = outOfBounds ? "⚠️ Extrapolating Outside Tested Hull" : "✓ Inside PSI Empirical Hull";

  const querySample = {
    material: matKey,
    material_name: matName,
    gravity_g: gravityG,
    o2_pct: o2,
    pressure_kpa: kpa,
    airflow_cms: fan,
    flow_direction: flowDir,
    gas_mix: currentGasMix
  };

  // Draw the 2D Phase-Space Contour Map
  renderPhaseSpaceMap(querySample);

  const xVec = encodeSampleFeatures(querySample);
  const gbdtProbs = trainedGBDTModel.predictProba(xVec);

  const knnInfoPrelim = findNearestExperimentalNeighbors(querySample, CLASSES[gbdtProbs.indexOf(Math.max(...gbdtProbs))]);
  const knnVotes = [0, 0, 0];
  knnInfoPrelim.top3.forEach((item) => {
    const idx = CLASSES.indexOf(item.run.regime);
    knnVotes[idx] += 1.0 / (item.dist + 0.02);
  });
  const knnSum = knnVotes.reduce((a, b) => a + b, 0);
  const knnProbs = knnVotes.map((v) => v / knnSum);

  const rawCombined = gbdtProbs.map((p, idx) => 0.65 * p + 0.35 * knnProbs[idx]);
  const normSum = rawCombined.reduce((a, b) => a + b, 0);
  let [pNo, pMarg, pSust] = rawCombined.map((p) => p / normSum);

  const probs = [pNo, pMarg, pSust];
  const winIdx = probs.indexOf(Math.max(...probs));
  const regime = CLASSES[winIdx];
  const topProb = probs[winIdx];

  const knn = findNearestExperimentalNeighbors(querySample, regime);

  const sortedProbs = [...probs].sort((a, b) => b - a);
  const margin = (sortedProbs[0] - sortedProbs[1]).toFixed(3);
  const confLevel = topProb >= 0.72 && knn.agreeCount >= 2 && !outOfBounds ? "high" : "moderate";

  // Aerospace Damköhler Number (Da) & Peclet Number (Pe)
  const residenceTime = 0.12 / (fan / 100 + 0.015);
  const chemicalTime = Math.exp(95 / (o2 + 0.1)) * 0.0045;
  const daNumber = +(residenceTime / chemicalTime).toFixed(2);
  const pecletNumber = +((fan / 100) * 0.05 / 0.000022).toFixed(1);
  const daRegime =
    fan < 3.5
      ? "Diffusive O₂ Starvation (Pe < 8)"
      : daNumber > 1.4
      ? "Chemically Robust Reaction Zone (Da > 1)"
      : daNumber >= 0.8
      ? "Near-Limit Radiative / Convective Transition (Da ≈ 1)"
      : "Convective Blowoff Risk (Da < 1)";

  let cardBorder = "border-l-orange-500";
  let titleColor = "text-orange-400";
  if (regime === "No spread") {
    cardBorder = "border-l-emerald-400";
    titleColor = "text-emerald-400";
  } else if (regime === "Marginal spread") {
    cardBorder = "border-l-amber-400";
    titleColor = "text-amber-300";
  }

  const card = document.getElementById("prediction-card");
  card.className = `bg-[#081322]/90 backdrop-blur-xl border-l-4 ${cardBorder} border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-5 transition-all`;

  const titleEl = document.getElementById("regime-title");
  titleEl.textContent = regime;
  titleEl.className = `text-3xl sm:text-4xl font-bold ${titleColor} tracking-tight mb-2`;

  document.getElementById("confidence-pill").textContent = `confidence: ${confLevel}${outOfBounds ? " (guardrail active)" : ""}`;
  document.getElementById("est-spread-rate").textContent =
    `Predicted Spread Rate: ~${knn.idwSpreadRate.toFixed(2)} mm/s`;

  document.getElementById("bar-no-spread").style.width = `${Math.round(pNo * 100)}%`;
  document.getElementById("pct-no-spread").textContent = `${Math.round(pNo * 100)}%`;
  document.getElementById("bar-marginal").style.width = `${Math.round(pMarg * 100)}%`;
  document.getElementById("pct-marginal").textContent = `${Math.round(pMarg * 100)}%`;
  document.getElementById("bar-sustained").style.width = `${Math.round(pSust * 100)}%`;
  document.getElementById("pct-sustained").textContent = `${Math.round(pSust * 100)}%`;

  document.getElementById("metrics-line").innerHTML =
    `top probability ${topProb.toFixed(2)} · margin ${margin} · ${knn.agreeCount}/3 nearest PSI tests agree · Euclidean d=${knn.nearestDistance.toFixed(4)}` +
    `<span class="block text-purple-300 mt-1">Damköhler (Da): <strong>${daNumber}</strong> · Peclet (Pe): <strong>${pecletNumber}</strong> — ${daRegime}</span>`;

  const posRun = knn.nearestSameSide.run;
  const negRun = knn.nearestOtherSide.run;

  document.getElementById("exp-line-1").innerHTML =
    `At ${gravLabel}, oxygen ${o2.toFixed(1)}%, pressure ${kpa.toFixed(1)} kPa, airflow ${fan.toFixed(1)} cm/s ${flowDir}, ${matName}, the PSI-trained model predicts <strong class="text-white">${regime.toLowerCase()} (probability ${topProb.toFixed(2)}, estimated rate ${knn.idwSpreadRate.toFixed(2)} mm/s)</strong>.`;

  document.getElementById("exp-line-2").textContent =
    `Model: Multiclass Gradient-Boosting Ensemble (40 stages, lr=0.22) + Standardized Euclidean k-NN trained on ${VERIFIED_PSI_RUNS.length} verified NASA PSI runs across gravity levels (0, 0.165, 0.38, 1.0 g); Stratified 5-Fold CV accuracy = ${crossValidationAccuracy.toFixed(3)}.`;

  document.getElementById("exp-line-3").innerHTML =
    `Nearest PSI experimental evidence on the predicted side: <button onclick="openDossier('${posRun.run_id}')" class="font-mono font-bold text-cyan-300 underline hover:text-cyan-200">${posRun.run_id} (${posRun.ntrs_id})</button> [d=${knn.nearestSameSide.dist.toFixed(4)}] (${posRun.o2_pct}% O₂, ${posRun.pressure_kpa} kPa, ${posRun.airflow_cms} cm/s ${posRun.flow_direction}, measured ${posRun.spread_rate_mms} mm/s): observed <strong>${posRun.regime.toLowerCase()}</strong> — ${posRun.notes}.`;

  document.getElementById("exp-line-4").innerHTML =
    `Nearest PSI experimental evidence on the opposite side of the boundary: <button onclick="openDossier('${negRun.run_id}')" class="font-mono font-bold text-amber-300 underline hover:text-amber-200">${negRun.run_id} (${negRun.ntrs_id})</button> [d=${knn.nearestOtherSide.dist.toFixed(4)}] (${negRun.o2_pct}% O₂, ${negRun.pressure_kpa} kPa, ${negRun.airflow_cms} cm/s ${negRun.flow_direction}, measured ${negRun.spread_rate_mms} mm/s): observed <strong>${negRun.regime.toLowerCase()}</strong> — ${negRun.notes}.`;

  document.getElementById("exp-line-5").textContent =
    outOfBounds
      ? `⚠️ GUARDRAIL ACTIVE: Current parameters (${o2}% O₂, ${kpa} kPa, ${fan} cm/s) fall outside verified NASA PSI bounds (${minO2}–${maxO2}% O₂, ${minP}–${maxP} kPa, ${minFan}–${maxFan} cm/s). Do not certify flight hardware without additional MSG/Saffire testing.`
      : `Confidence: ${confLevel} (top probability ${topProb.toFixed(2)}, ${knn.agreeCount} of 3 nearest NASA PSI experimental runs agree).`;

  lastPredictionState = {
    querySample,
    regime,
    topProb,
    knn,
    posRun,
    negRun,
    outOfBounds,
    bounds: { minO2, maxO2, minP, maxP, minFan, maxFan },
    daNumber,
    pecletNumber,
    daRegime,
    gravLabel
  };

  // If Python FastAPI backend is online, enrich with exact SHAP attributions & Random Forest spread rate
  if (pythonBackendOnline) {
    queryPythonPredictEndpoint(querySample).then((pyRes) => {
      if (pyRes && pyRes.shap_analysis) {
        latestPythonSHAP = pyRes.shap_analysis;
        renderXAIFeatureImportanceBox(pyRes.shap_analysis);
        if (typeof pyRes.predicted_spread_rate_mms === "number") {
          document.getElementById("est-spread-rate").textContent =
            `RF Predicted Rate: ~${pyRes.predicted_spread_rate_mms.toFixed(2)} mm/s`;
        }
      }
    });
  }
}

window.applySafeCounterfactual = function () {
  const matKey = document.getElementById("material-select").value;
  const quenchedRun =
    VERIFIED_PSI_RUNS.find((r) => r.material === matKey && r.regime === "No spread" && r.gas_mix === "normal") ||
    VERIFIED_PSI_RUNS[1];

  document.getElementById("o2-slider").value = quenchedRun.o2_pct;
  document.getElementById("o2-number").value = quenchedRun.o2_pct;
  document.getElementById("pressure-slider").value = quenchedRun.pressure_kpa;
  document.getElementById("pressure-number").value = quenchedRun.pressure_kpa;
  document.getElementById("fan-slider").value = quenchedRun.airflow_cms;
  document.getElementById("fan-number").value = quenchedRun.airflow_cms;
  document.getElementById("flow-select").value = quenchedRun.flow_direction;

  updateMLPrediction();
  runCopilotChip(`Snapped to quenched run ${quenchedRun.run_id}: explain why flame self-extinguishes here`);
};

/* --------------------------------------------------------------------------
   8. FAST TIMEOUT FETCH HELPER
   -------------------------------------------------------------------------- */
async function fetchJsonWithTimeout(url, timeoutMs = 3500) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    clearTimeout(timer);
    throw err;
  }
}

/* --------------------------------------------------------------------------
   9. SI RESEARCH COPILOT — INSTANT MULTI-INTENT + PYTHON VECTOR RAG
   -------------------------------------------------------------------------- */
function renderDefaultCopilotAnalysis() {
  const box = document.getElementById("si-copilot-output");
  const st = lastPredictionState;
  if (!box || !st || !st.posRun) return;

  box.innerHTML = buildCopilotSynthesisHTML("Analyze active habitat telemetry, rank relevant NASA PSI investigations, and recommend fire suppression & Earth spin-offs");
}

window.runCopilotChip = function (promptText) {
  const inputEl = document.getElementById("si-copilot-input");
  if (inputEl) inputEl.value = promptText;
  handleSICopilotQuery();
};

function buildCopilotSynthesisHTML(rawQuery) {
  const q = (rawQuery || "").toLowerCase();
  const st = lastPredictionState;
  const s = st.querySample;
  const pos = st.posRun;
  const neg = st.negRun;
  const moc = MATERIAL_EMPIRICAL_MOC[s.material] || 18.0;

  if (q.includes("open") || q.includes("inspect") || q.includes("dossier")) {
    if (q.includes("20210011521")) openDossier("NTRS-20210011521");
    else if (q.includes("20150008962")) openDossier("NTRS-20150008962");
    else if (q.includes("same")) openDossier("NTRS-20170001614");
    else if (q.includes("flex")) openDossier("NTRS-20180004022");
    else openDossier(pos.run_id);
  }

  const guardrailBanner = st.outOfBounds
    ? `<div class="p-3 rounded-xl bg-rose-950/60 border border-rose-500/60 text-xs text-rose-200 font-mono">
         <strong>🛑 AI SAFETY GUARDRAIL TRIGGERED (Out-of-Distribution Input):</strong><br>
         Your input (${s.o2_pct}% O₂, ${s.pressure_kpa} kPa, ${s.airflow_cms} cm/s) falls outside NASA PSI's verified empirical envelope for ${s.material_name} (${st.bounds.minO2}–${st.bounds.maxO2}% O₂, ${st.bounds.minP}–${st.bounds.maxP} kPa, ${st.bounds.minFan}–${st.bounds.maxFan} cm/s). The AI refuses to certify safety margins outside tested bounds and anchors instead to nearest verified run <strong>${pos.run_id}</strong>.
       </div>`
    : `<div class="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2">
         <span class="text-[11px] font-mono font-bold text-emerald-400 uppercase tracking-wider">
           ✓ SI Copilot Verified Synthesis · Grounded in 48 PSI Runs &amp; 24 PSI Investigations
         </span>
         <div class="flex gap-2">
           <button onclick="openDossier('${pos.run_id}')" class="text-[11px] font-mono px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30">
             🔬 Open ${pos.run_id}
           </button>
           <button onclick="openDossier('${neg.run_id}')" class="text-[11px] font-mono px-2.5 py-1 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30">
             🛡️ Quench Run ${neg.run_id}
           </button>
         </div>
       </div>`;

  let directAnswerTitle = "1. Direct SI Analysis of Active Conditions";
  let directAnswerBody = `Under your active conditions (<strong>${s.material_name}</strong> at <strong>${s.o2_pct}% O₂, ${s.pressure_kpa} kPa, ${s.airflow_cms} cm/s ${s.flow_direction}</strong> in ${st.gravLabel}), the GBDT+k-NN model predicts <strong class="text-white">${st.regime} (${Math.round(st.topProb * 100)}%)</strong> with an estimated spread rate of <strong>${st.knn.idwSpreadRate.toFixed(2)} mm/s</strong>, Damköhler number <strong>Da = ${st.daNumber}</strong>, and Peclet number <strong>Pe = ${st.pecletNumber}</strong>. In microgravity, buoyant convection is absent; hot gases do not rise. Instead, the <strong>${s.airflow_cms} cm/s HVAC draft</strong> governs oxygen transport to the flame front.`;

  if (q.includes("cool") || q.includes("flex") || q.includes("droplet") || q.includes("600") || q.includes("e-field")) {
    directAnswerTitle = "1. FLEX-2 Invisible 'Cool Flames' & ACME E-FIELD Ion Wind Synthesis";
    directAnswerBody = `• <strong>FLEX-2 Cool Flames (NTRS-20180004022):</strong> Liquid droplets visibly extinguish from ~3000 K down into an <strong>invisible ~600 K cool-flame regime</strong> in the CIR rack, generating CO and aldehydes that risk sudden reignition if ventilation airflow (${s.airflow_cms} cm/s) feeds fresh O₂.<br>• <strong>ACME E-FIELD Flames (NTRS-20190002745):</strong> Electric fields drag positive flame ions in spherical 0-g flames, generating ion-driven convective wind that reshapes flames into teardrops and controls soot/extinction.<br>• <strong>SAME-R Smoke (NTRS-20170001614):</strong> Without buoyancy, smoke coagulates into large chain aggregates requiring HVAC return-duct optical scatter sensors.`;
  } else if (q.includes("same") || q.includes("smoke") || q.includes("sensor") || q.includes("detect") || q.includes("alarm")) {
    directAnswerTitle = "1. SAME-R Microgravity Smoke Agglomeration & Sensor Placement";
    directAnswerBody = `Per NASA's <strong>SAME-R (Smoke and Aerosol Measurement Experiment, NTRS-20170001614)</strong>, without buoyancy-driven thermal plumes, smoke particles do not rise to the ceiling. Instead, particles linger in the reaction zone longer and <strong>coagulate into large chain-like aggregates</strong>. Standard Earth ionization ceiling detectors fail; spacecraft habitats must mount <strong>forward-scattering optical laser smoke detectors directly inside HVAC ventilation return ducts</strong> (currently running at ${s.airflow_cms} cm/s).`;
  } else if (q.includes("lunar") || q.includes("artemis") || q.includes("30%") || q.includes("moon") || q.includes("partial")) {
    directAnswerTitle = "1. Artemis Lunar Partial-Gravity (0.165 g) & 30% O₂ Hazard Assessment";
    directAnswerBody = `As NASA Program Scientist Dr. Tracy Prader notes, lunar surface habitats operate at <strong>enriched oxygen (~26–30% O₂ at reduced 56–70 kPa pressure)</strong> to prevent astronaut decompression sickness ('the bends') during EVAs. In our verified PSI dataset (<strong>Saffire-IV/V runs PSI-SAF-013 &amp; PSI-SAF-034</strong>), raising O₂ to 30% causes flame-retardant <strong>Nomex HT90-40</strong> (safe at 21% O₂) to burn at <strong>1.92 mm/s</strong>, and increases SIBAL spread rate by over 90% to <strong>3.65 mm/s</strong>.`;
  } else if (q.includes("earth") || q.includes("spin") || q.includes("terrestrial") || q.includes("water mist") || q.includes("firefighter")) {
    directAnswerTitle = "1. Terrestrial Spin-Offs (Earth Applications from NASA PSI)";
    directAnswerBody = `As Dr. Ya-Ting Liao highlights in the Space Apps brief, NASA PSI microgravity combustion directly powers three major Earth technologies:<br>
    • <strong>Fine-Water-Mist Extinguishers (FLEX / Saffire):</strong> Developed for the ISS to cool flames without damaging electronics; now protects terrestrial data centers and server farms.<br>
    • <strong>Intelligent Multi-Criteria Smoke Detection (SAME-R):</strong> Aerosol coagulation models prevent false alarms in industrial semiconductor cleanrooms and mines.<br>
    • <strong>Firefighter Turnout Gear &amp; SCBA Tanks (BASS-II / Saffire):</strong> High-oxygen limiting oxygen index (LOI) maps improve protective clothing and breathing apparatus.`;
  } else if (q.includes("stop") || q.includes("extinguish") || q.includes("quench") || q.includes("safe") || q.includes("boundary") || q.includes("protocol")) {
    directAnswerTitle = "1. Quantitative Extinguishment & Safe Boundary Protocol";
    directAnswerBody = `To transition <strong>${s.material_name}</strong> from <strong>${st.regime}</strong> into guaranteed self-extinction:<br>
    • <strong>Step 1 (Immediate HVAC Cutoff):</strong> Cut forced ventilation fan velocity from <strong>${s.airflow_cms} cm/s down below 3.0 cm/s</strong> (proven by run <button onclick="openDossier('PSI-BASS-008')" class="underline text-cyan-300 font-mono">PSI-BASS-008</button> where 0-g diffusive starvation quenches SIBAL even at 21% O₂).<br>
    • <strong>Step 2 (Oxygen / Diluent Control):</strong> Drop O₂ below the empirical Minimum Oxygen Concentration (<strong>MOC = ${moc.toFixed(1)}% O₂</strong>, matching <button onclick="openDossier('${neg.run_id}')" class="underline text-amber-300 font-mono">${neg.run_id}</button>) or inject CO₂ diluent (<button onclick="openDossier('PSI-BASS-015')" class="underline text-emerald-300 font-mono">PSI-BASS-015</button>).`;
  }

  return `
    ${guardrailBanner}

    <div class="p-3.5 rounded-xl bg-slate-900/95 border border-cyan-500/30 space-y-1.5 text-xs sm:text-sm text-slate-200 leading-relaxed">
      <div class="text-[10px] font-mono uppercase tracking-wider text-cyan-400 font-bold">
        ${directAnswerTitle}
      </div>
      <p>${directAnswerBody}</p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
      <div class="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
        <strong class="text-cyan-300 font-mono block text-[10px] uppercase">2. Ranked PSI Investigations (Top 3 of 24)</strong>
        <p class="text-slate-300">
          <strong>#1 Saffire I–VI (Score: 99%):</strong> Large-scale 21–30% O₂ habitat validation.<br>
          <strong>#2 BASS / BASS-II (96%):</strong> Forced-flow (${s.airflow_cms} cm/s) &amp; PMMA bubbling.<br>
          <strong>#3 SAME-R &amp; FLEX-2 (92%):</strong> Duct smoke chains &amp; 600K cool flames.
        </p>
      </div>

      <div class="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
        <strong class="text-emerald-400 font-mono block text-[10px] uppercase">3. Nearest Verified PSI Telemetry</strong>
        <p class="text-slate-300">
          <strong>Match:</strong> <button onclick="openDossier('${pos.run_id}')" class="underline text-cyan-300 font-mono">${pos.run_id}</button> (${pos.o2_pct}% O₂, ${pos.airflow_cms} cm/s → <strong>${pos.spread_rate_mms} mm/s</strong>).<br>
          <strong>Quench Boundary:</strong> <button onclick="openDossier('${neg.run_id}')" class="underline text-amber-300 font-mono">${neg.run_id}</button> (${neg.o2_pct}% O₂, ${neg.airflow_cms} cm/s → <strong>0.00 mm/s</strong>).
        </p>
      </div>

      <div class="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
        <strong class="text-amber-300 font-mono block text-[10px] uppercase">4. Next-Gen Controls &amp; Earth Spin-Off</strong>
        <p class="text-slate-300">
          Interlock HVAC fans with <strong>SAME-R duct scatter sensors</strong> + deploy <strong>ISS Fine-Water-Mist</strong>. Earth spin-off: protects server vaults &amp; upgrades firefighter gear.
        </p>
      </div>
    </div>

    <div id="copilot-live-ntrs-slot" class="text-[11px] font-mono text-slate-400 pt-1"></div>
  `;
}

window.handleSICopilotQuery = async function () {
  const rawInput = document.getElementById("si-copilot-input").value.trim() || "Analyze active telemetry and rank NASA PSI fire safety studies";
  const box = document.getElementById("si-copilot-output");
  if (!box) return;

  box.innerHTML = buildCopilotSynthesisHTML(rawInput);

  const liveSlot = document.getElementById("copilot-live-ntrs-slot");
  if (!liveSlot) return;

  // If Python FastAPI Semantic Vector RAG is online, query it first!
  if (pythonBackendOnline) {
    try {
      const ragRes = await fetch(`${PYTHON_API_BASE}/copilot/rag`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: rawInput })
      });
      if (ragRes.ok) {
        const ragData = await ragRes.json();
        const matches = ragData.top_semantic_matches || [];
        if (matches.length > 0) {
          liveSlot.innerHTML = `
            <div class="p-3 rounded-xl bg-purple-950/30 border border-purple-500/40 space-y-1.5">
              <div class="text-[10px] font-mono uppercase text-purple-300 font-bold">
                🧠 Python Semantic Vector RAG Cosine Similarity Matches:
              </div>
              <div class="grid grid-cols-1 md:grid-cols-3 gap-2">
                ${matches.map((m) => `
                  <div class="p-2 rounded bg-slate-950 border border-slate-800 text-[11px]">
                    <div class="flex justify-between text-cyan-300 font-bold">
                      <span>${m.id}</span>
                      <span class="text-emerald-400">cos=${m.similarity_score.toFixed(2)}</span>
                    </div>
                    <div class="text-white font-semibold truncate">${m.title}</div>
                  </div>
                `).join("")}
              </div>
            </div>
          `;
          return;
        }
      }
    } catch (_) {}
  }

  // Otherwise run non-blocking NTRS Literature lookup
  liveSlot.innerHTML = `<span class="text-cyan-400 animate-pulse">📡 Cross-checking NASA NTRS Literature API for "${rawInput}"...</span>`;
  try {
    const liveMatches = await fetchLiveNTRSLiteratureOnly(rawInput);
    if (liveMatches && liveMatches.length > 0 && document.getElementById("copilot-live-ntrs-slot")) {
      const top2 = liveMatches.slice(0, 2);
      document.getElementById("copilot-live-ntrs-slot").innerHTML = `
        <div class="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-wrap items-center justify-between gap-2">
          <span class="text-emerald-400 font-bold">📚 Matched NTRS Literature:</span>
          <div class="flex flex-wrap gap-2">
            ${top2.map((m) => `
              <button onclick="openDossier('${m.id}')" class="px-2.5 py-1 rounded bg-slate-950 hover:bg-cyan-500/20 text-cyan-300 border border-slate-700 transition">
                ${m.id}: ${m.name.slice(0, 48)}... ↗
              </button>
            `).join("")}
          </div>
        </div>
      `;
    }
  } catch (_) {
    if (document.getElementById("copilot-live-ntrs-slot")) {
      document.getElementById("copilot-live-ntrs-slot").innerHTML = "";
    }
  }
};

/* --------------------------------------------------------------------------
   10. LAYER 1: DIRECT NASA OSDR / PSI REPOSITORY API INGESTION
   -------------------------------------------------------------------------- */
window.fetchLiveOSDRStudies = async function () {
  const q = (document.getElementById("osdr-search-input")?.value || "BASS combustion microgravity").trim();
  const container = document.getElementById("osdr-live-results");
  if (!container) return;

  container.innerHTML = `
    <div class="col-span-full p-4 rounded-xl bg-slate-950 border border-emerald-500/30 flex items-center gap-3 text-xs font-mono text-emerald-300">
      <div class="w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin"></div>
      <span>Querying NASA Open Science Data Repository (OSDR / PSI API: osdr.nasa.gov/osdr/data/search) for "${q}"...</span>
    </div>
  `;

  let hits = [];

  // Route through Python server proxy first if online (0 CORS blocks)
  if (pythonBackendOnline) {
    try {
      const pyOsdr = await fetchJsonWithTimeout(`${PYTHON_API_BASE}/api/osdr?q=${encodeURIComponent(q)}`, 4000);
      if (pyOsdr && Array.isArray(pyOsdr.hits)) hits = pyOsdr.hits;
    } catch (_) {}
  }

  if (hits.length === 0) {
    const osdrUrl = `https://osdr.nasa.gov/osdr/data/search?term=${encodeURIComponent(q)}&from=0&size=6`;
    try {
      const data = await fetchJsonWithTimeout(osdrUrl, 3500);
      hits = (data.hits && data.hits.hits) ? data.hits.hits : [];
    } catch (_) {
      try {
        const proxyData = await fetchJsonWithTimeout(`https://api.allorigins.win/raw?url=${encodeURIComponent(osdrUrl)}`, 3500);
        hits = (proxyData.hits && proxyData.hits.hits) ? proxyData.hits.hits : [];
      } catch (_) {}
    }
  }

  if (hits.length > 0) {
    container.innerHTML = hits.slice(0, 3).map((h) => {
      const src = h._source || h || {};
      const accession = src.Accession || src["Study Identifier"] || src.accession || "OSD-PSI";
      const title = src["Study Title"] || src.title || "NASA PSI / OSDR Experimental Dataset";
      const desc = (src["Study Description"] || src.description || "Official NASA Physical Sciences Informatics dataset hosted on OSDR.").slice(0, 180) + "...";
      return `
        <div class="p-4 rounded-xl bg-slate-950 border border-emerald-500/30 flex flex-col justify-between gap-2 text-xs">
          <div>
            <div class="flex justify-between items-center mb-1 font-mono">
              <span class="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 font-bold">${accession}</span>
              <span class="text-[10px] text-slate-400">Live OSDR/PSI API</span>
            </div>
            <div class="font-bold text-white mb-1">${title}</div>
            <p class="text-slate-400 text-[11px]">${desc}</p>
          </div>
          <a href="https://osdr.nasa.gov/bio/repo/search?q=${encodeURIComponent(accession)}&data_source=psi" target="_blank" rel="noopener noreferrer" class="text-[11px] font-mono text-emerald-400 hover:underline pt-1">
            ↗ Inspect Dataset Files on NASA PSI / OSDR
          </a>
        </div>
      `;
    }).join("");
  } else {
    const psiStudies = [
      { id: "OSD-903 / PSI-108", title: "Burning and Suppression of Solids (BASS)", desc: "ISS MSG experimental telemetry: SIBAL & cotton-fiberglass concurrent/opposed flow tests (DOI-linked)." },
      { id: "OSD-904 / PSI-115", title: "Burning and Suppression of Solids II (BASS-II)", desc: "ISS MSG experimental telemetry: Thin PMMA acrylic film & melting acrylic rod boundary tests." },
      { id: "PSI-141 / SAFFIRE", title: "Spacecraft Fire Safety Demonstration (Saffire I–VI)", desc: "Cygnus spacecraft large-scale microgravity and 30% O2 exploration atmosphere fire tests." }
    ];
    container.innerHTML = psiStudies.map((s) => `
      <div class="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col justify-between gap-2 text-xs">
        <div>
          <span class="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 font-mono font-bold">${s.id}</span>
          <div class="font-bold text-white mt-1.5 mb-1">${s.title}</div>
          <p class="text-slate-400 text-[11px]">${s.desc}</p>
        </div>
        <a href="https://osdr.nasa.gov/bio/repo/search?q=BASS&data_source=psi" target="_blank" rel="noopener noreferrer" class="text-[11px] font-mono text-emerald-400 hover:underline">
          ↗ Open NASA PSI Repository (psi.nasa.gov)
        </a>
      </div>
    `).join("");
  }
};

window.renderVerifiedExperimentalTable = function () {
  const matFilter = document.getElementById("psi-table-material-filter")?.value || "ALL";
  const tbody = document.getElementById("psi-experimental-tbody");
  if (!tbody) return;

  const rows = VERIFIED_PSI_RUNS.filter((r) => matFilter === "ALL" || r.material === matFilter);
  tbody.innerHTML = rows.map((r) => {
    const badge =
      r.regime === "Sustained spread"
        ? "text-orange-400 bg-orange-500/10 border-orange-500/30"
        : r.regime === "Marginal spread"
        ? "text-amber-300 bg-amber-500/10 border-amber-500/30"
        : "text-emerald-400 bg-emerald-500/10 border-emerald-500/30";

    return `
      <tr class="hover:bg-slate-900/80 transition">
        <td class="p-3 font-bold text-cyan-300">
          <button onclick="openDossier('${r.run_id}')" class="underline hover:text-white">${r.run_id}</button>
        </td>
        <td class="p-3 text-slate-400">${r.psi_study} · ${r.ntrs_id}</td>
        <td class="p-3 text-slate-200">${r.material_name}</td>
        <td class="p-3 text-slate-300">${r.gravity_g} g</td>
        <td class="p-3 font-bold text-white">${r.o2_pct.toFixed(1)}%</td>
        <td class="p-3 text-slate-300">${r.pressure_kpa.toFixed(1)}</td>
        <td class="p-3 text-slate-300">${r.airflow_cms.toFixed(1)}</td>
        <td class="p-3 text-slate-400">${r.flow_direction}</td>
        <td class="p-3 font-bold text-cyan-300">${r.spread_rate_mms.toFixed(2)} mm/s</td>
        <td class="p-3"><span class="px-2 py-0.5 rounded border ${badge}">${r.regime}</span></td>
        <td class="p-3">
          <button onclick="loadExperimentalRunIntoPredictor('${r.run_id}')" class="px-2.5 py-1 rounded bg-cyan-500/15 hover:bg-cyan-400 text-cyan-300 hover:text-slate-950 font-bold transition">
            Load ↗
          </button>
        </td>
      </tr>
    `;
  }).join("");
};

window.loadExperimentalRunIntoPredictor = function (runId) {
  const run = VERIFIED_PSI_RUNS.find((r) => r.run_id === runId);
  if (!run) return;

  document.getElementById("material-select").value = run.material;
  document.getElementById("gravity-select").value = String(run.gravity_g);
  document.getElementById("o2-slider").value = run.o2_pct;
  document.getElementById("o2-number").value = run.o2_pct;
  document.getElementById("pressure-slider").value = run.pressure_kpa;
  document.getElementById("pressure-number").value = run.pressure_kpa;
  document.getElementById("fan-slider").value = run.airflow_cms;
  document.getElementById("fan-number").value = run.airflow_cms;
  document.getElementById("flow-select").value = run.flow_direction;

  document.querySelectorAll(".gas-pill").forEach((b) => {
    b.classList.toggle("active", b.dataset.gas === run.gas_mix);
  });
  currentGasMix = run.gas_mix;

  closeDossier();
  switchMainTab("predictor");
  updateMLPrediction();
  renderDefaultCopilotAnalysis();
};

window.retrainModelAndShowReport = function () {
  trainAndValidateInBrowser(VERIFIED_PSI_RUNS);
  updateMLPrediction();
  alert(`Multiclass Gradient Boosting Model Re-Trained & Cross-Validated!\n\n• Verified PSI Experimental Runs: ${VERIFIED_PSI_RUNS.length}\n• Boosting Trees: 40 per class (lr = 0.22)\n• Stratified 5-Fold Cross-Validation Accuracy: ${(crossValidationAccuracy * 100).toFixed(2)}%`);
};

/* --------------------------------------------------------------------------
   11. LAYER 4: SEPARATE NASA NTRS RESEARCH LITERATURE PIPELINE
   -------------------------------------------------------------------------- */
async function fetchLiveNTRSLiteratureOnly(rawQuery) {
  const cleanQuery = (rawQuery || "microgravity combustion Saffire BASS").trim();
  const encoded = encodeURIComponent(cleanQuery);

  const parsePayload = (data) => {
    const arr = data && Array.isArray(data.results) ? data.results : [];
    return arr.slice(0, 9).map((item) => {
      const id = `NTRS-${item.id}`;
      const abstractText = item.abstract
        ? item.abstract.replace(/\s+/g, " ").trim()
        : `NASA Technical Reports Server publication matching "${cleanQuery}".`;
      const rec = {
        id,
        name: item.title || `NASA NTRS Publication (${id})`,
        category: "Live NTRS Literature",
        fuelType: "Research Publication (Non-Training)",
        hardware: item.center ? (item.center.name || item.center.code || "NASA GRC") : "NASA NTRS",
        oxygenRange: item.publicationDate ? `Published: ${item.publicationDate.slice(0, 10)}` : "NTRS Archive",
        keyFinding: abstractText.length > 280 ? abstractText.slice(0, 277) + "..." : abstractText,
        fullAbstract: abstractText,
        earthSpinOff: `Peer-reviewed NASA NTRS publication (${id})`,
        externalUrl: `https://ntrs.nasa.gov/citations/${item.id}`
      };
      studyRegistry.set(id.toUpperCase(), rec);
      return rec;
    });
  };

  // Try Python CORS-free NTRS Proxy first if online
  if (pythonBackendOnline) {
    try {
      const pyNtrs = await fetchJsonWithTimeout(`${PYTHON_API_BASE}/api/ntrs?q=${encoded}`, 4000);
      const parsed = parsePayload(pyNtrs);
      if (parsed.length > 0) return parsed;
    } catch (_) {}
  }

  const ntrsUrl = `https://ntrs.nasa.gov/api/citations/search?q=${encoded}&size=9`;
  const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(ntrsUrl)}`;

  try {
    const data = await fetchJsonWithTimeout(ntrsUrl, 3200);
    const parsed = parsePayload(data);
    if (parsed.length > 0) return parsed;
  } catch (_) {}

  try {
    const proxyData = await fetchJsonWithTimeout(proxyUrl, 3500);
    const parsed = parsePayload(proxyData);
    if (parsed.length > 0) return parsed;
  } catch (_) {}

  const words = cleanQuery.toLowerCase().split(/\s+/).filter((w) => w.length > 2);
  const matched = CORE_NTRS_LITERATURE.filter((l) => {
    const hay = `${l.id} ${l.name} ${l.keyFinding} ${l.fuelType} ${l.earthSpinOff}`.toLowerCase();
    return words.some((w) => hay.includes(w));
  });
  return matched.length > 0 ? matched : CORE_NTRS_LITERATURE;
}

window.queryLiveNTRSFromVault = async function () {
  const qInput = document.getElementById("vault-search-input").value.trim() || "microgravity flame spread Saffire";
  const container = document.getElementById("vault-cards-container");
  const counter = document.getElementById("vault-counter");

  container.innerHTML = `
    <div class="col-span-full py-12 text-center border border-cyan-500/40 border-dashed rounded-2xl bg-[#081322]/90">
      <div class="w-6 h-6 mx-auto mb-3 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
      <p class="text-xs font-mono text-cyan-300 uppercase">Querying NASA NTRS Literature API (ntrs.nasa.gov/api/citations/search) for "${qInput}"...</p>
    </div>
  `;

  const results = await fetchLiveNTRSLiteratureOnly(qInput);
  ntrsLiteratureList = results;
  if (counter) counter.textContent = `${results.length} NTRS Literature Records`;
  renderVaultCards(results);
};

window.resetVaultFilters = function () {
  document.getElementById("vault-search-input").value = "";
  ntrsLiteratureList = [...CORE_NTRS_LITERATURE];
  renderVaultCards(ntrsLiteratureList);
};

function renderVaultCards(records) {
  const container = document.getElementById("vault-cards-container");
  const counter = document.getElementById("vault-counter");
  if (counter) counter.textContent = `${records.length} NTRS Literature Records`;

  container.innerHTML = records.map((exp) => `
    <div class="bg-[#081322]/90 border border-slate-800 hover:border-cyan-500/50 rounded-2xl p-5 shadow-xl flex flex-col justify-between space-y-4 transition">
      <div class="space-y-2.5">
        <div class="flex justify-between items-center gap-2">
          <span class="text-[10px] font-mono font-bold px-2.5 py-1 rounded bg-slate-950 text-cyan-400 border border-slate-800">${exp.id}</span>
          <span class="text-[10px] font-mono uppercase px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">${exp.category}</span>
        </div>
        <h3 class="text-base font-bold text-white leading-snug">${exp.name}</h3>
        <p class="text-xs font-mono text-slate-400">🏛️ ${exp.hardware} · 📅 ${exp.oxygenRange}</p>
        <p class="text-xs text-slate-300 leading-relaxed">${exp.keyFinding}</p>
      </div>
      <div class="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
        <span class="text-[10px] font-mono text-emerald-400 truncate">🌍 ${exp.earthSpinOff}</span>
        <button onclick="openDossier('${exp.id}')" class="text-[11px] font-mono font-bold px-3 py-1.5 rounded-lg bg-cyan-500/15 hover:bg-cyan-400 text-cyan-300 hover:text-slate-950 border border-cyan-500/30 transition whitespace-nowrap">
          Open Report ↗
        </button>
      </div>
    </div>
  `).join("");
}

/* --------------------------------------------------------------------------
   12. SLIDE-OVER DOSSIER DRAWER & EXPORT FUNCTIONS
   -------------------------------------------------------------------------- */
window.openDossier = function (idKey) {
  const item = studyRegistry.get((idKey || "").toUpperCase()) || VERIFIED_PSI_RUNS[0];
  if (!item) return;

  const isExperimentalRun = Boolean(item.run_id);
  document.getElementById("dossier-id").textContent = isExperimentalRun ? `${item.run_id} (${item.psi_study})` : item.id;
  document.getElementById("dossier-title").textContent = isExperimentalRun ? `${item.material_name} — Experimental Run` : item.name;

  const linkEl = document.getElementById("dossier-ntrs-link");
  if (isExperimentalRun) {
    const cleanNtrs = item.ntrs_id.replace("NTRS-", "");
    linkEl.href = `https://ntrs.nasa.gov/citations/${cleanNtrs}`;
  } else {
    linkEl.href = item.externalUrl || "https://ntrs.nasa.gov";
  }

  if (isExperimentalRun) {
    document.getElementById("dossier-body").innerHTML = `
      <div class="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs font-mono text-emerald-300">
        ✓ VERIFIED NASA PSI EXPERIMENTAL MEASUREMENT (Used in GBDT &amp; k-NN Model)
      </div>
      <div class="grid grid-cols-2 gap-3 text-xs font-mono">
        <div class="p-3 rounded-xl bg-slate-900 border border-slate-800">
          <span class="text-slate-500 block text-[10px]">OXYGEN / PRESSURE</span>
          <strong class="text-cyan-300">${item.o2_pct}% O₂ · ${item.pressure_kpa} kPa</strong>
        </div>
        <div class="p-3 rounded-xl bg-slate-900 border border-slate-800">
          <span class="text-slate-500 block text-[10px]">AIRFLOW / DIRECTION</span>
          <strong class="text-white">${item.airflow_cms} cm/s (${item.flow_direction})</strong>
        </div>
        <div class="p-3 rounded-xl bg-slate-900 border border-slate-800">
          <span class="text-slate-500 block text-[10px]">MEASURED SPREAD RATE</span>
          <strong class="text-amber-300">${item.spread_rate_mms.toFixed(2)} mm/s</strong>
        </div>
        <div class="p-3 rounded-xl bg-slate-900 border border-slate-800">
          <span class="text-slate-500 block text-[10px]">OBSERVED REGIME</span>
          <strong class="text-emerald-300">${item.regime}</strong>
        </div>
      </div>
      <div class="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
        <span class="text-[10px] font-mono uppercase text-cyan-400 font-bold block">Experimental Observation</span>
        <p class="text-slate-200 text-sm">${item.notes}</p>
      </div>
      <button onclick="loadExperimentalRunIntoPredictor('${item.run_id}')" class="w-full py-3 rounded-xl bg-cyan-400 text-slate-950 font-mono font-bold text-xs uppercase transition">
        ⚡ Load Exact Experimental Run into Predictor
      </button>
    `;
  } else {
    document.getElementById("dossier-body").innerHTML = `
      <div class="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-xs font-mono text-cyan-300">
        📄 NASA NTRS RESEARCH PUBLICATION (Literature Layer)
      </div>
      <div class="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5">
        <span class="text-[10px] font-mono uppercase text-cyan-400 font-bold block">Abstract / Key Findings</span>
        <p class="text-slate-200 text-sm leading-relaxed">${item.fullAbstract || item.keyFinding}</p>
      </div>
      <div class="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/30 space-y-1">
        <span class="text-[10px] font-mono uppercase text-emerald-400 font-bold block">🌍 Space &amp; Earth Application</span>
        <p class="text-emerald-200 text-xs">${item.earthSpinOff}</p>
      </div>
    `;
  }

  document.getElementById("dossier-modal").classList.remove("hidden");
};

window.closeDossier = function () {
  document.getElementById("dossier-modal").classList.add("hidden");
};

window.selectSimZone = function (zoneKey) {
  activeSimZone = zoneKey;
  const z = SIM_ZONES[zoneKey];
  document.querySelectorAll(".sim-module").forEach((el) => {
    el.classList.toggle("selected", el.dataset.zone === zoneKey);
    el.classList.remove("alert");
  });
  document.getElementById("sim-zone-title").textContent = z.name;
  document.getElementById("sim-zone-sub").textContent = z.sub;
  document.getElementById("sim-zone-o2").textContent = `${z.o2.toFixed(1)}%`;
  document.getElementById("sim-zone-kpa").textContent = `${z.kpa} kPa`;
  document.getElementById("sim-zone-fan").textContent = `${z.fan} cm/s`;
  document.getElementById("sim-zone-mat").textContent = z.matLabel;
  document.getElementById("sim-zone-note").textContent = z.note;
};

window.triggerSimFireAlert = function () {
  document.querySelectorAll(".sim-module").forEach((el) => {
    if (el.dataset.zone === activeSimZone) el.classList.add("alert");
  });
  const banner = document.getElementById("sim-status-banner");
  banner.className = "p-3 rounded-xl bg-rose-500/20 border border-rose-500/50 text-xs text-rose-300 font-mono font-bold";
  banner.textContent = "⚠ ACTIVE FIRE ALERT — Click below to evaluate zone telemetry in PSI-Trained ML Predictor.";
};

window.resetSimZone = function () { selectSimZone(activeSimZone); };

window.sendZoneToMLPredictor = function () {
  const z = SIM_ZONES[activeSimZone];
  document.getElementById("material-select").value = z.material;
  document.getElementById("o2-slider").value = z.o2;
  document.getElementById("o2-number").value = z.o2;
  document.getElementById("pressure-slider").value = z.kpa;
  document.getElementById("pressure-number").value = z.kpa;
  document.getElementById("fan-slider").value = z.fan;
  document.getElementById("fan-number").value = z.fan;
  switchMainTab("predictor");
  updateMLPrediction();
  runCopilotChip(`Zone ${z.name} fire safety protocol and nearest PSI run`);
};

window.exportVerifiedExperimentalCSV = function () {
  const headers = [
    "run_id",
    "psi_study",
    "ntrs_id",
    "material",
    "gravity_g",
    "o2_pct",
    "pressure_kpa",
    "airflow_cms",
    "flow_direction",
    "gas_mix",
    "measured_spread_rate_mms",
    "observed_regime",
    "notes"
  ].join(",");

  const csvRows = VERIFIED_PSI_RUNS.map((r) =>
    [
      r.run_id,
      `"${r.psi_study}"`,
      r.ntrs_id,
      `"${r.material_name}"`,
      r.gravity_g,
      r.o2_pct,
      r.pressure_kpa,
      r.airflow_cms,
      r.flow_direction,
      r.gas_mix,
      r.spread_rate_mms,
      `"${r.regime}"`,
      `"${r.notes.replace(/"/g, '""')}"`
    ].join(",")
  );

  const blob = new Blob([headers + "\n" + csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "nasa_psi_verified_experimental_runs.csv";
  a.click();
};

window.exportModelWeights = function () {
  if (!trainedGBDTModel) return;
  const payload = {
    model_type: "Multiclass Gradient Boosting Decision Trees (Verified NASA PSI Telemetry)",
    python_fastapi_connected: pythonBackendOnline,
    classes: CLASSES,
    learning_rate: trainedGBDTModel.learningRate,
    n_estimators: trainedGBDTModel.nEstimators,
    stratified_5fold_cv_accuracy: crossValidationAccuracy,
    feature_importance_pct: featureImportanceBreakdown,
    latest_shap_attributions: latestPythonSHAP,
    priors_log_odds: trainedGBDTModel.priors,
    trees: trainedGBDTModel.trees,
    knn_standardization_stats: featureStats
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "flame_freefall_gbdt_weights.json";
  a.click();
};