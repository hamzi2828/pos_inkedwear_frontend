import axios from 'axios';
import { getAuthHeader } from "@/helper/helper";

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

export interface Employee {
  _id: string;
  firstName: string;
  lastName: string;
  name: string;
  email: string;
  phone?: string;
  cnic?: string;
  position?: string;
  department?: string;
  role: string;
  salary: number;
  hireDate: string;
  dateOfBirth?: string;
  gender?: 'male' | 'female' | 'other';
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  emergencyContact?: {
    name?: string;
    phone?: string;
    relationship?: string;
  };
  bankDetails?: {
    accountTitle?: string;
    accountNumber?: string;
    bankName?: string;
  };
  notes?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEmployeeData {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  cnic?: string;
  position?: string;
  department?: string;
  salary: number;
  hireDate?: string;
  dateOfBirth?: string;
  gender?: 'male' | 'female' | 'other';
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  emergencyContact?: {
    name?: string;
    phone?: string;
    relationship?: string;
  };
  bankDetails?: {
    accountTitle?: string;
    accountNumber?: string;
    bankName?: string;
  };
  notes?: string;
}

export interface UpdateEmployeeData extends Partial<CreateEmployeeData> {
  isActive?: boolean;
}

export const employeeService = {
  // Get all employees
  async getEmployees(): Promise<Employee[]> {
    try {
      const response = await axios.get(`${API_BASE_URL}/employees`, {
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeader(),
        },
      });
      return response.data?.data ?? [];
    } catch (error) {
      console.error('Error fetching employees:', error);
      throw error;
    }
  },

  // Get single employee
  async getEmployee(employeeId: string): Promise<Employee> {
    try {
      const response = await axios.get(`${API_BASE_URL}/employees/${employeeId}`, {
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeader(),
        },
      });
      return response.data?.data;
    } catch (error) {
      console.error('Error fetching employee:', error);
      throw error;
    }
  },

  // Create employee
  async createEmployee(data: CreateEmployeeData): Promise<Employee> {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/employees`,
        data,
        {
          headers: {
            "Content-Type": "application/json",
            ...getAuthHeader(),
          },
        }
      );
      return response.data?.data;
    } catch (error) {
      console.error('Error creating employee:', error);
      throw error;
    }
  },

  // Update employee
  async updateEmployee(employeeId: string, data: UpdateEmployeeData): Promise<Employee> {
    try {
      const response = await axios.put(
        `${API_BASE_URL}/employees/${employeeId}`,
        data,
        {
          headers: {
            "Content-Type": "application/json",
            ...getAuthHeader(),
          },
        }
      );
      return response.data?.data;
    } catch (error) {
      console.error('Error updating employee:', error);
      throw error;
    }
  },

  // Update employee status
  async updateEmployeeStatus(employeeId: string, isActive: boolean): Promise<Employee> {
    try {
      const response = await axios.put(
        `${API_BASE_URL}/employees/${employeeId}/status`,
        { isActive },
        {
          headers: {
            "Content-Type": "application/json",
            ...getAuthHeader(),
          },
        }
      );
      return response.data?.data;
    } catch (error) {
      console.error('Error updating employee status:', error);
      throw error;
    }
  },

  // Delete employee
  async deleteEmployee(employeeId: string): Promise<void> {
    try {
      await axios.delete(`${API_BASE_URL}/employees/${employeeId}`, {
        headers: {
          ...getAuthHeader(),
        }
      });
    } catch (error) {
      console.error('Error deleting employee:', error);
      throw error;
    }
  },

  // Update employee role
  async updateEmployeeRole(employeeId: string, role: string): Promise<Employee> {
    try {
      const response = await axios.put(
        `${API_BASE_URL}/employees/${employeeId}/role`,
        { role },
        {
          headers: {
            "Content-Type": "application/json",
            ...getAuthHeader(),
          },
        }
      );
      return response.data?.data;
    } catch (error) {
      console.error('Error updating employee role:', error);
      throw error;
    }
  },
};
