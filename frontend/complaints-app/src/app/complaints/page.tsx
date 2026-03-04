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
            } catch (err: any) {
                console.error('Şikayetler yüklenemedi:', err);
                setError('Şikayetler listelenirken bir hata oluştu.');
            } finally {
                setLoading(false);
            }
        };

        fetchComplaints();
    }, []);

    // Şikayet ID'sini (örneğin 1) formatlamak için yardımcı fonksiyon (örn: 25-01)
    const formatComplaintId = (dateString: string, id: number) => {
        const date = new Date(dateString);
        const year = date.getFullYear().toString().slice(-2);
        const paddedId = id.toString().padStart(2, '0');
        return `${year}-${paddedId}`;
    };

    return (
        <AppLayout>
            <div>
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">Tüm Şikayetler</h1>
                        <p className="text-slate-500 text-sm mt-1">Sistemdeki tüm müşteri şikayetleri listelenmektedir.</p>
                    </div>
                    <Link
                        href="/complaints/new"
                        className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm shadow-blue-500/20 flex items-center gap-2"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Yeni Şikayet
                    </Link>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    {error && (
                        <div className="p-4 bg-red-50 text-red-600 text-sm border-b border-red-100">
                            {error}
                        </div>
                    )}

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-slate-600">
                            <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-4">Şikayet No</th>
                                    <th className="px-6 py-4">Durum</th>
                                    <th className="px-6 py-4">Bekleyen Departman</th>
                                    <th className="px-6 py-4">Müşteri / Proje</th>
                                    <th className="px-6 py-4">Stok / Miktar</th>
                                    <th className="px-6 py-4">Şikayet Tarihi</th>
                                    <th className="px-6 py-4 text-right">İşlem</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                {loading ? (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-12 text-center">
                                            <div className="flex flex-col items-center justify-center text-slate-400">
                                                <svg className="animate-spin h-8 w-8 text-blue-500 mb-4" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                <span>Şikayetler Yükleniyor...</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : complaints.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                                            Sistemde henüz kayıtlı şikayet bulunmamaktadır.
                                        </td>
                                    </tr>
                                ) : (
                                    complaints.map((complaint) => (
                                        <tr key={complaint.id} className="hover:bg-slate-50/50 transition-colors group">
                                            <td className="px-6 py-4 font-medium text-slate-900 border-l-[3px] border-transparent group-hover:border-blue-500">
                                                {formatComplaintId(complaint.complaintDate, complaint.id)}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${complaint.status === 'Acik'
                                                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                                                        : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                    }`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${complaint.status === 'Acik' ? 'bg-amber-500' : 'bg-emerald-500'
                                                        }`}></span>
                                                    {complaint.status === 'Acik' ? 'Açık' : 'Kapalı'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-6 h-6 rounded bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500">
                                                        {complaint.currentDepartmentName.substring(0, 2).toUpperCase()}
                                                    </div>
                                                    <span className="font-medium text-slate-700">
                                                        {complaint.currentDepartmentName}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="font-semibold text-slate-800">{complaint.customerName}</p>
                                                <p className="text-xs text-slate-500 line-clamp-1">{complaint.projectName}</p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="text-sm text-slate-700">{complaint.stockCode}</p>
                                                <p className="text-xs text-slate-500">{complaint.defectiveQuantity} Adet</p>
                                            </td>
                                            <td className="px-6 py-4">
                                                {new Date(complaint.complaintDate).toLocaleDateString('tr-TR')}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button className="text-blue-600 hover:text-blue-800 text-sm font-medium px-3 py-1.5 rounded hover:bg-blue-50 transition-colors">
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
        </AppLayout>
    );
}
