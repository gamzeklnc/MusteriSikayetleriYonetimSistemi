'use client';

import { useEffect, useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { complaintService } from '@/services/complaintService';
import { ComplaintDto, ComplaintDocument } from '@/types/complaint';
import DocumentSection from '@/components/complaints/DocumentSection';

function CustomerFeedbackModal({
    complaint,
    onClose,
    onSuccess,
    onUpload,
}: {
    complaint: ComplaintDto;
    onClose: () => void;
    onSuccess: () => void;
    onUpload?: (newDoc: ComplaintDocument) => void;
}) {
    const [note, setNote] = useState(complaint.customerFeedbackNote || '');
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async (isDone: boolean) => {
        setIsSaving(true);
        try {
            await complaintService.updateCustomerFeedback(complaint.id, { isDone, note });
            onSuccess();
            onClose();
        } catch {
            alert('İşlem sırasında bir hata oluştu.');
        } finally {
            setIsSaving(false);
        }
    };

    const formatDate = (d: string) =>
        d ? new Date(d).toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' }) : '-';

    const isLocked = complaint.isCustomerFeedbackDone;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 bg-purple-50 border-b border-purple-100">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                            Müşteri Geri Dönüşü
                            <span className="px-2.5 py-1 rounded-md bg-purple-100 text-purple-700 text-sm font-bold">
                                {complaint.complaintNumber}
                            </span>
                            {isLocked && (
                                <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-md text-xs font-bold">✅ TAMAMLANDI</span>
                            )}
                        </h2>
                        <p className="text-sm text-slate-500 mt-0.5">Kayıt: {formatDate(complaint.registrationDate)}</p>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
                        <svg className="w-5 h-5"fill="none"viewBox="0 0 24 24"stroke="currentColor">
                            <path strokeLinecap="round"strokeLinejoin="round"strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6 space-y-5">
                    {/* Şikayet Bilgileri */}
                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-3">
                        <h3 className="text-[10px] font-bold text-slate-400  tracking-widest pb-2 border-b border-slate-200">Şikayet Bilgileri</h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {[
                                { label: 'Müşteri', value: complaint.customerName },
                                { label: 'Satış Sorumlusu', value: complaint.sellerName },

                                { label: 'Hata Tanımı', value: complaint.errorDefinition || '-' },
                                { label: 'Sayı', value: String(complaint.defectiveQuantity) },
                                { label: 'Proje', value: complaint.projectName || '-' },
                            ].map(({ label, value }) => (
                                <div key={label}>
                                    <div className="text-[10px] text-slate-400  font-bold">{label}</div>
                                    <div className="text-sm text-slate-800 font-medium">{value}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Önceki Aşama Bilgileri */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Kalite Raporu */}
                        <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100 space-y-2">
                            <h3 className="text-[10px] font-bold text-emerald-600  tracking-widest pb-2 border-b border-emerald-200">Kalite Raporu</h3>
                            <div className="flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full ${complaint.isQualityReported ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                                <span className="text-xs font-bold text-emerald-700">{complaint.isQualityReported ? 'YAPILDI' : 'YOK'}</span>
                            </div>
                            {complaint.qualityReportedByName && (
                                <div className="text-xs text-slate-600">
                                    <span className="font-bold">Raporlayan:</span> {complaint.qualityReportedByName}
                                </div>
                            )}
                            {complaint.qualityReportNote && (
                                <div className="text-xs text-emerald-800 italic bg-white rounded-lg p-2 border border-emerald-200">
                                    {complaint.qualityReportNote}
                                </div>
                            )}
                        </div>

                        {/* Yönetim Onayı */}
                        <div className="bg-blue-50 rounded-xl p-4 border border-blue-100 space-y-2">
                            <h3 className="text-[10px] font-bold text-blue-600  tracking-widest pb-2 border-b border-blue-200">Yönetim Onayı</h3>
                            <div className="flex items-center gap-2">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${complaint.isManagementApproved === true ? 'bg-emerald-100 text-emerald-700' : complaint.isManagementApproved === false ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-500'}`}>
                                    {complaint.isManagementApproved === true ? 'ONAYLANDI' : complaint.isManagementApproved === false ? 'REDDEDİLDİ' : 'BEKLİYOR'}
                                </span>
                            </div>
                            {complaint.managementApprovedByName && (
                                <div className="text-xs text-slate-600">
                                    <span className="font-bold">Onaylayan:</span> {complaint.managementApprovedByName}
                                </div>
                            )}
                            {complaint.managementApprovalNote && (
                                <div className="text-xs text-blue-800 italic bg-white rounded-lg p-2 border border-blue-200">
                                    {complaint.managementApprovalNote}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Dokümanlar Bölümü */}
                    <div className="pt-4 border-t border-slate-100">
                        <DocumentSection 
                            complaintId={complaint.id} 
                            initialDocuments={complaint.documents} 
                            onUpload={onUpload}
                        />
                    </div>

                    {/* Müşteri Geri Dönüşü */}
                    <div className="pt-4 border-t border-slate-100 space-y-4">
                        <h3 className="text-xs font-bold text-slate-400  tracking-wider">Müşteri Geri Dönüşü İşlemi</h3>

                        {isLocked && complaint.customerFeedbackByName && (
                            <div className="flex items-center gap-1.5 px-3 py-2 bg-purple-50 rounded-lg border border-purple-100">
                                <span className="text-[10px] font-bold text-purple-600 ">Geri Dönüşü Yapan:</span>
                                <span className="text-[10px] font-bold text-purple-700">{complaint.customerFeedbackByName}</span>
                            </div>
                        )}

                        <div>
                            <label className="text-[10px] text-slate-400  font-bold mb-1.5 block">
                                Geri Dönüş Notu
                            </label>
                            <textarea
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                disabled={isLocked}
                                placeholder="Müşteriye yapılan geri dönüş hakkında not ekleyin..."
                                className={`w-full px-4 py-3 border rounded-xl text-sm font-medium text-slate-800 outline-none transition-all placeholder:text-slate-300 min-h-[100px] resize-none ${
                                    isLocked
                                        ? 'bg-slate-100 border-slate-200 text-slate-500 cursor-not-allowed'
                                        : 'bg-slate-50/30 border-slate-200 focus:ring-2 focus:ring-purple-500 focus:border-purple-500'
                                }`}
                            />
                        </div>

                        {isLocked ? (
                            <div className="py-3 px-4 rounded-xl bg-emerald-50 text-emerald-700 text-sm text-center font-medium border border-emerald-200">
                                ✅ Müşteri geri dönüşü tamamlandı.
                            </div>
                        ) : (
                            <button
                                onClick={() => handleSave(true)}
                                disabled={isSaving}
                                className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold transition-all shadow-lg bg-purple-600 hover:bg-purple-700 text-white shadow-purple-500/20 ${isSaving ? 'opacity-50 cursor-not-allowed' : 'active:scale-[0.98]'}`}
                            >
                                {isSaving ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>
                                        <svg className="w-5 h-5"fill="none"viewBox="0 0 24 24"stroke="currentColor">
                                            <path strokeLinecap="round"strokeLinejoin="round"strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        MÜŞTERİYE GERİ DÖNÜŞ YAPILDI OLARAK İŞARETLE
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function CustomerResponsePage() {
    const [complaints, setComplaints] = useState<ComplaintDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedComplaint, setSelectedComplaint] = useState<ComplaintDto | null>(null);

    const fetchComplaints = async () => {
        try {
            const data = await complaintService.getAll();
            // Sadece yönetim onaylananları göster
            setComplaints(data.filter(c => c.isManagementApproved === true));
        } catch {
            console.error('Şikayetler yüklenemedi');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchComplaints();
    }, []);

    const formatDate = (d: string) =>
        d ? new Date(d).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '-';

    return (
        <AppLayout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Müşteri Geri Dönüşü</h1>
                    <p className="text-slate-500 text-sm mt-1">Yönetim onayı alınmış şikayetlerde müşteri geri dönüşü takibi.</p>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-[11px]">
                            <thead className="bg-slate-50 text-[10px]  font-bold text-slate-500 border-b border-slate-200 tracking-wider">
                                <tr>
                                    <th className="px-2 py-2.5">Şikayet No</th>
                                    <th className="px-2 py-2.5">Müşteri</th>
                                    <th className="px-2 py-2.5">Satış Sorumlusu</th>

                                    <th className="px-2 py-2.5 text-center">Sayı</th>
                                    <th className="px-2 py-2.5">Hata Tanımı</th>
                                    <th className="px-2 py-2.5 text-center">Durum</th>
                                    <th className="px-2 py-2.5">Kalite Raporu</th>
                                    <th className="px-2 py-2.5">Yönetim Onayı</th>
                                    <th className="px-2 py-2.5 text-center">Müşteri Geri Dönüşü</th>
                                    <th className="px-2 py-2.5">Yapan</th>
                                    <th className="px-2 py-2.5 text-right">İşlem</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {loading ? (
                                    <tr>
                                        <td colSpan={11} className="px-6 py-20 text-center">
                                            <div className="flex flex-col items-center text-slate-400">
                                                <div className="w-10 h-10 border-4 border-purple-600/20 border-t-purple-600 rounded-full animate-spin mb-4" />
                                                <span className="text-xs font-bold  tracking-widest">Veriler yükleniyor...</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : complaints.length === 0 ? (
                                    <tr>
                                        <td colSpan={11} className="px-6 py-20 text-center text-slate-400 text-xs  tracking-widest font-bold">
                                            Henüz yönetim onaylı şikayet bulunmuyor.
                                        </td>
                                    </tr>
                                ) : (
                                    complaints.map((c) => (
                                        <tr key={c.id} className={`transition-colors text-[11px] ${c.isCustomerFeedbackDone ? 'bg-emerald-50/30 hover:bg-emerald-50/50' : 'hover:bg-purple-50/30'}`}>
                                            <td className="px-2 py-2 font-semibold text-slate-900 whitespace-nowrap">
                                                {c.complaintNumber}
                                            </td>
                                            <td className="px-2 py-2 font-medium text-slate-800">{c.customerName}</td>
                                            <td className="px-2 py-2 text-slate-600">{c.sellerName}</td>

                                            <td className="px-2 py-2 text-center text-slate-800">{c.defectiveQuantity}</td>
                                            <td className="px-2 py-2 text-slate-600 text-[10px] truncate max-w-[120px]">{c.errorDefinition || '-'}</td>
                                            <td className="px-2 py-2 text-center">
                                                <div className={`inline-flex items-center px-1.5 py-0.5 rounded-md text-[9px] font-bold border ${c.status.includes('Gecikti') ? 'bg-red-50 text-red-600 border-red-200' :
                                                        c.status.includes('Kapalı') || c.status.includes('Kapali') ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                                                            'bg-amber-50 text-amber-600 border-amber-200'
                                                    }`}>
                                                    <span className={`w-1 h-1 rounded-full mr-1 ${c.status.includes('Gecikti') ? 'bg-red-500' :
                                                            c.status.includes('Kapalı') || c.status.includes('Kapali') ? 'bg-emerald-500' :
                                                                'bg-amber-500'
                                                        }`} />
                                                    {c.status}
                                                </div>
                                            </td>
                                            <td className="px-2 py-2">
                                                <div className="flex flex-col gap-0.5">
                                                    <span className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-700">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />YAPILDI
                                                    </span>
                                                    {c.qualityReportedByName && (
                                                        <span className="text-[9px] text-slate-400">{c.qualityReportedByName}</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-2 py-2">
                                                <div className="flex flex-col gap-0.5">
                                                    <span className="inline-flex items-center gap-1 text-[9px] font-bold text-blue-700">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 inline-block" />ONAYLANDI
                                                    </span>
                                                    {c.managementApprovedByName && (
                                                        <span className="text-[9px] text-slate-400">{c.managementApprovedByName}</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-2 py-2 text-center">
                                                {c.isCustomerFeedbackDone ? (
                                                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />YAPILDI
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[9px] font-bold bg-purple-50 text-purple-600 border border-purple-200">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-purple-400 inline-block" />BEKLİYOR
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-2 py-2 text-[10px] text-slate-500">
                                                {c.customerFeedbackByName || '-'}
                                            </td>
                                            <td className="px-2 py-2 text-right">
                                                <button
                                                    onClick={() => setSelectedComplaint(c)}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-slate-600 text-[10px] font-bold rounded-lg hover:bg-purple-50 hover:text-purple-600 hover:border-purple-200 transition-all shadow-sm"
                                                >
                                                    <svg className="w-3.5 h-3.5"fill="none"viewBox="0 0 24 24"stroke="currentColor">
                                                        <path strokeLinecap="round"strokeLinejoin="round"strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
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
                <CustomerFeedbackModal
                    complaint={selectedComplaint}
                    onClose={() => setSelectedComplaint(null)}
                    onSuccess={() => { fetchComplaints(); setSelectedComplaint(null); }}
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
