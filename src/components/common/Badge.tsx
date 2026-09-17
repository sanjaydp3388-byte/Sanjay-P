import React from 'react';

interface BadgeProps {
  status: string;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ status, className = '' }) => {
  let colorClass = 'bg-slate-100 text-slate-700 border-slate-200';

  const normalized = status.toLowerCase().trim();

  if (normalized === 'in stock' || normalized === 'active' || normalized === 'completed' || normalized === 'normal') {
    colorClass = 'bg-emerald-50 text-emerald-700 border-emerald-200/80';
  } else if (normalized === 'low stock' || normalized === 'low stock alert' || normalized === 'pending') {
    colorClass = 'bg-amber-50 text-amber-700 border-amber-200/80';
  } else if (normalized === 'out of stock' || normalized === 'inactive' || normalized === 'cancelled') {
    colorClass = 'bg-rose-50 text-rose-700 border-rose-200/80';
  } else if (normalized === 'stock_in' || normalized === 'stock in') {
    colorClass = 'bg-blue-50 text-blue-700 border-blue-200/80';
  } else if (normalized === 'stock_out' || normalized === 'stock out') {
    colorClass = 'bg-purple-50 text-purple-700 border-purple-200/80';
  } else if (normalized === 'admin') {
    colorClass = 'bg-indigo-50 text-indigo-700 border-indigo-200/80';
  } else if (normalized === 'staff') {
    colorClass = 'bg-cyan-50 text-cyan-700 border-cyan-200/80';
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${colorClass} ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-75"></span>
      {status}
    </span>
  );
};
