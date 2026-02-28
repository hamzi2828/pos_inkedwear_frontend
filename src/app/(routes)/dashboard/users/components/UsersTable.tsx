import { FiTrash2, FiEdit2 } from 'react-icons/fi';
import type { User } from '../types';

type Props = {
  users: User[];
  onStatusToggle: (userId: string, isActive: boolean) => void | Promise<void>;
  onDelete: (userId: string) => void | Promise<void>;
  onEdit: (user: User) => void;
  formatDate: (iso: string) => string;
  formatLastLogin: (lastLogin?: string | null) => string;
};

export default function UsersTable({
  users,
  onStatusToggle,
  onDelete,
  onEdit,
  formatDate,
  formatLastLogin,
}: Props) {
  return (
    <div className="overflow-hidden bg-white rounded-lg shadow">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                User
              </th>
              <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                Role
              </th>
              <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                Status
              </th>
              <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                Last Login
              </th>
              <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                Joined Date
              </th>
              <th className="relative px-6 py-3">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>

          <tbody className="bg-white divide-y divide-gray-200">
            {users.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-sm text-gray-500">
                  No users found.
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 w-10 h-10">
                        <div className="flex items-center justify-center w-10 h-10 text-white bg-indigo-600 rounded-full">
                          {user.name?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{user.name}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      user.role === 'admin'
                        ? 'bg-purple-100 text-purple-800'
                        : user.role === 'moderator'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {user.role?.charAt(0).toUpperCase() + user.role?.slice(1) || 'User'}
                    </span>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => onStatusToggle(user._id, !user.isActive)}
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {user.isActive ? 'Active' : 'Inactive'}
                    </button>
                  </td>

                  <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                    {formatLastLogin(user.lastLogin)}
                  </td>

                  <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                    {formatDate(user.createdAt)}
                  </td>

                  <td className="px-6 py-4 text-sm font-medium text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => onEdit(user)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Edit user"
                      >
                        <FiEdit2 className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => onDelete(user._id)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete user"
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
