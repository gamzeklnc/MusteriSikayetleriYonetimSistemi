'use client';

import { useEffect, useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { complaintService } from '@/services/complaintService';
import { productionCountService } from '@/services/productionCountService';
import { DashboardStats, ErrorStat } from '@/types/complaint';
import { 
    BarChart3, FileText, CheckCircle2, Clock, AlertCircle, 
    TrendingUp 
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

    const maxVal = Math.max(...data.map(i => i.value));
    let chartMax = maxVal > 0 ? maxVal * 1.25 : 1;
    const gridSteps = Array.from({ length: 6 }, (_, i) => (chartMax / 5) * i);

    return (
        <div className="w-full h-full flex flex-col">
            <div className="flex items-center justify-between mb-8">
                <div className="flex flex-col gap-0.5">
                    <h3 className="text-[12px] font-black text-slate-800 flex items-center gap-2">
                        <BarChart3 className="w-3.5 h-3.5 text-blue-600" />
                        {title}
                    </h3>
                    <p className="text-[9px] text-slate-400 font-bold pl-5 uppercase">{subtitle || 'Performans'}</p>
                </div>
                <div className="flex items-center gap-2">
                    {children}
                </div>
            </div>
            
            <div className="flex-1 flex gap-4 relative">
                <div className="flex flex-col justify-between h-full pr-3 border-r-2 border-slate-200 min-w-[40px]" style={{ paddingBottom: `${paddingBottom}px` }}>
                    {[...gridSteps].reverse().map((step, idx) => (
                        <span key={idx} className="text-[9px] font-black text-slate-500 text-right leading-none">
                            {chartMax <= 0.1 ? step.toFixed(4) : chartMax <= 2 ? step.toFixed(2) : Math.round(step)}%
                        </span>
                    ))}
                </div>

                <div className="flex-1 relative flex items-end justify-around" style={{ paddingBottom: `${paddingBottom}px` }}>
                    {data.map((item, idx) => {
                        const heightPercent = (item.value / chartMax) * 100;
                        const color = item.color || defaultColors[idx % defaultColors.length];
                        return (
                            <div key={item.label} className="z-10 flex-1 flex flex-col items-center group relative h-full justify-end px-1">
                                <div className="absolute transition-all duration-300 group-hover:-translate-y-2 z-20" style={{ bottom: `calc(${Math.max(heightPercent, 2)}% + 12px)` }}>
                                    <span className="text-[9px] font-black text-slate-700 bg-white/90 backdrop-blur-sm px-1.5 py-0.5 rounded-sm border border-slate-200 shadow-sm whitespace-nowrap">
                                        %{item.value.toFixed(4)}
                                    </span>
                                </div>
                                <div 
                                    className={`w-full max-w-[45px] rounded-t-sm bg-gradient-to-t ${color} shadow-sm transition-all duration-1000 relative group-hover:brightness-110`}
                                    style={{ height: `${Math.max(heightPercent, 2)}%` }}
                                />
                                <div className={`absolute top-full ${rotateLabels ? 'pt-6 -rotate-45 origin-top-left -translate-x-1' : 'pt-3'}`}>
                                    <span className="font-black text-slate-600 uppercase tracking-tighter whitespace-nowrap text-[8.5px]">
                                        {item.label}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                    <div className="absolute left-0 right-0 h-[1.5px] bg-slate-400" style={{ bottom: `${paddingBottom}px` }} />
                </div>
            </div>
        </div>
    );
}

interface DualChartItem {
    label: string;
    v1: number; // Count
    v2: number; // Rate
}

function BrandDualBarChart({ title, subtitle, data, children }: { title: string, subtitle?: string, data: DualChartItem[], children?: React.ReactNode }) {
    const maxV1 = Math.max(...data.map(i => i.v1), 1);
    const maxV2 = Math.max(...data.map(i => i.v2), 0.1);
    
    return (
        <div className="w-full h-full flex flex-col">
            <div className="flex items-center justify-between mb-6">
                <div className="flex flex-col gap-0.5">
                    <h3 className="text-[12px] font-black text-slate-800 flex items-center gap-2">
                        <BarChart3 className="w-3.5 h-3.5 text-blue-600" />
                        {title}
                    </h3>
                    <p className="text-[9px] text-slate-400 font-bold pl-5 uppercase">{subtitle || 'Performans'}</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex flex-col items-end gap-1 mr-4">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-blue-500" />
                            <span className="text-[8px] font-black text-slate-500 uppercase">Şikayet (Adet)</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-emerald-500" />
                            <span className="text-[8px] font-black text-slate-500 uppercase">Haklılık (%)</span>
                        </div>
                    </div>
                    {children}
                </div>
            </div>
            
            <div className="flex-1 flex gap-2 relative">
                <div className="absolute left-[38px] top-0 bottom-14 w-[1.5px] bg-slate-400 z-10" />
                
                <div className="flex flex-col justify-between h-full pb-14 pr-3 min-w-[38px]">
                    <span className="text-[8px] font-black text-slate-400 text-right">MAX</span>
                    <span className="text-[8px] font-black text-slate-400 text-right">MID</span>
                    <span className="text-[8px] font-black text-slate-400 text-right">0</span>
                </div>

                <div className="flex-1 relative flex items-end justify-around pb-14">
                    <div className="absolute inset-0 bottom-14 flex flex-col justify-between pointer-events-none">
                        <div className="w-full border-t border-slate-100 border-dashed" />
                        <div className="w-full border-t border-slate-100 border-dashed" />
                        <div className="w-full border-t border-transparent" />
                    </div>

                    {data.map((item) => {
                        const h1 = (item.v1 / (maxV1 * 1.2)) * 100;
                        const h2 = (item.v2 / (maxV2 * 1.2)) * 100;
                        return (
                            <div key={item.label} className="flex-1 flex flex-col items-center group relative h-full justify-end px-1">
                                <div className="flex items-end gap-1 w-full max-w-[60px] h-full">
                                    <div className="flex-1 flex flex-col items-center group/bar1 relative h-full justify-end">
                                        <div className="absolute bottom-full mb-1 z-20 pointer-events-none transition-all group-hover/bar1:scale-110">
                                            <span className="text-[8px] font-black text-blue-700 bg-blue-50 px-1 py-0.5 rounded border border-blue-100 shadow-sm">
                                                {item.v1}
                                            </span>
                                        </div>
                                        <div 
                                            className="w-full rounded-t-sm bg-gradient-to-t from-blue-600 to-blue-400 shadow-sm transition-all duration-1000"
                                            style={{ height: `${Math.max(h1, 2)}%` }}
                                        />
                                    </div>
                                    <div className="flex-1 flex flex-col items-center group/bar2 relative h-full justify-end">
                                        <div className="absolute bottom-full mb-1 z-20 pointer-events-none transition-all group-hover/bar2:scale-110">
                                            <span className="text-[8px] font-black text-emerald-700 bg-emerald-50 px-1 py-0.5 rounded border border-emerald-100 shadow-sm">
                                                %{item.v2.toFixed(3)}
                                            </span>
                                        </div>
                                        <div 
                                            className="w-full rounded-t-sm bg-gradient-to-t from-emerald-600 to-emerald-400 shadow-sm transition-all duration-1000"
                                            style={{ height: `${Math.max(h2, 2)}%` }}
                                        />
                                    </div>
                                </div>
                                <div className="absolute top-full pt-3 w-full text-center">
                                    <span className="text-[9px] font-black text-slate-600 uppercase tracking-tighter block truncate px-1">
                                        {item.label}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                    <div className="absolute bottom-14 left-0 right-0 h-[2px] bg-slate-400" />
                </div>
            </div>
        </div>
    );
}

function StackedErrorBarChart({ title, subtitle, data, allBrands, children }: { title: string, subtitle?: string, data: ErrorStat[], allBrands: string[], children?: React.ReactNode }) {
    const brandColors: Record<string, string> = {};
    const colorPalette = [
        'bg-blue-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500', 
        'bg-violet-500', 'bg-indigo-500', 'bg-orange-500', 'bg-teal-500'
    ];
    allBrands.forEach((b, i) => brandColors[b] = colorPalette[i % colorPalette.length]);

    const maxTotal = Math.max(...data.map(d => d.totalCount), 1);

    return (
        <div className="w-full h-full flex flex-col">
            <div className="flex items-center justify-between mb-6">
                <div className="flex flex-col gap-0.5">
                    <h3 className="text-[12px] font-black text-slate-800 flex items-center gap-2">
                        <AlertCircle className="w-3.5 h-3.5 text-red-600" />
                        {title}
                    </h3>
                    <p className="text-[9px] text-slate-400 font-bold pl-5 uppercase">{subtitle || 'Hata Dağılımı'}</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex flex-wrap justify-end gap-x-2 gap-y-1 max-w-[280px]">
                        {allBrands.map(b => (
                            <div key={b} className="flex items-center gap-1.5 px-2 py-1 bg-slate-50 rounded border border-slate-100 shadow-sm transition-all hover:bg-white">
                                <div className={`w-2 h-2 rounded-full ${brandColors[b] || 'bg-slate-300'} shadow-sm`} />
                                <span className="text-[8px] font-black text-slate-700 uppercase tracking-tighter">{b}</span>
                            </div>
                        ))}
                    </div>
                    {children}
                </div>
            </div>

            <div className="flex-1 flex gap-2 relative">
                <div className="absolute left-[38px] top-0 bottom-14 w-[1.5px] bg-slate-300 z-10" />
                <div className="flex flex-col justify-between h-full pb-14 pr-3 min-w-[38px]">
                    <span className="text-[8px] font-black text-slate-400 text-right">{maxTotal}</span>
                    <span className="text-[8px] font-black text-slate-400 text-right">{Math.round(maxTotal/2)}</span>
                    <span className="text-[8px] font-black text-slate-400 text-right">0</span>
                </div>

                <div className="flex-1 relative flex items-end justify-around pb-14">
                    {data.map((item) => {
                        const totalH = (item.totalCount / (maxTotal * 1.1)) * 100;
                        return (
                            <div key={item.errorLabel} className="flex-1 flex flex-col items-center group relative h-full justify-end px-1">
                                <div className="absolute bottom-full mb-1 z-20 pointer-events-none transition-all group-hover:scale-110">
                                    <span className="text-[8px] font-black text-slate-700 bg-white px-1 py-0.5 rounded border border-slate-200 shadow-sm">
                                        {item.totalCount}
                                    </span>
                                </div>
                                <div className="w-full max-w-[30px] flex flex-col-reverse rounded-t-sm overflow-hidden shadow-sm" style={{ height: `${totalH}%` }}>
                                    {item.brandBreakdown.map((b, bi) => {
                                        const segmentH = (b.count / item.totalCount) * 100;
                                        return (
                                            <div 
                                                key={bi}
                                                className={`${brandColors[b.brandName]} w-full transition-all group-hover:brightness-110 flex items-center justify-center relative`}
                                                style={{ height: `${segmentH}%` }}
                                                title={`${b.brandName}: ${b.count}`}
                                            >
                                                {segmentH > 8 && (
                                                    <span className="text-[7px] font-black text-white drop-shadow-md">
                                                        {b.count}
                                                    </span>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                                <div className="absolute top-full pt-3 w-full text-center">
                                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-tighter block truncate">
                                        {item.errorLabel}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                    <div className="absolute bottom-14 left-0 right-0 h-[1.5px] bg-slate-400" />
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
    const [brandYear, setBrandYear] = useState<string>('Hepsi');
    const [brandFilter, setBrandFilter] = useState<string>('Hepsi');
    const [errorYear, setErrorYear] = useState<string>('Hepsi');
    const [totalProductionCount, setTotalProductionCount] = useState<number>(0);

    const monthNames = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];

    const fetchStats = async (start?: string, end?: string, brnd?: string) => {
        try {
            setLoading(true);
            const data = await complaintService.getDashboardStats(start || undefined, end || undefined, brnd || undefined);
            setStats(data);
        } catch (error) { console.error(error); } finally { setLoading(false); }
    };

    useEffect(() => { fetchStats(startDate, endDate); }, [startDate, endDate]);

    const fetchBrandStats = async () => {
        try {
            let sDate = undefined;
            let eDate = undefined;
            if (brandYear !== 'Hepsi') {
                sDate = `${brandYear}-01-01`;
                eDate = `${brandYear}-12-31`;
            }
            const brnd = brandFilter === 'Hepsi' ? undefined : brandFilter;
            const data = await complaintService.getDashboardStats(sDate, eDate, brnd);
            if (stats) setStats({ ...stats, brandStats: data.brandStats });
        } catch (error) { console.error(error); }
    };

    useEffect(() => { if (stats) fetchBrandStats(); }, [brandYear, brandFilter]);

    const fetchErrorStats = async () => {
        try {
            let sDate = undefined;
            let eDate = undefined;
            if (errorYear !== 'Hepsi') {
                sDate = `${errorYear}-01-01`;
                eDate = `${errorYear}-12-31`;
            }
            const data = await complaintService.getDashboardStats(sDate, eDate);
            if (stats) setStats({ ...stats, errorStats: data.errorStats });
        } catch (error) { console.error(error); }
    };

    useEffect(() => { if (stats) fetchErrorStats(); }, [errorYear]);
    useEffect(() => {
        productionCountService.getAll().then(data => {
            setTotalProductionCount(data.reduce((sum, item) => sum + item.count, 0));
        });
    }, []);

    const justifiedRatio = totalProductionCount > 0 ? ((stats?.totalJustifiedProducts || 0) / totalProductionCount) * 100 : 0;

    const topMetrics = [
        { label: 'Toplam Şikayet', value: stats?.totalComplaints || 0, icon: <FileText className="w-5 h-5 text-blue-600" />, color: 'bg-blue-50 border-blue-100' },
        { label: 'Açık Şikayetler', value: stats?.openComplaints || 0, icon: <Clock className="w-5 h-5 text-amber-600" />, color: 'bg-amber-50 border-amber-100' },
        { label: 'Kapalı Şikayetler', value: stats?.closedComplaints || 0, icon: <CheckCircle2 className="w-5 h-5 text-slate-600" />, color: 'bg-slate-50 border-slate-100' },
        { label: 'Haklılık Oranı', value: `%${justifiedRatio.toFixed(4)}`, icon: <TrendingUp className="w-5 h-5 text-emerald-600" />, color: 'bg-emerald-50 border-emerald-100' },
        { label: 'Haklı Ürün', value: stats?.totalJustifiedProducts || 0, icon: <CheckCircle2 className="w-5 h-5 text-emerald-500" />, color: 'bg-emerald-50 border-emerald-100' },
        { label: 'Haksız Ürün', value: stats?.totalUnjustifiedProducts || 0, icon: <AlertCircle className="w-5 h-5 text-red-500" />, color: 'bg-red-50 border-red-100' },
    ];

    if (loading && !stats) return <AppLayout><div className="flex items-center justify-center min-h-[400px]"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div></AppLayout>;

    return (
        <AppLayout>
            <div className="space-y-4 -mt-6">
                <div className="flex items-center justify-between"><h1 className="text-3xl font-black text-slate-900 tracking-tight">Dashboard</h1></div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-8">
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col min-h-[350px]">
                        <div className="grid grid-cols-3 grid-rows-2 gap-4 flex-1">
                            {topMetrics.map((m) => (
                                <div key={m.label} className={`p-4 rounded-xl border ${m.color} flex flex-col justify-between shadow-sm transition-all hover:shadow-md`}>
                                    <div className="flex items-center justify-between"><span className="p-1.5 bg-white rounded-lg shadow-sm">{m.icon}</span></div>
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{m.label}</p>
                                        <p className="text-2xl font-black text-slate-900 mt-1">{m.value}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col min-h-[350px]">
                        {stats?.justificationChart ? (
                            <GenericBarChart title="Haklılık Oranı (%)" subtitle="Yıllık Dönemsel Durum"
                                data={[
                                    { label: '1. ALTI AY', value: stats.justificationChart.firstHalfRate, color: 'from-blue-500 to-indigo-600' },
                                    { label: '2. ALTI AY', value: stats.justificationChart.secondHalfRate, color: 'from-indigo-400 to-indigo-600' },
                                    { label: 'KÜMÜLATİF', value: stats.justificationChart.cumulativeRate, color: 'from-emerald-500 to-teal-600' }
                                ]}
                            />
                        ) : <div className="flex-1 flex items-center justify-center text-slate-400">Veri Yüklenemedi</div>}
                    </div>

                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col min-h-[350px]">
                        {stats?.yearlyStats ? (
                            <GenericBarChart title="Yıllık Haklılık Oranı" subtitle="Tüm Yılların Karşılaştırması" paddingBottom={80}
                                data={stats.yearlyStats.map(y => ({ label: y.year.toString(), value: y.rate }))}
                            />
                        ) : <div className="flex-1 flex items-center justify-center text-slate-400">Yıllık Veri Bekleniyor...</div>}
                    </div>

                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col min-h-[350px]">
                        {stats?.monthlyJustificationStats ? (
                            <GenericBarChart rotateLabels={true} paddingBottom={80}
                                title={`${endDate ? new Date(endDate).getFullYear() : new Date().getFullYear()} Aylık Haklılık Oranı`} 
                                subtitle="Ay Bazlı Performans Dağılımı"
                                data={stats.monthlyJustificationStats.map(m => ({ label: monthNames[m.month - 1].toUpperCase(), value: m.rate }))}
                            >
                                <select className="text-[10px] font-black text-blue-600 bg-blue-50 border border-blue-100 rounded-lg px-2 py-1"
                                    value={endDate ? new Date(endDate).getFullYear().toString() : new Date().getFullYear().toString()}
                                    onChange={(e) => { const year = e.target.value; setEndDate(`${year}-12-31`); setStartDate(`${year}-01-01`); }}
                                >
                                    {(stats?.yearlyStats || []).map(y => ( <option key={y.year} value={y.year}>{y.year}</option> ))}
                                </select>
                            </GenericBarChart>
                        ) : <div className="flex-1 flex items-center justify-center text-slate-400">Aylık Veri Bekleniyor...</div>}
                    </div>

                    {/* 5. Brand Performance */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col min-h-[400px]">
                        <div className="flex-1">
                            <BrandDualBarChart 
                                title="Marka Bazlı Şikayet & Haklılık" 
                                subtitle={brandYear === 'Hepsi' && brandFilter !== 'Hepsi' ? `${brandFilter} - Yıllık Performans Dağılımı` : "Detaylı Performans Bilgileri"}
                                data={(stats?.brandStats || []).map(b => ({ label: b.brandName, v1: b.complaintCount, v2: b.justificationRate }))}
                            >
                                <div className="flex items-center gap-2">
                                    <select 
                                        className="text-[9px] font-black text-blue-600 bg-blue-50 border border-blue-100 rounded px-1.5 py-1 outline-none"
                                        value={brandYear}
                                        onChange={(e) => setBrandYear(e.target.value)}
                                    >
                                        <option value="Hepsi">YIL: HEPSİ</option>
                                        {(stats?.yearlyStats || []).map(y => ( <option key={y.year} value={y.year}>{y.year}</option> ))}
                                    </select>
                                    <select 
                                        className="text-[9px] font-black text-emerald-600 bg-emerald-50 border border-emerald-100 rounded px-1.5 py-1 outline-none max-w-[80px]"
                                        value={brandFilter}
                                        onChange={(e) => setBrandFilter(e.target.value)}
                                    >
                                        <option value="Hepsi">MARKA: HEPSİ</option>
                                        {(stats?.allBrands || []).map(b => ( <option key={b} value={b}>{b}</option> ))}
                                    </select>
                                </div>
                            </BrandDualBarChart>
                        </div>
                    </div>

                    {/* 6. Error Analysis Analysis */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col min-h-[400px]">
                        {stats?.errorStats ? (
                            <StackedErrorBarChart 
                                title="Hata Tanımları & Marka Kıyaslaması" 
                                subtitle={errorYear === 'Hepsi' ? "Tüm Zamanlar Hata Dağılımı" : `${errorYear} Yılı Hata Analizi`}
                                data={stats.errorStats}
                                allBrands={stats.allBrands}
                            >
                                <select 
                                    className="text-[9px] font-black text-red-600 bg-red-50 border border-red-100 rounded px-1.5 py-1 outline-none"
                                    value={errorYear}
                                    onChange={(e) => setErrorYear(e.target.value)}
                                >
                                    <option value="Hepsi">YIL: HEPSİ</option>
                                    {(stats?.yearlyStats || []).map(y => ( <option key={y.year} value={y.year}>{y.year}</option> ))}
                                </select>
                            </StackedErrorBarChart>
                        ) : <div className="flex-1 flex items-center justify-center text-slate-400">Hata Verisi Bekleniyor...</div>}
                    </div>

                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-center min-h-[350px] border-dashed border-2 border-slate-100">
                        <AlertCircle className="w-10 h-10 opacity-5" />
                    </div>
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-center min-h-[350px] border-dashed border-2 border-slate-100">
                        <Clock className="w-10 h-10 opacity-5" />
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}