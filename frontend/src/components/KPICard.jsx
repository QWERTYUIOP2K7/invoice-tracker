import { formatCurrency } from '../utils/currency';

export default function KPICard({ title, value, icon, color }) {
  const colorClasses = {
    blue: 'bg-blue-50 border-blue-200 text-blue-600',
    green: 'bg-green-50 border-green-200 text-green-600',
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-600',
    red: 'bg-red-50 border-red-200 text-red-600',
    purple: 'bg-purple-50 border-purple-200 text-purple-600',
  };

  const iconClasses = {
    blue: 'text-blue-600',
    green: 'text-green-600',
    yellow: 'text-yellow-600',
    red: 'text-red-600',
    purple: 'text-purple-600',
  };

  const displayValue = typeof value === 'number' && (title.includes('Outstanding') || title.includes('Assigned'))
    ? (title.includes('Outstanding') ? formatCurrency(value) : value)
    : value;

  return (
    <div className={`${colorClasses[color]} border p-6`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 mb-2">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{displayValue}</p>
        </div>
        <div className={`${iconClasses[color]} opacity-20`}>{icon}</div>
      </div>
    </div>
  );
}