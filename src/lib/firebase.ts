import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc, updateDoc, deleteDoc, query, where, orderBy, getDocs } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

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

try {
  validateConfig(firebaseConfig);
  const app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  console.log('Firebase initialized successfully');
} catch (error) {
  console.error('Error initializing Firebase:', error);
  throw error;
}


export { db, auth };

// Helper functions for database operations
export const createHomework = async (data) => {
  const homeworkRef = doc(collection(db, 'homework'));
  await setDoc(homeworkRef, {
    ...data,
    created_at: new Date().toISOString(),
    user_id: auth.currentUser?.uid
  });
  return homeworkRef.id;
};

export const updateHomework = async (id, data) => {
  const homeworkRef = doc(db, 'homework', id);
  await updateDoc(homeworkRef, data);
};

export const deleteHomework = async (id) => {
  const homeworkRef = doc(db, 'homework', id);
  await deleteDoc(homeworkRef);
};

export const getHomeworks = async (filters = {}) => {
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