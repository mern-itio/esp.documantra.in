import { useState } from 'react';
import { Download, Printer, ChevronDown, ChevronUp, Shield, Scale, FileText, Globe, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

const TermsOfServicePage = () => {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    'section-1': true,
  });

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
      title: '1. Acceptance and Scope',
      content: (
        <>
          <p className="mb-4">
            By accessing or using DocuSigner's website, mobile applications, APIs, or any other services provided by DocuSigner (collectively, the "Services"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our Services.
          </p>
          <p className="mb-4">
            These Terms of Service apply to all services offered by DocuSigner, including but not limited to e-signature services, PDF tools, document management features, legal templates, and API access. These terms constitute a legally binding agreement between you and DocuSigner regarding your use of the Services.
          </p>
          <p className="mb-4">
            <strong>Age Restrictions:</strong> You must be at least 18 years of age or the age of legal majority in your jurisdiction to use the Services. If you are using the Services on behalf of an organization, you represent and warrant that you have the authority to bind that organization to these Terms of Service.
          </p>
          <p className="mb-4">
            <strong>Geographic Limitations:</strong> The Services are designed to be used by residents of the United States, Canada, the European Union, the United Kingdom, Australia, and other countries where electronic signatures are legally recognized. Additional jurisdiction-specific terms may apply based on your location.
          </p>
          <p className="mb-4">
            <strong>Modifications to Terms:</strong> We may modify these Terms of Service at any time. We will provide notice of material changes by posting the updated terms on our website and updating the "Last Updated" date. Your continued use of the Services after such modifications constitutes your acceptance of the revised terms. We recommend reviewing these terms periodically.
          </p>
        </>
      )
    },
    {
      id: 'section-2',
      title: '2. Service Definitions',
      content: (
        <>
          <p className="mb-4">
            <strong>E-Signature Services:</strong> Our e-signature services allow you to electronically sign documents, send documents for signature, authenticate signers, generate audit trails, and create signature certificates. These services facilitate the execution of agreements in electronic form.
          </p>
          <p className="mb-4">
            <strong>PDF Tools:</strong> Our PDF tools include conversion (to and from various formats), compression, merging, splitting, editing, OCR (Optical Character Recognition), form creation, and security features such as encryption and redaction. These tools allow you to manipulate and manage PDF documents.
          </p>
          <p className="mb-4">
            <strong>Document Management:</strong> Our document management services include storage, sharing, collaboration, version control, and template management. These services help you organize, track, and maintain your documents.
          </p>
          <p className="mb-4">
            <strong>API Services:</strong> Our API services allow developers to integrate DocuSigner functionality into their own applications, including webhook functionality and developer tools. These services enable programmatic access to DocuSigner features.
          </p>
          <p className="mb-4">
            <strong>AI Features:</strong> Our AI-powered features include document generation, field detection, content analysis, and other machine learning capabilities. These features automate and enhance document workflows.
          </p>
          <p className="mb-4">
            <strong>Free and Paid Services:</strong> Some of our Services are available for free, while others require payment. Features available in each service tier are described on our pricing page. We reserve the right to modify, add, or remove features from any tier at any time.
          </p>
        </>
      )
    },
    {
      id: 'section-3',
      title: '3. User Responsibilities and Obligations',
      content: (
        <>
          <p className="mb-4">
            <strong>Account Security:</strong> You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You must use strong passwords, protect your account from unauthorized access, and notify us immediately of any security breach. Sharing accounts is prohibited.
          </p>
          <p className="mb-4">
            <strong>Content Responsibility:</strong> You retain ownership of all documents and content you upload to the Services. However, you are solely responsible for the content of those documents, including their legality, reliability, and appropriateness. You represent and warrant that your content does not violate any third-party rights, including intellectual property rights and privacy rights.
          </p>
          <p className="mb-4">
            <strong>Prohibited Content:</strong> You may not upload, transmit, or share content that:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>Is illegal, harmful, threatening, abusive, harassing, defamatory, or invasive of privacy</li>
            <li>Infringes any patent, trademark, trade secret, copyright, or other intellectual property rights</li>
            <li>Contains software viruses or any other code designed to interrupt, destroy, or limit functionality</li>
            <li>Constitutes unsolicited commercial communications or "spam"</li>
            <li>Impersonates any person or entity or misrepresents your affiliation with a person or entity</li>
          </ul>
          <p className="mb-4">
            <strong>Lawful Use:</strong> You agree to use the Services only for lawful purposes and in compliance with all applicable local, state, national, and international laws. You may not use the Services for fraudulent activities, to circumvent legal requirements, or to violate third-party rights.
          </p>
          <p className="mb-4">
            <strong>Data Accuracy:</strong> You are responsible for ensuring the accuracy of all information provided through the Services, including signer information, document content, and metadata. Inaccurate information may affect the validity of your documents and signatures.
          </p>
          <p className="mb-4">
            <strong>System Integrity:</strong> You agree not to:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>Reverse engineer, decompile, or disassemble any portion of the Services</li>
            <li>Use automated scripts, bots, or other means to access or scrape the Services</li>
            <li>Attempt to gain unauthorized access to any portion of the Services</li>
            <li>Interfere with or disrupt the Services or servers connected to the Services</li>
            <li>Exceed rate limits or otherwise abuse free service tiers</li>
          </ul>
        </>
      )
    },
    {
      id: 'section-4',
      title: '4. Platform Disclaimers and Limitations',
      content: (
        <>
          <h4 className="text-lg font-semibold mb-3">E-Signature Disclaimers</h4>
          <p className="mb-4">
            <strong>Legal Binding Subject to Local Laws:</strong> While DocuSigner's electronic signatures are designed to comply with major e-signature laws such as the ESIGN Act (US), eIDAS (EU), and similar regulations worldwide, the legal validity of electronic signatures may vary by jurisdiction. You are responsible for verifying that electronic signatures meet your specific legal requirements.
          </p>
          <p className="mb-4">
            <strong>Court Acceptance:</strong> DocuSigner does not guarantee that documents signed through our Services will be accepted by all courts or regulatory bodies. Acceptance may depend on jurisdiction-specific requirements, the type of document, and other factors outside our control.
          </p>
          <p className="mb-4">
            <strong>Signer Identity Verification:</strong> While we provide various authentication methods, DocuSigner cannot guarantee the actual identity of signers. Our verification methods are designed to provide reasonable assurance but are not infallible. You are responsible for ensuring appropriate verification methods are used for your specific needs.
          </p>
          <p className="mb-4">
            <strong>Document Integrity:</strong> The integrity of electronically signed documents depends on proper usage of the Services. DocuSigner is not responsible for document alterations that occur outside our system or due to improper handling of documents after signing.
          </p>
          
          <h4 className="text-lg font-semibold mb-3 mt-6">PDF Tool Disclaimers</h4>
          <p className="mb-4">
            <strong>Conversion Accuracy:</strong> While our conversion tools strive for high accuracy, we do not guarantee perfect conversion between formats. Complex formatting, embedded elements, or unusual document structures may not convert with complete fidelity.
          </p>
          <p className="mb-4">
            <strong>Quality Considerations:</strong> Document processing may result in some quality changes, particularly when compressing files, converting between formats, or applying OCR to scanned documents. Preview features are provided to help you assess output quality before finalizing.
          </p>
          <p className="mb-4">
            <strong>OCR Limitations:</strong> Our OCR technology has limitations in recognizing text in poor quality scans, unusual fonts, handwritten text, or complex layouts. OCR accuracy is not guaranteed to be 100%.
          </p>
          <p className="mb-4">
            <strong>Format Compatibility:</strong> Not all features of source formats can be preserved when converting to different formats. Some elements may be simplified or approximated during conversion.
          </p>
          <p className="mb-4">
            <strong>Processing Limitations:</strong> File size, page count, and complexity may affect processing time and success. Very large or complex files may time out or fail to process completely.
          </p>
          
          <h4 className="text-lg font-semibold mb-3 mt-6">Document Management Disclaimers</h4>
          <p className="mb-4">
            <strong>Temporary Storage:</strong> Unless you have a paid account with extended storage features, documents are stored temporarily during processing and may be automatically deleted after a specified period (typically 1 hour for free users).
          </p>
          <p className="mb-4">
            <strong>Data Loss:</strong> While we implement reasonable safeguards, DocuSigner cannot guarantee against data loss due to technical failures, service interruptions, or other causes. You are responsible for maintaining backups of important documents.
          </p>
          <p className="mb-4">
            <strong>Third-Party Integrations:</strong> DocuSigner integrates with various third-party services. We are not responsible for the availability, security, or functionality of these third-party services.
          </p>
          <p className="mb-4">
            <strong>Service Availability:</strong> DocuSigner strives for high availability but does not guarantee uninterrupted access to the Services. Maintenance, technical issues, or factors beyond our control may cause temporary service unavailability.
          </p>
        </>
      )
    },
    {
      id: 'section-5',
      title: '5. Data Handling and Privacy',
      content: (
        <>
          <p className="mb-4">
            Your use of our Services is also governed by our <Link to="/privacy-policy" className="text-primary-600 hover:text-primary-700">Privacy Policy</Link>, which is incorporated by reference into these Terms of Service. The Privacy Policy describes how we collect, use, and share information in connection with your use of our Services.
          </p>
          <p className="mb-4">
            <strong>Data Processing:</strong> DocuSigner processes your data as necessary to provide the Services. This includes processing document content, metadata, user information, and usage data. We implement appropriate technical and organizational measures to protect your data during processing.
          </p>
          <p className="mb-4">
            <strong>Temporary File Storage:</strong> For free users, files uploaded for processing are automatically deleted after 1 hour. Paid accounts may have different retention periods as specified in their service tier. You can manually delete your files at any time.
          </p>
          <p className="mb-4">
            <strong>International Data Transfers:</strong> DocuSigner may transfer, store, and process your information in countries other than your own. We ensure that such transfers comply with applicable data protection laws, including by using standard contractual clauses or other appropriate safeguards.
          </p>
          <p className="mb-4">
            <strong>User Control:</strong> You maintain control over your data and can access, correct, or delete your information as described in our Privacy Policy. You can also export your data from the Services at any time.
          </p>
          <p className="mb-4">
            <strong>Compliance with Regulations:</strong> DocuSigner complies with applicable data protection regulations, including the General Data Protection Regulation (GDPR) for users in the European Union and the California Consumer Privacy Act (CCPA) for California residents. Additional information about your rights under these regulations is available in our Privacy Policy.
          </p>
          <p className="mb-4">
            <strong>Subprocessors:</strong> We may use third-party subprocessors to help provide our Services. A current list of subprocessors is available upon request. We ensure that our subprocessors provide at least the same level of data protection as we do.
          </p>
        </>
      )
    },
    {
      id: 'section-6',
      title: '6. Intellectual Property Rights',
      content: (
        <>
          <p className="mb-4">
            <strong>Platform IP:</strong> The Services, including all software, designs, text, graphics, logos, icons, images, audio clips, digital downloads, data compilations, and code, are owned by DocuSigner or its licensors and are protected by copyright, trademark, patent, and other intellectual property laws. You may not copy, modify, reproduce, republish, distribute, display, or transmit for commercial, non-profit, or public purposes all or any portion of the Services without our prior written permission.
          </p>
          <p className="mb-4">
            <strong>User Content Ownership:</strong> You retain all rights to the content you upload, submit, or create using the Services. By using our Services, you grant us a worldwide, non-exclusive, royalty-free license to use, reproduce, process, adapt, and publish your content solely for the purpose of providing and improving the Services.
          </p>
          <p className="mb-4">
            <strong>License Grants:</strong> DocuSigner grants you a limited, non-exclusive, non-transferable, revocable license to use the Services for their intended purposes in accordance with these Terms of Service. This license is personal to you and may not be sublicensed.
          </p>
          <p className="mb-4">
            <strong>Third-Party Content:</strong> The Services may display or include content from third parties. Such content is the sole responsibility of the entity that makes it available. We may review third-party content to determine whether it is illegal or violates our policies, and we may remove or refuse to display content that we reasonably believe violates our policies or the law.
          </p>
          <p className="mb-4">
            <strong>DMCA Compliance:</strong> If you believe that material on our Services infringes your copyright, please notify us in accordance with our Digital Millennium Copyright Act (DMCA) policy. We will respond to notices of alleged copyright infringement that comply with applicable law and terminate the accounts of repeat infringers.
          </p>
          <p className="mb-4">
            <strong>Patent and Trademark Protection:</strong> The DocuSigner name, logo, and all related names, logos, product and service names, designs, and slogans are trademarks of DocuSigner or its affiliates. You may not use such marks without our prior written permission. Additionally, our Services are protected by various patents, and unauthorized use may constitute patent infringement.
          </p>
          <p className="mb-4">
            <strong>Feedback:</strong> If you provide feedback or suggestions about our Services, we may use this feedback without restriction or obligation to you.
          </p>
        </>
      )
    },
    {
      id: 'section-7',
      title: '7. Liability Limitations and Exclusions',
      content: (
        <>
          <p className="mb-4">
            <strong>Service Performance:</strong> THE SERVICES ARE PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, TITLE, AND NON-INFRINGEMENT. WE DO NOT WARRANT THAT THE SERVICES WILL BE UNINTERRUPTED, ERROR-FREE, OR COMPLETELY SECURE.
          </p>
          <p className="mb-4">
            <strong>Data Loss:</strong> TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, DOCUSIGNER WILL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING WITHOUT LIMITATION, LOSS OF DATA, LOSS OF PROFITS, COSTS OF PROCUREMENT OF SUBSTITUTE PRODUCTS OR SERVICES, OR OTHER INTANGIBLE LOSSES, RESULTING FROM (i) YOUR ACCESS TO OR USE OF OR INABILITY TO ACCESS OR USE THE SERVICES; (ii) ANY CONDUCT OR CONTENT OF ANY THIRD PARTY ON THE SERVICES; OR (iii) UNAUTHORIZED ACCESS, USE, OR ALTERATION OF YOUR TRANSMISSIONS OR CONTENT.
          </p>
          <p className="mb-4">
            <strong>Business Interruption:</strong> IN NO EVENT SHALL DOCUSIGNER BE LIABLE FOR ANY LOSS OF BUSINESS, BUSINESS INTERRUPTION, LOSS OF BUSINESS OPPORTUNITY, OR LOSS OF PROFITS. THIS LIMITATION APPLIES REGARDLESS OF THE LEGAL THEORY ON WHICH THE CLAIM IS BASED AND EVEN IF DOCUSIGNER HAS BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
          </p>
          <p className="mb-4">
            <strong>Third-Party Services:</strong> DOCUSIGNER IS NOT RESPONSIBLE FOR THE ACTIONS, CONTENT, INFORMATION, OR DATA OF THIRD PARTIES, AND YOU RELEASE US, OUR DIRECTORS, OFFICERS, EMPLOYEES, AND AGENTS FROM ANY CLAIMS AND DAMAGES, KNOWN AND UNKNOWN, ARISING OUT OF OR IN ANY WAY CONNECTED WITH ANY CLAIM YOU HAVE AGAINST ANY SUCH THIRD PARTIES.
          </p>
          <p className="mb-4">
            <strong>Legal Compliance:</strong> YOU ARE SOLELY RESPONSIBLE FOR ENSURING THAT YOUR USE OF THE SERVICES COMPLIES WITH APPLICABLE LAW. DOCUSIGNER IS NOT RESPONSIBLE FOR DETERMINING WHETHER THE SERVICES ARE SUITABLE FOR YOUR PARTICULAR USE CASE OR WHETHER YOUR USE COMPLIES WITH LAWS APPLICABLE TO YOU.
          </p>
          <p className="mb-4">
            <strong>Maximum Liability:</strong> TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, THE TOTAL LIABILITY OF DOCUSIGNER, ITS AFFILIATES, OFFICERS, EMPLOYEES, AGENTS, SUPPLIERS, AND LICENSORS, ARISING OUT OF OR IN ANY WAY RELATED TO THESE TERMS SHALL NOT EXCEED THE AMOUNTS PAID BY YOU TO DOCUSIGNER DURING THE TWELVE (12) MONTHS IMMEDIATELY PRECEDING THE EVENT GIVING RISE TO SUCH LIABILITY, OR $100 IF YOU HAVE NOT PAID DOCUSIGNER FOR THE USE OF THE SERVICES.
          </p>
          <p className="mb-4">
            THE LIMITATIONS OF LIABILITY IN THIS SECTION APPLY TO THE FULLEST EXTENT PERMITTED BY LAW IN THE APPLICABLE JURISDICTION. Some jurisdictions do not allow the exclusion or limitation of incidental or consequential damages, so the above limitations or exclusions may not apply to you.
          </p>
        </>
      )
    },
    {
      id: 'section-8',
      title: '8. Indemnification',
      content: (
        <>
          <p className="mb-4">
            You agree to indemnify, defend, and hold harmless DocuSigner, its affiliates, officers, directors, employees, agents, licensors, and suppliers from and against all losses, expenses, damages, liabilities, costs, or demands, including reasonable attorneys' fees, arising from or relating to:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>Your use of the Services</li>
            <li>Your violation of these Terms of Service</li>
            <li>Your violation of any rights of another person or entity</li>
            <li>Your content, including any claims that your content violates any intellectual property rights or privacy rights</li>
            <li>Your failure to comply with applicable laws or regulations</li>
            <li>Your misuse of the Services or any actions that compromise the security of your account</li>
          </ul>
          <p className="mb-4">
            We reserve the right, at our own expense, to assume the exclusive defense and control of any matter otherwise subject to indemnification by you, in which event you will cooperate with us in asserting any available defenses.
          </p>
          <p className="mb-4">
            This indemnification obligation will survive the termination of these Terms of Service and your use of the Services.
          </p>
        </>
      )
    },
    {
      id: 'section-9',
      title: '9. Termination and Suspension',
      content: (
        <>
          <p className="mb-4">
            <strong>Termination by You:</strong> You may terminate your account at any time by following the instructions on our website or by contacting our support team. Upon termination, you will no longer have access to your account or any content stored within it.
          </p>
          <p className="mb-4">
            <strong>Termination by DocuSigner:</strong> We may terminate or suspend your access to all or part of the Services immediately, without prior notice or liability, for any reason, including, without limitation, if you breach these Terms of Service. Upon termination, your right to use the Services will immediately cease.
          </p>
          <p className="mb-4">
            <strong>Suspension for Policy Violations:</strong> We may suspend your account or restrict your access to the Services if we believe you have violated these Terms of Service, used the Services fraudulently, or engaged in activities that may harm DocuSigner, other users, or third parties. During a suspension, you may be unable to access your account or certain features of the Services.
          </p>
          <p className="mb-4">
            <strong>Data Retention After Termination:</strong> Unless legally prohibited, we will retain your data for a limited time after termination in accordance with our data retention policies. For free accounts, data may be deleted immediately upon termination. For paid accounts, data may be retained for a period specified in your service agreement to allow for account recovery.
          </p>
          <p className="mb-4">
            <strong>Refund Policies:</strong> Refunds for prepaid services will be handled in accordance with our refund policy. Generally, we do not provide refunds for partial subscription periods or for termination due to violations of these Terms of Service.
          </p>
          <p className="mb-4">
            <strong>Survival of Terms:</strong> All provisions of these Terms of Service which by their nature should survive termination shall survive termination, including, without limitation, ownership provisions, warranty disclaimers, indemnity, and limitations of liability.
          </p>
        </>
      )
    },
    {
      id: 'section-10',
      title: '10. Dispute Resolution',
      content: (
        <>
          <p className="mb-4">
            <strong>Governing Law:</strong> These Terms of Service shall be governed by and construed in accordance with the laws of the State of Delaware, without regard to its conflict of law provisions. If you are a consumer residing in the European Union, these Terms will be governed by the laws of your country of residence to the extent required by applicable law.
          </p>
          <p className="mb-4">
            <strong>Jurisdiction and Venue:</strong> Any legal action or proceeding relating to your access to or use of the Services shall be instituted in the federal or state courts located in Delaware. You and DocuSigner agree to submit to the personal jurisdiction of such courts.
          </p>
          <p className="mb-4">
            <strong>Arbitration:</strong> For any dispute you have with DocuSigner, you agree to first contact us and attempt to resolve the dispute informally. If DocuSigner has not been able to resolve the dispute with you informally, we each agree to resolve any claim, dispute, or controversy by binding arbitration administered by the American Arbitration Association in accordance with its Commercial Arbitration Rules.
          </p>
          <p className="mb-4">
            <strong>Class Action Waiver:</strong> YOU AND DOCUSIGNER AGREE THAT EACH MAY BRING CLAIMS AGAINST THE OTHER ONLY IN YOUR OR ITS INDIVIDUAL CAPACITY AND NOT AS A PLAINTIFF OR CLASS MEMBER IN ANY PURPORTED CLASS OR REPRESENTATIVE PROCEEDING. Further, unless both you and DocuSigner agree otherwise, the arbitrator may not consolidate more than one person's claims, and may not otherwise preside over any form of a representative or class proceeding.
          </p>
          <p className="mb-4">
            <strong>Informal Dispute Resolution:</strong> Before filing a claim against DocuSigner, you agree to try to resolve the dispute by contacting us at legal@docusigner.com. We'll try to resolve the dispute by contacting you via email. If the dispute is not resolved within 60 days of submission, you or DocuSigner may bring a formal proceeding.
          </p>
          <p className="mb-4">
            <strong>Exceptions:</strong> Nothing in these Terms of Service will be deemed to waive, preclude, or otherwise limit the right of either party to: (a) bring an individual action in small claims court; (b) pursue an enforcement action through the applicable federal, state, or local agency if that action is available; (c) seek injunctive relief in a court of law; or (d) file suit in a court of law to address an intellectual property infringement claim.
          </p>
        </>
      )
    },
    {
      id: 'section-11',
      title: '11. Compliance and Regulatory',
      content: (
        <>
          <p className="mb-4">
            <strong>Industry-Specific Compliance:</strong> While our Services are designed with compliance in mind, you are responsible for determining whether our Services meet your specific compliance requirements. This includes compliance with industry-specific regulations such as HIPAA (Health Insurance Portability and Accountability Act), SOX (Sarbanes-Oxley Act), and other regulatory frameworks.
          </p>
          <p className="mb-4">
            <strong>International Regulations:</strong> Our Services are designed to comply with major international regulations governing electronic signatures and data protection, including GDPR (General Data Protection Regulation) in the European Union and CCPA (California Consumer Privacy Act) in California. However, compliance requirements may vary by jurisdiction, and you are responsible for ensuring that your use of the Services complies with local laws.
          </p>
          <p className="mb-4">
            <strong>Export Control:</strong> You agree to comply with all applicable export and re-export control laws and regulations, including the Export Administration Regulations maintained by the U.S. Department of Commerce and trade and economic sanctions maintained by the Treasury Department's Office of Foreign Assets Control. You represent and warrant that you are not located in, under the control of, or a national or resident of any country to which the United States has embargoed goods or services.
          </p>
          <p className="mb-4">
            <strong>Accessibility Standards:</strong> DocuSigner strives to make its Services accessible to all users, including those with disabilities. We aim to comply with the Web Content Accessibility Guidelines (WCAG) 2.1 Level AA and applicable provisions of Section 508 of the Rehabilitation Act. However, we cannot guarantee that all aspects of our Services will meet all accessibility requirements.
          </p>
          <p className="mb-4">
            <strong>Security Framework Adherence:</strong> DocuSigner implements security measures aligned with industry standards, including ISO 27001, SOC 2, and other relevant security frameworks. Details about our security practices are available in our Security Documentation, which may be provided upon request.
          </p>
          <p className="mb-4">
            <strong>Compliance Updates:</strong> As regulations evolve, we may update our Services to maintain compliance. We will notify users of significant compliance-related changes that may affect their use of the Services.
          </p>
        </>
      )
    },
    {
      id: 'section-12',
      title: '12. Miscellaneous Provisions',
      content: (
        <>
          <p className="mb-4">
            <strong>Severability:</strong> If any provision of these Terms of Service is found to be unenforceable or invalid, that provision will be limited or eliminated to the minimum extent necessary so that these Terms of Service will otherwise remain in full force and effect and enforceable.
          </p>
          <p className="mb-4">
            <strong>Force Majeure:</strong> DocuSigner shall not be liable for any failure to perform its obligations hereunder where such failure results from any cause beyond DocuSigner's reasonable control, including, without limitation, mechanical, electronic, or communications failure or degradation, acts of God, terrorism, natural disaster, pandemic, or government restriction.
          </p>
          <p className="mb-4">
            <strong>Assignment:</strong> These Terms of Service are personal to you, and you may not assign, transfer, or sublicense your rights or obligations under these Terms of Service without DocuSigner's prior written consent. DocuSigner may assign, transfer, or delegate any of its rights and obligations hereunder without your consent.
          </p>
          <p className="mb-4">
            <strong>Notice Requirements:</strong> Any notice required or permitted to be given under these Terms of Service shall be in writing and delivered by email to the email address associated with your account or to legal@docusigner.com for notices to DocuSigner. Notices shall be deemed given upon receipt.
          </p>
          <p className="mb-4">
            <strong>Entire Agreement:</strong> These Terms of Service, together with the Privacy Policy and any other legal notices published by DocuSigner, constitute the entire agreement between you and DocuSigner concerning the Services. These Terms of Service supersede all prior or contemporaneous communications, whether electronic, oral, or written, between you and DocuSigner regarding the Services.
          </p>
          <p className="mb-4">
            <strong>Amendment Procedures:</strong> No amendment to these Terms of Service will be effective unless it is in writing and signed by an authorized representative of DocuSigner, or unless it is posted on our website. Your continued use of the Services after any amendment becomes effective constitutes your acceptance of the amended Terms of Service.
          </p>
          <p className="mb-4">
            <strong>No Waiver:</strong> The failure of DocuSigner to exercise or enforce any right or provision of these Terms of Service shall not constitute a waiver of such right or provision. No waiver by either party of any breach or default hereunder shall be deemed to be a waiver of any preceding or subsequent breach or default.
          </p>
          <p className="mb-4">
            <strong>Relationship of Parties:</strong> Nothing in these Terms of Service shall be construed as creating a partnership, joint venture, agency, or employment relationship between you and DocuSigner.
          </p>
        </>
      )
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-16">
      <div className="container-max">
        {/* Header Section */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Terms of Service</h1>
              <div className="text-gray-600">
                <p>Last Updated: {lastUpdated}</p>
                <p>Effective Date: {effectiveDate}</p>
              </div>
            </div>
            <div className="flex gap-4 mt-4 md:mt-0">
              <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 transition-colors">
                <Download className="h-4 w-4" />
                <span>Download PDF</span>
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 transition-colors">
                <Printer className="h-4 w-4" />
                <span>Print</span>
              </button>
            </div>
          </div>

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
              <Globe className="h-6 w-6 text-blue-600 flex-shrink-0" />
              <p className="text-blue-800">
                These Terms of Service govern your use of DocuSigner's platform, which provides e-signature, PDF tools, document management, and related services. Please read these terms carefully.
              </p>
            </div>
          </div>

          {/* Main Content Sections */}
          <div className="space-y-6">
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

          {/* Contact Information */}
          <div className="mt-8 bg-gray-50 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Questions About These Terms?</h2>
            <p className="text-gray-700 mb-4">
              If you have any questions about these Terms of Service, please contact us at:
            </p>
            <div className="flex flex-col space-y-2">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-gray-500" />
                <span className="text-gray-700">Email: legal@docusigner.com</span>
              </div>
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-gray-500" />
                <span className="text-gray-700">Address: 123 Legal Avenue, Suite 400, San Francisco, CA 94103</span>
              </div>
            </div>
          </div>

          {/* Legal Compliance Notice */}
          <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <div className="flex items-start gap-3">
              <Scale className="h-6 w-6 text-yellow-600 mt-1 flex-shrink-0" />
              <div>
                <h3 className="text-lg font-semibold text-yellow-800 mb-2">Legal Compliance Notice</h3>
                <p className="text-yellow-700">
                  These Terms of Service are designed to comply with applicable laws and regulations governing electronic signatures, document management, and online services. However, laws vary by jurisdiction, and you are responsible for ensuring your use of DocuSigner complies with all laws applicable to you.
                </p>
              </div>
            </div>
          </div>

          {/* Security Notice */}
          <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-6">
            <div className="flex items-start gap-3">
              <Shield className="h-6 w-6 text-green-600 mt-1 flex-shrink-0" />
              <div>
                <h3 className="text-lg font-semibold text-green-800 mb-2">Security & Privacy Commitment</h3>
                <p className="text-green-700">
                  DocuSigner is committed to protecting your data and privacy. We implement industry-standard security measures and comply with major data protection regulations. For more information, please review our <Link to="/privacy-policy" className="text-green-800 underline">Privacy Policy</Link>.
                </p>
              </div>
            </div>
          </div>

          {/* Acceptance Notice */}
          <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-6 w-6 text-red-600 mt-1 flex-shrink-0" />
              <div>
                <h3 className="text-lg font-semibold text-red-800 mb-2">Acceptance of Terms</h3>
                <p className="text-red-700">
                  By using DocuSigner's services, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsOfServicePage;