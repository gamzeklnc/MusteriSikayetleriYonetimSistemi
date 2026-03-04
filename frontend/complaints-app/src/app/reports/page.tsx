import AppLayout from '@/components/layout/AppLayout';

export default function ReportsPage() {
    return (
        <AppLayout>
            <h1 className="text-2xl font-bold text-slate-800 mb-6">Raporlar</h1>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <h2 className="text-base font-semibold text-slate-700 mb-2">Durum Dağılımı</h2>
                    <p className="text-slate-400 text-sm">Grafik burada görünecek...</p>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <h2 className="text-base font-semibold text-slate-700 mb-2">Departman Bazlı</h2>
                    <p className="text-slate-400 text-sm">Grafik burada görünecek...</p>
                </div>
            </div>
        </AppLayout>
    );
}
