import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useNetInfo } from '../context/netinfoContext';

const OfflineNotice: React.FC = () => {
  const { isConnected } = useNetInfo();

  if (isConnected) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.text}>No Internet Connection</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f8d7da',
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    position: 'absolute',
    top: 0,
    zIndex: 1000,
  },
  text: {
    color: '#721c24',
    fontWeight: 'bold',
  },
});

export default OfflineNotice;