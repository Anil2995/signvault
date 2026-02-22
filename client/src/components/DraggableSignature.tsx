import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { X, GripVertical, Check, PenTool } from 'lucide-react';
import type { Signature } from '../types';

interface DraggableSignatureProps {
    signature: Signature;
    onDelete: (id: string) => void;
    onSign?: (id: string) => void;
    isOwner: boolean;
    scale?: number;
}

export const DraggableSignature = ({ signature, onDelete, onSign, isOwner }: DraggableSignatureProps) => {
    const { attributes, listeners, setNodeRef, transform } = useDraggable({
        id: signature._id,
        data: signature,
        disabled: !isOwner || signature.status === 'signed',
    });

    const style = {
        transform: CSS.Translate.toString(transform),
        left: `${signature.x}%`,
        top: `${signature.y}%`,
        position: 'absolute' as const,
        touchAction: 'none',
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`group flex items-center gap-2 transform -translate-x-1/2 -translate-y-1/2 ${signature.status === 'signed' ? 'cursor-default' : isOwner ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'
                }`}
        >
            <div
                className={`relative flex flex-col items-center justify-center rounded-lg border-2 p-3 shadow-sm transition-all ${signature.status === 'signed'
                    ? 'border-green-500 bg-green-50 text-green-700'
                    : 'border-blue-500 bg-blue-50 text-blue-700 hover:bg-blue-100'
                    }`}
                {...attributes}
                {...listeners}
            >
                {/* Drag Handle for mobile/easier grabbing */}
                {isOwner && signature.status !== 'signed' && (
                    <div className="absolute -left-3 top-1/2 -translate-y-1/2 cursor-grab text-gray-400 opacity-0 group-hover:opacity-100">
                        <GripVertical size={14} />
                    </div>
                )}

                {signature.status === 'signed' ? (
                    <div className="flex flex-col items-center">
                        {signature.signatureImage ? (
                            <img src={signature.signatureImage} alt="Signature" className="h-10 object-contain" />
                        ) : (
                            <span className="font-script text-xl">{signature.signatureText}</span>
                        )}
                        <div className="mt-1 flex items-center text-[10px] uppercase tracking-wider text-green-600">
                            <Check size={10} className="mr-1" /> Signed
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="flex items-center gap-1.5 whitespace-nowrap text-sm font-semibold">
                            <PenTool size={14} />
                            <span>Sign Here</span>
                        </div>
                    </>
                )}

                {/* Delete Button */}
                {isOwner && signature.status !== 'signed' && (
                    <button
                        onClick={(e) => {
                            // Prevent drag start
                            e.stopPropagation();
                            // Prevent default
                            e.preventDefault();
                            onDelete(signature._id);
                        }}
                        onPointerDown={(e) => e.stopPropagation()} // Important to prevent drag
                        className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white shadow-sm opacity-0 group-hover:opacity-100 hover:bg-red-600 transition-opacity"
                        title="Remove Signature"
                    >
                        <X size={12} />
                    </button>
                )}
            </div>

            {/* Sign Button (for non-owners or when testing self-signing) */}
            {/* Logic to show this only if current user is the signer */}
            {signature.status !== 'signed' && onSign && (
                <button
                    onClick={() => onSign(signature._id)}
                    className="rounded-md bg-blue-600 px-3 py-1 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                    Sign
                </button>
            )}
        </div>
    );
};
