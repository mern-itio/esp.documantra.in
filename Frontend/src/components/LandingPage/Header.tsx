import { useState, useEffect, useLayoutEffect, useRef } from 'react'
import Toast from '../Toast'
import { Link } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import { useAuth } from '../AuthService/AuthContext'
import UseCases from './headerTab/useCases'
import ProductSection from './headerTab/product'
import ResourceTab from './headerTab/ResourceTab'
import { BRAND } from '../../config/brand'

const Header = () => {
  const { isAuthenticated, user } = useAuth()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null)
  const pdfToolsButtonRef = useRef<HTMLButtonElement | null>(null)
  const resourcesButtonRef = useRef<HTMLButtonElement | null>(null)
  const dropdownContainerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node
      if (dropdownContainerRef.current?.contains(target)) return
      setActiveDropdown(null)
    }
    if (activeDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [activeDropdown])

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
    setIsMenuOpen(false)
    setActiveDropdown(null)
  }

  const handleDropdownClick = (dropdownName: string) => {
    setActiveDropdown((current) => (current === dropdownName ? null : dropdownName))
  }
  const dropdownRefs = useRef<Record<string, HTMLDivElement | null>>({});
  useLayoutEffect(() => {
    if (!activeDropdown || !dropdownRefs.current[activeDropdown]) return
    const dropdown = dropdownRefs.current[activeDropdown]!
    const rect = dropdown.getBoundingClientRect()
    const screenWidth = window.innerWidth

    // For wide, multi-column menus (Products, Use Cases, Resources), center and align to navbar
    if (activeDropdown === 'pdf-tools' || activeDropdown === 'use-cases' || activeDropdown === 'resources') {
      const triggerRef = activeDropdown === 'resources' ? resourcesButtonRef : pdfToolsButtonRef
      const triggerRect = triggerRef.current?.getBoundingClientRect()
      // Use trigger bottom so dropdown starts just below navbar; fallback when unscrolled (~88px)
      const top = triggerRect ? triggerRect.bottom : 88
      dropdown.style.position = 'fixed'
      dropdown.style.left = '50%'
      dropdown.style.transform = 'translateX(-50%)'
      dropdown.style.right = 'auto'
      dropdown.style.top = `${top}px`
      dropdown.style.maxWidth = activeDropdown === 'resources' ? '1100px' : '1200px'
      dropdown.style.width = '95vw'
      dropdown.style.maxHeight = `min(80vh, ${window.innerHeight - top}px)`
      dropdown.style.overflowY = 'auto'
      dropdown.style.zIndex = '9999'
      return
    }

    // Fallback for smaller menus: clamp to viewport edges
    if (rect.right > screenWidth) {
      dropdown.style.left = 'auto'
      dropdown.style.right = '0'
      dropdown.style.transform = 'none'
    } else if (rect.left < 0) {
      dropdown.style.left = '0'
      dropdown.style.right = 'auto'
      dropdown.style.transform = 'none'
    } else {
      dropdown.style.left = '50%'
      dropdown.style.right = 'auto'
      dropdown.style.transform = 'translateX(-50%)'
    }
  }, [activeDropdown]) 

  const getInitials = (fullName = "") => {
    const parts = fullName.trim().split(" ");
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };
 

  return (
    <header className={`fixed top-0 w-full z-50 transition-all duration-300 ${isScrolled ? 'bg-[#F7F3EE]/95 backdrop-blur-sm shadow-lg' : 'bg-transparent'
      }`}>
      <Toast />
      <div
        className={`
         bg-[#F7F3EE]/80 backdrop-blur-xl mx-auto px-6 transition-all duration-300 ease-in-out
        ${isScrolled
            ? "w-full rounded-none border-none shadow-md bg-none mt-0"
            : "w-[95%] max-w-7xl border border-dashed border-blue-400/60 rounded-full shadow-[0_8px_30px_rgba(0,0,0,0.04)] bg-[#F7F3EE]/80 mt-5"
          }
        `}
      >
        <div className="container-max">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center">
              <Link to="/login"><img src="/Logo.png" alt={`${BRAND.name} Logo`} className="h-15 w-auto " /></Link>
            </div>

            {/* Desktop Navigation */}
            <nav ref={dropdownContainerRef} className="hidden lg:flex items-center space-x-6">
              {/* Products Dropdown - click to open */}
              <div className="relative group">
                <button
                  ref={pdfToolsButtonRef}
                  type="button"
                  onClick={() => handleDropdownClick('pdf-tools')}
                  className="flex items-center font-semibold text-[#1f2779] hover:text-[#260559] transition-colors"
                  aria-expanded={activeDropdown === 'pdf-tools'}
                  aria-haspopup="true"
                >
                  Products
                </button>

                {activeDropdown === 'pdf-tools' && (
                  <div
                    ref={(el) => {
                      dropdownRefs.current['pdf-tools'] = el
                    }}
                    className="fixed inset-x-0 mx-auto w-[95vw] max-w-[1200px] max-h-[80vh] overflow-y-auto bg-[#F7F3EE] rounded-3xl shadow-2xl border border-sky-100 p-6 md:p-8 z-50"
                  >
                    <ProductSection />
                  </div>
                )}
              </div>

              {/* Solutions Dropdown - click to open */}
              <div className="relative group">
                <button
                  type="button"
                  onClick={() => handleDropdownClick('use-cases')}
                  className="flex items-center font-semibold text-[#1f2779] hover:text-[#260559] transition-colors"
                  aria-expanded={activeDropdown === 'use-cases'}
                  aria-haspopup="true"
                >
                  Solutions
                </button>

                {activeDropdown === 'use-cases' && (
                  <div
                    ref={(el) => {
                      dropdownRefs.current['use-cases'] = el
                    }}
                    className="mx-auto w-[95vw] max-w-[1200px] bg-[#F7F3EE] rounded-3xl shadow-2xl border border-[#E6D8C9]/80 overflow-hidden z-50"
                  >
                    <UseCases />
                  </div>
                )}
              </div>

              {/* Resources Dropdown - click to open */}
              <div className="relative group">
                <button
                  ref={resourcesButtonRef}
                  type="button"
                  onClick={() => handleDropdownClick('resources')}
                  className="flex items-center font-semibold text-[#1f2779] hover:text-[#260559] transition-colors"
                  aria-expanded={activeDropdown === 'resources'}
                  aria-haspopup="true"
                >
                  Resources
                </button>

                {activeDropdown === 'resources' && (
                  <div
                    ref={(el) => { dropdownRefs.current['resources'] = el }}
                    className="mx-auto w-[95vw] max-w-[1100px] bg-[#F7F3EE] rounded-3xl shadow-2xl border border-[#E6D8C9]/80 overflow-hidden"
                    style={{ position: 'fixed', left: '50%', transform: 'translateX(-50%)', top: 88, zIndex: 9999, maxHeight: 'min(80vh, calc(100vh - 88px))' }}
                  >
                    <ResourceTab />
                  </div>
                )}
              </div>

              {/* Developer - link only */}
              <div className="relative group">
                <Link
                  to="/api-documentation"
                  className="flex items-center font-semibold text-[#1f2779] hover:text-[#260559] transition-colors"
                >
                  Developer
                </Link>
              </div>

              {/* Pricing - link only */}
              <div className="relative group">
                <Link
                  to="/pricing"
                  className="flex items-center font-semibold text-[#1f2779] hover:text-[#260559] transition-colors"
                >
                  Pricing
                </Link>
              </div>
            </nav>

            <div>
              {isAuthenticated ? (
                <div className="relative group">
                  {/* User Icon */}
                  <div className="w-9 h-9 flex items-center justify-center font-bold rounded-full bgColor text-white cursor-pointer">
                    <Link to='/dashboard'> {getInitials((user as any)?.fullname)}</Link>
                  </div>

                  {/* Tooltip */}
                  <div className="absolute right-0 mt-2 hidden group-hover:block bg-black text-white text-xs px-3 py-1 rounded-md whitespace-nowrap">
                    My Account
                  </div>
                </div>
              ) : (
                <Link
                  to="/login"
                  className="text-sm font-medium transition-colors"
                >
                  <button className="login-btn">
                    Login
                  </button>
                </Link>
              )}
            </div>

            {/* Mobile menu button - No CTA buttons on desktop */}
            <button
              className="lg:hidden"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>

          {/* Mobile Navigation */}
          {isMenuOpen && (
            <div className="lg:hidden bg-[#F7F3EE] border-t">
              <div className="px-2 pt-2 pb-3 space-y-1">
                <button onClick={() => scrollToSection('pdf-tools')} className="block w-full text-left px-3 py-2 text-base font-medium text-gray-700 hover:text-primary-600">PDF Tools</button>
                <button className="block w-full text-left px-3 py-2 text-base font-medium text-gray-700 hover:text-primary-600">Why {BRAND.name}</button>
                <button className="block w-full text-left px-3 py-2 text-base font-medium text-gray-700 hover:text-primary-600">Use Cases</button>
                <button className="block w-full text-left px-3 py-2 text-base font-medium text-gray-700 hover:text-primary-600">Resources</button>
                <button className="block w-full text-left px-3 py-2 text-base font-medium text-gray-700 hover:text-primary-600">Developer</button>
                <button className="block w-full text-left px-3 py-2 text-base font-medium text-gray-700 hover:text-primary-600">Workspace</button>
                <button className="block w-full text-left px-3 py-2 text-base font-medium text-gray-700 hover:text-primary-600">Industries</button>
                <button className="block w-full text-left px-3 py-2 text-base font-medium text-gray-700 hover:text-primary-600">Features</button>
                {/* <div className="px-3 py-2 space-y-2">
                  {isAuthenticated ? (
                    <>
                      <div className="text-center py-2 text-primary-600 text-sm">Welcome, {user?.fullname}</div>
                      <Link to="/dashboard" className="w-full text-center py-2 text-primary-600 font-medium block">Dashboard</Link>
                      <button
                        onClick={logout}
                        className="w-full text-center py-2 text-red-600 font-medium block"
                      >
                        Logout
                      </button>
                    </>
                  ) : (
                    <Link to="/login" className="w-full text-center py-2 text-primary-600 font-medium block">Log in</Link>
                  )}
                </div> */}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

export default Header
