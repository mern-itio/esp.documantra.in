import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, ArrowRight, Shield, Github, Linkedin, Building2, Menu, X } from 'lucide-react';
import { useAdminAuth } from './AdminAuthContext';

const AdminLogin: React.FC = () => {
  const { login } = useAdminAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      const success = await login(email, password);
      if (success) {
        navigate('/admin/dashboard');
      } else {
        setError('Invalid admin credentials. Please try again.');
      }
    } catch (error) {
      setError('Invalid admin credentials. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <>
      {/* Header */}
      <header className="bg-gradient-to-r from-white to-gray-50 shadow-sm border-b border-gray-200 sticky top-0 z-50 backdrop-blur-sm">
        <div className="container-max">
          <div className="flex items-center justify-between h-16 px-4">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2 group">
                <div className="p-2 bg-primary-100 rounded-lg group-hover:bg-primary-200 transition-colors">
                  <Building2 className="h-6 w-6 text-primary-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold gradient-text">DraftnSign</h1>
                </div>
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              <a href="/" className="text-gray-600 hover:text-gray-900 transition-colors">
                Home
              </a>
              <a href="/features" className="text-gray-600 hover:text-gray-900 transition-colors">
                Features
              </a>
              <a href="/pricing" className="text-gray-600 hover:text-gray-900 transition-colors">
                Pricing
              </a>
              <a href="/support" className="text-gray-600 hover:text-gray-900 transition-colors">
                Support
              </a>
              <div className="flex items-center space-x-2 px-3 py-1 bg-red-50 border border-red-200 rounded-full">
                <Shield className="h-4 w-4 text-red-600" />
                <span className="text-sm font-medium text-red-600">Admin Access</span>
              </div>
            </nav>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              >
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <div className="md:hidden border-t border-gray-200 bg-white">
              <div className="px-4 py-3 space-y-3">
                <a href="/" className="block text-gray-600 hover:text-gray-900 transition-colors">
                  Home
                </a>
                <a href="/features" className="block text-gray-600 hover:text-gray-900 transition-colors">
                  Features
                </a>
                <a href="/pricing" className="block text-gray-600 hover:text-gray-900 transition-colors">
                  Pricing
                </a>
                <a href="/support" className="block text-gray-600 hover:text-gray-900 transition-colors">
                  Support
                </a>
                <div className="flex items-center space-x-2 pt-2 border-t border-gray-200 px-3 py-2 bg-red-50 border border-red-200 rounded-lg">
                  <Shield className="h-4 w-4 text-red-600" />
                  <span className="text-sm font-medium text-red-600">Admin Access</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-white pt-8">
        <div className="container-max">
          <div className="max-w-xl mx-auto">
            {/* Login Header */}
            <div className="text-center mt-8">
            <div className="flex justify-center mb-4">
              <Shield className="h-12 w-12 text-red-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Access</h1>
            <p className="text-gray-600">Sign in to access the admin panel and manage the system</p>
          </div>

          {/* Login Form */}
          <div className="bg-white rounded-2xl shadow-lg p-8">
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}
           
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Admin Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Enter your admin email"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Enter your password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm text-gray-700">Remember me</span>
                </label>
                <a href="#" className="text-sm text-primary-600 hover:text-primary-700">
                  Forgot password?
                </a>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-base font-semibold px-4 py-2 rounded-md shadow-sm transition duration-200"
              >
                <span className="flex items-center">
                  {isLoading ? 'Signing In...' : 'Sign In to Admin Panel'}
                  {!isLoading && <ArrowRight className="ml-2 h-4 w-4 align-middle" />}
                </span>
              </button>

            </form>

            {/* Admin Notice */}
            <div className="mt-6 text-center">
              <p className="text-gray-600">
                <Shield className="inline w-4 h-4 mr-1" />
                Admin access only - Authorized personnel only
              </p>
            </div>
          </div>

          {/* Security Notice */}
          <div className="mt-2 mb-4 text-center">
            <p className="text-sm text-gray-500">
              🔒 Your admin data is protected with 256-bit SSL encryption
            </p>
          </div>
        </div>
      </div>
    </div>
    <footer className="bg-gray-900 text-white">
      <div className="container-max">
        <div className="py-8 border-t border-gray-800">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            {/* Logo & Copyright */}
            <div className="flex items-center gap-4">
              <div className="text-2xl font-bold gradient-text">DraftnSign</div>
              <span className="text-gray-400 text-sm">
                © 2025 DraftnSign. All rights reserved.
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
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
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
        </div>
      </div>
    </footer>
    </>
   
  );
};

export default AdminLogin;
