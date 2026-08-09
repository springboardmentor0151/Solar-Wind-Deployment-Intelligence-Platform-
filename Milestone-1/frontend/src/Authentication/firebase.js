import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDfzAiIVzpuHn_BMgI8pMjGiS9UdM_tMy8",
  authDomain: "solar-wind-platform.firebaseapp.com",
  projectId: "solar-wind-platform",
  storageBucket: "solar-wind-platform.firebasestorage.app",
  messagingSenderId: "897837660131",
  appId: "1:897837660131:web:fd8ca1a741a327376212d6",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Firebase Authentication
export const auth = getAuth(app);

// Firestore Database
export const db = getFirestore(app);

// Google Sign-In Provider
export const googleProvider = new GoogleAuthProvider();

// Export Firebase App
export default app;