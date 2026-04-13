'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '@/services/authService';
import { useAuthStore } from '@/store/authStore';
import { Mail, Lock, AlertCircle, ArrowRight } from 'lucide-react';
import Image from 'next/image';

export default function LoginPage() {
    const router = useRouter();
    const { setToken } = useAuthStore();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const res = await authService.login({ email, password });
            setToken(res.accessToken);
            
            const currentUser = useAuthStore.getState().user;
            if (currentUser?.role === 'Admin') {
                router.push('/complaints/admin');
            } else {
                router.push('/dashboard');
            }
        } catch (err: unknown) {
            console.error('Login error:', err);
            const errorObj = err as { code?: string, response?: { status?: number } };
            if (errorObj.code === 'ERR_NETWORK' || !errorObj.response) {
                setError('Sunucuya bağlanılamadı. Lütfen backend uygulamasının çalıştığından ve internet bağlantınızdan emin olun.');
            } else if (errorObj.response?.status === 401) {
                setError('E-posta veya şifre hatalı. Lütfen bilgilerinizi kontrol edin.');
            } else {
                setError('Giriş yapılırken teknik bir sorun oluştu. (Hata: ' + (errorObj.response?.status || 'Bilinmiyor') + ')');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex">
            {/* Sol Taraf - Dekoratif Görsel ve Sistem Tanıtımı */}
            <div className="hidden lg:flex lg:w-1/2 relative bg-[#0D2E3F] overflow-hidden items-center justify-center">
                {/* Arkaplan Şekilleri (Glassmorphism & Gradient Effects) */}
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-900/20 to-[#0D2E3F]/90 z-10" />
                <div className="absolute -top-[20%] -left-[10%] w-[70%] h-[70%] rounded-full bg-blue-500/10 blur-3xl" />
                <div className="absolute -bottom-[20%] -right-[10%] w-[70%] h-[70%] rounded-full bg-transparent blur-3xl" />

                <div className="relative z-20 px-16 text-white max-w-2xl text-center">
                    <div className="mb-12 flex justify-center">
                        <div className="inline-flex items-center justify-center bg-white p-6 rounded-3xl shadow-xl border border-white/20">
                            {/* Logo Image */}
                            <Image 
                                src="/hsa-logo.png"alt="HSA Enerji Logo"width={128} height={128} className="h-24 md:h-32 w-auto object-contain"
                            />
                        </div>
                    </div>
                    <h1 className="text-4xl lg:text-5xl font-bold tracking-tight mb-6 leading-tight">
                        Müşteri Şikayetleri <br />
                        <span className="text-blue-300">Yönetim Sistemi</span>
                    </h1>
                    <p className="text-indigo-200 text-lg leading-relaxed">
                        Müşteri geri bildirimlerini hızlı, ölçülebilir ve departmanlar arası entegre bir şekilde yöneterek müşteri memnuniyetini en üst düzeye çıkarın.
                    </p>
                </div>
            </div>

            {/* Sağ Taraf - Login Formu */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 lg:p-16">
                <div className="w-full max-w-md">
                    <div className="mb-10 text-center lg:text-left">
                        <h2 className="text-3xl font-bold text-slate-900 mb-2">Hoş Geldiniz</h2>
                        <p className="text-slate-500">Sisteme giriş yapmak için bilgilerinizi girin.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 text-red-600 border border-red-100 animate-in fade-in slide-in-from-top-2">
                                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                <p className="text-sm font-medium">{error}</p>
                            </div>
                        )}

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">E-posta Adresi</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <Mail className="h-5 w-5 text-slate-400" />
                                    </div>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        placeholder="ornek@sirket.com"className="block w-full pl-11 pr-4 py-3 placeholder-slate-400 border border-slate-200 rounded-xl bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Şifre</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <Lock className="h-5 w-5 text-slate-400" />
                                    </div>
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        placeholder="••••••••"className="block w-full pl-11 pr-4 py-3 placeholder-slate-400 border border-slate-200 rounded-xl bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm"
                                    />
                                </div>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className={`group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-semibold rounded-xl text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                        >
                            {loading ? (
                                <span className="flex items-center gap-2">
                                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"fill="none"viewBox="0 0 24 24">
                                        <circle className="opacity-25"cx="12"cy="12"r="10"stroke="currentColor"strokeWidth="4" />
                                        <path className="opacity-75"fill="currentColor"d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    Giriş Yapılıyor...
                                </span>
                            ) : (
                                <span className="flex items-center gap-2 pt-[1px]">
                                    Sisteme Giriş Yap
                                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </span>
                            )}
                        </button>

                        <p className="text-center text-sm text-slate-500 mt-8">
                            Sistem erişimi veya hesap oluşturma işlemleri için <br className="hidden sm:block" />
                            <span className="font-medium text-slate-700">IT Departmanı</span> ile iletişime geçin.
                        </p>
                    </form>
                </div>
            </div>
        </div>
    );
}
