import React, { useState, useRef, useEffect } from 'react';
import {
  Compass,
  Flame,
  Search,
  ExternalLink,
  Sparkles,
  Layers,
  ChevronRight,
  X,
  Info,
  Calendar,
  Rocket,
  Activity,
  ArrowRight,
} from 'lucide-react';
import { IGNIS_NETWORK_DATA } from '../data/ignisNetworkData';
import { playCommandChirp, playTelemetryChirp } from '../utils/audioTelemetry';

interface NetworkPageProps {
  onNavigate?: (path: string) => void;
  onOpenAssistant?: () => void;
}

interface Experiment {
  id: string;
  y: string;
  n: string;
  t: string;
  w: string;
  when: string;
  psi: string | null;
  sm: string;
  f: Array<[string, string, string]>;
  ps: string | null;
  ch: string | null;
  src: Array<{ l: string; u: string }>;
  med: any[];
}

export const NetworkPage: React.FC<NetworkPageProps> = ({ onNavigate }) => {
  const experiments: Experiment[] = (IGNIS_NETWORK_DATA as any).E || [];
  const [selectedId, setSelectedId] = useState<string>(experiments[0]?.id || 'saffire');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'canvas' | 'table'>('canvas');
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const selectedExperiment = experiments.find((e) => e.id === selectedId) || experiments[0];

  const filteredExperiments = experiments.filter((e) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      e.n.toLowerCase().includes(q) ||
      e.t.toLowerCase().includes(q) ||
      e.w.toLowerCase().includes(q) ||
      e.y.includes(q) ||
      e.sm.toLowerCase().includes(q)
    );
  });

  // Canvas animation for orbital nodes
  useEffect(() => {
    if (activeTab !== 'canvas') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let angle = 0;

    const resize = () => {
      canvas.width = canvas.parentElement?.clientWidth || 800;
      canvas.height = 480;
    };
    resize();
    window.addEventListener('resize', resize);

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      const r = Math.min(cx, cy) * 0.72;

      // Draw orbital dashed rings
      ctx.strokeStyle = 'rgba(53, 214, 255, 0.15)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 6]);

      [0.4, 0.7, 1.0].forEach((scale) => {
        ctx.beginPath();
        ctx.arc(cx, cy, r * scale, 0, Math.PI * 2);
        ctx.stroke();
      });

      // Draw Center Core (NASA PSI Nexus)
      ctx.setLineDash([]);
      const grad = ctx.createRadialGradient(cx, cy, 2, cx, cy, 28);
      grad.addColorStop(0, '#35D6FF');
      grad.addColorStop(1, 'rgba(5, 18, 44, 0.8)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, 22, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = 'rgba(53, 214, 255, 0.6)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.fillStyle = '#030814';
      ctx.font = 'bold 9px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('NASA', cx, cy - 3);
      ctx.fillText('PSI', cx, cy + 6);

      // Draw Nodes
      const count = experiments.length;
      experiments.forEach((exp, idx) => {
        const itemAngle = (idx / count) * Math.PI * 2 + angle * 0.05;
        const radiusDist = r * (0.45 + (idx % 3) * 0.25);
        const nx = cx + Math.cos(itemAngle) * radiusDist;
        const ny = cy + Math.sin(itemAngle) * radiusDist;

        const isSelected = exp.id === selectedId;

        // Connector line to center
        ctx.strokeStyle = isSelected ? 'rgba(53, 214, 255, 0.45)' : 'rgba(53, 214, 255, 0.08)';
        ctx.lineWidth = isSelected ? 1.5 : 0.8;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(nx, ny);
        ctx.stroke();

        // Node Glow
        if (isSelected) {
          ctx.fillStyle = 'rgba(53, 214, 255, 0.25)';
          ctx.beginPath();
          ctx.arc(nx, ny, 16, 0, Math.PI * 2);
          ctx.fill();
        }

        // Node Dot
        ctx.fillStyle = isSelected ? '#35D6FF' : '#8DB3DE';
        ctx.beginPath();
        ctx.arc(nx, ny, isSelected ? 6 : 4, 0, Math.PI * 2);
        ctx.fill();

        // Node Label
        ctx.font = isSelected ? 'bold 11px Orbitron, monospace' : '9px monospace';
        ctx.fillStyle = isSelected ? '#35D6FF' : 'rgba(234, 243, 255, 0.7)';
        ctx.textAlign = nx > cx ? 'left' : 'right';
        ctx.fillText(exp.n, nx + (nx > cx ? 10 : -10), ny);
      });

      angle += 0.005;
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resize);
    };
  }, [experiments, selectedId, activeTab]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const r = Math.min(cx, cy) * 0.72;

    const count = experiments.length;
    let closestExp: Experiment | null = null;
    let minDist = 30;

    experiments.forEach((exp, idx) => {
      const itemAngle = (idx / count) * Math.PI * 2;
      const radiusDist = r * (0.45 + (idx % 3) * 0.25);
      const nx = cx + Math.cos(itemAngle) * radiusDist;
      const ny = cy + Math.sin(itemAngle) * radiusDist;
      const dist = Math.hypot(nx - x, ny - y);
      if (dist < minDist) {
        minDist = dist;
        closestExp = exp;
      }
    });

    if (closestExp) {
      playTelemetryChirp();
      setSelectedId((closestExp as any).id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="rounded-2xl bg-gradient-to-r from-[#07152B]/95 via-[#06183E]/90 to-[#030814]/95 border border-[#35D6FF]/30 p-5 backdrop-blur-2xl shadow-[0_0_40px_rgba(53,214,255,0.12)] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-400/40 flex items-center justify-center text-cyan-300 shadow-[0_0_15px_rgba(53,214,255,0.35)] shrink-0">
            <Compass className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base sm:text-lg font-black font-orbitron text-white tracking-wider">
                IGNIS DATA NETWORK
              </h2>
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-cyan-500/20 text-[#35D6FF] border border-[#35D6FF]/40 font-bold">
                Orbital Timeline (1974–2026)
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold">
                {experiments.length} NASA Investigations
              </span>
            </div>
            <p className="text-xs text-[#8DB3DE] font-mono leading-relaxed mt-0.5">
              Interactive topological node graph and historical accession directory connecting NASA microgravity fire experiments.
            </p>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center p-1 rounded-xl bg-[#030814]/90 border border-cyan-500/30">
            <button
              onClick={() => {
                playTelemetryChirp();
                setActiveTab('canvas');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                activeTab === 'canvas'
                  ? 'bg-gradient-to-r from-cyan-400 to-sky-400 text-slate-950 shadow-[0_0_15px_rgba(6,182,212,0.5)]'
                  : 'text-slate-400 hover:text-cyan-200'
              }`}
            >
              Orbital Graph
            </button>
            <button
              onClick={() => {
                playTelemetryChirp();
                setActiveTab('table');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                activeTab === 'table'
                  ? 'bg-gradient-to-r from-cyan-400 to-sky-400 text-slate-950 shadow-[0_0_15px_rgba(6,182,212,0.5)]'
                  : 'text-slate-400 hover:text-cyan-200'
              }`}
            >
              Mission Table ({filteredExperiments.length})
            </button>
          </div>
        </div>
      </div>

      {/* Main Interactive Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Interactive Canvas OR Mission Table (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {activeTab === 'canvas' ? (
            <div className="rounded-2xl border border-cyan-500/30 bg-[#030814]/90 shadow-[0_0_40px_rgba(6,182,212,0.1)] p-4 relative overflow-hidden">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-xs font-mono text-slate-300">
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                  <span>Click any orbital node to inspect investigation dossier</span>
                </span>
                <span className="text-cyan-400 font-bold">24 Orbital Flight Nodes</span>
              </div>

              <canvas
                ref={canvasRef}
                onClick={handleCanvasClick}
                className="w-full h-[480px] cursor-pointer"
              />

              {/* Quick Jump Chip Bar */}
              <div className="pt-3 border-t border-slate-800 flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
                <span className="text-[10px] font-mono uppercase text-slate-400 font-bold shrink-0">
                  Quick Focus:
                </span>
                {experiments.slice(0, 8).map((exp) => (
                  <button
                    key={exp.id}
                    onClick={() => {
                      playCommandChirp();
                      setSelectedId(exp.id);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold transition shrink-0 cursor-pointer ${
                      selectedId === exp.id
                        ? 'bg-cyan-500 text-slate-950 shadow-[0_0_10px_#22d3ee]'
                        : 'bg-slate-900 text-slate-300 hover:text-white border border-slate-800'
                    }`}
                  >
                    {exp.n} ({exp.y})
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* Mission Table View */
            <div className="rounded-2xl border border-cyan-500/30 bg-[#06183E]/80 backdrop-blur-xl p-5 shadow-[0_0_35px_rgba(6,182,212,0.1)] space-y-4">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-3 text-cyan-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter by title, platform (ISS, Shuttle, Skylab), year..."
                  className="w-full pl-9 pr-4 py-2 bg-[#030814] border border-cyan-500/30 rounded-xl text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="max-h-[500px] overflow-y-auto space-y-2 pr-1">
                {filteredExperiments.map((exp) => (
                  <div
                    key={exp.id}
                    onClick={() => {
                      playTelemetryChirp();
                      setSelectedId(exp.id);
                    }}
                    className={`p-3 rounded-xl border transition cursor-pointer flex items-center justify-between gap-3 ${
                      selectedId === exp.id
                        ? 'bg-cyan-950/60 border-cyan-400/80 shadow-[0_0_15px_rgba(6,182,212,0.3)]'
                        : 'bg-slate-950/60 border-slate-800 hover:border-cyan-500/40 hover:bg-slate-900/40'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-bold">
                          {exp.y}
                        </span>
                        <h4 className="font-orbitron font-bold text-white text-xs truncate">
                          {exp.n}
                        </h4>
                      </div>
                      <p className="text-[11px] text-slate-400 font-mono mt-1 truncate">
                        {exp.w} // {exp.t}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-cyan-400 shrink-0" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Selected Experiment Dossier Inspector (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="rounded-2xl border-2 border-cyan-500/40 bg-gradient-to-b from-[#06183E]/95 via-[#030814]/95 to-black/98 p-5 shadow-[0_0_40px_rgba(6,182,212,0.15)] space-y-4 backdrop-blur-2xl">
            {/* Mission Identifier Header */}
            <div className="pb-3 border-b border-cyan-500/30 flex items-start justify-between gap-3">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-cyan-400 font-bold block">
                  Investigation Dossier
                </span>
                <h3 className="text-xl font-black font-orbitron text-white mt-0.5">
                  {selectedExperiment.n}
                </h3>
                <span className="text-xs text-slate-300 font-mono block mt-0.5">
                  {selectedExperiment.t}
                </span>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 text-xs font-mono font-bold shrink-0">
                {selectedExperiment.y}
              </span>
            </div>

            {/* Quick Metadata Grid */}
            <div className="grid grid-cols-2 gap-3 text-xs font-mono">
              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3">
                <span className="text-[10px] uppercase text-slate-400 block mb-0.5">
                  Research Platform
                </span>
                <span className="text-white font-bold">{selectedExperiment.w}</span>
              </div>

              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3">
                <span className="text-[10px] uppercase text-slate-400 block mb-0.5">
                  Date / Verification
                </span>
                <span className="text-cyan-300 font-bold">{selectedExperiment.when}</span>
              </div>
            </div>

            {/* Scientific Summary Narrative */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold block">
                Executive Scientific Summary
              </span>
              <p className="text-xs text-slate-200 leading-relaxed bg-[#030814]/80 border border-slate-800 rounded-xl p-3.5">
                {selectedExperiment.sm}
              </p>
            </div>

            {/* Key Findings List */}
            {selectedExperiment.f && selectedExperiment.f.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold block">
                  Documented Parameters & Artifacts
                </span>
                <div className="space-y-1.5">
                  {selectedExperiment.f.map((item, idx) => (
                    <div
                      key={idx}
                      className="bg-slate-950/60 border border-slate-800 rounded-lg p-2.5 text-xs font-mono flex items-start gap-2"
                    >
                      <span className="text-cyan-400 font-bold shrink-0">[{item[0]}]</span>
                      <span className="text-slate-300">{item[1]}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Technical Sources & DOI Links */}
            {selectedExperiment.src && selectedExperiment.src.length > 0 && (
              <div className="space-y-1.5 pt-2 border-t border-slate-800">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold block">
                  NASA Literature & Technical Reports
                </span>
                <div className="space-y-1.5">
                  {selectedExperiment.src.map((source, idx) => (
                    <a
                      key={idx}
                      href={source.u}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-cyan-950/30 hover:bg-cyan-900/40 border border-cyan-500/30 text-cyan-300 text-xs font-mono font-bold transition group"
                    >
                      <span className="truncate">{source.l}</span>
                      <ExternalLink className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform shrink-0" />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Cross-Module Navigation Action */}
            <div className="pt-3 border-t border-cyan-500/30 flex items-center justify-between gap-3">
              <button
                onClick={() => {
                  playCommandChirp();
                  if (onNavigate) onNavigate('/simulator');
                  else window.location.hash = '#/simulator';
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-400 to-sky-400 text-slate-950 font-mono font-black text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(6,182,212,0.4)] hover:brightness-110 transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <Flame className="w-4 h-4 fill-slate-950" />
                <span>Simulate Microgravity Flame ➔</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
