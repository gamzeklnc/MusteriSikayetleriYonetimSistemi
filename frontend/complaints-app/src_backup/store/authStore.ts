import { create } from 'zustand';
import { jwtDecode } from 'jwt-decode';

interface DecodedToken {
    sub: string;
    email: string;
    userId?: string;
    userName?: string;
    unique_name?: string;
    name?: string;
    role: string;
    departmentId: string;
    exp: number;
}

interface UserInfo {
    id: number;
    name: string;
    email: string;
    role: string;
    departmentId: number;
}

interface AuthState {
    accessToken: string | null;
    user: UserInfo | null;
    isAuthenticated: boolean;
    setToken: (token: string) => void;
    logout: () => void;
}

const decodeToken = (token: string): UserInfo | null => {
    try {
        const decoded = jwtDecode<DecodedToken>(token);
        return {
            id: parseInt(decoded.sub),
            name: decoded.userName || decoded.unique_name || decoded.name || decoded.email.split('@')[0],
            email: decoded.email,
            role: decoded.role,
            departmentId: parseInt(decoded.departmentId)
        };
    } catch {
        return null;
    }
};

export const useAuthStore = create<AuthState>((set) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    const user = token ? decodeToken(token) : null;

    return {
        accessToken: token,
        user: user,
        isAuthenticated: !!token,

        setToken: (token: string) => {
            localStorage.setItem('accessToken', token);
            const user = decodeToken(token);
            set({ accessToken: token, user, isAuthenticated: true });
        },

        logout: () => {
            localStorage.removeItem('accessToken');
            set({ accessToken: null, user: null, isAuthenticated: false });
        },
    };
});
