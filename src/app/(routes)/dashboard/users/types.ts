// UserRole is now dynamic - fetched from backend
export type UserRole = string;

export interface Role {
  _id: string;
  name: string;
  description?: string;
  permissions?: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  lastLogin?: string | null;
  createdAt: string;
  updatedAt: string;
}

// Raw user shape coming from backend before mapping to UI-safe User
export interface RawUser {
  _id: string | number;
  firstName?: string;
  lastName?: string;
  name?: string;
  email?: string;
  role?: UserRole;
  isActive?: boolean;
  lastLogin?: string | Date | null;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}
