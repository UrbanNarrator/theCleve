import {
    collection,
    doc,
    getDocs,
    getDoc,
    addDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    Timestamp,
    runTransaction,
  } from 'firebase/firestore';
  import { db } from '../firebaseConfig';
  import { InventoryItem } from '../types/inventory';
  
  const INVENTORY_COLLECTION = 'inventory';
  const PRODUCTS_COLLECTION = 'products';
  
  // Get all inventory items
  export const getAllInventoryItems = async (): Promise<InventoryItem[]> => {
    try {
      const inventoryRef = collection(db, INVENTORY_COLLECTION);
      const inventorySnapshot = await getDocs(inventoryRef);
      
      return inventorySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          lastStockUpdate: data.lastStockUpdate?.toDate() || new Date(),
        } as InventoryItem;
      });
    } catch (error) {
      console.error('Error fetching inventory items:', error);
      throw error;
    }
  };
  
  // Get inventory item by product ID
  export const getInventoryByProductId = async (productId: string): Promise<InventoryItem | null> => {
    try {
      const inventoryRef = collection(db, INVENTORY_COLLECTION);
      const q = query(inventoryRef, where('productId', '==', productId));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        return null;
      }
      
      const doc = querySnapshot.docs[0];
      const data = doc.data();
      
      return {
        id: doc.id,
        ...data,
        lastStockUpdate: data.lastStockUpdate?.toDate() || new Date(),
      } as InventoryItem;
    } catch (error) {
      console.error('Error fetching inventory item:', error);
      throw error;
    }
  };
  
  // Add inventory item
  export const addInventoryItem = async (
    inventoryItem: Omit<InventoryItem, 'id' | 'lastStockUpdate'>
  ): Promise<string> => {
    try {
      // Check if product exists
      const productRef = doc(db, PRODUCTS_COLLECTION, inventoryItem.productId);
      const productDoc = await getDoc(productRef);
      
      if (!productDoc.exists()) {
        throw new Error('Product does not exist');
      }
      
      // Check if inventory item already exists for this product
      const existingItem = await getInventoryByProductId(inventoryItem.productId);
      
      if (existingItem) {
        throw new Error('Inventory item already exists for this product');
      }
      
      // Add the inventory item
      const now = new Date();
      const itemData = {
        ...inventoryItem,
        lastStockUpdate: Timestamp.fromDate(now),
      };
      
      const docRef = await addDoc(collection(db, INVENTORY_COLLECTION), itemData);
      
      // Update the product's inStock status based on inventory quantity
      await updateDoc(productRef, {
        inStock: inventoryItem.quantity > 0,
        updatedAt: Timestamp.fromDate(now),
      });
      
      return docRef.id;
    } catch (error) {
      console.error('Error adding inventory item:', error);
      throw error;
    }
  };
  
  // Update inventory quantity
  export const updateInventoryQuantity = async (
    inventoryId: string,
    newQuantity: number
  ): Promise<void> => {
    try {
      await runTransaction(db, async (transaction) => {
        // Get the inventory item
        const inventoryRef = doc(db, INVENTORY_COLLECTION, inventoryId);
        const inventoryDoc = await transaction.get(inventoryRef);
        
        if (!inventoryDoc.exists()) {
          throw new Error('Inventory item does not exist');
        }
        
        const inventoryData = inventoryDoc.data();
        const productId = inventoryData.productId;
        
        // Update the inventory quantity
        transaction.update(inventoryRef, {
          quantity: newQuantity,
          lastStockUpdate: Timestamp.fromDate(new Date()),
        });
        
        // Update the product's inStock status
        const productRef = doc(db, PRODUCTS_COLLECTION, productId);
        transaction.update(productRef, {
          inStock: newQuantity > 0,
          updatedAt: Timestamp.fromDate(new Date()),
        });
      });
    } catch (error) {
      console.error('Error updating inventory quantity:', error);
      throw error;
    }
  };
  
  // Update inventory location
  export const updateInventoryLocation = async (
    inventoryId: string,
    newLocation: string
  ): Promise<void> => {
    try {
      const inventoryRef = doc(db, INVENTORY_COLLECTION, inventoryId);
      
      await updateDoc(inventoryRef, {
        location: newLocation,
        lastStockUpdate: Timestamp.fromDate(new Date()),
      });
    } catch (error) {
      console.error('Error updating inventory location:', error);
      throw error;
    }
  };
  
  // Delete inventory item
  export const deleteInventoryItem = async (inventoryId: string): Promise<void> => {
    try {
      await runTransaction(db, async (transaction) => {
        // Get the inventory item
        const inventoryRef = doc(db, INVENTORY_COLLECTION, inventoryId);
        const inventoryDoc = await transaction.get(inventoryRef);
        
        if (!inventoryDoc.exists()) {
          throw new Error('Inventory item does not exist');
        }
        
        const inventoryData = inventoryDoc.data();
        const productId = inventoryData.productId;
        
        // Delete the inventory item
        transaction.delete(inventoryRef);
        
        // Update the product's inStock status to false
        const productRef = doc(db, PRODUCTS_COLLECTION, productId);
        transaction.update(productRef, {
          inStock: false,
          updatedAt: Timestamp.fromDate(new Date()),
        });
      });
    } catch (error) {
      console.error('Error deleting inventory item:', error);
      throw error;
    }
  };
  
  // Check if product is in stock
  export const isProductInStock = async (productId: string): Promise<boolean> => {
    try {
      const inventoryItem = await getInventoryByProductId(productId);
      return inventoryItem !== null && inventoryItem.quantity > 0;
    } catch (error) {
      console.error('Error checking stock:', error);
      throw error;
    }
  };
  
  // Get low stock items (for admin dashboard alerts)
  export const getLowStockItems = async (threshold: number = 5): Promise<InventoryItem[]> => {
    try {
      const inventoryRef = collection(db, INVENTORY_COLLECTION);
      const querySnapshot = await getDocs(inventoryRef);
      
      const lowStockItems = querySnapshot.docs
        .map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            lastStockUpdate: data.lastStockUpdate?.toDate() || new Date(),
          } as InventoryItem;
        })
        .filter(item => item.quantity <= threshold);
      
      return lowStockItems;
    } catch (error) {
      console.error('Error fetching low stock items:', error);
      throw error;
    }
  };
  
  // Adjust inventory after order placement
  export const adjustInventoryAfterOrder = async (orderItems: { productId: string; quantity: number }[]): Promise<void> => {
    try {
      for (const item of orderItems) {
        const inventoryItem = await getInventoryByProductId(item.productId);
        
        if (!inventoryItem) {
          throw new Error(`No inventory found for product ID: ${item.productId}`);
        }
        
        if (inventoryItem.quantity < item.quantity) {
          throw new Error(`Insufficient stock for product ID: ${item.productId}`);
        }
        
        await updateInventoryQuantity(inventoryItem.id, inventoryItem.quantity - item.quantity);
      }
    } catch (error) {
      console.error('Error adjusting inventory after order:', error);
      throw error;
    }
  };