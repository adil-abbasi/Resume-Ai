import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Target, 
  Award, 
  Sparkles, 
  ArrowRight, 
  Plus, 
  FileSearch, 
  Bot, 
  Palette, 
  ExternalLink,
  CheckCircle,
  Briefcase,
  RefreshCw
} from 'lucide-react';
import { ResumeProfile, ATSAnalysisResult, JobMatchResult, JobItem } from '../types';
import { sampleSWEProfile, sampleGradProfile, apiService } from '../services/api';

interface DashboardViewProps {
  onNavigate: (tab: 'analyzer' | 'builder' | 'matcher' | 'studio') => void;
  activeResume: ResumeProfile;
  onSelectResume: (profile: ResumeProfile) => void;
  latestAnalysis: ATSAnalysisResult | null;
  latestJobMatch: JobMatchResult | null;
  onOpenLinkedInImport?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigate,
  activeResume,
  onSelectResume,
  latestAnalysis,
  latestJobMatch,
  onOpenLinkedInImport
}) => {
  const currentScore = latestAnalysis ? latestAnalysis.overall_score : 94;
  const currentGrade = latestAnalysis ? latestAnalysis.grade : 'A+';

  const [liveJobs, setLiveJobs] = useState<JobItem[]>([]);
  const [isLoadingLiveJobs, setIsLoadingLiveJobs] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const loadOpportunities = async () => {
      setIsLoadingLiveJobs(true);
      try {
        const jobs = await apiService.discoverJobsFromProfile(activeResume, 1, 4);
        if (isMounted) {
          setLiveJobs(jobs);
        }
      } catch {
        if (isMounted) setLiveJobs([]);
      } finally {
        if (isMounted) setIsLoadingLiveJobs(false);
      }
    };
    loadOpportunities();
    return () => { isMounted = false; };
  }, [activeResume]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-white tracking-tight">
            Career Overview
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 mt-1">
            Manage your active resumes, evaluate job match compatibility, and track interview readiness.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {onOpenLinkedInImport && (
            <button
              onClick={onOpenLinkedInImport}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-xs font-medium text-blue-300 transition-colors shadow-sm"
            >
              <svg className="w-3.5 h-3.5 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v7.6h2.79v-7.6H6.46M7.86 6.88a1.45 1.45 0 0 0-1.46 1.46c0 .8.65 1.46 1.46 1.46.8 0 1.46-.66 1.46-1.46 0-.8-.66-1.46-1.46-1.46Z"/>
              </svg>
              <span>Import LinkedIn</span>
            </button>
          )}

          <button
            onClick={() => onNavigate('builder')}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gray-900 hover:bg-gray-800 border border-gray-800 text-xs font-medium text-gray-200 transition-colors"
          >
            <Bot className="w-4 h-4 text-indigo-400" />
            <span>AI Interview</span>
          </button>
          <button
            onClick={() => onNavigate('studio')}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-xs font-medium text-white shadow-sm transition-colors"
          >
            <Palette className="w-4 h-4" />
            <span>Open Studio</span>
          </button>
        </div>
      </div>

      {/* LinkedIn Import Banner */}
      {onOpenLinkedInImport && (
        <div className="p-4 sm:p-5 rounded-xl bg-gray-900/60 border border-blue-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v7.6h2.79v-7.6H6.46M7.86 6.88a1.45 1.45 0 0 0-1.46 1.46c0 .8.65 1.46 1.46 1.46.8 0 1.46-.66 1.46-1.46 0-.8-.66-1.46-1.46-1.46Z"/>
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">
                Import from LinkedIn
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                Automatically extract verified experience, projects, and skills to generate your ATS resume.
              </p>
            </div>
          </div>

          <button
            onClick={onOpenLinkedInImport}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs shadow-sm flex items-center gap-1.5 shrink-0 transition-colors self-start sm:self-auto"
          >
            <span>Connect LinkedIn</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Metric 1: ATS Score */}
        <div className="glass-panel p-4 rounded-xl border border-gray-800">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400 font-medium">ATS Resume Score</span>
            <span className="text-[11px] font-semibold text-emerald-400">
              Grade {currentGrade}
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-display font-bold text-white">{currentScore}</span>
            <span className="text-xs text-gray-500">/ 100</span>
          </div>
          <div className="mt-2.5 w-full bg-gray-800 rounded-full h-1 overflow-hidden">
            <div 
              className="bg-brand-500 h-full rounded-full transition-all duration-500" 
              style={{ width: `${currentScore}%` }}
            />
          </div>
          <button 
            onClick={() => onNavigate('analyzer')}
            className="mt-3 text-[11px] text-gray-400 hover:text-white font-medium flex items-center gap-1 transition-colors"
          >
            Inspect audit breakdown <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {/* Metric 2: Active Resumes */}
        <div className="glass-panel p-4 rounded-xl border border-gray-800">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400 font-medium">Active Profiles</span>
            <FileText className="w-3.5 h-3.5 text-gray-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-display font-bold text-white">2</span>
            <span className="text-xs text-gray-500">saved resumes</span>
          </div>
          <p className="mt-2.5 text-[11px] text-gray-400 truncate">
            Primary: <span className="text-gray-200">{activeResume.contact_info.full_name || 'My Resume'}</span>
          </p>
          <button 
            onClick={() => onNavigate('studio')}
            className="mt-3 text-[11px] text-gray-400 hover:text-white font-medium flex items-center gap-1 transition-colors"
          >
            Edit in Studio <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {/* Metric 3: Target Job Readiness */}
        <div className="glass-panel p-4 rounded-xl border border-gray-800">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400 font-medium">Target Role Fit</span>
            <Target className="w-3.5 h-3.5 text-gray-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-display font-bold text-white">
              {latestJobMatch ? `${latestJobMatch.match_score}%` : '92%'}
            </span>
            <span className="text-xs text-gray-500">match index</span>
          </div>
          <p className="mt-2.5 text-[11px] text-gray-400 truncate">
            {latestJobMatch ? latestJobMatch.job_title : 'Senior Full Stack Engineer'}
          </p>
          <button 
            onClick={() => onNavigate('matcher')}
            className="mt-3 text-[11px] text-gray-400 hover:text-white font-medium flex items-center gap-1 transition-colors"
          >
            Run gap analysis <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {/* Metric 4: Skills Identified */}
        <div className="glass-panel p-4 rounded-xl border border-gray-800">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400 font-medium">Verified Skills</span>
            <Award className="w-3.5 h-3.5 text-gray-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-display font-bold text-white">
              {(activeResume.skills.technical_skills?.length || 0) + (activeResume.skills.frameworks_libraries?.length || 0) + (activeResume.skills.developer_tools?.length || 0)}
            </span>
            <span className="text-xs text-gray-500">keywords</span>
          </div>
          <p className="mt-2.5 text-[11px] text-emerald-400 flex items-center gap-1">
            <CheckCircle className="w-3 h-3" /> Authenticated facts
          </p>
          <button 
            onClick={() => onNavigate('analyzer')}
            className="mt-3 text-[11px] text-gray-400 hover:text-white font-medium flex items-center gap-1 transition-colors"
          >
            View skill matrix <ArrowRight className="w-3 h-3" />
          </button>
        </div>

      </div>

      {/* Main Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Resumes & Saved Jobs (7 cols) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Saved Resumes */}
          <div className="glass-panel p-5 rounded-xl border border-gray-800 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-brand-400" />
                <span>Saved Resumes</span>
              </h3>
              <button
                onClick={() => onNavigate('analyzer')}
                className="text-xs text-brand-400 hover:text-brand-300 font-medium flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Upload New
              </button>
            </div>

            <div className="space-y-2.5">
              {/* Resume Card 1 */}
              <div className={`p-3.5 rounded-xl border transition-colors ${
                activeResume.id === 'sample-swe'
                  ? 'bg-gray-900/80 border-gray-700'
                  : 'bg-gray-900/40 border-gray-800 hover:border-gray-700'
              }`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-white">Alex Chen</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-gray-800 text-gray-300 border border-gray-700">
                        Senior Full Stack Engineer
                      </span>
                      {activeResume.id === 'sample-swe' && (
                        <span className="text-[10px] text-emerald-400 font-medium">
                          • Active
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      5+ yrs experience • Python, TypeScript, React, AWS, Docker • ATS: 94/100
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => {
                        onSelectResume(sampleSWEProfile);
                        onNavigate('studio');
                      }}
                      className="px-3 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-xs font-medium transition-colors"
                    >
                      Open in Studio
                    </button>
                    <button
                      onClick={() => {
                        onSelectResume(sampleSWEProfile);
                        onNavigate('analyzer');
                      }}
                      className="px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-medium transition-colors"
                    >
                      Audit
                    </button>
                  </div>
                </div>
              </div>

              {/* Resume Card 2 */}
              <div className={`p-3.5 rounded-xl border transition-colors ${
                activeResume.id === 'sample-grad'
                  ? 'bg-gray-900/80 border-gray-700'
                  : 'bg-gray-900/40 border-gray-800 hover:border-gray-700'
              }`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-white">Maya Patel</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-gray-800 text-gray-300 border border-gray-700">
                        Junior Software Engineer
                      </span>
                      {activeResume.id === 'sample-grad' && (
                        <span className="text-[10px] text-emerald-400 font-medium">
                          • Active
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      Fresh Graduate • Python, Java, React, SQL • ATS: 86/100
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => {
                        onSelectResume(sampleGradProfile);
                        onNavigate('studio');
                      }}
                      className="px-3 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-xs font-medium transition-colors"
                    >
                      Open in Studio
                    </button>
                    <button
                      onClick={() => {
                        onSelectResume(sampleGradProfile);
                        onNavigate('analyzer');
                      }}
                      className="px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-medium transition-colors"
                    >
                      Audit
                    </button>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Live Discovered Job Postings */}
          <div className="glass-panel p-5 rounded-xl border border-gray-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-semibold text-white">Target Job Postings</h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/10 border border-purple-500/20 text-purple-300">
                  Live Feed
                </span>
              </div>
              <button
                onClick={() => onNavigate('matcher')}
                className="text-xs font-medium text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
              >
                Search More Jobs <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {isLoadingLiveJobs ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[1, 2].map((i) => (
                  <div key={i} className="h-28 rounded-xl bg-gray-900/60 border border-gray-800 animate-pulse p-3.5" />
                ))}
              </div>
            ) : liveJobs.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {liveJobs.map((job) => (
                  <div key={job.id} className="p-3.5 rounded-xl bg-gray-900/40 border border-gray-800 hover:border-gray-700 transition-colors space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-xs font-semibold text-white line-clamp-1">{job.title}</span>
                      <span className="text-[10px] text-gray-400 shrink-0">{job.company}</span>
                    </div>
                    <p className="text-[11px] text-gray-400">{job.location || 'Remote'}</p>
                    <div className="pt-1 flex items-center justify-between">
                      <span className="text-[10px] text-gray-300 font-medium">
                        {job.salary_range && job.salary_range.trim() !== '' ? job.salary_range : 'Salary not specified'}
                      </span>
                      <button
                        onClick={() => onNavigate('matcher')}
                        className="text-xs font-medium text-brand-400 hover:underline flex items-center gap-1"
                      >
                        Run Match <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center rounded-xl bg-gray-900/30 border border-gray-800/80 space-y-2">
                <p className="text-xs text-gray-400">
                  No live jobs were found for this search. Try a different role, location or keyword.
                </p>
                <button
                  onClick={() => onNavigate('matcher')}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-brand-400 hover:underline"
                >
                  <span>Search Live Jobs</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>

        </div>

        {/* Right Column: AI Interview & Quick Tools (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          
          {/* AI Voice Interview Highlight Card */}
          <div className="glass-panel p-5 rounded-xl border border-gray-800 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">AI Voice Interview</h4>
                <p className="text-xs text-gray-400">Conversational resume builder</p>
              </div>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed">
              Talk naturally with Adil's AI to answer interview prompts. Achievements and metrics are automatically formatted into your resume live.
            </p>
            <button
              onClick={() => onNavigate('builder')}
              className="w-full py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs shadow-sm transition-colors flex items-center justify-center gap-2"
            >
              <span>Launch Voice Interview</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Quick Workspaces */}
          <div className="glass-panel p-4 rounded-xl border border-gray-800 space-y-2">
            <span className="text-xs font-medium text-gray-400 block px-1">Quick Tools</span>
            
            <button
              onClick={() => onNavigate('studio')}
              className="w-full p-2.5 rounded-lg bg-gray-900/50 hover:bg-gray-800/70 border border-gray-800 text-left flex items-center justify-between text-xs text-gray-300 hover:text-white transition-colors"
            >
              <span className="flex items-center gap-2">
                <Palette className="w-3.5 h-3.5 text-emerald-400" />
                <span>Resume Studio</span>
              </span>
              <ArrowRight className="w-3 h-3 text-gray-500" />
            </button>

            <button
              onClick={() => onNavigate('analyzer')}
              className="w-full p-2.5 rounded-lg bg-gray-900/50 hover:bg-gray-800/70 border border-gray-800 text-left flex items-center justify-between text-xs text-gray-300 hover:text-white transition-colors"
            >
              <span className="flex items-center gap-2">
                <FileSearch className="w-3.5 h-3.5 text-brand-400" />
                <span>CV Audit & Scores</span>
              </span>
              <ArrowRight className="w-3 h-3 text-gray-500" />
            </button>

            <button
              onClick={() => onNavigate('matcher')}
              className="w-full p-2.5 rounded-lg bg-gray-900/50 hover:bg-gray-800/70 border border-gray-800 text-left flex items-center justify-between text-xs text-gray-300 hover:text-white transition-colors"
            >
              <span className="flex items-center gap-2">
                <Target className="w-3.5 h-3.5 text-purple-400" />
                <span>Job Keyword Matcher</span>
              </span>
              <ArrowRight className="w-3 h-3 text-gray-500" />
            </button>
          </div>

        </div>

      </div>

    </div>
  );
};
