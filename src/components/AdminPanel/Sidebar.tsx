import React from 'react';
import { LogOut, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface MenuItem {
  id: string;
  label: string;
  icon: React.ElementType;
}

interface SidebarProps {
  menuItems: MenuItem[];
  activeSection: string;
  onSectionChange: (section: string) => void;
}

export default function Sidebar({ menuItems, activeSection, onSectionChange }: SidebarProps) {
  const { logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      window.location.href = '/';
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <aside className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 h-screen sticky top-0">
      <div className="h-full flex flex-col">
        <div className="p-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            KAIROS Admin
          </h1>
          <button
            onClick={handleLogout}
            className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
            title="Se déconnecter"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 px-4 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => onSectionChange(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  activeSection === item.id
                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}