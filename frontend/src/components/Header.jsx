import React from 'react';
import { Bell, Menu, Moon, Search, ShieldCheck, Sun } from 'lucide-react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { useThemeMode } from '../context/themeMode';
import './Header.css';

const Header = ({ title, onMenuClick }) => {
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { mode, toggleTheme } = useThemeMode();

  const isSearchPage = location.pathname === '/' || location.pathname === '/diseases';
  const searchValue = isSearchPage ? searchParams.get('search') || '' : '';
  const searchPlaceholder =
    location.pathname === '/'
      ? 'Search assessments, notes, or disease names'
      : 'Search diseases by name or description';

  const handleSearchChange = (event) => {
    const nextValue = event.target.value;
    const nextParams = new URLSearchParams(searchParams);

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
        <button className="menu-btn" onClick={onMenuClick} aria-label="Open navigation">
          <Menu size={22} />
        </button>
        <div className="header-title">
          <span className="header-kicker">Corn Health Workspace</span>
          <h1>{title}</h1>
        </div>
      </div>

      <div className="header-actions">
        {isSearchPage && (
          <label className="search-bar">
            <Search size={18} />
            <input
              type="text"
              value={searchValue}
              onChange={handleSearchChange}
              placeholder={searchPlaceholder}
            />
          </label>
        )}
        <button className="action-btn" aria-label="System status">
          <ShieldCheck size={20} />
        </button>
        <button
          className="action-btn"
          onClick={toggleTheme}
          aria-label={mode === 'light' ? 'Switch to dark theme' : 'Switch to light theme'}
          title={mode === 'light' ? 'Dark theme' : 'Light theme'}
        >
          {mode === 'light' ? <Moon size={20} /> : <Sun size={20} />}
        </button>
        <button className="action-btn" aria-label="Notifications">
          <Bell size={20} />
        </button>
      </div>
    </header>
  );
};

export default Header;
