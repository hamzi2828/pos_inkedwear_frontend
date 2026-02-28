'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { salaryService } from '../service/salaryService';
import { employeeService, Employee } from '../../employees/service/employeeService';
import { MONTHS } from '../types';
import type { User } from '../../users/types';

const CreateSalaryPage = () => {
  const router = useRouter();
  const [employees, setEmployees] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [employeeId, setEmployeeId] = useState<string>('');
  const [baseSalary, setBaseSalary] = useState<string>('');
  const [month, setMonth] = useState<string>(MONTHS[new Date().getMonth()]);
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [notes, setNotes] = useState<string>('');

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i + 1);

  // Fetch employees on mount
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        setLoading(true);
        const data = await employeeService.getEmployees();
        const typed: User[] = (Array.isArray(data) ? data : []).map((u: Employee) => {
          const derivedName = `${u.firstName || ''} ${u.lastName || ''}`.trim();
          const name = u.name || derivedName || '';
          return {
            _id: String(u._id),
            name,
            email: String(u.email ?? ''),
            role: u.role ?? 'user',
            isActive: typeof u.isActive === 'boolean' ? u.isActive : true,
            createdAt: String(u.createdAt ?? new Date().toISOString()),
            updatedAt: String(u.updatedAt ?? new Date().toISOString()),
          };
        });
        setEmployees(typed);
      } catch (e) {
        console.error(e);
        setError('Failed to fetch employees');
      } finally {
        setLoading(false);
      }
    };

    fetchEmployees();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!employeeId) {
      setError('Please select an employee');
      return;
    }

    const salaryNum = parseFloat(baseSalary);
    if (isNaN(salaryNum) || salaryNum <= 0) {
      setError('Please enter a valid salary amount');
      return;
    }

    setSubmitting(true);
    try {
      await salaryService.createSalary({
        employeeId,
        baseSalary: salaryNum,
        month,
        year,
        notes: notes.trim() || undefined,
      });
      router.push('/dashboard/salary');
    } catch (err) {
      console.error('Error creating salary:', err);
      setError('Failed to create salary record. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-[#dc2626]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/salary"
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Create Salary Record</h1>
          <p className="text-sm text-gray-500 mt-1">Add a new salary record for an employee</p>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white rounded-lg shadow p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Employee */}
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

            {/* Base Salary */}
            <div>
              <label htmlFor="baseSalary" className="block text-sm font-medium text-gray-700 mb-1">
                Base Salary (Rs) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                id="baseSalary"
                value={baseSalary}
                onChange={(e) => setBaseSalary(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#dc2626] focus:border-[#dc2626]"
                placeholder="Enter base salary"
                min="0"
                step="0.01"
                required
              />
            </div>

            {/* Month */}
            <div>
              <label htmlFor="month" className="block text-sm font-medium text-gray-700 mb-1">
                Month <span className="text-red-500">*</span>
              </label>
              <select
                id="month"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#dc2626] focus:border-[#dc2626]"
                required
              >
                {MONTHS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            {/* Year */}
            <div>
              <label htmlFor="year" className="block text-sm font-medium text-gray-700 mb-1">
                Year <span className="text-red-500">*</span>
              </label>
              <select
                id="year"
                value={year}
                onChange={(e) => setYear(parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#dc2626] focus:border-[#dc2626]"
                required
              >
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
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
              placeholder="Add any notes about this salary record"
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Link
              href="/dashboard/salary"
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-center"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-4 py-2 bg-[#dc2626] text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Salary Record'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateSalaryPage;
