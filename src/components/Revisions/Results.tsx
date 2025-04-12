import React, { useEffect, useState } from 'react';
import { ChevronRight, CheckCircle, XCircle, Sparkles, RotateCcw, TrendingUp, Award, Download } from 'lucide-react';
import { Subject } from '../../types/subjects';
import { Quiz } from '../../types/revisions';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

interface ResultsProps {
  quiz: Quiz;
  subject: Subject;
  onBackToSubjects: () => void;
  onViewStats: () => void;
  isDarkMode: boolean;
}

export default function Results({
  quiz,
  subject,
  onBackToSubjects,
  onViewStats,
  isDarkMode
}: ResultsProps) {
  const { currentUser } = useAuth();
  const [notification, setNotification] = useState<string | null>(null);
  
  // Calculate score and stats
  const totalQuestions = quiz.questions.length;
  const answeredQuestions = quiz.questions.filter(q => q.userResponse !== null).length;
  const correctQuestions = quiz.questions.filter(q => q.isCorrect === true).length;
  const incorrectQuestions = quiz.questions.filter(q => q.isCorrect === false).length;
  const score = quiz.score !== null ? quiz.score : Math.round((correctQuestions / totalQuestions) * 100);
  const isPassed = score >= 70; // Pass threshold
  
  // Calculate time spent
  const startTime = quiz.startTime ? new Date(quiz.startTime) : new Date();
  const endTime = quiz.endTime ? new Date(quiz.endTime) : new Date();
  const timeSpentMs = endTime.getTime() - startTime.getTime();
  const timeSpentMinutes = Math.floor(timeSpentMs / 60000);
  const timeSpentSeconds = Math.floor((timeSpentMs % 60000) / 1000);
  
  // Group questions by type
  const questionsByType = quiz.questions.reduce((acc, question) => {
    const type = question.type;
    if (!acc[type]) {
      acc[type] = { total: 0, correct: 0 };
    }
    acc[type].total++;
    if (question.isCorrect) {
      acc[type].correct++;
    }
    return acc;
  }, {} as Record<string, { total: number; correct: number }>);
  
  // Get performance message based on score
  const getPerformanceMessage = () => {
    if (score >= 90) return "Excellent ! Vous maîtrisez parfaitement ce sujet.";
    if (score >= 80) return "Très bien ! Une bonne maîtrise du sujet.";
    if (score >= 70) return "Bien ! Vous avez les bases solides.";
    if (score >= 60) return "Pas mal. Quelques points à revoir.";
    if (score >= 50) return "Moyen. Des révisions supplémentaires sont nécessaires.";
    return "Des difficultés sur ce sujet. Il faut retravailler les bases.";
  };

  // Define colors based on score
  const getScoreColor = () => {
    if (score >= 80) return isDarkMode ? 'text-green-400' : 'text-green-600';
    if (score >= 60) return isDarkMode ? 'text-yellow-400' : 'text-yellow-600';
    return isDarkMode ? 'text-red-400' : 'text-red-600';
  };

  const getScoreBgColor = () => {
    if (score >= 80) return isDarkMode ? 'bg-green-900/20' : 'bg-green-50';
    if (score >= 60) return isDarkMode ? 'bg-yellow-900/20' : 'bg-yellow-50';
    return isDarkMode ? 'bg-red-900/20' : 'bg-red-50';
  };
  
  // Handle retake quiz
  const handleRetakeQuiz = () => {
    onBackToSubjects();
  };

  const generatePDF = async () => {
    try {
      const element = document.getElementById('quiz-results');
      if (!element) return;

      setNotification('Génération du PDF en cours...');
      
      const canvas = await html2canvas(element, { 
        scale: 2,
        backgroundColor: isDarkMode ? '#111827' : '#ffffff'
      });
      const imgData = canvas.toDataURL('image/png');
      
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight) * 0.9;
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = 30;

      pdf.setFontSize(18);
      pdf.text(`Résultats du quiz - ${subject.label}`, pdfWidth / 2, 15, { align: 'center' });
      
      pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
      
      pdf.save(`quiz-${subject.label.toLowerCase()}-${new Date().toISOString().split('T')[0]}.pdf`);
      
      setNotification('PDF généré avec succès !');
      setTimeout(() => setNotification(null), 3000);
    } catch (error) {
      console.error('Error generating PDF:', error);
      setNotification('Erreur lors de la génération du PDF');
      setTimeout(() => setNotification(null), 3000);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      {/* Results header */}
      <div id="quiz-results" className={`mb-6 p-6 rounded-xl ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
        <div className="text-center mb-6">
          <h2 className={`text-2xl font-bold mb-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Résultats du quiz
          </h2>
          <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            {quiz.title || `Quiz de ${subject.label}`} · Niveau {quiz.difficulty}
          </p>
        </div>
        
        <div className="flex flex-col md:flex-row justify-center gap-8 mb-8">
          {/* Score indicator */}
          <div className="flex flex-col items-center">
            <div className={`relative w-32 h-32 rounded-full flex items-center justify-center ${getScoreBgColor()}`}>
              <svg className="w-full h-full" viewBox="0 0 100 100">
                <circle 
                  cx="50" 
                  cy="50" 
                  r="45" 
                  fill="none" 
                  stroke={isDarkMode ? '#374151' : '#E5E7EB'} 
                  strokeWidth="10" 
                />
                <circle 
                  cx="50" 
                  cy="50" 
                  r="45" 
                  fill="none" 
                  stroke={score >= 80 ? '#10B981' : score >= 60 ? '#F59E0B' : '#EF4444'} 
                  strokeWidth="10" 
                  strokeDasharray="283" 
                  strokeDashoffset={283 - (283 * score / 100)}
                  transform="rotate(-90 50 50)" 
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className={`text-3xl font-bold ${getScoreColor()}`}>
                  {score}%
                </span>
              </div>
            </div>
            <div className="mt-3 text-center">
              <p className={`font-medium ${isPassed ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {isPassed ? (
                  <span className="flex items-center gap-1 justify-center">
                    <Award className="w-5 h-5" /> Quiz réussi !
                  </span>
                ) : (
                  'Quiz non validé'
                )}
              </p>
            </div>
          </div>
          
          {/* Stats */}
          <div className="flex flex-col justify-center">
            <div className="space-y-3">
              <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                <span className="font-medium">Temps :</span> {timeSpentMinutes}m {timeSpentSeconds}s
              </div>
              <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                <span className="font-medium">Questions :</span> {totalQuestions} au total
              </div>
              <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                <span className="font-medium">Bonnes réponses :</span> {correctQuestions} ({Math.round((correctQuestions / totalQuestions) * 100)}%)
              </div>
              <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                <span className="font-medium">Mauvaises réponses :</span> {incorrectQuestions} ({Math.round((incorrectQuestions / totalQuestions) * 100)}%)
              </div>
            </div>
            
            <div className={`mt-4 p-3 rounded-lg ${
              isPassed 
                ? isDarkMode ? 'bg-green-900/20 text-green-400' : 'bg-green-50 text-green-700' 
                : isDarkMode ? 'bg-yellow-900/20 text-yellow-400' : 'bg-yellow-50 text-yellow-700'
            }`}>
              <p className="text-sm">{getPerformanceMessage()}</p>
            </div>
          </div>
        </div>
        
        {/* Questions breakdown by type */}
        {Object.keys(questionsByType).length > 0 && (
          <div className="mb-6">
            <h3 className={`text-lg font-medium mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Performance par type de question
            </h3>
            <div className="space-y-3">
              {Object.entries(questionsByType).map(([type, stats]) => (
                <div key={type} className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'} flex justify-between`}>
                  <span className={`${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                    {type === 'mcq' 
                      ? 'QCM' 
                      : type === 'true_false' 
                        ? 'Vrai/Faux' 
                        : 'Questions ouvertes'}
                  </span>
                  <div className="flex items-center gap-1">
                    <span className={`font-medium ${
                      stats.correct === stats.total
                        ? isDarkMode ? 'text-green-400' : 'text-green-600'
                        : stats.correct > stats.total / 2
                          ? isDarkMode ? 'text-yellow-400' : 'text-yellow-600'
                          : isDarkMode ? 'text-red-400' : 'text-red-600'
                    }`}>
                      {stats.correct}/{stats.total}
                    </span>
                    <span className={`ml-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      ({Math.round((stats.correct / stats.total) * 100)}%)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Questions details */}
        <div>
          <h3 className={`text-lg font-medium mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Questions et réponses
          </h3>
          <div className="space-y-4">
            {quiz.questions.map((question, index) => (
              <div 
                key={index} 
                className={`p-4 rounded-lg ${
                  question.isCorrect === true
                    ? isDarkMode ? 'bg-green-900/10 border border-green-900/20' : 'bg-green-50 border border-green-100'
                    : question.isCorrect === false
                      ? isDarkMode ? 'bg-red-900/10 border border-red-900/20' : 'bg-red-50 border border-red-100'
                      : isDarkMode ? 'bg-gray-700/50 border border-gray-700' : 'bg-gray-50 border border-gray-200'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                    question.isCorrect === true
                      ? isDarkMode ? 'bg-green-900/30 text-green-400' : 'bg-green-100 text-green-700'
                      : question.isCorrect === false
                        ? isDarkMode ? 'bg-red-900/30 text-red-400' : 'bg-red-100 text-red-700'
                        : isDarkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-200 text-gray-700'
                  }`}>
                    {question.isCorrect === true
                      ? <CheckCircle className="w-4 h-4" />
                      : question.isCorrect === false
                        ? <XCircle className="w-4 h-4" />
                        : index + 1
                    }
                  </div>
                  <div className="flex-1">
                    <p className={`mb-2 font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {question.text}
                    </p>
                    
                    {question.type === 'mcq' && question.choices && (
                      <div className="mb-2">
                        <p className={`text-sm mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Options :</p>
                        <ul className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          {question.choices.map((choice, choiceIndex) => {
                            const optionLetter = String.fromCharCode(65 + choiceIndex);
                            const isCorrectAnswer = question.answer === optionLetter;
                            const isUserSelected = question.userResponse === optionLetter;
                            
                            return (
                              <li key={choiceIndex} className="flex items-center gap-2">
                                <span className={`${
                                  isCorrectAnswer
                                    ? isDarkMode ? 'text-green-400' : 'text-green-600'
                                    : isUserSelected
                                      ? isDarkMode ? 'text-red-400' : 'text-red-600'
                                      : ''
                                }`}>
                                  {optionLetter}. {choice} {isCorrectAnswer && '✓'}
                                </span>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    )}
                    
                    {question.type === 'true_false' && (
                      <div className="mb-2 flex gap-4 text-sm">
                        <div className={`${
                          question.answer?.toLowerCase() === 'true' ? (isDarkMode ? 'text-green-400' : 'text-green-600') : ''
                        } ${
                          question.userResponse?.toLowerCase() === 'true' && question.answer?.toLowerCase() !== 'true' 
                            ? (isDarkMode ? 'text-red-400' : 'text-red-600') 
                            : ''
                        }`}>
                          VRAI {question.answer?.toLowerCase() === 'true' && '✓'}
                        </div>
                        <div className={`${
                          question.answer?.toLowerCase() === 'false' ? (isDarkMode ? 'text-green-400' : 'text-green-600') : ''
                        } ${
                          question.userResponse?.toLowerCase() === 'false' && question.answer?.toLowerCase() !== 'false' 
                            ? (isDarkMode ? 'text-red-400' : 'text-red-600')
                            : ''
                        }`}>
                          FAUX {question.answer?.toLowerCase() === 'false' && '✓'}
                        </div>
                      </div>
                    )}
                    
                    {question.userResponse !== null && (
                      <div className={`mt-2 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        <div>
                          <span className="font-medium">Votre réponse : </span>
                          <span className={
                            question.isCorrect === true
                              ? isDarkMode ? 'text-green-400' : 'text-green-600'
                              : isDarkMode ? 'text-red-400' : 'text-red-600'
                          }>
                            {question.type === 'mcq' 
                              ? `${question.userResponse}. ${question.choices?.[question.userResponse.charCodeAt(0) - 65] || ''}`
                              : question.type === 'true_false' 
                                ? question.userResponse.toUpperCase()
                                : question.userResponse
                            }
                          </span>
                        </div>
                        
                        {question.type === 'open' && (
                          <div className="mt-2">
                            <span className="font-medium">Réponse attendue : </span>
                            <span>{question.answer}</span>
                          </div>
                        )}
                        
                        {question.feedback && (
                          <div className={`mt-2 p-3 rounded-lg ${
                            question.isCorrect === true
                              ? isDarkMode ? 'bg-green-900/20' : 'bg-green-50'
                              : isDarkMode ? 'bg-red-900/20' : 'bg-red-50'
                          }`}>
                            {question.feedback}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Action buttons */}
      <div className="flex flex-wrap gap-4 justify-center">
        <button
          onClick={onBackToSubjects}
          className={`px-6 py-3 rounded-lg flex items-center gap-2 ${
            isDarkMode 
              ? 'bg-gray-700 hover:bg-gray-600 text-white' 
              : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
          } transition-colors`}
        >
          <ChevronRight className="w-5 h-5" />
          Retour à la sélection de matière
        </button>
        
        <button
          onClick={handleRetakeQuiz}
          className={`px-6 py-3 rounded-lg flex items-center gap-2 ${
            isDarkMode 
              ? 'bg-blue-700 hover:bg-blue-600 text-white' 
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          } transition-colors`}
        >
          <RotateCcw className="w-5 h-5" />
          Refaire un quiz
        </button>
        
        <button
          onClick={onViewStats}
          className={`px-6 py-3 rounded-lg flex items-center gap-2 ${
            isDarkMode 
              ? 'bg-purple-700 hover:bg-purple-600 text-white' 
              : 'bg-purple-600 hover:bg-purple-700 text-white'
          } transition-colors`}
        >
          <TrendingUp className="w-5 h-5" />
          Voir mes statistiques
        </button>
        
        <button
          onClick={generatePDF}
          className={`px-6 py-3 rounded-lg flex items-center gap-2 ${
            isDarkMode 
              ? 'bg-gray-700 hover:bg-gray-600 text-white' 
              : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
          } transition-colors`}
        >
          <Download className="w-5 h-5" />
          Télécharger en PDF
        </button>
      </div>
      
      {/* Notification */}
      {notification && (
        <div className={`fixed bottom-4 right-4 px-4 py-2 rounded-lg bg-blue-600 text-white shadow-lg`}>
          {notification}
        </div>
      )}
    </div>
  );
}