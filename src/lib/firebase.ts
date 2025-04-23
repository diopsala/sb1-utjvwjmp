import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc, updateDoc, deleteDoc, query, where, orderBy, getDocs } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getFunctions, httpsCallable } from 'firebase/functions';

// Log environment variables availability (without exposing values)
console.log('Environment variables status:', {
  VITE_FIREBASE_API_KEY: !!import.meta.env.VITE_FIREBASE_API_KEY,
  VITE_FIREBASE_AUTH_DOMAIN: !!import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  VITE_FIREBASE_PROJECT_ID: !!import.meta.env.VITE_FIREBASE_PROJECT_ID,
  VITE_FIREBASE_STORAGE_BUCKET: !!import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  VITE_FIREBASE_MESSAGING_SENDER_ID: !!import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  VITE_FIREBASE_APP_ID: !!import.meta.env.VITE_FIREBASE_APP_ID
});

// Ensure all required environment variables are present
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Validate config before initialization
const validateConfig = (config: Record<string, string | undefined>) => {
  const missingVars = Object.entries(config)
    .filter(([_, value]) => !value)
    .map(([key]) => key);

  if (missingVars.length > 0) {
    throw new Error(`Missing Firebase configuration values: ${missingVars.join(', ')}`);
  }
};

let auth;
let db;
let functions;

try {
  validateConfig(firebaseConfig);
  const app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  functions = getFunctions(app);
  console.log('Firebase initialized successfully');
} catch (error) {
  console.error('Error initializing Firebase:', error);
  throw error;
}


export { db, auth, functions };

// Helper functions for Cloud Functions
export const getUserStats = async () => {
  try {
    const getUserStatsFn = httpsCallable(functions, 'getUserStats');
    const result = await getUserStatsFn();
    return result.data;
  } catch (error) {
    console.error('Error calling getUserStats function:', error);
    throw error;
  }
};

export const analyzeImageWithAI = async (imageUrl) => {
  try {
    // Obtenir le token d'authentification
    const token = await auth.currentUser?.getIdToken();
    
    if (!token) {
      throw new Error('Non authentifié');
    }

    // Appel de la fonction Cloud via fetch pour plus de contrôle
    const functionUrl = `https://${import.meta.env.VITE_FIREBASE_REGION}-${import.meta.env.VITE_FIREBASE_PROJECT_ID}.cloudfunctions.net/analyzeImageWithAI`;
    
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ imageUrl }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Erreur lors de l\'analyse');
    }

    return await response.json();
  } catch (error) {
    console.error('Error calling analyzeImageWithAI function:', error);
    throw error;
  }
};

export const generateCorrection = async (homeworkId) => {
  try {
    // Obtenir le token d'authentification
    const token = await auth.currentUser?.getIdToken();
    
    if (!token) {
      throw new Error('Non authentifié');
    }

    // Appel de la fonction Cloud via fetch
    const functionUrl = `https://${import.meta.env.VITE_FIREBASE_REGION}-${import.meta.env.VITE_FIREBASE_PROJECT_ID}.cloudfunctions.net/generateCorrection`;
    
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ homeworkId }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Erreur lors de la génération de la correction');
    }

    return await response.json();
  } catch (error) {
    console.error('Error calling generateCorrection function:', error);
    throw error;
  }
};

// Helper functions for database operations
const createHomework = async (data) => {
  const homeworkRef = doc(collection(db, 'homework'));
  await setDoc(homeworkRef, {
    ...data,
    created_at: new Date().toISOString(),
    user_id: auth.currentUser?.uid
  });
  return homeworkRef.id;
};

const updateHomework = async (id, data) => {
  const homeworkRef = doc(db, 'homework', id);
  await updateDoc(homeworkRef, data);
};

const deleteHomework = async (id) => {
  const homeworkRef = doc(db, 'homework', id);
  await deleteDoc(homeworkRef);
};

const getHomeworks = async (filters = {}) => {
  let baseQuery = query(
    collection(db, 'homework'),
    where('user_id', '==', auth.currentUser?.uid)
  );

  if (filters.subject) {
    baseQuery = query(baseQuery, where('subject', '==', filters.subject));
  }

  if (filters.timeframe !== 'all') {
    const now = new Date();
    let startDate = new Date();
    
    switch (filters.timeframe) {
      case 'today':
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
    }
    
    baseQuery = query(baseQuery, where('created_at', '>=', startDate.toISOString()));
  }

  baseQuery = query(baseQuery, orderBy('created_at', 'desc'));
  const snapshot = await getDocs(baseQuery);
  
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
};