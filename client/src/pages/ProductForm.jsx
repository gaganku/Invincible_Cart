import { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { api } from '../services/api';
import Navbar from '../components/Navbar';
import './ProductForm.css';

function ProductForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const isEditing = Boolean(id);
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [imagePreview, setImagePreview] = useState('');
  
  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    image: '',
    price: '',
    stock: '',
    categories: ''
  });

  // Load product data if editing
  useEffect(() => {
    if (isEditing && location.state?.product) {
      const product = location.state.product;
      setProductForm({
        name: product.name,
        description: product.description,
        image: product.image,
        price: product.price.toString(),
        stock: product.stock.toString(),
        categories: (product.categories || []).join(', ')
      });
      setImagePreview(product.image);
    } else if (isEditing) {
      // If no state passed, fetch product data
      loadProduct();
    }
  }, [id, isEditing, location.state]);

  const loadProduct = async () => {
    setLoading(true);
    try {
      const products = await api.getProducts();
      const product = products.find(p => p._id === id || p.id === id);
      if (product) {
        setProductForm({
          name: product.name,
          description: product.description,
          image: product.image,
          price: product.price.toString(),
          stock: product.stock.toString(),
          categories: (product.categories || []).join(', ')
        });
        setImagePreview(product.image);
      }
    } catch (error) {
      console.error('Failed to load product:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setProductForm(prev => ({ ...prev, [name]: value }));
    
    // Update image preview when URL changes
    if (name === 'image') {
      setImagePreview(value);
    }
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    setSaving(true);
    
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

      if (isEditing) {
        await api.updateProduct(id, productData);
      } else {
        await api.addProduct(productData);
      }

      // Navigate back to admin products tab
      navigate('/admin', { state: { activeTab: 'products' } });
    } catch (error) {
      alert('Failed to save product');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    navigate('/admin', { state: { activeTab: 'products' } });
  };

  if (loading) {
    return (
      <div className="product-form-page">
        <Navbar />
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading product...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="product-form-page">
      <Navbar />
      
      <div className="product-form-container">
        {/* Header */}
        <div className="product-form-header">
          <button className="back-btn" onClick={handleCancel}>
            ← Back to Products
          </button>
          <h1>{isEditing ? '✏️ Edit Product' : '➕ Add New Product'}</h1>
          <p>{isEditing ? 'Update the product details below' : 'Fill in the details to add a new product'}</p>
        </div>

        <div className="product-form-content">
          {/* Form Section */}
          <form onSubmit={handleSaveProduct} className="product-form">
            <div className="form-section">
              <h2>📝 Basic Information</h2>
              
              <div className="form-group">
                <label>Product Name *</label>
                <input 
                  type="text" 
                  name="name"
                  value={productForm.name}
                  onChange={handleFormChange}
                  placeholder="Enter product name"
                  required
                />
              </div>

              <div className="form-group">
                <label>Description *</label>
                <textarea 
                  name="description"
                  value={productForm.description}
                  onChange={handleFormChange}
                  placeholder="Describe your product in detail..."
                  rows="5"
                  required
                />
              </div>

              <div className="form-group">
                <label>Categories</label>
                <input 
                  type="text" 
                  name="categories"
                  value={productForm.categories}
                  onChange={handleFormChange}
                  placeholder="e.g., Electronics, Gaming, Accessories"
                />
                <span className="form-hint">💡 Enter multiple categories separated by commas</span>
              </div>
            </div>

            <div className="form-section">
              <h2>💰 Pricing & Stock</h2>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Price ($) *</label>
                  <input 
                    type="number" 
                    step="0.01"
                    min="0"
                    name="price"
                    value={productForm.price}
                    onChange={handleFormChange}
                    placeholder="0.00"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Stock Quantity *</label>
                  <input 
                    type="number" 
                    min="0"
                    name="stock"
                    value={productForm.stock}
                    onChange={handleFormChange}
                    placeholder="0"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="form-section">
              <h2>🖼️ Product Image</h2>
              
              <div className="form-group">
                <label>Image URL *</label>
                <input 
                  type="url" 
                  name="image"
                  value={productForm.image}
                  onChange={handleFormChange}
                  placeholder="https://example.com/image.jpg"
                  required
                />
              </div>

              {/* Image Preview */}
              <div className="image-preview-container">
                {imagePreview ? (
                  <div className="image-preview">
                    <img 
                      src={imagePreview} 
                      alt="Product preview" 
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                    <div className="image-error" style={{ display: 'none' }}>
                      <span>⚠️ Unable to load image</span>
                      <small>Please check the URL</small>
                    </div>
                  </div>
                ) : (
                  <div className="image-placeholder">
                    <span>🖼️</span>
                    <p>Image preview will appear here</p>
                  </div>
                )}
              </div>
            </div>

            {/* Form Actions */}
            <div className="form-actions">
              <button type="button" onClick={handleCancel} className="btn-cancel">
                ✖ Cancel
              </button>
              <button type="submit" className="btn-save" disabled={saving}>
                {saving ? '⏳ Saving...' : `💾 ${isEditing ? 'Update' : 'Add'} Product`}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default ProductForm;
