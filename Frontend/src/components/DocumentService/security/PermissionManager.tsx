import React, { useState } from 'react';
import { 
  Shield, 
  Users, 
  Lock, 
  Eye, 
  Edit, 
  Trash2,
  Plus,
  Search,
  Filter,
  Clock,
  AlertTriangle
} from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { formatDate } from '../../common/lib/utils';

interface Permission {
  id: string;
  resourceType: 'document' | 'folder' | 'workflow' | 'system';
  resourceId: string;
  resourceName: string;
  userId: string;
  userEmail: string;
  userName: string;
  permissionLevel: 'view' | 'comment' | 'edit' | 'admin' | 'owner';
  grantedBy: string;
  grantedAt: string;
  expiresAt?: string;
  conditions?: {
    ipRestriction?: string[];
    timeRestriction?: {
      startTime: string;
      endTime: string;
      days: string[];
    };
    deviceRestriction?: boolean;
  };
}

interface PermissionManagerProps {
  permissions: Permission[];
  onGrantPermission: (permission: Omit<Permission, 'id' | 'grantedAt'>) => void;
  onRevokePermission: (permissionId: string) => void;
  onUpdatePermission: (permissionId: string, updates: Partial<Permission>) => void;
}

const mockPermissions: Permission[] = [
  {
    id: 'perm-1',
    resourceType: 'document',
    resourceId: 'doc-1',
    resourceName: 'Financial Report Q4.pdf',
    userId: 'user-1',
    userEmail: 'john.doe@example.com',
    userName: 'John Doe',
    permissionLevel: 'edit',
    grantedBy: 'admin@example.com',
    grantedAt: '2024-07-01T10:00:00Z',
    expiresAt: '2024-08-01T10:00:00Z'
  },
  {
    id: 'perm-2',
    resourceType: 'folder',
    resourceId: 'folder-1',
    resourceName: 'Legal Documents',
    userId: 'user-2',
    userEmail: 'jane.smith@example.com',
    userName: 'Jane Smith',
    permissionLevel: 'view',
    grantedBy: 'admin@example.com',
    grantedAt: '2024-06-15T14:30:00Z',
    conditions: {
      ipRestriction: ['192.168.1.0/24'],
      timeRestriction: {
        startTime: '09:00',
        endTime: '17:00',
        days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
      }
    }
  },
  {
    id: 'perm-3',
    resourceType: 'workflow',
    resourceId: 'workflow-1',
    resourceName: 'Contract Approval Process',
    userId: 'user-3',
    userEmail: 'mike.johnson@example.com',
    userName: 'Mike Johnson',
    permissionLevel: 'admin',
    grantedBy: 'super.admin@example.com',
    grantedAt: '2024-06-01T09:00:00Z'
  }
];

export function PermissionManager({
  permissions = mockPermissions,
  onGrantPermission,
  onRevokePermission,
  onUpdatePermission
}: PermissionManagerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterLevel, setFilterLevel] = useState<string>('all');
  const [showGrantDialog, setShowGrantDialog] = useState(false);
  const [selectedPermission, setSelectedPermission] = useState<Permission | null>(null);

  const getPermissionIcon = (level: string) => {
    switch (level) {
      case 'view':
        return <Eye className="w-4 h-4 text-blue-600" />;
      case 'comment':
        return <Edit className="w-4 h-4 text-green-600" />;
      case 'edit':
        return <Edit className="w-4 h-4 text-orange-600" />;
      case 'admin':
        return <Shield className="w-4 h-4 text-red-600" />;
      case 'owner':
        return <Lock className="w-4 h-4 text-purple-600" />;
      default:
        return <Eye className="w-4 h-4 text-gray-600" />;
    }
  };

  const getPermissionColor = (level: string) => {
    switch (level) {
      case 'view':
        return 'bg-blue-100 text-blue-800';
      case 'comment':
        return 'bg-green-100 text-green-800';
      case 'edit':
        return 'bg-orange-100 text-orange-800';
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'owner':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const isExpiringSoon = (expiresAt?: string) => {
    if (!expiresAt) return false;
    const expiry = new Date(expiresAt);
    const now = new Date();
    const daysUntilExpiry = (expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    return daysUntilExpiry <= 7 && daysUntilExpiry > 0;
  };

  const isExpired = (expiresAt?: string) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  const filteredPermissions = permissions.filter(permission => {
    const matchesSearch = 
      permission.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      permission.userEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      permission.resourceName.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesType = filterType === 'all' || permission.resourceType === filterType;
    const matchesLevel = filterLevel === 'all' || permission.permissionLevel === filterLevel;
    
    return matchesSearch && matchesType && matchesLevel;
  });

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Shield className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">Permission Management</h2>
          </div>
          <Button
            onClick={() => setShowGrantDialog(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Grant Permission
          </Button>
        </div>

        {/* Search and Filters */}
        <div className="flex items-center space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search users, resources, or permissions..."
              className="pl-10"
            />
          </div>
          
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="all">All Resources</option>
            <option value="document">Documents</option>
            <option value="folder">Folders</option>
            <option value="workflow">Workflows</option>
            <option value="system">System</option>
          </select>
          
          <select
            value={filterLevel}
            onChange={(e) => setFilterLevel(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="all">All Levels</option>
            <option value="view">View</option>
            <option value="comment">Comment</option>
            <option value="edit">Edit</option>
            <option value="admin">Admin</option>
            <option value="owner">Owner</option>
          </select>
        </div>
      </div>

      {/* Permissions List */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Resource
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Permission
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Granted
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Expires
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Conditions
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredPermissions.map((permission) => (
              <tr
                key={permission.id}
                className={`hover:bg-gray-50 ${
                  isExpired(permission.expiresAt) ? 'bg-red-50' : 
                  isExpiringSoon(permission.expiresAt) ? 'bg-yellow-50' : ''
                }`}
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {permission.userName}
                    </div>
                    <div className="text-sm text-gray-500">
                      {permission.userEmail}
                    </div>
                  </div>
                </td>
                
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {permission.resourceName}
                    </div>
                    <div className="text-sm text-gray-500 capitalize">
                      {permission.resourceType}
                    </div>
                  </div>
                </td>
                
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center space-x-2">
                    {getPermissionIcon(permission.permissionLevel)}
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPermissionColor(permission.permissionLevel)}`}>
                      {permission.permissionLevel}
                    </span>
                  </div>
                </td>
                
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {formatDate(permission.grantedAt)}
                  </div>
                  <div className="text-sm text-gray-500">
                    by {permission.grantedBy}
                  </div>
                </td>
                
                <td className="px-6 py-4 whitespace-nowrap">
                  {permission.expiresAt ? (
                    <div className="flex items-center space-x-1">
                      {isExpired(permission.expiresAt) && (
                        <AlertTriangle className="w-4 h-4 text-red-500" />
                      )}
                      {isExpiringSoon(permission.expiresAt) && !isExpired(permission.expiresAt) && (
                        <Clock className="w-4 h-4 text-yellow-500" />
                      )}
                      <span className={`text-sm ${
                        isExpired(permission.expiresAt) ? 'text-red-600' :
                        isExpiringSoon(permission.expiresAt) ? 'text-yellow-600' :
                        'text-gray-900'
                      }`}>
                        {formatDate(permission.expiresAt)}
                      </span>
                    </div>
                  ) : (
                    <span className="text-sm text-gray-500">Never</span>
                  )}
                </td>
                
                <td className="px-6 py-4 whitespace-nowrap">
                  {permission.conditions ? (
                    <div className="flex items-center space-x-1">
                      <Shield className="w-4 h-4 text-blue-500" />
                      <span className="text-xs text-blue-600">Restricted</span>
                    </div>
                  ) : (
                    <span className="text-sm text-gray-500">None</span>
                  )}
                </td>
                
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedPermission(permission)}
                      className="h-8 px-2"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onRevokePermission(permission.id)}
                      className="h-8 px-2 text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredPermissions.length === 0 && (
        <div className="p-8 text-center">
          <Shield className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No permissions found</h3>
          <p className="text-gray-500">
            {searchQuery || filterType !== 'all' || filterLevel !== 'all'
              ? 'Try adjusting your search or filters'
              : 'No permissions have been granted yet'
            }
          </p>
        </div>
      )}

      {/* Grant Permission Dialog */}
      {showGrantDialog && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Grant Permission</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  User Email
                </label>
                <Input placeholder="user@example.com" />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Resource
                </label>
                <select className="w-full p-2 border border-gray-300 rounded">
                  <option>Select resource...</option>
                  <option>Financial Report Q4.pdf</option>
                  <option>Legal Documents Folder</option>
                  <option>Contract Approval Workflow</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Permission Level
                </label>
                <select className="w-full p-2 border border-gray-300 rounded">
                  <option value="view">View</option>
                  <option value="comment">Comment</option>
                  <option value="edit">Edit</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Expires At (Optional)
                </label>
                <Input type="datetime-local" />
              </div>
            </div>
            
            <div className="flex items-center space-x-3 mt-6">
              <Button
                variant="outline"
                onClick={() => setShowGrantDialog(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={() => setShowGrantDialog(false)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Grant Permission
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Permission Dialog */}
      {selectedPermission && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Edit Permission</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  User
                </label>
                <div className="p-2 bg-gray-50 rounded text-sm">
                  {selectedPermission.userName} ({selectedPermission.userEmail})
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Resource
                </label>
                <div className="p-2 bg-gray-50 rounded text-sm">
                  {selectedPermission.resourceName}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Permission Level
                </label>
                <select 
                  className="w-full p-2 border border-gray-300 rounded"
                  defaultValue={selectedPermission.permissionLevel}
                >
                  <option value="view">View</option>
                  <option value="comment">Comment</option>
                  <option value="edit">Edit</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Expires At
                </label>
                <Input 
                  type="datetime-local"
                  defaultValue={selectedPermission.expiresAt ? 
                    new Date(selectedPermission.expiresAt).toISOString().slice(0, 16) : ''
                  }
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-3 mt-6">
              <Button
                variant="outline"
                onClick={() => setSelectedPermission(null)}
              >
                Cancel
              </Button>
              <Button
                onClick={() => setSelectedPermission(null)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Update Permission
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}