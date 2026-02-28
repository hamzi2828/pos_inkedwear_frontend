export type AttendanceStatus = 'present' | 'absent';

export interface Employee {
  _id: string;
  name: string;
  email: string;
}

export interface Attendance {
  _id: string;
  employee: Employee;
  date: string;
  status: AttendanceStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RawAttendance {
  _id: string | number;
  employee?: {
    _id?: string | number;
    name?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
  };
  date?: string | Date;
  status?: AttendanceStatus;
  notes?: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface CreateAttendanceData {
  employeeId: string;
  date: string;
  status: AttendanceStatus;
  notes?: string;
}

export interface UpdateAttendanceData {
  date?: string;
  status?: AttendanceStatus;
  notes?: string;
}
