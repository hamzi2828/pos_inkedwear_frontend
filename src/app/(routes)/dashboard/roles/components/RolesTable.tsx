'use client';

import Link from 'next/link';
import { FiEdit2, FiTrash2 } from 'react-icons/fi';
import type { Role } from '../types';

type Props = {
  roles: Role[];
  onDelete: (roleId: string) => void;
  onStatusToggle: (roleId: string, isActive: boolean) => void;
  formatDate: (iso: string) => string;
};

export default function RolesTable({
  roles,
  onDelete,
  onStatusToggle,
  formatDate,
}: Props) {
  return (
    <div className="overflow-hidden bg-white rounded-lg shadow">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                Role Name
              </th>
              <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                Description
              </th>
              <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                Permissions
              </th>
              <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                Status
              </th>
              <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                Created
              </th>
              <th className="relative px-6 py-3">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>

          <tbody className="bg-white divide-y divide-gray-200">
            {roles.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-sm text-gray-500">
                  No roles found.
                </td>
              </tr>
            ) : (
              roles.map((role) => {
                const isAdminRole = role.name?.toLowerCase() === 'admin';
                return (
                <tr key={role._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 w-10 h-10">
                        <div className="flex items-center justify-center w-10 h-10 text-white bg-[#dc2626] rounded-full">
                          {role.name?.charAt(0)?.toUpperCase() || 'R'}
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {role.name}
                          {isAdminRole && (
                            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                              Protected
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-500 max-w-xs truncate">
                      {role.description || '-'}
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1 max-w-xs">
                      {role.permissions && role.permissions.length > 0 ? (
                        <>
                          {role.permissions.slice(0, 3).map((perm, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800"
                            >
                              {perm}
                            </span>
                          ))}
                          {role.permissions.length > 3 && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
                              +{role.permissions.length - 3} more
                            </span>
                          )}
                        </>
                      ) : (
                        <span className="text-sm text-gray-400">No permissions</span>
                      )}
                    </div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => !isAdminRole && onStatusToggle(role._id, !role.isActive)}
                      disabled={isAdminRole}
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        role.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      } ${isAdminRole ? 'cursor-not-allowed opacity-70' : ''}`}
                    >
                      {role.isActive ? 'Active' : 'Inactive'}
                    </button>
                  </td>

                  <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                    {formatDate(role.createdAt)}
                  </td>

                  <td className="px-6 py-4 text-sm font-medium text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-2">
                      {isAdminRole ? (
                        <span className="text-xs text-gray-400 italic">Protected</span>
                      ) : (
                        <>
                          <Link
                            href={`/dashboard/roles/${role._id}/edit`}
                            className="text-indigo-600 hover:text-indigo-900"
                            title="Edit role"
                          >
                            <FiEdit2 className="w-5 h-5" />
                          </Link>
                          <button
                            onClick={() => onDelete(role._id)}
                            className="text-red-600 hover:text-red-900"
                            title="Delete role"
                          >
                            <FiTrash2 className="w-5 h-5" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );})
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
