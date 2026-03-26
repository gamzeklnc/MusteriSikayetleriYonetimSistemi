'use client';

import { useState, useEffect } from 'react';
import { ComplaintDto, ComplaintDocument } from '@/types/complaint';
import { complaintService } from '@/services/complaintService';
import { errorOptionService } from '@/services/errorOptionService';
import { ErrorDefinitionOption } from '@/types/errorOption';
import { parseSingleBarcode } from '@/utils/barcodeParser';
import DocumentSection from './DocumentSection';

interface Props {
    complaint: ComplaintDto;
    onClose: () => void;
    onSuccess: () => void;
    onUpload?: (newDoc: ComplaintDocument) => void;
}

export default function QualityReportModal({ complaint, onClose, onSuccess, onUpload }: Props) {
    const [note, setNote] = useState(complaint.qualityReportNote || '');
    const [errorDefinition, setErrorDefinition] = useState(complaint.errorDefinition || '');
    const [isUpdating, setIsUpdating] = useState(false);
    const [barcodeFilter, setBarcodeFilter] = useState<'ALL' | 'HSA1' | 'HSA2'>('ALL');
    const [errorOptions, setErrorOptions] = useState<ErrorDefinitionOption[]>([]);

    useEffect(() => {
        errorOptionService.getAll().then(setErrorOptions).catch(err => console.error('Hata opsiyonları yüklenemedi:', err));
    }, []);

    // Yönetim tarafından reddedildi mi?
    const isRejected = complaint.isManagementApproved === false;
    // Rapor kilitli mi? Onaylandıysa veya rapor tamamlandı ve onay bekleniyorsa kilitli
    const isLocked = complaint.isManagementApproved === true ||
        (complaint.isQualityReported && complaint.isManagementApproved === null);

    const formatDate = (dateString: string) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('tr-TR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const handleAction = async (isReported: boolean) => {
        if (isReported && !errorDefinition) {
            alert('Lütfen hata tanımını seçin.');
            return;
        }
        setIsUpdating(true);
        try {
            await complaintService.updateQualityReport(complaint.id, {
                isQualityReported: isReported,
                note: note,
                errorDefinition: errorDefinition || undefined,
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

    const filteredBarcodes = complaint.barcodes?.filter((barcode: string) => {
        if (barcodeFilter === 'ALL') return true;
        const parsed = parseSingleBarcode(barcode);
        return parsed.factory === barcodeFilter;
    }) || [];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={onClose}></div>

            <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className={`flex items-center justify-between px-6 py-4 border-b ${isRejected ? 'bg-red-50 border-red-100' : 'bg-slate-50/50 border-slate-100'}`}>
                    <div>
                        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                            Kalite Kontrol Raporu
                            <span className={`px-2.5 py-1 rounded-md text-sm font-bold tracking-wider ${isRejected ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                {complaint.complaintNumber}
                            </span>
                            {isRejected && (
                                <span className="px-2.5 py-1 rounded-md bg-red-500 text-white text-xs font-bold tracking-wider animate-pulse">
                                    YÖNETİM REDDETTİ
                                </span>
                            )}
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

                    {/* Yönetim Red Uyarısı */}
                    {isRejected && (
                        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                                    <svg className="w-4 h-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                </div>
                                <div className="flex-1">
                                    <h4 className="text-sm font-bold text-red-700 mb-1">Yönetim Tarafından Reddedildi</h4>
                                    <div className="text-xs text-red-600 mb-2">
                                        <span className="font-bold">Reddeden:</span> {complaint.managementApprovedByName || '-'}
                                    </div>
                                    <div className="bg-white border border-red-200 rounded-lg p-3 text-sm text-red-800 italic">
                                        {complaint.managementApprovalNote || 'Red nedeni belirtilmemiş.'}
                                    </div>
                                    <p className="text-xs text-red-500 mt-2 font-medium">
                                        ⚠ Lütfen kalite raporunuzu güncelleyerek yeniden gönderin.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Sol Kolon - Detaylar */}
                        <div className="space-y-6">
                            <div className="bg-slate-50 rounded-xl p-4 space-y-4 border border-slate-100">
                                <h3 className="text-[10px] font-bold text-slate-900 uppercase tracking-widest border-b border-slate-200 pb-2">Şikayet Bilgileri</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <div className="text-[10px] text-slate-500 font-semibold mb-0.5">Müşteri</div>
                                        <div className="text-sm text-slate-800">{complaint.customerName}</div>
                                    </div>
                                    <div>
                                        <div className="text-[10px] text-slate-500 font-semibold mb-0.5">Satış Sorumlusu</div>
                                        <div className="text-sm text-slate-800">{complaint.sellerName}</div>
                                    </div>
                                    <div>
                                        <div className="text-[10px] text-slate-500 font-semibold mb-0.5">Stok Kodu</div>
                                        <div className="text-sm font-bold text-slate-800">{complaint.stockCode}</div>
                                    </div>
                                    <div>
                                        <div className="text-[10px] text-slate-500 font-semibold mb-0.5">Sayı</div>
                                        <div className="text-sm text-slate-800">{complaint.defectiveQuantity}</div>
                                    </div>
                                    {/* Hata Tanımı - mevcut ise göster, yoksa boş bırak (aşağıdaki seçim alanından girilecek) */}
                                    {complaint.errorDefinition && (
                                        <div className="col-span-2">
                                            <div className="text-[10px] text-slate-500 font-semibold mb-0.5">Mevcut Hata Tanımı</div>
                                            <div className="text-sm font-medium text-blue-700 bg-blue-50 px-2 py-1 rounded inline-block mt-1">
                                                {complaint.errorDefinition}
                                            </div>
                                        </div>
                                    )}
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
                                    <div className="text-[10px] text-emerald-600 font-semibold mb-0.5">HSA1</div>
                                    <div className="text-xl font-bold text-emerald-700">{complaint.hsa1 || 0}</div>
                                </div>
                                <div className="bg-indigo-50 rounded-xl p-3 border border-indigo-100 text-center">
                                    <div className="text-[10px] text-indigo-600 font-semibold mb-0.5">HSA2</div>
                                    <div className="text-xl font-bold text-indigo-700">{complaint.hsa2 || 0}</div>
                                </div>
                            </div>
                        </div>

                        {/* Sağ Kolon - Barkodlar */}
                        <div className="flex flex-col h-full">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-[10px] font-bold text-slate-900 uppercase tracking-widest">Okunan Barkodlar</h3>
                                <div className="flex bg-slate-100 p-0.5 rounded-lg">
                                    <button onClick={() => setBarcodeFilter('ALL')} className={`px-2 py-1 text-[9px] font-bold rounded-md transition-all ${barcodeFilter === 'ALL' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'}`}>Tümü</button>
                                    <button onClick={() => setBarcodeFilter('HSA1')} className={`px-2 py-1 text-[9px] font-bold rounded-md transition-all ${barcodeFilter === 'HSA1' ? 'bg-emerald-500 text-white shadow-sm' : 'text-slate-500'}`}>HSA1</button>
                                    <button onClick={() => setBarcodeFilter('HSA2')} className={`px-2 py-1 text-[9px] font-bold rounded-md transition-all ${barcodeFilter === 'HSA2' ? 'bg-indigo-500 text-white shadow-sm' : 'text-slate-500'}`}>HSA2</button>
                                </div>
                            </div>
                            <div className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden flex-1 min-h-[250px] max-h-[350px]">
                                {filteredBarcodes.length > 0 ? (
                                    <ul className="divide-y divide-slate-100 overflow-y-auto h-full p-2">
                                        {filteredBarcodes.map((barcode: string, idx: number) => (
                                            <li key={idx} className="flex items-center justify-between px-3 py-1.5 font-mono text-[11px] text-slate-600 bg-white mb-1 rounded border border-slate-100 shadow-sm">
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
                            onUpload={onUpload}
                        />
                    </div>

                    {/* Alt Kısım - Raporlama */}
                    <div className="mt-8 pt-6 border-t border-slate-100">
                        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4">Kalite Değerlendirmesi</h3>
                        <div className="space-y-4">

                            {/* Hata Tanımı Seçimi */}
                            <div>
                                <label className="text-[10px] text-slate-500 font-semibold mb-1.5 block ml-1">
                                    Hata Tanımı <span className="text-red-400">*</span>
                                </label>
                                {isLocked ? (
                                    <div className="px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-sm font-medium text-blue-700 cursor-not-allowed">
                                        {complaint.errorDefinition || errorDefinition || 'Belirtilmemiş'}
                                    </div>
                                ) : (
                                    <select
                                        value={errorDefinition}
                                        onChange={(e) => setErrorDefinition(e.target.value)}
                                        className={`w-full px-3 py-2.5 border rounded-xl text-sm font-bold outline-none transition-all ${
                                            isRejected
                                                ? 'border-red-300 bg-red-50/30 focus:ring-2 focus:ring-red-400 focus:border-red-400 text-red-700'
                                                : 'bg-slate-50/30 border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-blue-700'
                                        }`}
                                    >
                                        <option value="">Hata tanımı seçin...</option>
                                        {errorOptions.map(o => (
                                            <option key={o.id} value={o.label}>{o.label}</option>
                                        ))}
                                    </select>
                                )}
                            </div>

                            <div>
                                <label className="text-[10px] text-slate-500 font-semibold mb-0.5 mb-1.5 block ml-1">
                                    Kalite Kontrol Notu
                                    {isRejected && <span className="text-red-500 ml-1 normal-case">(Lütfen güncelleyin)</span>}
                                </label>
                                <textarea
                                    value={note}
                                    onChange={(e) => setNote(e.target.value)}
                                    disabled={isLocked}
                                    placeholder="Ürün incelemesi hakkında detaylı bilgi verin..."
                                    className={`w-full px-4 py-3 border rounded-xl text-sm font-medium text-slate-800 outline-none transition-all placeholder:text-slate-300 min-h-[120px] resize-none shadow-inner ${isLocked
                                        ? 'bg-slate-100 border-slate-200 text-slate-500 cursor-not-allowed'
                                        : isRejected
                                            ? 'border-red-300 bg-red-50/30 focus:ring-2 focus:ring-red-400 focus:border-red-400'
                                            : 'bg-slate-50/30 border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500'
                                        }`}
                                />
                            </div>

                            {isLocked ? (
                                <div className="py-3 px-4 rounded-xl bg-slate-100 text-slate-500 text-sm text-center font-medium border border-slate-200">
                                    {complaint.isManagementApproved === true
                                        ? '✅ Yönetim onayladı — kalite raporu kilitlendi.'
                                        : '🔒 Kalite raporu tamamlandı, yönetim onayı bekleniyor.'}
                                </div>
                            ) : (
                                <button
                                    onClick={() => handleAction(true)}
                                    disabled={isUpdating}
                                    className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold transition-all shadow-lg ${isRejected
                                        ? 'bg-red-600 hover:bg-red-700 text-white shadow-red-500/20'
                                        : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20'
                                        } ${isUpdating ? 'opacity-50 cursor-not-allowed' : 'active:scale-[0.98]'}`}
                                >
                                    {isUpdating ? (
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    ) : (
                                        <>
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                            {isRejected ? 'YENİDEN RAPOR GÖNDER' : 'RAPOR TAMAMLANDI OLARAK İŞARETLE'}
                                        </>
                                    )}
                                </button>
                            )}

                            {complaint.isQualityReported && !isRejected && (
                                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50/50 rounded-lg border border-emerald-100/50">
                                    <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-tight">Raporlayan:</span>
                                    <span className="text-[10px] font-bold text-emerald-700">{complaint.qualityReportedByName}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
