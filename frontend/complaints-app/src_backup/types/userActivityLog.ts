export interface UserActivityLogDto {
    id: number;
    userId: number | null;
    userFullName: string;
    action: string;
    details: string;
    createdAt: string;
}
