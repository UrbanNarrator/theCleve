// types/product.tsx
export interface Product {
    id: string;
    name: string;
    description: string;
    price: number;
    imageUrl: string;
    category: string;
    inStock: boolean;
    createdAt: Date;
    updatedAt: Date;
  }