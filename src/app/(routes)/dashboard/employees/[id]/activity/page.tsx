'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, Activity, Clock, Monitor, Globe, RefreshCw, Calendar } from 'lucide-react';
import { activityLogService, ActivityLog, ActivitySummary } from '@/services/activityLogService';
import { employeeService, Employee } from '../../service/employeeService';

const moduleColors: Record<string, string> = {
  Dashboard: 'bg-blue-100 text-blue-800',
  POS: 'bg-green-100 text-green-800',
  Sales: 'bg-emerald-100 text-emerald-800',
  Products: 'bg-purple-100 text-purple-800',
  Expenses: 'bg-orange-100 text-orange-800',
  Banks: 'bg-cyan-100 text-cyan-800',
  SalesReports: 'bg-indigo-100 text-indigo-800',
  CostAnalysis: 'bg-pink-100 text-pink-800',
  Customers: 'bg-yellow-100 text-yellow-800',
  Vendors: 'bg-teal-100 text-teal-800',
  Employees: 'bg-red-100 text-red-800',
  Attendance: 'bg-lime-100 text-lime-800',
  Salary: 'bg-amber-100 text-amber-800',
  Users: 'bg-violet-100 text-violet-800',
  Roles: 'bg-fuchsia-100 text-fuchsia-800',
  Settings: 'bg-gray-100 text-gray-800',
};

const actionLabels: Record<string, string> = {
  page_visit: 'Viewed',
  create: 'Created',
  update: 'Updated',
  delete: 'Deleted',
};

export default function EmployeeActivityPage() {
  const params = useParams();
  const router = useRouter();
  const employeeId = params.id as string;

  const [employee, setEmployee] = useState<Employee | null>(null);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [summary, setSummary] = useState<ActivitySummary[]>([]);
  const [totalActivities, setTotalActivities] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'logs' | 'summary'>('logs');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [moduleFilter, setModuleFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');

  useEffect(() => {
    if (employeeId) {
      fetchData();
    }
  }, [employeeId]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    setPage(1);

    try {
      const [employeeData, logsResponse, summaryResponse] = await Promise.all([
        employeeService.getEmployee(employeeId),
        activityLogService.getEmployeeLogs(employeeId, 1, 50),
        activityLogService.getEmployeeSummary(employeeId, 30),
      ]);

      setEmployee(employeeData);
      setLogs(logsResponse.data);
      setHasMore(logsResponse.page < logsResponse.totalPages);
      setSummary(summaryResponse.summary);
      setTotalActivities(summaryResponse.totalActivities);
    } catch (err) {
      console.error('Error fetching activity data:', err);
      setError('Failed to load activity data');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const loadMore = async () => {
    if (loading || !hasMore) return;

    const nextPage = page + 1;
    setLoading(true);

    try {
      const response = await activityLogService.getEmployeeLogs(employeeId, nextPage, 50);
      setLogs(prev => [...prev, ...response.data]);
      setPage(nextPage);
      setHasMore(nextPage < response.totalPages);
    } catch (err) {
      console.error('Error loading more logs:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return formatDate(dateString);
  };

  const isWithinDateFilter = (dateString: string) => {
    if (dateFilter === 'all') return true;
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    switch (dateFilter) {
      case 'today': return diffDays === 0;
      case 'week': return diffDays <= 7;
      case 'month': return diffDays <= 30;
      default: return true;
    }
  };

  const filteredLogs = logs.filter(log => {
    const matchesModule = moduleFilter === 'all' || log.module === moduleFilter;
    const matchesDate = isWithinDateFilter(log.createdAt);
    return matchesModule && matchesDate;
  });

  const uniqueModules = [...new Set(logs.map(log => log.module))];

  if (loading && !employee) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-[#dc2626]" />
      </div>
    );
  }

  if (error && !employee) {
    return (
      <div className="space-y-6">
        <Link
          href="/dashboard/employees"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Employees
        </Link>
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="text-center">
            <p className="text-red-500 mb-4">{error}</p>
            <button
              onClick={fetchData}
              className="px-4 py-2 bg-[#dc2626] text-white rounded-lg hover:bg-[#b91c1c]"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/employees"
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Activity Log</h1>
            {employee && (
              <p className="text-sm text-gray-500">
                {employee.firstName} {employee.lastName} - {employee.position || 'Employee'}
              </p>
            )}
          </div>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-6 bg-gradient-to-r from-[#dc2626] to-[#b91c1c] rounded-lg text-white">
          <div className="flex items-center gap-3">
            <Activity className="w-8 h-8 opacity-80" />
            <div>
              <p className="text-sm font-medium opacity-80">Total Activities (30 Days)</p>
              <p className="text-3xl font-bold">{totalActivities}</p>
            </div>
          </div>
        </div>
        <div className="p-6 bg-white border border-gray-200 rounded-lg">
          <div className="flex items-center gap-3">
            <Calendar className="w-8 h-8 text-blue-500" />
            <div>
              <p className="text-sm font-medium text-gray-500">Modules Accessed</p>
              <p className="text-3xl font-bold text-gray-900">{summary.length}</p>
            </div>
          </div>
        </div>
        <div className="p-6 bg-white border border-gray-200 rounded-lg">
          <div className="flex items-center gap-3">
            <Clock className="w-8 h-8 text-green-500" />
            <div>
              <p className="text-sm font-medium text-gray-500">Last Activity</p>
              <p className="text-lg font-bold text-gray-900">
                {logs.length > 0 ? formatRelativeTime(logs[0].createdAt) : 'No activity'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab('logs')}
            className={`px-6 py-4 text-sm font-medium ${
              activeTab === 'logs'
                ? 'text-[#dc2626] border-b-2 border-[#dc2626] bg-red-50'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            Activity Logs
          </button>
          <button
            onClick={() => setActiveTab('summary')}
            className={`px-6 py-4 text-sm font-medium ${
              activeTab === 'summary'
                ? 'text-[#dc2626] border-b-2 border-[#dc2626] bg-red-50'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            Summary by Module
          </button>
        </div>

        {activeTab === 'logs' && (
          <>
            {/* Filters */}
            <div className="p-4 bg-gray-50 border-b flex flex-wrap gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Module</label>
                <select
                  value={moduleFilter}
                  onChange={(e) => setModuleFilter(e.target.value)}
                  className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#dc2626] focus:border-transparent"
                >
                  <option value="all">All Modules</option>
                  {uniqueModules.map(module => (
                    <option key={module} value={module}>{module}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Date Range</label>
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#dc2626] focus:border-transparent"
                >
                  <option value="all">All Time</option>
                  <option value="today">Today</option>
                  <option value="week">Last 7 Days</option>
                  <option value="month">Last 30 Days</option>
                </select>
              </div>
              <div className="flex items-end">
                <span className="text-sm text-gray-500">
                  Showing {filteredLogs.length} activities
                </span>
              </div>
            </div>

            {/* Logs List */}
            <div className="divide-y divide-gray-100">
              {filteredLogs.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Activity className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>No activity logs found</p>
                </div>
              ) : (
                filteredLogs.map((log) => (
                  <div
                    key={log._id}
                    className="flex items-start gap-4 p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className={`px-3 py-1.5 text-xs font-medium rounded-lg ${moduleColors[log.module] || 'bg-gray-100 text-gray-800'}`}>
                      {log.module}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-gray-900">
                          {actionLabels[log.action] || log.action}
                        </span>
                        {log.description && (
                          <span className="text-sm text-gray-600">
                            - {log.description}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500 flex-wrap">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatRelativeTime(log.createdAt)}
                        </span>
                        {log.ipAddress && (
                          <span className="flex items-center gap-1">
                            <Globe className="w-3 h-3" />
                            {log.ipAddress}
                          </span>
                        )}
                        {log.userAgent && (
                          <span className="flex items-center gap-1 truncate max-w-[250px]" title={log.userAgent}>
                            <Monitor className="w-3 h-3" />
                            {log.userAgent.split(' ')[0]}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-xs text-gray-400 shrink-0 text-right">
                      {formatDate(log.createdAt)}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Load More */}
            {hasMore && filteredLogs.length > 0 && (
              <div className="p-4 text-center border-t">
                <button
                  onClick={loadMore}
                  disabled={loading}
                  className="px-6 py-2 text-sm font-medium text-[#dc2626] hover:bg-red-50 rounded-lg disabled:opacity-50 inline-flex items-center gap-2"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  Load More Activities
                </button>
              </div>
            )}
          </>
        )}

        {activeTab === 'summary' && (
          <div className="p-6">
            {summary.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Activity className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>No activity data available</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {summary.map((item) => (
                  <div
                    key={item._id}
                    className="p-5 bg-gray-50 rounded-lg border border-gray-100 hover:border-gray-200 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className={`px-3 py-1.5 text-xs font-medium rounded-lg ${moduleColors[item._id] || 'bg-gray-100 text-gray-800'}`}>
                        {item._id}
                      </span>
                      <span className="text-3xl font-bold text-gray-900">{item.count}</span>
                    </div>
                    <p className="text-xs text-gray-500">
                      {item.count === 1 ? '1 activity' : `${item.count} activities`} in last 30 days
                    </p>
                    {item.lastAccess && (
                      <p className="text-xs text-gray-400 mt-1">
                        Last access: {formatRelativeTime(item.lastAccess)}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
