import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PenTool, Lock, Loader2 } from 'lucide-react';
import api from '../lib/axios';
import { useToast } from '../components/Toast';

const schema = z.object({
    password: z.string().min(6, 'Min 6 characters'),
    confirmPassword: z.string().min(6, 'Min 6 characters'),
}).refine(d => d.password === d.confirmPassword, {
    message: "Passwords don't match", path: ['confirmPassword'],
});
type FormValues = z.infer<typeof schema>;

const ResetPassword = () => {
    const { token } = useParams();
    const navigate = useNavigate();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);

    const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
        resolver: zodResolver(schema),
    });

    const onSubmit = async (data: FormValues) => {
        setIsLoading(true);
        try {
            await api.put(`/auth/resetpassword/${token}`, { password: data.password });
            toast('success', 'Password reset successfully!');
            navigate('/login');
        } catch (err: any) {
            toast('error', err.response?.data?.message || 'Reset failed');
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
                    <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--gray-900)', marginBottom: 4 }}>Set new password</h2>
                    <p style={{ fontSize: 14, color: 'var(--gray-500)' }}>Enter your new password below</p>
                </div>

                <div className="glass-card" style={{ padding: 32 }}>
                    <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                        <div>
                            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--gray-700)', marginBottom: 6 }}>New Password</label>
                            <div className="input-with-icon">
                                <Lock size={16} className="input-icon" />
                                <input {...register('password')} type="password" className="input-field" placeholder="Min. 6 characters" />
                            </div>
                            {errors.password && <p style={{ color: 'var(--status-rejected)', fontSize: 12, marginTop: 4 }}>{errors.password.message}</p>}
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--gray-700)', marginBottom: 6 }}>Confirm Password</label>
                            <div className="input-with-icon">
                                <Lock size={16} className="input-icon" />
                                <input {...register('confirmPassword')} type="password" className="input-field" placeholder="Re-enter password" />
                            </div>
                            {errors.confirmPassword && <p style={{ color: 'var(--status-rejected)', fontSize: 12, marginTop: 4 }}>{errors.confirmPassword.message}</p>}
                        </div>
                        <button type="submit" disabled={isLoading} className="btn btn-primary btn-lg" style={{ width: '100%' }}>
                            {isLoading ? <><Loader2 size={16} className="animate-spin" /> Resetting...</> : 'Reset Password'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ResetPassword;
