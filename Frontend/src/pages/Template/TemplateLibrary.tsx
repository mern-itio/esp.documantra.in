import React, { useEffect, useMemo, useState } from 'react';
import { Search, Sparkles, X, FileText, Users, Briefcase, FileCodeCorner } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { aiContentService } from '../../services/aiContentService';
import { templateServiceApi } from '../../services/apiHelper';
import { TEMPLATE_LIBRARY_TEMPLATES } from '../../data/templateLibraryTemplates';

type TemplateCategoryId = 'legal' | 'hr' | 'business' | 'tech';
type TemplateItem = (typeof TEMPLATE_LIBRARY_TEMPLATES)[number];
type TemplateField = TemplateItem['fields'][number];

type BackendTemplate = {
  _id: string;
  title: string;
  description?: string;
  content?: string;
  pdfBase64?: string;
  isAIGenerated?: boolean;
  createdByAdmin?: boolean;
  templateType?: string;
  approvalStatus?: 'pending' | 'approved' | 'rejected';
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

function interpolate(text: string, values: Record<string, string>) {
  return text.replace(/\{\{(\w+)\}\}/g, (_m, key) => values[key] ?? `{{${key}}}`);
}

function renderLineWithHighlights(line: string, values: Record<string, string>) {
  const parts: React.ReactNode[] = [];
  const re = /\{\{(\w+)\}\}/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = re.exec(line)) !== null) {
    const [full, key] = match;
    const start = match.index;
    if (start > lastIndex) parts.push(line.slice(lastIndex, start));

    const v = (values[key] ?? '').toString();
    if (v.trim()) {
      parts.push(
        <span key={`${key}-${start}`} className="bg-primary/15 text-foreground px-1 rounded border border-primary/20">
          {v}
        </span>
      );
    } else {
      parts.push(full);
    }

    lastIndex = start + full.length;
  }

  if (lastIndex < line.length) parts.push(line.slice(lastIndex));
  return <>{parts}</>;
}

function titleCaseFromId(id: string) {
  const withSpaces = id.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/_/g, ' ');
  return withSpaces
    .split(' ')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function extractFieldsFromPlaceholders(templateText: string): TemplateField[] {
  const ids = new Set<string>();
  const re = /\{\{(\w+)\}\}/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(templateText)) !== null) {
    ids.add(m[1]);
  }
  return Array.from(ids).map((id) => ({
    id,
    label: titleCaseFromId(id),
    type: /\bdate\b/i.test(id.replace(/([A-Z])/g, ' $1')) ? 'date' : 'text',
    required: true,
  }));
}

function inferTemplateCategory(input: { title?: string; description?: string; content?: string }): TemplateCategoryId {
  const explicitType = (input as any).templateType?.toString().toLowerCase().trim();
  if (explicitType === 'tech') return 'tech';
  if (explicitType === 'hr') return 'hr';
  if (explicitType === 'business') return 'business';
  if (explicitType === 'legal') return 'legal';

  const text = `${input.title || ''} ${input.description || ''} ${input.content || ''}`.toLowerCase();
  const legalKeywords = [
    'nda', 'non-disclosure', 'non disclosure', 'confidential', 'agreement',
    'whereas', 'in witness whereof', 'governing law', 'jurisdiction', 'legal'
  ];
  const hrKeywords = [
    'employee', 'employment', 'hr', 'onboarding', 'offer letter',
    'notice period', 'salary', 'compensation', 'work location'
  ];
  const businessKeywords = [
    'mou', 'memorandum', 'project', 'partnership', 'business',
    'scope of collaboration', 'timeline', 'commercial'
  ];
  const techKeywords = [
    'tech', 'api', 'documentation', 'software', 'developer',
    'system design', 'architecture', 'endpoint', 'integration'
  ];

  const score = (keywords: string[]) =>
    keywords.reduce((acc, keyword) => (text.includes(keyword) ? acc + 1 : acc), 0);

  const scores: Record<TemplateCategoryId, number> = {
    legal: score(legalKeywords),
    hr: score(hrKeywords),
    business: score(businessKeywords),
    tech: score(techKeywords),
  };

  // Strong legal terms should dominate even if "tech company" appears once.
  if (scores.legal >= 2 && scores.legal >= scores.tech) return 'legal';

  let winner: TemplateCategoryId = 'legal';
  let max = scores.legal;
  (['hr', 'business', 'tech'] as TemplateCategoryId[]).forEach((cat) => {
    if (scores[cat] > max) {
      max = scores[cat];
      winner = cat;
    }
  });

  if (max === 0) return 'legal';
  return winner;
}

function categoryLabelFromId(categoryId: TemplateCategoryId) {
  if (categoryId === 'tech') return 'Tech';
  if (categoryId === 'hr') return 'HR';
  if (categoryId === 'business') return 'Business';
  return 'Legal';
}

function getCategoryIcon(categoryId: TemplateCategoryId, className = 'h-7 w-7 text-primary') {
  if (categoryId === 'tech') return <FileCodeCorner  className={className} />;
  if (categoryId === 'hr') return <Users className={className} />;
  if (categoryId === 'business') return <Briefcase className={className} />;
  return <FileText className={className} />;
}

function renderPreviewHtml(text: string, values?: Record<string, string>) {
  const escapeHtml = (str: string) => {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  };

  const raw = (text || '').trim();
  if (!raw) return '';

  // Escape first, then do lightweight formatting.
  let html = escapeHtml(raw);

  // Highlight filled placeholders (only if placeholders exist in the source text)
  if (values) {
    html = html.replace(/\{\{(\w+)\}\}/g, (_m, key) => {
      const v = (values[key] ?? '').toString();
      if (!v.trim()) return `{{${key}}}`;
      return `<span class="bg-primary/15 text-foreground px-1 rounded border border-primary/20">${escapeHtml(v)}</span>`;
    });
  }

  // Bold: **text**
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong class="text-foreground font-semibold">$1</strong>');

  const lines = html.split('\n');
  const out: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      out.push('<div class="h-4"></div>');
      continue;
    }

    // Markdown headings
    if (trimmed.startsWith('# ')) {
      out.push(`<h1 class="text-2xl font-extrabold text-foreground text-center tracking-wide mt-2 mb-4">${trimmed.slice(2)}</h1>`);
      continue;
    }
    if (trimmed.startsWith('## ')) {
      out.push(`<h2 class="text-sm font-bold text-primary mt-4 mb-2">${trimmed.slice(3)}</h2>`);
      continue;
    }

    // All-caps section headings (common in legal docs)
    const isAllCaps =
      trimmed.length <= 48 &&
      /^[A-Z0-9\s().,'"&-]+$/.test(trimmed) &&
      /[A-Z]/.test(trimmed);

    if (isAllCaps) {
      out.push(`<h2 class="text-sm font-bold text-primary mt-4 mb-2">${trimmed}</h2>`);
      continue;
    }

    out.push(`<p class="text-sm text-muted-foreground leading-relaxed">${trimmed}</p>`);
  }

  return out.join('');
}

function formatDateInput(value: string) {
  // Keep as-is (YYYY-MM-DD) for preview; users can change later
  return value || '';
}

const buildInitialValues = (fields: TemplateField[]) =>
  fields.reduce<Record<string, string>>((acc, f) => {
    acc[f.id] = '';
    return acc;
  }, {});

function extractJsonObject(raw: string): Record<string, unknown> | null {
  const text = String(raw || '').trim();
  if (!text) return null;

  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = (fenced?.[1] || text).trim();

  try {
    const parsed = JSON.parse(candidate);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
  } catch {
    // fall through — try first {...} block
  }

  const start = candidate.indexOf('{');
  const end = candidate.lastIndexOf('}');
  if (start >= 0 && end > start) {
    try {
      const parsed = JSON.parse(candidate.slice(start, end + 1));
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>;
      }
    } catch {
      return null;
    }
  }
  return null;
}

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

/** Realistic sample values when user wants zero typing. */
function buildSampleFieldValues(fields: TemplateField[]): Record<string, string> {
  const samples: Record<string, string> = {};
  for (const f of fields) {
    const id = f.id.toLowerCase();
    const label = f.label.toLowerCase();
    if (f.type === 'date' || id.includes('date') || label.includes('date')) {
      samples[f.id] = todayIsoDate();
    } else if (id.includes('email') || label.includes('email')) {
      samples[f.id] = 'ops@example.com';
    } else if (id.includes('phone') || label.includes('phone')) {
      samples[f.id] = '+91 98765 43210';
    } else if (
      id.includes('address') ||
      label.includes('address') ||
      f.type === 'textarea'
    ) {
      samples[f.id] = '12 MG Road, Bengaluru, Karnataka 560001, India';
    } else if (id.includes('jurisdiction') || label.includes('jurisdiction')) {
      samples[f.id] = 'India';
    } else if (id.includes('entity') || label.includes('entity')) {
      samples[f.id] = 'Private Limited Company';
    } else if (id.includes('short') || label.includes('short')) {
      samples[f.id] = id.includes('receiv') || label.includes('receiv') ? 'Beta' : 'Acme';
    } else if (id.includes('receiv') || label.includes('receiv') || id.includes('partyb') || id.includes('partyb')) {
      samples[f.id] = 'Beta Solutions Pvt Ltd';
    } else if (
      id.includes('disclos') ||
      label.includes('disclos') ||
      id.includes('partya') ||
      id.includes('partya') ||
      id.includes('company') ||
      id.includes('employer')
    ) {
      samples[f.id] = 'Acme Technologies Pvt Ltd';
    } else if (id.includes('name') || label.includes('name')) {
      samples[f.id] = 'Alex Sharma';
    } else if (id.includes('title') || label.includes('title') || id.includes('role')) {
      samples[f.id] = 'Authorized Signatory';
    } else {
      samples[f.id] = f.placeholder?.replace(/^e\.g\.\s*,?\s*/i, '') || `Sample ${f.label}`;
    }
  }
  return samples;
}

async function aiSuggestFieldValues(options: {
  fields: TemplateField[];
  brief: string;
  templateTitle: string;
  templateText: string;
}): Promise<Record<string, string>> {
  const fieldSpec = options.fields.map((f) => ({
    id: f.id,
    label: f.label,
    type: f.type,
    required: !!f.required,
  }));

  const requirements = `
You are filling a document template form for the user.

Template title: ${options.templateTitle}

User brief (use these facts; invent only reasonable missing business details if needed):
${options.brief.trim()}

Fields to fill (use these exact ids as JSON keys):
${JSON.stringify(fieldSpec, null, 2)}

Template excerpt (for context only):
"""
${options.templateText.slice(0, 2500)}
"""

Rules:
- Return ONLY a single JSON object mapping field id → string value.
- No markdown, no commentary, no code fences.
- Dates must be YYYY-MM-DD when type is date.
- Keep values concise and professional.
- Prefer facts from the user brief over invented data.
`.trim();

  const response = await aiContentService.generateContent({
    templateType: 'form_fill',
    requirements,
    formData: { fields: fieldSpec },
  });

  const content = response?.data?.content || '';
  const parsed = extractJsonObject(content);
  if (!parsed) {
    throw new Error('AI did not return usable field values. Try a clearer brief.');
  }

  const next: Record<string, string> = {};
  for (const f of options.fields) {
    const raw = parsed[f.id];
    if (raw == null) continue;
    const value = String(raw).trim();
    if (value) next[f.id] = value;
  }

  if (Object.keys(next).length === 0) {
    throw new Error('AI returned empty values. Please add more details in the brief.');
  }
  return next;
}

export const TemplateLibrary: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | TemplateCategoryId>('all');
  const [activeTemplate, setActiveTemplate] = useState<TemplateItem | null>(null);
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [myTemplates, setMyTemplates] = useState<BackendTemplate[]>([]);
  const [myTemplatesLoading, setMyTemplatesLoading] = useState(false);

  // AI template fill modal state (from backend)
  const [aiFillOpen, setAiFillOpen] = useState(false);
  const [aiFillTemplate, setAiFillTemplate] = useState<BackendTemplate | null>(null);
  const [aiFillTemplateText, setAiFillTemplateText] = useState<string>('');
  const [aiFillFields, setAiFillFields] = useState<TemplateField[]>([]);
  const [aiFillValues, setAiFillValues] = useState<Record<string, string>>({});
  const [aiEditMode, setAiEditMode] = useState(false);
  const [aiTemplateDraft, setAiTemplateDraft] = useState<string>('');
  const [aiFillBrief, setAiFillBrief] = useState('');
  const [isAiFilling, setIsAiFilling] = useState(false);
  const [libraryFillBrief, setLibraryFillBrief] = useState('');
  const [isLibraryAiFilling, setIsLibraryAiFilling] = useState(false);

  const templates: TemplateItem[] = useMemo(() => TEMPLATE_LIBRARY_TEMPLATES, []);

  const categories = useMemo(
    () => [
      { id: 'all' as const, label: 'All' },
      { id: 'legal' as const, label: 'Legal' },
      { id: 'hr' as const, label: 'HR' },
      { id: 'business' as const, label: 'Business' },
      { id: 'tech' as const, label: 'Tech' },
    ],
    []
  );

  const filteredTemplates = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return templates.filter((t) => {
      const matchesSearch =
        !q || t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q);
      const matchesCategory = selectedCategory === 'all' || t.categoryId === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [templates, searchQuery, selectedCategory]);

  const filteredMyTemplates = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return myTemplates
      .filter((t) => Boolean(t.isAIGenerated))
      .filter((t) => !t.createdByAdmin) // admin-generated templates belong in "Templates" section
      .filter((t) => {
        const title = (t.title || '').toLowerCase();
        const desc = (t.description || '').toLowerCase();
        const matchesSearch = !q || title.includes(q) || desc.includes(q);
        const matchesCategory =
          selectedCategory === 'all' || inferTemplateCategory(t) === selectedCategory;
        return matchesSearch && matchesCategory;
      });
  }, [myTemplates, searchQuery, selectedCategory]);

  const filteredAdminGeneratedTemplates = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return myTemplates
      .filter((t) => Boolean(t.isAIGenerated) && Boolean(t.createdByAdmin))
      // extra safety: only show globally visible ones
      .filter((t) => t.approvalStatus === 'approved' && t.isActive !== false)
      .filter((t) => {
        const title = (t.title || '').toLowerCase();
        const desc = (t.description || '').toLowerCase();
        const matchesSearch = !q || title.includes(q) || desc.includes(q);
        const matchesCategory = selectedCategory === 'all' || inferTemplateCategory(t) === selectedCategory;
        return matchesSearch && matchesCategory;
      });
  }, [myTemplates, searchQuery, selectedCategory]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setMyTemplatesLoading(true);
        const res = await templateServiceApi.get('/api/template/get-form');
        const list = Array.isArray((res as any)?.data?.form) ? ((res as any).data.form as BackendTemplate[]) : [];
        if (!mounted) return;
        setMyTemplates(list);
      } catch (e) {
        // Non-blocking: Template library can still show curated templates
        if (mounted) setMyTemplates([]);
      } finally {
        if (mounted) setMyTemplatesLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // const handleUseBackendTemplate = async (tpl: BackendTemplate) => {
  //   if (isGenerating) return;
  //   try {
  //     setIsGenerating(true);
  //     if (tpl.pdfBase64) {
  //       navigate('/e-sign/create', {
  //         state: {
  //           documentData: {
  //             name: `${tpl.title || 'Template'}.pdf`,
  //             content: tpl.pdfBase64,
  //             type: 'application/pdf',
  //           },
  //         },
  //       });
  //       return;
  //     }

  //     const content = (tpl.content || '').trim();
  //     if (!content) {
  //       toast.error('Template has no content to generate PDF.');
  //       return;
  //     }

  //     const pdf = await aiContentService.convertToPDF({
  //       content,
  //       documentName: tpl.title || 'Template',
  //     });
  //     if (!pdf?.success || !pdf?.data?.base64) {
  //       throw new Error(pdf?.message || 'Unable to generate PDF');
  //     }

  //     navigate('/e-sign/create', {
  //       state: {
  //         documentData: {
  //           name: pdf.data.fileName || `${tpl.title || 'Template'}.pdf`,
  //           content: pdf.data.base64,
  //           type: 'application/pdf',
  //         },
  //       },
  //     });
  //   } catch (e) {
  //     const msg = e instanceof Error ? e.message : 'Failed to open template';
  //     toast.error(msg);
  //   } finally {
  //     setIsGenerating(false);
  //   }
  // };

  const openAiFillModal = (tpl: BackendTemplate) => {
    const text = (tpl.content || '').trim();
    if (!text) {
      toast.error('This template has no text content to fill.');
      return;
    }
    const fields = extractFieldsFromPlaceholders(text);
    if (fields.length === 0) {
      toast.error('No placeholders found (e.g. {{companyName}}). Use template directly instead.');
      return;
    }
    const initialValues = buildInitialValues(fields);
    setAiFillTemplate(tpl);
    setAiFillTemplateText(text);
    setAiTemplateDraft(text);
    setAiFillFields(fields);
    setAiFillValues(initialValues);
    setAiEditMode(false);
    setAiFillBrief('');
    setAiFillOpen(true);
  };

  const closeAiFillModal = () => {
    if (isGenerating || isAiFilling) return;
    setAiFillOpen(false);
    setAiFillTemplate(null);
    setAiFillTemplateText('');
    setAiTemplateDraft('');
    setAiFillFields([]);
    setAiFillValues({});
    setAiEditMode(false);
    setAiFillBrief('');
  };

  const applyAiFillToFields = async () => {
    if (!aiFillTemplate || isAiFilling || isGenerating) return;
    if (!aiFillBrief.trim()) {
      toast.error('Describe the parties, dates, or key facts — then tap AI Fill.');
      return;
    }
    try {
      setIsAiFilling(true);
      const suggested = await aiSuggestFieldValues({
        fields: aiFillFields,
        brief: aiFillBrief,
        templateTitle: aiFillTemplate.title || 'Template',
        templateText: aiTemplateDraft || aiFillTemplateText,
      });
      setAiFillValues((prev) => ({ ...prev, ...suggested }));
      toast.success('Fields filled by AI — review before generating.');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'AI fill failed');
    } finally {
      setIsAiFilling(false);
    }
  };

  const applySampleFillToAiFields = () => {
    setAiFillValues(buildSampleFieldValues(aiFillFields));
    toast.success('Sample data applied — edit anything that looks wrong.');
  };

  const applyAiFillToLibraryFields = async () => {
    if (!activeTemplate || isLibraryAiFilling || isGenerating) return;
    if (!libraryFillBrief.trim()) {
      toast.error('Describe the parties, dates, or key facts — then tap AI Fill.');
      return;
    }
    try {
      setIsLibraryAiFilling(true);
      const suggested = await aiSuggestFieldValues({
        fields: activeTemplate.fields,
        brief: libraryFillBrief,
        templateTitle: activeTemplate.name,
        templateText: [
          activeTemplate.preview?.title,
          ...(activeTemplate.preview?.body || []),
          ...(activeTemplate.preview?.sections || []).flatMap((s) => [s.heading, ...s.lines]),
        ]
          .filter(Boolean)
          .join('\n'),
      });
      setFieldValues((prev) => ({ ...prev, ...suggested }));
      toast.success('Fields filled by AI — review before generating.');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'AI fill failed');
    } finally {
      setIsLibraryAiFilling(false);
    }
  };

  const applySampleFillToLibraryFields = () => {
    if (!activeTemplate) return;
    setFieldValues(buildSampleFieldValues(activeTemplate.fields));
    toast.success('Sample data applied — edit anything that looks wrong.');
  };

  const handleGenerateFromAiTemplate = async () => {
    if (!aiFillTemplate || isGenerating) return;
    const base = (aiTemplateDraft || aiFillTemplateText || '').trim();
    if (!base) return;

    const missing = aiFillFields.find((f) => f.required && !(aiFillValues[f.id] || '').trim());
    if (missing) {
      toast.error(`Please fill required field: ${missing.label}`);
      return;
    }

    try {
      setIsGenerating(true);
      const filledText = interpolate(base, aiFillValues);
      const pdf = await aiContentService.convertToPDF({
        content: filledText,
        documentName: aiFillTemplate.title || 'Template',
      });
      if (!pdf?.success || !pdf?.data?.base64) {
        throw new Error(pdf?.message || 'Unable to generate PDF');
      }
      closeAiFillModal();
      toast.success('Template generated. Opening e-sign create flow...');
      navigate('/e-sign/create', {
        state: {
          documentData: {
            name: pdf.data.fileName || `${aiFillTemplate.title || 'Template'}.pdf`,
            content: pdf.data.base64,
            type: 'application/pdf',
          },
        },
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to generate template PDF';
      toast.error(msg);
    } finally {
      setIsGenerating(false);
    }
  };

  const openGenerator = (template: TemplateItem) => {
    setActiveTemplate(template);
    setFieldValues(buildInitialValues(template.fields));
    setLibraryFillBrief('');
  };

  const closeGenerator = () => {
    if (isLibraryAiFilling || isGenerating) return;
    setActiveTemplate(null);
    setFieldValues({});
    setLibraryFillBrief('');
  };

  const previewValues = useMemo(() => {
    const t = activeTemplate;
    if (!t) return {};
    const out: Record<string, string> = {};
    for (const f of t.fields) {
      const v = fieldValues[f.id] ?? '';
      out[f.id] = f.type === 'date' ? formatDateInput(v) : v;
    }
    return out;
  }, [activeTemplate, fieldValues]);

  const getTemplateTextContent = (template: TemplateItem, values: Record<string, string>) => {
    const bodyLines = template.preview.body.map((line) => interpolate(line, values));
    const sectionLines = template.preview.sections.flatMap((section) => [
      '',
      section.heading,
      ...section.lines.map((line) => interpolate(line, values)),
    ]);

    return [template.preview.title, '', ...bodyLines, ...sectionLines].join('\n');
  };

  const handleGenerate = async () => {
    if (!activeTemplate || isGenerating) return;

    const missingRequired = activeTemplate.fields.filter(
      (field) => field.required && !(fieldValues[field.id] || '').trim()
    );

    if (missingRequired.length > 0) {
      toast.error(`Please fill required field: ${missingRequired[0].label}`);
      return;
    }

    try {
      setIsGenerating(true);
      const content = getTemplateTextContent(activeTemplate, previewValues);
      const docName = `${activeTemplate.name}.pdf`;

      const response = await aiContentService.convertToPDF({
        content,
        documentName: activeTemplate.name,
      });

      if (!response?.success || !response?.data?.base64) {
        throw new Error(response?.message || 'Unable to generate PDF');
      }

      closeGenerator();
      toast.success('Template generated. Opening e-sign create flow...');

      navigate('/e-sign/create', {
        state: {
          documentData: {
            content: response.data.base64,
            type: 'application/pdf',
            name: response.data.fileName || docName,
          },
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to generate template PDF';
      toast.error(message);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className=" text-foreground min-h-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
       <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
        <div>

       <h1 className="text-3xl sm:text-4xl font-semibold text-foreground tracking-tight">AI-powered templates for every workflow</h1>
       <p className="text-muted-foreground mt-2 text-sm max-w-2xl">
       Generate, customize, and reuse templates in seconds with AI assistance
        </p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/template/ai-generator')}
          className="premium-ai-button flex shrink-0 items-center gap-2 px-5 py-2.5 rounded-sm text-amber-950 font-semibold text-sm"
        >
          <Sparkles className="w-4 h-4 text-amber-950" />
          <span>Generate Template using AI</span>
        </button>
      </div>
      <hr className="mt-8 border-border" />
      <div className="text-center mb-4">  

        <div className="mt-6 max-w-xl mx-auto">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by templates name"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 rounded-xl border border-border bg-card text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
            />
          </div>

        </div>
      </div>
     
      <div className="flex items-center justify-end mb-1">
        {/* <h2 className="text-lg font-semibold text-slate-900">Use Templates</h2> */}

        <div className="flex items-center gap-2">
          {categories.map((c) => (
            <button
              type="button"
              key={c.id}
              onClick={() => setSelectedCategory(c.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${selectedCategory === c.id
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-card text-muted-foreground border-border hover:bg-muted'
                }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>
      <hr className="mt-8 mb-2 border-border" />

      {filteredMyTemplates.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-semibold text-foreground mb-4">AI Templates</h2>
            {myTemplatesLoading && <span className="text-xs text-muted-foreground">Loading…</span>}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMyTemplates.map((t) => (
              <div
                key={t._id}
                className="bg-card rounded-2xl border border-border shadow-sm hover:shadow-md transition-shadow overflow-hidden"
              >
                <div className="h-40 bg-gradient-to-br from-primary/10 to-card relative">
                  {/* <div className="absolute left-5 bottom-5 h-9 w-9 rounded-xl bg-[#3E2B66]" /> */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/15 via-primary/10 to-primary/5" />
                    <div className="absolute inset-0 opacity-10 p-3">
                      {getCategoryIcon(inferTemplateCategory(t), 'h-full w-full text-primary')}
                    </div>
                    {/* <div className="relative mt-16 px-2 py-0.5 rounded-md bg-[#F7F3EE]/85 backdrop-blur-sm border border-white/60 text-[11px] font-semibold tracking-wide text-[#3E2B66]">
                      {getCoverLabel(t.title)}
                    </div> */}
                  </div>
                  <div
                    className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,color-mix(in_srgb,var(--primary)_14%,transparent)_0%,transparent_55%)]"
                  />
                </div>
                <div className="p-5">
                  <div className="text-xs font-semibold text-muted-foreground mb-1">{categoryLabelFromId(inferTemplateCategory(t))}</div>
                  <div className="text-base font-semibold text-foreground">{t.title}</div>
                  <div className="text-sm text-muted-foreground mt-1 min-h-[40px]">
                    {t.description || 'AI-generated template'}
                  </div>
                  <div className="mt-4 grid grid-cols-1 gap-2">
                    <button
                      type="button"
                      onClick={() => openAiFillModal(t)}
                      disabled={isGenerating || !(t.content || '').trim()}
                      className="w-full py-2.5 rounded-lg font-semibold text-sm bg-primary hover:bg-primary/90 text-primary-foreground transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                      title={(t.content || '').trim() ? 'Fill data & generate PDF' : 'No content available to fill'}
                    >
                      CREATE TEMPLATE
                    </button>
                    {/* <button
                      onClick={() => handleUseBackendTemplate(t)}
                      disabled={isGenerating}
                      className="w-full py-2.5 rounded-lg font-semibold text-sm bg-[#3E2B66] hover:bg-[#2a0a59] text-white transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {isGenerating ? 'OPENING…' : 'USE TEMPLATE'}
                    </button> */}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      <hr className="mb-8 border-border" />
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-semibold text-foreground mb-4">Templates</h2>
        {myTemplatesLoading && <span className="text-xs text-muted-foreground">Loading…</span>}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAdminGeneratedTemplates.map((t) => (
          <div
            key={t._id}
            className="bg-card rounded-2xl border border-border shadow-sm hover:shadow-md transition-shadow overflow-hidden"
          >
            <div className="h-40 bg-gradient-to-br from-primary/10 to-card relative">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/15 via-primary/10 to-primary/5" />
                <div className="absolute inset-0 opacity-10 p-3">
                  {getCategoryIcon(inferTemplateCategory(t), 'h-full w-full text-primary')}
                </div>
              </div>
              <div
                className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,color-mix(in_srgb,var(--primary)_14%,transparent)_0%,transparent_55%)]"
              />
            </div>
            <div className="p-5">
              <div className="text-xs font-semibold text-muted-foreground mb-1">
               {categoryLabelFromId(inferTemplateCategory(t))}
              </div>
              <div className="text-base font-semibold text-foreground">{t.title}</div>
              <div className="text-sm text-muted-foreground mt-1 min-h-[40px]">
                {t.description || 'Admin template'}
              </div>
              <button
                type="button"
                onClick={() => openAiFillModal(t)}
                disabled={isGenerating || !(t.content || '').trim()}
                className="mt-4 w-full py-2.5 rounded-lg font-semibold text-sm bg-primary hover:bg-primary/90 text-primary-foreground transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                title={(t.content || '').trim() ? 'Fill data & generate PDF' : 'No content available to fill'}
              >
                CREATE TEMPLATE
              </button>
            </div>
          </div>
        ))}

        {filteredTemplates.map((t) => (
          <div
            key={t.id}
            className="bg-card rounded-2xl border border-border shadow-sm hover:shadow-md transition-shadow overflow-hidden"
          >
            <div className={`h-40 bg-gradient-to-br ${t.coverStyle.bg} relative`}>
              {/* <div className={`absolute left-5 bottom-5 h-9 w-9 rounded-xl ${t.coverStyle.accent}`} /> */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/15 via-primary/10 to-primary/5" />
                <div className="absolute inset-0 opacity-10 p-3">
                  {getCategoryIcon(t.categoryId, 'h-full w-full text-primary')}
                </div>
                {/* <div className="relative mt-16 px-2 py-0.5 rounded-md bg-[#F7F3EE]/85 backdrop-blur-sm border border-white/60 text-[11px] font-semibold tracking-wide text-[#3E2B66]">
                  {getCoverLabel(t.name)}
                </div> */}
              </div>
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,color-mix(in_srgb,var(--primary)_14%,transparent)_0%,transparent_55%)]" />
            </div>
            <div className="p-5">
              <div className="text-xs font-semibold text-muted-foreground mb-1">{t.categoryLabel}</div>
              <div className="text-base font-semibold text-foreground">{t.name}</div>
              <div className="text-sm text-muted-foreground mt-1 min-h-[40px]">{t.description}</div>
              <button
                type="button"
                onClick={() => openGenerator(t)}
                className="mt-4 w-full py-2.5 rounded-lg font-semibold text-sm bg-primary hover:bg-primary/90 text-primary-foreground transition-colors"
              >
                CREATE TEMPLATE
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Generator Modal */}
      {activeTemplate && (
        <div className="fixed inset-0 z-[9999]">
          <div
            className="absolute inset-0 bg-black/50 dark:bg-black/60"
            onClick={closeGenerator}
            aria-hidden="true"
          />
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div className="w-full max-w-6xl bg-card rounded-2xl shadow-2xl border border-border overflow-hidden max-h-[90vh] flex flex-col">
              <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                <div className="text-sm font-semibold text-foreground">{activeTemplate.name} Template Generator</div>
                <button
                  type="button"
                  onClick={closeGenerator}
                  className="p-2 rounded-lg hover:bg-muted text-muted-foreground"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 flex-1 min-h-0">
                {/* Left: required fields */}
                <div className="lg:col-span-1 p-5 border-b lg:border-b-0 lg:border-r border-border bg-muted/40 overflow-auto min-h-0">
                  <div className="mb-4 rounded-xl border border-primary/20 bg-primary/5 p-3 space-y-2">
                    <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                      <Sparkles className="h-4 w-4 text-primary" />
                      AI Fill
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Paste a short brief (parties, dates, address). AI fills the fields — you can edit anytime.
                    </p>
                    <textarea
                      value={libraryFillBrief}
                      onChange={(e) => setLibraryFillBrief(e.target.value)}
                      disabled={isGenerating || isLibraryAiFilling}
                      placeholder="e.g. Acme Pvt Ltd (Mumbai) sharing data with Beta Solutions (Bengaluru). Effective today. Indian law."
                      className="w-full min-h-[84px] resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:opacity-60"
                    />
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={applyAiFillToLibraryFields}
                        disabled={isGenerating || isLibraryAiFilling}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
                      >
                        <Sparkles className="h-3.5 w-3.5" />
                        {isLibraryAiFilling ? 'Filling…' : 'AI Fill fields'}
                      </button>
                      <button
                        type="button"
                        onClick={applySampleFillToLibraryFields}
                        disabled={isGenerating || isLibraryAiFilling}
                        className="rounded-lg border border-border bg-background px-3 py-2 text-xs font-semibold text-foreground hover:bg-muted disabled:opacity-60"
                      >
                        Use sample data
                      </button>
                    </div>
                  </div>

                  <div className="text-sm font-semibold text-foreground mb-3">Enter {activeTemplate.categoryLabel} Details</div>
                  <div className="space-y-3">
                    {activeTemplate.fields.map((f) => {
                      const value = fieldValues[f.id] ?? '';
                      const common =
                        'w-full px-3 py-2.5 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm';

                      return (
                        <label key={f.id} className="block">
                          <div className="text-xs font-semibold text-foreground/90 mb-1">
                            {f.label} {f.required ? <span className="text-destructive">*</span> : null}
                          </div>
                          {f.type === 'textarea' ? (
                            <textarea
                              value={value}
                              onChange={(e) => setFieldValues((prev) => ({ ...prev, [f.id]: e.target.value }))}
                              placeholder={f.placeholder}
                              className={`${common} min-h-[96px] resize-none`}
                            />
                          ) : (
                            <input
                              type={f.type}
                              value={value}
                              onChange={(e) => setFieldValues((prev) => ({ ...prev, [f.id]: e.target.value }))}
                              placeholder={f.placeholder}
                              className={common}
                            />
                          )}
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Right: preview */}
                <div className="lg:col-span-2 p-6 flex flex-col min-h-0">
                  <div className="overflow-auto rounded-2xl border border-border bg-background flex-1 min-h-0">
                    <div className="px-8 py-8">
                      <div className="text-center text-2xl font-extrabold tracking-wide text-foreground">
                        {activeTemplate.preview.title}
                      </div>
                      <div className="mt-4 text-sm text-muted-foreground leading-relaxed space-y-2">
                        {activeTemplate.preview.body.map((line, idx) => (
                          <p key={idx}>{renderLineWithHighlights(line, previewValues)}</p>
                        ))}
                      </div>

                      <div className="mt-6 space-y-5">
                        {activeTemplate.preview.sections.map((s) => (
                          <div key={s.heading}>
                            <div className="text-sm font-bold text-primary">{s.heading}</div>
                            <div className="mt-2 text-sm text-muted-foreground leading-relaxed space-y-1">
                              {s.lines.map((line, idx) => (
                                <p key={idx}>{renderLineWithHighlights(line, previewValues)}</p>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-3 mt-4 pt-4 border-t border-border">
                    <button
                      type="button"
                      onClick={closeGenerator}
                      className="px-5 py-2.5 rounded-xl font-semibold text-sm text-muted-foreground hover:bg-muted transition-colors"
                    >
                      CANCEL
                    </button>
                    <button
                      type="button"
                      onClick={handleGenerate}
                      disabled={isGenerating}
                      className="px-5 py-2.5 rounded-xl font-semibold text-sm bg-primary hover:bg-primary/90 text-primary-foreground transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {isGenerating ? 'GENERATING...' : 'GENERATE & USE'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AI Fill Modal */}
      {aiFillOpen && aiFillTemplate && (
        <div className="fixed inset-0 z-[9999]">
          <div className="absolute inset-0 bg-black/50 dark:bg-black/60" onClick={closeAiFillModal} aria-hidden="true" />
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div className="w-full max-w-6xl bg-card rounded-2xl shadow-2xl border border-border overflow-hidden max-h-[90vh] flex flex-col">
              <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                <div className="text-sm font-semibold text-foreground">{aiFillTemplate.title} — Fill data</div>
                <button
                  type="button"
                  onClick={closeAiFillModal}
                  className="p-2 rounded-lg hover:bg-muted text-muted-foreground"
                  aria-label="Close"
                  disabled={isGenerating}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 flex-1 min-h-0">
                <div className="lg:col-span-1 p-5 border-b lg:border-b-0 lg:border-r border-border bg-muted/40 overflow-auto min-h-0">
                  <div className="mb-4 rounded-xl border border-primary/20 bg-primary/5 p-3 space-y-2">
                    <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                      <Sparkles className="h-4 w-4 text-primary" />
                      AI Fill
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Describe the deal in plain language. AI maps it to required fields — review before Generate.
                    </p>
                    <textarea
                      value={aiFillBrief}
                      onChange={(e) => setAiFillBrief(e.target.value)}
                      disabled={isGenerating || isAiFilling}
                      placeholder="e.g. Disclosing: Acme Tech Pvt Ltd, Bengaluru. Receiving: Nova Labs LLP, Delhi. Effective 2026-09-04. Mutual NDA under Indian law."
                      className="w-full min-h-[84px] resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:opacity-60"
                    />
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={applyAiFillToFields}
                        disabled={isGenerating || isAiFilling}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
                      >
                        <Sparkles className="h-3.5 w-3.5" />
                        {isAiFilling ? 'Filling…' : 'AI Fill fields'}
                      </button>
                      <button
                        type="button"
                        onClick={applySampleFillToAiFields}
                        disabled={isGenerating || isAiFilling}
                        className="rounded-lg border border-border bg-background px-3 py-2 text-xs font-semibold text-foreground hover:bg-muted disabled:opacity-60"
                      >
                        Use sample data
                      </button>
                    </div>
                  </div>

                  <div className="text-sm font-semibold text-foreground mb-3">Required fields</div>
                  <div className="space-y-3">
                    {aiFillFields.map((f) => {
                      const value = aiFillValues[f.id] ?? '';
                      const common =
                        'w-full px-3 py-2.5 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm';

                      return (
                        <label key={f.id} className="block">
                          <div className="text-xs font-semibold text-foreground/90 mb-1">
                            {f.label} {f.required ? <span className="text-destructive">*</span> : null}
                          </div>
                          {f.type === 'textarea' ? (
                            <textarea
                              value={value}
                              onChange={(e) => setAiFillValues((prev) => ({ ...prev, [f.id]: e.target.value }))}
                              placeholder={f.placeholder}
                              className={`${common} min-h-[96px] resize-none`}
                            />
                          ) : (
                            <input
                              type={f.type}
                              value={value}
                              onChange={(e) => setAiFillValues((prev) => ({ ...prev, [f.id]: e.target.value }))}
                              placeholder={f.placeholder}
                              className={common}
                            />
                          )}
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div className="lg:col-span-2 p-6 flex flex-col min-h-0">
                  <div className="overflow-auto rounded-2xl border border-border bg-background flex-1 min-h-0">
                    <div className="px-8 py-8">
                      <div className="flex items-center justify-between gap-3">
                        <div className="text-xl font-extrabold tracking-wide text-foreground">
                          {aiEditMode ? 'Edit template' : 'Preview'}
                        </div>
                        <button
                          type="button"
                          onClick={() => setAiEditMode((v) => !v)}
                          disabled={isGenerating}
                          className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${aiEditMode
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-card text-muted-foreground border-border hover:bg-muted'
                            } disabled:opacity-60 disabled:cursor-not-allowed`}
                          title={aiEditMode ? 'Switch to preview' : 'Edit template text'}
                        >
                          {aiEditMode ? 'Done' : 'Edit'}
                        </button>
                      </div>

                      {aiEditMode ? (
                        <textarea
                          value={aiTemplateDraft}
                          onChange={(e) => setAiTemplateDraft(e.target.value)}
                          className="mt-4 w-full min-h-[360px] rounded-xl border border-border bg-card p-4 text-sm text-foreground leading-relaxed outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary placeholder:text-muted-foreground"
                          placeholder="Edit template text here..."
                        />
                      ) : (
                        <div
                          className="mt-4"
                          dangerouslySetInnerHTML={{
                            __html: renderPreviewHtml(
                              (aiTemplateDraft || aiFillTemplateText || '').trim(),
                              aiFillValues
                            ),
                          }}
                        />
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-3 mt-4 pt-4 border-t border-border">
                    <button
                      type="button"
                      onClick={closeAiFillModal}
                      className="px-5 py-2.5 rounded-xl font-semibold text-sm text-muted-foreground hover:bg-muted transition-colors"
                      disabled={isGenerating}
                    >
                      CANCEL
                    </button>
                    <button
                      type="button"
                      onClick={handleGenerateFromAiTemplate}
                      disabled={isGenerating}
                      className="px-5 py-2.5 rounded-xl font-semibold text-sm bg-primary hover:bg-primary/90 text-primary-foreground transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {isGenerating ? 'GENERATING…' : 'GENERATE & USE'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};