import React from 'react';
import {
  Home,
  BookOpen,
  Cpu,
  Flame,
  Compass,
  FileText,
  Sparkles,
  Users,
  ShieldAlert,
} from 'lucide-react';
import { WelcomePage } from '../pages/WelcomePage';
import { SimulatorPage } from '../pages/SimulatorPage';
import { VaultPage } from '../pages/VaultPage';
import { HardwarePage } from '../pages/HardwarePage';
import { NetworkPage } from '../pages/NetworkPage';
import { ScienceBriefPage } from '../pages/ScienceBriefPage';
import { SentenceSearchPage } from '../pages/SentenceSearchPage';

export interface PageDefinition {
  id: string;
  title: string;
  navLabel: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  author?: string;
  badge?: string;
  description?: string;
  category: 'MAIN' | 'RESEARCH';
  component: React.ComponentType<any>;
  enabled: boolean;
  externalUrl?: string;
}

/**
 * =========================================================================
 * 🚀 UNIFIED IGNIS // FREEFALL PLATFORM REGISTRY
 * =========================================================================
 */
export const PAGES_CONFIG: PageDefinition[] = [
  {
    id: 'welcome',
    title: 'Welcome & Mission Overview',
    navLabel: 'Welcome',
    path: '/welcome',
    icon: Home,
    author: 'IGNIS // FREEFALL',
    badge: '01',
    category: 'MAIN',
    description: 'Mission introduction, microgravity physics fundamentals, Earth limb visualization, and conclusion page.',
    component: WelcomePage,
    enabled: true,
    externalUrl: '/ignis final description page.html',
  },
  {
    id: 'simulator',
    title: 'Flame Simulator',
    navLabel: 'Flame Simulator',
    path: '/simulator',
    icon: Flame,
    author: 'IGNIS // FREEFALL',
    badge: '02',
    category: 'MAIN',
    description: 'Authentic 3D microgravity combustion chamber from NASA Hackathon suite.',
    component: SimulatorPage,
    enabled: true,
    externalUrl: '/Nasa Hackathon/ignis-simulator.html',
  },
  {
    id: 'sentence-search',
    title: 'PSI Sentence Search',
    navLabel: 'PSI Sentence Search',
    path: '/sentence-search',
    icon: Sparkles,
    author: 'IGNIS // FREEFALL',
    badge: '03',
    category: 'MAIN',
    description: 'Sentence-level search engine querying exact experimental observations and flame extinction thresholds across NASA PSI records.',
    component: SentenceSearchPage,
    enabled: true,
    externalUrl: '/ignis-final.html',
  },
  {
    id: 'hardware',
    title: 'Hardware & Earth Applications',
    navLabel: 'Hardware Explorer',
    path: '/hardware',
    icon: Cpu,
    author: 'FREEFALL',
    badge: '04',
    category: 'MAIN',
    description: 'Dynamic NASA spaceflight hardware discovery, multi-image galleries, and Earth technology transfers.',
    component: HardwarePage,
    enabled: true,
  },
  {
    id: 'network',
    title: 'IGNIS Data Network',
    navLabel: 'IGNIS Data Network',
    path: '/network',
    icon: Compass,
    author: 'IGNIS // FREEFALL',
    badge: '05',
    category: 'RESEARCH',
    description: 'Interactive 2D orbital canvas connecting historical NASA combustion experiments (1974 to present) with dataset inspection.',
    component: NetworkPage,
    enabled: true,
    externalUrl: '/ignis.html',
  },
  {
    id: 'science',
    title: 'Combustion Science Brief',
    navLabel: 'Combustion Science Brief',
    path: '/science',
    icon: FileText,
    author: 'IGNIS // FREEFALL',
    badge: '06',
    category: 'RESEARCH',
    description: 'Comprehensive illustrated scientific explanations of buoyancy suppression, spherical diffusion flames, and life safety.',
    component: ScienceBriefPage,
    enabled: true,
  },
  {
    id: 'vault',
    title: 'NASA PSI & NTRS Vault',
    navLabel: 'PSI & NTRS Vault',
    path: '/sentence-search',
    icon: BookOpen,
    author: 'FREEFALL',
    badge: '07',
    category: 'RESEARCH',
    description: 'Archived physical science investigation dossiers, live NTRS technical literature, and sentence intelligence vault.',
    component: SentenceSearchPage,
    enabled: true,
  },
  {
    id: 'about',
    title: 'About IGNIS & Team Infonic',
    navLabel: 'About Us',
    path: '/about',
    icon: Users,
    author: 'Team Infonic',
    badge: '08',
    category: 'RESEARCH',
    description: 'Mission overview, technical approach, and research team behind the IGNIS microgravity fire safety platform.',
    component: WelcomePage,
    enabled: true,
    externalUrl: '/ignis-about.html',
  },
  {
    id: 'blast',
    title: 'Blast & Decompression Simulation',
    navLabel: 'Blast Simulation',
    path: '/blast',
    icon: ShieldAlert,
    author: 'SpaceStation Guardian',
    badge: '09',
    category: 'MAIN',
    description: 'Cinematic station-scale blast, explosive decompression, and digital twin simulation scenarios.',
    component: WelcomePage,
    enabled: true,
    externalUrl: 'http://localhost:5173',
  },
];

export const DEFAULT_PAGE_PATH = '/welcome';

export function getPageByPath(path: string): PageDefinition {
  const normalized = path.startsWith('/') ? path : `/${path}`;

  // Backward compatibility: map legacy /predictor route to /simulator
  if (normalized === '/predictor' || normalized.startsWith('/predictor/')) {
    return PAGES_CONFIG.find((p) => p.id === 'simulator') || PAGES_CONFIG[1];
  }

  // Root path resolution
  if (normalized === '/' || normalized === '') {
    return PAGES_CONFIG.find((p) => p.id === 'welcome') || PAGES_CONFIG[0];
  }

  const found = PAGES_CONFIG.find((p) => p.path === normalized && p.enabled);
  return found || PAGES_CONFIG.find((p) => p.path === DEFAULT_PAGE_PATH) || PAGES_CONFIG[0];
}

export function getPageById(id: string): PageDefinition {
  // Backward compatibility: map legacy 'predictor' ID to 'simulator'
  if (id === 'predictor') {
    return PAGES_CONFIG.find((p) => p.id === 'simulator') || PAGES_CONFIG[1];
  }

  const found = PAGES_CONFIG.find((p) => p.id === id && p.enabled);
  return found || PAGES_CONFIG[0];
}
