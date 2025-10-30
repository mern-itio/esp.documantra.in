import React, { useState } from 'react'
import { Search, FileText, Image, Lock, Merge, Eye } from 'lucide-react'
import { Link } from 'react-router-dom'

type ToolCategory = {
  title: string
  icon: React.ComponentType<{ className?: string }>
  tools: string[]
}

type ToolCategories = {
  convert: ToolCategory
  edit: ToolCategory
  manage: ToolCategory
  secure: ToolCategory
  ocr: ToolCategory
}

const PDFTools = () => {
  const [activeTab, setActiveTab] = useState<keyof ToolCategories>('convert')
  const [searchTerm, setSearchTerm] = useState('')
  const [showAllTools, setShowAllTools] = useState(false)
  
  // Type guard function
  const isToolCategory = (obj: any): obj is ToolCategory => {
    return obj && typeof obj === 'object' && 'tools' in obj && Array.isArray(obj.tools)
  }
  
  const toolCategories: ToolCategories = {
    convert: {
      title: 'Convert',
      icon: FileText,
      tools: [
        'PDF to Word', 'PDF to Excel', 'PDF to PowerPoint', 'PDF to Image',
        'Word to PDF', 'Excel to PDF', 'PowerPoint to PDF', 'Image to PDF'
      ]
    },
    edit: {
      title: 'Edit',
      icon: Eye,
      tools: [
        'Annotate PDF', 'Fill Forms', 'Whiteout Text', 'Sign PDF',
        'Create Fillable Forms', 'Add Text', 'Add Images', 'Highlight Text'
      ]
    },
    manage: {
      title: 'Manage',
      icon: Merge,
      tools: [
        'Merge PDFs', 'Split PDF', 'Reorder Pages', 'Delete Pages',
        'Add Watermark', 'Add Page Numbers', 'Rotate Pages', 'Extract Pages'
      ]
    },
    secure: {
      title: 'Secure',
      icon: Lock,
      tools: [
        'Encrypt PDF', 'Password Protect', 'Remove Password', 'Redact Text',
        'Digital Signature', 'Set Permissions', 'Remove Metadata', 'Secure Sharing', 'Access Control'
      ]
    },
    ocr: {
      title: 'OCR',
      icon: Image,
      tools: [
        'Image to Text', 'Scanned PDF to Text', 'PDF OCR', 'Extract Text',
        'Searchable PDF', 'Text Recognition', 'Document Digitization', 'Data Extraction'
      ]
    }
  }

  const filteredTools = Object.entries(toolCategories).reduce((acc, [key, category]) => {
    const filtered = category.tools.filter(tool =>
      tool.toLowerCase().includes(searchTerm.toLowerCase())
    )
    if (filtered.length > 0) {
      acc[key as keyof ToolCategories] = { ...category, tools: filtered }
    }
    return acc
  }, {} as Partial<ToolCategories>)

  return (
    <section id="pdf-tools" className="section-padding bg-white">
      <div className="container-max">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Free PDF Tools at Your Fingertips
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Edit, convert, merge, compress, and secure PDFs—over 30+ tools available online, always free
          </p>

          {/* Search Bar */}
          <div className="relative max-w-md mx-auto mb-8">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search PDF tools..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Category Tabs */}
        {!showAllTools && (
          <div className="flex flex-wrap justify-center gap-4 mb-12">
            {Object.entries(toolCategories).map(([key, category]) => {
              const IconComponent = category.icon
              return (
                <button
                  key={key}
                  onClick={() => setActiveTab(key as keyof ToolCategories)}
                  className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all duration-200 ${activeTab === key
                    ? 'bg-primary-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                >
                  <IconComponent className="h-5 w-5" />
                  {category.title}
                </button>
              )
            })}
          </div>
        )}


        {/* Tools Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          {
            (searchTerm
              ? Object.entries(filteredTools)
              : showAllTools
                ? Object.entries(toolCategories)
                : [[activeTab, toolCategories[activeTab]]]
            ).flatMap(([key, category]) => {
              if (isToolCategory(category)) {
                return category.tools.map((tool: string, index: number) => (
                  <Link
                    to="/login"
                    key={`${key}-${index}`}
                    className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-lg hover:border-primary-300 transition-all duration-200 group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center group-hover:bg-primary-200 transition-colors">
                        <FileText className="h-5 w-5 text-primary-600" />
                      </div>
                      <span className="font-medium text-gray-900 group-hover:text-primary-600 transition-colors">
                        {tool}
                      </span>
                    </div>
                  </Link>
                ))
              }
              return []
            })
          }

          {/* Empty message */}
          {
            ((searchTerm && Object.keys(filteredTools).length === 0) ||
              (!searchTerm && !showAllTools && !toolCategories[activeTab]?.tools?.length)) && (
              <div className="col-span-full text-center py-8 text-gray-500">
                No tools found matching "{searchTerm}"
              </div>
            )
          }
        </div>


        {/* Note and CTA */}
        <div className="text-center">
          <p className="text-sm text-gray-500 mb-6">
            📝 Tools are free to use; users must sign up to download edited files.
          </p>
          <button
            className="btn-primary text-lg px-8 py-4"
            onClick={() => setShowAllTools(prev => !prev)}
          >
            {showAllTools ? 'Back to Tabs' : 'View All Tools'}
          </button>

        </div>
      </div>
    </section>
  )
}

export default PDFTools