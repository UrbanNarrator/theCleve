import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import ProductItem from '../../components/productItem';
import Loading from '../../components/loading';
import { getProductsByCategory } from '../../services/products';
import { Product } from '../../types/product';
import { useCart } from '../../context/cartContext';

type RouteParams = {
  category: string;
};

const Category: React.FC = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { addToCart } = useCart();
  const { category } = route.params as RouteParams;
  
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    navigation.setOptions({
      title: category,
    });
    
    loadProducts();
  }, [category]);

  const loadProducts = async () => {
    try {
      const productsData = await getProductsByCategory(category);
      setProducts(productsData);
    } catch (error) {
      console.error('Error loading products:', error);
      Alert.alert('Error', 'Failed to load products for this category');
    } finally {
      setLoading(false);
    }
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
    // For a simple version, just add to cart directly
    if (!product.inStock) {
      Alert.alert('Out of Stock', 'This item is currently unavailable');
      return;
    }
    
    Alert.alert(
      product.name,
      product.description,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Add to Cart',
          onPress: () => handleAddToCart(product),
          style: 'default',
        },
      ]
    );
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#34495e" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{category}</Text>
        <View style={styles.placeholder} />
      </View>

      {products.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No products found in this category</Text>
          <TouchableOpacity
            style={styles.backToProductsButton}
            onPress={() => navigation.navigate('ProductsList' as never)}
          >
            <Text style={styles.backToProductsText}>Back to All Products</Text>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e1e1',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#34495e',
  },
  placeholder: {
    width: 40,
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
});

export default Category;