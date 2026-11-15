import React, { useState, useEffect } from 'react';
import { Database, Search, RefreshCw, Zap, Loader2 } from 'lucide-react';
import { PSI_STUDIES } from '../data/psiStudies';
import { PSIStudy } from '../types';
import { fetchUniversalNasaRecords } from '../utils/predictorEngine';

interface VaultViewProps {
  studies?: PSIStudy[];
  onMergeStudies?: (newRecords: PSIStudy[]) => void;
  externalSearchQuery?: string;
  onOpenDossier: (studyId: string) => void;
  onLoadIntoPredictor: (study: PSIStudy) => void;
}

export const VaultView: React.FC<VaultViewProps> = ({
  studies: propStudies,
  onMergeStudies,
  externalSearchQuery,
  onOpenDossier,
  onLoadIntoPredictor,
}) => {
  const [localStudies, setLocalStudies] = useState<PSIStudy[]>(PSI_STUDIES);
  const studies = propStudies || localStudies;

  const [searchQuery, setSearchQuery] = useState<string>(externalSearchQuery || '');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [isFetchingLive, setIsFetchingLive] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>(`${studies.length} NASA PSI & NTRS Programs Ready`);

  useEffect(() => {
    if (externalSearchQuery !== undefined && externalSearchQuery !== searchQuery) {
      setSearchQuery(externalSearchQuery);
    }
  }, [externalSearchQuery]);

  // Filter studies while always showing records that match any word or tag
  const filteredStudies = studies.filter((study) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesCategory = selectedCategory === 'ALL' || study.category === selectedCategory;
    if (!q) return matchesCategory;

    const hay = `${study.id} ${study.name} ${study.program} ${study.keyFinding} ${study.fuelType} ${study.tags.join(' ')}`.toLowerCase();
    const words = q.split(/\s+/).filter(Boolean);
    const matchesSearch = hay.includes(q) || words.some((w) => hay.includes(w));
    return matchesSearch && matchesCategory;
  });

  const handleFetchLiveNTRS = async (overrideQuery?: string) => {
    const q = (overrideQuery ?? searchQuery).trim() || 'microgravity combustion';
    setIsFetchingLive(true);
    setSelectedCategory('ALL');
    setStatusMessage(`Querying Live NASA NTRS & OSDR Servers for "${q}"...`);

    try {
      const liveRecords = await fetchUniversalNasaRecords(q);
      if (liveRecords.length > 0) {
        if (onMergeStudies) {
          onMergeStudies(liveRecords);
        } else {
          const existingIds = new Set(localStudies.map((s) => s.id.toUpperCase()));
          const uniqueNew = liveRecords.filter((r) => !existingIds.has(r.id.toUpperCase()));
          setLocalStudies([...uniqueNew, ...localStudies]);
        }
        setStatusMessage(`✓ Pulled ${liveRecords.length} Live NASA Records for "${q}"`);
      } else {
        setStatusMessage(`Showing matched archive records for "${q}"`);
      }
    } catch (err) {
      console.warn('Live fetch error:', err);
      setStatusMessage('Displaying verified PSI archive');
    } finally {
      setIsFetchingLive(false);
    }
  };

  const handleReset = () => {
    setSearchQuery('');
    setSelectedCategory('ALL');
    setStatusMessage(`${studies.length} NASA PSI & NTRS Programs Ready`);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-[#081322]/90 backdrop-blur-xl border border-cyan-500/30 rounded-2xl p-6 shadow-2xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-cyan-400 font-bold block">
              Multi-Stage NASA NTRS + OSDR/PSI Live Fetch Waterfall
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
              <Database className="w-5 h-5 text-cyan-400" />
              NASA Physical Science Informatics (PSI) & Technical Reports Vault
            </h2>
          </div>
          <span className="text-xs font-mono px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-cyan-300">
            {statusMessage}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-2">
          <div className="md:col-span-6 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleFetchLiveNTRS()}
              placeholder="Type anything & press Enter or Fetch (e.g. SSCE, SIBAL, Saffire, cool flames, drop tower)..."
              className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-cyan-400"
            />
          </div>

          <div className="md:col-span-3">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-400"
            >
              <option value="ALL">All Categories</option>
              <option value="Prevention">🛡️ Prevention (Flammability & Limits)</option>
              <option value="Detection">📡 Detection (Smoke & Cool Flames)</option>
              <option value="Suppression">🧯 Suppression (Dilution & Mist)</option>
              <option value="Partial-g">🌙 Partial-g (Lunar & Electric-Field)</option>
            </select>
          </div>

          <button
            onClick={() => handleFetchLiveNTRS()}
            disabled={isFetchingLive}
            className="md:col-span-2 bg-gradient-to-r from-cyan-400 to-sky-400 hover:brightness-110 text-slate-950 font-bold text-xs font-mono uppercase tracking-wider rounded-xl px-4 py-2.5 transition shadow flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {isFetchingLive ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Fetching...</span>
              </>
            ) : (
              <>
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Fetch NASA Live</span>
              </>
            )}
          </button>

          <button
            onClick={handleReset}
            className="md:col-span-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono rounded-xl px-3 py-2.5 transition text-center"
          >
            Reset
          </button>
        </div>
      </div>

      {filteredStudies.length === 0 ? (
        <div className="p-12 text-center bg-[#081322]/90 border border-cyan-500/30 border-dashed rounded-2xl space-y-3">
          <p className="text-sm font-mono text-cyan-300">
            No local cards matched "{searchQuery}". Click below to pull live from NASA servers:
          </p>
          <button
            onClick={() => handleFetchLiveNTRS()}
            className="px-5 py-2.5 rounded-xl bg-cyan-400 text-slate-950 font-mono font-bold text-xs uppercase tracking-wider shadow"
          >
            📡 Fetch "{searchQuery}" Live from NASA NTRS & OSDR
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredStudies.map((exp) => (
            <div
              key={exp.id}
              className="bg-[#081322]/90 border border-slate-800 hover:border-cyan-500/50 rounded-2xl p-5 shadow-xl flex flex-col justify-between space-y-4 transition group"
            >
              <div className="space-y-3">
                <div className="flex justify-between items-center gap-2">
                  <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded bg-slate-950 text-cyan-400 border border-slate-800 truncate">
                    {exp.id}
                  </span>
                  <span className="text-[10px] font-mono uppercase px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 whitespace-nowrap">
                    {exp.category}
                  </span>
                </div>
                <h3 className="text-base font-bold text-white group-hover:text-cyan-300 transition leading-snug">
                  {exp.name}
                </h3>
                <p className="text-xs font-mono text-slate-400">
                  🛠️ {exp.hardware} · 🧪 {exp.oxygenRange}
                </p>
                <p className="text-xs text-slate-300 leading-relaxed line-clamp-3">
                  {exp.keyFinding}
                </p>
                <div className="flex flex-wrap gap-1 pt-1">
                  {exp.tags.slice(0, 4).map((tag, idx) => (
                    <span
                      key={idx}
                      className="text-[9px] font-mono px-2 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                <button
                  onClick={() => onLoadIntoPredictor(exp)}
                  className="text-[11px] font-mono font-bold px-3 py-1.5 rounded-lg bg-cyan-500/15 hover:bg-cyan-400 text-cyan-300 hover:text-slate-950 border border-cyan-500/30 transition flex items-center gap-1"
                >
                  <Zap className="w-3 h-3" />
                  Load to Predictor
                </button>
                <button
                  onClick={() => onOpenDossier(exp.id)}
                  className="text-[11px] font-mono font-bold px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
                >
                  Inspect Dossier ↗
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};