// Şikayet tipleri

export type ComplaintStatus = 'Acik' | 'Kapali' | 'Açık: Devam ediyor' | 'Açık: Gecikerek devam ediyor' | 'Açık: Gecikti' | 'Kapalı';

export interface ComplaintDocument {
    id: number;
    fileName: string;
    fileSize: number;
    fileType: string;
    uploadedByName: string;
    uploadedAt: string;
    is8DReport: boolean;
}

export interface ComplaintBarcodeResultDto {
  id: number;
  barcode: string;
  isJustified: boolean | null;
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
  justifiedHsa1Count: number;
  justifiedHsa2Count: number;
  justifiedOtherCount: number;
  unjustifiedHsa1Count: number;
  unjustifiedHsa2Count: number;
  unjustifiedOtherCount: number;
  barcodeResults: ComplaintBarcodeResultDto[];
  documents: ComplaintDocument[];
  has8DReport?: boolean;
  hasTargetDate?: boolean;
  targetDate?: string;
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

export interface UpdateTargetDateRequest {
  hasTargetDate: boolean | null;
  targetDate?: string | null;
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
  justifiedHsa1Count?: number;
  justifiedHsa2Count?: number;
  justifiedOtherCount?: number;
  unjustifiedHsa1Count?: number;
  unjustifiedHsa2Count?: number;
  unjustifiedOtherCount?: number;
  has8DReport?: boolean;
  barcodeResults?: ComplaintBarcodeResultDto[];
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
  errorDefinition?: string;
  has8DReport?: boolean;
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
    justifiedHsa1Count?: number;
    justifiedHsa2Count?: number;
    justifiedOtherCount?: number;
    unjustifiedHsa1Count?: number;
    unjustifiedHsa2Count?: number;
    unjustifiedOtherCount?: number;
    barcodeResults?: ComplaintBarcodeResultDto[];
    has8DReport?: boolean;
}

export interface MonthlyStat {
    month: string;
    count: number;
    cumulativeCount: number;
}

export interface JustificationChartData {
    firstHalfRate: number;
    secondHalfRate: number;
    cumulativeRate: number;
}

export interface YearlyJustificationStat {
    year: number;
    rate: number;
}

export interface MonthlyJustificationRateStat {
    month: number;
    rate: number;
}

export interface BrandStat {
    brandName: string;
    complaintCount: number;
    justificationRate: number;
}

export interface ErrorStat {
    errorLabel: string;
    totalCount: number;
    brandBreakdown: BrandBreakdown[];
}

export interface BrandBreakdown {
    brandName: string;
    count: number;
}

export interface DashboardStats {
    totalComplaints: number;
    openComplaints: number;
    closedComplaints: number;
    totalJustifiedProducts: number;
    totalUnjustifiedProducts: number;
    justifiedRatio: number;
    monthlyStats: MonthlyStat[] | null;
    justificationChart: JustificationChartData;
    yearlyStats: YearlyJustificationStat[];
    monthlyJustificationStats: MonthlyJustificationRateStat[];
    brandStats: BrandStat[];
    allBrands: string[];
    errorStats: ErrorStat[];
}
