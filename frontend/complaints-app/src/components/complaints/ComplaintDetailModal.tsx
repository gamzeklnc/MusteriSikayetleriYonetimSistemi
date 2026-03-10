'use client';

import { useState } from 'react';
import * as XLSX from 'xlsx-js-style';
import { ComplaintDto } from '@/types/complaint';
import { parseSingleBarcode } from '@/utils/barcodeParser';

interface Props {
    complaint: ComplaintDto;
    onClose: () => void;
}

export default function ComplaintDetailModal({ complaint, onClose }: Props) {
    const [barcodeFilter, setBarcodeFilter] = useState<'ALL' | 'HSA1' | 'HSA2'>('ALL');

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
            'Satıcı',
            'Proje',
            'Stok Kodu',
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
            complaint.stockCode,
            complaint.brand || '-',
            complaint.modulePower || '-',
            complaint.defectiveQuantity.toString(),
            (complaint.hsa1 || 0).toString(),
            (complaint.hsa2 || 0).toString(),
            complaint.errorDefinition || '-',
            complaint.status === 'Acik' ? 'Açık' : 'Kapalı',
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
            { wch: 25 }, { wch: 20 }, { wch: 15 }, { wch: 15 }, 
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
            // Columns 0 to 14 are common data. We merge from row 1 to totalRows - 1
            for (let c = 0; c <= 14; c++) {
                merges.push({ s: { r: 1, c: c }, e: { r: totalRows - 1, c: c } });
            }
            ws['!merges'] = merges;
        }

        // Apply basic vertical centering style for merged data cells
        for (let R = 1; R <= range.e.r; ++R) {
             for (let C = 0; C <= 14; ++C) { // Only first 15 columns
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
                        <p className="text-sm text-slate-500 mt-0.5">
                            Sistem Kayıt: {formatDate(complaint.registrationDate)}
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button 
                            onClick={handleExportExcel}
                            className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 hover:text-emerald-700 text-sm font-bold rounded-lg transition-colors border border-emerald-200"
                            title="Excel'e Aktar"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Excel'e Aktar
                        </button>
                        <button 
                            onClick={onClose}
                            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Body (Scrollable) */}
                <div className="flex-1 overflow-y-auto p-6 space-y-8">
                    
                    {/* Grid Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Sol Kolon - Müşteri & Proje */}
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Müşteri ve Proje Bilgileri</h3>
                                <div className="bg-slate-50 rounded-xl p-4 space-y-3 border border-slate-100">
                                    <div>
                                        <div className="text-[10px] text-slate-400 uppercase font-bold">Müşteri İsmi</div>
                                        <div className="font-medium text-slate-800">{complaint.customerName}</div>
                                    </div>
                                    <div>
                                        <div className="text-[10px] text-slate-400 uppercase font-bold">Satıcı Firma</div>
                                        <div className="font-medium text-slate-800">{complaint.sellerName}</div>
                                    </div>
                                    <div>
                                        <div className="text-[10px] text-slate-400 uppercase font-bold">Proje İsmi & Lokasyonu</div>
                                        <div className="font-medium text-slate-800">{complaint.projectName || '-'} / {complaint.projectLocation || '-'}</div>
                                    </div>
                                    <div>
                                        <div className="text-[10px] text-slate-400 uppercase font-bold">Şikayet Tarihi (Saha)</div>
                                        <div className="font-medium text-slate-800">{formatDate(complaint.complaintDate)}</div>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Şikayet Durumu</h3>
                                <div className="bg-slate-50 rounded-xl p-4 space-y-3 border border-slate-100">
                                    <div className="flex justify-between items-center">
                                        <div className="text-[10px] text-slate-400 uppercase font-bold">Durum</div>
                                        <div className={`px-2 py-1 rounded-md text-xs font-bold ${complaint.status === 'Acik' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                            {complaint.status === 'Acik' ? 'Açık' : 'Kapalı'}
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <div className="text-[10px] text-slate-400 uppercase font-bold">Mevcut Aşama</div>
                                        <div className="font-medium text-blue-600">{complaint.currentDepartmentName}</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Sağ Kolon - Ürün & Barkod Özet */}
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Ürün ve Kusur Bilgileri</h3>
                                <div className="bg-slate-50 rounded-xl p-4 space-y-3 border border-slate-100">
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <div className="text-[10px] text-slate-400 uppercase font-bold">Stok Kodu</div>
                                            <div className="font-bold text-slate-800">{complaint.stockCode}</div>
                                        </div>
                                        <div>
                                            <div className="text-[10px] text-slate-400 uppercase font-bold">Kusurlu Sayısı</div>
                                            <div className="font-bold text-red-600 text-lg">{complaint.defectiveQuantity}</div>
                                        </div>
                                        <div>
                                            <div className="text-[10px] text-slate-400 uppercase font-bold">Marka</div>
                                            <div className="font-medium text-slate-800">{complaint.brand || '-'}</div>
                                        </div>
                                        <div>
                                            <div className="text-[10px] text-slate-400 uppercase font-bold">Güç</div>
                                            <div className="font-medium text-slate-800">{complaint.modulePower || '-'}</div>
                                        </div>
                                        
                                        <div className="col-span-2">
                                            <div className="text-[10px] text-slate-400 uppercase font-bold">Hata Tanımı</div>
                                            <div className="font-bold text-blue-700 bg-blue-50 px-2.5 py-1.5 rounded-lg border border-blue-100 inline-block mt-1">
                                                {complaint.errorDefinition || 'Tanımlanmamış'}
                                            </div>
                                        </div>
                                        
                                        <div className="col-span-2 pt-2 mt-2 border-t border-slate-200 grid grid-cols-2 gap-3">
                                            <div>
                                                <div className="text-[10px] text-slate-400 uppercase font-bold">HSA1 Miktarı</div>
                                                <div className="font-bold text-emerald-600">{complaint.hsa1 || 0}</div>
                                            </div>
                                            <div>
                                                <div className="text-[10px] text-slate-400 uppercase font-bold">HSA2 Miktarı</div>
                                                <div className="font-bold text-indigo-600">{complaint.hsa2 || 0}</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Not Alanı */}
                            <div>
                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Şikayet Notu</h3>
                                <div className="bg-amber-50 rounded-xl p-4 border border-amber-100 text-amber-900 text-sm italic min-h-[80px]">
                                    {complaint.initialNote || 'Bu şikayet kaydına ait henüz bir not bulunmuyor.'}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Barkodlar Listesi (Alt Kısım Geniş) */}
                    <div>
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-3 gap-3">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Okunan Barkodlar</h3>
                            
                            <div className="flex bg-slate-100 p-1 rounded-lg">
                                <button
                                    onClick={() => setBarcodeFilter('ALL')}
                                    className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${
                                        barcodeFilter === 'ALL' 
                                        ? 'bg-white text-slate-800 shadow-sm' 
                                        : 'text-slate-500 hover:text-slate-700'
                                    }`}
                                >
                                    Tümü ({complaint.barcodes?.length || 0})
                                </button>
                                <button
                                    onClick={() => setBarcodeFilter('HSA1')}
                                    className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${
                                        barcodeFilter === 'HSA1' 
                                        ? 'bg-emerald-500 text-white shadow-sm' 
                                        : 'text-slate-500 hover:text-emerald-600'
                                    }`}
                                >
                                    HSA1
                                </button>
                                <button
                                    onClick={() => setBarcodeFilter('HSA2')}
                                    className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${
                                        barcodeFilter === 'HSA2' 
                                        ? 'bg-indigo-500 text-white shadow-sm' 
                                        : 'text-slate-500 hover:text-indigo-600'
                                    }`}
                                >
                                    HSA2
                                </button>
                            </div>
                        </div>
                        
                        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-inner">
                            {filteredBarcodes.length > 0 ? (
                                <ul className="max-h-60 overflow-y-auto divide-y divide-slate-100 p-2">
                                    {filteredBarcodes.map((barcode, idx) => {
                                        const factory = parseSingleBarcode(barcode).factory;
                                        return (
                                            <li key={idx} className="flex items-center justify-between px-4 py-2 font-mono text-sm text-slate-600 hover:bg-slate-50 rounded-md transition-colors">
                                                <div className="flex items-center gap-3">
                                                    <span className="text-slate-400 w-8 inline-block select-none">{idx + 1}.</span>
                                                    <span className="font-bold tracking-tight text-slate-700">{barcode}</span>
                                                </div>
                                                {factory === 'HSA1' && <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-700">HSA1</span>}
                                                {factory === 'HSA2' && <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-100 text-indigo-700">HSA2</span>}
                                                {factory === 'UNKNOWN' && <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-500">BİLİNMİYOR</span>}
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
                    </div>

                </div>
            </div>
        </div>
    );
}
