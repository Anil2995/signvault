import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import SignatureCanvas from 'react-signature-canvas';
import { Loader2, Save, Trash2, Sparkles, Mail } from 'lucide-react';
import api from '../lib/axios';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import Layout from '../components/Layout';

const profileSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
});
type ProfileFormValues = z.infer<typeof profileSchema>;

const Profile = () => {
    const { user, login } = useAuth();
    const { toast } = useToast();
    const [signatureType, setSignatureType] = useState<'draw' | 'type'>('draw');
    const [typedSignature, setTypedSignature] = useState('');
    const signatureRef = useRef<SignatureCanvas>(null);
    const [isSaving, setIsSaving] = useState(false);

    const { register, handleSubmit, formState: { errors } } = useForm<ProfileFormValues>({
        resolver: zodResolver(profileSchema),
        defaultValues: { name: user?.name || '' },
    });

    const onSubmit = async (data: ProfileFormValues) => {
        setIsSaving(true);
        try {
            let defaultSignature = user?.defaultSignature || undefined;

            if (signatureType === 'draw' && signatureRef.current && !signatureRef.current.isEmpty()) {
                defaultSignature = {
                    type: 'image',
                    value: signatureRef.current.getTrimmedCanvas().toDataURL('image/png'),
                };
            } else if (signatureType === 'type' && typedSignature.trim()) {
                defaultSignature = {
                    type: 'text',
                    value: typedSignature.trim(),
                };
            }

            const response = await api.put('/auth/profile', {
                name: data.name,
                defaultSignature,
            });

            login(response.data.token, {
                id: response.data._id,
                name: response.data.name,
                email: response.data.email,
                defaultSignature: response.data.defaultSignature,
            });
            toast('success', 'Profile updated successfully!');
        } catch (err: any) {
            toast('error', err.response?.data?.message || 'Failed to update profile');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Layout>
            <div className="page-header animate-fade-in">
                <div>
                    <h1 className="page-title">My Profile</h1>
                    <p className="page-subtitle">Manage your personal information and signature</p>
                </div>
            </div>

            <div className="page-body" style={{ maxWidth: 700 }}>
                <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                    {/* Personal Info */}
                    <div className="card animate-fade-in-up" style={{ padding: 28 }}>
                        <h3 style={{ fontSize: 17, fontWeight: 700, color: 'var(--gray-900)', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
                            Personal Information
                        </h3>
                        <div style={{ display: 'grid', gap: 20, gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--gray-700)', marginBottom: 6 }}>Full Name</label>
                                <input {...register('name')} className="input-field" placeholder="Your name" />
                                {errors.name && <p style={{ color: 'var(--status-rejected)', fontSize: 12, marginTop: 4 }}>{errors.name.message}</p>}
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--gray-700)', marginBottom: 6 }}>Email</label>
                                <div className="input-with-icon">
                                    <Mail size={16} className="input-icon" />
                                    <input value={user?.email || ''} readOnly className="input-field" style={{ background: 'var(--gray-50)', color: 'var(--gray-500)', cursor: 'not-allowed' }} />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Signature */}
                    <div className="card animate-fade-in-up stagger-2" style={{ padding: 28 }}>
                        <h3 style={{ fontSize: 17, fontWeight: 700, color: 'var(--gray-900)', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Sparkles size={18} style={{ color: 'var(--accent-500)' }} /> Default Signature
                        </h3>

                        {/* Saved preview */}
                        {user?.defaultSignature && (
                            <div style={{
                                padding: 20, borderRadius: 'var(--radius-lg)',
                                border: '1px solid var(--status-signed-border)', background: 'var(--status-signed-bg)',
                                marginBottom: 20,
                            }}>
                                <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--status-signed)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>Currently Saved</p>
                                <div style={{ background: 'white', borderRadius: 'var(--radius-md)', padding: 16, border: '1px solid var(--status-signed-border)', textAlign: 'center' }}>
                                    {user.defaultSignature.type === 'image' ? (
                                        <img src={user.defaultSignature.value} alt="Signature" style={{ height: 60, objectFit: 'contain' }} />
                                    ) : (
                                        <span className="font-signature" style={{ fontSize: 32, color: 'var(--gray-800)' }}>{user.defaultSignature.value}</span>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Type toggle */}
                        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                            {(['draw', 'type'] as const).map(type => (
                                <button
                                    key={type}
                                    type="button"
                                    onClick={() => setSignatureType(type)}
                                    className={`btn btn-sm ${signatureType === type ? 'btn-blue' : 'btn-secondary'}`}
                                    style={{ flex: 1 }}
                                >
                                    {type === 'draw' ? '✏️ Draw' : '⌨️ Type'}
                                </button>
                            ))}
                        </div>

                        {signatureType === 'draw' ? (
                            <div>
                                <div style={{
                                    border: '2px dashed var(--gray-300)', borderRadius: 'var(--radius-lg)',
                                    background: 'var(--gray-50)', overflow: 'hidden',
                                }}>
                                    <SignatureCanvas
                                        ref={signatureRef}
                                        canvasProps={{
                                            width: 500, height: 180,
                                            className: 'cursor-crosshair',
                                            style: { width: '100%', background: 'white', borderRadius: 'var(--radius-lg)' },
                                        }}
                                        minWidth={1} maxWidth={3}
                                        penColor="#1e293b"
                                    />
                                </div>
                                <button type="button" onClick={() => signatureRef.current?.clear()}
                                    style={{
                                        marginTop: 8, display: 'flex', alignItems: 'center', gap: 6,
                                        fontSize: 12, color: 'var(--status-rejected)', fontWeight: 600,
                                        background: 'none', border: 'none', cursor: 'pointer',
                                    }}>
                                    <Trash2 size={12} /> Clear canvas
                                </button>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                <input type="text" value={typedSignature} onChange={(e) => setTypedSignature(e.target.value)}
                                    className="input-field" placeholder="Type your signature..." style={{ textAlign: 'center' }} />
                                {typedSignature && (
                                    <div className="animate-scale-in" style={{
                                        padding: 24, borderRadius: 'var(--radius-lg)', border: '1px solid var(--gray-200)',
                                        background: 'var(--gray-50)', textAlign: 'center',
                                    }}>
                                        <span className="font-signature" style={{ fontSize: 36, color: 'var(--gray-800)' }}>{typedSignature}</span>
                                    </div>
                                )}
                            </div>
                        )}

                        <p style={{ fontSize: 12, color: 'var(--gray-400)', marginTop: 12 }}>
                            This signature will be available as a quick option when signing documents.
                        </p>
                    </div>

                    {/* Save */}
                    <button type="submit" disabled={isSaving} className="btn btn-primary btn-lg" style={{ alignSelf: 'flex-end' }}>
                        {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                        {isSaving ? 'Saving...' : 'Save Profile'}
                    </button>
                </form>
            </div>
        </Layout>
    );
};

export default Profile;
