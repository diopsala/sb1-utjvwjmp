export interface QuizSettings {
  questionsPerQuiz: number;
  passThreshold: number;
  revisionFileLimit: number;
  enableGamification: boolean;
  defaultDifficulty: number;
  maxDifficulty: number;
  timeLimit?: number;
}

export interface QuizQuestion {
  id: number | string;
  text: string;
  type: 'mcq' | 'true_false' | 'open';
  choices?: string[];
  answer: string;
  userResponse: string | null;
  isCorrect: boolean | null;
  feedback: string | null;
  score?: number; // For open-ended questions
}

export interface Quiz {
  title: string;
  subject: string;
  difficulty: number;
  questions: QuizQuestion[];
  totalQuestions: number;
  currentQuestion: number;
  score: number | null;
  completed: boolean;
  startTime: string;
  endTime?: string;
  basedOnResources?: boolean; // Indicates if the quiz was generated from Cloudinary resources
}

export interface RevisionPerformance {
  id?: string;
  subject: string;
  difficulty: number;
  level: string;
  score: number;
  passed: boolean;
  totalQuestions: number;
  correctAnswers: number;
  created_at: string;
  finished_at: string;
  userId?: string; // Added userId field
}

export interface UserStats {
  totalQuizzes?: number;
  totalCorrect?: number;
  averageScores?: {
    [subjectId: string]: number;
  };
  lastPerformances?: {
    [subjectId: string]: {
      lastScore: number;
      lastAttemptAt: string;
    }
  };
  unlockedLevels?: {
    [subjectId: string]: number;
  };
  badges?: {
    [badgeId: string]: {
      earned: boolean;
      date?: string;
    };
  };
  gamificationDisabled?: boolean;
}