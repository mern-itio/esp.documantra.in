import React, { useState } from 'react'
import {  Upload, Download, Settings, Eye, Share2, Clock, Shield, Users, CheckCircle, Zap, FileText, Trash2, Plus, X, ChevronDown, ChevronUp, HelpCircle, Globe, Award, Printer, Workflow, Edit, Minimize2,  Merge, Crop, MoreHorizontal } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'

interface PDFToolLayoutProps {
  toolName: string
  toolDescription: string
  toolIcon: React.ComponentType<any>
  acceptedFormats: string[]
  outputFormats: string[]
  maxFileSize: string
  processingTime: string
  features: string[]
  howToSteps: { title: string; description: string }[]
  faqs: { question: string; answer: string }[]
  relatedTools: { name: string; path: string; description: string }[]
children?: React.ReactNode
  onProcess: (files: File[], settings: any) => Promise<void>
  processingSettings?: React.ReactNode
  securityFeatures?: string[]
}

const PDFToolLayout: React.FC<PDFToolLayoutProps> = ({
  toolName,
  toolDescription,
  toolIcon: ToolIcon,
  acceptedFormats,
  outputFormats,
  maxFileSize,
  processingTime,
  howToSteps,
  faqs,
  onProcess,
  processingSettings,
  securityFeatures = [
    "Files are automatically deleted after 1 hour",
    "256-bit SSL encryption during upload and processing",
    "No file content is stored on our servers",
    "GDPR compliant data processing"
  ]
}) => {
  const navigate = useNavigate()
  const [files, setFiles] = useState<File[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingProgress, setProcessingProgress] = useState(0)
  const [isComplete, setIsComplete] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)
  const [activeTab, setActiveTab] = useState('upload')
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null)
  // const [showPreview, setShowPreview] = useState(false)
  const [processingQueue, setProcessingQueue] = useState<any[]>([])
  const [settings ] = useState({})
  const [showMoreTools, setShowMoreTools] = useState(false)

  // Enhanced FAQ list with comprehensive questions
  const enhancedFAQs = faqs

  // All available PDF tools organized by category
  const allPDFTools = {
    merge: [
      { name: 'Alternate & Mix', path: '/alternate-mix', icon: '🔄' },
      { name: 'Merge', path: '/merge-pdf', icon: '🔗' },
      { name: 'Organize', path: '/organize-pdf', icon: '📁' }
    ],
    split: [
      { name: 'Extract Pages', path: '/extract-pages', icon: '📄' },
      { name: 'Split by pages', path: '/split-pdf', icon: '📑' },
      { name: 'Split by bookmarks', path: '/split-bookmarks', icon: '🔖' },
      { name: 'Split in half', path: '/split-half', icon: '✂️' },
      { name: 'Split by size', path: '/split-size', icon: '📏' },
      { name: 'Split by text', path: '/split-text', icon: '📝' }
    ],
    editSign: [
      { name: 'PDF Editor', path: '/edit-pdf', icon: '✏️' },
      { name: 'Fill & Sign', path: '/fill-pdf-forms', icon: '✍️' },
      { name: 'Create Forms', path: '/create-forms', icon: '📋' },
      { name: 'Delete Pages', path: '/delete-pages', icon: '🗑️' }
    ],
    compress: [
      { name: 'Compress', path: '/compress-pdf', icon: '🗜️' }
    ],
    security: [
      { name: 'Protect', path: '/protect-pdf', icon: '🔒' },
      { name: 'Unlock', path: '/unlock-pdf', icon: '🔓' },
      { name: 'Watermark', path: '/watermark-pdf', icon: '💧' },
      { name: 'Flatten', path: '/flatten-pdf', icon: '📋' }
    ],
    convertFromPdf: [
      { name: 'PDF to Excel', path: '/pdf-to-excel', icon: '📊' },
      { name: 'PDF to JPG', path: '/pdf-to-jpg', icon: '🖼️' },
      { name: 'PDF to PowerPoint', path: '/pdf-to-powerpoint', icon: '📽️' },
      { name: 'PDF to Text', path: '/pdf-to-text', icon: '📝' },
      { name: 'PDF to Word', path: '/pdf-to-word', icon: '📄' }
    ],
    convertToPdf: [
      { name: 'HTML to PDF', path: '/html-to-pdf', icon: '🌐' },
      { name: 'JPG to PDF', path: '/jpg-to-pdf', icon: '🖼️' },
      { name: 'Word to PDF', path: '/word-to-pdf', icon: '📄' }
    ],
    other: [
      { name: 'Bates Numbering', path: '/bates-numbering', icon: '🔢' },
      { name: 'Create Bookmarks', path: '/create-bookmarks', icon: '🔖' },
      { name: 'Crop', path: '/crop-pdf', icon: '✂️' },
      { name: 'Edit Metadata', path: '/edit-metadata', icon: '📋' },
      { name: 'Extract Images', path: '/extract-images', icon: '🖼️' },
      { name: 'Grayscale', path: '/grayscale-pdf', icon: '⚫' },
      { name: 'Header & Footer', path: '/header-footer', icon: '📄' },
      { name: 'N-up', path: '/n-up', icon: '📑' },
      { name: 'Page Numbers', path: '/page-numbers', icon: '🔢' }
    ],
    scans: [
      { name: 'Deskew', path: '/deskew-pdf', icon: '📐' },
      { name: 'OCR', path: '/ocr-pdf', icon: '👁️' }
    ]
  }

  // Quick action tools that appear first
  const quickActionTools = [
    { name: 'Share', icon: Share2, color: 'text-orange-600', action: () => console.log('Share') },
    { name: 'Print', icon: Printer, color: 'text-orange-600', action: () => console.log('Print') },
    { name: 'Workflows', icon: Workflow, color: 'text-gray-600', action: () => console.log('Workflows') },
    { name: 'Merge', icon: Merge, color: 'text-blue-600', action: () => navigate('/merge-pdf') },
    { name: 'Edit', icon: Edit, color: 'text-blue-600', action: () => navigate('/edit-pdf') },
    { name: 'Compress', icon: Minimize2, color: 'text-blue-600', action: () => navigate('/compress-pdf') },
    { name: 'Delete Pages', icon: Trash2, color: 'text-red-600', action: () => navigate('/delete-pages') },
    { name: 'Crop', icon: Crop, color: 'text-purple-600', action: () => navigate('/crop-pdf') }
  ]

  // Mock processing simulation
  const simulateProcessing = async () => {
    setIsProcessing(true)
    setProcessingProgress(0)
    
    // Simulate realistic processing time
    const steps = [
      { progress: 20, message: "Uploading file..." },
      { progress: 40, message: "Analyzing document..." },
      { progress: 60, message: "Processing content..." },
      { progress: 80, message: "Optimizing output..." },
      { progress: 100, message: "Complete!" }
    ]

    for (const step of steps) {
      await new Promise(resolve => setTimeout(resolve, 800))
      setProcessingProgress(step.progress)
    }

    setIsProcessing(false)
    setIsComplete(true)
    setActiveTab('download')
  }

  const handleFileUpload = (uploadedFiles: File[]) => {
    setFiles(uploadedFiles)
    setActiveTab('settings')
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    const droppedFiles = Array.from(e.dataTransfer.files)
    handleFileUpload(droppedFiles)
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files)
      handleFileUpload(selectedFiles)
    }
  }

  const handleProcess = async () => {
    try {
      await simulateProcessing()
      await onProcess(files, settings)
    } catch (error) {
      console.error('Processing error:', error)
    }
  }

  const handleDownload = () => {
    // Redirect to login page
    navigate('/login')
  }

  const addToQueue = () => {
    setProcessingQueue([...processingQueue, { files, settings, id: Date.now() }])
    setFiles([])
    setActiveTab('upload')
  }

  const removeFromQueue = (id: number) => {
    setProcessingQueue(processingQueue.filter(item => item.id !== id))
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-24">
      <div className="container-max">
        {/* Breadcrumb */}
        <div className="mb-6">
          <nav className="flex items-center space-x-2 text-sm text-gray-600">
            <Link to="/" className="hover:text-primary-600">Home</Link>
            <span>/</span>
            <Link to="/pdf-tools" className="hover:text-primary-600">PDF Tools</Link>
            <span>/</span>
            <span className="text-gray-900">{toolName}</span>
          </nav>
          
          {/* Back Button */}
          <div className="mt-4">
            <Link 
              to="/pdf-tools" 
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-colors"
            >
              <ChevronDown className="h-4 w-4 rotate-90" />
              Back to PDF Tools
            </Link>
          </div>
        </div>

        {/* Compact Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
              <ToolIcon className="h-6 w-6 text-primary-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{toolName}</h1>
              <p className="text-gray-600">{toolDescription}</p>
            </div>
          </div>

          {/* Compact Stats */}
          <div className="grid md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-lg font-bold text-blue-600">Free</div>
              <div className="text-xs text-blue-700">Always Free</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-lg font-bold text-green-600">{maxFileSize}</div>
              <div className="text-xs text-green-700">Max File Size</div>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <div className="text-lg font-bold text-purple-600">{processingTime}</div>
              <div className="text-xs text-purple-700">Processing Time</div>
            </div>
            <div className="text-center p-3 bg-orange-50 rounded-lg">
              <div className="text-lg font-bold text-orange-600">4.9★</div>
              <div className="text-xs text-orange-700">User Rating</div>
            </div>
          </div>
        </div>

        {/* Main Content - Improved Layout */}
        <div className="grid lg:grid-cols-4 gap-6">
          {/* Left Sidebar - Compact */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg p-4 sticky top-6">
              <h3 className="font-semibold text-gray-900 mb-3 text-sm">Process Steps</h3>
              <div className="space-y-2">
                <button
                  onClick={() => setActiveTab('upload')}
                  className={`w-full flex items-center gap-2 p-2 rounded-lg text-left transition-colors text-sm ${
                    activeTab === 'upload' ? 'bg-primary-50 text-primary-700 border border-primary-200' : 'hover:bg-gray-50'
                  }`}
                >
                  <Upload className="h-4 w-4" />
                  <span className="font-medium">1. Upload</span>
                  {files.length > 0 && <CheckCircle className="h-3 w-3 text-green-500 ml-auto" />}
                </button>
                
                <button
                  onClick={() => setActiveTab('settings')}
                  disabled={files.length === 0}
                  className={`w-full flex items-center gap-2 p-2 rounded-lg text-left transition-colors text-sm ${
                    activeTab === 'settings' ? 'bg-primary-50 text-primary-700 border border-primary-200' : 
                    files.length === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'
                  }`}
                >
                  <Settings className="h-4 w-4" />
                  <span className="font-medium">2. Settings</span>
                </button>
                
                <button
                  onClick={() => setActiveTab('preview')}
                  disabled={files.length === 0}
                  className={`w-full flex items-center gap-2 p-2 rounded-lg text-left transition-colors text-sm ${
                    activeTab === 'preview' ? 'bg-primary-50 text-primary-700 border border-primary-200' : 
                    files.length === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'
                  }`}
                >
                  <Eye className="h-4 w-4" />
                  <span className="font-medium">3. Process</span>
                </button>
                
                <button
                  onClick={() => setActiveTab('download')}
                  disabled={!isComplete}
                  className={`w-full flex items-center gap-2 p-2 rounded-lg text-left transition-colors text-sm ${
                    activeTab === 'download' ? 'bg-primary-50 text-primary-700 border border-primary-200' : 
                    !isComplete ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'
                  }`}
                >
                  <Download className="h-4 w-4" />
                  <span className="font-medium">4. Download</span>
                  {isComplete && <CheckCircle className="h-3 w-3 text-green-500 ml-auto" />}
                </button>
              </div>

              {/* Processing Queue */}
              {processingQueue.length > 0 && (
                <div className="mt-4 pt-4 border-t">
                  <h4 className="font-medium text-gray-900 mb-2 text-sm">Queue ({processingQueue.length})</h4>
                  <div className="space-y-1">
                    {processingQueue.map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-2 bg-gray-50 rounded text-xs">
                        <span className="text-gray-600 truncate">{item.files[0]?.name}</span>
                        <button
                          onClick={() => removeFromQueue(item.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Main Content Area - Expanded */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-xl shadow-lg p-6">
              {/* Upload Tab */}
              {activeTab === 'upload' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-bold text-gray-900">Upload Your Files</h2>
                  
                  {/* Compact Drag and Drop Area */}
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${
                      isDragOver ? 'border-primary-500 bg-primary-50' : 'border-gray-300 hover:border-primary-400'
                    }`}
                  >
                    <Upload className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Drag and drop your files here
                    </h3>
                    <p className="text-gray-600 mb-4">
                      or click to browse from your computer
                    </p>
                    
                    <input
                      type="file"
                      multiple
                      accept={acceptedFormats.join(',')}
                      onChange={handleFileSelect}
                      className="hidden"
                      id="file-upload"
                    />
                    <label
                      htmlFor="file-upload"
                      className="btn-primary cursor-pointer inline-flex items-center gap-2"
                    >
                      <Upload className="h-4 w-4" />
                      Choose Files
                    </label>
                    
                    <div className="mt-4 text-sm text-gray-500">
                      <p>Supported: {acceptedFormats.join(', ')} • Max: {maxFileSize}</p>
                    </div>
                  </div>

                  {/* Cloud Import Options */}
                  <div className="grid md:grid-cols-3 gap-3">
                    <button className="flex items-center justify-center gap-2 p-3 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm">
                      <div className="w-4 h-4 bg-blue-500 rounded"></div>
                      <span>Google Drive</span>
                    </button>
                    <button className="flex items-center justify-center gap-2 p-3 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm">
                      <div className="w-4 h-4 bg-blue-600 rounded"></div>
                      <span>Dropbox</span>
                    </button>
                    <button className="flex items-center justify-center gap-2 p-3 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm">
                      <div className="w-4 h-4 bg-orange-500 rounded"></div>
                      <span>OneDrive</span>
                    </button>
                  </div>

                  {/* Uploaded Files */}
                  {files.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="font-semibold text-gray-900">Uploaded Files ({files.length})</h3>
                      {files.map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <FileText className="h-6 w-6 text-red-500" />
                            <div>
                              <div className="font-medium text-gray-900 text-sm">{file.name}</div>
                              <div className="text-xs text-gray-500">
                                {(file.size / 1024 / 1024).toFixed(2)} MB
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={() => setFiles(files.filter((_, i) => i !== index))}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                      
                      <button
                        onClick={() => setActiveTab('settings')}
                        className="w-full btn-primary"
                      >
                        Continue to Settings
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Settings Tab */}
              {activeTab === 'settings' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-bold text-gray-900">Configure Settings</h2>
                  
                  {processingSettings || (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Output Quality
                        </label>
                        <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent">
                          <option>High Quality (Recommended)</option>
                          <option>Medium Quality</option>
                          <option>Low Quality (Smaller file)</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Output Format
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                          {outputFormats.map((format) => (
                            <label key={format} className="flex items-center gap-2 p-3 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
                              <input type="radio" name="format" value={format} className="text-primary-600" />
                              <span className="font-medium">{format.toUpperCase()}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button
                      onClick={() => setActiveTab('preview')}
                      className="flex-1 btn-primary"
                    >
                      Preview & Process
                    </button>
                    <button
                      onClick={addToQueue}
                      className="btn-secondary"
                    >
                      <Plus className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              )}

              {/* Preview Tab */}
              {activeTab === 'preview' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-bold text-gray-900">Preview & Process</h2>
                  
                  {/* Compact File Preview */}
                  <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
                    <div className="text-center">
                      <FileText className="h-16 w-16 text-gray-400 mx-auto mb-3" />
                      <h3 className="font-semibold text-gray-900 mb-1">{files[0]?.name}</h3>
                      <p className="text-gray-600 text-sm">Ready for processing</p>
                    </div>
                  </div>

                  {/* Processing Status */}
                  {isProcessing && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-900">Processing...</span>
                        <span className="text-sm text-gray-600">{processingProgress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${processingProgress}%` }}
                        ></div>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Clock className="h-4 w-4" />
                        <span>Estimated time: {Math.ceil((100 - processingProgress) / 20)} seconds</span>
                      </div>
                    </div>
                  )}

                  {!isProcessing && !isComplete && (
                    <button
                      onClick={handleProcess}
                      className="w-full btn-primary text-lg py-3"
                    >
                      <Zap className="h-5 w-5 mr-2" />
                      Start Processing
                    </button>
                  )}

                  {isComplete && (
                    <div className="text-center space-y-4">
                      <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
                      <h3 className="text-lg font-semibold text-green-700">Processing Complete!</h3>
                      <p className="text-gray-600">Your file has been processed successfully.</p>
                      <button
                        onClick={() => setActiveTab('download')}
                        className="btn-primary"
                      >
                        Continue to Download
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Download Tab with Cross-Selling */}
              {activeTab === 'download' && (
                <div className="space-y-6">
                  {/* Success Message */}
                  <div className="text-center mb-6">
                    <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Your document is ready</h2>
                    <p className="text-gray-600">We processed your file successfully</p>
                  </div>
                  
                  {/* Download Section */}
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-6">
                    <div className="flex items-center justify-between p-4 bg-white rounded-lg border mb-4">
                      <div className="flex items-center gap-3">
                        <FileText className="h-8 w-8 text-green-500" />
                        <div>
                          <div className="font-medium text-gray-900">processed_{files[0]?.name}</div>
                          <div className="text-sm text-gray-500">Ready for download</div>
                        </div>
                      </div>
                      <button
                        onClick={handleDownload}
                        className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2"
                      >
                        <Download className="h-5 w-5" />
                        Download
                      </button>
                    </div>
                    
                    <button className="w-full text-center text-primary-600 hover:text-primary-700 text-sm font-medium">
                      ← Back to editing
                    </button>
                  </div>

                  {/* Continue Editing This Document */}
                  <div className="mb-6">
                    <p className="text-center text-gray-600 text-sm mb-4">CONTINUE EDITING THIS DOCUMENT</p>
                    
                    {/* Quick Action Tools */}
                    <div className="flex flex-wrap justify-center gap-3 mb-4">
                      {quickActionTools.map((tool, index) => (
                        <button
                          key={index}
                          onClick={tool.action}
                          className="flex flex-col items-center gap-1 p-3 hover:bg-gray-50 rounded-lg transition-colors min-w-[80px]"
                        >
                          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                            <tool.icon className={`h-5 w-5 ${tool.color}`} />
                          </div>
                          <span className="text-xs font-medium text-gray-700">{tool.name}</span>
                        </button>
                      ))}
                      
                      {/* More Tools Button */}
                      <button
                        onClick={() => setShowMoreTools(!showMoreTools)}
                        className="flex flex-col items-center gap-1 p-3 hover:bg-gray-50 rounded-lg transition-colors min-w-[80px]"
                      >
                        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                          <MoreHorizontal className="h-5 w-5 text-gray-600" />
                        </div>
                        <span className="text-xs font-medium text-gray-700">More tools</span>
                        {showMoreTools ? (
                          <ChevronUp className="h-3 w-3 text-gray-500" />
                        ) : (
                          <ChevronDown className="h-3 w-3 text-gray-500" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Expanded Tools Section */}
                  {showMoreTools && (
                    <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-gray-900">More tools to continue with</h3>
                        <button
                          onClick={() => setShowMoreTools(false)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <X className="h-5 w-5" />
                        </button>
                      </div>
                      
                      <div className="grid md:grid-cols-3 gap-6">
                        {/* MERGE */}
                        <div>
                          <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">MERGE</h4>
                          <div className="space-y-2">
                            {allPDFTools.merge.map((tool, index) => (
                              <Link
                                key={index}
                                to={tool.path}
                                className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded-lg transition-colors"
                              >
                                <span className="text-sm">{tool.icon}</span>
                                <span className="text-sm text-gray-700 hover:text-gray-900">{tool.name}</span>
                              </Link>
                            ))}
                          </div>
                        </div>

                        {/* SPLIT */}
                        <div>
                          <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">SPLIT</h4>
                          <div className="space-y-2">
                            {allPDFTools.split.map((tool, index) => (
                              <Link
                                key={index}
                                to={tool.path}
                                className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded-lg transition-colors"
                              >
                                <span className="text-sm">{tool.icon}</span>
                                <span className="text-sm text-gray-700 hover:text-gray-900">{tool.name}</span>
                              </Link>
                            ))}
                          </div>
                        </div>

                        {/* EDIT & SIGN */}
                        <div>
                          <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">EDIT & SIGN</h4>
                          <div className="space-y-2">
                            {allPDFTools.editSign.map((tool, index) => (
                              <Link
                                key={index}
                                to={tool.path}
                                className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded-lg transition-colors"
                              >
                                <span className="text-sm">{tool.icon}</span>
                                <span className="text-sm text-gray-700 hover:text-gray-900">{tool.name}</span>
                              </Link>
                            ))}
                          </div>
                        </div>

                        {/* CONVERT FROM PDF */}
                        <div>
                          <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">CONVERT FROM PDF</h4>
                          <div className="space-y-2">
                            {allPDFTools.convertFromPdf.map((tool, index) => (
                              <Link
                                key={index}
                                to={tool.path}
                                className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded-lg transition-colors"
                              >
                                <span className="text-sm">{tool.icon}</span>
                                <span className="text-sm text-gray-700 hover:text-gray-900">{tool.name}</span>
                              </Link>
                            ))}
                          </div>
                        </div>

                        {/* SECURITY */}
                        <div>
                          <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">SECURITY</h4>
                          <div className="space-y-2">
                            {allPDFTools.security.map((tool, index) => (
                              <Link
                                key={index}
                                to={tool.path}
                                className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded-lg transition-colors"
                              >
                                <span className="text-sm">{tool.icon}</span>
                                <span className="text-sm text-gray-700 hover:text-gray-900">{tool.name}</span>
                              </Link>
                            ))}
                          </div>
                        </div>

                        {/* OTHER */}
                        <div>
                          <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">OTHER</h4>
                          <div className="space-y-2">
                            {allPDFTools.other.slice(0, 6).map((tool, index) => (
                              <Link
                                key={index}
                                to={tool.path}
                                className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded-lg transition-colors"
                              >
                                <span className="text-sm">{tool.icon}</span>
                                <span className="text-sm text-gray-700 hover:text-gray-900">{tool.name}</span>
                              </Link>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Process Another File */}
                  <div className="text-center pt-4 border-t">
                    <button
                      onClick={() => {
                        setFiles([])
                        setIsComplete(false)
                        setActiveTab('upload')
                        setShowMoreTools(false)
                      }}
                      className="btn-secondary"
                    >
                      Process Another File
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Compact How-to Guide */}
        <div className="mt-8 bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">How to Use {toolName}</h2>
          <div className="grid md:grid-cols-4 gap-4">
            {howToSteps.map((step, index) => (
              <div key={index} className="text-center">
                <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-primary-600 font-bold text-sm">{index + 1}</span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2 text-sm">{step.title}</h3>
                <p className="text-xs text-gray-600">{step.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Enhanced FAQ Section */}
        <div className="mt-8 bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Frequently Asked Questions</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {enhancedFAQs.map((faq, index) => (
              <div key={index} className="border border-gray-200 rounded-lg">
                <button
                  onClick={() => setExpandedFAQ(expandedFAQ === index ? null : index)}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
                >
                  <span className="font-medium text-gray-900 text-sm pr-4">{faq.question}</span>
                  {expandedFAQ === index ? (
                    <ChevronUp className="h-4 w-4 text-gray-500 flex-shrink-0" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-gray-500 flex-shrink-0" />
                  )}
                </button>
                {expandedFAQ === index && (
                  <div className="px-4 pb-4">
                    <p className="text-gray-600 text-sm leading-relaxed">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
          
          {/* Additional Help Section */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Still have questions?</h3>
              <p className="text-gray-600 mb-4">Our support team is here to help you 24/7</p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button className="btn-secondary">
                  <HelpCircle className="h-4 w-4 mr-2" />
                  Contact Support
                </button>
                <button className="btn-secondary">
                  <FileText className="h-4 w-4 mr-2" />
                  View Help Center
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Trust Badges Section - Better Spacing and Margin */}
        <div className="mt-16 mb-16 bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl p-8 text-white text-center">
          <h3 className="text-2xl font-bold mb-6">Trusted by Millions Worldwide</h3>
          <p className="text-primary-100 mb-8 max-w-2xl mx-auto">
            Join over 500,000 users who trust our platform for secure, reliable document processing. 
            Your privacy and security are our top priorities.
          </p>
          
          <div className="grid md:grid-cols-4 gap-6 mb-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Shield className="h-6 w-6" />
              </div>
              <div className="font-semibold mb-1">SSL Encrypted</div>
              <div className="text-primary-200 text-sm">Bank-level security</div>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Globe className="h-6 w-6" />
              </div>
              <div className="font-semibold mb-1">GDPR Compliant</div>
              <div className="text-primary-200 text-sm">Privacy protected</div>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Award className="h-6 w-6" />
              </div>
              <div className="font-semibold mb-1">ISO Certified</div>
              <div className="text-primary-200 text-sm">Quality assured</div>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Users className="h-6 w-6" />
              </div>
              <div className="font-semibold mb-1">500K+ Users</div>
              <div className="text-primary-200 text-sm">Globally trusted</div>
            </div>
          </div>

          {/* Security Features */}
          <div className="bg-white/10 rounded-lg p-6">
            <h4 className="font-semibold mb-4">Your Security is Our Priority</h4>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              {securityFeatures.map((feature, index) => (
                <div key={index} className="flex items-center gap-2 text-primary-100">
                  <CheckCircle className="h-4 w-4 text-green-300 flex-shrink-0" />
                  <span>{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PDFToolLayout