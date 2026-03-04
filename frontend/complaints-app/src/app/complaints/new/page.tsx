'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import AppLayout from '@/components/layout/AppLayout';
import { complaintService } from '@/services/complaintService';
import { CreateComplaintRequest } from '@/types/complaint';

export default function NewComplaintPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Otomatik dolan alanlar (Örnek eşleme)
    const stockCodeMapping: Record<string, { brand: string, modulePower: string }> = {
        'EL-450': { brand: 'Elin', modulePower: '450W' },
        'EL-550': { brand: 'Elin', modulePower: '550W' },
        'CW-550': { brand: 'CW Enerji', modulePower: '550W' },
        'CW-450': { brand: 'CW Enerji', modulePower: '450W' },
    };

    const [formData, setFormData] = useState<CreateComplaintRequest & { brand?: string, modulePower?: string }>({
        customerName: '',
        projectName: '',
        projectLocation: '',
        complaintDate: new Date().toISOString().split('T')[0],
        stockCode: '',
        defectiveQuantity: 0,
        hsa1: undefined,
        hsa2: undefined,
        brand: '',
        modulePower: ''
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        let parsedValue: any = value;

        if (type === 'number') {
            parsedValue = value === '' ? undefined : Number(value);
        }

        const newFormData = { ...formData, [name]: parsedValue };

        // Stok Kodu bazlı otomatik dolum simülasyonu
        if (name === 'stockCode') {
            const info = stockCodeMapping[value.toUpperCase()];
            if (info) {
                newFormData.brand = info.brand;
                newFormData.modulePower = info.modulePower;
            } else if (value === '') {
                newFormData.brand = '';
                newFormData.modulePower = '';
            }
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
        } catch (err: any) {
            console.error('Şikayet oluşturulamadı:', err);
            setError(err.response?.data?.title || err.response?.data || 'Şikayet kaydedilirken bir hata oluştu.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <AppLayout>
            <div className="max-w-3xl mx-auto py-8">
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Yeni Şikayet Kaydı</h1>
                    <p className="text-slate-500 text-sm mt-1">Lütfen aşağıdaki şikayet bilgilerini eksiksiz doldurun.</p>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm flex items-center gap-3">
                        <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {error}
                    </div>
                )}

                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <form onSubmit={handleSubmit} className="p-8 space-y-8">

                        {/* Manuel Giriş Alanları */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">

                            <div>
                                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Müşteri İsmi</label>
                                <input
                                    type="text"
                                    name="customerName"
                                    required
                                    value={formData.customerName}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-black placeholder:text-slate-300"
                                    placeholder="Müşteri adını girin..."
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Proje İsmi</label>
                                <input
                                    type="text"
                                    name="projectName"
                                    required
                                    value={formData.projectName}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-black placeholder:text-slate-300"
                                    placeholder="Proje adını girin..."
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Proje Lokasyonu (İl)</label>
                                <input
                                    type="text"
                                    name="projectLocation"
                                    required
                                    value={formData.projectLocation}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-black placeholder:text-slate-300"
                                    placeholder="İl bilgisi..."
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Şikayet Tarihi</label>
                                <input
                                    type="date"
                                    name="complaintDate"
                                    required
                                    value={formData.complaintDate}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-black"
                                />
                            </div>

                            <div className="border-t border-slate-100 md:col-span-2 my-2" />

                            <div>
                                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Stok Kodu</label>
                                <input
                                    type="text"
                                    name="stockCode"
                                    required
                                    value={formData.stockCode}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-black placeholder:text-slate-300"
                                    placeholder="Örn: EL-450"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Marka</label>
                                <input
                                    type="text"
                                    name="brand"
                                    value={formData.brand}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-black placeholder:text-slate-300"
                                    placeholder="Marka girin veya stok kodundan gelsin..."
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Modül Gücü</label>
                                <input
                                    type="text"
                                    name="modulePower"
                                    value={formData.modulePower}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-black placeholder:text-slate-300"
                                    placeholder="Güç girin veya stok kodundan gelsin..."
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Kusurlu Ürün Miktarı</label>
                                <input
                                    type="number"
                                    name="defectiveQuantity"
                                    required
                                    min="1"
                                    value={formData.defectiveQuantity || ''}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-black placeholder:text-slate-300"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2 uppercase">Hsa1 (Barkod Sayılan)</label>
                                <input
                                    type="number"
                                    name="hsa1"
                                    value={formData.hsa1 || ''}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-black placeholder:text-slate-300"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2 uppercase">Hsa2 (Barkod Sayılan)</label>
                                <input
                                    type="number"
                                    name="hsa2"
                                    value={formData.hsa2 || ''}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-black placeholder:text-slate-300"
                                />
                            </div>
                        </div>

                        {/* Submit Actions */}
                        <div className="flex items-center justify-end gap-4 pt-8 border-t border-slate-100">
                            <button
                                type="button"
                                onClick={() => router.push('/complaints')}
                                className="px-6 py-3 text-sm font-bold text-slate-400 hover:text-slate-600 transition-colors"
                            >
                                VAZGEÇ
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-8 py-3 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3 uppercase tracking-wider"
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
