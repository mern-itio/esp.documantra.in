import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Sparkles, 
  FileText, 
  Download, 
  Send, 
  Loader2, 
  ArrowLeft,
  Zap,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { useAuth } from '../../components/AuthService/AuthContext';
import { aiContentService } from '../../services/aiContentService';
import toast from 'react-hot-toast';
import './AITemplateGenerator.css';

type Complexity = 'Simple' | 'Medium' | 'Complex';

interface Template {
  id: string;
  name: string;
  category: string;
  description: string;
  complexity: Complexity;
  rating: number;
  downloads: number;
  timeToComplete: string;
  isPremium: boolean;
  isFeatured: boolean;
  tags: string[];
  expertReviewed: boolean;
  jurisdictions: string[];
  fields: string[];
}

const AITemplateGenerator: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [additionalDescription, setAdditionalDescription] = useState('');
  const [generatedContent, setGeneratedContent] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [sessionId] = useState<string>(() => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);
  const [generatingMessageIndex, setGeneratingMessageIndex] = useState(0);

  // Engaging generating messages with emojis
  const generatingMessages = [
    { text: 'Crafting your document', emoji: '✨' },
    { text: 'Adding legal expertise', emoji: '⚖️' },
    { text: 'Polishing the details', emoji: '💎' },
    { text: 'Almost there', emoji: '🚀' },
    { text: 'Finalizing your template', emoji: '🎯' },
    { text: 'Making it perfect', emoji: '🌟' }
  ];

  const templates: Template[] = [
    {
      id: 'nda',
      name: 'Non-Disclosure Agreement',
      category: 'business',
      description: 'Protect confidential information in business relationships',
      complexity: 'Simple',
      rating: 4.9,
      downloads: 15420,
      timeToComplete: '5 min',
      isPremium: false,
      isFeatured: true,
      tags: ['Confidentiality', 'Business', 'Legal Protection'],
      expertReviewed: true,
      jurisdictions: ['US', 'CA', 'UK', 'AU'],
      fields: ['Company Name', 'Recipient Name', 'Effective Date', 'Jurisdiction', 'Project Description']
    },
    {
      id: 'employment-contract',
      name: 'Employment Contract',
      category: 'employment',
      description: 'Comprehensive employment agreement template',
      complexity: 'Medium',
      rating: 4.8,
      downloads: 12350,
      timeToComplete: '8 min',
      isPremium: false,
      isFeatured: true,
      tags: ['Employment', 'HR', 'Contracts'],
      expertReviewed: true,
      jurisdictions: ['US', 'CA'],
      fields: ['Employee Name', 'Position', 'Start Date', 'Salary', 'Benefits']
    },
    {
      id: 'rental-agreement',
      name: 'Residential Lease Agreement',
      category: 'real-estate',
      description: 'Standard residential rental agreement',
      complexity: 'Medium',
      rating: 4.7,
      downloads: 9870,
      timeToComplete: '10 min',
      isPremium: false,
      isFeatured: false,
      tags: ['Real Estate', 'Rental', 'Property'],
      expertReviewed: true,
      jurisdictions: ['US'],
      fields: ['Landlord Name', 'Tenant Name', 'Property Address', 'Rent Amount', 'Lease Term']
    },
    {
      id: 'service-agreement',
      name: 'Service Agreement',
      category: 'business',
      description: 'Professional services contract template',
      complexity: 'Medium',
      rating: 4.6,
      downloads: 8920,
      timeToComplete: '7 min',
      isPremium: false,
      isFeatured: false,
      tags: ['Services', 'Business', 'Freelance'],
      expertReviewed: true,
      jurisdictions: ['US', 'CA', 'UK'],
      fields: ['Service Provider', 'Client Name', 'Services Description', 'Payment Terms']
    },
    {
      id: 'partnership-agreement',
      name: 'Partnership Agreement',
      category: 'business',
      description: 'Business partnership formation document',
      complexity: 'Complex',
      rating: 4.8,
      downloads: 5430,
      timeToComplete: '15 min',
      isPremium: true,
      isFeatured: false,
      tags: ['Partnership', 'Business Formation', 'Legal'],
      expertReviewed: true,
      jurisdictions: ['US', 'CA'],
      fields: ['Partner Names', 'Business Name', 'Capital Contributions', 'Profit Sharing']
    },
    {
      id: 'loan-agreement',
      name: 'Personal Loan Agreement',
      category: 'finance',
      description: 'Simple personal loan contract',
      complexity: 'Simple',
      rating: 4.5,
      downloads: 7650,
      timeToComplete: '6 min',
      isPremium: false,
      isFeatured: false,
      tags: ['Finance', 'Loan', 'Personal'],
      expertReviewed: true,
      jurisdictions: ['US'],
      fields: ['Lender Name', 'Borrower Name', 'Loan Amount', 'Interest Rate', 'Repayment Terms']
    }
  ];

  // Set default template on mount
  useEffect(() => {
    if (!selectedTemplate && templates.length > 0) {
      setSelectedTemplate(templates[0]);
    }
  }, []);

  // Reset form data when template changes
  useEffect(() => {
    if (selectedTemplate) {
      const initialFormData: Record<string, string> = {};
      selectedTemplate.fields.forEach(field => {
        const fieldKey = field.toLowerCase().replace(/\s+/g, '');
        initialFormData[fieldKey] = '';
      });
      setFormData(initialFormData);
      setAdditionalDescription('');
      setGeneratedContent('');
      setShowSuccessAnimation(false);
    }
  }, [selectedTemplate]);

  // Cycle through generating messages every 2 seconds
  useEffect(() => {
    if (!isGenerating) {
      setGeneratingMessageIndex(0);
      return;
    }

    const interval = setInterval(() => {
      setGeneratingMessageIndex((prev) => (prev + 1) % generatingMessages.length);
    }, 2000);

    return () => clearInterval(interval);
  }, [isGenerating, generatingMessages.length]);

  const handleGenerate = async () => {
    if (!selectedTemplate) {
      toast.error('Please select a template');
      return;
    }

    const hasFormData = Object.values(formData).some(value => value.trim() !== '');
    if (!hasFormData && !additionalDescription.trim()) {
      toast.error('Please fill in at least some fields or provide additional description');
      return;
    }

    setIsGenerating(true);
    setGeneratedContent('');

    try {
      let requirementsText = `Template: ${selectedTemplate.name}\n\n`;
      
      if (hasFormData) {
        requirementsText += 'Provided Information:\n';
        selectedTemplate.fields.forEach(field => {
          const fieldKey = field.toLowerCase().replace(/\s+/g, '');
          const value = formData[fieldKey] || '';
          if (value.trim()) {
            requirementsText += `- ${field}: ${value}\n`;
          }
        });
        requirementsText += '\n';
      }

      if (additionalDescription.trim()) {
        requirementsText += `Additional Details:\n${additionalDescription.trim()}`;
      }

      const response = await aiContentService.generateContent({
        templateType: selectedTemplate.name,
        requirements: requirementsText.trim(),
        formData: formData
      });

      if (response.success && response.data.content) {
        setGeneratedContent(response.data.content);
        setShowSuccessAnimation(true);
        setTimeout(() => setShowSuccessAnimation(false), 3000);
        toast.success('Content generated successfully!');
      } else {
        toast.error('Failed to generate content. Please try again.');
      }
    } catch (error: any) {
      console.error('Error generating content:', error);
      toast.error(error.message || 'Failed to generate content. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!generatedContent) {
      toast.error('No content to download');
      return;
    }

    setIsDownloading(true);

    try {
      const response = await aiContentService.convertToPDF({
        content: generatedContent,
        documentName: selectedTemplate?.name || 'Legal Document'
      });

      if (response.success && response.data.base64) {
        aiContentService.downloadPDF(
          response.data.base64,
          `${(selectedTemplate?.name || 'Document').replace(/\s+/g, '_')}.pdf`
        );
        toast.success('PDF downloaded successfully!');
      } else {
        toast.error('Failed to generate PDF. Please try again.');
      }
    } catch (error: any) {
      console.error('Error downloading PDF:', error);
      toast.error(error.message || 'Failed to download PDF. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleSendAsEnvelope = async () => {
    if (!generatedContent) {
      toast.error('No content to send');
      return;
    }

    if (!isAuthenticated) {
      setIsSending(true);
      try {
        const response = await aiContentService.storePendingDocument({
          documentName: selectedTemplate?.name || 'Legal Document',
          content: generatedContent,
          templateType: selectedTemplate?.name || 'Unknown',
          sessionId
        });

        if (response.success) {
          localStorage.setItem('pendingDocumentId', response.data.documentId);
          localStorage.setItem('pendingSessionId', response.data.sessionId);
          toast.success('Document saved. Please login to continue.');
          navigate('/login', { state: { returnTo: '/e-sign/create', pendingDocument: response.data.documentId } });
        } else {
          toast.error('Failed to save document. Please try again.');
        }
      } catch (error: any) {
        console.error('Error storing document:', error);
        toast.error(error.message || 'Failed to save document. Please try again.');
      } finally {
        setIsSending(false);
      }
      return;
    }

    setIsSending(true);
    try {
      const response = await aiContentService.convertToPDF({
        content: generatedContent,
        documentName: selectedTemplate?.name || 'Legal Document'
      });

      if (response.success && response.data.base64) {
        navigate('/e-sign/create', {
          state: {
            documentData: {
              name: `${(selectedTemplate?.name || 'Document').replace(/\s+/g, '_')}.pdf`,
              content: response.data.base64,
              type: 'application/pdf'
            }
          }
        });
      } else {
        toast.error('Failed to prepare document. Please try again.');
      }
    } catch (error: any) {
      console.error('Error preparing document:', error);
      toast.error(error.message || 'Failed to prepare document. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FFFFFF' }}>
      {/* Header with Back Button */}
      <div className="border-b" style={{ borderColor: '#D0D0D0', backgroundColor: '#FFFFFF' }}>
        <div className="mx-auto py-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/e-sign/form-list')}
              className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 hover:bg-gray-50"
              style={{ color: '#28004D' }}
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            {/* <div className="h-6 w-px" style={{ backgroundColor: '#D0D0D0' }}></div> */}
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg">
                <Sparkles className="w-6 h-6" style={{ color: '#4D0080' }} />
              </div>
              <div>
                <h1 className="text-2xl font-bold" style={{ color: '#28004D' }}>
                  AI Template Generator
                </h1>
                <p className="text-sm" style={{ color: '#888888' }}>
                  Generate professional legal documents using AI
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-8">
        <div className="grid lg:grid-cols-12 gap-8">
          {/* Left Side: Template Selection and Form */}
          <div className="lg:col-span-7 space-y-6">
            {/* Template Selection Cards */}
            <div className="bg-white rounded-lg border p-4" style={{ borderColor: '#D0D0D0' }}>
              <h3 className="text-lg font-semibold mb-4" style={{ color: '#28004D' }}>
                Select Template
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-64 overflow-y-auto">
                {templates.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => setSelectedTemplate(template)}
                    className={`p-3 rounded-lg border text-left transition-all duration-200 ${
                      selectedTemplate?.id === template.id
                        ? 'border-2'
                        : 'border'
                    }`}
                    style={{
                      borderColor: selectedTemplate?.id === template.id ? '#4D0080' : '#D0D0D0',
                      backgroundColor: selectedTemplate?.id === template.id ? '#4D008010' : '#FFFFFF',
                      color: '#28004D'
                    }}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <span className="font-medium text-sm">{template.name}</span>
                      {selectedTemplate?.id === template.id && (
                        <CheckCircle2 className="w-4 h-4 flex-shrink-0 ml-2" style={{ color: '#4D0080' }} />
                      )}
                    </div>
                    <p className="text-xs" style={{ color: '#888888' }}>
                      {template.description}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Form Section */}
            {selectedTemplate && (
              <div className="bg-white rounded-lg border p-6" style={{ borderColor: '#D0D0D0' }}>
                <div className="mb-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 rounded-lg" >
                      <FileText className="w-5 h-5" style={{ color: '#4D0080' }} />
                    </div>
                    <div>
                      <h3 className="font-semibold" style={{ color: '#28004D' }}>
                        {selectedTemplate.name}
                      </h3>
                      <p className="text-sm" style={{ color: '#888888' }}>
                        {selectedTemplate.description}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Dynamic Form Fields */}
                <div className="mb-6">
                  <h4 className="text-sm font-semibold mb-4" style={{ color: '#28004D' }}>
                    Document Details
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedTemplate.fields.map((field, index) => {
                      const fieldKey = field.toLowerCase().replace(/\s+/g, '');
                      const fieldValue = formData[fieldKey] || '';
                      const isDescription = field.includes('Description') || field.includes('Terms') || field.includes('Address');
                      
                      return (
                        <div 
                          key={index} 
                          className={isDescription ? 'md:col-span-2' : ''}
                        >
                          <label className="block text-sm font-medium mb-2" style={{ color: '#28004D' }}>
                            {field} {(field.includes('Date') || field.includes('Name')) && (
                              <span style={{ color: '#DC2626' }}>*</span>
                            )}
                          </label>
                          {field.includes('Date') || field === 'Effective Date' || field === 'Start Date' ? (
                            <input
                              type="date"
                              value={fieldValue}
                              onChange={(e) => setFormData({ ...formData, [fieldKey]: e.target.value })}
                              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                              style={{
                                borderColor: '#D0D0D0',
                                borderRadius: '6px',
                                color: '#28004D'
                              }}
                            />
                          ) : isDescription ? (
                            <textarea
                              value={fieldValue}
                              onChange={(e) => setFormData({ ...formData, [fieldKey]: e.target.value })}
                              rows={3}
                              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all resize-none"
                              style={{
                                borderColor: '#D0D0D0',
                                borderRadius: '6px',
                                color: '#28004D'
                              }}
                              placeholder={`Enter ${field.toLowerCase()}`}
                            />
                          ) : field.includes('Jurisdiction') || field.includes('State') ? (
                            <select
                              value={fieldValue}
                              onChange={(e) => setFormData({ ...formData, [fieldKey]: e.target.value })}
                              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                              style={{
                                borderColor: '#D0D0D0',
                                borderRadius: '6px',
                                color: '#28004D'
                              }}
                            >
                              <option value="">Select {field}</option>
                              <option value="California">California</option>
                              <option value="New York">New York</option>
                              <option value="Texas">Texas</option>
                              <option value="Florida">Florida</option>
                              <option value="Illinois">Illinois</option>
                              <option value="Other">Other</option>
                            </select>
                          ) : (
                            <input
                              type="text"
                              value={fieldValue}
                              onChange={(e) => setFormData({ ...formData, [fieldKey]: e.target.value })}
                              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                              style={{
                                borderColor: '#D0D0D0',
                                borderRadius: '6px',
                                color: '#28004D'
                              }}
                              placeholder={`Enter ${field.toLowerCase()}`}
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Additional Description */}
                <div className="mb-6">
                  <label className="block text-sm font-semibold mb-3" style={{ color: '#28004D' }}>
                    Additional Details / Special Requirements
                  </label>
                  <textarea
                    value={additionalDescription}
                    onChange={(e) => setAdditionalDescription(e.target.value)}
                    placeholder="Add any additional details, special clauses, or requirements that should be included in the document..."
                    rows={6}
                    className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all resize-none"
                    style={{
                      borderColor: '#D0D0D0',
                      borderRadius: '6px',
                      color: '#28004D'
                    }}
                  />
                  <p className="text-xs mt-2" style={{ color: '#888888' }}>
                    Optional: Add any special terms, clauses, or additional information you want included.
                  </p>
                </div>

                {/* Generate Button */}
                <button
                  onClick={handleGenerate}
                  disabled={isGenerating || (!Object.values(formData).some(v => v.trim()) && !additionalDescription.trim())}
                  className="w-full py-3 px-6 rounded-lg font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 relative overflow-hidden"
                  style={{
                    backgroundColor: '#4D0080',
                    color: '#FFFFFF',
                    borderRadius: '6px'
                  }}
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span className="generating-text">
                        <span className="generating-emoji">
                          {generatingMessages[generatingMessageIndex].emoji}
                        </span>
                        {generatingMessages[generatingMessageIndex].text}...
                      </span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      <span>Generate Document</span>
                    </>
                  )}
                  {showSuccessAnimation && (
                    <div className="absolute inset-0 flex items-center justify-center bg-green-500 animate-pulse">
                      <CheckCircle2 className="w-6 h-6 text-white" />
                    </div>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Right Side: Generated Content */}
          <div className="lg:col-span-5">
            <div className="bg-white rounded-lg border sticky top-6" style={{ borderColor: '#D0D0D0' }}>
              <div className="p-6 border-b" style={{ borderColor: '#D0D0D0' }}>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg" >
                    <Zap className="w-5 h-5" style={{ color: '#4D0080' }} />
                  </div>
                  <h3 className="font-semibold" style={{ color: '#28004D' }}>
                    Generated Document
                  </h3>
                </div>
              </div>
              
              <div className="p-6 max-h-[500px] overflow-y-auto">
                {generatedContent ? (
                  <div className="prose prose-sm max-w-none">
                    <pre 
                      className="text-sm whitespace-pre-wrap font-mono leading-relaxed p-4 rounded-lg"
                      style={{ 
                        color: '#28004D',
                        backgroundColor: '#F9FAFB',
                        border: '1px solid #D0D0D0'
                      }}
                    >
                      {generatedContent}
                    </pre>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="p-4 rounded-full mx-auto mb-4 w-16 h-16 flex items-center justify-center" >
                      <Zap className="w-8 h-8" style={{ color: '#4D0080' }} />
                    </div>
                    <p className="font-medium mb-2" style={{ color: '#28004D' }}>
                      No content generated yet
                    </p>
                    <p className="text-sm" style={{ color: '#888888' }}>
                      Fill in your requirements and click "Generate Document" to create your legal document.
                    </p>
                  </div>
                )}
              </div>
              
              {generatedContent && (
                <div className="p-6 border-t space-y-3" style={{ borderColor: '#D0D0D0', backgroundColor: '#F9FAFB' }}>
                  <button
                    onClick={handleDownloadPDF}
                    disabled={isDownloading}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 rounded-lg font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                      borderColor: '#4D0080',
                      color: '#4D0080',
                      borderRadius: '6px',
                      backgroundColor: '#FFFFFF'
                    }}
                  >
                    {isDownloading ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <span>Generating PDF...</span>
                      </>
                    ) : (
                      <>
                        <Download className="h-5 w-5" />
                        <span>Download PDF</span>
                      </>
                    )}
                  </button>
                  
                  <button
                    onClick={handleSendAsEnvelope}
                    disabled={isSending}
                    className="w-full py-3 px-6 rounded-lg font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    style={{
                      backgroundColor: '#4D0080',
                      color: '#FFFFFF',
                      borderRadius: '6px'
                    }}
                  >
                    {isSending ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <span>{isAuthenticated ? 'Preparing...' : 'Saving...'}</span>
                      </>
                    ) : (
                      <>
                        <Send className="h-5 w-5" />
                        <span>{isAuthenticated ? 'Send as Envelope' : 'Login to Send as Envelope'}</span>
                      </>
                    )}
                  </button>
                  
                  {!isAuthenticated && (
                    <p className="text-xs text-center flex items-center justify-center gap-1" style={{ color: '#888888' }}>
                      <AlertCircle className="h-3 w-3" />
                      You'll be redirected to login after saving your document
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AITemplateGenerator;

