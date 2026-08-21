import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { BRAND } from '../config/brand';

const AdminLayout: React.FC = () => {
  return (
    <div className="min-h-screen dm-main-bg">
      <header className="border-b border-border/80 bg-card/90 shadow-sm backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Link to="/dashboard" className="text-sm font-semibold text-muted-foreground transition hover:text-primary">
              {BRAND.name}
            </Link>
            <span className="text-muted-foreground/50">/</span>
            <h1 className="text-base font-bold text-foreground">Admin</h1>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
