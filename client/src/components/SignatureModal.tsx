import { useState, useRef } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { X, PenTool, Type, Trash2, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface SignatureModalProps {
    onClose: () => void;
    onSign: (type: string, value: string) => void;
}

const SignatureModal = ({ onClose, onSign }: SignatureModalProps) => {
    const { user } = useAuth();
    const [tab, setTab] = useState<'draw' | 'type' | 'saved'>('draw');
    const [typedText, setTypedText] = useState('');
    const canvasRef = useRef<SignatureCanvas>(null);

    const handleApply = () => {
        if (tab === 'draw' && canvasRef.current && !canvasRef.current.isEmpty()) {
            onSign('image', canvasRef.current.getTrimmedCanvas().toDataURL('image/png'));
        } else if (tab === 'type' && typedText.trim()) {
            onSign('text', typedText.trim());
        } else if (tab === 'saved' && user?.defaultSignature) {
            onSign(user.defaultSignature.type, user.defaultSignature.value);
        }
    };

    const tabs = [
        { key: 'draw' as const, label: 'Draw', icon: PenTool },
        { key: 'type' as const, label: 'Type', icon: Type },
        ...(user?.defaultSignature ? [{ key: 'saved' as const, label: 'Saved', icon: Check }] : []),
    ];

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 520 }}>
                <div className="modal-header">
                    <h3 style={{ fontSize: 17, fontWeight: 700, color: 'var(--gray-900)' }}>
                        Add Signature
                    </h3>
                    <button className="btn-icon" onClick={onClose}><X size={20} /></button>
                </div>

                {/* Tabs */}
                <div style={{
                    display: 'flex', borderBottom: '1px solid var(--gray-100)',
                    padding: '0 24px',
                }}>
                    {tabs.map((t) => (
                        <button
                            key={t.key}
                            onClick={() => setTab(t.key)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: 6,
                                padding: '12px 16px', fontSize: 13, fontWeight: 600,
                                border: 'none', background: 'none', cursor: 'pointer',
                                color: tab === t.key ? 'var(--accent-500)' : 'var(--gray-500)',
                                borderBottom: tab === t.key ? '2px solid var(--accent-500)' : '2px solid transparent',
                                transition: 'all 0.2s',
                            }}
                        >
                            <t.icon size={15} /> {t.label}
                        </button>
                    ))}
                </div>

                <div className="modal-body">
                    {tab === 'draw' && (
                        <div>
                            <div style={{
                                border: '2px dashed var(--gray-300)', borderRadius: 'var(--radius-lg)',
                                overflow: 'hidden', background: 'var(--gray-50)',
                            }}>
                                <SignatureCanvas
                                    ref={canvasRef}
                                    canvasProps={{
                                        width: 460, height: 180,
                                        style: { width: '100%', background: 'white', borderRadius: 'var(--radius-lg)' },
                                    }}
                                    minWidth={1} maxWidth={3}
                                    penColor="#1e293b"
                                />
                            </div>
                            <button
                                type="button"
                                onClick={() => canvasRef.current?.clear()}
                                style={{
                                    marginTop: 8, display: 'flex', alignItems: 'center', gap: 6,
                                    fontSize: 12, color: 'var(--status-rejected)', fontWeight: 600,
                                    background: 'none', border: 'none', cursor: 'pointer',
                                }}
                            >
                                <Trash2 size={12} /> Clear
                            </button>
                        </div>
                    )}

                    {tab === 'type' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            <input
                                type="text"
                                value={typedText}
                                onChange={(e) => setTypedText(e.target.value)}
                                className="input-field"
                                placeholder="Type your full name..."
                                autoFocus
                            />
                            {typedText && (
                                <div className="animate-scale-in" style={{
                                    padding: 24, borderRadius: 'var(--radius-lg)',
                                    border: '1px solid var(--gray-200)', background: 'var(--gray-50)',
                                    textAlign: 'center',
                                }}>
                                    <span className="font-signature" style={{ fontSize: 36, color: 'var(--gray-800)' }}>
                                        {typedText}
                                    </span>
                                </div>
                            )}
                        </div>
                    )}

                    {tab === 'saved' && user?.defaultSignature && (
                        <div className="animate-fade-in" style={{
                            padding: 28, borderRadius: 'var(--radius-lg)',
                            border: '1px solid var(--status-signed-border)',
                            background: 'var(--status-signed-bg)',
                            textAlign: 'center',
                        }}>
                            <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--status-signed)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>
                                Saved Signature
                            </p>
                            <div style={{
                                background: 'white', borderRadius: 'var(--radius-md)',
                                padding: 20, border: '1px solid var(--status-signed-border)',
                            }}>
                                {user.defaultSignature.type === 'image' ? (
                                    <img src={user.defaultSignature.value} alt="Saved signature" style={{ height: 60, objectFit: 'contain' }} />
                                ) : (
                                    <span className="font-signature" style={{ fontSize: 36, color: 'var(--gray-800)' }}>
                                        {user.defaultSignature.value}
                                    </span>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <div className="modal-footer">
                    <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
                    <button className="btn btn-primary" onClick={handleApply}>
                        <Check size={16} /> Apply Signature
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SignatureModal;
