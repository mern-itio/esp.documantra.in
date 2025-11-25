import { Shield, Lock, Server, Database, Globe, Users, CheckCircle, AlertTriangle, FileText, Eye, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';

const SecurityOverviewPage = () => {
  const securityFeatures = [
    {
      icon: Lock,
      title: "Data Encryption",
      description: "All data is encrypted in transit and at rest using industry-standard 256-bit AES encryption and TLS 1.2+ for all data transmissions.",
      details: [
        "256-bit AES encryption for all stored data",
        "TLS 1.2+ for all data transmissions",
        "Encrypted document storage",
        "Secure key management"
      ]
    },
    {
      icon: Server,
      title: "Infrastructure Security",
      description: "Our infrastructure is hosted in SOC 2 Type II certified data centers with 24/7 monitoring, intrusion detection, and advanced threat protection.",
      details: [
        "SOC 2 Type II certified data centers",
        "24/7 infrastructure monitoring",
        "Intrusion detection systems",
        "DDoS protection",
        "Regular security patching"
      ]
    },
    {
      icon: Database,
      title: "Data Protection",
      description: "We implement comprehensive data protection measures including regular backups, disaster recovery planning, and strict access controls.",
      details: [
        "Automated daily backups",
        "Geo-redundant storage",
        "Disaster recovery planning",
        "Data loss prevention systems",
        "99.9% uptime SLA"
      ]
    },
    {
      icon: Users,
      title: "Access Controls",
      description: "Strict role-based access controls, multi-factor authentication, and detailed audit logging protect your account and documents.",
      details: [
        "Role-based access controls (RBAC)",
        "Multi-factor authentication (MFA)",
        "Single sign-on (SSO) integration",
        "IP-based access restrictions",
        "Session timeout controls"
      ]
    },
    {
      icon: Eye,
      title: "Security Monitoring",
      description: "Continuous security monitoring, automated vulnerability scanning, and regular penetration testing ensure our systems remain secure.",
      details: [
        "24/7 security monitoring",
        "Automated vulnerability scanning",
        "Regular penetration testing",
        "Security incident response team",
        "Real-time threat intelligence"
      ]
    },
    {
      icon: RefreshCw,
      title: "Secure Development",
      description: "Our secure development lifecycle includes code reviews, automated security testing, and third-party security audits.",
      details: [
        "Secure development lifecycle",
        "Regular code reviews",
        "Automated security testing",
        "Third-party security audits",
        "Dependency vulnerability scanning"
      ]
    }
  ];

  const certifications = [
    {
      name: "SOC 2 Type II",
      description: "Certified for security, availability, processing integrity, confidentiality, and privacy controls",
      icon: () => (
        <div className="w-16 h-16 bg-white rounded-lg flex items-center justify-center shadow-sm border border-gray-200">
          <div className="text-center">
            <div className="text-xs font-bold text-purple-800">AICPA</div>
            <div className="text-xs font-bold text-purple-800">SOC 2</div>
          </div>
        </div>
      ),
      color: "bg-purple-100 text-purple-800"
    },
    {
      name: "ISO 27001",
      description: "Certified for information security management systems",
      icon: () => (
        <div className="w-16 h-16 bg-white rounded-lg flex items-center justify-center shadow-sm border border-gray-200">
          <div className="text-center">
            <div className="text-xs font-bold text-blue-800">ISO</div>
            <div className="text-xs font-bold text-blue-800">27001</div>
          </div>
        </div>
      ),
      color: "bg-blue-100 text-blue-800"
    },
    {
      name: "GDPR Compliant",
      description: "Fully compliant with EU General Data Protection Regulation",
      icon: () => (
        <div className="w-16 h-16 bg-white rounded-lg flex items-center justify-center shadow-sm border border-gray-200">
          <div className="text-center">
            <div className="text-xs font-bold text-blue-800">GDPR</div>
            <div className="text-lg">🇪🇺</div>
          </div>
        </div>
      ),
      color: "bg-blue-100 text-blue-800"
    },
    {
      name: "HIPAA Compliant",
      description: "Compliant with Health Insurance Portability and Accountability Act",
      icon: () => (
        <div className="w-16 h-16 bg-white rounded-lg flex items-center justify-center shadow-sm border border-gray-200">
          <div className="text-center">
            <div className="text-xs font-bold text-red-800">HIPAA</div>
            <div className="text-lg">⚕️</div>
          </div>
        </div>
      ),
      color: "bg-red-100 text-red-800"
    },
    {
      name: "PCI DSS",
      description: "Compliant with Payment Card Industry Data Security Standard",
      icon: () => (
        <div className="w-16 h-16 bg-white rounded-lg flex items-center justify-center shadow-sm border border-gray-200">
          <div className="text-center">
            <div className="text-lg font-bold text-blue-800">PCI</div>
            <div className="text-xs text-blue-600">DSS</div>
          </div>
        </div>
      ),
      color: "bg-blue-100 text-blue-800"
    },
    {
      name: "CCPA Compliant",
      description: "Compliant with California Consumer Privacy Act",
      icon: () => (
        <div className="w-16 h-16 bg-white rounded-lg flex items-center justify-center shadow-sm border border-gray-200">
          <div className="text-center">
            <div className="text-xs font-bold text-yellow-800">CCPA</div>
            <div className="text-lg">🔒</div>
          </div>
        </div>
      ),
      color: "bg-yellow-100 text-yellow-800"
    }
  ];

  const securityPractices = [
    {
      title: "Vulnerability Management",
      description: "Our comprehensive vulnerability management program includes regular scanning, patching, and remediation to protect against emerging threats.",
      items: [
        "Automated vulnerability scanning",
        "Regular security patching",
        "Third-party penetration testing",
        "Bug bounty program",
        "Continuous monitoring"
      ]
    },
    {
      title: "Employee Security",
      description: "We maintain strict security practices for all employees, including background checks, security training, and least-privilege access controls.",
      items: [
        "Background checks for all employees",
        "Regular security awareness training",
        "Least-privilege access model",
        "Secure remote access policies",
        "Security incident response training"
      ]
    },
    {
      title: "Physical Security",
      description: "Our data centers implement rigorous physical security measures to protect hardware and infrastructure from unauthorized access.",
      items: [
        "24/7 security personnel",
        "Biometric access controls",
        "CCTV surveillance",
        "Environmental monitoring",
        "Redundant power and cooling"
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 mt-8 pt-24 pb-16">
      <div className="container-max">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-[#260559]/100 to-[#260559]/90 rounded-2xl shadow-lg p-8 mb-8 text-white">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="md:w-2/3">
              <h1 className="text-3xl md:text-4xl font-bold mb-4">Enterprise-Grade Security</h1>
              <p className="text-xl text-primary-100 mb-6">
                Draft&Sign implements industry-leading security measures to protect your documents, data, and signatures. Our comprehensive security program ensures the confidentiality, integrity, and availability of your information.
              </p>
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full">
                  <Lock className="h-5 w-5" />
                  <span className="font-medium">256-bit Encryption</span>
                </div>
                <div className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full">
                  <Shield className="h-5 w-5" />
                  <span className="font-medium">SOC 2 Type II Certified</span>
                </div>
                <div className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full">
                  <Globe className="h-5 w-5" />
                  <span className="font-medium">GDPR Compliant</span>
                </div>
              </div>
            </div>
            <div className="md:w-1/3 flex justify-center">
              <div className="w-48 h-48 bg-white/10 rounded-full flex items-center justify-center">
                <Shield className="h-24 w-24 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Security Features */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Our Security Infrastructure</h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {securityFeatures.map((feature, index) => (
              <div key={index} className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                    <feature.icon className="h-6 w-6 text-primary-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">{feature.title}</h3>
                </div>
                <p className="text-gray-600 mb-4">{feature.description}</p>
                <ul className="space-y-2">
                  {feature.details.map((detail, detailIndex) => (
                    <li key={detailIndex} className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-1 flex-shrink-0" />
                      <span className="text-sm text-gray-700">{detail}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Certifications */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Security Certifications & Compliance</h2>
          <p className="text-gray-600 mb-8 max-w-3xl">
            Draft&Sign maintains compliance with industry-leading security standards and regulations to ensure your data is protected according to the highest standards.
          </p>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {certifications.map((cert, index) => (
              <div key={index} className="text-center p-6 bg-gray-50 rounded-xl hover:shadow-lg transition-all duration-200">
                <div className="flex justify-center mb-4">
                  <cert.icon />
                </div>
                <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium mb-3 ${cert.color}`}>
                  {cert.name}
                </div>
                <p className="text-gray-600 text-sm">{cert.description}</p>
              </div>
            ))}
          </div>
          
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
            <div className="flex items-start gap-4">
              <FileText className="h-6 w-6 text-blue-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-lg font-semibold text-blue-800 mb-2">Security Documentation</h3>
                <p className="text-blue-700 mb-4">
                  Detailed security documentation is available upon request for enterprise customers, including:
                </p>
                <div className="grid md:grid-cols-2 gap-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-blue-600" />
                    <span className="text-blue-700">Security Whitepaper</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-blue-600" />
                    <span className="text-blue-700">SOC 2 Type II Report</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-blue-600" />
                    <span className="text-blue-700">Penetration Test Results</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-blue-600" />
                    <span className="text-blue-700">Security Questionnaire Responses</span>
                  </div>
                </div>
                <div className="mt-4">
                  <Link to="/contact-sales" className="text-blue-600 font-medium hover:text-blue-800">
                    Contact our security team for documentation →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Security Practices */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Security Practices & Policies</h2>
          
          <div className="space-y-8">
            {securityPractices.map((practice, index) => (
              <div key={index} className="border-b border-gray-200 pb-8 last:border-b-0 last:pb-0">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{practice.title}</h3>
                <p className="text-gray-600 mb-4">{practice.description}</p>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {practice.items.map((item, itemIndex) => (
                    <div key={itemIndex} className="flex items-start gap-2 bg-gray-50 p-3 rounded-lg">
                      <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Data Privacy */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Data Privacy & Protection</h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Privacy by Design</h3>
              <p className="text-gray-600 mb-4">
                Draft&Sign implements privacy by design principles, ensuring that privacy considerations are built into our systems and processes from the ground up.
              </p>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-medium text-gray-900">Data Minimization</span>
                    <p className="text-sm text-gray-600 mt-1">We collect only the data necessary to provide our services, minimizing privacy risks.</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-medium text-gray-900">Purpose Limitation</span>
                    <p className="text-sm text-gray-600 mt-1">We use your data only for the purposes for which it was collected.</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-medium text-gray-900">User Control</span>
                    <p className="text-sm text-gray-600 mt-1">We provide tools for users to access, export, and delete their data.</p>
                  </div>
                </li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Regulatory Compliance</h3>
              <p className="text-gray-600 mb-4">
                We maintain compliance with global privacy regulations to protect your data regardless of where you operate.
              </p>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-medium text-gray-900">GDPR Compliance</span>
                    <p className="text-sm text-gray-600 mt-1">Full compliance with EU data protection regulations.</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-medium text-gray-900">CCPA Compliance</span>
                    <p className="text-sm text-gray-600 mt-1">Adherence to California Consumer Privacy Act requirements.</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-medium text-gray-900">International Data Transfers</span>
                    <p className="text-sm text-gray-600 mt-1">Compliant mechanisms for cross-border data transfers.</p>
                  </div>
                </li>
              </ul>
            </div>
          </div>
          
          <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <div className="flex items-start gap-4">
              <AlertTriangle className="h-6 w-6 text-yellow-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-lg font-semibold text-yellow-800 mb-2">Data Retention & Deletion</h3>
                <p className="text-yellow-700 mb-4">
                  We maintain transparent data retention policies to ensure your data is only stored for as long as necessary:
                </p>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                    <span className="text-yellow-700">Free users: Files are automatically deleted after 1 hour of processing</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                    <span className="text-yellow-700">Paid users: Data is retained according to your subscription terms and can be deleted at any time</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                    <span className="text-yellow-700">Account deletion: All associated data is permanently removed when you delete your account</span>
                  </li>
                </ul>
                <div className="mt-4">
                  <Link to="/privacy-policy" className="text-yellow-800 font-medium hover:text-yellow-900">
                    View our full Privacy Policy →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Security FAQ */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Security FAQ</h2>
          
          <div className="space-y-4">
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="p-4 bg-gray-50">
                <h3 className="font-semibold text-gray-900">How does Draft&Sign protect my documents?</h3>
              </div>
              <div className="p-4">
                <p className="text-gray-700">
                  Draft&Sign protects your documents using multiple layers of security. All documents are encrypted both in transit and at rest using 256-bit AES encryption. Access to documents is controlled through strict authentication and authorization mechanisms. Our infrastructure is hosted in secure, SOC 2 Type II certified data centers with comprehensive physical and network security measures.
                </p>
              </div>
            </div>
            
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="p-4 bg-gray-50">
                <h3 className="font-semibold text-gray-900">Are my electronic signatures legally binding and secure?</h3>
              </div>
              <div className="p-4">
                <p className="text-gray-700">
                  Yes, Draft&Sign's electronic signatures are both legally binding and secure. Our e-signature solution complies with major e-signature laws worldwide, including ESIGN Act, UETA, and eIDAS. Each signature is protected by tamper-evident technology that detects any changes made to the document after signing. We maintain comprehensive audit trails that record all actions taken on a document, providing court-admissible evidence of the signing process.
                </p>
              </div>
            </div>
            
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="p-4 bg-gray-50">
                <h3 className="font-semibold text-gray-900">How does Draft&Sign handle user authentication?</h3>
              </div>
              <div className="p-4">
                <p className="text-gray-700">
                  Draft&Sign implements robust authentication mechanisms to verify user identities. We support strong password policies, multi-factor authentication (MFA), and single sign-on (SSO) integration with major identity providers. For document signers, we offer multiple authentication methods including email verification, SMS verification, knowledge-based authentication (KBA), and ID verification options to ensure the right person is signing your documents.
                </p>
              </div>
            </div>
            
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="p-4 bg-gray-50">
                <h3 className="font-semibold text-gray-900">What happens if there's a security incident?</h3>
              </div>
              <div className="p-4">
                <p className="text-gray-700">
                  Draft&Sign maintains a comprehensive security incident response plan. Our security team monitors our systems 24/7 for potential security incidents. If an incident occurs, we follow a documented process for containment, eradication, recovery, and notification. We will promptly notify affected customers in accordance with our contractual obligations and applicable laws, providing transparent information about the incident and our response.
                </p>
              </div>
            </div>
            
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="p-4 bg-gray-50">
                <h3 className="font-semibold text-gray-900">How can I report a security vulnerability?</h3>
              </div>
              <div className="p-4">
                <p className="text-gray-700">
                  We take security vulnerabilities seriously and appreciate the security community's efforts to responsibly disclose issues. If you discover a potential security vulnerability, please report it to security@docusigner.com. We have a dedicated security team that will investigate all legitimate reports and work diligently to address any vulnerabilities. We also maintain a bug bounty program for eligible security researchers.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-[#260559]/100 to-[#260559]/90 rounded-2xl shadow-lg p-8 text-white text-center">
          <h2 className="text-2xl font-bold mb-4">Ready to Experience Enterprise-Grade Security?</h2>
          <p className="text-xl text-primary-100 max-w-3xl mx-auto mb-8">
            Join thousands of organizations that trust Draft&Sign to protect their most sensitive documents and data.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/signup" className="bg-white text-[#260559] hover:bg-gray-100 font-semibold py-3 px-8 rounded-lg transition-colors shadow-lg hover:shadow-xl text-lg">
              Start Free Trial
            </Link>
            <Link to="/contact" className="border-2 border-white text-white hover:bg-white hover:text-[#260559] font-semibold py-3 px-8 rounded-lg transition-colors text-lg">
              Contact Security Team
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SecurityOverviewPage;