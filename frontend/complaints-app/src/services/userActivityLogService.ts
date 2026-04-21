import apiClient from './api';
import { UserActivityLogDto } from '../types/userActivityLog';

export const userActivityLogService = {
    getAll: async (): Promise<UserActivityLogDto[]> => {
        const response = await apiClient.get<UserActivityLogDto[]>('/api/UserActivityLogs');
        return response.data;
    }
};
