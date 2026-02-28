import React from 'react';
import { FiShoppingCart, FiUser, FiPackage, FiDollarSign, FiAlertCircle } from 'react-icons/fi';

interface Activity {
  id: string;
  type: string;
  description: string;
  timestamp: string;
  userId?: string;
  userName?: string;
}

interface RecentActivityProps {
  activities: Activity[];
}

export const RecentActivity: React.FC<RecentActivityProps> = ({ activities }) => {
  const getActivityIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'order':
        return FiShoppingCart;
      case 'user':
        return FiUser;
      case 'product':
        return FiPackage;
      case 'payment':
        return FiDollarSign;
      default:
        return FiAlertCircle;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'order':
        return 'bg-blue-100 text-blue-600';
      case 'user':
        return 'bg-green-100 text-green-600';
      case 'product':
        return 'bg-purple-100 text-purple-600';
      case 'payment':
        return 'bg-yellow-100 text-yellow-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / 60000);

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;

    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <h2 className="mb-4 text-lg font-medium text-gray-900">Recent Activity</h2>
      <div className="space-y-4 max-h-96 overflow-y-auto">
        {activities.map((activity) => {
          const Icon = getActivityIcon(activity.type);
          return (
            <div key={activity.id} className="flex items-start hover:bg-gray-50 p-2 rounded">
              <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${getActivityColor(activity.type)}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium text-gray-900">
                  {activity.description}
                </p>
                {activity.userName && (
                  <p className="text-xs text-gray-500">by {activity.userName}</p>
                )}
                <p className="text-xs text-gray-400 mt-1">
                  {formatTime(activity.timestamp)}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};