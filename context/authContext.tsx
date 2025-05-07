import React, { createContext, useState, useEffect, useContext } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebaseConfig';
import { User } from '../types/user';

interface AuthContextProps {
  currentUser: User | null;
  loading: boolean;
  userRole: 'admin' | 'customer' | null;
}

const AuthContext = createContext<AuthContextProps>({
  currentUser: null,
  loading: true,
  userRole: null,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Fetch additional user data from Firestore
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
          const userData = userDoc.data() as Omit<User, 'id'>;
          setCurrentUser({
            id: user.uid,
            ...userData,
            createdAt: userData.createdAt || new Date(),
          });
        } else {
          // Handle case where user auth exists but no Firestore document
          setCurrentUser(null);
        }
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    loading,
    userRole: currentUser?.role || null,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};