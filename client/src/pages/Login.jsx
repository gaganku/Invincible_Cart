import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import './Auth.css';

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [show2FA, setShow2FA] = useState(false);
  const [fallbackOtp, setFallbackOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await api.login(username, password);
      
      if (data.error) {
        setError(data.error);
      } else if (data.require2FA) {
        setShow2FA(true);
        if (data.fallbackOtp) {
          setFallbackOtp(data.fallbackOtp);
        }
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Login failed. Please try again.');
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
      } else if (data.message && data.username) {
        login({ username: data.username });
        navigate('/');
      }
    } catch (err) {
      setError('Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = 'http://localhost:3000/api/auth/google';
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-header">
          <h1>🛒 Shopping Cart</h1>
          <h2>{show2FA ? 'Verify Identity' : 'Welcome Back'}</h2>
          <p>{show2FA ? 'Enter the code sent to your email' : 'Sign in to continue shopping'}</p>
        </div>

        {!show2FA ? (
          <form onSubmit={handleLogin} className="auth-form">
            <div className="form-group">
              <label htmlFor="username">Username</label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                required
                autoComplete="username"
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                autoComplete="current-password"
              />
            </div>

            {error && <div className="error-message">{error}</div>}

            <button type="submit" className="submit-button" disabled={loading}>
              {loading ? <div className="loading-spinner" style={{ margin: '0 auto' }}></div> : 'Sign In'}
            </button>

            <div className="auth-divider">
              <span>OR</span>
            </div>

            <button type="button" onClick={handleGoogleLogin} className="google-button">
              <svg viewBox="0 0 24 24" width="24" height="24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </button>

            <div className="auth-footer">
              Don't have an account? <Link to="/signup">Sign up</Link>
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
              {loading ? <div className="loading-spinner" style={{ margin: '0 auto' }}></div> : 'Verify Code'}
            </button>

            <button 
              type="button" 
              onClick={() => {
                setShow2FA(false);
                setOtp('');
                setFallbackOtp('');
                setError('');
              }}
              className="auth-button"
              style={{ 
                marginTop: '1rem', 
                background: 'transparent', 
                border: '2px solid rgba(102, 126, 234, 0.5)', 
                color: '#667eea',
                boxShadow: 'none'
              }}
            >
              Back to Login
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default Login;
