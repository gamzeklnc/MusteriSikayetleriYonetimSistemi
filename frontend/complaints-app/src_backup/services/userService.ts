import apiClient from './api';
import type { 
    User, 
    CreateUserRequest, 
    UpdateUserRequest 
} from '@/types/user';

export const userService = {
    getAll: async (): Promise<User[]> => {
        const res = await apiClient.get<User[]>('/api/users');
        return res.data;
    },

    create: async (data: CreateUserRequest): Promise<void> => {
        await apiClient.post('/api/users', data);
    },

    update: async (id: number, data: UpdateUserRequest): Promise<void> => {
        await apiClient.put(`/api/users/${id}`, data);
    },

    delete: async (id: number): Promise<void> => {
        await apiClient.delete(`/api/users/${id}`);
    },
};
