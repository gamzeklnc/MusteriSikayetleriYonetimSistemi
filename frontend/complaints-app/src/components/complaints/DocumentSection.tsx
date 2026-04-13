'use client';

import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { useAuthStore } from '@/store/authStore';
import { complaintService } from '@/services/complaintService';
import { ComplaintDocument } from '@/types/complaint';
import { Trash2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface Props {
    complaintId: number;
    initialDocuments: ComplaintDocument[];
    currentStage?: string;
    title?: string;
    onUpload?: (newDoc: ComplaintDocument) => void;
    onDelete?: (docId: number) => void;
    canUpload?: boolean;
    is8DOnly?: boolean;
}

export interface DocumentSectionRef {
    openFileUpload: () => void;
}

const DocumentSection = forwardRef<DocumentSectionRef, Props>(
    ({ complaintId, initialDocuments, currentStage, title = 'İlgili Dokümanlar (PDF, Word, Excel)', onUpload, onDelete, canUpload = true, is8DOnly = false }, ref) => {
    const [documents, setDocuments] = useState<ComplaintDocument[]>(initialDocuments || []);
    const { user } = useAuthStore();
    
    useImperativeHandle(ref, () => ({
        openFileUpload: () => fileInputRef.current?.click()
    }));
    
    useEffect(() => {
        setDocuments(initialDocuments || []);
    }, [initialDocuments]);

    const displayedDocuments = documents.filter(d => !!d.is8DReport === !!is8DOnly);
    const [isUploading, setIsUploading] = useState(false);
    const [isDeleting, setIsDeleting] = useState<number | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [previewDoc, setPreviewDoc] = useState<ComplaintDocument | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleDelete = async (doc: ComplaintDocument) => {
        if (!window.confirm(`'${doc.fileName}' isimli dosyayı silmek istediğinize emin misiniz?`)) {
            return;
        }

        try {
            setIsDeleting(doc.id);
            await complaintService.deleteDocument(doc.id);
            setDocuments(prev => prev.filter(d => d.id !== doc.id));
            onDelete?.(doc.id);
            toast.success('Dosya silindi.');
        } catch (error: any) {
            console.error('Delete error:', error);
            const message = error.response?.data || 'Dosya silinirken bir hata oluştu.';
            toast.error(typeof message === 'string' ? message : 'Dosya silinirken bir hata oluştu.');
        } finally {
            setIsDeleting(null);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const allowedExtensions = ['.pdf', '.doc', '.docx', '.xls', '.xlsx'];
        const extension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
        
        if (!allowedExtensions.includes(extension)) {
            toast.error('Sadece PDF, Word ve Excel dosyalarına izin verilir.');
            return;
        }

        try {
            setIsUploading(true);
            const newDoc = await complaintService.uploadDocument(complaintId, file, is8DOnly);
            setDocuments(prev => [...prev, newDoc]);
            onUpload?.(newDoc);
            toast.success('Dosya başarıyla yüklendi.');
        } catch (error) {
            console.error('File upload error:', error);
            toast.error('Dosya yüklenirken bir hata oluştu.');
        } finally {
            setIsUploading(false);
            if (e.target) e.target.value = '';
        }
    };

    const handleDownload = async (doc: ComplaintDocument) => {
        try {
            await complaintService.downloadDocument(doc.id, doc.fileName);
        } catch (error) {
            console.error('Download error:', error);
            toast.error('Dosya indirilirken bir hata oluştu.');
        }
    };

    const handlePreview = async (doc: ComplaintDocument) => {
        const isPdf = doc.fileName.toLowerCase().endsWith('.pdf');
        
        if (!isPdf) {
            toast('Bu dosya türü doğrudan görüntülenemez, indiriliyor...', { icon: 'ℹ️' });
            handleDownload(doc);
            return;
        }

        try {
            const { url } = await complaintService.getFileBlob(doc.id);
            setPreviewUrl(url);
            setPreviewDoc(doc);
        } catch (error) {
            console.error('Preview error:', error);
            toast.error('Dosya görüntülenirken bir hata oluştu.');
        }
    };

    const closePreview = () => {
        if (previewUrl) {
            window.URL.revokeObjectURL(previewUrl);
        }
        setPreviewUrl(null);
        setPreviewDoc(null);
    };

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-xs font-black text-slate-900 tracking-wider uppercase">{title}</h3>
                {canUpload && (
                    <label className={`
                        flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer
                        ${isUploading ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200'}
                    `}>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        {isUploading ? 'Yükleniyor...' : 'Yeni Doküman Ekle'}
                        <input 
                            type="file" 
                            className="hidden" 
                            ref={fileInputRef}
                            onChange={handleFileUpload} 
                            disabled={isUploading}
                            accept=".pdf,.doc,.docx,.xls,.xlsx"
                        />
                    </label>
                )}
            </div>

            {displayedDocuments.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {displayedDocuments.map((doc) => {
                        const isOwner = user?.name === doc.uploadedByName;
                        const isSameStage = currentStage === doc.uploadedAtStage;
                        const canDelete = isOwner && isSameStage;

                        return (
                            <div key={doc.id} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl hover:border-blue-300 transition-colors group relative">
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <div className="p-2 bg-white rounded-lg border border-slate-100 shadow-sm">
                                        {doc.fileName.toLowerCase().endsWith('.pdf') ? (
                                            <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                                        ) : doc.fileName.toLowerCase().match(/\.(doc|docx)$/i) ? (
                                            <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                        ) : (
                                            <svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                        )}
                                    </div>
                                    <div className="overflow-hidden">
                                        <div className="text-xs font-bold text-slate-700 truncate" title={doc.fileName}>{doc.fileName}</div>
                                        <div className="text-[10px] text-slate-500">{formatFileSize(doc.fileSize)} • {doc.uploadedByName}</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button 
                                        onClick={() => handlePreview(doc)}
                                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-white rounded-lg transition-all"
                                        title="Görüntüle"
                                    >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                        </svg>
                                    </button>
                                    <button 
                                        onClick={() => handleDownload(doc)}
                                        className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-white rounded-lg transition-all"
                                        title="İndir"
                                    >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                        </svg>
                                    </button>
                                    {canDelete && (
                                        <button 
                                            onClick={() => handleDelete(doc)}
                                            disabled={isDeleting === doc.id}
                                            className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                            title="Sil"
                                        >
                                            {isDeleting === doc.id ? (
                                                <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                                            ) : (
                                                <Trash2 className="w-4 h-4" />
                                            )}
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="bg-slate-50 rounded-xl p-6 border border-dashed border-slate-200 text-center">
                    <div className="text-slate-400 text-xs font-bold">Henüz doküman eklenmemiş.</div>
                    <div className="text-[10px] text-slate-400 mt-1 italic font-medium">PDF, Word veya Excel dosyaları yükleyebilirsiniz.</div>
                </div>
            )}

            {/* Preview Modal */}
            {previewUrl && previewDoc && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={closePreview}></div>
                    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-white">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-red-50 text-red-600 rounded-lg">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                <h4 className="font-bold text-slate-800 truncate max-w-md">{previewDoc.fileName}</h4>
                            </div>
                            <div className="flex items-center gap-2">
                                <button 
                                    onClick={() => handleDownload(previewDoc)}
                                    className="px-4 py-2 bg-slate-50 text-slate-600 hover:bg-slate-100 text-sm font-bold rounded-xl transition-all flex items-center gap-2"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                    </svg>
                                    İndir
                                </button>
                                <button onClick={closePreview} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all">
                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                        <div className="flex-1 bg-slate-100 relative">
                            <iframe 
                                src={previewUrl} 
                                className="w-full h-full border-none"
                                title="Document Preview"
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
});

DocumentSection.displayName = 'DocumentSection';
export default DocumentSection;
