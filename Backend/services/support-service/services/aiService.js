const fs = require('fs');
const path = require('path');

/**
 * AI Service for Support Chat
 * Provides AI-powered responses based on project documentation
 */
class AIService {
  constructor() {
    this.knowledgeBase = null;
    // Re-read environment variables in case they weren't loaded when module was required
    this.apiKey = process.env.OPENAI_API_KEY;
    this.model = process.env.AI_MODEL || 'gpt-3.5-turbo';
    // AI is enabled by default unless explicitly disabled
    // It works with or without API key (uses fallback if no API key)
    this.enabled = process.env.AI_CHAT_ENABLED !== 'false';
    this.loadKnowledgeBase();
    
    // Log AI service status with detailed info
    // if (this.enabled) {
    //   if (this.apiKey) {
    //     console.log('✅ AI Chat enabled with OpenAI API');
    //     console.log(`   API Key: ${this.apiKey.substring(0, 7)}...${this.apiKey.substring(this.apiKey.length - 4)}`);
    //     console.log(`   Model: ${this.model}`);
    //   } else {
    //     console.log('✅ AI Chat enabled with rule-based responses (no API key)');
    //     console.log('   To enable OpenAI API, set OPENAI_API_KEY in .env file');
    //   }
    // } else {
    //   console.log('⚠️  AI Chat disabled (AI_CHAT_ENABLED=false)');
    // }
  }

  /**
   * Load knowledge base from project documentation
   */
  loadKnowledgeBase() {
    try {
      const knowledgeBasePath = path.join(__dirname, '../../../../knowledge-base.json');
      
      if (fs.existsSync(knowledgeBasePath)) {
        const data = fs.readFileSync(knowledgeBasePath, 'utf8');
        this.knowledgeBase = JSON.parse(data);
        // console.log('✅ AI Knowledge base loaded successfully');
        // console.log(`📚 Knowledge base stats:`);
        // console.log(`   - Services: ${Object.keys(this.knowledgeBase.services || {}).length}`);
        // console.log(`   - Common Questions: ${Object.keys(this.knowledgeBase.commonQuestions || {}).length}`);
        // console.log(`   - Platform: ${this.knowledgeBase.platform?.name || 'N/A'}`);
        // console.log(`   - Tech Stack: ${this.knowledgeBase.platform?.techStack ? 'Included' : 'Missing'}`);
      } else {
        console.warn('⚠️  knowledge-base.json not found, building from documentation...');
        // Build knowledge base from documentation files
        this.buildKnowledgeBase();
      }
    } catch (error) {
      console.error('Error loading knowledge base:', error);
      this.buildKnowledgeBase();
    }
  }

  /**
   * Build knowledge base from project documentation
   */
  buildKnowledgeBase() {
    const rootPath = path.join(__dirname, '../../../../');
    
    // First, try to load from knowledge-base.json
    const knowledgeBasePath = path.join(rootPath, 'knowledge-base.json');
    if (fs.existsSync(knowledgeBasePath)) {
      try {
        const data = fs.readFileSync(knowledgeBasePath, 'utf8');
        this.knowledgeBase = JSON.parse(data);
        // console.log('✅ Knowledge base loaded from knowledge-base.json');
        return;
      } catch (error) {
        console.warn('Error loading knowledge-base.json, building from scratch:', error.message);
      }
    }
    
    // Fallback: Build basic knowledge base
    const knowledgeBase = {
      platform: {
        name: 'Documantra',
        description: 'A comprehensive electronic signature platform that allows users to create, edit, sign, and manage documents with legal compliance across 40+ countries.',
        url: 'https://esp.documantra.in/',
        features: [
          'Electronic Signatures — Legally binding signatures with compliance across 40+ countries',
          'PDF Tools — 30+ free PDF manipulation tools (convert, edit, merge, compress, secure)',
          'Legal Templates — 45+ professionally drafted legal document templates',
          'AI-Powered Features — Smart document generation and editing assistance',
          'Global Compliance — Meets legal requirements for e-signatures worldwide',
          'API Integration — Developer-friendly REST APIs for automation',
          'Mobile Responsive — Works seamlessly across all devices',
          'Real-time Collaboration — Multi-user document editing and review'
        ],
        techStack: {
          frontend: ['React 18', 'TypeScript', 'Tailwind CSS', 'Vite', 'Lucide React'],
          backend: ['Node.js', 'Express.js', 'MongoDB', 'JWT', 'Docker', 'Nginx']
        }
      },
      services: {
        'document-service': {
          description: 'Document management service for uploading, organizing, and managing documents',
          features: [
            'Document upload and storage',
            'Folder organization with hierarchical structure',
            'Document sharing and permissions',
            'Version control',
            'Search and filtering',
            'Bulk operations'
          ]
        },
        'e-sign-service': {
          description: 'Electronic signature service for creating and managing signature workflows',
          features: [
            'Multi-signer support',
            'Custom signing workflows',
            'Auto-reminders',
            'Legal compliance',
            'Signature tracking',
            'Document distribution'
          ]
        },
        'pdf-service': {
          description: 'Comprehensive PDF manipulation service with 30+ tools',
          features: [
            'PDF conversion (to/from various formats)',
            'PDF editing and merging',
            'PDF compression',
            'Digital signatures',
            'Form filling',
            'OCR (Optical Character Recognition)',
            'PDF optimization',
            'Metadata management',
            'Password protection',
            'Page manipulation'
          ]
        },
        'template-service': {
          description: 'Legal document template service',
          features: [
            '45+ professional legal templates',
            'Template customization',
            'AI-powered template generation',
            'Template management'
          ]
        },
        'support-service': {
          description: 'Customer support service with ticket management',
          features: [
            'Ticket creation and management',
            'Real-time chat support',
            'Agent assignment',
            'Ticket routing',
            'Rating and feedback',
            'AI-powered chat support'
          ]
        }
      },
      support: {
        categories: ['technical', 'billing', 'documentation', 'feature', 'bug', 'other'],
        priorities: ['low', 'medium', 'high', 'urgent'],
        ticketStatuses: ['open', 'ongoing', 'closed']
      },
      commonQuestions: {
        'How do I sign a document?': 'You can sign documents through the E-Signature service. Upload your document, add signature fields, and send it to signers. Signers will receive an email notification and can sign electronically.',
        'What PDF tools are available?': 'We offer 30+ PDF tools including conversion, editing, merging, compression, digital signatures, form filling, OCR, optimization, and more. Visit the PDF Tools section to access all features.',
        'How do I create a document template?': 'Go to the Template Service section, browse our 45+ legal templates, or create a custom template. You can use AI-powered generation to create templates from natural language prompts.',
        'Is my signature legally binding?': 'Yes! Our electronic signatures are legally binding and comply with legal requirements across 40+ countries, including ESIGN Act (US), eIDAS (EU), and similar regulations worldwide.',
        'How do I share a document?': 'In the Document Service, select a document and use the Share feature. You can share with specific users, set permissions (view, comment, edit, full), and generate shareable links.',
        'What file formats are supported?': 'We support PDF, DOC, DOCX, and various image formats. PDF tools can convert between many formats including images, Word documents, and more.',
        'How do I track document status?': 'In the E-Signature service, you can track document status, see who has signed, view signing history, and receive notifications when documents are completed.',
        'Can I use the API?': 'Yes! We provide developer-friendly REST APIs for automation. Check the API documentation for endpoints and authentication details.'
      }
    };

    // Try to read additional documentation files
    try {
      const readmePath = path.join(rootPath, 'README.md');
      if (fs.existsSync(readmePath)) {
        const readme = fs.readFileSync(readmePath, 'utf8');
        knowledgeBase.documentation = {
          readme: readme.substring(0, 5000) // Limit size
        };
      }
    } catch (error) {
      console.warn('Could not read README.md:', error.message);
    }

    this.knowledgeBase = knowledgeBase;
    
    // Save to file for future use
    try {
      const knowledgeBasePath = path.join(__dirname, '../../../../knowledge-base.json');
      fs.writeFileSync(knowledgeBasePath, JSON.stringify(knowledgeBase, null, 2));
    //   console.log('✅ Knowledge base built and saved');
    } catch (error) {
      console.warn('Could not save knowledge base:', error.message);
    }
  }

  /**
   * Generate AI response using OpenAI API or fallback to rule-based responses
   */
  async generateResponse(userMessage, ticketContext = {}) {
    if (!this.enabled) {
    //   console.log('⚠️  AI: Disabled, using fallback');
      return this.getFallbackResponse(userMessage);
    }

    // Re-check API key in case env vars were loaded after constructor
    const currentApiKey = process.env.OPENAI_API_KEY;
    if (currentApiKey && !this.apiKey) {
    //   console.log('🔄 AI: API key detected (was not available at startup, now available)');
      this.apiKey = currentApiKey;
    }
    
    // Log which method will be used
    // if (this.apiKey || currentApiKey) {
    //   const apiKeyToUse = this.apiKey || currentApiKey;
    //     console.log('🤖 AI: Using OpenAI API (API key found)');
    //     console.log(`   API Key: ${apiKeyToUse.substring(0, 7)}...${apiKeyToUse.substring(apiKeyToUse.length - 4)}`);
    //     console.log(`📚 AI: Knowledge base loaded: ${this.knowledgeBase ? 'Yes' : 'No'}`);
    //   if (this.knowledgeBase) {
    //     console.log(`📚 AI: Knowledge base has ${Object.keys(this.knowledgeBase.services || {}).length} services`);
    //     console.log(`📚 AI: Knowledge base has ${Object.keys(this.knowledgeBase.commonQuestions || {}).length} common questions`);
    //   }
    // } else {
    //   console.log('⚠️  AI: No API key, using rule-based fallback');
    //   console.log('   Check: Is OPENAI_API_KEY set in Backend/services/support-service/.env?');
    //   console.log(`   Current OPENAI_API_KEY value: ${process.env.OPENAI_API_KEY ? 'Set (' + process.env.OPENAI_API_KEY.substring(0, 7) + '...)' : 'NOT SET'}`);
    // }

    try {
      // Check if we have OpenAI API key (re-check in case it was loaded after constructor)
      const apiKeyToUse = this.apiKey || process.env.OPENAI_API_KEY;
      if (apiKeyToUse) {
        // Update instance variable if it wasn't set before
        if (!this.apiKey) {
          this.apiKey = apiKeyToUse;
        }
        return await this.generateOpenAIResponse(userMessage, ticketContext);
      } else {
        return this.getFallbackResponse(userMessage);
      }
    } catch (error) {
      console.error('Error generating AI response:', error);
      return this.getFallbackResponse(userMessage);
    }
  }

  /**
   * Generate response using OpenAI API
   */
  async generateOpenAIResponse(userMessage, ticketContext) {
    try {
      // Import OpenAI dynamically (install with: npm install openai)
      let OpenAI;
      try {
        OpenAI = require('openai').OpenAI;
      } catch (requireError) {
        console.error('❌ OpenAI package not installed. Install it with: npm install openai');
        // console.log('⚠️  Falling back to rule-based responses');
        return this.getFallbackResponse(userMessage);
      }

      const openai = new OpenAI({ apiKey: this.apiKey });

      // Build system prompt with knowledge base
      const systemPrompt = this.buildSystemPrompt(ticketContext);
      
      // Log prompt info for debugging
    //   console.log(`📝 OpenAI: System prompt length: ${systemPrompt.length} characters`);
    //   console.log(`📝 OpenAI: Using model: ${this.model}`);
    //   console.log(`📝 OpenAI: API key present: ${this.apiKey ? 'Yes (starts with ' + this.apiKey.substring(0, 7) + '...)' : 'No'}`);

    //   console.log('🤖 OpenAI: Sending request to API...');
      const startTime = Date.now();
      const response = await openai.chat.completions.create({
        model: this.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage }
        ],
        temperature: 0.7,
        max_tokens: 800
      });

      const responseTime = Date.now() - startTime;
      const aiResponse = response.choices[0].message.content.trim();
    //   console.log(`✅ OpenAI: Received response from API (${responseTime}ms)`);
    //   console.log(`✅ OpenAI: Response length: ${aiResponse.length} characters`);
    //   console.log(`✅ OpenAI: Tokens used: ${response.usage?.total_tokens || 'N/A'}`);
      return aiResponse;
    } catch (error) {
      console.error('❌ OpenAI API error:', error.message);
      if (error.code === 'MODULE_NOT_FOUND') {
        console.error('   OpenAI package not found. Install with: npm install openai');
      } else if (error.status === 401) {
        console.error('   Invalid API key. Check your OPENAI_API_KEY in .env');
      } else if (error.status === 429) {
        console.error('   Rate limit exceeded. Please try again later.');
      }
      // Fallback to rule-based if API fails
    //   console.log('⚠️  Falling back to rule-based response');
      return this.getFallbackResponse(userMessage);
    }
  }

  /**
   * Build system prompt with knowledge base information
   */
  buildSystemPrompt(ticketContext) {
    const kb = this.knowledgeBase;
    
    if (!kb) {
      console.error('❌ Knowledge base not loaded!');
      return 'You are a helpful AI support assistant for Documantra platform.';
    }
    
    let prompt = `You are a helpful AI support assistant for Documantra, a comprehensive electronic signature and document management platform.

PLATFORM INFORMATION:
- Name: ${kb.platform.name}
- Description: ${kb.platform.description}
- URL: ${kb.platform.url}

TECHNOLOGY STACK:
Frontend Technologies: ${kb.platform.techStack?.frontend?.join(', ') || 'React 18, TypeScript, Tailwind CSS, Vite, Lucide React'}
Backend Technologies: ${kb.platform.techStack?.backend?.join(', ') || 'Node.js (v16+), Express.js, MongoDB, JWT'}
Architecture: ${kb.platform.techStack?.architecture || 'Microservices'}
Deployment: ${kb.platform.deployment ? Object.entries(kb.platform.deployment).map(([k, v]) => `${k}: ${v}`).join(', ') : 'Docker + Docker Compose, Nginx Gateway, MongoDB Database'}

IMPORTANT: When users ask about "tech stack", "technology", "technologies used", or "what technology", provide the detailed technology stack information above.

KEY FEATURES:
${kb.platform.features?.map(f => `- ${f}`).join('\n') || 'Various features available'}

SERVICES AVAILABLE:
${Object.entries(kb.services || {}).map(([name, info]) => {
  const serviceName = info.name || name;
  const features = Array.isArray(info.features) ? info.features.slice(0, 8).join(', ') : 'Various features available';
  return `- ${serviceName} (${name}): ${info.description}\n  Key Features: ${features}`;
}).join('\n\n')}

SUPPORT INFORMATION:
- Ticket Categories: ${kb.support?.categories?.join(', ') || 'technical, billing, documentation, feature, bug, other'}
- Priorities: ${kb.support?.priorities?.join(', ') || 'low, medium, high, urgent'}
- Statuses: ${kb.support?.ticketStatuses?.join(', ') || 'open, ongoing, closed'}

COMMON QUESTIONS AND ANSWERS:
${Object.entries(kb.commonQuestions || {}).map(([q, a]) => {
  const answer = typeof a === 'string' ? a : a.answer;
  return `Q: ${q}\nA: ${answer}`;
}).join('\n\n')}

INSTRUCTIONS:
1. Provide accurate, helpful, and friendly responses based on the platform information above
2. If you don't know something, suggest contacting support or checking the documentation
3. Be concise but thorough
4. Use the platform's terminology and feature names correctly
5. If the question is about a specific service, provide detailed information about that service
6. Always be professional and helpful

${ticketContext.category ? `Current ticket category: ${ticketContext.category}` : ''}
${ticketContext.subject ? `Ticket subject: ${ticketContext.subject}` : ''}`;

    return prompt;
  }

  /**
   * Fallback rule-based response system
   */
  getFallbackResponse(userMessage) {
    const message = userMessage.toLowerCase();
    const kb = this.knowledgeBase;

    if (!kb || !kb.commonQuestions) {
      console.warn('Knowledge base not loaded, using default response');
      return this.getDefaultResponse();
    }

    // First, check for service-specific queries (more specific, check first)
    if (kb.services) {
      // Document Management Service (check first, before template matching)
      if (message.includes('document management') || message.includes('document service') || 
          (message.includes('document') && !message.includes('template') && 
           (message.includes('upload') || message.includes('store') || message.includes('organize') || 
            message.includes('folder') || message.includes('share') || message.includes('manage')))) {
        const docService = kb.services['document-service'];
        if (docService) {
          const features = Array.isArray(docService.features) ? docService.features.slice(0, 10).join('\n- ') : '';
          return `The Document Management Service allows you to upload, organize, and manage your documents.\n\nKey Features:\n- ${features}\n\nFile Limits: Maximum 50MB per file, up to 10 files per upload.\n\nTo use it, go to the Document Service section in the platform. You can create folders, upload documents, share them with others, set permissions, and organize your files efficiently.`;
        }
      }
      
      // E-Signature Service
      if (message.includes('e-sign') || message.includes('esign') || 
          (message.includes('sign') && (message.includes('electron') || message.includes('digital') || message.includes('envelope')))) {
        const esignService = kb.services['e-sign-service'];
        if (esignService) {
          return `The E-Signature Service enables secure electronic signatures. ${esignService.description}\n\nKey features include multi-signer support, custom signing workflows, legal compliance (ESIGN Act, eIDAS, 40+ countries), signature tracking, and document distribution with email notifications.\n\nTo sign a document: Create an envelope, upload your document, add recipients, place signature fields, and send. Recipients will receive email notifications to sign electronically.`;
        }
      }
      
      // PDF Service
      if (message.includes('pdf') && (message.includes('tool') || message.includes('service') || message.includes('convert') || message.includes('edit'))) {
        const pdfService = kb.services['pdf-service'];
        if (pdfService && pdfService.tools) {
          const toolCount = Object.values(pdfService.tools).reduce((sum, tools) => sum + (Array.isArray(tools) ? tools.length : 0), 0);
          return `We offer ${toolCount}+ PDF tools organized into categories:\n\n- Conversion: PDF to Word, Excel, PowerPoint, HTML, Image, Text, EPUB and vice versa\n- Editing: Merge, Split, Compress, Rotate, Crop, Delete/Insert pages, Reorder\n- Forms: Fill forms, Create forms, Form recognition\n- Security: Add/Remove password, Set permissions, Digital signature\n- OCR: Text recognition with 100+ languages support\n- Analysis: PDF info, Statistics, Quality analysis, Compare, Validate\n- Optimization: Optimize images/fonts/colors, Batch optimization\n\nVisit the PDF Tools section to access all features.`;
        }
      }
      
      // Template Service
      if (message.includes('template') && !message.includes('document management') && !message.includes('document service')) {
        const templateService = kb.services['template-service'];
        if (templateService) {
          return `The Template Service provides ${templateService.features[0]}. You can browse 45+ professional legal templates, create custom templates, use AI-powered generation, and manage templates with form builder and workflow automation features.`;
        }
      }
    }

    // Check common questions (exact or close matches)
    // Handle both old format (string) and new format (object with answer property)
    for (const [question, answerData] of Object.entries(kb.commonQuestions)) {
      const answer = typeof answerData === 'string' ? answerData : answerData.answer;
      const questionLower = question.toLowerCase();
      const messageWords = message.split(' ').filter(w => w.length > 2);
      const questionWords = questionLower.split(' ').filter(w => w.length > 2);
      
      // Check for significant word overlap (at least 2-3 key words match)
      const matchingWords = questionWords.filter(qw => messageWords.some(mw => mw.includes(qw) || qw.includes(mw)));
      
      // More strict matching - require at least 2 matching significant words or exact phrase match
      if (matchingWords.length >= 2 || message.includes(questionLower.substring(0, Math.min(20, questionLower.length)))) {
        return answer;
      }
    }

    // Pattern matching for common queries (order matters - more specific first)
    
    // Document Management Service (check before template to avoid false matches)
    if (message.includes('document management') || message.includes('document service') || 
        (message.includes('document') && (message.includes('upload') || message.includes('store') || message.includes('organize') || message.includes('folder')))) {
      const docService = kb.services?.['document-service'];
      if (docService) {
        return `The Document Management Service allows you to upload, organize, and manage your documents. Key features include:\n\n- Document upload and storage (supports PDF, DOC, DOCX, TXT, RTF, XLS, XLSX, CSV, PPT, PPTX, and images)\n- Folder organization with hierarchical structure\n- Document sharing with permissions (view, comment, edit, full access)\n- Version control and history tracking\n- Advanced search and filtering\n- Bulk operations (delete, move)\n- Trash system with 30-day retention and restore functionality\n- Favorites and archiving\n- Document metadata (description, tags)\n- Statistics (views, downloads)\n\nFile limits: Maximum 50MB per file, up to 10 files per upload.\n\nTo use it, go to the Document Service section in the platform.`;
      }
      return `The Document Management Service helps you upload, organize, and manage documents. You can create folders, share documents with others, set permissions, search and filter documents, and more. Go to the Document Service section to get started.`;
    }

    // E-Signature Service
    if (message.includes('sign') || message.includes('signature') || message.includes('e-sign')) {
      return `To sign a document, go to the E-Signature service. You can: 1) Create an envelope and upload your document, 2) Add recipients and set signing order, 3) Place signature fields on the document, 4) Send the envelope. Recipients will receive email notifications and can sign electronically. Our signatures are legally binding and comply with regulations in 40+ countries.`;
    }

    // PDF Tools
    if (message.includes('pdf') || (message.includes('tool') && !message.includes('template'))) {
      return `We offer 30+ PDF tools including conversion, editing, merging, compression, digital signatures, form filling, OCR, optimization, and more. Visit the PDF Tools section in the platform to access all features.`;
    }

    // Template Service (check after document management to avoid false matches)
    if ((message.includes('template') && !message.includes('document management')) || 
        (message.includes('document template') && !message.includes('service'))) {
      return `You can create document templates in the Template Service section. We offer 45+ professional legal templates, or you can create custom templates using our AI-powered generation feature. The template service includes a form builder, template marketplace, and workflow automation features.`;
    }

    // Document Sharing
    if (message.includes('share') || message.includes('collaborat')) {
      return `To share documents, go to the Document Service, select a document, and use the Share feature. You can share with specific users, set permissions (view, comment, edit, full), and generate shareable links. Documents can be organized in folders and shared at the folder level as well.`;
    }

    if (message.includes('api') || message.includes('developer')) {
      return `Yes! We provide developer-friendly REST APIs for automation. The platform uses a microservices architecture with separate services for documents, e-signatures, PDF tools, templates, and support. Check the API documentation for endpoints and authentication details.`;
    }

    if (message.includes('format') || message.includes('file type')) {
      return `We support PDF, DOC, DOCX, and various image formats. Our PDF tools can convert between many formats including images, Word documents, and more.`;
    }

    if (message.includes('legal') || message.includes('complianc')) {
      return `Our electronic signatures are legally binding and comply with legal requirements across 40+ countries, including ESIGN Act (US), eIDAS (EU), and similar regulations worldwide.`;
    }

    // Tech Stack queries
    if (message.includes('tech stack') || message.includes('technology') || message.includes('technologies') || 
        message.includes('what technology') || message.includes('what tech')) {
      const kb = this.knowledgeBase;
      if (kb && kb.platform && kb.platform.techStack) {
        return `The Documantra platform uses the following technology stack:\n\n**Frontend:**\n${kb.platform.techStack.frontend?.map(t => `- ${t}`).join('\n') || 'React 18, TypeScript, Tailwind CSS, Vite, Lucide React'}\n\n**Backend:**\n${kb.platform.techStack.backend?.map(t => `- ${t}`).join('\n') || 'Node.js, Express.js, MongoDB, JWT'}\n\n**Architecture:**\n- ${kb.platform.techStack.architecture || 'Microservices'}\n\n**Deployment:**\n${kb.platform.deployment ? Object.entries(kb.platform.deployment).map(([k, v]) => `- ${k}: ${v}`).join('\n') : '- Docker + Docker Compose\n- Nginx Gateway\n- MongoDB Database'}`;
      }
      return `The platform uses React 18, TypeScript, Tailwind CSS for frontend, and Node.js, Express.js, MongoDB for backend. It follows a microservices architecture with Docker deployment.`;
    }

    if (message.includes('help') || message.includes('how')) {
      return `I'm here to help! Documantra is a comprehensive platform for document management and electronic signatures. You can:\n\n- Upload and manage documents\n- Create and sign documents electronically\n- Use 30+ PDF tools\n- Access 45+ legal templates\n- Share and collaborate on documents\n\nWhat specific feature would you like help with?`;
    }

    // Default response
    return this.getDefaultResponse();
  }

  /**
   * Get default response when no match is found
   */
  getDefaultResponse() {
    return `Thank you for contacting Documantra support! I'm an AI assistant here to help you with questions about our platform.\n\nOur platform offers:\n- Electronic signatures with legal compliance\n- 30+ PDF manipulation tools\n- 45+ legal document templates\n- Document management and sharing\n- Real-time collaboration\n\nCould you please provide more details about what you need help with? This will help me give you a more specific answer.`;
  }

  /**
   * Check if message should trigger AI response
   */
  shouldRespond(message, ticketContext) {
    // Don't respond to AI messages
    if (ticketContext.lastSenderType === 'ai') {
      return false;
    }

    // Don't respond if agent has already responded recently
    if (ticketContext.lastSenderType === 'agent') {
      return false;
    }

    // Respond to customer messages
    if (ticketContext.lastSenderType === 'customer') {
      return true;
    }

    return false;
  }
}

module.exports = new AIService();

