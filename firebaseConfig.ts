// firebaseConfig.ts
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Your web app's Firebase configuration
// Replace with your actual Firebase project configuration
const firebaseConfig = {
  apiKey: "AIzaSyD5Y610IEkEIhbOXlsHBf0KZpvAFK6OL9Q",
  authDomain: "thecleve-33b75.firebaseapp.com",
  projectId: "thecleve-33b75",
  storageBucket: "thecleve-33b75.firebasestorage.app",
  messagingSenderId: "696581253308",
  appId: "1:696581253308:web:df50bbd8f14069896f08b9",
  measurementId: "G-JF4BQXZFCS"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { auth, db, storage };
export default app;