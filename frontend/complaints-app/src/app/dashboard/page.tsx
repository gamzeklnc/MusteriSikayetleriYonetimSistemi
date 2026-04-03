'use client';

import { useEffect, useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { complaintService } from '@/services/complaintService';
import { productionCountService } from '@/services/productionCountService';
import { DashboardStats, JustificationChartData } from '@/types/complaint';
import { 
    BarChart3, FileText, CheckCircle2, Clock, AlertCircle, 
    TrendingUp, RefreshCw 
} from 'lucide-react';

function JustificationRateChart({ data }: { data: JustificationChartData }) {
    const chartItems = [
        { label: '1. ALTI AY', value: data.firstHalfRate, color: 'from-blue-500 to-indigo-600' },
        { label: '2. ALTI AY', value: data.secondHalfRate, color: 'from-indigo-400 to-indigo-600' },
        { label: 'KÜMÜLATİF', value: data.cumulativeRate, color: 'from-emerald-500 to-teal-600' }
    ];

    // Determine the max scale dynamically
    const maxVal = Math.max(...chartItems.map(i => i.value));
    let chartMax = 1;

    if (maxVal < 0.1) {
        chartMax = 0.1;
    } else if (maxVal < 1) {
        chartMax = 1;
    } else if (maxVal < 5) {
        chartMax = 5;
    } else if (maxVal < 10) {
        chartMax = 10;
    } else {
        // For higher values, round up to the nearest 10 or 20
        chartMax = Math.ceil(maxVal / 10) * 10;
    }

    // Generate 5 dynamic steps for the Y-Axis
    const gridSteps = Array.from({ length: 6 }, (_, i) => (chartMax / 5) * i);

    return (
        <div className="w-full h-full flex flex-col">
            <div className="flex items-center justify-between mb-10">
                <div className="flex flex-col gap-0.5">
                    <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
                        <BarChart3 className="w-4 h-4 text-blue-600" />
                        Haklılık Oranı (%)
                    </h3>
                    <p className="text-[10px] text-slate-400 font-bold pl-6 uppercase">Performans Grafiği</p>
                </div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">
                    {new Date().getFullYear()} DURUMU
                </span>
            </div>
            
            <div className="flex-1 flex gap-4 relative">
                {/* Y-Axis Labels & Vertical Axis */}
                <div className="flex flex-col justify-between h-full pb-10 pr-3 border-r-2 border-slate-200 min-w-[45px]">
                    {[...gridSteps].reverse().map((step, idx) => (
                        <span key={idx} className="text-[10px] font-black text-slate-500 text-right leading-none">
                            {chartMax <= 1 ? step.toFixed(2) : Math.round(step)}%
                        </span>
                    ))}
                </div>

                {/* Chart Area */}
                <div className="flex-1 relative flex items-end justify-around pb-10">
                    {/* Grid Lines */}
                    <div className="absolute inset-0 pb-10 flex flex-col justify-between pointer-events-none">
                        {gridSteps.reverse().map((step, idx) => (
                            <div key={idx} className={`w-full border-t ${step === 0 ? 'border-transparent' : 'border-slate-100'} border-dashed`} />
                        ))}
                    </div>

                    {/* Bars */}
                    {chartItems.map((item) => {
                        const heightPercent = (item.value / chartMax) * 100;
                        return (
                            <div key={item.label} className="z-10 flex-1 flex flex-col items-center group relative h-full justify-end">
                                {/* Percentage Label */}
                                <div className="absolute transition-all duration-300 group-hover:-translate-y-2" style={{ bottom: `calc(${Math.max(heightPercent, 2)}% + 15px)` }}>
                                    <span className="text-[10px] font-black text-slate-700 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-md border border-slate-200 shadow-sm whitespace-nowrap">
                                        %{item.value.toFixed(4)}
                                    </span>
                                </div>
                                
                                {/* Bar Body */}
                                <div 
                                    className={`w-full max-w-[60px] rounded-t-xl bg-gradient-to-t ${item.color} shadow-lg transition-all duration-1000 ease-in-out relative group-hover:brightness-110 group-hover:shadow-2xl`}
                                    style={{ height: `${Math.max(heightPercent, 2)}%`, minHeight: item.value > 0 ? '4px' : '0' }}
                                >
                                    {/* Subtle shine */}
                                    <div className="absolute top-0 left-1/4 w-1/2 h-full bg-white/10 skew-x-12" />
                                </div>

                                {/* X-Axis Item Label */}
                                <div className="absolute top-full pt-4">
                                    <span className="text-[10px] font-black text-slate-600 uppercase tracking-tighter whitespace-nowrap">
                                        {item.label}
                                    </span>
                                </div>
                            </div>
                        );
                    })}

                    {/* X-Axis Line (Bold) */}
                    <div className="absolute bottom-10 left-0 right-0 h-[2px] bg-slate-400" />
                </div>
            </div>
        </div>
    );
}

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

                    {/* Top-Right: Justification Rate Chart */}
                    <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm flex flex-col min-h-[350px]">
                        {stats?.justificationChart ? (
                            <JustificationRateChart data={stats.justificationChart} />
                        ) : (
                            <div className="flex-1 flex items-center justify-center">
                                <div className="text-center text-slate-400">
                                    <BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-20" />
                                    <p className="text-sm font-medium">Veri Yüklenemedi</p>
                                </div>
                            </div>
                        )}
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