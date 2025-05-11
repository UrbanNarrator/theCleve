import { CompositeNavigationProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';

// Stack navigator param list for Products section
export type ProductsStackParamList = {
  ProductsList: undefined;
  Category: { category: string };
  ProductDetail: { productId: string };
};

// Stack navigator param list for Cart section
export type CartStackParamList = {
  Checkout: undefined;
};

// Bottom tab navigator param list
export type CustomerTabParamList = {
  Home: undefined;
  Products: undefined | { screen?: keyof ProductsStackParamList; params?: any };
  Orders: undefined;
  Cart: undefined;
  Profile: undefined;
};

// Navigation types
export type ProductsNavigationProp = StackNavigationProp<ProductsStackParamList>;
export type CartNavigationProp = StackNavigationProp<CartStackParamList>;
export type CustomerTabNavigationProp = BottomTabNavigationProp<CustomerTabParamList>;

// Composite navigation type for components inside ProductsStack
export type ProductsCompositeNavigationProp = CompositeNavigationProp<
  StackNavigationProp<ProductsStackParamList>,
  BottomTabNavigationProp<CustomerTabParamList>
>;