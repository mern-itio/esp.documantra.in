import { Accessibility, CheckCircle, AlertTriangle, FileText, Users, Settings, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const AccessibilityPage = () => {
  const accessibilityFeatures = [
    {
      title: "Screen Reader Compatibility",
      description: "Our platform is optimized for screen readers including JAWS, NVDA, VoiceOver, and TalkBack.",
      items: [
        "Proper heading structure and navigation",
        "Alt text for all images and graphics",
        "ARIA landmarks and roles",
        "Keyboard focus indicators",
        "Descriptive link text"
      ]
    },
    {
      title: "Keyboard Navigation",
      description: "Complete keyboard accessibility ensures users can navigate without a mouse or touchpad.",
      items: [
        "Logical tab order",
        "Visible focus indicators",
        "Keyboard shortcuts",
        "Skip navigation links",
        "No keyboard traps"
      ]
    },
    {
      title: "Visual Design",
      description: "Our interface is designed with visual accessibility in mind for users with various visual impairments.",
      items: [
        "High contrast mode support",
        "Resizable text without loss of functionality",
        "Color not used as the only means of conveying information",
        "WCAG 2.1 AA compliant color contrast",
        "Responsive design for zoom up to 400%"
      ]
    },
    {
      title: "Cognitive Accessibility",
      description: "Features to assist users with cognitive disabilities or learning differences.",
      items: [
        "Clear, consistent navigation",
        "Simple language and instructions",
        "Error prevention and recovery",
        "Predictable interface behavior",
        "Sufficient time to read and use content"
      ]
    }
  ];

  const complianceStandards = [
    {
      name: "WCAG 2.1 AA",
      description: "Web Content Accessibility Guidelines Level AA compliance",
      status: "Compliant",
      icon: CheckCircle,
      color: "text-green-600"
    },
    {
      name: "Section 508",
      description: "U.S. federal government accessibility requirements",
      status: "Compliant",
      icon: CheckCircle,
      color: "text-green-600"
    },
    {
      name: "ADA",
      description: "Americans with Disabilities Act standards",
      status: "Compliant",
      icon: CheckCircle,
      color: "text-green-600"
    },
    {
      name: "EN 301 549",
      description: "European accessibility requirements for ICT products and services",
      status: "Compliant",
      icon: CheckCircle,
      color: "text-green-600"
    },
    {
      name: "AODA",
      description: "Accessibility for Ontarians with Disabilities Act",
      status: "Compliant",
      icon: CheckCircle,
      color: "text-green-600"
    },
    {
      name: "PDF/UA",
      description: "PDF Universal Accessibility standard (ISO 14289)",
      status: "In Progress",
      icon: AlertTriangle,
      color: "text-yellow-600"
    }
  ];

  const accessibilityTools = [
    {
      name: "PDF Accessibility Checker",
      description: "Analyze PDFs for accessibility issues and get recommendations for improvements.",
      path: "/pdf-accessibility-checker"
    },
    {
      name: "Add Alt Text",
      description: "Add alternative text descriptions to images in PDF documents.",
      path: "/add-alt-text"
    },
    {
      name: "Create Accessible Forms",
      description: "Build PDF forms with proper labels, instructions, and screen reader support.",
      path: "/create-accessible-forms"
    },
    {
      name: "Tag PDF Documents",
      description: "Add proper document structure tags to improve screen reader navigation.",
      path: "/tag-pdf"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-16">
      <div className="container-max">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-[#260559]/100 to-[#260559]/90 rounded-2xl shadow-lg p-8 mb-8 text-white">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="md:w-2/3">
              <h1 className="text-3xl md:text-4xl font-bold mb-4">Accessibility Commitment</h1>
              <p className="text-xl text-primary-100 mb-6">
                DocuSigner is committed to ensuring our platform is accessible to everyone, including people with disabilities. We strive to meet WCAG 2.1 AA standards and continuously improve our accessibility features.
              </p>
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full">
                  <Accessibility className="h-5 w-5" />
                  <span className="font-medium">WCAG 2.1 AA Compliant</span>
                </div>
                <div className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full">
                  <CheckCircle className="h-5 w-5" />
                  <span className="font-medium">Section 508 Compliant</span>
                </div>
                <div className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full">
                  <Users className="h-5 w-5" />
                  <span className="font-medium">Inclusive Design</span>
                </div>
              </div>
            </div>
            <div className="md:w-1/3 flex justify-center">
              <div className="w-48 h-48 bg-white/10 rounded-full flex items-center justify-center">
                <Accessibility className="h-24 w-24 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Accessibility Features */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Accessibility Features</h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            {accessibilityFeatures.map((feature, index) => (
              <div key={index} className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600 mb-4">{feature.description}</p>
                <ul className="space-y-2">
                  {feature.items.map((item, itemIndex) => (
                    <li key={itemIndex} className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Compliance Standards */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Compliance Standards</h2>
          <p className="text-gray-600 mb-8 max-w-3xl">
            DocuSigner is committed to meeting international accessibility standards and regulations. We regularly audit our platform against these standards and work to address any gaps.
          </p>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {complianceStandards.map((standard, index) => (
              <div key={index} className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-3">
                  <standard.icon className={`h-6 w-6 ${standard.color}`} />
                  <h3 className="text-lg font-semibold text-gray-900">{standard.name}</h3>
                </div>
                <p className="text-gray-600 mb-3">{standard.description}</p>
                <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                  standard.status === 'Compliant' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {standard.status}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Accessible PDF Tools */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Accessible PDF Tools</h2>
          <p className="text-gray-600 mb-8 max-w-3xl">
            DocuSigner provides specialized tools to help you create and maintain accessible PDF documents that meet WCAG 2.1 AA and PDF/UA standards.
          </p>
          
          <div className="grid md:grid-cols-2 gap-6">
            {accessibilityTools.map((tool, index) => (
              <div key={index} className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{tool.name}</h3>
                <p className="text-gray-600 mb-4">{tool.description}</p>
                <Link 
                  to={tool.path}
                  className="inline-flex items-center text-primary-600 hover:text-primary-700 font-medium"
                >
                  Learn more <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* Accessibility Statement */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Accessibility Statement</h2>
          
          <div className="space-y-4 text-gray-700">
            <p>
              DocuSigner is committed to ensuring digital accessibility for people with disabilities. We are continually improving the user experience for everyone and applying the relevant accessibility standards.
            </p>
            
            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Conformance Status</h3>
            <p>
              The Web Content Accessibility Guidelines (WCAG) defines requirements for designers and developers to improve accessibility for people with disabilities. It defines three levels of conformance: Level A, Level AA, and Level AAA.
            </p>
            <p>
              DocuSigner is partially conformant with WCAG 2.1 level AA. Partially conformant means that some parts of the content do not fully conform to the accessibility standard.
            </p>
            
            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Feedback</h3>
            <p>
              We welcome your feedback on the accessibility of DocuSigner. Please let us know if you encounter accessibility barriers:
            </p>
            <ul className="list-disc pl-6 mt-2">
              <li>Email: accessibility@docusigner.com</li>
              <li>Phone: (555) 123-4567</li>
              <li>Feedback form: [Link to feedback form]</li>
            </ul>
            <p className="mt-2">
              We try to respond to feedback within 2 business days.
            </p>
            
            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Compatibility with Browsers and Assistive Technology</h3>
            <p>
              DocuSigner is designed to be compatible with the following assistive technologies:
            </p>
            <ul className="list-disc pl-6 mt-2">
              <li>JAWS and NVDA with Chrome, Firefox, and Edge on Windows</li>
              <li>VoiceOver with Safari on macOS and iOS</li>
              <li>TalkBack with Chrome on Android</li>
              <li>Dragon NaturallySpeaking with Chrome and Firefox on Windows</li>
              <li>ZoomText and other screen magnifiers</li>
            </ul>
            
            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Technical Specifications</h3>
            <p>
              Accessibility of DocuSigner relies on the following technologies to work with the particular combination of web browser and any assistive technologies or plugins installed on your computer:
            </p>
            <ul className="list-disc pl-6 mt-2">
              <li>HTML</li>
              <li>WAI-ARIA</li>
              <li>CSS</li>
              <li>JavaScript</li>
            </ul>
            <p className="mt-2">
              These technologies are relied upon for conformance with the accessibility standards used.
            </p>
            
            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Assessment Approach</h3>
            <p>
              DocuSigner has assessed the accessibility of our platform through the following approaches:
            </p>
            <ul className="list-disc pl-6 mt-2">
              <li>Self-evaluation</li>
              <li>External evaluation by accessibility experts</li>
              <li>User testing with assistive technologies</li>
              <li>Automated testing tools</li>
            </ul>
          </div>
        </div>

        {/* Continuous Improvement */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Our Commitment to Continuous Improvement</h2>
          
          <div className="grid md:grid-cols-3 gap-6">
            <div className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mb-4">
                <Settings className="h-6 w-6 text-primary-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Regular Audits</h3>
              <p className="text-gray-600">
                We conduct regular accessibility audits of our platform to identify and address issues. Our development process includes accessibility testing at every stage.
              </p>
            </div>
            
            <div className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-primary-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">User Feedback</h3>
              <p className="text-gray-600">
                We actively seek feedback from users with disabilities to understand their experiences and identify areas for improvement in our platform.
              </p>
            </div>
            
            <div className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mb-4">
                <FileText className="h-6 w-6 text-primary-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Documentation</h3>
              <p className="text-gray-600">
                We maintain comprehensive documentation on our accessibility features and provide guidance for users with disabilities on how to best use our platform.
              </p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-[#260559]/100 to-[#260559]/90 rounded-2xl shadow-lg p-8 text-white text-center">
          <h2 className="text-2xl font-bold mb-4">Experience Our Accessible Platform</h2>
          <p className="text-xl text-primary-100 max-w-3xl mx-auto mb-8">
            Join thousands of organizations that trust DocuSigner for accessible document management and e-signature solutions.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/signup" className="bg-white text-[#260559] hover:bg-gray-100 font-semibold py-3 px-8 rounded-lg transition-colors shadow-lg hover:shadow-xl text-lg">
              Start Free Trial
            </Link>
            <Link to="/contact" className="border-2 border-white text-white hover:bg-white hover:text-[#260559] font-semibold py-3 px-8 rounded-lg transition-colors text-lg">
              Contact Accessibility Team
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccessibilityPage;