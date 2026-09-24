import React, { useState, useRef, useEffect } from 'react';
import { 
  Palette, 
  Download, 
  FileText, 
  Sparkles, 
  Plus, 
  Trash2, 
  Eye, 
  EyeOff, 
  Sliders, 
  Wand2, 
  Check, 
  RefreshCw, 
  Printer,
  ChevronDown,
  ChevronUp,
  ArrowUp,
  ArrowDown,
  ZoomIn,
  ZoomOut,
  Maximize2,
  FileCheck,
  Layers,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Type,
  Layout,
  Globe,
  Settings2,
  FolderKanban,
  GraduationCap,
  Briefcase,
  Code2,
  Award,
  Languages,
  Users,
  Bookmark,
  Columns,
  X
} from 'lucide-react';
import { ResumeProfile, TemplateCustomization } from '../types';
import { 
  apiService, 
  defaultTemplateCustomization, 
  sampleSWEProfile, 
  sampleGradProfile, 
  sampleSeniorExecProfile, 
  sampleAcademicProfile, 
  sampleCreativeProfile,
  downloadPdfFromElements 
} from '../services/api';
import { ResumeA4Document } from './resume/ResumeA4Document';

interface ResumeStudioViewProps {
  resume: ResumeProfile;
  setResume: React.Dispatch<React.SetStateAction<ResumeProfile>>;
  customization?: TemplateCustomization;
  setCustomization?: React.Dispatch<React.SetStateAction<TemplateCustomization>>;
  onNavigate?: (tab: any) => void;
}

const TEMPLATE_PRESETS = [
  { id: 'modern', name: 'Modern Universal', desc: 'Clean header bar & contemporary layout' },
  { id: 'minimal', name: 'Minimal Pure', desc: 'Airy typography & high whitespace' },
  { id: 'classic', name: 'Classic Serif', desc: 'Formal academic standard with serif fonts' },
  { id: 'professional', name: 'Corporate Standard', desc: 'Enterprise layout with left accent dividers' },
  { id: 'executive', name: 'Executive Suite', desc: 'Bold banner header & leadership focus' },
  { id: 'creative', name: 'Creative Portfolio', desc: 'Artistic typography & expressive layout' },
  { id: 'academic', name: 'Academic CV', desc: 'Formal research-oriented layout' },
] as const;

const ACCENT_COLORS = [
  { name: 'Electric Blue', hex: '#2563EB' },
  { name: 'Emerald Green', hex: '#059669' },
  { name: 'Royal Violet', hex: '#7C3AED' },
  { name: 'Crimson Red', hex: '#DC2626' },
  { name: 'Amber Gold', hex: '#D97706' },
  { name: 'Slate Obsidian', hex: '#0F172A' },
  { name: 'Sky Azure', hex: '#0284C7' },
  { name: 'Rosewood', hex: '#E11D48' },
];

const FONT_FAMILIES = [
  { name: 'Inter (Modern Sans)', value: 'Inter, sans-serif' },
  { name: 'Outfit (Geometric)', value: 'Outfit, sans-serif' },
  { name: 'Plus Jakarta Sans', value: '"Plus Jakarta Sans", sans-serif' },
  { name: 'Roboto (Neutral)', value: 'Roboto, sans-serif' },
  { name: 'Merriweather (Classic Serif)', value: 'Merriweather, serif' },
  { name: 'Playfair Display (Editorial)', value: '"Playfair Display", serif' },
];

const SECTION_METADATA: Record<string, { label: string; icon: React.FC<{ className?: string }> }> = {
  summary: { label: 'Summary / Objective', icon: FileText },
  experience: { label: 'Work Experience', icon: Briefcase },
  projects: { label: 'Key Projects', icon: FolderKanban },
  skills: { label: 'Skills & Tools', icon: Code2 },
  education: { label: 'Education', icon: GraduationCap },
  certifications: { label: 'Certifications', icon: Award },
  achievements: { label: 'Achievements & Awards', icon: Award },
  languages: { label: 'Languages', icon: Languages },
  extracurriculars: { label: 'Leadership & Activities', icon: Users },
};

export const ResumeStudioView: React.FC<ResumeStudioViewProps> = ({
  resume,
  setResume,
  customization: externalCustomization,
  setCustomization: externalSetCustomization,
  onNavigate
}) => {
  const [internalCustomization, setInternalCustomization] = useState<TemplateCustomization>(defaultTemplateCustomization);
  const customization = externalCustomization || internalCustomization;
  const setCustomization = externalSetCustomization || setInternalCustomization;

  // Active right sidebar tab: 'content' | 'design'
  const [rightPanelTab, setRightPanelTab] = useState<'content' | 'design'>('content');
  const [selectedSection, setSelectedSection] = useState<string>('contact');
  const [isExportingDocx, setIsExportingDocx] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isRewriting, setIsRewriting] = useState(false);
  const [activeRewriteKey, setActiveRewriteKey] = useState<string | null>(null);

  // Zoom management
  const [zoomLevel, setZoomLevel] = useState<number>(0.85);
  const [pageCount, setPageCount] = useState<number>(1);
  const [activePage, setActivePage] = useState<number>(1);
  const [isLeftPanelOpen, setIsLeftPanelOpen] = useState(true);
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(true);

  // Custom template saving state
  const [isSaveCustomModalOpen, setIsSaveCustomModalOpen] = useState(false);
  const [customTemplateSaveName, setCustomTemplateSaveName] = useState('');
  const [customTemplateSaveSuccess, setCustomTemplateSaveSuccess] = useState(false);
  const [isSavingCustomTemplate, setIsSavingCustomTemplate] = useState(false);

  const handleSaveAsCustomTemplate = async () => {
    if (!customTemplateSaveName.trim()) return;
    setIsSavingCustomTemplate(true);
    try {
      await apiService.saveCustomTemplate({
        name: customTemplateSaveName.trim(),
        description: `Customized based on ${customization.template_id}`,
        base_template_id: customization.template_id,
        category: 'Custom',
        font_family: customization.font_family,
        font_size: customization.font_size,
        accent_color: customization.accent_color,
        secondary_color: customization.secondary_color,
        spacing: customization.spacing,
        margins: customization.margins,
        column_layout: customization.column_layout,
        header_style: customization.header_style || 'standard',
        sidebar_position: customization.sidebar_position || 'none',
        section_titles: customization.section_titles || {}
      });
      setCustomTemplateSaveSuccess(true);
      setTimeout(() => {
        setCustomTemplateSaveSuccess(false);
        setIsSaveCustomModalOpen(false);
      }, 1500);
    } catch (err) {
      console.error('Failed to save custom template:', err);
    } finally {
      setIsSavingCustomTemplate(false);
    }
  };

  const pageRefs = useRef<(HTMLDivElement | null)[]>([]);
  const centerCanvasContainerRef = useRef<HTMLDivElement>(null);

  // Auto-fit to width on initial mount & handle responsive sizing
  useEffect(() => {
    // If laptop/smaller screen (< 1280px), collapse left panel initially to give maximum room to resume
    if (typeof window !== 'undefined' && window.innerWidth < 1280) {
      setIsLeftPanelOpen(false);
    }

    const updateFit = () => {
      if (centerCanvasContainerRef.current) {
        const containerWidth = centerCanvasContainerRef.current.clientWidth;
        if (containerWidth > 0) {
          const fitZoom = Math.min(1.0, Math.max(0.45, (containerWidth - 56) / 820));
          setZoomLevel(Number(fitZoom.toFixed(2)));
        }
      }
    };

    const timer = setTimeout(updateFit, 60);
    window.addEventListener('resize', updateFit);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updateFit);
    };
  }, []);

  // Zoom handlers
  const handleZoomIn = () => setZoomLevel(prev => Math.min(1.5, Number((prev + 0.1).toFixed(2))));
  const handleZoomOut = () => setZoomLevel(prev => Math.max(0.4, Number((prev - 0.1).toFixed(2))));
  const handleZoomReset = () => setZoomLevel(1.0);
  
  const handleFitToWidth = () => {
    if (centerCanvasContainerRef.current) {
      const containerWidth = centerCanvasContainerRef.current.clientWidth;
      const fitZoom = Math.min(1.25, Math.max(0.45, (containerWidth - 56) / 820));
      setZoomLevel(Number(fitZoom.toFixed(2)));
    }
  };

  const handleFitToPage = () => {
    if (centerCanvasContainerRef.current) {
      const containerHeight = centerCanvasContainerRef.current.clientHeight;
      const fitZoom = Math.min(1.0, Math.max(0.45, (containerHeight - 70) / 1150));
      setZoomLevel(Number(fitZoom.toFixed(2)));
    }
  };

  // Scroll to page
  const scrollToPage = (pageIdx: number) => {
    setActivePage(pageIdx + 1);
    const targetEl = pageRefs.current[pageIdx];
    if (targetEl) {
      targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Export Direct PDF using html2canvas & jspdf
  const handleDirectDownloadPDF = async () => {
    const validPages = pageRefs.current.filter((el): el is HTMLDivElement => el !== null);
    if (validPages.length === 0) {
      window.print();
      return;
    }
    setIsExportingPdf(true);
    try {
      const filename = `${(resume.contact_info.full_name || 'Resume').replace(/\s+/g, '_')}_CV.pdf`;
      await downloadPdfFromElements(validPages, filename);
    } catch (err) {
      console.error('Failed to generate direct PDF, falling back to window.print():', err);
      window.print();
    } finally {
      setIsExportingPdf(false);
    }
  };

  // Print via browser print dialog
  const handlePrint = () => {
    window.print();
  };

  // Export DOCX via backend
  const handleExportDocx = async () => {
    setIsExportingDocx(true);
    try {
      const blob = await apiService.exportDocx(resume, customization);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${(resume.contact_info.full_name || 'Resume').replace(/\s+/g, '_')}_CV.docx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error(err);
      alert('Failed to export DOCX. Ensure backend is running.');
    } finally {
      setIsExportingDocx(false);
    }
  };

  // Load sample test profiles for Requirement 12
  const handleLoadTestProfile = (profileType: string) => {
    switch (profileType) {
      case 'swe':
        setResume(sampleSWEProfile);
        break;
      case 'grad':
        setResume(sampleGradProfile);
        break;
      case 'exec':
        setResume(sampleSeniorExecProfile);
        break;
      case 'academic':
        setResume(sampleAcademicProfile);
        break;
      case 'creative':
        setResume(sampleCreativeProfile);
        break;
      default:
        break;
    }
  };

  // AI Bullet Rewriter
  const handleRewrite = async (text: string, mode: string, path: string) => {
    setIsRewriting(true);
    setActiveRewriteKey(path);
    try {
      const res = await apiService.rewriteBullet(text, mode);
      applyBulletChange(path, res.improved_text);
    } catch (err) {
      console.error(err);
    } finally {
      setIsRewriting(false);
      setActiveRewriteKey(null);
    }
  };

  const applyBulletChange = (path: string, newText: string) => {
    setResume(prev => {
      const updated = JSON.parse(JSON.stringify(prev)) as ResumeProfile;
      const [type, idxStr, highlightIdxStr] = path.split('.');
      const idx = parseInt(idxStr);
      const hIdx = parseInt(highlightIdxStr);

      if (type === 'exp' && updated.work_experience[idx]) {
        updated.work_experience[idx].highlights[hIdx] = newText;
      } else if (type === 'proj' && updated.projects[idx]) {
        updated.projects[idx].highlights[hIdx] = newText;
      }
      return updated;
    });
  };

  // Add work experience
  const addExperience = () => {
    setResume(prev => ({
      ...prev,
      work_experience: [
        {
          company: 'Tech Enterprise Co.',
          position: 'Senior Software Engineer',
          location: 'San Francisco, CA',
          start_date: '2023',
          end_date: 'Present',
          current: true,
          highlights: ['Engineered key platform microservices, improving throughput by 35%.']
        },
        ...prev.work_experience
      ]
    }));
    setSelectedSection('experience');
  };

  // Add project
  const addProject = () => {
    setResume(prev => ({
      ...prev,
      projects: [
        {
          title: 'NextGen Cloud Platform',
          description: 'High performance distributed event engine built with modern cloud architecture.',
          technologies: ['React', 'TypeScript', 'FastAPI', 'Docker'],
          link: 'https://github.com/project',
          highlights: ['Architected scalable event queues delivering sub-50ms latency.']
        },
        ...prev.projects
      ]
    }));
    setSelectedSection('projects');
  };

  // Section reordering
  const moveSection = (idx: number, direction: 'up' | 'down') => {
    const currentOrder = [...(customization.section_order || [
      'summary', 'experience', 'projects', 'skills', 'education', 'certifications', 'achievements', 'languages', 'extracurriculars'
    ])];
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= currentOrder.length) return;

    const temp = currentOrder[idx];
    currentOrder[idx] = currentOrder[targetIdx];
    currentOrder[targetIdx] = temp;

    setCustomization(prev => ({ ...prev, section_order: currentOrder }));
  };

  // Toggle section visibility
  const toggleSectionVisibility = (secKey: string) => {
    setCustomization(prev => ({
      ...prev,
      section_visibility: {
        ...prev.section_visibility,
        [secKey]: prev.section_visibility[secKey] === false ? true : false
      }
    }));
  };

  const currentSectionOrder = customization.section_order || [
    'summary', 'experience', 'projects', 'skills', 'education', 'certifications', 'achievements', 'languages', 'extracurriculars'
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] overflow-hidden bg-[#070B14] text-gray-100">
      
      {/* ================= TOP STUDIO CONTROL BAR ================= */}
      <header className="h-14 border-b border-gray-800/80 bg-gray-950/80 backdrop-blur-md px-4 flex items-center justify-between gap-3 shrink-0 z-30 no-print">
        
        {/* Left: Back & Document Metadata */}
        <div className="flex items-center gap-3 min-w-0">
          {onNavigate && (
            <button
              onClick={() => onNavigate('dashboard')}
              className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800/80 transition-colors"
              title="Back to Dashboard"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}

          <div className="flex items-center gap-2 min-w-0">
            <input
              type="text"
              value={resume.contact_info.full_name ? `${resume.contact_info.full_name}'s Resume` : 'Untitled Resume'}
              onChange={(e) => {
                const val = e.target.value.replace(/'s Resume$/, '');
                setResume(p => ({ ...p, contact_info: { ...p.contact_info, full_name: val } }));
              }}
              className="bg-transparent text-sm font-semibold text-white tracking-tight border-b border-transparent hover:border-gray-700 focus:border-brand-500 focus:outline-none px-1 py-0.5 truncate max-w-[200px] sm:max-w-[280px]"
            />
            
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10.5px] font-medium bg-emerald-950/80 text-emerald-400 border border-emerald-800/50">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Auto-saved
            </span>
          </div>
        </div>

        {/* Center: Test Profiles & Zoom Controls */}
        <div className="hidden md:flex items-center gap-2">
          {/* Test Profile Selector (Requirement 12) */}
          <div className="flex items-center gap-1.5 bg-gray-900/90 border border-gray-800 rounded-lg px-2.5 py-1 text-xs">
            <span className="text-gray-500 font-medium">Test Profiles:</span>
            <select
              onChange={(e) => handleLoadTestProfile(e.target.value)}
              defaultValue="swe"
              className="bg-transparent text-gray-200 text-xs font-medium focus:outline-none cursor-pointer"
            >
              <option value="swe" className="bg-gray-900 text-white">Alex Chen (1-Page SWE)</option>
              <option value="grad" className="bg-gray-900 text-white">Sophia Patel (Graduate 1-Page)</option>
              <option value="exec" className="bg-gray-900 text-white">Dr. Marcus Vance (3-Page Executive)</option>
              <option value="academic" className="bg-gray-900 text-white">Dr. Elena Rostova (Academic CV)</option>
              <option value="creative" className="bg-gray-900 text-white">Julian Rivera (Creative Design)</option>
            </select>
          </div>

          {/* Zoom Toolbar (Requirement 4) */}
          <div className="flex items-center gap-1 bg-gray-900/90 border border-gray-800 rounded-lg p-0.5 text-xs text-gray-300">
            <button
              onClick={handleZoomOut}
              className="p-1.5 rounded hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="px-1.5 font-mono text-[11px] font-medium min-w-[42px] text-center">
              {Math.round(zoomLevel * 100)}%
            </span>
            <button
              onClick={handleZoomIn}
              className="p-1.5 rounded hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <div className="w-[1px] h-3.5 bg-gray-800 mx-0.5" />
            <button
              onClick={handleFitToWidth}
              className="px-2 py-1 rounded hover:bg-gray-800 text-[11px] text-gray-300 hover:text-white transition-colors"
              title="Fit to Width"
            >
              Fit Width
            </button>
            <button
              onClick={handleFitToPage}
              className="px-2 py-1 rounded hover:bg-gray-800 text-[11px] text-gray-300 hover:text-white transition-colors"
              title="Fit to Page"
            >
              Fit Page
            </button>
            <button
              onClick={handleZoomReset}
              className="px-2 py-1 rounded hover:bg-gray-800 text-[11px] text-gray-300 hover:text-white transition-colors"
              title="Reset 100%"
            >
              100%
            </button>
          </div>

          {/* Panel Visibility & Focus View Toggles */}
          <div className="flex items-center gap-1 bg-gray-900/90 border border-gray-800 rounded-lg p-0.5 text-xs text-gray-300">
            <button
              onClick={() => setIsLeftPanelOpen(p => !p)}
              className={`px-2 py-1 rounded text-xs transition-colors flex items-center gap-1 ${
                isLeftPanelOpen ? 'bg-brand-600/30 text-brand-300 font-semibold border border-brand-500/40' : 'text-gray-400 hover:text-white'
              }`}
              title="Toggle Outline Panel"
            >
              <Layers className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">Outline</span>
            </button>
            <button
              onClick={() => setIsRightPanelOpen(p => !p)}
              className={`px-2 py-1 rounded text-xs transition-colors flex items-center gap-1 ${
                isRightPanelOpen ? 'bg-brand-600/30 text-brand-300 font-semibold border border-brand-500/40' : 'text-gray-400 hover:text-white'
              }`}
              title="Toggle Editor Panel"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">Editor</span>
            </button>
            <button
              onClick={() => {
                if (isLeftPanelOpen || isRightPanelOpen) {
                  setIsLeftPanelOpen(false);
                  setIsRightPanelOpen(false);
                } else {
                  setIsLeftPanelOpen(true);
                  setIsRightPanelOpen(true);
                }
              }}
              className={`p-1.5 rounded text-xs transition-colors ${
                !isLeftPanelOpen && !isRightPanelOpen ? 'bg-brand-600 text-white shadow-sm' : 'text-gray-400 hover:text-white'
              }`}
              title={!isLeftPanelOpen && !isRightPanelOpen ? 'Exit Focus Mode' : 'Focus Mode (Full Canvas)'}
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Right: Actions Export / Download */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleDirectDownloadPDF}
            disabled={isExportingPdf}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-xs font-semibold text-white shadow-sm transition-all active:scale-95 disabled:opacity-50"
            title="Download pixel-perfect multi-page PDF"
          >
            {isExportingPdf ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Download className="w-3.5 h-3.5" />
            )}
            <span>Download PDF</span>
          </button>

          <button
            onClick={handlePrint}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-900 hover:bg-gray-800 border border-gray-800 text-xs font-medium text-gray-200 transition-colors"
            title="Browser Print / Save as PDF"
          >
            <Printer className="w-3.5 h-3.5 text-gray-400" />
            <span>Print</span>
          </button>

          <button
            onClick={handleExportDocx}
            disabled={isExportingDocx}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-900 hover:bg-gray-800 border border-gray-800 text-xs font-medium text-gray-200 transition-colors disabled:opacity-50"
            title="Export ATS-compliant Microsoft Word (.docx)"
          >
            {isExportingDocx ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <FileText className="w-3.5 h-3.5 text-blue-400" />
            )}
            <span className="hidden sm:inline">Export Word</span>
          </button>
        </div>
      </header>


      {/* ================= 3-PANEL STUDIO WORKSPACE ================= */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* ---------------- 1. LEFT PANEL: SECTIONS & OUTLINE (240px) ---------------- */}
        <aside 
          className={`shrink-0 border-r border-gray-800/80 bg-[#090D16] flex flex-col transition-all duration-200 z-20 no-print ${
            isLeftPanelOpen ? 'w-64 xl:w-72' : 'w-0 overflow-hidden'
          }`}
        >
          {/* Header */}
          <div className="p-3 border-b border-gray-800/80 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-brand-400" />
              Document Outline
            </span>
            <span className="text-[10.5px] font-mono px-1.5 py-0.5 rounded bg-gray-800 text-gray-400">
              {pageCount} {pageCount === 1 ? 'Page' : 'Pages'}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-4">
            {/* Pages Navigator */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                Pages Navigation
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                {Array.from({ length: pageCount }).map((_, pIdx) => {
                  const pNum = pIdx + 1;
                  return (
                    <button
                      key={pIdx}
                      onClick={() => scrollToPage(pIdx)}
                      className={`p-2 rounded-lg border text-xs font-medium text-left flex items-center justify-between transition-all ${
                        activePage === pNum 
                          ? 'bg-brand-600/20 border-brand-500/60 text-white font-semibold' 
                          : 'bg-gray-900/60 border-gray-800 text-gray-400 hover:text-gray-200'
                      }`}
                    >
                      <span>Page {pNum}</span>
                      <span className="text-[10px] text-gray-500 font-mono">A4</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Section Ordering & Visibility */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                  Resume Sections
                </span>
                <span className="text-[10px] text-gray-500">Drag / Reorder</span>
              </div>

              {/* Contact Info (Always on top) */}
              <div 
                onClick={() => { setSelectedSection('contact'); setRightPanelTab('content'); }}
                className={`p-2 rounded-lg border flex items-center justify-between text-xs cursor-pointer transition-all ${
                  selectedSection === 'contact' ? 'bg-brand-600/20 border-brand-500/60 text-white' : 'bg-gray-900/40 border-gray-800/80 text-gray-300 hover:bg-gray-900'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <Globe className="w-3.5 h-3.5 text-brand-400" />
                  <span className="font-medium truncate">Contact & Header</span>
                </div>
                <span className="text-[10px] text-gray-500">Fixed</span>
              </div>

              {/* Dynamic Reorderable Sections */}
              <div className="space-y-1">
                {currentSectionOrder.map((secKey, idx) => {
                  const meta = SECTION_METADATA[secKey] || { label: secKey, icon: FileText };
                  const Icon = meta.icon;
                  const isVisible = customization.section_visibility[secKey] !== false;

                  return (
                    <div
                      key={secKey}
                      onClick={() => { setSelectedSection(secKey); setRightPanelTab('content'); }}
                      className={`p-1.5 rounded-lg border flex items-center justify-between text-xs cursor-pointer transition-all ${
                        selectedSection === secKey 
                          ? 'bg-brand-600/20 border-brand-500/60 text-white' 
                          : isVisible 
                            ? 'bg-gray-900/40 border-gray-800/80 text-gray-300 hover:bg-gray-900' 
                            : 'bg-gray-900/20 border-gray-800/40 text-gray-600'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <Icon className="w-3.5 h-3.5 text-gray-400" />
                        <span className="font-medium truncate">{meta.label}</span>
                      </div>

                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        {/* Move Up */}
                        <button
                          onClick={() => moveSection(idx, 'up')}
                          disabled={idx === 0}
                          className="p-1 text-gray-500 hover:text-white disabled:opacity-20"
                          title="Move Up"
                        >
                          <ArrowUp className="w-3 h-3" />
                        </button>
                        {/* Move Down */}
                        <button
                          onClick={() => moveSection(idx, 'down')}
                          disabled={idx === currentSectionOrder.length - 1}
                          className="p-1 text-gray-500 hover:text-white disabled:opacity-20"
                          title="Move Down"
                        >
                          <ArrowDown className="w-3 h-3" />
                        </button>
                        {/* Visibility Toggle */}
                        <button
                          onClick={() => toggleSectionVisibility(secKey)}
                          className="p-1 text-gray-500 hover:text-brand-400"
                          title={isVisible ? 'Hide Section' : 'Show Section'}
                        >
                          {isVisible ? <Eye className="w-3 h-3 text-brand-400" /> : <EyeOff className="w-3 h-3" />}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quick Add Section Button */}
            <div className="pt-2">
              <div className="relative group">
                <button
                  onClick={addExperience}
                  className="w-full py-1.5 rounded-lg border border-dashed border-gray-700 hover:border-brand-500/60 text-gray-400 hover:text-brand-400 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Experience Entry</span>
                </button>
              </div>
              <button
                onClick={addProject}
                className="w-full mt-1.5 py-1.5 rounded-lg border border-dashed border-gray-700 hover:border-brand-500/60 text-gray-400 hover:text-brand-400 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Key Project</span>
              </button>
            </div>
          </div>
        </aside>

        {/* Toggle Left Sidebar Button */}
        <button
          onClick={() => setIsLeftPanelOpen(p => !p)}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-20 bg-gray-900 border border-gray-800 text-gray-400 hover:text-white p-1 rounded-r-md shadow-md no-print"
          title={isLeftPanelOpen ? 'Collapse Outline' : 'Expand Outline'}
        >
          {isLeftPanelOpen ? <ChevronLeft className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
        </button>


        {/* ---------------- 2. CENTER STAGE: LARGE REALISTIC A4 CV DESK ---------------- */}
        <main 
          ref={centerCanvasContainerRef}
          className="flex-1 overflow-auto a4-desk-bg p-4 sm:p-8 flex flex-col items-center select-text relative"
        >
          {/* Scaled Canvas Sizer - perfectly allocates scrollable bounds and eliminates overflow clipping */}
          <div 
            className="relative flex flex-col items-center shrink-0 my-auto transition-all duration-150"
            style={{ 
              width: `${Math.round(794 * zoomLevel)}px`,
              minHeight: `${Math.round(pageCount * 1123 * zoomLevel + 40)}px`,
            }}
          >
            <div 
              style={{ 
                width: '794px',
                transform: `scale(${zoomLevel})`,
                transformOrigin: 'top center'
              }}
            >
              {/* The A4 Multi-Page Render Engine */}
              <ResumeA4Document
                profile={resume}
                customization={customization}
                onPageCountChange={(count) => setPageCount(count)}
                pageRefs={pageRefs}
              />
            </div>
          </div>
        </main>


        {/* Toggle Right Sidebar Button */}
        <button
          onClick={() => setIsRightPanelOpen(p => !p)}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-20 bg-gray-900 border border-gray-800 text-gray-400 hover:text-white p-1 rounded-l-md shadow-md no-print"
          title={isRightPanelOpen ? 'Collapse Controls' : 'Expand Controls'}
        >
          {isRightPanelOpen ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
        </button>


        {/* ---------------- 3. RIGHT PANEL: EDITING & TYPOGRAPHY (340px) ---------------- */}
        <aside 
          className={`shrink-0 border-l border-gray-800/80 bg-[#090D16] flex flex-col transition-all duration-200 z-20 no-print ${
            isRightPanelOpen ? 'w-80 xl:w-[380px]' : 'w-0 overflow-hidden'
          }`}
        >
          {/* Tabs: Content vs Design */}
          <div className="p-2 border-b border-gray-800/80 flex items-center gap-1.5 bg-gray-950/60">
            <button
              onClick={() => setRightPanelTab('content')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                rightPanelTab === 'content'
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'text-gray-400 hover:text-white hover:bg-gray-900'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Edit Content</span>
            </button>
            <button
              onClick={() => setRightPanelTab('design')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                rightPanelTab === 'design'
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'text-gray-400 hover:text-white hover:bg-gray-900'
              }`}
            >
              <Palette className="w-3.5 h-3.5" />
              <span>Design & Style</span>
            </button>
          </div>

          {/* Right Panel Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            
            {/* TAB 1: EDIT CONTENT */}
            {rightPanelTab === 'content' && (
              <div className="space-y-4">
                
                {/* Section Selector Quick Dropdown */}
                <div className="space-y-1">
                  <label className="text-[10.5px] font-bold text-gray-400 uppercase tracking-wider">
                    Currently Editing
                  </label>
                  <select
                    value={selectedSection}
                    onChange={(e) => setSelectedSection(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-brand-500"
                  >
                    <option value="contact">Contact & Personal Info</option>
                    <option value="summary">Professional Summary</option>
                    <option value="experience">Work Experience ({resume.work_experience.length})</option>
                    <option value="projects">Key Projects ({resume.projects.length})</option>
                    <option value="skills">Skills & Expertise</option>
                    <option value="education">Education ({resume.education.length})</option>
                    <option value="certifications">Certifications ({resume.certifications.length})</option>
                    <option value="languages">Languages</option>
                    <option value="achievements">Achievements</option>
                    <option value="extracurriculars">Extracurriculars</option>
                  </select>
                </div>

                {/* 1. Contact Info Form */}
                {selectedSection === 'contact' && (
                  <div className="space-y-2.5 p-3 rounded-xl bg-gray-900/50 border border-gray-800">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-brand-400" />
                      Contact & Header Information
                    </span>
                    <div className="space-y-2 text-xs">
                      <div>
                        <label className="text-[10px] text-gray-400">Full Name</label>
                        <input
                          type="text"
                          value={resume.contact_info.full_name}
                          onChange={(e) => setResume(p => ({ ...p, contact_info: { ...p.contact_info, full_name: e.target.value } }))}
                          className="w-full bg-gray-900 border border-gray-800 rounded-lg p-2 text-white text-xs mt-0.5"
                          placeholder="Full Name"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-gray-400">Professional Headline</label>
                        <input
                          type="text"
                          value={resume.contact_info.title}
                          onChange={(e) => setResume(p => ({ ...p, contact_info: { ...p.contact_info, title: e.target.value } }))}
                          className="w-full bg-gray-900 border border-gray-800 rounded-lg p-2 text-white text-xs mt-0.5"
                          placeholder="e.g. Senior Full Stack Engineer"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] text-gray-400">Email</label>
                          <input
                            type="email"
                            value={resume.contact_info.email}
                            onChange={(e) => setResume(p => ({ ...p, contact_info: { ...p.contact_info, email: e.target.value } }))}
                            className="w-full bg-gray-900 border border-gray-800 rounded-lg p-2 text-white text-xs mt-0.5"
                            placeholder="Email"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-gray-400">Phone</label>
                          <input
                            type="text"
                            value={resume.contact_info.phone}
                            onChange={(e) => setResume(p => ({ ...p, contact_info: { ...p.contact_info, phone: e.target.value } }))}
                            className="w-full bg-gray-900 border border-gray-800 rounded-lg p-2 text-white text-xs mt-0.5"
                            placeholder="Phone"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] text-gray-400">Location</label>
                        <input
                          type="text"
                          value={resume.contact_info.location}
                          onChange={(e) => setResume(p => ({ ...p, contact_info: { ...p.contact_info, location: e.target.value } }))}
                          className="w-full bg-gray-900 border border-gray-800 rounded-lg p-2 text-white text-xs mt-0.5"
                          placeholder="City, State / Country"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-gray-400">LinkedIn URL</label>
                        <input
                          type="text"
                          value={resume.contact_info.linkedin}
                          onChange={(e) => setResume(p => ({ ...p, contact_info: { ...p.contact_info, linkedin: e.target.value } }))}
                          className="w-full bg-gray-900 border border-gray-800 rounded-lg p-2 text-white text-xs mt-0.5"
                          placeholder="linkedin.com/in/username"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-gray-400">GitHub URL</label>
                        <input
                          type="text"
                          value={resume.contact_info.github || ''}
                          onChange={(e) => setResume(p => ({ ...p, contact_info: { ...p.contact_info, github: e.target.value } }))}
                          className="w-full bg-gray-900 border border-gray-800 rounded-lg p-2 text-white text-xs mt-0.5"
                          placeholder="github.com/username"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-gray-400">Portfolio / Website</label>
                        <input
                          type="text"
                          value={resume.contact_info.portfolio || ''}
                          onChange={(e) => setResume(p => ({ ...p, contact_info: { ...p.contact_info, portfolio: e.target.value } }))}
                          className="w-full bg-gray-900 border border-gray-800 rounded-lg p-2 text-white text-xs mt-0.5"
                          placeholder="https://portfolio.dev"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. Professional Summary Form */}
                {selectedSection === 'summary' && (
                  <div className="space-y-2 p-3 rounded-xl bg-gray-900/50 border border-gray-800">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-brand-400" />
                      Professional Summary
                    </span>
                    <textarea
                      rows={5}
                      value={resume.summary}
                      onChange={(e) => setResume(p => ({ ...p, summary: e.target.value }))}
                      className="w-full bg-gray-900 border border-gray-800 rounded-lg p-2.5 text-xs text-gray-200 focus:outline-none focus:border-brand-500 leading-relaxed"
                      placeholder="Write a compelling executive summary highlighting your top competencies and career impact..."
                    />
                  </div>
                )}

                {/* 3. Work Experience Form */}
                {selectedSection === 'experience' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">Work Experience</span>
                      <button
                        onClick={addExperience}
                        className="text-xs text-brand-400 hover:text-brand-300 font-semibold flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add Role
                      </button>
                    </div>

                    {resume.work_experience.map((exp, expIdx) => (
                      <div key={expIdx} className="p-3 rounded-xl bg-gray-900/50 border border-gray-800 space-y-2.5">
                        <div className="flex justify-between items-center">
                          <span className="text-[11px] font-bold text-gray-300">Role #{expIdx + 1}</span>
                          <button
                            onClick={() => {
                              setResume(p => {
                                const u = { ...p };
                                u.work_experience.splice(expIdx, 1);
                                return u;
                              });
                            }}
                            className="text-red-400 hover:text-red-300 p-1"
                            title="Remove Role"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="space-y-2 text-xs">
                          <div>
                            <label className="text-[10px] text-gray-400">Position Title</label>
                            <input
                              type="text"
                              value={exp.position}
                              onChange={(e) => {
                                const val = e.target.value;
                                setResume(p => {
                                  const u = { ...p };
                                  u.work_experience[expIdx].position = val;
                                  return u;
                                });
                              }}
                              className="w-full bg-gray-900 border border-gray-800 rounded-lg p-1.5 text-white text-xs mt-0.5"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-[10px] text-gray-400">Company</label>
                              <input
                                type="text"
                                value={exp.company}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setResume(p => {
                                    const u = { ...p };
                                    u.work_experience[expIdx].company = val;
                                    return u;
                                  });
                                }}
                                className="w-full bg-gray-900 border border-gray-800 rounded-lg p-1.5 text-white text-xs mt-0.5"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] text-gray-400">Location</label>
                              <input
                                type="text"
                                value={exp.location || ''}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setResume(p => {
                                    const u = { ...p };
                                    u.work_experience[expIdx].location = val;
                                    return u;
                                  });
                                }}
                                className="w-full bg-gray-900 border border-gray-800 rounded-lg p-1.5 text-white text-xs mt-0.5"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-[10px] text-gray-400">Start Date</label>
                              <input
                                type="text"
                                value={exp.start_date}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setResume(p => {
                                    const u = { ...p };
                                    u.work_experience[expIdx].start_date = val;
                                    return u;
                                  });
                                }}
                                className="w-full bg-gray-900 border border-gray-800 rounded-lg p-1.5 text-white text-xs mt-0.5"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] text-gray-400">End Date</label>
                              <input
                                type="text"
                                value={exp.end_date}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setResume(p => {
                                    const u = { ...p };
                                    u.work_experience[expIdx].end_date = val;
                                    return u;
                                  });
                                }}
                                className="w-full bg-gray-900 border border-gray-800 rounded-lg p-1.5 text-white text-xs mt-0.5"
                              />
                            </div>
                          </div>

                          {/* Bullet Points with AI Assistant */}
                          <div className="space-y-2 pt-1 border-t border-gray-800/80">
                            <span className="text-[11px] font-semibold text-gray-400">Bullet Points & AI Polish:</span>
                            {exp.highlights.map((bullet, hIdx) => {
                              const pathKey = `exp.${expIdx}.${hIdx}`;
                              const isThisRewriting = isRewriting && activeRewriteKey === pathKey;

                              return (
                                <div key={hIdx} className="space-y-1 bg-gray-950/60 p-2 rounded-lg border border-gray-800/60">
                                  <textarea
                                    rows={2}
                                    value={bullet}
                                    onChange={(e) => applyBulletChange(pathKey, e.target.value)}
                                    className="w-full bg-gray-900 border border-gray-800 rounded p-1.5 text-xs text-gray-200 focus:outline-none focus:border-brand-500"
                                  />

                                  {/* AI Polish Toolbar */}
                                  <div className="flex flex-wrap items-center gap-1 text-[10px]">
                                    <button
                                      onClick={() => handleRewrite(bullet, 'impact', pathKey)}
                                      disabled={isRewriting}
                                      className="px-1.5 py-0.5 rounded bg-gray-900 hover:bg-gray-800 text-gray-300 hover:text-white border border-gray-800 transition-colors"
                                    >
                                      STAR Impact
                                    </button>
                                    <button
                                      onClick={() => handleRewrite(bullet, 'concise', pathKey)}
                                      disabled={isRewriting}
                                      className="px-1.5 py-0.5 rounded bg-gray-900 hover:bg-gray-800 text-gray-300 hover:text-white border border-gray-800 transition-colors"
                                    >
                                      Make Concise
                                    </button>
                                    <button
                                      onClick={() => handleRewrite(bullet, 'technical', pathKey)}
                                      disabled={isRewriting}
                                      className="px-1.5 py-0.5 rounded bg-gray-900 hover:bg-gray-800 text-gray-300 hover:text-white border border-gray-800 transition-colors"
                                    >
                                      Technical
                                    </button>
                                    <button
                                      onClick={() => handleRewrite(bullet, 'grammar', pathKey)}
                                      disabled={isRewriting}
                                      className="px-1.5 py-0.5 rounded bg-gray-900 hover:bg-gray-800 text-gray-300 hover:text-white border border-gray-800 transition-colors"
                                    >
                                      Fix Grammar
                                    </button>
                                    {isThisRewriting && (
                                      <RefreshCw className="w-3 h-3 text-brand-400 animate-spin ml-1" />
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* 4. Key Projects Form */}
                {selectedSection === 'projects' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">Key Projects</span>
                      <button
                        onClick={addProject}
                        className="text-xs text-brand-400 hover:text-brand-300 font-semibold flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add Project
                      </button>
                    </div>

                    {resume.projects.map((proj, pIdx) => (
                      <div key={pIdx} className="p-3 rounded-xl bg-gray-900/50 border border-gray-800 space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-[11px] font-bold text-gray-300">Project #{pIdx + 1}</span>
                          <button
                            onClick={() => {
                              setResume(p => {
                                const u = { ...p };
                                u.projects.splice(pIdx, 1);
                                return u;
                              });
                            }}
                            className="text-red-400 hover:text-red-300 p-1"
                            title="Remove Project"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="space-y-2 text-xs">
                          <div>
                            <label className="text-[10px] text-gray-400">Project Title</label>
                            <input
                              type="text"
                              value={proj.title}
                              onChange={(e) => {
                                const val = e.target.value;
                                setResume(p => {
                                  const u = { ...p };
                                  u.projects[pIdx].title = val;
                                  return u;
                                });
                              }}
                              className="w-full bg-gray-900 border border-gray-800 rounded-lg p-1.5 text-white text-xs mt-0.5"
                            />
                          </div>

                          <div>
                            <label className="text-[10px] text-gray-400">Project Link / Repo</label>
                            <input
                              type="text"
                              value={proj.link || ''}
                              onChange={(e) => {
                                const val = e.target.value;
                                setResume(p => {
                                  const u = { ...p };
                                  u.projects[pIdx].link = val;
                                  return u;
                                });
                              }}
                              className="w-full bg-gray-900 border border-gray-800 rounded-lg p-1.5 text-white text-xs mt-0.5"
                              placeholder="https://github.com/..."
                            />
                          </div>

                          <div>
                            <label className="text-[10px] text-gray-400">Technologies (comma separated)</label>
                            <input
                              type="text"
                              value={proj.technologies?.join(', ') || ''}
                              onChange={(e) => {
                                const val = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
                                setResume(p => {
                                  const u = { ...p };
                                  u.projects[pIdx].technologies = val;
                                  return u;
                                });
                              }}
                              className="w-full bg-gray-900 border border-gray-800 rounded-lg p-1.5 text-white text-xs mt-0.5"
                              placeholder="React, TypeScript, FastAPI"
                            />
                          </div>

                          <div>
                            <label className="text-[10px] text-gray-400">Description</label>
                            <textarea
                              rows={2}
                              value={proj.description}
                              onChange={(e) => {
                                const val = e.target.value;
                                setResume(p => {
                                  const u = { ...p };
                                  u.projects[pIdx].description = val;
                                  return u;
                                });
                              }}
                              className="w-full bg-gray-900 border border-gray-800 rounded-lg p-1.5 text-white text-xs mt-0.5"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* 5. Skills Form */}
                {selectedSection === 'skills' && (
                  <div className="space-y-3 p-3 rounded-xl bg-gray-900/50 border border-gray-800">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Code2 className="w-3.5 h-3.5 text-brand-400" />
                      Skills & Technical Domains
                    </span>
                    <div className="space-y-2 text-xs">
                      <div>
                        <label className="text-[10px] text-gray-400">Languages & Core (comma separated)</label>
                        <input
                          type="text"
                          value={resume.skills.technical_skills.join(', ')}
                          onChange={(e) => {
                            const val = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
                            setResume(p => ({ ...p, skills: { ...p.skills, technical_skills: val } }));
                          }}
                          className="w-full bg-gray-900 border border-gray-800 rounded-lg p-1.5 text-white text-xs mt-0.5"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-gray-400">Frameworks & Libraries</label>
                        <input
                          type="text"
                          value={resume.skills.frameworks_libraries.join(', ')}
                          onChange={(e) => {
                            const val = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
                            setResume(p => ({ ...p, skills: { ...p.skills, frameworks_libraries: val } }));
                          }}
                          className="w-full bg-gray-900 border border-gray-800 rounded-lg p-1.5 text-white text-xs mt-0.5"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-gray-400">Cloud & Developer Tools</label>
                        <input
                          type="text"
                          value={resume.skills.developer_tools.join(', ')}
                          onChange={(e) => {
                            const val = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
                            setResume(p => ({ ...p, skills: { ...p.skills, developer_tools: val } }));
                          }}
                          className="w-full bg-gray-900 border border-gray-800 rounded-lg p-1.5 text-white text-xs mt-0.5"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-gray-400">Soft Skills & Leadership</label>
                        <input
                          type="text"
                          value={resume.skills.soft_skills.join(', ')}
                          onChange={(e) => {
                            const val = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
                            setResume(p => ({ ...p, skills: { ...p.skills, soft_skills: val } }));
                          }}
                          className="w-full bg-gray-900 border border-gray-800 rounded-lg p-1.5 text-white text-xs mt-0.5"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* 6. Education Form */}
                {selectedSection === 'education' && (
                  <div className="space-y-3">
                    <span className="text-xs font-bold text-white">Education</span>
                    {resume.education.map((edu, eduIdx) => (
                      <div key={eduIdx} className="p-3 rounded-xl bg-gray-900/50 border border-gray-800 space-y-2 text-xs">
                        <div>
                          <label className="text-[10px] text-gray-400">Degree & Major</label>
                          <input
                            type="text"
                            value={edu.degree}
                            onChange={(e) => {
                              const val = e.target.value;
                              setResume(p => {
                                const u = { ...p };
                                u.education[eduIdx].degree = val;
                                return u;
                              });
                            }}
                            className="w-full bg-gray-900 border border-gray-800 rounded-lg p-1.5 text-white text-xs mt-0.5"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-gray-400">Institution / University</label>
                          <input
                            type="text"
                            value={edu.institution}
                            onChange={(e) => {
                              const val = e.target.value;
                              setResume(p => {
                                const u = { ...p };
                                u.education[eduIdx].institution = val;
                                return u;
                              });
                            }}
                            className="w-full bg-gray-900 border border-gray-800 rounded-lg p-1.5 text-white text-xs mt-0.5"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[10px] text-gray-400">Dates</label>
                            <input
                              type="text"
                              value={edu.end_date}
                              onChange={(e) => {
                                const val = e.target.value;
                                setResume(p => {
                                  const u = { ...p };
                                  u.education[eduIdx].end_date = val;
                                  return u;
                                });
                              }}
                              className="w-full bg-gray-900 border border-gray-800 rounded-lg p-1.5 text-white text-xs mt-0.5"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-gray-400">GPA</label>
                            <input
                              type="text"
                              value={edu.gpa}
                              onChange={(e) => {
                                const val = e.target.value;
                                setResume(p => {
                                  const u = { ...p };
                                  u.education[eduIdx].gpa = val;
                                  return u;
                                });
                              }}
                              className="w-full bg-gray-900 border border-gray-800 rounded-lg p-1.5 text-white text-xs mt-0.5"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* 7. Certifications Form */}
                {selectedSection === 'certifications' && (
                  <div className="space-y-3">
                    <span className="text-xs font-bold text-white">Certifications & Licenses</span>
                    {resume.certifications.map((cert, cIdx) => (
                      <div key={cIdx} className="p-3 rounded-xl bg-gray-900/50 border border-gray-800 space-y-2 text-xs">
                        <div>
                          <label className="text-[10px] text-gray-400">Certification Name</label>
                          <input
                            type="text"
                            value={cert.name}
                            onChange={(e) => {
                              const val = e.target.value;
                              setResume(p => {
                                const u = { ...p };
                                u.certifications[cIdx].name = val;
                                return u;
                              });
                            }}
                            className="w-full bg-gray-900 border border-gray-800 rounded-lg p-1.5 text-white text-xs mt-0.5"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[10px] text-gray-400">Issuer</label>
                            <input
                              type="text"
                              value={cert.issuer || ''}
                              onChange={(e) => {
                                const val = e.target.value;
                                setResume(p => {
                                  const u = { ...p };
                                  u.certifications[cIdx].issuer = val;
                                  return u;
                                });
                              }}
                              className="w-full bg-gray-900 border border-gray-800 rounded-lg p-1.5 text-white text-xs mt-0.5"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-gray-400">Issue Date</label>
                            <input
                              type="text"
                              value={cert.issue_date || ''}
                              onChange={(e) => {
                                const val = e.target.value;
                                setResume(p => {
                                  const u = { ...p };
                                  u.certifications[cIdx].issue_date = val;
                                  return u;
                                });
                              }}
                              className="w-full bg-gray-900 border border-gray-800 rounded-lg p-1.5 text-white text-xs mt-0.5"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* 8. Languages Form */}
                {selectedSection === 'languages' && (
                  <div className="space-y-2 p-3 rounded-xl bg-gray-900/50 border border-gray-800">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Languages className="w-3.5 h-3.5 text-brand-400" />
                      Languages (comma separated)
                    </span>
                    <input
                      type="text"
                      value={resume.languages?.join(', ') || ''}
                      onChange={(e) => {
                        const val = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
                        setResume(p => ({ ...p, languages: val }));
                      }}
                      className="w-full bg-gray-900 border border-gray-800 rounded-lg p-2 text-white text-xs"
                      placeholder="English (Native), Spanish (Conversational)"
                    />
                  </div>
                )}

                {/* 9. Achievements Form */}
                {selectedSection === 'achievements' && (
                  <div className="space-y-2 p-3 rounded-xl bg-gray-900/50 border border-gray-800">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Award className="w-3.5 h-3.5 text-brand-400" />
                      Achievements & Honors (1 per line)
                    </span>
                    <textarea
                      rows={4}
                      value={resume.achievements?.join('\n') || ''}
                      onChange={(e) => {
                        const val = e.target.value.split('\n').filter(Boolean);
                        setResume(p => ({ ...p, achievements: val }));
                      }}
                      className="w-full bg-gray-900 border border-gray-800 rounded-lg p-2 text-white text-xs leading-relaxed"
                      placeholder="Enter each achievement on a new line..."
                    />
                  </div>
                )}

                {/* 10. Extracurriculars Form */}
                {selectedSection === 'extracurriculars' && (
                  <div className="space-y-2 p-3 rounded-xl bg-gray-900/50 border border-gray-800">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-brand-400" />
                      Leadership & Volunteer Work (1 per line)
                    </span>
                    <textarea
                      rows={4}
                      value={resume.extracurriculars?.join('\n') || ''}
                      onChange={(e) => {
                        const val = e.target.value.split('\n').filter(Boolean);
                        setResume(p => ({ ...p, extracurriculars: val }));
                      }}
                      className="w-full bg-gray-900 border border-gray-800 rounded-lg p-2 text-white text-xs leading-relaxed"
                      placeholder="Enter each leadership or community activity on a new line..."
                    />
                  </div>
                )}

              </div>
            )}

            {/* TAB 2: DESIGN & STYLE CONTROLS */}
            {rightPanelTab === 'design' && (
              <div className="space-y-4">
                
                {/* Template Preset Selector */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-300 flex items-center gap-1.5">
                    <Layout className="w-3.5 h-3.5 text-brand-400" />
                    <span>Template Design Archetype</span>
                  </label>
                  <div className="grid grid-cols-1 gap-2">
                    {TEMPLATE_PRESETS.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => setCustomization(prev => ({ ...prev, template_id: t.id }))}
                        className={`p-2.5 rounded-xl border text-left transition-all ${
                          customization.template_id === t.id
                            ? 'bg-brand-600/20 border-brand-500 text-white'
                            : 'bg-gray-900/60 border-gray-800 text-gray-300 hover:bg-gray-900'
                        }`}
                      >
                        <div className="font-semibold text-xs text-white">{t.name}</div>
                        <div className="text-[11px] text-gray-400 mt-0.5">{t.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Typography / Font Family */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-300 flex items-center gap-1.5">
                    <Type className="w-3.5 h-3.5 text-brand-400" />
                    <span>Font Family Hierarchy</span>
                  </label>
                  <select
                    value={customization.font_family}
                    onChange={(e) => setCustomization(prev => ({ ...prev, font_family: e.target.value }))}
                    className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-xs text-gray-200 focus:outline-none focus:border-brand-500"
                  >
                    {FONT_FAMILIES.map(f => (
                      <option key={f.name} value={f.value}>{f.name}</option>
                    ))}
                  </select>
                </div>

                {/* Base Font Size */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-300">Document Font Sizing</label>
                  <div className="grid grid-cols-3 gap-1.5 text-xs">
                    {(['small', 'medium', 'large'] as const).map(size => (
                      <button
                        key={size}
                        onClick={() => setCustomization(prev => ({ ...prev, font_size: size }))}
                        className={`py-1.5 rounded-lg border capitalize font-medium transition-all ${
                          customization.font_size === size 
                            ? 'bg-brand-600 text-white border-brand-500' 
                            : 'bg-gray-900 border-gray-800 text-gray-400 hover:text-white'
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Spacing & Line Height */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-300">Content Spacing</label>
                    <select
                      value={customization.spacing}
                      onChange={(e) => setCustomization(prev => ({ ...prev, spacing: e.target.value as any }))}
                      className="w-full bg-gray-900 border border-gray-800 rounded-xl px-2.5 py-2 text-xs text-gray-200"
                    >
                      <option value="compact">Compact (Dense)</option>
                      <option value="normal">Normal (Standard)</option>
                      <option value="spacious">Spacious (Airy)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-300">A4 Page Margins</label>
                    <select
                      value={customization.margins}
                      onChange={(e) => setCustomization(prev => ({ ...prev, margins: e.target.value as any }))}
                      className="w-full bg-gray-900 border border-gray-800 rounded-xl px-2.5 py-2 text-xs text-gray-200"
                    >
                      <option value="compact">Compact (12mm)</option>
                      <option value="normal">Normal (18mm)</option>
                      <option value="spacious">Spacious (24mm)</option>
                    </select>
                  </div>
                </div>

                {/* Accent Color Palette */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-300 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Palette className="w-3.5 h-3.5 text-indigo-400" />
                      Accent Color Theme
                    </span>
                    <span className="text-[10.5px] font-mono text-gray-400">{customization.accent_color}</span>
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {ACCENT_COLORS.map(c => (
                      <button
                        key={c.hex}
                        onClick={() => setCustomization(prev => ({ ...prev, accent_color: c.hex }))}
                        className={`h-8 rounded-lg border-2 transition-all flex items-center justify-center ${
                          customization.accent_color === c.hex ? 'border-white scale-105 shadow-md' : 'border-transparent hover:scale-105'
                        }`}
                        style={{ backgroundColor: c.hex }}
                        title={c.name}
                      >
                        {customization.accent_color === c.hex && (
                          <Check className="w-4 h-4 text-white drop-shadow" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Column Layout & Structure */}
                <div className="space-y-1.5 pt-2 border-t border-gray-800">
                  <label className="text-xs font-bold text-gray-300 flex items-center gap-1.5">
                    <Columns className="w-3.5 h-3.5 text-brand-400" />
                    <span>Layout & Columns</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <button
                      onClick={() => setCustomization(prev => ({ ...prev, column_layout: 'single_column' }))}
                      className={`py-2 px-2.5 rounded-lg border text-center transition-all ${
                        customization.column_layout === 'single_column'
                          ? 'bg-brand-600 text-white border-brand-500 font-semibold'
                          : 'bg-gray-900 border-gray-800 text-gray-400 hover:text-white'
                      }`}
                    >
                      Single Column (ATS)
                    </button>
                    <button
                      onClick={() => setCustomization(prev => ({ ...prev, column_layout: 'two_column' }))}
                      className={`py-2 px-2.5 rounded-lg border text-center transition-all ${
                        customization.column_layout === 'two_column'
                          ? 'bg-brand-600 text-white border-brand-500 font-semibold'
                          : 'bg-gray-900 border-gray-800 text-gray-400 hover:text-white'
                      }`}
                    >
                      Two-Column Grid
                    </button>
                  </div>
                </div>

                {/* Sidebar Position */}
                {customization.column_layout === 'two_column' && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-300">Sidebar Position</label>
                    <div className="grid grid-cols-3 gap-1.5 text-xs">
                      {(['none', 'left', 'right'] as const).map(pos => (
                        <button
                          key={pos}
                          onClick={() => setCustomization(prev => ({ ...prev, sidebar_position: pos }))}
                          className={`py-1.5 rounded-lg border capitalize font-medium transition-all ${
                            (customization.sidebar_position || 'none') === pos
                              ? 'bg-brand-600 text-white border-brand-500'
                              : 'bg-gray-900 border-gray-800 text-gray-400 hover:text-white'
                          }`}
                        >
                          {pos === 'none' ? 'None (50/50)' : `${pos} (30/70)`}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Header Style */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-300">Header Presentation</label>
                  <select
                    value={customization.header_style || 'standard'}
                    onChange={(e) => setCustomization(prev => ({ ...prev, header_style: e.target.value as any }))}
                    className="w-full bg-gray-900 border border-gray-800 rounded-xl px-2.5 py-2 text-xs text-gray-200"
                  >
                    <option value="standard">Standard Left Header</option>
                    <option value="centered">Centered Formal Header</option>
                    <option value="banner">Color Fill Banner Header</option>
                    <option value="minimal_line">Minimal Underline Header</option>
                    <option value="left_accent">Left Thick Accent Stripe</option>
                  </select>
                </div>

                {/* Dynamic Section Renaming (Universal Profession Adaptation) */}
                <div className="space-y-2 pt-2 border-t border-gray-800">
                  <label className="text-xs font-bold text-gray-300 flex items-center justify-between">
                    <span>Section Custom Titles</span>
                    <span className="text-[10px] text-gray-500">Universal Adaptation</span>
                  </label>
                  <div className="space-y-2 text-xs">
                    {[
                      { key: 'experience', label: 'Work Experience', placeholder: 'e.g. Clinical Experience, Legal Practice' },
                      { key: 'projects', label: 'Key Projects', placeholder: 'e.g. Publications, Infrastructure Projects' },
                      { key: 'skills', label: 'Skills & Tools', placeholder: 'e.g. Core Competencies, Clinical Skills' },
                      { key: 'education', label: 'Education', placeholder: 'e.g. Academic History, Medical Training' },
                      { key: 'certifications', label: 'Certifications', placeholder: 'e.g. Bar Admissions, Medical Licenses' },
                    ].map(item => (
                      <div key={item.key} className="flex flex-col gap-1">
                        <span className="text-[11px] text-gray-400">{item.label}</span>
                        <input
                          type="text"
                          value={customization.section_titles?.[item.key] || ''}
                          placeholder={item.placeholder}
                          onChange={(e) => {
                            const val = e.target.value;
                            setCustomization(prev => ({
                              ...prev,
                              section_titles: {
                                ...(prev.section_titles || {}),
                                [item.key]: val
                              }
                            }));
                          }}
                          className="bg-gray-900 border border-gray-800 rounded-lg px-2.5 py-1.5 text-xs text-gray-200 focus:outline-none focus:border-brand-500"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Save as Custom Template Action */}
                <div className="pt-3 border-t border-gray-800">
                  <button
                    onClick={() => {
                      setCustomTemplateSaveName(`My Custom ${customization.template_id.charAt(0).toUpperCase() + customization.template_id.slice(1)}`);
                      setIsSaveCustomModalOpen(true);
                    }}
                    className="w-full py-2.5 px-3 bg-brand-600/20 hover:bg-brand-600/30 text-brand-300 border border-brand-500/40 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-sm"
                  >
                    <Bookmark className="w-4 h-4 text-brand-400" />
                    <span>Save as Custom Template</span>
                  </button>
                </div>

              </div>
            )}

          </div>
        </aside>

      </div>

      {/* Save Custom Template Modal */}
      {isSaveCustomModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
            <button
              onClick={() => setIsSaveCustomModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-800"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-brand-600/20 border border-brand-500/30 flex items-center justify-center">
                <Bookmark className="w-5 h-5 text-brand-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Save Custom Template</h3>
                <p className="text-xs text-gray-400">Save your current styling, fonts, and section names for future resumes.</p>
              </div>
            </div>

            {customTemplateSaveSuccess ? (
              <div className="py-6 text-center">
                <div className="w-12 h-12 bg-emerald-500/20 border border-emerald-500/40 rounded-full flex items-center justify-center mx-auto mb-3 text-emerald-400">
                  <Check className="w-6 h-6" />
                </div>
                <p className="text-sm font-semibold text-white">Template Saved Successfully!</p>
                <p className="text-xs text-gray-400 mt-1">Available under "My Custom Templates" in the Template Gallery.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1.5">Template Name</label>
                  <input
                    type="text"
                    value={customTemplateSaveName}
                    onChange={(e) => setCustomTemplateSaveName(e.target.value)}
                    placeholder="e.g. My Executive Bio, Clinical Fellow Layout"
                    className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-brand-500"
                    autoFocus
                  />
                </div>
                <div className="p-3 bg-gray-950/60 rounded-xl border border-gray-800/80 text-xs text-gray-400 space-y-1">
                  <div className="flex justify-between">
                    <span>Base Archetype:</span>
                    <span className="text-gray-200 capitalize">{customization.template_id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Columns:</span>
                    <span className="text-gray-200">{customization.column_layout === 'two_column' ? 'Two Column' : 'Single Column'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Accent:</span>
                    <span className="text-gray-200 font-mono">{customization.accent_color}</span>
                  </div>
                </div>
                <div className="flex gap-2 justify-end pt-2">
                  <button
                    onClick={() => setIsSaveCustomModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-medium text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveAsCustomTemplate}
                    disabled={isSavingCustomTemplate || !customTemplateSaveName.trim()}
                    className="px-5 py-2 rounded-xl text-xs font-semibold bg-brand-600 hover:bg-brand-500 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md"
                  >
                    {isSavingCustomTemplate ? 'Saving...' : 'Save Template'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
