import apiClient from './api';
import type { 
    ErrorDefinitionOption, 
    CreateErrorOptionRequest 
} from '@/types/errorOption';

export const errorOptionService = {
    getAll: async (): Promise<ErrorDefinitionOption[]> => {
        const res = await apiClient.get<ErrorDefinitionOption[]>('/api/errorOptions');
        return res.data;
    },

    create: async (data: CreateErrorOptionRequest): Promise<void> => {
        await apiClient.post('/api/errorOptions', data);
    },

    update: async (id: number, data: CreateErrorOptionRequest): Promise<void> => {
        await apiClient.put(`/api/errorOptions/${id}`, data);
    },

    delete: async (id: number): Promise<void> => {
        await apiClient.delete(`/api/errorOptions/${id}`);
    },
};
