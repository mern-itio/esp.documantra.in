import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  Search,
  FileText,
  Shield,
  ScanLine,
  RefreshCw,
  ArrowRight,
  Zap,
  Lock,
  Globe,
  CheckCircle
} from "lucide-react";

const tools = [
  {
    category: "Convert PDF",
    items: [
      { name: "PDF to Word", route: "/pdf-to-word" },
      { name: "Word to PDF", route: "/word-to-pdf" },
      { name: "PDF to Excel", route: "/pdf-to-excel" },
      { name: "Excel to PDF", route: "/excel-to-pdf" },
      { name: "PDF to PowerPoint", route: "/pdf-to-powerpoint" },
      { name: "PowerPoint to PDF", route: "/powerpoint-to-pdf" },
      { name: "PDF to JPG", route: "/pdf-to-jpg" },
      { name: "Image to PDF", route: "/img-to-pdf" },
      { name: "PDF to Text", route: "/pdf-to-text" },
      { name: "Text to PDF", route: "/text-to-pdf" },
      { name: "HTML to PDF", route: "/html-to-pdf" },
      { name: "PDF to HTML", route: "/pdf-to-html" }
    ]
  },
  {
    category: "Organize PDF",
    items: [
      { name: "Merge PDF", route: "/merge-pdf" },
      { name: "Split PDF", route: "/split-pdf" },
      { name: "Compress PDF", route: "/compress-pdf" },
      { name: "Rotate PDF", route: "/rotate-pdf" },
      { name: "Extract Pages", route: "/extract-pages" },
      { name: "Delete Pages", route: "/delete-pages" }
    ]
  },
  {
    category: "Security",
    items: [
      { name: "Protect PDF", route: "/protect-pdf" },
      { name: "Unlock PDF", route: "/unlock-pdf" },
      { name: "Watermark PDF", route: "/watermark-pdf" }
    ]
  },
  {
    category: "Advanced PDF Tools",
    items: [
      { name: "OCR PDF", route: "/ocr-pdf" },
      { name: "Validate PDF", route: "/validate-pdf" },
      { name: "Redact PDF", route: "/redact-pdf" },
      { name: "Repair PDF", route: "/repair-pdf" }
    ]
  }
];

const categoryIcons: Record<string, any> = {
  "Convert PDF": RefreshCw,
  "Organize PDF": FileText,
  Security: Shield,
  "Advanced PDF Tools": ScanLine
};

export default function PublicPDFTools() {
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  const allTools = useMemo(
    () =>
      tools.flatMap((group) =>
        group.items.map((tool) => ({
          ...tool,
          category: group.category
        }))
      ),
    []
  );

  const categories = [
    "All",
    ...tools.map((item) => item.category)
  ];

  const filteredTools = allTools.filter((tool) => {
    const matchesSearch = tool.name
      .toLowerCase()
      .includes(search.toLowerCase());

    const matchesCategory =
      activeCategory === "All"
        ? true
        : tool.category === activeCategory;

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-slate-50">

      {/* HERO */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900">

        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 left-0 h-72 w-72 rounded-full bg-blue-500 blur-3xl" />
          <div className="absolute bottom-0 right-0 h-72 w-72 rounded-full bg-cyan-500 blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-6 py-24">

          <div className="text-center">

            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-5 py-2 text-white text-sm mb-6 border border-white/10">
              <Zap size={16} />
              58+ Professional PDF Tools
            </div>

            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
              Every PDF Tool
              <br />
              You Need
            </h1>

            <p className="max-w-3xl mx-auto text-slate-300 text-lg md:text-xl mb-10">
              Convert, Merge, Split, Compress, Protect,
              OCR and Manage PDF Documents Online.
            </p>

            <div className="flex flex-col md:flex-row justify-center gap-4">

              <button
                className="bg-white text-slate-900 px-8 py-4 rounded-xl font-semibold hover:scale-105 transition"
              >
                Select PDF File
              </button>

              <button
                className="border border-white/20 text-white px-8 py-4 rounded-xl font-semibold hover:bg-white/10 transition"
              >
                Browse Tools
              </button>

            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16">

              <div className="text-center">
                <h3 className="text-3xl font-bold text-white">58+</h3>
                <p className="text-slate-300">PDF Tools</p>
              </div>

              <div className="text-center">
                <h3 className="text-3xl font-bold text-white">100K+</h3>
                <p className="text-slate-300">Documents</p>
              </div>

              <div className="text-center">
                <h3 className="text-3xl font-bold text-white">99.9%</h3>
                <p className="text-slate-300">Uptime</p>
              </div>

              <div className="text-center">
                <h3 className="text-3xl font-bold text-white">Secure</h3>
                <p className="text-slate-300">Processing</p>
              </div>

            </div>

          </div>
        </div>
      </section>

      {/* SEARCH */}
      <section className="max-w-7xl mx-auto px-6 py-12">

        <div className="bg-white rounded-3xl p-6 shadow-sm border">

          <div className="relative">
            <Search
              className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400"
              size={22}
            />

            <input
              type="text"
              placeholder="Search PDF Tools..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-14 pl-14 pr-4 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex flex-wrap gap-3 mt-6">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`px-5 py-2 rounded-full text-sm font-medium transition ${
                  activeCategory === category
                    ? "bg-blue-600 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                {category}
              </button>
            ))}
          </div>

        </div>
      </section>

      {/* TOOL GRID */}
      <section className="max-w-7xl mx-auto px-6 pb-20">

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">

          {filteredTools.map((tool, index) => {
            const Icon =
              categoryIcons[tool.category] || FileText;

            return (
              <div
                key={index}
                onClick={() => navigate(tool.route)}
                className="cursor-pointer bg-white border rounded-3xl p-6 shadow-sm hover:shadow-xl transition"
              >
                <div className="h-14 w-14 rounded-2xl bg-blue-100 flex items-center justify-center mb-5">
                  <Icon className="text-blue-600" size={24} />
                </div>

                <h3 className="font-bold text-lg mb-2">
                  {tool.name}
                </h3>

                <p className="text-sm text-slate-500 mb-5">
                  {tool.category}
                </p>

                <div className="flex items-center gap-2 text-blue-600 font-medium">
                  Open Tool
                  <ArrowRight size={16} />
                </div>
              </div>
            );
          })}
 
        </div>

      </section>

      {/* FEATURES */}
      <section className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-6">

          <div className="text-center mb-14">
            <h2 className="text-4xl font-bold mb-4">
              Why Choose Documantra PDF Tools?
            </h2>

            <p className="text-slate-600 max-w-2xl mx-auto">
              Enterprise-grade PDF processing with speed,
              security and reliability.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">

            <div className="bg-slate-50 rounded-3xl p-8 text-center">
              <Zap className="mx-auto text-blue-600 mb-4" size={40} />
              <h3 className="font-bold text-xl mb-3">
                Lightning Fast
              </h3>
              <p className="text-slate-600">
                Process PDFs within seconds using optimized infrastructure.
              </p>
            </div>

            <div className="bg-slate-50 rounded-3xl p-8 text-center">
              <Lock className="mx-auto text-green-600 mb-4" size={40} />
              <h3 className="font-bold text-xl mb-3">
                Secure Processing
              </h3>
              <p className="text-slate-600">
                Documents remain encrypted and protected.
              </p>
            </div>

            <div className="bg-slate-50 rounded-3xl p-8 text-center">
              <Globe className="mx-auto text-purple-600 mb-4" size={40} />
              <h3 className="font-bold text-xl mb-3">
                Cloud Based
              </h3>
              <p className="text-slate-600">
                Access tools from anywhere without installing software.
              </p>
            </div>

            <div className="bg-slate-50 rounded-3xl p-8 text-center">
              <CheckCircle className="mx-auto text-orange-600 mb-4" size={40} />
              <h3 className="font-bold text-xl mb-3">
                Professional Quality
              </h3>
              <p className="text-slate-600">
                Accurate PDF conversion and editing tools.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="py-20 bg-slate-900">
        <div className="max-w-7xl mx-auto px-6">

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">

            <div>
              <h3 className="text-5xl font-bold text-white mb-2">
                58+
              </h3>
              <p className="text-slate-300">
                PDF Tools
              </p>
            </div>

            <div>
              <h3 className="text-5xl font-bold text-white mb-2">
                100K+
              </h3>
              <p className="text-slate-300">
                Files Processed
              </p>
            </div>

            <div>
              <h3 className="text-5xl font-bold text-white mb-2">
                99.9%
              </h3>
              <p className="text-slate-300">
                Uptime
              </p>
            </div>

            <div>
              <h3 className="text-5xl font-bold text-white mb-2">
                Secure
              </h3>
              <p className="text-slate-300">
                Enterprise Grade
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* E-SIGN CTA */}
      <section className="py-24 bg-gradient-to-r from-blue-600 to-indigo-700">

        <div className="max-w-5xl mx-auto px-6 text-center">

          <h2 className="text-5xl font-bold text-white mb-6">
            Need Electronic Signatures?
          </h2>

          <p className="text-xl text-blue-100 mb-10">
            Upload PDF → Add Signers → Send → Sign
          </p>

          <button
            onClick={() => navigate("/sign")}
            className="bg-white text-slate-900 px-10 py-4 rounded-2xl font-bold hover:scale-105 transition"
          >
            Start E-Sign Now
          </button>

        </div>

      </section>

      {/* SIMPLE FOOTER */}
      <footer className="bg-slate-950 text-white">

        <div className="max-w-7xl mx-auto px-6 py-16">

          <div className="grid md:grid-cols-4 gap-10">

            <div>
              <h3 className="text-2xl font-bold mb-4">
                Documantra
              </h3>

              <p className="text-slate-400">
                Professional PDF Tools and Electronic Signature Platform.
              </p>
            </div>

            <div>
              <h4 className="font-bold mb-4">
                PDF Tools
              </h4>

              <ul className="space-y-2 text-slate-400">
                <li>Merge PDF</li>
                <li>Split PDF</li>
                <li>Compress PDF</li>
                <li>OCR PDF</li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold mb-4">
                Resources
              </h4>

              <ul className="space-y-2 text-slate-400">
                <li>Documentation</li>
                <li>Support</li>
                <li>Security</li>
                <li>Pricing</li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold mb-4">
                Contact
              </h4>

              <ul className="space-y-2 text-slate-400">
                <li>connect@documantra.in</li>
                <li>India</li>
              </ul>
            </div>

          </div>

          <div className="border-t border-slate-800 mt-12 pt-6 text-center text-slate-500">
            © 2026 Documantra. All Rights Reserved.
          </div>

        </div>

      </footer>

    </div>
  );
}

