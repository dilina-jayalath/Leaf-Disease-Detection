import React, { useEffect, useState } from 'react';
import { Search, Bell, Settings, Menu } from 'lucide-react';
import { useLocation, useSearchParams } from 'react-router-dom';
import './Header.css';

const Header = ({ title, onMenuClick }) => {
    const location = useLocation();
    const [searchParams, setSearchParams] = useSearchParams();
    const [searchValue, setSearchValue] = useState(searchParams.get('search') || '');

    const isSearchPage = location.pathname === '/' || location.pathname === '/diseases';
    const searchPlaceholder = location.pathname === '/'
        ? 'Search assessments by disease, note, or description...'
        : 'Search diseases by name or description...';

    useEffect(() => {
        if (!isSearchPage) {
            setSearchValue('');
            return;
        }

        setSearchValue(searchParams.get('search') || '');
    }, [isSearchPage, searchParams]);

    const handleSearchChange = (event) => {
        const nextValue = event.target.value;
        const nextParams = new URLSearchParams(searchParams);

        setSearchValue(nextValue);

        if (nextValue.trim()) {
            nextParams.set('search', nextValue);
        } else {
            nextParams.delete('search');
        }

        setSearchParams(nextParams, { replace: true });
    };

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
                {isSearchPage && (
                    <div className="search-bar">
                        <Search size={18} color="#9e9e9e" />
                        <input
                            type="text"
                            value={searchValue}
                            onChange={handleSearchChange}
                            placeholder={searchPlaceholder}
                        />
                    </div>
                )}
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
