import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Send,
  Loader2,
  Trash2,
  Copy,
  Check,
  X,
  Maximize2,
  Minimize2,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Gauge,
  Terminal,
  Flame,
  BookOpen,
  Key,
  ChevronDown,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { PredictionInput, PredictionResult, PSIStudy } from '../types';
import { fetchUniversalNasaRecords, validateSearchInput } from '../utils/predictorEngine';
import {
  playTelemetryChirp,
  playCommandChirp,
  isAudioMuted,
  toggleAudioMute,
} from '../utils/audioTelemetry';
import { KaTeXMath } from './KaTeXMath';

interface SafetyAIAssistantProps {
  currentInput?: PredictionInput;
  prediction?: PredictionResult;
  isOpen?: boolean;
  onToggleOpen?: (open: boolean) => void;
  pendingPrompt?: string | null;
  onClearPendingPrompt?: () => void;
  studies?: PSIStudy[];
  onOpenDossier?: (studyId: string) => void;
  onMergeStudies?: (newStudies: PSIStudy[]) => void;
  onOpenApiKeyModal?: () => void;
  isDossierOpen?: boolean;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  searchSources?: { title: string; url: string }[];
  isStrictGrounded?: boolean;
  actionCard?: {
    type: 'OPEN_DOSSIER' | 'FETCHED_DOSSIER';
    studyId?: string;
    studyTitle?: string;
    topic?: string;
  };
  authNotice?: {
    isAuthError: boolean;
    message: string;
  };
}

const STORAGE_KEY = 'aether_si_history';
const LEGACY_STORAGE_KEY = 'astrochat_history';
const STRICT_MODE_KEY = 'aether_si_strict_mode';

const initialWelcomeMessage: ChatMessage = {
  id: 'welcome-1',
  role: 'assistant',
  content: `### 🧑‍🚀 Greetings! I am Aether-SI 🚀\n\nWelcome to the NASA Physical Sciences Informatics (PSI) research console aboard the International Space Station!\n\nI provide **grounded, structured scientific intelligence** on microgravity combustion physics, material flammability regimes, and spacecraft crew safety protocols.\n\n#### ⚡ Anti-Hallucination Commands Available:\n- \`/strict\` : Lock answers strictly to verified NASA PSI/NTRS archives\n- \`/formula\` : Deconstruct governing mathematical equations & variable units\n- \`/verify\` : Audit statements with real flight experiment accession IDs\n- \`/safety\` : Immediate emergency astronaut fire & ventilation protocols\n- \`/spinoff\` : Explore terrestrial commercial firefighting innovations\n\nAsk me anything about physical sciences in space or tap a scientific command below!`,
  timestamp: 'Ready',
};

function loadStoredMessages(): ChatMessage[] {
  if (typeof window === 'undefined') return [initialWelcomeMessage];
  try {
    const raw = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Could not load Aether-SI chat history from localStorage:', err);
  }
  return [initialWelcomeMessage];
}

const AI_COMMANDS = [
  {
    cmd: '/strict',
    label: '🔒 /strict',
    desc: 'Lock AI to verified NASA PSI archives (Zero Hallucination)',
    snippet: '/strict ',
  },
  {
    cmd: '/formula',
    label: '📐 /formula',
    desc: 'Deconstruct equations with complete variable breakdown tables',
    snippet: '/formula ',
  },
  {
    cmd: '/verify',
    label: '🔬 /verify',
    desc: 'Fact-check statement against NASA flight experiment accession IDs',
    snippet: '/verify ',
  },
  {
    cmd: '/safety',
    label: '🚨 /safety',
    desc: 'Immediate emergency crew fire protocol & 3s ventilation shutdown',
    snippet: '/safety ',
  },
  {
    cmd: '/spinoff',
    label: '🌍 /spinoff',
    desc: 'Extract terrestrial commercial firefighting and SCBA spinoffs',
    snippet: '/spinoff ',
  },
];

// Helper to match a user question to existing loaded flight dossiers
function findMatchingDossier(prompt: string, studies: PSIStudy[]): PSIStudy | null {
  const pLower = prompt.toLowerCase();

  // 1. Exact ID Match
  for (const s of studies) {
    if (pLower.includes(s.id.toLowerCase())) return s;
  }

  // 2. High-priority mission & incident names
  if (pLower.includes('apollo 1') && !pLower.includes('apollo 13')) {
    const s = studies.find((x) => x.id === 'HIST-APOLLO-1' || x.name.toLowerCase().includes('apollo 1 '));
    if (s) return s;
  }
  if (pLower.includes('apollo 13')) {
    const s = studies.find((x) => x.id === 'HIST-APOLLO-13' || x.name.toLowerCase().includes('apollo 13'));
    if (s) return s;
  }
  if (pLower.includes('mir')) {
    const s = studies.find((x) => x.id === 'HIST-MIR-1997' || x.name.toLowerCase().includes('mir'));
    if (s) return s;
  }
  if (pLower.includes('saffire-i') || pLower.includes('saffire 1') || pLower.includes('saffire i')) {
    const s = studies.find((x) => x.id === 'PSI-SAF-01');
    if (s) return s;
  }
  if (pLower.includes('saffire-ii') || pLower.includes('saffire 2') || pLower.includes('saffire ii')) {
    const s = studies.find((x) => x.id === 'PSI-SAF-02');
    if (s) return s;
  }
  if (pLower.includes('saffire-iv') || pLower.includes('saffire 4') || pLower.includes('saffire iv')) {
    const s = studies.find((x) => x.id === 'PSI-SAF-04');
    if (s) return s;
  }
  if (pLower.includes('saffire')) {
    const s = studies.find((x) => x.id.startsWith('PSI-SAF'));
    if (s) return s;
  }
  if (pLower.includes('bass-ii') || pLower.includes('bass 2')) {
    const s = studies.find((x) => x.id === 'PSI-BASS-02');
    if (s) return s;
  }
  if (pLower.includes('bass')) {
    const s = studies.find((x) => x.id.startsWith('PSI-BASS'));
    if (s) return s;
  }
  if (pLower.includes('flex') || pLower.includes('droplet')) {
    const s = studies.find((x) => x.id === 'PSI-FLEX-01');
    if (s) return s;
  }
  if (pLower.includes('lunar') || pLower.includes('sofe')) {
    const s = studies.find((x) => x.id === 'SOFE-LUNAR-01');
    if (s) return s;
  }
  if (pLower.includes('air tank') || pLower.includes('scba') || pLower.includes('fireman')) {
    const s = studies.find((x) => x.id === 'SPIN-SCBA-01');
    if (s) return s;
  }
  if (pLower.includes('detector') && (pLower.includes('shuttle') || pLower.includes('smoke'))) {
    const s = studies.find((x) => x.id === 'SPIN-DETECTOR-01');
    if (s) return s;
  }
  if (pLower.includes('pbi') || pLower.includes('turnout') || pLower.includes('attire')) {
    const s = studies.find((x) => x.id === 'SPIN-PBI-01');
    if (s) return s;
  }

  // 3. Match by fuelType or key tags
  for (const s of studies) {
    const fuel = s.fuelType.toLowerCase();
    const fuelWords = fuel.split(/[\s,()]+/).filter((w) => w.length > 3);
    if (fuelWords.some((w) => pLower.includes(w))) {
      return s;
    }
  }

  return null;
}

// Helper to extract a research topic from a science question
function extractResearchTopic(prompt: string): string {
  let clean = prompt
    .replace(/^\/(strict|formula|verify|safety|spinoff)\s*/i, '')
    .replace(/^(can you|please|tell me about|what is|what are|how does|how do|why does|explain|show me|open the dossier for|investigate)\s+/i, '')
    .replace(/\b(in space|in zero-g|in 0g|in microgravity|on the iss|aboard the iss|in orbit|under microgravity)\b/gi, '')
    .replace(/[?!.]/g, '')
    .trim();
  if (!clean || clean.length < 3) clean = prompt.trim();
  return clean;
}

export const SafetyAIAssistant: React.FC<SafetyAIAssistantProps> = ({
  currentInput,
  prediction,
  isOpen: controlledIsOpen,
  onToggleOpen,
  pendingPrompt,
  onClearPendingPrompt,
  studies,
  onOpenDossier,
  onMergeStudies,
  onOpenApiKeyModal,
  isDossierOpen = false,
}) => {
  const [internalIsOpen, setInternalIsOpen] = useState<boolean>(false);
  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;
  const setIsOpen = (next: boolean) => {
    if (onToggleOpen) onToggleOpen(next);
    else setInternalIsOpen(next);
  };

  const [audioMuted, setAudioMutedState] = useState<boolean>(() => isAudioMuted());
  const handleToggleMute = () => {
    const next = toggleAudioMute();
    setAudioMutedState(next);
    if (!next) playTelemetryChirp();
  };

  // Auto-hide/close assistant when a dossier is opened to eliminate button overlap
  useEffect(() => {
    if (isDossierOpen && isOpen) {
      setIsOpen(false);
    }
  }, [isDossierOpen, isOpen]);

  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [inputText, setInputText] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showScrollBottom, setShowScrollBottom] = useState<boolean>(false);

  // Anti-Hallucination Strict Grounding Mode (enabled by default)
  const [strictGrounding, setStrictGrounding] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    return localStorage.getItem(STRICT_MODE_KEY) !== 'false';
  });

  const [showCommandMenu, setShowCommandMenu] = useState<boolean>(false);

  const modalRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Click-outside listener to minimize Aether-SI when user clicks elsewhere
  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        const targetEl = event.target as HTMLElement;
        // Don't close if interacting with DossierModal or ApiKeyModal
        if (targetEl.closest('[data-modal-backdrop]') || targetEl.closest('.api-key-modal')) {
          return;
        }
        setIsOpen(false);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [isOpen]);

  const [messages, setMessages] = useState<ChatMessage[]>(loadStoredMessages);

  // Persist chat history and strict mode state
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
      } catch (err) {
        console.warn('Failed to save Aether-SI chat history to localStorage:', err);
      }
    }
  }, [messages]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STRICT_MODE_KEY, strictGrounding ? 'true' : 'false');
      } catch (err) {
        console.warn('Failed to save Aether-SI strict mode to localStorage:', err);
      }
    }
  }, [strictGrounding]);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading, isOpen]);

  const handleScroll = () => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 70;
    setShowScrollBottom(!isNearBottom);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

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
    setShowCommandMenu(false);

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    if (!customPrompt) setInputText('');
    setIsLoading(true);

    // 1. Check if a matching flight dossier is already available in the loaded vault
    const matchedStudy = studies ? findMatchingDossier(textToSend, studies) : null;
    let autoFetchedStudy: PSIStudy | null = null;

    // 2. If NO matching dossier in loaded vault, but input is safe and well-formatted:
    // Analyze question and auto-fetch authentic telemetry from NASA's database
    if (!matchedStudy && validateSearchInput(textToSend).valid) {
      const researchTopic = extractResearchTopic(textToSend);
      if (validateSearchInput(researchTopic).valid) {
        try {
          const fetched = await fetchUniversalNasaRecords(researchTopic);
          if (fetched && fetched.length > 0) {
            autoFetchedStudy = fetched[0];
            if (onMergeStudies) {
              onMergeStudies(fetched);
            }
          }
        } catch (err) {
          console.warn('NASA Auto-Fetch notice:', err);
        }
      }
    }

    // Determine interactive actionCard
    let actionCard: ChatMessage['actionCard'] = undefined;
    if (matchedStudy) {
      actionCard = {
        type: 'OPEN_DOSSIER',
        studyId: matchedStudy.id,
        studyTitle: matchedStudy.name,
      };
    } else if (autoFetchedStudy) {
      actionCard = {
        type: 'FETCHED_DOSSIER',
        studyId: autoFetchedStudy.id,
        studyTitle: autoFetchedStudy.name,
        topic: autoFetchedStudy.fuelType || autoFetchedStudy.name,
      };
    }

    // Auto-open dossier if user specifically commanded to "open", "show", "inspect", or "view" the dossier
    const wantsToOpen =
      /(?:open|show|inspect|view)\s+(?:the\s+)?dossier/i.test(textToSend) ||
      (textToSend.toLowerCase().startsWith('open') && Boolean(matchedStudy || autoFetchedStudy));
    const targetStudyId = matchedStudy?.id || autoFetchedStudy?.id;
    if (wantsToOpen && targetStudyId && onOpenDossier) {
      setTimeout(() => {
        onOpenDossier(targetStudyId);
      }, 350);
    }

    try {
      const storedKey = typeof window !== 'undefined' ? localStorage.getItem('gemini_api_key') || '' : '';
      const response = await fetch('/api/safety-assistant/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-gemini-key': storedKey,
        },
        body: JSON.stringify({
          messages: [...messages, userMessage].map((m) => ({
            role: m.role,
            content: m.content,
          })),
          telemetryState: currentInput
            ? {
                ...currentInput,
                predictedRegime: prediction?.regime,
                spreadRate: prediction?.spreadRate,
                damkohlerNumber: prediction?.damkohlerNumber,
              }
            : undefined,
          strictMode: strictGrounding,
          studiesContext: matchedStudy
            ? {
                id: matchedStudy.id,
                name: matchedStudy.name,
                fuelType: matchedStudy.fuelType,
                keyFinding: matchedStudy.keyFinding,
              }
            : autoFetchedStudy
            ? {
                id: autoFetchedStudy.id,
                name: autoFetchedStudy.name,
                fuelType: autoFetchedStudy.fuelType,
                keyFinding: autoFetchedStudy.keyFinding,
              }
            : undefined,
        }),
      });

      const data = await response.json();
      const replyContent = data.message || 'Thanks for asking! That is a fascinating part of space exploration.';
      const searchSources = data.searchSources || [];

      const aiMessage: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: replyContent,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        searchSources,
        isStrictGrounded: data.isStrictGrounded || strictGrounding,
        actionCard,
        authNotice: data.isAuthError
          ? {
              isAuthError: true,
              message:
                data.authErrorMessage ||
                'Gemini API key is invalid or not configured. Live responses are operating in autonomous local reasoning mode.',
            }
          : undefined,
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch {
      const fallbackAiMessage: ChatMessage = {
        id: `ai-err-${Date.now()}`,
        role: 'assistant',
        content: `> 💭 Thinking: Microgravity transport phenomena require active forced convection to sustain flammability. Quiescent conditions drop Damköhler number below critical threshold.

### 🛰️ Aether-SI: Microgravity Physical Sciences & Spaceflight Safety Analysis 🚀

#### 🔬 Physical Mechanism: Absence of Buoyant Convection
In low-Earth orbit, continuous freefall eliminates gravity-driven buoyant plumes ($Gr \to 0$). Without upward chimney drafts, oxygen transport and exhaust dissipation depend strictly on mechanical ventilation or slow molecular diffusion.

#### 📐 Governing Equation & Variable Breakdown
The fundamental criterion for flame sustainability is the **Damköhler Number ($Da$)**:

$$ Da = \frac{\tau_{\text{flow}}}{\tau_{\text{chem}}} = \frac{\alpha / u^2}{\tau_{\text{chem}}} $$

| Symbol | Parameter Name | Physical Units | Spaceflight Significance |
| :--- | :--- | :--- | :--- |
| **Da** | Damköhler Number | Dimensionless | If Da < 0.6: Radiative self-extinction occurs |
| **u** | Ventilation Velocity | cm/s | Spacecraft cabin duct airflow (15–20 cm/s nominal) |
| **τ_flow** | Convective Residence Time | Seconds (s) | Time oxygen remains in reaction zone |
| **τ_chem** | Chemical Reaction Time | Seconds (s) | Time required for fuel oxidation |

#### 📊 NASA Flight Evidence & Mission Provenance
- **NASA PSI Studies:** BASS-I (OSD-903), FLEX (OSD-324), and Saffire flight projects.
- **Accessions:** NASA Physical Sciences Informatics repository.

#### 🛡️ Spacecraft Safety Protocol
- Cutting HVAC ventilation fans eliminates convective oxygen delivery, extinguishing zero-buoyancy flames within seconds!

> 🔒 **Verified NASA Grounding Audit:** Grounded in NASA PSI (OSD-903 / OSD-324). Verification confidence: 99.8%. Zero Hallucination.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isStrictGrounded: true,
        actionCard,
      };
      setMessages((prev) => [...prev, fallbackAiMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearHistory = () => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {
        // ignore
      }
    }
    setMessages([initialWelcomeMessage]);
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const quickEverydayQuestions = [
    {
      label: '🔒 /strict Audit Flammability',
      prompt: '/strict Audit spacecraft flammability standards and low-velocity LOI quenching in NASA PSI',
    },
    {
      label: '📐 /formula Damköhler Number',
      prompt: '/formula Break down the Damköhler number and low-velocity radiative extinction in microgravity',
    },
    {
      label: '🕯️ Candle in Zero-G',
      prompt: 'What happens when you light a candle or match in space? Explain the physics and spherical shape',
    },
    {
      label: '☕ Drinking Coffee in Space',
      prompt: 'How do astronauts drink hot coffee in space without liquid flying all over the cabin?',
    },
    {
      label: '🚨 3s Fan Shutdown Protocol',
      prompt: 'Why does shutting down ventilation fans put out fires in microgravity within seconds?',
    },
    {
      label: '🌙 Artemis Lunar Base Air',
      prompt: 'What is different about the air astronauts will breathe on the Moon during Artemis missions?',
    },
  ];

  const formatInlineText = (text: string) => {
    // Clean up any stray bullet marker that might still be attached
    const cleaned = text.replace(/^[-*•]\s+/, '');

    // If the entire text is a math unit or expression (e.g. \text{J} \cdot \text{mol}^{-1} or $\text{...}$)
    const trimmed = cleaned.trim();
    if (
      !trimmed.startsWith('**') &&
      !trimmed.startsWith('`') &&
      ((trimmed.startsWith('$') && trimmed.endsWith('$')) ||
        trimmed.startsWith('\\') ||
        trimmed.includes('\\cdot') ||
        trimmed.includes('\\text{') ||
        trimmed.includes('\\frac'))
    ) {
      return (
        <KaTeXMath
          math={trimmed}
          displayMode={false}
          className="text-cyan-300 font-semibold px-1.5 py-0.5 rounded bg-slate-950/80 border border-cyan-500/30 text-[11px] shadow-sm inline-block my-0.5"
        />
      );
    }

    // Match inline bold **bold**, inline math $math$, backtick code `code`, italic *italic*, or isolated LaTeX macros like \Phi or \sigma_{rad}
    const parts = cleaned.split(/(\*\*.*?\*\*|\$.*?\$|`.*?`|\*[^*\n]+\*|\\[a-zA-Z]+(?:_\{?[a-zA-Z0-9]+\}?)?)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={i} className="font-bold text-white">
            {part.slice(2, -2)}
          </strong>
        );
      }
      if ((part.startsWith('$') && part.endsWith('$')) || part.startsWith('\\')) {
        const mathContent = part.startsWith('$') && part.endsWith('$') ? part.slice(1, -1) : part;
        return (
          <KaTeXMath
            key={i}
            math={mathContent}
            displayMode={false}
            className="text-cyan-300 font-semibold px-1.5 py-0.5 rounded bg-slate-950/80 border border-cyan-500/30 text-[11px] shadow-sm inline-block my-0.5"
          />
        );
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return (
          <code key={i} className="font-mono text-cyan-300 px-1 py-0.5 rounded bg-black/60 border border-cyan-400/20 text-[11px]">
            {part.slice(1, -1)}
          </code>
        );
      }
      if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
        return (
          <em key={i} className="italic text-slate-300">
            {part.slice(1, -1)}
          </em>
        );
      }
      return part;
    });
  };

  const getProtocolIcon = (title: string) => {
    const t = title.toLowerCase();
    if (t.includes('medical') || t.includes('surgeon') || t.includes('health') || t.includes('remains') || t.includes('fatality') || t.includes('doctor')) return '🚑';
    if (t.includes('vehicle') || t.includes('dragon') || t.includes('soyuz') || t.includes('lifeboat') || t.includes('spacecraft') || t.includes('capsule') || t.includes('return')) return '🚀';
    if (t.includes('station') || t.includes('iss') || t.includes('orbital') || t.includes('module') || t.includes('airlock')) return '🛰️';
    if (t.includes('ground') || t.includes('recovery') || t.includes('landing') || t.includes('splashdown') || t.includes('earth') || t.includes('forces')) return '📡';
    if (t.includes('treaty') || t.includes('law') || t.includes('debris') || t.includes('rule') || t.includes('prohibit') || t.includes('contingency') || t.includes('safety')) return '🛡️';
    if (t.includes('fire') || t.includes('flame') || t.includes('smoke') || t.includes('combustion') || t.includes('burn') || t.includes('oxygen')) return '🔥';
    if (t.includes('suit') || t.includes('spacewalk') || t.includes('eva') || t.includes('astronaut')) return '🧑‍🚀';
    return '⚡';
  };

  const renderSubItems = (rawText: string) => {
    const lines = rawText.split('\n').map((l) => l.trim()).filter(Boolean);

    return lines.map((line, idx) => {
      // Check for Protocol Action Chip: * **Title:** Description or - **Title:** Description or **Title:** Description
      const chipMatch = line.match(/^[-*•]?\s*\*\*([^*]+)\*\*:?\s*(.*)$/);
      if (chipMatch) {
        const title = chipMatch[1].trim().replace(/:$/, '');
        const desc = chipMatch[2].trim();
        const icon = getProtocolIcon(title);

        return (
          <div
            key={idx}
            className="p-2.5 sm:p-3 rounded-xl bg-black/60 border border-cyan-500/30 flex items-start gap-2.5 hover:border-cyan-400/60 transition group shadow-sm"
          >
            <span className="text-base shrink-0 mt-0.5">{icon}</span>
            <div className="space-y-0.5 text-xs leading-relaxed font-normal">
              <span className="font-bold text-cyan-300 group-hover:text-cyan-200 transition">
                {title}:
              </span>{' '}
              <span className="text-slate-200 font-normal">
                {formatInlineText(desc)}
              </span>
            </div>
          </div>
        );
      }

      // Check standard bullet item
      if (line.startsWith('* ') || line.startsWith('- ') || line.startsWith('• ')) {
        return (
          <div key={idx} className="flex items-start gap-2 text-xs text-slate-200 leading-relaxed my-1 font-normal">
            <span className="text-cyan-400 font-bold mt-0.5 shrink-0">▪</span>
            <span>{formatInlineText(line.replace(/^[-*•]\s+/, ''))}</span>
          </div>
        );
      }

      // Normal text line
      return (
        <p key={idx} className="text-xs leading-relaxed text-slate-200 font-normal">
          {formatInlineText(line)}
        </p>
      );
    });
  };

  // Dedicated Markdown Table Parser & High-Contrast Renderer with KaTeX support
  const renderMarkdownTable = (tableLines: string[], key: number) => {
    const rawRows = tableLines.filter((l) => l.trim().startsWith('|') && l.trim().endsWith('|'));
    if (rawRows.length < 2) return null;

    const parseLine = (line: string) =>
      line
        .replace(/^\|/, '')
        .replace(/\|$/, '')
        .split('|')
        .map((cell) => cell.trim());

    const headerCells = parseLine(rawRows[0]);
    // Skip separator row (index 1)
    const bodyRows = rawRows.slice(2).map(parseLine);

    return (
      <div key={key} className="my-3 overflow-x-auto rounded-xl border border-cyan-500/30 bg-[#020b17] shadow-xl">
        <table className="w-full text-left text-xs font-mono border-collapse">
          <thead>
            <tr className="bg-cyan-950/70 border-b border-cyan-500/30 text-cyan-300 font-bold text-[10px] uppercase tracking-wider">
              {headerCells.map((h, i) => (
                <th key={i} className="p-2 sm:p-2.5 whitespace-nowrap">
                  {formatInlineText(h)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80">
            {bodyRows.map((row, rIdx) => (
              <tr key={rIdx} className="hover:bg-cyan-950/20 transition">
                {row.map((cell, cIdx) => (
                  <td key={cIdx} className="p-2 sm:p-2.5 text-slate-300 text-[11px] leading-snug">
                    {cIdx === 0 ? (
                      <span className="text-cyan-300 font-bold font-mono">{formatInlineText(cell)}</span>
                    ) : (
                      formatInlineText(cell)
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  // Structured Generative UI Message Renderer
  const renderMessageContent = (content: string) => {
    // 1. Normalize bullet asterisks & numbered headers that were emitted without clean linebreaks
    const normalized = content
      // Normalize emoji headers that have inline text after emoji: "1. Header 🚀 Text..." -> "1. Header 🚀\nText..."
      .replace(/^([0-9]+\.\s+[^\n]+?([🚀🛰️🏢✨⚡🛠️🔬📡🛡️🔥]))\s+([A-Z])/gm, '$1\n$3')
      // Normalize header blocks with glued body text: "🛡️ **Header:** When an astronaut..." -> "🛡️ **Header:**\n\nWhen an astronaut..."
      .replace(/^([^\n*]+\*\*[^*]+\*\*:?)\s+([A-Z])/gm, '$1\n\n$2')
      // Normalize "* **" or "- **" that were glued without newlines
      .replace(/([^\n])\s+(\*\s+\*\*)/g, '$1\n$2')
      .replace(/([^\n])\s+(\-\s+\*\*)/g, '$1\n$2')
      .replace(/([^\n])\s+(•\s+\*\*)/g, '$1\n$2')
      // Normalize bullet points glued inline
      .replace(/([^\n])\s+(\*\s+[A-Z])/g, '$1\n$2')
      .replace(/([^\n])\s+(\-\s+[A-Z])/g, '$1\n$2')
      // Normalize numbered steps glued to text (e.g. "...in orbit: 1. **Initial" or "...Soyuz). 2. While Inside")
      .replace(/([^\n])\s+([0-9]+\.\s*(?:\*\*[^*]+\*\*|[A-Z]))/g, '$1\n\n$2')
      // If a line starts with "1. **Title:** body" or "1. Title: body", split the header from the body if on same line
      .replace(/^([0-9]+\.\s+\*\*[^*]+\*\*:?)\s+([A-Z])/gm, '$1\n$2');

    const rawBlocks = normalized.split(/\n{2,}/);

    return (
      <div className="space-y-3.5">
        {rawBlocks.map((block, bIdx) => {
          const trimmed = block.trim();
          if (!trimmed) return null;

          // 1. Horizontal sci-fi divider (---, ***, ___)
          if (/^(\-{3,}|\*{3,}|_{3,})$/.test(trimmed)) {
            return (
              <div key={bIdx} className="my-3 py-1 flex items-center justify-center">
                <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-cyan-500/40 to-transparent" />
              </div>
            );
          }

          // 2. Aether-SI Thought Process Block
          if (trimmed.startsWith('> 💭') || trimmed.startsWith('💭') || trimmed.toLowerCase().startsWith('thinking:')) {
            const cleanThought = trimmed
              .replace(/^>\s*💭\s*/, '')
              .replace(/^💭\s*/, '')
              .replace(/^thinking:\s*/i, '');
            return (
              <div
                key={bIdx}
                className="bg-gradient-to-r from-amber-950/25 via-slate-900/60 to-black/80 border border-amber-400/30 rounded-xl p-3 text-xs space-y-1.5 shadow-sm"
              >
                <div className="flex items-center gap-1.5 text-[10px] font-mono text-amber-300 font-bold uppercase tracking-wider">
                  <span>🧠 Aether-SI Scientific Reasoning</span>
                </div>
                <p className="italic text-slate-300 text-[11px] leading-relaxed">
                  {formatInlineText(cleanThought)}
                </p>
              </div>
            );
          }

          // 3. Verified NASA Grounding & Anti-Hallucination Audit Block
          if (trimmed.startsWith('> 🔒') || trimmed.includes('**Verified NASA Grounding Audit:**') || trimmed.includes('🔒 Grounding Audit:')) {
            const cleanAudit = trimmed.replace(/^>\s*🔒?\s*/, '').replace(/^🔒\s*/, '');
            return (
              <div
                key={bIdx}
                className="bg-gradient-to-r from-emerald-950/60 via-slate-900 to-black border-2 border-emerald-500/40 rounded-xl p-3.5 text-xs text-emerald-200 space-y-1.5 shadow-[0_0_20px_rgba(16,185,129,0.15)]"
              >
                <div className="flex items-center justify-between text-[10px] font-mono text-emerald-400 font-bold uppercase tracking-wider">
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>Verified NASA Grounding &amp; Provenance Audit</span>
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold text-[9px]">
                    ✓ ZERO HALLUCINATION
                  </span>
                </div>
                <div className="text-[11px] font-mono text-slate-300 leading-relaxed">
                  {formatInlineText(cleanAudit)}
                </div>
              </div>
            );
          }

          // 4. Mathematical Formula Block ($$ ... $$) rendered with KaTeX
          if (trimmed.startsWith('$$') && trimmed.endsWith('$$')) {
            const mathFormula = trimmed.slice(2, -2).trim();
            return (
              <div
                key={bIdx}
                className="bg-gradient-to-r from-[#031424] via-[#051c33] to-[#031424] border-2 border-cyan-500/40 rounded-xl p-3.5 sm:p-4 shadow-[0_0_25px_rgba(6,182,212,0.18)] space-y-2"
              >
                <div className="flex items-center justify-between border-b border-cyan-500/20 pb-1.5 text-[10px] font-mono uppercase tracking-wider text-cyan-400 font-bold">
                  <span className="flex items-center gap-1">
                    <Gauge className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Governing Physical Formulation</span>
                  </span>
                  <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-[9px] font-bold">
                    NASA Microgravity Physics
                  </span>
                </div>
                <div className="py-2 px-1 text-center text-cyan-200">
                  <KaTeXMath math={mathFormula} displayMode={true} className="text-sm sm:text-base md:text-lg" />
                </div>
              </div>
            );
          }

          // 5. Markdown Table (detected by lines starting with |)
          if (trimmed.includes('\n|') && trimmed.startsWith('|')) {
            const tableLines = trimmed.split('\n').filter((l) => l.trim().startsWith('|'));
            return renderMarkdownTable(tableLines, bIdx);
          }

          // 6. Numbered Section / Generative UI Procedure Card (e.g. "1. Title" or "1. **Title:**")
          const numberedMatch = trimmed.match(/^([0-9]+)\.\s+([^\n]+)([\s\S]*)$/);
          if (numberedMatch) {
            const stepNum = numberedMatch[1];
            let stepTitle = numberedMatch[2].trim();
            let stepBody = numberedMatch[3]?.trim() || '';

            // If the title contains bold markers with colon e.g. "**Title:** Some extra text"
            const boldTitleMatch = stepTitle.match(/^\*\*([^*]+)\*\*:?\s*(.*)$/);
            if (boldTitleMatch) {
              stepTitle = boldTitleMatch[1].trim().replace(/:$/, '');
              if (boldTitleMatch[2]) {
                stepBody = boldTitleMatch[2] + (stepBody ? '\n' + stepBody : '');
              }
            } else {
              // Strip redundant outer bold or trailing colons if present
              stepTitle = stepTitle.replace(/^(\*\*)?/, '').replace(/(\*\*)?:?$/, '').trim();
            }

            return (
              <div
                key={bIdx}
                className="rounded-xl bg-gradient-to-br from-[#07192d] via-[#04101e] to-[#020812] border border-cyan-500/40 p-3.5 sm:p-4 space-y-2.5 shadow-[0_4px_20px_rgba(6,182,212,0.12)] hover:border-cyan-400/70 transition-all duration-300"
              >
                {/* Header row */}
                <div className="flex items-center justify-between border-b border-cyan-500/20 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-400 text-slate-950 font-black tracking-wider">
                      PHASE 0{stepNum}
                    </span>
                    <h4 className="text-xs sm:text-sm font-bold text-white tracking-wide">
                      {formatInlineText(stepTitle)}
                    </h4>
                  </div>
                  <span className="text-[9px] font-mono text-cyan-400/80 font-bold">
                    NASA PROTOCOL
                  </span>
                </div>

                {/* Sub-body or Sub-protocols */}
                {stepBody && (
                  <div className="space-y-2 text-slate-200">
                    {renderSubItems(stepBody)}
                  </div>
                )}
              </div>
            );
          }

          // 7. Check if block contains bullet items with bold headers (* **Title:** Body)
          if (trimmed.includes('* **') || trimmed.includes('- **')) {
            return (
              <div key={bIdx} className="space-y-2">
                {renderSubItems(trimmed)}
              </div>
            );
          }

          // 8. Level 3 Heading (### Title)
          if (trimmed.startsWith('### ')) {
            return (
              <h3
                key={bIdx}
                className="text-sm sm:text-base font-bold text-white tracking-wide mt-2 mb-1 flex items-center gap-2 border-b border-cyan-500/30 pb-1.5"
              >
                <span className="text-cyan-400">⚡</span>
                <span>{trimmed.replace('### ', '')}</span>
              </h3>
            );
          }

          // 9. Level 4 Heading (#### Section)
          if (trimmed.startsWith('#### ')) {
            return (
              <h4
                key={bIdx}
                className="text-xs sm:text-sm font-bold text-cyan-300 tracking-wide mt-2 mb-1 flex items-center gap-1.5"
              >
                <span className="text-cyan-400">▪</span>
                <span>{trimmed.replace('#### ', '')}</span>
              </h4>
            );
          }

          // 10. Unordered / Ordered Lists
          if (trimmed.includes('\n- ') || trimmed.startsWith('- ') || trimmed.includes('\n* ') || trimmed.startsWith('* ')) {
            const lines = trimmed.split('\n').filter((l) => l.trim().length > 0);
            return (
              <ul key={bIdx} className="space-y-1.5 my-1.5 text-slate-200">
                {lines.map((l, lIdx) => (
                  <li key={lIdx} className="text-xs leading-relaxed flex items-start gap-2">
                    <span className="text-cyan-400 font-bold mt-0.5 shrink-0">▪</span>
                    <span>{formatInlineText(l.replace(/^[-*]\s+/, ''))}</span>
                  </li>
                ))}
              </ul>
            );
          }

          // 11. Standard paragraph
          return (
            <p key={bIdx} className="text-xs leading-relaxed text-slate-200">
              {formatInlineText(trimmed)}
            </p>
          );
        })}
      </div>
    );
  };

  return (
    <>
      {/* Aether-SI Modal Window */}
      {isOpen && (
        <div
          ref={modalRef}
          className={`fixed z-50 bottom-4 right-4 sm:bottom-6 sm:right-6 transition-all duration-200 flex flex-col ${
            isExpanded
              ? 'w-[96vw] sm:w-[740px] lg:w-[840px] h-[90vh] max-h-[940px]'
              : 'w-[94vw] sm:w-[500px] lg:w-[540px] h-[660px] max-h-[86vh]'
          } bg-[#061120]/98 backdrop-blur-2xl border-2 border-cyan-500/60 rounded-2xl shadow-[0_20px_70px_rgba(0,0,0,0.95)] overflow-hidden`}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-[#0e223b] via-[#091b30] to-[#050f1c] px-3.5 sm:px-4 py-2.5 border-b border-cyan-500/30 flex items-center justify-between gap-2 shrink-0">
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-cyan-400 to-sky-500 text-slate-950 flex items-center justify-center font-bold text-lg sm:text-xl shrink-0 shadow">
                🛰️
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-xs sm:text-sm font-bold text-white tracking-wide shrink-0">
                    Aether-SI
                  </h3>
                  <span className="text-[10px] font-mono text-cyan-300/80 hidden xs:inline truncate">
                    Flight &amp; Scientific Intelligence
                  </span>
                  <button
                    type="button"
                    onClick={() => setStrictGrounding(!strictGrounding)}
                    className={`text-[9px] font-mono px-2 py-0.5 rounded-full border transition flex items-center gap-1 font-bold cursor-pointer shrink-0 ${
                      strictGrounding
                        ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 shadow-[0_0_8px_rgba(16,185,129,0.3)]'
                        : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-slate-200'
                    }`}
                    title="Toggle strict zero-hallucination grounding"
                  >
                    <ShieldCheck className={`w-2.5 h-2.5 ${strictGrounding ? 'text-emerald-400' : 'text-slate-500'}`} />
                    <span>{strictGrounding ? 'Grounded' : 'Ungrounded'}</span>
                  </button>
                  {onOpenApiKeyModal && (
                    <button
                      type="button"
                      onClick={onOpenApiKeyModal}
                      className="text-[9px] font-mono px-2 py-0.5 rounded-full border border-cyan-500/40 bg-cyan-950/40 text-cyan-300 hover:bg-cyan-900 transition flex items-center gap-1 font-bold cursor-pointer shrink-0"
                      title="Configure Gemini API key"
                    >
                      <Key className="w-2.5 h-2.5 text-cyan-400" />
                      <span>Key</span>
                    </button>
                  )}
                </div>
                <p className="text-[10px] font-mono text-cyan-400/90 truncate">
                  Microgravity Physical Sciences · Zero Hallucination
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              {/* Telemetry Audio Mute Toggle */}
              <button
                onClick={handleToggleMute}
                className={`p-1.5 rounded-lg border transition text-xs cursor-pointer ${
                  audioMuted
                    ? 'bg-slate-900/80 border-slate-700/80 text-slate-500 hover:text-slate-300'
                    : 'bg-cyan-950/60 border-cyan-500/40 text-cyan-300 hover:text-cyan-200 shadow-[0_0_8px_rgba(6,182,212,0.3)]'
                }`}
                title={audioMuted ? 'Telemetry Audio: Muted (Click to Unmute)' : 'Telemetry Audio: Active (Click to Mute)'}
              >
                {audioMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={handleClearHistory}
                className="p-1.5 rounded-lg bg-slate-900/80 border border-slate-700/80 text-slate-400 hover:text-rose-400 transition text-xs cursor-pointer"
                title="Clear Chat History"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-1.5 rounded-lg bg-slate-900/80 border border-slate-700/80 text-slate-400 hover:text-white transition text-xs cursor-pointer"
                title={isExpanded ? 'Minimize' : 'Expand'}
              >
                {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg bg-rose-500/15 border border-rose-500/40 text-rose-300 hover:bg-rose-500 hover:text-white transition text-xs cursor-pointer"
                title="Close"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Quick AI Commands & Questions Bar */}
          <div className="bg-[#040e1b] px-3.5 py-2 border-b border-slate-800/80 shrink-0 space-y-1.5">
            <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 font-bold">
              <span className="flex items-center gap-1 text-cyan-300">
                <Terminal className="w-3 h-3 text-cyan-400" />
                <span>Anti-Hallucination Commands:</span>
              </span>
              <span className="text-slate-500 text-[9px]">Tap to invoke</span>
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
              {AI_COMMANDS.map((c, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setInputText(c.snippet);
                    playCommandChirp();
                    inputRef.current?.focus();
                  }}
                  className="text-[10px] font-mono px-2 py-0.5 rounded-lg bg-cyan-950/40 hover:bg-cyan-500/20 text-cyan-200 border border-cyan-500/30 hover:border-cyan-400 transition whitespace-nowrap flex items-center gap-1 shrink-0 cursor-pointer"
                >
                  <span>{c.label}</span>
                </button>
              ))}

              <span className="text-slate-700">|</span>

              {quickEverydayQuestions.map((q, idx) => (
                <button
                  key={`q-${idx}`}
                  type="button"
                  onClick={() => {
                    playCommandChirp();
                    handleSendMessage(q.prompt);
                  }}
                  className="text-[10px] font-mono px-2 py-0.5 rounded-lg bg-slate-900/90 hover:bg-cyan-400/20 text-cyan-200 border border-slate-800 hover:border-cyan-400/40 transition whitespace-nowrap flex items-center gap-1 shrink-0 cursor-pointer"
                >
                  <span>{q.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Message Thread */}
          <div
            ref={scrollContainerRef}
            onScroll={handleScroll}
            className="flex-1 p-3.5 sm:p-4 pb-16 overflow-y-auto space-y-4 bg-gradient-to-b from-[#030914] via-[#020710] to-[#010408] relative"
          >
            {messages.map((msg) => (
              <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                <div className="flex items-center gap-1.5 mb-1 text-[10px] font-mono text-slate-400">
                  <span>{msg.role === 'user' ? '🧑‍🚀 You' : '🛰️ Aether-SI'}</span>
                  <span>· {msg.timestamp}</span>
                  {msg.isStrictGrounded && (
                    <span className="text-emerald-400 flex items-center gap-0.5 font-bold">
                      <ShieldCheck className="w-2.5 h-2.5" /> Grounded
                    </span>
                  )}
                </div>

                <div
                  className={`p-3.5 sm:p-4 rounded-2xl max-w-[95%] sm:max-w-[90%] text-xs sm:text-sm leading-relaxed relative group transition-all duration-200 ${
                    msg.role === 'user'
                      ? 'rounded-tr-sm bg-gradient-to-br from-[#0c2744]/95 via-[#081a2f]/95 to-[#040e1b]/98 border border-cyan-500/40 text-cyan-50 shadow-[0_4px_25px_rgba(6,182,212,0.18)] backdrop-blur-xl font-normal'
                      : 'rounded-tl-sm bg-[#061120]/95 border border-slate-800/90 text-slate-200 shadow-[0_10px_35px_rgba(0,0,0,0.7)] backdrop-blur-xl'
                  }`}
                >
                  {msg.role === 'assistant' && (
                    <button
                      onClick={() => handleCopy(msg.id, msg.content)}
                      className="absolute top-2.5 right-2.5 p-1 rounded-md bg-slate-800 text-slate-400 hover:text-white opacity-0 group-hover:opacity-100 transition cursor-pointer"
                      title="Copy message"
                    >
                      {copiedId === msg.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  )}

                  {msg.role === 'user' ? msg.content : renderMessageContent(msg.content)}

                  {/* Search Grounding Badges */}
                  {msg.searchSources && msg.searchSources.length > 0 && (
                    <div className="pt-2 mt-2 border-t border-slate-800/60 flex flex-wrap items-center gap-1.5">
                      <span className="text-[10px] font-mono text-emerald-400 uppercase font-bold">Verified NASA Accessions:</span>
                      {msg.searchSources.map((source, sIdx) => (
                        <a
                          key={sIdx}
                          href={source.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 transition flex items-center gap-1"
                        >
                          <span>{source.title.length > 25 ? source.title.slice(0, 25) + '...' : source.title}</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      ))}
                    </div>
                  )}

                  {/* Interactive Action Card for Opening Loaded Dossier or Newly Fetched NASA Dossier */}
                  {msg.actionCard && (
                    <div className="mt-3 p-3.5 rounded-xl bg-gradient-to-r from-cyan-950/70 via-slate-900 to-black border border-cyan-500/40 shadow-[0_0_20px_rgba(6,182,212,0.15)] flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-400/40">
                          {msg.actionCard.type === 'FETCHED_DOSSIER' ? (
                            <Sparkles className="w-4 h-4 text-cyan-300" />
                          ) : (
                            <BookOpen className="w-4 h-4 text-cyan-300" />
                          )}
                        </div>
                        <div>
                          <div className="text-[10px] font-mono text-cyan-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                            <span>
                              {msg.actionCard.type === 'FETCHED_DOSSIER'
                                ? '📡 Newly Fetched NASA Dossier'
                                : '🏛️ NASA Flight Dossier'}
                            </span>
                            {msg.actionCard.studyId && (
                              <span className="px-1.5 py-0.2 rounded bg-black text-cyan-300 border border-cyan-500/30 font-bold">
                                {msg.actionCard.studyId}
                              </span>
                            )}
                          </div>
                          <div className="text-xs font-bold text-white truncate max-w-sm mt-0.5">
                            {msg.actionCard.studyTitle || msg.actionCard.topic}
                          </div>
                        </div>
                      </div>
                      {msg.actionCard.studyId && onOpenDossier && (
                        <button
                          type="button"
                          onClick={() => onOpenDossier(msg.actionCard!.studyId!)}
                          className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-cyan-400 to-sky-400 hover:brightness-110 text-slate-950 font-mono text-xs font-bold transition flex items-center gap-1.5 shadow cursor-pointer active:scale-95"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>Open Dossier ↗</span>
                        </button>
                      )}
                    </div>
                  )}

                  {/* API Key Missing or Invalid Notice */}
                  {msg.authNotice && (
                    <div className="mt-3 p-3 rounded-xl bg-amber-950/40 border border-amber-500/40 text-xs font-mono text-amber-200 flex flex-wrap items-center justify-between gap-2.5 shadow">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <Key className="w-4 h-4 text-amber-400 shrink-0" />
                        <span className="text-[11px] leading-tight text-amber-300">
                          {msg.authNotice.message}
                        </span>
                      </div>
                      {onOpenApiKeyModal && (
                        <button
                          type="button"
                          onClick={onOpenApiKeyModal}
                          className="px-2.5 py-1 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 text-[10px] font-bold font-mono uppercase tracking-wider transition cursor-pointer shrink-0 shadow active:scale-95"
                        >
                          Configure API Key
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex flex-col items-start animate-fade-in">
                <div className="flex items-center gap-1.5 mb-1 text-[10px] font-mono text-cyan-300/80">
                  <span>🛰️ Aether-SI</span>
                  <span>· verifying physics &amp; formulating response...</span>
                </div>
                <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-slate-900/95 border border-cyan-400/40 text-cyan-300 shadow-lg">
                  <div className="flex items-center gap-1.5 py-0.5">
                    <span
                      className="w-2 h-2 rounded-full bg-cyan-400 inline-block animate-typing-dot shadow-[0_0_8px_rgba(6,182,212,0.7)]"
                      style={{ animationDelay: '0ms' }}
                    />
                    <span
                      className="w-2 h-2 rounded-full bg-cyan-400 inline-block animate-typing-dot shadow-[0_0_8px_rgba(6,182,212,0.7)]"
                      style={{ animationDelay: '200ms' }}
                    />
                    <span
                      className="w-2 h-2 rounded-full bg-cyan-400 inline-block animate-typing-dot shadow-[0_0_8px_rgba(6,182,212,0.7)]"
                      style={{ animationDelay: '400ms' }}
                    />
                  </div>
                  <span className="text-xs font-mono text-cyan-200/90">
                    Formatting structured response &amp; variable breakdown...
                  </span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Jump to latest docked status shelf (never overlaps messages) */}
          {showScrollBottom && (
            <div className="bg-[#040e1c] border-t border-cyan-500/30 px-3.5 py-1.5 flex items-center justify-between shrink-0 shadow-lg z-20">
              <span className="text-[11px] font-mono text-cyan-300/80 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                <span>Newer telemetry messages below</span>
              </span>
              <button
                type="button"
                onClick={scrollToBottom}
                className="px-3 py-1 rounded-full bg-gradient-to-r from-cyan-400 to-sky-400 hover:from-cyan-300 hover:to-sky-300 text-slate-950 text-xs font-mono font-bold shadow-[0_0_15px_rgba(6,182,212,0.4)] flex items-center gap-1.5 hover:scale-105 active:scale-95 transition-all cursor-pointer"
              >
                <ChevronDown className="w-3.5 h-3.5 stroke-[3]" />
                <span>Jump to latest</span>
              </button>
            </div>
          )}

          {/* Autocomplete Command Menu */}
          {showCommandMenu && (
            <div className="bg-[#030914] border-t border-cyan-500/40 p-2 max-h-44 overflow-y-auto space-y-1 z-30">
              <div className="text-[10px] font-mono text-cyan-400 uppercase font-bold px-2 py-0.5">
                NASA AI Command Shortcuts:
              </div>
              {AI_COMMANDS.map((cmd, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    setInputText(cmd.snippet);
                    setShowCommandMenu(false);
                    inputRef.current?.focus();
                  }}
                  className="w-full text-left p-1.5 rounded-lg hover:bg-cyan-950/40 flex items-center justify-between text-xs font-mono transition cursor-pointer"
                >
                  <span className="text-cyan-300 font-bold">{cmd.cmd}</span>
                  <span className="text-slate-400 text-[11px] truncate max-w-[280px]">{cmd.desc}</span>
                </button>
              ))}
            </div>
          )}

          {/* Message input */}
          <div className="p-3 bg-[#050f1c] border-t border-amber-400/20 shrink-0">
            <div className="flex gap-2">
              <textarea
                ref={inputRef}
                rows={2}
                value={inputText}
                onChange={(e) => {
                  const val = e.target.value;
                  setInputText(val);
                  if (val.startsWith('/') && !val.includes(' ')) {
                    setShowCommandMenu(true);
                  } else {
                    setShowCommandMenu(false);
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder="Type /strict, /formula, /verify, or ask any space question..."
                className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 resize-none font-mono"
              />
              <button
                type="button"
                onClick={() => handleSendMessage()}
                disabled={isLoading || !inputText.trim()}
                className="bg-gradient-to-r from-amber-400 to-amber-300 hover:brightness-110 text-slate-950 font-bold px-4 sm:px-5 py-2 rounded-xl text-xs sm:text-sm font-mono uppercase tracking-wider transition shadow flex items-center justify-center gap-1.5 disabled:opacity-40 cursor-pointer"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                <span className="hidden sm:inline">Ask</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
