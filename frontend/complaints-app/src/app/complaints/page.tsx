'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import AppLayout from '@/components/layout/AppLayout';
import { complaintService } from '@/services/complaintService';
import { ComplaintDto } from '@/types/complaint';

export default function ComplaintsPage() {
    const [complaints, setComplaints] = useState<ComplaintDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

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
        return new Date(dateString).toLocaleDateString('tr-TR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
    };

    return (
        <AppLayout>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Şikayet Listesi</h1>
                        <p className="text-slate-500 text-sm mt-1">Sistemde kayıtlı tüm müşteri şikayetleri.</p>
                    </div>
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
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200 tracking-widest">
                                <tr>
                                    <th className="px-6 py-4">Şikayet No</th>
                                    <th className="px-6 py-4">Kayıt Tarihi</th>
                                    <th className="px-6 py-4">Şikayet Tarihi</th>
                                    <th className="px-6 py-4">Müşteri</th>
                                    <th className="px-6 py-4">Satıcı</th>
                                    <th className="px-6 py-4">Proje</th>
                                    <th className="px-6 py-4">Stok Kodu</th>
                                    <th className="px-6 py-4">Marka</th>
                                    <th className="px-6 py-4">Güç</th>
                                    <th className="px-6 py-4">Sayı</th>
                                    <th className="px-6 py-4">HSA1</th>
                                    <th className="px-6 py-4">HSA2</th>
                                    <th className="px-6 py-4">İlk Not</th>
                                    <th className="px-6 py-4">Durum</th>
                                    <th className="px-6 py-4">Departman</th>
                                    <th className="px-6 py-4 text-right">İşlem</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 italic font-medium">
                                {loading ? (
                                    <tr>
                                        <td colSpan={16} className="px-6 py-20 text-center">
                                            <div className="flex flex-col items-center justify-center text-slate-400">
                                                <div className="w-10 h-10 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin mb-4"></div>
                                                <span className="text-xs font-bold uppercase tracking-widest">Veriler yükleniyor...</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : complaints.length === 0 ? (
                                    <tr>
                                        <td colSpan={16} className="px-6 py-20 text-center text-slate-400 text-xs uppercase tracking-widest font-bold">
                                            Henüz kayıtlı şikayet bulunmuyor.
                                        </td>
                                    </tr>
                                ) : (
                                    complaints.map((complaint) => (
                                        <tr key={complaint.id} className="hover:bg-slate-50/50 transition-colors group text-xs text-slate-600">
                                            <td className="px-6 py-4 font-bold text-blue-600">
                                                {complaint.complaintNumber}
                                            </td>
                                            <td className="px-6 py-4 text-slate-400">
                                                {formatDate(complaint.registrationDate)}
                                            </td>
                                            <td className="px-6 py-4">
                                                {formatDate(complaint.complaintDate)}
                                            </td>
                                            <td className="px-6 py-4 font-bold text-slate-800">
                                                {complaint.customerName}
                                            </td>
                                            <td className="px-6 py-4 font-bold text-amber-600">
                                                {complaint.sellerName}
                                            </td>
                                            <td className="px-6 py-4 text-[10px] text-slate-500">
                                                {complaint.projectName}
                                            </td>
                                            <td className="px-6 py-4 font-bold">
                                                {complaint.stockCode}
                                            </td>
                                            <td className="px-6 py-4 text-slate-800">
                                                {complaint.brand || '-'}
                                            </td>
                                            <td className="px-6 py-4 text-blue-600 font-bold whitespace-nowrap">
                                                {complaint.modulePower || '-'}
                                            </td>
                                            <td className="px-6 py-4 font-bold">
                                                {complaint.defectiveQuantity}
                                            </td>
                                            <td className="px-6 py-4 text-emerald-600 font-bold">
                                                {complaint.hsa1 || 0}
                                            </td>
                                            <td className="px-6 py-4 text-indigo-600 font-bold">
                                                {complaint.hsa2 || 0}
                                            </td>
                                            <td className="px-6 py-4 text-[10px] text-slate-500 max-w-xs truncate" title={complaint.initialNote || '-'}>
                                                {complaint.initialNote || '-'}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className={`inline-flex items-center px-2 py-0.5 rounded-md ${complaint.status === 'Acik' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                                                    }`}>
                                                    {complaint.status === 'Acik' ? 'Açık' : 'Kapalı'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-[10px] text-slate-500 whitespace-nowrap">
                                                {complaint.currentDepartmentName}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all">
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                    </svg>
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
        </AppLayout>
    );
}
