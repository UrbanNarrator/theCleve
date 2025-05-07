import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ScrollView,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import Card from '../../components/card';
import Button from '../../components/button';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useCart } from '../../context/cartContext';
import { useAuth } from '../../context/authContext';
import { createOrder } from '../../services/orders';

const Checkout: React.FC = () => {
  const navigation = useNavigation();
  const { cartItems, updateQuantity, removeFromCart, totalAmount, clearCart } = useCart();
  const { currentUser } = useAuth();
  
  const [collectionDate, setCollectionDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [collectionTime, setCollectionTime] = useState('');
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleQuantityChange = (productId: string, change: number) => {
    const item = cartItems.find(item => item.productId === productId);
    if (item) {
      const newQuantity = Math.max(1, item.quantity + change);
      updateQuantity(productId, newQuantity);
    }
  };

  const handleRemoveItem = (productId: string) => {
    Alert.alert(
      'Remove Item',
      'Are you sure you want to remove this item from your cart?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: () => removeFromCart(productId) },
      ]
    );
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setCollectionDate(selectedDate);
    }
  };

  const handleTimeChange = (event: any, selectedTime?: Date) => {
    setShowTimePicker(false);
    if (selectedTime) {
      const hours = selectedTime.getHours();
      const minutes = selectedTime.getMinutes();
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const formattedHours = hours % 12 || 12;
      const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;
      setCollectionTime(`${formattedHours}:${formattedMinutes} ${ampm}`);
    }
  };

  const validateOrder = () => {
    if (cartItems.length === 0) {
      Alert.alert('Empty Cart', 'Your cart is empty. Please add items before checkout.');
      return false;
    }

    if (!collectionDate) {
      Alert.alert('Missing Information', 'Please select a collection date.');
      return false;
    }

    if (!collectionTime) {
      Alert.alert('Missing Information', 'Please select a collection time.');
      return false;
    }

    // Validate collection date is in the future
    const now = new Date();
    if (collectionDate && collectionDate < now) {
      Alert.alert('Invalid Date', 'Collection date must be in the future.');
      return false;
    }

    return true;
  };

  const handlePlaceOrder = async () => {
    if (!validateOrder() || !currentUser || !collectionDate) {
      return;
    }

    setLoading(true);

    try {
      // Convert cart items to order items format
      const orderItems = cartItems.map(item => ({
        productId: item.productId,
        productName: item.productName,
        quantity: item.quantity,
        price: item.price,
      }));

      // Create a new order
      await createOrder(
        currentUser.id, 
        orderItems, 
        totalAmount, 
        collectionDate, 
        collectionTime
      );

      // Clear the cart after successful order
      clearCart();

      // Show success message
      Alert.alert(
        'Order Placed Successfully',
        'Your order has been placed. You can collect your items at the store on the specified date and time.',
        [
          {
            text: 'View My Orders',
            onPress: () => navigation.navigate('Orders' as never),
          },
          {
            text: 'Continue Shopping',
            onPress: () => navigation.navigate('Home' as never),
          },
        ]
      );
    } catch (error) {
      console.error('Error placing order:', error);
      Alert.alert('Error', 'Failed to place your order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Checkout</Text>
      </View>

      {cartItems.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="cart-outline" size={80} color="#bdc3c7" />
          <Text style={styles.emptyText}>Your cart is empty</Text>
          <Button
            title="Start Shopping"
            onPress={() => navigation.navigate('Products' as never)}
          />
        </View>
      ) : (
        <ScrollView>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Items</Text>
            {cartItems.map(item => (
              <Card key={item.productId} style={styles.cartItem}>
                <View style={styles.itemContainer}>
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemName}>{item.productName}</Text>
                    <Text style={styles.itemPrice}>${item.price.toFixed(2)}</Text>
                  </View>
                  <View style={styles.quantityContainer}>
                    <TouchableOpacity
                      style={styles.quantityButton}
                      onPress={() => handleQuantityChange(item.productId, -1)}
                    >
                      <Ionicons name="remove" size={18} color="#3498db" />
                    </TouchableOpacity>
                    <Text style={styles.quantityText}>{item.quantity}</Text>
                    <TouchableOpacity
                      style={styles.quantityButton}
                      onPress={() => handleQuantityChange(item.productId, 1)}
                    >
                      <Ionicons name="add" size={18} color="#3498db" />
                    </TouchableOpacity>
                  </View>
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => handleRemoveItem(item.productId)}
                  >
                    <Ionicons name="trash-outline" size={20} color="#e74c3c" />
                  </TouchableOpacity>
                </View>
                <Text style={styles.itemTotal}>
                  Item Total: ${(item.price * item.quantity).toFixed(2)}
                </Text>
              </Card>
            ))}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Collection Details</Text>
            <Card>
              <View style={styles.collectionInfo}>
                <Text style={styles.collectionLabel}>
                  Please specify when you would like to collect your order:
                </Text>
                <TouchableOpacity
                  style={styles.datePickerButton}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Text style={styles.datePickerText}>
                    {collectionDate
                      ? collectionDate.toLocaleDateString()
                      : 'Select Collection Date'}
                  </Text>
                  <Ionicons name="calendar" size={20} color="#3498db" />
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.datePickerButton}
                  onPress={() => setShowTimePicker(true)}
                >
                  <Text style={styles.datePickerText}>
                    {collectionTime ? collectionTime : 'Select Collection Time'}
                  </Text>
                  <Ionicons name="time" size={20} color="#3498db" />
                </TouchableOpacity>
                
                <Text style={styles.storeHours}>
                  Note: Store hours are Monday to Saturday, 9 AM to 6 PM
                </Text>
              </View>
            </Card>
            
            {showDatePicker && (
              <DateTimePicker
                value={collectionDate || new Date()}
                mode="date"
                display="default"
                onChange={handleDateChange}
                minimumDate={new Date()}
              />
            )}
            
            {showTimePicker && (
              <DateTimePicker
                value={new Date()}
                mode="time"
                display="default"
                onChange={handleTimeChange}
              />
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Order Summary</Text>
            <Card>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Items Total</Text>
                <Text style={styles.summaryValue}>${totalAmount.toFixed(2)}</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.summaryItem}>
                <Text style={styles.orderTotalLabel}>Order Total</Text>
                <Text style={styles.orderTotalValue}>${totalAmount.toFixed(2)}</Text>
              </View>
            </Card>
          </View>

          <View style={styles.placeOrderContainer}>
            <Button
              title={loading ? 'Processing...' : 'Place Order'}
              onPress={handlePlaceOrder}
              disabled={loading}
              loading={loading}
              fullWidth
            />
          </View>
        </ScrollView>
      )}
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
  },
  section: {
    marginBottom: 16,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#34495e',
    marginBottom: 8,
  },
  cartItem: {
    marginBottom: 8,
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#34495e',
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 14,
    color: '#3498db',
    fontWeight: 'bold',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 8,
  },
  quantityButton: {
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#3498db',
    borderRadius: 15,
  },
  quantityText: {
    fontSize: 16,
    marginHorizontal: 8,
    minWidth: 24,
    textAlign: 'center',
  },
  removeButton: {
    padding: 8,
  },
  itemTotal: {
    fontSize: 14,
    fontWeight: '500',
    color: '#34495e',
    marginTop: 8,
    textAlign: 'right',
  },
  collectionInfo: {
    padding: 8,
  },
  collectionLabel: {
    fontSize: 14,
    color: '#34495e',
    marginBottom: 16,
  },
  datePickerButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16,
  },
  datePickerText: {
    fontSize: 16,
    color: '#34495e',
  },
  storeHours: {
    fontSize: 12,
    color: '#7f8c8d',
    fontStyle: 'italic',
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#34495e',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#34495e',
  },
  divider: {
    height: 1,
    backgroundColor: '#e1e1e1',
    marginVertical: 8,
  },
  orderTotalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#34495e',
  },
  orderTotalValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#3498db',
  },
  placeOrderContainer: {
    padding: 16,
    paddingBottom: 32,
  },
});

export default Checkout;