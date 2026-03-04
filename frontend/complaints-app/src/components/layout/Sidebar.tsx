'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    ClipboardList,
    Building2,
    Users,
    Settings,
    BarChart3,
    ChevronDown,
    ChevronRight,
    LogOut,
} from 'lucide-react';
import { useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';

const departments = [
    { name: 'Satış', slug: 'sales', id: 1 },
    { name: 'Kalite', slug: 'quality', id: 2 },
    { name: 'Kalite Güvence', slug: 'quality-assurance', id: 3 },
    { name: 'Yönetim', slug: 'management', id: 4 },
    { name: 'Admin', slug: 'admin', id: 5 },
];

export default function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const { logout } = useAuthStore();
    const [complaintsOpen, setComplaintsOpen] = useState(true);
    const [deptsOpen, setDeptsOpen] = useState(false);

    const handleLogout = () => {
        logout();
        router.push('/login');
    };

    const isActive = (href: string) => pathname === href;
    const linkClass = (href: string) =>
        `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive(href)
            ? 'bg-blue-600 text-white'
            : 'text-slate-300 hover:bg-slate-700 hover:text-white'
        }`;

    return (
        <aside className="flex flex-col w-64 min-h-screen bg-slate-900 border-r border-slate-700">
            {/* Logo */}
            <div className="px-6 py-5 border-b border-slate-700">
                <h1 className="text-white font-bold text-base leading-tight">
                    Şikayet Yönetim
                    <br />
                    <span className="text-blue-400 text-xs font-normal">Sistemi</span>
                </h1>
            </div>

            {/* Nav */}
            <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">

                {/* Dashboard */}
                <Link href="/dashboard" className={linkClass('/dashboard')}>
                    <LayoutDashboard size={18} />
                    Dashboard
                </Link>

                {/* Şikayetler */}
                <div>
                    <button
                        onClick={() => setComplaintsOpen(!complaintsOpen)}
                        className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                    >
                        <ClipboardList size={18} />
                        <span className="flex-1 text-left">Şikayetler</span>
                        {complaintsOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    </button>
                    {complaintsOpen && (
                        <div className="ml-6 mt-1 space-y-1">
                            <Link href="/complaints" className={linkClass('/complaints')}>
                                Tüm Şikayetler
                            </Link>
                        </div>
                    )}
                </div>

                {/* Departmanlar */}
                <div>
                    <button
                        onClick={() => setDeptsOpen(!deptsOpen)}
                        className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                    >
                        <Building2 size={18} />
                        <span className="flex-1 text-left">Departmanlar</span>
                        {deptsOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    </button>
                    {deptsOpen && (
                        <div className="ml-6 mt-1 space-y-1">
                            {departments.map((dept) => (
                                <Link
                                    key={dept.id}
                                    href={`/departments/${dept.slug}`}
                                    className={linkClass(`/departments/${dept.slug}`)}
                                >
                                    {dept.name}
                                </Link>
                            ))}
                        </div>
                    )}
                </div>

                <div className="border-t border-slate-700 my-2" />

                {/* Kullanıcı Yönetimi */}
                <Link href="/users" className={linkClass('/users')}>
                    <Users size={18} />
                    Kullanıcı Yönetimi
                </Link>

                {/* Sistem Ayarları */}
                <Link href="/settings" className={linkClass('/settings')}>
                    <Settings size={18} />
                    Sistem Ayarları
                </Link>

                {/* Raporlar */}
                <Link href="/reports" className={linkClass('/reports')}>
                    <BarChart3 size={18} />
                    Raporlar
                </Link>
            </nav>

            {/* Logout */}
            <div className="px-3 py-4 border-t border-slate-700">
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:bg-red-600/20 hover:text-red-400 transition-colors"
                >
                    <LogOut size={18} />
                    Çıkış Yap
                </button>
            </div>
        </aside>
    );
}
