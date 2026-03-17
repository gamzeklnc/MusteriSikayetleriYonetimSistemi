import apiClient from './api';
import type {
    ComplaintDto,
    ComplaintDetailDto,
    CreateComplaintRequest,
    ChangeStatusRequest,
    TransferDepartmentRequest,
    AddNoteRequest,
    UpdateQualityReportRequest,
    ManagementApprovalRequest,
    CustomerFeedbackRequest
} from '@/types/complaint';

export const complaintService = {
    getAll: async (departmentId?: number, status?: string): Promise<ComplaintDto[]> => {
        const params: Record<string, string | number> = {};
        if (departmentId) params.departmentId = departmentId;
        if (status) params.status = status;
        const res = await apiClient.get<ComplaintDto[]>('/api/complaints', { params });
        return res.data;
    },

    getById: async (id: number): Promise<ComplaintDetailDto> => {
        const res = await apiClient.get<ComplaintDetailDto>(`/api/complaints/${id}`);
        return res.data;
    },

    create: async (data: CreateComplaintRequest): Promise<void> => {
        await apiClient.post('/api/complaints', data);
    },

    changeStatus: async (id: number, data: ChangeStatusRequest): Promise<void> => {
        await apiClient.patch(`/api/complaints/${id}/status`, data);
    },

    transfer: async (id: number, data: TransferDepartmentRequest): Promise<void> => {
        await apiClient.post(`/api/complaints/${id}/transfer`, data);
    },

    addNote: async (id: number, data: AddNoteRequest): Promise<void> => {
        await apiClient.post(`/api/complaints/${id}/notes`, data);
    },

    updateQualityReport: async (id: number, data: UpdateQualityReportRequest): Promise<void> => {
        await apiClient.patch(`/api/complaints/${id}/quality-report`, data);
    },
    
    approve: async (id: number, data: ManagementApprovalRequest): Promise<void> => {
        await apiClient.patch(`/api/complaints/${id}/management-approval`, data);
    },

    updateCustomerFeedback: async (id: number, data: CustomerFeedbackRequest): Promise<void> => {
        await apiClient.patch(`/api/complaints/${id}/customer-feedback`, data);
    },

    update: async (id: number, data: any): Promise<void> => {
        await apiClient.put(`/api/complaints/${id}`, data);
    },

    delete: async (id: number): Promise<void> => {
        await apiClient.delete(`/api/complaints/${id}`);
    }
};
