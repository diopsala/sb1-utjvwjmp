import React, { useState, useEffect, useRef } from 'react';
import { ChevronRight, ChevronLeft, CheckCircle, XCircle, Clock, AlignLeft } from 'lucide-react';
import { Subject } from '../../types/subjects';
import { Quiz, QuizSettings, RevisionPerformance, QuizQuestion } from '../../types/revisions';
import { collection, doc, setDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';

interface QuizInterfaceProps {
  quiz: Quiz;
  subject: Subject;
  quizSettings: QuizSettings;
  onComplete: (quiz: Quiz, performance: RevisionPerformance) => void;
  isDarkMode: boolean;
}

export default function QuizInterface({
  quiz,
  subject,
  quizSettings,
  onComplete,
  isDarkMode
}: QuizInterfaceProps) {
  const { currentUser } = useAuth();
  const [currentQuiz, setCurrentQuiz] = useState<Quiz>(quiz);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [showNextButton, setShowNextButton] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [animateQuestion, setAnimateQuestion] = useState<boolean>(false);

  const openAnswerRef = useRef<HTMLTextAreaElement>(null);
  const maxTime = quizSettings.timeLimit || 30; // Default 30 minutes if not specified
  
  // Set up timer
  useEffect(() => {
    if (!currentQuiz.startTime) {
      setCurrentQuiz(prev => ({
        ...prev,
        startTime: new Date().toISOString()
      }));
    }
    
    const startTime = currentQuiz.startTime 
      ? new Date(currentQuiz.startTime).getTime() 
      : Date.now();
    
    const maxTimeMs = maxTime * 60 * 1000; // Convert minutes to milliseconds
    const endTime = startTime + maxTimeMs;
    
    const timerInterval = setInterval(() => {
      const now = Date.now();
      const remaining = Math.max(0, endTime - now);
      
      if (remaining <= 0) {
        clearInterval(timerInterval);
        setTimeRemaining(0);
        handleTimeUp();
      } else {
        setTimeRemaining(Math.floor(remaining / 1000)); // Convert to seconds
      }
    }, 1000);
    
    return () => clearInterval(timerInterval);
  }, []);
  
  const handleTimeUp = () => {
    // Mark all unanswered questions as incorrect
    const updatedQuestions = currentQuiz.questions.map(q => {
      if (q.userResponse === null) {
        return {
          ...q,
          userResponse: '',
          isCorrect: false,
          feedback: "Temps écoulé - Pas de réponse"
        };
      }
      return q;
    });
    
    const updatedQuiz = {
      ...currentQuiz,
      questions: updatedQuestions,
      completed: true
    };
    
    finishQuiz(updatedQuiz);
  };
  
  const getCurrentQuestion = () => {
    return currentQuiz.questions[currentQuiz.currentQuestion];
  };
  
  const handleOptionSelect = (option: string, index: number) => {
    const currentQuestion = getCurrentQuestion();
    
    if (currentQuestion.userResponse !== null) return; // Already answered
    
    let isCorrect = false;
    let feedbackText = '';
    
    if (currentQuestion.type === 'mcq') {
      const correctAnswer = currentQuestion.answer;
      isCorrect = correctAnswer === option;
      
      feedbackText = isCorrect 
        ? 'Bonne réponse !' 
        : `Mauvaise réponse. La réponse correcte est : ${currentQuestion.answer}`;
    } else if (currentQuestion.type === 'true_false') {
      const correctAnswer = currentQuestion.answer.toLowerCase();
      const selectedAnswer = option.toLowerCase();
      isCorrect = correctAnswer === selectedAnswer;
      
      feedbackText = isCorrect 
        ? 'Bonne réponse !' 
        : `Mauvaise réponse. La réponse correcte est : ${currentQuestion.answer}`;
    }
    
    // Update question with user response
    const updatedQuestions = [...currentQuiz.questions];
    updatedQuestions[currentQuiz.currentQuestion] = {
      ...updatedQuestions[currentQuiz.currentQuestion],
      userResponse: option,
      isCorrect,
      feedback: feedbackText
    };
    
    setCurrentQuiz(prev => ({
      ...prev,
      questions: updatedQuestions
    }));
    
    setFeedback(feedbackText);
    setShowNextButton(true);
  };
  
  const handleOpenAnswerSubmit = async () => {
    if (!openAnswerRef.current) return;
    
    const answer = openAnswerRef.current.value.trim();
    if (!answer) {
      setError("Veuillez entrer une réponse");
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const currentQuestion = getCurrentQuestion();
      
      // For open questions, we need to check with GPT-4o
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            {
              role: 'system',
              content: `Tu es un professeur qui évalue la réponse d'un élève à une question. 
              Évalue si la réponse est correcte en la comparant à la réponse modèle. 
              Réponds uniquement au format JSON avec les propriétés suivantes :
              {
                "isCorrect": boolean, // true si la réponse est correcte ou partiellement correcte, false sinon
                "score": number, // score sur 100
                "feedback": string // commentaire sur la réponse, points forts et points à améliorer
              }`
            },
            {
              role: 'user',
              content: `Question: ${currentQuestion.text}
              
              Réponse modèle: ${currentQuestion.answer}
              
              Réponse de l'élève: ${answer}
              
              Évalue cette réponse.`
            }
          ],
          temperature: 0.3,
          max_tokens: 500,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Erreur lors de l\'évaluation de la réponse');
      }
      
      const data = await response.json();
      const evaluationContent = data.choices[0]?.message?.content;
      
      if (!evaluationContent) {
        throw new Error('Réponse vide de l\'API');
      }
      
      // Parse the JSON response
      const evaluation = JSON.parse(evaluationContent);
      
      // Update question with evaluation results
      const updatedQuestions = [...currentQuiz.questions];
      updatedQuestions[currentQuiz.currentQuestion] = {
        ...updatedQuestions[currentQuiz.currentQuestion],
        userResponse: answer,
        isCorrect: evaluation.isCorrect,
        score: evaluation.score,
        feedback: evaluation.feedback
      };
      
      setCurrentQuiz(prev => ({
        ...prev,
        questions: updatedQuestions
      }));
      
      setFeedback(evaluation.feedback);
      setShowNextButton(true);
    } catch (error) {
      console.error('Error evaluating open answer:', error);
      setError('Erreur lors de l\'évaluation de votre réponse');
    } finally {
      setLoading(false);
    }
  };
  
  const goToNextQuestion = () => {
    setAnimateQuestion(true);
    
    // Reset state for next question
    setFeedback(null);
    setShowNextButton(false);
    
    // Check if this was the last question
    if (currentQuiz.currentQuestion >= currentQuiz.questions.length - 1) {
      finishQuiz(currentQuiz);
      return;
    }
    
    // Go to next question
    setTimeout(() => {
      setCurrentQuiz(prev => ({
        ...prev,
        currentQuestion: prev.currentQuestion + 1
      }));
      setAnimateQuestion(false);
    }, 300);
  };
  
  const goToPreviousQuestion = () => {
    if (currentQuiz.currentQuestion > 0) {
      setAnimateQuestion(true);
      
      setTimeout(() => {
        setCurrentQuiz(prev => ({
          ...prev,
          currentQuestion: prev.currentQuestion - 1
        }));
        
        // Reset feedback and next button based on whether the question has been answered
        const prevQuestion = currentQuiz.questions[currentQuiz.currentQuestion - 1];
        setFeedback(prevQuestion.feedback);
        setShowNextButton(prevQuestion.userResponse !== null);
        
        setAnimateQuestion(false);
      }, 300);
    }
  };

  // Calculate the final score and save performance data
  const finishQuiz = async (quiz: Quiz) => {
    // Only process if not already completed
    if (quiz.completed) return;
    
    try {
      setLoading(true);
      
      const answeredQuestions = quiz.questions.filter(q => q.userResponse !== null);
      const correctQuestions = quiz.questions.filter(q => q.isCorrect === true);
      
      // Calculate score
      let totalScore: number;
      
      if (answeredQuestions.length === 0) {
        totalScore = 0;
      } else {
        // For questions with a specific score (like open questions), use that score
        // Otherwise, calculate as correct/total * 100
        const questionScores = quiz.questions.map(q => {
          if (q.score !== undefined) return q.score;
          return q.isCorrect ? 100 : 0;
        });
        
        totalScore = Math.round(
          questionScores.reduce((sum, score) => sum + score, 0) / quiz.questions.length
        );
      }
      
      const updatedQuiz = {
        ...quiz,
        completed: true,
        score: totalScore,
        endTime: new Date().toISOString()
      };
      
      // If user is logged in, save performance to Firestore
      if (currentUser) {
        const performanceData: RevisionPerformance = {
          subject: subject.id,
          difficulty: quiz.difficulty,
          level: subject.level || 'default',
          score: totalScore,
          passed: totalScore >= (quizSettings.passThreshold || 70),
          totalQuestions: quiz.questions.length,
          correctAnswers: correctQuestions.length,
          created_at: quiz.startTime || new Date().toISOString(),
          finished_at: updatedQuiz.endTime,
          userId: currentUser.uid
        };
        
        // Generate a unique ID for the performance record
        const performanceRef = doc(collection(db, 'revision_performances', currentUser.uid, 'records'));
        await setDoc(performanceRef, performanceData);
        
        // If passed and gamification is enabled, update unlocked levels
        if (
          performanceData.passed && 
          quizSettings.enableGamification && 
          performanceData.difficulty < (quizSettings.maxDifficulty || 5)
        ) {
          const userStatsRef = doc(db, 'user_stats', currentUser.uid);
          
          // Update the unlocked level for this subject if higher than current
          await setDoc(userStatsRef, {
            unlockedLevels: {
              [subject.id]: performanceData.difficulty + 1
            }
          }, { merge: true });
        }
        
        // Call the completion callback with the updated quiz
        setCurrentQuiz(updatedQuiz);
        onComplete(updatedQuiz, performanceData);
      } else {
        // Even if not logged in, we can still show results
        setCurrentQuiz(updatedQuiz);
        onComplete(updatedQuiz, {
          subject: subject.id,
          difficulty: quiz.difficulty,
          level: subject.level || 'default',
          score: totalScore,
          passed: totalScore >= (quizSettings.passThreshold || 70),
          totalQuestions: quiz.questions.length,
          correctAnswers: correctQuestions.length,
          created_at: quiz.startTime || new Date().toISOString(),
          finished_at: updatedQuiz.endTime
        });
      }
    } catch (error) {
      console.error('Error finishing quiz:', error);
      setError('Erreur lors de la finalisation du quiz');
    } finally {
      setLoading(false);
    }
  };
  
  // Format remaining time
  const formatTimeRemaining = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
  };
  
  // Calculate progress percentage
  const calculateProgress = () => {
    return ((currentQuiz.currentQuestion + 1) / currentQuiz.questions.length) * 100;
  };
  
  if (!currentQuiz || currentQuiz.questions.length === 0) {
    return (
      <div className={`p-6 rounded-xl ${isDarkMode ? 'bg-red-900/20' : 'bg-red-50'} text-red-600 dark:text-red-400`}>
        Erreur: Quiz non disponible
      </div>
    );
  }
  
  const currentQuestion = getCurrentQuestion();

  return (
    <div className="max-w-3xl mx-auto">
      {/* Quiz header */}
      <div className={`mb-6 p-4 rounded-xl ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              {quiz.title || `Quiz de ${subject.label}`}
            </h2>
            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Niveau {quiz.difficulty} · {quiz.questions.length} questions
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-500" />
            <span className={`font-medium ${
              (timeRemaining || 0) < 60 ? 'text-red-500' : isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              {timeRemaining !== null ? formatTimeRemaining(timeRemaining) : '--:--'}
            </span>
          </div>
        </div>
        
        {/* Progress bar */}
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
          <div 
            className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" 
            style={{ width: `${calculateProgress()}%` }}
          ></div>
        </div>
        <div className="flex justify-between mt-2 text-xs text-gray-500 dark:text-gray-400">
          <span>Question {currentQuiz.currentQuestion + 1}/{currentQuiz.questions.length}</span>
          <span>
            {currentQuiz.questions.filter(q => q.userResponse !== null).length} répondu(es)
          </span>
        </div>
      </div>
      
      {/* Question card */}
      <div className={`mb-6 p-6 rounded-xl ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm overflow-hidden`}>
        <div 
          className={`transition-opacity duration-300 ${animateQuestion ? 'opacity-0' : 'opacity-100'}`}
        >
          {/* Question type indicator */}
          <div className="mb-4 flex items-center gap-2">
            <div className={`py-1 px-2 rounded-md text-xs font-medium ${
              currentQuestion.type === 'mcq' 
                ? isDarkMode ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-100 text-blue-700'
                : currentQuestion.type === 'true_false'
                  ? isDarkMode ? 'bg-green-900/30 text-green-400' : 'bg-green-100 text-green-700'
                  : isDarkMode ? 'bg-purple-900/30 text-purple-400' : 'bg-purple-100 text-purple-700'
            }`}>
              {currentQuestion.type === 'mcq' 
                ? 'QCM' 
                : currentQuestion.type === 'true_false' 
                  ? 'Vrai/Faux' 
                  : 'Question ouverte'}
            </div>
            {currentQuestion.userResponse !== null && (
              <div className={`py-1 px-2 rounded-md text-xs font-medium flex items-center gap-1 ${
                currentQuestion.isCorrect 
                  ? isDarkMode ? 'bg-green-900/30 text-green-400' : 'bg-green-100 text-green-700'
                  : isDarkMode ? 'bg-red-900/30 text-red-400' : 'bg-red-100 text-red-700'
              }`}>
                {currentQuestion.isCorrect 
                  ? <><CheckCircle className="w-3 h-3" /> Correct</>
                  : <><XCircle className="w-3 h-3" /> Incorrect</>
                }
              </div>
            )}
          </div>
          
          {/* Question text */}
          <h3 className={`text-lg font-medium mb-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            {currentQuestion.text}
          </h3>
          
          {/* Question content based on type */}
          <div>
            {/* Multiple choice question */}
            {currentQuestion.type === 'mcq' && currentQuestion.choices && (
              <div className="space-y-3">
                {currentQuestion.choices.map((choice, index) => {
                  const option = String.fromCharCode(65 + index); // A, B, C, D...
                  const isSelected = currentQuestion.userResponse === option;
                  const isCorrect = currentQuestion.answer === option;
                  const showCorrectWrong = currentQuestion.userResponse !== null;
                  
                  return (
                    <button
                      key={index}
                      onClick={() => handleOptionSelect(option, index)}
                      disabled={currentQuestion.userResponse !== null}
                      className={`w-full p-4 rounded-lg flex items-center text-left transition-colors ${
                        isSelected
                          ? showCorrectWrong
                            ? isCorrect
                              ? isDarkMode ? 'bg-green-900/30 border border-green-700' : 'bg-green-100 border border-green-300'
                              : isDarkMode ? 'bg-red-900/30 border border-red-700' : 'bg-red-100 border border-red-300'
                            : isDarkMode ? 'bg-blue-900/30 border border-blue-700' : 'bg-blue-100 border border-blue-300'
                          : showCorrectWrong && isCorrect
                            ? isDarkMode ? 'bg-green-900/20 border border-green-800' : 'bg-green-50 border border-green-200'
                            : isDarkMode
                              ? 'bg-gray-700 border border-gray-600 hover:bg-gray-600'
                              : 'bg-gray-50 border border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 flex-shrink-0 ${
                        isSelected
                          ? showCorrectWrong
                            ? isCorrect
                              ? isDarkMode ? 'bg-green-700 text-white' : 'bg-green-500 text-white'
                              : isDarkMode ? 'bg-red-700 text-white' : 'bg-red-500 text-white'
                            : isDarkMode ? 'bg-blue-700 text-white' : 'bg-blue-500 text-white'
                          : showCorrectWrong && isCorrect
                            ? isDarkMode ? 'bg-green-700 text-white' : 'bg-green-500 text-white'
                            : isDarkMode
                              ? 'bg-gray-600 text-white'
                              : 'bg-gray-200 text-gray-700'
                      }`}>
                        {option}
                      </div>
                      <span className={`${
                        isSelected
                          ? showCorrectWrong
                            ? isCorrect
                              ? isDarkMode ? 'text-green-400' : 'text-green-700'
                              : isDarkMode ? 'text-red-400' : 'text-red-700'
                            : isDarkMode ? 'text-blue-400' : 'text-blue-700'
                          : showCorrectWrong && isCorrect
                            ? isDarkMode ? 'text-green-400' : 'text-green-700'
                            : isDarkMode ? 'text-white' : 'text-gray-800'
                      }`}>
                        {choice}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
            
            {/* True/False question */}
            {currentQuestion.type === 'true_false' && (
              <div className="grid grid-cols-2 gap-4">
                {['true', 'false'].map((option) => {
                  const isSelected = currentQuestion.userResponse?.toLowerCase() === option;
                  const isCorrect = currentQuestion.answer?.toLowerCase() === option;
                  const showCorrectWrong = currentQuestion.userResponse !== null;
                  
                  return (
                    <button
                      key={option}
                      onClick={() => handleOptionSelect(option, option === 'true' ? 0 : 1)}
                      disabled={currentQuestion.userResponse !== null}
                      className={`p-4 rounded-lg flex flex-col items-center justify-center transition-colors ${
                        isSelected
                          ? showCorrectWrong
                            ? isCorrect
                              ? isDarkMode ? 'bg-green-900/30 border border-green-700' : 'bg-green-100 border border-green-300'
                              : isDarkMode ? 'bg-red-900/30 border border-red-700' : 'bg-red-100 border border-red-300'
                            : isDarkMode ? 'bg-blue-900/30 border border-blue-700' : 'bg-blue-100 border border-blue-300'
                          : showCorrectWrong && isCorrect
                            ? isDarkMode ? 'bg-green-900/20 border border-green-800' : 'bg-green-50 border border-green-200'
                            : isDarkMode
                              ? 'bg-gray-700 border border-gray-600 hover:bg-gray-600'
                              : 'bg-gray-50 border border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      <span className={`text-lg font-medium ${
                        isSelected
                          ? showCorrectWrong
                            ? isCorrect
                              ? isDarkMode ? 'text-green-400' : 'text-green-700'
                              : isDarkMode ? 'text-red-400' : 'text-red-700'
                            : isDarkMode ? 'text-blue-400' : 'text-blue-700'
                          : showCorrectWrong && isCorrect
                            ? isDarkMode ? 'text-green-400' : 'text-green-700'
                            : isDarkMode ? 'text-white' : 'text-gray-800'
                      }`}>
                        {option === 'true' ? 'VRAI' : 'FAUX'}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
            
            {/* Open-ended question */}
            {currentQuestion.type === 'open' && (
              <div>
                <div className="mb-2 flex items-center gap-2">
                  <AlignLeft className={`w-4 h-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                  <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    Rédigez votre réponse ci-dessous
                  </span>
                </div>
                <textarea
                  ref={openAnswerRef}
                  rows={6}
                  className={`w-full p-3 rounded-lg ${
                    isDarkMode 
                      ? 'bg-gray-700 border border-gray-600 text-white' 
                      : 'bg-white border border-gray-300 text-gray-900'
                  } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  placeholder="Votre réponse..."
                  defaultValue={currentQuestion.userResponse || ''}
                  disabled={currentQuestion.userResponse !== null || loading}
                ></textarea>
                
                {currentQuestion.userResponse === null && (
                  <button
                    onClick={handleOpenAnswerSubmit}
                    disabled={loading}
                    className={`mt-3 px-4 py-2 ${
                      isDarkMode
                        ? 'bg-blue-700 hover:bg-blue-600 text-white'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    } rounded-lg transition-colors flex items-center`}
                  >
                    {loading ? 'Évaluation en cours...' : 'Soumettre ma réponse'}
                    {loading && (
                      <svg className="animate-spin ml-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    )}
                  </button>
                )}
                
                {error && (
                  <div className={`mt-2 p-2 rounded ${isDarkMode ? 'bg-red-900/20 text-red-400' : 'bg-red-100 text-red-600'}`}>
                    {error}
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* Feedback for answered questions */}
          {feedback && (
            <div className={`mt-6 p-4 rounded-lg ${
              currentQuestion.isCorrect
                ? isDarkMode ? 'bg-green-900/20 text-green-400' : 'bg-green-50 text-green-700'
                : isDarkMode ? 'bg-red-900/20 text-red-400' : 'bg-red-50 text-red-700'
            }`}>
              <p className="text-sm">{feedback}</p>
              
              {/* For open questions, show the model answer */}
              {currentQuestion.type === 'open' && (
                <div className={`mt-3 pt-3 border-t ${
                  isDarkMode ? 'border-green-800' : 'border-green-200'
                }`}>
                  <h4 className="text-xs font-medium mb-1">Réponse modèle :</h4>
                  <p className="text-sm">{currentQuestion.answer}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Navigation buttons */}
      <div className="flex justify-between">
        <button 
          onClick={goToPreviousQuestion}
          disabled={currentQuiz.currentQuestion === 0}
          className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
            currentQuiz.currentQuestion === 0
              ? isDarkMode ? 'bg-gray-800 text-gray-600 cursor-not-allowed' : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : isDarkMode ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          } transition-colors`}
        >
          <ChevronLeft className="w-5 h-5" />
          Précédent
        </button>
        
        {showNextButton ? (
          <button 
            onClick={goToNextQuestion}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
              isDarkMode
                ? 'bg-blue-700 hover:bg-blue-600 text-white'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            } transition-colors`}
          >
            {currentQuiz.currentQuestion >= currentQuiz.questions.length - 1
              ? 'Terminer le quiz'
              : 'Question suivante'}
            <ChevronRight className="w-5 h-5" />
          </button>
        ) : (
          <div></div> // Empty div to maintain flex spacing
        )}
      </div>
    </div>
  );
}