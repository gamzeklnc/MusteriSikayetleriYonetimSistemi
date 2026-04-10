'use client';

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export default function StatusBadge({ status, className = "" }: StatusBadgeProps) {
  const getStatusStyles = (status: string) => {
    // Exact mapping requested by user based on legend colors
    if (status === 'Açık/YG' || status === 'Kapalı/GT') {
      return 'bg-red-50 text-red-600 border-red-100';
    }
    if (status === 'Açık/GD') {
      return 'bg-amber-50 text-amber-600 border-amber-100';
    }
    if (status === 'Açık/ZD') {
      return 'bg-blue-50 text-blue-600 border-blue-100';
    }
    if (status === 'Kapalı/ZT') {
      return 'bg-emerald-50 text-emerald-600 border-emerald-100';
    }
    
    // Fallback for legacy data/unmapped statuses
    return 'bg-slate-50 text-slate-500 border-slate-100';
  };

  return (
    <div className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold border transition-colors ${getStatusStyles(status)} ${className}`}>
      {status}
    </div>
  );
}
