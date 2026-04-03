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

interface ChartItem {
    label: string;
    value: number;
    color?: string;
}

function GenericBarChart({ title, subtitle, data, rotateLabels = false, children, paddingBottom = 40 }: { 
    title: string, 
    subtitle?: string, 
    data: ChartItem[], 
    rotateLabels?: boolean,
    children?: React.ReactNode,
    paddingBottom?: number
}) {
    const defaultColors = [
        'from-blue-500 to-indigo-600',
        'from-indigo-400 to-indigo-600',
        'from-emerald-500 to-teal-600',
        'from-violet-500 to-purple-600',
        'from-amber-500 to-orange-600',
        'from-rose-500 to-red-600'
    ];

    // Determine the max scale dynamically (Purely relative to data)
    const maxVal = Math.max(...data.map(i => i.value));
    
    // Fallback if no data or all zero
    let chartMax = maxVal > 0 ? maxVal * 1.25 : 1; // Add 25% headroom

    // Generate 5 dynamic steps for the Y-Axis
    const gridSteps = Array.from({ length: 6 }, (_, i) => (chartMax / 5) * i);

    return (
        <div className="w-full h-full flex flex-col">
            <div className="flex items-center justify-between mb-10">
                <div className="flex flex-col gap-0.5">
                    <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
                        <BarChart3 className="w-4 h-4 text-blue-600" />
                        {title}
                    </h3>
                    <p className="text-[10px] text-slate-400 font-bold pl-6 uppercase">{subtitle || 'Performans Grafiği'}</p>
                </div>
                <div className="flex items-center gap-2">
                    {children}
                </div>
            </div>
            
            <div className="flex-1 flex gap-4 relative">
                {/* Y-Axis Labels & Vertical Axis */}
                <div className="flex flex-col justify-between h-full pr-3 border-r-2 border-slate-200 min-w-[45px]" style={{ paddingBottom: `${paddingBottom}px` }}>
                    {[...gridSteps].reverse().map((step, idx) => (
                        <span key={idx} className="text-[10px] font-black text-slate-500 text-right leading-none">
                            {chartMax <= 0.1 
                                ? step.toFixed(4) 
                                : chartMax <= 2 
                                    ? step.toFixed(2) 
                                    : Math.round(step)}%
                        </span>
                    ))}
                </div>

                {/* Chart Area */}
                <div className="flex-1 relative flex items-end justify-around" style={{ paddingBottom: `${paddingBottom}px` }}>
                    {/* Grid Lines */}
                    <div className="absolute inset-0 flex flex-col justify-between pointer-events-none" style={{ paddingBottom: `${paddingBottom}px` }}>
                        {[...gridSteps].reverse().map((step, idx) => (
                            <div key={idx} className={`w-full border-t ${step === 0 ? 'border-transparent' : 'border-slate-100'} border-dashed`} />
                        ))}
                    </div>

                    {/* Bars */}
                    {data.map((item, idx) => {
                        const heightPercent = (item.value / chartMax) * 100;
                        const color = item.color || defaultColors[idx % defaultColors.length];
                        return (
                            <div key={item.label} className="z-10 flex-1 flex flex-col items-center group relative h-full justify-end px-2">
                                {/* Percentage Label */}
                                <div className="absolute transition-all duration-300 group-hover:-translate-y-2" style={{ bottom: `calc(${Math.max(heightPercent, 2)}% + 15px)` }}>
                                    <span className="text-[10px] font-black text-slate-700 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-sm border border-slate-200 shadow-sm whitespace-nowrap">
                                        %{item.value.toFixed(4)}
                                    </span>
                                </div>
                                
                                {/* Bar Body */}
                                <div 
                                    className={`w-full max-w-[60px] rounded-t-lg bg-gradient-to-t ${color} shadow-lg transition-all duration-1000 ease-in-out relative group-hover:brightness-110 group-hover:shadow-2xl`}
                                    style={{ height: `${Math.max(heightPercent, 2)}%`, minHeight: item.value > 0 ? '4px' : '0' }}
                                >
                                    {/* Subtle shine */}
                                    <div className="absolute top-0 left-1/4 w-1/2 h-full bg-white/10 skew-x-12" />
                                </div>

                                {/* X-Axis Item Label */}
                                <div className={`absolute top-full ${rotateLabels ? 'pt-8 -rotate-45 origin-top-left -translate-x-2' : 'pt-4'}`}>
                                    <span className={`font-black text-slate-600 uppercase tracking-tighter whitespace-nowrap ${rotateLabels ? 'text-[9px]' : 'text-[10px]'}`}>
                                        {item.label}
                                    </span>
                                </div>
                            </div>
                        );
                    })}

                    {/* X-Axis Line (Bold) */}
                    <div className="absolute left-0 right-0 h-[2px] bg-slate-400" style={{ bottom: `${paddingBottom}px` }} />
                </div>
            </div>
        </div>
    );
}

const monthNames = [
    'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 
    'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
];

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
            <div className="space-y-4 -mt-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Dashboard</h1>
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

                    {/* Top-Right: Half-Yearly/Cumulative Chart */}
                    <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm flex flex-col min-h-[350px]">
                        {stats?.justificationChart ? (
                            <GenericBarChart 
                                title="Haklılık Oranı (%)" 
                                subtitle="Yıllık Dönemsel Durum"
                                data={[
                                    { label: '1. ALTI AY', value: stats.justificationChart.firstHalfRate, color: 'from-blue-500 to-indigo-600' },
                                    { label: '2. ALTI AY', value: stats.justificationChart.secondHalfRate, color: 'from-indigo-400 to-indigo-600' },
                                    { label: 'KÜMÜLATİF', value: stats.justificationChart.cumulativeRate, color: 'from-emerald-500 to-teal-600' }
                                ]}
                            />
                        ) : (
                            <div className="flex-1 flex items-center justify-center">
                                <div className="text-center text-slate-400">
                                    <BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-20" />
                                    <p className="text-sm font-medium">Veri Yüklenemedi</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Bottom-Left: Yearly Justification Chart */}
                    <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm flex flex-col min-h-[350px]">
                        {stats?.yearlyStats ? (
                            <GenericBarChart 
                                title="Yıllık Haklılık Oranı" 
                                subtitle="Tüm Yılların Karşılaştırması"
                                paddingBottom={80}
                                data={stats.yearlyStats.map(y => ({
                                    label: y.year.toString(),
                                    value: y.rate
                                }))}
                            />
                        ) : (
                            <div className="flex-1 flex items-center justify-center">
                                <div className="text-center text-slate-400">
                                    <TrendingUp className="w-12 h-12 mx-auto mb-2 opacity-20" />
                                    <p className="text-sm font-medium">Yıllık Veri Bekleniyor...</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Sağ Alt: Seçilen Yılın 12 Aylık Dağılımı */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col min-h-[350px]">
                        {stats?.monthlyJustificationStats ? (
                            <GenericBarChart 
                                title={`${endDate ? new Date(endDate).getFullYear() : new Date().getFullYear()} Aylık Haklılık Oranı`} 
                                subtitle="Ay Bazlı Performans Dağılımı"
                                rotateLabels={true}
                                paddingBottom={80}
                                data={stats.monthlyJustificationStats.map(m => ({
                                    label: monthNames[m.month - 1].toUpperCase(),
                                    value: m.rate
                                }))}
                            >
                                {/* Year Selector for this chart */}
                                <select 
                                    className="text-[10px] font-black text-blue-600 bg-blue-50 border border-blue-100 rounded-lg px-2 py-1 outline-none cursor-pointer hover:bg-blue-100 transition-colors"
                                    value={endDate ? new Date(endDate).getFullYear().toString() : new Date().getFullYear().toString()}
                                    onChange={(e) => {
                                        const year = e.target.value;
                                        setEndDate(`${year}-12-31`);
                                        // Update startDate too if we want to focus on that specific year
                                        setStartDate(`${year}-01-01`);
                                    }}
                                >
                                    {(stats?.yearlyStats || []).map(y => (
                                        <option key={y.year} value={y.year}>{y.year}</option>
                                    ))}
                                </select>
                            </GenericBarChart>
                        ) : (
                            <div className="flex-1 flex items-center justify-center">
                                <div className="text-center text-slate-400">
                                    <FileText className="w-12 h-12 mx-auto mb-2 opacity-20" />
                                    <p className="text-sm font-medium">Aylık Veri Bekleniyor...</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}