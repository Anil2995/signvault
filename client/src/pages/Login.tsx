import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PenTool, Mail, Lock, Loader2, FileText, Shield, Zap } from 'lucide-react';
import api from '../lib/axios';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';

const loginSchema = z.object({
    email: z.string().email('Please enter a valid email'),
    password: z.string().min(6, 'Min 6 characters'),
});
type LoginFormValues = z.infer<typeof loginSchema>;

const Login = () => {
    const navigate = useNavigate();
    const { login } = useAuth();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);

    const { register, handleSubmit, formState: { errors } } = useForm<LoginFormValues>({
        resolver: zodResolver(loginSchema),
    });

    const onSubmit = async (data: LoginFormValues) => {
        setIsLoading(true);
        try {
            const response = await api.post('/auth/login', data);
            const { token, user } = response.data;
            login(token, user);
            toast('success', `Welcome back, ${user.name}!`);
            navigate('/dashboard');
        } catch (err: any) {
            toast('error', err.response?.data?.message || 'Login failed. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div style={{ display: 'flex', minHeight: '100vh' }}>
            {/* Left - Branding Panel */}
            <div style={{
                display: 'none', flex: 1,
                background: 'linear-gradient(135deg, var(--sidebar-bg) 0%, #252b48 50%, var(--sidebar-bg) 100%)',
                padding: 48, flexDirection: 'column', justifyContent: 'center',
                position: 'relative', overflow: 'hidden', color: 'white',
            }} className="branding-panel">
                {/* Decorative circles */}
                <div style={{ position: 'absolute', width: 300, height: 300, borderRadius: '50%', background: 'rgba(249, 115, 22, 0.08)', top: -80, right: -80 }} />
                <div style={{ position: 'absolute', width: 200, height: 200, borderRadius: '50%', background: 'rgba(59, 130, 246, 0.08)', bottom: -60, left: -40 }} />

                <div className="animate-fade-in" style={{ position: 'relative', zIndex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 40 }}>
                        <div style={{
                            width: 44, height: 44, borderRadius: 'var(--radius-lg)',
                            background: 'var(--accent-500)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                            <PenTool size={22} />
                        </div>
                        <span style={{ fontSize: 24, fontWeight: 700 }}>SignVault</span>
                    </div>

                    <h2 style={{ fontSize: 32, fontWeight: 800, lineHeight: 1.2, marginBottom: 16, letterSpacing: -0.5 }}>
                        Sign documents<br />in seconds.
                    </h2>
                    <p style={{ fontSize: 16, color: 'var(--sidebar-text-light)', lineHeight: 1.7, marginBottom: 40 }}>
                        Upload, sign, and manage your documents securely with our digital signature platform.
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        {[
                            { icon: FileText, text: 'Upload & manage PDF documents' },
                            { icon: Shield, text: 'Secure digital signatures' },
                            { icon: Zap, text: 'Fast & easy signing workflow' },
                        ].map((item, i) => (
                            <div key={i} className="animate-fade-in" style={{
                                display: 'flex', alignItems: 'center', gap: 12, animationDelay: `${0.3 + i * 0.1}s`,
                            }}>
                                <div style={{
                                    width: 36, height: 36, borderRadius: 'var(--radius-md)',
                                    background: 'rgba(249, 115, 22, 0.15)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    color: 'var(--accent-400)',
                                }}>
                                    <item.icon size={18} />
                                </div>
                                <span style={{ fontSize: 14, color: 'var(--sidebar-text-light)' }}>{item.text}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right - Form */}
            <div style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '32px 24px', background: 'var(--gray-50)',
            }}>
                <div style={{ width: '100%', maxWidth: 420 }} className="animate-fade-in-up">
                    <div style={{ textAlign: 'center', marginBottom: 32 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center', marginBottom: 28 }}>
                            <div style={{
                                width: 40, height: 40, borderRadius: 'var(--radius-lg)',
                                background: 'var(--accent-500)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: 'white',
                            }}>
                                <PenTool size={20} />
                            </div>
                            <span style={{ fontSize: 22, fontWeight: 700, color: 'var(--gray-900)' }}>SignVault</span>
                        </div>
                        <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--gray-900)', marginBottom: 4 }}>Welcome back</h2>
                        <p style={{ fontSize: 14, color: 'var(--gray-500)' }}>Sign in to your account</p>
                    </div>

                    <div className="glass-card" style={{ padding: 32 }}>
                        <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                            <div>
                                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--gray-700)', marginBottom: 6 }}>Email</label>
                                <div className="input-with-icon">
                                    <Mail size={16} className="input-icon" />
                                    <input {...register('email')} type="email" className="input-field" placeholder="you@example.com" />
                                </div>
                                {errors.email && <p style={{ color: 'var(--status-rejected)', fontSize: 12, marginTop: 4 }}>{errors.email.message}</p>}
                            </div>

                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                                    <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--gray-700)' }}>Password</label>
                                    <Link to="/forgot-password" style={{ fontSize: 12, color: 'var(--accent-500)', textDecoration: 'none', fontWeight: 500 }}>
                                        Forgot password?
                                    </Link>
                                </div>
                                <div className="input-with-icon">
                                    <Lock size={16} className="input-icon" />
                                    <input {...register('password')} type="password" className="input-field" placeholder="••••••••" />
                                </div>
                                {errors.password && <p style={{ color: 'var(--status-rejected)', fontSize: 12, marginTop: 4 }}>{errors.password.message}</p>}
                            </div>

                            <button type="submit" disabled={isLoading} className="btn btn-primary btn-lg" style={{ width: '100%' }}>
                                {isLoading ? <><Loader2 size={16} className="animate-spin" /> Signing in...</> : 'Sign In'}
                            </button>
                        </form>
                    </div>

                    <p style={{ textAlign: 'center', marginTop: 24, fontSize: 14, color: 'var(--gray-500)' }}>
                        Don't have an account?{' '}
                        <Link to="/register" style={{ color: 'var(--accent-500)', fontWeight: 600, textDecoration: 'none' }}>
                            Create one
                        </Link>
                    </p>
                </div>
            </div>

            <style>{`
                @media (min-width: 1024px) {
                    .branding-panel { display: flex !important; }
                }
            `}</style>
        </div>
    );
};

export default Login;
