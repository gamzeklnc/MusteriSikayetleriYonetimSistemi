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
    Settings,
    Activity,
    Factory,
    Truck,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

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
        `flex items-center gap-3 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${isActive(href)
            ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/10'
            : 'text-slate-300 hover:bg-white/10 hover:text-white'
        }`;

    return (
        <aside className="flex flex-col w-64 h-full bg-[#002A3A] border-r border-slate-700/50">
            {/* Logo Section */}
            <div className="px-6 pt-5 pb-4 mb-2 border-b border-white/5 bg-gradient-to-b from-white/5 to-transparent">
                <div className="flex flex-col items-center gap-3">
                    <div className="bg-white p-3 rounded-xl w-full flex items-center justify-center shadow-2xl shadow-black/40 transform hover:scale-[1.02] transition-transform duration-300">
                        <Image src="/hsa-logo.png" alt="HSA Enerji" width={40} height={32} className="h-8 w-auto object-contain" />
                    </div>
                    <div className="text-center">
                        <h1 className="text-white font-extrabold text-xs tracking-tight leading-snug drop-shadow-[0_2px_3px_rgba(0,0,0,1)] uppercase">
                            Müşteri Şikayetleri <br /> 
                            <span className="text-blue-400">Yönetim Sistemi</span>
                        </h1>
                    </div>
                </div>
            </div>

            {/* Nav */}
            <nav className="flex-1 px-3 space-y-0 overflow-hidden">
                <div className="pb-1 px-3">
                    <span className="text-[10px] font-bold text-slate-500  tracking-widest">Genel</span>
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

                <div className="pt-2 pb-1 px-3">
                    <span className="text-[10px] font-bold text-slate-500  tracking-widest">İş Akış Adımları</span>
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

                {mounted && (user?.departmentId === 4 || user?.role === 'Admin') && (
                <Link href="/complaints/approval" className={linkClass('/complaints/approval')}>
                    <UserCheck size={18} />
                    Yönetim Onayı
                </Link>
                )}

                <Link href="/complaints/customer-response" className={linkClass('/complaints/customer-response')}>
                    <MessageCircle size={18} />
                    Müşteriye Geri Dönüş
                </Link>

                <div className="pt-2 pb-1 px-3">
                    <span className="text-[10px] font-bold text-slate-500  tracking-widest">Operasyon</span>
                </div>

                {/* Aksiyonlar */}
                <Link href="/complaints/actions" className={linkClass('/complaints/actions')}>
                    <Activity size={18} />
                    Aksiyonlar
                </Link>

                {/* Üretim Sayıları */}
                <Link href="/production-counts" className={linkClass('/production-counts')}>
                    <Factory size={18} />
                    Üretim Adetleri
                </Link>

                {/* Sevk Sayıları */}
                <Link href="/shipment-counts" className={linkClass('/shipment-counts')}>
                    <Truck size={18} />
                    Sevk Adetleri
                </Link>

                {mounted && user?.role === 'Admin' && (
                    <>
                        <div className="pt-2 pb-1 px-3">
                            <span className="text-[10px] font-bold text-slate-500 tracking-widest">Yönetim</span>
                        </div>

                        <Link href="/complaints/admin" className={linkClass('/complaints/admin')}>
                            <Settings size={18} />
                            Admin Paneli
                        </Link>
                    </>
                )}
            </nav>

            {/* User Profile / Status */}
            {mounted && user && (
                <div className="px-3 py-2 mx-3 mb-2 bg-white/5 rounded-xl border border-white/5">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold text-xs ">
                            {user.name[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-white truncate capitalize">{user.name}</p>
                            <p className="text-[10px] text-slate-500 font-medium truncate">{user.email}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Logout */}
            <div className="px-3 py-4 border-t border-white/5">
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
