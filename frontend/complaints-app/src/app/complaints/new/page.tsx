'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AppLayout from '@/components/layout/AppLayout';
import { complaintService } from '@/services/complaintService';
import { departmentService } from '@/services/departmentService';
import { CreateComplaintRequest } from '@/types/complaint';
import { Department } from '@/types/department';

export default function NewComplaintPage() {
    const router = useRouter();
    const [departments, setDepartments] = useState<Department[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [formData, setFormData] = useState<CreateComplaintRequest>({
        currentDepartmentId: 0,
        customerName: '',
        projectName: '',
        projectLocation: '',
        complaintDate: new Date().toISOString().split('T')[0],
        stockCode: '',
        defectiveQuantity: 0,
        brand: '',
        hsa1: undefined,
        hsa2: undefined,
        modulePower: '',
        productionDate: '',
        errorDefinition: '',
        isValidComplaint: undefined
    });

    useEffect(() => {
        const fetchDepartments = async () => {
            try {
                const deps = await departmentService.getAll();
                setDepartments(deps);
                if (deps.length > 0) {
                    setFormData(prev => ({ ...prev, currentDepartmentId: deps[0].id }));
                }
            } catch (err) {
                console.error('Departmanlar yüklenemedi:', err);
                setError('Departman bilgileri yüklenirken bir hata oluştu.');
            }
        };
        fetchDepartments();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;

        let parsedValue: any = value;
        if (type === 'number') {
            parsedValue = value === '' ? undefined : Number(value);
        } else if (name === 'isValidComplaint') {
            parsedValue = value === 'true' ? true : value === 'false' ? false : undefined;
        }

        setFormData(prev => ({
            ...prev,
            [name]: parsedValue
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
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
            <div className="max-w-4xl mx-auto">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-slate-800">Yeni Şikayet Kaydı</h1>
                    <p className="text-slate-500 text-sm mt-1">Müşteri şikayetini detaylarıyla birlikte sisteme kaydedin.</p>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
                        {error}
                    </div>
                )}

                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-8">

                        {/* 1. Müşteri ve Proje Bilgileri */}
                        <section>
                            <h2 className="text-lg font-semibold text-slate-800 border-b border-slate-200 pb-2 mb-4">
                                Müşteri ve Proje Bilgileri
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Müşteri İsmi <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="customerName"
                                        required
                                        value={formData.customerName}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 text-black bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                        placeholder="Örn: ABC A.Ş."
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Proje İsmi <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="projectName"
                                        required
                                        value={formData.projectName}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 text-black bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                        placeholder="Örn: GES Projesi Faz-1"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Proje Lokasyonu (İl) <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="projectLocation"
                                        required
                                        value={formData.projectLocation}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 text-black bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                        placeholder="Örn: Ankara"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Şikayet Tarihi <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="date"
                                        name="complaintDate"
                                        required
                                        value={formData.complaintDate}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 text-black bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                    />
                                </div>
                            </div>
                        </section>

                        {/* 2. Ürün ve Şikayet Detayları */}
                        <section>
                            <h2 className="text-lg font-semibold text-slate-800 border-b border-slate-200 pb-2 mb-4">
                                Ürün Detayları
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Stok Kodu <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="stockCode"
                                        required
                                        value={formData.stockCode}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 text-black bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                        placeholder="Örn: STK-001"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Kusurlu Ürün Miktarı <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        name="defectiveQuantity"
                                        required
                                        min="1"
                                        value={formData.defectiveQuantity || ''}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 text-black bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                        placeholder="Örn: 5"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Marka <span className="text-slate-400 font-normal text-xs ml-1">(Opsiyonel)</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="brand"
                                        value={formData.brand || ''}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 text-black bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Modül Gücü <span className="text-slate-400 font-normal text-xs ml-1">(Opsiyonel)</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="modulePower"
                                        value={formData.modulePower || ''}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 text-black bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                        placeholder="Örn: 400W"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Ürün Üretim Tarihi <span className="text-slate-400 font-normal text-xs ml-1">(Opsiyonel)</span>
                                    </label>
                                    <input
                                        type="date"
                                        name="productionDate"
                                        value={formData.productionDate || ''}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 text-black bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                    />
                                </div>
                            </div>
                        </section>

                        {/* 3. Operasyonel & Hata Detayları */}
                        <section>
                            <h2 className="text-lg font-semibold text-slate-800 border-b border-slate-200 pb-2 mb-4">
                                Süreç ve Hata Değerlendirmesi
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Bekleyen Departman <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        name="currentDepartmentId"
                                        required
                                        value={formData.currentDepartmentId}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 text-black bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                    >
                                        <option value={0} disabled>Departman Seçin</option>
                                        {departments.map(dept => (
                                            <option key={dept.id} value={dept.id}>
                                                {dept.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Hata Tanımı <span className="text-slate-400 font-normal text-xs ml-1">(Opsiyonel)</span>
                                    </label>
                                    <select
                                        name="errorDefinition"
                                        value={formData.errorDefinition || ''}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 text-black bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                    >
                                        <option value="" disabled>Seçiniz</option>
                                        <option value="Busbar Lehim Hatası">Busbar Lehim Hatası</option>
                                        <option value="Cam Çiziği">Cam Çiziği</option>
                                        <option value="Cam Kirliliği">Cam Kirliliği</option>
                                        <option value="Çerçeve Köşe Açıklığı">Çerçeve Köşe Açıklığı</option>
                                        <option value="Diyot Hatası">Diyot Hatası</option>
                                        <option value="EL hatası">EL hatası</option>
                                        <option value="Etiket Hatası">Etiket Hatası</option>
                                        <option value="EVA Lekesi">EVA Lekesi</option>
                                        <option value="Finger Kırığı">Finger Kırığı</option>
                                        <option value="Gökkuşağı">Gökkuşağı</option>
                                        <option value="Güç Hatası">Güç Hatası</option>
                                        <option value="Hava Kabarcığı">Hava Kabarcığı</option>
                                        <option value="J.B Lehim Hatası">J.B Lehim Hatası</option>
                                        <option value="Kırık Cam">Kırık Cam</option>
                                        <option value="Konnektör Hatası">Konnektör Hatası</option>
                                        <option value="Mikro Kırık">Mikro Kırık</option>
                                        <option value="Ribon Kayması">Ribon Kayması</option>
                                        <option value="Sehim">Sehim</option>
                                        <option value="Silikon Hatası">Silikon Hatası</option>
                                        <option value="String Ara Mesafe">String Ara Mesafe</option>
                                        <option value="Toz tutma">Toz tutma</option>
                                        <option value="Yabancı Madde">Yabancı Madde</option>
                                        <option value="Yanma">Yanma</option>
                                    </select>
                                </div>
                            </div>
                        </section>

                        {/* Submit Actions */}
                        <div className="flex items-center justify-end gap-4 pt-4 border-t border-slate-200 mt-8">
                            <button
                                type="button"
                                onClick={() => router.push('/complaints')}
                                className="px-6 py-2.5 text-sm font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors border border-transparent hover:border-slate-200"
                            >
                                İptal
                            </button>
                            <button
                                type="submit"
                                disabled={loading || formData.currentDepartmentId === 0}
                                className="px-6 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {loading && (
                                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                )}
                                Şikayeti Kaydet
                            </button>
                        </div>

                    </form>
                </div>
            </div>
        </AppLayout>
    );
}
