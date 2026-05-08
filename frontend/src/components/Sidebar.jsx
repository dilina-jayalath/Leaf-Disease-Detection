import React, { useContext } from 'react';
import { NavLink } from 'react-router-dom';
import {
  BookOpenCheck,
  LayoutDashboard,
  Leaf,
  LogOut,
  MessageSquare,
  ScanLine,
  UserRound,
  X,
} from 'lucide-react';
import AuthContext from '../context/AuthContext';
import './Sidebar.css';

const getInitials = (name) => {
  if (!name) return 'U';
  const parts = name.trim().split(/\s+/);
  if (parts.length > 1) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
};

const Sidebar = ({ isOpen, onClose }) => {
  const { user, logoutUser } = useContext(AuthContext);
  const username = user?.username || 'User';

  return (
    <>
      <div className={`sidebar-overlay ${isOpen ? 'open' : ''}`} onClick={onClose} />
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <div className="logo-icon">
            <Leaf size={22} strokeWidth={2.5} />
          </div>
          <div>
            <div className="logo-text">VerdantEye</div>
            <div className="logo-caption">Plant diagnostics</div>
          </div>
          <button className="close-btn" onClick={onClose} aria-label="Close navigation">
            <X size={22} />
          </button>
        </div>

        <nav className="sidebar-nav" aria-label="Main navigation">
          <NavLink to="/" end className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <LayoutDashboard size={19} className="nav-icon" />
            <span>Dashboard</span>
          </NavLink>
          <NavLink to="/diseases" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <BookOpenCheck size={19} className="nav-icon" />
            <span>Disease Library</span>
          </NavLink>
          <NavLink to="/identify" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <ScanLine size={19} className="nav-icon" />
            <span>Identify</span>
          </NavLink>
          <NavLink to="/chat" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <MessageSquare size={19} className="nav-icon" />
            <span>Assistant</span>
          </NavLink>
        </nav>

        <div className="sidebar-footer">
          <NavLink to="/profile" className="user-profile-link">
            <div className="user-avatar">{getInitials(username)}</div>
            <div className="user-info">
              <h4>{username}</h4>
              <span>Account settings</span>
            </div>
            <UserRound size={18} className="profile-cue" />
          </NavLink>
          <button onClick={logoutUser} className="logout-btn">
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
