import React, { useState, useEffect } from 'react';
import { Camera, FolderOpen, BookOpen, BarChart2, Settings, MessageCircle, Search, Sun, Moon, Bell, LogOut } from 'lucide-react';
import Scanner from './components/Scanner';
import Login from './components/Login';
import HomeworkHistory from './components/HomeworkHistory';
import SettingsPage from './components/Settings';
import { useAuth } from './contexts/AuthContext';

function App() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [showHomework, setShowHomework] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [redirectToHomework, setRedirectToHomework] = useState(false);
  const { currentUser, logout } = useAuth();

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  useEffect(() => {
    if (redirectToHomework) {
      setShowHomework(true);
      setRedirectToHomework(false);
    }
  }, [redirectToHomework]);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  if (showSettings) {
    return (
      <SettingsPage
        onBack={() => setShowSettings(false)}
        isDarkMode={isDarkMode}
        onDarkModeChange={setIsDarkMode}
      />
    );
  }

  if (showScanner) {
    return <Scanner onBack={() => {
      setShowScanner(false);
      setRedirectToHomework(true);
    }} />;
  }

  if (showHomework) {
    return (
      <div className={isDarkMode ? 'dark' : ''}>
        <header className={`fixed top-0 w-full ${isDarkMode ? 'bg-gray-800/95' : 'bg-white/95'} backdrop-blur-sm shadow-sm z-50`}>
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setShowHomework(false)}
                className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Retour
              </button>
              <div className="flex items-center gap-4">
                <button
                  onClick={toggleDarkMode}
                  className={`p-2 rounded-full ${isDarkMode ? 'bg-gray-700/50 hover:bg-gray-700 text-yellow-400' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'} transition-colors`}
                >
                  {isDarkMode ? <Moon size={20} /> : <Sun size={20} />}
                </button>
              </div>
            </div>
          </div>
        </header>
        <HomeworkHistory />
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDarkMode ? 'dark bg-gray-900' : 'bg-[#f8fafc]'}`}>
      {/* Header */}
      <header className={`fixed top-0 w-full ${isDarkMode ? 'bg-gray-800/95' : 'bg-white/95'} backdrop-blur-sm shadow-sm z-50`}>
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className={`text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent`}>
                KAIROS AI
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <button className={`p-2 rounded-full ${isDarkMode ? 'bg-gray-700/50 hover:bg-gray-700' : 'bg-gray-100 hover:bg-gray-200'} transition-colors`}>
                <Bell size={20} className={isDarkMode ? 'text-gray-300' : 'text-gray-600'} />
              </button>
              <button
                onClick={toggleDarkMode}
                className={`p-2 rounded-full ${isDarkMode ? 'bg-gray-700/50 hover:bg-gray-700 text-yellow-400' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'} transition-colors`}
              >
                {isDarkMode ? <Moon size={20} /> : <Sun size={20} />}
              </button>
              {currentUser ? (
                <div className="flex items-center gap-2" onClick={() => setShowSettings(true)}>
                  <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                    <span className="text-white text-sm font-medium">
                      {currentUser.email?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowLogin(true)}
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-purple-700"
                >
                  Se connecter
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 pt-24 pb-24">
        {currentUser ? (
          <>
            {/* Welcome Section */}
            <div className="mb-8">
              <h2 className={`text-3xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                Bonjour, {currentUser.email?.split('@')[0]}! 👋
              </h2>
              <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Prêt à résoudre vos exercices?
              </p>
            </div>

            {/* Search Bar */}
            <div className="mb-8">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Rechercher par matière ou sujet..."
                  className={`w-full pl-12 pr-4 py-3 rounded-xl ${
                    isDarkMode 
                      ? 'bg-gray-800 text-white placeholder-gray-400 border border-gray-700' 
                      : 'bg-white text-gray-800 placeholder-gray-500 border border-gray-200'
                  } focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all`}
                />
              </div>
            </div>

            {/* Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Scanner Card */}
              <div 
                onClick={() => setShowScanner(true)}
                className={`p-6 rounded-2xl ${
                  isDarkMode 
                    ? 'bg-gradient-to-br from-blue-600/20 to-purple-600/20 border border-gray-700' 
                    : 'bg-gradient-to-br from-blue-50 to-purple-50 border border-gray-100'
                } hover:scale-105 transition-all duration-300 cursor-pointer`}
              >
                <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 mb-6">
                  <Camera className="text-white" size={24} />
                </div>
                <h2 className={`text-xl font-semibold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Scanner un devoir</h2>
                <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Prenez en photo votre exercice pour obtenir une explication détaillée
                </p>
              </div>

              {/* Mes devoirs Card */}
              <div 
                onClick={() => setShowHomework(true)}
                className={`p-6 rounded-2xl ${
                  isDarkMode 
                    ? 'bg-gradient-to-br from-green-600/20 to-teal-600/20 border border-gray-700' 
                    : 'bg-gradient-to-br from-green-50 to-teal-50 border border-gray-100'
                } hover:scale-105 transition-all duration-300 cursor-pointer`}
              >
                <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-r from-green-500 to-teal-500 mb-6">
                  <FolderOpen className="text-white" size={24} />
                </div>
                <h2 className={`text-xl font-semibold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Mes devoirs</h2>
                <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Accédez à l'historique de vos exercices résolus
                </p>
              </div>

              {/* Révisions Card */}
              <div className={`p-6 rounded-2xl ${
                isDarkMode 
                  ? 'bg-gradient-to-br from-yellow-600/20 to-orange-600/20 border border-gray-700' 
                  : 'bg-gradient-to-br from-yellow-50 to-orange-50 border border-gray-100'
              } hover:scale-105 transition-all duration-300 cursor-pointer`}>
                <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-r from-yellow-500 to-orange-500 mb-6">
                  <BookOpen className="text-white" size={24} />
                </div>
                <h2 className={`text-xl font-semibold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Révisions</h2>
                <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Consultez les fiches de révision et testez vos connaissances
                </p>
              </div>

              {/* Statistics Card */}
              <div className={`p-6 rounded-2xl ${
                isDarkMode 
                  ? 'bg-gradient-to-br from-pink-600/20 to-rose-600/20 border border-gray-700' 
                  : 'bg-gradient-to-br from-pink-50 to-rose-50 border border-gray-100'
              } hover:scale-105 transition-all duration-300 cursor-pointer`}>
                <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 mb-6">
                  <BarChart2 className="text-white" size={24} />
                </div>
                <h2 className={`text-xl font-semibold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Statistiques</h2>
                <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Suivez votre progression et vos performances
                </p>
              </div>

              {/* Settings Card */}
              <div 
                onClick={() => setShowSettings(true)}
                className={`p-6 rounded-2xl ${
                isDarkMode 
                  ? 'bg-gradient-to-br from-gray-700/20 to-gray-600/20 border border-gray-700' 
                  : 'bg-gradient-to-br from-gray-100 to-gray-50 border border-gray-100'
              } hover:scale-105 transition-all duration-300 cursor-pointer`}>
                <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-r from-gray-600 to-gray-500 mb-6">
                  <Settings className="text-white" size={24} />
                </div>
                <h2 className={`text-xl font-semibold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Paramètres</h2>
                <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Personnalisez votre expérience et gérez votre compte
                </p>
              </div>

              {/* Support Card */}
              <div className={`p-6 rounded-2xl ${
                isDarkMode 
                  ? 'bg-gradient-to-br from-indigo-600/20 to-violet-600/20 border border-gray-700' 
                  : 'bg-gradient-to-br from-indigo-50 to-violet-50 border border-gray-100'
              } hover:scale-105 transition-all duration-300 cursor-pointer`}>
                <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 mb-6">
                  <MessageCircle className="text-white" size={24} />
                </div>
                <h2 className={`text-xl font-semibold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Support</h2>
                <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Besoin d'aide ? Contactez notre équipe support
                </p>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <h2 className={`text-3xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
              Bienvenue sur KAIROS AI
            </h2>
            <p className={`text-center mb-8 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Connectez-vous pour accéder à toutes les fonctionnalités
            </p>
            <button
              onClick={() => setShowLogin(true)}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-purple-700"
            >
              Se connecter
            </button>
          </div>
        )}
      </main>

      {/* Footer Navigation */}
      {currentUser && (
        <footer className={`fixed bottom-0 w-full ${isDarkMode ? 'bg-gray-800/95' : 'bg-white/95'} backdrop-blur-sm shadow-lg`}>
          <div className="container mx-auto px-6 py-4">
            <div className="flex justify-around items-center">
              <button 
                onClick={() => setShowScanner(true)}
                className="flex flex-col items-center gap-1 group"
              >
                <div className={`p-2 rounded-xl group-hover:bg-blue-100 transition-colors ${isDarkMode ? 'group-hover:bg-gray-700' : ''}`}>
                  <Camera size={24} className={`${isDarkMode ? 'text-white' : 'text-gray-600'} group-hover:text-blue-500`} />
                </div>
                <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} group-hover:text-blue-500`}>Scanner</span>
              </button>
              <button 
                onClick={() => setShowHomework(true)}
                className="flex flex-col items-center gap-1 group"
              >
                <div className={`p-2 rounded-xl group-hover:bg-blue-100 transition-colors ${isDarkMode ? 'group-hover:bg-gray-700' : ''}`}>
                  <FolderOpen size={24} className={`${isDarkMode ? 'text-white' : 'text-gray-600'} group-hover:text-blue-500`} />
                </div>
                <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} group-hover:text-blue-500`}>Devoirs</span>
              </button>
              <button className="flex flex-col items-center gap-1 group">
                <div className={`p-2 rounded-xl group-hover:bg-blue-100 transition-colors ${isDarkMode ? 'group-hover:bg-gray-700' : ''}`}>
                  <BookOpen size={24} className={`${isDarkMode ? 'text-white' : 'text-gray-600'} group-hover:text-blue-500`} />
                </div>
                <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} group-hover:text-blue-500`}>Révisions</span>
              </button>
              <button 
                onClick={() => setShowSettings(true)}
                className="flex flex-col items-center gap-1 group"
              >
                <div className={`p-2 rounded-xl group-hover:bg-blue-100 transition-colors ${isDarkMode ? 'group-hover:bg-gray-700' : ''}`}>
                  <Settings size={24} className={`${isDarkMode ? 'text-white' : 'text-gray-600'} group-hover:text-blue-500`} />
                </div>
                <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} group-hover:text-blue-500`}>Paramètres</span>
              </button>
            </div>
          </div>
        </footer>
      )}

      {/* Login Modal */}
      {showLogin && <Login onClose={() => setShowLogin(false)} />}
    </div>
  );
}

export default App;