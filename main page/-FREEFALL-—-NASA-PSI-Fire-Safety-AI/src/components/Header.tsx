import React, { useState, useEffect } from 'react';
import {
  Flame,
  Activity,
  Sliders,
  Menu,
  X,
  ChevronRight,
  ChevronLeft,
  Sparkles,
} from 'lucide-react';
import { playTelemetryChirp, playCommandChirp } from '../utils/audioTelemetry';
import { PAGES_CONFIG, PageDefinition } from '../config/pages';

interface HeaderProps {
  activePath?: string;
  activeTab?: string;
  onNavigate?: (path: string) => void;
  onSelectTab?: (tab: string) => void;
  onOpenAssistant: () => void;
  onOpenApiKeyModal: () => void;
  hasCustomKey?: boolean;
  isAssistantOpen?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activePath,
  activeTab,
  onNavigate,
  onSelectTab,
  onOpenAssistant,
  onOpenApiKeyModal,
  hasCustomKey,
  isAssistantOpen,
}) => {
  const [utcTime, setUtcTime] = useState<string>('');
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setUtcTime(now.toUTCString().slice(17, 25) + ' UTC');
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Close drawer on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isDrawerOpen) {
        setIsDrawerOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDrawerOpen]);

  const enabledPages = PAGES_CONFIG.filter((p) => p.enabled);

  const isPageActive = (page: PageDefinition) => {
    if (activePath) {
      return activePath === page.path || activePath.startsWith(page.path + '/');
    }
    return activeTab === page.id;
  };

  const currentIndex = enabledPages.findIndex((p) => isPageActive(p));
  const currentPage = currentIndex >= 0 ? enabledPages[currentIndex] : enabledPages[0];

  const handlePageClick = (page: PageDefinition) => {
    if (page.externalUrl) {
      if (page.externalUrl.startsWith('http')) {
        window.open(page.externalUrl, '_blank');
      } else {
        window.location.href = page.externalUrl;
      }
      setIsDrawerOpen(false);
      playTelemetryChirp();
      return;
    }
    if (onNavigate) {
      onNavigate(page.path);
    } else if (onSelectTab) {
      onSelectTab(page.id);
    }
    setIsDrawerOpen(false);
    playTelemetryChirp();
  };

  const handleLogoClick = () => {
    playTelemetryChirp();
    window.location.href = '/ignis final description page.html';
  };

  const handleStepPage = (delta: number) => {
    playTelemetryChirp();
    const nextIndex = (currentIndex + delta + enabledPages.length) % enabledPages.length;
    handlePageClick(enabledPages[nextIndex]);
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-[#09040a]/92 backdrop-blur-3xl border-b border-[#ff2e7e]/30 px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3 flex items-center justify-between gap-4 shadow-[0_10px_40px_rgba(0,0,0,0.95)]">
        {/* Brand & Left Controls */}
        <div className="flex flex-col gap-2 min-w-0">
          <div className="flex items-center gap-3 min-w-0">
            {/* Animated Dual-Ring Mission Beacon (Clickable to Welcome Description Page) */}
            <button
              onClick={handleLogoClick}
              className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-tr from-[#ff2e7e] via-[#ff4d79] to-[#ff7597] flex items-center justify-center text-white font-black shadow-[0_0_25px_rgba(255,46,126,0.6)] shrink-0 cursor-pointer hover:scale-105 transition-transform"
              title="Return to IGNIS Description Page"
            >
              <div className="absolute inset-0 rounded-2xl border border-pink-300/60 animate-ping opacity-25 pointer-events-none" />
              <Flame className="w-5 h-5 text-white fill-white" />
            </button>

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1
                  onClick={handleLogoClick}
                  className="text-sm sm:text-base font-black tracking-wider text-white font-mono flex items-center gap-1.5 shrink-0 cursor-pointer hover:text-[#ff7597] transition-colors"
                >
                  <span>IGNIS // PLATFORM</span>
                </h1>
                <span className="text-[9px] font-mono uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold tracking-wider flex items-center gap-1 shadow-[0_0_10px_rgba(52,211,153,0.3)] shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  One application
                </span>
                <span className="hidden md:inline-flex text-[9px] font-mono uppercase px-2 py-0.5 rounded-full bg-[#ff2e7e]/20 text-[#ff7597] border border-[#ff2e7e]/40 font-bold tracking-wider shrink-0">
                  NASA Space Apps
                </span>
                <a
                  href="http://localhost:5173"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hidden lg:inline-flex items-center gap-1 text-[10px] font-mono text-[#ff7597] bg-[#1d0b19] px-2.5 py-0.5 rounded-full border border-[#ff2e7e]/40 hover:border-[#ff4d88] transition shrink-0"
                >
                  <span className="w-2 h-2 rounded-full bg-[#ff2e7e] animate-pulse" />
                  STATION GUARDIAN
                </a>
                {utcTime && (
                  <span className="hidden xl:inline-flex items-center gap-1 text-[10px] font-mono text-[#ff7597] bg-black/80 px-2 py-0.5 rounded border border-slate-800 shrink-0">
                    <Activity className="w-2.5 h-2.5 text-[#ff2e7e]" />
                    {utcTime}
                  </span>
                )}
              </div>
              <p className="text-[10px] sm:text-[11px] font-mono text-[#c09aac] leading-tight truncate hidden sm:block uppercase tracking-wider mt-0.5">
                Fire Safety Platform · Microgravity Combustion Informatics
              </p>
            </div>
          </div>

          {/* Action Controls: SI Settings & Aether-SI Toggle */}
          <div className="flex items-center gap-2 pt-0.5">
            <button
              onClick={() => {
                onOpenApiKeyModal();
                playCommandChirp();
              }}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-950/90 hover:bg-slate-900 border border-slate-800 hover:border-[#ff2e7e]/50 text-slate-300 hover:text-white text-xs font-mono font-bold transition shadow cursor-pointer shrink-0"
              title="Configure SI security & server cache"
            >
              <Sliders className="w-3 h-3 text-[#ff4d88]" />
              <span className="text-[11px]">Settings</span>
              <span
                className={`w-1.5 h-1.5 rounded-full inline-block ${
                  hasCustomKey ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]' : 'bg-slate-600'
                }`}
              />
            </button>

            {/* Open Aether-SI Toggle */}
            <button
              onClick={() => {
                onOpenAssistant();
                playCommandChirp();
              }}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border font-mono font-bold text-xs transition-all shadow-[0_0_15px_rgba(255,46,126,0.15)] cursor-pointer shrink-0 group ${
                isAssistantOpen
                  ? 'bg-[#2b0c23] border-[#ff2e7e] text-white shadow-[0_0_20px_rgba(255,46,126,0.4)]'
                  : 'bg-[#1d0b19]/90 hover:bg-[#250d1f] border-[#ff2e7e]/40 hover:border-[#ff2e7e] text-[#ff94b8] hover:text-white'
              }`}
              title="Open Aether-SI Copilot (Press Ctrl+K)"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#ff2e7e] group-hover:scale-110 transition-transform animate-pulse" />
              <span className="text-[11px]">Open Aether SI</span>
              <span className="text-[10px] font-mono text-[#ff7597]/90 font-normal hidden xs:inline">
                (Press Ctrl K)
              </span>
            </button>
          </div>
        </div>

        {/* Right Side: Active Module Capsule + Main Navigation Drawer Trigger */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Active Page Capsule with Quick Step Arrows (Prev / Next) */}
          <div className="flex items-center bg-[#1d0b19]/80 border border-[#ff2e7e]/30 rounded-2xl p-1 gap-1 shadow-[0_0_15px_rgba(255,46,126,0.15)]">
            <button
              onClick={() => handleStepPage(-1)}
              className="w-7 h-7 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-[#ff7597] flex items-center justify-center transition cursor-pointer"
              title="Previous Page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <button
              onClick={() => {
                playCommandChirp();
                setIsDrawerOpen(true);
              }}
              className="flex items-center gap-2 px-2.5 py-1 rounded-xl hover:bg-[#ff2e7e]/10 text-xs font-mono font-bold text-slate-200 hover:text-white transition cursor-pointer"
              title="Open Main navigation drawer"
            >
              <span className="text-[#ff4d88] font-bold">{currentPage?.badge || '01'}</span>
              <span className="hidden sm:inline text-white">{currentPage?.navLabel || 'Welcome'}</span>
            </button>

            <button
              onClick={() => handleStepPage(1)}
              className="w-7 h-7 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-[#ff7597] flex items-center justify-center transition cursor-pointer"
              title="Next Page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Prominent Main Navigation Drawer Toggle Button */}
          <button
            onClick={() => {
              playCommandChirp();
              setIsDrawerOpen(true);
            }}
            className="flex items-center gap-2 px-3.5 py-2 rounded-2xl font-mono text-xs font-bold transition-all cursor-pointer shrink-0 bg-gradient-to-r from-[#ff2e7e]/20 via-[#1d0b19] to-[#09040a] hover:border-[#ff4d88] border border-[#ff2e7e]/40 text-[#fdeef3] shadow-[0_0_20px_rgba(255,46,126,0.25)] hover:shadow-[0_0_30px_rgba(255,46,126,0.45)]"
            title="Open Main Navigation Drawer"
          >
            <Menu className="w-4 h-4 text-[#ff4d88]" />
            <span className="hidden md:inline font-bold">MENU</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[#2a0818] text-[#ff7597] border border-[#ff2e7e]/40">
              09
            </span>
          </button>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* UNIFIED NAVIGATION DRAWER MODAL */}
      {/* ========================================================================= */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
          {/* Backdrop Click to Close */}
          <div className="absolute inset-0" onClick={() => setIsDrawerOpen(false)} />

          <div className="relative w-full max-w-xl bg-[#0e040c] border border-[#ff2e7e]/50 rounded-3xl p-6 sm:p-8 shadow-[0_0_60px_rgba(0,0,0,0.95),0_0_40px_rgba(255,46,126,0.25)] flex flex-col z-10 space-y-6">
            {/* Header row */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <h3 className="font-orbitron font-black text-white text-lg tracking-wider">
                  IGNIS // PLATFORM
                </h3>
                <span className="text-[10px] font-mono uppercase px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold tracking-wider flex items-center gap-1.5 shadow-[0_0_10px_rgba(52,211,153,0.3)]">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  One application
                </span>
              </div>

              <button
                onClick={() => setIsDrawerOpen(false)}
                className="w-8 h-8 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center border border-slate-800 transition cursor-pointer"
                title="Close drawer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Subheading */}
            <div>
              <p className="text-sm font-mono text-[#ff4d88] font-bold flex items-center gap-2">
                <span className="text-[#ff4d88]">—</span>
                <span>Main navigation drawer</span>
              </p>
            </div>

            {/* Navigation List */}
            <div className="space-y-2">
              {enabledPages.map((page) => {
                const Icon = page.icon;
                const active = isPageActive(page);

                return (
                  <button
                    key={page.id}
                    onClick={() => handlePageClick(page)}
                    className={`w-full flex items-center justify-between p-3.5 sm:p-4 rounded-xl text-xs sm:text-sm font-mono font-bold transition-all cursor-pointer border ${
                      active
                        ? 'bg-gradient-to-r from-[#ff2e7e]/25 via-[#ff4d79]/20 to-[#ff7597]/10 text-white border-[#ff2e7e] shadow-[0_0_25px_rgba(255,46,126,0.4)]'
                        : 'bg-[#1d0b19]/50 hover:bg-[#2d0f25] text-slate-200 hover:text-white border-slate-800/80 hover:border-[#ff2e7e]/40'
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <span
                        className={`text-xs font-mono font-bold ${
                          active ? 'text-[#ff7597]' : 'text-slate-400'
                        }`}
                      >
                        {page.badge}
                      </span>
                      <Icon
                        className={`w-4 h-4 shrink-0 ${
                          active ? 'text-[#ff7597]' : 'text-slate-400'
                        }`}
                      />
                      <span>{page.navLabel}</span>
                    </div>
                    <ChevronRight
                      className={`w-4 h-4 shrink-0 transition-transform ${
                        active ? 'text-[#ff7597] translate-x-1' : 'text-slate-500'
                      }`}
                    />
                  </button>
                );
              })}
            </div>

            {/* Bottom Footer Note */}
            <div className="pt-2 border-t border-slate-800/80 text-center">
              <p className="text-xs font-mono text-emerald-400 font-bold flex items-center justify-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                Every selection opens an internal page in the same website.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
