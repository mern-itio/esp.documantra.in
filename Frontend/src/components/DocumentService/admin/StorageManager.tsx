import React, { useState } from 'react';
import { 
  HardDrive, 
  Users, 
  TrendingUp, 
  AlertTriangle,
  BarChart3,
  Settings,
  Download,
  Trash2
} from 'lucide-react';
import { useDocumentStore } from '../../store/documentStore';
import { formatFileSize } from '../../lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';

export function StorageManager() {
  const { documents, currentUser } = useDocumentStore();
  const [selectedTimeRange, setSelectedTimeRange] = useState('30d');

  if (currentUser.role !== 'super_admin' && currentUser.role !== 'team_admin') {
    return (
      <div className="p-8 text-center">
        <HardDrive className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Admin Access Required</h3>
        <p className="text-gray-500">You need admin permissions to view storage management.</p>
      </div>
    );
  }

  // Calculate storage statistics
  const totalStorage = documents.reduce((sum, doc) => sum + doc.size, 0);
  const storageLimit = 1073741824000; // 1TB for demo
  const storagePercentage = (totalStorage / storageLimit) * 100;

  // Storage by file type
  const storageByType = documents.reduce((acc, doc) => {
    const type = doc.type.toLowerCase();
    if (!acc[type]) {
      acc[type] = { size: 0, count: 0 };
    }
    acc[type].size += doc.size;
    acc[type].count += 1;
    return acc;
  }, {} as Record<string, { size: number; count: number }>);

  const storageByTypeArray = Object.entries(storageByType)
    .map(([type, data]) => ({ type, ...data }))
    .sort((a, b) => b.size - a.size);

  // Storage by user
  const storageByUser = documents.reduce((acc, doc) => {
    const user = doc.uploadedBy;
    if (!acc[user]) {
      acc[user] = { size: 0, count: 0 };
    }
    acc[user].size += doc.size;
    acc[user].count += 1;
    return acc;
  }, {} as Record<string, { size: number; count: number }>);

  const storageByUserArray = Object.entries(storageByUser)
    .map(([user, data]) => ({ user, ...data }))
    .sort((a, b) => b.size - a.size)
    .slice(0, 10); // Top 10 users

  // Mock organization data
  const organizationData = [
    {
      name: 'Engineering Team',
      users: 25,
      storage: totalStorage * 0.4,
      quota: storageLimit * 0.4,
      documents: Math.floor(documents.length * 0.4)
    },
    {
      name: 'Marketing Team',
      users: 15,
      storage: totalStorage * 0.3,
      quota: storageLimit * 0.3,
      documents: Math.floor(documents.length * 0.3)
    },
    {
      name: 'Sales Team',
      users: 20,
      storage: totalStorage * 0.2,
      quota: storageLimit * 0.2,
      documents: Math.floor(documents.length * 0.2)
    },
    {
      name: 'HR Team',
      users: 8,
      storage: totalStorage * 0.1,
      quota: storageLimit * 0.1,
      documents: Math.floor(documents.length * 0.1)
    }
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Storage Management</h1>
          <p className="text-gray-600 mt-1">
            Monitor and manage storage usage across the platform
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <select
            value={selectedTimeRange}
            onChange={(e) => setSelectedTimeRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
          <Button size="sm">
            <Settings className="w-4 h-4 mr-2" />
            Configure
          </Button>
        </div>
      </div>

      {/* Storage Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <HardDrive className="w-5 h-5" />
              <span>Total Storage</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl font-bold text-gray-900">
                    {formatFileSize(totalStorage)}
                  </span>
                  <span className="text-sm text-gray-500">
                    of {formatFileSize(storageLimit)}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full transition-all duration-300 ${
                      storagePercentage > 90 ? 'bg-red-600' :
                      storagePercentage > 75 ? 'bg-yellow-600' :
                      'bg-blue-600'
                    }`}
                    style={{ width: `${Math.min(storagePercentage, 100)}%` }}
                  />
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  {storagePercentage.toFixed(1)}% used
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5" />
              <span>Growth Rate</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-2xl font-bold text-green-600">+12.5%</div>
              <p className="text-sm text-gray-600">Storage growth this month</p>
              <div className="text-sm text-gray-500">
                +{formatFileSize(totalStorage * 0.125)} added
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5" />
              <span>Alerts</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-2xl font-bold text-yellow-600">3</div>
              <p className="text-sm text-gray-600">Storage warnings</p>
              <div className="text-sm text-gray-500">
                2 users near quota limit
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Storage by File Type */}
      <Card>
        <CardHeader>
          <CardTitle>Storage by File Type</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {storageByTypeArray.map((item, index) => (
              <div key={item.type} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div 
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: `hsl(${index * 45}, 70%, 50%)` }}
                  />
                  <span className="text-sm font-medium text-gray-700 uppercase">
                    {item.type}
                  </span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                    {formatFileSize(item.size)}
                  </p>
                  <p className="text-xs text-gray-500">
                    {item.count} files ({((item.size / totalStorage) * 100).toFixed(1)}%)
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Storage by User and Organization */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Users */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="w-5 h-5" />
              <span>Top Users by Storage</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {storageByUserArray.map((user, index) => (
                <div key={user.user} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                      <span className="text-xs font-medium text-gray-600">
                        {index + 1}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {user.user}
                      </p>
                      <p className="text-xs text-gray-500">
                        {user.count} documents
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">
                      {formatFileSize(user.size)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {((user.size / totalStorage) * 100).toFixed(1)}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Organization Usage */}
        <Card>
          <CardHeader>
            <CardTitle>Organization Usage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {organizationData.map((org, index) => (
                <div key={org.name} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{org.name}</p>
                      <p className="text-xs text-gray-500">
                        {org.users} users • {org.documents} documents
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">
                        {formatFileSize(org.storage)}
                      </p>
                      <p className="text-xs text-gray-500">
                        of {formatFileSize(org.quota)}
                      </p>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${(org.storage / org.quota) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Storage Management Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Storage Management Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button variant="outline" className="h-20 flex flex-col items-center justify-center">
              <Trash2 className="w-6 h-6 mb-2" />
              <span className="text-sm">Cleanup Unused</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col items-center justify-center">
              <BarChart3 className="w-6 h-6 mb-2" />
              <span className="text-sm">Usage Report</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col items-center justify-center">
              <Settings className="w-6 h-6 mb-2" />
              <span className="text-sm">Set Quotas</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col items-center justify-center">
              <Download className="w-6 h-6 mb-2" />
              <span className="text-sm">Export Data</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}