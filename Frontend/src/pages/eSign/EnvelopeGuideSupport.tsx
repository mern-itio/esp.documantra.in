import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ChevronRight,
  ChevronDown,
  FileText,
  Upload,
  User,
  Key,
  MessageSquare,
  FileSignature,
  Eye,
  Send,
  CheckCircle2,
  Info,
  Search,
  Menu,
  X
} from 'lucide-react';

interface GuideSection {
  id: string;
  title: string;
  subsections?: { id: string; title: string }[];
}

const EnvelopeGuideSupport: React.FC = () => {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState<string>('getting-started');
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['sending-documents']));
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const guideSections: GuideSection[] = [
    {
      id: 'getting-started',
      title: 'Getting Started'
    },
    {
      id: 'sending-documents',
      title: 'Sending Documents for Signature',
      subsections: [
        { id: 'start-envelope', title: 'Start an Envelope' },
        { id: 'upload-documents', title: 'Upload Documents' },
        { id: 'add-recipients', title: 'Add Recipients' },
        { id: 'customize-options', title: 'Customize Options' },
        { id: 'add-messages', title: 'Add Messages' },
        { id: 'signing-editor', title: 'Place Signature Fields' },
        { id: 'review-send', title: 'Review and Send' }
      ]
    },
    {
      id: 'signing-documents',
      title: 'Signing Documents',
      subsections: [
        { id: 'receive-envelope', title: 'Receive an Envelope' },
        { id: 'sign-document', title: 'Sign a Document' }
      ]
    },
    {
      id: 'troubleshooting',
      title: 'Troubleshooting'
    }
  ];

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  const scrollToSection = (sectionId: string) => {
    setActiveSection(sectionId);
    const element = document.getElementById(sectionId);
    if (element) {
      const offset = 100;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
    setIsMobileMenuOpen(false);
  };

  useEffect(() => {
    const handleScroll = () => {
      const sections = guideSections.flatMap(section => 
        section.subsections 
          ? [section.id, ...section.subsections.map(sub => sub.id)]
          : [section.id]
      );

      for (let i = sections.length - 1; i >= 0; i--) {
        const element = document.getElementById(sections[i]);
        if (element) {
          const rect = element.getBoundingClientRect();
          if (rect.top <= 150 && rect.bottom >= 150) {
            setActiveSection(sections[i]);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const renderContent = () => {
    switch (activeSection) {
      case 'getting-started':
        return (
          <div id="getting-started" className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-900">Getting Started with {BRAND.name}</h1>
            <div className="prose max-w-none">
              <p className="text-lg text-gray-700 leading-relaxed">
                Welcome to {BRAND.name}! This guide will walk you through the complete process of sending documents for signature, from uploading your documents to receiving signed copies.
              </p>
              
              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 my-6 rounded">
                <div className="flex items-start">
                  <Info className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-blue-900 mb-1">Quick Start</h3>
                    <p className="text-blue-800 text-sm">
                      The envelope creation process consists of several steps: Upload Documents → Add Recipients → Customize Options → Add Messages → Place Signature Fields → Review and Send.
                    </p>
                  </div>
                </div>
              </div>

              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">What You'll Learn</h2>
              <ul className="space-y-2 text-gray-700">
                <li>How to upload and prepare documents for signing</li>
                <li>How to add recipients and set signing order</li>
                <li>How to customize authentication methods</li>
                <li>How to place signature fields on documents</li>
                <li>How to review and send your envelope</li>
              </ul>

              <div className="mt-8 p-6 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-[#BBF7D0]">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Ready to Get Started?</h3>
                <p className="text-gray-700 mb-4">
                  Follow the steps in this guide to send your first envelope. Each section provides detailed instructions with helpful tips.
                </p>
                <button
                  onClick={() => scrollToSection('start-envelope')}
                  className="px-6 py-2 bg-purple-600 text-white rounded-sm hover:bg-purple-700 transition-colors font-medium" style={{backgroundColor: '#260559'}}
                >
                  Start Creating Envelope
                </button>
              </div>
            </div>
          </div>
        );

      case 'start-envelope':
        return (
          <div id="start-envelope" className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-900">Start an Envelope</h1>
            <div className="flex items-center gap-4 text-sm text-gray-600 mb-6">
              <span>Last updated: {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
              <span>•</span>
              <span>5 min read</span>
            </div>

            <div className="prose max-w-none">
              <p className="text-lg text-gray-700 leading-relaxed">
                You can start an envelope and get signatures in the following ways:
              </p>

              <div className="mt-8 space-y-6">
                <div className="border-l-4 border-blue-500 pl-6 py-4 bg-blue-50 rounded-r-lg">
                  <h3 className="text-xl font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <span className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">1</span>
                    From the Home page
                  </h3>
                  <p className="text-gray-700 mb-4">
                    Navigate to the <strong>eSignature</strong> section and click <strong>Start</strong> → <strong>Send an Envelope</strong>.
                  </p>
                  <div className="bg-[#F7F3EE] p-4 rounded-lg border border-gray-200 shadow-sm">
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                      <FileText className="w-4 h-4" />
                      <span>Navigation Path</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-800">
                      <span className="px-3 py-1 bg-gray-100 rounded">Home</span>
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                      <span className="px-3 py-1 bg-gray-100 rounded">E-Sign</span>
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                      <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded font-medium">Create Envelope</span>
                    </div>
                  </div>
                </div>

                <div className="border-l-4 border-green-500 pl-6 py-4 bg-green-50 rounded-r-lg">
                  <h3 className="text-xl font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <span className="bg-green-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">2</span>
                    From the Agreements page
                  </h3>
                  <p className="text-gray-700 mb-4">
                    Go to <strong>Agreements</strong> and click the <strong>New Envelope</strong> button, or use the <strong>Start</strong> menu.
                  </p>
                  <div className="bg-[#F7F3EE] p-4 rounded-lg border border-gray-200 shadow-sm">
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                      <FileText className="w-4 h-4" />
                      <span>Navigation Path</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-800">
                      <span className="px-3 py-1 bg-gray-100 rounded">Agreements</span>
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                      <span className="px-3 py-1 bg-green-100 text-green-700 rounded font-medium">New Envelope</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
                <h3 className="font-semibold text-yellow-900 mb-2 flex items-center gap-2">
                  <Info className="w-5 h-5" />
                  <span>Tip</span>
                </h3>
                <p className="text-yellow-800 text-sm">
                  You can also create envelopes from templates if you frequently send similar documents. This saves time and ensures consistency.
                </p>
              </div>
            </div>
          </div>
        );

      case 'upload-documents':
        return (
          <div id="upload-documents" className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-900">Upload Documents to an Envelope</h1>
            <div className="prose max-w-none">
              <p className="text-lg text-gray-700 leading-relaxed mb-6">
                The first step in creating an envelope is uploading your documents. {BRAND.name} supports PDF files for signing.
              </p>

              <div className="space-y-6">
                <div className="bg-[#F7F3EE] border border-gray-200 rounded-lg p-6 shadow-sm">
                  <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Upload className="w-6 h-6 text-blue-600" />
                    <span>Upload Methods</span>
                  </h2>
                  
                  <div className="space-y-4">
                    <div className="flex items-start gap-4 p-4 bg-[#F5F2EE] rounded-lg">
                      <div className="bg-blue-100 rounded-full p-2">
                        <Upload className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-2">Drag and Drop</h3>
                        <p className="text-gray-700 text-sm">
                          Simply drag PDF files from your computer and drop them into the upload area. You can upload multiple files at once.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4 p-4 bg-[#F5F2EE] rounded-lg">
                      <div className="bg-green-100 rounded-full p-2">
                        <FileText className="w-5 h-5 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-2">Browse Files</h3>
                        <p className="text-gray-700 text-sm">
                          Click the "Browse" or "Choose Files" button to open your file explorer and select PDF documents to upload.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded">
                  <h3 className="font-semibold text-blue-900 mb-3">Best Practices</h3>
                  <ul className="list-disc list-inside space-y-2 text-blue-800 text-sm">
                    <li>Ensure all documents are in PDF format</li>
                    <li>Check that documents are not password-protected (or remove password before uploading)</li>
                    <li>Verify document quality and readability</li>
                    <li>Organize documents in the order you want recipients to see them</li>
                  </ul>
                </div>

                <div className="bg-[#F7F3EE] border border-gray-200 rounded-lg p-6 shadow-sm">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Document Management</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-[#F5F2EE] rounded">
                      <span className="text-gray-700">Reorder Documents</span>
                      <span className="text-sm text-gray-500">Drag and drop to change order</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-[#F5F2EE] rounded">
                      <span className="text-gray-700">Remove Documents</span>
                      <span className="text-sm text-gray-500">Click the X button on any document</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-[#F5F2EE] rounded">
                      <span className="text-gray-700">Preview Documents</span>
                      <span className="text-sm text-gray-500">Click on document name to preview</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'add-recipients':
        return (
          <div id="add-recipients" className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-900">Add Recipients to an Envelope</h1>
            <div className="prose max-w-none">
              <p className="text-lg text-gray-700 leading-relaxed mb-6">
                Recipients are the people who need to sign or review your documents. You can add recipients individually or in bulk.
              </p>

              <div className="space-y-6">
                <div className="bg-[#F7F3EE] border border-gray-200 rounded-lg p-6 shadow-sm">
                  <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <User className="w-6 h-6 text-blue-600" />
                    <span>Adding Individual Recipients</span>
                  </h2>
                  
                  <ol className="list-decimal list-inside space-y-4 text-gray-700">
                    <li className="pl-2">
                      <strong>Click "Add Recipient"</strong> button in the recipients section
                    </li>
                    <li className="pl-2">
                      <strong>Enter recipient information:</strong>
                      <ul className="list-disc list-inside ml-6 mt-2 space-y-1 text-sm">
                        <li>Full Name (required)</li>
                        <li>Email Address (required)</li>
                        <li>Role: Signer, Approver, or Carbon Copy</li>
                      </ul>
                    </li>
                    <li className="pl-2">
                      <strong>Click "Add"</strong> to add the recipient to your envelope
                    </li>
                  </ol>
                </div>

                <div className="bg-[#F7F3EE] border border-gray-200 rounded-lg p-6 shadow-sm">
                  <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <User className="w-6 h-6 text-green-600" />
                    <span>Bulk Add Recipients</span>
                  </h2>
                  
                  <p className="text-gray-700 mb-4">
                    For multiple recipients, use the Bulk Send feature:
                  </p>
                  
                  <div className="space-y-3">
                    <div className="flex items-start gap-3 p-4 bg-[#F5F2EE] rounded-lg">
                      <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-1">Manual Entry</h3>
                        <p className="text-gray-700 text-sm">
                          Add multiple recipients by entering their information in the bulk entry form. Each recipient needs a name and email address.
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3 p-4 bg-[#F5F2EE] rounded-lg">
                      <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-1">CSV Upload</h3>
                        <p className="text-gray-700 text-sm">
                          Upload a CSV file with recipient information. Download the sample CSV template to see the required format.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-[#F7F3EE] border border-gray-200 rounded-lg p-6 shadow-sm">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Set Signing Order</h3>
                  <div className="space-y-3">
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <h4 className="font-semibold text-blue-900 mb-2">Sequential Order</h4>
                      <p className="text-blue-800 text-sm">
                        Recipients sign one after another in the order you specify. Each recipient must sign before the next one receives the document.
                      </p>
                    </div>
                    <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                      <h4 className="font-semibold text-green-900 mb-2">Parallel Order</h4>
                      <p className="text-green-800 text-sm">
                        All recipients receive the document at the same time and can sign in any order. The envelope is completed when all recipients have signed.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'customize-options':
        return (
          <div id="customize-options" className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-900">Customize Options - Authentication Methods</h1>
            <div className="prose max-w-none">
              <p className="text-lg text-gray-700 leading-relaxed mb-6">
                Enhance the security of your envelope by adding authentication methods for recipients. This ensures that only authorized individuals can sign your documents.
              </p>

              <div className="space-y-6">
                <div className="bg-[#F7F3EE] border border-gray-200 rounded-lg p-6 shadow-sm">
                  <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Key className="w-6 h-6 text-[#155E4B]" />
                    <span>How to Add Authentication</span>
                  </h2>
                  
                  <ol className="list-decimal list-inside space-y-4 text-gray-700">
                    <li className="pl-2">
                      <strong>Click the "Customize" button</strong> next to any recipient
                    </li>
                    <li className="pl-2">
                      <strong>Select "Add authentication method"</strong> from the dropdown menu
                    </li>
                    <li className="pl-2">
                      <strong>Choose an authentication method:</strong>
                      <ul className="list-disc list-inside ml-6 mt-2 space-y-2 text-sm">
                        <li><strong>Email Verification:</strong> Recipient verifies their email address</li>
                        <li><strong>Access Code:</strong> Recipient enters a code you provide</li>
                        <li><strong>SMS Verification:</strong> Recipient receives a code via text message</li>
                        <li><strong>Knowledge-Based Authentication (KBA):</strong> Recipient answers security questions</li>
                      </ul>
                    </li>
                    <li className="pl-2">
                      <strong>Configure the settings</strong> for your chosen method and save
                    </li>
                  </ol>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-5">
                    <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                      <Key className="w-5 h-5" />
                      <span>Access Code</span>
                    </h3>
                    <p className="text-blue-800 text-sm mb-3">
                      Create a unique code that recipients must enter before signing. Share this code securely through a separate channel (phone, email, etc.).
                    </p>
                    <div className="text-xs text-blue-700 bg-blue-100 px-3 py-2 rounded">
                      <strong>Best for:</strong> High-security documents, sensitive agreements
                    </div>
                  </div>

                  <div className="bg-green-50 border border-green-200 rounded-lg p-5">
                    <h3 className="font-semibold text-green-900 mb-2 flex items-center gap-2">
                      <MessageSquare className="w-5 h-5" />
                      <span>SMS Verification</span>
                    </h3>
                    <p className="text-green-800 text-sm mb-3">
                      Recipients receive a verification code via text message to their mobile phone. They must enter this code to proceed.
                    </p>
                    <div className="text-xs text-green-700 bg-green-100 px-3 py-2 rounded">
                      <strong>Best for:</strong> Mobile-friendly workflows, quick verification
                    </div>
                  </div>
                </div>

                <div className="bg-yellow-50 border-l-4 border-yellow-500 p-6 rounded">
                  <h3 className="font-semibold text-yellow-900 mb-2 flex items-center gap-2">
                    <Info className="w-5 h-5" />
                    <span>Important Note</span>
                  </h3>
                  <p className="text-yellow-800 text-sm">
                    Authentication methods may require additional credits or subscription features. Check your plan details to see which methods are available.
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      case 'add-messages':
        return (
          <div id="add-messages" className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-900">Add Messages to an Envelope</h1>
            <div className="prose max-w-none">
              <p className="text-lg text-gray-700 leading-relaxed mb-6">
                Personalize your envelope by adding a subject line and message. This helps recipients understand what they're signing and why.
              </p>

              <div className="space-y-6">
                <div className="bg-[#F7F3EE] border border-gray-200 rounded-lg p-6 shadow-sm">
                  <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <MessageSquare className="w-6 h-6 text-blue-600" />
                    <span>Email Subject</span>
                  </h2>
                  
                  <p className="text-gray-700 mb-4">
                    The subject line appears in the email notification sent to recipients. Make it clear and descriptive.
                  </p>
                  
                  <div className="bg-[#F5F2EE] p-4 rounded-lg border border-gray-200">
                    <p className="text-sm text-gray-600 mb-2">Example subjects:</p>
                    <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                      <li>"Please sign: Employment Agreement - [Your Name]"</li>
                      <li>"Action Required: Contract Review and Signature"</li>
                      <li>"Document for Your Signature: [Document Type]"</li>
                    </ul>
                  </div>
                </div>

                <div className="bg-[#F7F3EE] border border-gray-200 rounded-lg p-6 shadow-sm">
                  <h2 className="text-2xl font-semibold text-gray-900 mb-4">Email Message</h2>
                  
                  <p className="text-gray-700 mb-4">
                    Add an optional message that will be included in the email. Use this to provide context, instructions, or important information.
                  </p>
                  
                  <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                    <h3 className="font-semibold text-blue-900 mb-2">Message Best Practices</h3>
                    <ul className="list-disc list-inside space-y-1 text-blue-800 text-sm">
                      <li>Keep messages concise and professional</li>
                      <li>Explain why the document needs to be signed</li>
                      <li>Include any deadlines or important dates</li>
                      <li>Provide contact information for questions</li>
                    </ul>
                  </div>
                </div>

                <div className="bg-[#F7F3EE] border border-gray-200 rounded-lg p-6 shadow-sm">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Private Messages</h3>
                  <p className="text-gray-700 mb-4">
                    You can also add private messages for specific recipients. These messages are only visible to that recipient.
                  </p>
                  <div className="flex items-start gap-3 p-4 bg-[#F5F2EE] rounded-lg">
                    <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <p className="text-gray-700 text-sm">
                      To add a private message, click the "Customize" button next to a recipient and select "Add private message".
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'signing-editor':
        return (
          <div id="signing-editor" className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-900">Place Signature Fields on Documents</h1>
            <div className="prose max-w-none">
              <p className="text-lg text-gray-700 leading-relaxed mb-6">
                After adding recipients and configuring your envelope, you'll move to the Signing Editor where you place signature fields, dates, and other elements on your documents.
              </p>

              <div className="space-y-6">
                <div className="bg-[#F7F3EE] border border-gray-200 rounded-lg p-6 shadow-sm">
                  <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <FileSignature className="w-6 h-6 text-blue-600" />
                    <span>Understanding the Signing Editor</span>
                  </h2>
                  
                  <p className="text-gray-700 mb-4">
                    The Signing Editor displays your PDF documents with tools to add various field types. You can drag and drop fields onto your documents.
                  </p>
                  
                  <div className="grid md:grid-cols-2 gap-4 mt-4">
                    <div className="bg-[#F5F2EE] p-4 rounded-lg border border-gray-200">
                      <h3 className="font-semibold text-gray-900 mb-2">Left Sidebar</h3>
                      <p className="text-gray-700 text-sm mb-3">Contains field types you can add:</p>
                      <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                        <li>Signature</li>
                        <li>Initial</li>
                        <li>Date Signed</li>
                        <li>Name, Email, Company</li>
                        <li>Text, Number, Checkbox</li>
                      </ul>
                    </div>
                    <div className="bg-[#F5F2EE] p-4 rounded-lg border border-gray-200">
                      <h3 className="font-semibold text-gray-900 mb-2">Center Area</h3>
                      <p className="text-gray-700 text-sm mb-3">Your PDF document where you place fields</p>
                    </div>
                  </div>
                </div>

                <div className="bg-[#F7F3EE] border border-gray-200 rounded-lg p-6 shadow-sm">
                  <h2 className="text-2xl font-semibold text-gray-900 mb-4">Adding Fields</h2>
                  
                  <ol className="list-decimal list-inside space-y-4 text-gray-700">
                    <li className="pl-2">
                      <strong>Select a recipient</strong> from the top bar (if you have multiple recipients)
                    </li>
                    <li className="pl-2">
                      <strong>Choose a field type</strong> from the left sidebar (e.g., Signature, Date, Name)
                    </li>
                    <li className="pl-2">
                      <strong>Drag and drop</strong> the field onto your document where you want it placed
                    </li>
                    <li className="pl-2">
                      <strong>Adjust the field</strong> by clicking and dragging it to reposition, or click to edit properties
                    </li>
                  </ol>
                </div>

                <div className="bg-[#F7F3EE] border border-gray-200 rounded-lg p-6 shadow-sm">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Field Types</h3>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div className="p-3 bg-blue-50 rounded border border-blue-200">
                        <h4 className="font-semibold text-blue-900 mb-1">Signature</h4>
                        <p className="text-blue-800 text-sm">Where the recipient signs the document</p>
                      </div>
                      <div className="p-3 bg-green-50 rounded border border-green-200">
                        <h4 className="font-semibold text-green-900 mb-1">Initial</h4>
                        <p className="text-green-800 text-sm">For initialing specific sections</p>
                      </div>
                      <div className="p-3 bg-[#F0FDF4] rounded border border-[#BBF7D0]">
                        <h4 className="font-semibold text-purple-900 mb-1">Date Signed</h4>
                        <p className="text-purple-800 text-sm">Automatically fills with signing date</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="p-3 bg-yellow-50 rounded border border-yellow-200">
                        <h4 className="font-semibold text-yellow-900 mb-1">Name, Email, Company</h4>
                        <p className="text-yellow-800 text-sm">Auto-filled from recipient information</p>
                      </div>
                      <div className="p-3 bg-orange-50 rounded border border-orange-200">
                        <h4 className="font-semibold text-orange-900 mb-1">Text, Number, Checkbox</h4>
                        <p className="text-orange-800 text-sm">Custom fields for additional information</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded">
                  <h3 className="font-semibold text-blue-900 mb-3">Tips for Placing Fields</h3>
                  <ul className="list-disc list-inside space-y-2 text-blue-800 text-sm">
                    <li>All fields are draggable - click and drag to reposition after placing</li>
                    <li>Click on a field to edit its properties (label, size, etc.)</li>
                    <li>Use the zoom controls to get a better view of your document</li>
                    <li>Navigate between pages using the page controls</li>
                    <li>Remove fields by clicking the X button on the field</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        );

      case 'review-send':
        return (
          <div id="review-send" className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-900">Review and Send Your Envelope</h1>
            <div className="prose max-w-none">
              <p className="text-lg text-gray-700 leading-relaxed mb-6">
                Before sending, review all your settings and ensure everything is correct. Once sent, recipients will receive email notifications to sign.
              </p>

              <div className="space-y-6">
                <div className="bg-[#F7F3EE] border border-gray-200 rounded-lg p-6 shadow-sm">
                  <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Eye className="w-6 h-6 text-blue-600" />
                    <span>Review Checklist</span>
                  </h2>
                  
                  <div className="space-y-3">
                    <div className="flex items-start gap-3 p-3 bg-[#F5F2EE] rounded">
                      <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <h3 className="font-semibold text-gray-900">Documents</h3>
                        <p className="text-gray-700 text-sm">All required documents are uploaded and in the correct order</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 bg-[#F5F2EE] rounded">
                      <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <h3 className="font-semibold text-gray-900">Recipients</h3>
                        <p className="text-gray-700 text-sm">All recipients are added with correct email addresses</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 bg-[#F5F2EE] rounded">
                      <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <h3 className="font-semibold text-gray-900">Signature Fields</h3>
                        <p className="text-gray-700 text-sm">All required signature fields are placed on the documents</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 bg-[#F5F2EE] rounded">
                      <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <h3 className="font-semibold text-gray-900">Messages</h3>
                        <p className="text-gray-700 text-sm">Subject line and messages are clear and professional</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-[#F7F3EE] border border-gray-200 rounded-lg p-6 shadow-sm">
                  <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Send className="w-6 h-6 text-green-600" />
                    <span>Sending Your Envelope</span>
                  </h2>
                  
                  <ol className="list-decimal list-inside space-y-4 text-gray-700">
                    <li className="pl-2">
                      <strong>Click "Send"</strong> button at the bottom of the page
                    </li>
                    <li className="pl-2">
                      <strong>Review the signing order</strong> (if sequential) to ensure it's correct
                    </li>
                    <li className="pl-2">
                      <strong>Confirm authentication settings</strong> and credits required
                    </li>
                    <li className="pl-2">
                      <strong>Click "Confirm Send"</strong> to send the envelope
                    </li>
                  </ol>
                  
                  <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-green-800 text-sm">
                      <strong>What happens next?</strong> Recipients will receive email notifications with a link to sign the document. You'll receive updates as each recipient signs.
                    </p>
                  </div>
                </div>

                <div className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded">
                  <h3 className="font-semibold text-blue-900 mb-3">After Sending</h3>
                  <ul className="list-disc list-inside space-y-2 text-blue-800 text-sm">
                    <li>Track the status of your envelope from the Agreements page</li>
                    <li>Receive notifications when recipients sign</li>
                    <li>Download completed documents once all signatures are collected</li>
                    <li>View the audit trail for compliance purposes</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        );

      case 'receive-envelope':
        return (
          <div id="receive-envelope" className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-900">Receive an Envelope</h1>
            <div className="prose max-w-none">
              <p className="text-lg text-gray-700 leading-relaxed mb-6">
                When someone sends you a document for signature, you'll receive an email notification with a secure link to access and sign the document.
              </p>

              <div className="space-y-6">
                <div className="bg-[#F7F3EE] border border-gray-200 rounded-lg p-6 shadow-sm">
                  <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <MessageSquare className="w-6 h-6 text-blue-600" />
                    <span>Email Notification</span>
                  </h2>
                  
                  <p className="text-gray-700 mb-4">
                    You'll receive an email with:
                  </p>
                  
                  <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
                    <li>Subject line indicating a document needs your signature</li>
                    <li>Sender's name and message (if provided)</li>
                    <li>A secure link to access the document</li>
                    <li>Information about the document type and urgency</li>
                  </ul>
                  
                  <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                    <p className="text-blue-800 text-sm">
                      <strong>Security Note:</strong> The link in the email is unique to you and may include authentication requirements set by the sender.
                    </p>
                  </div>
                </div>

                <div className="bg-[#F7F3EE] border border-gray-200 rounded-lg p-6 shadow-sm">
                  <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Key className="w-6 h-6 text-[#155E4B]" />
                    <span>Authentication</span>
                  </h2>
                  
                  <p className="text-gray-700 mb-4">
                    Depending on the security settings, you may need to:
                  </p>
                  
                  <div className="space-y-3">
                    <div className="p-4 bg-[#F5F2EE] rounded-lg border border-gray-200">
                      <h3 className="font-semibold text-gray-900 mb-2">Email Verification</h3>
                      <p className="text-gray-700 text-sm">
                        Simply click the link in your email. Your email address serves as verification.
                      </p>
                    </div>
                    
                    <div className="p-4 bg-[#F5F2EE] rounded-lg border border-gray-200">
                      <h3 className="font-semibold text-gray-900 mb-2">Access Code</h3>
                      <p className="text-gray-700 text-sm">
                        Enter a code provided by the sender (usually shared separately via phone or another email).
                      </p>
                    </div>
                    
                    <div className="p-4 bg-[#F5F2EE] rounded-lg border border-gray-200">
                      <h3 className="font-semibold text-gray-900 mb-2">SMS Verification</h3>
                      <p className="text-gray-700 text-sm">
                        Enter your phone number to receive a verification code via text message.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-[#F7F3EE] border border-gray-200 rounded-lg p-6 shadow-sm">
                  <h2 className="text-2xl font-semibold text-gray-900 mb-4">Accessing the Document</h2>
                  
                  <ol className="list-decimal list-inside space-y-3 text-gray-700">
                    <li className="pl-2">
                      <strong>Click the link</strong> in the email notification
                    </li>
                    <li className="pl-2">
                      <strong>Complete authentication</strong> if required (access code, SMS, etc.)
                    </li>
                    <li className="pl-2">
                      <strong>Review the document</strong> that appears in your browser
                    </li>
                    <li className="pl-2">
                      <strong>Follow the on-screen instructions</strong> to complete your signature
                    </li>
                  </ol>
                  
                  <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-yellow-800 text-sm">
                      <strong>Tip:</strong> You don't need to create an account to sign documents. The secure link provides all the access you need.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'sign-document':
        return (
          <div id="sign-document" className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-900">Sign a Document</h1>
            <div className="prose max-w-none">
              <p className="text-lg text-gray-700 leading-relaxed mb-6">
                Once you've accessed the document, you'll see a signing interface that guides you through completing all required fields and signatures.
              </p>

              <div className="space-y-6">
                <div className="bg-[#F7F3EE] border border-gray-200 rounded-lg p-6 shadow-sm">
                  <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <FileSignature className="w-6 h-6 text-blue-600" />
                    <span>Understanding the Signing Interface</span>
                  </h2>
                  
                  <p className="text-gray-700 mb-4">
                    The signing page displays your document with highlighted fields that require your action:
                  </p>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <h3 className="font-semibold text-blue-900 mb-2">Signature Fields</h3>
                      <p className="text-blue-800 text-sm">
                        Blue boxes marked "Click to sign" - these require your signature
                      </p>
                    </div>
                    <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                      <h3 className="font-semibold text-green-900 mb-2">Text Fields</h3>
                      <p className="text-green-800 text-sm">
                        Fields for name, email, date, or other information you need to fill
                      </p>
                    </div>
                    <div className="p-4 bg-[#F0FDF4] rounded-lg border border-[#BBF7D0]">
                      <h3 className="font-semibold text-purple-900 mb-2">Initial Fields</h3>
                      <p className="text-purple-800 text-sm">
                        Short text fields for initialing specific sections
                      </p>
                    </div>
                    <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                      <h3 className="font-semibold text-yellow-900 mb-2">Checkboxes</h3>
                      <p className="text-yellow-800 text-sm">
                        Checkboxes for agreeing to terms or confirming information
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-[#F7F3EE] border border-gray-200 rounded-lg p-6 shadow-sm">
                  <h2 className="text-2xl font-semibold text-gray-900 mb-4">Step-by-Step Signing Process</h2>
                  
                  <ol className="list-decimal list-inside space-y-4 text-gray-700">
                    <li className="pl-2">
                      <strong>Click "Start" button</strong> - This begins the signing process and navigates you to the first field
                    </li>
                    <li className="pl-2">
                      <strong>Fill required fields first</strong> - Complete any text, date, or checkbox fields before signing
                      <div className="ml-6 mt-2 p-3 bg-blue-50 rounded border border-blue-200">
                        <p className="text-blue-800 text-sm">
                          <strong>Note:</strong> You must fill all non-signature fields before you can sign. The system will guide you through them in order.
                        </p>
                      </div>
                    </li>
                    <li className="pl-2">
                      <strong>Navigate between fields</strong> - Use the yellow "Next" button that appears next to each field to move to the next required field
                    </li>
                    <li className="pl-2">
                      <strong>Click a signature field</strong> - When you reach a signature field, click on it to open the signature pad
                    </li>
                    <li className="pl-2">
                      <strong>Create your signature</strong>:
                      <ul className="list-disc list-inside ml-6 mt-2 space-y-1 text-sm">
                        <li>Draw your signature using your mouse or touchscreen</li>
                        <li>Or type your name to generate a typed signature</li>
                        <li>Or upload an image of your signature</li>
                      </ul>
                    </li>
                    <li className="pl-2">
                      <strong>Save your signature</strong> - Click "Save" to apply your signature to the field
                    </li>
                    <li className="pl-2">
                      <strong>Continue to next field</strong> - Use the "Next" button to proceed to remaining fields
                    </li>
                    <li className="pl-2">
                      <strong>Complete all fields</strong> - Continue until all required fields are completed
                    </li>
                  </ol>
                </div>

                <div className="bg-[#F7F3EE] border border-gray-200 rounded-lg p-6 shadow-sm">
                  <h2 className="text-2xl font-semibold text-gray-900 mb-4">Navigation Tips</h2>
                  
                  <div className="space-y-3">
                    <div className="flex items-start gap-3 p-4 bg-[#F5F2EE] rounded-lg">
                      <div className="bg-yellow-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold flex-shrink-0">N</div>
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-1">Next Button</h3>
                        <p className="text-gray-700 text-sm">
                          The yellow "Next" button appears next to each field. Click it to automatically scroll to and highlight the next required field.
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3 p-4 bg-[#F5F2EE] rounded-lg">
                      <FileText className="w-6 h-6 text-blue-600 flex-shrink-0" />
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-1">Multiple Documents</h3>
                        <p className="text-gray-700 text-sm">
                          If the envelope contains multiple documents, they'll be displayed one after another. Complete all fields in the first document before moving to the next.
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3 p-4 bg-[#F5F2EE] rounded-lg">
                      <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0" />
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-1">Completion Indicator</h3>
                        <p className="text-gray-700 text-sm">
                          Completed fields turn green. Once all fields are completed, you'll see a success message and receive a confirmation email.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-[#F7F3EE] border border-gray-200 rounded-lg p-6 shadow-sm">
                  <h2 className="text-2xl font-semibold text-gray-900 mb-4">Field Types Explained</h2>
                  
                  <div className="space-y-4">
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <h3 className="font-semibold text-blue-900 mb-2">Signature Fields</h3>
                      <p className="text-blue-800 text-sm mb-2">
                        Click to open the signature pad. You can draw, type, or upload your signature.
                      </p>
                      <p className="text-blue-700 text-xs">
                        <strong>Important:</strong> You must complete all other fields before you can sign.
                      </p>
                    </div>
                    
                    <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                      <h3 className="font-semibold text-green-900 mb-2">Text, Name, Email, Company Fields</h3>
                      <p className="text-green-800 text-sm">
                        Click in the field and type your information. Some fields may be pre-filled based on your email address.
                      </p>
                    </div>
                    
                    <div className="p-4 bg-[#F0FDF4] rounded-lg border border-[#BBF7D0]">
                      <h3 className="font-semibold text-purple-900 mb-2">Date Fields</h3>
                      <p className="text-purple-800 text-sm">
                        Click to open a date picker. Select the date or it may auto-fill with today's date.
                      </p>
                    </div>
                    
                    <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                      <h3 className="font-semibold text-yellow-900 mb-2">Checkbox Fields</h3>
                      <p className="text-yellow-800 text-sm">
                        Click the checkbox to check or uncheck it. Used for agreeing to terms or confirming information.
                      </p>
                    </div>
                    
                    <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                      <h3 className="font-semibold text-orange-900 mb-2">Initial Fields</h3>
                      <p className="text-orange-800 text-sm">
                        Type your initials (usually 2-3 letters). These are used to initial specific sections of the document.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 border-l-4 border-green-500 p-6 rounded">
                  <h3 className="font-semibold text-green-900 mb-3">After Signing</h3>
                  <ul className="list-disc list-inside space-y-2 text-green-800 text-sm">
                    <li>You'll see a success message when all fields are completed</li>
                    <li>You'll receive a confirmation email with a copy of the signed document</li>
                    <li>The sender will be notified that you've completed your part</li>
                    <li>If there are other signers, they'll be notified to sign next (in sequential order)</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        );

      case 'troubleshooting':
        return (
          <div id="troubleshooting" className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-900">Troubleshooting</h1>
            <div className="prose max-w-none">
              <p className="text-lg text-gray-700 leading-relaxed mb-6">
                Common issues and solutions for sending and signing documents with {BRAND.name}.
              </p>

              <div className="space-y-6">
                <div className="bg-[#F7F3EE] border border-gray-200 rounded-lg p-6 shadow-sm">
                  <h2 className="text-2xl font-semibold text-gray-900 mb-4">Sending Issues</h2>
                  
                  <div className="space-y-4">
                    <div className="p-4 bg-[#F5F2EE] rounded-lg border border-gray-200">
                      <h3 className="font-semibold text-gray-900 mb-2">Can't upload documents</h3>
                      <p className="text-gray-700 text-sm mb-2"><strong>Possible causes:</strong></p>
                      <ul className="list-disc list-inside space-y-1 text-gray-700 text-sm ml-4">
                        <li>File is not in PDF format - convert your document to PDF first</li>
                        <li>File is password-protected - remove password protection before uploading</li>
                        <li>File size is too large - try compressing the PDF or splitting into smaller files</li>
                        <li>Browser compatibility - try a different browser or update your current browser</li>
                      </ul>
                    </div>
                    
                    <div className="p-4 bg-[#F5F2EE] rounded-lg border border-gray-200">
                      <h3 className="font-semibold text-gray-900 mb-2">Recipients not receiving emails</h3>
                      <p className="text-gray-700 text-sm mb-2"><strong>Solutions:</strong></p>
                      <ul className="list-disc list-inside space-y-1 text-gray-700 text-sm ml-4">
                        <li>Check that email addresses are correct and properly formatted</li>
                        <li>Ask recipients to check their spam/junk folder</li>
                        <li>Verify that the envelope was actually sent (check the Agreements page)</li>
                        <li>Resend the envelope if needed from the Agreements page</li>
                      </ul>
                    </div>
                    
                    <div className="p-4 bg-[#F5F2EE] rounded-lg border border-gray-200">
                      <h3 className="font-semibold text-gray-900 mb-2">Can't place signature fields</h3>
                      <p className="text-gray-700 text-sm mb-2"><strong>Solutions:</strong></p>
                      <ul className="list-disc list-inside space-y-1 text-gray-700 text-sm ml-4">
                        <li>Ensure you've added at least one recipient before placing fields</li>
                        <li>Select the correct recipient from the top bar before placing fields</li>
                        <li>Make sure you're on the correct page of the document</li>
                        <li>Try refreshing the page and placing fields again</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="bg-[#F7F3EE] border border-gray-200 rounded-lg p-6 shadow-sm">
                  <h2 className="text-2xl font-semibold text-gray-900 mb-4">Signing Issues</h2>
                  
                  <div className="space-y-4">
                    <div className="p-4 bg-[#F5F2EE] rounded-lg border border-gray-200">
                      <h3 className="font-semibold text-gray-900 mb-2">Can't access the signing link</h3>
                      <p className="text-gray-700 text-sm mb-2"><strong>Solutions:</strong></p>
                      <ul className="list-disc list-inside space-y-1 text-gray-700 text-sm ml-4">
                        <li>Check that you're using the correct link from the email</li>
                        <li>Ensure the link hasn't expired (check with the sender if needed)</li>
                        <li>Try copying and pasting the link into a new browser window</li>
                        <li>Clear your browser cache and cookies, then try again</li>
                        <li>Try a different browser or device</li>
                      </ul>
                    </div>
                    
                    <div className="p-4 bg-[#F5F2EE] rounded-lg border border-gray-200">
                      <h3 className="font-semibold text-gray-900 mb-2">Authentication code not working</h3>
                      <p className="text-gray-700 text-sm mb-2"><strong>Solutions:</strong></p>
                      <ul className="list-disc list-inside space-y-1 text-gray-700 text-sm ml-4">
                        <li>Verify you're entering the correct access code (check for typos)</li>
                        <li>Contact the sender to confirm the access code</li>
                        <li>For SMS codes, ensure your phone number is correct and you can receive texts</li>
                        <li>Wait a few minutes and request a new code if available</li>
                      </ul>
                    </div>
                    
                    <div className="p-4 bg-[#F5F2EE] rounded-lg border border-gray-200">
                      <h3 className="font-semibold text-gray-900 mb-2">Can't see signature fields</h3>
                      <p className="text-gray-700 text-sm mb-2"><strong>Solutions:</strong></p>
                      <ul className="list-disc list-inside space-y-1 text-gray-700 text-sm ml-4">
                        <li>Scroll through the document - fields may be on different pages</li>
                        <li>Use the "Start" or "Next" button to navigate to fields automatically</li>
                        <li>Zoom out your browser (Ctrl/Cmd + minus) to see more of the document</li>
                        <li>Check if fields are highlighted in blue - these are the ones you need to complete</li>
                        <li>Refresh the page if fields don't appear</li>
                      </ul>
                    </div>
                    
                    <div className="p-4 bg-[#F5F2EE] rounded-lg border border-gray-200">
                      <h3 className="font-semibold text-gray-900 mb-2">Can't sign - "Fill all other fields first" message</h3>
                      <p className="text-gray-700 text-sm mb-2"><strong>Explanation:</strong></p>
                      <p className="text-gray-700 text-sm mb-2">
                        This message appears when you try to sign before completing required text, date, or checkbox fields. The system requires all non-signature fields to be filled before you can sign.
                      </p>
                      <p className="text-gray-700 text-sm mb-2"><strong>Solution:</strong></p>
                      <ul className="list-disc list-inside space-y-1 text-gray-700 text-sm ml-4">
                        <li>Use the "Next" button to navigate through all fields in order</li>
                        <li>Fill all text fields, dates, and checkboxes first</li>
                        <li>Once all non-signature fields are completed, signature fields will become clickable</li>
                        <li>Look for fields highlighted in blue - these need your attention</li>
                      </ul>
                    </div>
                    
                    <div className="p-4 bg-[#F5F2EE] rounded-lg border border-gray-200">
                      <h3 className="font-semibold text-gray-900 mb-2">Signature pad not opening</h3>
                      <p className="text-gray-700 text-sm mb-2"><strong>Solutions:</strong></p>
                      <ul className="list-disc list-inside space-y-1 text-gray-700 text-sm ml-4">
                        <li>Ensure you've completed all required fields before the signature field</li>
                        <li>Check that you're clicking directly on the signature field (blue box)</li>
                        <li>Disable browser pop-up blockers for this site</li>
                        <li>Try clicking the field again after a moment</li>
                        <li>Refresh the page and try again</li>
                      </ul>
                    </div>
                    
                    <div className="p-4 bg-[#F5F2EE] rounded-lg border border-gray-200">
                      <h3 className="font-semibold text-gray-900 mb-2">Can't draw signature</h3>
                      <p className="text-gray-700 text-sm mb-2"><strong>Solutions:</strong></p>
                      <ul className="list-disc list-inside space-y-1 text-gray-700 text-sm ml-4">
                        <li>Try using a mouse instead of touchpad if on a laptop</li>
                        <li>On mobile devices, use your finger or a stylus</li>
                        <li>Use the "Type" option to create a typed signature instead</li>
                        <li>Upload an image of your signature if drawing doesn't work</li>
                        <li>Clear the signature pad and try drawing again</li>
                      </ul>
                    </div>
                    
                    <div className="p-4 bg-[#F5F2EE] rounded-lg border border-gray-200">
                      <h3 className="font-semibold text-gray-900 mb-2">"Next" button not working</h3>
                      <p className="text-gray-700 text-sm mb-2"><strong>Solutions:</strong></p>
                      <ul className="list-disc list-inside space-y-1 text-gray-700 text-sm ml-4">
                        <li>Ensure the current field is completed before clicking Next</li>
                        <li>For text fields, click outside the field or press Tab to save your input</li>
                        <li>Wait a moment for the page to update after filling a field</li>
                        <li>Try scrolling manually to find the next field</li>
                        <li>Refresh the page if the button remains unresponsive</li>
                      </ul>
                    </div>
                    
                    <div className="p-4 bg-[#F5F2EE] rounded-lg border border-gray-200">
                      <h3 className="font-semibold text-gray-900 mb-2">Document not loading</h3>
                      <p className="text-gray-700 text-sm mb-2"><strong>Solutions:</strong></p>
                      <ul className="list-disc list-inside space-y-1 text-gray-700 text-sm ml-4">
                        <li>Check your internet connection</li>
                        <li>Wait a few moments - large documents may take time to load</li>
                        <li>Refresh the page</li>
                        <li>Try a different browser (Chrome, Firefox, Safari, Edge)</li>
                        <li>Clear browser cache and cookies</li>
                        <li>Disable browser extensions that might interfere</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="bg-[#F7F3EE] border border-gray-200 rounded-lg p-6 shadow-sm">
                  <h2 className="text-2xl font-semibold text-gray-900 mb-4">General Issues</h2>
                  
                  <div className="space-y-4">
                    <div className="p-4 bg-[#F5F2EE] rounded-lg border border-gray-200">
                      <h3 className="font-semibold text-gray-900 mb-2">Browser compatibility</h3>
                      <p className="text-gray-700 text-sm mb-2">
                        {BRAND.name} works best with modern browsers. Recommended browsers:
                      </p>
                      <ul className="list-disc list-inside space-y-1 text-gray-700 text-sm ml-4">
                        <li>Google Chrome (latest version)</li>
                        <li>Mozilla Firefox (latest version)</li>
                        <li>Microsoft Edge (latest version)</li>
                        <li>Safari (latest version for Mac/iOS)</li>
                      </ul>
                    </div>
                    
                    <div className="p-4 bg-[#F5F2EE] rounded-lg border border-gray-200">
                      <h3 className="font-semibold text-gray-900 mb-2">Mobile device issues</h3>
                      <p className="text-gray-700 text-sm mb-2"><strong>Tips for mobile signing:</strong></p>
                      <ul className="list-disc list-inside space-y-1 text-gray-700 text-sm ml-4">
                        <li>Use landscape orientation for better visibility</li>
                        <li>Zoom in on signature fields for easier interaction</li>
                        <li>Use your finger or a stylus for drawing signatures</li>
                        <li>Ensure you have a stable internet connection</li>
                        <li>Close other apps to free up device memory</li>
                      </ul>
                    </div>
                    
                    <div className="p-4 bg-[#F5F2EE] rounded-lg border border-gray-200">
                      <h3 className="font-semibold text-gray-900 mb-2">Still need help?</h3>
                      <p className="text-gray-700 text-sm mb-2">
                        If you're still experiencing issues:
                      </p>
                      <ul className="list-disc list-inside space-y-1 text-gray-700 text-sm ml-4">
                        <li>Contact the person who sent you the document</li>
                        <li>Check the {BRAND.name} Support Center for additional resources</li>
                        <li>Contact {BRAND.name} support with details about your issue</li>
                        <li>Include screenshots if possible to help diagnose the problem</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded">
                  <h3 className="font-semibold text-blue-900 mb-3">Quick Tips</h3>
                  <ul className="list-disc list-inside space-y-2 text-blue-800 text-sm">
                    <li>Always use the latest version of your browser</li>
                    <li>Keep your internet connection stable while signing</li>
                    <li>Don't close the browser tab until you see the completion message</li>
                    <li>Save your work frequently if filling long forms</li>
                    <li>Check your email spam folder if you don't receive notifications</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const filteredSections = guideSections.filter(section => {
    if (searchQuery) {
      const matchesTitle = section.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesSubsections = section.subsections?.some(sub => 
        sub.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
      return matchesTitle || matchesSubsections;
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-[#F5F2EE]">
      {/* Header */}
      <header className="bg-[#F7F3EE] border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h1 className="text-xl font-semibold text-gray-900">eSignature Basics for Senders</h1>
            </div>
            <div className="flex items-center gap-4">
              <div className="relative hidden md:block">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search help articles..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-64"
                />
              </div>
              <button
                onClick={() => navigate('/e-sign/create')}
                className="px-4 py-2 bg-purple-600 text-white rounded-sm hover:bg-purple-700 transition-colors font-medium" style={{backgroundColor: '#260559'}}
              >
                Create Envelope
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Sidebar */}
          <aside className="w-64 flex-shrink-0 hidden lg:block">
            <div className="bg-[#F7F3EE] rounded-lg border border-gray-200 pl-2 sticky top-24 max-h-[calc(100vh-8rem)] flex flex-col">
              <div className="mb-4 flex-shrink-0">
                <h2 className="text-sm font-semibold text-gray-900 mb-2">Contents</h2>
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <button
                    onClick={() => {
                      const allExpanded = new Set(guideSections.map(s => s.id));
                      setExpandedSections(allExpanded);
                    }}
                    className="hover:text-gray-900"
                  >
                    Expand All
                  </button>
                  <span>•</span>
                  <button
                    onClick={() => setExpandedSections(new Set())}
                    className="hover:text-gray-900"
                  >
                    Collapse All
                  </button>
                </div>
              </div>

              <nav className="space-y-1 overflow-y-auto flex-1 pr-2">
                {filteredSections.map((section) => (
                  <div key={section.id}>
                    <button
                      onClick={() => {
                        if (section.subsections) {
                          toggleSection(section.id);
                        } else {
                          scrollToSection(section.id);
                        }
                      }}
                      className={`w-full flex items-center justify-between p-2 rounded text-sm transition-colors ${
                        activeSection === section.id
                          ? 'bg-blue-50 text-blue-700 font-medium'
                          : 'text-gray-700 hover:bg-[#F5F2EE]'
                      }`}
                    >
                      <span>{section.title}</span>
                      {section.subsections && (
                        <ChevronDown
                          className={`w-4 h-4 transition-transform ${
                            expandedSections.has(section.id) ? 'rotate-180' : ''
                          }`}
                        />
                      )}
                    </button>
                    {section.subsections && expandedSections.has(section.id) && (
                      <div className="ml-4 mt-1 space-y-1">
                        {section.subsections.map((subsection) => (
                          <button
                            key={subsection.id}
                            onClick={() => scrollToSection(subsection.id)}
                            className={`w-full text-left p-2 rounded text-sm transition-colors ${
                              activeSection === subsection.id
                                ? 'bg-blue-50 text-blue-700 font-medium'
                                : 'text-gray-600 hover:bg-[#F5F2EE]'
                            }`}
                          >
                            {subsection.title}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </nav>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            <div ref={contentRef} className="bg-[#F7F3EE] rounded-lg border border-gray-200 p-8 shadow-sm">
              {renderContent()}
            </div>

            {/* Next Steps */}
            <div className="mt-8 bg-[#F7F3EE] rounded-lg border border-gray-200 p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Next Steps</h2>
              <div className="space-y-2">
                {activeSection === 'getting-started' && (
                  <button
                    onClick={() => scrollToSection('start-envelope')}
                    className="text-blue-600 hover:text-blue-700 hover:underline"
                  >
                    Start an Envelope →
                  </button>
                )}
                {activeSection === 'start-envelope' && (
                  <button
                    onClick={() => scrollToSection('upload-documents')}
                    className="text-blue-600 hover:text-blue-700 hover:underline"
                  >
                    Upload Documents →
                  </button>
                )}
                {activeSection === 'upload-documents' && (
                  <button
                    onClick={() => scrollToSection('add-recipients')}
                    className="text-blue-600 hover:text-blue-700 hover:underline"
                  >
                    Add Recipients →
                  </button>
                )}
                {activeSection === 'add-recipients' && (
                  <button
                    onClick={() => scrollToSection('customize-options')}
                    className="text-blue-600 hover:text-blue-700 hover:underline"
                  >
                    Customize Options →
                  </button>
                )}
                {activeSection === 'customize-options' && (
                  <button
                    onClick={() => scrollToSection('add-messages')}
                    className="text-blue-600 hover:text-blue-700 hover:underline"
                  >
                    Add Messages →
                  </button>
                )}
                {activeSection === 'add-messages' && (
                  <button
                    onClick={() => scrollToSection('signing-editor')}
                    className="text-blue-600 hover:text-blue-700 hover:underline"
                  >
                    Place Signature Fields →
                  </button>
                )}
                {activeSection === 'signing-editor' && (
                  <button
                    onClick={() => scrollToSection('review-send')}
                    className="text-blue-600 hover:text-blue-700 hover:underline"
                  >
                    Review and Send →
                  </button>
                )}
                {activeSection === 'review-send' && (
                  <button
                    onClick={() => scrollToSection('receive-envelope')}
                    className="text-blue-600 hover:text-blue-700 hover:underline"
                  >
                    Receive an Envelope →
                  </button>
                )}
                {activeSection === 'receive-envelope' && (
                  <button
                    onClick={() => scrollToSection('sign-document')}
                    className="text-blue-600 hover:text-blue-700 hover:underline"
                  >
                    Sign a Document →
                  </button>
                )}
                {activeSection === 'sign-document' && (
                  <button
                    onClick={() => scrollToSection('troubleshooting')}
                    className="text-blue-600 hover:text-blue-700 hover:underline"
                  >
                    Troubleshooting →
                  </button>
                )}
                {activeSection === 'troubleshooting' && (
                  <div className="space-y-3">
                    <p className="text-gray-600 text-sm mb-3">You've completed the guide! Ready to create your first envelope?</p>
                    <button
                      onClick={() => navigate('/e-sign/create')}
                      className="px-6 py-2 bg-purple-600 text-white rounded-sm hover:bg-purple-700 transition-colors font-medium inline-flex items-center gap-2" style={{backgroundColor: '#260559'}}
                    >
                      Create Envelope
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </main>

          {/* Right Sidebar - On This Page */}
          <aside className="w-48 flex-shrink-0 hidden xl:block">
            <div className="bg-[#F7F3EE] rounded-lg border border-gray-200 p-4 sticky top-24">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">On this page:</h3>
              <nav className="space-y-1">
                {guideSections
                  .flatMap(section =>
                    section.subsections
                      ? [section, ...section.subsections]
                      : [section]
                  )
                  .filter(item => item.id === activeSection || 
                    (guideSections.find(s => s.id === activeSection)?.subsections?.some(sub => sub.id === item.id))
                  )
                  .map((item) => (
                    <a
                      key={item.id}
                      href={`#${item.id}`}
                      onClick={(e) => {
                        e.preventDefault();
                        scrollToSection(item.id);
                      }}
                      className="block text-sm text-blue-600 hover:text-blue-700 hover:underline"
                    >
                      {item.title}
                    </a>
                  ))}
              </nav>
            </div>
          </aside>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 lg:hidden">
          <div className="bg-[#F7F3EE] w-80 h-full overflow-y-auto">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">Contents</h2>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 hover:bg-gray-100 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="p-4 space-y-1">
              {guideSections.map((section) => (
                <div key={section.id}>
                  <button
                    onClick={() => {
                      if (section.subsections) {
                        toggleSection(section.id);
                      } else {
                        scrollToSection(section.id);
                      }
                    }}
                    className="w-full flex items-center justify-between p-2 rounded text-sm"
                  >
                    <span>{section.title}</span>
                    {section.subsections && (
                      <ChevronDown
                        className={`w-4 h-4 transition-transform ${
                          expandedSections.has(section.id) ? 'rotate-180' : ''
                        }`}
                      />
                    )}
                  </button>
                  {section.subsections && expandedSections.has(section.id) && (
                    <div className="ml-4 mt-1 space-y-1">
                      {section.subsections.map((subsection) => (
                        <button
                          key={subsection.id}
                          onClick={() => scrollToSection(subsection.id)}
                          className="w-full text-left p-2 rounded text-sm text-gray-600"
                        >
                          {subsection.title}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </nav>
          </div>
        </div>
      )}

      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileMenuOpen(true)}
        className="fixed bottom-4 right-4 lg:hidden bg-purple-600 text-white p-4 rounded-full shadow-lg hover:bg-purple-700 transition-colors z-30"
      >
        <Menu className="w-6 h-6" />
      </button>
    </div>
  );
};

export default EnvelopeGuideSupport;

