import { useRef, useState } from 'react';
import { Download, Printer, ChevronDown, ChevronUp, Shield, Lock, Database, Globe, AlertCircle, Check, FileText } from 'lucide-react';
import jsPDF from 'jspdf';
import { Link } from 'react-router-dom';

const PrivacyPolicyPage = () => {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    'section-1': true,
  }); 
  const contentRef = useRef<HTMLDivElement | null>(null);
  const pageTitle = 'Privacy Policy';
  const globalCompliance = 'Global Compliance';
  const noDataSelling = 'No Data Selling';


  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    const node = contentRef.current;
    if (!node) return;
    // Generate a clean, text-first PDF to avoid CSS parsing issues (oklch)
    const pdf = new jsPDF({ unit: 'pt', format: 'a4' });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 40;
    let cursorY = margin;

    const addParagraph = (text: string, opts?: { bold?: boolean; size?: number }) => {
      if (!text.trim()) return;
      const size = opts?.size ?? 11;
      pdf.setFont('helvetica', opts?.bold ? 'bold' : 'normal');
      pdf.setFontSize(size);
      const maxWidth = pageWidth - margin * 2;
      const lines = pdf.splitTextToSize(text, maxWidth);
      const neededHeight = lines.length * (size + 3);
      if (cursorY + neededHeight > pageHeight - margin) {
        pdf.addPage();
        cursorY = margin;
      }
      pdf.text(lines, margin, cursorY);
      cursorY += neededHeight + 6;
    };

    // Title
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(18);
    addParagraph(pageTitle, { bold: true, size: 18 });
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    addParagraph(`Last Updated: ${lastUpdated}    Effective Date: ${effectiveDate}`, { size: 10 });

    // Extract visible text content
    const text = node.innerText || '';
    addParagraph(text, { size: 11 });

    pdf.save(`privacy-policy.pdf`);
  };

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  const lastUpdated = "May 15, 2025";
  const effectiveDate = "June 1, 2025";

  const sections = [
    {
      id: 'section-1',
      title: '1. Privacy Overview and Commitment',
      content: (
        <>
          <p className="mb-4">
            {BRAND.name} ("we," "our," or "us") is committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our website, mobile applications, APIs, and any related services (collectively, the "Services").
          </p>
          <p className="mb-4">
            <strong>Our Privacy Philosophy:</strong> We believe in transparency, data minimization, and user control. We collect only the information necessary to provide and improve our Services, and we give you meaningful choices about how your data is used and shared.
          </p>
          <p className="mb-4">
            <strong>Our Commitment to You:</strong> We are committed to:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>Being transparent about our data practices</li>
            <li>Protecting your data with industry-leading security measures</li>
            <li>Giving you control over your information</li>
            <li>Complying with applicable privacy laws and regulations</li>
            <li>Continuously improving our privacy practices</li>
          </ul>
          <p className="mb-4">
            Please read this Privacy Policy carefully. By accessing or using our Services, you acknowledge that you have read, understood, and agree to be bound by this Privacy Policy. If you do not agree with our policies and practices, please do not use our Services.
          </p>
          <div className="bg-blue-50 p-4 rounded-lg mb-4">
            <div className="flex items-start">
              <Shield className="h-5 w-5 text-blue-600 mt-1 mr-3 flex-shrink-0" />
              <div>
                <p className="text-blue-800 font-medium">Privacy Officer Contact Information</p>
                <p className="text-blue-700 text-sm mt-1">
                  If you have any questions about this Privacy Policy or our data practices, please contact our Privacy Officer at privacy@draftandsign.com or call us at (800) 555-0123.
                </p>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-3 mt-6">
            <div className="bg-gray-100 px-3 py-2 rounded-lg text-sm text-gray-700 flex items-center">
              <Check className="h-4 w-4 text-green-600 mr-2" />
              GDPR Compliant
            </div>
            <div className="bg-gray-100 px-3 py-2 rounded-lg text-sm text-gray-700 flex items-center">
              <Check className="h-4 w-4 text-green-600 mr-2" />
              CCPA Compliant
            </div>
            <div className="bg-gray-100 px-3 py-2 rounded-lg text-sm text-gray-700 flex items-center">
              <Check className="h-4 w-4 text-green-600 mr-2" />
              SOC 2 Type II Certified
            </div>
            <div className="bg-gray-100 px-3 py-2 rounded-lg text-sm text-gray-700 flex items-center">
              <Check className="h-4 w-4 text-green-600 mr-2" />
              ISO 27001 Certified
            </div>
          </div>
        </>
      )
    },
    {
      id: 'section-2',
      title: '2. Information We Collect',
      content: (
        <>
          <p className="mb-4">
            We collect several types of information from and about users of our Services:
          </p>
          
          <h4 className="text-lg font-semibold mb-2">Account and Profile Information</h4>
          <p className="mb-4">
            When you create an account or update your profile, we collect:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>Name, email address, phone number, and company details</li>
            <li>Profile pictures, job titles, and department information</li>
            <li>Billing and payment information (credit card details are handled by secure payment processors)</li>
            <li>Account preferences and settings</li>
            <li>Authentication credentials and security questions</li>
          </ul>
          
          <h4 className="text-lg font-semibold mb-2">Document and Content Data</h4>
          <p className="mb-4">
            When you use our Services to process, edit, sign, or manage documents, we collect:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li><strong>E-Signature Documents:</strong> PDFs, contracts, agreements, and forms uploaded for signing</li>
            <li><strong>PDF Processing Files:</strong> Documents uploaded for conversion, editing, compression</li>
            <li><strong>Generated Content:</strong> AI-created documents, templates, form fields</li>
            <li><strong>Metadata:</strong> File names, creation dates, modification history, version information</li>
            <li><strong>Signature Data:</strong> Electronic signatures, initials, timestamps, IP addresses during signing</li>
          </ul>
          
          <h4 className="text-lg font-semibold mb-2">Usage and Technical Information</h4>
          <p className="mb-4">
            We automatically collect certain information about your device and how you interact with our Services:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li><strong>Platform Analytics:</strong> Feature usage, click patterns, session duration, page views</li>
            <li><strong>Device Information:</strong> Browser type, operating system, device identifiers</li>
            <li><strong>Network Data:</strong> IP addresses, location data (country/region level)</li>
            <li><strong>Performance Metrics:</strong> Processing times, error logs, system performance data</li>
            <li><strong>API Usage:</strong> Integration patterns, webhook deliveries, rate limiting data</li>
          </ul>
          
          <h4 className="text-lg font-semibold mb-2">Communication Data</h4>
          <p className="mb-4">
            When you communicate with us or use our communication features:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>Support ticket conversations and attachments</li>
            <li>Email communications and notifications</li>
            <li>Chat logs and customer service interactions</li>
            <li>Survey responses and feedback submissions</li>
            <li>Marketing communication preferences</li>
          </ul>
          
          <div className="bg-yellow-50 p-4 rounded-lg mb-4">
            <div className="flex items-start">
              <AlertCircle className="h-5 w-5 text-yellow-600 mt-1 mr-3 flex-shrink-0" />
              <div>
                <p className="text-yellow-800 font-medium">Important Note About Document Content</p>
                <p className="text-yellow-700 text-sm mt-1">
                  While we have access to the documents you upload or create using our Services, we do not use the content of these documents for any purpose other than providing and improving our Services to you. We do not sell your document content or use it for advertising purposes.
                </p>
              </div>
            </div>
          </div>
        </>
      )
    },
    {
      id: 'section-3',
      title: '3. How We Use Your Information',
      content: (
        <>
          <h4 className="text-lg font-semibold mb-2">Service Delivery and Operations</h4>
          <ul className="list-disc pl-6 mb-4">
            <li><strong>E-Signature Processing:</strong> Routing documents for signature, sending notifications, generating audit trails</li>
            <li><strong>PDF Tool Operations:</strong> Converting, compressing, editing, OCR processing of files</li>
            <li><strong>Document Management:</strong> Storing, sharing, enabling collaboration, version control</li>
            <li><strong>AI Services:</strong> Document generation, field detection, content analysis, template creation</li>
            <li><strong>Account Management:</strong> User authentication, subscription management, billing processing</li>
          </ul>
          
          <h4 className="text-lg font-semibold mb-2">Platform Improvement and Analytics</h4>
          <ul className="list-disc pl-6 mb-4">
            <li><strong>Performance Optimization:</strong> Improving system speed, reducing errors, capacity planning</li>
            <li><strong>Feature Development:</strong> Creating new tools, enhancing user interface, improving workflows</li>
            <li><strong>Usage Analytics:</strong> Understanding popular features, identifying improvement opportunities</li>
            <li><strong>Security Enhancement:</strong> Fraud detection, abuse prevention, vulnerability assessment</li>
            <li><strong>Quality Assurance:</strong> Testing, debugging, and ensuring service reliability</li>
          </ul>
          
          <h4 className="text-lg font-semibold mb-2">Communication and Support</h4>
          <ul className="list-disc pl-6 mb-4">
            <li><strong>Customer Service:</strong> Technical support, account assistance, troubleshooting</li>
            <li><strong>Product Updates:</strong> Feature announcements, security notifications, policy changes</li>
            <li><strong>Marketing Communications:</strong> Newsletters, product promotions, educational content (with consent)</li>
            <li><strong>Surveys and Feedback:</strong> Collecting user opinions and suggestions for improvement</li>
            <li><strong>Relationship Management:</strong> Onboarding, training, and account reviews</li>
          </ul>
          
          <h4 className="text-lg font-semibold mb-2">Legal Compliance and Protection</h4>
          <ul className="list-disc pl-6 mb-4">
            <li><strong>Regulatory Compliance:</strong> Meeting legal obligations, maintaining required records</li>
            <li><strong>Dispute Resolution:</strong> Addressing complaints, resolving user conflicts</li>
            <li><strong>Fraud Prevention:</strong> Detecting and preventing fraudulent activities</li>
            <li><strong>Terms Enforcement:</strong> Ensuring compliance with our Terms of Service</li>
            <li><strong>Legal Proceedings:</strong> Responding to legal requests, establishing legal claims</li>
          </ul>
          
          <div className="bg-blue-50 p-4 rounded-lg mb-4">
            <div className="flex items-start">
              <Shield className="h-5 w-5 text-blue-600 mt-1 mr-3 flex-shrink-0" />
              <div>
                <p className="text-blue-800 font-medium">Legal Basis for Processing (GDPR)</p>
                <p className="text-blue-700 text-sm mt-1">
                  For users in the European Economic Area, United Kingdom, or Switzerland, we process your personal data based on the following legal grounds:
                </p>
                <ul className="list-disc pl-6 mt-2 text-sm text-blue-700">
                  <li><strong>Contract Performance:</strong> Processing necessary to provide our Services and fulfill our contractual obligations to you</li>
                  <li><strong>Legitimate Interests:</strong> Processing that serves our legitimate business interests while respecting your rights and freedoms</li>
                  <li><strong>Legal Obligations:</strong> Processing required to comply with applicable laws and regulations</li>
                  <li><strong>Consent:</strong> Processing based on your specific consent, which you can withdraw at any time</li>
                </ul>
              </div>
            </div>
          </div>
        </>
      )
    },
    {
      id: 'section-4',
      title: '4. Data Sharing and Disclosure',
      content: (
        <>
          <p className="mb-4">
            We may share your information in the following circumstances:
          </p>
          
          <h4 className="text-lg font-semibold mb-2">Service Providers and Processors</h4>
          <p className="mb-4">
            We share information with third-party vendors and service providers who perform services on our behalf:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li><strong>Cloud Infrastructure:</strong> AWS, Google Cloud, Microsoft Azure for hosting and storage</li>
            <li><strong>Payment Processing:</strong> Stripe, PayPal for billing and subscription management</li>
            <li><strong>Email Services:</strong> SendGrid, Mailchimp for transactional and marketing emails</li>
            <li><strong>Analytics Providers:</strong> Google Analytics, Mixpanel for usage insights</li>
            <li><strong>Security Services:</strong> Cloudflare for DDoS protection, security scanning tools</li>
          </ul>
          <p className="mb-4">
            These service providers are contractually obligated to use your information only as directed by us and in accordance with this Privacy Policy.
          </p>
          
          <h4 className="text-lg font-semibold mb-2">Business Transfers and Corporate Events</h4>
          <p className="mb-4">
            We may share information in connection with:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>Merger, acquisition, or sale of business assets</li>
            <li>Bankruptcy or insolvency proceedings</li>
            <li>Corporate restructuring or reorganization</li>
            <li>Due diligence processes with appropriate safeguards</li>
          </ul>
          <p className="mb-4">
            If your personal information will be subject to a different privacy policy as a result of such events, we will notify you.
          </p>
          
          <h4 className="text-lg font-semibold mb-2">Legal and Regulatory Requirements</h4>
          <p className="mb-4">
            We may disclose your information when required by law:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li><strong>Law Enforcement:</strong> Valid subpoenas, court orders, search warrants</li>
            <li><strong>Regulatory Compliance:</strong> Tax authorities, financial regulators, data protection authorities</li>
            <li><strong>Legal Proceedings:</strong> Litigation support, dispute resolution, arbitration</li>
            <li><strong>Emergency Situations:</strong> Threats to safety, security breaches, fraud prevention</li>
          </ul>
          <p className="mb-4">
            We evaluate each request for information to ensure it complies with applicable laws before disclosing any data.
          </p>
          
          <h4 className="text-lg font-semibold mb-2">User-Directed Sharing</h4>
          <p className="mb-4">
            We share information when you direct us to do so:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li><strong>Document Sharing:</strong> Sending documents to specified recipients for signing/review</li>
            <li><strong>Team Collaboration:</strong> Sharing within organization accounts and workspaces</li>
            <li><strong>Integration Partners:</strong> Third-party apps connected via API with your consent</li>
            <li><strong>Public Features:</strong> Publicly shared templates or documents (with explicit user choice)</li>
          </ul>
          
          <div className="bg-green-50 p-4 rounded-lg mb-4">
            <div className="flex items-start">
              <Check className="h-5 w-5 text-green-600 mt-1 mr-3 flex-shrink-0" />
              <div>
                <p className="text-green-800 font-medium">We Do Not Sell Your Personal Information</p>
                <p className="text-green-700 text-sm mt-1">
                  {BRAND.name} does not sell, rent, or trade your personal information to third parties for their marketing purposes. We only share your information as described in this Privacy Policy.
                </p>
              </div>
            </div>
          </div>
        </>
      )
    },
    {
      id: 'section-5',
      title: '5. Data Retention and Deletion',
      content: (
        <>
          <h4 className="text-lg font-semibold mb-2">Retention Periods by Data Type</h4>
          <p className="mb-4">
            We retain different types of data for different periods of time based on business needs and legal requirements:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li><strong>Account Data:</strong> Retained while your account is active + 7 years for legal compliance</li>
            <li><strong>Document Content:</strong> User-controlled deletion + 30-day recovery period</li>
            <li><strong>Processing Files:</strong> Automatically deleted within 24-48 hours after processing</li>
            <li><strong>Audit Trails:</strong> 7 years for legal and compliance requirements</li>
            <li><strong>Usage Analytics:</strong> Aggregated data retained indefinitely, personal identifiers removed after 2 years</li>
            <li><strong>Support Communications:</strong> 3 years for quality assurance and training</li>
          </ul>
          
          <h4 className="text-lg font-semibold mb-2">Deletion Procedures</h4>
          <p className="mb-4">
            We have established procedures for deleting your data:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li><strong>User-Initiated Deletion:</strong> Immediate removal from active systems, 30-day backup retention</li>
            <li><strong>Account Closure:</strong> Complete data deletion within 90 days (except legal retention requirements)</li>
            <li><strong>Automated Cleanup:</strong> Regular purging of temporary files and expired data</li>
            <li><strong>Secure Deletion:</strong> Cryptographic erasure and multi-pass overwriting for sensitive data</li>
          </ul>
          
          <h4 className="text-lg font-semibold mb-2">Legal and Business Retention</h4>
          <p className="mb-4">
            Certain information may be retained longer due to:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li><strong>Compliance Requirements:</strong> Tax records, audit trails, regulatory reporting data</li>
            <li><strong>Litigation Holds:</strong> Suspension of deletion during legal proceedings</li>
            <li><strong>Business Records:</strong> Financial transactions, contract performance data</li>
            <li><strong>Security Logs:</strong> Incident response, fraud investigation, abuse prevention</li>
          </ul>
          
          <h4 className="text-lg font-semibold mb-2">Data Deletion Requests</h4>
          <p className="mb-4">
            You can request deletion of your personal data at any time:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>Through your account settings</li>
            <li>By contacting our support team</li>
            <li>By emailing privacy@draftandsign.com</li>
          </ul>
          <p className="mb-4">
            We will process your request within the timeframe required by applicable law (typically 30 days), subject to legal retention requirements.
          </p>
          
          <div className="bg-blue-50 p-4 rounded-lg mb-4">
            <div className="flex items-start">
              <Database className="h-5 w-5 text-blue-600 mt-1 mr-3 flex-shrink-0" />
              <div>
                <p className="text-blue-800 font-medium">Free User Data Retention</p>
                <p className="text-blue-700 text-sm mt-1">
                  For free users, files uploaded for processing are automatically deleted after 1 hour. This helps protect your privacy while still providing sufficient time to complete your tasks.
                </p>
              </div>
            </div>
          </div>
        </>
      )
    },
    {
      id: 'section-6',
      title: '6. International Data Transfers',
      content: (
        <>
          <h4 className="text-lg font-semibold mb-2">Transfer Mechanisms</h4>
          <p className="mb-4">
            {BRAND.name} is based in the United States and processes data on servers located in various countries. When we transfer personal data from the European Economic Area (EEA), United Kingdom, or Switzerland to countries without an adequacy decision, we use these legal mechanisms:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li><strong>Adequacy Decisions:</strong> Transfers to countries with adequate protection (EU Commission approved)</li>
            <li><strong>Standard Contractual Clauses:</strong> EU-approved contracts for international transfers</li>
            <li><strong>Binding Corporate Rules:</strong> Internal data transfer frameworks for multinational processing</li>
            <li><strong>Certification Programs:</strong> Privacy Shield successors, ISO certifications, industry standards</li>
          </ul>
          
          <h4 className="text-lg font-semibold mb-2">Geographic Data Processing</h4>
          <p className="mb-4">
            We process and store data in these locations:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li><strong>Primary Data Centers:</strong> US (AWS/Google Cloud), EU (for European users), Asia-Pacific</li>
            <li><strong>Backup Locations:</strong> Geographically distributed for disaster recovery</li>
            <li><strong>Processing Locations:</strong> Where data may be accessed for support, development, security</li>
            <li><strong>User Control:</strong> Options for data residency preferences (enterprise plans)</li>
          </ul>
          
          <h4 className="text-lg font-semibold mb-2">Safeguards and Protections</h4>
          <p className="mb-4">
            We implement these safeguards for international transfers:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li><strong>Encryption in Transit:</strong> TLS 1.3 for all data transfers</li>
            <li><strong>Encryption at Rest:</strong> AES-256 encryption for stored data</li>
            <li><strong>Access Controls:</strong> Role-based access, multi-factor authentication, audit logging</li>
            <li><strong>Contractual Protections:</strong> Data processing agreements with all international processors</li>
          </ul>
          
          <h4 className="text-lg font-semibold mb-2">Data Residency Options</h4>
          <p className="mb-4">
            For customers with specific data residency requirements:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>EU data residency option for European customers</li>
            <li>Regional storage options in select locations</li>
            <li>Enterprise-level data localization solutions</li>
          </ul>
          
          <div className="bg-yellow-50 p-4 rounded-lg mb-4">
            <div className="flex items-start">
              <Globe className="h-5 w-5 text-yellow-600 mt-1 mr-3 flex-shrink-0" />
              <div>
                <p className="text-yellow-800 font-medium">International Transfer Notice</p>
                <p className="text-yellow-700 text-sm mt-1">
                  By using our Services, you acknowledge that your personal information may be transferred to and processed in the United States and other countries which may have different data protection rules than those of your country. We ensure appropriate safeguards are in place to protect your information during these transfers.
                </p>
              </div>
            </div>
          </div>
        </>
      )
    },
    {
      id: 'section-7',
      title: '7. Security Measures and Protections',
      content: (
        <>
          <h4 className="text-lg font-semibold mb-2">Technical Safeguards</h4>
          <p className="mb-4">
            We implement robust technical measures to protect your data:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li><strong>Encryption:</strong> AES-256 at rest, TLS 1.3 in transit, end-to-end for sensitive operations</li>
            <li><strong>Access Controls:</strong> Multi-factor authentication, role-based permissions, principle of least privilege</li>
            <li><strong>Network Security:</strong> Firewalls, intrusion detection, DDoS protection, VPN access</li>
            <li><strong>Application Security:</strong> Regular penetration testing, vulnerability scanning, secure coding practices</li>
            <li><strong>Data Isolation:</strong> Tenant separation, containerization, secure development practices</li>
          </ul>
          
          <h4 className="text-lg font-semibold mb-2">Organizational Safeguards</h4>
          <p className="mb-4">
            Our security extends to our organizational practices:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li><strong>Employee Training:</strong> Privacy and security awareness, incident response procedures</li>
            <li><strong>Background Checks:</strong> Security clearance for personnel with data access</li>
            <li><strong>Confidentiality Agreements:</strong> Legal obligations for all staff and contractors</li>
            <li><strong>Incident Response:</strong> 24/7 monitoring, rapid response team, breach notification procedures</li>
            <li><strong>Physical Security:</strong> Secure facilities, access controls, environmental protections</li>
          </ul>
          
          <h4 className="text-lg font-semibold mb-2">Compliance and Auditing</h4>
          <p className="mb-4">
            We maintain rigorous compliance programs:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li><strong>Third-Party Audits:</strong> SOC 2 Type II, ISO 27001, penetration testing reports</li>
            <li><strong>Compliance Monitoring:</strong> Regular assessments, policy updates, training verification</li>
            <li><strong>Vendor Management:</strong> Security assessments for all service providers</li>
            <li><strong>Continuous Improvement:</strong> Regular security reviews, threat modeling, risk assessments</li>
            <li><strong>Regulatory Alignment:</strong> GDPR, CCPA, HIPAA, and other applicable frameworks</li>
          </ul>
          
          <h4 className="text-lg font-semibold mb-2">Breach Response</h4>
          <p className="mb-4">
            In the unlikely event of a data breach:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>We will notify affected users promptly in accordance with applicable laws</li>
            <li>We will provide clear information about what happened and what data was affected</li>
            <li>We will take immediate steps to contain and remediate the breach</li>
            <li>We will work with authorities and security experts as appropriate</li>
          </ul>
          
          <div className="bg-green-50 p-4 rounded-lg mb-4">
            <div className="flex items-start">
              <Lock className="h-5 w-5 text-green-600 mt-1 mr-3 flex-shrink-0" />
              <div>
                <p className="text-green-800 font-medium">Your Role in Security</p>
                <p className="text-green-700 text-sm mt-1">
                  While we implement robust security measures, you also play an important role in keeping your account secure. Please use strong, unique passwords, enable two-factor authentication when available, and be vigilant about phishing attempts and unauthorized access to your devices.
                </p>
              </div>
            </div>
          </div>
        </>
      )
    },
    {
      id: 'section-8',
      title: '8. User Rights and Controls',
      content: (
        <>
          <h4 className="text-lg font-semibold mb-2">GDPR Rights (for EU users)</h4>
          <p className="mb-4">
            If you are in the European Economic Area, United Kingdom, or Switzerland, you have these rights:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li><strong>Right of Access:</strong> Download personal data, view processing activities</li>
            <li><strong>Right to Rectification:</strong> Correct inaccurate or incomplete information</li>
            <li><strong>Right to Erasure:</strong> Delete personal data (with legal limitations)</li>
            <li><strong>Right to Restrict Processing:</strong> Limit how data is used</li>
            <li><strong>Right to Data Portability:</strong> Export data in machine-readable format</li>
            <li><strong>Right to Object:</strong> Opt-out of certain processing activities</li>
            <li><strong>Rights Related to Automated Decision-Making:</strong> Human review of AI decisions</li>
          </ul>
          
          <h4 className="text-lg font-semibold mb-2">CCPA Rights (for California users)</h4>
          <p className="mb-4">
            If you are a California resident, you have these rights under the California Consumer Privacy Act:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li><strong>Right to Know:</strong> Categories and specific pieces of personal information collected</li>
            <li><strong>Right to Delete:</strong> Request deletion of personal information</li>
            <li><strong>Right to Opt-Out:</strong> Sale of personal information (we don't sell data)</li>
            <li><strong>Right to Non-Discrimination:</strong> Equal service regardless of privacy choices</li>
          </ul>
          
          <h4 className="text-lg font-semibold mb-2">Universal User Controls</h4>
          <p className="mb-4">
            All users have access to these privacy controls:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li><strong>Account Settings:</strong> Privacy preferences, communication settings, data sharing controls</li>
            <li><strong>Document Management:</strong> Delete, download, share controls for uploaded content</li>
            <li><strong>Marketing Preferences:</strong> Opt-in/opt-out for promotional communications</li>
            <li><strong>Cookie Controls:</strong> Granular consent for different cookie categories</li>
          </ul>
          
          <h4 className="text-lg font-semibold mb-2">How to Exercise Rights</h4>
          <p className="mb-4">
            You can exercise your privacy rights through:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li><strong>Self-Service Portal:</strong> Account dashboard for common requests</li>
            <li><strong>Privacy Request Form:</strong> Dedicated form for formal requests</li>
            <li><strong>Email Contact:</strong> Direct communication with privacy team at privacy@draftandsign.com</li>
            <li><strong>Phone Support:</strong> Call (800) 555-0123 for assistance</li>
          </ul>
          <p className="mb-4">
            We will respond to your request within the timeframe required by applicable law (typically 30 days for GDPR, 45 days for CCPA). We may need to verify your identity before processing your request.
          </p>
          
          <div className="bg-purple-50 p-4 rounded-lg mb-4">
            <div className="flex items-start">
              <Shield className="h-5 w-5 text-purple-600 mt-1 mr-3 flex-shrink-0" />
              <div>
                <p className="text-purple-800 font-medium">Limitations on Rights Requests</p>
                <p className="text-purple-700 text-sm mt-1">
                  In some cases, we may be unable to fulfill certain requests due to legal obligations, security requirements, or technical limitations. If we cannot fully comply with your request, we will explain the reasons and provide alternative options where possible.
                </p>
              </div>
            </div>
          </div>
        </>
      )
    },
    {
      id: 'section-9',
      title: '9. Cookies and Tracking Technologies',
      content: (
        <>
          <h4 className="text-lg font-semibold mb-2">Types of Cookies Used</h4>
          <p className="mb-4">
            We use these types of cookies and similar technologies:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li><strong>Essential Cookies:</strong> Authentication, security, basic functionality (no consent required)</li>
            <li><strong>Performance Cookies:</strong> Analytics, error tracking, performance monitoring</li>
            <li><strong>Functional Cookies:</strong> User preferences, language settings, feature customization</li>
            <li><strong>Marketing Cookies:</strong> Advertising, retargeting, campaign measurement (consent required)</li>
          </ul>
          
          <h4 className="text-lg font-semibold mb-2">Third-Party Technologies</h4>
          <p className="mb-4">
            We work with these third-party services that may use cookies or similar technologies:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li><strong>Analytics:</strong> Google Analytics, Mixpanel, Hotjar for usage insights</li>
            <li><strong>Advertising:</strong> Google Ads, Facebook Pixel for marketing campaigns</li>
            <li><strong>Support Tools:</strong> Intercom, Zendesk for customer service</li>
            <li><strong>Security:</strong> Cloudflare, reCAPTCHA for protection and verification</li>
          </ul>
          
          <h4 className="text-lg font-semibold mb-2">Cookie Management</h4>
          <p className="mb-4">
            You can manage cookies in several ways:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li><strong>Consent Banner:</strong> Granular choices for different cookie categories</li>
            <li><strong>Cookie Settings:</strong> Ongoing control through account preferences</li>
            <li><strong>Browser Settings:</strong> Most web browsers allow you to control cookies through their settings. Please note that if you disable cookies, some features of our Services may not function properly.</li>
            <li><strong>Opt-Out Links:</strong> Many third-party advertising networks offer opt-out mechanisms. For example, you can opt out of Google Analytics by installing the <a href="https://tools.google.com/dlpage/gaoptout" className="text-primary-600 hover:text-primary-700">Google Analytics Opt-out Browser Add-on</a>.</li>
          </ul>
          
          <h4 className="text-lg font-semibold mb-2">Do Not Track</h4>
          <p className="mb-4">
            Some browsers have a "Do Not Track" feature that signals to websites that you visit that you do not want to have your online activity tracked. Due to the lack of a common interpretation of Do Not Track signals across the industry, we currently do not respond to Do Not Track signals.
          </p>
          
          <div className="bg-blue-50 p-4 rounded-lg mb-4">
            <div className="flex items-start">
              <Shield className="h-5 w-5 text-blue-600 mt-1 mr-3 flex-shrink-0" />
              <div>
                <p className="text-blue-800 font-medium">Cookie Policy</p>
                <p className="text-blue-700 text-sm mt-1">
                  For more detailed information about our use of cookies and tracking technologies, please see our <Link to="/cookie-policy" className="text-blue-600 hover:text-blue-800 underline">Cookie Policy</Link>.
                </p>
              </div>
            </div>
          </div>
        </>
      )
    },
    {
      id: 'section-10',
      title: '10. Children\'s Privacy',
      content: (
        <>
          <h4 className="text-lg font-semibold mb-2">Age Restrictions</h4>
          <p className="mb-4">
            Our Services are not intended for users under 16 years of age (or 13 in the United States). We do not knowingly collect personal information from children. If we discover that we have collected personal information from a child without parental consent, we will promptly delete that information.
          </p>
          
          <h4 className="text-lg font-semibold mb-2">Parental Consent</h4>
          <p className="mb-4">
            In limited circumstances where younger users may access our Services in business or educational contexts, we require verifiable parental consent and implement additional protections, including:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>Parental notification and consent mechanisms</li>
            <li>Limited data collection from minors</li>
            <li>Restricted feature access</li>
            <li>Enhanced security and privacy controls</li>
          </ul>
          
          <h4 className="text-lg font-semibold mb-2">Data Minimization for Minors</h4>
          <p className="mb-4">
            In cases where we may process data related to minors (such as in educational contexts), we apply strict data minimization principles:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>Collecting only essential information</li>
            <li>Limiting data retention periods</li>
            <li>Restricting data sharing</li>
            <li>Implementing heightened security measures</li>
          </ul>
          
          <h4 className="text-lg font-semibold mb-2">Verification Procedures</h4>
          <p className="mb-4">
            We implement age verification during account creation to prevent minors from creating accounts without appropriate authorization. Our verification methods are designed to be reasonably calculated to ensure that the person providing consent is the child's parent or guardian.
          </p>
          
          <h4 className="text-lg font-semibold mb-2">Deletion Procedures</h4>
          <p className="mb-4">
            If we discover that we have inadvertently collected information from a minor without proper consent:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>We will immediately stop processing the data</li>
            <li>We will delete the information from our active systems</li>
            <li>We will ensure the data is removed from backups during the next backup cycle</li>
            <li>We will document the incident and take steps to prevent recurrence</li>
          </ul>
          
          <div className="bg-yellow-50 p-4 rounded-lg mb-4">
            <div className="flex items-start">
              <AlertCircle className="h-5 w-5 text-yellow-600 mt-1 mr-3 flex-shrink-0" />
              <div>
                <p className="text-yellow-800 font-medium">Notice to Parents</p>
                <p className="text-yellow-700 text-sm mt-1">
                  If you believe your child has provided us with personal information without your consent, please contact us at privacy@draftandsign.com, and we will take prompt action to remove the information.
                </p>
              </div>
            </div>
          </div>
        </>
      )
    },
    {
      id: 'section-11',
      title: '11. Policy Updates and Notifications',
      content: (
        <>
          <h4 className="text-lg font-semibold mb-2">Update Procedures</h4>
          <p className="mb-4">
            We may update this Privacy Policy periodically to reflect changes in our practices, technologies, legal requirements, or other factors. When we update the policy:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>We review changes with our privacy and legal teams</li>
            <li>We update the "Last Updated" date at the top of the policy</li>
            <li>We publish the revised policy on our website</li>
            <li>We implement any necessary operational changes to align with the updated policy</li>
          </ul>
          
          <h4 className="text-lg font-semibold mb-2">Notification Methods</h4>
          <p className="mb-4">
            We notify users about privacy policy changes through:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>Email notifications for significant changes</li>
            <li>In-app notifications and banners</li>
            <li>Notices on our website homepage or login page</li>
            <li>Account dashboard alerts</li>
          </ul>
          
          <h4 className="text-lg font-semibold mb-2">Material Changes</h4>
          <p className="mb-4">
            For material changes that significantly affect your rights or our use of your information:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>We provide at least 30 days' notice before the changes take effect</li>
            <li>We explain the changes in clear, plain language</li>
            <li>We obtain your consent where required by applicable law</li>
            <li>We provide options to adjust your privacy settings or withdraw consent</li>
          </ul>
          
          <h4 className="text-lg font-semibold mb-2">Version History</h4>
          <p className="mb-4">
            We maintain an archive of previous privacy policy versions:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>All previous versions are retained for reference</li>
            <li>A summary of significant changes between versions is available</li>
            <li>You can request access to previous versions by contacting privacy@draftandsign.com</li>
          </ul>
          
          <h4 className="text-lg font-semibold mb-2">Effective Dates</h4>
          <p className="mb-4">
            Each version of the Privacy Policy includes:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>The date the policy was last updated</li>
            <li>The effective date when changes take effect</li>
            <li>Clear indication of which version is currently in force</li>
          </ul>
          
          <div className="bg-blue-50 p-4 rounded-lg mb-4">
            <div className="flex items-start">
              <Shield className="h-5 w-5 text-blue-600 mt-1 mr-3 flex-shrink-0" />
              <div>
                <p className="text-blue-800 font-medium">Continued Use After Updates</p>
                <p className="text-blue-700 text-sm mt-1">
                  Your continued use of our Services after we publish or notify you of changes to this Privacy Policy means that you acknowledge and agree to the updated Privacy Policy. If you do not agree to the updated terms, you should discontinue using our Services.
                </p>
              </div>
            </div>
          </div>
        </>
      )
    },
    {
      id: 'section-12',
      title: '12. Contact Information',
      content: (
        <>
          <p className="mb-4">
            If you have any questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us:
          </p>
          
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <h4 className="font-semibold mb-2">Privacy Team</h4>
            <p className="mb-1"><strong>Email:</strong> privacy@draftandsign.com</p>
            <p className="mb-1"><strong>Address:</strong> 123 Legal Avenue, Suite 400, San Francisco, CA 94103</p>
            <p><strong>Phone:</strong> (800) 555-0123</p>
          </div>
          
          <h4 className="text-lg font-semibold mb-2">Data Protection Officer</h4>
          <p className="mb-4">
            For users in the European Economic Area, United Kingdom, or Switzerland, you may also contact our Data Protection Officer:
          </p>
          <div className="bg-gray-50 p-4 rounded-lg mb-4">
            <p className="mb-1"><strong>Email:</strong> dpo@draftandsign.com</p>
            <p><strong>Address:</strong> 123 Legal Avenue, Suite 400, San Francisco, CA 94103</p>
          </div>
          
          <h4 className="text-lg font-semibold mb-2">EU Representative</h4>
          <p className="mb-4">
            For users in the European Union, our EU representative pursuant to Article 27 of the GDPR is:
          </p>
          <div className="bg-gray-50 p-4 rounded-lg mb-4">
            <p className="mb-1"><strong>Name:</strong> {BRAND.name} EU Representative</p>
            <p className="mb-1"><strong>Email:</strong> eu-representative@draftandsign.com</p>
            <p><strong>Address:</strong> 1 Dublin Square, Dublin, Ireland</p>
          </div>
          
          <h4 className="text-lg font-semibold mb-2">UK Representative</h4>
          <p className="mb-4">
            For users in the United Kingdom, our UK representative pursuant to the UK GDPR is:
          </p>
          <div className="bg-gray-50 p-4 rounded-lg mb-4">
            <p className="mb-1"><strong>Name:</strong> {BRAND.name} UK Representative</p>
            <p className="mb-1"><strong>Email:</strong> uk-representative@draftandsign.com</p>
            <p><strong>Address:</strong> 1 London Bridge, London, UK</p>
          </div>
          
          <h4 className="text-lg font-semibold mb-2">Supervisory Authority</h4>
          <p className="mb-4">
            If you are located in the European Economic Area or United Kingdom and believe we are processing your personal data in violation of applicable law, you have the right to file a complaint with your local supervisory authority.
          </p>
          
          <div className="bg-green-50 p-4 rounded-lg mb-4">
            <div className="flex items-start">
              <Check className="h-5 w-5 text-green-600 mt-1 mr-3 flex-shrink-0" />
              <div>
                <p className="text-green-800 font-medium">Response Commitment</p>
                <p className="text-green-700 text-sm mt-1">
                  We are committed to addressing your privacy concerns. We will respond to all legitimate inquiries within 30 days, and often much sooner. Your privacy matters to us, and we are here to help.
                </p>
              </div>
            </div>
          </div>
        </>
      )
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 mt-8 pt-24 pb-16">
      <div className="container-max">
        {/* Header Section */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
              <div className="text-xs text-gray-600">
                <p>Last Updated: {lastUpdated}</p>
                <p>Effective Date: {effectiveDate}</p>
              </div>
            </div>
            <div className="flex gap-4 mt-4 md:mt-0">
              <button onClick={handleDownloadPdf} className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 transition-colors">
                <Download className="h-4 w-4" />
                <span>Download PDF</span>
              </button>
              <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 transition-colors">
                <Printer className="h-4 w-4" />
                <span>Print</span>
              </button>
            </div>
          </div>

          {/* Privacy Highlights Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-6">
            <h2 className="text-xl font-bold text-blue-800 mb-4">Privacy Policy Highlights</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <div className="bg-blue-100 p-2 rounded-full">
                  <Shield className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-blue-800">Data Protection</h3>
                  <p className="text-sm text-blue-700">We use industry-leading security measures including 256-bit encryption to protect your data.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="bg-blue-100 p-2 rounded-full">
                  <Database className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-blue-800">Data Minimization</h3>
                  <p className="text-sm text-blue-700">We only collect information necessary to provide our services and automatically delete processing files after 1 hour.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="bg-blue-100 p-2 rounded-full">
                  <Globe className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-blue-800">{globalCompliance}</h3>
                  <p className="text-sm text-blue-700">Our privacy practices comply with GDPR, CCPA, and other global privacy regulations.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="bg-blue-100 p-2 rounded-full">
                  <Lock className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-blue-800">{noDataSelling}</h3>
                  <p className="text-sm text-blue-700">We never sell your personal information or document content to third parties.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Language selector removed */}

          {/* Quick Navigation */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Quick Navigation</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {sections.map((section) => (
                <a 
                  key={section.id}
                  href={`#${section.id}`}
                  className="text-primary-600 hover:text-primary-700 hover:underline text-sm py-1"
                >
                  {section.title}
                </a>
              ))}
            </div>
          </div>

          {/* Introduction */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4 bg-blue-50 p-4 rounded-lg">
              <Shield className="h-6 w-6 text-blue-600 flex-shrink-0" />
              <p className="text-blue-800">
                This Privacy Policy explains how {BRAND.name} collects, uses, and protects your personal information when you use our e-signature, PDF tools, document management, and related services.
              </p>
            </div>
          </div>

          {/* Main Content Sections */}
          <div ref={contentRef} className="space-y-6">
            {sections.map((section) => (
              <div key={section.id} id={section.id} className="border border-gray-200 rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleSection(section.id)}
                  className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
                >
                  <h2 className="text-xl font-semibold text-gray-900">{section.title}</h2>
                  {expandedSections[section.id] ? (
                    <ChevronUp className="h-5 w-5 text-gray-500" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-gray-500" />
                  )}
                </button>
                {expandedSections[section.id] && (
                  <div className="p-6 bg-white">
                    {section.content}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Data Security Notice */}
          <div className="mt-8 bg-green-50 border border-green-200 rounded-lg p-6">
            <div className="flex items-start gap-3">
              <Lock className="h-6 w-6 text-green-600 mt-1 flex-shrink-0" />
              <div>
                <h3 className="text-lg font-semibold text-green-800 mb-2">Our Commitment to Data Security</h3>
                <p className="text-green-700">
                  {BRAND.name} employs industry-standard security measures to protect your personal information, including 256-bit encryption, secure data centers, and strict access controls. We regularly review and update our security practices to maintain the highest standards of data protection.
                </p>
              </div>
            </div>
          </div>

          {/* Data Processing Notice */}
          <div className="mt-6 bg-purple-50 border border-purple-200 rounded-lg p-6">
            <div className="flex items-start gap-3">
              <Database className="h-6 w-6 text-purple-600 mt-1 flex-shrink-0" />
              <div>
                <h3 className="text-lg font-semibold text-purple-800 mb-2">Data Processing Information</h3>
                <p className="text-purple-700">
                  For free users, files uploaded for processing are automatically deleted after 1 hour. Paid accounts may have different retention periods as specified in their service tier. You can manually delete your files at any time through your account settings.
                </p>
              </div>
            </div>
          </div>

          {/* International Users Notice */}
          <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <div className="flex items-start gap-3">
              <Globe className="h-6 w-6 text-yellow-600 mt-1 flex-shrink-0" />
              <div>
                <h3 className="text-lg font-semibold text-yellow-800 mb-2">Notice to International Users</h3>
                <p className="text-yellow-700">
                  {BRAND.name} is based in the United States. If you are accessing our Services from outside the United States, please be aware that your information may be transferred to, stored, and processed in the United States and other countries. We implement appropriate safeguards for international data transfers as described in this Privacy Policy.
                </p>
              </div>
            </div>
          </div>

          {/* Consent Notice */}
          <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-6 w-6 text-red-600 mt-1 flex-shrink-0" />
              <div>
                <h3 className="text-lg font-semibold text-red-800 mb-2">Your Consent</h3>
                <p className="text-red-700">
                  By using {BRAND.name} services, you consent to the collection, use, and sharing of your information as described in this Privacy Policy. If you do not agree with our policies and practices, please do not use our services.
                </p>
              </div>
            </div>
          </div>

          {/* Related Policies */}
          <div className="mt-8 p-6 border border-gray-200 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Related Policies</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <Link to="/terms-of-service" className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <FileText className="h-5 w-5 text-primary-600" />
                <div>
                  <h4 className="font-medium text-gray-900">Terms of Service</h4>
                  <p className="text-sm text-gray-600">Legal terms governing use of our services</p>
                </div>
              </Link>
              <Link to="/cookie-policy" className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <FileText className="h-5 w-5 text-primary-600" />
                <div>
                  <h4 className="font-medium text-gray-900">Cookie Policy</h4>
                  <p className="text-sm text-gray-600">Detailed information about our use of cookies</p>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicyPage;