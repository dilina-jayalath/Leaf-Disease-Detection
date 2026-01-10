import React from 'react';
import { Search, Bell, Settings, Menu } from 'lucide-react';
import './Header.css';

const Header = ({ title, onMenuClick }) => {
    return (
        <header className="header">
            <div className="header-left">
                <button className="menu-btn" onClick={onMenuClick}>
                    <Menu size={24} color="#1B261C" />
                </button>
                <div className="header-title">
                    <h2>{title}</h2>
                </div>
            </div>
            <div className="header-actions">
                <div className="search-bar">
                    <Search size={18} color="#9e9e9e" />
                    <input type="text" placeholder="Search anything..." />
                </div>
                <button className="action-btn">
                    <Bell size={20} color="#5e6d62" />
                </button>
                <button className="action-btn">
                    <Settings size={20} color="#5e6d62" />
                </button>
            </div>
        </header>
    );
};

export default Header;
