import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  Sparkles,
  Heart,
  Eye,
  Check,
  Zap,
  Lock,
  ArrowRight,
  Filter,
  Layers,
  Crown,
  Layout,
  Palette,
  Star,
  Download,
  X,
  Plus,
  Copy,
  Trash2,
  ShieldCheck,
  Columns,
  BookOpen
} from 'lucide-react';
import { ResumeTemplate, ResumeProfile, TemplateCustomization } from '../types';
import { apiService, defaultTemplateCustomization, getSampleProfileForIndustry } from '../services/api';
import { useAuth } from '../context/AuthContext';

interface TemplateGalleryViewProps {
  onNavigate: (tab: 'studio') => void;
  activeResume: ResumeProfile;
  onApplyTemplate: (customization: TemplateCustomization) => void;
}

const CATEGORIES = [
  'All',
  'Favorites',
  'My Custom Templates',
  'ATS & Minimal',
  'Professional & Corporate',
  'Graduate & Entry Level',
  'Engineering',
  'Business',
  'Finance & Accounting',
  'Healthcare',
  'Education & Academia',
  'Law',
  'Creative',
  'Technology',
  'Other Professional Fields'
];

export const TemplateGalleryView: React.FC<TemplateGalleryViewProps> = ({
  onNavigate,
  activeResume,
  onApplyTemplate
}) => {
  const { isPro, user, toggleFavoriteTemplate, isTemplateFavorite, openPricingModal } = useAuth();

  const [templates, setTemplates] = useState<ResumeTemplate[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [onlyProFilter, setOnlyProFilter] = useState<boolean | null>(null);
  const [columnFilter, setColumnFilter] = useState<'all' | '1' | '2'>('all');
  const [atsOnlyFilter, setAtsOnlyFilter] = useState<boolean>(false);
  const [previewTemplate, setPreviewTemplate] = useState<ResumeTemplate | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // "Create Your Own Template" Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createMode, setCreateMode] = useState<'blank' | 'duplicate'>('blank');
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateDesc, setNewTemplateDesc] = useState('');
  const [newTemplateIndustry, setNewTemplateIndustry] = useState('General');
  const [newTemplateLayout, setNewTemplateLayout] = useState<'single_column' | 'two_column'>('single_column');
  const [newTemplateHeader, setNewTemplateHeader] = useState<'standard' | 'banner' | 'centered' | 'minimal_line'>('standard');
  const [newTemplateAccent, setNewTemplateAccent] = useState('#2563EB');
  const [newTemplateFont, setNewTemplateFont] = useState('Inter, sans-serif');
  const [cloneBaseTemplateId, setCloneBaseTemplateId] = useState('');
  const [isSavingCustom, setIsSavingCustom] = useState(false);

  const fetchTemplates = async () => {
    setIsLoading(true);
    try {
      let catParam = selectedCategory;
      if (selectedCategory === 'Favorites') catParam = 'All';
      if (selectedCategory === 'My Custom Templates') catParam = 'Custom';

      const res = await apiService.getTemplates(
        catParam,
        searchQuery,
        onlyProFilter === null ? undefined : onlyProFilter,
        undefined,
        atsOnlyFilter ? true : undefined
      );
      setTemplates(res.templates);
    } catch (err) {
      console.error('Failed to load templates:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, [selectedCategory, searchQuery, onlyProFilter, atsOnlyFilter]);

  // Filter templates
  const displayedTemplates = useMemo(() => {
    let list = templates;
    if (selectedCategory === 'Favorites') {
      list = list.filter(t => isTemplateFavorite(t.id));
    }
    if (columnFilter === '1') {
      list = list.filter(t => (t.columns || 1) === 1 && t.layout_type !== 'two_column');
    } else if (columnFilter === '2') {
      list = list.filter(t => (t.columns || 1) === 2 || t.layout_type === 'two_column');
    }
    return list;
  }, [templates, selectedCategory, columnFilter, user?.favorite_templates]);

  const handleUseTemplate = (tpl: ResumeTemplate) => {
    if (tpl.is_pro && !isPro) {
      openPricingModal();
      return;
    }

    const customization: TemplateCustomization = {
      ...defaultTemplateCustomization,
      template_id: tpl.id,
      font_family: tpl.font_family,
      accent_color: tpl.thumbnail_color,
      secondary_color: tpl.secondary_color,
      column_layout: tpl.columns === 2 || tpl.layout_type === 'two_column' ? 'two_column' : 'single_column',
      header_style: (tpl.header_style as any) || 'standard',
      sidebar_position: (tpl.sidebar_position as any) || 'none',
      spacing: (tpl.spacing as any) || 'normal',
      section_titles: tpl.default_section_titles || {}
    };

    onApplyTemplate(customization);
    onNavigate('studio');
  };

  const handleCreateCustomTemplate = async () => {
    if (!newTemplateName.trim()) return;
    setIsSavingCustom(true);
    try {
      const created = await apiService.saveCustomTemplate({
        name: newTemplateName.trim(),
        description: newTemplateDesc.trim() || 'Custom user template',
        base_template_id: createMode === 'duplicate' ? cloneBaseTemplateId : undefined,
        category: 'Custom',
        industry: newTemplateIndustry,
        font_family: newTemplateFont,
        accent_color: newTemplateAccent,
        column_layout: newTemplateLayout,
        header_style: newTemplateHeader,
        spacing: 'normal'
      });

      setIsCreateModalOpen(false);
      setNewTemplateName('');
      setNewTemplateDesc('');
      await fetchTemplates();
      handleUseTemplate(created);
    } catch (err) {
      console.error('Failed to create custom template:', err);
    } finally {
      setIsSavingCustom(false);
    }
  };

  const handleDeleteCustom = async (templateId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this custom template?')) return;
    try {
      await apiService.deleteCustomTemplate(templateId);
      await fetchTemplates();
    } catch (err) {
      console.error('Failed to delete custom template:', err);
    }
  };

  // Preview Candidate Data: use user's active resume if custom, otherwise generate realistic industry sample
  const previewProfile = useMemo(() => {
    if (!previewTemplate) return activeResume;
    if (activeResume && activeResume.work_experience?.length > 0 && activeResume.id !== 'sample-swe') {
      return activeResume;
    }
    return getSampleProfileForIndustry(previewTemplate.industry, previewTemplate.category);
  }, [previewTemplate, activeResume]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-white flex items-center gap-3">
            <span>Universal Resume Templates</span>
            <span className="text-xs px-2.5 py-1 rounded-full bg-brand-500/20 text-brand-300 border border-brand-500/30 font-sans">
              120+ Designs
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 mt-1">
            Universal library spanning 12 professions, industries, and career levels with zero CS bias and full ATS compliance.
          </p>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-3 self-start sm:self-auto flex-wrap">
          <button
            onClick={() => {
              setCreateMode('blank');
              setNewTemplateName('My Custom Template');
              setIsCreateModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-white text-xs font-bold border border-gray-700 transition-all shadow-sm"
          >
            <Plus className="w-4 h-4 text-brand-400" />
            <span>Create Your Own Template</span>
          </button>

          {!isPro && (
            <button
              onClick={openPricingModal}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500/20 to-brand-500/20 hover:from-amber-500/30 hover:to-brand-500/30 border border-amber-500/40 text-amber-300 text-xs font-bold shadow-md transition-all"
            >
              <Crown className="w-4 h-4 text-amber-400" />
              <span>Upgrade to Pro</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Search & Filter Controls */}
      <div className="glass-panel p-5 rounded-2xl space-y-4">
        
        <div className="flex flex-col lg:flex-row items-center gap-3">
          
          {/* Search Bar */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search across 120+ templates (e.g. Healthcare, Civil PE, Litigation, Executive, CPA, Minimal ATS)..."
              className="w-full bg-gray-900/90 border border-gray-800 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-brand-500 transition-all placeholder:text-gray-500"
            />
          </div>

          {/* Quick Filters */}
          <div className="flex items-center gap-2 w-full lg:w-auto overflow-x-auto pb-1 lg:pb-0">
            
            {/* Columns Filter */}
            <div className="flex items-center gap-1 p-1 bg-gray-900/90 border border-gray-800 rounded-xl shrink-0">
              <button
                onClick={() => setColumnFilter('all')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  columnFilter === 'all' ? 'bg-gray-800 text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                All Layouts
              </button>
              <button
                onClick={() => setColumnFilter('1')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  columnFilter === '1' ? 'bg-gray-800 text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                1-Col
              </button>
              <button
                onClick={() => setColumnFilter('2')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  columnFilter === '2' ? 'bg-gray-800 text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                2-Col
              </button>
            </div>

            {/* ATS Only Toggle */}
            <button
              onClick={() => setAtsOnlyFilter(!atsOnlyFilter)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all shrink-0 ${
                atsOnlyFilter
                  ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                  : 'bg-gray-900/90 border-gray-800 text-gray-400 hover:text-white'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>ATS Top Scanners</span>
            </button>

            {/* Tier Filters */}
            <div className="flex items-center gap-1 p-1 bg-gray-900/90 border border-gray-800 rounded-xl shrink-0">
              <button
                onClick={() => setOnlyProFilter(null)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  onlyProFilter === null ? 'bg-gray-800 text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                All Tiers
              </button>
              <button
                onClick={() => setOnlyProFilter(false)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  onlyProFilter === false ? 'bg-emerald-600 text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                Free
              </button>
              <button
                onClick={() => setOnlyProFilter(true)}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  onlyProFilter === true ? 'bg-gradient-to-r from-amber-500 to-brand-600 text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                <Crown className="w-3 h-3 text-amber-400" />
                <span>Pro</span>
              </button>
            </div>

          </div>

        </div>

        {/* 12 Industry Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 pt-1 no-scrollbar">
          {CATEGORIES.map((cat) => {
            const isActive = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 ${
                  isActive
                    ? 'bg-brand-600 text-white shadow-md shadow-brand-500/25'
                    : 'bg-gray-900/60 hover:bg-gray-800 border border-gray-800 text-gray-400 hover:text-gray-200'
                }`}
              >
                {cat === 'Favorites' && <Heart className={`w-3.5 h-3.5 ${isActive ? 'fill-white text-white' : 'text-red-400 fill-red-400'}`} />}
                {cat === 'My Custom Templates' && <Palette className="w-3.5 h-3.5 text-purple-400" />}
                {cat === 'ATS & Minimal' && <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />}
                <span>{cat}</span>
              </button>
            );
          })}
        </div>

      </div>

      {/* Templates Count & Summary */}
      <div className="flex items-center justify-between text-xs text-gray-400 px-1">
        <span>Showing <strong className="text-white">{displayedTemplates.length}</strong> universal templates in <strong className="text-brand-300">{selectedCategory}</strong></span>
        <span className="text-[11px] text-gray-500">100% Industry Adapted</span>
      </div>

      {/* Template Cards Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="glass-panel h-80 rounded-2xl animate-pulse bg-gray-900/50" />
          ))}
        </div>
      ) : displayedTemplates.length === 0 ? (
        <div className="glass-panel p-12 rounded-3xl text-center space-y-4">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-gray-800 flex items-center justify-center text-gray-400">
            <Layout className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-white">No templates found in this category</h3>
            <p className="text-xs text-gray-400">Try adjusting your filters or search keywords.</p>
          </div>
          <button
            onClick={() => { setSelectedCategory('All'); setSearchQuery(''); setOnlyProFilter(null); setColumnFilter('all'); setAtsOnlyFilter(false); }}
            className="px-4 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-xs font-semibold text-white"
          >
            Reset All Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayedTemplates.map((tpl) => {
            const isFav = isTemplateFavorite(tpl.id);
            const isLocked = tpl.is_pro && !isPro;

            return (
              <div
                key={tpl.id}
                className="group glass-panel rounded-2xl overflow-hidden border border-gray-800 hover:border-brand-500/50 transition-all duration-300 flex flex-col justify-between hover:shadow-xl hover:shadow-brand-500/10 cursor-pointer"
                onClick={() => setPreviewTemplate(tpl)}
              >
                {/* Visual Thumbnail Representation */}
                <div
                  className="relative h-48 p-4 overflow-hidden flex flex-col justify-between"
                  style={{
                    background: `linear-gradient(135deg, ${tpl.secondary_color}dd 0%, #0F172A 100%)`
                  }}
                >
                  {/* Top Badges */}
                  <div className="flex items-center justify-between z-10">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-black/60 text-gray-200 backdrop-blur-md border border-white/10">
                        {tpl.category}
                      </span>
                      {tpl.columns === 2 ? (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-black/60 text-blue-300 backdrop-blur-md border border-white/10">
                          2-Column
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-black/60 text-emerald-300 backdrop-blur-md border border-white/10">
                          1-Column ATS
                        </span>
                      )}
                      {tpl.ats_compatibility === 'High' && (
                        <span className="px-1.5 py-0.5 rounded-md text-[10px] font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          ATS High
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      {tpl.is_custom && (
                        <button
                          onClick={(e) => handleDeleteCustom(tpl.id, e)}
                          className="p-1.5 rounded-lg bg-black/40 hover:bg-red-500/30 text-gray-400 hover:text-red-300 transition-all backdrop-blur-md"
                          title="Delete Custom Template"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavoriteTemplate(tpl.id);
                        }}
                        className="p-1.5 rounded-lg bg-black/40 hover:bg-black/60 text-gray-300 hover:text-white transition-all backdrop-blur-md"
                      >
                        <Heart className={`w-4 h-4 ${isFav ? 'fill-red-500 text-red-500' : 'text-gray-300'}`} />
                      </button>
                    </div>
                  </div>

                  {/* Simulated Mini Resume Skeleton on Card */}
                  <div className="bg-white/95 rounded-lg p-2.5 shadow-md text-gray-800 space-y-1.5 pointer-events-none transform group-hover:-translate-y-1 transition-transform">
                    <div className="flex items-center justify-between border-b pb-1" style={{ borderColor: tpl.thumbnail_color }}>
                      <div className="h-2 w-20 rounded bg-gray-900" />
                      <div className="h-1.5 w-12 rounded bg-gray-400" />
                    </div>
                    <div className="space-y-1">
                      <div className="h-1 w-full rounded bg-gray-200" />
                      <div className="h-1 w-4/5 rounded bg-gray-200" />
                    </div>
                    <div className="flex gap-2 pt-0.5">
                      <div className="h-1.5 w-1/2 rounded" style={{ backgroundColor: `${tpl.thumbnail_color}88` }} />
                      <div className="h-1.5 w-1/3 rounded bg-gray-300" />
                    </div>
                  </div>

                  {/* Pro Badge if Pro */}
                  {tpl.is_pro && (
                    <div className="absolute bottom-3 right-3 z-10">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-black flex items-center gap-1 shadow-lg">
                        <Crown className="w-3 h-3 fill-black" />
                        <span>PRO</span>
                      </span>
                    </div>
                  )}
                </div>

                {/* Card Info */}
                <div className="p-4 space-y-3">
                  <div>
                    <h3 className="font-bold text-sm text-white group-hover:text-brand-400 transition-colors">
                      {tpl.name}
                    </h3>
                    <p className="text-xs text-gray-400 line-clamp-2 mt-1 leading-snug">
                      {tpl.description}
                    </p>
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1">
                    {tpl.tags.slice(0, 3).map((tag, idx) => (
                      <span key={idx} className="text-[10px] px-2 py-0.5 rounded-md bg-gray-800/80 text-gray-300">
                        #{tag}
                      </span>
                    ))}
                    {tpl.industry && tpl.industry !== 'General' && (
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-brand-500/10 text-brand-300 border border-brand-500/20">
                        {tpl.industry}
                      </span>
                    )}
                  </div>

                  {/* Card Action Buttons */}
                  <div className="pt-2 border-t border-gray-800 flex items-center justify-between gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setPreviewTemplate(tpl);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white text-xs font-semibold flex items-center gap-1 transition-all"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Preview</span>
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleUseTemplate(tpl);
                      }}
                      className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-md ${
                        isLocked
                          ? 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/40 text-amber-300 hover:from-amber-500/30'
                          : 'bg-brand-600 hover:bg-brand-500 text-white shadow-brand-500/20'
                      }`}
                    >
                      {isLocked ? (
                        <>
                          <Lock className="w-3.5 h-3.5 text-amber-400" />
                          <span>Unlock</span>
                        </>
                      ) : (
                        <>
                          <Palette className="w-3.5 h-3.5" />
                          <span>Use Template</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* ---------------- CREATE YOUR OWN TEMPLATE MODAL ---------------- */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-xl glass-panel bg-[#0F172A]/95 border border-gray-700/80 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
            <button
              onClick={() => setIsCreateModalOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800 transition-all"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <h3 className="text-xl font-display font-bold text-white flex items-center gap-2">
                <Palette className="w-5 h-5 text-brand-400" />
                <span>Create Custom Resume Template</span>
              </h3>
              <p className="text-xs text-gray-400">
                Design a custom reusable template tailored to your specific industry and layout preferences.
              </p>
            </div>

            {/* Mode selection */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setCreateMode('blank')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  createMode === 'blank'
                    ? 'bg-brand-600/20 border-brand-500 text-white'
                    : 'bg-gray-900 border-gray-800 text-gray-400'
                }`}
              >
                <div className="text-xs font-bold text-white">Start from Scratch</div>
                <div className="text-[11px] text-gray-400 mt-0.5">Blank layout with custom styles</div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setCreateMode('duplicate');
                  if (!cloneBaseTemplateId && templates.length > 0) {
                    setCloneBaseTemplateId(templates[0].id);
                  }
                }}
                className={`p-3 rounded-xl border text-left transition-all ${
                  createMode === 'duplicate'
                    ? 'bg-brand-600/20 border-brand-500 text-white'
                    : 'bg-gray-900 border-gray-800 text-gray-400'
                }`}
              >
                <div className="text-xs font-bold text-white">Clone Existing Template</div>
                <div className="text-[11px] text-gray-400 mt-0.5">Duplicate an existing preset</div>
              </button>
            </div>

            {createMode === 'duplicate' && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-300">Base Template to Duplicate</label>
                <select
                  value={cloneBaseTemplateId}
                  onChange={(e) => setCloneBaseTemplateId(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white"
                >
                  {templates.map(t => (
                    <option key={t.id} value={t.id}>{t.name} ({t.category})</option>
                  ))}
                </select>
              </div>
            )}

            {/* Template Form */}
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-300">Template Name</label>
                <input
                  type="text"
                  value={newTemplateName}
                  onChange={(e) => setNewTemplateName(e.target.value)}
                  placeholder="e.g. My Executive Clinical CV"
                  className="w-full bg-gray-900 border border-gray-800 rounded-xl p-2.5 text-xs text-white mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-300">Column Layout</label>
                  <select
                    value={newTemplateLayout}
                    onChange={(e) => setNewTemplateLayout(e.target.value as any)}
                    className="w-full bg-gray-900 border border-gray-800 rounded-xl p-2 text-xs text-white mt-1"
                  >
                    <option value="single_column">Single Column (ATS Standard)</option>
                    <option value="two_column">Two Column (Main + Sidebar)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-300">Header Design</label>
                  <select
                    value={newTemplateHeader}
                    onChange={(e) => setNewTemplateHeader(e.target.value as any)}
                    className="w-full bg-gray-900 border border-gray-800 rounded-xl p-2 text-xs text-white mt-1"
                  >
                    <option value="standard">Standard Left-Right</option>
                    <option value="banner">Executive Accent Banner</option>
                    <option value="centered">Centered Classical</option>
                    <option value="minimal_line">Minimalist Hairline</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-300">Target Industry</label>
                  <select
                    value={newTemplateIndustry}
                    onChange={(e) => setNewTemplateIndustry(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-800 rounded-xl p-2 text-xs text-white mt-1"
                  >
                    <option value="General">General / Cross-Industry</option>
                    <option value="Healthcare">Healthcare & Medicine</option>
                    <option value="Law">Law & Legal</option>
                    <option value="Engineering">Engineering</option>
                    <option value="Finance & Accounting">Finance & Accounting</option>
                    <option value="Business">Business & Management</option>
                    <option value="Education & Academia">Education & Academia</option>
                    <option value="Creative">Creative & Design</option>
                    <option value="Technology">Technology</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-300">Typography</label>
                  <select
                    value={newTemplateFont}
                    onChange={(e) => setNewTemplateFont(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-800 rounded-xl p-2 text-xs text-white mt-1"
                  >
                    <option value="Inter, sans-serif">Inter (Modern Sans)</option>
                    <option value="Outfit, sans-serif">Outfit (Geometric)</option>
                    <option value="Merriweather, serif">Merriweather (Classic Serif)</option>
                    <option value="Playfair Display, serif">Playfair (Editorial)</option>
                    <option value="Roboto, sans-serif">Roboto (Neutral)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-300">Accent Theme Color</label>
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  {['#2563EB', '#059669', '#7C3AED', '#DC2626', '#D97706', '#0F172A', '#0284C7', '#E11D48', '#0F766E'].map(hex => (
                    <button
                      key={hex}
                      type="button"
                      onClick={() => setNewTemplateAccent(hex)}
                      className={`w-7 h-7 rounded-lg border-2 transition-all ${
                        newTemplateAccent === hex ? 'border-white scale-110 shadow-lg' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: hex }}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-800">
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSavingCustom || !newTemplateName.trim()}
                onClick={handleCreateCustomTemplate}
                className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white text-xs font-bold shadow-lg shadow-brand-500/25 flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>{isSavingCustom ? 'Saving...' : 'Save & Open in Studio'}</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ---------------- TEMPLATE PREVIEW MODAL ---------------- */}
      {previewTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-3xl glass-panel bg-[#0F172A]/95 border border-gray-700/80 rounded-3xl p-6 sm:p-8 shadow-2xl overflow-y-auto max-h-[92vh] space-y-6">
            
            <button
              onClick={() => setPreviewTemplate(null)}
              className="absolute top-5 right-5 p-2 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800 transition-all"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Header */}
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-white shadow-lg shrink-0"
                style={{ backgroundColor: previewTemplate.thumbnail_color }}
              >
                <Layout className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-xl font-display font-bold text-white">
                    {previewTemplate.name}
                  </h3>
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-brand-500/20 text-brand-300 border border-brand-500/30">
                    {previewTemplate.category}
                  </span>
                  {previewTemplate.is_pro ? (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500 text-black">
                      PRO
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      Free Standard
                    </span>
                  )}
                  <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-gray-800 text-gray-300 border border-gray-700">
                    {previewTemplate.columns === 2 ? '2-Column Layout' : '1-Column Linear'}
                  </span>
                </div>
                <p className="text-xs text-gray-400">{previewTemplate.description}</p>
              </div>
            </div>

            {/* Template Specs Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 rounded-xl bg-gray-900/60 border border-gray-800 text-xs">
              <div>
                <span className="text-[10px] text-gray-500 uppercase tracking-wider block">ATS Scanners</span>
                <span className="font-semibold text-emerald-400 flex items-center gap-1 mt-0.5">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  {previewTemplate.ats_compatibility || 'High Compatibility'}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-gray-500 uppercase tracking-wider block">Best Suited For</span>
                <span className="font-semibold text-gray-200 mt-0.5 block truncate">
                  {previewTemplate.industry || previewTemplate.career_level || 'All Professions'}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-gray-500 uppercase tracking-wider block">Font Pairing</span>
                <span className="font-semibold text-gray-200 mt-0.5 block">
                  {previewTemplate.font_family}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-gray-500 uppercase tracking-wider block">Page Flow</span>
                <span className="font-semibold text-gray-200 mt-0.5 block capitalize">
                  {previewTemplate.spacing || 'Normal'} Spacing
                </span>
              </div>
            </div>

            {/* Realistic CV Simulation using Candidate Profile */}
            <div className="bg-white rounded-2xl p-6 shadow-2xl text-gray-900 space-y-4 border border-gray-200 font-sans">
              
              {/* Header Rendering */}
              <div
                className="flex justify-between items-baseline border-b pb-3"
                style={{ borderColor: previewTemplate.thumbnail_color }}
              >
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-gray-950" style={{ fontFamily: previewTemplate.font_family }}>
                    {previewProfile.contact_info.full_name || 'Candidate Full Name'}
                  </h2>
                  <p className="text-xs font-semibold mt-0.5" style={{ color: previewTemplate.thumbnail_color }}>
                    {previewProfile.contact_info.title || previewProfile.target_role || 'Professional Role'}
                  </p>
                </div>
                <div className="text-[11px] text-gray-500 text-right space-y-0.5">
                  <div>{previewProfile.contact_info.email || 'candidate@example.com'}</div>
                  <div>{previewProfile.contact_info.phone} • {previewProfile.contact_info.location}</div>
                </div>
              </div>

              {/* Summary Statement */}
              {previewProfile.summary && (
                <div className="space-y-1">
                  <h4 className="text-[11px] font-bold uppercase tracking-wider" style={{ color: previewTemplate.thumbnail_color }}>
                    {previewTemplate.default_section_titles?.summary || 'Professional Summary'}
                  </h4>
                  <p className="text-xs text-gray-700 leading-relaxed text-justify">
                    {previewProfile.summary}
                  </p>
                </div>
              )}

              {/* Experience & Skills Dynamic Rendering */}
              <div className={previewTemplate.columns === 2 ? 'grid grid-cols-12 gap-5' : 'space-y-4'}>
                
                {/* Main Column */}
                <div className={previewTemplate.columns === 2 ? 'col-span-8 space-y-3' : 'space-y-3'}>
                  <h4 className="text-[11px] font-bold uppercase tracking-wider border-b pb-0.5" style={{ color: previewTemplate.thumbnail_color }}>
                    {previewTemplate.default_section_titles?.experience || 'Professional Experience'}
                  </h4>
                  {previewProfile.work_experience.slice(0, 2).map((exp, idx) => (
                    <div key={idx} className="text-xs space-y-1">
                      <div className="flex justify-between items-baseline">
                        <span className="font-bold text-gray-900">{exp.position}</span>
                        <span className="text-[11px] text-gray-500">{exp.start_date} – {exp.end_date || 'Present'}</span>
                      </div>
                      <div className="text-[11.5px] font-medium text-gray-600">{exp.company} {exp.location ? `• ${exp.location}` : ''}</div>
                      {exp.highlights?.length > 0 && (
                        <p className="text-gray-700 text-xs leading-snug">
                          • {exp.highlights[0]}
                        </p>
                      )}
                    </div>
                  ))}

                  {/* Certifications or Projects if available */}
                  {previewProfile.certifications?.length > 0 && (
                    <div className="pt-2">
                      <h4 className="text-[11px] font-bold uppercase tracking-wider border-b pb-0.5" style={{ color: previewTemplate.thumbnail_color }}>
                        {previewTemplate.default_section_titles?.certifications || 'Licenses & Certifications'}
                      </h4>
                      <div className="text-xs text-gray-800 space-y-1 mt-1">
                        {previewProfile.certifications.slice(0, 2).map((c, idx) => (
                          <div key={idx} className="flex justify-between">
                            <span className="font-semibold">• {c.name}</span>
                            <span className="text-gray-500 text-[11px]">{c.issuer}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Sidebar or Secondary Column */}
                <div className={previewTemplate.columns === 2 ? 'col-span-4 space-y-3 bg-gray-50/80 p-3 rounded-xl border border-gray-100' : 'space-y-3 pt-2'}>
                  <div>
                    <h4 className="text-[11px] font-bold uppercase tracking-wider" style={{ color: previewTemplate.thumbnail_color }}>
                      {previewTemplate.default_section_titles?.skills || 'Core Competencies'}
                    </h4>
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {previewProfile.skills.technical_skills.slice(0, 6).map((s, idx) => (
                        <span key={idx} className="px-2 py-0.5 rounded text-[10.5px] bg-white border border-gray-200 text-gray-800 font-medium">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-[11px] font-bold uppercase tracking-wider" style={{ color: previewTemplate.thumbnail_color }}>
                      {previewTemplate.default_section_titles?.education || 'Education'}
                    </h4>
                    {previewProfile.education.slice(0, 1).map((edu, idx) => (
                      <div key={idx} className="text-xs mt-1">
                        <div className="font-bold text-gray-900">{edu.degree}</div>
                        <div className="text-gray-600 text-[11px]">{edu.institution}</div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between gap-3 pt-2">
              <button
                onClick={() => setPreviewTemplate(null)}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-gray-400 hover:text-white"
              >
                Close Preview
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    handleUseTemplate(previewTemplate);
                    setPreviewTemplate(null);
                  }}
                  className="px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-lg shadow-brand-500/25 flex items-center gap-2"
                >
                  <Palette className="w-4 h-4" />
                  <span>Use Template in Studio</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
