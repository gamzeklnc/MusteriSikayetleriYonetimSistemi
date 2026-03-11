'use client';

import { useState } from 'react';
import { ComplaintDto } from '@/types/complaint';
import { complaintService } from '@/services/complaintService';
import { parseSingleBarcode } from '@/utils/barcodeParser';

interface Props {
    complaint: ComplaintDto;
    onClose: () => void;
    onSuccess: () => void;
}

export default function QualityReportModal({ complaint, onClose, onSuccess }: Props) {
    const [note, setNote] = useState(complaint.qualityReportNote || '');
    const [isUpdating, setIsUpdating] = useState(false);
    const [barcodeFilter, setBarcodeFilter] = useState<'ALL' | 'HSA1' | 'HSA2'>('ALL');

    const formatDate = (dateString: string) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('tr-TR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const handleAction = async (isReported: boolean) => {
        setIsUpdating(true);
        try {
            await complaintService.updateQualityReport(complaint.id, {
                isQualityReported: isReported,
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
                            Kalite Kontrol Raporu
                            <span className="px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-700 text-sm font-bold tracking-wider">
                                {complaint.complaintNumber}
                            </span>
                        </h2>
                        <p className="text-sm text-slate-500 mt-0.5">
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Sol Kolon - Detaylar */}
                        <div className="space-y-6">
                            <div className="bg-slate-50 rounded-xl p-4 space-y-4 border border-slate-100">
                                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-200 pb-2">Şikayet Bilgileri</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <div className="text-[10px] text-slate-400 uppercase font-bold">Müşteri</div>
                                        <div className="text-sm text-slate-800">{complaint.customerName}</div>
                                    </div>
                                    <div>
                                        <div className="text-[10px] text-slate-400 uppercase font-bold">Satıcı</div>
                                        <div className="text-sm text-slate-800">{complaint.sellerName}</div>
                                    </div>
                                    <div>
                                        <div className="text-[10px] text-slate-400 uppercase font-bold">Stok Kodu</div>
                                        <div className="text-sm font-bold text-slate-800">{complaint.stockCode}</div>
                                    </div>
                                    <div>
                                        <div className="text-[10px] text-slate-400 uppercase font-bold">Sayı</div>
                                        <div className="text-sm text-slate-800">{complaint.defectiveQuantity}</div>
                                    </div>
                                    <div className="col-span-2">
                                        <div className="text-[10px] text-slate-400 uppercase font-bold">Hata Tanımı</div>
                                        <div className="text-sm font-medium text-blue-700 bg-blue-50 px-2 py-1 rounded inline-block mt-1">
                                            {complaint.errorDefinition}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-amber-50 rounded-xl p-4 space-y-2 border border-amber-100">
                                <h3 className="text-[10px] font-bold text-amber-600 uppercase tracking-widest border-b border-amber-200 pb-2">Şikayet Notu</h3>
                                <div className="text-sm text-amber-800 italic min-h-[60px]">
                                    {complaint.initialNote || 'Not bırakılmamış.'}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-100 text-center">
                                    <div className="text-[10px] text-emerald-600 uppercase font-bold">HSA1</div>
                                    <div className="text-xl font-bold text-emerald-700">{complaint.hsa1 || 0}</div>
                                </div>
                                <div className="bg-indigo-50 rounded-xl p-3 border border-indigo-100 text-center">
                                    <div className="text-[10px] text-indigo-600 uppercase font-bold">HSA2</div>
                                    <div className="text-xl font-bold text-indigo-700">{complaint.hsa2 || 0}</div>
                                </div>
                            </div>
                        </div>

                        {/* Sağ Kolon - Barkodlar */}
                        <div className="flex flex-col h-full">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Okunan Barkodlar</h3>
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
                                            <li key={idx} className="flex items-center justify-between px-3 py-1.5 font-mono text-[11px] text-slate-600 bg-white mb-1 rounded border border-slate-100 shadow-sm">
                                                <span className="text-slate-400">{idx + 1}.</span>
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

                    {/* Alt Kısım - Raporlama */}
                    <div className="mt-8 pt-6 border-t border-slate-100">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Kalite Değerlendirmesi</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="text-[10px] text-slate-400 uppercase font-bold mb-1.5 block ml-1">Kalite Kontrol Notu</label>
                                <textarea
                                    value={note}
                                    onChange={(e) => setNote(e.target.value)}
                                    placeholder="Ürün incelemesi hakkında detaylı bilgi verin..."
                                    className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all placeholder:text-slate-300 min-h-[120px] resize-none shadow-inner bg-slate-50/30"
                                />
                            </div>
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => handleAction(true)}
                                    disabled={isUpdating}
                                    className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold transition-all shadow-lg ${
                                        complaint.isQualityReported === true
                                        ? 'bg-emerald-600 text-white shadow-emerald-500/20'
                                        : 'bg-white text-emerald-600 border-2 border-emerald-600 hover:bg-emerald-50'
                                    } ${isUpdating ? 'opacity-50 cursor-not-allowed' : 'active:scale-[0.98]'}`}
                                >
                                    {isUpdating ? <div className="w-5 h-5 border-2 border-emerald-600/30 border-t-emerald-600 rounded-full animate-spin"></div> : (
                                        <>
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                            RAPOR TAMAMLANDI OLARAK İŞARETLE
                                        </>
                                    )}
                                </button>
                                <button
                                    onClick={() => handleAction(false)}
                                    disabled={isUpdating}
                                    className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold transition-all shadow-lg ${
                                        complaint.isQualityReported === false
                                        ? 'bg-slate-700 text-white shadow-slate-500/20'
                                        : 'bg-white text-slate-600 border-2 border-slate-600 hover:bg-slate-50'
                                    } ${isUpdating ? 'opacity-50 cursor-not-allowed' : 'active:scale-[0.98]'}`}
                                >
                                    {isUpdating ? <div className="w-5 h-5 border-2 border-slate-600/30 border-t-slate-600 rounded-full animate-spin"></div> : (
                                        <>
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                            RAPOR HENÜZ TAMAMLANMADI
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                    {/* Üst Bilgi Satırı 3: Raporlayan */}
                    {complaint.isQualityReported && (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50/50 rounded-lg border border-emerald-100/50">
                            <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-tight">Raporlayan:</span>
                            <span className="text-[10px] font-bold text-emerald-700">{complaint.qualityReportedByName}</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
