import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { ThemeProvider } from './context/ThemeContext';
import { useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Home from './pages/Home';
import GoogleOTP from './pages/GoogleOTP';
import GoogleComplete from './pages/GoogleComplete';
import Profile from './pages/Profile';
import Cart from './pages/Cart';
import Orders from './pages/Orders';
import Admin from './pages/Admin';
import SquareBot from './components/SquareBot';
import './App.css';
import './theme.css';

// Protected Route Component
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div className="loading-spinner">Loading...</div>;
  }
  
  return user ? children : <Navigate to="/login" />;
}

// Admin Route Component
function AdminRoute({ children }) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div className="loading-spinner">Loading...</div>;
  }
  
  return user && user.isAdmin ? children : <Navigate to="/" />;
}

function App() {
  return (
    <Router>
      <ThemeProvider>
        <ToastProvider>
          <AuthProvider>
        <div className="app">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/google-otp" element={<GoogleOTP />} />
            <Route path="/google-complete" element={<GoogleComplete />} />
            
            <Route path="/" element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            } />
            
            <Route path="/profile" element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } />
            
            <Route path="/cart" element={
              <ProtectedRoute>
                <Cart />
              </ProtectedRoute>
            } />
            
            <Route path="/orders" element={
              <ProtectedRoute>
                <Orders />
              </ProtectedRoute>
            } />
            
            <Route path="/admin" element={
              <AdminRoute>
                <Admin />
              </AdminRoute>
            } />
          </Routes>
           <SquareBot /> 
        </div>
      </AuthProvider>
    </ToastProvider>
  </ThemeProvider>
    </Router>
  );
}

export default App;
