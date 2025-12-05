import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import './Navbar.css';

function Navbar() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
    setIsMobileMenuOpen(false);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const toggleMobileMenu = () => {
    console.log('Hamburger clicked! Current state:', isMobileMenuOpen);
    setIsMobileMenuOpen(!isMobileMenuOpen);
    console.log('New state will be:', !isMobileMenuOpen);
  };

  return (
    <nav className="navbar">
      <div className="nav-container">
        <Link to="/" className="nav-logo">
          🛒 Shopping Cart
        </Link>

        {/* Hamburger Menu Icon */}
        <button 
          className={`hamburger ${isMobileMenuOpen ? 'active' : ''}`}
          onClick={toggleMobileMenu}
          aria-label="Toggle menu"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>


        <div className={`nav-menu ${isMobileMenuOpen ? 'active' : ''}`}>
          <Link to="/" className="nav-link" onClick={closeMobileMenu}>
            🏠 Home
          </Link>
          <Link to="/cart" className="nav-link" onClick={closeMobileMenu}>
            🛒 Cart
          </Link>
          <Link to="/orders" className="nav-link" onClick={closeMobileMenu}>
            📦 My Orders
          </Link>
          <Link to="/profile" className="nav-link" onClick={closeMobileMenu}>
            👤 Profile
          </Link>
          {user?.isAdmin && (
            <Link to="/admin" className="nav-link admin-link" onClick={closeMobileMenu}>
              ⚡ Admin
            </Link>
          )}
          <button onClick={toggleTheme} className="nav-link theme-toggle" title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}>
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          <button onClick={handleLogout} className="nav-link logout-btn">
            🚪 Logout
          </button>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
