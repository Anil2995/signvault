export interface User {
    id: string;
    name: string;
    email: string;
    defaultSignature?: {
        type: 'text' | 'image';
        value: string;
    };
}

export interface Document {
    _id: string;
    user: string;
    filename: string;
    originalName: string;
    path: string;
    mimeType: string;
    size: number;
    createdAt: string;
    updatedAt: string;
}

export interface Signature {
    _id: string;
    document: string;
    user: string;
    status: 'pending' | 'signed' | 'rejected';
    page: number;
    x: number;
    y: number;
    signatureText?: string;
    signatureImage?: string;
    createdAt: string;
    updatedAt: string;
}
