import React from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import './Layout.css';

const Layout = ({ children, title = "Dashboard" }) => {
    return (
        <div className="dashboard-layout">
            <Sidebar />
            <div className="main-wrapper">
                <Header title={title} />
                <main className="content-area">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default Layout;
