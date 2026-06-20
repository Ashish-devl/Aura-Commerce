export interface UserProfile {
  id: string; // Firebase Auth UID
  email: string;
  role: 'admin' | 'customer';
  wishlist: string[]; // array of productIds
  createdAt: number;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  category: string;
  imageUrl: string;
  stock: number;
  createdAt: number;
  updatedAt: number;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface Order {
  id: string;
  userId: string;
  items: { productId: string; name: string; quantity: number; price: number }[];
  totalAmount: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  shippingAddress: any; // simplified
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
