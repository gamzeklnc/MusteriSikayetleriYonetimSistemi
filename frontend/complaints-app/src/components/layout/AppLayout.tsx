'use client';

import Sidebar from '@/components/layout/Sidebar';
import { useAuthStore } from '@/store/authStore';
import { useState, useEffect } from 'react';

export default function AppLayout({ children }: { children: React.ReactNode }) {
    const { user } = useAuthStore();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    return (
        <div className="flex h-screen bg-slate-100 overflow-hidden">
            {mounted && user && <Sidebar />}
            <main className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden">
                <div className="p-8 max-w-full overflow-x-hidden">{children}</div>
            </main>
        </div>
    );
}
