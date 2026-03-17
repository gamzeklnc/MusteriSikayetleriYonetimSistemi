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
        stockCode: '',
        brand: '',
        modulePower: '',
        status: '',
        currentDepartmentName: ''
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

    const filteredComplaints = complaints.filter(c => {
        const safeMatch = (val: string | undefined | null, search: string) =>
            !search || (val && val.toLowerCase().includes(search.toLowerCase()));

        const statusText = c.status === 'Acik' ? 'Açık' : 'Kapalı';

        return (
            safeMatch(c.complaintNumber, filters.complaintNumber) &&
            safeMatch(c.customerName, filters.customerName) &&
            safeMatch(c.sellerName, filters.sellerName) &&
            safeMatch(c.projectName, filters.projectName) &&
            safeMatch(c.stockCode, filters.stockCode) &&
            safeMatch(c.brand, filters.brand) &&
            safeMatch(c.modulePower, filters.modulePower) &&
            safeMatch(statusText, filters.status) &&
            safeMatch(c.currentDepartmentName, filters.currentDepartmentName)
        );
    });

    return (
        <AppLayout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Kalite Raporlaması</h1>
                    <p className="text-slate-500 text-sm mt-1">Ürün bazlı kalite kontrol ve raporlama süreçleri.</p>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-[11px]">
                            <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200 tracking-wider">
                                <tr>
                                    <th className="px-1.5 py-1.5">
                                        <div className="mb-2 text-slate-500">Şikayet No</div>
                                        <input type="text" placeholder="Ara..." value={filters.complaintNumber} onChange={e => handleFilterChange('complaintNumber', e.target.value)} className="w-full px-1 py-1 border border-slate-200 rounded text-[10px] font-medium lowercase bg-white focus:ring-1 focus:ring-blue-500 outline-none transition-all" />
                                    </th>
                                    <th className="px-1.5 py-1.5">
                                        <div className="mb-2 text-slate-500">Müşteri</div>
                                        <input type="text" placeholder="Ara..." value={filters.customerName} onChange={e => handleFilterChange('customerName', e.target.value)} className="w-full px-1 py-1 border border-slate-200 rounded text-[10px] font-medium lowercase bg-white focus:ring-1 focus:ring-blue-500 outline-none transition-all" />
                                    </th>
                                    <th className="px-1.5 py-1.5">
                                        <div className="mb-2 text-slate-500">Satış Sorumlusu</div>
                                        <input type="text" placeholder="Ara..." value={filters.sellerName} onChange={e => handleFilterChange('sellerName', e.target.value)} className="w-full px-1 py-1 border border-slate-200 rounded text-[10px] font-medium lowercase bg-white focus:ring-1 focus:ring-blue-500 outline-none transition-all" />
                                    </th>
                                    <th className="px-1.5 py-1.5">
                                        <div className="mb-2 text-slate-500">Proje</div>
                                        <input type="text" placeholder="Ara..." value={filters.projectName} onChange={e => handleFilterChange('projectName', e.target.value)} className="w-full px-1 py-1 border border-slate-200 rounded text-[10px] font-medium lowercase bg-white focus:ring-1 focus:ring-blue-500 outline-none transition-all" />
                                    </th>
                                    <th className="px-1.5 py-1.5">
                                        <div className="mb-2 text-slate-500 leading-tight">Stok Kodu</div>
                                        <input type="text" placeholder="Ara..." value={filters.stockCode} onChange={e => handleFilterChange('stockCode', e.target.value)} className="w-full px-1 py-1 border border-slate-200 rounded text-[10px] font-medium lowercase bg-white focus:ring-1 focus:ring-blue-500 outline-none transition-all" />
                                    </th>
                                    <th className="px-1.5 py-1.5 text-center">Marka</th>
                                    <th className="px-1.5 py-1.5 text-center">Güç</th>
                                    <th className="px-1.5 py-1.5 text-center">Sayı</th>
                                    <th className="px-1.5 py-1.5">Hata</th>
                                    <th className="px-1.5 py-1.5 text-center">HSA1</th>
                                    <th className="px-1.5 py-1.5 text-center">HSA2</th>
                                    <th className="px-1.5 py-1.5 text-center">Durum</th>
                                    <th className="px-1.5 py-1.5 text-center">Aşama</th>
                                    <th className="px-1.5 py-1.5 text-center">Rapor</th>
                                    <th className="px-1.5 py-1.5 text-center">Raporlayan</th>
                                    <th className="px-1.5 py-1.5 text-right">İşlem</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {loading ? (
                                    <tr>
                                        <td colSpan={15} className="px-6 py-20 text-center">
                                            <div className="flex flex-col items-center justify-center text-slate-400">
                                                <div className="w-8 h-8 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin mb-4"></div>
                                                <span className="text-xs font-bold uppercase tracking-widest">Yükleniyor...</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : filteredComplaints.length === 0 ? (
                                    <tr>
                                        <td colSpan={15} className="px-6 py-20 text-center text-slate-400 text-xs uppercase tracking-widest font-bold">
                                            Kayıt bulunamadı.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredComplaints.map((c) => (
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
                                            <td className="px-1.5 py-1.5 font-medium text-slate-800">{c.stockCode}</td>
                                            <td className="px-1.5 py-1.5 text-center text-slate-600 font-medium">{c.brand || '-'}</td>
                                            <td className="px-1.5 py-1.5 text-center text-slate-600 font-medium whitespace-nowrap">{c.modulePower || '-'}</td>
                                            <td className="px-1.5 py-1.5 text-center text-slate-800 text-[13px]">{c.defectiveQuantity}</td>
                                            <td className="px-1.5 py-1.5 text-slate-600 text-[10px] leading-snug truncate max-w-[100px]">{c.errorDefinition || '-'}</td>
                                            <td className="px-1.5 py-1.5 text-center font-bold text-emerald-600">{c.hsa1 || 0}</td>
                                            <td className="px-1.5 py-1.5 text-center font-bold text-indigo-600">{c.hsa2 || 0}</td>
                                            <td className="px-1.5 py-1.5 text-center">
                                                <div className={`inline-flex items-center px-2 py-1 rounded-md text-[10px] font-medium border ${c.status === 'Acik' ? 'bg-amber-50 text-amber-600 border-amber-200' : 'bg-emerald-50 text-emerald-600 border-emerald-200'}`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${c.status === 'Acik' ? 'bg-amber-500' : 'bg-emerald-500'}`}></span>
                                                    {c.status === 'Acik' ? 'Açık' : 'Kapalı'}
                                                </div>
                                            </td>
                                            <td className="px-1.5 py-1.5 text-center">
                                                {c.currentDepartmentName === 'Müşteri Geri Dönüşü' ? (
                                                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[9px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-purple-500 inline-block"></span>Müşteri Geri Dönüşü
                                                    </span>
                                                ) : c.currentDepartmentName === 'Yönetim Onayı' ? (
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
                                                <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[9px] font-bold border shadow-sm ${
                                                    c.isQualityReported 
                                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                                                    : 'bg-slate-50 text-slate-400 border-slate-100'
                                                }`}>
                                                    <div className={`w-1.5 h-1.5 rounded-full ${c.isQualityReported ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>
                                                    {c.isQualityReported ? 'YAPILDI' : 'YOK'}
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
                                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                    </svg>
                                                    İşlem
                                                </button>
                                            </td>
                                        </tr>
                                    ))
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
                />
            )}
        </AppLayout>
    );
}
