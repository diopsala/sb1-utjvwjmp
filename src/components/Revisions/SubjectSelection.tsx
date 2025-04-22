import React, { useState, useEffect } from 'react';
import { ChevronRight, Sparkles, Clock as LockClosed, Medal, ChevronDown, EyeOff, LineChart, Award, Trophy, Database } from 'lucide-react';
import { Subject } from '../../types/subjects';
import { RevisionPerformance, UserStats } from '../../types/revisions';

interface SubjectSelectionProps {
  subjects: Subject[];
  suggestedLevel: number;
  maxLevel: number;
  userStats: UserStats | null;
  performances: RevisionPerformance[];
  onStartQuiz: (subject: Subject, difficulty: number) => void;
  onViewSubjectStats: (subject: Subject) => void;
  loading: boolean;
  error: string | null;
  isDarkMode: boolean;
}

export default function SubjectSelection({
  subjects,
  suggestedLevel,
  maxLevel,
  userStats,
  performances,
  onStartQuiz,
  onViewSubjectStats,
  loading,
  error,
  isDarkMode
}: SubjectSelectionProps) {
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [expandedSubject, setExpandedSubject] = useState<string | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<number>(suggestedLevel);
  const [showAllLevels, setShowAllLevels] = useState(false);
  const [gamificationEnabled, setGamificationEnabled] = useState(true);

  // Reset selected level whenever suggested level changes
  useEffect(() => {
    setSelectedLevel(suggestedLevel);
  }, [suggestedLevel]);

  // Check if gamification is disabled at user level
  useEffect(() => {
    if (userStats) {
      setGamificationEnabled(!userStats.gamificationDisabled);
    }
  }, [userStats]);

  const handleSubjectSelect = (subject: Subject) => {
    setSelectedSubject(subject);
    // When selecting a subject, set the level to the highest unlocked level for that subject
    if (userStats?.unlockedLevels && userStats.unlockedLevels[subject.id]) {
      setSelectedLevel(userStats.unlockedLevels[subject.id]);
    } else {
      // If no unlocked level is found, default to level 1
      setSelectedLevel(1);
    }
  };

  const toggleSubject = (subjectId: string) => {
    setExpandedSubject(expandedSubject === subjectId ? null : subjectId);
  };

  const handleLevelSelect = (level: number) => {
    // Only allow selection if level is available
    if (isLevelAvailable(selectedSubject?.id || '', level)) {
      setSelectedLevel(level);
    }
  };

  const startQuiz = () => {
    if (selectedSubject) {
      onStartQuiz(selectedSubject, selectedLevel);
    }
  };

  // Get the highest unlocked level for a subject
  const getUnlockedLevel = (subjectId: string) => {
    if (!userStats?.unlockedLevels) return 1;
    return userStats.unlockedLevels[subjectId] || 1;
  };

  // Get the last performance for a subject
  const getLastPerformance = (subjectId: string) => {
    return performances.find(p => p.subject === subjectId) || null;
  };

  // Determine if a level is available based on gamification rules
  const isLevelAvailable = (subjectId: string, level: number) => {
    // If gamification is disabled, all levels are available
    if (!gamificationEnabled) return true;
    
    // Otherwise, check if the level is unlocked for the subject
    const unlockedLevel = getUnlockedLevel(subjectId);
    return level <= unlockedLevel;
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get the number of completed quizzes for a subject
  const getCompletedQuizzesCount = (subjectId: string) => {
    return performances.filter(p => p.subject === subjectId).length;
  };

  // Get average score for a subject
  const getAverageScore = (subjectId: string) => {
    const subjectPerformances = performances.filter(p => p.subject === subjectId);
    if (subjectPerformances.length === 0) return 0;
    
    const totalScore = subjectPerformances.reduce((sum, perf) => sum + perf.score, 0);
    return Math.round(totalScore / subjectPerformances.length);
  };

  // Check if a level is passed
  const isLevelPassed = (subjectId: string, level: number) => {
    return performances.some(p => 
      p.subject === subjectId && 
      p.difficulty === level && 
      p.passed
    );
  };

  // Display loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Display error
  if (error) {
    return (
      <div className={`p-6 rounded-xl ${isDarkMode ? 'bg-red-900/20' : 'bg-red-50'} text-red-600 dark:text-red-400 flex items-center gap-3`}>
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>{error}</span>
      </div>
    );
  }

  // Display empty state
  if (subjects.length === 0) {
    return (
      <div className={`p-6 rounded-xl ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm text-center`}>
        <BookIcon className={`mx-auto h-12 w-12 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'} mb-4`} />
        <h3 className={`text-lg font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Aucune matière disponible</h3>
        <p className={`mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          Les matières pour les révisions intelligentes seront bientôt disponibles.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8 text-center">
        <h2 className={`text-3xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
          Choisissez une matière pour réviser
        </h2>
        <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          Nos quiz intelligents s'adaptent à votre niveau et vos résultats précédents
        </p>
      </div>

      {performances.length > 0 && (
        <div className={`p-4 rounded-xl mb-8 ${isDarkMode ? 'bg-blue-900/20' : 'bg-blue-50'} border ${isDarkMode ? 'border-blue-800' : 'border-blue-100'}`}>
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-800">
              <LineChart className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className={`font-medium ${isDarkMode ? 'text-blue-400' : 'text-blue-700'}`}>
                Votre progression
              </h3>
              <p className={`text-sm ${isDarkMode ? 'text-blue-300' : 'text-blue-600'}`}>
                {performances.length === 1 
                  ? 'Vous avez complété 1 quiz de révision' 
                  : `Vous avez complété ${performances.length} quiz de révision`}
                {performances[0] && ` (dernier: ${formatDate(performances[0].created_at)})`}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {subjects.map((subject) => {
          const unlockedLevel = getUnlockedLevel(subject.id);
          const lastPerformance = getLastPerformance(subject.id);
          const completedQuizzes = getCompletedQuizzesCount(subject.id);
          const avgScore = getAverageScore(subject.id);
          const hasStats = completedQuizzes > 0;

          return (
            <div 
              key={subject.id} 
              className={`rounded-xl p-6 border cursor-pointer transition-all ${
                selectedSubject?.id === subject.id 
                  ? isDarkMode 
                    ? 'bg-blue-900/30 border-blue-700' 
                    : 'bg-blue-50 border-blue-300'
                  : isDarkMode
                    ? 'bg-gray-800 border-gray-700 hover:border-gray-600'
                    : 'bg-white border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => {
                handleSubjectSelect(subject);
                toggleSubject(subject.id);
              }}
            >
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                    subject.color || 'bg-gradient-to-r from-blue-500 to-purple-500'
                  }`}>
                    <span className="text-white text-xl font-bold">
                      {subject.label.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {subject.label}
                    </h3>
                    <div className="flex items-center gap-2">
                      <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        Niveau débloqué: {unlockedLevel}/{maxLevel}
                      </span>
                      {unlockedLevel === maxLevel && (
                        <Trophy className="w-4 h-4 text-yellow-500" />
                      )}
                      {hasStats && (
                        <span className={`ml-2 text-sm ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                          • {completedQuizzes} quiz
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center">
                  {hasStats && (
                    <div className="mr-3">
                      <div className={`flex items-center text-sm font-medium ${
                        avgScore >= 70
                          ? isDarkMode ? 'text-green-400' : 'text-green-600'
                          : avgScore >= 50
                            ? isDarkMode ? 'text-yellow-400' : 'text-yellow-600'
                            : isDarkMode ? 'text-red-400' : 'text-red-600'
                      }`}>
                        <Award className="w-4 h-4 mr-1" />
                        {avgScore}%
                      </div>
                    </div>
                  )}
                  <ChevronDown 
                    className={`w-5 h-5 transition-transform ${
                      expandedSubject === subject.id ? 'rotate-180' : ''
                    } ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} 
                  />
                </div>
              </div>

              {lastPerformance && (
                <div className={`mt-3 p-2 rounded-lg ${
                  isDarkMode ? 'bg-gray-700/50' : 'bg-gray-100'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      Dernière révision: {formatDate(lastPerformance.created_at)}
                    </span>
                    <span className={`font-medium ${
                      lastPerformance.score >= 70
                        ? isDarkMode ? 'text-green-400' : 'text-green-600'
                        : lastPerformance.score >= 50
                          ? isDarkMode ? 'text-yellow-400' : 'text-yellow-600'
                          : isDarkMode ? 'text-red-400' : 'text-red-600'
                    }`}>
                      Score: {lastPerformance.score}%
                    </span>
                  </div>
                </div>
              )}

              {expandedSubject === subject.id && (
                <div className="mt-4 border-t border-dashed border-gray-200 dark:border-gray-700 pt-4">
                  <h4 className={`text-sm font-medium mb-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Choisissez un niveau de difficulté:
                  </h4>
                  <div className="grid grid-cols-5 gap-2 mb-4">
                    {Array.from({length: maxLevel}, (_, i) => i + 1).map((level) => {
                      const isAvailable = isLevelAvailable(subject.id, level);
                      const isPassed = isLevelPassed(subject.id, level);
                      
                      return (
                        <button
                          key={level}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (isAvailable) {
                              handleLevelSelect(level);
                            }
                          }}
                          disabled={!isAvailable}
                          className={`py-2 rounded-lg flex flex-col items-center justify-center ${
                            selectedLevel === level && selectedSubject?.id === subject.id
                              ? 'bg-blue-600 text-white'
                              : isAvailable
                                ? isDarkMode
                                  ? isPassed ? 'bg-green-800/50 text-green-200' : 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                                  : isPassed ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                : isDarkMode
                                  ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          }`}
                        >
                          <span>{level}</span>
                          {!isAvailable && <LockClosed className="w-3 h-3 mt-1" />}
                          {isPassed && isAvailable && <Award className="w-3 h-3 mt-1" />}
                        </button>
                      );
                    })}
                  </div>
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      startQuiz();
                    }}
                    className={`w-full py-3 flex items-center justify-center rounded-lg ${
                      isDarkMode
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700'
                        : 'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600'
                    } text-white font-medium transition-colors`}
                  >
                    <Sparkles className="w-5 h-5 mr-2" />
                    Lancer le quiz
                  </button>
                  
                  {hasStats && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onViewSubjectStats(subject);
                      }}
                      className={`w-full mt-2 py-2 flex items-center justify-center rounded-lg ${
                        isDarkMode
                          ? 'bg-gray-700 hover:bg-gray-600 text-gray-200'
                          : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                      } font-medium transition-colors`}
                    >
                      <LineChart className="w-4 h-4 mr-2" />
                      Voir mes statistiques
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className={`rounded-xl p-6 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-full ${isDarkMode ? 'bg-purple-900/30' : 'bg-purple-100'}`}>
            <Sparkles className={`w-5 h-5 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`} />
          </div>
          <div>
            <h3 className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Comment fonctionnent les révisions intelligentes ?
            </h3>
            <p className={`mt-2 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Nos quiz s'adaptent automatiquement à votre niveau et votre progression. 
              Plus vous réussissez, plus les niveaux supérieurs se débloquent, vous permettant 
              d'affronter des défis de plus en plus complexes. Chaque quiz est généré à partir 
              des ressources pédagogiques correspondant à votre matière et niveau.
            </p>
            
            <div className="flex items-center gap-2 mt-2">
              <Database className="w-4 h-4 text-blue-400 opacity-60" />
              <span className="text-xs text-blue-400 opacity-60">Quiz basés sur des ressources pédagogiques</span>
            </div>
            
            <h4 className={`font-medium mt-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Niveaux de difficulté:
            </h4>
            <ul className={`mt-1 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              <li className="flex items-center gap-1">
                <span className="inline-block w-5 h-5 text-center rounded-full bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 text-xs font-bold">1</span>
                <span>Très facile - QCM uniquement</span>
              </li>
              <li className="flex items-center gap-1">
                <span className="inline-block w-5 h-5 text-center rounded-full bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400 text-xs font-bold">2</span>
                <span>Facile - QCM et vrai/faux</span>
              </li>
              <li className="flex items-center gap-1">
                <span className="inline-block w-5 h-5 text-center rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 text-xs font-bold">3</span>
                <span>Moyen - QCM, vrai/faux et questions ouvertes</span>
              </li>
              <li className="flex items-center gap-1">
                <span className="inline-block w-5 h-5 text-center rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400 text-xs font-bold">4</span>
                <span>Difficile - QCM et questions ouvertes</span>
              </li>
              <li className="flex items-center gap-1">
                <span className="inline-block w-5 h-5 text-center rounded-full bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 text-xs font-bold">5</span>
                <span>Très difficile - Questions ouvertes uniquement</span>
              </li>
            </ul>
            
            {gamificationEnabled && (
              <div className={`mt-4 p-3 rounded-lg ${
                isDarkMode ? 'bg-yellow-900/20' : 'bg-yellow-50'
              }`}>
                <div className="flex items-start gap-2">
                  <Trophy className={`w-5 h-5 ${isDarkMode ? 'text-yellow-400' : 'text-yellow-600'}`} />
                  <div>
                    <h5 className={`font-medium text-sm ${isDarkMode ? 'text-yellow-400' : 'text-yellow-700'}`}>
                      Mode progression activé
                    </h5>
                    <p className={`text-xs ${isDarkMode ? 'text-yellow-300' : 'text-yellow-600'}`}>
                      Vous devez réussir un niveau avec un score d'au moins 70% pour débloquer le niveau suivant.
                      Les niveaux déjà validés vous restent accessibles pour réviser.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Book icon component
const BookIcon = ({ className }: { className: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    className={className} 
    fill="none" 
    viewBox="0 0 24 24" 
    stroke="currentColor"
  >
    <path 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      strokeWidth="2" 
      d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" 
    />
  </svg>
);