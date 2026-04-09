'use client';

import { useState, useRef } from 'react';
import * as XLSX from 'xlsx-js-style';
import { ComplaintDto, ComplaintDocument } from '@/types/complaint';
import { parseSingleBarcode } from '@/utils/barcodeParser';
import DocumentSection, { DocumentSectionRef } from './DocumentSection';
import { complaintService } from '@/services/complaintService';
import { useAuthStore } from '@/store/authStore';

const STAGES = [
    'Fabrikada İnceleme Bekliyor',
    'Saha Organizasyonu Bekleniyor',
    'Servis Raporu Bekleniyor',
    'İade & Değişim Bekliyor'
];

interface Props {
    complaint: ComplaintDto;
    onClose: () => void;
    onUpload?: (newDoc: ComplaintDocument) => void;
    showOperationalStageUpdate?: boolean;
    onOperationalStageUpdate?: (newComplaint: ComplaintDto) => void;
}

export default function ComplaintDetailModal({ 
    complaint, 
    onClose, 
    onUpload,
    showOperationalStageUpdate = false,
    onOperationalStageUpdate 
}: Props) {
    const [barcodeFilter, setBarcodeFilter] = useState<'ALL' | 'HSA1' | 'HSA2'>('ALL');
    const [updating, setUpdating] = useState(false);
    const [note, setNote] = useState('');
    const [has8DReport, setHas8DReport] = useState<boolean>(complaint.has8DReport || false);
    const docSectionRef = useRef<DocumentSectionRef>(null);

    const { user } = useAuthStore();
    const canEditActions = user !== null && (user.departmentId === 3 || user.role === 'Admin');
    const canReopen = user !== null && user.role === 'Admin';

    const [hasTargetDate, setHasTargetDate] = useState<boolean | null>(complaint.hasTargetDate ?? null);
    const [targetDateInput, setTargetDateInput] = useState<string>(
        complaint.targetDate ? complaint.targetDate.substring(0, 10) : ''
    );
    const [updatingTargetDate, setUpdatingTargetDate] = useState(false);
    const [closing, setClosing] = useState(false);
    
    const [justificationCounts, setJustificationCounts] = useState({
        jhsa1: complaint.justifiedHsa1Count || 0,
        jhsa2: complaint.justifiedHsa2Count || 0,
        jother: complaint.justifiedOtherCount || 0,
        uhsa1: complaint.unjustifiedHsa1Count || 0,
        uhsa2: complaint.unjustifiedHsa2Count || 0,
        uother: complaint.unjustifiedOtherCount || 0
    });

    const [barcodeJusts, setBarcodeJusts] = useState<Record<string, boolean | null>>(
        complaint.barcodeResults?.reduce((acc: any, br) => {
            acc[br.barcode] = br.isJustified;
            return acc;
        }, {}) || {}
    );

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('tr-TR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const filteredBarcodes = complaint.barcodes?.filter(barcode => {
        if (barcodeFilter === 'ALL') return true;
        const parsed = parseSingleBarcode(barcode);
        return parsed.factory === barcodeFilter;
    }) || [];

    const handleExportExcel = () => {
        // Prepare headers matching the main table + Barcode info
        const headers = [
            'Şikayet No',
            'Kayıt Tarihi',
            'Şikayet Tarihi',
            'Müşteri',
            'Satış Sorumlusu',
            'Proje',
            'Marka',
            'Güç',
            'Sayı',
            'HSA1',
            'HSA2',
            'Hata Tanımı',
            'Durum',
            'Aşama',
            'Barkod',
            'Fabrika'
        ];

        // Prepare the common data repeated for each barcode
        const commonData = [
            complaint.complaintNumber,
            formatDate(complaint.registrationDate),
            formatDate(complaint.complaintDate),
            complaint.customerName,
            complaint.sellerName,
            complaint.projectName || '-',
            complaint.brand || '-',
            complaint.modulePower || '-',
            complaint.defectiveQuantity.toString(),
            (complaint.hsa1 || 0).toString(),
            (complaint.hsa2 || 0).toString(),
            complaint.errorDefinition || '-',
            complaint.status,
            complaint.currentDepartmentName,
        ];

        let dataRows: string[][] = [];

        // Map each barcode to a full row. If no barcodes exist, create a single row indicating that.
        if (complaint.barcodes && complaint.barcodes.length > 0) {
            dataRows = complaint.barcodes.map(b => {
                const factory = parseSingleBarcode(b).factory;
                return [...commonData, b, factory];
            });
        } else {
            dataRows = [[...commonData, 'Kayıtlı barkod bulunamadı.', '-']];
        }

        const combinedData = [headers, ...dataRows];

        // Create Worksheet
        const ws = XLSX.utils.aoa_to_sheet(combinedData);

        // Setup column widths
        ws['!cols'] = [
            { wch: 15 }, { wch: 20 }, { wch: 20 }, { wch: 25 },
            { wch: 25 }, { wch: 20 }, { wch: 15 },
            { wch: 15 }, { wch: 10 }, { wch: 10 }, { wch: 10 },
            { wch: 20 }, { wch: 15 }, { wch: 20 }, { wch: 30 }, { wch: 15 }
        ];

        // Apply styles to header row (row 0)
        const range = XLSX.utils.decode_range(ws['!ref'] || 'A1:P1');
        for (let C = range.s.c; C <= range.e.c; ++C) {
            const cellAddress = XLSX.utils.encode_cell({ r: 0, c: C });
            if (!ws[cellAddress]) continue;
            ws[cellAddress].s = {
                font: { bold: true, color: { rgb: "FFFFFF" } },
                fill: { fgColor: { rgb: "4F46E5" } }, // Indigo-600 basic
                alignment: { horizontal: "center", vertical: "center" }
            };
        }

        // Merge cells for common data if there are multiple barcodes
        const totalRows = combinedData.length;
        if (totalRows > 2) {
            const merges = [];
            // Columns 0 to 13 are common data. We merge from row 1 to totalRows - 1
            for (let c = 0; c <= 13; c++) {
                merges.push({ s: { r: 1, c: c }, e: { r: totalRows - 1, c: c } });
            }
            ws['!merges'] = merges;
        }

        // Apply basic vertical centering style for merged data cells
        for (let R = 1; R <= range.e.r; ++R) {
            for (let C = 0; C <= 13; ++C) { // Only first 14 columns
                const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
                if (!ws[cellAddress]) continue;
                if (!ws[cellAddress].s) ws[cellAddress].s = {};
                ws[cellAddress].s.alignment = { vertical: "center", horizontal: "center" };
            }
        }

        // Create Workbook
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Şikayet Detayı');

        // Download file
        XLSX.writeFile(wb, `Sikayet_${complaint.complaintNumber}.xlsx`);
    };

    const handleSave = async () => {
        try {
            setUpdating(true);
            const updatedComplaint = await complaintService.updateOperationalStage(complaint.id, {
                stage: complaint.operationalStage || STAGES[0],
                note: note || undefined,
                justifiedHsa1Count: justificationCounts.jhsa1,
                justifiedHsa2Count: justificationCounts.jhsa2,
                justifiedOtherCount: justificationCounts.jother,
                unjustifiedHsa1Count: justificationCounts.uhsa1,
                unjustifiedHsa2Count: justificationCounts.uhsa2,
                unjustifiedOtherCount: justificationCounts.uother,
                has8DReport: has8DReport,
                barcodeResults: Object.entries(barcodeJusts)
                    .filter(([_, val]) => val !== null)
                    .map(([bc, val]) => ({ id: 0, barcode: bc, isJustified: !!val }))
            });
            if (onOperationalStageUpdate) {
                onOperationalStageUpdate(updatedComplaint);
            }
            alert('Tüm değişiklikler başarıyla kaydedildi.');
        } catch (error) {
            console.error('Kaydedilemedi:', error);
            alert('Kaydedilirken bir hata oluştu.');
        } finally {
            setUpdating(false);
        }
    };

    const handleUpdateStage = async (stage: string) => {
        try {
            setUpdating(true);
            const updatedComplaint = await complaintService.updateOperationalStage(complaint.id, {
                stage,
                note: note || undefined,
                justifiedHsa1Count: justificationCounts.jhsa1,
                justifiedHsa2Count: justificationCounts.jhsa2,
                justifiedOtherCount: justificationCounts.jother,
                unjustifiedHsa1Count: justificationCounts.uhsa1,
                unjustifiedHsa2Count: justificationCounts.uhsa2,
                unjustifiedOtherCount: justificationCounts.uother,
                has8DReport: has8DReport,
                barcodeResults: Object.entries(barcodeJusts)
                    .filter(([_, val]) => val !== null)
                    .map(([bc, val]) => ({ id: 0, barcode: bc, isJustified: !!val }))
            });
            setNote('');
            if (onOperationalStageUpdate) {
                onOperationalStageUpdate(updatedComplaint);
            }
        } catch (error) {
            console.error('Aşama güncellenemedi:', error);
            alert('Aşama güncellenirken bir hata oluştu.');
        } finally {
            setUpdating(false);
        }
    };

    const handle8DToggle = (val: boolean) => {
        setHas8DReport(val);
        if (val) {
            // "Evet" seçildiğinde doküman yükleme penceresini otomatik aç
            setTimeout(() => {
                docSectionRef.current?.openFileUpload();
            }, 100);
        }
    };

    const handleTargetDateToggle = async (val: boolean) => {
        setHasTargetDate(val);
        if (!val) {
            setTargetDateInput('');
            try {
                setUpdatingTargetDate(true);
                const updated = await complaintService.updateTargetDate(complaint.id, {
                    hasTargetDate: false,
                    targetDate: null
                });
                if (onOperationalStageUpdate) {
                    onOperationalStageUpdate(updated);
                }
            } catch (error) {
                console.error('Hedef tarih güncellenemedi:', error);
                alert('Hedef tarih güncellenirken bir hata oluştu.');
                setHasTargetDate(complaint.hasTargetDate ?? null); // revert
            } finally {
                setUpdatingTargetDate(false);
            }
        }
    };

    const saveTargetDate = async () => {
        if (hasTargetDate && !targetDateInput) {
            alert('Lütfen bir hedef tarih seçiniz.');
            return;
        }
        try {
            setUpdatingTargetDate(true);
            const updated = await complaintService.updateTargetDate(complaint.id, {
                hasTargetDate: hasTargetDate,
                targetDate: hasTargetDate ? targetDateInput : null
            });
            if (onOperationalStageUpdate) {
                onOperationalStageUpdate(updated);
            }
            alert('Hedef tarih başarıyla kaydedildi.');
        } catch (error) {
            console.error('Hedef tarih güncellenemedi:', error);
            alert('Hedef tarih güncellenirken bir hata oluştu.');
        } finally {
            setUpdatingTargetDate(false);
        }
    };

    const handleUpdateStatus = async (newStatus: 'Acik' | 'Kapali') => {
        const actionText = newStatus === 'Kapali' ? 'kapatmak' : 'yeniden açmak';
        if (!window.confirm(`Bu şikayeti ${actionText} istediğinize emin misiniz?`)) return;
        
        try {
            setClosing(true);
            await complaintService.changeStatus(complaint.id, {
                status: newStatus,
                note: `Şikayet durumu kullanıcı tarafından ${newStatus === 'Kapali' ? 'kapatıldı' : 'açıldı'}.`
            });
            
            if (onOperationalStageUpdate) {
                const c = await complaintService.getById(complaint.id);
                onOperationalStageUpdate(c.complaint);
            }
            alert(`Şikayet başarıyla ${newStatus === 'Kapali' ? 'kapatıldı' : 'açıldı'}.`);
            if (newStatus === 'Kapali') {
                onClose();
            }
        } catch (error) {
            console.error('Durum güncellenemedi:', error);
            alert('Durum güncellenirken bir hata oluştu.');
        } finally {
            setClosing(false);
        }
    };

    const isClosed = complaint.status.includes('Kapalı') || complaint.status === 'Kapali';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            ></div>

            {/* Modal Content */}
            <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-6xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                            Şikayet Detayı
                            <span className="px-2.5 py-1 rounded-md bg-blue-100 text-blue-700 text-sm font-bold tracking-wider">
                                {complaint.complaintNumber}
                            </span>
                        </h2>
                        <p className="text-sm text-slate-900 font-medium mt-0.5">
                            Sistem Kayıt: {formatDate(complaint.registrationDate)}
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleExportExcel}
                            className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 hover:text-emerald-700 text-sm font-bold rounded-lg transition-colors border border-emerald-200" title="Excel'e Aktar"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Excel'e Aktar
                        </button>
                        <button
                            onClick={onClose}
                            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-colors"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Body (Scrollable) */}
                <div className="flex-1 overflow-y-auto p-6 space-y-8">

                    {/* Hedef Tarih */}
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <div>
                                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Hedef Tarih Var Mı?</h3>
                                <p className="text-[10px] text-slate-500 mt-1 italic">Bu şikayet için planlanan bir hedef tarih olup olmadığı.</p>
                            </div>
                            <div className="flex flex-wrap items-center gap-4 w-full sm:w-auto">
                                <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-sm shrink-0">
                                    <button 
                                        type="button"
                                        onClick={() => handleTargetDateToggle(true)}
                                        disabled={updatingTargetDate || isClosed || !canEditActions}
                                        className={`px-6 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${hasTargetDate === true ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-700'}`}
                                    >
                                        {hasTargetDate === true && <div className="w-1.5 h-1.5 rounded-full bg-white"></div>}
                                        Evet
                                    </button>
                                    <button 
                                        type="button"
                                        onClick={() => handleTargetDateToggle(false)}
                                        disabled={updatingTargetDate || isClosed || !canEditActions}
                                        className={`px-6 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${hasTargetDate === false ? 'bg-red-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-700'}`}
                                    >
                                        {hasTargetDate === false && <div className="w-1.5 h-1.5 rounded-full bg-white"></div>}
                                        Hayır
                                    </button>
                                </div>
                                {hasTargetDate === true && (
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="date"
                                            value={targetDateInput}
                                            onChange={(e) => setTargetDateInput(e.target.value)}
                                            disabled={updatingTargetDate || isClosed || !canEditActions}
                                            className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-slate-700"
                                        />
                                        <button
                                            onClick={saveTargetDate}
                                            disabled={updatingTargetDate || !targetDateInput || isClosed || !canEditActions}
                                            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm"
                                        >
                                            Kaydet
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Grid Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Sol Kolon - Müşteri & Proje */}
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-xs font-black text-slate-900  tracking-wider mb-3">Müşteri ve Proje Bilgileri</h3>
                                <div className="bg-slate-50 rounded-xl p-4 space-y-3 border border-slate-100">
                                    <div>
                                        <div className="text-[10px] text-slate-900  font-black">Müşteri İsmi</div>
                                        <div className="font-medium text-slate-800">{complaint.customerName}</div>
                                    </div>
                                    <div>
                                        <div className="text-[10px] text-slate-900  font-black">Satış Sorumlusu</div>
                                        <div className="font-medium text-slate-800">{complaint.sellerName}</div>
                                    </div>
                                    <div>
                                        <div className="text-[10px] text-slate-900  font-black">Proje İsmi & Lokasyonu</div>
                                        <div className="font-medium text-slate-800">{complaint.projectName || '-'} / {complaint.projectLocation || '-'}</div>
                                    </div>
                                    <div>
                                        <div className="text-[10px] text-slate-900  font-black">Şikayet Tarihi (Saha)</div>
                                        <div className="font-medium text-slate-800">{formatDate(complaint.complaintDate)}</div>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h3 className="text-xs font-black text-slate-900  tracking-wider mb-3">Şikayet Durumu</h3>
                                <div className="bg-slate-50 rounded-xl p-4 space-y-3 border border-slate-100">
                                    <div className="flex justify-between items-center">
                                        <div className="text-[10px] text-slate-900  font-black">Durum</div>
                                        <div className={`px-2 py-1 rounded-md text-xs font-bold ${complaint.status.includes('Gecikti') ? 'bg-red-100 text-red-700' :
                                                complaint.status.includes('Kapalı') || complaint.status.includes('Kapali') ? 'bg-emerald-100 text-emerald-700' :
                                                    'bg-amber-100 text-amber-700'
                                            }`}>
                                            {complaint.status}
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <div className="text-[10px] text-slate-900  font-black">Mevcut Aşama</div>
                                        <div className="font-medium text-blue-600">{complaint.currentDepartmentName}</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Sağ Kolon - Ürün & Barkod Özet */}
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-xs font-black text-slate-900  tracking-wider mb-3">Ürün ve Kusur Bilgileri</h3>
                                <div className="bg-slate-50 rounded-xl p-4 space-y-3 border border-slate-100">
                                    <div className="grid grid-cols-2 gap-3">

                                        <div>
                                            <div className="text-[10px] text-slate-900  font-black">Kusurlu Sayısı</div>
                                            <div className="font-bold text-red-600 text-lg">{complaint.defectiveQuantity}</div>
                                        </div>
                                        <div>
                                            <div className="text-[10px] text-slate-900  font-black">Marka</div>
                                            <div className="font-medium text-slate-800">{complaint.brand || '-'}</div>
                                        </div>
                                        <div>
                                            <div className="text-[10px] text-slate-900  font-black">Güç</div>
                                            <div className="font-medium text-slate-800">{complaint.modulePower || '-'}</div>
                                        </div>

                                        <div className="col-span-2">
                                            <div className="text-[10px] text-slate-900  font-black">Hata Tanımı</div>
                                            <div className="font-bold text-blue-700 bg-blue-50 px-2.5 py-1.5 rounded-lg border border-blue-100 inline-block mt-1">
                                                {complaint.errorDefinition || 'Tanımlanmamış'}
                                            </div>
                                        </div>

                                        <div className="col-span-2 pt-2 mt-2 border-t border-slate-200 grid grid-cols-2 gap-3">
                                            <div>
                                                <div className="text-[10px] text-slate-900  font-black">HSA1 Miktarı</div>
                                                <div className="font-bold text-emerald-600">{complaint.hsa1 || 0}</div>
                                            </div>
                                            <div>
                                                <div className="text-[10px] text-slate-900  font-black">HSA2 Miktarı</div>
                                                <div className="font-bold text-indigo-600">{complaint.hsa2 || 0}</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Not Alanı */}
                            <div>
                                <h3 className="text-xs font-black text-slate-900  tracking-wider mb-3">Şikayet Notu</h3>
                                <div className="bg-amber-50 rounded-xl p-4 border border-amber-100 text-amber-900 text-sm italic min-h-[80px]">
                                    {complaint.initialNote || 'Bu şikayet kaydına ait henüz bir not bulunmuyor.'}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Barkodlar Listesi (Alt Kısım Geniş) */}
                    <div>
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-3 gap-3">
                            <h3 className="text-xs font-bold text-slate-900  tracking-wider">Okunan Barkodlar</h3>

                            <div className="flex bg-slate-100 p-1 rounded-lg">
                                <button
                                    onClick={() => setBarcodeFilter('ALL')}
                                    className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${barcodeFilter === 'ALL'
                                        ? 'bg-white text-slate-800 shadow-sm'
                                        : 'text-slate-500 hover:text-slate-700'
                                        }`}
                                >
                                    Tümü ({complaint.barcodes?.length || 0})
                                </button>
                                <button
                                    onClick={() => setBarcodeFilter('HSA1')}
                                    className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${barcodeFilter === 'HSA1'
                                        ? 'bg-emerald-500 text-white shadow-sm'
                                        : 'text-slate-500 hover:text-emerald-600'
                                        }`}
                                >
                                    HSA1
                                </button>
                                <button
                                    onClick={() => setBarcodeFilter('HSA2')}
                                    className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${barcodeFilter === 'HSA2'
                                        ? 'bg-indigo-500 text-white shadow-sm'
                                        : 'text-slate-500 hover:text-indigo-600'
                                        }`}
                                >
                                    HSA2
                                </button>
                            </div>
                        </div>

                        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-inner font-mono text-sm">
                            {filteredBarcodes.length > 0 ? (
                                <ul className="max-h-60 overflow-y-auto divide-y divide-slate-100 p-2">
                                    {filteredBarcodes.map((barcode, idx) => {
                                        const factory = parseSingleBarcode(barcode).factory;
                                        const currentJust = barcodeJusts[barcode];
                                        return (
                                            <li key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between px-4 py-3 text-slate-600 hover:bg-slate-50 rounded-md transition-colors gap-3">
                                                <div className="flex items-center gap-3">
                                                    <span className="text-slate-900 font-bold w-8 inline-block select-none">{idx + 1}.</span>
                                                    <span className="font-bold tracking-tight text-slate-700">{barcode}</span>
                                                    {factory === 'HSA1' && <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-700">HSA1</span>}
                                                    {factory === 'HSA2' && <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-100 text-indigo-700">HSA2</span>}
                                                </div>
                                                
                                                {showOperationalStageUpdate && (
                                                    <div className="flex items-center gap-4 bg-slate-100/50 p-1.5 rounded-lg border border-slate-200/50">
                                                        <label className="flex items-center gap-2 cursor-pointer group">
                                                            <input
                                                                type="radio"
                                                                name={`just-${barcode}`}
                                                                checked={currentJust === true}
                                                                onChange={() => setBarcodeJusts(prev => ({ ...prev, [barcode]: true }))}
                                                                disabled={isClosed || !canEditActions}
                                                                className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 border-slate-300 disabled:opacity-50"
                                                            />
                                                            <span className={`text-xs font-bold ${currentJust === true ? 'text-emerald-700' : 'text-slate-500 group-hover:text-slate-700'}`}>Haklı</span>
                                                        </label>
                                                        <label className="flex items-center gap-2 cursor-pointer group">
                                                            <input
                                                                type="radio"
                                                                name={`just-${barcode}`}
                                                                checked={currentJust === false}
                                                                onChange={() => setBarcodeJusts(prev => ({ ...prev, [barcode]: false }))}
                                                                disabled={isClosed || !canEditActions}
                                                                className="w-4 h-4 text-red-600 focus:ring-red-500 border-slate-300 disabled:opacity-50"
                                                            />
                                                            <span className={`text-xs font-bold ${currentJust === false ? 'text-red-700' : 'text-slate-500 group-hover:text-slate-700'}`}>Haksız</span>
                                                        </label>
                                                            <button 
                                                            onClick={() => setBarcodeJusts(prev => {
                                                                const next = { ...prev };
                                                                delete next[barcode];
                                                                return next;
                                                            })}
                                                            disabled={isClosed || !canEditActions}
                                                            className="p-1 text-slate-400 hover:text-slate-600 rounded transition-colors disabled:opacity-50"
                                                            title="Seçimi Temizle"
                                                        >
                                                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                )}
                                            </li>
                                        );
                                    })}
                                </ul>
                            ) : (
                                <div className="p-8 text-center text-slate-400 text-sm font-medium">
                                    {barcodeFilter === 'ALL' ? 'Sisteme kayıtlı barkod bulunamadı.' : 'Bu fabrikaya ait barkod bulunamadı.'}
                                </div>
                            )}
                        </div>

                        {/* 8D/DF Seçimi (Sadece Aksiyonlar Sayfası) */}
                        {showOperationalStageUpdate && (
                            <div className="mt-6 space-y-4">
                                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">8D/DF var mı?</h3>
                                            <p className="text-[10px] text-slate-500 mt-1 italic">Düzeltici Önleyici Faaliyet (8D) dokümanı eklenip eklenmediği.</p>
                                        </div>
                                        <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
                                            <button 
                                                type="button"
                                                onClick={() => handle8DToggle(true)}
                                                disabled={updating || isClosed || !canEditActions}
                                                className={`px-6 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${has8DReport ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-700'} disabled:opacity-50`}
                                            >
                                                {has8DReport && <div className="w-1.5 h-1.5 rounded-full bg-white"></div>}
                                                Evet
                                            </button>
                                            <button 
                                                type="button"
                                                onClick={() => handle8DToggle(false)}
                                                disabled={updating || isClosed || !canEditActions}
                                                className={`px-6 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${!has8DReport ? 'bg-red-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-700'} disabled:opacity-50`}
                                            >
                                                {!has8DReport && <div className="w-1.5 h-1.5 rounded-full bg-white"></div>}
                                                Hayır
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                
                                {/* 8D Dokümanları - "Evet" seçildiyse hemen altında göster */}
                                {(has8DReport || complaint.documents?.some(d => d.is8DReport)) && (
                                    <div className="p-4 bg-white border border-blue-100 rounded-xl shadow-sm mb-4">
                                        <DocumentSection 
                                            ref={docSectionRef}
                                            complaintId={complaint.id} 
                                            initialDocuments={complaint.documents} 
                                            onUpload={onUpload}
                                            canUpload={!isClosed && canEditActions}
                                            is8DOnly={true}
                                            title='8D/DF Dokümanı ve Ekler'
                                        />
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Manuel Haklı/Haksız Sayı Girişi Tablosu (Sadece Aksiyonlar Sayfası) */}
                    {showOperationalStageUpdate && (
                        <div className="pt-6 border-t border-slate-100 space-y-4">
                            <h3 className="text-xs font-black text-slate-900 tracking-wider">Haklı / Haksız Karar Özeti</h3>
                            <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white shadow-sm transition-all hover:shadow-md">
                                <table className="w-full text-sm border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50/80 border-b border-slate-200">
                                            <th className="px-4 py-3 text-left font-black text-slate-900 uppercase tracking-tighter w-1/4 italic">Karar / Fabrika</th>
                                            <th className="px-4 py-3 text-center font-black text-emerald-700 uppercase tracking-wider">HSA1</th>
                                            <th className="px-4 py-3 text-center font-black text-indigo-700 uppercase tracking-wider">HSA2</th>
                                            <th className="px-4 py-3 text-center font-black text-slate-600 uppercase tracking-wider">Diğer</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        <tr>
                                            <td className="px-4 py-3 font-bold text-emerald-700 bg-emerald-50/30">HAKLI</td>
                                            <td className="px-4 py-3">
                                                <input 
                                                    type="number" 
                                                    value={justificationCounts.jhsa1}
                                                    onChange={(e) => setJustificationCounts(prev => ({ ...prev, jhsa1: parseInt(e.target.value) || 0 }))}
                                                    onFocus={(e) => e.target.select()}
                                                    readOnly={isClosed || !canEditActions}
                                                    className={`w-full text-center py-2 px-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none font-bold text-slate-900 ${(isClosed || !canEditActions) ? 'bg-slate-50 opacity-70' : ''}`}
                                                />
                                            </td>
                                            <td className="px-4 py-3">
                                                <input 
                                                    type="number" 
                                                    value={justificationCounts.jhsa2}
                                                    onChange={(e) => setJustificationCounts(prev => ({ ...prev, jhsa2: parseInt(e.target.value) || 0 }))}
                                                    onFocus={(e) => e.target.select()}
                                                    readOnly={isClosed || !canEditActions}
                                                    className={`w-full text-center py-2 px-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none font-bold text-slate-900 ${(isClosed || !canEditActions) ? 'bg-slate-50 opacity-70' : ''}`}
                                                />
                                            </td>
                                            <td className="px-4 py-3">
                                                <input 
                                                    type="number" 
                                                    value={justificationCounts.jother}
                                                    onChange={(e) => setJustificationCounts(prev => ({ ...prev, jother: parseInt(e.target.value) || 0 }))}
                                                    onFocus={(e) => e.target.select()}
                                                    readOnly={isClosed || !canEditActions}
                                                    className={`w-full text-center py-2 px-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500/20 focus:border-slate-500 outline-none font-bold text-slate-900 ${(isClosed || !canEditActions) ? 'bg-slate-50 opacity-70' : ''}`}
                                                />
                                            </td>
                                        </tr>
                                        <tr>
                                            <td className="px-4 py-3 font-bold text-red-700 bg-red-50/30">HAKSIZ</td>
                                            <td className="px-4 py-3">
                                                <input 
                                                    type="number" 
                                                    value={justificationCounts.uhsa1}
                                                    onChange={(e) => setJustificationCounts(prev => ({ ...prev, uhsa1: parseInt(e.target.value) || 0 }))}
                                                    onFocus={(e) => e.target.select()}
                                                    readOnly={isClosed || !canEditActions}
                                                    className={`w-full text-center py-2 px-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none font-bold text-slate-900 ${(isClosed || !canEditActions) ? 'bg-slate-50 opacity-70' : ''}`}
                                                />
                                            </td>
                                            <td className="px-4 py-3">
                                                <input 
                                                    type="number" 
                                                    value={justificationCounts.uhsa2}
                                                    onChange={(e) => setJustificationCounts(prev => ({ ...prev, uhsa2: parseInt(e.target.value) || 0 }))}
                                                    onFocus={(e) => e.target.select()}
                                                    readOnly={isClosed || !canEditActions}
                                                    className={`w-full text-center py-2 px-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none font-bold text-slate-900 ${(isClosed || !canEditActions) ? 'bg-slate-50 opacity-70' : ''}`}
                                                />
                                            </td>
                                            <td className="px-4 py-3">
                                                <input 
                                                    type="number" 
                                                    value={justificationCounts.uother}
                                                    onChange={(e) => setJustificationCounts(prev => ({ ...prev, uother: parseInt(e.target.value) || 0 }))}
                                                    onFocus={(e) => e.target.select()}
                                                    readOnly={isClosed || !canEditActions}
                                                    className={`w-full text-center py-2 px-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500/20 focus:border-slate-500 outline-none font-bold text-slate-900 ${(isClosed || !canEditActions) ? 'bg-slate-50 opacity-70' : ''}`}
                                                />
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Operasyonel Aşama Güncelleme (Sadece Aksiyonlar Sayfası İçin) */}
                    {showOperationalStageUpdate && (
                        <div className="pt-6 border-t border-slate-100 space-y-4">
                            <h3 className="text-xs font-black text-slate-900 tracking-wider">Operasyonel Aşama Güncelle</h3>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-3">
                                    <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Aşama Seçiniz</div>
                                    <div className="grid grid-cols-1 gap-2">
                                        {STAGES.map((stage) => (
                                            <button
                                                key={stage}
                                                onClick={() => handleUpdateStage(stage)}
                                                disabled={updating || isClosed || !canEditActions}
                                                className={`w-full text-left px-4 py-3 rounded-xl text-sm font-semibold transition-all border-2 flex items-center justify-between group disabled:opacity-50 disabled:cursor-not-allowed
                                                    ${complaint.operationalStage === stage 
                                                        ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/20' 
                                                        : 'bg-white border-slate-100 text-slate-600 hover:border-blue-200 hover:bg-blue-50'
                                                    }`}
                                            >
                                                {stage}
                                                {complaint.operationalStage === stage && (
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                    </svg>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-3 flex flex-col">
                                    <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Açıklama / Not</div>
                                    <textarea
                                        value={note}
                                        onChange={(e) => setNote(e.target.value)}
                                        placeholder="Operasyonel aşama değişikliği için not ekleyin..."
                                        disabled={isClosed || !canEditActions}
                                        className="flex-1 w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none min-h-[120px] text-slate-900 font-medium disabled:opacity-70"
                                    />
                                    
                                    <button
                                        onClick={handleSave}
                                        disabled={updating || isClosed || !canEditActions}
                                        className="mt-4 w-full py-3 bg-emerald-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-emerald-500/20 hover:bg-emerald-700 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                                        </svg>
                                        TÜM DEĞİŞİKLİKLERİ KAYDET
                                    </button>

                                    {updating && (
                                        <div className="flex items-center gap-2 text-blue-600 text-xs font-bold animate-pulse">
                                            <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                                            Güncelleniyor...
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Şikayet Durumu Değiştirme (Açık/Kapalı) */}
                            <div className="mt-8 pt-6 border-t border-slate-200">
                                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-200">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isClosed ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>
                                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-bold text-slate-900">Şikayet Durum Yönetimi</h4>
                                            <p className="text-xs text-slate-500 font-medium">Şu anki durum: <span className={`font-bold ${isClosed ? 'text-red-600' : 'text-emerald-600'}`}>{isClosed ? 'KAPALI' : 'AÇIK'}</span></p>
                                        </div>
                                    </div>
                                    
                                    {isClosed ? (
                                        canReopen && (
                                            <button
                                                onClick={() => handleUpdateStatus('Acik')}
                                                disabled={closing}
                                                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl shadow-lg shadow-emerald-500/20 transition-all active:scale-[0.98] flex items-center gap-2"
                                            >
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                                                </svg>
                                                Şikayeti Yeniden Aç
                                            </button>
                                        )
                                    ) : (
                                        canEditActions && (
                                            <button
                                                onClick={() => handleUpdateStatus('Kapali')}
                                                disabled={closing}
                                                className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-xl shadow-lg shadow-red-500/20 transition-all active:scale-[0.98] flex items-center gap-2"
                                            >
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                                </svg>
                                                Şikayeti Kapat
                                            </button>
                                        )
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Normal Dokümanlar Bölümü (Her zaman sayfanın en altında) */}
                    <div className="pt-6 border-t border-slate-100">
                        <DocumentSection 
                            complaintId={complaint.id} 
                            initialDocuments={complaint.documents} 
                            onUpload={onUpload}
                            canUpload={!isClosed && canEditActions}
                            is8DOnly={false}
                            title='İlgili Dokümanlar'
                        />
                    </div>


                </div>
            </div>
        </div>
    );
}
