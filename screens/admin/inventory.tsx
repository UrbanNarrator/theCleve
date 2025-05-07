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
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Card from '../../components/card';
import Button from '../../components/button';
import Loading from '../../components/loading';
import { getAllInventoryItems, getInventoryByProductId, addInventoryItem, updateInventoryQuantity, updateInventoryLocation, deleteInventoryItem } from '../../services/inventory';
import { getAllProducts, getProductById } from '../../services/products';
import { InventoryItem } from '../../types/inventory';
import { Product } from '../../types/product';

const Inventory: React.FC = () => {
  const [inventoryItems, setInventoryItems] = useState<(InventoryItem & { productName: string })[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [formData, setFormData] = useState({
    productId: '',
    quantity: '',
    location: '',
  });
  const [availableProducts, setAvailableProducts] = useState<Product[]>([]);
  const [productModalVisible, setProductModalVisible] = useState(false);

  const loadInventoryData = async () => {
    try {
      setRefreshing(true);
      
      // Fetch all products and inventory items
      const [productsData, inventoryData] = await Promise.all([
        getAllProducts(),
        getAllInventoryItems(),
      ]);
      
      setProducts(productsData);
      
      // Add product names to inventory items
      const itemsWithProductNames = await Promise.all(
        inventoryData.map(async (item) => {
          const product = productsData.find(p => p.id === item.productId);
          return {
            ...item,
            productName: product ? product.name : 'Unknown Product',
          };
        })
      );
      
      setInventoryItems(itemsWithProductNames);
    } catch (error) {
      console.error('Error loading inventory data:', error);
      Alert.alert('Error', 'Failed to load inventory data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadInventoryData();
  }, []);

  const resetForm = () => {
    setFormData({
      productId: '',
      quantity: '',
      location: '',
    });
    setSelectedItem(null);
    setIsEditing(false);
  };

  const handleAddInventory = () => {
    // Filter out products that already have inventory items
    const productsWithoutInventory = products.filter(
      product => !inventoryItems.some(item => item.productId === product.id)
    );
    
    setAvailableProducts(productsWithoutInventory);
    
    if (productsWithoutInventory.length === 0) {
      Alert.alert(
        'No Products Available',
        'All products already have inventory entries. Please add new products first.'
      );
      return;
    }
    
    resetForm();
    setModalVisible(true);
  };

  const handleEditInventory = (item: InventoryItem & { productName: string }) => {
    setIsEditing(true);
    setSelectedItem(item);
    setFormData({
      productId: item.productId,
      quantity: item.quantity.toString(),
      location: item.location,
    });
    setModalVisible(true);
  };

  const handleDeleteInventory = (item: InventoryItem & { productName: string }) => {
    Alert.alert(
      'Confirm Delete',
      `Are you sure you want to delete inventory for "${item.productName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await deleteInventoryItem(item.id);
              await loadInventoryData();
              Alert.alert('Success', 'Inventory item deleted successfully');
            } catch (error) {
              console.error('Error deleting inventory item:', error);
              Alert.alert('Error', 'Failed to delete inventory item');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleSelectProduct = (product: Product) => {
    setFormData({ ...formData, productId: product.id });
    setProductModalVisible(false);
  };

  const handleSubmit = async () => {
    if (!formData.productId || !formData.quantity || !formData.location) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    const quantity = parseInt(formData.quantity);
    if (isNaN(quantity) || quantity < 0) {
      Alert.alert('Error', 'Please enter a valid quantity');
      return;
    }

    try {
      setLoading(true);
      setModalVisible(false);

      if (isEditing && selectedItem) {
        // Update existing inventory
        await updateInventoryQuantity(selectedItem.id, quantity);
        await updateInventoryLocation(selectedItem.id, formData.location);
      } else {
        // Add new inventory
        await addInventoryItem({
          productId: formData.productId,
          quantity,
          location: formData.location,
        });
      }

      resetForm();
      await loadInventoryData();
      Alert.alert('Success', isEditing ? 'Inventory updated successfully' : 'Inventory added successfully');
    } catch (error) {
      console.error('Error saving inventory:', error);
      Alert.alert('Error', 'Failed to save inventory');
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
        <Text style={styles.headerTitle}>Inventory Management</Text>
        <TouchableOpacity style={styles.addButton} onPress={handleAddInventory}>
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {inventoryItems.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No inventory items found</Text>
          <Button title="Add Inventory" onPress={handleAddInventory} />
        </View>
      ) : (
        <FlatList
          data={inventoryItems}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <Card style={styles.inventoryCard}>
              <View style={styles.inventoryContainer}>
                <View style={styles.inventoryInfo}>
                  <Text style={styles.productName}>{item.productName}</Text>
                  <Text style={styles.inventoryLocation}>Location: {item.location}</Text>
                  <View style={styles.quantityContainer}>
                    <Text style={styles.quantityLabel}>Quantity:</Text>
                    <Text
                      style={[
                        styles.quantityValue,
                        {
                          color:
                            item.quantity === 0
                              ? '#e74c3c'
                              : item.quantity <= 5
                              ? '#e67e22'
                              : '#27ae60',
                        },
                      ]}
                    >
                      {item.quantity}
                    </Text>
                  </View>
                  <Text style={styles.lastUpdated}>
                    Last Updated: {item.lastStockUpdate.toLocaleDateString()}
                  </Text>
                </View>
                <View style={styles.inventoryActions}>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleEditInventory(item)}
                  >
                    <Ionicons name="create-outline" size={22} color="#3498db" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleDeleteInventory(item)}
                  >
                    <Ionicons name="trash-outline" size={22} color="#e74c3c" />
                  </TouchableOpacity>
                </View>
              </View>
            </Card>
          )}
          refreshing={refreshing}
          onRefresh={loadInventoryData}
        />
      )}

      {/* Add/Edit Inventory Modal */}
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
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {isEditing ? 'Edit Inventory' : 'Add Inventory'}
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
              <Text style={styles.label}>Product</Text>
              {isEditing ? (
                <Text style={styles.productNameDisplay}>
                  {products.find(p => p.id === formData.productId)?.name || 'Unknown Product'}
                </Text>
              ) : (
                <TouchableOpacity
                  style={styles.productSelector}
                  onPress={() => setProductModalVisible(true)}
                >
                  <Text style={formData.productId ? styles.productNameDisplay : styles.productPlaceholder}>
                    {formData.productId
                      ? products.find(p => p.id === formData.productId)?.name
                      : 'Select a product'}
                  </Text>
                  <Ionicons name="chevron-down" size={20} color="#7f8c8d" />
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Quantity</Text>
              <TextInput
                style={styles.input}
                value={formData.quantity}
                onChangeText={(value) => setFormData({ ...formData, quantity: value })}
                placeholder="Enter quantity"
                keyboardType="number-pad"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Location</Text>
              <TextInput
                style={styles.input}
                value={formData.location}
                onChangeText={(value) => setFormData({ ...formData, location: value })}
                placeholder="Shelf or storage location in shop"
              />
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
          </View>
        </View>
      </Modal>

      {/* Product Selection Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={productModalVisible}
        onRequestClose={() => setProductModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Product</Text>
              <TouchableOpacity onPress={() => setProductModalVisible(false)}>
                <Ionicons name="close" size={24} color="#34495e" />
              </TouchableOpacity>
            </View>

            <FlatList
              data={availableProducts}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.productItem}
                  onPress={() => handleSelectProduct(item)}
                >
                  <Text style={styles.productItemName}>{item.name}</Text>
                  <Text style={styles.productItemPrice}>${item.price.toFixed(2)}</Text>
                </TouchableOpacity>
              )}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
              ListEmptyComponent={() => (
                <Text style={styles.emptyText}>No available products</Text>
              )}
            />
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
    textAlign: 'center',
    padding: 16,
  },
  inventoryCard: {
    marginHorizontal: 16,
    marginVertical: 8,
  },
  inventoryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  inventoryInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#34495e',
    marginBottom: 4,
  },
  inventoryLocation: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 4,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  quantityLabel: {
    fontSize: 14,
    color: '#34495e',
    marginRight: 4,
  },
  quantityValue: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  lastUpdated: {
    fontSize: 12,
    color: '#95a5a6',
  },
  inventoryActions: {
    flexDirection: 'column',
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
    paddingTop: 8,
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
  productSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  productNameDisplay: {
    fontSize: 16,
    color: '#34495e',
  },
  productPlaceholder: {
    fontSize: 16,
    color: '#95a5a6',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  productItem: {
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  productItemName: {
    fontSize: 16,
    color: '#34495e',
  },
  productItemPrice: {
    fontSize: 14,
    color: '#3498db',
    fontWeight: '600',
  },
  separator: {
    height: 1,
    backgroundColor: '#e1e1e1',
  },
});

export default Inventory;