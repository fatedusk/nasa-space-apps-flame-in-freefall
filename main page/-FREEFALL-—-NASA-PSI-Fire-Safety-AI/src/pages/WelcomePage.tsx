import React from 'react';
import {
  Flame,
  Gauge,
  Compass,
  Cpu,
  ArrowRight,
  ShieldAlert,
  Layers,
  Sparkles,
  BookOpen,
  Info,
  Radio,
} from 'lucide-react';
import { PAGES_CONFIG } from '../config/pages';
import { playCommandChirp, playTelemetryChirp } from '../utils/audioTelemetry';

interface WelcomePageProps {
  onNavigate: (path: string) => void;
  onOpenAssistant?: () => void;
}

export const WelcomePage: React.FC<WelcomePageProps> = ({ onNavigate }) => {
  const handleLaunchSimulator = () => {
    playCommandChirp();
    window.location.href = '/Nasa Hackathon/ignis-simulator.html';
  };

  const handleGoToVault = () => {
    playTelemetryChirp();
    onNavigate('/sentence-search');
  };

  const handleGoToSentenceSearch = () => {
    playCommandChirp();
    window.location.href = '/ignis-final.html';
  };

  const handleGoToHardware = () => {
    playTelemetryChirp();
    onNavigate('/hardware');
  };

  const handleGoToDataNetwork = () => {
    playCommandChirp();
    window.location.href = '/ignis.html';
  };

  const handleGoToAbout = () => {
    playCommandChirp();
    window.location.href = '/ignis-about.html';
  };

  const handleGoToBlastSim = () => {
    playCommandChirp();
    window.open('http://localhost:5173', '_blank');
  };

  return (
    <div className="relative min-h-screen bg-[#09040a] text-[#ffeef4] selection:bg-[#ff2e7e]/30 selection:text-[#ff7597] overflow-x-hidden">
      {/* Background Deep Space Starfield & Subtle Grid */}
      <div className="fixed inset-0 pointer-events-none opacity-40 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(255,46,126,0.18),rgba(255,255,255,0))]" />
      <div className="fixed inset-0 pointer-events-none opacity-10 bg-[linear-gradient(to_right,#250d1f_1px,transparent_1px),linear-gradient(to_bottom,#250d1f_1px,transparent_1px)] bg-[size:4rem_4rem]" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-20">
        {/* ========================================================================= */}
        {/* HERO SECTION                                                             */}
        {/* ========================================================================= */}
        <section className="text-center space-y-6 pt-4 sm:pt-8">
          {/* Mission Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#1d0b19]/80 border border-[#ff2e7e]/40 text-[#ff7597] text-xs font-mono font-bold tracking-wider uppercase shadow-[0_0_20px_rgba(255,46,126,0.25)]">
            <span className="w-2 h-2 rounded-full bg-[#ff2e7e] animate-pulse" />
            NASA Space Apps Challenge — Microgravity Combustion Informatics
          </div>

          {/* Main Title & Subtitle */}
          <div className="space-y-4">
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight font-orbitron bg-gradient-to-r from-white via-[#ffe4ee] to-[#ff7aa5] bg-clip-text text-transparent drop-shadow-[0_0_35px_rgba(255,46,126,0.35)]">
              IGNIS // PLATFORM
            </h1>
            <p className="text-lg sm:text-2xl font-mono text-[#ffb3cc] max-w-3xl mx-auto font-light leading-relaxed">
              Understanding Fire in Freefall — From Microgravity Physics to Deep Space Exploration Safety
            </p>
          </div>

          {/* Hero Explanatory Subtext */}
          <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Combustion behaves fundamentally differently without gravity. Buoyancy vanishes, convection stops,
            and flames form spherical diffusion envelopes. IGNIS combines authentic NASA flight
            data, simulators and calibrated in-browser intelligence to safeguard humanity beyond Earth.
          </p>

          {/* Primary Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <button
              onClick={handleLaunchSimulator}
              className="group relative px-8 py-4 rounded-2xl bg-gradient-to-r from-[#ff2e7e] via-[#ff4d88] to-[#ff7597] text-[#09040a] font-mono font-black text-sm uppercase tracking-wider shadow-[0_0_35px_rgba(255,46,126,0.55)] hover:shadow-[0_0_55px_rgba(255,46,126,0.85)] transition-all duration-300 hover:scale-[1.03] active:scale-[0.98] cursor-pointer flex items-center gap-3"
            >
              <Flame className="w-5 h-5 text-[#09040a] fill-[#09040a] animate-bounce" />
              <span>Launch Flame Simulator</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </button>

            <button
              onClick={handleGoToSentenceSearch}
              className="px-6 py-4 rounded-2xl bg-[#1d0b19]/90 hover:bg-[#250d1f] border border-[#ff2e7e]/40 text-[#ff94b8] hover:text-white font-mono font-bold text-sm tracking-wider transition-all duration-300 hover:border-[#ff2e7e] shadow-[0_0_20px_rgba(255,46,126,0.15)] cursor-pointer flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-[#ff2e7e]" />
              <span>PSI Sentence Search</span>
            </button>

            <button
              onClick={handleGoToHardware}
              className="px-6 py-4 rounded-2xl bg-[#1d0b19]/90 hover:bg-[#250d1f] border border-[#ff2e7e]/40 text-[#ff94b8] hover:text-white font-mono font-bold text-sm tracking-wider transition-all duration-300 hover:border-[#ff2e7e] shadow-[0_0_20px_rgba(255,46,126,0.15)] cursor-pointer flex items-center gap-2"
            >
              <Cpu className="w-4 h-4 text-[#ff2e7e]" />
              <span>Spaceflight Hardware Lineage</span>
            </button>
          </div>

          {/* Atmospheric Earth Limb Horizon Graphic */}
          <div className="relative pt-12 max-w-4xl mx-auto">
            <div className="h-1 bg-gradient-to-r from-transparent via-[#ff2e7e] to-transparent shadow-[0_0_25px_#ff2e7e]" />
            <div className="h-24 bg-gradient-to-b from-[#ff2e7e]/15 to-transparent blur-xl pointer-events-none" />
            <p className="text-[11px] font-mono text-[#ff7597]/90 uppercase tracking-widest -mt-16">
              ORBITAL FLIGHT REGIME: 400 KM ALTITUDE // ISS MICROGRAVITY (10⁻⁶ G)
            </p>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* ONE APPLICATION: UNIFIED NAVIGATION DIRECTORY                            */}
        {/* ========================================================================= */}
        <section className="max-w-3xl mx-auto">
          <div className="rounded-3xl bg-[#150812]/90 border border-[#ff2e7e]/40 p-6 sm:p-8 backdrop-blur-2xl shadow-[0_0_50px_rgba(255,46,126,0.15)] space-y-6">
            <div className="flex items-center justify-between border-b border-[#ff2e7e]/20 pb-4">
              <div className="space-y-1">
                <h3 className="text-lg sm:text-xl font-orbitron font-black text-white tracking-wide">
                  IGNIS // PLATFORM
                </h3>
                <p className="text-xs font-mono text-[#ff7597] font-bold flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#ff2e7e] animate-pulse" />
                  — Mission Navigation Drawer
                </p>
              </div>
              <span className="text-[10px] font-mono uppercase px-3 py-1 rounded-full bg-[#ff2e7e]/20 text-[#ff94b8] border border-[#ff2e7e]/40 font-bold tracking-wider flex items-center gap-1.5 shadow-[0_0_15px_rgba(255,46,126,0.3)]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#ff2e7e]" />
                Integrated Suite
              </span>
            </div>

            <div className="space-y-2">
              {PAGES_CONFIG.map((page) => {
                const Icon = page.icon;
                return (
                  <button
                    key={page.id}
                    onClick={() => {
                      playCommandChirp();
                      if (page.externalUrl) {
                        if (page.externalUrl.startsWith('http')) {
                          window.open(page.externalUrl, '_blank');
                        } else {
                          window.location.href = page.externalUrl;
                        }
                      } else {
                        onNavigate(page.path);
                      }
                    }}
                    className="w-full flex items-center justify-between p-3.5 sm:p-4 rounded-xl text-xs sm:text-sm font-mono font-bold transition-all cursor-pointer border border-[#ff2e7e]/20 bg-[#1d0b19]/60 hover:bg-[#250d1f] hover:border-[#ff2e7e]/60 text-slate-200 hover:text-white group"
                  >
                    <div className="flex items-center gap-3.5">
                      <span className="text-[#ff2e7e] font-mono font-bold">{page.badge}</span>
                      <Icon className="w-4 h-4 text-[#ff94b8]/70 group-hover:text-[#ff7597] transition-colors" />
                      <span>{page.navLabel}</span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-[#ff7597] group-hover:translate-x-1 transition-all" />
                  </button>
                );
              })}
            </div>

            <div className="pt-2 text-center border-t border-[#ff2e7e]/20">
              <p className="text-xs font-mono text-[#ff94b8] font-bold flex items-center justify-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#ff2e7e]" />
                Select any station module to access real-time informatics and simulations.
              </p>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* DEDICATED BLAST SIMULATION SECTION (SPACE STATION GUARDIAN)               */}
        {/* ========================================================================= */}
        <section className="rounded-3xl bg-gradient-to-r from-[#200717]/90 via-[#150812]/95 to-[#2a081e]/90 border border-[#ff2e7e]/50 p-6 sm:p-10 shadow-[0_0_50px_rgba(255,46,126,0.25)] flex flex-col md:flex-row items-center justify-between gap-8 backdrop-blur-2xl">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#ff2e7e]/20 border border-[#ff2e7e]/40 text-[#ff7597] text-xs font-mono font-bold uppercase tracking-wider">
              <Radio className="w-3.5 h-3.5 animate-pulse text-[#ff2e7e]" />
              Space Station Guardian Digital Twin
            </div>
            <h3 className="text-2xl sm:text-3xl font-orbitron font-black text-white">
              Blast & Decompression Dynamics Simulator
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Real-time multi-compartment physics simulation modeling structural hull breach, blast overpressure propagation,
              compartment pressure seal automation, and crew safe-haven evacuation corridors on an orbital space station.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-1 text-xs font-mono text-[#ff94b8]">
              <span className="bg-[#1d0b19] px-2.5 py-1 rounded-lg border border-[#ff2e7e]/30">Hull Stress Telemetry</span>
              <span className="bg-[#1d0b19] px-2.5 py-1 rounded-lg border border-[#ff2e7e]/30">Gas Dynamics</span>
              <span className="bg-[#1d0b19] px-2.5 py-1 rounded-lg border border-[#ff2e7e]/30">Automated Hatch Seals</span>
            </div>
          </div>

          <div className="shrink-0 flex flex-col items-center gap-2">
            <button
              onClick={handleGoToBlastSim}
              className="px-8 py-4 rounded-2xl bg-gradient-to-r from-[#ff2e7e] to-[#ff4d88] hover:from-[#ff4d88] hover:to-[#ff7597] text-[#09040a] font-mono font-black text-sm uppercase tracking-wider shadow-[0_0_35px_rgba(255,46,126,0.6)] hover:shadow-[0_0_50px_rgba(255,46,126,0.9)] transition-all duration-300 hover:scale-[1.03] active:scale-[0.98] cursor-pointer flex items-center gap-3"
            >
              <Radio className="w-5 h-5 text-[#09040a] animate-pulse" />
              <span>Launch Blast Simulation</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <span className="text-[11px] font-mono text-slate-400">Runs live on port 5173</span>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* THE PHYSICAL CHALLENGE: EARTH VS MICROGRAVITY                            */}
        {/* ========================================================================= */}
        <section className="space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-xs font-mono font-bold text-[#ff7597] uppercase tracking-widest flex items-center justify-center gap-2">
              <ShieldAlert className="w-4 h-4" /> The Microgravity Combustion Challenge
            </h2>
            <h3 className="text-2xl sm:text-3xl font-orbitron font-bold text-white">
              Why Fire in Freefall Defies Terrestrial Rules
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Earth Gravity Box */}
            <div className="bg-[#150812]/80 border border-slate-700/60 rounded-2xl p-6 sm:p-8 space-y-4 backdrop-blur-xl relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase tracking-wider font-bold text-amber-400 bg-amber-950/60 px-3 py-1 rounded-full border border-amber-500/30">
                  Earth (1.0 g) — Buoyancy-Dominated
                </span>
                <span className="text-2xl">🌍</span>
              </div>
              <h4 className="text-lg font-bold text-white font-mono">Teardrop Plumes & Forced Convection</h4>
              <p className="text-sm text-slate-300 leading-relaxed">
                On Earth, hot combustion gases are less dense than cold ambient air. Gravity pulls the heavier
                air down, forcing hot gas rapidly upward. This natural convection feeds fresh oxygen continuously
                into the reaction zone, shaping the familiar tall, yellow, turbulent teardrop flame.
              </p>
              <ul className="text-xs font-mono text-slate-400 space-y-2 pt-2 border-t border-slate-800">
                <li className="flex items-center gap-2">
                  <span className="text-amber-400 font-bold">✓</span> Strong buoyancy upward flow (~1–2 m/s)
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-amber-400 font-bold">✓</span> Incandescent soot particles glow yellow
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-amber-400 font-bold">✓</span> Rapid heat dissipation via convective exhaust
                </li>
              </ul>
            </div>

            {/* Microgravity Box */}
            <div className="bg-[#1d0b19]/90 border border-[#ff2e7e]/50 rounded-2xl p-6 sm:p-8 space-y-4 backdrop-blur-xl relative overflow-hidden shadow-[0_0_30px_rgba(255,46,126,0.18)]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase tracking-wider font-bold text-[#ff94b8] bg-[#ff2e7e]/20 px-3 py-1 rounded-full border border-[#ff2e7e]/50 shadow-[0_0_15px_rgba(255,46,126,0.3)]">
                  Microgravity (10⁻⁶ g) — Diffusion-Controlled
                </span>
                <span className="text-2xl">🛰️</span>
              </div>
              <h4 className="text-lg font-bold text-white font-mono">Spherical Envelopes & Silent Spread</h4>
              <p className="text-sm text-slate-300 leading-relaxed">
                In freefall, buoyancy vanishes. Without convection, oxygen can only reach the reaction zone
                through molecular diffusion. Flames become perfectly spherical, dim blue, and burn cooler.
                However, toxic combustion byproducts linger nearby, and subtle spacecraft ventilation breezes
                can sustain unexpected, low-temperature spread across habitat solids.
              </p>
              <ul className="text-xs font-mono text-[#ff94b8]/90 space-y-2 pt-2 border-t border-[#ff2e7e]/30">
                <li className="flex items-center gap-2">
                  <span className="text-[#ff2e7e] font-bold">★</span> Zero buoyant convection; molecular diffusion dominates
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-[#ff2e7e] font-bold">★</span> Dim blue spherical chemiluminescence (CH* & C₂*)
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-[#ff2e7e] font-bold">★</span> Combustion products envelope flame; radiative quenching risks
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* FOUR MISSION PILLARS (03 SWAPPED TO PSI SENTENCE SEARCH)                 */}
        {/* ========================================================================= */}
        <section className="space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-xs font-mono font-bold text-[#ff7597] uppercase tracking-widest flex items-center justify-center gap-2">
              <Layers className="w-4 h-4" /> Unified Mission Architecture
            </h2>
            <h3 className="text-2xl sm:text-3xl font-orbitron font-bold text-white">
              Integrated Capabilities of IGNIS // PLATFORM
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Pillar 1: Flame Simulator */}
            <div
              onClick={handleLaunchSimulator}
              className="bg-[#150812]/80 hover:bg-[#1d0b19] border border-[#ff2e7e]/30 hover:border-[#ff2e7e] rounded-2xl p-5 space-y-3 cursor-pointer transition-all duration-300 hover:-translate-y-1 shadow-[0_0_20px_rgba(255,46,126,0.1)] hover:shadow-[0_0_30px_rgba(255,46,126,0.3)] group"
            >
              <div className="w-10 h-10 rounded-xl bg-[#ff2e7e]/20 text-[#ff7597] flex items-center justify-center font-bold">
                <Flame className="w-5 h-5 text-[#ff2e7e] group-hover:scale-110 transition-transform" />
              </div>
              <h4 className="font-orbitron font-bold text-white text-base">3D Flame Simulator</h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Interactive real-time flame rendering with camera rotation, variable gravity regimes (Earth, Moon, Mars, ISS), and Saffire atmospheres.
              </p>
              <div className="pt-2 text-[11px] font-mono text-[#ff7597] flex items-center gap-1 group-hover:text-white">
                <span>Enter Simulator</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* Pillar 2: ML Predictor */}
            <div
              onClick={() => {
                playCommandChirp();
                onNavigate('/simulator?tab=prediction');
              }}
              className="bg-[#150812]/80 hover:bg-[#1d0b19] border border-[#ff2e7e]/30 hover:border-[#ff2e7e] rounded-2xl p-5 space-y-3 cursor-pointer transition-all duration-300 hover:-translate-y-1 shadow-[0_0_20px_rgba(255,46,126,0.1)] hover:shadow-[0_0_30px_rgba(255,46,126,0.3)] group"
            >
              <div className="w-10 h-10 rounded-xl bg-[#ff2e7e]/20 text-[#ff7597] flex items-center justify-center font-bold">
                <Gauge className="w-5 h-5 text-[#ff2e7e] group-hover:scale-110 transition-transform" />
              </div>
              <h4 className="font-orbitron font-bold text-white text-base">ML Predictor & 2D Map</h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                In-browser flammability predictor calibrated on 48 verified NASA PSI test runs with interactive 2D phase space mapping.
              </p>
              <div className="pt-2 text-[11px] font-mono text-[#ff7597] flex items-center gap-1 group-hover:text-white">
                <span>Run Prediction</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* Pillar 3: PSI Sentence Search (Opens ignis-final) */}
            <div
              onClick={handleGoToSentenceSearch}
              className="bg-[#150812]/80 hover:bg-[#1d0b19] border border-[#ff2e7e]/30 hover:border-[#ff2e7e] rounded-2xl p-5 space-y-3 cursor-pointer transition-all duration-300 hover:-translate-y-1 shadow-[0_0_20px_rgba(255,46,126,0.1)] hover:shadow-[0_0_30px_rgba(255,46,126,0.3)] group"
            >
              <div className="w-10 h-10 rounded-xl bg-[#ff2e7e]/20 text-[#ff7597] flex items-center justify-center font-bold">
                <Sparkles className="w-5 h-5 text-[#ff2e7e] group-hover:scale-110 transition-transform" />
              </div>
              <h4 className="font-orbitron font-bold text-white text-base">PSI Sentence Search</h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Sentence-level query engine extracting exact experimental observations and extinction thresholds from NASA PSI reports.
              </p>
              <div className="pt-2 text-[11px] font-mono text-[#ff7597] flex items-center gap-1 group-hover:text-white">
                <span>Explore PSI Records</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* Pillar 4: Hardware Explorer */}
            <div
              onClick={handleGoToHardware}
              className="bg-[#150812]/80 hover:bg-[#1d0b19] border border-[#ff2e7e]/30 hover:border-[#ff2e7e] rounded-2xl p-5 space-y-3 cursor-pointer transition-all duration-300 hover:-translate-y-1 shadow-[0_0_20px_rgba(255,46,126,0.1)] hover:shadow-[0_0_30px_rgba(255,46,126,0.3)] group"
            >
              <div className="w-10 h-10 rounded-xl bg-[#ff2e7e]/20 text-[#ff7597] flex items-center justify-center font-bold">
                <Cpu className="w-5 h-5 text-[#ff2e7e] group-hover:scale-110 transition-transform" />
              </div>
              <h4 className="font-orbitron font-bold text-white text-base">Hardware & Spinoffs</h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Spaceflight hardware lineage (CIR, Saffire duct, MOXIE, Apollo PLSS) and documented terrestrial spinoff safety systems.
              </p>
              <div className="pt-2 text-[11px] font-mono text-[#ff7597] flex items-center gap-1 group-hover:text-white">
                <span>Inspect Lineage</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* INTERACTIVE IGNIS TIMELINE & DEEP RESEARCH DOSSIERS                       */}
        {/* ========================================================================= */}
        <section className="space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-xs font-mono font-bold text-[#ff7597] uppercase tracking-widest flex items-center justify-center gap-2">
              <Sparkles className="w-4 h-4" /> NASA Space Apps Deep Resources
            </h2>
            <h3 className="text-2xl sm:text-3xl font-orbitron font-bold text-white">
              Interactive Mission Network & Research Dossiers
            </h3>
            <p className="text-xs sm:text-sm text-[#ffb3cc] max-w-2xl mx-auto font-mono">
              Explore the original IGNIS orbital network graph, illustrated combustion physics brief, research archives, and team information.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Resource 1: Interactive Flight Network */}
            <div className="bg-gradient-to-b from-[#1d0b19]/90 to-[#150812]/90 border border-[#ff2e7e]/40 hover:border-[#ff2e7e] rounded-3xl p-6 space-y-4 shadow-[0_0_30px_rgba(255,46,126,0.15)] hover:shadow-[0_0_40px_rgba(255,46,126,0.3)] transition-all duration-300 flex flex-col justify-between group">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-[#ff2e7e]/20 text-[#ff7597] flex items-center justify-center font-bold">
                    <Compass className="w-5 h-5 text-[#ff2e7e] group-hover:rotate-45 transition-transform duration-500" />
                  </div>
                  <span className="text-[10px] font-mono text-[#ff94b8] uppercase px-2.5 py-1 rounded-full bg-[#ff2e7e]/20 border border-[#ff2e7e]/40 font-bold">
                    Interactive
                  </span>
                </div>
                <h4 className="font-orbitron font-bold text-white text-lg">
                  IGNIS Data Network
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Interactive orbital node graph connecting historical NASA microgravity combustion investigations from Skylab to modern Saffire flights.
                </p>
              </div>

              <div className="pt-4 border-t border-[#ff2e7e]/20">
                <button
                  onClick={handleGoToDataNetwork}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#ff2e7e]/20 hover:bg-[#ff2e7e]/30 border border-[#ff2e7e]/50 text-[#ff94b8] hover:text-white font-mono font-bold text-xs flex items-center justify-center gap-2 transition shadow cursor-pointer"
                >
                  <span>Launch Network Graph</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#ff2e7e]" />
                </button>
              </div>
            </div>

            {/* Resource 2: Illustrated Scientific Dossier */}
            <div className="bg-gradient-to-b from-[#1d0b19]/90 to-[#150812]/90 border border-[#ff2e7e]/40 hover:border-[#ff2e7e] rounded-3xl p-6 space-y-4 shadow-[0_0_30px_rgba(255,46,126,0.15)] hover:shadow-[0_0_40px_rgba(255,46,126,0.3)] transition-all duration-300 flex flex-col justify-between group">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center font-bold">
                    <BookOpen className="w-5 h-5 text-amber-400 group-hover:scale-110 transition-transform" />
                  </div>
                  <span className="text-[10px] font-mono text-amber-300 uppercase px-2.5 py-1 rounded-full bg-amber-950/80 border border-amber-500/40 font-bold">
                    Illustrated
                  </span>
                </div>
                <h4 className="font-orbitron font-bold text-white text-lg">
                  Combustion Physics Brief
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Comprehensive illustrated scientific explanation of microgravity combustion physics, buoyancy suppression, and spherical flame envelopes.
                </p>
              </div>

              <div className="pt-4 border-t border-[#ff2e7e]/20">
                <button
                  onClick={() => {
                    playCommandChirp();
                    onNavigate('/science');
                  }}
                  className="w-full py-2.5 px-4 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/50 text-amber-300 hover:text-white font-mono font-bold text-xs flex items-center justify-center gap-2 transition shadow cursor-pointer"
                >
                  <span>Read Science Brief</span>
                  <ArrowRight className="w-3.5 h-3.5 text-amber-400" />
                </button>
              </div>
            </div>

            {/* Resource 3: NASA PSI Research Vault (07) */}
            <div className="bg-gradient-to-b from-[#1d0b19]/90 to-[#150812]/90 border border-[#ff2e7e]/40 hover:border-[#ff2e7e] rounded-3xl p-6 space-y-4 shadow-[0_0_30px_rgba(255,46,126,0.15)] hover:shadow-[0_0_40px_rgba(255,46,126,0.3)] transition-all duration-300 flex flex-col justify-between group">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-[#ff2e7e]/20 text-[#ff7597] flex items-center justify-center font-bold">
                    <BookOpen className="w-5 h-5 text-[#ff2e7e] group-hover:scale-110 transition-transform" />
                  </div>
                  <span className="text-[10px] font-mono text-[#ff94b8] uppercase px-2.5 py-1 rounded-full bg-[#ff2e7e]/20 border border-[#ff2e7e]/40 font-bold">
                    Flight Records
                  </span>
                </div>
                <h4 className="font-orbitron font-bold text-white text-lg">
                  PSI & NTRS Vault
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  21 curated NASA flight investigations, dual-bar accession search, and direct NTRS citations across BASS, Saffire, and FLEX experiments.
                </p>
              </div>

              <div className="pt-4 border-t border-[#ff2e7e]/20">
                <button
                  onClick={handleGoToVault}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#ff2e7e]/20 hover:bg-[#ff2e7e]/30 border border-[#ff2e7e]/50 text-[#ff94b8] hover:text-white font-mono font-bold text-xs flex items-center justify-center gap-2 transition shadow cursor-pointer"
                >
                  <span>Open Sentence Search</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#ff2e7e]" />
                </button>
              </div>
            </div>

            {/* Resource 4: About Us */}
            <div className="bg-gradient-to-b from-[#1d0b19]/90 to-[#150812]/90 border border-[#ff2e7e]/40 hover:border-[#ff2e7e] rounded-3xl p-6 space-y-4 shadow-[0_0_30px_rgba(255,46,126,0.15)] hover:shadow-[0_0_40px_rgba(255,46,126,0.3)] transition-all duration-300 flex flex-col justify-between group">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-300 flex items-center justify-center font-bold">
                    <Info className="w-5 h-5 text-purple-400 group-hover:scale-110 transition-transform" />
                  </div>
                  <span className="text-[10px] font-mono text-purple-300 uppercase px-2.5 py-1 rounded-full bg-purple-950/80 border border-purple-500/40 font-bold">
                    Team & Challenge
                  </span>
                </div>
                <h4 className="font-orbitron font-bold text-white text-lg">
                  About Us
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Discover the team, engineering methodology, mission origins, and research citations powering the IGNIS aerospace fire safety framework.
                </p>
              </div>

              <div className="pt-4 border-t border-[#ff2e7e]/20">
                <button
                  onClick={handleGoToAbout}
                  className="w-full py-2.5 px-4 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/50 text-purple-300 hover:text-white font-mono font-bold text-xs flex items-center justify-center gap-2 transition shadow cursor-pointer"
                >
                  <span>About Our Mission</span>
                  <ArrowRight className="w-3.5 h-3.5 text-purple-400" />
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};