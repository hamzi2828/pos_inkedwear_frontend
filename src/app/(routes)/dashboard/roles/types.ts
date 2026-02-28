export interface Role {
  _id: string;
  name: string;
  description: string;
  permissions: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RawRole {
  _id: string | number;
  name?: string;
  description?: string;
  permissions?: string[];
  isActive?: boolean;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface CreateRoleData {
  name: string;
  description: string;
  permissions: string[];
}

export interface UpdateRoleData {
  name?: string;
  description?: string;
  permissions?: string[];
  isActive?: boolean;
}
