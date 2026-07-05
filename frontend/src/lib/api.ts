import { UserProfile, Product, Order, Review } from '../types';

const getHeaders = () => {
  const token = localStorage.getItem('aura_jwt_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
};

async function handleResponse<T>(response: Response): Promise<T> {
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Something went wrong');
  }
  return data as T;
}

export const api = {
  // Authentication
  async signup(name: string, email: string, pass: string, role: 'admin' | 'customer') {
    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password: pass, role })
    });
    return handleResponse<{ token: string; user: UserProfile }>(res);
  },

  async login(email: string, pass: string) {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: pass })
    });
    return handleResponse<{ token: string; user: UserProfile }>(res);
  },

  async getProfile() {
    const res = await fetch('/api/auth/profile', {
      method: 'GET',
      headers: getHeaders()
    });
    return handleResponse<UserProfile>(res);
  },

  async updateProfile(name?: string, address?: string) {
    const res = await fetch('/api/auth/profile/update', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ name, address })
    });
    return handleResponse<UserProfile>(res);
  },

  async updateWishlist(wishlist: string[]) {
    const res = await fetch('/api/auth/wishlist', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ wishlist })
    });
    return handleResponse<UserProfile>(res);
  },

  async getWishlist() {
    const res = await fetch('/api/wishlist', {
      method: 'GET',
      headers: getHeaders()
    });
    return handleResponse<Product[]>(res);
  },

  // Products
  async getProducts() {
    const res = await fetch('/api/products', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    return handleResponse<Product[]>(res);
  },

  async getProduct(id: string) {
    const res = await fetch(`/api/products/${id}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    return handleResponse<Product>(res);
  },

  async addProduct(productData: any) {
    const res = await fetch('/api/products', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(productData)
    });
    return handleResponse<Product>(res);
  },

  async updateProduct(id: string, productData: any) {
    const res = await fetch(`/api/products/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(productData)
    });
    return handleResponse<Product>(res);
  },

  async deleteProduct(id: string) {
    const res = await fetch(`/api/products/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    return handleResponse<{ success: boolean }>(res);
  },

  async seedProducts() {
    const res = await fetch('/api/products/seed', {
      method: 'POST',
      headers: getHeaders()
    });
    return handleResponse<{ success: boolean; products: Product[] }>(res);
  },

  // Orders
  async getOrders() {
    const res = await fetch('/api/orders', {
      method: 'GET',
      headers: getHeaders()
    });
    return handleResponse<Order[]>(res);
  },

  async createOrder(orderData: any) {
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(orderData)
    });
    return handleResponse<Order>(res);
  },

  async updateOrderStatus(id: string, status: string) {
    const res = await fetch(`/api/orders/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ status })
    });
    return handleResponse<Order>(res);
  },

  // Reviews
  async getReviews(productId: string) {
    const res = await fetch(`/api/reviews/${productId}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    return handleResponse<Review[]>(res);
  },

  async addReview(reviewData: { productId: string; rating: number; comment: string }) {
    const res = await fetch('/api/reviews', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(reviewData)
    });
    return handleResponse<Review>(res);
  },

  async deleteReview(id: string) {
    const res = await fetch(`/api/reviews/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    return handleResponse<{ success: boolean }>(res);
  }
};
