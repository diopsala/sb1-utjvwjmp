import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { collection, query, where, getDocs, doc, getDoc, orderBy, limit, setDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { ArrowLeft, BookOpen, Brain, TrendingUp } from 'lucide-react';
import SubjectSelection from './SubjectSelection';
import QuizInterface from './QuizInterface';
import Results from './Results';
import RevisionStats from './RevisionStats';
import { Resource } from '../../types/resources';
import { Subject } from '../../types/subjects';
import { Quiz, QuizSettings, RevisionPerformance, UserStats } from '../../types/revisions';

enum RevisionStep {
  SUBJECT_SELECTION,
  QUIZ,
  RESULTS,
  STATS
}

export default function Revisions({ onBack }: { onBack: () => void }) {
  const { currentUser } = useAuth();
  const [step, setStep] = useState<RevisionStep>(RevisionStep.SUBJECT_SELECTION);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [quizSettings, setQuizSettings] = useState<QuizSettings | null>(null);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [suggestedLevel, setSuggestedLevel] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [quizResources, setQuizResources] = useState<Resource[]>([]);
  const [revisionPerformances, setRevisionPerformances] = useState<RevisionPerformance[]>([]);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Check for dark mode
  useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark');
    setIsDarkMode(isDark);
  }, []);

  const ensureRevisionPerformanceCollectionExists = async (uid: string) => {
    try {
      // This function can be used to ensure the collection structure exists
      // For example, you might want to create an initial document if none exists
      const performancesRef = collection(db, 'revision_performances', uid, 'records');
      const snapshot = await getDocs(query(performancesRef, limit(1)));
      
      if (snapshot.empty) {
        console.info('No revision performance records found, collection will be created on first quiz completion');
      }
    } catch (error) {
      console.error('Error checking revision performance collection:', error);
    }
  };

  const ensureUserStatsExists = async (uid: string) => {
    try {
      const userStatsRef = doc(db, 'user_stats', uid);
      const userStatsDoc = await getDoc(userStatsRef);
      
      if (!userStatsDoc.exists()) {
        // Create default user stats
        await setDoc(userStatsRef, {
          unlockedLevels: {},
          lastPerformances: {},
          averageScores: {}
        });
        console.info('Created default user stats document');
      }
    } catch (error) {
      console.error('Error ensuring user stats exists:', error);
    }
  };

  // Load subjects and quiz settings on component mount
  useEffect(() => {
    const loadInitialData = async () => {
      if (!currentUser) {
        setLoading(false);
        setError("Vous devez être connecté pour accéder aux révisions");
        return;
      }

      try {
        // Ensure the collection structure exists
        await ensureRevisionPerformanceCollectionExists(currentUser.uid);
        await ensureUserStatsExists(currentUser.uid);

        setLoading(true);
        setError(null);
         
        // Fetch subjects that are active in quiz
        const subjectsQuery = query(
          collection(db, 'subjects'),
          where('isActiveInQuiz', '==', true),
          orderBy('label')
        );
        console.info('Fetch subjects that are active in quiz');
        const subjectsSnapshot = await getDocs(subjectsQuery);
        const subjectsData = subjectsSnapshot.docs.map(doc => ({
          ...doc.data() as Subject,
          docId: doc.id
        }));
        setSubjects(subjectsData);

        console.info(' -- start Fetch quiz settings');

        // Fetch quiz settings
        const quizSettingsDoc = await getDoc(doc(db,'configurations','quiz_settings'));
        if (quizSettingsDoc.exists()) {
          setQuizSettings(quizSettingsDoc.data() as QuizSettings);
        } else {
          // Default settings if not found
          setQuizSettings({
            questionsPerQuiz: 10,
            passThreshold: 70,
            revisionFileLimit: 3,
            enableGamification: true,
            defaultDifficulty: 1,
            maxDifficulty: 5
          });
        }

        console.info('-- end Fetch quiz settings');

        // Fetch user stats
        const userStatsDoc = await getDoc(doc(db, 'user_stats', currentUser.uid));
        if (userStatsDoc.exists()) {
          setUserStats(userStatsDoc.data() as UserStats);
        }

        console.info('Fetch user stats');

        // Fetch user profile to get education level
        const userProfileDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userProfileDoc.exists()) {
          const userProfile = userProfileDoc.data();
          // Logic to determine suggested level based on education level
          if (userProfile.educationLevel) {
            // Map education level to suggested difficulty (this is a simple example)
            const levelMap: { [key: string]: number } = {
              'college': 1,
              'seconde': 2,
              'premiere': 3,
              'terminale': 4,
              'superieur': 5
            };
            const mappedLevel = levelMap[userProfile.educationLevel] || 1;
            setSuggestedLevel(mappedLevel);
          }
        }

        console.info('Fetch user profile to get education level');

        // Fetch recent performance data to refine suggested level
        const performanceQuery = query(
          collection(db, 'revision_performances', currentUser.uid, 'records'),
          orderBy('created_at', 'desc'),
          limit(5)
        );

        console.info('Fetch recent performance data to refine suggested level');
        
        const performanceSnapshot = await getDocs(performanceQuery);
        const performanceData = performanceSnapshot.docs.map(doc => ({
          ...doc.data() as RevisionPerformance,
          id: doc.id
        }));
        
        setRevisionPerformances(performanceData);
        
        // If there's performance data, adjust the suggested level
        if (performanceData.length > 0) {
          // Calculate average score
          const avgScore = performanceData.reduce((sum, perf) => sum + perf.score, 0) / performanceData.length;
          
          // Adjust suggested level based on average score
          if (avgScore >= 90) {
            setSuggestedLevel(prev => Math.min(prev + 1, quizSettings?.maxDifficulty || 5));
          } else if (avgScore < 60) {
            setSuggestedLevel(prev => Math.max(prev - 1, 1));
          }
        }
      } catch (error) {
        console.error('Error loading initial data:', error);
        setError('Erreur lors du chargement des données initiales');
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, [currentUser]);

  const handleStartQuiz = async (subject: Subject, difficulty: number) => {
    if (!currentUser || !quizSettings) return;
    
    setLoading(true);
    setError(null);
    
    try {
      console.info("subject.id = "+subject.id+", difficulty = "+difficulty);
      
      // 1. Fetch appropriate resources for the quiz
      const resourcesQuery = query(
        collection(db, 'resources'),
        where('subject', '==', subject.id),
        where('difficulty', '<=', difficulty),
        limit(quizSettings.revisionFileLimit || 3)
      );
      
      const resourcesSnapshot = await getDocs(resourcesQuery);
      const resourcesData = resourcesSnapshot.docs.map(doc => ({
        ...doc.data() as Resource,
        id: doc.id
      }));
      
      if (resourcesData.length === 0) {
        throw new Error('Aucune ressource disponible pour cette matière et ce niveau de difficulté');
      }
      
      setQuizResources(resourcesData);
      
      // 2. Generate quiz from resources using GPT-4o
      const generatedQuiz = await generateQuiz(subject, difficulty, resourcesData, quizSettings);
      setQuiz(generatedQuiz);
      
      // 3. Update UI state
      setSelectedSubject(subject);
      setStep(RevisionStep.QUIZ);
    } catch (error) {
      console.error('Error starting quiz:', error);
      setError(error instanceof Error ? error.message : 'Erreur lors de la génération du quiz');
    } finally {
      setLoading(false);
    }
  };

  const handleQuizCompleted = async (finalQuiz: Quiz, performance: RevisionPerformance) => {
    setQuiz(finalQuiz);
    
    if (currentUser && quizSettings) {
      try {
        // Add the performance to the list of performances
        setRevisionPerformances(prev => [performance, ...prev]);
        
        // Update the user stats in Firestore
        const userStatsRef = doc(db, 'user_stats', currentUser.uid);
        const userStatsDoc = await getDoc(userStatsRef);
        
        if (userStatsDoc.exists()) {
          const userData = userStatsDoc.data();
          
          // Get current unlocked levels
          const unlockedLevels = userData.unlockedLevels || {};
          
          // Get current last performances
          const lastPerformances = userData.lastPerformances || {};
          
          // Get current average scores
          const averageScores = userData.averageScores || {};
          
          // Update last performance for this subject
          lastPerformances[performance.subject] = {
            lastScore: performance.score,
            lastAttemptAt: performance.finished_at
          };
          
          // Calculate new average score
          const subjectPerformances = [
            ...revisionPerformances.filter(p => p.subject === performance.subject),
            performance
          ];
          const totalScore = subjectPerformances.reduce((sum, p) => sum + p.score, 0);
          const avgScore = Math.round(totalScore / subjectPerformances.length);
          averageScores[performance.subject] = avgScore;
          
          // If the quiz was passed and gamification is enabled, unlock the next level
          if (performance.passed && quizSettings.enableGamification) {
            const currentLevel = unlockedLevels[performance.subject] || 1;
            
            // Only unlock the next level if the current one was just completed
            // and it's not already at the max level
            if (performance.difficulty === currentLevel && 
                currentLevel < (quizSettings.maxDifficulty || 5)) {
              unlockedLevels[performance.subject] = currentLevel + 1;
            }
          }
          
          // If this is the first quiz for this subject, initialize the unlocked level
          if (!unlockedLevels[performance.subject]) {
            unlockedLevels[performance.subject] = 1;
          }
          
          // Update Firestore with merge: true to only update these fields
          await setDoc(userStatsRef, {
            unlockedLevels,
            lastPerformances,
            averageScores
          }, { merge: true });
          
          // Update local state
          setUserStats(prev => ({
            ...prev,
            unlockedLevels,
            lastPerformances,
            averageScores
          }));
        } else {
          // Create a new user stats document
          const newUserStats = {
            unlockedLevels: {
              [performance.subject]: performance.passed && performance.difficulty === 1 ? 2 : 1
            },
            lastPerformances: {
              [performance.subject]: {
                lastScore: performance.score,
                lastAttemptAt: performance.finished_at
              }
            },
            averageScores: {
              [performance.subject]: performance.score
            }
          };
          
          await setDoc(userStatsRef, newUserStats);
          
          // Update local state
          setUserStats(newUserStats);
        }
        
      } catch (error) {
        console.error('Error updating user stats:', error);
      }
    }
    
    setStep(RevisionStep.RESULTS);
  };

  const handleBackToSubjects = () => {
    setStep(RevisionStep.SUBJECT_SELECTION);
    setSelectedSubject(null);
    setQuiz(null);
  };

  const handleViewStats = () => {
    setStep(RevisionStep.STATS);
  };

  const handleViewSubjectStats = (subject: Subject) => {
    setSelectedSubject(subject);
    setStep(RevisionStep.STATS);
  };

  const handleReturnToResults = () => {
    setStep(RevisionStep.RESULTS);
  };

  // Function to generate a quiz using GPT-4o
  const generateQuiz = async (
    subject: Subject,
    difficulty: number, 
    resources: Resource[],
    settings: QuizSettings
  ): Promise<Quiz> => {
    try {
      // Determine question format based on difficulty
      let questionFormat = 'mixed';
      if (difficulty === 1) questionFormat = 'mcq'; // Easiest: multiple choice only
      else if (difficulty === 2) questionFormat = 'mcq,true_false';
      else if (difficulty === 3) questionFormat = 'mcq,true_false,open';
      else if (difficulty === 4) questionFormat = 'mcq,open';
      else if (difficulty === 5) questionFormat = 'open'; // Hardest: open questions only
      
      // Prepare prompt for GPT-4o
      const prompt = {
        role: 'system',
        content: `Tu es un professeur virtuel. Génère un quiz en ${subject.label}, niveau ${difficulty}/5, 
        à partir des contenus suivants : ${resources.map(r => r.title).join(', ')}. 
        Format : ${questionFormat}, Langue : ${resources[0].language === 'en' ? 'anglais' : 'français'}.
        
        Génère exactement ${settings.questionsPerQuiz} questions. Respecte strictement le format JSON suivant :
        
        {
          "title": "Titre du quiz",
          "subject": "${subject.label}",
          "difficulty": ${difficulty},
          "questions": [
            {
              "id": 1,
              "text": "Texte de la question",
              "type": "mcq OR true_false OR open",
              "choices": ["Option A", "Option B", "Option C", "Option D"],
              "answer": "A ou B ou C ou D ou true/false ou réponse attendue pour les questions ouvertes"
            }
          ]
        }
        
        Règles importantes :
        - Pour les questions MCQ, inclu toujours les choix A, B, C, D et indique la bonne réponse par sa lettre
        - Pour les true_false, indique "true" ou "false" comme réponse
        - Pour les open, fournis une réponse modèle pour l'évaluation
        - Les questions doivent être pertinentes par rapport au contenu des ressources
        - Adapte la difficulté au niveau demandé (${difficulty}/5)
        - IMPORTANT: Assure-toi que le JSON est valide sans erreurs de syntaxe 
        - IMPORTANT: Réponds UNIQUEMENT avec le JSON, sans texte avant ou après
        - IMPORTANT: Vérifie bien que le JSON est correct et parsable en JavaScript`
      };
      
      // Make API call to OpenAI with resource contents
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            prompt,
            {
              role: 'user', 
              content: `Génère un quiz pour réviser en ${subject.label}, niveau de difficulté ${difficulty}/5.`
            }
          ],
          temperature: 0.7,
          max_tokens: 1500,
        }),
      });
      
      if (!response.ok) {
        throw new Error("Erreur lors de la génération du quiz avec l'IA");
      }
      
      const data = await response.json();
      const quizContent = data.choices[0]?.message?.content;
      
      if (!quizContent) {
        throw new Error("Réponse vide de l'IA");
      }
      
      // Log the raw response for debugging
      console.log("Raw OpenAI Response:", quizContent);
      
      // Extract JSON from response
      let quizData: Quiz;
      try {
        // Find JSON in the response (it might be surrounded by text)
        const jsonMatch = quizContent.match(/\{[\s\S]*\}/);
        
        if (!jsonMatch) {
          throw new Error("Format JSON non trouvé dans la réponse");
        }
        
        const jsonString = jsonMatch[0];
        console.log("Extracted JSON string:", jsonString);
        
        // Try to parse the JSON
        try {
          quizData = JSON.parse(jsonString);
        } catch (parseError) {
          // If parsing fails, try to clean the string
          console.error("Initial JSON parsing failed:", parseError);
          
          // Try to clean quotation marks and escape characters
          const cleanedJson = jsonString
            .replace(/\\"/g, '"') // Replace escaped quotes
            .replace(/\\n/g, ' ') // Replace newlines
            .replace(/\\t/g, ' ') // Replace tabs
            .replace(/\s+/g, ' ') // Normalize whitespace
            .replace(/"\s+"/g, '""') // Fix spaces between quotes
            .replace(/"([^"]*)":\s*"([^"]*)"/g, '"$1":"$2"'); // Fix spacing in key-value pairs
            
          console.log("Cleaned JSON string:", cleanedJson);
          
          // Try parsing the cleaned JSON
          quizData = JSON.parse(cleanedJson);
        }
        
        // Validate quiz structure
        if (!quizData) {
          throw new Error("Impossible de parser le JSON");
        }
        
        if (!quizData.questions || !Array.isArray(quizData.questions)) {
          throw new Error("Le quiz ne contient pas de tableau de questions valide");
        }
        
        // Validate individual questions
        for (const question of quizData.questions) {
          if (!question.id || !question.text || !question.type || !question.answer) {
            throw new Error(`Question invalide: ${JSON.stringify(question)}`);
          }
          
          // Ensure MCQ questions have choices
          if (question.type === 'mcq' && (!question.choices || !Array.isArray(question.choices) || question.choices.length < 2)) {
            throw new Error(`Les options pour la QCM ${question.id} sont manquantes ou invalides`);
          }
        }
        
        // Add user response field to each question
        quizData.questions = quizData.questions.map(q => ({
          ...q,
          userResponse: null,
          isCorrect: null,
          feedback: null
        }));
        
        // Add metadata
        quizData.totalQuestions = quizData.questions.length;
        quizData.currentQuestion = 0;
        quizData.score = null;
        quizData.completed = false;
        quizData.startTime = new Date().toISOString();
        
        return quizData;
      } catch (error) {
        console.error("Error parsing quiz JSON:", error);
        console.error("Attempted to parse:", quizContent);
        throw new Error("Erreur lors de l'analyse du quiz généré");
      }
    } catch (error) {
      console.error("Error in generateQuiz:", error);
      throw error;
    }
  };

  // Render the appropriate component based on the current step
  const renderStep = () => {
    switch (step) {
      case RevisionStep.SUBJECT_SELECTION:
        return (
          <SubjectSelection 
            subjects={subjects} 
            suggestedLevel={suggestedLevel}
            maxLevel={quizSettings?.maxDifficulty || 5}
            onStartQuiz={handleStartQuiz}
            onViewSubjectStats={handleViewSubjectStats}
            userStats={userStats}
            performances={revisionPerformances}
            loading={loading}
            error={error}
            isDarkMode={isDarkMode}
          />
        );
      case RevisionStep.QUIZ:
        return (
          <QuizInterface 
            quiz={quiz!} 
            subject={selectedSubject!} 
            onComplete={handleQuizCompleted}
            quizSettings={quizSettings!}
            isDarkMode={isDarkMode}
          />
        );
      case RevisionStep.RESULTS:
        return (
          <Results 
            quiz={quiz!} 
            subject={selectedSubject!}
            onBackToSubjects={handleBackToSubjects}
            onViewStats={handleViewStats}
            isDarkMode={isDarkMode}
          />
        );
      case RevisionStep.STATS:
        return (
          <RevisionStats 
            performances={revisionPerformances}
            subject={selectedSubject}
            onBack={handleReturnToResults}
            isDarkMode={isDarkMode}
          />
        );
      default:
        return <div>Erreur inattendue</div>;
    }
  };

  // Header component
  const Header = () => (
    <header className={`fixed top-0 w-full ${isDarkMode ? 'bg-gray-800/95' : 'bg-white/95'} backdrop-blur-sm shadow-sm z-50`}>
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => step === RevisionStep.SUBJECT_SELECTION ? onBack() : handleBackToSubjects()}
              className={`p-2 rounded-full ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} transition-colors`}
            >
              <ArrowLeft className={`w-6 h-6 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`} />
            </button>
            <h1 className={`text-2xl font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent`}>
              Révisions intelligentes
            </h1>
          </div>
          {step !== RevisionStep.SUBJECT_SELECTION && (
            <div className="flex items-center gap-4">
              <button
                onClick={step === RevisionStep.STATS ? handleReturnToResults : handleViewStats}
                className={`flex items-center gap-2 px-4 py-2 ${
                  isDarkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'
                } rounded-lg transition-colors`}
              >
                {step === RevisionStep.STATS ? (
                  <BookOpen className="w-5 h-5" />
                ) : (
                  <TrendingUp className="w-5 h-5" />
                )}
                <span>{step === RevisionStep.STATS ? "Voir quiz" : "Statistiques"}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <Header />
      <main className="container mx-auto px-6 py-24">
        {renderStep()}
      </main>
    </div>
  );
}