// types/inventory.tsx
export interface InventoryItem {
    id: string;
    productId: string;
    quantity: number;
    location: string; // Location in the shop
    lastStockUpdate: Date;
  }