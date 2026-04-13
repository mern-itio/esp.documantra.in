import { 
  BarChart3, 
  TrendingUp, 
  HardDrive, 
  FileText, 
  Share2, 
  Eye,
  Download,
  Clock
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { MOCK_STATS } from '../../common/lib/mockData';
import { useDocumentStore } from '../../common/store/documentStore';
import { formatFileSize } from '../../common/lib/utils';

export function DocumentAnalytics() {
  const { documents, currentUser, userPermissions } = useDocumentStore();
  const { used, total, percentage } = useDocumentStore(state => state.getStorageStats());

  // Calculate stats
  const totalDocuments = documents.length;
  const sharedDocuments = documents.filter(doc => doc.shared).length;
  // const favoriteDocuments = documents.filter(doc => doc.isFavorite).length;
  const totalViews = documents.reduce((sum, doc) => sum + doc.views, 0);
  // const totalDownloads = documents.reduce((sum, doc) => sum + doc.downloads, 0);
  if (!currentUser) {
    return null; // or return a loading state
  }
  const stats = [
    {
      title: 'Total Documents',
      value: totalDocuments.toString(),
      icon: FileText,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-50 dark:bg-blue-950/40'
    },
    {
      title: 'Storage Used',
      value: formatFileSize(used),
      subtitle: total === -1 ? 'Unlimited' : `${percentage}% of ${formatFileSize(total)}`,
      icon: HardDrive,
      color: 'text-emerald-600 dark:text-emerald-400',
      bgColor: 'bg-emerald-50 dark:bg-emerald-950/40'
    },
    {
      title: 'Shared Documents',
      value: sharedDocuments.toString(),
      icon: Share2,
      color: 'text-violet-600 dark:text-violet-400',
      bgColor: 'bg-violet-50 dark:bg-violet-950/40'
    },
    {
      title: 'Total Views',
      value: totalViews.toString(),
      icon: Eye,
      color: 'text-orange-600 dark:text-orange-400',
      bgColor: 'bg-orange-50 dark:bg-orange-950/40'
    }
  ];

  if (!userPermissions.analytics) {
    return (
      <div className="p-8 text-center">
        <BarChart3 className="w-16 h-16 text-muted-foreground/40 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-foreground mb-2">Analytics Access Required</h3>
        <p className="text-muted-foreground">You need admin permissions to view analytics.</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Document Analytics</h1>
        <p className="text-muted-foreground mt-1">
          {currentUser.role === 'super_admin' 
            ? 'Platform-wide document insights and usage statistics'
            : 'Team document insights and usage statistics'
          }
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className={`p-2 rounded-lg ${stat.bgColor} mr-4`}>
                    <Icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                    <p className="text-sm text-muted-foreground">{stat.title}</p>
                    {stat.subtitle && (
                      <p className="text-xs text-muted-foreground/90 mt-1">{stat.subtitle}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Storage Usage */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-foreground">
            <HardDrive className="w-5 h-5 text-primary" />
            <span>Storage Usage</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">Current Usage</span>
              <span className="text-sm text-muted-foreground">
                {formatFileSize(used)} {total !== -1 && `/ ${formatFileSize(total)}`}
              </span>
            </div>
            {total !== -1 && (
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(percentage, 100)}%` }}
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* File Type Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="text-foreground">File Type Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {MOCK_STATS.storageByType.map((type, index) => (
              <div key={type.type} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-4 h-4 shrink-0 rounded-full ring-1 ring-border" style={{
                    backgroundColor: `hsl(${index * 45}, 70%, 50%)`
                  }} />
                  <span className="text-sm font-medium text-foreground uppercase">
                    {type.type}
                  </span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-foreground">{type.count} files</p>
                  <p className="text-xs text-muted-foreground">{formatFileSize(type.size)}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-foreground">
            <Clock className="w-5 h-5 text-primary" />
            <span>Recent Activity</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {MOCK_STATS.recentActivity.slice(0, 5).map((activity) => (
              <div key={activity.id} className="flex items-center space-x-3 py-2">
                <div className="flex-shrink-0">
                  {activity.type === 'upload' && <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />}
                  {activity.type === 'download' && <Download className="w-4 h-4 text-blue-600 dark:text-blue-400" />}
                  {activity.type === 'share' && <Share2 className="w-4 h-4 text-violet-600 dark:text-violet-400" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground">
                    <span className="font-medium">{activity.userName}</span>
                    {' '}
                    {activity.type === 'upload' && 'uploaded'}
                    {activity.type === 'download' && 'downloaded'}
                    {activity.type === 'share' && 'shared'}
                    {' '}
                    <span className="font-medium truncate">{activity.documentName}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(activity.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Top Documents */}
      <Card>
        <CardHeader>
          <CardTitle className="text-foreground">Most Viewed Documents</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {documents
              .sort((a, b) => b.views - a.views)
              .slice(0, 5)
              .map((doc, index) => (
                <div key={doc.id} className="flex items-center justify-between py-2">
                  <div className="flex items-center space-x-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-muted rounded-full flex items-center justify-center text-xs font-medium text-muted-foreground">
                      {index + 1}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-foreground truncate max-w-xs">
                        {doc.name}
                      </p>
                      <p className="text-xs text-muted-foreground">{formatFileSize(doc.size)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-foreground">{doc.views} views</p>
                    <p className="text-xs text-muted-foreground">{doc.downloads} downloads</p>
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}