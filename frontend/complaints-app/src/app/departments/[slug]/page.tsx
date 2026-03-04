import AppLayout from '@/components/layout/AppLayout';

interface Props {
    params: Promise<{ slug: string }>;
}

const departmentNames: Record<string, string> = {
    sales: 'Satış',
    quality: 'Kalite',
    'quality-assurance': 'Kalite Güvence',
    management: 'Yönetim',
    admin: 'Admin',
};

export default async function DepartmentPage({ params }: Props) {
    const resolvedParams = await params;
    const deptName = departmentNames[resolvedParams.slug] ?? resolvedParams.slug;

    return (
        <AppLayout>
            <div>
                <h1 className="text-2xl font-bold text-slate-800 mb-2">{deptName} Departmanı</h1>
                <p className="text-slate-500 mb-6">Bu departmana atanmış şikayetler listesi.</p>
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <p className="text-slate-400 text-sm">Şikayetler yükleniyor...</p>
                </div>
            </div>
        </AppLayout>
    );
}
