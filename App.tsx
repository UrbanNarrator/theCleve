import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './context/authContext';
import { CartProvider } from './context/cartContext';
import RootNavigator from './navigation/rootNavigator';

// Removed invalid JSON-like object
if ((global as any).HermesInternal) {
  console.log('Hermes is enabled!');
}

import './firebaseConfig';
export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="auto" />
      <AuthProvider>
        <CartProvider>
          <RootNavigator />
        </CartProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}