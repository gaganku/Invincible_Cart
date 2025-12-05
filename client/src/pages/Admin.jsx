import { useState, useEffect } from 'react';
import { api } from '../services/api';
import Navbar from '../components/Navbar';
import Pagination from '../components/Pagination';
import ConfirmationModal from '../components/ConfirmationModal';
import './Admin.css';

function Admin() {
  const [activeTab, setActiveTab] = useState('orders');
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, revenue: 0 });
  
  // Pagination state
  const [ordersPage, setOrdersPage] = useState(1);
  const [usersPage, setUsersPage] = useState(1);
  const [productsPage, setProductsPage] = useState(1);
  const itemsPerPage = 7;
  
  // Product form state
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    image: '',
    price: '',
    stock: '',
    categories: ''
  });

  // Search and Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  // Confirmation Modal State
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null,
    type: 'danger'
  });

  const showConfirm = (title, message, onConfirm, type = 'danger') => {
    setConfirmModal({
      isOpen: true,
      title,
      message,
      onConfirm: async () => {
        await onConfirm();
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      },
      type
    });
  };

  useEffect(() => {
    loadData();
    // Reset filters when tab changes
    setSearchTerm('');
    setStatusFilter('all');
    setDateFilter('all');
    setStartDate('');
    setEndDate('');
    setRoleFilter('all');
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'orders') {
        await loadOrders();
      } else if (activeTab === 'users') {
        await loadUsers();
      } else if (activeTab === 'products') {
        await loadProducts();
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadOrders = async () => {
    const data = await api.getAllOrders();
    setOrders(data);
    
    const total = data.length;
    const revenue = data.reduce((sum, order) => sum + (order.amount || 0), 0);
    setStats({ total, revenue });
  };

  const loadUsers = async () => {
    const data = await api.getAllUsers();
    setUsers(data);
  };

  const loadProducts = async () => {
    const data = await api.getProducts();
    setProducts(data);
  };

  const handleToggleAdmin = (userId, currentStatus) => {
    showConfirm(
      currentStatus ? 'Remove Admin Access?' : 'Grant Admin Access?',
      `Are you sure you want to ${currentStatus ? 'remove admin rights from' : 'make'} this user ${currentStatus ? '' : 'an admin'}?`,
      async () => {
        try {
          await api.updateUserAdmin(userId, !currentStatus);
          await loadUsers();
        } catch (error) {
          alert('Failed to update user');
        }
      },
      currentStatus ? 'danger' : 'primary'
    );
  };

  const handleDeleteUser = (userId, username) => {
    showConfirm(
      'Delete User?',
      `Are you sure you want to delete user "${username}"? This cannot be undone.`,
      async () => {
        try {
          await api.deleteUser(userId);
          await loadUsers();
        } catch (error) {
          alert('Failed to delete user');
        }
      }
    );
  };

  const handleProductFormChange = (e) => {
    const { name, value } = e.target;
    setProductForm(prev => ({ ...prev, [name]: value }));
  };

  const handleAddProduct = () => {
    setEditingProduct(null);
    setProductForm({
      name: '',
      description: '',
      image: '',
      price: '',
      stock: '',
      categories: ''
    });
    setShowProductForm(true);
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setProductForm({
      name: product.name,
      description: product.description,
      image: product.image,
      price: product.price.toString(),
      stock: product.stock.toString(),
      categories: (product.categories || []).join(', ')
    });
    setShowProductForm(true);
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    try {
      const productData = {
        ...productForm,
        price: parseFloat(productForm.price),
        stock: parseInt(productForm.stock),
        categories: productForm.categories
          .split(',')
          .map(cat => cat.trim())
          .filter(cat => cat.length > 0)
      };

      if (editingProduct) {
        await api.updateProduct(editingProduct.id, productData);
      } else {
        await api.addProduct(productData);
      }

      setShowProductForm(false);
      setEditingProduct(null);
      await loadProducts();
    } catch (error) {
      alert('Failed to save product');
    }
  };

  const handleDeleteProduct = (productId, productName) => {
    showConfirm(
      'Delete Product?',
      `Are you sure you want to delete "${productName}"? This cannot be undone.`,
      async () => {
        try {
          await api.deleteProduct(productId);
          await loadProducts();
        } catch (error) {
          alert('Failed to delete product');
        }
      }
    );
  };

  const handleDownloadReport = () => {
    api.downloadReport();
  };

  // Filter Logic
  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      (order._id && order._id.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (order.userId?.username && order.userId.username.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (order.productId?.name && order.productId.name.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    
    const orderDate = new Date(order.date);
    const now = new Date();
    const matchesDate = dateFilter === 'all' || 
      (dateFilter === 'this_month' && orderDate.getMonth() === now.getMonth() && orderDate.getFullYear() === now.getFullYear()) ||
      (dateFilter === 'last_month' && orderDate.getMonth() === now.getMonth() - 1 && orderDate.getFullYear() === now.getFullYear()) ||
      (dateFilter === 'custom' && (!startDate || new Date(order.date) >= new Date(startDate)) && (!endDate || new Date(order.date) <= new Date(endDate + 'T23:59:59')));

    return matchesSearch && matchesStatus && matchesDate;
  });

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      (user.username && user.username.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesRole = roleFilter === 'all' || 
      (roleFilter === 'admin' && user.isAdmin) || 
      (roleFilter === 'user' && !user.isAdmin);

    return matchesSearch && matchesRole;
  });

  const filteredProducts = products.filter(product => {
    return product.name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // Pagination Logic
  const getOrdersPage = () => {
    const startIndex = (ordersPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredOrders.slice(startIndex, endIndex);
  };

  const getUsersPage = () => {
    const startIndex = (usersPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredUsers.slice(startIndex, endIndex);
  };

  const getProductsPage = () => {
    const startIndex = (productsPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredProducts.slice(startIndex, endIndex);
  };

  const handlePageChange = (tab, pageNumber) => {
    if (tab === 'orders') setOrdersPage(pageNumber);
    if (tab === 'users') setUsersPage(pageNumber);
    if (tab === 'products') setProductsPage(pageNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const currentOrders = getOrdersPage();
  const currentUsers = getUsersPage();
  const currentProducts = getProductsPage();
  
  const ordersTotalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const usersTotalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const productsTotalPages = Math.ceil(filteredProducts.length / itemsPerPage);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading admin data...</p>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <Navbar />
      
      <div className="admin-container">
        <div className="admin-header">
          <h1>⚡ Admin Dashboard</h1>
          {activeTab === 'orders' && (
            <button onClick={handleDownloadReport} className="btn-download">
              📥 Download Report
            </button>
          )}
          {activeTab === 'products' && (
            <button onClick={handleAddProduct} className="btn-add">
              ➕ Add Product
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="admin-tabs">
          <button 
            className={`tab ${activeTab === 'orders' ? 'active' : ''}`}
            onClick={() => setActiveTab('orders')}
          >
            📦 Orders
          </button>
          <button 
            className={`tab ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            👥 Users
          </button>
          <button 
            className={`tab ${activeTab === 'products' ? 'active' : ''}`}
            onClick={() => setActiveTab('products')}
          >
            🛍️ Products
          </button>
        </div>

        {/* Search and Filter Toolbar */}
        <div className="admin-toolbar">
          <div className="search-bar">
            <span className="search-icon">🔍</span>
            <input 
              type="text" 
              placeholder={`Search ${activeTab}...`} 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="filters">
            {activeTab === 'orders' && (
              <>
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="filter-select">
                  <option value="all">All Status</option>
                  <option value="Pending">Pending</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
                <select value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} className="filter-select">
                  <option value="all">All Dates</option>
                  <option value="this_month">This Month</option>
                  <option value="last_month">Last Month</option>
                  <option value="custom">Custom Range 📅</option>
                </select>
                
                {dateFilter === 'custom' && (
                  <div className="date-range-inputs">
                    <input 
                      type="date" 
                      value={startDate} 
                      onChange={(e) => setStartDate(e.target.value)}
                      className="filter-input"
                    />
                    <span className="date-separator">to</span>
                    <input 
                      type="date" 
                      value={endDate} 
                      onChange={(e) => setEndDate(e.target.value)}
                      className="filter-input"
                    />
                  </div>
                )}
              </>
            )}

            {activeTab === 'users' && (
              <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="filter-select">
                <option value="all">All Roles</option>
                <option value="admin">Admins</option>
                <option value="user">Users</option>
              </select>
            )}
          </div>
        </div>

        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <>
            <div className="admin-stats">
              <div className="stat-card">
                <h3>📦 Total Orders</h3>
                <p className="stat-value">{stats.total}</p>
              </div>
              <div className="stat-card">
                <h3>💰 Total Revenue</h3>
                <p className="stat-value">${stats.revenue.toFixed(2)}</p>
              </div>
            </div>

            <div className="orders-table-container">
              <h2>All Orders</h2>
              
              {orders.length === 0 ? (
                <p className="no-data">No orders yet</p>
              ) : (
                <>
                  <table className="orders-table">
                    <thead>
                      <tr>
                        <th>Order ID</th>
                        <th>Customer</th>
                        <th>Email</th>
                        <th>Product</th>
                        <th>Amount</th>
                        <th>Date</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentOrders.map((order) => (
                        <tr key={order._id}>
                          <td className="order-id">{order._id.substring(0, 8)}...</td>
                          <td><span className="user-bubble">{order.userId?.username || 'N/A'}</span></td>
                          <td>{order.userId?.email || 'N/A'}</td>
                          <td>{order.productId?.name || 'N/A'}</td>
                          <td className="amount">${order.amount?.toFixed(2)}</td>
                          <td>{new Date(order.date).toLocaleDateString()}</td>
                          <td>
                            <span className={`status-badge status-${order.status}`}>
                              {order.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {orders.length > itemsPerPage && (
                    <Pagination 
                      currentPage={ordersPage}
                      totalPages={ordersTotalPages}
                      onPageChange={(page) => handlePageChange('orders', page)}
                    />
                  )}
                </>
              )}
            </div>
          </>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="users-table-container">
            <h2>All Users ({users.length})</h2>
            
            {users.length === 0 ? (
              <p className="no-data">No users yet</p>
            ) : (
              <>
                <table className="users-table">
                  <thead>
                    <tr>
                      <th>Username</th>
                      <th>Email</th>
                      <th>Phone</th>
                      <th>Admin</th>
                      <th>Verified</th>
                      <th>Created</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentUsers.map((user) => (
                      <tr key={user._id}>
                        <td className="username"><span className="user-bubble">{user.username}</span></td>
                        <td>{user.email || 'N/A'}</td>
                        <td>{user.phoneNumber || 'N/A'}</td>
                        <td>
                          <span className={`badge ${user.isAdmin ? 'badge-admin' : 'badge-user'}`}>
                            {user.isAdmin ? '✓ Admin' : '○ User'}
                          </span>
                        </td>
                        <td>
                          <span className={`badge ${user.isVerified ? 'badge-verified' : 'badge-unverified'}`}>
                            {user.isVerified ? '✓ Yes' : '✗ No'}
                          </span>
                        </td>
                        <td>{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}</td>
                        <td className="actions">
                          <button 
                            onClick={() => handleToggleAdmin(user._id, user.isAdmin)}
                            className="btn-action btn-toggle"
                          >
                            {user.isAdmin ? '⬇ Remove Admin' : '⬆ Make Admin'}
                          </button>
                          <button 
                            onClick={() => handleDeleteUser(user._id, user.username)}
                            className="btn-action btn-delete"
                          >
                            🗑️ Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {users.length > itemsPerPage && (
                  <Pagination 
                    currentPage={usersPage}
                    totalPages={usersTotalPages}
                    onPageChange={(page) => handlePageChange('users', page)}
                  />
                )}
              </>
            )}
          </div>
        )}

        {/* Products Tab */}
        {activeTab === 'products' && (
          <div className="products-table-container">
            <h2>All Products ({products.length})</h2>
            
            {showProductForm && (
              <div className="product-form-overlay">
                <div className="product-form-modal">
                  <h3>{editingProduct ? '✏️ Edit Product' : '➕ Add New Product'}</h3>
                  <form onSubmit={handleSaveProduct}>
                    <div className="form-group">
                      <label>Product Name *</label>
                      <input 
                        type="text" 
                        name="name"
                        value={productForm.name}
                        onChange={handleProductFormChange}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Description *</label>
                      <textarea 
                        name="description"
                        value={productForm.description}
                        onChange={handleProductFormChange}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Image URL *</label>
                      <input 
                        type="url" 
                        name="image"
                        value={productForm.image}
                        onChange={handleProductFormChange}
                        required
                      />
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Price ($) *</label>
                        <input 
                          type="number" 
                          step="0.01"
                          name="price"
                          value={productForm.price}
                          onChange={handleProductFormChange}
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label>Stock *</label>
                        <input 
                          type="number" 
                          name="stock"
                          value={productForm.stock}
                          onChange={handleProductFormChange}
                          required
                        />
                      </div>
                    </div>
                    <div className="form-group">
                      <label>Categories (comma-separated)</label>
                      <input 
                        type="text" 
                        name="categories"
                        value={productForm.categories}
                        onChange={handleProductFormChange}
                        placeholder="e.g., Electronics, Gaming, Accessories"
                      />
                      <small className="form-hint">💡 Enter multiple categories separated by commas</small>
                    </div>
                    <div className="form-actions">
                      <button type="submit" className="btn-save">
                        💾 {editingProduct ? 'Update' : 'Add'} Product
                      </button>
                      <button 
                        type="button" 
                        onClick={() => setShowProductForm(false)}
                        className="btn-cancel"
                      >
                        ✖ Cancel
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
            
            {products.length === 0 ? (
              <p className="no-data">No products yet</p>
            ) : (
              <>
                <table className="products-table">
                  <thead>
                    <tr>
                      <th>Image</th>
                      <th>Name</th>
                      <th>Description</th>
                      <th>Categories</th>
                      <th>Price</th>
                      <th>Stock</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentProducts.map((product) => (
                      <tr key={product._id}>
                        <td>
                          <img src={product.image} alt={product.name} className="product-thumbnail" />
                        </td>
                        <td className="product-name">{product.name}</td>
                        <td className="product-desc">{product.description}</td>
                        <td className="product-categories">
                          {(product.categories && product.categories.length > 0) ? (
                            <div className="category-tags">
                              {product.categories.map((cat, idx) => (
                                <span key={idx} className="category-tag">{cat}</span>
                              ))}
                            </div>
                          ) : (
                            <span className="no-categories">—</span>
                          )}
                        </td>
                        <td className="price">${product.price.toFixed(2)}</td>
                        <td>
                          <span className={`stock-badge ${product.stock > 5 ? 'stock-good' : product.stock > 0 ? 'stock-low' : 'stock-out'}`}>
                            {product.stock} units
                          </span>
                        </td>
                        <td className="actions">
                          <button 
                            onClick={() => handleEditProduct(product)}
                            className="btn-action btn-edit"
                          >
                            ✏️ Edit
                          </button>
                          <button 
                            onClick={() => handleDeleteProduct(product.id, product.name)}
                            className="btn-action btn-delete"
                          >
                            🗑️ Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {products.length > itemsPerPage && (
                  <Pagination 
                    currentPage={productsPage}
                    totalPages={productsTotalPages}
                    onPageChange={(page) => handlePageChange('products', page)}
                  />
                )}
              </>
            )}
          </div>
        )}
      </div>
      
      <ConfirmationModal 
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
        type={confirmModal.type}
      />
    </div>
  );
}

export default Admin;
