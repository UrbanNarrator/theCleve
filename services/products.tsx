// services/products.tsx
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
  serverTimestamp,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebaseConfig';
import { Product, ProductInput } from '../types/product';

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
    const q = query(
      productsRef, 
      where('category', '==', category),
      orderBy('createdAt', 'desc')
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

// Add product with image file
export const addProduct = async (product: ProductInput, imageFile?: File): Promise<string> => {
  try {
    let imageUrl = product.imageUrl;
    
    // Upload image if provided
    if (imageFile) {
      const storageRef = ref(storage, `products/${Date.now()}_${imageFile.name}`);
      const uploadResult = await uploadBytes(storageRef, imageFile);
      imageUrl = await getDownloadURL(uploadResult.ref);
    }
    
    // Add the product to Firestore
    const productData = {
      ...product,
      imageUrl,
      featured: product.featured || false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
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
  updates: Partial<ProductInput>,
  imageFile?: File
): Promise<void> => {
  try {
    let updateData = { ...updates };
    
    // Upload new image if provided
    if (imageFile) {
      const storageRef = ref(storage, `products/${Date.now()}_${imageFile.name}`);
      const uploadResult = await uploadBytes(storageRef, imageFile);
      updateData.imageUrl = await getDownloadURL(uploadResult.ref);
    }
    
    const productRef = doc(db, PRODUCTS_COLLECTION, productId);
    
    // Update the product in Firestore
    await updateDoc(productRef, {
      ...updateData,
      updatedAt: serverTimestamp(),
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
      where('featured', '==', true),
      orderBy('createdAt', 'desc'),
      limit(count)
    );
    
    const productsSnapshot = await getDocs(q);
    
    // If no featured products are found, get the most recent products
    if (productsSnapshot.empty) {
      const fallbackQuery = query(
        productsRef,
        where('inStock', '==', true),
        orderBy('createdAt', 'desc'),
        limit(count)
      );
      
      const fallbackSnapshot = await getDocs(fallbackQuery);
      
      return fallbackSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        } as Product;
      });
    }
    
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

// Add initial products (use this function to populate your database initially)
export const addInitialProducts = async (): Promise<void> => {
  try {
    const productsRef = collection(db, PRODUCTS_COLLECTION);
    const snapshot = await getDocs(productsRef);
    
    // Only add initial products if there are none
    if (snapshot.empty) {
      const initialProducts: ProductInput[] = [
        // Knives
        {
          name: 'Wooden Knife',
          description: 'Handcrafted wooden knife for serving and decorative purposes',
          price: 450,
          imageUrl: 'https://images.unsplash.com/photo-1588686591850-6b0661c3c813?q=80&w=500&auto=format&fit=crop', 
          category: 'Knives',
          featured: true,
          inStock: true,
        },
        {
          name: 'Butter Knife',
          description: 'Stainless steel butter knife with comfortable grip',
          price: 350,
          imageUrl: 'https://images.unsplash.com/photo-1594221708779-94832f4320ff?q=80&w=500&auto=format&fit=crop', 
          category: 'Knives',
          featured: false,
          inStock: true,
        },
        {
          name: 'Dinner Knife',
          description: 'Premium dinner knife for everyday use',
          price: 500,
          imageUrl: 'https://images.unsplash.com/photo-1577535637358-38d3ed37c73c?q=80&w=500&auto=format&fit=crop', 
          category: 'Knives',
          featured: true,
          inStock: true,
        },
        
        // Forks
        {
          name: 'Wooden Fork',
          description: 'Eco-friendly handcrafted wooden fork',
          price: 400,
          imageUrl: 'https://images.unsplash.com/photo-1589568075228-c92ae953e75a?q=80&w=500&auto=format&fit=crop', 
          category: 'Forks',
          featured: true,
          inStock: true,
        },
        {
          name: 'Dinner Fork',
          description: 'Classic stainless steel dinner fork',
          price: 450,
          imageUrl: 'https://images.unsplash.com/photo-1567306295827-25f7b709052f?q=80&w=500&auto=format&fit=crop', 
          category: 'Forks',
          featured: false,
          inStock: true,
        },
        {
          name: 'Salad Fork',
          description: 'Elegant fork designed specifically for salads',
          price: 400,
          imageUrl: 'https://images.unsplash.com/photo-1593646823000-f01b9af669ce?q=80&w=500&auto=format&fit=crop', 
          category: 'Forks',
          featured: true,
          inStock: true,
        },
        
        // Spoons
        {
          name: 'Wooden Spoon',
          description: 'Traditional hand-carved wooden spoon',
          price: 350,
          imageUrl: 'https://images.unsplash.com/photo-1603251578711-3290ca7f701f?q=80&w=500&auto=format&fit=crop', 
          category: 'Spoons',
          featured: true,
          inStock: true,
        },
        {
          name: 'Table Spoon',
          description: 'Large stainless steel spoon for serving',
          price: 400,
          imageUrl: 'https://images.unsplash.com/photo-1602597221790-a1ceadbc042c?q=80&w=500&auto=format&fit=crop', 
          category: 'Spoons',
          featured: false,
          inStock: true,
        },
        {
          name: 'Tea Spoon',
          description: 'Small spoon perfect for tea and coffee',
          price: 300,
          imageUrl: 'https://images.unsplash.com/photo-1595614007536-6e6a4a91de20?q=80&w=500&auto=format&fit=crop', 
          category: 'Spoons',
          featured: true,
          inStock: true,
        },
        {
          name: 'Soup Spoon',
          description: 'Deep bowl spoon ideal for soups',
          price: 450,
          imageUrl: 'https://images.unsplash.com/photo-1561631811-444f57d77f0f?q=80&w=500&auto=format&fit=crop',
          category: 'Spoons',
          featured: false,
          inStock: true,
        },
        
        // Sets
        {
          name: '3-set Cutlery',
          description: 'Basic set including knife, fork, and spoon',
          price: 1200,
          imageUrl: 'https://images.unsplash.com/photo-1562699919-89f1a8102a28?q=80&w=500&auto=format&fit=crop', 
          category: 'Sets',
          featured: true,
          inStock: true,
        },
        {
          name: '5-set Cutlery',
          description: 'Complete set with dinner fork, salad fork, knife, soup spoon, and teaspoon',
          price: 2500,
          imageUrl: 'https://images.unsplash.com/photo-1596466717909-50a0e9bb7e13?q=80&w=500&auto=format&fit=crop', 
          category: 'Sets',
          featured: true,
          inStock: true,
        },
        {
          name: '6-set Cutlery',
          description: 'Family set with 2 knives, 2 forks, and 2 spoons',
          price: 3000,
          imageUrl: 'https://images.unsplash.com/photo-1577130307236-a978bceea09f?q=80&w=500&auto=format&fit=crop', 
          category: 'Sets',
          featured: false,
          inStock: true,
        },
        {
          name: 'Serving Utensils Set',
          description: 'Complete set of serving utensils for special occasions',
          price: 4000,
          imageUrl: 'https://images.unsplash.com/photo-1592743263126-bb241ee76ac7?q=80&w=500&auto=format&fit=crop', 
          category: 'Sets',
          featured: true,
          inStock: true,
        },
      ];
      
      // Add each product
      for (const product of initialProducts) {
        await addDoc(collection(db, PRODUCTS_COLLECTION), {
          ...product,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
      
      console.log('Initial products added successfully!');
    } else {
      console.log('Products collection already contains data, skipping initialization.');
    }
  } catch (error) {
    console.error('Error adding initial products:', error);
    throw error;
  }
};