import Sidebar from '@/components/layout/Sidebar';

export default function AppLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex h-screen bg-slate-100 overflow-hidden">
            <Sidebar />
            <main className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden">
                <div className="p-8 max-w-full overflow-x-hidden">{children}</div>
            </main>
        </div>
    );
}
