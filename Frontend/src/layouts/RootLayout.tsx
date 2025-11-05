import React from 'react';
import { Outlet } from 'react-router-dom';
import { TutorialProvider } from '../context/TutorialContext';

const RootLayout: React.FC = () => {
  return (
    <TutorialProvider>
      <Outlet />
    </TutorialProvider>
  );
};

export default RootLayout;