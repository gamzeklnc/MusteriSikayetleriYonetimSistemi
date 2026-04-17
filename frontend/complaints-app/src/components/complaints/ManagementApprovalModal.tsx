'use client';

import { useCallback, useEffect, useState } from 'react';
import { ComplaintDto, ComplaintDocument, ComplaintHistoryDto } from '@/types/complaint';
import { complaintService } from '@/services/complaintService';
import { parseSingleBarcode } from '@/utils/barcodeParser';
import ComplaintNotesTimeline from './ComplaintNotesTimeline';
import DocumentSection from './DocumentSection';
import { useAuthStore } from '@/store/authStore';

interface Props {
    complaint: ComplaintDto;
    onClose: () => void;
    onSuccess: () => void;
    onUpload?: (newDoc: ComplaintDocument) => void;
    onDelete?: (docId: number) => void;
}

export default function ManagementApprovalModal({ complaint, onClose, onSuccess, onUpload, onDelete }: Props) {
    const { user } = useAuthStore();
    const isAdmin = user?.role === 'Admin';

    const [note, setNote] = useState(complaint.managementApprovalNote || '');
    const [isUpdating, setIsUpdating] = useState(false);
    const [barcodeFilter, setBarcodeFilter] = useState<'ALL' | 'HSA1' | 'HSA2'>('ALL');
    const [history, setHistory] = useState<ComplaintHistoryDto[]>([]);

    const refreshHistory = useCallback(async () => {
        try {
            const detail = await complaintService.getById(complaint.id);
            setHistory(detail.history);
        } catch (err) {
            console.error('Not gecmisi yuklenemedi:', err);
        }
    }, [complaint.id]);

    useEffect(() => {
        void refreshHistory();
    }, [complaint.id, refreshHistory]);

    const formatDate = (dateString: string) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('tr-TR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const handleAction = async (isApproved: boolean) => {
        setIsUpdating(true);
        try {
            await complaintService.approve(complaint.id, {
                isApproved: isApproved,
                note: note
            });
            onSuccess();
            onClose();
        } catch (err) {
            console.error('İşlem başarısız:', err);
            alert('İşlem gerçekleştirilirken bir hata oluştu.');
        } finally {
            setIsUpdating(false);
        }
    };

    const filteredBarcodes = complaint.barcodes?.filter(barcode => {
        if (barcodeFilter === 'ALL') return true;
        const parsed = parseSingleBarcode(barcode);
        return parsed.factory === barcodeFilter;
    }) || [];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={onClose}></div>

            <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                            Yönetim Onay İşlemi
                            <span className="px-2.5 py-1 rounded-md bg-blue-100 text-blue-700 text-sm font-bold tracking-wider">
                                {complaint.complaintNumber}
                            </span>
                        </h2>
                        <p className="text-sm text-slate-900 font-medium mt-0.5">
                            Kayıt Tarihi: {formatDate(complaint.registrationDate)}
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    <ComplaintNotesTimeline
                        complaintId={complaint.id}
                        history={history}
                        onHistoryUpdated={() => void refreshHistory()}
                        title="Aşama Not Geçmişi"
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Sol Kolon - Detaylar */}
                        <div className="space-y-6">
                            <div className="bg-slate-50 rounded-xl p-4 space-y-4 border border-slate-100">
                                <h3 className="text-[10px] font-bold text-slate-900  tracking-widest border-b border-slate-200 pb-2">Şikayet Bilgileri</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <div className="text-[10px] text-slate-900  font-bold">Müşteri</div>
                                        <div className="text-sm text-slate-800">{complaint.customerName}</div>
                                    </div>
                                    <div>
                                        <div className="text-[10px] text-slate-900  font-bold">Satış Sorumlusu</div>
                                        <div className="text-sm text-slate-800">{complaint.sellerName}</div>
                                    </div>
                                    <div>
                                        <div className="text-[10px] text-slate-900  font-bold">Stok Kodu</div>
                                        <div className="text-sm font-bold text-slate-800">{complaint.stockCode}</div>
                                    </div>
                                    <div>
                                        <div className="text-[10px] text-slate-900  font-bold">Sayı</div>
                                        <div className="text-sm text-slate-800">{complaint.defectiveQuantity}</div>
                                    </div>
                                    <div className="col-span-2">
                                        <div className="text-[10px] text-slate-900  font-bold">Hata Tanımı</div>
                                        <div className="text-sm font-medium text-blue-700 bg-blue-50 px-2 py-1 rounded inline-block mt-1">
                                            {complaint.errorDefinition}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-emerald-50 rounded-xl p-4 space-y-3 border border-emerald-100">
                                <h3 className="text-[10px] font-bold text-emerald-600  tracking-widest border-b border-emerald-200 pb-2">Kalite Raporu</h3>
                                <div>
                                    <div className="text-[10px] text-emerald-600/60  font-bold">Raporu Yapan</div>
                                    <div className="text-sm text-emerald-900">{complaint.qualityReportedByName || '-'}</div>
                                </div>
                                <div>
                                    <div className="text-[10px] text-emerald-600/60  font-bold">Kalite Notu</div>
                                    <div className="text-sm text-emerald-800 italic bg-white/50 p-2 rounded-lg mt-1 border border-emerald-100 min-h-[60px]">
                                        {complaint.qualityReportNote || 'Not bırakılmamış.'}
                                    </div>
                                </div>
                            </div>

                            {/* Yönetim Onayı Bilgisi */}
                            {complaint.isManagementApproved !== null && (
                                <div className={`bg-${complaint.isManagementApproved ? 'emerald' : 'red'}-50 rounded-xl p-4 space-y-3 border border-${complaint.isManagementApproved ? 'emerald' : 'red'}-100`}>
                                    <h3 className={`text-[10px] font-bold text-${complaint.isManagementApproved ? 'emerald' : 'red'}-600  tracking-widest border-b border-${complaint.isManagementApproved ? 'emerald' : 'red'}-200 pb-2`}>Yönetim Kararı</h3>
                                    <div>
                                        <div className={`text-[10px] text-${complaint.isManagementApproved ? 'emerald' : 'red'}-600/60  font-bold`}>Onaylayan / Reddeden</div>
                                        <div className={`text-sm text-${complaint.isManagementApproved ? 'emerald' : 'red'}-900`}>{complaint.managementApprovedByName || '-'}</div>
                                    </div>
                                    <div>
                                        <div className={`text-[10px] text-${complaint.isManagementApproved ? 'emerald' : 'red'}-600/60  font-bold`}>Onay Notu</div>
                                        <div className={`text-sm text-${complaint.isManagementApproved ? 'emerald' : 'red'}-800 italic bg-white/50 p-2 rounded-lg mt-1 border border-${complaint.isManagementApproved ? 'emerald' : 'red'}-100 min-h-[60px]`}>
                                            {complaint.managementApprovalNote || 'Not bırakılmamış.'}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Sağ Kolon - Barkodlar */}
                        <div className="flex flex-col h-full">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-[10px] font-bold text-slate-900  tracking-widest">Okunan Barkodlar</h3>
                                <div className="flex bg-slate-100 p-0.5 rounded-lg">
                                    <button onClick={() => setBarcodeFilter('ALL')} className={`px-2 py-1 text-[9px] font-bold rounded-md transition-all ${barcodeFilter === 'ALL' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'}`}>Tümü</button>
                                    <button onClick={() => setBarcodeFilter('HSA1')} className={`px-2 py-1 text-[9px] font-bold rounded-md transition-all ${barcodeFilter === 'HSA1' ? 'bg-emerald-500 text-white shadow-sm' : 'text-slate-500'}`}>HSA1</button>
                                    <button onClick={() => setBarcodeFilter('HSA2')} className={`px-2 py-1 text-[9px] font-bold rounded-md transition-all ${barcodeFilter === 'HSA2' ? 'bg-indigo-500 text-white shadow-sm' : 'text-slate-500'}`}>HSA2</button>
                                </div>
                            </div>
                            <div className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden flex-1 min-h-[250px] max-h-[350px]">
                                {filteredBarcodes.length > 0 ? (
                                    <ul className="divide-y divide-slate-100 overflow-y-auto h-full p-2">
                                        {filteredBarcodes.map((barcode, idx) => (
                                            <li key={idx} className="flex items-center justify-between px-3 py-1.5 font-mono text-[11px] text-slate-600 bg-white mb-1 rounded border border-slate-100">
                                                <span className="text-slate-900 font-bold">{idx + 1}.</span>
                                                <span className="font-bold">{barcode}</span>
                                                <span className={`text-[8px] font-bold px-1 py-0.5 rounded ${parseSingleBarcode(barcode).factory === 'HSA1' ? 'bg-emerald-100 text-emerald-700' : 'bg-indigo-100 text-indigo-700'}`}>
                                                    {parseSingleBarcode(barcode).factory}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <div className="h-full flex items-center justify-center text-slate-400 text-xs italic">Barkod bulunamadı.</div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Dokümanlar Bölümü */}
                    <div className="pt-6 border-t border-slate-100">
                        <DocumentSection 
                            complaintId={complaint.id} 
                            initialDocuments={complaint.documents} 
                            currentStage={complaint.currentDepartmentName}
                            onUpload={onUpload}
                            onDelete={onDelete}
                            canUpload={complaint.isManagementApproved === null || isAdmin}
                        />
                    </div>

                    {/* Alt Kısım - Onay ve Not */}
                    <div className="mt-8 pt-6 border-t border-slate-100">
                        <h3 className="text-xs font-bold text-slate-900  tracking-wider mb-4">Yönetim Değerlendirmesi</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="text-[10px] text-slate-900  font-bold mb-1.5 block ml-1">Onay Notu</label>
                                <textarea
                                    value={note}
                                    onChange={(e) => setNote(e.target.value)}
                                    disabled={complaint.isManagementApproved === false || isUpdating || !complaint.isQualityReported}
                                    placeholder={complaint.isManagementApproved === false ? "Bu şikayet reddedilmiştir. Yeniden kalite raporu bekleniyor." : "Kararınız hakkında bir not bırakın..."}
                                    className={`w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder:text-slate-300 min-h-[120px] resize-none shadow-inner bg-slate-50/30 ${complaint.isManagementApproved === false ? 'opacity-70 cursor-not-allowed bg-slate-100' : ''}`}
                                />
                            </div>
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => handleAction(true)}
                                    disabled={isUpdating || !complaint.isQualityReported || complaint.isManagementApproved === false}
                                    className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold transition-all shadow-lg ${complaint.isManagementApproved === true
                                        ? 'bg-emerald-600 text-white shadow-emerald-500/20'
                                        : 'bg-white text-emerald-600 border-2 border-emerald-600 hover:bg-emerald-50'
                                        } ${isUpdating || !complaint.isQualityReported || complaint.isManagementApproved === false ? 'opacity-50 cursor-not-allowed' : 'active:scale-[0.98]'}`}
                                >
                                    {isUpdating ? <div className="w-5 h-5 border-2 border-emerald-600/30 border-t-emerald-600 rounded-full animate-spin"></div> : (
                                        <>
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                            ONAY VER
                                        </>
                                    )}
                                </button>
                                <button
                                    onClick={() => handleAction(false)}
                                    disabled={isUpdating || !complaint.isQualityReported || complaint.isManagementApproved === false}
                                    className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold transition-all shadow-lg ${complaint.isManagementApproved === false
                                        ? 'bg-red-600 text-white shadow-red-500/20'
                                        : 'bg-white text-red-600 border-2 border-red-600 hover:bg-red-50'
                                        } ${isUpdating || !complaint.isQualityReported || complaint.isManagementApproved === false ? 'opacity-50 cursor-not-allowed' : 'active:scale-[0.98]'}`}
                                >
                                    {isUpdating ? <div className="w-5 h-5 border-2 border-red-600/30 border-t-red-600 rounded-full animate-spin"></div> : (
                                        <>
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                            REDDET
                                        </>
                                    )}
                                </button>
                            </div>
                            {complaint.isManagementApproved === false && (
                                <p className="text-center text-xs text-red-600 font-bold bg-red-50 p-2 rounded-lg border border-red-100">
                                    ⚠ Bu şikayet reddedilmiştir. Düzenleme yapılamaz. Kalite birimi yeni rapor gönderdiğinde işleme açılacaktır.
                                </p>
                            )}
                            {!complaint.isQualityReported && (
                                <p className="text-center text-xs text-amber-600 font-medium">Bu şikayet henüz kalite raporu aşamasını tamamlamamıştır.</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
