import React, { useEffect, useState } from 'react';
import {  useParams } from 'react-router-dom';
import { Shield, Plus, Edit } from 'lucide-react';
import type { Role } from '../../types/organization';
import { organizationApi } from '../../services/apiHelper';
import CreateRoleModal from '../../components/Organization/CreateRoleModal';

const RolePage: React.FC = () => {
   const { orgId } = useParams<{ orgId: string }>();
  const [roles, setRoles] = React.useState<Role[]>([]);
  const [showCreateRoleModal, setShowCreateRoleModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    try {
      const response = await organizationApi.get(`/api/organization/fetch-roles/${orgId}`);
      setRoles(response.data?.data || response.data || []);
    } catch (error) {
      console.error('Error fetching roles:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-gradient-to-br from-[#260559] to-[#3E2B66] rounded-lg">
                  <Shield className="h-6 w-6 text-white" />
                </div>
                <h1 className="text-3xl font-bold text-gray-900">Roles</h1>
              </div>
              <p className="text-gray-600 ml-14">
                Manage organization roles and their permissions
              </p>
            </div>

            {/* Create Role Button */}
            <button
              onClick={() => setShowCreateRoleModal(true)}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#260559] to-[#3E2B66] text-white rounded-lg font-semibold hover:from-[#3E2B66] hover:to-[#260559] shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5"
            >
              <Plus className="w-5 h-5" />
              <span>Create Role</span>
            </button>
          </div>
        </div>

        {/* Roles Grid */}
        {roles.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {roles.map((role) => (
              <div
                key={role._id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-[#260559] to-[#3E2B66] rounded-lg">
                      <Shield className="h-4 w-4 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">{role.name}</h3>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedRole(role);
                      setShowCreateRoleModal(true);
                    }}
                    className="p-2 text-gray-500 hover:text-[#3E2B66] hover:bg-gray-100 rounded-lg transition-colors"
                    title="Edit Role"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                </div>
                <p className="text-gray-600 text-sm">{role.description || 'No description'}</p>
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Permissions:</h4>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(role.permissions?.permissions || {}).map(([key, value]) => (
                      <span
                        key={key}
                        className={`px-2 py-1 text-xs rounded-full ${
                          value ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {key.replace(/_/g, ' ')}: {value ? 'Yes' : 'No'}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl border-2 border-dashed border-gray-300 p-12 text-center">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
              <Shield className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Roles Yet</h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Create roles to manage permissions within your organization.
            </p>
            <button
              onClick={() => setShowCreateRoleModal(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#260559] to-[#3E2B66] text-white rounded-lg font-semibold hover:from-[#3E2B66] hover:to-[#260559] shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5"
            >
              <Plus className="w-5 h-5" />
              <span>Create Role</span>
            </button>
          </div>
        )}
      </div>
        <CreateRoleModal
        isOpen={showCreateRoleModal}
        onClose={() => {
          setShowCreateRoleModal(false);
          setSelectedRole(null);
        }}
        organizationId={orgId || ''}
        onCreated={fetchRoles}
        role={selectedRole || undefined}
        />
    </div>
  );
};

export default RolePage;    