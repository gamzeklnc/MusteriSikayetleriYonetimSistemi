'use client';

import { useEffect, useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { complaintService } from '@/services/complaintService';
import { Truck, Trash2, Search, FileSpreadsheet, AlertCircle, Loader2, XCircle, ClipboardList, Calendar, CheckCircle2, HelpCircle } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useRef } from 'react';
import toast from 'react-hot-toast';

interface ShipmentCount {
    id: number;
    customerName: string;
    shipmentDate: string;
    shipmentQuantity: number;
    isMatched: boolean;
}

export default function ShipmentCountsPage() {
    const { user } = useAuthStore();
    const isAdmin = user?.role === 'Admin';

    const [records, setRecords] = useState<ShipmentCount[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const fetchRecords = async () => {
        try {
            setLoading(true);
            const data = await complaintService.getShipmentCounts();
            // Sort by shipmentDate descending
            const sorted = [...data].sort((a, b) => new Date(b.shipmentDate).getTime() - new Date(a.shipmentDate).getTime());
            setRecords(sorted);
        } catch (err) {
            console.error('Sevk verileri yüklenemedi:', err);
            toast.error('Sevk verileri yüklenirken bir hata oluştu.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRecords();
    }, []);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            setUploading(true);
            const response = await complaintService.importShipmentExcel(file);
            toast.success(response.message);
            await fetchRecords();
            if (fileInputRef.current) fileInputRef.current.value = '';
        } catch (err: any) {
            console.error('Yükleme hatası:', err);
            const msg = err.response?.data || 'Excel yüklenirken bir hata oluştu.';
            toast.error(msg);
        } finally {
            setUploading(false);
        }
    };

    const handleDeleteAll = async () => {
        try {
            await complaintService.deleteAllShipments();
            toast.success('Tüm sevk kayıtları silindi.');
            setShowDeleteAllConfirm(false);
            await fetchRecords();
        } catch (err) {
            console.error('Silme hatası:', err);
            toast.error('Kayıtlar silinirken bir hata oluştu.');
        }
    };

    const filteredRecords = records.filter(r => 
        r.customerName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // İstatistiki Hesaplamalar
    const grandTotalQuantity = filteredRecords.reduce((sum, r) => sum + r.shipmentQuantity, 0);
    const matchedTotalQuantity = filteredRecords
        .filter(r => r.isMatched)
        .reduce((sum, r) => sum + r.shipmentQuantity, 0);
    
    const uniqueCustomers = new Set(filteredRecords.map(r => r.customerName)).size;
    const matchedCount = filteredRecords.filter(r => r.isMatched).length;

    return (
        <AppLayout>
            <div className="space-y-6">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-3">
                            <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl text-white shadow-lg shadow-blue-500/20">
                                <Truck size={22} />
                            </div>
                            Sevk Adetleri
                        </h1>
                        <p className="text-slate-500 font-medium text-sm mt-1 ml-12">Excel'deki tüm sevkiyatları ve sistemdeki müşterilerle eşleşenleri takip edin.</p>
                    </div>

                    {isAdmin && records.length > 0 && (
                        <button
                            onClick={() => setShowDeleteAllConfirm(true)}
                            className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 text-sm font-bold rounded-xl transition-all border border-red-100"
                        >
                            <Trash2 size={16} />
                            Tümünü Temizle
                        </button>
                    )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Upload & Stats Section */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className="p-4 bg-slate-50 border-b border-slate-100">
                                <h2 className="text-sm font-black text-slate-900 tracking-widest uppercase flex items-center gap-2">
                                    <ClipboardList size={16} className="text-orange-500" />
                                    Sevk Verileri İçe Aktar
                                </h2>
                            </div>
                            <div className="p-6 space-y-4">
                                <div className="p-4 border border-orange-100 bg-orange-50/30 rounded-xl">
                                    <p className="text-xs text-orange-700 font-medium mb-4">
                                        Sevk listesini yükleyin. Sistem, şikayet kaydı olan müşterileri otomatik işaretler.
                                    </p>
                                    
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={handleFileUpload}
                                        accept=".xlsx, .xls"
                                        className="hidden"
                                    />
                                    
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={uploading}
                                        className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white border-2 border-dashed border-orange-200 rounded-xl text-sm font-bold text-orange-600 hover:bg-orange-50 transition-all group disabled:opacity-50"
                                    >
                                        {uploading ? (
                                            <>
                                                <Loader2 size={20} className="animate-spin" />
                                                Yükleniyor...
                                            </>
                                        ) : (
                                            <>
                                                <FileSpreadsheet size={20} className="group-hover:scale-110 transition-transform" />
                                                Güncel Sevk Dosyası Seç...
                                            </>
                                        )}
                                    </button>
                                </div>

                                <div className="bg-slate-50 rounded-xl p-4 space-y-4">
                                    <h3 className="text-[10px] font-black text-slate-400 tracking-widest uppercase">Sevkiyat Analizi</h3>
                                    <div className="space-y-2">
                                        <div className="flex flex-col p-3 bg-white rounded-xl border border-slate-100 shadow-sm gap-1">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Genel Toplam Sevk (Excel)</span>
                                            <span className="text-lg font-black text-slate-900 leading-none">{grandTotalQuantity.toLocaleString('tr-TR')}</span>
                                        </div>
                                        <div className="flex flex-col p-3 bg-blue-50 rounded-xl border border-blue-100 shadow-sm gap-1">
                                            <span className="text-[10px] font-bold text-blue-400 uppercase tracking-tight">Eşleşen Müşteri Toplamı</span>
                                            <span className="text-lg font-black text-blue-600 leading-none">{matchedTotalQuantity.toLocaleString('tr-TR')}</span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 mt-2">
                                            <div className="flex flex-col p-2 bg-white rounded-lg border border-slate-100 shadow-sm">
                                                <span className="text-[9px] font-bold text-slate-400 uppercase">Müşteri</span>
                                                <span className="text-xs font-black text-slate-800">{uniqueCustomers}</span>
                                            </div>
                                            <div className="flex flex-col p-2 bg-white rounded-lg border border-slate-100 shadow-sm">
                                                <span className="text-[9px] font-bold text-slate-400 uppercase">Eşleşen</span>
                                                <span className="text-xs font-black text-slate-800">{matchedCount}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Records Table Section */}
                    <div className="lg:col-span-2 space-y-4">
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[calc(100vh-250px)]">
                            <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50/50">
                                <div className="relative flex-1 w-full max-w-sm">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <input
                                        type="text"
                                        placeholder="Müşteri adına göre ara..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
                                    />
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-black text-slate-400 tracking-widest uppercase">
                                        {filteredRecords.length} Kayıt Listeleniyor
                                    </span>
                                </div>
                            </div>

                            <div className="overflow-x-auto flex-1 scrollbar-thin scrollbar-thumb-slate-200">
                                <table className="w-full text-left">
                                    <thead className="bg-slate-50 text-[10px] font-black text-slate-500 border-b border-slate-200 tracking-wider uppercase sticky top-0 z-10">
                                        <tr>
                                            <th className="px-6 py-4">Müşteri Adı</th>
                                            <th className="px-6 py-4">Durum</th>
                                            <th className="px-6 py-4 flex items-center gap-2">
                                                <Calendar size={12} />
                                                Sevk Tarihi
                                            </th>
                                            <th className="px-6 py-4 text-right">Sevk Adedi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {loading ? (
                                            <tr>
                                                <td colSpan={4} className="px-6 py-12 text-center">
                                                    <div className="flex flex-col items-center gap-2">
                                                        <Loader2 size={24} className="animate-spin text-blue-600" />
                                                        <span className="text-xs font-bold text-slate-400 tracking-widest uppercase">Yükleniyor...</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : filteredRecords.length === 0 ? (
                                            <tr>
                                                <td colSpan={4} className="px-6 py-20 text-center">
                                                    <div className="flex flex-col items-center gap-3 text-slate-300">
                                                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center">
                                                            <Truck size={32} />
                                                        </div>
                                                        <span className="text-sm font-bold tracking-tight">Kayıt bulunamadı.</span>
                                                        <p className="text-xs font-medium max-w-[200px] mx-auto text-slate-400">
                                                            Sol taraftan Excel dosyasını yükleyerek başlayın.
                                                        </p>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredRecords.map((record) => (
                                                <tr key={record.id} className={`hover:bg-blue-50/30 transition-colors group ${!record.isMatched ? 'opacity-70' : ''}`}>
                                                    <td className="px-6 py-4">
                                                        <div className="flex flex-col">
                                                            <span className="text-sm font-bold text-slate-700">{record.customerName}</span>
                                                            {!record.isMatched && (
                                                                <span className="text-[9px] text-red-500 font-bold uppercase tracking-tight">Sistemde Kayıtlı Değil</span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        {record.isMatched ? (
                                                            <div className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-100 w-fit">
                                                                <CheckCircle2 size={12} />
                                                                <span className="text-[10px] font-bold uppercase tracking-tighter">Eşleşti</span>
                                                            </div>
                                                        ) : (
                                                            <div className="flex items-center gap-1.5 text-slate-400 bg-slate-50 px-2 py-1 rounded-lg border border-slate-100 w-fit">
                                                                <HelpCircle size={12} />
                                                                <span className="text-[10px] font-bold uppercase tracking-tighter">Bilinmiyor</span>
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex flex-col">
                                                            <span className="text-sm font-medium text-slate-600">
                                                                {new Date(record.shipmentDate).toLocaleDateString('tr-TR', {
                                                                    day: '2-digit',
                                                                    month: 'long',
                                                                    year: 'numeric'
                                                                })}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <span className={`text-sm font-black px-4 py-1.5 rounded-xl border shadow-sm ${record.isMatched ? 'text-blue-600 bg-blue-50 border-blue-100' : 'text-slate-500 bg-slate-50 border-slate-200'}`}>
                                                            {record.shipmentQuantity.toLocaleString('tr-TR')}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Delete All Modal */}
            {showDeleteAllConfirm && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-8 text-center">
                            <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                <XCircle size={40} className="text-red-500" />
                            </div>
                            <h3 className="text-xl font-black text-slate-800 mb-2">Emin misiniz?</h3>
                            <p className="text-slate-500 text-sm font-medium leading-relaxed">
                                Tüm sevk kayıtları kalıcı olarak silinecektir. Bu işlem geri alınamaz.
                            </p>
                        </div>
                        <div className="p-6 bg-slate-50 flex gap-3">
                            <button
                                onClick={() => setShowDeleteAllConfirm(false)}
                                className="flex-1 px-6 py-3 bg-white border border-slate-200 text-slate-600 text-sm font-bold rounded-2xl hover:bg-slate-100 transition-all"
                            >
                                İPTAL
                            </button>
                            <button
                                onClick={handleDeleteAll}
                                className="flex-1 px-6 py-3 bg-red-600 text-white text-sm font-bold rounded-2xl hover:bg-red-700 transition-all shadow-lg shadow-red-500/30"
                            >
                                EVET, TÜMÜNÜ SİL
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
