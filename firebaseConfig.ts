// firebaseConfig.ts
import { initializeApp } from 'firebase/app';
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { 
  getFirestore, 
  enableMultiTabIndexedDbPersistence,
  disableNetwork,
  enableNetwork,
  CACHE_SIZE_UNLIMITED,
  initializeFirestore,
  setLogLevel,
  waitForPendingWrites
} from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import NetInfo from '@react-native-community/netinfo';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD5Y610IEkEIhbOXlsHBf0KZpvAFK6OL9Q",
  authDomain: "thecleve-33b75.firebaseapp.com",
  projectId: "thecleve-33b75",
  storageBucket: "thecleve-33b75.appspot.com",
  messagingSenderId: "696581253308",
  appId: "1:696581253308:web:df50bbd8f14069896f08b9",
  measurementId: "G-JF4BQXZFCS"
};

// Set debug mode for development environments
const isDebugMode = __DEV__;

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Authentication with persistence
const auth = getAuth(app);
setPersistence(auth, browserLocalPersistence)
  .catch(error => {
    console.error("Auth persistence error:", error);
  });

// Enable more detailed logging in development
if (isDebugMode) {
  setLogLevel('debug');
}

// Initialize Firestore with optimized settings for React Native
// FIXED: Removed experimentalAutoDetectLongPolling which conflicts with experimentalForceLongPolling
const db = initializeFirestore(app, {
  cacheSizeBytes: CACHE_SIZE_UNLIMITED,
  experimentalForceLongPolling: true, // Essential for Expo Go
  ignoreUndefinedProperties: true,
});

// Track if we've already tried persistence initialization
let persistenceInitialized = false;

// Enhanced persistence initialization with more robust error handling
const initializePersistence = async () => {
  // Avoid duplicate initialization attempts
  if (persistenceInitialized) return;

  try {
    // Check network status before initialization
    const netInfo = await NetInfo.fetch();
    
    // Log network status for debugging
    console.log(`Network: ${netInfo.type}, Connected: ${netInfo.isConnected ? 'Yes' : 'No'}`);
    
    if (!netInfo.isConnected) {
      console.log('Initializing Firestore persistence while offline');
    }
    
    // Enable offline persistence
    await enableMultiTabIndexedDbPersistence(db);
    console.log('Firestore persistence successfully enabled');
    
    // Wait for any pending writes to be saved
    await waitForPendingWrites(db);
    
    persistenceInitialized = true;
  } catch (err: any) {
    console.error('Firestore persistence initialization error:', err);
    
    if (err.code === 'failed-precondition') {
      // Multiple tabs open, persistence can only be enabled in one tab at a time
      console.warn('Persistence failed - multiple tabs open. Using default caching.');
    } else if (err.code === 'unimplemented') {
      // Current browser/environment doesn't support persistence
      console.warn('Persistence not supported in this environment. Using default caching.');
    } else if (err.name === 'FirebaseError') {
      console.warn(`Firebase error during persistence initialization: ${err.message}`);
    } else {
      console.error('Unknown error during persistence initialization:', err);
    }
    
    // Even if persistence fails, the default memory cache will still work
    console.log('Falling back to Firestore default caching');
  }
};

// Function to manually retry connection
export const retryFirestoreConnection = async () => {
  try {
    const netInfo = await NetInfo.fetch();
    
    if (netInfo.isConnected) {
      console.log('Network available, enabling Firestore connection');
      await enableNetwork(db);
      
      // If persistence wasn't initialized before, try again
      if (!persistenceInitialized) {
        await initializePersistence();
      }
      
      return true;
    } else {
      console.log('Network still unavailable, cannot reconnect Firestore');
      return false;
    }
  } catch (err) {
    console.error('Error reconnecting to Firestore:', err);
    return false;
  }
};

// Execute the persistence initialization
initializePersistence().catch(error => {
  console.warn('Failed to initialize persistence:', error);
});

// Set up network status listener for connection management
let wasOffline = false;

NetInfo.addEventListener(state => {
  const isOffline = !(state.isConnected);
  
  // Handle transition from offline to online
  if (wasOffline && !isOffline) {
    console.log('Device back online, reconnecting Firestore...');
    enableNetwork(db)
      .then(() => console.log('Firestore network connection restored'))
      .catch(err => console.error('Error enabling Firestore network:', err));
  } 
  // Handle transition from online to offline
  else if (!wasOffline && isOffline) {
    console.log('Device went offline, using cached Firestore data');
    disableNetwork(db)
      .then(() => console.log('Firestore network disabled to preserve battery'))
      .catch(err => console.error('Error disabling Firestore network:', err));
  }
  
  wasOffline = isOffline;
});

// Initialize Storage
const storage = getStorage(app);

export { auth, db, storage };
export default app;