import { useEffect, useState } from 'react';
import { Clock, FileText, PenTool, CheckCircle2, Upload, AlertCircle } from 'lucide-react';
import api from '../lib/axios';
import Layout from '../components/Layout';
import type { Document } from '../types';

interface Signature { _id: string; status: string; document: string; createdAt: string; updatedAt: string; }

interface ActivityItem {
    id: string;
    type: 'upload' | 'sign' | 'pending' | 'create';
    title: string;
    time: string;
    icon: typeof FileText;
    color: string;
    bg: string;
}

const Activity = () => {
    const [activities, setActivities] = useState<ActivityItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchActivity = async () => {
            try {
                const [docsRes, sigsRes] = await Promise.all([
                    api.get('/docs'),
                    api.get('/signatures').catch(() => ({ data: [] })),
                ]);

                const docs: Document[] = docsRes.data;
                const sigs: Signature[] = sigsRes.data;

                const items: ActivityItem[] = [];

                docs.forEach(doc => {
                    items.push({
                        id: 'upload-' + doc._id,
                        type: 'upload',
                        title: `Uploaded "${doc.originalName}"`,
                        time: doc.createdAt,
                        icon: Upload,
                        color: 'var(--primary-500)',
                        bg: 'var(--primary-50)',
                    });
                });

                sigs.forEach(sig => {
                    if (sig.status === 'signed') {
                        items.push({
                            id: 'sign-' + sig._id,
                            type: 'sign',
                            title: 'Signed a document',
                            time: sig.updatedAt,
                            icon: CheckCircle2,
                            color: 'var(--status-signed)',
                            bg: 'var(--status-signed-bg)',
                        });
                    } else if (sig.status === 'pending') {
                        items.push({
                            id: 'pending-' + sig._id,
                            type: 'pending',
                            title: 'Signature placeholder added',
                            time: sig.createdAt,
                            icon: PenTool,
                            color: 'var(--status-pending)',
                            bg: 'var(--status-pending-bg)',
                        });
                    }
                });

                items.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
                setActivities(items);
            } catch {
                // ignore
            } finally {
                setLoading(false);
            }
        };
        fetchActivity();
    }, []);

    const formatTime = (dateStr: string) => {
        const d = new Date(dateStr);
        const now = new Date();
        const diff = now.getTime() - d.getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return 'Just now';
        if (mins < 60) return `${mins}m ago`;
        const hours = Math.floor(mins / 60);
        if (hours < 24) return `${hours}h ago`;
        const days = Math.floor(hours / 24);
        if (days < 7) return `${days}d ago`;
        return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    return (
        <Layout>
            <div className="page-header animate-fade-in">
                <div>
                    <h1 className="page-title">Activity</h1>
                    <p className="page-subtitle">Recent actions and events</p>
                </div>
            </div>

            <div className="page-body">
                <div className="card animate-fade-in-up" style={{ overflow: 'hidden' }}>
                    {loading ? (
                        <div style={{ padding: 20 }}>
                            {[1, 2, 3, 4, 5].map(i => (
                                <div key={i} style={{ display: 'flex', gap: 14, padding: '16px 0', borderBottom: '1px solid var(--gray-100)' }}>
                                    <div className="skeleton" style={{ width: 36, height: 36, borderRadius: 'var(--radius-md)', flexShrink: 0 }} />
                                    <div style={{ flex: 1 }}>
                                        <div className="skeleton" style={{ width: '60%', height: 14, marginBottom: 6 }} />
                                        <div className="skeleton" style={{ width: '20%', height: 12 }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : activities.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-state-icon" style={{ background: 'var(--gray-100)', color: 'var(--gray-400)' }}>
                                <Clock size={36} />
                            </div>
                            <div className="empty-state-title">No activity yet</div>
                            <p className="empty-state-desc">Your recent actions will appear here once you start uploading and signing documents.</p>
                        </div>
                    ) : (
                        <div style={{ padding: '8px 0' }}>
                            {activities.map((item, i) => (
                                <div
                                    key={item.id}
                                    className="animate-fade-in"
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: 14,
                                        padding: '14px 20px',
                                        borderBottom: i < activities.length - 1 ? '1px solid var(--gray-100)' : 'none',
                                        animationDelay: `${i * 0.04}s`,
                                    }}
                                >
                                    <div style={{
                                        width: 36, height: 36, borderRadius: 'var(--radius-md)',
                                        background: item.bg, color: item.color,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                                    }}>
                                        <item.icon size={18} />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--gray-800)' }}>{item.title}</div>
                                    </div>
                                    <div style={{ fontSize: 12, color: 'var(--gray-400)', whiteSpace: 'nowrap' }}>
                                        {formatTime(item.time)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
};

export default Activity;
