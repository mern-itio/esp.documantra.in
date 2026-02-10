import { HelpCircle } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion';


const FAQ = () => {
  const faqs = [
    {
      question: 'How does the e-signature process work?',
      answer: 'Our e-signature process is simple and secure. Upload your document, add signature fields using drag-and-drop, specify recipients, and send. Recipients receive an email notification, verify their identity using your chosen method, and sign electronically. Both parties receive the completed document with a full audit trail.'
    },
    {
      question: 'What verification methods are available?',
      answer: 'We offer multiple verification options including Aadhaar-based biometric and facial verification, SMS OTP, email OTP, and multi-layer identity verification. You can choose the method that best fits your security requirements and compliance needs.'
    },
    {
      question: 'How secure is the document signing process?',
      answer: 'Security is our top priority. All documents are encrypted in transit and at rest using AES-256 encryption. We maintain complete audit trails with timestamps, IP addresses, and verification records. Our infrastructure is hosted on enterprise-grade cloud servers with SOC 2 compliance.'
    },
    {
      question: 'What PDF tools are included?',
      answer: 'Our platform includes 70+ PDF tools: merge, split, compress, convert (to/from Word, Excel, JPG), OCR scanning, password protection, watermarks, page organization, metadata editing, and more. All tools are cloud-based and process files securely without storing them permanently.'
    },
    {
      question: 'How does AI-powered document processing work?',
      answer: 'Our AI features include automatic document summarization, smart form auto-fill using data extraction, intelligent document classification, and workflow automation. The AI learns from document patterns to improve accuracy and speed over time.'
    },
    {
      question: 'What happens to my documents after signing?',
      answer: 'Signed documents are securely stored in your account with full version history and audit trails. You can download, share, or integrate with your existing systems via our API. Documents are retained according to your plan settings and can be exported anytime.'
    },
    {
      question: 'Is there a free trial available?',
      answer: 'Yes! We offer a 14-day free trial with full access to all features. No credit card required to start. You can process up to 5 documents during the trial period and explore all PDF tools and AI features.'
    },
    {
      question: 'How is my data protected?',
      answer: 'We implement industry-leading data protection measures including encryption, secure data centers, regular security audits, and compliance with data protection regulations. Your documents are never shared with third parties and are processed in isolated environments.'
    }
  ];

  return (
    <section id="faq" className="py-20 bg-gray-100 lg:py-28 bg-background">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16">
          {/* Left Column - Header */}
          <div className="lg:sticky lg:top-32 lg:self-start">
            <div className="section-badge mb-4 inline-flex">
              <HelpCircle className="w-4 h-4" />
              FAQ
            </div>
            <h2 className="heading">
              Frequently Asked{' '} <br/>
              <span className="gradient-text">Questions</span>
            </h2>
            <p className="text-lg text-muted-foreground mb-8 details-text">
              Everything you need to know about our document automation platform. 
              Can't find the answer you're looking for? Contact our support team.
            </p>
            <a 
              href="#contact" 
              className="inline-flex items-center gap-2 text-primary font-medium hover:underline"
            >
              Contact Support
              <span>→</span>
            </a>
          </div>

          {/* Right Column - Accordion */}
          <div>
            <Accordion type="single" collapsible className="space-y-4">
              {faqs.map((faq, index) => (
                <AccordionItem 
                  key={index} 
                  value={`item-${index}`}
                  className="border border-border rounded-xl px-6 data-[state=open]:bg-card data-[state=open]:shadow-md transition-all"
                >
                  <AccordionTrigger className="text-left font-semibold hover:no-underline py-5 text-foreground">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground pb-5 leading-relaxed">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FAQ;
