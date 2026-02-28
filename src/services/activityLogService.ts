import axios from 'axios';
import { getAuthHeader } from '@/helper/helper';

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

export interface ActivityLog {
  _id: string;
  employee: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    position?: string;
  };
  action: string;
  module: string;
  description?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

export interface ActivitySummary {
  _id: string; // module name
  count: number;
  lastAccess?: string;
}

export interface ActivityLogResponse {
  data: ActivityLog[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  summary: ActivitySummary[];
}

export const activityLogService = {
  // Log an activity
  async logActivity(data: {
    employeeId: string;
    action: string;
    module: string;
    description?: string;
    metadata?: Record<string, unknown>;
  }): Promise<void> {
    try {
      await axios.post(
        `${API_BASE_URL}/activity-logs`,
        data,
        {
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeader(),
          },
        }
      );
    } catch (error) {
      console.error('Error logging activity:', error);
      // Don't throw - logging should be silent
    }
  },

  // Get logs for a specific employee
  async getEmployeeLogs(employeeId: string, page = 1, limit = 50): Promise<ActivityLogResponse> {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/activity-logs/employee/${employeeId}?page=${page}&limit=${limit}`,
        {
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeader(),
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching employee logs:', error);
      throw error;
    }
  },

  // Get activity summary for employee
  async getEmployeeSummary(employeeId: string, days = 30): Promise<{ summary: ActivitySummary[]; totalActivities: number; period: string }> {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/activity-logs/summary/${employeeId}?days=${days}`,
        {
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeader(),
          },
        }
      );
      return response.data.data;
    } catch (error) {
      console.error('Error fetching activity summary:', error);
      throw error;
    }
  },

  // Get all logs (admin)
  async getAllLogs(filters?: {
    employeeId?: string;
    module?: string;
    action?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
  }): Promise<ActivityLog[]> {
    try {
      const params = new URLSearchParams();
      if (filters?.employeeId) params.append('employeeId', filters.employeeId);
      if (filters?.module) params.append('module', filters.module);
      if (filters?.action) params.append('action', filters.action);
      if (filters?.startDate) params.append('startDate', filters.startDate);
      if (filters?.endDate) params.append('endDate', filters.endDate);
      if (filters?.limit) params.append('limit', filters.limit.toString());

      const response = await axios.get(
        `${API_BASE_URL}/activity-logs?${params.toString()}`,
        {
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeader(),
          },
        }
      );
      return response.data.data ?? [];
    } catch (error) {
      console.error('Error fetching all logs:', error);
      throw error;
    }
  },
};
