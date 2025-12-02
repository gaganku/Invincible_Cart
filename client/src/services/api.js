// API Service helper functions
// HARDCODED TO LOCALHOST - NO PRODUCTION URLS

const API_BASE = 'http://localhost:3000';  // Always use localhost

export const api = {
  // Auth endpoints
  login: async (username, password) => {
    const res = await fetch(`${API_BASE}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ username, password })
    });
    return res.json();
  },

  signup: async (userData) => {
    const res = await fetch(`${API_BASE}/api/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(userData)
    });
    return res.json();
  },

  verify2FA: async (otp) => {
    const res = await fetch(`${API_BASE}/api/auth/verify-2fa`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ otp })
    });
    return res.json();
  },

  verifyGoogleOTP: async (otp) => {
    const res = await fetch(`${API_BASE}/api/auth/google/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ otp })
    });
    return res.json();
  },

  getGoogleSessionInfo: async () => {
    const res = await fetch(`${API_BASE}/api/auth/google/session-info`, {
      credentials: 'include'
    });
    return res.json();
  },

  completeGoogleProfile: async (username, phone) => {
    const res = await fetch(`${API_BASE}/api/auth/google/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ username, phone })
    });
    return res.json();
  },

  // Product endpoints
  getProducts: async () => {
    const res = await fetch(`${API_BASE}/api/products`, {
      credentials: 'include'
    });
    return res.json();
  },

  // Order endpoints
  purchase: async (productId) => {
    const res = await fetch(`${API_BASE}/api/purchase`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ productId })
    });
    return res.json();
  },

  getUserOrders: async () => {
    const res = await fetch(`${API_BASE}/api/user/orders`, {
      credentials: 'include'
    });
    return res.json();
  },

  // Cart endpoints
  getCart: async () => {
    const res = await fetch(`${API_BASE}/api/cart`, {
      credentials: 'include'
    });
    return res.json();
  },

  addToCart: async (productId) => {
    const res = await fetch(`${API_BASE}/api/cart`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ productId })
    });
    return res.json();
  },

  removeFromCart: async (productId) => {
    const res = await fetch(`${API_BASE}/api/cart/${productId}`, {
      method: 'DELETE',
      credentials: 'include'
    });
    return res.json();
  },

  checkout: async (paymentData) => {
    const res = await fetch(`${API_BASE}/api/cart/checkout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ paymentData })
    });
    return res.json();
  },

  // Admin endpoints
  getAllOrders: async () => {
    const res = await fetch(`${API_BASE}/api/orders`, {
      credentials: 'include'
    });
    return res.json();
  },

  downloadReport: () => {
    window.location.href = `${API_BASE}/api/report`;
  },

  // Admin: User Management
  getAllUsers: async () => {
    const res = await fetch(`${API_BASE}/api/admin/users`, {
      credentials: 'include'
    });
    return res.json();
  },

  updateUserAdmin: async (userId, isAdmin) => {
    const res = await fetch(`${API_BASE}/api/admin/users/${userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ isAdmin })
    });
    return res.json();
  },

  deleteUser: async (userId) => {
    const res = await fetch(`${API_BASE}/api/admin/users/${userId}`, {
      method: 'DELETE',
      credentials: 'include'
    });
    return res.json();
  },

  // Admin: Product Management
  addProduct: async (productData) => {
    const res = await fetch(`${API_BASE}/api/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(productData)
    });
    return res.json();
  },

  updateProduct: async (productId, productData) => {
    const res = await fetch(`${API_BASE}/api/products/${productId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(productData)
    });
    return res.json();
  },

  deleteProduct: async (productId) => {
    const res = await fetch(`${API_BASE}/api/products/${productId}`, {
      method: 'DELETE',
      credentials: 'include'
    });
    return res.json();
  }
};
