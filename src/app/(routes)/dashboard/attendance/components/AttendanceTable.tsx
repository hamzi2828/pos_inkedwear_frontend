'use client';

import { FiEdit2, FiTrash2, FiCheck, FiX } from 'react-icons/fi';
import type { Attendance } from '../types';

type Props = {
  attendances: Attendance[];
  onEdit: (attendance: Attendance) => void;
  onDelete: (attendanceId: string) => void;
  formatDate: (date: string) => string;
};

export default function AttendanceTable({
  attendances,
  onEdit,
  onDelete,
  formatDate,
}: Props) {
  return (
    <div className="overflow-hidden bg-white rounded-lg shadow">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                Employee
              </th>
              <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                Date
              </th>
              <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                Status
              </th>
              <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                Notes
              </th>
              <th className="relative px-6 py-3">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>

          <tbody className="bg-white divide-y divide-gray-200">
            {attendances.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-sm text-gray-500">
                  No attendance records found.
                </td>
              </tr>
            ) : (
              attendances.map((attendance) => (
                <tr key={attendance._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 w-10 h-10">
                        <div className="flex items-center justify-center w-10 h-10 text-white bg-[#dc2626] rounded-full">
                          {attendance.employee?.name?.charAt(0)?.toUpperCase() || 'E'}
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {attendance.employee?.name || 'Unknown'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {attendance.employee?.email || ''}
                        </div>
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {formatDate(attendance.date)}
                    </div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        attendance.status === 'present'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {attendance.status === 'present' ? (
                        <FiCheck className="w-3 h-3" />
                      ) : (
                        <FiX className="w-3 h-3" />
                      )}
                      {attendance.status === 'present' ? 'Present' : 'Absent'}
                    </span>
                  </td>

                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-500 max-w-xs truncate">
                      {attendance.notes || '-'}
                    </div>
                  </td>

                  <td className="px-6 py-4 text-sm font-medium text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => onEdit(attendance)}
                        className="text-indigo-600 hover:text-indigo-900"
                        title="Edit attendance"
                      >
                        <FiEdit2 className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => onDelete(attendance._id)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete attendance"
                      >
                        <FiTrash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
