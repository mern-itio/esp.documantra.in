import React, { useEffect, useMemo, useRef, useState } from 'react';
import EmailEditor from 'react-email-editor';
import { ChevronLeft, ChevronRight, Pencil, Plus, Search, Trash2, X } from 'lucide-react';
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

const getRowsFromResponse = (res: any): EmailTemplate[] => {
  const payload = res?.data?.data ?? res?.data ?? [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.templates)) return payload.templates;
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

const EmailTemplatesBuilder: React.FC = () => {
  const editorRef = useRef<any>(null);

  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingTemplateId, setEditingTemplateId] = useState('');
  const [initialDesign, setInitialDesign] = useState<any>(null);
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
    <div>
      <div className="mb-6">
        <div className="flex flex-col lg:flex-row gap-3 lg:items-center">
          <div className="flex-1">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search templates by name, slug or id..."
                className="w-full pl-10 pr-12 py-2.5 border border-gray-300 rounded-lg focus:outline-none shadow-sm focus:ring-2 focus:ring-[#3E2B66]/20 focus:border-[#3E2B66] transition-all duration-200 bg-white hover:border-gray-400 text-sm"
              />

              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-lg hover:bg-gray-200 hover:scale-110 transition-all duration-200"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          <button
            onClick={openCreateModal}
            className="group inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#260559] to-[#3E2B66] text-white rounded-lg text-sm font-medium hover:from-[#3E2B66] hover:to-[#4d3577] transition-all duration-200 shadow-md hover:shadow-lg hover:scale-105 active:scale-100"
          >
            <Plus className="w-4 h-4 transition-transform duration-200 ease-in-out group-hover:rotate-90" />
            Create Template
          </button>
        </div>
      </div>

      <div className="relative">
        <div className="flex flex-col min-h-[calc(100vh-210px)] overflow-x-auto relative">
          <table className="min-w-full divide-y divide-gray-200" style={{ tableLayout: 'fixed', width: '100%' }}>
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-20">S.No.</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Template Name</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Slug</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Variables</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Updated At</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider w-56">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center text-gray-500">
                    Loading templates...
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center">
                    <h3 className="text-lg font-semibold text-[#3E2B66]">No email templates found</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {searchTerm ? 'Try adjusting your search terms.' : 'Create your first template to get started.'}
                    </p>
                  </td>
                </tr>
              ) : (
                rows.map((template) => (
                  <tr key={getTemplateId(template)} className="group hover:bg-gradient-to-r hover:from-purple-50/30 hover:to-transparent transition-all duration-200 border-l-4 border-l-transparent hover:border-l-[#3E2B66]">
                    <td className="px-6 py-4 text-sm text-gray-900">{template.serial}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-[#3E2B66] truncate">{template.name || '-'}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{template.template_Slug || '-'}</td>
                    <td className="px-6 py-4 text-sm text-gray-700 truncate">
                      {Array.isArray(template.variables) && template.variables.length ? template.variables.join(', ') : '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{formatDate(template.updatedAt || template.createdAt)}</td>
                    <td className="px-6 py-4 text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(template)}
                          className="px-4 py-2 border border-[#3E2B66] rounded-lg text-sm font-medium text-[#3E2B66] hover:bg-purple-50 hover:border-[#4d3577] transition-all duration-200 shadow-sm hover:shadow-md active:scale-95 inline-flex items-center gap-2"
                        >
                          <Pencil className="w-4 h-4" />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(template)}
                          className="px-4 py-2 border border-red-300 rounded-lg text-sm font-medium text-red-700 hover:bg-red-50 hover:border-red-400 transition-all duration-200 shadow-sm hover:shadow-md active:scale-95 inline-flex items-center gap-2"
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
          <div className="bg-white px-4 py-3 flex items-center justify-end border-t border-gray-200 sm:px-6">
            <nav className="relative z-0 inline-flex rounded-sm shadow-sm -space-x-px" aria-label="Pagination">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-3 py-2 rounded-l-lg border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-[#3E2B66] hover:text-white hover:border-[#3E2B66] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-gray-500 disabled:hover:border-gray-300"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>

              {getPaginationPages().map((page, index) => {
                if (page === '...') {
                  return (
                    <span
                      key={`ellipsis-${index}`}
                      className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500"
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
                    className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium transition-all duration-200 ${
                      pageNum === currentPage
                        ? 'z-10 bg-[#3E2B66] border-[#3E2B66] text-white shadow-md'
                        : 'bg-white border-gray-300 text-gray-500 hover:bg-[#3E2B66] hover:text-white hover:border-[#3E2B66]'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}

              <button
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="relative inline-flex items-center px-3 py-2 rounded-r-lg border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-[#3E2B66] hover:text-white hover:border-[#3E2B66] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-gray-500 disabled:hover:border-gray-300"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </nav>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={closeModal} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-7xl p-6 max-h-[95vh] overflow-y-auto">
            <div className="flex items-start justify-between mb-6">
              <h3 className="text-[22px] font-semibold text-[#3E2B66]">
                {isEditing ? 'Edit Email Template' : 'Create Email Template'}
              </h3>
              <button
                onClick={closeModal}
                className="text-gray-500 hover:text-gray-700 transition-colors"
                disabled={submitting}
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Template Name <span className="text-red-500">*</span>
                </label>
                <input
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  placeholder="Welcome Email"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3E2B66] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Template Slug <span className="text-red-500">*</span>
                </label>
                <select
                  value={templateSlug}
                  onChange={(e) => setTemplateSlug(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3E2B66] focus:border-transparent bg-white"
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

            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                Available variables: <strong>{Object.values(MERGE_TAGS).map((tag) => tag.value).join(', ')}</strong>
              </p>
            </div>

            <div className="h-[620px] border border-gray-200 rounded-lg overflow-hidden">
              <EmailEditor ref={editorRef} onReady={onEditorReady} options={{ mergeTags: MERGE_TAGS }} />
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 mt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={closeModal}
                disabled={submitting}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={upsertTemplate}
                disabled={submitting}
                className="px-5 py-2 text-sm font-medium text-white bg-[#3E2B66] rounded-lg hover:bg-[#4d3577] transition-colors disabled:opacity-50"
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