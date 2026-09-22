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
  X
} from 'lucide-react';
import { ResumeTemplate, ResumeProfile, TemplateCustomization } from '../types';
import { apiService, defaultTemplateCustomization } from '../services/api';
import { useAuth } from '../context/AuthContext';

interface TemplateGalleryViewProps {
  onNavigate: (tab: 'studio') => void;
  activeResume: ResumeProfile;
  onApplyTemplate: (customization: TemplateCustomization) => void;
}

const CATEGORIES = [
  'All',
  'Favorites',
  'Modern',
  'Minimal',
  'Professional',
  'Classic',
  'Creative',
  'ATS-friendly',
  'Student',
  'Executive',
  'One-page',
  'Two-page'
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
  const [previewTemplate, setPreviewTemplate] = useState<ResumeTemplate | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchTemplates = async () => {
      setIsLoading(true);
      try {
        const res = await apiService.getTemplates(
          selectedCategory === 'Favorites' ? undefined : selectedCategory,
          searchQuery,
          onlyProFilter === null ? undefined : onlyProFilter
        );
        setTemplates(res.templates);
      } catch (err) {
        console.error('Failed to load templates:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchTemplates();
  }, [selectedCategory, searchQuery, onlyProFilter]);

  // Filter templates
  const displayedTemplates = useMemo(() => {
    if (selectedCategory === 'Favorites') {
      return templates.filter(t => isTemplateFavorite(t.id));
    }
    return templates;
  }, [templates, selectedCategory, user?.favorite_templates]);

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
      column_layout: tpl.layout_type === 'single_column' ? 'single_column' : 'two_column',
      spacing: tpl.spacing === 'compact' ? 'compact' : 'normal'
    };

    onApplyTemplate(customization);
    onNavigate('studio');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-white">
            Resume Templates
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 mt-1">
            Carefully curated, ATS-compliant resume designs optimized for recruiter review.
          </p>
        </div>

        {/* Pro Banner in header */}
        {!isPro && (
          <button
            onClick={openPricingModal}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500/20 to-brand-500/20 hover:from-amber-500/30 hover:to-brand-500/30 border border-amber-500/40 text-amber-300 text-xs font-bold shadow-md transition-all self-start sm:self-auto"
          >
            <Crown className="w-4 h-4 text-amber-400" />
            <span>Upgrade to Pro Templates</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Search & Category Filter Bar */}
      <div className="glass-panel p-5 rounded-2xl space-y-4">
        
        <div className="flex flex-col md:flex-row items-center gap-3">
          
          {/* Search Input */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by role, style, tags (e.g. Modern, Software, FAANG, 1-Page, Minimal)..."
              className="w-full bg-gray-900/90 border border-gray-800 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-brand-500 transition-all placeholder:text-gray-500"
            />
          </div>

          {/* Tier filter buttons */}
          <div className="flex items-center gap-1.5 p-1 bg-gray-900/90 border border-gray-800 rounded-xl shrink-0 self-start md:self-auto">
            <button
              onClick={() => setOnlyProFilter(null)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                onlyProFilter === null
                  ? 'bg-gray-800 text-white shadow-sm'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              All Tiers
            </button>
            <button
              onClick={() => setOnlyProFilter(false)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                onlyProFilter === false
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Free
            </button>
            <button
              onClick={() => setOnlyProFilter(true)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                onlyProFilter === true
                  ? 'bg-gradient-to-r from-amber-500 to-brand-600 text-white shadow-sm'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Crown className="w-3 h-3 text-amber-400" />
              <span>Pro</span>
            </button>
          </div>

        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 no-scrollbar">
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
                <span>{cat}</span>
              </button>
            );
          })}
        </div>

      </div>

      {/* Templates Count Summary */}
      <div className="flex items-center justify-between text-xs text-gray-400 px-1">
        <span>Showing <strong className="text-white">{displayedTemplates.length}</strong> templates</span>
        <span className="text-[11px] text-gray-500">ATS-Optimized Layouts</span>
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
            <h3 className="text-base font-bold text-white">No templates found</h3>
            <p className="text-xs text-gray-400">Try adjusting your search query or switching categories.</p>
          </div>
          <button
            onClick={() => { setSelectedCategory('All'); setSearchQuery(''); setOnlyProFilter(null); }}
            className="px-4 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-xs font-semibold text-white"
          >
            Reset Filters
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
                className="group glass-panel rounded-2xl overflow-hidden border border-gray-800 hover:border-brand-500/50 transition-all duration-300 flex flex-col justify-between hover:shadow-xl hover:shadow-brand-500/10"
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
                    <div className="flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-black/50 text-gray-200 backdrop-blur-md border border-white/10">
                        {tpl.category}
                      </span>
                      {tpl.is_pro ? (
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          <Crown className="w-3 h-3" />
                          <span>Pro</span>
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-gray-800 text-gray-300 border border-gray-700">
                          Standard
                        </span>
                      )}
                    </div>

                    {/* Favorite Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavoriteTemplate(tpl.id);
                      }}
                      className="p-1.5 rounded-lg bg-black/40 hover:bg-black/70 text-gray-300 hover:text-white backdrop-blur-md transition-all"
                      title={isFav ? 'Remove from favorites' : 'Add to favorites'}
                    >
                      <Heart className={`w-4 h-4 ${isFav ? 'fill-red-500 text-red-500' : 'text-gray-300'}`} />
                    </button>
                  </div>

                  {/* Simulated Miniature Resume Preview Canvas */}
                  <div className="my-auto bg-white/95 rounded-lg p-3 shadow-lg transform group-hover:scale-105 transition-transform duration-300 text-gray-900 overflow-hidden max-h-24">
                    <div className="flex items-center justify-between border-b pb-1 mb-1.5" style={{ borderColor: tpl.thumbnail_color }}>
                      <div>
                        <div className="h-2 w-24 bg-gray-900 rounded font-bold" />
                        <div className="h-1.5 w-16 bg-gray-400 rounded mt-0.5" />
                      </div>
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: tpl.thumbnail_color }} />
                    </div>
                    <div className="grid grid-cols-12 gap-1.5">
                      <div className={tpl.layout_type === 'single_column' ? 'col-span-12 space-y-1' : 'col-span-8 space-y-1'}>
                        <div className="h-1.5 w-full bg-gray-300 rounded" />
                        <div className="h-1.5 w-4/5 bg-gray-300 rounded" />
                      </div>
                      {tpl.layout_type !== 'single_column' && (
                        <div className="col-span-4 bg-gray-100 p-1 rounded space-y-1">
                          <div className="h-1 w-full bg-gray-400 rounded" />
                          <div className="h-1 w-3/4 bg-gray-400 rounded" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Footer overlay tag */}
                  <div className="flex items-center justify-between text-[10px] text-gray-400 z-10">
                    <span className="font-mono">{tpl.font_family}</span>
                    <span className="flex items-center gap-1">
                      <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                      <span>{tpl.rating}</span>
                    </span>
                  </div>

                </div>

                {/* Card Body */}
                <div className="p-4 space-y-3 flex-1 flex flex-col justify-between bg-gray-900/60">
                  
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-white text-sm group-hover:text-brand-300 transition-colors">
                        {tpl.name}
                      </h3>
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: tpl.thumbnail_color }} />
                    </div>
                    <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">
                      {tpl.description}
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-2 flex items-center gap-2">
                    <button
                      onClick={() => setPreviewTemplate(tpl)}
                      className="flex-1 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
                    >
                      <Eye className="w-3.5 h-3.5 text-gray-400" />
                      <span>Preview</span>
                    </button>

                    <button
                      onClick={() => handleUseTemplate(tpl)}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-md transition-all ${
                        isLocked
                          ? 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/40 text-amber-300 hover:from-amber-500/30'
                          : 'bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white shadow-brand-500/20'
                      }`}
                    >
                      {isLocked ? (
                        <>
                          <Lock className="w-3.5 h-3.5 text-amber-400" />
                          <span>Unlock Pro</span>
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

      {/* ---------------- TEMPLATE PREVIEW MODAL ---------------- */}
      {previewTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-2xl glass-panel bg-[#0F172A]/95 border border-gray-700/80 rounded-3xl p-6 sm:p-8 shadow-2xl overflow-y-auto max-h-[90vh] space-y-6">
            
            <button
              onClick={() => setPreviewTemplate(null)}
              className="absolute top-5 right-5 p-2 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800 transition-all"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Header */}
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-white shadow-lg"
                style={{ backgroundColor: previewTemplate.thumbnail_color }}
              >
                <Layout className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-display font-bold text-white">
                    {previewTemplate.name}
                  </h3>
                  {previewTemplate.is_pro ? (
                    <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      Pro
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-gray-800 text-gray-300 border border-gray-700">
                      Standard
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-400">{previewTemplate.description}</p>
              </div>
            </div>

            {/* Live Resume Simulation with Candidate Data in this Template */}
            <div className="bg-white rounded-2xl p-6 shadow-2xl text-gray-900 space-y-4 border border-gray-200">
              <div className="flex justify-between items-baseline border-b pb-2" style={{ borderColor: previewTemplate.thumbnail_color }}>
                <div>
                  <h2 className="text-lg font-bold" style={{ fontFamily: previewTemplate.font_family }}>
                    {activeResume.contact_info.full_name || 'Alex Chen'}
                  </h2>
                  <p className="text-xs font-semibold" style={{ color: previewTemplate.thumbnail_color }}>
                    {activeResume.contact_info.title || activeResume.target_role || 'Senior Software Engineer'}
                  </p>
                </div>
                <div className="text-[11px] text-gray-500 text-right">
                  {activeResume.contact_info.email || 'alex@example.com'} • {activeResume.contact_info.location || 'San Francisco, CA'}
                </div>
              </div>

              {activeResume.summary && (
                <p className="text-xs text-gray-700 leading-relaxed italic">
                  "{activeResume.summary.slice(0, 180)}..."
                </p>
              )}

              {/* Sample Experience & Skills Preview */}
              <div className={previewTemplate.layout_type === 'single_column' ? 'space-y-3' : 'grid grid-cols-12 gap-4'}>
                <div className={previewTemplate.layout_type === 'single_column' ? 'space-y-2' : 'col-span-8 space-y-2'}>
                  <h4 className="text-xs font-bold uppercase tracking-wider" style={{ color: previewTemplate.thumbnail_color }}>
                    Experience
                  </h4>
                  {activeResume.work_experience.slice(0, 2).map((exp, idx) => (
                    <div key={idx} className="text-xs">
                      <div className="font-bold text-gray-900">{exp.position} — <span className="font-normal text-gray-600">{exp.company}</span></div>
                      <p className="text-gray-600 text-[11px] mt-0.5">• {exp.highlights[0] || 'Led architectural improvements and feature delivery.'}</p>
                    </div>
                  ))}
                </div>

                <div className={previewTemplate.layout_type === 'single_column' ? 'space-y-2' : 'col-span-4 space-y-2 bg-gray-50 p-2.5 rounded-lg'}>
                  <h4 className="text-xs font-bold uppercase tracking-wider" style={{ color: previewTemplate.thumbnail_color }}>
                    Core Skills
                  </h4>
                  <div className="flex flex-wrap gap-1">
                    {activeResume.skills.technical_skills.slice(0, 6).map((s, idx) => (
                      <span key={idx} className="px-1.5 py-0.5 rounded text-[10px] bg-white border border-gray-200 text-gray-800 font-medium">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setPreviewTemplate(null)}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-gray-400 hover:text-white"
              >
                Close Preview
              </button>

              <button
                onClick={() => {
                  handleUseTemplate(previewTemplate);
                  setPreviewTemplate(null);
                }}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 text-white text-xs font-bold shadow-lg shadow-brand-500/25 flex items-center gap-2"
              >
                <Palette className="w-4 h-4" />
                <span>Apply to Resume Studio</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
