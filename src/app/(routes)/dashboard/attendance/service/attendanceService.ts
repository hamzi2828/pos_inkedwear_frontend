import axios from 'axios';
import { getAuthHeader } from '@/helper/helper';
import type { CreateAttendanceData, UpdateAttendanceData } from '../types';

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

export const attendanceService = {
  // Get all attendance records with optional filters
  async getAttendances(filters?: { startDate?: string; endDate?: string; employeeId?: string }) {
    try {
      const response = await axios.get(`${API_BASE_URL}/attendance`, {
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(),
        },
        params: filters,
      });
      return response.data?.data ?? response.data ?? [];
    } catch (error) {
      console.error('Error fetching attendance records:', error);
      throw error;
    }
  },

  // Get single attendance record
  async getAttendance(attendanceId: string) {
    try {
      const response = await axios.get(`${API_BASE_URL}/attendance/${attendanceId}`, {
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(),
        },
      });
      return response.data?.data ?? response.data;
    } catch (error) {
      console.error('Error fetching attendance record:', error);
      throw error;
    }
  },

  // Create attendance record
  async createAttendance(attendanceData: CreateAttendanceData) {
    try {
      const response = await axios.post(`${API_BASE_URL}/attendance`, attendanceData, {
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(),
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error creating attendance record:', error);
      throw error;
    }
  },

  // Update attendance record
  async updateAttendance(attendanceId: string, attendanceData: UpdateAttendanceData) {
    try {
      const response = await axios.put(`${API_BASE_URL}/attendance/${attendanceId}`, attendanceData, {
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(),
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error updating attendance record:', error);
      throw error;
    }
  },

  // Delete attendance record
  async deleteAttendance(attendanceId: string) {
    try {
      const response = await axios.delete(`${API_BASE_URL}/attendance/${attendanceId}`, {
        headers: {
          ...getAuthHeader(),
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error deleting attendance record:', error);
      throw error;
    }
  },
};
