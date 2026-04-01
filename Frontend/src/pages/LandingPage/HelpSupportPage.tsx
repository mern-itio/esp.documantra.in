import React, { useState } from 'react';
import { 
  HelpCircle, 
  MessageSquare, 
  Book, 
  Mail, 
  Phone, 
  Clock, 
  Search, 
  ChevronDown, 
  ChevronRight,
  FileText,
  Video,
  Headphones,
  Send,
  CheckCircle,
  Zap,
  Shield,
  Users,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { supportPublicApi } from '../../services/supportService';

const HelpSupportPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    category: 'general',
    message: ''
  });
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const quickHelpCards = [
    {
      icon: Book,
      title: 'Documentation',
      description: 'Comprehensive guides and tutorials',
      color: 'bg-blue-500',
      href: '/api-documentation'
    },
    {
      icon: Video,
      title: 'Video Tutorials',
      description: 'Step-by-step video guides',
      color: 'bg-purple-500',
      href: '#'
    },
    {
      icon: MessageSquare,
      title: 'Community Forum',
      description: 'Get help from other users',
      color: 'bg-green-500',
      href: '#'
    },
    {
      icon: Headphones,
      title: 'Live Chat',
      description: 'Chat with our support team',
      color: 'bg-orange-500',
      href: '#'
    }
  ];

  const faqCategories = [
    {
      category: 'Getting Started',
      items: [
        {
          question: 'How do I create my first document?',
          answer: 'To create your first document, navigate to the Dashboard and click "Create Envelope". Upload your document, add recipients, and send it for signature. You can also use our templates to get started quickly.'
        },
        {
          question: 'What file formats are supported?',
          answer: 'We support PDF, Word documents (.docx), images (PNG, JPG), and plain text files. All documents are securely processed and converted to PDF format for signing.'
        },
        {
          question: 'How do I add recipients to a document?',
          answer: 'When creating an envelope, click "Add Recipients" and enter their email addresses. You can assign roles (signer, reviewer, or CC) and set the signing order for multiple signers.'
        }
      ]
    },
    {
      category: 'E-Signatures',
      items: [
        {
          question: 'Are electronic signatures legally binding?',
          answer: 'Yes! Our electronic signatures are legally binding in over 40 countries. We comply with eIDAS, ESIGN Act, and other international regulations. Each signature includes a complete audit trail for legal validity.'
        },
        {
          question: 'How do I track document status?',
          answer: 'You can track document status in real-time from your Dashboard. You\'ll receive email notifications when documents are viewed, signed, or completed. The status shows who has signed and who is pending.'
        },
        {
          question: 'Can I set signing order for multiple signers?',
          answer: 'Yes! When adding multiple recipients, you can set a signing order. Signers will receive the document sequentially, and each person must sign before the next person receives it.'
        }
      ]
    },
    {
      category: 'PowerForms',
      items: [
        {
          question: 'What are PowerForms?',
          answer: 'PowerForms are reusable document templates that can be embedded on your website. They allow anyone to fill out and sign documents without needing an account, making them perfect for public-facing forms.'
        },
        {
          question: 'How do I create a PowerForm?',
          answer: 'Navigate to PowerForms in the sidebar, click "Create PowerForm", select a template or upload a document, configure the fields, and generate an embed URL to add to your website.'
        },
        {
          question: 'Can I customize PowerForm fields?',
          answer: 'Yes! You can add text fields, checkboxes, dropdowns, date fields, and signature fields. All fields can be positioned, resized, and configured with validation rules.'
        }
      ]
    },
    {
      category: 'Billing & Plans',
      items: [
        {
          question: 'What payment methods do you accept?',
          answer: 'We accept all major credit cards (Visa, MasterCard, American Express), PayPal, and bank transfers for enterprise plans. All payments are processed securely through our payment partners.'
        },
        {
          question: 'Can I change my plan anytime?',
          answer: 'Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately, and we\'ll prorate any charges or credits to your account.'
        },
        {
          question: 'Do you offer refunds?',
          answer: 'We offer a 30-day money-back guarantee for annual plans. Monthly plans can be cancelled anytime with no cancellation fees. Contact our support team for assistance with refunds.'
        }
      ]
    },
    {
      category: 'Security & Privacy',
      items: [
        {
          question: 'How secure is my data?',
          answer: 'We use enterprise-grade encryption (AES-256) for data at rest and TLS 1.3 for data in transit. All documents are stored in secure, compliant data centers with regular security audits and certifications.'
        },
        {
          question: 'Who can access my documents?',
          answer: 'Only you and the recipients you explicitly invite can access your documents. We never share your data with third parties, and all access is logged in our audit trail for your review.'
        },
        {
          question: 'Do you comply with GDPR and other regulations?',
          answer: 'Yes! We are GDPR, CCPA, HIPAA, and SOC 2 compliant. We regularly undergo security audits and maintain certifications to ensure your data is handled according to the highest standards.'
        }
      ]
    }
  ];

  const supportChannels = [
    {
      icon: Mail,
      title: 'Email Support',
      description: 'Get help via email',
      contact: 'support@draftnsign.com',
      responseTime: 'Within 24 hours',
      color: 'text-blue-600'
    },
    {
      icon: Phone,
      title: 'Phone Support',
      description: 'Call us directly',
      contact: '+1 (555) 123-4567',
      responseTime: 'Mon-Fri, 9 AM - 6 PM EST',
      color: 'text-green-600'
    },
    {
      icon: MessageSquare,
      title: 'Live Chat',
      description: 'Chat with our team',
      contact: 'Available in dashboard',
      responseTime: 'Real-time response',
      color: 'text-purple-600'
    }
  ];

  const validate = (field: string, value: string) => {
    switch (field) {
      case 'name':
        if (!value.trim()) return 'Name is required';
        if (value.trim().length < 2) return 'Name must be at least 2 characters';
        return '';
      case 'email':
        if (!value.trim()) return 'Email is required';
        if (!/^[\w.!#$%&'*+/=?^_`{|}~-]+@[\w-]+(\.[\w-]+)+$/.test(value.trim())) {
          return 'Please enter a valid email address';
        }
        return '';
      case 'subject':
        if (!value.trim()) return 'Subject is required';
        return '';
      case 'message':
        if (!value.trim()) return 'Message is required';
        if (value.trim().length < 10) return 'Message must be at least 10 characters';
        return '';
      default:
        return '';
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    const error = validate(name, value);
    setErrors(prev => ({ ...prev, [name]: error }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const fields = ['name', 'email', 'subject', 'message'];
    const newErrors: {[key: string]: string} = {};
    
    fields.forEach(field => {
      const error = validate(field, (formData as any)[field]);
      if (error) newErrors[field] = error;
    });

    setErrors(newErrors);
    setSubmitError('');

    if (Object.keys(newErrors).length === 0) {
      try {
        setIsSubmitting(true);
        await supportPublicApi.createTicket({
          name: formData.name.trim(),
          email: formData.email.trim(),
          subject: formData.subject.trim(),
          category: formData.category,
          message: formData.message.trim(),
        });
        setSubmitted(true);
        setFormData({
          name: '',
          email: '',
          subject: '',
          category: 'general',
          message: ''
        });
        setTimeout(() => {
          setSubmitted(false);
        }, 3000);
      } catch (error: any) {
        const serverMessage =
          error?.response?.data?.message ||
          error?.message ||
          'Failed to submit your request. Please try again.';
        setSubmitError(serverMessage);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const filteredFAQs = faqCategories.flatMap(cat => 
    cat.items.filter(item => 
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchQuery.toLowerCase())
    ).map(item => ({ ...item, category: cat.category }))
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-blue-50 pt-24">
      {/* Hero Section */}
      <section className="py-16 bg-gradient-to-br from-[#260559] to-blue-700 text-white">
        <div className="container-max px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 rounded-full mb-6">
              <HelpCircle className="w-10 h-10" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Help & Support Center</h1>
            <p className="text-xl text-blue-100 mb-8">
              Find answers, get help, and connect with our support team
            </p>
            
            {/* Search Bar */}
            <div className="max-w-2xl mx-auto">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search for help articles, FAQs, and guides..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 rounded-lg text-white-900 focus:ring-2 focus:ring-white focus:outline-none shadow-lg"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="container-max px-4 sm:px-6 lg:px-8 py-12">
        {/* Quick Help Cards */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Quick Help</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {quickHelpCards.map((card, index) => {
              const Icon = card.icon;
              return (
                <Link
                  key={index}
                  to={card.href}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all duration-200 hover:border-blue-300 group"
                >
                  <div className={`w-12 h-12 ${card.color} rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{card.title}</h3>
                  <p className="text-sm text-gray-600 mb-4">{card.description}</p>
                  <div className="flex items-center text-blue-600 font-medium text-sm">
                    Learn more <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* FAQ Section */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 md:p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Frequently Asked Questions</h2>
                {/* <div className="text-sm text-gray-500">
                  {filteredFAQs.length} {filteredFAQs.length === 1 ? 'result' : 'results'}
                </div> */}
              </div>

              {searchQuery && filteredFAQs.length === 0 && (
                <div className="text-center py-12">
                  <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No results found for "{searchQuery}"</p>
                  <button
                    onClick={() => setSearchQuery('')}
                    className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Clear search
                  </button>
                </div>
              )}

              {!searchQuery ? (
                <div className="space-y-4">
                  {faqCategories.map((category, catIndex) => (
                    <div key={catIndex} className="mb-8">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <FileText className="w-5 h-5 text-blue-600" />
                        {category.category}
                      </h3>
                      <div className="space-y-3">
                        {category.items.map((item, itemIndex) => {
                          const globalIndex = catIndex * 100 + itemIndex;
                          return (
                            <div
                              key={itemIndex}
                              className="border border-gray-200 rounded-lg overflow-hidden hover:border-blue-300 transition-colors"
                            >
                              <button
                                onClick={() => setOpenFAQ(openFAQ === globalIndex ? null : globalIndex)}
                                className="w-full text-left p-4 hover:bg-gray-50 transition-colors flex items-center justify-between"
                              >
                                <span className="font-medium text-gray-900 pr-4">{item.question}</span>
                                <ChevronDown
                                  className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform ${
                                    openFAQ === globalIndex ? 'rotate-180' : ''
                                  }`}
                                />
                              </button>
                              {openFAQ === globalIndex && (
                                <div className="px-4 pb-4 border-t border-gray-100">
                                  <p className="text-gray-600 mt-3 leading-relaxed">{item.answer}</p>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredFAQs.map((item, index) => (
                    <div
                      key={index}
                      className="border border-gray-200 rounded-lg overflow-hidden hover:border-blue-300 transition-colors"
                    >
                      <button
                        onClick={() => setOpenFAQ(openFAQ === index ? null : index)}
                        className="w-full text-left p-4 hover:bg-gray-50 transition-colors flex items-center justify-between"
                      >
                        <div className="flex-1">
                          <div className="text-xs text-blue-600 font-medium mb-1">{item.category}</div>
                          <span className="font-medium text-gray-900 pr-4">{item.question}</span>
                        </div>
                        <ChevronDown
                          className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform ${
                            openFAQ === index ? 'rotate-180' : ''
                          }`}
                        />
                      </button>
                      {openFAQ === index && (
                        <div className="px-4 pb-4 border-t border-gray-100">
                          <p className="text-gray-600 mt-3 leading-relaxed">{item.answer}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar - Contact Form & Support Channels */}
          <div className="space-y-6">
            {/* Contact Form */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Send className="w-5 h-5 text-blue-600" />
                Contact Support
              </h3>
              
              {submitted ? (
                <div className="p-4 rounded-lg bg-green-50 border border-green-200">
                  <div className="flex items-center gap-2 text-green-700 mb-2">
                    <CheckCircle className="w-5 h-5" />
                    <span className="font-semibold">Message Sent!</span>
                  </div>
                  <p className="text-sm text-green-600">
                    We've received your message and will get back to you within 24 hours.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Your Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.name ? 'border-red-400' : 'border-gray-300'
                      }`}
                      placeholder="Enter your name"
                    />
                    {errors.name && <p className="text-red-600 text-xs mt-1">{errors.name}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.email ? 'border-red-400' : 'border-gray-300'
                      }`}
                      placeholder="your.email@example.com"
                    />
                    {errors.email && <p className="text-red-600 text-xs mt-1">{errors.email}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category
                    </label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="general">General Inquiry</option>
                      <option value="technical">Technical Support</option>
                      <option value="billing">Billing Question</option>
                      <option value="feature">Feature Request</option>
                      <option value="bug">Report a Bug</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Subject <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.subject ? 'border-red-400' : 'border-gray-300'
                      }`}
                      placeholder="Brief description of your issue"
                    />
                    {errors.subject && <p className="text-red-600 text-xs mt-1">{errors.subject}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Message <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      rows={5}
                      className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none ${
                        errors.message ? 'border-red-400' : 'border-gray-300'
                      }`}
                      placeholder="Please provide details about your question or issue..."
                    />
                    {errors.message && <p className="text-red-600 text-xs mt-1">{errors.message}</p>}
                  </div>

                  {submitError && (
                    <p className="text-red-600 text-sm">{submitError}</p>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-[#260559] text-white py-3 rounded-lg font-semibold hover:bg-[#1d0444] transition-colors shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? 'Sending...' : 'Send Message'}
                  </button>
                </form>
              )}
            </div>

            {/* Support Channels */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Headphones className="w-5 h-5 text-blue-600" />
                Other Ways to Reach Us
              </h3>
              <div className="space-y-4">
                {supportChannels.map((channel, index) => {
                  const Icon = channel.icon;
                  return (
                    <div key={index} className="flex items-start gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                      <div className={`${channel.color} p-2 rounded-lg`}>
                        <Icon className="w-5 h-5 text-black" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 mb-1">{channel.title}</h4>
                        <p className="text-sm text-gray-600 mb-1">{channel.description}</p>
                        <p className="text-sm font-medium text-gray-900">{channel.contact}</p>
                        <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                          <Clock className="w-3 h-3" />
                          <span>{channel.responseTime}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Resources */}
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl border border-blue-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Zap className="w-5 h-5 text-blue-600" />
                Popular Resources
              </h3>
              <div className="space-y-3">
                <Link to="/api-documentation" className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200 cursor-pointer hover:border-blue-500 transition-shadow">
                  <Book className="w-5 h-5 text-blue-600" />
                  <div>
                    <div className="font-medium text-gray-900">API Documentation</div>
                    <div className="text-xs text-gray-600">Complete API reference</div>
                  </div>
                </Link>
                <Link to="/contact-sales" className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200 cursor-pointer hover:border-blue-500 transition-shadow">
                  <Users className="w-5 h-5 text-green-600" />
                  <div>
                    <div className="font-medium text-gray-900">Enterprise Support</div>
                    <div className="text-xs text-gray-600">Priority support for teams</div>
                  </div>
                </Link>
                <Link to="/security-overview" className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200 cursor-pointer hover:border-blue-500 transition-shadow">
                  <Shield className="w-5 h-5 text-purple-600" />
                  <div>
                    <div className="font-medium text-gray-900">Security & Compliance</div>
                    <div className="text-xs text-gray-600">Learn about our security</div>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpSupportPage;

