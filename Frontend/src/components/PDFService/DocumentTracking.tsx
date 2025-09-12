import React, { useState, useEffect } from 'react';
import {
  Activity,
  FileText,
  Download,
  Eye,
  Edit,
  Trash2,
  Upload,
  Filter,
  BarChart3,
  TrendingUp,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Plus,
  Copy,
  Clock,
  FileUp,
  Share2,
  ArrowLeft,
  Link2
} from 'lucide-react';
import { Button } from '../DocumentService/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../DocumentService/ui/card';
import { documentTrackingService } from '../../services/documentTrackingService';
import type {
  DocumentTrackingRecord,
  TrackedDocument,
  TrackingFilters,
  DashboardStatsResponse,
} from '../../types/documentTracking';
import { Link } from 'react-router-dom';

const DocumentTracking: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'documents' | 'audit-trail' | 'upload'>('dashboard');
  const [dashboardStats, setDashboardStats] = useState<DashboardStatsResponse | null>(null);
  const [trackedDocuments, setTrackedDocuments] = useState<TrackedDocument[]>([]);
  const [auditTrail, setAuditTrail] = useState<DocumentTrackingRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<TrackingFilters>({
    page: 1,
    limit: 10
  });
  const [showFilters, setShowFilters] = useState(false);

  // Upload state
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [documentName, setDocumentName] = useState('');
  const [expiresInDays, setExpiresInDays] = useState(30);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);

  // Helper function to get current user ID from localStorage
  const getCurrentUserId = (): string => {
    try {
      const userData = localStorage.getItem('userData');
      if (userData) {
        const parsed = JSON.parse(userData);
        return parsed.id || 'anonymous';
      }
    } catch (error) {
      console.error('Error parsing user data from localStorage:', error);
    }
    return 'anonymous';
  };

  // Helper function to get user information (ID and name)
  const getUserInfo = (userId: string): { id: string; name: string } => {
    try {
      // If it's the current user, get from localStorage
      const currentUserData = localStorage.getItem('userData');
      if (currentUserData) {
        const parsed = JSON.parse(currentUserData);
        if (parsed.id === userId) {
          return { id: userId, name: parsed.fullname || 'You' };
        }
      }

      // For other users, we'll show their ID for now
      // In a real app, you might want to fetch user details from the backend
      return { id: userId, name: `User ${userId.substring(0, 8)}...` };
    } catch (error) {
      console.error('Error getting user info:', error);
      return { id: userId, name: 'Unknown User' };
    }
  };

  useEffect(() => {
    loadData();
  }, [activeTab, filters]);

  const loadData = async () => {
    setLoading(true);
    try {
      switch (activeTab) {
        case 'dashboard':
          const stats = await documentTrackingService.getDashboardStats();
          setDashboardStats(stats);
          break;
        case 'documents':
          const documents = await documentTrackingService.getTrackedDocuments(filters);
          setTrackedDocuments(documents.documents);
          break;
        case 'audit-trail':
          const audit = await documentTrackingService.getAuditTrail(filters);
          setAuditTrail(audit.auditTrail);
          break;
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async () => {
    if (!uploadFile || !documentName.trim()) {
      alert('Please select a file and enter a document name');
      return;
    }

    setUploading(true);
    try {
      const result = await documentTrackingService.uploadDocumentForTracking({
        file: uploadFile,
        userId: getCurrentUserId(), // This should come from auth context
        documentName: documentName.trim(),
        expiresInDays
      });

      setUploadSuccess(result.shareableLink);
      setUploadFile(null);
      setDocumentName('');
      setExpiresInDays(30);

      // Refresh documents list
      if (activeTab === 'documents') {
        loadData();
      }
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      // Secure context (HTTPS or localhost)
      navigator.clipboard.writeText(text)
        .then(() => {
          alert("Link copied to clipboard!");
        })
        .catch((err) => {
          console.error("Clipboard copy failed, falling back:", err);
          fallbackCopy(text);
        });
    } else {
      // Non-secure (HTTP or unsupported browser)
      fallbackCopy(text);
    }
  };

  const fallbackCopy = (text: string) => {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    document.body.removeChild(textarea);
    alert("Link copied to clipboard!");
  };


  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'view': return <Eye className="w-4 h-4 text-blue-500" />;
      case 'download': return <Download className="w-4 h-4 text-green-500" />;
      case 'edit': return <Edit className="w-4 h-4 text-yellow-500" />;
      case 'delete': return <Trash2 className="w-4 h-4 text-red-500" />;
      case 'upload': return <FileUp className="w-4 h-4 text-purple-500" />;
      case 'permission_set': return <FileText className="w-4 h-4 text-indigo-500" />;
      case 'metadata_removed': return <FileText className="w-4 h-4 text-orange-500" />;
      case 'compressed': return <FileText className="w-4 h-4 text-teal-500" />;
      case 'optimized': return <FileText className="w-4 h-4 text-pink-500" />;
      default: return <Activity className="w-4 h-4 text-gray-500" />;
    }
  };

  const getTrackingSourceBadge = (source: string) => {
    const colors = {
      automatic: 'bg-blue-100 text-blue-800',
      manual: 'bg-green-100 text-green-800',
      shared_link: 'bg-purple-100 text-purple-800'
    };

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${colors[source as keyof typeof colors] || colors.automatic}`}>
        {source.replace('_', ' ')}
      </span>
    );
  };

  return (
    <div className=" p-2 space-y-6">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center py-6">
            <Link
              to="/pdf-tools"
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Document Tracking</h1>
              <p className="mt-2 text-sm text-gray-600">
                Keep track of your PDF documents and their status with ease
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="mb-6">
        <nav className="flex space-x-8 border-b border-gray-200">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
            { id: 'documents', label: 'Tracked Documents', icon: FileText },
            { id: 'audit-trail', label: 'Audit Trail', icon: Activity },
            { id: 'upload', label: 'Upload & Track', icon: Upload }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${activeTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Dashboard Tab */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold">Dashboard</h2>
              <p className="text-sm text-gray-600 mt-1">
                Welcome, <span className="font-medium text-primary-600">{getUserInfo(getCurrentUserId()).name}</span>
                <span className="text-gray-500 ml-2">({getCurrentUserId()})</span>
              </p>
            </div>
            <Button
              onClick={loadData}
              disabled={loading}
              className="flex items-center space-x-2"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </Button>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <RefreshCw className="w-8 h-8 animate-spin text-primary-500" />
            </div>
          ) : dashboardStats ? (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Documents</CardTitle>
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{dashboardStats.stats.totalDocuments}</div>
                    <p className="text-xs text-muted-foreground">
                      Documents being tracked
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Actions</CardTitle>
                    <Activity className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{dashboardStats.stats.totalActions}</div>
                    <p className="text-xs text-muted-foreground">
                      All tracked activities
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{dashboardStats.stats.recentActivity.length}</div>
                    <p className="text-xs text-muted-foreground">
                      Actions in last 24h
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Top Documents</CardTitle>
                    <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{dashboardStats.stats.topDocuments.length}</div>
                    <p className="text-xs text-muted-foreground">
                      Most active documents
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>Latest document actions across all users</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {dashboardStats.stats.recentActivity.map((activity, index) => {
                      const userInfo = getUserInfo(activity.userId);
                      return (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center space-x-3">
                            {getActionIcon(activity.action)}
                            <div>
                              <p className="font-medium text-sm">{activity.documentName}</p>
                              <p className="text-xs text-gray-500">
                                {activity.action} by <span className="font-medium">{userInfo.name}</span>
                                <span className="text-gray-400 ml-1">({userInfo.id.substring(0, 8)}...)</span>
                              </p>
                            </div>
                          </div>
                          <span className="text-xs text-gray-500">
                            {formatDate(activity.timestamp)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Top Documents */}
              <Card>
                <CardHeader>
                  <CardTitle>Top Documents</CardTitle>
                  <CardDescription>Documents with most activity</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {dashboardStats.stats.topDocuments.map((doc, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <FileText className="w-4 h-4 text-gray-500" />
                          <div>
                            <p className="font-medium text-sm">{doc.documentName}</p>
                            <p className="text-xs text-gray-500">
                              {doc.actionCount} actions
                            </p>
                          </div>
                        </div>
                        <span className="text-xs text-gray-500">
                          Last: {formatDate(doc.lastAction)}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500">No data available</p>
              <div className="mt-4 p-4 bg-blue-50 rounded-lg max-w-md mx-auto">
                <h3 className="font-medium text-blue-800 mb-2">Debug Information</h3>
                <p className="text-sm text-blue-700 mb-2">
                  If you've processed documents with other tools but don't see them here, try:
                </p>
                <ul className="text-sm text-blue-600 text-left space-y-1">
                  <li>• Check the browser console for errors</li>
                  <li>• Verify MongoDB connection in backend logs</li>
                  <li>• Try the refresh button above</li>
                  <li>• Check if documents were processed successfully</li>
                </ul>
                <Button
                  onClick={loadData}
                  className="mt-3 w-full"
                  variant="outline"
                >
                  Try Again
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tracked Documents Tab */}
      {activeTab === 'documents' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <Button onClick={() => setActiveTab('upload')} className="flex items-center space-x-2">
              <Plus className="w-4 h-4" />
              <span>Add Document</span>
            </Button>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <RefreshCw className="w-8 h-8 animate-spin text-primary-500" />
            </div>
          ) : (
            <div className="grid gap-6">
              {trackedDocuments.map((doc) => (
                <Card key={doc._id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <FileText className="w-8 h-8 text-primary-500" />
                        <div>
                          <CardTitle className="text-lg">{doc.documentName}</CardTitle>
                          <CardDescription>
                            {doc.originalFilename} • {doc.totalActions} actions
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getTrackingSourceBadge(doc.trackingSource)}
                        <span className="text-sm text-gray-500">
                          {doc.accessCount} accesses
                        </span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-medium text-sm text-gray-700 mb-2">Document Info</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-500">Type:</span>
                            <span>{doc.documentType.toUpperCase()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Last Accessed:</span>
                            <span>{formatDate(doc.lastAccessed)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Last Action:</span>
                            <span>{formatDate(doc.lastAction)}</span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-medium text-sm text-gray-700 mb-2">Recent Actions</h4>
                        <div className="space-y-1">
                          {doc.actions.slice(0, 3).map((action, index) => (
                            <div key={index} className="flex items-center justify-between text-sm">
                              <div className="flex items-center space-x-2">
                                {getActionIcon(action.action)}
                                <span className="capitalize">{action.action.replace('_', ' ')}</span>
                              </div>
                              <span className="text-gray-500 text-xs">
                                {formatDate(action.timestamp)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {doc.shareableLink && (
                      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Link2 className="w-4 h-4 text-blue-500" />
                            <span className="text-sm font-medium text-blue-700">Shareable Link</span>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => copyToClipboard(doc.shareableLink!)}
                            className="flex items-center space-x-2"
                          >
                            <Copy className="w-4 h-4" />
                            <span>Copy</span>
                          </Button>
                        </div>
                        <p className="text-xs text-blue-600 mt-1 break-all">
                          {doc.shareableLink}
                        </p>
                        {doc.expiresAt && (
                          <div className="flex items-center space-x-2 mt-2 text-xs text-blue-600">
                            <Clock className="w-3 h-3" />
                            <span>Expires: {formatDate(doc.expiresAt)}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Audit Trail Tab */}
      {activeTab === 'audit-trail' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center space-x-2"
              >
                <Filter className="w-4 h-4" />
                <span>Filters</span>
                {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </Button>
              <Button onClick={loadData} disabled={loading} className="flex items-center space-x-2">
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </Button>
            </div>
          </div>

          {showFilters && (
            <Card>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Action Type</label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      value={filters.action || ''}
                      onChange={(e) => setFilters({ ...filters, action: e.target.value || undefined })}
                    >
                      <option value="">All Actions</option>
                      <option value="view">View</option>
                      <option value="download">Download</option>
                      <option value="edit">Edit</option>
                      <option value="upload">Upload</option>
                      <option value="permission_set">Permission Set</option>
                      <option value="metadata_removed">Metadata Removed</option>
                      <option value="compressed">Compressed</option>
                      <option value="optimized">Optimized</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                    <input
                      type="date"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      value={filters.startDate || ''}
                      onChange={(e) => setFilters({ ...filters, startDate: e.target.value || undefined })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                    <input
                      type="date"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      value={filters.endDate || ''}
                      onChange={(e) => setFilters({ ...filters, endDate: e.target.value || undefined })}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {loading ? (
            <div className="flex justify-center py-12">
              <RefreshCw className="w-8 h-8 animate-spin text-primary-500" />
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {auditTrail.map((record) => {
                    const userInfo = getUserInfo(record.userId);
                    return (
                      <div key={record._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          {getActionIcon(record.action)}
                          <div>
                            <p className="font-medium text-sm">{record.documentName}</p>
                            <p className="text-xs text-gray-500">
                              {record.action.replace('_', ' ')} by <span className="font-medium">{userInfo.name}</span>
                              <span className="text-gray-400 ml-1">({userInfo.id.substring(0, 8)}...)</span>
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-xs text-gray-500">
                            {formatDate(record.timestamp)}
                          </span>
                          {record.ipAddress && (
                            <p className="text-xs text-gray-400">{record.ipAddress}</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Upload Tab */}
      {activeTab === 'upload' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold mb-2">Upload Document for Tracking</h2>
            <p className="text-gray-600">
              Upload a PDF document to start tracking its access and usage. You'll get a shareable link that you can send to others.
            </p>
          </div>

          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Document Name</label>
                  <input
                    type="text"
                    placeholder="Enter a descriptive name for the document"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    value={documentName}
                    onChange={(e) => setDocumentName(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">PDF File</label>
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">Maximum file size: 50MB</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Link Expiration</label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    value={expiresInDays}
                    onChange={(e) => setExpiresInDays(parseInt(e.target.value))}
                  >
                    <option value={7}>7 days</option>
                    <option value={30}>30 days</option>
                    <option value={90}>90 days</option>
                    <option value={365}>1 year</option>
                  </select>
                </div>

                <Button
                  onClick={handleUpload}
                  disabled={!uploadFile || !documentName.trim() || uploading}
                  className="w-full"
                >
                  {uploading ? (
                    <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Upload className="w-4 h-4 mr-2" />
                  )}
                  {uploading ? 'Uploading...' : 'Upload & Start Tracking'}
                </Button>
              </div>

              {uploadSuccess && (
                <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center space-x-2 mb-3">
                    <Share2 className="w-5 h-5 text-green-600" />
                    <h3 className="font-medium text-green-800">Document uploaded successfully!</h3>
                  </div>
                  <p className="text-sm text-green-700 mb-3">
                    Your document is now being tracked. Share this link with others to monitor their access:
                  </p>
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={uploadSuccess}
                      readOnly
                      className="flex-1 px-3 py-2 bg-white border border-green-300 rounded-md text-sm"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(uploadSuccess)}
                      className="flex items-center space-x-2"
                    >
                      <Copy className="w-4 h-4" />
                      <span>Copy</span>
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
    // </div>
  );
};

export default DocumentTracking;
