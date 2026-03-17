import apiClient from './api';
import type { Department } from '@/types/department';

export const departmentService = {
    getAll: async (): Promise<Department[]> => {
        const res = await apiClient.get<Department[]>('/api/departments');
        return res.data;
    },
};
