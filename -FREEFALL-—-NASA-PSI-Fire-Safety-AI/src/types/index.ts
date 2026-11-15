export interface VerifiedPSIRun {
  run_id: string;
  psi_study: string;
  ntrs_id: string;
  material: 'sibal' | 'pmma' | 'nomex' | 'ultem';
  material_name: string;
  gravity_g: number;
  o2_pct: number;
  pressure_kpa: number;
  airflow_cms: number;
  flow_direction: 'concurrent' | 'opposed';
  gas_mix: 'normal' | 'co2' | 'enriched' | 'inert';
  spread_rate_mms: number;
  regime: 'No spread' | 'Marginal spread' | 'Sustained spread';
  notes: string;
}

export interface NTRSCitationRecord {
  recordType: 'NTRS_CITATION';
  id: string; // NASA Accession ID (e.g. "19630008654", "20210011521")
  title: string;
  abstract: string;
  authors: Array<{
    name: string;
    affiliation?: string;
  }>;
  center: {
    code: string;
    name: string;
  };
  distributionDate: string;
  stiType: string;
  reportNumbers: string[];
  doi?: string;
  keywords: string[];
  pdfUrl?: string;
  externalUrl: string; // https://ntrs.nasa.gov/citations/{id}
}

export interface PSIStudy {
  id: string;
  name: string;
  acronym?: string;
  fullTitle?: string;
  aliases?: string[];
  program: string;
  category: 'Prevention' | 'Detection' | 'Suppression' | 'Partial-g' | 'Incident' | 'Spinoff' | 'Combustion Science' | string;
  dossierType?: 'EXPERIMENT' | 'INCIDENT' | 'SPINOFF' | 'PUBLICATION';
  hardware: string;
  dates: string;
  fuelType: string;
  oxygenRange: string;
  flowVelocity: string;
  pressureRange: string;
  keyFinding: string;
  abstract?: string;
  earthSpinOff: string;
  tags: string[];
  externalUrl: string;
  psiPortalUrl?: string;
  videoUrl?: string;
  sourceType?: 'PSI' | 'NTRS' | 'OSDR' | 'PSI_CORE';
  sourceRepositoryName?: string;
  isLiveFetched?: boolean;
  relevanceScore?: number;
  // Bibliographic NTRS Metadata (for verified STI citations)
  authors?: Array<{
    name: string;
    affiliation?: string;
  }>;
  centerName?: string;
  stiType?: string;
  reportNumbers?: string[];
  doi?: string;
  pdfUrl?: string;
  isNtrsCitation?: boolean;
  // Specialized Analysis Fields
  incidentAnalysis?: {
    rootCause: string;
    oxygenFactor: string;
    zeroBuoyancyComplications: string;
    investigationFindings: string;
    safetyRedesigns: string;
  };
  spinoffDetails?: {
    nasaOrigin: string;
    terrestrialApplication: string;
    lifeSafetyBenefit: string;
    commercialAdoption: string;
  };
  detailedAnalysis?: {
    damkohlerImpact?: string;
    extinctionMechanism?: string;
    detectorImplication?: string;
    suppressantAdvice?: string;
  };
  // 8-Section Comprehensive Dossier Fields
  profileSections?: {
    overview?: string;
    flightContext?: {
      platform?: string;
      missionDates?: string;
      gravityEnvironment?: string;
      carrier?: string;
    };
    experimentalApproach?: string;
    hardwareDesign?: string;
    dataResearchMaterial?: string;
    resultsFindings?: string;
    publicationsRelatedResearch?: Array<{
      title: string;
      id?: string;
      authors?: string;
      url?: string;
    }>;
    nasaSources?: Array<{
      title: string;
      url: string;
      type: string;
    }>;
  };
}

export interface PredictionInput {
  gravity: '0g' | 'lunar' | 'mars' | '1g' | string;
  material: 'sibal' | 'pmma' | 'nomex' | 'ultem' | string;
  gasMix: 'normal' | 'co2' | 'enriched' | 'inert' | string;
  oxygenPct: number;
  pressureKpa: number;
  airflowCms: number;
  flowDirection: 'concurrent' | 'opposed' | string;
}

export interface NeighborMatch {
  run: VerifiedPSIRun;
  distance: number;
  similarity: number;
}

export interface PredictionResult {
  regime: 'No spread' | 'Marginal spread' | 'Sustained spread';
  spreadRate: number; // mm/s
  confidence: number; // 0..100 %
  probabilities: {
    noSpread: number;
    marginalSpread: number;
    sustainedSpread: number;
  };
  damkohlerNumber: number;
  pecletNumber: number;
  nearestNeighbors: NeighborMatch[];
  safetyAdvisory: {
    level: 'NOMINAL' | 'WARNING' | 'CRITICAL';
    title: string;
    recommendation: string;
    criticalLimitingO2: number;
    requiredSuppressionCo2Pct: number;
  };
}
