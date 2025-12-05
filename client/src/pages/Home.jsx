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
  const productsPerPage = 9;
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchText, setSearchText] = useState('');
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

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



  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Extract unique categories from all products
  const allCategories = [...new Set(products.flatMap(p => p.categories || []))].sort();

  // Handle category checkbox toggle
  const handleCategoryToggle = (category) => {
    setSelectedCategories(prev => {
      if (prev.includes(category)) {
        return prev.filter(c => c !== category);
      } else {
        return [...prev, category];
      }
    });
    setCurrentPage(1);
  };

  // Clear all filters
  const handleClearFilters = () => {
    setSelectedCategories([]);
    setSearchText('');
    setCurrentPage(1);
  };

  // Filter products by search text AND selected categories
  const filteredProducts = products.filter(product => {
    // Search filter
    const matchesSearch = searchText === '' || 
      product.name.toLowerCase().includes(searchText.toLowerCase()) ||
      product.description.toLowerCase().includes(searchText.toLowerCase());
    
    // Category filter
    const matchesCategory = selectedCategories.length === 0 ||
      (product.categories && product.categories.some(cat => selectedCategories.includes(cat)));
    
    return matchesSearch && matchesCategory;
  });

  // Pagination calculations using filtered products
  const indexOfLastFiltered = currentPage * productsPerPage;
  const indexOfFirstFiltered = indexOfLastFiltered - productsPerPage;
  const currentFilteredProducts = filteredProducts.slice(indexOfFirstFiltered, indexOfLastFiltered);
  const totalFilteredPages = Math.ceil(filteredProducts.length / productsPerPage);

  // Old category button handler (keeping for backwards compatibility)
  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
    setCurrentPage(1);
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
        
        {/* Advanced Search Bar with Filter Dropdown */}
        <div className="search-filter-container">
          <div className="search-wrapper">
            <div className="search-input-group">
              <span className="search-icon">🔍</span>
              <input
                type="text"
                className="search-input"
                placeholder="Search products by name or description..."
                value={searchText}
                onChange={(e) => { setSearchText(e.target.value); setCurrentPage(1); }}
              />
              {searchText && (
                <button className="clear-search-btn" onClick={() => setSearchText('')}>
                  ✕
                </button>
              )}
            </div>
            
            <button 
              className={`filter-toggle-btn ${showFilterDropdown ? 'active' : ''}`}
              onClick={() => setShowFilterDropdown(!showFilterDropdown)}
            >
              <span className="filter-icon">☰</span>
              <span className="filter-text">Filters</span>
              {selectedCategories.length > 0 && (
                <span className="filter-count">{selectedCategories.length}</span>
              )}
            </button>
          </div>

          {/* Filter Dropdown Panel */}
          {showFilterDropdown && (
            <div className="filter-dropdown">
              <div className="filter-dropdown-header">
                <h3>Filter by Categories</h3>
                {selectedCategories.length > 0 && (
                  <button className="clear-all-btn" onClick={handleClearFilters}>
                    Clear All
                  </button>
                )}
              </div>
              
              <div className="filter-categories">
                {allCategories.map((category) => (
                  <label key={category} className="category-checkbox">
                    <input
                      type="checkbox"
                      checked={selectedCategories.includes(category)}
                      onChange={() => handleCategoryToggle(category)}
                    />
                    <span className="checkbox-custom"></span>
                    <span className="category-label">{category}</span>
                    <span className="category-count">
                      ({products.filter(p => p.categories && p.categories.includes(category)).length})
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Active Filters Display */}
          {(selectedCategories.length > 0 || searchText) && (
            <div className="active-filters">
              <span className="active-filters-label">Active Filters:</span>
              {searchText && (
                <span className="filter-tag">
                  Search: "{searchText}"
                  <button onClick={() => setSearchText('')}>×</button>
                </span>
              )}
              {selectedCategories.map((category) => (
                <span key={category} className="filter-tag">
                  {category}
                  <button onClick={() => handleCategoryToggle(category)}>×</button>
                </span>
              ))}
              <button className="clear-all-filters-btn" onClick={handleClearFilters}>
                Clear All Filters
              </button>
            </div>
          )}
        </div>
        
        <div className="products-grid">
          {currentFilteredProducts.map((product) => (
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
                {product.categories && product.categories.length > 0 && (
                  <div className="product-categories-home">
                    {product.categories.map((cat, idx) => (
                      <span key={idx} className="category-tag-home">{cat}</span>
                    ))}
                  </div>
                )}
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
        {filteredProducts.length > productsPerPage && (
          <Pagination currentPage={currentPage} totalPages={totalFilteredPages} onPageChange={handlePageChange} />
        )}
        {filteredProducts.length === 0 && !loading && (
          <div className="no-products"><p>No products found in this category. Try a different filter!</p></div>
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
