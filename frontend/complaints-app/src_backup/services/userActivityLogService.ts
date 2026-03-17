import axios from 'axios';
import { UserActivityLogDto } from '../types/userActivityLog';

const API_URL = 'http://localhost:5000/api/UserActivityLogs';

export const userActivityLogService = {
    getAll: async (): Promise<UserActivityLogDto[]> => {
        const response = await axios.get(API_URL);
        return response.data;
    }
};
