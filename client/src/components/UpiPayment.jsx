import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import LocationPicker from './LocationPicker';
import './UpiPayment.css';

function UpiPayment({ amount, onSuccess, onCancel }) {
  const [step, setStep] = useState(1); // 1: Address, 2: Payment, 3: Summary
  const [paymentStatus, setPaymentStatus] = useState('pending'); // pending, processing, success, failed
  const [timer, setTimer] = useState(300); // 5 minutes countdown
  const [address, setAddress] = useState('');
  const [landmark, setLandmark] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [pincode, setPincode] = useState('');
  const [phone, setPhone] = useState('');
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [showMapPicker, setShowMapPicker] = useState(false);

  const upiId = 'merchant@upi'; // Simulated UPI ID
  const transactionId = `TXN${Date.now()}`;
  const upiString = `upi://pay?pa=${upiId}&pn=ShoppingCart&am=${amount}&tn=Order Payment&cu=INR`;

  useEffect(() => {
    if (step === 2 && paymentStatus === 'pending' && timer > 0 && !showMapPicker) {
      const interval = setInterval(() => {
        setTimer(prev => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    }
    if (timer === 0) {
      setPaymentStatus('failed');
    }
  }, [timer, paymentStatus, showMapPicker, step]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }
    setLoadingLocation(true);
    navigator.geolocation.getCurrentPosition(async (position) => {
      const { latitude, longitude } = position.coords;
      try {
          const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
          const data = await response.json();
          if (data.address) {
              setAddress(data.display_name || '');
              setCity(data.address.city || data.address.town || data.address.village || '');
              setCountry(data.address.country || '');
              setPincode(data.address.postcode || '');
          }
      } catch (error) {
          console.error("Error fetching address", error);
          alert("Could not fetch address details. Please enter manually.");
      } finally {
          setLoadingLocation(false);
      }
    }, () => {
      alert('Unable to retrieve your location');
      setLoadingLocation(false);
    });
  };

  const handleMapLocationConfirm = (data) => {
    console.log("📥 Received map data in UpiPayment:", data);
    setShowMapPicker(false);
    if (data) {
      setAddress(data.display_name || '');
      if (data.address) {
        setCity(data.address.city || data.address.town || data.address.village || data.address.county || '');
        setCountry(data.address.country || '');
        setPincode(data.address.postcode || '');
      }
    } else {
      console.warn("⚠️ No data received from map picker");
    }
  };

  const validateStep1 = () => {
    if (!address || !city || !pincode || !country || !phone) {
      alert('Please fill in all mandatory fields (Address, City, Pincode, Country, Phone).');
      return false;
    }
    return true;
  };

  const handleNextStep = () => {
    if (step === 1) {
      if (validateStep1()) {
        setStep(2);
      }
    }
  };

  const handleBackStep = () => {
    if (step === 2) {
      setStep(1);
    }
  };

  const simulatePayment = () => {
    setPaymentStatus('processing');
    
    // Simulate payment processing
    setTimeout(() => {
      setPaymentStatus('success');
      setTimeout(() => {
        setStep(3); // Move to Summary step
      }, 1500);
    }, 2000);
  };

  const handleClose = () => {
    const fullAddress = `
${address}
Landmark: ${landmark}
City: ${city}
Pincode: ${pincode}
Country: ${country}
    `.trim();

    onSuccess({ 
      transactionId, 
      method: 'UPI', 
      status: 'confirmed',
      shippingAddress: fullAddress,
      phoneNumber: phone
    });
  };

  return (
    <div className="upi-modal-overlay" onClick={onCancel}>
      <div className="upi-modal" onClick={(e) => e.stopPropagation()}>
        <button className="upi-close" onClick={onCancel}>×</button>
        
        <div className="upi-header">
          <div className="upi-logo">💳</div>
          <h2>
            {step === 1 && "Shipping Details"}
            {step === 2 && "Complete Payment"}
            {step === 3 && "Order Confirmed!"}
          </h2>
          <p>
            {step === 1 && "Please enter your delivery address"}
            {step === 2 && "Scan QR or use UPI ID to pay"}
            {step === 3 && "Thank you for your purchase"}
          </p>
        </div>

        {/* Step 1: Address Details */}
        {step === 1 && (
          <div className="step-container fade-in">
            <div className="payment-details-form">
              <div className="actions-row">
                <button 
                  className="location-btn glossy-btn glossy-btn-secondary"
                  onClick={handleCurrentLocation}
                  disabled={loadingLocation}
                >
                  {loadingLocation ? '📍 Detecting...' : '📍 Current Location'}
                </button>
                
                <button 
                  className="map-btn glossy-btn glossy-btn-secondary"
                  onClick={() => setShowMapPicker(true)}
                >
                  🗺️ Pick on Map
                </button>
              </div>

              <div className="form-group">
                <label>Street Address *</label>
                <textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="House No, Street Name"
                  className="glossy-input"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                    <label>Landmark</label>
                    <input
                      type="text"
                      value={landmark}
                      onChange={(e) => setLandmark(e.target.value)}
                      placeholder="Near Park/School"
                      className="glossy-input"
                    />
                </div>
                <div className="form-group">
                    <label>City *</label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="City"
                      className="glossy-input"
                    />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                    <label>Pincode *</label>
                    <input
                      type="text"
                      value={pincode}
                      onChange={(e) => setPincode(e.target.value)}
                      placeholder="123456"
                      className="glossy-input"
                    />
                </div>
                <div className="form-group">
                    <label>Country *</label>
                    <input
                      type="text"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      placeholder="Country"
                      className="glossy-input"
                    />
                </div>
              </div>

              <div className="form-group">
                <label>Phone Number *</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Enter your contact number"
                  className="glossy-input"
                />
              </div>

              <button className="action-btn glossy-btn-primary" onClick={handleNextStep}>
                Next: Payment ➡️
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Payment */}
        {step === 2 && (
          <div className="step-container fade-in">
            {paymentStatus === 'pending' && (
              <>
                <div className="upi-amount glossy-box">
                  <span>Amount to Pay</span>
                  <div className="amount-value">₹{amount.toFixed(2)}</div>
                </div>

                <div className="upi-timer">
                  <span>⏱️ Time Remaining: {formatTime(timer)}</span>
                </div>

                <div className="upi-qr-section">
                  <div className="qr-container glossy-box">
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
                  <div className="upi-id-display glossy-box">
                    <span>{upiId}</span>
                    <button className="copy-btn" onClick={() => navigator.clipboard.writeText(upiId)}>
                      📋 Copy
                    </button>
                  </div>
                </div>

                <div className="upi-apps">
                  <p>Pay using:</p>
                  <div className="app-icons">
                    <div className="app-icon glossy-box">📱 GPay</div>
                    <div className="app-icon glossy-box">📱 PhonePe</div>
                    <div className="app-icon glossy-box">📱 Paytm</div>
                    <div className="app-icon glossy-box">📱 BHIM</div>
                  </div>
                </div>

                <div className="actions-row payment-actions">
                  <button className="action-btn glossy-btn-secondary" onClick={handleBackStep}>
                    ⬅️ Back
                  </button>
                  <button 
                    className="action-btn glossy-btn-primary" 
                    onClick={simulatePayment}
                  >
                    🧪 Simulate Payment
                  </button>
                </div>
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
                <p>Redirecting to summary...</p>
              </div>
            )}

            {paymentStatus === 'failed' && (
              <div className="payment-failed">
                <div className="failed-icon">✕</div>
                <h3>Payment Timeout</h3>
                <p>Please try again</p>
                <button className="retry-btn glossy-btn-primary" onClick={() => { setPaymentStatus('pending'); setTimer(300); }}>
                  Retry Payment
                </button>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Order Summary */}
        {step === 3 && (
          <div className="step-container fade-in">
            <div className="order-summary glossy-box">
              <div className="success-icon-small">🎉</div>
              <h3>Order Placed Successfully!</h3>
              
              <div className="summary-details">
                <div className="summary-row">
                  <span>Transaction ID:</span>
                  <strong>{transactionId}</strong>
                </div>
                <div className="summary-row">
                  <span>Amount Paid:</span>
                  <strong>₹{amount.toFixed(2)}</strong>
                </div>
                <div className="summary-row">
                  <span>Delivery To:</span>
                  <p>{address}, {city}, {pincode}, {country}</p>
                </div>
                <div className="summary-row">
                  <span>Contact:</span>
                  <strong>{phone}</strong>
                </div>
              </div>

              <button className="action-btn glossy-btn-primary" onClick={handleClose}>
                Close & Continue Shopping
              </button>
            </div>
          </div>
        )}

      </div>
      
      {showMapPicker && (
        <LocationPicker 
          onConfirm={handleMapLocationConfirm}
          onCancel={() => setShowMapPicker(false)}
        />
      )}
    </div>
  );
}

export default UpiPayment;
