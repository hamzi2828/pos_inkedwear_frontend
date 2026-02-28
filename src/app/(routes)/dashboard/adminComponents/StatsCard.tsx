import React from 'react';
import { IconType } from 'react-icons';

interface StatsCardProps {
  name: string;
  value: string;
  icon: IconType;
  change: string;
  changeType: 'increase' | 'decrease';
  prefix?: string;
}

export const StatsCard: React.FC<StatsCardProps> = ({
  name,
  value,
  icon: Icon,
  change,
  changeType,
  prefix = ''
}) => {
  return (
    <div className="p-5 bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{name}</p>
          <div className="flex items-baseline">
            <p className="text-2xl font-semibold text-gray-900">
              {prefix}{value}
            </p>
            <span
              className={`ml-2 text-sm font-medium ${
                changeType === 'increase' ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {change}
            </span>
          </div>
        </div>
        <div className="p-3 rounded-full bg-red-100 text-[#dc2626]">
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
};