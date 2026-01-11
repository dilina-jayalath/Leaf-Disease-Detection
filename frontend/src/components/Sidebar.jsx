import React, { useContext } from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Leaf, MessageSquare, Flower2, ScanLine, X, LogOut } from 'lucide-react';
import AuthContext from '../context/AuthContext';
import './Sidebar.css';

const Sidebar = ({ isOpen, onClose }) => {
    let { user, logoutUser } = useContext(AuthContext);

    return (
        <>
            <div className={`sidebar-overlay ${isOpen ? 'open' : ''}`} onClick={onClose}></div>
            <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
                <div className="sidebar-logo">
                    <div className="logo-icon">
                        <Leaf size={24} strokeWidth={2.5} />
                    </div>
                    <div className="logo-text">VerdantEye</div>
                    <button className="close-btn" onClick={onClose}>
                        <X size={24} color="#5e6d62" />
                    </button>
                </div>

                <nav className="sidebar-nav">
                    <div className="nav-section">
                        <NavLink to="/" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                            <LayoutDashboard size={20} className="nav-icon" />
                            Dashboard
                        </NavLink>
                        <NavLink to="/diseases" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                            <Flower2 size={20} className="nav-icon" />
                            Diseases
                        </NavLink>
                        <NavLink to="/identify" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                            <ScanLine size={20} className="nav-icon" />
                            Identify
                        </NavLink>
                        <NavLink to="/chat" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                            <MessageSquare size={20} className="nav-icon" />
                            Assistant
                        </NavLink>
                    </div>
                </nav>

                <div className="sidebar-footer">
                    <div className="user-profile">
                        <div className="user-avatar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#e2e8f0', color: '#64748b', fontWeight: 'bold' }}>
                            {user && user.username ? user.username.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div className="user-info">
                            <h4>{user ? user.username : 'User'}</h4>
                            <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Active Now</span>
                        </div>
                        <button onClick={logoutUser} className="logout-btn" title="Logout" style={{ background: 'none', border: 'none', cursor: 'pointer', marginLeft: 'auto', color: '#ef4444' }}>
                            <LogOut size={20} />
                        </button>
                    </div>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;
