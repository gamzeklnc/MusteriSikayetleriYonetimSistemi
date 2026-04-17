'use client';

import { useEffect, useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { complaintService } from '@/services/complaintService';
import { departmentService } from '@/services/departmentService';
import { userService } from '@/services/userService';
import { errorOptionService } from '@/services/errorOptionService';
import { userActivityLogService } from '@/services/userActivityLogService';
import { ComplaintDto, ComplaintStatus } from '@/types/complaint';
import { Department } from '@/types/department';
import { User, CreateUserRequest, UpdateUserRequest } from '@/types/user';
import { ErrorDefinitionOption } from '@/types/errorOption';
import { UserActivityLogDto } from '@/types/userActivityLog';
import { ClipboardList, Settings, Plus, Edit2, Trash2, ShieldAlert, CheckCircle2, XCircle, RotateCcw, ChevronDown, ChevronUp, UserPlus, History } from 'lucide-react';
import DocumentSection from '@/components/complaints/DocumentSection';
import StatusBadge from '@/components/complaints/StatusBadge';
import { ComplaintDocument } from '@/types/complaint';


export default function AdminPage() {
    const [activeTab, setActiveTab] = useState<'complaints' | 'users' | 'history' | 'settings'>('complaints');
    const [complaints, setComplaints] = useState<ComplaintDto[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [errorOptions, setErrorOptions] = useState<ErrorDefinitionOption[]>([]);
    const [activityLogs, setActivityLogs] = useState<UserActivityLogDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDeleting, setIsDeleting] = useState<number | null>(null);
    const [editingComplaint, setEditingComplaint] = useState<ComplaintDto | null>(null);

    // Accordion State
    const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
        basic: true,
        product: false,
        status: false
    });

    const toggleSection = (section: string) => {
        setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
    };

    // User Management States
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [isUserModalOpen, setIsUserModalOpen] = useState(false);
    const [userForm, setUserForm] = useState<Partial<CreateUserRequest>>({
        name: '', email: '', password: '', role: 'User', departmentId: 2
    });

    // Error Option States
    const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);
    const [editingErrorOption, setEditingErrorOption] = useState<ErrorDefinitionOption | null>(null);
    const [errorForm, setErrorForm] = useState({ label: '' });

    const [complaintFilters] = useState({
        complaintNumber: '', customerName: '', status: '', currentDepartmentName: ''
    });

    const fetchData = async () => {
        try {
            setLoading(true);
            const [complaintData, deptData, userData, errorData, logData] = await Promise.all([
                complaintService.getAll(),
                departmentService.getAll(),
                userService.getAll(),
                errorOptionService.getAll(),
                userActivityLogService.getAll()
            ]);
            setComplaints(complaintData);
            setDepartments(deptData);
            setUsers(userData);
            setErrorOptions(errorData);
            setActivityLogs(logData);
        } catch {
            console.error('Veriler yüklenemedi.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Actions
    const handleSaveUser = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingUser) {
                await userService.update(editingUser.id, userForm as UpdateUserRequest);
            } else {
                await userService.create(userForm as CreateUserRequest);
            }
            setIsUserModalOpen(false);
            setEditingUser(null);
            setUserForm({ name: '', email: '', password: '', role: 'User', departmentId: 2 });
            await fetchData();
        } catch { alert('İşlem başarısız.'); }
    };

    const handleEditUser = (user: User) => {
        setEditingUser(user);
        setUserForm({
            name: user.name,
            email: user.email,
            role: user.role,
            departmentId: user.departmentId,
            password: ''
        });
        setIsUserModalOpen(true);
    };

    const handleDeleteComplaint = async (id: number) => {
        if (!confirm('Bu şikayet kaydını tamamen silmek istediğinize emin misiniz?')) return;
        setIsDeleting(id);
        try {
            await complaintService.delete(id);
            await fetchData();
        } catch { alert('Hata oluştu.'); } finally { setIsDeleting(null); }
    };

    const handleUpdateComplaint = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingComplaint) return;
        try {
            await complaintService.update(editingComplaint.id, {
                ...editingComplaint,
                currentDepartmentId: departments.find(d => d.name === editingComplaint.currentDepartmentName)?.id
            });
            setEditingComplaint(null);
            await fetchData();
        } catch { alert('Hata oluştu.'); }
    };

    const handleSaveErrorOption = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingErrorOption) {
                await errorOptionService.update(editingErrorOption.id, errorForm);
            } else {
                await errorOptionService.create(errorForm);
            }
            setIsErrorModalOpen(false);
            setEditingErrorOption(null);
            setErrorForm({ label: '' });
            await fetchData();
        } catch { alert('Hata oluştu.'); }
    };

    const handleDeleteErrorOption = async (id: number) => {
        if (!confirm('Bu hata tanımını silmek istediğinize emin misiniz?')) return;
        try {
            await errorOptionService.delete(id);
            await fetchData();
        } catch { alert('Hata oluştu.'); }
    };

    const filteredComplaints = complaints.filter(c => {
        const safeMatch = (val: string | undefined | null, search: string) =>
            !search || (val && val.toLowerCase().includes(search.toLowerCase()));
        return (
            safeMatch(c.complaintNumber, complaintFilters.complaintNumber) &&
            safeMatch(c.customerName, complaintFilters.customerName) &&
            safeMatch(c.status, complaintFilters.status) &&
            safeMatch(c.currentDepartmentName, complaintFilters.currentDepartmentName)
        );
    });



    return (
        <AppLayout>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
                            <ShieldAlert className="text-red-500" size={28} />
                            Admin Yönetim Paneli
                        </h1>
                        <p className="text-slate-900 text-sm mt-1 font-medium">Sistem ayarları, kullanıcılar ve tüm kayıtların yönetimi.</p>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex bg-white rounded-xl p-1 border border-slate-200 w-fit">
                    {[
                        { id: 'complaints', icon: ClipboardList, label: 'Şikayet Yönetimi' },
                        { id: 'history', icon: History, label: 'Kullanıcı Geçmişi' },
                        { id: 'settings', icon: Settings, label: 'Sistem Ayarları' }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as 'complaints' | 'history' | 'settings')}
                            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === tab.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : 'text-slate-500 hover:text-slate-800'}`}
                        >
                            <tab.icon size={18} />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {activeTab === 'complaints' ? (
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-50 text-[10px]  font-black text-slate-900 border-b border-slate-200 tracking-wider">
                                    <tr>
                                        <th className="px-1.5 py-1.5">Şikayet No</th>
                                        <th className="px-1.5 py-1.5">Müşteri</th>
                                        <th className="px-1.5 py-1.5">Aşama</th>
                                        <th className="px-1.5 py-1.5">Durum</th>
                                        <th className="px-1.5 py-1.5 text-center">Kalite Raporu</th>
                                        <th className="px-1.5 py-1.5 text-center">Yönetim Onayı</th>
                                        <th className="px-1.5 py-1.5 text-right">İşlemler</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {loading ? (
                                        <tr><td colSpan={7} className="px-6 py-20 text-center text-slate-400">Yükleniyor...</td></tr>
                                     ) : filteredComplaints.map((c) => {
                                        const isTargetOverdue = c.status.startsWith('Açık') && c.targetDate && new Date(c.targetDate) < new Date();
                                        return (
                                            <tr key={c.id} className={`${isTargetOverdue ? 'bg-red-50/80 hover:bg-red-100/80' : 'hover:bg-slate-50/50'} transition-colors group`}>
                                            <td className="px-1.5 py-1.5 font-bold text-slate-900">{c.complaintNumber}</td>
                                            <td className="px-1.5 py-1.5 font-medium text-slate-700">{c.customerName}</td>
                                            <td className="px-1.5 py-1.5 text-[11px] font-bold text-blue-600  tracking-widest">{c.currentDepartmentName}</td>
                                            <td className="px-1.5 py-1.5">
                                                <StatusBadge status={c.status} />
                                            </td>
                                            <td className="px-1.5 py-1.5 text-center">
                                                {c.isQualityReported ? <CheckCircle2 size={16} className="text-emerald-500 mx-auto"strokeWidth={3} /> : <RotateCcw size={16} className="text-slate-300 mx-auto" strokeWidth={3} />}
                                            </td>
                                            <td className="px-1.5 py-1.5 text-center">
                                                {c.isManagementApproved === true ? <CheckCircle2 size={16} className="text-blue-500 mx-auto"strokeWidth={3} /> : c.isManagementApproved === false ? <XCircle size={16} className="text-red-500 mx-auto"strokeWidth={3} /> : <RotateCcw size={16} className="text-slate-200 mx-auto" strokeWidth={3} />}
                                            </td>
                                            <td className="px-1.5 py-1.5 text-right">
                                                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => setEditingComplaint(c)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Edit2 size={18} /></button>
                                                    <button onClick={() => handleDeleteComplaint(c.id)} disabled={isDeleting === c.id} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"><Trash2 size={18} /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : activeTab === 'history' ? (
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                            <h2 className="text-sm font-bold text-slate-900 tracking-tight">Sistem Etkinlik Kayıtları</h2>
                            <span className="text-xs font-bold text-slate-900">{activityLogs.length} Kayıt</span>
                        </div>
                        <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-50 text-[10px]  font-black text-slate-900 border-b border-slate-200 tracking-wider sticky top-0 z-10 shadow-sm">
                                    <tr>
                                        <th className="px-1.5 py-1.5">Tarih / Saat</th>
                                        <th className="px-1.5 py-1.5">Kullanıcı</th>
                                        <th className="px-1.5 py-1.5">İşlem</th>
                                        <th className="px-1.5 py-1.5">Detaylar</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {activityLogs.map((log) => (
                                        <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-1.5 py-1.5 text-slate-500 text-xs whitespace-nowrap">
                                                {new Date(log.createdAt).toLocaleString('tr-TR')}
                                            </td>
                                            <td className="px-1.5 py-1.5 font-medium text-slate-700">{log.userFullName}</td>
                                            <td className="px-1.5 py-1.5 text-blue-600 font-bold text-xs">{log.action}</td>
                                            <td className="px-1.5 py-1.5 text-slate-600 text-xs">{log.details}</td>
                                        </tr>
                                    ))}
                                    {activityLogs.length === 0 && (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-20 text-center text-slate-400">Henüz etkinlik kaydı bulunmuyor.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center">
                            <h2 className="text-lg font-bold text-slate-800">Sistem Tanımları Yönetimi</h2>
                        </div>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Hata Tanımları Kutusu */}
                            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col h-[550px]">
                                <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between rounded-t-2xl">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-black text-slate-900  tracking-widest">Tüm Hata Tanımları</span>
                                        <span className="px-2 py-0.5 rounded-full bg-slate-200 text-[10px] font-bold text-slate-600">{errorOptions.length}</span>
                                    </div>
                                    <button
                                        onClick={() => { setEditingErrorOption(null); setErrorForm({ label: '' }); setIsErrorModalOpen(true); }}
                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold shadow-sm hover:bg-emerald-700 transition-all"
                                    >
                                        <Plus size={14} /> Yeni Hata Tanımı
                                    </button>
                                </div>
                                <div className="p-2 space-y-1 flex-1 overflow-y-auto">
                                    {errorOptions.map(o => (
                                        <div key={o.id} className="group flex items-center justify-between px-3 py-2 hover:bg-slate-50 rounded-lg transition-colors border border-transparent hover:border-slate-100">
                                            <span className="text-xs font-medium text-slate-700">{o.label}</span>
                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100">
                                                <button onClick={() => { setEditingErrorOption(o); setErrorForm({ label: o.label }); setIsErrorModalOpen(true); }} className="p-1.5 text-blue-500 hover:bg-blue-100 rounded-md transition-colors"><Edit2 size={14} /></button>
                                                <button onClick={() => handleDeleteErrorOption(o.id)} className="p-1.5 text-red-500 hover:bg-red-100 rounded-md transition-colors"><Trash2 size={14} /></button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Kullanıcı Tanımları Kutusu */}
                            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col h-[550px]">
                                <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between rounded-t-2xl">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-black text-slate-900  tracking-widest">Departman Kullanıcıları</span>
                                        <span className="px-2 py-0.5 rounded-full bg-slate-200 text-[10px] font-bold text-slate-600">{users.length}</span>
                                    </div>
                                    <button
                                        onClick={() => { setIsUserModalOpen(true); setEditingUser(null); setUserForm({ name: '', email: '', password: '', role: 'User', departmentId: 2 }); }}
                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold shadow-sm hover:bg-blue-700 transition-all"
                                    >
                                        <UserPlus size={14} /> Yeni Kullanıcı
                                    </button>
                                </div>
                                <div className="p-3 flex-1 overflow-y-auto space-y-5">
                                    {departments.map(dept => {
                                        const deptUsers = users.filter(u => u.departmentId === dept.id);
                                        if (deptUsers.length === 0) return null;
                                        return (
                                            <div key={dept.id} className="space-y-2">
                                                <h3 className="text-[10px] font-black text-slate-900  tracking-widest pl-1">{dept.name} Departmanı</h3>
                                                <div className="grid grid-cols-1 gap-1.5">
                                                    {deptUsers.map(u => (
                                                        <div key={u.id} className="group flex items-center justify-between px-3 py-2 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors border border-slate-100">
                                                            <div className="flex flex-col">
                                                                <span className="text-xs font-bold text-slate-700">{u.name}</span>
                                                                <span className="text-[10px] text-slate-500">{u.email}</span>
                                                            </div>
                                                            <div className="flex items-center gap-1 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <button onClick={() => { handleEditUser(u); }} className="p-1.5 text-blue-500 hover:bg-blue-200 rounded-md transition-colors"><Edit2 size={12} /></button>
                                                                <button onClick={() => { if (confirm('Silsin mi?')) userService.delete(u.id).then(fetchData) }} className="p-1.5 text-red-500 hover:bg-red-200 rounded-md transition-colors"><Trash2 size={12} /></button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Error Option Modal */}
            {isErrorModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsErrorModalOpen(false)}></div>
                    <form onSubmit={handleSaveErrorOption} className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden">
                        <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 font-bold text-slate-800">
                            {editingErrorOption ? 'Hata Tanımını Düzenle' : 'Yeni Hata Tanımı'}
                        </div>
                        <div className="p-6 space-y-4">

                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-900  tracking-wider">Hata Tanımı</label>
                                <input required value={errorForm.label} onChange={e => setErrorForm({ ...errorForm, label: e.target.value })} className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs bg-white outline-none"placeholder="Örn: Cam Çiziği" />
                            </div>
                        </div>
                        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                            <button type="button"onClick={() => setIsErrorModalOpen(false)} className="px-4 py-2 text-sm font-bold text-slate-500">Vazgeç</button>
                            <button type="submit"className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold shadow-lg">Kaydet</button>
                        </div>
                    </form>
                </div>
            )}

            {/* Edit Complaint Modal (Accordion Style) */}
            {editingComplaint && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setEditingComplaint(null)}></div>
                    <form onSubmit={handleUpdateComplaint} className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="px-6 py-4 border-b border-slate-100 font-bold text-slate-800 bg-slate-50 flex justify-between items-center">
                            <span>Şikayet Düzenle - {editingComplaint.complaintNumber}</span>
                            <button type="button"onClick={() => setEditingComplaint(null)} className="p-1 hover:bg-slate-200 rounded-full"><XCircle size={20} /></button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {/* Accordion 1: Temel Bilgiler */}
                            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                                <button type="button"onClick={() => toggleSection('basic')} className="w-full px-4 py-3 bg-slate-50 flex items-center justify-between hover:bg-slate-100 transition-colors">
                                    <div className="flex items-center gap-2 font-black text-slate-900 text-sm">
                                        <ClipboardList size={16} className="text-blue-500" />
                                        TEMEL BİLGİLER
                                    </div>
                                    {expandedSections.basic ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                </button>
                                {expandedSections.basic && (
                                    <div className="p-4 grid grid-cols-2 gap-4 animate-in slide-in-from-top-2 duration-200">
                                        <div className="col-span-2 space-y-1">
                                            <label className="text-[10px] font-black text-slate-900  tracking-wider">Müşteri İsmi</label>
                                            <input type="text"value={editingComplaint.customerName} onChange={e => setEditingComplaint(prev => prev ? { ...prev, customerName: e.target.value } : null)} className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs font-bold text-slate-900 bg-white focus:border-blue-500 outline-none" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-slate-900  tracking-wider">Durum</label>
                                            <select value={editingComplaint.status} onChange={e => setEditingComplaint(prev => prev ? { ...prev, status: e.target.value as ComplaintStatus } : null)} className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs font-bold text-slate-900 bg-white focus:border-blue-500 outline-none">
                                                <option value="Acik">Açık</option>
                                                <option value="Kapali">Kapalı</option>
                                            </select>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-slate-900  tracking-wider">Mevcut Aşama</label>
                                            <select value={editingComplaint.currentDepartmentName} onChange={e => setEditingComplaint(prev => prev ? { ...prev, currentDepartmentName: e.target.value } : null)} className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs font-bold text-slate-900 bg-white focus:border-blue-500 outline-none">
                                                {departments.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Accordion 2: Ürün Detayları */}
                            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                                <button type="button"onClick={() => toggleSection('product')} className="w-full px-4 py-3 bg-slate-50 flex items-center justify-between hover:bg-slate-100 transition-colors">
                                    <div className="flex items-center gap-2 font-black text-slate-900 text-sm">
                                        <Settings size={16} className="text-emerald-500" />
                                        ÜRÜN VE HATA DETAYLARI
                                    </div>
                                    {expandedSections.product ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                </button>
                                {expandedSections.product && (
                                    <div className="p-4 space-y-4 animate-in slide-in-from-top-2 duration-200">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-black text-slate-900  tracking-wider">Stok Kodu</label>
                                                <input type="text"value={editingComplaint.stockCode} onChange={e => setEditingComplaint({ ...editingComplaint, stockCode: e.target.value })} className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs font-bold text-slate-900 bg-white focus:border-blue-500 outline-none" />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-black text-slate-900  tracking-wider">Hata Tanımı</label>
                                                <select value={editingComplaint.errorDefinition || ''} onChange={e => setEditingComplaint({ ...editingComplaint, errorDefinition: e.target.value })} className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs font-bold text-blue-700 bg-white focus:border-blue-500 outline-none">
                                                    <option value="">Seçiniz...</option>
                                                    {errorOptions.map(o => <option key={o.id} value={o.label}>{o.label}</option>)}
                                                </select>
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-slate-900  tracking-wider">Hata Bölümü (Notlar)</label>
                                            <textarea value={editingComplaint.errorDefinition || ''} onChange={e => setEditingComplaint({ ...editingComplaint, errorDefinition: e.target.value })} className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs font-bold text-slate-900 bg-white h-20 focus:border-blue-500 outline-none" />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Accordion 3: Rapor ve Onay */}
                            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                                <button type="button"onClick={() => toggleSection('status')} className="w-full px-4 py-3 bg-slate-50 flex items-center justify-between hover:bg-slate-100 transition-colors">
                                    <div className="flex items-center gap-2 font-black text-slate-900 text-sm">
                                        <CheckCircle2 size={16} className="text-purple-500" />
                                        RAPOR VE ONAY DURUMU
                                    </div>
                                    {expandedSections.status ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                </button>
                                {expandedSections.status && (
                                    <div className="p-4 space-y-4 animate-in slide-in-from-top-2 duration-200">
                                        <div className="flex items-center gap-8">
                                            <label className="flex items-center gap-3 cursor-pointer group">
                                                <input type="checkbox"checked={editingComplaint.isQualityReported} onChange={e => setEditingComplaint(prev => prev ? { ...prev, isQualityReported: e.target.checked } : null)} className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-black text-slate-900  tracking-tight">Kalite Raporu</span>
                                                    <span className="text-[10px] text-slate-900 font-black  tracking-widest">{editingComplaint.isQualityReported ? 'YAPILDI' : 'BEKLİYOR'}</span>
                                                </div>
                                            </label>
                                            <label className="flex items-center gap-3 cursor-pointer group">
                                                <input type="checkbox"checked={editingComplaint.isManagementApproved === true} onChange={e => setEditingComplaint(prev => prev ? { ...prev, isManagementApproved: e.target.checked } : null)} className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-black text-slate-900  tracking-tight">Yönetim Onayı</span>
                                                    <span className="text-[10px] text-slate-900 font-black  tracking-widest">{editingComplaint.isManagementApproved === true ? 'ONAYLANDI' : 'BEKLİYOR'}</span>
                                                </div>
                                            </label>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Dokümanlar */}
                            <div className="border border-slate-200 rounded-xl p-4 shadow-sm bg-slate-50/30">
                                <DocumentSection 
                                    complaintId={editingComplaint.id} 
                                    initialDocuments={editingComplaint.documents} 
                                    currentStage={editingComplaint.currentDepartmentName}
                                    onUpload={(newDoc: ComplaintDocument) => {
                                        setEditingComplaint(prev => prev ? {
                                            ...prev,
                                            documents: [...(prev.documents || []), newDoc]
                                        } : null);
                                        setComplaints(prev => prev.map(c => 
                                            c.id === editingComplaint.id 
                                            ? { ...c, documents: [...(c.documents || []), newDoc] } 
                                            : c
                                        ));
                                    }}
                                    onDelete={(docId: number) => {
                                        setEditingComplaint(prev => prev ? {
                                            ...prev,
                                            documents: prev.documents?.filter(d => d.id !== docId) || []
                                        } : null);
                                        setComplaints(prev => prev.map(c => 
                                            c.id === editingComplaint.id 
                                            ? { ...c, documents: c.documents?.filter(d => d.id !== docId) || [] } 
                                            : c
                                        ));
                                    }}
                                />
                            </div>
                        </div>

                        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                            <button type="button"onClick={() => setEditingComplaint(null)} className="px-6 py-2.5 text-xs font-bold text-slate-500  tracking-widest hover:bg-slate-200 rounded-xl transition-all">VAZGEÇ</button>
                            <button type="submit"className="px-8 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-500/30 hover:bg-blue-700 active:scale-95 transition-all  tracking-widest">DEĞİŞİKLİKLERİ KAYDET</button>
                        </div>
                    </form>
                </div>
            )}

            {/* User Edit/Create Modal */}
            {isUserModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsUserModalOpen(false)}></div>
                    <form onSubmit={handleSaveUser} className="relative bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col">
                        <div className="px-6 py-4 border-b border-slate-100 font-bold text-slate-800 bg-slate-50">
                            {editingUser ? 'Kullanıcıyı Düzenle' : 'Yeni Kullanıcı Oluştur'}
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-900  tracking-wider">İsim</label>
                                <input type="text"required value={userForm.name} onChange={e => setUserForm({ ...userForm, name: e.target.value })} className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs font-medium text-slate-900 bg-white outline-none" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-900  tracking-wider">E-posta</label>
                                <input type="email"required value={userForm.email} onChange={e => setUserForm({ ...userForm, email: e.target.value })} className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs font-medium text-slate-900 bg-white outline-none" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-900  tracking-wider">Şifre {editingUser && '(Değiştirmeyecekseniz boş bırakın)'}</label>
                                <input type="password"required={!editingUser} value={userForm.password} onChange={e => setUserForm({ ...userForm, password: e.target.value })} className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs font-medium text-slate-900 bg-white outline-none" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-900  tracking-wider">Rol</label>
                                    <select value={userForm.role} onChange={e => setUserForm({ ...userForm, role: e.target.value })} className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs font-medium text-slate-900 bg-white outline-none">
                                        <option value="Admin">Admin</option>
                                        <option value="User">User</option>
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-900  tracking-wider">Departman</label>
                                    <select value={userForm.departmentId} onChange={e => setUserForm({ ...userForm, departmentId: parseInt(e.target.value) })} className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs font-medium text-slate-900 bg-white outline-none">
                                        {departments.map(d => (
                                            <option key={d.id} value={d.id}>{d.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>
                        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                            <button type="button"onClick={() => setIsUserModalOpen(false)} className="px-4 py-2 text-sm font-bold text-slate-500 hover:bg-slate-200 rounded-lg transition-colors">Vazgeç</button>
                            <button type="submit"className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold shadow-lg shadow-blue-500/30 hover:bg-blue-700 transition-all">Kaydet</button>
                        </div>
                    </form>
                </div>
            )}

        </AppLayout>
    );
}
