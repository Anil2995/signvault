import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Upload, Plus, Search, Loader2, MoreVertical, Eye, Trash2, X, Grid, List } from 'lucide-react';
import api from '../lib/axios';
import { useToast } from '../components/Toast';
import Layout from '../components/Layout';
import type { Document } from '../types';

const Documents = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [documents, setDocuments] = useState<Document[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [view, setView] = useState<'list' | 'grid'>('list');
    const [activeMenu, setActiveMenu] = useState<string | null>(null);
    const [dragOver, setDragOver] = useState(false);
    const [showUploadModal, setShowUploadModal] = useState(false);

    const fetchDocs = async () => {
        try {
            const { data } = await api.get('/docs');
            setDocuments(data);
        } catch {
            toast('error', 'Failed to load documents');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchDocs(); }, []);
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
            toast('success', 'Document uploaded!');
            await fetchDocs();
        } catch {
            toast('error', 'Upload failed');
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

    const formatDate = (dateStr: string) =>
        new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });

    const formatSize = (bytes: number) => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    return (
        <Layout>
            <div className="page-header animate-fade-in">
                <div>
                    <h1 className="page-title">Documents</h1>
                    <p className="page-subtitle">All your uploaded documents</p>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-primary" onClick={() => setShowUploadModal(true)} disabled={uploading}>
                        {uploading ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                        Upload
                    </button>
                </div>
            </div>

            <div className="page-body">
                {/* Toolbar */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, gap: 12, flexWrap: 'wrap' }}>
                    <div className="input-with-icon" style={{ maxWidth: 320, flex: 1 }}>
                        <Search size={16} className="input-icon" />
                        <input
                            type="text"
                            className="input-field"
                            placeholder="Search documents..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{ fontSize: 13, padding: '9px 14px 9px 38px' }}
                        />
                    </div>
                    <div style={{ display: 'flex', gap: 4 }}>
                        <button className={`btn-icon ${view === 'list' ? '' : ''}`} onClick={() => setView('list')}
                            style={{ background: view === 'list' ? 'var(--gray-100)' : 'transparent' }}>
                            <List size={18} />
                        </button>
                        <button className="btn-icon" onClick={() => setView('grid')}
                            style={{ background: view === 'grid' ? 'var(--gray-100)' : 'transparent' }}>
                            <Grid size={18} />
                        </button>
                    </div>
                </div>

                {/* Drag and drop zone */}
                {!loading && documents.length === 0 ? (
                    <div
                        className={`upload-zone ${dragOver ? 'drag-over' : ''}`}
                        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                        onDragLeave={() => setDragOver(false)}
                        onDrop={(e) => { e.preventDefault(); setDragOver(false); handleUpload(e.dataTransfer.files[0]); }}
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <div className="empty-state" style={{ padding: 20 }}>
                            <div className="empty-state-icon"><Upload size={36} /></div>
                            <div className="empty-state-title">Upload your first document</div>
                            <p className="empty-state-desc">Drag and drop a PDF file here, or click to browse</p>
                        </div>
                    </div>
                ) : loading ? (
                    <div className="card" style={{ overflow: 'hidden' }}>
                        <div style={{ padding: 20 }}>
                            {[1, 2, 3, 4, 5].map(i => (
                                <div key={i} style={{ display: 'flex', gap: 16, padding: '14px 0', borderBottom: '1px solid var(--gray-100)' }}>
                                    <div className="skeleton" style={{ width: '50%', height: 18 }} />
                                    <div className="skeleton" style={{ width: '15%', height: 18 }} />
                                    <div className="skeleton" style={{ width: '12%', height: 18 }} />
                                </div>
                            ))}
                        </div>
                    </div>
                ) : view === 'list' ? (
                    <div className="card animate-fade-in" style={{ overflow: 'hidden' }}>
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Size</th>
                                    <th>Date</th>
                                    <th style={{ width: 50 }}></th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredDocs.map((doc, i) => (
                                    <tr key={doc._id} onClick={() => navigate(`/documents/${doc._id}`)}
                                        className="animate-fade-in" style={{ animationDelay: `${i * 0.03}s` }}>
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
                                        <td style={{ color: 'var(--gray-500)' }}>{formatDate(doc.createdAt)}</td>
                                        <td>
                                            <div style={{ position: 'relative' }}>
                                                <button className="btn-icon" onClick={(e) => {
                                                    e.stopPropagation();
                                                    setActiveMenu(activeMenu === doc._id ? null : doc._id);
                                                }}>
                                                    <MoreVertical size={16} />
                                                </button>
                                                {activeMenu === doc._id && (
                                                    <div className="animate-scale-in" style={{
                                                        position: 'absolute', right: 0, top: '100%', background: 'white',
                                                        borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-xl)',
                                                        border: '1px solid var(--gray-200)', minWidth: 150, zIndex: 20
                                                    }}>
                                                        <button className="sidebar-link" style={{ padding: '10px 14px', fontSize: 13, borderRadius: 0, color: 'var(--gray-700)' }}
                                                            onClick={(e) => { e.stopPropagation(); navigate(`/documents/${doc._id}`); }}>
                                                            <Eye size={15} /> Open
                                                        </button>
                                                        <button className="sidebar-link" style={{ padding: '10px 14px', fontSize: 13, borderRadius: 0, color: 'var(--status-rejected)' }}
                                                            onClick={(e) => handleDelete(doc._id, e)}>
                                                            <Trash2 size={15} /> Delete
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
                        {filteredDocs.map((doc, i) => (
                            <div key={doc._id} className="card card-hover animate-fade-in" style={{ padding: 20, cursor: 'pointer', animationDelay: `${i * 0.04}s` }}
                                onClick={() => navigate(`/documents/${doc._id}`)}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, marginBottom: 12, background: 'var(--gray-50)', borderRadius: 'var(--radius-md)' }}>
                                    <FileText size={40} color="var(--status-rejected)" />
                                </div>
                                <div className="doc-name" style={{ fontSize: 13, marginBottom: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{doc.originalName}</div>
                                <div style={{ fontSize: 12, color: 'var(--gray-400)' }}>{formatSize(doc.size)} · {formatDate(doc.createdAt)}</div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Upload Modal */}
            {showUploadModal && (
                <div className="modal-overlay" onClick={() => setShowUploadModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 style={{ fontSize: 17, fontWeight: 700 }}>Upload Document</h3>
                            <button className="btn-icon" onClick={() => setShowUploadModal(false)}><X size={20} /></button>
                        </div>
                        <div className="modal-body">
                            <div className={`upload-zone ${dragOver ? 'drag-over' : ''}`}
                                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                                onDragLeave={() => setDragOver(false)}
                                onDrop={(e) => { e.preventDefault(); setDragOver(false); handleUpload(e.dataTransfer.files[0]); }}
                                onClick={() => fileInputRef.current?.click()}>
                                <div style={{ width: 56, height: 56, borderRadius: 'var(--radius-xl)', margin: '0 auto 16px', background: 'var(--accent-50)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-500)' }}>
                                    <Upload size={24} />
                                </div>
                                <p style={{ fontWeight: 600, marginBottom: 4 }}>Drop your PDF here or <span style={{ color: 'var(--accent-500)' }}>browse</span></p>
                                <p style={{ fontSize: 13, color: 'var(--gray-500)' }}>PDF files only</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            <input ref={fileInputRef} type="file" accept=".pdf" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f); e.target.value = ''; }} />
        </Layout>
    );
};

export default Documents;
