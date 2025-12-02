import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import './UpiPayment.css';

function UpiPayment({ amount, onSuccess, onCancel }) {
  const [paymentStatus, setPaymentStatus] = useState('pending'); // pending, processing, success, failed
  const [timer, setTimer] = useState(300); // 5 minutes countdown

  const upiId = 'merchant@upi'; // Simulated UPI ID
  const transactionId = `TXN${Date.now()}`;
  const upiString = `upi://pay?pa=${upiId}&pn=ShoppingCart&am=${amount}&tn=Order Payment&cu=INR`;

  useEffect(() => {
    if (paymentStatus === 'pending' && timer > 0) {
      const interval = setInterval(() => {
        setTimer(prev => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    }
    if (timer === 0) {
      setPaymentStatus('failed');
    }
  }, [timer, paymentStatus]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const simulatePayment = () => {
    setPaymentStatus('processing');
    // Simulate payment processing
    setTimeout(() => {
      setPaymentStatus('success');
      setTimeout(() => {
        onSuccess({ transactionId, method: 'UPI', status: 'confirmed' });
      }, 1500);
    }, 2000);
  };

  return (
    <div className="upi-modal-overlay" onClick={onCancel}>
      <div className="upi-modal" onClick={(e) => e.stopPropagation()}>
        <button className="upi-close" onClick={onCancel}>×</button>
        
        <div className="upi-header">
          <div className="upi-logo">💳</div>
          <h2>UPI Payment</h2>
          <p>Scan QR or use UPI ID to pay</p>
        </div>

        {paymentStatus === 'pending' && (
          <>
            <div className="upi-amount">
              <span>Amount to Pay</span>
              <div className="amount-value">₹{amount.toFixed(2)}</div>
            </div>

            <div className="upi-timer">
              <span>⏱️ Time Remaining: {formatTime(timer)}</span>
            </div>

            <div className="upi-qr-section">
              <div className="qr-container">
                <QRCodeSVG 
                  value={upiString} 
                  size={200}
                  level="H"
                  includeMargin={true}
                />
              </div>
              <p className="qr-instruction">Scan with any UPI app</p>
            </div>

            <div className="upi-divider">
              <span>OR</span>
            </div>

            <div className="upi-id-section">
              <label>UPI ID / VPA</label>
              <div className="upi-id-display">
                <span>{upiId}</span>
                <button className="copy-btn" onClick={() => navigator.clipboard.writeText(upiId)}>
                  📋 Copy
                </button>
              </div>
            </div>

            <div className="upi-apps">
              <p>Pay using:</p>
              <div className="app-icons">
                <div className="app-icon">📱 GPay</div>
                <div className="app-icon">📱 PhonePe</div>
                <div className="app-icon">📱 Paytm</div>
                <div className="app-icon">📱 BHIM</div>
              </div>
            </div>

            <button className="simulate-payment-btn" onClick={simulatePayment}>
              🧪 Simulate Payment (Dev Mode)
            </button>
          </>
        )}

        {paymentStatus === 'processing' && (
          <div className="payment-processing">
            <div className="processing-spinner"></div>
            <h3>Processing Payment...</h3>
            <p>Please wait while we verify your payment</p>
          </div>
        )}

        {paymentStatus === 'success' && (
          <div className="payment-success">
            <div className="success-icon">✓</div>
            <h3>Payment Successful!</h3>
            <p>Transaction ID: {transactionId}</p>
          </div>
        )}

        {paymentStatus === 'failed' && (
          <div className="payment-failed">
            <div className="failed-icon">✕</div>
            <h3>Payment Timeout</h3>
            <p>Please try again</p>
            <button className="retry-btn" onClick={() => { setPaymentStatus('pending'); setTimer(300); }}>
              Retry Payment
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default UpiPayment;
