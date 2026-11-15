import React, { useEffect } from 'react';
import { VaultView } from '../components/VaultView';
import { PSIStudy } from '../types';

export interface VaultPageProps {
  studies: PSIStudy[];
  onMergeStudies: (newRecords: PSIStudy[]) => void;
  externalSearchQuery: string;
  onSearchQueryChange: (q: string) => void;
  onOpenDossier: (studyId: string) => void;
  onLoadIntoPredictor: (study: PSIStudy) => void;
  params?: Record<string, string>;
}

/**
 * Self-Sufficient NASA PSI & NTRS Vault Webpage Module.
 * Houses the physical science dossiers, live NTRS/OSDR research waterfall, and study search.
 * Can be independently enhanced or swapped out by another teammate.
 */
export const VaultPage: React.FC<VaultPageProps> = ({
  studies,
  onMergeStudies,
  externalSearchQuery,
  onSearchQueryChange,
  onOpenDossier,
  onLoadIntoPredictor,
  params,
}) => {
  // If URL contains initial query parameters (e.g. ?q=droplet or ?dossier=FLEX-01), apply them
  useEffect(() => {
    if (!params) return;

    if (params.q || params.search) {
      const q = params.q || params.search;
      if (q && q !== externalSearchQuery) {
        onSearchQueryChange(q);
      }
    }

    if (params.dossier || params.study) {
      const targetId = params.dossier || params.study;
      if (targetId) {
        onOpenDossier(targetId);
      }
    }
  }, [params]);

  return (
    <div className="w-full">
      <VaultView
        studies={studies}
        onMergeStudies={onMergeStudies}
        externalSearchQuery={externalSearchQuery}
        onSearchQueryChange={onSearchQueryChange}
        onOpenDossier={onOpenDossier}
        onLoadIntoPredictor={onLoadIntoPredictor}
      />
    </div>
  );
};
export default VaultPage;
