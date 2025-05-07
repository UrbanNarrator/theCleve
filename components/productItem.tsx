// components/ProductItem.tsx
import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Product } from '../types/product';
import Card from './card';

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
  return (
    <TouchableOpacity onPress={onPress} disabled={!onPress}>
      <Card>
        <View style={styles.container}>
          <Image source={{ uri: product.imageUrl }} style={styles.image} />
          <View style={styles.infoContainer}>
            <Text style={styles.name}>{product.name}</Text>
            <Text style={styles.price}>${product.price.toFixed(2)}</Text>
            {!product.inStock && (
              <Text style={styles.outOfStock}>Out of Stock</Text>
            )}
            {showAddToCart && product.inStock && (
              <TouchableOpacity
                style={styles.addButton}
                onPress={onAddToCart}
                disabled={!product.inStock}
              >
                <Ionicons name="add-circle" size={24} color="#3498db" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  image: {
    width: 80,
    height: 80,
    borderRadius: 4,
  },
  infoContainer: {
    flex: 1,
    marginLeft: 16,
  },
  name: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  price: {
    fontSize: 14,
    color: '#3498db',
    fontWeight: 'bold',
  },
  outOfStock: {
    fontSize: 12,
    color: '#e74c3c',
    marginTop: 4,
  },
  addButton: {
    position: 'absolute',
    right: 0,
    bottom: 0,
  },
});

export default ProductItem;