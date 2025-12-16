import React from 'react';
import { CreateOrganizationForm } from '../../components/Organization/CreateOrganizationForm';

const CreateOrganizationPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <CreateOrganizationForm />
    </div>
  );
};

export default CreateOrganizationPage;

