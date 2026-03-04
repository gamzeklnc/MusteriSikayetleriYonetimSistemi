export interface User {
    id: number;
    name: string;
    email: string;
    role: string;
    departmentId: number;
    departmentName: string;
    createdAt: string;
}

export interface LoginRequest {
    email: string;
    password: string;
}

export interface LoginResponse {
    accessToken: string;
    tokenType: string;
}
