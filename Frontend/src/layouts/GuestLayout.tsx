import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from '../components/LandingPage/Header';
import Footer from '../components/LandingPage/Footer';

const GuestLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main>
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default GuestLayout;
