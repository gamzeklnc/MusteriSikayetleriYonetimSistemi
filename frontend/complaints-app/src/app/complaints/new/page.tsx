'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AppLayout from '@/components/layout/AppLayout';
import { complaintService } from '@/services/complaintService';
import { userService } from '@/services/userService';
import { CreateComplaintRequest } from '@/types/complaint';
import { User } from '@/types/user';
import { aggregateBarcodes } from '@/utils/barcodeParser';
import { useAuthStore } from '@/store/authStore';

export default function NewComplaintPage() {
    const router = useRouter();
    const { user } = useAuthStore();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [users, setUsers] = useState<User[]>([]);

    // Stok kodundan marka ve güç bilgisini dinamik olarak türetir (backend ile aynı mantık)
    const deriveFromStockCode = (stockCode: string): { brand: string, modulePower: string } => {
        const code = stockCode.trim();
        if (!code) return { brand: '', modulePower: '' };

        const extractPowerBeforeW = (s: string): string => {
            const match = s.match(/(\d+)[Ww]/);
            return match ? match[1] + 'W' : '';
        };

        const extractPowerAfterPrefix = (s: string, prefix: string): string => {
            const rest = s.slice(prefix.length);
            const match = rest.match(/^(\d+)/);
            return match ? match[1] + 'W' : '';
        };

        const upper = code.toUpperCase();

        if (upper.startsWith('HSA'))    return { brand: 'Maviçam',  modulePower: extractPowerBeforeW(code) };
        if (upper.startsWith('JKM'))    return { brand: 'Jinko',     modulePower: extractPowerAfterPrefix(code, 'JKM') };
        if (upper.startsWith('SUNPWT')) return { brand: 'SunPwt',   modulePower: extractPowerBeforeW(code) };
        if (upper.startsWith('JAM'))    return { brand: 'Ja Solar',  modulePower: extractPowerBeforeW(code) };
        if (upper.startsWith('EL'))     return { brand: 'Elin',      modulePower: extractPowerBeforeW(code) };
        if (upper.startsWith('CW'))     return { brand: 'CW Enerji', modulePower: extractPowerBeforeW(code) };

        return { brand: '', modulePower: '' };
    };

    useEffect(() => {
        userService.getAll().then(setUsers).catch(err => console.error('Kullanıcılar yüklenemedi:', err));
    }, []);



    const [formData, setFormData] = useState<CreateComplaintRequest & { brand?: string, modulePower?: string }>({
        customerName: '',
        projectName: '',
        projectLocation: '',
        sellerName: '',
        complaintDate: new Date().toISOString().split('T')[0],
        stockCode: '',
        defectiveQuantity: 0,
        hsa1: 0,
        hsa2: 0,
        brand: '',
        modulePower: '',
        note: '',
        barcodes: []
    });

    const [barcodesInput, setBarcodesInput] = useState('');

    const handleBarcodesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const value = e.target.value;
        setBarcodesInput(value);

        const aggregated = aggregateBarcodes(value);

        setFormData(prev => ({
            ...prev,
            barcodes: aggregated.barcodes
        }));
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        let parsedValue: string | number | undefined = value;

        if (type === 'number') {
            parsedValue = value === '' ? undefined : Number(value);
        }

        const newFormData = { ...formData, [name]: parsedValue };

        // Stok Kodu değiştiğinde marka ve güç otomatik türetilir
        if (name === 'stockCode') {
            const derived = deriveFromStockCode(value);
            newFormData.brand = derived.brand;
            newFormData.modulePower = derived.modulePower;
        }

        setFormData(newFormData);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            // brand ve modulePower eklenmiş halini gönderiyoruz
            await complaintService.create(formData);
            router.push('/complaints');
        } catch (err: unknown) {
            console.error('Şikayet oluşturulamadı:', err);

            let errorMessage = 'Şikayet kaydedilirken bir hata oluştu.';
            if (err && typeof err === 'object') {
                const errorObj = err as Record<string, unknown>;
                if (errorObj.response && typeof errorObj.response === 'object') {
                    const response = errorObj.response as Record<string, unknown>;
                    if (response.data && typeof response.data === 'object') {
                        const data = response.data as Record<string, unknown>;
                        if (typeof data.title === 'string') {
                            errorMessage = data.title;
                        }
                    } else if (typeof response.data === 'string') {
                        errorMessage = response.data;
                    }
                }
            }

            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const canCreate = user !== null && (user.departmentId === 1 || user.departmentId === 3 || user.role === 'Admin');

    return (
        <AppLayout>
            <div className="max-w-7xl mx-auto px-2">
                <div className="mb-3 flex justify-between items-center">
                    <h1 className="text-xl font-bold text-slate-900 tracking-tight">Yeni Şikayet Kaydı</h1>
                </div>

                {error && (
                    <div className="mb-2 p-2 bg-red-50 border border-red-200 text-red-600 rounded-lg text-xs flex items-center gap-2">
                        <svg className="w-4 h-4 flex-shrink-0"fill="none"viewBox="0 0 24 24"stroke="currentColor">
                            <path strokeLinecap="round"strokeLinejoin="round"strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="font-medium">{error}</span>
                    </div>
                )}

                <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
                    <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-5">

                        {/* Bilgiler Grid */}
                        <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-4 ${!canCreate ? 'opacity-50 pointer-events-none' : ''}`}>
                            {/* Müşteri Bilgileri */}
                            <div className="space-y-1">
                                <label className="block text-[11px] font-bold text-slate-500  tracking-wider">Müşteri İsmi</label>
                                <input
                                    type="text"name="customerName" required value={formData.customerName} onChange={handleChange}
                                    className="w-full px-2 py-1.5 text-xs bg-white border-slate-400 border-2 rounded-lg focus:ring-2 focus:ring-blue-500/10 focus:border-blue-600 outline-none transition-all text-slate-900 placeholder:text-slate-400"placeholder="Müşteri..."
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="block text-[11px] font-bold text-slate-500  tracking-wider">Satış Sorumlusu</label>
                                <select
                                    name="sellerName" required value={formData.sellerName} onChange={handleChange}
                                    className="w-full px-2 py-1.5 text-xs bg-white border-slate-400 border-2 rounded-lg focus:ring-2 focus:ring-blue-500/10 focus:border-blue-600 outline-none transition-all text-slate-900"
                                >
                                    <option value="">Seçiniz...</option>
                                    {users.filter(u => u.departmentName === 'Satış' || u.departmentId === 1).map(u => (
                                        <option key={u.id} value={u.name}>{u.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-1">
                                <label className="block text-[11px] font-bold text-slate-500  tracking-wider">Proje İsmi</label>
                                <input
                                    type="text"name="projectName" required value={formData.projectName} onChange={handleChange}
                                    className="w-full px-2 py-1.5 text-xs bg-white border-slate-400 border-2 rounded-lg focus:ring-2 focus:ring-blue-500/10 focus:border-blue-600 outline-none transition-all text-slate-900"placeholder="Proje..."
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="block text-[11px] font-bold text-slate-500  tracking-wider">Lokasyon</label>
                                <input
                                    type="text"name="projectLocation" required value={formData.projectLocation} onChange={handleChange}
                                    className="w-full px-2 py-1.5 text-xs bg-white border-slate-400 border-2 rounded-lg focus:ring-2 focus:ring-blue-500/10 focus:border-blue-600 outline-none transition-all text-slate-900"placeholder="İl..."
                                />
                            </div>

                            {/* Ürün Detayları */}
                            <div className="space-y-1">
                                <label className="block text-[11px] font-bold text-slate-500  tracking-wider">Şikayet Tarihi</label>
                                <input
                                    type="date"name="complaintDate" required value={formData.complaintDate} onChange={handleChange}
                                    className="w-full px-2 py-1.5 text-xs bg-white border-slate-400 border-2 rounded-lg focus:ring-2 focus:ring-blue-500/10 focus:border-blue-600 outline-none transition-all text-slate-900"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="block text-[11px] font-bold text-slate-500  tracking-wider">Stok Kodu</label>
                                <input
                                    type="text"name="stockCode" required value={formData.stockCode} onChange={handleChange}
                                    className="w-full px-2 py-1.5 text-xs bg-white border-slate-400 border-2 rounded-lg focus:ring-2 focus:ring-blue-500/10 focus:border-blue-600 outline-none transition-all text-slate-900 font-medium"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="block text-[11px] font-bold text-slate-500  tracking-wider">Marka</label>
                                <input
                                    type="text"name="brand" value={formData.brand} onChange={handleChange}
                                    className="w-full px-2 py-1.5 text-xs bg-white border-slate-400 border-2 rounded-lg focus:ring-2 focus:ring-blue-500/10 focus:border-blue-600 outline-none transition-all text-slate-900"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="block text-[11px] font-bold text-slate-500  tracking-wider">Modül Gücü</label>
                                <input
                                    type="text"name="modulePower" value={formData.modulePower} onChange={handleChange}
                                    className="w-full px-2 py-1.5 text-xs bg-white border-slate-400 border-2 rounded-lg focus:ring-2 focus:ring-blue-500/10 focus:border-blue-600 outline-none transition-all text-slate-900"
                                />
                            </div>


                        </div>

                        {/* Alt Bölüm: Barkod ve Notlar */}
                        <div className={`grid grid-cols-1 lg:grid-cols-2 gap-8 pt-2 border-t border-slate-100 ${!canCreate ? 'opacity-50 pointer-events-none' : ''}`}>
                            <div className="space-y-2">
                                <label className="block text-[11px] font-bold text-slate-500  tracking-wider">Barkodlar</label>
                                <textarea
                                    name="barcodesInput" value={barcodesInput} onChange={handleBarcodesChange} rows={3}
                                    className="w-full px-2 py-1.5 text-xs bg-white border-slate-400 border-2 rounded-xl focus:ring-2 focus:ring-blue-500/10 focus:border-blue-600 outline-none transition-all text-slate-900 font-mono resize-none"placeholder="Barkod listesi..."
                                />
                                <div className="flex items-center gap-3 text-[10px] font-bold">
                                    <div className="bg-slate-100 text-slate-600 px-2 py-1 rounded-md">TOPLAM: {formData.barcodes?.length || 0}</div>
                                    <div className="text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-100">HSA1: {formData.hsa1 || 0}</div>
                                    <div className="text-blue-600 bg-blue-50 px-2 py-1 rounded-md border border-blue-100">HSA2: {formData.hsa2 || 0}</div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-4">
                                <div className="grid grid-cols-3 gap-3">
                                    <div className="space-y-1">
                                        <label className="block text-[11px] font-bold text-slate-500  tracking-wider">Toplam Kusurlu Ürün Miktarı </label>
                                        <input
                                            type="number"name="defectiveQuantity"required min="1" value={formData.defectiveQuantity || ''} onChange={handleChange}
                                            className="w-full px-2 py-1.5 text-xs bg-white border-slate-400 border-2 rounded-lg focus:ring-2 focus:ring-blue-500/10 focus:border-blue-600 outline-none transition-all text-slate-900 font-bold"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="block text-[11px] font-bold text-slate-500  tracking-wider">HSA1</label>
                                        <input
                                            type="number"name="hsa1"min="0" value={formData.hsa1 || 0} onChange={handleChange}
                                            className="w-full px-2 py-1.5 text-xs bg-white border-slate-400 border-2 rounded-lg focus:ring-2 focus:ring-blue-500/10 focus:border-blue-600 outline-none transition-all text-slate-900"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="block text-[11px] font-bold text-slate-500  tracking-wider">HSA2</label>
                                        <input
                                            type="number"name="hsa2"min="0" value={formData.hsa2 || 0} onChange={handleChange}
                                            className="w-full px-2 py-1.5 text-xs bg-white border-slate-400 border-2 rounded-lg focus:ring-2 focus:ring-blue-500/10 focus:border-blue-600 outline-none transition-all text-slate-900"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="block text-[11px] font-bold text-slate-500  tracking-wider">Şikayet Notu</label>
                                    <textarea
                                        name="note" value={formData.note || ''} onChange={(e) => setFormData(prev => ({ ...prev, note: e.target.value }))} rows={2}
                                        className="w-full px-2 py-1.5 text-xs bg-white border-slate-400 border-2 rounded-lg focus:ring-2 focus:ring-blue-500/10 focus:border-blue-600 outline-none transition-all text-slate-900 resize-none font-sans"placeholder="Not..."
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Alt Butonlar */}
                        <div className="flex items-center justify-end gap-4 pt-4 border-t border-slate-100">
                            <button
                                type="button"
                                onClick={() => router.push('/complaints')}
                                className="px-5 py-2 text-xs font-bold text-slate-400 hover:text-slate-600  tracking-widest transition-colors"
                            >
                                Vazgeç
                            </button>
                            <button
                                type="submit"
                                disabled={loading || !canCreate}
                                className="px-10 py-3 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 active:scale-[0.98] rounded-xl transition-all shadow-lg shadow-blue-500/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2  tracking-wide"
                            >
                                {loading ? 'KAYDEDİLİYOR...' : 'ŞİKAYETİ KAYDET'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </AppLayout>
    );
}
