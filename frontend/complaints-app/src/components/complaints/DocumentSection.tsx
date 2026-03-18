'use client';

import { useState } from 'react';
import { ComplaintDocument } from '@/types/complaint';
import { complaintService } from '@/services/complaintService';
import { toast } from 'react-hot-toast';

interface Props {
    complaintId: number;
    initialDocuments: ComplaintDocument[];
    title?: string;
    onUpload?: (newDoc: ComplaintDocument) => void;
}

export default function DocumentSection({ complaintId, initialDocuments, title = 'İlgili Dokümanlar (PDF, Word, Excel)', onUpload }: Props) {
    const [documents, setDocuments] = useState<ComplaintDocument[]>(initialDocuments || []);
    const [isUploading, setIsUploading] = useState(false);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Restriction Check (PDF, Word, Excel)
        const allowedExtensions = ['.pdf', '.doc', '.docx', '.xls', '.xlsx'];
        const extension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
        
        if (!allowedExtensions.includes(extension)) {
            toast.error('Sadece PDF, Word ve Excel dosyalarına izin verilir.');
            return;
        }

        try {
            setIsUploading(true);
            const newDoc = await complaintService.uploadDocument(complaintId, file);
            setDocuments(prev => [...prev, newDoc]);
            onUpload?.(newDoc);
            toast.success('Dosya başarıyla yüklendi.');
        } catch (error) {
            console.error('File upload error:', error);
            toast.error('Dosya yüklenirken bir hata oluştu.');
        } finally {
            setIsUploading(false);
            e.target.value = '';
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
                        onChange={handleFileUpload} 
                        disabled={isUploading}
                        accept=".pdf,.doc,.docx,.xls,.xlsx"
                    />
                </label>
            </div>

            {documents.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {documents.map((doc) => (
                        <div key={doc.id} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl hover:border-blue-300 transition-colors group">
                            <div className="flex items-center gap-3 overflow-hidden">
                                <div className="p-2 bg-white rounded-lg border border-slate-100 shadow-sm">
                                    {doc.fileName.toLowerCase().endsWith('.pdf') ? (
                                        <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15h-2v-6h2v6zm4 0h-2v-6h2v6z"/></svg>
                                    ) : doc.fileName.toLowerCase().match(/\.(doc|docx)$/i) ? (
                                        <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 24 24"><path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/></svg>
                                    ) : (
                                        <svg className="w-5 h-5 text-emerald-500" fill="currentColor" viewBox="0 0 24 24"><path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/></svg>
                                    )}
                                </div>
                                <div className="overflow-hidden">
                                    <div className="text-xs font-bold text-slate-700 truncate" title={doc.fileName}>{doc.fileName}</div>
                                    <div className="text-[10px] text-slate-500">{formatFileSize(doc.fileSize)} • {doc.uploadedByName}</div>
                                </div>
                            </div>
                            <button 
                                onClick={() => handleDownload(doc)}
                                className="p-2 text-slate-400 hover:text-blue-600 hover:bg-white rounded-lg transition-all"
                                title="İndir"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                            </button>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="bg-slate-50 rounded-xl p-6 border border-dashed border-slate-200 text-center">
                    <div className="text-slate-400 text-xs font-bold">Henüz doküman eklenmemiş.</div>
                    <div className="text-[10px] text-slate-400 mt-1 italic font-medium">PDF, Word veya Excel dosyaları yükleyebilirsiniz.</div>
                </div>
            )}
        </div>
    );
}
