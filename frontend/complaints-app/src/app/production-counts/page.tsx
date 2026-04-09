'use client';

import { useEffect, useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { productionCountService, ProductionCountDto, CreateProductionCountDto } from '@/services/productionCountService';
import { Factory, Plus, Trash2, Save, CalendarDays, TrendingUp, BarChart3 } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

const MONTH_NAMES = [
    'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
    'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
];

export default function ProductionCountsPage() {
    const { user } = useAuthStore();
    const isKG = user?.departmentId === 3;
    const isAdmin = user?.role === 'Admin';
    const canSubmitAny = isKG || isAdmin;

    const [records, setRecords] = useState<ProductionCountDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

    // Form state
    const currentDate = new Date();
    const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
    const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
    const [productionCount, setProductionCount] = useState('');

    // Filter state
    const [filterYear, setFilterYear] = useState<string>('');

    const fetchRecords = async () => {
        try {
            setLoading(true);
            const data = await productionCountService.getAll();
            setRecords(data);
        } catch (err) {
            console.error('Üretim sayıları yüklenemedi:', err);
            setError('Üretim sayıları yüklenirken bir hata oluştu.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRecords();
    }, []);

    // Auto-clear messages
    useEffect(() => {
        if (success) {
            const timer = setTimeout(() => setSuccess(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [success]);

    useEffect(() => {
        if (error) {
            const timer = setTimeout(() => setError(null), 5000);
            return () => clearTimeout(timer);
        }
    }, [error]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const count = parseInt(productionCount);
        if (isNaN(count) || count < 0) {
            setError('Lütfen geçerli bir üretim sayısı girin.');
            return;
        }

        const dto: CreateProductionCountDto = {
            year: selectedYear,
            month: selectedMonth,
            count: count,
        };

        try {
            setSaving(true);
            setError(null);
            
            // Check if record exists BEFORE saving to determines the success message
            const existsBefore = records.some(r => Number(r.year) === Number(selectedYear) && Number(r.month) === Number(selectedMonth));
            
            await productionCountService.create(dto);

            if (existsBefore) {
                setSuccess(`${selectedYear} ${MONTH_NAMES[selectedMonth - 1]} üretim sayısı güncellendi: ${count.toLocaleString('tr-TR')}`);
            } else {
                setSuccess(`${selectedYear} ${MONTH_NAMES[selectedMonth - 1]} üretim sayısı kaydedildi: ${count.toLocaleString('tr-TR')}`);
            }

            // Reset production count input
            setProductionCount('');
            
            // Increment month automatically for next entry
            if (selectedMonth === 12) {
                setSelectedMonth(1);
                setSelectedYear(prev => prev + 1);
            } else {
                setSelectedMonth(prev => prev + 1);
            }

            await fetchRecords();
        } catch (err: unknown) {
            console.error('Kayıt hatası:', err);
            const errorMessage = (err as { response?: { data?: string } })?.response?.data;
            setError(typeof errorMessage === 'string' ? errorMessage : 'Kayıt sırasında bir hata oluştu.');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: number) => {
        try {
            await productionCountService.delete(id);
            setSuccess('Kayıt başarıyla silindi.');
            setDeleteConfirmId(null);
            await fetchRecords();
        } catch (err) {
            console.error('Silme hatası:', err);
            setError('Kayıt silinirken bir hata oluştu.');
        }
    };

    // Generate year options (2020 to current year + 2)
    const yearOptions = [];
    for (let y = 2020; y <= currentDate.getFullYear() + 2; y++) {
        yearOptions.push(y);
    }

    // Filtered records
    const filteredRecords = filterYear
        ? records.filter(r => r.year === parseInt(filterYear))
        : records;

    // Stats
    const totalProduction = filteredRecords.reduce((sum, r) => sum + r.count, 0);
    const avgProduction = filteredRecords.length > 0 ? Math.round(totalProduction / filteredRecords.length) : 0;
    const maxRecord = filteredRecords.length > 0
        ? filteredRecords.reduce((max, r) => r.count > max.count ? r : max, filteredRecords[0])
        : null;

    return (
        <AppLayout>
            <div className="space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl text-white shadow-lg shadow-violet-500/20">
                            <Factory size={22} />
                        </div>
                        Üretim Adetleri
                    </h1>
                    <p className="text-slate-500 font-medium text-sm mt-1 ml-12">Aylık üretim adetlerini girin ve takip edin.</p>
                </div>

                {/* Alerts */}
                {success && (
                    <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl animate-fade-in">
                        <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <span className="text-sm font-semibold">{success}</span>
                    </div>
                )}
                {error && (
                    <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl animate-fade-in">
                        <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <svg className="w-4 h-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </div>
                        <span className="text-sm font-semibold">{error}</span>
                    </div>
                )}

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="p-2 bg-blue-50 rounded-lg">
                                <BarChart3 size={18} className="text-blue-600" />
                            </div>
                            <span className="text-xs font-bold text-slate-400 tracking-widest uppercase">Toplam Üretim</span>
                        </div>
                        <p className="text-2xl font-bold text-slate-800">{totalProduction.toLocaleString('tr-TR')}</p>
                        <p className="text-xs text-slate-400 mt-1">{filteredRecords.length} aylık kayıt</p>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="p-2 bg-violet-50 rounded-lg">
                                <TrendingUp size={18} className="text-violet-600" />
                            </div>
                            <span className="text-xs font-bold text-slate-400 tracking-widest uppercase">Aylık Ortalama</span>
                        </div>
                        <p className="text-2xl font-bold text-slate-800">{avgProduction.toLocaleString('tr-TR')}</p>
                        <p className="text-xs text-slate-400 mt-1">adet / ay</p>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="p-2 bg-amber-50 rounded-lg">
                                <CalendarDays size={18} className="text-amber-600" />
                            </div>
                            <span className="text-xs font-bold text-slate-400 tracking-widest uppercase">En Yüksek Ay</span>
                        </div>
                        {maxRecord ? (
                            <>
                                <p className="text-2xl font-bold text-slate-800">{maxRecord.count.toLocaleString('tr-TR')}</p>
                                <p className="text-xs text-slate-400 mt-1">{MONTH_NAMES[maxRecord.month - 1]} {maxRecord.year}</p>
                            </>
                        ) : (
                            <p className="text-2xl font-bold text-slate-300">—</p>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Entry Form */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className="px-6 py-4 bg-gradient-to-r from-violet-600 to-purple-600">
                                <h2 className="text-white font-bold text-sm flex items-center gap-2">
                                    <Plus size={16} />
                                    Üretim Sayısı Girişi
                                </h2>
                                <p className="text-violet-200 text-xs mt-0.5">Yıl ve ay seçerek üretim adedini girin</p>
                            </div>

                            <form onSubmit={handleSubmit} className="p-6 space-y-5">
                                {/* Year */}
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 mb-1.5 tracking-wide">
                                        Yıl
                                    </label>
                                    <select
                                        value={selectedYear}
                                        onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none transition-all"
                                    >
                                        {yearOptions.map(y => (
                                            <option key={y} value={y}>{y}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Month */}
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 mb-1.5 tracking-wide">
                                        Ay
                                    </label>
                                    <select
                                        value={selectedMonth}
                                        onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none transition-all"
                                    >
                                        {MONTH_NAMES.map((name, idx) => (
                                            <option key={idx + 1} value={idx + 1}>{name}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Production Count */}
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 mb-1.5 tracking-wide">
                                        Üretim Adedi
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={productionCount}
                                        onChange={(e) => setProductionCount(e.target.value)}
                                        placeholder="Örn: 22900"
                                        required
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none transition-all"
                                    />
                                </div>

                                {/* Existing record warning */}
                                {(() => {
                                    const existing = records.find(r => Number(r.year) === Number(selectedYear) && Number(r.month) === Number(selectedMonth));
                                    if (!existing) return null;
                                    
                                    return (
                                        <div className="flex flex-col gap-2">
                                            <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl animate-fade-in">
                                                <svg className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                                </svg>
                                                <div>
                                                    <p className="text-xs font-semibold text-amber-700">Bu ay için zaten kayıt mevcut</p>
                                                    <p className="text-[10px] text-amber-600 mt-0.5">
                                                        Mevcut değer: <strong>{existing.count.toLocaleString('tr-TR')}</strong> {isAdmin ? '— Kaydettiğinizde güncellenecektir.' : ''}
                                                    </p>
                                                </div>
                                            </div>
                                            {!isAdmin && (
                                                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-[10px] font-bold text-red-700">
                                                    Daha önceden girilmiş geçmiş ay kayıtlarını güncellemeyi yalnızca IT/Admin yapabilir.
                                                </div>
                                            )}
                                        </div>
                                    );
                                })()}

                                {/* Submit */}
                                {(() => {
                                    const existing = records.find(r => Number(r.year) === Number(selectedYear) && Number(r.month) === Number(selectedMonth));
                                    const disabled = saving || !productionCount || !canSubmitAny || (!!existing && !isAdmin);
                                    
                                    return (
                                        <button
                                            type="submit"
                                            disabled={disabled}
                                            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-violet-600 to-purple-600 text-white text-sm font-bold rounded-xl hover:from-violet-700 hover:to-purple-700 transition-all shadow-lg shadow-violet-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                    {saving ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                            Kaydediliyor...
                                        </>
                                    ) : (
                                        <>
                                            <Save size={16} />
                                            Kaydet
                                        </>
                                    )}
                                        </button>
                                    );
                                })()}
                            </form>
                        </div>
                    </div>

                    {/* Records Table */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                                <div>
                                    <h2 className="text-sm font-bold text-slate-800">Aylık Üretim Adetleri</h2>
                                    <p className="text-xs text-slate-400 mt-0.5">{filteredRecords.length} kayıt listeleniyor</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <label className="text-xs font-semibold text-slate-500">Yıl Filtresi:</label>
                                    <select
                                        value={filterYear}
                                        onChange={(e) => setFilterYear(e.target.value)}
                                        className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none"
                                    >
                                        <option value="">Tümü</option>
                                        {[...new Set(records.map(r => r.year))].sort((a, b) => b - a).map(y => (
                                            <option key={y} value={y}>{y}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-slate-50 text-[10px] font-bold text-slate-500 border-b border-slate-200 tracking-wider uppercase">
                                        <tr>
                                            <th className="px-6 py-3">Yıl</th>
                                            <th className="px-6 py-3">Ay</th>
                                            <th className="px-6 py-3 text-right">Üretim Adedi</th>
                                            <th className="px-6 py-3 text-right">Kayıt Tarihi</th>
                                            <th className="px-6 py-3 text-right">İşlem</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {loading ? (
                                            <tr>
                                                <td colSpan={5} className="px-6 py-16 text-center">
                                                    <div className="flex flex-col items-center justify-center text-slate-400">
                                                        <div className="w-10 h-10 border-4 border-violet-600/20 border-t-violet-600 rounded-full animate-spin mb-4"></div>
                                                        <span className="text-xs font-bold tracking-widest">Veriler yükleniyor...</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : filteredRecords.length === 0 ? (
                                            <tr>
                                                <td colSpan={5} className="px-6 py-16 text-center">
                                                    <div className="flex flex-col items-center justify-center">
                                                        <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
                                                            <Factory size={28} className="text-slate-300" />
                                                        </div>
                                                        <p className="text-sm font-semibold text-slate-400">Henüz kayıt bulunmuyor</p>
                                                        <p className="text-xs text-slate-300 mt-1">Soldaki formu kullanarak üretim sayısı ekleyin</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredRecords.map((record) => (
                                                <tr key={record.id} className="hover:bg-violet-50/30 transition-colors group">
                                                    <td className="px-6 py-3.5">
                                                        <span className="inline-flex items-center px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs font-bold">
                                                            {record.year}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-3.5">
                                                        <span className="text-sm font-semibold text-slate-700">
                                                            {MONTH_NAMES[record.month - 1]}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-3.5 text-right">
                                                        <span className="text-sm font-bold text-violet-700 bg-violet-50 px-3 py-1 rounded-lg">
                                                            {record.count.toLocaleString('tr-TR')}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-3.5 text-right text-xs text-slate-400">
                                                        {new Date(record.createdAt).toLocaleDateString('tr-TR', {
                                                            year: 'numeric',
                                                            month: '2-digit',
                                                            day: '2-digit',
                                                            hour: '2-digit',
                                                            minute: '2-digit'
                                                        })}
                                                    </td>
                                                    <td className="px-6 py-3.5 text-right">
                                                        {isAdmin ? (
                                                            deleteConfirmId === record.id ? (
                                                                <div className="flex items-center justify-end gap-2">
                                                                    <button
                                                                        onClick={() => handleDelete(record.id)}
                                                                        className="px-3 py-1.5 bg-red-600 text-white text-[10px] font-bold rounded-lg hover:bg-red-700 transition-colors"
                                                                    >
                                                                        Evet, Sil
                                                                    </button>
                                                                    <button
                                                                        onClick={() => setDeleteConfirmId(null)}
                                                                        className="px-3 py-1.5 bg-slate-100 text-slate-600 text-[10px] font-bold rounded-lg hover:bg-slate-200 transition-colors"
                                                                    >
                                                                        İptal
                                                                    </button>
                                                                </div>
                                                            ) : (
                                                                <button
                                                                    onClick={() => setDeleteConfirmId(record.id)}
                                                                    className="opacity-0 group-hover:opacity-100 p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                                                    title="Sil"
                                                                >
                                                                    <Trash2 size={14} />
                                                                </button>
                                                            )
                                                        ) : (
                                                            <span className="text-slate-300">-</span>
                                                        )}
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
        </AppLayout>
    );
}
