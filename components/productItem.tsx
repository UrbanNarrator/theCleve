// components/productItem.tsx
import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Product } from '../types/product';

interface ProductItemProps {
  product: Product;
  onPress?: () => void;
  showAddToCart?: boolean;
  onAddToCart?: () => void;
}

const ProductItem: React.FC<ProductItemProps> = ({
  product,
  onPress,
  showAddToCart = false,
  onAddToCart,
}) => {
  // Fallback image
  const fallbackImage = 'https://via.placeholder.com/150?text=No+Image';
  
  // Calculate final price if there's a discount
  const finalPrice = product.discount 
    ? product.price * (1 - product.discount / 100) 
    : product.price;
    
  return (
    <TouchableOpacity 
      style={styles.container} 
      onPress={onPress} 
      disabled={!onPress}
      activeOpacity={0.9}
    >
      <View style={styles.card}>
        <View style={styles.imageContainer}>
          <Image 
            source={{ uri: product.imageUrl || fallbackImage }} 
            style={styles.image}
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
        </View>
        
        <View style={styles.contentContainer}>
          <Text style={styles.name} numberOfLines={1}>{product.name}</Text>
          
          <View style={styles.priceContainer}>
            <Text style={styles.price}>KSh {Math.round(finalPrice).toLocaleString()}</Text>
            
            {product.discount && product.discount > 0 && (
              <Text style={styles.originalPrice}>
                KSh {product.price.toLocaleString()}
              </Text>
            )}
          </View>
          
          {showAddToCart && (
            <TouchableOpacity
              style={[styles.addToCartButton, !product.inStock && styles.disabledButton]}
              onPress={onAddToCart}
              disabled={!product.inStock}
            >
              <Ionicons name="cart-outline" size={20} color="#fff" />
              <Text style={styles.addToCartText}>Add</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    overflow: 'hidden',
    // 30% shadow opacity as requested
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5, // For Android
  },
  imageContainer: {
    position: 'relative',
  },
  image: {
    width: '100%',
    height: 180,
    backgroundColor: '#f5f5f5',
  },
  badge: {
    position: 'absolute',
    top: 8,
    left: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
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
  contentContainer: {
    padding: 12,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  price: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#3498db',
  },
  originalPrice: {
    fontSize: 12,
    color: '#95a5a6',
    marginLeft: 8,
    textDecorationLine: 'line-through',
  },
  addToCartButton: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: '#3498db',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  disabledButton: {
    backgroundColor: '#bdc3c7',
  },
  addToCartText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
    marginLeft: 4,
  },
});

export default ProductItem;