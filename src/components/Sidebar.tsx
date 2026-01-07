import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { PanelMenu } from 'primereact/panelmenu';
import { Sidebar as PrimeSidebar } from 'primereact/sidebar';
import type { MenuItem } from 'primereact/menuitem';
import './Sidebar.scss';

interface SidebarProps {
    isOpen?: boolean;
    onClose?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
    const navigate = useNavigate();
    const location = useLocation();

    const items: MenuItem[] = [
        {
            label: 'Dashboard',
            icon: 'pi pi-chart-bar',
            command: () => { navigate('/dashboard'); if (window.innerWidth < 768) onClose?.(); },
            className: location.pathname === '/dashboard' ? 'active-menuitem' : ''
        },
        {
            label: 'Admin',
            icon: 'pi pi-cog',
            expanded: true,
            items: [
                {
                    label: 'Manage Applications',
                    icon: 'pi pi-box',
                    command: () => { navigate('/admin/application'); if (window.innerWidth < 768) onClose?.(); },
                    className: location.pathname === '/admin/application' ? 'active-menuitem' : ''
                },
                {
                    label: 'Manage Downtime',
                    icon: 'pi pi-clock',
                    command: () => { navigate('/admin/downtime'); if (window.innerWidth < 768) onClose?.(); },
                    className: location.pathname === '/admin/downtime' ? 'active-menuitem' : ''
                },
                {
                    label: 'Manage Releases',
                    icon: 'pi pi-tag',
                    command: () => { navigate('/admin/release'); if (window.innerWidth < 768) onClose?.(); },
                    className: location.pathname === '/admin/release' ? 'active-menuitem' : ''
                }
            ]
        }
    ];

    // Mobile Sidebar (Drawer)
    const mobileSidebar = (
        <PrimeSidebar visible={isOpen} onHide={onClose || (() => { })} className="w-full md:w-20rem p-0" showCloseIcon={true}>
            <div className="sidebar-brand mb-4 px-3 flex align-items-center gap-2">
                <div className="brand-logo text-2xl font-bold text-primary">TP</div>
                <span style={{ fontSize: '1.1rem', fontWeight: 600 }}>Tracker Pro</span>
            </div>
            <PanelMenu model={items} className="w-full border-none" multiple />
        </PrimeSidebar>
    );

    // Desktop Sidebar (Static)
    const desktopSidebar = (
        <aside className="app-sidebar hidden md:flex flex-column h-full sticky top-0" style={{ width: '280px', height: '100vh' }}>
            <div className="sidebar-brand flex align-items-center gap-2 ">
                <div className="brand-logo  font-bold text-primary">TP</div>
                <span style={{ fontSize: '1.1rem', fontWeight: 600 }}>Tracker Pro</span>
            </div>
            <div className="p-2 flex-grow-1 overflow-y-auto">
                <PanelMenu model={items} className="w-full border-none" multiple />
            </div>
        </aside>
    );

    return (
        <>
            {mobileSidebar}
            {desktopSidebar}
        </>
    );
};

export default Sidebar;
