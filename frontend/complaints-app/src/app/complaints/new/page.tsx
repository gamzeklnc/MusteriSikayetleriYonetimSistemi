'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import AppLayout from '@/components/layout/AppLayout';
import { complaintService } from '@/services/complaintService';
import { CreateComplaintRequest } from '@/types/complaint';
import { aggregateBarcodes } from '@/utils/barcodeParser';

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
        sellerName: 'Mehmet Aybaş',
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
            barcodes: aggregated.barcodes,
            hsa1: aggregated.hsa1Count,
            hsa2: aggregated.hsa2Count
        }));
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        let parsedValue: string | number | undefined = value;

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
                                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Satıcı</label>
                                <select
                                    name="sellerName"
                                    required
                                    value={formData.sellerName}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-black"
                                >
                                    <option value="Mehmet Aybaş">Mehmet Aybaş</option>
                                    <option value="Görkem Çam">Görkem Çam</option>
                                </select>
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

                            <div className="md:col-span-2">
                                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                                    Barkodlar (Kopyala/Yapıştır - Alt alta veya virgülle ayrılmış)
                                </label>
                                <textarea
                                    name="barcodesInput"
                                    value={barcodesInput}
                                    onChange={handleBarcodesChange}
                                    rows={4}
                                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-black placeholder:text-slate-300 font-mono text-sm"
                                    placeholder="2490108MC2023041&#10;2490108BW0023041&#10;E4FXT325H129990048205538"
                                />
                                <div className="mt-2 flex items-center justify-between text-xs text-slate-500 font-medium">
                                    <span>Toplam Okunan: {formData.barcodes?.length || 0}</span>
                                    <div className="flex items-center gap-4">
                                        <span className="bg-green-100 text-green-700 px-2 py-1 rounded">HSA1: {formData.hsa1 || 0}</span>
                                        <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded">HSA2: {formData.hsa2 || 0}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Kusurlu Ürün Miktarı ayrı kalabilir veya Barkod sayısı ile senkronize edilebilir, şimdilik ayrı tutuyoruz ancak kullanıcıdan hatalı giriş olmasın. */}
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

                            <div className="md:col-span-2 border-t border-slate-100 my-2" />

                            <div>
                                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">HSA1 Sayısı</label>
                                <input
                                    type="number"
                                    name="hsa1"
                                    min="0"
                                    value={formData.hsa1 || 0}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-black"
                                    placeholder="Manuel girilebilir veya barkoddan okunur"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">HSA2 Sayısı</label>
                                <input
                                    type="number"
                                    name="hsa2"
                                    min="0"
                                    value={formData.hsa2 || 0}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-black"
                                    placeholder="Manuel girilebilir veya barkoddan okunur"
                                />
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Şikayet Notu (İsteğe Bağlı)</label>
                                <textarea
                                    name="note"
                                    value={formData.note || ''}
                                    onChange={(e) => setFormData(prev => ({ ...prev, note: e.target.value }))}
                                    rows={3}
                                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-black placeholder:text-slate-300 text-sm"
                                    placeholder="Şikayeti açarken eklemek istediğiniz ilk not/açıklama..."
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
