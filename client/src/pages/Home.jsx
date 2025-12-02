import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { api } from '../services/api';
import Navbar from '../components/Navbar';
import Pagination from '../components/Pagination';
import './Home.css';
import { triggerConfetti } from '../utils/confetti';
import ProductDetailsModal from '../components/ProductDetailsModal';

function Home() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [purchasingId, setPurchasingId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const productsPerPage = 6;
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Load products on mount
  useEffect(() => {
    const loadProducts = async () => {
      try {
        const data = await api.getProducts();
        setProducts(data);
      } catch (error) {
        console.error('Failed to load products:', error);
      } finally {
        setLoading(false);
      }
    };
    loadProducts();
  }, []);

  const handleAddToCart = async (productId) => {
    if (!user) {
      navigate('/login');
      return;
    }
    setPurchasingId(productId);
    try {
      const data = await api.addToCart(productId);
      if (data.error) {
        toast.error(data.error);
      } else {
        setProducts(prev =>
          prev.map(p => (p._id === productId ? { ...p, stock: p.stock - 1 } : p))
        );
        triggerConfetti();
        toast.success('🎉 Added to cart!');
      }
    } catch (err) {
      toast.error('Failed to add to cart. Please try again.');
    } finally {
      setPurchasingId(null);
    }
  };

  const handleCardClick = (product) => {
    setSelectedProduct(product);
  };

  // Pagination calculations
  const indexOfLast = currentPage * productsPerPage;
  const indexOfFirst = indexOfLast - productsPerPage;
  const currentProducts = products.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(products.length / productsPerPage);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner" />
        <p>Loading products...</p>
      </div>
    );
  }

  return (
    <div className="home-page">
      <Navbar />
      <div className="home-container">
        <div className="home-header">
          <h1>🛒 Welcome to Shopping Cart</h1>
          <p>Discover amazing products at great prices</p>
          {user && (
            <p style={{ marginTop: '1rem', color: 'rgba(255,255,255,0.9)', fontSize: '1.1rem' }}>
              Hello, <strong>{user.username}</strong>! 👋
            </p>
          )}
        </div>
        <div className="products-grid">
          {currentProducts.map((product) => (
            <div key={product._id} className="product-card" onClick={() => handleCardClick(product)}>
              <div style={{ position: 'relative', overflow: 'hidden' }}>
                <img src={product.image} alt={product.name} className="product-image" />
                {product.stock <= 0 && (
                  <div className="product-stock stock-out" style={{ position: 'absolute', top: '15px', right: '15px', padding: '0.5rem 1rem', fontSize: '0.8rem', boxShadow: '0 4px 15px rgba(0,0,0,0.2)' }}>
                    Out of Stock
                  </div>
                )}
                {product.stock > 0 && product.stock <= 3 && (
                  <div className="product-stock stock-low" style={{ position: 'absolute', top: '15px', right: '15px', padding: '0.5rem 1rem', fontSize: '0.8rem', boxShadow: '0 4px 15px rgba(0,0,0,0.2)' }}>
                    Only {product.stock} left!
                  </div>
                )}
              </div>
              <div className="product-info">
                <h3 className="product-name">{product.name}</h3>
                <p className="product-description">{product.description}</p>
                <div className="product-footer">
                  <div className="product-price">${product.price.toFixed(2)}</div>
                  <div className={`product-stock ${product.stock <= 0 ? 'stock-out' : product.stock <= 3 ? 'stock-low' : 'stock-available'}`}>
                    {product.stock} units
                  </div>
                </div>
                <button className="buy-button" onClick={(e) => { e.stopPropagation(); handleAddToCart(product._id); }} disabled={product.stock <= 0 || purchasingId === product._id}>
                  {purchasingId === product._id ? (
                    <span>⏳ Processing...</span>
                  ) : product.stock <= 0 ? (
                    <span>❌ Out of Stock</span>
                  ) : (
                    <span>🛒 Add to Cart</span>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
        {products.length > productsPerPage && (
          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
        )}
        {products.length === 0 && !loading && (
          <div className="no-products"><p>No products found. Check back later!</p></div>
        )}
        {/* Modal for product details */}
        {selectedProduct && (
          <ProductDetailsModal product={selectedProduct} onClose={() => setSelectedProduct(null)} onAddToCart={handleAddToCart} purchasingId={purchasingId} />
        )}
      </div>
    </div>
  );
}

export default Home;
