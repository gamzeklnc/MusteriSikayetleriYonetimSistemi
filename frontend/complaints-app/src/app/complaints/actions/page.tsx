'use client';

import { useState, useEffect } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { complaintService } from '@/services/complaintService';
import { ComplaintDto, ComplaintDocument } from '@/types/complaint';
import StatusBadge from '@/components/complaints/StatusBadge';
import ComplaintDetailModal from '@/components/complaints/ComplaintDetailModal';

export default function ActionsPage() {
    const [complaints, setComplaints] = useState<ComplaintDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedComplaint, setSelectedComplaint] = useState<ComplaintDto | null>(null);
    const [showDetailModal, setShowDetailModal] = useState(false);

    const [filters, setFilters] = useState({
        complaintNumber: '',
        customerName: '',
        projectName: '',
        currentDepartmentName: '',
        status: '',
        operationalStage: '',
    });

    const handleFilterChange = (key: keyof typeof filters, value: string) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const fetchComplaints = async () => {
        try {
            setLoading(true);
            const data = await complaintService.getAll();
            // Sadece müşteri geri dönüşü yapılmış (Aksiyon aşaması) olanları filtrele
            const filtered = data.filter(c => c.isCustomerFeedbackDone === true);
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

    const filteredComplaints = complaints.filter(c => {
        const safeMatch = (val: string | undefined | null, search: string) =>
            !search || (val && val.toLowerCase().includes(search.toLowerCase()));
        return (
            safeMatch(c.complaintNumber, filters.complaintNumber) &&
            safeMatch(c.customerName, filters.customerName) &&
            safeMatch(c.projectName, filters.projectName) &&
            safeMatch(c.currentDepartmentName, filters.currentDepartmentName) &&
            safeMatch(c.status, filters.status) &&
            safeMatch(c.operationalStage || 'Aşama Belirlenmedi', filters.operationalStage)
        );
    });

    return (
        <AppLayout>
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Aksiyonlar</h1>
                        <p className="text-slate-500 text-sm mt-1">Müşteri geri dönüşü tamamlanmış şikayetlerin operasyonel takibi.</p>
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-200">
                                    <th className="px-4 py-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider align-bottom">
                                        <div className="mb-1.5">Şikayet No</div>
                                        <input type="text" placeholder="Ara..." value={filters.complaintNumber} onChange={e => handleFilterChange('complaintNumber', e.target.value)} className="w-full px-1.5 py-1 border border-slate-200 rounded text-[10px] font-medium bg-white focus:ring-1 focus:ring-blue-500 outline-none transition-all normal-case" />
                                    </th>
                                    <th className="px-4 py-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider align-bottom">
                                        <div className="mb-1.5">Müşteri</div>
                                        <input type="text" placeholder="Ara..." value={filters.customerName} onChange={e => handleFilterChange('customerName', e.target.value)} className="w-full px-1.5 py-1 border border-slate-200 rounded text-[10px] font-medium bg-white focus:ring-1 focus:ring-blue-500 outline-none transition-all normal-case" />
                                    </th>
                                    <th className="px-4 py-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider align-bottom">
                                        <div className="mb-1.5">Proje İsmi</div>
                                        <input type="text" placeholder="Ara..." value={filters.projectName} onChange={e => handleFilterChange('projectName', e.target.value)} className="w-full px-1.5 py-1 border border-slate-200 rounded text-[10px] font-medium bg-white focus:ring-1 focus:ring-blue-500 outline-none transition-all normal-case" />
                                    </th>
                                    <th className="px-4 py-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider align-bottom">
                                        <div className="mb-1.5 text-center">Depertman</div>
                                        <input type="text" placeholder="Ara..." value={filters.currentDepartmentName} onChange={e => handleFilterChange('currentDepartmentName', e.target.value)} className="w-full px-1.5 py-1 border border-slate-200 rounded text-[10px] font-medium bg-white focus:ring-1 focus:ring-blue-500 outline-none transition-all normal-case" />
                                    </th>
                                    <th className="px-4 py-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider align-bottom">
                                        <div className="mb-1.5 text-center">Durum</div>
                                        <input type="text" placeholder="Ara..." value={filters.status} onChange={e => handleFilterChange('status', e.target.value)} className="w-full px-1.5 py-1 border border-slate-200 rounded text-[10px] font-medium bg-white focus:ring-1 focus:ring-blue-500 outline-none transition-all normal-case" />
                                    </th>
                                    <th className="px-4 py-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider align-bottom">
                                        <div className="mb-1.5">Operasyonel Aşama</div>
                                        <input type="text" placeholder="Ara..." value={filters.operationalStage} onChange={e => handleFilterChange('operationalStage', e.target.value)} className="w-full px-1.5 py-1 border border-slate-200 rounded text-[10px] font-medium bg-white focus:ring-1 focus:ring-blue-500 outline-none transition-all normal-case" />
                                    </th>
                                    <th className="px-4 py-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-right align-bottom pb-7">İşlemler</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {loading ? (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-12 text-center text-slate-400">Yükleniyor...</td>
                                    </tr>
                                ) : filteredComplaints.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                                            {complaints.length === 0 ? 'Bekleyen operasyonel aksiyon bulunmuyor.' : 'Arama kriterlerine uygun kayıt bulunamadı.'}
                                        </td>
                                    </tr>
                                ) : (
                                    filteredComplaints.map((c) => {
                                        const isTargetOverdue = c.status.startsWith('Açık') && c.targetDate && new Date(c.targetDate) < new Date();
                                        const isOverdue = c.status.includes('Gecikti');
                                        return (
                                            <tr key={c.id} className={`${isTargetOverdue ? 'bg-red-50/80 hover:bg-red-100/80' : 'hover:bg-blue-50/30'} transition-colors group text-[11px] text-slate-700 font-medium`}>
                                            <td className="px-4 py-4 font-mono text-xs font-bold text-blue-600">{c.complaintNumber}</td>
                                            <td className="px-4 py-4 text-sm font-medium text-slate-700">{c.customerName}</td>
                                            <td className="px-4 py-4 text-sm text-slate-600">{c.projectName}</td>
                                            <td className="px-4 py-4 text-sm text-slate-600 text-center font-semibold">Kalite Güvence</td>
                                            <td className="px-4 py-4 text-center">
                                                <StatusBadge status={c.status} />
                                            </td>
                                            <td className="px-4 py-4">
                                                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[9px] font-bold border ${
                                                    c.operationalStage 
                                                    ? 'bg-orange-50 text-orange-700 border border-orange-200' 
                                                    : 'bg-slate-100 text-slate-500 border border-slate-200'
                                                }`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full inline-block ${c.operationalStage ? 'bg-orange-500' : 'bg-slate-400'}`}></span>
                                                    {c.operationalStage || 'Aksiyon Planı'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4">
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
                                    );
                                })
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
