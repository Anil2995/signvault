import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Document as PdfDocument, Page, pdfjs } from 'react-pdf';
import { DndContext, useDraggable, type DragEndEvent } from '@dnd-kit/core';
import {
    ArrowLeft, ZoomIn, ZoomOut, Plus, Download, Loader2,
    Trash2, PenTool, GripVertical, CheckCircle2
} from 'lucide-react';
import api from '../lib/axios';
import SignatureModal from '../components/SignatureModal';
import { useToast } from '../components/Toast';
import Layout from '../components/Layout';
import type { Document, Signature } from '../types';

import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

// Draggable signature component
const DraggableSignature = ({ sig, onSign, onDelete }: {
    sig: Signature;
    onSign: (sig: Signature) => void;
    onDelete: (id: string) => void;
}) => {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: sig._id,
    });

    const style: React.CSSProperties = {
        position: 'absolute',
        left: `${sig.x}%`,
        top: `${sig.y}%`,
        transform: transform
            ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
            : undefined,
        zIndex: isDragging ? 100 : 10,
        cursor: isDragging ? 'grabbing' : 'grab',
        opacity: isDragging ? 0.85 : 1,
        transition: isDragging ? 'none' : 'box-shadow 0.2s',
    };

    return (
        <div ref={setNodeRef} style={style}>
            <div style={{
                background: sig.status === 'signed' ? 'var(--status-signed-bg)' : 'white',
                border: sig.status === 'signed'
                    ? '2px solid var(--status-signed-border)'
                    : '2px dashed var(--accent-400)',
                borderRadius: 'var(--radius-md)',
                padding: sig.status === 'signed' ? '8px 14px' : '10px 16px',
                boxShadow: isDragging ? 'var(--shadow-xl)' : 'var(--shadow-md)',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                minWidth: 120,
            }}>
                {sig.status === 'signed' ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <CheckCircle2 size={14} color="var(--status-signed)" />
                        {sig.signatureImage ? (
                            <img src={sig.signatureImage} alt="sig" style={{ height: 28, objectFit: 'contain' }} />
                        ) : (
                            <span className="font-signature" style={{ fontSize: 18, color: 'var(--gray-800)' }}>
                                {sig.signatureText}
                            </span>
                        )}
                    </div>
                ) : (
                    <>
                        <div {...attributes} {...listeners} style={{ cursor: 'grab', color: 'var(--gray-400)' }}>
                            <GripVertical size={16} />
                        </div>
                        <button
                            onClick={() => onSign(sig)}
                            className="btn btn-primary btn-sm"
                            style={{ fontSize: 11, padding: '5px 10px' }}
                        >
                            <PenTool size={12} /> Sign
                        </button>
                        <button
                            onClick={() => onDelete(sig._id)}
                            className="btn-icon"
                            style={{ padding: 4, color: 'var(--status-rejected)' }}
                        >
                            <Trash2 size={13} />
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};

const DocumentView = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { toast } = useToast();
    const containerRef = useRef<HTMLDivElement>(null);

    const [doc, setDoc] = useState<Document | null>(null);
    const [signatures, setSignatures] = useState<Signature[]>([]);
    const [loading, setLoading] = useState(true);
    const [numPages, setNumPages] = useState(0);
    const [zoom, setZoom] = useState(1);
    const [showSignModal, setShowSignModal] = useState(false);
    const [selectedSig, setSelectedSig] = useState<Signature | null>(null);
    const [downloading, setDownloading] = useState(false);

    const fetchData = useCallback(async () => {
        try {
            const [docRes, sigsRes] = await Promise.all([
                api.get(`/docs/${id}`),
                api.get(`/signatures/${id}`),
            ]);
            setDoc(docRes.data);
            setSignatures(sigsRes.data);
        } catch {
            toast('error', 'Failed to load document');
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleAddSignature = async () => {
        try {
            const { data } = await api.post('/signatures', {
                documentId: id,
                page: 1,
                x: 50,
                y: 50,
            });
            setSignatures([...signatures, data]);
            toast('success', 'Signature placeholder added');
        } catch {
            toast('error', 'Failed to add signature');
        }
    };

    const handleSign = (sig: Signature) => {
        setSelectedSig(sig);
        setShowSignModal(true);
    };

    const handleSignComplete = async (type: string, value: string) => {
        if (!selectedSig) return;
        try {
            const payload: any = { status: 'signed' };
            if (type === 'image') payload.signatureImage = value;
            else payload.signatureText = value;

            const { data } = await api.put(`/signatures/${selectedSig._id}`, payload);
            setSignatures(signatures.map(s => s._id === selectedSig._id ? data : s));
            setShowSignModal(false);
            setSelectedSig(null);
            toast('success', 'Signature applied!');
        } catch {
            toast('error', 'Failed to apply signature');
        }
    };

    const handleDelete = async (sigId: string) => {
        try {
            await api.delete(`/signatures/${sigId}`);
            setSignatures(signatures.filter(s => s._id !== sigId));
            toast('success', 'Signature removed');
        } catch {
            toast('error', 'Failed to delete');
        }
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, delta } = event;
        const container = containerRef.current;
        if (!container) return;

        const rect = container.getBoundingClientRect();
        const sig = signatures.find(s => s._id === active.id);
        if (!sig) return;

        const newX = sig.x + (delta.x / rect.width) * 100;
        const newY = sig.y + (delta.y / rect.height) * 100;
        const clampedX = Math.max(0, Math.min(90, newX));
        const clampedY = Math.max(0, Math.min(90, newY));

        setSignatures(signatures.map(s =>
            s._id === active.id ? { ...s, x: clampedX, y: clampedY } : s
        ));

        try {
            await api.put(`/signatures/${active.id}`, { x: clampedX, y: clampedY });
        } catch {
            toast('error', 'Failed to save position');
        }
    };

    const handleDownload = async () => {
        setDownloading(true);
        try {
            await api.post(`/docs/${id}/finalize`);
            const serverUrl = import.meta.env.VITE_SERVER_URL || 'http://localhost:5000';
            // Refresh doc to get the signed path
            const { data } = await api.get(`/docs/${id}`);
            window.open(`${serverUrl}/${data.signedPath || data.path}`, '_blank');
            toast('success', 'Document finalized & downloaded!');
        } catch {
            toast('error', 'Download failed');
        } finally {
            setDownloading(false);
        }
    };

    const signedCount = signatures.filter(s => s.status === 'signed').length;
    const totalSigs = signatures.length;
    const pdfUrl = doc ? `${import.meta.env.VITE_SERVER_URL || 'http://localhost:5000'}/${doc.path}` : '';

    if (loading) {
        return (
            <Layout>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
                    <Loader2 size={32} className="animate-spin" style={{ color: 'var(--accent-500)' }} />
                </div>
            </Layout>
        );
    }

    if (!doc) {
        return (
            <Layout>
                <div className="empty-state" style={{ minHeight: '60vh' }}>
                    <div className="empty-state-title">Document not found</div>
                    <button className="btn btn-primary" onClick={() => navigate('/dashboard')}>Go to Dashboard</button>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            {/* Toolbar */}
            <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '16px 32px', borderBottom: '1px solid var(--gray-200)',
                background: 'white', position: 'sticky', top: 0, zIndex: 20,
                flexWrap: 'wrap', gap: 12,
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <button className="btn btn-ghost" onClick={() => navigate('/dashboard')}>
                        <ArrowLeft size={18} /> Back
                    </button>
                    <div style={{ width: 1, height: 20, background: 'var(--gray-200)' }} />
                    <h2 style={{ fontSize: 15, fontWeight: 600, color: 'var(--gray-800)' }}>{doc.originalName}</h2>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {/* Progress */}
                    {totalSigs > 0 && (
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px',
                            borderRadius: 'var(--radius-full)',
                            background: signedCount === totalSigs ? 'var(--status-signed-bg)' : 'var(--status-pending-bg)',
                            fontSize: 12, fontWeight: 600,
                            color: signedCount === totalSigs ? 'var(--status-signed)' : 'var(--status-pending)',
                        }}>
                            <CheckCircle2 size={14} />
                            {signedCount}/{totalSigs} signed
                        </div>
                    )}

                    {/* Zoom */}
                    <button className="btn-icon" onClick={() => setZoom(z => Math.max(0.5, z - 0.15))}><ZoomOut size={18} /></button>
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--gray-500)', minWidth: 40, textAlign: 'center' }}>
                        {Math.round(zoom * 100)}%
                    </span>
                    <button className="btn-icon" onClick={() => setZoom(z => Math.min(2, z + 0.15))}><ZoomIn size={18} /></button>

                    <div style={{ width: 1, height: 20, background: 'var(--gray-200)' }} />

                    <button className="btn btn-secondary btn-sm" onClick={handleAddSignature}>
                        <Plus size={14} /> Add Signature
                    </button>
                    <button className="btn btn-primary btn-sm" onClick={handleDownload} disabled={downloading}>
                        {downloading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                        Download
                    </button>
                </div>
            </div>

            {/* PDF Viewer */}
            <div style={{ padding: '24px 32px', display: 'flex', justifyContent: 'center', minHeight: 'calc(100vh - 140px)', background: 'var(--gray-100)' }}>
                <DndContext onDragEnd={handleDragEnd}>
                    <div
                        ref={containerRef}
                        style={{ position: 'relative', display: 'inline-block' }}
                    >
                        <PdfDocument
                            file={pdfUrl}
                            onLoadSuccess={({ numPages }) => setNumPages(numPages)}
                            loading={
                                <div style={{ width: 600 * zoom, height: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Loader2 size={28} className="animate-spin" style={{ color: 'var(--accent-500)' }} />
                                </div>
                            }
                        >
                            {Array.from({ length: numPages }, (_, i) => (
                                <div key={i} style={{ marginBottom: 16, boxShadow: 'var(--shadow-lg)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                                    <Page
                                        pageNumber={i + 1}
                                        scale={zoom}
                                        renderTextLayer={true}
                                        renderAnnotationLayer={true}
                                    />
                                </div>
                            ))}
                        </PdfDocument>

                        {/* Signatures */}
                        {signatures.map((sig) => (
                            <DraggableSignature
                                key={sig._id}
                                sig={sig}
                                onSign={handleSign}
                                onDelete={handleDelete}
                            />
                        ))}
                    </div>
                </DndContext>
            </div>

            {/* Signature Modal */}
            {showSignModal && selectedSig && (
                <SignatureModal
                    onClose={() => { setShowSignModal(false); setSelectedSig(null); }}
                    onSign={(type, value) => handleSignComplete(type, value)}
                />
            )}
        </Layout>
    );
};

export default DocumentView;
