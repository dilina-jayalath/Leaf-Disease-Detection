import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Leaf, MessageSquare, Flower2 } from 'lucide-react';
import './Sidebar.css';

const Sidebar = () => {
    return (
        <aside className="sidebar">
            <div className="sidebar-logo">
                <div className="logo-icon">
                    <Leaf size={24} strokeWidth={2.5} />
                </div>
                <div className="logo-text">VerdantEye</div>
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
                    <NavLink to="/chat" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                        <MessageSquare size={20} className="nav-icon" />
                        Assistant
                    </NavLink>
                </div>
            </nav>

            <div className="sidebar-footer">
                <div className="user-profile">
                    <div className="user-avatar"></div>
                    <div className="user-info">
                        <h4>Admin User</h4>
                        <span>admin@verdanteye.com</span>
                    </div>
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;
