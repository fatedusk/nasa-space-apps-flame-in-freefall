import React, { useState, useRef, useEffect } from 'react';
import {
  ShieldAlert,
  Sparkles,
  Send,
  Loader2,
  Trash2,
  Copy,
  Check,
  FileText,
  Zap,
  ChevronRight,
  X,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { PredictionInput, PredictionResult, PSIStudy } from '../types';
import { calculateFlammabilityPrediction } from '../utils/predictorEngine';

interface SafetyAIAssistantProps {
  currentInput?: PredictionInput;
  prediction?: PredictionResult;
  allStudies?: PSIStudy[];
  onOpenDossier: (studyId: string) => void;
  onAgentNavigateAndFetch?: (topicQuery: string, autoOpenDossier?: boolean) => Promise<PSIStudy | null>;
  isOpen?: boolean;
  onToggleOpen?: (open: boolean) => void;
  pendingPrompt?: string | null;
  onClearPendingPrompt?: () => void;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  telemetrySnapshot?: {
    gravity: string;
    material: string;
    oxygenPct: number;
    pressureKpa: number;
    airflowCms: number;
    regime: string;
  };
  citedStudies?: string[];
  agentActionBanner?: string;
}

type TopicCategory = 'all' | 'procedures' | 'protocols' | 'theory' | 'artemis';

const DEFAULT_INPUT: PredictionInput = {
  gravity: '0g',
  material: 'sibal',
  gasMix: 'normal',
  oxygenPct: 21.0,
  pressureKpa: 101.3,
  airflowCms: 20.0,
  flowDirection: 'concurrent',
};

// Detects if the user wants the AI Agent to fetch/open a specific experiment or topic in the Vault & Dossier
function detectAgentTopicIntent(text: string): { shouldFetch: boolean; topic: string } {
  const clean = text.trim();
  const lower = clean.toLowerCase();

  // Explicit navigation / lookup patterns ("tell me about X", "show me X", "open X", "fetch X", "search X")
  const navMatch = clean.match(
    /(?:tell me about|show me|open|inspect|fetch|search for|find data on|load|dossier for|what is)\s+([a-zA-Z0-9\-\s]{2,35})/i
  );

  // Known experiment keywords that should auto-fetch & open dossier
  const experimentKeywords = [
    'ssce',
    'solid surface combustion',
    'saffire',
    'bass',
    'flex',
    'same-r',
    'acme',
    'daft',
    'luci',
    'slice',
    'sofe',
    'drop tower',
    'parabolic',
  ];

  for (const kw of experimentKeywords) {
    if (lower.includes(kw)) {
      return { shouldFetch: true, topic: kw.toUpperCase() };
    }
  }

  if (
    navMatch &&
    (lower.includes('tell me about') ||
      lower.includes('show me') ||
      lower.includes('open') ||
      lower.includes('fetch') ||
      lower.includes('dossier'))
  ) {
    const topic = navMatch[1].replace(/[?.!,]/g, '').trim();
    const genericWords = ['fire', 'space', 'gravity', 'oxygen', 'this', 'that'];
    if (topic && !genericWords.includes(topic.toLowerCase())) {
      return { shouldFetch: true, topic };
    }
  }

  return { shouldFetch: false, topic: '' };
}

export const SafetyAIAssistant: React.FC<SafetyAIAssistantProps> = ({
  currentInput: inputProp,
  prediction: predictionProp,
  onOpenDossier,
  onAgentNavigateAndFetch,
  isOpen: controlledIsOpen,
  onToggleOpen,
  pendingPrompt,
  onClearPendingPrompt,
}) => {
  const [internalIsOpen, setInternalIsOpen] = useState<boolean>(false);
  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;
  const setIsOpen = (next: boolean) => {
    if (onToggleOpen) onToggleOpen(next);
    else setInternalIsOpen(next);
  };

  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const activeInput = inputProp || DEFAULT_INPUT;
  const activePrediction = predictionProp || calculateFlammabilityPrediction(activeInput);

  const [topicCategory, setTopicCategory] = useState<TopicCategory>('all');
  const [syncTelemetry, setSyncTelemetry] = useState<boolean>(true);
  const [inputText, setInputText] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const initialMessage: ChatMessage = {
    id: 'welcome-1',
    role: 'assistant',
    content: `### 🛡️ NASA Hybrid AI & Action Agent Online\n\nI can answer **basic everyday questions** (*"What happens when you light a candle in space?"*, *"Why don't ceiling smoke alarms work?"*) as well as **deep NASA PSI engineering questions**.\n\n**⚡ Live UI Action Agent:**\nAsk me *"Tell me about SSCE"*, *"Show me Saffire"*, or *"Fetch drop tower combustion"* and I will automatically:\n1. Switch you to the **Live NASA Vault** tab,\n2. Fetch the live NASA records for that experiment, and\n3. Pop open its **Data Dossier** while explaining it here!`,
    timestamp: 'Ready',
    citedStudies: ['NTRS-20210011521', 'NTRS-20150008962', 'PSI-SAF-04', 'PSI-FLEX-02'],
  };

  const [messages, setMessages] = useState<ChatMessage[]>([initialMessage]);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading, isOpen]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen]);

  useEffect(() => {
    if (pendingPrompt && pendingPrompt.trim()) {
      setIsOpen(true);
      handleSendMessage(pendingPrompt);
      if (onClearPendingPrompt) onClearPendingPrompt();
    }
  }, [pendingPrompt]);

  const handleSendMessage = async (customPrompt?: string) => {
    const textToSend = (customPrompt || inputText).trim();
    if (!textToSend || isLoading) return;

    if (!isOpen) setIsOpen(true);

    const telemSnapshot = syncTelemetry
      ? {
          gravity: activeInput.gravity,
          material: activeInput.material,
          oxygenPct: activeInput.oxygenPct,
          pressureKpa: activeInput.pressureKpa,
          airflowCms: activeInput.airflowCms,
          regime: activePrediction.regime,
        }
      : undefined;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      telemetrySnapshot: telemSnapshot,
    };

    setMessages((prev) => [...prev, userMessage]);
    if (!customPrompt) setInputText('');
    setIsLoading(true);

    // 1. Check if the Action Agent should navigate to the Vault, fetch live NASA data, and open a Dossier!
    let agentActionBanner: string | undefined;
    let fetchedRecord: PSIStudy | null = null;
    const intent = detectAgentTopicIntent(textToSend);

    if (intent.shouldFetch && onAgentNavigateAndFetch) {
      try {
        fetchedRecord = await onAgentNavigateAndFetch(intent.topic, true);
        if (fetchedRecord) {
          agentActionBanner = `⚡ Action Executed: Switched to NASA Vault, fetched "${intent.topic}", and opened Dossier [${fetchedRecord.id}]`;
        }
      } catch (e) {
        console.warn('Agent navigation error:', e);
      }
    }

    // 2. Call the AI chat backend (or build a rich synthesis combining the fetched record + answer)
    try {
      const response = await fetch('/api/safety-assistant/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage].map((m) => ({
            role: m.role,
            content: m.content,
          })),
          telemetryState: telemSnapshot
            ? {
                ...activeInput,
                predictedRegime: activePrediction.regime,
                topProb: activePrediction.topProb,
              }
            : undefined,
          topicCategory,
        }),
      });

      const data = await response.json();
      let replyContent = data.message || 'Analysis completed.';
      const citations = new Set<string>(data.citedStudies || []);

      if (fetchedRecord) {
        citations.add(fetchedRecord.id);
        if (!replyContent.toLowerCase().includes(fetchedRecord.name.toLowerCase().slice(0, 12))) {
          replyContent =
            `### 📂 Live Dossier Opened: ${fetchedRecord.name} (${fetchedRecord.id})\n\n` +
            `- **Hardware & Facility:** ${fetchedRecord.hardware}\n` +
            `- **Atmosphere Tested:** ${fetchedRecord.oxygenRange} (${fetchedRecord.pressureRange})\n` +
            `- **Key NASA Finding:** ${fetchedRecord.keyFinding}\n\n` +
            replyContent;
        }
      }

      const aiMessage: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: replyContent,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        citedStudies: Array.from(citations),
        agentActionBanner,
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (err) {
      const fallbackCitations = ['NTRS-20210011521', 'PSI-SAF-04', 'PSI-FLEX-02'];
      if (fetchedRecord) fallbackCitations.unshift(fetchedRecord.id);

      const fallbackAiMessage: ChatMessage = {
        id: `ai-err-${Date.now()}`,
        role: 'assistant',
        content: fetchedRecord
          ? `### 📂 ${fetchedRecord.name} (${fetchedRecord.id})\n\n` +
            `**1. In Simple Terms:**\n${fetchedRecord.keyFinding}\n\n` +
            `**2. Full NASA Summary:**\n${fetchedRecord.fullAbstract}\n\n` +
            `**3. Flight Safety Impact:**\n${fetchedRecord.fireSafetyInsight}`
          : `### 🧠 Space Fire Safety & Telemetry Answer\n\n` +
            `**1. In Simple Terms:**\nIn microgravity ($Gr \\to 0$), hot air does not rise. Flames form quiet blue spheres that suffocate in still air, but spread rapidly when cabin HVAC fans ($10\\text{--}30\\text{ cm/s}$) blow fresh oxygen across the fuel.\n\n` +
            `**2. Active Dashboard Link (${activeInput.material} at ${activeInput.oxygenPct}% O₂, ${activeInput.airflowCms} cm/s):**\n` +
            `Predicted **${activePrediction.regime}**. Shutting down cabin fans below $3.5\\text{ cm/s}$ triggers radiative self-extinction [NTRS-20210011521].`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        citedStudies: fallbackCitations,
        agentActionBanner,
      };
      setMessages((prev) => [...prev, fallbackAiMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearHistory = () => setMessages([initialMessage]);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const promptChips: Record<TopicCategory, { label: string; prompt: string }[]> = {
    all: [
      {
        label: '📂 Tell me about SSCE (Auto-Fetch & Open)',
        prompt: 'Tell me about SSCE and open its NASA dossier',
      },
      {
        label: '🕯️ What happens to a flame in space?',
        prompt: 'What happens when you light a flame in zero gravity and why does it turn spherical and blue?',
      },
      {
        label: '🚨 Emergency Fire Procedures',
        prompt: 'What are the exact step-by-step procedures to follow when a fire alarm triggers on a spacecraft?',
      },
      {
        label: '💨 Why 3s HVAC Fan Shutdown?',
        prompt: 'Explain why shutting down ventilation fans within 3 seconds puts out fires in microgravity.',
      },
      {
        label: '👻 Invisible 600K Cool Flames',
        prompt: 'Tell me about FLEX-2 invisible 600K cool flames and open the dossier',
      },
      {
        label: '🌙 Artemis 30% O₂ Lunar Risk',
        prompt: 'Tell me about Saffire-IV and why 30% oxygen on the Moon Base is dangerous',
      },
    ],
    procedures: [
      {
        label: '🚨 Standard Cabin Fire Sequence',
        prompt: 'Provide the official NASA step-by-step emergency fire sequence from alarm trigger to ECLSS scrubbing.',
      },
      {
        label: '🧯 Fine-Water-Mist vs CO₂',
        prompt: 'Compare Fine-Water-Mist extinguishers versus CO2 extinguishers in microgravity.',
      },
    ],
    protocols: [
      {
        label: '📂 Tell me about SSCE',
        prompt: 'Tell me about SSCE (Solid Surface Combustion Experiment) and open its dossier',
      },
      {
        label: '📂 Open BASS-II Dossier',
        prompt: 'Show me BASS-II PMMA flame spread data and open its dossier',
      },
    ],
    theory: [
      {
        label: '📐 Damköhler Number (Da)',
        prompt: 'What is the Damköhler number (Da) in simple terms and how does it predict flame extinction?',
      },
      {
        label: '❄️ Radiative Quenching Physics',
        prompt: 'Why do still microgravity flames choke on radiative heat losses when buoyancy is zero?',
      },
    ],
    artemis: [
      {
        label: '🌙 Artemis 30% O₂ vs Earth Air',
        prompt: 'What happens when materials burn in Artemis Moon Base air (30% O2, 70.3 kPa) compared to Earth?',
      },
    ],
  };

  const formatInlineText = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*|\$.*?\$|\[.*?\])/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={i} className="font-bold text-white">
            {part.slice(2, -2)}
          </strong>
        );
      }
      if (part.startsWith('$') && part.endsWith('$')) {
        return (
          <span key={i} className="font-mono text-cyan-300 font-semibold px-1 rounded bg-slate-950/60 border border-cyan-500/20 text-[11px]">
            {part.slice(1, -1)}
          </span>
        );
      }
      if (part.startsWith('[') && part.endsWith(']') && (part.includes('NTRS-') || part.includes('PSI-'))) {
        const studyId = part.slice(1, -1);
        return (
          <button
            key={i}
            type="button"
            onClick={() => onOpenDossier(studyId)}
            className="inline-flex items-center gap-0.5 px-1.5 py-0.2 mx-0.5 rounded bg-cyan-500/15 hover:bg-cyan-500/30 text-cyan-300 text-[10px] font-mono font-bold border border-cyan-500/40 transition"
          >
            {studyId} ↗
          </button>
        );
      }
      return part;
    });
  };

  const renderMessageContent = (content: string) => {
    return (
      <div className="space-y-2">
        {content.split('\n\n').map((paragraph, pIdx) => {
          if (paragraph.startsWith('### ')) {
            return (
              <h4 key={pIdx} className="text-sm font-bold text-cyan-300 tracking-wide mt-2 mb-1">
                {paragraph.replace('### ', '')}
              </h4>
            );
          }
          if (paragraph.includes('\n- ') || paragraph.startsWith('- ')) {
            const lines = paragraph.split('\n');
            return (
              <ul key={pIdx} className="space-y-1 my-1.5 list-disc list-inside text-slate-200">
                {lines.map((l, lIdx) => (
                  <li key={lIdx} className="text-xs leading-relaxed">
                    {formatInlineText(l.replace(/^[-*]\s+/, ''))}
                  </li>
                ))}
              </ul>
            );
          }
          return (
            <p key={pIdx} className="text-xs leading-relaxed text-slate-200">
              {formatInlineText(paragraph)}
            </p>
          );
        })}
      </div>
    );
  };

  return (
    <>
      {!isOpen && (
        <div className="fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-50 flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 bg-[#081524]/90 backdrop-blur-md border border-cyan-500/40 px-3.5 py-2 rounded-xl shadow-2xl text-xs font-mono text-cyan-300 pointer-events-none animate-pulse">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Ask AI or say "Tell me about SSCE" to auto-open dossiers</span>
          </div>

          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="group relative flex items-center gap-3 px-4 py-3 sm:px-5 sm:py-3.5 rounded-2xl bg-gradient-to-r from-[#0a1e38] to-[#071322] border-2 border-cyan-400/80 hover:border-cyan-300 text-white shadow-[0_0_25px_rgba(34,211,238,0.45)] transition-all"
          >
            <div className="w-9 h-9 rounded-xl bg-cyan-400 text-slate-950 flex items-center justify-center font-bold">
              <ShieldAlert className="w-5 h-5 text-slate-950" />
            </div>
            <div className="text-left">
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm font-bold text-white">Safety AI & Action Agent</span>
              </div>
              <p className="text-[10px] font-mono text-cyan-300/80">Answers Questions + Opens NASA Dossiers</p>
            </div>
          </button>
        </div>
      )}

      {isOpen && (
        <div
          className={`fixed z-50 bottom-4 right-4 sm:bottom-6 sm:right-6 transition-all duration-200 flex flex-col ${
            isExpanded
              ? 'w-[96vw] sm:w-[720px] lg:w-[820px] h-[88vh] max-h-[920px]'
              : 'w-[94vw] sm:w-[480px] lg:w-[520px] h-[640px] max-h-[85vh]'
          } bg-[#061120]/98 backdrop-blur-2xl border-2 border-cyan-500/60 rounded-2xl shadow-[0_20px_70px_rgba(0,0,0,0.95)] overflow-hidden`}
        >
          <div className="bg-gradient-to-r from-[#0a1e36] via-[#071629] to-[#040e1b] px-4 py-3.5 border-b border-cyan-500/30 flex items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-cyan-400 text-slate-950 flex items-center justify-center font-bold shrink-0">
                <ShieldAlert className="w-4 h-4 text-slate-950" />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-bold text-white truncate">NASA Hybrid AI & UI Action Agent</h3>
                <p className="text-[10px] font-mono text-cyan-300/80 truncate">
                  Answers General Science + Auto-Fetches & Opens NASA Dossiers
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={handleClearHistory}
                className="p-1.5 rounded-lg bg-slate-900/80 border border-slate-700/80 text-slate-400 hover:text-rose-400 transition text-xs"
                title="Clear Chat"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-1.5 rounded-lg bg-slate-900/80 border border-slate-700/80 text-slate-400 hover:text-white transition text-xs"
              >
                {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg bg-rose-500/15 border border-rose-500/40 text-rose-300 hover:bg-rose-500 hover:text-white transition text-xs"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="bg-[#040e1b] px-3.5 py-2 border-b border-slate-800/80 shrink-0">
            <div className="text-[10px] font-mono uppercase text-slate-400 font-bold mb-1 flex items-center gap-1">
              <Zap className="w-3 h-3 text-cyan-400" />
              <span>Try Action Commands or Basic Questions:</span>
            </div>
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
              {promptChips[topicCategory].map((chip, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSendMessage(chip.prompt)}
                  className="text-[11px] font-mono px-2.5 py-1 rounded-lg bg-slate-900/90 hover:bg-cyan-500/20 text-cyan-300 border border-slate-800 transition whitespace-nowrap flex items-center gap-1 shrink-0"
                >
                  <span>{chip.label}</span>
                  <ChevronRight className="w-3 h-3 text-cyan-400/70" />
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-gradient-to-b from-[#030914] to-[#02060d]">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                <div className="flex items-center gap-1.5 mb-1 text-[10px] font-mono text-slate-400">
                  <span>{msg.role === 'user' ? '🧑‍🚀 You' : '🤖 NASA AI Agent'}</span>
                  <span>· {msg.timestamp}</span>
                </div>

                {msg.agentActionBanner && (
                  <div className="mb-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-[11px] font-mono text-emerald-300 font-bold">
                    {msg.agentActionBanner}
                  </div>
                )}

                <div
                  className={`p-3.5 sm:p-4 rounded-2xl max-w-[94%] sm:max-w-[88%] text-xs sm:text-sm leading-relaxed relative group ${
                    msg.role === 'user'
                      ? 'bg-cyan-500 text-slate-950 font-medium'
                      : 'bg-slate-900/95 border border-slate-800 text-slate-200 shadow-md'
                  }`}
                >
                  {msg.role === 'assistant' && (
                    <button
                      onClick={() => handleCopy(msg.id, msg.content)}
                      className="absolute top-2.5 right-2.5 p-1 rounded-md bg-slate-800 text-slate-400 hover:text-white opacity-0 group-hover:opacity-100 transition"
                    >
                      {copiedId === msg.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  )}

                  {msg.role === 'user' ? msg.content : renderMessageContent(msg.content)}

                  {msg.citedStudies && msg.citedStudies.length > 0 && (
                    <div className="pt-2.5 mt-2.5 border-t border-slate-800/80 flex flex-wrap items-center gap-1.5">
                      <span className="text-[10px] font-mono text-slate-400 uppercase">Open Dossier:</span>
                      {msg.citedStudies.map((id) => (
                        <button
                          key={id}
                          type="button"
                          onClick={() => onOpenDossier(id)}
                          className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/25 transition flex items-center gap-1"
                        >
                          <FileText className="w-2.5 h-2.5" />
                          {id} ↗
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex items-center gap-2 text-cyan-400 text-xs font-mono py-2 bg-slate-950/80 p-3 rounded-xl border border-cyan-500/20">
                <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
                <span>Executing AI synthesis & checking NASA NTRS/OSDR repositories...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-3 bg-[#050f1c] border-t border-cyan-500/20 shrink-0">
            <div className="flex gap-2">
              <textarea
                ref={inputRef}
                rows={2}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder="Ask anything ('What happens when...', 'Tell me about SSCE', 'Open Saffire')..."
                className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 resize-none"
              />
              <button
                type="button"
                onClick={() => handleSendMessage()}
                disabled={isLoading || !inputText.trim()}
                className="bg-gradient-to-r from-cyan-400 to-sky-400 hover:brightness-110 text-slate-950 font-bold px-4 sm:px-5 py-2 rounded-xl text-xs sm:text-sm font-mono uppercase tracking-wider transition shadow flex items-center justify-center gap-1.5 disabled:opacity-40"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                <span className="hidden sm:inline">Send</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};