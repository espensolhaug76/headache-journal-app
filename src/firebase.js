import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, FacebookAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Replace with your actual Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBokKZLR9PC1jgMC-utJ55D6hD5t5182n4",
  authDomain: "headache-journal-app-2074c.firebaseapp.com",
  projectId: "headache-journal-app-2074c",
  storageBucket: "headache-journal-app-2074c.firebasestorage.app",
  messagingSenderId: "721456231769",
  appId: "1:721456231769:web:050024c804ca7f6b04c848"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

// Initialize providers
export const googleProvider = new GoogleAuthProvider();
export const facebookProvider = new FacebookAuthProvider();

export default app;
