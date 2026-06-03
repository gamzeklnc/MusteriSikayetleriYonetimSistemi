'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { complaintService } from '@/services/complaintService';
import { DashboardStats, ErrorStat } from '@/types/complaint';
import { 
    BarChart3, FileText, CheckCircle2, Clock, AlertCircle, 
    TrendingUp, Activity, LogIn
} from 'lucide-react';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import ComplaintList from '@/components/complaints/ComplaintList';

interface ChartItem {
    label: string;
    value: number;
    color?: string;
}

function GenericBarChart({ title, subtitle, data, children, paddingBottom = 40, barColor, isRate = true }: { 
    title: string, 
    subtitle?: string, 
    data: ChartItem[], 
    rotateLabels?: boolean,
    children?: React.ReactNode,
    paddingBottom?: number,
    barColor?: string,
    isRate?: boolean
}) {
    const defaultColors = [
        'from-blue-500 to-indigo-600',
        'from-indigo-400 to-indigo-600',
        'from-emerald-500 to-teal-600',
        'from-violet-500 to-purple-600',
        'from-amber-500 to-orange-600',
        'from-rose-500 to-red-600'
    ];

    const maxVal = Math.max(...data.map(i => i.value), 0);
    const chartMax = maxVal > 0 ? maxVal * 1.15 : 1; 

    const formatValue = (val: number) => {
        if (val === undefined || val === null) return '0';
        if (!isRate) return val.toLocaleString(); // Just the number for counts
        if (val === 0) return '0';
        if (val < 0.001) return val.toFixed(5);
        if (val < 0.01) return val.toFixed(4);
        if (val < 1) return val.toFixed(3);
        return val.toFixed(2);
    };

    const gridSteps = Array.from({ length: 6 }, (_, i) => (chartMax / 5) * i);

    return (
        <div className="w-full h-full flex flex-col">
            <div className="flex items-center justify-between mb-4">
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
                <div className="flex flex-col justify-between h-full pr-3 border-r-2 border-slate-200 min-w-[45px]" style={{ paddingBottom: `${paddingBottom}px` }}>
                    {[...gridSteps].reverse().map((step, idx) => (
                        <span key={idx} className="text-[8px] font-black text-slate-500 text-right leading-none">
                            {isRate && '%'}{formatValue(step)}
                        </span>
                    ))}
                </div>

                <div className="flex-1 relative flex items-end justify-around" style={{ paddingBottom: `${paddingBottom}px` }}>
                    {data.map((item, idx) => {
                        const heightPercent = chartMax > 0 ? (item.value / chartMax) * 100 : 0;
                        const color = barColor || defaultColors[idx % defaultColors.length];
                        return (
                            <div key={item.label} className="z-10 flex-1 flex flex-col items-center group relative h-full justify-end px-1">
                                <div className="absolute transition-all duration-300 group-hover:-translate-y-2 z-20" style={{ bottom: `calc(${Math.max(heightPercent, 2)}% + 12px)` }}>
                                    <span className="text-[8px] font-black text-slate-700 bg-white/95 backdrop-blur-sm px-1 py-0.5 rounded-sm border border-slate-200 shadow-sm whitespace-nowrap">
                                        {isRate && '%'}{formatValue(item.value)}
                                    </span>
                                </div>
                                <div 
                                    className={`w-full max-w-[45px] rounded-t-sm bg-gradient-to-t ${color} shadow-sm transition-all duration-1000 relative group-hover:brightness-110`}
                                    style={{ height: `${Math.max(heightPercent, 2)}%` }}
                                />
                                <div className="absolute w-0 overflow-visible" style={{ top: '100%', left: '50%', paddingTop: '6px' }}>
                                    <span title={item.label} className="font-black text-slate-600 uppercase tracking-tighter text-[7px] sm:text-[8px] whitespace-nowrap inline-block text-right" style={{ transform: 'translateX(-100%) rotate(-45deg)', transformOrigin: 'top right' }}>
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
    v2: number; // Rate OR JustifiedCount
    v2IsRate?: boolean;
}

function DualBarChart({ title, subtitle, data, children, v1Label, v2Label }: { 
    title: string, 
    subtitle?: string, 
    data: DualChartItem[], 
    children?: React.ReactNode,
    v1Label: string,
    v2Label: string
}) {
    const maxV1 = Math.max(...data.map(i => i.v1), 1);
    const maxV2 = Math.max(...data.map(i => i.v2), 0.001);
    const chartMaxV1 = maxV1 * 1.2;
    const chartMaxV2 = maxV2 * 1.25;

    const formatRate = (val: number) => {
        if (val === 0) return '0';
        if (val < 0.001) return val.toFixed(5);
        if (val < 0.01) return val.toFixed(4);
        if (val < 1) return val.toFixed(3);
        return val.toFixed(2);
    };

    const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

    const lineLabels = useMemo(() => {
        const labels = data.map((item, idx) => {
            const yPct = chartMaxV2 > 0 ? (item.v2 / chartMaxV2) * 100 : 0;
            return { idx, item, yPct, staggeredY: yPct, isVisible: true };
        });
        const sortedLabels = [...labels].sort((a, b) => a.yPct - b.yPct);
        const MIN_DIST = 8;
        for (let i = 1; i < sortedLabels.length; i++) {
            const prev = sortedLabels[i - 1];
            const curr = sortedLabels[i];
            if (curr.yPct - prev.yPct < MIN_DIST) {
                const isCurrSmall = curr.yPct < 15;
                const isPrevSmall = prev.yPct < 15;
                if (isCurrSmall && !isPrevSmall) curr.isVisible = false;
                else if (isPrevSmall && !isCurrSmall) prev.isVisible = false;
                else if (isCurrSmall && isPrevSmall) {
                    if (curr.item.v2 < prev.item.v2) curr.isVisible = false;
                    else prev.isVisible = false;
                }
            }
        }
        const visibleLabels = sortedLabels.filter(l => l.isVisible);
        for (let i = 1; i < visibleLabels.length; i++) {
            const prev = visibleLabels[i - 1];
            const curr = visibleLabels[i];
            if (curr.staggeredY - prev.staggeredY < MIN_DIST) {
                curr.staggeredY = prev.staggeredY + MIN_DIST;
            }
        }
        const maxStagger = Math.max(...visibleLabels.map(l => l.staggeredY), 0);
        if (maxStagger > 100) {
            const overflow = maxStagger - 100;
            for (let i = visibleLabels.length - 1; i >= 0; i--) {
                visibleLabels[i].staggeredY -= overflow;
                if (i < visibleLabels.length - 1) {
                    const next = visibleLabels[i + 1];
                    if (next.staggeredY - visibleLabels[i].staggeredY < MIN_DIST) {
                        visibleLabels[i].staggeredY = next.staggeredY - MIN_DIST;
                    }
                }
            }
        }
        return labels.sort((a, b) => a.idx - b.idx);
    }, [data, chartMaxV2]);
    
    return (
        <div className="w-full h-full flex flex-col">
            <div className="flex items-center justify-between mb-4">
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
                            <div className="w-2.5 h-2.5 rounded-sm bg-gradient-to-t from-blue-600 to-blue-400" />
                            <span className="text-[8px] font-black text-slate-500 uppercase">{v1Label}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-0.5 bg-orange-500 rounded-full" />
                            <span className="text-[8px] font-black text-slate-500 uppercase">{v2Label}</span>
                        </div>
                    </div>
                    {children}
                </div>
            </div>
            
            <div className="flex-1 flex gap-2 relative">
                {/* Sol Eksen (Şikayet Adedi) */}
                <div className="flex flex-col justify-between h-full pr-3 min-w-[50px] z-10 border-r border-slate-100" style={{ paddingBottom: '80px' }}>
                    {[...Array.from({ length: 6 }, (_, i) => (chartMaxV1 / 5) * i)].reverse().map((step, idx) => (
                        <span key={idx} className="text-[8px] font-black text-slate-500 text-right leading-none">
                            {Math.round(step).toLocaleString()}
                        </span>
                    ))}
                </div>

                {/* Bar + Line Alanı */}
                <div className="flex-1 relative" style={{ paddingBottom: '80px' }}>
                    {/* SVG Çizgi Katmanı */}
                    <div className="absolute top-0 left-0 right-0 z-20 pointer-events-none" style={{ bottom: '80px' }}>
                        <svg className="w-full h-full overflow-visible" preserveAspectRatio="none">
                            {data.map((item, idx) => {
                                const x = `${(idx + 0.5) * (100 / data.length)}%`;
                                const y = `${100 - ((item.v2 / chartMaxV2) * 100)}%`;
                                const nextItem = data[idx + 1];
                                if (!nextItem) return null;
                                const nextX = `${(idx + 1.5) * (100 / data.length)}%`;
                                const nextY = `${100 - ((nextItem.v2 / chartMaxV2) * 100)}%`;
                                return (
                                    <line key={`line-${idx}`} x1={x} y1={y} x2={nextX} y2={nextY} stroke="#f97316" strokeWidth="2.5" fill="none" />
                                );
                            })}
                            {data.map((item, idx) => {
                                const x = `${(idx + 0.5) * (100 / data.length)}%`;
                                const y = `${100 - ((item.v2 / chartMaxV2) * 100)}%`;
                                return (
                                    <circle key={`dot-${idx}`} cx={x} cy={y} r="5" fill="#f97316" stroke="#ffffff" strokeWidth="2.5" className="drop-shadow-sm" />
                                );
                            })}
                            
                            {/* Staggered Leader Lines */}
                            {lineLabels.map((lbl) => {
                                const isHovered = hoveredIdx === lbl.idx;
                                const show = lbl.isVisible || isHovered;
                                if (!show) return null;
                                const x1 = `${(lbl.idx + 0.5) * (100 / data.length)}%`;
                                const y1 = `${100 - lbl.yPct}%`;
                                const x2 = `100%`;
                                const y2 = `${100 - (lbl.isVisible ? lbl.staggeredY : lbl.yPct)}%`;
                                return (
                                    <line key={`leader-${lbl.idx}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#fb923c" strokeWidth="1.5" strokeDasharray="3 3" className={`transition-all duration-300 ${isHovered ? 'opacity-100' : 'opacity-60'}`} />
                                );
                            })}
                        </svg>
                    </div>

                    {/* Çizgi Nokta Etiketleri (Haklılık Oranı) */}
                    <div className="absolute top-0 left-0 right-0 z-30 pointer-events-none" style={{ bottom: '80px' }}>
                        {lineLabels.map((lbl) => {
                            const isHovered = hoveredIdx === lbl.idx;
                            const show = lbl.isVisible || isHovered;
                            const currentY = lbl.isVisible ? lbl.staggeredY : lbl.yPct;
                            return (
                                <div key={`linelabel-${lbl.idx}`} className={`absolute flex items-center justify-end pointer-events-none transition-all duration-300 ${show ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`} style={{ bottom: `calc(${currentY}%)`, right: '0px', transform: 'translateY(50%)' }}>
                                    <div className="w-0 h-0 border-t-[3px] border-t-transparent border-b-[3px] border-b-transparent border-l-[4px] border-l-orange-500" />
                                    <div className="absolute left-full ml-2 flex items-center">
                                        <span className={`text-[8px] sm:text-[9px] font-black text-orange-500 whitespace-nowrap z-30 transition-all duration-200 ${isHovered ? 'scale-110 text-orange-600' : ''}`}>
                                            {lbl.item.v2IsRate ? `%${formatRate(lbl.item.v2)}` : lbl.item.v2}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Sütunlar (Şikayet Adedi) */}
                    <div className="absolute top-0 left-0 right-0 flex items-end justify-around pointer-events-none" style={{ bottom: '80px' }}>
                        {data.map((item, idx) => {
                            const barH = chartMaxV1 > 0 ? (item.v1 / chartMaxV1) * 100 : 0;
                            return (
                                <div key={`bar-${idx}`} className="flex-1 flex flex-col items-center group relative h-full justify-end px-1 pointer-events-auto" style={{ maxWidth: '50px' }} onMouseEnter={() => setHoveredIdx(idx)} onMouseLeave={() => setHoveredIdx(null)}>
                                    {/* Sütun Etiketi */}
                                    <div className="absolute z-40 pointer-events-none mb-1 transition-all opacity-90 group-hover:opacity-100 group-hover:-translate-y-1" style={{ bottom: `${Math.max(barH, 2)}%` }}>
                                        <span className="text-[8px] sm:text-[9px] font-black text-blue-700 bg-blue-50/95 backdrop-blur-sm px-1.5 py-0.5 rounded border border-blue-200 shadow-sm whitespace-nowrap">
                                            {item.v1.toLocaleString()}
                                        </span>
                                    </div>
                                    <div className="w-full rounded-t-sm bg-gradient-to-t from-blue-600 to-blue-400 shadow-sm transition-all duration-300 group-hover:brightness-110 group-hover:opacity-100 opacity-90 relative z-10" style={{ height: `${Math.max(barH, 2)}%` }} />
                                    {/* Alt X Ekseni Etiketi */}
                                    <div className="absolute w-0 overflow-visible" style={{ top: '100%', left: '50%', paddingTop: '6px' }}>
                                        <span title={item.label} className="font-black text-slate-600 uppercase tracking-tighter text-[7px] sm:text-[8px] whitespace-nowrap inline-block text-right transition-colors group-hover:text-blue-600" style={{ transform: 'translateX(-100%) rotate(-45deg)', transformOrigin: 'top right' }}>
                                            {item.label}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                        <div className="absolute left-0 right-0 h-[1.5px] bg-slate-400 bottom-0 pointer-events-none" />
                    </div>
                </div>

                {/* Sağ Eksen (Boş - değerler mutlak konumla üzerine biniyor) */}
                <div className="flex flex-col justify-between h-full min-w-[50px] z-10 border-l border-slate-100" style={{ paddingBottom: '80px' }}>
                </div>
            </div>
        </div>
    );
}

interface ComboChartItem {
    label: string;
    barValue: number;
    lineValue: number;
}

function ComboChart({ title, subtitle, data, targetLineValue, children, paddingBottom = 40 }: { 
    title: string, 
    subtitle?: string, 
    data: ComboChartItem[], 
    targetLineValue: number,
    children?: React.ReactNode,
    paddingBottom?: number
}) {
    const maxBar = Math.max(...data.map(i => i.barValue), 10);
    const chartMaxBar = maxBar * 1.15;

    const maxLine = Math.max(...data.map(i => i.lineValue), targetLineValue, 0.05);
    const chartMaxLine = maxLine * 1.25;

    const formatRate = (val: number) => {
        if (val === 0) return '0';
        if (val < 0.001) return val.toFixed(5);
        if (val < 0.01) return val.toFixed(4);
        if (val < 1) return val.toFixed(3);
        return val.toFixed(2);
    };

    const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

    const lineLabels = useMemo(() => {
        const labels = data.map((item, idx) => {
            const yPct = chartMaxLine > 0 ? (item.lineValue / chartMaxLine) * 100 : 0;
            return { idx, item, yPct, staggeredY: yPct, isVisible: true };
        });
        const sortedLabels = [...labels].sort((a, b) => a.yPct - b.yPct);
        const MIN_DIST = 8;
        for (let i = 1; i < sortedLabels.length; i++) {
            const prev = sortedLabels[i - 1];
            const curr = sortedLabels[i];
            if (curr.yPct - prev.yPct < MIN_DIST) {
                const isCurrSmall = curr.yPct < 15;
                const isPrevSmall = prev.yPct < 15;
                if (isCurrSmall && !isPrevSmall) curr.isVisible = false;
                else if (isPrevSmall && !isCurrSmall) prev.isVisible = false;
                else if (isCurrSmall && isPrevSmall) {
                    if (curr.item.lineValue < prev.item.lineValue) curr.isVisible = false;
                    else prev.isVisible = false;
                }
            }
        }
        const visibleLabels = sortedLabels.filter(l => l.isVisible);
        for (let i = 1; i < visibleLabels.length; i++) {
            const prev = visibleLabels[i - 1];
            const curr = visibleLabels[i];
            if (curr.staggeredY - prev.staggeredY < MIN_DIST) {
                curr.staggeredY = prev.staggeredY + MIN_DIST;
            }
        }
        const maxStagger = Math.max(...visibleLabels.map(l => l.staggeredY), 0);
        if (maxStagger > 100) {
            const overflow = maxStagger - 100;
            for (let i = visibleLabels.length - 1; i >= 0; i--) {
                visibleLabels[i].staggeredY -= overflow;
                if (i < visibleLabels.length - 1) {
                    const next = visibleLabels[i + 1];
                    if (next.staggeredY - visibleLabels[i].staggeredY < MIN_DIST) {
                        visibleLabels[i].staggeredY = next.staggeredY - MIN_DIST;
                    }
                }
            }
        }
        return labels.sort((a, b) => a.idx - b.idx);
    }, [data, chartMaxLine]);

    return (
        <div className="w-full h-full flex flex-col relative">
            <div className="flex items-center justify-between mb-8">
                <div className="flex flex-col gap-0.5">
                    <h3 className="text-[12px] font-black text-slate-800 flex items-center gap-2">
                        <BarChart3 className="w-3.5 h-3.5 text-blue-600" />
                        {title}
                    </h3>
                    <p className="text-[9px] text-slate-400 font-bold pl-5 uppercase">{subtitle || 'Performans'}</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-3 mr-2">
                        <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-sm bg-blue-500" /><span className="text-[8px] font-bold text-slate-500 uppercase">Üretilen Modül</span></div>
                        <div className="flex items-center gap-1.5"><div className="w-2 h-0.5 bg-orange-500" /><span className="text-[8px] font-bold text-slate-500 uppercase">Haklılık Oranı</span></div>
                        <div className="flex items-center gap-1.5"><div className="w-2 h-0.5 border-t border-dashed border-red-500" /><span className="text-[8px] font-bold text-slate-500 uppercase">Hedef (%{targetLineValue})</span></div>
                    </div>
                    {children}
                </div>
            </div>
            
            <div className="flex-1 flex gap-2 relative">
                {/* Sol Eksen (Üretilen Modül) - 5 adım */}
                <div className="flex flex-col justify-between h-full pr-3 min-w-[50px] z-10 border-r border-slate-100" style={{ paddingBottom: `${paddingBottom}px` }}>
                    {[...Array.from({ length: 6 }, (_, i) => (chartMaxBar / 5) * i)].reverse().map((step, idx) => (
                        <span key={idx} className="text-[8px] font-black text-slate-500 text-right leading-none">
                            {Math.round(step).toLocaleString()}
                        </span>
                    ))}
                </div>

                <div className="flex-1 relative" style={{ paddingBottom: `${paddingBottom}px` }}>
                    {/* SVG Katmanı */}
                    <div className="absolute top-0 left-0 right-0 z-20 pointer-events-none" style={{ bottom: `${paddingBottom}px` }}>
                        <svg className="w-full h-full overflow-visible" preserveAspectRatio="none">
                            {data.map((item, idx) => {
                                const x = `${(idx + 0.5) * (100 / data.length)}%`;
                                const y = `${100 - ((item.lineValue / chartMaxLine) * 100)}%`;
                                const nextItem = data[idx + 1];
                                if (!nextItem) return null;
                                const nextX = `${(idx + 1.5) * (100 / data.length)}%`;
                                const nextY = `${100 - ((nextItem.lineValue / chartMaxLine) * 100)}%`;
                                return (
                                    <line key={`line-${idx}`} x1={x} y1={y} x2={nextX} y2={nextY} stroke="#f97316" strokeWidth="2" fill="none" />
                                );
                            })}
                            {data.map((item, idx) => {
                                const x = `${(idx + 0.5) * (100 / data.length)}%`;
                                const y = `${100 - ((item.lineValue / chartMaxLine) * 100)}%`;
                                return (
                                    <circle key={`dot-${idx}`} cx={x} cy={y} r="4.5" fill="#f97316" stroke="#ffffff" strokeWidth="2" className="drop-shadow-sm" />
                                );
                            })}
                            <line x1="0" y1={`${100 - ((targetLineValue / chartMaxLine) * 100)}%`} x2="100%" y2={`${100 - ((targetLineValue / chartMaxLine) * 100)}%`} stroke="#ef4444" strokeWidth="1.5" strokeDasharray="4 4" />
                            
                            {/* Staggered Leader Lines */}
                            {lineLabels.map((lbl) => {
                                const isHovered = hoveredIdx === lbl.idx;
                                const show = lbl.isVisible || isHovered;
                                if (!show) return null;
                                const x1 = `${(lbl.idx + 0.5) * (100 / data.length)}%`;
                                const y1 = `${100 - lbl.yPct}%`;
                                const x2 = `100%`;
                                const y2 = `${100 - (lbl.isVisible ? lbl.staggeredY : lbl.yPct)}%`;
                                return (
                                    <line key={`leader-${lbl.idx}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#fb923c" strokeWidth="1.5" strokeDasharray="3 3" className={`transition-all duration-300 ${isHovered ? 'opacity-100' : 'opacity-60'}`} />
                                );
                            })}
                        </svg>
                    </div>

                    {/* Hedef Çizgisi Etiketi */}
                    <div className="absolute top-0 left-0 right-0 z-20 pointer-events-none" style={{ bottom: `${paddingBottom}px` }}>
                        <div className="absolute z-20 right-0 pointer-events-none translate-x-[45px] sm:translate-x-0" style={{ bottom: `calc(${(targetLineValue / chartMaxLine) * 100}% + 2px)` }}>
                            <span className="text-[8px] font-bold text-red-500 bg-white/90 backdrop-blur-sm px-1 py-0.5 rounded shadow-sm border border-red-100 whitespace-nowrap">
                                Hedef: %{targetLineValue}
                            </span>
                        </div>
                    </div>

                    {/* Çizgi Nokta Etiketleri (Hata Oranı) */}
                    <div className="absolute top-0 left-0 right-0 z-30 pointer-events-none" style={{ bottom: `${paddingBottom}px` }}>
                        {lineLabels.map((lbl) => {
                            const isHovered = hoveredIdx === lbl.idx;
                            const show = lbl.isVisible || isHovered;
                            const currentY = lbl.isVisible ? lbl.staggeredY : lbl.yPct;
                            return (
                                <div key={`linelabel-${lbl.idx}`} className={`absolute flex items-center justify-end pointer-events-none transition-all duration-300 ${show ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`} style={{ bottom: `calc(${currentY}%)`, right: '0px', transform: 'translateY(50%)' }}>
                                    <div className="w-0 h-0 border-t-[3px] border-t-transparent border-b-[3px] border-b-transparent border-l-[4px] border-l-orange-500" />
                                    <div className="absolute left-full ml-2 flex items-center">
                                        <span className={`text-[9px] font-black text-orange-500 whitespace-nowrap z-30 transition-all duration-200 ${isHovered ? 'scale-110 text-orange-600' : ''}`}>
                                            %{formatRate(lbl.item.lineValue)}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Sütunlar (Modül Sayısı) */}
                    <div className="absolute top-0 left-0 right-0 flex items-end justify-around pointer-events-none" style={{ bottom: `${paddingBottom}px` }}>
                        {data.map((item, idx) => {
                            const barH = chartMaxBar > 0 ? (item.barValue / chartMaxBar) * 100 : 0;
                            return (
                                <div key={`bar-${idx}`} className="flex-1 flex flex-col items-center group relative h-full justify-end px-1 pointer-events-auto w-full" style={{ maxWidth: '45px' }} onMouseEnter={() => setHoveredIdx(idx)} onMouseLeave={() => setHoveredIdx(null)}>
                                    {/* Sütun Etiketi */}
                                    <div className="absolute z-40 pointer-events-none mb-1 transition-all opacity-90 group-hover:opacity-100 group-hover:-translate-y-1" style={{ bottom: `${Math.max(barH, 2)}%` }}>
                                        <span className="text-[8px] sm:text-[9px] font-black text-blue-700 bg-blue-50/95 backdrop-blur-sm px-1.5 py-0.5 rounded border border-blue-200 shadow-sm">
                                            {item.barValue.toLocaleString()}
                                        </span>
                                    </div>
                                    <div className="w-full rounded-t-sm bg-gradient-to-t from-blue-600 to-blue-400 shadow-sm transition-all duration-300 group-hover:brightness-110 group-hover:opacity-100 opacity-90 relative z-10" style={{ height: `${Math.max(barH, 2)}%` }} />
                                    {/* Alt X Ekseni Etiketi */}
                                    <div className="absolute w-0 overflow-visible" style={{ top: '100%', left: '50%', paddingTop: '6px' }}>
                                        <span title={item.label} className="font-black text-slate-600 uppercase tracking-tighter text-[7px] sm:text-[8px] whitespace-nowrap inline-block text-right transition-colors group-hover:text-blue-600" style={{ transform: 'translateX(-100%) rotate(-45deg)', transformOrigin: 'top right' }}>
                                            {item.label}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                        <div className="absolute left-0 right-0 h-[1.5px] bg-slate-400 bottom-0 pointer-events-none" />
                    </div>
                </div>

                {/* Sağ Eksen (Boş - değerler mutlak konumla üzerine biniyor) */}
                <div className="flex flex-col justify-between h-full min-w-[50px] z-10 border-l border-slate-100" style={{ paddingBottom: `${paddingBottom}px` }}>
                </div>
            </div>
        </div>
    );
}

function StackedErrorBarChart({ title, subtitle, data, allBrands, children }: { title: string, subtitle?: string, data: ErrorStat[], allBrands: string[], children?: React.ReactNode }) {
    const brandColors: Record<string, string> = {};
    const colorPalette = [
        'bg-blue-600',    // Blue
        'bg-emerald-500', // Green
        'bg-amber-500',   // Amber
        'bg-rose-500',    // Red
        'bg-violet-600',  // Violet
        'bg-orange-500',  // Orange
        'bg-indigo-600',  // Indigo
        'bg-teal-500',    // Teal
        'bg-fuchsia-500', // Fuchsia
        'bg-sky-500',     // Sky Blue
        'bg-lime-500',    // Lime
        'bg-pink-500'     // Pink
    ];
    allBrands.forEach((b, i) => brandColors[b] = colorPalette[i % colorPalette.length]);

    const maxTotal = Math.max(...data.map(d => d.totalCount), 1);

    return (
        <div className="w-full h-full flex flex-col">
            <div className="flex items-center justify-between mb-4">
                <div className="flex flex-col gap-0.5">
                    <h3 className="text-[12px] font-black text-slate-800 flex items-center gap-2">
                        <AlertCircle className="w-3.5 h-3.5 text-red-600" />
                        {title}
                    </h3>
                    <p className="text-[9px] text-slate-400 font-bold pl-5 uppercase">{subtitle || 'Hata Dağılımı'}</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 mr-2 border-r border-slate-100 pr-4">
                        {allBrands.map(b => (
                            <div key={b} className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${brandColors[b] || 'bg-slate-300'} shadow-sm flex-shrink-0`} />
                                <span className="text-[8px] font-black text-slate-700 uppercase tracking-tighter truncate max-w-[80px]">{b}</span>
                            </div>
                        ))}
                    </div>
                    {children}
                </div>
            </div>

            <div className="flex-1 flex gap-2 relative">
                <div className="absolute left-[38px] top-0 bottom-20 w-[1.5px] bg-slate-300 z-10" />
                <div className="flex flex-col justify-between h-full pb-20 pr-3 min-w-[38px]">
                    <span className="text-[8px] font-black text-slate-400 text-right">{maxTotal}</span>
                    <span className="text-[8px] font-black text-slate-400 text-right">{Math.round(maxTotal/2)}</span>
                    <span className="text-[8px] font-black text-slate-400 text-right">0</span>
                </div>
                <div className="flex-1 relative flex items-end justify-around pb-20">
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
                                                className={`${brandColors[b.brandName] || 'bg-slate-400'} w-full transition-all group-hover:brightness-110 flex items-center justify-center relative`}
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
                                <div className="absolute w-0 overflow-visible" style={{ top: '100%', left: '50%', paddingTop: '6px' }}>
                                    <span title={item.errorLabel} className="font-black text-slate-500 uppercase tracking-tighter text-[7px] sm:text-[8px] whitespace-nowrap inline-block text-right" style={{ transform: 'translateX(-100%) rotate(-45deg)', transformOrigin: 'top right' }}>
                                        {item.errorLabel}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                    <div className="absolute bottom-20 left-0 right-0 h-[1.5px] bg-slate-300" />
                </div>
            </div>
        </div>
    );
}

export default function DashboardPage() {
    const { user } = useAuthStore();
    const [mounted, setMounted] = useState(false);
    useEffect(() => { setMounted(true); }, []);
    
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [summaryStats, setSummaryStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [startDate, setStartDate] = useState<string>('');
    const [endDate, setEndDate] = useState<string>('');
    const [summaryStartDate, setSummaryStartDate] = useState<string>('');
    const [summaryEndDate, setSummaryEndDate] = useState<string>('');
    const [brandYear, setBrandYear] = useState<string>('Hepsi');
    const [brandFilter, setBrandFilter] = useState<string>('Hepsi');
    const [errorYear, setErrorYear] = useState<string>('Hepsi');
    const [sourceYear, setSourceYear] = useState<string>('Hepsi');
    const [c8Year, setC8Year] = useState<string>('Hepsi');
    const [c8Customer, setC8Customer] = useState<string>('Hepsi');
    const [c8Error, setC8Error] = useState<string>('Hepsi');

    const monthNames = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];

    const fetchStats = useCallback(async (start?: string, end?: string, brnd?: string) => {
        try {
            setLoading(true);
            const data = await complaintService.getDashboardStats(start || undefined, end || undefined, brnd || undefined);
            setStats(data);
            setSummaryStats(prev => (!prev && !start && !end) ? data : prev);
        } catch (error) { console.error(error); } finally { setLoading(false); }
    }, []);

    const fetchSummaryStats = useCallback(async (start?: string, end?: string) => {
        try {
            const data = await complaintService.getDashboardStats(start || undefined, end || undefined);
            setSummaryStats(data);
        } catch (error) { console.error(error); }
    }, []);

    useEffect(() => { fetchStats(startDate, endDate); }, [startDate, endDate, fetchStats]);
    useEffect(() => { 
        if (summaryStartDate || summaryEndDate) {
            fetchSummaryStats(summaryStartDate, summaryEndDate); 
        } else {
            setSummaryStats(prev => prev || stats);
        }
    }, [summaryStartDate, summaryEndDate, fetchSummaryStats, stats]);

    const fetchBrandStats = useCallback(async () => {
        try {
            let sDate = undefined, eDate = undefined;
            if (brandYear !== 'Hepsi') { sDate = `${brandYear}-01-01`; eDate = `${brandYear}-12-31`; }
            const brnd = brandFilter === 'Hepsi' ? undefined : brandFilter;
            const data = await complaintService.getDashboardStats(sDate, eDate, brnd);
            setStats(prev => prev ? { ...prev, brandStats: data.brandStats } : data);
        } catch (error) { console.error(error); }
    }, [brandYear, brandFilter]);

    const fetchErrorStats = useCallback(async () => {
        try {
            let sDate = undefined, eDate = undefined;
            if (errorYear !== 'Hepsi') { sDate = `${errorYear}-01-01`; eDate = `${errorYear}-12-31`; }
            const data = await complaintService.getDashboardStats(sDate, eDate);
            setStats(prev => prev ? { ...prev, errorStats: data.errorStats } : data);
        } catch (error) { console.error(error); }
    }, [errorYear]);

    const fetchSourceStats = useCallback(async () => {
        try {
            let sDate = undefined, eDate = undefined;
            if (sourceYear !== 'Hepsi') { sDate = `${sourceYear}-01-01`; eDate = `${sourceYear}-12-31`; }
            const data = await complaintService.getDashboardStats(sDate, eDate);
            setStats(prev => prev ? { ...prev, sourceStats: data.sourceStats } : data);
        } catch (error) { console.error(error); }
    }, [sourceYear]);

    const fetchC8Stats = useCallback(async () => {
        try {
            let sDate = undefined, eDate = undefined;
            if (c8Year !== 'Hepsi') { sDate = `${c8Year}-01-01`; eDate = `${c8Year}-12-31`; }
            const cust = c8Customer === 'Hepsi' ? undefined : c8Customer;
            const err = c8Error === 'Hepsi' ? undefined : c8Error;
            const data = await complaintService.getDashboardStats(sDate, eDate, undefined, cust, err);
            console.log('DEBUG C8 DATA:', data.customerErrorStats);
            setStats(prev => prev ? { ...prev, customerErrorStats: data.customerErrorStats } : data);
        } catch (error) { console.error(error); }
    }, [c8Year, c8Customer, c8Error]);

    useEffect(() => { if (stats) fetchBrandStats(); }, [brandYear, brandFilter, fetchBrandStats]); // eslint-disable-line react-hooks/exhaustive-deps
    useEffect(() => { if (stats) fetchErrorStats(); }, [errorYear, fetchErrorStats]); // eslint-disable-line react-hooks/exhaustive-deps
    useEffect(() => { if (stats) fetchSourceStats(); }, [sourceYear, fetchSourceStats]); // eslint-disable-line react-hooks/exhaustive-deps
    useEffect(() => { if (stats) fetchC8Stats(); }, [c8Year, c8Customer, c8Error, fetchC8Stats]); // eslint-disable-line react-hooks/exhaustive-deps


    const topMetrics = [
        { label: 'Toplam Şikayet', value: summaryStats?.totalComplaints || 0, icon: <FileText className="w-4 h-4 text-blue-600" />, color: 'bg-blue-50 border-blue-100' },
        { label: 'Açık Şikayetler', value: summaryStats?.openComplaints || 0, icon: <Clock className="w-4 h-4 text-amber-600" />, color: 'bg-amber-50 border-amber-100' },
        { label: 'Kapalı Şikayetler', value: summaryStats?.closedComplaints || 0, icon: <CheckCircle2 className="w-4 h-4 text-slate-600" />, color: 'bg-slate-50 border-slate-100' },
        { label: 'Haklı Şikayet Oranı', value: `%${(summaryStats?.justifiedRatio || 0).toFixed(4)}`, icon: <TrendingUp className="w-4 h-4 text-emerald-600" />, color: 'bg-emerald-50 border-emerald-100' },
        { label: 'Haklı Ürün', value: summaryStats?.totalJustifiedProducts || 0, icon: <CheckCircle2 className="w-4 h-4 text-emerald-500" />, color: 'bg-emerald-50 border-emerald-100' },
        { label: 'Haksız Ürün', value: summaryStats?.totalUnjustifiedProducts || 0, icon: <AlertCircle className="w-4 h-4 text-red-500" />, color: 'bg-red-50 border-red-100' },
    ];

    if (loading && !stats) return <AppLayout><div className="flex items-center justify-center min-h-[400px]"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div></AppLayout>;

    return (
        <AppLayout>
            <div className="space-y-4 -mt-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Dashboard</h1>
                    {mounted && !user && (
                        <Link href="/login" className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-bold text-sm hover:bg-blue-700 transition-colors shadow-sm">
                            <LogIn className="w-4 h-4" />
                            Giriş Yap
                        </Link>
                    )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-12" style={{ height: 'calc(100vh - 90px)', minHeight: '600px', gridTemplateRows: 'repeat(2, minmax(0, 1fr))' }}>
                    {/* Q1, Q2, Q3, Q4 remain the same */}
                    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col min-h-0 overflow-hidden">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-[12px] font-black text-slate-800 flex items-center gap-2">
                                <Activity className="w-3.5 h-3.5 text-blue-600" />
                                Dönemsel Özet
                            </h3>
                            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg p-1 z-20 relative">
                                <Clock className="w-3 h-3 text-slate-400 ml-1" />
                                <input type="date" className="text-[9px] font-bold text-slate-600 bg-transparent outline-none min-w-[85px] cursor-pointer" value={summaryStartDate} onChange={e => setSummaryStartDate(e.target.value)} />
                                <span className="text-[9px] text-slate-400">-</span>
                                <input type="date" className="text-[9px] font-bold text-slate-600 bg-transparent outline-none min-w-[85px] cursor-pointer" value={summaryEndDate} onChange={e => setSummaryEndDate(e.target.value)} />
                            </div>
                        </div>
                        <div className="grid grid-cols-3 grid-rows-2 gap-3 flex-1">
                            {topMetrics.map((m) => (
                                <div key={m.label} className={`p-3 rounded-xl border ${m.color} flex flex-col justify-between shadow-sm transition-all hover:shadow-md`}>
                                    <div className="flex items-center justify-between"><span className="p-1 bg-white rounded shadow-sm">{m.icon}</span></div>
                                    <div>
                                        <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">{m.label}</p>
                                        <p className="text-xl font-black text-slate-900 mt-0.5">{m.value}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col min-h-0 overflow-hidden">
                        {stats?.justificationChart ? (
                            <GenericBarChart title="Haklılık Oranı (%)" subtitle="Yıllık Dönemsel Durum"
                                data={[
                                    { label: '1. ALTI AY', value: stats.justificationChart.firstHalfRate, color: 'from-blue-500 to-indigo-600' },
                                    { label: '2. ALTI AY', value: stats.justificationChart.secondHalfRate, color: 'from-indigo-400 to-indigo-600' },
                                    { label: '2021-Bugün', value: stats.justificationChart.cumulativeRate, color: 'from-emerald-500 to-teal-600' }
                                ]}
                            />
                        ) : <div className="flex-1 flex items-center justify-center text-slate-400">Veri Yüklenemedi</div>}
                    </div>

                    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col min-h-0 overflow-hidden">
                        {stats?.yearlyStats ? (
                            <ComboChart title="Yıllık Haklılık Oranı" subtitle="Tüm Yılların Karşılaştırması" paddingBottom={40} targetLineValue={0.04}
                                data={stats.yearlyStats.map(y => ({ label: y.year.toString(), barValue: y.productionCount, lineValue: y.rate }))}
                            />
                        ) : <div className="flex-1 flex items-center justify-center text-slate-400">Yıllık Veri Bekleniyor...</div>}
                    </div>

                    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col min-h-0 overflow-hidden">
                        {stats?.monthlyJustificationStats ? (
                            <ComboChart paddingBottom={40} targetLineValue={0.04}
                                title={`${endDate ? new Date(endDate).getFullYear() : new Date().getFullYear()} Aylık Haklılık Oranı`} 
                                subtitle="Ay Bazlı Performans Dağılımı"
                                data={stats.monthlyJustificationStats.map(m => ({ label: monthNames[m.month - 1].toUpperCase(), barValue: m.productionCount, lineValue: m.rate }))}
                            >
                                <select className="text-[10px] font-black text-blue-600 bg-blue-50 border border-blue-100 rounded-lg px-2 py-1 relative z-20"
                                    value={endDate ? new Date(endDate).getFullYear().toString() : new Date().getFullYear().toString()}
                                    onChange={(e) => { const year = e.target.value; setEndDate(`${year}-12-31`); setStartDate(`${year}-01-01`); }}
                                >
                                    {(stats?.yearlyStats || []).map(y => ( <option key={y.year} value={y.year}>{y.year}</option> ))}
                                </select>
                            </ComboChart>
                        ) : <div className="flex-1 flex items-center justify-center text-slate-400">Aylık Veri Bekleniyor...</div>}
                    </div>
                </div>

                <div className="analytics-section">
                    <div className="analytics-grid">
                        {/* 5. Brand */}
                        <div className="analytics-card">
                        <DualBarChart 
                            title="Marka Bazlı Şikayet & Haklılık" 
                            v1Label="Şikayet (Adet)" v2Label="Haklılık (%)"
                            subtitle={brandYear === 'Hepsi' && brandFilter !== 'Hepsi' ? `${brandFilter} - Yıllık Performans Dağılımı` : "Detaylı Performans Bilgileri"}
                            data={(stats?.brandStats || []).map(b => ({ label: b.brandName, v1: b.complaintCount, v2: b.justificationRate, v2IsRate: true }))}
                        >
                            <div className="flex items-center gap-2">
                                <select className="text-[9px] font-black text-blue-600 bg-blue-50 border border-blue-100 rounded px-1 py-1 outline-none"
                                    value={brandYear} onChange={(e) => setBrandYear(e.target.value)}>
                                    <option value="Hepsi">YIL: HEPSİ</option>
                                    {(stats?.yearlyStats || []).map(y => ( <option key={y.year} value={y.year}>{y.year}</option> ))}
                                </select>
                                <select className="text-[9px] font-black text-emerald-600 bg-emerald-50 border border-emerald-100 rounded px-1 py-1 outline-none"
                                    value={brandFilter} onChange={(e) => setBrandFilter(e.target.value)}>
                                    <option value="Hepsi">MARKA: HEPSİ</option>
                                    {(stats?.allBrands || []).map(b => ( <option key={b} value={b}>{b}</option> ))}
                                </select>
                            </div>
                        </DualBarChart>
                    </div>

                        {/* 6. Error Analysis */}
                        <div className="analytics-card">
                        <StackedErrorBarChart 
                            title="Hata Tanımları & Marka Kıyaslaması" 
                            subtitle={errorYear === 'Hepsi' ? "Tüm Zamanlar Hata Dağılımı" : `${errorYear} Yılı Hata Analizi`}
                            data={stats?.errorStats || []} allBrands={stats?.allBrands || []}
                        >
                            <select className="text-[9px] font-black text-red-600 bg-red-50 border border-red-100 rounded px-1 py-1 outline-none"
                                value={errorYear} onChange={(e) => setErrorYear(e.target.value)}>
                                <option value="Hepsi">YIL: HEPSİ</option>
                                {(stats?.yearlyStats || []).map(y => ( <option key={y.year} value={y.year}>{y.year}</option> ))}
                            </select>
                        </StackedErrorBarChart>
                    </div>

                        {/* 7. Production Site */}
                        <div className="analytics-card">
                        <DualBarChart 
                            title="Şikayet - Üretim Tesisi Dağılışı" 
                            subtitle={sourceYear === 'Hepsi' ? "HSA1, HSA2 ve Diğer Kaynak Analizi" : `${sourceYear} Yılı HSA Analizi`}
                            v1Label="Şikayet" v2Label="Haklılık (%)"
                            data={(stats?.sourceStats || []).map(s => ({ 
                                label: s.sourceLabel, 
                                v1: s.totalCount, 
                                v2: s.justificationRate || 0,
                                v2IsRate: true
                            }))}
                        >
                            <select className="text-[9px] font-black text-indigo-600 bg-indigo-50 border border-indigo-100 rounded px-1 py-1 outline-none"
                                value={sourceYear} onChange={(e) => setSourceYear(e.target.value)}>
                                <option value="Hepsi">YIL: HEPSİ</option>
                                {(stats?.yearlyStats || []).map(y => ( <option key={y.year} value={y.year}>{y.year}</option> ))}
                            </select>
                        </DualBarChart>
                    </div>

                        {/* 8. Customer Error Analysis */}
                        <div className="analytics-card">
                            <GenericBarChart 
                                title="Müşteriye Göre Hata Tanımı" 
                                subtitle={c8Customer !== 'Hepsi' ? `${c8Customer} Hata Dağılımı` : c8Error !== 'Hepsi' ? `${c8Error} Bildiren Müşteriler` : "Müşteri ve Hata Oranı"}
                                barColor="from-violet-600 to-purple-400"
                                rotateLabels={true} paddingBottom={70}
                                isRate={true}
                                data={(stats?.customerErrorStats || []).map(c => ({ label: c.label, value: c.defectRate }))}
                            >
                                <div className="flex items-center gap-1">
                                    <select className="text-[8px] font-black text-violet-600 bg-violet-50 border border-violet-100 rounded px-1 py-1 outline-none"
                                        value={c8Year} onChange={(e) => setC8Year(e.target.value)}>
                                        <option value="Hepsi">YIL</option>
                                        {(stats?.yearlyStats || []).map(y => ( <option key={y.year} value={y.year}>{y.year}</option> ))}
                                    </select>
                                    <select className="text-[8px] font-black text-violet-600 bg-violet-50 border border-violet-100 rounded px-1 py-1 outline-none"
                                        value={c8Customer} onChange={(e) => setC8Customer(e.target.value)}>
                                        <option value="Hepsi">MÜŞTERİ</option>
                                        {(stats?.allCustomers || []).map(c => ( <option key={c} value={c}>{c}</option> ))}
                                    </select>
                                    <select className="text-[8px] font-black text-violet-600 bg-violet-50 border border-violet-100 rounded px-1 py-1 outline-none"
                                        value={c8Error} onChange={(e) => setC8Error(e.target.value)}>
                                        <option value="Hepsi">HATA</option>
                                        {(stats?.allErrorLabels || []).map(e => ( <option key={e} value={e}>{e}</option> ))}
                                    </select>
                                </div>
                            </GenericBarChart>
                        </div>
                    </div>
                </div>
                
                <div className="mt-8">
                    <ComplaintList hideActions={!user} />
                </div>
            </div>
        </AppLayout>
    );
}
