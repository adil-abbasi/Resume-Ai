import React, { useState, useEffect } from 'react';
import { 
  Upload, 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  Sparkles, 
  ArrowRight, 
  Wand2, 
  ShieldCheck, 
  RefreshCw,
  Award,
  Layers,
  Zap,
  HelpCircle,
  FileCheck,
  Crown,
  Lock,
  Download,
  Eye,
  Check,
  Maximize2,
  Minimize2,
  BookOpen,
  Sliders,
  ChevronRight,
  AlertCircle
} from 'lucide-react';
import { ResumeProfile, ATSAnalysisResult, TemplateRecommendation, TemplateCustomization } from '../types';
import { apiService, sampleSWEProfile, sampleGradProfile, defaultTemplateCustomization } from '../services/api';
import { useAuth } from '../context/AuthContext';

interface AnalyzerViewProps {
  onNavigate: (tab: 'studio' | 'matcher' | 'builder' | 'templates') => void;
  activeResume: ResumeProfile;
  setActiveResume: (profile: ResumeProfile) => void;
  analysisResult: ATSAnalysisResult | null;
  setAnalysisResult: (res: ATSAnalysisResult | null) => void;
  onApplyTemplate?: (customization: TemplateCustomization) => void;
}

export const AnalyzerView: React.FC<AnalyzerViewProps> = ({
  onNavigate,
  activeResume,
  setActiveResume,
  analysisResult,
  setAnalysisResult,
  onApplyTemplate
}) => {
  const { isPro, isProMax, openPricingModal, openRewardedAdModal } = useAuth();

  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [rawText, setRawText] = useState('');
  const [activeTab, setActiveTab] = useState<'upload' | 'text' | 'sample'>('upload');
  const [fixedBullets, setFixedBullets] = useState<Record<string, string>>({});
  const [isFixingBullet, setIsFixingBullet] = useState<string | null>(null);

  // Live Preview & Template Recommendation states
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateRecommendation | null>(null);
  const [previewMode, setPreviewMode] = useState<'template' | 'original'>('template');
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);

  // Update selected template when analysisResult changes
  useEffect(() => {
    if (analysisResult?.recommended_templates && analysisResult.recommended_templates.length > 0) {
      if (!selectedTemplate || !analysisResult.recommended_templates.some(t => t.template_id === selectedTemplate.template_id)) {
        setSelectedTemplate(analysisResult.recommended_templates[0]);
      }
    }
  }, [analysisResult]);

  // Run ATS analysis
  const runAnalysis = async (profile: ResumeProfile, fileName?: string) => {
    setIsUploading(true);
    setErrorMessage(null);
    try {
      const res = await apiService.analyzeResume(profile);
      setAnalysisResult(res);
      setActiveResume(profile);
      if (fileName) {
        setUploadedFileName(fileName);
      }
      if (res.recommended_templates && res.recommended_templates.length > 0) {
        setSelectedTemplate(res.recommended_templates[0]);
      }
    } catch (err: any) {
      console.error('Analysis error:', err);
      setErrorMessage(err.message || 'Failed to analyze resume. Please verify the file content and try again.');
    } finally {
      setIsUploading(false);
    }
  };

  // Handle file drop / upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setErrorMessage(null);
    try {
      const parsed = await apiService.parseDocument(file);
      await runAnalysis(parsed.profile, file.name);
    } catch (err: any) {
      console.error('Upload error:', err);
      setErrorMessage(err.message || 'Failed to parse uploaded document. Ensure it is a valid PDF or DOCX file.');
      setIsUploading(false);
    }
  };

  // Handle text parsing
  const handleTextSubmit = async () => {
    if (!rawText.trim()) return;
    setIsUploading(true);
    setErrorMessage(null);
    try {
      const parsed = await apiService.parseDocument(undefined, rawText);
      await runAnalysis(parsed.profile, 'Pasted Resume Text');
    } catch (err: any) {
      console.error('Text parse error:', err);
      setErrorMessage(err.message || 'Failed to parse pasted resume text.');
      setIsUploading(false);
    }
  };

  // Fix weak bullet point with rewriter
  const handleFixBullet = async (originalText: string) => {
    setIsFixingBullet(originalText);
    try {
      const res = await apiService.rewriteBullet(originalText, 'impact');
      setFixedBullets(prev => ({
        ...prev,
        [originalText]: res.improved_text
      }));
    } catch (err) {
      console.error(err);
    } finally {
      setIsFixingBullet(null);
    }
  };

  // Apply template & navigate to studio
  const handleApplyRecommendedTemplate = (tpl: TemplateRecommendation) => {
    if (tpl.is_pro && !isPro) {
      openPricingModal();
      return;
    }

    const customization: TemplateCustomization = {
      ...defaultTemplateCustomization,
      template_id: tpl.template_id,
      font_family: tpl.font_family || 'Inter, sans-serif',
      accent_color: tpl.thumbnail_color || '#2563EB',
      secondary_color: tpl.secondary_color || '#1E293B',
      column_layout: tpl.layout_type === 'single_column' ? 'single_column' : 'two_column'
    };

    if (onApplyTemplate) {
      onApplyTemplate(customization);
    }
    onNavigate('studio');
  };

  // Export / Download CV
  const handleDownloadCV = () => {
    if (isPro) {
      window.print();
    } else {
      openRewardedAdModal(() => {
        window.print();
      });
    }
  };

  const isAnalyzed = Boolean(analysisResult && !isUploading);

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-800 pb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-white tracking-tight">
            Resume Analyzer & Live Audit
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 mt-1">
            Evaluate ATS compatibility, readability scores, and structural metrics with actionable recommendations.
          </p>
        </div>

        {isAnalyzed && (
          <div className="flex items-center gap-2.5 self-start sm:self-auto">
            <button
              onClick={() => onNavigate('studio')}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-gray-900 hover:bg-gray-800 border border-gray-800 text-xs font-medium text-gray-200 transition-colors"
            >
              <Wand2 className="w-3.5 h-3.5 text-brand-400" />
              <span>Open in Studio</span>
            </button>
            
            <button
              onClick={handleDownloadCV}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-xs font-medium text-white shadow-sm transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download CV</span>
            </button>
          </div>
        )}
      </div>

      {/* Error Alert Banner */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-red-950/60 border border-red-500/40 flex items-start gap-3 text-red-200 text-xs animate-fadeIn">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-semibold">Analysis Failed:</span>
            <p className="text-red-300">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* Main Split Screen Workflow */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* ================= LEFT PANE: CONTROLS & DIAGNOSTICS (6 cols) ================= */}
        <div className="lg:col-span-6 space-y-5">
          
          {/* 1. Resume Input & Upload Tabs */}
          <div className="glass-panel p-5 rounded-xl border border-gray-800 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-800 pb-3">
              <div className="flex items-center gap-1 bg-gray-950 p-1 rounded-lg border border-gray-800">
                <button
                  onClick={() => setActiveTab('upload')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    activeTab === 'upload' ? 'bg-brand-600 text-white' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <Upload className="w-3 h-3" />
                  <span>Upload File</span>
                </button>
                <button
                  onClick={() => setActiveTab('text')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    activeTab === 'text' ? 'bg-brand-600 text-white' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <FileText className="w-3 h-3" />
                  <span>Paste Text</span>
                </button>
                <button
                  onClick={() => setActiveTab('sample')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    activeTab === 'sample' ? 'bg-brand-600 text-white' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Sample Resumes</span>
                </button>
              </div>

              {uploadedFileName && (
                <div className="text-[11px] text-gray-400 font-mono truncate max-w-[150px]">
                  <span className="text-gray-300 font-medium">{uploadedFileName}</span>
                </div>
              )}
            </div>

            {/* Tab 1: Upload */}
            {activeTab === 'upload' && (
              <div className="border-2 border-dashed border-gray-700 hover:border-brand-500 rounded-2xl p-8 text-center transition-all bg-gray-900/30 group">
                <input
                  type="file"
                  id="resume-upload"
                  accept=".pdf,.docx,.doc,.txt"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <label htmlFor="resume-upload" className="cursor-pointer flex flex-col items-center justify-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Upload className="w-6 h-6 text-brand-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">
                      Drop your CV file here or <span className="text-brand-400 underline">browse</span>
                    </p>
                    <p className="text-xs text-gray-400 mt-1">Supports PDF and Word (.docx) files</p>
                  </div>
                </label>
              </div>
            )}

            {/* Tab 2: Paste Raw Text */}
            {activeTab === 'text' && (
              <div className="space-y-3">
                <textarea
                  rows={6}
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  placeholder="Paste the raw text of your resume here to extract and analyze..."
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl p-3 text-xs text-gray-200 focus:outline-none focus:border-brand-500 font-mono"
                />
                <div className="flex justify-end">
                  <button
                    onClick={handleTextSubmit}
                    disabled={!rawText.trim() || isUploading}
                    className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-xs font-semibold text-white transition-all shadow-md shadow-brand-500/20"
                  >
                    {isUploading ? 'Analyzing...' : 'Analyze Pasted Text'}
                  </button>
                </div>
              </div>
            )}

            {/* Tab 3: Samples */}
            {activeTab === 'sample' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div 
                  onClick={() => runAnalysis(sampleSWEProfile, 'Alex Chen (SWE Sample)')}
                  className="p-3.5 rounded-xl bg-gray-900/60 border border-gray-800 hover:border-brand-500 cursor-pointer transition-all space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">Alex Chen (SWE)</span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-brand-500/20 text-brand-300">
                      5+ Yrs Exp
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-400">Senior developer with microservices, AWS & high-scale metrics.</p>
                  <div className="text-[11px] font-semibold text-brand-400 pt-1 flex items-center gap-1">
                    Load & Analyze <ArrowRight className="w-3 h-3" />
                  </div>
                </div>

                <div 
                  onClick={() => runAnalysis(sampleGradProfile, 'Maya Patel (Grad Sample)')}
                  className="p-3.5 rounded-xl bg-gray-900/60 border border-gray-800 hover:border-purple-500 cursor-pointer transition-all space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">Maya Patel (Grad)</span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-purple-500/20 text-purple-300">
                      Junior Graduate
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-400">CS graduate with university coursework & web project highlights.</p>
                  <div className="text-[11px] font-semibold text-purple-400 pt-1 flex items-center gap-1">
                    Load & Analyze <ArrowRight className="w-3 h-3" />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 2. Loading State */}
          {isUploading && (
            <div className="glass-panel p-10 rounded-2xl text-center space-y-3">
              <RefreshCw className="w-7 h-7 text-brand-400 animate-spin mx-auto" />
              <h3 className="text-sm font-bold text-white">Extracting & Scoring Resume...</h3>
              <p className="text-xs text-gray-400">Evaluating formatting density, ATS compatibility, and generating smart template recommendations.</p>
            </div>
          )}

          {/* 3. Analysis Diagnostics & Smart Recommendations (Only visible once analyzed) */}
          {isAnalyzed && analysisResult && (
            <div className="space-y-5 animate-fadeIn">
              
              {/* Score & Readability Cards */}
              <div className="grid grid-cols-2 gap-4">
                
                {/* Score Card */}
                <div className="glass-panel p-4 rounded-2xl space-y-2 border-l-4 border-l-brand-500">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-400">ATS Score</span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                      Grade: {analysisResult.grade}
                    </span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-display font-extrabold text-white">
                      {analysisResult.overall_score}
                    </span>
                    <span className="text-xs text-gray-400">/ 100</span>
                  </div>
                  <div className="text-[11px] text-gray-400 line-clamp-2">
                    {analysisResult.score_explanation}
                  </div>
                </div>

                {/* Readability Card */}
                <div className="glass-panel p-4 rounded-2xl space-y-2 border-l-4 border-l-purple-500">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-400">Readability</span>
                    <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-[10px] font-bold">
                      {analysisResult.readability_metrics?.formatting_density || 'Optimal'}
                    </span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-display font-bold text-white">
                      {analysisResult.readability_metrics?.estimated_read_time_seconds || 45}s
                    </span>
                    <span className="text-xs text-gray-400">scan time</span>
                  </div>
                  <div className="text-[11px] text-gray-400 truncate">
                    {analysisResult.readability_metrics?.reading_level || 'Recruiter-Friendly'}
                  </div>
                </div>

              </div>

              {/* Smart Template Recommendations Section */}
              <div className="glass-panel p-5 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <h3 className="text-sm font-bold text-white">Smart Recommended Templates</h3>
                  </div>
                  <span className="text-[10px] text-gray-400">Click to preview live on right</span>
                </div>

                <div className="space-y-2.5">
                  {(analysisResult.recommended_templates || []).map((tpl) => {
                    const isSelected = selectedTemplate?.template_id === tpl.template_id;
                    return (
                      <div
                        key={tpl.template_id}
                        onClick={() => setSelectedTemplate(tpl)}
                        className={`p-3.5 rounded-xl border cursor-pointer transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                          isSelected
                            ? 'bg-brand-950/40 border-brand-500 shadow-md shadow-brand-500/10'
                            : 'bg-gray-900/60 border-gray-800 hover:border-gray-700'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className="w-4 h-4 rounded-full mt-1 shrink-0 shadow-sm"
                            style={{ backgroundColor: tpl.thumbnail_color }}
                          />
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-white">{tpl.name}</span>
                              {tpl.is_pro ? (
                                <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-medium border border-amber-500/30">
                                  Pro
                                </span>
                              ) : (
                                <span className="px-1.5 py-0.5 rounded bg-gray-800 text-gray-300 text-[10px] font-medium border border-gray-700">
                                  Standard
                                </span>
                              )}
                              <span className="text-[10px] text-emerald-400 font-semibold">
                                +{tpl.estimated_score_boost} pts ATS
                              </span>
                            </div>
                            <p className="text-[11px] text-gray-300 leading-relaxed">
                              {tpl.match_reason}
                            </p>
                          </div>
                        </div>

                        {/* Action buttons inside card */}
                        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                          {isSelected ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleApplyRecommendedTemplate(tpl);
                              }}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 shadow-sm ${
                                tpl.is_pro && !isPro
                                  ? 'bg-amber-600 hover:bg-amber-500 text-white'
                                  : 'bg-brand-600 hover:bg-brand-500 text-white'
                              }`}
                            >
                              {tpl.is_pro && !isPro ? (
                                <>
                                  <Crown className="w-3 h-3 text-amber-200" />
                                  <span>Unlock & Apply</span>
                                </>
                              ) : (
                                <>
                                  <Check className="w-3 h-3" />
                                  <span>Apply to CV</span>
                                </>
                              )}
                            </button>
                          ) : (
                            <span className="text-[11px] text-brand-400 font-medium flex items-center gap-1">
                              Preview <ChevronRight className="w-3 h-3" />
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Weak Bullets & Improvement Audit */}
              {analysisResult.weak_bullets?.length > 0 && (
                <div className="glass-panel p-5 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                      <span>Identified Bullet Weaknesses & Instant Fixes</span>
                    </h3>
                    <span className="text-[10px] text-gray-500">Deterministic Polish</span>
                  </div>

                  <div className="space-y-3">
                    {analysisResult.weak_bullets.slice(0, 3).map((item, idx) => (
                      <div key={idx} className="p-3 rounded-xl bg-gray-950 border border-gray-800 space-y-2 text-xs">
                        <div className="flex items-center justify-between text-gray-400 text-[11px]">
                          <span className="font-semibold text-red-400">Issue: {item.issue_type.replace(/_/g, ' ')}</span>
                          <span>ATS Optimization</span>
                        </div>
                        <p className="text-gray-300 font-mono text-[11px]">"{item.original_text}"</p>
                        
                        {fixedBullets[item.original_text] ? (
                          <div className="p-2 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-emerald-200 text-[11px] space-y-1">
                            <span className="font-bold flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Improved Phrasing:
                            </span>
                            <p>{fixedBullets[item.original_text]}</p>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between pt-1">
                            <span className="text-[11px] text-gray-400">{item.reason}</span>
                            <button
                              onClick={() => handleFixBullet(item.original_text)}
                              disabled={isFixingBullet === item.original_text}
                              className="px-2.5 py-1 rounded-lg bg-brand-600/20 hover:bg-brand-600/30 border border-brand-500/30 text-brand-300 text-[11px] font-semibold transition-all flex items-center gap-1"
                            >
                              {isFixingBullet === item.original_text ? (
                                <RefreshCw className="w-3 h-3 animate-spin" />
                              ) : (
                                <Sparkles className="w-3 h-3 text-brand-400" />
                              )}
                              <span>Fix with AI</span>
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          )}

        </div>

        {/* ================= RIGHT PANE: LIVE INTERACTIVE CV PREVIEW (6 cols) ================= */}
        <div className="lg:col-span-6 sticky top-20 space-y-3">
          
          {isAnalyzed ? (
            <>
              {/* Preview Controls Bar */}
              <div className="glass-panel px-4 py-2.5 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-brand-400 animate-pulse" />
                  <span className="text-xs font-bold text-white">Live CV Preview</span>
                  {selectedTemplate && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-800 text-gray-300 font-mono">
                      {selectedTemplate.name} {selectedTemplate.is_pro ? '• Pro' : ''}
                    </span>
                  )}
                </div>

                {/* Preview Mode Switcher */}
                <div className="flex items-center gap-1.5 bg-gray-950 p-1 rounded-xl border border-gray-800 text-xs">
                  <button
                    onClick={() => setPreviewMode('template')}
                    className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                      previewMode === 'template' ? 'bg-brand-600 text-white' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    Smart Template
                  </button>
                  <button
                    onClick={() => setPreviewMode('original')}
                    className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                      previewMode === 'original' ? 'bg-brand-600 text-white' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    Parsed View
                  </button>
                </div>
              </div>

              {/* CV Canvas Box */}
              <div className="rounded-2xl border border-gray-700/80 bg-white text-gray-900 shadow-2xl overflow-hidden min-h-[620px] max-h-[750px] overflow-y-auto p-6 sm:p-8 font-sans selection:bg-brand-200">
                
                {/* Header: Candidate Info */}
                <div 
                  className="pb-4 border-b space-y-2"
                  style={{ borderColor: selectedTemplate?.thumbnail_color || '#2563EB' }}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <h2 
                      className="text-2xl font-bold tracking-tight"
                      style={{ color: selectedTemplate?.secondary_color || '#1E293B' }}
                    >
                      {activeResume.contact_info.full_name || 'Candidate Name'}
                    </h2>
                    <span 
                      className="text-xs font-bold uppercase tracking-wider"
                      style={{ color: selectedTemplate?.thumbnail_color || '#2563EB' }}
                    >
                      {activeResume.contact_info.title || activeResume.target_role || 'Professional'}
                    </span>
                  </div>

                  {/* Contact meta */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-600">
                    {activeResume.contact_info.email && <span>{activeResume.contact_info.email}</span>}
                    {activeResume.contact_info.phone && <span>• {activeResume.contact_info.phone}</span>}
                    {activeResume.contact_info.location && <span>• {activeResume.contact_info.location}</span>}
                    {activeResume.contact_info.linkedin && <span>• {activeResume.contact_info.linkedin}</span>}
                    {activeResume.contact_info.github && <span>• {activeResume.contact_info.github}</span>}
                  </div>
                </div>

                {/* Summary */}
                {activeResume.summary && (
                  <div className="py-3 border-b border-gray-200 space-y-1">
                    <h3 
                      className="text-xs font-bold uppercase tracking-wider"
                      style={{ color: selectedTemplate?.thumbnail_color || '#2563EB' }}
                    >
                      Professional Summary
                    </h3>
                    <p className="text-xs text-gray-700 leading-relaxed">
                      {activeResume.summary}
                    </p>
                  </div>
                )}

                {/* Experience */}
                {activeResume.work_experience?.length > 0 && (
                  <div className="py-3 border-b border-gray-200 space-y-3">
                    <h3 
                      className="text-xs font-bold uppercase tracking-wider"
                      style={{ color: selectedTemplate?.thumbnail_color || '#2563EB' }}
                    >
                      Work Experience
                    </h3>
                    <div className="space-y-3">
                      {activeResume.work_experience.map((exp, idx) => (
                        <div key={idx} className="space-y-1">
                          <div className="flex justify-between items-baseline text-xs font-bold text-gray-900">
                            <span>{exp.position} — <span className="font-semibold text-gray-700">{exp.company}</span></span>
                            <span className="text-[11px] text-gray-500">{exp.start_date} – {exp.current ? 'Present' : exp.end_date}</span>
                          </div>
                          <ul className="list-disc list-inside text-xs text-gray-700 space-y-1 pl-1">
                            {exp.highlights.map((h, hIdx) => (
                              <li key={hIdx} className="leading-relaxed">
                                {fixedBullets[h] ? (
                                  <span className="text-brand-900 font-medium bg-brand-50 px-1 rounded">
                                    {fixedBullets[h]}
                                  </span>
                                ) : (
                                  h
                                )}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Skills Spotlight */}
                {activeResume.skills && (
                  <div className="py-3 border-b border-gray-200 space-y-1.5">
                    <h3 
                      className="text-xs font-bold uppercase tracking-wider"
                      style={{ color: selectedTemplate?.thumbnail_color || '#2563EB' }}
                    >
                      Core Skills & Technologies
                    </h3>
                    <div className="text-xs text-gray-700 space-y-1">
                      {activeResume.skills.technical_skills?.length > 0 && (
                        <div>
                          <strong className="text-gray-900">Technical: </strong>
                          {activeResume.skills.technical_skills.join(', ')}
                        </div>
                      )}
                      {activeResume.skills.frameworks_libraries?.length > 0 && (
                        <div>
                          <strong className="text-gray-900">Frameworks: </strong>
                          {activeResume.skills.frameworks_libraries.join(', ')}
                        </div>
                      )}
                      {activeResume.skills.developer_tools?.length > 0 && (
                        <div>
                          <strong className="text-gray-900">Developer Tools: </strong>
                          {activeResume.skills.developer_tools.join(', ')}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Projects */}
                {activeResume.projects?.length > 0 && (
                  <div className="py-3 border-b border-gray-200 space-y-2">
                    <h3 
                      className="text-xs font-bold uppercase tracking-wider"
                      style={{ color: selectedTemplate?.thumbnail_color || '#2563EB' }}
                    >
                      Key Projects
                    </h3>
                    <div className="space-y-2">
                      {activeResume.projects.map((proj, idx) => (
                        <div key={idx} className="space-y-0.5 text-xs text-gray-700">
                          <div className="font-bold text-gray-900 flex items-center justify-between">
                            <span>{proj.title}</span>
                            {proj.technologies?.length > 0 && (
                              <span className="text-[11px] font-normal text-gray-500">
                                ({proj.technologies.join(', ')})
                              </span>
                            )}
                          </div>
                          <p className="leading-relaxed">{proj.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Education */}
                {activeResume.education?.length > 0 && (
                  <div className="pt-3 space-y-1">
                    <h3 
                      className="text-xs font-bold uppercase tracking-wider"
                      style={{ color: selectedTemplate?.thumbnail_color || '#2563EB' }}
                    >
                      Education
                    </h3>
                    {activeResume.education.map((edu, idx) => (
                      <div key={idx} className="flex justify-between items-baseline text-xs text-gray-700">
                        <div>
                          <strong className="text-gray-900">{edu.degree} in {edu.field_of_study}</strong> — {edu.institution}
                        </div>
                        <span className="text-[11px] text-gray-500">{edu.start_date} – {edu.end_date}</span>
                      </div>
                    ))}
                  </div>
                )}

              </div>

              {/* Bottom Callout: Apply Template CTA */}
              {selectedTemplate && (
                <div className="p-4 rounded-2xl glass-panel flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="space-y-0.5 text-center sm:text-left">
                    <div className="text-xs font-bold text-white flex items-center gap-1.5 justify-center sm:justify-start">
                      <span>Selected Template: <strong>{selectedTemplate.name}</strong></span>
                      {selectedTemplate.is_pro && (
                        <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 text-[10px] font-bold">
                          PRO
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-gray-400">
                      {selectedTemplate.is_pro && !isPro
                        ? 'Previewing improvements live. Upgrade to Pro to auto-apply, or customize manually in free studio.'
                        : 'Apply this structure to your live CV and start customizing sections.'}
                    </p>
                  </div>

                  <button
                    onClick={() => handleApplyRecommendedTemplate(selectedTemplate)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 shadow-md ${
                      selectedTemplate.is_pro && !isPro
                        ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white'
                        : 'bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white'
                    }`}
                  >
                    {selectedTemplate.is_pro && !isPro ? (
                      <>
                        <Crown className="w-3.5 h-3.5 text-amber-200" />
                        <span>Upgrade to Apply</span>
                      </>
                    ) : (
                      <>
                        <Wand2 className="w-3.5 h-3.5" />
                        <span>Apply & Edit in Studio</span>
                        <ArrowRight className="w-3 h-3" />
                      </>
                    )}
                  </button>
                </div>
              )}
            </>
          ) : (
            /* Clean Empty / Pre-Upload Placeholder State */
            <div className="glass-panel p-8 sm:p-12 rounded-3xl text-center space-y-5 border border-dashed border-gray-800">
              <div className="w-16 h-16 mx-auto rounded-3xl bg-gradient-to-tr from-brand-600/20 to-purple-600/20 border border-brand-500/30 flex items-center justify-center">
                <FileText className="w-8 h-8 text-brand-400" />
              </div>
              <div className="space-y-2 max-w-sm mx-auto">
                <h3 className="text-base font-bold text-white font-display">
                  No CV Uploaded Yet
                </h3>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Upload your CV (.pdf or .docx) or paste your resume text on the left. Your live interactive preview, ATS diagnostics, and smart template recommendations will appear right here.
                </p>
              </div>

              <div className="pt-2 grid grid-cols-2 gap-3 text-left max-w-sm mx-auto">
                <div className="p-3 rounded-xl bg-gray-900/50 border border-gray-800 space-y-1">
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Smart Recommendations</span>
                  </div>
                  <p className="text-[10px] text-gray-400">Optimal layouts matching your target domain.</p>
                </div>

                <div className="p-3 rounded-xl bg-gray-900/50 border border-gray-800 space-y-1">
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Deterministic ATS Audit</span>
                  </div>
                  <p className="text-[10px] text-gray-400">Pinpoints missing sections & weak verbs.</p>
                </div>
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
};
