import { useState, useEffect } from 'react';
import { api } from '../services/api';
import Navbar from '../components/Navbar';
import Pagination from '../components/Pagination';
import './Orders.css';

function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const ordersPerPage = 5;

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      const data = await api.getUserOrders();
      console.log('[ORDERS PAGE] Received orders:', data);
      console.log('[ORDERS PAGE] Number of orders:', data.length);
      setOrders(data);
    } catch (error) {
      console.error('Failed to load orders:', error);
    } finally {
      setLoading(false);
    }
  };

  // Pagination logic
  const indexOfLastOrder = currentPage * ordersPerPage;
  const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
  const currentOrders = orders.slice(indexOfFirstOrder, indexOfLastOrder);
  const totalPages = Math.ceil(orders.length / ordersPerPage);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading your orders...</p>
      </div>
    );
  }

  return (
    <div className="orders-page">
      <Navbar />
      
      <div className="orders-container">
        <div className="orders-header">
          <h1>📦 My Orders</h1>
          <p>View your order history</p>
        </div>

        {orders.length === 0 ? (
          <div className="no-orders">
            <p>🛍️ No orders yet</p>
            <a href="/">Start Shopping</a>
          </div>
        ) : (
          <>
            <div className="orders-list">
              {currentOrders.map((order) => (
                <div key={order._id} className="order-card">
                  <div className="order-header-content">
                    <span className="order-id">Order #{order._id.slice(-6).toUpperCase()}</span>
                    <span className="order-date">
                      📅 {new Date(order.date).toLocaleDateString()}
                    </span>
                  </div>
                  
                  <div className="order-product">
                    <h3>{order.productId?.name || 'Unknown Product'}</h3>
                    <p>{order.productId?.description?.substring(0, 100)}...</p>
                  </div>
                  
                  <div className="order-footer">
                    <div className="order-amount">
                      ${order.amount?.toFixed(2)}
                    </div>
                    <span className={`order-status status-${order.status}`}>
                      {order.status}
                    </span>
                  </div>
                </div>
              ))} 
            </div>

            {orders.length > ordersPerPage && (
              <Pagination 
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default Orders;
