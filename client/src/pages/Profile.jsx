import { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import Navbar from '../components/Navbar';
import './Profile.css';

// 3D Emoji Avatar Options
const AVATAR_OPTIONS = [
  { id: 'default', emoji: '👤', label: 'Default' },
  { id: 'smile', emoji: '😊', label: 'Smile' },
  { id: 'cool', emoji: '😎', label: 'Cool' },
  { id: 'star', emoji: '🌟', label: 'Star' },
  { id: 'heart', emoji: '💜', label: 'Heart' },
  { id: 'fire', emoji: '🔥', label: 'Fire' },
  { id: 'rocket', emoji: '🚀', label: 'Rocket' },
  { id: 'crown', emoji: '👑', label: 'Crown' },
  { id: 'ninja', emoji: '🥷', label: 'Ninja' },
  { id: 'robot', emoji: '🤖', label: 'Robot' },
  { id: 'alien', emoji: '👽', label: 'Alien' },
  { id: 'unicorn', emoji: '🦄', label: 'Unicorn' },
  { id: 'dragon', emoji: '🐉', label: 'Dragon' },
  { id: 'cat', emoji: '🐱', label: 'Cat' },
  { id: 'dog', emoji: '🐶', label: 'Dog' },
  { id: 'panda', emoji: '🐼', label: 'Panda' },
];

function Profile() {
  const { user, updateUser } = useAuth();
  const { theme, toggleTheme, liveBackgroundEnabled, toggleLiveBackground } = useTheme();
  const navigate = useNavigate();
  const toast = useToast();
  const fileInputRef = useRef(null);

  // Edit states
  const [isEditing, setIsEditing] = useState(false);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [editForm, setEditForm] = useState({
    username: user?.username || '',
    phoneNumber: user?.phoneNumber || '',
    address: user?.address || ''
  });
  const [saving, setSaving] = useState(false);

  // Avatar state - stored locally or from user
  const [selectedAvatar, setSelectedAvatar] = useState(
    localStorage.getItem('userAvatar') || 'default'
  );
  const [customImage, setCustomImage] = useState(
    localStorage.getItem('userCustomImage') || null
  );

  // Email change states
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [emailOtp, setEmailOtp] = useState('');
  const [emailStep, setEmailStep] = useState('request'); // 'request' or 'verify'
  const [emailLoading, setEmailLoading] = useState(false);
  const [fallbackOtp, setFallbackOtp] = useState(null);

  const getCurrentAvatar = () => {
    if (customImage) return null; // Will show image
    const avatar = AVATAR_OPTIONS.find(a => a.id === selectedAvatar);
    return avatar?.emoji || user?.username?.charAt(0).toUpperCase() || 'U';
  };

  const handleAvatarSelect = (avatarId) => {
    setSelectedAvatar(avatarId);
    setCustomImage(null);
    localStorage.setItem('userAvatar', avatarId);
    localStorage.removeItem('userCustomImage');
    setShowAvatarPicker(false);
    toast.success('Avatar updated! 🎉');
  };

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error('Image must be less than 2MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setCustomImage(reader.result);
        localStorage.setItem('userCustomImage', reader.result);
        setShowAvatarPicker(false);
        toast.success('Profile picture updated! 📸');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEditChange = (e) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Call API to update user profile
      const result = await api.updateProfile(editForm);
      if (result.error) {
        toast.error(result.error);
      } else if (result.user) {
        updateUser(result.user);
        // Update the edit form with new values
        setEditForm({
          username: result.user.username || '',
          phoneNumber: result.user.phoneNumber || '',
          address: result.user.address || ''
        });
        toast.success('Profile updated successfully! ✨');
        setIsEditing(false);
      } else {
        toast.error('Unexpected response from server');
      }
    } catch (error) {
      console.error('Failed to update profile:', error);
      toast.error('Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditForm({
      username: user?.username || '',
      phoneNumber: user?.phoneNumber || '',
      address: user?.address || ''
    });
    setIsEditing(false);
  };

  // Email change handlers
  const handleRequestEmailChange = async () => {
    if (!newEmail || !newEmail.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }
    
    setEmailLoading(true);
    try {
      const result = await api.requestEmailChange(newEmail);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success('Verification code sent to your current email! 📧');
        setEmailStep('verify');
        if (result.fallbackOtp) {
          setFallbackOtp(result.fallbackOtp);
        }
      }
    } catch (error) {
      console.error('Email change request failed:', error);
      toast.error('Failed to send verification code');
    } finally {
      setEmailLoading(false);
    }
  };

  const handleConfirmEmailChange = async () => {
    if (!emailOtp || emailOtp.length !== 6) {
      toast.error('Please enter the 6-digit verification code');
      return;
    }
    
    setEmailLoading(true);
    try {
      const result = await api.confirmEmailChange(emailOtp);
      if (result.error) {
        toast.error(result.error);
      } else if (result.user) {
        updateUser(result.user);
        toast.success('Email updated successfully! 🎉');
        setShowEmailModal(false);
        setEmailStep('request');
        setNewEmail('');
        setEmailOtp('');
        setFallbackOtp(null);
      }
    } catch (error) {
      console.error('Email change confirm failed:', error);
      toast.error('Failed to verify code');
    } finally {
      setEmailLoading(false);
    }
  };

  const closeEmailModal = () => {
    setShowEmailModal(false);
    setEmailStep('request');
    setNewEmail('');
    setEmailOtp('');
    setFallbackOtp(null);
  };

  return (
    <div className="profile-page">
      <Navbar />
      
      <div className="profile-container">
        <div className="page-header">
          <h1><span className="emoji">👤</span> My Account</h1>
          <p>Manage your profile and preferences</p>
        </div>

        {/* Dashboard Grid */}
        <div className="profile-grid">
          
          {/* Left Column - User Info */}
          <div className="profile-sidebar">
            {/* User Card */}
            <div className="profile-user-card">
              <div 
                className="user-avatar clickable"
                onClick={() => setShowAvatarPicker(true)}
                title="Click to change avatar"
              >
                {customImage ? (
                  <img src={customImage} alt="Profile" className="avatar-image" />
                ) : (
                  <span className="avatar-emoji">{getCurrentAvatar()}</span>
                )}
                <div className="avatar-edit-overlay">
                  <span>✏️</span>
                </div>
              </div>
              <h2 className="user-name">{user?.username || 'User'}</h2>
              <p className="user-email">{user?.email}</p>
              <div className="user-badges">
                {user?.isAdmin ? (
                  <span className="profile-badge badge-admin">👑 Admin</span>
                ) : (
                  <span className="profile-badge badge-user">👤 Member</span>
                )}
                {user?.isVerified ? (
                  <span className="profile-badge badge-verified">✓ Verified</span>
                ) : (
                  <span className="profile-badge badge-unverified">⚠ Unverified</span>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="profile-card quick-actions">
              <h3><span className="emoji">⚡</span> Quick Actions</h3>
              <button onClick={() => navigate('/orders')} className="action-card">
                <span className="action-icon">📦</span>
                <span className="action-text">View Orders</span>
                <span className="action-arrow">→</span>
              </button>
              <button onClick={() => navigate('/cart')} className="action-card">
                <span className="action-icon">🛒</span>
                <span className="action-text">My Cart</span>
                <span className="action-arrow">→</span>
              </button>
              <button onClick={() => navigate('/')} className="action-card">
                <span className="action-icon">🏠</span>
                <span className="action-text">Continue Shopping</span>
                <span className="action-arrow">→</span>
              </button>
            </div>
          </div>

          {/* Right Column - Details */}
          <div className="profile-main">
            {/* Account Details */}
            <div className="profile-card">
              <div className="card-header">
                <h3><span className="emoji">📋</span> Account Details</h3>
                {!isEditing ? (
                  <button className="edit-btn" onClick={() => setIsEditing(true)}>
                    ✏️ Edit
                  </button>
                ) : (
                  <div className="edit-actions">
                    <button className="save-btn" onClick={handleSave} disabled={saving}>
                      {saving ? '...' : '✓ Save'}
                    </button>
                    <button className="cancel-btn" onClick={handleCancel}>
                      ✗ Cancel
                    </button>
                  </div>
                )}
              </div>
              
              <div className="details-grid">
                <div className="detail-item">
                  <span className="detail-label">Username</span>
                  {isEditing ? (
                    <input
                      type="text"
                      name="username"
                      value={editForm.username}
                      onChange={handleEditChange}
                      className="edit-input"
                    />
                  ) : (
                    <span className="detail-value">{user?.username || 'N/A'}</span>
                  )}
                </div>
                <div className="detail-item">
                  <span className="detail-label">Email</span>
                  <div className="email-with-change">
                    <span className="detail-value">{user?.email || 'N/A'}</span>
                    <button 
                      className="change-email-btn"
                      onClick={() => setShowEmailModal(true)}
                      title="Change email"
                    >
                      ✏️
                    </button>
                  </div>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Phone</span>
                  {isEditing ? (
                    <input
                      type="tel"
                      name="phoneNumber"
                      value={editForm.phoneNumber}
                      onChange={handleEditChange}
                      className="edit-input"
                      placeholder="Enter phone number"
                    />
                  ) : (
                    <span className="detail-value">{user?.phoneNumber || 'Not provided'}</span>
                  )}
                </div>
                <div className="detail-item">
                  <span className="detail-label">Member Since</span>
                  <span className="detail-value">December 1, 2024</span>
                </div>
              </div>
            </div>

            {/* Address */}
            <div className="profile-card">
              <div className="card-header">
                <h3><span className="emoji">📍</span> Shipping Address</h3>
                {!isEditing && (
                  <button className="edit-btn" onClick={() => setIsEditing(true)}>
                    ✏️ Edit
                  </button>
                )}
              </div>
              <div className="address-box">
                {isEditing ? (
                  <textarea
                    name="address"
                    value={editForm.address}
                    onChange={handleEditChange}
                    className="edit-textarea"
                    rows={3}
                  />
                ) : (
                  <p style={{ whiteSpace: 'pre-line' }}>
                    {user?.address || 'No address saved. Click Edit to add your shipping address.'}
                  </p>
                )}
              </div>
            </div>

            {/* Settings */}
            <div className="profile-card">
              <h3><span className="emoji">⚙️</span> Settings & Preferences</h3>
              <div className="settings-grid">
                <div className="setting-item">
                  <div className="setting-info">
                    <span className="setting-icon">🎨</span>
                    <div>
                      <span className="setting-label">App Theme</span>
                      <span className="setting-desc">Switch between light and dark mode</span>
                    </div>
                  </div>
                  <button 
                    onClick={toggleTheme}
                    className={`toggle-btn ${theme === 'dark' ? 'active' : 'inactive'}`}
                  >
                    {theme === 'dark' ? '🌙 Dark' : '☀️ Light'}
                  </button>
                </div>
                
                <div className="setting-item">
                  <div className="setting-info">
                    <span className="setting-icon">✨</span>
                    <div>
                      <span className="setting-label">Live Background</span>
                      <span className="setting-desc">Animated sakura petals effect</span>
                    </div>
                  </div>
                  <button 
                    onClick={toggleLiveBackground}
                    className={`toggle-btn ${liveBackgroundEnabled ? 'active' : 'inactive'}`}
                  >
                    {liveBackgroundEnabled ? '✓ On' : '✗ Off'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Avatar Picker Modal */}
      {showAvatarPicker && (
        <div className="modal-overlay" onClick={() => setShowAvatarPicker(false)}>
          <div className="avatar-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Choose Your Avatar</h2>
              <button className="close-btn" onClick={() => setShowAvatarPicker(false)}>✕</button>
            </div>
            
            <div className="avatar-section">
              <h4><span className="emoji">📸</span> Upload Photo</h4>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageUpload}
                accept="image/*"
                style={{ display: 'none' }}
              />
              <button 
                className="upload-btn"
                onClick={() => fileInputRef.current?.click()}
              >
                📤 Upload Image
              </button>
              <p className="upload-hint">Max 2MB • JPG, PNG, GIF</p>
            </div>

            <div className="avatar-divider">
              <span>or choose an emoji</span>
            </div>

            <div className="avatar-section">
              <h4><span className="emoji">🎨</span> Emoji Avatars</h4>
              <div className="avatar-grid">
                {AVATAR_OPTIONS.map((avatar) => (
                  <button
                    key={avatar.id}
                    className={`avatar-option ${selectedAvatar === avatar.id && !customImage ? 'selected' : ''}`}
                    onClick={() => handleAvatarSelect(avatar.id)}
                    title={avatar.label}
                  >
                    <span className="avatar-option-emoji">{avatar.emoji}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImageUpload}
        accept="image/*"
        style={{ display: 'none' }}
      />

      {/* Email Change Modal */}
      {showEmailModal && (
        <div className="modal-overlay" onClick={closeEmailModal}>
          <div className="email-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>📧 Change Email</h2>
              <button className="close-btn" onClick={closeEmailModal}>✕</button>
            </div>

            {emailStep === 'request' ? (
              <div className="email-change-step">
                <p className="modal-info">
                  A verification code will be sent to your <strong>current email</strong> ({user?.email}) to confirm this change.
                </p>
                <div className="form-group">
                  <label>New Email Address</label>
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="Enter new email address"
                    className="edit-input"
                  />
                </div>
                <button 
                  className="submit-btn"
                  onClick={handleRequestEmailChange}
                  disabled={emailLoading}
                >
                  {emailLoading ? 'Sending...' : 'Send Verification Code'}
                </button>
              </div>
            ) : (
              <div className="email-change-step">
                <p className="modal-info">
                  Enter the 6-digit verification code sent to <strong>{user?.email}</strong>
                </p>
                {fallbackOtp && (
                  <div className="fallback-otp-box">
                    <p>⚠️ Email failed to send. Use this code:</p>
                    <span className="fallback-code">{fallbackOtp}</span>
                  </div>
                )}
                <div className="form-group">
                  <label>Verification Code</label>
                  <input
                    type="text"
                    value={emailOtp}
                    onChange={(e) => setEmailOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="Enter 6-digit code"
                    className="edit-input otp-input"
                    maxLength={6}
                  />
                </div>
                <div className="modal-actions">
                  <button 
                    className="back-btn"
                    onClick={() => setEmailStep('request')}
                  >
                    ← Back
                  </button>
                  <button 
                    className="submit-btn"
                    onClick={handleConfirmEmailChange}
                    disabled={emailLoading}
                  >
                    {emailLoading ? 'Verifying...' : 'Confirm Change'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Profile;
