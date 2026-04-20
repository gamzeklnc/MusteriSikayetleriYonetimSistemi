import apiClient from './api';

export interface ProductionCountDto {
    id: number;
    year: number;
    month: number;
    count: number;
    hsa1Count: number | null;
    hsa2Count: number | null;
    createdAt: string;
    updatedAt: string | null;
}

export interface CreateProductionCountDto {
    year: number;
    month: number;
    hsa1Count: number | null;
    hsa2Count: number | null;
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

    upload: async (file: File, year: number): Promise<{ message: string }> => {
        const formData = new FormData();
        formData.append('file', file);
        // year param is kept for UI display but the API reads year directly from Excel column B
        const response = await apiClient.post<{ message: string }>(`/api/ProductionCounts/upload`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    }
};
