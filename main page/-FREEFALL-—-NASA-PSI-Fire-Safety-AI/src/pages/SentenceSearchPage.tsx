import React, { useState, useMemo } from 'react';
import {
  Search,
  Sliders,
  Sparkles,
  BookOpen,
  Copy,
  Check,
  ChevronRight,
  ExternalLink,
  Flame,
  X,
  Layers,
  Activity,
  FileSpreadsheet,
} from 'lucide-react';
import { PSI_SENTENCES_DATA } from '../data/psiSentencesData';
import { playCommandChirp, playTelemetryChirp } from '../utils/audioTelemetry';

interface SentenceSearchPageProps {
  onNavigate?: (path: string) => void;
  onOpenAssistant?: () => void;
}

interface Investigation {
  id: string;
  n: string;
  type: string;
  plat: string;
  start: string;
  end: string;
  center: string;
  obj: string;
  app: string;
  hyp: string;
  imp: string;
  y: number;
  s: number[];
  tg: string[];
  d: string;
  doi?: string;
  tb?: Array<{ cols: string[]; rows: any[][] }>;
}

interface ScoredInvestigation {
  inv: Investigation;
  relevance: number;
  matchCount: number;
  bestSentence: { text: string; section: string; score: number } | null;
}

export const SentenceSearchPage: React.FC<SentenceSearchPageProps> = ({ onNavigate }) => {
  const records: Investigation[] = PSI_SENTENCES_DATA as any;
  const [query, setQuery] = useState<string>('cool flame');
  const [weightCrew, setWeightCrew] = useState<number>(1.0);
  const [weightModel, setWeightModel] = useState<number>(1.0);
  const [weightCtrl, setWeightCtrl] = useState<number>(1.0);
  const [sortBy, setSortBy] = useState<'relevance' | 'year' | 'name'>('relevance');
  const [selectedRecord, setSelectedRecord] = useState<Investigation | null>(null);
  const [copied, setCopied] = useState(false);

  const suggestedQueries = [
    'cool flame',
    'extinction',
    'soot suppression',
    'oxygen concentration',
    'droplet evaporation',
    'Saffire large fabric',
    'quiescent microgravity',
  ];

  // Tokenize & stem query
  const queryTokens = useMemo(() => {
    return query
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((t) => t.length > 2);
  }, [query]);

  // Extract sentences from an investigation
  const extractSentences = (inv: Investigation): Array<{ text: string; section: string }> => {
    const sections: Array<[string, string]> = [
      ['Objectives', inv.obj || ''],
      ['Approach', inv.app || ''],
      ['Hypothesis', inv.hyp || ''],
      ['Research Impacts', inv.imp || ''],
    ];

    const results: Array<{ text: string; section: string }> = [];
    sections.forEach(([secName, content]) => {
      if (!content) return;
      const rawSentences = content
        .split(/(?<=[.!?])\s+/)
        .map((s) => s.trim())
        .filter((s) => s.length > 30);

      rawSentences.forEach((s) => results.push({ text: s, section: secName }));
    });
    return results;
  };

  // Score investigation based on query match and priority weights
  const scoredInvestigations = useMemo(() => {
    return records
      .map((inv): ScoredInvestigation => {
        let matchCount = 0;
        let bestSentence: { text: string; section: string; score: number } | null = null;

        const allText = `${inv.n} ${inv.d} ${inv.obj} ${inv.app} ${inv.hyp} ${inv.imp} ${inv.tg.join(' ')}`.toLowerCase();
        queryTokens.forEach((token) => {
          if (allText.includes(token)) matchCount += 1;
        });

        // Score sentences
        const sentences = extractSentences(inv);
        sentences.forEach((sent) => {
          const lower = sent.text.toLowerCase();
          let sentHits = 0;
          queryTokens.forEach((token) => {
            if (lower.includes(token)) sentHits += 1;
          });

          if (sentHits > 0) {
            if (!bestSentence || sentHits > bestSentence.score) {
              bestSentence = { text: sent.text, section: sent.section, score: sentHits };
            }
          }
        });

        // Priority weighting score
        const priorityScore =
          (inv.s?.[0] || 0) * weightCrew +
          (inv.s?.[1] || 0) * weightModel +
          (inv.s?.[2] || 0) * weightCtrl;

        const relevance = queryTokens.length === 0 ? priorityScore : matchCount * 3 + priorityScore;

        return {
          inv,
          relevance,
          matchCount,
          bestSentence,
        };
      })
      .filter((item) => (queryTokens.length === 0 ? true : item.matchCount > 0))
      .sort((a, b) => {
        if (sortBy === 'year') return b.inv.y - a.inv.y;
        if (sortBy === 'name') return a.inv.n.localeCompare(b.inv.n);
        return b.relevance - a.relevance;
      });
  }, [records, queryTokens, weightCrew, weightModel, weightCtrl, sortBy]);

  // Highlight matching tokens in text
  const renderHighlighted = (text: string) => {
    if (!queryTokens.length) return text;
    const regex = new RegExp(`(${queryTokens.join('|')})`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, idx) =>
      queryTokens.includes(part.toLowerCase()) ? (
        <mark key={idx} className="bg-cyan-400/30 text-cyan-200 px-0.5 rounded font-bold">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  const handleCopyCSV = () => {
    playCommandChirp();
    const headers = ['Investigation ID', 'Title', 'Platform', 'Year', 'Relevance Score'];
    const rows = scoredInvestigations.map((item) => [
      item.inv.id,
      `"${item.inv.n.replace(/"/g, '""')}"`,
      `"${item.inv.plat}"`,
      item.inv.y,
      item.relevance.toFixed(1),
    ]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    navigator.clipboard.writeText(csvContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-[#07152B]/95 via-[#06183E]/90 to-[#030814]/95 border border-[#35D6FF]/30 p-5 backdrop-blur-2xl shadow-[0_0_40px_rgba(53,214,255,0.12)] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-400/40 flex items-center justify-center text-cyan-300 shadow-[0_0_15px_rgba(53,214,255,0.35)] shrink-0">
            <Sparkles className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base sm:text-lg font-black font-orbitron text-white tracking-wider">
                PSI SENTENCE INTELLIGENCE
              </h2>
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-cyan-500/20 text-[#35D6FF] border border-[#35D6FF]/40 font-bold">
                NASA Literature NLP
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold">
                {scoredInvestigations.length} Matching Records
              </span>
            </div>
            <p className="text-xs text-[#8DB3DE] font-mono leading-relaxed mt-0.5">
              Sentence-level precision search across 24 NASA Physical Sciences Informatics investigations.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleCopyCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#06183E] hover:bg-[#07152B] border border-cyan-500/40 text-cyan-300 text-xs font-mono font-bold transition shadow cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied CSV!' : 'Copy Results CSV'}</span>
          </button>
        </div>
      </div>

      {/* Search & Sliders Controls Bar */}
      <div className="bg-[#06183E]/80 border border-cyan-500/30 rounded-2xl p-5 shadow-[0_0_35px_rgba(6,182,212,0.1)] space-y-4">
        {/* Search Input Bar */}
        <div className="relative">
          <Search className="w-5 h-5 absolute left-3.5 top-3.5 text-cyan-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search exact sentences across NASA PSI research (e.g. 'cool flame', 'smoke detection', 'extinction limit')..."
            className="w-full pl-11 pr-4 py-3 bg-[#030814] border border-cyan-500/40 rounded-xl text-sm font-mono text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 shadow-[inset_0_2px_8px_rgba(0,0,0,0.6)]"
          />
        </div>

        {/* Suggested Chips Bar */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          <span className="text-[10px] font-mono uppercase text-slate-400 font-bold shrink-0">
            Suggested Queries:
          </span>
          {suggestedQueries.map((chip, idx) => (
            <button
              key={idx}
              onClick={() => {
                playTelemetryChirp();
                setQuery(chip);
              }}
              className="px-2.5 py-1 rounded-lg text-xs font-mono bg-slate-900 hover:bg-slate-800 text-cyan-300 hover:text-white border border-slate-800 hover:border-cyan-500/40 transition whitespace-nowrap cursor-pointer"
            >
              {chip}
            </button>
          ))}
        </div>

        {/* Sliders & Sorting Row */}
        <div className="pt-3 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs font-mono">
          <div>
            <label className="text-slate-300 flex justify-between mb-1">
              <span>Crew Safety Weight:</span>
              <span className="text-cyan-300 font-bold">{weightCrew.toFixed(1)}x</span>
            </label>
            <input
              type="range"
              min="0"
              max="3"
              step="0.5"
              value={weightCrew}
              onChange={(e) => setWeightCrew(parseFloat(e.target.value))}
              className="w-full accent-cyan-400 cursor-pointer"
            />
          </div>

          <div>
            <label className="text-slate-300 flex justify-between mb-1">
              <span>Modeling Weight:</span>
              <span className="text-cyan-300 font-bold">{weightModel.toFixed(1)}x</span>
            </label>
            <input
              type="range"
              min="0"
              max="3"
              step="0.5"
              value={weightModel}
              onChange={(e) => setWeightModel(parseFloat(e.target.value))}
              className="w-full accent-cyan-400 cursor-pointer"
            />
          </div>

          <div>
            <label className="text-slate-300 flex justify-between mb-1">
              <span>Controls Weight:</span>
              <span className="text-cyan-300 font-bold">{weightCtrl.toFixed(1)}x</span>
            </label>
            <input
              type="range"
              min="0"
              max="3"
              step="0.5"
              value={weightCtrl}
              onChange={(e) => setWeightCtrl(parseFloat(e.target.value))}
              className="w-full accent-cyan-400 cursor-pointer"
            />
          </div>

          <div>
            <label className="text-slate-300 block mb-1">Sort Results By:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full bg-[#030814] border border-cyan-500/30 rounded-lg px-2.5 py-1 text-slate-200"
            >
              <option value="relevance">Highest Relevance</option>
              <option value="year">Newest First</option>
              <option value="name">Investigation Name</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results List */}
      <div className="space-y-4">
        {scoredInvestigations.length === 0 ? (
          <div className="rounded-2xl border border-slate-800 bg-[#06183E]/40 p-8 text-center text-slate-400 font-mono text-sm">
            No investigations match “{query}”. Try adjusting keyword sliders or clicking a suggested query chip above.
          </div>
        ) : (
          scoredInvestigations.map((item, idx) => (
            <div
              key={item.inv.id}
              onClick={() => {
                playTelemetryChirp();
                setSelectedRecord(item.inv);
              }}
              className="rounded-2xl border border-cyan-500/30 hover:border-cyan-400 bg-[#06183E]/70 hover:bg-[#06183E]/95 p-5 shadow-[0_0_25px_rgba(6,182,212,0.08)] transition-all duration-300 cursor-pointer group space-y-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-mono text-slate-400 font-bold">
                      #{idx + 1}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 font-bold border border-cyan-500/30">
                      {item.inv.id}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      {item.inv.plat} // {item.inv.y}
                    </span>
                  </div>
                  <h3 className="text-base font-orbitron font-bold text-white mt-1 group-hover:text-cyan-200 transition-colors">
                    {renderHighlighted(item.inv.n)}
                  </h3>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-xs font-mono font-bold text-cyan-300 bg-cyan-950/80 px-2.5 py-1 rounded-lg border border-cyan-500/40">
                    Score: {item.relevance.toFixed(1)}
                  </span>
                </div>
              </div>

              {/* Best Sentence Match Card */}
              {item.bestSentence && (
                <div className="bg-[#030814]/90 border-l-2 border-cyan-400 rounded-r-xl p-3 text-xs font-mono text-slate-200 space-y-1">
                  <span className="text-[9px] uppercase tracking-wider text-cyan-400 font-bold block">
                    Exact Matching Sentence ({item.bestSentence.section}):
                  </span>
                  <p className="leading-relaxed">
                    “{renderHighlighted(item.bestSentence.text)}”
                  </p>
                </div>
              )}

              {/* Tags & Sub-scores */}
              <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800/80 flex-wrap text-xs font-mono">
                <div className="flex items-center gap-1.5 flex-wrap">
                  {item.inv.tg.slice(0, 5).map((tag, tIdx) => (
                    <span
                      key={tIdx}
                      className="text-[10px] px-2 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-800"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                <div className="flex items-center gap-3 text-[11px] text-slate-400">
                  <span>Crew: {item.inv.s?.[0] || 0}/5</span>
                  <span>Modeling: {item.inv.s?.[1] || 0}/5</span>
                  <span>Controls: {item.inv.s?.[2] || 0}/5</span>
                  <ChevronRight className="w-4 h-4 text-cyan-400 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Investigation Detail Modal Drawer */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
          <div className="relative w-full max-w-3xl bg-[#06183E] border border-cyan-500/50 rounded-2xl overflow-hidden shadow-[0_0_60px_rgba(6,182,212,0.35)] flex flex-col max-h-[90vh]">
            <div className="p-5 bg-slate-950/90 border-b border-cyan-500/30 flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/30 font-bold">
                    {selectedRecord.id}
                  </span>
                  <span className="text-xs font-mono text-slate-400">
                    {selectedRecord.plat} // {selectedRecord.y}
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-orbitron font-bold text-white mt-1">
                  {selectedRecord.n}
                </h3>
              </div>
              <button
                onClick={() => setSelectedRecord(null)}
                className="w-8 h-8 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center border border-slate-700 transition cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs font-mono text-slate-200">
              {selectedRecord.obj && (
                <div className="space-y-1">
                  <span className="text-[10px] uppercase text-cyan-400 font-bold block">
                    Objectives
                  </span>
                  <p className="bg-[#030814]/80 p-3.5 rounded-xl border border-slate-800 leading-relaxed font-sans text-slate-300">
                    {selectedRecord.obj}
                  </p>
                </div>
              )}

              {selectedRecord.app && (
                <div className="space-y-1">
                  <span className="text-[10px] uppercase text-cyan-400 font-bold block">
                    Approach & Computational Modeling
                  </span>
                  <p className="bg-[#030814]/80 p-3.5 rounded-xl border border-slate-800 leading-relaxed font-sans text-slate-300 whitespace-pre-line">
                    {selectedRecord.app}
                  </p>
                </div>
              )}

              {selectedRecord.hyp && (
                <div className="space-y-1">
                  <span className="text-[10px] uppercase text-cyan-400 font-bold block">
                    Scientific Hypothesis
                  </span>
                  <p className="bg-[#030814]/80 p-3.5 rounded-xl border border-slate-800 leading-relaxed font-sans text-slate-300">
                    {selectedRecord.hyp}
                  </p>
                </div>
              )}

              {selectedRecord.imp && (
                <div className="space-y-1">
                  <span className="text-[10px] uppercase text-cyan-400 font-bold block">
                    Space & Terrestrial Impacts
                  </span>
                  <p className="bg-[#030814]/80 p-3.5 rounded-xl border border-slate-800 leading-relaxed font-sans text-slate-300 whitespace-pre-line">
                    {selectedRecord.imp}
                  </p>
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between">
              <span className="text-xs font-mono text-slate-400">
                NASA Glenn Research Center // PSI
              </span>
              <button
                onClick={() => {
                  setSelectedRecord(null);
                  if (onNavigate) onNavigate('/simulator');
                  else window.location.hash = '#/simulator';
                }}
                className="px-4 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/50 text-cyan-300 text-xs font-mono font-bold transition flex items-center gap-1.5 cursor-pointer"
              >
                <Flame className="w-3.5 h-3.5 text-cyan-400" />
                <span>Test in Flame Simulator ➔</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
