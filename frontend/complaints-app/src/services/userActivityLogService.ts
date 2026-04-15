import axios from 'axios';
import { UserActivityLogDto } from '../types/userActivityLog';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
const API_URL = `${API_BASE_URL}/api/UserActivityLogs`;

export const userActivityLogService = {
    getAll: async (): Promise<UserActivityLogDto[]> => {
        const response = await axios.get(API_URL);
        return response.data;
    }
};
