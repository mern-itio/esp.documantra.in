import React, { useEffect, useState } from 'react';
import { Handshake, X } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { organizationApi } from '../../services/apiHelper';
import Swal from 'sweetalert2';

interface Invitation {
  _id: string;
  name: string;
  email: string;
  role: {
    name: string;
  };
  organizationId: {
    name: string;
  };
}

const InvitationPage: React.FC = () => {
const invitationid = useParams<{ invUserId: string }>().invUserId;
const [invitation, setInvitation] = useState<Invitation | null>(null);
useEffect(() => {
    getInvitationDetails(invitationid||'');
}, [invitationid]);
const getInvitationDetails = async (id: string) => {
    const result =  await organizationApi.get(`/api/organization/invitation/${id}`);
    if(result.status === 200){
        setInvitation(result.data?.data || null);
    }
}
  const handleAccept = async (id: string) => {
    console.log('Accepted invitation:', id);
    const result = await organizationApi.post(`/api/organization/invitation/accept/${id}`);
    if(result.status === 200){
      Swal.fire({
        title: 'Created!',
        text: 'Invitation Accepted.',
        icon: 'success',
        confirmButtonText: 'OK'
      }).then((result) => {
        if (result.isConfirmed) {
          window.location.href = '/organizations';
        }
      });
    }
  };

  const handleReject = (id: string) => {
    console.log('Rejected invitation:', id);
    // Implement reject logic here
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Invitation Card */}
        { invitation ?(
        <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-lg">
          <div className="text-center">
            {/* Icon */}
            <div className="mx-auto mb-6 w-16 h-16 bg-gradient-to-br from-[#260559] to-[#3E2B66] rounded-full flex items-center justify-center">
              <Handshake className="w-8 h-8 text-white" />
            </div>

            {/* Message */}
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Invitation</h1>
            <p className="text-lg text-gray-700 mb-8">
              Hi, {invitation?.name} you have been invited to access {invitation?.organizationId?.name}
            </p>

            {/* Buttons */}
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={() => handleAccept(invitation?._id || '')}
                className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors shadow-md hover:shadow-lg"
              >
                <Handshake className="w-5 h-5" />
              </button>
              <button
                onClick={() => handleReject(invitation?._id || '')}
                className="flex items-center gap-2 px-6 py-3 bg-gray-600 text-white rounded-lg font-semibold hover:bg-gray-700 transition-colors shadow-md hover:shadow-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
        ):(
          <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-lg text-center">
            <p className="text-lg text-gray-700">Access Denied...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default InvitationPage;
