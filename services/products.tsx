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
  orderBy,
  limit,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { Product } from '../types/product';

const PRODUCTS_COLLECTION = 'products';

// Get all products
export const getAllProducts = async (): Promise<Product[]> => {
  try {
    const productsRef = collection(db, PRODUCTS_COLLECTION);
    const productsSnapshot = await getDocs(productsRef);
    
    return productsSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as Product;
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    throw error;
  }
};

// Get products by category
export const getProductsByCategory = async (category: string): Promise<Product[]> => {
  try {
    const productsRef = collection(db, PRODUCTS_COLLECTION);
    const q = query(productsRef, where('category', '==', category));
    const productsSnapshot = await getDocs(q);
    
    return productsSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as Product;
    });
  } catch (error) {
    console.error('Error fetching products by category:', error);
    throw error;
  }
};

// Get product by ID
export const getProductById = async (productId: string): Promise<Product | null> => {
  try {
    const productRef = doc(db, PRODUCTS_COLLECTION, productId);
    const productDoc = await getDoc(productRef);
    
    if (productDoc.exists()) {
      const data = productDoc.data();
      return {
        id: productDoc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as Product;
    } else {
      return null;
    }
  } catch (error) {
    console.error('Error fetching product:', error);
    throw error;
  }
};

// Add new product with image URL
export const addProduct = async (
  product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>,
  imageUrl: string
): Promise<string> => {
  try {
    // Add the product to Firestore
    const now = new Date();
    const productData = {
      ...product,
      imageUrl, // Use the provided image URL
      createdAt: Timestamp.fromDate(now),
      updatedAt: Timestamp.fromDate(now),
    };
    
    const docRef = await addDoc(collection(db, PRODUCTS_COLLECTION), productData);
    return docRef.id;
  } catch (error) {
    console.error('Error adding product:', error);
    throw error;
  }
};

// Update product
export const updateProduct = async (
  productId: string,
  updates: Partial<Omit<Product, 'id' | 'createdAt' | 'updatedAt'>>,
): Promise<void> => {
  try {
    const productRef = doc(db, PRODUCTS_COLLECTION, productId);
    
    // Update the product in Firestore
    await updateDoc(productRef, {
      ...updates,
      updatedAt: Timestamp.fromDate(new Date()),
    });
  } catch (error) {
    console.error('Error updating product:', error);
    throw error;
  }
};

// Delete product
export const deleteProduct = async (productId: string): Promise<void> => {
  try {
    // Delete the product document
    const productRef = doc(db, PRODUCTS_COLLECTION, productId);
    await deleteDoc(productRef);
  } catch (error) {
    console.error('Error deleting product:', error);
    throw error;
  }
};

// Get featured products (for customer home page)
export const getFeaturedProducts = async (count: number = 6): Promise<Product[]> => {
  try {
    const productsRef = collection(db, PRODUCTS_COLLECTION);
    const q = query(
      productsRef,
      where('inStock', '==', true),
      orderBy('createdAt', 'desc'),
      limit(count)
    );
    
    const productsSnapshot = await getDocs(q);
    
    return productsSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as Product;
    });
  } catch (error) {
    console.error('Error fetching featured products:', error);
    throw error;
  }
};