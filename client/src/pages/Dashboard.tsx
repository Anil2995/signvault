import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    FileText, Upload, Plus, Search, Loader2,
    BarChart3, MoreVertical, Download, Eye, Trash2, X
} from 'lucide-react';
import api from '../lib/axios';
import { useToast } from '../components/Toast';
import Layout from '../components/Layout';
import type { Document } from '../types';

interface Signature { _id: string; status: string; document: string; }

const Dashboard = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [documents, setDocuments] = useState<Document[]>([]);
    const [signatures, setSignatures] = useState<Signature[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [dragOver, setDragOver] = useState(false);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [activeMenu, setActiveMenu] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        try {
            const [docsRes, sigsRes] = await Promise.all([
                api.get('/docs'),
                api.get('/signatures').catch(() => ({ data: [] })),
            ]);
            setDocuments(docsRes.data);
            setSignatures(sigsRes.data);
        } catch {
            toast('error', 'Failed to load data');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    // Close menu when clicking outside
    useEffect(() => {
        const handler = () => setActiveMenu(null);
        window.addEventListener('click', handler);
        return () => window.removeEventListener('click', handler);
    }, []);

    const handleUpload = async (file: File) => {
        if (!file.name.toLowerCase().endsWith('.pdf')) {
            toast('error', 'Only PDF files are supported');
            return;
        }
        setUploading(true);
        setShowUploadModal(false);
        try {
            const formData = new FormData();
            formData.append('file', file);
            await api.post('/docs/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            toast('success', 'Document uploaded successfully!');
            await fetchData();
        } catch {
            toast('error', 'Upload failed. Please try again.');
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (docId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setActiveMenu(null);
        try {
            await api.delete(`/docs/${docId}`);
            setDocuments(documents.filter(d => d._id !== docId));
            toast('success', 'Document deleted');
        } catch {
            toast('error', 'Delete failed');
        }
    };

    const filteredDocs = documents.filter(d =>
        d.originalName.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Compute stats
    const totalDocs = documents.length;
    const pendingSigs = signatures.filter(s => s.status === 'pending').length;
    const completedSigs = signatures.filter(s => s.status === 'signed').length;

    const getDocStatus = (doc: Document) => {
        const docSigs = signatures.filter(s => s.document === doc._id);
        if (docSigs.length === 0) return 'draft';
        const allSigned = docSigs.every(s => s.status === 'signed');
        const hasRejected = docSigs.some(s => s.status === 'rejected');
        if (hasRejected) return 'rejected';
        if (allSigned) return 'signed';
        return 'pending';
    };

    const getStatusBadge = (status: string) => {
        const classes: Record<string, string> = {
            draft: 'badge badge-draft',
            pending: 'badge badge-pending',
            signed: 'badge badge-signed',
            rejected: 'badge badge-rejected',
        };
        const labels: Record<string, string> = {
            draft: 'Draft',
            pending: 'Pending',
            signed: 'Signed',
            rejected: 'Rejected',
        };
        return <span className={classes[status]}>{labels[status]}</span>;
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-GB', {
            day: '2-digit', month: '2-digit', year: 'numeric',
        });
    };

    const formatSize = (bytes: number) => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    return (
        <Layout>
            {/* Page Header */}
            <div className="page-header animate-fade-in">
                <div>
                    <h1 className="page-title">Dashboard</h1>
                    <p className="page-subtitle">Manage your documents and signatures</p>
                </div>
                <button
                    className="btn btn-primary"
                    onClick={() => setShowUploadModal(true)}
                    disabled={uploading}
                >
                    {uploading ? (
                        <><Loader2 size={16} className="animate-spin" /> Uploading...</>
                    ) : (
                        <><Plus size={16} /> New Document</>
                    )}
                </button>
            </div>

            <div className="page-body">
                {/* Stats Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 28 }}>
                    <div className="stat-card animate-fade-in stagger-1">
                        <div className="stat-icon blue"><FileText size={20} /></div>
                        <div>
                            <div className="stat-label">Total Documents</div>
                            <div className="stat-value">{loading ? '—' : totalDocs}</div>
                        </div>
                    </div>
                    <div className="stat-card animate-fade-in stagger-2">
                        <div className="stat-icon orange"><Upload size={20} /></div>
                        <div>
                            <div className="stat-label">Pending Signatures</div>
                            <div className="stat-value">{loading ? '—' : pendingSigs}</div>
                        </div>
                    </div>
                    <div className="stat-card animate-fade-in stagger-3">
                        <div className="stat-icon green"><BarChart3 size={20} /></div>
                        <div>
                            <div className="stat-label">Completed</div>
                            <div className="stat-value">{loading ? '—' : completedSigs}</div>
                        </div>
                    </div>
                </div>

                {/* Recent Documents Section */}
                <div className="card animate-fade-in-up" style={{ overflow: 'hidden' }}>
                    <div style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '18px 20px', borderBottom: '1px solid var(--gray-100)', flexWrap: 'wrap', gap: 12
                    }}>
                        <h2 style={{ fontSize: 17, fontWeight: 700, color: 'var(--gray-900)' }}>
                            Recent Documents
                        </h2>
                        <div className="input-with-icon" style={{ maxWidth: 280, flex: 1 }}>
                            <Search size={16} className="input-icon" />
                            <input
                                type="text"
                                className="input-field"
                                placeholder="Search documents..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                style={{ fontSize: 13, padding: '8px 14px 8px 38px' }}
                            />
                        </div>
                    </div>

                    {loading ? (
                        <div style={{ padding: 20 }}>
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} style={{ display: 'flex', gap: 16, padding: '14px 0', borderBottom: '1px solid var(--gray-100)' }}>
                                    <div className="skeleton" style={{ width: '45%', height: 18 }} />
                                    <div className="skeleton" style={{ width: '15%', height: 18 }} />
                                    <div className="skeleton" style={{ width: '10%', height: 18 }} />
                                    <div className="skeleton" style={{ width: '12%', height: 18 }} />
                                </div>
                            ))}
                        </div>
                    ) : filteredDocs.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-state-icon">
                                <FileText size={36} />
                            </div>
                            <div className="empty-state-title">
                                {searchQuery ? 'No documents found' : 'No documents yet'}
                            </div>
                            <p className="empty-state-desc">
                                {searchQuery
                                    ? 'Try a different search term'
                                    : 'Upload your first PDF document to get started with digital signatures.'
                                }
                            </p>
                            {!searchQuery && (
                                <button className="btn btn-primary" onClick={() => setShowUploadModal(true)}>
                                    <Plus size={16} /> Upload Document
                                </button>
                            )}
                        </div>
                    ) : (
                        <div style={{ overflowX: 'auto' }}>
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Document</th>
                                        <th>Size</th>
                                        <th>Status</th>
                                        <th>Date</th>
                                        <th style={{ width: 50 }}></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredDocs.map((doc, index) => {
                                        const status = getDocStatus(doc);
                                        return (
                                            <tr
                                                key={doc._id}
                                                onClick={() => navigate(`/documents/${doc._id}`)}
                                                className="animate-fade-in"
                                                style={{ animationDelay: `${index * 0.04}s` }}
                                            >
                                                <td>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                        <div style={{
                                                            width: 36, height: 36, borderRadius: 'var(--radius-md)',
                                                            background: 'var(--status-rejected-bg)', color: 'var(--status-rejected)',
                                                            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                                                        }}>
                                                            <FileText size={18} />
                                                        </div>
                                                        <span className="doc-name">{doc.originalName}</span>
                                                    </div>
                                                </td>
                                                <td style={{ color: 'var(--gray-500)' }}>{formatSize(doc.size)}</td>
                                                <td>{getStatusBadge(status)}</td>
                                                <td style={{ color: 'var(--gray-500)' }}>{formatDate(doc.createdAt)}</td>
                                                <td>
                                                    <div style={{ position: 'relative' }}>
                                                        <button
                                                            className="btn-icon"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setActiveMenu(activeMenu === doc._id ? null : doc._id);
                                                            }}
                                                        >
                                                            <MoreVertical size={16} />
                                                        </button>
                                                        {activeMenu === doc._id && (
                                                            <div
                                                                className="animate-scale-in"
                                                                style={{
                                                                    position: 'absolute', right: 0, top: '100%',
                                                                    background: 'white', borderRadius: 'var(--radius-md)',
                                                                    boxShadow: 'var(--shadow-xl)', border: '1px solid var(--gray-200)',
                                                                    minWidth: 160, zIndex: 20, overflow: 'hidden'
                                                                }}
                                                            >
                                                                <button
                                                                    className="sidebar-link"
                                                                    style={{ padding: '10px 14px', fontSize: 13, borderRadius: 0, color: 'var(--gray-700)' }}
                                                                    onClick={(e) => { e.stopPropagation(); navigate(`/documents/${doc._id}`); }}
                                                                >
                                                                    <Eye size={15} /> Open
                                                                </button>
                                                                <button
                                                                    className="sidebar-link"
                                                                    style={{ padding: '10px 14px', fontSize: 13, borderRadius: 0, color: 'var(--gray-700)' }}
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        const url = `${import.meta.env.VITE_SERVER_URL || 'http://localhost:5000'}/${doc.path}`;
                                                                        window.open(url, '_blank');
                                                                        setActiveMenu(null);
                                                                    }}
                                                                >
                                                                    <Download size={15} /> Download
                                                                </button>
                                                                <button
                                                                    className="sidebar-link"
                                                                    style={{ padding: '10px 14px', fontSize: 13, borderRadius: 0, color: 'var(--status-rejected)' }}
                                                                    onClick={(e) => handleDelete(doc._id, e)}
                                                                >
                                                                    <Trash2 size={15} /> Delete
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Upload Modal */}
            {showUploadModal && (
                <div className="modal-overlay" onClick={() => setShowUploadModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 style={{ fontSize: 17, fontWeight: 700, color: 'var(--gray-900)' }}>Upload Document</h3>
                            <button className="btn-icon" onClick={() => setShowUploadModal(false)}>
                                <X size={20} />
                            </button>
                        </div>
                        <div className="modal-body">
                            <div
                                className={`upload-zone ${dragOver ? 'drag-over' : ''}`}
                                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                                onDragLeave={() => setDragOver(false)}
                                onDrop={(e) => {
                                    e.preventDefault();
                                    setDragOver(false);
                                    const file = e.dataTransfer.files[0];
                                    if (file) handleUpload(file);
                                }}
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <div style={{
                                    width: 56, height: 56, borderRadius: 'var(--radius-xl)', margin: '0 auto 16px',
                                    background: 'var(--accent-50)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    color: 'var(--accent-500)'
                                }}>
                                    <Upload size={24} />
                                </div>
                                <p style={{ fontWeight: 600, color: 'var(--gray-800)', marginBottom: 4 }}>
                                    Drop your PDF here or <span style={{ color: 'var(--accent-500)' }}>browse</span>
                                </p>
                                <p style={{ fontSize: 13, color: 'var(--gray-500)' }}>PDF files only, max 25MB</p>
                            </div>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".pdf"
                                hidden
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) handleUpload(file);
                                    e.target.value = '';
                                }}
                            />
                        </div>
                    </div>
                </div>
            )}
        </Layout>
    );
};

export default Dashboard;
