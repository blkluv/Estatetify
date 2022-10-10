import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  serverTimestamp,
  doc,
  addDoc,
  setDoc,
  getDoc,
  updateDoc,
  collection,
} from 'firebase/firestore';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  updateProfile,
  sendPasswordResetEmail,
  onAuthStateChanged,
} from 'firebase/auth';
import {
  getStorage,
  ref,
  uploadBytesResumable,
  getDownloadURL,
} from 'firebase/storage';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: 'AIzaSyBw8nwvPdtmypL_iG3Sp33guTtFY7f_rH0',
  authDomain: 'estatetify-db.firebaseapp.com',
  projectId: 'estatetify-db',
  storageBucket: 'estatetify-db.appspot.com',
  messagingSenderId: '298086193669',
  appId: '1:298086193669:web:c6663f386459c3f8d81a6c',
};

// Initialize Firebase
initializeApp(firebaseConfig);
const db = getFirestore();
const auth = getAuth();
const storage = getStorage();
const googleProvider = new GoogleAuthProvider();
export {
  auth,
  googleProvider,
  signInWithEmailAndPassword,
  signInWithPopup,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged,
  db,
  serverTimestamp,
  doc,
  addDoc,
  setDoc,
  getDoc,
  updateDoc,
  collection,
  storage,
  ref,
  uploadBytesResumable,
  getDownloadURL,
};
