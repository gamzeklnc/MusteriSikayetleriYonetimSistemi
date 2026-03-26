'use client';

import { useEffect, useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { complaintService } from '@/services/complaintService';
import { ComplaintDto } from '@/types/complaint';
import ManagementApprovalModal from '@/components/complaints/ManagementApprovalModal';

export default function ApprovalPage() {
    const [complaints, setComplaints] = useState<ComplaintDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedComplaint, setSelectedComplaint] = useState<ComplaintDto | null>(null);

    const [filters, setFilters] = useState({
        complaintNumber: '',
        customerName: '',
        sellerName: '',
        defectiveQuantity: '',
        errorDefinition: '',
        status: '',
        qualityReport: '',
        qualityReportBy: '',
        currentDepartmentName: '',
        managementApproval: '',
    });

    const handleFilterChange = (key: keyof typeof filters, value: string) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const fetchComplaints = async () => {
        try {
            const data = await complaintService.getAll();
            setComplaints(data);
        } catch (err: unknown) {
            console.error('Şikayetler yüklenemedi:', err);
            setError('Şikayetler yüklenirken bir hata oluştu.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchComplaints();
    }, []);

    const getStageLabel = (c: ComplaintDto) => {
        if (c.isCustomerFeedbackDone) return 'Aksiyon';
        if (c.currentDepartmentName === 'Müşteri Geri Dönüşü') return 'Müşteri Geri Dönüşü';
        if (c.currentDepartmentName === 'Yönetim Onayı') return 'Yönetim Onayı';
        return 'Kalite Raporlaması';
    };

    const filteredComplaints = complaints.filter(c => {
        const safeMatch = (val: string | undefined | null, search: string) =>
            !search || (val && val.toLowerCase().includes(search.toLowerCase()));

        const stageLabel = getStageLabel(c);

        return (
            safeMatch(c.complaintNumber, filters.complaintNumber) &&
            safeMatch(c.customerName, filters.customerName) &&
            safeMatch(c.sellerName, filters.sellerName) &&
            safeMatch(c.defectiveQuantity?.toString(), filters.defectiveQuantity) &&
            safeMatch(c.errorDefinition, filters.errorDefinition) &&
            safeMatch(c.status, filters.status) &&
            safeMatch(c.isQualityReported ? 'YAPILDI' : 'YAPILMADI', filters.qualityReport) &&
            safeMatch(c.qualityReportedByName, filters.qualityReportBy) &&
            safeMatch(stageLabel, filters.currentDepartmentName) &&
            safeMatch(
                c.isManagementApproved === true ? 'ONAYLANDI' : c.isManagementApproved === false ? 'REDDEDİLDİ' : 'BEKLİYOR',
                filters.managementApproval
            )
        );
    });

    return (
        <AppLayout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Yönetim Onayı</h1>
                    <p className="text-slate-500 text-sm mt-1">Kalite raporu tamamlanmış şikayetlerin incelenmesi ve onaylanması.</p>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    {error && (
                        <div className="p-4 bg-red-50 text-red-600 text-sm border-b border-red-100">{error}</div>
                    )}
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-[11px]">
                            <thead className="bg-slate-50 text-[10px] font-bold text-slate-500 border-b border-slate-200 tracking-wider">
                                <tr>
                                    <th className="px-1.5 py-1.5 align-bottom">
                                        <div className="mb-1.5 text-slate-500">Şikayet No</div>
                                        <input type="text" placeholder="Ara..." value={filters.complaintNumber} onChange={e => handleFilterChange('complaintNumber', e.target.value)} className="w-full px-1 py-1 border border-slate-200 rounded text-[10px] font-medium bg-white focus:ring-1 focus:ring-blue-500 outline-none transition-all" />
                                    </th>
                                    <th className="px-1.5 py-1.5 align-bottom">
                                        <div className="mb-1.5 text-slate-500">Müşteri</div>
                                        <input type="text" placeholder="Ara..." value={filters.customerName} onChange={e => handleFilterChange('customerName', e.target.value)} className="w-full px-1 py-1 border border-slate-200 rounded text-[10px] font-medium bg-white focus:ring-1 focus:ring-blue-500 outline-none transition-all" />
                                    </th>
                                    <th className="px-1.5 py-1.5 align-bottom">
                                        <div className="mb-1.5 text-slate-500">Satış Sorumlusu</div>
                                        <input type="text" placeholder="Ara..." value={filters.sellerName} onChange={e => handleFilterChange('sellerName', e.target.value)} className="w-full px-1 py-1 border border-slate-200 rounded text-[10px] font-medium bg-white focus:ring-1 focus:ring-blue-500 outline-none transition-all" />
                                    </th>
                                    <th className="px-1.5 py-1.5 align-bottom text-center">
                                        <div className="mb-1.5 text-slate-500">Sayı</div>
                                        <input type="text" placeholder="Ara..." value={filters.defectiveQuantity} onChange={e => handleFilterChange('defectiveQuantity', e.target.value)} className="w-full px-1 py-1 border border-slate-200 rounded text-[10px] font-medium bg-white focus:ring-1 focus:ring-blue-500 outline-none transition-all" />
                                    </th>
                                    <th className="px-1.5 py-1.5 align-bottom">
                                        <div className="mb-1.5 text-slate-500">Hata Tanımı</div>
                                        <input type="text" placeholder="Ara..." value={filters.errorDefinition} onChange={e => handleFilterChange('errorDefinition', e.target.value)} className="w-full px-1 py-1 border border-slate-200 rounded text-[10px] font-medium bg-white focus:ring-1 focus:ring-blue-500 outline-none transition-all" />
                                    </th>
                                    <th className="px-1.5 py-1.5 align-bottom text-center">
                                        <div className="mb-1.5 text-slate-500">Durum</div>
                                        <input type="text" placeholder="Ara..." value={filters.status} onChange={e => handleFilterChange('status', e.target.value)} className="w-full px-1 py-1 border border-slate-200 rounded text-[10px] font-medium bg-white focus:ring-1 focus:ring-blue-500 outline-none transition-all" />
                                    </th>
                                    <th className="px-1.5 py-1.5 align-bottom">
                                        <div className="mb-1.5 text-slate-500">Kalite Raporu</div>
                                        <input type="text" placeholder="Ara..." value={filters.qualityReport} onChange={e => handleFilterChange('qualityReport', e.target.value)} className="w-full px-1 py-1 border border-slate-200 rounded text-[10px] font-medium bg-white focus:ring-1 focus:ring-blue-500 outline-none transition-all" />
                                    </th>
                                    <th className="px-1.5 py-1.5 align-bottom">
                                        <div className="mb-1.5 text-slate-500">Raporu Yapan</div>
                                        <input type="text" placeholder="Ara..." value={filters.qualityReportBy} onChange={e => handleFilterChange('qualityReportBy', e.target.value)} className="w-full px-1 py-1 border border-slate-200 rounded text-[10px] font-medium bg-white focus:ring-1 focus:ring-blue-500 outline-none transition-all" />
                                    </th>
                                    <th className="px-1.5 py-1.5 align-bottom text-center">
                                        <div className="mb-1.5 text-slate-500">Aşama</div>
                                        <input type="text" placeholder="Ara..." value={filters.currentDepartmentName} onChange={e => handleFilterChange('currentDepartmentName', e.target.value)} className="w-full px-1 py-1 border border-slate-200 rounded text-[10px] font-medium bg-white focus:ring-1 focus:ring-blue-500 outline-none transition-all" />
                                    </th>
                                    <th className="px-1.5 py-1.5 align-bottom w-40 text-center">
                                        <div className="mb-1.5 text-slate-500">Yönetim</div>
                                        <input type="text" placeholder="Ara..." value={filters.managementApproval} onChange={e => handleFilterChange('managementApproval', e.target.value)} className="w-full px-1 py-1 border border-slate-200 rounded text-[10px] font-medium bg-white focus:ring-1 focus:ring-blue-500 outline-none transition-all" />
                                    </th>
                                    <th className="px-1.5 py-1.5 text-right align-bottom pb-6 whitespace-nowrap">İşlem</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {loading ? (
                                    <tr>
                                        <td colSpan={11} className="px-6 py-20 text-center">
                                            <div className="flex flex-col items-center justify-center text-slate-400">
                                                <div className="w-8 h-8 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin mb-4"></div>
                                                <span className="text-xs font-bold  tracking-widest">Yükleniyor...</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : filteredComplaints.length === 0 ? (
                                    <tr>
                                        <td colSpan={11} className="px-6 py-20 text-center text-slate-400 text-xs  tracking-widest font-bold">
                                            Kayıt bulunamadı.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredComplaints.map((c) => {
                                        const stageLabel = getStageLabel(c);
                                        return (
                                            <tr key={c.id} className="hover:bg-blue-50/30 transition-colors group text-[11px]">
                                                <td className="px-1.5 py-1.5 font-semibold text-slate-900">{c.complaintNumber}</td>
                                                <td className="px-1.5 py-1.5 font-medium text-slate-800">{c.customerName}</td>
                                                <td className="px-1.5 py-1.5 text-slate-600">{c.sellerName}</td>
                                                <td className="px-1.5 py-1.5 text-center text-slate-800">{c.defectiveQuantity}</td>
                                                <td className="px-1.5 py-1.5 text-slate-600 text-[10px] leading-snug truncate max-w-[150px]">{c.errorDefinition || '-'}</td>
                                                <td className="px-1.5 py-1.5 text-center">
                                                    <div className={`inline-flex items-center px-1.5 py-0.5 rounded-md text-[9px] font-bold border ${c.status.includes('Gecikti') ? 'bg-red-50 text-red-600 border-red-200' :
                                                            c.status.includes('Kapalı') || c.status.includes('Kapali') ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                                                                'bg-amber-50 text-amber-600 border-amber-200'
                                                        }`}>
                                                        <span className={`w-1 h-1 rounded-full mr-1 ${c.status.includes('Gecikti') ? 'bg-red-500' :
                                                                c.status.includes('Kapalı') || c.status.includes('Kapali') ? 'bg-emerald-500' :
                                                                    'bg-amber-500'
                                                            }`}></span>
                                                        {c.status}
                                                    </div>
                                                </td>
                                                <td className="px-1.5 py-1.5">
                                                    <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-bold border ${c.isQualityReported ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>
                                                        <div className={`w-1.5 h-1.5 rounded-full ${c.isQualityReported ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>
                                                        {c.isQualityReported ? 'YAPILDI' : 'YAPILMADI'}
                                                    </div>
                                                </td>
                                                <td className="px-1.5 py-1.5 text-slate-800 text-[10px] font-medium">{c.isQualityReported ? (c.qualityReportedByName || '-') : '-'}</td>
                                                <td className="px-1.5 py-1.5 whitespace-nowrap">
                                                    {stageLabel === 'Aksiyon' ? (
                                                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[9px] font-bold bg-orange-50 text-orange-700 border border-orange-200">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-orange-500 inline-block"></span>Aksiyon
                                                        </span>
                                                    ) : stageLabel === 'Müşteri Geri Dönüşü' ? (
                                                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[9px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-purple-500 inline-block"></span>Müşteri Geri Dönüşü
                                                        </span>
                                                    ) : stageLabel === 'Yönetim Onayı' ? (
                                                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[9px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 inline-block"></span>Yönetim Onayı
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span>Kalite Raporlaması
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-1.5 py-1.5 text-center">
                                                    {c.isManagementApproved === true ? (
                                                        <div className="flex flex-col items-center gap-0.5">
                                                            <span className="px-2 py-1 rounded-md bg-emerald-100 text-emerald-700 text-[10px] font-bold">ONAYLANDI</span>
                                                            <span className="text-[9px] text-slate-400 font-medium">{c.managementApprovedByName || ''}</span>
                                                        </div>
                                                    ) : c.isManagementApproved === false ? (
                                                        <div className="flex flex-col items-center gap-0.5">
                                                            <span className="px-2 py-1 rounded-md bg-red-100 text-red-700 text-[10px] font-bold">REDDEDİLDİ</span>
                                                            <span className="text-[9px] text-slate-400 font-medium">{c.managementApprovedByName || ''}</span>
                                                        </div>
                                                    ) : (
                                                        <span className="px-2 py-1 rounded-md bg-slate-100 text-slate-500 text-[10px] font-bold italic">BEKLİYOR</span>
                                                    )}
                                                </td>
                                                <td className="px-1.5 py-1.5 text-right">
                                                    <button
                                                        onClick={() => setSelectedComplaint(c)}
                                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-slate-600 text-[10px] font-bold rounded-lg hover:bg-slate-50 hover:text-blue-600 hover:border-blue-200 transition-all shadow-sm"
                                                    >
                                                        <svg className="w-4 h-4"fill="none"viewBox="0 0 24 24"stroke="currentColor">
                                                            <path strokeLinecap="round"strokeLinejoin="round"strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                        </svg>
                                                        İşlem
                                                    </button>
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

            {selectedComplaint && (
                <ManagementApprovalModal
                    complaint={selectedComplaint}
                    onClose={() => setSelectedComplaint(null)}
                    onSuccess={fetchComplaints}
                    onUpload={(newDoc) => {
                        setSelectedComplaint({
                            ...selectedComplaint,
                            documents: [...(selectedComplaint.documents || []), newDoc]
                        });
                        setComplaints(prev => prev.map(c => 
                            c.id === selectedComplaint.id 
                            ? { ...c, documents: [...(c.documents || []), newDoc] } 
                            : c
                        ));
                    }}
                />
            )}
        </AppLayout>
    );
}
