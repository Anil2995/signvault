import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { User, Lock, Bell, Palette, Loader2, Save } from 'lucide-react';
import api from '../lib/axios';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import Layout from '../components/Layout';

const profileSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
});
type ProfileFormValues = z.infer<typeof profileSchema>;

const passwordSchema = z.object({
    currentPassword: z.string().min(1, 'Required'),
    newPassword: z.string().min(6, 'Min 6 characters'),
    confirmPassword: z.string().min(6, 'Min 6 characters'),
}).refine(d => d.newPassword === d.confirmPassword, {
    message: "Passwords don't match", path: ['confirmPassword'],
});
type PasswordFormValues = z.infer<typeof passwordSchema>;

const SettingsPage = () => {
    const { user, login } = useAuth();
    const { toast } = useToast();
    const [activeTab, setActiveTab] = useState('profile');
    const [isSaving, setIsSaving] = useState(false);

    const profileForm = useForm<ProfileFormValues>({
        resolver: zodResolver(profileSchema),
        defaultValues: { name: user?.name || '' },
    });

    const passwordForm = useForm<PasswordFormValues>({
        resolver: zodResolver(passwordSchema),
    });

    const onProfileSubmit = async (data: ProfileFormValues) => {
        setIsSaving(true);
        try {
            const response = await api.put('/auth/profile', { name: data.name });
            login(response.data.token, {
                id: response.data._id,
                name: response.data.name,
                email: response.data.email,
                defaultSignature: response.data.defaultSignature,
            });
            toast('success', 'Profile updated!');
        } catch (err: any) {
            toast('error', err.response?.data?.message || 'Failed to update');
        } finally {
            setIsSaving(false);
        }
    };

    const onPasswordSubmit = async (_data: PasswordFormValues) => {
        toast('info', 'Password change is handled via forgot password flow');
        passwordForm.reset();
    };

    const tabs = [
        { key: 'profile', label: 'Profile', icon: User },
        { key: 'security', label: 'Security', icon: Lock },
        { key: 'notifications', label: 'Notifications', icon: Bell },
        { key: 'appearance', label: 'Appearance', icon: Palette },
    ];

    return (
        <Layout>
            <div className="page-header animate-fade-in">
                <div>
                    <h1 className="page-title">Settings</h1>
                    <p className="page-subtitle">Manage your account preferences</p>
                </div>
            </div>

            <div className="page-body">
                <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
                    {/* Settings tabs */}
                    <div className="card animate-slide-in" style={{ width: 220, padding: '12px 8px', alignSelf: 'flex-start' }}>
                        {tabs.map(tab => (
                            <button
                                key={tab.key}
                                className={`sidebar-link ${activeTab === tab.key ? 'active' : ''}`}
                                onClick={() => setActiveTab(tab.key)}
                                style={{
                                    background: activeTab === tab.key ? 'var(--primary-50)' : 'transparent',
                                    color: activeTab === tab.key ? 'var(--primary-600)' : 'var(--gray-600)',
                                }}
                            >
                                <tab.icon size={18} />
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Settings content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                        {activeTab === 'profile' && (
                            <div className="card animate-fade-in" style={{ padding: 28 }}>
                                <h3 style={{ fontSize: 17, fontWeight: 700, color: 'var(--gray-900)', marginBottom: 4 }}>Profile Information</h3>
                                <p style={{ fontSize: 13, color: 'var(--gray-500)', marginBottom: 24 }}>Update your account's profile information.</p>

                                <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--gray-700)', marginBottom: 6 }}>Full Name</label>
                                        <input {...profileForm.register('name')} className="input-field" placeholder="Your name" />
                                        {profileForm.formState.errors.name && (
                                            <p style={{ color: 'var(--status-rejected)', fontSize: 12, marginTop: 4 }}>{profileForm.formState.errors.name.message}</p>
                                        )}
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--gray-700)', marginBottom: 6 }}>Email</label>
                                        <input value={user?.email || ''} readOnly className="input-field" style={{ background: 'var(--gray-50)', color: 'var(--gray-500)', cursor: 'not-allowed' }} />
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                        <button type="submit" className="btn btn-primary" disabled={isSaving}>
                                            {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                                            Save Changes
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}

                        {activeTab === 'security' && (
                            <div className="card animate-fade-in" style={{ padding: 28 }}>
                                <h3 style={{ fontSize: 17, fontWeight: 700, color: 'var(--gray-900)', marginBottom: 4 }}>Change Password</h3>
                                <p style={{ fontSize: 13, color: 'var(--gray-500)', marginBottom: 24 }}>Ensure your account is using a strong password.</p>

                                <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--gray-700)', marginBottom: 6 }}>Current Password</label>
                                        <input type="password" {...passwordForm.register('currentPassword')} className="input-field" />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--gray-700)', marginBottom: 6 }}>New Password</label>
                                        <input type="password" {...passwordForm.register('newPassword')} className="input-field" />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--gray-700)', marginBottom: 6 }}>Confirm Password</label>
                                        <input type="password" {...passwordForm.register('confirmPassword')} className="input-field" />
                                        {passwordForm.formState.errors.confirmPassword && (
                                            <p style={{ color: 'var(--status-rejected)', fontSize: 12, marginTop: 4 }}>{passwordForm.formState.errors.confirmPassword.message}</p>
                                        )}
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                        <button type="submit" className="btn btn-primary"><Save size={16} /> Update Password</button>
                                    </div>
                                </form>
                            </div>
                        )}

                        {activeTab === 'notifications' && (
                            <div className="card animate-fade-in" style={{ padding: 28 }}>
                                <h3 style={{ fontSize: 17, fontWeight: 700, color: 'var(--gray-900)', marginBottom: 4 }}>Notifications</h3>
                                <p style={{ fontSize: 13, color: 'var(--gray-500)', marginBottom: 24 }}>Manage how you receive notifications.</p>

                                {[
                                    { label: 'Email notifications', desc: 'Receive signed document copies via email', defaultChecked: true },
                                    { label: 'Signature reminders', desc: 'Get reminded about pending signatures', defaultChecked: true },
                                    { label: 'Document updates', desc: 'Notify when documents are viewed or downloaded', defaultChecked: false },
                                ].map((item, i) => (
                                    <div key={i} style={{
                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                        padding: '16px 0', borderBottom: i < 2 ? '1px solid var(--gray-100)' : 'none',
                                    }}>
                                        <div>
                                            <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--gray-800)' }}>{item.label}</div>
                                            <div style={{ fontSize: 13, color: 'var(--gray-500)' }}>{item.desc}</div>
                                        </div>
                                        <label style={{ position: 'relative', width: 44, height: 24, cursor: 'pointer' }}>
                                            <input type="checkbox" defaultChecked={item.defaultChecked} style={{ display: 'none' }}
                                                onChange={(e) => toast('info', `${item.label} ${e.target.checked ? 'enabled' : 'disabled'}`)} />
                                            <div style={{
                                                width: 44, height: 24, borderRadius: 12,
                                                background: item.defaultChecked ? 'var(--primary-500)' : 'var(--gray-300)',
                                                transition: 'background 0.2s', position: 'relative',
                                            }}>
                                                <div style={{
                                                    width: 18, height: 18, borderRadius: '50%', background: 'white',
                                                    position: 'absolute', top: 3,
                                                    left: item.defaultChecked ? 23 : 3,
                                                    transition: 'left 0.2s', boxShadow: 'var(--shadow-sm)',
                                                }} />
                                            </div>
                                        </label>
                                    </div>
                                ))}
                            </div>
                        )}

                        {activeTab === 'appearance' && (
                            <div className="card animate-fade-in" style={{ padding: 28 }}>
                                <h3 style={{ fontSize: 17, fontWeight: 700, color: 'var(--gray-900)', marginBottom: 4 }}>Appearance</h3>
                                <p style={{ fontSize: 13, color: 'var(--gray-500)', marginBottom: 24 }}>Customize how SignVault looks for you.</p>

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 }}>
                                    {[
                                        { label: 'Light', bg: '#ffffff', border: '#e2e8f0', selected: true },
                                        { label: 'Dark', bg: '#1a1f37', border: '#334155', selected: false },
                                        { label: 'System', bg: 'linear-gradient(135deg, #ffffff 50%, #1a1f37 50%)', border: '#e2e8f0', selected: false },
                                    ].map(theme => (
                                        <div key={theme.label}
                                            onClick={() => toast('info', `${theme.label} theme - coming soon!`)}
                                            style={{
                                                cursor: 'pointer', borderRadius: 'var(--radius-lg)', padding: 4,
                                                border: `2px solid ${theme.selected ? 'var(--primary-500)' : 'var(--gray-200)'}`,
                                                transition: 'border-color 0.2s',
                                            }}>
                                            <div style={{
                                                height: 70, borderRadius: 'var(--radius-md)',
                                                background: theme.bg, border: `1px solid ${theme.border}`,
                                                marginBottom: 8,
                                            }} />
                                            <div style={{ textAlign: 'center', fontSize: 13, fontWeight: 600, color: 'var(--gray-700)', paddingBottom: 4 }}>
                                                {theme.label}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default SettingsPage;
