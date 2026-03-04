import AppLayout from '@/components/layout/AppLayout';

export default function ComplaintsPage() {
    return (
        <AppLayout>
            <div>
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-2xl font-bold text-slate-800">Tüm Şikayetler</h1>
                    <button className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
                        + Yeni Şikayet
                    </button>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <p className="text-slate-400 text-sm">Şikayet listesi burada görünecek...</p>
                </div>
            </div>
        </AppLayout>
    );
}
