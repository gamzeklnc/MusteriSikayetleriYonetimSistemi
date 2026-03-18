'use client';

import { useState, useEffect } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { complaintService } from '@/services/complaintService';
import { ComplaintDto, ComplaintDocument } from '@/types/complaint';
import ComplaintDetailModal from '@/components/complaints/ComplaintDetailModal';
import DocumentSection from '@/components/complaints/DocumentSection';

export default function ActionsPage() {
    const [complaints, setComplaints] = useState<ComplaintDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedComplaint, setSelectedComplaint] = useState<ComplaintDto | null>(null);
    const [showDetailModal, setShowDetailModal] = useState(false);

    const fetchComplaints = async () => {
        try {
            setLoading(true);
            const data = await complaintService.getAll();
            // Sadece "Aksiyon Planı" aşamasındakileri filtrele
            const filtered = data.filter(c => c.currentDepartmentName === 'Aksiyon Planı');
            setComplaints(filtered);
        } catch (error) {
            console.error('Şikayetler yüklenemedi:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchComplaints();
    }, []);

    return (
        <AppLayout>
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Aksiyonlar</h1>
                        <p className="text-slate-500 text-sm mt-1">Geri dönüşü tamamlanmış şikayetlerin operasyonel takibi.</p>
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-200">
                                    <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Şikayet No</th>
                                    <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Müşteri</th>
                                    <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Proje İsmi</th>
                                    <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Mevcut Aşama</th>
                                    <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-right">İşlemler</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {loading ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-slate-400">Yükleniyor...</td>
                                    </tr>
                                ) : complaints.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-slate-400">Bekleyen operasyonel aksiyon bulunmuyor.</td>
                                    </tr>
                                ) : (
                                    complaints.map((c) => (
                                        <tr key={c.id} className="hover:bg-slate-50/50 transition-colors group">
                                            <td className="px-6 py-4 font-mono text-xs font-bold text-blue-600">{c.complaintNumber}</td>
                                            <td className="px-6 py-4 text-sm font-medium text-slate-700">{c.customerName}</td>
                                            <td className="px-6 py-4 text-sm text-slate-600">{c.projectName}</td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                                                    c.operationalStage 
                                                    ? 'bg-blue-50 text-blue-600 border border-blue-100' 
                                                    : 'bg-slate-100 text-slate-500 border border-slate-200'
                                                }`}>
                                                    {c.operationalStage || 'Aşama Belirlenmedi'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => {
                                                            setSelectedComplaint(c);
                                                            setShowDetailModal(true);
                                                        }}
                                                        className="px-4 py-2 bg-blue-600 text-white text-[11px] font-bold rounded-lg hover:bg-blue-700 shadow-sm transition-all active:scale-95 flex items-center gap-2"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                        </svg>
                                                        DEĞERLENDİR / DETAY
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Detay ve Aşama Güncelleme Modal */}
            {showDetailModal && selectedComplaint && (
                <ComplaintDetailModal
                    complaint={selectedComplaint}
                    onClose={() => {
                        setShowDetailModal(false);
                        setSelectedComplaint(null);
                    }}
                    showOperationalStageUpdate={true}
                    onOperationalStageUpdate={(updatedComplaint) => {
                        setSelectedComplaint(updatedComplaint);
                        setComplaints(prev => prev.map(c => 
                            c.id === updatedComplaint.id ? updatedComplaint : c
                        ));
                    }}
                    onUpload={(newDoc: ComplaintDocument) => {
                        const updated = {
                            ...selectedComplaint,
                            documents: [...(selectedComplaint.documents || []), newDoc]
                        };
                        setSelectedComplaint(updated);
                        setComplaints(prev => prev.map(c => 
                            c.id === updated.id ? updated : c
                        ));
                    }}
                />
            )}
        </AppLayout>
    );
}
