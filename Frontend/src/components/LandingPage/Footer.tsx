import { Mail, Linkedin, Github} from 'lucide-react'
import { Link } from 'react-router-dom'

const Footer = () => {
 

  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-6">     
        {/* Main Footer Content */}
        <div className="py-16 grid lg:grid-cols-5 md:grid-cols-3 sm:grid-cols-2 justify-center">
          <div>
            <h3 className="font-semibold text-white mb-4">Use Cases</h3>
            <ul className="space-y-3">
              <li>
                <Link
                  to="/login"
                  className="text-gray-400 hover:text-white transition-colors text-[14px]"
                >
                  eSignature
                </Link>
              </li>
              <li>
                <Link
                  to="/login"
                  className="text-gray-400 hover:text-white transition-colors text-[14px]"
                >
                  PDF Tools
                </Link>
              </li>
              <li>
                <Link
                  to="/login"
                  className="text-gray-400 hover:text-white transition-colors text-[14px]"
                >
                  Legal Templates
                </Link>
              </li>
              <li>
                <Link
                  to="/login"
                  className="text-gray-400 hover:text-white transition-colors text-[14px]"
                >
                  Agreement Preparation
                </Link>
              </li>
              <li>
                <Link
                  to="/login"
                  className="text-gray-400 hover:text-white transition-colors text-[14px]"
                >
                  AI Assistant
                </Link>
              </li>
              <li>
                <Link
                  to="/login"
                  className="text-gray-400 hover:text-white transition-colors text-[14px]"
                >
                  Web Forms
                </Link>
              </li>             
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-white mb-4">Resources</h3>
            <ul className="space-y-3">
              <li>
                <Link
                  to="#"
                  className="text-gray-400 hover:text-white transition-colors text-[14px]"
                >
                  Resource Center
                </Link>
              </li>
              <li>
                <Link
                  to="#"
                  className="text-gray-400 hover:text-white transition-colors text-[14px]"
                >
                  Knowledge Base
                </Link>
              </li>
              <li>
                <Link
                  to="/api-documentation"
                  className="text-gray-400 hover:text-white transition-colors text-[14px]"
                >
                  Help Center
                </Link>
              </li>
              <li>
                <a
                  href="#"
                  className="text-gray-400 hover:text-white transition-colors text-[14px]"
                >
                  Blogs
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-gray-400 hover:text-white transition-colors text-[14px]"
                >
                  Customer Stories
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-gray-400 hover:text-white transition-colors text-[14px]"
                >
                  E-Sign law
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-gray-400 hover:text-white transition-colors text-[14px]"
                >
                  AI Praposal Generator
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-gray-400 hover:text-white transition-colors text-[14px]"
                >
                  Case Studies
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-gray-400 hover:text-white transition-colors text-[14px]"
                >
                  Faqs
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-white mb-4">Legal</h3>
            <ul className="space-y-3">
              <li>
                <Link
                  to="#"
                  className="text-gray-400 hover:text-white transition-colors text-[14px]"
                >
                  Trust Center & Systems Status
                </Link>
              </li>
              <li>
                <Link
                  to="#"
                  className="text-gray-400 hover:text-white transition-colors text-[14px]"
                >
                  Safety Center
                </Link>
              </li>
              <li>
                <Link
                  to="/data-residency"
                  className="text-gray-400 hover:text-white transition-colors text-[14px]"
                >
                  Legality Guide
                </Link>
              </li>
              <li>
                <Link
                  to="/status"
                  className="text-gray-400 hover:text-white transition-colors text-[14px]"
                >
                  Status Page
                </Link>
              </li>
              <li>
                <Link
                  to="/bug-bounty"
                  className="text-gray-400 hover:text-white transition-colors text-[14px]"
                >
                  Bug Bounty
                </Link>
              </li>
              <li>
                <a
                  href="#"
                  className="text-gray-400 hover:text-white transition-colors text-[14px]"
                >
                  Security & Compliance
                </a>
              </li>
                  <li>
                <a
                  href="#"
                  className="text-gray-400 hover:text-white transition-colors text-[14px]"
                >
                  Data Protection Addendum
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-gray-400 hover:text-white transition-colors text-[14px]"
                >
                  Refund Policy
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-gray-400 hover:text-white transition-colors text-[14px]"
                >
                  GDPR
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-white mb-4">Explore</h3>
            <ul className="space-y-3">
              <li>
                <Link
                  to="/draft-n-sign-vs-docusign"
                  className="text-gray-400 hover:text-white transition-colors text-[14px]"
                >
                  Switch from DocuSign
                </Link>
              </li>
              <li>
                <Link
                  to="/draft-n-sign-vs-hellosign"
                  className="text-gray-400 hover:text-white transition-colors text-[14px]"
                >
                  Switch from HelloSign
                </Link>
              </li>
              <li>
                <Link
                  to="/draft-n-sign-vs-adobesign"
                  className="text-gray-400 hover:text-white transition-colors text-[14px]"
                >
                  Switch from Adobe Sign
                </Link>
              </li>
              <li>
                <Link
                  to="/draft-n-sign-vs-pandadoc"
                  className="text-gray-400 hover:text-white transition-colors text-[14px]"
                >
                  Switch from PandaDoc
                </Link>
              </li>
              <li>
                <Link
                  to="/feature-comparison"
                  className="text-gray-400 hover:text-white transition-colors text-[14px]"
                >
                  All Alternatives
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold text-white mb-4">Company</h3>
            <ul className="space-y-3">
              <li>
                <Link
                  to="/about"
                  className="text-gray-400 hover:text-white transition-colors text-[14px]"
                >
                  About Us
                </Link>
              </li>
              <li>
                <Link
                  to="/blog"
                  className="text-gray-400 hover:text-white transition-colors text-[14px]"
                >
                  Blog
                </Link>
              </li>
              <li>
                <a
                  href="#"
                  className="text-gray-400 hover:text-white transition-colors text-[14px]"
                >
                  Product Release
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-gray-400 hover:text-white transition-colors text-[14px]"
                >
                  Partners with us
                </a>
              </li>
              <li>
                <Link
                  to="#"
                  className="text-gray-400 hover:text-white transition-colors text-[14px]"
                >
                  Contact
                </Link>
              </li>
              {/* <li>
                <a
                  href="#"
                  className="text-gray-400 hover:text-white transition-colors text-[14px]"
                >
                  Press Kit
                </a>
              </li> */}
            </ul>
          </div>
        </div>

        {/* Bottom Footer */}
        <div className="py-8 border-t border-gray-800">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            
            <div className="flex items-center gap-4">
              <span className="text-gray-400 text-xs">
                © {new Date().getFullYear()} DraftnSign All rights reserved.
              </span>
            
            </div>

            {/* Social Links */}
            <div className="flex items-center gap-4">
              <a
                href="#"
                className="w-10 h-10 bg-gray-800 hover:bg-gray-700 rounded-lg flex items-center justify-center transition-colors"
              >
                <Linkedin className="h-5 w-5 text-gray-400 hover:text-white" />
              </a>
              <a
                href="#"
                className="w-10 h-10 bg-gray-800 hover:bg-gray-700 rounded-lg flex items-center justify-center transition-colors"
              >
                <Github className="h-5 w-5 text-gray-400 hover:text-white" />
              </a>
              <a
                href="#"
                className="w-10 h-10 bg-gray-800 hover:bg-gray-700 rounded-lg flex items-center justify-center transition-colors"
              >
                <svg className="h-5 w-5 text-gray-400 hover:text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
              <a
                href="#"
                className="w-10 h-10 bg-gray-800 hover:bg-gray-700 rounded-lg flex items-center justify-center transition-colors"
              >
                <Mail className="h-5 w-5 text-gray-400 hover:text-white" />
              </a>
            </div>
          </div>
           <div className='text-gray-400 text-xs gap-4 flex flex-wrap'>
              <a href="/privacy-policy" className="hover:underline">Privacy Policy</a>
              <a href="/terms-of-service" className="hover:underline">Terms of Service</a>
              <a href="/cookie-policy" className="hover:underline">Cookie Policy</a>
              <a href="/cookie-policy" className="hover:underline">Accessibility Statement</a>
              <a href="/cookie-policy" className="hover:underline">Do Not Sell My Personal Information</a>
              <a href="/cookie-policy" className="hover:underline">AI Information</a>
             </div>
        </div>
      </div>
    </footer>
  )
}
export default Footer