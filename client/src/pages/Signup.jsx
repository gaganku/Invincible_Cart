import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api';
import './Auth.css';

function Signup() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    phoneNumber: ''
  });
  const [otp, setOtp] = useState('');
  const [show2FA, setShow2FA] = useState(false);
  const [fallbackOtp, setFallbackOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await api.signup(formData);
      
      if (data.error) {
        setError(data.error);
      } else if (data.require2FA) {
        setShow2FA(true);
        if (data.fallbackOtp) {
          setFallbackOtp(data.fallbackOtp);
        }
      }
    } catch (err) {
      setError('Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify2FA = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await api.verify2FA(otp);
      
      if (data.error) {
        setError(data.error);
      } else if (data.message) {
        navigate('/login');
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
          <h2>{show2FA ? 'Verify Email' : 'Create Account'}</h2>
          <p>{show2FA ? `Enter the code sent to ${formData.email}` : 'Join us to start shopping'}</p>
        </div>

        {!show2FA ? (
          <form onSubmit={handleSignup} className="auth-form">
            <div className="form-group">
              <label htmlFor="username">Username</label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="Choose a username"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="your.email@example.com"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Create a strong password"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="phoneNumber">Phone Number (Optional)</label>
              <input
                type="tel"
                id="phoneNumber"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
                placeholder="+1234567890"
              />
            </div>

            {error && <div className="error-message">{error}</div>}

            <button type="submit" className="submit-button" disabled={loading}>
              {loading ? <div className="loading-spinner" style={{ margin: '0 auto' }}></div> : 'Create Account'}
            </button>

            <div className="auth-footer">
              Already have an account? <Link to="/login">Sign in</Link>
            </div>
          </form>
        ) : (
          <form onSubmit={handleVerify2FA} className="auth-form">
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
              {loading ? <div className="loading-spinner" style={{ margin: '0 auto' }}></div> : 'Verify & Create Account'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default Signup;
