import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  Cpu,
  Sparkles,
  Layers,
  Filter,
  RefreshCw,
  X,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Wrench,
  Radio,
  BookOpen,
  Camera,
  Globe2,
} from 'lucide-react';
import {
  HardwareItem,
  HardwareCategory,
  RecordState,
  HardwareSearchStatus,
  HardwareSearchResponse,
} from '../../types/hardware';
import { CURATED_HARDWARE_REGISTRY } from '../../data/hardwareRegistry';
import { HardwareCard } from './HardwareCard';
import { HardwareDetailModal } from './HardwareDetailModal';

interface HardwareExplorerViewProps {
  onAskAIAboutHardware?: (hardware: HardwareItem) => void;
}

const CATEGORIES: Array<'All' | HardwareCategory> = [
  'All',
  'Scientific Instruments',
  'Experimental Apparatus',
  'Sensors & Diagnostics',
  'Thermal & Power Systems',
  'Robotics & Mechanisms',
  'Spacecraft Platforms',
];

const SUGGESTED_QUERIES = [
  { label: 'Apollo 11 (PLSS & PSEP)', query: 'Apollo 11' },
  { label: 'Perseverance (MOXIE & SHERLOC)', query: 'Perseverance' },
  { label: 'Hubble (NICMOS & FGS)', query: 'Hubble' },
  { label: 'Curiosity (SAM & CheMin)', query: 'Curiosity' },
  { label: 'Combustion Rack (CIR)', query: 'CIR' },
  { label: 'Cold Atom Lab (CAL)', query: 'CAL' },
  { label: 'Saffire Flow Duct', query: 'Saffire' },
  { label: 'James Webb Space Telescope', query: 'James Webb' },
  { label: 'Voyager Golden Record', query: 'Voyager' },
];

export const HardwareExplorerView: React.FC<HardwareExplorerViewProps> = ({
  onAskAIAboutHardware,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'All' | HardwareCategory>('All');
  const [selectedStateFilter, setSelectedStateFilter] = useState<'ALL' | RecordState>('ALL');
  const [filterSpinoffOnly, setFilterSpinoffOnly] = useState(false);
  const [hardwareItems, setHardwareItems] = useState<HardwareItem[]>(CURATED_HARDWARE_REGISTRY);
  const [selectedHardware, setSelectedHardware] = useState<HardwareItem | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [searchStatus, setSearchStatus] = useState<{
    status: HardwareSearchStatus;
    message: string;
    classification?: string;
  } | null>(null);

  // Debounce query input to avoid spamming searches
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery.trim());
    }, 350);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Execute live search against server hardware endpoint
  useEffect(() => {
    let isCancelled = false;

    async function performSearch() {
      if (!debouncedQuery) {
        setHardwareItems(CURATED_HARDWARE_REGISTRY);
        setSearchStatus(null);
        setIsLoading(false);
        setErrorMessage(null);
        return;
      }

      setIsLoading(true);
      setErrorMessage(null);

      try {
        const resp = await fetch(`/api/hardware/search?q=${encodeURIComponent(debouncedQuery)}`);
        if (!resp.ok) {
          throw new Error(`Server returned HTTP ${resp.status}`);
        }
        const data: HardwareSearchResponse = await resp.json();
        if (!isCancelled) {
          setHardwareItems(Array.isArray(data.results) ? data.results : []);
          setSearchStatus({
            status: data.status,
            message: data.message,
            classification: data.classification,
          });
        }
      } catch (err: any) {
        if (!isCancelled) {
          // If offline or endpoint fails, fallback to local search on curated registry
          setSearchStatus({
            status: 'ALL_SOURCES_FAILED',
            message: 'Unable to retrieve live hardware information right now. Previously verified records may still be available.',
            classification: 'SUSPICIOUS_QUERY',
          });
          const cleanQ = debouncedQuery.toLowerCase();
          const localFiltered = CURATED_HARDWARE_REGISTRY.filter((h) => {
            return (
              h.name.toLowerCase().includes(cleanQ) ||
              (h.acronym && h.acronym.toLowerCase().includes(cleanQ)) ||
              h.mission.toLowerCase().includes(cleanQ) ||
              (h.experimentName && h.experimentName.toLowerCase().includes(cleanQ)) ||
              h.category.toLowerCase().includes(cleanQ) ||
              h.whatIsIt.purpose.toLowerCase().includes(cleanQ) ||
              (h.identity?.officialName && h.identity.officialName.toLowerCase().includes(cleanQ)) ||
              (h.identity?.hardwareId && h.identity.hardwareId.toLowerCase().includes(cleanQ))
            );
          });
          setHardwareItems(localFiltered);
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }

    performSearch();

    return () => {
      isCancelled = true;
    };
  }, [debouncedQuery]);

  // Filter items by category, record state, and spinoff/research filter
  const filteredItems = useMemo(() => {
    return hardwareItems.filter((item) => {
      if (selectedCategory !== 'All' && item.category !== selectedCategory) {
        return false;
      }
      if (selectedStateFilter !== 'ALL' && item.recordState !== selectedStateFilter) {
        return false;
      }
      if (
        filterSpinoffOnly &&
        item.earthApplications.evidenceStatus !== 'VERIFIED' &&
        item.earthApplications.evidenceStatus !== 'RESEARCH_APPLICATION'
      ) {
        return false;
      }
      return true;
    });
  }, [hardwareItems, selectedCategory, selectedStateFilter, filterSpinoffOnly]);

  const liveItemCount = useMemo(() => {
    return hardwareItems.filter((i) => i.recordState === 'LIVE_DATA').length;
  }, [hardwareItems]);

  return (
    <div className="space-y-6">
      {/* Platform Header & Mission Identity */}
      <div className="relative rounded-3xl bg-gradient-to-b from-[#091526]/90 via-[#060c18]/90 to-[#03060c]/90 border border-cyan-500/30 p-6 sm:p-8 backdrop-blur-2xl shadow-[0_0_50px_rgba(6,182,212,0.15)] overflow-hidden">
        {/* Subtle Background Radial Glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3 py-1 rounded-full text-[11px] font-mono font-bold tracking-wider uppercase bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 flex items-center gap-1.5 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
                <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                NASA Hardware Discovery & Earth Applications
              </span>
              <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                Live NASA Discovery Active
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-wide font-mono">
              NASA HARDWARE EXPLORER
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
              Discover the engineering behind NASA missions and the technologies that bring space innovation
              to Earth. Search across Apollo, ISS, Mars Rovers, Artemis, and Space Observatories to uncover
              actual physical apparatus, authentic photographs, and verified technology transfers.
            </p>
          </div>

          {/* Quick Metrics Cards */}
          <div className="grid grid-cols-3 gap-3 shrink-0">
            <div className="p-3.5 rounded-2xl bg-black/40 border border-cyan-500/20 text-center">
              <div className="text-xl sm:text-2xl font-black text-cyan-400 font-mono">
                {hardwareItems.length}
              </div>
              <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider mt-0.5">
                Discovered
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-black/40 border border-cyan-500/20 text-center">
              <div className="text-xl sm:text-2xl font-black text-emerald-400 font-mono">
                {liveItemCount > 0 ? liveItemCount : '100%'}
              </div>
              <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider mt-0.5">
                {liveItemCount > 0 ? 'Live Fetched' : 'Verified'}
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-black/40 border border-cyan-500/20 text-center">
              <div className="text-xl sm:text-2xl font-black text-sky-400 font-mono">Dual-Use</div>
              <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider mt-0.5">
                Earth Bridge
              </div>
            </div>
          </div>
        </div>

        {/* Dedicated Search Input Section */}
        <div className="mt-6 pt-6 border-t border-cyan-500/20 relative z-10 space-y-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-cyan-400">
              <Search className="w-5 h-5" />
            </div>

            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search any NASA mission, spacecraft, instrument, or experiment (e.g. Apollo 11, Hubble, Perseverance, Curiosity, CIR, Saffire, CAL)..."
              className="w-full pl-12 pr-12 py-3.5 rounded-2xl bg-[#040812]/90 border border-cyan-500/40 text-slate-100 placeholder-slate-500 text-sm font-mono focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/30 shadow-[0_0_20px_rgba(6,182,212,0.15)] transition"
            />

            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-white transition cursor-pointer"
                title="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            {isLoading && (
              <div className="absolute inset-y-0 right-10 flex items-center text-cyan-400 animate-spin">
                <RefreshCw className="w-4 h-4" />
              </div>
            )}
          </div>

          {/* Quick Suggestion Chips */}
          <div className="flex items-center gap-2 flex-wrap text-xs font-mono">
            <span className="text-slate-400 flex items-center gap-1 text-[11px]">
              <Sparkles className="w-3 h-3 text-cyan-400" />
              Suggested Missions & Observatories:
            </span>
            {SUGGESTED_QUERIES.map((s, idx) => (
              <button
                key={idx}
                onClick={() => setSearchQuery(s.query)}
                className={`px-2.5 py-1 rounded-lg border text-[11px] transition cursor-pointer ${
                  searchQuery.toLowerCase() === s.query.toLowerCase()
                    ? 'bg-cyan-500/25 border-cyan-400 text-cyan-200 shadow-[0_0_10px_rgba(6,182,212,0.3)]'
                    : 'bg-slate-900/60 hover:bg-slate-800 border-slate-700/60 text-slate-300 hover:text-white'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Category Pills & Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#060c18]/80 p-3 rounded-2xl border border-cyan-500/20 backdrop-blur-xl">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 custom-scrollbar">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold whitespace-nowrap transition cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-cyan-500/25 text-cyan-300 border border-cyan-400/50 shadow-[0_0_12px_rgba(6,182,212,0.25)]'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 border border-transparent'
              }`}
            >
              {cat === 'All' ? 'All Categories' : cat}
            </button>
          ))}
        </div>

        {/* Source State & Spinoff Toggles */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <button
            onClick={() => setFilterSpinoffOnly((prev) => !prev)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-bold border transition cursor-pointer ${
              filterSpinoffOnly
                ? 'bg-emerald-500/25 text-emerald-300 border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                : 'bg-slate-900/60 text-slate-400 border-slate-700/60 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Spinoffs & Applications Only</span>
          </button>
        </div>
      </div>

      {/* Results Header Count & Source Indicator */}
      <div className="flex items-center justify-between text-xs font-mono text-slate-400 px-2 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span>
            Showing <span className="text-cyan-300 font-bold">{filteredItems.length}</span>{' '}
            {filteredItems.length === 1 ? 'hardware system' : 'hardware systems'}
            {searchQuery && (
              <span>
                {' '}
                for &quot;<span className="text-white">{searchQuery}</span>&quot;
              </span>
            )}
          </span>

          {liveItemCount > 0 && (
            <span className="px-2 py-0.5 rounded text-[10px] bg-cyan-950/80 text-cyan-300 border border-cyan-400/30">
              Includes {liveItemCount} Live Discovered
            </span>
          )}
        </div>

        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="text-cyan-400 hover:text-cyan-300 underline cursor-pointer"
          >
            Reset query
          </button>
        )}
      </div>

      {/* Partial Source Failure Notice Banner */}
      {searchStatus?.status === 'PARTIAL_SOURCE_FAILURE' && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 flex items-center gap-3 text-amber-200 text-xs font-mono shadow-[0_0_20px_rgba(245,158,11,0.1)]">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
          <span>Some NASA research sources are temporarily unavailable. Results from available sources are still shown.</span>
        </div>
      )}

      {/* Hardware Card Grid */}
      {filteredItems.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((hardware) => (
            <HardwareCard
              key={hardware.id}
              hardware={hardware}
              onInspect={(hw) => setSelectedHardware(hw)}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-3xl border border-cyan-500/20 bg-[#060c18]/90 p-8 sm:p-12 text-center space-y-4 backdrop-blur-xl">
          <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-400/30 flex items-center justify-center text-cyan-400 mx-auto">
            {searchStatus?.status === 'GIBBERISH' ? (
              <AlertCircle className="w-7 h-7 text-amber-400" />
            ) : searchStatus?.status === 'ALL_SOURCES_FAILED' ? (
              <AlertTriangle className="w-7 h-7 text-amber-400" />
            ) : (
              <Cpu className="w-7 h-7" />
            )}
          </div>

          <div className="space-y-1 max-w-md mx-auto">
            <h3 className="text-base font-bold text-white font-mono">
              {searchStatus?.status === 'GIBBERISH'
                ? 'Invalid Search Query'
                : searchStatus?.status === 'ALL_SOURCES_FAILED'
                ? 'NASA Sources Unavailable'
                : 'No Relevant Hardware Records Found'}
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              {searchStatus?.message ||
                (searchQuery
                  ? 'No relevant hardware records were found for this search. Try a mission name, instrument acronym or technical keyword.'
                  : 'Enter a NASA mission, experiment, instrument or hardware name.')}
            </p>
          </div>

          <div className="pt-2 flex justify-center gap-2 flex-wrap">
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('All');
                setSelectedStateFilter('ALL');
                setFilterSpinoffOnly(false);
              }}
              className="px-4 py-2 rounded-xl text-xs font-mono font-bold bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-400/40 transition cursor-pointer"
            >
              Reset All Filters
            </button>
          </div>
        </div>
      )}

      {/* Hardware Detail Modal */}
      <HardwareDetailModal
        hardware={selectedHardware}
        onClose={() => setSelectedHardware(null)}
        onAskAI={onAskAIAboutHardware}
      />
    </div>
  );
};
