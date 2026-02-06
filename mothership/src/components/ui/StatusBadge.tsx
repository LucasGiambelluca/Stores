
import { cn } from '../../lib/utils';

interface StatusBadgeProps {
  status: string;
  className?: string;
  size?: 'sm' | 'md';
}

export const StatusBadge = ({ status, className, size = 'md' }: StatusBadgeProps) => {
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
      case 'activated':
      case 'paid':
      case 'delivered':
      case 'completed':
        return 'bg-lime-500/10 text-lime-400 border-lime-500/20 shadow-[0_0_10px_rgba(132,204,22,0.1)]';
      
      case 'pending':
      case 'processing':
      case 'shipped':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20 shadow-[0_0_10px_rgba(59,130,246,0.1)]';
      
      case 'suspended':
      case 'cancelled':
      case 'revoked':
      case 'rejected':
        return 'bg-red-500/10 text-red-400 border-red-500/20 shadow-[0_0_10px_rgba(239,68,68,0.1)]';
      
      default:
        return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
  };

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-full border font-medium backdrop-blur-sm",
        size === 'sm' ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-sm",
        getStatusColor(status),
        className
      )}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-2 animate-pulse" />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};
