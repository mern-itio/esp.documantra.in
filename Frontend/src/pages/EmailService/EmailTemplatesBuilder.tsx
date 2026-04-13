import React, { useEffect, useMemo, useRef, useState } from 'react';
import EmailEditor from 'react-email-editor';
import { ChevronLeft, ChevronRight, CircleCheckBig, Pencil, Plus, Search, Trash2, X } from 'lucide-react';
import Swal from 'sweetalert2';
import { emailApi } from '../../services/apiHelper';

type ExportHtmlData = {
  design: unknown;
  html: string;
};

type EmailTemplate = {
  _id?: string;
  id?: string;
  name?: string;
  template_Slug?: string;
  design?: unknown;
  html?: string;
  variables?: string[];
  createdAt?: string;
  updatedAt?: string;
};

const MERGE_TAGS = {
  name: { name: 'Name', value: '{{name}}' },
  envelope_name: { name: 'Envelope Name', value: '{{envelope_name}}' },
  sender_name: { name: 'Sender Name', value: '{{sender_name}}' },
  link_for_button: { name: 'Sign Link', value: '{{link_for_button}}' }
};

const TEMPLATE_SLUG_OPTIONS = [
  { value: 'Signup', label: 'Signup' },
  { value: 'login', label: 'Login' },
  { value: 'newDeviceLogin', label: 'New Device Login' },
  { value: 'envSignRequest', label: 'Envelope Sign Request' },
  { value: 'envSignReject', label: 'Envelope Sign Reject' },
  { value: 'envSignComplete', label: 'Envelope Sign Complete' },
  { value: 'authOTP', label: 'Auth OTP' },
  { value: 'envReminder', label: 'Envelope Reminder' },
  { value: 'test', label: 'Test' }
] as const;

const extractVariables = (html: string) => {
  const matches = html.match(/{{(.*?)}}/g) || [];
  return [...new Set(matches.map((v) => v.replace(/[{}]/g, '').trim()))];
};

const getTemplateId = (t: EmailTemplate) => t._id || t.id || '';

const getRowsFromResponse = (res: unknown): EmailTemplate[] => {
  if (!res || typeof res !== 'object') return [];
  const root = res as { data?: { data?: unknown; templates?: EmailTemplate[] } | EmailTemplate[] | unknown };
  const d = root.data;
  const payload =
    d && typeof d === 'object' && d !== null && 'data' in d
      ? (d as { data: unknown }).data
      : d ?? [];
  if (Array.isArray(payload)) return payload as EmailTemplate[];
  if (payload && typeof payload === 'object' && Array.isArray((payload as { templates?: EmailTemplate[] }).templates)) {
    return (payload as { templates: EmailTemplate[] }).templates;
  }
  return [];
};

const formatDate = (dateString?: string) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

type EmailEditorHandle = {
  editor?: {
    loadDesign: (design: unknown) => void;
    exportHtml: (cb: (data: ExportHtmlData) => void) => void;
  };
};

const EmailTemplatesBuilder: React.FC = () => {
  const editorRef = useRef<EmailEditorHandle | null>(null);

  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingTemplateId, setEditingTemplateId] = useState('');
  const [initialDesign, setInitialDesign] = useState<unknown>(null);
  const [templateName, setTemplateName] = useState('');
  const [templateSlug, setTemplateSlug] = useState('');

  const itemsPerPage = 8;

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const res = await emailApi.get('/user/template/get-all/user');
      setTemplates(getRowsFromResponse(res));
    } catch (err) {
      console.error('Failed to load email templates', err);
      setTemplates([]);
      Swal.fire({
        title: 'Error',
        text: 'Failed to load email templates.',
        icon: 'error',
        confirmButtonText: 'OK'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTemplates();
  }, []);

  useEffect(() => {
    const q = searchTerm.trim().toLowerCase();
    const filtered = templates.filter((t) => {
      if (!q) return true;
      return (
        (t.name || '').toLowerCase().includes(q) ||
        (t.template_Slug || '').toLowerCase().includes(q) ||
        getTemplateId(t).toLowerCase().includes(q)
      );
    });
    setFilteredTemplates(filtered);
    setCurrentPage(1);
  }, [templates, searchTerm]);

  const totalPages = Math.ceil(filteredTemplates.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentTemplates = filteredTemplates.slice(startIndex, startIndex + itemsPerPage);

  const getPaginationPages = (): (number | string)[] => {
    if (totalPages <= 4) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    return [1, 2, '...', totalPages - 1, totalPages];
  };

  const openCreateModal = () => {
    setIsEditing(false);
    setEditingTemplateId('');
    setTemplateName('');
    setTemplateSlug('');
    setInitialDesign(null);
    setShowModal(true);
  };

  const openEditModal = (template: EmailTemplate) => {
    setIsEditing(true);
    setEditingTemplateId(getTemplateId(template));
    setTemplateName(template.name || '');
    setTemplateSlug(template.template_Slug || '');
    setInitialDesign(template.design || null);
    setShowModal(true);
  };

  const closeModal = () => {
    if (submitting) return;
    setShowModal(false);
  };

  const onEditorReady = () => {
    if (isEditing && initialDesign && editorRef.current?.editor) {
      editorRef.current.editor.loadDesign(initialDesign);
    }
  };

  const upsertTemplate = () => {
    if (!templateName.trim()) {
      Swal.fire({
        title: 'Validation Error',
        text: 'Template name is required.',
        icon: 'warning',
        confirmButtonText: 'OK'
      });
      return;
    }
    if (!templateSlug.trim()) {
      Swal.fire({
        title: 'Validation Error',
        text: 'Template slug is required.',
        icon: 'warning',
        confirmButtonText: 'OK'
      });
      return;
    }
    const isValidSlug = TEMPLATE_SLUG_OPTIONS.some((opt) => opt.value === templateSlug);
    if (!isValidSlug) {
      Swal.fire({
        title: 'Validation Error',
        text: 'Please select a valid template slug.',
        icon: 'warning',
        confirmButtonText: 'OK'
      });
      return;
    }

    editorRef.current?.editor?.exportHtml(async (data: ExportHtmlData) => {
      setSubmitting(true);
      try {
        const payload = {
          name: templateName.trim(),
          template_Slug: templateSlug.trim(),
          design: data.design,
          html: data.html,
          variables: extractVariables(data.html)
        };

        if (isEditing && editingTemplateId) {
          await emailApi.put(`/user/template/update/${encodeURIComponent(editingTemplateId)}`, payload);
        } else {
          await emailApi.post('/user/template/create', payload);
        }

        setShowModal(false);
        setInitialDesign(null);
        await loadTemplates();
        Swal.fire({
          title: 'Success',
          text: isEditing ? 'Email template updated successfully.' : 'Email template created successfully.',
          icon: 'success',
          confirmButtonText: 'OK'
        });
      } catch (err) {
        console.error('Failed to save email template', err);
        Swal.fire({
          title: 'Error',
          text: isEditing ? 'Failed to update template.' : 'Failed to create template.',
          icon: 'error',
          confirmButtonText: 'OK'
        });
      } finally {
        setSubmitting(false);
      }
    });
  };

  const handleDelete = async (template: EmailTemplate) => {
    const id = getTemplateId(template);
    if (!id) return;

    const result = await Swal.fire({
      title: 'Are you sure?',
      text: 'This will permanently delete this email template.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel'
    });

    if (!result.isConfirmed) return;

    try {
      await emailApi.delete(`/user/template/delete/${encodeURIComponent(id)}`);
      await loadTemplates();
      Swal.fire({
        title: 'Deleted!',
        text: 'Email template has been deleted.',
        icon: 'success',
        confirmButtonText: 'OK'
      });
    } catch (err) {
      console.error('Failed to delete email template', err);
      Swal.fire({
        title: 'Error',
        text: 'Failed to delete template.',
        icon: 'error',
        confirmButtonText: 'OK'
      });
    }
  };

  const rows = useMemo(() => {
    return currentTemplates.map((template, idx) => ({
      ...template,
      serial: startIndex + idx + 1
    }));
  }, [currentTemplates, startIndex]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/40 dark:from-background dark:to-muted/20 py-8 px-4 sm:px-6 lg:px-8">
      <div className="mb-6">
        <div className="flex flex-col lg:flex-row gap-3 lg:items-center">
          <div className="flex-1">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search templates by name, slug or id..."
                className="w-full pl-10 pr-12 py-2.5 border border-input rounded-lg focus:outline-none shadow-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 bg-background hover:border-muted-foreground/30 text-sm text-foreground placeholder:text-muted-foreground"
              />

              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 bg-muted text-foreground text-xs rounded-lg hover:bg-accent hover:scale-110 transition-all duration-200"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          <button
            onClick={openCreateModal}
            className="group inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-all duration-200 shadow-md hover:shadow-lg hover:scale-105 active:scale-100"
          >
            <Plus className="w-4 h-4 transition-transform duration-200 ease-in-out group-hover:rotate-90" />
            Create Template
          </button>
        </div>
      </div>

      <div className="relative">
        <div className="flex flex-col min-h-[calc(100vh-210px)] overflow-x-auto relative rounded-lg border border-border bg-card text-card-foreground shadow-sm">
          <table className="min-w-full divide-y divide-border" style={{ tableLayout: 'fixed', width: '100%' }}>
            
            <thead className="bg-muted/50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider w-20">S.No.</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Template Name</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Slug</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Variables</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Updated At</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider w-56">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-card divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center text-muted-foreground">
                    Loading templates...
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-20">
                    <div className="flex flex-col items-center justify-center text-center h-[300px]">

                      {/* Icon */}
                      <div className="relative flex items-center justify-center">
                        <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
                          <div className="w-14 h-18 rounded-lg bg-card shadow-md border border-border flex flex-col items-center justify-center">
                            <div className="w-10 h-2 bg-primary/15 rounded mb-1" />
                            <div className="w-8 h-2 bg-primary/15 rounded mb-1" />
                            <div className="w-6 h-2 bg-primary/15 rounded" />
                          </div>
                        </div>
                        <span className="absolute -bottom-1 -right-1 text-2xl"><CircleCheckBig className="h-6 w-6 text-green-600 dark:text-green-400" /></span>
                      </div>

                      {/* Title */}
                      <h3 className="text-lg font-semibold text-foreground">
                        No email templates found
                      </h3>

                      {/* Subtitle with clickable Create */}
                      <p className="text-sm text-muted-foreground mt-2 max-w-sm">
                        {searchTerm ? (
                          "Try adjusting your search terms."
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={openCreateModal}
                              className="text-primary font-medium cursor-pointer hover:underline"
                            >
                              Create
                            </button>{" "}
                            your first template to get started.
                          </>
                        )}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                rows.map((template) => (
                  <tr key={getTemplateId(template)} className="group hover:bg-muted/40 transition-all duration-200 border-l-4 border-l-transparent hover:border-l-primary">
                    <td className="px-6 py-4 text-sm text-foreground">{template.serial}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-primary truncate">{template.name || '-'}</td>
                    <td className="px-6 py-4 text-sm text-foreground">{template.template_Slug || '-'}</td>
                    <td className="px-6 py-4 text-sm text-muted-foreground truncate">
                      {Array.isArray(template.variables) && template.variables.length ? template.variables.join(', ') : '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-foreground">{formatDate(template.updatedAt || template.createdAt)}</td>
                    <td className="px-6 py-4 text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(template)}
                          className="px-4 py-2 border border-primary rounded-lg text-sm font-medium text-primary hover:bg-primary/10 transition-all duration-200 shadow-sm hover:shadow-md active:scale-95 inline-flex items-center gap-2"
                        >
                          <Pencil className="w-4 h-4" />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(template)}
                          className="px-4 py-2 border border-red-300 dark:border-red-800 rounded-lg text-sm font-medium text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 hover:border-red-400 dark:hover:border-red-700 transition-all duration-200 shadow-sm hover:shadow-md active:scale-95 inline-flex items-center gap-2"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="bg-card px-4 py-3 flex items-center justify-end border-t border-border sm:px-6">
            <nav className="relative z-0 inline-flex rounded-sm shadow-sm -space-x-px" aria-label="Pagination">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-3 py-2 rounded-l-lg border border-border bg-background text-sm font-medium text-muted-foreground hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-background disabled:hover:text-muted-foreground disabled:hover:border-border"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>

              {getPaginationPages().map((page, index) => {
                if (page === '...') {
                  return (
                    <span
                      key={`ellipsis-${index}`}
                      className="relative inline-flex items-center px-4 py-2 border border-border bg-background text-sm font-medium text-muted-foreground"
                    >
                      ...
                    </span>
                  );
                }
                const pageNum = page as number;
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium transition-all duration-200 ${pageNum === currentPage
                      ? 'z-10 bg-primary border-primary text-primary-foreground shadow-md'
                      : 'bg-background border-border text-muted-foreground hover:bg-primary hover:text-primary-foreground hover:border-primary'
                      }`}
                  >
                    {pageNum}
                  </button>
                );
              })}

              <button
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="relative inline-flex items-center px-3 py-2 rounded-r-lg border border-border bg-background text-sm font-medium text-muted-foreground hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-background disabled:hover:text-muted-foreground disabled:hover:border-border"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </nav>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 dark:bg-black/60" onClick={closeModal} />
          <div className="relative bg-card text-card-foreground border border-border rounded-2xl shadow-2xl w-full max-w-7xl p-6 max-h-[95vh] overflow-y-auto">
            <div className="flex items-start justify-between mb-6">
              <h3 className="text-[22px] font-semibold text-foreground">
                {isEditing ? 'Edit Email Template' : 'Create Email Template'}
              </h3>
              <button
                onClick={closeModal}
                className="text-muted-foreground hover:text-foreground transition-colors"
                disabled={submitting}
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Template Name <span className="text-destructive">*</span>
                </label>
                <input
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  placeholder="Welcome Email"
                  className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary/30 focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Template Slug <span className="text-destructive">*</span>
                </label>
                <select
                  value={templateSlug}
                  onChange={(e) => setTemplateSlug(e.target.value)}
                  className="w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary bg-background text-foreground"
                >
                  <option value="">Select Template Slug</option>
                  {TEMPLATE_SLUG_OPTIONS.map((slug) => (
                    <option key={slug.value} value={slug.value}>
                      {slug.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mb-4 p-3 bg-primary/5 border border-primary/20 rounded-lg">
              <p className="text-sm text-foreground">
                Available variables: <strong>{Object.values(MERGE_TAGS).map((tag) => tag.value).join(', ')}</strong>
              </p>
            </div>

            <div className="h-[620px] border border-border rounded-lg overflow-hidden bg-background">
              <EmailEditor ref={editorRef} onReady={onEditorReady} options={{ mergeTags: MERGE_TAGS }} />
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 mt-4 border-t border-border">
              <button
                type="button"
                onClick={closeModal}
                disabled={submitting}
                className="px-4 py-2 text-sm font-medium text-foreground bg-muted rounded-lg hover:bg-accent transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={upsertTemplate}
                disabled={submitting}
                className="px-5 py-2 text-sm font-medium text-primary-foreground bg-primary rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {submitting ? (isEditing ? 'Updating...' : 'Creating...') : isEditing ? 'Update Template' : 'Create Template'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmailTemplatesBuilder;