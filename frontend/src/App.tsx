import React, { useState } from 'react';
import { Navbar } from './components/Navbar';
import { HeroLanding } from './components/HeroLanding';
import { DashboardView } from './components/DashboardView';
import { AnalyzerView } from './components/AnalyzerView';
import { InterviewBuilderView } from './components/InterviewBuilderView';
import { JobMatcherView } from './components/JobMatcherView';
import { TemplateGalleryView } from './components/TemplateGalleryView';
import { ResumeStudioView } from './components/ResumeStudioView';
import { PortfolioGeneratorView } from './components/PortfolioGeneratorView';
import { CoverLetterModal } from './components/CoverLetterModal';
import { LinkedInImportModal } from './components/LinkedInImportModal';
import { AuthModal } from './components/AuthModal';
import { PricingModal } from './components/PricingModal';
import { RewardedAdModal } from './components/RewardedAdModal';
import { AuthProvider } from './context/AuthContext';
import { ResumeProfile, TemplateCustomization, ATSAnalysisResult, JobMatchResult } from './types';
import { sampleSWEProfile, defaultTemplateCustomization } from './services/api';

export function AppContent() {
  const [activeTab, setActiveTab] = useState<'landing' | 'dashboard' | 'analyzer' | 'builder' | 'matcher' | 'templates' | 'studio' | 'portfolio'>('landing');
  const [activeResume, setActiveResume] = useState<ResumeProfile>(sampleSWEProfile);
  const [activeCustomization, setActiveCustomization] = useState<TemplateCustomization>(defaultTemplateCustomization);
  const [analysisResult, setAnalysisResult] = useState<ATSAnalysisResult | null>(null);
  const [latestJobMatch, setLatestJobMatch] = useState<JobMatchResult | null>(null);
  const [isCoverLetterOpen, setIsCoverLetterOpen] = useState(false);
  const [isLinkedInImportOpen, setIsLinkedInImportOpen] = useState(false);
  const [initialLinkedInCode, setInitialLinkedInCode] = useState<string | null>(null);
  const [initialLinkedInState, setInitialLinkedInState] = useState<string | null>(null);
  const [initialLinkedInSessionId, setInitialLinkedInSessionId] = useState<string | null>(null);
  const [initialLinkedInError, setInitialLinkedInError] = useState<string | null>(null);

  // Detect incoming LinkedIn OAuth callback parameters on mount
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const oauthStatus = params.get('oauth_status');
    const sessionId = params.get('session_id');
    const code = params.get('code');
    const state = params.get('state');
    const error = params.get('error');
    const errorDescription = params.get('error_description');

    if (oauthStatus === 'success' && sessionId) {
      setInitialLinkedInSessionId(sessionId);
      setInitialLinkedInCode(null);
      setInitialLinkedInError(null);
      setIsLinkedInImportOpen(true);
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (oauthStatus === 'failed') {
      const formattedError = error || 'LinkedIn authorization failed.';
      setInitialLinkedInError(formattedError);
      setInitialLinkedInSessionId(null);
      setInitialLinkedInCode(null);
      setIsLinkedInImportOpen(true);
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (code) {
      setInitialLinkedInCode(code);
      setInitialLinkedInState(state);
      setInitialLinkedInSessionId(null);
      setInitialLinkedInError(null);
      setIsLinkedInImportOpen(true);
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (error) {
      const formattedError = errorDescription
        ? `LinkedIn returned an OAuth error (${error}): ${errorDescription}`
        : `LinkedIn returned an OAuth error: ${error}`;
      setInitialLinkedInError(formattedError);
      setInitialLinkedInSessionId(null);
      setInitialLinkedInCode(null);
      setIsLinkedInImportOpen(true);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const handleApplyTemplate = (customization: TemplateCustomization) => {
    setActiveCustomization(customization);
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] text-gray-100 flex flex-col font-sans selection:bg-brand-500 selection:text-white">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenCoverLetter={() => setIsCoverLetterOpen(true)}
        onOpenLinkedInImport={() => setIsLinkedInImportOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {activeTab === 'landing' && (
          <HeroLanding
            onNavigate={(tab) => setActiveTab(tab)}
            onSelectResume={(profile) => setActiveResume(profile)}
          />
        )}

        {activeTab === 'dashboard' && (
          <DashboardView
            onNavigate={(tab) => setActiveTab(tab)}
            activeResume={activeResume}
            onSelectResume={(profile) => setActiveResume(profile)}
            latestAnalysis={analysisResult}
            latestJobMatch={latestJobMatch}
            onOpenLinkedInImport={() => setIsLinkedInImportOpen(true)}
          />
        )}

        {activeTab === 'analyzer' && (
          <AnalyzerView
            onNavigate={(tab) => setActiveTab(tab)}
            activeResume={activeResume}
            setActiveResume={setActiveResume}
            analysisResult={analysisResult}
            setAnalysisResult={setAnalysisResult}
            onApplyTemplate={handleApplyTemplate}
          />
        )}

        {activeTab === 'builder' && (
          <InterviewBuilderView
            onNavigate={(tab) => setActiveTab(tab)}
            activeResume={activeResume}
            setActiveResume={setActiveResume}
          />
        )}

        {activeTab === 'matcher' && (
          <JobMatcherView
            onNavigate={(tab) => setActiveTab(tab)}
            activeResume={activeResume}
            setActiveResume={setActiveResume}
            latestJobMatch={latestJobMatch}
            setLatestJobMatch={setLatestJobMatch}
          />
        )}

        {activeTab === 'templates' && (
          <TemplateGalleryView
            onNavigate={(tab) => setActiveTab(tab)}
            activeResume={activeResume}
            onApplyTemplate={handleApplyTemplate}
          />
        )}

        {activeTab === 'studio' && (
          <ResumeStudioView
            resume={activeResume}
            setResume={setActiveResume}
            customization={activeCustomization}
            setCustomization={setActiveCustomization}
            onNavigate={(tab) => setActiveTab(tab)}
          />
        )}

        {activeTab === 'portfolio' && (
          <PortfolioGeneratorView
            activeResume={activeResume}
            onNavigate={(tab) => setActiveTab(tab as any)}
          />
        )}
      </main>

      {/* Global Modals */}
      <AuthModal />
      <PricingModal />
      <RewardedAdModal />
      <CoverLetterModal
        isOpen={isCoverLetterOpen}
        onClose={() => setIsCoverLetterOpen(false)}
        resume={activeResume}
      />
      <LinkedInImportModal
        isOpen={isLinkedInImportOpen}
        onClose={() => {
          setIsLinkedInImportOpen(false);
          setInitialLinkedInCode(null);
          setInitialLinkedInState(null);
          setInitialLinkedInSessionId(null);
          setInitialLinkedInError(null);
        }}
        activeResume={activeResume}
        setActiveResume={setActiveResume}
        onNavigate={(tab) => setActiveTab(tab)}
        initialOAuthCode={initialLinkedInCode}
        initialOAuthState={initialLinkedInState}
        initialOAuthSessionId={initialLinkedInSessionId}
        initialOAuthError={initialLinkedInError}
      />

      {/* Footer */}
      <footer className="border-t border-gray-800/80 py-5 px-4 text-xs text-gray-500 no-print">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-400">Career AI</span>
            <span>•</span>
            <span>Enterprise Resume Intelligence & Career Platform</span>
          </div>
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span>Privacy Policy</span>
            <span>•</span>
            <span>Terms of Service</span>
            <span>•</span>
            <span>System Status</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;

