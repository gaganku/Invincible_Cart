import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import './Profile.css';

function Profile() {
  const { user } = useAuth();

  return (
    <div className="profile-page">
      <Navbar />
      
      <div className="profile-container">
        <div className="page-header">
          <h1>👤 My Profile</h1>
          <p>View your account details</p>
        </div>

        <div className="profile-card">
          <div className="profile-header">
             <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{user?.username || 'User'}</h1>
             <p className="profile-subtitle">{user?.email}</p>
          </div>

          <div className="profile-info">
            <div className="info-row">
              <span className="info-label">Username</span>
              <span className="info-value">{user?.username || 'N/A'}</span>
            </div>

            <div className="info-row">
              <span className="info-label">Email Address</span>
              <span className="info-value">{user?.email || 'N/A'}</span>
            </div>

            <div className="info-row">
              <span className="info-label">Phone Number</span>
              <span className="info-value">{user?.phoneNumber || 'Not provided'}</span>
            </div>

            <div className="info-row">
              <span className="info-label">Account Status</span>
              <div className="info-value">
                {user?.isAdmin ? (
                  <span className="profile-badge badge-admin">Admin Access</span>
                ) : (
                  <span className="profile-badge badge-user">Standard User</span>
                )}
              </div>
            </div>

            <div className="info-row">
              <span className="info-label">Verification</span>
              <div className="info-value">
                {user?.isVerified ? (
                  <span className="profile-badge badge-verified">Verified</span>
                ) : (
                  <span className="profile-badge badge-unverified">Unverified</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;
