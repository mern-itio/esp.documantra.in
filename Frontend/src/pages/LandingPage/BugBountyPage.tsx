import { Bug, Shield, CheckCircle, AlertTriangle, FileText, DollarSign, Award, ArrowRight, Users, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';

const BugBountyPage = () => {
  const bugBountyScopes = [
    {
      name: "Web Application",
      description: "The DocuSigner web application at app.docusigner.com",
      inScope: true
    },
    {
      name: "Mobile Applications",
      description: "Official DocuSigner mobile apps for iOS and Android",
      inScope: true
    },
    {
      name: "API Services",
      description: "All API endpoints at api.docusigner.com",
      inScope: true
    },
    {
      name: "Authentication Systems",
      description: "Login, SSO, MFA, and account recovery mechanisms",
      inScope: true
    },
    {
      name: "PDF Processing Engine",
      description: "Document processing and conversion services",
      inScope: true
    },
    {
      name: "Third-party Integrations",
      description: "Integrations with third-party services",
      inScope: false,
      note: "Only in-scope if the vulnerability is in DocuSigner's implementation"
    },
    {
      name: "Marketing Website",
      description: "The main marketing website at docusigner.com",
      inScope: false,
      note: "Only critical vulnerabilities"
    }
  ];

  const vulnerabilityTypes = [
    {
      category: "High Priority",
      types: [
        "Remote Code Execution (RCE)",
        "SQL Injection",
        "Authentication Bypass",
        "Server-Side Request Forgery (SSRF)",
        "Vertical Privilege Escalation",
        "Insecure Direct Object References (IDOR)"
      ],
      rewards: "$500 - $5,000"
    },
    {
      category: "Medium Priority",
      types: [
        "Cross-Site Scripting (XSS)",
        "Cross-Site Request Forgery (CSRF)",
        "Horizontal Privilege Escalation",
        "Sensitive Data Exposure",
        "XML External Entity (XXE) Injection",
        "Open Redirects with Security Impact"
      ],
      rewards: "$250 - $1,500"
    },
    {
      category: "Low Priority",
      types: [
        "Security Misconfigurations",
        "Rate Limiting Issues",
        "Clickjacking with Demonstrable Impact",
        "Insecure Cookie Attributes",
        "SPF/DKIM/DMARC Issues",
        "Non-critical Information Disclosure"
      ],
      rewards: "$100 - $500"
    }
  ];

  const outOfScope = [
    "Denial of Service (DoS) attacks",
    "Brute force attacks",
    "Social engineering attacks",
    "Physical security attacks",
    "Vulnerabilities in third-party applications or services",
    "Vulnerabilities requiring physical access to a user's device",
    "Self-XSS without additional security impact",
    "Reports from automated tools without verification",
    "TLS/SSL configuration issues without security impact",
    "Missing security headers without demonstrable impact"
  ];

  const hallOfFame = [
    {
      name: "Alex Chen",
      date: "April 2025",
      finding: "Critical Authentication Bypass",
      impact: "High"
    },
    {
      name: "Sarah Johnson",
      date: "March 2025",
      finding: "SQL Injection in Search Function",
      impact: "High"
    },
    {
      name: "Miguel Rodriguez",
      date: "February 2025",
      finding: "IDOR in Document Sharing",
      impact: "Medium"
    },
    {
      name: "Priya Patel",
      date: "January 2025",
      finding: "XSS in Template Editor",
      impact: "Medium"
    },
    {
      name: "David Kim",
      date: "December 2024",
      finding: "SSRF in PDF Processing",
      impact: "High"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-16">
      <div className="container-max">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl shadow-lg p-8 mb-8 text-white">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="md:w-2/3">
              <h1 className="text-3xl md:text-4xl font-bold mb-4">Bug Bounty Program</h1>
              <p className="text-xl text-primary-100 mb-6">
                Help us improve our security by finding and reporting vulnerabilities. We reward security researchers who help us keep DocuSigner safe and secure.
              </p>
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full">
                  <Bug className="h-5 w-5" />
                  <span className="font-medium">Rewards up to $5,000</span>
                </div>
                <div className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full">
                  <Shield className="h-5 w-5" />
                  <span className="font-medium">Safe Harbor Protection</span>
                </div>
                <div className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full">
                  <Award className="h-5 w-5" />
                  <span className="font-medium">Public Recognition</span>
                </div>
              </div>
            </div>
            <div className="md:w-1/3 flex justify-center">
              <div className="w-48 h-48 bg-white/10 rounded-full flex items-center justify-center">
                <Bug className="h-24 w-24 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Program Overview */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Program Overview</h2>
          
          <p className="text-gray-700 mb-6">
            At DocuSigner, we take security seriously. Our Bug Bounty Program invites security researchers to help identify and report security vulnerabilities in our systems. We believe in the value of collaborative security and are committed to working with the security community to maintain the highest security standards.
          </p>
          
          <div className="grid md:grid-cols-3 gap-6">
            <div className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
                <DollarSign className="h-6 w-6 text-primary-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Rewards</h3>
              <p className="text-gray-600">
                We offer cash rewards ranging from $100 to $5,000 based on the severity and impact of the vulnerability. Exceptional findings may receive higher rewards at our discretion.
              </p>
            </div>
            
            <div className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
                <Shield className="h-6 w-6 text-primary-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Safe Harbor</h3>
              <p className="text-gray-600">
                We provide Safe Harbor protection for security researchers who follow our responsible disclosure guidelines and act in good faith.
              </p>
            </div>
            
            <div className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
                <Award className="h-6 w-6 text-primary-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Recognition</h3>
              <p className="text-gray-600">
                With your permission, we'll recognize your contribution in our Hall of Fame and may provide reference letters for exceptional contributions.
              </p>
            </div>
          </div>
        </div>

        {/* Scope */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Program Scope</h2>
          
          <div className="space-y-6">
            <div className="border-b border-gray-200 pb-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">In-Scope Systems</h3>
              <div className="space-y-4">
                {bugBountyScopes.filter(scope => scope.inScope).map((scope, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                    <div>
                      <div className="font-medium text-gray-900">{scope.name}</div>
                      <div className="text-sm text-gray-600">{scope.description}</div>
                      {scope.note && (
                        <div className="text-xs text-gray-500 mt-1">Note: {scope.note}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Out-of-Scope Systems</h3>
              <div className="space-y-4">
                {bugBountyScopes.filter(scope => !scope.inScope).map((scope, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" />
                    <div>
                      <div className="font-medium text-gray-900">{scope.name}</div>
                      <div className="text-sm text-gray-600">{scope.description}</div>
                      {scope.note && (
                        <div className="text-xs text-gray-500 mt-1">Note: {scope.note}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Vulnerability Types and Rewards */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Vulnerability Types and Rewards</h2>
          
          <div className="space-y-8">
            {vulnerabilityTypes.map((category, index) => (
              <div key={index} className="border border-gray-200 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold text-gray-900">{category.category}</h3>
                  <div className="bg-green-100 text-green-800 px-4 py-1 rounded-full text-sm font-medium">
                    {category.rewards}
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-3">
                  {category.types.map((type, typeIndex) => (
                    <div key={typeIndex} className="flex items-center gap-2 bg-gray-50 p-3 rounded-lg">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-gray-700">{type}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Out of Scope Vulnerabilities */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Out of Scope Vulnerabilities</h2>
          
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-6 w-6 text-yellow-600 mt-0.5" />
              <div>
                <h3 className="text-lg font-semibold text-yellow-800 mb-2">Important Notice</h3>
                <p className="text-yellow-700">
                  The following types of vulnerabilities are not eligible for rewards. Please do not test for these issues as they may disrupt our services or violate our terms of service.
                </p>
              </div>
            </div>
          </div>
          
          <div className="grid md:grid-cols-2 gap-4">
            {outOfScope.map((item, index) => (
              <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                <span className="text-gray-700">{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Submission Guidelines */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Submission Guidelines</h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">How to Submit</h3>
              <p className="text-gray-700 mb-4">
                Please submit your vulnerability reports through our secure bug bounty platform or via encrypted email. Include the following information in your report:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Clear description of the vulnerability</li>
                <li>Steps to reproduce the issue</li>
                <li>Proof of concept (PoC) if applicable</li>
                <li>Impact assessment</li>
                <li>Suggested mitigation or fix (optional)</li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Responsible Disclosure</h3>
              <p className="text-gray-700 mb-4">
                We ask that you follow these guidelines when testing and reporting vulnerabilities:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Do not access, modify, or delete data that does not belong to you</li>
                <li>Do not perform actions that could affect system availability or integrity</li>
                <li>Do not use vulnerabilities to pivot to other systems</li>
                <li>Do not disclose any vulnerabilities publicly before they have been resolved</li>
                <li>Provide reasonable time for us to address the vulnerability before any disclosure</li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Response Timeline</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-primary-600 font-bold">1</span>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">Initial Response</div>
                    <div className="text-gray-600">We'll acknowledge your report within 24 hours</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-primary-600 font-bold">2</span>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">Triage</div>
                    <div className="text-gray-600">We'll evaluate the report and determine its validity within 3 business days</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-primary-600 font-bold">3</span>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">Resolution</div>
                    <div className="text-gray-600">We aim to resolve valid vulnerabilities within 30 days, depending on complexity</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-primary-600 font-bold">4</span>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">Reward</div>
                    <div className="text-gray-600">Rewards are issued after the vulnerability has been validated and fixed</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Hall of Fame */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Hall of Fame</h2>
          
          <p className="text-gray-700 mb-6">
            We'd like to thank the following security researchers for their valuable contributions to our security. These individuals have helped us identify and fix security vulnerabilities, making DocuSigner more secure for everyone.
          </p>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Researcher</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Finding</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Impact</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {hallOfFame.map((researcher, index) => (
                  <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{researcher.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{researcher.date}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{researcher.finding}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        researcher.impact === 'High' ? 'bg-red-100 text-red-800' :
                        researcher.impact === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {researcher.impact}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Legal Safe Harbor */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Legal Safe Harbor</h2>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
            <div className="flex items-start gap-3">
              <Shield className="h-6 w-6 text-blue-600 mt-0.5" />
              <div>
                <h3 className="text-lg font-semibold text-blue-800 mb-2">Safe Harbor Protection</h3>
                <p className="text-blue-700">
                  DocuSigner provides "Safe Harbor" for security researchers who:
                </p>
                <ul className="list-disc pl-6 mt-2 space-y-1 text-blue-700">
                  <li>Make a good faith effort to avoid privacy violations, destruction of data, and interruption or degradation of our services</li>
                  <li>Only interact with accounts you own or with explicit permission of the account holder</li>
                  <li>Do not exploit a security issue you discover for any reason other than testing</li>
                  <li>Report any vulnerability you've discovered promptly</li>
                  <li>Follow our responsible disclosure guidelines</li>
                </ul>
              </div>
            </div>
          </div>
          
          <p className="text-gray-700 mb-4">
            We will not pursue civil action or initiate a complaint to law enforcement for accidental, good faith violations of this policy. We consider security research conducted under this policy to be:
          </p>
          
          <ul className="list-disc pl-6 mb-6 space-y-2 text-gray-700">
            <li>Authorized under the Computer Fraud and Abuse Act (CFAA)</li>
            <li>Exempt from the Digital Millennium Copyright Act (DMCA)</li>
            <li>Exempt from restrictions in our Terms of Service that would otherwise restrict security research</li>
            <li>Lawful, authorized conduct under applicable anti-hacking laws</li>
          </ul>
          
          <p className="text-gray-700 mb-4">
            Please note that if your security research involves the networks, systems, information, applications, products, or services of a third party, that third party may determine whether to pursue legal action. DocuSigner cannot and does not authorize security research in the name of other entities.
          </p>
          
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-6 w-6 text-yellow-600 mt-0.5" />
              <div>
                <h3 className="text-lg font-semibold text-yellow-800 mb-2">Limitation of Safe Harbor</h3>
                <p className="text-yellow-700">
                  This safe harbor does not apply to:
                </p>
                <ul className="list-disc pl-6 mt-2 space-y-1 text-yellow-700">
                  <li>Any conduct that intentionally harms DocuSigner or our customers</li>
                  <li>Social engineering attacks, including phishing</li>
                  <li>Denial of service attacks</li>
                  <li>Physical attacks against our offices, data centers, or employees</li>
                  <li>Any testing that involves automated scanning tools that generate significant volumes of traffic</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl shadow-lg p-8 text-white">
          <h2 className="text-2xl font-bold mb-6">Contact Information</h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-xl font-semibold mb-4">Report a Vulnerability</h3>
              <p className="text-primary-100 mb-6">
                To report a security vulnerability, please use one of the following methods:
              </p>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Shield className="h-5 w-5 text-primary-200 mt-1" />
                  <div>
                    <div className="font-medium">Bug Bounty Platform</div>
                    <div className="text-primary-100">Submit through our HackerOne program (preferred method)</div>
                    <a href="https://hackerone.com/docusigner" className="text-white underline hover:text-primary-200">hackerone.com/docusigner</a>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Lock className="h-5 w-5 text-primary-200 mt-1" />
                  <div>
                    <div className="font-medium">Encrypted Email</div>
                    <div className="text-primary-100">Send encrypted reports to our security team</div>
                    <a href="mailto:security@docusigner.com" className="text-white underline hover:text-primary-200">security@docusigner.com</a>
                    <div className="text-xs text-primary-200 mt-1">PGP Key: [PGP Key Fingerprint]</div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
              <h3 className="text-xl font-semibold mb-4">Security Resources</h3>
              <div className="space-y-4">
                <Link to="/security-overview" className="flex items-center gap-3 p-3 bg-white/20 rounded-lg hover:bg-white/30 transition-colors">
                  <Shield className="h-5 w-5" />
                  <div>
                    <div className="font-medium">Security Overview</div>
                    <div className="text-sm text-primary-100">Learn about our security practices</div>
                  </div>
                </Link>
                <Link to="/security-policy" className="flex items-center gap-3 p-3 bg-white/20 rounded-lg hover:bg-white/30 transition-colors">
                  <FileText className="h-5 w-5" />
                  <div>
                    <div className="font-medium">Security Policy</div>
                    <div className="text-sm text-primary-100">Review our full security policy</div>
                  </div>
                </Link>
                <Link to="/responsible-disclosure" className="flex items-center gap-3 p-3 bg-white/20 rounded-lg hover:bg-white/30 transition-colors">
                  <Users className="h-5 w-5" />
                  <div>
                    <div className="font-medium">Responsible Disclosure</div>
                    <div className="text-sm text-primary-100">Guidelines for responsible disclosure</div>
                  </div>
                </Link>
                <Link to="/security-advisories" className="flex items-center gap-3 p-3 bg-white/20 rounded-lg hover:bg-white/30 transition-colors">
                  <AlertTriangle className="h-5 w-5" />
                  <div>
                    <div className="font-medium">Security Advisories</div>
                    <div className="text-sm text-primary-100">Past security bulletins and fixes</div>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mt-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Frequently Asked Questions</h2>
          
          <div className="space-y-4">
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="p-4 bg-gray-50">
                <h3 className="font-semibold text-gray-900">How do I know if my finding is valid?</h3>
              </div>
              <div className="p-4">
                <p className="text-gray-700">
                  A valid finding demonstrates a clear security impact on our systems or users. It should be reproducible and include clear steps to verify the vulnerability. Theoretical vulnerabilities without proof of concept may be considered, but typically receive lower rewards.
                </p>
              </div>
            </div>
            
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="p-4 bg-gray-50">
                <h3 className="font-semibold text-gray-900">How are reward amounts determined?</h3>
              </div>
              <div className="p-4">
                <p className="text-gray-700">
                  Reward amounts are determined based on several factors including the severity of the vulnerability, the potential impact on our systems and users, the quality of the report, and the difficulty of exploitation. We use the CVSS scoring system as a baseline but also consider business impact.
                </p>
              </div>
            </div>
            
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="p-4 bg-gray-50">
                <h3 className="font-semibold text-gray-900">Can I test from automated scanning tools?</h3>
              </div>
              <div className="p-4">
                <p className="text-gray-700">
                  We prefer manual testing over automated scanning. Automated scanning can generate significant traffic and potentially impact our services. If you want to use automated tools, please contact us first for approval and coordination. Reports that are simply the output of automated tools without verification or additional context will not be eligible for rewards.
                </p>
              </div>
            </div>
            
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="p-4 bg-gray-50">
                <h3 className="font-semibold text-gray-900">How long does it take to receive a reward?</h3>
              </div>
              <div className="p-4">
                <p className="text-gray-700">
                  We aim to issue rewards within 30 days after the vulnerability has been validated and fixed. Complex vulnerabilities may take longer to address. We'll keep you updated throughout the process and notify you when the reward is being processed.
                </p>
              </div>
            </div>
            
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="p-4 bg-gray-50">
                <h3 className="font-semibold text-gray-900">Can I disclose the vulnerability publicly?</h3>
              </div>
              <div className="p-4">
                <p className="text-gray-700">
                  We ask that you do not disclose the vulnerability publicly until we have had sufficient time to address it. After the vulnerability has been fixed, we welcome coordinated disclosure. Please work with our security team to determine an appropriate timeline for disclosure.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl shadow-lg p-8 mt-8 text-white text-center">
          <h2 className="text-2xl font-bold mb-4">Ready to Start Hunting?</h2>
          <p className="text-xl text-primary-100 max-w-3xl mx-auto mb-8">
            Join our bug bounty program today and help us make DocuSigner more secure while earning rewards for your findings.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href="https://hackerone.com/docusigner" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="bg-white text-primary-600 hover:bg-gray-100 font-semibold py-3 px-8 rounded-lg transition-colors shadow-lg hover:shadow-xl text-lg"
            >
              Join Our Program <ArrowRight className="ml-2 h-5 w-5 inline" />
            </a>
            <Link to="/security-policy" className="border-2 border-white text-white hover:bg-white hover:text-primary-600 font-semibold py-3 px-8 rounded-lg transition-colors text-lg">
              Review Security Policy
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BugBountyPage;