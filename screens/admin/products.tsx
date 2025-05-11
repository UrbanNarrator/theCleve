import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  ScrollView,
  Image,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Card from '../../components/card';
import Button from '../../components/button';
import Loading from '../../components/loading';
import { getAllProducts, getProductById, addProduct, updateProduct, deleteProduct } from '../../services/products';
import { Product, ProductInput } from '../../types/product';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../context/authContext';

const Products: React.FC = () => {
  const { isOffline } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: 'Knives',
    imageUri: '',
    inStock: true,
    featured: false,
    discount: '',
  });
  const [imageFile, setImageFile] = useState<any>(null);

  const loadProducts = async () => {
    try {
      const productsData = await getAllProducts();
      setProducts(productsData);
    } catch (error) {
      console.error('Error loading products:', error);
      Alert.alert('Error', 'Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      category: 'Knives',
      imageUri: '',
      inStock: true,
      featured: false,
      discount: '',
    });
    setImageFile(null);
    setSelectedProduct(null);
    setIsEditing(false);
  };

  const handleAddProduct = () => {
    if (isOffline) {
      Alert.alert('Offline Mode', 'Product management is disabled while offline');
      return;
    }
    resetForm();
    setModalVisible(true);
  };

  const handleEditProduct = (product: Product) => {
    if (isOffline) {
      Alert.alert('Offline Mode', 'Product management is disabled while offline');
      return;
    }
    setIsEditing(true);
    setSelectedProduct(product);
    setFormData({
      name: product.name,
      description: product.description,
      price: product.price.toString(),
      category: product.category,
      imageUri: product.imageUrl,
      inStock: product.inStock,
      featured: product.featured || false,
      discount: product.discount ? product.discount.toString() : '',
    });
    setModalVisible(true);
  };

  const handleDeleteProduct = (product: Product) => {
    if (isOffline) {
      Alert.alert('Offline Mode', 'Product management is disabled while offline');
      return;
    }
    
    Alert.alert(
      'Confirm Delete',
      `Are you sure you want to delete "${product.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await deleteProduct(product.id);
              await loadProducts();
              Alert.alert('Success', 'Product deleted successfully');
            } catch (error) {
              console.error('Error deleting product:', error);
              Alert.alert('Error', 'Failed to delete product');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const pickImage = async () => {
    if (isOffline) {
      Alert.alert('Offline Mode', 'Image upload is disabled while offline');
      return;
    }
    
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (!permissionResult.granted) {
        Alert.alert('Permission Required', 'You need to allow access to your photos to upload an image.');
        return;
      }
      
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setFormData({ ...formData, imageUri: result.assets[0].uri });
        setImageFile(result.assets[0]);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  // For updating products:
const handleSubmit = async () => {
  if (isOffline) {
    Alert.alert('Offline Mode', 'You cannot add or update products while offline.');
    return;
  }
  
  if (!formData.name || !formData.price || !formData.category || (!isEditing && !formData.imageUri)) {
    Alert.alert('Error', 'Please fill in all required fields and add an image');
    return;
  }

  const price = parseFloat(formData.price);
  if (isNaN(price) || price <= 0) {
    Alert.alert('Error', 'Please enter a valid price');
    return;
  }

  try {
    setLoading(true);
    setModalVisible(false);

    if (isEditing && selectedProduct) {
      // Create a proper ProductInput object
      const updatedProduct: Partial<ProductInput> = {
        name: formData.name,
        description: formData.description,
        price,
        category: formData.category as 'Knives' | 'Forks' | 'Spoons' | 'Sets',
        inStock: formData.inStock,
        featured: formData.featured,
      };
      
      // Add discount if it exists
      if (formData.discount && formData.discount.trim() !== '') {
        updatedProduct.discount = parseFloat(formData.discount);
      }

      await updateProduct(selectedProduct.id, updatedProduct, imageFile);
    } else {
      // Create a proper ProductInput object
      const newProduct: ProductInput = {
        name: formData.name,
        description: formData.description,
        price,
        category: formData.category as 'Knives' | 'Forks' | 'Spoons' | 'Sets',
        imageUrl: formData.imageUri,
        inStock: formData.inStock,
        featured: formData.featured,
      };
      
      // Add discount if it exists
      if (formData.discount && formData.discount.trim() !== '') {
        newProduct.discount = parseFloat(formData.discount);
      }

      await addProduct(newProduct, imageFile);
    }

    resetForm();
    await loadProducts();
    Alert.alert('Success', isEditing ? 'Product updated successfully' : 'Product added successfully');
  } catch (error) {
    console.error('Error saving product:', error);
    Alert.alert('Error', 'Failed to save product');
  } finally {
    setLoading(false);
  }
};

  if (loading) {
    return <Loading />;
  }

  return (
    <View style={styles.container}>
      {isOffline && (
        <View style={styles.offlineBanner}>
          <Ionicons name="cloud-offline-outline" size={20} color="white" />
          <Text style={styles.offlineText}>You're offline. Product management is disabled.</Text>
        </View>
      )}
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Products</Text>
        <TouchableOpacity 
          style={[styles.addButton, isOffline && styles.disabledButton]} 
          onPress={handleAddProduct}
          disabled={isOffline}
        >
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {products.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No products found</Text>
          <Button 
            title="Add Product" 
            onPress={handleAddProduct} 
            disabled={isOffline}
          />
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <Card style={styles.productCard}>
              <View style={styles.productContainer}>
                <Image 
                  source={{ uri: item.imageUrl || 'https://via.placeholder.com/80?text=No+Image' }} 
                  style={styles.productImage} 
                />
                <View style={styles.productInfo}>
                  <Text style={styles.productName}>{item.name}</Text>
                  <Text style={styles.productPrice}>KSh {item.price.toLocaleString()}</Text>
                  <Text style={styles.productCategory}>{item.category}</Text>
                  <Text style={[
                    styles.productStatus,
                    { color: item.inStock ? '#27ae60' : '#e74c3c' }
                  ]}>
                    {item.inStock ? 'In Stock' : 'Out of Stock'}
                  </Text>
                  {item.featured && (
                    <View style={styles.featuredBadge}>
                      <Text style={styles.featuredText}>Featured</Text>
                    </View>
                  )}
                </View>
                <View style={styles.productActions}>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleEditProduct(item)}
                    disabled={isOffline}
                  >
                    <Ionicons 
                      name="create-outline" 
                      size={22} 
                      color={isOffline ? "#bdc3c7" : "#3498db"} 
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleDeleteProduct(item)}
                    disabled={isOffline}
                  >
                    <Ionicons 
                      name="trash-outline" 
                      size={22} 
                      color={isOffline ? "#bdc3c7" : "#e74c3c"} 
                    />
                  </TouchableOpacity>
                </View>
              </View>
            </Card>
          )}
        />
      )}

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          setModalVisible(false);
          resetForm();
        }}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <ScrollView>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {isEditing ? 'Edit Product' : 'Add Product'}
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    setModalVisible(false);
                    resetForm();
                  }}
                >
                  <Ionicons name="close" size={24} color="#34495e" />
                </TouchableOpacity>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Name *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.name}
                  onChangeText={(value) => setFormData({ ...formData, name: value })}
                  placeholder="Product name"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Description</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={formData.description}
                  onChangeText={(value) => setFormData({ ...formData, description: value })}
                  placeholder="Product description"
                  multiline
                  numberOfLines={4}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Price (KSh) *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.price}
                  onChangeText={(value) => {
                    // Allow only numbers and one decimal point
                    const filtered = value.replace(/[^0-9.]/g, '');
                    // Ensure only one decimal point
                    const parts = filtered.split('.');
                    const newValue = parts.length > 2 
                      ? parts[0] + '.' + parts.slice(1).join('')
                      : filtered;
                    setFormData({ ...formData, price: newValue });
                  }}
                  placeholder="0.00"
                  keyboardType="decimal-pad"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Discount (%)</Text>
                <TextInput
                  style={styles.input}
                  value={formData.discount}
                  onChangeText={(value) => {
                    // Allow only numbers and one decimal point
                    const filtered = value.replace(/[^0-9.]/g, '');
                    // Ensure only one decimal point
                    const parts = filtered.split('.');
                    const newValue = parts.length > 2 
                      ? parts[0] + '.' + parts.slice(1).join('')
                      : filtered;
                    setFormData({ ...formData, discount: newValue });
                  }}
                  placeholder="0"
                  keyboardType="decimal-pad"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Category *</Text>
                <View style={styles.categoryButtons}>
                  {['Knives', 'Forks', 'Spoons', 'Sets'].map(category => (
                    <TouchableOpacity
                      key={category}
                      style={[
                        styles.categoryButton,
                        formData.category === category && styles.categoryButtonActive
                      ]}
                      onPress={() => setFormData({ ...formData, category })}
                    >
                      <Text
                        style={[
                          styles.categoryButtonText,
                          formData.category === category && styles.categoryButtonTextActive
                        ]}
                      >
                        {category}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.switchContainer}>
                <Text style={styles.label}>In Stock</Text>
                <Switch
                  value={formData.inStock}
                  onValueChange={(value) => setFormData({ ...formData, inStock: value })}
                  trackColor={{ false: '#d1d1d1', true: '#2ecc71' }}
                  thumbColor={formData.inStock ? '#fff' : '#f4f3f4'}
                />
              </View>

              <View style={styles.switchContainer}>
                <Text style={styles.label}>Featured Product</Text>
                <Switch
                  value={formData.featured}
                  onValueChange={(value) => setFormData({ ...formData, featured: value })}
                  trackColor={{ false: '#d1d1d1', true: '#3498db' }}
                  thumbColor={formData.featured ? '#fff' : '#f4f3f4'}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Product Image *</Text>
                <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
                  {formData.imageUri ? (
                    <Image source={{ uri: formData.imageUri }} style={styles.previewImage} />
                  ) : (
                    <View style={styles.imagePickerPlaceholder}>
                      <Ionicons name="image" size={40} color="#bdc3c7" />
                      <Text style={styles.imagePickerText}>Tap to select an image</Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>

              <View style={styles.buttonContainer}>
                <Button
                  title="Cancel"
                  type="secondary"
                  onPress={() => {
                    setModalVisible(false);
                    resetForm();
                  }}
                />
                <Button title="Save" onPress={handleSubmit} />
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
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
    justifyContent: 'space-between',
    alignItems: 'center',
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
  addButton: {
    backgroundColor: '#3498db',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#bdc3c7',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  emptyText: {
    fontSize: 16,
    color: '#7f8c8d',
    marginBottom: 16,
  },
  productCard: {
    marginHorizontal: 16,
    marginVertical: 8,
  },
  productContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 4,
  },
  productInfo: {
    flex: 1,
    marginLeft: 12,
  },
  productName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#34495e',
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 15,
    fontWeight: '600',
    color: '#3498db',
  },
  productCategory: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  productStatus: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 4,
  },
  featuredBadge: {
    backgroundColor: '#3498db',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginTop: 4,
    alignSelf: 'flex-start',
  },
  featuredText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  productActions: {
    flexDirection: 'row',
  },
  actionButton: {
    padding: 8,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginHorizontal: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e1e1',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#34495e',
  },
  formGroup: {
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  label: {
    fontSize: 14,
    marginBottom: 8,
    color: '#34495e',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  categoryButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  categoryButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    marginRight: 8,
    marginBottom: 8,
  },
  categoryButtonActive: {
    backgroundColor: '#3498db',
  },
  categoryButtonText: {
    fontSize: 14,
    color: '#34495e',
  },
  categoryButtonTextActive: {
    color: '#fff',
    fontWeight: 'bold',
  },
  imagePicker: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderStyle: 'dashed',
    borderRadius: 8,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  imagePickerPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePickerText: {
    color: '#7f8c8d',
    marginTop: 8,
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
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

export default Products;