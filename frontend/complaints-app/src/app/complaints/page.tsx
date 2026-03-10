'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import AppLayout from '@/components/layout/AppLayout';
import { complaintService } from '@/services/complaintService';
import { ComplaintDto } from '@/types/complaint';
import ComplaintDetailModal from '@/components/complaints/ComplaintDetailModal';
import * as XLSX from 'xlsx-js-style';

export default function ComplaintsPage() {
    const [complaints, setComplaints] = useState<ComplaintDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedComplaint, setSelectedComplaint] = useState<ComplaintDto | null>(null);

    const [filters, setFilters] = useState({
        complaintNumber: '',
        registrationDate: '',
        complaintDate: '',
        customerName: '',
        sellerName: '',
        projectName: '',
        stockCode: '',
        brand: '',
        modulePower: '',
        defectiveQuantity: '',
        errorDefinition: '',
        hsa1: '',
        hsa2: '',
        status: '',
        currentDepartmentName: ''
    });

    const handleFilterChange = (key: keyof typeof filters, value: string) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    useEffect(() => {
        const fetchComplaints = async () => {
            try {
                const data = await complaintService.getAll();
                setComplaints(data);
            } catch (err: unknown) {
                console.error('Şikayetler yüklenemedi:', err);
                setError('Şikayetler listelenirken bir hata oluştu.');
            } finally {
                setLoading(false);
            }
        };

        fetchComplaints();
    }, []);

    const formatDate = (dateString: string) => {
        if (!dateString) return '';
        return new Date(dateString).toLocaleDateString('tr-TR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
    };

    const filteredComplaints = complaints.filter(c => {
        const safeMatch = (val: string | undefined | null, search: string) =>
            !search || (val && val.toLowerCase().includes(search.toLowerCase()));

        const regDate = formatDate(c.registrationDate);
        const compDate = formatDate(c.complaintDate);
        const statusText = c.status === 'Acik' ? 'Açık' : 'Kapalı';

        return (
            safeMatch(c.complaintNumber, filters.complaintNumber) &&
            safeMatch(regDate, filters.registrationDate) &&
            safeMatch(compDate, filters.complaintDate) &&
            safeMatch(c.customerName, filters.customerName) &&
            safeMatch(c.sellerName, filters.sellerName) &&
            safeMatch(c.projectName, filters.projectName) &&
            safeMatch(c.stockCode, filters.stockCode) &&
            safeMatch(c.brand, filters.brand) &&
            safeMatch(c.modulePower, filters.modulePower) &&
            safeMatch(c.defectiveQuantity?.toString(), filters.defectiveQuantity) &&
            safeMatch(c.errorDefinition, filters.errorDefinition) &&
            safeMatch((c.hsa1 || 0).toString(), filters.hsa1) &&
            safeMatch((c.hsa2 || 0).toString(), filters.hsa2) &&
            safeMatch(statusText, filters.status) &&
            safeMatch(c.currentDepartmentName, filters.currentDepartmentName)
        );
    });

    const handleExportExcel = () => {
        const exportData = filteredComplaints.map(c => ({
            'Şikayet No': c.complaintNumber,
            'Kayıt Tarihi': formatDate(c.registrationDate),
            'Şikayet Tarihi': formatDate(c.complaintDate),
            'Müşteri': c.customerName,
            'Satıcı': c.sellerName,
            'Proje': c.projectName || '',
            'Stok Kodu': c.stockCode,
            'Marka': c.brand || '',
            'Güç': c.modulePower || '',
            'Sayı': c.defectiveQuantity,
            'Hata Tanımı': c.errorDefinition || '',
            'HSA1': c.hsa1 || 0,
            'HSA2': c.hsa2 || 0,
            'Durum': c.status === 'Acik' ? 'Açık' : 'Kapalı',
            'Aşama': c.currentDepartmentName
        }));

        const worksheet = XLSX.utils.json_to_sheet(exportData);

        // Header styling
        const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
        for (let C = range.s.c; C <= range.e.c; ++C) {
            const address = XLSX.utils.encode_cell({ c: C, r: 0 });
            if (!worksheet[address]) continue;
            worksheet[address].s = {
                font: { bold: true, color: { rgb: "FFFFFF" } },
                fill: { fgColor: { rgb: "4F81BD" } }
            };
        }

        // Adjust column widths
        const wscols = [
            { wch: 15 }, // Şikayet No
            { wch: 15 }, // Kayıt Tarihi
            { wch: 15 }, // Şikayet Tarihi
            { wch: 25 }, // Müşteri
            { wch: 20 }, // Satıcı
            { wch: 20 }, // Proje
            { wch: 20 }, // Stok Kodu
            { wch: 15 }, // Marka
            { wch: 10 }, // Güç
            { wch: 10 }, // Sayı
            { wch: 30 }, // Hata Tanımı
            { wch: 10 }, // HSA1
            { wch: 10 }, // HSA2
            { wch: 15 }, // Durum
            { wch: 20 }, // Aşama
        ];
        worksheet['!cols'] = wscols;

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Şikayetler');

        XLSX.writeFile(workbook, `Sikayet_Listesi_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    return (
        <AppLayout>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Şikayet Listesi</h1>
                        <p className="text-slate-500 text-sm mt-1">Sistemde kayıtlı tüm müşteri şikayetleri.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleExportExcel}
                            className="px-4 py-2.5 bg-emerald-600 text-white text-sm font-bold rounded-xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-2 uppercase tracking-wider"
                            title="Excel'e Aktar"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            EXCEL'E AKTAR
                        </button>
                        <Link
                            href="/complaints/new"
                            className="px-5 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 flex items-center gap-2 uppercase tracking-wider"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            YENİ ŞİKAYET KAYDI
                        </Link>
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    {error && (
                        <div className="p-4 bg-red-50 text-red-600 text-sm border-b border-red-100 flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {error}
                        </div>
                    )}

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-[11px]">
                            <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200 tracking-wider">
                                <tr>
                                    <th className="px-1.5 py-1.5 align-bottom">
                                        <div className="mb-2 text-slate-500">Şikayet No</div>
                                        <input type="text" placeholder="Ara..." value={filters.complaintNumber} onChange={e => handleFilterChange('complaintNumber', e.target.value)} className="w-full px-1 py-1 border border-slate-200 rounded text-[10px] font-medium lowercase bg-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" />
                                    </th>
                                    <th className="px-1.5 py-1.5 align-bottom">
                                        <div className="mb-2 text-slate-500">Kayıt Tarihi</div>
                                        <input type="text" placeholder="Ara..." value={filters.registrationDate} onChange={e => handleFilterChange('registrationDate', e.target.value)} className="w-full px-1 py-1 border border-slate-200 rounded text-[10px] font-medium lowercase bg-white focus:ring-1 focus:ring-blue-500 outline-none transition-all" />
                                    </th>
                                    <th className="px-1.5 py-1.5 align-bottom">
                                        <div className="mb-2 text-slate-500">Şikayet Tarihi</div>
                                        <input type="text" placeholder="Ara..." value={filters.complaintDate} onChange={e => handleFilterChange('complaintDate', e.target.value)} className="w-full px-1 py-1 border border-slate-200 rounded text-[10px] font-medium lowercase bg-white focus:ring-1 focus:ring-blue-500 outline-none transition-all" />
                                    </th>
                                    <th className="px-1.5 py-1.5 align-bottom">
                                        <div className="mb-2 text-slate-500">Müşteri</div>
                                        <input type="text" placeholder="Ara..." value={filters.customerName} onChange={e => handleFilterChange('customerName', e.target.value)} className="w-full px-1 py-1 border border-slate-200 rounded text-[10px] font-medium lowercase bg-white focus:ring-1 focus:ring-blue-500 outline-none transition-all" />
                                    </th>
                                    <th className="px-1.5 py-1.5 align-bottom">
                                        <div className="mb-2 text-slate-500">Satıcı</div>
                                        <input type="text" placeholder="Ara..." value={filters.sellerName} onChange={e => handleFilterChange('sellerName', e.target.value)} className="w-full px-1 py-1 border border-slate-200 rounded text-[10px] font-medium lowercase bg-white focus:ring-1 focus:ring-blue-500 outline-none transition-all" />
                                    </th>
                                    <th className="px-1.5 py-1.5 align-bottom">
                                        <div className="mb-2 text-slate-500">Proje</div>
                                        <input type="text" placeholder="Ara..." value={filters.projectName} onChange={e => handleFilterChange('projectName', e.target.value)} className="w-full px-1 py-1 border border-slate-200 rounded text-[10px] font-medium lowercase bg-white focus:ring-1 focus:ring-blue-500 outline-none transition-all" />
                                    </th>
                                    <th className="px-1.5 py-1.5 align-bottom">
                                        <div className="mb-2 text-slate-500">Stok Kodu</div>
                                        <input type="text" placeholder="Ara..." value={filters.stockCode} onChange={e => handleFilterChange('stockCode', e.target.value)} className="w-full px-1 py-1 border border-slate-200 rounded text-[10px] font-medium lowercase bg-white focus:ring-1 focus:ring-blue-500 outline-none transition-all" />
                                    </th>
                                    <th className="px-1.5 py-1.5 align-bottom">
                                        <div className="mb-2 text-slate-500">Marka</div>
                                        <input type="text" placeholder="Ara..." value={filters.brand} onChange={e => handleFilterChange('brand', e.target.value)} className="w-full px-1 py-1 border border-slate-200 rounded text-[10px] font-medium lowercase bg-white focus:ring-1 focus:ring-blue-500 outline-none transition-all" />
                                    </th>
                                    <th className="px-1.5 py-1.5 align-bottom">
                                        <div className="mb-2 text-slate-500">Güç</div>
                                        <input type="text" placeholder="Ara..." value={filters.modulePower} onChange={e => handleFilterChange('modulePower', e.target.value)} className="w-full px-1 py-1 border border-slate-200 rounded text-[10px] font-medium lowercase bg-white focus:ring-1 focus:ring-blue-500 outline-none transition-all" />
                                    </th>
                                    <th className="px-1.5 py-1.5 align-bottom">
                                        <div className="mb-2 text-slate-500">Sayı</div>
                                        <input type="text" placeholder="Ara..." value={filters.defectiveQuantity} onChange={e => handleFilterChange('defectiveQuantity', e.target.value)} className="w-full px-1 py-1 border border-slate-200 rounded text-[10px] font-medium lowercase bg-white focus:ring-1 focus:ring-blue-500 outline-none transition-all" />
                                    </th>
                                    <th className="px-1.5 py-1.5 align-bottom">
                                        <div className="mb-2 text-slate-500 leading-tight">Hata Tanımı</div>
                                        <input type="text" placeholder="Ara..." value={filters.errorDefinition} onChange={e => handleFilterChange('errorDefinition', e.target.value)} className="w-full px-1 py-1 border border-slate-200 rounded text-[10px] font-medium lowercase bg-white focus:ring-1 focus:ring-blue-500 outline-none transition-all" />
                                    </th>
                                    <th className="px-1.5 py-1.5 align-bottom">
                                        <div className="mb-2 text-slate-500">HSA1</div>
                                        <input type="text" placeholder="Ara..." value={filters.hsa1} onChange={e => handleFilterChange('hsa1', e.target.value)} className="w-full px-1 py-1 border border-slate-200 rounded text-[10px] font-medium lowercase bg-white focus:ring-1 focus:ring-blue-500 outline-none transition-all" />
                                    </th>
                                    <th className="px-1.5 py-1.5 align-bottom">
                                        <div className="mb-2 text-slate-500">HSA2</div>
                                        <input type="text" placeholder="Ara..." value={filters.hsa2} onChange={e => handleFilterChange('hsa2', e.target.value)} className="w-full px-1 py-1 border border-slate-200 rounded text-[10px] font-medium lowercase bg-white focus:ring-1 focus:ring-blue-500 outline-none transition-all" />
                                    </th>
                                    <th className="px-1.5 py-1.5 align-bottom">
                                        <div className="mb-2 text-slate-500">Durum</div>
                                        <input type="text" placeholder="Ara..." value={filters.status} onChange={e => handleFilterChange('status', e.target.value)} className="w-full px-1 py-1 border border-slate-200 rounded text-[10px] font-medium lowercase bg-white focus:ring-1 focus:ring-blue-500 outline-none transition-all" />
                                    </th>
                                    <th className="px-1.5 py-1.5 align-bottom">
                                        <div className="mb-2 text-slate-500">Aşama</div>
                                        <input type="text" placeholder="Ara..." value={filters.currentDepartmentName} onChange={e => handleFilterChange('currentDepartmentName', e.target.value)} className="w-full px-2 py-1.5 border border-slate-200 rounded-md text-xs font-medium lowercase bg-white focus:ring-1 focus:ring-blue-500 outline-none transition-all" />
                                    </th>
                                    <th className="px-1.5 py-1.5 text-right align-bottom pb-6 whitespace-nowrap">İşlem</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {loading ? (
                                    <tr>
                                        <td colSpan={16} className="px-6 py-20 text-center">
                                            <div className="flex flex-col items-center justify-center text-slate-400">
                                                <div className="w-10 h-10 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin mb-4"></div>
                                                <span className="text-xs font-bold uppercase tracking-widest">Veriler yükleniyor...</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : filteredComplaints.length === 0 ? (
                                    <tr>
                                        <td colSpan={16} className="px-6 py-20 text-center text-slate-400 text-xs uppercase tracking-widest font-bold">
                                            Arama kriterlerine uygun şikayet bulunamadı.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredComplaints.map((complaint) => (
                                        <tr key={complaint.id} className="hover:bg-blue-50/30 transition-colors group text-[11px] text-slate-700">
                                            <td className="px-1.5 py-1.5 font-semibold text-slate-900">
                                                {complaint.complaintNumber}
                                            </td>
                                            <td className="px-1.5 py-1.5 whitespace-nowrap text-slate-500 text-[10px]">
                                                {formatDate(complaint.registrationDate)}
                                            </td>
                                            <td className="px-1.5 py-1.5 whitespace-nowrap text-slate-500 text-[10px]">
                                                {formatDate(complaint.complaintDate)}
                                            </td>
                                            <td className="px-1.5 py-1.5 font-medium text-slate-800">
                                                {complaint.customerName}
                                            </td>
                                            <td className="px-1.5 py-1.5 text-slate-600">
                                                {complaint.sellerName}
                                            </td>
                                            <td className="px-1.5 py-1.5 text-slate-500 text-[10px]">
                                                {complaint.projectName || '-'}
                                            </td>
                                            <td className="px-1.5 py-1.5 font-medium text-slate-800">
                                                {complaint.stockCode}
                                            </td>
                                            <td className="px-1.5 py-1.5 text-slate-600 whitespace-nowrap">
                                                {complaint.brand || '-'}
                                            </td>
                                            <td className="px-1.5 py-1.5 text-slate-600 whitespace-nowrap">
                                                {complaint.modulePower || '-'}
                                            </td>
                                            <td className="px-1.5 py-1.5 font-medium text-slate-800 text-center">
                                                {complaint.defectiveQuantity}
                                            </td>
                                            <td className="px-1.5 py-1.5 text-slate-600">
                                                {complaint.errorDefinition || '-'}
                                            </td>
                                            <td className="px-1.5 py-1.5 font-medium text-slate-800 text-center">
                                                {complaint.hsa1 || 0}
                                            </td>
                                            <td className="px-1.5 py-1.5 font-medium text-slate-800 text-center">
                                                {complaint.hsa2 || 0}
                                            </td>
                                            <td className="px-1.5 py-1.5">
                                                <div className={`inline-flex items-center px-2 py-1 rounded-md text-[10px] font-medium border ${complaint.status === 'Acik' ? 'bg-amber-50 text-amber-600 border-amber-200' : 'bg-emerald-50 text-emerald-600 border-emerald-200'
                                                    }`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${complaint.status === 'Acik' ? 'bg-amber-500' : 'bg-emerald-500'}`}></span>
                                                    {complaint.status === 'Acik' ? 'Açık' : 'Kapalı'}
                                                </div>
                                            </td>
                                            <td className="px-1.5 py-1.5 text-[10px] font-semibold text-slate-500 uppercase tracking-widest whitespace-nowrap">
                                                {complaint.currentDepartmentName}
                                            </td>
                                            <td className="px-1.5 py-1.5 text-right">
                                                <button
                                                    onClick={() => setSelectedComplaint(complaint)}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-slate-600 text-[10px] font-bold rounded-lg hover:bg-slate-50 hover:text-blue-600 hover:border-blue-200 transition-all shadow-sm"
                                                    title="Detayları Görüntüle"
                                                >
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                    </svg>
                                                    Detay
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
                <ComplaintDetailModal
                    complaint={selectedComplaint}
                    onClose={() => setSelectedComplaint(null)}
                />
            )}
        </AppLayout>
    );
}
