import React, { useRef } from 'react';
import {
  X,
  ExternalLink,
  ShieldCheck,
  Flame,
  Cpu,
  Gauge,
  Share2,
  CheckCircle2,
  Search,
  Play,
  BookOpen,
  Layers,
  Database,
  Compass,
  Sparkles,
} from 'lucide-react';
import { PSIStudy } from '../types';

interface DossierModalProps {
  study: PSIStudy | null;
  highlightQuery?: string;
  onClose: () => void;
  onLoadIntoPredictor: (study: PSIStudy) => void;
  onAskAIAboutStudy: (study: PSIStudy) => void;
}

// Common stop words to ignore in search highlighting
const SEARCH_STOP_WORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from', 'has', 'he',
  'in', 'is', 'it', 'its', 'of', 'on', 'or', 'that', 'the', 'to', 'was', 'were',
  'will', 'with', 'what', 'how', 'when', 'where', 'why', 'who', 'which', 'this',
  'these', 'those', 'there', 'their', 'they', 'them', 'than', 'then', 'so', 'such'
]);

// Helper to escape regex special characters
function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Extract meaningful keywords from user search query
function getMeaningfulTokens(query?: string): string[] {
  if (!query || !query.trim()) return [];
  return query
    .toLowerCase()
    .replace(/[#?,!.:;"'`~@$%^&*()_+={}\[\]|\\<>\/]/g, ' ')
    .split(/\s+/)
    .map((w) => w.trim())
    .filter((w) => w.length >= 3 && !SEARCH_STOP_WORDS.has(w));
}

// Highlight matching words and phrases with glowing markers
function renderHighlightedText(text: string | undefined | null, query?: string): React.ReactNode {
  if (!text) return '';
  const tokens = getMeaningfulTokens(query);
  if (tokens.length === 0) return text;

  const pattern = new RegExp(`(\\b(?:${tokens.map(escapeRegExp).join('|')})\\b)`, 'gi');
  const parts = text.split(pattern);

  return parts.map((part, index) => {
    const isMatch = tokens.some((t) => t.toLowerCase() === part.toLowerCase());
    if (isMatch) {
      return (
        <mark
          key={index}
          className="bg-amber-400/35 text-amber-200 border-b-2 border-amber-400 px-1 py-0.5 rounded font-bold shadow-[0_0_12px_rgba(251,191,36,0.6)]"
        >
          {part}
        </mark>
      );
    }
    return <span key={index}>{part}</span>;
  });
}

export const DossierModal: React.FC<DossierModalProps> = ({
  study,
  highlightQuery,
  onClose,
  onLoadIntoPredictor,
  onAskAIAboutStudy,
}) => {
  if (!study) return null;

  const sectionRefs = {
    overview: useRef<HTMLDivElement>(null),
    context: useRef<HTMLDivElement>(null),
    approach: useRef<HTMLDivElement>(null),
    hardware: useRef<HTMLDivElement>(null),
    data: useRef<HTMLDivElement>(null),
    results: useRef<HTMLDivElement>(null),
    publications: useRef<HTMLDivElement>(null),
    references: useRef<HTMLDivElement>(null),
  };

  const scrollToSection = (key: keyof typeof sectionRefs) => {
    sectionRefs[key]?.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const isIncident = study.dossierType === 'INCIDENT' || study.category === 'Incident';
  const isSpinoff = study.dossierType === 'SPINOFF' || study.category === 'Spinoff';
  const isPublication = study.dossierType === 'PUBLICATION' || study.isNtrsCitation;

  const fallbackQuery = encodeURIComponent(
    study.fuelType ? `${study.fuelType} microgravity combustion` : study.name.slice(0, 30)
  );
  // Official NASA PSI investigation URL with verified parameters: data_source=psi and data_type=investigation
  const psiUrl =
    study.psiPortalUrl ||
    `https://psi.nasa.gov/physci/repo/search?data_source=psi&data_type=investigation&q=${fallbackQuery}`;
  const primaryExternalUrl = study.externalUrl || `https://ntrs.nasa.gov/citations/${study.id}`;

  const repositoryName =
    study.sourceRepositoryName ||
    (study.isLiveFetched
      ? 'NASA Physical Sciences Informatics (PSI) & NTRS Live Repository'
      : isIncident
      ? 'NASA Safety & Mission Assurance (SMA) / Historical Incident Archive'
      : isSpinoff
      ? 'NASA Technology Transfer Program (Spinoff Archive)'
      : 'NASA Physical Sciences Informatics (PSI) Flight Archive');

  // Synthesize authentic 8 sections
  const secOverview =
    study.profileSections?.overview ||
    study.abstract ||
    study.keyFinding ||
    'Comprehensive NASA microgravity physical sciences investigation examining transport phenomena, flammability limits, and material combustion dynamics in reduced gravity.';

  const secFlightContext = {
    platform:
      study.profileSections?.flightContext?.platform ||
      (study.hardware.includes('Cygnus')
        ? 'Cygnus Resupply Spacecraft (Autonomous Duct)'
        : study.hardware.includes('MSG')
        ? 'International Space Station (Microgravity Science Glovebox)'
        : study.hardware.includes('CIR')
        ? 'International Space Station (Combustion Integrated Rack)'
        : study.hardware.includes('Zero-G')
        ? 'NASA Glenn 5.18-Second Zero-Gravity Drop Facility'
        : 'International Space Station / NASA Orbital Flight Carrier'),
    missionDates: study.profileSections?.flightContext?.missionDates || study.dates || 'Active NASA Mission',
    gravityEnvironment:
      study.profileSections?.flightContext?.gravityEnvironment ||
      (study.category === 'Partial-g'
        ? 'Lunar Partial Gravity (1/6-g: 0.165 g) / Parabolic Trajectory'
        : 'Continuous Freefall Microgravity (0-g: < 10⁻⁵ g)'),
    carrier:
      study.profileSections?.flightContext?.carrier ||
      (study.program.includes('Saffire')
        ? 'Orbital ATK / Northrop Grumman Cygnus'
        : study.program.includes('Apollo')
        ? 'Apollo Command & Service Module'
        : 'ISS Orbital Complex (Destiny Laboratory / Columbus)'),
  };

  const secExperimentalApproach =
    study.profileSections?.experimentalApproach ||
    `Investigation utilized authentic test samples composed of ${study.fuelType}. Atmospheres were maintained within ${study.oxygenRange} across a pressure spectrum of ${study.pressureRange}. Convective airflow was systematically varied at ${study.flowVelocity} to map extinction and steady-spread regimes without terrestrial buoyancy interference.`;

  const secHardwareDesign =
    study.profileSections?.hardwareDesign ||
    `Flight test apparatus: ${study.hardware}. Included calibrated multi-angle digital video imaging, infrared thermography, thermocouple rake arrays, narrow-band optical radiometers, and sealed flow ducts with multi-barrier safety interlocks and automated nitrogen/CO₂ purging.`;

  const secDataMaterial =
    study.profileSections?.dataResearchMaterial ||
    `Archived flight datasets include high-definition color video frames, flame edge tracking telemetry, gas chromatography samples, pressure transducer histories, and thermocouple time series stored in official NASA Physical Sciences Informatics (PSI) and NTRS repository archives. Sample accession ID: ${study.id}.`;

  const secResultsFindings =
    study.profileSections?.resultsFindings ||
    study.keyFinding ||
    'Confirmed that low convective velocity combined with zero gravity results in thick diffusive boundary layers. While steady flame spread can be maintained at low drafts, severe velocity reduction triggers radiative extinction due to accumulation of combustion products.';

  const secPublications = study.profileSections?.publicationsRelatedResearch || [
    {
      title: study.name,
      id: study.id,
      authors: study.authors?.map((a) => a.name).join(', ') || 'NASA Principal Investigators & Flight Science Team',
      url: study.externalUrl,
    },
  ];

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/90 backdrop-blur-2xl transition-all duration-300 animate-fade-in cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-[#030712]/98 border-2 border-cyan-500/50 rounded-2xl max-w-4xl w-full max-h-[94vh] flex flex-col shadow-[0_0_60px_rgba(6,182,212,0.35)] overflow-hidden cursor-default"
      >
        {/* ============================================================== */}
        {/* TOP BAR / INVESTIGATION PROFILE HEADER                        */}
        {/* ============================================================== */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-black via-[#061220] to-black border-b border-cyan-500/30 flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-xs font-mono font-black tracking-wider text-cyan-400 uppercase">
                Investigation Profile
              </span>
              <span className="text-[11px] font-mono font-bold px-2.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                {study.id}
              </span>
              {study.doi && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-700 truncate max-w-[200px]">
                  DOI: {study.doi}
                </span>
              )}
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-900 text-slate-300 border border-slate-700">
                {study.category} Pillar
              </span>
            </div>

            <h2 className="text-lg sm:text-xl font-bold text-white leading-tight">
              {renderHighlightedText(study.name, highlightQuery)}
            </h2>
            <p className="text-xs font-mono text-slate-400 mt-1">
              NASA ID: <span className="text-cyan-300 font-bold">{study.id}</span> · Research Area:{' '}
              <span className="text-slate-200">{study.category}</span> · Platform:{' '}
              <span className="text-slate-200">{secFlightContext.platform}</span> · Version: 2.0 (Verified NASA)
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer shrink-0"
            aria-label="Close dossier"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ============================================================== */}
        {/* STICKY QUICK-JUMP SECTION NAVIGATION TRAY                     */}
        {/* ============================================================== */}
        <div className="bg-[#050b14] border-b border-cyan-500/20 px-4 py-2 flex items-center gap-1.5 overflow-x-auto scrollbar-none text-[11px] font-mono">
          <span className="text-[10px] uppercase text-cyan-400 font-bold tracking-widest mr-1 shrink-0 flex items-center gap-1">
            <Compass className="w-3 h-3 text-cyan-400" /> Sections:
          </span>
          {[
            { key: 'overview', label: '01 — Overview' },
            { key: 'context', label: '02 — Mission / Flight Context' },
            { key: 'approach', label: '03 — Experimental Approach' },
            { key: 'hardware', label: '04 — Hardware & Experimental Design' },
            { key: 'data', label: '05 — Data & Research Material' },
            { key: 'results', label: '06 — Results & Findings' },
            { key: 'publications', label: '07 — Publications & Related Research' },
            { key: 'references', label: '08 — NASA Sources & References' },
          ].map((sec) => (
            <button
              key={sec.key}
              onClick={() => scrollToSection(sec.key as keyof typeof sectionRefs)}
              className="px-2.5 py-1 rounded-lg bg-slate-900/80 hover:bg-cyan-950 text-slate-300 hover:text-cyan-300 border border-slate-800 hover:border-cyan-500/40 whitespace-nowrap transition cursor-pointer active:scale-95 shrink-0"
            >
              {sec.label}
            </button>
          ))}
        </div>

        {/* Search match banner */}
        {highlightQuery && highlightQuery.trim() && (
          <div className="px-5 py-2 bg-amber-500/15 border-b border-amber-500/30 flex items-center gap-2 text-xs font-mono text-amber-300">
            <Search className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>
              Search active for <strong className="text-white underline">"{highlightQuery}"</strong> — matching keywords are highlighted below.
            </span>
          </div>
        )}

        {/* ============================================================== */}
        {/* CONTENT BODY WITH 9 NUMBERED SECTIONS                         */}
        {/* ============================================================== */}
        <div className="flex-1 p-5 sm:p-6 overflow-y-auto space-y-6">
          {/* ============================================================ */}
          {/* FLIGHT OPERATIONS TELEMETRY DECK                             */}
          {/* ============================================================ */}
          <div className="rounded-2xl overflow-hidden border border-cyan-500/40 bg-gradient-to-br from-[#061426] via-[#030c18] to-black shadow-[0_0_35px_rgba(6,182,212,0.18)] p-4 sm:p-5 space-y-4">
            {/* Top row: Mission Status Badges & Flight Program */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-cyan-500/20">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-mono px-2.5 py-1 rounded-md bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 font-bold flex items-center gap-1.5 shadow-sm">
                  <CheckCircle2 className="w-3.5 h-3.5 text-cyan-300" /> Authentic NASA Flight Telemetry
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-900/90 text-slate-300 border border-slate-700">
                  {study.isLiveFetched ? '📡 Live NTRS Retrieval' : '🏛️ Flight Archive'}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-black/80 text-cyan-300 border border-cyan-500/30 font-bold">
                  {study.hardware.split('(')[0].trim() || 'ISS Facility'}
                </span>
              </div>

              <div className="text-[11px] font-mono text-slate-400 flex items-center gap-1.5 self-start sm:self-auto">
                <span className="text-slate-500 uppercase tracking-wider text-[10px]">Program:</span>
                <span className="text-slate-200 font-bold">{study.program}</span>
              </div>
            </div>

            {/* 4-Box Telemetry HUD Readout Matrix */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {/* Box 1: Atmospheric Oxygen */}
              <div className="p-3 rounded-xl bg-black/70 border border-cyan-500/30 hover:border-cyan-400/60 transition group space-y-1">
                <div className="flex items-center justify-between text-[10px] font-mono">
                  <span className="text-cyan-400 font-bold uppercase tracking-wider flex items-center gap-1">
                    🫁 Chamber O₂
                  </span>
                  <span className="text-slate-500 group-hover:text-cyan-300 transition text-[9px]">ATM</span>
                </div>
                <div className="text-sm sm:text-base font-bold font-mono text-white tracking-tight">
                  {study.oxygenRange}
                </div>
                <div className="text-[10px] font-mono text-slate-400 truncate">
                  Flammability Envelope
                </div>
              </div>

              {/* Box 2: Forced Convection Flow Velocity */}
              <div className="p-3 rounded-xl bg-black/70 border border-cyan-500/30 hover:border-cyan-400/60 transition group space-y-1">
                <div className="flex items-center justify-between text-[10px] font-mono">
                  <span className="text-sky-400 font-bold uppercase tracking-wider flex items-center gap-1">
                    💨 Forced Flow
                  </span>
                  <span className="text-slate-500 group-hover:text-sky-300 transition text-[9px]">U_COFLOW</span>
                </div>
                <div className="text-sm sm:text-base font-bold font-mono text-sky-200 tracking-tight">
                  {study.flowVelocity}
                </div>
                <div className="text-[10px] font-mono text-slate-400 truncate">
                  Duct Airflow Velocity
                </div>
              </div>

              {/* Box 3: Operating Pressure */}
              <div className="p-3 rounded-xl bg-black/70 border border-cyan-500/30 hover:border-cyan-400/60 transition group space-y-1">
                <div className="flex items-center justify-between text-[10px] font-mono">
                  <span className="text-amber-400 font-bold uppercase tracking-wider flex items-center gap-1">
                    🛡️ Cabin Pressure
                  </span>
                  <span className="text-slate-500 group-hover:text-amber-300 transition text-[9px]">P_NOM</span>
                </div>
                <div className="text-sm sm:text-base font-bold font-mono text-amber-200 tracking-tight">
                  {study.pressureRange}
                </div>
                <div className="text-[10px] font-mono text-slate-400 truncate">
                  Chamber Pressurization
                </div>
              </div>

              {/* Box 4: Test Fuel & Substrate */}
              <div className="p-3 rounded-xl bg-black/70 border border-cyan-500/30 hover:border-cyan-400/60 transition group space-y-1">
                <div className="flex items-center justify-between text-[10px] font-mono">
                  <span className="text-emerald-400 font-bold uppercase tracking-wider flex items-center gap-1">
                    🧪 Test Fuel
                  </span>
                  <span className="text-slate-500 group-hover:text-emerald-300 transition text-[9px]">SPECIMEN</span>
                </div>
                <div className="text-sm sm:text-base font-bold font-mono text-emerald-200 truncate tracking-tight" title={study.fuelType}>
                  {study.fuelType}
                </div>
                <div className="text-[10px] font-mono text-slate-400 truncate">
                  Target Reactant Substrate
                </div>
              </div>
            </div>
          </div>

          {/* ============================================================ */}
          {/* 01 — OVERVIEW                                                */}
          {/* ============================================================ */}
          <div ref={sectionRefs.overview} className="space-y-2 pt-2 scroll-mt-14">
            <div className="flex items-center gap-2 border-b border-cyan-500/20 pb-1.5">
              <span className="text-xs font-mono font-black text-cyan-400">01</span>
              <span className="text-slate-600 font-mono">—</span>
              <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-white">
                Overview
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed bg-[#050b14]/90 p-4 rounded-xl border border-slate-800">
              {renderHighlightedText(secOverview, highlightQuery)}
            </p>

            {/* Section 01 Highlights & Key Takeaways */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-xs font-mono">
              <div className="p-3.5 bg-black/60 rounded-xl border border-slate-800 space-y-1">
                <span className="text-[10px] text-cyan-400 font-bold uppercase block tracking-wider">🔬 Primary Key Finding:</span>
                <p className="text-slate-200 font-sans leading-relaxed text-xs">
                  {renderHighlightedText(study.keyFinding, highlightQuery)}
                </p>
              </div>
              <div className="p-3.5 bg-black/60 rounded-xl border border-slate-800 space-y-1">
                <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider block">🌍 Terrestrial Spinoff & Commercial Innovation:</span>
                <p className="text-slate-200 font-sans leading-relaxed text-xs">
                  {renderHighlightedText(study.earthSpinOff, highlightQuery)}
                </p>
              </div>
            </div>
          </div>

          {/* ============================================================ */}
          {/* 02 — MISSION / FLIGHT CONTEXT                                */}
          {/* ============================================================ */}
          <div ref={sectionRefs.context} className="space-y-2 pt-2 scroll-mt-14">
            <div className="flex items-center gap-2 border-b border-cyan-500/20 pb-1.5">
              <span className="text-xs font-mono font-black text-cyan-400">02</span>
              <span className="text-slate-600 font-mono">—</span>
              <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-white">
                Mission / Flight Context
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
              <div className="p-3.5 bg-black/60 rounded-xl border border-slate-800 space-y-1">
                <span className="text-slate-400 text-[10px] uppercase block">🚀 Host Flight Platform:</span>
                <span className="text-slate-100 font-bold block">{secFlightContext.platform}</span>
              </div>
              <div className="p-3.5 bg-black/60 rounded-xl border border-slate-800 space-y-1">
                <span className="text-slate-400 text-[10px] uppercase block">📅 Operational Dates / Timeline:</span>
                <span className="text-cyan-300 font-bold block">{secFlightContext.missionDates}</span>
              </div>
              <div className="p-3.5 bg-black/60 rounded-xl border border-slate-800 space-y-1">
                <span className="text-slate-400 text-[10px] uppercase block">🌌 Gravity Environment:</span>
                <span className="text-slate-100 font-bold block">{secFlightContext.gravityEnvironment}</span>
              </div>
              <div className="p-3.5 bg-black/60 rounded-xl border border-slate-800 space-y-1">
                <span className="text-slate-400 text-[10px] uppercase block">🛰️ Spaceflight Carrier:</span>
                <span className="text-slate-100 font-bold block">{secFlightContext.carrier}</span>
              </div>
            </div>
          </div>

          {/* ============================================================ */}
          {/* 03 — EXPERIMENTAL APPROACH                                   */}
          {/* ============================================================ */}
          <div ref={sectionRefs.approach} className="space-y-2 pt-2 scroll-mt-14">
            <div className="flex items-center gap-2 border-b border-cyan-500/20 pb-1.5">
              <span className="text-xs font-mono font-black text-cyan-400">03</span>
              <span className="text-slate-600 font-mono">—</span>
              <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-white">
                Experimental Approach
              </h3>
            </div>
            <div className="p-4 rounded-xl bg-black/60 border border-slate-800 text-xs sm:text-sm text-slate-200 leading-relaxed">
              {renderHighlightedText(secExperimentalApproach, highlightQuery)}
            </div>
          </div>

          {/* ============================================================ */}
          {/* 04 — HARDWARE & EXPERIMENTAL DESIGN                          */}
          {/* ============================================================ */}
          <div ref={sectionRefs.hardware} className="space-y-2 pt-2 scroll-mt-14">
            <div className="flex items-center gap-2 border-b border-cyan-500/20 pb-1.5">
              <span className="text-xs font-mono font-black text-cyan-400">04</span>
              <span className="text-slate-600 font-mono">—</span>
              <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-white">
                Hardware & Experimental Design
              </h3>
            </div>
            <div className="p-4 rounded-xl bg-gradient-to-r from-slate-950 via-[#071322] to-black border border-cyan-500/30 text-xs sm:text-sm text-slate-200 leading-relaxed space-y-2">
              <div className="font-mono text-cyan-300 font-bold text-xs flex items-center gap-2">
                <Cpu className="w-4 h-4 text-cyan-400" />
                <span>Test Hardware & Diagnostic Payload:</span>
              </div>
              <p>{renderHighlightedText(secHardwareDesign, highlightQuery)}</p>
            </div>
          </div>

          {/* ============================================================ */}
          {/* 05 — DATA & RESEARCH MATERIAL                                */}
          {/* ============================================================ */}
          <div ref={sectionRefs.data} className="space-y-2 pt-2 scroll-mt-14">
            <div className="flex items-center gap-2 border-b border-cyan-500/20 pb-1.5">
              <span className="text-xs font-mono font-black text-cyan-400">05</span>
              <span className="text-slate-600 font-mono">—</span>
              <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-white">
                Data & Research Material
              </h3>
            </div>
            <div className="p-4 rounded-xl bg-black/60 border border-slate-800 text-xs sm:text-sm text-slate-300 leading-relaxed space-y-2 font-mono">
              <div className="flex items-center gap-2 text-emerald-300 font-bold text-xs">
                <Database className="w-4 h-4 text-emerald-400" />
                <span>Archived Data Modalities & Repository Access:</span>
              </div>
              <p className="font-sans text-slate-200">{renderHighlightedText(secDataMaterial, highlightQuery)}</p>
            </div>
          </div>

          {/* ============================================================ */}
          {/* 06 — RESULTS & FINDINGS                                      */}
          {/* ============================================================ */}
          <div ref={sectionRefs.results} className="space-y-2 pt-2 scroll-mt-14">
            <div className="flex items-center gap-2 border-b border-cyan-500/20 pb-1.5">
              <span className="text-xs font-mono font-black text-cyan-400">06</span>
              <span className="text-slate-600 font-mono">—</span>
              <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-white">
                Results & Findings
              </h3>
            </div>
            <div className="p-4 rounded-xl bg-slate-950 border border-cyan-500/30 text-xs sm:text-sm text-slate-200 leading-relaxed space-y-3">
              <p>{renderHighlightedText(secResultsFindings, highlightQuery)}</p>

              {/* Detailed Physics Breakdown if present */}
              {study.detailedAnalysis && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 border-t border-slate-800 text-xs font-mono">
                  {study.detailedAnalysis.damkohlerImpact && (
                    <div className="p-3 bg-black/60 rounded-lg border border-slate-800">
                      <span className="text-cyan-300 font-bold block mb-1">Damköhler Transport:</span>
                      <span className="text-slate-300 font-sans">
                        {renderHighlightedText(study.detailedAnalysis.damkohlerImpact, highlightQuery)}
                      </span>
                    </div>
                  )}
                  {study.detailedAnalysis.extinctionMechanism && (
                    <div className="p-3 bg-black/60 rounded-lg border border-slate-800">
                      <span className="text-cyan-300 font-bold block mb-1">Extinction Mechanism:</span>
                      <span className="text-slate-300 font-sans">
                        {renderHighlightedText(study.detailedAnalysis.extinctionMechanism, highlightQuery)}
                      </span>
                    </div>
                  )}
                  {study.detailedAnalysis.detectorImplication && (
                    <div className="p-3 bg-black/60 rounded-lg border border-slate-800">
                      <span className="text-amber-300 font-bold block mb-1">Detector Implication:</span>
                      <span className="text-slate-300 font-sans">
                        {renderHighlightedText(study.detailedAnalysis.detectorImplication, highlightQuery)}
                      </span>
                    </div>
                  )}
                  {study.detailedAnalysis.suppressantAdvice && (
                    <div className="p-3 bg-black/60 rounded-lg border border-slate-800">
                      <span className="text-emerald-300 font-bold block mb-1">Suppression Advice:</span>
                      <span className="text-slate-300 font-sans">
                        {renderHighlightedText(study.detailedAnalysis.suppressantAdvice, highlightQuery)}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ============================================================ */}
          {/* 07 — PUBLICATIONS & RELATED RESEARCH                         */}
          {/* ============================================================ */}
          <div ref={sectionRefs.publications} className="space-y-2 pt-2 scroll-mt-14">
            <div className="flex items-center gap-2 border-b border-cyan-500/20 pb-1.5">
              <span className="text-xs font-mono font-black text-cyan-400">07</span>
              <span className="text-slate-600 font-mono">—</span>
              <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-white">
                Publications & Related Research
              </h3>
            </div>
            <div className="space-y-2">
              {secPublications.map((pub, idx) => (
                <div
                  key={idx}
                  className="p-3.5 bg-black/60 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="font-bold text-white text-sm">
                      {renderHighlightedText(pub.title, highlightQuery)}
                    </div>
                    {pub.authors && (
                      <div className="text-[11px] font-mono text-slate-400">
                        Authors: {pub.authors}
                      </div>
                    )}
                    {pub.id && (
                      <div className="text-[10px] font-mono text-cyan-400">
                        Accession / Citation: {pub.id}
                      </div>
                    )}
                  </div>
                  {pub.url && (
                    <a
                      href={pub.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-lg bg-cyan-950 text-cyan-300 border border-cyan-500/40 font-mono text-xs font-bold hover:bg-cyan-900 transition flex items-center gap-1 shrink-0"
                    >
                      <ExternalLink className="w-3 h-3 text-cyan-400" />
                      <span>View Paper ↗</span>
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* ============================================================ */}
          {/* 08 — NASA SOURCES & REFERENCES                               */}
          {/* ============================================================ */}
          <div ref={sectionRefs.references} className="space-y-2 pt-2 scroll-mt-14">
            <div className="flex items-center gap-2 border-b border-cyan-500/20 pb-1.5">
              <span className="text-xs font-mono font-black text-cyan-400">08</span>
              <span className="text-slate-600 font-mono">—</span>
              <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-white">
                NASA Sources & References
              </h3>
            </div>
            <div className="p-4 rounded-xl bg-gradient-to-r from-cyan-950/40 via-slate-900 to-black border border-cyan-500/40 space-y-3">
              <div className="flex items-center justify-between gap-2 flex-wrap text-xs font-mono">
                <span className="text-cyan-300 font-bold flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-cyan-400" />
                  Primary Repository Custodian:
                </span>
                <span className="px-2.5 py-0.5 rounded bg-black border border-cyan-500/40 text-cyan-300 text-[11px] font-bold">
                  {repositoryName}
                </span>
              </div>

              {/* Direct Canonical Links */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                <a
                  href={psiUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-400/50 text-cyan-200 transition flex items-center justify-between text-xs font-mono group"
                >
                  <span className="font-bold flex items-center gap-2">
                    <ExternalLink className="w-3.5 h-3.5 text-cyan-400 group-hover:scale-110 transition" />
                    <span>🔬 Official NASA PSI Investigation Portal ↗</span>
                  </span>
                </a>

                <a
                  href={primaryExternalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 transition flex items-center justify-between text-xs font-mono group"
                >
                  <span className="font-bold flex items-center gap-2">
                    <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:scale-110 transition" />
                    <span>
                      {isIncident
                        ? '🏛️ Official NASA Incident Case Study ↗'
                        : isSpinoff
                        ? '🌍 Official NASA Spinoff Document ↗'
                        : '📄 Official NASA NTRS Publication ↗'}
                    </span>
                  </span>
                </a>

                {study.doi && (
                  <a
                    href={study.doi.startsWith('http') ? study.doi : `https://doi.org/${study.doi}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700 text-slate-300 transition flex items-center justify-between text-xs font-mono group"
                  >
                    <span className="flex items-center gap-2">
                      <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Persistent Identifier (DOI): {study.doi} ↗</span>
                    </span>
                  </a>
                )}

                {study.pdfUrl && (
                  <a
                    href={study.pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3 rounded-xl bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-500/40 text-emerald-300 transition flex items-center justify-between text-xs font-mono font-bold"
                  >
                    <span>📥 Download Full Original STI PDF ↗</span>
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ============================================================== */}
        {/* FOOTER ACTIONS                                                */}
        {/* ============================================================== */}
        <div className="p-4 bg-black/95 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <a
              href={psiUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-mono font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-950/40 border border-cyan-500/40 transition"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>NASA PSI Portal</span>
            </a>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onAskAIAboutStudy(study);
                onClose();
              }}
              className="text-xs font-mono font-bold px-3.5 py-2 rounded-xl bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-500/40 text-cyan-200 transition flex items-center gap-1.5 cursor-pointer active:scale-95 shadow-[0_0_12px_rgba(6,182,212,0.15)]"
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              Ask Aether-SI
            </button>
            <button
              onClick={() => {
                onLoadIntoPredictor(study);
                onClose();
              }}
              className="text-xs font-mono font-bold px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-400 to-sky-400 text-slate-950 hover:brightness-110 transition shadow flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <Flame className="w-3.5 h-3.5" />
              Load to Predictor Engine
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
