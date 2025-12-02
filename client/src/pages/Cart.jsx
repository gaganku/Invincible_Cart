import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import Navbar from '../components/Navbar';
import UpiPayment from '../components/UpiPayment';
import './Cart.css';
import { triggerConfetti } from '../utils/confetti';

function Cart() {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checkingOut, setCheckingOut] = useState(false);
  const [showUpiModal, setShowUpiModal] = useState(false);
  const toast = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    loadCart();
  }, []);

  const loadCart = async () => {
    try {
      const data = await api.getCart();
      setCart(data);
    } catch (error) {
      console.error('Failed to load cart:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (productId) => {
    try {
      const updatedCart = await api.removeFromCart(productId);
      setCart(updatedCart);
    } catch (error) {
      console.error('Failed to remove item:', error);
      toast.error('Failed to remove item');
    }
  };

  const handleCheckout = async () => {
    setShowUpiModal(true);
  };

  const handlePaymentSuccess = async (paymentData) => {
    setCheckingOut(true);
    setShowUpiModal(false);
    
    try {
      const result = await api.checkout(paymentData);
      if (result.error) {
        toast.error(result.error);
      } else {
        triggerConfetti();
        toast.success(`🎉 Payment successful! Order confirmed.`);
        setTimeout(() => {
          navigate('/orders');
        }, 2000);
      }
    } catch (error) {
      console.error('Checkout failed:', error);
      toast.error('Checkout failed. Please try again.');
    } finally {
      setCheckingOut(false);
    }
  };

  const handlePaymentCancel = () => {
    setShowUpiModal(false);
    toast.info('Payment cancelled');
  };

  if (loading) {
    return (
      <div className="cart-page">
        <Navbar />
        <div className="loading-container" style={{ color: 'white', display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
          <div className="loading-spinner"></div>
        </div>
      </div>
    );
  }

  const totalAmount = cart?.items?.reduce((sum, item) => {
    return sum + (item.productId?.price || 0) * item.quantity;
  }, 0) || 0;

  return (
    <div className="cart-page">
      <Navbar />
      
      <div className="cart-container">
        <div className="cart-header">
          <h1>🛒 Your Cart</h1>
          <p>Review your items before checkout</p>
        </div>

        {!cart || cart.items.length === 0 ? (
          <div className="empty-cart">
            <h2>Your cart is empty 😢</h2>
            <p>Looks like you haven't added anything yet.</p>
            <a href="/">Start Shopping</a>
          </div>
        ) : (
          <div className="cart-content">
            <div className="cart-items">
              {cart.items.map((item) => (
                <div key={item.productId._id} className="cart-item">
                  <div className="item-image">
                    <img src={item.productId.image} alt={item.productId.name} />
                  </div>
                  <div className="item-details">
                    <h3>{item.productId.name}</h3>
                    <div className="item-price">${item.productId.price.toFixed(2)}</div>
                    <div className="item-quantity">Quantity: {item.quantity}</div>
                  </div>
                  <button 
                    className="remove-btn"
                    onClick={() => handleRemove(item.productId._id)}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>

            <div className="cart-summary">
              <h2>Order Summary</h2>
              <div className="summary-row">
                <span>Subtotal</span>
                <span>${totalAmount.toFixed(2)}</span>
              </div>
              <div className="summary-row">
                <span>Shipping</span>
                <span>Free</span>
              </div>
              <div className="summary-total">
                <span>Total</span>
                <span>${totalAmount.toFixed(2)}</span>
              </div>
              
              <button 
                className="checkout-btn"
                onClick={handleCheckout}
                disabled={checkingOut}
              >
                {checkingOut ? 'Processing...' : 'Proceed to Checkout'}
              </button>
            </div>
          </div>
        )}
      </div>

      {showUpiModal && (
        <UpiPayment 
          amount={totalAmount}
          onSuccess={handlePaymentSuccess}
          onCancel={handlePaymentCancel}
        />
      )}
    </div>
  );
}

export default Cart;
