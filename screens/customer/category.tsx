import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import ProductItem from '../../components/productItem';
import Loading from '../../components/loading';
import { getProductsByCategory } from '../../services/products';
import { Product } from '../../types/product';
import { useCart } from '../../context/cartContext';
import { useAuth } from '../../context/authContext';
import { useNetInfo } from '../../context/netinfoContext';
import { ProductsNavigationProp } from '../../navigation/types';

type RouteParams = {
  Category: {
    category: string;
  };
};

const Category: React.FC = () => {
  const route = useRoute<RouteProp<RouteParams, 'Category'>>();
  const navigation = useNavigation<ProductsNavigationProp>();
  const { addToCart } = useCart();
  const { isOffline } = useAuth();
  const { isConnected } = useNetInfo();
  const { category } = route.params;
  
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    navigation.setOptions({
      title: category,
    });
    
    loadProducts();
  }, [category]);

  // Reload when connection is restored
  useEffect(() => {
    if (isConnected && error) {
      loadProducts();
    }
  }, [isConnected]);

  const loadProducts = async () => {
    try {
      setError(null);
      const productsData = await getProductsByCategory(category);
      setProducts(productsData);
    } catch (err) {
      console.error('Error loading products:', err);
      setError(`Failed to load ${category} products`);
      
      if (isOffline) {
        Alert.alert('Offline Mode', 'Some content may not be available while offline');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadProducts();
  };

  const handleAddToCart = (product: Product) => {
    if (!product.inStock) {
      Alert.alert('Out of Stock', 'This item is currently unavailable');
      return;
    }
    
    addToCart(product, 1);
    Alert.alert('Added to Cart', `${product.name} has been added to your cart`);
  };

  const handleProductPress = (product: Product) => {
    // Navigate to product details screen
    navigation.navigate('ProductDetail', { productId: product.id });
  };

  if (loading && !refreshing) {
    return <Loading />;
  }

  return (
    <View style={styles.container}>
      {isOffline && (
        <View style={styles.offlineBanner}>
          <Ionicons name="cloud-offline-outline" size={20} color="white" />
          <Text style={styles.offlineText}>You're offline. Some features may be limited.</Text>
        </View>
      )}
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{category}</Text>
      </View>
      
      {error && !refreshing && (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={20} color="#e74c3c" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadProducts}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {products.length === 0 && !error ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No products found in this category</Text>
          <TouchableOpacity
            style={styles.backToProductsButton}
            onPress={() => navigation.navigate('ProductsList')}
          >
            <Text style={styles.backToProductsText}>Browse All Products</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <ProductItem
              product={item}
              onPress={() => handleProductPress(item)}
              showAddToCart
              onAddToCart={() => handleAddToCart(item)}
            />
          )}
          contentContainerStyle={styles.productsList}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={onRefresh} 
              colors={['#3498db']}
            />
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e1e1',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#34495e',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fdedee',
    padding: 12,
    margin: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fbd2d5',
  },
  errorText: {
    color: '#e74c3c',
    marginLeft: 8,
    flex: 1,
  },
  retryButton: {
    backgroundColor: '#e74c3c',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  retryText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyText: {
    fontSize: 16,
    color: '#7f8c8d',
    marginBottom: 16,
    textAlign: 'center',
  },
  backToProductsButton: {
    backgroundColor: '#3498db',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  backToProductsText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  productsList: {
    padding: 16,
  },
  offlineBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e74c3c',
    padding: 10,
    paddingHorizontal: 15,
  },
  offlineText: {
    color: 'white',
    marginLeft: 10,
    flex: 1,
  },
});

export default Category;