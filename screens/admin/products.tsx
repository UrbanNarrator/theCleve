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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Card from '../../components/card';
import Button from '../../components/button';
import Loading from '../../components/loading';
import { getAllProducts, getProductById, addProduct, updateProduct, deleteProduct } from '../../services/products';
import { Product } from '../../types/product';
import * as ImagePicker from 'expo-image-picker';

const Products: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    imageUri: '',
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
      category: '',
      imageUri: '',
    });
    setImageFile(null);
    setSelectedProduct(null);
    setIsEditing(false);
  };

  const handleAddProduct = () => {
    resetForm();
    setModalVisible(true);
  };

  const handleEditProduct = (product: Product) => {
    setIsEditing(true);
    setSelectedProduct(product);
    setFormData({
      name: product.name,
      description: product.description,
      price: product.price.toString(),
      category: product.category,
      imageUri: product.imageUrl,
    });
    setModalVisible(true);
  };

  const handleDeleteProduct = (product: Product) => {
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
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setFormData({ ...formData, imageUri: result.assets[0].uri });
      
      // Convert URI to Blob for Firebase upload
      const response = await fetch(result.assets[0].uri);
      const blob = await response.blob();
      setImageFile(blob);
    }
  };

  const handleSubmit = async () => {
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
        const updatedProduct = {
          name: formData.name,
          description: formData.description,
          price,
          category: formData.category,
        };

        await updateProduct(selectedProduct.id, updatedProduct, imageFile);
      } else {
        const newProduct = {
          name: formData.name,
          description: formData.description,
          price,
          category: formData.category,
          imageUrl: formData.imageUri, // Add imageUrl property
          inStock: false, // Will be set true when inventory is added
        };

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
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Products</Text>
        <TouchableOpacity style={styles.addButton} onPress={handleAddProduct}>
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {products.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No products found</Text>
          <Button title="Add Product" onPress={handleAddProduct} />
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <Card style={styles.productCard}>
              <View style={styles.productContainer}>
                <Image source={{ uri: item.imageUrl }} style={styles.productImage} />
                <View style={styles.productInfo}>
                  <Text style={styles.productName}>{item.name}</Text>
                  <Text style={styles.productPrice}>${item.price.toFixed(2)}</Text>
                  <Text style={styles.productCategory}>{item.category}</Text>
                  <Text style={[
                    styles.productStatus,
                    { color: item.inStock ? '#27ae60' : '#e74c3c' }
                  ]}>
                    {item.inStock ? 'In Stock' : 'Out of Stock'}
                  </Text>
                </View>
                <View style={styles.productActions}>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleEditProduct(item)}
                  >
                    <Ionicons name="create-outline" size={22} color="#3498db" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleDeleteProduct(item)}
                  >
                    <Ionicons name="trash-outline" size={22} color="#e74c3c" />
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
                <Text style={styles.label}>Name</Text>
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
                <Text style={styles.label}>Price ($)</Text>
                <TextInput
                  style={styles.input}
                  value={formData.price}
                  onChangeText={(value) => setFormData({ ...formData, price: value })}
                  placeholder="0.00"
                  keyboardType="decimal-pad"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Category</Text>
                <TextInput
                  style={styles.input}
                  value={formData.category}
                  onChangeText={(value) => setFormData({ ...formData, category: value })}
                  placeholder="e.g. Knives, Forks, Spoons, Sets"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Product Image</Text>
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
});

export default Products;