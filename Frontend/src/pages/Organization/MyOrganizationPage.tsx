import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building, Plus, Users } from 'lucide-react';
import { MyOrganizationCard } from '../../components/Organization/MyOrganizationCard';
import { SharedOrganizationCard } from '../../components/Organization/SharedOrganizationCard';
import { EditOrganizationModal } from '../../components/Organization/EditOrganizationModal';
import { DeleteOrganizationModal } from '../../components/Organization/DeleteOrganizationModal';
import { TeamsManagementModal } from '../../components/Organization/TeamsManagementModal';
import { VerifyOrganizationModal } from '../../components/Organization/VerifyOrganizationModal';
import type { Organization } from '../../types/organization';
import { organizationApi } from '../../services/apiHelper';

const MyOrganizationPage: React.FC = () => {
  const navigate = useNavigate();
  const [myOrganization, setMyOrganization] = React.useState<Organization | null>(null);
  const [sharedOrganizations, setSharedOrganizations] = React.useState<Organization[]>([]);
  const [showEditModal, setShowEditModal] = React.useState(false);
  const [showDeleteModal, setShowDeleteModal] = React.useState(false);
  const [showTeamsModal, setShowTeamsModal] = React.useState(false);
  const [showVerifyModal, setShowVerifyModal] = React.useState(false);

  useEffect(() => {
     getUserOrganizations();
  }, []);
  const getUserOrganizations = async () => {
    try {
      const response = await organizationApi.get('/api/organization/user-organizations');
      if (response.status === 200) {
        const payload = response.data?.data ?? response.data;
        console.log('User Organizations:', payload);
        if (Array.isArray(payload)) {
          const owner = payload.find((o) => (o as any).isOwner) ?? payload[0] ?? null;
          setMyOrganization(owner ?? null);
          setSharedOrganizations(payload.filter((o) => !(o as any).isOwner));
        } else if (payload) {
          if ((payload as any).isOwner) {
            setMyOrganization(payload);
            setSharedOrganizations([]);
          } else {
            setMyOrganization(null);
            setSharedOrganizations([payload]);
          }
        } else {
          setMyOrganization(null);
          setSharedOrganizations([]);
        }
      }
      // Handle the response data as needed
    } catch (error) {
      console.error('Error fetching user organizations:', error);
    }
  };

  const handleEditSuccess = () => {
    getUserOrganizations();
  };

  const handleDeleteSuccess = () => {
    setMyOrganization(null);
  };

  const handleVerifySuccess = () => {
    getUserOrganizations();
  };

  // `sharedOrganizations` is populated from the API response (see `getUserOrganizations`)

  // Combine organizations into a single array and build element lists in one loop
  const organizations: (Organization & { isOwner?: boolean })[] = [
    ...(myOrganization ? [{ ...myOrganization, isOwner: true }] : []),
    ...sharedOrganizations.map((org) => ({ ...org, isOwner: (org as any).isOwner ?? false }))
  ];

  const myOrgElements: React.ReactElement[] = [];
  const sharedOrgElements: React.ReactElement[] = [];

  organizations.forEach((org) => {
    if (org.isOwner) {
      myOrgElements.push(
        <MyOrganizationCard
          key={org._id}
          organization={org}
          onClick={() => {
            console.log('Navigate to organization details');
          }}
          onEdit={() => setShowEditModal(true)}
          onDelete={() => setShowDeleteModal(true)}
          onTeams={() => setShowTeamsModal(true)}
          onVerify={() => setShowVerifyModal(true)}
        />
      );
    } else {
      sharedOrgElements.push(
        <SharedOrganizationCard
          key={org._id}
          organization={org}
          role="Member"
          onClick={() => {
            console.log('Navigate to shared organization details');
          }}
        />
      );
    }
  });

  const hasOrganization = myOrgElements.length > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-gradient-to-br from-[#260559] to-[#3E2B66] rounded-lg">
                  <Building className="h-6 w-6 text-white" />
                </div>
                <h1 className="text-3xl font-bold text-gray-900">Organizations</h1>
              </div>
              <p className="text-gray-600 ml-14">
                Manage your organizations and access shared organizations
              </p>
            </div>

            {/* Create Organization Button */}
            {!hasOrganization && (
              <button
                onClick={() => navigate('/organization/create')}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#260559] to-[#3E2B66] text-white rounded-lg font-semibold hover:from-[#3E2B66] hover:to-[#260559] shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5"
              >
                <Plus className="w-5 h-5" />
                <span>Create Organization</span>
              </button>
            )}
          </div>
        </div>

        {/* My Organization Section */}
        {hasOrganization ? (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Building className="w-5 h-5 text-[#3E2B66]" />
              <h2 className="text-xl font-semibold text-gray-900">My Organization</h2>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {myOrgElements}
            </div>
          </div>
        ) : (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Building className="w-5 h-5 text-[#3E2B66]" />
              <h2 className="text-xl font-semibold text-gray-900">My Organization</h2>
            </div>
            <div className="bg-white rounded-xl border-2 border-dashed border-gray-300 p-12 text-center">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                <Building className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Organization Yet</h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                Create your organization to get started with team collaboration and document management.
              </p>
              <button
                onClick={() => navigate('/organization/create')}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#260559] to-[#3E2B66] text-white rounded-lg font-semibold hover:from-[#3E2B66] hover:to-[#260559] shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5"
              >
                <Plus className="w-5 h-5" />
                <span>Create Organization</span>
              </button>
            </div>
          </div>
        )}

        {/* Shared Organizations Section */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">Shared Organizations</h2>
            <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">
              {sharedOrgElements.length}
            </span>
          </div>

          {sharedOrgElements.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {sharedOrgElements}
            </div>
          ) : (
            <div className="bg-white rounded-xl border-2 border-dashed border-gray-300 p-12 text-center">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-blue-100 flex items-center justify-center">
                <Users className="w-10 h-10 text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Shared Organizations</h3>
              <p className="text-gray-600 max-w-md mx-auto">
                Organizations that you've been invited to will appear here.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <EditOrganizationModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        organization={myOrganization}
        onSuccess={handleEditSuccess}
      />

      <DeleteOrganizationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        organization={myOrganization}
        onSuccess={handleDeleteSuccess}
      />

      <TeamsManagementModal
        isOpen={showTeamsModal}
        onClose={() => setShowTeamsModal(false)}
        organization={myOrganization}
      />

      <VerifyOrganizationModal
        isOpen={showVerifyModal}
        onClose={() => setShowVerifyModal(false)}
        organization={myOrganization}
        onSuccess={handleVerifySuccess}
      />
    </div>
  );
};

export default MyOrganizationPage;

