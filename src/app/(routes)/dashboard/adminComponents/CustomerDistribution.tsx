import React from 'react';

interface CustomerDistributionProps {
  data: {
    new: number;
    returning: number;
    vip: number;
  };
}

export const CustomerDistribution: React.FC<CustomerDistributionProps> = ({ data }) => {
  const total = data.new + data.returning + data.vip;

  const segments = [
    { label: 'New Customers', value: data.new, color: 'bg-blue-500', percentage: (data.new / total) * 100 },
    { label: 'Returning Customers', value: data.returning, color: 'bg-green-500', percentage: (data.returning / total) * 100 },
    { label: 'VIP Customers', value: data.vip, color: 'bg-purple-500', percentage: (data.vip / total) * 100 },
  ];

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <h2 className="mb-4 text-lg font-medium text-gray-900">Customer Distribution</h2>

      <div className="space-y-4">
        <div className="flex h-8 overflow-hidden rounded-full bg-gray-200">
          {segments.map((segment, index) => (
            <div
              key={segment.label}
              className={`${segment.color} transition-all duration-300 hover:opacity-80`}
              style={{ width: `${segment.percentage}%` }}
              title={`${segment.label}: ${segment.value} (${segment.percentage.toFixed(1)}%)`}
            />
          ))}
        </div>

        <div className="space-y-3">
          {segments.map((segment) => (
            <div key={segment.label} className="flex items-center justify-between">
              <div className="flex items-center">
                <div className={`w-3 h-3 rounded-full ${segment.color}`} />
                <span className="ml-2 text-sm text-gray-600">{segment.label}</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-semibold text-gray-900">
                  {segment.value.toLocaleString()}
                </span>
                <span className="text-xs text-gray-500">
                  ({segment.percentage.toFixed(1)}%)
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-500">Total Customers</span>
            <span className="text-lg font-semibold text-gray-900">{total.toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
};