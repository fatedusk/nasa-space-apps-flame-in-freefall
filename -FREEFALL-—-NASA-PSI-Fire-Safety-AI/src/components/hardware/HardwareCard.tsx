import React, { useState } from 'react';
import {
  Cpu,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  Wrench,
  Layers,
  BookOpen,
  Camera,
  Globe2,
  CheckCircle2,
} from 'lucide-react';
import { HardwareItem } from '../../types/hardware';

interface HardwareCardProps {
  hardware: HardwareItem;
  onInspect: (hardware: HardwareItem) => void;
}

export const HardwareCard: React.FC<HardwareCardProps> = ({ hardware, onInspect }) => {
  const [imageError, setImageError] = useState(false);
  const primarySpinoff = hardware.earthApplications.documentedTransfers[0];
  const primaryResearch = hardware.earthApplications.researchApplications?.[0];
  const primaryPotential = hardware.earthApplications.potentialApplications[0];

  const hasImage = !imageError && Boolean(hardware.image?.thumbnailUrl);
  const imageConfidence = hardware.image?.confidence || 'MISSION_RELATED_IMAGE';
  const recordState = hardware.recordState || 'CURATED_REFERENCE';

  return (
    <div
      onClick={() => onInspect(hardware)}
      className="group relative flex flex-col rounded-2xl bg-gradient-to-b from-[#081220]/95 via-[#060c18]/95 to-[#03060c]/95 border border-cyan-500/20 hover:border-cyan-400/50 transition-all duration-300 hover:shadow-[0_0_30px_rgba(6,182,212,0.2)] hover:-translate-y-1 cursor-pointer overflow-hidden backdrop-blur-xl"
    >
      {/* Top Ambient Glow Line */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400/60 to-transparent group-hover:via-cyan-300 transition-all"></div>

      {/* Hardware Image Container — Gracefully collapsed when no image is available */}
      {hasImage && hardware.image && (
        <div className="relative w-full h-48 bg-slate-950/80 overflow-hidden border-b border-cyan-500/15">
          <img
            src={hardware.image.thumbnailUrl}
            alt={hardware.name}
            loading="lazy"
            onError={() => setImageError(true)}
            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 opacity-90 group-hover:opacity-100"
          />

          {/* Gradient Scrim for Contrast */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#060c18] via-transparent to-black/40 pointer-events-none"></div>

          {/* Top Floating Badges: Record State & Image Confidence */}
          <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between gap-2 pointer-events-none flex-wrap">
            <div className="flex items-center gap-1.5">
              {recordState === 'LIVE_DATA' ? (
                <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold tracking-wider uppercase bg-cyan-950/90 text-cyan-300 border border-cyan-400/50 backdrop-blur-md flex items-center gap-1 shadow-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
                  Live NASA Data
                </span>
              ) : recordState === 'CACHED_DATA' ? (
                <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold tracking-wider uppercase bg-blue-950/80 text-blue-300 border border-blue-400/40 backdrop-blur-md">
                  Cached Data
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold tracking-wider uppercase bg-emerald-950/80 text-emerald-300 border border-emerald-400/40 backdrop-blur-md">
                  Curated Reference
                </span>
              )}

              <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold tracking-wider uppercase bg-black/80 text-slate-300 border border-slate-700 backdrop-blur-md">
                {hardware.category}
              </span>
            </div>

            {/* Image Confidence Badge */}
            {imageConfidence === 'EXACT_HARDWARE_IMAGE' ? (
              <span className="px-2 py-0.5 rounded text-[9px] font-mono font-semibold bg-emerald-950/90 text-emerald-300 border border-emerald-500/40 backdrop-blur-md flex items-center gap-1">
                <Camera className="w-2.5 h-2.5 text-emerald-400" />
                Exact Photo
              </span>
            ) : imageConfidence === 'HARDWARE_DETAIL_IMAGE' ? (
              <span className="px-2 py-0.5 rounded text-[9px] font-mono font-semibold bg-teal-950/90 text-teal-300 border border-teal-500/40 backdrop-blur-md flex items-center gap-1">
                <Wrench className="w-2.5 h-2.5 text-teal-400" />
                Detail Photo
              </span>
            ) : imageConfidence === 'MISSION_INTEGRATION_IMAGE' ? (
              <span className="px-2 py-0.5 rounded text-[9px] font-mono bg-indigo-950/90 text-indigo-300 border border-indigo-500/40 backdrop-blur-md flex items-center gap-1">
                <Layers className="w-2.5 h-2.5 text-indigo-400" />
                Integrated
              </span>
            ) : imageConfidence === 'EXTERNAL_RESEARCH_IMAGE' ? (
              <span className="px-2 py-0.5 rounded text-[9px] font-mono bg-purple-950/90 text-purple-300 border border-purple-500/40 backdrop-blur-md flex items-center gap-1">
                <BookOpen className="w-2.5 h-2.5 text-purple-400" />
                Research Archive
              </span>
            ) : imageConfidence === 'MISSION_RELATED_IMAGE' ? (
              <span className="px-2 py-0.5 rounded text-[9px] font-mono bg-sky-950/90 text-sky-300 border border-sky-500/40 backdrop-blur-md flex items-center gap-1">
                <Globe2 className="w-2.5 h-2.5 text-sky-400" />
                Mission Photo
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded text-[9px] font-mono bg-slate-900/90 text-slate-400 border border-slate-700/60 backdrop-blur-md">
                Illustrative
              </span>
            )}
          </div>

          {/* Bottom Platform/Mission Strip */}
          <div className="absolute bottom-2 left-2.5 right-2.5 flex items-center justify-between pointer-events-none text-[11px] font-mono text-slate-300">
            <span className="truncate bg-black/70 px-2 py-0.5 rounded border border-white/10 backdrop-blur-md max-w-[70%]">
              {hardware.mission}
            </span>
            {hardware.acronym && (
              <span className="bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 font-bold px-1.5 py-0.5 rounded text-[10px] shrink-0">
                {hardware.acronym}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Card Content Body */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between gap-3">
        <div>
          {/* If image is collapsed, show header badges inside card body */}
          {!hasImage && (
            <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
              <div className="flex items-center gap-1.5 flex-wrap">
                {recordState === 'LIVE_DATA' ? (
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase bg-cyan-950/90 text-cyan-300 border border-cyan-400/50">
                    Live NASA Data
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase bg-emerald-950/80 text-emerald-300 border border-emerald-400/40">
                    Curated Reference
                  </span>
                )}
                <span className="px-2 py-0.5 rounded-full text-[9px] font-mono uppercase bg-black/80 text-slate-300 border border-slate-700">
                  {hardware.category}
                </span>
              </div>
              <span className="text-[10px] font-mono text-slate-400 truncate max-w-[150px]">
                {hardware.mission}
              </span>
            </div>
          )}

          {/* Hardware Title */}
          {/* Hardware Title */}
          <h3 className="text-sm sm:text-base font-bold text-white group-hover:text-cyan-200 transition-colors line-clamp-1 flex items-center justify-between gap-2">
            <span>{hardware.name}</span>
          </h3>

          {/* Subtitle / Center & Developer */}
          <div className="text-[11px] font-mono text-cyan-400/80 mt-0.5 flex items-center gap-1.5 flex-wrap">
            <span>{hardware.center || 'NASA Flight Center'}</span>
            {hardware.developer && (
              <>
                <span className="text-slate-600">·</span>
                <span className="text-slate-400 truncate max-w-[200px]">{hardware.developer}</span>
              </>
            )}
          </div>

          {/* Brief Function Description */}
          <p className="mt-2 text-xs text-slate-300/90 leading-relaxed line-clamp-2">
            {hardware.briefFunction}
          </p>
        </div>

        {/* Earth Applications Bridge Section */}
        <div className="pt-3 border-t border-cyan-500/15 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase font-bold tracking-wider text-slate-400 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-cyan-400" />
              Earth Applications Bridge
            </span>
            {hardware.earthApplications.evidenceStatus === 'VERIFIED' ? (
              <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                <CheckCircle2 className="w-2.5 h-2.5" />
                Verified Spinoff
              </span>
            ) : hardware.earthApplications.evidenceStatus === 'RESEARCH_APPLICATION' ? (
              <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-500/40 flex items-center gap-1">
                <BookOpen className="w-2.5 h-2.5" />
                Research Translation
              </span>
            ) : (
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                Dual-Use Tech
              </span>
            )}
          </div>

          {/* Primary Transfer / Research / Spinoff Chip */}
          {primarySpinoff ? (
            <div className="rounded-lg bg-emerald-950/30 border border-emerald-500/25 p-2 flex items-start gap-2">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
              <div className="min-w-0">
                <div className="text-[11px] font-semibold text-emerald-200 truncate">
                  {primarySpinoff.title}
                </div>
                <div className="text-[10px] text-emerald-400/80 font-mono">
                  {primarySpinoff.partner ? `${primarySpinoff.partner} · ` : ''}
                  {primarySpinoff.category}
                </div>
              </div>
            </div>
          ) : primaryResearch ? (
            <div className="rounded-lg bg-sky-950/30 border border-sky-500/25 p-2 flex items-start gap-2">
              <BookOpen className="w-3.5 h-3.5 text-sky-400 mt-0.5 shrink-0" />
              <div className="min-w-0">
                <div className="text-[11px] font-semibold text-sky-200 truncate">
                  {primaryResearch.title}
                </div>
                <div className="text-[10px] text-sky-400/80 font-mono truncate">
                  {primaryResearch.targetIndustry}
                </div>
              </div>
            </div>
          ) : primaryPotential ? (
            <div className="rounded-lg bg-cyan-950/20 border border-cyan-500/20 p-2 flex items-start gap-2">
              <Wrench className="w-3.5 h-3.5 text-cyan-400 mt-0.5 shrink-0" />
              <div className="min-w-0">
                <div className="text-[11px] font-semibold text-cyan-200 truncate">
                  {primaryPotential.field}
                </div>
                <div className="text-[10px] text-slate-400 line-clamp-1">
                  {primaryPotential.problemAddressed}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-[11px] font-mono text-slate-500 italic">
              Spaceflight instrument qualification data
            </div>
          )}

          {/* Target Industries Tag Cloud */}
          {hardware.earthApplications.targetIndustries.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
              {hardware.earthApplications.targetIndustries.slice(0, 2).map((ind, i) => (
                <span
                  key={i}
                  className="px-1.5 py-0.5 rounded bg-slate-900/80 border border-slate-700/60 text-[9px] font-mono text-slate-300"
                >
                  {ind}
                </span>
              ))}
              {hardware.earthApplications.targetIndustries.length > 2 && (
                <span className="text-[9px] font-mono text-slate-500">
                  +{hardware.earthApplications.targetIndustries.length - 2} more
                </span>
              )}
            </div>
          )}
        </div>

        {/* Action Footer */}
        <div className="pt-2 flex items-center justify-between gap-2 border-t border-cyan-500/10">
          <span className="text-[10px] font-mono text-slate-500">
            {hardware.specs.mass ? `Mass: ${hardware.specs.mass.split(' ')[0]}` : hardware.id}
          </span>

          <button
            type="button"
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-mono font-bold bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-400/30 group-hover:border-cyan-400/60 transition shadow-[0_0_10px_rgba(6,182,212,0.1)] group-hover:shadow-[0_0_15px_rgba(6,182,212,0.3)]"
          >
            <span>Inspect Dossier</span>
            <ExternalLink className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
};
