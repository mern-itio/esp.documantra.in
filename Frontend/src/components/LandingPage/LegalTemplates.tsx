import { useState, useEffect } from 'react'
import { FileText, Download, Star, Clock, Zap, Shield, Loader2, Sparkles, Send, AlertCircle } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../AuthService/AuthContext'
import { aiContentService } from '../../services/aiContentService'
import toast from 'react-hot-toast'

type Complexity = 'Simple' | 'Medium' | 'Complex'

interface Template {
  id: string
  name: string
  category: string
  description: string
  complexity: Complexity
  rating: number
  downloads: number
  timeToComplete: string
  isPremium: boolean
  isFeatured: boolean
  tags: string[]
  expertReviewed: boolean
  jurisdictions: string[]
  fields: string[]
}

const LegalTemplates = () => {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null)
  const [formData, setFormData] = useState<Record<string, string>>({})
  const [additionalDescription, setAdditionalDescription] = useState('')
  const [generatedContent, setGeneratedContent] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [sessionId] = useState<string>(() => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`)

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
  ]

  const filteredTemplates = templates

  // Set default template on mount
  useEffect(() => {
    if (!selectedTemplate && templates.length > 0) {
      setSelectedTemplate(templates[0])
    }
  }, [])

  // Reset form data when template changes
  useEffect(() => {
    if (selectedTemplate) {
      // Initialize form data with empty values for all fields
      const initialFormData: Record<string, string> = {}
      selectedTemplate.fields.forEach(field => {
        const fieldKey = field.toLowerCase().replace(/\s+/g, '')
        initialFormData[fieldKey] = ''
      })
      setFormData(initialFormData)
      setAdditionalDescription('')
      setGeneratedContent('')
    }
  }, [selectedTemplate])


  const handleGenerate = async () => {
    if (!selectedTemplate) {
      toast.error('Please select a template')
      return
    }

    // Validate that at least some form fields are filled
    const hasFormData = Object.values(formData).some(value => value.trim() !== '')
    if (!hasFormData && !additionalDescription.trim()) {
      toast.error('Please fill in at least some fields or provide additional description')
      return
    }

    setIsGenerating(true)
    setGeneratedContent('')

    try {
      // Build requirements string from form data and additional description
      let requirementsText = `Template: ${selectedTemplate.name}\n\n`
      
      // Add form field data
      if (hasFormData) {
        requirementsText += 'Provided Information:\n'
        selectedTemplate.fields.forEach(field => {
          const fieldKey = field.toLowerCase().replace(/\s+/g, '')
          const value = formData[fieldKey] || ''
          if (value.trim()) {
            requirementsText += `- ${field}: ${value}\n`
          }
        })
        requirementsText += '\n'
      }

      // Add additional description
      if (additionalDescription.trim()) {
        requirementsText += `Additional Details:\n${additionalDescription.trim()}`
      }

      const response = await aiContentService.generateContent({
        templateType: selectedTemplate.name,
        requirements: requirementsText.trim(),
        formData: formData
      })

      if (response.success && response.data.content) {
        setGeneratedContent(response.data.content)
        toast.success('Content generated successfully!')
      } else {
        toast.error('Failed to generate content. Please try again.')
      }
    } catch (error: any) {
      console.error('Error generating content:', error)
      toast.error(error.message || 'Failed to generate content. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleDownloadPDF = async () => {
    if (!generatedContent) {
      toast.error('No content to download')
      return
    }

    setIsDownloading(true)

    try {
      const response = await aiContentService.convertToPDF({
        content: generatedContent,
        documentName: selectedTemplate?.name || 'Legal Document'
      })

      if (response.success && response.data.base64) {
        aiContentService.downloadPDF(
          response.data.base64,
          `${(selectedTemplate?.name || 'Document').replace(/\s+/g, '_')}.pdf`
        )
        toast.success('PDF downloaded successfully!')
      } else {
        toast.error('Failed to generate PDF. Please try again.')
      }
    } catch (error: any) {
      console.error('Error downloading PDF:', error)
      toast.error(error.message || 'Failed to download PDF. Please try again.')
    } finally {
      setIsDownloading(false)
    }
  }

  const handleSendAsEnvelope = async () => {
    if (!generatedContent) {
      toast.error('No content to send')
      return
    }

    if (!isAuthenticated) {
      // Store document and redirect to login
      setIsSending(true)
      try {
        const response = await aiContentService.storePendingDocument({
          documentName: selectedTemplate?.name || 'Legal Document',
          content: generatedContent,
          templateType: selectedTemplate?.name || 'Unknown',
          sessionId
        })

        if (response.success) {
          // Store in localStorage for after login
          localStorage.setItem('pendingDocumentId', response.data.documentId)
          localStorage.setItem('pendingSessionId', response.data.sessionId)
          toast.success('Document saved. Please login to continue.')
          navigate('/login', { state: { returnTo: '/e-sign/create', pendingDocument: response.data.documentId } })
        } else {
          toast.error('Failed to save document. Please try again.')
        }
      } catch (error: any) {
        console.error('Error storing document:', error)
        toast.error(error.message || 'Failed to save document. Please try again.')
      } finally {
        setIsSending(false)
      }
      return
    }

    // User is authenticated - convert to PDF and navigate to envelope creator
    setIsSending(true)
    try {
      const response = await aiContentService.convertToPDF({
        content: generatedContent,
        documentName: selectedTemplate?.name || 'Legal Document'
      })

      if (response.success && response.data.base64) {
        // Pass the base64 through state to envelope creator
        navigate('/e-sign/create', {
          state: {
            documentData: {
              name: `${(selectedTemplate?.name || 'Document').replace(/\s+/g, '_')}.pdf`,
              content: response.data.base64,
              type: 'application/pdf'
            }
          }
        })
      } else {
        toast.error('Failed to prepare document. Please try again.')
      }
    } catch (error: any) {
      console.error('Error preparing document:', error)
      toast.error(error.message || 'Failed to prepare document. Please try again.')
    } finally {
      setIsSending(false)
    }
  }


  return (
    <section id="legal-templates" className="section-padding bg-gray-50">
      <div className="container-max">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            AI-Powered Legal Document Generator
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Generate professional legal documents in minutes using AI. Simply describe your requirements and get a complete, ready-to-use document.
          </p>
          
          {/* Stats */}
          <div className="flex flex-wrap justify-center gap-8 mb-8">
            <div className="text-center">
              <div className="text-2xl font-bold text-[#260559]/60">500K+</div>
              <div className="text-sm text-gray-600">Documents Created</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-[#260559]/60">4.9★</div>
              <div className="text-sm text-gray-600">Average Rating</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-[#260559]/60">45+</div>
              <div className="text-sm text-gray-600">Legal Templates</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-[#260559]/60">AI</div>
              <div className="text-sm text-gray-600">Powered</div>
            </div>
          </div>
        </div>

        {/* Template Tabs at Top */}
        <div className="bg-white rounded-xl shadow-lg p-4 mb-8">
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {filteredTemplates.map((template) => (
              <button
                key={template.id}
                onClick={() => {
                  setSelectedTemplate(template)
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-all duration-200 ${
                  selectedTemplate?.id === template.id
                    ? 'bg-[#260559] text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <FileText className="h-4 w-4" />
                <span>{template.name}</span>
                {template.isFeatured && (
                  <span className="bg-orange-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                    ⭐
                  </span>
                )}
                {template.isPremium && (
                  <span className="bg-purple-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                    Pro
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Main Content - Form Left, Generated Content Right */}
        <div className="grid lg:grid-cols-12 gap-8">
          {/* Left: Form with broader width */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white rounded-xl shadow-lg p-6 sticky top-6">
              {selectedTemplate && (
                <>
                  <div className="bg-[#260559]/10 rounded-lg p-4 mb-6">
                    <div className="flex items-center gap-3 mb-2">
                      <FileText className="h-5 w-5 text-[#260559]/60" />
                      <span className="font-medium text-[#260559]">{selectedTemplate.name}</span>
                    </div>
                    <p className="text-sm text-[#260559]/70 mb-3">{selectedTemplate.description}</p>
                    
                    <div className="flex items-center gap-4 text-xs text-[#260559]/70">
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 text-yellow-500 fill-current" />
                        <span>{selectedTemplate.rating}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>{selectedTemplate.timeToComplete}</span>
                      </div>
                      {selectedTemplate.expertReviewed && (
                        <div className="flex items-center gap-1">
                          <Shield className="h-3 w-3 text-green-500" />
                          <span>Expert Reviewed</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Dynamic Form Fields */}
                  <div className="mb-6">
                    <h4 className="text-sm font-semibold text-gray-900 mb-3">Document Details</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {selectedTemplate.fields.map((field, index) => {
                        const fieldKey = field.toLowerCase().replace(/\s+/g, '')
                        const fieldValue = formData[fieldKey] || ''
                        const isDescription = field.includes('Description') || field.includes('Terms') || field.includes('Address')
                        
                        return (
                          <div 
                            key={index} 
                            className={isDescription ? 'md:col-span-2' : ''}
                          >
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              {field} {field.includes('Date') || field.includes('Name') ? <span className="text-red-500">*</span> : ''}
                            </label>
                            {field.includes('Date') || field === 'Effective Date' || field === 'Start Date' ? (
                              <input
                                type="date"
                                value={fieldValue}
                                onChange={(e) => setFormData({ ...formData, [fieldKey]: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                              />
                            ) : isDescription ? (
                              <textarea
                                value={fieldValue}
                                onChange={(e) => setFormData({ ...formData, [fieldKey]: e.target.value })}
                                rows={3}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                                placeholder={`Enter ${field.toLowerCase()}`}
                              />
                            ) : field.includes('Jurisdiction') || field.includes('State') ? (
                              <select
                                value={fieldValue}
                                onChange={(e) => setFormData({ ...formData, [fieldKey]: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
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
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                placeholder={`Enter ${field.toLowerCase()}`}
                              />
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Additional Description */}
                  <div className="mb-6">
                    <label className="block text-base font-semibold text-gray-900 mb-3">
                      Additional Details / Special Requirements
                    </label>
                    <textarea
                      value={additionalDescription}
                      onChange={(e) => setAdditionalDescription(e.target.value)}
                      placeholder="Add any additional details, special clauses, or requirements that should be included in the document..."
                      rows={8}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                    />
                    <p className="text-xs text-gray-500 mt-2">
                      Optional: Add any special terms, clauses, or additional information you want included.
                    </p>
                  </div>

                  <button
                    onClick={handleGenerate}
                    disabled={isGenerating || (!Object.values(formData).some(v => v.trim()) && !additionalDescription.trim())}
                    className="w-full bg-[#260559] text-white py-3 px-6 rounded-lg font-semibold hover:bg-[#260559]/90 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-5 w-5" />
                        Generate Document
                      </>
                    )}
                  </button>
                </>
              )}

              {!selectedTemplate && (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Select a template to get started</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Side: Generated Content */}
          <div className="lg:col-span-5">
            <div className="bg-white rounded-xl shadow-lg sticky top-6">
              <div className="p-6 border-b border-gray-200">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Zap className="h-5 w-5 text-yellow-500" />
                  Generated Document
                </h3>
              </div>
              
              <div className="p-6 max-h-[600px] overflow-y-auto">
                {generatedContent ? (
                  <div className="prose prose-sm max-w-none">
                    <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono leading-relaxed bg-gray-50 p-4 rounded-lg">
                      {generatedContent}
                    </pre>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Zap className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 mb-2">No content generated yet</p>
                    <p className="text-sm text-gray-400">
                      Fill in your requirements and click "Generate Document" to create your legal document.
                    </p>
                  </div>
                )}
              </div>
              
              {generatedContent && (
                <div className="p-6 border-t border-gray-200 bg-gray-50 rounded-b-xl space-y-3">
                  <button
                    onClick={handleDownloadPDF}
                    disabled={isDownloading}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-[#260559] text-[#260559] rounded-lg font-semibold hover:bg-[#260559]/10 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isDownloading ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Generating PDF...
                      </>
                    ) : (
                      <>
                        <Download className="h-5 w-5" />
                        Download PDF
                      </>
                    )}
                  </button>
                  
                  <button
                    onClick={handleSendAsEnvelope}
                    disabled={isSending}
                    className="w-full bg-[#260559] text-white py-3 px-6 rounded-lg font-semibold hover:bg-[#260559]/90 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isSending ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        {isAuthenticated ? 'Preparing...' : 'Saving...'}
                      </>
                    ) : (
                      <>
                        <Send className="h-5 w-5" />
                        {isAuthenticated ? 'Send as Envelope' : 'Login to Send as Envelope'}
                      </>
                    )}
                  </button>
                  
                  {!isAuthenticated && (
                    <p className="text-xs text-gray-500 text-center flex items-center justify-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      You'll be redirected to login after saving your document
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16">
          <div className="p-8 mb-12 text-white rounded-sm bg-gradient-to-r from-[#260559] via-[#4b0ea0] to-[#7b2fff]">
            <h3 className="text-2xl font-bold mb-4">
              Need a Custom Legal Document?
            </h3>
            <p className="text-primary-100 mb-6 max-w-2xl mx-auto">
              Our legal experts can create custom documents tailored to your specific needs. 
              Get professional legal documents drafted by experienced attorneys.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/contact-sales">
                <button className="bg-white text-[#260559]/80 hover:bg-gray-100 font-semibold py-3 px-8 rounded-lg transition-all duration-200">
                  Request Custom Document
                </button>
              </Link>
              <Link to="/contact-sales">
                <button className="border-2 border-white text-white hover:bg-white hover:text-[#260559] font-semibold py-3 px-8 rounded-lg transition-all duration-200">
                  Schedule Consultation
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default LegalTemplates
