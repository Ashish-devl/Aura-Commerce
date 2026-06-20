import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  projectId: "supple-proposal-1n56p",
  appId: "1:33691104661:web:dfa6a99f1f0f2598d6f29c",
  apiKey: "AIzaSyBMRvCWVKehog-CnQ1n6rsHTV_-nbZokkY",
  authDomain: "supple-proposal-1n56p.firebaseapp.com",
  storageBucket: "supple-proposal-1n56p.firebasestorage.app",
  messagingSenderId: "33691104661",
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app, "ai-studio-c3aa38cd-9508-421c-8871-19342b33ee5e");
export const auth = getAuth(app);
