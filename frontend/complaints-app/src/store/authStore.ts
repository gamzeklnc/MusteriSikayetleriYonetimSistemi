import { create } from 'zustand';

interface AuthState {
    accessToken: string | null;
    isAuthenticated: boolean;
    setToken: (token: string) => void;
    logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
    accessToken: typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null,
    isAuthenticated: typeof window !== 'undefined' ? !!localStorage.getItem('accessToken') : false,

    setToken: (token: string) => {
        localStorage.setItem('accessToken', token);
        set({ accessToken: token, isAuthenticated: true });
    },

    logout: () => {
        localStorage.removeItem('accessToken');
        set({ accessToken: null, isAuthenticated: false });
    },
}));
