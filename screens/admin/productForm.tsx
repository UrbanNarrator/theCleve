import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
  Image,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { addProduct, getProductById, updateProduct } from '../../services/products';
import { Product, ProductInput } from '../../types/product';
import Button from '../../components/button';
import Card from '../../components/card';
import { useAuth } from '../../context/authContext';

type ParamList = {
  ProductForm: {
    productId?: string;
  };
};

const ProductForm: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<ParamList, 'ProductForm'>>();
  const { isOffline } = useAuth();
  const { productId } = route.params || {};
  const isEditMode = !!productId;

  const [product, setProduct] = useState<ProductInput>({
    name: '',
    description: '',
    price: 0,
    imageUrl: '',
    category: 'Knives',
    featured: false,
    inStock: true,
  });

  const [imageFile, setImageFile] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEditMode);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadProduct = async () => {
      if (isEditMode && productId) {
        try {
          const existingProduct = await getProductById(productId);
          if (existingProduct) {
            setProduct({
              id: existingProduct.id,
              name: existingProduct.name,
              description: existingProduct.description,
              price: existingProduct.price,
              imageUrl: existingProduct.imageUrl,
              category: existingProduct.category,
              featured: existingProduct.featured || false,
              inStock: existingProduct.inStock,
              discount: existingProduct.discount,
            });
          }
        } catch (error) {
          console.error('Error loading product:', error);
          setError('Failed to load product details');
        } finally {
          setInitialLoading(false);
        }
      } else {
        setInitialLoading(false);
      }
    };

    loadProduct();
  }, [productId]);

  const handleImagePick = async () => {
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
        const selectedImage = result.assets[0];
        setImageFile(selectedImage);
        setProduct({ ...product, imageUrl: selectedImage.uri });
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const validateForm = () => {
    if (!product.name.trim()) {
      setError('Product name is required');
      return false;
    }
    
    if (!product.description.trim()) {
      setError('Product description is required');
      return false;
    }
    
    if (!product.price || product.price <= 0) {
      setError('Product price must be greater than 0');
      return false;
    }
    
    if (!isEditMode && !product.imageUrl && !imageFile) {
      setError('Product image is required');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    if (isOffline) {
      Alert.alert(
        'Offline Mode',
        'You cannot add or update products while offline. Please connect to the internet and try again.',
        [{ text: 'OK' }]
      );
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      if (isEditMode && product.id) {
        // Update existing product
        await updateProduct(product.id, product, imageFile);
        Alert.alert('Success', 'Product updated successfully');
      } else {
        // Add new product
        await addProduct(product, imageFile);
        Alert.alert('Success', 'Product added successfully');
      }
      
      navigation.goBack();
    } catch (error) {
      console.error('Error saving product:', error);
      setError('Failed to save product. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <View style={styles.centeredContainer}>
        <ActivityIndicator size="large" color="#3498db" />
        <Text style={styles.loadingText}>Loading product details...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {isOffline && (
        <View style={styles.offlineBanner}>
          <Ionicons name="cloud-offline-outline" size={20} color="white" />
          <Text style={styles.offlineText}>
            You're offline. Product management is disabled.
          </Text>
        </View>
      )}
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          {isEditMode ? 'Edit Product' : 'Add New Product'}
        </Text>
      </View>

      <Card style={styles.formCard}>
        {error && (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle-outline" size={20} color="#e74c3c" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <View style={styles.formGroup}>
          <Text style={styles.label}>Product Name *</Text>
          <TextInput
            style={styles.input}
            value={product.name}
            onChangeText={(value) => {
              setProduct({ ...product, name: value });
              setError(null);
            }}
            placeholder="Enter product name"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Description *</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={product.description}
            onChangeText={(value) => {
              setProduct({ ...product, description: value });
              setError(null);
            }}
            placeholder="Enter product description"
            multiline
            numberOfLines={5}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Price (KSh) *</Text>
          <TextInput
            style={styles.input}
            value={product.price?.toString() || ''}
            onChangeText={(value) => {
              const numValue = parseFloat(value.replace(/[^0-9.]/g, '')) || 0;
              setProduct({ ...product, price: numValue });
              setError(null);
            }}
            placeholder="Enter price in KSh"
            keyboardType="numeric"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Discount (%)</Text>
          <TextInput
            style={styles.input}
            value={product.discount?.toString() || ''}
            onChangeText={(value) => {
              const numValue = parseFloat(value.replace(/[^0-9.]/g, '')) || 0;
              setProduct({ ...product, discount: numValue > 100 ? 100 : numValue });
            }}
            placeholder="Enter discount percentage (optional)"
            keyboardType="numeric"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Category *</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={product.category}
              onValueChange={(value) => setProduct({ ...product, category: value })}
              style={styles.picker}
            >
              <Picker.Item label="Knives" value="Knives" />
              <Picker.Item label="Forks" value="Forks" />
              <Picker.Item label="Spoons" value="Spoons" />
              <Picker.Item label="Sets" value="Sets" />
            </Picker>
          </View>
        </View>

        <View style={styles.switchContainer}>
          <Text style={styles.label}>Featured Product</Text>
          <Switch
            value={product.featured || false}
            onValueChange={(value) => setProduct({ ...product, featured: value })}
            trackColor={{ false: '#d1d1d1', true: '#3498db' }}
            thumbColor={product.featured ? '#fff' : '#f4f3f4'}
          />
        </View>

        <View style={styles.switchContainer}>
          <Text style={styles.label}>In Stock</Text>
          <Switch
            value={product.inStock}
            onValueChange={(value) => setProduct({ ...product, inStock: value })}
            trackColor={{ false: '#d1d1d1', true: '#2ecc71' }}
            thumbColor={product.inStock ? '#fff' : '#f4f3f4'}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Product Image *</Text>
          <TouchableOpacity
            style={styles.imagePickerButton}
            onPress={handleImagePick}
            disabled={isOffline}
          >
            <Ionicons name="camera-outline" size={24} color="#3498db" />
            <Text style={styles.imagePickerText}>
              {imageFile ? 'Change Image' : 'Select Image'}
            </Text>
          </TouchableOpacity>

          {(product.imageUrl || imageFile) && (
            <View style={styles.imagePreviewContainer}>
              <Image
                source={{ uri: imageFile ? imageFile.uri : product.imageUrl }}
                style={styles.imagePreview}
                resizeMode="cover"
              />
              <TouchableOpacity
                style={styles.removeImageButton}
                onPress={() => {
                  setImageFile(null);
                  setProduct({ ...product, imageUrl: '' });
                }}
                disabled={isOffline}
              >
                <Ionicons name="close-circle" size={24} color="#e74c3c" />
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={styles.cancelButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.saveButton, (loading || isOffline) && styles.disabledButton]}
            onPress={handleSubmit}
            disabled={loading || isOffline}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.saveButtonText}>
                {isEditMode ? 'Update Product' : 'Add Product'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
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
  formCard: {
    margin: 16,
    padding: 16,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fdedee',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#fbd2d5',
  },
  errorText: {
    color: '#e74c3c',
    marginLeft: 8,
    flex: 1,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#34495e',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e1e1e1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#e1e1e1',
    borderRadius: 8,
    backgroundColor: '#fff',
    overflow: 'hidden',
  },
  picker: {
    height: 50,
    width: '100%',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  imagePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f8ff',
    borderWidth: 1,
    borderColor: '#cde4ff',
    borderRadius: 8,
    padding: 12,
  },
  imagePickerText: {
    marginLeft: 8,
    color: '#3498db',
    fontWeight: '500',
  },
  imagePreviewContainer: {
    position: 'relative',
    marginTop: 12,
    alignItems: 'center',
  },
  imagePreview: {
    width: '100%',
    height: 200,
    borderRadius: 8,
  },
  removeImageButton: {
    position: 'absolute',
    top: -12,
    right: -12,
    backgroundColor: '#fff',
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
    elevation: 2,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#f1f2f6',
    paddingVertical: 12,
    borderRadius: 8,
    marginRight: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#34495e',
    fontWeight: 'bold',
  },
  saveButton: {
    flex: 2,
    backgroundColor: '#3498db',
    paddingVertical: 12,
    borderRadius: 8,
    marginLeft: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  disabledButton: {
    backgroundColor: '#95a5a6',
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

export default ProductForm;