'use client';

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export default function StatusBadge({ status, className = "" }: StatusBadgeProps) {
  const getStatusStyles = (status: string) => {
    if (!status) return 'bg-slate-50 text-slate-500 border-slate-100';
    const s = status.toLowerCase();
    if (s.startsWith('kapali/zt') || s.startsWith('kapal\u0131/zt')) {
      return 'bg-emerald-50 text-emerald-600 border-emerald-100';
    }
    if (s.startsWith('kapali/gt') || s.startsWith('kapal\u0131/gt') || s.startsWith('a\u00e7\u0131k/yg') || s.startsWith('acik/yg')) {
      return 'bg-red-50 text-red-600 border-red-100';
    }
    if (s.startsWith('a\u00e7\u0131k/gd') || s.startsWith('acik/gd')) {
      return 'bg-amber-50 text-amber-600 border-amber-100';
    }
    if (s.startsWith('a\u00e7\u0131k/zd') || s.startsWith('acik/zd') || s.startsWith('a\u00e7\u0131k') || s.startsWith('acik')) {
      return 'bg-blue-50 text-blue-600 border-blue-100';
    }
    return 'bg-slate-50 text-slate-500 border-slate-100';
  };

  return (
    <div className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold border transition-colors ${getStatusStyles(status)} ${className}`}>
      {status}
    </div>
  );
}
