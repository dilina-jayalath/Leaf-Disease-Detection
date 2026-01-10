import React from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import './Layout.css';

const Layout = ({ children, title = "Dashboard" }) => {
    const [sidebarOpen, setSidebarOpen] = React.useState(false);

    const toggleSidebar = () => {
        setSidebarOpen(!sidebarOpen);
    };

    return (
        <div className="dashboard-layout">
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
            <div className="main-wrapper">
                <Header title={title} onMenuClick={toggleSidebar} />
                <main className="content-area">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default Layout;
