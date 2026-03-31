import apiClient from './api';

export interface ProductionCountDto {
    id: number;
    year: number;
    month: number;
    count: number;
    createdAt: string;
    updatedAt: string | null;
}

export interface CreateProductionCountDto {
    year: number;
    month: number;
    count: number;
}

export const productionCountService = {
    getAll: async (): Promise<ProductionCountDto[]> => {
        const response = await apiClient.get('/api/ProductionCounts');
        return response.data;
    },

    create: async (dto: CreateProductionCountDto): Promise<ProductionCountDto> => {
        const response = await apiClient.post('/api/ProductionCounts', dto);
        return response.data;
    },

    delete: async (id: number): Promise<void> => {
        await apiClient.delete(`/api/ProductionCounts/${id}`);
    },
};
