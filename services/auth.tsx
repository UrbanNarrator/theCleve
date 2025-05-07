import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    sendPasswordResetEmail,
  } from 'firebase/auth';
  import { doc, setDoc, getDoc, updateDoc, Timestamp } from 'firebase/firestore';
  import { auth, db } from '../firebaseConfig';
  import { User, UserRole } from '../types/user';
  
  // Register new user
  export const registerUser = async (
    email: string,
    password: string,
    displayName: string,
    role: UserRole = 'customer',
    phone?: string,
    address?: string
  ): Promise<void> => {
    try {
      // Create authentication record
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Create user document in Firestore
      await setDoc(doc(db, 'users', user.uid), {
        email,
        displayName,
        role,
        phone: phone || '',
        address: address || '',
        createdAt: new Date(),
      });
    } catch (error) {
      console.error('Error registering user:', error);
      throw error;
    }
  };
  
  // Login existing user
  export const loginUser = async (email: string, password: string): Promise<void> => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error('Error logging in:', error);
      throw error;
    }
  };
  
  // Logout user
  export const logoutUser = async (): Promise<void> => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };
  
  // Reset password
  export const resetPassword = async (email: string): Promise<void> => {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      console.error('Error resetting password:', error);
      throw error;
    }
  };
  
  // Update user profile
  export const updateUserProfile = async (
    userId: string,
    updates: Partial<Omit<User, 'id' | 'email' | 'role' | 'createdAt'>>
  ): Promise<void> => {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, updates);
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  };
  
  // Get user by ID
  export const getUserById = async (userId: string): Promise<User | null> => {
    try {
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data() as Omit<User, 'id'>;
        return {
          id: userId,
          ...userData,
          createdAt: userData.createdAt instanceof Timestamp ? userData.createdAt.toDate() : new Date(),
        };
      } else {
        return null;
      }
    } catch (error) {
      console.error('Error fetching user:', error);
      throw error;
    }
  };