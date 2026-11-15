import React, { useState } from 'react';
import {
  BookOpen,
  Flame,
  ShieldAlert,
  ArrowRight,
  ExternalLink,
  Layers,
  Sparkles,
  Compass,
  Cpu,
  ChevronDown,
  Rocket,
} from 'lucide-react';
import { playCommandChirp, playTelemetryChirp } from '../utils/audioTelemetry';

interface ScienceBriefPageProps {
  onNavigate?: (path: string) => void;
  onOpenAssistant?: () => void;
}

export const ScienceBriefPage: React.FC<ScienceBriefPageProps> = ({ onNavigate }) => {
  const [activeSection, setActiveSection] = useState<'intro' | 'physics' | 'experiments' | 'safety' | 'sources'>('intro');

  const scrollToSection = (id: string) => {
    playTelemetryChirp();
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-[#07152B]/95 via-[#06183E]/90 to-[#030814]/95 border border-[#35D6FF]/30 p-6 backdrop-blur-2xl shadow-[0_0_40px_rgba(53,214,255,0.12)] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-cyan-500/20 text-[#35D6FF] border border-[#35D6FF]/40 font-bold">
              IGNIS Scientific Brief
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold">
              NASA Physical Sciences Informatics
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black font-orbitron text-white tracking-wide">
            COMBUSTION SCIENCE BRIEF
          </h1>
          <p className="text-xs sm:text-sm text-[#8DB3DE] font-mono leading-relaxed max-w-2xl">
            Fire, studied at its source — Why microgravity research unlocks the fundamental physics of flame spread, soot dynamics, and spacecraft survival.
          </p>
        </div>

        <button
          onClick={() => {
            playCommandChirp();
            if (onNavigate) onNavigate('/simulator');
            else window.location.hash = '#/simulator';
          }}
          className="px-5 py-3 rounded-xl bg-gradient-to-r from-cyan-400 to-sky-400 text-slate-950 font-mono font-black text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(6,182,212,0.4)] hover:brightness-110 transition flex items-center gap-2 cursor-pointer shrink-0 self-start md:self-auto"
        >
          <Flame className="w-4 h-4 fill-slate-950" />
          <span>Launch Simulator ➔</span>
        </button>
      </div>

      {/* Sticky Table of Contents Quick Pills */}
      <div className="sticky top-16 z-30 bg-[#030814]/90 backdrop-blur-md border border-cyan-500/30 rounded-xl p-1.5 flex items-center gap-2 overflow-x-auto no-scrollbar shadow-lg">
        {[
          { id: 'intro', label: '1. The Source' },
          { id: 'physics', label: '2. Earth vs Freefall' },
          { id: 'experiments', label: '3. NASA Experiments' },
          { id: 'safety', label: '4. Earth & Space Safety' },
          { id: 'sources', label: '5. NASA References' },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => scrollToSection(item.id)}
            className="px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold text-slate-300 hover:text-cyan-300 hover:bg-slate-900 transition whitespace-nowrap cursor-pointer"
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* ========================================================================= */}
      {/* SECTION 1: THE SOURCE                                                    */}
      {/* ========================================================================= */}
      <section id="intro" className="rounded-2xl border border-cyan-500/30 bg-[#06183E]/70 p-6 sm:p-8 space-y-6 backdrop-blur-xl">
        <div className="space-y-2">
          <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-widest flex items-center gap-2">
            <Sparkles className="w-4 h-4" /> 1.0 The Fundamental Problem
          </span>
          <h2 className="text-xl sm:text-2xl font-bold font-orbitron text-white">
            Fire, Studied at Its Source
          </h2>
        </div>

        <div className="text-sm text-slate-200 leading-relaxed space-y-4 font-sans">
          <p>
            Combustion on Earth is a violent, coupled dance between fluid dynamics, chemical kinetics, and thermal buoyancy.
            Because hot exhaust gases expand and become less dense than surrounding air, gravity continuously pulls cold air downward,
            thrusting hot gas upward at 1 to 2 meters per second.
          </p>
          <p>
            This buoyancy-induced upward draft creates the familiar teardrop candle flame, generating turbulent shear, twisting flame fronts,
            and dragging unburnt soot particles into incandescent yellow plumes. On Earth, this convective storm masks the true underlying chemistry
            and transport physics of flame propagation.
          </p>
        </div>

        {/* Visual Teardrop vs Sphere Graphic */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          <div className="bg-[#030814]/90 border border-amber-500/30 rounded-xl p-5 space-y-3 text-center">
            <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider block">
              Earth Convective Flame (1.0 g)
            </span>
            <div className="h-44 flex items-center justify-center">
              <svg className="w-36 h-40" viewBox="0 0 100 120">
                {/* Candle Body */}
                <rect x="42" y="75" width="16" height="40" fill="#e2e8f0" rx="2" />
                <line x1="50" y1="75" x2="50" y2="65" stroke="#475569" strokeWidth="2" />
                {/* Outer Yellow Plume */}
                <path d="M50 15 C35 45 35 65 50 65 C65 65 65 45 50 15 Z" fill="#f59e0b" opacity="0.9" filter="drop-shadow(0 0 8px #f59e0b)" />
                {/* Inner Orange Core */}
                <path d="M50 25 C40 45 40 65 50 65 C60 65 60 45 50 25 Z" fill="#ef4444" opacity="0.8" />
                {/* Blue Base */}
                <ellipse cx="50" cy="63" rx="8" ry="4" fill="#38bdf8" opacity="0.9" />
              </svg>
            </div>
            <p className="text-xs font-mono text-slate-400 leading-relaxed">
              Buoyancy pulls cold O₂ up, generating tall, yellow, incandescent teardrop shape (~1400°C).
            </p>
          </div>

          <div className="bg-[#030814]/90 border border-cyan-500/40 rounded-xl p-5 space-y-3 text-center shadow-[0_0_25px_rgba(6,182,212,0.15)]">
            <span className="text-xs font-mono font-bold text-cyan-300 uppercase tracking-wider block">
              Microgravity Diffusion Flame (10⁻⁶ g)
            </span>
            <div className="h-44 flex items-center justify-center">
              <svg className="w-36 h-40" viewBox="0 0 100 120">
                {/* Candle Body */}
                <rect x="42" y="75" width="16" height="40" fill="#e2e8f0" rx="2" />
                <line x1="50" y1="75" x2="50" y2="65" stroke="#475569" strokeWidth="2" />
                {/* Spherical Blue Glow */}
                <circle cx="50" cy="55" r="26" fill="url(#blueSphereGrad)" opacity="0.85" filter="drop-shadow(0 0 12px #38bdf8)" />
                {/* Inner Quenched Core */}
                <circle cx="50" cy="58" r="14" fill="#0369a1" opacity="0.5" />
                <defs>
                  <radialGradient id="blueSphereGrad" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#0284c7" stopOpacity="0.2" />
                    <stop offset="70%" stopColor="#38bdf8" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#a5f3fc" stopOpacity="1" />
                  </radialGradient>
                </defs>
              </svg>
            </div>
            <p className="text-xs font-mono text-cyan-300/90 leading-relaxed">
              Zero buoyant convection. Pure spherical molecular diffusion envelope, dim blue chemiluminescence (~900°C).
            </p>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 2: WHY TEST FIRE IN FREEFALL?                                    */}
      {/* ========================================================================= */}
      <section id="physics" className="rounded-2xl border border-cyan-500/30 bg-[#06183E]/70 p-6 sm:p-8 space-y-6 backdrop-blur-xl">
        <div className="space-y-2">
          <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-widest flex items-center gap-2">
            <Layers className="w-4 h-4" /> 2.0 Microgravity Physics
          </span>
          <h2 className="text-xl sm:text-2xl font-bold font-orbitron text-white">
            What Changes in Microgravity?
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-[#030814]/90 border border-slate-800 rounded-xl p-5 space-y-3">
            <div className="w-9 h-9 rounded-lg bg-cyan-500/20 text-cyan-300 flex items-center justify-center font-bold">
              1
            </div>
            <h3 className="font-orbitron font-bold text-white text-sm">Elimination of Convection</h3>
            <p className="text-xs text-slate-300 leading-relaxed font-sans">
              Without gravity, Archimedean buoyancy ceases. Hot gas does not rise, cold air does not rush in.
              Oxygen transport to the flame zone is governed solely by Fickian molecular diffusion.
            </p>
          </div>

          <div className="bg-[#030814]/90 border border-slate-800 rounded-xl p-5 space-y-3">
            <div className="w-9 h-9 rounded-lg bg-sky-500/20 text-sky-300 flex items-center justify-center font-bold">
              2
            </div>
            <h3 className="font-orbitron font-bold text-white text-sm">Stefan Flow & Product Blanket</h3>
            <p className="text-xs text-slate-300 leading-relaxed font-sans">
              As fuel vaporizes, outgoing mass flux (Stefan flow) repels oncoming oxygen. Combustion products (CO₂ and H₂O)
              envelope the reaction zone, creating severe radiative soot quenching.
            </p>
          </div>

          <div className="bg-[#030814]/90 border border-slate-800 rounded-xl p-5 space-y-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-500/20 text-indigo-300 flex items-center justify-center font-bold">
              3
            </div>
            <h3 className="font-orbitron font-bold text-white text-sm">Cool Flames & Low LOI</h3>
            <p className="text-xs text-slate-300 leading-relaxed font-sans">
              Flames burn at significantly lower temperatures (500–800°C), often invisible to the naked human eye.
              Subtle spacecraft air currents (0.5–10 cm/s) can sustain spread even in reduced oxygen environments.
            </p>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 3: THE REAL NASA EXPERIMENTS                                      */}
      {/* ========================================================================= */}
      <section id="experiments" className="rounded-2xl border border-cyan-500/30 bg-[#06183E]/70 p-6 sm:p-8 space-y-6 backdrop-blur-xl">
        <div className="space-y-2">
          <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-widest flex items-center gap-2">
            <Compass className="w-4 h-4" /> 3.0 Spaceflight Lineage
          </span>
          <h2 className="text-xl sm:text-2xl font-bold font-orbitron text-white">
            The Historic NASA Investigations
          </h2>
        </div>

        <div className="space-y-4">
          {[
            {
              title: 'Saffire (Spacecraft Fire Safety Experiments I–VI)',
              carrier: 'Northrop Grumman Cygnus Resupply Vehicle (Post-ISS Departure)',
              description:
                'Conducted inside uncrewed cargo vehicles to safely burn large-scale solid fabrics (0.4m × 1.0m) and PMMA slabs under realistic depressurized spacecraft atmospheres (e.g. 34% O₂ at 8.2 psia).',
              impact:
                'Proved that large fabric fires burn steadily in low forced airflow, disproving assumptions that terrestrial NASA-STD-6001B tests provide universal safety margins.',
            },
            {
              title: 'BASS & BASS-II (Burning and Suppression of Solids)',
              carrier: 'ISS Microgravity Science Glovebox (MSG)',
              description:
                'Examined solid polymer rods, flat SIBAL cotton-fiberglass sheets, and PMMA samples across concurrent and opposed forced airflow speeds (0 to 35 cm/s).',
              impact:
                'Mapped the complete Limiting Oxygen Index (LOI) curve as a function of duct flow velocity, defining the safe ventilation thresholds for crew cabins.',
            },
            {
              title: 'FLEX & FLEX-2 (Flame Extinguishment Experiments)',
              carrier: 'ISS Combustion Integrated Rack (CIR)',
              description:
                'Investigated isolated liquid alkane fuel droplets (heptane, decane) burning in quiescent microgravity, measuring droplet vaporization regression rate (d²-law).',
              impact:
                'Discovered sustained "cool flame" burning where alkane droplets continued low-temperature oxidation without visible hot flame emissions.',
            },
          ].map((exp, idx) => (
            <div key={idx} className="bg-[#030814]/80 border border-slate-800 rounded-xl p-5 space-y-2">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <h4 className="font-orbitron font-bold text-white text-sm">{exp.title}</h4>
                <span className="text-[10px] font-mono text-cyan-300 px-2 py-0.5 rounded bg-cyan-950 border border-cyan-500/30">
                  {exp.carrier}
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed font-sans">{exp.description}</p>
              <div className="pt-2 text-xs font-mono text-slate-400 border-t border-slate-900">
                <span className="text-cyan-400 font-bold">Key Discovery: </span>
                {exp.impact}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 4: TERRESTRIAL & SPACE SAFETY APPLICATIONS                       */}
      {/* ========================================================================= */}
      <section id="safety" className="rounded-2xl border border-cyan-500/30 bg-[#06183E]/70 p-6 sm:p-8 space-y-6 backdrop-blur-xl">
        <div className="space-y-2">
          <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-widest flex items-center gap-2">
            <Cpu className="w-4 h-4" /> 4.0 Life Safety & Engineering
          </span>
          <h2 className="text-xl sm:text-2xl font-bold font-orbitron text-white">
            Applications for Spaceflight and Earth
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="bg-[#030814]/90 border border-slate-800 rounded-xl p-5 space-y-3">
            <h4 className="font-orbitron font-bold text-cyan-300 text-sm flex items-center gap-2">
              <Rocket className="w-4 h-4 text-cyan-400" /> Spacecraft Habitat Fire Protocol
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed font-sans">
              Unlike on Earth where closing doors blocks convective oxygen draft, microgravity fire suppression
              demands immediate duct fan shutoff to halt forced airflow, followed by concentrated CO₂ or nitrogen inerting
              to accelerate radiative extinction.
            </p>
          </div>

          <div className="bg-[#030814]/90 border border-slate-800 rounded-xl p-5 space-y-3">
            <h4 className="font-orbitron font-bold text-amber-300 text-sm flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-400" /> Terrestrial Aviation & Mine Safety
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed font-sans">
              Understanding low-temperature pyrolysis without buoyancy allows better modeling of aircraft cabin insulation
              flammability, commercial lithium battery thermal runaway in tight enclosures, and soot reduction in clean internal combustion engines.
            </p>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 5: NASA REFERENCES                                               */}
      {/* ========================================================================= */}
      <section id="sources" className="rounded-2xl border border-cyan-500/30 bg-[#06183E]/70 p-6 sm:p-8 space-y-4 backdrop-blur-xl">
        <h2 className="text-lg font-bold font-orbitron text-white flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-cyan-400" /> Verified NASA Documentation & Citations
        </h2>
        <div className="space-y-2 text-xs font-mono">
          {[
            {
              title: 'NASA Glenn Research Center — Spacecraft Fire Safety Research (Saffire)',
              url: 'https://www.nasa.gov/centers-and-facilities/glenn/flame-burns-out-on-nasas-long-running-spacecraft-fire-experiment/',
            },
            {
              title: 'NASA Physical Sciences Informatics (PSI) Open Science Repository',
              url: 'https://psi.nasa.gov',
            },
            {
              title: 'ACME & CIR Facility Operations — NASA Glenn Research Center',
              url: 'https://gipoc.grc.nasa.gov/wp/fcf-cir/acme/',
            },
          ].map((item, idx) => (
            <a
              key={idx}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-3 rounded-xl bg-slate-950/80 hover:bg-slate-900 border border-slate-800 text-cyan-300 transition group"
            >
              <span className="truncate">{item.title}</span>
              <ExternalLink className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform shrink-0" />
            </a>
          ))}
        </div>
      </section>

      {/* Bottom Launch Banner */}
      <div className="bg-gradient-to-r from-cyan-950/40 via-[#06183E]/90 to-[#030814] border border-cyan-500/40 rounded-3xl p-6 sm:p-8 text-center space-y-4 shadow-[0_0_35px_rgba(6,182,212,0.2)]">
        <h3 className="text-xl sm:text-2xl font-bold font-orbitron text-white">
          Experience the Physics in the Interactive 3D Chamber
        </h3>
        <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto">
          Test variable gravity, cut ventilation airflow, and inspect real-time GBDT machine learning predictions.
        </p>
        <button
          onClick={() => {
            playCommandChirp();
            if (onNavigate) onNavigate('/simulator');
            else window.location.hash = '#/simulator';
          }}
          className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-400 to-sky-400 text-slate-950 font-mono font-black text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(6,182,212,0.4)] hover:brightness-110 transition inline-flex items-center gap-2 cursor-pointer"
        >
          <Flame className="w-4 h-4 fill-slate-950" />
          <span>Launch Flame Simulator Hub ➔</span>
        </button>
      </div>
    </div>
  );
};
