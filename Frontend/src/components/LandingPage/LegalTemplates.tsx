import { useState, useEffect } from 'react'
import { FileText, Eye, Download, Search, Filter, Star, Clock, Users, Check, Zap, Shield, Heart, Home, Briefcase, DollarSign, Scale, UserCheck} from 'lucide-react'
import { Link } from 'react-router-dom'

type FormData = {
  companyName: string
  recipientName: string
  effectiveDate: string
  jurisdiction: string
  projectDescription: string
  duration: string
  compensation: string
  [key: string]: string
}

type Complexity = 'Simple' | 'Medium' | 'Complex'

const LegalTemplates = () => {
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedTemplate, setSelectedTemplate] = useState('nda')
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('popularity')
  const [showFilters, setShowFilters] = useState(false)
  // const [activeTab, setActiveTab] = useState('smart-templates')
  const [formData, setFormData] = useState<FormData>({
    companyName: 'Acme Corporation',
    recipientName: 'John Smith',
    effectiveDate: '2025-01-15',
    jurisdiction: 'California',
    projectDescription: 'Software Development Project',
    duration: '2 years',
    compensation: '$75,000'
  })
  const [lastUpdatedField, setLastUpdatedField] = useState('')

  // Helper to highlight updated value in preview string
  const highlightValue = (fieldKey: string, value: string) => {
    if (lastUpdatedField === fieldKey && value) {
      // Escape value for regex
      const escaped = value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      return { value, regex: new RegExp(escaped, 'g') }
    }
    return null
  }

  const generatePreviewString = () => {
    let preview = ''
    if (selectedTemplate === 'nda') {
      preview = `NON-DISCLOSURE AGREEMENT\n\nThis Non-Disclosure Agreement ("Agreement") is entered into on ${formData.effectiveDate} between ${formData.companyName} ("Disclosing Party") and ${formData.recipientName} ("Receiving Party").\n\nRECITALS\n\nWHEREAS, the Disclosing Party possesses certain confidential and proprietary information related to ${formData.projectDescription};\n\nWHEREAS, the Receiving Party desires to receive such confidential information for the purpose of evaluating potential business opportunities;\n\nNOW, THEREFORE, in consideration of the mutual covenants contained herein, the parties agree as follows:\n\n1. DEFINITION OF CONFIDENTIAL INFORMATION\nFor purposes of this Agreement, "Confidential Information" shall include all information, technical data, trade secrets, know-how, research, product plans, products, services, customers, customer lists, markets, software, developments, inventions, processes, formulas, technology, designs, drawings, engineering, hardware configuration information, marketing, finances, or other business information disclosed by the Disclosing Party.\n\n2. OBLIGATIONS OF RECEIVING PARTY\nThe Receiving Party agrees to:\na) Hold all Confidential Information in strict confidence;\nb) Not disclose any Confidential Information to third parties without prior written consent;\nc) Use Confidential Information solely for the purpose of evaluating potential business opportunities;\nd) Take reasonable precautions to protect the confidentiality of the information.\n\n3. TERM AND TERMINATION\nThis Agreement shall remain in effect for a period of ${formData.duration} from the date first written above, unless terminated earlier by mutual written consent of the parties.\n\n4. RETURN OF MATERIALS\nUpon termination of this Agreement, the Receiving Party shall promptly return or destroy all documents, materials, and other tangible manifestations of Confidential Information.\n\n5. GOVERNING LAW\nThis Agreement shall be governed by and construed in accordance with the laws of the State of ${formData.jurisdiction}, without regard to its conflict of laws principles.\n\n6. REMEDIES\nThe Receiving Party acknowledges that any breach of this Agreement may cause irreparable harm to the Disclosing Party, and that monetary damages may be inadequate to compensate for such breach.\n\nIN WITNESS WHEREOF, the parties have executed this Agreement as of the date first written above.\n\nDISCLOSING PARTY:                    RECEIVING PARTY:\n\n_________________________          _________________________\n${formData.companyName}                    ${formData.recipientName}\n\nBy: _____________________          By: _____________________\nName:                              Name:\nTitle:                             Title:\nDate:                              Date:`
    } else if (selectedTemplate === 'employment-contract') {
      preview = `EMPLOYMENT AGREEMENT\n\nThis Employment Agreement ("Agreement") is entered into on ${formData.effectiveDate} between ${formData.companyName} ("Company") and ${formData.recipientName} ("Employee").\n\n1. POSITION AND DUTIES\nEmployee is hereby employed as [Position Title] and agrees to perform such duties and responsibilities as may be assigned by the Company.\n\n2. COMPENSATION\nEmployee shall receive an annual salary of ${formData.compensation}, payable in accordance with Company's standard payroll practices.\n\n3. BENEFITS\nEmployee shall be entitled to participate in all employee benefit programs maintained by the Company.\n\n4. TERM OF EMPLOYMENT\nThis Agreement shall commence on [Start Date] and shall continue until terminated in accordance with the provisions herein.\n\n5. CONFIDENTIALITY\nEmployee agrees to maintain the confidentiality of all proprietary information of the Company.\n\n6. GOVERNING LAW\nThis Agreement shall be governed by the laws of ${formData.jurisdiction}.\n\nIN WITNESS WHEREOF, the parties have executed this Agreement.\n\nCOMPANY:                           EMPLOYEE:\n\n_________________________          _________________________\n${formData.companyName}                    ${formData.recipientName}`
    } else {
      preview = `DOCUMENT PREVIEW\n\nThis document will be generated based on your selections and form inputs. Please fill out the required fields to see a complete preview.\n\nSelected Template: ${currentTemplate.name}\nCategory: ${currentTemplate.category}\nComplexity: ${currentTemplate.complexity}\n\nForm Data:\n- Company: ${formData.companyName}\n- Recipient: ${formData.recipientName}\n- Date: ${formData.effectiveDate}\n- Jurisdiction: ${formData.jurisdiction}`
    }
    // Highlight the last updated field value in the preview string
    const highlightMap: FormData = {
      companyName: formData.companyName,
      recipientName: formData.recipientName,
      effectiveDate: formData.effectiveDate,
      jurisdiction: formData.jurisdiction,
      projectDescription: formData.projectDescription,
      duration: formData.duration,
      compensation: formData.compensation
    }
    const highlight = highlightValue(lastUpdatedField, highlightMap[lastUpdatedField] || '')
    if (highlight && highlight.value) {
      // Only replace the first occurrence for clarity
      preview = preview.replace(
        highlight.regex,
        `<span class=\"highlight-blink\">${highlight.value}</span>`
      )
    }
    return preview
  }

  const categories = [
    { id: 'all', name: 'All Templates', icon: FileText, count: 45, color: 'text-gray-600' },
    { id: 'business', name: 'Business', icon: Briefcase, count: 12, color: 'text-blue-600' },
    { id: 'employment', name: 'Employment', icon: Users, color: 'text-green-600', count: 8 },
    { id: 'real-estate', name: 'Real Estate', icon: Home, color: 'text-purple-600', count: 6 },
    { id: 'finance', name: 'Finance', icon: DollarSign, color: 'text-orange-600', count: 5 },
    { id: 'legal', name: 'Legal', icon: Scale, color: 'text-red-600', count: 7 },
    { id: 'personal', name: 'Personal', icon: Heart, color: 'text-pink-600', count: 4 },
    { id: 'healthcare', name: 'Healthcare', icon: UserCheck, color: 'text-teal-600', count: 3 }
  ]

  const templates = [
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

  const filteredTemplates = templates.filter(template => {
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    return matchesCategory && matchesSearch
  })

  const sortedTemplates = [...filteredTemplates].sort((a, b) => {
    switch (sortBy) {
      case 'popularity':
        return b.downloads - a.downloads
      case 'rating':
        return b.rating - a.rating
      case 'alphabetical':
        return a.name.localeCompare(b.name)
      case 'complexity':
        const complexityOrder: Record<Complexity, number> = { 'Simple': 1, 'Medium': 2, 'Complex': 3 }
        return complexityOrder[a.complexity as Complexity] - complexityOrder[b.complexity as Complexity]
      default:
        return 0
    }
  })

  const currentTemplate = templates.find(t => t.id === selectedTemplate) || templates[0]

  // Add a timer to clear highlight after a short delay
  useEffect(() => {
    if (lastUpdatedField) {
      const timer = setTimeout(() => setLastUpdatedField(''), 1000)
      return () => clearTimeout(timer)
    }
  }, [lastUpdatedField])

  const getComplexityColor = (complexity: Complexity) => {
    switch (complexity) {
      case 'Simple': return 'bg-green-100 text-green-800'
      case 'Medium': return 'bg-yellow-100 text-yellow-800'
      case 'Complex': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  // Helper to wrap highlighted value
  // const highlightSpan = (fieldKey: string, value: string) => (
  //   <span className={lastUpdatedField === fieldKey ? 'highlight-blink' : ''}>{value}</span>
  // )

  return (
    <section id="legal-templates" className="section-padding bg-gray-50">
      <div className="container-max">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Create Legal Documents in Minutes
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Choose from 45+ professionally drafted legal document templates. Generate, customize, and download legal documents with our smart editor.
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
              <div className="text-2xl font-bold text-[#260559]/60">24/7</div>
              <div className="text-sm text-gray-600">Expert Support</div>
            </div>
          </div>
        </div>

        {/* Main Content - 3 Parts Layout */}
        <div className="grid lg:grid-cols-12 gap-8">
          {/* Part 1: Template Selection (Left Side) */}
          <div className="lg:col-span-5 space-y-6">
            {/* Search and Filters */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="space-y-4">
                {/* Search Bar */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search legal templates..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                {/* Sort and Filter */}
                <div className="flex gap-3">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="popularity">Most Popular</option>
                    <option value="rating">Highest Rated</option>
                    <option value="alphabetical">A-Z</option>
                    <option value="complexity">Complexity</option>
                  </select>
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
                  >
                    <Filter className="h-4 w-4" />
                    Filters
                  </button>
                </div>
              </div>
            </div>

            {/* Categories */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Categories</h3>
              <div className="space-y-2">
                {categories.map((category) => {
                  const IconComponent = category.icon
                  return (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id)}
                      className={`w-full flex items-center justify-between p-3 rounded-lg transition-all duration-200 ${
                        selectedCategory === category.id
                          ? 'bg-[#260559]/10 border-2 border-[#260559]/20'
                          : 'hover:bg-gray-50 border-2 border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <IconComponent className={`h-5 w-5 ${category.color}`} />
                        <span className="font-medium text-gray-900">{category.name}</span>
                      </div>
                      <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                        {category.count}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Templates List */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">
                  Templates ({sortedTemplates.length})
                </h3>
                <div className="text-sm text-gray-500">
                  Sorted by {sortBy}
                </div>
              </div>
              
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {sortedTemplates.map((template) => (
                  <div
                    key={template.id}
                    onClick={() => setSelectedTemplate(template.id)}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                      selectedTemplate === template.id
                        ? 'border-[#260559]/50 bg-[#260559]/10'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className={`font-medium ${
                            selectedTemplate === template.id ? 'text-primary-900' : 'text-gray-900'
                          }`}>
                            {template.name}
                          </h4>
                          {template.isFeatured && (
                            <span className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-full font-medium">
                              Featured
                            </span>
                          )}
                          {template.isPremium && (
                            <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full font-medium">
                              Pro
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{template.description}</p>
                        
                        {/* Template Stats */}
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <div className="flex items-center gap-1">
                            <Star className="h-3 w-3 text-yellow-400 fill-current" />
                            <span>{template.rating}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Download className="h-3 w-3" />
                            <span>{template.downloads.toLocaleString()}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>{template.timeToComplete}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="ml-3">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${getComplexityColor(template.complexity as Complexity)}`}>
                          {template.complexity}
                        </span>
                      </div>
                    </div>
                    
                    {/* Tags */}
                    <div className="flex flex-wrap gap-1 mt-2">
                      {template.tags.slice(0, 3).map((tag, index) => (
                        <span key={index} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Part 2: Form Fields (Center) */}
          <div className="lg:col-span-3 space-y-6">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Fill Template Details</h3>
              
              {/* Template Info */}
              <div className="bg-[#260559]/10 rounded-lg p-4 mb-6">
                <div className="flex items-center gap-3 mb-2">
                  <FileText className="h-5 w-5 text-[#260559]/60" />
                  <span className="font-medium text-[#260559]">{currentTemplate.name}</span>
                </div>
                <p className="text-sm text-[#260559]/70 mb-3">{currentTemplate.description}</p>
                
                <div className="flex items-center gap-4 text-xs text-[#260559]/70">
                  <div className="flex items-center gap-1">
                    <Star className="h-3 w-3 text-yellow-500 fill-current" />
                    <span>{currentTemplate.rating}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>{currentTemplate.timeToComplete}</span>
                  </div>
                  {currentTemplate.expertReviewed && (
                    <div className="flex items-center gap-1">
                      <Shield className="h-3 w-3 text-green-500" />
                      <span>Expert Reviewed</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Dynamic Form Fields */}
              <div className="space-y-4">
                {currentTemplate.fields.map((field, index) => {
                  const fieldKey = field.toLowerCase().replace(/\s+/g, '')
                  const fieldValue = formData[fieldKey] || ''
                  const handleChange = (value: string) => {
                    setFormData({ ...formData, [fieldKey]: value })
                    setLastUpdatedField(fieldKey)
                  }
                  return (
                    <div key={index}>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {field} <span className="text-red-500">*</span>
                      </label>
                      {field === 'Jurisdiction' ? (
                        <select
                          value={formData.jurisdiction}
                          onChange={(e) => { setFormData({...formData, jurisdiction: e.target.value}); setLastUpdatedField('jurisdiction') }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        >
                          <option value="California">California</option>
                          <option value="New York">New York</option>
                          <option value="Texas">Texas</option>
                          <option value="Florida">Florida</option>
                          <option value="Illinois">Illinois</option>
                        </select>
                      ) : field === 'Effective Date' || field === 'Start Date' ? (
                        <input
                          type="date"
                          value={formData.effectiveDate}
                          onChange={(e) => { setFormData({...formData, effectiveDate: e.target.value}); setLastUpdatedField('effectiveDate') }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                      ) : field === 'Project Description' || field === 'Services Description' ? (
                        <textarea
                          value={formData.projectDescription}
                          onChange={(e) => { setFormData({...formData, projectDescription: e.target.value}); setLastUpdatedField('projectDescription') }}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          placeholder="Describe the project or services..."
                        />
                      ) : (
                        <input
                          type="text"
                          value={fieldValue}
                          onChange={(e) => handleChange(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          placeholder={`Enter ${field.toLowerCase()}`}
                        />
                      )}
                    </div>
                  )
                })}
              </div>

              {/* AI Suggestions */}
              <div className="mt-6 p-4 bg-purple-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="h-4 w-4 text-purple-600" />
                  <span className="text-sm font-medium text-purple-900">AI Suggestions</span>
                </div>
                <p className="text-xs text-purple-700">
                  Based on your inputs, consider adding specific confidentiality clauses for software development projects.
                </p>
              </div>
            </div>

            {/* Legal Compliance Info */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Shield className="h-5 w-5 text-green-500" />
                Legal Compliance
              </h4>
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-500" />
                  <span className="text-gray-700">Expert legal review</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-500" />
                  <span className="text-gray-700">State law compliance</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-500" />
                  <span className="text-gray-700">Court admissible</span>
                </div>
                <div className="text-xs text-gray-500 mt-3">
                  Valid in: {currentTemplate.jurisdictions.join(', ')}
                </div>
              </div>
            </div>
          </div>

          {/* Part 3: Live Preview (Right Side) */}
          <div className="lg:col-span-4">
            <div className="bg-white rounded-xl shadow-lg sticky top-6">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                    <Eye className="h-5 w-5 text-blue-600" />
                    Live Preview
                  </h3>
                  <div className="flex gap-2">
                    <button className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50">
                      <Download className="h-4 w-4" />
                      Download
                    </button>
                  </div>
                </div>
                <div className="mt-2 text-sm text-gray-500">
                  Updates automatically as you fill the form
                </div>
              </div>
              
              <div className="p-6 max-h-96 overflow-y-auto">
                <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono leading-relaxed" dangerouslySetInnerHTML={{ __html: generatePreviewString() }} />
              </div>
              
              <div className="p-6 border-t border-gray-200 bg-gray-50 rounded-b-xl">
                <div className="flex gap-3">
                  <button className="flex-1 btn-secondary text-sm" style={{borderColor: '#260559', color: '#260559'}}>
                    Save as Template
                  </button>
                  <button className="flex-1 bg-[#260559] text-white rounded-sm text-sm">
                    Download PDF
                  </button>
                </div>
                <p className="text-xs text-gray-500 text-center mt-3">
                  Sign in required to download
                </p>
              </div>
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