export interface AdminUser {
  _id: string;
  name: string;
  email: string;
  role: 'admin' | 'dealer';
  isActive: boolean;
  approvalStatus?: string;
  accountStatus?: string;
  verificationStatus?: string;
  lastLoginAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AdminLoginResponseData {
  admin: AdminUser;
  token?: string;
}

export interface MeResponseData {
  user: AdminUser;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}
