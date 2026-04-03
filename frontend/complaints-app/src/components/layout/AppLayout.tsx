import Sidebar from '@/components/layout/Sidebar';

export default function AppLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex h-screen bg-slate-100 overflow-hidden">
            <Sidebar />
            <main className="flex-1 overflow-y-auto">
                <div className="p-8">{children}</div>
            </main>
        </div>
    );
}
