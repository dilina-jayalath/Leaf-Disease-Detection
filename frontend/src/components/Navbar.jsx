import React from 'react';
import { Link } from 'react-router-dom';
import './Navbar.css';

const Navbar = () => {
    return (
        <nav className="navbar">
            <div className="navbar-brand">
                <Link to="/">🌿 PlantCare AI</Link>
            </div>
            <div className="navbar-links">
                <Link to="/">Diseases</Link>
                <Link to="/chat">Chatbot</Link>
                {/* <Link to="/admin">Admin</Link> */}
            </div>
        </nav>
    );
};

export default Navbar;
