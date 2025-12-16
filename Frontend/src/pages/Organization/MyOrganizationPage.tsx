import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building, Plus, Users } from 'lucide-react';
import { MyOrganizationCard } from '../../components/Organization/MyOrganizationCard';
import { SharedOrganizationCard } from '../../components/Organization/SharedOrganizationCard';
import type { Organization } from '../../types/organization';
import { organizationApi } from '../../services/apiHelper';

const MyOrganizationPage: React.FC = () => {
  const navigate = useNavigate();
  const [myOrganization, setMyOrganization] = React.useState<Organization | null>(null);
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
          setMyOrganization(payload[0] ?? null);
        } else {
          setMyOrganization(payload ?? null);
        }
      }
      // Handle the response data as needed
    } catch (error) {
      console.error('Error fetching user organizations:', error);
    }
  };

  const sharedOrganizations: Organization[] = [
    {
      _id: '2',
      name: 'Tech Solutions Inc',
      logo: 'https://via.placeholder.com/150',
      website: 'https://www.techsolutions.com',
      gst: 'GST987654321',
      status: 'APPROVED',
      createdBy: 'user456',
      createdAt: new Date().toISOString(),
      verificationDocuments: []
    },
    {
      _id: '3',
      name: 'Global Enterprises',
      logo: 'https://via.placeholder.com/150',
      website: 'https://www.globalent.com',
      gst: 'GST456789123',
      status: 'APPROVED',
      createdBy: 'user789',
      createdAt: new Date().toISOString(),
      verificationDocuments: []
    }
  ];

  // Determine if user has an organization
  const hasOrganization = !!myOrganization;

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
                <h1 className="text-3xl font-bold text-gray-900">My Organizations</h1>
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
              {myOrganization && (
                <MyOrganizationCard
                  organization={myOrganization}
                  onClick={() => {
                    // Navigate to organization details
                    console.log('Navigate to organization details');
                  }}
                />
              )}
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
              {sharedOrganizations.length}
            </span>
          </div>

          {sharedOrganizations.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {sharedOrganizations.map((org) => (
                <SharedOrganizationCard
                  key={org._id}
                  organization={org}
                  role="Member"
                  onClick={() => {
                    // Navigate to shared organization details
                    console.log('Navigate to shared organization details');
                  }}
                />
              ))}
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
    </div>
  );
};

export default MyOrganizationPage;

