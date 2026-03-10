'use client';

import { useEffect, useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { complaintService } from '@/services/complaintService';
import { ComplaintDto } from '@/types/complaint';

export default function QualityReportPage() {
    const [complaints, setComplaints] = useState<ComplaintDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [expandedRows, setExpandedRows] = useState<number[]>([]);
    const [updatingId, setUpdatingId] = useState<number | null>(null);

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

    const toggleRow = (id: number) => {
        setExpandedRows(prev => 
            prev.includes(id) ? prev.filter(rowId => rowId !== id) : [...prev, id]
        );
    };

    const handleQualityReportToggle = async (complaint: ComplaintDto) => {
        setUpdatingId(complaint.id);
        try {
            await complaintService.updateQualityReport(complaint.id, {
                isQualityReported: !complaint.isQualityReported,
                note: complaint.qualityReportNote
            });
            await fetchComplaints();
        } catch (err) {
            console.error('Kalite raporu güncellenemedi:', err);
            alert('Güncelleme sırasında bir hata oluştu.');
        } finally {
            setUpdatingId(null);
        }
    };

    const handleNoteSave = async (id: number, note: string) => {
        const complaint = complaints.find(c => c.id === id);
        if (!complaint) return;

        setUpdatingId(id);
        try {
            await complaintService.updateQualityReport(id, {
                isQualityReported: complaint.isQualityReported,
                note: note
            });
            await fetchComplaints();
        } catch (err) {
            console.error('Not kaydedilemedi:', err);
            alert('Not kaydedilirken bir hata oluştu.');
        } finally {
            setUpdatingId(null);
        }
    };

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
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 text-[11px] uppercase font-bold text-slate-500 border-b border-slate-200 tracking-wider">
                                <tr>
                                    <th className="px-3 py-4 w-10"></th>
                                    <th className="px-3 py-4">
                                        <div className="mb-2 text-slate-500">Şikayet No</div>
                                        <input type="text" placeholder="Ara..." value={filters.complaintNumber} onChange={e => handleFilterChange('complaintNumber', e.target.value)} className="w-full px-2 py-1.5 border border-slate-200 rounded-md text-xs font-medium lowercase bg-white focus:ring-1 focus:ring-blue-500 outline-none transition-all" />
                                    </th>
                                    <th className="px-3 py-4">
                                        <div className="mb-2 text-slate-500">Müşteri</div>
                                        <input type="text" placeholder="Ara..." value={filters.customerName} onChange={e => handleFilterChange('customerName', e.target.value)} className="w-full px-2 py-1.5 border border-slate-200 rounded-md text-xs font-medium lowercase bg-white focus:ring-1 focus:ring-blue-500 outline-none transition-all" />
                                    </th>
                                    <th className="px-3 py-4">
                                        <div className="mb-2 text-slate-500">Satıcı</div>
                                        <input type="text" placeholder="Ara..." value={filters.sellerName} onChange={e => handleFilterChange('sellerName', e.target.value)} className="w-full px-2 py-1.5 border border-slate-200 rounded-md text-xs font-medium lowercase bg-white focus:ring-1 focus:ring-blue-500 outline-none transition-all" />
                                    </th>
                                    <th className="px-3 py-4">
                                        <div className="mb-2 text-slate-500">Proje</div>
                                        <input type="text" placeholder="Ara..." value={filters.projectName} onChange={e => handleFilterChange('projectName', e.target.value)} className="w-full px-2 py-1.5 border border-slate-200 rounded-md text-xs font-medium lowercase bg-white focus:ring-1 focus:ring-blue-500 outline-none transition-all" />
                                    </th>
                                    <th className="px-3 py-4">
                                        <div className="mb-2 text-slate-500 leading-tight">Stok Kodu</div>
                                        <input type="text" placeholder="Ara..." value={filters.stockCode} onChange={e => handleFilterChange('stockCode', e.target.value)} className="w-full px-2 py-1.5 border border-slate-200 rounded-md text-xs font-medium lowercase bg-white focus:ring-1 focus:ring-blue-500 outline-none transition-all" />
                                    </th>
                                    <th className="px-2 py-4 text-center">Marka</th>
                                    <th className="px-2 py-4 text-center">Güç</th>
                                    <th className="px-2 py-4 text-center">Sayı</th>
                                    <th className="px-3 py-4">Hata Tanımı</th>
                                    <th className="px-2 py-4 text-center">HSA1</th>
                                    <th className="px-2 py-4 text-center">HSA2</th>
                                    <th className="px-3 py-4 text-center">Durum</th>
                                    <th className="px-3 py-4">Departman</th>
                                    <th className="px-3 py-4 w-40 text-center">Kalite Raporu</th>
                                    <th className="px-3 py-4 w-40 text-center">Not</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {loading ? (
                                    <tr>
                                        <td colSpan={16} className="px-6 py-20 text-center">
                                            <div className="flex flex-col items-center justify-center text-slate-400">
                                                <div className="w-8 h-8 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin mb-4"></div>
                                                <span className="text-xs font-bold uppercase tracking-widest">Yükleniyor...</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : filteredComplaints.length === 0 ? (
                                    <tr>
                                        <td colSpan={16} className="px-6 py-20 text-center text-slate-400 text-xs uppercase tracking-widest font-bold">
                                            Kayıt bulunamadı.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredComplaints.map((c) => (
                                        <>
                                            <tr key={c.id} className={`hover:bg-slate-50 transition-colors group text-[13px] ${expandedRows.includes(c.id) ? 'bg-blue-50/10' : ''}`}>
                                                <td className="px-3 py-4 text-center">
                                                    {c.barcodes && c.barcodes.length > 0 && (
                                                        <button 
                                                            onClick={() => toggleRow(c.id)}
                                                            className="p-1 hover:bg-slate-200 rounded-md transition-colors text-slate-400 hover:text-blue-600"
                                                        >
                                                            <svg className={`w-4 h-4 transition-transform ${expandedRows.includes(c.id) ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                            </svg>
                                                        </button>
                                                    )}
                                                </td>
                                                <td className="px-3 py-4 font-semibold text-slate-900 whitespace-nowrap">{c.complaintNumber}</td>
                                                <td className="px-3 py-4 font-medium text-slate-800">{c.customerName}</td>
                                                <td className="px-3 py-4 text-slate-600">{c.sellerName}</td>
                                                <td className="px-3 py-4 text-slate-500 text-[11px] font-medium">{c.projectName || '-'}</td>
                                                <td className="px-3 py-4 font-medium text-slate-800">{c.stockCode}</td>
                                                <td className="px-2 py-4 text-center text-slate-600 font-medium">{c.brand || '-'}</td>
                                                <td className="px-2 py-4 text-center text-slate-600 font-medium whitespace-nowrap">{c.modulePower || '-'}</td>
                                                <td className="px-2 py-4 text-center font-bold text-slate-800 text-[14px]">{c.defectiveQuantity}</td>
                                                <td className="px-3 py-4 text-slate-600 text-[11px] leading-snug">{c.errorDefinition || '-'}</td>
                                                <td className="px-2 py-4 text-center font-bold text-emerald-600">{c.hsa1 || 0}</td>
                                                <td className="px-2 py-4 text-center font-bold text-indigo-600">{c.hsa2 || 0}</td>
                                                <td className="px-3 py-4 text-center">
                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${c.status === 'Acik' ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>
                                                        {c.status === 'Acik' ? 'Açık' : 'Kapalı'}
                                                    </span>
                                                </td>
                                                <td className="px-3 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">{c.currentDepartmentName}</td>
                                                <td className="px-3 py-4 text-center">
                                                    <button
                                                        onClick={() => handleQualityReportToggle(c)}
                                                        disabled={updatingId === c.id}
                                                        className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[11px] font-bold transition-all border shadow-sm ${
                                                            c.isQualityReported 
                                                            ? 'bg-emerald-600 text-white border-emerald-700 hover:bg-emerald-700' 
                                                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                                                        } ${updatingId === c.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                    >
                                                        {updatingId === c.id ? (
                                                            <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                                        ) : (
                                                            <div className={`w-2 h-2 rounded-full ${c.isQualityReported ? 'bg-white' : 'bg-slate-300'}`}></div>
                                                        )}
                                                        {c.isQualityReported ? 'YAPILDI' : 'YAPILMADI'}
                                                    </button>
                                                </td>
                                                <td className="px-3 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <input 
                                                            type="text" 
                                                            placeholder="Not bırak..."
                                                            defaultValue={c.qualityReportNote || ''}
                                                            onBlur={(e) => {
                                                                if (e.target.value !== (c.qualityReportNote || '')) {
                                                                    handleNoteSave(c.id, e.target.value);
                                                                }
                                                            }}
                                                            className="flex-1 px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder:text-slate-400 bg-white"
                                                        />
                                                    </div>
                                                </td>
                                            </tr>
                                            {expandedRows.includes(c.id) && (
                                                <tr className="bg-slate-50/50">
                                                    <td className="py-2"></td>
                                                    <td colSpan={15} className="px-6 py-4">
                                                        <div className="flex flex-col gap-2 max-w-md ml-8">
                                                            <div className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-1 ml-1">Kayıtlı Barkodlar</div>
                                                            {c.barcodes?.map((barcode, idx) => (
                                                                <div key={idx} className="flex items-center gap-4 px-4 py-2.5 bg-white rounded-xl border border-slate-200 shadow-sm hover:border-blue-300 transition-all group/barcode">
                                                                    <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500 border border-slate-200 group-hover/barcode:bg-blue-50 group-hover/barcode:text-blue-600 group-hover/barcode:border-blue-200">
                                                                        {idx + 1}
                                                                    </div>
                                                                    <div className="font-mono text-[13px] text-slate-700 tracking-wider font-bold">{barcode}</div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
