import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import './Navbar.css';

function Navbar() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="nav-container">
        <Link to="/" className="nav-logo">
          🛒 Shopping Cart
        </Link>

        <div className="nav-menu">
          <Link to="/" className="nav-link">
            🏠 Home
          </Link>
          <Link to="/cart" className="nav-link">
            🛒 Cart
          </Link>
          <Link to="/orders" className="nav-link">
            📦 My Orders
          </Link>
          <Link to="/profile" className="nav-link">
            👤 Profile
          </Link>
          {user?.isAdmin && (
            <Link to="/admin" className="nav-link admin-link">
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
