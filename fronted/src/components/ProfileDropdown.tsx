import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import './ProfileDropdown.css';
import './LoginModal.css'; // Import modal styles for shared modal components

interface ProfileDropdownProps {
  user: {
    name: string;
    email: string;
    picture?: string;
  };
}

const ProfileDropdown = ({ user }: ProfileDropdownProps) => {
  const { logout, updateUser } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleLogout = () => {
    logout();
    setIsOpen(false);
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <>
      <div className="profile-dropdown" ref={dropdownRef}>
        <button
          className="profile-button"
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Profile menu"
        >
          {user.picture ? (
            <img src={user.picture} alt={user.name} className="profile-avatar" />
          ) : (
            <div className="profile-avatar-placeholder">
              {getInitials(user.name)}
            </div>
          )}
          <span className="profile-name">{user.name}</span>
          <svg
            className={`dropdown-arrow ${isOpen ? 'open' : ''}`}
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M2 4L6 8L10 4"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        {isOpen && (
          <div className="dropdown-menu">
            <div className="dropdown-header">
              <div className="user-info">
                <div className="user-name">{user.name}</div>
                <div className="user-email">{user.email}</div>
              </div>
            </div>

            <div className="dropdown-divider"></div>

            <button
              className="dropdown-item"
              onClick={() => {
                setShowAccountModal(true);
                setIsOpen(false);
              }}
            >
              <svg
                className="dropdown-icon"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              Account
            </button>

            <button
              className="dropdown-item"
              onClick={() => {
                setShowChangePasswordModal(true);
                setIsOpen(false);
              }}
            >
              <svg
                className="dropdown-icon"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              Change Password
            </button>

            <div className="dropdown-divider"></div>

            <button className="dropdown-item logout" onClick={handleLogout}>
              <svg
                className="dropdown-icon"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              Logout
            </button>
          </div>
        )}
      </div>

      {/* Account Modal */}
      {showAccountModal && (
        <div className="modal-overlay" onClick={() => setShowAccountModal(false)}>
          <div className="modal-content account-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowAccountModal(false)}>
              &times;
            </button>
            <div className="modal-header">
              <h2>Account Settings</h2>
            </div>
            <div className="modal-body">
              <div className="account-info">
                <div className="account-avatar-section">
                  {user.picture ? (
                    <img src={user.picture} alt={user.name} className="account-avatar" />
                  ) : (
                    <div className="account-avatar-placeholder">
                      {getInitials(user.name)}
                    </div>
                  )}
                  <button className="change-avatar-btn">Change Photo</button>
                </div>

                <div className="form-group">
                  <label htmlFor="account-name">Full Name</label>
                  <input
                    type="text"
                    id="account-name"
                    defaultValue={user.name}
                    placeholder="Enter your name"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="account-email">Email</label>
                  <input
                    type="email"
                    id="account-email"
                    defaultValue={user.email}
                    disabled
                  />
                  <small className="form-help">Email cannot be changed</small>
                </div>

                <div className="modal-actions">
                  <button className="secondary-btn" onClick={() => setShowAccountModal(false)}>
                    Cancel
                  </button>
                  <button
                    className="primary-btn"
                    onClick={() => {
                      const nameInput = document.getElementById(
                        'account-name'
                      ) as HTMLInputElement;
                      if (nameInput && nameInput.value) {
                        updateUser({ name: nameInput.value });
                      }
                      setShowAccountModal(false);
                    }}
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {showChangePasswordModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowChangePasswordModal(false)}
        >
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="modal-close"
              onClick={() => setShowChangePasswordModal(false)}
            >
              &times;
            </button>
            <div className="modal-header">
              <h2>Change Password</h2>
              <p>Enter your new password</p>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label htmlFor="current-password">Current Password</label>
                <input
                  type="password"
                  id="current-password"
                  placeholder="Enter current password"
                />
              </div>

              <div className="form-group">
                <label htmlFor="new-password">New Password</label>
                <input
                  type="password"
                  id="new-password"
                  placeholder="Enter new password"
                />
              </div>

              <div className="form-group">
                <label htmlFor="confirm-password">Confirm New Password</label>
                <input
                  type="password"
                  id="confirm-password"
                  placeholder="Confirm new password"
                />
              </div>

              <div className="modal-actions">
                <button
                  className="secondary-btn"
                  onClick={() => setShowChangePasswordModal(false)}
                >
                  Cancel
                </button>
                <button
                  className="primary-btn"
                  onClick={() => {
                    // Password change logic would go here
                    alert('Password change functionality would be implemented with backend');
                    setShowChangePasswordModal(false);
                  }}
                >
                  Update Password
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ProfileDropdown;

