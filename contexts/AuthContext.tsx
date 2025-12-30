
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { auth, db } from '../services/firebase';
import { UserProfile } from '../types';

interface AuthContextType {
  currentUser: any | null;
  userProfile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  userProfile: null,
  loading: true,
  isAdmin: false,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timeout = setTimeout(() => {
        setLoading(false);
    }, 2000);

    if (auth) {
      const unsubscribe = auth.onAuthStateChanged(async (user: any) => {
        setCurrentUser(user);
        
        if (user) {
          try {
            // Fetch additional user data from Firestore
            if (db && db.collection) {
                let profileData: any = null;

                // 1. Try fetching by UID (Standard best practice)
                const userDoc = await db.collection('users').doc(user.uid).get();
                if (userDoc.exists) {
                    profileData = userDoc.data();
                } else {
                    // 2. Fallback: Try fetching by Email (Handles manually created docs where ID != UID)
                    console.log("Profile not found by UID, searching by email:", user.email);
                    const querySnapshot = await db.collection('users').where('email', '==', user.email).limit(1).get();
                    if (!querySnapshot.empty) {
                        profileData = querySnapshot.docs[0].data();
                    }
                }

                if (profileData) {
                    console.log("User Profile Loaded:", profileData);
                    setUserProfile(profileData as UserProfile);
                } else {
                    // Fallback if doc doesn't exist yet (e.g. freshly created)
                    setUserProfile({
                        uid: user.uid,
                        email: user.email,
                        displayName: user.displayName || 'Member',
                        role: 'member',
                        createdAt: new Date().toISOString()
                    });
                }
            } else {
                 // Mock Mode Fallback
                 setUserProfile({
                    uid: user.uid,
                    email: user.email,
                    displayName: 'Admin User',
                    role: 'admin', // Default to admin in mock mode for testing
                    createdAt: new Date().toISOString()
                });
            }
          } catch (error) {
            console.error("Error fetching user profile:", error);
            // Non-blocking error
          }
        } else {
          setUserProfile(null);
        }

        setLoading(false);
        clearTimeout(timeout);
      });

      return () => {
          unsubscribe();
          clearTimeout(timeout);
      };
    } else {
      console.warn("Auth service not available");
      setLoading(false);
      return () => clearTimeout(timeout);
    }
  }, []);

  // Determine admin status by checking 'role' OR 'isAdmin' (string/boolean)
  // Hardcoded check for specific email to ensure access even if DB fetch fails
  const isUserAdmin = 
    (currentUser?.email === 'nkhiangte@gmail.com') || 
    userProfile?.role === 'admin' || 
    String(userProfile?.isAdmin) === 'true' || 
    userProfile?.isAdmin === true;

  const value = {
    currentUser,
    userProfile,
    loading,
    isAdmin: isUserAdmin
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
