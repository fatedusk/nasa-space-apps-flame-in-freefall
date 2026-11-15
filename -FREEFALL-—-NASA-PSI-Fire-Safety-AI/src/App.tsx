import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { StarfieldBackground } from './components/StarfieldBackground';
import { PredictorView } from './components/PredictorView';
import { VaultView } from './components/VaultView';
import { DossierModal } from './components/DossierModal';
import { ApiKeyModal } from './components/ApiKeyModal';
import { SafetyAIAssistant } from './components/SafetyAIAssistant';
import { HardwareExplorerView } from './components/hardware/HardwareExplorerView';
import { PSI_STUDIES } from './data/psiStudies';
import { PSIStudy, PredictionInput } from './types';
import { HardwareItem } from './types/hardware';
import { calculateFlammabilityPrediction } from './utils/predictorEngine';

export default function App() {
  const [activeTab, setActiveTab] = useState<'predictor' | 'vault' | 'hardware'>('predictor');
  const [studies, setStudies] = useState<PSIStudy[]>(PSI_STUDIES);
  const [activeDossierId, setActiveDossierId] = useState<string | null>(null);
  const [vaultSearchQuery, setVaultSearchQuery] = useState<string>('');
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState<boolean>(false);
  const [hasCustomKey, setHasCustomKey] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('gemini_api_key');
      setHasCustomKey(Boolean(stored && stored.trim()));
    }
  }, []);

  const [input, setInput] = useState<PredictionInput>({
    gravity: '0g',
    material: 'sibal',
    gasMix: 'normal',
    oxygenPct: 21.0,
    pressureKpa: 101.3,
    airflowCms: 20.0,
    flowDirection: 'concurrent',
  });

  const [isAssistantOpen, setIsAssistantOpen] = useState<boolean>(false);
  const [pendingPrompt, setPendingPrompt] = useState<string | null>(null);

  // Global Flight Deck Keyboard Controls (Escape to close, Ctrl/Cmd+K to toggle Aether-SI)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (activeDossierId) {
          setActiveDossierId(null);
        } else if (isAssistantOpen) {
          setIsAssistantOpen(false);
        } else if (isApiKeyModalOpen) {
          setIsApiKeyModalOpen(false);
        }
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsAssistantOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeDossierId, isAssistantOpen, isApiKeyModalOpen]);

  const prediction = calculateFlammabilityPrediction(input);

  // Dynamic lookup of active dossier study from the global dynamic studies state
  const activeDossierStudy = activeDossierId
    ? studies.find(
        (s) =>
          s.id.toLowerCase() === activeDossierId.toLowerCase() ||
          s.id.replace(/[^A-Za-z0-9]/g, '').toLowerCase() ===
            activeDossierId.replace(/[^A-Za-z0-9]/g, '').toLowerCase()
      ) || null
    : null;

  // Merge new records pulled by live NASA NTRS/OSDR waterfall or Action Agent
  const handleMergeStudies = (newRecords: PSIStudy[]) => {
    setStudies((prev) => {
      const existingIds = new Set(prev.map((s) => s.id.toUpperCase()));
      const uniqueNew = newRecords.filter((r) => !existingIds.has(r.id.toUpperCase()));
      return [...uniqueNew, ...prev];
    });
  };

  // One-click parameter loading from a NASA Study into the ML Predictor
  const handleLoadIntoPredictor = (study: PSIStudy) => {
    const updated: PredictionInput = { ...input };

    // Material matching
    const fuelLower = study.fuelType.toLowerCase();
    if (fuelLower.includes('pmma') || fuelLower.includes('acrylic')) updated.material = 'pmma';
    else if (fuelLower.includes('nomex')) updated.material = 'nomex';
    else if (fuelLower.includes('ultem')) updated.material = 'ultem';
    else updated.material = 'sibal';

    // Parse oxygen percentage
    const o2Match = study.oxygenRange.match(/([0-9]+(?:\.[0-9]+)?)\s*%/);
    if (o2Match) updated.oxygenPct = parseFloat(o2Match[1]);

    // Parse airflow velocity
    const flowMatch = study.flowVelocity.match(/([0-9]+(?:\.[0-9]+)?)\s*cm\/s/);
    if (flowMatch) updated.airflowCms = parseFloat(flowMatch[1]);

    // Gravity
    if (study.category === 'Partial-g' || study.name.toLowerCase().includes('lunar')) {
      updated.gravity = 'lunar';
    } else {
      updated.gravity = '0g';
    }

    setInput(updated);
    setActiveTab('predictor');
  };

  const handleAskAIAboutStudy = (study: PSIStudy) => {
    setPendingPrompt(
      `Please provide an astronaut-level physical science explanation from Aether-SI on ${study.name} (${study.id}), its microgravity combustion kinetics, and how it impacts crew safety in spaceflight.`
    );
    setIsAssistantOpen(true);
  };

  const handleAskAIAboutPrediction = () => {
    setPendingPrompt(
      `I have configured ${input.material.toUpperCase()} at ${input.oxygenPct}% O2, ${input.airflowCms} cm/s forced draft in ${input.gravity.toUpperCase()} gravity. The ensemble ML model predicts ${prediction.regime} at ${prediction.spreadRate} mm/s with Damkohler number ${prediction.damkohlerNumber}. Aether-SI, what are the flight safety risks and what would you recommend the crew do?`
    );
    setIsAssistantOpen(true);
  };

  const handleAskAIAboutHardware = (hardware: HardwareItem) => {
    const primarySpinoff = hardware.earthApplications.documentedTransfers[0];
    const spinoffContext = primarySpinoff
      ? ` Its documented commercial NASA spinoff is "${primarySpinoff.title}" (${primarySpinoff.category}).`
      : '';
    setPendingPrompt(
      `Please provide an astronaut-level engineering and physical science explanation from Aether-SI on the ${hardware.name} (${hardware.id}). How does this microgravity hardware operate, what are its key scientific subsystems, and how can its underlying technology be transferred to benefit life on Earth?${spinoffContext}`
    );
    setIsAssistantOpen(true);
  };

  return (
    <div className="min-h-screen bg-black text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-slate-950 relative overflow-x-hidden">
      {/* Live OLED Twinkling Cosmic Starfield Layer */}
      <StarfieldBackground />

      <Header
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onOpenAssistant={() => setIsAssistantOpen(true)}
        onOpenApiKeyModal={() => setIsApiKeyModalOpen(true)}
        hasCustomKey={hasCustomKey}
      />

      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 pb-28">
        {activeTab === 'predictor' ? (
          <PredictorView
            input={input}
            onChangeInput={setInput}
            prediction={prediction}
            onOpenDossier={(studyId) => setActiveDossierId(studyId)}
            onAskAIAboutPrediction={handleAskAIAboutPrediction}
          />
        ) : activeTab === 'vault' ? (
          <VaultView
            studies={studies}
            onMergeStudies={handleMergeStudies}
            externalSearchQuery={vaultSearchQuery}
            onSearchQueryChange={(q) => setVaultSearchQuery(q)}
            onOpenDossier={(studyId) => setActiveDossierId(studyId)}
            onLoadIntoPredictor={handleLoadIntoPredictor}
          />
        ) : (
          <HardwareExplorerView onAskAIAboutHardware={handleAskAIAboutHardware} />
        )}
      </main>

      {/* Dynamic Data Dossier Modal */}
      <DossierModal
        study={activeDossierStudy}
        highlightQuery={vaultSearchQuery}
        onClose={() => setActiveDossierId(null)}
        onLoadIntoPredictor={handleLoadIntoPredictor}
        onAskAIAboutStudy={handleAskAIAboutStudy}
      />

      {/* Gemini API Key Configuration Modal */}
      <ApiKeyModal
        isOpen={isApiKeyModalOpen}
        onClose={() => setIsApiKeyModalOpen(false)}
        onKeySaved={(hasKey) => setHasCustomKey(hasKey)}
      />

      {/* Aether-SI — NASA Flight & Scientific Intelligence Companion */}
      <SafetyAIAssistant
        currentInput={input}
        prediction={prediction}
        isOpen={isAssistantOpen}
        onToggleOpen={setIsAssistantOpen}
        pendingPrompt={pendingPrompt}
        onClearPendingPrompt={() => setPendingPrompt(null)}
        studies={studies}
        onOpenDossier={(studyId) => setActiveDossierId(studyId)}
        onMergeStudies={handleMergeStudies}
        onOpenApiKeyModal={() => setIsApiKeyModalOpen(true)}
        isDossierOpen={Boolean(activeDossierId)}
      />
    </div>
  );
}
