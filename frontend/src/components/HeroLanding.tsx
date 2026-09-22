import React from 'react';
import { 
  Sparkles, 
  FileSearch, 
  Bot, 
  Target, 
  Palette, 
  ShieldCheck, 
  CheckCircle2, 
  ArrowRight
} from 'lucide-react';
import { ResumeProfile } from '../types';
import { sampleSWEProfile, sampleGradProfile } from '../services/api';

interface HeroLandingProps {
  onNavigate: (tab: 'dashboard' | 'analyzer' | 'builder' | 'matcher' | 'studio') => void;
  onSelectResume: (profile: ResumeProfile) => void;
}

export const HeroLanding: React.FC<HeroLandingProps> = ({ onNavigate, onSelectResume }) => {
  return (
    <div className="relative overflow-hidden py-16 px-4 sm:px-6 lg:px-8">
      {/* Background ambient light */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[650px] h-[300px] bg-gradient-to-tr from-brand-600/10 via-indigo-600/10 to-transparent blur-[140px] rounded-full pointer-events-none -z-10" />

      {/* Hero Header */}
      <div className="max-w-3xl mx-auto text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-300 text-xs font-medium">
          <Sparkles className="w-3.5 h-3.5 text-brand-400" />
          <span>Intelligent Career & Resume Platform</span>
        </div>

        <h1 className="text-4xl sm:text-5xl font-display font-bold tracking-tight text-white leading-tight">
          Build high-impact resumes <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 via-indigo-300 to-brand-300">
            engineered for modern hiring.
          </span>
        </h1>

        <p className="text-sm sm:text-base text-gray-400 max-w-xl mx-auto leading-relaxed">
          Audit ATS compatibility, interview with conversational voice intelligence, and tailor your application to match real job openings without fabricated information.
        </p>

        {/* Primary CTA Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <button
            onClick={() => onNavigate('analyzer')}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-medium text-xs sm:text-sm shadow-sm transition-colors"
          >
            <FileSearch className="w-4 h-4" />
            <span>Audit Resume</span>
            <ArrowRight className="w-4 h-4 ml-0.5" />
          </button>

          <button
            onClick={() => onNavigate('builder')}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gray-900 hover:bg-gray-800 border border-gray-800 text-gray-200 font-medium text-xs sm:text-sm transition-colors"
          >
            <Bot className="w-4 h-4 text-indigo-400" />
            <span>AI Voice Interview</span>
          </button>
        </div>

        {/* Sample Profile Presets */}
        <div className="pt-4 flex flex-wrap items-center justify-center gap-2 text-xs text-gray-500">
          <span>Sample profiles:</span>
          <button
            onClick={() => {
              onSelectResume(sampleSWEProfile);
              onNavigate('studio');
            }}
            className="px-2.5 py-1 rounded-lg bg-gray-900/80 hover:bg-gray-800 border border-gray-800 text-gray-300 transition-colors"
          >
            Senior Full Stack Engineer
          </button>
          <button
            onClick={() => {
              onSelectResume(sampleGradProfile);
              onNavigate('studio');
            }}
            className="px-2.5 py-1 rounded-lg bg-gray-900/80 hover:bg-gray-800 border border-gray-800 text-gray-300 transition-colors"
          >
            Junior Graduate
          </button>
        </div>
      </div>

      {/* 4 Pillars Feature Cards Grid */}
      <div className="max-w-6xl mx-auto mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Module 1: Analyzer */}
        <div 
          onClick={() => onNavigate('analyzer')}
          className="glass-panel p-5 rounded-xl cursor-pointer hover:border-gray-700 transition-all group"
        >
          <div className="w-10 h-10 rounded-lg bg-brand-500/10 border border-brand-500/20 flex items-center justify-center mb-3 text-brand-400">
            <FileSearch className="w-5 h-5" />
          </div>
          <h2 className="text-sm font-semibold text-white mb-1.5">Resume Analyzer</h2>
          <p className="text-xs text-gray-400 leading-relaxed mb-3">
            Instant compatibility audit, readability scores, quantified metrics analysis, and precision bullet improvements.
          </p>
          <div className="flex items-center gap-1 text-xs text-brand-400 font-medium group-hover:translate-x-0.5 transition-transform">
            <span>Diagnose CV</span>
            <ArrowRight className="w-3 h-3" />
          </div>
        </div>

        {/* Module 2: Voice Interview */}
        <div 
          onClick={() => onNavigate('builder')}
          className="glass-panel p-5 rounded-xl cursor-pointer hover:border-gray-700 transition-all group"
        >
          <div className="w-10 h-10 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-3 text-indigo-400">
            <Bot className="w-5 h-5" />
          </div>
          <h2 className="text-sm font-semibold text-white mb-1.5">AI Voice Interview</h2>
          <p className="text-xs text-gray-400 leading-relaxed mb-3">
            Natural conversational dialogue with real-time extraction and instant structuring into your verified candidate profile.
          </p>
          <div className="flex items-center gap-1 text-xs text-indigo-400 font-medium group-hover:translate-x-0.5 transition-transform">
            <span>Start Session</span>
            <ArrowRight className="w-3 h-3" />
          </div>
        </div>

        {/* Module 3: Matcher */}
        <div 
          onClick={() => onNavigate('matcher')}
          className="glass-panel p-5 rounded-xl cursor-pointer hover:border-gray-700 transition-all group"
        >
          <div className="w-10 h-10 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-3 text-purple-400">
            <Target className="w-5 h-5" />
          </div>
          <h2 className="text-sm font-semibold text-white mb-1.5">Job Search & Match</h2>
          <p className="text-xs text-gray-400 leading-relaxed mb-3">
            Discover verified roles, map critical skill coverage, and identify qualifications to target requirements accurately.
          </p>
          <div className="flex items-center gap-1 text-xs text-purple-400 font-medium group-hover:translate-x-0.5 transition-transform">
            <span>Find Opportunities</span>
            <ArrowRight className="w-3 h-3" />
          </div>
        </div>

        {/* Module 4: Studio */}
        <div 
          onClick={() => onNavigate('studio')}
          className="glass-panel p-5 rounded-xl cursor-pointer hover:border-gray-700 transition-all group"
        >
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-3 text-emerald-400">
            <Palette className="w-5 h-5" />
          </div>
          <h2 className="text-sm font-semibold text-white mb-1.5">Resume Studio</h2>
          <p className="text-xs text-gray-400 leading-relaxed mb-3">
            Distraction-free document workspace with typography controls, customized color themes, and multi-format exports.
          </p>
          <div className="flex items-center gap-1 text-xs text-emerald-400 font-medium group-hover:translate-x-0.5 transition-transform">
            <span>Open Studio</span>
            <ArrowRight className="w-3 h-3" />
          </div>
        </div>

      </div>

      {/* Enterprise Trust Guarantee */}
      <div className="max-w-4xl mx-auto mt-14 p-4 sm:p-5 rounded-xl bg-gray-900/60 border border-gray-800 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0 text-emerald-400">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-semibold text-white">Truth-Preserving Career Intelligence</h4>
            <p className="text-xs text-gray-400 mt-0.5">
              Verified skills and achievements are accurately organized without inventing false claims or metrics.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-xs text-gray-400 shrink-0">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>ATS Verified</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>PDF & DOCX</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Privacy First</span>
          </div>
        </div>
      </div>

    </div>
  );
};
