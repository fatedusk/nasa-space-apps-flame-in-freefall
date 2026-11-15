import React, { useState, useEffect } from 'react';
import {
  Key,
  ShieldCheck,
  Check,
  X,
  Lock,
  Server,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  ExternalLink,
  Trash2,
  Sparkles,
} from 'lucide-react';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onKeySaved?: (hasKey: boolean) => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({
  isOpen,
  onClose,
  onKeySaved,
}) => {
  const [apiKeyInput, setApiKeyInput] = useState<string>('');
  const [showKey, setShowKey] = useState<boolean>(false);
  const [isValidating, setIsValidating] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error' | 'info' | 'idle';
    text: string;
  }>({ type: 'idle', text: '' });
  const [activeStoredKey, setActiveStoredKey] = useState<string>('');
  const [hasServerKey, setHasServerKey] = useState<boolean>(false);

  // Load existing key on open & probe current connection status
  useEffect(() => {
    if (!isOpen) return;

    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('gemini_api_key') || '';
      setActiveStoredKey(stored);
      setApiKeyInput(stored);
      if (stored) {
        validateKey(stored, false);
      } else {
        // Probe server environment
        checkServerKey();
      }
    }
  }, [isOpen]);

  // Check if backend has a configured key
  const checkServerKey = async () => {
    try {
      const res = await fetch('/api/gemini/validate-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (data.valid) {
        setHasServerKey(true);
        setStatusMessage({
          type: 'info',
          text: 'Backend environment key is active and ready.',
        });
      } else {
        setHasServerKey(false);
        setStatusMessage({
          type: 'idle',
          text: 'No active Gemini API key detected. Please add your key below.',
        });
      }
    } catch {
      setHasServerKey(false);
    }
  };

  // Live validator calling backend probe endpoint
  const validateKey = async (keyToTest: string, shouldPersist = true) => {
    const trimmed = keyToTest.trim();
    if (!trimmed) {
      setStatusMessage({
        type: 'error',
        text: 'Please enter a Gemini API key before validating.',
      });
      return;
    }

    setIsValidating(true);
    setStatusMessage({
      type: 'info',
      text: 'Validating key with Google Gemini API...',
    });

    try {
      const res = await fetch('/api/gemini/validate-key', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-gemini-key': trimmed,
        },
        body: JSON.stringify({ apiKey: trimmed }),
      });

      const data = await res.json();

      if (data.valid) {
        if (shouldPersist && typeof window !== 'undefined') {
          localStorage.setItem('gemini_api_key', trimmed);
          setActiveStoredKey(trimmed);
          onKeySaved?.(true);
        }
        setStatusMessage({
          type: 'success',
          text: data.message || '✓ Gemini API key successfully verified and active!',
        });
      } else {
        setStatusMessage({
          type: 'error',
          text: data.message || '⚠️ Invalid API key. Please check your key from Google AI Studio.',
        });
      }
    } catch {
      setStatusMessage({
        type: 'error',
        text: 'Network error contacting validation endpoint. Please check your connection.',
      });
    } finally {
      setIsValidating(false);
    }
  };

  const handleSaveAndTest = (e: React.FormEvent) => {
    e.preventDefault();
    validateKey(apiKeyInput, true);
  };

  const handleRemoveKey = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('gemini_api_key');
    }
    setActiveStoredKey('');
    setApiKeyInput('');
    setStatusMessage({
      type: 'info',
      text: 'Custom API key removed from browser storage.',
    });
    onKeySaved?.(false);
    // Re-check server key availability
    checkServerKey();
  };

  if (!isOpen) return null;

  const isKeyActive = Boolean(activeStoredKey || hasServerKey);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-2xl transition-all duration-300 animate-fade-in">
      <div className="bg-[#040b17]/98 border-2 border-cyan-500/50 rounded-2xl max-w-lg w-full p-6 shadow-[0_0_60px_rgba(6,182,212,0.35)] space-y-5 text-slate-100 relative">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-cyan-500/20 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.3)]">
              <Key className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>Aether-SI &amp; API Key Settings</span>
                {isKeyActive ? (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/50 font-bold flex items-center gap-1">
                    <Check className="w-2.5 h-2.5" /> Active
                  </span>
                ) : (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold">
                    Key Required
                  </span>
                )}
              </h3>
              <p className="text-[11px] font-mono text-cyan-300/80">
                Google Gemini API credentials &amp; autonomous scientific intelligence
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Alert Banner */}
        {statusMessage.text && (
          <div
            className={`p-3 rounded-xl border text-xs font-mono flex items-start gap-2.5 ${
              statusMessage.type === 'success'
                ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-200'
                : statusMessage.type === 'error'
                ? 'bg-rose-950/60 border-rose-500/50 text-rose-200'
                : 'bg-cyan-950/40 border-cyan-500/30 text-cyan-200'
            }`}
          >
            {statusMessage.type === 'success' ? (
              <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            ) : statusMessage.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            ) : (
              <Sparkles className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            )}
            <div className="flex-1 leading-relaxed">{statusMessage.text}</div>
          </div>
        )}

        {/* Input Form */}
        <form onSubmit={handleSaveAndTest} className="space-y-4">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-mono">
              <label htmlFor="gemini-key-input" className="text-slate-300 flex items-center gap-1.5 font-bold">
                <Lock className="w-3.5 h-3.5 text-cyan-400" />
                <span>Gemini API Key:</span>
              </label>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 hover:underline"
              >
                <span>Get Free Key (Google AI Studio)</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="relative">
              <input
                id="gemini-key-input"
                type={showKey ? 'text' : 'password'}
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full bg-black/90 border border-cyan-500/40 focus:border-cyan-400 rounded-xl pl-3.5 pr-10 py-2.5 text-xs sm:text-sm text-white font-mono placeholder:text-slate-600 focus:outline-none transition shadow-inner"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-2.5 text-slate-500 hover:text-white transition cursor-pointer"
                title={showKey ? 'Hide key' : 'Show key'}
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[10px] font-mono text-slate-400">
              Keys are stored securely in your browser's private local storage and sent only to official Google GenAI endpoints.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between gap-3 pt-2">
            <div>
              {activeStoredKey && (
                <button
                  type="button"
                  onClick={handleRemoveKey}
                  className="px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/25 border border-rose-500/40 text-rose-300 font-mono text-xs transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remove Key</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 font-mono text-xs border border-slate-700 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isValidating || !apiKeyInput.trim()}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-400 to-sky-400 hover:brightness-110 text-slate-950 font-mono font-bold text-xs uppercase tracking-wider transition shadow-[0_0_20px_rgba(6,182,212,0.35)] flex items-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {isValidating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Test &amp; Save Key</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>

        {/* Security & Offline Guarantee Architecture */}
        <div className="bg-slate-950/80 p-3.5 rounded-xl border border-cyan-500/20 text-xs font-mono space-y-2">
          <div className="flex items-center justify-between text-[11px] text-cyan-300 font-bold">
            <span className="flex items-center gap-1.5">
              <Server className="w-3.5 h-3.5 text-cyan-400" />
              <span>Zero-Crash Offline Guarantee:</span>
            </span>
            <span className="text-[10px] text-slate-400">Autonomous Fallback</span>
          </div>
          <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
            If no key is configured or Google API limits are reached, Aether-SI automatically falls back to the built-in <strong>Local Cognitive Aerospace Reasoning Engine</strong> so all physics formulas, variable breakdowns, and flight safety analysis continue working seamlessly.
          </p>
        </div>
      </div>
    </div>
  );
};
