
import React from 'react';
import { Toaster } from 'react-hot-toast';
import Sidebar from './Sidebar';

interface LayoutProps {
  children: React.ReactNode;
  currentPage: string;
  onPageChange: (page: string) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, currentPage, onPageChange }) => {
  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-50 text-slate-900">
      <Toaster position="top-right" />

      <Sidebar currentPage={currentPage} onPageChange={onPageChange} />

      {/* Content Area */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-4 md:p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
