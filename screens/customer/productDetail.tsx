import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Share,
} from 'react-native';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { getProductById } from '../../services/products';
import { Product } from '../../types/product';
import { useCart } from '../../context/cartContext';
import { useAuth } from '../../context/authContext';
import Card from '../../components/card';

type ParamList = {
  ProductDetail: {
    productId: string;
  };
};

const ProductDetail: React.FC = () => {
  const route = useRoute<RouteProp<ParamList, 'ProductDetail'>>();
  const navigation = useNavigation();
  const { addToCart } = useCart();
  const { isOffline } = useAuth();
  const { productId } = route.params;
  
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    const loadProduct = async () => {
      try {
        setLoading(true);
        const productData = await getProductById(productId);
        if (productData) {
          setProduct(productData);
          navigation.setOptions({
            title: productData.name
          });
        } else {
          setError('Product not found');
        }
      } catch (err) {
        console.error('Error loading product:', err);
        setError('Failed to load product details');
      } finally {
        setLoading(false);
      }
    };

    loadProduct();
  }, [productId]);

  const handleAddToCart = () => {
    if (!product) return;
    
    if (!product.inStock) {
      Alert.alert('Out of Stock', 'This item is currently unavailable');
      return;
    }
    
    addToCart(product, quantity);
    Alert.alert(
      'Added to Cart',
      `${product.name} has been added to your cart`,
      [
        { text: 'Continue Shopping', style: 'cancel' },
        { text: 'Go to Cart', onPress: () => navigation.navigate('Cart' as never) }
      ]
    );
  };

  const handleQuantityChange = (increment: boolean) => {
    if (increment) {
      setQuantity(prev => Math.min(prev + 1, 10)); // Max 10 items
    } else {
      setQuantity(prev => Math.max(prev - 1, 1)); // Min 1 item
    }
  };

  const handleShare = async () => {
    if (!product) return;
    
    try {
      await Share.share({
        message: `Check out ${product.name} - KSh ${product.price} at The Cleve!`,
      });
    } catch (error) {
      console.error('Error sharing product:', error);
    }
  };

  if (loading) {
    return (
      <View style={styles.centeredContainer}>
        <ActivityIndicator size="large" color="#3498db" />
        <Text style={styles.loadingText}>Loading product details...</Text>
      </View>
    );
  }

  if (error || !product) {
    return (
      <View style={styles.centeredContainer}>
        <Ionicons name="alert-circle-outline" size={48} color="#e74c3c" />
        <Text style={styles.errorText}>{error || 'Product not found'}</Text>
        <TouchableOpacity
          style={styles.goBackButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.goBackButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Calculate price after discount
  const finalPrice = product.discount 
    ? product.price * (1 - product.discount / 100) 
    : product.price;

  return (
    <View style={styles.container}>
      {isOffline && (
        <View style={styles.offlineBanner}>
          <Ionicons name="cloud-offline-outline" size={20} color="white" />
          <Text style={styles.offlineText}>You're offline. Some features may be limited.</Text>
        </View>
      )}
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Product Image */}
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: product.imageUrl || 'https://via.placeholder.com/400?text=No+Image' }}
            style={styles.productImage}
            resizeMode="cover"
          />
          
          {/* Badge for discounts or out of stock */}
          {!product.inStock ? (
            <View style={[styles.badge, styles.outOfStockBadge]}>
              <Text style={styles.badgeText}>Out of Stock</Text>
            </View>
          ) : product.discount && product.discount > 0 ? (
            <View style={[styles.badge, styles.discountBadge]}>
              <Text style={styles.badgeText}>{product.discount}% OFF</Text>
            </View>
          ) : null}
          
          {/* Share button */}
          <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
            <Ionicons name="share-social-outline" size={22} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Product Details */}
        <Card style={styles.detailsCard}>
          {/* Product name and category */}
          <View style={styles.headerSection}>
            <Text style={styles.productName}>{product.name}</Text>
            <Text style={styles.categoryText}>{product.category}</Text>
          </View>
          
          {/* Price section */}
          <View style={styles.priceSection}>
            <Text style={styles.priceLabel}>Price:</Text>
            <View style={styles.priceContainer}>
              <Text style={styles.price}>KSh {Math.round(finalPrice).toLocaleString()}</Text>
              
              {product.discount && product.discount > 0 && (
                <Text style={styles.originalPrice}>
                  KSh {product.price.toLocaleString()}
                </Text>
              )}
            </View>
          </View>
          
          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.description}>{product.description}</Text>
          </View>
          
          {/* Quantity selector */}
          <View style={styles.quantitySection}>
            <Text style={styles.quantityLabel}>Quantity:</Text>
            <View style={styles.quantityControls}>
              <TouchableOpacity
                style={[styles.quantityButton, quantity <= 1 && styles.disabledButton]}
                onPress={() => handleQuantityChange(false)}
                disabled={quantity <= 1}
              >
                <Ionicons name="remove" size={18} color={quantity <= 1 ? "#bdc3c7" : "#34495e"} />
              </TouchableOpacity>
              
              <Text style={styles.quantityValue}>{quantity}</Text>
              
              <TouchableOpacity
                style={[styles.quantityButton, quantity >= 10 && styles.disabledButton]}
                onPress={() => handleQuantityChange(true)}
                disabled={quantity >= 10}
              >
                <Ionicons name="add" size={18} color={quantity >= 10 ? "#bdc3c7" : "#34495e"} />
              </TouchableOpacity>
            </View>
          </View>
          
          {/* Add to cart button */}
          <TouchableOpacity
            style={[
              styles.addToCartButton,
              (!product.inStock || isOffline) && styles.disabledButton
            ]}
            onPress={handleAddToCart}
            disabled={!product.inStock || isOffline}
          >
            <Ionicons name="cart-outline" size={20} color="#fff" />
            <Text style={styles.addToCartText}>
              {!product.inStock ? 'Out of Stock' : 'Add to Cart'}
            </Text>
          </TouchableOpacity>
          
          {isOffline && (
            <Text style={styles.offlineNote}>
              Adding to cart is disabled while offline
            </Text>
          )}
          
          {/* Total price */}
          <View style={styles.totalSection}>
            <Text style={styles.totalLabel}>Total:</Text>
            <Text style={styles.totalPrice}>
              KSh {Math.round(finalPrice * quantity).toLocaleString()}
            </Text>
          </View>
        </Card>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    paddingBottom: 24,
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#7f8c8d',
  },
  errorText: {
    marginTop: 10,
    marginBottom: 20,
    fontSize: 16,
    color: '#e74c3c',
    textAlign: 'center',
  },
  goBackButton: {
    backgroundColor: '#3498db',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 6,
  },
  goBackButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: 300,
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  badge: {
    position: 'absolute',
    top: 16,
    left: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  discountBadge: {
    backgroundColor: '#e74c3c',
  },
  outOfStockBadge: {
    backgroundColor: '#7f8c8d',
  },
  badgeText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  shareButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: 'rgba(0,0,0,0.5)',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailsCard: {
    margin: 16,
  },
  headerSection: {
    marginBottom: 16,
  },
  productName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#34495e',
    marginBottom: 4,
  },
  categoryText: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  priceSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  priceLabel: {
    fontSize: 16,
    color: '#34495e',
    marginRight: 8,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  price: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#3498db',
  },
  originalPrice: {
    fontSize: 16,
    color: '#95a5a6',
    marginLeft: 8,
    textDecorationLine: 'line-through',
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#34495e',
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: '#34495e',
    lineHeight: 24,
  },
  quantitySection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  quantityLabel: {
    fontSize: 16,
    color: '#34495e',
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#bdc3c7',
  },
  quantityValue: {
    marginHorizontal: 16,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#34495e',
  },
  addToCartButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3498db',
    paddingVertical: 14,
    borderRadius: 8,
    marginBottom: 8,
  },
  addToCartText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 8,
  },
  offlineNote: {
    color: '#e74c3c',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 16,
  },
  totalSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 16,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#34495e',
  },
  totalPrice: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#27ae60',
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

export default ProductDetail;