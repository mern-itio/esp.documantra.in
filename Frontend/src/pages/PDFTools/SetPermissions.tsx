import React from 'react';
import SetPermissions from '../../components/PDFService/SetPermissions';
import type { SetPermissionsResponse } from '../../types/setPermissions';

const SetPermissionsPage: React.FC = () => {
  const handlePermissionsResult = (result: SetPermissionsResponse) => {
    console.log('Permissions set successfully:', result);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <SetPermissions onPermissionsResult={handlePermissionsResult} />
    </div>
  );
};

export default SetPermissionsPage;
