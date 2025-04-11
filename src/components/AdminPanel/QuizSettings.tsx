import React, { useState, useEffect } from 'react';
import { Save, AlertCircle, Check, HelpCircle, List, BookOpen, MessageSquare, Clock, BarChart2 } from 'lucide-react';
import { 
  getDoc, 
  setDoc, 
  doc, 
  onSnapshot, 
  collection, 
  query, 
  orderBy,
  updateDoc
} from 'firebase/firestore';
import { db } from '../../lib/firebase';

// Types definitions
interface Subject {
  id: string;
  label: string;
  isActiveInQuiz?: boolean;
}

interface EducationLevel {
  id: string;
  label: string;
}

interface ResourceType {
  id: string;
  label: string;
}

interface DifficultyLevel {
  value: number;
  label: string;
}

interface QuizSettings {
  totalQuestions: number;
  passThreshold: number;
  timeLimit: number;
  showCorrectionExplanation: boolean;
  enableGamification: boolean;
  randomizeQuestions: boolean;
  quizSourceType: string;
  questionLanguage: string;
  questionFormat: string;
  levels: string[];
  feedback: {
    passedMessage: string;
    failedMessage: string;
  };
  activeSubjects?: Record<string, boolean>; // Maps subject IDs to active status
}

// Default quiz settings
const defaultQuizSettings: QuizSettings = {
  totalQuestions: 10,
  passThreshold: 70,
  timeLimit: 30,
  showCorrectionExplanation: true,
  enableGamification: true,
  randomizeQuestions: true,
  quizSourceType: '',
  questionLanguage: 'fr',
  questionFormat: 'mcq',
  levels: [],
  feedback: {
    passedMessage: 'Félicitations ! Vous avez réussi ce quiz avec succès. Continuez comme ça !',
    failedMessage: 'Vous n\'avez pas atteint le score minimal. Révisez et réessayez. Vous pouvez y arriver !'
  },
  activeSubjects: {}
};

// Question format options
const QUESTION_FORMATS = [
  { id: 'mcq', label: 'QCM (choix multiples)' },
  { id: 'open', label: 'Questions ouvertes' },
  { id: 'true_false', label: 'Vrai ou Faux' },
  { id: 'mixed', label: 'Format mixte' }
];

// Language options
const LANGUAGES = [
  { id: 'fr', label: 'Français' },
  { id: 'en', label: 'Anglais' }
];

export default function QuizSettings() {
  // State for quiz settings
  const [settings, setSettings] = useState<QuizSettings>(defaultQuizSettings);
  const [originalSettings, setOriginalSettings] = useState<QuizSettings>(defaultQuizSettings);
  
  // State for changed indication
  const [hasChanges, setHasChanges] = useState(false);
  
  // State for loading status
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // State for dynamic data from Firestore
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [educationLevels, setEducationLevels] = useState<EducationLevel[]>([]);
  const [resourceTypes, setResourceTypes] = useState<ResourceType[]>([]);
  const [difficultyLevels, setDifficultyLevels] = useState<DifficultyLevel[]>([]);
  
  // Loading states
  const [loadingSubjects, setLoadingSubjects] = useState(true);
  const [loadingLevels, setLoadingLevels] = useState(true);
  const [loadingTypes, setLoadingTypes] = useState(true);
  const [loadingDifficulties, setLoadingDifficulties] = useState(true);

  // Load subjects and other collections
  useEffect(() => {
    const subjectsUnsubscribe = onSnapshot(
      query(collection(db, 'subjects'), orderBy('label')),
      (snapshot) => {
        const subjectsData = snapshot.docs.map(doc => ({
          id: doc.data().id,
          label: doc.data().label,
          isActiveInQuiz: doc.data().isActiveInQuiz
        }));
        setSubjects(subjectsData);
        setLoadingSubjects(false);
      },
      (error) => {
        console.error('Error fetching subjects:', error);
        setLoadingSubjects(false);
      }
    );
    
    const levelsUnsubscribe = onSnapshot(
      query(collection(db, 'education_levels'), orderBy('label')),
      (snapshot) => {
        const levelsData = snapshot.docs.map(doc => ({
          id: doc.data().id,
          label: doc.data().label
        }));
        setEducationLevels(levelsData);
        setLoadingLevels(false);
      },
      (error) => {
        console.error('Error fetching education levels:', error);
        setLoadingLevels(false);
      }
    );
    
    const typesUnsubscribe = onSnapshot(
      query(collection(db, 'resource_types'), orderBy('label')),
      (snapshot) => {
        const typesData = snapshot.docs.map(doc => ({
          id: doc.data().id,
          label: doc.data().label
        }));
        setResourceTypes(typesData);
        setLoadingTypes(false);
      },
      (error) => {
        console.error('Error fetching resource types:', error);
        setLoadingTypes(false);
      }
    );
    
    const difficultiesUnsubscribe = onSnapshot(
      query(collection(db, 'difficulty_levels'), orderBy('value')),
      (snapshot) => {
        const difficultiesData = snapshot.docs.map(doc => ({
          value: doc.data().value,
          label: doc.data().label
        }));
        setDifficultyLevels(difficultiesData);
        setLoadingDifficulties(false);
      },
      (error) => {
        console.error('Error fetching difficulty levels:', error);
        setLoadingDifficulties(false);
      }
    );

    return () => {
      subjectsUnsubscribe();
      levelsUnsubscribe();
      typesUnsubscribe();
      difficultiesUnsubscribe();
    };
  }, []);

  // Load quiz settings from Firestore
  useEffect(() => {
    const fetchQuizSettings = async () => {
      try {
        const docRef = doc(db, 'configurations', 'quiz_settings');
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data() as QuizSettings;
          // Ensure we have all fields by merging with default settings
          const mergedSettings = { ...defaultQuizSettings, ...data };
          
          // Handle activeSubjects mapping if it exists in old format or is missing
          if (!mergedSettings.activeSubjects) {
            mergedSettings.activeSubjects = {};
          }
          
          setSettings(mergedSettings);
          setOriginalSettings(mergedSettings);
        } else {
          // If the document doesn't exist, create it with default values
          await setDoc(docRef, defaultQuizSettings);
        }
      } catch (error) {
        console.error('Error fetching quiz settings:', error);
        setNotification({
          message: 'Erreur lors du chargement des paramètres',
          type: 'error'
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchQuizSettings();
  }, []);

  // Check for changes
  useEffect(() => {
    if (loading) return;
    
    // Deep comparison between current and original settings
    const hasSettingsChanged = JSON.stringify(settings) !== JSON.stringify(originalSettings);
    setHasChanges(hasSettingsChanged);
  }, [settings, originalSettings, loading]);

  // Update subject active status
  const handleSubjectToggle = (subjectId: string, isActive: boolean) => {
    setSettings(prev => ({
      ...prev,
      activeSubjects: {
        ...prev.activeSubjects,
        [subjectId]: isActive
      }
    }));
  };

  // Handle level selection toggle
  const handleLevelToggle = (levelId: string) => {
    setSettings(prev => {
      const newLevels = prev.levels.includes(levelId)
        ? prev.levels.filter(id => id !== levelId)
        : [...prev.levels, levelId];
      
      return {
        ...prev,
        levels: newLevels
      };
    });
  };

  // Save settings to Firestore
  const saveSettings = async () => {
    setSaving(true);
    try {
      const docRef = doc(db, 'configurations', 'quiz_settings');
      await setDoc(docRef, settings);
      
      // Update subject collection documents with isActiveInQuiz field
      const subjectPromises = subjects.map(async (subject) => {
        // Get the document ID by querying for the subject ID
        const q = query(collection(db, 'subjects'), orderBy('id'));
        const querySnapshot = await getDocs(q);
        const subjectDoc = querySnapshot.docs.find(doc => doc.data().id === subject.id);
        
        if (subjectDoc) {
          const isActive = settings.activeSubjects?.[subject.id] ?? false;
          return updateDoc(doc(db, 'subjects', subjectDoc.id), {
            isActiveInQuiz: isActive
          });
        }
      });
      
      await Promise.all(subjectPromises);
      
      setOriginalSettings(settings);
      setNotification({
        message: 'Paramètres enregistrés avec succès',
        type: 'success'
      });
    } catch (error) {
      console.error('Error saving quiz settings:', error);
      setNotification({
        message: 'Erreur lors de l\'enregistrement des paramètres',
        type: 'error'
      });
    } finally {
      setSaving(false);
      setTimeout(() => setNotification(null), 3000);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Paramètres des quiz
        </h1>
      </div>

      {notification && (
        <div 
          className={`p-4 rounded-lg ${
            notification.type === 'success' 
              ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400' 
              : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
          } flex items-center gap-2`}
        >
          {notification.type === 'success' ? (
            <Check className="w-5 h-5 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
          )}
          <p>{notification.message}</p>
        </div>
      )}

      {loading || loadingSubjects || loadingLevels || loadingTypes || loadingDifficulties ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Configuration générale */}
          <section className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <Clock className="w-6 h-6 text-blue-500" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Configuration générale
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nombre de questions par quiz
                </label>
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={settings.totalQuestions}
                  onChange={(e) => setSettings(prev => ({ 
                    ...prev, 
                    totalQuestions: parseInt(e.target.value) || 1 
                  }))}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Nombre recommandé: entre 5 et 20 questions
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Seuil de validation (%)
                </label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={settings.passThreshold}
                  onChange={(e) => setSettings(prev => ({ 
                    ...prev, 
                    passThreshold: parseInt(e.target.value) || 0 
                  }))}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Pourcentage minimal pour réussir le quiz
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Temps limite (minutes)
                </label>
                <input
                  type="number"
                  min={1}
                  max={1200}
                  value={settings.timeLimit}
                  onChange={(e) => setSettings(prev => ({ 
                    ...prev, 
                    timeLimit: parseInt(e.target.value) || 1 
                  }))}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Durée maximale pour compléter le quiz
                </p>
              </div>
            </div>
          </section>

          {/* Options */}
          <section className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <List className="w-6 h-6 text-purple-500" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Options
              </h2>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between py-3">
                <div>
                  <h3 className="text-base font-medium text-gray-900 dark:text-white">
                    Explications à la correction
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Afficher les explications détaillées après chaque question
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.showCorrectionExplanation}
                    onChange={(e) => setSettings(prev => ({ 
                      ...prev, 
                      showCorrectionExplanation: e.target.checked 
                    }))}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between py-3">
                <div>
                  <h3 className="text-base font-medium text-gray-900 dark:text-white">
                    Gamification
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Activer les points, badges et classements
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.enableGamification}
                    onChange={(e) => setSettings(prev => ({ 
                      ...prev, 
                      enableGamification: e.target.checked 
                    }))}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between py-3">
                <div>
                  <h3 className="text-base font-medium text-gray-900 dark:text-white">
                    Randomiser les questions
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Mélanger l'ordre des questions à chaque quiz
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.randomizeQuestions}
                    onChange={(e) => setSettings(prev => ({ 
                      ...prev, 
                      randomizeQuestions: e.target.checked 
                    }))}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>
          </section>

          {/* Format des questions */}
          <section className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <HelpCircle className="w-6 h-6 text-green-500" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Format des questions
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Source du quiz
                </label>
                <select
                  value={settings.quizSourceType}
                  onChange={(e) => setSettings(prev => ({ 
                    ...prev, 
                    quizSourceType: e.target.value 
                  }))}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">Sélectionner une source</option>
                  {resourceTypes.map(type => (
                    <option key={type.id} value={type.id}>{type.label}</option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Type de ressource documentaire utilisé pour générer les quiz
                </p>
              </div>
              
              {settings.quizSourceType && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Langue des questions
                    </label>
                    <select
                      value={settings.questionLanguage}
                      onChange={(e) => setSettings(prev => ({ 
                        ...prev, 
                        questionLanguage: e.target.value 
                      }))}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      {LANGUAGES.map(lang => (
                        <option key={lang.id} value={lang.id}>{lang.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Format des questions
                    </label>
                    <select
                      value={settings.questionFormat}
                      onChange={(e) => setSettings(prev => ({ 
                        ...prev, 
                        questionFormat: e.target.value 
                      }))}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      {QUESTION_FORMATS.map(format => (
                        <option key={format.id} value={format.id}>{format.label}</option>
                      ))}
                    </select>
                  </div>
                </>
              )}
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Niveaux scolaires ciblés
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {educationLevels.map(level => (
                  <div 
                    key={level.id}
                    className={`flex items-center p-3 rounded-lg border ${
                      settings.levels.includes(level.id)
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-300 dark:border-gray-600'
                    } cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors`}
                    onClick={() => handleLevelToggle(level.id)}
                  >
                    <input
                      type="checkbox"
                      checked={settings.levels.includes(level.id)}
                      onChange={() => {}}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                    />
                    <label className="ml-2 text-sm font-medium text-gray-900 dark:text-white cursor-pointer">
                      {level.label}
                    </label>
                  </div>
                ))}
              </div>
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                Sélectionnez les niveaux pour lesquels ce quiz sera disponible
              </p>
            </div>
          </section>

          {/* Matières actives */}
          <section className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <BookOpen className="w-6 h-6 text-indigo-500" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Matières actives
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {subjects.map(subject => (
                <div
                  key={subject.id}
                  className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                >
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {subject.label}
                  </span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.activeSubjects?.[subject.id] ?? false}
                      onChange={(e) => handleSubjectToggle(subject.id, e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              ))}
            </div>
          </section>

          {/* Messages de feedback */}
          <section className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <MessageSquare className="w-6 h-6 text-yellow-500" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Messages de feedback
              </h2>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Message de réussite
                </label>
                <textarea
                  value={settings.feedback.passedMessage}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    feedback: {
                      ...prev.feedback,
                      passedMessage: e.target.value
                    }
                  }))}
                  rows={3}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Message affiché en cas de réussite du quiz"
                ></textarea>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Message d'échec
                </label>
                <textarea
                  value={settings.feedback.failedMessage}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    feedback: {
                      ...prev.feedback,
                      failedMessage: e.target.value
                    }
                  }))}
                  rows={3}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Message affiché en cas d'échec du quiz"
                ></textarea>
              </div>
            </div>
          </section>

          {/* Aperçu des paramètres */}
          <section className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <BarChart2 className="w-6 h-6 text-orange-500" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Résumé des paramètres
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-5 h-5 text-blue-500" />
                  <h3 className="text-sm font-semibold text-gray-800 dark:text-white">
                    Configuration de base
                  </h3>
                </div>
                <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-300">
                  <li>• {settings.totalQuestions} questions par quiz</li>
                  <li>• Seuil de réussite: {settings.passThreshold}%</li>
                  <li>• Temps limite: {settings.timeLimit} minutes</li>
                </ul>
              </div>

              <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <List className="w-5 h-5 text-purple-500" />
                  <h3 className="text-sm font-semibold text-gray-800 dark:text-white">
                    Options actives
                  </h3>
                </div>
                <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-300">
                  <li>• {settings.showCorrectionExplanation ? 'Avec' : 'Sans'} explications détaillées</li>
                  <li>• Gamification: {settings.enableGamification ? 'Activée' : 'Désactivée'}</li>
                  <li>• Questions: {settings.randomizeQuestions ? 'Aléatoires' : 'Ordonnées'}</li>
                </ul>
              </div>

              <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <HelpCircle className="w-5 h-5 text-green-500" />
                  <h3 className="text-sm font-semibold text-gray-800 dark:text-white">
                    Format des questions
                  </h3>
                </div>
                <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-300">
                  <li>• Source: {settings.quizSourceType ? resourceTypes.find(t => t.id === settings.quizSourceType)?.label || settings.quizSourceType : 'Non définie'}</li>
                  <li>• Langue: {LANGUAGES.find(l => l.id === settings.questionLanguage)?.label || settings.questionLanguage}</li>
                  <li>• Format: {QUESTION_FORMATS.find(f => f.id === settings.questionFormat)?.label || settings.questionFormat}</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Submit button */}
          <div className="flex justify-end">
            <button
              onClick={saveSettings}
              disabled={saving || !hasChanges}
              className={`flex items-center gap-2 px-6 py-3 text-white rounded-lg transition-colors ${
                hasChanges 
                  ? 'bg-blue-600 hover:bg-blue-700' 
                  : 'bg-gray-400 cursor-not-allowed'
              } disabled:opacity-70 disabled:cursor-not-allowed`}
            >
              <Save className="w-5 h-5" />
              {saving ? 'Enregistrement en cours...' : 'Enregistrer les modifications'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}