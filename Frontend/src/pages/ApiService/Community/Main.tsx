import React, { useCallback, useEffect, useState } from 'react'
import { toast } from "react-hot-toast";
import { MessageSquare, Users, Eye, ThumbsUp, Clock, Search,Plus,CheckCircle,Pin,Tag} from 'lucide-react';
import { apiServiceApi } from '../../../services/apiHelper';
import LoadingSpinner from '../../../components/ApiServices/Spinner';
import { useBrandSettings } from '../../../hooks/useBrandSettings';

const Main: React.FC = () => {
  const { name: brandName } = useBrandSettings();
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [visibleCount, setVisibleCount] = useState(3); 
  const [categories, setCategories] = useState<
  { id: string; name: string; count: number }[]
>([]);
  const [filteredPosts, setFilteredPosts] = useState([]);
  const [showNewPostModal, setShowNewPostModal] = useState(false);
  const [stats, setStats] = useState<{ totalUsers?: number; totalPosts?: number; postsThisWeek?: number }>({});

  const fetchPosts = useCallback(async () => {
    try {
      const res = await apiServiceApi.get('/api/api-service/community/all-posts');
      const data = res.data;
      setFilteredPosts(data);
    // Category count calculation
      const categoryMap: { [key: string]: number } = {};
      data.forEach((post:any) => {
        if (categoryMap[post.category]) {
          categoryMap[post.category]++;
        } else {
          categoryMap[post.category] = 1;
        }
      });

      const categoriesArr = Object.entries(categoryMap).map(([name, count]) => ({
        id: name,
        name: name.charAt(0).toUpperCase() + name.slice(1),
        count
      }));
      setCategories(categoriesArr);

      console.log(data);
    } catch (err:any) {
      const errorMsg =
        err?.response?.data?.message ||
        err?.data?.message ||
        err?.message ||
        "Something went wrong!";
      toast.error(errorMsg);
    }
  },[]);

useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

useEffect(() => {
  
  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await apiServiceApi.get('/api/api-service/community/stats');
      const data = res.data;
      console.log(data);
      setStats(data);
    } catch (err:any) {
      const errorMsg =
        err?.response?.data?.message ||
        err?.data?.message ||
        err?.message ||
        "Something went wrong!";
      toast.error(errorMsg);
    }finally {
      setLoading(false);
    }
  };

  fetchStats();
}, []);

const handleLoadMore = () => {
  setVisibleCount(prev => prev + 3); 
};

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Developer Community</h1>
          <p className="text-gray-600">
            Connect with other developers, share knowledge, and get help with {brandName} API
          </p>
        </div>
        <button
          onClick={() => setShowNewPostModal(true)}
          className="btn btn-primary flex items-center space-x-2"
        >
          <Plus className="h-5 w-5" />
          <span>New Post</span>
        </button>
      </div>

      <div className="grid lg:grid-cols-4 gap-8">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          {/* Search */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search discussions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Categories */}
          <div className="bg-[#F7F3EE] rounded-lg border border-gray-200 p-4 mb-6">
          <h3 className="font-semibold text-gray-900 mb-4">Categories</h3>
          <div className="space-y-2">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                  selectedCategory === category.id
                    ? 'bg-primary-100 text-primary-700'
                    : 'hover:bg-[#F5F2EE] text-gray-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span>{category.name}</span>
                  <span className="text-sm text-gray-500">{category.count}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

          {/* Community Stats */}
         {loading ? (
        <LoadingSpinner />
          ) : (
            <div className="bg-[#F7F3EE] rounded-lg border border-gray-200 p-4">
              <h3 className="font-semibold text-gray-900 mb-4">Community Stats</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Users className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-600">Members</span>
                  </div>
                  <span className="font-medium text-gray-900">{stats?.totalUsers ?? '-'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <MessageSquare className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-600">Posts</span>
                  </div>
                  <span className="font-medium text-gray-900">{stats?.totalPosts ?? '-'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-600">This Week</span>
                  </div>
                  <span className="font-medium text-gray-900">{stats?.postsThisWeek ?? '-'}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          {/* Posts List */}
          <div className="space-y-4">
            {filteredPosts.slice(0, visibleCount).map((post:any) => (
              <div key={post.id} className="bg-[#F7F3EE] rounded-lg border border-gray-200 p-6 hover:border-gray-300 transition-colors">
                <div className="flex items-start space-x-4">

                  {/* Post Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        {post.isSticky && (
                          <Pin className="h-4 w-4 text-yellow-500" />
                        )}
                        <h3 className="text-lg font-semibold text-gray-900 hover:text-primary-600 cursor-pointer">
                          {post.title}
                        </h3>
                        {post.isSolved && (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        )}
                      </div>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        post.category === 'api' ? 'bg-blue-100 text-blue-800' :
                        post.category === 'webhooks' ? 'bg-[#DCFCE7] text-purple-800' :
                        post.category === 'announcements' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {post.category.charAt(0).toUpperCase() + post.category.slice(1)}
                      </span>
                    </div>

                    <p className="text-gray-600 mb-3 line-clamp-2">{post.content}</p>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-2 mb-3">
                      {post.tags.map((tag:any) => (
                        <span
                          key={tag}
                          className="inline-flex items-center space-x-1 px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
                        >
                          <Tag className="h-3 w-3" />
                          <span>{tag}</span>
                        </span>
                      ))}
                    </div>

                    {/* Post Meta */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <div className="flex items-center space-x-1">
                          <span className="font-medium text-gray-900">{post.authorName}</span>
                          <span>•</span>
                          <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <div className="flex items-center space-x-1">
                          <MessageSquare className="h-4 w-4 cursor-pointer" />
                          <span>{post.replies}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Eye className="h-4 w-4 cursor-pointer" />
                          <span>{post.views}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <ThumbsUp className="h-4 w-4 cursor-pointer" />
                          {/* <span>{post.likes}</span> */}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Load More */}
          {visibleCount < filteredPosts.length && (
            <div className="text-center mt-8">
              <button className="btn btn-outline" onClick={handleLoadMore}>
                Load More Posts
              </button>
            </div>
          )}
        </div>
      </div>

      {/* New Post Modal */}
      {showNewPostModal && (
        <NewPostModal onClose={() => setShowNewPostModal(false)} />
      )}
    </div>
  )
}

const NewPostModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: '',
    tags: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
   e.preventDefault();
  setLoading(true);
  const payload = {
    title: formData.title,
    content: formData.content,
    category: formData.category,
    tags: formData.tags.split(',').map(tag => tag.trim()).filter(Boolean) 
  };
  try {
    const res = await apiServiceApi.post('/api/api-service/community/create', payload);
    if (res.status === 201 || res.data.message) {
      toast.success("Post created!");
      onClose();
    } else {
      toast.error("Post creation failed!");
    }
  } catch (err:any) {
  const errorMsg =
    err?.response?.data?.message || // For Axios-style errors
    err?.data?.message ||           // For fetch/custom error object
    err?.message ||                 // Fallback: generic JS error
    "Something went wrong!";
  toast.error(errorMsg);
  }
  setLoading(false);
};

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#F7F3EE]/10 backdrop-blur-sm">
      <div className="bg-[#F7F3EE] rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Create New Post</h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Title
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
               className="input w-full border border-gray-300 h-10 rounded p-1"
              placeholder="What's your question or topic?"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
              className="input w-full border border-gray-300 h-10 rounded p-1"
            >
              <option value="general">General</option>
              <option value="api">API</option>
              <option value="webhooks">Webhooks</option>
              <option value="sdk">SDK</option>
              <option value="announcements">Announcements</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Content
            </label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
              className="input w-full border border-gray-300 h-40 rounded p-1"
              placeholder="Describe your question or share your knowledge..."
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tags (comma-separated)
            </label>
            <input
              type="text"
              value={formData.tags}
              onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
               className="input w-full border border-gray-300 h-10 rounded p-1"
              placeholder="api, authentication, webhooks"
            />
          </div>

          <div className="flex justify-end space-x-3">
            <button type="button" onClick={onClose} className="btn btn-outline">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
               {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" stroke="#fff" strokeWidth="4" fill="none" />
                  </svg>
                  Creating...
                </span>
              ) : (
                "Create Post"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default Main;