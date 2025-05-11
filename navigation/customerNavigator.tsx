import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import Home from '../screens/customer/home';
import Products from '../screens/customer/products';
import Category from '../screens/customer/category';
import ProductDetail from '../screens/customer/productDetail';
import Orders from '../screens/customer/orders';
import Checkout from '../screens/customer/checkout';
import Profile from '../screens/customer/profile';
import { useCart } from '../context/cartContext';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Stack navigator for Products section
const ProductsStack = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen name="ProductsList" component={Products} options={{ title: 'Products' }} />
      <Stack.Screen name="Category" component={Category} />
      <Stack.Screen 
        name="ProductDetail" 
        component={ProductDetail} 
        options={{ title: 'Product Details' }}
      />
    </Stack.Navigator>
  );
};

// Stack navigator for checkout process
const CartStack = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Checkout" component={Checkout} />
    </Stack.Navigator>
  );
};

const CustomerNavigator: React.FC = () => {
  const { totalItems } = useCart();
  
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Products') {
            iconName = focused ? 'grid' : 'grid-outline';
          } else if (route.name === 'Orders') {
            iconName = focused ? 'list' : 'list-outline';
          } else if (route.name === 'Cart') {
            iconName = focused ? 'cart' : 'cart-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName as any} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#3498db',
        tabBarInactiveTintColor: 'gray',
        headerShown: true,
      })}
    >
      <Tab.Screen name="Home" component={Home} />
      <Tab.Screen name="Products" component={ProductsStack} options={{ headerShown: false }} />
      <Tab.Screen name="Orders" component={Orders} />
      <Tab.Screen 
        name="Cart" 
        component={CartStack} 
        options={{ 
          headerShown: false,
          tabBarBadge: totalItems > 0 ? totalItems : undefined,
        }} 
      />
      <Tab.Screen name="Profile" component={Profile} />
    </Tab.Navigator>
  );
};

export default CustomerNavigator;