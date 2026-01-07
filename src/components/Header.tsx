import React from 'react';
import { useLocation } from 'react-router-dom';
import './Header.scss';

const Header: React.FC = () => {
    const location = useLocation();

    const getPageTitle = () => {
        const path = location.pathname;
        if (path === '/dashboard') return 'Dashboard Overview';
        if (path === '/admin/application') return 'Application Management';
        if (path === '/admin/downtime') return 'Downtime Management';
        if (path === '/admin/release') return 'Release Management';
        if (path.startsWith('/release/')) return 'Release Detail';
        return 'Tracker Pro';
    };

    return (
        <header className="header">
            <div className="header-left">
                <h1 className="header-page-title">{getPageTitle()}</h1>
            </div>

            <div className="header-right">

            </div>
        </header>
    );
};

export default Header;
