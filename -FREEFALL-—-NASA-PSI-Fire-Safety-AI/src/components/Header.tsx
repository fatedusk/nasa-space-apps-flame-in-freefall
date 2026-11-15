import React, { useState, useEffect } from 'react';
import { Flame, BookOpen, Layers, Activity, Sliders, Cpu } from 'lucide-react';
import { playTelemetryChirp, playCommandChirp } from '../utils/audioTelemetry';

interface HeaderProps {
  activeTab: 'predictor' | 'vault' | 'hardware';
  onSelectTab: (tab: 'predictor' | 'vault' | 'hardware') => void;
  onOpenAssistant: () => void;
  onOpenApiKeyModal: () => void;
  hasCustomKey?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onSelectTab,
  onOpenAssistant,
  onOpenApiKeyModal,
  hasCustomKey,
}) => {
  const [utcTime, setUtcTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setUtcTime(now.toUTCString().slice(17, 25) + ' UTC');
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="sticky top-0 z-40 bg-black/90 backdrop-blur-3xl border-b border-cyan-500/30 px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3 flex flex-wrap lg:flex-nowrap items-center justify-between gap-3 shadow-[0_10px_40px_rgba(0,0,0,0.95)]">
      {/* Brand & Mission Identification */}
      <div className="flex items-center gap-3 min-w-0 shrink-0">
        {/* Animated Dual-Ring Mission Beacon */}
        <div className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 via-sky-400 to-cyan-300 flex items-center justify-center text-slate-950 font-black shadow-[0_0_25px_rgba(6,182,212,0.6)] shrink-0">
          <div className="absolute inset-0 rounded-2xl border border-cyan-300/60 animate-ping opacity-25"></div>
          <Flame className="w-5 h-5 text-slate-950 fill-slate-950" />
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-sm sm:text-base font-black tracking-wider text-white font-mono flex items-center gap-1.5 shrink-0">
              <span>FLAME // FREEFALL</span>
            </h1>
            <span className="text-[9px] font-mono uppercase px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 font-bold tracking-wider flex items-center gap-1 shadow-[0_0_10px_rgba(6,182,212,0.3)] shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
              NASA Space Apps
            </span>
            {utcTime && (
              <span className="hidden xl:inline-flex items-center gap-1 text-[10px] font-mono text-slate-400 bg-slate-950/80 px-2 py-0.5 rounded border border-slate-800 shrink-0">
                <Activity className="w-2.5 h-2.5 text-cyan-400" />
                {utcTime}
              </span>
            )}
          </div>
          <p className="text-[10px] sm:text-[11px] font-mono text-slate-400 leading-tight truncate hidden xs:block">
            Super Intelligence (SI) Fire Safety Platform · Microgravity Combustion Informatics
          </p>
        </div>
      </div>

      {/* Mission Control 3 Main Navigation Tabs */}
      <nav
        className="flex items-center bg-[#050b14]/90 p-1 rounded-xl border border-cyan-500/30 shadow-[0_0_20px_rgba(6,182,212,0.15)] overflow-x-auto max-w-full custom-scrollbar order-3 lg:order-2 shrink min-w-0"
        aria-label="Mission Modules"
      >
        {/* Module 1: ML Predictor & Phase Map */}
        <button
          onClick={() => {
            onSelectTab('predictor');
            playTelemetryChirp();
          }}
          className={`flex items-center gap-2 px-3 sm:px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
            activeTab === 'predictor'
              ? 'bg-gradient-to-r from-cyan-400 to-sky-400 text-slate-950 shadow-[0_0_15px_rgba(6,182,212,0.5)]'
              : 'text-slate-400 hover:text-cyan-200 hover:bg-slate-900/60'
          }`}
          title="Module 01: Machine Learning Flammability Predictor & 3D Flame Canvas"
        >
          <Layers className="w-3.5 h-3.5 shrink-0" />
          <span>ML Predictor &amp; Phase Map</span>
        </button>

        {/* Module 2: NASA PSI & NTRS Vault */}
        <button
          onClick={() => {
            onSelectTab('vault');
            playTelemetryChirp();
          }}
          className={`flex items-center gap-2 px-3 sm:px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
            activeTab === 'vault'
              ? 'bg-gradient-to-r from-cyan-400 to-sky-400 text-slate-950 shadow-[0_0_15px_rgba(6,182,212,0.5)]'
              : 'text-slate-400 hover:text-cyan-200 hover:bg-slate-900/60'
          }`}
          title="Module 02: NASA Physical Sciences Informatics & Technical Reports Vault"
        >
          <BookOpen className="w-3.5 h-3.5 shrink-0" />
          <span>NASA PSI &amp; NTRS Vault</span>
        </button>

        {/* Module 3: Hardware & Applications */}
        <button
          onClick={() => {
            onSelectTab('hardware');
            playTelemetryChirp();
          }}
          className={`flex items-center gap-2 px-3 sm:px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
            activeTab === 'hardware'
              ? 'bg-gradient-to-r from-cyan-400 to-sky-400 text-slate-950 shadow-[0_0_15px_rgba(6,182,212,0.5)]'
              : 'text-slate-400 hover:text-cyan-200 hover:bg-slate-900/60'
          }`}
          title="Module 03: NASA Hardware Explorer, Photography & Earth Applications"
        >
          <Cpu className="w-3.5 h-3.5 shrink-0" />
          <span>Hardware &amp; Applications</span>
        </button>
      </nav>

      {/* Action Controls: AI Settings & Aether-SI */}
      <div className="flex items-center gap-2 shrink-0 order-2 lg:order-3">
        {/* AI Settings Trigger */}
        <button
          onClick={() => {
            onOpenApiKeyModal();
            playCommandChirp();
          }}
          className="flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-xl bg-slate-950/90 hover:bg-slate-900 border border-slate-800 hover:border-cyan-500/50 text-slate-300 hover:text-white text-xs font-mono font-bold transition shadow cursor-pointer shrink-0"
          title="Configure AI security & server cache"
        >
          <Sliders className="w-3 h-3 text-cyan-400" />
          <span className="hidden sm:inline">AI Settings</span>
          <span
            className={`w-2 h-2 rounded-full inline-block ${
              hasCustomKey ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]' : 'bg-slate-600'
            }`}
          />
        </button>

        {/* Aether-SI Companion Trigger */}
        <button
          onClick={() => {
            onOpenAssistant();
            playTelemetryChirp();
          }}
          className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-2 rounded-xl bg-gradient-to-r from-cyan-500/20 via-[#061e33] to-[#030f1c] hover:border-cyan-400 border border-cyan-500/50 text-cyan-300 text-xs font-mono font-bold shadow-[0_0_20px_rgba(6,182,212,0.25)] hover:shadow-[0_0_30px_rgba(6,182,212,0.45)] transition cursor-pointer shrink-0"
          title="Toggle Aether-SI Scientific Companion (Ctrl+K)"
        >
          <span className="text-sm">🛰️</span>
          <span>Aether-SI</span>
          <span className="hidden md:inline-block text-[9px] px-1.5 py-0.2 rounded bg-cyan-400/20 text-cyan-300 border border-cyan-400/40 font-mono font-bold">
            Ctrl+K
          </span>
        </button>
      </div>
    </header>
  );
};
