'use client';

import { useEffect, useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { complaintService } from '@/services/complaintService';
import { ComplaintDto } from '@/types/complaint';
import QualityReportModal from '@/components/complaints/QualityReportModal';

export default function QualityReportPage() {
    const [complaints, setComplaints] = useState<ComplaintDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedComplaint, setSelectedComplaint] = useState<ComplaintDto | null>(null);

    const [filters, setFilters] = useState({
        complaintNumber: '',
        customerName: '',
        sellerName: '',
        projectName: '',
        brand: '',
        modulePower: '',
        defectiveQuantity: '',
        errorDefinition: '',
        hsa1: '',
        hsa2: '',
        status: '',
        currentDepartmentName: '',
        qualityReport: '',
        qualityReportBy: '',
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
        if (c.isCustomerFeedbackDone) return c.operationalStage || 'Aksiyon Planı';
        if (c.currentDepartmentName === 'Müşteri Geri Dönüşü') return 'Müşteri Geri Dönüşü Bekleniyor';
        if (c.currentDepartmentName === 'Yönetim Onayı') return 'Yönetim Onayı Bekleniyor';
        if (c.currentDepartmentName === 'Kalite Raporlaması') return 'Kalite Raporlaması Bekleniyor';
        return 'Yeni Kayıt';
    };

    const filteredComplaints = complaints.filter(c => {
        const safeMatch = (val: string | undefined | null, search: string) =>
            !search || (val && val.toLowerCase().includes(search.toLowerCase()));

        const stageLabel = getStageLabel(c);

        return (
            safeMatch(c.complaintNumber, filters.complaintNumber) &&
            safeMatch(c.customerName, filters.customerName) &&
            safeMatch(c.sellerName, filters.sellerName) &&
            safeMatch(c.projectName, filters.projectName) &&
            safeMatch(c.brand, filters.brand) &&
            safeMatch(c.modulePower, filters.modulePower) &&
            safeMatch(c.defectiveQuantity?.toString(), filters.defectiveQuantity) &&
            safeMatch(c.errorDefinition, filters.errorDefinition) &&
            safeMatch((c.hsa1 || 0).toString(), filters.hsa1) &&
            safeMatch((c.hsa2 || 0).toString(), filters.hsa2) &&
            safeMatch(c.status, filters.status) &&
            safeMatch(stageLabel, filters.currentDepartmentName) &&
            safeMatch(c.isQualityReported ? 'YAPILDI' : 'YOK', filters.qualityReport) &&
            safeMatch(c.qualityReportedByName, filters.qualityReportBy)
        );
    });

    return (
        <AppLayout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Kalite Raporlaması</h1>
                    <p className="text-slate-500 text-sm mt-1">Ürün bazlı kalite kontrol ve raporlama süreçleri.</p>
                </div>

                {error && (
                    <div className="p-4 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100">{error}</div>
                )}

                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-[11px]">
                            <thead className="bg-slate-50 text-[10px]  font-bold text-slate-500 border-b border-slate-200 tracking-wider">
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
                                    <th className="px-1.5 py-1.5 align-bottom">
                                        <div className="mb-1.5 text-slate-500">Proje İsmi</div>
                                        <input type="text" placeholder="Ara..." value={filters.projectName} onChange={e => handleFilterChange('projectName', e.target.value)} className="w-full px-1 py-1 border border-slate-200 rounded text-[10px] font-medium bg-white focus:ring-1 focus:ring-blue-500 outline-none transition-all" />
                                    </th>
                                    <th className="px-1.5 py-1.5 align-bottom text-center">
                                        <div className="mb-1.5 text-slate-500">Marka</div>
                                        <input type="text" placeholder="Ara..." value={filters.brand} onChange={e => handleFilterChange('brand', e.target.value)} className="w-full px-1 py-1 border border-slate-200 rounded text-[10px] font-medium bg-white focus:ring-1 focus:ring-blue-500 outline-none transition-all" />
                                    </th>
                                    <th className="px-1.5 py-1.5 align-bottom text-center">
                                        <div className="mb-1.5 text-slate-500">Güç</div>
                                        <input type="text" placeholder="Ara..." value={filters.modulePower} onChange={e => handleFilterChange('modulePower', e.target.value)} className="w-full px-1 py-1 border border-slate-200 rounded text-[10px] font-medium bg-white focus:ring-1 focus:ring-blue-500 outline-none transition-all" />
                                    </th>
                                    <th className="px-1.5 py-1.5 align-bottom text-center">
                                        <div className="mb-1.5 text-slate-500">Sayı</div>
                                        <input type="text" placeholder="Ara..." value={filters.defectiveQuantity} onChange={e => handleFilterChange('defectiveQuantity', e.target.value)} className="w-full px-1 py-1 border border-slate-200 rounded text-[10px] font-medium bg-white focus:ring-1 focus:ring-blue-500 outline-none transition-all" />
                                    </th>
                                    <th className="px-1.5 py-1.5 align-bottom">
                                        <div className="mb-1.5 text-slate-500">Hata</div>
                                        <input type="text" placeholder="Ara..." value={filters.errorDefinition} onChange={e => handleFilterChange('errorDefinition', e.target.value)} className="w-full px-1 py-1 border border-slate-200 rounded text-[10px] font-medium bg-white focus:ring-1 focus:ring-blue-500 outline-none transition-all" />
                                    </th>
                                    <th className="px-1.5 py-1.5 align-bottom text-center">
                                        <div className="mb-1.5 text-slate-500">HSA1</div>
                                        <input type="text" placeholder="Ara..." value={filters.hsa1} onChange={e => handleFilterChange('hsa1', e.target.value)} className="w-full px-1 py-1 border border-slate-200 rounded text-[10px] font-medium bg-white focus:ring-1 focus:ring-blue-500 outline-none transition-all" />
                                    </th>
                                    <th className="px-1.5 py-1.5 align-bottom text-center">
                                        <div className="mb-1.5 text-slate-500">HSA2</div>
                                        <input type="text" placeholder="Ara..." value={filters.hsa2} onChange={e => handleFilterChange('hsa2', e.target.value)} className="w-full px-1 py-1 border border-slate-200 rounded text-[10px] font-medium bg-white focus:ring-1 focus:ring-blue-500 outline-none transition-all" />
                                    </th>
                                    <th className="px-1.5 py-1.5 align-bottom text-center">
                                        <div className="mb-1.5 text-slate-500">Durum</div>
                                        <input type="text" placeholder="Ara..." value={filters.status} onChange={e => handleFilterChange('status', e.target.value)} className="w-full px-1 py-1 border border-slate-200 rounded text-[10px] font-medium bg-white focus:ring-1 focus:ring-blue-500 outline-none transition-all" />
                                    </th>
                                    <th className="px-1.5 py-1.5 align-bottom text-center">
                                        <div className="mb-1.5 text-slate-500">Aşama</div>
                                        <input type="text" placeholder="Ara..." value={filters.currentDepartmentName} onChange={e => handleFilterChange('currentDepartmentName', e.target.value)} className="w-full px-1 py-1 border border-slate-200 rounded text-[10px] font-medium bg-white focus:ring-1 focus:ring-blue-500 outline-none transition-all" />
                                    </th>
                                    <th className="px-1.5 py-1.5 align-bottom text-center">
                                        <div className="mb-1.5 text-slate-500">Rapor</div>
                                        <input type="text" placeholder="Ara..." value={filters.qualityReport} onChange={e => handleFilterChange('qualityReport', e.target.value)} className="w-full px-1 py-1 border border-slate-200 rounded text-[10px] font-medium bg-white focus:ring-1 focus:ring-blue-500 outline-none transition-all" />
                                    </th>
                                    <th className="px-1.5 py-1.5 align-bottom text-center">
                                        <div className="mb-1.5 text-slate-500">Raporlayan</div>
                                        <input type="text" placeholder="Ara..." value={filters.qualityReportBy} onChange={e => handleFilterChange('qualityReportBy', e.target.value)} className="w-full px-1 py-1 border border-slate-200 rounded text-[10px] font-medium bg-white focus:ring-1 focus:ring-blue-500 outline-none transition-all" />
                                    </th>
                                    <th className="px-1.5 py-1.5 text-right align-bottom pb-6 whitespace-nowrap">İşlem</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {loading ? (
                                    <tr>
                                        <td colSpan={15} className="px-6 py-20 text-center">
                                            <div className="flex flex-col items-center justify-center text-slate-400">
                                                <div className="w-8 h-8 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin mb-4"></div>
                                                <span className="text-xs font-bold  tracking-widest">Yükleniyor...</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : filteredComplaints.length === 0 ? (
                                    <tr>
                                        <td colSpan={15} className="px-6 py-20 text-center text-slate-400 text-xs  tracking-widest font-bold">
                                            Kayıt bulunamadı.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredComplaints.map((c) => {
                                        const stageLabel = getStageLabel(c);
                                        return (
                                            <tr key={c.id} className={`transition-colors group text-[11px] ${c.isManagementApproved === false ? 'bg-red-50 hover:bg-red-100/60' : 'hover:bg-blue-50/30'}`}>
                                                <td className="px-1.5 py-1.5 font-semibold text-slate-900 whitespace-nowrap">
                                                    <div className="flex flex-col gap-0.5">
                                                        {c.complaintNumber}
                                                        {c.isManagementApproved === false && (
                                                            <span className="text-[8px] font-bold text-red-600 bg-red-100 px-1 py-0.5 rounded w-fit">REDDEDİLDİ</span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-1.5 py-1.5 font-medium text-slate-800">{c.customerName}</td>
                                                <td className="px-1.5 py-1.5 text-slate-600">{c.sellerName}</td>
                                                <td className="px-1.5 py-1.5 text-slate-500 text-[10px] font-medium">{c.projectName || '-'}</td>
                                                <td className="px-1.5 py-1.5 text-center text-slate-600 font-medium">{c.brand || '-'}</td>
                                                <td className="px-1.5 py-1.5 text-center text-slate-600 font-medium whitespace-nowrap">{c.modulePower || '-'}</td>
                                                <td className="px-1.5 py-1.5 text-center text-slate-800 text-[13px]">{c.defectiveQuantity}</td>
                                                <td className="px-1.5 py-1.5 text-slate-600 text-[10px] leading-snug truncate max-w-[100px]">{c.errorDefinition || '-'}</td>
                                                <td className="px-1.5 py-1.5 text-center font-bold text-emerald-600">{c.hsa1 || 0}</td>
                                                <td className="px-1.5 py-1.5 text-center font-bold text-indigo-600">{c.hsa2 || 0}</td>
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
                                                <td className="px-1.5 py-1.5 text-center">
                                                    {c.isCustomerFeedbackDone ? (
                                                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[9px] font-bold bg-orange-50 text-orange-700 border border-orange-200">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-orange-500 inline-block"></span>
                                                            {c.operationalStage || 'Aksiyon Planı'}
                                                        </span>
                                                    ) : stageLabel === 'Müşteri Geri Dönüşü Bekleniyor' ? (
                                                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[9px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-purple-500 inline-block"></span>Müşteri Geri Dönüşü Bekleniyor
                                                        </span>
                                                    ) : stageLabel === 'Yönetim Onayı Bekleniyor' ? (
                                                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[9px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 inline-block"></span>Yönetim Onayı Bekleniyor
                                                        </span>
                                                    ) : stageLabel === 'Kalite Raporlaması Bekleniyor' ? (
                                                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span>Kalite Raporlaması Bekleniyor
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[9px] font-bold bg-slate-50 text-slate-700 border border-slate-200">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-slate-500 inline-block"></span>Yeni Kayıt
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-1.5 py-1.5 text-center">
                                                    <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[9px] font-bold border shadow-sm ${
                                                        c.isQualityReported 
                                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                                                        : 'bg-slate-50 text-slate-400 border-slate-100'
                                                    }`}>
                                                        <div className={`w-1.5 h-1.5 rounded-full ${c.isQualityReported ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>
                                                        {c.isQualityReported ? 'Yapıldı' : 'Yok'}
                                                    </div>
                                                </td>
                                                <td className="px-1.5 py-1.5 text-center text-[10px] font-medium text-slate-600 whitespace-nowrap">
                                                    {c.isQualityReported ? (c.qualityReportedByName || '-') : '-'}
                                                </td>
                                                <td className="px-1.5 py-1.5 text-right">
                                                    <button
                                                        onClick={() => setSelectedComplaint(c)}
                                                        className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-white border border-slate-200 text-slate-600 text-[10px] font-bold rounded-lg hover:bg-slate-50 hover:text-emerald-600 hover:border-emerald-200 transition-all shadow-sm"
                                                    >
                                                        <svg className="w-3.5 h-3.5"fill="none"viewBox="0 0 24 24"stroke="currentColor">
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
                <QualityReportModal
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
