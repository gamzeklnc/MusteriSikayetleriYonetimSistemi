// Şikayet tipleri

export type ComplaintStatus = 'Acik' | 'Kapali' | 'Açık: Devam ediyor' | 'Açık: Gecikerek devam ediyor' | 'Açık: Gecikti' | 'Kapalı';

export interface ComplaintDocument {
    id: number;
    fileName: string;
    fileSize: number;
    fileType: string;
    uploadedByName: string;
    uploadedAt: string;
}

export interface ComplaintDto {
  id: number;
  complaintNumber: string; // Şikayet No
  status: ComplaintStatus;
  currentDepartmentName: string;
  customerName: string;
  projectName: string;
  projectLocation: string;
  sellerName: string;
  complaintDate: string;
  registrationDate: string;
  stockCode: string;
  barcodes: string[];
  brand?: string;
  hsa1?: number;
  hsa2?: number;
  modulePower?: string;
  defectiveQuantity: number;
  errorDefinition?: string;
  isValidComplaint?: boolean;
  lastResponseDate?: string;
  productionDate?: string;
  initialNote?: string;
  complaintYear: number;
  complaintMonth: number;
  complaintWeek: number;
  createdByName: string;
  createdAt: string;
  isQualityReported: boolean;
  qualityReportNote?: string;
  qualityReportedByName?: string;
  isManagementApproved?: boolean;
  managementApprovalNote?: string;
  managementApprovedByName?: string;
  isCustomerFeedbackDone: boolean;
  customerFeedbackNote?: string;
  customerFeedbackByName?: string;
  operationalStage?: string;
  documents: ComplaintDocument[];
}

export interface ComplaintHistoryDto {
  id: number;
  fromStatus?: string;
  toStatus?: string;
  changedByName: string;
  departmentName?: string;
  note?: string;
  changedAt: string;
}

export interface ComplaintDetailDto {
  complaint: ComplaintDto;
  history: ComplaintHistoryDto[];
}

export interface CreateComplaintRequest {
  customerName: string;
  projectName: string;
  projectLocation: string;
  sellerName: string;
  complaintDate: string;
  stockCode: string;
  barcodes?: string[];
  defectiveQuantity: number;
  hsa1?: number;
  hsa2?: number;
  note?: string;
  errorDefinition?: string;
}

export interface UpdateComplaintRequest {
  customerName: string;
  projectName: string;
  projectLocation: string;
  sellerName?: string;
  complaintDate: string;
  stockCode: string;
  barcodes?: string[];
  defectiveQuantity: number;
  brand?: string;
  hsa1?: number;
  hsa2?: number;
  modulePower?: string;
  productionDate?: string;
  errorDefinition?: string;
  isValidComplaint?: boolean;
  lastResponseDate?: string;
  status?: string;
  currentDepartmentId?: number;
  isQualityReported?: boolean;
  isManagementApproved?: boolean | null;
  operationalStage?: string;
}

export interface ChangeStatusRequest {
  status: ComplaintStatus;
  note?: string;
  departmentId?: number;
}

export interface TransferDepartmentRequest {
  targetDepartmentId: number;
  note?: string;
}

export interface AddNoteRequest {
  note: string;
  departmentId: number;
}

export interface UpdateQualityReportRequest {
  isQualityReported: boolean;
  note?: string;
}

export interface ManagementApprovalRequest {
  isApproved: boolean | null;
  note?: string;
}

export interface CustomerFeedbackRequest {
  isDone: boolean;
  note?: string;
}

export interface OperationalStageRequest {
  stage: string;
  note?: string;
}
