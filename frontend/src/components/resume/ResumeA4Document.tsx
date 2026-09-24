import React, { useLayoutEffect, useRef, useState, useMemo } from 'react';
import { 
  Mail, 
  Phone, 
  MapPin, 
  Link2, 
  Globe
} from 'lucide-react';
import { ResumeProfile, TemplateCustomization } from '../../types';

export interface ResumeA4DocumentProps {
  profile: ResumeProfile;
  customization: TemplateCustomization;
  onPageCountChange?: (count: number) => void;
  pageRefs?: React.MutableRefObject<(HTMLDivElement | null)[]>;
}

// Map template IDs or prefixes to design archetypes
export type TemplateArchetype = 'modern' | 'minimal' | 'classic' | 'professional' | 'executive' | 'academic';

export function resolveArchetype(templateId: string, headerStyle?: string): TemplateArchetype {
  if (headerStyle === 'banner' || templateId?.includes('executive') || templateId?.startsWith('corp_exec')) return 'executive';
  if (templateId?.includes('academic') || templateId?.startsWith('edu_') || templateId?.includes('professor') || templateId?.includes('phd')) return 'academic';
  if (!templateId) return 'modern';
  const id = templateId.toLowerCase();
  if (id.startsWith('ats_') || id.startsWith('minimal') || id.includes('clean') || id.includes('zen') || id.includes('nordic')) return 'minimal';
  if (id.startsWith('classic') || id.startsWith('law_') || id.includes('times') || id.includes('oxford') || id.includes('roman') || id.includes('ivy')) return 'classic';
  if (id.startsWith('corp_') || id.startsWith('prof') || id.startsWith('fin_') || id.startsWith('biz_') || id.startsWith('health_') || id.startsWith('eng_') || id.includes('consulting') || id.includes('banking')) return 'professional';
  if (id.startsWith('exec') || id.includes('leadership') || id.includes('director') || id.includes('capital')) return 'executive';
  if (id.startsWith('creative') || id.includes('prism') || id.includes('studio') || id.includes('vertex')) return 'modern';
  return 'modern';
}

export const ResumeA4Document: React.FC<ResumeA4DocumentProps> = ({
  profile,
  customization,
  onPageCountChange,
  pageRefs
}) => {
  const archetype = resolveArchetype(customization.template_id, customization.header_style);
  const accent = customization.accent_color || '#2563EB';

  const getTitle = (key: string, fallback: string) => customization.section_titles?.[key] || fallback;

  // Typography & Sizing styles
  const baseFontSize = useMemo(() => {
    switch (customization.font_size) {
      case 'small': return '12px';
      case 'large': return '14.5px';
      default: return '13px';
    }
  }, [customization.font_size]);

  const lineHeight = useMemo(() => {
    switch (customization.spacing) {
      case 'compact': return 1.35;
      case 'spacious': return 1.62;
      default: return 1.48;
    }
  }, [customization.spacing]);

  const pagePadding = useMemo(() => {
    switch (customization.margins) {
      case 'compact': return '12mm 14mm';
      case 'spacious': return '24mm 22mm';
      default: return '18mm 18mm';
    }
  }, [customization.margins]);

  // Content printable height in pixels (96 DPI: 297mm = 1122.5px)
  const maxPageContentHeight = useMemo(() => {
    switch (customization.margins) {
      case 'compact': return 1000; // 297mm - 24mm margins - 30px footer
      case 'spacious': return 870;  // 297mm - 48mm margins - 30px footer
      default: return 935;          // 297mm - 36mm margins - 30px footer
    }
  }, [customization.margins]);

  // Generate list of semantic chunk definitions
  const chunkDefinitions = useMemo(() => {
    const list: { id: string; type: 'header' | 'summary' | 'section_title' | 'item' | 'block'; section: string }[] = [];

    // 1. Header (Name, Title, Contact Info)
    list.push({ id: 'chunk-contact-header', type: 'header', section: 'header' });

    // Helper for section ordering
    const sectionOrder = customization.section_order?.length
      ? customization.section_order
      : ['summary', 'experience', 'projects', 'skills', 'education', 'certifications', 'achievements', 'languages', 'extracurriculars'];

    // Assemble active sections
    for (const secKey of sectionOrder) {
      const isVisible = customization.section_visibility[secKey] !== false;
      if (!isVisible) continue;

      if (secKey === 'summary' && profile.summary?.trim()) {
        list.push({ id: 'chunk-summary', type: 'block', section: 'summary' });
      }

      if (secKey === 'experience' && profile.work_experience?.length > 0) {
        list.push({ id: 'chunk-exp-header', type: 'section_title', section: 'experience' });
        profile.work_experience.forEach((_, idx) => {
          list.push({ id: `chunk-exp-item-${idx}`, type: 'item', section: 'experience' });
        });
      }

      if (secKey === 'projects' && profile.projects?.length > 0) {
        list.push({ id: 'chunk-proj-header', type: 'section_title', section: 'projects' });
        profile.projects.forEach((_, idx) => {
          list.push({ id: `chunk-proj-item-${idx}`, type: 'item', section: 'projects' });
        });
      }

      if (secKey === 'skills') {
        const hasSkills = Boolean(
          profile.skills?.technical_skills?.length ||
          profile.skills?.frameworks_libraries?.length ||
          profile.skills?.developer_tools?.length ||
          profile.skills?.soft_skills?.length ||
          profile.skills?.other?.length
        );
        if (hasSkills) {
          list.push({ id: 'chunk-skills-block', type: 'block', section: 'skills' });
        }
      }

      if (secKey === 'education' && profile.education?.length > 0) {
        list.push({ id: 'chunk-edu-header', type: 'section_title', section: 'education' });
        profile.education.forEach((_, idx) => {
          list.push({ id: `chunk-edu-item-${idx}`, type: 'item', section: 'education' });
        });
      }

      if (secKey === 'certifications' && profile.certifications?.length > 0) {
        list.push({ id: 'chunk-certs-block', type: 'block', section: 'certifications' });
      }

      if (secKey === 'achievements' && profile.achievements?.length > 0) {
        list.push({ id: 'chunk-achievements-block', type: 'block', section: 'achievements' });
      }

      if (secKey === 'publications' && profile.publications && profile.publications.length > 0) {
        list.push({ id: 'chunk-publications-block', type: 'block', section: 'publications' });
      }

      if (secKey.startsWith('custom_') && customization.custom_sections?.length) {
        const customSec = customization.custom_sections.find(cs => cs.id === secKey);
        if (customSec) {
          list.push({ id: `chunk-custom-${customSec.id}`, type: 'block', section: customSec.id });
        }
      }

      if (secKey === 'languages' && profile.languages && profile.languages.length > 0) {
        list.push({ id: 'chunk-languages-block', type: 'block', section: 'languages' });
      }

      if (secKey === 'extracurriculars' && profile.extracurriculars && profile.extracurriculars.length > 0) {
        list.push({ id: 'chunk-extracurriculars-block', type: 'block', section: 'extracurriculars' });
      }
    }

    return list;
  }, [profile, customization.section_order, customization.section_visibility, customization.custom_sections]);

  const measureContainerRef = useRef<HTMLDivElement>(null);
  // Default to immediate display of all chunks to eliminate blank page flashes
  const [paginatedChunks, setPaginatedChunks] = useState<string[][]>(() => [
    chunkDefinitions.map(c => c.id)
  ]);

  // Measure and distribute chunks across A4 pages
  useLayoutEffect(() => {
    if (!measureContainerRef.current) return;

    const container = measureContainerRef.current;
    const heights: Record<string, number> = {};

    chunkDefinitions.forEach(c => {
      const el = container.querySelector(`[data-chunk-id="${c.id}"]`) as HTMLElement | null;
      if (el) {
        const rect = el.getBoundingClientRect();
        const style = window.getComputedStyle(el);
        const marginBottom = parseFloat(style.marginBottom) || 0;
        const marginTop = parseFloat(style.marginTop) || 0;
        heights[c.id] = Math.ceil(rect.height + marginBottom + marginTop);
      } else {
        heights[c.id] = 40;
      }
    });

    const pages: string[][] = [];
    let currentPage: string[] = [];
    let currentHeight = 0;

    for (let i = 0; i < chunkDefinitions.length; i++) {
      const def = chunkDefinitions[i];
      const h = heights[def.id] || 40;

      // Check if chunk is a section header: ensure it stays with its first item
      if (def.type === 'section_title') {
        const nextDef = chunkDefinitions[i + 1];
        const nextH = nextDef ? (heights[nextDef.id] || 40) : 0;
        
        // If title + first item don't fit in remaining space, push to next page
        if (currentHeight + h + Math.min(nextH, 70) > maxPageContentHeight && currentPage.length > 0) {
          pages.push(currentPage);
          currentPage = [def.id];
          currentHeight = h;
          continue;
        }
      }

      if (currentHeight + h <= maxPageContentHeight || currentPage.length === 0) {
        currentPage.push(def.id);
        currentHeight += h;
      } else {
        pages.push(currentPage);
        currentPage = [def.id];
        currentHeight = h;
      }
    }

    if (currentPage.length > 0) {
      pages.push(currentPage);
    }

    const finalPages = pages.length > 0 ? pages : [chunkDefinitions.map(c => c.id)];
    setPaginatedChunks(finalPages);

    if (onPageCountChange) {
      onPageCountChange(finalPages.length);
    }
  }, [chunkDefinitions, maxPageContentHeight, baseFontSize, lineHeight]);

  // Render a specific chunk by its ID
  const renderChunk = (chunkId: string) => {
    // 1. Contact Header
    if (chunkId === 'chunk-contact-header') {
      return (
        <div key={chunkId} data-chunk-id={chunkId} className="mb-4">
          {archetype === 'classic' && (
            <div className="text-center border-b border-gray-400 pb-3">
              <h1 className="text-2xl font-bold tracking-tight text-gray-900 font-serif">
                {profile.contact_info.full_name || 'Your Full Name'}
              </h1>
              <p className="text-xs italic text-gray-700 font-serif mt-0.5">
                {profile.contact_info.title || profile.target_role || 'Professional Title'}
              </p>
              <div className="flex flex-wrap justify-center items-center gap-x-2.5 gap-y-1 text-[11px] text-gray-600 mt-2">
                {profile.contact_info.email && <span>{profile.contact_info.email}</span>}
                {profile.contact_info.phone && <span>• {profile.contact_info.phone}</span>}
                {profile.contact_info.location && <span>• {profile.contact_info.location}</span>}
                {profile.contact_info.linkedin && <span>• {profile.contact_info.linkedin}</span>}
                {profile.contact_info.github && <span>• {profile.contact_info.github}</span>}
                {profile.contact_info.portfolio && <span>• {profile.contact_info.portfolio}</span>}
              </div>
            </div>
          )}

          {archetype === 'minimal' && (
            <div className="text-center border-b border-gray-200 pb-3.5 space-y-1">
              <h1 className="text-2xl font-light tracking-wider uppercase text-gray-950">
                {profile.contact_info.full_name || 'Your Full Name'}
              </h1>
              <p className="text-xs text-gray-500 font-medium tracking-widest uppercase">
                {profile.contact_info.title || profile.target_role || 'Professional Title'}
              </p>
              <div className="flex flex-wrap justify-center items-center gap-x-3 gap-y-1 text-[11px] text-gray-600 pt-1">
                {[
                  profile.contact_info.email,
                  profile.contact_info.phone,
                  profile.contact_info.location,
                  profile.contact_info.linkedin,
                  profile.contact_info.github,
                  profile.contact_info.portfolio
                ].filter(Boolean).map((val, idx) => (
                  <span key={idx} className="flex items-center gap-1">
                    {idx > 0 && <span className="text-gray-300 mr-2">|</span>}
                    {val}
                  </span>
                ))}
              </div>
            </div>
          )}

          {archetype === 'professional' && (
            <div className="border-l-4 pl-4 pb-1 flex flex-col md:flex-row md:items-center justify-between gap-3" style={{ borderColor: accent }}>
              <div>
                <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">
                  {profile.contact_info.full_name || 'Your Full Name'}
                </h1>
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-600 mt-0.5">
                  {profile.contact_info.title || profile.target_role || 'Professional Title'}
                </p>
              </div>
              <div className="text-right text-[11px] text-gray-600 space-y-0.5">
                {profile.contact_info.email && <div>{profile.contact_info.email}</div>}
                {profile.contact_info.phone && <div>{profile.contact_info.phone} • {profile.contact_info.location}</div>}
                <div className="flex items-center justify-end gap-2 text-gray-500">
                  {profile.contact_info.linkedin && <span>{profile.contact_info.linkedin}</span>}
                  {profile.contact_info.github && <span>• {profile.contact_info.github}</span>}
                </div>
              </div>
            </div>
          )}

          {archetype === 'executive' && (
            <div className="p-4 rounded-md text-white shadow-sm mb-1" style={{ backgroundColor: accent }}>
              <div className="flex flex-col md:flex-row md:items-baseline justify-between gap-2">
                <div>
                  <h1 className="text-2xl font-black tracking-tight text-white">
                    {profile.contact_info.full_name || 'Your Full Name'}
                  </h1>
                  <p className="text-xs font-medium text-white/90 uppercase tracking-widest mt-0.5">
                    {profile.contact_info.title || profile.target_role || 'Executive Leadership'}
                  </p>
                </div>
                <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-white/85">
                  {profile.contact_info.email && <span>{profile.contact_info.email}</span>}
                  {profile.contact_info.phone && <span>• {profile.contact_info.phone}</span>}
                  {profile.contact_info.location && <span>• {profile.contact_info.location}</span>}
                  {profile.contact_info.linkedin && <span>• {profile.contact_info.linkedin}</span>}
                </div>
              </div>
            </div>
          )}

          {archetype === 'modern' && (
            <div className="border-b-2 pb-3.5" style={{ borderColor: accent }}>
              <div className="flex flex-col md:flex-row md:items-baseline justify-between gap-1">
                <h1 className="text-2xl font-extrabold tracking-tight" style={{ color: accent }}>
                  {profile.contact_info.full_name || 'Your Full Name'}
                </h1>
                <p className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                  {profile.contact_info.title || profile.target_role || 'Target Role'}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-gray-600 mt-2">
                {profile.contact_info.email && (
                  <span className="flex items-center gap-1">
                    <Mail className="w-3 h-3 text-gray-400" />
                    {profile.contact_info.email}
                  </span>
                )}
                {profile.contact_info.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="w-3 h-3 text-gray-400" />
                    {profile.contact_info.phone}
                  </span>
                )}
                {profile.contact_info.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-gray-400" />
                    {profile.contact_info.location}
                  </span>
                )}
                {profile.contact_info.linkedin && (
                  <span className="flex items-center gap-1">
                    <Link2 className="w-3 h-3 text-gray-400" />
                    {profile.contact_info.linkedin}
                  </span>
                )}
                {profile.contact_info.github && (
                  <span className="flex items-center gap-1">
                    <Link2 className="w-3 h-3 text-gray-400" />
                    {profile.contact_info.github}
                  </span>
                )}
                {profile.contact_info.portfolio && (
                  <span className="flex items-center gap-1">
                    <Globe className="w-3 h-3 text-gray-400" />
                    {profile.contact_info.portfolio}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      );
    }

    // 2. Summary
    if (chunkId === 'chunk-summary') {
      return (
        <div key={chunkId} data-chunk-id={chunkId} className="mb-3.5 space-y-1">
          {renderSectionHeading(getTitle('summary', 'Professional Summary'))}
          <p className="text-gray-700 leading-relaxed text-justify">
            {profile.summary}
          </p>
        </div>
      );
    }

    // 3. Work Experience Header
    if (chunkId === 'chunk-exp-header') {
      return (
        <div key={chunkId} data-chunk-id={chunkId} className="mb-2">
          {renderSectionHeading(getTitle('experience', 'Professional Experience'))}
        </div>
      );
    }

    // Work Experience Items
    if (chunkId.startsWith('chunk-exp-item-')) {
      const idx = parseInt(chunkId.replace('chunk-exp-item-', ''));
      const exp = profile.work_experience[idx];
      if (!exp) return null;

      return (
        <div key={chunkId} data-chunk-id={chunkId} className="mb-3 space-y-1">
          <div className="flex justify-between items-baseline">
            <span className="font-bold text-gray-900 tracking-tight">
              {exp.position}
            </span>
            <span className="text-[11px] font-medium text-gray-500 whitespace-nowrap ml-2">
              {exp.start_date} – {exp.end_date || (exp.current ? 'Present' : '')}
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-700">
            <span>{exp.company}</span>
            {exp.location && <span className="text-gray-400 font-normal">| {exp.location}</span>}
          </div>

          {exp.highlights?.length > 0 && (
            <ul className="list-disc list-outside ml-3.5 space-y-0.5 text-gray-700">
              {exp.highlights.map((bullet, bIdx) => (
                <li key={bIdx} className="leading-snug">
                  {bullet}
                </li>
              ))}
            </ul>
          )}
        </div>
      );
    }

    // 4. Projects Header
    if (chunkId === 'chunk-proj-header') {
      return (
        <div key={chunkId} data-chunk-id={chunkId} className="mb-2">
          {renderSectionHeading(getTitle('projects', 'Key Projects'))}
        </div>
      );
    }

    // Project Items
    if (chunkId.startsWith('chunk-proj-item-')) {
      const idx = parseInt(chunkId.replace('chunk-proj-item-', ''));
      const proj = profile.projects[idx];
      if (!proj) return null;

      return (
        <div key={chunkId} data-chunk-id={chunkId} className="mb-3 space-y-1">
          <div className="flex justify-between items-baseline flex-wrap gap-1">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-gray-900">{proj.title}</span>
              {proj.link && (
                <span className="text-[10px] text-gray-400 font-mono underline">
                  {proj.link}
                </span>
              )}
            </div>
            {proj.technologies?.length > 0 && (
              <span className="text-[10px] font-medium text-gray-500">
                [{proj.technologies.slice(0, 5).join(', ')}]
              </span>
            )}
          </div>

          {proj.description && (
            <p className="text-xs text-gray-600 leading-snug">{proj.description}</p>
          )}

          {proj.highlights?.length > 0 && (
            <ul className="list-disc list-outside ml-3.5 space-y-0.5 text-gray-700">
              {proj.highlights.map((bullet, bIdx) => (
                <li key={bIdx} className="leading-snug">
                  {bullet}
                </li>
              ))}
            </ul>
          )}
        </div>
      );
    }

    // 5. Skills Block (Profession-neutral categorization)
    if (chunkId === 'chunk-skills-block') {
      const s = profile.skills;
      const categories: { label: string; items: string[] }[] = [];
      if (s.technical_skills?.length) categories.push({ label: 'Core Skills & Methods', items: s.technical_skills });
      if (s.frameworks_libraries?.length) categories.push({ label: 'Systems, Frameworks & Standards', items: s.frameworks_libraries });
      if (s.developer_tools?.length) categories.push({ label: 'Tools, Software & Instrumentation', items: s.developer_tools });
      if (s.soft_skills?.length) categories.push({ label: 'Professional & Leadership Strengths', items: s.soft_skills });
      if (s.other?.length) categories.push({ label: 'Specializations & Methodologies', items: s.other });

      return (
        <div key={chunkId} data-chunk-id={chunkId} className="mb-3.5 space-y-1.5">
          {renderSectionHeading(getTitle('skills', 'Core Competencies & Skills'))}
          <div className="space-y-1">
            {categories.map((cat, cIdx) => (
              <div key={cIdx} className="text-xs text-gray-800 leading-snug">
                <span className="font-bold text-gray-900 mr-1.5">{cat.label}:</span>
                <span className="text-gray-700">{cat.items.join(', ')}</span>
              </div>
            ))}
          </div>
        </div>
      );
    }

    // 6. Education Header
    if (chunkId === 'chunk-edu-header') {
      return (
        <div key={chunkId} data-chunk-id={chunkId} className="mb-2">
          {renderSectionHeading(getTitle('education', 'Education'))}
        </div>
      );
    }

    // Education Items
    if (chunkId.startsWith('chunk-edu-item-')) {
      const idx = parseInt(chunkId.replace('chunk-edu-item-', ''));
      const edu = profile.education[idx];
      if (!edu) return null;

      const dateStr = edu.start_date && edu.end_date ? `${edu.start_date} – ${edu.end_date}` : edu.end_date;

      return (
        <div key={chunkId} data-chunk-id={chunkId} className="mb-2.5 space-y-0.5">
          <div className="flex justify-between items-baseline">
            <span className="font-bold text-gray-900">{edu.degree}</span>
            <span className="text-[11px] text-gray-500 font-medium whitespace-nowrap ml-2">
              {dateStr}
            </span>
          </div>
          <div className="flex justify-between items-baseline text-xs text-gray-700">
            <span className="font-semibold">{edu.institution} {edu.location ? `• ${edu.location}` : ''}</span>
            {edu.gpa && <span className="text-[11px] text-gray-500 font-medium">GPA: {edu.gpa}</span>}
          </div>
          {edu.highlights && edu.highlights.length > 0 && (
            <ul className="list-disc list-outside ml-3.5 space-y-0.5 text-[11.5px] text-gray-600">
              {edu.highlights.map((h, hIdx) => (
                <li key={hIdx}>{h}</li>
              ))}
            </ul>
          )}
        </div>
      );
    }

    // 7. Certifications Block
    if (chunkId === 'chunk-certs-block') {
      return (
        <div key={chunkId} data-chunk-id={chunkId} className="mb-3 space-y-1">
          {renderSectionHeading(getTitle('certifications', 'Certifications & Licenses'))}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">
            {profile.certifications.map((c, cIdx) => (
              <div key={cIdx} className="text-xs text-gray-800 flex items-baseline justify-between">
                <div>
                  <span className="font-semibold text-gray-900">• {c.name}</span>
                  {c.issuer && <span className="text-gray-500 text-[11px]"> ({c.issuer})</span>}
                </div>
                {c.issue_date && <span className="text-[10.5px] text-gray-400 ml-2 whitespace-nowrap">{c.issue_date}</span>}
              </div>
            ))}
          </div>
        </div>
      );
    }

    // 8. Achievements Block
    if (chunkId === 'chunk-achievements-block') {
      return (
        <div key={chunkId} data-chunk-id={chunkId} className="mb-3 space-y-1">
          {renderSectionHeading(getTitle('achievements', 'Honors & Achievements'))}
          <ul className="list-disc list-outside ml-3.5 space-y-0.5 text-xs text-gray-700">
            {profile.achievements.map((ach, aIdx) => (
              <li key={aIdx} className="leading-snug">{ach}</li>
            ))}
          </ul>
        </div>
      );
    }

    // 9. Publications Block
    if (chunkId === 'chunk-publications-block') {
      return (
        <div key={chunkId} data-chunk-id={chunkId} className="mb-3 space-y-1">
          {renderSectionHeading(getTitle('publications', 'Publications & Presentations'))}
          <ul className="list-disc list-outside ml-3.5 space-y-1 text-xs text-gray-700">
            {profile.publications?.map((pub, pIdx) => (
              <li key={pIdx} className="leading-snug">{pub}</li>
            ))}
          </ul>
        </div>
      );
    }

    // 10. Custom Section
    if (chunkId.startsWith('chunk-custom-')) {
      const secId = chunkId.replace('chunk-custom-', '');
      const customSec = customization.custom_sections?.find(cs => cs.id === secId);
      if (!customSec) return null;

      return (
        <div key={chunkId} data-chunk-id={chunkId} className="mb-3 space-y-1">
          {renderSectionHeading(customSec.title)}
          <p className="text-xs text-gray-700 leading-relaxed whitespace-pre-line">
            {customSec.content}
          </p>
        </div>
      );
    }

    // 11. Languages Block
    if (chunkId === 'chunk-languages-block') {
      return (
        <div key={chunkId} data-chunk-id={chunkId} className="mb-3 space-y-1">
          {renderSectionHeading(getTitle('languages', 'Languages'))}
          <p className="text-xs text-gray-700 leading-snug">
            {profile.languages?.join('  •  ')}
          </p>
        </div>
      );
    }

    // 12. Extracurriculars Block
    if (chunkId === 'chunk-extracurriculars-block') {
      return (
        <div key={chunkId} data-chunk-id={chunkId} className="mb-3 space-y-1">
          {renderSectionHeading(getTitle('extracurriculars', 'Leadership & Activities'))}
          <ul className="list-disc list-outside ml-3.5 space-y-0.5 text-xs text-gray-700">
            {profile.extracurriculars?.map((ec, ecIdx) => (
              <li key={ecIdx} className="leading-snug">{ec}</li>
            ))}
          </ul>
        </div>
      );
    }

    return null;
  };

  // Render uniform section heading based on archetype
  const renderSectionHeading = (title: string) => {
    switch (archetype) {
      case 'classic':
        return (
          <h2 className="text-xs font-bold uppercase tracking-wider font-serif border-b border-gray-400 pb-0.5 text-gray-900">
            {title}
          </h2>
        );
      case 'minimal':
        return (
          <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 border-b border-gray-200 pb-0.5">
            {title}
          </h2>
        );
      case 'professional':
        return (
          <h2 className="text-xs font-bold uppercase tracking-wider border-b-2 pb-0.5" style={{ color: accent, borderColor: accent }}>
            {title}
          </h2>
        );
      case 'executive':
        return (
          <div className="flex items-center gap-2 border-b pb-0.5" style={{ borderColor: accent }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: accent }} />
            <h2 className="text-xs font-black uppercase tracking-wider text-gray-900">
              {title}
            </h2>
          </div>
        );
      case 'modern':
      default:
        return (
          <h2 className="text-xs font-bold uppercase tracking-wider border-b pb-0.5 flex items-center justify-between" style={{ color: accent, borderColor: `${accent}40` }}>
            <span>{title}</span>
            <span className="h-0.5 w-6 rounded-full" style={{ backgroundColor: accent }} />
          </h2>
        );
    }
  };

  return (
    <>
      {/* 1. Offscreen Hidden Measurement Container */}
      <div
        ref={measureContainerRef}
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: -99999,
          left: -99999,
          width: '794px',
          boxSizing: 'border-box',
          padding: pagePadding,
          fontFamily: customization.font_family,
          fontSize: baseFontSize,
          lineHeight: lineHeight,
          visibility: 'hidden',
          pointerEvents: 'none'
        }}
      >
        {chunkDefinitions.map(def => renderChunk(def.id))}
      </div>

      {/* 2. Visual A4 Document Pages Stack */}
      <div className="flex flex-col items-center gap-8 print:gap-0">
        {paginatedChunks.map((chunkIds, pageIdx) => {
          const pageNum = pageIdx + 1;
          const totalPages = paginatedChunks.length;

          return (
            <div
              key={pageIdx}
              ref={el => {
                if (pageRefs) {
                  pageRefs.current[pageIdx] = el;
                }
              }}
              className="a4-page transition-all relative select-text"
              style={{
                padding: pagePadding,
                fontFamily: customization.font_family,
                fontSize: baseFontSize,
                lineHeight: lineHeight
              }}
            >
              {/* Content of this page */}
              <div className="h-full flex flex-col justify-between">
                <div>
                  {chunkIds.map(cid => renderChunk(cid))}
                </div>

                {/* Clear Document Footer with Page Counter */}
                <div className="pt-3 mt-auto border-t border-gray-100 flex items-center justify-between text-[9.5px] text-gray-400">
                  <span className="font-medium tracking-wide text-gray-400 uppercase">
                    {profile.contact_info.full_name || 'Resume'}
                  </span>
                  <span className="font-mono text-gray-400">
                    Page {pageNum} of {totalPages}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
};
