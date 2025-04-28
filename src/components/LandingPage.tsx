import React, { useState, useEffect } from 'react';
import { BookOpen, Brain, TrendingUp, Download, ArrowRight, Star, CheckCircle, Shield, Sun, Moon, Bell, LogOut } from 'lucide-react';
import { motion } from 'framer-motion';
import { ParallaxProvider, Parallax } from 'react-scroll-parallax';
import { useInView } from 'react-intersection-observer';
import Login from './Login';

interface LandingPageProps {
  onLogin: () => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

const AnimatedSection = ({ children, delay = 0 }) => {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      transition={{ duration: 0.7, delay }}
    >
      {children}
    </motion.div>
  );
};

const LandingPage: React.FC<LandingPageProps> = ({ onLogin, isDarkMode, toggleDarkMode }) => {
  const [showLogin, setShowLogin] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  
  // Animation variants
  const staggerContainer = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      }
    }
  };

  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.7 } }
  };

  // Check scroll position for header styling
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLoginClick = () => {
    setShowLogin(true);
  };

  const handleCloseLogin = () => {
    setShowLogin(false);
  };

  return (
    <ParallaxProvider>
      <div className={`min-h-screen ${isDarkMode ? 'dark bg-gray-900' : 'bg-[#f8fafc]'}`}>
        {/* Sticky Header */}
        <header className={`fixed top-0 w-full ${isScrolled 
          ? `${isDarkMode ? 'bg-gray-900/95' : 'bg-white/95'} backdrop-blur-sm shadow-md` 
          : `${isDarkMode ? 'bg-transparent' : 'bg-transparent'}`
        } transition-all duration-300 ease-in-out z-50`}>
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
                className="flex items-center gap-2"
              >
                <h1 className={`text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent`}>
                  KAIROS AI
                </h1>
              </motion.div>
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
                className="flex items-center gap-4"
              >
                <button
                  onClick={toggleDarkMode}
                  className={`p-2 rounded-full ${isDarkMode ? 'bg-gray-700/50 hover:bg-gray-700 text-yellow-400' : 'bg-white shadow hover:bg-gray-100 text-gray-600'} transition-colors`}
                  aria-label={isDarkMode ? "Passer au mode clair" : "Passer au mode sombre"}
                >
                  {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
                </button>
                
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleLoginClick}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-colors shadow-md"
                  aria-label="Se connecter à KAIROS AI"
                >
                  Se connecter
                </motion.button>
              </motion.div>
            </div>
          </div>
        </header>

        {/* Hero Section with Parallax effect */}
        <section className="pt-32 pb-20 px-6 md:pt-40 md:pb-28 overflow-hidden relative">
          <Parallax speed={-10} className="absolute inset-0 z-0 opacity-30">
            <div className="absolute top-0 left-0 w-full h-full">
              <img 
                src="https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?ixlib=rb-4.0.3&q=80&fm=jpg&crop=entropy&cs=tinysrgb&w=2000" 
                alt="Background pattern" 
                className="w-full h-full object-cover opacity-40"
              />
            </div>
          </Parallax>
          
          <div className="container mx-auto max-w-7xl relative z-10">
            <div className="flex flex-col md:flex-row items-center">
              <motion.div 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="md:w-1/2 mb-12 md:mb-0"
              >
                <motion.h1 
                  className={`text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                >
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0 }}
                  >
                    L'IA qui
                  </motion.span>{' '}
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                  >
                    révolutionne
                  </motion.span>{' '}
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent inline-block"
                  >
                    l'apprentissage
                  </motion.span>{' '}
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.6 }}
                    className="bg-gradient-to-r from-yellow-500 to-orange-500 bg-clip-text text-transparent inline-block"
                  >
                    en Afrique
                  </motion.span>
                </motion.h1>
                
                <motion.p 
                  className={`text-lg md:text-xl mb-8 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.8, delay: 0.6 }}
                >
                  Maîtrisez les <b>mathématiques</b>, les <b>sciences</b>, le <b>français</b>, l'<b>anglais</b> et la <b>physique-chimie</b> grâce à nos explications claires et personnalisées.
                </motion.p>
                
                <motion.div 
                  className="flex flex-col sm:flex-row gap-4"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.8 }}
                >
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onLogin}
                    className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-colors flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
                  >
                    Commencer maintenant
                    <ArrowRight className="w-5 h-5" />
                  </motion.button>
                  
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`px-8 py-4 ${isDarkMode ? 'bg-gray-800 text-white hover:bg-gray-700' : 'bg-white text-gray-800 hover:bg-gray-100'} border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} rounded-lg font-medium transition-colors flex items-center justify-center gap-2 shadow-md`}
                  >
                    <Download className="w-5 h-5" />
                    Télécharger l'app
                  </motion.button>
                </motion.div>

                <motion.div 
                  className="mt-8 flex items-center gap-3"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.8, delay: 1 }}
                >
                  <div className="flex -space-x-2">
                    <img src="https://images.unsplash.com/photo-1507152832244-10d45c7eda57?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=facearea&facepad=2&w=96&h=96&q=80" className="w-10 h-10 rounded-full border-2 border-white dark:border-gray-800" alt="Student from Senegal" />
                    <img src="https://images.unsplash.com/photo-1566753323558-f4e0952af115?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=facearea&facepad=2&w=96&h=96&q=80" className="w-10 h-10 rounded-full border-2 border-white dark:border-gray-800" alt="Student from Ivory Coast" />
                    <img src="https://images.unsplash.com/photo-1542909168-82c3e7fdca5c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=facearea&facepad=2&w=96&h=96&q=80" className="w-10 h-10 rounded-full border-2 border-white dark:border-gray-800" alt="Student from Morocco" />
                  </div>
                  <div className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    <span className="font-medium">2000+</span> étudiants satisfaits
                  </div>
                  <div className="flex items-center">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star key={star} className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                    ))}
                  </div>
                </motion.div>
              </motion.div>
              
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="md:w-1/2 md:pl-12 relative"
              >
                <Parallax speed={5} className="z-10">
                  <div className={`rounded-2xl overflow-hidden shadow-xl ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                    <img 
                      src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80" 
                      alt="African students using KAIROS AI" 
                      className="w-full h-auto object-cover rounded-t-2xl" 
                    />
                    <div className="p-6">
                      <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${isDarkMode ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-100 text-blue-700'} mb-4`}>
                        <Brain className="w-4 h-4" />
                        IA adaptée aux programmes africains
                      </div>
                      <h3 className={`text-xl font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        Scannez vos exercices, obtenez des explications
                      </h3>
                      <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Prenez simplement une photo de votre exercice et notre IA vous fournira une explication détaillée et une correction personnalisée.
                      </p>
                    </div>
                  </div>
                </Parallax>

                {/* Floating subject icons - Improved contrast and sizing */}
                <motion.div 
                  className="absolute -top-4 -right-4 w-14 h-14 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg float-animation"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.6, duration: 0.5 }}
                >
                  <span className="font-bold text-lg">∑</span>
                </motion.div>
                <motion.div 
                  className="absolute top-1/4 -left-6 w-12 h-12 rounded-full bg-green-600 text-white flex items-center justify-center shadow-lg float-animation"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.8, duration: 0.5 }}
                  style={{ animationDelay: "1s" }}
                >
                  <span className="font-bold text-sm">Bio</span>
                </motion.div>
                <motion.div 
                  className="absolute bottom-1/3 -right-5 w-12 h-12 rounded-full bg-yellow-500 text-white flex items-center justify-center shadow-lg float-animation"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 1, duration: 0.5 }}
                  style={{ animationDelay: "0.5s" }}
                >
                  <span className="font-bold text-sm">Fr</span>
                </motion.div>
                <motion.div 
                  className="absolute bottom-1/4 -left-4 w-11 h-11 rounded-full bg-red-600 text-white flex items-center justify-center shadow-lg float-animation"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 1.2, duration: 0.5 }}
                  style={{ animationDelay: "1.5s" }}
                >
                  <span className="font-bold text-sm">En</span>
                </motion.div>
                <motion.div 
                  className="absolute bottom-10 right-10 w-14 h-14 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-lg float-animation"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 1.4, duration: 0.5 }}
                  style={{ animationDelay: "0.7s" }}
                >
                  <span className="font-bold text-sm">Phys</span>
                </motion.div>
              </motion.div>
            </div>
            
            {/* Decorative subject patterns */}
            <div className="absolute -bottom-20 -left-20 opacity-10 z-0">
              <svg width="200" height="200" viewBox="0 0 100 100">
                <path d="M10,30 L90,30 M10,50 L90,50 M10,70 L90,70" stroke={isDarkMode ? '#FFFFFF' : '#000000'} strokeWidth="2" />
                <circle cx="20" cy="20" r="10" fill="none" stroke={isDarkMode ? '#FFFFFF' : '#000000'} strokeWidth="1" />
                <path d="M70,10 L80,20 L70,30 L60,20 Z" stroke={isDarkMode ? '#FFFFFF' : '#000000'} fill="none" strokeWidth="1" />
                <path d="M30,70 Q50,90 70,70" stroke={isDarkMode ? '#FFFFFF' : '#000000'} fill="none" strokeWidth="1" />
              </svg>
            </div>
            <div className="absolute -top-20 -right-20 opacity-10 z-0 rotate-45">
              <svg width="200" height="200" viewBox="0 0 100 100">
                <rect x="10" y="30" width="20" height="20" fill="none" stroke={isDarkMode ? '#FFFFFF' : '#000000'} strokeWidth="1" />
                <path d="M10,80 L30,60 L50,80 L70,60 L90,80" stroke={isDarkMode ? '#FFFFFF' : '#000000'} fill="none" strokeWidth="1" />
                <circle cx="70" cy="30" r="15" fill="none" stroke={isDarkMode ? '#FFFFFF' : '#000000'} strokeWidth="1" />
              </svg>
            </div>
          </div>
        </section>

        {/* Subjects Section - Improved color contrast */}
        <AnimatedSection>
          <section className={`py-16 ${isDarkMode ? 'bg-gray-800/60' : 'bg-gradient-to-r from-blue-50 to-indigo-50'}`}>
            <div className="container mx-auto px-6">
              <h2 className={`text-3xl md:text-4xl font-bold mb-10 text-center ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Maîtrisez toutes les matières essentielles
              </h2>
              
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 md:gap-8">
                {/* Math */}
                <motion.div 
                  whileHover={{ scale: 1.05 }}
                  className={`p-6 rounded-xl text-center ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-md`}
                >
                  <div className="w-16 h-16 mx-auto rounded-full bg-blue-600 flex items-center justify-center mb-4 pulse-animation">
                    <span className="text-white text-2xl font-bold">∑</span>
                  </div>
                  <h3 className={`font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Mathématiques</h3>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Algèbre, géométrie, probabilités</p>
                </motion.div>
                
                {/* Physics - Vibrant colors */}
                <motion.div 
                  whileHover={{ scale: 1.05 }}
                  className={`p-6 rounded-xl text-center ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-md`}
                >
                  <div className="w-16 h-16 mx-auto rounded-full bg-purple-500 flex items-center justify-center mb-4 pulse-animation">
                    <span className="text-white text-2xl font-bold">⚛️</span>
                  </div>
                  <h3 className={`font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Physique-Chimie</h3>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Mécanique, électricité, chimie</p>
                </motion.div>
                
                {/* Biology */}
                <motion.div 
                  whileHover={{ scale: 1.05 }}
                  className={`p-6 rounded-xl text-center ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-md`}
                >
                  <div className="w-16 h-16 mx-auto rounded-full bg-green-500 flex items-center justify-center mb-4 pulse-animation">
                    <span className="text-white text-2xl font-bold">🧬</span>
                  </div>
                  <h3 className={`font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>SVT</h3>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Biologie, géologie, écologie</p>
                </motion.div>
                
                {/* French */}
                <motion.div 
                  whileHover={{ scale: 1.05 }}
                  className={`p-6 rounded-xl text-center ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-md`}
                >
                  <div className="w-16 h-16 mx-auto rounded-full bg-amber-500 flex items-center justify-center mb-4 pulse-animation">
                    <span className="text-white text-2xl font-bold">Fr</span>
                  </div>
                  <h3 className={`font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Français</h3>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Grammaire, littérature, expression</p>
                </motion.div>
                
                {/* English */}
                <motion.div 
                  whileHover={{ scale: 1.05 }}
                  className={`p-6 rounded-xl text-center ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-md`}
                >
                  <div className="w-16 h-16 mx-auto rounded-full bg-red-500 flex items-center justify-center mb-4 pulse-animation">
                    <span className="text-white text-2xl font-bold">En</span>
                  </div>
                  <h3 className={`font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Anglais</h3>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Grammaire, vocabulaire, compréhension</p>
                </motion.div>
              </div>
            </div>
          </section>
        </AnimatedSection>

        {/* Features Section - Brighter colors */}
        <section className={`py-20 ${isDarkMode ? 'bg-gray-900' : 'bg-white'}`}>
          <div className="container mx-auto px-6">
            <AnimatedSection>
              <div className="text-center mb-16">
                <h2 className={`text-3xl md:text-4xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Fonctionnalités principales
                </h2>
                <p className={`max-w-2xl mx-auto ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  Découvrez comment KAIROS AI transforme l'expérience d'apprentissage des élèves africains grâce à l'intelligence artificielle.
                </p>
              </div>
            </AnimatedSection>
            
            <div className="grid md:grid-cols-3 gap-8">
              {/* Feature 1 */}
              <AnimatedSection delay={0.2}>
                <motion.div 
                  whileHover={{ y: -10 }}
                  className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-6 shadow-md transition-all duration-300 hover:shadow-xl border ${isDarkMode ? 'border-gray-700' : 'border-gray-100'}`}
                >
                  <div className="w-14 h-14 rounded-xl flex items-center justify-center bg-gradient-to-r from-blue-500 to-purple-500 mb-6 shadow-lg">
                    <Brain className="text-white" size={28} />
                  </div>
                  <h3 className={`text-xl font-semibold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                    Adaptabilité intelligente
                  </h3>
                  <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Notre IA s'adapte à votre niveau et à vos besoins, pour un apprentissage personnalisé et efficace.
                  </p>
                  <ul className="mt-4 space-y-2">
                    <li className="flex items-center gap-2">
                      <CheckCircle className={`w-5 h-5 ${isDarkMode ? 'text-green-400' : 'text-green-500'}`} />
                      <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        Analyse précise de vos exercices
                      </span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className={`w-5 h-5 ${isDarkMode ? 'text-green-400' : 'text-green-500'}`} />
                      <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        Détection intelligente des erreurs
                      </span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className={`w-5 h-5 ${isDarkMode ? 'text-green-400' : 'text-green-500'}`} />
                      <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        Explications adaptées à votre niveau
                      </span>
                    </li>
                  </ul>
                </motion.div>
              </AnimatedSection>
              
              {/* Feature 2 */}
              <AnimatedSection delay={0.4}>
                <motion.div 
                  whileHover={{ y: -10 }}
                  className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-6 shadow-md transition-all duration-300 hover:shadow-xl border ${isDarkMode ? 'border-gray-700' : 'border-gray-100'}`}
                >
                  <div className="w-14 h-14 rounded-xl flex items-center justify-center bg-gradient-to-r from-green-500 to-teal-500 mb-6 shadow-lg">
                    <TrendingUp className="text-white" size={28} />
                  </div>
                  <h3 className={`text-xl font-semibold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                    Suivi de performance
                  </h3>
                  <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Visualisez votre progression dans le temps et identifiez vos points forts et vos axes d'amélioration.
                  </p>
                  <ul className="mt-4 space-y-2">
                    <li className="flex items-center gap-2">
                      <CheckCircle className={`w-5 h-5 ${isDarkMode ? 'text-green-400' : 'text-green-500'}`} />
                      <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        Statistiques détaillées par matière
                      </span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className={`w-5 h-5 ${isDarkMode ? 'text-green-400' : 'text-green-500'}`} />
                      <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        Analyse des réussites et difficultés
                      </span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className={`w-5 h-5 ${isDarkMode ? 'text-green-400' : 'text-green-500'}`} />
                      <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        Recommandations personnalisées
                      </span>
                    </li>
                  </ul>
                </motion.div>
              </AnimatedSection>
              
              {/* Feature 3 */}
              <AnimatedSection delay={0.6}>
                <motion.div 
                  whileHover={{ y: -10 }}
                  className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-6 shadow-md transition-all duration-300 hover:shadow-xl border ${isDarkMode ? 'border-gray-700' : 'border-gray-100'}`}
                >
                  <div className="w-14 h-14 rounded-xl flex items-center justify-center bg-gradient-to-r from-amber-500 to-orange-500 mb-6 shadow-lg">
                    <BookOpen className="text-white" size={28} />
                  </div>
                  <h3 className={`text-xl font-semibold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                    Apprentissage assisté
                  </h3>
                  <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Des quiz intelligents et des fiches de révision générés en fonction de vos besoins spécifiques.
                  </p>
                  <ul className="mt-4 space-y-2">
                    <li className="flex items-center gap-2">
                      <CheckCircle className={`w-5 h-5 ${isDarkMode ? 'text-green-400' : 'text-green-500'}`} />
                      <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        Quiz adaptatifs multi-niveaux
                      </span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className={`w-5 h-5 ${isDarkMode ? 'text-green-400' : 'text-green-500'}`} />
                      <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        Corrections détaillées et pédagogiques
                      </span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className={`w-5 h-5 ${isDarkMode ? 'text-green-400' : 'text-green-500'}`} />
                      <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        Contenu sur mesure pour chaque matière
                      </span>
                    </li>
                  </ul>
                </motion.div>
              </AnimatedSection>
            </div>
          </div>
        </section>

        {/* App Screenshot Section - Verified Image URL */}
        <AnimatedSection>
          <section className={`py-20 overflow-hidden ${isDarkMode ? 'bg-gray-800/60' : 'bg-blue-50'}`}>
            <div className="container mx-auto px-6">
              <div className="flex flex-col md:flex-row items-center">
                <div className="md:w-1/2 mb-10 md:mb-0">
                  <Parallax speed={5}>
                    <motion.img 
                      initial={{ opacity: 0, scale: 0.8 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.8 }}
                      src="https://images.unsplash.com/photo-1503676260728-1c00da094a0b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1022&q=80" 
                      alt="African students using KAIROS AI" 
                      className="rounded-xl shadow-xl max-w-full"
                    />
                  </Parallax>
                </div>
                
                <div className="md:w-1/2 md:pl-12">
                  <motion.div
                    initial={{ opacity: 0, x: 50 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8 }}
                  >
                    <h2 className={`text-3xl md:text-4xl font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      Une approche pédagogique adaptée au contexte africain
                    </h2>
                    
                    <p className={`text-lg mb-6 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      KAIROS AI est développée spécifiquement pour répondre aux besoins des étudiants africains, avec des contenus alignés sur les programmes scolaires locaux.
                    </p>
                    
                    <ul className="space-y-4">
                      <li className="flex items-start gap-3">
                        <div className={`p-2.5 rounded-full ${isDarkMode ? 'bg-green-900/30' : 'bg-green-100'} mt-0.5`}>
                          <CheckCircle className={`w-5 h-5 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
                        </div>
                        <div>
                          <h3 className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Contenu localisé</h3>
                          <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            Nos ressources sont adaptées aux programmes scolaires africains
                          </p>
                        </div>
                      </li>
                      
                      <li className="flex items-start gap-3">
                        <div className={`p-2.5 rounded-full ${isDarkMode ? 'bg-green-900/30' : 'bg-green-100'} mt-0.5`}>
                          <CheckCircle className={`w-5 h-5 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
                        </div>
                        <div>
                          <h3 className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Accessibilité hors ligne</h3>
                          <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            Téléchargez vos leçons pour y accéder sans connexion internet
                          </p>
                        </div>
                      </li>
                      
                      <li className="flex items-start gap-3">
                        <div className={`p-2.5 rounded-full ${isDarkMode ? 'bg-green-900/30' : 'bg-green-100'} mt-0.5`}>
                          <CheckCircle className={`w-5 h-5 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
                        </div>
                        <div>
                          <h3 className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Collaboration avec des enseignants locaux</h3>
                          <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            Nos contenus sont validés par des professeurs africains
                          </p>
                        </div>
                      </li>
                    </ul>
                    
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={onLogin}
                      className="mt-8 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg font-medium hover:from-blue-600 hover:to-purple-600 transition-colors flex items-center justify-center gap-2 shadow-lg"
                    >
                      Découvrir l'application
                      <ArrowRight className="w-5 h-5" />
                    </motion.button>
                  </motion.div>
                </div>
              </div>
            </div>
          </section>
        </AnimatedSection>

        {/* Testimonials - Verified images and more vibrant design */}
        <section className={`py-20 ${isDarkMode ? 'bg-gray-900' : 'bg-white'}`}>
          <div className="container mx-auto px-6">
            <AnimatedSection>
              <div className="text-center mb-16">
                <h2 className={`text-3xl md:text-4xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Ce que nos utilisateurs disent
                </h2>
                <p className={`max-w-2xl mx-auto ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  Découvrez comment KAIROS AI aide les étudiants africains à progresser et à réussir.
                </p>
              </div>
            </AnimatedSection>
            
            <div className="grid md:grid-cols-3 gap-8">
              {/* Testimonial 1 */}
              <AnimatedSection delay={0.2}>
                <motion.div 
                  whileHover={{ y: -10 }}
                  className={`${isDarkMode ? 'bg-gray-800' : 'bg-gradient-to-br from-white to-blue-50'} rounded-xl p-6 shadow-md border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}
                >
                  <div className="flex items-center gap-4 mb-4">
                    <img 
                      src="https://images.unsplash.com/photo-1531123897727-8f129e1688ce?ixlib=rb-4.0.3&auto=format&fit=facearea&facepad=2&w=300&q=80" 
                      alt="Fatou Diop" 
                      className="w-12 h-12 rounded-full object-cover border-2 border-blue-400"
                    />
                    <div>
                      <h4 className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Fatou Diop</h4>
                      <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Terminale S, Dakar</p>
                    </div>
                  </div>
                  <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'} mb-4`}>
                    "KAIROS AI m'a aidée à comprendre les concepts de mathématiques que je n'arrivais pas à assimiler en cours. Les explications sont claires et adaptées au programme sénégalais."
                  </p>
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star key={star} className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                    ))}
                  </div>
                </motion.div>
              </AnimatedSection>
              
              {/* Testimonial 2 */}
              <AnimatedSection delay={0.4}>
                <motion.div 
                  whileHover={{ y: -10 }}
                  className={`${isDarkMode ? 'bg-gray-800' : 'bg-gradient-to-br from-white to-green-50'} rounded-xl p-6 shadow-md border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}
                >
                  <div className="flex items-center gap-4 mb-4">
                    <img 
                      src="https://images.unsplash.com/photo-1614644147798-f8c0fc9da7f6?ixlib=rb-4.0.3&auto=format&fit=facearea&facepad=2&w=300&q=80" 
                      alt="Mamadou Sow" 
                      className="w-12 h-12 rounded-full object-cover border-2 border-green-400"
                    />
                    <div>
                      <h4 className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Mamadou Sow</h4>
                      <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Première, Abidjan</p>
                    </div>
                  </div>
                  <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'} mb-4`}>
                    "L'application est géniale ! Les quiz s'adaptent à mon niveau et me permettent de réviser efficacement. J'ai vu mes notes s'améliorer en seulement quelques semaines."
                  </p>
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star key={star} className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                    ))}
                  </div>
                </motion.div>
              </AnimatedSection>
              
              {/* Testimonial 3 */}
              <AnimatedSection delay={0.6}>
                <motion.div 
                  whileHover={{ y: -10 }}
                  className={`${isDarkMode ? 'bg-gray-800' : 'bg-gradient-to-br from-white to-amber-50'} rounded-xl p-6 shadow-md border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}
                >
                  <div className="flex items-center gap-4 mb-4">
                    <img 
                      src="https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?ixlib=rb-4.0.3&auto=format&fit=facearea&facepad=2&w=300&q=80" 
                      alt="Aya Konaté" 
                      className="w-12 h-12 rounded-full object-cover border-2 border-amber-400"
                    />
                    <div>
                      <h4 className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Aya Konaté</h4>
                      <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Seconde, Bamako</p>
                    </div>
                  </div>
                  <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'} mb-4`}>
                    "J'adore pouvoir scanner mes exercices et obtenir de l'aide instantanément. KAIROS AI est comme avoir un prof particulier disponible 24h/24. Indispensable pour mes révisions !"
                  </p>
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star key={star} className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                    ))}
                  </div>
                </motion.div>
              </AnimatedSection>
            </div>
          </div>
        </section>

        {/* CTA Section - Brighter gradients */}
        <AnimatedSection>
          <section className={`py-20 relative overflow-hidden ${isDarkMode ? 'bg-gradient-to-r from-blue-900/40 to-purple-900/40' : 'bg-gradient-to-r from-blue-100 to-purple-100'}`}>
            {/* Background pattern */}
            <Parallax speed={-10} className="absolute inset-0 z-0 opacity-10">
              <div className="absolute top-0 left-0 right-0 bottom-0 grid grid-cols-6 grid-rows-6">
                {[...Array(36)].map((_, i) => (
                  <div key={i} className={`border ${isDarkMode ? 'border-gray-600' : 'border-gray-300'} opacity-20`}></div>
                ))}
              </div>
            </Parallax>
          
            <div className="container mx-auto px-6 text-center relative z-10">
              <motion.h2 
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className={`text-3xl md:text-4xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
              >
                Prêt à révolutionner votre façon d'apprendre ?
              </motion.h2>
              <motion.p 
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className={`max-w-2xl mx-auto mb-10 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}
              >
                Rejoignez des milliers d'étudiants africains qui améliorent leurs résultats grâce à KAIROS AI.
                Commencez gratuitement dès aujourd'hui !
              </motion.p>
              
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto justify-center"
              >
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onLogin}
                  className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg font-medium hover:from-blue-600 hover:to-purple-600 transition-colors flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
                >
                  Commencer maintenant
                  <ArrowRight className="w-5 h-5" />
                </motion.button>
              </motion.div>
              
              <motion.div 
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.6 }}
                className={`mt-10 p-4 mx-auto max-w-lg rounded-xl ${isDarkMode ? 'bg-gray-800/70' : 'bg-white'} flex items-center justify-center gap-2 shadow-md`}
              >
                <Shield className={`w-5 h-5 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  Sécurisé, confidentiel et conforme au RGPD. Vos données restent privées.
                </p>
              </motion.div>
            </div>
          </section>
        </AnimatedSection>

        {/* Footer - Improved contrast and vibrancy */}
        <footer className={`py-10 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="container mx-auto px-6">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="mb-6 md:mb-0">
                <h2 className={`text-2xl font-bold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent`}>
                  KAIROS AI
                </h2>
                <p className={`mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  L'intelligence artificielle au service de la réussite scolaire en Afrique.
                </p>
              </div>
              <div className="flex flex-col md:flex-row items-center gap-6">
                <a href="#" className={`${isDarkMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}>
                  À propos
                </a>
                <a href="#" className={`${isDarkMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}>
                  Nos tarifs
                </a>
                <a href="#" className={`${isDarkMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}>
                  Contact
                </a>
                <a href="#" className={`${isDarkMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}>
                  Confidentialité
                </a>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleLoginClick}
                  className={`px-4 py-2 ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gradient-to-r from-blue-100 to-purple-100 text-gray-800 hover:from-blue-200 hover:to-purple-200'} rounded-lg transition-colors`}
                >
                  Se connecter
                </motion.button>
              </div>
            </div>
            <div className={`mt-8 pt-8 border-t ${isDarkMode ? 'border-gray-700 text-gray-400' : 'border-gray-200 text-gray-500'} text-center text-sm`}>
              &copy; {new Date().getFullYear()} KAIROS AI. Tous droits réservés.
            </div>
          </div>
        </footer>

        {/* Login Modal */}
        {showLogin && <Login onClose={handleCloseLogin} />}
        
        {/* Mobile sticky login button */}
        <div className="md:hidden fixed bottom-6 right-6 z-50">
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleLoginClick}
            className="w-14 h-14 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 text-white flex items-center justify-center shadow-lg"
            aria-label="Se connecter à KAIROS AI"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
          </motion.button>
        </div>
      </div>
    </ParallaxProvider>
  );
};

export default LandingPage;