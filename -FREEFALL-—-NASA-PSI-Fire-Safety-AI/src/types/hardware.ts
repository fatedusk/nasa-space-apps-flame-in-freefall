export type HardwareCategory =
  | 'Scientific Instruments'
  | 'Experimental Apparatus'
  | 'Sensors & Diagnostics'
  | 'Imaging & Optics'
  | 'Robotics & Mechanisms'
  | 'Thermal & Power Systems'
  | 'Environmental Monitoring'
  | 'Spacecraft Platforms';

export type RecordState = 'LIVE_DATA' | 'CACHED_DATA' | 'CURATED_REFERENCE';

export type ImageConfidence =
  | 'EXACT_HARDWARE_IMAGE'
  | 'HARDWARE_DETAIL_IMAGE'
  | 'MISSION_INTEGRATION_IMAGE'
  | 'MISSION_RELATED_IMAGE'
  | 'ILLUSTRATIVE_IMAGE'
  | 'EXTERNAL_RESEARCH_IMAGE'
  | 'UNAVAILABLE';

export type EvidenceClassification =
  | 'VERIFIED'
  | 'CORROBORATED'
  | 'SUBSYSTEM_DOCUMENTATION'
  | 'RESEARCH_APPLICATION'
  | 'POTENTIAL_APPLICATION'
  | 'UNVERIFIED';

export interface FieldEvidence {
  sourceTitle: string;
  sourceUrl: string;
  sourceType: 'NTRS' | 'NASA_DOC' | 'PSI' | 'SPINOFF' | 'PATENT';
  identifier?: string;
  retrievalDate: string;
  supportedField: string;
  excerpt?: string;
}

export interface HardwareImageMetadata {
  nasaId?: string;
  title: string;
  description?: string;
  thumbnailUrl: string;
  largeUrl?: string;
  credit?: string;
  center?: string;
  dateCreated?: string;
  sourceUrl?: string;
  confidence?: ImageConfidence;
}

export interface DocumentedEarthApplication {
  title: string;
  caseId?: string;
  patentId?: string;
  category: string;
  description: string;
  partner?: string;
  sourceUrl?: string;
  isSpinoff: boolean;
}

export interface ResearchEarthApplication {
  field: string;
  title: string;
  description: string;
  directConnection: string;
  targetIndustry: string;
  citationUrl?: string;
  citationId?: string;
}

export interface PotentialEarthApplication {
  field: string;
  title?: string;
  description: string;
  problemAddressed: string;
  adaptationNeeded: string;
}

export interface HardwareItem {
  id: string;
  name: string;
  acronym?: string;
  category: HardwareCategory;
  mission: string;
  experimentName?: string;
  center?: string;
  developer?: string;
  briefFunction: string;
  
  // Provenance & Source Metadata
  recordState: RecordState;
  lastUpdated?: string;
  provenance?: FieldEvidence[];

  // Image metadata
  image?: HardwareImageMetadata;
  images?: HardwareImageMetadata[];

  // Key Specifications (05 - Technical Specifications)
  specs: {
    dimensions?: string;
    mass?: string;
    power?: string;
    operatingTemp?: string;
    pressure?: string;
    environment?: string;
    measurementRange?: string;
    accuracy?: string;
    primaryOutputs?: string;
    dataInterfaces?: string;
  };

  // 01 - Hardware Identity
  identity?: {
    officialName: string;
    hardwareId?: string;
    manufacturer?: string;
    flightQualification?: string;
    relevantSourceLinks?: Array<{ title: string; url: string }>;
  };

  // 02 - What Is It?
  whatIsIt: {
    purpose: string;
    whyDeveloped?: string;
    mainComponents: string[];
    problemSolved: string;
    scientificPrinciple: string;
    engineeringDesign?: string;
  };

  // 03 - Mission Role & Operational Use
  missionUsage: {
    role: string;
    location: string;
    measurements: string;
    scientificContribution: string;
    dataGenerated?: string;
    operationalResults?: string;
  };

  // 04 - How The Hardware Works
  howItWorks: {
    operatingPrinciple: string;
    mechanism: string;
    materials?: string;
    sensorsDiagnostics?: string;
    electronicsAvionics?: string;
    operatingConditions?: string;
    technicalLimitations?: string;
  };

  // 06 - Experimental / Mission Contribution
  experimentalContribution?: {
    researchObjectives: string;
    dataAcquired: string;
    scientificBreakthrough: string;
    engineeringContribution: string;
  };

  // Dedicated Earth Applications Section
  earthApplications: {
    underlyingCapability: string;
    howItWorksOnEarth: string;
    documentedTransfers: DocumentedEarthApplication[];
    researchApplications?: ResearchEarthApplication[];
    potentialApplications: PotentialEarthApplication[];
    targetIndustries: string[];
    evidenceStatus: EvidenceClassification;
  };

  // 07 - Technical Documentation & Provenance Citations
  technicalDocumentation: Array<{
    title: string;
    url: string;
    type: 'PSI' | 'NTRS' | 'PATENT' | 'NASA_DOC' | 'WIKIMEDIA' | 'SPINOFF';
    id?: string;
    excerpt?: string;
    classification?: EvidenceClassification;
  }>;
}
