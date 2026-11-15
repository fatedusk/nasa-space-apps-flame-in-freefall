import React, { useState, useEffect, useRef } from 'react';
import {
  Database,
  Search,
  RefreshCw,
  Zap,
  Loader2,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  Filter,
  X,
  Play,
  BookOpen,
  Flame,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  FlaskConical,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { PSI_STUDIES } from '../data/psiStudies';
import { PSIStudy } from '../types';
import {
  fetchUniversalNasaRecords,
  validateSearchInput,
  validateAerospaceQuery,
  scoreAndRankStudies,
  NASA_ACRONYM_MAP,
} from '../utils/predictorEngine';

interface VaultViewProps {
  studies?: PSIStudy[];
  onMergeStudies?: (newRecords: PSIStudy[]) => void;
  externalSearchQuery?: string;
  onSearchQueryChange?: (query: string) => void;
  onOpenDossier: (studyId: string) => void;
  onLoadIntoPredictor: (study: PSIStudy) => void;
}

export const VaultView: React.FC<VaultViewProps> = ({
  studies: propStudies,
  onMergeStudies,
  externalSearchQuery,
  onSearchQueryChange,
  onOpenDossier,
  onLoadIntoPredictor,
}) => {
  const [localStudies, setLocalStudies] = useState<PSIStudy[]>(PSI_STUDIES);
  const studies = propStudies || localStudies;

  // Collapsible Knowledge Hub Tray
  const [isKnowledgeHubOpen, setIsKnowledgeHubOpen] = useState<boolean>(false);

  // UNIFIED DISCOVERY CONSOLE MODE: 'fetch' (Live NASA Uplink) vs 'search' (Filter Loaded Archive)
  const [consoleMode, setConsoleMode] = useState<'fetch' | 'search'>('fetch');
  const [commandInput, setCommandInput] = useState<string>(externalSearchQuery || '');
  const [isFetchingLive, setIsFetchingLive] = useState<boolean>(false);
  const [fetchStatusMessage, setFetchStatusMessage] = useState<string>(
    'Ready to query official NASA PSI & NTRS repositories'
  );

  // Active Primary Bucket: 'ALL' | 'PSI' | 'NTRS'
  const [activeBucket, setActiveBucket] = useState<'ALL' | 'PSI' | 'NTRS'>('ALL');

  // Active Fetched Batch Isolation
  const [activeFetchedBatch, setActiveFetchedBatch] = useState<PSIStudy[] | null>(null);
  const [lastFetchedTopic, setLastFetchedTopic] = useState<string>('');

  // Pagination state
  const [pageOffset, setPageOffset] = useState<number>(0);
  const PAGE_SIZE = 10;
  const [hasMoreToFetch, setHasMoreToFetch] = useState<boolean>(true);

  // Active In-Vault Keyword/Sentence Search Query
  const [activeVaultSearchQuery, setActiveVaultSearchQuery] = useState<string>(externalSearchQuery || '');
  const [highlightedDossierId, setHighlightedDossierId] = useState<string | null>(null);

  // Filters & Tabs
  const [domainFilter, setDomainFilter] = useState<'ALL' | 'EXPERIMENT' | 'INCIDENT' | 'SPINOFF'>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // Refs for scrolling to matched cards
  const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  useEffect(() => {
    if (externalSearchQuery !== undefined && externalSearchQuery !== commandInput) {
      setCommandInput(externalSearchQuery);
      setActiveVaultSearchQuery(externalSearchQuery);
      if (externalSearchQuery.trim()) {
        setConsoleMode('search');
      }
    }
  }, [externalSearchQuery]);

  // Counts across categories and domains
  const psiCount = studies.filter(
    (s) => s.sourceType === 'PSI' || s.sourceType === 'PSI_CORE' || (!s.isNtrsCitation && s.dossierType !== 'PUBLICATION')
  ).length;
  const ntrsCount = studies.filter(
    (s) => s.sourceType === 'NTRS' || s.isNtrsCitation || s.dossierType === 'PUBLICATION'
  ).length;

  const experimentCount = studies.filter(
    (s) => s.dossierType === 'EXPERIMENT' || (!s.dossierType && s.category !== 'Incident' && s.category !== 'Spinoff')
  ).length;
  const incidentCount = studies.filter((s) => s.dossierType === 'INCIDENT' || s.category === 'Incident').length;
  const spinoffCount = studies.filter((s) => s.dossierType === 'SPINOFF' || s.category === 'Spinoff').length;

  // Filter studies based on isolated fetched batch, bucket, domain, category, and in-vault search
  const baseList = activeFetchedBatch !== null ? activeFetchedBatch : studies;
  const filteredStudies = (activeVaultSearchQuery.trim()
    ? scoreAndRankStudies(baseList, activeVaultSearchQuery)
    : baseList
  ).filter((study) => {
    // Primary Bucket filter
    if (activeBucket === 'PSI') {
      const isPsi = study.sourceType === 'PSI' || study.sourceType === 'PSI_CORE' || (!study.isNtrsCitation && study.dossierType !== 'PUBLICATION');
      if (!isPsi) return false;
    } else if (activeBucket === 'NTRS') {
      const isNtrs = study.sourceType === 'NTRS' || study.isNtrsCitation || study.dossierType === 'PUBLICATION';
      if (!isNtrs) return false;
    }

    // Domain filter (when not in isolated batch)
    if (activeFetchedBatch === null) {
      if (domainFilter === 'EXPERIMENT') {
        const isExp =
          study.dossierType === 'EXPERIMENT' ||
          (!study.dossierType && study.category !== 'Incident' && study.category !== 'Spinoff');
        if (!isExp) return false;
      } else if (domainFilter === 'INCIDENT') {
        const isInc = study.dossierType === 'INCIDENT' || study.category === 'Incident';
        if (!isInc) return false;
      } else if (domainFilter === 'SPINOFF') {
        const isSpin = study.dossierType === 'SPINOFF' || study.category === 'Spinoff';
        if (!isSpin) return false;
      }
    }

    // Category / Focus Pillar filter
    const matchesCategory = selectedCategory === 'ALL' || study.category === selectedCategory;
    if (!matchesCategory) return false;

    return true;
  });

  // Action: Reset Fetched Isolation and return to Full Vault Archive
  const handleResetToAllRecords = () => {
    setActiveFetchedBatch(null);
    setLastFetchedTopic('');
    setActiveBucket('ALL');
    setDomainFilter('ALL');
    setSelectedCategory('ALL');
    setPageOffset(0);
    setHasMoreToFetch(true);
  };

  // Action: Execute Dedicated In-Vault Keyword & Sentence Search
  const handleExecuteVaultSearch = (queryOverride?: string) => {
    const q = (queryOverride ?? commandInput).trim();
    setActiveVaultSearchQuery(q);
    onSearchQueryChange?.(q);

    if (!q) {
      setHighlightedDossierId(null);
      return;
    }

    const candidateList = activeFetchedBatch !== null ? activeFetchedBatch : studies;
    const rankedMatches = scoreAndRankStudies(candidateList, q);

    if (rankedMatches.length > 0) {
      const bestMatch = rankedMatches[0];
      setHighlightedDossierId(bestMatch.id);
      setTimeout(() => {
        const el = cardRefs.current.get(bestMatch.id);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
    } else {
      setHighlightedDossierId(null);
    }
  };

  // Action: Clear In-Vault Search
  const handleClearVaultSearch = () => {
    setCommandInput('');
    setActiveVaultSearchQuery('');
    setHighlightedDossierId(null);
    onSearchQueryChange?.('');
  };

  // Action: Execute Live NASA PSI & NTRS Fetch with Pagination
  // Compliant with Phase 15: Validates technical safety/length, never rejects unfamiliar NASA research topics
  const handleFetchLiveNasa = async (overrideTopic?: string, isLoadMore = false) => {
    const targetTopic = (overrideTopic ?? commandInput).trim();

    const validation = validateSearchInput(targetTopic || 'microgravity combustion');
    if (!validation.valid) {
      setFetchStatusMessage(validation.reason || 'Enter a research topic, investigation name, acronym or publication identifier.');
      return;
    }
    const cleanTopic = validation.sanitized!;

    setIsFetchingLive(true);
    setHighlightedDossierId(null);

    const newOffset = isLoadMore ? pageOffset + PAGE_SIZE : 0;
    setFetchStatusMessage('Searching NASA research repositories...');

    try {
      const liveRecords = await fetchUniversalNasaRecords(cleanTopic, PAGE_SIZE, newOffset);

      if (liveRecords.length > 0) {
        if (onMergeStudies) {
          onMergeStudies(liveRecords);
        } else {
          const existingIds = new Set(localStudies.map((s) => s.id.toUpperCase()));
          const uniqueNew = liveRecords.filter((r) => !existingIds.has(r.id.toUpperCase()));
          setLocalStudies((prev) => [...uniqueNew, ...prev]);
        }

        if (isLoadMore && activeFetchedBatch) {
          const existingBatchIds = new Set(activeFetchedBatch.map((s) => s.id.toUpperCase()));
          const additional = liveRecords.filter((r) => !existingBatchIds.has(r.id.toUpperCase()));
          setActiveFetchedBatch([...activeFetchedBatch, ...additional]);
        } else {
          setActiveFetchedBatch(liveRecords);
        }

        setLastFetchedTopic(cleanTopic);
        setPageOffset(newOffset);
        setHasMoreToFetch(liveRecords.length >= PAGE_SIZE);

        setFetchStatusMessage(
          `✓ Retrieved & verified ${liveRecords.length} authentic NASA dossiers for "${cleanTopic}"`
        );
      } else {
        setHasMoreToFetch(false);
        if (!isLoadMore) {
          setFetchStatusMessage(
            'No matching records were found in this NASA source. Try a different keyword, title or identifier.'
          );
        } else {
          setFetchStatusMessage(`✓ All available records retrieved for "${cleanTopic}".`);
        }
      }
    } catch (err) {
      console.warn('Live NASA fetch notice:', err);
      setFetchStatusMessage(
        'Unable to retrieve live NASA research information right now. Previously verified cached records may still be available.'
      );
    } finally {
      setIsFetchingLive(false);
    }
  };

  // Featured investigations for quick-access shelf (matching user mockup)
  const featuredInvestigations = studies.filter(
    (s) =>
      s.id === 'PSI-SLICE-01' ||
      s.id === 'PSI-SAF-06' ||
      s.id === 'PSI-BASS-02' ||
      s.id === 'PSI-FLEX-02' ||
      s.id === 'PSI-SOFE-01'
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ============================================================== */}
      {/* SECTION 0: RESEARCH DOSSIERS PAGE HEADER & SUBTITLE             */}
      {/* ============================================================== */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-mono uppercase tracking-widest text-slate-400 font-bold block">
            FLAME // FREEFALL
          </span>
          <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-950/60 text-emerald-400 border border-emerald-500/50 font-bold shadow-[0_0_12px_rgba(16,185,129,0.3)]">
            Target experience
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          Research Dossiers
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 font-sans">
          Explore NASA's physical science investigations and technical publications.
        </p>
      </div>

      {/* ============================================================== */}
      {/* SEARCH / FETCH DISCOVERY INPUT (MATCHING MOCKUP)                */}
      {/* ============================================================== */}
      <div className="bg-[#050b14]/95 backdrop-blur-2xl border-2 border-cyan-500/40 rounded-2xl p-4 sm:p-5 shadow-[0_0_35px_rgba(6,182,212,0.12)] space-y-3">
        {/* Input Bar */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-8 relative">
            <Search className="w-4 h-4 text-cyan-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={commandInput}
              onChange={(e) => {
                setCommandInput(e.target.value);
                if (consoleMode === 'search') {
                  handleExecuteVaultSearch(e.target.value);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  if (consoleMode === 'fetch') {
                    handleFetchLiveNasa();
                  } else {
                    handleExecuteVaultSearch();
                  }
                }
              }}
              placeholder="Search NASA research (e.g. Saffire, PMMA, BASS, droplet, boiling, crystals, Apollo)..."
              className="w-full bg-black border border-cyan-500/50 focus:border-cyan-300 rounded-xl pl-10 pr-10 py-3 text-xs sm:text-sm text-white focus:outline-none transition shadow-inner"
            />
            {commandInput && (
              <button
                onClick={() => {
                  setCommandInput('');
                  handleClearVaultSearch();
                }}
                className="absolute right-3 top-3 text-slate-500 hover:text-white transition p-1 cursor-pointer"
                title="Clear input"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Action Buttons */}
          <div className="md:col-span-4 flex items-center gap-2">
            <button
              onClick={() => handleFetchLiveNasa()}
              disabled={isFetchingLive}
              className="flex-1 bg-gradient-to-r from-cyan-400 via-sky-400 to-cyan-500 hover:brightness-110 text-slate-950 font-bold text-xs font-mono uppercase tracking-wider rounded-xl px-3 py-3 transition shadow-[0_0_20px_rgba(6,182,212,0.3)] flex items-center justify-center gap-1.5 disabled:opacity-60 cursor-pointer"
            >
              {isFetchingLive ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Fetching...</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 fill-slate-950" />
                  <span>Fetch NASA</span>
                </>
              )}
            </button>
            <button
              onClick={() => handleExecuteVaultSearch()}
              className="px-3.5 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 font-mono text-xs font-bold transition cursor-pointer"
              title="Search already loaded records"
            >
              Search
            </button>
          </div>
        </div>

        {/* Optional Research Suggestions (Phase 15: Never blocks arbitrary user queries) */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1 text-[11px] font-mono">
          <span className="text-slate-500 shrink-0 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-cyan-400" /> Suggestions:
          </span>
          {[
            { label: 'Structure & Liftoff (SLICE)', query: 'Structure and Liftoff in Combustion Experiment' },
            { label: 'SLICE', query: 'SLICE' },
            { label: 'Smoke Point (SPICE)', query: 'SPICE' },
            { label: 'Flame Liftoff', query: 'flame liftoff' },
            { label: 'Diffusion Flames', query: 'diffusion flames' },
            { label: 'Combustion Science', query: 'Combustion Science' },
            { label: 'Boiling & Bubbles', query: 'boiling' },
            { label: 'Plant Growth', query: 'plant growth' },
            { label: 'Methane Kinetics', query: 'methane' },
          ].map((sug) => (
            <button
              key={sug.label}
              onClick={() => {
                setCommandInput(sug.query);
                handleFetchLiveNasa(sug.query);
              }}
              className="px-2.5 py-1 rounded-lg bg-slate-900/90 border border-slate-800 hover:border-cyan-400 text-slate-300 hover:text-cyan-200 transition shrink-0 cursor-pointer text-[10px]"
            >
              {sug.label}
            </button>
          ))}
        </div>

        {/* Live Status Strip */}
        <div className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-black/60 border border-cyan-500/20 text-xs font-mono text-cyan-300">
          <div className="flex items-center gap-2 truncate">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shrink-0" />
            <span className="truncate text-[11px]">{fetchStatusMessage}</span>
          </div>
          {activeFetchedBatch !== null && (
            <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-200 font-bold border border-cyan-400/40 whitespace-nowrap">
              {filteredStudies.length} Dossiers Isolated
            </span>
          )}
        </div>
      </div>

      {/* ============================================================== */}
      {/* SECTION 1: TWO PRIMARY CATEGORY BUCKETS (MATCHING MOCKUP)      */}
      {/* ============================================================== */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Bucket 1: PSI Investigations */}
        <button
          onClick={() => setActiveBucket(activeBucket === 'PSI' ? 'ALL' : 'PSI')}
          className={`p-5 rounded-2xl border text-left transition-all duration-300 cursor-pointer flex items-start gap-4 relative overflow-hidden group ${
            activeBucket === 'PSI'
              ? 'bg-gradient-to-br from-[#041a2e]/95 via-[#021020]/95 to-black border-cyan-400 shadow-[0_0_35px_rgba(6,182,212,0.35)] ring-1 ring-cyan-400/80'
              : 'bg-gradient-to-br from-[#061224]/85 via-[#030914]/90 to-black/95 border-cyan-500/30 hover:border-cyan-400/70 hover:shadow-[0_0_25px_rgba(6,182,212,0.2)]'
          }`}
        >
          <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-cyan-500/25 to-cyan-900/30 border border-cyan-400/50 flex items-center justify-center text-cyan-300 shrink-0 shadow-[0_0_20px_rgba(6,182,212,0.35)] group-hover:scale-105 group-hover:border-cyan-300 transition duration-300">
            <FlaskConical className="w-6 h-6 text-cyan-300" />
          </div>
          <div className="space-y-1.5 min-w-0 flex-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono font-black uppercase tracking-widest text-cyan-400">
                Multiple
              </span>
              <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-400/50">
                {psiCount} Flight Records
              </span>
            </div>
            <h3 className="text-lg font-bold text-white group-hover:text-cyan-200 transition">
              PSI Investigations
            </h3>
            <p className="text-xs text-slate-400 leading-snug">
              Research experiments and flight investigations
            </p>
          </div>
          <div className="absolute -bottom-8 -right-8 w-24 h-24 bg-cyan-500/10 rounded-full blur-xl group-hover:bg-cyan-500/20 transition pointer-events-none" />
        </button>

        {/* Bucket 2: NTRS Publications */}
        <button
          onClick={() => setActiveBucket(activeBucket === 'NTRS' ? 'ALL' : 'NTRS')}
          className={`p-5 rounded-2xl border text-left transition-all duration-300 cursor-pointer flex items-start gap-4 relative overflow-hidden group ${
            activeBucket === 'NTRS'
              ? 'bg-gradient-to-br from-[#021830]/95 via-[#020e1f]/95 to-black border-sky-400 shadow-[0_0_35px_rgba(14,165,233,0.35)] ring-1 ring-sky-400/80'
              : 'bg-gradient-to-br from-[#061224]/85 via-[#030914]/90 to-black/95 border-sky-500/30 hover:border-sky-400/70 hover:shadow-[0_0_25px_rgba(14,165,233,0.2)]'
          }`}
        >
          <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-sky-500/25 to-sky-900/30 border border-sky-400/50 flex items-center justify-center text-sky-300 shrink-0 shadow-[0_0_20px_rgba(14,165,233,0.35)] group-hover:scale-105 group-hover:border-sky-300 transition duration-300">
            <BookOpen className="w-6 h-6 text-sky-300" />
          </div>
          <div className="space-y-1.5 min-w-0 flex-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono font-black uppercase tracking-widest text-sky-400">
                Multiple
              </span>
              <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-sky-500/20 text-sky-300 font-bold border border-sky-400/50">
                {ntrsCount} Publications
              </span>
            </div>
            <h3 className="text-lg font-bold text-white group-hover:text-sky-200 transition">
              NTRS Publications
            </h3>
            <p className="text-xs text-slate-400 leading-snug">
              NASA technical reports and scientific papers
            </p>
          </div>
          <div className="absolute -bottom-8 -right-8 w-24 h-24 bg-sky-500/10 rounded-full blur-xl group-hover:bg-sky-500/20 transition pointer-events-none" />
        </button>
      </div>

      {/* ============================================================== */}
      {/* SECTION 2: FEATURED INVESTIGATIONS (MATCHING MOCKUP)           */}
      {/* ============================================================== */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-mono font-black uppercase tracking-widest text-cyan-400 flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Featured investigations</span>
          </h3>
          <span className="text-[11px] font-mono text-slate-400">NASA Flight Programs</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {featuredInvestigations.slice(0, 4).map((inv, idx) => (
            <div
              key={inv.id}
              className="p-4 rounded-2xl bg-gradient-to-r from-[#071324]/90 via-[#040c1a]/95 to-black/95 border border-cyan-500/35 hover:border-cyan-400/80 transition-all duration-300 flex items-center justify-between gap-3.5 group shadow-lg hover:shadow-[0_0_25px_rgba(6,182,212,0.2)]"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                {/* Visual Thumbnail (Matching Mockup with Spherical Flame or Astronaut Rack visual) */}
                <div className="w-13 h-13 rounded-xl overflow-hidden bg-black border border-cyan-500/50 flex items-center justify-center shrink-0 relative shadow-[0_0_15px_rgba(6,182,212,0.3)] group-hover:scale-105 transition">
                  {idx % 2 === 0 ? (
                    // Microgravity Flame Sphere Visual (Mockup Card 1)
                    <div className="w-full h-full bg-gradient-to-br from-indigo-950 via-blue-900 to-black flex items-center justify-center relative">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 via-cyan-400 to-amber-200 shadow-[0_0_16px_rgba(59,130,246,0.9)] animate-pulse" />
                      <div className="absolute inset-0 bg-radial-gradient from-transparent to-black/60 pointer-events-none" />
                    </div>
                  ) : (
                    // Astronaut / Flight Rack Visual (Mockup Card 2)
                    <div className="w-full h-full bg-gradient-to-br from-slate-900 via-sky-950 to-black flex items-center justify-center relative">
                      <div className="w-7 h-7 rounded-lg border border-cyan-400/70 flex items-center justify-center bg-cyan-950/60 text-xs">
                        🧑‍🚀
                      </div>
                      <div className="absolute bottom-0 inset-x-0 h-1 bg-cyan-400/80" />
                    </div>
                  )}
                </div>

                <div className="min-w-0 space-y-1">
                  <h4 className="text-sm font-bold text-white group-hover:text-cyan-300 transition truncate">
                    {inv.name}
                  </h4>
                  <p className="text-[11px] font-mono text-slate-400 truncate">
                    {inv.category} · {inv.hardware.split(' ')[0]} · {inv.id}
                  </p>
                </div>
              </div>

              <button
                onClick={() => onOpenDossier(inv.id)}
                className="px-3.5 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-400 text-cyan-300 hover:text-slate-950 border border-cyan-500/50 text-xs font-mono font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer active:scale-95 shadow-[0_0_12px_rgba(6,182,212,0.2)]"
              >
                <span>Open dossier</span>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* ============================================================== */}
      {/* SECTION 3: COLLAPSIBLE GATEWAYS & FILTERS                      */}
      {/* ============================================================== */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        {/* Domain Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[10px] font-mono text-slate-500 uppercase mr-1">Domain:</span>
          {[
            { id: 'ALL', label: 'All Records', count: studies.length },
            { id: 'EXPERIMENT', label: '🔬 Experiments', count: experimentCount },
            { id: 'INCIDENT', label: '🔥 Incidents', count: incidentCount },
            { id: 'SPINOFF', label: '🌍 Spinoffs', count: spinoffCount },
          ].map((dom) => {
            const isSelected = domainFilter === dom.id && activeFetchedBatch === null;
            return (
              <button
                key={dom.id}
                onClick={() => {
                  setActiveFetchedBatch(null);
                  setDomainFilter(dom.id as any);
                }}
                className={`text-xs font-mono px-3 py-1.5 rounded-xl border transition-all cursor-pointer flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400 font-bold shadow-md'
                    : 'bg-black/60 text-slate-400 border-slate-800 hover:border-slate-700'
                }`}
              >
                <span>{dom.label}</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/60 text-slate-300">
                  {dom.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Collapsible Gateway Link */}
        <button
          onClick={() => setIsKnowledgeHubOpen(!isKnowledgeHubOpen)}
          className="text-xs font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
        >
          {isKnowledgeHubOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          <span>{isKnowledgeHubOpen ? 'Hide NASA Portals' : 'Open NASA Portals (4)'}</span>
        </button>
      </div>

      {/* Collapsible 4 Gateways */}
      {isKnowledgeHubOpen && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 p-4 rounded-2xl bg-black/80 border border-cyan-500/30 animate-fade-in">
          <a
            href="https://psi.nasa.gov/physci/repo/search?data_source=psi&data_type=investigation&q=combustion"
            target="_blank"
            rel="noopener noreferrer"
            className="p-3 rounded-xl bg-slate-950 border border-cyan-500/20 hover:border-cyan-400 text-xs font-mono text-slate-300 space-y-1 block group"
          >
            <div className="text-cyan-400 font-bold flex items-center justify-between">
              <span>PSI Repository</span>
              <ExternalLink className="w-3 h-3 group-hover:scale-110 transition" />
            </div>
            <div className="text-slate-400 text-[11px]">NASA Physical Sciences Informatics raw flight data.</div>
          </a>
          <a
            href="https://www.nasa.gov/glenn/glenn-expertise-space-exploration/physical-sciences-program/combustion-science/"
            target="_blank"
            rel="noopener noreferrer"
            className="p-3 rounded-xl bg-slate-950 border border-sky-500/20 hover:border-sky-400 text-xs font-mono text-slate-300 space-y-1 block group"
          >
            <div className="text-sky-400 font-bold flex items-center justify-between">
              <span>Glenn Research</span>
              <ExternalLink className="w-3 h-3 group-hover:scale-110 transition" />
            </div>
            <div className="text-slate-400 text-[11px]">Combustion Science & microgravity flight rigs.</div>
          </a>
          <a
            href="https://www.nasa.gov/missions/station/a-researchers-guide-to-combustion-science/"
            target="_blank"
            rel="noopener noreferrer"
            className="p-3 rounded-xl bg-slate-950 border border-amber-500/20 hover:border-amber-400 text-xs font-mono text-slate-300 space-y-1 block group"
          >
            <div className="text-amber-400 font-bold flex items-center justify-between">
              <span>Researcher's Guide</span>
              <ExternalLink className="w-3 h-3 group-hover:scale-110 transition" />
            </div>
            <div className="text-slate-400 text-[11px]">50+ page handbook covering CIR & diagnostics.</div>
          </a>
          <a
            href="https://www.youtube.com/watch?v=W1oXykoz9zg"
            target="_blank"
            rel="noopener noreferrer"
            className="p-3 rounded-xl bg-slate-950 border border-rose-500/20 hover:border-rose-400 text-xs font-mono text-slate-300 space-y-1 block group"
          >
            <div className="text-rose-400 font-bold flex items-center justify-between">
              <span>ScienceCasts Video</span>
              <Play className="w-3 h-3 group-hover:scale-110 transition" />
            </div>
            <div className="text-slate-400 text-[11px]">Official NASA video on microgravity flames.</div>
          </a>
        </div>
      )}

      {/* Active Fetched Batch Isolation Banner */}
      {activeFetchedBatch !== null && (
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-gradient-to-r from-cyan-950/70 via-slate-900 to-black border-2 border-cyan-500/50 rounded-2xl shadow-[0_0_30px_rgba(6,182,212,0.25)]">
          <div className="flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-cyan-400 animate-ping shrink-0" />
            <div>
              <div className="text-xs sm:text-sm font-mono font-bold text-white flex items-center gap-2">
                <span>📡 Isolated View: <strong>{filteredStudies.length}</strong> dossiers for</span>
                <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-400/50">
                  "{lastFetchedTopic}"
                </span>
              </div>
              <div className="text-[11px] font-mono text-slate-300 mt-0.5">
                Authentic NASA telemetry and physics metrics displayed exclusively.
              </div>
            </div>
          </div>
          <button
            onClick={handleResetToAllRecords}
            className="px-4 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/35 text-cyan-200 hover:text-white font-mono text-xs font-bold border border-cyan-400/50 transition cursor-pointer flex items-center gap-2 shadow"
          >
            <span>✕ Reset to All Archive Records ({studies.length})</span>
          </button>
        </div>
      )}

      {/* ============================================================== */}
      {/* SECTION 4: RESEARCH DOSSIERS GRID                              */}
      {/* ============================================================== */}
      {filteredStudies.length === 0 ? (
        <div className="p-12 text-center bg-[#050b14]/90 border border-cyan-500/30 border-dashed rounded-2xl space-y-4">
          <p className="text-sm font-mono text-cyan-300">
            {activeFetchedBatch !== null
              ? `No dossiers in the fetched batch match focus filter.`
              : `No dossiers matched search "${activeVaultSearchQuery || commandInput}".`}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            {activeFetchedBatch !== null ? (
              <button
                onClick={handleResetToAllRecords}
                className="px-4 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/35 text-white font-mono text-xs cursor-pointer border border-cyan-400/50 transition"
              >
                ✕ Show All Archive Records
              </button>
            ) : (
              <>
                <button
                  onClick={handleClearVaultSearch}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-200 font-mono text-xs cursor-pointer hover:bg-slate-700 transition"
                >
                  Clear Search Filter
                </button>
                <button
                  onClick={() => handleFetchLiveNasa(commandInput)}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-400 to-sky-400 text-slate-950 font-mono font-bold text-xs uppercase tracking-wider shadow cursor-pointer"
                >
                  📡 Pull "{commandInput || 'Physical Sciences'}" from NASA Repositories
                </button>
              </>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {filteredStudies.map((exp) => {
              const isHighlighted = Boolean(
                activeVaultSearchQuery.replace(/[^a-zA-Z0-9]/g, '').trim().length >= 2 &&
                  exp.id === highlightedDossierId
              );
              const isIncident = exp.dossierType === 'INCIDENT' || exp.category === 'Incident';
              const isSpinoff = exp.dossierType === 'SPINOFF' || exp.category === 'Spinoff';

              // Official PSI investigation URL with verified parameters: data_source=psi and data_type=investigation
              const psiLink =
                exp.psiPortalUrl ||
                `https://psi.nasa.gov/physci/repo/search?data_source=psi&data_type=investigation&q=${encodeURIComponent(exp.name.slice(0, 30))}`;
              const primaryExternalLink =
                exp.externalUrl || `https://ntrs.nasa.gov/citations/${exp.id}`;

              const pillarBorderClass =
                exp.category === 'Prevention'
                  ? 'border-l-emerald-500'
                  : exp.category === 'Detection'
                  ? 'border-l-amber-500'
                  : exp.category === 'Suppression'
                  ? 'border-l-cyan-400'
                  : exp.category === 'Partial-g'
                  ? 'border-l-purple-500'
                  : 'border-l-sky-500';

              return (
                <div
                  key={exp.id}
                  ref={(el) => {
                    if (el) cardRefs.current.set(exp.id, el);
                    else cardRefs.current.delete(exp.id);
                  }}
                  className={`bg-gradient-to-b from-[#071325]/92 via-[#040d1a]/95 to-[#01040a]/98 border border-slate-800/80 border-l-4 ${pillarBorderClass} ${
                    isHighlighted
                      ? 'border-cyan-400 ring-2 ring-cyan-400 shadow-[0_0_40px_rgba(6,182,212,0.65)] animate-pulse'
                      : 'hover:border-cyan-500/50 hover:shadow-[0_0_30px_rgba(6,182,212,0.18)]'
                  } rounded-2xl p-5 flex flex-col justify-between space-y-4 transition-all duration-300 hover:-translate-y-1 group relative`}
                >
                  <div className="space-y-3">
                    {/* Top Bar with ID & Provenance Badges */}
                    <div className="flex justify-between items-center gap-2">
                      <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-lg bg-black/80 text-cyan-400 border border-slate-800 truncate shadow-inner">
                        {exp.id}
                      </span>
                      <div className="flex items-center gap-1.5 flex-wrap justify-end">
                        {exp.isNtrsCitation || exp.sourceType === 'NTRS' ? (
                          <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-sky-500/20 border border-sky-400/60 text-sky-300 font-bold whitespace-nowrap">
                            📄 NTRS STI
                          </span>
                        ) : (
                          <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-cyan-500/20 border border-cyan-400/60 text-cyan-300 font-bold whitespace-nowrap">
                            ⚗️ PSI Flight
                          </span>
                        )}
                        <span className="text-[10px] font-mono uppercase px-2.5 py-0.5 rounded-full border bg-slate-900 border-slate-700 text-slate-300 whitespace-nowrap">
                          {exp.category}
                        </span>
                      </div>
                    </div>

                    {/* Title */}
                    <h3 className="text-base font-bold text-white group-hover:text-cyan-300 transition leading-snug">
                      {exp.name}
                    </h3>

                    {/* 4-Box Telemetry Grid */}
                    <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                      <div className="bg-black/60 rounded-xl p-2.5 border border-slate-800/80">
                        <span className="text-[10px] text-cyan-400/80 block uppercase tracking-wider mb-0.5">
                          🧪 Fuel / Material
                        </span>
                        <span className="text-white font-bold truncate block" title={exp.fuelType}>
                          {exp.fuelType}
                        </span>
                      </div>
                      <div className="bg-black/60 rounded-xl p-2.5 border border-slate-800/80">
                        <span className="text-[10px] text-sky-400/80 block uppercase tracking-wider mb-0.5">
                          💨 Airflow Draft
                        </span>
                        <span className="text-slate-200 truncate block" title={exp.flowVelocity}>
                          {exp.flowVelocity}
                        </span>
                      </div>
                      <div className="bg-black/60 rounded-xl p-2.5 border border-slate-800/80">
                        <span className="text-[10px] text-amber-400/80 block uppercase tracking-wider mb-0.5">
                          🛠️ Flight Hardware
                        </span>
                        <span className="text-slate-200 truncate block" title={exp.hardware}>
                          {exp.hardware}
                        </span>
                      </div>
                      <div className="bg-black/60 rounded-xl p-2.5 border border-slate-800/80">
                        <span className="text-[10px] text-emerald-400/80 block uppercase tracking-wider mb-0.5">
                          🔬 Pressure & O₂
                        </span>
                        <span className="text-slate-200 truncate block">
                          {exp.pressureRange} · {exp.oxygenRange}
                        </span>
                      </div>
                    </div>

                    {/* Key Finding */}
                    <p className="text-xs text-slate-300 leading-relaxed line-clamp-3">
                      {exp.keyFinding}
                    </p>

                    {/* DUAL WORKABLE NASA LINKS */}
                    <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono gap-2">
                      <a
                        href={psiLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2.5 py-1.5 rounded-lg bg-cyan-950/40 hover:bg-cyan-900/60 text-cyan-300 hover:text-white border border-cyan-500/30 transition flex items-center gap-1.5 font-bold truncate cursor-pointer"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <ExternalLink className="w-3 h-3 text-cyan-400 shrink-0" />
                        <span className="truncate">🔬 NASA PSI Portal ↗</span>
                      </a>
                      <a
                        href={primaryExternalLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2.5 py-1.5 rounded-lg bg-slate-900/60 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60 transition flex items-center gap-1.5 truncate cursor-pointer"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <ExternalLink className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate">
                          {isIncident ? '🏛️ Safety Report ↗' : isSpinoff ? '🌍 Spinoff ↗' : '📄 Publication ↗'}
                        </span>
                      </a>
                    </div>
                  </div>

                  {/* Card Action Buttons */}
                  <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                    <button
                      onClick={() => onLoadIntoPredictor(exp)}
                      className="text-[11px] font-mono font-bold px-3 py-1.5 rounded-lg bg-cyan-500/15 hover:bg-cyan-400 text-cyan-300 hover:text-slate-950 border border-cyan-500/30 transition flex items-center gap-1.5 cursor-pointer active:scale-95 shadow"
                    >
                      <Zap className="w-3 h-3" />
                      Load Predictor
                    </button>
                    <button
                      onClick={() => onOpenDossier(exp.id)}
                      className="text-[11px] font-mono font-bold px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 transition cursor-pointer active:scale-95"
                    >
                      Open dossier
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ============================================================ */}
          {/* MULTI-RECORD PAGINATION BAR                                  */}
          {/* ============================================================ */}
          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-black/80 border border-cyan-500/40 shadow-[0_0_25px_rgba(6,182,212,0.15)]">
            <div className="text-xs font-mono text-slate-300">
              Showing <strong className="text-cyan-400">{filteredStudies.length}</strong> research dossiers
            </div>

            <button
              onClick={() => handleFetchLiveNasa(commandInput, true)}
              disabled={isFetchingLive || !hasMoreToFetch}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500/20 via-sky-500/25 to-cyan-500/20 hover:from-cyan-500/35 hover:to-sky-500/35 border-2 border-cyan-400 text-cyan-200 font-mono text-xs font-bold transition-all duration-300 cursor-pointer flex items-center gap-2 disabled:opacity-50 shadow-[0_0_20px_rgba(6,182,212,0.25)] hover:shadow-[0_0_30px_rgba(6,182,212,0.4)]"
            >
              {isFetchingLive ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
                  <span>Loading More Records...</span>
                </>
              ) : hasMoreToFetch ? (
                <>
                  <RefreshCw className="w-4 h-4 text-cyan-400" />
                  <span>Load More Dossiers</span>
                </>
              ) : (
                <span>All Available Dossiers Loaded ✓</span>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
