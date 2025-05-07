// types/user.tsx
export type UserRole = 'admin' | 'customer';

export interface User {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  address?: string;
  phone?: string;
  createdAt: Date;
}