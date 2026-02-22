import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PenTool, Mail, Loader2, ArrowLeft, CheckCircle2 } from 'lucide-react';
import api from '../lib/axios';
import { useToast } from '../components/Toast';

const schema = z.object({
    email: z.string().email('Please enter a valid email'),
});
type FormValues = z.infer<typeof schema>;

const ForgotPassword = () => {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [sent, setSent] = useState(false);

    const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
        resolver: zodResolver(schema),
    });

    const onSubmit = async (data: FormValues) => {
        setIsLoading(true);
        try {
            await api.post('/auth/forgotpassword', { email: data.email });
            setSent(true);
            toast('success', 'Reset link sent to your email');
        } catch (err: any) {
            toast('error', err.response?.data?.message || 'Something went wrong');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'var(--gray-50)', padding: 24,
        }}>
            <div style={{ width: '100%', maxWidth: 420 }} className="animate-fade-in-up">
                <div style={{ textAlign: 'center', marginBottom: 32 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center', marginBottom: 28 }}>
                        <div style={{
                            width: 40, height: 40, borderRadius: 'var(--radius-lg)',
                            background: 'var(--accent-500)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white',
                        }}>
                            <PenTool size={20} />
                        </div>
                        <span style={{ fontSize: 22, fontWeight: 700, color: 'var(--gray-900)' }}>SignVault</span>
                    </div>
                    <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--gray-900)', marginBottom: 4 }}>Reset your password</h2>
                    <p style={{ fontSize: 14, color: 'var(--gray-500)' }}>Enter your email and we'll send you a reset link</p>
                </div>

                <div className="glass-card" style={{ padding: 32 }}>
                    {sent ? (
                        <div className="animate-bounce-in" style={{ textAlign: 'center', padding: '20px 0' }}>
                            <div style={{
                                width: 64, height: 64, borderRadius: '50%', margin: '0 auto 20px',
                                background: 'var(--status-signed-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: 'var(--status-signed)',
                            }}>
                                <CheckCircle2 size={32} />
                            </div>
                            <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--gray-900)', marginBottom: 4 }}>Check your email</h3>
                            <p style={{ fontSize: 14, color: 'var(--gray-500)', lineHeight: 1.6 }}>
                                We've sent a password reset link to your email address.
                            </p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                            <div>
                                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--gray-700)', marginBottom: 6 }}>Email</label>
                                <div className="input-with-icon">
                                    <Mail size={16} className="input-icon" />
                                    <input {...register('email')} type="email" className="input-field" placeholder="you@example.com" />
                                </div>
                                {errors.email && <p style={{ color: 'var(--status-rejected)', fontSize: 12, marginTop: 4 }}>{errors.email.message}</p>}
                            </div>
                            <button type="submit" disabled={isLoading} className="btn btn-primary btn-lg" style={{ width: '100%' }}>
                                {isLoading ? <><Loader2 size={16} className="animate-spin" /> Sending...</> : 'Send Reset Link'}
                            </button>
                        </form>
                    )}
                </div>

                <p style={{ textAlign: 'center', marginTop: 24, fontSize: 14 }}>
                    <Link to="/login" style={{ color: 'var(--gray-500)', textDecoration: 'none', fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <ArrowLeft size={14} /> Back to sign in
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default ForgotPassword;
