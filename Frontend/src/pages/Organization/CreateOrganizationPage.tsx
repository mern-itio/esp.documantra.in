import React from 'react';
import { CreateOrganizationForm } from '../../components/Organization/CreateOrganizationForm';

const CreateOrganizationPage: React.FC = () => {
  return (
    <div className=" bg-gradient-to-br from-slate-50 via-purple-50/30 to-gray-100 mt-4 sm:px-6 lg:px-8">
      <CreateOrganizationForm />
    </div>
  );
};

export default CreateOrganizationPage;

