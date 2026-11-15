import React from 'react';
import { HardwareExplorerView } from '../components/hardware/HardwareExplorerView';
import { HardwareItem } from '../types/hardware';

export interface HardwarePageProps {
  onAskAIAboutHardware?: (hardware: HardwareItem) => void;
  params?: Record<string, string>;
}

/**
 * Self-Sufficient NASA Hardware Explorer & Earth Applications Webpage Module.
 * Houses the live multi-source hardware discovery engine, multi-image galleries,
 * and 3-tier Earth applications bridge.
 */
export const HardwarePage: React.FC<HardwarePageProps> = ({
  onAskAIAboutHardware,
  params,
}) => {
  return (
    <div className="w-full">
      <HardwareExplorerView onAskAIAboutHardware={onAskAIAboutHardware} />
    </div>
  );
};
export default HardwarePage;
