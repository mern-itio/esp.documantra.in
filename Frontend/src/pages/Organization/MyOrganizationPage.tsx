import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Building2, Plus, Users, Share2 } from 'lucide-react';
import { MyOrganizationCard } from '../../components/Organization/MyOrganizationCard';
import { SharedOrganizationCard } from '../../components/Organization/SharedOrganizationCard';
import { SharedOrganizationDetailModal } from '../../components/Organization/SharedOrganizationDetailModal';
import { OrganizationOwnerDetailModal } from '../../components/Organization/OrganizationOwnerDetailModal';
import { EditOrganizationModal } from '../../components/Organization/EditOrganizationModal';
import { DeleteOrganizationModal } from '../../components/Organization/DeleteOrganizationModal';
import { TeamsManagementModal } from '../../components/Organization/TeamsManagementModal';
import { VerifyOrganizationModal } from '../../components/Organization/VerifyOrganizationModal';
import type { Organization } from '../../types/organization';
import { organizationApi } from '../../services/apiHelper';
import { useAuth } from '../../components/AuthService/AuthContext';

type Tab = 'mine' | 'shared';

const MyOrganizationPage: React.FC = () => {
  const navigate = useNavigate();
  const {switchAccount,accountType} = useAuth();
  const [myOrganization, setMyOrganization] = React.useState<Organization | null>(null);
  const [sharedOrganizations, setSharedOrganizations] = React.useState<Organization[]>([]);
  const [showEditModal, setShowEditModal] = React.useState(false);
  const [showDeleteModal, setShowDeleteModal] = React.useState(false);
  const [showTeamsModal, setShowTeamsModal] = React.useState(false);
  const [showVerifyModal, setShowVerifyModal] = React.useState(false);
  const [selectedSharedOrg, setSelectedSharedOrg] = React.useState<Organization | null>(null);
  const [showOwnerDetailModal, setShowOwnerDetailModal] = React.useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('mine');
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const shouldOpenTeamsModal = React.useRef(false);

  useEffect(() => {
    const addMember = searchParams.get('add-member');
    shouldOpenTeamsModal.current = addMember === 'true';
    if (shouldOpenTeamsModal.current) {
      const params = new URLSearchParams(window.location.search);
      params.delete('add-member');
      navigate({ search: params.toString() }, { replace: true });
    }
    getUserOrganizations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getUserOrganizations = async () => {
    try {
      setLoading(true);
      const response = await organizationApi.get('/api/organization/user-organizations');
      if (response.status === 200) {
        const payload = response.data?.data ?? response.data;
        let owner: Organization | null = null;
        let shared: Organization[] = [];

        if (Array.isArray(payload)) {
          owner = payload.find((o) => (o as any).isOwner) ?? null;
          shared = payload.filter((o) => !(o as any).isOwner);
        } else if (payload) {
          if ((payload as any).isOwner) {
            owner = payload;
            shared = [];
          } else {
            owner = null;
            shared = [payload];
          }
        } else {
          owner = null;
          shared = [];
        }

        setMyOrganization(owner);
        setSharedOrganizations(shared);

        if (shouldOpenTeamsModal.current && owner) {
          setShowTeamsModal(true);
          shouldOpenTeamsModal.current = false;
        }
      }
    } catch (error) {
      console.error('Error fetching user organizations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditSuccess = () => {
    // Dispatch custom event to notify other components (e.g., header) to refresh organizations
    window.dispatchEvent(new CustomEvent('organizations-updated'))
    getUserOrganizations();
  };

  const handleDeleteSuccess = async () => {
    setMyOrganization(null);
    // Dispatch custom event to notify other components (e.g., header) to refresh organizations
    window.dispatchEvent(new CustomEvent('organizations-updated'))
    // Swtich account to User's default account after organization deletion
    if(accountType === 'organization'){
    await switchAccount('user')
    }
    
  };

  const handleVerifySuccess = async () => {
    // Dispatch custom event to notify other components (e.g., header) to refresh organizations
    window.dispatchEvent(new CustomEvent('organizations-updated'))
    await getUserOrganizations();
  };


  const tabs: { id: Tab; label: string; count: number; icon: React.ReactNode }[] = [
    {
      id: 'mine',
      label: 'My Organization',
      count: myOrganization ? 1 : 0,
      icon: <Building2 className="w-4 h-4" />,
    },
    {
      id: 'shared',
      label: 'Shared with me',
      count: sharedOrganizations.length,
      icon: <Share2 className="w-4 h-4" />,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Page Header */}
      <div className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-sm bg-primary flex items-center justify-center shadow-sm">
                <Building2 className="w-5 h-5 text-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground tracking-tight">Organizations</h1>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Manage your workspace and team collaborations
                </p>
              </div>
            </div>

            {!myOrganization && !loading && (
              <button
                onClick={() => navigate('/organization/create')}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-foreground text-sm font-semibold rounded-lg hover:bg-primary/80 transition-colors shadow-sm"
              >
                <Plus className="w-4 h-4" />
                New Organization
              </button>
            )}
          </div>

          {/* Stats strip */}
          {!loading && (
            <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div className="bg-muted rounded-xl border border-gray-200 px-4 py-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Building2 className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">My Organization</p>
                  <p className="text-lg font-bold text-foreground">{myOrganization ? 1 : 0}</p>
                </div>
              </div>
              <div className="bg-muted rounded-xl border border-gray-200 px-4 py-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                  <Share2 className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Shared Access</p>
                  <p className="text-lg font-bold text-foreground">{sharedOrganizations.length}</p>
                </div>
              </div>
              <div className="bg-muted rounded-xl border border-gray-200 px-4 py-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                  <Users className="w-4 h-4 text-emerald-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Total Access</p>
                  <p className="text-lg font-bold text-foreground">
                    {(myOrganization ? 1 : 0) + sharedOrganizations.length}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="mt-6 flex gap-1 border-b border-gray-200 -mb-px">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-[#260559] text-foreground'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300'
                }`}
              >
                {tab.icon}
                {tab.label}
                <span
                  className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold ${
                    activeTab === tab.id
                      ? 'bg-primary text-foreground'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {[1, 2].map((i) => (
              <div key={i} className="bg-card rounded-2xl border border-gray-200 p-6 animate-pulse">
                <div className="flex gap-4 mb-5">
                  <div className="w-14 h-14 rounded-xl bg-card" />
                  <div className="flex-1 space-y-2 pt-1">
                    <div className="h-4 bg-card rounded w-3/4" />
                    <div className="h-3 bg-card rounded w-1/2" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-3 bg-card rounded w-full" />
                  <div className="h-3 bg-card rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : activeTab === 'mine' ? (
          myOrganization ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              <MyOrganizationCard
                organization={myOrganization}
                onEdit={() => setShowEditModal(true)}
                onDelete={() => setShowDeleteModal(true)}
                onTeams={() => setShowTeamsModal(true)}
                onVerify={() => setShowVerifyModal(true)}
                onViewDetails={() => setShowOwnerDetailModal(true)}
              />
            </div>
          ) : (
            <EmptyState
              icon={<Building2 className="w-10 h-10 text-gray-300" />}
              title="No organization yet"
              description="Create your organization to start collaborating with your team, managing documents, and building workflows."
              action={
                <button
                  onClick={() => navigate('/organization/create')}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#260559] text-white text-sm font-semibold rounded-lg hover:bg-[#34106a] transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Create Organization
                </button>
              }
            />
          )
        ) : sharedOrganizations.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {sharedOrganizations.map((org) => (
              <SharedOrganizationCard
                key={org._id}
                organization={org}
                role={(org as any).role || 'Member'}
                onClick={() => setSelectedSharedOrg(org)}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<Share2 className="w-10 h-10 text-gray-300" />}
            title="No shared organizations"
            description="You haven't been added to any organization yet. Ask your organization admin to invite you."
          />
        )}
      </div>

      {/* Owner org detail modal */}
      {myOrganization && (
        <OrganizationOwnerDetailModal
          isOpen={showOwnerDetailModal}
          onClose={() => setShowOwnerDetailModal(false)}
          organization={myOrganization}
        />
      )}

      {/* Shared org detail modal */}
      {selectedSharedOrg && (
        <SharedOrganizationDetailModal
          isOpen={!!selectedSharedOrg}
          onClose={() => setSelectedSharedOrg(null)}
          organization={selectedSharedOrg}
        />
      )}

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

/* ─── Reusable empty state ─── */
const EmptyState: React.FC<{
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}> = ({ icon, title, description, action }) => (
  <div className="flex flex-col items-center justify-center py-20 text-center">
    <div className="w-20 h-20 rounded-2xl bg-gray-100 flex items-center justify-center mb-5">
      {icon}
    </div>
    <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
    <p className="text-sm text-gray-500 max-w-md leading-relaxed mb-6">{description}</p>
    {action}
  </div>
);

export default MyOrganizationPage;
