'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import {
    LayoutDashboard,
    ClipboardList,
    LogOut,
    FilePlus,
    FileCheck,
    UserCheck,
    MessageCircle,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';

export default function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const { logout, user } = useAuthStore();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const handleLogout = () => {
        logout();
        router.push('/login');
    };

    const isActive = (href: string) => pathname === href;
    const linkClass = (href: string) =>
        `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${isActive(href)
            ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
            : 'text-slate-300 hover:bg-slate-800 hover:text-white'
        }`;

    return (
        <aside className="flex flex-col w-64 min-h-screen bg-slate-900 border-r border-slate-800">
            {/* Logo */}
            <div className="px-6 py-6 mb-2">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                    </div>
                    <div>
                        <h1 className="text-white font-bold text-sm leading-tight">
                            Şikayet Yönetim
                        </h1>
                        <span className="text-slate-500 text-[10px] uppercase tracking-wider font-semibold">Kurumsal Sistem</span>
                    </div>
                </div>
            </div>

            {/* Nav */}
            <nav className="flex-1 overflow-y-auto px-3 space-y-1">
                <div className="pb-2 px-3">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Genel</span>
                </div>

                {/* Dashboard */}
                <Link href="/dashboard" className={linkClass('/dashboard')}>
                    <LayoutDashboard size={18} />
                    Dashboard
                </Link>

                {/* Şikayetler */}
                <Link href="/complaints" className={linkClass('/complaints')}>
                    <ClipboardList size={18} />
                    Şikayetler
                </Link>

                <div className="pt-6 pb-2 px-3">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">İş Akış Adımları</span>
                </div>

                {/* Workflow Steps - Herkese Görünür */}
                <Link href="/complaints/new" className={linkClass('/complaints/new')}>
                    <FilePlus size={18} />
                    Şikayet Kaydı
                </Link>

                <Link href="/complaints/quality-report" className={linkClass('/complaints/quality-report')}>
                    <FileCheck size={18} />
                    Kalite Raporlaması
                </Link>

                <Link href="/complaints/approval" className={linkClass('/complaints/approval')}>
                    <UserCheck size={18} />
                    Yönetim Onayı
                </Link>

                <Link href="/complaints/customer-response" className={linkClass('/complaints/customer-response')}>
                    <MessageCircle size={18} />
                    Müşteriye Geri Dönüş
                </Link>
            </nav>

            {/* User Profile / Status */}
            {mounted && user && (
                <div className="px-4 py-3 mx-3 mb-2 bg-slate-800/50 rounded-xl border border-slate-800">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold text-xs uppercase">
                            {user.email[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-white truncate">{user.email}</p>
                            <p className="text-[10px] text-slate-500 font-medium">{user.role}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Logout */}
            <div className="px-3 py-4 border-t border-slate-800">
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:bg-red-600/10 hover:text-red-400 transition-colors"
                >
                    <LogOut size={18} />
                    Güvenli Çıkış
                </button>
            </div>
        </aside>
    );
}
