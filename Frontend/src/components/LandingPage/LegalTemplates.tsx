import { useState, useEffect, useRef } from 'react'
import { Download, Send, Loader2, Sparkles, AlertCircle, Bot, User } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../AuthService/AuthContext'
import { aiContentService } from '../../services/aiContentService'
import toast from 'react-hot-toast'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

type ConversationState = 'initial' | 'asking_category' | 'asking_requirements' | 'generating' | 'generated'

const LegalTemplates = () => {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [conversationState, setConversationState] = useState<ConversationState>('initial')
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [generatedContent, setGeneratedContent] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [sessionId] = useState<string>(() => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const chatMessagesRef = useRef<HTMLDivElement>(null)
// 1. Create a ref for the scrollable chat container
const messagesContainerRef = useRef<HTMLDivElement | null>(null);

// 2. Call this after messages update
const scrollToBottom = () => {
  if (messagesContainerRef.current) {
    messagesContainerRef.current.scrollTop =
      messagesContainerRef.current.scrollHeight;
  }
};

// 3. Whenever chatMessages changes (or new msg added), scroll:
useEffect(() => {
  scrollToBottom();
}, [messages]);
  // Prevent ALL scroll propagation from chat to page
  useEffect(() => {
    const chatMessages = chatMessagesRef.current
    const chatWrapper = document.getElementById('chat-container-wrapper')
    if (!chatMessages || !chatWrapper) return

    let isOverChat = false

    const handleWheel = (e: WheelEvent) => {
      // Check if event is within chat wrapper or mouse is over chat
      const target = e.target as Node
      if (isOverChat || chatWrapper.contains(target)) {
        // Prevent default to stop page scroll completely
        e.preventDefault()
        e.stopPropagation()
        e.stopImmediatePropagation()
        
        // Manually scroll the chat messages area
        const delta = e.deltaY
        const currentScroll = chatMessages.scrollTop
        const maxScroll = chatMessages.scrollHeight - chatMessages.clientHeight
        
        // Only scroll if within bounds
        if ((delta > 0 && currentScroll < maxScroll) || (delta < 0 && currentScroll > 0)) {
          chatMessages.scrollTop += delta
        }
        
        return false
      }
    }


    // Use capture phase on document to catch all wheel events
    document.addEventListener('wheel', handleWheel, { passive: false, capture: true })

    return () => {
      document.removeEventListener('wheel', handleWheel, { capture: true } as any)
      // Restore body scroll on cleanup
      document.body.style.overflow = ''
    }
  }, [])

  // Auto-scroll to bottom
  // useEffect(() => {
  //   messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  // }, [messages])

  // Initialize with welcome message
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([{
        role: 'assistant',
        content: "👋 Hello! I'm your AI legal document assistant. What type of document would you like to create today?\n\nYou can ask for documents like:\n• NDA (Non-Disclosure Agreement)\n• Employment Contract\n• Offer Letter\n• Service Agreement\n• Partnership Agreement\n• Rental Agreement\n• Loan Agreement\n• Or any other legal document\n\nJust tell me what you need!",
        timestamp: new Date()
      }])
      setConversationState('asking_category')
    }
  }, [])

  // Auto-resize textarea
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto'
      inputRef.current.style.height = `${inputRef.current.scrollHeight}px`
    }
  }, [input])

  const detectCategory = (text: string): string | null => {
    const lowerText = text.toLowerCase()
    const categoryMap: Record<string, string> = {
      'nda': 'NDA (Non-Disclosure Agreement)',
      'non-disclosure': 'NDA (Non-Disclosure Agreement)',
      'non disclosure': 'NDA (Non-Disclosure Agreement)',
      'confidentiality': 'NDA (Non-Disclosure Agreement)',
      'employment': 'Employment Contract',
      'employment contract': 'Employment Contract',
      'job contract': 'Employment Contract',
      'offer letter': 'Offer Letter',
      'offer': 'Offer Letter',
      'job offer': 'Offer Letter',
      'service agreement': 'Service Agreement',
      'service contract': 'Service Agreement',
      'partnership': 'Partnership Agreement',
      'partnership agreement': 'Partnership Agreement',
      'rental': 'Residential Lease Agreement',
      'lease': 'Residential Lease Agreement',
      'rental agreement': 'Residential Lease Agreement',
      'loan': 'Loan Agreement',
      'loan agreement': 'Loan Agreement',
      'consulting': 'Consulting Agreement',
      'consulting agreement': 'Consulting Agreement',
      'purchase': 'Purchase Agreement',
      'purchase agreement': 'Purchase Agreement'
    }

    for (const [key, value] of Object.entries(categoryMap)) {
      if (lowerText.includes(key)) {
        return value
      }
    }

    return null
  }

  const handleSend = async () => {
    const userMessage = input.trim()
    if (!userMessage) return

    // Add user message
    const newUserMessage: ChatMessage = {
      role: 'user',
      content: userMessage,
      timestamp: new Date()
    }
    setMessages(prev => [...prev, newUserMessage])
    setInput('')

    // Process based on conversation state
    if (conversationState === 'asking_category') {
      // Detect category from user input
      const detectedCategory = detectCategory(userMessage)
      
      if (detectedCategory) {
        setSelectedCategory(detectedCategory)
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: `Great! I'll help you create a ${detectedCategory}.\n\nPlease provide the following details:\n\n• Parties involved (names, roles, addresses)\n• Key terms and conditions\n• Dates (effective date, expiration date, etc.)\n• Any specific clauses or requirements\n• Jurisdiction or governing law (if applicable)\n\nYou can provide these details in natural language. For example:\n"Party A: John Doe, Individual, New York. Party B: ABC Corp, Company, California. Effective date: January 1, 2025. Duration: 1 year."`,
          timestamp: new Date()
        }])
        setConversationState('asking_requirements')
      } else {
        // Ask user to specify category
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: "I'd be happy to help! Could you please specify what type of document you'd like to create?\n\nFor example:\n• NDA (Non-Disclosure Agreement)\n• Employment Contract\n• Offer Letter\n• Service Agreement\n• Partnership Agreement\n• Rental Agreement\n• Loan Agreement\n• Or describe what you need",
          timestamp: new Date()
        }])
      }
    } else if (conversationState === 'asking_requirements') {
      // User provided requirements
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Perfect! I have all the details. Let me generate your document now. This may take a few moments...',
        timestamp: new Date()
      }])
      setConversationState('generating')
      setIsGenerating(true)

      // Generate document
      try {
      const response = await aiContentService.generateContent({
          templateType: selectedCategory,
          requirements: userMessage
      })

      if (response.success && response.data.content) {
        setGeneratedContent(response.data.content)
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: `✅ Your ${selectedCategory} has been generated successfully!\n\nHere's your document:\n\n---\n\n${response.data.content}\n\n---\n\nYou can now download it as PDF or send it as an envelope for e-signing.`,
            timestamp: new Date()
          }])
          setConversationState('generated')
          toast.success('Document generated successfully!')
      } else {
          throw new Error('Failed to generate document')
      }
    } catch (error: any) {
        console.error('Error generating document:', error)
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: `❌ I encountered an error while generating your document: ${error.message || 'Please try again.'}\n\nWould you like to try again or provide more details?`,
          timestamp: new Date()
        }])
        setConversationState('asking_requirements')
        toast.error(error.message || 'Failed to generate document. Please try again.')
    } finally {
      setIsGenerating(false)
      }
    } else if (conversationState === 'generated') {
      // User can ask to regenerate or start new
      if (userMessage.toLowerCase().includes('new') || userMessage.toLowerCase().includes('another') || userMessage.toLowerCase().includes('different')) {
        // Start new conversation
        setMessages([{
          role: 'assistant',
          content: "Great! What type of document would you like to create now?",
          timestamp: new Date()
        }])
        setConversationState('asking_category')
        setSelectedCategory('')
        setGeneratedContent('')
      } else {
        // Respond to other queries
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: "Your document is ready! You can download it as PDF or send it for e-signing using the buttons below. If you'd like to create a new document, just say 'new document' or 'create another'.",
          timestamp: new Date()
        }])
      }
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
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
        documentName: selectedCategory || 'Legal Document'
      })

      if (response.success && response.data.base64) {
        aiContentService.downloadPDF(
          response.data.base64,
          `${(selectedCategory || 'Document').replace(/\s+/g, '_').replace(/[()]/g, '')}.pdf`
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
      setIsSending(true)
      try {
        const response = await aiContentService.storePendingDocument({
          documentName: selectedCategory || 'Legal Document',
          content: generatedContent,
          templateType: selectedCategory || 'Unknown',
          sessionId
        })

        if (response.success) {
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

    setIsSending(true)
    try {
      const response = await aiContentService.convertToPDF({
        content: generatedContent,
        documentName: selectedCategory || 'Legal Document'
      })

      if (response.success && response.data.base64) {
        navigate('/e-sign/create', {
          state: {
            documentData: {
              name: `${(selectedCategory || 'Document').replace(/\s+/g, '_').replace(/[()]/g, '')}.pdf`,
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

  const handleStartNew = () => {
    setMessages([{
      role: 'assistant',
      content: "Great! What type of document would you like to create now?",
      timestamp: new Date()
    }])
    setConversationState('asking_category')
    setSelectedCategory('')
    setGeneratedContent('')
    setInput('')
  }

  return (
    <section id="legal-templates" className="section-padding bg-gray-50">
      <div className="container-max">
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            AI-Powered Legal Document Generator
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Generate professional legal documents in minutes using AI. Simply tell me what you need and I'll guide you through the process.
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

        {/* Chat Interface */}
        <div 
          className="max-w-4xl mx-auto mb-8" 
          id="chat-container-wrapper"
        >
          <div 
            className="bg-white rounded-xl shadow-lg flex flex-col" 
            style={{ 
              height: '700px', 
              maxHeight: '700px', 
              overflow: 'hidden',
              position: 'relative',
              touchAction: 'pan-y'
            }}
          >
            {/* Chat Messages */}
            <div 
              ref={messagesContainerRef}
              className="flex-1 overflow-y-auto p-6 space-y-4" 
              style={{ 
                minHeight: 0, 
                overflowY: 'auto',
                overscrollBehavior: 'contain',
                overscrollBehaviorY: 'contain',
                WebkitOverflowScrolling: 'touch',
                position: 'relative',
                isolation: 'isolate'
              }}
            >
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {message.role === 'assistant' && (
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#260559] flex items-center justify-center">
                      <Bot className="h-5 w-5 text-white" />
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] rounded-lg px-4 py-3 ${message.role === 'user'
                        ? 'bg-[#260559] text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    <div className="whitespace-pre-wrap text-sm leading-relaxed">
                      {message.content}
                    </div>
                    <div className={`text-xs mt-2 ${message.role === 'user' ? 'text-white/70' : 'text-gray-500'}`}>
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                  {message.role === 'user' && (
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
                      <User className="h-5 w-5 text-gray-600" />
                    </div>
                  )}
                </div>
              ))}
              
              {isGenerating && (

                <div className="flex gap-3 justify-start">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#260559] flex items-center justify-center">
                    <Bot className="h-5 w-5 text-white" />
                  </div>
                  <div className="bg-gray-100 rounded-lg px-4 py-3 flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-[#260559]" />
                    <span className="text-sm text-gray-600">Generating your document...</span>
                  </div>
                </div>

              )}
              
              <div ref={messagesEndRef} />
              </div>
              
            {/* Action Buttons (shown when document is generated) */}
            {conversationState === 'generated' && generatedContent && (
              <div className="border-t border-gray-200 p-4 bg-gray-50 flex gap-3">
                  <button
                    onClick={handleDownloadPDF}
                    disabled={isDownloading}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border-2 border-[#260559] text-[#260559] rounded-lg font-semibold hover:bg-[#260559]/10 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
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
                  className="flex-1 bg-[#260559] text-white py-3 px-6 rounded-lg font-semibold hover:bg-[#260559]/90 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isSending ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        {isAuthenticated ? 'Preparing...' : 'Saving...'}
                      </>
                    ) : (
                      <>
                        <Send className="h-5 w-5" />
                      {isAuthenticated ? 'Send as Envelope' : 'Login to Send'}
                      </>
                    )}
                  </button>
                  
                <button
                  onClick={handleStartNew}
                  className="px-4 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-100 transition-all duration-200"
                >
                  New Document
                </button>
              </div>
            )}

            {/* Input Area */}
            <div className="border-t border-gray-200 p-4 bg-white">
              <div className="flex gap-3 items-end">
                <div className="flex-1 relative">
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder={
                      conversationState === 'asking_category'
                        ? "Type the document type you need (e.g., NDA, Offer Letter, Employment Contract)..."
                        : conversationState === 'asking_requirements'
                        ? "Provide the details for your document..."
                        : "Type your message..."
                    }
                    rows={1}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#260559] focus:border-transparent resize-none max-h-32 overflow-y-auto"
                    disabled={isGenerating || conversationState === 'generating'}
                  />
                </div>
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || isGenerating || conversationState === 'generating'}
                  className="px-6 py-3 bg-[#260559] text-white rounded-lg font-semibold hover:bg-[#260559]/90 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isGenerating ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      <Sparkles className="h-5 w-5" />
                      Send
                    </>
                  )}
                </button>
              </div>
              
              {!isAuthenticated && conversationState === 'generated' && (
                <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      You'll be redirected to login after saving your document
                    </p>
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
