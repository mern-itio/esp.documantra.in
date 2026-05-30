import { Link } from 'react-router-dom';
export interface SitemapItem {
  label: string;
  path: string; 
}

export interface SitemapSection {
  title: string;
  items: SitemapItem[];
}

const SITEMAP_SECTIONS: SitemapSection[] = [
  {
    title: 'Footer - Use Cases',
    items: [
      { label: 'eSignature feature', path: '#' },
      { label: 'PDF Tools feature', path: '#' },
      { label: 'Legal Templates feature', path: '#' },
      { label: 'Agreement Preparation feature', path: '#' },
      { label: 'AI Assistant feature', path: '#' },
      { label: 'Web Forms feature', path: '#' },
    ],
  },
  {
    title: 'Footer - Resources',
    items: [
      { label: 'Resource Center', path: '#' },
      { label: 'Knowledge Base', path: '#' },
      { label: 'Help Center', path: '#' },
      { label: 'Blogs', path: '#' },
      { label: 'Multiple Blogs Pages', path: '#' },
      { label: 'Customer Stories', path: '#' },
      { label: 'Multiple Customer Stories Pages', path: '#' },
      { label: 'AI Proposal Generator', path: '#' },
      { label: 'Case Studies', path: '#' },
      { label: 'FAQs', path: '#' },
    ],
  },
  {
    title: 'Footer - Legal',
    items: [
      { label: 'Trust Center & Systems Status', path: '#' },
      { label: 'Safety Center', path: '#' },
      { label: 'Legality Guide', path: '#' },
      { label: 'Status Page', path: '#' },
      { label: 'Bug Bounty', path: '#' },
      { label: 'Security & Compliance', path: '#' },
      { label: 'Data Protection Addendum', path: '#' },
      { label: 'Refund Policy', path: '#' },
      { label: 'GDPR', path: '#' },
    ],
  },
  {
    title: 'Footer - Explore (Platform comparisons)',
    items: [
      { label: 'Switch from DocuSign', path: '#' },
      { label: 'Switch from HelloSign', path: '#' },
      { label: 'Switch from Adobe Sign', path: '#' },
      { label: 'Switch from PandaDoc', path: '#' },
      { label: '+11 other comparison platforms', path: '#' },
    ],
  },
  {
    title: 'Footer - Company',
    items: [
      { label: 'About Us', path: '#' },
      { label: 'Blog', path: '#' },
      { label: 'Product Release', path: '#' },
      { label: 'Partners with us', path: '#' },
      { label: 'Contact', path: '#' },
    ],
  },
  {
    title: 'Footer - Bottom links',
    items: [
      { label: 'Privacy Policy', path: '#' },
      { label: 'Terms of Service', path: '#' },
      { label: 'Cookie Policy', path: '#' },
      { label: 'Accessibility Statement', path: '#' },
      { label: 'Do Not Sell My Personal Information', path: '#' },
      { label: 'AI Information', path: '#' },
    ],
  },
  {
    title: 'Country E-Sign Laws',
    items: [
      { label: 'USA (ESIGN / UETA)', path: '#' },
      { label: 'European Union (eIDAS)', path: '#' },
      { label: 'United Kingdom', path: '#' },
      { label: 'Canada', path: '#' },
      { label: 'Australia', path: '#' },
      { label: 'India', path: '#' },
      { label: 'Germany', path: '#' },
      { label: 'France', path: '#' },
      { label: 'Japan', path: '#' },
      { label: 'Brazil', path: '#' },
      { label: '+20 other countries (All)', path: '#' },
      // Add more countries as needed
    ],
  },
 
];

// Flatten all items for display (no sections in UI)
const ALL_TABS = SITEMAP_SECTIONS.flatMap((s) => s.items);

// ——— End editable config ———

const SitemapPage = () => {
  return (
    <div className="min-h-screen bg-[#F7F3EE] pt-24 pb-16">
      <div className="p-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3">
          {ALL_TABS.map((item, i) =>
            item.path && item.path !== '#' ? (
              <Link
                key={`${item.label}-${i}`}
                to={item.path}
                className="inline-flex items-center justify-center px-4 py-3 rounded-lg text-sm font-medium bg-[#f5f5f5] text-gray-800 hover:bg-gray-200 shadow-xl transition-colors text-center cursor-pointer"
              >
                {item.label}
              </Link>
            ) : (
              <span
                key={`${item.label}-${i}`}
                className="inline-flex items-center justify-center px-4 py-3 rounded-lg text-sm font-medium bg-[#f5f5f5] text-gray-700 shadow-sm border text-center cursor-pointer"
              >
                {item.label}
              </span>
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default SitemapPage;
