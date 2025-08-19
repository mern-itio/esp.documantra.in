import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Search, 
  Book, 
  Video, 
  MessageCircle, 
  FileText,
  ChevronRight,
  Star,
  ThumbsUp,
  ThumbsDown,
  ExternalLink,
  Play,
  Clock,
  User
} from 'lucide-react';

interface HelpArticle {
  id: string;
  title: string;
  category: string;
  type: 'article' | 'video' | 'tutorial';
  content: string;
  readTime: string;
  rating: number;
  helpful: number;
  notHelpful: number;
}

interface HelpCategory {
  id: string;
  name: string;
  description: string;
  articleCount: number;
  icon: React.ElementType;
}

interface HelpSystemProps {
  onBack: () => void;
}

export const HelpSystem: React.FC<HelpSystemProps> = ({ onBack }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedArticle, setSelectedArticle] = useState<HelpArticle | null>(null);

  const categories: HelpCategory[] = [
    {
      id: 'getting-started',
      name: 'Getting Started',
      description: 'Learn the basics of using PDF tools',
      articleCount: 12,
      icon: Book
    },
    {
      id: 'conversion',
      name: 'PDF Conversion',
      description: 'Convert PDFs to and from various formats',
      articleCount: 18,
      icon: FileText
    },
    {
      id: 'editing',
      name: 'PDF Editing',
      description: 'Edit text, images, and annotations',
      articleCount: 15,
      icon: MessageCircle
    },
    {
      id: 'security',
      name: 'Security & Protection',
      description: 'Password protection and encryption',
      articleCount: 8,
      icon: Star
    },
    {
      id: 'batch-processing',
      name: 'Batch Processing',
      description: 'Process multiple files simultaneously',
      articleCount: 6,
      icon: Video
    },
    {
      id: 'troubleshooting',
      name: 'Troubleshooting',
      description: 'Common issues and solutions',
      articleCount: 10,
      icon: MessageCircle
    }
  ];

  const articles: HelpArticle[] = [
    {
      id: 'convert-pdf-word',
      title: 'How to Convert PDF to Word',
      category: 'conversion',
      type: 'article',
      content: `Converting PDF to Word documents is one of our most popular features. Here's how to do it:

1. **Upload your PDF file**
   - Click on "PDF to Word" tool
   - Drag and drop your PDF file or click "Choose Files"
   - Wait for the file to upload

2. **Configure conversion settings**
   - Choose output format (DOC or DOCX)
   - Select layout preservation options
   - Enable OCR if needed for scanned documents

3. **Start conversion**
   - Click "Convert" button
   - Wait for processing to complete
   - Download your converted Word document

**Tips for better results:**
- Use high-quality PDF files for best conversion accuracy
- Enable OCR for scanned documents
- Check the preview before downloading`,
      readTime: '3 min read',
      rating: 4.8,
      helpful: 245,
      notHelpful: 12
    },
    {
      id: 'batch-convert',
      title: 'Batch Converting Multiple PDFs',
      category: 'batch-processing',
      type: 'tutorial',
      content: `Process multiple PDF files at once with our batch conversion feature:

1. **Access Batch Processor**
   - Click on "Batch" in the main navigation
   - Select "Create New Job"

2. **Choose conversion tool**
   - Select the conversion tool you want to use
   - Configure settings that will apply to all files

3. **Upload multiple files**
   - Drag and drop multiple PDF files
   - Or use "Choose Files" and select multiple files

4. **Start batch processing**
   - Review your file list
   - Click "Start Processing"
   - Monitor progress in real-time

**Benefits of batch processing:**
- Save time with bulk operations
- Consistent settings across all files
- Progress tracking and error handling`,
      readTime: '5 min read',
      rating: 4.6,
      helpful: 189,
      notHelpful: 8
    },
    {
      id: 'pdf-security',
      title: 'Securing Your PDF Documents',
      category: 'security',
      type: 'article',
      content: `Protect your PDF documents with various security features:

1. **Password Protection**
   - User password: Required to open the document
   - Owner password: Required to modify permissions

2. **Encryption Options**
   - 128-bit AES encryption for standard security
   - 256-bit AES encryption for maximum security

3. **Document Permissions**
   - Restrict printing
   - Prevent copying of text and images
   - Disable editing and form filling
   - Control annotation and commenting

4. **Digital Signatures**
   - Add legally binding digital signatures
   - Verify document authenticity
   - Timestamp signatures for legal compliance

**Best Practices:**
- Use strong passwords with mixed characters
- Choose appropriate encryption level for your needs
- Keep backup copies of passwords securely`,
      readTime: '4 min read',
      rating: 4.9,
      helpful: 312,
      notHelpful: 5
    }
  ];

  const filteredArticles = articles.filter(article => {
    const matchesSearch = searchQuery === '' || 
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.content.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategory === '' || article.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < Math.floor(rating) 
            ? 'text-yellow-400 fill-current' 
            : 'text-gray-300'
        }`}
      />
    ));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Help Center</h1>
            <p className="text-gray-600">Find answers and learn how to use PDF tools effectively</p>
          </div>
        </div>
      </div>

      {!selectedArticle ? (
        <>
          {/* Search */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="relative max-w-2xl mx-auto">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search help articles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Categories */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Categories</h3>
                
                <div className="space-y-2">
                  <button
                    onClick={() => setSelectedCategory('')}
                    className={`w-full flex items-center justify-between p-3 text-left rounded-lg transition-colors ${
                      selectedCategory === ''
                        ? 'bg-blue-50 text-blue-700'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <span className="font-medium">All Articles</span>
                    <span className="text-sm text-gray-500">{articles.length}</span>
                  </button>
                  
                  {categories.map((category) => {
                    const Icon = category.icon;
                    return (
                      <button
                        key={category.id}
                        onClick={() => setSelectedCategory(category.id)}
                        className={`w-full flex items-center justify-between p-3 text-left rounded-lg transition-colors ${
                          selectedCategory === category.id
                            ? 'bg-blue-50 text-blue-700'
                            : 'hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <Icon className="w-4 h-4" />
                          <span className="font-medium">{category.name}</span>
                        </div>
                        <span className="text-sm text-gray-500">{category.articleCount}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Articles List */}
            <div className="lg:col-span-3">
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {selectedCategory 
                      ? categories.find(c => c.id === selectedCategory)?.name 
                      : 'All Articles'
                    } ({filteredArticles.length})
                  </h3>
                </div>

                {filteredArticles.length === 0 ? (
                  <div className="text-center py-12">
                    <Book className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h4 className="text-lg font-medium text-gray-900 mb-2">No articles found</h4>
                    <p className="text-gray-600">Try adjusting your search or browse different categories</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredArticles.map((article) => (
                      <div
                        key={article.id}
                        className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors cursor-pointer"
                        onClick={() => setSelectedArticle(article)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <h4 className="font-semibold text-gray-900">{article.title}</h4>
                              {article.type === 'video' && (
                                <Play className="w-4 h-4 text-blue-600" />
                              )}
                            </div>
                            
                            <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                              {article.content.substring(0, 150)}...
                            </p>
                            
                            <div className="flex items-center space-x-4 text-sm text-gray-500">
                              <div className="flex items-center space-x-1">
                                <Clock className="w-3 h-3" />
                                <span>{article.readTime}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                {renderStars(article.rating)}
                                <span className="ml-1">({article.rating})</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <ThumbsUp className="w-3 h-3" />
                                <span>{article.helpful}</span>
                              </div>
                            </div>
                          </div>
                          
                          <ChevronRight className="w-5 h-5 text-gray-400" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      ) : (
        /* Article View */
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-xl border border-gray-200 p-8">
            {/* Article Header */}
            <div className="mb-8">
              <button
                onClick={() => setSelectedArticle(null)}
                className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 mb-4"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to articles</span>
              </button>
              
              <h1 className="text-3xl font-bold text-gray-900 mb-4">{selectedArticle.title}</h1>
              
              <div className="flex items-center space-x-6 text-sm text-gray-500">
                <div className="flex items-center space-x-1">
                  <Clock className="w-4 h-4" />
                  <span>{selectedArticle.readTime}</span>
                </div>
                <div className="flex items-center space-x-1">
                  {renderStars(selectedArticle.rating)}
                  <span className="ml-1">({selectedArticle.rating})</span>
                </div>
                <div className="flex items-center space-x-1">
                  <User className="w-4 h-4" />
                  <span>DraftнSign Team</span>
                </div>
              </div>
            </div>

            {/* Article Content */}
            <div className="prose max-w-none">
              <div className="whitespace-pre-line text-gray-700 leading-relaxed">
                {selectedArticle.content}
              </div>
            </div>

            {/* Article Footer */}
            <div className="mt-8 pt-8 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Was this article helpful?</h4>
                  <div className="flex items-center space-x-4">
                    <button className="flex items-center space-x-2 px-4 py-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors">
                      <ThumbsUp className="w-4 h-4" />
                      <span>Yes ({selectedArticle.helpful})</span>
                    </button>
                    <button className="flex items-center space-x-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                      <ThumbsDown className="w-4 h-4" />
                      <span>No ({selectedArticle.notHelpful})</span>
                    </button>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button className="flex items-center space-x-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                    <ExternalLink className="w-4 h-4" />
                    <span>Share</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};