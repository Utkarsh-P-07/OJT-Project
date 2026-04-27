import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import './ProfileBadge.css';

const ProfileBadge = () => {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);

  const initials = user?.name
    ? user.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  return (
    <div className="profile-badge">
      {open && (
        <div className="profile-popup">
          <div className="profile-popup-name">{user?.name}</div>
          <div className="profile-popup-email">{user?.email}</div>
          <hr className="profile-divider" />
          <button className="logout-btn" onClick={logout}>Sign Out</button>
        </div>
      )}
      <button className="profile-trigger" onClick={() => setOpen(o => !o)}>
        <span className="avatar">{initials}</span>
        <span className="profile-name">{user?.name}</span>
      </button>
    </div>
  );
};

export default ProfileBadge;
