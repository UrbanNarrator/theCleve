// types/product.tsx
export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  category: 'Knives' | 'Forks' | 'Spoons' | 'Sets';
  inStock: boolean;
  featured?: boolean;
  discount?: number; // Optional discount percentage
  ratings?: number; // Average rating (1-5)
  numReviews?: number; // Number of reviews
  createdAt: Date;
  updatedAt: Date;
}

export type ProductInput = Omit<Product, 'id' | 'createdAt' | 'updatedAt'> & {
  id?: string;
};