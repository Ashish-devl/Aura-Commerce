export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'customer';
  wishlist: string[];
  createdAt: number;
  address?: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  category: string;
  subCategory: string;
  imageUrl: string;
  stock: number;
  createdAt: number;
  updatedAt: number;
}

export interface Order {
  id: string;
  userId: string;
  userEmail?: string;
  userName?: string;
  items: { productId: string; name: string; quantity: number; price: number }[];
  totalAmount: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  shippingAddress: string;
  paymentStatus: 'pending' | 'completed' | 'failed';
  createdAt: number;
}

export interface Review {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: number;
}
