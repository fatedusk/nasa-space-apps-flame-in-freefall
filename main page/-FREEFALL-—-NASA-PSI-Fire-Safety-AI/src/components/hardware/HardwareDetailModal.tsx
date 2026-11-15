import React, { useEffect, useState } from 'react';
import {
  X,
  Cpu,
  Layers,
  ShieldCheck,
  Sparkles,
  ExternalLink,
  BookOpen,
  Wrench,
  Gauge,
  Thermometer,
  Zap,
  Weight,
  Maximize2,
  FileText,
  AlertTriangle,
  Bot,
  Compass,
  CheckCircle2,
  Camera,
  Globe2,
  Calendar,
  Building2,
  Binary,
} from 'lucide-react';
import { HardwareItem } from '../../types/hardware';

interface HardwareDetailModalProps {
  hardware: HardwareItem | null;
  onClose: () => void;
  onAskAI?: (hardware: HardwareItem) => void;
}

export const HardwareDetailModal: React.FC<HardwareDetailModalProps> = ({
  hardware,
  onClose,
  onAskAI,
}) => {
  const [imageError, setImageError] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isImageLoading, setIsImageLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<string>('overview');

  useEffect(() => {
    setImageError(false);
    setSelectedImageIndex(0);
    setIsImageLoading(true);
    setActiveSection('overview');
  }, [hardware?.id]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!hardware) return null;

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const availableImages = hardware.images && hardware.images.length > 0
    ? hardware.images
    : (hardware.image ? [hardware.image] : []);
  const activeImage = availableImages[selectedImageIndex] || hardware.image;
  const hasImage = !imageError && Boolean(activeImage?.thumbnailUrl);
  const imageConfidence = activeImage?.confidence || hardware.image?.confidence || 'MISSION_RELATED_IMAGE';
  const recordState = hardware.recordState || 'CURATED_REFERENCE';

  return (
    <div
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/85 backdrop-blur-2xl overflow-y-auto animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-5xl my-auto rounded-3xl bg-gradient-to-b from-[#091526] via-[#050b14] to-[#020509] border border-cyan-500/40 shadow-[0_0_60px_rgba(6,182,212,0.25)] text-slate-100 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Top Glowing Mission Strip */}
        <div className="h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent"></div>

        {/* Modal Header */}
        <div className="px-5 sm:px-8 py-4 sm:py-5 border-b border-cyan-500/20 flex items-start justify-between gap-4 bg-[#07101e]/80">
          <div className="space-y-1.5 max-w-3xl">
            <div className="flex items-center gap-2 flex-wrap">
              {/* Record State */}
              {recordState === 'LIVE_DATA' ? (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-wider uppercase bg-cyan-950/90 text-cyan-300 border border-cyan-400/50 flex items-center gap-1.5 shadow-[0_0_12px_rgba(6,182,212,0.3)]">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
                  Live NASA Discovery
                </span>
              ) : recordState === 'CACHED_DATA' ? (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-wider uppercase bg-blue-950/80 text-blue-300 border border-blue-400/40">
                  Cached Data
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-wider uppercase bg-emerald-950/80 text-emerald-300 border border-emerald-400/40 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  Curated Reference
                </span>
              )}

              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-wider uppercase bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 flex items-center gap-1.5">
                <Cpu className="w-3 h-3 text-cyan-400" />
                {hardware.category}
              </span>

              <span className="px-2.5 py-0.5 rounded text-[10px] font-mono text-slate-300 bg-slate-900/90 border border-slate-700/80">
                {hardware.id}
              </span>

              {hardware.acronym && (
                <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold text-sky-200 bg-sky-950/80 border border-sky-500/40">
                  {hardware.acronym}
                </span>
              )}

              {hardware.earthApplications.evidenceStatus === 'VERIFIED' ? (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  Verified Spinoff
                </span>
              ) : hardware.earthApplications.evidenceStatus === 'RESEARCH_APPLICATION' ? (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-sky-500/20 text-sky-300 border border-sky-500/40 flex items-center gap-1">
                  <BookOpen className="w-3 h-3" />
                  Research Application
                </span>
              ) : null}
            </div>

            <h2 className="text-lg sm:text-xl md:text-2xl font-black text-white tracking-wide font-mono">
              {hardware.name}
            </h2>

            <div className="text-xs font-mono text-cyan-400/90 flex items-center gap-2 flex-wrap">
              <span className="text-slate-300 font-semibold">{hardware.mission}</span>
              {hardware.experimentName && (
                <>
                  <span className="text-slate-600">·</span>
                  <span className="text-slate-400">{hardware.experimentName}</span>
                </>
              )}
              {hardware.center && (
                <>
                  <span className="text-slate-600">·</span>
                  <span className="text-cyan-300">{hardware.center}</span>
                </>
              )}
              {hardware.developer && (
                <>
                  <span className="text-slate-600">·</span>
                  <span className="text-slate-400">{hardware.developer}</span>
                </>
              )}
            </div>
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-700/60 transition cursor-pointer shrink-0"
            title="Close (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="overflow-y-auto px-5 sm:px-8 py-6 space-y-8 flex-1 custom-scrollbar">
          {/* Top 2-Column Hardware Anatomy Section */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
            {/* Left Column (5 Cols): Photo, Specs & Official Provenance */}
            <div className="lg:col-span-5 space-y-6">
              {/* Authentic NASA Image Card — Completely collapsed if no verified image is available */}
              {hasImage && activeImage && (
                <div className="rounded-2xl overflow-hidden border border-cyan-500/30 bg-slate-950/90 shadow-[0_0_20px_rgba(6,182,212,0.1)] flex flex-col">
                  <div className="relative w-full aspect-video bg-black/60 overflow-hidden flex items-center justify-center">
                    {/* Loading Shimmer */}
                    {isImageLoading && (
                      <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-cyan-950/30 to-slate-950 animate-pulse flex items-center justify-center">
                        <div className="w-8 h-8 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin"></div>
                      </div>
                    )}

                    <img
                      src={activeImage.largeUrl || activeImage.thumbnailUrl}
                      alt={activeImage.title || hardware.name}
                      onLoad={() => setIsImageLoading(false)}
                      onError={() => {
                        setImageError(true);
                        setIsImageLoading(false);
                      }}
                      className={`w-full h-full object-cover transition-opacity duration-300 ${
                        isImageLoading ? 'opacity-0' : 'opacity-100'
                      }`}
                    />

                    {/* Top Confidence Pill */}
                    <div className="absolute top-2 left-2 flex items-center gap-1.5 pointer-events-none">
                      {imageConfidence === 'EXACT_HARDWARE_IMAGE' ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-emerald-950/90 text-emerald-300 border border-emerald-500/40 backdrop-blur-md flex items-center gap-1 shadow-sm">
                          <Camera className="w-2.5 h-2.5 text-emerald-400" />
                          Exact Hardware Photo
                        </span>
                      ) : imageConfidence === 'HARDWARE_DETAIL_IMAGE' ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-teal-950/90 text-teal-300 border border-teal-500/40 backdrop-blur-md flex items-center gap-1 shadow-sm">
                          <Wrench className="w-2.5 h-2.5 text-teal-400" />
                          Component Detail Photo
                        </span>
                      ) : imageConfidence === 'MISSION_INTEGRATION_IMAGE' ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-indigo-950/90 text-indigo-300 border border-indigo-500/40 backdrop-blur-md flex items-center gap-1 shadow-sm">
                          <Layers className="w-2.5 h-2.5 text-indigo-400" />
                          Integrated Hardware
                        </span>
                      ) : imageConfidence === 'EXTERNAL_RESEARCH_IMAGE' ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-purple-950/90 text-purple-300 border border-purple-500/40 backdrop-blur-md flex items-center gap-1 shadow-sm">
                          <BookOpen className="w-2.5 h-2.5 text-purple-400" />
                          Research Archive Photo
                        </span>
                      ) : imageConfidence === 'MISSION_RELATED_IMAGE' ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-sky-950/90 text-sky-300 border border-sky-500/40 backdrop-blur-md flex items-center gap-1 shadow-sm">
                          <Globe2 className="w-2.5 h-2.5 text-sky-400" />
                          Mission-Related Photo
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-900/90 text-slate-400 border border-slate-700/60 backdrop-blur-md">
                          Illustrative Subject
                        </span>
                      )}
                    </div>

                    {activeImage.nasaId && (
                      <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded text-[10px] font-mono bg-black/80 text-cyan-300 border border-cyan-400/30 backdrop-blur-md">
                        ID: {activeImage.nasaId}
                      </div>
                    )}
                  </div>

                  {/* Multi-Image Gallery Switcher */}
                  {availableImages.length > 1 && (
                    <div className="px-3 py-2 bg-[#040810] border-t border-cyan-500/15 flex items-center justify-between gap-2 overflow-x-auto">
                      <div className="flex items-center gap-1.5 flex-1 min-w-0">
                        {availableImages.map((img, idx) => (
                          <button
                            key={idx}
                            onClick={() => {
                              setSelectedImageIndex(idx);
                              setIsImageLoading(true);
                              setImageError(false);
                            }}
                            className={`h-9 w-12 rounded overflow-hidden border transition shrink-0 ${
                              selectedImageIndex === idx
                                ? 'border-cyan-400 ring-1 ring-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.4)]'
                                : 'border-slate-800 opacity-60 hover:opacity-100 hover:border-slate-600'
                            }`}
                            title={img.title}
                          >
                            <img src={img.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                          </button>
                        ))}
                      </div>
                      <span className="text-[10px] font-mono text-cyan-400/80 shrink-0">
                        {selectedImageIndex + 1} / {availableImages.length}
                      </span>
                    </div>
                  )}

                  {/* Image Metadata Caption */}
                  <div className="p-3 bg-[#060c18] border-t border-cyan-500/15 text-[11px] font-mono space-y-1">
                    <div className="text-slate-300 font-bold line-clamp-1">{activeImage.title}</div>
                    <div className="text-slate-400 flex items-center justify-between text-[10px]">
                      <span>{activeImage.credit || 'Credit: NASA'}</span>
                      {activeImage.dateCreated && (
                        <span>{activeImage.dateCreated.slice(0, 10)}</span>
                      )}
                    </div>
                    {activeImage.sourceUrl && (
                      <div className="pt-1.5 flex justify-end">
                        <a
                          href={activeImage.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[10px] text-cyan-400 hover:text-cyan-300 underline"
                        >
                          <span>{activeImage.sourceUrl.includes('wikimedia') ? 'Wikimedia Spaceflight Archive' : 'Official NASA Image Library'}</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* SECTION 05: KEY ENGINEERING SPECIFICATIONS */}
              <div className="rounded-2xl border border-cyan-500/20 bg-[#071120]/80 p-4 space-y-3">
                <div className="text-xs font-mono font-bold tracking-wider uppercase text-cyan-300 flex items-center justify-between border-b border-cyan-500/20 pb-2">
                  <span className="flex items-center gap-1.5">
                    <Gauge className="w-3.5 h-3.5 text-cyan-400" />
                    05 — Engineering Specifications
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">Flight Telemetry</span>
                </div>

                <div className="space-y-2 text-xs font-mono">
                  {hardware.specs.dimensions && (
                    <div className="flex items-start justify-between gap-2 py-1 border-b border-slate-800/80">
                      <span className="text-slate-400 flex items-center gap-1">
                        <Maximize2 className="w-3 h-3 text-cyan-500" /> Dimensions
                      </span>
                      <span className="text-slate-200 text-right">{hardware.specs.dimensions}</span>
                    </div>
                  )}

                  {hardware.specs.mass && (
                    <div className="flex items-start justify-between gap-2 py-1 border-b border-slate-800/80">
                      <span className="text-slate-400 flex items-center gap-1">
                        <Weight className="w-3 h-3 text-cyan-500" /> Mass
                      </span>
                      <span className="text-slate-200 text-right">{hardware.specs.mass}</span>
                    </div>
                  )}

                  {hardware.specs.power && (
                    <div className="flex items-start justify-between gap-2 py-1 border-b border-slate-800/80">
                      <span className="text-slate-400 flex items-center gap-1">
                        <Zap className="w-3 h-3 text-cyan-500" /> Power
                      </span>
                      <span className="text-slate-200 text-right">{hardware.specs.power}</span>
                    </div>
                  )}

                  {hardware.specs.operatingTemp && (
                    <div className="flex items-start justify-between gap-2 py-1 border-b border-slate-800/80">
                      <span className="text-slate-400 flex items-center gap-1">
                        <Thermometer className="w-3 h-3 text-cyan-500" /> Temperature
                      </span>
                      <span className="text-slate-200 text-right">{hardware.specs.operatingTemp}</span>
                    </div>
                  )}

                  {hardware.specs.pressure && (
                    <div className="flex items-start justify-between gap-2 py-1 border-b border-slate-800/80">
                      <span className="text-slate-400 flex items-center gap-1">
                        <Gauge className="w-3 h-3 text-cyan-500" /> Pressure
                      </span>
                      <span className="text-slate-200 text-right">{hardware.specs.pressure}</span>
                    </div>
                  )}

                  {hardware.specs.environment && (
                    <div className="flex items-start justify-between gap-2 py-1 border-b border-slate-800/80">
                      <span className="text-slate-400 flex items-center gap-1">
                        <Compass className="w-3 h-3 text-cyan-500" /> Environment
                      </span>
                      <span className="text-slate-200 text-right">{hardware.specs.environment}</span>
                    </div>
                  )}

                  {hardware.specs.primaryOutputs && (
                    <div className="py-1">
                      <span className="text-slate-400 block mb-0.5">Primary Diagnostic Feeds:</span>
                      <span className="text-slate-300 leading-snug">{hardware.specs.primaryOutputs}</span>
                    </div>
                  )}

                  {hardware.specs.dataInterfaces && (
                    <div className="py-1 border-t border-slate-800/80">
                      <span className="text-slate-400 block mb-0.5">Data & Command Interfaces:</span>
                      <span className="text-slate-300 leading-snug">{hardware.specs.dataInterfaces}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* SECTION 07: TECHNICAL DOCUMENTATION & PROVENANCE CITATIONS */}
              <div className="rounded-2xl border border-cyan-500/20 bg-[#071120]/80 p-4 space-y-2.5">
                <div className="text-xs font-mono font-bold tracking-wider uppercase text-cyan-300 flex items-center justify-between border-b border-cyan-500/20 pb-2">
                  <span className="flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
                    07 — Citations & Provenance
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">Official Links</span>
                </div>

                <div className="space-y-1.5">
                  {hardware.technicalDocumentation && hardware.technicalDocumentation.length > 0 ? (
                    hardware.technicalDocumentation.map((doc, idx) => (
                      <a
                        key={idx}
                        href={doc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between gap-2 p-2 rounded-xl bg-slate-900/60 hover:bg-slate-900 text-xs font-mono text-slate-300 hover:text-cyan-200 border border-slate-800 hover:border-cyan-500/40 transition group"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                            {doc.type}
                          </span>
                          <span className="truncate">{doc.title}</span>
                        </div>
                        <ExternalLink className="w-3 h-3 text-slate-500 group-hover:text-cyan-400 shrink-0" />
                      </a>
                    ))
                  ) : (
                    <div className="text-xs font-mono text-slate-500 italic p-2">
                      NASA technical documents cataloged via live discovery.
                    </div>
                  )}
                </div>

                {/* Field-level Provenance Badges */}
                {hardware.provenance && hardware.provenance.length > 0 && (
                  <div className="pt-2 border-t border-slate-800 space-y-1.5">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block">
                      Field-Level Grounding Provenance:
                    </span>
                    <div className="space-y-1">
                      {hardware.provenance.map((prov, i) => (
                        <div
                          key={i}
                          className="p-1.5 rounded-lg bg-black/40 border border-slate-800 text-[10px] font-mono flex items-center justify-between gap-2"
                        >
                          <span className="text-cyan-400 truncate max-w-[150px]">{prov.supportedField}</span>
                          <a
                            href={prov.sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-slate-400 hover:text-cyan-300 truncate underline flex items-center gap-1"
                          >
                            <span>{prov.identifier || prov.sourceType}</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column (7 Cols): 01 What It Is, 02 Mission Role, 03 How It Works, 06 Research Contribution */}
            <div className="lg:col-span-7 space-y-6">
              {/* SECTION 01: IDENTITY & PROFILE */}
              {hardware.identity && (
                <div className="rounded-2xl border border-cyan-500/25 bg-[#06101c]/90 p-4 space-y-2 text-xs font-mono">
                  <div className="flex items-center justify-between border-b border-cyan-500/20 pb-1.5">
                    <span className="font-bold text-cyan-300 uppercase tracking-wider">
                      01 — Hardware Identity & Manufacturing
                    </span>
                    <span className="text-[10px] text-slate-400">{hardware.identity.hardwareId || hardware.id}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] pt-1">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase">Official Designation</span>
                      <span className="text-slate-200">{hardware.identity.officialName}</span>
                    </div>
                    {hardware.identity.manufacturer && (
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase">Manufacturer / Agency</span>
                        <span className="text-slate-200">{hardware.identity.manufacturer}</span>
                      </div>
                    )}
                    {hardware.identity.flightQualification && (
                      <div className="sm:col-span-2">
                        <span className="text-slate-400 block text-[10px] uppercase">Flight Qualification Standard</span>
                        <span className="text-cyan-300">{hardware.identity.flightQualification}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* SECTION 02: WHAT IS IT? */}
              <div className="rounded-2xl border border-cyan-500/25 bg-[#06101c]/90 p-5 space-y-3">
                <div className="flex items-center justify-between border-b border-cyan-500/20 pb-2">
                  <h3 className="text-xs font-mono font-bold tracking-wider uppercase text-cyan-300 flex items-center gap-2">
                    <span className="text-cyan-400 font-bold">02 —</span>
                    <span>What Is It?</span>
                  </h3>
                  <span className="text-[10px] font-mono text-slate-400">Engineering Profile</span>
                </div>

                <div className="space-y-3 text-sm text-slate-200 leading-relaxed">
                  <p>{hardware.whatIsIt.purpose}</p>

                  {hardware.whatIsIt.whyDeveloped && (
                    <div className="text-xs text-slate-300 p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                      <span className="font-mono text-cyan-400 font-bold block mb-1">Development Objective:</span>
                      {hardware.whatIsIt.whyDeveloped}
                    </div>
                  )}

                  {/* Main Components Grid */}
                  <div className="pt-1">
                    <div className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-2">
                      Primary Components & Subsystems:
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {hardware.whatIsIt.mainComponents.map((comp, i) => (
                        <div
                          key={i}
                          className="p-2.5 rounded-xl bg-[#091526]/80 border border-cyan-500/15 text-xs text-slate-300 flex items-start gap-2"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-1.5 shrink-0"></span>
                          <span>{comp}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Problem Solved */}
                  <div className="pt-2">
                    <div className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Critical Problem Solved:
                    </div>
                    <div className="p-3 rounded-xl bg-cyan-950/20 border border-cyan-500/20 text-xs text-cyan-100">
                      {hardware.whatIsIt.problemSolved}
                    </div>
                  </div>

                  {/* Scientific Principle */}
                  <div className="pt-1 text-xs text-slate-300">
                    <span className="font-mono text-cyan-400 font-semibold">Scientific Principle: </span>
                    <span>{hardware.whatIsIt.scientificPrinciple}</span>
                  </div>
                </div>
              </div>

              {/* SECTION 03: MISSION ROLE & OPERATIONAL USE */}
              <div className="rounded-2xl border border-cyan-500/25 bg-[#06101c]/90 p-5 space-y-3">
                <div className="flex items-center justify-between border-b border-cyan-500/20 pb-2">
                  <h3 className="text-xs font-mono font-bold tracking-wider uppercase text-cyan-300 flex items-center gap-2">
                    <span className="text-cyan-400 font-bold">03 —</span>
                    <span>Mission Role & Operational Deployment</span>
                  </h3>
                  <span className="text-[10px] font-mono text-slate-400">Flight Operations</span>
                </div>

                <div className="space-y-3 text-xs sm:text-sm text-slate-200 leading-relaxed">
                  <div>
                    <span className="font-mono text-cyan-400 font-semibold text-xs block mb-1">
                      Operational Mission Role:
                    </span>
                    <p className="text-xs text-slate-300">{hardware.missionUsage.role}</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono pt-1">
                    <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
                      <span className="text-slate-400 block text-[10px] uppercase">Spacecraft Location</span>
                      <span className="text-slate-200 mt-0.5 block">{hardware.missionUsage.location}</span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
                      <span className="text-slate-400 block text-[10px] uppercase">Scientific Contribution</span>
                      <span className="text-slate-200 mt-0.5 block">{hardware.missionUsage.scientificContribution}</span>
                    </div>
                  </div>

                  <div>
                    <span className="font-mono text-cyan-400 font-semibold text-xs block mb-1">
                      Diagnostic Measurements Acquired:
                    </span>
                    <p className="text-xs text-slate-300 leading-relaxed">{hardware.missionUsage.measurements}</p>
                  </div>

                  {hardware.missionUsage.operationalResults && (
                    <div className="pt-1 text-xs text-slate-400">
                      <span className="font-mono text-cyan-400 font-semibold">Operational Record: </span>
                      <span>{hardware.missionUsage.operationalResults}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* SECTION 04: HOW THE HARDWARE WORKS */}
              <div className="rounded-2xl border border-cyan-500/25 bg-[#06101c]/90 p-5 space-y-3">
                <div className="flex items-center justify-between border-b border-cyan-500/20 pb-2">
                  <h3 className="text-xs font-mono font-bold tracking-wider uppercase text-cyan-300 flex items-center gap-2">
                    <span className="text-cyan-400 font-bold">04 —</span>
                    <span>How The Hardware Works</span>
                  </h3>
                  <span className="text-[10px] font-mono text-slate-400">Physical Mechanism</span>
                </div>

                <div className="space-y-3 text-xs sm:text-sm text-slate-200 leading-relaxed">
                  <div>
                    <span className="font-mono text-cyan-400 font-semibold text-xs block mb-1">
                      Operating Principle:
                    </span>
                    <p className="text-xs text-slate-300">{hardware.howItWorks.operatingPrinciple}</p>
                  </div>

                  <div>
                    <span className="font-mono text-cyan-400 font-semibold text-xs block mb-1">
                      Internal Physical Mechanism:
                    </span>
                    <p className="text-xs text-slate-300">{hardware.howItWorks.mechanism}</p>
                  </div>

                  {(hardware.howItWorks.materials || hardware.howItWorks.sensorsDiagnostics) && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono pt-1">
                      {hardware.howItWorks.materials && (
                        <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
                          <span className="text-slate-400 block text-[10px] uppercase">Materials & Metallurgy</span>
                          <span className="text-slate-200 mt-0.5 block">{hardware.howItWorks.materials}</span>
                        </div>
                      )}
                      {hardware.howItWorks.sensorsDiagnostics && (
                        <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
                          <span className="text-slate-400 block text-[10px] uppercase">Sensors & Diagnostics</span>
                          <span className="text-slate-200 mt-0.5 block">{hardware.howItWorks.sensorsDiagnostics}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {hardware.howItWorks.operatingConditions && (
                    <div className="text-xs text-slate-400 pt-1">
                      <span className="font-mono text-cyan-400 font-semibold">Operating Envelopes: </span>
                      <span>{hardware.howItWorks.operatingConditions}</span>
                    </div>
                  )}

                  {hardware.howItWorks.technicalLimitations && (
                    <div className="text-xs text-slate-400 pt-1">
                      <span className="font-mono text-amber-400 font-semibold">Technical Limitations: </span>
                      <span>{hardware.howItWorks.technicalLimitations}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* SECTION 06: EXPERIMENTAL / MISSION CONTRIBUTION */}
              {hardware.experimentalContribution && (
                <div className="rounded-2xl border border-cyan-500/25 bg-[#06101c]/90 p-5 space-y-3">
                  <div className="flex items-center justify-between border-b border-cyan-500/20 pb-2">
                    <h3 className="text-xs font-mono font-bold tracking-wider uppercase text-cyan-300 flex items-center gap-2">
                      <span className="text-cyan-400 font-bold">06 —</span>
                      <span>Scientific & Engineering Contribution</span>
                    </h3>
                    <span className="text-[10px] font-mono text-slate-400">Research Impact</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
                    <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
                      <span className="text-cyan-400 uppercase text-[10px] font-bold block">Scientific Breakthrough</span>
                      <p className="text-slate-300 text-xs font-sans leading-relaxed">
                        {hardware.experimentalContribution.scientificBreakthrough}
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
                      <span className="text-cyan-400 uppercase text-[10px] font-bold block">Engineering Contribution</span>
                      <p className="text-slate-300 text-xs font-sans leading-relaxed">
                        {hardware.experimentalContribution.engineeringContribution}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* DEDICATED BOTTOM DECK: APPLICATIONS ON EARTH */}
          <div className="rounded-3xl border border-emerald-500/40 bg-gradient-to-b from-[#061c18]/90 via-[#041210]/95 to-[#020a08]/95 p-6 sm:p-8 space-y-6 shadow-[0_0_40px_rgba(16,185,129,0.15)] relative overflow-hidden">
            {/* Ambient Background Grid Glow */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

            {/* Header of Earth Applications Deck */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-emerald-500/30 pb-4 relative z-10">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <h3 className="text-base sm:text-lg font-black text-white font-mono tracking-wide uppercase">
                    Applications On Earth
                  </h3>
                </div>
                <p className="text-xs font-mono text-emerald-300/80 mt-1">
                  Space-to-Ground Technology Bridge · NASA Technology Transfer & Terrestrial Research Impact
                </p>
              </div>

              <div className="flex items-center gap-2">
                {hardware.earthApplications.evidenceStatus === 'VERIFIED' ? (
                  <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-500/20 text-emerald-200 border border-emerald-400/50 flex items-center gap-1.5 shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    Verified Commercial Spinoff
                  </span>
                ) : hardware.earthApplications.evidenceStatus === 'RESEARCH_APPLICATION' ? (
                  <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-sky-500/20 text-sky-200 border border-sky-400/50 flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4 text-sky-400" />
                    Documented Research Application
                  </span>
                ) : (
                  <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-400/50 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    POTENTIAL APPLICATION — NOT A DOCUMENTED NASA SPINOFF
                  </span>
                )}
              </div>
            </div>

            {/* Underlying Capability & Terrestrial Mechanism */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
              <div className="p-4 rounded-2xl bg-black/40 border border-emerald-500/20 space-y-1">
                <span className="text-[10px] font-mono uppercase font-bold tracking-wider text-emerald-400 block">
                  Underlying Spaceflight Technology Capability
                </span>
                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                  {hardware.earthApplications.underlyingCapability}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-black/40 border border-emerald-500/20 space-y-1">
                <span className="text-[10px] font-mono uppercase font-bold tracking-wider text-emerald-400 block">
                  How This Functions in Terrestrial Applications
                </span>
                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                  {hardware.earthApplications.howItWorksOnEarth}
                </p>
              </div>
            </div>

            {/* TIER A: Documented NASA Spinoffs & Commercial Licenses */}
            {hardware.earthApplications.documentedTransfers.length > 0 && (
              <div className="space-y-3 relative z-10">
                <div className="text-xs font-mono font-bold tracking-wider uppercase text-emerald-300 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Documented Commercial Spinoffs & Licensing Transfers</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {hardware.earthApplications.documentedTransfers.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-2xl bg-[#061814]/90 border border-emerald-500/30 hover:border-emerald-400/60 transition space-y-2 flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <span className="text-xs font-bold text-white line-clamp-1">{item.title}</span>
                          {item.caseId && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shrink-0">
                              {item.caseId}
                            </span>
                          )}
                        </div>

                        <div className="text-[10px] font-mono text-emerald-400/90 mb-2">
                          Category: {item.category}
                          {item.partner && ` · Partner: ${item.partner}`}
                        </div>

                        <p className="text-xs text-slate-300 leading-relaxed">{item.description}</p>
                      </div>

                      {item.sourceUrl && (
                        <div className="pt-3 border-t border-emerald-500/15 flex justify-end">
                          <a
                            href={item.sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs font-mono text-emerald-300 hover:text-emerald-200 underline font-semibold"
                          >
                            <span>Official NASA Spinoff Record</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TIER B: Documented Earth Applications of Research */}
            {hardware.earthApplications.researchApplications && hardware.earthApplications.researchApplications.length > 0 && (
              <div className="space-y-3 relative z-10">
                <div className="text-xs font-mono font-bold tracking-wider uppercase text-sky-300 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-sky-400" />
                  <span>Documented Terrestrial Applications of NASA Research</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {hardware.earthApplications.researchApplications.map((res, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-2xl bg-[#061320]/90 border border-sky-500/30 space-y-2 flex flex-col justify-between"
                    >
                      <div>
                        <div className="text-xs font-bold text-white">{res.title}</div>
                        <div className="text-[10px] font-mono text-sky-400/90 mb-1">
                          Target Field: {res.field}
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed">{res.description}</p>
                        <div className="mt-2 p-2 rounded-xl bg-black/40 border border-sky-500/20 text-[11px] text-slate-300">
                          <span className="font-mono text-sky-400 font-semibold">Research Link: </span>
                          {res.directConnection}
                        </div>
                      </div>

                      {res.citationUrl && (
                        <div className="pt-2 border-t border-sky-500/15 flex justify-end">
                          <a
                            href={res.citationUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] font-mono text-sky-300 hover:text-sky-200 underline"
                          >
                            <span>Supporting Technical Document</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TIER C: Scientifically Justified Potential Applications */}
            {hardware.earthApplications.potentialApplications.length > 0 && (
              <div className="space-y-3 relative z-10">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-mono font-bold tracking-wider uppercase text-cyan-300 flex items-center gap-2">
                    <Wrench className="w-4 h-4 text-cyan-400" />
                    <span>Scientifically Grounded Potential Applications</span>
                  </div>
                  <span className="text-[10px] font-mono text-amber-300/90 px-2 py-0.5 rounded bg-amber-500/15 border border-amber-500/30">
                    POTENTIAL APPLICATION — NOT A DOCUMENTED NASA SPINOFF
                  </span>
                </div>

                <div className="space-y-3">
                  {hardware.earthApplications.potentialApplications.map((pot, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-2xl bg-black/40 border border-cyan-500/25 space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white text-sm">{pot.field}</span>
                        <span className="text-[10px] font-mono text-slate-400">Terrestrial Translation</span>
                      </div>

                      <p className="text-slate-300 leading-relaxed">{pot.description}</p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 font-mono text-[11px]">
                        <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-800">
                          <span className="text-slate-400 block text-[9px] uppercase">Problem Addressed on Earth</span>
                          <span className="text-slate-200 mt-0.5 block">{pot.problemAddressed}</span>
                        </div>
                        <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-800">
                          <span className="text-cyan-400 block text-[9px] uppercase">Terrestrial Adaptation Needed</span>
                          <span className="text-slate-200 mt-0.5 block">{pot.adaptationNeeded}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Target Industries Tag Cloud */}
            <div className="pt-2 relative z-10 border-t border-emerald-500/20 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-mono uppercase font-bold text-slate-400">
                  Target Terrestrial Industries:
                </span>
                {hardware.earthApplications.targetIndustries.map((ind, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 rounded-lg text-xs font-mono bg-emerald-950/60 text-emerald-300 border border-emerald-500/30"
                  >
                    {ind}
                  </span>
                ))}
              </div>

              {onAskAI && (
                <button
                  onClick={() => onAskAI(hardware)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono font-bold bg-gradient-to-r from-cyan-500 to-sky-500 text-slate-950 hover:shadow-[0_0_20px_rgba(6,182,212,0.5)] transition cursor-pointer"
                >
                  <Bot className="w-4 h-4" />
                  <span>Consult Aether-SI About This Hardware</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="px-6 sm:px-8 py-3.5 border-t border-cyan-500/20 bg-[#050c18] flex items-center justify-between text-xs font-mono text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
            <span>NASA Hardware Discovery & Earth Applications Platform</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden sm:inline text-slate-500">Press Esc to exit</span>
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 transition cursor-pointer font-bold"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
