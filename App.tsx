import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './context/authContext';
import { CartProvider } from './context/cartContext';
import RootNavigator from './navigation/rootNavigator';
import { NetInfoProvider } from './context/netinfoContext';
import OfflineNotice from './components/offlineNotice';

// Removed invalid JSON-like object
if ((global as any).HermesInternal) {
  console.log('Hermes is enabled!');
}

import './firebaseConfig';

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="auto" />
      <NetInfoProvider>
        <AuthProvider>
          <CartProvider>
            <OfflineNotice />
            <RootNavigator />
          </CartProvider>
        </AuthProvider>
      </NetInfoProvider>
    </SafeAreaProvider>
  );
}