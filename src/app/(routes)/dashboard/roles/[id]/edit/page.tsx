'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { roleService } from '../../service/roleService';
import { FiArrowLeft } from 'react-icons/fi';
import { Loader2, AlertCircle } from 'lucide-react';
import Link from 'next/link';

const PERMISSION_GROUPS = [
  {
    label: 'Main',
    permissions: [
      { key: 'Dashboard', name: 'Dashboard' },
    ],
  },
  {
    label: 'Sales & Operations',
    permissions: [
      { key: 'POS', name: 'POS' },
      { key: 'Sales', name: 'Sales' },
      { key: 'Products', name: 'Products' },
      { key: 'Expenses', name: 'Expenses' },
    ],
  },
  {
    label: 'Finance',
    permissions: [
      { key: 'Banks', name: 'Banks' },
    ],
  },
  {
    label: 'Reporting',
    permissions: [
      { key: 'SalesReports', name: 'Sales Reports' },
      { key: 'CostAnalysis', name: 'Cost Analysis' },
    ],
  },
  {
    label: 'People',
    permissions: [
      { key: 'Customers', name: 'Customers' },
      { key: 'Vendors', name: 'Vendors' },
    ],
  },
  {
    label: 'HR & Workforce',
    permissions: [
      { key: 'Employees', name: 'Employees' },
      { key: 'Attendance', name: 'Attendance' },
      { key: 'Salary', name: 'Salary' },
    ],
  },
  {
    label: 'Administration',
    permissions: [
      { key: 'Users', name: 'Users' },
      { key: 'Roles', name: 'Roles' },
      { key: 'Settings', name: 'Settings' },
    ],
  },
];

export default function EditRolePage() {
  const router = useRouter();
  const params = useParams();
  const roleId = params.id as string;

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [permissions, setPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAdminRole, setIsAdminRole] = useState(false);

  // Fetch role data
  useEffect(() => {
    const fetchRole = async () => {
      try {
        setLoading(true);
        const role = await roleService.getRole(roleId);
        setName(role.name || '');
        setDescription(role.description || '');
        setPermissions(role.permissions || []);
        setIsAdminRole(role.name?.toLowerCase() === 'admin');
      } catch (err) {
        console.error('Error fetching role:', err);
        setError('Failed to fetch role details');
      } finally {
        setLoading(false);
      }
    };

    if (roleId) {
      fetchRole();
    }
  }, [roleId]);

  const handlePermissionToggle = (permissionKey: string) => {
    setPermissions((prev) =>
      prev.includes(permissionKey)
        ? prev.filter((p) => p !== permissionKey)
        : [...prev, permissionKey]
    );
  };

  const handleSelectAll = () => {
    setPermissions(PERMISSION_GROUPS.flatMap(g => g.permissions.map(p => p.key)));
  };

  const handleClearAll = () => {
    setPermissions([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Role name is required');
      return;
    }

    if (isAdminRole) {
      setError('Admin role cannot be modified');
      return;
    }

    setSaving(true);
    try {
      await roleService.updateRole(roleId, {
        name: name.trim(),
        description: description.trim(),
        permissions,
      });
      router.push('/dashboard/roles');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } }; message?: string };
      setError(error?.response?.data?.message || error?.message || 'Failed to update role');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-[#dc2626]" />
      </div>
    );
  }

  if (isAdminRole) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/roles"
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <FiArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Edit Role</h1>
          </div>
        </div>

        <div className="flex items-center justify-center min-h-[300px]">
          <div className="flex flex-col items-center gap-3 p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
            <AlertCircle className="w-12 h-12 text-yellow-500" />
            <h3 className="text-lg font-semibold text-yellow-800">Protected Role</h3>
            <p className="text-yellow-700 text-center">The Admin role is protected and cannot be edited.</p>
            <Link
              href="/dashboard/roles"
              className="mt-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Go Back
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/roles"
          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <FiArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Edit Role</h1>
          <p className="mt-1 text-sm text-gray-500">Update role details and permissions</p>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white rounded-lg shadow p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-3 bg-red-100 border border-red-300 rounded-lg text-sm text-red-600">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Role Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#dc2626] focus:border-transparent"
                placeholder="e.g., Manager"
                disabled={saving}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#dc2626] focus:border-transparent"
                placeholder="Brief description of this role"
                disabled={saving}
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-gray-700">
                Permissions
              </label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="text-sm text-[#dc2626] hover:underline"
                  disabled={saving}
                >
                  Select All
                </button>
                <span className="text-gray-300">|</span>
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="text-sm text-gray-500 hover:underline"
                  disabled={saving}
                >
                  Clear All
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-4 border border-gray-200 rounded-lg">
              {PERMISSION_GROUPS.map((group) => (
                <div key={group.label} className="space-y-2">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider border-b pb-2">
                    {group.label}
                  </p>
                  <div className="space-y-1">
                    {group.permissions.map((permission) => (
                      <label
                        key={permission.key}
                        className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded"
                      >
                        <input
                          type="checkbox"
                          checked={permissions.includes(permission.key)}
                          onChange={() => handlePermissionToggle(permission.key)}
                          className="rounded border-gray-300 text-[#dc2626] focus:ring-[#dc2626]"
                          disabled={saving}
                        />
                        <span className="text-sm text-gray-700">{permission.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Link
              href="/dashboard/roles"
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-[#dc2626] text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              Update Role
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
