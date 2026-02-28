'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { salaryService } from '../../service/salaryService';
import { MONTHS } from '../../types';
import type { Salary, RawSalary } from '../../types';

const EditSalaryPage = () => {
  const params = useParams();
  const router = useRouter();
  const salaryId = params.id as string;

  const [salary, setSalary] = useState<Salary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [baseSalary, setBaseSalary] = useState<string>('');
  const [month, setMonth] = useState<string>('');
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [notes, setNotes] = useState<string>('');

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i + 1);

  // Fetch salary on mount
  useEffect(() => {
    if (salaryId) {
      fetchSalary();
    }
  }, [salaryId]);

  const fetchSalary = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await salaryService.getSalary(salaryId);

      if (!data) {
        setError('Salary record not found');
        return;
      }

      const s = data as RawSalary;
      const employeeName = s.employee?.name ||
        (s.employee?.firstName && s.employee?.lastName
          ? `${s.employee.firstName} ${s.employee.lastName}`.trim()
          : 'Unknown');

      const typed: Salary = {
        _id: String(s._id),
        employee: {
          _id: String(s.employee?._id ?? ''),
          name: employeeName,
          email: String(s.employee?.email ?? ''),
        },
        baseSalary: typeof s.baseSalary === 'number' ? s.baseSalary : 0,
        month: String(s.month ?? ''),
        year: typeof s.year === 'number' ? s.year : new Date().getFullYear(),
        payments: Array.isArray(s.payments) ? s.payments : [],
        totalPaid: typeof s.totalPaid === 'number' ? s.totalPaid : 0,
        remainingBalance: typeof s.remainingBalance === 'number' ? s.remainingBalance : (s.baseSalary ?? 0),
        status: s.status ?? 'pending',
        notes: s.notes,
        createdAt: String(s.createdAt ?? new Date().toISOString()),
        updatedAt: String(s.updatedAt ?? new Date().toISOString()),
      };

      setSalary(typed);
      setBaseSalary(typed.baseSalary.toString());
      setMonth(typed.month);
      setYear(typed.year);
      setNotes(typed.notes || '');
    } catch (e) {
      console.error(e);
      setError('Failed to fetch salary record');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const salaryNum = parseFloat(baseSalary);
    if (isNaN(salaryNum) || salaryNum <= 0) {
      setError('Please enter a valid salary amount');
      return;
    }

    setSubmitting(true);
    try {
      await salaryService.updateSalary(salaryId, {
        baseSalary: salaryNum,
        month,
        year,
        notes: notes.trim() || undefined,
      });
      router.push(`/dashboard/salary/${salaryId}`);
    } catch (err) {
      console.error('Error updating salary:', err);
      setError('Failed to update salary record. Please try again.');
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

  if (error && !salary) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/salary"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Edit Salary Record</h1>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href={`/dashboard/salary/${salaryId}`}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Edit Salary Record</h1>
          <p className="text-sm text-gray-500 mt-1">
            {salary?.employee.name} - {salary?.month} {salary?.year}
          </p>
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

          {/* Employee Info (read-only) */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-500">Employee</p>
            <p className="text-lg font-semibold text-gray-900">{salary?.employee.name}</p>
            <p className="text-sm text-gray-500">{salary?.employee.email}</p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
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
              {salary && salary.totalPaid > 0 && (
                <p className="text-sm text-yellow-600 mt-1">
                  Note: Rs {salary.totalPaid.toLocaleString()} has already been paid.
                </p>
              )}
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
              href={`/dashboard/salary/${salaryId}`}
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
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditSalaryPage;
