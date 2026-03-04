import AppLayout from '@/components/layout/AppLayout';

export default function DashboardPage() {
    return (
        <AppLayout>
            <div>
                <h1 className="text-2xl font-bold text-slate-800 mb-2">Dashboard</h1>
                <p className="text-slate-500">Genel istatistikler ve son aktiviteler burada görünecek.</p>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
                    {[
                        { label: 'Toplam Şikayet', value: '—', color: 'bg-blue-500' },
                        { label: 'Açık', value: '—', color: 'bg-yellow-500' },
                        { label: 'İşlemde', value: '—', color: 'bg-orange-500' },
                        { label: 'Çözüldü', value: '—', color: 'bg-green-500' },
                    ].map((card) => (
                        <div key={card.label} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                            <div className={`w-3 h-3 rounded-full ${card.color} mb-3`} />
                            <p className="text-sm text-slate-500">{card.label}</p>
                            <p className="text-3xl font-bold text-slate-800 mt-1">{card.value}</p>
                        </div>
                    ))}
                </div>
            </div>
        </AppLayout>
    );
}
