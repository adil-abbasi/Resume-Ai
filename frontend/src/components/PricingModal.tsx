import React, { useState } from 'react';
import {
  X,
  Check,
  Zap,
  Sparkles,
  ShieldCheck,
  CreditCard,
  Crown,
  Lock,
  ArrowRight,
  RefreshCw,
  Award,
  Globe,
  FileText,
  FileCheck2,
  Layers,
  Infinity as InfinityIcon
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const PricingModal: React.FC = () => {
  const {
    isPricingModalOpen,
    setIsPricingModalOpen,
    user,
    isPro,
    isProMax,
    upgradePlan,
    cancelSubscription
  } = useAuth();

  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('yearly');
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState<string | null>(null);

  if (!isPricingModalOpen) return null;

  const currentPlan = user?.plan || 'free';

  const handleUpgrade = async (targetPlan: 'pro' | 'pro_max') => {
    setIsProcessing(targetPlan);
    const res = await upgradePlan(targetPlan, billingCycle);
    setIsProcessing(null);
    if (res.success) {
      setPaymentSuccess(targetPlan === 'pro_max' ? 'Pro Max / Career' : 'Pro');
      setTimeout(() => {
        setPaymentSuccess(null);
        setIsPricingModalOpen(false);
      }, 1800);
    }
  };

  const handleCancelSub = async () => {
    if (confirm('Are you sure you want to cancel your active subscription? You will retain access until the end of your billing cycle.')) {
      setIsProcessing('cancel');
      await cancelSubscription();
      setIsProcessing(null);
      setIsPricingModalOpen(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-6xl glass-panel bg-[#0B0F19]/95 border border-gray-700/80 rounded-3xl p-5 sm:p-8 shadow-2xl overflow-y-auto max-h-[92vh]">
        
        {/* Glow accents */}
        <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full bg-amber-500/15 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-64 h-64 rounded-full bg-purple-500/15 blur-3xl pointer-events-none" />

        {/* Close button */}
        <button
          onClick={() => setIsPricingModalOpen(false)}
          className="absolute top-5 right-5 p-2 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800 transition-all z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title Header */}
        <div className="text-center space-y-2 mb-8">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-gradient-to-r from-amber-500/15 to-purple-500/15 border border-amber-500/30 text-amber-300 text-xs font-bold">
            <Crown className="w-3.5 h-3.5 text-amber-400" />
            <span>CHOOSE YOUR CAREER ACCELERATION PLAN</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-display font-bold text-white">
            Simple, Transparent Plans for Every Stage of Your Career
          </h2>
          <p className="text-xs sm:text-sm text-gray-400 max-w-xl mx-auto">
            From ATS resume diagnostics to executive templates and one-click live web portfolio deployment.
          </p>

          {/* Monthly / Yearly Toggle */}
          <div className="pt-3 flex items-center justify-center gap-3">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-4 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                billingCycle === 'monthly'
                  ? 'bg-gray-800 text-white border border-gray-700'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Monthly Billing
            </button>

            <button
              onClick={() => setBillingCycle('yearly')}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                billingCycle === 'yearly'
                  ? 'bg-gradient-to-r from-brand-600 to-indigo-600 text-white shadow-md shadow-brand-500/20'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <span>Annual Billing</span>
              <span className="px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30">
                Save 35%
              </span>
            </button>
          </div>
        </div>

        {/* Success Banner */}
        {paymentSuccess && (
          <div className="mb-6 p-4 rounded-2xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-200 text-sm flex items-center justify-center gap-2 animate-bounce">
            <Sparkles className="w-5 h-5 text-emerald-400" />
            <span className="font-bold">🎉 Welcome to {paymentSuccess}! All features and capabilities are now unlocked.</span>
          </div>
        )}

        {/* 3-Tier Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-stretch">
          
          {/* TIER 1: FREE STARTER */}
          <div className={`p-5 sm:p-6 rounded-2xl border flex flex-col justify-between transition-all ${
            currentPlan === 'free'
              ? 'bg-gray-900/90 border-gray-700 shadow-lg'
              : 'bg-gray-900/40 border-gray-800 opacity-80'
          }`}>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-white">Free Starter</h3>
                  <p className="text-xs text-gray-400">Essential tools to build & analyze your resume</p>
                </div>
                {currentPlan === 'free' && (
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-gray-800 text-gray-300 border border-gray-700">
                    Current
                  </span>
                )}
              </div>

              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-display font-bold text-white">$0</span>
                <span className="text-xs text-gray-400">/ forever free</span>
              </div>

              <div className="border-t border-gray-800 pt-4 space-y-2.5 text-xs">
                <div className="flex items-start gap-2 text-gray-300">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Basic AI resume analysis & ATS score</span>
                </div>
                <div className="flex items-start gap-2 text-gray-300">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Selection of Free ATS-compliant templates</span>
                </div>
                <div className="flex items-start gap-2 text-gray-300">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Live dynamic resume preview & editor</span>
                </div>
                <div className="flex items-start gap-2 text-gray-300">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Basic AI writing assistance (5 rewrites)</span>
                </div>
                <div className="flex items-start gap-2 text-gray-400">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Limited job matching (Top 3 searches)</span>
                </div>
                <div className="flex items-start gap-2 text-gray-300">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Standard PDF/DOCX Export</span>
                </div>
                <div className="flex items-start gap-2 text-gray-500 line-through">
                  <Lock className="w-3.5 h-3.5 text-gray-600 shrink-0 mt-0.5" />
                  <span>One-click portfolio generation</span>
                </div>
              </div>
            </div>

            <div className="pt-6">
              {currentPlan === 'free' ? (
                <button
                  disabled
                  className="w-full py-2.5 rounded-xl bg-gray-800 text-gray-400 text-xs font-bold cursor-default"
                >
                  Active Free Plan
                </button>
              ) : (
                <button
                  onClick={handleCancelSub}
                  disabled={Boolean(isProcessing)}
                  className="w-full py-2.5 rounded-xl border border-gray-800 hover:border-red-500/40 text-gray-400 hover:text-red-400 text-xs font-semibold transition-all"
                >
                  Downgrade to Free
                </button>
              )}
            </div>
          </div>

          {/* TIER 2: PRO ACCELERATOR */}
          <div className={`p-5 sm:p-6 rounded-2xl border relative flex flex-col justify-between transition-all ${
            currentPlan === 'pro'
              ? 'bg-gradient-to-b from-brand-950/40 to-gray-900 border-brand-500 shadow-xl shadow-brand-500/20'
              : 'bg-gradient-to-b from-blue-950/20 via-gray-900/90 to-brand-950/20 border-brand-500/50 shadow-xl shadow-brand-500/10'
          }`}>
            
            {/* Pro badge */}
            <div className="absolute -top-3 right-6 px-3 py-0.5 rounded-full bg-gradient-to-r from-brand-500 to-indigo-500 text-white text-[10px] font-bold uppercase tracking-wider shadow-md">
              Popular • Pro
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-1.5">
                    <span>Pro Plan</span>
                    <Zap className="w-4 h-4 text-brand-400 fill-brand-400" />
                  </h3>
                  <p className="text-xs text-gray-400">All templates, cover letters & unlimited AI</p>
                </div>
                {currentPlan === 'pro' && (
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-brand-500/20 text-brand-300 border border-brand-500/30">
                    Current
                  </span>
                )}
              </div>

              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl font-display font-bold text-white">
                  ${billingCycle === 'yearly' ? '8' : '12'}
                </span>
                <span className="text-xs text-gray-400">
                  / mo {billingCycle === 'yearly' ? '($96/yr)' : 'monthly'}
                </span>
              </div>

              <div className="border-t border-gray-800/80 pt-4 space-y-2.5 text-xs">
                <div className="flex items-start gap-2 text-white font-medium">
                  <Check className="w-4 h-4 text-brand-400 shrink-0 mt-0.5" />
                  <span><strong>Full Template Library Access</strong></span>
                </div>
                <div className="flex items-start gap-2 text-white font-medium">
                  <Check className="w-4 h-4 text-brand-400 shrink-0 mt-0.5" />
                  <span><strong>Ad-free experience</strong> across all tools</span>
                </div>
                <div className="flex items-start gap-2 text-white">
                  <Check className="w-4 h-4 text-brand-400 shrink-0 mt-0.5" />
                  <span><strong>Auto-apply</strong> recommended templates & fixes</span>
                </div>
                <div className="flex items-start gap-2 text-white">
                  <Check className="w-4 h-4 text-brand-400 shrink-0 mt-0.5" />
                  <span><strong>AI Cover Letter Generation</strong> with keyword alignment</span>
                </div>
                <div className="flex items-start gap-2 text-white">
                  <Check className="w-4 h-4 text-brand-400 shrink-0 mt-0.5" />
                  <span><strong>Unlimited</strong> AI writing & STAR bullet polisher</span>
                </div>
                <div className="flex items-start gap-2 text-white">
                  <Check className="w-4 h-4 text-brand-400 shrink-0 mt-0.5" />
                  <span><strong>Job matching</strong> & gap analysis</span>
                </div>
                <div className="flex items-start gap-2 text-white">
                  <Check className="w-4 h-4 text-brand-400 shrink-0 mt-0.5" />
                  <span><strong>Instant 1-Click PDF & DOCX Downloads</strong></span>
                </div>
                <div className="flex items-start gap-2 text-gray-500 line-through">
                  <Lock className="w-3.5 h-3.5 text-gray-600 shrink-0 mt-0.5" />
                  <span>One-click web portfolio deployment</span>
                </div>
              </div>
            </div>

            <div className="pt-6">
              {currentPlan === 'pro' ? (
                <div className="p-3 rounded-xl bg-brand-500/10 border border-brand-500/30 text-brand-300 text-xs font-bold text-center flex items-center justify-center gap-2">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Pro Plan Active</span>
                </div>
              ) : (
                <button
                  onClick={() => handleUpgrade('pro')}
                  disabled={Boolean(isProcessing)}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-bold text-xs transition-all shadow-xl shadow-brand-500/20 flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                >
                  {isProcessing === 'pro' ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Zap className="w-4 h-4 text-white fill-white" />
                      <span>{currentPlan === 'pro_max' ? 'Switch to Pro' : 'Upgrade to Pro'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* TIER 3: PRO MAX / CAREER (EXCLUSIVE PORTFOLIO) */}
          <div className={`p-5 sm:p-6 rounded-2xl border relative flex flex-col justify-between transition-all ${
            currentPlan === 'pro_max'
              ? 'bg-gradient-to-b from-purple-950/40 via-gray-900 to-amber-950/20 border-purple-500 shadow-2xl shadow-purple-500/30'
              : 'bg-gradient-to-b from-purple-950/25 via-gray-900/95 to-amber-950/25 border-purple-500/60 shadow-2xl shadow-purple-500/20'
          }`}>
            
            {/* Pro Max exclusive badge */}
            <div className="absolute -top-3 right-6 px-3.5 py-0.5 rounded-full bg-gradient-to-r from-purple-500 via-indigo-500 to-brand-500 text-white text-[10px] font-bold uppercase tracking-wider shadow-md">
              Pro Max
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-1.5">
                    <span>Executive Tier</span>
                    <Crown className="w-4 h-4 text-amber-400 fill-amber-400" />
                  </h3>
                  <p className="text-xs text-purple-300">Live Web Portfolio, Executive AI & Deep Search</p>
                </div>
                {currentPlan === 'pro_max' && (
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    Active
                  </span>
                )}
              </div>

              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl font-display font-bold text-white">
                  ${billingCycle === 'yearly' ? '19' : '29'}
                </span>
                <span className="text-xs text-gray-400">
                  / mo {billingCycle === 'yearly' ? '($228/yr)' : 'monthly'}
                </span>
              </div>

              <div className="border-t border-gray-800/80 pt-4 space-y-2.5 text-xs">
                <div className="p-2.5 rounded-xl bg-purple-900/30 border border-purple-500/40 text-purple-200 font-semibold space-y-1">
                  <div className="flex items-center gap-1.5 text-amber-300">
                    <Globe className="w-4 h-4 text-amber-400" />
                    <span>One-Click Portfolio Generator</span>
                  </div>
                  <p className="text-[11px] text-gray-300 font-normal">
                    Deploy your personal portfolio website with custom domain and edge hosting in seconds.
                  </p>
                </div>

                <div className="flex items-start gap-2 text-white font-medium">
                  <Check className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                  <span><strong>Everything included in Pro</strong></span>
                </div>
                <div className="flex items-start gap-2 text-white">
                  <Check className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                  <span><strong>Advanced job search & deep matching</strong></span>
                </div>
                <div className="flex items-start gap-2 text-white">
                  <Check className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                  <span><strong>Advanced cover letter generator</strong> with custom tones</span>
                </div>
                <div className="flex items-start gap-2 text-white">
                  <Check className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                  <span><strong>AI Career Copilot</strong> & interview coaching</span>
                </div>
                <div className="flex items-start gap-2 text-white">
                  <Check className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                  <span><strong>Priority cloud AI processing</strong></span>
                </div>
              </div>
            </div>

            <div className="pt-6">
              {currentPlan === 'pro_max' ? (
                <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-bold text-center flex items-center justify-center gap-2">
                  <Crown className="w-4 h-4 text-amber-400" />
                  <span>Pro Max Plan Active</span>
                </div>
              ) : (
                <button
                  onClick={() => handleUpgrade('pro_max')}
                  disabled={Boolean(isProcessing)}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 via-pink-600 to-amber-500 hover:from-purple-500 hover:to-amber-400 text-white font-bold text-xs transition-all shadow-xl shadow-purple-500/25 flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                >
                  {isProcessing === 'pro_max' ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Crown className="w-4 h-4 text-amber-200 fill-amber-200" />
                      <span>Upgrade to Pro Max</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

        </div>

        {/* Security / Guarantee Footer */}
        <div className="mt-8 pt-4 border-t border-gray-800/80 flex flex-wrap items-center justify-between text-[11px] text-gray-400 gap-2">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-brand-400" />
            <span>256-bit encrypted secure checkout</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Lock className="w-4 h-4 text-emerald-400" />
            <span>Cancel or change tiers anytime with 1 click</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CreditCard className="w-4 h-4 text-indigo-400" />
            <span>Accepts Visa, Mastercard, AMEX & PayPal</span>
          </div>
        </div>

      </div>
    </div>
  );
};
