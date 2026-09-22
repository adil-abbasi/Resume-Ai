import React, { useState, useRef } from 'react';
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
  Layout,
  Type,
  Maximize2
} from 'lucide-react';
import { ResumeProfile, TemplateCustomization } from '../types';
import { apiService, defaultTemplateCustomization } from '../services/api';

interface ResumeStudioViewProps {
  resume: ResumeProfile;
  setResume: React.Dispatch<React.SetStateAction<ResumeProfile>>;
  customization?: TemplateCustomization;
  setCustomization?: React.Dispatch<React.SetStateAction<TemplateCustomization>>;
  onNavigate?: (tab: any) => void;
}

const TEMPLATE_PRESETS = [
  { id: 'modern', name: 'Modern', desc: 'Two-column sidebar with sleek accents' },
  { id: 'minimal', name: 'Minimal', desc: 'Clean typography & high whitespace' },
  { id: 'classic', name: 'Classic', desc: 'Formal single-column serif standard' },
  { id: 'professional', name: 'Professional', desc: 'Corporate tech with clean dividers' },
  { id: 'executive', name: 'Executive', desc: 'Bold banner & competency grid' },
] as const;

const ACCENT_COLORS = [
  { name: 'Electric Blue', hex: '#2563EB' },
  { name: 'Emerald Green', hex: '#059669' },
  { name: 'Royal Violet', hex: '#7C3AED' },
  { name: 'Crimson Red', hex: '#DC2626' },
  { name: 'Amber Gold', hex: '#D97706' },
  { name: 'Slate Obsidian', hex: '#0F172A' },
];

const FONT_FAMILIES = [
  { name: 'Inter', value: 'Inter, sans-serif' },
  { name: 'Outfit', value: 'Outfit, sans-serif' },
  { name: 'Plus Jakarta', value: '"Plus Jakarta Sans", sans-serif' },
  { name: 'Roboto', value: 'Roboto, sans-serif' },
  { name: 'Merriweather (Serif)', value: 'Merriweather, serif' },
  { name: 'Playfair (Display)', value: '"Playfair Display", serif' },
];

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
  const [activeSectionTab, setActiveSectionTab] = useState<'content' | 'styling'>('content');
  const [isExportingDocx, setIsExportingDocx] = useState(false);
  const [activeBulletEdit, setActiveBulletEdit] = useState<{ path: string; text: string } | null>(null);
  const [aiAlternatives, setAiAlternatives] = useState<string[]>([]);
  const [isRewriting, setIsRewriting] = useState(false);
  const resumePrintRef = useRef<HTMLDivElement>(null);

  // Print / PDF export
  const handleExportPDF = () => {
    window.print();
  };

  // DOCX export
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

  // AI Bullet Rewriter
  const handleRewrite = async (text: string, mode: string, path: string) => {
    setIsRewriting(true);
    setAiAlternatives([]);
    try {
      const res = await apiService.rewriteBullet(text, mode);
      applyBulletChange(path, res.improved_text);
      if (res.alternatives?.length) {
        setAiAlternatives(res.alternatives);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsRewriting(false);
    }
  };

  // Helper to apply bullet edits to nested resume object
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
        ...prev.work_experience,
        {
          company: 'New Tech Inc',
          position: 'Software Engineer',
          location: 'Remote',
          start_date: '2023',
          end_date: 'Present',
          current: true,
          highlights: ['Engineered key backend services, improving response times by 30%.']
        }
      ]
    }));
  };

  // Add project
  const addProject = () => {
    setResume(prev => ({
      ...prev,
      projects: [
        ...prev.projects,
        {
          title: 'New AI Project',
          description: 'Full stack web application built with modern cloud architecture.',
          technologies: ['React', 'Python', 'FastAPI'],
          link: 'https://github.com',
          highlights: ['Architected scalable endpoints and interactive UI components.']
        }
      ]
    }));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
            {/* Top Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-800 pb-4 no-print">
        <div>
          <h1 className="text-2xl font-display font-bold text-white tracking-tight">
            Resume Studio
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">
            Customize typography, edit content with AI assistance, and export professional documents.
          </p>
        </div>

        {/* Template Selector & Action Export Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Template Select Dropdown */}
          <div className="flex items-center gap-1.5 bg-gray-900 border border-gray-800 rounded-lg px-2.5 py-1.5 text-xs text-gray-300">
            <span className="text-gray-500 font-medium">Template:</span>
            <select
              value={customization.template_id}
              onChange={(e) => setCustomization(prev => ({ ...prev, template_id: e.target.value as any }))}
              className="bg-transparent text-white font-medium focus:outline-none cursor-pointer"
            >
              {TEMPLATE_PRESETS.map((t) => (
                <option key={t.id} value={t.id} className="bg-gray-900 text-white">
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleExportPDF}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-xs font-medium text-white shadow-sm transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Export PDF</span>
          </button>

          <button
            onClick={handleExportDocx}
            disabled={isExportingDocx}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-gray-900 hover:bg-gray-800 border border-gray-800 text-xs font-medium text-gray-200 transition-colors"
          >
            {isExportingDocx ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Download className="w-3.5 h-3.5 text-gray-400" />
            )}
            <span>Export Word</span>
          </button>
        </div>
      </div>

      {/* Main Studio Workspace Split Screen */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left 5 Cols: Customization & Content Editor Drawer */}
        <div className="lg:col-span-5 space-y-4 no-print">
          
          {/* Tabs: Content vs Styling */}
          <div className="flex rounded-lg bg-gray-900/60 p-1 border border-gray-800">
            <button
              onClick={() => setActiveSectionTab('content')}
              className={`flex-1 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center justify-center gap-1.5 ${
                activeSectionTab === 'content' ? 'bg-brand-600 text-white shadow-sm' : 'text-gray-400 hover:text-white'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Content</span>
            </button>
            <button
              onClick={() => setActiveSectionTab('styling')}
              className={`flex-1 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center justify-center gap-1.5 ${
                activeSectionTab === 'styling' ? 'bg-brand-600 text-white shadow-sm' : 'text-gray-400 hover:text-white'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Design & Layout</span>
            </button>
          </div>

      {/* Main Studio Workspace Split Screen */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left 5 Cols: Customization & Content Editor Drawer */}
        <div className="lg:col-span-5 space-y-4 no-print">
          
          {/* Tabs: Content vs Styling */}
          <div className="flex rounded-xl bg-gray-900/80 p-1 border border-gray-800">
            <button
              onClick={() => setActiveSectionTab('content')}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeSectionTab === 'content' ? 'bg-brand-600 text-white shadow-sm' : 'text-gray-400 hover:text-white'
              }`}
            >
              📝 Edit Resume Content
            </button>
            <button
              onClick={() => setActiveSectionTab('styling')}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeSectionTab === 'styling' ? 'bg-brand-600 text-white shadow-sm' : 'text-gray-400 hover:text-white'
              }`}
            >
              🎨 Visual Design & Layout
            </button>
          </div>

          {/* Styling Controls Drawer */}
          {activeSectionTab === 'styling' && (
            <div className="glass-panel p-5 rounded-2xl space-y-5">
              
              {/* Font Family */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-300 flex items-center gap-2">
                  <Type className="w-4 h-4 text-brand-400" />
                  <span>Typography / Font Family</span>
                </label>
                <select
                  value={customization.font_family}
                  onChange={(e) => setCustomization(prev => ({ ...prev, font_family: e.target.value }))}
                  className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-xs text-gray-200 focus:outline-none focus:border-brand-500"
                >
                  {FONT_FAMILIES.map(f => (
                    <option key={f.name} value={f.name}>{f.name}</option>
                  ))}
                </select>
              </div>

              {/* Accent Color Palette */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-300 flex items-center gap-2">
                  <Palette className="w-4 h-4 text-indigo-400" />
                  <span>Accent Color Theme</span>
                </label>
                <div className="flex flex-wrap gap-2.5">
                  {ACCENT_COLORS.map(c => (
                    <button
                      key={c.hex}
                      onClick={() => setCustomization(prev => ({ ...prev, accent_color: c.hex }))}
                      className={`w-7 h-7 rounded-full border-2 transition-all ${
                        customization.accent_color === c.hex ? 'border-white scale-110 shadow-lg' : 'border-transparent hover:scale-105'
                      }`}
                      style={{ backgroundColor: c.hex }}
                      title={c.name}
                    />
                  ))}
                </div>
              </div>

              {/* Spacing & Margins */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-300">Content Spacing</label>
                  <select
                    value={customization.spacing}
                    onChange={(e) => setCustomization(prev => ({ ...prev, spacing: e.target.value as any }))}
                    className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-xs text-gray-200"
                  >
                    <option value="compact">Compact (Fit 1 Page)</option>
                    <option value="normal">Normal Standard</option>
                    <option value="spacious">Spacious</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-300">Page Margins</label>
                  <select
                    value={customization.margins}
                    onChange={(e) => setCustomization(prev => ({ ...prev, margins: e.target.value as any }))}
                    className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-xs text-gray-200"
                  >
                    <option value="compact">Compact Margins</option>
                    <option value="normal">Normal</option>
                    <option value="spacious">Spacious</option>
                  </select>
                </div>
              </div>

              {/* Column Layout */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-300">Column Layout</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setCustomization(prev => ({ ...prev, column_layout: 'two_column' }))}
                    className={`py-2 rounded-xl text-xs font-semibold border transition-all ${
                      customization.column_layout === 'two_column'
                        ? 'bg-brand-600 text-white border-brand-500'
                        : 'bg-gray-900 border-gray-800 text-gray-300'
                    }`}
                  >
                    2 Columns (Sidebar)
                  </button>
                  <button
                    onClick={() => setCustomization(prev => ({ ...prev, column_layout: 'single_column' }))}
                    className={`py-2 rounded-xl text-xs font-semibold border transition-all ${
                      customization.column_layout === 'single_column'
                        ? 'bg-brand-600 text-white border-brand-500'
                        : 'bg-gray-900 border-gray-800 text-gray-300'
                    }`}
                  >
                    Single Column
                  </button>
                </div>
              </div>

              {/* Section Visibility Toggles */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-300">Section Visibility</label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {Object.entries(customization.section_visibility).map(([secKey, isVis]) => (
                    <button
                      key={secKey}
                      onClick={() => setCustomization(prev => ({
                        ...prev,
                        section_visibility: {
                          ...prev.section_visibility,
                          [secKey]: !isVis
                        }
                      }))}
                      className={`p-2 rounded-lg border flex items-center justify-between transition-all ${
                        isVis ? 'bg-gray-900/90 border-brand-500/40 text-gray-200' : 'bg-gray-900/30 border-gray-800 text-gray-500'
                      }`}
                    >
                      <span className="capitalize">{secKey}</span>
                      {isVis ? <Eye className="w-3.5 h-3.5 text-brand-400" /> : <EyeOff className="w-3.5 h-3.5" />}
                    </button>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* Content Fields Drawer */}
          {activeSectionTab === 'content' && (
            <div className="glass-panel p-5 rounded-2xl space-y-5 max-h-[700px] overflow-y-auto pr-2">
              
              {/* Personal Info */}
              <div className="space-y-3">
                <span className="text-xs font-bold text-gray-300 uppercase tracking-wider">Contact Information</span>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={resume.contact_info.full_name}
                    onChange={(e) => setResume(p => ({ ...p, contact_info: { ...p.contact_info, full_name: e.target.value } }))}
                    placeholder="Full Name"
                    className="bg-gray-900 border border-gray-800 rounded-lg p-2 text-xs text-white"
                  />
                  <input
                    type="text"
                    value={resume.contact_info.title}
                    onChange={(e) => setResume(p => ({ ...p, contact_info: { ...p.contact_info, title: e.target.value } }))}
                    placeholder="Headline Title"
                    className="bg-gray-900 border border-gray-800 rounded-lg p-2 text-xs text-white"
                  />
                  <input
                    type="text"
                    value={resume.contact_info.email}
                    onChange={(e) => setResume(p => ({ ...p, contact_info: { ...p.contact_info, email: e.target.value } }))}
                    placeholder="Email"
                    className="bg-gray-900 border border-gray-800 rounded-lg p-2 text-xs text-white"
                  />
                  <input
                    type="text"
                    value={resume.contact_info.phone}
                    onChange={(e) => setResume(p => ({ ...p, contact_info: { ...p.contact_info, phone: e.target.value } }))}
                    placeholder="Phone"
                    className="bg-gray-900 border border-gray-800 rounded-lg p-2 text-xs text-white"
                  />
                  <input
                    type="text"
                    value={resume.contact_info.location}
                    onChange={(e) => setResume(p => ({ ...p, contact_info: { ...p.contact_info, location: e.target.value } }))}
                    placeholder="Location"
                    className="bg-gray-900 border border-gray-800 rounded-lg p-2 text-xs text-white"
                  />
                  <input
                    type="text"
                    value={resume.contact_info.linkedin}
                    onChange={(e) => setResume(p => ({ ...p, contact_info: { ...p.contact_info, linkedin: e.target.value } }))}
                    placeholder="LinkedIn URL"
                    className="bg-gray-900 border border-gray-800 rounded-lg p-2 text-xs text-white"
                  />
                </div>
              </div>

              {/* Summary */}
              <div className="space-y-1.5">
                <span className="text-xs font-bold text-gray-300 uppercase tracking-wider">Professional Summary</span>
                <textarea
                  rows={3}
                  value={resume.summary}
                  onChange={(e) => setResume(p => ({ ...p, summary: e.target.value }))}
                  className="w-full bg-gray-900 border border-gray-800 rounded-lg p-2.5 text-xs text-gray-200 focus:outline-none focus:border-brand-500"
                />
              </div>

              {/* Work Experience */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-300 uppercase tracking-wider">Work Experience</span>
                  <button
                    onClick={addExperience}
                    className="text-xs font-semibold text-brand-400 hover:text-brand-300 flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Experience
                  </button>
                </div>

                {resume.work_experience.map((exp, expIdx) => (
                  <div key={expIdx} className="p-3.5 rounded-xl bg-gray-900/60 border border-gray-800 space-y-2">
                    <div className="grid grid-cols-2 gap-2">
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
                        placeholder="Job Position"
                        className="bg-gray-900 border border-gray-800 rounded p-1.5 text-xs text-white"
                      />
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
                        placeholder="Company"
                        className="bg-gray-900 border border-gray-800 rounded p-1.5 text-xs text-white"
                      />
                    </div>

                    {/* Bullet points with Inline AI Actions */}
                    <div className="space-y-2 pt-1">
                      <span className="text-[11px] font-semibold text-gray-400">Bullet Points & AI Polish:</span>
                      {exp.highlights.map((bullet, hIdx) => {
                        const pathKey = `exp.${expIdx}.${hIdx}`;
                        return (
                          <div key={hIdx} className="space-y-1.5">
                            <div className="flex items-start gap-1.5">
                              <textarea
                                rows={2}
                                value={bullet}
                                onChange={(e) => applyBulletChange(pathKey, e.target.value)}
                                className="w-full bg-gray-950 border border-gray-800 rounded p-2 text-xs text-gray-200"
                              />
                            </div>

                            {/* Inline AI Action Toolbar for this bullet */}
                            <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                              <button
                                onClick={() => handleRewrite(bullet, 'impact', pathKey)}
                                disabled={isRewriting}
                                className="px-2 py-0.5 rounded bg-gray-900 hover:bg-gray-800 text-gray-300 hover:text-white border border-gray-800 transition-colors"
                              >
                                STAR Impact
                              </button>
                              <button
                                onClick={() => handleRewrite(bullet, 'concise', pathKey)}
                                disabled={isRewriting}
                                className="px-2 py-0.5 rounded bg-gray-900 hover:bg-gray-800 text-gray-300 hover:text-white border border-gray-800 transition-colors"
                              >
                                Make Concise
                              </button>
                              <button
                                onClick={() => handleRewrite(bullet, 'technical', pathKey)}
                                disabled={isRewriting}
                                className="px-2 py-0.5 rounded bg-gray-900 hover:bg-gray-800 text-gray-300 hover:text-white border border-gray-800 transition-colors"
                              >
                                Technical
                              </button>
                              <button
                                onClick={() => handleRewrite(bullet, 'grammar', pathKey)}
                                disabled={isRewriting}
                                className="px-2 py-0.5 rounded bg-gray-900 hover:bg-gray-800 text-gray-300 hover:text-white border border-gray-800 transition-colors"
                              >
                                Fix Grammar
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {/* Projects */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-300 uppercase tracking-wider">Key Projects</span>
                  <button
                    onClick={addProject}
                    className="text-xs font-semibold text-brand-400 hover:text-brand-300 flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Project
                  </button>
                </div>

                {resume.projects.map((proj, pIdx) => (
                  <div key={pIdx} className="p-3 rounded-xl bg-gray-900/60 border border-gray-800 space-y-2">
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
                      placeholder="Project Title"
                      className="w-full bg-gray-900 border border-gray-800 rounded p-1.5 text-xs text-white"
                    />
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
                      placeholder="Project Description"
                      className="w-full bg-gray-950 border border-gray-800 rounded p-1.5 text-xs text-gray-300"
                    />
                  </div>
                ))}
              </div>

            </div>
          )}

        </div>

        {/* Right 7 Cols: Live Resume Paper Canvas Preview */}
        <div className="lg:col-span-7 flex justify-center sticky top-20">
          
          <div 
            ref={resumePrintRef}
            className="resume-page w-full max-w-[700px] bg-white text-gray-900 rounded-xl shadow-2xl overflow-hidden p-8 transition-all min-h-[900px]"
            style={{
              fontFamily: customization.font_family,
              fontSize: customization.font_size === 'small' ? '12px' : customization.font_size === 'large' ? '14.5px' : '13px',
              lineHeight: customization.spacing === 'compact' ? '1.3' : customization.spacing === 'spacious' ? '1.65' : '1.45',
            }}
          >
            {/* RENDER TEMPLATE ENGINE */}
            <ResumeTemplateRenderer profile={resume} customization={customization} />
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
  );
};


// ==================== TEMPLATE RENDERER COMPONENT ==================== //

interface TemplateRendererProps {
  profile: ResumeProfile;
  customization: TemplateCustomization;
}

const ResumeTemplateRenderer: React.FC<TemplateRendererProps> = ({ profile, customization }) => {
  const accent = customization.accent_color;
  const isTwoCol = customization.column_layout === 'two_column' && customization.template_id === 'modern';
  const templateId = customization.template_id;

  // 1. MODERN TEMPLATE
  if (templateId === 'modern') {
    return (
      <div className="space-y-5">
        {/* Header */}
        <div className="border-b-2 pb-4" style={{ borderColor: accent }}>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: accent }}>
            {profile.contact_info.full_name || 'Your Full Name'}
          </h1>
          <p className="text-sm font-semibold text-gray-700 mt-0.5">
            {profile.contact_info.title || profile.target_role || 'Target Role'}
          </p>
          <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-600 mt-2">
            {profile.contact_info.email && <span>📧 {profile.contact_info.email}</span>}
            {profile.contact_info.phone && <span>📞 {profile.contact_info.phone}</span>}
            {profile.contact_info.location && <span>📍 {profile.contact_info.location}</span>}
            {profile.contact_info.linkedin && <span>🔗 {profile.contact_info.linkedin}</span>}
          </div>
        </div>

        {/* Summary */}
        {customization.section_visibility.summary && profile.summary && (
          <div className="space-y-1">
            <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: accent }}>
              Professional Summary
            </h3>
            <p className="text-xs text-gray-700 leading-relaxed">{profile.summary}</p>
          </div>
        )}

        {/* Two-Column Grid or Single Column */}
        <div className={isTwoCol ? "grid grid-cols-12 gap-5" : "space-y-5"}>
          
          {/* Main Column (8 cols in 2-col layout) */}
          <div className={isTwoCol ? "col-span-8 space-y-4" : "space-y-4"}>
            
            {/* Experience */}
            {customization.section_visibility.experience && profile.work_experience.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider border-b pb-1" style={{ color: accent }}>
                  Experience
                </h3>
                {profile.work_experience.map((exp, i) => (
                  <div key={i} className="space-y-1">
                    <div className="flex justify-between items-baseline">
                      <span className="font-bold text-gray-900 text-xs">{exp.position}</span>
                      <span className="text-[11px] text-gray-500 font-medium">
                        {exp.start_date} – {exp.end_date || (exp.current ? 'Present' : '')}
                      </span>
                    </div>
                    <div className="text-xs font-semibold text-gray-700">{exp.company} {exp.location ? `• ${exp.location}` : ''}</div>
                    <ul className="list-disc list-outside ml-3 text-xs text-gray-700 space-y-0.5">
                      {exp.highlights.map((h, hIdx) => (
                        <li key={hIdx}>{h}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}

            {/* Projects */}
            {customization.section_visibility.projects && profile.projects.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider border-b pb-1" style={{ color: accent }}>
                  Key Projects
                </h3>
                {profile.projects.map((proj, i) => (
                  <div key={i} className="space-y-1">
                    <div className="flex justify-between items-baseline">
                      <span className="font-bold text-gray-900 text-xs">{proj.title}</span>
                      {proj.technologies && proj.technologies.length > 0 && (
                        <span className="text-[10px] text-gray-500">[{proj.technologies.slice(0, 3).join(', ')}]</span>
                      )}
                    </div>
                    {proj.description && <p className="text-xs text-gray-600">{proj.description}</p>}
                    <ul className="list-disc list-outside ml-3 text-xs text-gray-700 space-y-0.5">
                      {proj.highlights.map((h, hIdx) => (
                        <li key={hIdx}>{h}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}

          </div>

          {/* Sidebar Column (4 cols in 2-col layout) */}
          <div className={isTwoCol ? "col-span-4 space-y-4 bg-gray-50 p-3 rounded-lg border border-gray-100" : "space-y-4"}>
            
            {/* Skills */}
            {customization.section_visibility.skills && (
              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: accent }}>
                  Skills & Tools
                </h3>
                <div className="flex flex-wrap gap-1">
                  {[
                    ...profile.skills.technical_skills,
                    ...profile.skills.frameworks_libraries,
                    ...profile.skills.developer_tools
                  ].map((s, idx) => (
                    <span key={idx} className="px-1.5 py-0.5 bg-white border border-gray-200 text-gray-800 text-[10px] rounded font-medium">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Education */}
            {customization.section_visibility.education && profile.education.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: accent }}>
                  Education
                </h3>
                {profile.education.map((edu, idx) => (
                  <div key={idx} className="text-xs text-gray-800 space-y-0.5">
                    <div className="font-bold">{edu.degree}</div>
                    <div className="text-gray-600 text-[11px]">{edu.institution}</div>
                    <div className="text-gray-500 text-[10px]">{edu.end_date} {edu.gpa ? `• GPA: ${edu.gpa}` : ''}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Certifications */}
            {customization.section_visibility.certifications && profile.certifications.length > 0 && (
              <div className="space-y-1.5">
                <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: accent }}>
                  Certifications
                </h3>
                {profile.certifications.map((c, idx) => (
                  <div key={idx} className="text-[11px] text-gray-700">
                    • {c.name} {c.issuer ? `(${c.issuer})` : ''}
                  </div>
                ))}
              </div>
            )}

          </div>

        </div>
      </div>
    );
  }

  // 2. MINIMAL TEMPLATE
  if (templateId === 'minimal') {
    return (
      <div className="space-y-6 text-gray-900">
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-light tracking-wide uppercase">{profile.contact_info.full_name || 'Full Name'}</h1>
          <p className="text-xs text-gray-500 uppercase tracking-widest">{profile.contact_info.title || profile.target_role}</p>
          <p className="text-xs text-gray-500 pt-1">
            {[profile.contact_info.email, profile.contact_info.phone, profile.contact_info.location, profile.contact_info.linkedin].filter(Boolean).join('  |  ')}
          </p>
        </div>

        {profile.summary && (
          <p className="text-xs text-gray-600 leading-relaxed text-center max-w-lg mx-auto italic">
            "{profile.summary}"
          </p>
        )}

        {/* Experience */}
        {profile.work_experience.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-400 border-b pb-1">Experience</h3>
            {profile.work_experience.map((exp, i) => (
              <div key={i} className="space-y-0.5">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold">{exp.position} — <span className="font-normal text-gray-600">{exp.company}</span></span>
                  <span className="text-gray-400 text-[11px]">{exp.start_date} – {exp.end_date || 'Present'}</span>
                </div>
                <ul className="list-disc list-outside ml-3 text-xs text-gray-600 space-y-0.5">
                  {exp.highlights.map((h, hIdx) => <li key={hIdx}>{h}</li>)}
                </ul>
              </div>
            ))}
          </div>
        )}

        {/* Skills */}
        <div className="space-y-1">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-400 border-b pb-1">Expertise</h3>
          <p className="text-xs text-gray-700">
            {[...profile.skills.technical_skills, ...profile.skills.frameworks_libraries, ...profile.skills.developer_tools].join(' • ')}
          </p>
        </div>

        {/* Education */}
        {profile.education.length > 0 && (
          <div className="space-y-1.5">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-400 border-b pb-1">Education</h3>
            {profile.education.map((edu, idx) => (
              <div key={idx} className="flex justify-between text-xs">
                <span><strong className="font-medium">{edu.degree}</strong>, {edu.institution}</span>
                <span className="text-gray-400">{edu.end_date}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // 3. CLASSIC TEMPLATE
  if (templateId === 'classic') {
    return (
      <div className="space-y-4 font-serif text-gray-900">
        <div className="text-center border-b pb-3 border-gray-400">
          <h1 className="text-2xl font-bold tracking-tight">{profile.contact_info.full_name || 'Candidate Name'}</h1>
          <p className="text-xs italic text-gray-700 mt-0.5">{profile.contact_info.title || profile.target_role}</p>
          <div className="text-xs text-gray-600 mt-1">
            {[profile.contact_info.email, profile.contact_info.phone, profile.contact_info.location].filter(Boolean).join(' • ')}
          </div>
        </div>

        {profile.summary && (
          <div className="space-y-1">
            <h3 className="text-xs font-bold uppercase border-b border-gray-300 pb-0.5">Summary</h3>
            <p className="text-xs leading-relaxed text-gray-800">{profile.summary}</p>
          </div>
        )}

        <div className="space-y-1">
          <h3 className="text-xs font-bold uppercase border-b border-gray-300 pb-0.5">Professional Experience</h3>
          {profile.work_experience.map((exp, i) => (
            <div key={i} className="space-y-1 pt-1">
              <div className="flex justify-between text-xs font-bold">
                <span>{exp.position}, {exp.company}</span>
                <span className="font-normal italic">{exp.start_date} – {exp.end_date || 'Present'}</span>
              </div>
              <ul className="list-disc list-outside ml-4 text-xs text-gray-800 space-y-0.5">
                {exp.highlights.map((h, idx) => <li key={idx}>{h}</li>)}
              </ul>
            </div>
          ))}
        </div>

        <div className="space-y-1">
          <h3 className="text-xs font-bold uppercase border-b border-gray-300 pb-0.5">Education</h3>
          {profile.education.map((edu, i) => (
            <div key={i} className="flex justify-between text-xs">
              <span><strong>{edu.degree}</strong>, {edu.institution}</span>
              <span className="italic">{edu.end_date}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 4. PROFESSIONAL TEMPLATE
  if (templateId === 'professional') {
    return (
      <div className="space-y-5 text-gray-900">
        <div className="flex justify-between items-start border-l-4 pl-4" style={{ borderColor: accent }}>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{profile.contact_info.full_name}</h1>
            <p className="text-xs font-semibold text-gray-600">{profile.contact_info.title}</p>
          </div>
          <div className="text-right text-xs text-gray-600">
            <div>{profile.contact_info.email}</div>
            <div>{profile.contact_info.phone}</div>
            <div>{profile.contact_info.location}</div>
          </div>
        </div>

        {profile.summary && (
          <div className="space-y-1">
            <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: accent }}>Professional Profile</h3>
            <p className="text-xs text-gray-700 leading-relaxed">{profile.summary}</p>
          </div>
        )}

        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider border-b pb-1" style={{ color: accent }}>Work History</h3>
          {profile.work_experience.map((exp, i) => (
            <div key={i} className="space-y-1">
              <div className="flex justify-between text-xs font-bold">
                <span>{exp.position} | <span className="font-semibold text-gray-600">{exp.company}</span></span>
                <span className="text-gray-500">{exp.start_date} – {exp.end_date || 'Present'}</span>
              </div>
              <ul className="list-disc list-outside ml-3 text-xs text-gray-700 space-y-0.5">
                {exp.highlights.map((h, idx) => <li key={idx}>{h}</li>)}
              </ul>
            </div>
          ))}
        </div>

        <div className="space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: accent }}>Core Competencies</h3>
          <p className="text-xs text-gray-700">
            <strong>Technical:</strong> {profile.skills.technical_skills.join(', ')} | <strong>Frameworks:</strong> {profile.skills.frameworks_libraries.join(', ')} | <strong>Tools:</strong> {profile.skills.developer_tools.join(', ')}
          </p>
        </div>
      </div>
    );
  }

  // 5. EXECUTIVE TEMPLATE
  return (
    <div className="space-y-5 text-gray-900">
      {/* Executive Header Banner */}
      <div className="p-4 rounded-lg text-white" style={{ backgroundColor: accent }}>
        <h1 className="text-2xl font-bold tracking-tight">{profile.contact_info.full_name}</h1>
        <p className="text-xs font-medium text-white/90">{profile.contact_info.title}</p>
        <div className="text-[11px] text-white/80 mt-2 flex flex-wrap gap-3">
          <span>{profile.contact_info.email}</span>
          <span>{profile.contact_info.phone}</span>
          <span>{profile.contact_info.location}</span>
        </div>
      </div>

      {profile.summary && (
        <div className="p-3 bg-gray-50 rounded border-l-2" style={{ borderColor: accent }}>
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900 mb-1">Executive Summary</h3>
          <p className="text-xs text-gray-700 leading-relaxed">{profile.summary}</p>
        </div>
      )}

      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider border-b pb-1" style={{ color: accent }}>Leadership & Experience</h3>
        {profile.work_experience.map((exp, i) => (
          <div key={i} className="space-y-1">
            <div className="flex justify-between text-xs font-bold text-gray-900">
              <span>{exp.position} — {exp.company}</span>
              <span className="text-gray-500 font-normal">{exp.start_date} – {exp.end_date || 'Present'}</span>
            </div>
            <ul className="list-disc list-outside ml-3 text-xs text-gray-700 space-y-0.5">
              {exp.highlights.map((h, idx) => <li key={idx}>{h}</li>)}
            </ul>
          </div>
        ))}
      </div>

      <div className="space-y-2">
        <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: accent }}>Academic Background & Credentials</h3>
        {profile.education.map((edu, idx) => (
          <div key={idx} className="text-xs text-gray-800">
            <strong>{edu.degree}</strong>, {edu.institution} ({edu.end_date})
          </div>
        ))}
      </div>
    </div>
  );
};
