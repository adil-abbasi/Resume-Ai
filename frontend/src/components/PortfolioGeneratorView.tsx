import React, { useState, useEffect } from 'react';
import {
  Globe,
  Crown,
  Sparkles,
  ExternalLink,
  CheckCircle2,
  Lock,
  Zap,
  Layers,
  Palette,
  Eye,
  RefreshCw,
  Copy,
  Check,
  Server,
  ShieldCheck,
  ArrowRight,
  Code2,
  Smartphone,
  Monitor,
  Share2
} from 'lucide-react';
import { ResumeProfile, PortfolioConfig, PortfolioDeployResponse } from '../types';
import { apiService } from '../services/api';
import { useAuth } from '../context/AuthContext';

interface PortfolioGeneratorViewProps {
  activeResume: ResumeProfile;
  onNavigate?: (tab: string) => void;
}

const PORTFOLIO_THEMES = [
  { id: 'dark_cyber', name: 'Dark Cyber Neon', accent: '#3B82F6', desc: 'Electric blue glowing accents with high-tech obsidian dark background' },
  { id: 'emerald_clean', name: 'Emerald Minimal', accent: '#10B981', desc: 'Clean modern typography with soothing forest & mint green highlights' },
  { id: 'obsidian_executive', name: 'Obsidian Executive', accent: '#D97706', desc: 'Refined warm amber & gold details for senior engineering leads' },
  { id: 'minimal_luxe', name: 'Minimal Luxe', accent: '#E11D48', desc: 'Ultra-sleek crimson rose palette with expansive modern whitespace' }
];

export const PortfolioGeneratorView: React.FC<PortfolioGeneratorViewProps> = ({
  activeResume,
  onNavigate
}) => {
  const { user, isProMax, openPricingModal } = useAuth();

  const [selectedTheme, setSelectedTheme] = useState('dark_cyber');
  const [portfolioConfig, setPortfolioConfig] = useState<PortfolioConfig | null>(null);
  const [subdomainInput, setSubdomainInput] = useState('');
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);
  const [deployResult, setDeployResult] = useState<PortfolioDeployResponse | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Auto-generate portfolio configuration on load or theme switch
  useEffect(() => {
    const loadConfig = async () => {
      setIsGenerating(true);
      try {
        const config = await apiService.generatePortfolioConfig(activeResume, selectedTheme);
        setPortfolioConfig(config);
        setSubdomainInput(config.subdomain);
      } catch (err) {
        console.error('Failed to generate portfolio config:', err);
      } finally {
        setIsGenerating(false);
      }
    };
    loadConfig();
  }, [activeResume, selectedTheme]);

  const handleDeploy = async () => {
    if (!isProMax) {
      openPricingModal();
      return;
    }

    if (!portfolioConfig) return;

    setIsDeploying(true);
    try {
      const updatedConfig = {
        ...portfolioConfig,
        subdomain: subdomainInput || portfolioConfig.subdomain,
        theme: selectedTheme
      };
      const res = await apiService.deployPortfolio(updatedConfig);
      setDeployResult(res);
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Deployment failed');
    } finally {
      setIsDeploying(false);
    }
  };

  const handleCopyLiveLink = () => {
    if (!deployResult) return;
    navigator.clipboard.writeText(deployResult.live_url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-white flex items-center gap-2.5">
            <span>Web Portfolio</span>
            <span className="px-2 py-0.5 rounded-md bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-medium">
              Pro Feature
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 mt-1">
            Publish your resume as a responsive personal portfolio with custom styling and edge hosting.
          </p>
        </div>

        {!isProMax && (
          <button
            onClick={openPricingModal}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-brand-600 hover:from-purple-500 hover:to-brand-500 text-xs font-semibold text-white shadow-md transition-all self-start sm:self-auto"
          >
            <Crown className="w-4 h-4 text-amber-300" />
            <span>Upgrade to Deploy</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Main Split-View: Config Panel (Left) vs Live Responsive Portfolio Preview (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT COLUMN: Portfolio Customizer (4 cols) */}
        <div className="lg:col-span-4 space-y-5">
          
          {/* Subdomain Card */}
          <div className="glass-panel p-5 rounded-2xl space-y-3">
            <label className="text-xs font-bold text-white flex items-center gap-1.5">
              <Globe className="w-4 h-4 text-brand-400" />
              <span>Live Website Subdomain</span>
            </label>
            <div className="flex items-center gap-1 px-3 py-2 rounded-xl bg-gray-950 border border-gray-800 text-xs text-white">
              <input
                type="text"
                value={subdomainInput}
                onChange={(e) => setSubdomainInput(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                placeholder="yourname"
                disabled={!isProMax}
                className="bg-transparent text-brand-300 font-mono font-bold focus:outline-none w-28 disabled:opacity-60"
              />
              <span className="text-gray-500 font-mono">.careerai.site</span>
            </div>
            <p className="text-[11px] text-gray-400">
              Includes automatic SSL certificate and global edge hosting.
            </p>
          </div>

          {/* Theme Selector Card */}
          <div className="glass-panel p-5 rounded-2xl space-y-3">
            <label className="text-xs font-bold text-white flex items-center gap-1.5">
              <Palette className="w-4 h-4 text-purple-400" />
              <span>Portfolio Theme & Color Style</span>
            </label>
            
            <div className="grid grid-cols-1 gap-2.5">
              {PORTFOLIO_THEMES.map((th) => (
                <button
                  key={th.id}
                  onClick={() => setSelectedTheme(th.id)}
                  className={`p-3 rounded-xl border text-left transition-all flex items-start gap-3 ${
                    selectedTheme === th.id
                      ? 'bg-purple-950/30 border-purple-500 shadow-md shadow-purple-500/10'
                      : 'bg-gray-900/50 border-gray-800 hover:border-gray-700'
                  }`}
                >
                  <div
                    className="w-4 h-4 rounded-full mt-0.5 shrink-0 shadow-sm"
                    style={{ backgroundColor: th.accent }}
                  />
                  <div>
                    <div className="text-xs font-bold text-white">{th.name}</div>
                    <div className="text-[10px] text-gray-400">{th.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Highlights & Sections included */}
          <div className="glass-panel p-5 rounded-2xl space-y-3 text-xs">
            <h4 className="font-bold text-white flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-brand-400" />
              <span>Included Website Sections</span>
            </h4>
            <div className="space-y-2 text-gray-300">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Modern Hero with Bio & Social Links</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Interactive Tech Stack & Skills Spotlight</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Featured Projects Gallery with Live & GitHub links</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Career Experience Timeline & Education</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>1-Click PDF Resume Download Button for Recruiters</span>
              </div>
            </div>
          </div>

          {/* Deploy Action Button */}
          <div className="pt-2">
            {isProMax ? (
              <button
                onClick={handleDeploy}
                disabled={isDeploying}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 via-pink-600 to-amber-500 hover:from-purple-500 hover:to-amber-400 text-white font-bold text-sm shadow-xl shadow-purple-500/25 flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
              >
                {isDeploying ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Provisioning CDN & Domain...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 text-amber-300 fill-amber-300" />
                    <span>Deploy Portfolio Live</span>
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={openPricingModal}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-gray-800 to-gray-900 border border-purple-500/40 hover:border-purple-500 text-white font-bold text-xs shadow-lg flex items-center justify-center gap-2 transition-all hover:bg-gray-800"
              >
                <Lock className="w-4 h-4 text-amber-400" />
                <span>Unlock 1-Click Deployment with Pro Max</span>
              </button>
            )}
          </div>

          {/* Live Deployment Success Box */}
          {deployResult && (
            <div className="p-4 rounded-2xl bg-emerald-950/80 border border-emerald-500/50 space-y-3 animate-fadeIn">
              <div className="flex items-center gap-2 text-emerald-300 text-xs font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Deployment Live Worldwide!</span>
              </div>
              
              <div className="p-2.5 rounded-xl bg-gray-950/90 border border-emerald-500/30 flex items-center justify-between text-xs font-mono text-white">
                <span className="truncate pr-2 text-emerald-200">{deployResult.live_url}</span>
                <button
                  onClick={handleCopyLiveLink}
                  className="p-1.5 rounded-lg bg-emerald-900/50 hover:bg-emerald-800 text-emerald-200"
                  title="Copy link"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>

              <div className="text-[11px] text-gray-300 flex items-center justify-between">
                <span>{deployResult.cdn_region}</span>
                <span>SSL Active</span>
              </div>
            </div>
          )}

        </div>

        {/* RIGHT COLUMN: Live Interactive Portfolio Preview (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          
          {/* Preview Controls Bar */}
          <div className="flex items-center justify-between glass-panel px-4 py-2.5 rounded-xl">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-bold text-white">Live Portfolio Browser Preview</span>
              <span className="text-[10px] text-gray-400 font-mono hidden sm:inline">
                ({subdomainInput || 'portfolio'}.careerai.site)
              </span>
            </div>

            <div className="flex items-center gap-1.5 bg-gray-900 p-1 rounded-lg border border-gray-800">
              <button
                onClick={() => setPreviewDevice('desktop')}
                className={`p-1.5 rounded text-xs font-semibold flex items-center gap-1 transition-all ${
                  previewDevice === 'desktop' ? 'bg-gray-800 text-white' : 'text-gray-400 hover:text-white'
                }`}
                title="Desktop View"
              >
                <Monitor className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setPreviewDevice('mobile')}
                className={`p-1.5 rounded text-xs font-semibold flex items-center gap-1 transition-all ${
                  previewDevice === 'mobile' ? 'bg-gray-800 text-white' : 'text-gray-400 hover:text-white'
                }`}
                title="Mobile View"
              >
                <Smartphone className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Browser Window Mockup Container */}
          <div className={`mx-auto transition-all ${
            previewDevice === 'mobile' ? 'max-w-sm' : 'w-full'
          }`}>
            <div className="rounded-3xl border border-gray-700/80 bg-gray-950 shadow-2xl overflow-hidden relative">
              
              {/* Browser chrome header */}
              <div className="bg-gray-900/90 border-b border-gray-800 px-4 py-2.5 flex items-center gap-2">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
                </div>
                <div className="flex-1 text-center">
                  <span className="px-3 py-0.5 rounded-md bg-gray-950 text-[11px] font-mono text-gray-400 border border-gray-800 inline-flex items-center gap-1.5">
                    <Lock className="w-2.5 h-2.5 text-emerald-400" />
                    <span>https://{subdomainInput || 'portfolio'}.careerai.site</span>
                  </span>
                </div>
              </div>

              {/* Portfolio Page Render */}
              <div className="p-6 sm:p-8 space-y-8 bg-[#090D16] text-white min-h-[520px] overflow-y-auto max-h-[600px] font-sans selection:bg-brand-500">
                
                {/* Hero Section */}
                <div className="space-y-4 text-center sm:text-left border-b border-gray-800/80 pb-8">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/30 text-brand-400 text-xs font-semibold">
                    <span className="w-2 h-2 rounded-full bg-brand-400 animate-ping" />
                    <span>Available for Opportunities</span>
                  </div>

                  <h2 className="text-2xl sm:text-4xl font-display font-extrabold text-white tracking-tight">
                    {portfolioConfig?.hero_headline || `Hi, I'm ${activeResume.contact_info.full_name || 'Alex Chen'}`}
                  </h2>

                  <p className="text-xs sm:text-sm text-gray-300 max-w-2xl leading-relaxed">
                    {portfolioConfig?.hero_bio || activeResume.summary}
                  </p>

                  {/* Actions & Socials */}
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 pt-2">
                    <button
                      className="px-4 py-2 rounded-xl text-xs font-bold text-white shadow-md transition-all"
                      style={{ backgroundColor: portfolioConfig?.custom_accent_color || '#3B82F6' }}
                    >
                      Download CV (PDF)
                    </button>
                    {activeResume.contact_info.github && (
                      <span className="px-3 py-2 rounded-xl bg-gray-900 border border-gray-800 text-xs font-medium text-gray-300">
                        GitHub
                      </span>
                    )}
                    {activeResume.contact_info.linkedin && (
                      <span className="px-3 py-2 rounded-xl bg-gray-900 border border-gray-800 text-xs font-medium text-gray-300">
                        LinkedIn
                      </span>
                    )}
                  </div>
                </div>

                {/* Skills Spotlight */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">
                    Core Technical Competencies
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {(portfolioConfig?.skills_spotlight || activeResume.skills.technical_skills).slice(0, 10).map((skill, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 rounded-lg bg-gray-900 border border-gray-800 text-xs font-semibold text-gray-200"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Featured Projects Gallery */}
                <div className="space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">
                    Featured Projects
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {(portfolioConfig?.projects || []).slice(0, 4).map((proj, idx) => (
                      <div
                        key={idx}
                        className="p-4 rounded-2xl bg-gray-900/60 border border-gray-800 hover:border-gray-700 transition-all space-y-3 flex flex-col justify-between"
                      >
                        <div className="space-y-2">
                          <h4 className="text-sm font-bold text-white flex items-center justify-between">
                            <span>{proj.title}</span>
                            <ExternalLink className="w-3.5 h-3.5 text-gray-500" />
                          </h4>
                          <p className="text-xs text-gray-400 line-clamp-3 leading-relaxed">
                            {proj.description}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {proj.technologies.slice(0, 3).map((tech, tIdx) => (
                            <span key={tIdx} className="px-2 py-0.5 rounded-md bg-gray-950 text-[10px] text-gray-300 border border-gray-800">
                              {tech}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Experience Timeline */}
                <div className="space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">
                    Work Experience
                  </h3>
                  <div className="space-y-3">
                    {activeResume.work_experience.slice(0, 2).map((exp, idx) => (
                      <div key={idx} className="p-4 rounded-xl bg-gray-900/40 border border-gray-800 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-white">{exp.position}</span>
                          <span className="text-[10px] text-gray-400">{exp.start_date} – {exp.current ? 'Present' : exp.end_date}</span>
                        </div>
                        <div className="text-xs text-brand-300 font-semibold">{exp.company}</div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

              {/* Locked Overlay for Free and Pro users */}
              {!isProMax && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center p-6 text-center z-20">
                  <div className="max-w-md p-6 rounded-3xl bg-[#0B0F19]/95 border border-purple-500/40 shadow-2xl space-y-4 animate-scaleUp">
                    <div className="w-12 h-12 mx-auto rounded-2xl bg-gradient-to-tr from-purple-600 to-amber-500 flex items-center justify-center shadow-lg shadow-purple-500/30">
                      <Crown className="w-6 h-6 text-white" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-lg font-display font-bold text-white">
                        One-Click Web Portfolio is Exclusive to Pro Max
                      </h4>
                      <p className="text-xs text-gray-300">
                        Deploy your personal portfolio live at <span className="text-purple-300 font-mono font-bold">yourname.careerai.site</span> with global CDN hosting, SSL certificate, and instant recruiter downloads.
                      </p>
                    </div>
                    <button
                      onClick={openPricingModal}
                      className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 via-pink-600 to-amber-500 hover:from-purple-500 hover:to-amber-400 text-white font-bold text-xs shadow-xl shadow-purple-500/25 flex items-center justify-center gap-2 transition-all hover:scale-105"
                    >
                      <Crown className="w-4 h-4 text-amber-200 fill-amber-200" />
                      <span>Upgrade to Pro Max / Career Plan</span>
                    </button>
                  </div>
                </div>
              )}

            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
