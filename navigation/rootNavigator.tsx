import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuth } from '../context/authContext';
import AdminNavigator from './adminNavigator';
import CustomerNavigator from './customerNavigator';
import Login from '../screens/auth/login';
import Register from '../screens/auth/register';
import ForgotPassword from '../screens/auth/forgotPassword';
import Loading from '../components/loading';

const Stack = createStackNavigator();

const RootNavigator: React.FC = () => {
  const { currentUser, loading, userRole } = useAuth();
  
  if (loading) {
    return <Loading />;
  }
  
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!currentUser ? (
          // Auth screens
          <>
            <Stack.Screen name="Login" component={Login} />
            <Stack.Screen name="Register" component={Register} />
            <Stack.Screen name="ForgotPassword" component={ForgotPassword} />
          </>
        ) : (
          // User specific navigators based on role
          <>
            {userRole === 'admin' ? (
              <Stack.Screen name="AdminNavigator" component={AdminNavigator} />
            ) : (
              <Stack.Screen name="CustomerNavigator" component={CustomerNavigator} />
            )}
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default RootNavigator;