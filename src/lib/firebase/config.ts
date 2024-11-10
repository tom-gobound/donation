import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAJMf4mW-iz2kk9JwKBRNpzCmU0CRJbyFg",
  authDomain: "donation-campaign-30ffd.firebaseapp.com",
  projectId: "donation-campaign-30ffd",
  storageBucket: "donation-campaign-30ffd.firebasestorage.app",
  messagingSenderId: "420621724568",
  appId: "1:420621724568:web:bce06366b0b7bf73ee19ed",
  measurementId: "G-3M2HR3YNPB"
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);