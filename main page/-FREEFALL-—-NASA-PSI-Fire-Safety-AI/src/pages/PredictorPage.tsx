import React from 'react';
import { PredictionInput, PredictionResult } from '../types';
import { SimulatorPage } from './SimulatorPage';

export interface PredictorPageProps {
  input: PredictionInput;
  onChangeInput: (input: PredictionInput) => void;
  prediction: PredictionResult;
  onOpenDossier?: (studyId: string) => void;
  onAskAIAboutPrediction?: () => void;
  params?: Record<string, string>;
}

/**
 * Backward compatibility wrapper for legacy PredictorPage.
 * Redirects seamlessly to the unified SimulatorPage on the 'prediction' tab.
 */
export const PredictorPage: React.FC<PredictorPageProps> = (props) => {
  return (
    <SimulatorPage
      {...props}
      params={{ ...(props.params || {}), tab: 'prediction' }}
    />
  );
};
