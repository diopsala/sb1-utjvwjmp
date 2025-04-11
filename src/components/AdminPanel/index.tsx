import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import Sidebar from './Sidebar.tsx';
import Dashboard from './Dashboard.tsx';
import ResourceManager from './ResourceManager.tsx';
import QuizSettings from './QuizSettings.tsx';
import SubjectsManager from './SubjectsManager.tsx';
import ResourceTypesManager from './ResourceTypesManager.tsx';
import UsersView from './UsersView.tsx';
import OpenAIMonitoring from './OpenAIMonitoring.tsx';
import AppSettings from './AppSettings.tsx';
import { Settings, BookOpen, Brain, BookMarked, Users, Activity, Sliders, FileType, BarChart2 } from 'lucide-react';

const MENU_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: Settings },
  { id: 'resources', label: 'Ressources pédagogiques', icon: BookOpen },
  { id: 'quiz', label: 'Paramètres des quiz', icon: Brain },
  { id: 'subjects', label: 'Matières & niveaux', icon: BookMarked },
  { id: 'resourceTypes', label: 'Types de ressources & difficultés', icon: FileType },
  { id: 'users', label: 'Utilisateurs', icon: Users },
  { id: 'openai', label: 'Monitoring OpenAI', icon: Activity },
  { id: 'settings', label: 'Paramètres', icon: Sliders }
];

export default function AdminPanel() {
  const [activeSection, setActiveSection] = useState('dashboard');
  const { currentUser, loading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminCheckComplete, setAdminCheckComplete] = useState(false);

  useEffect(() => {
    if (!currentUser) {
      setIsAdmin(false);
      setAdminCheckComplete(true);
      return;
    }
    
    const unsubscribe = onSnapshot(
      doc(db, 'users', currentUser.uid),
      (doc) => {
        const userData = doc.data();
        const hasAdminAccess = userData?.isAdmin === true || userData?.role === 'admin';
        setIsAdmin(hasAdminAccess);
        setAdminCheckComplete(true);
      },
      (error) => {
        console.error('Error in admin status listener:', error);
        setIsAdmin(false);
        setAdminCheckComplete(true);
      }
    );

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [currentUser]);

  if (loading || !adminCheckComplete) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!currentUser || (!isAdmin && adminCheckComplete)) {
    return <Navigate to="/" replace />;
  }

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return <Dashboard />;
      case 'resources':
        return <ResourceManager />;
      case 'quiz':
        return <QuizSettings />;
      case 'subjects':
        return <SubjectsManager />;
      case 'resourceTypes':
        return <ResourceTypesManager />;
      case 'users':
        return <UsersView />;
      case 'openai':
        return <OpenAIMonitoring />;
      case 'settings':
        return <AppSettings />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
      <Sidebar 
        menuItems={MENU_ITEMS}
        activeSection={activeSection}
        onSectionChange={setActiveSection}
      />
      <main className="flex-1 p-8">
        {renderContent()}
      </main>
    </div>
  );
}