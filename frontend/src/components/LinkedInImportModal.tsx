import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  CheckCircle2,
  AlertCircle,
  X,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  Briefcase,
  GraduationCap,
  Award,
  BookOpen,
  Code2,
  Languages,
  Plus,
  Trash2,
  RefreshCw,
  Eye,
  FileText,
  Copy,
  Info,
  Lock,
  UserCheck
} from 'lucide-react';
import { ResumeProfile, LinkedInImportResponse, LinkedInOAuthUrlResponse, LinkedInOAuthCallbackResponse } from '../types';
import { apiService } from '../services/api';

const LinkedinIcon: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v7.6h2.79v-7.6H6.46M7.86 6.88a1.45 1.45 0 0 0-1.46 1.46c0 .8.65 1.46 1.46 1.46.8 0 1.46-.66 1.46-1.46 0-.8-.66-1.46-1.46-1.46Z"/>
  </svg>
);

interface LinkedInImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeResume: ResumeProfile;
  setActiveResume: (profile: ResumeProfile) => void;
  onNavigate: (tab: 'studio' | 'dashboard' | 'analyzer' | 'matcher') => void;
  initialOAuthCode?: string | null;
  initialOAuthState?: string | null;
  initialOAuthSessionId?: string | null;
  initialOAuthError?: string | null;
}

export const LinkedInImportModal: React.FC<LinkedInImportModalProps> = ({
  isOpen,
  onClose,
  activeResume,
  setActiveResume,
  onNavigate,
  initialOAuthCode,
  initialOAuthState,
  initialOAuthSessionId,
  initialOAuthError
}) => {
  // Mode: "input" (OAuth connect or URL/text) | "review" (review & edit extracted info)
  const [step, setStep] = useState<'input' | 'review'>('input');
  const [inputTab, setInputTab] = useState<'oauth' | 'url' | 'text'>('oauth');
  const [linkedinUrl, setLinkedinUrl] = useState(activeResume.contact_info?.linkedin || '');
  const [rawText, setRawText] = useState('');
  
  // 4 Clear OAuth Frontend States:
  // "Connecting to LinkedIn", "Importing profile", "Import successful", "LinkedIn authorization failed"
  type OAuthFlowState = 'idle' | 'connecting' | 'importing' | 'success' | 'failed';
  const [oauthState, setOauthState] = useState<OAuthFlowState>('idle');

  const [oauthConfig, setOauthConfig] = useState<LinkedInOAuthUrlResponse | null>(null);
  const [selectedRedirectUri, setSelectedRedirectUri] = useState<string>('http://localhost:5173/api/auth/linkedin/callback');
  const [selectedScope, setSelectedScope] = useState<string>('openid profile email');
  const [showPortalGuide, setShowPortalGuide] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isSavingUri, setIsSavingUri] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Extracted data state (editable during review)
  const [extractedData, setExtractedData] = useState<any | null>(null);
  const [unavailableFields, setUnavailableFields] = useState<string[]>([]);
  const [reviewTab, setReviewTab] = useState<'overview' | 'experience' | 'skills' | 'education' | 'projects' | 'more'>('overview');
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Fetch OAuth status on modal open
  useEffect(() => {
    if (isOpen) {
      apiService.getLinkedInOAuthUrl('http://localhost:5173/api/auth/linkedin/callback', selectedScope)
        .then(cfg => {
          setOauthConfig(cfg);
          if (cfg.redirect_uri) {
            setSelectedRedirectUri(cfg.redirect_uri);
          }
        })
        .catch(err => console.error('Failed to check LinkedIn OAuth status:', err));
    }
  }, [isOpen]);

  // Handle incoming OAuth callback error if present
  useEffect(() => {
    if (isOpen && initialOAuthError) {
      setOauthState('failed');
      setErrorMessage(initialOAuthError);
    }
  }, [isOpen, initialOAuthError]);

  // Handle incoming OAuth session ID (redirect from backend callback GET endpoint)
  useEffect(() => {
    if (isOpen && initialOAuthSessionId) {
      setOauthState('importing');
      setErrorMessage(null);
      apiService.getLinkedInOAuthSession(initialOAuthSessionId)
        .then(res => {
          if (res.success && res.candidate_profile) {
            setExtractedData(res.candidate_profile);
            setUnavailableFields(res.candidate_profile.unavailable_fields || []);
            if (res.generated_resume) {
              setActiveResume(res.generated_resume);
            }
            setOauthState('success');
            setSuccessToast(`Import successful! Authenticated as ${res.user_info?.name || 'Member'}. Candidate Profile updated.`);
            // Automatically transition: LinkedIn data → Candidate Profile → Resume generation → Resume Studio
            setTimeout(() => {
              onClose();
              onNavigate('studio');
            }, 1600);
          } else {
            setOauthState('failed');
            setErrorMessage(res.message || 'LinkedIn authorization failed.');
          }
        })
        .catch(err => {
          setOauthState('failed');
          setErrorMessage(err.message || 'LinkedIn authorization failed.');
        });
    }
  }, [isOpen, initialOAuthSessionId]);

  // Handle incoming OAuth callback code if present (POST exchange)
  useEffect(() => {
    if (isOpen && initialOAuthCode) {
      setOauthState('importing');
      setErrorMessage(null);
      const activeRedirect = 'http://localhost:5173/api/auth/linkedin/callback';
      apiService.exchangeLinkedInOAuthCode(initialOAuthCode, activeRedirect, initialOAuthState || undefined)
        .then(res => {
          if (res.success && res.candidate_profile) {
            setExtractedData(res.candidate_profile);
            setUnavailableFields(res.candidate_profile.unavailable_fields || []);
            if (res.generated_resume) {
              setActiveResume(res.generated_resume);
            }
            setOauthState('success');
            setSuccessToast(`Import successful! Authenticated as ${res.user_info?.name || 'Member'}.`);
            // Automatically transition: LinkedIn data → Candidate Profile → Resume generation → Resume Studio
            setTimeout(() => {
              onClose();
              onNavigate('studio');
            }, 1600);
          } else {
            setOauthState('failed');
            setErrorMessage(res.message || 'LinkedIn authorization failed.');
          }
        })
        .catch(err => {
          setOauthState('failed');
          setErrorMessage(err.message || 'LinkedIn authorization failed.');
        });
    }
  }, [isOpen, initialOAuthCode, initialOAuthState]);

  const handleUpdateRedirectUri = async (newUri: string) => {
    setSelectedRedirectUri(newUri);
    setIsSavingUri(true);
    setErrorMessage(null);
    try {
      await apiService.updateLinkedInRedirectUri(newUri);
      const updatedConfig = await apiService.getLinkedInOAuthUrl(newUri, selectedScope);
      setOauthConfig(updatedConfig);
      setSuccessToast(`Redirect URI updated to: ${newUri}`);
      setTimeout(() => setSuccessToast(null), 2500);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to update redirect URI.');
    } finally {
      setIsSavingUri(false);
    }
  };

  const handleCopyUri = (uri: string) => {
    navigator.clipboard.writeText(uri);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  // Trigger Official OAuth Flow
  const handleConnectOAuth = async (overrideScope?: string) => {
    setOauthState('connecting');
    setErrorMessage(null);
    try {
      const activeRedirect = 'http://localhost:5173/api/auth/linkedin/callback';
      const activeScope = overrideScope || selectedScope;
      const config = await apiService.getLinkedInOAuthUrl(activeRedirect, activeScope);
      setOauthConfig(config);
      if (config.configured && config.authorization_url && config.authorization_url.startsWith('https://www.linkedin.com')) {
        // Redirect to official LinkedIn OAuth portal
        window.location.href = config.authorization_url;
      } else {
        setOauthState('failed');
        setErrorMessage(
          config.message ||
          'LinkedIn OAuth is not configured. Please ensure LINKEDIN_CLIENT_ID and LINKEDIN_CLIENT_SECRET are set in backend/.env.'
        );
      }
    } catch (err: any) {
      setOauthState('failed');
      setErrorMessage(err.message || 'Failed to initialize LinkedIn OAuth connection.');
    }
  };

  // Step 1B: Extract from URL or Pasted Text
  const handleExtractManual = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res: LinkedInImportResponse = await apiService.importLinkedInProfile(
        inputTab === 'url' ? linkedinUrl : undefined,
        inputTab === 'text' ? rawText : undefined
      );

      if (res.success && res.extracted_data) {
        setExtractedData(res.extracted_data);
        setUnavailableFields(res.unavailable_fields || res.extracted_data.unavailable_fields || []);
        setStep('review');
      } else {
        setErrorMessage(res.message || 'Could not extract profile data. Please try again.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Extraction failed. If LinkedIn is rate-limited, use the paste text fallback.');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Confirm & Generate Resume -> Send to Studio
  const handleGenerateAndOpenInStudio = async () => {
    if (!extractedData) return;
    setIsGenerating(true);
    setSuccessToast(null);
    try {
      const generatedProfile: ResumeProfile = await apiService.generateResumeFromLinkedIn(
        extractedData,
        activeResume
      );

      setActiveResume(generatedProfile);
      setSuccessToast('🎉 Complete ATS resume generated with authentic LinkedIn details! Opening Studio...');
      
      setTimeout(() => {
        setIsGenerating(false);
        onClose();
        onNavigate('studio');
      }, 1200);
    } catch (err: any) {
      alert(err.message || 'Failed to generate resume.');
      setIsGenerating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-4xl glass-panel bg-gray-950 border border-gray-700/90 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 max-h-[92vh] overflow-y-auto">
        
        {/* Top Header */}
        <div className="flex items-start justify-between border-b border-gray-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400 shadow-lg shadow-blue-600/10 shrink-0">
              <LinkedinIcon className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                  LinkedIn OAuth Profile Import & Resume Builder
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  Secure OAuth 2.0 • Open Testing
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                Connect your LinkedIn account securely through OAuth to import your actual authorized profile information into your Candidate Profile.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 1. STATE: Connecting to LinkedIn */}
        {oauthState === 'connecting' && (
          <div className="p-4 sm:p-5 rounded-2xl bg-blue-950/80 border border-blue-500/70 text-blue-200 flex items-center gap-4 shadow-xl animate-fadeIn">
            <div className="w-11 h-11 rounded-2xl bg-blue-600/30 border border-blue-400/40 flex items-center justify-center shrink-0">
              <RefreshCw className="w-5 h-5 text-blue-400 animate-spin" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-bold text-white flex items-center gap-2">
                <span>Connecting to LinkedIn</span>
                <span className="inline-block w-2 h-2 rounded-full bg-blue-400 animate-ping" />
              </div>
              <p className="text-xs text-blue-300/90 mt-0.5 leading-relaxed">
                Contacting LinkedIn OAuth 2.0 authorization server with OpenID Connect scopes (<code>openid profile email</code>)...
              </p>
            </div>
          </div>
        )}

        {/* 2. STATE: Importing profile */}
        {oauthState === 'importing' && (
          <div className="p-4 sm:p-5 rounded-2xl bg-indigo-950/80 border border-indigo-500/70 text-indigo-200 space-y-3 shadow-xl animate-fadeIn">
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-2xl bg-indigo-600/30 border border-indigo-400/40 flex items-center justify-center shrink-0">
                <RefreshCw className="w-5 h-5 text-indigo-400 animate-spin" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-bold text-white flex items-center gap-2">
                  <span>Importing profile</span>
                  <span className="inline-block w-2 h-2 rounded-full bg-indigo-400 animate-ping" />
                </div>
                <p className="text-xs text-indigo-300/90 mt-0.5 leading-relaxed">
                  Validating CSRF state, exchanging authorization code server-side, and retrieving authorized profile info via LinkedIn OIDC endpoint...
                </p>
              </div>
            </div>
            <div className="w-full bg-indigo-950 rounded-full h-1.5 overflow-hidden border border-indigo-800/60">
              <div className="bg-gradient-to-r from-blue-500 via-indigo-400 to-purple-400 h-1.5 rounded-full animate-pulse w-4/5" />
            </div>
          </div>
        )}

        {/* 3. STATE: Import successful */}
        {oauthState === 'success' && (
          <div className="p-4 sm:p-5 rounded-2xl bg-emerald-950/80 border border-emerald-500/70 text-emerald-200 flex items-center justify-between shadow-xl animate-fadeIn">
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-2xl bg-emerald-600/30 border border-emerald-400/40 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <div className="text-sm font-bold text-white flex items-center gap-2">
                  <span>Import successful</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    LinkedIn Authorized
                  </span>
                </div>
                <p className="text-xs text-emerald-300/90 mt-0.5">
                  {successToast || 'LinkedIn data → Candidate Profile → Resume generated. Opening Resume Studio...'}
                </p>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-emerald-400 shrink-0 animate-bounce" />
          </div>
        )}

        {/* 4. STATE: LinkedIn authorization failed */}
        {oauthState === 'failed' && (
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-rose-950/90 via-gray-900 to-amber-950/40 border border-rose-500/70 text-rose-200 space-y-3 shadow-xl animate-fadeIn">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-rose-600/30 border border-rose-400/40 flex items-center justify-center shrink-0 mt-0.5">
                <AlertCircle className="w-5 h-5 text-rose-400" />
              </div>
              <div className="space-y-1.5 flex-1">
                <div className="text-sm font-bold text-white flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span>LinkedIn authorization failed</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                      OAuth Error
                    </span>
                  </div>
                  <button
                    onClick={() => setOauthState('idle')}
                    className="text-[11px] text-rose-400 hover:text-rose-200 underline"
                  >
                    Dismiss
                  </button>
                </div>
                <div className="text-gray-200 font-mono text-[11px] bg-black/60 p-2.5 rounded-xl border border-rose-900/60 break-all leading-relaxed">
                  {errorMessage || 'LinkedIn authorization was cancelled or encountered an error.'}
                </div>
                <p className="text-gray-400 text-[11px] leading-relaxed pt-1">
                  Ensure your LinkedIn Developer App has product <strong>Sign In with LinkedIn using OpenID Connect</strong> enabled and authorized redirect URI set to: <code className="text-emerald-300 font-mono">http://localhost:5173/api/auth/linkedin/callback</code>.
                </p>
                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => handleConnectOAuth()}
                    className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Try Connecting Again</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowPortalGuide(!showPortalGuide)}
                    className="px-3.5 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-semibold transition-all flex items-center gap-1.5"
                  >
                    <Info className="w-3.5 h-3.5 text-blue-400" />
                    <span>{showPortalGuide ? 'Hide Portal Setup Guide' : 'LinkedIn Portal Setup Guide'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 1: INPUT STAGE (OAUTH 2.0 CONNECT OR URL/TEXT FALLBACK) */}
        {/* ========================================================================= */}
        {step === 'input' && (
          <div className="space-y-6">
            
            {/* Input Selection Tabs */}
            <div className="flex items-center gap-2 p-1 bg-gray-900/90 border border-gray-800 rounded-2xl max-w-xl flex-wrap">
              <button
                onClick={() => setInputTab('oauth')}
                className={`flex-1 py-2 px-3.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  inputTab === 'oauth'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Lock className="w-3.5 h-3.5" />
                <span>LinkedIn OAuth 2.0 (Recommended)</span>
              </button>

              <button
                onClick={() => setInputTab('url')}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  inputTab === 'url'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <LinkedinIcon className="w-3.5 h-3.5" />
                <span>Profile URL</span>
              </button>

              <button
                onClick={() => setInputTab('text')}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  inputTab === 'text'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Pasted Export</span>
              </button>
            </div>

            {/* TAB 1: OFFICIAL LINKEDIN OAUTH 2.0 */}
            {inputTab === 'oauth' && (
              <div className="p-6 rounded-2xl bg-gradient-to-br from-blue-950/30 via-gray-900 to-indigo-950/30 border border-blue-500/30 space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <LinkedinIcon className="w-5 h-5 text-blue-400" />
                      <h3 className="font-bold text-white text-base">
                        Sign In with LinkedIn (OpenID Connect)
                      </h3>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/40">
                        OAuth 2.0
                      </span>
                    </div>
                    <p className="text-xs text-gray-300 leading-relaxed max-w-xl">
                      Securely authenticate with your real LinkedIn account. The system requests authorized access to your verified identity, email, and professional profile information without touching your password.
                    </p>
                  </div>

                  <button
                    onClick={() => handleConnectOAuth(selectedScope)}
                    disabled={isLoading}
                    className="px-6 py-3.5 rounded-2xl bg-[#0A66C2] hover:bg-[#084e96] text-white font-extrabold text-xs shadow-xl shadow-blue-600/20 flex items-center justify-center gap-2.5 shrink-0 transition-all disabled:opacity-50"
                  >
                    {isLoading ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <LinkedinIcon className="w-4 h-4 text-white" />
                    )}
                    <span>Connect with LinkedIn</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Scopes & Credential Transparency */}
                <div className="pt-4 border-t border-gray-800/80 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-gray-400">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Authorized Scopes: <strong>openid, profile, email</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-blue-400 shrink-0" />
                    <span>No dummy data or fabricated information used</span>
                  </div>
                </div>

                {/* Security & Verification Notice */}
                <div className="p-4 rounded-xl bg-gray-950/60 border border-gray-800 text-xs text-gray-400 space-y-2">
                  <div className="flex items-center gap-2 text-gray-200 font-medium">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>Official OAuth 2.0 Security</span>
                  </div>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    Your credentials are authenticated directly through LinkedIn. Career AI accesses only your authorized profile details to generate your resume.
                  </p>
                </div>
              </div>
            )}

            {/* TAB 2: URL EXTRACTION */}
            {inputTab === 'url' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-300 mb-1.5">
                    LinkedIn Profile URL:
                  </label>
                  <input
                    type="url"
                    value={linkedinUrl}
                    onChange={(e) => setLinkedinUrl(e.target.value)}
                    placeholder="https://www.linkedin.com/in/username"
                    className="w-full bg-gray-900/90 border border-gray-800 rounded-xl px-4 py-3 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 font-mono"
                  />
                  <p className="text-[11px] text-gray-500 mt-1">
                    Publicly available profile information will be safely extracted and structured without touching private authentication credentials.
                  </p>
                </div>

                <div className="flex items-center justify-end">
                  <button
                    type="button"
                    onClick={handleExtractManual}
                    disabled={isLoading || !linkedinUrl.trim()}
                    className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2"
                  >
                    {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    <span>Extract Profile</span>
                  </button>
                </div>
              </div>
            )}

            {/* TAB 3: TEXT FALLBACK */}
            {inputTab === 'text' && (
              <div className="space-y-3">
                <label className="block text-xs font-bold text-gray-300">
                  Paste LinkedIn Profile Summary or "Save to PDF" Export Text:
                </label>
                <textarea
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  rows={8}
                  placeholder={`Paste text copied from your LinkedIn profile or resume export:
e.g.
Jane Doe
Senior Full Stack Engineer
San Francisco, CA
jane.doe@example.com

About:
Experienced engineer leading distributed teams...

Experience:
Senior Software Engineer at Stripe (2021 - Present)
- Built high-volume billing microservices in Go and Python...`}
                  className="w-full bg-gray-900/90 border border-gray-800 rounded-xl p-4 text-xs text-gray-200 font-mono placeholder-gray-600 focus:outline-none focus:border-blue-500 leading-relaxed"
                />

                <div className="flex items-center justify-end">
                  <button
                    type="button"
                    onClick={handleExtractManual}
                    disabled={isLoading || !rawText.trim()}
                    className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2"
                  >
                    {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    <span>Parse Profile Text</span>
                  </button>
                </div>
              </div>
            )}

            {/* Truth-Preserving Guarantee Notice */}
            <div className="p-4 rounded-2xl bg-blue-950/20 border border-blue-500/20 flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
              <div className="text-xs space-y-1">
                <p className="font-bold text-blue-200">Strict Truth-Preserving Guarantee</p>
                <p className="text-gray-300 leading-relaxed">
                  We extract authentic accomplishments, roles, and skills directly. Any sections that are private or not provided on LinkedIn are clearly marked as unavailable — <strong>we never fabricate, invent, or exaggerate qualifications</strong>.
                </p>
              </div>
            </div>

          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 2: REVIEW & EDIT EXTRACTED INFORMATION BEFORE USING */}
        {/* ========================================================================= */}
        {step === 'review' && extractedData && (
          <div className="space-y-6">
            
            {/* Header info banner */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-gray-900/80 border border-gray-800">
              <div className="flex items-center gap-3">
                {extractedData.avatar_url ? (
                  <img src={extractedData.avatar_url} alt={extractedData.full_name} className="w-12 h-12 rounded-xl object-cover border border-blue-500/40" />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center font-bold text-blue-300 text-lg">
                    {extractedData.full_name?.[0] || 'L'}
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400">
                      Step 2 of 2: Review & Edit Extracted Data
                    </span>
                    {extractedData.oauth_connected && (
                      <span className="px-2 py-0.2 rounded-full text-[9px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                        ✓ OAuth Verified
                      </span>
                    )}
                  </div>
                  <h3 className="text-base font-bold text-white mt-0.5">
                    {extractedData.full_name} — {extractedData.headline}
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {extractedData.location} {extractedData.email && `• ${extractedData.email}`}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setStep('input')}
                className="px-3 py-1.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-semibold self-start sm:self-auto flex items-center gap-1.5 transition-all"
              >
                <span>Re-Authenticate / Change</span>
              </button>
            </div>

            {/* Section Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-gray-800 text-xs">
              {[
                { id: 'overview', label: 'Overview & Summary', icon: Briefcase },
                { id: 'experience', label: `Experience (${extractedData.work_experience?.length || 0})`, icon: Briefcase },
                { id: 'skills', label: `Skills (${extractedData.skills?.length || 0})`, icon: Code2 },
                { id: 'education', label: `Education (${extractedData.education?.length || 0})`, icon: GraduationCap },
                { id: 'projects', label: `Projects (${extractedData.projects?.length || 0})`, icon: BookOpen },
                { id: 'more', label: 'Certs & More', icon: Award }
              ].map((t) => {
                const Icon = t.icon;
                const isSelected = reviewTab === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setReviewTab(t.id as any)}
                    className={`px-3.5 py-2 rounded-xl font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                        : 'text-gray-400 hover:text-white hover:bg-gray-800/60'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{t.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Tab 1: Overview & Summary */}
            {reviewTab === 'overview' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-300 mb-1">Full Name:</label>
                    <input
                      type="text"
                      value={extractedData.full_name || ''}
                      onChange={(e) => setExtractedData({ ...extractedData, full_name: e.target.value })}
                      className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-300 mb-1">Professional Headline:</label>
                    <input
                      type="text"
                      value={extractedData.headline || ''}
                      onChange={(e) => setExtractedData({ ...extractedData, headline: e.target.value })}
                      className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-300 mb-1">Location:</label>
                    <input
                      type="text"
                      value={extractedData.location || ''}
                      onChange={(e) => setExtractedData({ ...extractedData, location: e.target.value })}
                      className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-300 mb-1">Email / Contact:</label>
                    <input
                      type="text"
                      value={extractedData.email || ''}
                      onChange={(e) => setExtractedData({ ...extractedData, email: e.target.value })}
                      placeholder="e.g. candidate@example.com"
                      className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-300 mb-1">About / Executive Summary:</label>
                  <textarea
                    rows={4}
                    value={extractedData.summary || ''}
                    onChange={(e) => setExtractedData({ ...extractedData, summary: e.target.value })}
                    className="w-full bg-gray-900 border border-gray-800 rounded-xl p-3 text-xs text-gray-200 focus:outline-none focus:border-blue-500 leading-relaxed"
                  />
                </div>
              </div>
            )}

            {/* Tab 2: Work Experience (Preserving all details) */}
            {reviewTab === 'experience' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span>Preserved Work Experience Positions ({extractedData.work_experience?.length || 0})</span>
                  <span className="text-emerald-400 font-semibold">100% Wording & Highlights Preserved</span>
                </div>

                {extractedData.work_experience?.map((exp: any, expIdx: number) => (
                  <div key={expIdx} className="p-4 rounded-2xl bg-gray-900/70 border border-gray-800 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-gray-400">Position Title:</label>
                        <input
                          type="text"
                          value={exp.position || ''}
                          onChange={(e) => {
                            const updated = [...extractedData.work_experience];
                            updated[expIdx].position = e.target.value;
                            setExtractedData({ ...extractedData, work_experience: updated });
                          }}
                          className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-1.5 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-gray-400">Company & Location:</label>
                        <input
                          type="text"
                          value={exp.company || ''}
                          onChange={(e) => {
                            const updated = [...extractedData.work_experience];
                            updated[expIdx].company = e.target.value;
                            setExtractedData({ ...extractedData, work_experience: updated });
                          }}
                          className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-1.5 text-xs text-white"
                        />
                      </div>
                    </div>

                    {/* Bullet Highlights */}
                    <div className="space-y-1.5">
                      <label className="block text-[11px] font-bold text-gray-400">Key Accomplishments / Responsibilities:</label>
                      {exp.highlights?.map((hl: string, hlIdx: number) => (
                        <div key={hlIdx} className="flex items-center gap-2">
                          <span className="text-blue-400 font-bold">•</span>
                          <input
                            type="text"
                            value={hl}
                            onChange={(e) => {
                              const updated = [...extractedData.work_experience];
                              updated[expIdx].highlights[hlIdx] = e.target.value;
                              setExtractedData({ ...extractedData, work_experience: updated });
                            }}
                            className="flex-1 bg-gray-950 border border-gray-800 rounded-lg px-2.5 py-1 text-xs text-gray-200"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const updated = [...extractedData.work_experience];
                              updated[expIdx].highlights.splice(hlIdx, 1);
                              setExtractedData({ ...extractedData, work_experience: updated });
                            }}
                            className="text-gray-500 hover:text-rose-400 p-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Tab 3: Skills */}
            {reviewTab === 'skills' && (
              <div className="space-y-3">
                <label className="block text-xs font-bold text-gray-300">
                  Extracted Endorsed & Listed Skills ({extractedData.skills?.length || 0}):
                </label>
                <div className="flex flex-wrap gap-2 p-4 rounded-2xl bg-gray-900/60 border border-gray-800">
                  {extractedData.skills?.map((skill: string, idx: number) => (
                    <span
                      key={idx}
                      className="px-3 py-1 rounded-xl bg-blue-500/15 border border-blue-500/30 text-blue-200 text-xs font-semibold flex items-center gap-1.5"
                    >
                      <span>{skill}</span>
                      <button
                        type="button"
                        onClick={() => {
                          const updated = [...extractedData.skills];
                          updated.splice(idx, 1);
                          setExtractedData({ ...extractedData, skills: updated });
                        }}
                        className="text-blue-400 hover:text-rose-400"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Tab 4: Education */}
            {reviewTab === 'education' && (
              <div className="space-y-3">
                {extractedData.education?.map((edu: any, eduIdx: number) => (
                  <div key={eduIdx} className="p-4 rounded-2xl bg-gray-900/70 border border-gray-800 space-y-2">
                    <input
                      type="text"
                      value={edu.degree || ''}
                      onChange={(e) => {
                        const updated = [...extractedData.education];
                        updated[eduIdx].degree = e.target.value;
                        setExtractedData({ ...extractedData, education: updated });
                      }}
                      placeholder="Degree"
                      className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-1.5 text-xs text-white"
                    />
                    <input
                      type="text"
                      value={edu.institution || ''}
                      onChange={(e) => {
                        const updated = [...extractedData.education];
                        updated[eduIdx].institution = e.target.value;
                        setExtractedData({ ...extractedData, education: updated });
                      }}
                      placeholder="Institution / University"
                      className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-1.5 text-xs text-white"
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Tab 5: Projects */}
            {reviewTab === 'projects' && (
              <div className="space-y-3">
                {extractedData.projects?.map((proj: any, pIdx: number) => (
                  <div key={pIdx} className="p-4 rounded-2xl bg-gray-900/70 border border-gray-800 space-y-2">
                    <input
                      type="text"
                      value={proj.title || ''}
                      onChange={(e) => {
                        const updated = [...extractedData.projects];
                        updated[pIdx].title = e.target.value;
                        setExtractedData({ ...extractedData, projects: updated });
                      }}
                      placeholder="Project Title"
                      className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-1.5 text-xs font-bold text-white"
                    />
                    <textarea
                      rows={2}
                      value={proj.description || ''}
                      onChange={(e) => {
                        const updated = [...extractedData.projects];
                        updated[pIdx].description = e.target.value;
                        setExtractedData({ ...extractedData, projects: updated });
                      }}
                      className="w-full bg-gray-950 border border-gray-800 rounded-xl p-2 text-xs text-gray-300"
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Tab 6: Certifications, Languages, Publications & Unavailable Fields */}
            {reviewTab === 'more' && (
              <div className="space-y-4">
                {/* Certifications */}
                {extractedData.certifications?.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-white">Licenses & Certifications:</h4>
                    {extractedData.certifications.map((c: any, cIdx: number) => (
                      <div key={cIdx} className="p-3 rounded-xl bg-gray-900 border border-gray-800 text-xs text-gray-200">
                        <span className="font-bold">{c.name}</span> — {c.issuer} ({c.issue_date})
                      </div>
                    ))}
                  </div>
                )}

                {/* Languages */}
                {extractedData.languages?.length > 0 && (
                  <div className="space-y-1.5">
                    <h4 className="text-xs font-bold text-white">Languages:</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {extractedData.languages.map((l: string, lIdx: number) => (
                        <span key={lIdx} className="px-2.5 py-1 rounded-lg bg-gray-800 text-xs text-gray-300 border border-gray-700">
                          {l}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Explicit Unavailable Sections Notice */}
                {unavailableFields.length > 0 && (
                  <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-500/30 space-y-1.5">
                    <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>Marked Unavailable / Not Publicly Provided:</span>
                    </div>
                    <ul className="text-xs text-gray-400 list-disc list-inside space-y-0.5">
                      {unavailableFields.map((field, idx) => (
                        <li key={idx}>{field}</li>
                      ))}
                    </ul>
                    <p className="text-[11px] text-gray-500 pt-1">
                      Nothing was fabricated for these missing sections. You can add them anytime inside Resume Studio.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Bottom Review Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-800">
              <button
                type="button"
                onClick={() => setStep('input')}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-gray-400 hover:text-white"
              >
                Back to Input
              </button>

              <button
                type="button"
                onClick={handleGenerateAndOpenInStudio}
                disabled={isGenerating}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-brand-600 hover:from-blue-500 hover:to-brand-500 text-white font-extrabold text-xs shadow-xl shadow-blue-500/20 flex items-center gap-2 transition-all"
              >
                {isGenerating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                <span>Generate ATS Resume & Open in Studio</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};
