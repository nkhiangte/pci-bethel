
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';
import 'firebase/compat/storage';

const firebaseConfig = {
  apiKey: "AIzaSyCSRTF152npIkPrKYAH9d-O3MFkyKwdiRA", // Placeholder - ensure your project settings match
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
      if (errCb) setTimeout(() => errCb({ message: 'Offline/Mock Mode' }), 100);
      return () => {};
    },
    get: async () => ({ docs: [], empty: true }),
    doc: () => ({
        get: async () => ({ exists: false, data: () => undefined }),
        set: async () => {},
        update: async () => {},
        delete: async () => {}
    }),
    where: function() { return this; },
    orderBy: function() { return this; },
    limit: function() { return this; }, // Added limit to prevent crashes in mock mode
  }),
  batch: () => ({
    set: () => {},
    update: () => {},
    delete: () => {},
    commit: async () => {}
  }),
  settings: () => {},
  enablePersistence: async () => {}
};

const mockAuth = {
  onAuthStateChanged: (cb: any) => {
    cb(null);
    return () => {};
  },
  signInWithEmailAndPassword: async () => {
    throw new Error("Firebase Auth not initialized");
  },
  createUserWithEmailAndPassword: async () => {
    throw new Error("Firebase Auth not initialized");
  },
  signOut: async () => {},
  currentUser: null
};

try {
  if (!firebase.apps.length) {
    app = firebase.initializeApp(firebaseConfig);
  } else {
    app = firebase.app();
  }

  db = firebase.firestore();
  auth = firebase.auth();
  storage = firebase.storage();
  
  // FIX: Removed conflicting experimentalForceLongPolling and invalid 'merge' property
  db.settings({
    ignoreUndefinedProperties: true,
  });

  // Enable offline persistence
  db.enablePersistence({ synchronizeTabs: true }).catch((err: any) => {
      if (err.code == 'failed-precondition') {
          console.warn('Multiple tabs open, persistence limited.');
      } else if (err.code == 'unimplemented') {
          console.warn('Browser does not support persistence');
      }
  });
  
  console.log("Firebase initialized");

} catch (error) {
  console.error("FIREBASE INITIALIZATION ERROR:", error);
  db = mockDb;
  auth = mockAuth;
  storage = {};
}

export { db, auth, storage };
export default app;
