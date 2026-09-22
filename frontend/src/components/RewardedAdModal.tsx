import React, { useState, useEffect } from 'react';
import {
  X,
  Play,
  Sparkles,
  CheckCircle2,
  Zap,
  Volume2,
  VolumeX,
  ExternalLink,
  ShieldCheck,
  Download,
  RefreshCw,
  Crown
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/api';

export const RewardedAdModal: React.FC = () => {
  const {
    isRewardedAdModalOpen,
    setIsRewardedAdModalOpen,
    completeRewardedAd,
    openPricingModal
  } = useAuth();

  const [adState, setAdState] = useState<'prompt' | 'playing' | 'completed'>('prompt');
  const [countdown, setCountdown] = useState(5);
  const [isMuted, setIsMuted] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    let timer: any;
    if (adState === 'playing' && countdown > 0) {
      timer = setInterval(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
    } else if (adState === 'playing' && countdown === 0) {
      // Ad finished -> verify with backend
      handleAdCompleted();
    }
    return () => clearInterval(timer);
  }, [adState, countdown]);

  if (!isRewardedAdModalOpen) return null;

  const handleStartAd = () => {
    setAdState('playing');
    setCountdown(5);
  };

  const handleAdCompleted = async () => {
    setIsVerifying(true);
    try {
      await apiService.verifyAdReward('ad_sponsor_career_accelerator', 'reward_token_valid', 5);
      setAdState('completed');
      // Automatically trigger the download callback
      setTimeout(() => {
        completeRewardedAd();
        // Reset state for next time
        setAdState('prompt');
        setCountdown(5);
        setIsVerifying(false);
      }, 1200);
    } catch {
      // Fallback completion
      setAdState('completed');
      setTimeout(() => {
        completeRewardedAd();
        setAdState('prompt');
        setCountdown(5);
        setIsVerifying(false);
      }, 1200);
    }
  };

  const handleClose = () => {
    setIsRewardedAdModalOpen(false);
    setAdState('prompt');
    setCountdown(5);
    setIsVerifying(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg glass-panel bg-[#0B0F19]/95 border border-gray-700/80 rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden">
        
        {/* Glow */}
        <div className="absolute -top-24 -right-24 w-48 h-48 rounded-full bg-brand-500/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 rounded-full bg-indigo-500/20 blur-3xl pointer-events-none" />

        {/* Close Button (disabled while ad is actively playing) */}
        {adState !== 'playing' && (
          <button
            onClick={handleClose}
            className="absolute top-5 right-5 p-2 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* ---------------- STATE 1: INITIAL PROMPT ---------------- */}
        {adState === 'prompt' && (
          <div className="space-y-6 text-center">
            
            <div className="w-16 h-16 mx-auto rounded-3xl bg-gradient-to-tr from-brand-600 to-indigo-600 flex items-center justify-center shadow-xl shadow-brand-500/30">
              <Download className="w-8 h-8 text-white" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-display font-bold text-white">
                Your Resume is Ready
              </h2>
              <p className="text-xs sm:text-sm text-gray-300 max-w-sm mx-auto">
                Watch a brief 5-second sponsor spotlight to unlock your ATS-optimized PDF download.
              </p>
            </div>

            {/* Main Action Button */}
            <div className="space-y-3 pt-2">
              <button
                onClick={handleStartAd}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-brand-600 via-indigo-600 to-purple-600 hover:from-brand-500 hover:to-indigo-500 text-white font-bold text-sm shadow-xl shadow-brand-500/30 flex items-center justify-center gap-2.5 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>Continue to Download</span>
              </button>

              <div className="flex items-center justify-center gap-1.5 text-xs text-gray-400">
                <span>Want instant downloads without sponsor messages?</span>
                <button
                  onClick={() => {
                    handleClose();
                    openPricingModal();
                  }}
                  className="text-amber-400 font-semibold hover:underline flex items-center gap-1"
                >
                  <Crown className="w-3.5 h-3.5" />
                  <span>Upgrade to Pro</span>
                </button>
              </div>
            </div>

            <div className="pt-2 border-t border-gray-800 flex items-center justify-center gap-2 text-[11px] text-gray-400">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Includes complete ATS-compliant styling and formatting</span>
            </div>

          </div>
        )}

        {/* ---------------- STATE 2: PLAYING REWARDED AD ---------------- */}
        {adState === 'playing' && (
          <div className="space-y-5">
            
            {/* Top status bar */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold uppercase tracking-wider">
                  Sponsored Partner
                </span>
                <span className="text-xs text-gray-400 font-medium">Reward in progress</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsMuted(!isMuted)}
                  className="p-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300"
                >
                  {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                </button>
                <span className="px-2.5 py-1 rounded-xl bg-gray-800 font-mono text-xs font-bold text-white border border-gray-700">
                  {countdown}s remaining
                </span>
              </div>
            </div>

            {/* Interactive Sponsor Player Screen */}
            <div className="relative aspect-video rounded-2xl bg-gradient-to-br from-indigo-950 via-slate-900 to-purple-950 border border-indigo-500/30 overflow-hidden flex flex-col justify-between p-6 shadow-2xl">
              
              {/* Background abstract visual */}
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(120,119,198,0.3),rgba(255,255,255,0))]" />
              
              <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-500 to-emerald-400 flex items-center justify-center font-bold text-white text-xs">
                    CT
                  </div>
                  <div>
                    <div className="font-bold text-white text-xs">CloudTech Engineering</div>
                    <div className="text-[10px] text-gray-300">Global Tech Talent Accelerator</div>
                  </div>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Verified Sponsor
                </span>
              </div>

              <div className="relative space-y-1.5 text-center my-auto">
                <h3 className="text-base sm:text-lg font-display font-bold text-white">
                  "Hiring Top Software Engineers & Cloud Architects Worldwide"
                </h3>
                <p className="text-xs text-indigo-200">
                  Competitive compensation • 100% Remote • Full benefits package
                </p>
              </div>

              <div className="relative flex items-center justify-between pt-2 border-t border-indigo-500/20">
                <span className="text-[10px] text-gray-300">cloudtech.careers</span>
                <span className="text-[10px] text-indigo-300 font-semibold flex items-center gap-1">
                  Learn more <ExternalLink className="w-3 h-3" />
                </span>
              </div>

            </div>

            {/* Countdown Progress Bar */}
            <div className="space-y-1.5">
              <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-brand-500 to-emerald-400 rounded-full transition-all duration-1000"
                  style={{ width: `${((5 - countdown) / 5) * 100}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] text-gray-400">
                <span>Please complete the short ad to unlock your file</span>
                <span>{Math.round(((5 - countdown) / 5) * 100)}%</span>
              </div>
            </div>

          </div>
        )}

        {/* ---------------- STATE 3: COMPLETED & AUTO-DOWNLOADING ---------------- */}
        {adState === 'completed' && (
          <div className="py-6 text-center space-y-4 animate-scaleUp">
            <div className="w-16 h-16 mx-auto rounded-3xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 animate-pulse" />
            </div>

            <div className="space-y-1">
              <h3 className="text-xl font-display font-bold text-white">
                Ad Completed!
              </h3>
              <p className="text-xs text-emerald-300 font-medium">
                Generating your clean PDF and starting your automatic download now...
              </p>
            </div>

            <div className="flex items-center justify-center gap-2 text-xs text-gray-400 pt-2">
              <RefreshCw className="w-4 h-4 animate-spin text-brand-400" />
              <span>Finalizing download...</span>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
