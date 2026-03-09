'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { FiHome, FiUsers, FiPackage, FiSettings, FiCreditCard, FiShield, FiUserCheck, FiTruck, FiFileText, FiCalendar, FiBriefcase, FiDollarSign, FiPieChart } from 'react-icons/fi';
import { Building2, Receipt, ShoppingBag, HandCoins, ShoppingCart, Printer } from 'lucide-react';

// Custom PKR icon component
const PkrIcon = ({ className }: { className?: string }) => (
  <span className={`font-bold ${className}`} style={{ fontSize: '14px' }}>Rs</span>
);
import { FaTshirt } from 'react-icons/fa';
import { getPermissions, getEmployeeId } from '@/helper/helper';
import { activityLogService } from '@/services/activityLogService';

interface MenuItem {
  name: string;
  path: string;
  icon: React.ReactNode;
  permission: string;
}

interface MenuGroup {
  label: string;
  items: MenuItem[];
}

interface AdminSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AdminSidebar({ isOpen, onClose }: AdminSidebarProps) {
  const pathname = usePathname();
  const [userPermissions, setUserPermissions] = useState<string[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const permissions = getPermissions();
    setUserPermissions(permissions);
    setIsLoaded(true);
  }, []);

  // Log activity when navigating to a menu item
  const handleMenuClick = (item: MenuItem) => {
    const employeeId = getEmployeeId();
    if (employeeId) {
      activityLogService.logActivity({
        employeeId,
        action: 'page_visit',
        module: item.permission,
        description: `Visited ${item.name} page`,
        metadata: { path: item.path }
      });
    }
    onClose();
  };

  const menuGroups: MenuGroup[] = [
    {
      label: 'Main',
      items: [
        { name: 'Dashboard', path: '/dashboard', icon: <FiHome className="w-5 h-5" />, permission: 'Dashboard' },
      ]
    },
    {
      label: 'Sales & Operations',
      items: [
        { name: 'POS', path: '/dashboard/pos', icon: <FiCreditCard className="w-5 h-5" />, permission: 'POS' },
        { name: 'DTF Printing', path: '/dashboard/pos/dtf', icon: <Printer className="w-5 h-5" />, permission: 'POS' },
        { name: 'Sales', path: '/dashboard/sales', icon: <PkrIcon className="w-5 h-5" />, permission: 'Sales' },
        { name: 'Expenses', path: '/dashboard/expenses', icon: <FiFileText className="w-5 h-5" />, permission: 'Expenses' },
      ]
    },
    {
      label: 'Finance',
      items: [
        { name: 'Banks', path: '/dashboard/banks', icon: <Building2 className="w-5 h-5" />, permission: 'Banks' },
      ]
    },
    {
      label: 'Reporting',
      items: [
        { name: 'Sales Reports', path: '/dashboard/reporting/sales', icon: <FiPieChart className="w-5 h-5" />, permission: 'SalesReports' },
        { name: 'Purchase Reports', path: '/dashboard/reporting/purchases', icon: <ShoppingCart className="w-5 h-5" />, permission: 'PurchaseReports' },
        { name: 'Cost Analysis', path: '/dashboard/reporting/cost-analysis', icon: <Receipt className="w-5 h-5" />, permission: 'CostAnalysis' },
        { name: 'Receivables', path: '/dashboard/reporting/receivables', icon: <HandCoins className="w-5 h-5" />, permission: 'Receivables' },
      ]
    },
    {
      label: 'Procurement',
      items: [
        { name: 'Purchases', path: '/dashboard/purchases', icon: <ShoppingCart className="w-5 h-5" />, permission: 'Purchases' },
        { name: 'Vendors', path: '/dashboard/vendors', icon: <FiTruck className="w-5 h-5" />, permission: 'Vendors' },
      ]
    },
    {
      label: 'People',
      items: [
        { name: 'Customers', path: '/dashboard/customers', icon: <FiUserCheck className="w-5 h-5" />, permission: 'Customers' },
      ]
    },
    {
      label: 'HR & Workforce',
      items: [
        { name: 'Employees', path: '/dashboard/employees', icon: <FiBriefcase className="w-5 h-5" />, permission: 'Employees' },
        { name: 'Attendance', path: '/dashboard/attendance', icon: <FiCalendar className="w-5 h-5" />, permission: 'Attendance' },
        { name: 'Salary', path: '/dashboard/salary', icon: <PkrIcon className="w-5 h-5" />, permission: 'Salary' },
      ]
    },
    {
      label: 'Administration',
      items: [
        { name: 'Users', path: '/dashboard/users', icon: <FiUsers className="w-5 h-5" />, permission: 'Users' },
        { name: 'Roles', path: '/dashboard/roles', icon: <FiShield className="w-5 h-5" />, permission: 'Roles' },
        { name: 'Settings', path: '/dashboard/settings', icon: <FiSettings className="w-5 h-5" />, permission: 'Settings' },
      ]
    },
  ];

  // Filter menu groups based on permissions
  const filteredGroups = isLoaded
    ? menuGroups.map(group => ({
        ...group,
        items: userPermissions.length === 0
          ? group.items
          : group.items.filter(item => userPermissions.includes(item.permission))
      })).filter(group => group.items.length > 0)
    : [];

  return (
    <>
      {/* Mobile sidebar backdrop */}
      {!isOpen && (
        <div
          className="fixed inset-0 z-20 transition-opacity bg-black opacity-50 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-30 w-64 overflow-y-auto transition duration-300 transform ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } bg-white border-r border-gray-200 lg:translate-x-0 lg:static lg:inset-0 scrollbar-thin`}
        style={{
          scrollbarWidth: 'thin',
          scrollbarColor: '#d1d5db transparent'
        }}
      >
        <div className="flex items-center justify-center h-16 px-4 border-b border-gray-200">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#dc2626] rounded-lg flex items-center justify-center">
              <FaTshirt className="text-white text-sm" />
            </div>
            <span className="text-lg font-bold text-gray-900">
              Inked <span className="text-[#dc2626]">Wear</span>
            </span>
          </Link>
        </div>
        <nav className="px-3 py-4">
          {filteredGroups.map((group, groupIndex) => (
            <div key={group.label} className={groupIndex > 0 ? 'mt-4' : ''}>
              <p className="px-4 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                {group.label}
              </p>
              {group.items.map((item) => {
                // Check for exact match first, then startsWith but exclude if a more specific path exists
                const allPaths = menuGroups.flatMap(g => g.items.map(i => i.path));
                const hasMoreSpecificMatch = allPaths.some(
                  p => p !== item.path && p.startsWith(item.path) && pathname.startsWith(p)
                );
                const isActive = pathname === item.path ||
                  (item.path !== '/dashboard' && pathname.startsWith(item.path) && !hasMoreSpecificMatch);
                return (
                  <Link
                    key={item.path}
                    href={item.path}
                    className={`flex items-center px-4 py-2.5 mb-1 text-sm font-medium rounded-lg transition-colors ${
                      isActive
                        ? 'bg-[#dc2626] text-white'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                    onClick={() => handleMenuClick(item)}
                  >
                    <span className="mr-3">{item.icon}</span>
                    {item.name}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>
      </div>
    </>
  );
}
