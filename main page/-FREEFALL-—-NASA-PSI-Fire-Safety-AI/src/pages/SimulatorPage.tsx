import React, { useState, useEffect } from 'react';
import {
  Flame,
  Gauge,
  BookOpen,
  Video,
  RefreshCw,
  ExternalLink,
  AlertCircle,
  Play,
  X,
  Layers,
  Sparkles,
  Info,
  ChevronRight,
  ShieldAlert,
  Compass,
} from 'lucide-react';
import { PredictionInput, PredictionResult } from '../types';
import { PredictorView } from '../components/PredictorView';
import { calculateFlammabilityPrediction } from '../utils/predictorEngine';
import { playCommandChirp, playTelemetryChirp } from '../utils/audioTelemetry';

export interface SimulatorPageProps {
  params?: Record<string, string>;
  input?: PredictionInput;
  onChangeInput?: (newInput: PredictionInput) => void;
  prediction?: PredictionResult;
  onOpenDossier?: (studyId: string) => void;
  onAskAIAboutPrediction?: () => void;
  onNavigate?: (path: string) => void;
}

type SimulatorTab = 'chamber' | 'prediction' | 'science' | 'footage';

interface VideoItem {
  id: string;
  youtubeId: string;
  title: string;
  duration: string;
  description: string;
  thumbnail: string;
  nasaRef: string;
}

interface ComparisonItem {
  id: string;
  title: string;
  experiment: string;
  image: string;
  earthBehavior: string;
  microgravityBehavior: string;
  scientificInsight: string;
  citation: string;
}

const NASA_VIDEOS: VideoItem[] = [
  {
    id: 'vid-1',
    youtubeId: 'W1oXykoz9zg',
    title: 'NASA ScienceCasts: The Power of Studying Combustion on ISS',
    duration: '3:45',
    description:
      'NASA Glenn Research Center scientists explain how eliminating gravity reveals fundamental flame chemistry, soot formation mechanics, and clean-energy combustion efficiencies.',
    thumbnail: '/assets/nasa/yt_W1oXykoz9zg.jpg',
    nasaRef: 'NASA ScienceCasts // Glenn Research Center',
  },
  {
    id: 'vid-2',
    youtubeId: 'BxxqCLxxY3M',
    title: 'NASA ScienceCasts: Strange Flames on the Space Station',
    duration: '4:10',
    description:
      'Droplet Combustion Experiment (FLEX) discovers "cool flames" burning at 500°C that continue to consume fuel without visible incandescent soot emission.',
    thumbnail: '/assets/nasa/yt_BxxqCLxxY3M.jpg',
    nasaRef: 'FLEX Investigation // Combustion Integrated Rack',
  },
  {
    id: 'vid-3',
    youtubeId: 'qQQ1OHW1_F4',
    title: 'NASA ISS: Flame Comes to Life in Microgravity Combustion',
    duration: '2:55',
    description:
      'High-speed imaging of spherical flame ignition inside the Microgravity Science Glovebox (MSG). Watch molecular diffusion feed pure spherical burning.',
    thumbnail: '/assets/nasa/yt_qQQ1OHW1_F4.jpg',
    nasaRef: 'MSG Facility // Expedition Crew Science',
  },
  {
    id: 'vid-4',
    youtubeId: 'CE7Nz78rkfQ',
    title: 'Space Station Live: Studying Fire In Space (FLEX-2)',
    duration: '5:20',
    description:
      'Live downlink interview detailing the Flame Extinction Experiment (FLEX-2), investigating liquid alkane droplet vaporization and radiative extinction limits.',
    thumbnail: '/assets/nasa/yt_CE7Nz78rkfQ.jpg',
    nasaRef: 'ISS Mission Control Houston // GRC Principal Investigators',
  },
  {
    id: 'vid-5',
    youtubeId: 'q7p9yXVgeNw',
    title: 'Space Station Live: Science of Space Combustion',
    duration: '6:15',
    description:
      'Detailed overview of the BASS experiment series, investigating concurrent and opposed airflow effects on solid polymer and cotton-fiberglass flammability.',
    thumbnail: '/assets/nasa/yt_q7p9yXVgeNw.jpg',
    nasaRef: 'BASS-I & BASS-II Series // Physical Sciences Informatics',
  },
  {
    id: 'vid-6',
    youtubeId: 'fhgh7XV0O1Y',
    title: 'Space Station Live: FLEX in Space for Safer Combustion',
    duration: '4:40',
    description:
      'Discussion on how microgravity combustion findings improve terrestrial fire safety standards, engine fuel efficiency, and planetary habitat flammability protocols.',
    thumbnail: '/assets/nasa/yt_fhgh7XV0O1Y.jpg',
    nasaRef: 'NASA Spinoff & Terrestrial Safety Integration',
  },
];

const NASA_COMPARISONS: ComparisonItem[] = [
  {
    id: 'comp-1',
    title: 'Microgravity vs Earth Candle Flame',
    experiment: 'NASA GRC Drop Tower & STS-50 Flight Validation',
    image: '/assets/nasa/candle_comparison_grc.jpg',
    earthBehavior:
      'Tall, yellow, teardrop plume shaped by buoyant upward convection (~1–2 m/s). Hot gases rise, pulling fresh O₂ into the flame base and carrying incandescent soot upward.',
    microgravityBehavior:
      'Dim blue spherical envelope. Buoyancy vanishes (g = 10⁻⁶). Oxygen enters strictly by molecular diffusion; reaction rates drop, producing a cool, nearly soot-free spherical reaction zone.',
    scientificInsight:
      'Without natural convection, the flame consumes O₂ in an expanding sphere and is surrounded by its own combustion products (CO₂, H₂O), leading to premature radiative quenching if airflow ceases.',
    citation: 'NASA TP-2000-209825 // GRC Drop Tower Facility',
  },
  {
    id: 'comp-2',
    title: 'STS-50 Microgravity Candle Flame Experiment',
    experiment: 'First Space Shuttle Glovebox Combustion Study (STS-50 / USML-1)',
    image: '/assets/nasa/candle_microgravity_sts50.jpg',
    earthBehavior:
      'Normal candle produces bright yellow emissions at ~1400°C with steady convective heat transfer to wax pool.',
    microgravityBehavior:
      'Hemispherical flame base hovering above wick, burning at ~800–1000°C for up to 45 minutes with extremely low fuel regression rate.',
    scientificInsight:
      'Demonstrated that solid and wax fuel burning rates decrease by up to 70% in quiescent microgravity, but survive far longer than terrestrial models predicted.',
    citation: 'Dietrich et al., Combustion and Flame 108:318-332 (1997)',
  },
  {
    id: 'comp-3',
    title: 'BASS Investigation — Burning and Suppression of Solids',
    experiment: 'ISS Microgravity Science Glovebox (MSG)',
    image: '/assets/nasa/bass_flame_iss.jpg',
    earthBehavior:
      'Upward flame spread is dominated by thermal buoyancy accelerating flame front velocity and turbulence.',
    microgravityBehavior:
      'Flame spread depends directly on forced duct ventilation. At low ventilation (1–5 cm/s), radiative losses quench the flame; at moderate flow (15–25 cm/s), steady spread occurs.',
    scientificInsight:
      'Established the limiting oxygen index (LOI) curve as a non-monotonic function of flow speed, proving spacecraft ventilation speeds dictate flammability risk.',
    citation: 'NASA PSI Dataset OSD-903 / OSD-904 // BASS-I/II',
  },
  {
    id: 'comp-4',
    title: 'Saffire Cygnus Cargo Fabric Burn',
    experiment: 'Spacecraft Fire Experiment (Saffire-I through VI)',
    image: '/assets/nasa/saffire_fabric_burn.jpg',
    earthBehavior:
      'Laboratory flammability tests in small chambers cannot simulate large-scale solid flame spread inside depressurized spacecraft cabins.',
    microgravityBehavior:
      'First large-scale (0.4m × 1.0m) fabric burn inside an uncrewed Cygnus resupply vehicle after departure from ISS, testing realistic spacecraft cabin fire growth.',
    scientificInsight:
      'Showed that large fabric samples spread steadily under low airflow, confirming NASA-STD-6001B upward flammability tests can underpredict horizontal spread in spacecraft ventilation ducts.',
    citation: 'Urban et al., NASA/TM-2017-219574 // Saffire Project',
  },
  {
    id: 'comp-5',
    title: 'Saffire PMMA Surface Regression',
    experiment: 'Saffire-II & Saffire-IV Thick Solid Fuel Burn',
    image: '/assets/nasa/saffire_pmma_burn.jpg',
    earthBehavior:
      'Thick PMMA drips and generates heavy black soot plumes that obscure pyrolysis gasification front.',
    microgravityBehavior:
      'Slow, laminar pyrolysis front with clear bubbling within the solid matrix, receding without gravitational dripping.',
    scientificInsight:
      'Allowed exact measurement of solid pyrolysis activation energy and thermal boundary layer thickness without gravitational distortion.',
    citation: 'Ferkul et al., Combustion and Flame 198:402-411 (2018)',
  },
  {
    id: 'comp-6',
    title: 'Combustion Integrated Rack (CIR) on ISS',
    experiment: 'Destiny Laboratory Multi-User Combustion Facility',
    image: '/assets/nasa/cir_hardware_iss.jpg',
    earthBehavior:
      'Standard high-pressure combustor requiring constant exhaust scrubbers and active convective cooling.',
    microgravityBehavior:
      '100-liter hermetically sealed chamber with active mass spectrometers, 5-wavelength imaging, and automated fuel droplet dispensers for safe long-duration combustion experiments.',
    scientificInsight:
      'Over 15 years of continuous orbital operations providing baseline data for the ACME and FLEX scientific series.',
    citation: 'NASA Glenn Research Center // CIR Facility Documentation',
  },
];

// Fallback state if input not provided
const defaultInput: PredictionInput = {
  gravity: '0g',
  material: 'sibal',
  gasMix: 'normal',
  oxygenPct: 21.0,
  pressureKpa: 101.3,
  airflowCms: 20.0,
  flowDirection: 'concurrent',
};

const defaultPrediction: PredictionResult = calculateFlammabilityPrediction(defaultInput);

export const SimulatorPage: React.FC<SimulatorPageProps> = ({
  params,
  input = defaultInput,
  onChangeInput = () => {},
  prediction = defaultPrediction,
  onOpenDossier = () => {},
  onAskAIAboutPrediction = () => {},
  onNavigate,
}) => {
  // Determine active tab from URL query params (e.g. ?tab=prediction) or default to 'chamber'
  const initialTab: SimulatorTab =
    params?.tab === 'prediction' || params?.tab === 'science' || params?.tab === 'footage'
      ? params.tab
      : 'chamber';

  const [activeTab, setActiveTab] = useState<SimulatorTab>(initialTab);
  const [iframeKey, setIframeKey] = useState(0);
  const [isIframeLoading, setIsIframeLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState<VideoItem | null>(null);

  // Sync tab if URL param changes
  useEffect(() => {
    if (params?.tab) {
      if (params.tab === 'prediction' || params.tab === 'science' || params.tab === 'footage' || params.tab === 'chamber') {
        setActiveTab(params.tab as SimulatorTab);
      }
    }
  }, [params?.tab]);

  const handleTabChange = (tab: SimulatorTab) => {
    playTelemetryChirp();
    setActiveTab(tab);
  };

  const handleReloadChamber = () => {
    playCommandChirp();
    setIsIframeLoading(true);
    setIframeKey((prev) => prev + 1);
  };

  return (
    <div className="space-y-6">
      {/* ========================================================================= */}
      {/* MASTER SIMULATOR HUB HEADER & SUB-NAVIGATION BAR                          */}
      {/* ========================================================================= */}
      <div className="rounded-2xl bg-gradient-to-r from-[#07152B]/95 via-[#06183E]/90 to-[#030814]/95 border border-[#35D6FF]/30 p-4 sm:p-5 backdrop-blur-2xl shadow-[0_0_40px_rgba(53,214,255,0.12)]">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Brand & Mission Identification */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#35D6FF]/15 border border-[#35D6FF]/40 flex items-center justify-center text-[#35D6FF] shadow-[0_0_15px_rgba(53,214,255,0.35)] shrink-0">
              <Flame className="w-5 h-5 fill-[#35D6FF]/40 text-[#35D6FF]" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-black font-orbitron text-[#EAF3FF] tracking-wider">
                  IGNIS FLAME SIMULATOR & PREDICTOR HUB
                </h2>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-[#35D6FF]/20 text-[#35D6FF] border border-[#35D6FF]/40 font-bold">
                  NASA FINAL × FREEFALL
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#3BE8A0]/20 text-[#3BE8A0] border border-[#3BE8A0]/40 font-bold">
                  Operational
                </span>
              </div>
              <p className="text-xs text-[#8DB3DE] font-mono leading-relaxed mt-0.5">
                Microgravity 3D chamber, in-browser GBDT flammability predictor, 2D phase map, NASA comparisons & authentic video gallery.
              </p>
            </div>
          </div>

          {/* Sub-Navigation Tabs (NO horizontal scrollbar trap!) */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#030814]/90 border border-cyan-500/30 shrink-0 flex-wrap">
            <button
              onClick={() => handleTabChange('chamber')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                activeTab === 'chamber'
                  ? 'bg-gradient-to-r from-cyan-400 to-sky-400 text-slate-950 shadow-[0_0_15px_rgba(6,182,212,0.5)]'
                  : 'text-slate-400 hover:text-cyan-200 hover:bg-slate-900/60'
              }`}
            >
              <Flame className="w-3.5 h-3.5" />
              <span>3D Chamber</span>
            </button>

            <button
              onClick={() => handleTabChange('prediction')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                activeTab === 'prediction'
                  ? 'bg-gradient-to-r from-cyan-400 to-sky-400 text-slate-950 shadow-[0_0_15px_rgba(6,182,212,0.5)]'
                  : 'text-slate-400 hover:text-cyan-200 hover:bg-slate-900/60'
              }`}
            >
              <Gauge className="w-3.5 h-3.5" />
              <span>ML Predictor & Phase Map</span>
            </button>

            <button
              onClick={() => handleTabChange('science')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                activeTab === 'science'
                  ? 'bg-gradient-to-r from-cyan-400 to-sky-400 text-slate-950 shadow-[0_0_15px_rgba(6,182,212,0.5)]'
                  : 'text-slate-400 hover:text-cyan-200 hover:bg-slate-900/60'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>NASA Comparisons</span>
            </button>

            <button
              onClick={() => handleTabChange('footage')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                activeTab === 'footage'
                  ? 'bg-gradient-to-r from-cyan-400 to-sky-400 text-slate-950 shadow-[0_0_15px_rgba(6,182,212,0.5)]'
                  : 'text-slate-400 hover:text-cyan-200 hover:bg-slate-900/60'
              }`}
            >
              <Video className="w-3.5 h-3.5" />
              <span>NASA Footage</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: 3D COMBUSTION CHAMBER                                              */}
      {/* ========================================================================= */}
      {activeTab === 'chamber' && (
        <div className="space-y-4">
          {/* Chamber Action Bar */}
          <div className="flex items-center justify-between gap-3 px-1">
            <div className="text-xs font-mono text-[#8DB3DE] flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              <span>Interactive Three.js WebGL Chamber // Variable Gravity & Airflow Presets</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  playCommandChirp();
                  if (onNavigate) onNavigate('/network');
                  else window.location.hash = '#/network';
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#06183E] hover:bg-[#07152B] border border-[#35D6FF]/40 hover:border-[#35D6FF] text-[#35D6FF] text-xs font-mono font-bold transition shadow cursor-pointer"
                title="Explore Interactive IGNIS Node Network (Internal Page)"
              >
                <Compass className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Mission Network</span>
              </button>

              <button
                onClick={handleReloadChamber}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#06183E] hover:bg-[#07152B] border border-[#35D6FF]/40 hover:border-[#35D6FF] text-[#35D6FF] text-xs font-mono font-bold transition shadow cursor-pointer"
                title="Reload Simulator Canvas"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isIframeLoading ? 'animate-spin' : ''}`} />
                <span>Reload</span>
              </button>

              <a
                href="/ignis/ignis-simulator.html"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#35D6FF]/20 hover:bg-[#35D6FF]/30 border border-[#35D6FF]/50 text-[#EAF3FF] hover:text-white text-xs font-mono font-bold transition shadow cursor-pointer"
                title="Open Standalone in Fullscreen"
              >
                <ExternalLink className="w-3.5 h-3.5 text-[#35D6FF]" />
                <span className="hidden sm:inline">Fullscreen Window</span>
              </a>
            </div>
          </div>

          {/* 3D WebGL Chamber Container */}
          <div className="relative w-full rounded-2xl border border-[#35D6FF]/30 bg-[#030814] shadow-[0_0_50px_rgba(53,214,255,0.15)] overflow-hidden h-[82vh] min-h-[680px]">
            {isIframeLoading && (
              <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[#030814]/95 backdrop-blur-md text-center p-6 space-y-4">
                <div className="relative w-16 h-16 flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full border-2 border-[#35D6FF]/20 border-t-[#35D6FF] animate-spin" />
                  <Flame className="w-8 h-8 text-[#35D6FF] animate-pulse" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-bold font-mono text-[#EAF3FF] tracking-wider">
                    INITIALIZING IGNIS 3D CHAMBER
                  </h3>
                  <p className="text-xs text-[#8DB3DE] font-mono">
                    Loading shaders, atmospheric presets, and interactive gravity controls...
                  </p>
                </div>
              </div>
            )}

            <iframe
              key={iframeKey}
              src="/ignis/ignis-simulator.html"
              title="IGNIS 3D Flame Simulator"
              className="w-full h-full border-0"
              onLoad={() => setIsIframeLoading(false)}
            />
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: ML PREDICTOR & 2D PHASE MAP (MIGRATED & FULLY PRESERVED)          */}
      {/* ========================================================================= */}
      {activeTab === 'prediction' && (
        <div className="space-y-4">
          <PredictorView
            input={input}
            onChangeInput={onChangeInput}
            prediction={prediction}
            onOpenDossier={onOpenDossier}
            onAskAIAboutPrediction={onAskAIAboutPrediction}
          />
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: NASA COMBUSTION SCIENCE & HISTORIC COMPARISONS                     */}
      {/* ========================================================================= */}
      {activeTab === 'science' && (
        <div className="space-y-6">
          <div className="bg-[#06183E]/60 border border-cyan-500/30 rounded-2xl p-5 backdrop-blur-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="text-sm font-mono font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-2">
                <BookOpen className="w-4 h-4" /> NASA Microgravity Combustion Research Lineage
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed max-w-3xl">
                Decades of orbital experiments on the Space Shuttle, Mir, and the International Space Station
                demonstrate that terrestrial fire safety testing fails to capture the unique physics of microgravity.
                Explore verified photographic evidence and physical transport comparisons from NASA Glenn Research Center.
              </p>
            </div>
            <button
              onClick={() => {
                playCommandChirp();
                if (onNavigate) onNavigate('/science');
                else window.location.hash = '#/science';
              }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/50 text-cyan-300 hover:text-white text-xs font-mono font-bold transition shadow shrink-0 self-start md:self-auto cursor-pointer"
              title="Open Complete Illustrated Combustion Science Dossier (Internal Page)"
            >
              <BookOpen className="w-4 h-4 text-cyan-400" />
              <span>Full Science Brief →</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {NASA_COMPARISONS.map((comp) => (
              <div
                key={comp.id}
                className="bg-[#06183E]/80 border border-cyan-500/30 hover:border-cyan-400/60 rounded-2xl overflow-hidden shadow-[0_0_25px_rgba(6,182,212,0.1)] transition-all duration-300 flex flex-col"
              >
                {/* Photo Header */}
                <div className="relative h-48 bg-black overflow-hidden group">
                  <img
                    src={comp.image}
                    alt={comp.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/assets/nasa/candle_comparison_grc.jpg';
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#06183E] via-transparent to-transparent opacity-80" />
                  <div className="absolute bottom-2 left-3 right-3">
                    <span className="text-[10px] font-mono text-cyan-300 uppercase px-2 py-0.5 rounded bg-black/70 border border-cyan-500/30">
                      {comp.experiment}
                    </span>
                  </div>
                </div>

                {/* Content Body */}
                <div className="p-5 space-y-4 flex-1 flex flex-col justify-between">
                  <div className="space-y-3">
                    <h4 className="font-orbitron font-bold text-white text-base leading-snug">
                      {comp.title}
                    </h4>

                    {/* Earth vs Space comparison */}
                    <div className="space-y-2 text-xs">
                      <div className="bg-amber-950/30 border border-amber-500/30 rounded-xl p-3">
                        <span className="font-mono font-bold text-amber-400 block mb-0.5">
                          Earth (1.0 g):
                        </span>
                        <p className="text-slate-300 leading-relaxed">{comp.earthBehavior}</p>
                      </div>

                      <div className="bg-cyan-950/40 border border-cyan-500/40 rounded-xl p-3">
                        <span className="font-mono font-bold text-cyan-300 block mb-0.5">
                          Microgravity (10⁻⁶ g):
                        </span>
                        <p className="text-slate-300 leading-relaxed">{comp.microgravityBehavior}</p>
                      </div>
                    </div>

                    <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold block mb-1">
                        Physical Science Takeaway
                      </span>
                      <p className="text-xs text-slate-200 leading-relaxed">{comp.scientificInsight}</p>
                    </div>
                  </div>

                  {/* Citation Footer */}
                  <div className="pt-3 border-t border-slate-800 text-[10px] font-mono text-slate-400 flex items-center justify-between">
                    <span className="truncate">{comp.citation}</span>
                    <span className="text-cyan-400 font-bold shrink-0">NASA GRC</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: NASA VIDEO GALLERY & AUTHENTIC FLIGHT FOOTAGE                      */}
      {/* ========================================================================= */}
      {activeTab === 'footage' && (
        <div className="space-y-6">
          <div className="bg-[#06183E]/60 border border-cyan-500/30 rounded-2xl p-5 backdrop-blur-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-mono font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-2">
                <Video className="w-4 h-4" /> NASA Glenn Research Center Video Archive
              </h3>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                Authentic mission video documentation of microgravity flame tests on the ISS Combustion Integrated
                Rack (CIR) and Microgravity Science Glovebox (MSG).
              </p>
            </div>
            <span className="text-xs font-mono px-3 py-1 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-500/40 shrink-0">
              6 Verified Videos
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {NASA_VIDEOS.map((video) => (
              <div
                key={video.id}
                onClick={() => {
                  playCommandChirp();
                  setSelectedVideo(video);
                }}
                className="bg-[#06183E]/80 border border-cyan-500/30 hover:border-cyan-400 rounded-2xl overflow-hidden shadow-[0_0_20px_rgba(6,182,212,0.1)] hover:shadow-[0_0_30px_rgba(6,182,212,0.25)] transition-all duration-300 cursor-pointer group flex flex-col justify-between"
              >
                <div>
                  {/* Thumbnail & Play Overlay */}
                  <div className="relative h-44 bg-black overflow-hidden">
                    <img
                      src={video.thumbnail}
                      alt={video.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/assets/nasa/candle_comparison_grc.jpg';
                      }}
                    />
                    <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-cyan-500/90 text-slate-950 flex items-center justify-center shadow-[0_0_20px_rgba(6,182,212,0.8)] group-hover:scale-110 transition-transform">
                        <Play className="w-5 h-5 fill-slate-950 ml-0.5" />
                      </div>
                    </div>
                    <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/80 text-[10px] font-mono text-cyan-300 border border-slate-700">
                      {video.duration}
                    </div>
                  </div>

                  {/* Body */}
                  <div className="p-4 space-y-2">
                    <h4 className="font-orbitron font-bold text-white text-sm leading-snug group-hover:text-cyan-200 transition-colors">
                      {video.title}
                    </h4>
                    <p className="text-xs text-slate-300 leading-relaxed line-clamp-3">
                      {video.description}
                    </p>
                  </div>
                </div>

                <div className="p-4 pt-0 border-t border-slate-800/80 mt-2 flex items-center justify-between text-[10px] font-mono text-slate-400">
                  <span className="truncate">{video.nasaRef}</span>
                  <span className="text-cyan-400 flex items-center gap-1 shrink-0 font-bold">
                    <span>Watch</span>
                    <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIDEO PLAYER MODAL                                                        */}
      {/* ========================================================================= */}
      {selectedVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 sm:p-6 animate-fade-in">
          <div className="relative w-full max-w-4xl bg-[#06183E] border border-cyan-500/50 rounded-2xl overflow-hidden shadow-[0_0_60px_rgba(6,182,212,0.35)] flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-4 bg-slate-950/90 border-b border-cyan-500/30 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider block font-bold">
                  {selectedVideo.nasaRef}
                </span>
                <h3 className="text-sm sm:text-base font-orbitron font-bold text-white truncate">
                  {selectedVideo.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedVideo(null)}
                className="w-8 h-8 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center border border-slate-700 transition cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Video Iframe Container */}
            <div className="relative w-full aspect-video bg-black">
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${selectedVideo.youtubeId}?autoplay=1&rel=0`}
                title={selectedVideo.title}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-950/80 border-t border-slate-800 text-xs text-slate-300 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <p className="line-clamp-2">{selectedVideo.description}</p>
              <a
                href={`https://www.youtube.com/watch?v=${selectedVideo.youtubeId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-cyan-400 hover:text-cyan-300 font-mono text-[11px] font-bold flex items-center gap-1 shrink-0"
              >
                <span>Open in YouTube</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
