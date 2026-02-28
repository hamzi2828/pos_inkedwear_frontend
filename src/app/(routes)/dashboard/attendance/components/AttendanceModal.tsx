'use client';

import { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import type { AttendanceStatus, Attendance, CreateAttendanceData, UpdateAttendanceData } from '../types';
import type { User } from '../../users/types';

interface AttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateAttendanceData | UpdateAttendanceData) => Promise<void>;
  employees: User[];
  editingAttendance?: Attendance | null;
  loading: boolean;
}

export default function AttendanceModal({
  isOpen,
  onClose,
  onSubmit,
  employees,
  editingAttendance,
  loading,
}: AttendanceModalProps) {
  const [employeeId, setEmployeeId] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [status, setStatus] = useState<AttendanceStatus>('present');
  const [notes, setNotes] = useState<string>('');
  const [error, setError] = useState<string>('');

  const isEditMode = !!editingAttendance;

  // Reset form when modal opens or editing attendance changes
  useEffect(() => {
    if (isOpen) {
      if (editingAttendance) {
        setEmployeeId(editingAttendance.employee._id);
        setDate(editingAttendance.date.split('T')[0]);
        setStatus(editingAttendance.status);
        setNotes(editingAttendance.notes || '');
      } else {
        setEmployeeId('');
        setDate(new Date().toISOString().split('T')[0]);
        setStatus('present');
        setNotes('');
      }
      setError('');
    }
  }, [isOpen, editingAttendance]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!isEditMode && !employeeId) {
      setError('Please select an employee');
      return;
    }

    if (!date) {
      setError('Please select a date');
      return;
    }

    if (isEditMode) {
      await onSubmit({
        date,
        status,
        notes: notes.trim() || undefined,
      });
    } else {
      await onSubmit({
        employeeId,
        date,
        status,
        notes: notes.trim() || undefined,
      });
    }
  };

  const handleClose = () => {
    setEmployeeId('');
    setDate(new Date().toISOString().split('T')[0]);
    setStatus('present');
    setNotes('');
    setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">
            {isEditMode ? 'Edit Attendance' : 'Mark Attendance'}
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
            disabled={loading}
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
              {error}
            </div>
          )}

          {/* Employee */}
          {!isEditMode ? (
            <div>
              <label htmlFor="employee" className="block text-sm font-medium text-gray-700 mb-1">
                Employee <span className="text-red-500">*</span>
              </label>
              <select
                id="employee"
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#dc2626] focus:border-[#dc2626]"
                required
              >
                <option value="">Select an employee</option>
                {employees.map((emp) => (
                  <option key={emp._id} value={emp._id}>
                    {emp.name} ({emp.email})
                  </option>
                ))}
              </select>
              {employees.length === 0 && (
                <p className="text-sm text-yellow-600 mt-1">
                  No employees found. Mark users as employees first.
                </p>
              )}
            </div>
          ) : (
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500">Employee</p>
              <p className="font-medium text-gray-900">{editingAttendance?.employee.name}</p>
            </div>
          )}

          {/* Date */}
          <div>
            <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
              Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              id="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#dc2626] focus:border-[#dc2626]"
              required
            />
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="status"
                  value="present"
                  checked={status === 'present'}
                  onChange={() => setStatus('present')}
                  className="w-4 h-4 text-[#dc2626] focus:ring-[#dc2626]"
                />
                <span className="flex items-center gap-1 text-sm">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  Present
                </span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="status"
                  value="absent"
                  checked={status === 'absent'}
                  onChange={() => setStatus('absent')}
                  className="w-4 h-4 text-[#dc2626] focus:ring-[#dc2626]"
                />
                <span className="flex items-center gap-1 text-sm">
                  <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                  Absent
                </span>
              </label>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
              Notes (optional)
            </label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#dc2626] focus:border-[#dc2626]"
              placeholder="Add any notes"
              rows={3}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-[#dc2626] text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {isEditMode ? 'Saving...' : 'Marking...'}
                </>
              ) : (
                isEditMode ? 'Save Changes' : 'Mark Attendance'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
