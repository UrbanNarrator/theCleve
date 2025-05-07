import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Card from '../../components/card';
import Loading from '../../components/loading';
import { getAllOrders, getOrderById, updateOrderStatus } from '../../services/orders';
import { Order, OrderStatus } from '../../types/order';

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
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderDetailsVisible, setOrderDetailsVisible] = useState(false);
  const [statusUpdateLoading, setStatusUpdateLoading] = useState(false);
  
  // Filter states
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');

  const loadOrders = async () => {
    try {
      setRefreshing(true);
      const ordersData = await getAllOrders();
      setOrders(ordersData);
    } catch (error) {
      console.error('Error loading orders:', error);
      Alert.alert('Error', 'Failed to load orders');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const handleViewOrderDetails = (order: Order) => {
    setSelectedOrder(order);
    setOrderDetailsVisible(true);
  };

  const handleUpdateStatus = async (orderId: string, newStatus: OrderStatus) => {
    if (!selectedOrder) return;

    Alert.alert(
      'Update Order Status',
      `Are you sure you want to mark this order as ${OrderStatusLabels[newStatus]}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Update',
          onPress: async () => {
            try {
              setStatusUpdateLoading(true);
              await updateOrderStatus(orderId, newStatus);
              
              // Update the selected order in state
              setSelectedOrder(prev => 
                prev ? { ...prev, status: newStatus } : null
              );
              
              // Update the order in the orders list
              setOrders(prevOrders => 
                prevOrders.map(order => 
                  order.id === orderId ? { ...order, status: newStatus } : order
                )
              );
              
              Alert.alert('Success', 'Order status updated successfully');
            } catch (error) {
              console.error('Error updating order status:', error);
              Alert.alert('Error', 'Failed to update order status');
            } finally {
              setStatusUpdateLoading(false);
            }
          },
        },
      ]
    );
  };

  const getFilteredOrders = () => {
    if (statusFilter === 'all') {
      return orders;
    }
    return orders.filter(order => order.status === statusFilter);
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
        <Text style={styles.headerTitle}>Orders</Text>
      </View>
      
      <View style={styles.filterContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterContent}
        >
          <TouchableOpacity
            style={[
              styles.filterButton,
              statusFilter === 'all' && styles.activeFilterButton,
            ]}
            onPress={() => setStatusFilter('all')}
          >
            <Text
              style={[
                styles.filterButtonText,
                statusFilter === 'all' && styles.activeFilterText,
              ]}
            >
              All
            </Text>
          </TouchableOpacity>
          
          {Object.entries(OrderStatusLabels).map(([status, label]) => (
            <TouchableOpacity
              key={status}
              style={[
                styles.filterButton,
                statusFilter === status && styles.activeFilterButton,
                { borderColor: OrderStatusColors[status as OrderStatus] },
              ]}
              onPress={() => setStatusFilter(status as OrderStatus)}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  statusFilter === status && styles.activeFilterText,
                  { color: statusFilter === status ? '#fff' : OrderStatusColors[status as OrderStatus] },
                ]}
              >
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {getFilteredOrders().length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No orders found</Text>
        </View>
      ) : (
        <FlatList
          data={getFilteredOrders()}
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
                
                <View style={styles.orderInfo}>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Date:</Text>
                    <Text style={styles.infoValue}>{formatDate(item.createdAt)}</Text>
                  </View>
                  
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Items:</Text>
                    <Text style={styles.infoValue}>{item.items.length}</Text>
                  </View>
                  
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Total:</Text>
                    <Text style={styles.infoValue}>${item.totalAmount.toFixed(2)}</Text>
                  </View>
                  
                  {item.collectionDate && (
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Collection:</Text>
                      <Text style={styles.infoValue}>
                        {formatDate(item.collectionDate)} {item.collectionTime}
                      </Text>
                    </View>
                  )}
                </View>
                
                <View style={styles.viewDetails}>
                  <Text style={styles.viewDetailsText}>View Details</Text>
                  <Ionicons name="chevron-forward" size={16} color="#3498db" />
                </View>
              </TouchableOpacity>
            </Card>
          )}
          refreshing={refreshing}
          onRefresh={loadOrders}
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
              
              <ScrollView>
                <View style={styles.orderDetailSection}>
                  <Text style={styles.orderDetailTitle}>Order Information</Text>
                  <View style={styles.orderDetailRow}>
                    <Text style={styles.orderDetailLabel}>Order ID:</Text>
                    <Text style={styles.orderDetailValue}>#{selectedOrder.id.substring(0, 8)}</Text>
                  </View>
                  
                  <View style={styles.orderDetailRow}>
                    <Text style={styles.orderDetailLabel}>Date:</Text>
                    <Text style={styles.orderDetailValue}>{formatDate(selectedOrder.createdAt)}</Text>
                  </View>
                  
                  <View style={styles.orderDetailRow}>
                    <Text style={styles.orderDetailLabel}>Status:</Text>
                    <View
                      style={[
                        styles.statusBadgeSmall,
                        { backgroundColor: OrderStatusColors[selectedOrder.status] },
                      ]}
                    >
                      <Text style={styles.statusTextSmall}>{OrderStatusLabels[selectedOrder.status]}</Text>
                    </View>
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
                
                <View style={styles.orderDetailSection}>
                  <Text style={styles.orderDetailTitle}>Items</Text>
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
                
                <View style={styles.orderDetailSection}>
                  <Text style={styles.orderDetailTitle}>Update Status</Text>
                  <View style={styles.statusButtonsContainer}>
                    {statusUpdateLoading ? (
                      <ActivityIndicator size="small" color="#3498db" style={styles.statusLoader} />
                    ) : (
                      Object.entries(OrderStatusLabels).map(([status, label]) => {
                        // Skip the current status button and cancelled status if already delivered
                        if (
                          status === selectedOrder.status ||
                          (status === 'cancelled' && selectedOrder.status === 'delivered')
                        ) {
                          return null;
                        }
                        
                        return (
                          <TouchableOpacity
                            key={status}
                            style={[
                              styles.statusButton,
                              { backgroundColor: OrderStatusColors[status as OrderStatus] },
                            ]}
                            onPress={() => handleUpdateStatus(selectedOrder.id, status as OrderStatus)}
                          >
                            <Text style={styles.statusButtonText}>{label}</Text>
                          </TouchableOpacity>
                        );
                      })
                    )}
                  </View>
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
  filterContainer: {
    backgroundColor: '#fff',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e1e1',
  },
  filterContent: {
    paddingHorizontal: 16,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#bdc3c7',
  },
  activeFilterButton: {
    backgroundColor: '#3498db',
    borderColor: '#3498db',
  },
  filterButtonText: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  activeFilterText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#7f8c8d',
  },
  orderCard: {
    margin: 16,
    marginBottom: 8,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
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
  orderInfo: {
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  infoLabel: {
    width: 80,
    fontSize: 14,
    color: '#7f8c8d',
  },
  infoValue: {
    fontSize: 14,
    color: '#34495e',
    fontWeight: '500',
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
  orderDetailSection: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e1e1',
  },
  orderDetailTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#34495e',
    marginBottom: 12,
  },
  orderDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
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
  statusBadgeSmall: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusTextSmall: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
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
  statusButtonsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statusButton: {
    padding: 10,
    borderRadius: 4,
    marginBottom: 8,
    minWidth: '48%',
    alignItems: 'center',
  },
  statusButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  statusLoader: {
    padding: 10,
  },
});

export default Orders;