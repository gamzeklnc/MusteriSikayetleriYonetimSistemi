'use client';

import { useEffect, useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { complaintService } from '@/services/complaintService';
import { productionCountService } from '@/services/productionCountService';
import { DashboardStats } from '@/types/complaint';
import { 
    BarChart3, FileText, CheckCircle2, Clock, AlertCircle, 
    TrendingUp, RefreshCw 
} from 'lucide-react';

export default function DashboardPage() {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [startDate, setStartDate] = useState<string>('');
    const [endDate, setEndDate] = useState<string>('');
    const [totalProductionCount, setTotalProductionCount] = useState<number>(0);

    const fetchStats = async (start?: string, end?: string) => {
        try {
            setLoading(true);
            const data = await complaintService.getDashboardStats(start || undefined, end || undefined);
            setStats(data);
        } catch (error) {
            console.error('İstatistikler yüklenemedi:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchProductionCounts = async () => {
        try {
            const data = await productionCountService.getAll();
            const total = data.reduce((sum, item) => sum + item.count, 0);
            setTotalProductionCount(total);
        } catch (error) {
            console.error('Üretim adetleri yüklenemedi:', error);
        }
    };

    useEffect(() => {
        fetchStats(startDate, endDate);
    }, [startDate, endDate]);

    useEffect(() => {
        fetchProductionCounts();
    }, []);

    const justifiedRatio = totalProductionCount > 0 
        ? ((stats?.totalJustifiedProducts || 0) / totalProductionCount) * 100 
        : 0;

    const topMetrics = [
        { 
            label: 'Toplam Şikayet', 
            value: stats?.totalComplaints || 0, 
            icon: <FileText className="w-5 h-5 text-blue-600" />,
            color: 'bg-blue-50 border-blue-100'
        },
        { 
            label: 'Açık Şikayetler', 
            value: stats?.openComplaints || 0, 
            icon: <Clock className="w-5 h-5 text-amber-600" />,
            color: 'bg-amber-50 border-amber-100'
        },
        { 
            label: 'Kapalı Şikayetler', 
            value: stats?.closedComplaints || 0, 
            icon: <CheckCircle2 className="w-5 h-5 text-slate-600" />,
            color: 'bg-slate-50 border-slate-100'
        },
        { 
            label: 'Haklılık Oranı', 
            value: `%${justifiedRatio.toFixed(4)}`, 
            icon: <TrendingUp className="w-5 h-5 text-emerald-600" />,
            color: 'bg-emerald-50 border-emerald-100'
        },
        { 
            label: 'Haklı Ürün', 
            value: stats?.totalJustifiedProducts || 0, 
            icon: <CheckCircle2 className="w-5 h-5 text-emerald-500" />,
            color: 'bg-emerald-50 border-emerald-100'
        },
        { 
            label: 'Haksız Ürün', 
            value: stats?.totalUnjustifiedProducts || 0, 
            icon: <AlertCircle className="w-5 h-5 text-red-500" />,
            color: 'bg-red-50 border-red-100'
        },
    ];

    if (loading && !stats) {
        return (
            <AppLayout>
                <div className="flex items-center justify-center min-h-[400px]">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Dashboard</h1>
                        <p className="text-slate-500 text-sm mt-1">Sistem genelindeki şikayet istatistikleri ve KPI takibi.</p>
                    </div>
                    
                    <div className="flex items-center gap-3">
                        <div className="hidden md:flex items-center gap-4">
                            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Başlangıç</span>
                                <input 
                                    type="date" 
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="text-xs font-bold text-slate-700 outline-none bg-transparent"
                                />
                            </div>
                            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Bitiş</span>
                                <input 
                                    type="date" 
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="text-xs font-bold text-slate-700 outline-none bg-transparent"
                                />
                            </div>
                        </div>

                        <button 
                            onClick={() => {
                                setStartDate('');
                                setEndDate('');
                                fetchStats();
                            }}
                            disabled={loading}
                            className="p-2 text-slate-500 hover:text-blue-600 hover:bg-white bg-slate-50 border border-slate-100 rounded-xl transition-all disabled:opacity-50 shadow-sm"
                            title="Filtreleri Temizle & Yenile"
                        >
                            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                        </button>
                    </div>
                </div>

                {/* Dashboard Grid (4 Quads) */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-[calc(100vh-250px)]">
                    {/* Top-Left: Metrics Grid */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
                        <div className="grid grid-cols-3 grid-rows-2 gap-4 flex-1">
                            {topMetrics.map((metric) => (
                                <div key={metric.label} className={`p-4 rounded-xl border ${metric.color} flex flex-col justify-between shadow-sm transition-all hover:shadow-md`}>
                                    <div className="flex items-center justify-between">
                                        <span className="p-1.5 bg-white rounded-lg shadow-sm">{metric.icon}</span>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider line-clamp-1">{metric.label}</p>
                                        <p className="text-2xl font-black text-slate-900 mt-1">{metric.value}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Top-Right: Placeholder */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-center min-h-[350px]">
                        <div className="text-center text-slate-400">
                            <BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-20" />
                            <p className="text-sm font-medium">Grafik Alanı (Sağ Üst)</p>
                        </div>
                    </div>

                    {/* Bottom-Left: Placeholder */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-center min-h-[350px]">
                        <div className="text-center text-slate-400">
                            <TrendingUp className="w-12 h-12 mx-auto mb-2 opacity-20" />
                            <p className="text-sm font-medium">Grafik Alanı (Sol Alt)</p>
                        </div>
                    </div>

                    {/* Bottom-Right: Placeholder */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-center min-h-[350px]">
                        <div className="text-center text-slate-400">
                            <FileText className="w-12 h-12 mx-auto mb-2 opacity-20" />
                            <p className="text-sm font-medium">Grafik Alanı (Sağ Alt)</p>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}