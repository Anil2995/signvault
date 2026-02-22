import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, FileText, Clock, Settings, LogOut, PenTool, Menu, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from './Toast';

const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/documents', label: 'Documents', icon: FileText },
    { path: '/activity', label: 'Activity', icon: Clock },
    { path: '/settings', label: 'Settings', icon: Settings },
];

const Layout = ({ children }: { children: React.ReactNode }) => {
    const { user, logout } = useAuth();
    const { toast } = useToast();
    const location = useLocation();
    const navigate = useNavigate();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const getInitials = (name: string) => {
        return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
    };

    const handleLogout = () => {
        logout();
        toast('info', 'You have been signed out');
        navigate('/login');
    };

    const isActive = (path: string) => {
        if (path === '/dashboard') return location.pathname === '/dashboard' || location.pathname === '/';
        return location.pathname.startsWith(path);
    };

    return (
        <div className="app-layout">
            {/* Mobile overlay */}
            <div
                className={`sidebar-overlay ${sidebarOpen ? 'open' : ''}`}
                onClick={() => setSidebarOpen(false)}
            />

            {/* Mobile header */}
            <div className="mobile-header">
                <button className="btn-icon" onClick={() => setSidebarOpen(true)}>
                    <Menu size={22} />
                </button>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div className="sidebar-brand-icon" style={{ width: 28, height: 28 }}>
                        <PenTool size={14} />
                    </div>
                    <span style={{ fontWeight: 700, fontSize: 16 }}>SignVault</span>
                </div>
            </div>

            {/* Sidebar */}
            <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
                {/* Brand */}
                <div className="sidebar-brand">
                    <div className="sidebar-brand-icon">
                        <PenTool size={18} />
                    </div>
                    <span className="sidebar-brand-name">SignVault</span>
                    {/* Mobile close button */}
                    <button
                        className="btn-icon"
                        onClick={() => setSidebarOpen(false)}
                        style={{ marginLeft: 'auto', color: 'var(--sidebar-text)', display: 'none' }}
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="sidebar-nav">
                    {navItems.map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`sidebar-link ${isActive(item.path) ? 'active' : ''}`}
                            onClick={() => setSidebarOpen(false)}
                        >
                            <item.icon size={20} />
                            {item.label}
                        </Link>
                    ))}
                </nav>

                {/* Footer */}
                <div className="sidebar-footer">
                    <Link
                        to="/profile"
                        className="sidebar-user"
                        onClick={() => setSidebarOpen(false)}
                        style={{ textDecoration: 'none' }}
                    >
                        <div className="sidebar-avatar">
                            {user ? getInitials(user.name) : '?'}
                        </div>
                        <div className="sidebar-user-info">
                            <div className="sidebar-user-name">{user?.name || 'User'}</div>
                            <div className="sidebar-user-email">{user?.email || ''}</div>
                        </div>
                    </Link>
                    <button className="sidebar-signout" onClick={handleLogout}>
                        <LogOut size={18} />
                        Sign out
                    </button>
                </div>
            </aside>

            {/* Main content */}
            <main className="main-content">
                {children}
                <footer style={{
                    padding: '20px 32px',
                    borderTop: '1px solid var(--gray-100)',
                    textAlign: 'center',
                    fontSize: 12,
                    color: 'var(--gray-400)',
                    marginTop: 'auto',
                }}>
                    © {new Date().getFullYear()} SignVault. Built by{' '}
                    <a href="mailto:siddemanilkumar@gmail.com" style={{
                        color: 'var(--accent-500)',
                        textDecoration: 'none',
                        fontWeight: 600,
                    }}>
                        siddemanilkumar@gmail.com
                    </a>
                </footer>
            </main>
        </div>
    );
};

export default Layout;
