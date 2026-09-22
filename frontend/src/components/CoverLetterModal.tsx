import React, { useState } from 'react';
import {
  X,
  Sparkles,
  FileText,
  Copy,
  Check,
  Download,
  Send,
  Lock,
  Crown,
  RefreshCw,
  Building,
  Briefcase,
  Zap,
  Sliders
} from 'lucide-react';
import { ResumeProfile, CoverLetterResponse } from '../types';
import { apiService } from '../services/api';
import { useAuth } from '../context/AuthContext';

interface CoverLetterModalProps {
  isOpen: boolean;
  onClose: () => void;
  resume: ResumeProfile;
  defaultJobTitle?: string;
  defaultCompany?: string;
  defaultJobDescription?: string;
}

export const CoverLetterModal: React.FC<CoverLetterModalProps> = ({
  isOpen,
  onClose,
  resume,
  defaultJobTitle = '',
  defaultCompany = '',
  defaultJobDescription = ''
}) => {
  const { isPro, isProMax, openPricingModal } = useAuth();

  const [jobTitle, setJobTitle] = useState(defaultJobTitle || resume.target_role || 'Software Engineer');
  const [companyName, setCompanyName] = useState(defaultCompany || 'Tech Corp');
  const [jobDescription, setJobDescription] = useState(defaultJobDescription || '');
  const [tone, setTone] = useState<'confident' | 'enthusiastic' | 'executive' | 'technical'>('confident');
  const [customNotes, setCustomNotes] = useState('');

  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedLetter, setGeneratedLetter] = useState<CoverLetterResponse | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    if (!jobTitle.trim() || !companyName.trim()) {
      alert('Please provide both a Job Title and Company Name.');
      return;
    }

    setIsGenerating(true);
    try {
      const res = await apiService.generateCoverLetter(resume, {
        job_title: jobTitle,
        company_name: companyName,
        job_description: jobDescription,
        tone,
        custom_notes: customNotes
      });
      setGeneratedLetter(res);
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Failed to generate cover letter');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    if (!generatedLetter) return;
    navigator.clipboard.writeText(generatedLetter.full_text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadTxt = () => {
    if (!generatedLetter) return;
    const element = document.createElement('a');
    const file = new Blob([generatedLetter.full_text], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `${companyName.replace(/\s+/g, '_')}_Cover_Letter_${(resume.contact_info.full_name || 'Candidate').replace(/\s+/g, '_')}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-4xl glass-panel bg-[#0B0F19]/95 border border-gray-700/80 rounded-3xl p-5 sm:p-7 shadow-2xl overflow-y-auto max-h-[92vh]">
        
        {/* Glow */}
        <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full bg-brand-500/15 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-64 h-64 rounded-full bg-indigo-500/15 blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800 transition-all z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-brand-500/20 shrink-0">
            <FileText className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-display font-bold text-white">
                AI Cover Letter Generator
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-brand-500/20 text-brand-300 text-[10px] font-bold border border-brand-500/30 uppercase">
                Pro & Pro Max
              </span>
            </div>
            <p className="text-xs text-gray-400">
              Tailor a high-impact narrative matching your genuine experience to any job opening.
            </p>
          </div>
        </div>

        {/* Two-Column Grid: Config on Left, Generated Output on Right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left Form: 5 cols */}
          <div className="lg:col-span-5 space-y-4">
            
            {/* Target Role & Company */}
            <div className="space-y-3 p-4 rounded-2xl bg-gray-900/70 border border-gray-800">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-300 flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5 text-brand-400" />
                  <span>Target Role Title *</span>
                </label>
                <input
                  type="text"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  placeholder="e.g. Senior Frontend Engineer"
                  className="w-full px-3 py-2 rounded-xl bg-gray-950 border border-gray-800 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-300 flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-brand-400" />
                  <span>Target Company *</span>
                </label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g. Stripe, OpenAI, Google"
                  className="w-full px-3 py-2 rounded-xl bg-gray-950 border border-gray-800 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-brand-500"
                />
              </div>
            </div>

            {/* Tone Selection */}
            <div className="p-4 rounded-2xl bg-gray-900/70 border border-gray-800 space-y-2">
              <label className="text-xs font-semibold text-gray-300 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-brand-400" />
                <span>Letter Tone</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'confident', label: 'Confident', desc: 'Direct & achievement-focused' },
                  { id: 'enthusiastic', label: 'Enthusiastic', desc: 'Passionate & high energy' },
                  { id: 'executive', label: 'Executive', desc: 'Strategic & leadership ROI' },
                  { id: 'technical', label: 'Technical', desc: 'Stack & architecture depth' }
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTone(t.id as any)}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      tone === t.id
                        ? 'bg-brand-600/20 border-brand-500 text-white shadow-sm'
                        : 'bg-gray-950/60 border-gray-800 text-gray-400 hover:text-white hover:border-gray-700'
                    }`}
                  >
                    <div className="text-xs font-bold capitalize text-white">{t.label}</div>
                    <div className="text-[10px] text-gray-400">{t.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Optional Job Description / Custom Notes */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-300">
                Job Context / Keywords (Optional)
              </label>
              <textarea
                rows={3}
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste key requirements from the job posting..."
                className="w-full px-3 py-2 rounded-xl bg-gray-900 border border-gray-800 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-brand-500 font-mono"
              />
            </div>

            {/* Generate Trigger */}
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-brand-600 via-indigo-600 to-purple-600 hover:from-brand-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-brand-500/25 flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Synthesizing Cover Letter...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-white" />
                  <span>Generate AI Cover Letter</span>
                </>
              )}
            </button>
          </div>

          {/* Right Output: 7 cols */}
          <div className="lg:col-span-7 flex flex-col h-full min-h-[380px]">
            {generatedLetter ? (
              <div className="flex flex-col h-full rounded-2xl bg-gray-950 border border-gray-800 p-5 space-y-4">
                
                {/* Output Controls Header */}
                <div className="flex items-center justify-between border-b border-gray-800 pb-3">
                  <div className="flex items-center gap-2 text-xs font-semibold text-gray-300">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    <span>Generated for {companyName}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleCopy}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-900 hover:bg-gray-800 text-xs font-medium text-gray-200 border border-gray-800 transition-all"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copied ? 'Copied' : 'Copy'}</span>
                    </button>

                    <button
                      onClick={handleDownloadTxt}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-xs font-semibold text-white shadow-sm transition-all"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download .txt</span>
                    </button>
                  </div>
                </div>

                {/* Keywords Used Pills */}
                {generatedLetter.matching_keywords_used?.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-gray-400">
                    <span className="font-semibold text-gray-300">Target Keywords:</span>
                    {generatedLetter.matching_keywords_used.map((kw, idx) => (
                      <span key={idx} className="px-2 py-0.5 rounded-md bg-brand-500/15 text-brand-300 border border-brand-500/30">
                        {kw}
                      </span>
                    ))}
                  </div>
                )}

                {/* Cover Letter Text Area */}
                <div className="flex-1 overflow-y-auto max-h-[380px] pr-2 space-y-3 text-xs leading-relaxed text-gray-200 font-sans whitespace-pre-line bg-gray-900/50 p-4 rounded-xl border border-gray-800/80">
                  {generatedLetter.full_text}
                </div>

              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 rounded-2xl bg-gray-900/30 border border-dashed border-gray-800 space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-brand-400" />
                </div>
                <div className="space-y-1 max-w-sm">
                  <h4 className="text-sm font-bold text-white">No Cover Letter Generated Yet</h4>
                  <p className="text-xs text-gray-400">
                    Fill in your target job role and company on the left, then click <strong>Generate AI Cover Letter</strong> to craft your custom letter.
                  </p>
                </div>
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};
