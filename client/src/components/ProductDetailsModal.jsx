import React, { useMemo } from 'react';
import './ProductDetailsModal.css';

// Helper: generate a short feature list from product description or other fields
function generateFeatures(product) {
  if (!product) return [];
  const raw = product.description || '';
  // Split on punctuation, trim, filter empties, limit to 5 items
  const parts = raw.split(/[.,;]+/).map(p => p.trim()).filter(p => p.length);
  return parts.slice(0, 5);
}

// Helper: Generate "AI-like" marketing copy
function getMarketingCopy(product) {
  const positives = [
    "✨ Absolutely stunning quality that exceeds expectations!",
    "🚀 A total game changer for your daily routine.",
    "⭐ Highly recommended by top reviewers in the industry.",
    "💎 The best value for money you'll find in this category.",
    "🛡️ Sleek, durable, and beautifully designed for longevity."
  ];
  const encouragements = [
    "🔥 Don't miss out – stocks are selling fast!",
    "🌟 Upgrade your lifestyle today with this premium choice.",
    "🎁 Treat yourself, you truly deserve the best!",
    "🏆 Join thousands of happy customers who love this.",
    "⚡ Experience the difference immediately – Buy Now!"
  ];

  // Simple deterministic hash based on product ID (or name) to pick a consistent message
  const seed = (product._id || product.name).split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  
  return {
    positive: positives[seed % positives.length],
    encouragement: encouragements[seed % encouragements.length]
  };
}

function ProductDetailsModal({ product, onClose, onAddToCart, purchasingId }) {
  if (!product) return null;

  const features = useMemo(() => generateFeatures(product), [product]);
  const marketing = useMemo(() => getMarketingCopy(product), [product]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Close modal">✖</button>
        
        <div className="modal-header">
          <div className="image-container">
            <img src={product.image} alt={product.name} className="modal-image" />
            <div className="image-badge">Best Seller</div>
          </div>
          <div className="modal-info">
             <h2 className="modal-title">{product.name}</h2>
             
             {product.rating && (
              <div className="modal-rating-container">
                <span className="stars">{'★'.repeat(Math.round(product.rating))}{'☆'.repeat(5 - Math.round(product.rating))}</span>
                <span className="rating-text">({product.rating} / 5)</span>
              </div>
            )}

            <div className="modal-price-tag">
              <span className="currency">$</span>
              <span className="amount">{product.price.toFixed(2)}</span>
            </div>

             <div className="marketing-section">
                <p className="positive-feedback">"{marketing.positive}"</p>
             </div>
          </div>
        </div>

        <div className="modal-body">
          <p className="modal-description">{product.description}</p>
          
          {features.length > 0 && (
            <div className="features-container">
              <h3>Why you'll love it:</h3>
              <ul className="modal-features">
                {features.map((f, i) => (
                  <li key={i} style={{animationDelay: `${i * 0.1}s`}}>{f}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <p className="encouragement-text">{marketing.encouragement}</p>
          <div className="action-row">
             <p className="modal-stock status-badge">
                {product.stock > 0 ? `✅ In Stock: ${product.stock}` : '❌ Out of Stock'}
             </p>
            <button
              className="modal-add-button"
              onClick={() => onAddToCart(product._id)}
              disabled={product.stock <= 0 || purchasingId === product._id}
            >
              {purchasingId === product._id ? '⏳ Processing...' : product.stock <= 0 ? 'Notify Me' : '🛒 Add to Cart'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProductDetailsModal;
