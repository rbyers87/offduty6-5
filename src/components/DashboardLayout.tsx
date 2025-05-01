import React from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { FileText, LogOut, Users, Settings, Menu, LayoutDashboard, Car } from 'lucide-react';
import toast from 'react-hot-toast';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      navigate('/');
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-2 rounded-md bg-white shadow-md"
        >
          <Menu className="h-6 w-6 text-gray-600" />
        </button>
      </div>

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-white shadow-lg transform transition-transform duration-200 ease-in-out ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0`}
      >
        <div className="h-full flex flex-col">
          <div className="px-4 py-6 border-b">
            <h1 className="text-2xl font-bold text-gray-800">Vehicle Forms</h1>
          </div>

          <nav className="flex-1 px-4 py-4 space-y-1">
            <a
              href="/dashboard"
              className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
            >
              <FileText className="h-5 w-5 mr-3" />
              Forms
            </a>
            <a
              href="/form-generator"
              className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
            >
              <LayoutDashboard className="h-5 w-5 mr-3" />
              Form Generator
            </a>
            <a
              href="/vehicle-form"
              className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
            >
              <Car className="h-5 w-5 mr-3" />
              Vehicle Form
            </a>
            <a
              href="/templates"
              className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
            >
              <Settings className="h-5 w-5 mr-3" />
              Templates
            </a>
            <a
              href="/users"
              className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
            >
              <Users className="h-5 w-5 mr-3" />
              Users
            </a>
          </nav>

          <div className="px-4 py-4 border-t">
            <button
              onClick={handleSignOut}
              className="flex items-center w-full px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
            >
              <LogOut className="h-5 w-5 mr-3" />
              Sign out
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className={`lg:ml-64 min-h-screen transition-all duration-200 ${isSidebarOpen ? 'ml-64' : 'ml-0'}`}>
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
