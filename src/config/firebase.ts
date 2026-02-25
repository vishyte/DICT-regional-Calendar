import { initializeApp, FirebaseApp } from "firebase/app";
import { getAnalytics, Analytics } from "firebase/analytics";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";
import { getStorage, FirebaseStorage } from "firebase/storage";

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyAnx3VNq_5fQ1_eI5N8l5cDY0_18xUUNs0",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "r11regionalcalender.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "r11regionalcalender",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "r11regionalcalender.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "1004991773893",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:1004991773893:web:ea07e62c753a6c54a004ac",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-FCNE5VND2R",
};

console.log('Firebase Config:', { 
  projectId: firebaseConfig.projectId,
  apiKeyPresent: !!firebaseConfig.apiKey,
  env: import.meta.env.MODE 
});

// Initialize Firebase
let app: FirebaseApp;
try {
  app = initializeApp(firebaseConfig);
  console.log('Firebase initialized successfully');
} catch (error) {
  console.error('Firebase initialization failed:', error);
  // Create a dummy app to prevent crashes
  app = initializeApp({ projectId: 'dummy' });
}

// Initialize Firebase services
export let auth: Auth;
export let firestore: Firestore;
export let storage: FirebaseStorage;
export let analytics: Analytics | null = null;

try {
  auth = getAuth(app);
  firestore = getFirestore(app);
  storage = getStorage(app);
} catch (error) {
  console.error('Firebase services initialization failed:', error);
}

// Initialize analytics only in production and if supported
if (import.meta.env.PROD && typeof window !== 'undefined') {
  try {
    analytics = getAnalytics(app);
    console.log('Firebase Analytics initialized');
  } catch (e) {
    console.warn('Analytics initialization failed:', e);
  }
}

export default app;
