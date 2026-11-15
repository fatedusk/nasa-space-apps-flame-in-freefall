import React, { useRef, useEffect, useState } from 'react';
import {
  Flame,
  Gauge,
  Layers,
  Activity,
  AlertTriangle,
  Info,
  CheckCircle2,
  FileSpreadsheet,
  MousePointerClick,
  Sparkles,
  Target,
} from 'lucide-react';
import { PredictionInput, PredictionResult } from '../types';
import {
  VERIFIED_PSI_RUNS,
  generateTrainingCSV,
  PhaseMapPoint,
  getPointsForMaterialAndPlanet,
  getFlammabilityThresholds,
  getMaterialDisplayName,
  getGravityDisplayName,
} from '../utils/predictorEngine';
import { FlameSimulatorCanvas } from './FlameSimulatorCanvas';

interface PredictorViewProps {
  input: PredictionInput;
  onChangeInput: (newInput: PredictionInput) => void;
  prediction: PredictionResult;
  onOpenDossier: (studyId: string) => void;
  onAskAIAboutPrediction: () => void;
}

export const PredictorView: React.FC<PredictorViewProps> = ({
  input,
  onChangeInput,
  prediction,
  onOpenDossier,
  onAskAIAboutPrediction,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [hoverPoint, setHoverPoint] = useState<{ flow: number; o2: number; x: number; y: number } | null>(null);
  const [viewMode, setViewMode] = useState<'selected' | 'all'>('selected');
  const [hoveredPointData, setHoveredPointData] = useState<PhaseMapPoint | null>(null);

  // Download 48 verified NASA PSI runs CSV
  const handleDownloadCSV = () => {
    const csvContent = generateTrainingCSV();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'NASA_PSI_48_Verified_Runs.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Canvas coordinates helper for interactive click & drag
  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const mouseX = (e.clientX - rect.left) * scaleX;
    const mouseY = (e.clientY - rect.top) * scaleY;

    const padL = 50;
    const padB = 40;
    const padR = 20;
    const padT = 20;
    const plotW = canvas.width - padL - padR;
    const plotH = canvas.height - padT - padB;

    const clampedX = Math.max(padL, Math.min(padL + plotW, mouseX));
    const clampedY = Math.max(padT, Math.min(padT + plotH, mouseY));

    const flow = Math.round((((clampedX - padL) / plotW) * 45) * 10) / 10;
    const o2 = Math.round((14 + ((padT + plotH - clampedY) / plotH) * 20) * 10) / 10;

    // Search for closest point to mouse within 12px
    const currentPoints =
      viewMode === 'selected'
        ? getPointsForMaterialAndPlanet(input.material, input.gravity, input.pressureKpa, input.gasMix)
        : VERIFIED_PSI_RUNS.map((run) => ({
            flow: run.airflow_cms,
            o2: run.o2_pct,
            regime: run.regime,
            spreadRate: run.spread_rate_mms,
            isRealPsiRun: true,
            runId: run.run_id,
            notes: `${run.psi_study}: ${run.notes}`,
            material: run.material,
            gravity: run.gravity_g === 0 ? '0g' : run.gravity_g === 0.165 ? 'lunar' : run.gravity_g === 0.38 ? 'mars' : '1g',
          }));

    let nearestPt: PhaseMapPoint | null = null;
    let minDist = 14;
    for (const pt of currentPoints) {
      const ptX = padL + (pt.flow / 45) * plotW;
      const ptY = padT + plotH - ((pt.o2 - 14) / 20) * plotH;
      const d = Math.hypot(ptX - mouseX, ptY - mouseY);
      if (d < minDist) {
        minDist = d;
        nearestPt = pt;
      }
    }

    return {
      flow,
      o2,
      x: clampedX,
      y: clampedY,
      inside: mouseX >= padL && mouseX <= padL + plotW && mouseY >= padT && mouseY <= padT + plotH,
      closestPoint: nearestPt,
    };
  };

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const coords = getCanvasCoords(e);
    if (!coords) return;
    setIsDragging(true);

    if (coords.closestPoint) {
      onChangeInput({
        ...input,
        airflowCms: coords.closestPoint.flow,
        oxygenPct: coords.closestPoint.o2,
      });
    } else {
      onChangeInput({
        ...input,
        airflowCms: coords.flow,
        oxygenPct: coords.o2,
      });
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const coords = getCanvasCoords(e);
    if (!coords) return;
    if (coords.inside) {
      setHoverPoint({ flow: coords.flow, o2: coords.o2, x: coords.x, y: coords.y });
      setHoveredPointData(coords.closestPoint);
    } else {
      setHoverPoint(null);
      setHoveredPointData(null);
    }
    if (isDragging) {
      onChangeInput({
        ...input,
        airflowCms: coords.flow,
        oxygenPct: coords.o2,
      });
    }
  };

  const handleCanvasMouseUp = () => {
    setIsDragging(false);
  };

  const handleCanvasMouseLeave = () => {
    setIsDragging(false);
    setHoverPoint(null);
    setHoveredPointData(null);
  };

  // Render 2D Flammability Phase-Space Map Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    // Padding
    const padL = 50;
    const padB = 40;
    const padR = 20;
    const padT = 20;
    const plotW = width - padL - padR;
    const plotH = height - padT - padB;

    // Coordinate mapping:
    // X axis: Airflow (0 to 45 cm/s)
    // Y axis: Oxygen (14 to 34 %)
    const toX = (flow: number) => padL + (flow / 45) * plotW;
    const toY = (o2: number) => padT + plotH - ((o2 - 14) / (34 - 14)) * plotH;

    // Dynamic thresholds calculation based on current Material, Gravity, and Gas Mix
    const thresholds = getFlammabilityThresholds(input.material, input.gravity, input.gasMix);

    // Background Grid
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    for (let flow = 0; flow <= 40; flow += 10) {
      const x = toX(flow);
      ctx.beginPath();
      ctx.moveTo(x, padT);
      ctx.lineTo(x, padT + plotH);
      ctx.stroke();
    }
    for (let o2 = 15; o2 <= 35; o2 += 5) {
      const y = toY(o2);
      ctx.beginPath();
      ctx.moveTo(padL, y);
      ctx.lineTo(padL + plotW, y);
      ctx.stroke();
    }

    // Regimes Phase Polygons / Boundaries (Dynamically adapted to Material & Planet)
    // 1. Quenching / No Spread zone
    ctx.fillStyle = 'rgba(56, 189, 248, 0.08)';
    ctx.beginPath();
    thresholds.quenchPolygon.forEach((pt, i) => {
      const px = toX(pt.flow);
      const py = toY(pt.o2);
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    });
    ctx.closePath();
    ctx.fill();

    // 2. Sustained spread zone
    ctx.fillStyle = 'rgba(239, 68, 68, 0.12)';
    ctx.beginPath();
    thresholds.sustainedPolygon.forEach((pt, i) => {
      const px = toX(pt.flow);
      const py = toY(pt.o2);
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    });
    ctx.closePath();
    ctx.fill();

    // 3. Dynamic Limiting Oxygen Index (LOI) Threshold Line
    const loiY = toY(thresholds.loi);
    if (loiY >= padT && loiY <= padT + plotH) {
      ctx.strokeStyle = 'rgba(251, 191, 36, 0.6)';
      ctx.setLineDash([4, 4]);
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(padL, loiY);
      ctx.lineTo(padL + plotW, loiY);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = '#fbbf24';
      ctx.font = '9px monospace';
      ctx.textAlign = 'right';
      ctx.fillText(`LOI ${thresholds.loi}% O₂`, padL + plotW - 6, loiY - 4);
    }

    // Dynamic Points Selection (recalculated when Material or Planet changes)
    const pointsToPlot: PhaseMapPoint[] =
      viewMode === 'selected'
        ? getPointsForMaterialAndPlanet(input.material, input.gravity, input.pressureKpa, input.gasMix)
        : VERIFIED_PSI_RUNS.map((run) => ({
            flow: run.airflow_cms,
            o2: run.o2_pct,
            regime: run.regime,
            spreadRate: run.spread_rate_mms,
            isRealPsiRun: true,
            runId: run.run_id,
            notes: `${run.psi_study}: ${run.notes}`,
            material: run.material,
            gravity: run.gravity_g === 0 ? '0g' : run.gravity_g === 0.165 ? 'lunar' : run.gravity_g === 0.38 ? 'mars' : '1g',
          }));

    // Plot Points
    pointsToPlot.forEach((pt) => {
      const px = toX(pt.flow);
      const py = toY(pt.o2);

      let color = '#38bdf8'; // No spread (blue)
      if (pt.regime === 'Marginal spread') color = '#fbbf24'; // amber
      if (pt.regime === 'Sustained spread') color = '#f87171'; // red

      const isMatchingMaterial = pt.material.toLowerCase() === input.material.toLowerCase();
      const isMatchingGravity =
        pt.gravity.toLowerCase() === input.gravity.toLowerCase() ||
        (pt.gravity === '0g' && input.gravity === '0g') ||
        (pt.gravity === '1g' && input.gravity === '1g');

      if (viewMode === 'all') {
        const isHighlight = isMatchingMaterial && isMatchingGravity;
        ctx.fillStyle = color;
        ctx.globalAlpha = isHighlight ? 1.0 : isMatchingMaterial ? 0.6 : 0.25;
        ctx.beginPath();
        ctx.arc(px, py, isHighlight ? 6 : 3.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = isHighlight ? '#ffffff' : '#040911';
        ctx.lineWidth = isHighlight ? 1.5 : 0.5;
        ctx.stroke();
        ctx.globalAlpha = 1.0;
        return;
      }

      // Selected Material & Planet Mode
      if (pt.isRealPsiRun) {
        // Real verified NASA flight experiment
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(px, py, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Pulsing indicator ring
        ctx.strokeStyle = color;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(px, py, 9, 0, Math.PI * 2);
        ctx.stroke();
      } else {
        // Parametric Grid Evaluation Point
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(px, py, 3.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#040911';
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }
    });

    // Hover Guide Crosshairs & Tooltip (if mouse hovering)
    if (hoverPoint) {
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.45)';
      ctx.setLineDash([2, 2]);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(hoverPoint.x, padT);
      ctx.lineTo(hoverPoint.x, padT + plotH);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(padL, hoverPoint.y);
      ctx.lineTo(padL + plotW, hoverPoint.y);
      ctx.stroke();
      ctx.setLineDash([]);

      // Hover Tooltip Pill
      let tipText = `${hoverPoint.flow} cm/s · ${hoverPoint.o2}% O₂`;
      if (hoveredPointData) {
        tipText = `${hoveredPointData.runId} (${hoveredPointData.regime} ${hoveredPointData.spreadRate.toFixed(2)}mm/s)`;
      }

      ctx.font = '10px monospace';
      const textWidth = ctx.measureText(tipText).width;
      const tipX = Math.min(padL + plotW - textWidth - 14, Math.max(padL + 4, hoverPoint.x + 8));
      const tipY = Math.max(padT + 18, hoverPoint.y - 8);

      ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
      ctx.strokeStyle = hoveredPointData?.isRealPsiRun ? '#fbbf24' : 'rgba(56, 189, 248, 0.5)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(tipX, tipY - 14, textWidth + 12, 18, 4);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = hoveredPointData?.isRealPsiRun ? '#fef08a' : '#38bdf8';
      ctx.textAlign = 'left';
      ctx.fillText(tipText, tipX + 6, tipY - 2);
    }

    // Plot Current Telemetry Operating Point
    const curX = toX(input.airflowCms);
    const curY = toY(input.oxygenPct);

    // Crosshairs
    ctx.strokeStyle = 'rgba(34, 211, 238, 0.75)';
    ctx.setLineDash([4, 4]);
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(curX, padT);
    ctx.lineTo(curX, padT + plotH);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(padL, curY);
    ctx.lineTo(padL + plotW, curY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Glowing target marker
    ctx.fillStyle = '#22d3ee';
    ctx.shadowColor = '#22d3ee';
    ctx.shadowBlur = 14;
    ctx.beginPath();
    ctx.arc(curX, curY, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Pulse Ring around current point
    ctx.strokeStyle = 'rgba(34, 211, 238, 0.5)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(curX, curY, 13, 0, Math.PI * 2);
    ctx.stroke();

    // Axis Labels
    ctx.fillStyle = '#94a3b8';
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';
    for (let flow = 0; flow <= 40; flow += 10) {
      ctx.fillText(`${flow}`, toX(flow), padT + plotH + 15);
    }
    ctx.fillText('Forced Airflow Draft (cm/s)', padL + plotW / 2, padT + plotH + 32);

    ctx.textAlign = 'right';
    for (let o2 = 15; o2 <= 30; o2 += 5) {
      ctx.fillText(`${o2}%`, padL - 8, toY(o2) + 3);
    }
  }, [input, prediction, hoverPoint, viewMode, hoveredPointData]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Banner: GBDT Super Intelligence Engine */}
      <div className="bg-[#081322]/90 backdrop-blur-xl border border-cyan-500/30 rounded-2xl p-6 shadow-2xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono uppercase tracking-widest px-2.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold">
              Pure In-Browser Machine Learning · 48 Real NASA PSI Runs
            </span>
            <span className="text-[10px] font-mono px-2.5 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
              Zero Synthetic Modulo Data
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-cyan-400" />
            Microgravity Flammability & Quenching Predictor (GBDT + k-NN)
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadCSV}
            className="text-xs font-mono font-bold px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 transition flex items-center gap-1.5 cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            <span>Export 48 PSI Runs (CSV)</span>
          </button>
          <button
            onClick={onAskAIAboutPrediction}
            className="text-xs font-mono font-bold px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-400 to-sky-400 text-slate-950 hover:brightness-110 transition shadow flex items-center gap-1.5 cursor-pointer active:scale-95 shadow-[0_0_15px_rgba(6,182,212,0.3)]"
          >
            <Flame className="w-3.5 h-3.5" />
            <span>Explain via Aether-SI</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Controls vs Live Prediction Outputs */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Environmental & Material Sliders (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-gradient-to-b from-[#061224]/90 via-[#030a16]/95 to-black/98 border border-cyan-500/30 rounded-2xl p-5 shadow-[0_0_35px_rgba(6,182,212,0.1)] space-y-5 backdrop-blur-2xl">
            <h3 className="text-sm font-mono font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-2">
              <Gauge className="w-4 h-4" /> Spacecraft Habitat Telemetry
            </h3>

            {/* Gravity Selection */}
            <div className="space-y-1.5">
              <label className="text-xs font-mono text-slate-300 flex justify-between">
                <span>Gravitational Regime (g):</span>
                <span className="text-cyan-300 font-bold">{input.gravity.toUpperCase()}</span>
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { id: '0g', label: '0-g (ISS)' },
                  { id: 'lunar', label: '1/6-g (Moon)' },
                  { id: 'mars', label: '3/8-g (Mars)' },
                  { id: '1g', label: '1-g (Earth)' },
                ].map((g) => (
                  <button
                    key={g.id}
                    onClick={() => onChangeInput({ ...input, gravity: g.id as any })}
                    className={`text-[11px] font-mono py-2 rounded-xl border transition cursor-pointer ${
                      input.gravity === g.id
                        ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400 font-bold shadow'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {g.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Material Selection */}
            <div className="space-y-1.5">
              <label className="text-xs font-mono text-slate-300 flex justify-between">
                <span>Fuel Material:</span>
                <span className="text-cyan-300 font-bold uppercase">{input.material}</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'sibal', label: 'SIBAL Fabric (BASS/Saffire)' },
                  { id: 'pmma', label: 'PMMA Acrylic (0.1mm Film)' },
                  { id: 'nomex', label: 'Nomex HT90-40 (Fire-Resistant)' },
                  { id: 'ultem', label: 'Ultem 1000 (3D PEI Polymer)' },
                ].map((m) => (
                  <button
                    key={m.id}
                    onClick={() => onChangeInput({ ...input, material: m.id as any })}
                    className={`text-[11px] font-mono p-2 text-left rounded-xl border transition cursor-pointer ${
                      input.material === m.id
                        ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400 font-bold shadow'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Oxygen Percentage Slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-slate-300">Oxygen Concentration (O₂):</span>
                <span className="text-cyan-300 font-bold">{input.oxygenPct.toFixed(1)}%</span>
              </div>
              <input
                type="range"
                min="14.0"
                max="34.0"
                step="0.2"
                value={input.oxygenPct}
                onChange={(e) => onChangeInput({ ...input, oxygenPct: parseFloat(e.target.value) })}
                className="w-full telemetry-slider cursor-pointer"
              />
              <div className="flex justify-between text-[10px] font-mono text-slate-500">
                <span>14% (Hypoxic)</span>
                <span>21% (Earth Air)</span>
                <span>34% (Artemis Lunar)</span>
              </div>
            </div>

            {/* Cabin Pressure Slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-slate-300">Cabin Pressure (kPa):</span>
                <span className="text-cyan-300 font-bold">{input.pressureKpa.toFixed(1)} kPa</span>
              </div>
              <input
                type="range"
                min="50.0"
                max="105.0"
                step="0.5"
                value={input.pressureKpa}
                onChange={(e) => onChangeInput({ ...input, pressureKpa: parseFloat(e.target.value) })}
                className="w-full telemetry-slider cursor-pointer"
              />
              <div className="flex justify-between text-[10px] font-mono text-slate-500">
                <span>56.5 kPa (8.2 psi Exploration)</span>
                <span>101.3 kPa (Standard ISS)</span>
              </div>
            </div>

            {/* Airflow Ventilation Velocity Slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-slate-300">HVAC Forced Airflow Draft:</span>
                <span className="text-cyan-300 font-bold">{input.airflowCms.toFixed(1)} cm/s</span>
              </div>
              <input
                type="range"
                min="0.0"
                max="45.0"
                step="0.5"
                value={input.airflowCms}
                onChange={(e) => onChangeInput({ ...input, airflowCms: parseFloat(e.target.value) })}
                className="w-full telemetry-slider cursor-pointer"
              />
              <div className="flex justify-between text-[10px] font-mono text-slate-500">
                <span>0 cm/s (Quiescent)</span>
                <span>20 cm/s (Nominal ISS duct)</span>
                <span>45 cm/s (High fan)</span>
              </div>
            </div>

            {/* Flow Direction & Gas Mix */}
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800">
              <div className="space-y-1">
                <label className="text-[11px] font-mono text-slate-400">Flow Direction:</label>
                <select
                  value={input.flowDirection}
                  onChange={(e) => onChangeInput({ ...input, flowDirection: e.target.value as any })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200"
                >
                  <option value="concurrent">Concurrent (Co-flow)</option>
                  <option value="opposed">Opposed (Counter-flow)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-mono text-slate-400">Atmosphere Diluent:</label>
                <select
                  value={input.gasMix}
                  onChange={(e) => onChangeInput({ ...input, gasMix: e.target.value as any })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200"
                >
                  <option value="normal">Normal (N₂ Balance)</option>
                  <option value="co2">CO₂ Inert Suppressant</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Prediction Engine Result & 2D Phase Space Map (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Status Display Card */}
          <div
            className={`rounded-2xl p-5 border-2 shadow-2xl transition ${
              prediction.regime === 'Sustained spread'
                ? 'bg-rose-950/40 border-rose-500/60'
                : prediction.regime === 'Marginal spread'
                ? 'bg-amber-950/40 border-amber-500/60'
                : 'bg-cyan-950/40 border-cyan-500/60'
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400 font-bold block">
                  Ensemble ML Inference Outcome
                </span>
                <h3 className="text-2xl font-black text-white flex items-center gap-2 mt-0.5">
                  {prediction.regime === 'Sustained spread' && <AlertTriangle className="w-6 h-6 text-rose-400" />}
                  {prediction.regime === 'Marginal spread' && <Activity className="w-6 h-6 text-amber-400" />}
                  {prediction.regime === 'No spread' && <CheckCircle2 className="w-6 h-6 text-cyan-400" />}
                  <span>{prediction.regime.toUpperCase()}</span>
                </h3>
              </div>

              <div className="text-right">
                <div className="text-2xl font-mono font-bold text-cyan-300">
                  {prediction.spreadRate.toFixed(2)}{' '}
                  <span className="text-xs text-slate-400 font-sans">mm/s</span>
                </div>
                <div className="text-[10px] font-mono text-slate-400">
                  Spread Velocity (Confidence: {prediction.confidence}%)
                </div>
              </div>
            </div>

            {/* Probability Breakdown Bar */}
            <div className="mt-4 space-y-1.5">
              <div className="flex justify-between text-[11px] font-mono text-slate-300">
                <span>No Spread ({prediction.probabilities.noSpread}%)</span>
                <span>Marginal ({prediction.probabilities.marginalSpread}%)</span>
                <span>Sustained ({prediction.probabilities.sustainedSpread}%)</span>
              </div>
              <div className="h-2.5 w-full bg-slate-900 rounded-full overflow-hidden flex">
                <div style={{ width: `${prediction.probabilities.noSpread}%` }} className="bg-cyan-400 transition-all" />
                <div style={{ width: `${prediction.probabilities.marginalSpread}%` }} className="bg-amber-400 transition-all" />
                <div style={{ width: `${prediction.probabilities.sustainedSpread}%` }} className="bg-rose-500 transition-all" />
              </div>
            </div>

            {/* Physics Diagnostics: Damkohler & Peclet */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4 pt-3 border-t border-slate-800/80 text-center">
              <div className="bg-slate-950/60 p-2 rounded-xl border border-slate-800">
                <div className="text-[9px] font-mono uppercase text-slate-400">Damköhler (Da)</div>
                <div className="text-sm font-mono font-bold text-cyan-300">{prediction.damkohlerNumber}</div>
              </div>
              <div className="bg-slate-950/60 p-2 rounded-xl border border-slate-800">
                <div className="text-[9px] font-mono uppercase text-slate-400">Péclet (Pe)</div>
                <div className="text-sm font-mono font-bold text-cyan-300">{prediction.pecletNumber}</div>
              </div>
              <div className="bg-slate-950/60 p-2 rounded-xl border border-slate-800">
                <div className="text-[9px] font-mono uppercase text-slate-400">Limiting O₂ Index</div>
                <div className="text-sm font-mono font-bold text-amber-300">{prediction.safetyAdvisory.criticalLimitingO2}%</div>
              </div>
              <div className="bg-slate-950/60 p-2 rounded-xl border border-slate-800">
                <div className="text-[9px] font-mono uppercase text-slate-400">CO₂ Inert Target</div>
                <div className="text-sm font-mono font-bold text-emerald-300">≥{prediction.safetyAdvisory.requiredSuppressionCo2Pct}%</div>
              </div>
            </div>

            {/* Advisory Recommendation */}
            <div className="mt-3.5 p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-200 leading-relaxed">
              <strong className="text-cyan-300 block mb-0.5">🚀 Crew Flight Controller Advisory:</strong>
              {prediction.safetyAdvisory.recommendation}
            </div>
          </div>

          {/* Top 3 Verified NASA PSI Experimental Neighbors */}
          <div className="bg-[#081322]/90 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
            <h4 className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5" /> Nearest Verified NASA PSI Experimental Runs (k = 3)
            </h4>
            <div className="space-y-2">
              {prediction.nearestNeighbors.map((match) => (
                <div
                  key={match.run.run_id}
                  className="bg-slate-950/80 border border-slate-800 hover:border-cyan-500/40 p-3 rounded-xl flex items-center justify-between gap-3 text-xs transition"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-cyan-300">{match.run.run_id}</span>
                      <span className="text-[10px] font-mono text-slate-400">{match.run.psi_study}</span>
                      <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-800">
                        {match.run.regime} ({match.run.spread_rate_mms} mm/s)
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300">{match.run.notes}</p>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="font-mono text-xs text-emerald-400 font-bold">{match.similarity}% Match</div>
                    <button
                      onClick={() => onOpenDossier(match.run.psi_study.includes('BASS') ? 'PSI-BASS-01' : 'PSI-SAF-01')}
                      className="text-[10px] font-mono text-cyan-400 hover:text-cyan-300 underline mt-0.5 block cursor-pointer"
                    >
                      Dossier ↗
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Side-by-Side Visual Lab: Interactive 2D Phase Map + Real-Time Flame Physics Simulator */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Left: Interactive 2D Flammability Phase-Space Canvas Map */}
        <div className="bg-[#081322]/90 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-3.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h4 className="text-sm font-mono font-bold text-white uppercase flex items-center gap-2">
                <Layers className="w-4 h-4 text-cyan-400" />
                2D Flammability Phase Map
              </h4>
              <p className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                <MousePointerClick className="w-3.5 h-3.5 text-cyan-300 animate-pulse" />
                <span>Points &amp; flammability boundaries dynamically adapt to selected Material &amp; Planet</span>
              </p>
            </div>
            {/* View Mode Toggle: Selected Material & Planet vs All 48 Historical Runs */}
            <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 text-[11px] font-mono">
              <button
                type="button"
                onClick={() => setViewMode('selected')}
                className={`px-2.5 py-1 rounded-lg transition cursor-pointer flex items-center gap-1 ${
                  viewMode === 'selected'
                    ? 'bg-cyan-500/25 text-cyan-300 border border-cyan-400/50 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Target className="w-3 h-3" />
                <span>Active Material &amp; Planet</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('all')}
                className={`px-2.5 py-1 rounded-lg transition cursor-pointer flex items-center gap-1 ${
                  viewMode === 'all'
                    ? 'bg-cyan-500/25 text-cyan-300 border border-cyan-400/50 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>All 48 PSI Flight Runs</span>
              </button>
            </div>
          </div>

          {/* Dynamic Readings HUD */}
          <div className="flex flex-wrap items-center gap-2 pt-1 text-xs font-mono">
            <span className="px-2.5 py-1 rounded-lg bg-cyan-950/60 border border-cyan-500/40 text-cyan-300 font-bold flex items-center gap-1">
              🧪 <span>{getMaterialDisplayName(input.material)}</span>
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 flex items-center gap-1">
              📍 <span>{getGravityDisplayName(input.gravity)}</span>
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-amber-950/60 border border-amber-500/40 text-amber-300 font-bold flex items-center gap-1">
              🔥 <span>LOI: {getFlammabilityThresholds(input.material, input.gravity, input.gasMix).loi}% O₂</span>
            </span>
          </div>

          <div className="w-full flex flex-col items-center bg-slate-950 rounded-xl p-3 border border-slate-900 shadow-inner">
            <canvas
              ref={canvasRef}
              width={620}
              height={300}
              onMouseDown={handleCanvasMouseDown}
              onMouseMove={handleCanvasMouseMove}
              onMouseUp={handleCanvasMouseUp}
              onMouseLeave={handleCanvasMouseLeave}
              className="w-full h-auto cursor-crosshair select-none rounded-lg"
            />
            <div className="w-full flex flex-wrap items-center justify-between text-[11px] font-mono text-slate-400 mt-2.5 px-2 gap-2">
              <div className="flex items-center gap-3">
                <span>Target Flow: <strong className="text-cyan-300">{input.airflowCms.toFixed(1)} cm/s</strong></span>
                <span>Target O₂: <strong className="text-cyan-300">{input.oxygenPct.toFixed(1)}%</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1 text-sky-400"><span className="w-2 h-2 rounded-full bg-sky-400" /> No Spread</span>
                <span className="flex items-center gap-1 text-amber-400"><span className="w-2 h-2 rounded-full bg-amber-400" /> Marginal</span>
                <span className="flex items-center gap-1 text-rose-400"><span className="w-2 h-2 rounded-full bg-rose-400" /> Sustained</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Real-Time Microgravity Flame Physics Simulator */}
        <div className="bg-[#081322]/90 border border-slate-800 rounded-2xl p-5 shadow-2xl">
          <FlameSimulatorCanvas input={input} prediction={prediction} />
        </div>
      </div>
    </div>
  );
};
