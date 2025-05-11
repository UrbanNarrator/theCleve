// AuthContext.tsx
import React, { createContext, useState, useEffect, useContext } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebaseConfig';
import { User } from '../types/user';
import NetInfo from '@react-native-community/netinfo';
import { NetInfoState } from '../types/netinfo';
import { Alert } from 'react-native';

// Define the shape of the auth context
interface AuthContextProps {
  currentUser: User | null;
  loading: boolean;
  userRole: 'admin' | 'customer' | null;
  authError: string | null;
  isOffline: boolean;
  retryConnection: () => void;
}

// Create the context with default values
const AuthContext = createContext<AuthContextProps>({
  currentUser: null,
  loading: true,
  userRole: null,
  authError: null,
  isOffline: false,
  retryConnection: () => {},
});

// Utility function to get user data with fallback for offline mode
const getUserWithFallback = async (user: FirebaseUser): Promise<User> => {
  try {
    // Attempt to fetch additional user data from Firestore
    const userDocRef = doc(db, 'users', user.uid);
    console.log("Fetching user document:", user.uid);
    
    try {
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data() as Omit<User, 'id'>;
        console.log("User document exists, setting user data");
        
        return {
          id: user.uid,
          ...userData,
          email: user.email || userData.email || '',
          displayName: user.displayName || userData.displayName || '',
          createdAt: userData.createdAt || new Date(),
        };
      } else {
        console.log("No user document found in Firestore");
      }
    } catch (err) {
      console.error("Error fetching user data:", err);
      // Check if it's an offline error
      const errMsg = String(err);
      if (errMsg.includes('offline') || errMsg.includes('network')) {
        console.log("Offline error detected, using cached data");
      }
      // Continue to fallback
    }
    
    // Fallback: Return basic user info if Firestore fetch fails
    console.log("Using fallback user data");
    return {
      id: user.uid,
      email: user.email || '',
      displayName: user.displayName || '',
      role: 'customer', // Default role
      createdAt: new Date(),
    };
  } catch (err) {
    console.error("Error in getUserWithFallback:", err);
    // Final fallback with minimal data
    return {
      id: user.uid,
      email: user.email || '',
      displayName: user.displayName || '',
      role: 'customer',
      createdAt: new Date(),
    };
  }
};

// Custom hook to use auth context
export const useAuth = () => useContext(AuthContext);

// Auth provider component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(false);
  const [connectionRetries, setConnectionRetries] = useState(0);

  // Function to manually retry connection
  const retryConnection = () => {
    setConnectionRetries(prev => prev + 1);
    NetInfo.fetch().then(state => {
      if (state.isConnected) {
        console.log("Manual connection retry - network is available");
        refreshUserData();
      } else {
        console.log("Manual connection retry - still offline");
        // Show message to user
        Alert.alert(
          "Still Offline",
          "Your device is still offline. Please check your connection and try again.",
          [{ text: "OK" }]
        );
      }
    });
  };

  // Network connectivity monitoring
  useEffect(() => {
  console.log("Setting up network monitoring...");
  const unsubscribeNetInfo = NetInfo.addEventListener((state) => {
    // Use the state without explicit typing since it's already correctly typed
    // by the NetInfo library's addEventListener function
    const offline = !(state.isConnected && state.isInternetReachable);
    console.log("Network status changed - Offline:", offline);
    setIsOffline(offline);
    
    // Show notification when connection status changes
    if (offline && currentUser) {
      console.log("Went offline while authenticated - using cached data");
    } else if (!offline && currentUser) {
      console.log("Back online - will refresh data");
    }
  });

  return () => unsubscribeNetInfo();
}, [currentUser]);

  // Helper function to refresh user data
  const refreshUserData = async () => {
    try {
      // Only try to refresh if we're authenticated
      if (auth.currentUser) {
        console.log("Refreshing user data...");
        const userData = await getUserWithFallback(auth.currentUser);
        setCurrentUser(prev => {
          if (!prev) return userData;
          return {
            ...prev,
            ...userData,
          };
        });
      }
    } catch (err) {
      console.error("Error refreshing user data:", err);
      // Don't update state or show error - keep using existing data
    }
  };

  // Auth state monitoring
  useEffect(() => {
    let unsubscribed = false;
    let retryCount = 0;
    const MAX_RETRIES = 3;
    
    console.log("Setting up auth state observer...");
    
    const setupAuthObserver = () => {
      try {
        const unsubscribe = onAuthStateChanged(
          auth,
          async (user: FirebaseUser | null) => {
            if (unsubscribed) return;
            
            console.log("Auth state changed:", user ? "User logged in" : "No user");
            setAuthError(null);
            
            if (user) {
              try {
                // Get user data with offline fallback
                const userData = await getUserWithFallback(user);
                setCurrentUser(userData);
              } catch (err) {
                console.error("Final error handling user auth:", err);
                setAuthError("Authentication error. Please try again later.");
                
                // Set minimal user data even on error
                setCurrentUser({
                  id: user.uid,
                  email: user.email || '',
                  displayName: user.displayName || '',
                  role: 'customer',
                  createdAt: new Date(),
                });
              }
            } else {
              setCurrentUser(null);
            }
            
            setLoading(false);
          },
          (error) => {
            console.error("Auth state observer error:", error);
            
            // Check if it's a network error
            const errorMessage = (error as Error).message;
            if (
              errorMessage.includes('network') || 
              errorMessage.includes('offline') ||
              errorMessage.includes('failed to get document')
            ) {
              console.log("Network-related auth error detected");
              setAuthError("Network error: Please check your connection");
            } else {
              setAuthError("Authentication error: " + errorMessage);
            }
            
            setLoading(false);
            
            // Retry logic for temporary connection issues
            if (retryCount < MAX_RETRIES && !unsubscribed) {
              retryCount++;
              console.log(`Retrying auth connection (${retryCount}/${MAX_RETRIES})...`);
              setTimeout(setupAuthObserver, 2000 * retryCount); // Exponential backoff
            }
          }
        );
        
        return unsubscribe;
      } catch (err) {
        console.error("Failed to set up auth observer:", err);
        setAuthError("Failed to initialize authentication. Please restart the app.");
        setLoading(false);
        return () => {};
      }
    };
    
    const unsubscribe = setupAuthObserver();
    
    // Cleanup function
    return () => {
      console.log("Cleaning up auth observer...");
      unsubscribed = true;
      unsubscribe();
    };
  }, [connectionRetries]); // Added connectionRetries dependency to enable manual retries

  // Recheck user data when coming back online
  useEffect(() => {
    if (!isOffline && currentUser && !loading) {
      // We're coming back online with a logged-in user
      console.log("Device back online, refreshing user data...");
      refreshUserData();
    }
  }, [isOffline, loading]);

  // Combine all values for the context
  const value = {
    currentUser,
    loading,
    userRole: currentUser?.role || null,
    authError,
    isOffline,
    retryConnection,
  };

  // Provide the context to children
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthProvider;