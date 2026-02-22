import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { CheckCircle2, XCircle, Info, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info';
interface Toast { id: string; type: ToastType; message: string; removing?: boolean; }
interface ToastContextType { toast: (type: ToastType, message: string) => void; }

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) throw new Error('useToast must be used within a ToastProvider');
    return context;
};

export const ToastProvider = ({ children }: { children: ReactNode }) => {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const removeToast = useCallback((id: string) => {
        setToasts((prev) => prev.map(t => t.id === id ? { ...t, removing: true } : t));
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 300);
    }, []);

    const toast = useCallback((type: ToastType, message: string) => {
        const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
        setToasts((prev) => [...prev, { id, type, message }]);
        setTimeout(() => removeToast(id), 4000);
    }, [removeToast]);

    const icons: Record<ToastType, typeof CheckCircle2> = {
        success: CheckCircle2,
        error: XCircle,
        info: Info,
    };

    return (
        <ToastContext.Provider value={{ toast }}>
            {children}
            <div className="toast-container">
                {toasts.map((t) => {
                    const Icon = icons[t.type];
                    return (
                        <div
                            key={t.id}
                            className={`toast toast-${t.type} ${t.removing ? 'removing' : ''}`}
                        >
                            <div className="toast-icon">
                                <Icon size={14} />
                            </div>
                            <span style={{ flex: 1 }}>{t.message}</span>
                            <button
                                onClick={() => removeToast(t.id)}
                                style={{
                                    background: 'none', border: 'none', cursor: 'pointer',
                                    color: 'var(--gray-400)', padding: 2,
                                    display: 'flex', alignItems: 'center',
                                }}
                            >
                                <X size={14} />
                            </button>
                        </div>
                    );
                })}
            </div>
        </ToastContext.Provider>
    );
};
