import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, collection, doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyADEu8Z-NXPkQnKb2Dh_V5VXHvRgEZ1N0Q",
    authDomain: "vision-447321.firebaseapp.com",
    projectId: "vision-447321",
    storageBucket: "vision-447321.firebasestorage.app",
    messagingSenderId: "706655025204",
    appId: "1:706655025204:web:bcc424118b2695faa07261"
  };

  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getFirestore(app);
  
  export { auth, db, collection, doc, setDoc, getDoc, updateDoc };
