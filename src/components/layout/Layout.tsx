import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';

export const Layout: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-100 flex flex-col lg:flex-row">
      <Sidebar />
      <main className="flex-1 lg:pl-64 flex flex-col min-h-screen">
        <div className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </div>
        <footer className="py-4 px-6 text-center text-xs text-slate-500 border-t border-slate-200 bg-white">
          Personal Rent Management System &bull; Frontend Local Storage Edition
        </footer>
      </main>
    </div>
  );
};
