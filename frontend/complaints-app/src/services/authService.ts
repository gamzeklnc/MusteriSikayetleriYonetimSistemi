import apiClient from './api';
import type { LoginRequest, LoginResponse } from '@/types/user';

export const authService = {
    login: async (data: LoginRequest): Promise<LoginResponse> => {
        const res = await apiClient.post<LoginResponse>('/api/auth/login', data);
        return res.data;
    },

    logout: () => {
        localStorage.removeItem('accessToken');
    },
};
