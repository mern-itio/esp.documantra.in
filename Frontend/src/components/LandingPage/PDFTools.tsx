import React, { useState } from 'react'
import { Search, FileText, Image, Lock, Merge, Eye, ArrowRight, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'

type ToolCategory = {
  title: string
  icon: React.ComponentType<{ className?: string }>
  tools: string[]
  accent: string
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

  const isToolCategory = (obj: unknown): obj is ToolCategory =>
    obj != null && typeof obj === 'object' && 'tools' in obj && Array.isArray((obj as ToolCategory).tools)

  const toolCategories: ToolCategories = {
    convert: {
      title: 'Convert',
      icon: FileText,
      accent: 'from-emerald-500 to-purple-600',
      tools: [
        'PDF to Word', 'PDF to Excel', 'PDF to PowerPoint', 'PDF to Image',
        'Word to PDF', 'Excel to PDF', 'PowerPoint to PDF', 'Image to PDF'
      ]
    },
    edit: {
      title: 'Edit',
      icon: Eye,
      accent: 'from-emerald-500 to-teal-600',
      tools: [
        'Annotate PDF', 'Fill Forms', 'Whiteout Text', 'Sign PDF',
        'Create Fillable Forms', 'Add Text', 'Add Images', 'Highlight Text'
      ]
    },
    manage: {
      title: 'Manage',
      icon: Merge,
      accent: 'from-amber-500 to-orange-600',
      tools: [
        'Merge PDFs', 'Split PDF', 'Reorder Pages', 'Delete Pages',
        'Add Watermark', 'Add Page Numbers', 'Rotate Pages', 'Extract Pages'
      ]
    },
    secure: {
      title: 'Secure',
      icon: Lock,
      accent: 'from-rose-500 to-pink-600',
      tools: [
        'Encrypt PDF', 'Password Protect', 'Remove Password', 'Redact Text',
        'Digital Signature', 'Set Permissions', 'Remove Metadata', 'Secure Sharing', 'Access Control'
      ]
    },
    ocr: {
      title: 'OCR',
      icon: Image,
      accent: 'from-sky-500 to-blue-600',
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

  const sourceEntries = searchTerm
    ? Object.entries(filteredTools)
    : showAllTools
      ? Object.entries(toolCategories)
      : [[activeTab, toolCategories[activeTab]]]

  const hasNoResults =
    (searchTerm && Object.keys(filteredTools).length === 0) ||
    (!searchTerm && !showAllTools && !toolCategories[activeTab]?.tools?.length)

  return (
    <section id="pdf-tools" className="section-padding bg-[#F5F2EE]/80">
      <div className="container-max">
        {/* Header */}
        <div className="mb-10 md:mb-12">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-[#E6D8C9] bg-[#F7F3EE] px-3 py-1.5 text-xs font-medium text-slate-600 shadow-sm mb-4">
                <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                30+ tools · Free to use
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">
                PDF tools built for
                <span className="block bg-gradient-to-r from-emerald-600 to-emerald-600 bg-clip-text text-transparent">
                  every workflow
                </span>
              </h2>
              <p className="mt-3 text-base md:text-lg text-slate-600 max-w-2xl">
                Convert, edit, merge, secure, and extract—all in one place. No installs, no subscriptions.
              </p>
            </div>

            {/* Search */}
            <div className="relative w-full md:max-w-xs shrink-0">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search tools..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-xl border border-[#E6D8C9] bg-[#F7F3EE] py-2.5 pl-9 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/20"
              />
            </div>
          </div>
        </div>

        {/* Category pills */}
        {!showAllTools && (
          <div className="flex flex-wrap gap-2 mb-8">
            {(Object.entries(toolCategories) as [keyof ToolCategories, ToolCategory][]).map(([key, category]) => {
              const IconComponent = category.icon
              const isActive = activeTab === key
              return (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  className={`
                    inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium transition-all duration-200
                    ${isActive
                      ? 'bg-slate-900 text-white shadow-md'
                      : 'bg-[#F7F3EE] text-slate-600 shadow-sm border border-[#E6D8C9] hover:border-slate-300 hover:bg-[#F5F2EE]'
                    }
                  `}
                >
                  <IconComponent className={`h-4 w-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                  {category.title}
                </button>
              )
            })}
          </div>
        )}

        {/* Tools grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4 mb-10">
          {sourceEntries.flatMap(([key, category]) => {
            if (!isToolCategory(category)) return []
            const IconComponent = category.icon
            return category.tools.map((tool, index) => (
              <Link
                to="/login"
                key={`${key}-${index}`}
                className="group flex items-center gap-3 rounded-xl border border-[#E6D8C9]/80 bg-[#F7F3EE] p-4 shadow-sm transition-all duration-200 hover:border-emerald-200 hover:shadow-md hover:shadow-emerald-500/5"
              >
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${category.accent} text-white shadow-sm`}>
                  <IconComponent className="h-5 w-5" />
                </div>
                <span className="text-sm font-medium text-slate-800 group-hover:text-emerald-700 transition-colors">
                  {tool}
                </span>
                <ArrowRight className="ml-auto h-4 w-4 shrink-0 text-slate-300 group-hover:text-emerald-500 group-hover:translate-x-0.5 transition-all" />
              </Link>
            ))
          })}

          {hasNoResults && (
            <div className="col-span-full flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#E6D8C9] bg-[#F7F3EE]/60 py-12 text-center">
              <Search className="mb-3 h-10 w-10 text-slate-300" />
              <p className="text-slate-500">
                No tools found for &quot;{searchTerm}&quot;
              </p>
              <p className="mt-1 text-sm text-slate-400">
                Try another search or browse by category.
              </p>
            </div>
          )}
        </div>

        {/* Footer CTA */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 rounded-2xl border border-[#E6D8C9] bg-[#F7F3EE] px-6 py-5 shadow-sm">
          <p className="text-sm text-slate-600 text-center sm:text-left">
            Free to use; sign in to download your edited files.
          </p>
          <button
            type="button"
            onClick={() => setShowAllTools((prev) => !prev)}
            className="shrink-0 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-slate-800"
          >
            {showAllTools ? 'Show by category' : 'View all tools'}
            <ArrowRight className={`h-4 w-4 transition-transform ${showAllTools ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>
    </section>
  )
}

export default PDFTools
