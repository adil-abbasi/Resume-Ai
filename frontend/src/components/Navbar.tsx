import React, { useState } from 'react';
import {
  Sparkles,
  FileSearch,
  Bot,
  Target,
  Palette,
  LayoutDashboard,
  Layers,
  Crown,
  LogOut,
  ChevronDown,
  Zap,
  Globe
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface NavbarProps {
  activeTab: 'landing' | 'dashboard' | 'analyzer' | 'builder' | 'matcher' | 'templates' | 'studio' | 'portfolio';
  setActiveTab: (tab: 'landing' | 'dashboard' | 'analyzer' | 'builder' | 'matcher' | 'templates' | 'studio' | 'portfolio') => void;
  onOpenCoverLetter?: () => void;
  onOpenLinkedInImport?: () => void;
}

const LinkedinIcon: React.FC<{ className?: string }> = ({ className = "w-3.5 h-3.5" }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v7.6h2.79v-7.6H6.46M7.86 6.88a1.45 1.45 0 0 0-1.46 1.46c0 .8.65 1.46 1.46 1.46.8 0 1.46-.66 1.46-1.46 0-.8-.66-1.46-1.46-1.46Z"/>
  </svg>
);

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenCoverLetter,
  onOpenLinkedInImport
}) => {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const { user, isPro, logout, openAuthModal, openPricingModal } = useAuth();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-800 bg-[#0B0F19]/90 backdrop-blur-md no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2">

        {/* Brand Logo */}
        <div
          onClick={() => setActiveTab('landing')}
          className="flex items-center gap-3 cursor-pointer group shrink-0"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 via-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-brand-500/20 group-hover:scale-105 transition-transform">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 font-display font-bold text-base sm:text-xl text-white">
              <span>Career</span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-indigo-400">AI</span>
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="hidden lg:flex items-center gap-1 p-1 bg-gray-900/60 border border-gray-800 rounded-xl">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'dashboard'
                ? 'bg-brand-600 text-white shadow-sm'
                : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/40'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            Dashboard
          </button>

          <button
            onClick={() => setActiveTab('studio')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'studio'
                ? 'bg-brand-600 text-white shadow-sm'
                : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/40'
            }`}
          >
            <Palette className="w-3.5 h-3.5" />
            Studio
          </button>

          <button
            onClick={() => setActiveTab('builder')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'builder'
                ? 'bg-brand-600 text-white shadow-sm'
                : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/40'
            }`}
          >
            <Bot className="w-3.5 h-3.5" />
            AI Interview
          </button>

          <button
            onClick={() => setActiveTab('analyzer')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'analyzer'
                ? 'bg-brand-600 text-white shadow-sm'
                : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/40'
            }`}
          >
            <FileSearch className="w-3.5 h-3.5" />
            Analyzer
          </button>

          <button
            onClick={() => setActiveTab('matcher')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'matcher'
                ? 'bg-brand-600 text-white shadow-sm'
                : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/40'
            }`}
          >
            <Target className="w-3.5 h-3.5" />
            Jobs
          </button>

          <button
            onClick={() => setActiveTab('portfolio')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'portfolio'
                ? 'bg-brand-600 text-white shadow-sm'
                : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/40'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            Portfolio
          </button>
        </nav>

        {/* Right Section: Auth Menu */}
        <div className="flex items-center gap-2.5 shrink-0">

          {/* LinkedIn Import Button */}
          {onOpenLinkedInImport && (
            <button
              onClick={onOpenLinkedInImport}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-300 font-medium text-xs transition-colors"
            >
              <LinkedinIcon className="w-3.5 h-3.5 text-blue-400" />
              <span className="hidden sm:inline">Import LinkedIn</span>
            </button>
          )}

          {/* User Account / Sign In Dropdown */}
          {user ? (
            <div className="relative">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-2 p-1 pl-2 rounded-xl bg-gray-900 border border-gray-800 hover:border-gray-700 transition-all text-left"
              >
                <div className="w-7 h-7 rounded-lg overflow-hidden bg-brand-600 flex items-center justify-center font-bold text-xs text-white">
                  {user.avatar_url ? (
                    <img src={user.avatar_url} alt={user.name} className="w-full h-full object-cover" />
                  ) : (
                    user.name?.[0]?.toUpperCase() || 'U'
                  )}
                </div>
                <div className="hidden md:block pr-1">
                  <div className="text-xs font-medium text-white max-w-[100px] truncate leading-tight">
                    {user.name || 'Candidate'}
                  </div>
                  <div className="text-[10px] uppercase font-mono text-gray-400 leading-tight">
                    {user.plan}
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
              </button>

              {/* Dropdown Menu */}
              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-60 glass-panel bg-[#0F172A] border border-gray-800 rounded-xl shadow-2xl p-1.5 space-y-1 text-xs z-50 animate-fadeIn">
                  <div className="px-3 py-2 border-b border-gray-800/80">
                    <div className="font-semibold text-white truncate">{user.name}</div>
                    <div className="text-[11px] text-gray-400 truncate">{user.email}</div>
                  </div>

                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      openPricingModal();
                    }}
                    className="w-full px-3 py-2 rounded-lg hover:bg-gray-800/70 text-gray-200 flex items-center justify-between transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <Crown className={`w-3.5 h-3.5 ${isPro ? 'text-amber-400' : 'text-gray-400'}`} />
                      <span>{isPro ? 'Subscription' : 'Upgrade Plan'}</span>
                    </span>
                    <span className="text-[10px] uppercase font-mono text-gray-400">
                      {user.plan}
                    </span>
                  </button>

                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      if (onOpenCoverLetter) onOpenCoverLetter();
                    }}
                    className="w-full px-3 py-2 rounded-lg hover:bg-gray-800/70 text-gray-200 flex items-center gap-2 transition-colors"
                  >
                    <Zap className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Cover Letter Builder</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      setActiveTab('portfolio');
                    }}
                    className="w-full px-3 py-2 rounded-lg hover:bg-gray-800/70 text-gray-200 flex items-center gap-2 transition-colors"
                  >
                    <Globe className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Web Portfolio</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      setActiveTab('templates');
                    }}
                    className="w-full px-3 py-2 rounded-lg hover:bg-gray-800/70 text-gray-200 flex items-center gap-2 transition-colors"
                  >
                    <Layers className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Templates Library</span>
                  </button>

                  <div className="border-t border-gray-800/80 pt-1 mt-1">
                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        logout();
                      }}
                      className="w-full px-3 py-2 rounded-lg hover:bg-red-500/10 text-red-400 flex items-center gap-2 transition-colors"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => openAuthModal('signin')}
                className="px-3 py-1.5 rounded-lg bg-gray-900 hover:bg-gray-800 border border-gray-800 text-xs font-medium text-gray-200 transition-colors"
              >
                Sign In
              </button>
              <button
                onClick={() => openAuthModal('signup')}
                className="px-3.5 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-xs font-medium text-white transition-colors shadow-sm"
              >
                Get Started
              </button>
            </div>
          )}

        </div>

      </div>
    </header>
  );
};
