import {
    collection,
    doc,
    getDocs,
    getDoc,
    addDoc,
    updateDoc,
    query,
    where,
    orderBy,
    Timestamp,
    limit,
  } from 'firebase/firestore';
  import { db } from '../firebaseConfig';
  import { Order, OrderItem, OrderStatus } from '../types/order';
  import { adjustInventoryAfterOrder } from './inventory';
  
  const ORDERS_COLLECTION = 'orders';
  
  // Create a new order
  export const createOrder = async (
    userId: string,
    items: OrderItem[],
    totalAmount: number,
    collectionDate?: Date,
    collectionTime?: string
  ): Promise<string> => {
    try {
      // Calculate the order total on the server side to prevent manipulation
      const calculatedTotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      
      // Verify that the provided total matches the calculated total (allow small differences for rounding)
      if (Math.abs(calculatedTotal - totalAmount) > 0.01) {
        throw new Error('Order total mismatch');
      }
      
      const now = new Date();
      const orderData: Omit<Order, 'id'> = {
        userId,
        items,
        totalAmount,
        status: 'pending',
        createdAt: now,
        updatedAt: now,
        collectionDate,
        collectionTime,
      };
      
      // Add the order to Firestore
      const docRef = await addDoc(
        collection(db, ORDERS_COLLECTION), 
        {
          ...orderData,
          createdAt: Timestamp.fromDate(now),
          updatedAt: Timestamp.fromDate(now),
          collectionDate: collectionDate ? Timestamp.fromDate(collectionDate) : null,
        }
      );
      
      // Adjust inventory quantities
      await adjustInventoryAfterOrder(items.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
      })));
      
      return docRef.id;
    } catch (error) {
      console.error('Error creating order:', error);
      throw error;
    }
  };
  
  // Get all orders (admin)
  export const getAllOrders = async (): Promise<Order[]> => {
    try {
      const ordersRef = collection(db, ORDERS_COLLECTION);
      const q = query(ordersRef, orderBy('createdAt', 'desc'));
      const ordersSnapshot = await getDocs(q);
      
      return ordersSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          collectionDate: data.collectionDate?.toDate() || undefined,
        } as Order;
      });
    } catch (error) {
      console.error('Error fetching all orders:', error);
      throw error;
    }
  };
  
  // Get orders by user ID (customer)
  export const getOrdersByUserId = async (userId: string): Promise<Order[]> => {
    try {
      const ordersRef = collection(db, ORDERS_COLLECTION);
      const q = query(
        ordersRef,
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      const ordersSnapshot = await getDocs(q);
      
      return ordersSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          collectionDate: data.collectionDate?.toDate() || undefined,
        } as Order;
      });
    } catch (error) {
      console.error('Error fetching user orders:', error);
      throw error;
    }
  };
  
  // Get order by ID
  export const getOrderById = async (orderId: string): Promise<Order | null> => {
    try {
      const orderRef = doc(db, ORDERS_COLLECTION, orderId);
      const orderDoc = await getDoc(orderRef);
      
      if (orderDoc.exists()) {
        const data = orderDoc.data();
        return {
          id: orderDoc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          collectionDate: data.collectionDate?.toDate() || undefined,
        } as Order;
      } else {
        return null;
      }
    } catch (error) {
      console.error('Error fetching order:', error);
      throw error;
    }
  };
  
  // Update order status
  export const updateOrderStatus = async (
    orderId: string,
    status: OrderStatus
  ): Promise<void> => {
    try {
      const orderRef = doc(db, ORDERS_COLLECTION, orderId);
      
      await updateDoc(orderRef, {
        status,
        updatedAt: Timestamp.fromDate(new Date()),
      });
    } catch (error) {
      console.error('Error updating order status:', error);
      throw error;
    }
  };
  
  // Update collection details
  export const updateOrderCollectionDetails = async (
    orderId: string,
    collectionDate: Date,
    collectionTime: string
  ): Promise<void> => {
    try {
      const orderRef = doc(db, ORDERS_COLLECTION, orderId);
      
      await updateDoc(orderRef, {
        collectionDate: Timestamp.fromDate(collectionDate),
        collectionTime,
        updatedAt: Timestamp.fromDate(new Date()),
      });
    } catch (error) {
      console.error('Error updating collection details:', error);
      throw error;
    }
  };
  
  // Get recent orders (for admin dashboard)
  export const getRecentOrders = async (limitCount: number = 10): Promise<Order[]> => {
      try {
        const ordersRef = collection(db, ORDERS_COLLECTION);
        const q = query(
          ordersRef,
          orderBy('createdAt', 'desc'),
          limit(limitCount)
        );
        const ordersSnapshot = await getDocs(q);
        
        return ordersSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date(),
            collectionDate: data.collectionDate?.toDate() || undefined,
          } as Order;
        });
      } catch (error) {
        console.error('Error fetching recent orders:', error);
        throw error;
      }
    };
  
  // Get orders by status
  export const getOrdersByStatus = async (status: OrderStatus): Promise<Order[]> => {
    try {
      const ordersRef = collection(db, ORDERS_COLLECTION);
      const q = query(
        ordersRef,
        where('status', '==', status),
        orderBy('createdAt', 'desc')
      );
      const ordersSnapshot = await getDocs(q);
      
      return ordersSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          collectionDate: data.collectionDate?.toDate() || undefined,
        } as Order;
      });
    } catch (error) {
      console.error('Error fetching orders by status:', error);
      throw error;
    }
  };