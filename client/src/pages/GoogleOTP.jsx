import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import './Auth.css';

function GoogleOTP() {
  const [otp, setOtp] = useState('');
  const [fallbackOtp, setFallbackOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  useEffect(() => {
    loadSessionInfo();
  }, []);

  const loadSessionInfo = async () => {
    try {
      const data = await api.getGoogleSessionInfo();
      if (data.fallbackOtp) {
        setFallbackOtp(data.fallbackOtp);
      }
    } catch (error) {
      console.error('Failed to load session info');
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await api.verifyGoogleOTP(otp);
      
      if (data.error) {
        setError(data.error);
      } else if (data.redirect === '/google-complete.html') {
        navigate('/google-complete');
      } else {
        login({username: 'Google User'});
        navigate('/');
      }
    } catch (err) {
      setError('Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-header">
          <h1>🛒 Shopping Cart</h1>
          <h2>Verify Identity</h2>
          <p>Enter the code sent to your email</p>
        </div>

        <form onSubmit={handleVerify} className="auth-form">
          {fallbackOtp && (
            <div className="otp-container">
              <p style={{ marginBottom: '0.5rem', color: '#666' }}><strong>Email not received? Use this code:</strong></p>
              <div className="otp-display">{fallbackOtp}</div>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="otp">Verification Code</label>
            <input
              type="text"
              id="otp"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="Enter 6-digit code"
              maxLength="6"
              required
              autoFocus
              style={{ letterSpacing: '0.5rem', textAlign: 'center', fontSize: '1.5rem' }}
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" className="submit-button" disabled={loading}>
            {loading ? <div className="loading-spinner" style={{ margin: '0 auto' }}></div> : 'Verify Code'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default GoogleOTP;
