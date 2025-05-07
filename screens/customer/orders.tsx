import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  Modal,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import Card from '../../components/card';
import Loading from '../../components/loading';
import { getOrdersByUserId } from '../../services/orders';
import { Order, OrderStatus } from '../../types/order';
import { useAuth } from '../../context/authContext';

const OrderStatusColors = {
  pending: '#e67e22',
  processing: '#3498db',
  shipped: '#2ecc71',
  delivered: '#27ae60',
  cancelled: '#e74c3c',
};

const OrderStatusLabels = {
  pending: 'Pending',
  processing: 'Processing',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

const Orders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderDetailsVisible, setOrderDetailsVisible] = useState(false);
  const { currentUser } = useAuth(); // Ensure currentUser is obtained from useAuth context

  const loadOrders = async () => {
    if (!currentUser) return;

    try {
      setRefreshing(true);
      const ordersData = await getOrdersByUserId(currentUser.id);
      setOrders(ordersData);
    } catch (error) {
      console.error('Error loading orders:', error);
      Alert.alert('Error', 'Failed to load your orders');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [currentUser]);

  const handleViewOrderDetails = (order: Order) => {
    setSelectedOrder(order);
    setOrderDetailsVisible(true);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Orders</Text>
      </View>

      {orders.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="receipt-outline" size={80} color="#bdc3c7" />
          <Text style={styles.emptyText}>You don't have any orders yet</Text>
          <TouchableOpacity 
            style={styles.shopButton}
            onPress={() => navigation.navigate('Products' as never)}
          >
            <Text style={styles.shopButtonText}>Start Shopping</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <Card style={styles.orderCard}>
              <TouchableOpacity onPress={() => handleViewOrderDetails(item)}>
                <View style={styles.orderHeader}>
                  <Text style={styles.orderId}>Order #{item.id.substring(0, 8)}</Text>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: OrderStatusColors[item.status] },
                    ]}
                  >
                    <Text style={styles.statusText}>{OrderStatusLabels[item.status]}</Text>
                  </View>
                </View>
                
                <View style={styles.orderDate}>
                  <Ionicons name="calendar-outline" size={16} color="#7f8c8d" style={styles.orderDateIcon} />
                  <Text style={styles.orderDateText}>{formatDate(item.createdAt)}</Text>
                </View>
                
                <View style={styles.orderItems}>
                  <Text style={styles.orderItemsText}>
                    {item.items.length} {item.items.length === 1 ? 'item' : 'items'}
                  </Text>
                  <Text style={styles.orderTotal}>${item.totalAmount.toFixed(2)}</Text>
                </View>
                
                {item.collectionDate && (
                  <View style={styles.collectionInfo}>
                    <Ionicons name="location-outline" size={16} color="#3498db" style={styles.collectionIcon} />
                    <Text style={styles.collectionText}>
                      Collection: {formatDate(item.collectionDate)}, {item.collectionTime}
                    </Text>
                  </View>
                )}
                
                <View style={styles.viewDetails}>
                  <Text style={styles.viewDetailsText}>View Details</Text>
                  <Ionicons name="chevron-forward" size={16} color="#3498db" />
                </View>
              </TouchableOpacity>
            </Card>
          )}
          refreshing={refreshing}
          onRefresh={loadOrders}
          contentContainerStyle={styles.listContent}
        />
      )}

      {/* Order Details Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={orderDetailsVisible}
        onRequestClose={() => {
          setOrderDetailsVisible(false);
          setSelectedOrder(null);
        }}
      >
        {selectedOrder && (
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Order Details</Text>
                <TouchableOpacity
                  onPress={() => {
                    setOrderDetailsVisible(false);
                    setSelectedOrder(null);
                  }}
                >
                  <Ionicons name="close" size={24} color="#34495e" />
                </TouchableOpacity>
              </View>
              
              <ScrollView style={styles.modalScrollView}>
                <View style={styles.orderDetailSection}>
                  <View style={styles.orderStatusContainer}>
                    <View
                      style={[
                        styles.statusBadgeLarge,
                        { backgroundColor: OrderStatusColors[selectedOrder.status] },
                      ]}
                    >
                      <Text style={styles.statusTextLarge}>{OrderStatusLabels[selectedOrder.status]}</Text>
                    </View>
                  </View>
                  
                  <View style={styles.orderDetailRow}>
                    <Text style={styles.orderDetailLabel}>Order ID:</Text>
                    <Text style={styles.orderDetailValue}>#{selectedOrder.id.substring(0, 8)}</Text>
                  </View>
                  
                  <View style={styles.orderDetailRow}>
                    <Text style={styles.orderDetailLabel}>Date:</Text>
                    <Text style={styles.orderDetailValue}>{formatDate(selectedOrder.createdAt)}</Text>
                  </View>
                  
                  {selectedOrder.collectionDate && (
                    <>
                      <View style={styles.orderDetailRow}>
                        <Text style={styles.orderDetailLabel}>Collection Date:</Text>
                        <Text style={styles.orderDetailValue}>{formatDate(selectedOrder.collectionDate)}</Text>
                      </View>
                      
                      <View style={styles.orderDetailRow}>
                        <Text style={styles.orderDetailLabel}>Collection Time:</Text>
                        <Text style={styles.orderDetailValue}>{selectedOrder.collectionTime}</Text>
                      </View>
                    </>
                  )}
                </View>
                
                <View style={styles.itemsSection}>
                  <Text style={styles.sectionTitle}>Items</Text>
                  {selectedOrder.items.map((item, index) => (
                    <View key={index} style={styles.orderItem}>
                      <View style={styles.orderItemInfo}>
                        <Text style={styles.orderItemName}>{item.productName}</Text>
                        <Text style={styles.orderItemPrice}>${item.price.toFixed(2)} x {item.quantity}</Text>
                      </View>
                      <Text style={styles.orderItemTotal}>${(item.price * item.quantity).toFixed(2)}</Text>
                    </View>
                  ))}
                  
                  <View style={styles.totalContainer}>
                    <Text style={styles.totalLabel}>Order Total</Text>
                    <Text style={styles.totalValue}>${selectedOrder.totalAmount.toFixed(2)}</Text>
                  </View>
                </View>
                
                <View style={styles.storeInfoSection}>
                  <Text style={styles.sectionTitle}>Collection Information</Text>
                  <Text style={styles.storeInfoText}>
                    Please collect your order from our store located at:
                  </Text>
                  <Text style={styles.storeAddress}>123 Main Street, Town Center</Text>
                  <Text style={styles.storeInfoText}>
                    Our store is open Monday to Saturday, 9 AM to 6 PM.
                  </Text>
                  <Text style={styles.storeSupportText}>
                    For any questions regarding your order, please contact us at support@cutleryshop.com
                  </Text>
                </View>
              </ScrollView>
            </View>
          </View>
        )}
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyText: {
    fontSize: 18,
    color: '#7f8c8d',
    marginVertical: 16,
    textAlign: 'center',
  },
  shopButton: {
    backgroundColor: '#3498db',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  shopButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  listContent: {
    padding: 16,
  },
  orderCard: {
    marginBottom: 16,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  orderId: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#34495e',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
  },
  orderDate: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  orderDateIcon: {
    marginRight: 4,
  },
  orderDateText: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  orderItems: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  orderItemsText: {
    fontSize: 14,
    color: '#34495e',
  },
  orderTotal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#3498db',
  },
  collectionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  collectionIcon: {
    marginRight: 4,
  },
  collectionText: {
    fontSize: 14,
    color: '#3498db',
  },
  viewDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  viewDetailsText: {
    fontSize: 14,
    color: '#3498db',
    marginRight: 4,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 8,
    margin: 16,
    maxHeight: '90%',
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
  modalScrollView: {
    flex: 1,
  },
  orderDetailSection: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e1e1',
  },
  orderStatusContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  statusBadgeLarge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  statusTextLarge: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  orderDetailRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  orderDetailLabel: {
    width: 120,
    fontSize: 14,
    color: '#7f8c8d',
  },
  orderDetailValue: {
    fontSize: 14,
    color: '#34495e',
    fontWeight: '500',
    flex: 1,
  },
  itemsSection: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e1e1',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#34495e',
    marginBottom: 12,
  },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#ecf0f1',
  },
  orderItemInfo: {
    flex: 1,
  },
  orderItemName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#34495e',
    marginBottom: 4,
  },
  orderItemPrice: {
    fontSize: 12,
    color: '#7f8c8d',
  },
  orderItemTotal: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#34495e',
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e1e1e1',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#34495e',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#3498db',
  },
  storeInfoSection: {
    padding: 16,
  },
  storeInfoText: {
    fontSize: 14,
    color: '#34495e',
    marginBottom: 8,
  },
  storeAddress: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#3498db',
    marginBottom: 8,
  },
  storeSupportText: {
    fontSize: 13,
    color: '#7f8c8d',
    marginTop: 8,
    fontStyle: 'italic',
  },
});

export default Orders;