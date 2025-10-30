import { Link } from 'react-router-dom';

const CookiePolicyPage = () => {
  return (
    <div className="min-h-screen bg-white pt-24">
      {/* Hero Section */}
      <section className="py-16 bg-gradient-to-br from-primary-50 to-white">
        <div className="container-max px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Cookie Policy
            </h1>
            <p className="text-xl text-gray-600">
              Detailed information about our use of cookies
            </p>
          </div>
        </div>
      </section>

      {/* Content Section */}
      <section className="py-12 bg-white">
        <div className="container-max px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto space-y-10 text-gray-700">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">Overview</h2>
              <p>
                This Cookie Policy explains what cookies are, how we use them on
                Draft&Sign, and your choices regarding cookies. For details on how we
                process personal data, see our{' '}
                <Link to="/privacy-policy" className="text-primary-600 hover:text-primary-700 font-medium">
                  Privacy Policy
                </Link>
                .
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">What are cookies?</h2>
              <p>
                Cookies are small text files stored on your device by your web browser.
                They help websites remember information about your visit, like your
                preferences and settings, so your experience is faster and more useful.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">How we use cookies</h2>
              <p className="mb-4">We use cookies to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Authenticate users and maintain sessions</li>
                <li>Remember preferences (e.g., language, UI settings)</li>
                <li>Enhance security and detect malicious activity</li>
                <li>Measure site performance and usage analytics</li>
                <li>Support features like document previews and embedded media</li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">Types of cookies we use</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="border border-gray-100 rounded-lg p-5 bg-white shadow-sm">
                  <h3 className="font-semibold text-gray-900 mb-2">Strictly Necessary</h3>
                  <p>Required for core functionality such as login, security, and load balancing.</p>
                </div>
                <div className="border border-gray-100 rounded-lg p-5 bg-white shadow-sm">
                  <h3 className="font-semibold text-gray-900 mb-2">Preferences</h3>
                  <p>Remember your choices like language, theme, and dashboard settings.</p>
                </div>
                <div className="border border-gray-100 rounded-lg p-5 bg-white shadow-sm">
                  <h3 className="font-semibold text-gray-900 mb-2">Analytics</h3>
                  <p>Help us understand how the site is used to improve features and performance.</p>
                </div>
                <div className="border border-gray-100 rounded-lg p-5 bg-white shadow-sm">
                  <h3 className="font-semibold text-gray-900 mb-2">Marketing</h3>
                  <p>Used to deliver and measure the effectiveness of campaigns (where applicable).</p>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">Third-party cookies</h2>
              <p>
                Some cookies may be placed by third-party services we use for analytics,
                performance monitoring, payment processing, or embedded content. These
                third parties may collect information in accordance with their own policies.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">Your choices</h2>
              <p className="mb-4">
                You can control cookies through your browser settings and, where
                available, our in-product cookie preferences. Disabling certain cookies
                may impact site functionality, especially strictly necessary cookies.
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Adjust browser settings to block or delete cookies</li>
                <li>Use private/incognito browsing modes</li>
                <li>Opt-out of analytics where supported</li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">Retention</h2>
              <p>
                Cookies may be session-based (deleted when you close your browser) or
                persistent (stored until they expire or you delete them). Retention
                periods vary based on purpose and provider.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">Updates to this policy</h2>
              <p>
                We may update this Cookie Policy from time to time. Material changes
                will be highlighted on this page with an updated effective date.
              </p>
            </div>

            <div className="border-t border-gray-100 pt-6">
              <p className="text-sm text-gray-500">
                For questions, contact us via{' '}
                <Link to="/contact-sales" className="text-primary-600 hover:text-primary-700 font-medium">
                  Contact Sales
                </Link>
                .
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default CookiePolicyPage;


