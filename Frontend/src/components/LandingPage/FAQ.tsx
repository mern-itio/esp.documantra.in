import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { Link } from 'react-router-dom'

const FAQ = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  const faqs = [
    {
      question: "Is DraftnSign really free to use?",
      answer: "Yes! DraftnSign offers a free forever plan that includes 10 envelopes per month, full access to PDF tools, and up to 10 legal documents per month. No credit card required to get started."
    },
    {
      question: "Are DraftnSign signatures legally binding?",
      answer: "Absolutely. DraftnSign signatures are legally binding in 40+ countries including the US (ESIGN Act), EU (eIDAS), India (IT Act 2000), and many others. We provide full audit trails and compliance certificates."
    },
    {
      question: "Can I use DraftnSign for my business documents?",
      answer: "Yes, DraftnSign is designed for both personal and business use. We offer legal templates, multi-signer workflows, API access, and enterprise features for businesses of all sizes."
    },
    {
      question: "How secure is my data with DraftnSign?",
      answer: "Your data security is our top priority. We use 256-bit SSL encryption, are SOC 2 Type II certified, ISO 27001 compliant, and GDPR ready. All documents are stored securely with bank-level encryption."
    },
    {
      question: "Can I integrate DraftnSign with my existing software?",
      answer: "Yes! DraftnSign offers robust APIs and webhooks for seamless integration. We provide 10 free API calls per month, with paid plans offering more capacity and advanced features."
    },
    {
      question: "What file formats does DraftnSign support?",
      answer: "DraftnSign supports PDF, Word, Excel, PowerPoint, and various image formats. Our PDF tools can convert between formats, and our eSignature platform works with any document type."
    },
    {
      question: "Do you offer customer support?",
      answer: "Yes! Free users get email support, while paid plans include priority support. Enterprise customers get dedicated account management and SLA guarantees."
    },
    {
      question: "Can I cancel my subscription anytime?",
      answer: "Absolutely. You can cancel your subscription at any time with no questions asked. There are no setup fees or cancellation penalties."
    }
  ]

  return (
    <section className="py-16 bg-white">
      <div className="container-max">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Everything you need to know about DraftnSign
          </p>
        </div>

        <div className="max-w-3xl mx-auto">
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden"
              >
                <button
                  onClick={() => setOpenIndex(openIndex === index ? null : index)}
                  className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-100 transition-colors"
                >
                  <span className="font-semibold text-gray-900">{faq.question}</span>
                  {openIndex === index ? (
                    <ChevronUp className="h-5 w-5 text-gray-500" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-gray-500" />
                  )}
                </button>
                {openIndex === index && (
                  <div className="px-6 pb-4">
                    <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="text-center mt-12">
          <p className="text-gray-600 mb-4">Still have questions?</p>
          <Link to="/help-support">
            <button className="btn-secondary border" style={{borderColor: '#260559', color: '#260559'}}>
              Contact Support
            </button>
          </Link>
        </div>
      </div>
    </section>
  )
}

export default FAQ