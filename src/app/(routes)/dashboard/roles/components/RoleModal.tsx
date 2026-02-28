'use client';

import { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import type { Role, CreateRoleData } from '../types';

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

interface RoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (roleData: CreateRoleData) => Promise<void>;
  editingRole?: Role | null;
}

export default function RoleModal({ isOpen, onClose, onSubmit, editingRole }: RoleModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [permissions, setPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Populate form when editing
  useEffect(() => {
    if (editingRole) {
      setName(editingRole.name || '');
      setDescription(editingRole.description || '');
      setPermissions(editingRole.permissions || []);
    } else {
      setName('');
      setDescription('');
      setPermissions([]);
    }
    setError(null);
  }, [editingRole, isOpen]);

  if (!isOpen) return null;

  const handlePermissionToggle = (permissionKey: string) => {
    setPermissions((prev) =>
      prev.includes(permissionKey)
        ? prev.filter((p) => p !== permissionKey)
        : [...prev, permissionKey]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Role name is required');
      return;
    }

    setLoading(true);
    try {
      await onSubmit({ name: name.trim(), description: description.trim(), permissions });
      // Reset form
      setName('');
      setDescription('');
      setPermissions([]);
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to save role');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white">
          <h2 className="text-xl font-bold text-gray-900">
            {editingRole ? 'Edit Role' : 'Create New Role'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            disabled={loading}
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-100 border border-red-300 rounded-lg text-sm text-red-600">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Role Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#dc2626] focus:border-transparent"
              placeholder="e.g., Manager"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#dc2626] focus:border-transparent"
              placeholder="Brief description of this role"
              rows={3}
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Permissions
            </label>
            <div className="max-h-64 overflow-y-auto p-3 border border-gray-200 rounded-lg space-y-4">
              {PERMISSION_GROUPS.map((group) => (
                <div key={group.label}>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    {group.label}
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {group.permissions.map((permission) => (
                      <label
                        key={permission.key}
                        className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1.5 rounded"
                      >
                        <input
                          type="checkbox"
                          checked={permissions.includes(permission.key)}
                          onChange={() => handlePermissionToggle(permission.key)}
                          className="rounded border-gray-300 text-[#dc2626] focus:ring-[#dc2626]"
                          disabled={loading}
                        />
                        <span className="text-sm text-gray-700">{permission.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-2 flex gap-2">
              <button
                type="button"
                onClick={() => setPermissions(PERMISSION_GROUPS.flatMap(g => g.permissions.map(p => p.key)))}
                className="text-xs text-[#dc2626] hover:underline"
                disabled={loading}
              >
                Select All
              </button>
              <span className="text-gray-300">|</span>
              <button
                type="button"
                onClick={() => setPermissions([])}
                className="text-xs text-gray-500 hover:underline"
                disabled={loading}
              >
                Clear All
              </button>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
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
                  {editingRole ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                editingRole ? 'Update Role' : 'Create Role'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
