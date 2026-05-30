import React, { useEffect, useState } from 'react'
import { toast } from "react-hot-toast";
import { apiServiceApi } from '../../../services/apiHelper';
import { HelpCircle, MessageSquare, Book, Mail, Phone, Clock, CheckCircle,Search,ChevronRight,} from 'lucide-react';

export const SupportPage: React.FC = () => {
  //   const [selectedTicket, setSelectedTicket] = useState<any>(null)
  const [mockTickets, setMockTickets] = useState([]);
  const [showNewTicketModal, setShowNewTicketModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('');

  // const handleEnterpriseMail = () => {
  //   alert('button clicked');
  // window.location.href = "mailto:shristyv301@gmail.com";
  // };

  const supportChannels = [
    {
      icon: MessageSquare,
      title: 'Community Forum',
      description: 'Get help from the developer community',
      action: 'Browse Forum',
      href: '/api-service/community',
      color: 'bg-blue-500'
    },
    {
      icon: Book,
      title: 'Documentation',
      description: 'Comprehensive guides and API reference',
      action: 'View Docs',
      href: '/api-service/documentation',
      color: 'bg-green-500'
    },
    {
      icon: Mail,
      title: 'Email Support',
      description: 'Get direct help from our support team',
      action: 'Create Ticket',
      onClick: () => setShowNewTicketModal(true),
      color: 'bg-[#F0FDF4]0'
    },
    {
      icon: Phone,
      title: 'Enterprise Support',
      description: 'Priority support for enterprise customers',
      action: 'Contact Sales',
      href: 'mailto:shristyv301@gmail.com', 
      color: 'bg-orange-500'
    }
  ]

  const faqItems = [
    {
      question: 'How do I get started with the DraftnSign API?',
      answer: 'Start by creating an API key in your dashboard, then follow our Quick Start guide to make your first API call. We recommend beginning with our Python or JavaScript SDK for the easiest integration experience.'
    },
    {
      question: 'What are the rate limits for the API?',
      answer: 'Rate limits vary by plan and endpoint. Free tier includes 1,000 requests per hour, while paid plans offer higher limits. Check your dashboard for current usage and limits.'
    },
    {
      question: 'How do I set up webhooks?',
      answer: 'Navigate to the Webhooks section in your dashboard, create a new webhook endpoint, select the events you want to receive, and configure your endpoint URL. Make sure your endpoint can handle POST requests and returns a 200 status code.'
    },
    {
      question: 'Can I test the API without affecting production data?',
      answer: 'Yes! Use our API Explorer for interactive testing, or create test API keys that work with our sandbox environment. All SDKs also support a mock mode for development.'
    },
    {
      question: 'How do I handle authentication errors?',
      answer: 'Authentication errors typically occur due to invalid API keys, expired tokens, or insufficient permissions. Check that your API key is correct and has the necessary permissions for the endpoint you\'re accessing.'
    },
    {
      question: 'What file formats are supported for documents?',
      answer: 'We support PDF, Word documents (.docx), images (PNG, JPG), and plain text files. All documents are converted to PDF for the signing process.'
    }
  ]

  useEffect(() => {

    const fetchTickets = async () => {
      try {
        const response = await apiServiceApi.get('/api/api-service/tickets/all');
        if (response.status === 200 && response.data) {
          setMockTickets(response.data); // Store response in mockTickets
          console.log("Tickets response:", response.data); // Log response
        }
      } catch (error) {
        console.error("API error:", error);
      }
    };
    fetchTickets();
  }, []); // Empty dependency: runs on first load only


  const filteredFAQ = faqItems.filter(item =>
    item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.answer.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="p-6 max-w-7xl mx-auto">

      {/* Support Channels */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {supportChannels.map((channel, index) => {
          const Icon = channel.icon
          return (
            <div key={index} className="bg-[#F7F3EE] rounded-lg border border-gray-200 p-6 hover:border-gray-300 transition-colors">
              <div className={`w-12 h-12 ${channel.color} rounded-lg flex items-center justify-center mb-4`}>
                <Icon className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{channel.title}</h3>
              <p className="text-gray-600 mb-4">{channel.description}</p>
             {channel.action === "Contact Sales" ? (
              <a
              href="mailto:shristyv301@gmail.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-primary-600 hover:text-primary-700 font-medium"
            >
              {channel.action}
              <ChevronRight className="ml-1 h-4 w-4" />
            </a>
            ) : channel.onClick ? (
              <button
                onClick={channel.onClick}
                className="inline-flex items-center text-primary-600 hover:text-primary-700 font-medium"
              >
                {channel.action}
                <ChevronRight className="ml-1 h-4 w-4" />
              </button>
            ) : (
              <a
                href={channel.href}
                className="inline-flex items-center text-primary-600 hover:text-primary-700 font-medium"
              >
                {channel.action}
                <ChevronRight className="ml-1 h-4 w-4" />
              </a>
            )}

            </div>
          )
        })}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* FAQ Section */}
        <div className="lg:col-span-2">
          <div className="bg-[#F7F3EE] rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Frequently Asked Questions</h2>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search FAQ..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="space-y-4">
              {filteredFAQ.map((item, index) => (
                <FAQItem key={index} question={item.question} answer={item.answer} />
              ))}
            </div>

            {filteredFAQ.length === 0 && (
              <div className="text-center py-8">
                <HelpCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No FAQ items match your search.</p>
              </div>
            )}
          </div>
        </div>

        {/* Support Tickets */}
        <div>
          <div className="bg-[#F7F3EE] rounded-lg border border-gray-200 p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Your Support Tickets</h3>
              <button
                onClick={() => setShowNewTicketModal(true)}
                className="btn btn-primary text-sm"
              >
                New Ticket
              </button>
            </div>

            <div className="space-y-3">
             {mockTickets.slice(0, 3).map((ticket:any) => (
                <div
                  key={ticket._id}
                  className="p-3 border border-gray-200 rounded-lg hover:border-gray-300 cursor-pointer transition-colors"
                //   onClick={() => setSelectedTicket(ticket)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900">{ticket.title}</h4>
                    <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${
                      ticket.status === 'open' ? 'bg-yellow-100 text-yellow-800' :
                      ticket.status === 'resolved' ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {ticket.status === 'open' ? (
                        <Clock className="h-3 w-3" />
                      ) : (
                        <CheckCircle className="h-3 w-3" />
                      )}
                      <span>{ticket.status}</span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{ticket.description}</p>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{ticket.category}</span>
                    <span>{new Date(ticket.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Contact Info */}
          <div className="bg-[#F7F3EE] rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Mail className="h-5 w-5 text-gray-400" />
                <div>
                  <div className="font-medium text-gray-900">Email Support</div>
                  <div className="text-sm text-gray-600">support@draftn.com</div>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Clock className="h-5 w-5 text-gray-400" />
                <div>
                  <div className="font-medium text-gray-900">Response Time</div>
                  <div className="text-sm text-gray-600">Within 24 hours</div>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="h-5 w-5 text-gray-400" />
                <div>
                  <div className="font-medium text-gray-900">Enterprise Support</div>
                  <div className="text-sm text-gray-600">Priority phone support</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* New Ticket Modal */}
      {showNewTicketModal && (
        <NewTicketModal onClose={() => setShowNewTicketModal(false)} />
      )}
    </div>
  )
}

const FAQItem: React.FC<{ question: string; answer: string }> = ({ question, answer }) => {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="border border-gray-200 rounded-lg">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full text-left p-4 hover:bg-[#F5F2EE] transition-colors"
      >
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-gray-900">{question}</h3>
          <ChevronRight className={`h-5 w-5 text-gray-400 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
        </div>
      </button>
      {isOpen && (
        <div className="px-4 pb-4">
          <p className="text-gray-600">{answer}</p>
        </div>
      )}
    </div>
  )
}

const NewTicketModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [formData, setFormData] = useState({
    title: '',
    category: 'technical',
    priority: 'medium',
    description: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Submitting ticket:', formData);
    try {
      const response = await apiServiceApi.post('/api/api-service/tickets/create', formData);
      if (response.data && response.data.message) {
        toast.success("Ticket has been created!");
        onClose();
      } else {
        toast.error("Failed to create ticket!");
      }
    } catch (error) {
      toast.error("Failed to create ticket!");
      // Do not close modal on error
    }
  };


  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#F7F3EE]/10 backdrop-blur-sm">
      <div className="bg-[#F7F3EE] rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Create Support Ticket</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Subject
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className="input w-full border border-gray-300 h-10 rounded"
              placeholder="Brief description of your issue"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                 className="input w-full border border-gray-300 h-10 rounded"
              >
                <option value="technical">Technical Issue</option>
                <option value="billing">Billing</option>
                <option value="documentation">Documentation</option>
                <option value="feature">Feature Request</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Priority
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value }))}
                 className="input w-full border border-gray-300 h-10 rounded"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
               className="input w-full border border-gray-300 h-30 rounded"
              placeholder="Please provide detailed information about your issue, including steps to reproduce if applicable..."
              required
            />
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-outline"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
            >
              Create Ticket
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}