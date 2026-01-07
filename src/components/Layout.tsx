import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import './Layout.scss';

const Layout: React.FC = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // Initial check for desktop to keep sidebar open, but usually handled by CSS media queries hiding it on mobile only.
    // However, since we now control "open" state via class/prop, we need to be careful.
    // Layout strategy:
    // Desktop: Sidebar always visible (CSS handles width). "open" prop might be disregarded or always true.
    // Mobile: Sidebar hidden by default, toggled via state.

    // Better approach: Let CSS handle default visibility (Desktop: visible, Mobile: hidden).
    // The "open" class/prop will FORCE visibility on mobile.

    return (
        <div className="layout">
            <Sidebar
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
            />

            <div className="layout-content">
                <div className="mobile-header md:hidden">
                    <button
                        className="hamburger-btn"
                        onClick={() => setIsSidebarOpen(true)}
                    >
                        ☰
                    </button>
                    <span className="mobile-brand">Tracker Pro</span>
                </div>

                <div className="desktop-header">
                    <Header />
                </div>

                <main className="main-viewport">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default Layout;
