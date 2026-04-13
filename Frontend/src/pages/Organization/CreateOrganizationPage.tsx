import React from 'react';
import { CreateOrganizationForm } from '../../components/Organization/CreateOrganizationForm';

const CreateOrganizationPage: React.FC = () => {
  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-background via-muted/40 to-muted/60 dark:from-background dark:via-background dark:to-muted/30 mt-4 sm:px-6 lg:px-8 pb-10">
      <CreateOrganizationForm />
    </div>
  );
};

export default CreateOrganizationPage;

