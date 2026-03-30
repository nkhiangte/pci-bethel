
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';
import 'firebase/compat/storage';

import firebaseConfig from '../../firebase-applet-config.json';

const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || firebaseConfig.apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || firebaseConfig.authDomain,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || firebaseConfig.projectId,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || firebaseConfig.storageBucket,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || firebaseConfig.messagingSenderId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || firebaseConfig.appId,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || firebaseConfig.measurementId
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
    limit: function() { return this; },
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

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth?.currentUser?.uid,
      email: auth?.currentUser?.email,
      emailVerified: auth?.currentUser?.emailVerified,
      isAnonymous: auth?.currentUser?.isAnonymous,
      tenantId: auth?.currentUser?.tenantId,
      providerInfo: auth?.currentUser?.providerData.map((provider: any) => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

try {
  if (!firebase.apps.length) {
    app = firebase.initializeApp(config);
  } else {
    app = firebase.app();
  }

  // Use firestoreDatabaseId if available in config
  if (firebaseConfig.firestoreDatabaseId) {
    db = (firebase.app() as any).firestore(firebaseConfig.firestoreDatabaseId);
  } else {
    db = firebase.firestore(app);
  }
  
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
