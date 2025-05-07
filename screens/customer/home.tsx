import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  FlatList,
  Image,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ParamListBase } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Card from '../../components/card';
import Loading from '../../components/loading';
import ProductItem from '../../components/productItem';
import { getFeaturedProducts } from '../../services/products';
import { Product } from '../../types/product';
import { useAuth } from '../../context/authContext';
import { useCart } from '../../context/cartContext';

const Home: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<ParamListBase>>();
  const { currentUser } = useAuth();
  const { addToCart } = useCart();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);

  const categories = [
    { id: '1', name: 'Knives', color: '#3498db', icon: '🔪' },
    { id: '2', name: 'Forks', color: '#2ecc71', icon: '🍴' },
    { id: '3', name: 'Spoons', color: '#e74c3c', icon: '🥄' },
    { id: '4', name: 'Sets', color: '#9b59b6', icon: '🍽️' },
  ];

  const loadHomeData = async () => {
    try {
      const products = await getFeaturedProducts(6);
      setFeaturedProducts(products);
    } catch (error) {
      console.error('Error loading home data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadHomeData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadHomeData();
  };

  const handleProductPress = (product: Product) => {
    // Navigate to product details
    navigation.navigate('Products');
  };

  const handleAddToCart = (product: Product) => {
    addToCart(product, 1);
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.welcomeSection}>
        <Text style={styles.welcomeText}>Welcome, {currentUser?.displayName}</Text>
        <Text style={styles.subtitleText}>Explore our premium cutlery collection</Text>
      </View>

      <View style={styles.bannerContainer}>
        <Image
          source={{
            uri: 'https://images.unsplash.com/photo-1607215446320-ceadd0dbe4ac?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
          }}
          style={styles.bannerImage}
        />
        <View style={styles.bannerOverlay}>
          <Text style={styles.bannerTitle}>Premium Cutlery</Text>
          <Text style={styles.bannerText}>Elevate your dining experience</Text>
          <TouchableOpacity
            style={styles.bannerButton}
            onPress={() => navigation.navigate('Products')}
          >
            <Text style={styles.bannerButtonText}>Shop Now</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Featured Products</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Products')}>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>

        {featuredProducts.length === 0 ? (
          <Card>
            <Text style={styles.emptyText}>No featured products available</Text>
          </Card>
        ) : (
          <FlatList
            data={featuredProducts}
            renderItem={({ item }) => (
              <ProductItem
                product={item}
                onPress={() => handleProductPress(item)}
                showAddToCart
                onAddToCart={() => handleAddToCart(item)}
              />
            )}
            keyExtractor={(item) => item.id}
            horizontal={false}
            scrollEnabled={false}
          />
        )}
      </View>

      <View style={styles.categoriesSection}>
        <Text style={styles.sectionTitle}>Categories</Text>
        <View style={styles.categoriesContainer}>
          {categories.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={styles.categoryCard}
              onPress={() => navigation.navigate('Category', { category: category.name })}
            >
              <View style={[styles.categoryContent, { backgroundColor: category.color }]}>
                <Text style={styles.categoryIcon}>{category.icon}</Text>
                <Text style={styles.categoryTitle}>{category.name}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.infoSection}>
        <Card>
          <Text style={styles.infoTitle}>Store Information</Text>
          <Text style={styles.infoText}>
            Visit our shop in town to collect your orders. We're open Monday to Saturday, 9 AM to 6 PM.
          </Text>
          <Text style={styles.infoAddress}>
            123 Main Street, Town Center
          </Text>
        </Card>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  welcomeSection: {
    padding: 16,
    backgroundColor: '#fff',
  },
  welcomeText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#34495e',
  },
  subtitleText: {
    fontSize: 14,
    color: '#7f8c8d',
    marginTop: 4,
  },
  bannerContainer: {
    position: 'relative',
    height: 200,
    marginVertical: 16,
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  bannerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    padding: 16,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  bannerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  bannerText: {
    fontSize: 16,
    color: '#fff',
    marginBottom: 16,
  },
  bannerButton: {
    backgroundColor: '#3498db',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 4,
  },
  bannerButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  section: {
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#34495e',
  },
  seeAllText: {
    color: '#3498db',
    fontWeight: '500',
  },
  emptyText: {
    textAlign: 'center',
    color: '#7f8c8d',
    padding: 16,
  },
  categoriesSection: {
    padding: 16,
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  categoryCard: {
    width: '48%',
    height: 100,
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    elevation: 3,
  },
  categoryContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryIcon: {
    fontSize: 24,
    marginBottom: 8,
    color: '#fff',
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  infoSection: {
    padding: 16,
    paddingBottom: 32,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#34495e',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 8,
  },
  infoAddress: {
    fontSize: 14,
    color: '#3498db',
    fontWeight: '500',
  },
});

export default Home;