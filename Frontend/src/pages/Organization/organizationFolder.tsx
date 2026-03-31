import React, { useEffect, useState } from 'react'
import { Card, CardContent } from '../../components/DocumentService/ui/card';
import Badge from '../../components/DocumentService/ui/badge'
import { Folder, FolderOpen, MailOpen, Plus, User, Users } from 'lucide-react'
import * as LucideIcons from 'lucide-react';
import { CreateFolderModal } from '../../components/Organization/CreateFolderModal';
import { ShareFolderModal } from '../../components/Organization/ShareFolderModal';
import { ShareFolderWithRoleModal } from '../../components/Organization/ShareFolderWithRoleModal';
import { organizationApi } from '../../services/apiHelper';
import toast from 'react-hot-toast';
import { useAuth } from '../../components/AuthService/AuthContext';
import { useNavigate } from 'react-router-dom';

interface SharedPerson {
  _id: string
  name: string
  role?: string
}

interface FolderRecord {
  _id: string
  organization_id: string
  folderName: string
  ownerId: string
  isOwner: boolean
  sharedPeople?: SharedPerson[]
  sharedRoles?: string[]
  envelopes?: string[]
  permissions?: string[]
  color?: string
  icon?: string
  createdAt: string
}

const resolveFolderIcon = (iconName?: string) => {
  const name = iconName?.trim();
  const iconMap = LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string }>>;
  return (name ? iconMap[name] : null) || FolderOpen;
};

const OrganizationFolder: React.FC = () => {
  const { organizationId, accountType } = useAuth();
  const nevigate = useNavigate();
  console.log(accountType);
  const [folders, setFolders] = useState<FolderRecord[]>([]);
  useEffect(() => {
    fetchFolders();
  }, [organizationId]);
  const fetchFolders = async () => {
    try {
      const response = await organizationApi.get(`/api/organization/fetch-organization-folders`);
      if (response.status === 200) {
        console.log('fetched folders:', response.data);
        setFolders(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching folders:', err);
    }
  }
  const handleFolderClick = (folderId: string) => () => {
    // Navigate to folder details page
    console.log('Folder clicked:', folderId);
    nevigate(`/organization/folder/${folderId}`);
  }
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showShareRoleModal, setShowShareRoleModal] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState<FolderRecord | null>(null);
  const handleCreateFolder = async (folderData: { name: string; color: string; icon: string }) => {
    const response = await organizationApi.post(`/api/organization/create-folder`, folderData);
    if (response.status === 201) {
      toast.success('Folder created successfully!');
      await fetchFolders();
    }
  }

  return (
    <div className="bg-white h-full p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Folders</h2>
          <p className="text-sm text-slate-600">All folders for this organization</p>
        </div>
        <div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="w-full inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#260559] to-[#3E2B66] text-white rounded-lg text-sm font-medium hover:from-[#3E2B66] hover:to-[#4d3577] transition-all duration-200 shadow-md hover:shadow-lg whitespace-nowrap">
            <Plus className="w-4 h-4" /> Create Folder
          </button>
        </div>
      </div>
      <CreateFolderModal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
        }}
        onSubmit={async (folderData) => {
          await handleCreateFolder(folderData);
        }}
      />
      <ShareFolderModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        folder={selectedFolder}
        onShared={fetchFolders}
      />
      <ShareFolderWithRoleModal
        isOpen={showShareRoleModal}
        onClose={() => setShowShareRoleModal(false)}
        folder={selectedFolder}
        onShared={fetchFolders}
      />
      <div className="space-y-6">
        {folders.length === 0 ? (
          <div className="text-center py-12">
            <Folder className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No folders yet</h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by creating your first folder to organize your documents.
            </p>
            <div className="mt-6">
              <button
                onClick={() => setShowCreateModal(true)}
                className="w-small inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#260559] to-[#3E2B66] text-white rounded-lg text-sm font-medium hover:from-[#3E2B66] hover:to-[#4d3577] transition-all duration-200 shadow-md hover:shadow-lg whitespace-nowrap">
                <Plus className="w-4 h-4" /> Create Your First Folder
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {folders.map((folder) => {
              const DynamicIcon = resolveFolderIcon(folder?.icon);
              return (
              <Card
                onClick={handleFolderClick(folder?._id)}
                key={folder?._id}
                className="cursor-pointer bg-emerald-50 hover:shadow-lg transition-all duration-200 hover:-translate-y-1"
              >
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div
                      className="w-16 h-16 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: folder?.color || '#E5E7EB' }}
                    >
                      <DynamicIcon className="h-8 w-8 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-gray-900 truncate">
                        {folder?.folderName}
                      </h3>
                      <div className="flex items-center space-x-4 mt-3 text-xs text-gray-500">

                        {/* Envelopes */}
                        <div className="relative group flex items-center space-x-1 cursor-pointer">
                          <MailOpen className="h-3 w-3" />
                          <span>{folder.envelopes?.length || 0}</span>

                          {/* Tooltip */}
                          <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-gray-900 px-2 py-1 text-[10px] text-white opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none">
                            {folder.envelopes?.length || 0} envelopes
                          </div>
                        </div>

                        {/* Shared People */}
                        <div className="relative group flex items-center space-x-1 cursor-pointer" onClick={() => { setSelectedFolder(folder); setShowShareModal(true); }}>
                          <User className="h-3 w-3" />
                          <span>{folder.sharedPeople?.length || 0}</span>
                          <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-gray-900 px-2 py-1 text-[10px] text-white opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none">
                            {folder.sharedPeople?.length || 0} users
                          </div>
                        </div>

                        {/* Shared Roles */}
                        <div className="relative group flex items-center space-x-1 cursor-pointer" onClick={() => { setSelectedFolder(folder); setShowShareRoleModal(true); }}>
                          <Users className="h-3 w-3" />
                          <span>{folder.sharedRoles?.length || 0}</span>
                          <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-gray-900 px-2 py-1 text-[10px] text-white opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none">
                            {folder.sharedRoles?.length || 0} roles
                          </div>
                        </div>

                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                    <div className="flex items-center space-x-2">
                      {folder.isOwner ? (
                        <Badge variant="default">Owner</Badge>
                      ) : (
                        <Badge variant="secondary">Shared</Badge>
                      )}
                    </div>
                    <div className="text-xs text-gray-400">
                      Date: {folder.createdAt.split('T')[0]}
                    </div>
                  </div>
                </CardContent>
              </Card>
              );
            })}
          </div>
        )}

      </div>
    </div>
  )
}

export default OrganizationFolder
