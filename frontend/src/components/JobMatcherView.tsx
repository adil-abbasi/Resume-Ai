import React, { useState, useEffect, useCallback } from 'react';
import {
  Target,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Wand2,
  Briefcase,
  Building2,
  Search,
  MapPin,
  DollarSign,
  Layers,
  Award,
  RefreshCw,
  Copy,
  BookOpen,
  Check,
  Zap,
  Filter,
  Eye,
  Crown,
  Bot,
  ExternalLink,
  Globe,
  ShieldCheck,
  Clock,
  Send,
  HelpCircle,
  X,
  History,
  FileCheck,
  CheckCircle,
  ChevronDown,
  AlertCircle
} from 'lucide-react';

const LinkedinIcon: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v7.6h2.79v-7.6H6.46M7.86 6.88a1.45 1.45 0 0 0-1.46 1.46c0 .8.65 1.46 1.46 1.46.8 0 1.46-.66 1.46-1.46 0-.8-.66-1.46-1.46-1.46Z"/>
  </svg>
);
import {
  ResumeProfile,
  JobMatchResult,
  JobDescriptionData,
  JobItem,
  JobFitAnalysis,
  JobApplicationRecord,
  ProfileVerificationResult
} from '../types';
import { apiService } from '../services/api';
import { useAuth } from '../context/AuthContext';

interface JobMatcherViewProps {
  onNavigate: (tab: 'studio' | 'analyzer') => void;
  activeResume: ResumeProfile;
  setActiveResume: (profile: ResumeProfile) => void;
  latestJobMatch: JobMatchResult | null;
  setLatestJobMatch: (res: JobMatchResult) => void;
}

export const JobMatcherView: React.FC<JobMatcherViewProps> = ({
  onNavigate,
  activeResume,
  setActiveResume,
  latestJobMatch,
  setLatestJobMatch
}) => {
  const { isPro, isProMax, openPricingModal, token } = useAuth();

  // Mode: "search" (real-time dynamic discovery) | "custom" (pasted JD) | "applications" (tracker)
  const [activeMode, setActiveMode] = useState<'search' | 'custom' | 'applications'>('search');

  // Dynamic Job Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [locationQuery, setLocationQuery] = useState('');
  const [jobTypeFilter, setJobTypeFilter] = useState('All');
  const [remoteOnly, setRemoteOnly] = useState(false);
  const [jobsList, setJobsList] = useState<JobItem[]>([]);
  const [isLoadingJobs, setIsLoadingJobs] = useState(false);
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [selectedJob, setSelectedJob] = useState<JobItem | null>(null);
  const [jobFitAnalysis, setJobFitAnalysis] = useState<JobFitAnalysis | null>(null);
  const [isAnalyzingFit, setIsAnalyzingFit] = useState(false);

  // Pro Max Agent State
  const [showAgentModal, setShowAgentModal] = useState(false);
  const [linkedinUrl, setLinkedinUrl] = useState(activeResume.contact_info?.linkedin || '');
  const [isImportingLinkedIn, setIsImportingLinkedIn] = useState(false);
  const [linkedinSuccessMsg, setLinkedinSuccessMsg] = useState<string | null>(null);
  const [verificationResult, setVerificationResult] = useState<ProfileVerificationResult | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [agentApplicationSuccess, setAgentApplicationSuccess] = useState<string | null>(null);
  const [applicationRecords, setApplicationRecords] = useState<JobApplicationRecord[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Custom JD State
  const [customJobText, setCustomJobText] = useState('');
  const [isMatchingCustom, setIsMatchingCustom] = useState(false);
  const [isTailoring, setIsTailoring] = useState(false);
  const [tailorSuccessMsg, setTailorSuccessMsg] = useState(false);

  // Pagination & Live Search Status States
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [searchStatusMsg, setSearchStatusMsg] = useState<string | null>(null);
  const [searchErrorMsg, setSearchErrorMsg] = useState<string | null>(null);

  // 1. Fetch jobs dynamically via search provider
  const fetchJobs = useCallback(async (queryOverride?: string, pageNum: number = 1, append: boolean = false) => {
    if (pageNum === 1) {
      setIsLoadingJobs(true);
      setSearchStatusMsg('Searching for jobs...');
    } else {
      setIsLoadingMore(true);
      setSearchStatusMsg('Finding the best matches...');
    }
    setSearchErrorMsg(null);

    try {
      const q = queryOverride !== undefined ? queryOverride : searchQuery;
      let jobs: JobItem[] = [];

      if (!q.trim() && (activeResume.target_role || (activeResume.skills?.technical_skills && activeResume.skills.technical_skills.length > 0))) {
        jobs = await apiService.discoverJobsFromProfile(activeResume, pageNum, 10);
      } else {
        jobs = await apiService.searchJobs(
          q,
          locationQuery,
          jobTypeFilter === 'All' ? undefined : jobTypeFilter,
          undefined,
          remoteOnly,
          pageNum,
          10
        );
      }

      setHasMore(jobs.length >= 10);
      setPage(pageNum);

      if (append) {
        setJobsList(prev => {
          const existingIds = new Set(prev.map(j => j.id));
          const existingSignatures = new Set(prev.map(j => `${(j.company || '').toLowerCase()}::${(j.title || '').toLowerCase()}::${(j.location || '').toLowerCase()}`));
          const uniqueNew = jobs.filter(j => !existingIds.has(j.id) && !existingSignatures.has(`${(j.company || '').toLowerCase()}::${(j.title || '').toLowerCase()}::${(j.location || '').toLowerCase()}`));
          return [...prev, ...uniqueNew];
        });
        setSearchStatusMsg('Jobs updated');
      } else {
        setJobsList(jobs);
        setSearchStatusMsg(jobs.length > 0 ? 'Jobs updated' : null);
        if (jobs.length > 0) {
          setSelectedJob(jobs[0]);
          calculateFit(jobs[0]);
        } else {
          setSelectedJob(null);
          setJobFitAnalysis(null);
        }
      }
    } catch (err) {
      console.error('Failed to load dynamic jobs:', err);
      setSearchErrorMsg('Search failed — try again');
      setSearchStatusMsg(null);
    } finally {
      setIsLoadingJobs(false);
      setIsLoadingMore(false);
    }
  }, [searchQuery, locationQuery, jobTypeFilter, remoteOnly, activeResume]);

  // Initial load
  useEffect(() => {
    fetchJobs(undefined, 1, false);
  }, [locationQuery, jobTypeFilter, remoteOnly]);

  // "Load more jobs" handler
  const handleLoadMore = () => {
    if (!isLoadingJobs && !isLoadingMore && hasMore) {
      fetchJobs(undefined, page + 1, true);
    }
  };

  // 2. 1-Click "Discover from My Resume"
  const handleDiscoverFromResume = async () => {
    setIsDiscovering(true);
    setSearchStatusMsg('Finding the best matches...');
    setSearchErrorMsg(null);
    try {
      const jobs = await apiService.discoverJobsFromProfile(activeResume, 1, 10);
      setJobsList(jobs);
      setPage(1);
      setHasMore(jobs.length >= 10);
      if (activeResume.target_role) {
        setSearchQuery(activeResume.target_role);
      }
      setSearchStatusMsg(jobs.length > 0 ? 'Jobs updated' : null);
      if (jobs.length > 0) {
        setSelectedJob(jobs[0]);
        calculateFit(jobs[0]);
      } else {
        setSelectedJob(null);
        setJobFitAnalysis(null);
      }
    } catch (err) {
      console.error('Failed to discover jobs from resume:', err);
      setSearchErrorMsg('Search failed — try again');
      setSearchStatusMsg(null);
    } finally {
      setIsDiscovering(false);
    }
  };

  // 3. Truth-preserving fit analysis
  const calculateFit = async (job: JobItem) => {
    setIsAnalyzingFit(true);
    try {
      const fit = await apiService.matchJobFit(activeResume, job.id, job);
      setJobFitAnalysis(fit);
    } catch (err) {
      console.error(err);
    } finally {
      setIsAnalyzingFit(false);
    }
  };

  const handleSelectJob = (job: JobItem) => {
    setSelectedJob(job);
    calculateFit(job);
  };

  // 4. Pro Max Agent: LinkedIn Import
  const handleImportLinkedIn = async () => {
    if (!linkedinUrl.trim()) return;
    setIsImportingLinkedIn(true);
    setLinkedinSuccessMsg(null);
    try {
      const res = await apiService.importLinkedInProfile(linkedinUrl);
      if (res.success && res.extracted_data) {
        const ext = res.extracted_data;
        const updated = { ...activeResume };
        if (!updated.contact_info.full_name && ext.full_name) updated.contact_info.full_name = ext.full_name;
        if (!updated.contact_info.title && ext.headline) updated.contact_info.title = ext.headline;
        if (!updated.target_role && ext.headline) updated.target_role = ext.headline;
        if (!updated.contact_info.linkedin) updated.contact_info.linkedin = linkedinUrl;
        if (!updated.summary && ext.summary) updated.summary = ext.summary;
        if (ext.skills) {
          ext.skills.forEach(s => {
            if (!updated.skills.technical_skills.includes(s)) updated.skills.technical_skills.push(s);
          });
        }
        setActiveResume(updated);
        setLinkedinSuccessMsg(`✅ Extracted & merged profile from ${ext.full_name || 'LinkedIn'}!`);
        // Re-run verification
        runProfileVerification(updated);
      }
    } catch (err: any) {
      alert(err.message || 'LinkedIn import failed. Please check the URL.');
    } finally {
      setIsImportingLinkedIn(false);
    }
  };

  // 5. Pro Max Agent: Truth-Preserving Profile Verification
  const runProfileVerification = async (profileToVerify?: ResumeProfile) => {
    setIsVerifying(true);
    try {
      const prof = profileToVerify || activeResume;
      const res = await apiService.verifyProfileCompleteness(prof);
      setVerificationResult(res);
    } catch (err) {
      console.error(err);
    } finally {
      setIsVerifying(false);
    }
  };

  // 6. AI Agent: 1-Click Prepare & Apply (Testing mode: Unlocked for all users)
  const handleTriggerAgentApply = async (job: JobItem) => {
    // Pro/Pro Max check lifted for testing
    // Verify profile first
    setIsApplying(true);
    setAgentApplicationSuccess(null);
    try {
      const verifyRes = await apiService.verifyProfileCompleteness(activeResume);
      setVerificationResult(verifyRes);

      if (!verifyRes.is_complete) {
        setShowAgentModal(true);
        setIsApplying(false);
        return;
      }

      // Execute Agent Application
      const applyRes = await apiService.applyWithAgent(job, activeResume, undefined, token || undefined);
      if (applyRes.success) {
        // Update job status in UI
        job.application_status = 'Applied';
        job.applied_at = applyRes.application_record.applied_at;
        
        // Update active resume with tailored version
        if (applyRes.tailored_resume) {
          setActiveResume(applyRes.tailored_resume);
        }

        // Add to application history
        setApplicationRecords(prev => [applyRes.application_record, ...prev]);
        setAgentApplicationSuccess(applyRes.message);

        // Auto-navigate to Studio with tailored resume loaded for review
        setTimeout(() => {
          onNavigate('studio');
        }, 1600);
      }
    } catch (err: any) {
      alert(err.message || 'Agent application failed. Please verify your profile details.');
    } finally {
      setIsApplying(false);
    }
  };

  // 7. Load application history
  const loadApplicationHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const records = await apiService.getAgentApplications(token || undefined);
      setApplicationRecords(records);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (activeMode === 'applications') {
      loadApplicationHistory();
    }
  }, [activeMode]);

  // Tailor Resume for job manually
  const handleTailorForJob = async (jobTextToUse: string) => {
    setIsTailoring(true);
    try {
      const tailored = await apiService.tailorResume(activeResume, jobTextToUse);
      setActiveResume(tailored);
      setTailorSuccessMsg(true);
      setTimeout(() => {
        onNavigate('studio');
      }, 1200);
    } catch (err) {
      console.error(err);
    } finally {
      setIsTailoring(false);
    }
  };

  const handleRunCustomMatch = async () => {
    if (!customJobText.trim()) return;
    setIsMatchingCustom(true);
    setTailorSuccessMsg(false);
    try {
      const res = await apiService.matchJob(activeResume, customJobText);
      setLatestJobMatch(res.match_result);
    } catch (err) {
      console.error(err);
    } finally {
      setIsMatchingCustom(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-white tracking-tight">
            Job Search & Opportunities
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 mt-1">
            Discover verified roles, evaluate skill match compatibility, and tailor your application to specific openings.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* AI Agent Button */}
          <button
            onClick={() => {
              runProfileVerification();
              setShowAgentModal(true);
            }}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium bg-gray-900 hover:bg-gray-800 border border-gray-800 text-gray-200 transition-colors shadow-sm"
          >
            <Bot className="w-4 h-4 text-indigo-400" />
            <span>Application Assistant</span>
          </button>

          <button
            onClick={() => onNavigate('studio')}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-xs font-medium text-white shadow-sm transition-colors"
          >
            <Wand2 className="w-4 h-4" />
            <span>Open Studio</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Success Notification */}
      {agentApplicationSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-200 text-sm flex items-center justify-between shadow-xl animate-fadeIn">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span><strong>{agentApplicationSuccess}</strong></span>
          </div>
          <RefreshCw className="w-4 h-4 animate-spin text-emerald-400 shrink-0" />
        </div>
      )}

      {tailorSuccessMsg && (
        <div className="p-4 rounded-2xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-200 text-sm flex items-center justify-between shadow-xl animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <span><strong>Resume Tailored Successfully!</strong> Verified skills aligned without fabricated metrics. Moving to Studio...</span>
          </div>
          <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
        </div>
      )}

      {/* Navigation Mode Tabs */}
      <div className="flex items-center gap-2 p-1.5 bg-gray-900/80 border border-gray-800 rounded-2xl max-w-xl flex-wrap">
        <button
          onClick={() => setActiveMode('search')}
          className={`flex-1 py-2 px-3.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            activeMode === 'search'
              ? 'bg-brand-600 text-white shadow-md shadow-brand-600/30'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <Search className="w-4 h-4" />
          <span>Web Job Search</span>
        </button>

        <button
          onClick={() => setActiveMode('custom')}
          className={`flex-1 py-2 px-3.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            activeMode === 'custom'
              ? 'bg-brand-600 text-white shadow-md shadow-brand-600/30'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Paste Job Description</span>
        </button>

        <button
          onClick={() => setActiveMode('applications')}
          className={`flex-1 py-2 px-3.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            activeMode === 'applications'
              ? 'bg-brand-600 text-white shadow-md shadow-brand-600/30'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Agent Applied Jobs ({applicationRecords.length})</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* MODE 1: DYNAMIC WEB JOB SEARCH & CANDIDATE FIT ENGINE */}
      {/* ========================================================================= */}
      {activeMode === 'search' && (
        <div className="space-y-6">
          
          {/* Search Controls & 1-Click Resume Discovery Bar */}
          <div className="glass-panel p-5 rounded-2xl space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
              <div className="sm:col-span-5 relative">
                <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && fetchJobs()}
                  placeholder="Job title, keywords, or skills (e.g. Cloud Architect, React, Python)..."
                  className="w-full bg-gray-900/90 border border-gray-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="sm:col-span-3 relative">
                <MapPin className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={locationQuery}
                  onChange={(e) => setLocationQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && fetchJobs()}
                  placeholder="Location (e.g. Remote, San Francisco)..."
                  className="w-full bg-gray-900/90 border border-gray-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="sm:col-span-2">
                <select
                  value={jobTypeFilter}
                  onChange={(e) => setJobTypeFilter(e.target.value)}
                  className="w-full bg-gray-900/90 border border-gray-800 rounded-xl px-3 py-2.5 text-xs text-gray-200 focus:outline-none focus:border-brand-500"
                >
                  <option value="All">All Types</option>
                  <option value="Full-time">Full-time</option>
                  <option value="Contract">Contract</option>
                  <option value="Part-time">Part-time</option>
                </select>
              </div>

              <div className="sm:col-span-2 flex gap-2">
                <button
                  onClick={() => fetchJobs()}
                  disabled={isLoadingJobs}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-xs font-bold text-white transition-all flex items-center justify-center gap-1"
                >
                  {isLoadingJobs ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                  <span>Search</span>
                </button>

                <button
                  type="button"
                  onClick={() => setRemoteOnly(!remoteOnly)}
                  title="Filter remote-only positions"
                  className={`px-3 py-2.5 rounded-xl border text-xs font-semibold transition-all ${
                    remoteOnly
                      ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                      : 'bg-gray-900 border-gray-800 text-gray-400 hover:text-white'
                  }`}
                >
                  🌐 Remote
                </button>
              </div>
            </div>

            {/* Resume Auto-Discovery Bar */}
            <div className="pt-2 border-t border-gray-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-gray-400">
              <div className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-brand-400" />
                <span>Targeting active resume: <strong>{activeResume.target_role || activeResume.contact_info?.title || 'General Software Professional'}</strong></span>
              </div>

              <button
                onClick={handleDiscoverFromResume}
                disabled={isDiscovering}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/30 text-purple-300 font-semibold text-xs transition-all self-start sm:self-auto"
              >
                {isDiscovering ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                <span>✨ Discover from My Resume</span>
              </button>
            </div>
          </div>

          {/* Main Grid: Job Listings (Left 5 cols) | Fit Score Analysis & Agent Apply (Right 7 cols) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Job Listings Column */}
            <div className="lg:col-span-5 space-y-3">
              <div className="flex items-center justify-between px-1 text-xs text-gray-400">
                <div className="flex items-center gap-2">
                  <span>Discovered Opportunities (<strong>{jobsList.length}</strong>)</span>
                  {searchStatusMsg && (
                    <span className="px-2 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-[10px] font-medium flex items-center gap-1">
                      <Sparkles className="w-2.5 h-2.5 text-purple-400" />
                      <span>{searchStatusMsg}</span>
                    </span>
                  )}
                  {searchErrorMsg && (
                    <span className="px-2 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-300 text-[10px] font-medium flex items-center gap-1">
                      <AlertCircle className="w-2.5 h-2.5 text-rose-400" />
                      <span>{searchErrorMsg}</span>
                    </span>
                  )}
                </div>
                <span className="font-mono text-[11px] text-purple-400">Live Dynamic Feed</span>
              </div>

              {isLoadingJobs ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="glass-panel h-32 rounded-2xl animate-pulse bg-gray-900/50" />
                  ))}
                </div>
              ) : jobsList.length === 0 ? (
                <div className="glass-panel p-8 text-center rounded-2xl text-gray-400 text-xs space-y-3">
                  <div className="w-10 h-10 mx-auto rounded-full bg-gray-800/80 flex items-center justify-center text-gray-400">
                    <Search className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-semibold text-white text-sm">
                      {searchErrorMsg ? 'Search failed — try again' : 'No matching jobs found'}
                    </h4>
                    <p className="text-gray-400 text-xs max-w-sm mx-auto">
                      No live jobs were found for this search. Try a different role, location or keyword.
                    </p>
                  </div>
                  <button
                    onClick={handleDiscoverFromResume}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-brand-600/20 hover:bg-brand-600/30 border border-brand-500/30 text-brand-300 font-bold text-xs transition-all"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Discover from Candidate Profile</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="space-y-3 max-h-[660px] overflow-y-auto pr-1">
                    {jobsList.map((job) => {
                      const isSelected = selectedJob?.id === job.id;
                      const isApplied = job.application_status === 'Applied';

                      return (
                        <div
                          key={job.id}
                          onClick={() => handleSelectJob(job)}
                          className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-2.5 ${
                            isSelected
                              ? 'bg-gradient-to-r from-purple-950/40 via-gray-900 to-brand-950/40 border-purple-500/80 shadow-lg shadow-purple-500/10'
                              : 'glass-panel hover:bg-gray-900/80 hover:border-gray-700'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2.5">
                              <span className="text-xl">{job.logo_emoji}</span>
                              <div>
                                <h4 className="font-bold text-white text-xs sm:text-sm">{job.title}</h4>
                                <p className="text-xs text-gray-400">{job.company} • {job.location}</p>
                              </div>
                            </div>

                            <div className="flex flex-col items-end gap-1">
                              {/* Source Badge */}
                              <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-gray-800 text-indigo-300 border border-gray-700 shrink-0">
                                {job.source || 'Web Search'}
                              </span>

                              {/* Status Badge */}
                              <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase shrink-0 ${
                                isApplied
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                  : 'bg-gray-800/80 text-gray-400'
                              }`}>
                                {isApplied ? '✓ Applied' : (job.application_status || 'Found')}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between text-[11px] text-gray-400 pt-1">
                            <span className="text-emerald-400 font-semibold">
                              {job.salary_range && job.salary_range.trim() !== '' ? job.salary_range : 'Salary not specified'}
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="px-1.5 py-0.5 rounded text-[10px] bg-gray-800 text-gray-300 font-medium">
                                {job.remote_status || 'Remote'}
                              </span>
                              <span>{job.posted_date}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Real Pagination: Load More from Provider */}
                  {hasMore && (
                    <div className="pt-2 text-center">
                      <button
                        onClick={handleLoadMore}
                        disabled={isLoadingMore}
                        className="w-full py-2.5 px-4 rounded-xl border border-gray-800 bg-gray-900/80 hover:bg-gray-800 text-xs font-semibold text-gray-300 hover:text-white transition-all flex items-center justify-center gap-2"
                      >
                        {isLoadingMore ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin text-purple-400" />
                            <span>Finding the best matches...</span>
                          </>
                        ) : (
                          <>
                            <span>Load more</span>
                            <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Fit Score & Pro Max Agent Apply Right Column */}
            <div className="lg:col-span-7 glass-panel p-6 rounded-2xl space-y-6">
              
              {isAnalyzingFit ? (
                <div className="py-28 text-center space-y-3 text-gray-400">
                  <RefreshCw className="w-8 h-8 animate-spin mx-auto text-purple-400" />
                  <p className="text-xs">Evaluating truthful candidate match & skill gaps...</p>
                </div>
              ) : selectedJob && jobFitAnalysis ? (
                <>
                  {/* Job Header Banner & Score */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-800 pb-5">
                    <div>
                      <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-purple-400">
                        <span>Candidate Fit Analysis</span>
                        <span>•</span>
                        <span className="text-gray-400">Via {selectedJob.source || 'Web Search'}</span>
                      </div>
                      <h2 className="text-xl font-display font-bold text-white mt-0.5">
                        {selectedJob.title}
                      </h2>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {selectedJob.company} • {selectedJob.location} • {selectedJob.salary_range && selectedJob.salary_range.trim() !== '' ? selectedJob.salary_range : 'Salary not specified'}
                      </p>

                      {/* Direct External Application Link */}
                      {selectedJob.application_link && (
                        <a
                          href={selectedJob.application_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] text-brand-400 hover:text-brand-300 hover:underline mt-1.5 font-medium"
                        >
                          <span>Visit Career Portal Application Page</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>

                    {/* Match Score Display */}
                    <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-900/30 to-brand-900/30 border border-purple-500/30 text-center shrink-0">
                      <div className="text-3xl font-display font-extrabold text-white">
                        {jobFitAnalysis.match_score}%
                      </div>
                      <div className="text-[11px] font-bold text-purple-300 uppercase tracking-wider">
                        Match Score ({jobFitAnalysis.grade})
                      </div>
                    </div>
                  </div>

                  {/* Matching vs Missing Skills Breakdown */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    
                    {/* Matched Skills Box */}
                    <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/30 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          <span>Matching Skills ({jobFitAnalysis.matched_skills.length})</span>
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                          Verified in Resume
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto">
                        {jobFitAnalysis.matched_skills.map((s, idx) => (
                          <span
                            key={idx}
                            className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-500/20 text-emerald-200 border border-emerald-500/40 flex items-center gap-1"
                          >
                            <span className="text-emerald-400 font-bold">✓</span>
                            <span>{s}</span>
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Missing Skills Box */}
                    <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-500/30 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                          <AlertTriangle className="w-4 h-4 text-amber-400" />
                          <span>Skill Gaps ({jobFitAnalysis.missing_skills.length})</span>
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold">
                          Required by Role
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto">
                        {jobFitAnalysis.missing_skills.length > 0 ? (
                          jobFitAnalysis.missing_skills.map((s, idx) => (
                            <span
                              key={idx}
                              className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-500/20 text-amber-200 border border-amber-500/40 flex items-center gap-1"
                            >
                              <span className="text-amber-400 font-bold">⚠</span>
                              <span>{s}</span>
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-gray-400 italic">No missing critical skills detected!</span>
                        )}
                      </div>
                    </div>

                  </div>

                  {/* Factual Recommendations (No fabricated metrics) */}
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-brand-400" />
                      <span>Truthful Tailoring Guidance</span>
                    </span>

                    <div className="space-y-2">
                      {jobFitAnalysis.tailoring_suggestions.map((sug, idx) => (
                        <div key={idx} className="p-3 rounded-xl bg-gray-900/60 border border-gray-800 text-xs space-y-0.5">
                          <div className="font-bold text-brand-300">{sug.section}</div>
                          <p className="text-gray-300 leading-relaxed">{sug.recommendation}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Action Bar: Direct Live Apply, AI Agent Apply, and Manual Tailor */}
                  <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
                    
                    {/* Direct Live Apply on External Career Portal */}
                    {selectedJob.application_link ? (
                      <a
                        href={selectedJob.application_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full sm:flex-1 py-3.5 rounded-xl bg-gradient-to-r from-brand-600 via-indigo-600 to-purple-600 hover:from-brand-500 hover:to-purple-500 text-white font-extrabold text-xs shadow-lg shadow-brand-500/25 flex items-center justify-center gap-2 transition-all"
                      >
                        <span>Apply on {selectedJob.source || 'Career Site'}</span>
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    ) : (
                      <button
                        disabled
                        className="w-full sm:flex-1 py-3.5 rounded-xl bg-gray-800 text-gray-500 font-extrabold text-xs flex items-center justify-center gap-2 cursor-not-allowed"
                      >
                        <span>Application Link Not Provided</span>
                      </button>
                    )}

                    {/* Pro Max Autonomous AI Agent Button */}
                    <button
                      onClick={() => handleTriggerAgentApply(selectedJob)}
                      disabled={isApplying}
                      className="w-full sm:w-auto px-4 py-3.5 rounded-xl bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-200 font-semibold text-xs transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                      title="AI Agent: Prepare tailored resume and track application"
                    >
                      {isApplying ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <Bot className="w-4 h-4 text-amber-400" />
                      )}
                      <span>
                        {selectedJob.application_status === 'Applied' ? 'Re-Apply with Agent' : 'AI Agent Prep'}
                      </span>
                    </button>

                    {/* Manual Tailor in Studio */}
                    <button
                      onClick={() => handleTailorForJob(selectedJob.description)}
                      disabled={isTailoring}
                      className="w-full sm:w-auto px-4 py-3.5 rounded-xl bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-200 font-semibold text-xs transition-all flex items-center justify-center gap-1.5"
                    >
                      {isTailoring ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4 text-brand-400" />}
                      <span>Tailor in Studio</span>
                    </button>

                  </div>
                </>
              ) : (
                <div className="py-28 text-center text-gray-400 text-xs">
                  Select a job opportunity on the left to inspect requirements and candidate fit.
                </div>
              )}

            </div>

          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* MODE 2: CUSTOM PASTE JOB DESCRIPTION */}
      {/* ========================================================================= */}
      {activeMode === 'custom' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 glass-panel p-5 rounded-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-purple-400" />
                <span>Custom Job Description</span>
              </h3>
            </div>
            <textarea
              value={customJobText}
              onChange={(e) => setCustomJobText(e.target.value)}
              rows={16}
              placeholder="Paste any job description here..."
              className="w-full bg-gray-900/90 border border-gray-800 rounded-xl p-4 text-xs text-gray-200 focus:outline-none focus:border-brand-500 font-mono leading-relaxed"
            />
            <button
              onClick={handleRunCustomMatch}
              disabled={isMatchingCustom || !customJobText.trim()}
              className="w-full py-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
            >
              {isMatchingCustom ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              <span>Analyze Custom Job Fit</span>
            </button>
          </div>

          <div className="lg:col-span-7 glass-panel p-6 rounded-2xl space-y-6">
            {latestJobMatch ? (
              <div className="space-y-5">
                <div className="flex items-center justify-between border-b border-gray-800 pb-4">
                  <div>
                    <h2 className="text-lg font-bold text-white">{latestJobMatch.job_title}</h2>
                    <p className="text-xs text-gray-400">{latestJobMatch.company}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-purple-900/30 border border-purple-500/30 text-center">
                    <span className="text-2xl font-bold text-white">{latestJobMatch.match_score}%</span>
                    <span className="block text-[10px] text-purple-300 font-bold">{latestJobMatch.grade}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-emerald-400">Verified Matching Skills:</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {latestJobMatch.matched_skills.map((s, idx) => (
                      <span key={idx} className="px-2 py-1 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs">✓ {s}</span>
                    ))}
                  </div>
                </div>

                {latestJobMatch.missing_critical_skills.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-amber-400">Missing Skills (Gaps):</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {latestJobMatch.missing_critical_skills.map((s, idx) => (
                        <span key={idx} className="px-2 py-1 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs">⚠ {s}</span>
                      ))}
                    </div>
                  </div>
                )}

                <button
                  onClick={() => handleTailorForJob(customJobText)}
                  disabled={isTailoring}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-brand-600 text-white text-xs font-bold shadow-md flex items-center justify-center gap-2"
                >
                  {isTailoring ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                  <span>Tailor Active Resume in Studio</span>
                </button>
              </div>
            ) : (
              <div className="py-28 text-center text-gray-400 text-xs">
                Paste a job description on the left and click "Analyze Custom Job Fit".
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODE 3: AGENT APPLICATION HISTORY TRACKER */}
      {/* ========================================================================= */}
      {activeMode === 'applications' && (
        <div className="glass-panel p-6 rounded-2xl space-y-6">
          <div className="flex items-center justify-between border-b border-gray-800 pb-4">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <History className="w-5 h-5 text-brand-400" />
                <span>Agent Application Tracking Records</span>
              </h2>
              <p className="text-xs text-gray-400 mt-1">
                Audit log of all job openings packaged and applied by the Pro Max Autonomous Agent with timestamps and direct links.
              </p>
            </div>
            <button
              onClick={loadApplicationHistory}
              disabled={isLoadingHistory}
              className="p-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 transition-all text-xs flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingHistory ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>

          {isLoadingHistory ? (
            <div className="py-16 text-center text-gray-400 text-xs">Loading application history...</div>
          ) : applicationRecords.length === 0 ? (
            <div className="py-16 text-center text-gray-400 text-xs space-y-2">
              <Bot className="w-8 h-8 mx-auto text-gray-500" />
              <p>No job applications recorded yet.</p>
              <p className="text-gray-500">Select any job in the search view and click "🤖 Pro Max Agent: Prepare & Apply".</p>
            </div>
          ) : (
            <div className="space-y-3">
              {applicationRecords.map((record) => (
                <div
                  key={record.id}
                  className="p-4 rounded-xl bg-gray-900/80 border border-gray-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-gray-700 transition-all"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-sm">{record.job_title}</span>
                      <span className="text-xs text-gray-400">• {record.company}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        {record.status}
                      </span>
                    </div>
                    <div className="text-[11px] text-gray-500 flex flex-wrap items-center gap-x-3">
                      <span>Applied: {new Date(record.applied_at).toLocaleString()}</span>
                      <span>Resume: {record.resume_used}</span>
                    </div>
                    {record.notes && <p className="text-[11px] text-gray-400 italic mt-0.5">{record.notes}</p>}
                  </div>

                  <div className="flex items-center gap-2">
                    {record.application_link && (
                      <a
                        href={record.application_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-brand-300 border border-gray-700 text-xs font-semibold flex items-center gap-1 transition-all"
                      >
                        <span>Career Link</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                    <button
                      onClick={() => onNavigate('studio')}
                      className="px-3 py-1.5 rounded-lg bg-brand-600/20 hover:bg-brand-600/30 text-brand-300 border border-brand-500/40 text-xs font-semibold flex items-center gap-1 transition-all"
                    >
                      <span>Review in Studio</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* PRO MAX AGENT MODAL: LINKEDIN IMPORT & TRUTH VERIFIER */}
      {/* ========================================================================= */}
      {showAgentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-2xl glass-panel bg-gray-950 border border-gray-700/80 rounded-3xl p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-gray-800 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-brand-600 flex items-center justify-center text-white shadow-md">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-1.5">
                    <span>AI Job Application Agent</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                      Pro Max
                    </span>
                  </h3>
                  <p className="text-xs text-gray-400">
                    Truth-preserving verification, LinkedIn data integration, and automated Studio application.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAgentModal(false)}
                className="p-1.5 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Step 1: Optional LinkedIn Import */}
            <div className="p-4 rounded-2xl bg-gray-900/80 border border-gray-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <LinkedinIcon className="w-4 h-4 text-blue-400" />
                  <span>Optional: Import & Merge LinkedIn Profile</span>
                </span>
                <span className="text-[10px] text-gray-500">Public Info Extraction</span>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={linkedinUrl}
                  onChange={(e) => setLinkedinUrl(e.target.value)}
                  placeholder="https://www.linkedin.com/in/username"
                  className="flex-1 bg-gray-950 border border-gray-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                />
                <button
                  onClick={handleImportLinkedIn}
                  disabled={isImportingLinkedIn || !linkedinUrl.trim()}
                  className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-bold text-xs transition-all shrink-0 flex items-center gap-1.5"
                >
                  {isImportingLinkedIn ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                  <span>Import</span>
                </button>
              </div>

              {linkedinSuccessMsg && (
                <p className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" />
                  <span>{linkedinSuccessMsg}</span>
                </p>
              )}
            </div>

            {/* Step 2: Truth-Preserving Candidate Profile Verification */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-300 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Truthful Profile Readiness Check</span>
                </span>
                {verificationResult && (
                  <span className="text-xs font-mono font-bold text-emerald-400">
                    Readiness: {verificationResult.completion_percentage}%
                  </span>
                )}
              </div>

              {verificationResult ? (
                <div className="p-4 rounded-2xl bg-gray-900/60 border border-gray-800 space-y-3">
                  <p className="text-xs text-gray-300 leading-relaxed">
                    {verificationResult.truthfulness_guidance}
                  </p>

                  {/* Checklist */}
                  <div className="space-y-1.5 pt-1">
                    {verificationResult.present_fields.map((p, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs text-emerald-300">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>{p}</span>
                      </div>
                    ))}
                    {verificationResult.missing_fields.map((m, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs text-amber-400 font-medium">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span>Missing: {m}</span>
                      </div>
                    ))}
                  </div>

                  {!verificationResult.is_complete && (
                    <div className="pt-2 border-t border-gray-800/80 flex items-center justify-between text-xs text-gray-400">
                      <span>Complete missing sections in Resume Studio before triggering Agent apply.</span>
                      <button
                        onClick={() => {
                          setShowAgentModal(false);
                          onNavigate('studio');
                        }}
                        className="px-3 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white font-bold transition-all"
                      >
                        Edit in Studio
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-4 text-center text-xs text-gray-400">
                  <button onClick={() => runProfileVerification()} className="text-brand-400 font-bold hover:underline">
                    Run Profile Readiness Check
                  </button>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-gray-800">
              <button
                onClick={() => setShowAgentModal(false)}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-gray-400 hover:text-white transition-all"
              >
                Close
              </button>

              {selectedJob && (
                <button
                  onClick={() => {
                    setShowAgentModal(false);
                    handleTriggerAgentApply(selectedJob);
                  }}
                  disabled={!verificationResult?.is_complete || isApplying}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-brand-600 to-indigo-600 hover:from-amber-400 text-white text-xs font-bold transition-all disabled:opacity-40 flex items-center gap-1.5 shadow-md shadow-amber-500/20"
                >
                  <Bot className="w-4 h-4" />
                  <span>Confirm & Apply to {selectedJob.company}</span>
                </button>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
