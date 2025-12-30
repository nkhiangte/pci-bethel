import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';
import 'firebase/compat/storage';

const firebaseConfig = {
  apiKey: "AIzaSyCSRTF152npIkPrKYAH9d-O3MFkyKwdiRA", // Placeholder
  authDomain: "bethelpci.firebaseapp.com",
  projectId: "bethelpci",
  storageBucket: "bethelpci.firebasestorage.app",
  messagingSenderId: "557102070476",
  appId: "1:557102070476:web:4ef311b7b47a89fd92e069",
  measurementId: "G-4DECDBEPN2"
};

let app;
let db: any;
let auth: any;
let storage: any;

// Mock implementations for offline/fallback mode
const mockDb = {
  collection: () => ({
    onSnapshot: (cb: any, errCb: any) => {
      // Simulate permission denied or empty to trigger fallback logic in components
      if (errCb) setTimeout(() => errCb({ message: 'Offline/Mock Mode' }), 100);
      return () => {};
    },
    get: async () => ({ docs: [] }),
    doc: () => ({}),
  }),
  batch: () => ({
    set: () => {},
    commit: async () => {}
  })
};

const mockAuth = {
  onAuthStateChanged: (cb: any) => {
    cb(null);
    return () => {};
  },
  signInWithEmailAndPassword: async () => {
    throw new Error("Firebase Auth not initialized");
  },
  signOut: async () => {}
};

try {
  // Check if firebase app is already initialized
  if (!firebase.apps.length) {
    app = firebase.initializeApp(firebaseConfig);
  } else {
    app = firebase.app();
  }

  db = firebase.firestore();
  auth = firebase.auth();
  storage = firebase.storage();
  
  console.log("Firebase initialized successfully");

} catch (error) {
  console.error("FIREBASE INITIALIZATION ERROR:", error);
  console.warn("Falling back to Mock Database Mode.");
  // Fallback to mocks
  db = mockDb;
  auth = mockAuth;
  storage = {};
}

export { db, auth, storage };
export default app;