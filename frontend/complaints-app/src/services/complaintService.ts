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
    CustomerFeedbackRequest,
    OperationalStageRequest,
    ComplaintDocument,
    DashboardStats
} from '@/types/complaint';

export const complaintService = {
    getDashboardStats: async (startDate?: string, endDate?: string): Promise<DashboardStats> => {
        const params: Record<string, string> = {};
        if (startDate) params.startDate = startDate;
        if (endDate) params.endDate = endDate;
        const response = await apiClient.get('/api/dashboard/stats', { params });
        return response.data;
    },

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

    updateOperationalStage: async (id: number, data: OperationalStageRequest): Promise<ComplaintDto> => {
        const res = await apiClient.patch<ComplaintDto>(`/api/complaints/${id}/operational-stage`, data);
        return res.data;
    },

    update: async (id: number, data: any): Promise<void> => {
        await apiClient.put(`/api/complaints/${id}`, data);
    },

    delete: async (id: number): Promise<void> => {
        await apiClient.delete(`/api/complaints/${id}`);
    },

    uploadDocument: async (complaintId: number, file: File): Promise<ComplaintDocument> => {
        const formData = new FormData();
        formData.append('file', file);
        const res = await apiClient.post<ComplaintDocument>(`/api/complaints/${complaintId}/documents`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return res.data;
    },

    downloadDocument: async (documentId: number, fileName: string): Promise<void> => {
        const response = await apiClient.get(`/api/complaints/documents/${documentId}/download`, {
            responseType: 'blob'
        });
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', fileName);
        document.body.appendChild(link);
        link.click();
        link.remove();
    },

    getFileBlob: async (documentId: number): Promise<{ blob: Blob; url: string }> => {
        const response = await apiClient.get(`/api/complaints/documents/${documentId}/download`, {
            responseType: 'blob'
        });
        const blob = new Blob([response.data], { type: response.headers['content-type'] });
        const url = window.URL.createObjectURL(blob);
        return { blob, url };
    }
};
