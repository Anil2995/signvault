import { Navigate, Outlet } from 'react-router-dom';
import { PenTool, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = () => {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div style={{
                minHeight: '100vh', display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', background: 'var(--gray-50)', gap: 16,
            }}>
                <div style={{
                    width: 48, height: 48, borderRadius: 'var(--radius-lg)',
                    background: 'var(--accent-500)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'white',
                }}>
                    <PenTool size={24} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--gray-500)', fontSize: 14 }}>
                    <Loader2 size={16} className="animate-spin" /> Loading...
                </div>
            </div>
        );
    }

    return user ? <Outlet /> : <Navigate to="/login" replace />;
};

export default ProtectedRoute;
