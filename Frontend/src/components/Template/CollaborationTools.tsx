import React, { useState } from 'react';
import { Users, UserPlus, Share2, MessageCircle, Clock, CheckCircle, AlertCircle } from 'lucide-react';

interface Collaborator {
  id: string;
  name: string;
  email: string;
  role: 'owner' | 'editor' | 'viewer' | 'commenter';
  avatar?: string;
  status: 'online' | 'offline';
  lastActive: string;
}

interface Comment {
  id: string;
  author: string;
  content: string;
  timestamp: string;
  resolved: boolean;
  replies?: Comment[];
}

interface CollaborationToolsProps {
  collaborators: Collaborator[];
  comments: Comment[];
  onInviteUser: (email: string, role: string) => void;
  onUpdateRole: (userId: string, role: string) => void;
  onAddComment: (content: string) => void;
  onResolveComment: (commentId: string) => void;
}

export const CollaborationTools: React.FC<CollaborationToolsProps> = ({
  collaborators,
  comments,
  onInviteUser,
  onUpdateRole,
  onAddComment,
  onResolveComment
}) => {
  const [activeTab, setActiveTab] = useState<'collaborators' | 'comments' | 'activity'>('collaborators');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('viewer');
  const [newComment, setNewComment] = useState('');

  const roles = [
    { value: 'owner', label: 'Owner', description: 'Full access and control' },
    { value: 'editor', label: 'Editor', description: 'Can edit and comment' },
    { value: 'commenter', label: 'Commenter', description: 'Can view and comment' },
    { value: 'viewer', label: 'Viewer', description: 'Can only view' }
  ];

  const handleInvite = () => {
    if (inviteEmail) {
      onInviteUser(inviteEmail, inviteRole);
      setInviteEmail('');
      setInviteRole('viewer');
    }
  };

  const handleAddComment = () => {
    if (newComment.trim()) {
      onAddComment(newComment);
      setNewComment('');
    }
  };

  const tabs = [
    { id: 'collaborators', label: 'Collaborators', icon: Users },
    { id: 'comments', label: 'Comments', icon: MessageCircle },
    { id: 'activity', label: 'Activity', icon: Clock }
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900">Collaboration</h2>
        <button className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium">
          <Share2 className="w-4 h-4 mr-2" />
          Share Template
        </button>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <Icon className="w-4 h-4 mr-2" />
              {tab.label}
              {tab.id === 'comments' && comments.filter(c => !c.resolved).length > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full">
                  {comments.filter(c => !c.resolved).length}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Collaborators Tab */}
      {activeTab === 'collaborators' && (
        <div className="space-y-6">
          {/* Invite User */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="text-md font-medium text-gray-900 mb-3">Invite Collaborator</h3>
            <div className="flex space-x-3">
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="Enter email address"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {roles.map(role => (
                  <option key={role.value} value={role.value}>{role.label}</option>
                ))}
              </select>
              <button
                onClick={handleInvite}
                className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Invite
              </button>
            </div>
          </div>

          {/* Collaborators List */}
          <div className="space-y-3">
            {collaborators.map((collaborator) => (
              <div key={collaborator.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 font-medium">
                        {collaborator.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${
                      collaborator.status === 'online' ? 'bg-green-500' : 'bg-gray-400'
                    }`}></div>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{collaborator.name}</div>
                    <div className="text-sm text-gray-500">{collaborator.email}</div>
                    <div className="text-xs text-gray-400">Last active: {collaborator.lastActive}</div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <select
                    value={collaborator.role}
                    onChange={(e) => onUpdateRole(collaborator.id, e.target.value)}
                    className="px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                    disabled={collaborator.role === 'owner'}
                  >
                    {roles.map(role => (
                      <option key={role.value} value={role.value}>{role.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Comments Tab */}
      {activeTab === 'comments' && (
        <div className="space-y-6">
          {/* Add Comment */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="text-md font-medium text-gray-900 mb-3">Add Comment</h3>
            <div className="space-y-3">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Write a comment..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
              />
              <button
                onClick={handleAddComment}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium"
              >
                Add Comment
              </button>
            </div>
          </div>

          {/* Comments List */}
          <div className="space-y-4">
            {comments.map((comment) => (
              <div key={comment.id} className={`border rounded-lg p-4 ${
                comment.resolved ? 'border-green-200 bg-green-50' : 'border-gray-200'
              }`}>
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-gray-900">{comment.author}</span>
                    <span className="text-sm text-gray-500">{comment.timestamp}</span>
                    {comment.resolved && (
                      <span className="flex items-center text-xs text-green-600">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Resolved
                      </span>
                    )}
                  </div>
                  {!comment.resolved && (
                    <button
                      onClick={() => onResolveComment(comment.id)}
                      className="text-sm text-green-600 hover:text-green-700"
                    >
                      Resolve
                    </button>
                  )}
                </div>
                <p className="text-gray-700">{comment.content}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Activity Tab */}
      {activeTab === 'activity' && (
        <div className="space-y-4">
          {[
            { action: 'Template updated', user: 'Sarah Johnson', time: '2 hours ago', type: 'update' },
            { action: 'Comment added', user: 'Mike Chen', time: '4 hours ago', type: 'comment' },
            { action: 'User invited', user: 'Lisa Wang', time: '6 hours ago', type: 'invite' },
            { action: 'Template shared', user: 'John Doe', time: '1 day ago', type: 'share' },
            { action: 'Version created', user: 'Sarah Johnson', time: '2 days ago', type: 'version' }
          ].map((activity, index) => (
            <div key={index} className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                activity.type === 'update' ? 'bg-blue-100 text-blue-600' :
                activity.type === 'comment' ? 'bg-green-100 text-green-600' :
                activity.type === 'invite' ? 'bg-purple-100 text-purple-600' :
                activity.type === 'share' ? 'bg-orange-100 text-orange-600' :
                'bg-gray-100 text-gray-600'
              }`}>
                {activity.type === 'update' && <AlertCircle className="w-4 h-4" />}
                {activity.type === 'comment' && <MessageCircle className="w-4 h-4" />}
                {activity.type === 'invite' && <UserPlus className="w-4 h-4" />}
                {activity.type === 'share' && <Share2 className="w-4 h-4" />}
                {activity.type === 'version' && <Clock className="w-4 h-4" />}
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-900">
                  <span className="font-medium">{activity.user}</span> {activity.action}
                </p>
                <p className="text-xs text-gray-500">{activity.time}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};