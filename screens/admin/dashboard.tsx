import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Card from '../../components/card';
import Loading from '../../components/loading';
import { getRecentOrders, getOrdersByStatus } from '../../services/orders';
import { getAllProducts } from '../../services/products';
import { getLowStockItems } from '../../services/inventory';
import { Order } from '../../types/order';
import { Product } from '../../types/product';
import { InventoryItem } from '../../types/inventory';

const Dashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [pendingOrders, setPendingOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [lowStockItems, setLowStockItems] = useState<InventoryItem[]>([]);
  const [totalSales, setTotalSales] = useState(0);
  const [outOfStockCount, setOutOfStockCount] = useState(0);

  const loadDashboardData = async () => {
    try {
      // Fetch all required data
      const [ordersData, pendingOrdersData, productsData, lowStockData] = await Promise.all([
        getRecentOrders(5),
        getOrdersByStatus('pending'),
        getAllProducts(),
        getLowStockItems(),
      ]);

      setRecentOrders(ordersData);
      setPendingOrders(pendingOrdersData);
      setProducts(productsData);
      setLowStockItems(lowStockData);

      // Calculate total sales
      const total = ordersData.reduce((sum, order) => sum + order.totalAmount, 0);
      setTotalSales(total);

      // Calculate out of stock items
      const outOfStock = productsData.filter(product => !product.inStock).length;
      setOutOfStockCount(outOfStock);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
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
      <View style={styles.header}>
        <Text style={styles.title}>Dashboard</Text>
      </View>

      <View style={styles.statsContainer}>
        <Card style={styles.statCard}>
          <View style={styles.statContent}>
            <Ionicons name="cart" size={32} color="#3498db" />
            <Text style={styles.statLabel}>Recent Orders</Text>
            <Text style={styles.statValue}>{recentOrders.length}</Text>
          </View>
        </Card>

        <Card style={styles.statCard}>
          <View style={styles.statContent}>
            <Ionicons name="alert-circle" size={32} color="#e67e22" />
            <Text style={styles.statLabel}>Pending Orders</Text>
            <Text style={styles.statValue}>{pendingOrders.length}</Text>
          </View>
        </Card>

        <Card style={styles.statCard}>
          <View style={styles.statContent}>
            <Ionicons name="cash" size={32} color="#27ae60" />
            <Text style={styles.statLabel}>Total Sales</Text>
            <Text style={styles.statValue}>${totalSales.toFixed(2)}</Text>
          </View>
        </Card>

        <Card style={styles.statCard}>
          <View style={styles.statContent}>
            <Ionicons name="warning" size={32} color="#e74c3c" />
            <Text style={styles.statLabel}>Out of Stock</Text>
            <Text style={styles.statValue}>{outOfStockCount}</Text>
          </View>
        </Card>
      </View>

      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Recent Orders</Text>
        {recentOrders.length === 0 ? (
          <Card>
            <Text style={styles.emptyText}>No recent orders found</Text>
          </Card>
        ) : (
          recentOrders.map(order => (
            <Card key={order.id} style={styles.orderCard}>
              <View style={styles.orderHeader}>
                <Text style={styles.orderId}>Order #{order.id.substring(0, 8)}</Text>
                <Text
                  style={[
                    styles.orderStatus,
                    {
                      color:
                        order.status === 'delivered'
                          ? '#27ae60'
                          : order.status === 'cancelled'
                          ? '#e74c3c'
                          : '#e67e22',
                    },
                  ]}
                >
                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                </Text>
              </View>
              <View style={styles.orderDetails}>
                <Text>Items: {order.items.length}</Text>
                <Text style={styles.orderTotal}>Total: ${order.totalAmount.toFixed(2)}</Text>
              </View>
              <Text style={styles.orderDate}>
                {order.createdAt.toLocaleDateString()}
              </Text>
            </Card>
          ))
        )}
      </View>

      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Low Stock Items</Text>
        {lowStockItems.length === 0 ? (
          <Card>
            <Text style={styles.emptyText}>No low stock items found</Text>
          </Card>
        ) : (
          lowStockItems.map(item => (
            <Card key={item.id} style={styles.stockCard}>
              <View style={styles.stockContent}>
                <View>
                  <Text style={styles.stockName}>
                    Product ID: {item.productId.substring(0, 8)}
                  </Text>
                  <Text style={styles.stockLocation}>Location: {item.location}</Text>
                </View>
                <View style={styles.stockQuantity}>
                  <Text
                    style={[
                      styles.stockValue,
                      {
                        color: item.quantity === 0 ? '#e74c3c' : '#e67e22',
                      },
                    ]}
                  >
                    {item.quantity} in stock
                  </Text>
                </View>
              </View>
            </Card>
          ))
        )}
      </View>
    </ScrollView>
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
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#34495e',
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 8,
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    marginBottom: 16,
  },
  statContent: {
    alignItems: 'center',
    padding: 16,
  },
  statLabel: {
    fontSize: 14,
    color: '#7f8c8d',
    marginTop: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#34495e',
    marginTop: 4,
  },
  sectionContainer: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#34495e',
  },
  emptyText: {
    textAlign: 'center',
    color: '#7f8c8d',
    padding: 16,
  },
  orderCard: {
    marginBottom: 8,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  orderId: {
    fontWeight: 'bold',
    color: '#34495e',
  },
  orderStatus: {
    fontWeight: 'bold',
  },
  orderDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  orderTotal: {
    fontWeight: 'bold',
  },
  orderDate: {
    fontSize: 12,
    color: '#7f8c8d',
  },
  stockCard: {
    marginBottom: 8,
  },
  stockContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stockName: {
    fontWeight: 'bold',
    color: '#34495e',
    marginBottom: 4,
  },
  stockLocation: {
    fontSize: 12,
    color: '#7f8c8d',
  },
  stockQuantity: {
    alignItems: 'center',
  },
  stockValue: {
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default Dashboard;