'use client';

import Image from 'next/image';
import { FiMenu, FiX } from 'react-icons/fi';

interface AdminHeaderProps {
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
}

export default function AdminHeader({ isSidebarOpen, onToggleSidebar }: AdminHeaderProps) {
  return (
    <header className="flex items-center justify-between h-16 px-4 bg-white border-b border-gray-200 lg:px-6">
      <button
        onClick={onToggleSidebar}
        className="p-2 text-gray-500 rounded-md lg:hidden focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[#dc2626]"
        aria-label={isSidebarOpen ? 'Close sidebar' : 'Open sidebar'}
      >
        {isSidebarOpen ? (
          <FiX className="w-6 h-6" />
        ) : (
          <FiMenu className="w-6 h-6" />
        )}
      </button>
      
      <div className="flex items-center">
        <div className="ml-4">
          <div className="w-8 h-8 overflow-hidden bg-gray-200 rounded-full">
            <Image
              className="object-cover w-full h-full"
              src="https://ui-avatars.com/api/?name=Admin&background=dc2626&color=fff"
              alt="Admin"
              width={32}
              height={32}
            />
          </div>
        </div>
      </div>
    </header>
  );
}
