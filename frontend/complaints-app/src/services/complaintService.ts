import apiClient from './api';
import type {
    ComplaintDto,
    ComplaintDetailDto,
    CreateComplaintRequest,
    ChangeStatusRequest,
    TransferDepartmentRequest,
    AddNoteRequest,
    UpdateNoteRequest,
    UpdateQualityReportRequest,
    ManagementApprovalRequest,
    CustomerFeedbackRequest,
    OperationalStageRequest,
    UpdateTargetDateRequest,
    UpdateComplaintRequest,
    ComplaintDocument,
    DashboardStats
} from '@/types/complaint';

export const complaintService = {
    getDashboardStats: async (startDate?: string, endDate?: string, brand?: string, targetCustomer?: string, targetError?: string): Promise<DashboardStats> => {
        const params = new URLSearchParams();
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);
        if (brand) params.append('brand', brand);
        if (targetCustomer) params.append('targetCustomer', targetCustomer);
        if (targetError) params.append('targetError', targetError);
        
        const response = await apiClient.get<DashboardStats>(`/api/dashboard/stats?${params.toString()}`);
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

    updateNote: async (complaintId: number, noteId: number, data: UpdateNoteRequest): Promise<void> => {
        await apiClient.patch(`/api/complaints/${complaintId}/notes/${noteId}`, data);
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

    update: async (id: number, data: UpdateComplaintRequest): Promise<void> => {
        await apiClient.put(`/api/complaints/${id}`, data);
    },

    updateTargetDate: async (id: number, data: UpdateTargetDateRequest): Promise<ComplaintDto> => {
        const res = await apiClient.patch<ComplaintDto>(`/api/complaints/${id}/target-date`, data);
        return res.data;
    },

    delete: async (id: number): Promise<void> => {
        await apiClient.delete(`/api/complaints/${id}`);
    },

    uploadDocument: async (complaintId: number, file: File, is8DReport: boolean = false): Promise<ComplaintDocument> => {
        const formData = new FormData();
        formData.append('file', file);
        const res = await apiClient.post<ComplaintDocument>(`/api/complaints/${complaintId}/documents?is8DReport=${is8DReport}`, formData, {
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
    },
    
    deleteDocument: async (documentId: number): Promise<void> => {
        await apiClient.delete(`/api/complaints/documents/${documentId}`);
    },

    resetDatabase: async (): Promise<void> => {
        await apiClient.post('/api/import/clear-database');
    },

    importFromExcel: async (file: File): Promise<{message: string}> => {
        const formData = new FormData();
        formData.append('file', file);
        const res = await apiClient.post<{message: string}>('/api/import/reset-and-import', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return res.data;
    },

    importType2Excel: async (file: File): Promise<{message: string}> => {
        const formData = new FormData();
        formData.append('file', file);
        const res = await apiClient.post<{message: string}>('/api/import/import-type2', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return res.data;
    },

    importType3Excel: async (file: File): Promise<{message: string}> => {
        const formData = new FormData();
        formData.append('file', file);
        const res = await apiClient.post<{message: string}>('/api/import/import-type3', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return res.data;
    }
};
