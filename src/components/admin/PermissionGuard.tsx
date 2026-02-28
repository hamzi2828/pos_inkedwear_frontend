'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { getPermissions, isAuthenticated } from '@/helper/helper';

interface PermissionGuardProps {
  children: React.ReactNode;
}

// Map routes to required permissions
const routePermissions: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/dashboard/pos': 'POS',
  '/dashboard/sales': 'Sales',
  '/dashboard/products': 'Products',
  '/dashboard/users': 'Users',
  '/dashboard/customers': 'Customers',
  '/dashboard/vendors': 'Vendors',
  '/dashboard/roles': 'Roles',
  '/dashboard/settings': 'Settings',
};

export default function PermissionGuard({ children }: PermissionGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);

  useEffect(() => {
    // Check if user is authenticated
    if (!isAuthenticated()) {
      router.replace('/authentication');
      return;
    }

    const permissions = getPermissions();

    // If no permissions set, allow all (admin or initial setup)
    if (permissions.length === 0) {
      setHasAccess(true);
      return;
    }

    // Find the required permission for current route
    // Check exact match first, then check if route starts with a known path
    let requiredPermission = routePermissions[pathname];

    if (!requiredPermission) {
      // Check if the current path starts with any known route
      for (const [route, permission] of Object.entries(routePermissions)) {
        if (pathname.startsWith(route + '/') || pathname === route) {
          requiredPermission = permission;
          break;
        }
      }
    }

    // If no permission required for this route, allow access
    if (!requiredPermission) {
      setHasAccess(true);
      return;
    }

    // Check if user has the required permission
    if (permissions.includes(requiredPermission)) {
      setHasAccess(true);
    } else {
      // Redirect to first allowed route or show access denied
      const firstAllowedRoute = Object.entries(routePermissions).find(
        ([, permission]) => permissions.includes(permission)
      );

      if (firstAllowedRoute) {
        router.replace(firstAllowedRoute[0]);
      } else {
        setHasAccess(false);
      }
    }
  }, [pathname, router]);

  // Still checking permissions
  if (hasAccess === null) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#dc2626]"></div>
      </div>
    );
  }

  // Access denied
  if (!hasAccess) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <div className="text-red-600 text-xl font-bold mb-2">Access Denied</div>
        <p className="text-gray-600">You don&apos;t have permission to access this page.</p>
      </div>
    );
  }

  return <>{children}</>;
}
