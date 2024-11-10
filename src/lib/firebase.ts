import { initializeApp } from 'firebase/app';
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyAJMf4mW-iz2kk9JwKBRNpzCmU0CRJbyFg",
  authDomain: "donation-campaign-30ffd.firebaseapp.com",
  projectId: "donation-campaign-30ffd",
  storageBucket: "donation-campaign-30ffd.firebasestorage.app",
  messagingSenderId: "420621724568",
  appId: "1:420621724568:web:bce06366b0b7bf73ee19ed",
  measurementId: "G-3M2HR3YNPB"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore with persistence
const db = getFirestore(app);

// Initialize Authentication
const auth = getAuth(app);

// Initialize Firebase with persistence
export const initializeFirebase = async () => {
  try {
    await enableIndexedDbPersistence(db);
    console.info('Firestore persistence enabled');
    return true;
  } catch (err: any) {
    if (err.code === 'failed-precondition') {
      console.warn('Multiple tabs open, persistence enabled in first tab only');
    } else if (err.code === 'unimplemented') {
      console.warn('Browser does not support persistence');
    }
    return false;
  }
};

export { db, auth, app };