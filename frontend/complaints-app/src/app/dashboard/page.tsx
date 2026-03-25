'use client';

import { useEffect, useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { complaintService } from '@/services/complaintService';
import { DashboardStats } from '@/types/complaint';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
    AreaChart, Area, Legend 
} from 'recharts';
import { 
    FileText, CheckCircle2, Clock, AlertCircle, 
    TrendingUp, BarChart3, RefreshCw 
} from 'lucide-react';

export default function DashboardPage() {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchStats = async () => {
        try {
            setLoading(true);
            const data = await complaintService.getDashboardStats();
            console.log('Dashboard Data Received:', data);
            setStats(data);
        } catch (error) {
            console.error('İstatistikler yüklenemedi:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, []);

    if (loading && !stats) {
        return (
            <AppLayout>
                <div className="flex items-center justify-center min-h-[400px]">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
            </AppLayout>
        );
    }

    const kpiCards = [
        { 
            label: 'Toplam Şikayet', 
            value: stats?.totalComplaints || 0, 
            icon: <FileText className="w-6 h-6 text-blue-600" />,
            color: 'border-blue-100 bg-blue-50/50'
        },
        { 
            label: 'Açık Şikayetler', 
            value: stats?.openComplaints || 0, 
            icon: <Clock className="w-6 h-6 text-amber-600" />,
            color: 'border-amber-100 bg-amber-50/50'
        },
        { 
            label: 'Kapalı Şikayetler', 
            value: stats?.closedComplaints || 0, 
            icon: <CheckCircle2 className="w-6 h-6 text-slate-600" />,
            color: 'border-slate-100 bg-slate-50/50'
        },
        { 
            label: 'Haklılık Oranı', 
            value: `${((stats?.justifiedRatio || 0) * 100).toFixed(1)}%`, 
            icon: <TrendingUp className="w-6 h-6 text-emerald-600" />,
            color: 'border-emerald-100 bg-emerald-50/50'
        },
        { 
            label: 'Haklı Ürün', 
            value: stats?.totalJustifiedProducts || 0, 
            icon: <CheckCircle2 className="w-6 h-6 text-emerald-500" />,
            color: 'border-emerald-100 bg-emerald-50/30'
        },
        { 
            label: 'Haksız Ürün', 
            value: stats?.totalUnjustifiedProducts || 0, 
            icon: <AlertCircle className="w-6 h-6 text-red-500" />,
            color: 'border-red-100 bg-red-50/30'
        },
    ];

    return (
        <AppLayout>
            <div className="space-y-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Performans Özeti</h1>
                        <p className="text-slate-500 text-sm mt-1">Sistem genelindeki şikayet istatistikleri ve KPI takibi.</p>
                    </div>
                    <button 
                        onClick={fetchStats}
                        disabled={loading}
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all disabled:opacity-50"
                    >
                        <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6">
                    {kpiCards.map((card) => (
                        <div key={card.label} className={`p-6 rounded-2xl border ${card.color} shadow-sm transition-all hover:shadow-md`}>
                            <div className="flex items-center justify-between mb-4">
                                <span className="p-2 bg-white rounded-xl shadow-sm border border-white/50">{card.icon}</span>
                            </div>
                            <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">{card.label}</p>
                            <p className="text-3xl font-black text-slate-900 mt-2">{card.value}</p>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Dönemsel Şikayet Sayısı */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                        <div className="flex items-center gap-2 mb-6">
                            <BarChart3 className="w-5 h-5 text-indigo-600" />
                            <h2 className="text-lg font-bold text-slate-900">Dönemsel Şikayet Sayısı</h2>
                        </div>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={stats?.monthlyStats}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                                    <Tooltip 
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                        cursor={{ fill: '#f8fafc' }}
                                    />
                                    <Bar dataKey="count" name="Şikayet Sayısı" fill="#4f46e5" radius={[4, 4, 0, 0]} barSize={32} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Kümülatif Şikayet Sayısı */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                        <div className="flex items-center gap-2 mb-6">
                            <TrendingUp className="w-5 h-5 text-emerald-600" />
                            <h2 className="text-lg font-bold text-slate-900">Kümülatif Şikayet Artışı</h2>
                        </div>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={stats?.monthlyStats}>
                                    <defs>
                                        <linearGradient id="colorCum" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                                    <Tooltip 
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Area 
                                        type="monotone" 
                                        dataKey="cumulativeCount" 
                                        name="Kümülatif Toplam" 
                                        stroke="#10b981" 
                                        strokeWidth={3}
                                        fillOpacity={1} 
                                        fill="url(#colorCum)" 
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}